<template>
    <!-- pages/about/intro/intro.wxml -->
    <view class="page">
        <!-- 头部白色卡片 -->
        <view class="header-card">
            <text class="title">功能介绍</text>
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
                    title: '重要日子管理',
                    desc: '把纪念日、倒计时、生日等重要时间记录下来。',
                    items: ['支持新增 / 编辑 / 删除', '支持正数/倒数计算（可包含起始日）', '支持置顶显示']
                },
                {
                    title: '主页卡片拖拽排序',
                    desc: '长按卡片可上下拖动，自定义你喜欢的顺序。',
                    isNew: true,
                    items: ['拖动后自动保存排序', '优化拖动手感与回弹逻辑']
                },
                {
                    title: '经期记录与预测',
                    desc: '记录经期开始日，结合周期/经期长度进行预测展示。',
                    items: ['记录经期开始/结束', '浅色展示预测经期', '支持修改周期长度与经期长度']
                },
                {
                    title: '备注与提示',
                    desc: '给某一天写点小备注，日历上会出现一个小点提示。',
                    items: ['备注支持多行输入', '有备注的日期会显示提示小点']
                },
                {
                    title: '隐私与数据',
                    desc: '数据仅存储在本地，退出登录时可自动清除个人缓存。',
                    items: ['退出登录自动删除个人数据缓存', '提供服务协议与隐私政策入口']
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
