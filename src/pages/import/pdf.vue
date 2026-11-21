<template>
  <view class="page pdf-page">
    <StatusBar />
    <NavBar title="PDF 导入" />

    <view class="header">
      <view class="status-pill">
        <text class="tag gate-tag">P1 · 待验证</text>
        <text class="gate-note">当前版本仅支持 JSON 导入</text>
      </view>
      <text class="display header-title">PDF 解析，先验证再上线</text>
      <text class="header-sub">解析依赖小程序端的文本提取能力，需要先通过兼容性验证。</text>
    </view>

    <view class="section">
      <SectionTitle title="支持范围" />
      <view class="card scope-card">
        <view class="scope-row">
          <view class="scope-icon-wrap ok-wrap">
            <text class="scope-icon ok-icon">✓</text>
          </view>
          <view class="grow scope-texts">
            <text class="scope-title">文本型 PDF</text>
            <text class="scope-sub">文字可被选中、复制</text>
          </view>
        </view>
        <view class="scope-divider" />
        <view class="scope-row">
          <view class="scope-icon-wrap no-wrap">
            <text class="scope-icon no-icon">×</text>
          </view>
          <view class="grow scope-texts">
            <text class="scope-title">扫描件 / 纯图片 PDF</text>
            <text class="scope-sub">纯前端无法 OCR 识别</text>
          </view>
        </view>
        <view class="scope-divider" />
        <view class="scope-row">
          <view class="scope-icon-wrap warn-wrap">
            <text class="scope-icon warn-icon">△</text>
          </view>
          <view class="grow scope-texts">
            <text class="scope-title">无 ToUnicode 的中文 PDF</text>
            <text class="scope-sub">文本可能是乱码</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="现在可以怎么做" />
      <view class="card todo-card">
        <view class="todo-row">
          <view class="todo-dot"><text class="todo-no">1</text></view>
          <text class="grow todo-text">在电脑上把 PDF 中的题目整理为 quizbank/v1 JSON</text>
        </view>
        <view class="todo-row">
          <view class="todo-dot"><text class="todo-no">2</text></view>
          <text class="grow todo-text">把 JSON 发送到「文件传输助手」</text>
        </view>
        <view class="todo-row">
          <view class="todo-dot"><text class="todo-no">3</text></view>
          <text class="grow todo-text">回到「导入题库」选择文件，预览后导入</text>
        </view>
      </view>
    </view>

    <button class="btn btn-primary cta-btn" @tap="goImport">
      <text class="cta-icon">▤</text>
      <text>去导入 JSON</text>
    </button>

    <view class="section">
      <SectionTitle title="后续计划" />
      <view class="plan-chips">
        <text class="plan-chip">文本层提取</text>
        <text class="plan-chip">版面重建</text>
        <text class="plan-chip">题号与选项</text>
        <text class="plan-chip">解析拆句</text>
      </view>
      <text class="plan-note">验证不通过时，会提供桌面端 PDF 转换工具作为兜底。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import SectionTitle from '@/components/SectionTitle.vue'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'

function goImport(): void {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.page {
  padding: 0 48rpx calc(48rpx + env(safe-area-inset-bottom));
}

.header {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding-top: 12rpx;
}

.status-pill {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.gate-tag {
  background: $sand;
  color: #8a6a2e;
  font-size: 17rpx;
}

.gate-note {
  color: $text-light;
  font-size: 18rpx;
}

.header-title {
  font-size: 44rpx;
}

.header-sub {
  color: $text-sub;
  font-size: 21rpx;
  line-height: 1.6;
}

.scope-card {
  overflow: hidden;
  padding: 0 26rpx;
}

.scope-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 0;
}

.scope-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
}

.ok-wrap {
  background: $primary-soft;
}

.no-wrap {
  background: $danger-soft;
}

.warn-wrap {
  background: $sand;
}

.scope-icon {
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1;
}

.ok-icon {
  color: $success;
}

.no-icon {
  color: $danger;
}

.warn-icon {
  color: $warning;
}

.scope-texts {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.scope-title {
  color: $text;
  font-size: 22rpx;
  font-weight: 600;
}

.scope-sub {
  color: $text-light;
  font-size: 18rpx;
}

.scope-divider {
  height: 1rpx;
  background: #f0ece2;
}

.todo-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 26rpx 28rpx;
}

.todo-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 18rpx;
}

.todo-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
  border-radius: 999rpx;
  background: $cream;
}

.todo-no {
  color: #8a7a52;
  font-size: 17rpx;
  font-weight: 600;
}

.todo-text {
  color: $text-sub;
  font-size: 21rpx;
  line-height: 1.5;
}

.cta-btn {
  height: 92rpx;
  margin-top: 28rpx;
  gap: 14rpx;
  border-radius: 28rpx;
}

.cta-icon {
  color: $cream;
  font-size: 30rpx;
  line-height: 1;
}

.plan-chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
}

.plan-chip {
  padding: 12rpx 20rpx;
  border: 1rpx solid $border;
  border-radius: 999rpx;
  background: $card;
  color: $text-light;
  font-size: 18rpx;
}

.plan-note {
  display: block;
  color: $text-light;
  font-size: 18rpx;
  line-height: 1.6;
}
</style>
