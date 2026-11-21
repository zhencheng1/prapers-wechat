<template>
  <view class="page">
    <view class="card about-head">
      <view class="logo">刷</view>
      <text class="app-name">刷题盒子</text>
      <text class="small muted">v1.0.0 · 纯前端本地刷题</text>
    </view>

    <view class="section">
      <SectionTitle title="它是什么" />
      <view class="card">
        <text class="small muted paragraph">
          一个基于 uni-app + Vue3 + Vite + TypeScript 的微信小程序。
          支持导入本地题库、顺序/随机/错题/收藏/模拟考试，自动收错题、记录统计。
        </text>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="数据与隐私" />
      <view class="card">
        <text class="small muted paragraph">
          没有服务端、没有账号、没有网络请求。题目、答题记录、错题、收藏、统计只保存在本机。
          小程序缓存或本地文件被清理后数据可能丢失，请定期在「备份与恢复」中导出。
        </text>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="免责声明" />
      <view class="card">
        <text class="small muted paragraph">
          本工具仅提供本地存储与练习能力，不提供题库内容。导入题库的版权、准确性与合规性由导入者负责。
        </text>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="技术栈" />
      <view class="card">
        <view class="tech-row">
          <text class="small">uni-app + Vue3</text>
          <text class="small light">跨端框架</text>
        </view>
        <view class="tech-row">
          <text class="small">Vite + TypeScript</text>
          <text class="small light">构建与类型</text>
        </view>
        <view class="tech-row">
          <text class="small">Pinia</text>
          <text class="small light">状态管理</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import SectionTitle from '@/components/SectionTitle.vue'
</script>

<style scoped lang="scss">
.about-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  height: 128rpx;
  margin-bottom: 20rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #5b79ff, #6d5ef7);
  color: #ffffff;
  font-size: 56rpx;
  font-weight: 700;
}

.app-name {
  font-size: 36rpx;
  font-weight: 700;
}

.paragraph {
  display: block;
  line-height: 1.8;
}

.tech-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid $border;
}

.tech-row:last-child {
  border-bottom: none;
}
</style>
