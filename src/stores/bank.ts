import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BankBundle, BankMeta, DraftBank, Question } from '@/types/domain'
import {
  createBank,
  deleteBank,
  getQuestion,
  loadBanks,
  openBank,
} from '@/services/bank'
import { isQuestionImportable } from '@/core/import/normalize'

export const useBankStore = defineStore('bank', () => {
  const banks = ref<BankMeta[]>([])
  const current = ref<BankBundle | null>(null)
  const loading = ref(false)

  async function init(): Promise<void> {
    banks.value = loadBanks(true)
  }

  async function refresh(): Promise<void> {
    banks.value = loadBanks(true)
  }

  async function open(bankId: string): Promise<BankBundle | null> {
    loading.value = true
    try {
      current.value = await openBank(bankId)
      return current.value
    } finally {
      loading.value = false
    }
  }

  async function importDraft(draft: DraftBank): Promise<BankMeta> {
    const questions = draft.questions.filter(isQuestionImportable)
    if (!questions.length) throw new Error('没有可导入的有效题目')
    const meta = await createBank({
      meta: draft.meta,
      questions,
      source: 'json',
    })
    await refresh()
    return meta
  }

  async function importQuestions(
    meta: DraftBank['meta'],
    questions: Question[],
  ): Promise<BankMeta> {
    const valid = questions.filter(isQuestionImportable)
    if (!valid.length) throw new Error('没有可导入的有效题目')
    const created = await createBank({ meta, questions: valid, source: 'json' })
    await refresh()
    return created
  }

  async function remove(meta: BankMeta): Promise<void> {
    await deleteBank(meta)
    if (current.value?.meta.id === meta.id) current.value = null
    await refresh()
  }

  async function question(no: number): Promise<Question | null> {
    if (!current.value) return null
    return getQuestion(current.value.meta, no)
  }

  async function reloadCurrent(): Promise<void> {
    if (!current.value) return
    current.value = await openBank(current.value.meta.id)
  }

  return {
    banks,
    current,
    loading,
    init,
    refresh,
    open,
    importDraft,
    importQuestions,
    remove,
    question,
    reloadCurrent,
  }
})
