import { moment } from '../moment';
import { rocToDate } from './utils';
import { chkRocDate } from './validate';

export const calculateLabor = (data, settings, mapping) => {
	const rocDateStr = data['加退保日'];
	const salary =  data['薪資'];
	const hi = data['健保'] === 'y';
	const type = data['身份別'];
	const retired = data['勞退'] || 0;
	if (!rocDateStr) return;

	const ranges = [];
	let months = [];
	let totalDays;

	if (rocDateStr.indexOf('-') > -1) {
		let start;
		let end;
		if (rocDateStr.split('-')[1]) {
			start = rocToDate(rocDateStr.split('-')[0]);
			end = rocToDate(rocDateStr.split('-')[1]);
		} else {
			start = rocToDate(rocDateStr.split('-')[0]);
			end = moment().add(1, 'months').endOf('month');
			if (moment(start).isBefore(moment().subtract(1, 'months'), 'month')) {
				start = moment().subtract(1, 'months').startOf('month');
			} else if (moment(start).isSame(moment().subtract(1, 'months'), 'month')) {
				// start = moment().startOf('month');
			} else if (moment(start).isSame(new Date(), 'month')) {
				// start = moment().startOf('month');
			} else if (moment(start).isSame(moment().add(1, 'months'), 'month')) {
				// start =
			} else if (moment(start).isAfter(moment().add(1, 'months'), 'month')) {
				end = moment(start).endOf('month');
			}
		}
		const range = moment.range(start, end);

		totalDays = Array.from(range.by('days')).length;
		months = Array.from(range.by('months'));
		months = months.map((m, i) => {
			let days = 0;
			let hi = false;
			let labor = 0;
			if (months.length > 1) {
				if (i === 0) {
					days = Array.from(moment.range(start, moment(start).endOf('month')).by('days')).length;
					labor = 30 - parseInt(moment(start).format('D'), 10) + 1;
					hi = true;
				} else if (i === months.length - 1) {
					days = Array.from(moment.range(moment(end).startOf('month'), end).by('days')).length;
					labor = Math.min(parseInt(moment(end).format('D'), 10), 30);
					if (moment(end).format('YYYYMMDD') === moment(end).endOf('month').format('YYYYMMDD')) {
						hi = true;
					}
				} else {
					days = moment(m).daysInMonth();
					labor = 30;
					hi = true;
				}
			} else {
				days = totalDays;
				labor = Math.min(totalDays, 30);
				if (moment(end).format('YYYYMMDD') === moment(end).endOf('month').format('YYYYMMDD')) {
					hi = true;
				}
			}
			return { month: m.format('YYYYMM'), days, hi, labor }
		});

		if (rocDateStr.split('-')[1]) {
			ranges.push(range);
		} else {
			ranges.push(moment.range(rocToDate(rocDateStr.split('-')[0])));
		}
	} else {
		let days = rocDateStr.split(',');
		let rangeStart = '';
		days.forEach((rocDate, i) => {
			const current = moment(rocToDate(rocDate));
			if (i === 0) {
				rangeStart = rocDate;
			} else {
				const prev = moment(rocToDate(days[i - 1]));
				if (current.clone().subtract(1, 'days').toString() !== prev.toString()) {
					ranges.push(moment.range(moment(rocToDate(rangeStart)), prev));
					rangeStart = rocDate;
				}
			}
			if (i === days.length - 1) {
				ranges.push(moment.range(moment(rocToDate(rangeStart)), current));
			}

			const find = months.find(item => item.month === current.format('YYYYMM'));
			const hi = current.format('YYYYMMDD') === current.endOf('month').format('YYYYMMDD');
			let labor = 1;
			if (find) {
				find.days += 1;
				find.hi = hi;
				find.labor = Math.min(find.days, 30);
			} else {
				months.push({ month: current.format('YYYYMM'), days: 1, hi, labor });
			}
		});

		totalDays = days.length;
	}
	const ymArray = settings.map(item => item['有效年月']);
	months = months.map(item => {
		const ym = getLaborYM(parseInt(item.month, 10) - 191100, ymArray);
		const setting = settings.find(item => item['有效年月'] === ym);
		const level = [...mapping[ym]].sort((a, b) => b['月薪起'] - a['月薪起']).find(m => salary >= m['月薪起']);
		const yearOld = moment.range(rocToDate(data['生日']), moment(`${item.month}01`).subtract(1, 'months').endOf('month')).diff('years');
		const specialLabor = (yearOld >= 65 || data['籍別'] === '外籍') ? 0 : 1;
		const hiTypeRate = (type => {
			if (['重度', '中低70歲', '北市長者', '北市原55', '離島65'].includes(type)) {
				return 0;
			} else if (type === '中度') {
				return 0.5;
			} else if (type === '輕度') {
				return 0.25;
			} else {
				return 1;
			}
		});
		const laborTypeRate = (type => {
			if (type === '重度') {
				return 0;
			} else if (type === '中度') {
				return 0.5;
			} else if (type === '輕度') {
				return 0.25;
			} else {
				return 1;
			}
		});

		// 勞保個人負擔：普通事故保險費＝投保金額＊普通保險費率9.5%＊20%；就業保險費=投保金額＊就業保險費率1%＊20%
		const laborSelf =
			Math.round(level['勞保級距'] * setting['普通事故費率'] * setting['勞保個人負擔比率'] / 30 * item.labor * laborTypeRate(type.split(',')[0])) +
			Math.round(level['勞保級距'] * setting['就業保險費率'] * setting['勞保個人負擔比率'] / 30 * item.labor * laborTypeRate(type.split(',')[0]) * specialLabor);

		// 勞保單位負擔：普通事故保險費＝投保金額＊普通保險費率9.5%＊70%；就業保險費=投保金額＊就業保險費率1%＊70%；
		const laborDept =
			Math.round(level['勞保級距'] * setting['普通事故費率'] * setting['勞保政府負擔比率'] / 30 * item.labor) +
			Math.round(level['勞保級距'] * setting['就業保險費率'] * setting['勞保政府負擔比率'] / 30 * item.labor * specialLabor);

		// 職災單位負擔：
		const demageDept =
			Math.round(level['勞保級距'] * setting['職業災害費率'] / 30 * item.labor);

		// 健保個人負擔＝投保金額＊4.69%＊30%＊(1+眷屬人數)
		const hiSelf = item.hi && type && hi ?
			type.split(',').reduce((sum, t) => {
				sum += Math.round(level['健保級距'] * setting['健保費率'] * setting['健保個人負擔比率'] * hiTypeRate(t));
				return sum;
			}, 0)
			: '－';

		// 健保單位負擔＝投保金額＊4.69%＊60%＊(1+0.61)      (0.61為平均眷口數)
		const hiDept = item.hi && type && hi ?
			Math.round(level['健保級距'] * setting['健保費率'] * setting['健保政府負擔比率'] * setting['健保政府負擔平均眷口人數'])
			: '－';

		// 勞退個人負擔
		const laborRetiredSelf = retired > -1 ?
			Math.round(level['勞退級距'] *  retired / 100 / 30 * item.labor)
			: '－';

		// 勞退單位負擔
		const laborRetiredDept = retired > -1 ?
			Math.round(level['勞退級距'] *  setting['勞退政府負擔比率'] / 30 * item.labor)
			: '－';

		const override = {};
		if (data['不檢誤'] === 'y' && ['勞保個人', '勞保單位', '勞保職災', '健保個人', '健保單位', '勞退個人', '勞退單位'].every(val => data[val] !== '')) {
			['勞保個人', '勞保單位', '勞保職災', '健保個人', '健保單位', '勞退個人', '勞退單位'].forEach(val => {
				override[val] = data[val];
			});
		}
		return {
			...item,
			'月份': item.month,
			'天數': item.labor,
			'勞保個人': laborSelf,
			'勞保單位': laborDept,
			'勞保職災': demageDept,
			'健保個人': hiSelf,
			'健保單位': hiDept,
			'勞退個人': laborRetiredSelf,
			'勞退單位': laborRetiredDept,
			'勞保級距': level['勞保級距'],
			'健保級距': level['健保級距'],
			'勞退級距': level['勞退級距'],
			...override
		};
	});

	return {
		ranges,
		months,
		totalDays,
	};
};

