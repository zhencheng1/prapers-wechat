import { beforeEach, describe, expect, it } from 'vitest'
import type { Question } from '@/types/domain'

const memory = new Map<string, unknown>()

;(globalThis as any).uni = {
  getStorageSync(key: string) {
    return memory.has(key) ? memory.get(key) : ''
  },
  setStorageSync(key: string, value: unknown) {
    memory.set(key, value)
  },
  removeStorageSync(key: string) {
    memory.delete(key)
  },
  clearStorageSync() {
    memory.clear()
  },
  getStorageInfoSync() {
    return {
      keys: [...memory.keys()],
      currentSize: 1,
      limitSize: 10240,
    }
  },
}

function question(no: number): Question {
  return {
    no,
    type: 'single',
    stem: `题目 ${no}`,
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
}

describe('bank storage (storage mode)', () => {
  beforeEach(() => {
    memory.clear()
  })

  it('creates, opens and reads a bank through the mock storage', async () => {
    const bank = await import('@/services/bank')
    bank.clearBankCache()

    const meta = await bank.createBank({
      meta: { name: '测试题库', description: 'desc' },
      questions: [question(1), question(2), question(3)],
    })

    expect(meta.storageMode).toBe('storage')
    expect(meta.questionCount).toBe(3)
    expect(bank.loadBanks()).toHaveLength(1)

    const bundle = await bank.openBank(meta.id)
    expect(bundle?.manifest.chunks).toHaveLength(1)
    expect(bundle?.meta.name).toBe('测试题库')

    const loaded = await bank.getQuestion(meta, 2)
    expect(loaded?.stem).toBe('题目 2')
    expect(loaded?.options.map((option) => option.key)).toEqual(['A', 'B'])
  })

  it('splits large banks into chunks', async () => {
    const bank = await import('@/services/bank')
    bank.clearBankCache()
    memory.clear()

    const questions = Array.from({ length: 151 }, (_, index) => question(index + 1))
    const meta = await bank.createBank({ meta: { name: '大题库' }, questions })
    const bundle = await bank.openBank(meta.id)

    expect(bundle?.manifest.chunks).toHaveLength(2)
    expect(bundle?.manifest.chunks[1].from).toBe(151)
    expect((await bank.getQuestion(meta, 151))?.stem).toBe('题目 151')
  })

  it('deletes a bank and its chunks', async () => {
    const bank = await import('@/services/bank')
    bank.clearBankCache()
    memory.clear()

    const meta = await bank.createBank({
      meta: { name: '待删除' },
      questions: [question(1)],
    })
    const bundle = await bank.openBank(meta.id)
    await bank.deleteBank(meta)

    expect(bank.loadBanks()).toHaveLength(0)
    expect(bundle?.manifest.chunks[0].ref).toBeTruthy()
    expect([...memory.keys()]).toEqual(['qb:v1:banks'])
  })

  it('clears all data without a file system', async () => {
    const bank = await import('@/services/bank')
    bank.clearBankCache()
    memory.clear()

    await bank.createBank({ meta: { name: 'A' }, questions: [question(1)] })
    await bank.createBank({ meta: { name: 'B' }, questions: [question(1)] })
    expect(bank.loadBanks()).toHaveLength(2)

    await bank.clearAllData()
    expect(bank.loadBanks()).toHaveLength(0)
    expect(memory.size).toBe(0)
  })
})
