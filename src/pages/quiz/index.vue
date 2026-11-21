<template>
  <view v-if="loading" class="page">
    <StatusBar />
    <NavBar title="练习" />
    <view class="loading-box">
      <text class="muted">正在加载题目…</text>
    </view>
  </view>

  <view v-else-if="errorMessage" class="page">
    <StatusBar />
    <NavBar title="练习" />
    <EmptyState title="无法开始练习" :description="errorMessage" icon="!">
      <button class="btn btn-primary" @tap="goBackToBank">返回题库</button>
    </EmptyState>
  </view>

  <view v-else-if="q && session" class="page quiz-page">
    <StatusBar />
    <NavBar title="练习" />

    <view class="progress-block">
      <view class="progress-head">
        <text class="bank-label">{{ quizStore.meta?.name }}</text>
        <view class="count">
          <text class="cur">{{ index + 1 }}</text>
          <text class="total">/ {{ session.order.length }}</text>
        </view>
      </view>
      <ProgressBar :value="quizStore.progressPercent" :height="8" />
    </view>

    <view v-if="quizStore.isExam" class="exam-bar row between">
      <text class="exam-hint-text">模拟考试 · 交卷后统一判分</text>
      <text class="exam-time">{{ timerText }}</text>
    </view>

    <scroll-view scroll-y class="quiz-scroll">
      <view class="question-card">
        <view class="q-meta">
          <text class="type-pill">{{ typeLabel }}</text>
          <text class="q-no">第 {{ index + 1 }} 题</text>
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
        class="feedback"
        :class="quizStore.feedback === 'correct' ? 'ok' : 'bad'"
      >
        <view class="feedback-head">
          <view class="feedback-left">
            <text class="feedback-icon">!</text>
            <text class="feedback-title">
              {{ quizStore.feedback === 'correct' ? '回答正确' : '回答错误' }}
            </text>
          </view>
          <text class="answer-hint">正确答案 {{ answerText }}</text>
        </view>
        <view v-if="showAnalysis" class="analysis-text">{{ q.analysis || '暂无解析' }}</view>
      </view>

      <view v-if="quizStore.isExam" class="exam-hint">
        <text class="small light">已选答案可以修改，交卷后统一判分。</text>
      </view>

      <view v-if="q.tags && q.tags.length" class="knowledge">
        <text class="knowledge-title">相关知识点</text>
        <view class="chips">
          <text v-for="tag in q.tags" :key="tag" class="chip">{{ tag }}</text>
        </view>
      </view>

      <view class="bottom-space" />
    </scroll-view>

    <view class="action-bar">
      <view class="action-row">
        <view class="sheet-btn press" @tap="sheetVisible = true">
          <text class="sheet-icon">▦</text>
        </view>
        <view
          class="fav-btn press"
          :class="{ active: quizStore.favoriteActive }"
          @tap="quizStore.toggleFavoriteCurrent()"
        >
          <text class="fav-glyph">{{ quizStore.favoriteActive ? '★' : '☆' }}</text>
        </view>
        <button
          class="act-btn act-prev"
          :disabled="index === 0"
          @tap="quizStore.prev()"
        >
          上一题
        </button>
        <button v-if="quizStore.isExam" class="act-btn act-next" @tap="confirmSubmitExam">
          交卷
        </button>
        <button v-else class="act-btn act-next" @tap="goNext">
          {{ quizStore.isLast ? '完成' : '下一题' }}
          <text class="next-arrow">→</text>
        </button>
      </view>
      <view class="indicator-wrap">
        <view class="home-indicator" />
      </view>
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
import { decodeQuery, formatDuration } from '@/utils'
import ProgressBar from '@/components/ProgressBar.vue'
import OptionRow from '@/components/OptionRow.vue'
import AnswerSheet from '@/components/AnswerSheet.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

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
const chapter = ref('')

let timer: ReturnType<typeof setInterval> | null = null

