import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DraftBank } from '@/types/domain'

export const useImportStore = defineStore('import', () => {
  const draft = ref<DraftBank | null>(null)

  function setDraft(value: DraftBank): void {
    draft.value = value
  }

  function clear(): void {
    draft.value = null
  }

  return { draft, setDraft, clear }
})
