import { describe, expect, it } from 'vitest'
import {
  accuracy,
  nextStreak,
  recentDays,
  sumDaily,
} from '@/core/stats'
import type { DailyStats } from '@/types/domain'

describe('accuracy', () => {
  it('returns zero when nothing was answered', () => {
    expect(accuracy(0, 0)).toBe(0)
  })

  it('rounds to a whole percentage', () => {
    expect(accuracy(3, 2)).toBe(67)
    expect(accuracy(4, 4)).toBe(100)
  })
})

describe('nextStreak', () => {
  it('starts at one for the first activity', () => {
    expect(nextStreak('', 0, '2026-11-21', '2026-11-20')).toBe(1)
  })

  it('keeps the streak on the same day', () => {
    expect(nextStreak('2026-11-21', 5, '2026-11-21', '2026-11-20')).toBe(5)
  })

  it('increments after consecutive days', () => {
    expect(nextStreak('2026-11-20', 5, '2026-11-21', '2026-11-20')).toBe(6)
  })

  it('resets after a gap', () => {
    expect(nextStreak('2026-11-18', 5, '2026-11-21', '2026-11-20')).toBe(1)
  })
})

describe('sumDaily/recentDays', () => {
  const stats: DailyStats = {
    '2026-11-19': { date: '2026-11-19', answered: 10, correct: 8, durationMs: 60000, sessions: 1 },
    '2026-11-21': { date: '2026-11-21', answered: 4, correct: 4, durationMs: 20000, sessions: 1 },
  }

  it('aggregates totals', () => {
    expect(sumDaily(stats)).toEqual({
      answered: 14,
      correct: 12,
      durationMs: 80000,
      days: 2,
    })
  })

  it('returns seven days including empty days', () => {
    const days = recentDays(stats, '2026-11-21', 7)
    expect(days).toHaveLength(7)
    expect(days[days.length - 1].answered).toBe(4)
    expect(days.filter((day) => day.answered > 0)).toHaveLength(2)
  })
})
