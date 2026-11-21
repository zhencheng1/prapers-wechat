import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DailyStat, DailyStats } from '@/types/domain'
import { KEYS } from '@/core/storage/keys'
import { readKey } from '@/core/storage/uni'
import { persistLater } from '@/core/storage/persist'
import { loadAppMeta, saveAppMeta } from '@/core/storage/records'
import { dateKey, yesterdayKey } from '@/utils'
import {
  accuracy,
  emptyDailyStat,
  nextStreak,
  recentDays,
  sumDaily,
} from '@/core/stats'

export const useStatsStore = defineStore('stats', () => {
  const daily = ref<DailyStats>({})
  const streak = ref(0)
  const initialized = ref(false)

  function init(): void {
    daily.value = readKey<DailyStats>(KEYS.stats, {})
    streak.value = loadAppMeta().streak
    initialized.value = true
  }

  function record(correct: boolean, durationMs: number): void {
    const today = dateKey()
    const stat: DailyStat = {
      ...(daily.value[today] ?? emptyDailyStat(today)),
    }
    stat.answered += 1
    if (correct) stat.correct += 1
    stat.durationMs += durationMs
    daily.value = { ...daily.value, [today]: stat }
    persistLater(KEYS.stats, daily.value, 500)

    const app = loadAppMeta()
    const next = nextStreak(
      app.lastActiveDate,
      app.streak,
      today,
      yesterdayKey(),
    )
    if (next !== app.streak || app.lastActiveDate !== today) {
      app.streak = next
      app.lastActiveDate = today
      saveAppMeta(app)
    }
    streak.value = next
  }

  const today = computed<DailyStat>(() => {
    return daily.value[dateKey()] ?? emptyDailyStat(dateKey())
  })

  const total = computed(() => sumDaily(daily.value))
  const todayAccuracy = computed(() => accuracy(today.value.answered, today.value.correct))
  const totalAccuracy = computed(() => accuracy(total.value.answered, total.value.correct))
  const last7 = computed(() => recentDays(daily.value, dateKey(), 7))

  function reload(): void {
    init()
  }

  return {
    daily,
    streak,
    initialized,
    today,
    total,
    todayAccuracy,
    totalAccuracy,
    last7,
    init,
    reload,
    record,
  }
})
