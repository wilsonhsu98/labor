import axios from 'axios';
import { POST_URL } from "../constants/index";

const types = {
    LOADING: 'LOADING',
    AUTHORIZED: 'AUTHORIZED',
};

const state = {
    loading: false,
    authorized: undefined,
};

const getters = {
    loading: state => state.loading,
    authorized: state => state.authorized,
};

const actions = {
    toggleLoading({ commit }, isLoading) {
        commit(types.LOADING, isLoading);
    },
    guest({ commit }) {
        commit(types.AUTHORIZED, false);
    },
    login({ commit }, { account, password }) {
        commit(types.LOADING, true);
        axios({
                method: 'POST',
                url: POST_URL,
                data: { action: 'auth', account, password },
                transformRequest: [(data) => {
                    return Object.keys(data).filter(item => data[item]).map(item => `${encodeURIComponent(item)}=${encodeURIComponent(typeof data[item] === 'object' ? JSON.stringify(data[item]) : data[item])}`).join('&');
                }],
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            })
            .then(res => {
                commit(types.LOADING, false);
                if (res.data.result === true) {
                    commit(types.AUTHORIZED, true);
                }
            });
    }
};

const mutations = {
    [types.LOADING](state, isLoading) {
        state.loading = isLoading;
    },
    [types.AUTHORIZED](state, authorized) {
        state.authorized = authorized;
    },
};

export {
    types,
    state,
    getters,
    actions,
    mutations,
};