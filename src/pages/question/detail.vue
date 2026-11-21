<template>
  <view v-if="current" class="page">
    <StatusBar />
    <NavBar title="题目详情" />

    <view class="question-head">
      <view class="q-meta">
        <text class="type-chip">{{ typeLabel(current.type) }}</text>
        <text class="q-meta-text">
          #{{ current.no }} / {{ bank?.meta.questionCount ?? '' }} · {{ chapterName(current) }}
        </text>
        <view class="fav-btn press" :class="{ active: isFavorite }" @tap="toggleFavorite">
          <text class="fav-glyph">{{ isFavorite ? '★' : '☆' }}</text>
          <text class="fav-label">{{ isFavorite ? '已收藏' : '收藏' }}</text>
        </view>
      </view>
      <text class="stem">{{ current.stem }}</text>
      <view v-if="current.images.length" class="image-hint">
        <text class="small muted">本题含图片，图片题暂不支持显示。</text>
      </view>
    </view>

    <view class="options-section">
      <OptionRow
        v-for="option in current.options"
        :key="option.key"
        :option="option"
        :type="current.type"
        :selected="false"
        :submitted="answerVisible"
        :correct-keys="current.answer"
        :picked="[]"
        @select="noop"
      />
    </view>

    <view v-if="answerVisible" class="section answer-section">
      <SectionTitle title="答案与解析">
        <text class="answer-chip">正确答案 {{ current.answer.join('') || '未填写' }}</text>
      </SectionTitle>
      <view class="card answer-card">
        <view class="answer-source">
          <text class="source-icon">✦</text>
          <text class="source-text line1">收录于 {{ bank?.meta.name || '本机题库' }}</text>
        </view>
        <text class="analysis-text">{{ current.analysis || '暂无解析' }}</text>
      </view>
    </view>

    <view v-else class="section answer-section">
      <view class="card hidden-card">
        <text class="small muted">答案已隐藏，先自己想一想，再看解析。</text>
      </view>
    </view>

    <view v-if="current.tags.length" class="section knowledge-section">
      <SectionTitle title="相关知识点" />
      <view class="knowledge-row">
        <text v-for="tag in current.tags" :key="tag" class="knowledge-chip">{{ tag }}</text>
      </view>
      <view class="knowledge-note">
        <text class="note-icon">ⓘ</text>
        <text class="note-text">收藏后可以在「我的收藏」集中复习</text>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="action-row">
        <button class="btn bottom-btn btn-prev" :disabled="index <= 0" @tap="prev">
          上一题
        </button>
        <button class="btn bottom-btn btn-toggle" @tap="toggleAnswer">
          <text class="toggle-glyph">⊘</text>
          {{ answerVisible ? '隐藏答案' : '显示答案' }}
        </button>
        <button
          class="btn bottom-btn btn-next"
          :disabled="index >= list.length - 1"
          @tap="next"
        >
          下一题<text class="next-glyph">→</text>
        </button>
      </view>
      <view class="home-indicator" />
    </view>
  </view>

  <view v-else-if="loading" class="page">
    <StatusBar />
    <NavBar title="题目详情" />
    <LoadingState text="正在读取题目…" />
  </view>

  <view v-else class="page">
    <StatusBar />
    <NavBar title="题目详情" />
    <EmptyState title="题目不存在" description="它可能已被删除，或存储文件已丢失。" icon="!">
      <button class="btn btn-primary" @tap="goBack">返回列表</button>
    </EmptyState>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import type { BankBundle, Question, QuestionType } from '@/types/domain'
import { chapterName } from '@/core/quiz/chapters'
import { readAllQuestions } from '@/services/bank'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useFavoriteStore } from '@/stores/favorite'
import { decodeQuery } from '@/utils'
import SectionTitle from '@/components/SectionTitle.vue'
import OptionRow from '@/components/OptionRow.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

const appStore = useAppStore()
const bankStore = useBankStore()
const favoriteStore = useFavoriteStore()

const bankId = ref('')
const no = ref(0)
const chapter = ref('')
const bank = ref<BankBundle | null>(null)
const list = ref<Question[]>([])
const index = ref(0)
const answerVisible = ref(true)
const loading = ref(true)

const current = computed(() => list.value[index.value] ?? null)
const isFavorite = computed(() =>
  bank.value && current.value ? favoriteStore.isFavorite(current.value.no) : false,
)

onLoad((options: any) => {
  bankId.value = options?.id ?? options?.bankId ?? ''
  no.value = Number(options?.no ?? 0)
  chapter.value = options?.chapter ? decodeQuery(String(options.chapter)) : ''
})

