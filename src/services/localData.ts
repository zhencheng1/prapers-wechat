import { clearAllData } from './bank'
import { useAppStore } from '@/stores/app'
import { useBankStore } from '@/stores/bank'
import { useFavoriteStore } from '@/stores/favorite'
import { useQuizStore } from '@/stores/quiz'
import { useSettingsStore } from '@/stores/settings'
import { useStatsStore } from '@/stores/stats'
import { useWrongStore } from '@/stores/wrong'

/** 清空本地文件与缓存，并把页面状态同步到空数据。 */
export async function clearAllLocalData(): Promise<void> {
  await clearAllData()

  useQuizStore().reset()
  const bankStore = useBankStore()
  bankStore.current = null
  await bankStore.refresh()
  useWrongStore().entries = []
  useFavoriteStore().entries = []
  useSettingsStore().init()
  useStatsStore().init()
  useAppStore().refreshMeta()
}

/** 二次确认 + 清空 + 反馈，供各入口复用。 */
export function confirmAndClearAllData(): void {
  uni.showModal({
    title: '一键清空数据',
    content:
      '将删除本地文件目录 qb（题库正文）、backup（导出备份），以及小程序缓存中的题库索引、进度、错题、收藏、统计、设置和会话，且无法恢复。建议先导出备份。',
    confirmText: '清空',
    confirmColor: '#ef4444',
    success: async (result) => {
      if (!result.confirm) return
      uni.showLoading({ title: '正在清空…', mask: true })
      try {
        await clearAllLocalData()
        uni.showToast({ title: '已清空', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' })
        }, 400)
      } catch (error) {
        const message = error instanceof Error ? error.message : '清空失败'
        uni.showModal({ title: '清空失败', content: message, showCancel: false })
      } finally {
        uni.hideLoading()
      }
    },
  })
}
