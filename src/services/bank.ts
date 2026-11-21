import type {
  BankBundle,
  BankChunk,
  BankManifest,
  BankMeta,
  BankSource,
  ChunkRef,
  FavoriteEntry,
  Progress,
  Question,
  SessionState,
  StorageMode,
  WrongEntry,
} from '@/types/domain'
import { fnv1a, hashQuestion, newId, utf8ByteLength } from '@/utils'
import {
  CHUNK_SIZE_FILE,
  CHUNK_SIZE_STORAGE,
  KEYS,
} from '@/core/storage/keys'
import {
  hasFileSystem,
  readText,
  removeDirectory,
  removeFile,
  writeText,
} from '@/core/storage/file'
import {
  clearFavorites,
  clearSession,
  clearWrong,
  loadFavorites,
  loadProgress,
  loadSession,
  loadWrong,
  saveFavoriteEntries,
  saveProgressNow,
  saveSessionNow,
  saveWrongEntries,
} from '@/core/storage/records'
import { readKey, removeKey, writeKey } from '@/core/storage/uni'
import { MAX_BANKS, MAX_QUESTIONS_FILE, MAX_QUESTIONS_STORAGE } from '@/core/constants'

export interface CreateBankInput {
  meta: {
    name: string
    description?: string
    category?: string
    tags?: string[]
  }
  questions: Question[]
  id?: string
  createdAt?: number
  source?: BankSource
}

let banksCache: BankMeta[] | null = null
const manifestCache = new Map<string, BankManifest | null>()
const chunkCache = new Map<string, Map<number, Question[]>>()
const CHUNK_CACHE_LIMIT = 3

function pad4(value: number): string {
  return String(value).padStart(4, '0')
}

export function loadBanks(force = false): BankMeta[] {
  if (!banksCache || force) {
    const stored = readKey<BankMeta[]>(KEYS.banks, [])
    banksCache = Array.isArray(stored) ? stored : []
  }
  return banksCache
}

export function saveBanks(banks: BankMeta[]): void {
  banksCache = banks
  writeKey(KEYS.banks, banks)
}

export function getBank(bankId: string): BankMeta | null {
  return loadBanks().find((bank) => bank.id === bankId) ?? null
}

export function updateBankMeta(meta: BankMeta): void {
  const banks = loadBanks()
  const index = banks.findIndex((bank) => bank.id === meta.id)
  if (index < 0) return
  banks[index] = { ...meta, updatedAt: Date.now() }
  saveBanks(banks)
}

export function storageModeForNewBank(): StorageMode {
  return hasFileSystem() ? 'file' : 'storage'
}

function chunkFileRef(bankId: string, index: number): string {
  return `qb/${bankId}-chunk-${pad4(index)}.json`
}

async function writeChunk(
  meta: { id: string },
  mode: StorageMode,
  index: number,
  chunk: BankChunk,
): Promise<ChunkRef> {
  const json = JSON.stringify(chunk)
  const ref =
    mode === 'file' ? chunkFileRef(meta.id, index) : KEYS.chunk(meta.id, index)

  if (mode === 'file') {
    await writeText(ref, json)
  } else {
    writeKey(ref, chunk)
  }

  return {
    index,
    from: chunk.from,
    to: chunk.to,
    ref,
    size: utf8ByteLength(json),
  }
}

async function readChunk(meta: BankMeta, ref: ChunkRef): Promise<BankChunk> {
  if (meta.storageMode === 'file') {
    const text = await readText(ref.ref)
    return JSON.parse(text) as BankChunk
  }
  const chunk = readKey<BankChunk | null>(ref.ref, null)
  if (!chunk) throw new Error('题库分片缺失')
  return chunk
}

export async function getManifest(bankId: string): Promise<BankManifest | null> {
  if (manifestCache.has(bankId)) return manifestCache.get(bankId) ?? null

  const manifest = readKey<BankManifest | null>(KEYS.manifest(bankId), null)
  if (!manifest || !Array.isArray(manifest.chunks)) {
    manifestCache.set(bankId, null)
    return null
  }
  manifestCache.set(bankId, manifest)
  return manifest
}

export async function getQuestion(
  meta: BankMeta,
  no: number,
): Promise<Question | null> {
  if (no < 1 || no > meta.questionCount) return null
  const manifest = await getManifest(meta.id)
  if (!manifest) return null

  const index = Math.floor((no - 1) / manifest.chunkSize)
  const ref = manifest.chunks.find((chunk) => chunk.index === index)
  if (!ref) return null

  let cache = chunkCache.get(meta.id)
  if (!cache) {
    cache = new Map()
    chunkCache.set(meta.id, cache)
  }

  let questions = cache.get(index)
  if (!questions) {
    const chunk = await readChunk(meta, ref)
    questions = chunk.questions
    cache.set(index, questions)
    if (cache.size > CHUNK_CACHE_LIMIT) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
  }

  return questions.find((question) => question.no === no) ?? null
}

export async function readAllQuestions(meta: BankMeta): Promise<Question[]> {
  const manifest = await getManifest(meta.id)
  if (!manifest) return []
  const questions: Question[] = []
  for (const ref of manifest.chunks) {
    const chunk = await readChunk(meta, ref)
    questions.push(...chunk.questions)
  }
  return questions.sort((left, right) => left.no - right.no)
}

