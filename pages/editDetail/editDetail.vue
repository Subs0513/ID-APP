<template>
    <!-- pages/editDetail/editDetail.wxml -->
    <view class="container page-bottom-space">
        <view class="card">
            <!-- 标题 -->
            <view class="label row-left-with-icon">
                <image class="label-icon" src="/static/assets/icons/f_bt.svg" mode="aspectFit" />
                <text>标题</text>
            </view>
            <view class="field field--single">
                <input class="field__input" placeholder="例如：在一起一周年" :value="form.title" @input="onTitle" />
            </view>

            <!-- 日期 -->
            <view class="label row-left-with-icon">
                <image class="label-icon" src="/static/assets/icons/f_rq.svg" mode="aspectFit" />
                <text>日期</text>
            </view>

            <!-- ✅ 用自定义 YMD-Wheel 替换原生日期选择器 -->
            <view @tap="openDateWheel">
                <view class="field field--single">
                    <view :class="'field__value ' + (!form.date ? 'field__placeholder' : '')">
                        {{ form.date || '请选择日期' }}
                    </view>
                </view>
            </view>

            <!-- 类型 -->
            <view class="label row-left-with-icon">
                <image class="label-icon" src="/static/assets/icons/f_lx.svg" mode="aspectFit" />
                <text>类型</text>
            </view>

            <!-- ✅ 用自定义 Type-Wheel 替换原生 picker -->
            <view @tap="openTypeWheel">
                <view class="field field--single">
                    <view class="field__value">
                        {{ typeOptions[typeIndex].text }}
                    </view>
                </view>
            </view>

            <!-- 备注 -->
            <view class="label row-left-with-icon">
                <image class="label-icon" src="/static/assets/icons/f_bz.svg" mode="aspectFit" />
                <text>备注（可选）</text>
            </view>
            <view class="field field--multi">
                <textarea
                    class="field__textarea"
                    placeholder="写点说明..."
                    :value="form.note"
                    @input="onNote"
                ></textarea>
            </view>

            <!-- 置顶（带图标） -->
            <view class="row" style="margin-top: 18rpx">
                <view class="row-left row-left-with-icon">
                    <image class="top-icon" src="/static/assets/icons/f_zd.svg" mode="aspectFit" />
                    <view class="muted">是否置顶</view>
                </view>

                <switch :checked="form.isTop" @change="onTop" color="#f6a5b5" />
            </view>

            <!-- 正数包含起始日（带图标） -->
            <view class="row" style="margin-top: 18rpx">
                <view class="row-left row-left-with-icon">
                    <image class="include-icon" src="/static/assets/icons/f_jy.svg" mode="aspectFit" />
                    <view class="muted">正数包含起始日</view>
                </view>

                <switch :checked="form.includeStart" @change="onIncludeStart" color="#f6a5b5" />
            </view>

            <!-- ✅ 只保留保存：居中且拉长 -->
            <view style="margin-top: 28rpx; display: flex; justify-content: center">
                <button
                    class="btn"
                    @tap="save"
                    style="width: 520rpx; height: 92rpx; line-height: 92rpx; border-radius: 16rpx"
                >
                    保    存
                </button>
            </view>
        </view>

        <!-- ✅ 类型滚轮弹窗（Type-Wheel） -->
        <TypeWheel
            :show="showTypeWheel"
            :options="typeOptions"
            :activeIndex="typeIndex"
            title="选择类型"
            subtitle=""
            @cancel="onTypeWheelCancel"
            @confirm="onTypeWheelConfirm"
            @update:show="onTypeWheelUpdateShow"
        />

        <!-- ✅ 自定义日期滚轮（遮罩 + 底部弹层） -->
        <YMDWheel
            :show="showDateWheel"
            :value="dateWheelTemp"
            title="选择日期"
            subtitle=""
            @cancel="onDateWheelCancel"
            @confirm="onDateWheelConfirm"
            @update:show="onDateWheelUpdateShow"
        />
    </view>
</template>

<script>
const storage = require('../../utils/storage');

import YMDWheel from '../../components/YMD-Wheel/YMD-Wheel.vue';
import TypeWheel from '../../components/Type-Wheel/Type-Wheel.vue';

