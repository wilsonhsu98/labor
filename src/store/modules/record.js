import axios from 'axios';
import {
    types as rootTypes,
    getters as rootGetters,
    state as rootState,
} from '../root';
import { GET_URL, POST_URL } from "../../constants/index";
import router from '../../router';
import FileSaver from 'file-saver';
import utils from "../../libs/utils";
import { calculateLabor } from '../../libs/labor';
import { moment } from '../../moment';

const dbCols = [
    '加退保日',
    '單位',
    '姓名',
    '工時',
    '已收薪資月份',
    '性別',
    '生日',
    '籍別',
    '職稱',
    '薪資',
    '身份別',
    '身份證',
    '勞退',
    '職災',
    '不檢誤',
    '健保',
    '_id',
    '_table'
];
const inputCols = [
    { name: '籍別', class: 'country' },
    { name: '身份證', class: 'pid' },
    { name: '姓名', class: 'name' },
    { name: '性別', class: 'gender' },
    { name: '生日', class: 'bdate' },
    { name: '單位', class: 'dept' },
    { name: '職稱', class: 'title' },
    { name: '職災', class: 'damage' },
    { name: '健保', class: 'hi' },
    { name: '勞退', class: 'retired' },
    { name: '身份別', class: 'type' },
    { name: '薪資', class: 'salary' },
    { name: '工時', class: 'hours' },
    { name: '加退保日', class: 'dates' },
    { name: '不檢誤', class: 'validate' }
];
const calcCols = [
    { name: '身份證', class: 'pid' },
    { name: '姓名', class: 'name' },
    { name: '單位', class: 'dept' },
    { name: '身份別', class: 'type' },
    { name: '薪資', class: 'salary' },
    { name: '加退保日', class: 'dates' },
    { name: '月份', class: '' },
    { name: '天數', class: 'days' },
    { name: '勞保個人', class: '' },
    { name: '勞保單位', class: '' },
    { name: '健保個人', class: '' },
    { name: '健保單位', class: '' },
    { name: '勞退個人', class: '' },
    { name: '勞退單位', class: '' },
    { name: '已收薪資', class: '' }
];
const shareCols = [
    { name: '項目', class: '' },
    { name: '機關勞保', class: '' },
    { name: '自付勞保', class: '' },
    { name: '職災', class: '' },
    { name: '工資墊償基金', class: '' },
    { name: '機關健保', class: '' },
    { name: '自付健保', class: '' },
    { name: '機關勞退', class: '' },
    { name: '自付勞退', class: '' }
];
const byTitleCols = [
    { name: '姓名', class: '' },
    { name: '勞保投保金額', class: '' },
    { name: '勞退投保金額', class: '' },
    { name: '健保投保金額', class: '' },
    { name: '機關勞保', class: '' },
    { name: '機關健保', class: '' },
    { name: '機關勞退', class: '' },
    { name: '機關職災', class: '' },
    { name: '自付勞保', class: '' },
    { name: '自付健保', class: '' },
    { name: '自付勞退', class: '' }
];
const firstDayCols = [
    { name: '姓名', class: '' },
    { name: '性別', class: '' },
    { name: '身份證號', class: '' },
    { name: '出生日期', class: '' },
    { name: '單位', class: '' },
    { name: '職稱', class: '' },
    { name: '身份別', class: '' }
];
const countCols = [
    { name: '項目', class: '' },
    { name: '男', class: '' },
    { name: '女', class: '' },
    { name: '總人數(男+女)', class: '' },
    { name: '總計工作日數', class: '' },
    { name: '總經歷工時', class: '' }
];
const labor21 =[
];
const labor31 =[
];
const calculateByTitle = (state, type) => {
    const { month } = state.searchCombine;
    let len = 0;
    const sum = {
        '機關勞保': 0,
        '機關健保': 0,
        '機關勞退': 0,
        '機關職災': 0,
        '自付勞保': 0,
        '自付健保': 0,
        '自付勞退': 0,
    };
    return state.summary
        .map(item => {
            const find = item.months.find(sub => `${sub.month}` === `${month}`) || {};
            return { ...item, ...find };
        })
        .filter(item => {
            return `${item.month}` === `${month}` && item['職稱'] === type;
        })
        .reduce((arr, item) => {
            const find = arr.find(sub => sub['身份證'] === item['身份證']);
            if (find) {
                find.ranges = find.ranges.concat(item.ranges).sort((a, b) => a.start.valueOf() - b.start.valueOf());
                find['天數'] += item['天數'];
                find['勞保個人'] += item['勞保個人'];
                find['勞保單位'] += item['勞保單位'];
                find['勞保職災'] += item['勞保職災'];
                find['hi'] = find['hi'] || item['hi'];
                find['健保個人'] = find['hi'] ? ((parseInt(find['健保個人'], 10) || 0) + (parseInt(item['健保個人'], 10) || 0)) : '－';
                find['健保單位'] = find['hi'] ? ((parseInt(find['健保單位'], 10) || 0) + (parseInt(item['健保單位'], 10) || 0)) : '－';
                find['勞退單位'] = (parseInt(find['勞退單位'], 10) || 0) + (parseInt(item['勞退單位'], 10) || 0);
                find['勞退個人'] = (parseInt(find['勞退個人'], 10) || 0) + (parseInt(item['勞退個人'], 10) || 0);
            } else {
                arr = arr.concat(item);
            }
            len = arr.length;
            sum['機關勞保'] += parseInt(item['勞保單位'], 10) || 0;
            sum['機關健保'] += parseInt(item['健保單位'], 10) || 0;
            sum['機關勞退'] += parseInt(item['勞退單位'], 10) || 0;
            sum['機關職災'] += parseInt(item['勞保職災'], 10) || 0;
            sum['自付勞保'] += parseInt(item['勞保個人'], 10) || 0;
            sum['自付健保'] += parseInt(item['健保個人'], 10) || 0;
            sum['自付勞退'] += parseInt(item['勞退個人'], 10) || 0;
            return arr;
        }, [])
        .map(item => {
            return {
                ...item,
                '勞保投保金額': item['勞保級距'],
                '勞保投保金額_f': utils.formatValue(item['勞保級距'], 'comma'),
                '健保投保金額': item['健保級距'],
                '健保投保金額_f': utils.formatValue(item['健保級距'], 'comma'),
                '勞退投保金額': item['勞退級距'],
                '勞退投保金額_f': utils.formatValue(item['勞退級距'], 'comma'),
                '機關勞保': item['勞保單位'],
                '機關勞保_f': utils.formatValue(item['勞保單位'], 'comma'),
                '機關健保': item['健保單位'],
                '機關健保_f': utils.formatValue(item['健保單位'], 'comma'),
                '機關勞退': item['勞退單位'],
                '機關勞退_f': utils.formatValue(item['勞退單位'], 'comma'),
                '機關職災': item['勞保職災'],
                '機關職災_f': utils.formatValue(item['勞保職災'], 'comma'),
                '自付勞保': item['勞保個人'],
                '自付勞保_f': utils.formatValue(item['勞保個人'], 'comma'),
                '自付健保': item['健保個人'],
                '自付健保_f': utils.formatValue(item['健保個人'], 'comma'),
                '自付勞退': item['勞退個人'],
                '自付勞退_f': utils.formatValue(item['勞退個人'], 'comma'),
                '姓名_f': rootState.authorized ? item['姓名'] : utils.formatValue(item['姓名'], 'maskname'),
            };
        })
        .sort((a, b) => utils.sort(a, b, state.sortBy, state.sort))
        .concat(len ? (() => {
            Object.keys(sum).forEach(key => {
                sum[`${key}_f`] = utils.formatValue(sum[key], 'comma');
            });
            return { '姓名': '加總', ...sum };
        })() : []);
};

