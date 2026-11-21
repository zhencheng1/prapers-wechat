<template>
  <view v-if="draft" class="page preview-page">
    <StatusBar />
    <NavBar title="导入预览" />

    <view class="header">
      <text class="eyebrow header-eyebrow">{{ draft.meta.name }} · 已校验</text>
      <text class="display header-title">确认后即可开始</text>
    </view>

    <view class="summary-card">
      <view class="stat">
        <text class="stat-value">{{ draft.questions.length }}</text>
        <text class="stat-label">识别</text>
      </view>
      <view class="stat-divider" />
      <view class="stat">
        <text class="stat-value value-primary">{{ importableCount }}</text>
        <text class="stat-label">可导入</text>
      </view>
      <view class="stat-divider" />
      <view class="stat">
        <text class="stat-value value-sub">{{ draft.duplicates }}</text>
        <text class="stat-label">重复</text>
      </view>
      <view class="stat-divider" />
      <view class="stat">
        <text class="stat-value value-warning">{{ draft.issues.length }}</text>
        <text class="stat-label">问题</text>
      </view>
    </view>

    <view v-if="draft.issues.length" class="section">
      <SectionTitle title="问题列表">
        <text class="section-note">可导入 {{ importableCount }} 题</text>
      </SectionTitle>
      <view class="card issue-card">
        <view v-for="(issue, index) in visibleIssues" :key="index" class="issue-row">
          <text class="issue-level" :class="issue.level">{{ issue.level === 'error' ? '错误' : '提醒' }}</text>
          <text class="grow issue-message">{{ issue.message }}</text>
          <text class="issue-path">{{ issue.path }}</text>
        </view>
        <text v-if="draft.issues.length > visibleIssues.length" class="issue-more">
          还有 {{ draft.issues.length - visibleIssues.length }} 条未显示
        </text>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="题目预览">
        <text class="section-count">{{ visibleQuestions.length }} / {{ draft.questions.length }}</text>
      </SectionTitle>

      <view
        v-for="question in visibleQuestions"
        :key="question.no"
        class="card question-card"
      >
        <view class="row between q-head">
          <view class="row q-meta">
            <text class="q-no">#{{ question.no }}</text>
            <text class="type-chip">{{ typeLabel(question.type) }}</text>
          </view>
          <text v-if="!importable(question)" class="q-tag warn-tag">待补答案</text>
          <text v-else class="edit-icon">✎</text>
        </view>
        <text class="stem">{{ question.stem }}</text>
        <view class="answer-line">
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
            <text class="chip-key">{{ option.key }}</text>
            <text class="chip-text">{{ option.text }}</text>
          </view>
        </view>
      </view>

      <button
        v-if="visibleQuestions.length < draft.questions.length"
        class="btn btn-soft load-more"
        @tap="showMore"
      >
        加载更多题目
      </button>
    </view>

    <view class="preview-actions">
      <view class="action-row">
        <button class="btn cancel-btn" @tap="cancel">取消</button>
        <button class="btn btn-primary import-btn" :disabled="importableCount === 0" @tap="confirmImport">
          <text class="import-check">✓</text>
          <text>导入 {{ importableCount }} 题</text>
        </button>
      </view>
      <view class="home-indicator"><view class="home-bar" /></view>
    </view>
  </view>

  <view v-else class="page">
    <StatusBar />
    <NavBar title="导入预览" />
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
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

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
.page {
  padding: 0 48rpx calc(48rpx + env(safe-area-inset-bottom));
}

.preview-page {
  padding-bottom: 240rpx;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding-top: 12rpx;
}

.header-eyebrow {
  color: $text-sub;
  letter-spacing: 0;
}

.header-title {
  font-size: 44rpx;
}

.summary-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 24rpx;
  padding: 26rpx 24rpx;
  border: 1rpx solid $border;
  border-radius: 34rpx;
  background: $card;
}

.stat {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  color: $text;
  font-family: $font-display;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1;
}

.value-primary {
  color: $primary;
}

.value-sub {
  color: $text-sub;
}

.value-warning {
  color: $warning;
}

.stat-label {
  color: $text-light;
  font-size: 18rpx;
}

.stat-divider {
  width: 1rpx;
  height: 52rpx;
  flex-shrink: 0;
  background: $border;
}

.section-note {
  color: $primary;
  font-size: 20rpx;
  font-weight: 500;
}

.section-count {
  color: $text-light;
  font-size: 20rpx;
}

.issue-card {
  overflow: hidden;
  padding: 0 26rpx;
}

.issue-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0ece2;
}

.issue-row:last-of-type {
  border-bottom: none;
}

.issue-level {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  font-size: 16rpx;
  font-weight: 600;
}

.issue-level.error {
  background: $danger-soft;
  color: $danger;
}

.issue-level.warning {
  background: $sand;
  color: #8a6a2e;
}

.issue-message {
  flex: 1;
  min-width: 0;
  color: $text;
  font-size: 21rpx;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issue-path {
  flex-shrink: 0;
  color: $text-light;
  font-size: 18rpx;
}

.issue-more {
  display: block;
  padding: 16rpx 0;
  color: $text-light;
  font-size: 18rpx;
}

.question-card {
  margin-bottom: 20rpx;
  padding: 22rpx 28rpx;
}

.q-head {
  margin-bottom: 18rpx;
}

.q-meta {
  gap: 14rpx;
}

.q-no {
  color: $text-sub;
  font-family: $font-display;
  font-size: 21rpx;
  font-weight: 600;
}

.type-chip {
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  background: $primary-soft;
  color: $primary-deep;
  font-size: 16rpx;
  font-weight: 600;
}

.q-tag {
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  font-size: 16rpx;
  font-weight: 600;
}

.warn-tag {
  background: $danger-soft;
  color: $danger;
}

.edit-icon {
  color: $text-light;
  font-size: 28rpx;
}

.stem {
  display: block;
  color: $text;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 1.5;
  white-space: pre-wrap;
}

.answer-line {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
  margin-top: 14rpx;
}

.answer-value {
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  background: $primary-soft;
  color: $primary;
  font-size: 18rpx;
  font-weight: 600;
}

.answer-empty {
  background: #f5f1e7;
  color: $text-light;
}

.chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.chip {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 18rpx;
  border-radius: 14rpx;
  background: #f5f1e7;
}

.chip-key,
.chip-text {
  color: $text-light;
  font-size: 20rpx;
}

.chip-key {
  font-weight: 600;
}

.chip.active {
  background: $primary;
}

.chip.active .chip-key,
.chip.active .chip-text {
  color: $cream;
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
  flex-direction: column;
  gap: 16rpx;
  padding: 20rpx 40rpx calc(10rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $border;
  background: $card;
}

.action-row {
  display: flex;
  flex-direction: row;
  gap: 18rpx;
}

.cancel-btn {
  width: 192rpx;
  height: 92rpx;
  flex-shrink: 0;
  border: 1rpx solid $border;
  border-radius: 26rpx;
  background: #f4f1ea;
  color: $text-sub;
}

.import-btn {
  flex: 1;
  height: 92rpx;
  gap: 12rpx;
  border-radius: 26rpx;
}

.import-check {
  color: $cream;
  font-size: 28rpx;
}

.home-indicator {
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.home-bar {
  width: 260rpx;
  height: 8rpx;
  border-radius: 6rpx;
  background: #d8d2c4;
}
</style>
