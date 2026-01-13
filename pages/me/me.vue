<template>
    <view class="page">
        <!-- 顶部：用户信息卡 -->
        <view class="card user-card">
            <image class="avatar" :src="userProfile && userProfile.avatarUrl ? userProfile.avatarUrl : defaultAvatar" mode="aspectFill" />

            <view class="user-info">
                <view class="nickname">
                    {{ userProfile && userProfile.nickName ? userProfile.nickName : '未登录' }}
                </view>
                <view class="desc">
                    {{ isLoggedIn ? '已使用本地存储' : '登录后可使用头像与昵称' }}
                </view>
            </view>

            <button class="wx-login-btn" @tap="openLoginSheet">
                {{ isLoggedIn ? '切换/登出' : '登录' }}
            </button>
        </view>

        <!-- 功能列表卡 -->
        <view class="card list-card">
            <view class="row">
                <view class="row-left">
                    <view class="row-title">我们在一起的日期</view>
                    <view class="row-sub">起始日：{{ coupleStartDate ? coupleStartDate : '未设置' }}</view>
                </view>

                <picker mode="date" :value="coupleStartDate" @change="onPickDate">
                    <button class="row-action">修改</button>
                </picker>
            </view>

            <view class="divider"></view>

            <!-- 新增：经期长度 -->
            <view class="row">
                <view class="row-left">
                    <view class="row-title">经期长度：{{ periodLength }}天</view>
                    <view class="row-sub">您的月经大概几天</view>
                </view>

                <picker mode="selector" :range="periodOptions" :value="periodIndex" @change="onPickPeriodLength">
                    <button class="row-action">修改</button>
                </picker>
            </view>

            <view class="divider"></view>

            <!-- 新增：周期长度 -->
            <view class="row">
                <view class="row-left">
                    <view class="row-title">周期长度：{{ cycleLength }}天</view>
                    <view class="row-sub">两次月经开始日大概间隔多久</view>
                </view>

                <picker mode="selector" :range="cycleOptions" :value="cycleIndex" @change="onPickCycleLength">
                    <button class="row-action">修改</button>
                </picker>
            </view>

            <view class="divider"></view>

            <view class="row">
                <view class="row-left">
                    <view class="row-title">分享“我和你的重要时光”</view>
                    <view class="row-sub">发给 TA 一起用</view>
                </view>

                <button class="row-action" open-type="share">分享</button>
            </view>

            <view class="divider"></view>

            <view class="row" @tap="goAbout">
                <view class="row-left">
                    <view class="row-title">关于</view>
                    <view class="row-sub">版本信息与说明</view>
                </view>

                <button class="row-action">查看</button>
            </view>
        </view>

        <!-- 遮罩：用 catchtap，避免抢弹窗内部点击 -->
        <view v-if="showSheet" class="mask" @touchmove.stop.prevent="noop" @tap.stop.prevent="closeSheet">
            <!-- 弹窗本体：catchtap 阻止事件冒泡到遮罩 -->
            <view class="sheet" @tap.stop.prevent="noop">
                <view class="sheet-header">
                    <view class="sheet-handle"></view>
                    <view class="sheet-title">登录</view>
                </view>

                <view class="sheet-body">
                    <!-- 头像行 -->
                    <view class="field avatar-field">
                        <view v-if="!draftAvatarUrl" class="field-main">
                            <view class="field-label">头像</view>
                            <view class="field-value placeholder">点击选择</view>
                        </view>

                        <view v-else class="avatar-only-wrap">
                            <image class="avatar-only" :src="draftAvatarUrl" mode="aspectFill"></image>
                        </view>

                        <button class="cover-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar"></button>
                    </view>

                    <!-- 昵称行：没选昵称显示输入；选了后只显示昵称并居中 -->
                    <view class="field nickname-field">
                        <view v-if="!draftNickName" class="field-main">
                            <view class="field-label">昵称</view>
                            <input class="field-input" type="nickname" placeholder="使用微信昵称（或手动输入）" :value="draftNickName" @input="onNickInput" />
                        </view>

                        <view v-else class="nickname-only">
                            {{ draftNickName }}
                        </view>
                    </view>

                    <!-- 确定 -->
                    <button class="action primary" @tap="confirmLogin">确定</button>

                    <!-- 退出登录：样式同“确定”，白底红字；用 bindtap 更稳 -->
                    <button v-if="isLoggedIn" class="action danger" @tap="logout">退出登录</button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
