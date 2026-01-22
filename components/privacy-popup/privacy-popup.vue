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
          为向您提供记录、统计等功能，我们可能会在您授权的情况下申请访问网络等系统权限。
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
	@import "./privacy-popup.css";
</style>
