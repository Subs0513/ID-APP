<template>
    <view>
        <!-- 透明自定义导航栏（固定在顶部） -->
        <view class="custom-nav" :style="'height: ' + navTotalHeight + 'px;'">
            <view class="custom-nav__inner" :style="'padding-top: ' + statusBarHeight + 'px; height: ' + navBarHeight + 'px;'">
                <text class="custom-nav__title">我和你的重要时光</text>
            </view>
        </view>

        <!-- 占位：把下面内容整体顶下来 -->
        <view :style="'height: ' + navTotalHeight + 'px;'"></view>

        <view class="container page-bottom-space">
            <!-- 置顶：在一起 -->
            <view class="hero">
                <view class="hero-left">
                    <view class="hero-title">我们已经在一起了</view>
                    <view class="hero-sub">起始日：{{ coupleStartDate || '未设置' }}</view>
                </view>

                <view class="hero-right">
                    <view class="hero-days">{{ daysTogether }}</view>
                    <view class="hero-days-unit">days</view>
                </view>
            </view>

            <view class="list-header">
                <view class="list-title-row">
                    <image class="list-title-icon" src="/static/assets/icons/粉_日期.svg" mode="aspectFit" />
                    <text class="list-title">重要的日子</text>
                </view>
            </view>
            <view v-if="list.length === 0" class="empty-card">
                <view class="empty-text">还没有重要日子哦，点击下方「新增」开始吧～</view>
            </view>

            <!-- 重要日子列表：支持长按上下拖拽排序 -->
            <view
                :class="'day-card ' + (dragIndex === index ? 'dragging' : '')"
                hover-class="day-card-active"
                hover-stay-time="80"
                :hover-stop-propagation="true"
                :data-id="item.id"
                :data-index="index"
                @tap="onCardTap"
                @longpress="onDragStart"
                @touchmove.stop.prevent="onDragMove"
                @touchend.stop.prevent="onDragEnd"
                @touchcancel.stop.prevent="onDragEnd"
                :style="dragIndex === index ? 'transform: translateY(' + dragOffsetY + 'px);' : ''"
                v-for="(item, index) in list"
                :key="index"
            >
                <view class="day-left">
                    <view class="day-title">{{ item.title }}</view>
                </view>

                <view class="day-right">
                    <view class="day-badge">
                        <text v-if="item.badgePrefix">{{ item.badgePrefix }}</text>
                        <text class="day-badge-strong" v-if="item.badgeNumber">{{ item.badgeNumber }}</text>
                        <text v-if="item.badgeSuffix">{{ item.badgeSuffix }}</text>
                        <text v-if="item.badgeFull">{{ item.badgeFull }}</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
// pages/home/home.js
const storage = require('../../utils/storage');
const dateUtil = require('../../utils/date');

// ✅ 用单独的 key 保存拖拽顺序（只存 id 列表）
const ORDER_KEY = 'importantDaysOrderIds';
function makeBadge(dateStr, includeStart) {
    let d = dateUtil.daysTo(dateStr); // target - today

    if (d === 0) {
        return {
            badgeFull: '就是今天！'
        };
    }
    if (d > 0) {
        if (includeStart) {
            d = d + 1;
        } // ✅ 正数包含起始日
        return {
            badgePrefix: '还有',
            badgeNumber: String(d),
            badgeSuffix: '天'
        };
    }
    return {
        badgePrefix: '已经',
        badgeNumber: String(Math.abs(d)),
        badgeSuffix: '天'
    };
}

// ✅ 按保存的 orderIds 进行排序（只对同一组内排序：置顶组/非置顶组）
function applyOrder(list, orderIds) {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return list.slice();
    }
    const idToItem = new Map();
    list.forEach((it) => {
        if (it && it.id != null) {
            idToItem.set(String(it.id), it);
        }
    });
    const used = new Set();
    const ordered = [];

    // 先按 orderIds 拼出来
    orderIds.forEach((id) => {
        const key = String(id);
        if (idToItem.has(key)) {
            ordered.push(idToItem.get(key));
            used.add(key);
        }
    });

    // 再把未出现的追加到末尾（保持原顺序）
    list.forEach((it) => {
        const key = it && it.id != null ? String(it.id) : '';
        if (key && !used.has(key)) {
            ordered.push(it);
        }
    });
    return ordered;
}

