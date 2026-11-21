import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '@/types/domain'
import { defaultSettings, loadSettings, saveSettings } from '@/core/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(defaultSettings())
  const initialized = ref(false)

  function init(): void {
    settings.value = loadSettings()
    initialized.value = true
  }

  function update(patch: Partial<Settings>): void {
    settings.value = { ...settings.value, ...patch, v: 1 }
    saveSettings(settings.value)
  }

  function reset(): void {
    settings.value = defaultSettings()
    saveSettings(settings.value)
  }

  return { settings, initialized, init, update, reset }
})
