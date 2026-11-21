<template>
  <view class="page">
    <view class="section first">
      <SectionTitle title="刷题偏好" />
      <view class="card group">
        <picker
          :range="analysisLabels"
          :value="analysisIndex"
          @change="onAnalysisChange"
        >
          <view class="form-row">
            <view class="grow">
              <text class="form-label">解析显示</text>
              <text class="form-sub">答完题后何时展示解析</text>
            </view>
            <text class="form-value">{{ analysisLabels[analysisIndex] }}</text>
            <text class="chev">›</text>
          </view>
        </picker>

        <view class="form-row">
          <view class="grow">
            <text class="form-label">自动下一题</text>
            <text class="form-sub">答对后自动进入下一题</text>
          </view>
          <switch
            :checked="settingsStore.settings.autoNext"
            color="#4f6ef7"
            @change="onAutoNextChange"
          />
        </view>

        <picker
          :range="fontSizeLabels"
          :value="fontSizeIndex"
          @change="onFontSizeChange"
        >
          <view class="form-row">
            <view class="grow">
              <text class="form-label">字号</text>
              <text class="form-sub">影响题干与解析</text>
            </view>
            <text class="form-value">{{ fontSizeLabels[fontSizeIndex] }}</text>
            <text class="chev">›</text>
          </view>
        </picker>

        <picker
          :range="goalLabels"
          :value="goalIndex"
          @change="onGoalChange"
        >
          <view class="form-row">
            <view class="grow">
              <text class="form-label">每日目标</text>
              <text class="form-sub">首页进度按此计算</text>
            </view>
            <text class="form-value">{{ goalLabels[goalIndex] }}</text>
            <text class="chev">›</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="错题与考试" />
      <view class="card group">
        <picker
          :range="masterLabels"
          :value="settingsStore.settings.wrongMasterStreak"
          @change="onMasterChange"
        >
          <view class="form-row">
            <view class="grow">
              <text class="form-label">错题自动移出</text>
              <text class="form-sub">连续答对几次后视为掌握</text>
            </view>
            <text class="form-value">{{ masterLabels[settingsStore.settings.wrongMasterStreak] }}</text>
            <text class="chev">›</text>
          </view>
        </picker>

        <view class="form-row">
          <view class="grow">
            <text class="form-label">多选少选得分</text>
            <text class="form-sub">考试模式下少选得半分</text>
          </view>
          <switch
            :checked="settingsStore.settings.multiplePartialCredit"
            color="#4f6ef7"
            @change="onPartialChange"
          />
        </view>

        <picker
          :range="examCountLabels"
          :value="examCountIndex"
          @change="onExamCountChange"
        >
          <view class="form-row">
            <view class="grow">
              <text class="form-label">考试题量</text>
              <text class="form-sub">模拟考试抽取题数</text>
            </view>
            <text class="form-value">{{ examCountLabels[examCountIndex] }}</text>
            <text class="chev">›</text>
          </view>
        </picker>

        <picker
          :range="examDurationLabels"
          :value="examDurationIndex"
          @change="onExamDurationChange"
        >
          <view class="form-row">
            <view class="grow">
              <text class="form-label">考试时长</text>
              <text class="form-sub">交卷或倒计时结束统一判分</text>
            </view>
            <text class="form-value">{{ examDurationLabels[examDurationIndex] }}</text>
            <text class="chev">›</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="数据" />
      <view class="card group">
        <view class="form-row press" @tap="goBackup">
          <view class="grow">
            <text class="form-label">备份与恢复</text>
            <text class="form-sub">换手机或清缓存前请先导出</text>
          </view>
          <text class="chev">›</text>
        </view>
        <view class="form-row press" @tap="confirmClear">
          <view class="grow">
            <text class="form-label danger">清空所有数据</text>
            <text class="form-sub">题库、记录、设置全部删除</text>
          </view>
          <text class="chev">›</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="card group">
        <view class="form-row press" @tap="goAbout">
          <view class="grow">
            <text class="form-label">关于</text>
            <text class="form-sub">版本、隐私与免责声明</text>
          </view>
          <text class="chev">›</text>
        </view>
      </view>
    </view>

    <text class="foot-note">所有数据只保存在本机，不会上传。</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useSettingsStore } from '@/stores/settings'
import { clearAllData } from '@/services/bank'
import SectionTitle from '@/components/SectionTitle.vue'

