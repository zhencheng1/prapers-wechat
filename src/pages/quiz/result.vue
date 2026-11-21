<template>
  <view v-if="result" class="page">
    <view class="card score-card">
      <text class="score-label">{{ result.mode === 'exam' ? '考试得分' : '本次正确率' }}</text>
      <view class="score-value">
        <text class="score-num">{{ scorePercent }}</text>
        <text class="score-unit">%</text>
      </view>
      <text class="score-sub">
        答对 {{ result.correct }} / {{ result.total }} 题 · 用时 {{ durationText }}
      </text>
      <view class="score-bar">
        <ProgressBar :value="scorePercent" :height="14" :color="scorePercent >= 60 ? '#22c55e' : '#ef4444'" />
      </view>
    </view>

    <view class="row stat-row">
      <StatTile label="已答" :value="result.answered" suffix="题" />
      <StatTile label="答对" :value="result.correct" suffix="题" />
      <StatTile label="错题" :value="result.wrong" suffix="题" />
      <StatTile label="总题量" :value="result.total" suffix="题" />
    </view>

    <view v-if="result.wrongNos.length" class="section">
      <SectionTitle title="需要复习的题目" />
      <view class="card wrong-card">
        <view class="wrong-grid">
          <text v-for="no in result.wrongNos" :key="no" class="wrong-no">{{ no }}</text>
        </view>
        <text class="small light wrong-note">题号对应该题库中的顺序编号</text>
      </view>
    </view>

    <view class="actions">
      <button v-if="result.wrongNos.length" class="btn btn-primary" @tap="practiceWrong">
        重练错题
      </button>
      <button class="btn btn-soft" @tap="goDetail">返回题库</button>
      <button class="btn btn-ghost" @tap="goHome">回到首页</button>
    </view>
  </view>

  <view v-else class="page">
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
import { formatDuration } from '@/utils'
import ProgressBar from '@/components/ProgressBar.vue'
import StatTile from '@/components/StatTile.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'

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
.score-card {
  padding: 40rpx 32rpx;
  text-align: center;
}

.score-label {
  font-size: 24rpx;
  color: $text-sub;
}

.score-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 12rpx 0;
  color: $primary;
}

.score-num {
  font-size: 96rpx;
  font-weight: 700;
  line-height: 1;
}

.score-unit {
  margin-left: 4rpx;
  font-size: 32rpx;
}

.score-sub {
  font-size: 24rpx;
  color: $text-sub;
}

.score-bar {
  margin-top: 24rpx;
}

.stat-row {
  justify-content: space-between;
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: $radius;
  background: $card;
}

.wrong-card {
  padding: 24rpx;
}

.wrong-grid {
  display: flex;
  flex-wrap: wrap;
}

.wrong-no {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 64rpx;
  margin: 6rpx;
  border-radius: 10rpx;
  background: $danger-soft;
  color: $danger;
  font-size: 24rpx;
}

.wrong-note {
  display: block;
  margin-top: 12rpx;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 40rpx;
}
</style>
