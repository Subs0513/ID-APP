<template>
    <view class="page">
        <!-- 顶部添加按钮 -->
        <view class="add-btn" @tap="onAddTap" hover-class="btn-active" hover-stay-time="80">
            <image src="/static/assets/icons/粉_加号.svg" class="icon" mode="aspectFit" />
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

                <!-- 内容层：通过 translateX 左移露出删除 -->

                <view :class="'swipe-content ' + (item._moving ? 'no-anim' : '')" :style="'transform: translateX(' + item._x + 'rpx);'" :data-index="index" @tap="onSwipeTap">
                    <view class="card-row">
                        <view class="left">
                            <image class="heart" src="/static/assets/icons/粉_双爱心.svg" mode="aspectFit" />
                            <text class="count">第{{ index + 1 }}次</text>
                            <text class="time">{{ item.time }}</text>
                        </view>

                        <text class="method">{{ item.method }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 遮罩 -->
        <view v-if="showPopup" class="mask" @tap="onCancel"></view>

        <!-- 底部弹窗 -->
        <view v-if="showPopup" class="popup">
            <view class="popup-title">添加爱爱记录</view>

            <!-- 时间 -->
            <view class="card">
                <view class="label">爱爱时间</view>
                <picker mode="time" :value="time" @change="onTimeChange">
                    <view class="picker">{{ time }}</view>
                </picker>
            </view>

            <!-- 避孕 -->
            <view class="card">
                <view class="label">避孕措施</view>
                <picker mode="selector" :range="methods" @change="onMethodChange">
                    <view class="picker">{{ method }}</view>
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
const STORE_KEY = 'period_record_v1';
// const STORE_KEY = 'sex_record_v1';

// ✅ 删除按钮宽度（rpx）——要和 wxss 里的 .swipe-actions width 一致
const DELETE_W_RPX = 160;
function loadStore() {
    return uni.getStorageSync(STORE_KEY) || {};
}
function saveStore(s) {
    uni.setStorageSync(STORE_KEY, s);
}
export default {
    data() {
        return {
            date: '',
            records: [],
            showPopup: false,
            time: '12:00',
            method: '无措施',
            methods: ['无措施', '避孕套', '体外排精', '未射精', '紧急避孕药', '短效避孕药', '长效避孕药', '替他措施'],
            // ✅ swipe 状态
            startX_var: 0,
            startY_var: 0,
            activeIndex_var: -1,
            rpxPerPx_var: 2 // 默认给个值，onLoad 会用真实 windowWidth 修正
        };
    },
    onLoad(options) {
        const date = options.date;

        // ✅ px -> rpx：rpx = px * (750 / windowWidth)
        const sys = uni.getSystemInfoSync();
        const rpxPerPx = 750 / sys.windowWidth;
        const store = loadStore();
        const list = store.sexRecords?.[date] || [];
        this.setData({
            date,
            rpxPerPx_var: rpxPerPx,
            records: this.initSwipe(list)
        });
    },
    methods: {
        /* =========================
         * 弹窗逻辑（保留你原来的）
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

        onMethodChange(e) {
            this.setData({
                method: this.methods[e.detail.value]
            });
        },

        onConfirm() {
            const store = loadStore();
            store.sexRecords = store.sexRecords || {};
            store.sexRecords[this.date] = store.sexRecords[this.date] || [];
            store.sexRecords[this.date].push({
                time: this.time,
                method: this.method
            });
            saveStore(store);

            // ✅ 刷新列表时补上 swipe 字段，并关闭弹窗、顺便收起任何打开的删除
            this.setData({
                records: this.initSwipe(store.sexRecords[this.date]),
                showPopup: false,
                activeIndex_var: -1
            });
        },

        onDelete(e) {
            const idx = e.currentTarget.dataset.index;
            const store = loadStore();
            store.sexRecords = store.sexRecords || {};
            store.sexRecords[this.date] = store.sexRecords[this.date] || [];

            // 防御：越界不处理
            if (idx < 0 || idx >= store.sexRecords[this.date].length) {
                return;
            }
            store.sexRecords[this.date].splice(idx, 1);
            saveStore(store);

            // ✅ 删除后刷新列表，并收起
            this.setData({
                records: this.initSwipe(store.sexRecords[this.date]),
                activeIndex_var: -1
            });
        },

        /* =========================
         * 左滑删除（新增）
         * ========================= */

        // 给每条记录加上 _x（位移）和 _moving（跟手状态）；不写入 storage
        initSwipe(list) {
            return (list || []).map((it) => ({
                ...it,
                _x: 0,
                _moving: false
            }));
        },

        // 只允许一个条目处于“打开删除”状态
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

        // 点内容区：如果当前是打开状态，点一下收回
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

            // 开始滑动前，先关掉其它打开的
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

            // 垂直滚动优先（避免上下滑列表被抢）
            if (Math.abs(dxPx) < Math.abs(dyPx)) {
                return;
            }
            const records = this.records.slice();
            const cur = records[idx];
            if (!cur) {
                return;
            }

            // ✅ px->rpx
            const dxRpx = dxPx * this._rpxPerPx;

            // 如果一开始就是打开的（-DELETE_W_RPX），继续拖动要从 -DELETE_W_RPX 叠加
            let x = dxRpx;
            if (cur._x === -DELETE_W_RPX) {
                x = -DELETE_W_RPX + dxRpx;
            }

            // 限制范围：[-DELETE_W_RPX, 0]
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

            // 超过一半就打开，否则收回
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
@import './love.css';
</style>
