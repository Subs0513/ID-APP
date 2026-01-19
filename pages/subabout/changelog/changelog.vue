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
				    version: '0.1.1',
				    desc: '新增功能',
				    isLatest: true,
				    items: ['新增“爱爱分析”和“体重分析”页','解决“痛经记录”数据不同步问题','解决了一些已知问题']
				},
				{
				    version: '0.1.0',
				    desc: '整体调整',
				    // isLatest: true,
				    items: ['程序更名为“时序·Chrona”','更新启动页']
				},
				{
				    version: '0.0.8',
				    desc: '页面调整',
				    // isLatest: true,
				    items: ['添加/编辑“重要日子”引入新日期选择滚轮','小幅调整“我”页面排序']
				},
				{
				    version: '0.0.7',
				    desc: '页面调整',
				    // isLatest: true,
				    items: ['新版本“我们在一起的日期”选择滚轮','新增使用弹窗','更新“隐私政策”、“用户协议”，新增“个人信息收集清单”']
				},
				{
				    version: '0.0.6',
				    desc: '页面调整',
				    // isLatest: true,
				    items: ['“经期记录”页面，点击未来日期隐藏操作按钮','对齐分析页爱爱记录数据']
				},
				{
				    version: '0.0.5',
				    desc: '页面调整',
				    // isLatest: true,
				    items: ['改进“我”页面','重写“爱爱记录“和”痛经记录“的页面'],
				},
				{
				    version: '0.0.4',
				    desc: '功能修复',
				    // isLatest: true,
				    items: ['改进“爱爱”弹窗布局','解决“滑动删除”失灵问题','修复翻页动画问题']
				},
				{
				    version: '0.0.3',
				    desc: '功能更新',
				    // isLatest: true,
				    items: ['全新健康分析页面']
				},
				{
				    version: '0.0.2',
				    desc: '功能更新',
				    // isLatest: true,
				    items: ['改进导航栏','改进“详情”页面']
				},
                {
                    version: '0.0.1',
                    desc: '功能更新',
                    // isLatest: true,
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
