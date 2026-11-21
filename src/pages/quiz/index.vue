<template>
  <view v-if="loading" class="page">
    <view class="loading-box">
      <text class="muted">正在加载题目…</text>
    </view>
  </view>

  <view v-else-if="errorMessage" class="page">
    <EmptyState title="无法开始练习" :description="errorMessage" icon="!">
      <button class="btn btn-primary" @tap="goBackToBank">返回题库</button>
    </EmptyState>
  </view>

  <view v-else-if="q && session" class="page quiz-page">
    <view class="topbar row between">
      <view class="top-mid">
        <text class="small bold line1">{{ quizStore.meta?.name }}</text>
        <text class="small light">{{ positionText }}</text>
      </view>
      <text
        class="favorite"
        :class="{ active: quizStore.favoriteActive }"
        @tap="quizStore.toggleFavoriteCurrent()"
      >
        {{ quizStore.favoriteActive ? '★' : '☆' }}
      </text>
    </view>

    <view class="progress-row">
      <ProgressBar :value="quizStore.progressPercent" :height="10" />
    </view>

    <view v-if="quizStore.isExam" class="exam-bar row between">
      <text class="small">模拟考试 · 交卷后统一判分</text>
      <text class="exam-time">{{ timerText }}</text>
    </view>

    <scroll-view scroll-y class="quiz-scroll">
      <view class="card question-card">
        <view class="row between q-meta">
          <text class="tag">{{ typeLabel }}</text>
          <text class="small light">第 {{ index + 1 }} 题</text>
        </view>
        <text class="stem">{{ q.stem }}</text>
      </view>

      <view class="options">
        <OptionRow
          v-for="option in q.options"
          :key="option.key"
          :option="option"
          :type="q.type"
          :selected="quizStore.picked.includes(option.key)"
          :submitted="submitted"
          :correct-keys="q.answer"
          :picked="quizStore.picked"
          @select="quizStore.select"
        />
      </view>

      <view v-if="q.type === 'multiple' && !submitted && !quizStore.isExam" class="submit-row">
        <button
          class="btn btn-primary"
          :disabled="!quizStore.picked.length"
          @tap="quizStore.submit()"
        >
          确认答案
        </button>
      </view>

      <view
        v-if="submitted"
        class="feedback card"
        :class="quizStore.feedback === 'correct' ? 'ok' : 'bad'"
      >
        <view class="row between">
          <text class="feedback-title">
            {{ quizStore.feedback === 'correct' ? '回答正确' : '回答错误' }}
          </text>
          <text class="small muted">正确答案：{{ answerText }}</text>
        </view>
        <view v-if="showAnalysis" class="analysis">
          <text class="analysis-label">解析</text>
          <text class="analysis-text">{{ q.analysis || '暂无解析' }}</text>
        </view>
      </view>

      <view v-if="quizStore.isExam" class="exam-hint">
        <text class="small light">已选答案可以修改，交卷后统一判分。</text>
      </view>

      <view class="bottom-space" />
    </scroll-view>

    <view class="bottom-bar row">
      <button
        class="btn btn-ghost bottom-btn"
        :disabled="index === 0"
        @tap="quizStore.prev()"
      >
        上一题
      </button>
      <button class="btn btn-soft bottom-btn" @tap="sheetVisible = true">答题卡</button>
      <button v-if="quizStore.isExam" class="btn btn-primary bottom-btn" @tap="confirmSubmitExam">
        交卷
      </button>
      <button v-else class="btn btn-primary bottom-btn" @tap="goNext">
        {{ quizStore.isLast ? '完成' : '下一题' }}
      </button>
    </view>

    <AnswerSheet
      v-if="sheetVisible"
      :order="session.order"
      :current-index="session.index"
      :answers="session.answers"
      @close="sheetVisible = false"
      @jump="jumpTo"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import type { QuizMode } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useQuizStore } from '@/stores/quiz'
import { useSettingsStore } from '@/stores/settings'
import { flushAll } from '@/core/storage/persist'
import { formatDuration } from '@/utils'
import ProgressBar from '@/components/ProgressBar.vue'
import OptionRow from '@/components/OptionRow.vue'
import AnswerSheet from '@/components/AnswerSheet.vue'
import EmptyState from '@/components/EmptyState.vue'

const appStore = useAppStore()
const bankStore = useBankStore()
const quizStore = useQuizStore()
const settings = useSettingsStore()

const loading = ref(true)
const errorMessage = ref('')
const sheetVisible = ref(false)
const timerText = ref('')
const bankId = ref('')
const mode = ref<QuizMode | 'resume'>('sequence')

let timer: ReturnType<typeof setInterval> | null = null

const q = computed(() => quizStore.question)
const session = computed(() => quizStore.session)
const index = computed(() => session.value?.index ?? 0)
const positionText = computed(() => {
  if (!session.value) return ''
  return `${session.value.index + 1} / ${session.value.order.length}`
})
const typeLabel = computed(() => {
  const labels: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
  }
  return labels[q.value?.type ?? ''] ?? '题目'
})
const submitted = computed(
  () => quizStore.feedback !== 'none' && !quizStore.isExam,
)
const answerText = computed(() => (q.value?.answer ?? []).join(''))
const showAnalysis = computed(() => {
  if (!q.value || quizStore.feedback === 'none') return false
  const modeValue = settings.settings.showAnalysis
  return modeValue === 'always' || (modeValue === 'wrong' && quizStore.feedback === 'wrong')
})

