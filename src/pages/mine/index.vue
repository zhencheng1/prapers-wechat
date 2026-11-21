<template>
  <view class="page">
    <StatusBar />

    <view class="page-head sticky-header" :style="{ top: statusTop + 'px' }">
      <text class="page-title mine-title">我的</text>
    </view>

    <view class="identity-wrap">
      <view class="identity-card">
        <view class="identity-top">
          <view class="avatar"><text class="avatar-text">盒</text></view>
          <view class="identity-texts grow">
            <text class="user-name">本机用户</text>
            <text class="user-note">数据只存本机 · 无需登录</text>
          </view>
          <view class="frontend-pill"><text class="frontend-text">纯前端</text></view>
        </view>

        <view class="identity-divider" />

        <view class="identity-stats">
          <view class="identity-stat">
            <text class="stat-value">{{ bankCount }}</text>
            <text class="stat-label">个题库</text>
          </view>
          <view class="stat-divider" />
          <view class="identity-stat">
            <text class="stat-value">{{ questionCount }}</text>
            <text class="stat-label">道题目</text>
          </view>
          <view class="stat-divider" />
          <view class="identity-stat">
            <text class="stat-value">{{ stats.total.answered }}</text>
            <text class="stat-label">已答</text>
          </view>
        </view>
      </view>
    </view>

    <view class="group-section">
      <view class="section-head"><text class="section-title">我的数据</text></view>
      <view class="group-card">
          <view class="link-row press" @tap="goFavorites">
          <text class="link-label">我的收藏</text>
          <view class="link-right">
            <text class="link-value">{{ favoriteCount }} 题</text>
            <text class="chev">›</text>
          </view>
        </view>
        <view class="row-divider" />
        <view class="link-row press" @tap="goStats">
          <text class="link-label">学习统计</text>
          <view class="link-right">
            <text class="link-value">已学 {{ stats.total.days }} 天</text>
            <text class="chev">›</text>
          </view>
        </view>
        <view class="row-divider" />
        <view class="link-row press" @tap="goBackup">
          <text class="link-label">备份与恢复</text>
          <view class="link-right">
            <text class="link-value">{{ backupText }}</text>
            <text class="chev">›</text>
          </view>
        </view>
      </view>
    </view>

    <view class="group-section">
      <view class="section-head"><text class="section-title">更多</text></view>
      <view class="group-card">
        <view class="link-row press" @tap="clearData">
          <text class="link-label link-danger">清理本地数据</text>
          <view class="link-right"><text class="chev">›</text></view>
        </view>
        <view class="row-divider" />
        <view class="link-row press" @tap="goSettings">
          <text class="link-label">设置</text>
          <view class="link-right"><text class="chev">›</text></view>
        </view>
        <view class="row-divider" />
        <view class="link-row press" @tap="goAbout">
          <text class="link-label">关于</text>
          <view class="link-right">
            <text class="link-value">{{ appVersion }}</text>
            <text class="chev">›</text>
          </view>
        </view>
      </view>
    </view>

    <view class="storage-wrap">
      <view class="storage-card">
        <view class="row between">
          <text class="storage-title">本地存储</text>
          <text class="storage-value">{{ storageReady ? storageText : '统计中…' }}</text>
        </view>
        <view class="storage-track">
          <view
            class="storage-fill"
            :style="{ width: (storageReady ? Math.min(100, storage.currentSize / Math.max(1, storage.limitSize) * 100) : 0) + '%' }"
          />
        </view>
        <text class="storage-note">清除缓存可能导致题库数据丢失，建议先导出备份。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useStatsStore } from '@/stores/stats'
import { storageInfo } from '@/core/storage/uni'
import { confirmAndClearAllData } from '@/services/localData'
import { countFavorites } from '@/services/bank'
import { APP_VERSION } from '@/core/appInfo'
import { formatRelativeTime } from '@/utils'
import { getStatusBarHeight } from '@/utils/statusBar'
import StatTile from '@/components/StatTile.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import StatusBar from '@/components/StatusBar.vue'

const statusTop = getStatusBarHeight()

const appStore = useAppStore()
const bankStore = useBankStore()
const stats = useStatsStore()

