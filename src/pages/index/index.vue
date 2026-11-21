<template>
  <view class="page home">
    <view class="hero">
      <view class="row between">
        <view>
          <text class="hello">今天也要刷题</text>
          <text class="date">{{ dateLabel }}</text>
        </view>
        <view class="badge">本地模式</view>
      </view>

      <view class="row stats-row">
        <StatTile label="今日答题" :value="stats.today.answered" suffix="题" />
        <StatTile label="正确率" :value="stats.todayAccuracy" suffix="%" />
        <StatTile label="连续天数" :value="stats.streak" suffix="天" />
      </view>

      <view class="goal">
        <view class="row between">
          <text class="small muted">今日目标 {{ stats.today.answered }} / {{ settings.settings.dailyGoal }}</text>
          <text class="small muted">{{ goalPercent }}%</text>
        </view>
        <ProgressBar :value="goalPercent" :height="10" />
      </view>
    </view>

    <view v-if="resume" class="card continue-card press" @tap="continueStudy">
      <view class="row between">
        <view class="grow">
          <text class="small muted">继续上次练习</text>
          <text class="continue-title line1">{{ resume.meta.name }}</text>
          <text class="small light">
            {{ modeLabel(resume.session.mode) }} · 第
            {{ resume.session.index + 1 }} / {{ resume.session.order.length }} 题
          </text>
        </view>
        <view class="continue-arrow">›</view>
      </view>
    </view>

    <view class="quick-grid">
      <view class="quick-item press" @tap="goWrong">
        <view class="quick-icon icon-wrong">错</view>
        <text class="quick-title">错题本</text>
        <text class="quick-sub">{{ wrongCount }} 题待复习</text>
      </view>
      <view class="quick-item press" @tap="goFavorite">
        <view class="quick-icon icon-fav">藏</view>
        <text class="quick-title">收藏</text>
        <text class="quick-sub">随时回看</text>
      </view>
      <view class="quick-item press" @tap="goImport">
        <view class="quick-icon icon-import">导</view>
        <text class="quick-title">导入题库</text>
        <text class="quick-sub">JSON / PDF</text>
      </view>
      <view class="quick-item press" @tap="randomStudy">
        <view class="quick-icon icon-random">随</view>
        <text class="quick-title">随机练习</text>
        <text class="quick-sub">来 20 题</text>
      </view>
    </view>

    <view v-if="backupReminder" class="backup-tip press" @tap="goBackup">
      <text class="small">数据只存在本机，建议现在导出备份</text>
      <text class="small bold">去备份 ›</text>
    </view>

    <view class="section">
      <SectionTitle title="最近题库">
        <text class="small muted" @tap="goBanks">全部 ›</text>
      </SectionTitle>

      <template v-if="recent.length">
        <BankCard
          v-for="bank in recent"
          :key="bank.id"
          :bank="bank"
          :percent="percentOf(bank)"
          @tap="openBank(bank.id)"
        />
      </template>
      <EmptyState
        v-else
        title="还没有题库"
        description="先导入一个 JSON 题库，或从示例题库开始。"
        icon="书"
      >
        <button class="btn btn-primary btn-small" @tap="goImport">导入题库</button>
      </EmptyState>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { BankMeta, QuizMode, SessionState } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useSettingsStore } from '@/stores/settings'
import { useStatsStore } from '@/stores/stats'
import { countWrong, findResumableSession } from '@/services/bank'
import { loadProgress } from '@/core/storage/records'
import { dateKey } from '@/utils'
import StatTile from '@/components/StatTile.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import BankCard from '@/components/BankCard.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'

const appStore = useAppStore()
const bankStore = useBankStore()
const stats = useStatsStore()
const settings = useSettingsStore()

const resume = ref<{ meta: BankMeta; session: SessionState } | null>(null)
const wrongCount = ref(0)

const recent = computed(() =>
  [...bankStore.banks]
    .sort((left, right) => right.lastOpenedAt - left.lastOpenedAt)
    .slice(0, 3),
)

const goalPercent = computed(() => {
  const goal = Math.max(1, settings.settings.dailyGoal)
  return Math.min(100, Math.round((stats.today.answered / goal) * 100))
})