function stopTimer(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function updateTimer(): void {
  const exam = quizStore.session?.exam
  if (!exam) return
  const left = Math.max(0, exam.endsAt - Date.now())
  timerText.value = formatDuration(left)
  if (left <= 0) {
    stopTimer()
    void submitExam()
  }
}

function startTimer(): void {
  stopTimer()
  updateTimer()
  if (quizStore.session?.exam && !quizStore.session.exam.submittedAt) {
    timer = setInterval(updateTimer, 1000)
  }
}

async function submitExam(): Promise<void> {
  const result = await quizStore.submitExam()
  if (result) {
    uni.redirectTo({ url: '/pages/quiz/result' })
  }
}

function confirmSubmitExam(): void {
  uni.showModal({
    title: '交卷',
    content: '交卷后不能再修改答案，确定交卷吗？',
    success: (result) => {
      if (result.confirm) void submitExam()
    },
  })
}

async function goNext(): Promise<void> {
  await quizStore.next()
  if (quizStore.lastResult) {
    uni.redirectTo({ url: '/pages/quiz/result' })
  }
}

async function jumpTo(target: number): Promise<void> {
  sheetVisible.value = false
  await quizStore.jump(target)
}

function goBackToBank(): void {
  if (bankId.value) {
    uni.redirectTo({ url: `/pages/bank/detail?id=${bankId.value}` })
  } else {
    uni.switchTab({ url: '/pages/banks/index' })
  }
}

onLoad(async (options: any) => {
  bankId.value = options?.bankId ?? ''
  const requested = (options?.mode ?? 'sequence') as QuizMode | 'resume'
  mode.value = requested
  await appStore.ensureReady()
  await bankStore.init()

  try {
    const bundle = await bankStore.open(bankId.value)
    if (!bundle) throw new Error('题库不存在，或本地文件已丢失')

    if (requested === 'resume') {
      const resumed = await quizStore.resume(bundle.meta, bundle)
      if (!resumed) throw new Error('没有可继续的练习')
    } else {
      await quizStore.start(bundle.meta, requested)
    }

    if (quizStore.isExam) startTimer()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载失败'
  } finally {
    loading.value = false
  }
})

onShow(() => {
  if (loading.value || !quizStore.isExam) return
  startTimer()
  const exam = quizStore.session?.exam
  if (exam && !exam.submittedAt && exam.endsAt <= Date.now()) {
    void submitExam()
  }
})

onHide(() => {
  quizStore.stopAutoNext()
  quizStore.saveNow()
  flushAll()
  stopTimer()
})

onUnload(() => {
  quizStore.stopAutoNext()
  quizStore.saveNow()
  flushAll()
  stopTimer()
})
</script>

<style scoped lang="scss">
.quiz-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 24rpx;
  padding-bottom: 0;
}

.loading-box {
  padding: 200rpx 0;
  text-align: center;
}

.topbar {
  padding: 8rpx 4rpx 16rpx;
}

.top-mid {
  flex: 1;
  min-width: 0;
  padding: 0;
}

.top-mid text {
  display: block;
}

.top-mid .light {
  margin-top: 2rpx;
}

.favorite {
  width: 64rpx;
  text-align: right;
  font-size: 42rpx;
  color: $text-light;
}

.favorite.active {
  color: #f59e0b;
}

.progress-row {
  padding: 0 4rpx 16rpx;
}

.exam-bar {
  margin-bottom: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: $radius-sm;
  background: $warning-soft;
  color: #92400e;
}

.exam-time {
  font-size: 30rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.quiz-scroll {
  flex: 1;
  height: 0;
}

.question-card {
  padding: 30rpx;
}

.q-meta {
  margin-bottom: 18rpx;
}

.stem {
  display: block;
  font-size: 32rpx;
  line-height: 1.7;
  white-space: pre-wrap;
}

.options {
  margin-top: 24rpx;
}

.submit-row {
  padding: 8rpx 0 24rpx;
}

.feedback {
  margin-top: 12rpx;
  border-left: 8rpx solid $border;
}

.feedback.ok {
  border-left-color: $success;
}

.feedback.bad {
  border-left-color: $danger;
}

.feedback-title {
  font-size: 30rpx;
  font-weight: 600;
}

.feedback.ok .feedback-title {
  color: $success;
}

.feedback.bad .feedback-title {
  color: $danger;
}

.analysis {
  margin-top: 16rpx;
}

.analysis-label {
  display: block;
  margin-bottom: 6rpx;
  font-size: 22rpx;
  color: $text-sub;
}

.analysis-text {
  font-size: 26rpx;
  line-height: 1.7;
  color: $text;
  white-space: pre-wrap;
}

.exam-hint {
  padding: 24rpx 8rpx;
  text-align: center;
}

.bottom-space {
  height: 180rpx;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  gap: 16rpx;
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  background: $bg;
  box-shadow: 0 -4rpx 20rpx rgba(17, 24, 39, 0.05);
}

.bottom-btn {
  flex: 1;
  height: 80rpx;
  padding: 0 12rpx;
  font-size: 26rpx;
}
</style>
