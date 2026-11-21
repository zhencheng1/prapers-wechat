<template>
  <view class="page">
    <StatusBar />
    <NavBar title="关于" />

    <view class="identity">
      <view class="app-icon">
        <text class="app-icon-glyph">刷</text>
      </view>
      <text class="app-name">刷题盒子</text>
      <view class="version-row">
        <view class="version-pill">
          <text class="version-text">{{ appVersion }}</text>
        </view>
        <text class="version-note">纯前端本地刷题</text>
      </view>
    </view>

    <view class="info-section">
      <SectionTitle title="它是什么" />
      <view class="info-card">
        <view class="info-icon">
          <text class="info-glyph">▤</text>
        </view>
        <text class="info-body">
          一个基于 uni-app + Vue3 + Vite + TypeScript 的微信小程序，支持导入本地题库、顺序 /
          随机 / 错题 / 收藏 / 模拟考试，自动收错题并记录统计。
        </text>
      </view>
    </view>

    <view class="info-section">
      <SectionTitle title="数据与隐私" />
      <view class="info-card">
        <view class="info-icon">
          <text class="info-glyph">✓</text>
        </view>
        <text class="info-body">
          没有服务端、没有账号、没有网络请求。题目、答题记录、错题、收藏与统计只保存在本机。清理缓存或文件后数据可能丢失，请定期导出备份。
        </text>
      </view>
    </view>

    <view class="info-section">
      <SectionTitle title="免责声明" />
      <view class="info-card">
        <view class="info-icon">
          <text class="info-glyph">§</text>
        </view>
        <text class="info-body">
          本工具仅提供本地存储与练习能力，不提供题库内容。导入题库的版权、准确性与合规性由导入者负责。
        </text>
      </view>
    </view>

    <view class="info-section">
      <SectionTitle title="技术栈" />
      <view class="tech-card">
        <view class="tech-item">
          <text class="tech-name">uni-app + Vue3</text>
          <text class="tech-role">跨端框架</text>
        </view>
        <view class="tech-divider" />
        <view class="tech-item">
          <text class="tech-name">Vite + TS</text>
          <text class="tech-role">构建与类型</text>
        </view>
        <view class="tech-divider" />
        <view class="tech-item">
          <text class="tech-name">Pinia</text>
          <text class="tech-role">状态管理</text>
        </view>
      </view>
    </view>

    <view class="foot-space" />
    <view class="footer">
      <text class="footer-mark">用本地数据，安心刷题</text>
      <text class="footer-copy">Made for 微信小程序</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { APP_VERSION } from '@/core/appInfo'
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'
import SectionTitle from '@/components/SectionTitle.vue'

const appVersion = APP_VERSION
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  padding: 0 48rpx calc(32rpx + env(safe-area-inset-bottom));
}

/* 品牌标识 */
.identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
  padding-top: 20rpx;
}

.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border-radius: 40rpx;
  background: linear-gradient(-125deg, #2a5b49 14%, #173a2f 86%);
}

.app-icon-glyph {
  font-family: $font-display;
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1;
  color: $cream;
}

.app-name {
  font-family: $font-display;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.2;
  color: $text;
}

.version-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
}

.version-pill {
  padding: 8rpx 20rpx;
  border: 1rpx solid $border;
  border-radius: 999rpx;
  background: $card;
}

.version-text {
  font-family: Inter, system-ui, sans-serif;
  font-size: 18rpx;
  font-weight: 600;
  color: $text-sub;
}

.version-note {
  font-size: 19rpx;
  color: $text-light;
}

/* 信息区块 */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 28rpx;
}

.info-section :deep(.section-head) {
  margin-bottom: 0;
}

.info-section :deep(.section-title) {
  font-size: 21rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
  color: $text-light;
}

.info-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 20rpx;
  padding: 26rpx 28rpx;
  border: 1rpx solid $border;
  border-radius: 30rpx;
  background: $card;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48rpx;
  height: 48rpx;
  border-radius: 16rpx;
  background: $primary-soft;
}

.info-glyph {
  font-size: 26rpx;
  line-height: 1;
  color: $primary-deep;
}

.info-body {
  flex: 1;
  min-width: 0;
  font-size: 20rpx;
  line-height: 36rpx;
  color: $text-sub;
}

/* 技术栈 */
.tech-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 26rpx 24rpx;
  border: 1rpx solid $border;
  border-radius: 30rpx;
  background: $card;
}

.tech-item {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.tech-name {
  max-width: 100%;
  font-family: Inter, system-ui, sans-serif;
  font-size: 19rpx;
  font-weight: 600;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tech-role {
  max-width: 100%;
  font-size: 17rpx;
  color: $text-light;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tech-divider {
  flex-shrink: 0;
  width: 1rpx;
  height: 48rpx;
  background: $border;
}

/* 页脚 */
.foot-space {
  flex: 1;
  min-height: 48rpx;
}

.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 0 32rpx;
}

.footer-mark {
  font-family: $font-display;
  font-size: 20rpx;
  color: $text-light;
}

.footer-copy {
  font-family: Inter, system-ui, sans-serif;
  font-size: 17rpx;
  color: #b8b0a0;
}
</style>