const dateLabel = computed(() => {
  const date = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 · ${weekdays[date.getDay()]}`
})

const backupReminder = computed(() => {
  if (stats.total.answered < 100) return false
  if (!appStore.meta.lastBackupAt) return true
  return Date.now() - appStore.meta.lastBackupAt > 30 * 24 * 60 * 60 * 1000
})

function percentOf(bank: BankMeta): number {
  if (!bank.questionCount) return 0
  const progress = loadProgress(bank.id)
  return Math.min(100, Math.round((progress.seen.length / bank.questionCount) * 100))
}

function modeLabel(mode: QuizMode): string {
  const labels: Record<QuizMode, string> = {
    sequence: '顺序练习',
    random: '随机练习',
    chapter: '章节练习',
    wrong: '错题重练',
    favorite: '收藏练习',
    exam: '模拟考试',
  }
  return labels[mode] ?? '练习'
}

async function refresh(): Promise<void> {
  await appStore.ensureReady()
  await bankStore.refresh()
  stats.reload()
  resume.value = await findResumableSession()
  wrongCount.value = bankStore.banks.reduce(
    (total, bank) => total + countWrong(bank),
    0,
  )
}

onShow(() => {
  void refresh()
})

function continueStudy(): void {
  if (!resume.value) return
  uni.navigateTo({
    url: `/pages/quiz/index?bankId=${resume.value.meta.id}&mode=resume`,
  })
}

function openBank(id: string): void {
  uni.navigateTo({ url: `/pages/bank/detail?id=${id}` })
}

function goBanks(): void {
  uni.switchTab({ url: '/pages/banks/index' })
}

function goWrong(): void {
  uni.switchTab({ url: '/pages/wrong/index' })
}

function goFavorite(): void {
  uni.navigateTo({ url: '/pages/favorite/index' })
}

function goImport(): void {
  uni.navigateTo({ url: '/pages/import/index' })
}

function goBackup(): void {
  uni.navigateTo({ url: '/pages/backup/index' })
}

function randomStudy(): void {
  const banks = bankStore.banks
  if (!banks.length) {
    goImport()
    return
  }
  if (banks.length === 1) {
    uni.navigateTo({ url: `/pages/quiz/index?bankId=${banks[0].id}&mode=random` })
    return
  }
  uni.showToast({ title: '请先选择题库', icon: 'none' })
  goBanks()
}
</script>

<style scoped lang="scss">
.home {
  padding-top: 20rpx;
}

.hero {
  padding: 32rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #5b79ff 0%, #4f6ef7 55%, #6d5ef7 100%);
  color: #ffffff;
  box-shadow: 0 16rpx 40rpx rgba(79, 110, 247, 0.25);
}

.hello {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}

.date {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  opacity: 0.78;
}

.badge {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 20rpx;
}

.stats-row {
  justify-content: space-between;
  margin-top: 36rpx;
}

.stats-row :deep(.stat-value) {
  color: #ffffff;
}

.stats-row :deep(.stat-suffix),
.stats-row :deep(.stat-label) {
  color: rgba(255, 255, 255, 0.76);
}

.goal {
  margin-top: 28rpx;
}

.goal :deep(.progress-track) {
  margin-top: 10rpx;
  background: rgba(255, 255, 255, 0.25);
}

.goal :deep(.progress-fill) {
  background: #ffffff;
}

.continue-card {
  margin-top: 24rpx;
  padding: 28rpx;
}

.continue-title {
  display: block;
  margin: 6rpx 0;
  font-size: 32rpx;
  font-weight: 600;
}

.continue-arrow {
  margin-left: 16rpx;
  color: $primary;
  font-size: 48rpx;
  line-height: 1;
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  margin-top: 24rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  width: 50%;
  padding: 24rpx 20rpx 20rpx 0;
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin-bottom: 12rpx;
  border-radius: 22rpx;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
}

.icon-wrong {
  background: #ff8a8a;
}

.icon-fav {
  background: #ffb648;
}

.icon-import {
  background: #6ba8ff;
}

.icon-random {
  background: #72d4a8;
}

.quick-title {
  font-size: 28rpx;
  font-weight: 600;
}

.quick-sub {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: $text-sub;
}

.backup-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding: 22rpx 24rpx;
  border-radius: $radius-sm;
  background: $warning-soft;
  color: #92400e;
}

.section {
  margin-top: 8rpx;
}
</style>
