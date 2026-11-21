import type { Question, QuestionOption, QuestionType } from '@/types/domain'

export const JUDGE_OPTIONS: QuestionOption[] = [
  { key: 'A', text: '正确' },
  { key: 'B', text: '错误' },
]

const JUDGE_TRUE = new Set(['A', '正确', '对', '√', '✓', 'T', 'TRUE', '是', '1'])
const JUDGE_FALSE = new Set(['B', '错误', '错', '×', '✗', 'X', 'F', 'FALSE', '否', '0'])

export function normalizeOptionKey(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const cleaned = raw.trim().toUpperCase().replace(/[.、．)）:：\s]/g, '')
  return /^[A-H]$/.test(cleaned) ? cleaned : ''
}

export function normalizeText(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : ''
}

export function normalizeStem(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function normalizeJudgeAnswer(raw: unknown): string[] {
  const values: string[] = []
  const push = (value: unknown) => {
    if (typeof value === 'boolean') {
      values.push(value ? 'A' : 'B')
      return
    }
    if (typeof value === 'number') {
      values.push(value === 1 ? 'A' : value === 0 ? 'B' : '')
      return
    }
    if (typeof value !== 'string') return
    const token = value.trim().toUpperCase()
    if (!token) return
    if (JUDGE_TRUE.has(token)) values.push('A')
    else if (JUDGE_FALSE.has(token)) values.push('B')
  }

  if (Array.isArray(raw)) raw.forEach(push)
  else push(raw)

  const unique = [...new Set(values)]
  return unique.length === 1 ? unique : []
}

export function normalizeOptions(raw: unknown): {
  options: QuestionOption[]
  error?: string
} {
  if (!Array.isArray(raw)) {
    return { options: [], error: '选项必须是数组' }
  }

  const map = new Map<string, string>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const key = normalizeOptionKey((item as Record<string, unknown>).key)
    const text = normalizeText((item as Record<string, unknown>).text)
    if (!key || !text || map.has(key)) continue
    map.set(key, text)
  }

  const options = [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, text]) => ({ key, text }))

  if (options.length < 2) {
    return { options, error: '至少需要 2 个有效选项' }
  }
  if (options.length > 8) {
    return { options: options.slice(0, 8), error: '选项超过 8 个，已截断' }
  }
  return { options }
}

export function normalizeAnswer(
  type: QuestionType,
  raw: unknown,
  optionKeys: string[],
): string[] {
  if (type === 'judge') return normalizeJudgeAnswer(raw)

  const tokens = new Set<string>()
  const add = (value: string) => {
    const cleaned = value
      .trim()
      .toUpperCase()
      .replace(/[.、．)）:：\s]/g, '')
      .replace(/^答案/, '')
    if (!cleaned) return
    if (/^[A-H]{2,}$/.test(cleaned)) {
      for (const char of cleaned) tokens.add(char)
    } else {
      tokens.add(cleaned)
    }
  }

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (typeof item === 'string') add(item)
      else if (typeof item === 'number') add(String(item))
    })
  } else if (typeof raw === 'string') {
    const cleaned = raw.replace(/[【】[\]]/g, '')
    cleaned.split(/[,，、;；/\s]+/).forEach(add)
  }

  return [...tokens]
    .filter((key) => optionKeys.includes(key))
    .sort()
}

export function isQuestionImportable(question: Question): boolean {
  if (!question.stem.trim()) return false
  if (!['single', 'multiple', 'judge'].includes(question.type)) return false
  if (question.answer.length === 0) return false

  if (question.type === 'judge') {
    return question.answer.length === 1 && /^[AB]$/.test(question.answer[0])
  }

  if (question.options.length < 2) return false
  const keys = question.options.map((option) => option.key)
  if (question.answer.some((key) => !keys.includes(key))) return false
  if (question.type === 'single') return question.answer.length === 1
  return question.answer.length >= 1
}
