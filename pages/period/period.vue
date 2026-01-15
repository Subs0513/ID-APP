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

            <!-- 日历网格（支持左右滑动翻月 + 翻页动画） -->
            <view class="cal-swipe" @touchstart="onTouchStart" @touchend="onTouchEnd">
                <view class="cal-track" :class="{ 'is-anim': isMonthAnimating , 'no-anim': calNoAnim}" :style="calTrackStyle" @transitionend="onMonthAnimEnd">
                    <!-- 第一屏：next 时=当前月；prev 时=上一月 -->
                    <view class="cal-pane">
                        <view class="grid">
                            <view
                                :class="'cell ' + item.cls"
                                @tap="onTapDate"
                                :data-date="item.dateStr"
                                v-for="(item, index) in (monthAnimDir === 'prev' ? nextCells : cells)"
                                :key="index"
                            >
                                <view class="top-mark">
                                    <text class="heart" v-if="item.hasHeart">♡</text>
                                    <view class="ovu-dot" v-if="item.isOvulationDay"></view>
                                </view>
                                <text class="num">{{ item.day }}</text>
                                <text class="today-tag" v-if="item.isToday">今天</text>
                            </view>
                        </view>
                    </view>

                    <!-- 第二屏：next 时=下一月；prev 时=当前月 -->
                    <view class="cal-pane">
                        <view class="grid">
                            <view
                                :class="'cell ' + item.cls"
                                @tap="onTapDate"
                                :data-date="item.dateStr"
                                v-for="(item, index) in (monthAnimDir === 'prev' ? cells : nextCells)"
                                :key="'n' + index"
                            >
                                <view class="top-mark">
                                    <text class="heart" v-if="item.hasHeart">♡</text>
                                    <view class="ovu-dot" v-if="item.isOvulationDay"></view>
                                </view>
                                <text class="num">{{ item.day }}</text>
                                <text class="today-tag" v-if="item.isToday">今天</text>
                            </view>
                        </view>
                    </view>
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
            <view class="mini-card tappable" @tap="goPeriodAnalysis">
                <view class="mini-left">
                    <image class="mini-icon" src="/static/assets/icons/f_fx.svg" mode="aspectFit" />
                    <text class="mini-title">经期健康分析</text>
                </view>
                <image class="mini-go" src="/static/assets/icons/f_tz.svg" mode="aspectFit" />
            </view>

            <!-- 下方操作区 -->
            <view class="panel">
                <!-- 1）月经来了（开关） -->
                <view class="row">
                    <view class="row-left row-left-with-icon">
                        <image class="row-icon" src="/static/assets/icons/f_sd.svg" mode="aspectFit" />
                        <text class="row-title">月经来了</text>
                    </view>

                    <switch :checked="periodSwitchOn" color="#ff4d6d" @change="onTogglePeriod" />
                </view>

                <!-- 2）痛经（加号 / 修改） -->
                <view class="row tappable" @tap="onGoPain">
                    <view class="row-left row-left-with-icon">
                        <image class="row-icon" src="/static/assets/icons/f_t.svg" mode="aspectFit" />
                        <text class="row-title">痛经</text>
                    </view>

                    <view class="row-right">
                        <text class="row-value" v-if="selectedPainText">{{ selectedPainText }}</text>
                        <image class="plus-icon" :src="'/static/assets/icons/' + (hasPain ? 'f_xg.svg' : 'f_jh.svg')" mode="aspectFit" />
                    </view>
                </view>

                <!-- 3）体重（加号/修改 + 显示数值） -->
                <view class="row tappable" @tap="onAddWeight">
                    <view class="row-left row-left-with-icon">
                        <image class="row-icon" src="/static/assets/icons/f_tzc.svg" mode="aspectFit" />
                        <text class="row-title">体重</text>
                    </view>

                    <view class="row-right">
                        <text class="row-value" v-if="hasWeight">{{ selectedWeightText }}</text>
                        <image class="plus-icon" v-if="!hasWeight" src="/static/assets/icons/f_jh.svg" mode="aspectFit" />
                        <image class="plus-icon" v-else src="/static/assets/icons/f_xg.svg" mode="aspectFit" />
                    </view>
                </view>

                <!-- 4）爱爱（加号） -->
                <view class="row tappable" @tap="onGoLove">
                    <view class="row-left row-left-with-icon">
                        <image class="row-icon" src="/static/assets/icons/f_sax.svg" mode="aspectFit" />
                        <text class="row-title">爱爱</text>
                    </view>

                    <view class="row-right">
                        <text class="row-value" v-if="selectedSexText">{{ selectedSexText }}</text>
                        <image class="plus-icon" :src="'/static/assets/icons/' + (hasSex ? 'f_xg.svg' : 'f_jh.svg')" />
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
                    <text class="value-unit">{{ weightUnit === 'kg' ? '公斤' : '斤' }}</text>
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
                            <image class="key-del-icon" src="/static/assets/icons/jpsc.svg" mode="aspectFit" />
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
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
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function addDays(dateObj, days) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + days);
    return d;
}

