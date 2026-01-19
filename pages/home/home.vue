<template>
  <view class="page">
    <!-- 顶部自定义导航栏 -->
    <view class="custom-nav" :style="'height:' + navTotalHeight + 'px;'">
      <view
        class="custom-nav__inner"
        :style="'padding-top:' + statusBarHeight + 'px;height:' + navBarHeight + 'px;'"
      >
        <text class="custom-nav__title">岁序</text>
      </view>
    </view>

    <!-- 占位（顶开内容） -->
    <view :style="'height:' + navTotalHeight + 'px;'"></view>

    <!-- 内容区 -->
    <view class="container page-bottom-space">
      <!-- 卡片 1：在一起天数（保留） -->
      <view class="card" @tap="goDate">
        <view class="big-card">
          <view class="big-card-left">
            <text class="big-title">我们已经在一起了</text>
            <view class="big-sub">
              <text>起始日：</text>
              <text>{{ coupleStartDate ? coupleStartDate : '未设置' }}</text>
            </view>
          </view>
          <view class="big-card-right">
            <text class="big-num">{{ daysTogether }}</text>
            <text class="big-unit">days</text>
          </view>
        </view>
      </view>

      <!-- 标题：重要的日子 -->
      <view class="list-header">
        <view class="list-title">
          <image class="title-icon" src="/static/assets/icons/f_rq.svg" mode="aspectFit" />
          <text>重要的日子</text>
        </view>
      </view>

      <!-- 列表：无外层大白卡 -->
      <view v-if="!list || list.length === 0" class="empty-card" @tap="goAdd">
        <text class="empty-card-text">还没有重要日子哦，点击下方「新增」开始吧～</text>
      </view>

      <view v-else class="list">
        <view
          class="item"
          v-for="(item, index) in list"
          :key="item.id"
          :class="{ dragging: isDragging && dragIndex === index }"
          :style="(isDragging && dragIndex === index) ? ('transform: translateY(' + dragOffsetY + 'px);') : ''"
          :data-index="index"
          :data-id="item.id"
          @touchmove.stop.prevent="onDragMove"
          @touchend.stop="onDragEnd"
          @touchcancel.stop="onDragEnd"
        >
          <!-- ✅ 长按整张卡片即可拖动（不需要三横杠） -->
          <view
            class="item-main"
            @click="onTapItem"
            @longpress="onDragStart"
            :data-index="index"
            :data-id="item.id"
          >
            <view class="item-left">
              <!-- ✅ 只保留标题（日期列已删除） -->
              <text class="item-title">{{ item.title }}</text>
            </view>

            <view class="item-right">
              <view class="badge" v-if="item.badgeFull">
                <text class="badge-text">{{ item.badgeFull }}</text>
              </view>
              <view v-else class="count">
                <text class="count-num">{{ item.daysAbs }}</text>
                <text class="count-unit">{{ item.daysAbs === 1 ? 'day' : 'days' }}</text>
                <text class="count-sign">{{ item.daysSign }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ✅ 隐私协议弹窗（覆盖在 home 页最上层） -->
    <privacy-popup
      v-if="showPrivacy"
      @agree="onAgreePrivacy"
      @reject="onRejectPrivacy"
      @open="onOpenDoc"
    />
  </view>
</template>

<script>
	
// 弹窗组件
import PrivacyPopup from '@/components/privacy-popup/privacy-popup.vue';

const storage = require('../../utils/storage');
const dateUtil = require('../../utils/date');

// ✅ 用单独的 key 保存拖拽顺序（只存 id 列表）
const ORDER_KEY = 'importantDaysOrderIds';

function makeBadge(dateStr, includeStart) {
  let d = dateUtil.daysTo(dateStr); // target - today

  if (d === 0) return { badgeFull: '就是今天!' };
  if (d > 0) return { badgeFull: `还有 ${d} 天`, daysAbs: d, daysSign: '后' };

  const abs = Math.abs(d);
  return { badgeFull: `已经 ${abs}${includeStart ? ' + 1' : ''} 天`, daysAbs: abs, daysSign: '前' };
}

function applyOrder(list, orderIds) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) return list.slice();

  const idToItem = new Map();
  list.forEach((it) => it && it.id != null && idToItem.set(String(it.id), it));

  const used = new Set();
  const ordered = [];

  orderIds.forEach((id) => {
    const key = String(id);
    const item = idToItem.get(key);
    if (item) {
      ordered.push(item);
      used.add(key);
    }
  });

  list.forEach((it) => {
    const key = it && it.id != null ? String(it.id) : '';
    if (key && !used.has(key)) ordered.push(it);
  });

  return ordered;
}

function sortList(rawList) {
  const list = rawList.slice();

  // 置顶永远在前
  const top = list.filter((it) => it && it.isTop);
  const normal = list.filter((it) => !it || !it.isTop);

  let orderIds = [];
  try {
    orderIds = uni.getStorageSync(ORDER_KEY) || [];
  } catch (e) {
    orderIds = [];
  }

  const hasOrder = Array.isArray(orderIds) && orderIds.length > 0;
  if (hasOrder) {
    return applyOrder(top, orderIds).concat(applyOrder(normal, orderIds));
  }

  // 没有手动顺序：回退为“距离今天绝对值排序”
  const fallback = (arr) =>
    arr.slice().sort((a, b) => {
      const da = Math.abs(dateUtil.daysTo(a.date));
      const db = Math.abs(dateUtil.daysTo(b.date));
      return da - db;
    });

  return fallback(top).concat(fallback(normal));
}

