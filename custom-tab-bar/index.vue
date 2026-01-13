<template>
    <view v-if="!hidden" class="tabbar">
        <!-- 你原来的 tabbar 内容一字不动放这里 -->
        <view class="tabbar">
            <view class="tabbar__safe">
                <view class="tabbar__items">
                    <view :class="'tabbar__item ' + (selected === 0 ? 'is-active' : '')" data-index="0" @tap="onTap">
                        <text class="tabbar__text">主页</text>
                    </view>

                    <view :class="'tabbar__item ' + (selected === 1 ? 'is-active' : '')" data-index="1" @tap="onTap">
                        <text class="tabbar__text">新增</text>
                    </view>

                    <view :class="'tabbar__item ' + (selected === 2 ? 'is-active' : '')" data-index="2" @tap="onTap">
                        <text class="tabbar__text">经期</text>
                    </view>

                    <view :class="'tabbar__item ' + (selected === 3 ? 'is-active' : '')" data-index="3" @tap="onTap">
                        <text class="tabbar__text">我</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            selected: 0,
            // ✅ 新增：控制整个自定义 tabbar 是否显示
            hidden: false,
            list: [
                {
                    pagePath: '/pages/home/home'
                },
                {
                    pagePath: '/pages/add/add'
                },
                {
                    pagePath: '/pages/period/period'
                },
                {
                    pagePath: '/pages/me/me'
                }
            ]
        };
    },
    methods: {
        handlePageShow() {
            const pages = getCurrentPages();
            const current = pages[pages.length - 1];
            const route = '/' + current.route;
            const idx = this.list.findIndex((i) => i.pagePath === route);
            if (idx !== -1 && idx !== this.selected) {
                this.setData({
                    selected: idx
                });
            }
        },

        onTap(e) {
            const index = Number(e.currentTarget.dataset.index);
            const item = this.list[index];
            if (!item) {
                return;
            }

            // ❗不要在这里 setData(selected)，否则会出现“亮一下又灭”
            uni.switchTab({
                url: item.pagePath
            });
        },

        // ✅ 仍然保留：页面 onShow 里想手动同步选中态也可以用
        setSelected(index) {
            this.setData({
                selected: index
            });
        },

        // ✅ 新增：供页面在弹窗打开/关闭时调用，隐藏/显示 tabbar
        setHidden(v) {
            this.setData({
                hidden: !!v
            });
        }
    },
    created: function () {}
};
</script>
<style>
@import './index.css';
</style>
