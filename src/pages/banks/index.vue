<template>
  <view class="page">
    <StatusBar />

    <view class="page-head sticky-header" :style="{ top: statusTop + 'px' }">
      <view class="head-titles">
        <text class="page-title banks-title">题库</text>
        <text class="head-sub">{{ bankStore.banks.length }} 个题库 · {{ totalQuestions }} 道题 · 本地保存</text>
      </view>
    </view>

    <view class="search-wrap">
      <view class="search-field">
        <view class="search-icon" />
        <input v-model="keyword" class="search-input" placeholder="搜索题库或题目" placeholder-class="search-ph" />
      </view>
    </view>

    <view class="library-section">
      <view class="section-head">
        <text class="section-title">我的题库</text>
        <text class="library-count">共 {{ filteredBanks.length }}</text>
      </view>

      <template v-if="filteredBanks.length">
        <view
          v-for="bank in filteredBanks"
          :key="bank.id"
          class="bank-card press"
          @tap="openBank(bank.id)"
        >
          <view class="card-top">
            <view class="cover"><text class="cover-glyph">题</text></view>
            <view class="card-titles grow">
              <text class="card-title line1">{{ bank.name }}</text>
              <view class="meta-row">
                <text class="meta-text">{{ sourceLabel(bank.source) }} · {{ bank.questionCount }} 道题</text>
              </view>
            </view>
          </view>

          <view class="progress-head">
            <text class="progress-label">已练 {{ Math.round(bank.questionCount * percentOf(bank) / 100) }} / {{ bank.questionCount }} 题</text>
            <text class="progress-value">{{ percentOf(bank) }}%</text>
          </view>
          <view class="card-track">
            <view class="card-fill" :style="{ width: percentOf(bank) + '%' }" />
          </view>

          <view class="card-actions">
            <view class="continue-btn">
              <text class="continue-label">继续练习</text>
              <text class="continue-arrow">→</text>
            </view>
            <view class="browse-btn">
              <view class="list-icon">
                <view class="list-line" />
                <view class="list-line" />
                <view class="list-line" />
              </view>
            </view>
          </view>
        </view>

        <view class="import-card press" @tap="goImport">
          <view class="import-icon-wrap"><text class="import-file">文</text></view>
          <view class="import-texts grow">
            <text class="import-title">导入新题库</text>
            <text class="import-desc">支持 JSON / PDF · 从聊天文件选择</text>
          </view>
          <text class="import-plus">＋</text>
        </view>
      </template>

      <EmptyState
        v-else-if="keyword.trim()"
        title="没有匹配的题库"
        description="换个关键词试试，或清空搜索框。"
        icon="搜"
      />
      <EmptyState
        v-else
        title="还没有题库"
        description="支持导入 quizbank/v1 格式的 JSON 文件，也可以先用内置示例题库体验。"
        icon="书"
      >
        <button class="btn btn-primary" @tap="goImport">导入题库</button>
      </EmptyState>
    </view>

    <view class="tips-section">
      <view class="section-head"><text class="section-title">导入提示</text></view>
      <view class="tips-card">
        <view class="step">
          <view class="step-num"><text>1</text></view>
          <text class="step-text">把 JSON 文件发送到微信「文件传输助手」</text>
        </view>
        <view class="step">
          <view class="step-num"><text>2</text></view>
          <text class="step-text">在小程序内选择该文件，确认导入</text>
        </view>
        <view class="step">
          <view class="step-num"><text>3</text></view>
          <text class="step-text">解析完成后自动生成可练习的题库</text>
        </view>
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
import { loadProgress } from '@/core/storage/records'
import { sourceLabel } from '@/core/appInfo'
import { getStatusBarHeight } from '@/utils/statusBar'
import BankCard from '@/components/BankCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusBar from '@/components/StatusBar.vue'

const statusTop = getStatusBarHeight()

const appStore = useAppStore()
const bankStore = useBankStore()
const keyword = ref('')

