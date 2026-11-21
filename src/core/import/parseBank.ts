import type {
  DraftBank,
  ImportIssue,
  Question,
  QuestionOption,
} from '@/types/domain'
import { hashQuestion } from '@/utils'
import {
  JUDGE_OPTIONS,
  normalizeAnswer,
  normalizeOptions,
  normalizeStem,
  normalizeText,
} from './normalize'

export class ImportFatalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportFatalError'
  }
}

function stringArray(raw: unknown, limit: number): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
}

function difficultyOf(raw: unknown): number {
  if (typeof raw !== 'number' || Number.isNaN(raw)) return 0
  return Math.min(5, Math.max(0, Math.round(raw)))
}

export function parseBankText(text: string): DraftBank {
  let raw: unknown
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ''))
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    throw new ImportFatalError(`JSON 格式错误：${message}`)
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ImportFatalError('题库文件必须是一个 JSON 对象')
  }

  const root = raw as Record<string, unknown>
  if (root.schema && root.schema !== 'quizbank/v1') {
    throw new ImportFatalError('不支持的题库格式版本，请使用 quizbank/v1')
  }

  const metaRaw =
    root.meta && typeof root.meta === 'object'
      ? (root.meta as Record<string, unknown>)
      : {}
  const name = normalizeText(metaRaw.name)
  if (!name) throw new ImportFatalError('缺少题库名称 meta.name')

  const rawQuestions = root.questions
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new ImportFatalError('题库中没有题目')
  }
  if (rawQuestions.length > 20000) {
    throw new ImportFatalError('单次最多导入 20000 题，请拆分文件')
  }

  const issues: ImportIssue[] = []
  const questions: Question[] = []
  const seen = new Set<string>()
  let duplicates = 0

  rawQuestions.forEach((item, index) => {
    const path = `questions[${index}]`
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      issues.push({ level: 'error', path, message: '题目必须是对象，已跳过' })
      return
    }

    const questionRaw = item as Record<string, unknown>
    const type = questionRaw.type
    if (type !== 'single' && type !== 'multiple' && type !== 'judge') {
      issues.push({
        level: 'error',
        path: `${path}.type`,
        message: '题型必须是 single / multiple / judge，已跳过',
      })
      return
    }

    const stem = normalizeStem(questionRaw.stem)
    if (!stem) {
      issues.push({
        level: 'error',
        path: `${path}.stem`,
        message: '题干为空，已跳过',
      })
      return
    }

    let options: QuestionOption[]
    if (type === 'judge') {
      options = JUDGE_OPTIONS.map((option) => ({ ...option }))
    } else {
      const normalized = normalizeOptions(questionRaw.options)
      if (normalized.error === '至少需要 2 个有效选项') {
        issues.push({
          level: 'error',
          path: `${path}.options`,
          message: normalized.error,
        })
        return
      }
      if (normalized.error) {
        issues.push({
          level: 'warning',
          path: `${path}.options`,
          message: normalized.error,
        })
      }
      options = normalized.options
    }

    const optionKeys = options.map((option) => option.key)
    const answer = normalizeAnswer(type, questionRaw.answer, optionKeys)
    const rawAnswerText =
      typeof questionRaw.answer === 'string' || Array.isArray(questionRaw.answer)
        ? JSON.stringify(questionRaw.answer)
        : ''

    if (answer.length === 0) {
      issues.push({
        level: 'warning',
        path: `${path}.answer`,
        message: '缺少可识别答案，请在预览页补全后再导入',
      })
    } else if (answer.length > 1 && type !== 'multiple') {
      issues.push({
        level: 'warning',
        path: `${path}.answer`,
        message: '单选/判断题只能有一个答案，请在预览页修正',
      })
    }

    const invalidKeys =
      rawAnswerText && type !== 'judge'
        ? normalizeAnswer(type, questionRaw.answer, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']).filter(
            (key) => !optionKeys.includes(key),
          )
        : []
    if (invalidKeys.length > 0) {
      issues.push({
        level: 'warning',
        path: `${path}.answer`,
        message: `答案 ${invalidKeys.join('')} 不在选项中，已忽略`,
      })
    }

    const images = stringArray(questionRaw.images, 10)
    if (images.length > 0) {
      issues.push({
        level: 'warning',
        path: `${path}.images`,
        message: '首版暂不支持图片题，图片字段已忽略',
      })
    }

    const question: Question = {
      no: 0,
      type,
      stem,
      options,
      answer,
      analysis: normalizeText(questionRaw.analysis),
      chapter: normalizeText(questionRaw.chapter),
      tags: stringArray(questionRaw.tags, 10),
      difficulty: difficultyOf(questionRaw.difficulty),
      images: [],
    }

    const fingerprint = hashQuestion(question)
    if (seen.has(fingerprint)) {
      duplicates++
      issues.push({
        level: 'warning',
        path,
        message: '与前面的题目重复，已跳过',
      })
      return
    }

    seen.add(fingerprint)
    questions.push(question)
  })

  if (questions.length === 0) {
    throw new ImportFatalError('没有可导入的题目，请检查题目字段')
  }

  questions.forEach((question, index) => {
    question.no = index + 1
  })

  return {
    meta: {
      name,
      description: normalizeText(metaRaw.description),
      category: normalizeText(metaRaw.category),
      tags: stringArray(metaRaw.tags, 10),
    },
    questions,
    issues,
    duplicates,
  }
}
