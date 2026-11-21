<template>
  <view class="page">
    <StatusBar />

    <NavBar title="学习统计" />

    <view class="head">
      <text class="head-eyebrow">{{ dateRangeText }} · 近 7 天</text>
      <text class="head-title">一点点，攒起来</text>
    </view>

    <view class="hero">
      <view class="hero-top">
        <text class="hero-label">累计答题</text>
        <view class="hero-pill"><text class="hero-pill-text">本机记录</text></view>
      </view>

      <view class="hero-big">
        <text class="hero-number">{{ stats.total.answered }}</text>
        <text class="hero-unit">题 · 今日 +{{ stats.today.answered }}</text>
      </view>

      <view class="hero-line" />

      <view class="hero-stats">
        <StatTile label="正确率" :value="stats.totalAccuracy" suffix="%" />
        <view class="hero-vdiv" />
        <StatTile label="连续天数" :value="stats.streak" suffix="天" />
        <view class="hero-vdiv" />
        <StatTile label="累计时长" :value="totalDuration" />
      </view>
      <text class="hero-days">累计学习 {{ stats.total.days }} 天</text>
    </view>

    <view class="section chart-section">
      <view class="section-head">
        <text class="section-title">最近 7 天</text>
        <text class="chart-note">本周 {{ stats.last7.reduce((sum, day) => sum + day.answered, 0) }} 题</text>
      </view>
      <view class="card chart-card">
        <view class="chart">
          <view v-for="(day, index) in stats.last7" :key="day.date" class="chart-col">
            <text class="chart-value">{{ day.answered }}</text>
            <view class="chart-bar-wrap">
              <view
                class="chart-bar"
                :class="{ 'chart-bar-last': index === stats.last7.length - 1 }"
                :style="{ height: barHeight(day.answered) + 'rpx' }"
              />
            </view>
            <text class="chart-label">{{ day.label }}</text>
          </view>
        </view>
        <view class="chart-foot">
          <text class="chart-foot-left">柱高表示当天答题数</text>
          <text class="chart-foot-right">最高 {{ maxAnswered }} 题</text>
        </view>
      </view>
    </view>

    <view class="section bank-section">
      <SectionTitle title="分库进度" />
      <view v-if="bankRows.length" class="card bank-list">
        <view v-for="row in bankRows" :key="row.meta.id" class="bank-row">
          <view class="row between">
            <text class="bank-name line1">{{ row.meta.name }}</text>
            <text class="bank-pct">{{ row.percent }}%</text>
          </view>
          <ProgressBar :value="row.percent" :height="8" />
          <text class="bank-row-sub">
            {{ row.answered }} / {{ row.meta.questionCount }} 题 · 正确率 {{ row.accuracy }}%
          </text>
        </view>
      </view>
      <LoadingState v-else-if="loading" text="正在统计…" />
      <EmptyState v-else title="还没有题库数据" description="导入题库并开始练习后，这里会显示分库进度。" icon="图" />
    </view>

    <button class="share-card press" open-type="share">
      <text class="share-card-glyph">⤴</text>
      <view class="share-card-texts">
        <text class="share-card-title">分享本周成果</text>
        <text class="share-card-sub">把坚持刷题的记录发给朋友</text>
      </view>
      <text class="share-card-arrow">›</text>
    </button>

    <text class="footer-note">统计只基于本机的答题记录</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
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
import LoadingState from '@/components/LoadingState.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

const appStore = useAppStore()
const bankStore = useBankStore()
const stats = useStatsStore()

onShareAppMessage(() => ({
  title: `我在刷题盒子已累计答题 ${stats.total.answered} 题`,
  path: '/pages/index/index',
}))

const bankRows = ref<
  Array<{ meta: BankMeta; percent: number; answered: number; accuracy: number }>
>([])
const loading = ref(true)

const dateRangeText = computed(() => {
  const days = stats.last7
  if (!days.length) return ''
  const first = days[0].date.slice(5).replace('-', '.')
  const last = days[days.length - 1].date.slice(5).replace('-', '.')
  return `${first} – ${last}`
})

const totalDuration = computed(() => formatDuration(stats.total.durationMs))
const maxAnswered = computed(() =>
  Math.max(1, ...stats.last7.map((day) => day.answered)),
)

function barHeight(value: number): number {
  if (!value) return 6
  return 12 + Math.round((value / maxAnswered.value) * 130)
}