const filteredBanks = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return bankStore.banks
  return bankStore.banks.filter(
    (bank) =>
      bank.name.toLowerCase().includes(text) ||
      (bank.description || '').toLowerCase().includes(text),
  )
})

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
.page {
  padding: 0 48rpx calc(48rpx + env(safe-area-inset-bottom));
}

.page-head {
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

.banks-title {
  font-size: 58rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.head-sub {
  color: $text-light;
  font-size: 22rpx;
  font-weight: 400;
}

.search-wrap {
  margin-top: 36rpx;
}

.search-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18rpx;
  height: 92rpx;
  padding: 0 28rpx;
  border: 1rpx solid $border;
  border-radius: 28rpx;
  background: $card;
}

.search-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid $text-light;
  border-radius: 50%;
}

.search-icon::after {
  content: '';
  position: absolute;
  right: -10rpx;
  bottom: -6rpx;
  width: 14rpx;
  height: 3rpx;
  border-radius: 2rpx;
  background: $text-light;
  transform: rotate(45deg);
}

.search-input {
  flex: 1;
  height: 92rpx;
  color: $text;
  font-size: 24rpx;
}

.search-ph {
  color: $text-light;
  font-size: 24rpx;
}

.library-section {
  margin-top: 48rpx;
}

.library-count {
  color: $text-light;
  font-size: 21rpx;
  font-weight: 400;
}

.bank-card {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  margin-bottom: 24rpx;
  padding: 36rpx;
  border: 1rpx solid $border;
  border-radius: 40rpx;
  background: $card;
}

.card-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 108rpx;
  border-radius: 34rpx;
  background: $primary-soft;
}

.cover-glyph {
  color: $primary;
  font-family: $font-display;
  font-size: 44rpx;
  font-weight: 600;
}

.card-titles {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.card-title {
  color: $text;
  font-family: $font-display;
  font-size: 32rpx;
  font-weight: 700;
}

.meta-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.meta-text {
  color: $text-light;
  font-size: 21rpx;
}

.sample-tag {
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  background: $sand;
  color: $warning;
  font-size: 18rpx;
  font-weight: 600;
}

.progress-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.progress-label {
  min-width: 0;
  flex: 1;
  color: $text-sub;
  font-size: 21rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-value {
  flex-shrink: 0;
  color: $primary;
  font-family: $font-display;
  font-size: 24rpx;
  font-weight: 700;
}

.card-track {
  height: 10rpx;
  overflow: hidden;
  border-radius: 6rpx;
  background: #ede8dc;
}

.card-fill {
  height: 100%;
  border-radius: 6rpx;
  background: $primary;
}

.card-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.continue-btn {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: $primary;
}

.continue-label {
  color: #f0ead9;
  font-size: 24rpx;
  font-weight: 600;
}

.continue-arrow {
  color: #f0ead9;
  font-size: 26rpx;
}

.browse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  border: 1rpx solid $border;
  border-radius: 24rpx;
  background: $card;
}

.list-icon {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 28rpx;
  height: 26rpx;
}

.list-line {
  height: 3rpx;
  border-radius: 2rpx;
  background: $text-sub;
}

.import-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
  margin-top: 4rpx;
  padding: 32rpx;
  border: 3rpx solid $border;
  border-radius: 36rpx;
  background: transparent;
}

.import-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  border: 1rpx solid $border;
  border-radius: 26rpx;
  background: $card;
}

.import-file {
  color: $primary;
  font-family: $font-display;
  font-size: 36rpx;
}

.import-texts {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.import-title {
  color: $text;
  font-size: 25rpx;
  font-weight: 600;
}

.import-desc {
  color: $text-light;
  font-size: 20rpx;
}

.import-plus {
  color: $text-light;
  font-size: 40rpx;
}

.tips-section {
  margin-top: 52rpx;
}

.tips-card {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 36rpx;
  border: 1rpx solid $border;
  border-radius: 36rpx;
  background: $card;
}

.step {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: $sand;
  color: $warning;
  font-family: $font-display;
  font-size: 20rpx;
  font-weight: 700;
}

.step-text {
  color: $text-sub;
  font-size: 23rpx;
}
</style>
