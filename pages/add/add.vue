<template>
    <view class="container page-bottom-space">
        <view class="card">
            <!-- <view class="label">标题</view> -->
            <view class="label row-left-with-icon">
                <image class="label-icon" src="/static/assets/icons/f_bt.svg" mode="aspectFit" />
                <text>标题</text>
            </view>

            <view class="field field--single">
                <input class="field__input" placeholder="例如：在一起一周年" :value="form.title" @input="onTitle" />
            </view>

            <!-- <view class="label">日期</view> -->
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

            <!-- <view class="label">类型</view> -->
            <view class="label row-left-with-icon">
                <image class="label-icon" src="/static/assets/icons/f_lx.svg" mode="aspectFit" />
                <text>类型</text>
            </view>

            <picker mode="selector" :range="typeOptions" range-key="text" :value="typeIndex" @change="onType">
                <view class="field field--single">
                    <view class="field__value">
                        {{ typeOptions[typeIndex].text }}
                    </view>
                </view>
            </picker>

            <!-- <view class="label">备注（可选）</view> -->
            <view class="label row-left-with-icon">
                <image class="label-icon" src="/static/assets/icons/f_bz.svg" mode="aspectFit" />
                <text>备注（可选）</text>
            </view>
            <view class="field field--multi">
                <textarea class="field__textarea" placeholder="写点什么吧..." :value="form.note" @input="onNote"></textarea>
            </view>

            <!-- <view class="row" style="margin-top: 18rpx;">
      <view class="muted">是否置顶</view>
      <switch checked="{{form.isTop}}" bindchange="onTop" />
    </view> -->

            <view class="row" style="margin-top: 18rpx">
                <view class="row-left row-left-with-icon">
                    <image class="top-icon" src="/static/assets/icons/f_zd.svg" mode="aspectFit" />
                    <view class="muted">是否置顶</view>
                </view>

                <switch :checked="form.isTop" @change="onTop" color="#f6a5b5" />
            </view>

            <!-- ✅ 新增：正数包含起始日 -->
            <!-- 正数包含起始日（统一风格） -->
            <!-- <view class="row" style="margin-top: 18rpx;">
      <view class="muted">正数包含起始日</view>
      <switch checked="{{form.includeStart}}" bindchange="onIncludeStart" />
    </view> -->
            <view class="row" style="margin-top: 18rpx">
                <view class="row-left row-left-with-icon">
                    <image class="include-icon" src="/static/assets/icons/f_jy.svg" mode="aspectFit" />
                    <view class="muted">正数包含起始日</view>
                </view>

                <switch :checked="form.includeStart" @change="onIncludeStart" color="#f6a5b5" />
            </view>

            <!-- ✅ 只保留保存：居中且拉长 -->
            <view style="margin-top: 28rpx; display: flex; justify-content: center">
                <button class="btn" @tap="save" style="width: 520rpx; height: 92rpx; line-height: 92rpx; border-radius: 16rpx">保存</button>
            </view>
        </view>

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
const dateUtil = require('../../utils/date');

// ⚠️ 如果你的组件放在别的路径，只需要改这一行 import 路径即可
import YMDWheel from '../../components/YMD-Wheel/YMD-Wheel.vue';