onShow(async () => {
  loading.value = true
  try {
    await appStore.ensureReady()
    await bankStore.init()
    const bundle = await bankStore.open(bankId.value)
    if (!bundle) return
    bank.value = bundle
    favoriteStore.load(bundle.meta)
    const all = await readAllQuestions(bundle.meta)
    list.value = chapter.value
      ? all.filter((question) => chapterName(question) === chapter.value)
      : all
    const found = list.value.findIndex((question) => question.no === no.value)
    index.value = found >= 0 ? found : 0
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

function noop(): void {
  // 浏览模式不响应选项点击
}

function toggleFavorite(): void {
  if (!bank.value || !current.value) return
  const active = favoriteStore.toggle(bank.value.meta, current.value.no)
  uni.showToast({ title: active ? '已加入收藏' : '已取消收藏', icon: 'none' })
}

function toggleAnswer(): void {
  answerVisible.value = !answerVisible.value
}

function prev(): void {
  if (index.value > 0) index.value -= 1
}

function next(): void {
  if (index.value < list.value.length - 1) index.value += 1
}

function goBack(): void {
  if (bankId.value) {
    uni.redirectTo({ url: `/pages/questions/index?id=${bankId.value}` })
  } else {
    uni.switchTab({ url: '/pages/banks/index' })
  }
}
</script>

<style scoped lang="scss">
.page {
  padding: 0 48rpx calc(220rpx + env(safe-area-inset-bottom));
}

/* 收藏入口移到题目信息行，避开右上角胶囊区 */
.fav-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border: 1rpx solid $border;
  border-radius: 20rpx;
  background: $card;
}

.fav-btn.active {
  border-color: $warning;
  background: $warning-soft;
}

.fav-glyph {
  font-size: 24rpx;
  line-height: 1;
  color: $text-sub;
}

.fav-btn.active .fav-glyph {
  color: $warning;
}

.fav-label {
  font-size: 20rpx;
  color: $text-sub;
}

.fav-btn.active .fav-label {
  color: $warning;
}

.question-head {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-top: 12rpx;
}

.q-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  min-width: 0;
}

.type-chip {
  flex-shrink: 0;
  padding: 6rpx 16rpx;
  border-radius: 14rpx;
  background: $primary-soft;
  font-size: 19rpx;
  font-weight: 600;
  color: $primary-deep;
}

.q-meta-text {
  flex: 1;
  min-width: 0;
  font-size: 19rpx;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stem {
  display: block;
  font-family: $font-display;
  font-size: 38rpx;
  font-weight: 600;
  line-height: 58rpx;
  color: $text;
  white-space: pre-wrap;
}

.image-hint {
  margin-top: -8rpx;
}

.options-section {
  margin-top: 32rpx;
}

.options-section :deep(.option-row) {
  min-height: 92rpx;
  margin-bottom: 16rpx;
  padding: 20rpx 26rpx;
  border: 2rpx solid $border;
  border-radius: 26rpx;
}

.options-section :deep(.option-key) {
  width: 52rpx;
  height: 52rpx;
  margin-right: 24rpx;
  border-radius: 14rpx;
  background: $sand;
  font-family: $font-body;
  font-size: 21rpx;
  color: $text-sub;
}

.options-section :deep(.option-text) {
  font-size: 26rpx;
}

.options-section :deep(.option-mark) {
  font-size: 28rpx;
}

.options-section :deep(.is-correct) {
  border-color: #9fbca9;
  background: $primary-soft;
}

.options-section :deep(.is-correct .option-key) {
  background: $primary;
  color: $cream;
}

.options-section :deep(.is-correct .option-mark) {
  color: $primary-deep;
}

.options-section :deep(.is-muted) {
  opacity: 1;
}

.answer-section {
  margin-top: 36rpx;
}

.answer-chip {
  flex-shrink: 0;
  padding: 6rpx 16rpx;
  border-radius: 14rpx;
  background: $cream;
  font-size: 19rpx;
  font-weight: 600;
  color: $text-sub;
}

.answer-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 26rpx 30rpx;
  border-radius: 30rpx;
}

.answer-source {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.source-icon {
  font-size: 26rpx;
  line-height: 1;
  color: $warning;
}

.source-text {
  min-width: 0;
  font-size: 18rpx;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-text {
  display: block;
  font-size: 23rpx;
  line-height: 40rpx;
  color: $text-sub;
  white-space: pre-wrap;
}

.hidden-card {
  padding: 36rpx 28rpx;
  text-align: center;
  border-radius: 30rpx;
  background: $primary-soft;
}

.knowledge-section {
  margin-top: 36rpx;
}

.knowledge-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 14rpx;
}

.knowledge-chip {
  padding: 12rpx 22rpx;
  border: 1rpx solid $border;
  border-radius: 999rpx;
  background: $card;
  font-size: 19rpx;
  color: $text-sub;
}

.knowledge-note {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  margin-top: 22rpx;
}

.note-icon {
  font-size: 24rpx;
  line-height: 1;
  color: $text-light;
}

.note-text {
  font-size: 18rpx;
  color: $text-light;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx 40rpx calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $border;
  background: $card;
}

.action-row {
  display: flex;
  flex-direction: row;
  gap: 18rpx;
}

.bottom-btn {
  flex: 1;
  height: 92rpx;
  padding: 0 8rpx;
  border-radius: 26rpx;
  font-size: 24rpx;
}

.btn-prev {
  border: 1rpx solid $border;
  background: $cream;
  color: $text-light;
}

.btn-toggle {
  border: 1rpx solid $border;
  background: $cream;
  color: $text-sub;
}

.btn-next {
  background: $primary;
  color: $cream;
  font-weight: 600;
}

.toggle-glyph {
  margin-right: 10rpx;
  font-size: 28rpx;
}

.next-glyph {
  margin-left: 8rpx;
  font-size: 28rpx;
}

.home-indicator {
  align-self: center;
  width: 260rpx;
  height: 8rpx;
  border-radius: 6rpx;
  background: #d8d2c4;
}
</style>
