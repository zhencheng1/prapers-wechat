<template>
  <view v-if="bank" class="page">
    <StatusBar />
    <NavBar title="所有题目" />

    <view class="bank-header">
      <text class="bank-eyebrow">{{ bank.meta.name }}</text>
      <text class="bank-title">随时翻看每一题</text>
      <view class="bank-meta">
        <text class="meta-text">共 {{ questions.length }} 题</text>
        <view class="meta-dot" />
        <text class="meta-text">已练 {{ seenCount }} 题</text>
      </view>
    </view>

    <view class="filter-wrap">
      <view class="search-field">
        <text class="search-glyph">⌕</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索题干或题号"
          placeholder-class="search-ph"
          confirm-type="search"
        />
        <text v-if="keyword" class="search-clear" @tap="clearKeyword">✕</text>
      </view>
      <view class="chip-row">
        <view
          class="filter-chip press"
          :class="{ active: !chapter }"
          @tap="selectChapter('')"
        >
          <text class="chip-label">全部</text>
          <text class="chip-count">{{ questions.length }}</text>
        </view>
        <view
          v-for="group in groups"
          :key="group.name"
          class="filter-chip press"
          :class="{ active: chapter === group.name }"
          @tap="selectChapter(group.name)"
        >
          <text class="chip-label">{{ group.name }}</text>
          <text class="chip-count">{{ group.count }}</text>
        </view>
      </view>
    </view>

    <view class="section list-section">
      <SectionTitle title="题目列表" />
      <view v-if="visibleQuestions.length" class="question-list-card">
        <view v-for="(question, index) in visibleQuestions" :key="question.no" class="question-item">
          <view v-if="index > 0" class="row-divider" />
          <view class="question-row press" @tap="openQuestion(question.no)">
            <text
              class="question-no"
              :class="{ 'question-no-done': seen.has(question.no) }"
            >
              #{{ question.no }}
            </text>
            <view class="grow question-texts">
              <text class="question-title line2">{{ question.stem }}</text>
              <view class="question-sub">
                <text class="question-type" :class="'type-' + question.type">
                  {{ typeLabel(question.type).replace('题', '') }}
                </text>
                <view class="sub-dot" />
                <text class="question-chapter">{{ chapterName(question) }}</text>
              </view>
            </view>
            <view v-if="seen.has(question.no)" class="done-tag">
              <text class="done-text">已练</text>
            </view>
            <text v-else class="chev">›</text>
          </view>
        </view>

        <button
          v-if="visibleCount < currentTotal"
          class="btn btn-ghost load-more"
          @tap="showMore"
        >
          加载更多（还剩 {{ currentTotal - visibleCount }} 题）
        </button>
      </view>
      <EmptyState
        v-else
        title="没有题目"
        description="这个题库还没有可查看的题目。"
        icon="题"
      >
        <button class="btn btn-primary" @tap="goBanks">返回题库</button>
      </EmptyState>
    </view>

    <view class="spacer" />
    <text class="foot-note">共 {{ currentTotal }} 题 · 可继续加载更多</text>
  </view>

  <view v-else-if="loading" class="page">
    <StatusBar />
    <NavBar title="所有题目" />
    <LoadingState text="正在读取题目…" />
  </view>

  <view v-else class="page">
    <StatusBar />
    <NavBar title="所有题目" />
    <EmptyState title="题库不存在" description="它可能已被删除，或存储文件已丢失。" icon="!">
      <button class="btn btn-primary" @tap="goBanks">返回题库</button>
    </EmptyState>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import type { BankBundle, Question, QuestionType } from '@/types/domain'
import { chapterName, groupByChapter, type ChapterGroup } from '@/core/quiz/chapters'
import { readAllQuestions } from '@/services/bank'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import SectionTitle from '@/components/SectionTitle.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

const PAGE_SIZE = 100

const appStore = useAppStore()
const bankStore = useBankStore()

const bankId = ref('')
const bank = ref<BankBundle | null>(null)
const questions = ref<Question[]>([])
const groups = ref<ChapterGroup[]>([])
const seen = ref<Set<number>>(new Set())
const chapter = ref('')
const keyword = ref('')
const visibleCount = ref(PAGE_SIZE)
const loading = ref(true)

const seenCount = computed(() => seen.value.size)
const currentQuestions = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return questions.value.filter((question) => {
    if (chapter.value && chapterName(question) !== chapter.value) return false
    if (!key) return true
    return question.stem.toLowerCase().includes(key) || String(question.no) === key
  })
})

watch(keyword, () => {
  visibleCount.value = PAGE_SIZE
})
const currentTotal = computed(() => currentQuestions.value.length)
const visibleQuestions = computed(() => currentQuestions.value.slice(0, visibleCount.value))

onLoad((options: any) => {
  bankId.value = options?.id ?? ''
})

