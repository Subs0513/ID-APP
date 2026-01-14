<template>
    <!-- pages/about/intro/intro.wxml -->
    <view class="page">
        <!-- 头部白色卡片 -->
        <view class="header-card">
            <text class="title">高小雅个人定制版</text>
            <text class="subtitle">把和小雅的重要日子，都放进这里</text>
        </view>

        <!-- 单一大卡片 -->
        <view class="card">
            <view class="section" v-for="(item, index) in sections" :key="index">
                <view class="sec-title-row">
                    <text class="sec-title">{{ item.title }}</text>
                    <text v-if="item.isNew" class="new-tag">NEW</text>
                </view>

                <text class="sec-desc">{{ item.desc }}</text>

                <view class="items" v-if="item.items && item.items.length">
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
// pages/about/intro/intro.js
export default {
    data() {
        return {
            sections: [
                {
                    title: '版本介绍',
                    desc: '高小雅个人定制版，一切功能听从小雅需求',
                    // items: ['相识 / 第一次见面 / ... '],
                },
                {
                    title: '功能介绍',
                    // desc: '描述',
                    items: ['记录重要日子', '经期记录', '。。。']
                }
            ]
        };
    },
    methods: {}
};
</script>
<style>
@import './intro.css';
</style>
