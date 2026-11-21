import { describe, expect, it } from 'vitest'
import type { Question } from '@/types/domain'
import {
  UNCHAPTERED,
  chapterName,
  groupByChapter,
  nosOfChapter,
} from '@/core/quiz/chapters'

function makeQuestion(no: number, chapter: string): Question {
  return {
    no,
    type: 'single',
    stem: `题目 ${no}`,
    options: [],
    answer: [],
    analysis: '',
    chapter,
    tags: [],
    difficulty: 0,
    images: [],
  }
}

describe('chapterName', () => {
  it('trims the chapter value', () => {
    expect(chapterName(makeQuestion(1, '  第一章  '))).toBe('第一章')
  })

  it('falls back for an empty chapter', () => {
    expect(chapterName(makeQuestion(1, '  '))).toBe(UNCHAPTERED)
  })
})

describe('groupByChapter', () => {
  const questions = [
    makeQuestion(3, '第二章'),
    makeQuestion(1, '第一章'),
    makeQuestion(4, '第一章'),
    makeQuestion(2, '第二章'),
    makeQuestion(5, ''),
  ]

  it('groups by chapter with question numbers in order', () => {
    expect(groupByChapter(questions)).toEqual([
      { name: '第一章', count: 2, nos: [1, 4] },
      { name: '第二章', count: 2, nos: [2, 3] },
      { name: UNCHAPTERED, count: 1, nos: [5] },
    ])
  })

  it('does not mutate the source array', () => {
    const source = [...questions]
    groupByChapter(source)
    expect(source).toEqual(questions)
  })
})

describe('nosOfChapter', () => {
  const questions = [
    makeQuestion(1, '第一章'),
    makeQuestion(2, '第二章'),
    makeQuestion(3, '第一章'),
  ]

  it('returns the numbers of the requested chapter', () => {
    expect(nosOfChapter(questions, '第一章')).toEqual([1, 3])
  })

  it('returns an empty list for an unknown chapter', () => {
    expect(nosOfChapter(questions, '第三章')).toEqual([])
  })
})
