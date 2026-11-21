<template>
  <view class="empty-state">
    <view class="empty-icon">{{ icon }}</view>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
    <view v-if="$slots.default" class="empty-action">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
  }>(),
  { icon: '·' },
)
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 24rpx;
  border-radius: 60rpx;
  background: #eef2ff;
  color: $primary;
  font-size: 48rpx;
  font-weight: 700;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text;
}

.empty-desc {
  margin-top: 12rpx;
  max-width: 480rpx;
  font-size: 24rpx;
  color: $text-sub;
  line-height: 1.6;
}

.empty-action {
  margin-top: 32rpx;
}
</style>
