import type { Question } from '@/types/domain'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function newId(prefix = 'b'): string {
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  return `${prefix}_${time}_${rand}`
}

export function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function hashQuestion(
  question: Pick<Question, 'type' | 'stem' | 'options' | 'answer'>,
): string {
  const stem = question.stem.replace(/\s+/g, '')
  const options = question.options
    .map((option) => `${option.key}${option.text.replace(/\s+/g, '')}`)
    .join(',')
  const answer = [...question.answer].sort().join('')
  return fnv1a(`${question.type}|${stem}|${options}|${answer}`)
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function dateKey(timestamp = Date.now()): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function yesterdayKey(timestamp = Date.now()): string {
  const date = new Date(timestamp)
  date.setDate(date.getDate() - 1)
  return dateKey(date.getTime())
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${pad(minutes)}:${pad(seconds)}`
}

export function formatDateTime(timestamp: number): string {
  if (!timestamp) return '从未'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export function utf8ByteLength(input: string): number {
  let bytes = 0
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4
      i++
    } else bytes += 3
  }
  return bytes
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], seed = Date.now()): T[] {
  const result = [...items]
  const random = mulberry32(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