onShow(async () => {
  loading.value = true
  try {
    await appStore.ensureReady()
    await bankStore.init()
    const bundle = await bankStore.open(bankId.value)
    if (!bundle) return
    bank.value = bundle
    questions.value = await readAllQuestions(bundle.meta)
    groups.value = groupByChapter(questions.value)
    seen.value = new Set(bundle.progress.seen)
  } finally {
    loading.value = false
  }
})

function typeLabel(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
  }
  return labels[type] ?? '题目'
}

function selectChapter(name: string): void {
  chapter.value = name
  visibleCount.value = PAGE_SIZE
}

function clearKeyword(): void {
  keyword.value = ''
}

function showMore(): void {
  visibleCount.value += PAGE_SIZE
}

function openQuestion(no: number): void {
  const chapterParam = chapter.value
    ? `&chapter=${encodeURIComponent(chapter.value)}`
    : ''
  uni.navigateTo({
    url: `/pages/question/detail?bankId=${bankId.value}&no=${no}${chapterParam}`,
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
  padding: 0 48rpx calc(24rpx + env(safe-area-inset-bottom));
}

.bank-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14rpx;
  padding-top: 12rpx;
  flex-shrink: 0;
}

.bank-eyebrow {
  font-size: 21rpx;
  color: $text-sub;
}

.bank-title {
  width: 100%;
  font-family: $font-display;
  font-size: 46rpx;
  font-weight: 700;
  line-height: 60rpx;
  color: $text;
}

.bank-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
}

.meta-text {
  font-size: 21rpx;
  color: $text-light;
}

.meta-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: $border;
}

.filter-wrap {
  margin-top: 28rpx;
  flex-shrink: 0;
}

/* 搜索入口放在筛选区，避开右上角胶囊区 */
.search-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14rpx;
  height: 80rpx;
  padding: 0 24rpx;
  margin-bottom: 22rpx;
  border: 1rpx solid $border;
  border-radius: 22rpx;
  background: $card;
}

.search-glyph {
  font-size: 32rpx;
  line-height: 1;
  color: $text-light;
}

.search-input {
  flex: 1;
  height: 80rpx;
  font-size: 24rpx;
  color: $text;
}

.search-ph {
  font-size: 24rpx;
  color: $text-light;
}

.search-clear {
  padding: 8rpx;
  font-size: 24rpx;
  color: $text-light;
}

.chip-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 14rpx;
}

.filter-chip {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  flex: 0 1 auto;
  max-width: 100%;
  min-width: 0;
  height: 68rpx;
  padding: 0 20rpx;
  border: 1rpx solid $border;
  border-radius: 22rpx;
  background: $card;
}

.filter-chip.active {
  border-color: $primary;
  background: $primary;
}

.chip-label {
  min-width: 0;
  font-size: 19rpx;
  font-weight: 500;
  color: $text-sub;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-chip.active .chip-label {
  color: $cream;
}

.chip-count {
  flex-shrink: 0;
  font-family: $font-display;
  font-size: 20rpx;
  font-weight: 600;
  color: $text-light;
}

.filter-chip.active .chip-count {
  color: $primary-soft;
}

.list-section {
  margin-top: 36rpx;
  flex-shrink: 0;
}

.question-list-card {
  padding: 0 28rpx;
  border-radius: 32rpx;
  overflow: hidden;
}

.row-divider {
  height: 1rpx;
  background: $border;
}

.question-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 22rpx;
  padding: 22rpx 0;
}

.question-no {
  flex-shrink: 0;
  width: 56rpx;
  font-family: $font-display;
  font-size: 21rpx;
  font-weight: 600;
  color: $text-light;
}

.question-no-done {
  color: $primary;
}

.question-texts {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.question-title {
  font-size: 23rpx;
  font-weight: 500;
  line-height: 32rpx;
  color: $text;
}

.question-sub {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10rpx;
}

.question-type {
  font-size: 18rpx;
  font-weight: 600;
  color: $primary;
}

.type-multiple {
  color: $warning;
}

.type-judge {
  color: $text-sub;
}

.sub-dot {
  width: 5rpx;
  height: 5rpx;
  border-radius: 3rpx;
  background: $border;
}

.question-chapter {
  font-size: 18rpx;
  color: $text-light;
}

.done-tag {
  flex-shrink: 0;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  background: $primary-soft;
}

.done-text {
  font-size: 17rpx;
  font-weight: 600;
  color: $primary-deep;
}

.chev {
  flex-shrink: 0;
  font-size: 36rpx;
  line-height: 1;
  color: $text-light;
}

.load-more {
  margin: 20rpx 0;
}

.spacer {
  flex: 1;
}

.foot-note {
  display: block;
  padding-top: 12rpx;
  text-align: center;
  font-size: 19rpx;
  color: $text-light;
}
</style>
