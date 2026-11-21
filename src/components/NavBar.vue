<template>
  <view class="nav-bar">
    <view class="nav-bar-fixed" :style="{ top: statusTop + 'px' }">
      <view v-if="showBack" class="nav-back press" @tap="onBack">
        <view class="chevron" />
      </view>
      <view v-else class="nav-slot" />
      <text class="nav-title">{{ title }}</text>
      <!-- 小程序右上角是系统胶囊（关闭/更多）区，禁止在此放置任何功能入口 -->
      <view class="nav-slot nav-right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    autoBack?: boolean
  }>(),
  { showBack: true, autoBack: true },
)

const emit = defineEmits<{ (event: 'back'): void }>()

// 导航栏紧贴状态栏下方；H5 状态栏固定 44px，小程序取真实高度
const statusTop = ref(44)
// #ifndef H5
try {
  statusTop.value = uni.getSystemInfoSync().statusBarHeight || 20
} catch {
  statusTop.value = 20
}
// #endif

function onBack(): void {
  emit('back')
  if (props.autoBack) uni.navigateBack()
}
</script>

<style scoped lang="scss">
.nav-bar {
  /* 外层保留占位，抵消固定层高度，内容不会被遮挡 */
  height: 96rpx;
}

.nav-bar-fixed {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 99;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 96rpx;
  padding: 0 32rpx;
  background: $bg;
}

.nav-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
}

.chevron {
  width: 20rpx;
  height: 20rpx;
  border-left: 3rpx solid $text;
  border-bottom: 3rpx solid $text;
  transform: rotate(45deg);
  margin-left: 6rpx;
}

.nav-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 30rpx;
  font-weight: 500;
  color: $text;
  white-space: nowrap;
}

.nav-slot {
  min-width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.nav-right {
  justify-content: flex-end;
}
</style>
