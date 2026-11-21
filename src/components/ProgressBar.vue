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
    color: '#4f6ef7',
  },
)
</script>

<style scoped lang="scss">
.progress-track {
  width: 100%;
  overflow: hidden;
  border-radius: 999rpx;
  background: #edf0f7;
}

.progress-fill {
  height: 100%;
  border-radius: 999rpx;
  transition: width 0.2s ease;
}
</style>
