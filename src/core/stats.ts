import type { DailyStat, DailyStats } from '@/types/domain'

export function accuracy(answered: number, correct: number): number {
  if (answered <= 0) return 0
  return Math.round((correct / answered) * 100)
}

export function nextStreak(
  lastActiveDate: string,
  currentStreak: number,
  today: string,
  yesterday: string,
): number {
  if (lastActiveDate === today) return Math.max(1, currentStreak)
  if (lastActiveDate === yesterday) return Math.max(1, currentStreak) + 1
  return 1
}

export function emptyDailyStat(date: string): DailyStat {
  return { date, answered: 0, correct: 0, durationMs: 0, sessions: 0 }
}

export function sumDaily(stats: DailyStats): {
  answered: number
  correct: number
  durationMs: number
  days: number
} {
  return Object.values(stats).reduce(
    (total, day) => {
      total.answered += day.answered
      total.correct += day.correct
      total.durationMs += day.durationMs
      total.days += day.answered > 0 ? 1 : 0
      return total
    },
    { answered: 0, correct: 0, durationMs: 0, days: 0 },
  )
}

export function recentDays(
  stats: DailyStats,
  today: string,
  count = 7,
): Array<{ date: string; label: string; answered: number }> {
  const result: Array<{ date: string; label: string; answered: number }> = []
  const base = new Date(`${today}T00:00:00`)
  for (let offset = count - 1; offset >= 0; offset--) {
    const date = new Date(base.getTime())
    date.setDate(date.getDate() - offset)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`
    result.push({
      date: key,
      label: key.slice(5),
      answered: stats[key]?.answered ?? 0,
    })
  }
  return result
}
