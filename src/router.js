import Vue from 'vue';
import VueRouter from 'vue-router';
import store from './store';

Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        {
            path: '/main',
            name: 'main',
            component: require('./views/page_main').default,
            children: [
                {
                    path: 'summary',
                    name: 'summary',
                    component: require('./views/view_record').default,
                },
                {
                    path: 'calc',
                    name: 'calc',
                    component: require('./views/view_record_calc').default,
                },
                {
                    path: 'combine',
                    name: 'combine',
                    component: require('./views/view_record_combine').default,
                },
                {
                    path: 'today',
                    name: 'today',
                    component: require('./views/view_record_today').default,
                }
            ],
        },
        {
            path: '*',
            redirect: '/main/summary',
        }
    ]
});

export default router;