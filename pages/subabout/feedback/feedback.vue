<template>
  <view class="page">
    <view class="card">
      <view class="title">自测：上传到服务器</view>
      <view class="desc">
        点击按钮会向
        <text class="mono">/api/sync/upload</text>
        上传一段测试 payload。
      </view>

      <button type="primary" :loading="loading" @click="testUpload">
        {{ loading ? '上传中...' : '自测上传到服务器' }}
      </button>

      <view v-if="result" class="result">
        <view class="row"><text class="k">状态：</text><text class="v">{{ result.ok ? '成功' : '失败' }}</text></view>
        <view class="row"><text class="k">deviceId：</text><text class="v mono">{{ result.deviceId }}</text></view>
        <view class="row"><text class="k">requestId：</text><text class="v mono">{{ result.requestId }}</text></view>
        <view v-if="result.message" class="row"><text class="k">信息：</text><text class="v">{{ result.message }}</text></view>
      </view>
    </view>
  </view>
</template>

<script>
// 你的 utils 在项目根目录 utils/，而这个页面在 pages/about/feedback/
// 相对路径应为：../../../utils/syncClient.js
import { uploadWithRetry, getOrCreateDeviceId } from '../../../utils/syncClient.js'

export default {
  data() {
    return {
      loading: false,
      result: null
    }
  },
  methods: {
    async testUpload() {
      if (this.loading) return
      this.loading = true
      this.result = null

      const payload = {
        test: true,
        from: 'uni-app',
        at: Date.now(),
        deviceIdPreview: getOrCreateDeviceId(),
        sample: { hello: 1 }
      }

      try {
        const r = await uploadWithRetry(payload, 1)
        // r: { ok, statusCode, data, requestId, deviceId }
        this.result = {
          ok: true,
          deviceId: r.deviceId,
          requestId: r.requestId,
          message: `status=${r.statusCode}, server=${JSON.stringify(r.data)}`
        }
        uni.showToast({ title: '上传成功', icon: 'success' })
        console.log('upload ok:', r)
      } catch (e) {
        this.result = {
          ok: false,
          deviceId: e.deviceId || '',
          requestId: e.requestId || '',
          message: e.data ? JSON.stringify(e.data) : (e.error ? JSON.stringify(e.error) : JSON.stringify(e))
        }
        uni.showToast({ title: '上传失败', icon: 'none' })
        console.log('upload fail:', e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.06);
}
.title {
  font-size: 34rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.desc {
  color: #666;
  font-size: 26rpx;
  line-height: 38rpx;
  margin-bottom: 20rpx;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.result {
  margin-top: 18rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 16rpx;
}
.row {
  display: flex;
  margin-bottom: 8rpx;
}
.k {
  width: 140rpx;
  color: #333;
  font-weight: 600;
}
.v {
  flex: 1;
  color: #333;
}
</style>
