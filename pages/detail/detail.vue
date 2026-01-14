<template>
  <view class="container detail-page">
    <!-- 导航栏：标题保留“详情”，背景跟页面一致，视觉上像“透明融入背景” -->
    <page-meta
      navigation-bar-title-text="详情"
      navigation-bar-text-style="black"
      navigation-bar-background-color="#fff0f5"
    />

    <view class="center-wrapper">
      <!-- 大卡片：支持背景图（后续你做“更换背景图页面”时，只要把 bgUrl 存到 item.bgUrl 即可） -->
      <view class="card big-card detail-big-card" :style="cardStyle">
        <!-- 背景遮罩（提高文字可读性） -->
        <view class="card-bg-mask"></view>

        <!-- 内容层 -->
        <view class="card-content">
          <!-- 基本信息 -->
          <view class="top-info">
            <text class="title">{{ item ? item.title : '' }}</text>

            <view class="meta">
              <view class="meta-row">
                <text class="meta-label">日期：</text>
                <text class="meta-value">{{ item ? item.date : '' }}</text>
              </view>
              <view class="meta-row">
                <text class="meta-label">类型：</text>
                <text class="meta-value">{{ typeText }}</text>
              </view>
            </view>
          </view>

          <view class="divider"></view>

          <!-- 倒计时：数字是主角 -->
          <view class="hero">
            <view class="hero-left">
              <text class="hero-label">{{ heroLabel }}</text>
              <text class="hero-sub">{{ heroSub }}</text>
            </view>

            <view class="hero-right">
              <view class="hero-inline">
                <text class="hero-number">{{ heroNumber }}</text>
                <text class="hero-unit">{{ heroUnit }}</text>
              </view>
            </view>
          </view>

          <view class="divider"></view>

          <!-- 操作按钮：保留你原来的编辑/删除（样式也沿用原来的 class） -->
          <view class="actions in-card-actions">
            <button class="btn btn-secondary action-btn" @tap="goEdit">编辑</button>
            <button class="btn btn-danger action-btn" @tap="remove">删除</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 说明：
 * - 只重新设计 UI 结构；逻辑保持与你项目原来一致：从 storage 里按 id 取详情、删除后回到 home、从编辑页返回自动刷新。
 * - 背景图字段约定：item.bgUrl（你后续做“选择/上传背景图页面”时存这个字段即可）
 */
const storage = require('../../utils/storage');
const dateUtil = require('../../utils/date');

function getTypeText(type) {
  if (type === 'anniversary') return '纪念日';
  if (type === 'birthday') return '生日';
  return '其他';
}

// 生成倒计时展示：支持 includeStart（只影响正数：还有X天）
function makeHero(dateStr, includeStart) {
  const d = dateUtil.daysTo(dateStr); // target - today（>0 未来，=0 今天，<0 已过）
  if (d === 0) {
    return {
      heroLabel: '就是今天！',
      heroSub: '别忘了好好庆祝一下～',
      heroNumber: '0',
      heroUnit: 'days'
    };
  }

  // 未来：还有
  if (d > 0) {
    const num = includeStart ? d + 1 : d;
    return {
      heroLabel: '还有',
      heroSub: '期待一下吧～',
      heroNumber: String(num),
      heroUnit: 'days'
    };
  }

  // 过去：已经
  return {
    heroLabel: '已经',
    heroSub: '这一天已经过去',
    heroNumber: String(Math.abs(d)),
    heroUnit: 'days'
  };
}

export default {
  data() {
    return {
      id: '',
      item: null,
      typeText: '',
      heroLabel: '',
      heroSub: '',
      heroNumber: '0',
      heroUnit: 'days'
    };
  },
  computed: {
    cardStyle() {
      // 支持背景图：item.bgUrl（可为本地临时路径 / 网络地址 / base64 data url）
      const bg = this.item && this.item.bgUrl ? this.item.bgUrl : '';
      // 没有背景图时，用一个柔和的渐变兜底
      if (!bg) {
        return {
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))'
        };
      }
      return {
        backgroundImage: `url('${bg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
  },
  onLoad(options) {
    uni.setNavigationBarTitle({ title: '详情' });

    const id = (options && options.id) ? options.id : '';
    if (!id) {
      uni.showToast({ title: '缺少参数', icon: 'none' });
      uni.switchTab({ url: '/pages/home/home' });
      return;
    }
    this.id = id;
    this.refresh();
  },
  onShow() {
    // 从编辑页返回后刷新
    if (this.id) this.refresh();
  },
  methods: {
    refresh() {
      const list = storage.getList ? storage.getList() : [];
      const it = (list || []).find((x) => String(x.id) === String(this.id));
      if (!it) {
        uni.showToast({ title: '找不到该记录', icon: 'none' });
        uni.switchTab({ url: '/pages/home/home' });
        return;
      }
      this.item = it;
      this.typeText = getTypeText(it.type);

      const hero = makeHero(it.date, !!it.includeStart);
      this.heroLabel = hero.heroLabel;
      this.heroSub = hero.heroSub;
      this.heroNumber = hero.heroNumber;
      this.heroUnit = hero.heroUnit;
    },
    goEdit() {
      if (!this.id) return;
      uni.navigateTo({
        url: `/pages/editDetail/editDetail?id=${this.id}`
      });
    },
    remove() {
      if (!this.id) return;
      uni.showModal({
        title: '删除',
        content: '确定删除这个重要日子吗？',
        confirmText: '删除',
        confirmColor: '#ff4d6d',
        success: (res) => {
          if (!res.confirm) return;
          const list = storage.getList ? storage.getList() : [];
          const next = (list || []).filter((x) => String(x.id) !== String(this.id));
          if (storage.setList) storage.setList(next);
          uni.showToast({ title: '已删除', icon: 'success' });
          uni.switchTab({ url: '/pages/home/home' });
        }
      });
    }
  }
};
</script>

<style>
@import './detail.css';

</style>