function loadStore() {
    const v = uni.getStorageSync(STORE_KEY);
    if (v && typeof v === 'object') {
        return v;
    }
    return {
        periodStarts: [],
        periodRecords: [],
        sexDates: [],
        sexRecords: {},
        // ✅ 新增：爱爱详细记录：{ 'YYYY-MM-DD': [{ time:'HH:mm', method:'...' }, ...] }
        settings: {
            ...DEFAULTS
        },
        weightRecords: {}
    };
}
function saveStore(store) {
    uni.setStorageSync(STORE_KEY, store);
}

function migrateIfNeeded(store) {
    store.periodStarts = store.periodStarts || [];
    store.periodRecords = store.periodRecords || [];
    store.weightRecords = store.weightRecords || {};

    store.sexDates = store.sexDates || [];
    store.sexRecords = store.sexRecords || {};
    if (store.periodRecords.length === 0 && store.periodStarts.length > 0) {
        const starts = store.periodStarts.slice().sort((a, b) => parseDateStr(a) - parseDateStr(b));
        store.periodRecords = starts.map((s) => ({
            start: s,
            end: s
        }));
    }

    store.periodRecords = (store.periodRecords || [])
        .filter((r) => r && r.start)
        .map((r) => ({
            start: r.start,
            end: r.end ? r.end : r.start
        }));
}

function findActualRecordCoveringDate(store, dateStr) {
    const d = parseDateStr(dateStr);
    const records = store.periodRecords || [];
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const s = parseDateStr(r.start);
        const e = parseDateStr(r.end);
        if (d >= s && d <= e) {
            return { record: r, index: i };
        }
    }
    return null;
}

function findPredTailOwner(store, dateStr, periodLength) {
    const d = parseDateStr(dateStr);
    const records = store.periodRecords || [];
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const s = parseDateStr(r.start);
        const defaultEnd = addDays(s, periodLength - 1);

        const actualEnd = parseDateStr(r.end);
        if (d > actualEnd && d >= s && d <= defaultEnd) {
            return { record: r, index: i };
        }
    }
    return null;
}

function findAdjacentEndOwner(store, dateStr) {
    const records = store.periodRecords || [];
    let best = null;
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const nextDay = toDateStr(addDays(parseDateStr(r.end), 1));
        if (nextDay === dateStr) {
            if (!best || parseDateStr(r.end) > parseDateStr(best.record.end)) {
                best = { record: r, index: i };
            }
        }
    }
    return best;
}

