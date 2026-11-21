import { describe, expect, it } from 'vitest'
import demo from '@/static/demo-bank.json'
import { parseBankText, ImportFatalError } from '@/core/import/parseBank'
import { isQuestionImportable } from '@/core/import/normalize'

function bank(questions: unknown[]): string {
  return JSON.stringify({
    schema: 'quizbank/v1',
    meta: { name: '测试题库' },
    questions,
  })
}

const single = {
  type: 'single',
  stem: '1 + 1 = ?',
  options: [
    { key: 'A', text: '1' },
    { key: 'B', text: '2' },
  ],
  answer: ['B'],
}

describe('parseBankText', () => {
  it('parses the bundled demo bank', () => {
    const draft = parseBankText(JSON.stringify(demo))
    expect(draft.questions.length).toBe(23)
    expect(draft.questions.every((question) => isQuestionImportable(question))).toBe(true)
    expect(draft.questions[0].no).toBe(1)
  })

  it('normalizes judge questions and adds options', () => {
    const draft = parseBankText(
      bank([{ type: 'judge', stem: 'UDP 可靠。', answer: '错误' }]),
    )
    expect(draft.questions[0].options.map((option) => option.key)).toEqual(['A', 'B'])
    expect(draft.questions[0].answer).toEqual(['B'])
  })

  it('keeps questions without answers for preview correction', () => {
    const draft = parseBankText(bank([{ ...single, answer: [] }]))
    expect(draft.questions).toHaveLength(1)
    expect(draft.questions[0].answer).toEqual([])
    expect(draft.issues.some((issue) => issue.path.endsWith('.answer'))).toBe(true)
  })

  it('reports duplicates and keeps the first one', () => {
    const draft = parseBankText(bank([single, single]))
    expect(draft.questions).toHaveLength(1)
    expect(draft.duplicates).toBe(1)
  })

  it('skips invalid option lists', () => {
    const draft = parseBankText(
      bank([
        { type: 'single', stem: 'bad', options: [{ key: 'A', text: 'only' }], answer: ['A'] },
        single,
      ]),
    )
    expect(draft.questions).toHaveLength(1)
    expect(draft.issues.some((issue) => issue.level === 'error')).toBe(true)
    expect(() =>
      parseBankText(bank([{ type: 'single', stem: 'bad', options: [], answer: ['A'] }])),
    ).toThrow(ImportFatalError)
  })

  it('rejects unsupported schemas', () => {
    expect(() =>
      parseBankText(
        JSON.stringify({
          schema: 'quizbank/v2',
          meta: { name: 'x' },
          questions: [single],
        }),
      ),
    ).toThrow(ImportFatalError)
  })

  it('rejects empty question lists', () => {
    expect(() => parseBankText(bank([]))).toThrow(ImportFatalError)
  })
})
