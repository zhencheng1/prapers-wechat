import type { BackupData, BackupBank, DailyStats } from '@/types/domain'
import { KEYS } from '@/core/storage/keys'
import { hasFileSystem, userDataPath, writeText } from '@/core/storage/file'
import {
  defaultProgress,
  loadAppMeta,
  loadFavorites,
  loadProgress,
  loadSession,
  loadWrong,
  saveAppMeta,
} from '@/core/storage/records'
import { readKey, writeKey } from '@/core/storage/uni'
import { defaultSettings, loadSettings } from '@/core/settings'
import {
  clearAllData,
  loadBanks,
  readAllQuestions,
  restoreBank,
} from './bank'

export async function buildBackup(): Promise<BackupData> {
  const banks = loadBanks()
  const backupBanks: BackupBank[] = []

  for (const meta of banks) {
    backupBanks.push({
      meta,
      questions: await readAllQuestions(meta),
      progress: loadProgress(meta.id),
      wrong: loadWrong(meta),
      favorites: loadFavorites(meta),
      session: loadSession(meta.id),
    })
  }

  const app = loadAppMeta()
  return {
    schema: 'quizbackup/v1',
    exportedAt: Date.now(),
    app: {
      installId: app.installId,
      schemaVersion: app.schemaVersion,
    },
    banks: backupBanks,
    stats: readKey<DailyStats>(KEYS.stats, {}),
    settings: loadSettings(),
  }
}

function backupFileName(): string {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `quizbackup-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}.json`
}

async function shareFile(filePath: string, fileName: string): Promise<void> {
  const wxApi = typeof wx !== 'undefined' ? wx : undefined
  if (!wxApi || typeof wxApi.shareFileMessage !== 'function') {
    throw new Error('当前微信版本不支持文件分享，请升级微信后重试')
  }
  await new Promise<void>((resolve, reject) => {
    wxApi.shareFileMessage({
      filePath,
      fileName,
      success: () => resolve(),
      fail: (error: any) => reject(new Error(String(error?.errMsg ?? '分享失败'))),
    })
  })
}

export async function exportBackupFile(data: BackupData): Promise<void> {
  const fileName = backupFileName()
  const json = JSON.stringify(data)

  if (hasFileSystem()) {
    const relativePath = `backup/${fileName}`
    await writeText(relativePath, json)
    await shareFile(`${userDataPath()}/${relativePath}`, fileName)
    return
  }

  // #ifdef H5
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
  return
  // #endif

  throw new Error('当前环境不支持导出备份文件')
}

export function parseBackupText(text: string): BackupData {
  let raw: unknown
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ''))
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    throw new Error(`备份文件格式错误：${message}`)
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('备份文件内容无效')
  }
  const data = raw as BackupData
  if (data.schema !== 'quizbackup/v1') {
    throw new Error('不支持的备份格式，请使用 quizbackup/v1')
  }
  if (!Array.isArray(data.banks)) {
    throw new Error('备份文件缺少题库数据')
  }
  return data
}

export async function restoreBackup(data: BackupData): Promise<number> {
  await clearAllData()

  writeKey(KEYS.settings, data.settings ?? defaultSettings())
  writeKey(KEYS.stats, data.stats ?? {})

  let restored = 0
  for (const bank of data.banks) {
    if (!bank?.meta?.id || !Array.isArray(bank.questions)) continue
    await restoreBank(
      bank.meta,
      bank.questions,
      bank.progress ?? defaultProgress(),
      bank.wrong ?? [],
      bank.favorites ?? [],
      bank.session ?? null,
    )
    restored++
  }

  const app = loadAppMeta()
  app.lastBackupAt = Date.now()
  app.demoSeeded = true
  saveAppMeta(app)
  return restored
}