const types = {
    INIT_FROM_LS: 'RECORD/INIT_FROM_LS',
    SET_SORTBY: 'RECORD/SET_SORTBY',
    SET_COLS: 'RECORD/SET_COLS',
    FETCH: 'RECORD/FETCH',
    INSERT: 'RECORD/INSERT',
    UPDATE: 'RECORD/UPDATE',
    DELETE: 'RECORD/DELETE',
    TOGGLE_BUSY: 'RECORD/TOGGLE_BUSY',
    SEARCH_SUMMARY: 'RECORD/SEARCH_SUMMARY',
    SEARCH_CALC: 'RECORD/SEARCH_CALC',
    SEARCH_COMBINE: 'RECORD/SEARCH_COMBINE',
    SEARCH_TODAY: 'RECORD/SEARCH_TODAY',
    PAGER_SUMMARY: 'RECORD/PAGER_SUMMARY',
    PAGER_CALC: 'RECORD/PAGER_CALC',
};

const state = {
    summary: [],
    searchSummary: { title: '', perPage: 10, page: 1 },
    searchCalc: { month: moment().format('YYYYMM'), dept: '', perPage: 10, page: 1 },
    searchCombine: { month: moment().format('YYYYMM'), type: '分攤表' },
    searchToday: { date: moment().format('YYYYMMDD'), titles: '' },
    setting: [],
    mapping: {},
    workingDays: [],
    sortBy: '姓名',
    sort: 'asc',
    busy: [],
};

