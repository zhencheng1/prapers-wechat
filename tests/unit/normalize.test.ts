import { describe, expect, it } from 'vitest'
import {
  isQuestionImportable,
  normalizeAnswer,
  normalizeJudgeAnswer,
  normalizeOptions,
} from '@/core/import/normalize'
import type { Question } from '@/types/domain'

describe('normalizeAnswer', () => {
  it('splits compact and separated multiple answers', () => {
    expect(normalizeAnswer('multiple', 'AB', ['A', 'B', 'C'])).toEqual(['A', 'B'])
    expect(normalizeAnswer('multiple', 'A、C', ['A', 'B', 'C'])).toEqual(['A', 'C'])
    expect(normalizeAnswer('multiple', 'a,b', ['A', 'B'])).toEqual(['A', 'B'])
  })

  it('drops keys that are not in the options', () => {
    expect(normalizeAnswer('multiple', ['A', 'Z'], ['A', 'B'])).toEqual(['A'])
  })

  it('keeps a single answer for single choice', () => {
    expect(normalizeAnswer('single', 'B', ['A', 'B'])).toEqual(['B'])
  })
})

describe('normalizeJudgeAnswer', () => {
  it('maps common true/false forms', () => {
    expect(normalizeJudgeAnswer('√')).toEqual(['A'])
    expect(normalizeJudgeAnswer('正确')).toEqual(['A'])
    expect(normalizeJudgeAnswer(true)).toEqual(['A'])
    expect(normalizeJudgeAnswer('错')).toEqual(['B'])
    expect(normalizeJudgeAnswer('×')).toEqual(['B'])
    expect(normalizeJudgeAnswer(false)).toEqual(['B'])
  })

  it('rejects ambiguous or unknown forms', () => {
    expect(normalizeJudgeAnswer('AB')).toEqual([])
    expect(normalizeJudgeAnswer('不知道')).toEqual([])
  })
})

describe('normalizeOptions', () => {
  it('deduplicates and sorts options', () => {
    const result = normalizeOptions([
      { key: 'b', text: 'B 选项' },
      { key: 'A', text: 'A 选项' },
      { key: 'A', text: '重复' },
    ])
    expect(result.options.map((option) => option.key)).toEqual(['A', 'B'])
  })

  it('reports too few options', () => {
    expect(normalizeOptions([{ key: 'A', text: 'only' }]).error).toContain('至少')
  })
})

describe('isQuestionImportable', () => {
  const base: Question = {
    no: 1,
    type: 'single',
    stem: '题干',
    options: [
      { key: 'A', text: 'A' },
      { key: 'B', text: 'B' },
    ],
    answer: ['A'],
    analysis: '',
    chapter: '',
    tags: [],
    difficulty: 0,
    images: [],
  }

  it('accepts a valid single choice question', () => {
    expect(isQuestionImportable(base)).toBe(true)
  })

  it('rejects questions without answers', () => {
    expect(isQuestionImportable({ ...base, answer: [] })).toBe(false)
  })

  it('rejects single choice with multiple answers', () => {
    expect(isQuestionImportable({ ...base, answer: ['A', 'B'] })).toBe(false)
  })

  it('accepts judge questions with one key', () => {
    expect(
      isQuestionImportable({
        ...base,
        type: 'judge',
        options: [
          { key: 'A', text: '正确' },
          { key: 'B', text: '错误' },
        ],
        answer: ['B'],
      }),
    ).toBe(true)
  })
})
