<template>
  <view v-if="show" class="dw-mask" @tap="onMaskTap">
    <view class="dw-sheet" @tap.stop>
      <!-- 顶部栏 -->
      <view class="dw-top">
        <view class="dw-btn" @tap="onCancel">取消</view>

        <view class="dw-mid">
          <text v-if="subtitle" class="dw-subtitle">{{ subtitle }}</text>
          <text class="dw-title">{{ title }}</text>
        </view>

        <view class="dw-btn dw-ok" @tap="onOk">确定</view>
      </view>

      <!-- 滚轮区：单列 -->
      <view class="tw-wheel-wrap">
        <picker-view
          class="tw-picker"
          :value="[tempIndex]"
          :indicator-style="indicatorStyle"
          @change="onPickerChange"
        >
          <picker-view-column>
            <view
              class="tw-row"
              :class="idx === tempIndex ? 'tw-row-active' : ''"
              v-for="(opt, idx) in options"
              :key="opt.value || idx"
            >
              <text class="tw-row-text">{{ opt.text }}</text>
            </view>
          </picker-view-column>
        </picker-view>

        <!-- 自己画的高亮框（和 YMD-Wheel 同风格） -->
        <view class="tw-indicator"></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'TypeWheel',
  props: {
    show: { type: Boolean, default: false },
    title: { type: String, default: '选择类型' },
    subtitle: { type: String, default: '' },
    options: { type: Array, default: () => [] },
    activeIndex: { type: Number, default: 0 },
    maskClosable: { type: Boolean, default: true }
  },
  data() {
    return {
      tempIndex: 0,
      // ✅ 关键：系统 indicator 高度必须 96rpx，并且背景透明（不然会叠一层灰）
      indicatorStyle: 'height: 96rpx; background-color: rgba(0,0,0,0);'
    };
  },
  watch: {
    show(val) {
      if (val) this.tempIndex = this.normalizeIndex(this.activeIndex);
    },
    activeIndex(val) {
      if (this.show) this.tempIndex = this.normalizeIndex(val);
    },
    options() {
      this.tempIndex = this.normalizeIndex(this.tempIndex);
    }
  },
  mounted() {
    this.tempIndex = this.normalizeIndex(this.activeIndex);
  },
  methods: {
    normalizeIndex(i) {
      const len = (this.options && this.options.length) || 0;
      if (!len) return 0;
      const n = Number(i);
      if (Number.isNaN(n)) return 0;
      if (n < 0) return 0;
      if (n > len - 1) return len - 1;
      return n;
    },
    close() {
      this.$emit('update:show', false);
    },
    onMaskTap() {
      if (!this.maskClosable) return;
      this.onCancel();
    },
    onPickerChange(e) {
      const v = (e && e.detail && e.detail.value) ? e.detail.value : [0];
      this.tempIndex = this.normalizeIndex(v[0]);
    },
    onCancel() {
      this.$emit('cancel');
      this.close();
    },
    onOk() {
      const index = this.normalizeIndex(this.tempIndex);
      const option = this.options && this.options.length ? this.options[index] : null;
      this.$emit('confirm', index, option);
      this.close();
    }
  }
};
</script>

<style scoped>
@import "./Type-Wheel.css";
</style>
