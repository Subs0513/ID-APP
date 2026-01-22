<template>
  <view class="page">

    <!-- 顶部标题 -->
    <!-- <view class="card header-card">
      <view class="header">
        <text class="title">行为与风险提示</text>
        <text class="sub">基于你已记录的爱爱数据生成（仅供参考）</text>
      </view>
    </view> -->

    <!-- 概览 -->
    <view class="card">
      <view class="card-title">
        <image class="card-title-icon" src="/static/assets/icons/f_sax.svg" mode="aspectFit" />
        <text class="card-title-text">本周期概览</text>
      </view>

      <view class="grid">
        <view class="grid-item">
          <text class="gi-k">本周期次数</text>
          <text class="gi-v">{{ metrics.totalThis }}</text>
        </view>
        <view class="grid-item">
          <text class="gi-k">有记录的天数</text>
          <text class="gi-v">{{ metrics.daysWith }}</text>
        </view>
        <view class="grid-item">
          <text class="gi-k">平均频率</text>
          <text class="gi-v">{{ metrics.avgText }}</text>
        </view>
        <view class="grid-item">
          <text class="gi-k">本周期最长间隔</text>
          <text class="gi-v">{{ metrics.maxGapText }}</text>
        </view>
      </view>

      <view class="p" v-if="cycleText">{{ cycleText }}</view>
      <view class="p" v-if="prevCycleText">{{ prevCycleText }}</view>
    </view>

    <!-- 风险提示 -->
    <view class="card">
      <view class="card-title card-title--with-right">
        <view class="card-title-left">
          <image class="card-title-icon" src="/static/assets/icons/f_fxts.svg" mode="aspectFit" />
          <text class="card-title-text">风险提示</text>
        </view>
      </view>

      <view class="risk-list">
        <view class="risk-item" v-for="(it, idx) in riskTips" :key="idx">
          <view class="dot"></view>
          <text class="risk-text">{{ it }}</text>
        </view>
      </view>

      <view class="hint" v-if="riskHint">{{ riskHint }}</view>
    </view>

    <!-- 近30天趋势（柱状图） -->
    <view class="card">
      <view class="card-title">
        <image class="card-title-icon" src="/static/assets/icons/f_rq.svg" mode="aspectFit" />
        <text class="card-title-text">近30天次数趋势</text>
      </view>

      <view class="chart-sub">{{ trendSubText }}</view>

      <view class="chart-wrap">
        <canvas
          class="canvas"
          id="barCanvas"
          canvas-id="barCanvas"
          :width="canvasW"
          :height="barH"
          @touchstart="onBarTouch"
        ></canvas>

        <!-- 点击某个柱子后出现的小方框 -->
        <view
          v-if="barTip.show"
          class="bar-tip"
          :style="{ left: barTip.left + 'px', top: barTip.top + 'px' }"
        >
          <text class="bar-tip-date">{{ barTip.date }}</text>
          <text class="bar-tip-val">{{ barTip.value }} 次</text>
        </view>
      </view>

      <view class="p small">提示：只显示每日次数。点击某个柱子可查看该日日期与次数。</view>
    </view>

    <!-- 措施分布（饼图） -->
    <view class="card">
      <view class="card-title">
        <image class="card-title-icon" src="/static/assets/icons/f_dp.svg" mode="aspectFit" />
        <text class="card-title-text">措施分布（本周期）</text>
      </view>

      <view class="chart-sub">{{ methodSubText }}</view>

      <canvas
        class="canvas"
        id="pieCanvas"
        canvas-id="pieCanvas"
        :width="canvasW"
        :height="pieH"
      ></canvas>

      <view class="legend">
        <view class="legend-item" v-for="(l, idx) in methodLegend" :key="idx">
          <view class="legend-color" :style="{ backgroundColor: l.color }"></view>
          <text class="legend-text">{{ l.label }}</text>
          <text class="legend-val">{{ l.value }}</text>
        </view>
      </view>
    </view>

    <!-- 最近记录 -->
    <view class="card">
      <view class="card-title">
        <image class="card-title-icon" src="/static/assets/icons/f_sj.svg" mode="aspectFit" />
        <text class="card-title-text">最近记录</text>
      </view>

      <view v-if="recentList.length" class="recent">
        <view class="recent-item" v-for="(r, idx) in recentList" :key="idx">
          <view class="recent-left">
            <text class="recent-date">{{ r.dateLabel }}</text>
            <text class="recent-time">{{ r.time }}</text>
          </view>
          <text class="recent-method">{{ r.method }}</text>
        </view>
      </view>

      <view v-else class="empty">
        <text class="empty-text">还没有爱爱记录哦～先去记录一条吧</text>
        <view class="btn" @tap="goAdd">去记录</view>
      </view>
    </view>

  </view>
