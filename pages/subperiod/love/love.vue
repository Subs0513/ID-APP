<template>
    <view class="page">
        <!-- 顶部添加按钮 -->
        <view class="add-btn" @tap="onAddTap" hover-class="btn-active" hover-stay-time="80">
            <image src="/static/assets/icons/f_jh.svg" class="icon" mode="aspectFit" />
            <text>添加爱爱记录</text>
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
                <!-- 右侧删除（默认被内容层盖住，左滑才露出来） -->
                <view class="swipe-actions" @tap="onDelete" :data-index="index">删除</view>

                <!-- 内容层 -->
                <view
                    class="swipe-content"
                    :class="{ 'no-anim': item._moving }"
                    :style="{ transform: 'translateX(' + item._x + 'rpx)' }"
                    @tap="onSwipeTap"
                    :data-index="index"
                >
                    <view class="card-row">
                        <view class="left">
                            <image src="/static/assets/icons/f_sax.svg" class="heart" mode="aspectFit" />
                            <text class="count">第{{ index + 1 }}次</text>
                            <text class="time">{{ item.time }}</text>
                        </view>
                        <text class="method">{{ item.method }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="list">
            <!-- 这里你如果有空态卡片逻辑，保持不变 -->
        </view>

        <!-- 遮罩 -->
        <view v-if="showPopup" class="mask" @tap="onCancel"></view>

        <!-- 居中弹窗 -->
        <view v-if="showPopup" class="popup" @tap.stop>
            <view class="popup-title">添加爱爱记录</view>

            <!-- 时间（上） -->
            <view class="card">
                <view class="section-head">
                    <view class="section-left">
                        <!-- ✅ 时间左侧图标：f_sj.svg -->
                        <image src="/static/assets/icons/f_sj.svg" class="section-icon" mode="aspectFit" />
                        <text class="section-title">时间</text>
                    </view>
                    <text class="section-value">{{ time }}</text>
                </view>

                <!-- ✅ 行高更矮 -->
				<view class="time-wheel">
                    <picker-view
                        class="time-picker"
                        :value="timeWheelValue"
                        @change="onTimeWheelChange"
                        indicator-style="height: 36px;"  
                    >
                        <picker-view-column>
                            <view class="time-item" v-for="(h, idx) in hours" :key="'h' + idx">{{ h }}</view>
                        </picker-view-column>

                        <picker-view-column>
                            <view class="time-item" v-for="(m, idx) in minutes" :key="'m' + idx">{{ m }}</view>
                        </picker-view-column>
                    </picker-view>

                    <!-- 中间冒号 -->
                    <view class="time-colon">:</view>
                </view>
            </view>

            <!-- 措施（下） -->
            <view class="card">
                <view class="section-head">
                    <view class="section-left">
                        <image src="/static/assets/icons/f_dp.svg" class="section-icon" mode="aspectFit" />
                        <text class="section-title">措施</text>
                    </view>
                </view>

                <!-- ✅ 措施下面增加白色卡片打底 -->
                <view class="method-card">
                    <view class="method-grid">
                        <view
                            class="method-item"
                            v-for="opt in methodOptions"
                            :key="opt.key"
                            :class="{ active: methodKey === opt.key }"
                            @tap="onSelectMethod(opt)"
                        >
                            <view class="method-icon-wrap">
                                <image :src="opt.icon" class="method-icon" mode="aspectFit" />
                                <view v-if="methodKey === opt.key" class="method-badge">✓</view>
                            </view>
                            <text class="method-text">{{ opt.label }}</text>
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
const STORE_KEY = 'period_record_v1';
// const STORE_KEY = 'sex_record_v1';

// ✅ 删除按钮宽度（rpx）——要和 css 里的 .swipe-actions width 一致
const DELETE_W_RPX = 160;

function loadStore() {
    return uni.getStorageSync(STORE_KEY) || {};
}
function saveStore(s) {
    uni.setStorageSync(STORE_KEY, s);
}

// ====== 时间滚轮数据（00-23 / 00-59）======
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ====== 避孕措施（图标 + 文案）======
const METHOD_OPTIONS = [
    { key: 'cs_01', label: '无措施', icon: '/static/assets/icons/cs_01.svg' },
    { key: 'cs_02', label: '避孕套', icon: '/static/assets/icons/cs_02.svg' },
    { key: 'cs_03', label: '体外排精', icon: '/static/assets/icons/cs_03.svg' },
    { key: 'cs_04', label: '未射精', icon: '/static/assets/icons/cs_04.svg' },
    { key: 'cs_05', label: '紧急避孕药', icon: '/static/assets/icons/cs_05.svg' },
    { key: 'cs_06', label: '短效避孕药', icon: '/static/assets/icons/cs_06.svg' },
    { key: 'cs_07', label: '长效避孕药', icon: '/static/assets/icons/cs_07.svg' },
    { key: 'cs_08', label: '节育环', icon: '/static/assets/icons/cs_08.svg' },
    { key: 'cs_09', label: '其他措施', icon: '/static/assets/icons/cs_09.svg' }
];

export default {
    data() {
        return {
            date: '',
            records: [],
            showPopup: false,

            // 时间（滚轮）
            time: '12:00',
            hours: HOURS,
            minutes: MINUTES,
            timeWheelValue: [12, 0],

            // 措施（图标选择）
            methodOptions: METHOD_OPTIONS,
            methodKey: 'cs_01',
            method: '无措施',

            // ✅ swipe 状态
            startX_var: 0,
            startY_var: 0,
            activeIndex_var: -1,
            rpxPerPx_var: 2
        };
    },
    onLoad(options) {
        const date = options.date || '';
        const sysInfo = uni.getSystemInfoSync();
        const rpxPerPx = 750 / sysInfo.windowWidth;

        const store = loadStore();
        const list = (store.sexRecords && store.sexRecords[date]) ? store.sexRecords[date] : [];

        this.setData({
            date,
            rpxPerPx_var: rpxPerPx,
            records: this.initSwipe(list)
        });
    },
    methods: {
        parseTimeToWheel(t) {
            const str = (t || '00:00').trim();
            const parts = str.split(':');
            let h = parseInt(parts[0] || '0', 10);
            let m = parseInt(parts[1] || '0', 10);
            if (isNaN(h)) h = 0;
            if (isNaN(m)) m = 0;
            h = Math.min(23, Math.max(0, h));
            m = Math.min(59, Math.max(0, m));
            const hh = String(h).padStart(2, '0');
            const mm = String(m).padStart(2, '0');
            return { wheelValue: [h, m], safeTime: `${hh}:${mm}` };
        },

        onTimeWheelChange(e) {
            const val = e.detail.value || [0, 0];
            const hIdx = val[0] || 0;
            const mIdx = val[1] || 0;
            const hh = this.hours[hIdx] || '00';
            const mm = this.minutes[mIdx] || '00';
            this.setData({
                timeWheelValue: [hIdx, mIdx],
                time: `${hh}:${mm}`
            });
        },

        onSelectMethod(opt) {
            if (!opt) return;
            this.setData({
                methodKey: opt.key,
                method: opt.label
            });
        },

        onAddTap() {
            const { wheelValue, safeTime } = this.parseTimeToWheel(this.time);
            const key = this.methodKey || 'cs_01';
            this.setData({
                showPopup: true,
                time: safeTime,
                timeWheelValue: wheelValue,
                methodKey: key
            });
        },

        onCancel() {
            this.setData({
                showPopup: false
            });
        },

        onConfirm() {
            const store = loadStore();
            if (!store.sexRecords) store.sexRecords = {};
            if (!store.sexRecords[this.date]) store.sexRecords[this.date] = [];

            store.sexRecords[this.date].unshift({
                time: this.time,
                method: this.method
            });

            saveStore(store);

            this.setData({
                records: this.initSwipe(store.sexRecords[this.date]),
                showPopup: false,
                activeIndex_var: -1
            });
        },

        initSwipe(list) {
            return (list || []).map((it) => ({
                ...it,
                _x: 0,
                _moving: false
            }));
        },

        // 以下 swipe 逻辑保持你原来的不动
        onSwipeTap(e) {
            const idx = e.currentTarget.dataset.index;
            const item = this.records?.[idx];
            if (!item) return;
            if (item._x !== 0) {
                this.closeAllSwipe && this.closeAllSwipe();
            }
        },

        onSwipeStart(e) {
            const idx = e.currentTarget.dataset.index;
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

            if (Math.abs(dxPx) < Math.abs(dyPx)) return;

            const records = this.records.slice();
            const cur = records[idx];
            if (!cur) return;

            const dxRpx = dxPx * this.rpxPerPx_var;

            let x = dxRpx;
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
            const list = (store.sexRecords && store.sexRecords[this.date]) ? store.sexRecords[this.date] : [];
            if (!list.length) return;

            list.splice(idx, 1);

            if (!store.sexRecords) store.sexRecords = {};
            store.sexRecords[this.date] = list;
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
@import './love.css';
</style>
