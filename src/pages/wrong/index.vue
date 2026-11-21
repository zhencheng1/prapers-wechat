<template>
  <view class="page">
    <StatusBar />

    <view class="head sticky-header" :style="{ top: statusTop + 'px' }">
      <view class="head-titles">
        <text class="page-title wrong-title">错题本</text>
        <text class="head-sub">{{ total }} 道待复习 · 答对 {{ masterStreak }} 次自动移出</text>
      </view>
    </view>

    <view class="filter-wrap">
      <view class="filter-chips">
        <view
          v-for="chip in chips"
          :key="chip.key"
          class="filter-chip press"
          :class="{ 'chip-active': filter === chip.key }"
          @tap="filter = chip.key"
        >
          <text class="chip-label">{{ chip.label }}</text>
          <text class="chip-count" :class="{ 'chip-count-active': filter === chip.key }">{{ chip.count }}</text>
        </view>
      </view>
    </view>

    <view class="wrong-list">
      <view class="section-head">
        <text class="section-title">{{ sectionTitle }}</text>
        <view class="list-all press" @tap="goBanks">
          <text class="list-all-text">全部题库</text>
          <text class="list-all-arrow">›</text>
        </view>
      </view>

      <template v-if="displayRows.length">
        <view
          v-for="(row, index) in displayRows"
          :key="row.meta.id"
          class="wrong-card press"
          @tap="practice(row.meta)"
        >
          <view class="item-top">
            <view class="item-tags">
              <text class="item-num">{{ (index + 1).toString().padStart(2, '0') }}</text>
              <text class="type-pill">{{ sourceLabel(row.meta.source) }}</text>
            </view>
            <text class="count-pill">{{ row.count }} 题待复习</text>
          </view>

          <text class="question line1">{{ row.meta.name }}</text>

          <view class="item-foot">
            <view class="item-meta">
              <text class="meta-text">{{ row.meta.questionCount }} 题 · 已掌握 {{ row.mastered }} 题</text>
            </view>
            <view class="redo">
              <text class="redo-text">重做</text>
              <text class="redo-arrow">↗</text>
            </view>
          </view>

          <view class="wrong-bar">
            <view class="wrong-fill" :style="{ width: row.percent + '%' }" />
          </view>
        </view>
      </template>

      <EmptyState
        v-else-if="!loading"
        :title="emptyTitle"
        :description="emptyDescription"
        icon="错"
      >
        <button class="btn btn-primary" @tap="goBanks">去刷题</button>
      </EmptyState>
      <LoadingState v-else text="正在读取错题…" />
    </view>

    <view class="tip-wrap">
      <view class="tip-banner">
        <view class="tip-icon"><text>i</text></view>
        <text class="tip-text">连续答对 {{ masterStreak }} 次的题目会自动移出错题本。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { BankMeta } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useSettingsStore } from '@/stores/settings'
import { countWrong, countMastered } from '@/services/bank'
import { sourceLabel } from '@/core/appInfo'
import { getStatusBarHeight } from '@/utils/statusBar'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import StatusBar from '@/components/StatusBar.vue'

const statusTop = getStatusBarHeight()

const appStore = useAppStore()
const bankStore = useBankStore()
const settings = useSettingsStore()

type Row = { meta: BankMeta; count: number; mastered: number; percent: number }
type FilterKey = 'all' | 'active' | 'mastered'

const rows = ref<Row[]>([])
const loading = ref(true)
const filter = ref<FilterKey>('all')
const masterStreak = computed(() => settings.settings.wrongMasterStreak)

const total = computed(() => rows.value.reduce((sum, row) => sum + row.count, 0))
const masteredTotal = computed(() =>
  rows.value.reduce((sum, row) => sum + row.mastered, 0),
)

const chips = computed(() => [
  { key: 'all' as FilterKey, label: '待复习题库', count: rows.value.length },
  { key: 'active' as FilterKey, label: '待复习题目', count: total.value },
  { key: 'mastered' as FilterKey, label: '已掌握', count: masteredTotal.value },
])

const displayRows = computed(() => {
  if (filter.value === 'mastered') return rows.value.filter((row) => row.mastered > 0)
  if (filter.value === 'active') return rows.value.filter((row) => row.count > 0)
  return rows.value
})

