<template>
    <view class="page-wrap">
        <scroll-view class="page" :scroll-y="true">
            <!-- 顶部：月份标题 + 回到今天 -->
            <view class="cal-header">
                <view class="nav-btn" @tap="goPrevMonth">‹</view>

                <view class="header-center">
                    <text class="ym-text">{{ year }}年{{ month }}月</text>
                    <view class="today-btn" @tap="goToday">回到今天</view>
                </view>

                <view class="nav-btn" @tap="goNextMonth">›</view>
            </view>

            <!-- 星期栏 -->
            <view class="week-row">
                <view class="week-item" v-for="(item, index) in weekNames" :key="index">{{ item }}</view>
            </view>

            <!-- 日历网格（支持左右滑动翻月） -->
            <view class="grid" @touchstart="onTouchStart" @touchend="onTouchEnd">
                <view :class="'cell ' + item.cls" @tap="onTapDate" :data-date="item.dateStr" v-for="(item, index) in cells" :key="index">
                    <!-- 顶部标记（爱心/排卵日点） -->

                    <view class="top-mark">
                        <text class="heart" v-if="item.hasHeart">♡</text>
                        <view class="ovu-dot" v-if="item.isOvulationDay"></view>
                    </view>

                    <!-- 日期数字 -->

                    <text class="num">{{ item.day }}</text>

                    <!-- ✅ 备注小点（数字下方蓝点） -->

                    <!-- <view class="note-dot" wx:if="{{item.hasNote}}"></view> -->

                    <!-- ✅ 今天小字（缩小 + 底部定位） -->

                    <text class="today-tag" v-if="item.isToday">今天</text>
                </view>
            </view>

            <!-- 图例 -->
            <view class="legend">
                <view class="leg-item">
                    <view class="box b-period"></view>
                    <text>月经期</text>
                </view>
                <view class="leg-item">
                    <view class="box b-pred"></view>
                    <text>预测经期</text>
                </view>
                <view class="leg-item">
                    <view class="box b-ovu"></view>
                    <text>排卵期</text>
                </view>
                <view class="leg-item">
                    <view class="dot"></view>
                    <text>排卵日</text>
                </view>
            </view>

            <!-- ✅ 新增：独立小卡片（不放进上面 panel 里） -->
            <!-- 说明：这里先只做UI，不绑定跳转函数，避免你 period.js 里没写函数导致报错 -->
            <view class="mini-card tappable" @tap="goPeriodAnalysis">
                <view class="mini-left">
                    <image class="mini-icon" src="/static/assets/icons/粉_分析.svg" mode="aspectFit" />
                    <text class="mini-title">经期健康分析</text>
                </view>
                <image class="mini-go" src="/static/assets/icons/粉_跳转.svg" mode="aspectFit" />
            </view>

            <!-- 下方操作区 -->
            <view class="panel">
                <!-- 1）月经来了（开关） -->
                <view class="row">
                    <view class="row-left row-left-with-icon">
                        <image class="row-icon" src="/static/assets/icons/粉_水滴.svg" mode="aspectFit" />
                        <text class="row-title">月经来了</text>
                    </view>

                    <switch :checked="periodSwitchOn" color="#ff4d6d" @change="onTogglePeriod" />
                </view>

                <!-- 2）痛经（加号 / 修改） -->
                <view class="row tappable" @tap="onGoPain">
                    <view class="row-left row-left-with-icon">
                        <image class="row-icon" src="/static/assets/icons/粉_疼.svg" mode="aspectFit" />
                        <text class="row-title">痛经</text>
                    </view>

                    <view class="row-right">
                        <!-- 次数：痛经 -->
                        <text class="row-value" v-if="selectedPainText">{{ selectedPainText }}</text>

                        <!-- 图标：加号 / 修改 -->
                        <image class="plus-icon" :src="'/assets/icons/' + (hasPain ? '粉_修改.svg' : '粉_加号.svg')" mode="aspectFit" />
                    </view>
                </view>

                <!-- 3）体重（加号/修改 + 显示数值） -->
                <view class="row tappable" @tap="onAddWeight">
                    <view class="row-left row-left-with-icon">
                        <image class="row-icon" src="/static/assets/icons/粉_体重.svg" mode="aspectFit" />
                        <text class="row-title">体重</text>
                    </view>

                    <view class="row-right">
                        <text class="row-value" v-if="hasWeight">{{ selectedWeightText }}</text>

                        <image class="plus-icon" v-if="!hasWeight" src="/static/assets/icons/粉_加号.svg" mode="aspectFit" />
                        <image class="plus-icon" v-else src="/static/assets/icons/粉_修改.svg" mode="aspectFit" />
                    </view>
                </view>

                <!-- 4）爱爱（加号） -->
                <view class="row tappable" @tap="onGoLove">
                    <view class="row-left row-left-with-icon">
                        <image class="row-icon" src="/static/assets/icons/粉_双爱心.svg" mode="aspectFit" />
                        <text class="row-title">爱爱</text>
                    </view>

                    <view class="row-right">
                        <!-- 次数 -->
                        <text class="row-value" v-if="selectedSexText">{{ selectedSexText }}</text>

                        <!-- 图标：加号 / 修改 -->
                        <image class="plus-icon" :src="'/assets/icons/' + (hasSex ? '粉_修改.svg' : '粉_加号.svg')" />
                    </view>
                </view>
            </view>

            <!-- 底部留白：只用于让最后一张卡片阴影可见 -->
            <view class="bottom-spacer"></view>
        </scroll-view>

        <!-- =====体重输入：底部弹窗===== -->
        <view v-if="showWeightPopup">
            <!-- 半透明遮罩：点遮罩=取消 -->
            <view class="sheet-mask" @tap="onWeightCancel" @touchmove.stop.prevent="noop"></view>

            <!-- 底部弹窗主体：阻止冒泡 -->
            <view class="sheet" @tap.stop.prevent="noop" @touchmove.stop.prevent="noop">
                <!-- 顶部栏：取消 / 标题 / 确定 -->
                <view class="sheet-header">
                    <text class="sheet-btn" @tap="onWeightCancel">取消</text>
                    <text class="sheet-title">体重</text>
                    <text class="sheet-btn sheet-btn-primary" @tap="onWeightConfirm">确定</text>
                </view>

                <!-- 数值显示 -->
                <view class="sheet-value">
                    <text class="value-num">{{ weightDisplay }}</text>
                    <text class="value-unit">{{ weightUnit === 'kg' ? '公斤' : '斤' }}</text>
                </view>

                <!-- 自定义键盘 -->
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
                        <!-- <view class="key key-del" bindtap="onWeightDel">⌫</view> -->
                        <view class="key key-del" @tap="onWeightDel">
                            <image class="key-del-icon" src="/static/assets/icons/键盘删除.svg" mode="aspectFit" />
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
const STORE_KEY = 'period_record_v1';
// const STORE_KEY = 'sex_record_v1';

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
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function addDays(dateObj, days) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + days);
    return d;
}
// 斤不再需要：保留旧函数不再使用（避免其它地方引用报错）
// function kgToJin(kg){ return kg * 2; }
// function jinToKg(jin){ return jin / 2; }

