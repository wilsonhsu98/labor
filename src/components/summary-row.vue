<template>
	<div :class="`row-grid${busy.find(item => `${item}` === `${id}`) ? ' busy' : ''}`">
		<template v-for="col in displayedCols">
			<span
				v-if="['insert', 'update'].includes(mode)"
				:class="`cell ${col.class}${col.name === sortBy ? ' sort' : ''} edit`"
				:data-label="col.name"
			>
				<select v-if="col.name === '籍別'" v-model="tempData[col.name]">
					<option value="本國">本國</option>
					<option value="外籍">外籍</option>
					<option value="外配">外配</option>
					<option value="陸配">陸配</option>
				</select>
				<input
					v-else-if="col.name === '身份證'"
					type="text"
					:placeholder="tempData['籍別'] === '本國' ? '身份證' : '居留證'"
					:class="`${col.class}${errorFind_(col.name) ? ' error': ''}`"
					v-tooltip="(errorFind_(col.name) || {}).msg"
					v-model="tempData[col.name]"
					oninput="this.value = this.value.toUpperCase()"
				/>
				<span v-else-if="col.name === '性別'" class="nowrap">
					{{ tempData[col.name] }}
				</span>
				<input
					v-else-if="col.name === '生日'"
					type="number"
					placeholder="YYYMMDD"
					maxlength="7"
					:class="`number ${col.class}${errorFind_(col.name) ? ' error': ''}`"
					v-tooltip="(errorFind_(col.name) || {}).msg"
					v-model.num="tempData[col.name]"
					onkeypress="return event.charCode >= 48 && event.charCode <= 57"
					oninput="this.value.length > this.maxLength && (this.value = this.value.slice(0, this.maxLength))"
				/>
				<v-select v-else-if="col.name === '單位'" v-model="tempData[col.name]" :options="depts" taggable></v-select>
				<v-select v-else-if="col.name === '職稱'" v-model="tempData[col.name]" :options="titles" taggable></v-select>
				<input
					v-else-if="col.name === '勞退'"
					type="text"
					:class="`number ${col.class}${errorFind_(col.name) ? ' error': ''}`"
					v-tooltip="(errorFind_(col.name) || {}).msg"
					v-model="tempData[col.name]"
					@keypress="isNumber_"
					oninput="if (parseInt(this.value, 10) < -1) { this.value = -1; } else if (parseInt(this.value, 10) > 6) { this.value = 6; }"
				/>
				<label v-else-if="['健保', '職災', '不檢誤'].includes(col.name)" :for="`chk_${col.class}_${id}`">
					<input
						type="checkbox"
						:id="`chk_${col.class}_${id}`"
						v-model="tempData[col.name]"
						true-value="y"
						false-value="n"
					/>
				</label>
				<vue-tags-input
					v-else-if="col.name === '身份別'"
					v-model="tag"
					placeholder=""
					:max-tags="5"
					:add-only-from-autocomplete="true"
					:autocomplete-filter-duplicates="false"
					:avoid-adding-duplicates="false"
					:is-duplicate="() => false"
					:autocomplete-items="[
						{ text: '一般' },
						{ text: '輕度' },
						{ text: '中度' },
						{ text: '重度' },
						{ text: '北市長者' },
						{ text: '北市原55' },
						{ text: '中低70歲' },
						{ text: '離島65' }
					]"
					:autocomplete-always-open="openTagComplete"
					:tags="tempData[col.name] ? tempData[col.name].split(',').filter(item => item).map(item => ({ text: item })) : []"
					@tags-changed="newTags => {
						tempData[col.name] = newTags.filter(item => item.text).map(item => item.text).join(',');
						openTagComplete = false;
					}"
					@focus="() => {
						if (tempData[col.name].split(',').filter(item => item).length < 5) {
							openTagComplete = true;
						}
					}"
					@blur="blurTagsInput_"
				/>
				<input
					v-else-if="['薪資', '工時'].includes(col.name)"
					type="number"
					:maxlength="col.name === '薪資' ? 6 : 2"
					:class="`number ${col.class}${errorFind_(col.name) ? ' error': ''}`"
					v-tooltip="(errorFind_(col.name) || {}).msg"
					v-model.num="tempData[col.name]"
					onkeypress="return event.charCode >= 48 && event.charCode <= 57"
					oninput="this.value.length > this.maxLength && (this.value = this.value.slice(0, this.maxLength))"
				/>
				<span v-else-if="col.name === '加退保日'" class="date-input">
					<button @click="calendarMode = 'range'">區</button>
					<input
						type="text"
						:class="errorFind_(col.name) ? ' error': ''"
						v-tooltip="(errorFind_(col.name) || {}).msg"
						v-model="tempData[col.name]"
					/>
					<v-date-picker
						v-if="calendarMode"
						v-model="calendarDates"
						:mode="calendarMode"
						:is-double-paned="true"
						:show-caps="true"
						:show-day-popover="false"
						:popover-align="calendarMode === 'multiple' ? 'right' : 'left'"
						:popover-visibility="hideCalender ? 'hidden': 'visible'"
					>
						<span slot="header-title" slot-scope="{ shortMonthLabel, yearLabel }">
							{{ yearLabel }}年 {{ shortMonthLabel }}
						</span>
					</v-date-picker>
					<button @click="calendarMode = 'multiple'">單</button>
				</span>
				<input
					v-else
					type="text"
					:class="`${col.class}${errorFind_(col.name) ? ' error': ''}`"
					v-tooltip="(errorFind_(col.name) || {}).msg"
					v-model="tempData[col.name]"
				/>
			</span>
			<span
				v-else
				:class="`cell ${col.class}${col.name === sortBy ? ' sort' : ''}`"
				:data-label="col.name"
			>
				<span v-if="col.name === '加退保日'" class="date-ellipsis" v-tooltip="{ content: item[`${col.name}_f`], classes: ['info'] }">
					{{ item[`${col.name}_f`] }}
				</span>
				<span v-else-if="col.name === '身份別'" class="nowrap" v-tooltip="{ content: item[`${col.name}_tip`], classes: ['info'] }">
					{{ item[col.name] }}
				</span>
				<span v-else-if="['薪資', '生日'].includes(col.name)" class="nowrap" :title="item[`${col.name}_f`]">
					{{ item[`${col.name}_f`] }}
				</span>
				<span v-else-if="['身份證', '姓名'].includes(col.name)" class="nowrap">
					{{ item[`${col.name}_f`] }}
				</span>
				<span v-else class="nowrap" :title="item[col.name]">
					{{ item[col.name] }}
				</span>
			</span>
		</template>
		<template v-if="authorized">
			<span v-if="mode === 'insert'" class="cell action">
				<i class="fa fa-check" @click="validate_(id)"></i>
				<i class="fa fa-times" @click="insertCancel_"></i>
			</span>
			<span v-else-if="mode === 'update'" class="cell action">
				<i class="fa fa-check" @click="validate_(id)"></i>
				<i class="fa fa-times" @click="resetRow_(true)"></i>
			</span>
			<span v-else-if="mode === 'delete'" class="cell action">
				<i class="fa fa-check" @click="delete_({ id, callback: resetRow_ })"></i>
				<i class="fa fa-times" @click="resetRow_"></i>
			</span>
			<span v-else class="cell action">
				<i class="fa fa-pencil-square-o" @click="updateMode_"></i>
				<i class="fa fa-trash-o" @click="mode = 'delete'"></i>
			</span>
		</template>
	</div>
