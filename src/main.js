import Vue from 'vue';
import store from './store';
import router from './router';
import './css/font-awesome.min.css';
import './css/font.css';
import './scss/_base.scss';
import './scss/_page.scss';
import VueTagsInput from '@johmun/vue-tags-input';
import setLocale from 'yup/lib/setLocale';
import VCalendar from 'v-calendar';
import 'v-calendar/lib/v-calendar.min.css';
import VTooltip from 'v-tooltip';
import './scss/v-tooltip.scss';
import vSelect from 'vue-select'


let componentsReq = require.context("./components/", false, /\.vue$/);
componentsReq.keys().forEach(path => {
	Vue.component(path.replace(/(\_|\b|\-)./g, function(a) { return a.toUpperCase(); }).replace(/(\_|\b|\-|\.\/|\.vue)*/ig, ""), componentsReq(path).default);
});
Vue.component('vue-tags-input', VueTagsInput);
Vue.use(VCalendar, {
	firstDayOfWeek: 2,
	themeStyles: {
		dayCellNotInMonth: {
			opacity: 0,
		}
	},
});
Vue.use(VTooltip, {
	defaultTrigger: 'hover focus click',
});
Vue.component('v-select', vSelect);

const app = new Vue({
	el: '#app',
	store,
	router,
});

setLocale({
	mixed: {
		required: '${path} 不得為空',
		// notType: function notType(_ref) {
		// 	return i18next.t('valid_notType', {
		// 		path: _ref.path,
		// 		type: i18next.t(_ref.type),
		// 	});
		// },
	},
	string: {
		// email: i18next.t('valid_email'),
		// url: i18next.t('valid_url'),
	},
	number: {
		// positive: i18next.t('valid_positive'),
		// integer: i18next.t('valid_integer'),
	},
});

const version = 1;
if (window.localStorage.getItem('version') !== version.toString()) {
	window.localStorage.clear();
	window.localStorage.setItem('version', version.toString())
}

document.title = '勞健保';