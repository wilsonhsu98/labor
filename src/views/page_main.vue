<template>
	<div class="main-container">
		<header>
			<div class="header-container">
				<ul class="tab">
					<li>
						<router-link :to="{ name: 'summary' }" active-class="active" data-label="列表輸入">
							<i class="fa fa-table"></i>
						</router-link>
					</li>
					<li>
						<router-link :to="{ name: 'calc' }" active-class="active" data-label="薪資檢核">
							<i class="fa fa-calendar-check-o"></i>
						</router-link>
					</li>
					<li>
						<router-link :to="{ name: 'combine' }" active-class="active" data-label="月份報表">
							<i class="fa fa-calendar"></i>
						</router-link>
					</li>
					<li v-if="authorized">
						<router-link :to="{ name: 'today' }" active-class="active" data-label="今日加退保" :data-date="new Date().getDate()">
							<i class="fa fa-calendar-o"></i>
						</router-link>
					</li>
					<li v-if="authorized" style="margin-left: auto;" class="db">
						<a href="https://docs.google.com/spreadsheets/d/13AuEKpgsQEY5UHOUrG0ryV6sjlMcPHMTZZ8KmETR_Bo/edit#gid=0" target="_blank">DB</a>
					</li>
				</ul>
			</div>
		</header>
		<router-view class="content"></router-view>
		<div v-if="authorized === undefined" class="login">
			<input type="text" placeholder="帳號" v-model="account"/>
			<input type="password" placeholder="密碼" v-model="password"/>
			<button class="btn" @click="login_">登入</button>
			<i class="fa fa-times" @click="guest"></i>
		</div>
		<loading v-if="loading" :text="loading.text"></loading>
	</div>
</template>

<script>
	import { mapGetters, mapActions } from 'vuex';

	export default {
		data() {
			return {
				account: '',
				password: '',
			}
		},
		created() {
			this.initFromLS();
			this.fetch();
		},
		methods: {
			...mapActions({
				initFromLS: 'initFromLS',
				fetch: 'fetch',
				guest: 'guest',
				login: 'login',
			}),
			login_() {
				if (this.account && this.password) {
					this.login({
						account: this.account,
						password: this.password,
					});
				}
			}
		},
		computed: {
			...mapGetters({
				loading: 'loading',
				authorized: 'authorized',
			})
		},
		watch: {
			$route() {
				window.scrollTo(0, 0);
			}
		},
	}
</script>

<style lang="scss" scoped>
	@import "../scss/variable";

	$header_menu_height: 70px;
	$footer_menu_height: 50px;

	.main-container {
		padding-top: $header_menu_height;
		padding-bottom: 20px;
	}
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 2;
		background-color: $header_bgcolor;
		height: $header_menu_height;
		box-shadow: 0 2px 12px 0 rgba(0,0,0,.13), 0 0 2px 0 rgba(0,0,0,.2);
		.header-container {
			// width: 980px;
			margin: 0 20px;
		}
		.icon {
			max-height: 60px;
			vertical-align: middle;
		}
		.tab {
			display: flex;
			box-sizing: border-box;
			list-style-type: none;
			padding: 0;
			margin: 0;
			background-size: contain;
			height: 100%;
			line-height: 70px;
			> li {
				display: inline-block;
			}
		}
		a {
			color: $header_color;
			text-decoration: none;
			padding: 8px 15px;
			margin: 0 2px;
			border-radius: 98px;
			&.active {
				background-color: $menu_active;
				color: $row_color;
			}
			&:after {
				content: attr(data-label);
			}
			&:hover:not(.active) {
				background-color: $menu_hover;
			}
			.fa { display: none; }
		}
	}
	.content {
		// width: 980px;
		// min-width: 980px;
		margin: 0 20px;
		position: relative;
		z-index: 0;
	}
	.login {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background-color: rgba(166, 166, 166, 0.6);
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		> *:not(:first-child) {
			margin-top: 10px
		}
		input, button {
			width: 100px;
		}
		.fa.fa-times {
			margin: 0;
			position: absolute;
			top: 20px;
			right: 20px;
			color: #fff;
		}
	}
	@media only screen and (max-width: 990px) {
		header .header-container,
		.content {
			width: calc(100% - 40px);
			margin-left: 20px;
			margin-right: 20px;
		}
	}
	@media only screen and (max-width: 760px) {
		.main-container {
			padding-top: 0;
			padding-bottom: $footer_menu_height;
		}
		header {
			height: $footer_menu_height;
			line-height: $footer_menu_height;
			bottom: 0;
			top: initial;
			.icon {
				display: none;
			}
			.tab {
				display: flex;
				justify-content:space-around;
				align-items: start;
				font-size: 25px;
				padding: 0;
				background: none;
				margin: 0;
				width: 100%;
				a {
					display: inline-block;
					text-align: center;
					padding: 0;
					color: $header_color;
					position: relative;
					.fa {
						display: block;
						width: 40px;
						height: 30px;
						line-height: 30px;
						margin: 0 auto;
						-moz-transition: background-color .5s;
						-webkit-transition: background-color .5s;
						transition: background-color .5s;
						&.fa-table:before {
							vertical-align: middle;
						}
					}
					&:after {
						content: attr(data-label);
						display: block;
						line-height: 15px;
						font-size: 15px;
					}
					&[data-label=今日加退保]:before {
						content: attr(data-date);
						position: absolute;
						z-index: 1;
						font-size: 14px;
						top: 11px;
						left: 50%;
						transform: translateX(-50%);
						line-height: normal;
					}
				}
				.active {
					background: none;
					margin-top: -15px;
					position: relative;
					.fa {
						background-color: $active_bgcolor;
						border-radius: 50%;
						width: 40px;
						height: 40px;
						line-height: 38px;
						margin-bottom: 3px;
						color: $current_user_color;
						opacity: .9;
					}
					&[data-label=今日加退保]:before {
						top: 16px;
					}
				}
				> li.db {
					display: none;
				}
			}
			a:hover:not(.active) {
				background: none;
			}
		}
		.content {
			width: 100%;
			margin: 0;
			padding-top: 50px;
		}
	}
</style>