</template>

<script>
	import Vue from 'vue';
	import { mapGetters, mapActions } from 'vuex';
	import * as yup from 'yup';
	import { chkTaiwanPID, chkLiveID, chkRocDate, chkRange, chkRangeOverlaps } from '../libs/validate';
	import { dateToRoc, rocToDate } from '../libs/utils';
	const clickEvent = (() => {
		if ('ontouchstart' in document.documentElement === true)
			return { event: 'touchstart', passive: { passive: false } };
		else
			return { event: 'click', passive: true };
	})();

	export default {
		props: [
			'item',
			'id',
			'cancel'
		],
		data() {
			let mode = 'normal';
			if (this.item._id === undefined) {
				mode = 'insert';
			}
			return {
				mode,
				tempData: {
				},
				schema: {
					'身份證': yup.string().required().test('is-valid-id', '必須是合法的身份證', value => value ? chkTaiwanPID(value) : true).label('身份證'),
					'姓名': yup.string().required().label('姓名'),
					'性別': yup.string().required().label('性別'),
					'生日': yup.string().required().test('is-valid-date', '日期格式錯誤', value => value ? chkRocDate(value) : true),
					'薪資': yup.string().required().label('薪資'),
				},
				errors: [],
				calendarMode: '',
				calendarDates: null,
				hideCalender: true,
				openTagComplete: false,
				tag: '',
			};
		},
		mounted() {
			document.addEventListener(clickEvent.event, this.hideCalendar_, clickEvent.passive);
		},
		beforeDestroy() {
			document.removeEventListener(clickEvent.event, this.hideCalendar_);
		},
		methods: {
			...mapActions({
				insert_: 'insert',
				update_: 'update',
				delete_: 'delete',
			}),
			insertCancel_() {
				if (typeof this.cancel === 'function') {
					this.cancel();
				}
				this.$emit('outbatch', { id: this.id });
			},
			resetRow_(resetData) {
				this.mode = 'normal';
				this.errors = [];
				if (resetData) {
					Vue.nextTick().then(() => {
						this.resetTempData_();
					});
				}
				this.$emit('outbatch', { id: this.id });
			},
			updateMode_() {
				this.mode = 'update';
			},
			resetTempData_() {
				this.tempData = {
					...this.item,
					'職稱': this.item['職稱'] || '校內助理',
					'籍別': this.item['籍別'] || '本國',
					'身份別': this.item['身份別'] || '',
					'勞退': this.item['勞退'] || 0,
					'健保': this.item['健保'] || 'n',
					'職災': this.item['職災'] || 'n',
					'不檢誤': this.item['不檢誤'] || 'n',
					'加退保日': this.item['加退保日'] === '' ? undefined : this.item['加退保日'],
				};
			},
			validate_(id, batch) {
				this.setDateSchema_(batch);
				let obj;
				this.errors = [];
				return yup.object().shape({ ...this.schema })
					.validate(this.tempData, { abortEarly: false, stripUnknown: true })
					.then(valid => {
						switch (this.mode) {
						case 'insert':
							obj = { id, data: { ...this.tempData, ...valid }, callback: this.insertCancel_ };
							if (batch) {
								return obj;
							} else {
								this.insert_(obj);
							}
							break;
						case 'update':
							obj = { id, data: { ...this.tempData, ...valid }, callback: () => { this.resetRow_(true); } };
							if (batch) {
								return obj
							} else {
								this.update_(obj);
							}
							break;
						}
					})
					.catch(err => {
						console.log(err)
						this.errors = err.inner.map(item => ({ msg: item.message, path: item.path }));
						// Vue.nextTick().then(() => {
						// 	alert(err.errors.join('\n'));
						// });
					});
			},
			errorFind_(colName) {
				return this.errors.find(item => item.path === colName);
			},
			hideCalendar_(event) {
				if (!this.hideCalender && !document.getElementsByClassName('popover-content')[0].contains(event.target)) {
					this.hideCalender = true;
					this.calendarMode = '';
					event.preventDefault();
					return false;
				}
			},
			setDateSchema_(batch) {
				if (
					this.tempData['加退保日'] &&
					this.tempData['加退保日'].indexOf('-') > -1
				) {
					this.schema = {
						...this.schema,
						'加退保日': yup.string()
							.transform(c => c.split('-').map(d => `${d}`.trim()).join('-')).required()
							.test('is-valid-range', '起迄日期相反', val => val ? chkRange(val) : true)
							.test('is-valid-date', '日期格式錯誤', val => val ? (val.split('-')[1] ? val.split('-').every(roc => chkRocDate(roc)) : chkRocDate(val.split('-')[0])) : true)
							.test('is-duplicate', '加保區間不得重覆', val => (val && this.tempData['不檢誤'] !== 'y') ? chkRangeOverlaps(val, this.result.data, this.tempData['身份證'], this.id, batch) : true),
					};
				} else {
					this.schema = {
						...this.schema,
						'加退保日': yup.string()
							.transform(c => c.split(',').map(d => parseInt(`${d}`.trim(), 10)).sort((a, b) => a - b).join(',')).required()
							.test('is-valid-date', '日期格式錯誤', val => val ? val.split(',').every(roc => chkRocDate(roc)) : true)
							.test('is-duplicate', '加保區間不得重覆', val => (val && this.tempData['不檢誤'] !== 'y') ? chkRangeOverlaps(val, this.result.data, this.tempData['身份證'], this.id, batch) : true),
					};
				}
			},
			isNumber_(event) {
				let keyCode = event.keyCode ? event.keyCode : event.which;
				if (this.tempData['勞退'] && `${this.tempData['勞退']}`.indexOf('-') > -1 && keyCode === 45) {
					event.preventDefault();
				} else if (this.tempData['勞退'] && `${this.tempData['勞退']}`.indexOf('0') === 0) {
					event.preventDefault();
				} else {
					if (!(keyCode >= 48 && keyCode <= 57 || keyCode === 45)) {
						event.preventDefault();
					}
				}
			},
			blurTagsInput_() {
				setTimeout(() => { this.openTagComplete = false; }, 300);
			},
		},
		computed: {
			...mapGetters({
				result: 'summary',
				sortBy: 'sortBy',
				displayedCols: 'displayedCols',
				busy: 'busy',
				depts: 'depts',
				titles: 'titles',
				authorized: 'authorized',
			}),
			country() {
				return this.tempData['籍別'];
			},
			pid() {
				return this.tempData['身份證'];
			},
			dates() {
				return this.tempData['加退保日'];
			},
		},
		watch: {
			mode: {
				handler() {
					switch (this.mode) {
					case 'insert':
					case 'update':
						this.resetTempData_()
						this.$emit('inbatch', {
							id: this.id,
							data: this.tempData,
							promise: (batch) => this.validate_(this.id, batch),
						});
						break;
					case 'delete':
						this.$emit('inbatch', {
							id: this.id,
							promise: () => new Promise(resolve => resolve({ id: this.id, _del: true, callback: this.resetRow_ })),
						});
						break;
					}
				},
				immediate: true,
			},
			country: {
				handler() {
					if (this.tempData['籍別'] === '本國') {
						this.schema = {
							...this.schema,
							'身份證': yup.string().required().test('is-valid-id', '必須是合法的身份證', value => value ? chkTaiwanPID(value) : true).label('身份證'),
						};
					} else {
						this.schema = {
							...this.schema,
							'身份證': yup.string().required().test('is-valid-id', '必須是合法的居留證', value => value ? chkLiveID(value) : true).label('居留證'),
						};
					}
				},
				immediate: true,
			},
			pid: {
				handler() {
					if (this.tempData['身份證']) {
						if (['1', 'A', 'C'].includes(this.tempData['身份證'][1])) {
							this.tempData['性別'] = '男';
						}
						if (['2', 'B', 'D'].includes(this.tempData['身份證'][1])) {
							this.tempData['性別'] = '女';
						}
					}
				},
				immediate: true,
			},
			dates: {
				handler() {
					this.setDateSchema_();
				},
				immediate: true,
			},
			calendarMode() {
				if (this.calendarMode) {
					this.hideCalender = false;
					switch (this.calendarMode) {
					case 'multiple':
						if (
							this.tempData['加退保日'] &&
							this.tempData['加退保日'].split(',').every(roc => chkRocDate(roc))
						) {
							this.calendarDates = this.tempData['加退保日'].split(',').map(roc => rocToDate(roc));
						} else {
							this.calendarDates = null;
						}
						break;
					case 'range':
						if (
							this.tempData['加退保日'] &&
							this.tempData['加退保日'].indexOf('-') > -1 &&
							this.tempData['加退保日'].split('-').every(roc => chkRocDate(roc))
						) {
							this.calendarDates = {
								start: rocToDate(this.tempData['加退保日'].split('-')[0]),
								end: rocToDate(this.tempData['加退保日'].split('-')[1]),
							};
						} else {
							this.calendarDates = null;
						}
						break;
					}
				}
			},
			calendarDates() {
				if (this.calendarDates) {
					if (Array.isArray(this.calendarDates)) {
						this.tempData['加退保日'] = this.calendarDates.map(date => dateToRoc(date)).join(',');
					} else {
						const { start, end } = this.calendarDates;
						this.tempData['加退保日'] = `${dateToRoc(start)}-${dateToRoc(end)}`;
					}
				} else {
					this.tempData['加退保日'] = '';
				}
			},
		},
	}
</script>