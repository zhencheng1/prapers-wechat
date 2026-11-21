import { describe, expect, it } from 'vitest'
import { buildOrder, firstUnansweredIndex } from '@/core/quiz/selector'
import { shuffle } from '@/utils'

describe('shuffle', () => {
  it('is deterministic for the same seed', () => {
    expect(shuffle([1, 2, 3, 4, 5], 42)).toEqual(shuffle([1, 2, 3, 4, 5], 42))
  })

  it('does not mutate the source array', () => {
    const source = [1, 2, 3]
    shuffle(source, 1)
    expect(source).toEqual([1, 2, 3])
  })
})

describe('buildOrder', () => {
  it('keeps every question for sequence mode', () => {
    expect(buildOrder('sequence', [1, 2, 3])).toEqual([1, 2, 3])
  })

  it('limits random mode to the requested count', () => {
    const order = buildOrder('random', [1, 2, 3, 4, 5], { count: 3, seed: 7 })
    expect(order).toHaveLength(3)
    expect(new Set(order).size).toBe(3)
    expect(order.every((no) => no >= 1 && no <= 5)).toBe(true)
  })

  it('keeps a supplied pool for wrong/favorite modes', () => {
    expect(buildOrder('wrong', [1, 2, 3], { pool: [3, 1] })).toEqual([3, 1])
  })

  it('uses only the supplied pool for chapter mode', () => {
    expect(buildOrder('chapter', [1, 2, 3, 4, 5], { pool: [2, 4] })).toEqual([2, 4])
  })
})

describe('firstUnansweredIndex', () => {
  it('returns the first unseen position', () => {
    expect(firstUnansweredIndex([5, 3, 9], new Set([5]))).toBe(1)
  })

  it('falls back to zero when all questions are answered', () => {
    expect(firstUnansweredIndex([5, 3], new Set([5, 3]))).toBe(0)
  })
})