function loadStore() {
    const v = uni.getStorageSync(STORE_KEY);
    if (v && typeof v === 'object') {
        return v;
    }
    return {
        periodStarts: [],
        periodRecords: [],
        // ✅ 新结构：[{start:'YYYY-MM-DD', end:'YYYY-MM-DD'}] end 始终存在（至少=start）
        sexDates: [],
        sexRecords: {},
        // ✅ 新增：爱爱详细记录：{ 'YYYY-MM-DD': [{ time:'HH:mm', method:'...' }, ...] }
        settings: {
            ...DEFAULTS
        },
        weightRecords: {} // ✅ 体重记录：{ 'YYYY-MM-DD': { kg: number } }
    };
}
function saveStore(store) {
    uni.setStorageSync(STORE_KEY, store);
}

/** ✅ 迁移旧数据：periodStarts -> periodRecords
 * 旧数据无法表达结束日，这里迁移成 “只记录开始当天” (start=end=start)
 * （不会把后5天当成真实记录，只会在界面上作为预测显示）
 */
function migrateIfNeeded(store) {
    store.periodStarts = store.periodStarts || [];
    store.periodRecords = store.periodRecords || [];
    store.weightRecords = store.weightRecords || {};

    // ✅ 新增：爱爱记录结构兜底（兼容旧数据没有 sexRecords 的情况）
    store.sexDates = store.sexDates || [];
    store.sexRecords = store.sexRecords || {};
    if (store.periodRecords.length === 0 && store.periodStarts.length > 0) {
        const starts = store.periodStarts.slice().sort((a, b) => parseDateStr(a) - parseDateStr(b));
        store.periodRecords = starts.map((s) => ({
            start: s,
            end: s
        }));
    }

    // 防御 & 规范化
    store.periodRecords = (store.periodRecords || [])
        .filter((r) => r && r.start)
        .map((r) => ({
            start: r.start,
            end: r.end ? r.end : r.start
        }));
}

