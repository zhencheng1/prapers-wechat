<template>
  <view class="status-bar" :style="{ height: barHeight + 'px' }">
    <view class="status-bar-fixed" :style="{ height: barHeight + 'px' }">
      <!-- #ifdef H5 -->
      <text class="sb-time">9:41</text>
      <view class="sb-icons">
        <view class="signal">
          <view v-for="n in 4" :key="n" class="signal-bar" :class="'bar-' + n" />
        </view>
        <view class="wifi">
          <view class="wifi-dot" />
        </view>
        <view class="battery">
          <view class="battery-fill" />
        </view>
      </view>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup lang="ts">
let barHeight = 44

// #ifndef H5
try {
  barHeight = uni.getSystemInfoSync().statusBarHeight || 20
} catch {
  barHeight = 20
}
// #endif
</script>

<style scoped lang="scss">
.status-bar {
  position: relative;
  z-index: 100;
}

/* 视觉层固定在顶部；外层占位保持文档流，避免内容被遮挡 */
.status-bar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6rpx;
  background: $bg;
  color: $text;
}

.sb-time {
  font-family: Inter, system-ui, sans-serif;
  font-size: 26rpx;
  font-weight: 600;
}

.sb-icons {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
}

.signal {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 3rpx;
  height: 22rpx;
}

.signal-bar {
  width: 5rpx;
  background: $text;
  border-radius: 2rpx;
}

.bar-1 { height: 8rpx; }
.bar-2 { height: 12rpx; }
.bar-3 { height: 17rpx; }
.bar-4 { height: 22rpx; }

.wifi {
  position: relative;
  width: 26rpx;
  height: 20rpx;
  border: 4rpx solid $text;
  border-bottom-color: transparent;
  border-left-color: transparent;
  border-right-color: transparent;
  border-radius: 50%;
}

.wifi-dot {
  position: absolute;
  left: 7rpx;
  top: 8rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: $text;
}

.battery {
  position: relative;
  width: 38rpx;
  height: 19rpx;
  border: 3rpx solid $text;
  border-radius: 5rpx;
}

.battery::after {
  content: '';
  position: absolute;
  right: -7rpx;
  top: 4rpx;
  width: 4rpx;
  height: 8rpx;
  border-radius: 0 3rpx 3rpx 0;
  background: $text;
}

.battery-fill {
  width: 70%;
  height: 100%;
  background: $text;
}
</style>
