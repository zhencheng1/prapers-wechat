<template>
  <view class="page">
    <view class="card status-card">
      <view class="row between">
        <text class="title">PDF 导入</text>
        <text class="badge">P1 · 待验证</text>
      </view>
      <text class="small muted status-text">
        当前版本优先保证 JSON 导入与刷题闭环。PDF 解析依赖 pdf.js 在小程序端的文本提取能力，
        需要先通过兼容性验证（Gate）后才会内置。
      </text>
    </view>

    <view class="section">
      <SectionTitle title="支持范围" />
      <view class="card list-card">
        <view class="list-row">
          <text class="dot ok-dot">✓</text>
          <text class="small">文本型 PDF：文字可被选中、复制</text>
        </view>
        <view class="list-row">
          <text class="dot no-dot">×</text>
          <text class="small">扫描件 / 纯图片 PDF：纯前端无法 OCR</text>
        </view>
        <view class="list-row">
          <text class="dot no-dot">×</text>
          <text class="small">无 ToUnicode 的中文 PDF：文本可能是乱码</text>
        </view>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="现在可以怎么做" />
      <view class="card">
        <text class="small muted guide-text">
          1. 在电脑上把 PDF 中的题目整理为 quizbank/v1 JSON；
          2. 将 JSON 发送到微信「文件传输助手」；
          3. 回到本页选择「JSON 导入」，预览后导入。
        </text>
        <button class="btn btn-primary guide-btn" @tap="goImport">去导入 JSON</button>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="后续计划" />
      <view class="card">
        <text class="small muted guide-text">
          完成 M0 验证后，将补充：文本层提取、版面重建、题号/选项/答案解析、预览修正。
          验证不通过时，会提供桌面端 PDF → JSON 转换工具作为兜底。
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import SectionTitle from '@/components/SectionTitle.vue'

function goImport(): void {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.status-card {
  padding: 32rpx;
}

.badge {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: $warning-soft;
  color: #92400e;
  font-size: 20rpx;
}

.status-text {
  display: block;
  margin-top: 16rpx;
  line-height: 1.7;
}

.list-card {
  padding: 12rpx 24rpx;
}

.list-row {
  display: flex;
  align-items: flex-start;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $border;
}

.list-row:last-child {
  border-bottom: none;
}

.dot {
  width: 40rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  font-weight: 700;
}

.ok-dot {
  color: $success;
}

.no-dot {
  color: $danger;
}

.guide-text {
  display: block;
  line-height: 1.8;
}

.guide-btn {
  margin-top: 24rpx;
}
</style>
