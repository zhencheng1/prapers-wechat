import { describe, expect, it } from 'vitest'
import { judgeAnswer, scoreAnswer } from '@/core/quiz/judge'

describe('judgeAnswer', () => {
  it('accepts a single correct key', () => {
    expect(judgeAnswer('single', ['B'], ['B'])).toBe(true)
    expect(judgeAnswer('single', ['A'], ['B'])).toBe(false)
  })

  it('requires one key for single choice', () => {
    expect(judgeAnswer('single', ['A', 'B'], ['A'])).toBe(false)
    expect(judgeAnswer('single', [], ['A'])).toBe(false)
  })

  it('treats multiple choice order as irrelevant', () => {
    expect(judgeAnswer('multiple', ['C', 'A'], ['A', 'C'])).toBe(true)
    expect(judgeAnswer('multiple', ['A'], ['A', 'C'])).toBe(false)
    expect(judgeAnswer('multiple', ['A', 'C', 'D'], ['A', 'C'])).toBe(false)
  })

  it('judges true/false questions like single choice', () => {
    expect(judgeAnswer('judge', ['A'], ['A'])).toBe(true)
    expect(judgeAnswer('judge', ['B'], ['A'])).toBe(false)
  })
})

describe('scoreAnswer', () => {
  it('gives full score when exact', () => {
    expect(scoreAnswer('multiple', ['A', 'C'], ['A', 'C'])).toBe(1)
  })

  it('gives no partial score by default', () => {
    expect(scoreAnswer('multiple', ['A'], ['A', 'C'])).toBe(0)
  })

  it('gives half score for a partial pick when enabled', () => {
    expect(scoreAnswer('multiple', ['A'], ['A', 'C'], true)).toBe(0.5)
  })

  it('gives no partial score when an incorrect key is picked', () => {
    expect(scoreAnswer('multiple', ['A', 'D'], ['A', 'C'], true)).toBe(0)
  })
})
