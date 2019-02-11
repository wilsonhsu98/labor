<template>
	<div>
		<mobile-header/>
		<div class="condition__container">
			<div class="condition">
				<div class="condition__report">
					<div class="condition__label">日期:</div>
					<div class="condition__element">
						<input
							type="number"
							placeholder="YYYMMDD"
							maxlength="7"
							v-model.num="date"
							onkeypress="return event.charCode >= 48 && event.charCode <= 57"
							oninput="this.value.length > this.maxLength && (this.value = this.value.slice(0, this.maxLength))"
						/>
					</div>
				</div>
				<div class="condition__report">
					<div class="condition__label">職稱:</div>
					<div class="condition__element">
						<label for="chk_all" >
							<input
								type="checkbox"
								id="chk_all"
								:checked="checkAll"
								@change="checkAll_($event.target.checked)"
							/>全選
						</label><!--
						 --><label :for="`rdo_type_${t}`" v-for="t in titleArr">
							<input
								type="checkbox"
								:id="`rdo_type_${t}`"
								:value="t"
								v-model="titles"
							/>{{ t }}
						</label>
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
							@click="setSortBy(col.name)"
						>
							<div>{{ col.name }}</div>
						</span>
					</template>
					<span class="cell action">
						<i class="fa fa-file-text-o" :class="result.length ? '' : 'disabled'" @click="download_"></i>
					</span>
				</div>
			</div>
			<div class="table-container__scroll" ref="scrollArea" :style="{ maxHeight: `calc(100vh - ${scrollHeight}px)` }">
				<div class="table" :class="table">
					<div class="row-grid" v-for="tempData in result">
						<template v-for="col in displayedCols">
							<span
								:class="`cell ${col.class}${col.name === sortBy ? ' sort' : ''}`"
								:data-label="col.name"
							>
								<span v-if="formatCols.includes(col.name)" class="nowrap" :title="tempData[`${col.name}_f`]">
									<span>{{ tempData[`${col.name}_f`] }}</span>
								</span>
								<span v-else class="nowrap" :title="tempData[col.name]">
									{{ tempData[col.name]  }}
								</span>
							</span>
						</template>
						<span class="cell action"></span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import { mapGetters, mapActions } from 'vuex';
	import { dateToRoc, rocToDate, formatValue } from '../libs/utils';
	import utils from "../libs/utils";
	import { moment } from '../moment';

	export default {
		data() {
			return {
				table: 'media',
				date: '',
				titles: [],
				formatCols: [
					'勞保投保金額', '健保投保金額', '勞退投保金額',
					'機關勞保', '機關健保', '機關勞退', '機關職災',
					'自付勞保', '自付健保', '自付勞退',
					'出生日期',
					'職災'
				],
				scrollHeight: 0,
			};
		},
		created() {
		},
		mounted() {
			this.resetScrollHeight_();
			window.addEventListener('resize', this.resetScrollHeight_);
		},
		beforeDestroy() {
			this.search({
				date: moment().format('YYYYMMDD'),
				titles: this.titles.join(','),
			});
			window.removeEventListener('resize', this.resetScrollHeight_);
		},
		methods: {
			...mapActions({
				setSortBy: 'setSortBy',
				download: 'download',
				search: 'searchToday',
			}),
			download_() {
				// if (this.result.length) {
				// 	this.download({ data: this.downloadData });
				// }
			},
			search_() {
				this.search({
					date: this.date ? parseInt(this.date, 10) + 19110000 : '',
					titles: this.titles.join(','),
				});
			},
			checkAll_(bool) {
				if (bool) {
					this.titles = this.titleArr;
				} else {
					this.titles = [];
				}
			},
			resetScrollHeight_() {
				const { top } = this.$refs['scrollArea'].getBoundingClientRect();
				if (window.innerWidth < 761) {
					this.scrollHeight = top + 70;
				} else {
					this.scrollHeight = top + 20;
				}
			},
		},
		computed: {
			...mapGetters({
				result: 'today',
				sortBy: 'sortBy',
				sort: 'sort',
				displayedCols: 'todayCols',
				titleArr: 'titles',
				condistions: 'searchToday',
			}),
			downloadData() {
				// return this.result.map(item => {
				// 	return Object.keys(item).reduce((object, key) => {
				// 		if (this.displayedCols.map(sub => sub.name).includes(key)) {
				// 			object[key] = item[key];
				// 		}
				// 		return object;
				// 	}, {});
				// });
			},
			checkAll() {
				return this.titleArr.every(title => this.titles.includes(title));
			},
		},
		watch: {
			condistions: {
				handler() {
					this.date = formatValue(this.condistions.date, 'date');
					this.titles = this.condistions.titles ? this.condistions.titles.split(',') : [];
				},
				immediate: true,
			},
		},
	}
</script>