export async function createBank(input: CreateBankInput): Promise<BankMeta> {
  if (!input.questions.length) throw new Error('题库不能为空')

  const mode = storageModeForNewBank()
  const limit = mode === 'file' ? MAX_QUESTIONS_FILE : MAX_QUESTIONS_STORAGE
  if (input.questions.length > limit) {
    throw new Error(`当前存储模式单库最多 ${limit} 题`)
  }

  const banks = loadBanks()
  if (banks.length >= MAX_BANKS) {
    throw new Error(`最多只能创建 ${MAX_BANKS} 个题库`)
  }

  let id = input.id ?? newId('b')
  if (banks.some((bank) => bank.id === id)) id = newId('b')

  const questions = input.questions.map((question, index) => ({
    ...question,
    no: index + 1,
  }))
  const chunkSize = mode === 'file' ? CHUNK_SIZE_FILE : CHUNK_SIZE_STORAGE
  const chunkCount = Math.ceil(questions.length / chunkSize)
  const written: ChunkRef[] = []

  try {
    for (let index = 0; index < chunkCount; index++) {
      const start = index * chunkSize
      const slice = questions.slice(start, start + chunkSize)
      const chunk: BankChunk = {
        v: 1,
        bankId: id,
        from: slice[0].no,
        to: slice[slice.length - 1].no,
        questions: slice,
      }
      const ref = await writeChunk({ id }, mode, index, chunk)
      written.push(ref)
    }

    const createdAt = input.createdAt ?? Date.now()
    const checksum = fnv1a(
      questions.map((question) => hashQuestion(question)).join('|'),
    )
    const manifest: BankManifest = {
      v: 1,
      bankId: id,
      questionCount: questions.length,
      chunkSize,
      chunks: written,
      checksum,
      createdAt,
    }
    writeKey(KEYS.manifest(id), manifest)
    manifestCache.set(id, manifest)

    const meta: BankMeta = {
      id,
      name: input.meta.name,
      description: input.meta.description ?? '',
      category: input.meta.category ?? '',
      tags: input.meta.tags ?? [],
      source: input.source ?? 'json',
      status: 'ready',
      storageMode: mode,
      questionCount: questions.length,
      sizeBytes: written.reduce((total, ref) => total + ref.size, 0),
      createdAt,
      updatedAt: Date.now(),
      lastOpenedAt: 0,
      schemaVersion: 1,
    }

    saveBanks([...banks, meta])
    return meta
  } catch (error) {
    for (const ref of written) {
      if (mode === 'file') await removeFile(ref.ref)
      else removeKey(ref.ref)
    }
    removeKey(KEYS.manifest(id))
    banksCache = banks
    throw error
  }
}

export async function openBank(bankId: string): Promise<BankBundle | null> {
  const meta = getBank(bankId)
  if (!meta) return null
  const manifest = await getManifest(bankId)
  if (!manifest) {
    if (meta.status !== 'missing') {
      meta.status = 'missing'
      updateBankMeta(meta)
    }
    return null
  }

  meta.lastOpenedAt = Date.now()
  updateBankMeta(meta)

  return {
    meta,
    manifest,
    progress: loadProgress(bankId),
    wrong: loadWrong(meta),
    favorites: loadFavorites(meta),
    session: loadSession(bankId),
  }
}

export async function deleteBank(meta: BankMeta): Promise<void> {
  const manifest = await getManifest(meta.id)
  if (manifest) {
    for (const ref of manifest.chunks) {
      if (meta.storageMode === 'file') await removeFile(ref.ref)
      else removeKey(ref.ref)
    }
  }

  clearWrong(meta)
  clearFavorites(meta)
  clearSession(meta.id)
  removeKey(KEYS.progress(meta.id))
  removeKey(KEYS.manifest(meta.id))

  manifestCache.delete(meta.id)
  chunkCache.delete(meta.id)
  saveBanks(loadBanks().filter((bank) => bank.id !== meta.id))
}

export async function clearAllData(): Promise<void> {
  const banks = [...loadBanks(true)]
  for (const bank of banks) {
    await deleteBank(bank)
  }
  try {
    uni.clearStorageSync()
  } catch (error) {
    console.error('[bank] clear storage failed', error)
  }
  await removeDirectory('qb')
  await removeDirectory('backup')
  banksCache = []
  manifestCache.clear()
  chunkCache.clear()
}

export async function findResumableSession(): Promise<{
  meta: BankMeta
  session: SessionState
} | null> {
  let best: { meta: BankMeta; session: SessionState } | null = null
  for (const meta of loadBanks()) {
    const session = loadSession(meta.id)
    if (!session || session.finishedAt) continue
    if (!best || session.startedAt > best.session.startedAt) {
      best = { meta, session }
    }
  }
  return best
}

export function countWrong(meta: BankMeta): number {
  return loadWrong(meta).filter((entry) => entry.masteredAt === null).length
}

export function countFavorites(meta: BankMeta): number {
  return loadFavorites(meta).length
}

export async function restoreBank(
  meta: BankMeta,
  questions: Question[],
  progress: Progress,
  wrong: WrongEntry[],
  favorites: FavoriteEntry[],
  session: SessionState | null,
): Promise<BankMeta> {
  const created = await createBank({
    meta: {
      name: meta.name,
      description: meta.description,
      category: meta.category,
      tags: meta.tags,
    },
    questions,
    id: meta.id,
    createdAt: meta.createdAt,
    source: meta.source,
  })

  saveProgressNow(created.id, progress)
  if (wrong.length) saveWrongEntries(created, wrong)
  if (favorites.length) saveFavoriteEntries(created, favorites)
  if (session) saveSessionNow({ ...session, bankId: created.id })
  return created
}

export function clearBankCache(): void {
  manifestCache.clear()
  chunkCache.clear()
  banksCache = null
}