</template>

<script>
const STORE_KEY = 'period_record_v1';
const DEFAULTS = { cycleLength: 28, periodLength: 5, lutealDays: 14 };

function pad2(n) { return (n < 10 ? '0' : '') + n; }
function toDateStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseDateStr(s) { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDaysStr(dateStr, days) {
  const d = parseDateStr(dateStr);
  if (!d) return '';
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}
function diffDays(aStr, bStr) {
  const a = parseDateStr(aStr); const b = parseDateStr(bStr);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}
function getTodayStr() { return toDateStr(new Date()); }

function loadStore() {
  return uni.getStorageSync(STORE_KEY) || {};
}
function normalizeStore(store) {
  store.settings = store.settings || { ...DEFAULTS };
  store.periodRecords = Array.isArray(store.periodRecords) ? store.periodRecords : [];
  store.sexRecords = (store.sexRecords && typeof store.sexRecords === 'object' && !Array.isArray(store.sexRecords)) ? store.sexRecords : {};
  store.periodRecords.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  return store;
}

// 预测排卵日：cycleStart + (cycleLen - lutealDays)
function estimateOvulationDay(cycleStart, cycleLen, lutealDays) {
  const len = cycleLen || 0;
  if (!cycleStart) return '';
  const d = len ? (len - lutealDays) : 0;
  if (!d || d < 6 || d > 30) return '';
  return addDaysStr(cycleStart, d);
}

export default {
  data() {
    return {
      cycleText: '',
      prevCycleText: '',
      riskTips: [],
      riskHint: '',
      trendSubText: '',
      methodSubText: '',

      metrics: {
        totalThis: 0,
        daysWith: 0,
        avgText: '--',
        maxGapText: '--'
      },

      trendDates: [],
      trendLabels: [],
      trendValues: [],

      methodLegend: [],
      recentList: [],

      // tooltip
      barTip: { show: false, left: 0, top: 0, date: '', value: 0 },

      // canvas
      canvasW: 1,
      barH: 220,
      pieH: 260
    };
  },

  onLoad() {
    this.refresh();
  },
  onShow() {
    this.refresh();
  },

  methods: {
    goAdd() {
      // 你 addlove.vue 是按 date 展示/新增的（options.date）
      // 这里默认跳到“今天”的记录页
      const today = getTodayStr();
      uni.navigateTo({ url: `/pages/subperiod/addlove/addlove?date=${encodeURIComponent(today)}` });
    },

    refresh() {
      const store = normalizeStore(loadStore());
      const settings = store.settings || DEFAULTS;

      // 本周期范围：取最后一次经期 start 作为周期开始
      const recordsAsc = store.periodRecords || [];
      const cycleStart = recordsAsc.length ? (recordsAsc[recordsAsc.length - 1].start || '') : '';
      const todayStr = getTodayStr();

      // 周期长度：优先用两次 start 差值，否则用 settings
      let cycleLen = 0;
      if (recordsAsc.length >= 2) {
        const prevStart = recordsAsc[recordsAsc.length - 2].start;
        cycleLen = diffDays(prevStart, cycleStart);
      }
      if (!cycleLen) cycleLen = settings.cycleLength || DEFAULTS.cycleLength;

      const cycleEnd = todayStr;

      const ovulationDay = estimateOvulationDay(cycleStart, cycleLen, settings.lutealDays || DEFAULTS.lutealDays);
      const fertileStart = ovulationDay ? addDaysStr(ovulationDay, -5) : '';
      const fertileEnd = ovulationDay ? addDaysStr(ovulationDay, 1) : '';

      // 不再使用 sexDates 兜底：只从 sexRecords 统计
      const { entriesThis, totalThis, daysWith, unprotectedThis, fertileTimes } =
        this.collectSexEntries(store.sexRecords, cycleStart, cycleEnd, fertileStart, fertileEnd);

      const metrics = this.buildMetrics(cycleStart, cycleEnd, entriesThis);
      metrics.totalThis = totalThis;
      metrics.daysWith = daysWith;

      const risk = this.buildRiskTips({
        totalThis,
        unprotectedThis,
        fertileTimes,
        hasFertile: !!ovulationDay,
        fertileRangeText: ovulationDay ? `${fertileStart} ~ ${fertileEnd}` : ''
      });

      const trend = this.buildTrend30(store.sexRecords);
      const method = this.buildMethodPie(entriesThis, totalThis);

      const recentList = entriesThis
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 5)
        .map((x) => ({
          dateLabel: x.date,
          time: x.time,
          method: x.method
        }));

      const cycleText = cycleStart
        ? `本周期范围：${cycleStart} ~ ${cycleEnd}`
		// ? `本周期范围：${cycleStart} ~ ${cycleEnd}（周期长度按 ${cycleLen} 天估算）`
        : '暂无经期记录：本页将以“近30天趋势”为主展示';

      const prevCycleText = ovulationDay
        ? `推算排卵期：${fertileStart} ~ ${fertileEnd}`
        : '';

      this.setData({
        metrics,
        cycleText,
        prevCycleText,
        riskTips: risk.tips,
        riskHint: risk.hint,
        trendSubText: trend.subText,
        methodSubText: method.subText,
        trendDates: trend.dates,
        trendLabels: trend.labels,
        trendValues: trend.values,
        methodLegend: method.legend,
        recentList,
        barTip: { show: false, left: 0, top: 0, date: '', value: 0 }
      });

      this.$nextTick(() => {
        this.measureAndDrawBar(trend.dates, trend.labels, trend.values);
        this.drawPie(method.slices);
      });
    },

    inRange(ds, a, b) {
      return ds && a && b && ds >= a && ds <= b;
    },

    // 只统计 sexRecords（每条记录都应该有 time + method）
    collectSexEntries(sexRecords, rangeStart, rangeEnd, fertileStart, fertileEnd) {
      const unprotectedRe = /(无措施|不避孕|未避孕|不使用|没用|无\b)/;

      const entries = [];
      let total = 0;
      const daysSet = new Set();
      let unprotected = 0;
      let fertileTimes = 0;

      Object.keys(sexRecords || {}).forEach((ds) => {
        if (rangeStart && rangeEnd && !this.inRange(ds, rangeStart, rangeEnd)) return;
        const list = Array.isArray(sexRecords[ds]) ? sexRecords[ds] : [];
        if (!list.length) return;

        total += list.length;
        daysSet.add(ds);

        list.forEach((it) => {
          const time = it && it.time ? String(it.time) : '--:--';
          const method = it && it.method ? String(it.method).trim() : '未记录措施';
          entries.push({ date: ds, time, method });

          if (unprotectedRe.test(method)) unprotected += 1;
          if (fertileStart && fertileEnd && this.inRange(ds, fertileStart, fertileEnd)) fertileTimes += 1;
        });
      });

      return {
        entriesThis: entries,
        totalThis: total,
        daysWith: daysSet.size,
        unprotectedThis: unprotected,
        fertileTimes
      };
    },

    buildMetrics(cycleStart, cycleEnd, entriesThis) {
      const totalDays = cycleStart ? (diffDays(cycleStart, addDaysStr(cycleEnd, 1)) || 0) : 0;

      // 平均频率
      let avgText = '--';
      if (totalDays > 0) {
        const perWeek = (entriesThis.length / totalDays) * 7;
        avgText = `${perWeek.toFixed(1)}/周`;
      } else {
        avgText = entriesThis.length ? '—' : '--';
      }

      // 最长间隔（按发生日期）
      let maxGapText = '--';
      const dates = entriesThis.map(x => x.date).filter(Boolean);
      const uniq = Array.from(new Set(dates)).sort();
      if (uniq.length >= 2) {
        let maxGap = 0;
        for (let i = 1; i < uniq.length; i++) {
          const gap = diffDays(uniq[i - 1], uniq[i]) - 1;
          if (gap > maxGap) maxGap = gap;
        }
        maxGapText = maxGap === 0 ? '0天' : `${maxGap}天`;
      } else if (uniq.length === 1) {
        maxGapText = '—';
      }

      return { totalThis: 0, daysWith: 0, avgText, maxGapText };
    },

    buildRiskTips({ totalThis, unprotectedThis, fertileTimes, hasFertile, fertileRangeText }) {
      const tips = [];

      if (totalThis === 0) {
        tips.push('本周期暂无爱爱记录：可以先记录一条，才会生成更准确的提示。');
        return {
          tips,
          hint: '温馨提示：风险提示仅用于自我管理，不替代专业医疗建议。'
        };
      }

      if (unprotectedThis > 0) {
        tips.push(`存在 ${unprotectedThis} 次“无措施/未避孕”情况：如不计划怀孕，建议使用更可靠的避孕方式。`);
      } else {
        tips.push('避孕方式记录较规范：继续保持～');
      }

      if (hasFertile) {
        tips.push(`推算排卵期：${fertileRangeText}。排卵期内记录次数：${fertileTimes} 次。`);
        if (fertileTimes > 0 && unprotectedThis > 0) {
          tips.push('若排卵期内存在未避孕情况，意外怀孕风险更高。');
        }
      } else {
        tips.push('排卵期数据不足：需要更多经期记录才能进行推算。');
      }

      if (totalThis >= 10) {
        tips.push('本周期次数较多：注意休息、清洁与舒适度；如有不适及时就医。');
      }

      return {
        tips,
        hint: '提示：排卵期为算法推算；如有备孕/避孕明确需求，建议结合更可靠方式或医生建议。'
      };
    },

    // 近30天趋势：只用 sexRecords
    buildTrend30(sexRecords) {
      const today = new Date();
      const dates = [];
      const labels = [];

      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        dates.push(ds);
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      }

      const values = dates.map((ds) => {
        const list = Array.isArray((sexRecords || {})[ds]) ? (sexRecords || {})[ds] : [];
        return list.length;
      });

      const total = values.reduce((a, b) => a + b, 0);
      const max = Math.max(...values, 0);

      const subText = total
        ? `近30天共记录 ${total} 次 · 单日最高 ${max} 次`
        : '近30天暂无记录';

      return { dates, labels, values, subText };
    },

    // 措施分布饼图：按 method 归类
    buildMethodPie(entriesThis, totalThis) {
      const map = {};
      const keyOf = (m) => {
        const s = (m || '').trim();
        if (!s) return '未记录措施';
        return s;
      };

      entriesThis.forEach((it) => {
        const k = keyOf(it.method);
        map[k] = (map[k] || 0) + 1;
      });

      const arr = Object.keys(map).map(k => ({ k, v: map[k] }));
      arr.sort((a, b) => b.v - a.v);

      const top = arr.slice(0, 4);
      const rest = arr.slice(4);
      const restSum = rest.reduce((s, x) => s + x.v, 0);
      if (restSum > 0) top.push({ k: '其他', v: restSum });

      const palette = ['#ff6b9a', '#ff9f6b', '#6bc2ff', '#8d6bff', '#6bffb0'];

      const slices = top.map((x, i) => ({
        label: x.k,
        value: x.v,
        color: palette[i % palette.length]
      }));

      const legend = slices.map((s) => ({
        label: s.label,
        value: `${s.value}次`,
        color: s.color
      }));

      const subText = totalThis ? `本周期共 ${totalThis} 次` : '本周期暂无记录';
      this.setData({ methodSubText: subText });

      return { slices, legend, subText };
    },

    // ====== Bar chart + Tooltip ======
    measureAndDrawBar(dateStrs, labels, values) {
      uni.createSelectorQuery()
        .in(this)
        .select('#barCanvas')
        .boundingClientRect((rect) => {
          if (!rect || !rect.width || !rect.height) return;

          // 记录 canvas 在页面中的位置（用于 clientX/clientY 转换）
          this._barRect = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          };

          const W = Math.max(1, Math.round(rect.width));
          const H = Math.max(1, Math.round(rect.height));

          this.setData({ canvasW: W, barH: H });

          this.$nextTick(() => {
            this.drawBar('barCanvas', W, H, dateStrs, labels, values);
          });
        })
        .exec();
    },

    drawBar(canvasId, W, H, dateStrs, labels, values) {
      const ctx = uni.createCanvasContext(canvasId, this);

      // padding
      const pL = 34;
      const pR = 14;
      const pT = 14;
      const pB = 28;

      const w = W - pL - pR;
      const h = H - pT - pB;

      ctx.clearRect(0, 0, W, H);
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, W, H);

      const maxV = Math.max(...values, 0) || 1;

      // 网格线（3条）
      ctx.setStrokeStyle('rgba(0,0,0,0.06)');
      ctx.setLineWidth(1);
      for (let i = 1; i <= 3; i++) {
        const y = pT + (h * i) / 3;
        ctx.beginPath();
        ctx.moveTo(pL, y);
        ctx.lineTo(pL + w, y);
        ctx.stroke();
      }

      // y轴最大值标注
      ctx.setFillStyle('rgba(0,0,0,0.45)');
      ctx.setFontSize(10);
      ctx.fillText(`最大 ${maxV}`, 8, pT + 10);

      // 柱子几何信息（用于点击命中）
      const n = values.length;
      const gap = 2;
      const bw = Math.max(2, Math.floor((w - gap * (n - 1)) / n));

      this._barGeom = { pL, pT, w, h, bw, gap, n };
      this._barDates = dateStrs;
      this._barValues = values;
      this._barMaxV = maxV;

      for (let i = 0; i < n; i++) {
        const v = values[i] || 0;
        const bh = Math.round((v / maxV) * h);
        const x = pL + i * (bw + gap);
        const y = pT + (h - bh);

        ctx.setFillStyle(v > 0 ? 'rgba(255,107,154,0.85)' : 'rgba(0,0,0,0.06)');
        ctx.fillRect(x, y, bw, bh);

        // 横坐标：每 5 天一个 + 最后一天
        if (i % 5 === 0 || i === n - 1) {
          ctx.setFillStyle('rgba(0,0,0,0.45)');
          ctx.setFontSize(10);
          ctx.fillText(labels[i], x - 4, pT + h + 18);
        }
      }

      ctx.draw();
    },

    // 兼容：小程序 touch.x/y、H5/App clientX/clientY
    getCanvasPoint(e) {
      const rect = this._barRect;
      if (!rect) return null;

      const t = (e && e.touches && e.touches[0]) ? e.touches[0] : null;
      if (!t) return null;

      // 微信小程序一般有 x/y（相对组件），也有 clientX/clientY（相对视口）
      if (typeof t.x === 'number' && typeof t.y === 'number') {
        return { x: t.x, y: t.y };
      }

      const cx = (typeof t.clientX === 'number') ? t.clientX : null;
      const cy = (typeof t.clientY === 'number') ? t.clientY : null;
      if (cx == null || cy == null) return null;

      return { x: cx - rect.left, y: cy - rect.top };
    },

    onBarTouch(e) {
      const p = this.getCanvasPoint(e);
      if (!p || !this._barGeom) return;

      const x = p.x;
      const y = p.y;

      const { pL, pT, w, h, bw, gap, n } = this._barGeom;

      // 点击到绘图区外：隐藏 tooltip
      if (x < pL || x > pL + w || y < pT || y > pT + h) {
        this.setData({ barTip: { show: false, left: 0, top: 0, date: '', value: 0 } });
        return;
      }

      // 命中柱子索引
      const idx = Math.floor((x - pL) / (bw + gap));
      if (idx < 0 || idx >= n) return;

      const date = this._barDates && this._barDates[idx] ? this._barDates[idx] : '';
      const value = this._barValues && typeof this._barValues[idx] === 'number' ? this._barValues[idx] : 0;

      // tooltip 位置（尽量贴近柱顶，不出边界）
      let left = pL + idx * (bw + gap) + bw / 2 - 46;
      if (left < 6) left = 6;
      if (left > this.canvasW - 92) left = this.canvasW - 92;

      const maxV = this._barMaxV || 1;
      const bh = Math.round((value / maxV) * h);
      const barTop = pT + (h - bh);

      let top = barTop - 44;
      if (top < 6) top = 6;

      this.setData({
        barTip: {
          show: true,
          left: Math.round(left),
          top: Math.round(top),
          date,
          value
        }
      });
    },

    // ====== Pie chart ======
    drawPieImpl(canvasId, W, H, slices) {
      const ctx = uni.createCanvasContext(canvasId, this);
      ctx.clearRect(0, 0, W, H);

      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, W, H);

      const cx = Math.round(W / 2);
      const cy = Math.round(H / 2) - 6;
      const r = Math.min(W, H) * 0.32;
      const inner = r * 0.55;

      const total = slices.reduce((s, x) => s + (x.value || 0), 0) || 1;
      let start = -Math.PI / 2;

      slices.forEach((s) => {
        const ang = (s.value / total) * Math.PI * 2;
        const end = start + ang;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.setFillStyle(s.color);
        ctx.fill();

        start = end;
      });

      // 中空
      ctx.beginPath();
      ctx.arc(cx, cy, inner, 0, Math.PI * 2);
      ctx.setFillStyle('#ffffff');
      ctx.fill();

      // 中间文字
      // ctx.setFillStyle('rgba(0,0,0,0.65)');
      // ctx.setFontSize(12);
      // ctx.fillText('本周期', cx - 16, cy - 2);
      // ctx.setFontSize(12);
      // ctx.fillText(`${total} 次`, cx - 14, cy + 16);

      ctx.draw();
    },

    drawPie(slices) {
      uni.createSelectorQuery()
        .in(this)
        .select('#pieCanvas')
        .boundingClientRect((rect) => {
          if (!rect || !rect.width || !rect.height) return;

          const W = Math.max(1, Math.round(rect.width));
          const H = Math.max(1, Math.round(rect.height));

          this.setData({ canvasW: W, pieH: H });

          this.$nextTick(() => {
            this.drawPieImpl('pieCanvas', W, H, slices || []);
          });
        })
        .exec();
    }
  }
};
</script>

<style src="./love.css"></style>

<style>
/* tooltip 补丁样式：不影响你原 love.css */
.chart-wrap{ position: relative; }
.bar-tip{
  position: absolute;
  width: 92px;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(168, 168, 168, 0.7);
  box-sizing: border-box;
}
.bar-tip-date{
  display: block;
  font-size: 11px;
  color: rgba(255,255,255,0.92);
}
.bar-tip-val{
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
}
</style>
