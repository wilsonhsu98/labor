import { moment } from '../moment';
import { rocToDate } from './utils';

export const chkTaiwanPID = (userid) => { //身份證檢查函式
    var reg = /^[A-Z]{1}[1-2]{1}[0-9]{8}$/; //身份證的正規表示式
    if (reg.test(userid)) {
        var s = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; //把A取代成10,把B取代成11...的作法
        var ct = [
        	"10", "11", "12", "13", "14", "15", "16", "17", "34", "18", "19", "20", "21",
            "22", "35", "23", "24", "25", "26", "27", "28", "29", "32", "30", "31", "33"
        ];
        var i = s.indexOf(userid.charAt(0));
        var tempuserid = ct[i] + userid.substr(1, 9); //若此身份證號若是A123456789=>10123456789
        var num = tempuserid.charAt(0) * 1;
        for (i = 1; i <= 9; i++) {
            num = num + tempuserid.charAt(i) * (10 - i);
        }
        num += tempuserid.charAt(10) * 1;

        if ((num % 10) === 0) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

export const chkLiveID = (str_) => {
    if (!/^[a-zA-Z]{1}[a-dA-D1-2]{1}[0-9]{8}$/.test(str_)) {
        return false;
    } else {
        var id_ = str_.toUpperCase();
        var sum = 0;
        var str1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var str2 = "1011121314151617341819202122352324252627282932303133";
        var t1 = str2.substr(str1.indexOf(id_.substr(0,1)) * 2 ,2);
        var t2 = str2.substr(str1.indexOf(id_.substr(1,1)) * 2 ,2);

        sum = t1.substr(0,1) * 1 + t1.substr(1,1) * 9;
        sum += (t2 % 10 ) * 8;

        var t10 = id_.substr(9,1);
        var t10_

        for (var t_i = 3; t_i <= 9; t_i++) {
            sum += id_.substr(t_i-1,1) * (10 - t_i);
        }

        (sum % 10 == 0 ) ? t10_ = 0 : t10_ = 10 - (sum % 10);

        return (t10_ == t10 ) ? true : false;
    }
};

export const chkRocDate = (date) => {
    var dateObj = [Math.floor(date / 10000), Math.floor(date % 10000 / 100), date % 100];

    //列出12個月，每月最大日期限制
    var limitInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var theYear = parseInt(dateObj[0]);
    var theMonth = parseInt(dateObj[1]);
    var theDay = parseInt(dateObj[2]);
    var isLeap = new Date(theYear, 1, 29).getDate() === 29; // 是否為閏年?

    if(isLeap) { // 若為閏年，最大日期限制改為 29
        limitInMonth[1] = 29;
    }

    // 比對該日是否超過每個月份最大日期限制
    return theDay <= limitInMonth[theMonth - 1]
};

const getInputRange = (date) => {
    let start;
    let end;
    if (date.indexOf('-') > -1 && date.split('-')[1]) {
        start = parseInt(date.split('-')[0], 10) + 19110000;
        end = parseInt(date.split('-')[1], 10) + 19110000;
        return [moment.range(moment(start, 'YYYYMMDD'), moment(end, 'YYYYMMDD'))];
    } else if (date.indexOf('-') > -1) {
        start = parseInt(date.split('-')[0], 10) + 19110000;
        return [moment.range(moment(start, 'YYYYMMDD'))];
    } else {
        let days = date.split(',');
        let rangeStart = '';
        const ranges = [];
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
        });
        return ranges;
    }
};

export const chkRangeOverlaps = (date, summary, pid, id, batch = []) => {
    const filterBatch = batch.filter(item => item.pid === pid);
    let ranges = summary
        .filter(item => item['身份證'] === pid && !filterBatch.map(i => i.id).concat(id).includes(item._id))
        .reduce((prev, item) => prev.concat(item.ranges), []);

    filterBatch
        .filter(item => item.dates && item.id !== id)
        .forEach(item => {
            ranges = ranges.concat(getInputRange(item.dates));
        });

    const dateRanges = getInputRange(date);
    return !ranges.some(range => {
        return dateRanges.some(dateRange => range.overlaps(dateRange, { adjacent: true }));
    });
};

export const chkRange = (date) => {
    if (date.indexOf('-') > -1 && date.split('-')[1]) {
        if (date.split('-')[0] > date.split('-')[1]) {
            return false;
        }
    }
    return true;
};