<template>
  <view class="sheet-mask" @tap="emit('close')">
    <view class="sheet" @tap.stop>
      <view class="row between sheet-head">
        <text class="subtitle">答题卡</text>
        <text class="close" @tap="emit('close')">关闭</text>
      </view>

      <view class="legend row">
        <view class="legend-item"><view class="dot dot-current" />当前</view>
        <view class="legend-item"><view class="dot dot-correct" />正确</view>
        <view class="legend-item"><view class="dot dot-wrong" />错误</view>
        <view class="legend-item"><view class="dot dot-empty" />未答</view>
      </view>

      <scroll-view class="grid-scroll" scroll-y>
        <view class="grid">
          <view
            v-for="item in visibleItems"
            :key="item.index"
            class="cell"
            @tap="jump(item.index)"
          >
            <view class="cell-inner" :class="cellClass(item.index)">
              {{ item.index + 1 }}
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-if="pageCount > 1" class="pager row between">
        <button
          class="btn btn-small btn-ghost"
          :disabled="page === 0"
          @tap="prevPage"
        >
          上一页
        </button>
        <text class="small muted">{{ page + 1 }} / {{ pageCount }}</text>
        <button
          class="btn btn-small btn-ghost"
          :disabled="page >= pageCount - 1"
          @tap="nextPage"
        >
          下一页
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SessionAnswer } from '@/types/domain'

const props = defineProps<{
  order: number[]
  currentIndex: number
  answers: Record<number, SessionAnswer>
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'jump', index: number): void
}>()

const PAGE_SIZE = 100
const page = ref(0)

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.order.length / PAGE_SIZE)),
)

watch(
  () => props.currentIndex,
  (index) => {
    page.value = Math.floor(index / PAGE_SIZE)
  },
  { immediate: true },
)

const visibleItems = computed(() => {
  const start = page.value * PAGE_SIZE
  return props.order.slice(start, start + PAGE_SIZE).map((no, offset) => ({
    no,
    index: start + offset,
  }))
})

function cellClass(index: number): string {
  if (index === props.currentIndex) return 'is-current'
  const no = props.order[index]
  const answer = props.answers[no]
  if (!answer) return ''
  return answer.correct ? 'is-correct' : 'is-wrong'
}

function jump(index: number): void {
  emit('jump', index)
  emit('close')
}

function prevPage(): void {
  page.value = Math.max(0, page.value - 1)
}

function nextPage(): void {
  page.value = Math.min(pageCount.value - 1, page.value + 1)
}
</script>

<style scoped lang="scss">
.sheet-mask {
  position: fixed;
  z-index: 999;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(17, 24, 39, 0.45);
}

.sheet {
  width: 100%;
  max-height: 80vh;
  padding: 32rpx 28rpx calc(32rpx + env(safe-area-inset-bottom));
  border-radius: 32rpx 32rpx 0 0;
  background: $card;
}

.sheet-head {
  margin-bottom: 20rpx;
}

.close {
  font-size: 26rpx;
  color: $text-sub;
}

.legend {
  gap: 28rpx;
  padding-bottom: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: $text-sub;
}

.dot {
  width: 18rpx;
  height: 18rpx;
  margin-right: 8rpx;
  border-radius: 9rpx;
}

.dot-current {
  background: $primary;
}

.dot-correct {
  background: $success;
}

.dot-wrong {
  background: $danger;
}

.dot-empty {
  background: $border;
}

.grid-scroll {
  max-height: 46vh;
}

.grid {
  display: flex;
  flex-wrap: wrap;
}

.cell {
  display: flex;
  width: 16.666%;
  height: 84rpx;
  padding: 6rpx;
}

.cell-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  background: #f3f4f6;
  color: $text;
  font-size: 24rpx;
}

.cell-inner.is-current {
  background: $primary;
  color: #ffffff;
}

.cell-inner.is-correct {
  background: $success-soft;
  color: $success;
}

.cell-inner.is-wrong {
  background: $danger-soft;
  color: $danger;
}

.pager {
  margin-top: 12rpx;
}
</style>
