<template>
    <view class="container">
        <!-- 顶部：标题信息卡 -->
        <view class="card detail-card">
            <view class="top-row">
                <view class="detail-title">{{ item.title }}</view>
                <view v-if="item.isTop" class="tag">置顶</view>
            </view>

            <view class="meta">
                <view class="meta-row">
                    <text class="meta-label">日期：</text>
                    <text class="meta-value">{{ item.date }}</text>
                </view>

                <view class="meta-row">
                    <text class="meta-label">类型：</text>
                    <text class="meta-value">{{ typeText }}</text>
                </view>

                <view v-if="item.note" class="note">
                    <view class="note-title">备注</view>
                    <view class="note-text">{{ item.note }}</view>
                </view>
            </view>
        </view>

        <!-- 中部：倒计时大卡 -->
        <view class="card hero-card">
            <view class="hero-left">
                <view class="hero-label">{{ heroLabel }}</view>
                <view class="hero-sub">{{ heroSub }}</view>
            </view>

            <view class="hero-right">
                <view class="hero-number">{{ heroNumber }}</view>
                <view class="hero-unit">{{ heroUnit }}</view>
            </view>
        </view>

        <!-- 底部操作 -->
        <view class="actions">
            <button class="btn btn-secondary action-btn" @tap="goEdit">编辑</button>
            <button class="btn btn-danger action-btn" @tap="remove">删除</button>
            <!-- <button class="btn action-btn action-btn-wide" bindtap="goHome">返回主页</button> -->
        </view>
    </view>
</template>

<script>
const storage = require('../../utils/storage');
const dateUtil = require('../../utils/date');
function getTypeText(type) {
    if (type === 'anniversary') {
        return '纪念日';
    }
    if (type === 'birthday') {
        return '生日';
    }
    return '其他';
}

// 生成倒计时显示：支持 includeStart（只影响正数：还有X天）
function makeHero(dateStr, includeStart) {
    let d = dateUtil.daysTo(dateStr); // target - today

    // 今天
    if (d === 0) {
        return {
            heroLabel: '就是今天！',
            heroSub: '别忘了好好庆祝一下～',
            heroNumber: '0',
            heroUnit: 'days'
        };
    }

    // 未来：还有
    if (d > 0) {
        if (includeStart) {
            d = d + 1;
        }
        return {
            heroLabel: '还有',
            heroSub: '倒计时进行中',
            heroNumber: String(d),
            heroUnit: '天'
        };
    }

    // 过去：已经
    return {
        heroLabel: '已经',
        heroSub: '这一天已经过去',
        heroNumber: String(Math.abs(d)),
        heroUnit: '天'
    };
}
export default {
    data() {
        return {
            id: '',
            item: null,
            typeText: '',
            heroLabel: '',
            heroSub: '',
            heroNumber: '0',
            heroUnit: '天'
        };
    },
    onLoad(options) {
        const id = options.id || '';
        if (!id) {
            uni.showToast({
                title: '缺少参数',
                icon: 'none'
            });
            uni.switchTab({
                url: '/pages/home/home'
            });
            return;
        }
        this.setData({
            id
        });
        this.refresh();
    },
    onShow() {
        // 从编辑页返回时刷新
        if (this.id) {
            this.refresh();
        }
    },
    methods: {
        refresh() {
            const list = storage.getList();
            const item = list.find((it) => it.id === this.id);
            if (!item) {
                uni.showToast({
                    title: '记录不存在或已删除',
                    icon: 'none'
                });
                uni.switchTab({
                    url: '/pages/home/home'
                });
                return;
            }
            const hero = makeHero(item.date, item.includeStart);
            this.setData({
                item,
                typeText: getTypeText(item.type),
                ...hero
            });
        },

        // ✅ TabBar 页面不能带 ?id=，所以用 storage 传递 editingId

        goEdit() {
            uni.navigateTo({
                url: '/pages/editDetail/editDetail?id=' + this.id
            });
        },

        goHome() {
            uni.switchTab({
                url: '/pages/home/home'
            });
        },

        remove() {
            uni.showModal({
                title: '确认删除',
                content: '删除后无法恢复，确定要删除吗？',
                success: (res) => {
                    if (!res.confirm) {
                        return;
                    }
                    const list = storage.getList();
                    storage.setList(list.filter((it) => it.id !== this.id));
                    uni.showToast({
                        title: '已删除',
                        icon: 'success'
                    });
                    uni.switchTab({
                        url: '/pages/home/home'
                    });
                }
            });
        }
    }
};
</script>
<style>
@import './detail.css';
</style>
