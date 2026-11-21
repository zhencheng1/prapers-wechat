<template>
  <view class="page">
    <view class="profile card">
      <view class="avatar">刷</view>
      <view class="grow">
        <text class="name">本地刷题用户</text>
        <text class="small muted">数据只在本机 · 无需登录</text>
      </view>
      <text class="tag">纯前端</text>
    </view>

    <view class="row quick-stats card">
      <StatTile label="题库" :value="bankCount" suffix="个" />
      <StatTile label="题目" :value="questionCount" suffix="题" />
      <StatTile label="已答" :value="stats.total.answered" suffix="题" />
    </view>

    <view class="section">
      <SectionTitle title="我的数据" />
      <view class="card group">
        <view class="link-row press" @tap="goFavorites">
          <view class="link-icon icon-fav">藏</view>
          <view class="grow">
            <text class="link-title">我的收藏</text>
            <text class="small muted">收藏的题目与练习入口</text>
          </view>
          <text class="chev">›</text>
        </view>
        <view class="link-row press" @tap="goStats">
          <view class="link-icon icon-stats">统</view>
          <view class="grow">
            <text class="link-title">学习统计</text>
            <text class="small muted">正确率、连续天数、分库进度</text>
          </view>
          <text class="chev">›</text>
        </view>
        <view class="link-row press" @tap="goBackup">
          <view class="link-icon icon-backup">备</view>
          <view class="grow">
            <text class="link-title">备份与恢复</text>
            <text class="small muted">换手机前记得导出</text>
          </view>
          <text class="chev">›</text>
        </view>
        <view class="link-row press" @tap="goSettings">
          <view class="link-icon icon-settings">设</view>
          <view class="grow">
            <text class="link-title">设置</text>
            <text class="small muted">解析、字号、错题规则</text>
          </view>
          <text class="chev">›</text>
        </view>
        <view class="link-row press" @tap="goAbout">
          <view class="link-icon icon-about">关</view>
          <view class="grow">
            <text class="link-title">关于</text>
            <text class="small muted">版本与免责声明</text>
          </view>
          <text class="chev">›</text>
        </view>
      </view>
    </view>

    <view class="card storage-card">
      <view class="row between">
        <text class="small bold">本地存储</text>
        <text class="small muted">{{ storageText }}</text>
      </view>
      <text class="small light storage-note">
        题目正文保存在本地文件目录，索引与记录保存在小程序缓存。清除小程序缓存可能导致数据丢失。
      </text>
    </view>

    <text class="version">刷题盒子 v1.0.0</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useStatsStore } from '@/stores/stats'
import { storageInfo } from '@/core/storage/uni'
import StatTile from '@/components/StatTile.vue'
import SectionTitle from '@/components/SectionTitle.vue'

const appStore = useAppStore()
const bankStore = useBankStore()
const stats = useStatsStore()

const storage = ref({ currentSize: 0, limitSize: 10240 })

const bankCount = computed(() => bankStore.banks.length)
const questionCount = computed(() =>
  bankStore.banks.reduce((total, bank) => total + bank.questionCount, 0),
)
const storageText = computed(
  () => `${(storage.value.currentSize / 1024).toFixed(1)} MB / ${(storage.value.limitSize / 1024).toFixed(0)} MB`,
)

onShow(async () => {
  await appStore.ensureReady()
  await bankStore.refresh()
  stats.reload()
  storage.value = storageInfo()
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

function goAbout(): void {
  uni.navigateTo({ url: '/pages/about/index' })
}
</script>

<style scoped lang="scss">
.profile {
  display: flex;
  align-items: center;
  padding: 32rpx;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  margin-right: 20rpx;
  border-radius: 48rpx;
  background: $primary-soft;
  color: $primary;
  font-size: 40rpx;
  font-weight: 700;
}

.name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}

.quick-stats {
  justify-content: space-between;
  margin-top: 20rpx;
  padding: 28rpx;
}

.group {
  padding: 0 24rpx;
}

.link-row {
  display: flex;
  align-items: center;
  min-height: 112rpx;
  border-bottom: 1rpx solid $border;
}

.link-row:last-child {
  border-bottom: none;
}

.link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  margin-right: 18rpx;
  border-radius: 20rpx;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 600;
}

.icon-fav {
  background: #ffb648;
}

.icon-stats {
  background: #6ba8ff;
}

.icon-backup {
  background: #72d4a8;
}

.icon-settings {
  background: #9b8cff;
}

.icon-about {
  background: #a8b0c0;
}

.link-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
}

.chev {
  color: $text-light;
  font-size: 32rpx;
}

.storage-card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.storage-note {
  display: block;
  margin-top: 8rpx;
  line-height: 1.6;
}

.version {
  display: block;
  margin-top: 40rpx;
  text-align: center;
  font-size: 22rpx;
  color: $text-light;
}
</style>
