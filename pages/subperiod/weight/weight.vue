<template>
  <view class="page-wrap">
    <scroll-view class="page" :scroll-y="true">
      <!-- 顶部大卡片：今日体重 + BMI -->
      <view class="hero-card">
        <view class="hero-row">
          <view class="hero-left">
            <text class="hero-k">今儿</text>
            <text class="hero-v">{{ todayKgText }}</text>
            <text class="hero-unit">kg</text>

            <view class="hero-sub">
              <text class="sub-item">体重：{{ todayKgDetail }}</text>
              <text class="sub-dot">·</text>
              <text class="sub-item">BMI：{{ bmiText }}</text>
            </view>

            <view class="hero-sub2">
              <text class="sub2-item">身高：{{ heightText }}</text>
              <text class="sub-dot">·</text>
              <text class="sub2-item">日期：{{ todayStr }}</text>
            </view>
          </view>

          <view class="hero-right">
            <view class="hero-btn primary" @tap="openWeightForToday">
              <text class="hero-btn-t">{{ hasToday ? '修改' : '记录' }}</text>
            </view>
            <view class="hero-btn ghost" @tap="openHeightPopup">
              <text class="hero-btn-t">身高</text>
            </view>
          </view>
        </view>

        <view class="hero-tip" v-if="!hasToday">
          今天还没记录体重哦～点右侧「记录」即可
        </view>

        <view class="hero-bmi-tag" v-if="bmiTagText">
          <text class="bmi-tag">{{ bmiTagText }}</text>
        </view>
      </view>

      <!-- 范围切换 -->
      <view class="range-bar" v-if="pointsAll.length">
        <view class="pill" :class="{ on: rangeKey === '7' }" @tap="setRange('7')">7天</view>
        <view class="pill" :class="{ on: rangeKey === '30' }" @tap="setRange('30')">30天</view>
        <view class="pill" :class="{ on: rangeKey === '90' }" @tap="setRange('90')">90天</view>
        <view class="pill" :class="{ on: rangeKey === 'all' }" @tap="setRange('all')">全部</view>
      </view>

      <!-- 概览指标 -->
      <view class="card" v-if="stats.count">
        <view class="card-title">概览</view>

        <view class="metrics">
          <view class="metric">
            <text class="m-k">最新</text>
            <text class="m-v">{{ stats.latestText }}</text>
            <text class="m-s">{{ stats.latestDateText }}</text>
          </view>

          <view class="metric">
            <text class="m-k">近{{ rangeLabel }}变化</text>
            <text class="m-v" :class="{ up: stats.delta > 0, down: stats.delta < 0 }">
              {{ stats.deltaText }}
            </text>
            <text class="m-s">起点：{{ stats.firstText }}</text>
          </view>

          <view class="metric">
            <text class="m-k">均值</text>
            <text class="m-v">{{ stats.avgText }}</text>
            <text class="m-s">波动：{{ stats.stdText }}</text>
          </view>

          <view class="metric">
            <text class="m-k">范围</text>
            <text class="m-v">{{ stats.minText }} ~ {{ stats.maxText }}</text>
            <text class="m-s">记录：{{ stats.count }}天</text>
          </view>
        </view>
      </view>

      <!-- 空态 -->
      <view class="card" v-if="!stats.count">
        <view class="card-title">还没有体重记录</view>
        <view class="empty">
          <text class="empty-t">点上方「记录」开始吧～</text>
        </view>
      </view>

      <!-- 图1：趋势折线 -->
      <view class="card" v-if="stats.count">
        <view class="card-title">趋势</view>
        <view class="sub">折线：每日体重（kg）｜虚线：7日均线</view>
        <view class="chart-box">
          <qiun-data-charts
            type="mix"
            :opts="optsTrend"
            :chartData="chartTrend"
            :canvas2d="true"
            :canvasId="'trendChart'"
            :inScrollView="true"
          />
        </view>
      </view>

      <!-- 图2：周均柱状 -->
      <view class="card" v-if="weekAgg.categories.length">
        <view class="card-title">周均体重</view>
        <view class="sub">按自然周聚合，更能看出长期趋势</view>
        <view class="chart-box">
          <qiun-data-charts
            type="column"
            :opts="optsWeek"
            :chartData="chartWeek"
            :canvas2d="true"
            :canvasId="'weekChart'"
            :inScrollView="true"
          />
        </view>
      </view>

      <!-- 图3：分布环形 -->
      <view class="card" v-if="distSeries.length">
        <view class="card-title">体重分布</view>
        <view class="sub">自动根据你的数据生成区间</view>
        <view class="chart-box">
          <qiun-data-charts
            type="ring"
            :opts="optsDist"
            :chartData="chartDist"
            :canvas2d="true"
            :canvasId="'distChart'"
            :inScrollView="true"
          />
        </view>

        <view class="dist-legend">
          <view class="dist-item" v-for="(it, idx) in distSeries" :key="idx">
            <text class="dist-name">{{ it.name }}</text>
            <text class="dist-val">{{ it.value }}天</text>
          </view>
        </view>
      </view>

      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- =====体重输入：底部弹窗===== -->
    <view v-if="showWeightPopup">
      <view class="sheet-mask" @tap="onWeightCancel" @touchmove.stop.prevent="noop"></view>

      <view class="sheet" @tap.stop.prevent="noop" @touchmove.stop.prevent="noop">
        <view class="sheet-header">
          <text class="sheet-btn" @tap="onWeightCancel">取消</text>
          <text class="sheet-title">体重</text>
          <text class="sheet-btn sheet-btn-primary" @tap="onWeightConfirm">确定</text>
        </view>

        <view class="sheet-value">
          <text class="value-num">{{ weightDisplay }}</text>
          <text class="value-unit">公斤</text>
        </view>

        <view class="sheet-keypad">
          <view class="key-row">
            <view class="key" data-k="1" @tap="onWeightKey">1</view>
            <view class="key" data-k="2" @tap="onWeightKey">2</view>
            <view class="key" data-k="3" @tap="onWeightKey">3</view>
          </view>
          <view class="key-row">
            <view class="key" data-k="4" @tap="onWeightKey">4</view>
            <view class="key" data-k="5" @tap="onWeightKey">5</view>
            <view class="key" data-k="6" @tap="onWeightKey">6</view>
          </view>
          <view class="key-row">
            <view class="key" data-k="7" @tap="onWeightKey">7</view>
            <view class="key" data-k="8" @tap="onWeightKey">8</view>
            <view class="key" data-k="9" @tap="onWeightKey">9</view>
          </view>
          <view class="key-row">
            <view class="key" data-k="." @tap="onWeightKey">.</view>
            <view class="key" data-k="0" @tap="onWeightKey">0</view>
            <view class="key key-del" @tap="onWeightDel">
              <text class="del-t">⌫</text>
            </view>
          </view>

          <view class="sheet-hint">输入 0 可删除今天记录</view>
        </view>
      </view>
    </view>

    <!-- =====身高输入弹窗===== -->
    <view v-if="showHeightPopup">
      <view class="sheet-mask" @tap="onHeightCancel" @touchmove.stop.prevent="noop"></view>

      <view class="sheet" @tap.stop.prevent="noop" @touchmove.stop.prevent="noop">
        <view class="sheet-header">
          <text class="sheet-btn" @tap="onHeightCancel">取消</text>
          <text class="sheet-title">身高</text>
          <text class="sheet-btn sheet-btn-primary" @tap="onHeightConfirm">确定</text>
        </view>

        <view class="height-box">
          <view class="height-row">
            <text class="height-k">身高</text>
            <input
              class="height-input"
              type="number"
              v-model="heightInput"
              placeholder="例如 170"
              maxlength="3"
            />
            <text class="height-u">cm</text>
          </view>

          <view class="height-hint">
            用于计算 BMI（BMI = 体重 / 身高²）
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const STORE_KEY = 'period_record_v1';

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}
function toDateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseDateStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function loadStore() {
  const v = uni.getStorageSync(STORE_KEY);
  if (v && typeof v === 'object') return v;
  return { weightRecords: {}, profile: {} };
}
function saveStore(store) {
  uni.setStorageSync(STORE_KEY, store);
}
function round2(x) {
  return Math.round(x * 100) / 100;
}
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stddev(arr) {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  const v = mean(arr.map((x) => (x - m) * (x - m)));
  return Math.sqrt(v);
}
function movingAvg(points, win = 7) {
  const res = [];
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - win + 1);
    const slice = points.slice(start, i + 1);
    res.push(round2(mean(slice)));
  }
  return res;
}
function getWeekKey(dateObj) {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const y = d.getUTCFullYear();
  return `${y}-W${pad2(weekNo)}`;
}

