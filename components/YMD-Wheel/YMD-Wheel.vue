<template>
  <view v-if="show" class="dw-mask" @tap="onCancel">
    <view class="dw-sheet" @tap.stop="noop">
      <view class="dw-top">
        <text class="dw-btn" @tap="onCancel">{{ cancelText }}</text>

        <view class="dw-mid">
          <view v-if="subtitle" class="dw-subtitle">{{ subtitle }}</view>
          <view class="dw-title">{{ title }}</view>
        </view>

        <text class="dw-btn dw-ok" @tap="onConfirm">{{ okText }}</text>
      </view>

      <view class="dw-body">
        <picker-view
          class="dw-picker"
          :value="dateWheelIndex"
          @change="onWheelChange"
          :indicator-style="`height: ${indicatorHeightRpx}rpx;`"
          :mask-style="'background: transparent;'"
        >
          <picker-view-column>
            <view
              v-for="(y, yi) in dateYears"
              :key="'y-'+y"
              :class="['dw-item', yi === dateWheelDraftIndex[0] ? 'dw-item-active' : '']"
            >
              {{ y }}年
            </view>
          </picker-view-column>

          <picker-view-column>
            <view
              v-for="(m, mi) in dateMonths"
              :key="'m-'+m"
              :class="['dw-item', mi === dateWheelDraftIndex[1] ? 'dw-item-active' : '']"
            >
              {{ m }}月
            </view>
          </picker-view-column>

          <picker-view-column>
            <view
              v-for="(d, di) in dateDays"
              :key="'d-'+d"
              :class="['dw-item', di === dateWheelDraftIndex[2] ? 'dw-item-active' : '']"
            >
              {{ d }}日
            </view>
          </picker-view-column>
        </picker-view>

        <!-- 中间高亮框 -->
        <view class="dw-indicator"></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'YMDWheel',
  props: {
    // 控制显示
    show: { type: Boolean, default: false },

    // 当前值：YYYY-MM-DD
    value: { type: String, default: '' },

    // UI 文案
    title: { type: String, default: '选择日期' },
    subtitle: { type: String, default: '' },
    cancelText: { type: String, default: '取消' },
    okText: { type: String, default: '完成' },

    // 年范围：当前年 +/- rangeYears
    rangeYears: { type: Number, default: 50 },

    // picker indicator 高度（rpx）
    indicatorHeightRpx: { type: Number, default: 96 }
  },

  data() {
    return {
      dateYears: [],
      dateMonths: [],
      dateDays: [],
      dateWheelIndex: [0, 0, 0],
      dateWheelDraftIndex: [0, 0, 0]
    };
  },

  watch: {
    show(v) {
      if (v) this.ensureDateWheelData(this.value);
    },
    value(v) {
      // 外部 value 改了且当前正显示：同步滚轮
      if (this.show) this.ensureDateWheelData(v);
    }
  },

  mounted() {
    if (this.show) this.ensureDateWheelData(this.value);
  },

  methods: {
    noop() {},

    // ========== 日期工具 ==========
    pad2(n) {
      const s = String(n);
      return s.length >= 2 ? s : '0' + s;
    },
    daysInMonth(year, month) {
      // month: 1-12
      const y = Number(year);
      const m = Number(month);
      return new Date(y, m, 0).getDate();
    },
    buildYearRange() {
      const now = new Date();
      const cur = now.getFullYear();
      const start = cur - Number(this.rangeYears || 50);
      const end = cur + Number(this.rangeYears || 50);
      const arr = [];
      for (let y = start; y <= end; y++) arr.push(y);
      return arr;
    },

    ensureDateWheelData(dateStr) {
      // dateStr: YYYY-MM-DD
      const now = new Date();
      let y = now.getFullYear();
      let m = now.getMonth() + 1;
      let d = now.getDate();

      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-').map((x) => Number(x));
        y = parts[0] || y;
        m = parts[1] || m;
        d = parts[2] || d;
      }

      const years = this.buildYearRange();
      const months = [];
      for (let i = 1; i <= 12; i++) months.push(i);

      const maxD = this.daysInMonth(y, m);
      const days = [];
      for (let i = 1; i <= maxD; i++) days.push(i);

      const yi = Math.max(0, years.indexOf(Number(y)));
      const mi = Math.max(0, months.indexOf(Number(m)));
      const di = Math.max(0, Math.min(days.length - 1, days.indexOf(Number(d))));

      this.dateYears = years;
      this.dateMonths = months;
      this.dateDays = days;
      this.dateWheelIndex = [yi, mi, di];
      this.dateWheelDraftIndex = [yi, mi, di];
    },

    // ========== 交互 ==========
    onWheelChange(e) {
      const v = (e && e.detail && e.detail.value) || [0, 0, 0];
      const nextIdx = [Number(v[0] || 0), Number(v[1] || 0), Number(v[2] || 0)];

      const prev = this.dateWheelDraftIndex || [0, 0, 0];
      const yearChanged = nextIdx[0] !== prev[0];
      const monthChanged = nextIdx[1] !== prev[1];

      // 先更新 draft
      this.dateWheelDraftIndex = nextIdx;

      // 年/月变化：重算日列表，避免越界（2/30）
      if (yearChanged || monthChanged) {
        const y = this.dateYears[nextIdx[0]];
        const m = this.dateMonths[nextIdx[1]];
        const maxD = this.daysInMonth(y, m);

        const days = [];
        for (let i = 1; i <= maxD; i++) days.push(i);

        const safeDi = Math.max(0, Math.min(days.length - 1, nextIdx[2]));
        const fixed = [nextIdx[0], nextIdx[1], safeDi];

        this.dateDays = days;
        this.dateWheelIndex = fixed;
        this.dateWheelDraftIndex = fixed;
      } else {
        // 只动日：同步 value，避免某些机型回弹
        this.dateWheelIndex = nextIdx;
      }
    },

    onCancel() {
      // 交给父组件关
      this.$emit('cancel');
      // 如果你想直接支持 .sync / v-model:show，也可以在父页面用 @cancel="show=false"
      this.$emit('update:show', false);
    },

    onConfirm() {
      const idx = this.dateWheelDraftIndex || [0, 0, 0];
      const y = this.dateYears[idx[0]];
      const m = this.dateMonths[idx[1]];
      const d = this.dateDays[idx[2]];
      const dateStr = `${y}-${this.pad2(m)}-${this.pad2(d)}`;

      // 输出：confirm(dateStr)
      this.$emit('confirm', dateStr);

      // 如果父组件用 v-model 绑定 value，可顺便抛出 input
      this.$emit('input', dateStr);

      // 关弹层（可选）
      this.$emit('update:show', false);
    }
  }
};
</script>

<style>
@import './YMD-Wheel.css';
</style>
