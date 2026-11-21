const NS = 'qb:v1'

function pad4(index: number): string {
  return String(index).padStart(4, '0')
}

export const KEYS = {
  app: `${NS}:app`,
  settings: `${NS}:settings`,
  banks: `${NS}:banks`,
  stats: `${NS}:stats:daily`,
  manifest: (bankId: string) => `${NS}:bank:${bankId}:manifest`,
  progress: (bankId: string) => `${NS}:bank:${bankId}:progress`,
  wrong: (bankId: string, index: number) =>
    `${NS}:bank:${bankId}:wrong:${pad4(index)}`,
  favorite: (bankId: string, index: number) =>
    `${NS}:bank:${bankId}:favorite:${pad4(index)}`,
  session: (bankId: string) => `${NS}:bank:${bankId}:session`,
  chunk: (bankId: string, index: number) =>
    `${NS}:bank:${bankId}:chunk:${pad4(index)}`,
}

export const CHUNK_SIZE_FILE = 300
export const CHUNK_SIZE_STORAGE = 150
export const RECORD_CHUNK_SIZE = 200

export function chunkIndexOf(no: number, chunkSize: number): number {
  return Math.floor((Math.max(1, no) - 1) / chunkSize)
}

export function recordChunkIndexOf(no: number): number {
  return chunkIndexOf(no, RECORD_CHUNK_SIZE)
}
