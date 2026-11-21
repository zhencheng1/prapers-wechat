<template>
  <view class="stat-tile">
    <text class="stat-value">{{ value }}<text v-if="suffix" class="stat-suffix">{{ suffix }}</text></text>
    <text class="stat-label">{{ label }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  suffix?: string
}>()
</script>

<style scoped lang="scss">
.stat-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 120rpx;
}

.stat-value {
  font-family: $font-display;
  font-size: 48rpx;
  font-weight: 600;
  line-height: 1.1;
  color: $text;
}

.stat-suffix {
  margin-left: 4rpx;
  font-family: $font-body;
  font-size: 22rpx;
  font-weight: 400;
  color: $text-light;
}

.stat-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $text-light;
}
</style>
