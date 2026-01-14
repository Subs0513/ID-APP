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
            <picker mode="date" :value="form.date" @change="onDate">
                <view class="field field--single">
                    <view :class="'field__value ' + (!form.date ? 'field__placeholder' : '')">
                        {{ form.date || '请选择日期' }}
                    </view>
                </view>
            </picker>

            <!-- 类型 -->
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
                    保存
                </button>
            </view>

            <!-- <view wx:if="{{isEdit}}" style="margin-top: 18rpx;">
      <button class="btn btn-danger" bindtap="remove">删除</button>
    </view> -->
        </view>
    </view>
</template>

<script>
const storage = require('../../utils/storage');


export default {
    data() {
        return {
            id: '',
            list: [],
            typeOptions: [
                {
                    value: 'anniversary',
                    text: '纪念日'
                },
                {
                    value: 'countdown',
                    text: '倒计时'
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
		uni.setNavigationBarTitle({
		  title: '编辑重要日子'
		});

        const id = options && options.id ? options.id : '';
        if (!id) {
            uni.showToast({
                title: '缺少参数',
                icon: 'none'
            });
            setTimeout(() => uni.navigateBack(), 600);
            return;
        }

		const list = storage.getList();
        const item = list.find((x) => x.id === id);

        if (!item) {
            uni.showToast({
                title: '未找到该记录',
                icon: 'none'
            });
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
            }
        });
    },
    methods: {
        setData(obj) {
            // 兼容：在 HBuilder/uni-app 中也可用 this.xxx = ...
            Object.keys(obj).forEach((k) => {
                this[k] = obj[k];
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

        save() {
            const title = (this.form.title || '').trim();
            if (!title) {
                uni.showToast({
                    title: '请输入标题',
                    icon: 'none'
                });
                return;
            }

            if (!this.form.date) {
                uni.showToast({
                    title: '请选择日期',
                    icon: 'none'
                });
                return;
            }


			const list = storage.getList();
            const idx = list.findIndex((x) => x.id === this.id);
            if (idx < 0) {
                uni.showToast({
                    title: '未找到该记录',
                    icon: 'none'
                });
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


            uni.showToast({
                title: '已保存',
                icon: 'success'
            });

            // 保存后返回上一页
            setTimeout(() => {
                uni.navigateBack();
            }, 300);
        }
    }
};
</script>

<style>
@import './editDetail.css';

/* ====== 补充：与 add 页面一致的图标样式（避免 editDetail.css 没有定义） ====== */
.label.row-left-with-icon {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10rpx;
}

.label-icon {
    width: 32rpx;
    height: 32rpx;
    flex: 0 0 auto;
}

.row-left-with-icon {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10rpx;
}

.top-icon,
.include-icon {
    width: 32rpx;
    height: 32rpx;
    flex: 0 0 auto;
}
</style>
