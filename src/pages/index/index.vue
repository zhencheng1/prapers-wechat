<template>
  <view class="page home">
    <StatusBar />

    <view class="home-header sticky-header" :style="{ top: statusTop + 'px' }">
      <text class="date-label">{{ dateLabel }}</text>
      <view class="title-row">
        <text class="page-title home-title">今天也要刷题</text>
      </view>
    </view>

    <view class="hero">
      <view class="hero-top">
        <text class="hero-eyebrow">今日目标</text>
        <view class="mode-pill"><text class="mode-text">本地模式</text></view>
      </view>

      <view class="hero-number-row">
        <text class="hero-number">{{ stats.today.answered }}</text>
        <text class="hero-goal">/ {{ settings.settings.dailyGoal }} 题</text>
      </view>

      <view class="hero-progress">
        <ProgressBar :value="goalPercent" :height="12" color="#E5D9B8" />
      </view>

      <view class="hero-stats">
        <StatTile label="正确率" :value="stats.todayAccuracy" suffix="%" />
        <view class="hero-divider" />
        <view class="stat-pad">
          <StatTile label="连续" :value="stats.streak" suffix="天" />
        </view>
        <view class="hero-divider" />
        <view class="stat-pad">
          <StatTile label="今日已答" :value="stats.today.answered" suffix="题" />
        </view>
      </view>
    </view>

    <view v-if="resume" class="resume-card press" @tap="continueStudy">
      <view class="row between">
        <view class="grow">
          <text class="resume-eyebrow">继续上次练习</text>
          <text class="resume-name line1">{{ resume.meta.name }}</text>
          <text class="resume-meta">
            {{ modeLabel(resume.session.mode) }} · 第
            {{ resume.session.index + 1 }} / {{ resume.session.order.length }} 题
          </text>
        </view>
        <text class="resume-arrow">›</text>
      </view>
    </view>

    <view class="quick-section">
      <view class="section-head"><text class="section-title">快捷入口</text></view>
      <view class="quick-row">
        <view class="quick-item press" @tap="goWrong">
          <view class="quick-icon icon-wrong"><text>错</text></view>
          <text class="quick-label">错题本</text>
          <text class="quick-sub">{{ wrongCount }} 题待复习</text>
        </view>
        <view class="quick-item press" @tap="goFavorite">
          <view class="quick-icon icon-fav"><text>藏</text></view>
          <text class="quick-label">收藏</text>
          <text class="quick-sub">随时回看</text>
        </view>
        <view class="quick-item press" @tap="goImport">
          <view class="quick-icon icon-import"><text>导</text></view>
          <text class="quick-label">导入题库</text>
          <text class="quick-sub">JSON / PDF</text>
        </view>
        <view class="quick-item press" @tap="randomStudy">
          <view class="quick-icon icon-random"><text>随</text></view>
          <text class="quick-label">随机练习</text>
          <text class="quick-sub">来 {{ randomCount }} 题</text>
        </view>
      </view>
    </view>

    <view v-if="backupReminder" class="backup-tip press" @tap="goBackup">
      <text class="small">数据只存在本机，建议现在导出备份</text>
      <text class="small bold">去备份 ›</text>
    </view>

    <view class="section recent-section">
      <SectionTitle title="最近题库">
        <text class="all-link" @tap="goBanks">全部 ›</text>
      </SectionTitle>

      <template v-if="recent.length">
        <view
          v-for="bank in recent"
          :key="bank.id"
          class="home-bank-card press"
          @tap="openBank(bank.id)"
        >
          <view class="bank-top">
            <text class="bank-name line1">{{ bank.name }}</text>
            <text class="sample-tag">{{ sourceLabel(bank.source) }}</text>
          </view>
          <text class="bank-desc line1">{{ bank.description || '暂无简介' }}</text>
          <view class="bank-track">
            <view class="bank-fill" :style="{ width: percentOf(bank) + '%' }" />
          </view>
          <view class="bank-foot">
            <text class="bank-meta">
              {{ bank.questionCount }} 题 · 已练 {{ Math.round(bank.questionCount * percentOf(bank) / 100) }} 题
            </text>
            <text class="continue-link">继续练习 ›</text>
          </view>
        </view>
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

    <view class="week-section">
      <view class="section-head">
        <text class="section-title">近 7 天</text>
        <text class="week-note">{{ activeDays }} / 7 天</text>
      </view>
      <view class="week-row">
        <view v-for="day in weekDays" :key="day.date" class="day">
          <view class="bar-wrap">
            <view
              class="bar"
              :class="{ 'bar-today': day.isToday, 'bar-empty': day.answered === 0 }"
              :style="{ height: day.height + 'rpx' }"
            />
          </view>
          <text class="day-label" :class="{ 'day-today': day.isToday }">{{ day.label }}</text>
        </view>
      </view>
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
import { sourceLabel } from '@/core/appInfo'
import { DEFAULT_RANDOM_COUNT } from '@/core/constants'
import { dateKey } from '@/utils'
import { getStatusBarHeight } from '@/utils/statusBar'
import StatTile from '@/components/StatTile.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import BankCard from '@/components/BankCard.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusBar from '@/components/StatusBar.vue'

