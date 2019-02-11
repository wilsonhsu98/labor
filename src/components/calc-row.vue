<template>
	<div :class="`row-grid${busy.find(item => `${item}` === `${id}`) ? ' busy' : ''}`">
		<template v-for="col in calcCols">
			<span
				:class="`cell ${col.class}${col.name === sortBy ? ' sort' : ''}${mode === 'update' ? ' edit' : ''}`"
				:data-label="col.name"
			>
				<span v-if="col.name === '加退保日'" class="date-ellipsis" v-tooltip="{ content: item[`${col.name}_f`].split(',').join('<br>'), classes: ['info'] }">
					{{ item[`${col.name}_f`] }}
				</span>
				<label v-else-if="col.name === '已收薪資'" :for="`chk_salary_${id}`">
					<input
						v-if="item['月份']"
						type="checkbox"
						:id="`chk_salary_${id}`"
						v-model="tempData[col.name]"
						:disabled="mode !== 'update'"
					/>
				</label>
				<span v-else-if="['薪資', '月份'].includes(col.name)" class="nowrap" :title="item[`${col.name}_f`]">
					{{ item[`${col.name}_f`] }}
				</span>
				<span v-else-if="['勞保個人', '勞保單位', '健保個人', '健保單位', '勞退個人', '勞退單位'].includes(col.name)" class="nowrap" :title="item[`${col.name}_f`]">
					<span>{{ item[`${col.name}_f`] }}</span>
				</span>
				<span v-else-if="col.name === '身份別'" class="nowrap" v-tooltip="{ content: item[`${col.name}_tip`], classes: ['info'] }">
					{{ item[col.name] }}
				</span>
				<span v-else-if="['身份證', '姓名'].includes(col.name)" class="nowrap" >
					{{ item[`${col.name}_f`] }}
				</span>
				<span v-else class="nowrap" :title="item[col.name]">
					{{ item[col.name] }}
				</span>
			</span>
		</template>
		<template v-if="authorized">
			<span v-if="mode === 'update'" class="cell action">
				<i class="fa fa-check" @click="validate_(id)"></i>
				<i class="fa fa-times" @click="resetRow_(true)"></i>
			</span>
			<span v-else class="cell action">
				<i v-if="item['月份']" class="fa fa-pencil-square-o" @click="updateMode_"></i>
			</span>
		</template>
	</div>
</template>

<script>
	import Vue from 'vue';
	import { mapGetters, mapActions } from 'vuex';

	export default {
		props: [
			'item',
			'id',
			'cancel'
		],
		data() {
			return {
				mode: 'normal',
				tempData: {
					'已收薪資': this.item['已收薪資'],
				},
			};
		},
		mounted() {
		},
		beforeDestroy() {
		},
		methods: {
			...mapActions({
				update_: 'update',
			}),
			resetRow_(resetData) {
				this.mode = 'normal';
				if (resetData) {
					this.tempData = { '已收薪資': this.item['已收薪資'] };
				}
				this.$emit('outbatch', { id: this.id });
			},
			updateMode_() {
				this.mode = 'update';
				this.tempData = { '已收薪資': this.item['已收薪資'] };
			},
			validate_(id, batch) {
				let salaryMonths;
				if (this.tempData['已收薪資']) {
					salaryMonths = this.item['已收薪資月份']
						.split(',')
						.concat(this.item['月份_f'])
						.filter((item, index, self) => item && self.indexOf(item) === index)
						.sort((a, b) => a - b)
						.join(',');
				} else {
					salaryMonths = this.item['已收薪資月份']
						.split(',')
						.filter(item => item && item !== this.item['月份_f'])
						.sort((a, b) => a - b)
						.join(',');
				}
				const obj = { id, data: { ...this.item, '已收薪資月份': salaryMonths }, callback: this.resetRow_ };
				if (batch) {
					return obj
				} else {
					this.update_(obj);
				}
			},
		},
		computed: {
			...mapGetters({
				sortBy: 'sortBy',
				calcCols: 'calcCols',
				busy: 'busy',
				authorized: 'authorized',
			}),
			month() {
				return this.item['月份_f'];
			},
		},
		watch: {
			mode: {
				handler() {
					switch (this.mode) {
					case 'update':
						this.$emit('inbatch', {
							id: this.id,
							promise: () => this.validate_(this.id, true),
						});
						break;
					}
				},
				immediate: true,
			},
			month() {
				this.tempData = { '已收薪資': this.item['已收薪資'] };
			},
		},
	}
</script>