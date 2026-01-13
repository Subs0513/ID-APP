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
                    version: '1.0.0',
                    desc: '功能更新',
                    isLatest: true,
                    items: ['复写基本功能']
                },
                {
                    version: '0.0.0',
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
