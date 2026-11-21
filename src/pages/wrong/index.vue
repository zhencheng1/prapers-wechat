<template>
  <view class="page">
    <view class="row between head">
      <view>
        <text class="title">错题本</text>
        <text class="small muted head-sub">{{ total }} 题待复习</text>
      </view>
    </view>

    <template v-if="rows.length">
      <view
        v-for="row in rows"
        :key="row.meta.id"
        class="card wrong-card press"
        @tap="practice(row.meta)"
      >
        <view class="row between">
          <view class="grow">
            <text class="bank-name line1">{{ row.meta.name }}</text>
            <text class="small muted bank-sub">最近答错 {{ row.count }} 题</text>
          </view>
          <text class="tag">重练</text>
        </view>
        <view class="wrong-bar">
          <view class="wrong-fill" :style="{ width: row.percent + '%' }" />
        </view>
      </view>
    </template>

    <EmptyState
      v-else
      title="错题本是空的"
      description="答错的题会自动收进这里，连续答对后自动移出。"
      icon="错"
    >
      <button class="btn btn-primary" @tap="goBanks">去刷题</button>
    </EmptyState>

    <text class="foot-note">连续答对达到设置次数（默认 2 次）后，题目会自动移出错题本。</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { BankMeta } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { countWrong } from '@/services/bank'
import EmptyState from '@/components/EmptyState.vue'

const appStore = useAppStore()
const bankStore = useBankStore()

const rows = ref<Array<{ meta: BankMeta; count: number; percent: number }>>([])

const total = computed(() => rows.value.reduce((sum, row) => sum + row.count, 0))

onShow(async () => {
  await appStore.ensureReady()
  await bankStore.init()
  rows.value = bankStore.banks
    .map((meta) => {
      const count = countWrong(meta)
      const percent = meta.questionCount
        ? Math.min(100, Math.round((count / meta.questionCount) * 100))
        : 0
      return { meta, count, percent }
    })
    .filter((row) => row.count > 0)
})

function practice(meta: BankMeta): void {
  uni.navigateTo({ url: `/pages/quiz/index?bankId=${meta.id}&mode=wrong` })
}

function goBanks(): void {
  uni.switchTab({ url: '/pages/banks/index' })
}
</script>

<style scoped lang="scss">
.head {
  margin-bottom: 24rpx;
}

.head-sub {
  display: block;
  margin-top: 6rpx;
}

.wrong-card {
  margin-bottom: 20rpx;
  padding: 28rpx;
}

.bank-name {
  font-size: 30rpx;
  font-weight: 600;
}

.bank-sub {
  display: block;
  margin-top: 4rpx;
}

.wrong-bar {
  height: 8rpx;
  margin-top: 20rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #fdecec;
}

.wrong-fill {
  height: 100%;
  border-radius: 999rpx;
  background: $danger;
}

.foot-note {
  display: block;
  margin-top: 40rpx;
  text-align: center;
  font-size: 22rpx;
  color: $text-light;
  line-height: 1.6;
}
</style>
