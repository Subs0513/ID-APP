<script>
export default {
  globalData: {
    // 首页用这个来决定是否显示隐私弹窗
    needPrivacyPopup: false
  },

  onLaunch() {
    // 1) 保留你原来的 logs 逻辑
    const logs = uni.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    uni.setStorageSync('logs', logs);

    // 2) 首次启动隐私协议判断
    const KEY = 'privacy_agreed_v1';
    const agreed = !!uni.getStorageSync(KEY);

    // 用 globalData 传给首页
    this.globalData.needPrivacyPopup = !agreed;

    // （可选）也写一份到 storage，方便你调试或多页面读取
    // uni.setStorageSync('__need_privacy_popup', !agreed);

    // 3) 删除登录逻辑：uni.login（按你要求）
  }
};
</script>

<style>
@import './app.css';
</style>
