<template>
    <view>
        <view class="about-page">
            <!-- 顶部 App 信息 -->
            <view class="app-header">
                <image class="app-logo" src="/static/assets/images/app.png" mode="aspectFit" />
                <text class="app-version">Version: {{ version }}</text>
            </view>

            <!-- 功能卡片 -->
            <view class="card">
                <view class="card-item" hover-class="card-item-active" @tap="onIntro">
                    <view class="left">
                        <image class="item-icon" src="/static/assets/icons/f_gnjs.svg" />
                        <text class="item-text">功能介绍</text>
                    </view>
                    <text class="arrow">›</text>
                </view>

                <view class="divider"></view>

                <view class="card-item" hover-class="card-item-active" @tap="onFeedback">
                    <view class="left">
                        <image class="item-icon" src="/static/assets/icons/f_bzfk.svg" />
                        <text class="item-text">帮助反馈</text>
                    </view>
                    <text class="arrow">›</text>
                </view>

                <view class="divider"></view>

                <view class="card-item" hover-class="card-item-active" @tap="onChangelog">
                    <view class="left">
                        <image class="item-icon" src="/static/assets/icons/f_gxrz.svg" />
                        <text class="item-text">更新日志</text>
                    </view>
                    <text class="arrow">›</text>
                </view>
            </view>
        </view>

        <!-- 底部版权区 -->
        <view class="about-footer">
            <!-- 如果你也想要“服务协议 | 隐私政策”这种蓝色链接 -->
            <view class="footer-links">
                <text class="footer-link" @tap="onTapagreement">服务协议</text>
                <text class="footer-sep">|</text>
                <text class="footer-link" @tap="onTapPrivacy">隐私政策</text>
            </view>

            <view class="footer-text">
                <text>Copyright© 2025-2026 Sebastian. All Rights Reserved</text>
            </view>
            <view class="footer-text">
                <text>ICP 备案号：苏ICP备2025153648号-2X</text>
            </view>
            <view class="footer-text">
                <text></text>
            </view>

            <!-- iPhone 底部安全区撑一下（可选） -->
            <view class="safe-spacer"></view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            version: '0.0.1'
        };
    },
    onLoad() {
        // 如果以后想从全局或配置里读版本号，可以在这里改
    },
    methods: {
        /* 功能介绍 */
        onIntro() {
            // 示例：功能介绍页
            uni.navigateTo({
                url: '/pages/subabout/intro/intro'
            });
        },

        /* 帮助反馈 */
        onFeedback() {
            // 示例：反馈页
            // wx.navigateTo({ url: '/pages/subabout/feedback/feedback' })
        },

        /* 更新日志 */
        onChangelog() {
            // 示例：更新日志页
            uni.navigateTo({
                url: '/pages/subabout/changelog/changelog'
            });
        },

        // 服务协议
        onTapagreement() {
            uni.navigateTo({
                url: '/pages/subabout/agreement/agreement'
            });
        },

        // 隐私政策
        onTapPrivacy() {
            uni.navigateTo({
                url: '/pages/subabout/privacy/privacy'
            });
        }
    }
};
</script>
<style>
@import './about.css';
</style>