const statusTop = getStatusBarHeight()

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

const randomCount = DEFAULT_RANDOM_COUNT

const weekDays = computed(() => {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const days = stats.last7
  const max = Math.max(1, ...days.map((day) => day.answered))
  const today = dateKey()
  return days.map((day) => {
    const date = new Date(`${day.date}T00:00:00`)
    return {
      date: day.date,
      label: weekdays[date.getDay()],
      answered: day.answered,
      isToday: day.date === today,
      height: Math.round(8 + (day.answered / max) * 40),
    }
  })
})

const activeDays = computed(
  () => weekDays.value.filter((day) => day.answered > 0).length,
)

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
.page {
  padding: 0 48rpx calc(48rpx + env(safe-area-inset-bottom));
}

.home-header {
  padding-top: 10rpx;
}

.date-label {
  display: block;
  color: $text-light;
  font-size: 22rpx;
  font-weight: 500;
  letter-spacing: 3rpx;
}

.title-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.home-title {
  font-size: 56rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.hero {
  margin-top: 32rpx;
  padding: 40rpx;
  border-radius: 44rpx;
  background-image: linear-gradient(-114deg, #2a5b49 12%, #173a2f 88%);
  background-size: 100% 100%;
}

.hero-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.hero-eyebrow {
  color: #b9cbbe;
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
}

.mode-pill {
  padding: 8rpx 18rpx;
  border: 1rpx solid rgba(207, 221, 210, 0.45);
  border-radius: 999rpx;
}

.mode-text {
  color: #cfddd2;
  font-size: 18rpx;
  font-weight: 400;
  letter-spacing: 1rpx;
}

.hero-number-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  margin-top: 30rpx;
}

.hero-number {
  color: #f5f0e2;
  font-family: $font-display;
  font-size: 104rpx;
  font-weight: 700;
  line-height: 1;
}

.hero-goal {
  margin-bottom: 24rpx;
  margin-left: 16rpx;
  color: #a9beb0;
  font-size: 25rpx;
  font-weight: 500;
}

.hero-progress {
  margin-top: 28rpx;
}

.hero-progress :deep(.progress-track) {
  background: #2f5a4a;
  border-radius: 6rpx;
}

.hero-progress :deep(.progress-fill) {
  border-radius: 6rpx;
}

.hero-stats {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 36rpx;
}

.hero-stats :deep(.stat-tile) {
  min-width: 0;
}

.stat-pad {
  padding: 0 28rpx;
}

.hero-stats :deep(.stat-value) {
  color: #f0ead9;
  font-size: 38rpx;
}

.hero-stats :deep(.stat-suffix) {
  margin-left: 4rpx;
  color: #a9beb0;
  font-size: 19rpx;
}

.hero-stats :deep(.stat-label) {
  margin-top: 4rpx;
  color: #a5b9ab;
  font-size: 20rpx;
}

.hero-divider {
  width: 1rpx;
  height: 60rpx;
  background: #375f50;
}

.resume-card {
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
  border-radius: $radius-sm;
  background: $primary-soft;
}

.resume-eyebrow {
  display: block;
  color: $text-sub;
  font-size: 20rpx;
  letter-spacing: 1rpx;
}

.resume-name {
  display: block;
  margin: 6rpx 0;
  color: $text;
  font-family: $font-display;
  font-size: 30rpx;
  font-weight: 600;
}

.resume-meta {
  display: block;
  color: $text-light;
  font-size: 20rpx;
}

.resume-arrow {
  margin-left: 16rpx;
  color: $primary;
  font-size: 40rpx;
  line-height: 1;
}

.quick-section {
  margin-top: 40rpx;
}

.quick-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92rpx;
  height: 92rpx;
  border-radius: 32rpx;
  font-family: $font-display;
  font-size: 36rpx;
  font-weight: 600;
}

