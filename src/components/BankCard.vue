<template>
  <view class="bank-card press" @tap="$emit('tap')">
    <view class="row between">
      <text class="bank-name line1 grow">{{ bank.name }}</text>
      <text class="tag">{{ sourceLabel }}</text>
    </view>
    <text class="bank-desc line1">{{ bank.description || '暂无简介' }}</text>
    <view class="row between bank-meta">
      <text class="small muted">{{ bank.questionCount }} 题</text>
      <text class="small light">{{ storageLabel }}</text>
    </view>
    <ProgressBar :value="percent" />
    <view class="row between bank-foot">
      <text class="small muted">已练 {{ percent }}%</text>
      <text class="small light">{{ openedText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BankMeta } from '@/types/domain'
import { formatDateTime } from '@/utils'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{
  bank: BankMeta
  percent: number
}>()

defineEmits<{ (event: 'tap'): void }>()

const sourceLabel = computed(() => {
  const labels: Record<BankMeta['source'], string> = {
    json: 'JSON',
    pdf: 'PDF',
    demo: '示例',
    manual: '手动',
  }
  return labels[props.bank.source] ?? 'JSON'
})

const storageLabel = computed(() =>
  props.bank.storageMode === 'file' ? '文件存储' : '缓存存储',
)

const openedText = computed(() =>
  props.bank.lastOpenedAt ? `最近 ${formatDateTime(props.bank.lastOpenedAt)}` : '尚未开始',
)
</script>

<style scoped lang="scss">
.bank-card {
  margin-bottom: 20rpx;
  padding: 30rpx;
  border: 1rpx solid $border;
  border-radius: $radius;
  background: $card;
}

.bank-name {
  margin-right: 16rpx;
  font-family: $font-display;
  font-size: 34rpx;
  font-weight: 600;
  color: $text;
}

.bank-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $text-sub;
}

.bank-meta {
  margin: 22rpx 0 14rpx;
}

.bank-foot {
  margin-top: 12rpx;
}
</style>
