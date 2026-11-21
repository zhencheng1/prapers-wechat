<template>
  <view v-if="result" class="page">
    <StatusBar />
    <NavBar title="练习结果" />

    <view class="score-hero">
      <text class="hero-bank">
        {{ result.bankName }} · {{ { sequence: '顺序练习', random: '随机练习', chapter: '章节练习', wrong: '错题重练', favorite: '收藏练习', exam: '模拟考试' }[result.mode] }}
      </text>
      <view
        class="score-ring"
        :style="{ background: 'conic-gradient(#1F4A3C 0% ' + scorePercent + '%, #E8E2D4 ' + scorePercent + '% 100%)' }"
      >
        <view class="score-ring-inner">
          <text class="score-value">{{ scorePercent }}</text>
          <text class="score-label">正确率</text>
        </view>
      </view>
      <view class="hero-meta">
        <text class="pill pill-time">用时 {{ durationText }}</text>
        <text class="pill pill-mode">
          {{ { sequence: '顺序练习', random: '随机练习', chapter: '章节练习', wrong: '错题重练', favorite: '收藏练习', exam: '模拟考试' }[result.mode] }}
        </text>
        <text class="pill pill-date">{{ finishedDate }}</text>
      </view>
    </view>

    <view class="result-stats">
      <view class="stats-card">
        <view class="rstat">
          <view class="rstat-val">
            <text class="rnum">{{ result.answered }}</text>
            <text class="runit">题</text>
          </view>
          <text class="rlabel">已答</text>
        </view>
        <view class="rdiv" />
        <view class="rstat">
          <view class="rstat-val">
            <text class="rnum">{{ result.correct }}</text>
            <text class="runit">题</text>
          </view>
          <text class="rlabel">答对</text>
        </view>
        <view class="rdiv" />
        <view class="rstat">
          <view class="rstat-val">
            <text class="rnum rnum-warn">{{ result.wrong }}</text>
            <text class="runit">题</text>
          </view>
          <text class="rlabel">错题</text>
        </view>
        <view class="rdiv" />
        <view class="rstat">
          <view class="rstat-val">
            <text class="rnum">{{ result.total }}</text>
            <text class="runit">题</text>
          </view>
          <text class="rlabel">总题量</text>
        </view>
      </view>
    </view>

    <view v-if="result.wrongNos.length" class="review-section">
      <text class="review-title">需要复习的题目</text>
      <view class="review-card">
        <view class="review-head">
          <text class="review-note">答错的题已自动收进错题本</text>
          <text class="review-count">{{ result.wrongNos.length }} 题</text>
        </view>
        <scroll-view scroll-y class="review-scroll">
          <view v-for="(no, i) in result.wrongNos" :key="no" class="review-item">
            <view v-if="i > 0" class="review-divider" />
            <view class="review-row">
              <view class="review-badge"><text>#{{ no }}</text></view>
              <text class="review-text">第 {{ no }} 题</text>
              <text class="chev">›</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="spacer" />

    <view class="action-area">
      <view v-if="result.wrongNos.length" class="retry-btn press" @tap="practiceWrong">
        <text class="retry-icon">↺</text>
        <text>重练这 {{ result.wrongNos.length }} 道错题</text>
      </view>
      <view class="secondary-row">
        <view class="secondary-btn press" @tap="goDetail"><text>返回题库</text></view>
        <view class="secondary-btn press" @tap="goHome"><text>回到首页</text></view>
      </view>
      <view class="indicator-wrap">
        <view class="home-indicator" />
      </view>
    </view>
  </view>

  <view v-else class="page">
    <StatusBar />
    <NavBar title="练习结果" />
    <EmptyState
      title="没有练习结果"
      description="结果页只展示刚刚完成的练习，返回题库重新开始吧。"
      icon="!"
    >
      <button class="btn btn-primary" @tap="goHome">回到首页</button>
    </EmptyState>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { useQuizStore } from '@/stores/quiz'
import { formatDuration, formatShortDate } from '@/utils'
import ProgressBar from '@/components/ProgressBar.vue'
import StatTile from '@/components/StatTile.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

const quizStore = useQuizStore()
const result = computed(() => quizStore.lastResult)
const scorePercent = computed(() => {
  if (!result.value || result.value.total === 0) return 0
  if (result.value.score !== null) return result.value.score
  return Math.round((result.value.correct / result.value.total) * 100)
})
const durationText = computed(() =>
  formatDuration(result.value?.durationMs ?? 0),
)
const finishedDate = computed(() =>
  result.value ? formatShortDate(result.value.finishedAt) : '',
)

