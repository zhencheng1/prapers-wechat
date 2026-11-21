<template>
  <view
    class="option-row press"
    :class="[stateClass, type === 'multiple' ? 'is-multiple' : '']"
    @tap="emit('select', option.key)"
  >
    <view
      class="option-key"
      :class="{ checked: type === 'multiple' && selected }"
    >
      {{ option.key }}
    </view>
    <text class="option-text">{{ option.text }}</text>
    <text v-if="mark" class="option-mark">{{ mark }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QuestionOption, QuestionType } from '@/types/domain'

const props = defineProps<{
  option: QuestionOption
  type: QuestionType
  selected: boolean
  submitted: boolean
  correctKeys: string[]
  picked: string[]
}>()

const emit = defineEmits<{ (event: 'select', key: string): void }>()

const stateClass = computed(() => {
  if (props.submitted) {
    if (props.correctKeys.includes(props.option.key)) return 'is-correct'
    if (props.picked.includes(props.option.key)) return 'is-wrong'
    return 'is-muted'
  }
  return props.selected ? 'is-selected' : ''
})

const mark = computed(() => {
  if (!props.submitted) return ''
  if (props.correctKeys.includes(props.option.key)) return '✓'
  if (props.picked.includes(props.option.key)) return '✕'
  return ''
})
</script>

<style scoped lang="scss">
.option-row {
  display: flex;
  align-items: center;
  min-height: 100rpx;
  margin-bottom: 18rpx;
  padding: 20rpx 24rpx;
  border: 2rpx solid $border;
  border-radius: $radius-sm;
  background: $card;
}

.option-key {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  margin-right: 20rpx;
  border-radius: 50%;
  background: $bg;
  color: $text-sub;
  font-family: $font-display;
  font-size: 26rpx;
  font-weight: 600;
}

.option-key.checked {
  border-radius: 12rpx;
  background: $primary;
  color: #ffffff;
}

.option-text {
  flex: 1;
  font-size: 28rpx;
  line-height: 1.5;
  color: $text;
}

.option-mark {
  margin-left: 12rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.is-selected {
  border-color: $primary;
  background: $primary-soft;

  .option-key {
    background: $primary;
    color: #ffffff;
  }
}

.is-correct {
  border-color: $success;
  background: $success-soft;

  .option-key {
    background: $success;
    color: #ffffff;
  }

  .option-mark {
    color: $success;
  }
}

.is-wrong {
  border-color: $danger;
  background: $danger-soft;

  .option-key {
    background: $danger;
    color: #ffffff;
  }

  .option-mark {
    color: $danger;
  }
}

.is-muted {
  opacity: 0.55;
}
</style>
