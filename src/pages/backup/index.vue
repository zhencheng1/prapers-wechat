<template>
  <view class="page">
    <StatusBar />
    <NavBar title="备份与恢复" />

    <view class="head">
      <text class="head-eyebrow">数据 · 仅在本机</text>
      <text class="head-title">先备份，再折腾</text>
    </view>

    <view class="tip-wrap">
      <view class="tip-card">
        <view class="tip-icon">
          <text class="tip-glyph">!</text>
        </view>
        <text class="tip-text">
          换手机、清理缓存或卸载小程序前，请先导出备份文件并发送到微信聊天保存。
        </text>
      </view>
    </view>

    <view class="stats-wrap">
      <view class="stats-card">
        <view class="stat">
          <text class="stat-value">{{ bankCount }} 个</text>
          <text class="stat-label">题库</text>
        </view>
        <view class="stat-divider" />
        <view class="stat">
          <text class="stat-value">{{ questionCount }} 题</text>
          <text class="stat-label">题目</text>
        </view>
        <view class="stat-divider" />
        <view class="stat">
          <text class="stat-value stat-value-warn">{{ lastBackupText }}</text>
          <text class="stat-label">上次备份</text>
        </view>
      </view>
    </view>

    <view class="actions">
      <button class="btn action export" :disabled="loading" @tap="exportData">
        <text class="glyph">↓</text>
        <text>导出备份文件</text>
      </button>
      <button class="btn action outline" :disabled="loading" @tap="importData">
        <text class="glyph">↑</text>
        <text>从备份恢复</text>
      </button>
      <button class="btn action outline clear" :disabled="loading" @tap="clearData">
        <view class="trash" />
        <text>一键清空数据</text>
      </button>
    </view>

    <view class="info">
      <text class="info-title">备份包含什么</text>
      <view class="info-card">
        <view class="chip-row">
          <text class="chip">题库与题目</text>
          <text class="chip">练习进度</text>
          <text class="chip">错题记录</text>
        </view>
        <view class="chip-row">
          <text class="chip">收藏</text>
          <text class="chip">统计</text>
          <text class="chip">设置</text>
        </view>
        <text class="info-body">恢复时会覆盖当前所有题库与记录，建议先导出一次现有数据。</text>
      </view>
    </view>

    <view class="foot-space" />
    <text class="footer-note">备份文件为 JSON 格式，可自行保存到聊天或网盘</text>
  </view>
</template>

<script setup lang="ts">
import StatusBar from '@/components/StatusBar.vue'
import NavBar from '@/components/NavBar.vue'
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import {
  buildBackup,
  exportBackupFile,
  parseBackupText,
  restoreBackup,
} from '@/services/backup'
import { pickJsonFile } from '@/services/filePicker'
import { confirmAndClearAllData } from '@/services/localData'
import { MAX_BACKUP_BYTES } from '@/core/constants'
import { formatRelativeTime } from '@/utils'

const appStore = useAppStore()
const bankStore = useBankStore()

const loading = ref(false)
const backupAt = ref(0)

const bankCount = computed(() => bankStore.banks.length)
const questionCount = computed(() =>
  bankStore.banks.reduce((total, bank) => total + bank.questionCount, 0),
)
const lastBackupText = computed(() =>
  backupAt.value ? formatRelativeTime(backupAt.value) : '从未备份',
)

onShow(async () => {
  await appStore.ensureReady()
  await bankStore.refresh()
  appStore.refreshMeta()
  backupAt.value = appStore.meta.lastBackupAt
})

async function exportData(): Promise<void> {
  if (loading.value) return
  loading.value = true
  uni.showLoading({ title: '正在打包…', mask: true })
  try {
    const data = await buildBackup()
    await exportBackupFile(data)
    appStore.markBackup()
    backupAt.value = appStore.meta.lastBackupAt
    uni.showToast({ title: '已导出', icon: 'success' })
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败'
    if (!message.includes('cancel')) {
      uni.showModal({ title: '导出失败', content: message, showCancel: false })
    }
  } finally {
    loading.value = false
    uni.hideLoading()
  }
}

