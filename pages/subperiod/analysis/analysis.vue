<template>
  <view class="page">
    <view class="card">
      <view class="header">
        <text class="title">经期健康分析</text>
<!--        <text class="sub" v-if="hasData">基于已有记录生成（仅供参考）</text>
        <text class="sub" v-else>暂无经期记录，先在日历里记录“月经来了”再回来看看</text> -->
      </view>
	  <view class="header">
	    <!-- <text class="title">经期健康分析</text> -->
	    <text class="sub" v-if="hasData">基于已有记录生成（仅供参考）</text>
	    <text class="sub" v-else>暂无经期记录，先在日历里记录“月经来了”再回来看看</text>
	  </view>
    </view>

    <view v-if="hasData">
      <!-- 1) 本周期概览 -->
      <view class="card">
        <view class="card-title">本周期概览</view>

        <view class="kv">
          <text class="k">最近经期</text>
          <text class="v">{{ latestStart }} ~ {{ latestEnd }}</text>
        </view>
        <view class="kv">
          <text class="k">经期长度</text>
          <text class="v">{{ latestPeriodLen }} 天</text>
        </view>
        <view class="kv">
          <text class="k">周期长度</text>
          <text class="v">{{ latestCycleLen }} 天</text>
        </view>
        <view class="kv">
          <text class="k">周期稳定性</text>
          <text class="v">{{ stabilityText }}</text>
        </view>
        <view class="kv">
          <text class="k">可信度</text>
          <text class="v">{{ confidenceText }}</text>
        </view>
      </view>

      <!-- 2) 预测信息 -->
      <view class="card">
        <view class="card-title">预测与排卵期</view>
        <view class="kv">
          <text class="k">下次预计开始</text>
          <text class="v">{{ nextStart || '数据不足' }}</text>
        </view>
        <view class="kv">
          <text class="k">排卵日（推算）</text>
          <text class="v">{{ ovulationDay || '数据不足' }}</text>
        </view>
        <view class="kv">
          <text class="k">排卵期范围</text>
          <text class="v">{{ fertileRangeText || '数据不足' }}</text>
        </view>
      </view>

      <!-- 3) 周期变化 -->
      <view class="card" v-if="cycleChange">
        <view class="cycle-head">
          <view class="cycle-head-left">
            <image class="cycle-icon" src="/static/assets/icons/f_rq.svg" mode="aspectFit" />
            <text class="cycle-title">周期变化</text>
          </view>
          <image class="cycle-arrow" src="/static/assets/icons/f_tz.svg" mode="aspectFit" />
        </view>

        <view class="cycle-sub">{{ cycleChange.rangeText }}</view>

        <view class="cycle-summary">
          <view class="cycle-summary-left">
            <view class="cycle-label">周期天数</view>
            <view class="cycle-big">
              <text class="cycle-num">{{ cycleChange.lastLenText }}</text>
              <text class="cycle-tag">{{ cycleChange.normalTag }}</text>
            </view>
          </view>

          <view class="cycle-summary-right">
            <view class="cycle-label">比前 1 个周期</view>
            <view class="cycle-delta">{{ cycleChange.deltaText }}</view>
          </view>
        </view>

        <view class="cycle-list-title">近期周期天数</view>

        <view class="cycle-list">
          <view class="cycle-item" v-for="(item, index) in cycleChange.items" :key="index">
            <view class="cycle-item-left">
              <text class="cycle-date">{{ item.dateLabel }}</text>
              <text class="cycle-status">{{ item.status }}</text>
            </view>

            <!-- ✅ 文字不放在粉色条里，避免被裁剪 -->
            <view class="cycle-bar-wrap">
              <view class="cycle-bar" :style="item.barStyle"></view>
              <text class="cycle-bar-text-fixed">{{ item.lenText }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 4) 痛经 -->
      <view class="card">
        <view class="card-title">痛经情况</view>
        <view class="p">{{ painSummaryText }}</view>
        <view class="p">{{ painLevelText }}</view>
        <view class="p">{{ painPeakText }}</view>
      </view>

      <!-- 5) 行为 -->
      <view class="card">
        <view class="card-title">行为与风险提示</view>
        <view class="p">{{ sexSummaryText }}</view>
        <view class="p">{{ sexFertileText }}</view>
        <view class="p">{{ sexUnprotectedText }}</view>
      </view>
    </view>

    <!-- 6) 体重趋势：无论是否记录月经，都显示；且只有它保留跳转 -->
    <view class="card weight-card">
      <view class="weight-head" @tap="onGoWeight">
        <view class="weight-head-left">
          <image class="weight-icon" src="/static/assets/icons/f_tzc.svg" mode="aspectFit" />
          <text class="weight-title">体重趋势（最近7天）</text>
        </view>
        <image class="weight-arrow" src="/static/assets/icons/f_tz.svg" mode="aspectFit" />
      </view>

      <view class="weight-sub">{{ weight7SubText }}</view>

      <canvas
        class="weight-canvas"
        id="weight7Canvas"
        canvas-id="weight7Canvas"
        :width="canvasW"
        :height="canvasH"
      ></canvas>

      <view class="p weight-hint">{{ weightHintText }}</view>
    </view>
  </view>
