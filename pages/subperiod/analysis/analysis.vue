<template>
  <view class="page">
   <!-- <view class="card">
      <view class="header">
        <text class="title">经期健康分析</text>
      </view>
	  <view class="header">
	    <text class="sub" v-if="hasData">基于已有记录生成（仅供参考）</text>
	    <text class="sub" v-else>暂无经期记录，先在日历里记录“月经来了”再回来看看</text>
	  </view>
    </view> -->

    <view v-if="hasData">
      <!-- 1) 本周期概览 -->
	  <view class="card">
	    <view class="card-title">
	      <image class="card-title-icon" src="/static/assets/icons/f_gl.svg" mode="aspectFit" />
	      <text class="card-title-text">本周期概览</text>
	    </view>
	  
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
	      <text class="k">预测可信度</text>
	      <text class="v">{{ confidenceText }}</text>
	    </view>
	  </view>


      <!-- 2) 预测信息 -->
<!--      <view class="card">
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
      </view> -->

      <!-- 3) 周期变化 -->
      <view class="card" v-if="cycleChange">
        <view class="cycle-head">
          <view class="cycle-head-left">
            <image class="cycle-icon" src="/static/assets/icons/f_rq.svg" mode="aspectFit" />
            <text class="cycle-title">周期变化</text>
          </view>
          <!-- <image class="cycle-arrow" src="/static/assets/icons/f_tz.svg" mode="aspectFit" /> -->
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

            <!-- 文字不放在粉色条里，避免被裁剪 -->
            <view class="cycle-bar-wrap">
              <view class="cycle-bar" :style="item.barStyle"></view>
              <text class="cycle-bar-text-fixed">{{ item.lenText }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 4) 痛经 -->
      <view class="card">
        <!-- <view class="card-title">痛经情况</view> -->
		<view class="card-title">
		  <image class="card-title-icon" src="/static/assets/icons/f_t.svg" mode="aspectFit" />
		  <text class="card-title-text">痛经情况</text>
		</view>
		
        <view class="p">{{ painSummaryText }}</view>
        <view class="p">{{ painLevelText }}</view>
        <view class="p">{{ painPeakText }}</view>
      </view>

      <!-- 5) 行为 -->
      <view class="card">
        <view class="card-title card-title--with-right" @tap="onGoLove()">
          <view class="card-title-left">
            <image class="card-title-icon" src="/static/assets/icons/f_sax.svg" mode="aspectFit" />
            <text class="card-title-text">行为与风险提示</text>
          </view>
          <image class="card-title-right-icon" src="/static/assets/icons/f_tz.svg" mode="aspectFit" />
        </view>
      
        <!-- 顶部一行：本周期次数 + 怀孕几率 -->
        <view class="sex-topline">
          <view class="sex-topitem">
            <text class="sex-toplabel">本周期爱爱</text>
            <text class="sex-topvalue">{{ sexCycleTotal }}</text>
            <text class="sex-topunit">次</text>
          </view>
        </view>
      
        <!-- 双柱状图：粉色=本周期，灰色=上周期 -->
        <view class="sex-chart">
          <view class="sex-group" v-for="(it, idx) in sexPhaseBars" :key="idx">
            <view class="sex-cols">
              <!-- 左：上一周期 -->
              <view class="sex-col">
                <text class="sex-num">{{ it.prev }}</text>
                <view
                  class="sex-bar sex-bar--prev"
                  :style="'height:' + it.prevPct + '%'"
                ></view>
              </view>
            
              <!-- 右：本周期 -->
              <view class="sex-col">
                <text class="sex-num">{{ it.cur }}</text>
                <view
                  class="sex-bar sex-bar--cur"
                  :style="'height:' + it.curPct + '%'"
                ></view>
              </view>
            </view>

            <text class="sex-xlabel">{{ it.label }}</text>
          </view>
        </view>
		<!-- 给“爱爱”记录加上图例 -->
		<view class="sex-legend">
		  <view class="legend-item">
		    <view class="legend-dot legend-dot--prev"></view>
		    <text class="legend-text">上一周期</text>
		  </view>
		
		  <view class="legend-item">
		    <view class="legend-dot legend-dot--cur"></view>
		    <text class="legend-text">本周期</text>
		  </view>
		</view>

      </view>

    </view>

    <!-- 6) 体重趋势：无论是否记录月经，都显示；保留跳转 -->
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
  store.painRecords = (store.painRecords && typeof store.painRecords === 'object' && !Array.isArray(store.painRecords)) ? store.painRecords : {};
  store.sexRecords  = (store.sexRecords  && typeof store.sexRecords  === 'object' && !Array.isArray(store.sexRecords))  ? store.sexRecords  : {};
  store.sexDates = Array.isArray(store.sexDates) ? store.sexDates : [];



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
   * 条形图标尺上限固定为「用户设定周期 + 22」
   * 例如：设定 28 天 => 右侧上限 50 天
   */
  const fixedMaxLen = Math.max(1, expected + 22);

  items.forEach((it) => {
    const rawPct = (it.len / fixedMaxLen) * 100;
    const pct = Math.round(rawPct);
    it.barPct = clamp(pct, 18, 100);       // 最小可见宽度 + 最大不超出
    it.barStyle = `width: ${it.barPct}%;`;
  });

  const rangeText = (lastStart && lastEnd) ? `最近 1 个周期（${lastStart} - ${lastEnd}）` : '最近 1 个周期（数据不足）';
  return { rangeText, lastLenText: lastLen ? `${lastLen}天` : '—', normalTag, deltaText, items };
}

