import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FavoriteEntry } from '@/types/domain'
import {
  clearFavorites,
  loadFavorites,
  toggleFavorite,
} from '@/core/storage/records'

export const useFavoriteStore = defineStore('favorite', () => {
  const entries = ref<FavoriteEntry[]>([])

  function load(meta: { id: string; questionCount: number }): void {
    entries.value = loadFavorites(meta)
  }

  function toggle(
    meta: { id: string; questionCount: number },
    no: number,
  ): boolean {
    const active = toggleFavorite(meta, no)
    entries.value = active
      ? [...entries.value, { no, createdAt: Date.now() }].sort(
          (left, right) => left.no - right.no,
        )
      : entries.value.filter((entry) => entry.no !== no)
    return active
  }

  function isFavorite(no: number): boolean {
    return entries.value.some((entry) => entry.no === no)
  }

  function clear(meta: { id: string; questionCount: number }): void {
    clearFavorites(meta)
    entries.value = []
  }

  const count = computed(() => entries.value.length)

  return { entries, count, load, toggle, isFavorite, clear }
})
