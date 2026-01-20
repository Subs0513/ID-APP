<template>
    <view class="about-root">
        <!-- 内容区：占满剩余高度；内容过长时才滚动 -->
        <view class="about-content">
            <!-- 顶部 App 信息 -->
            <view class="app-header">
                <image class="app-logo" src="/static/assets/images/app.png" mode="aspectFit" />
                <text class="app-version">Mobile-Version: {{ version }}</text>
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

                <view class="divider"></view>

                <view class="card-item" hover-class="card-item-active" @tap="onTaplist">
                    <view class="left">
                        <image class="item-icon" src="/static/assets/icons/f_infolist.svg" />
                        <text class="item-text">个人信息收集清单</text>
                    </view>
                    <text class="arrow">›</text>
                </view>
            </view>
        </view>

        <!-- 底部版权区：放在文档流里，不再 fixed -->
        <view class="about-footer">
            <view class="footer-links">
                <text class="footer-link" @tap="onTapagreement">服务协议</text>
                <text class="footer-sep"> | </text>
                <text class="footer-link" @tap="onTapPrivacy">隐私政策</text>
            </view>

            <view class="footer-text">
                <text>Copyright© 2025-2026 Sebastian. All Rights Reserved</text>
            </view>
            <view class="footer-text">
                <!-- 小程序备案号 ：苏ICP备2025153648号-2X -->
                <text>ICP 小程序备案号 ：苏ICP备2025153648号-2X</text>
            </view>
            <view class="footer-text">
                <text><text>ICP 应用备案号：还没下来</text></text>
            </view>

            <!-- 底部安全区撑一下（用于全面屏底部） -->
            <view class="safe-spacer"></view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            version: '0.1.3'
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

        // 收集个人信息清单
        onTaplist() {
            uni.navigateTo({
                url: '/pages/subabout/info-list/info-list'
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
