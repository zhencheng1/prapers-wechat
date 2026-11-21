<template>
  <view class="page">
    <view class="row between head">
      <view>
        <text class="title">我的收藏</text>
        <text class="small muted head-sub">{{ total }} 道题</text>
      </view>
    </view>

    <template v-if="rows.length">
      <view
        v-for="row in rows"
        :key="row.meta.id"
        class="card favorite-card press"
        @tap="practice(row.meta)"
      >
        <view class="row between">
          <view class="grow">
            <text class="bank-name line1">{{ row.meta.name }}</text>
            <text class="small muted bank-sub">收藏 {{ row.count }} 题</text>
          </view>
          <text class="star">★</text>
        </view>
      </view>
    </template>

    <EmptyState
      v-else
      title="还没有收藏"
      description="答题时点右上角的星标，就能把题目收进这里。"
      icon="藏"
    >
      <button class="btn btn-primary" @tap="goBanks">去刷题</button>
    </EmptyState>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { BankMeta } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { countFavorites } from '@/services/bank'
import EmptyState from '@/components/EmptyState.vue'

const appStore = useAppStore()
const bankStore = useBankStore()

const rows = ref<Array<{ meta: BankMeta; count: number }>>([])
const total = computed(() => rows.value.reduce((sum, row) => sum + row.count, 0))

onShow(async () => {
  await appStore.ensureReady()
  await bankStore.init()
  rows.value = bankStore.banks
    .map((meta) => ({ meta, count: countFavorites(meta) }))
    .filter((row) => row.count > 0)
})

function practice(meta: BankMeta): void {
  uni.navigateTo({ url: `/pages/quiz/index?bankId=${meta.id}&mode=favorite` })
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

.favorite-card {
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

.star {
  color: #f59e0b;
  font-size: 40rpx;
}
</style>
