<template>
	<div>
		<mobile-header/>
		<div class="condition__container">
			<div class="condition">
				<div>
					<div class="condition__label">身份證:</div>
					<div class="condition__element">
						<input type="text" v-model="pid" placeholder="可使用空白分隔"/>
					</div>
				</div>
				<div>
					<div class="condition__label">姓名:</div>
					<div class="condition__element">
						<input type="text" v-model="name" placeholder="可使用空白分隔"/>
					</div>
				</div>
				<div>
					<div class="condition__label">職稱:</div>
					<div class="condition__element">
						<select v-model="title">
							<option value="">全部</option>
							<option v-for="item in titles">{{ item }}</option>
						</select>
					</div>
				</div>
				<div style="margin-left: auto;">
					<button class="btn" @click="search_">搜尋</button>
					<label v-if="authorized" tabIndex="0" class="btn" for="import">匯入CSV</label>
					<input v-if="authorized" id="import" type="file" accept=".csv" style="display: none;" @change="importCSV_"/>
					<button v-if="authorized" :disabled="result.data.length === 0" class="btn" @click="exportCSV_">匯出CSV</button>
				</div>
			</div>
		</div>
		<div class="table-container">
			<div class="table" :class="table">
				<div class="header-row">
					<template v-for="col in displayedCols">
						<span
							:class="`cell ${col.class}${col.name === sortBy ? ` sort ${sort}` : ''}`"
							:title="col.name"
							@click="setSortBy_(col.name)"
						><div>{{ col.name }}</div></span>
					</template>
					<span v-if="authorized" class="cell action">
						<i class="fa fa-file-excel-o" :class="result.data.length ? '' : 'disabled'" @click="download_"></i>
						<i class="fa fa-plus-square" @click="insert_"></i>
						<i class="fa fa-floppy-o" :class="batchData.length ? '' : 'disabled'" @click="saveAll_"></i>
					</span>
				</div>
			</div>
			<div class="table-container__scroll" ref="scrollArea" :style="{ height: `calc(100vh - ${scrollHeight}px)` }">
				<div id="table" class="table" :class="table">
					<summary-row
						v-for="ins in insert"
						:item="ins.item"
						:id="ins.id"
						:key="`_${ins.id}`"
						:cancel="() => { cancel_(ins.id); }"
						@inbatch="inbatch_"
						@outbatch="outbatch_"
					/>
					<summary-row
						v-for="item in result.sliceData"
						:item="item"
						:id="item._id"
						:key="item._id"
						@inbatch="inbatch_"
						@outbatch="outbatch_"
					/>
				</div>
			</div>
			<div class="table-container__pagination" ref="pagination">
				<div>紀錄: {{ `${start} - ${end} / ${total}` }}</div>
				<div>每頁 <select v-model="perPage" @change="() => pager_(1)"><option v-for="num in [10, 25, 50, 100]">{{ num }}</option></select> 筆</div>
				<div><input type="text" v-model.number="page" @change="() => pager_()"/> / {{ totalPage }}</div>
				<div><i class="fa fa-chevron-left" @click="pager_(page - 1)"></i><i class="fa fa-chevron-right" @click="pager_(page + 1)"></i></div>
			</div>
		</div>
	</div>
</template>