/** ✅ 判断某天是否落在“真实经期记录”内（深色 period） */
function findActualRecordCoveringDate(store, dateStr) {
    const d = parseDateStr(dateStr);
    const records = store.periodRecords || [];
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const s = parseDateStr(r.start);
        const e = parseDateStr(r.end);
        if (d >= s && d <= e) {
            return {
                record: r,
                index: i
            };
        }
    }
    return null;
}

/** ✅ 找到“同一次经期的预测尾巴”所对应的记录
 * 预测尾巴：start+1 ~ start+periodLength-1 （不含已真实记录的部分）
 * 用于：用户点“月经来了”去确认/延长那一天（仅默认长度范围内）
 */
function findPredTailOwner(store, dateStr, periodLength) {
    const d = parseDateStr(dateStr);
    const records = store.periodRecords || [];
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const s = parseDateStr(r.start);
        const defaultEnd = addDays(s, periodLength - 1);

        // 在默认区间内，但又不在真实记录内（即 d > r.end），才算“预测尾巴”
        const actualEnd = parseDateStr(r.end);
        if (d > actualEnd && d >= s && d <= defaultEnd) {
            return {
                record: r,
                index: i
            };
        }
    }
    return null;
}

/** ✅ 新增：找到“可连续延长”的记录（date == end + 1）
 * 解决：经期超过默认长度后，继续延长时误新建记录 -> 产生新尾巴预测
 */
function findAdjacentEndOwner(store, dateStr) {
    const records = store.periodRecords || [];
    let best = null;
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const nextDay = toDateStr(addDays(parseDateStr(r.end), 1));
        if (nextDay === dateStr) {
            // 若有多条符合（极少），取 end 最晚的那条
            if (!best || parseDateStr(r.end) > parseDateStr(best.record.end)) {
                best = {
                    record: r,
                    index: i
                };
            }
        }
    }
    return best;
}