function analyzeStability(recordsAsc) {
  const recent = getRecentRecords(recordsAsc, 4);
  if (recent.length < 4) return { stdev: null, text: '数据不足（经期记录少于4次）' };
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
  // return { nextStart, ovulationDay, fertileRangeText: formatRangeCN(fertileStart, fertileEnd) };
  return { nextStart, ovulationDay, fertileStart, fertileEnd, fertileRangeText: formatRangeCN(fertileStart, fertileEnd) };
}

// 痛经记录
function inRangeDateStr(ds, start, end) {
  if (!ds || !start || !end) return false;
  return ds >= start && ds <= end; // YYYY-MM-DD 字符串可直接比较
}

function buildPainTexts(painRecords, cycleStart, cycleEnd) {
  const pr = painRecords && typeof painRecords === 'object' ? painRecords : {};
  const levelOrder = ['轻微', '一般', '严重', '非常严重'];
  const levelRank = {};
  levelOrder.forEach((lv, i) => (levelRank[lv] = i));

  const entries = [];
  Object.keys(pr).forEach((ds) => {
    if (!inRangeDateStr(ds, cycleStart, cycleEnd)) return;
    const list = Array.isArray(pr[ds]) ? pr[ds] : [];
    list.forEach((it) => entries.push({ ...it, _date: ds }));
  });

  const total = entries.length;
  if (!total) {
    return {
      painSummaryText: '本周期未记录痛经',
      painLevelText: '',
      painPeakText: ''
    };
  }

  // 统计程度
  const counts = {};
  let peakLv = '';
  let peakRank = -1;

  entries.forEach((it) => {
    const lv = (it && it.level) ? it.level : '未选择程度';
    counts[lv] = (counts[lv] || 0) + 1;

    const r = (lv in levelRank) ? levelRank[lv] : -1;
    if (r > peakRank) {
      peakRank = r;
      peakLv = lv;
    }
  });

  // 最常见程度
  let commonLv = '';
  let commonCnt = 0;
  Object.keys(counts).forEach((lv) => {
    if (counts[lv] > commonCnt) {
      commonCnt = counts[lv];
      commonLv = lv;
    }
  });

  // 分布文案（只展示有数据的项）
  const distParts = levelOrder
    .filter((lv) => counts[lv])
    .map((lv) => `${lv}${counts[lv]}次`);
  if (counts['未选择程度']) distParts.push(`未选择${counts['未选择程度']}次`);

  return {
    painSummaryText: `本周期记录痛经 ${total} 次（${cycleStart} ~ ${cycleEnd}）`,
    painLevelText: distParts.length ? `程度分布：${distParts.join('，')}` : '',
    painPeakText: peakLv ? `最严重程度：${peakLv}；最常见：${commonLv}` : ''
  };
}


