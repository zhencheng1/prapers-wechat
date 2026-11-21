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
    return { keys: [...memory.keys()], currentSize: 1, limitSize: 10240 }
  },
}

function question(no: number): Question {
  return {
    no,
    type: 'single',
    stem: `备份题目 ${no}`,
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

describe('backup round trip', () => {
  beforeEach(() => {
    memory.clear()
  })

  it('exports and restores banks, progress, wrong entries and settings', async () => {
    const bank = await import('@/services/bank')
    const backup = await import('@/services/backup')
    const records = await import('@/core/storage/records')
    const settings = await import('@/core/settings')
    bank.clearBankCache()

    const meta = await bank.createBank({
      meta: { name: '备份题库', description: 'roundtrip' },
      questions: [question(1), question(2)],
    })

    records.saveProgressNow(meta.id, {
      v: 1,
      lastNo: 1,
      seen: [1],
      answered: 1,
      correct: 1,
      updatedAt: Date.now(),
    })
    records.saveWrongEntries(meta, [
      {
        no: 2,
        wrongCount: 2,
        streak: 0,
        lastWrongAt: Date.now(),
        lastPicked: ['B'],
        masteredAt: null,
      },
    ])
    settings.saveSettings({ ...settings.defaultSettings(), dailyGoal: 30 })

    const data = await backup.buildBackup()
    expect(data.schema).toBe('quizbackup/v1')
    expect(data.banks).toHaveLength(1)
    expect(data.banks[0].questions).toHaveLength(2)
    expect(data.banks[0].wrong).toHaveLength(1)
    expect(data.settings.dailyGoal).toBe(30)

    const parsed = backup.parseBackupText(JSON.stringify(data))
    expect(parsed.banks[0].meta.name).toBe('备份题库')

    const count = await backup.restoreBackup(parsed)
    expect(count).toBe(1)

    const restored = bank.loadBanks()[0]
    expect(restored.name).toBe('备份题库')
    expect(restored.questionCount).toBe(2)
    expect(records.loadProgress(restored.id).seen).toEqual([1])
    expect(records.loadWrong(restored)).toHaveLength(1)
    expect(settings.loadSettings().dailyGoal).toBe(30)
  })
})
