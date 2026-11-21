import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppMeta } from '@/types/domain'
import { loadAppMeta, saveAppMeta } from '@/core/storage/records'
import { parseBankText } from '@/core/import/parseBank'
import { isQuestionImportable } from '@/core/import/normalize'
import { createBank, loadBanks } from '@/services/bank'
import demoJson from '@/static/demo-bank.json'
import { useSettingsStore } from './settings'
import { useStatsStore } from './stats'

export const useAppStore = defineStore('app', () => {
  const meta = ref<AppMeta>(loadAppMeta())
  const ready = ref(false)
  let initPromise: Promise<void> | null = null

  async function ensureReady(): Promise<void> {
    if (ready.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      useSettingsStore().init()
      useStatsStore().init()

      const banks = loadBanks(true)
      if (banks.length === 0 && !meta.value.demoSeeded) {
        try {
          const draft = parseBankText(JSON.stringify(demoJson))
          const questions = draft.questions.filter(isQuestionImportable)
          if (questions.length) {
            await createBank({
              meta: draft.meta,
              questions,
              source: 'demo',
            })
          }
          meta.value.demoSeeded = true
          saveAppMeta(meta.value)
        } catch (error) {
          console.error('[app] 示例题库导入失败', error)
        }
      }

      ready.value = true
    })().finally(() => {
      if (!ready.value) initPromise = null
    })

    return initPromise
  }

  function refreshMeta(): void {
    meta.value = loadAppMeta()
  }

  function markBackup(): void {
    meta.value.lastBackupAt = Date.now()
    saveAppMeta(meta.value)
  }

  return { meta, ready, ensureReady, refreshMeta, markBackup }
})
