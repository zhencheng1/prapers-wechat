import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { WrongEntry } from '@/types/domain'
import { clearWrong, loadWrong, removeWrongEntry, saveWrongEntry } from '@/core/storage/records'
import { useSettingsStore } from './settings'

export const useWrongStore = defineStore('wrong', () => {
  const entries = ref<WrongEntry[]>([])

  function load(meta: { id: string; questionCount: number }): void {
    entries.value = loadWrong(meta)
  }

  function record(
    meta: { id: string; questionCount: number },
    no: number,
    correct: boolean,
    picked: string[],
  ): void {
    const settings = useSettingsStore()
    const existing = entries.value.find((entry) => entry.no === no)

    if (correct) {
      if (!existing) return
      existing.streak += 1
      if (
        settings.settings.wrongMasterStreak > 0 &&
        existing.streak >= settings.settings.wrongMasterStreak
      ) {
        existing.masteredAt = Date.now()
      }
      saveWrongEntry(meta, { ...existing })
    } else {
      const entry: WrongEntry = existing
        ? { ...existing }
        : {
            no,
            wrongCount: 0,
            streak: 0,
            lastWrongAt: 0,
            lastPicked: [],
            masteredAt: null,
          }
      entry.wrongCount += 1
      entry.streak = 0
      entry.lastWrongAt = Date.now()
      entry.lastPicked = [...picked]
      entry.masteredAt = null
      saveWrongEntry(meta, entry)
      if (!existing) entries.value.push(entry)
      else Object.assign(existing, entry)
    }
    entries.value = [...entries.value]
  }

  function remove(
    meta: { id: string; questionCount: number },
    no: number,
  ): void {
    const entry = entries.value.find((item) => item.no === no)
    if (entry) {
      removeWrongEntry(meta, no)
      entries.value = entries.value.filter((item) => item.no !== no)
    }
  }

  function clear(meta: { id: string; questionCount: number }): void {
    clearWrong(meta)
    entries.value = []
  }

  const active = computed(() =>
    entries.value
      .filter((entry) => entry.masteredAt === null)
      .sort((left, right) => right.lastWrongAt - left.lastWrongAt),
  )
  const count = computed(() => active.value.length)

  return { entries, active, count, load, record, remove, clear }
})
