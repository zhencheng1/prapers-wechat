<template>
  <view class="page">
    <view class="row between page-head">
      <view>
        <text class="title">我的题库</text>
        <text class="small muted head-sub">{{ totalQuestions }} 题 · 本地保存</text>
      </view>
      <button class="btn btn-primary btn-small" @tap="goImport">导入</button>
    </view>

    <template v-if="bankStore.banks.length">
      <BankCard
        v-for="bank in bankStore.banks"
        :key="bank.id"
        :bank="bank"
        :percent="percentOf(bank)"
        @tap="openBank(bank.id)"
      />
    </template>

    <EmptyState
      v-else
      title="还没有题库"
      description="支持导入 quizbank/v1 格式的 JSON 文件，也可以先用内置示例题库体验。"
      icon="书"
    >
      <button class="btn btn-primary" @tap="goImport">导入题库</button>
    </EmptyState>

    <view class="format-tip">
      <text class="small muted">导入提示</text>
      <text class="small light tip-text">
        微信中无法直接浏览手机文件，请先把 JSON 文件发送到「文件传输助手」或任意聊天，再从聊天文件中选择。
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { BankMeta } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { loadProgress } from '@/core/storage/records'
import BankCard from '@/components/BankCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const appStore = useAppStore()
const bankStore = useBankStore()

const totalQuestions = computed(() =>
  bankStore.banks.reduce((total, bank) => total + bank.questionCount, 0),
)

function percentOf(bank: BankMeta): number {
  if (!bank.questionCount) return 0
  const progress = loadProgress(bank.id)
  return Math.min(100, Math.round((progress.seen.length / bank.questionCount) * 100))
}

onShow(async () => {
  await appStore.ensureReady()
  await bankStore.refresh()
})

function openBank(id: string): void {
  uni.navigateTo({ url: `/pages/bank/detail?id=${id}` })
}

function goImport(): void {
  uni.navigateTo({ url: '/pages/import/index' })
}
</script>

<style scoped lang="scss">
.page-head {
  margin-bottom: 28rpx;
}

.head-sub {
  display: block;
  margin-top: 6rpx;
}

.format-tip {
  margin-top: 32rpx;
  padding: 24rpx;
  border-radius: $radius-sm;
  background: #ffffff;
}

.tip-text {
  display: block;
  margin-top: 8rpx;
  line-height: 1.6;
}
</style>
