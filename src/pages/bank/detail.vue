<template>
  <view v-if="bank" class="page">
    <StatusBar />
    <NavBar title="题库详情" />

    <view class="bank-header">
      <text class="bank-title">{{ bank.meta.name }}</text>
      <text class="bank-desc">{{ bank.meta.description || '暂无简介' }}</text>
      <view class="tag-row">
        <text class="tag tag-sand">{{ sourceLabel }}</text>
        <text class="tag tag-store">{{ storageLabel }} · {{ sizeLabel }}</text>
      </view>
    </view>

    <view class="stats-wrap">
      <view class="stats-card">
        <view class="stats-row">
          <view class="stat">
            <text class="stat-num">{{ bank.meta.questionCount }}</text>
            <text class="stat-cap">题目</text>
          </view>
          <view class="stat-div" />
          <view class="stat">
            <text class="stat-num">{{ percent }}%</text>
            <text class="stat-cap">已练</text>
          </view>
          <view class="stat-div" />
          <view class="stat">
            <text class="stat-num">{{ wrongCount }}</text>
            <text class="stat-cap">错题</text>
          </view>
          <view class="stat-div" />
          <view class="stat">
            <text class="stat-num">{{ favoriteCount }}</text>
            <text class="stat-cap">收藏</text>
          </view>
        </view>
        <view class="stats-progress-head">
          <text class="sp-left">已答 {{ bank.progress.seen.length }} 题</text>
          <text class="sp-right">还剩 {{ bank.meta.questionCount - bank.progress.seen.length }} 题</text>
        </view>
        <ProgressBar :value="percent" :height="8" />
      </view>
    </view>

    <view v-if="resumable" class="resume-bar press" @tap="resumeStudy">
      <view class="grow">
        <text class="resume-title">继续上次练习</text>
        <text class="resume-sub">
          {{ modeLabel(resumable.mode) }} · 第 {{ resumable.index + 1 }} / {{ resumable.order.length }} 题
        </text>
      </view>
      <text class="resume-arrow">›</text>
    </view>

    <view class="section modes-section">
      <SectionTitle title="开始练习" />
      <view class="mode-grid">
        <view class="mode-tile press" @tap="start('sequence')">
          <text class="mode-icon">▶</text>
          <view class="mode-text">
            <text class="mode-title">顺序练习</text>
            <text class="mode-sub">从上次位置继续</text>
          </view>
        </view>

        <view class="mode-tile press" @tap="start('random')">
          <text class="mode-icon">⇄</text>
          <view class="mode-text">
          <text class="mode-title">随机练习</text>
          <text class="mode-sub">随机抽 {{ randomCount }} 题</text>
          </view>
        </view>

        <view class="mode-tile press" @tap="goChapters">
          <text class="mode-icon">▤</text>
          <view class="mode-text">
            <text class="mode-title">章节练习</text>
            <text class="mode-sub">按章节分组</text>
          </view>
        </view>

        <view
          class="mode-tile press"
          :class="{ disabled: wrongCount === 0 }"
          @tap="start('wrong')"
        >
          <text class="mode-icon">↺</text>
          <view class="mode-text">
            <text class="mode-title">错题重练</text>
            <text class="mode-sub">{{ wrongCount }} 题待复习</text>
          </view>
        </view>

        <view
          class="mode-tile press"
          :class="{ disabled: favoriteCount === 0 }"
          @tap="start('favorite')"
        >
          <text class="mode-icon">▯</text>
          <view class="mode-text">
            <text class="mode-title">收藏练习</text>
            <text class="mode-sub">{{ favoriteCount }} 题已收藏</text>
          </view>
        </view>

        <view class="mode-tile press" @tap="start('exam')">
          <text class="mode-icon">◷</text>
          <view class="mode-text">
            <text class="mode-title">模拟考试</text>
            <text class="mode-sub">{{ examCountLabel }} 题 · {{ settings.settings.examDurationMin }} 分钟</text>
          </view>
        </view>
      </view>
    </view>

    <view class="browse-wrap">
      <view class="browse-card press" @tap="goQuestions">
        <view class="browse-text">
          <text class="browse-title">查看所有题目</text>
          <text class="browse-sub">按章节筛选 · 可隐藏答案自测</text>
        </view>
        <text class="chev">›</text>
      </view>
    </view>

    <view class="section manage-section">
      <SectionTitle title="题库管理" />
      <view class="manage-card">
        <view class="manage-row press" @tap="resetProgress">
          <view class="manage-left">
            <text class="manage-icon">↺</text>
            <text class="manage-text">重置练习进度</text>
          </view>
          <text class="chev">›</text>
        </view>
        <view class="manage-divider" />
        <view class="manage-row press" @tap="confirmDelete">
          <view class="manage-left">
            <text class="manage-icon danger">✕</text>
            <text class="manage-text danger-text">删除题库</text>
          </view>
          <text class="chev chev-danger">›</text>
        </view>
      </view>
    </view>

    <view class="spacer" />
    <text class="foot-note">{{ bank.meta.createdAt ? '导入于 ' + formatDateTime(bank.meta.createdAt) : '' }}</text>
  </view>

  <view v-else-if="loading" class="page">
    <StatusBar />
    <NavBar title="题库详情" />
    <LoadingState text="正在读取题库…" />
  </view>

  <view v-else class="page">
    <StatusBar />
    <NavBar title="题库详情" />
    <EmptyState
      title="题库不存在"
      description="它可能已被删除，或存储文件已丢失。"
      icon="!"
    >
      <button class="btn btn-primary" @tap="goBanks">返回题库</button>
    </EmptyState>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import type { BankBundle, QuizMode, SessionState } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useSettingsStore } from '@/stores/settings'