/** ✅ 获得“用于预测未来周期”的最后一次 start（取最新 start） */
function getLatestStart(store) {
    const records = (store.periodRecords || []).slice();
    if (records.length === 0) {
        return null;
    }
    records.sort((a, b) => parseDateStr(a.start) - parseDateStr(b.start));
    return records[records.length - 1].start;
}
export default {
    data() {
        return {
            weekNames: ['日', '一', '二', '三', '四', '五', '六'],
            year: 0,
            month: 0,
            cells: [],
            selectedDate: '',
            periodSwitchOn: false,
            touchStartX: 0,
            touchStartY: 0,
            showWeightPopup: false,
            // 不再需要斤：固定为 kg（保留字段避免你 wxml 里引用报错）
            weightUnit: 'kg',
            weightInput: '',
            weightDisplay: '0',
            hasWeight: false,
            selectedWeightText: '',
            // 爱爱记录
            hasSex: false,
            selectedSexText: '',
            // 痛经记录
            hasPain: false,
            selectedPainText: ''
        };
    },
    onLoad() {
        const now = new Date();
        this.setData({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            selectedDate: toDateStr(now)
        });
        this.refreshAll();
    },
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setSelected(2);
        }
        this.refreshAll();
    },
    methods: {
        noop() {},

        refreshAll() {
            const store = loadStore();
            migrateIfNeeded(store);
            const selectedDate = this.selectedDate;
            const hasAnyRecord = store.periodRecords && store.periodRecords.length > 0;
            const maps = hasAnyRecord
                ? this.computeMaps(store)
                : {
                      periodDays: new Set(),
                      predPeriodDays: new Set(),
                      ovulationDays: new Set(),
                      ovulationDay: new Set()
                  };
            const periodSwitchOn = maps.periodDays.has(selectedDate); // ✅ 只看“真实记录”（深色）

            const cells = this.buildCalendarCells(store, maps);

            // ✅ 选中日体重显示（用于“体重”这一行）
            const rec = store.weightRecords && store.weightRecords[selectedDate];
            const hasWeight = !!(rec && typeof rec.kg === 'number' && rec.kg > 0);
            const selectedWeightText = hasWeight ? rec.kg.toFixed(2) + '公斤' : '';

            // ✅ 选中日爱爱显示（用于“爱爱”这一行）
            // 规则：优先 sexRecords（当天可多次）；兼容旧 sexDates（有则按 1 次）
            const sexList = store.sexRecords && store.sexRecords[selectedDate] ? store.sexRecords[selectedDate] : [];
            const sexCount = sexList.length || ((store.sexDates || []).includes(selectedDate) ? 1 : 0);
            const hasSex = sexCount > 0;
            const selectedSexText = hasSex ? `${sexCount}次` : '';

            // ✅ 选中日痛经显示
            store.painRecords = store.painRecords || {};
            const painList = store.painRecords[selectedDate] || [];
            const painCount = painList.length;
            const hasPain = painCount > 0;
            const selectedPainText = hasPain ? `${painCount}次` : '';
            this.setData({
                cells,
                periodSwitchOn,
                hasWeight,
                selectedWeightText,
                hasSex,
                selectedSexText,
                hasPain,
                selectedPainText
            });
            saveStore(store);
        },

        buildCalendarCells(store, mapsFromRefresh) {
            const { year, month, selectedDate } = this;
            const maps = mapsFromRefresh || {
                periodDays: new Set(),
                predPeriodDays: new Set(),
                ovulationDays: new Set(),
                ovulationDay: new Set()
            };

            // ✅ 爱爱：兼容旧 sexDates + 新 sexRecords
            const sexDatesSet = new Set(store.sexDates || []);
            const sexRecords = store.sexRecords || {};
            function hasSexOnDay(ds) {
                const list = sexRecords[ds];
                return (Array.isArray(list) && list.length > 0) || sexDatesSet.has(ds);
            }
            const firstDay = new Date(year, month - 1, 1);
            const startWeekday = firstDay.getDay();
            const startDate = addDays(firstDay, -startWeekday);
            const todayStr = toDateStr(new Date());
            const cells = [];
            for (let i = 0; i < 42; i++) {
                const d = addDays(startDate, i);
                const dStr = toDateStr(d);
                const inThisMonth = d.getMonth() === month - 1;
                let cls = '';
                if (!inThisMonth) {
                    cls += ' other';
                }

                // ✅ 优先级：真实经期 > 预测经期 > 排卵期
                if (maps.periodDays.has(dStr)) cls += ' period';
                else if (maps.predPeriodDays.has(dStr)) cls += ' pred';
                else if (maps.ovulationDays.has(dStr)) {
                    cls += ' ovulation';
                }
                if (dStr === selectedDate) {
                    cls += ' selected';
                }
                if (dStr === todayStr) {
                    cls += ' today';
                }
                cells.push({
                    dateStr: dStr,
                    day: d.getDate(),
                    cls: cls.trim(),
                    isToday: dStr === todayStr,
                    hasHeart: hasSexOnDay(dStr),
                    // ✅ 改为：sexRecords 或 sexDates 任一存在就显示心
                    isOvulationDay: maps.ovulationDay.has(dStr)
                });
            }
            return cells;
        },

        computeMaps(store) {
            const settings = store.settings || DEFAULTS;
            const cycleLength = settings.cycleLength || DEFAULTS.cycleLength;
            const periodLength = settings.periodLength || DEFAULTS.periodLength;
            const lutealDays = settings.lutealDays || DEFAULTS.lutealDays;
            migrateIfNeeded(store);
            const periodDays = new Set(); // ✅ 真实记录（深色）
            const predPeriodDays = new Set(); // ✅ 预测（浅色）
            const ovulationDays = new Set();
            const ovulationDay = new Set();
            const records = (store.periodRecords || []).slice().sort((a, b) => parseDateStr(a.start) - parseDateStr(b.start));

            // 1) 真实经期：start..end（深色）
            records.forEach((r) => {
                const s = parseDateStr(r.start);
                const e = parseDateStr(r.end);
                if (e < s) {
                    return;
                }
                const days = Math.floor((e - s) / 86400000);
                for (let i = 0; i <= days; i++) {
                    periodDays.add(toDateStr(addDays(s, i)));
                }

                // ✅ 2) 同一次经期的“默认预测尾巴”
                // 规则：只要真实 end 还没到默认结束日(defaultEnd)，就把剩余天数显示为浅粉预测
                //      若 end >= defaultEnd（确认够了/或已超出默认长度），尾巴不显示
                const defaultEnd = addDays(s, periodLength - 1);
                const actualEnd = e;
                if (actualEnd < defaultEnd) {
                    const startPred = addDays(actualEnd, 1);
                    const predDays = Math.floor((defaultEnd - startPred) / 86400000);
                    for (let j = 0; j <= predDays; j++) {
                        const ds = toDateStr(addDays(startPred, j));
                        if (!periodDays.has(ds)) {
                            predPeriodDays.add(ds);
                        }
                    }
                }
            });

            // 3) 未来周期预测：以“最新一次 start”为基准（浅色 pred）
            const lastStartStr = getLatestStart(store);
            if (lastStartStr) {
                const lastStart = parseDateStr(lastStartStr);
                for (let k = 1; k <= 12; k++) {
                    const predStart = addDays(lastStart, cycleLength * k);
                    for (let i = 0; i < periodLength; i++) {
                        const ds = toDateStr(addDays(predStart, i));
                        if (!periodDays.has(ds)) {
                            predPeriodDays.add(ds);
                        }
                    }
                    const ovu = addDays(predStart, -lutealDays);
                    ovulationDay.add(toDateStr(ovu));
                    for (let i = -5; i <= 1; i++) {
                        ovulationDays.add(toDateStr(addDays(ovu, i)));
                    }
                }
            }
            return {
                periodDays,
                predPeriodDays,
                ovulationDays,
                ovulationDay
            };
        },

        onTapDate(e) {
            const dateStr = e.currentTarget.dataset.date;
            const store = loadStore();
            migrateIfNeeded(store);
            const hasAnyRecord = store.periodRecords && store.periodRecords.length > 0;
            const maps = hasAnyRecord
                ? this.computeMaps(store)
                : {
                      periodDays: new Set(),
                      predPeriodDays: new Set(),
                      ovulationDays: new Set(),
                      ovulationDay: new Set()
                  };
            const periodSwitchOn = maps.periodDays.has(dateStr); // ✅ 只看真实记录

            this.setData({
                selectedDate: dateStr,
                periodSwitchOn
            });
            const rec = store.weightRecords && store.weightRecords[dateStr];
            const hasWeight = !!(rec && typeof rec.kg === 'number' && rec.kg > 0);
            const selectedWeightText = hasWeight ? rec.kg.toFixed(2) + '公斤' : '';

            // ✅ 选中日爱爱显示（同 refreshAll 规则）
            const sexList = store.sexRecords && store.sexRecords[dateStr] ? store.sexRecords[dateStr] : [];
            const sexCount = sexList.length || ((store.sexDates || []).includes(dateStr) ? 1 : 0);
            const hasSex = sexCount > 0;
            const selectedSexText = hasSex ? `${sexCount}次` : '';

            // ——痛经（修复版）——
            store.painRecords = store.painRecords || {};
            const painList = store.painRecords[dateStr] || [];
            const painCount = painList.length;
            const hasPain = painCount > 0;
            const selectedPainText = hasPain ? `${painCount}次` : '';
            this.setData({
                hasWeight,
                selectedWeightText,
                hasSex,
                selectedSexText,
                hasPain,
                // ✅ 加上selectedPainText
                selectedPainText // ✅ 关键：补上这一句
            });
            const cells = this.buildCalendarCells(store, maps);
            this.setData({
                cells
            });
            saveStore(store);
        },

        onTogglePeriod(e) {
            const on = e.detail.value;
            const dateStr = this.selectedDate;
            const store = loadStore();
            migrateIfNeeded(store);
            const settings = store.settings || DEFAULTS;
            const periodLength = settings.periodLength || DEFAULTS.periodLength;
            if (on) {
                // 1) 已真实记录
                const hit = findActualRecordCoveringDate(store, dateStr);
                if (hit) {
                    uni.showToast({
                        title: '该日已记录为经期',
                        icon: 'none'
                    });
                    saveStore(store);
                    this.refreshAll();
                    return;
                }

                // ✅ 2) 先判断“是否为某次经期的下一天”：连续延长（解决超过默认长度时误新建）
                const adj = findAdjacentEndOwner(store, dateStr);
                if (adj) {
                    adj.record.end = dateStr;
                    uni.showToast({
                        title: '已延长本次经期',
                        icon: 'none'
                    });

                    // 兼容维护：确保 periodStarts 有该 start
                    store.periodStarts = store.periodStarts || [];
                    if (!store.periodStarts.includes(adj.record.start)) {
                        store.periodStarts.push(adj.record.start);
                    }
                    saveStore(store);
                    this.refreshAll();
                    return;
                }

                // 3) 在同一次经期的预测尾巴里：延长 end（确认）（仅默认长度范围内）
                const tailOwner = findPredTailOwner(store, dateStr, periodLength);
                if (tailOwner) {
                    tailOwner.record.end = dateStr;
                    uni.showToast({
                        title: '已确认：今天也来了',
                        icon: 'none'
                    });
                    store.periodStarts = store.periodStarts || [];
                    if (!store.periodStarts.includes(tailOwner.record.start)) {
                        store.periodStarts.push(tailOwner.record.start);
                    }
                    saveStore(store);
                    this.refreshAll();
                    return;
                }

                // 4) 新建：只记录当天（后面几天是预测浅色）
                store.periodRecords.push({
                    start: dateStr,
                    end: dateStr
                });
                store.periodStarts = store.periodStarts || [];
                if (!store.periodStarts.includes(dateStr)) {
                    store.periodStarts.push(dateStr);
                }
                uni.showToast({
                    title: '已记录：月经开始（仅当天）',
                    icon: 'none'
                });
                saveStore(store);
                this.refreshAll();
                return;
            }

            // off：只对“真实记录”生效
            const hit = findActualRecordCoveringDate(store, dateStr);
            if (!hit) {
                uni.showToast({
                    title: '该日未被真实记录为经期',
                    icon: 'none'
                });
                saveStore(store);
                this.refreshAll();
                return;
            }
            const r = hit.record;

            // 在 start 当天关掉：撤销整次记录（仅一天）
            if (r.start === dateStr && r.end === r.start) {
                store.periodRecords.splice(hit.index, 1);
                store.periodStarts = (store.periodStarts || []).filter((s) => s !== dateStr);
                uni.showToast({
                    title: '已撤销本次经期记录',
                    icon: 'none'
                });
                saveStore(store);
                this.refreshAll();
                return;
            }

            // 如果在开始日点“关”且后面还有记录：仅剔除第一天 => start 往后挪一天
            if (dateStr === r.start) {
                const nextStart = toDateStr(addDays(parseDateStr(r.start), 1));
                if (parseDateStr(nextStart) > parseDateStr(r.end)) {
                    store.periodRecords.splice(hit.index, 1);
                    store.periodStarts = (store.periodStarts || []).filter((s) => s !== dateStr);
                    uni.showToast({
                        title: '已撤销本次经期记录',
                        icon: 'none'
                    });
                    saveStore(store);
                    this.refreshAll();
                    return;
                }
                r.start = nextStart;
                store.periodStarts = (store.periodStarts || []).filter((s) => s !== dateStr);
                if (!store.periodStarts.includes(nextStart)) {
                    store.periodStarts.push(nextStart);
                }
                uni.showToast({
                    title: '已剔除第一天',
                    icon: 'none'
                });
                saveStore(store);
                this.refreshAll();
                return;
            }

            // 在中间某天关掉：表示“今天不来了” => end=昨天
            const newEnd = toDateStr(addDays(parseDateStr(dateStr), -1));
            if (parseDateStr(newEnd) < parseDateStr(r.start)) {
                uni.showToast({
                    title: '日期异常',
                    icon: 'none'
                });
                saveStore(store);
                this.refreshAll();
                return;
            }
            r.end = newEnd;
            uni.showToast({
                title: '已记录：本次经期提前结束',
                icon: 'none'
            });
            saveStore(store);
            this.refreshAll();
        },

        onToggleSex() {
            const dateStr = this.selectedDate;
            const store = loadStore();
            migrateIfNeeded(store);
            store.sexDates = store.sexDates || [];
            const idx = store.sexDates.indexOf(dateStr);
            if (idx >= 0) {
                store.sexDates.splice(idx, 1);
                uni.showToast({
                    title: '已取消爱爱记录',
                    icon: 'none'
                });
            } else {
                store.sexDates.push(dateStr);
                uni.showToast({
                    title: '已记录爱爱 ♡',
                    icon: 'none'
                });
            }
            saveStore(store);
            this.refreshAll();
        },

        goToday() {
            const now = new Date();
            this.setData({
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                selectedDate: toDateStr(now)
            });
            this.refreshAll();
        },

        goPrevMonth() {
            let { year, month } = this;
            month -= 1;
            if (month <= 0) {
                month = 12;
                year -= 1;
            }
            this.setData({
                year,
                month
            });
            this.refreshAll();
        },

        goNextMonth() {
            let { year, month } = this;
            month += 1;
            if (month >= 13) {
                month = 1;
                year += 1;
            }
            this.setData({
                year,
                month
            });
            this.refreshAll();
        },

        onTouchStart(e) {
            if (!e.touches || !e.touches.length) {
                return;
            }
            this.setData({
                touchStartX: e.touches[0].clientX,
                touchStartY: e.touches[0].clientY
            });
        },

        onTouchEnd(e) {
            if (!e.changedTouches || !e.changedTouches.length) {
                return;
            }
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const dx = endX - this.touchStartX;
            const dy = endY - this.touchStartY;
            if (Math.abs(dx) < 60) {
                return;
            }
            if (Math.abs(dx) < Math.abs(dy) * 1.2) {
                return;
            }
            if (dx < 0) {
                this.goNextMonth();
            } else {
                this.goPrevMonth();
            }
        },

        goPeriodAnalysis() {
            uni.navigateTo({
                url: '/pages/subperiod/analysis/analysis'
            });
        },

        // 痛经记录页面
        onGoPain() {
            const date = this.selectedDate;
            uni.navigateTo({
                url: `/pages/subperiod/pain/pain?date=${date}`
            });
        },

        // 新增：体重（弹窗）
        onAddWeight() {
            if (typeof this.getTabBar === 'function' && this.getTabBar()) {
                this.getTabBar().setHidden(true);
            }

            // 打开弹窗时：优先回显当天已存的体重（如果有）
            const store = loadStore();
            migrateIfNeeded(store);
            const dateStr = this.selectedDate;
            const rec = store.weightRecords && store.weightRecords[dateStr];
            const kg = rec && typeof rec.kg === 'number' ? rec.kg : 0;

            // ✅ 固定 kg 展示，保留 2 位小数（不再四舍五入到 1 位）
            let showVal = '';
            if (kg > 0) {
                showVal = kg.toFixed(2);
                // 如果你不想显示末尾 0，可以改成：showVal = String(Number(kg.toFixed(2)));
            }
            this.setData({
                showWeightPopup: true,
                weightInput: showVal,
                weightDisplay: showVal || '0'
            });
        },

        // 点击遮罩 / 取消
        onWeightCancel() {
            this.setData({
                showWeightPopup: false
            });
            if (typeof this.getTabBar === 'function' && this.getTabBar()) {
                this.getTabBar().setHidden(false);
            }
        },

        // 键盘输入（0-9 和 .）
        onWeightKey(e) {
            const k = e.currentTarget.dataset.k;
            let s = this.weightInput || '';

            // 只允许一个小数点
            if (k === '.') {
                if (s.includes('.')) {
                    return;
                }
                if (s === '') {
                    s = '0';
                }
                s = s + '.';
            } else {
                // 数字
                if (s === '0') {
                    // 0 开头，输入数字则替换（但 0. 不替换）
                    s = k;
                } else {
                    s = s + k;
                }
            }

            // 限制：最多 3 位整数 + 2 位小数
            const m = s.match(/^(\d{0,3})(?:\.(\d{0,2}))?/);
            if (m) {
                const intPart = m[1] || '';
                const dot = s.includes('.') ? '.' : '';
                const decPart = (s.split('.')[1] || '').slice(0, 2);
                s = intPart + (dot ? dot + decPart : '');
            }
            this.setData({
                weightInput: s,
                weightDisplay: s === '' ? '0' : s
            });
        },

        // 删除（退格）
        onWeightDel() {
            let s = this.weightInput || '';
            if (!s) {
                this.setData({
                    weightDisplay: '0'
                });
                return;
            }
            s = s.slice(0, -1);
            this.setData({
                weightInput: s,
                weightDisplay: s === '' ? '0' : s
            });
        },

        // ✅ 确定：保存到本地（固定用 kg 存）
        // ✅ 约定：输入 0 表示删除当天体重记录
        onWeightConfirm() {
            let s = (this.weightInput || '').trim();
            if (s === '') {
                s = (this.weightDisplay || '').trim();
            }
            if (s === '') {
                s = '0';
            }
            const num = parseFloat(s);

            // 1) 非数字：提示
            if (isNaN(num)) {
                uni.showToast({
                    title: '请输入有效体重',
                    icon: 'none'
                });
                return;
            }
            const store = loadStore();
            migrateIfNeeded(store);
            const dateStr = this.selectedDate;
            store.weightRecords = store.weightRecords || {};

            // 2) 输入 0：删除当天体重记录
            if (num === 0) {
                if (store.weightRecords[dateStr]) {
                    delete store.weightRecords[dateStr];
                    saveStore(store);
                    uni.showToast({
                        title: '已删除体重记录',
                        icon: 'none'
                    });
                } else {
                    uni.showToast({
                        title: '当天未记录体重',
                        icon: 'none'
                    });
                }
                this.setData({
                    showWeightPopup: false
                });
                if (typeof this.getTabBar === 'function' && this.getTabBar()) {
                    this.getTabBar().setHidden(false);
                }
                this.refreshAll();
                return;
            }

            // 3) 负数：无效
            if (num < 0) {
                uni.showToast({
                    title: '请输入有效体重',
                    icon: 'none'
                });
                return;
            }

            // 4) 正数：正常保存（✅ 保留 2 位小数，不再变成 1 位）
            const kg = num;
            store.weightRecords[dateStr] = {
                kg: Number(kg.toFixed(2))
            };
            saveStore(store);
            this.setData({
                showWeightPopup: false
            });
            if (typeof this.getTabBar === 'function' && this.getTabBar()) {
                this.getTabBar().setHidden(false);
            }
            uni.showToast({
                title: '已记录体重',
                icon: 'none'
            });
            this.refreshAll();
        },

        // ✅ 爱爱：跳转到 love 页（你的实际路径）
        onGoLove() {
            const date = this.selectedDate;
            uni.navigateTo({
                url: `/pages/subperiod/love/love?date=${date}`
            });
        }
    }
};
</script>
<style>
@import './period.css';
</style>