export default {
  data() {
    return {
      rangeKey: '30',
      todayStr: toDateStr(new Date()),
      todayKg: null,
      heightCm: null,

      // stats
      stats: {
        count: 0,
        delta: 0,
        latestText: '--',
        latestDateText: '--',
        firstText: '--',
        avgText: '--',
        stdText: '--',
        minText: '--',
        maxText: '--',
        deltaText: '--'
      },

      pointsAll: [],
      points: [],

      chartTrend: {},
      chartWeek: {},
      chartDist: {},

      weekAgg: { categories: [], values: [] },
      distSeries: [],

      optsTrend: {
        padding: [12, 10, 8, 6],
        legend: { show: true, position: 'top' },
        xAxis: { disableGrid: true, labelCount: 5, scrollShow: false },
        yAxis: { gridType: 'dash', dashLength: 4 },
        extra: { mix: { line: { type: 'curve', width: 2 } } }
      },
      optsWeek: {
        padding: [12, 10, 8, 6],
        legend: { show: false },
        xAxis: { disableGrid: true, labelCount: 6 },
        yAxis: { gridType: 'dash', dashLength: 4 },
        extra: { column: { width: 14 } }
      },
      optsDist: {
        padding: [12, 10, 8, 6],
        legend: { show: false },
        extra: { ring: { ringWidth: 16, centerColor: '#ffffff' } }
      },

      // 体重弹窗
      showWeightPopup: false,
      weightInput: '',
      weightDisplay: '0',

      // 身高弹窗
      showHeightPopup: false,
      heightInput: ''
    };
  },

  computed: {
    rangeLabel() {
      if (this.rangeKey === '7') return '7天';
      if (this.rangeKey === '30') return '30天';
      if (this.rangeKey === '90') return '90天';
      return '全部';
    },
    hasToday() {
      return typeof this.todayKg === 'number' && this.todayKg > 0;
    },
    todayKgText() {
      return this.hasToday ? this.todayKg.toFixed(2) : '--';
    },
    todayKgDetail() {
      return this.hasToday ? `${this.todayKg.toFixed(2)} kg` : '--';
    },
    heightText() {
      return this.heightCm ? `${this.heightCm} cm` : '未设置';
    },
    bmiValue() {
      if (!this.hasToday) return null;
      if (!this.heightCm || this.heightCm <= 0) return null;
      const h = this.heightCm / 100;
      return round2(this.todayKg / (h * h));
    },
    bmiText() {
      if (!this.hasToday) return '--';
      if (!this.heightCm) return '未设置身高';
      if (this.bmiValue == null) return '--';
      return this.bmiValue.toFixed(1);
    },
    bmiTagText() {
      // 常用 BMI 分级（仅作参考，不用于医疗诊断）
      const v = this.bmiValue;
      if (v == null) return '';
      if (v < 18.5) return '偏瘦';
      if (v < 24) return '正常';
      if (v < 28) return '超重';
      return '肥胖';
    }
  },

  onShow() {
    this.reload();
  },

  methods: {
    noop() {},

    setRange(key) {
      this.rangeKey = key;
      this.recompute();
    },

    reload() {
      const store = loadStore();
      store.weightRecords = store.weightRecords || {};
      store.profile = store.profile || {};

      // 身高
      const h = Number(store.profile.heightCm || 0);
      this.heightCm = h > 0 ? h : null;

      // 今日体重
      const today = this.todayStr;
      const rec = store.weightRecords[today];
      const kg = rec && typeof rec.kg === 'number' ? rec.kg : 0;
      this.todayKg = kg > 0 ? kg : null;

      // 全部体重记录 -> 数组
      const list = Object.keys(store.weightRecords)
        .map((dateStr) => {
          const r = store.weightRecords[dateStr];
          const k = r && typeof r.kg === 'number' ? r.kg : null;
          if (k == null || k <= 0) return null;
          return { dateStr, kg: Number(k) };
        })
        .filter(Boolean)
        .sort((a, b) => parseDateStr(a.dateStr) - parseDateStr(b.dateStr));

      this.pointsAll = list;
      this.recompute();
    },

    recompute() {
      const all = this.pointsAll.slice();
      if (!all.length) {
        this.points = [];
        this.fillEmpty();
        return;
      }

      let cut = all;
      if (this.rangeKey !== 'all') {
        const days = Number(this.rangeKey);
        const lastDate = parseDateStr(all[all.length - 1].dateStr);
        const minDate = new Date(lastDate.getTime());
        minDate.setDate(minDate.getDate() - (days - 1));
        cut = all.filter((p) => parseDateStr(p.dateStr) >= minDate);
      }
      this.points = cut;

      this.buildStats();
      this.buildTrendChart();
      this.buildWeekAgg();
      this.buildDist();
    },

    fillEmpty() {
      this.stats = {
        count: 0,
        delta: 0,
        latestText: '--',
        latestDateText: '--',
        firstText: '--',
        avgText: '--',
        stdText: '--',
        minText: '--',
        maxText: '--',
        deltaText: '--'
      };
      this.chartTrend = {};
      this.chartWeek = {};
      this.chartDist = {};
      this.weekAgg = { categories: [], values: [] };
      this.distSeries = [];
    },

    buildStats() {
      const pts = this.points;
      const count = pts.length;

      const first = pts[0];
      const last = pts[pts.length - 1];

      const arr = pts.map((p) => p.kg);
      const avg = mean(arr);
      const std = stddev(arr);
      const min = Math.min.apply(null, arr);
      const max = Math.max.apply(null, arr);
      const delta = round2(last.kg - first.kg);

      this.stats = {
        count,
        delta,
        latestText: `${last.kg.toFixed(2)} kg`,
        latestDateText: last.dateStr,
        firstText: `${first.kg.toFixed(2)} kg`,
        avgText: `${avg.toFixed(2)} kg`,
        stdText: `${std.toFixed(2)} kg`,
        minText: `${min.toFixed(2)} kg`,
        maxText: `${max.toFixed(2)} kg`,
        deltaText: `${delta > 0 ? '+' : ''}${delta.toFixed(2)} kg`
      };
    },

    buildTrendChart() {
      const pts = this.points;
      const categories = pts.map((p) => p.dateStr.slice(5)); // MM-DD
      const values = pts.map((p) => round2(p.kg));
      const ma7 = movingAvg(values, 7);

      // 用 mix：两条线（体重 + 均线）
      this.chartTrend = {
        categories,
        series: [
          { name: '体重', type: 'line', data: values },
          { name: '7日均线', type: 'line', data: ma7 }
        ]
      };
    },

    buildWeekAgg() {
      const pts = this.points;
      const map = {};
      pts.forEach((p) => {
        const wk = getWeekKey(parseDateStr(p.dateStr));
        map[wk] = map[wk] || [];
        map[wk].push(p.kg);
      });

      const keys = Object.keys(map).sort();
      const categories = keys.map((k) => k.replace('-W', 'W'));
      const values = keys.map((k) => round2(mean(map[k])));

      this.weekAgg = { categories, values };
      this.chartWeek = {
        categories,
        series: [{ name: '周均(kg)', data: values }]
      };
    },

    buildDist() {
      const pts = this.points;
      const arr = pts.map((p) => p.kg).sort((a, b) => a - b);
      if (!arr.length) {
        this.distSeries = [];
        this.chartDist = {};
        return;
      }

      const min = arr[0];
      const max = arr[arr.length - 1];
      const span = Math.max(0.01, max - min);
      const step = span / 5;

      const bins = [];
      for (let i = 0; i < 5; i++) {
        const a = min + step * i;
        const b = i === 4 ? max : min + step * (i + 1);
        bins.push({ a, b, c: 0 });
      }
      arr.forEach((x) => {
        for (let i = 0; i < bins.length; i++) {
          const bin = bins[i];
          const isLast = i === bins.length - 1;
          if ((x >= bin.a && x < bin.b) || (isLast && x <= bin.b)) {
            bin.c++;
            break;
          }
        }
      });

      const series = bins
        .filter((b) => b.c > 0)
        .map((b) => ({ name: `${b.a.toFixed(1)}~${b.b.toFixed(1)}kg`, value: b.c }));

      this.distSeries = series;
      this.chartDist = { series };
    },

    // ====== 今日体重录入 ======
    openWeightForToday() {
      const store = loadStore();
      store.weightRecords = store.weightRecords || {};
      const rec = store.weightRecords[this.todayStr];
      const kg = rec && typeof rec.kg === 'number' ? rec.kg : 0;

      let showVal = '';
      if (kg > 0) showVal = kg.toFixed(2);

      this.showWeightPopup = true;
      this.weightInput = showVal;
      this.weightDisplay = showVal || '0';
    },

    onWeightCancel() {
      this.showWeightPopup = false;
    },

    onWeightKey(e) {
      const k = e.currentTarget.dataset.k;
      let s = this.weightInput || '';

      if (k === '.') {
        if (s.includes('.')) return;
        if (s === '') s = '0';
        s = s + '.';
      } else {
        if (s === '0') s = k;
        else s = s + k;
      }

      // 限制：整数3位，小数2位
      const m = s.match(/^(\d{0,3})(?:\.(\d{0,2}))?/);
      if (m) {
        const intPart = m[1] || '';
        const dot = s.includes('.') ? '.' : '';
        const decPart = (s.split('.')[1] || '').slice(0, 2);
        s = intPart + (dot ? dot + decPart : '');
      }

      this.weightInput = s;
      this.weightDisplay = s === '' ? '0' : s;
    },

    onWeightDel() {
      let s = this.weightInput || '';
      if (!s) {
        this.weightDisplay = '0';
        return;
      }
      s = s.slice(0, -1);
      this.weightInput = s;
      this.weightDisplay = s === '' ? '0' : s;
    },

    onWeightConfirm() {
      let s = (this.weightInput || '').trim();
      if (s === '') s = (this.weightDisplay || '').trim();
      if (s === '') s = '0';

      const num = parseFloat(s);
      if (isNaN(num) || num < 0) {
        uni.showToast({ title: '请输入有效体重', icon: 'none' });
        return;
      }

      const store = loadStore();
      store.weightRecords = store.weightRecords || {};
      store.profile = store.profile || {};

      if (num === 0) {
        if (store.weightRecords[this.todayStr]) {
          delete store.weightRecords[this.todayStr];
          saveStore(store);
          uni.showToast({ title: '已删除今天体重', icon: 'none' });
        } else {
          uni.showToast({ title: '今天未记录体重', icon: 'none' });
        }
        this.showWeightPopup = false;
        this.reload();
        return;
      }

      store.weightRecords[this.todayStr] = { kg: Number(num.toFixed(2)) };
      saveStore(store);

      this.showWeightPopup = false;
      uni.showToast({ title: '已记录体重', icon: 'none' });
      this.reload();
    },

    // ====== 身高设置（用于 BMI）======
    openHeightPopup() {
      this.heightInput = this.heightCm ? String(this.heightCm) : '';
      this.showHeightPopup = true;
    },

    onHeightCancel() {
      this.showHeightPopup = false;
    },

    onHeightConfirm() {
      const v = Number(String(this.heightInput || '').trim());
      if (!v || v < 80 || v > 250) {
        uni.showToast({ title: '请输入合理身高（80~250）', icon: 'none' });
        return;
      }

      const store = loadStore();
      store.profile = store.profile || {};
      store.profile.heightCm = Math.round(v);
      saveStore(store);

      this.showHeightPopup = false;
      uni.showToast({ title: '已保存身高', icon: 'none' });
      this.reload();
    }
  }
};
</script>

<style>
@import './weight.css';
</style>
