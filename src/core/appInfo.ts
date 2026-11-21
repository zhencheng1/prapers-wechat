import pkg from '../../package.json'
import type { BankMeta } from '@/types/domain'
import { MAX_JSON_BYTES, MAX_QUESTIONS_FILE } from './constants'

/** 版本号统一从 package.json 读取，避免多处硬编码不同步。 */
export const APP_VERSION = `v${pkg.version as string}`

const SOURCE_LABELS: Record<BankMeta['source'], string> = {
  json: 'JSON',
  pdf: 'PDF',
  demo: '示例',
  manual: '手动',
}

export function sourceLabel(source: BankMeta['source']): string {
  return SOURCE_LABELS[source] ?? 'JSON'
}

export function isDemoBank(source: BankMeta['source']): boolean {
  return source === 'demo'
}

/** 与 constants.ts 保持一致，用于导入说明文案。 */
export const JSON_LIMIT_MB = Math.round(MAX_JSON_BYTES / 1024 / 1024)
export const QUESTION_LIMIT = MAX_QUESTIONS_FILE
