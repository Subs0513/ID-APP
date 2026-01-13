<template>
    <!-- pages/subperiod/analysis/analysis.wxml -->
    <view class="page">
        <view class="card">
            <view class="header">
                <text class="title">经期健康分析</text>
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

            <!-- 3) 周期变化（新增，放在痛经上面） -->
            <view class="card" v-if="cycleChange">
                <view class="cycle-head">
                    <view class="cycle-head-left">
                        <image class="cycle-icon" src="/static/assets/icons/粉_日期.svg" mode="aspectFit" />
                        <text class="cycle-title">周期变化</text>
                    </view>
                    <image class="cycle-arrow" src="/static/assets/icons/粉_跳转.svg" mode="aspectFit" />
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

                        <view class="cycle-bar-wrap">
                            <view class="cycle-bar" :style="item.barStyle">
                                <text class="cycle-bar-text">{{ item.lenText }}</text>
                            </view>
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

            <!-- 6) 体重 -->
            <view class="card">
                <view class="card-title">体重变化（围绕最近经期）</view>
                <view class="p">{{ weightText }}</view>
            </view>
        </view>
    </view>
</template>

<script>
// pages/subperiod/analysis/analysis.js
// ✅ 经期健康分析：只读 period_record_v1 的 store，不改数据
const STORE_KEY = 'period_record_v1';
const DEFAULTS = {
    cycleLength: 28,
    periodLength: 5,
    lutealDays: 14
};
function pad2(n) {
    return (n < 10 ? '0' : '') + n;
}
function toDateStr(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseDateStr(s) {
    if (!s) {
        return null;
    }
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function diffDays(aStr, bStr) {
    // b - a (天)
    const a = parseDateStr(aStr);
    const b = parseDateStr(bStr);
    if (!a || !b) {
        return 0;
    }
    return Math.round((b - a) / 86400000);
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function round1(x) {
    return Math.round(x * 10) / 10;
}
function loadStore() {
    const v = uni.getStorageSync(STORE_KEY);
    return v && typeof v === 'object' ? v : {};
}
function normalizeStore(store) {
    // 兼容 period.js 的迁移逻辑（尽量不依赖外部函数，analysis 自己兜底）
    store.settings = store.settings || {
        ...DEFAULTS
    };
    store.periodRecords = Array.isArray(store.periodRecords) ? store.periodRecords : [];
    store.periodStarts = Array.isArray(store.periodStarts) ? store.periodStarts : [];
    store.painRecords = Array.isArray(store.painRecords) ? store.painRecords : [];
    store.sexRecords = Array.isArray(store.sexRecords) ? store.sexRecords : [];
    store.sexDates = Array.isArray(store.sexDates) ? store.sexDates : [];
    store.weightRecords = Array.isArray(store.weightRecords) ? store.weightRecords : [];

    // 旧数据：只有 periodStarts => 迁移成 periodRecords
    if (store.periodRecords.length === 0 && store.periodStarts.length > 0) {
        const starts = [...store.periodStarts].sort(); // YYYY-MM-DD
        store.periodRecords = starts.map((s) => ({
            start: s,
            end: s
        }));
    }

    // periodRecords 保证升序
    store.periodRecords.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    return store;
}

/** 最近 N 条经期（按 start 升序的 recordsAsc 取最后 N 条） */
function getRecentRecords(recordsAsc, n) {
    const arr = Array.isArray(recordsAsc) ? recordsAsc : [];
    if (arr.length <= n) {
        return arr.slice();
    }
    return arr.slice(arr.length - n);
}

/** 计算周期长度列表：相邻 start 差值（天） */

function formatMonthDayCN(dateStr) {
    const d = parseDateStr(dateStr);
    if (!d) {
        return '';
    }
    return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function getTodayStr() {
    return toDateStr(new Date());
}

/** 周期变化卡片：当前周期 + 最近2个已完成周期 */
function buildCycleChangeCard(recordsAsc, settings) {
    const expected = settings && settings.cycleLength ? settings.cycleLength : DEFAULTS.cycleLength;
    const startsAsc = (recordsAsc || [])
        .map((r) => r.start)
        .filter(Boolean)
        .sort(); // YYYY-MM-DD
    if (startsAsc.length < 1) {
        return null;
    }
    const todayStr = getTodayStr();
    const currentStart = startsAsc[startsAsc.length - 1];
    const currentLen = diffDays(currentStart, todayStr) + 1; // 含起始日

    // 最近1个已完成周期：start = 倒数第2个，next = 倒数第1个
    let lastStart = '';
    let lastEnd = '';
    let lastLen = 0;
    let prevLen = 0;
    if (startsAsc.length >= 2) {
        lastStart = startsAsc[startsAsc.length - 2];
        const nextStart = startsAsc[startsAsc.length - 1];
        lastLen = diffDays(lastStart, nextStart);
        const endD = parseDateStr(nextStart);
        endD.setDate(endD.getDate() - 1);
        lastEnd = toDateStr(endD);
    }
    if (startsAsc.length >= 3) {
        const prevStart = startsAsc[startsAsc.length - 3];
        const prevNext = startsAsc[startsAsc.length - 2];
        prevLen = diffDays(prevStart, prevNext);
    }
    const normalTag = lastLen >= 21 && lastLen <= 35 ? '正常' : '偏离';
    let deltaText = '—';
    if (lastLen && prevLen) {
        const delta = lastLen - prevLen;
        if (delta === 0) {
            deltaText = '持平';
        } else {
            deltaText = delta > 0 ? `多 ${delta} 天` : `少 ${Math.abs(delta)} 天`;
        }
    }

    // 列表：当前周期 + 最近2个已完成周期
    const items = [];
    const currentDelta = currentLen - expected;
    items.push({
        dateLabel: formatMonthDayCN(currentStart),
        status: currentDelta <= 0 ? '准时' : `推迟${currentDelta}天`,
        lenText: `当前周期${currentLen}天`,
        len: currentLen,
        isCurrent: true
    });

    // 已完成周期（最多2条）
    let added = 0;
    for (let i = startsAsc.length - 1; i >= 1 && added < 2; i--) {
        const start = startsAsc[i - 1];
        const next = startsAsc[i];
        const len = diffDays(start, next);
        if (len <= 0) {
            continue;
        }
        const delta = len - expected;
        let status = '准时';
        if (delta > 0) status = `推迟${delta}天`;
        else if (delta < 0) {
            status = `提前${Math.abs(delta)}天`;
        }
        items.push({
            dateLabel: formatMonthDayCN(start),
            status,
            lenText: `${len}天`,
            len,
            isCurrent: false
        });
        added++;
    }

    // 进度条宽度：按 maxLen 比例（最少 30%，最多 100%）
    const maxLen = Math.max(...items.map((x) => x.len || 0), expected, 1);
    items.forEach((it) => {
        const pct = Math.round((it.len / maxLen) * 100);
        it.barPct = clamp(pct, 30, 100);
    });
    const rangeText = lastStart && lastEnd ? `最近 1 个周期（${lastStart} - ${lastEnd}）` : '最近 1 个周期（数据不足）';
    return {
        rangeText,
        lastLenText: lastLen ? `${lastLen}天` : '—',
        normalTag,
        deltaText,
        items
    };
}

/** 评估周期稳定性（最近4次经期 => 3段周期） */
function analyzeStability(recordsAsc) {
    const recent = getRecentRecords(recordsAsc, 4);
    if (recent.length < 4) {
        return {
            stdev: null,
            text: '数据不足（建议至少记录4次经期）'
        };
    }
    const lens = [];
    for (let i = 1; i < recent.length; i++) {
        lens.push(diffDays(recent[i - 1].start, recent[i].start));
    }
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const var0 = lens.reduce((a, b) => a + (b - mean) * (b - mean), 0) / lens.length;
    const stdev = Math.sqrt(var0);
    let text = '波动较大';
    if (stdev <= 3) text = '较稳定';
    else if (stdev <= 6) {
        text = '略有波动';
    }
    return {
        stdev,
        text
    };
}
function addDaysStr(dateStr, days) {
    const d = parseDateStr(dateStr);
    if (!d) {
        return '';
    }
    d.setDate(d.getDate() + days);
    return toDateStr(d);
}
function formatRangeCN(a, b) {
    if (!a || !b) {
        return '';
    }
    return `${a} ~ ${b}`;
}

/** 最近一次经期：start..end，若 end 缺失则按 settings.periodLength 推 */
function getLatestPeriodWindow(recentRecord, settings) {
    const start = recentRecord.start;
    let end = recentRecord.end;
    if (!end || end === start) {
        const len = settings && settings.periodLength ? settings.periodLength : DEFAULTS.periodLength;
        end = addDaysStr(start, Math.max(0, len - 1));
    }
    return {
        start,
        end
    };
}

/** 预测：基于最近周期长度 + 黄体期 */
function predictNext(recentStart, recentCycleLen, settings) {
    const cycleLength = settings && settings.cycleLength ? settings.cycleLength : DEFAULTS.cycleLength;
    const lutealDays = settings && settings.lutealDays ? settings.lutealDays : DEFAULTS.lutealDays;
    const usedCycle = recentCycleLen > 0 ? recentCycleLen : cycleLength;
    const nextStart = addDaysStr(recentStart, usedCycle);
    const ovulationDay = addDaysStr(nextStart, -lutealDays);
    const fertileStart = addDaysStr(ovulationDay, -5);
    const fertileEnd = addDaysStr(ovulationDay, 1);
    return {
        nextStart,
        ovulationDay,
        fertileRangeText: formatRangeCN(fertileStart, fertileEnd)
    };
}

/** 痛经：最近3个周期统计 */
function analyzePain(painRecords, recordsAsc, cycleLenForWindow) {
    const latest2 = getRecentRecords(recordsAsc, 2);
    if (latest2.length < 2) {
        return {
            summary: '痛经：数据不足（至少需要2次经期开始日期）',
            levelText: '',
            peakText: ''
        };
    }
    const lastStart = latest2[latest2.length - 1].start;
    const prevStart = latest2[latest2.length - 2].start;

    // 最近3个周期窗口：从 (lastStart - 2*cycleLen) 到 (lastStart + 1)
    const cycleLen = cycleLenForWindow || DEFAULTS.cycleLength;
    const windowStart = addDaysStr(lastStart, -2 * cycleLen);
    const windowEnd = addDaysStr(lastStart, 1);
    const inWindow = (painRecords || []).filter((r) => r && r.date >= windowStart && r.date <= windowEnd);
    if (!inWindow.length) {
        return {
            summary: '最近3个周期未记录痛经',
            levelText: '',
            peakText: ''
        };
    }

    // 次数 & 严重程度
    const total = inWindow.length;
    const levelCount = {
        mild: 0,
        moderate: 0,
        severe: 0,
        unknown: 0
    };
    inWindow.forEach((r) => {
        const lv = r.level || 'unknown';
        if (levelCount[lv] == null) {
            levelCount.unknown++;
        } else {
            levelCount[lv]++;
        }
    });

    // 最常出现的“周期第几天”
    const dayIndexCount = {};
    inWindow.forEach((r) => {
        const idx = diffDays(lastStart, r.date) + 1; // 以最近一次 start 为参考
        const key = String(idx);
        dayIndexCount[key] = (dayIndexCount[key] || 0) + 1;
    });
    let peakDay = '';
    let peakN = 0;
    Object.keys(dayIndexCount).forEach((k) => {
        if (dayIndexCount[k] > peakN) {
            peakN = dayIndexCount[k];
            peakDay = k;
        }
    });
    const summary = `最近3个周期共记录痛经 ${total} 次`;
    const levelText = `轻度 ${levelCount.mild} 次，中度 ${levelCount.moderate} 次，重度 ${levelCount.severe} 次`;
    const peakText = peakDay ? `更常出现在周期第 ${peakDay} 天（${peakN} 次）` : '';
    return {
        summary,
        levelText,
        peakText
    };
}

/** 爱爱：仅分析最近一个周期（lastStart..nextStart-1） */
function analyzeSex(sexRecords, lastStart, nextStart, fertileRangeText) {
    const start = lastStart;
    const end = addDaysStr(nextStart, -1);
    const inCycle = (sexRecords || []).filter((r) => r && r.date >= start && r.date <= end);

    // 排卵期窗口
    let fertileStart = '';
    let fertileEnd = '';
    if (fertileRangeText) {
        const parts = fertileRangeText.split('~').map((s) => s.trim());
        fertileStart = parts[0];
        fertileEnd = parts[1];
    }
    const inFertile = fertileStart && fertileEnd ? inCycle.filter((r) => r.date >= fertileStart && r.date <= fertileEnd) : [];
    const unprotectedCount = inCycle.filter((r) => !r.contraception || r.contraception === '无' || r.contraception === '未填写').length;
    return {
        cycleCount: inCycle.length,
        fertileCount: inFertile.length,
        unprotectedCount
    };
}

/** 体重：经期前3天 vs 经期中（start..end） */
function analyzeWeightAroundPeriod(weightRecords, start, end) {
    const preStart = addDaysStr(start, -3);
    const preEnd = addDaysStr(start, -1);
    const pre = (weightRecords || []).filter((r) => r && r.date >= preStart && r.date <= preEnd && typeof r.weight === 'number');
    const mid = (weightRecords || []).filter((r) => r && r.date >= start && r.date <= end && typeof r.weight === 'number');
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b.weight, 0) / arr.length : 0);
    const preAvg = round1(avg(pre));
    const inAvg = round1(avg(mid));
    const delta = round1(inAvg - preAvg);
    return {
        preCount: pre.length,
        inCount: mid.length,
        preAvg,
        inAvg,
        delta
    };
}
export default {
    data() {
        return {
            hasData: false,
            // 概览
            latestStart: '',
            latestEnd: '',
            latestPeriodLen: 0,
            latestCycleLen: 0,
            stabilityText: '',
            confidenceText: '',
            // 预测
            nextStart: '',
            ovulationDay: '',
            fertileRangeText: '',
            // 周期变化
            cycleChange: null,
            // 痛经
            painSummaryText: '',
            painLevelText: '',
            painPeakText: '',
            // 爱爱
            sexSummaryText: '',
            sexFertileText: '',
            sexUnprotectedText: '',
            // 体重
            weightText: ''
        };
    },
    onLoad() {
        this.refresh();
    },
    onShow() {
        this.refresh();
    },
    methods: {
        refresh() {
            const store0 = loadStore();
            const store = normalizeStore(store0);
            const settings = store.settings || DEFAULTS;
            const cycleLength = settings.cycleLength || DEFAULTS.cycleLength;
            const lutealDays = settings.lutealDays || DEFAULTS.lutealDays;
            const recordsAsc = store.periodRecords || [];
            if (!recordsAsc.length) {
                this.setData({
                    hasData: false
                });
                return;
            }

            // 最近一次经期（按 start 最新）
            const recent = getRecentRecords(recordsAsc, 1)[0];

            // 最近经期窗口（start..end）
            const w0 = getLatestPeriodWindow(recent, settings);
            const latestStart = w0.start;
            const latestEnd = w0.end;
            const latestPeriodLen = diffDays(latestStart, addDaysStr(latestEnd, 1));

            // 最近周期长度：需要至少2个 start
            const recent2 = getRecentRecords(recordsAsc, 2);
            let latestCycleLen = 0;
            if (recent2.length >= 2) {
                latestCycleLen = diffDays(recent2[0].start, recent2[1].start);
            }

            // 稳定性
            const stab = analyzeStability(recordsAsc);
            const stabilityText = stab.text;
            const confidenceText = recordsAsc.length >= 6 ? '高（记录较多）' : recordsAsc.length >= 4 ? '中（记录一般）' : '低（记录偏少）';

            // 预测
            const pred = predictNext(latestStart, latestCycleLen, settings);
            const nextStart = pred.nextStart;
            const ovulationDay = pred.ovulationDay;
            const fertileRangeText = pred.fertileRangeText;

            // 周期变化卡片
            const cycleChange = buildCycleChangeCard(recordsAsc, settings);

            // 痛经
            const pain = analyzePain(store.painRecords, recordsAsc, latestCycleLen || cycleLength);
            const painSummaryText = pain.summary;
            const painLevelText = pain.levelText;
            const painPeakText = pain.peakText;

            // 爱爱：最近一个周期
            const sexA = analyzeSex(store.sexRecords, latestStart, nextStart, fertileRangeText);
            const sexSummaryText = `最近一个周期记录爱爱 ${sexA.cycleCount} 次`;
            const sexFertileText = fertileRangeText ? `其中排卵期内 ${sexA.fertileCount} 次` : '排卵期：数据不足';
            const sexUnprotectedText = sexA.unprotectedCount > 0 ? `其中“无措施/未填写” ${sexA.unprotectedCount} 次` : '避孕方式记录较完整';

            // 体重：围绕最近一次经期 start..end
            const w = analyzeWeightAroundPeriod(store.weightRecords, latestStart, latestEnd);
            let weightText = '体重记录不足（建议在经期前后多记录几天）';
            if (w.preCount >= 1 && w.inCount >= 1) {
                const sign = w.delta > 0 ? '+' : '';
                weightText = `经期前3天均值 ${w.preAvg}kg；经期中均值 ${w.inAvg}kg；变化 ${sign}${w.delta}kg`;
            }
            this.setData({
                hasData: true,
                latestStart,
                latestEnd,
                latestPeriodLen,
                latestCycleLen,
                stabilityText,
                confidenceText,
                nextStart,
                ovulationDay,
                fertileRangeText,
                cycleChange,
                painSummaryText,
                painLevelText,
                painPeakText,
                sexSummaryText,
                sexFertileText,
                sexUnprotectedText,
                weightText
            });
        }
    }
};
</script>
<style>
@import './analysis.css';
</style>
