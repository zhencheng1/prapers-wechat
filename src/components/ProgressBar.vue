<template>
  <view class="progress-track" :style="{ height: height + 'rpx' }">
    <view
      class="progress-fill"
      :style="{ width: Math.min(100, Math.max(0, value)) + '%', background: color }"
    />
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number
    height?: number
    color?: string
  }>(),
  {
    height: 12,
    color: '#1f4a3c',
  },
)
</script>

<style scoped lang="scss">
.progress-track {
  width: 100%;
  overflow: hidden;
  border-radius: 999rpx;
  background: #e8e2d3;
}

.progress-fill {
  height: 100%;
  border-radius: 999rpx;
  transition: width 0.2s ease;
}
</style>