// ✅ 总排序：置顶永远在前；组内按 orderIds；没有 orderIds 时回退旧逻辑
function sortList(rawList) {
    const list = rawList.slice();

    // 分组：置顶 / 非置顶
    const top = list.filter((it) => it && it.isTop);
    const normal = list.filter((it) => !it || !it.isTop);

    // 读取手动顺序（只影响组内）
    let orderIds = [];
    try {
        orderIds = uni.getStorageSync(ORDER_KEY) || [];
    } catch (e) {
        console.log('CatchClause', e);
        console.log('CatchClause', e);
        orderIds = [];
    }
    const hasOrder = Array.isArray(orderIds) && orderIds.length > 0;
    if (hasOrder) {
        return applyOrder(top, orderIds).concat(applyOrder(normal, orderIds));
    }

    // 没有手动顺序：回退你原来的“距离今天绝对值排序”
    const fallback = (arr) =>
        arr.slice().sort((a, b) => {
            const da = Math.abs(dateUtil.daysTo(a.date));
            const db = Math.abs(dateUtil.daysTo(b.date));
            if (da !== db) {
                return da - db;
            }
            return (a.title || '').localeCompare(b.title || '');
        });
    return fallback(top).concat(fallback(normal));
}
export default {
    data() {
        return {
            coupleStartDate: '',
            daysTogether: 0,
            list: [],
            statusBarHeight: 0,
            navBarHeight: 44,
            navTotalHeight: 0,
            // ✅ 拖拽
            isDragging: false,
            dragIndex: -1,
            dragOffsetY: 0,
            lastY: 0,
            itemHeight: 0
        };
    },
    onLoad() {
        const sys = uni.getSystemInfoSync();
        const statusBarHeight = sys.statusBarHeight || 0;
        const navBarHeight = 44;
        this.setData({
            statusBarHeight,
            navBarHeight,
            navTotalHeight: statusBarHeight + navBarHeight
        });
    },
    onReady() {
        // 测量卡片高度（px）
        uni.createSelectorQuery()
            .in(uni)
            .select('.day-card')
            .boundingClientRect((rect) => {
                if (rect && rect.height) {
                    this.setData({
                        itemHeight: rect.height
                    });
                } else {
                    this.setData({
                        itemHeight: 72
                    });
                } // 兜底
            })
            .exec();
    },
    onShow() {
        if (this.getTabBar && this.getTabBar()) {
            this.getTabBar().setSelected(0);
        }
        this.refresh();
    },
    methods: {
        refresh() {
            const coupleStartDate = storage.getCoupleStartDate();
            const today = dateUtil.todayStr();
            const daysTogether = coupleStartDate ? dateUtil.diffDays(coupleStartDate, today) + 1 : 0;
            const rawList = storage.getList() || [];
            const sorted = sortList(rawList);
            const list = sorted.map((it) => ({
                ...it,
                ...makeBadge(it.date, it.includeStart)
            }));
            this.setData({
                coupleStartDate,
                daysTogether,
                list
            });
        },

        // ✅ 点击卡片（拖拽时禁止跳转）
        onCardTap(e) {
            if (this.isDragging) {
                return;
            }
            const id = e.currentTarget.dataset.id;
            uni.navigateTo({
                url: `/pages/detail/detail?id=${id}`
            });
        },

        /* =====================
         * ✅ 拖拽排序（只处理上下）
         * ===================== */
        onDragStart(e) {
            const index = Number(e.currentTarget.dataset.index);
            if (Number.isNaN(index)) {
                return;
            }
            const y = e.touches[0].clientY;
            const itemHeight = this.itemHeight || 72;
            this.setData({
                isDragging: true,
                dragIndex: index,
                dragOffsetY: 0,
                lastY: y,
                itemHeight
            });
            if (uni.vibrateShort) {
                uni.vibrateShort({
                    type: 'light'
                });
            }
        },

        onDragMove(e) {
            const { isDragging, dragIndex, lastY, itemHeight, list } = this;
            if (!isDragging || dragIndex === -1) {
                return;
            }
            const y = e.touches[0].clientY;
            const dy = y - lastY;
            let newOffset = this.dragOffsetY + dy;
            let newIndex = dragIndex;
            let newList = list;

            // 向下：跨过半个高度就换位
            while (newOffset > itemHeight / 2 && newIndex < list.length - 1) {
                newList = newList.slice();
                const picked = newList.splice(newIndex, 1)[0];
                newList.splice(newIndex + 1, 0, picked);
                newIndex += 1;
                newOffset -= itemHeight;
            }

            // 向上
            while (newOffset < -itemHeight / 2 && newIndex > 0) {
                newList = newList.slice();
                const picked = newList.splice(newIndex, 1)[0];
                newList.splice(newIndex - 1, 0, picked);
                newIndex -= 1;
                newOffset += itemHeight;
            }
            this.setData({
                list: newList,
                dragIndex: newIndex,
                dragOffsetY: newOffset,
                lastY: y
            });
        },

        onDragEnd() {
            if (!this.isDragging) {
                return;
            }

            // ✅ 1) 立即结束拖拽状态（避免误触）
            const list = this.list || [];
            this.setData({
                isDragging: false,
                dragOffsetY: 0,
                dragIndex: -1
            });

            // ✅ 2) 保存当前顺序（只存 id 列表）
            const orderIds = list.map((it) => (it && it.id != null ? String(it.id) : null)).filter(Boolean);
            try {
                uni.setStorageSync(ORDER_KEY, orderIds);
            } catch (err) {
                console.log('CatchClause', err);
                console.log('CatchClause', err);
                console.error('save orderIds failed:', err);
            }

            // ✅ 3) 直接刷新（refresh 会读取 orderIds 排序，所以不会回去）
            this.refresh();
        }
    }
};
</script>
<style>
@import './home.css';
</style>