export default {
    components: {
        YMDWheel,
        TypeWheel
    },
    data() {
        return {
            id: '',
            list: [],
            typeOptions: [
                { value: 'anniversary', text: '纪念日' },
                { value: 'countdown', text: '倒计时' },
                { value: 'birthday', text: '生日' },
                { value: 'other', text: '其他' }
            ],

            typeIndex: 0,

            form: {
                title: '',
                date: '',
                type: 'anniversary',
                note: '',
                isTop: false,
                includeStart: false
            },

            // ✅ 自定义日期滚轮
            showDateWheel: false,
            dateWheelTemp: '',

            // ✅ 自定义类型滚轮
            showTypeWheel: false,

            text: ''
        };
    },
    onLoad(options) {
        uni.setNavigationBarTitle({ title: '编辑重要日子' });

        const id = options && options.id ? options.id : '';
        if (!id) {
            uni.showToast({ title: '缺少参数', icon: 'none' });
            setTimeout(() => uni.navigateBack(), 600);
            return;
        }

        const list = storage.getList();
        const item = list.find((x) => x.id === id);

        if (!item) {
            uni.showToast({ title: '未找到该记录', icon: 'none' });
            setTimeout(() => uni.navigateBack(), 600);
            return;
        }

        const idx = this.typeOptions.findIndex((t) => t.value === item.type);
        const typeIndex = idx >= 0 ? idx : 0;

        this.setData({
            id,
            list,
            typeIndex,
            form: {
                title: item.title || '',
                date: item.date || '',
                type: item.type || this.typeOptions[typeIndex].value,
                note: item.note || '',
                isTop: !!item.isTop,
                includeStart: !!item.includeStart
            },

            // ✅ 同步自定义滚轮的初始值
            showDateWheel: false,
            dateWheelTemp: item.date || '',

            // ✅ 类型弹窗默认关闭
            showTypeWheel: false
        });
    },
    methods: {
        setData(obj) {
            Object.keys(obj).forEach((k) => {
                this[k] = obj[k];
            });
        },

        onTitle(e) {
            this.setData({
                form: { ...this.form, title: e.detail.value }
            });
        },

        // 保留：兼容旧逻辑（现在不再由原生 picker 触发）
        onDate(e) {
            this.setData({
                form: { ...this.form, date: e.detail.value }
            });
        },

        // =======================
        // ✅ 自定义日期滚轮
        // =======================
        openDateWheel() {
            const v = this.form && this.form.date ? this.form.date : this.dateWheelTemp || '';
            this.setData({
                showDateWheel: true,
                dateWheelTemp: v
            });
        },

        onDateWheelCancel() {
            this.setData({ showDateWheel: false });
        },

        onDateWheelConfirm(dateStr) {
            this.setData({
                showDateWheel: false,
                dateWheelTemp: dateStr,
                form: { ...this.form, date: dateStr }
            });
        },

        onDateWheelUpdateShow(v) {
            this.setData({ showDateWheel: !!v });
        },

        // =======================
        // ✅ 自定义类型滚轮（Type-Wheel）
        // =======================
        openTypeWheel() {
            this.setData({ showTypeWheel: true });
        },

        onTypeWheelCancel() {
            this.setData({ showTypeWheel: false });
        },

        onTypeWheelConfirm(index, option) {
            const i = Number(index) || 0;
            const type = option && option.value ? option.value : (this.typeOptions[i] ? this.typeOptions[i].value : 'anniversary');

            this.setData({
                showTypeWheel: false,
                typeIndex: i,
                form: { ...this.form, type }
            });
        },

        onTypeWheelUpdateShow(v) {
            this.setData({ showTypeWheel: !!v });
        },

        // ✅ 保留：兼容旧逻辑（如果未来别处还用 picker）
        onType(e) {
            const index = Number(e.detail.value) || 0;
            const type = this.typeOptions[index].value;
            this.setData({
                typeIndex: index,
                form: { ...this.form, type }
            });
        },

        onNote(e) {
            this.setData({
                form: { ...this.form, note: e.detail.value }
            });
        },

        onTop(e) {
            this.setData({
                form: { ...this.form, isTop: e.detail.value }
            });
        },

        onIncludeStart(e) {
            this.setData({
                form: { ...this.form, includeStart: e.detail.value }
            });
        },

        save() {
            const title = (this.form.title || '').trim();
            if (!title) {
                uni.showToast({ title: '请输入标题', icon: 'none' });
                return;
            }

            if (!this.form.date) {
                uni.showToast({ title: '请选择日期', icon: 'none' });
                return;
            }

            const list = storage.getList();
            const idx = list.findIndex((x) => x.id === this.id);
            if (idx < 0) {
                uni.showToast({ title: '未找到该记录', icon: 'none' });
                return;
            }

            list[idx] = {
                ...list[idx],
                title: this.form.title,
                date: this.form.date,
                type: this.form.type,
                note: this.form.note,
                isTop: !!this.form.isTop,
                includeStart: !!this.form.includeStart
            };

            storage.setList(list);

            uni.showToast({ title: '已保存', icon: 'success' });

            setTimeout(() => {
                uni.navigateBack();
            }, 300);
        }
    }
};
</script>

<style>
@import './editDetail.css';
</style>