const getters = {
    summary: state => {
        const { perPage, page, pid, name, title } = state.searchSummary;
        const obj = state.summary
            .filter(item => {
                return (pid ? pid.split(' ').includes(item['身份證']) : true) &&
                    (name ? name.split(' ').includes(item['姓名']) : true) &&
                    (title ? title === item['職稱'] : true);
            })
            .map(item => ({
                ...item,
                '生日_f': utils.formatValue(item['生日'], 'date'),
                '薪資_f': utils.formatValue(item['薪資'], 'comma'),
                '加退保日_f': utils.formatValue(item['加退保日'], 'date'),
                '身份別_tip': utils.formatValue(item['身份別'], 'hi_tip'),
                '身份證_f': rootState.authorized ? item['身份證'] : 'xxxxxxxxxx',
                '姓名_f': rootState.authorized ? item['姓名'] : utils.formatValue(item['姓名'], 'maskname'),
            }))
            .sort((a, b) => utils.sort(a, b, state.sortBy, state.sort));

        const start = Math.max(Math.min(Math.max(1, page), Math.ceil(obj.length / perPage)) - 1, 0) * perPage;
        const end = Math.min(Math.min(Math.max(1, page), Math.ceil(obj.length / perPage)) * perPage, obj.length);

        return {
            data: obj,
            sliceData: obj.slice(start, end),
            start: obj.length === 0 ? 0 : start + 1,
            end: end,
            total: obj.length,
            totalPage: Math.ceil(obj.length / perPage),
            page: Math.min(Math.max(1, page), Math.ceil(obj.length / perPage)),
        };
    },
    calc: state => {
        const { perPage, page, pid, dept, month } = state.searchCalc;
        const obj = state.summary
            .filter(item => {
                return (pid ? pid.split(' ').includes(item['身份證']) : true) &&
                    (dept ? dept === item['單位'] : true) &&
                    (month ? item.months.find(sub => `${sub.month}` === `${month}`) : true);
            })
            .map(item => {
                const find = item.months.find(sub => `${sub.month}` === `${month}`) || {};
                const month_f = utils.formatValue(find['月份'], 'month');
                const date = utils.formatValue(item['加退保日'], 'date');
                return {
                    ...item,
                    ...find,
                    '月份_f': month_f,
                    '薪資_f': utils.formatValue(item['薪資'], 'comma'),
                    '勞保個人_f': utils.formatValue(find['勞保個人'], 'comma'),
                    '勞保單位_f': utils.formatValue(find['勞保單位'], 'comma'),
                    '健保個人_f': utils.formatValue(find['健保個人'], 'comma'),
                    '健保單位_f': utils.formatValue(find['健保單位'], 'comma'),
                    '勞退個人_f': utils.formatValue(find['勞退個人'], 'comma'),
                    '勞退單位_f': utils.formatValue(find['勞退單位'], 'comma'),
                    '加退保日_f': date.indexOf(',') > -1 ? item.ranges.map(sub => utils.formatValue(sub, 'range')).join(',') : date,
                    '已收薪資': item['已收薪資月份'] ? item['已收薪資月份'].indexOf(month_f) > -1 : false,
                    '身份別_tip': utils.formatValue(item['身份別'], 'hi_tip'),
                    '身份證_f': rootState.authorized ? item['身份證'] : 'xxxxxxxxxx',
                    '姓名_f': rootState.authorized ? item['姓名'] : utils.formatValue(item['姓名'], 'maskname'),
                };
            })
            .sort((a, b) => utils.sort(a, b, state.sortBy, state.sort));

        const start = Math.max(Math.min(Math.max(1, page), Math.ceil(obj.length / perPage)) - 1, 0) * perPage;
        const end = Math.min(Math.min(Math.max(1, page), Math.ceil(obj.length / perPage)) * perPage, obj.length);

        return {
            data: obj,
            sliceData: obj.slice(start, end),
            start: obj.length === 0 ? 0 : start + 1,
            end: end,
            total: obj.length,
            totalPage: Math.ceil(obj.length / perPage),
            page: Math.min(Math.max(1, page), Math.ceil(obj.length / perPage)),
        };
    },
    combine: state => {
        const { month, type } = state.searchCombine;
        if (getters.titles(state).includes(type)) {
            return calculateByTitle(state, type);
        } else if (type === '每月一日在保') {
            return state.summary
                .map(item => {
                    const find = item.months.find(sub => `${sub.month}` === `${month}`) || {};
                    return { ...item, ...find };
                })
                .filter(item => {
                    return `${item.month}` === `${month}` && item.ranges.some(range => range.contains(moment(`${month}01`)));
                })
                .map(item => {
                    return {
                        ...item,
                        '身份證號': item['身份證'],
                        '身份證號_f': rootState.authorized ? item['身份證'] : 'xxxxxxxxxx',
                        '出生日期': item['生日'],
                        '出生日期_f': utils.formatValue(item['生日'], 'date'),
                        '姓名_f': rootState.authorized ? item['姓名'] : utils.formatValue(item['姓名'], 'maskname'),
                    };
                })
                .sort((a, b) => utils.sort(a, b, state.sortBy, state.sort));
        } else if (type === '分攤表') {
            let len = 0;
            const sum = {
                '機關勞保': 0,
                '機關健保': 0,
                '機關勞退': 0,
                '職災': 0,
                '自付勞保': 0,
                '自付健保': 0,
                '自付勞退': 0,
            };
            return ['約聘僱教師', '約聘僱助理', '技工友', '約用臨時人員', '研究助理', '校內助理']
                .concat(state.summary.map(item => item['職稱']))
                .filter((v, i, self) => v && self.indexOf(v) === i)
                .map((item, i) => {
                    const data = calculateByTitle(state, item);
                    const find = data.find(item => item['姓名'] === '加總');
                    const count = find ? data.length - 1 : data.length;
                    len = i + 1;
                    if (find) {
                        sum['機關勞保'] += find['機關勞保'];
                        sum['機關健保'] += find['機關健保'];
                        sum['機關勞退'] += find['機關勞退'];
                        sum['職災'] += find['機關職災'];
                        sum['自付勞保'] += find['自付勞保'];
                        sum['自付健保'] += find['自付健保'];
                        sum['自付勞退'] += find['自付勞退'];
                    }
                    return {
                        '項目': `${item}${count}人`,
                        ...find,
                        '職災': find ? find['機關職災'] : '',
                        '職災_f': find ? find['機關職災_f'] : '',
                    };
                })
                .sort((a, b) => utils.sort(a, b, state.sortBy, state.sort))
                .concat(len ? (() => {
                    Object.keys(sum).forEach(key => {
                        sum[`${key}_f`] = utils.formatValue(sum[key], 'comma');
                    });
                    return { '項目': '加總', ...sum };
                })() : []);
        } else if (type === '人數通報') {
            const source = state.summary
                .map(item => {
                    const find = item.months.find(sub => `${sub.month}` === `${month}`) || {};
                    return { ...item, ...find };
                })
                .filter(item => {
                    return `${item.month}` === `${month}`;
                });
            return ['月投保人數', '日投保人數']
                .map(item => {
                    let s;
                    let totalDays = 0;
                    let totalHours = 0;
                    if (item === '月投保人數') {
                        s = source.filter(i => i.labor === 30);
                        totalDays = (state.workingDays.find(i => `${i['年月']}` === utils.formatValue(`${month}`, 'month')) || { '工作日': 0 })['工作日'] * s.length;
                        totalHours = totalDays * 8;
                    } else {
                        s = source.filter(i => i.labor !== 30);
                        totalDays = s.reduce((c, i) => { c += i.labor; return c; }, 0);
                        totalHours = s.reduce((c, i) => { c += parseInt(i['工時'], 10); return c; }, 0);
                    }
                    return {
                        '項目': item,
                        '男': s.filter(i => i['性別'] === '男').length,
                        '女': s.filter(i => i['性別'] === '女').length,
                        '總人數(男+女)': s.length,
                        '總計工作日數': totalDays,
                        '總經歷工時': totalHours,
                    };
                })
                .sort((a, b) => utils.sort(a, b, state.sortBy, state.sort));
        } else {
            return [];
        }
    },
    today: state => {
        const { date, titles } = state.searchToday;
        const month = `${date}`.substr(0, 6);
        return state.summary
            .map(item => {
                const find = item.months.find(sub => `${sub.month}` === `${month}`) || {};
                return { ...item, ...find };
            })
            .filter(item => item.ranges.find(range => range.start.format('YYYYMMDD') === `${date}`))
            .filter(item => titles.split(',').includes(item['職稱']))
            .map(item => {
                return {
                    ...item,
                    '身份證號': item['身份證'],
                    '出生日期': item['生日'],
                    '出生日期_f': utils.formatValue(item['生日'], 'date'),
                };
            })
            .sort((a, b) => utils.sort(a, b, state.sortBy, state.sort));
    },
    sortBy: state => state.sortBy,
    sort: state => state.sort,
    displayedCols: () => inputCols,
    calcCols: () => calcCols,
    combineCols: state => {
        const { type } = state.searchCombine;
        let cols = byTitleCols;
        switch(type) {
        case '分攤表':
            cols = shareCols;
            break;
        case '每月一日在保':
            cols = firstDayCols;
            break;
        case '人數通報':
            cols = countCols;
            break;
        }
        return cols;
    },
    todayCols: state => {
        return labor21;
    },
    busy: state => state.busy,
    depts: state => {
        return state.summary
            .map(item => item['單位'])
            .filter((v, i, self) => v && self.indexOf(v) === i)
            .sort((a, b) => utils.compareProperty(a, b));
    },
    titles: state => {
        return state.summary
            .map(item => item['職稱'])
            .concat(['約聘僱教師', '約聘僱助理', '技工友', '約用臨時人員', '研究助理', '校內助理'])
            .filter((v, i, self) => v && self.indexOf(v) === i)
            .sort((a, b) => utils.compareProperty(a, b));
    },
    searchSummary: state => state.searchSummary,
    searchCalc: state => state.searchCalc,
    searchCombine: state => state.searchCombine,
    searchToday: state => state.searchToday,
};