<script>
	import Vue from 'vue';
	import { mapGetters, mapActions } from 'vuex';
	import utils from '../libs/utils';
	import { titleMapping, typeMapping } from '../libs/labor';
	import Papa from 'papaparse';
	import FileSaver from 'file-saver';
	import jschardet from 'jschardet';

	export default {
		data() {
			return {
				table: 'summary',
				insert: [],
				batchData: [],

				scrollHeight: 0,
				perPage: 0,
				page: 0,
				start: 0,
				end: 0,
				total: 0,
				totalPage: 0,

				pid: '',
				name: '',
				title: '',
			};
		},
		created() {
		},
		mounted() {
			this.resetScrollHeight_();
			window.addEventListener('resize', this.resetScrollHeight_);
		},
		beforeDestroy() {
			window.removeEventListener('resize', this.resetScrollHeight_);
		},
		methods: {
			...mapActions({
				setSortBy: 'setSortBy',
				download: 'download',
				batch: 'batch',
				search: 'searchSummary',
				pager: 'pagerSummary',
				toggleLoading: 'toggleLoading',
			}),
			insert_(item = {}, index) {
				const time = utils.toTimeStamp(new Date()) * 1000;
				const length = index || this.insert.filter(item => Math.round(item.id / 1000) === Math.round(time / 1000)).length;
				this.insert.unshift({ id: length ? time + length : time, item });
			},
			cancel_(id) {
				this.insert = this.insert.filter(item => `${item.id}` !== `${id}`);
			},
			download_() {
				if (this.result.data.length) {
					this.download({ data: this.downloadData });
				}
			},
			saveAll_() {
				if (this.batchData.length) {
					Promise.all(this.batchData.map(item => {
						return item.promise(this.batchData.map(sub => ({ id: sub.id, dates: sub.data ? sub.data['加退保日'] : '', pid: sub.data ? sub.data['身份證'] : '' })));
					})).then(res => {
						this.batch({
							data: res.filter(item => item),
							callback: (data) => {
								const ids = data.map(item => item.id);
								this.batchData = this.batchData.filter(item => !ids.includes(item.id));
							}
						});
					});
				}
			},
			inbatch_(data) {
				this.batchData = this.batchData.filter(item => item.id !== data.id);
				this.batchData.push(data);
			},
			outbatch_(data) {
				this.batchData = this.batchData.filter(item => item.id !== data.id);
			},
			search_() {
				this.search({
					pid: this.pid,
					name: this.name,
					title: this.title,
				});
			},
			importCSV_(event) {
				this.toggleLoading(true);
				const fReader = new FileReader;
				fReader.readAsDataURL(event.target.files[0]);
				fReader.onload = (evt) => {
					const data = evt.target.result;
					const encoding = ((base64Str) => {
						const str = atob(base64Str.split(';base64,')[1]);
						let encoding = jschardet.detect(str);
						encoding = encoding.encoding;
						if (encoding === 'windows-1252') {
							encoding = 'ANSI';
						}
						if (encoding === 'IBM866') {
							encoding = 'Big5';
						}
						return encoding;
					})(data);

					Papa.parse(event.target.files[0], {
						header: true,
						encoding,
						complete: (results) => {
							results.data.reverse().forEach((item, index) => {
								item['身份證'] && this.insert_({
									...item,
									'職稱': titleMapping[item['職稱']],
									'身份別': typeMapping[item['身份別']],
								}, index);
							});
							event.target.value = '';
							this.toggleLoading(false);
						},
					});
				};
			},
			exportCSV_() {
				const csv = Papa.unparse(this.downloadData);
				const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
				FileSaver.saveAs(blob, 'labor.csv');
			},
			resetScrollHeight_() {
				const { top } = this.$refs['scrollArea'].getBoundingClientRect();
				const { height } = this.$refs['pagination'].getBoundingClientRect();
				if (window.innerWidth < 761) {
					this.scrollHeight = top + height + 70;
				} else {
					this.scrollHeight = top + height + 20;
				}
			},
			pager_(page) {
				this.pager({
					perPage: this.perPage,
					page: page || this.page,
				});
				Vue.nextTick().then(() => {
					this.$refs['scrollArea'].scrollTop = 0;
				});
			},
			setSortBy_(col) {
				this.setSortBy(col);
				this.pager_(1);
			},
		},
		computed: {
			...mapGetters({
				result: 'summary',
				sortBy: 'sortBy',
				sort: 'sort',
				displayedCols: 'displayedCols',
				conditions: 'searchSummary',
				titles: 'titles',
				authorized: 'authorized',
			}),
			downloadData() {
				return this.result.data.map(item => {
					return Object.keys(item).reduce((object, key) => {
						if (this.displayedCols.map(sub => sub.name).includes(key)) {
							object[key] = item[key];
						}
						return object;
					}, {});
				});
			},
		},
		watch: {
			conditions: {
				handler() {
					this.pid = this.conditions.pid;
					this.name = this.conditions.name;
					this.title = this.conditions.title;
					this.perPage = this.conditions.perPage;
					this.page = this.conditions.page;
				},
				immediate: true,
			},
			result: {
				handler() {
					this.start = this.result.start;
					this.end = this.result.end;
					this.total = this.result.total;
					this.totalPage = this.result.totalPage;
					this.page = this.result.page;
				},
				immediate: true,
			},
		},
	}
</script>