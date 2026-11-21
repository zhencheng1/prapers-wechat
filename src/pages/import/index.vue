<template>
  <view class="page import-page">
    <StatusBar />
    <NavBar title="导入题库" />

    <view class="header">
      <text class="eyebrow header-eyebrow">本地导入 · 不上传</text>
      <text class="display header-title">把题库带进手机</text>
    </view>

    <view class="card json-card press" @tap="chooseJson">
      <view class="row json-row">
        <view class="json-icon-wrap">
          <text class="json-icon">?</text>
        </view>
        <view class="grow json-texts">
          <text class="json-title">选择 JSON 文件</text>
          <text class="small json-sub">推荐 quizbank/v1 格式</text>
        </view>
        <view class="json-action">
          <text class="json-action-icon">↑</text>
        </view>
      </view>
      <view class="json-note">
        <text class="note-icon">ⓘ</text>
        <text class="note-text">微信中请先把文件发送到「文件传输助手」，再从聊天记录中选择。</text>
      </view>
    </view>

    <view class="card pdf-card press" @tap="goPdf">
      <view class="pdf-icon-wrap">
        <text class="pdf-icon">▤</text>
      </view>
      <view class="grow pdf-texts">
        <view class="row pdf-title-row">
          <text class="pdf-title">PDF 导入</text>
          <text class="tag pdf-tag">P1 · 待验证</text>
        </view>
        <text class="small pdf-sub">文本型 PDF 需先通过兼容性验证</text>
      </view>
      <text class="pdf-chevron">›</text>
    </view>

    <view class="section">
      <SectionTitle title="格式说明">
        <text class="format-note">quizbank/v1</text>
      </SectionTitle>
      <view class="card format-card">
        <view class="format-row">
          <text class="format-key">schema</text>
          <text class="req-tag">必填</text>
          <text class="format-value">quizbank/v1</text>
        </view>
        <view class="format-divider" />
        <view class="format-row">
          <text class="format-key">meta.name、questions</text>
          <text class="req-tag">必填</text>
          <text class="format-value">数组</text>
        </view>
        <view class="format-divider" />
        <view class="format-row">
          <text class="format-key">题型</text>
          <text class="format-value">single · multiple · judge</text>
        </view>
        <view class="format-divider" />
        <view class="format-row">
          <text class="format-key">答案</text>
          <text class="format-value">["A"] · ["A","C"]</text>
        </view>
        <view class="format-divider" />
        <view class="format-row">
          <text class="format-key">判断</text>
          <text class="format-value">A = 正确，B = 错误</text>
        </view>
      </view>
    </view>

    <view class="sample-wrap">
      <view class="card sample-card press" @tap="showExample = !showExample">
        <text class="sample-icon">&lt;/&gt;</text>
        <text class="grow sample-label">查看示例片段</text>
        <text class="sample-chevron" :class="{ open: showExample }">⌄</text>
      </view>
      <view v-if="showExample" class="example-box">
        <scroll-view scroll-x class="example-scroll">
          <text class="example-text">{{ exampleText }}</text>
        </scroll-view>
      </view>
    </view>

    <view class="steps-wrap">
      <view class="steps-card">
        <view class="step">
          <view class="step-dot"><text class="step-no">1</text></view>
          <text class="step-label">选择文件</text>
        </view>
        <text class="step-arrow">›</text>
        <view class="step">
          <view class="step-dot"><text class="step-no">2</text></view>
          <text class="step-label">校验预览</text>
        </view>
        <text class="step-arrow">›</text>
        <view class="step">
          <view class="step-dot"><text class="step-no">3</text></view>
          <text class="step-label">开始刷题</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <text class="footer-line">导入前会先校验并预览，错误题目可在预览页修正或跳过。</text>
      <text class="footer-line">单文件上限 {{ jsonLimitMb }}MB · 单库上限 {{ questionLimit }} 题</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { parseBankText } from '@/core/import/parseBank'
import { pickJsonFile } from '@/services/filePicker'
import { useImportStore } from '@/stores/import'
import { JSON_LIMIT_MB, QUESTION_LIMIT } from '@/core/appInfo'
import SectionTitle from '@/components/SectionTitle.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

const importStore = useImportStore()
const showExample = ref(false)
const jsonLimitMb = JSON_LIMIT_MB
const questionLimit = QUESTION_LIMIT

const exampleText = `{
  "schema": "quizbank/v1",
  "meta": { "name": "计算机网络" },
  "questions": [
    {
      "type": "single",
      "stem": "TCP 属于哪一层协议？",
      "options": [
        { "key": "A", "text": "应用层" },
        { "key": "B", "text": "传输层" }
      ],
      "answer": ["B"],
      "analysis": "TCP 是传输层协议。",
      "chapter": "第一章 网络基础",
      "tags": ["TCP"],
      "difficulty": 1
    }
  ]
}`

onLoad(() => {
  importStore.clear()
})