const actions = {
    initFromLS({ commit }) {
        commit(types.INIT_FROM_LS);
    },
    fetch({ commit }) {
        // if (state.summary.length) return;
        commit(rootTypes.LOADING, true);
        axios.get(GET_URL({ action: 'all' }))
            .then(res => {
                commit(types.FETCH, res.data);
                commit(rootTypes.LOADING, false);
            });
    },
    insert({ commit }, { id, data = {}, callback }) {
        commit(types.TOGGLE_BUSY, id);
        const others = Object.keys(data).reduce((object, key) => {
            if (dbCols.includes(key)) {
                object[key] = data[key];
            }
            return object;
        }, {});
        axios({
                method: 'POST',
                url: POST_URL,
                data: { sheetname: '加保資料', data: { _id: id, ...others } },
                transformRequest: [(data) => {
                    return Object.keys(data).filter(item => data[item]).map(item => `${encodeURIComponent(item)}=${encodeURIComponent(typeof data[item] === 'object' ? JSON.stringify(data[item]) : data[item])}`).join('&');
                }],
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
            .then(res => {
                commit(types.TOGGLE_BUSY, id);
                if (res.data.result === 'success') {
                    commit(types.INSERT, { _id: id, ...data });
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    alert(res.data.error.message);
                }
            });
    },
    update({ commit }, { id, data = {}, callback }) {
        commit(types.TOGGLE_BUSY, id);
        const others = Object.keys(data).reduce((object, key) => {
            if (dbCols.includes(key)) {
                object[key] = data[key];
            }
            return object;
        }, {});
        axios({
                method: 'POST',
                url: POST_URL,
                data: { sheetname: '加保資料', data: { _id: id, ...others } },
                transformRequest: [(data) => {
                    return Object.keys(data).filter(item => data[item]).map(item => `${encodeURIComponent(item)}=${encodeURIComponent(typeof data[item] === 'object' ? JSON.stringify(data[item]) : data[item])}`).join('&');
                }],
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
            .then(res => {
                commit(types.TOGGLE_BUSY, id);
                if (res.data.result === 'success') {
                    commit(types.UPDATE, { _id: id, ...data });
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    alert(res.data.error.message);
                }
            });
    },
    delete({ commit }, { id, callback }) {
        commit(types.TOGGLE_BUSY, id);
        axios({
                method: 'POST',
                url: POST_URL,
                data: { sheetname: '加保資料', data: { _id: id, _del: true } },
                transformRequest: [(data) => {
                    return Object.keys(data).filter(item => data[item]).map(item => `${encodeURIComponent(item)}=${encodeURIComponent(typeof data[item] === 'object' ? JSON.stringify(data[item]) : data[item])}`).join('&');
                }],
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
            .then(res => {
                commit(types.TOGGLE_BUSY, id);
                if (res.data.result === 'success') {
                    commit(types.DELETE, { _id: id });
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    alert(res.data.error.message);
                }
            });
    },
    batch({ commit }, { data = [], callback }) {
        const processData = data.map(item => {
            commit(types.TOGGLE_BUSY, item.id);
            if (item._del) {
                return { _del: true, _id: item.id };
            } else {
                const others = Object.keys(item.data).reduce((object, key) => {
                    if (dbCols.includes(key)) {
                        object[key] = item.data[key];
                    }
                    return object;
                }, {});
                return { ...others, _id: item.id };
            }
        });

        axios({
                method: 'POST',
                url: POST_URL,
                data: { sheetname: '加保資料', data: processData },
                transformRequest: [(data) => {
                    return Object.keys(data).filter(item => data[item]).map(item => `${encodeURIComponent(item)}=${encodeURIComponent(typeof data[item] === 'object' ? JSON.stringify(data[item]) : data[item])}`).join('&');
                }],
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
            .then(res => {
                data.forEach(item => {
                    commit(types.TOGGLE_BUSY, item.id);
                });
                data.forEach(item => {
                    if (res.data.result === 'success') {
                        if (typeof item.callback === 'function') {
                            item.callback();
                        }
                        if (item._del) {
                            commit(types.DELETE, { _id: item.id });
                        } else if (item.data._id === undefined) {
                            commit(types.INSERT, { _id: item.id, ...item.data });
                        } else {
                            commit(types.UPDATE, { _id: item.id, ...item.data });
                        }
                    }
                });
                if (res.data.result === 'success') {
                    if (typeof callback === 'function') {
                        callback(data);
                    }
                } else {
                    alert(res.data.error.message);
                }
            });
    },
    download({ commit }, { data, sheetname }) {
        commit(rootTypes.LOADING, true);
        axios({
                method: 'POST',
                url: POST_URL,
                data: { action: 'download', sheetname, data: JSON.stringify(data) },
                transformRequest: [(data) => {
                    return Object.keys(data).filter(item => data[item]).map(item => `${encodeURIComponent(item)}=${encodeURIComponent(data[item])}`).join('&');
                }],
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
            .then(res => {
                FileSaver.saveAs(utils.b64toBlob(res.data), 'report.xlsx');
                commit(rootTypes.LOADING, false);
            });
    },
    setSortBy({ commit }, value) {
        commit(types.SET_SORTBY, value);
        // commit(types.SET_COLS, { col: value });
    },
    searchSummary({ commit }, value) {
        commit(types.SEARCH_SUMMARY, value);
    },
    searchCalc({ commit }, value) {
        commit(types.SEARCH_CALC, value);
    },
    searchCombine({ commit }, value) {
        commit(types.SEARCH_COMBINE, value);
    },
    searchToday({ commit }, value) {
        commit(types.SEARCH_TODAY, value);
    },
    pagerSummary({ commit }, value) {
        commit(types.PAGER_SUMMARY, value);
    },
    pagerCalc({ commit }, value) {
        commit(types.PAGER_CALC, value);
    },
};

const mutations = {
    [types.INIT_FROM_LS](state) {
        state.sortBy = window.localStorage.getItem("pref_sortby") || state.sortBy;
        state.sort = window.localStorage.getItem("pref_sort") || state.sort;

        const pref_searchSummary = window.localStorage.getItem("pref_searchSummary");
        if (pref_searchSummary) state.searchSummary = JSON.parse(pref_searchSummary);
        const pref_searchCalc = window.localStorage.getItem("pref_searchCalc");
        if (pref_searchCalc) state.searchCalc = JSON.parse(pref_searchCalc);
        const pref_searchCombine = window.localStorage.getItem("pref_searchCombine");
        if (pref_searchCombine) state.searchCombine = JSON.parse(pref_searchCombine);
        const pref_searchToday = window.localStorage.getItem("pref_searchToday");
        if (pref_searchToday) state.searchToday = JSON.parse(pref_searchToday);
    },
    [types.FETCH](state, data) {
        state.setting = data.filter(item => item._table === '設定');
        state.workingDays = data.filter(item => item._table === '工作日');
        data[0].tables.filter(table => !['加保資料', '設定', '工作日'].includes(table))
            .forEach(table => {
                state.mapping[table] = data.filter(item => item._table === table);
            });

        state.summary = data
            .filter(item => item._table === '加保資料')
            .map(item => ({
                ...item,
                '姓名': item['姓名'].trim(),
                ...calculateLabor(item, state.setting, state.mapping)
            }));

        // window.localStorage.setItem("record", JSON.stringify(state.summary));
    },
    [types.INSERT](state, data) {
        state.summary.push({
            ...data,
            ...calculateLabor(data, state.setting, state.mapping),
        });
        // window.localStorage.setItem("record", JSON.stringify(state.summary));
    },
    [types.UPDATE](state, data) {
        state.summary = state.summary.filter(item => item._id !== data._id);
        state.summary.push({
            ...data,
            ...calculateLabor(data, state.setting, state.mapping),
        });
        // window.localStorage.setItem("record", JSON.stringify(state.summary));
    },
    [types.DELETE](state, data) {
        state.summary = state.summary.filter(item => item._id !== data._id);
        // window.localStorage.setItem("record", JSON.stringify(state.summary));
    },
    [types.TOGGLE_BUSY](state, value) {
        if (state.busy.find(item => `${item}` === `${value}`)) {
            state.busy = state.busy.filter(item => `${item}` !== `${value}`);
        } else {
            state.busy.push(value);
        }
    },
    [types.SET_SORTBY](state, value) {
        if (value === state.sortBy) {
            state.sort = state.sort === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortBy = value;
            window.localStorage.setItem("pref_sortby", state.sortBy);
            state.sort = 'asc';
        }
        window.localStorage.setItem("pref_sort", state.sort);
    },
    [types.SET_COLS](state, { col, visible }) {
        // const item = .find(i => i.name === col);
        // item.visible = visible || !item.visible;
        // window.localStorage.setItem("pref_cols", JSON.stringify());
    },
    [types.SEARCH_SUMMARY](state, { pid, name, title }) {
        state.searchSummary = {
            ...state.searchSummary,
            pid,
            name,
            title,
        };
        window.localStorage.setItem("pref_searchSummary", JSON.stringify(state.searchSummary));
    },
    [types.PAGER_SUMMARY](state, { perPage, page }) {
        state.searchSummary = {
            ...state.searchSummary,
            perPage,
            page,
        };
        window.localStorage.setItem("pref_searchSummary", JSON.stringify(state.searchSummary));
    },
    [types.SEARCH_CALC](state, { pid, month, dept }) {
        state.searchCalc = {
            ...state.searchCalc,
            pid,
            month,
            dept,
        };
        window.localStorage.setItem("pref_searchCalc", JSON.stringify(state.searchCalc));
    },
    [types.PAGER_CALC](state, { perPage, page }) {
        state.searchCalc = {
            ...state.searchCalc,
            perPage,
            page,
        };
        window.localStorage.setItem("pref_searchCalc", JSON.stringify(state.searchCalc));
    },
    [types.SEARCH_COMBINE](state, { month, type }) {
        state.searchCombine = {
            month,
            type,
        };
        window.localStorage.setItem("pref_searchCombine", JSON.stringify(state.searchCombine));
    },
    [types.SEARCH_TODAY](state, { date, titles }) {
        state.searchToday = {
            date,
            titles,
        };
        window.localStorage.setItem("pref_searchToday", JSON.stringify(state.searchToday));
    },
};

export default {
    state,
    getters,
    actions,
    mutations,
};