const storage = ref({ currentSize: 0, limitSize: 10240 })
const storageReady = ref(false)
const favoriteCount = ref(0)
const appVersion = APP_VERSION

const bankCount = computed(() => bankStore.banks.length)
const questionCount = computed(() =>
  bankStore.banks.reduce((total, bank) => total + bank.questionCount, 0),
)
const storageText = computed(
  () => `${(storage.value.currentSize / 1024).toFixed(1)} MB / ${(storage.value.limitSize / 1024).toFixed(0)} MB`,
)
const backupText = computed(() =>
  formatRelativeTime(appStore.meta.lastBackupAt),
)

onShow(async () => {
  await appStore.ensureReady()
  await bankStore.refresh()
  stats.reload()
  storage.value = storageInfo()
  storageReady.value = true
  favoriteCount.value = bankStore.banks.reduce(
    (total, bank) => total + countFavorites(bank),
    0,
  )
})

function goFavorites(): void {
  uni.navigateTo({ url: '/pages/favorite/index' })
}

function goStats(): void {
  uni.navigateTo({ url: '/pages/stats/index' })
}

function goBackup(): void {
  uni.navigateTo({ url: '/pages/backup/index' })
}

function goSettings(): void {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function clearData(): void {
  confirmAndClearAllData()
}

function goAbout(): void {
  uni.navigateTo({ url: '/pages/about/index' })
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
  background: $bg;
}

.mine-title {
  font-size: 58rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.identity-wrap {
  margin-top: 32rpx;
}

.identity-card {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding: 36rpx;
  border-radius: 40rpx;
  background: $primary;
}

.identity-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 104rpx;
  height: 104rpx;
  border-radius: 34rpx;
  background: #ede4ce;
}

.avatar-text {
  color: $primary;
  font-family: $font-display;
  font-size: 44rpx;
  font-weight: 700;
}

.identity-texts {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.user-name {
  color: #f5f0e2;
  font-family: $font-display;
  font-size: 32rpx;
  font-weight: 700;
}

.user-note {
  color: #a9beb0;
  font-size: 20rpx;
}

.frontend-pill {
  padding: 6rpx 16rpx;
  border: 1rpx solid rgba(207, 221, 210, 0.45);
  border-radius: 999rpx;
}

.frontend-text {
  color: #cfddd2;
  font-size: 18rpx;
}

.identity-divider {
  height: 1rpx;
  background: #375f50;
}

.identity-stats {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.identity-stat {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stat-value {
  max-width: 100%;
  color: #f0ead9;
  font-family: $font-display;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-label {
  color: #a5b9ab;
  font-size: 19rpx;
}

.stat-divider {
  width: 1rpx;
  height: 52rpx;
  background: #375f50;
}

.group-section {
  margin-top: 36rpx;
}

.group-card {
  overflow: hidden;
  border: 1rpx solid $border;
  border-radius: 32rpx;
  background: $card;
}

.link-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  padding: 26rpx 30rpx;
}

.link-label {
  color: $text;
  font-size: 25rpx;
  font-weight: 500;
}

.link-danger {
  color: $danger;
}

.link-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.link-value {
  color: $text-light;
  font-size: 20rpx;
}

.chev {
  color: $text-light;
  font-size: 28rpx;
}

.row-divider {
  height: 1rpx;
  margin: 0 30rpx;
  background: $border;
}

.storage-wrap {
  margin-top: 36rpx;
}

.storage-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 32rpx;
  border: 1rpx solid $border;
  border-radius: 32rpx;
  background: $card;
}

.storage-title {
  color: $text;
  font-size: 23rpx;
  font-weight: 600;
}

.storage-value {
  color: $text-sub;
  font-family: $font-display;
  font-size: 20rpx;
  font-weight: 600;
}

.storage-track {
  height: 8rpx;
  overflow: hidden;
  border-radius: 4rpx;
  background: #ede8dc;
}

.storage-fill {
  height: 100%;
  border-radius: 4rpx;
  background: $warning;
}

.storage-note {
  color: $text-light;
  font-size: 20rpx;
}
</style>