import { defaultProgress, clearSession, saveProgressNow } from '@/core/storage/records'
import { formatDateTime } from '@/utils'
import { DEFAULT_RANDOM_COUNT } from '@/core/constants'
import StatTile from '@/components/StatTile.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

const appStore = useAppStore()
const bankStore = useBankStore()
const settings = useSettingsStore()

const bankId = ref('')
const bank = ref<BankBundle | null>(null)
const loading = ref(true)
const randomCount = DEFAULT_RANDOM_COUNT

const percent = computed(() => {
  if (!bank.value?.meta.questionCount) return 0
  return Math.min(
    100,
    Math.round((bank.value.progress.seen.length / bank.value.meta.questionCount) * 100),
  )
})

const wrongCount = computed(
  () => bank.value?.wrong.filter((entry) => entry.masteredAt === null).length ?? 0,
)
const favoriteCount = computed(() => bank.value?.favorites.length ?? 0)
const examCountLabel = computed(() =>
  Math.min(settings.settings.examQuestionCount, bank.value?.meta.questionCount ?? 0),
)
const resumable = computed<SessionState | null>(() => {
  const session = bank.value?.session
  if (!session || session.finishedAt) return null
  return session
})

const sourceLabel = computed(() => {
  const source = bank.value?.meta.source
  const labels: Record<string, string> = {
    json: 'JSON 导入',
    pdf: 'PDF 导入',
    demo: '示例题库',
    manual: '手动创建',
  }
  return source ? labels[source] ?? '题库' : '题库'
})

const storageLabel = computed(() =>
  bank.value?.meta.storageMode === 'file' ? '文件存储' : '缓存存储',
)

const sizeLabel = computed(() => {
  const bytes = bank.value?.meta.sizeBytes ?? 0
  return bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`
})

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

onLoad((options: any) => {
  bankId.value = options?.id ?? ''
})

onShow(async () => {
  loading.value = true
  try {
    await appStore.ensureReady()
    await bankStore.init()
    if (!bankId.value) return
    bank.value = await bankStore.open(bankId.value)
  } finally {
    loading.value = false
  }
})

function start(mode: QuizMode): void {
  if (mode === 'wrong' && wrongCount.value === 0) {
    uni.showToast({ title: '错题本是空的', icon: 'none' })
    return
  }
  if (mode === 'favorite' && favoriteCount.value === 0) {
    uni.showToast({ title: '还没有收藏题目', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/quiz/index?bankId=${bankId.value}&mode=${mode}` })
}

function resumeStudy(): void {
  uni.navigateTo({ url: `/pages/quiz/index?bankId=${bankId.value}&mode=resume` })
}

function goChapters(): void {
  uni.navigateTo({ url: `/pages/chapter/index?id=${bankId.value}` })
}

function goQuestions(): void {
  uni.navigateTo({ url: `/pages/questions/index?id=${bankId.value}` })
}

function resetProgress(): void {
  if (!bank.value) return
  uni.showModal({
    title: '重置进度',
    content: '已答记录会清空，但错题和收藏保留。',
    success: (result) => {
      if (!result.confirm) return
      saveProgressNow(bankId.value, defaultProgress())
      clearSession(bankId.value)
      bank.value = null
      void bankStore.open(bankId.value).then((next) => {
        bank.value = next
      })
    },
  })
}

