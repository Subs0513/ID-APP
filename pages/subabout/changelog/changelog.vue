<template>
    <view class="page">
        <!-- 头部白色卡片 -->
        <view class="header-card">
            <text class="title">更新日志</text>
            <text class="subtitle">加班加点写新功能中……</text>
        </view>

        <!-- 单一大卡片 -->
        <view class="card">
            <view class="version-block" v-for="(item, index) in logs" :key="index">
                <view class="version-row">
                    <view class="ver-left">
                        <text class="version">v{{ item.version }}</text>
                        <!-- <text class="desc">{{item.desc}}</text> -->
                        <text v-if="item.isLatest" class="new-tag">NEW</text>
                        <text class="desc">{{ item.desc }}</text>
                    </view>
                </view>

                <view class="items">
                    <view class="item" v-for="(item, index1) in item.items" :key="index1">
                        <text class="dot">·</text>

                        <text class="text">{{ item }}</text>
                    </view>
                </view>
            </view>
        </view>

        <view class="footer-space"></view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            logs: [
                {
                    version: '1.2.7',
                    desc: '功能更新',
                    isLatest: true,
                    items: ['新增“痛经记录”功能', '新增“经期健康分析”功能']
                },
                {
                    version: '1.2.6',
                    desc: '功能更新',
                    // isLatest: true,
                    items: ['新增体重记录功能', '新建“痛经记录”按钮（具体功能未实现）']
                },
                {
                    version: '1.2.5',
                    desc: '小更新',
                    // isLatest: true,
                    items: ['更改一点细节', '新增“服务协议”和“隐私政策”', '新建“经期健康分析”入口（具体功能未实现）']
                },
                {
                    version: '1.2.4',
                    desc: '小更新',
                    // isLatest: true,
                    items: ['新增一点点图标']
                },
                {
                    version: '1.2.3',
                    desc: '修复',
                    items: ['修复详情页跳转问题']
                },
                {
                    version: '1.2.2',
                    desc: '优化',
                    items: ['改进拖动逻辑', '修改详情页逻辑']
                },
                {
                    version: '1.2.1',
                    desc: '功能增强',
                    items: ['新增主页卡片拖动功能', '新增编辑页保存后自动刷新']
                },
                {
                    version: '1.2.0',
                    desc: '重大更新',
                    items: ['大幅调整小程序配色', '调整日历布局', '更新经期计算逻辑']
                },
                {
                    version: '1.1.1',
                    desc: '体验优化',
                    items: ['更新配色和默认头像图片']
                },
                {
                    version: '1.1.0',
                    desc: '功能更新',
                    items: ['更新经期记录功能', '退出登录时自动删除个人数据缓存']
                },
                {
                    version: '1.0.1',
                    desc: '修复',
                    items: ['更新登录功能']
                },
                {
                    version: '1.0.0',
                    desc: '初始版本',
                    items: ['基本框架']
                }
            ]
        };
    },
    methods: {}
};
</script>
<style>
@import './changelog.css';
</style>