onShow(async () => {
  loading.value = true
  try {
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
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.page {
  padding: 0 48rpx calc(48rpx + env(safe-area-inset-bottom));
}

/* 页头 */
.head {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding-top: 12rpx;
}

.head-eyebrow {
  font-size: 20rpx;
  color: $text-sub;
}

.head-title {
  font-family: $font-display;
  font-size: 46rpx;
  font-weight: 700;
  line-height: 60rpx;
  color: $text;
}

/* 分享入口放在内容区，避开右上角胶囊区 */
.share-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
  width: 100%;
  margin: 48rpx 0 0;
  padding: 28rpx 32rpx;
  border: 1rpx solid $border;
  border-radius: 32rpx;
  background: $card;
  text-align: left;
  line-height: 1.4;
}

.share-card::after {
  border: none;
}

.share-card-glyph {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  background: $primary-soft;
  font-size: 30rpx;
  color: $primary-deep;
}

.share-card-texts {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
}

.share-card-title {
  font-size: 26rpx;
  font-weight: 600;
  color: $text;
}

.share-card-sub {
  font-size: 20rpx;
  color: $text-light;
}

.share-card-arrow {
  font-size: 32rpx;
  color: $text-light;
}

/* 数据 Hero */
.hero {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  margin-top: 28rpx;
  padding: 36rpx;
  border-radius: 44rpx;
  background: linear-gradient(115deg, #2a5b49 11%, #173a2f 89%);
}

.hero-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.hero-label {
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
  color: #b9cbbe;
}

.hero-pill {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  border: 1rpx solid #4e7466;
}

.hero-pill-text {
  font-size: 18rpx;
  color: #cfddd2;
}

.hero-big {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 16rpx;
  margin-top: -6rpx;
  min-width: 0;
}

.hero-number {
  flex-shrink: 1;
  min-width: 0;
  font-family: $font-display;
  font-size: 96rpx;
  font-weight: 700;
  line-height: 92rpx;
  color: #f5f0e2;
}

.hero-unit {
  flex-shrink: 0;
  max-width: 55%;
  padding-bottom: 18rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #a9beb0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-line {
  height: 1rpx;
  background: #335a4a;
}

.hero-stats {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.hero-stats :deep(.stat-tile) {
  flex: 1;
  align-items: flex-start;
  min-width: 0;
  gap: 6rpx;
}

.hero-stats :deep(.stat-value) {
  font-size: 36rpx;
  color: $cream;
}

.hero-stats :deep(.stat-suffix) {
  margin-left: 2rpx;
  font-size: 20rpx;
  color: $cream;
}

.hero-stats :deep(.stat-label) {
  margin-top: 0;
  font-size: 20rpx;
  color: #a5b9ab;
}

.hero-vdiv {
  width: 1rpx;
  height: 56rpx;
  background: #375f50;
}

.hero-days {
  margin-top: -8rpx;
  font-size: 18rpx;
  color: #8fae9c;
}

/* 7 天图表 */
.chart-section {
  margin-top: 44rpx;
}

.chart-note {
  font-size: 22rpx;
  color: $text-sub;
}

.chart-card {
  padding: 32rpx;
  border-radius: 36rpx;
}

.chart {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8rpx;
}

.chart-col {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.chart-value {
  margin-bottom: 10rpx;
  font-size: 20rpx;
  color: $text-light;
}

.chart-bar-wrap {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  max-width: 52rpx;
  height: 150rpx;
}

.chart-bar {
  width: 50%;
  max-width: 26rpx;
  min-height: 6rpx;
  border-radius: 999rpx;
  background: #cbd8c6;
}

.chart-bar-last {
  background: $primary;
}

.chart-label {
  margin-top: 12rpx;
  font-size: 20rpx;
  color: $text-sub;
}

.chart-foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.chart-foot-left,
.chart-foot-right {
  font-size: 20rpx;
  color: $text-light;
}

.chart-foot-right {
  color: $text-sub;
}

/* 分库进度 */
.bank-section {
  margin-top: 44rpx;
}

.bank-list {
  padding: 8rpx 30rpx;
  border-radius: 32rpx;
}

.bank-row {
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border;
}

.bank-row:last-child {
  border-bottom: none;
}

.bank-name {
  font-family: $font-display;
  font-size: 26rpx;
  font-weight: 600;
  color: $text;
}

.bank-pct {
  font-family: $font-display;
  font-size: 34rpx;
  font-weight: 600;
  color: $text;
}

.bank-row-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 18rpx;
  color: $text-light;
}

.footer-note {
  display: block;
  margin-top: 72rpx;
  text-align: center;
  font-size: 20rpx;
  color: $text-light;
}
</style>