async function importData(): Promise<void> {
  if (loading.value) return
  try {
    const file = await pickJsonFile(MAX_BACKUP_BYTES)
    if (!file) return
    const data = parseBackupText(file.text)
    uni.showModal({
      title: '确认恢复',
      content: `将覆盖当前所有数据，并恢复 ${data.banks.length} 个题库。确定吗？`,
      confirmText: '恢复',
      confirmColor: '#ef4444',
      success: async (result) => {
        if (!result.confirm) return
        loading.value = true
        uni.showLoading({ title: '正在恢复…', mask: true })
        try {
          const count = await restoreBackup(data)
          appStore.refreshMeta()
          uni.showToast({ title: `已恢复 ${count} 个题库`, icon: 'none' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/index/index' })
          }, 600)
        } catch (error) {
          const message = error instanceof Error ? error.message : '恢复失败'
          uni.showModal({ title: '恢复失败', content: message, showCancel: false })
        } finally {
          loading.value = false
          uni.hideLoading()
        }
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '读取备份失败'
    uni.showModal({ title: '读取失败', content: message, showCancel: false })
  }
}

function clearData(): void {
  if (loading.value) return
  confirmAndClearAllData()
}
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  padding: 0 48rpx calc(32rpx + env(safe-area-inset-bottom));
}

/* 页头 */
.head {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding-top: 6rpx;
}

.head-eyebrow {
  font-size: 21rpx;
  color: $text-sub;
}

.head-title {
  font-family: $font-display;
  font-size: 44rpx;
  font-weight: 700;
  line-height: 58rpx;
  color: $text;
}

/* 提示条 */
.tip-wrap {
  padding-top: 24rpx;
}

.tip-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 18rpx;
  padding: 22rpx 26rpx;
  border-radius: 28rpx;
  background: $cream;
}

.tip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30rpx;
  height: 30rpx;
  border-radius: 8rpx;
  background: rgba(138, 122, 82, 0.12);
}

.tip-glyph {
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
  color: #8a7a52;
}

.tip-text {
  flex: 1;
  min-width: 0;
  font-size: 19rpx;
  line-height: 30rpx;
  color: #8a7a52;
}

/* 统计卡 */
.stats-wrap {
  padding-top: 24rpx;
}

.stats-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 26rpx 28rpx;
  border: 1rpx solid $border;
  border-radius: 32rpx;
  background: $card;
}

.stat {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  max-width: 100%;
  font-family: $font-display;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.2;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-value-warn {
  font-size: 26rpx;
  color: $warning;
}

.stat-label {
  font-size: 18rpx;
  color: $text-light;
}

.stat-divider {
  flex-shrink: 0;
  width: 1rpx;
  height: 48rpx;
  background: $border;
}

/* 操作按钮 */
.actions {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding-top: 32rpx;
}

.action {
  width: 100%;
  height: 92rpx;
  gap: 14rpx;
  font-size: 25rpx;
  font-weight: 600;
}

.action::after {
  border: none;
}

.action.export {
  border-radius: 28rpx;
  background: $primary;
  color: $cream;
}

.action.outline {
  height: 88rpx;
  border: 1rpx solid $border;
  border-radius: 26rpx;
  background: $card;
  color: $text-sub;
  font-size: 24rpx;
  font-weight: 500;
}

.action.clear {
  color: $danger;
}

.glyph {
  font-size: 30rpx;
  line-height: 1;
}

.trash {
  position: relative;
  width: 22rpx;
  height: 24rpx;
  border: 2rpx solid $danger;
  border-radius: 4rpx;
}

.trash::before {
  content: '';
  position: absolute;
  left: -2rpx;
  right: -2rpx;
  top: -8rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: $danger;
}

/* 备份包含什么 */
.info {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding-top: 36rpx;
}

.info-title {
  font-size: 21rpx;
  font-weight: 600;
  letter-spacing: 3rpx;
  color: $text-light;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 26rpx 28rpx;
  border: 1rpx solid $border;
  border-radius: 30rpx;
  background: $card;
}

.chip-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
}

.chip {
  padding: 8rpx 18rpx;
  border-radius: 14rpx;
  background: $primary-soft;
  font-size: 18rpx;
  line-height: 1.4;
  color: $primary-deep;
}

.info-body {
  font-size: 19rpx;
  line-height: 30rpx;
  color: $text-light;
}

/* 页脚 */
.foot-space {
  flex: 1;
  min-height: 48rpx;
}

.footer-note {
  padding: 16rpx 0 32rpx;
  text-align: center;
  font-size: 18rpx;
  color: $text-light;
}
</style>
