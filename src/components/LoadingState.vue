<template>
  <view class="loading-state">
    <view class="spinner" />
    <text class="loading-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), { text: '加载中…' })
</script>

<style scoped lang="scss">
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 90rpx 40rpx;
  border: 1rpx dashed $border;
  border-radius: $radius;
  background: rgba(255, 255, 255, 0.5);
}

.spinner {
  width: 56rpx;
  height: 56rpx;
  margin-bottom: 24rpx;
  border: 5rpx solid $primary-soft;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 24rpx;
  color: $text-sub;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