function uuid() {
    return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
}
export default {
    components: {
        YMDWheel
    },
    data() {
        return {
            isEdit: false,
            editId: '',

            typeOptions: [
                {
                    value: 'anniversary',
                    text: '纪念日'
                },
                {
                    value: 'birthday',
                    text: '生日'
                },
                {
                    value: 'other',
                    text: '其他'
                }
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

            text: ''
        };
    },
    onShow() {
        // ✅ 从 detail 通过 storage 传递 editingId 进入编辑态
        const editingId = uni.getStorageSync('editingId');
        if (editingId) {
            uni.removeStorageSync('editingId');

            // 避免重复 load（比如 onShow 多次触发）
            if (!this.isEdit || this.editId !== editingId) {
                this.loadEdit(editingId);
            }
            return;
        }

        // ✅ 关键：如果不是从 detail 带着 editingId 进来，那就是“新增态”
        // 每次展示 edit tab 都清空，避免残留上一次 detail 的内容
        if (this.isEdit || (this.form && (this.form.title || this.form.note))) {
            this.resetForm();
        } else if (!this.form.date) {
            // 兜底：首次进入
            this.resetForm();
        }

        // wx.setNavigationBarTitle({ title: "新增重要日子" });
    },
    onLoad(options) {
        const id = options && options.id ? options.id : '';
        if (id) {
            this.loadEdit(id);
        } else {
            this.resetForm();
            // wx.setNavigationBarTitle({ title: "新增重要日子" });
        }
    },
    methods: {
        // ✅ 统一的“清空/初始化表单”
        resetForm() {
            this.setData({
                isEdit: false,
                editId: '',
                typeIndex: 0,
                form: {
                    title: '',
                    date: dateUtil.todayStr(),
                    type: 'anniversary',
                    note: '',
                    isTop: false,
                    includeStart: false
                },

                // 每次重置时，滚轮默认对齐到当前 form.date
                showDateWheel: false,
                dateWheelTemp: dateUtil.todayStr()
            });
        },

        loadEdit(id) {
            const list = storage.getList();
            const found = list.find((it) => it.id === id);
            if (!found) {
                uni.showToast({
                    title: '未找到数据',
                    icon: 'none'
                });
                uni.switchTab({
                    url: '/pages/home/home'
                });
                return;
            }
            const idx = this.typeOptions.findIndex((t) => t.value === found.type);
            this.setData({
                isEdit: true,
                editId: id,
                typeIndex: idx >= 0 ? idx : 0,
                form: {
                    title: found.title || '',
                    date: found.date || dateUtil.todayStr(),
                    type: found.type || 'anniversary',
                    note: found.note || '',
                    isTop: !!found.isTop,
                    includeStart: !!found.includeStart
                },

                // ✅ 同步自定义滚轮的初始值
                showDateWheel: false,
                dateWheelTemp: found.date || dateUtil.todayStr()
            });
            uni.setNavigationBarTitle({
                title: '修改重要日子'
            });
        },

        onTitle(e) {
            this.setData({
                form: {
                    ...this.form,
                    title: e.detail.value
                }
            });
        },

        // 保留：兼容旧逻辑（现在不再由原生 picker 触发）
        onDate(e) {
            this.setData({
                form: {
                    ...this.form,
                    date: e.detail.value
                }
            });
        },

        // =======================
        // ✅ 自定义日期滚轮
        // =======================
        openDateWheel() {
            const v = this.form && this.form.date ? this.form.date : dateUtil.todayStr();
            this.setData({
                showDateWheel: true,
                dateWheelTemp: v
            });
        },

        onDateWheelCancel() {
            this.setData({
                showDateWheel: false
            });
        },

        onDateWheelConfirm(dateStr) {
            // dateStr: YYYY-MM-DD
            this.setData({
                showDateWheel: false,
                dateWheelTemp: dateStr,
                form: {
                    ...this.form,
                    date: dateStr
                }
            });
        },

        onDateWheelUpdateShow(v) {
            // 兼容组件内部 emit('update:show', false)
            this.setData({
                showDateWheel: !!v
            });
        },

        onType(e) {
            const index = Number(e.detail.value) || 0;
            const type = this.typeOptions[index].value;
            this.setData({
                typeIndex: index,
                form: {
                    ...this.form,
                    type
                }
            });
        },

        onNote(e) {
            this.setData({
                form: {
                    ...this.form,
                    note: e.detail.value
                }
            });
        },

        onTop(e) {
            this.setData({
                form: {
                    ...this.form,
                    isTop: e.detail.value
                }
            });
        },

        onIncludeStart(e) {
            this.setData({
                form: {
                    ...this.form,
                    includeStart: e.detail.value
                }
            });
        },

        validate() {
            const f = this.form;
            if (!f.title || !f.title.trim()) {
                return '请填写标题';
            }
            if (!f.date) {
                return '请选择日期';
            }
            return '';
        },

        save() {
            const msg = this.validate();
            if (msg) {
                uni.showToast({
                    title: msg,
                    icon: 'none'
                });
                return;
            }
            const list = storage.getList();
            const now = Date.now();
            const f = this.form;

            // ===== 编辑保存 =====
            if (this.isEdit) {
                const next = list.map((it) => {
                    if (it.id !== this.editId) {
                        return it;
                    }
                    return {
                        ...it,
                        ...f,
                        updatedAt: now
                    };
                });
                storage.setList(next);
                uni.showToast({
                    title: '已保存',
                    icon: 'success'
                });

                // ✅ TabBar 页进来的编辑，navigateBack 很可能退不回 detail
                // 优先回到来源 detail
                const backId = uni.getStorageSync('backDetailId');
                if (backId) {
                    uni.removeStorageSync('backDetailId');
                    uni.redirectTo({
                        url: '/pages/detail/detail?id=' + backId
                    });
                    return;
                }

                // 兜底：回 home
                uni.switchTab({
                    url: '/pages/home/home'
                });
                return;
            }

            // ===== 新增保存 =====
            const item = {
                id: uuid(),
                title: f.title.trim(),
                date: f.date,
                type: f.type,
                note: f.note || '',
                isTop: !!f.isTop,
                includeStart: !!f.includeStart,
                createdAt: now,
                updatedAt: now
            };
            storage.setList([item, ...list]);
            uni.showToast({
                title: '已添加',
                icon: 'success'
            });

            // 新增成功后先清空 add 页，再跳回 home
            this.resetForm();
            uni.switchTab({
                url: '/pages/home/home'
            });
        }
    }
};
</script>

<style>
@import './add.css';
</style>