// 爱爱记录
function buildSexTexts(store, rangeStart, rangeEnd, ovulationDay) {
  const sexRecords = store.sexRecords || {};
  const sexDates = Array.isArray(store.sexDates) ? store.sexDates : [];

  function inRange(ds, a, b) { return ds && a && b && ds >= a && ds <= b; }
  const unprotectedRe = /(无|不避孕|未避孕|不使用|没用)/;

  let total = 0;
  let withMethod = 0;
  let unprotected = 0;

  // 1) 详细记录
  Object.keys(sexRecords).forEach((ds) => {
    if (!inRange(ds, rangeStart, rangeEnd)) return;
    const list = Array.isArray(sexRecords[ds]) ? sexRecords[ds] : [];
    total += list.length;

    list.forEach((it) => {
      const m = (it && it.method) ? String(it.method).trim() : '';
      if (m) withMethod += 1;
      if (!m || unprotectedRe.test(m)) unprotected += 1;
    });
  });

  // 2) 兜底：只有小心心日期但没详细条目时，当天按 1 次
  sexDates.forEach((ds) => {
    if (!inRange(ds, rangeStart, rangeEnd)) return;
    const list = Array.isArray(sexRecords[ds]) ? sexRecords[ds] : [];
    if (!list.length) total += 1;
  });

  // 3) 排卵期统计（-5 ~ +1）
  let fertile = 0;
  if (ovulationDay) {
    const fs = addDaysStr(ovulationDay, -5);
    const fe = addDaysStr(ovulationDay, 1);

    Object.keys(sexRecords).forEach((ds) => {
      if (!inRange(ds, fs, fe)) return;
      const list = Array.isArray(sexRecords[ds]) ? sexRecords[ds] : [];
      fertile += list.length;
    });

    sexDates.forEach((ds) => {
      if (!inRange(ds, fs, fe)) return;
      const list = Array.isArray(sexRecords[ds]) ? sexRecords[ds] : [];
      if (!list.length) fertile += 1;
    });
  }

  const missMethod = Math.max(0, total - withMethod);

  return {
    summary: `本周期记录爱爱 ${total} 次`,
    fertile: ovulationDay ? `其中排卵期内 ${fertile} 次（按推算）` : '排卵期数据不足，无法统计',
    unprotected: total === 0
      ? '暂无避孕方式记录'
      : (missMethod === 0 ? '避孕方式记录较完整' : `有 ${missMethod}/${total} 次未记录避孕方式（或标记为未避孕）`)
  };
}

/**
 * 统计爱爱次数：按「月经期 / 排卵期 / 其他时间」归类；同时统计“未记录/未避孕”次数，用于风险估算。
 * 注意：为了和旧逻辑一致：
 * - sexRecords[ds] 里每条算 1 次
 * - sexDates 里若当天没有详细条目，则当天按 1 次（视为未记录避孕方式）
 */
function buildSexPhaseCounts(store, rangeStart, rangeEnd, periodStart, periodEnd, fertileStart, fertileEnd) {
  const sexRecords = store.sexRecords || {};
  const sexDates = Array.isArray(store.sexDates) ? store.sexDates : [];
  const unprotectedRe = /(无|不避孕|未避孕|不使用|没用)/;

  function inRange(ds, a, b) { return ds && a && b && ds >= a && ds <= b; }
  function bucketOf(ds) {
    if (periodStart && periodEnd && inRange(ds, periodStart, periodEnd)) return 'period';
    if (fertileStart && fertileEnd && inRange(ds, fertileStart, fertileEnd)) return 'ovulation';
    return 'other';
  }

  const out = {
    period: { total: 0, unprotected: 0 },
    ovulation: { total: 0, unprotected: 0 },
    other: { total: 0, unprotected: 0 }
  };

  // 1) 详细记录
  Object.keys(sexRecords).forEach((ds) => {
    if (!inRange(ds, rangeStart, rangeEnd)) return;
    const list = Array.isArray(sexRecords[ds]) ? sexRecords[ds] : [];
    if (!list.length) return;

    const key = bucketOf(ds);
    out[key].total += list.length;

    list.forEach((it) => {
      const m = (it && it.method) ? String(it.method).trim() : '';
      if (!m || unprotectedRe.test(m)) out[key].unprotected += 1;
    });
  });

  // 2) 兜底：只有小心心日期但没详细条目时，当天按 1 次（并计为未记录避孕方式）
  sexDates.forEach((ds) => {
    if (!inRange(ds, rangeStart, rangeEnd)) return;
    const list = Array.isArray(sexRecords[ds]) ? sexRecords[ds] : [];
    if (list.length) return;
    const key = bucketOf(ds);
    out[key].total += 1;
    out[key].unprotected += 1;
  });

  return out;
}

