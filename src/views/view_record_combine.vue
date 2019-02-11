<template>
	<div>
		<mobile-header/>
		<div class="condition__container">
			<div class="condition">
				<div class="condition__report">
					<div class="condition__label">月份:</div>
					<div class="condition__element">
						<label :for="`rdo_month_${m.value}`" v-for="m in monthArr">
							<input
								type="radio"
								name="rdo_month"
								:id="`rdo_month_${m.value}`"
								:value="m.value"
								v-model="month"
							/>{{ m.display }}
						</label>
					</div>
				</div>
				<div class="condition__report">
					<div class="condition__label">報表類型:</div>
					<div class="condition__element">
						<label for="rdo_type_share" >
							<input
								type="radio"
								name="rdo_type"
								id="rdo_type_share"
								value="分攤表"
								v-model="type"
							/>分攤表
						</label><!--
						 --><label :for="`rdo_type_${t}`" v-for="t in titleArr">
							<input
								type="radio"
								name="rdo_type"
								:id="`rdo_type_${t}`"
								:value="t"
								v-model="type"
							/>{{ t }}
						</label><!--
						 --><label for="rdo_type_first" >
							<input
								type="radio"
								name="rdo_type"
								id="rdo_type_first"
								value="每月一日在保"
								v-model="type"
							/>每月一日在保
						</label><!--
						 --><label for="rdo_type_count" >
							<input
								type="radio"
								name="rdo_type"
								id="rdo_type_count"
								value="人數通報"
								v-model="type"
							/>人數通報
						</label>
					</div>
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
						<i v-if="authorized" class="fa fa-file-excel-o" :class="result.length ? '' : 'disabled'" @click="download_"></i>
					</span>
				</div>
			</div>
			<div class="table-container__scroll" ref="scrollArea" :style="{ maxHeight: `calc(100vh - ${scrollHeight}px)` }">
				<div class="table" :class="table">
					<div class="row-grid" v-for="(tempData, i) in result">
						<template v-if="i === result.length - 1 && (tempData['項目'] === '加總' || tempData['姓名'] === '加總')">
							<span
								v-for="col in displayedCols"
								class="cell footer"
								:class="`${col.class}${col.name === sortBy ? ' sort' : ''}`"
								:data-label="col.name"
							>
								<span class="nowrap" v-if="formatCols.includes(col.name)" :title="tempData[`${col.name}_f`]">
									<span>{{ tempData[`${col.name}_f`] }}</span>
								</span>
								<span v-else>
									{{ tempData[col.name]  }}
								</span>
							</span>
							<span class="cell footer-bg"></span>
						</template>
						<template v-else>
							<span
								v-for="col in displayedCols"
								:class="`cell ${col.class}${col.name === sortBy ? ' sort' : ''}`"
								:data-label="col.name"
							>
								<span v-if="formatCols.includes(col.name)" class="nowrap" :title="tempData[`${col.name}_f`]">
									<span>{{ tempData[`${col.name}_f`] }}</span>
								</span>
								<span v-else-if="['身份證號', '姓名'].includes(col.name)" class="nowrap" >
									{{ tempData[`${col.name}_f`] }}
								</span>
								<span v-else class="nowrap" :title="tempData[col.name]">
									{{ tempData[col.name]  }}
								</span>
							</span>
							<span class="cell action"></span>
						</template>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import Vue from 'vue';
	import { mapGetters, mapActions } from 'vuex';
	import { formatValue } from '../libs/utils';
	import utils from "../libs/utils";
	import { moment } from '../moment';

	export default {
		data() {
			return {
				table: 'combine',
				monthArr: Array.from(moment.range(moment().subtract(2, 'months'), moment()).by('months'))
					.map(m => m.format('YYYYMM'))
					.sort((a, b) => b - a)
					.map((m, i) => ({ value: m, display: `${['本月', '上個月', '上2個月'][i]}${utils.formatValue(m, 'month')}` })),
				month: '',
				type: '',
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
			window.removeEventListener('resize', this.resetScrollHeight_);
		},
		methods: {
			...mapActions({
				setSortBy: 'setSortBy',
				download: 'download',
				search: 'searchCombine',
			}),
			download_() {
				if (this.result.length) {
					this.download({ data: this.downloadData });
				}
			},
			search_() {
				this.search({
					month: this.month ? parseInt(this.month, 10) : '',
					type: this.type,
				});
				Vue.nextTick().then(() => {
					this.$refs['scrollArea'].scrollTop = 0;
				});
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
				result: 'combine',
				sortBy: 'sortBy',
				sort: 'sort',
				displayedCols: 'combineCols',
				titleArr: 'titles',
				conditions: 'searchCombine',
				authorized: 'authorized',
			}),
			downloadData() {
				return this.result.map(item => {
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
			month() {
				this.search_();
			},
			type() {
				this.search_();
			},
			search: {
				handler() {
					this.month = this.conditions.month;
					this.type = this.conditions.type;
				},
				immediate: true,
			},
		},
	}
</script>