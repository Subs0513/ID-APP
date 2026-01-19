<template>
  <view class="privacy-mask" @touchmove.stop.prevent="noop">
    <view class="privacy-card">
      <view class="privacy-title">服务协议和隐私政策</view>

      <scroll-view class="privacy-content" scroll-y>
        <text class="p">
          欢迎使用本应用！我们非常重视您的个人信息和隐私保护。
          在您使用本应用前，请您务必仔细阅读并充分理解
        </text>

        <text class="link" @tap="$emit('open','privacy')">《隐私政策》</text>
        <text class="p">和</text>
        <text class="link" @tap="$emit('open','agreement')">《用户协议》</text>
        <text class="p">。</text>

        <view class="gap"></view>

        <text class="p">
          为向您提供记录、统计等功能，我们可能会在您授权的情况下申请访问网络、相机、相册等系统权限。
          这些权限不会默认开启，仅在您主动使用相关功能时才会请求。
        </text>

        <view class="gap"></view>

        <text class="p">
          未经您的同意，我们不会收集、使用或向第三方披露您的个人信息。
          具体内容请您详细阅读上述协议。
        </text>

        <view class="gap"></view>

        <text class="p">
          如果您同意以上内容，请点击「同意并继续」开始使用本应用；
          若不同意，很遗憾我们将无法继续为您提供服务。
        </text>
      </scroll-view>

      <view class="btn-row">
        <view class="btn ghost" @tap="$emit('reject')">不同意</view>
        <view class="btn primary" @tap="$emit('agree')">同意并继续</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PrivacyPopup',
  methods: {
    noop() {}
  }
};
</script>

<style scoped>
/* 全屏遮罩 */
.privacy-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.38);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 26rpx;
  z-index: 9999;
}

/* 白色卡片（大圆角） */
.privacy-card {
  width: 100%;
  background: #ffffff;
  border-radius: 36rpx;
  padding: 34rpx 28rpx 28rpx;
  box-sizing: border-box;
  box-shadow: 0 18rpx 60rpx rgba(0, 0, 0, 0.12);
}

/* 标题 */
.privacy-title {
  text-align: center;
  font-size: 34rpx;
  font-weight: 800;
  color: #222;
  letter-spacing: 1rpx;
  margin-bottom: 22rpx;
}

/* 内容滚动区 */
.privacy-content {
  max-height: 560rpx;
  padding: 0 6rpx;
  box-sizing: border-box;
}

/* 段落 */
.p {
  font-size: 28rpx;
  color: #3a3a3a;
  line-height: 46rpx;
}

/* 链接（粉色风格） */
.link {
  font-size: 28rpx;
  color: #ff5f92;
  line-height: 46rpx;
  font-weight: 700;
}

/* 段落间距（避免 text 里不好控制） */
.gap {
  height: 14rpx;
}

/* 按钮行 */
.btn-row {
  display: flex;
  gap: 18rpx;
  margin-top: 26rpx;
}

/* 通用按钮 */
.btn {
  flex: 1;
  height: 90rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
}

/* 不同意：描边按钮 */
.btn.ghost {
  background: #ffffff;
  border: 2rpx solid #e2e2e2;
  color: #555;
}

/* 同意：粉色渐变按钮 */
.btn.primary {
  background: linear-gradient(135deg, #ff86b2, #ff5f92);
  color: #ffffff;
}
</style>
