<template>
  <view class="page">
    <view class="card overview">
      <view class="row stat-row">
        <StatTile label="累计答题" :value="stats.total.answered" suffix="题" />
        <StatTile label="正确率" :value="stats.totalAccuracy" suffix="%" />
        <StatTile label="连续天数" :value="stats.streak" suffix="天" />
      </view>
      <view class="divider" />
      <view class="row between">
        <text class="small muted">学习天数</text>
        <text class="small bold">{{ stats.total.days }} 天</text>
      </view>
      <view class="row between overview-row">
        <text class="small muted">累计时长</text>
        <text class="small bold">{{ totalDuration }}</text>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="最近 7 天" />
      <view class="card chart-card">
        <view class="chart">
          <view v-for="day in stats.last7" :key="day.date" class="chart-col">
            <text class="chart-value">{{ day.answered }}</text>
            <view class="chart-bar-wrap">
              <view class="chart-bar" :style="{ height: barHeight(day.answered) + 'rpx' }" />
            </view>
            <text class="chart-label">{{ day.label }}</text>
          </view>
        </view>
        <text class="small light chart-note">柱高表示当天答题数</text>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="分库进度" />
      <view v-if="bankRows.length" class="card bank-list">
        <view v-for="row in bankRows" :key="row.meta.id" class="bank-row">
          <view class="row between">
            <text class="small bold line1">{{ row.meta.name }}</text>
            <text class="small muted">{{ row.percent }}%</text>
          </view>
          <ProgressBar :value="row.percent" :height="8" />
          <text class="small light bank-row-sub">
            {{ row.answered }} / {{ row.meta.questionCount }} 题 · 正确率 {{ row.accuracy }}%
          </text>
        </view>
      </view>
      <EmptyState v-else title="还没有题库数据" description="导入题库并开始练习后，这里会显示分库进度。" icon="图" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { BankMeta } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useStatsStore } from '@/stores/stats'
import { loadProgress } from '@/core/storage/records'
import { accuracy } from '@/core/stats'
import { formatDuration } from '@/utils'
import StatTile from '@/components/StatTile.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'

const appStore = useAppStore()
const bankStore = useBankStore()
const stats = useStatsStore()

const bankRows = ref<
  Array<{ meta: BankMeta; percent: number; answered: number; accuracy: number }>
>([])

const totalDuration = computed(() => formatDuration(stats.total.durationMs))
const maxAnswered = computed(() =>
  Math.max(1, ...stats.last7.map((day) => day.answered)),
)

function barHeight(value: number): number {
  if (!value) return 6
  return 12 + Math.round((value / maxAnswered.value) * 130)
}

onShow(async () => {
  await appStore.ensureReady()
  await bankStore.init()
  stats.reload()
  bankRows.value = bankStore.banks.map((meta) => {
    const progress = loadProgress(meta.id)
    const percent = meta.questionCount
      ? Math.min(100, Math.round((progress.seen.length / meta.questionCount) * 100))
      : 0
    return {
      meta,
      percent,
      answered: progress.answered,
      accuracy: accuracy(progress.answered, progress.correct),
    }
  })
})
</script>

<style scoped lang="scss">
.overview {
  padding: 32rpx;
}

.stat-row {
  justify-content: space-between;
}

.overview-row {
  margin-top: 10rpx;
}

.chart-card {
  padding: 28rpx;
}

.chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 230rpx;
  padding-top: 10rpx;
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.chart-value {
  margin-bottom: 8rpx;
  font-size: 20rpx;
  color: $text-sub;
}

.chart-bar-wrap {
  display: flex;
  align-items: flex-end;
  height: 150rpx;
}

.chart-bar {
  width: 28rpx;
  min-height: 6rpx;
  border-radius: 14rpx;
  background: $primary;
}

.chart-label {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: $text-light;
}

.chart-note {
  display: block;
  margin-top: 16rpx;
  text-align: center;
}

.bank-list {
  padding: 8rpx 24rpx;
}

.bank-row {
  padding: 20rpx 0;
  border-bottom: 1rpx solid $border;
}

.bank-row:last-child {
  border-bottom: none;
}

.bank-row-sub {
  display: block;
  margin-top: 8rpx;
}
</style>
