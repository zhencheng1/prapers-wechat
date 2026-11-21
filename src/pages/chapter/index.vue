<template>
  <view v-if="bank" class="page">
    <StatusBar />
    <NavBar title="章节练习" />

    <view class="bank-header">
      <text class="bank-eyebrow">{{ bank.meta.name }}</text>
      <text class="bank-title">一章一章，稳扎稳打</text>
      <text class="bank-sub">共 {{ groups.length }} 个章节 · {{ bank.meta.questionCount }} 道题</text>
    </view>

    <view class="tip-card">
      <text class="tip-icon">▤</text>
      <text class="tip-text">按章节集中练习，进度会计入题库总进度。</text>
    </view>

    <view class="section chapter-section">
      <SectionTitle title="选择章节" />
      <view v-if="groups.length" class="chapter-list">
        <view
          v-for="(group, index) in groups"
          :key="group.name"
          class="card chapter-card press"
          @tap="startChapter(group.name)"
        >
          <view class="row chapter-row">
            <view
              class="chapter-badge"
              :class="{ 'chapter-badge-active': percentOf(group) > 0 }"
            >
              <text class="chapter-badge-text">{{ String(index + 1).padStart(2, '0') }}</text>
            </view>
            <view class="grow chapter-texts">
              <text class="chapter-name">{{ group.name.replace(' ', ' · ') }}</text>
              <text class="chapter-sub">
                {{ group.count }} 题 · 已练 {{ seenOf(group) }} 题
              </text>
            </view>
            <text
              class="chapter-percent"
              :class="{ 'chapter-percent-active': percentOf(group) > 0 }"
            >
              {{ percentOf(group) }}%
            </text>
          </view>
          <ProgressBar :value="percentOf(group)" :height="6" />
        </view>
      </view>
      <EmptyState
        v-else
        title="题库还没有题目"
        description="请先导入带题目的题库。"
        icon="章"
      >
        <button class="btn btn-primary" @tap="goBanks">返回题库</button>
      </EmptyState>
    </view>

    <view class="spacer" />
    <text class="foot-note">已练 {{ seen.size }} / {{ bank.meta.questionCount }} 题 · 继续加油</text>
  </view>

  <view v-else-if="loading" class="page">
    <StatusBar />
    <NavBar title="章节练习" />
    <LoadingState text="正在读取章节…" />
  </view>

  <view v-else class="page">
    <StatusBar />
    <NavBar title="章节练习" />
    <EmptyState title="题库不存在" description="它可能已被删除，或存储文件已丢失。" icon="!">
      <button class="btn btn-primary" @tap="goBanks">返回题库</button>
    </EmptyState>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import type { BankBundle } from '@/types/domain'
import { groupByChapter, type ChapterGroup } from '@/core/quiz/chapters'
import { readAllQuestions } from '@/services/bank'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import SectionTitle from '@/components/SectionTitle.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

const appStore = useAppStore()
const bankStore = useBankStore()

const bankId = ref('')
const bank = ref<BankBundle | null>(null)
const groups = ref<ChapterGroup[]>([])
const seen = ref<Set<number>>(new Set())
const loading = ref(true)

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
    seen.value = new Set(bundle.progress.seen)
    groups.value = groupByChapter(await readAllQuestions(bundle.meta))
  } finally {
    loading.value = false
  }
})

function seenOf(group: ChapterGroup): number {
  return group.nos.filter((no) => seen.value.has(no)).length
}

function percentOf(group: ChapterGroup): number {
  if (!group.count) return 0
  return Math.round((seenOf(group) / group.count) * 100)
}

function startChapter(name: string): void {
  uni.navigateTo({
    url: `/pages/quiz/index?bankId=${bankId.value}&mode=chapter&chapter=${encodeURIComponent(name)}`,
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
  padding-top: 16rpx;
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

.bank-sub {
  font-size: 21rpx;
  color: $text-light;
}

.tip-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18rpx;
  margin-top: 28rpx;
  padding: 22rpx 26rpx;
  border-radius: 28rpx;
  background: $primary-soft;
  flex-shrink: 0;
}

.tip-icon {
  flex-shrink: 0;
  width: 30rpx;
  font-size: 28rpx;
  line-height: 30rpx;
  color: $primary-deep;
}

.tip-text {
  flex: 1;
  font-size: 21rpx;
  line-height: 32rpx;
  color: $primary-deep;
}

.chapter-section {
  margin-top: 36rpx;
  flex-shrink: 0;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.chapter-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx 28rpx;
  border-radius: 30rpx;
}

.chapter-row {
  align-items: center;
  gap: 22rpx;
}

.chapter-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 64rpx;
  height: 64rpx;
  padding: 0 8rpx;
  border-radius: 20rpx;
  background: $sand;
}

.chapter-badge-active {
  background: $primary;
}

.chapter-badge-text {
  font-family: $font-display;
  font-size: 24rpx;
  font-weight: 600;
  color: $text-light;
}

.chapter-badge-active .chapter-badge-text {
  color: $cream;
}

.chapter-texts {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.chapter-name {
  font-size: 24rpx;
  font-weight: 600;
  color: $text;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.chapter-sub {
  font-size: 19rpx;
  color: $text-light;
}

.chapter-percent {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-family: $font-display;
  font-size: 26rpx;
  font-weight: 600;
  color: $text-light;
}

.chapter-percent-active {
  color: $primary;
}

.spacer {
  flex: 1;
}

.foot-note {
  display: block;
  padding-top: 20rpx;
  text-align: center;
  font-size: 19rpx;
  color: $text-light;
}
</style>
