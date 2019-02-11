import { chkRocDate } from './validate';

var utils = exports;

utils.b64toBlob = function(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
};

utils.toTimeStamp = function(strDate) {
    try {
        if (typeof strDate === 'string') {
            var parseDate = new Date(strDate.replace(/[上午|下午]/ig, ''));
            if (parseDate.toString() === 'Invalid Date') throw parseDate.toString();
            strDate = parseDate;
        }
        var unixEpoch = new Date(1970,0,1,0,0,0).getTime(); // difference between JS epoch and UNIX epoch in milliseconds
        return Math.round((strDate.getTime() - unixEpoch + strDate.getTimezoneOffset() * 60000)/1000.0);
    } catch(e) {
        return strDate;
    }
};

utils.compareProperty = function(a, b) {
    return (a || b) ? (!a ? -1 : !b ? 1 : `${a}`.localeCompare(b)) : 0;
};

utils.sort = function(a, b, sortBy, direction) {
    if (!isNaN(parseFloat(a[sortBy])) && isFinite(a[sortBy]) && !isNaN(parseFloat(b[sortBy])) && isFinite(b[sortBy])) {
        if (direction === 'asc') {
            return a[sortBy] - b[sortBy];
        } else {
            return b[sortBy] - a[sortBy];
        }
    } else {
        if (direction === 'asc') {
            return utils.compareProperty(a[sortBy], b[sortBy]);
        } else {
            return utils.compareProperty(b[sortBy], a[sortBy]);
        }
    }
};

utils.dateToRoc = function(date) {
    if (Object.prototype.toString.call(date).slice(8, -1) === 'Date') {
        return `${date.getFullYear() - 1911}${((date.getMonth() + 1) + 100).toString().slice(-2)}${((date.getDate()) + 100).toString().slice(-2)}`;
    }
};

utils.rocToDate = function(roc) {
    if (chkRocDate(roc)) {
        var intRoc = parseInt(roc, 10);
        var date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setFullYear(Math.floor(intRoc / 10000 + 1911), Math.floor(intRoc % 10000 / 100 - 1), Math.floor(intRoc % 100 ));
        return date;
    }
};

utils.formatValue = function(value, style) {
    if (value === 0) return 0;
    if (!value) return '';
    let val = '';
    const input = `${value}`;
    switch (style) {
    case 'range':
        if (typeof value === 'object') {
            val = `${`0${utils.dateToRoc(value.start.toDate())}`.slice(-7)}－${`0${utils.dateToRoc(value.end.toDate())}`.slice(-7)}`;
        }
        break;
    case 'month':
        val = `${`0${parseInt(value.slice(0, 4), 10) - 1911}`.slice(-3)}${value.slice(4)}`;
        break;
    case 'date':
        if (input.indexOf('-') > -1 && input.split('-')[1]) {
            val = input.split('-').map(str => `0${str}`.slice(-7)).join('－');
        } else if (input.indexOf('-') > -1) {
            val = `${`0${input.split('-')[0]}`.slice(-7)}－${Array(8).join('_')}`;
        } else {
            val = input.split(',').filter(str => str).map(str => {
                if (str.length === 8) {
                    return `${`0${parseInt(str.slice(0, 4), 10) - 1911}`.slice(-3)}${str.slice(4, 6)}${str.slice(6)}`;
                } else {
                    return `0${str}`.slice(-7);
                }
            }).join(', ');
        }
        break;
    case 'comma':
        val = input.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        break;
    case 'hi_tip':
        if (input.split(',').length === 1) {
            val = `健保: 本人<br>身份別: ${input}`;
        } else {
            val = `健保: 本人+${['', '一', '二', '三', '四'][input.split(',').length - 1]}口<br>身份別: ${input}`;
        }
        break;
    case 'maskname':
        val = input.replace(/^(.{1})(.*)(.{1})$/i, ($0, $1, $2, $3) => `${$1}${Array(Math.max($2.length, 1) + 1).join('○')}${$2.length ? $3 : ''}`);
        break;
    default:
        break;
    }
    return val;
};