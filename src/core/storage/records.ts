import type {
  AppMeta,
  FavoriteEntry,
  Progress,
  SessionState,
  WrongEntry,
} from '@/types/domain'
import { newId } from '@/utils'
import { KEYS, RECORD_CHUNK_SIZE, recordChunkIndexOf } from './keys'
import { persistLater } from './persist'
import { readKey, removeKey, writeKey } from './uni'

export function defaultProgress(): Progress {
  return {
    v: 1,
    lastNo: 0,
    seen: [],
    answered: 0,
    correct: 0,
    updatedAt: 0,
  }
}

export function loadProgress(bankId: string): Progress {
  return readKey<Progress>(KEYS.progress(bankId), defaultProgress())
}

export function saveProgress(bankId: string, progress: Progress): void {
  persistLater(KEYS.progress(bankId), progress, 400)
}

export function saveProgressNow(bankId: string, progress: Progress): void {
  writeKey(KEYS.progress(bankId), progress)
}

function wrongChunkCount(questionCount: number): number {
  return Math.max(1, Math.ceil(questionCount / RECORD_CHUNK_SIZE))
}

export function loadWrong(meta: { id: string; questionCount: number }): WrongEntry[] {
  const entries: WrongEntry[] = []
  const count = wrongChunkCount(meta.questionCount)
  for (let index = 0; index < count; index++) {
    const chunk = readKey<WrongEntry[]>(KEYS.wrong(meta.id, index), [])
    if (Array.isArray(chunk)) entries.push(...chunk)
  }
  return entries.sort((left, right) => left.no - right.no)
}

export function saveWrongEntry(
  meta: { id: string; questionCount: number },
  entry: WrongEntry,
): void {
  const index = recordChunkIndexOf(entry.no)
  const chunk = readKey<WrongEntry[]>(KEYS.wrong(meta.id, index), [])
  const next = chunk.filter((item) => item.no !== entry.no)
  next.push(entry)
  next.sort((left, right) => left.no - right.no)
  writeKey(KEYS.wrong(meta.id, index), next)
}

export function removeWrongEntry(
  meta: { id: string; questionCount: number },
  no: number,
): void {
  const index = recordChunkIndexOf(no)
  const chunk = readKey<WrongEntry[]>(KEYS.wrong(meta.id, index), [])
  const next = chunk.filter((item) => item.no !== no)
  writeKey(KEYS.wrong(meta.id, index), next)
}

export function saveWrongEntries(
  meta: { id: string; questionCount: number },
  entries: WrongEntry[],
): void {
  const grouped = new Map<number, WrongEntry[]>()
  entries.forEach((entry) => {
    const index = recordChunkIndexOf(entry.no)
    const list = grouped.get(index) ?? []
    list.push(entry)
    grouped.set(index, list)
  })
  grouped.forEach((list, index) => {
    list.sort((left, right) => left.no - right.no)
    writeKey(KEYS.wrong(meta.id, index), list)
  })
}

export function clearWrong(meta: { id: string; questionCount: number }): void {
  const count = wrongChunkCount(meta.questionCount)
  for (let index = 0; index < count; index++) {
    removeKey(KEYS.wrong(meta.id, index))
  }
}

export function loadFavorites(meta: {
  id: string
  questionCount: number
}): FavoriteEntry[] {
  const entries: FavoriteEntry[] = []
  const count = wrongChunkCount(meta.questionCount)
  for (let index = 0; index < count; index++) {
    const chunk = readKey<FavoriteEntry[]>(KEYS.favorite(meta.id, index), [])
    if (Array.isArray(chunk)) entries.push(...chunk)
  }
  return entries.sort((left, right) => left.no - right.no)
}

export function toggleFavorite(
  meta: { id: string; questionCount: number },
  no: number,
): boolean {
  const index = recordChunkIndexOf(no)
  const chunk = readKey<FavoriteEntry[]>(KEYS.favorite(meta.id, index), [])
  const exists = chunk.some((item) => item.no === no)
  const next = exists
    ? chunk.filter((item) => item.no !== no)
    : [...chunk, { no, createdAt: Date.now() }].sort(
        (left, right) => left.no - right.no,
      )
  writeKey(KEYS.favorite(meta.id, index), next)
  return !exists
}

export function saveFavoriteEntries(
  meta: { id: string; questionCount: number },
  entries: FavoriteEntry[],
): void {
  const grouped = new Map<number, FavoriteEntry[]>()
  entries.forEach((entry) => {
    const index = recordChunkIndexOf(entry.no)
    const list = grouped.get(index) ?? []
    list.push(entry)
    grouped.set(index, list)
  })
  grouped.forEach((list, index) => {
    list.sort((left, right) => left.no - right.no)
    writeKey(KEYS.favorite(meta.id, index), list)
  })
}

export function clearFavorites(meta: { id: string; questionCount: number }): void {
  const count = wrongChunkCount(meta.questionCount)
  for (let index = 0; index < count; index++) {
    removeKey(KEYS.favorite(meta.id, index))
  }
}

export function loadSession(bankId: string): SessionState | null {
  return readKey<SessionState | null>(KEYS.session(bankId), null)
}

export function saveSession(session: SessionState, immediate = false): void {
  if (immediate) writeKey(KEYS.session(session.bankId), session)
  else persistLater(KEYS.session(session.bankId), session, 250)
}

export function saveSessionNow(session: SessionState): void {
  writeKey(KEYS.session(session.bankId), session)
}

export function clearSession(bankId: string): void {
  removeKey(KEYS.session(bankId))
}

export function saveProgressRaw(bankId: string, progress: Progress): void {
  writeKey(KEYS.progress(bankId), progress)
}

const DEFAULT_APP: AppMeta = {
  v: 1,
  installId: '',
  schemaVersion: 1,
  createdAt: 0,
  lastBackupAt: 0,
  lastActiveDate: '',
  streak: 0,
  demoSeeded: false,
}

export function loadAppMeta(): AppMeta {
  const stored = readKey<AppMeta>(KEYS.app, DEFAULT_APP)
  const meta: AppMeta = { ...DEFAULT_APP, ...stored }
  if (!meta.installId) {
    meta.installId = newId('i')
    meta.createdAt = Date.now()
    saveAppMeta(meta)
  }
  return meta
}

export function saveAppMeta(meta: AppMeta): void {
  writeKey(KEYS.app, meta)
}