function getLatestStart(store) {
    const records = (store.periodRecords || []).slice();
    if (records.length === 0) return null;
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
            weightUnit: 'kg',
            weightInput: '',
            weightDisplay: '0',
            hasWeight: false,
            selectedWeightText: '',
            hasSex: false,
            selectedSexText: '',
            hasPain: false,
            selectedPainText: '',
            // ===== 月份翻页动画 =====
            isMonthAnimating: false,
            monthAnimDir: 'next', // 'next' | 'prev'
            calOffsetPct: 0, // 0 或 -50（单位：% 相对 cal-track 宽度）
            nextCells: [],
            nextYear: 0,
            nextMonth: 0,
            animTimer: null, // ✅ 兜底定时器：防止 transitionend 丢失导致卡死
            pendingTarget: null ,// ✅ 连续翻页合并：动画中记录最后一次目标
			calNoAnim: false,//修复翻页问题
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
        this.refreshAll();
    },

    onUnload() {
        // ✅ 防止页面卸载时遗留定时器
        if (this.animTimer) {
            clearTimeout(this.animTimer);
            this.animTimer = null;
        }
    },

    computed: {
        // cal-track 宽度为 200%，所以要移动一个屏幕宽度= -50%
        calTrackStyle() {
            const transition = this.isMonthAnimating ? 'transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1)' : 'none';
            return {
                transform: `translateX(${this.calOffsetPct}%)`,
                transition
            };
        }
    },

    methods: {
        noop() {},

        // 生成指定年月的 cells（不改变 this.year / this.month）
        buildCalendarCellsFor(year, month) {
            const store = loadStore();
            migrateIfNeeded(store);
            const hasAnyRecord = store.periodRecords && store.periodRecords.length > 0;
            const maps = hasAnyRecord
                ? this.computeMaps(store)
                : { periodDays: new Set(), predPeriodDays: new Set(), ovulationDays: new Set(), ovulationDay: new Set() };
            return this.buildCalendarCells(store, maps, year, month);
        },

        // 开始翻月动画（direction: 'next' | 'prev'）
        startMonthAnim(direction, targetYear, targetMonth) {
            // ✅ 如果动画进行中：不要直接 return，记录“最后一次”翻页目标，避免连续翻页卡死
            if (this.isMonthAnimating) {
                this.setData({
                    pendingTarget: { direction, targetYear, targetMonth }
                });
                return;
            }

            const nextCells = this.buildCalendarCellsFor(targetYear, targetMonth);

            this.setData({
                isMonthAnimating: true,
                monthAnimDir: direction,
                nextYear: targetYear,
                nextMonth: targetMonth,
                nextCells,
                pendingTarget: null
            });

            // ✅ 兜底：部分机型/极端连点会导致 transitionend 不触发，从而“卡死”
            if (this.animTimer) clearTimeout(this.animTimer);
            this.animTimer = setTimeout(() => {
                // forced=true：强制结束动画并落地月份
                this.onMonthAnimEnd(true);
            }, 320);

            // cal-track 宽度 200%，移动一个“屏幕宽度”= -50%
            if (direction === 'next') {
                this.setData({ calOffsetPct: 0 });
                this.$nextTick(() => {
                    this.setData({ calOffsetPct: -50 });
                });
            } else {
				// ✅ 先无动画“定位”到 -50（第二屏）
				this.setData({ calNoAnim: true, calOffsetPct: -50 });
				
				this.$nextTick(() => {
				  // 下一帧恢复 transition，再开始真正动画（-50 -> 0）
				  setTimeout(() => {
				    this.setData({ calNoAnim: false });
				    this.setData({ calOffsetPct: 0 });
				  }, 16);
				});
				
            }
        },

        // 动画结束：落地到目标月份，并刷新
        onMonthAnimEnd(arg) {
            // arg 可能是：true(兜底强制结束) / transitionend 事件对象
            const forced = arg === true;

            if (!this.isMonthAnimating) return;

            // ✅ 避免 transitionend 多次触发 / 或兜底定时器重复触发
            if (this.animTimer) {
                clearTimeout(this.animTimer);
                this.animTimer = null;
            }

            const targetY = this.nextYear;
            const targetM = this.nextMonth;

            this.setData({
                year: targetY,
                month: targetM,
                isMonthAnimating: false,
                calOffsetPct: 0,
				
				monthAnimDir: 'next',
				nextCells: []
            });

            this.refreshAll();

            // ✅ 如果用户在动画期间又点了翻页：自动接着翻到“最后一次目标”
            const pending = this.pendingTarget;
            if (pending && pending.targetYear && pending.targetMonth) {
                this.setData({ pendingTarget: null });
                this.$nextTick(() => {
                    this.startMonthAnim(pending.direction, pending.targetYear, pending.targetMonth);
                });
            }
        },

        refreshAll() {
            const store = loadStore();
            migrateIfNeeded(store);
            const selectedDate = this.selectedDate;

            const hasAnyRecord = store.periodRecords && store.periodRecords.length > 0;
            const maps = hasAnyRecord
                ? this.computeMaps(store)
                : { periodDays: new Set(), predPeriodDays: new Set(), ovulationDays: new Set(), ovulationDay: new Set() };

            const periodSwitchOn = maps.periodDays.has(selectedDate);
            const cells = this.buildCalendarCells(store, maps);

            const rec = store.weightRecords && store.weightRecords[selectedDate];
            const hasWeight = !!(rec && typeof rec.kg === 'number' && rec.kg > 0);
            const selectedWeightText = hasWeight ? rec.kg.toFixed(2) + '公斤' : '';

            const sexList = store.sexRecords && store.sexRecords[selectedDate] ? store.sexRecords[selectedDate] : [];
            const sexCount = sexList.length || ((store.sexDates || []).includes(selectedDate) ? 1 : 0);
            const hasSex = sexCount > 0;
            const selectedSexText = hasSex ? `${sexCount}次` : '';

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

        // ✅ 增加 forceYear/forceMonth：支持动画预渲染目标月份
        buildCalendarCells(store, mapsFromRefresh, forceYear, forceMonth) {
            const year = forceYear || this.year;
            const month = forceMonth || this.month;
            const selectedDate = this.selectedDate;

            const maps = mapsFromRefresh || { periodDays: new Set(), predPeriodDays: new Set(), ovulationDays: new Set(), ovulationDay: new Set() };

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
                if (!inThisMonth) cls += ' other';

                if (maps.periodDays.has(dStr)) cls += ' period';
                else if (maps.predPeriodDays.has(dStr)) cls += ' pred';
                else if (maps.ovulationDays.has(dStr)) cls += ' ovulation';

                if (dStr === selectedDate) cls += ' selected';
                if (dStr === todayStr) cls += ' today';

                cells.push({
                    dateStr: dStr,
                    day: d.getDate(),
                    cls: cls.trim(),
                    isToday: dStr === todayStr,
                    hasHeart: hasSexOnDay(dStr),
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

            const periodDays = new Set();
            const predPeriodDays = new Set();
            const ovulationDays = new Set();
            const ovulationDay = new Set();

            const records = (store.periodRecords || []).slice().sort((a, b) => parseDateStr(a.start) - parseDateStr(b.start));

            records.forEach((r) => {
                const s = parseDateStr(r.start);
                const e = parseDateStr(r.end);
                if (e < s) return;

                const days = Math.floor((e - s) / 86400000);
                for (let i = 0; i <= days; i++) {
                    periodDays.add(toDateStr(addDays(s, i)));
                }

                const defaultEnd = addDays(s, periodLength - 1);
                const actualEnd = e;
                if (actualEnd < defaultEnd) {
                    const startPred = addDays(actualEnd, 1);
                    const predDays = Math.floor((defaultEnd - startPred) / 86400000);
                    for (let i = 0; i <= predDays; i++) {
                        predPeriodDays.add(toDateStr(addDays(startPred, i)));
                    }
                }
            });

            const latestStart = getLatestStart(store);
            if (latestStart) {
                const base = parseDateStr(latestStart);
                for (let k = 1; k <= 6; k++) {
                    const start = addDays(base, cycleLength * k);
                    for (let i = 0; i < periodLength; i++) {
                        const ds = toDateStr(addDays(start, i));
                        if (!periodDays.has(ds)) predPeriodDays.add(ds);
                    }

                    const ovu = addDays(start, -lutealDays);
                    ovulationDay.add(toDateStr(ovu));
                    for (let j = -2; j <= 2; j++) {
                        ovulationDays.add(toDateStr(addDays(ovu, j)));
                    }
                }
            }

            return { periodDays, predPeriodDays, ovulationDays, ovulationDay };
        },

        buildMonth(year, month) {
            this.setData({ year, month });
            this.refreshAll();
        },

        goPrevMonth() {
            let y = this.year;
            let m = this.month - 1;
            if (m < 1) {
                m = 12;
                y--;
            }
            this.startMonthAnim('prev', y, m);
        },

        goNextMonth() {
            let y = this.year;
            let m = this.month + 1;
            if (m > 12) {
                m = 1;
                y++;
            }
            this.startMonthAnim('next', y, m);
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

        onTapDate(e) {
            const dateStr = e.currentTarget.dataset.date;
            if (!dateStr) return;
            this.setData({ selectedDate: dateStr });
            this.refreshAll();
        },

        onTogglePeriod(e) {
            const checked = e.detail.value;
            const store = loadStore();
            migrateIfNeeded(store);
            const dateStr = this.selectedDate;
            const settings = store.settings || DEFAULTS;
            const periodLength = settings.periodLength || DEFAULTS.periodLength;

            if (checked) {
                const cover = findActualRecordCoveringDate(store, dateStr);
                if (cover) {
                    this.refreshAll();
                    return;
                }

                const owner = findPredTailOwner(store, dateStr, periodLength);
                if (owner) {
                    owner.record.end = dateStr;
                    saveStore(store);
                    this.refreshAll();
                    return;
                }

                const adj = findAdjacentEndOwner(store, dateStr);
                if (adj) {
                    adj.record.end = dateStr;
                    saveStore(store);
                    this.refreshAll();
                    return;
                }

                store.periodRecords = store.periodRecords || [];
                store.periodRecords.push({ start: dateStr, end: dateStr });
                saveStore(store);
                this.refreshAll();
            } else {
                const cover = findActualRecordCoveringDate(store, dateStr);
                if (cover) {
                    const r = cover.record;
                    const s = parseDateStr(r.start);
                    const eDate = parseDateStr(r.end);
                    const d = parseDateStr(dateStr);

                    if (r.start === r.end) {
                        store.periodRecords.splice(cover.index, 1);
                    } else if (d.getTime() === s.getTime()) {
                        r.start = toDateStr(addDays(s, 1));
                    } else if (d.getTime() === eDate.getTime()) {
                        r.end = toDateStr(addDays(eDate, -1));
                    } else {
                        const left = { start: r.start, end: toDateStr(addDays(d, -1)) };
                        const right = { start: toDateStr(addDays(d, 1)), end: r.end };
                        store.periodRecords.splice(cover.index, 1, left, right);
                    }
                    saveStore(store);
                }
                this.refreshAll();
            }
        },

        onTouchStart(e) {
            if (!e.touches || !e.touches.length) return;
            this.setData({
                touchStartX: e.touches[0].clientX,
                touchStartY: e.touches[0].clientY
            });
        },

        onTouchEnd(e) {
            if (!e.changedTouches || !e.changedTouches.length) return;
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const dx = endX - this.touchStartX;
            const dy = endY - this.touchStartY;

            if (Math.abs(dx) < 60) return;
            if (Math.abs(dx) < Math.abs(dy) * 1.2) return;

            if (dx < 0) this.goNextMonth();
            else this.goPrevMonth();
        },

        goPeriodAnalysis() {
            uni.navigateTo({
                url: '/pages/subperiod/analysis/analysis'
            });
        },

        onGoPain() {
            const date = this.selectedDate;
            uni.navigateTo({
                url: `/pages/subperiod/pain/pain?date=${date}`
            });
        },

        onAddWeight() {
            uni.hideTabBar({ animation: true });

            const store = loadStore();
            migrateIfNeeded(store);
            const dateStr = this.selectedDate;
            const rec = store.weightRecords && store.weightRecords[dateStr];
            const kg = rec && typeof rec.kg === 'number' ? rec.kg : 0;

            let showVal = '';
            if (kg > 0) showVal = kg.toFixed(2);

            this.setData({
                showWeightPopup: true,
                weightInput: showVal,
                weightDisplay: showVal || '0'
            });
        },

        onWeightCancel() {
            this.setData({ showWeightPopup: false });
            uni.showTabBar({ animation: true });
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

        onWeightDel() {
            let s = this.weightInput || '';
            if (!s) {
                this.setData({ weightDisplay: '0' });
                return;
            }
            s = s.slice(0, -1);
            this.setData({
                weightInput: s,
                weightDisplay: s === '' ? '0' : s
            });
        },

        onWeightConfirm() {
            let s = (this.weightInput || '').trim();
            if (s === '') s = (this.weightDisplay || '').trim();
            if (s === '') s = '0';

            const num = parseFloat(s);
            if (isNaN(num)) {
                uni.showToast({ title: '请输入有效体重', icon: 'none' });
                return;
            }

            const store = loadStore();
            migrateIfNeeded(store);
            const dateStr = this.selectedDate;
            store.weightRecords = store.weightRecords || {};

            if (num === 0) {
                if (store.weightRecords[dateStr]) {
                    delete store.weightRecords[dateStr];
                    saveStore(store);
                    uni.showToast({ title: '已删除体重记录', icon: 'none' });
                } else {
                    uni.showToast({ title: '当天未记录体重', icon: 'none' });
                }
                this.setData({ showWeightPopup: false });
                uni.showTabBar({ animation: true });
                this.refreshAll();
                return;
            }

            if (num < 0) {
                uni.showToast({ title: '请输入有效体重', icon: 'none' });
                return;
            }

            const kg = num;
            store.weightRecords[dateStr] = { kg: Number(kg.toFixed(2)) };
            saveStore(store);

            this.setData({ showWeightPopup: false });
            uni.showTabBar({ animation: true });
            uni.showToast({ title: '已记录体重', icon: 'none' });
            this.refreshAll();
        },

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