// 简单风险估算：只做“提示”，不做医学承诺；系数后续可调
function estimatePregnancyRatePct(curPhaseCounts) {
  if (!curPhaseCounts) return 0;
  const p = curPhaseCounts.period || { total: 0, unprotected: 0 };
  const o = curPhaseCounts.ovulation || { total: 0, unprotected: 0 };
  const other = curPhaseCounts.other || { total: 0, unprotected: 0 };

  const totalAll = (p.total || 0) + (o.total || 0) + (other.total || 0);
  if (!totalAll) return 0;

  let risk = 0;
  risk += (o.unprotected || 0) * 8;
  risk += (o.total || 0) * 2;
  risk += (other.unprotected || 0) * 1;

  return clamp(risk, 0, 45);
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
	  
	  // 本周期"爱爱次数"记录
      sexSummaryText: '',
      sexFertileText: '',
      sexUnprotectedText: '',
	  // 上一周期"爱爱次数"记录
	  sexPrevSummaryText: '',
	  sexPrevFertileText: '',
	  sexPrevUnprotectedText: '',
	  // 新UI：顶部汇总 + 柱状图
	  sexCycleTotal: 0,
	  sexPregRateText: '0.0%',
	  // [{ label: '月经期', cur: 0, prev: 0, curPct: 0, prevPct: 0 }]
	  sexPhaseBars: [],


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
        // url: '/pages/subperiod/weight/weight',
        fail: () => uni.showToast({ title: '“体重分析"页维护中，请等待更新', icon: 'none' })
      });
    },
	
	onGoLove() {
	  uni.navigateTo({
	    url: '/pages/subperiod/love/love',
	    // fail: () => uni.showToast({ title: '“爱爱"页维护中', icon: 'none' })
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
          sexUnprotectedText: '',
		  sexPrevSummaryText: '',
		  sexPrevFertileText: '',
		  sexPrevUnprotectedText: '',
		  
		  sexCycleTotal: 0,
		  sexPregRateText: '0.0%',
		  sexPhaseBars: [],


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
	  const todayStr = getTodayStr();
	  
	  // 本周期范围：latestStart ~ (下次预计开始前一天)，没有预测就到今天
	  const thisCycleEnd = pred.nextStart ? addDaysStr(pred.nextStart, -1) : todayStr;
	  const thisSex = buildSexTexts(store, latestStart, thisCycleEnd, pred.ovulationDay);
	  
	  // 上一周期：start = 前一次经期开始；end = 本次开始前一天
	  let prevSex = { summary: '上一周期数据不足', fertile: '', unprotected: '' };
	  
	  // === 新UI：按阶段统计（本周期 vs 上周期） ===
	  // 本周期：月经期范围（latestStart ~ latestEnd），排卵期范围（pred.fertileStart ~ pred.fertileEnd）
	  const curPhaseCounts = buildSexPhaseCounts(
	    store,
	    latestStart,
	    thisCycleEnd,
	    latestStart,
	    latestEnd,
	    pred.fertileStart,
	    pred.fertileEnd
	  );
	  
	  // 上一周期：需要上一条经期记录的「经期窗口」
	  let prevPhaseCounts = {
	    period: { total: 0, unprotected: 0 },
	    ovulation: { total: 0, unprotected: 0 },
	    other: { total: 0, unprotected: 0 }
	  };
	  const startsAsc = (recordsAsc || []).map(r => r.start).filter(Boolean).sort();
	  if (startsAsc.length >= 2) {
	    const prevRecord = recordsAsc[recordsAsc.length - 2];
	    const prevWindow = getLatestPeriodWindow(prevRecord, settings);
	    const prevStart = prevWindow.start;
	    const prevPeriodEnd = prevWindow.end;
	    const prevEnd = addDaysStr(latestStart, -1);
	    const prevCycleLen = diffDays(prevStart, latestStart);
	    const prevPred = predictNext(prevStart, prevCycleLen, settings);
	  
	    prevPhaseCounts = buildSexPhaseCounts(
	      store,
	      prevStart,
	      prevEnd,
	      prevStart,
	      prevPeriodEnd,
	      prevPred.fertileStart,
	      prevPred.fertileEnd
	    );
	  }
	  
	  // 柱状图数据 + 百分比高度
	  const chart = [
	    { label: '月经期', cur: curPhaseCounts.period.total, prev: prevPhaseCounts.period.total },
	    { label: '排卵期', cur: curPhaseCounts.ovulation.total, prev: prevPhaseCounts.ovulation.total },
	    { label: '其他时间', cur: curPhaseCounts.other.total, prev: prevPhaseCounts.other.total }
	  ];
	  const maxVal = Math.max(0, ...chart.map(x => x.cur), ...chart.map(x => x.prev));
	  const denom = maxVal > 0 ? maxVal : 1;
	  
	  const withPct = chart.map((it) => {
	    const curPct0 = Math.round((it.cur / denom) * 100);
	    const prevPct0 = Math.round((it.prev / denom) * 100);
	    // 视觉：非 0 最低给一点高度，避免“1次”看不见
	    const curPct = it.cur > 0 ? Math.max(10, curPct0) : 0;
	    const prevPct = it.prev > 0 ? Math.max(10, prevPct0) : 0;
	    return { ...it, curPct, prevPct };
	  });
	  
	  const sexCycleTotal = chart.reduce((s, x) => s + (x.cur || 0), 0);
	  const riskPct = estimatePregnancyRatePct(curPhaseCounts);
	  const sexPregRateText = `${riskPct.toFixed(1)}%`;

	  const cycleChange = buildCycleChangeCard(recordsAsc, settings);
	  
	  // 痛经：从 store.painRecords 现算（本周期范围：latestStart ~ thisCycleEnd）
	  const painTexts = buildPainTexts(store.painRecords, latestStart, thisCycleEnd);
	  const painSummaryText = painTexts.painSummaryText;
	  const painLevelText = painTexts.painLevelText;
	  const painPeakText = painTexts.painPeakText;

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
        // sexSummaryText,
        // sexFertileText,
        // sexUnprotectedText
		sexSummaryText: thisSex.summary,
		sexFertileText: thisSex.fertile,
		sexUnprotectedText: thisSex.unprotected,

		sexPrevSummaryText: prevSex.summary,
		sexPrevFertileText: prevSex.fertile,
		sexPrevUnprotectedText: prevSex.unprotected,

		sexCycleTotal,
		sexPregRateText,
		sexPhaseBars: withPct,

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
        subText = `已记录 ${exist.length}/7 天 · 最近 ${fmt2(latestVal)}kg · 周期内最大波动 ${fmt2(wave)}kg`;
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
	  const padB = 34; // 底部稍微再留一点：要放7个日期
	
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
	
	  // 横坐标：每天都显示（7个都显示）
	  ctx.setFillStyle('#999');
	  ctx.setFontSize(9); // 字更小一点，避免拥挤
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
	
	  // 点（粉色不变）
	  const r = 4;
	  ctx.setFillStyle('#ff6b9a');
	
	  // 文字：统一深灰色 & 放在点下面
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
	
	    // 放点下面：y + 16
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
