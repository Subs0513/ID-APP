<template>
  <view class="page">
    <!-- 顶部添加按钮 -->
    <view class="add-btn" @tap="onAddTap" hover-class="btn-active" hover-stay-time="80">
      <image src="/static/assets/icons/f_jh.svg" class="icon" mode="aspectFit" />
      <text>添加痛经记录</text>
    </view>

    <!-- 记录列表（左滑删除） -->
    <view v-if="records.length" class="list">
      <view
        class="swipe-item"
        v-for="(item, index) in records"
        :key="index"
        :data-index="index"
        @touchstart="onSwipeStart"
        @touchmove="onSwipeMove"
        @touchend="onSwipeEnd"
        @touchcancel="onSwipeEnd"
      >
        <!-- 右侧删除按钮 -->
        <view class="swipe-actions" :data-index="index" @tap.stop="onDelete">删除</view>

        <!-- 卡片本体（跟手位移） -->
        <view
          class="swipe-content"
          :class="{ 'no-anim': item._moving }"
          :style="'transform: translateX(' + (item._x || 0) + 'rpx);'"
          @tap="onItemTap(item, index)"
        >
          <view class="row1">
            <view class="left">
              <view class="pain-badge">痛</view>
              <text class="count">第{{ index + 1 }}次</text>
              <text class="time">{{ item.time }}</text>
            </view>

            <text class="right-muted">{{ item.level || '未选择程度' }}</text>
          </view>

          <view class="row2" v-if="item.medicine">
            <text class="meta">用药：{{ item.medicine }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空态 -->
    <view v-else class="empty">暂无痛经记录</view>

    <!-- 遮罩 -->
    <view v-if="showPopup" class="mask" @tap="onCancel"></view>

    <!-- 居中弹窗（仿“爱爱”的弹窗结构） -->
    <view v-if="showPopup" class="popup" @tap.stop>
      <view class="popup-title">{{ editingIndex >= 0 ? '修改痛经记录' : '添加痛经记录' }}</view>

      <!-- 时间（滚轮） -->
      <view class="card">
        <view class="section-head">
          <view class="section-left">
            <image class="section-icon" src="/static/assets/icons/f_sj.svg" mode="aspectFit" />
            <text class="section-title">时间</text>
          </view>
          <text class="section-value">{{ form.time }}</text>
        </view>

        <view class="time-wheel">
          <picker-view
            class="time-picker"
            :value="timeWheelValue"
            indicator-style="height: 36px;"
            @change="onTimeWheelChange"
          >
            <picker-view-column>
              <view class="time-item" v-for="(h, i) in hours" :key="'h' + i">{{ h }}</view>
            </picker-view-column>

            <picker-view-column>
              <view class="time-item" v-for="(m, i) in minutes" :key="'m' + i">{{ m }}</view>
            </picker-view-column>
          </picker-view>
          <text class="time-colon">:</text>
        </view>
      </view>

      <!-- 程度（白卡打底 + 选项 chip） -->
      <view class="card">
        <view class="section-head">
          <view class="section-left">
            <image class="section-icon" src="/static/assets/icons/f_dp.svg" mode="aspectFit" />
            <text class="section-title">程度</text>
          </view>
          <text class="section-value">{{ form.level || '未选择' }}</text>
        </view>

        <view class="option-card">
          <view class="option-wrap">
            <view
              class="option-item"
              v-for="(lv, idx) in levels"
              :key="'lv' + idx"
              :class="{ active: form.level === lv }"
              @tap="pickLevel(lv)"
            >
              <text class="option-text">{{ lv }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 用药（白卡打底 + 选项 chip） -->
      <view class="card">
        <view class="section-head">
          <view class="section-left">
            <image class="section-icon" src="/static/assets/icons/f_dp.svg" mode="aspectFit" />
            <text class="section-title">用药</text>
          </view>
          <text class="section-value">{{ form.medicine || '未选择' }}</text>
        </view>

        <view class="option-card">
          <view class="option-wrap">
            <view
              class="option-item"
              v-for="(md, idx) in medicines"
              :key="'md' + idx"
              :class="{ active: form.medicine === md }"
              @tap="pickMedicine(md)"
            >
              <text class="option-text">{{ md }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="popup-actions">
        <view class="btn cancel" @tap="onCancel">取消</view>
        <view class="btn ok" @tap="onConfirm">确定</view>
      </view>
    </view>
  </view>
</template>

<script>
// ✅ 和经期主数据用同一个 store（period.js 也是这个 key）
const STORE_KEY = 'period_record_v1';

// ✅ 删除按钮宽度（rpx）——要和 css 里的 .swipe-actions width 一致
const DELETE_W_RPX = 160;

function loadStore() {
  const s = uni.getStorageSync(STORE_KEY);
  return s && typeof s === 'object' ? s : {};
}
function saveStore(s) {
  uni.setStorageSync(STORE_KEY, s);
}

// ====== 时间滚轮数据（00-23 / 00-59）======
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default {
  data() {
    return {
      date: '',
      records: [],

      // 弹窗
      showPopup: false,
      editingIndex: -1,
      form: {
        time: '12:00',
        level: '',
        medicine: ''
      },

      // 时间滚轮
      hours: HOURS,
      minutes: MINUTES,
      timeWheelValue: [12, 0],

      // 选项
      levels: ['轻微', '一般', '严重', '非常严重'],
      medicines: ['无', '布洛芬', '对乙酰氨基酚', '热敷/止痛贴', '中成药', '其他'],

      // swipe 状态
      startX_var: 0,
      startY_var: 0,
      activeIndex_var: -1,
      rpxPerPx_var: 2
    };
  },

  onLoad(options) {
    const date = options.date || '';
    const sys = uni.getSystemInfoSync();
    const rpxPerPx = 750 / sys.windowWidth;

    const store = loadStore();
    store.painRecords = store.painRecords || {};
    const list = store.painRecords?.[date] || [];

    this.setData({
      date,
      rpxPerPx_var: rpxPerPx,
      records: this.initSwipe(list)
    });
  },

  methods: {
    /* =========================
     * 弹窗逻辑（仿 love）
     * ========================= */
    onAddTap() {
      this.openPopupForCreate();
    },

    onItemTap(item, index) {
      // 点卡片：如果已打开左滑，先收起；否则进入编辑
      if (item && item._x) {
        this.closeAllSwipe();
        return;
      }
      this.openPopupForEdit(index);
    },

    openPopupForCreate() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const hIdx = this.hours.indexOf(hh);
      const mIdx = this.minutes.indexOf(mm);

      this.setData({
        showPopup: true,
        editingIndex: -1,
        form: { time: `${hh}:${mm}`, level: '', medicine: '' },
        timeWheelValue: [Math.max(hIdx, 0), Math.max(mIdx, 0)]
      });
    },

    openPopupForEdit(index) {
      const item = this.records[index];
      if (!item) return;

      const t = item.time || '12:00';
      const [hh, mm] = t.split(':');
      const hIdx = this.hours.indexOf(hh);
      const mIdx = this.minutes.indexOf(mm);

      this.setData({
        showPopup: true,
        editingIndex: index,
        form: {
          time: t,
          level: item.level || '',
          medicine: item.medicine || ''
        },
        timeWheelValue: [Math.max(hIdx, 0), Math.max(mIdx, 0)]
      });
    },

    onCancel() {
      this.setData({ showPopup: false });
    },

    onTimeWheelChange(e) {
      const [hIndex, mIndex] = e.detail.value || [0, 0];
      const time = `${this.hours[hIndex]}:${this.minutes[mIndex]}`;
      this.setData({
        timeWheelValue: [hIndex, mIndex],
        form: { ...this.form, time }
      });
    },

    pickLevel(lv) {
      this.setData({ form: { ...this.form, level: lv } });
    },

    pickMedicine(md) {
      this.setData({ form: { ...this.form, medicine: md } });
    },

    onConfirm() {
      const store = loadStore();
      store.painRecords = store.painRecords || {};
      const list = (store.painRecords[this.date] || []).slice();

      const payload = {
        time: this.form.time,
        level: this.form.level,
        medicine: this.form.medicine
      };

      if (this.editingIndex >= 0) {
        list[this.editingIndex] = payload;
      } else {
        list.unshift(payload); // 新增永远在最上面
      }

      store.painRecords[this.date] = list;
      saveStore(store);

      this.setData({
        records: this.initSwipe(list),
        showPopup: false,
        editingIndex: -1,
        activeIndex_var: -1
      });
    },

    /* =========================
     * 左滑删除（关键修复）
     * ========================= */
    initSwipe(list) {
      return (list || []).map((it) => ({
        ...it,
        _x: 0,
        _moving: false
      }));
    },

    closeAllSwipe() {
      const records = (this.records || []).map((it) => ({
        ...it,
        _x: 0,
        _moving: false
      }));
      this.setData({ records, activeIndex_var: -1 });
    },

    onSwipeStart(e) {
      const idx = e.currentTarget.dataset.index;

      // 如果之前有打开的项，且不是当前项：先收起
      if (this.activeIndex_var !== -1 && this.activeIndex_var !== idx) {
        this.closeAllSwipe();
      }

      const t = e.touches[0];
      this.setData({
        startX_var: t.clientX,
        startY_var: t.clientY,
        activeIndex_var: idx
      });

      const records = this.records.slice();
      if (records[idx]) records[idx]._moving = true;
      this.setData({ records });
    },

    onSwipeMove(e) {
      const idx = this.activeIndex_var;
      if (idx < 0) return;

      const t = e.touches[0];
      const dxPx = t.clientX - this.startX_var;
      const dyPx = t.clientY - this.startY_var;

      // 纵向滚动时直接放过，不抢事件
      if (Math.abs(dxPx) < Math.abs(dyPx)) return;

      const records = this.records.slice();
      const cur = records[idx];
      if (!cur) return;

      // ✅ 修复点：这里用 rpxPerPx_var（你原来用 _rpxPerPx 会是 undefined）
      const dxRpx = dxPx * this.rpxPerPx_var;
      let x = dxRpx;

      // 如果本来已打开，再拖动需要从 -DELETE_W_RPX 基础上叠加
      if (cur._x === -DELETE_W_RPX) x = -DELETE_W_RPX + dxRpx;

      if (x < -DELETE_W_RPX) x = -DELETE_W_RPX;
      if (x > 0) x = 0;

      cur._x = x;
      records[idx] = cur;
      this.setData({ records });
    },

    onSwipeEnd() {
      const idx = this.activeIndex_var;
      if (idx < 0) return;

      const records = this.records.slice();
      const cur = records[idx];
      if (!cur) return;

      const shouldOpen = cur._x < -DELETE_W_RPX / 2;
      cur._x = shouldOpen ? -DELETE_W_RPX : 0;
      cur._moving = false;
      records[idx] = cur;

      this.setData({
        records,
        activeIndex_var: shouldOpen ? idx : -1
      });
    },

    onDelete(e) {
      const idx = e.currentTarget.dataset.index;

      const store = loadStore();
      const list =
        store.painRecords && store.painRecords[this.date] ? store.painRecords[this.date] : [];
      if (!list.length) return;

      list.splice(idx, 1);
      store.painRecords[this.date] = list;
      saveStore(store);

      this.setData({
        records: this.initSwipe(list),
        activeIndex_var: -1
      });
    }
  }
};
</script>

<style>
@import './addpain.css';
</style>
