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
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.2;
  color: $text;
}

.stat-suffix {
  margin-left: 4rpx;
  font-size: 22rpx;
  font-weight: 400;
  color: $text-sub;
}

.stat-label {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $text-sub;
}
</style>