const settingsStore = useSettingsStore()

const analysisValues = ['always', 'wrong', 'never'] as const
const analysisLabels = ['总是显示解析', '仅答错显示', '从不显示']
const analysisIndex = computed(() =>
  Math.max(0, analysisValues.indexOf(settingsStore.settings.showAnalysis)),
)

const fontSizeValues = ['sm', 'md', 'lg'] as const
const fontSizeLabels = ['小', '中', '大']
const fontSizeIndex = computed(() =>
  Math.max(0, fontSizeValues.indexOf(settingsStore.settings.fontSize)),
)

const goalValues = [10, 20, 30, 50]
const goalLabels = ['10 题', '20 题', '30 题', '50 题']
const goalIndex = computed(() =>
  Math.max(0, goalValues.indexOf(settingsStore.settings.dailyGoal)),
)

const masterLabels = ['不自动移出', '答对 1 次', '答对 2 次', '答对 3 次']

const examCountValues = [20, 50, 100]
const examCountLabels = ['20 题', '50 题', '100 题']
const examCountIndex = computed(() =>
  Math.max(0, examCountValues.indexOf(settingsStore.settings.examQuestionCount)),
)

const examDurationValues = [30, 45, 60, 90]
const examDurationLabels = ['30 分钟', '45 分钟', '60 分钟', '90 分钟']
const examDurationIndex = computed(() =>
  Math.max(0, examDurationValues.indexOf(settingsStore.settings.examDurationMin)),
)

onShow(() => {
  settingsStore.init()
})

function pickerIndex(event: any): number {
  return Number(event?.detail?.value ?? 0)
}

function onAnalysisChange(event: any): void {
  const value = analysisValues[pickerIndex(event)] ?? 'wrong'
  settingsStore.update({ showAnalysis: value })
}

function onFontSizeChange(event: any): void {
  const value = fontSizeValues[pickerIndex(event)] ?? 'md'
  settingsStore.update({ fontSize: value })
}

function onGoalChange(event: any): void {
  const value = goalValues[pickerIndex(event)] ?? 20
  settingsStore.update({ dailyGoal: value })
}

function onMasterChange(event: any): void {
  settingsStore.update({ wrongMasterStreak: pickerIndex(event) })
}

function onExamCountChange(event: any): void {
  const value = examCountValues[pickerIndex(event)] ?? 50
  settingsStore.update({ examQuestionCount: value })
}

function onExamDurationChange(event: any): void {
  const value = examDurationValues[pickerIndex(event)] ?? 60
  settingsStore.update({ examDurationMin: value })
}

function onAutoNextChange(event: any): void {
  settingsStore.update({ autoNext: Boolean(event?.detail?.value) })
}

function onPartialChange(event: any): void {
  settingsStore.update({ multiplePartialCredit: Boolean(event?.detail?.value) })
}

function goBackup(): void {
  uni.navigateTo({ url: '/pages/backup/index' })
}

function goAbout(): void {
  uni.navigateTo({ url: '/pages/about/index' })
}

function confirmClear(): void {
  uni.showModal({
    title: '清空所有数据',
    content: '题库、进度、错题、收藏、统计和设置都会被删除，且无法恢复。建议先导出备份。',
    confirmText: '清空',
    confirmColor: '#ef4444',
    success: async (result) => {
      if (!result.confirm) return
      uni.showLoading({ title: '正在清空…', mask: true })
      try {
        await clearAllData()
        uni.showToast({ title: '已清空', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' })
        }, 400)
      } finally {
        uni.hideLoading()
      }
    },
  })
}
</script>

<style scoped lang="scss">
.first {
  margin-top: 0;
}

.group {
  padding: 0 28rpx;
}

.form-row {
  display: flex;
  align-items: center;
  min-height: 100rpx;
  border-bottom: 1rpx solid $border;
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: $text;
}

.form-label.danger {
  color: $danger;
}

.form-sub {
  display: block;
  margin-top: 2rpx;
  font-size: 22rpx;
  color: $text-light;
}

.form-value {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: $text-sub;
}

.chev {
  margin-left: 10rpx;
  color: $text-light;
  font-size: 32rpx;
}

.foot-note {
  display: block;
  margin-top: 40rpx;
  text-align: center;
  font-size: 22rpx;
  color: $text-light;
}
</style>
