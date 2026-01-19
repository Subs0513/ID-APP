<template>
  <view class="page">
    <!-- 顶部：账号卡 -->
    <view class="card user-card">
      <image class="avatar" :src="displayAvatar" mode="aspectFill" />

      <view class="user-info">
        <view class="nickname">{{ displayName }}</view>
        <view class="desc">
          <text v-if="isAuthed">手机号：{{ maskedPhone }}</text>
          <text v-else>未登录（本地数据可用）</text>
        </view>
      </view>

      <button class="primary-pill" @tap="openLoginSheet">
        {{ isAuthed ? '账号' : '登录' }}
      </button>
    </view>

    <!-- 设置卡 -->
    <view class="card list-card">
      <!-- 在一起日期 -->
      <view class="row">
        <view class="row-left">
          <view class="row-title">我们在一起的日期</view>
          <view class="row-sub">起始日：{{ coupleStartDate ? coupleStartDate : '未设置' }}</view>
        </view>

        <!-- ✅ 改成组件：三列日期滚轮 -->
        <button class="row-action" @tap="openCoupleDateWheel">修改</button>
      </view>

      <view class="divider"></view>

      <!-- 经期长度（改成自写滚轮） -->
      <view class="row">
        <view class="row-left">
          <view class="row-title">经期长度：{{ periodLength }}天</view>
          <view class="row-sub">您的月经大概几天</view>
        </view>

        <button class="row-action" @tap="openPeriodWheel">修改</button>
      </view>

      <view class="divider"></view>

      <!-- 周期长度（改成自写滚轮） -->
      <view class="row">
        <view class="row-left">
          <view class="row-title">周期长度：{{ cycleLength }}天</view>
          <view class="row-sub">两次月经开始日大概间隔多久</view>
        </view>

        <button class="row-action" @tap="openCycleWheel">修改</button>
      </view>
    </view>

    <!-- 账号与数据 -->
    <view class="card list-card">
      
	  <view class="row" @tap="confirmClear">
	    <view class="row-left">
	      <view class="row-title danger-title">清空本地数据</view>
	      <view class="row-sub">删除本机数据缓存（不可恢复）</view>
	    </view>
	    <button class="row-action danger-btn">清空</button>
	  </view>
	  
	  <view class="divider"></view>
	  
	  <view class="row" @tap="onShare">
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

    <!-- 登录弹层：手机号验证码（保留原样） -->
    <view v-if="showSheet" class="mask" @tap="closeLoginSheet">
      <view class="sheet" @tap.stop="noop">
        <view class="sheet-header">
          <view class="sheet-handle"></view>
          <view class="sheet-title">{{ isAuthed ? '账号管理' : '手机号登录' }}</view>
        </view>

        <view class="sheet-body">
          <!-- 已登录：显示手机号 + 退出 -->
          <view v-if="isAuthed" class="authed-box">
            <view class="authed-line">当前账号：{{ maskedPhone }}</view>

            <view class="field">
              <view class="field-label">昵称（本地）</view>
              <input class="field-input" placeholder="给自己取个昵称" :value="draftNickName" @input="onNickInput" />
            </view>

            <view class="field">
              <view class="field-label">头像（本地）</view>
              <view class="avatar-pick">
                <image class="avatar-only" :src="draftAvatarUrl || defaultAvatar" mode="aspectFill" />
                <button class="small-btn" @tap="pickAvatar">更换</button>
              </view>
            </view>

            <button class="action primary" @tap="saveLocalProfile">保存</button>
            <button class="action danger" @tap="logoutOnly">退出登录</button>
          </view>

          <!-- 未登录：手机号 + 验证码 -->
          <view v-else>
            <view class="field">
              <view class="field-label">手机号</view>
              <input
                class="field-input"
                type="number"
                maxlength="11"
                placeholder="请输入手机号"
                :value="phone"
                @input="onPhoneInput"
              />
            </view>

            <view class="field code-field">
              <view class="field-label">验证码</view>
              <view class="code-row">
                <input
                  class="field-input code-input"
                  type="number"
                  maxlength="6"
                  placeholder="6位验证码"
                  :value="code"
                  @input="onCodeInput"
                />
                <button class="send-btn" :disabled="sendDisabled" @tap="sendCode">
                  {{ sendBtnText }}
                </button>
              </view>
            </view>

            <button class="action primary" :disabled="loginDisabled" @tap="loginWithPhone">登录</button>

            <view class="tip">
              说明：目前仅本地登录态演示；接入短信接口与服务端 token 后将开启云同步。
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ✅ 自写滚轮弹层：单列 picker-view（经期 / 周期共用） -->
    <view v-if="showWheel" class="w-mask" @tap="closeWheel">
      <view class="w-sheet" @tap.stop="noop">
        <view class="w-top">
          <text class="w-btn" @tap="closeWheel">取消</text>
          <text class="w-title">{{ wheelTitle }}</text>
          <text class="w-btn w-ok" @tap="confirmWheel">完成</text>
        </view>

        <view class="w-body">
          <picker-view
            class="w-picker"
            :value="[wheelIndex]"
            @change="onWheelChange"
            :indicator-style="'height: 88rpx;'"
            :mask-style="'background: transparent;'"
          >
            <picker-view-column>
              <view
                v-for="(it, i) in wheelOptions"
                :key="'w-'+i"
                :class="['w-item', i === wheelDraftIndex ? 'w-item-active' : '']"
              >
                {{ it }}天
              </view>
            </picker-view-column>
          </picker-view>

          <!-- 中间高亮框（更“自家风格”） -->
          <view class="w-indicator"></view>
        </view>
      </view>
    </view>

    <!-- ✅ 三列日期滚轮组件（我们在一起的日期） -->
	<!-- subtitle="选择未来日期倒数，选择过去日期正数" -->
	
    <YMDWheel
      :show="showDateWheel"
      :value="coupleStartDate"
      title="我们在一起的日期"
      @cancel="closeCoupleDateWheel"
      @confirm="onCoupleDateConfirm"
    />
  </view>
