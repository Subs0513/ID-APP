<template>
  <view class="page">
    <view class="container">
      <view class="card">
        <view class="title">个人信息收集清单</view>

        <view class="desc">
          本清单用于向你说明：我们在提供“我和你的重要时光”服务过程中，可能收集/使用的个人信息类型、使用目的、处理方式、保存期限与权限调用情况。
          我们遵循“最小必要”原则，仅在实现功能所必需的范围内处理个人信息。
        </view>

        <!-- 一、核心业务功能 -->
        <view class="section">
          <view class="section-title">一、核心业务功能（你主动提供的信息）</view>

          <scroll-view class="table-scroll" scroll-x show-scrollbar>
            <view class="table">
              <view class="tr th">
                <view class="td col1">功能/场景</view>
                <view class="td col2">收集信息类型</view>
                <view class="td col3">使用目的</view>
                <view class="td col4">处理方式/保存期限</view>
              </view>

              <view class="tr">
                <view class="td col1">重要日子记录</view>
                <view class="td col2">标题、日期、备注（如有）</view>
                <view class="td col3">展示与天数计算</view>
                <view class="td col4">默认本地存储；你删除记录/清除数据/卸载后删除</view>
              </view>

              <view class="tr">
                <view class="td col1">经期健康记录</view>
                <view class="td col2">经期开始/结束日期、周期设置、相关记录（如你使用）</view>
                <view class="td col3">统计展示与分析（仅供参考）</view>
                <view class="td col4">默认本地存储；你删除记录/清除数据/卸载后删除</view>
              </view>

              <view class="tr">
                <view class="td col1">体重记录</view>
                <view class="td col2">体重数值、记录日期</view>
                <view class="td col3">趋势图与统计展示</view>
                <view class="td col4">默认本地存储；你删除记录/清除数据/卸载后删除</view>
              </view>

              <view class="tr">
                <view class="td col1">个性化图片（可选）</view>
                <view class="td col2">你选择的图片文件（相册/相机）</view>
                <view class="td col3">背景/封面展示</view>
                <view class="td col4">默认本地使用；未启用云同步前不上传服务器</view>
              </view>
            </view>
          </scroll-view>

          <view class="hint">提示：左右滑动查看完整表格</view>
        </view>

        <!-- 二、安全与运行保障 -->
        <view class="section">
          <view class="section-title">二、安全与运行保障（最小必要信息）</view>

          <scroll-view class="table-scroll" scroll-x show-scrollbar>
            <view class="table">
              <view class="tr th">
                <view class="td col1">信息类型</view>
                <view class="td col2">可能包含</view>
                <view class="td col3">使用目的</view>
                <view class="td col4">处理方式/保存期限</view>
              </view>

              <view class="tr">
                <view class="td col1">设备信息</view>
                <view class="td col2">设备型号、系统版本、应用版本、屏幕分辨率等</view>
                <view class="td col3">适配与故障排查</view>
                <view class="td col4">仅用于运行与排查；不用于个性画像或广告</view>
              </view>

              <view class="tr">
                <view class="td col1">日志信息</view>
                <view class="td col2">崩溃日志、错误日志、性能信息（不含你输入内容原文）</view>
                <view class="td col3">定位问题、提升稳定性</view>
                <view class="td col4">最小必要范围内处理；用于修复后不再保留或按系统规则清理</view>
              </view>
            </view>
          </scroll-view>

          <view class="hint">提示：左右滑动查看完整表格</view>
        </view>

        <!-- 三、系统权限 -->
        <view class="section">
          <view class="section-title">三、系统权限调用清单</view>
          <view class="desc2">
            权限不会默认开启，仅在你主动触发相关功能时请求。你可在系统设置中随时关闭权限，关闭后对应功能可能无法使用。
          </view>

          <scroll-view class="table-scroll" scroll-x show-scrollbar>
            <view class="table">
              <view class="tr th">
                <view class="td col1">权限名称</view>
                <view class="td col2">调用时机</view>
                <view class="td col3">用途说明</view>
                <view class="td col4">是否必需</view>
              </view>

              <view class="tr">
                <view class="td col1">网络</view>
                <view class="td col2">需要访问在线页面/资源时</view>
                <view class="td col3">加载必要资源、查看在线说明</view>
                <view class="td col4">部分场景必需</view>
              </view>

              <view class="tr">
                <view class="td col1">相册/存储（可选）</view>
                <view class="td col2">你选择图片时</view>
                <view class="td col3">从相册选取图片用于展示</view>
                <view class="td col4">可选</view>
              </view>

              <view class="tr">
                <view class="td col1">相机（可选）</view>
                <view class="td col2">你拍摄图片时</view>
                <view class="td col3">拍摄图片用于展示</view>
                <view class="td col4">可选</view>
              </view>
            </view>
          </scroll-view>

          <view class="hint">提示：左右滑动查看完整表格</view>
        </view>

        <!-- 四、第三方SDK -->
        <view class="section">
          <view class="section-title">四、第三方 SDK / 第三方服务说明</view>
          <view class="desc2">
            本应用当前版本未接入任何第三方 SDK 或第三方服务组件（包括统计、广告、推送、地图、支付、社交分享等）。
            我们不会通过第三方 SDK 向第三方共享或委托处理你的个人信息。
          </view>
        </view>

        <view class="footer">
          <view>更新日期：2026年01月16日</view>
          <view>生效日期：2026年01月16日</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {};
  }
};
</script>

<style>
@import './info-list.css';
</style>
