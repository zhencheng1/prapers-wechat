<template>
  <view v-if="bank" class="page">
    <view class="card head-card">
      <view class="row between">
        <view class="grow">
          <text class="title line1">{{ bank.meta.name }}</text>
          <text class="small muted desc line1">{{ bank.meta.description || '暂无简介' }}</text>
        </view>
        <text class="tag">{{ sourceLabel }}</text>
      </view>

      <view class="row stats-row">
        <StatTile label="题目" :value="bank.meta.questionCount" suffix="题" />
        <StatTile label="已练" :value="percent" suffix="%" />
        <StatTile label="错题" :value="wrongCount" suffix="题" />
        <StatTile label="收藏" :value="favoriteCount" suffix="题" />
      </view>

      <ProgressBar :value="percent" />
      <view class="row between progress-foot">
        <text class="small muted">已答 {{ bank.progress.seen.length }} 题</text>
        <text class="small light">{{ storageLabel }} · {{ sizeLabel }}</text>
      </view>
    </view>

    <view v-if="resumable" class="resume-bar press" @tap="resumeStudy">
      <view class="grow">
        <text class="bold">继续上次练习</text>
        <text class="small light resume-sub">
          {{ modeLabel(resumable.mode) }} · 第 {{ resumable.index + 1 }} / {{ resumable.order.length }} 题
        </text>
      </view>
      <text class="resume-arrow">›</text>
    </view>

    <view class="section">
      <SectionTitle title="开始练习" />
      <view class="mode-grid">
        <view class="mode-card press" @tap="start('sequence')">
          <text class="mode-title">顺序练习</text>
          <text class="mode-sub">从上次位置继续</text>
        </view>
        <view class="mode-card press" @tap="start('random')">
          <text class="mode-title">随机练习</text>
          <text class="mode-sub">随机 20 题</text>
        </view>
        <view
          class="mode-card press"
          :class="{ disabled: wrongCount === 0 }"
          @tap="start('wrong')"
        >
          <text class="mode-title">错题重练</text>
          <text class="mode-sub">{{ wrongCount }} 题待复习</text>
        </view>
        <view
          class="mode-card press"
          :class="{ disabled: favoriteCount === 0 }"
          @tap="start('favorite')"
        >
          <text class="mode-title">收藏练习</text>
          <text class="mode-sub">{{ favoriteCount }} 题已收藏</text>
        </view>
        <view class="mode-card press" @tap="start('exam')">
          <text class="mode-title">模拟考试</text>
          <text class="mode-sub">{{ examCountLabel }} 题 · {{ settings.settings.examDurationMin }} 分钟</text>
        </view>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="题库管理" />
      <view class="manage card">
        <view class="manage-row press" @tap="resetProgress">
          <text>重置练习进度</text>
          <text class="light">›</text>
        </view>
        <view class="manage-row press" @tap="confirmDelete">
          <text class="danger-text">删除题库</text>
          <text class="light">›</text>
        </view>
      </view>
    </view>

    <text class="foot-note">{{ bank.meta.createdAt ? '导入于 ' + formatDateTime(bank.meta.createdAt) : '' }}</text>
  </view>

  <view v-else-if="!loading" class="page">
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
import StatTile from '@/components/StatTile.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'

const appStore = useAppStore()
const bankStore = useBankStore()
const settings = useSettingsStore()

const bankId = ref('')
const bank = ref<BankBundle | null>(null)
const loading = ref(true)

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
.head-card {
  padding: 32rpx;
}

.desc {
  display: block;
  margin-top: 8rpx;
}

.stats-row {
  justify-content: space-between;
  margin: 30rpx 0 20rpx;
}

.progress-foot {
  margin-top: 14rpx;
}

.resume-bar {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
  border-radius: $radius;
  background: $primary-soft;
  color: $primary;
}

.resume-sub {
  display: block;
  margin-top: 4rpx;
}

.resume-arrow {
  margin-left: 16rpx;
  font-size: 48rpx;
}

.mode-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8rpx;
}

.mode-card {
  display: flex;
  flex-direction: column;
  width: calc(50% - 16rpx);
  margin: 8rpx;
  padding: 24rpx;
  border-radius: $radius-sm;
  background: $card;
  box-shadow: 0 6rpx 20rpx rgba(17, 24, 39, 0.04);
}

.mode-card.disabled {
  opacity: 0.45;
}

.mode-title {
  font-size: 28rpx;
  font-weight: 600;
}

.mode-sub {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: $text-sub;
}

.manage {
  padding: 0 28rpx;
}

.manage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  border-bottom: 1rpx solid $border;
}

.manage-row:last-child {
  border-bottom: none;
}

.danger-text {
  color: $danger;
}

.foot-note {
  display: block;
  margin-top: 40rpx;
  text-align: center;
  font-size: 22rpx;
  color: $text-light;
}
</style>
