<template>
	<div>
		<mobile-header/>
		<div class="condition__container">
			<div class="condition">
				<div>
					<div class="condition__label">身份證:</div>
					<div class="condition__element">
						<input type="text" v-model="pid" placeholder="可使用空白分隔" />
					</div>
				</div>
				<div>
					<div class="condition__label">月份:</div>
					<div class="condition__element">
						<input
							type="number"
							placeholder="YYYMM"
							maxlength="5"
							v-model.num="month"
							onkeypress="return event.charCode >= 48 && event.charCode <= 57"
							oninput="this.value.length > this.maxLength && (this.value = this.value.slice(0, this.maxLength))"
						/>
					</div>
				</div>
				<div>
					<div class="condition__label">單位:</div>
					<div class="condition__element">
						<select v-model="dept">
							<option value="">全部</option>
							<option v-for="item in depts">{{ item }}</option>
						</select>
					</div>
				</div>
				<div style="margin-left: auto;">
					<button class="btn" @click="search_">搜尋</button>
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
						>
							<div>{{ col.name }}</div>
						</span>
					</template>
					<span v-if="authorized" class="cell action">
						<i class="fa fa-file-excel-o" :class="result.data.length ? '' : 'disabled'" @click="download_"></i>
						<i class="fa fa-floppy-o" :class="batchData.length ? '' : ' disabled'" @click="saveAll_"></i>
					</span>
				</div>
			</div>
			<div class="table-container__scroll" ref="scrollArea" :style="{ height: `calc(100vh - ${scrollHeight}px)` }">
				<div class="table" :class="table">
					<calc-row
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
				<div>
					<input
						type="text"
						v-model.num="page"
						@change="() => pager_()"
						onkeypress="return event.charCode >= 48 && event.charCode <= 57"
					/> / {{ totalPage }}
				</div>
				<div><i class="fa fa-chevron-left" @click="pager_(page - 1)"></i><i class="fa fa-chevron-right" @click="pager_(page + 1)"></i></div>
			</div>
		</div>
	</div>
</template>

<script>
	import Vue from 'vue';
	import { mapGetters, mapActions } from 'vuex';
	import { moment } from '../moment';
	import utils from "../libs/utils";

	export default {
		data() {
			return {
				table: 'calc',
				batchData: [],

				scrollHeight: 0,
				perPage: 0,
				page: 0,
				start: 0,
				end: 0,
				total: 0,
				totalPage: 0,

				pid: '',
				month: '',
				dept: '',
			};
		},
		created() {
		},
		mounted() {
			this.resetScrollHeight_();
			window.addEventListener('resize', this.resetScrollHeight_);
		},
		beforeDestroy() {
			if (this.month === '') {
				this.search({
					pid: this.pid,
					month: moment().format('YYYYMM'),
					dept: this.dept,
				});
			}
			window.removeEventListener('resize', this.resetScrollHeight_);
		},
		methods: {
			...mapActions({
				setSortBy: 'setSortBy',
				download: 'download',
				batch: 'batch',
				search: 'searchCalc',
				pager: 'pagerCalc',
			}),
			download_() {
				if (this.result.data.length) {
					this.download({ data: this.downloadData });
				}
			},
			saveAll_() {
				if (this.batchData.length) {
					Promise.all(this.batchData.map(item => item.promise())).then(res => {
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
					month: this.month ? parseInt(this.month, 10) + 191100 : '',
					dept: this.dept,
				});
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
				result: 'calc',
				sortBy: 'sortBy',
				sort: 'sort',
				displayedCols: 'calcCols',
				conditions: 'searchCalc',
				depts: 'depts',
				authorized: 'authorized',
			}),
			downloadData() {
				return this.result.data.map(item => {
					return Object.keys(item).reduce((object, key) => {
						if (['月份', '加退保日'].includes(key)) {
							object[key] = item[`${key}_f`];
						} else if (this.displayedCols.map(sub => sub.name).includes(key)) {
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
					this.month = utils.formatValue(`${this.conditions.month}`, 'month');
					this.dept = this.conditions.dept;
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