const sectionTitle = computed(() =>
  filter.value === 'mastered' ? '已掌握的题目' : '错题题库',
)
const emptyTitle = computed(() =>
  filter.value === 'mastered' ? '还没有已掌握的题目' : '错题本是空的',
)
const emptyDescription = computed(() =>
  filter.value === 'mastered'
    ? '连续答对的题目会标记为已掌握，并自动移出错题本。'
    : '答错的题会自动收进这里，连续答对后自动移出。',
)

onShow(async () => {
  loading.value = true
  try {
    await appStore.ensureReady()
    await bankStore.init()
    rows.value = bankStore.banks
      .map((meta) => {
        const count = countWrong(meta)
        const mastered = countMastered(meta)
        const percent = meta.questionCount
          ? Math.min(100, Math.round((count / meta.questionCount) * 100))
          : 0
        return { meta, count, mastered, percent }
      })
      .filter((row) => row.count > 0 || row.mastered > 0)
  } finally {
    loading.value = false
  }
})

function practice(meta: BankMeta): void {
  uni.navigateTo({ url: `/pages/quiz/index?bankId=${meta.id}&mode=wrong` })
}

function goBanks(): void {
  uni.switchTab({ url: '/pages/banks/index' })
}
</script>

<style scoped lang="scss">
.page {
  padding: 0 48rpx calc(48rpx + env(safe-area-inset-bottom));
}

.head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
}

.head-titles {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.wrong-title {
  font-size: 58rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.head-sub {
  color: $text-light;
  font-size: 21rpx;
  font-weight: 400;
}

.filter-wrap {
  margin-top: 36rpx;
}

.filter-chips {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 16rpx;
}

.filter-chip {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 26rpx;
  border: 1rpx solid $border;
  border-radius: 999rpx;
  background: $card;
}

.chip-active {
  border-color: $primary;
  background: $primary;
}

.chip-label {
  color: $text-sub;
  font-size: 22rpx;
  font-weight: 500;
}

.chip-active .chip-label {
  color: #f0ead9;
}

.chip-count {
  color: $text-light;
  font-family: $font-display;
  font-size: 22rpx;
  font-weight: 700;
}

.chip-count-active {
  color: #a9c0b2;
}

.wrong-list {
  margin-top: 32rpx;
}

.list-all {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 0 8rpx 16rpx;
}

.list-all-text {
  color: $text-sub;
  font-size: 21rpx;
}

.list-all-arrow {
  color: $text-light;
  font-size: 24rpx;
}

.wrong-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 20rpx;
  padding: 28rpx 30rpx;
  border: 1rpx solid $border;
  border-radius: 34rpx;
  background: $card;
}

.item-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.item-tags {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14rpx;
}

.item-num {
  color: $warning;
  font-family: $font-display;
  font-size: 20rpx;
  font-weight: 700;
}

.type-pill {
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  background: $sand;
  color: #8a6a46;
  font-size: 18rpx;
  font-weight: 600;
}

.count-pill {
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  background: $danger-soft;
  color: $danger;
  font-size: 18rpx;
  font-weight: 600;
}

.question {
  color: $text;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 1.5;
}

.item-foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.item-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.meta-text {
  color: $text-light;
  font-size: 19rpx;
}

.redo {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6rpx;
}

.redo-text {
  color: $primary;
  font-size: 21rpx;
  font-weight: 600;
}

.redo-arrow {
  color: $primary;
  font-size: 22rpx;
}

.wrong-bar {
  height: 4rpx;
  overflow: hidden;
  border-radius: 4rpx;
  background: #ede8dc;
}

.wrong-fill {
  height: 100%;
  border-radius: 4rpx;
  background: $danger;
}

.tip-wrap {
  margin-top: 36rpx;
}

.tip-banner {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx 28rpx;
  border-radius: 28rpx;
  background: $primary-soft;
}

.tip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border: 2rpx solid #3a5a4b;
  border-radius: 50%;
  color: #3a5a4b;
  font-family: $font-display;
  font-size: 20rpx;
  font-weight: 700;
}

.tip-text {
  color: #3a5a4b;
  font-size: 21rpx;
}
</style>