</template>

<script>
const storage = require('../../utils/storage');
import YMDWheel from '@/components/YMD-Wheel/YMD-Wheel.vue';

const PERIOD_STORE_KEY = 'period_record_v1';
const AUTH_KEY = 'phone_auth_v1';

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
function maskPhone(p) {
  const s = String(p || '');
  if (s.length < 7) return s;
  return s.slice(0, 3) + '****' + s.slice(-4);
}

export default {
  components: { YMDWheel },

  data() {
    return {
      defaultAvatar: '/assets/icons/default_avatar.png',
      coupleStartDate: '',

      // 本地资料
      userProfile: null,
      draftAvatarUrl: '',
      draftNickName: '',

      // 手机号登录
      showSheet: false,
      phone: '',
      code: '',
      countdown: 0,
      timer: null,

      // auth
      auth: null,
      isAuthed: false,

      // 经期/周期
      periodLength: DEFAULTS.periodLength,
      cycleLength: DEFAULTS.cycleLength,

      // ✅ 自写滚轮相关
      showWheel: false,
      wheelType: '', // 'period' | 'cycle'
      wheelTitle: '',
      wheelOptions: [],
      wheelIndex: 0, // picker-view 用 index
      wheelDraftIndex: 0, // change 时暂存，点完成才提交

      // ✅ 日期滚轮组件：只需要开关
      showDateWheel: false
    };
  },

  computed: {
    displayName() {
      const p = this.userProfile;
      if (p && p.nickName) return p.nickName;
      return this.isAuthed ? '已登录用户' : '未登录';
    },
    displayAvatar() {
      const p = this.userProfile;
      if (p && p.avatarUrl) return p.avatarUrl;
      return this.defaultAvatar;
    },
    maskedPhone() {
      return maskPhone(this.auth && this.auth.phone);
    },
    sendDisabled() {
      return this.countdown > 0 || !this.isValidPhone(this.phone);
    },
    sendBtnText() {
      return this.countdown > 0 ? `${this.countdown}s` : '发送';
    },
    loginDisabled() {
      return !this.isValidPhone(this.phone) || String(this.code || '').length < 4;
    }
  },

  onShow() {
    // 本地资料
    const profile = storage.getUserProfile ? storage.getUserProfile() : null;
    this.setData({
      userProfile: profile || null,
      draftAvatarUrl: (profile && profile.avatarUrl) || '',
      draftNickName: (profile && profile.nickName) || ''
    });

    // 在一起日期
    const date = storage.getCoupleStartDate ? storage.getCoupleStartDate() : '';
    this.setData({ coupleStartDate: date || '' });

    // auth
    const a = uni.getStorageSync(AUTH_KEY) || null;
    const isAuthed = !!(a && a.phone && a.token);
    this.setData({ auth: a, isAuthed });

    // 经期/周期设置
    const s = loadPeriodSettings();
    this.setData({
      periodLength: s.periodLength,
      cycleLength: s.cycleLength
    });
  },

  onHide() {
    this.clearTimer();
  },

  methods: {
    // ================= 三列日期滚轮：我们在一起的日期（组件版） =================
    openCoupleDateWheel() {
      this.setData({ showDateWheel: true });
    },
    closeCoupleDateWheel() {
      this.setData({ showDateWheel: false });
    },
    onCoupleDateConfirm(dateStr) {
      // dateStr: YYYY-MM-DD（组件已保证格式与越界修正）
      storage.setCoupleStartDate && storage.setCoupleStartDate(dateStr);
      this.setData({ coupleStartDate: dateStr, showDateWheel: false });
      uni.showToast({ title: '已保存', icon: 'success' });
    },

    // ----------------- 登录弹层 -----------------
    openLoginSheet() {
      const p = this.userProfile || {};
      this.setData({
        showSheet: true,
        draftAvatarUrl: p.avatarUrl || '',
        draftNickName: p.nickName || ''
      });
    },
    closeLoginSheet() {
      this.setData({ showSheet: false });
    },
    noop() {},

    onPhoneInput(e) {
      const v = (e.detail && e.detail.value) || '';
      this.setData({ phone: v.replace(/\s/g, '') });
    },
    onCodeInput(e) {
      const v = (e.detail && e.detail.value) || '';
      this.setData({ code: v.replace(/\s/g, '') });
    },
    isValidPhone(p) {
      const s = String(p || '').trim();
      return /^1\d{10}$/.test(s);
    },
    sendCode() {
      if (this.sendDisabled) return;
      uni.showToast({ title: '验证码已发送（演示）', icon: 'none' });

      this.setData({ countdown: 60 });
      this.clearTimer();
      this.timer = setInterval(() => {
        const next = Math.max(0, (this.countdown || 0) - 1);
        this.setData({ countdown: next });
        if (next <= 0) this.clearTimer();
      }, 1000);
    },
    loginWithPhone() {
      if (this.loginDisabled) return;
      const token = 'mock_' + Date.now();
      const a = { phone: String(this.phone), token, at: Date.now() };
      uni.setStorageSync(AUTH_KEY, a);
      this.setData({
        auth: a,
        isAuthed: true,
        showSheet: false,
        code: ''
      });
      uni.showToast({ title: '登录成功', icon: 'success' });
    },
    logoutOnly() {
      uni.removeStorageSync(AUTH_KEY);
      this.setData({
        auth: null,
        isAuthed: false,
        showSheet: false
      });
      uni.showToast({ title: '已退出', icon: 'success' });
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    onNickInput(e) {
      const v = (e.detail && e.detail.value) || '';
      this.setData({ draftNickName: v });
    },
    pickAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        success: (res) => {
          const url = (res.tempFilePaths && res.tempFilePaths[0]) || '';
          this.setData({ draftAvatarUrl: url });
        }
      });
    },
    saveLocalProfile() {
      const nickName = String(this.draftNickName || '').trim();
      if (!nickName) {
        uni.showToast({ title: '请先填写昵称', icon: 'none' });
        return;
      }
      const profile = {
        nickName,
        avatarUrl: this.draftAvatarUrl || ''
      };
      storage.setUserProfile && storage.setUserProfile(profile);
      this.setData({ userProfile: profile });
      uni.showToast({ title: '已保存', icon: 'success' });
      this.closeLoginSheet();
    },

    // ----------------- ✅ 自写滚轮：经期/周期 -----------------
    openPeriodWheel() {
      const opts = [];
      for (let i = 2; i <= 20; i++) opts.push(i);
      const idx = Math.max(0, opts.indexOf(Number(this.periodLength)));

      this.setData({
        showWheel: true,
        wheelType: 'period',
        wheelTitle: '经期长度',
        wheelOptions: opts,
        wheelIndex: idx,
        wheelDraftIndex: idx
      });
    },
    openCycleWheel() {
      const opts = [];
      for (let i = 16; i <= 60; i++) opts.push(i);
      const idx = Math.max(0, opts.indexOf(Number(this.cycleLength)));

      this.setData({
        showWheel: true,
        wheelType: 'cycle',
        wheelTitle: '周期长度',
        wheelOptions: opts,
        wheelIndex: idx,
        wheelDraftIndex: idx
      });
    },
    closeWheel() {
      this.setData({ showWheel: false });
    },
    onWheelChange(e) {
      const v = e && e.detail && e.detail.value ? e.detail.value : [0];
      const idx = Number(v[0] || 0);
      this.setData({ wheelDraftIndex: idx });
    },
    confirmWheel() {
      const idx = Number(this.wheelDraftIndex || 0);
      const val = this.wheelOptions[idx];

      if (this.wheelType === 'period') {
        savePeriodSettings({ periodLength: Number(val) });
        this.setData({ periodLength: Number(val) });
      } else if (this.wheelType === 'cycle') {
        savePeriodSettings({ cycleLength: Number(val) });
        this.setData({ cycleLength: Number(val) });
      }

      this.setData({ showWheel: false });
      uni.showToast({ title: '已保存', icon: 'success' });
    },

    // ----------------- 清空 -----------------
    confirmClear() {
      uni.showModal({
        title: '确认清空？',
        content: '将删除本机所有缓存数据（包括重要日子、经期记录等），不可恢复。',
        confirmText: '清空',
        confirmColor: '#e5484d',
        success: (res) => {
          if (res.confirm) {
            try {
              uni.clearStorageSync();
            } catch (e) {
              try {
                uni.removeStorageSync(AUTH_KEY);
                uni.removeStorageSync(PERIOD_STORE_KEY);
              } catch (e2) {}
            }

            this.setData({
              userProfile: null,
              draftAvatarUrl: '',
              draftNickName: '',
              auth: null,
              isAuthed: false,
              phone: '',
              code: '',
              coupleStartDate: '',
              showSheet: false,
              showWheel: false,
              showDateWheel: false
            });

            uni.showToast({ title: '已清空', icon: 'success' });
            uni.switchTab({ url: '/pages/home/home' });
          }
        }
      });
    },

    goAbout() {
      uni.navigateTo({ url: '/pages/about/about' });
    },

    onShare() {
      // open-type="share" 处理
    }
  }
};
</script>

<style>
@import './me.css';
</style>
