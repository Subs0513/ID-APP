<template>
    <view class="page">
        <!-- 顶部添加按钮 -->
        <view class="add-btn" @tap="onAddTap" hover-class="btn-active" hover-stay-time="80">
            <image src="/static/assets/icons/f_jh.svg" class="icon" mode="aspectFit" />
            <text>添加痛经记录</text>
        </view>

        <!-- 记录列表 -->
        <view v-if="records.length" class="list">
            <view
                class="swipe-item"
                :data-index="index"
                @touchstart="onSwipeStart"
                @touchmove="onSwipeMove"
                @touchend="onSwipeEnd"
                @touchcancel="onSwipeEnd"
                v-for="(item, index) in records"
                :key="index"
            >
                <!-- 右侧删除 -->

                <view class="swipe-actions" @tap="onDelete" :data-index="index">删除</view>

                <!-- 内容层 -->

                <view :class="'swipe-content ' + (item._moving ? 'no-anim' : '')" :style="'transform: translateX(' + item._x + 'rpx);'" :data-index="index" @tap="onSwipeTap">
                    <view class="row1">
                        <view class="left">
                            <view class="pain-badge">痛</view>
                            <text class="count">第{{ index + 1 }}次</text>
                            <text class="time">{{ item.time }}</text>
                        </view>

                        <text class="right-muted">{{ item.level }}</text>
                    </view>

                    <view class="row2">
                        <text class="meta">程度：{{ item.level }}</text>
                        <text class="meta">用药：{{ item.medicine }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 遮罩 -->
        <view v-if="showPopup" class="mask" @tap="onCancel"></view>

        <!-- 底部弹窗 -->
        <view v-if="showPopup" class="popup">
            <view class="popup-title">添加痛经记录</view>

            <!-- 时间 -->
            <view class="card">
                <view class="label">痛经时间</view>
                <picker mode="time" :value="time" @change="onTimeChange">
                    <view class="picker">{{ time }}</view>
                </picker>
            </view>

            <!-- 程度 -->
            <view class="card">
                <view class="label">痛经程度</view>
                <picker mode="selector" :range="levels" @change="onLevelChange">
                    <view class="picker">{{ level }}</view>
                </picker>
            </view>

            <!-- 用药 -->
            <view class="card">
                <view class="label">用药情况</view>
                <picker mode="selector" :range="medicines" @change="onMedicineChange">
                    <view class="picker">{{ medicine }}</view>
                </picker>
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

// ✅ 删除按钮宽度（rpx）——要和 wxss 里的 .swipe-actions width 一致
const DELETE_W_RPX = 160;
function loadStore() {
    const s = uni.getStorageSync(STORE_KEY);
    return s && typeof s === 'object' ? s : {};
}
function saveStore(s) {
    uni.setStorageSync(STORE_KEY, s);
}
export default {
    data() {
        return {
            date: '',
            records: [],
            // 弹窗
            showPopup: false,
            time: '12:00',
            level: '一般',
            levels: ['轻微', '一般', '严重'],
            medicine: '未用药',
            medicines: ['未用药', '布洛芬', '对乙酰氨基酚', '热敷/止痛贴', '中成药', '其他'],
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
         * 弹窗逻辑
         * ========================= */
        onAddTap() {
            this.setData({
                showPopup: true
            });
        },

        onCancel() {
            this.setData({
                showPopup: false
            });
        },

        onTimeChange(e) {
            this.setData({
                time: e.detail.value
            });
        },

        onLevelChange(e) {
            this.setData({
                level: this.levels[e.detail.value]
            });
        },

        onMedicineChange(e) {
            this.setData({
                medicine: this.medicines[e.detail.value]
            });
        },

        onConfirm() {
            const store = loadStore();
            store.painRecords = store.painRecords || {};
            store.painRecords[this.date] = store.painRecords[this.date] || [];
            store.painRecords[this.date].push({
                time: this.time,
                level: this.level,
                medicine: this.medicine
            });
            saveStore(store);
            this.setData({
                records: this.initSwipe(store.painRecords[this.date]),
                showPopup: false,
                activeIndex_var: -1
            });
        },

        onDelete(e) {
            const idx = e.currentTarget.dataset.index;
            const store = loadStore();
            store.painRecords = store.painRecords || {};
            store.painRecords[this.date] = store.painRecords[this.date] || [];
            if (idx < 0 || idx >= store.painRecords[this.date].length) {
                return;
            }
            store.painRecords[this.date].splice(idx, 1);
            saveStore(store);
            this.setData({
                records: this.initSwipe(store.painRecords[this.date]),
                activeIndex_var: -1
            });
        },

        /* =========================
         * 左滑删除（和 love.js 同逻辑）
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
            this.setData({
                records,
                activeIndex_var: -1
            });
        },

        onSwipeTap(e) {
            const idx = e.currentTarget.dataset.index;
            const item = this.records?.[idx];
            if (!item) {
                return;
            }
            if (item._x !== 0) {
                this.closeAllSwipe();
            }
        },

        onSwipeStart(e) {
            const idx = e.currentTarget.dataset.index;
            if (this._activeIndex !== -1 && this._activeIndex !== idx) {
                this.closeAllSwipe();
            }
            const t = e.touches[0];
            this.setData({
                startX_var: t.clientX,
                startY_var: t.clientY,
                activeIndex_var: idx
            });
            const records = this.records.slice();
            if (records[idx]) {
                records[idx]._moving = true;
            }
            this.setData({
                records
            });
        },

        onSwipeMove(e) {
            const idx = this._activeIndex;
            if (idx < 0) {
                return;
            }
            const t = e.touches[0];
            const dxPx = t.clientX - this._startX;
            const dyPx = t.clientY - this._startY;
            if (Math.abs(dxPx) < Math.abs(dyPx)) {
                return;
            }
            const records = this.records.slice();
            const cur = records[idx];
            if (!cur) {
                return;
            }
            const dxRpx = dxPx * this._rpxPerPx;
            let x = dxRpx;
            if (cur._x === -DELETE_W_RPX) {
                x = -DELETE_W_RPX + dxRpx;
            }
            if (x < -DELETE_W_RPX) {
                x = -DELETE_W_RPX;
            }
            if (x > 0) {
                x = 0;
            }
            cur._x = x;
            records[idx] = cur;
            this.setData({
                records
            });
        },

        onSwipeEnd() {
            const idx = this._activeIndex;
            if (idx < 0) {
                return;
            }
            const records = this.records.slice();
            const cur = records[idx];
            if (!cur) {
                return;
            }
            const shouldOpen = cur._x < -DELETE_W_RPX / 2;
            cur._x = shouldOpen ? -DELETE_W_RPX : 0;
            cur._moving = false;
            records[idx] = cur;
            this.setData({
                records,
                activeIndex_var: shouldOpen ? idx : -1
            });
        }
    }
};
</script>
<style>
@import './pain.css';
</style>
