<template>
  <view v-if="draft" class="page preview-page">
    <view class="card summary">
      <view class="row between">
        <text class="title line1">{{ draft.meta.name }}</text>
        <text class="tag">{{ importableCount }} 题可导入</text>
      </view>
      <view class="row summary-row">
        <text class="small muted">识别 {{ draft.questions.length }} 题</text>
        <text class="small muted">重复 {{ draft.duplicates }} 题</text>
        <text class="small muted">问题 {{ draft.issues.length }} 条</text>
      </view>
      <text class="small light summary-note">
        点击选项即可修正答案；未补全答案的题目将被跳过。
      </text>
    </view>

    <view v-if="draft.issues.length" class="section">
      <SectionTitle title="问题列表" />
      <view class="card issue-card">
        <view v-for="(issue, index) in visibleIssues" :key="index" class="issue-row">
          <text class="issue-level" :class="issue.level">{{ issue.level === 'error' ? '错误' : '提醒' }}</text>
          <view class="grow">
            <text class="small issue-path">{{ issue.path }}</text>
            <text class="small muted">{{ issue.message }}</text>
          </view>
        </view>
        <text v-if="draft.issues.length > visibleIssues.length" class="small light">
          还有 {{ draft.issues.length - visibleIssues.length }} 条未显示
        </text>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="题目预览">
        <text class="small muted">{{ visibleQuestions.length }} / {{ draft.questions.length }}</text>
      </SectionTitle>

      <view
        v-for="question in visibleQuestions"
        :key="question.no"
        class="card question-card"
      >
        <view class="row between q-head">
          <text class="small bold">#{{ question.no }} · {{ typeLabel(question.type) }}</text>
          <text v-if="!importable(question)" class="warn-text">待补答案</text>
          <text v-else class="ok-text">可导入</text>
        </view>
        <text class="stem">{{ question.stem }}</text>
        <view class="answer-label">
          <text class="small muted">答案</text>
          <text v-if="question.answer.length" class="answer-value">{{ question.answer.join('') }}</text>
          <text v-else class="answer-value answer-empty">未填写</text>
        </view>
        <view class="chips">
          <view
            v-for="option in question.options"
            :key="option.key"
            class="chip press"
            :class="{ active: question.answer.includes(option.key) }"
            @tap="toggleAnswer(question, option.key)"
          >
            {{ option.key }}. {{ option.text }}
          </view>
        </view>
      </view>

      <button
        v-if="visibleQuestions.length < draft.questions.length"
        class="btn btn-ghost load-more"
        @tap="showMore"
      >
        加载更多题目
      </button>
    </view>

    <view class="preview-actions">
      <button class="btn btn-ghost" @tap="cancel">取消</button>
      <button class="btn btn-primary" :disabled="importableCount === 0" @tap="confirmImport">
        导入 {{ importableCount }} 题
      </button>
    </view>
  </view>

  <view v-else class="page">
    <EmptyState title="没有待导入的数据" description="请返回导入页重新选择文件。" icon="!">
      <button class="btn btn-primary" @tap="cancel">返回</button>
    </EmptyState>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Question, QuestionType } from '@/types/domain'
import { isQuestionImportable } from '@/core/import/normalize'
import { useBankStore } from '@/stores/bank'
import { useImportStore } from '@/stores/import'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'

const PAGE_SIZE = 100
const importStore = useImportStore()
const bankStore = useBankStore()

const draft = computed(() => importStore.draft)
const visibleCount = ref(PAGE_SIZE)

const importableCount = computed(
  () => draft.value?.questions.filter((question) => isQuestionImportable(question)).length ?? 0,
)
const skippedCount = computed(
  () => (draft.value?.questions.length ?? 0) - importableCount.value,
)
const visibleQuestions = computed(
  () => draft.value?.questions.slice(0, visibleCount.value) ?? [],
)
const visibleIssues = computed(() => draft.value?.issues.slice(0, 20) ?? [])