function confirmDelete(): void {
  if (!bank.value) return
  uni.showModal({
    title: '删除题库',
    content: `确定删除「${bank.value.meta.name}」吗？题目、进度、错题、收藏都会被删除。`,
    confirmText: '删除',
    confirmColor: '#ef4444',
    success: async (result) => {
      if (!result.confirm || !bank.value) return
      await bankStore.remove(bank.value.meta)
      uni.showToast({ title: '已删除', icon: 'none' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/banks/index' })
      }, 300)
    },
  })
}

function goBanks(): void {
  uni.switchTab({ url: '/pages/banks/index' })
}
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  padding: 0 48rpx calc(28rpx + env(safe-area-inset-bottom));
}

.bank-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20rpx;
  padding-top: 16rpx;
  flex-shrink: 0;
}

.bank-title {
  width: 100%;
  font-family: $font-display;
  font-size: 46rpx;
  font-weight: 700;
  line-height: 62rpx;
  color: $text;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.bank-desc {
  width: 100%;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 36rpx;
  color: $text-sub;
}

.tag-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.tag-sand {
  background: $sand;
  color: $warning;
  font-size: 19rpx;
  font-weight: 600;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

.tag-store {
  background: $primary-soft;
  color: $primary;
  font-size: 19rpx;
  font-weight: 500;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

.stats-wrap {
  padding-top: 32rpx;
  flex-shrink: 0;
}

.stats-card {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 32rpx;
  border-radius: 36rpx;
  border: 1rpx solid $border;
  background: $card;
}

.stats-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.stat {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stat-num {
  font-family: $font-display;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.2;
  color: $text;
}

.stat-cap {
  font-size: 19rpx;
  font-weight: 400;
  color: $text-light;
}

.stat-div {
  flex-shrink: 0;
  width: 1rpx;
  height: 52rpx;
  background: $border;
}

.stats-progress-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.sp-left {
  font-size: 20rpx;
  color: $text-sub;
}

.sp-right {
  font-size: 20rpx;
  color: $text-light;
}

.resume-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
  border-radius: 30rpx;
  background: $primary-soft;
  color: $primary;
  flex-shrink: 0;
}

.resume-title {
  font-size: 24rpx;
  font-weight: 600;
}

.resume-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 19rpx;
  color: $text-sub;
}

.resume-arrow {
  margin-left: 16rpx;
  font-size: 44rpx;
  line-height: 1;
}

.modes-section {
  margin-top: 36rpx;
  flex-shrink: 0;
}

.mode-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 0 -8rpx;
}

.mode-tile {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18rpx;
  width: calc(50% - 16rpx);
  margin: 8rpx;
  padding: 22rpx 24rpx;
  border-radius: 30rpx;
  border: 1rpx solid $border;
  background: $card;
}

.mode-icon {
  flex-shrink: 0;
  width: 34rpx;
  font-size: 32rpx;
  line-height: 34rpx;
  text-align: center;
  color: $primary;
}

.mode-text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 6rpx;
}

.mode-title {
  font-size: 24rpx;
  font-weight: 600;
  color: $text;
}

.mode-sub {
  font-size: 19rpx;
  font-weight: 400;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-tile.disabled .mode-icon,
.mode-tile.disabled .mode-sub {
  color: #c4beaf;
}

.mode-tile.disabled .mode-title {
  color: #b7b1a3;
}

.browse-wrap {
  padding-top: 36rpx;
  flex-shrink: 0;
}

.browse-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 26rpx 30rpx;
  border-radius: 30rpx;
  border: 1rpx solid $border;
  background: $card;
}

.browse-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.browse-title {
  font-size: 24rpx;
  font-weight: 600;
  color: $text;
}

.browse-sub {
  font-size: 19rpx;
  font-weight: 400;
  color: $text-light;
}

.chev {
  margin-left: 16rpx;
  font-size: 40rpx;
  line-height: 1;
  color: $text-light;
}

.manage-section {
  margin-top: 36rpx;
  flex-shrink: 0;
}

.manage-card {
  border-radius: 30rpx;
  border: 1rpx solid $border;
  background: $card;
  overflow: hidden;
}

.manage-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 30rpx;
}

.manage-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18rpx;
}

.manage-icon {
  font-size: 30rpx;
  line-height: 1;
  color: $text-sub;
}

.manage-icon.danger {
  color: $danger;
}

.manage-text {
  font-size: 24rpx;
  font-weight: 400;
  color: $text;
}

.danger-text {
  color: $danger;
}

.manage-divider {
  height: 1rpx;
  background: $border;
}

.chev-danger {
  color: #d3b3ac;
}

.spacer {
  flex: 1;
}

.foot-note {
  display: block;
  padding-top: 16rpx;
  text-align: center;
  font-size: 19rpx;
  color: $text-light;
}
</style>
