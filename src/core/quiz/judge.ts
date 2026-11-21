import type { QuestionType } from '@/types/domain'

function normalized(keys: string[]): string[] {
  return [...new Set(keys)].sort()
}

export function judgeAnswer(
  type: QuestionType,
  picked: string[],
  answer: string[],
): boolean {
  const actual = normalized(picked)
  const expected = normalized(answer)
  if (expected.length === 0 || actual.length === 0) return false
  if (type === 'multiple') {
    return (
      actual.length === expected.length &&
      actual.every((key, index) => key === expected[index])
    )
  }
  return actual.length === 1 && expected.length === 1 && actual[0] === expected[0]
}

/**
 * Returns 1 for a fully correct answer, 0 for wrong.
 * Partial credit for multiple choice is intentionally opt-in (exam use).
 */
export function scoreAnswer(
  type: QuestionType,
  picked: string[],
  answer: string[],
  partialCredit = false,
): number {
  if (judgeAnswer(type, picked, answer)) return 1
  if (!partialCredit || type !== 'multiple') return 0

  const actual = normalized(picked)
  const expected = normalized(answer)
  if (actual.length === 0 || expected.length === 0) return 0
  const hasWrongPick = actual.some((key) => !expected.includes(key))
  if (hasWrongPick) return 0
  return actual.length < expected.length ? 0.5 : 0
}