function getLaborYM(currentYM, ymArray) {
	let value = 0;
	ymArray.forEach(ym => {
		if(currentYM >= ym) {
			value = ym;
		}
	});
	return Math.max(value, Math.min(...ymArray));
};

export const titleMapping = {
	'工-技工': '技工友',
	'2工友': '技工友',
	'技工友': '技工友',

	'約聘僱教師': '約聘僱教師',
	'3師-實習課程教學人員': '約聘僱教師',
	'師-實習課程教學人員': '約聘僱教師',
	'師-助理教授級專案計畫教學人員': '約聘僱教師',
	'兼任教師': '約聘僱教師',

	'約聘僱助理': '約聘僱助理',
	'行-北區計畫行政助理': '約聘僱助理',
	'行-典範計畫行政助理': '約聘僱助理',
	'行-技職再造約僱助理員': '約聘僱助理',
	'行-計畫經理': '約聘僱助理',
	'行-計畫行政人員': '約聘僱助理',
	'行-計畫行政助理': '約聘僱助理',
	'行-計畫約僱助理員': '約聘僱助理',
	'行-宿舍輔導員': '約聘僱助理',
	'行-校務研究辦公室專案經理': '約聘僱助理',
	'行-研究助理級研究人員': '約聘僱助理',
	'行-育成中心約僱助理員': '約聘僱助理',
	'行-育成中心約聘專員': '約聘僱助理',
	'行-原資中心計畫約僱助理員': '約聘僱助理',
	'行-約僱辦事員': '約聘僱助理',
	'行-約僱技佐': '約聘僱助理',
	'行-約僱助理員': '約聘僱助理',
	'行-約僱助理員(職代)': '約聘僱助理',
	'行-約聘高級管理師': '約聘僱助理',
	'行-約聘護理師': '約聘僱助理',
	'行-約聘心理師': '約聘僱助理',
	'行-約聘專案計畫助理研究員': '約聘僱助理',
	'行-約聘專員': '約聘僱助理',
	'行-約聘專員(校務高耕)': '約聘僱助理',
	'行-約聘專員(職代)': '約聘僱助理',
	'行-助理教授及專案計畫人員': '約聘僱助理',
	'行-資院教室行政助理': '約聘僱助理',

	'研究助理': '專任研究助理',
	'專任研究助理': '專任研究助理',

	'約用臨時人員': '約用臨時人員',
	'約用臨時人員(校外)': '約用臨時人員',

	'校內助理': '校內助理',
};
export const typeMapping = {
	'一般': '一般',
	'輕度身障': '輕度',
	'中度身障': '中度',
	'重度身障': '重度',
};