export default {
  // ✅ 注册组件（否则 template 里 <privacy-popup> 不会生效）
  components: { PrivacyPopup },

  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      navTotalHeight: 0,

      coupleStartDate: '',
      daysTogether: 0,
      list: [],

      // ✅ 隐私弹窗开关
      showPrivacy: false,

      // ✅ 拖拽排序
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

    this.refresh();
  },

	// onShow() {
	//   // 你原来的 refresh 保留
	//   this.refresh && this.refresh();

	//   // ✅ 隐私协议：未同意则弹
	//   const KEY = 'privacy_agreed_v1';
	//   const agreed = !!uni.getStorageSync(KEY);
	//   this.setData({
	//     showPrivacy: !agreed
	//   });
	// },
	
	onShow() {
	  // 原有逻辑
	  this.refresh && this.refresh();
	
	  const KEY = 'privacy_agreed_v1';
	  const show = !uni.getStorageSync(KEY);
	
	  this.setData({ showPrivacy: show });
	
	  // ✅ 原生 tabBar：弹窗出现时隐藏
	  if (show) {
	    uni.hideTabBar({ animation: false });
	  } else {
	    uni.showTabBar({ animation: false });
	  }
	},





  onTabItemTap() {
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

    goAdd() {
      // 跳转到「新增」(TabBar 页面)
      uni.switchTab({
        url: '/pages/add/add'
      });
    },
	
	goDate(){
		// 跳转到“我”页面
		uni.switchTab({
		  url: '/pages/me/me'
		});
	},

    onTapItem(e) {
      // 拖拽中不响应点击
      if (this.isDragging) return;

      const id = (e && e.currentTarget && e.currentTarget.dataset) ? e.currentTarget.dataset.id : '';
      if (!id) return;

      uni.navigateTo({
        url: '/pages/detail/detail?id=' + id
      });
    },

    // ====== ✅ 长按拖拽排序（无三横杠） ======
    onDragStart(e) {
      const index = Number(e.currentTarget.dataset.index);
      if (Number.isNaN(index)) return;

      const y = e.touches && e.touches[0] ? e.touches[0].clientY : 0;

      // 估算 item 高度（你的卡片高度比较稳定）
      const itemHeight = this.itemHeight || 74;

      this.setData({
        isDragging: true,
        dragIndex: index,
        dragOffsetY: 0,
        lastY: y,
        itemHeight
      });

      if (uni.vibrateShort) uni.vibrateShort();
    },

    onDragMove(e) {
      if (!this.isDragging) return;
      if (!e.touches || !e.touches[0]) return;

      const y = e.touches[0].clientY;
      const dy = y - this.lastY;
      const nextOffset = this.dragOffsetY + dy;

      this.setData({
        dragOffsetY: nextOffset,
        lastY: y
      });

      const itemHeight = this.itemHeight || 74;
      const moveSteps = Math.round(nextOffset / itemHeight);
      if (moveSteps === 0) return;

      const from = this.dragIndex;
      let to = from + moveSteps;
      if (to < 0) to = 0;
      if (to > this.list.length - 1) to = this.list.length - 1;
      if (to === from) return;

      const list = this.list.slice();
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);

      this.setData({
        list,
        dragIndex: to,
        dragOffsetY: 0
      });
    },

    onDragEnd() {
      if (!this.isDragging) return;

      // 保存顺序
      try {
        const orderIds = (this.list || []).map((it) => it.id);
        uni.setStorageSync(ORDER_KEY, orderIds);
      } catch (e) {}

      this.setData({
        isDragging: false,
        dragIndex: -1,
        dragOffsetY: 0,
        lastY: 0
      });
    },

    // ====== ✅ 隐私弹窗事件 ======
	onAgreePrivacy() {
	  const KEY = 'privacy_agreed_v1';
	  try {
	    uni.setStorageSync(KEY, true);
	  } catch (e) {}
	
	  this.setData({ showPrivacy: false });
	
	  // ✅ 恢复原生 tabBar
	  uni.showTabBar({ animation: false });
	},



    onRejectPrivacy() {
      // 不同意：退出 App（仅 App 端有效）
      // #ifdef APP-PLUS
      plus.runtime.quit();
      // #endif
    },

    onOpenDoc(type) {
      // type: 'privacy' | 'agreement'
      const page =
        type === 'privacy'
          ? '/pages/subabout/privacy/privacy'
          : '/pages/subabout/agreement/agreement';

      uni.navigateTo({ url: page });
    }
  }
};
</script>

<style scoped>
@import "./home.css";

/* 空列表提示：做成和列表项一致的卡片，并支持点击跳转 */
.empty-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 26rpx 28rpx;
  margin-top: 16rpx;
  box-shadow: 0 10rpx 26rpx rgba(0, 0, 0, 0.06);
}

.empty-card-text {
  color: #999;
  font-size: 30rpx;
  line-height: 44rpx;
}

/* 点击态（变浅） */
.empty-card:active {
  opacity: 0.88;
}
</style>
