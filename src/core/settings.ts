import type { Settings } from '@/types/domain'
import { KEYS } from './storage/keys'
import { readKey, writeKey } from './storage/uni'

export function defaultSettings(): Settings {
  return {
    v: 1,
    showAnalysis: 'wrong',
    autoNext: false,
    autoNextDelayMs: 800,
    wrongMasterStreak: 2,
    multiplePartialCredit: false,
    shuffleOptions: false,
    fontSize: 'md',
    theme: 'light',
    examDurationMin: 60,
    examQuestionCount: 50,
    dailyGoal: 20,
  }
}

export function loadSettings(): Settings {
  const stored = readKey<Partial<Settings>>(KEYS.settings, {})
  return { ...defaultSettings(), ...stored, v: 1 }
}

export function saveSettings(settings: Settings): void {
  writeKey(KEYS.settings, settings)
}