const q = computed(() => quizStore.question)
const session = computed(() => quizStore.session)
const index = computed(() => session.value?.index ?? 0)
const positionText = computed(() => {
  if (!session.value) return ''
  const position = `${session.value.index + 1} / ${session.value.order.length}`
  return chapter.value ? `${chapter.value} · ${position}` : position
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
  chapter.value = options?.chapter ? decodeQuery(String(options.chapter)) : ''
  await appStore.ensureReady()
  await bankStore.init()

  try {
    const bundle = await bankStore.open(bankId.value)
    if (!bundle) throw new Error('题库不存在，或本地文件已丢失')

    if (requested === 'resume') {
      const resumed = await quizStore.resume(bundle.meta, bundle)
      if (!resumed) throw new Error('没有可继续的练习')
    } else {
      await quizStore.start(bundle.meta, requested, { chapter: chapter.value || undefined })
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
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 48rpx;
}

.loading-box {
  padding: 200rpx 0;
  text-align: center;
}

/* 收藏按钮放在底部操作栏，避开右上角胶囊区 */
.fav-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border: 1rpx solid $border;
  border-radius: 26rpx;
  background: #f4f1ea;
}

.fav-glyph {
  font-size: 36rpx;
  line-height: 1;
  color: $text-sub;
}

.fav-btn.active .fav-glyph {
  color: $warning;
}

.progress-block {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  flex-shrink: 0;
}

.progress-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.bank-label {
  font-size: 21rpx;
  font-weight: 400;
  color: $text-light;
}

.count {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 4rpx;
}

.cur {
  font-family: $font-display;
  font-size: 28rpx;
  font-weight: 700;
  color: $text;
}

.total {
  font-size: 21rpx;
  color: $text-light;
}

.exam-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 24rpx;
  background: $warning-soft;
}

.exam-hint-text {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  color: $warning;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exam-time {
  flex-shrink: 0;
  font-size: 30rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: $warning;
}

.quiz-scroll {
  flex: 1;
  height: 0;
  margin-top: 36rpx;
}

.question-card {
  display: flex;
  flex-direction: column;
  gap: 26rpx;
  padding: 36rpx;
  border-radius: 40rpx;
  border: 1rpx solid $border;
  background: $card;
}

.q-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.type-pill {
  padding: 8rpx 18rpx;
  border-radius: 12rpx;
  background: $primary-soft;
  color: $primary;
  font-size: 19rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.q-no {
  font-size: 20rpx;
  color: $text-light;
}

.stem {
  display: block;
  font-family: $font-display;
  font-size: 36rpx;
  font-weight: 600;
  line-height: 58rpx;
  color: $text;
  white-space: pre-wrap;
}

.options {
  margin-top: 32rpx;
}

.submit-row {
  padding: 8rpx 0 24rpx;
}

.feedback {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 24rpx;
  padding: 30rpx 32rpx;
  border-radius: 36rpx;
  background: #faf3e4;
}

.feedback-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.feedback-left {
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.feedback-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28rpx;
  height: 28rpx;
  border: 2rpx solid $danger;
  border-radius: 50%;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1;
  color: $danger;
}

.feedback.ok .feedback-icon {
  border-color: $success;
  color: $success;
}

.feedback-title {
  font-size: 23rpx;
  font-weight: 600;
  color: $danger;
}

.feedback.ok .feedback-title {
  color: $success;
}

.answer-hint {
  flex: 1;
  min-width: 0;
  font-size: 21rpx;
  font-weight: 500;
  color: $warning;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-text {
  font-size: 23rpx;
  font-weight: 400;
  line-height: 40rpx;
  color: #5e5646;
  white-space: pre-wrap;
}

.exam-hint {
  padding: 24rpx 8rpx;
  text-align: center;
}

.knowledge {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding-top: 36rpx;
}

.knowledge-title {
  font-size: 21rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
  color: $text-light;
}

.chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 14rpx;
}

.chip {
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid $border;
  background: $card;
  font-size: 21rpx;
  font-weight: 400;
  color: $text-sub;
}

.bottom-space {
  height: 240rpx;
}

.action-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx 40rpx calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $border;
  background: $card;
}

.action-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18rpx;
}

.sheet-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border-radius: 26rpx;
  border: 1rpx solid $border;
  background: #f4f1ea;
}

.sheet-icon {
  font-size: 36rpx;
  line-height: 1;
  color: $text-sub;
}

.act-btn {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  margin: 0;
  padding: 0 12rpx;
  border: none;
  border-radius: 26rpx;
  font-size: 25rpx;
  line-height: 1;
}

.act-btn::after {
  border: none;
}

.act-prev {
  background: #f4f1ea;
  color: $text-light;
  font-weight: 500;
}

.act-next {
  gap: 12rpx;
  background: $primary;
  color: $cream;
  font-weight: 600;
}

.act-btn[disabled] {
  opacity: 0.45;
}

.next-arrow {
  font-size: 30rpx;
  line-height: 1;
  color: $cream;
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