</template>

<script>
const STORE_KEY = 'period_record_v1';
const DEFAULTS = { cycleLength: 28, periodLength: 5, lutealDays: 14 };

function pad2(n) { return (n < 10 ? '0' : '') + n; }
function toDateStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseDateStr(s) { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function diffDays(aStr, bStr) {
  const a = parseDateStr(aStr); const b = parseDateStr(bStr);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function fmt2(x) { return (typeof x === 'number' && !Number.isNaN(x)) ? x.toFixed(2) : ''; }
function loadStore() {
  const v = uni.getStorageSync(STORE_KEY);
  return v && typeof v === 'object' ? v : {};
}
function normalizeStore(store) {
  store.settings = store.settings || { ...DEFAULTS };
  store.periodRecords = Array.isArray(store.periodRecords) ? store.periodRecords : [];
  store.periodStarts = Array.isArray(store.periodStarts) ? store.periodStarts : [];
  store.painRecords = Array.isArray(store.painRecords) ? store.painRecords : [];
  store.sexRecords = Array.isArray(store.sexRecords) ? store.sexRecords : [];

  // weightRecords：兼容 Map / Array => [{date, weight}]
  store.weightRecords = store.weightRecords || [];
  if (!Array.isArray(store.weightRecords) && typeof store.weightRecords === 'object') {
    const obj = store.weightRecords;
    store.weightRecords = Object.keys(obj).sort().map((date) => {
      const v = obj[date] || {};
      const w = typeof v.weight === 'number' ? v.weight : (typeof v.kg === 'number' ? v.kg : NaN);
      return { date, weight: w };
    }).filter(x => x.date);
  }
  if (Array.isArray(store.weightRecords)) {
    store.weightRecords = store.weightRecords.map((r) => {
      if (!r) return null;
      const date = r.date || r.day || r.dateStr;
      const w = typeof r.weight === 'number' ? r.weight : (typeof r.kg === 'number' ? r.kg : NaN);
      return { date, weight: w };
    }).filter(x => x && x.date);
    store.weightRecords.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  if (store.periodRecords.length === 0 && store.periodStarts.length > 0) {
    const starts = [...store.periodStarts].sort();
    store.periodRecords = starts.map((s) => ({ start: s, end: s }));
  }
  store.periodRecords.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  return store;
}
function getRecentRecords(recordsAsc, n) {
  const arr = Array.isArray(recordsAsc) ? recordsAsc : [];
  return arr.length <= n ? arr.slice() : arr.slice(arr.length - n);
}
function formatMonthDayCN(dateStr) {
  const d = parseDateStr(dateStr);
  if (!d) return '';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function getTodayStr() { return toDateStr(new Date()); }
function addDaysStr(dateStr, days) {
  const d = parseDateStr(dateStr);
  if (!d) return '';
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}
function formatRangeCN(a, b) { return a && b ? `${a} ~ ${b}` : ''; }

function buildCycleChangeCard(recordsAsc, settings) {
  const expected = (settings && settings.cycleLength) ? settings.cycleLength : DEFAULTS.cycleLength;

  const startsAsc = (recordsAsc || []).map(r => r.start).filter(Boolean).sort();
  if (startsAsc.length < 1) return null;

  const todayStr = getTodayStr();
  const currentStart = startsAsc[startsAsc.length - 1];
  const currentLen = diffDays(currentStart, todayStr) + 1;

  let lastStart = '', lastEnd = '', lastLen = 0, prevLen = 0;
  if (startsAsc.length >= 2) {
    lastStart = startsAsc[startsAsc.length - 2];
    const nextStart = startsAsc[startsAsc.length - 1];
    lastLen = diffDays(lastStart, nextStart);
    const endD = parseDateStr(nextStart); endD.setDate(endD.getDate() - 1);
    lastEnd = toDateStr(endD);
  }
  if (startsAsc.length >= 3) {
    const prevStart = startsAsc[startsAsc.length - 3];
    const prevNext = startsAsc[startsAsc.length - 2];
    prevLen = diffDays(prevStart, prevNext);
  }

  const normalTag = (lastLen >= 21 && lastLen <= 35) ? '正常' : '偏离';
  let deltaText = '—';
  if (lastLen && prevLen) {
    const delta = lastLen - prevLen;
    deltaText = delta === 0 ? '持平' : (delta > 0 ? `多 ${delta} 天` : `少 ${Math.abs(delta)} 天`);
  }

  const items = [];
  const currentDelta = currentLen - expected;
  items.push({
    dateLabel: formatMonthDayCN(currentStart),
    status: currentDelta <= 0 ? '准时' : `推迟${currentDelta}天`,
    lenText: `今天为当前周期${currentLen}天`,
    len: currentLen,
    isCurrent: true
  });

  let added = 0;
  for (let i = startsAsc.length - 1; i >= 1 && added < 2; i--) {
    const start = startsAsc[i - 1];
    const next = startsAsc[i];
    const len = diffDays(start, next);
    if (len <= 0) continue;
    const delta = len - expected;
    let status = '准时';
    if (delta > 0) status = `推迟${delta}天`;
    else if (delta < 0) status = `提前${Math.abs(delta)}天`;
    items.push({ dateLabel: formatMonthDayCN(start), status, lenText: `${len}天`, len, isCurrent: false });
    added++;
  }

  /**
   * ✅ 关键修复：条形图标尺上限固定为「用户设定周期 + 22」
   * 例如：设定 28 天 => 右侧上限 50 天（不会再“太满”）
   */
  const fixedMaxLen = Math.max(1, expected + 22);

  items.forEach((it) => {
    const rawPct = (it.len / fixedMaxLen) * 100;
    const pct = Math.round(rawPct);
    it.barPct = clamp(pct, 18, 100);       // ✅ 最小可见宽度 + 最大不超出
    it.barStyle = `width: ${it.barPct}%;`;
  });

  const rangeText = (lastStart && lastEnd) ? `最近 1 个周期（${lastStart} - ${lastEnd}）` : '最近 1 个周期（数据不足）';
  return { rangeText, lastLenText: lastLen ? `${lastLen}天` : '—', normalTag, deltaText, items };
}

function analyzeStability(recordsAsc) {
  const recent = getRecentRecords(recordsAsc, 4);
  if (recent.length < 4) return { stdev: null, text: '数据不足（建议至少记录4次经期）' };
  const lens = [];
  for (let i = 1; i < recent.length; i++) lens.push(diffDays(recent[i - 1].start, recent[i].start));
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const var0 = lens.reduce((a, b) => a + (b - mean) * (b - mean), 0) / lens.length;
  const stdev = Math.sqrt(var0);
  let text = '波动较大';
  if (stdev <= 3) text = '较稳定';
  else if (stdev <= 6) text = '略有波动';
  return { stdev, text };
}
function getLatestPeriodWindow(recentRecord, settings) {
  const start = recentRecord.start;
  let end = recentRecord.end;
  if (!end || end === start) {
    const len = (settings && settings.periodLength) ? settings.periodLength : DEFAULTS.periodLength;
    end = addDaysStr(start, Math.max(0, len - 1));
  }
  return { start, end };
}
function predictNext(recentStart, recentCycleLen, settings) {
  const cycleLength = (settings && settings.cycleLength) ? settings.cycleLength : DEFAULTS.cycleLength;
  const lutealDays = (settings && settings.lutealDays) ? settings.lutealDays : DEFAULTS.lutealDays;
  const usedCycle = recentCycleLen > 0 ? recentCycleLen : cycleLength;
  const nextStart = addDaysStr(recentStart, usedCycle);
  const ovulationDay = addDaysStr(nextStart, -lutealDays);
  const fertileStart = addDaysStr(ovulationDay, -5);
  const fertileEnd = addDaysStr(ovulationDay, 1);
  return { nextStart, ovulationDay, fertileRangeText: formatRangeCN(fertileStart, fertileEnd) };
}

export default {
  data() {
    return {
      hasData: false,
      latestStart: '',
      latestEnd: '',
      latestPeriodLen: 0,
      latestCycleLen: 0,
      stabilityText: '',
      confidenceText: '',
      nextStart: '',
      ovulationDay: '',
      fertileRangeText: '',
      cycleChange: null,
      painSummaryText: '',
      painLevelText: '',
      painPeakText: '',
      sexSummaryText: '',
      sexFertileText: '',
      sexUnprotectedText: '',

      // 体重 7 天
      weight7SubText: '近7天体重：暂无记录',
      latest7WeightText: '--.--',
      weightHintText: '体重记录不足（建议在经期前后多记录几天）',

      // canvas 尺寸
      canvasW: 1,
      canvasH: 1,
      canvasCssW: 0,
      canvasCssH: 0,
      dpr: 1
    };
  },
  onLoad() { this.refresh(); },
  onShow() { this.refresh(); },
  methods: {
    onGoWeight() {
      uni.navigateTo({
        url: '/pages/subperiod/weight/weight',
        fail: () => uni.showToast({ title: '体重页还没创建，先预留入口～', icon: 'none' })
      });
    },

    refresh() {
      const store = normalizeStore(loadStore());
      const settings = store.settings || DEFAULTS;
      const recordsAsc = store.periodRecords || [];

      // 体重：无论是否记录经期，都绘制
      const w7 = this.buildWeight7Series(store.weightRecords);
      this.setData({
        weight7SubText: w7.subText,
        latest7WeightText: w7.latestText,
        weightHintText: w7.hintText
      });
      this.$nextTick(() => this.measureCanvasAndDraw(w7));

      // 无经期记录：上面周期/痛经/行为不展示
      if (!recordsAsc.length) {
        this.setData({
          hasData: false,
          latestStart: '',
          latestEnd: '',
          latestPeriodLen: 0,
          latestCycleLen: 0,
          stabilityText: '',
          confidenceText: '',
          nextStart: '',
          ovulationDay: '',
          fertileRangeText: '',
          cycleChange: null,
          painSummaryText: '',
          painLevelText: '',
          painPeakText: '',
          sexSummaryText: '',
          sexFertileText: '',
          sexUnprotectedText: ''
        });
        return;
      }

      const recent = getRecentRecords(recordsAsc, 1)[0];
      const w0 = getLatestPeriodWindow(recent, settings);
      const latestStart = w0.start;
      const latestEnd = w0.end;
      const latestPeriodLen = diffDays(latestStart, addDaysStr(latestEnd, 1));

      const recent2 = getRecentRecords(recordsAsc, 2);
      let latestCycleLen = 0;
      if (recent2.length >= 2) latestCycleLen = diffDays(recent2[0].start, recent2[1].start);

      const stab = analyzeStability(recordsAsc);
      const stabilityText = stab.text;
      const confidenceText = recordsAsc.length >= 6 ? '高（记录较多）' : recordsAsc.length >= 4 ? '中（记录一般）' : '低（记录偏少）';

      const pred = predictNext(latestStart, latestCycleLen, settings);

      const cycleChange = buildCycleChangeCard(recordsAsc, settings);

      const painSummaryText = this.painSummaryText || '最近3个周期未记录痛经';
      const painLevelText = this.painLevelText || '';
      const painPeakText = this.painPeakText || '';
      const sexSummaryText = this.sexSummaryText || '最近一个周期记录爱爱 0 次';
      const sexFertileText = this.sexFertileText || '其中排卵期内 0 次';
      const sexUnprotectedText = this.sexUnprotectedText || '避孕方式记录较完整';

      this.setData({
        hasData: true,
        latestStart,
        latestEnd,
        latestPeriodLen,
        latestCycleLen,
        stabilityText,
        confidenceText,
        nextStart: pred.nextStart,
        ovulationDay: pred.ovulationDay,
        fertileRangeText: pred.fertileRangeText,
        cycleChange,
        painSummaryText,
        painLevelText,
        painPeakText,
        sexSummaryText,
        sexFertileText,
        sexUnprotectedText
      });
    },

    // 今天往前 7 天（含今天）；哪怕只记录 1 天也展示
    buildWeight7Series(weightRecords) {
      const today = new Date();
      const days = [];
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        days.push(ds);
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      }

      const map = {};
      (weightRecords || []).forEach((r) => {
        if (!r || !r.date) return;
        if (typeof r.weight !== 'number' || Number.isNaN(r.weight)) return;
        map[r.date] = r.weight;
      });

      const values = days.map(ds => (map[ds] != null ? map[ds] : null));
      const exist = values.filter(v => typeof v === 'number');

      let latestVal = null;
      const todayStr = days[6];
      if (map[todayStr] != null) latestVal = map[todayStr];
      else {
        for (let i = 6; i >= 0; i--) {
          const ds = days[i];
          if (map[ds] != null) { latestVal = map[ds]; break; }
        }
      }

      let subText = '近7天体重：暂无记录';
      let latestText = '--.--';
      let hintText = '体重记录不足（建议在经期前后多记录几天）';

      if (exist.length) {
        const min = Math.min(...exist);
        const max = Math.max(...exist);
        const wave = max - min;
        subText = `已记录 ${exist.length}/7 天 · 最近 ${fmt2(latestVal)}kg · 波动 ${fmt2(wave)}kg`;
        latestText = fmt2(latestVal);
        hintText = exist.length >= 3 ? '' : '体重记录不足（建议在经期前后多记录几天）';
      }

      return { labels, values, subText, latestText, hintText };
    },

    // 测量尺寸 + 绘制
    measureCanvasAndDraw(series) {
      uni.createSelectorQuery()
        .in(this)
        .select('#weight7Canvas')
        .boundingClientRect((rect) => {
          if (!rect || !rect.width || !rect.height) return;

          const W = Math.max(1, Math.round(rect.width));
          const H = Math.max(1, Math.round(rect.height));

          this.setData(
            { canvasW: W, canvasH: H, canvasCssW: rect.width, canvasCssH: rect.height, dpr: 1 },
            () => this.drawWeight7Canvas(series)
          );
        })
        .exec();
    },

    drawWeight7Canvas(series) {
	  const ctx = uni.createCanvasContext('weight7Canvas', this);
	
	  const W = this.canvasW || 300;
	  const H = this.canvasH || 160;
	
	  ctx.clearRect(0, 0, W, H);
	
	  // padding（像素）
	  const padL = 18;
	  const padR = 18;
	  const padT = 10;
	  const padB = 34; // ✅ 底部稍微再留一点：要放7个日期
	
	  const innerW = W - padL - padR;
	  const innerH = H - padT - padB;
	
	  // 网格线
	  ctx.setStrokeStyle('#f2f2f2');
	  ctx.setLineWidth(1);
	  for (let i = 0; i <= 3; i++) {
	    const y = padT + Math.round((innerH * i) / 3);
	    ctx.beginPath();
	    ctx.moveTo(padL, y);
	    ctx.lineTo(W - padR, y);
	    ctx.stroke();
	  }
	
	  // x 坐标（固定 7 天）
	  const xs = [];
	  for (let i = 0; i < 7; i++) xs.push(padL + Math.round((innerW * i) / 6));
	
	  const values = series.values || [];
	  const labels = series.labels || []; // "M/D"
	
	  // ✅ 横坐标：每天都显示（7个都显示）
	  ctx.setFillStyle('#999');
	  ctx.setFontSize(9); // ✅ 字更小一点，避免拥挤
	  for (let i = 0; i < labels.length; i++) {
	    const lb = labels[i] || '';
	    const x = xs[i];
	
	    const estW = lb.length * 5.2;
	    let tx = x - estW / 2;
	
	    // 边界保护：不出画布
	    tx = Math.max(2, Math.min(W - estW - 2, tx));
	
	    // 底部位置
	    ctx.fillText(lb, tx, H - 8);
	  }
	
	  const nums = values.filter(v => typeof v === 'number');
	  if (!nums.length) {
	    ctx.draw();
	    return;
	  }
	
	  let minV = Math.min(...nums);
	  let maxV = Math.max(...nums);
	  if (maxV - minV < 0.6) maxV = minV + 0.6;
	
	  const yOf = (v) => {
	    const t = (v - minV) / (maxV - minV);
	    const y = padT + innerH * (1 - t);
	    return Math.max(padT, Math.min(padT + innerH, y));
	  };
	
	  // 折线（遇到 null 断开）
	  ctx.setStrokeStyle('#ff6b9a');
	  ctx.setLineWidth(3);
	  let started = false;
	
	  values.forEach((v, i) => {
	    if (typeof v !== 'number') {
	      if (started) ctx.stroke();
	      started = false;
	      return;
	    }
	    const x = xs[i];
	    const y = yOf(v);
	    if (!started) {
	      ctx.beginPath();
	      ctx.moveTo(x, y);
	      started = true;
	    } else {
	      ctx.lineTo(x, y);
	    }
	  });
	  if (started) ctx.stroke();
	
	  // ✅ 点（粉色不变）
	  const r = 4;
	  ctx.setFillStyle('#ff6b9a');
	
	  // ✅ 文字：统一深灰色 & 放在点下面
	  const textColor = '#444';
	  const fontSize = 10; // 不能太大
	  ctx.setFontSize(fontSize);
	  ctx.setFillStyle(textColor);
	
	  values.forEach((v, i) => {
	    if (typeof v !== 'number') return;
	
	    const x = xs[i];
	    const y = yOf(v);
	
	    // 点要用粉色画（注意：我们刚刚把 fillStyle 改深灰了，所以这里先切回粉色）
	    ctx.setFillStyle('#ff6b9a');
	    ctx.beginPath();
	    ctx.arc(x, y, r, 0, Math.PI * 2);
	    ctx.fill();
	
	    // 再切回深灰写字
	    ctx.setFillStyle(textColor);
	
	    const text = `${v.toFixed(2)}kg`;
	    const estW = text.length * 5.5;
	    let tx = x - estW / 2;
	
	    // 边界保护
	    tx = Math.max(2, Math.min(W - estW - 2, tx));
	
	    // ✅ 放点下面：y + 16
	    // 同时防止贴到最底部（要给日期让位）
	    const maxTextY = H - 18;        // 离底部留点空间给日期
	    const ty = Math.min(maxTextY, y + 16);
	
	    ctx.fillText(text, tx, ty);
	  });
	
	  ctx.draw();
	},

  }
};
</script>

<style>
@import './analysis.css';
</style>
