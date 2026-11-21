import type { QuizMode } from '@/types/domain'
import { shuffle } from '@/utils'

export interface OrderOptions {
  count?: number
  seed?: number
  pool?: number[]
}

export function buildOrder(
  mode: QuizMode,
  allNos: number[],
  options: OrderOptions = {},
): number[] {
  const seed = options.seed ?? Date.now()
  const source = options.pool ?? allNos

  if (mode === 'sequence' || mode === 'wrong' || mode === 'favorite' || mode === 'chapter') {
    return [...source]
  }

  const total = Math.max(0, options.count ?? source.length)
  return shuffle(source, seed).slice(0, total)
}

export function firstUnansweredIndex(order: number[], seen: Set<number>): number {
  for (let index = 0; index < order.length; index++) {
    if (!seen.has(order[index])) return index
  }
  return 0
}
