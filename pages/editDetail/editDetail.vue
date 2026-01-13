<template>
    <!-- pages/editDetail/editDetail.wxml -->
    <view class="container page-bottom-space">
        <view class="card">
            <view class="label">标题</view>
            <view class="field field--single">
                <input class="field__input" placeholder="例如：在一起一周年" :value="form.title" @input="onTitle" />
            </view>

            <view class="label">日期</view>
            <picker mode="date" :value="form.date" @change="onDate">
                <view class="field field--single">
                    <view :class="'field__value ' + (!form.date ? 'field__placeholder' : '')">
                        {{ form.date || '请选择日期' }}
                    </view>
                </view>
            </picker>

            <view class="label">类型</view>
            <picker mode="selector" :range="typeOptions" range-key="text" :value="typeIndex" @change="onType">
                <view class="field field--single">
                    <view class="field__value">
                        {{ typeOptions[typeIndex].text }}
                    </view>
                </view>
            </picker>

            <view class="label">备注（可选）</view>
            <view class="field field--multi">
                <textarea class="field__textarea" placeholder="写点说明..." :value="form.note" @input="onNote"></textarea>
            </view>

            <view class="row" style="margin-top: 18rpx">
                <view class="muted">是否置顶</view>
                <switch :checked="form.isTop" @change="onTop" color="#f6a5b5" />
            </view>

            <!-- ✅ 新增：正数包含起始日 -->
            <!-- 正数包含起始日（统一风格） -->
            <view class="row" style="margin-top: 18rpx">
                <view class="muted">正数包含起始日</view>
                <switch :checked="form.includeStart" @change="onIncludeStart" color="#f6a5b5" />
            </view>

            <!-- ✅ 只保留保存：居中且拉长 -->
            <view style="margin-top: 28rpx; display: flex; justify-content: center">
                <button class="btn" @tap="save" style="width: 520rpx; height: 92rpx; line-height: 92rpx; border-radius: 16rpx">保存</button>
            </view>

            <!-- <view wx:if="{{isEdit}}" style="margin-top: 18rpx;">
      <button class="btn btn-danger" bindtap="remove">删除此条</button>
    </view> -->
        </view>
    </view>
</template>

<script>
const storage = require('../../utils/storage');
const dateUtil = require('../../utils/date');
export default {
    data() {
        return {
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

            text: ''
        };
    },
    onLoad(options) {
        const id = options && options.id ? options.id : '';
        if (!id) {
            uni.showToast({
                title: '缺少参数',
                icon: 'none'
            });
            uni.navigateBack();
            return;
        }
        this.loadEdit(id);
    },
    methods: {
        loadEdit(id) {
            const list = storage.getList();
            const found = list.find((it) => it.id === id);
            if (!found) {
                uni.showToast({
                    title: '未找到数据',
                    icon: 'none'
                });
                uni.navigateBack();
                return;
            }
            const idx = this.typeOptions.findIndex((t) => t.value === found.type);
            this.setData({
                editId: id,
                typeIndex: idx >= 0 ? idx : 0,
                form: {
                    title: found.title || '',
                    date: found.date || dateUtil.todayStr(),
                    type: found.type || 'anniversary',
                    note: found.note || '',
                    isTop: !!found.isTop,
                    includeStart: !!found.includeStart
                }
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

        onDate(e) {
            this.setData({
                form: {
                    ...this.form,
                    date: e.detail.value
                }
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

            // 关键：普通页面编辑，保存后直接返回上一页(detail)，返回箭头逻辑就正常了
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
