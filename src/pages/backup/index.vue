<template>
  <view class="page">
    <view class="card summary">
      <text class="title">备份与恢复</text>
      <text class="small muted summary-text">
        数据只在本机。换手机、清理缓存或卸载小程序前，请先导出备份文件并发送到微信聊天保存。
      </text>

      <view class="row between summary-row">
        <text class="small muted">题库</text>
        <text class="small bold">{{ bankCount }} 个</text>
      </view>
      <view class="row between summary-row">
        <text class="small muted">题目</text>
        <text class="small bold">{{ questionCount }} 题</text>
      </view>
      <view class="row between summary-row">
        <text class="small muted">上次备份</text>
        <text class="small bold">{{ lastBackupText }}</text>
      </view>
    </view>

    <view class="section">
      <button class="btn btn-primary action" :disabled="loading" @tap="exportData">
        导出备份文件
      </button>
      <button class="btn btn-soft action" :disabled="loading" @tap="importData">
        从备份恢复
      </button>
    </view>

    <view class="card note">
      <text class="small bold">说明</text>
      <text class="small muted note-text">
        导出后微信会弹出文件分享面板，选择「文件传输助手」或任意聊天即可保存。
        恢复时会覆盖当前所有题库与记录。
      </text>
    </view>

    <view class="card note">
      <text class="small bold">备份包含什么</text>
      <text class="small muted note-text">
        题库题目、练习进度、错题、收藏、统计、设置。恢复后可继续上次练习。
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
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
import { MAX_BACKUP_BYTES } from '@/core/constants'
import { formatDateTime } from '@/utils'

const appStore = useAppStore()
const bankStore = useBankStore()

const loading = ref(false)
const backupAt = ref(0)

const bankCount = computed(() => bankStore.banks.length)
const questionCount = computed(() =>
  bankStore.banks.reduce((total, bank) => total + bank.questionCount, 0),
)
const lastBackupText = computed(() =>
  backupAt.value ? formatDateTime(backupAt.value) : '从未备份',
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
</script>

<style scoped lang="scss">
.summary {
  padding: 32rpx;
}

.summary-text {
  display: block;
  margin-top: 12rpx;
  line-height: 1.7;
}

.summary-row {
  margin-top: 16rpx;
}

.action {
  margin-bottom: 20rpx;
}

.note {
  margin-top: 20rpx;
}

.note-text {
  display: block;
  margin-top: 8rpx;
  line-height: 1.7;
}
</style>
