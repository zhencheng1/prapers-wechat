<template>
  <view class="page">
    <StatusBar />
    <NavBar title="我的收藏" />

    <view class="head">
      <text class="head-eyebrow">收藏夹 · {{ total }} 道题</text>
      <text class="head-title">收藏的题，都会在这里</text>
    </view>

    <view v-if="rows.length" class="fav-list">
      <view
        v-for="row in rows"
        :key="row.meta.id"
        class="card fav-card press"
        @tap="practice(row.meta)"
      >
        <view class="fav-icon"><text class="fav-icon-text">★</text></view>
        <view class="grow fav-info">
          <text class="fav-name line1">{{ row.meta.name }}</text>
          <text class="fav-sub">收藏 {{ row.count }} 题</text>
        </view>
        <text class="chev">›</text>
      </view>
    </view>

    <view v-else-if="loading" class="empty-wrap">
      <LoadingState text="正在读取收藏…" />
    </view>

    <view v-else class="empty-wrap">
      <EmptyState
        title="还没有收藏"
        description="答题时点右上角的星标，就能把题目收进这里。"
        icon="☆"
      >
        <button class="btn btn-primary empty-cta" @tap="goBanks">
          <text class="empty-cta-label">去刷题</text>
          <text class="empty-cta-arrow">→</text>
        </button>
      </EmptyState>
    </view>

    <view class="how-section">
      <text class="how-label">收藏是怎么用的</text>
      <view class="card how-card">
        <view class="how-row">
          <view class="how-icon how-icon-star"><text class="how-glyph">☆</text></view>
          <view class="grow">
            <text class="how-title">答题页点右上角星标</text>
            <text class="how-sub">练习与详情页都能一键收藏</text>
          </view>
        </view>
        <view class="how-divider" />
        <view class="how-row">
          <view class="how-icon how-icon-view"><text class="how-glyph">▤</text></view>
          <view class="grow">
            <text class="how-title">在「我的 → 我的收藏」查看</text>
            <text class="how-sub">可按题库筛选，集中重练</text>
          </view>
        </view>
        <view class="how-divider" />
        <view class="how-row">
          <view class="how-icon how-icon-loop"><text class="how-glyph">⇄</text></view>
          <view class="grow">
            <text class="how-title">收藏练习只刷收藏题</text>
            <text class="how-sub">不影响题库总进度</text>
          </view>
        </view>
      </view>
    </view>

    <text class="footer-note">收藏只保存在本机，不会上传</text>
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
import LoadingState from '@/components/LoadingState.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

const appStore = useAppStore()
const bankStore = useBankStore()

const rows = ref<Array<{ meta: BankMeta; count: number }>>([])
const loading = ref(true)
const total = computed(() => rows.value.reduce((sum, row) => sum + row.count, 0))

onShow(async () => {
  loading.value = true
  try {
    await appStore.ensureReady()
    await bankStore.init()
    rows.value = bankStore.banks
      .map((meta) => ({ meta, count: countFavorites(meta) }))
      .filter((row) => row.count > 0)
  } finally {
    loading.value = false
  }
})

function practice(meta: BankMeta): void {
  uni.navigateTo({ url: `/pages/quiz/index?bankId=${meta.id}&mode=favorite` })
}

function goBanks(): void {
  uni.switchTab({ url: '/pages/banks/index' })
}
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
  font-size: 44rpx;
  font-weight: 700;
  line-height: 58rpx;
  color: $text;
}

/* 收藏列表 */
.fav-list {
  margin-top: 40rpx;
}

.fav-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
}

.fav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: $sand;
}

.fav-icon-text {
  color: $warning;
  font-size: 40rpx;
}

.fav-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.fav-name {
  font-family: $font-display;
  font-size: 30rpx;
  font-weight: 600;
  color: $text;
}

.fav-sub {
  font-size: 22rpx;
  color: $text-light;
}

.chev {
  margin-left: 8rpx;
  color: $text-light;
  font-size: 36rpx;
}

/* 空状态卡片 */
.empty-wrap {
  margin-top: 40rpx;
}

.empty-wrap :deep(.empty-state) {
  padding: 52rpx 44rpx 56rpx;
  border: 1rpx solid $border;
  border-radius: 40rpx;
  background: $card;
  gap: 24rpx;
}

.empty-wrap :deep(.empty-icon) {
  width: 124rpx;
  height: 124rpx;
  margin-bottom: 0;
  border-radius: 44rpx;
  background: $sand;
  color: $warning;
  font-size: 52rpx;
}

.empty-wrap :deep(.empty-title) {
  font-size: 32rpx;
}

.empty-wrap :deep(.empty-desc) {
  max-width: 100%;
  font-size: 20rpx;
  line-height: 32rpx;
  color: $text-light;
}

.empty-wrap :deep(.empty-action) {
  margin-top: 4rpx;
}

.empty-cta {
  display: inline-flex;
  width: auto;
  height: 84rpx;
  padding: 0 52rpx;
  border-radius: 26rpx;
  background: $primary;
  color: $cream;
  font-size: 24rpx;
  font-weight: 600;
  gap: 12rpx;
}

.empty-cta::after {
  border: none;
}

.empty-cta-arrow {
  font-size: 26rpx;
  color: $cream;
}

/* 使用说明 */
.how-section {
  margin-top: 36rpx;
}

.how-label {
  display: block;
  margin-bottom: 18rpx;
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
  color: $text-light;
}

.how-card {
  padding: 0 28rpx;
  border-radius: 32rpx;
}

.how-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 22rpx;
  padding: 22rpx 0;
}

.how-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 60rpx;
  height: 60rpx;
  border-radius: 18rpx;
}

.how-icon-star {
  background: $sand;
}

.how-icon-view {
  background: $primary-soft;
}

.how-icon-loop {
  background: #f6eddb;
}

.how-glyph {
  font-size: 30rpx;
}

.how-icon-star .how-glyph {
  color: $warning;
}

.how-icon-view .how-glyph {
  color: $primary;
}

.how-icon-loop .how-glyph {
  color: #9a7440;
}

.how-divider {
  height: 1rpx;
  background: $cream;
}

.how-title {
  display: block;
  font-size: 23rpx;
  font-weight: 500;
  color: $text;
}

.how-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 18rpx;
  color: $text-light;
}

.footer-note {
  display: block;
  margin-top: 64rpx;
  text-align: center;
  font-size: 20rpx;
  color: $text-light;
}
</style>