onLoad(() => {
  if (!draft.value) {
    uni.navigateBack()
  }
})

function typeLabel(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
  }
  return labels[type]
}

function importable(question: Question): boolean {
  return isQuestionImportable(question)
}

function toggleAnswer(question: Question, key: string): void {
  if (question.type === 'multiple') {
    question.answer = question.answer.includes(key)
      ? question.answer.filter((item) => item !== key)
      : [...question.answer, key].sort()
    return
  }
  question.answer = question.answer.includes(key) ? [] : [key]
}

function showMore(): void {
  visibleCount.value += PAGE_SIZE
}

function cancel(): void {
  importStore.clear()
  uni.navigateBack()
}

async function confirmImport(): Promise<void> {
  if (!draft.value) return
  const total = importableCount.value
  if (!total) {
    uni.showToast({ title: '没有可导入的题目', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认导入',
    content:
      skippedCount.value > 0
        ? `将导入 ${total} 题，跳过 ${skippedCount.value} 题，确定吗？`
        : `将导入 ${total} 题，确定吗？`,
    success: async (result) => {
      if (!result.confirm || !draft.value) return
      uni.showLoading({ title: '正在写入…', mask: true })
      try {
        const meta = await bankStore.importDraft(draft.value)
        importStore.clear()
        uni.showToast({ title: '导入成功', icon: 'success' })
        setTimeout(() => {
          uni.redirectTo({ url: `/pages/bank/detail?id=${meta.id}` })
        }, 400)
      } catch (error) {
        const message = error instanceof Error ? error.message : '导入失败'
        uni.showModal({ title: '导入失败', content: message, showCancel: false })
      } finally {
        uni.hideLoading()
      }
    },
  })
}
</script>

<style scoped lang="scss">
.preview-page {
  padding-bottom: 200rpx;
}

.summary {
  padding: 28rpx;
}

.summary-row {
  gap: 24rpx;
  margin-top: 14rpx;
}

.summary-note {
  display: block;
  margin-top: 12rpx;
}

.issue-card {
  padding: 20rpx 24rpx;
}

.issue-row {
  display: flex;
  align-items: flex-start;
  padding: 12rpx 0;
  border-bottom: 1rpx solid $border;
}

.issue-row:last-of-type {
  border-bottom: none;
}

.issue-level {
  flex-shrink: 0;
  margin-right: 14rpx;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.issue-level.error {
  background: $danger-soft;
  color: $danger;
}

.issue-level.warning {
  background: $warning-soft;
  color: #92400e;
}

.issue-path {
  display: block;
}

.question-card {
  margin-bottom: 20rpx;
  padding: 26rpx;
}

.q-head {
  margin-bottom: 14rpx;
}

.warn-text {
  color: $warning;
  font-size: 22rpx;
}

.ok-text {
  color: $success;
  font-size: 22rpx;
}

.stem {
  display: block;
  font-size: 28rpx;
  line-height: 1.6;
  white-space: pre-wrap;
}

.answer-label {
  display: flex;
  align-items: center;
  margin: 16rpx 0 10rpx;
}

.answer-value {
  margin-left: 12rpx;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  background: $primary-soft;
  color: $primary;
  font-size: 24rpx;
  font-weight: 600;
}

.answer-empty {
  background: #f3f4f6;
  color: $text-light;
}

.chips {
  display: flex;
  flex-wrap: wrap;
}

.chip {
  margin: 6rpx;
  padding: 10rpx 18rpx;
  border: 2rpx solid $border;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: $text-sub;
}

.chip.active {
  border-color: $primary;
  background: $primary-soft;
  color: $primary;
  font-weight: 600;
}

.load-more {
  margin-top: 8rpx;
}

.preview-actions {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: $card;
  box-shadow: 0 -6rpx 24rpx rgba(17, 24, 39, 0.06);
}

.preview-actions .btn {
  flex: 1;
}
</style>