.icon-wrong { background: #e6ede5; color: $primary; }
.icon-fav { background: #f1e7d3; color: $warning; }
.icon-import { background: #e3e9ee; color: #5a6e7a; }
.icon-random { background: #f6e5da; color: $warning; }

.quick-label {
  max-width: 100%;
  margin-top: 16rpx;
  color: $text;
  font-size: 22rpx;
  font-weight: 500;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-sub {
  max-width: 100%;
  margin-top: 4rpx;
  color: $text-light;
  font-size: 18rpx;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backup-tip {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: $radius-sm;
  background: $warning-soft;
  color: $warning;
}

.recent-section {
  margin-top: 40rpx;
}

.all-link {
  padding: 12rpx 0 12rpx 20rpx;
  color: $text-sub;
  font-size: 22rpx;
  font-weight: 400;
}

.home-bank-card {
  margin-bottom: 20rpx;
  padding: 36rpx;
  border: 1rpx solid $border;
  border-radius: 36rpx;
  background: $card;
}

.bank-top {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
}

.bank-name {
  flex: 1;
  margin-right: 20rpx;
  color: $text;
  font-family: $font-display;
  font-size: 32rpx;
  font-weight: 700;
}

.sample-tag {
  padding: 6rpx 14rpx;
  border-radius: 12rpx;
  background: $sand;
  color: $warning;
  font-size: 18rpx;
  font-weight: 600;
  line-height: 1.5;
}

.bank-desc {
  display: block;
  margin-top: 16rpx;
  color: $text-sub;
  font-size: 23rpx;
}

.bank-track {
  height: 8rpx;
  margin-top: 24rpx;
  overflow: hidden;
  border-radius: 4rpx;
  background: #ede8dc;
}

.bank-fill {
  height: 100%;
  border-radius: 4rpx;
  background: $primary;
}

.bank-foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 18rpx;
}

.bank-meta {
  color: $text-light;
  font-size: 21rpx;
}

.continue-link {
  color: $primary;
  font-size: 22rpx;
  font-weight: 600;
}

.week-section {
  margin-top: 28rpx;
}

.week-note {
  color: $text-sub;
  font-family: $font-display;
  font-size: 21rpx;
  font-weight: 600;
}

.week-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.bar-wrap {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  width: 44rpx;
  height: 48rpx;
}

.bar {
  width: 16rpx;
  border-radius: 8rpx;
  background: #b9c7b7;
  transition: height 0.2s ease;
}

.bar-empty {
  border-radius: 4rpx;
  background: #dcd5c6;
}

.bar-today {
  background: $primary;
}

.day-label {
  color: $text-light;
  font-size: 19rpx;
}

.day-today {
  color: $primary;
  font-weight: 700;
}
</style>