function practiceWrong(): void {
  if (!result.value) return
  uni.redirectTo({
    url: `/pages/quiz/index?bankId=${result.value.bankId}&mode=wrong`,
  })
}

function goDetail(): void {
  if (!result.value) return
  uni.redirectTo({ url: `/pages/bank/detail?id=${result.value.bankId}` })
}

function goHome(): void {
  uni.switchTab({ url: '/pages/index/index' })
}

onUnload(() => {
  // lastResult is kept so the result page can be re-rendered after a redirect,
  // but the next session start clears it.
})
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 48rpx;
}

.score-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28rpx;
  padding-top: 24rpx;
  flex-shrink: 0;
}

.hero-bank {
  font-size: 21rpx;
  font-weight: 400;
  color: $text-sub;
}

.score-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 344rpx;
  height: 344rpx;
  border-radius: 50%;
}

.score-ring-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  width: 308rpx;
  height: 308rpx;
  border-radius: 50%;
  background: $bg;
}

.score-value {
  font-family: $font-display;
  font-size: 92rpx;
  font-weight: 700;
  line-height: 92rpx;
  color: $text;
}

.score-label {
  font-size: 20rpx;
  font-weight: 400;
  letter-spacing: 3rpx;
  color: $text-light;
}

.hero-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16rpx;
}

.pill {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1.5;
}

.pill-time {
  background: $cream;
  color: $text-sub;
}

.pill-mode {
  background: $primary-soft;
  color: $primary-deep;
}

.pill-date {
  border: 1rpx solid $border;
  background: $card;
  color: $text-light;
}

.result-stats {
  padding-top: 36rpx;
  flex-shrink: 0;
}

.stats-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 30rpx 20rpx;
  border-radius: 36rpx;
  border: 1rpx solid $border;
  background: $card;
}

.rstat {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.rstat-val {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 6rpx;
}

.rnum {
  font-family: $font-display;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 40rpx;
  color: $text;
}

.rnum-warn {
  color: $warning;
}

.runit {
  font-size: 18rpx;
  font-weight: 400;
  color: $text-light;
}

.rlabel {
  font-size: 19rpx;
  font-weight: 400;
  color: $text-sub;
}

.rdiv {
  flex-shrink: 0;
  width: 1rpx;
  height: 60rpx;
  background: $border;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 36rpx;
  flex-shrink: 0;
}

.review-title {
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
  color: $text-light;
}

.review-card {
  border-radius: 32rpx;
  border: 1rpx solid $border;
  background: $card;
  overflow: hidden;
}

.review-scroll {
  max-height: 420rpx;
}

.review-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx 16rpx;
}

.review-note {
  font-size: 19rpx;
  font-weight: 400;
  color: $text-light;
}

.review-count {
  font-family: $font-display;
  font-size: 21rpx;
  font-weight: 600;
  color: $warning;
}

.review-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 22rpx;
  padding: 22rpx 30rpx;
}

.review-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  background: $warning-soft;
  font-size: 20rpx;
  font-weight: 600;
  color: $warning;
}

.review-text {
  flex: 1;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 32rpx;
  color: $text;
}

.chev {
  font-size: 30rpx;
  line-height: 1;
  color: $text-light;
}

.review-divider {
  height: 1rpx;
  background: $border;
}

.spacer {
  flex: 1;
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 28rpx 0 calc(28rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.retry-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  width: 100%;
  height: 92rpx;
  border-radius: 28rpx;
  background: $primary;
  font-size: 25rpx;
  font-weight: 600;
  color: $cream;
}

.retry-icon {
  font-size: 32rpx;
  line-height: 1;
  color: $cream;
}

.secondary-row {
  display: flex;
  flex-direction: row;
  gap: 18rpx;
}

.secondary-btn {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 84rpx;
  border-radius: 26rpx;
  border: 1rpx solid $border;
  background: $card;
  font-size: 24rpx;
  font-weight: 500;
  color: $text-sub;
}

.indicator-wrap {
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.home-indicator {
  width: 260rpx;
  height: 10rpx;
  border-radius: 6rpx;
  background: #d8d2c4;
}
</style>
