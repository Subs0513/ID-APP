<template>
  <!-- pages/about/intro/intro.wxml -->
  <view class="page">
    <!-- 头部白色卡片 -->
    <view class="header-card">
      <text class="title">时序·Chrona</text>
	  <!-- <text class="title">时序·小雅定制版</text> -->
      <text class="subtitle">把重要的日子，一页一页夹在时间里</text>
    </view>

    <!-- 单一大卡片 -->
    <view class="card">
      <view class="section" v-for="(sec, index) in sections" :key="index">
        <view class="sec-title-row">
          <text class="sec-title">{{ sec.title }}</text>
          <text v-if="sec.isNew" class="new-tag">NEW</text>
        </view>

        <text class="sec-desc">{{ sec.desc }}</text>

        <view class="items" v-if="sec.items && sec.items.length">
          <view class="item" v-for="(txt, idx) in sec.items" :key="idx">
            <text class="dot">·</text>
            <text class="text">{{ txt }}</text>
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
          title: '记录重要的日子',
          desc: '将生活中值得记住的时刻集中记录，不论是纪念日、目标节点，还是个人里程碑，都可以清晰保存。',
          items: ['支持添加多个重要日子', '自动计算已过去的天数', '日期清晰展示，一眼可见']
        },
        {
          title: '周期与健康记录',
          desc: '提供基础的周期记录与统计功能，帮助用户更好地了解自身状态变化，通过长期记录形成可回顾的参考。',
          items: ['周期起止时间记录', '周期长度与稳定性分析', '数据仅保存在本地，注重隐私']
        },
        {
          title: '体重与身体变化',
          desc: '支持记录体重数据，自动按时间整理与展示变化趋势，帮助用户更直观地了解长期变化。',
          items: ['支持精确到小数的体重记录', '按日期展示历史数据', '变化趋势一目了然']
        },
        {
          title: '数据分析与总结',
          desc: '对已记录的数据进行简单整理与分析，提供清晰的阶段性总结，帮助用户从记录中获得实际参考价值。',
          items: ['周期与记录汇总展示', '自动生成阶段性概览', '信息清晰，不做复杂解读']
        },
        {
          title: '简洁、专注的设计',
          desc: '整体界面以简洁、柔和为设计原则，避免冗余干扰，让记录本身成为使用的核心。',
          items: ['无广告、无社交', '操作直观，逻辑清晰', '适合长期、低频但持续使用']
        },
        {
          title: '本地存储与隐私保护',
          desc: '所有数据默认保存在本地设备中，不主动上传、不做云同步；用户对自己的数据拥有完全控制权。',
          items: ['不强制登录', '不收集无关信息', '数据仅用于功能本身']
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