const storage = require('../../utils/storage');
const PERIOD_STORE_KEY = 'period_record_v1';
const DEFAULTS = {
    cycleLength: 28,
    periodLength: 5,
    lutealDays: 14
};
function loadPeriodSettings() {
    const v = uni.getStorageSync(PERIOD_STORE_KEY);
    const settings = v && v.settings ? v.settings : {};
    return {
        cycleLength: Number(settings.cycleLength || DEFAULTS.cycleLength),
        periodLength: Number(settings.periodLength || DEFAULTS.periodLength)
    };
}
function savePeriodSettings(next) {
    const v = uni.getStorageSync(PERIOD_STORE_KEY) || {};
    const oldSettings = v && v.settings ? v.settings : {};
    v.settings = {
        ...DEFAULTS,
        ...oldSettings,
        ...next
    };
    uni.setStorageSync(PERIOD_STORE_KEY, v);
}
export default {
    data() {
        return {
            draftAvatarUrl: '',
            defaultAvatar: '/static/assets/images/default-avatar.png',
            userProfile: null,
            isLoggedIn: false,
            coupleStartDate: '',
            showSheet: false,
            draftAvatarUrl: '',
            draftNickName: '',
            // 经期/周期设置（只新增，不动原逻辑）
            periodLength: DEFAULTS.periodLength,
            cycleLength: DEFAULTS.cycleLength,
            periodOptions: [],
            cycleOptions: [],
            periodIndex: 0,
            cycleIndex: 0
        };
    },
    onShow() {
        if (this.getTabBar && this.getTabBar()) {
            this.getTabBar().setSelected(3);
        }
        const profile = storage.getUserProfile ? storage.getUserProfile() : null;
        const isLoggedIn = !!(profile && profile.nickName);

        // 读取经期/周期设置（来自 period_record_v1.settings）
        const s = loadPeriodSettings();
        const periodOptions = [];
        for (let i = 2; i <= 20; i++) {
            periodOptions.push(i);
        }
        const cycleOptions = [];
        for (let i = 16; i <= 60; i++) {
            cycleOptions.push(i);
        }
        const periodIndex = Math.max(0, periodOptions.indexOf(s.periodLength));
        const cycleIndex = Math.max(0, cycleOptions.indexOf(s.cycleLength));
        this.setData({
            userProfile: isLoggedIn ? profile : null,
            isLoggedIn,
            coupleStartDate: storage.getCoupleStartDate ? storage.getCoupleStartDate() || '' : '',
            periodLength: s.periodLength,
            cycleLength: s.cycleLength,
            periodOptions,
            cycleOptions,
            periodIndex,
            cycleIndex
        });
    },
    onShareAppMessage() {
        return {
            title: '重要日子：记录我们在一起的每一天',
            path: '/pages/home/home'
        };
    },
    methods: {
        openLoginSheet() {
            const p = this.userProfile || {};
            this.setData({
                showSheet: true,
                draftAvatarUrl: p.avatarUrl || '',
                draftNickName: p.nickName || ''
            });
        },

        closeSheet() {
            this.setData({
                showSheet: false
            });
        },

        onChooseAvatar(e) {
            const avatarUrl = e.detail && e.detail.avatarUrl ? e.detail.avatarUrl : '';
            if (!avatarUrl) {
                return;
            }
            this.setData({
                draftAvatarUrl: avatarUrl
            });
        },

        onNickInput(e) {
            this.setData({
                draftNickName: e.detail.value || ''
            });
        },

        confirmLogin() {
            const nickName = (this.draftNickName || '').trim();
            const avatarUrl = this.draftAvatarUrl || '';
            if (!nickName) {
                uni.showToast({
                    title: '请先填写昵称',
                    icon: 'none'
                });
                return;
            }
            const profile = {
                nickName,
                avatarUrl
            };
            storage.setUserProfile(profile);
            this.setData({
                userProfile: profile,
                isLoggedIn: true,
                showSheet: false
            });
            uni.showToast({
                title: '已保存',
                icon: 'success'
            });
        },

        // 退出登录：清空如下
        // 头像昵称   在一起日期   重要日子列表
        // “经期记录”缓存 period_record_v1（只加清理，不改原逻辑）
        logout() {
            console.log('logout tapped');
            uni.showModal({
                title: '退出登录',
                content: '退出后将清空所有本地数据：在一起日期、重要日子列表、经期记录等。',
                confirmText: '退出',
                confirmColor: '#e5484d',
                success: (res) => {
                    console.log('showModal success:', res);
                    if (!res.confirm) {
                        return;
                    }
                    try {
                        if (storage && typeof storage.clearAllLocalData === 'function') {
                            storage.clearAllLocalData();
                            // 兜底再删一次：确保“经期记录”一定被清掉（即使 storage.js 版本不同）
                            try {
                                uni.removeStorageSync(PERIOD_STORE_KEY);
                            } catch (e) {
                                console.log('CatchClause', e);
                                console.log('CatchClause', e);
                            }
                            console.log('clearAllLocalData ok');
                        } else {
                            console.log('clearAllLocalData not found, fallback remove keys');
                            uni.removeStorageSync('USER_PROFILE');
                            uni.removeStorageSync('COUPLE_START_DATE');
                            uni.removeStorageSync('IMPORTANT_DAYS_LIST');
                            uni.removeStorageSync('userProfile');
                            // fallback 也清掉“经期记录”
                            try {
                                uni.removeStorageSync(PERIOD_STORE_KEY);
                            } catch (e) {
                                console.log('CatchClause', e);
                                console.log('CatchClause', e);
                            }
                        }
                    } catch (err) {
                        console.log('CatchClause', err);
                        console.log('CatchClause', err);
                        console.error('clear local data error:', err);
                        try {
                            uni.clearStorageSync();
                            console.log('wx.clearStorageSync ok');
                        } catch (e2) {
                            console.log('CatchClause', e2);
                            console.log('CatchClause', e2);
                            console.error('wx.clearStorageSync failed:', e2);
                        }
                    }
                    this.setData({
                        userProfile: null,
                        isLoggedIn: false,
                        coupleStartDate: '',
                        draftAvatarUrl: '',
                        draftNickName: '',
                        showSheet: false
                    });
                    uni.showToast({
                        title: '已清空',
                        icon: 'success'
                    });
                    uni.switchTab({
                        url: '/pages/home/home',
                        success: () => console.log('switchTab ok'),
                        fail: (e) => {
                            console.error('switchTab failed:', e);
                            uni.reLaunch({
                                url: '/pages/home/home'
                            });
                        }
                    });
                },
                fail: (err) => {
                    console.error('showModal failed:', err);
                    uni.showToast({
                        title: '弹窗调用失败',
                        icon: 'none'
                    });
                },
                complete: () => {
                    console.log('showModal complete');
                }
            });
        },

        onPickDate(e) {
            const dateStr = e.detail.value;
            storage.setCoupleStartDate(dateStr);
            this.setData({
                coupleStartDate: dateStr
            });
            uni.showToast({
                title: '已保存',
                icon: 'success'
            });
        },

        // 新增：经期长度修改
        onPickPeriodLength(e) {
            const idx = Number(e.detail.value);
            const val = this.periodOptions[idx];
            savePeriodSettings({
                periodLength: val
            });
            this.setData({
                periodLength: val,
                periodIndex: idx
            });
            uni.showToast({
                title: '已保存',
                icon: 'success'
            });
        },

        // 新增：周期长度修改
        onPickCycleLength(e) {
            const idx = Number(e.detail.value);
            const val = this.cycleOptions[idx];
            savePeriodSettings({
                cycleLength: val
            });
            this.setData({
                cycleLength: val,
                cycleIndex: idx
            });
            uni.showToast({
                title: '已保存',
                icon: 'success'
            });
        },

        goAbout() {
            uni.navigateTo({
                url: '/pages/about/about'
            });
        },

        noop() {}
    }
};
</script>
<style>
@import './me.css';
</style>
