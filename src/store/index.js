import Vue from 'vue';
import Vuex from 'vuex';

// root
import { state, actions, mutations, getters } from './root';
// modules
import record from './modules/record';

Vue.use(Vuex);

export default new Vuex.Store({
    state,
    actions,
    mutations,
    getters,
    modules: {
        record,
    },
    strict: true,
});