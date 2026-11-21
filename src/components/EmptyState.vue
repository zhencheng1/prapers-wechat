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
  padding: 90rpx 40rpx;
  text-align: center;
  border: 1rpx dashed $border;
  border-radius: $radius;
  background: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  margin-bottom: 24rpx;
  border-radius: 50%;
  background: $sand;
  color: $primary;
  font-family: $font-display;
  font-size: 44rpx;
  font-weight: 600;
}

.empty-title {
  font-family: $font-display;
  font-size: 32rpx;
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