async function chooseJson(): Promise<void> {
  uni.showLoading({ title: '读取文件…', mask: true })
  try {
    const file = await pickJsonFile()
    if (!file) return
    const draft = parseBankText(file.text)
    importStore.setDraft(draft)
    uni.navigateTo({ url: '/pages/import/preview' })
  } catch (error) {
    const message = error instanceof Error ? error.message : '导入失败'
    uni.showModal({ title: '导入失败', content: message, showCancel: false })
  } finally {
    uni.hideLoading()
  }
}

function goPdf(): void {
  uni.navigateTo({ url: '/pages/import/pdf' })
}
</script>

<style scoped lang="scss">
.page {
  padding: 0 48rpx calc(48rpx + env(safe-area-inset-bottom));
}

.header {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding-top: 12rpx;
}

.header-eyebrow {
  color: $text-sub;
  letter-spacing: 0;
}

.header-title {
  font-size: 46rpx;
}

.json-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 28rpx;
  padding: 28rpx;
}

.json-row {
  gap: 24rpx;
}

.json-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  flex-shrink: 0;
  border-radius: 28rpx;
  background: $primary-soft;
}

.json-icon {
  color: $primary-deep;
  font-family: $font-display;
  font-size: 40rpx;
  font-weight: 600;
}

.json-texts {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.json-title {
  color: $text;
  font-size: 26rpx;
  font-weight: 600;
}

.json-sub {
  color: $text-light;
}

.json-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
  border-radius: 18rpx;
  background: $primary;
}

.json-action-icon {
  color: $cream;
  font-size: 32rpx;
  line-height: 1;
}

.json-note {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: $cream;
}

.note-icon {
  flex-shrink: 0;
  color: #8a7a52;
  font-size: 26rpx;
  line-height: 1.4;
}

.note-text {
  flex: 1;
  color: #8a7a52;
  font-size: 20rpx;
  line-height: 1.5;
}

.pdf-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
}

.pdf-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  border-radius: 24rpx;
  background: $cream;
}

.pdf-icon {
  color: $text-light;
  font-size: 36rpx;
}

.pdf-texts {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.pdf-title-row {
  gap: 12rpx;
}

.pdf-title {
  color: $text;
  font-size: 26rpx;
  font-weight: 600;
}

.pdf-tag {
  background: $sand;
  color: #8a6a2e;
  font-size: 18rpx;
}

.pdf-sub {
  color: $text-light;
}

.pdf-chevron {
  flex-shrink: 0;
  margin-left: 12rpx;
  color: $text-light;
  font-size: 40rpx;
  line-height: 1;
}

.format-note {
  color: $primary;
  font-size: 20rpx;
  font-weight: 600;
}

.format-card {
  padding: 12rpx 28rpx;
}

.format-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  min-height: 68rpx;
}

.format-key {
  flex-shrink: 0;
  color: $text;
  font-size: 20rpx;
  font-weight: 500;
}

.req-tag {
  flex-shrink: 0;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  background: $warning-soft;
  color: $warning;
  font-size: 16rpx;
  font-weight: 600;
}

.format-value {
  flex: 1;
  min-width: 0;
  color: $text-sub;
  font-size: 20rpx;
  text-align: right;
}

.format-divider {
  height: 1rpx;
  background: #f0ece2;
}

.sample-wrap {
  margin-top: 20rpx;
}

.sample-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  padding: 22rpx 26rpx;
}

.sample-icon {
  flex-shrink: 0;
  color: $text-light;
  font-family: monospace;
  font-size: 26rpx;
}

.sample-label {
  color: $text;
  font-size: 22rpx;
  font-weight: 500;
}

.sample-chevron {
  flex-shrink: 0;
  color: $text-light;
  font-size: 30rpx;
  line-height: 1;
  transition: transform 0.2s ease;
  transform: rotate(0deg);
}

.sample-chevron.open {
  transform: rotate(180deg);
}

.example-box {
  margin-top: 12rpx;
  padding: 24rpx;
  border: 1rpx solid $border;
  border-radius: 24rpx;
  background: $cream;
}

.example-scroll {
  width: 100%;
  white-space: nowrap;
}

.example-text {
  display: inline-block;
  color: $text-sub;
  font-family: Menlo, Consolas, monospace;
  font-size: 20rpx;
  line-height: 1.6;
  white-space: pre;
}

.steps-wrap {
  margin-top: 24rpx;
}

.steps-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 26rpx 28rpx;
  border-radius: 30rpx;
  background: $primary-soft;
}

.step {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14rpx;
}

.step-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  flex-shrink: 0;
  border-radius: 999rpx;
  background: $primary-deep;
}

.step-no {
  color: $cream;
  font-size: 18rpx;
  font-weight: 600;
}

.step-label {
  color: $primary-deep;
  font-size: 20rpx;
  font-weight: 500;
}

.step-arrow {
  color: #7fa091;
  font-size: 26rpx;
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 36rpx;
  padding: 0 4rpx;
}

.footer-line {
  color: $text-light;
  font-size: 18rpx;
  line-height: 1.6;
}
</style>
