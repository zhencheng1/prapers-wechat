import { MAX_JSON_BYTES } from '@/core/constants'
import { readTextAbsolute } from '@/core/storage/file'

export interface PickedFile {
  name: string
  size: number
  text: string
}

function ensureSize(size: number, maxBytes: number): void {
  if (size > maxBytes) {
    throw new Error(`文件超过 ${Math.round(maxBytes / 1024 / 1024)}MB，请拆分后导入`)
  }
}

/**
 * Picks a JSON file.
 * - WeChat: file must be sent to a chat first (文件传输助手 is fine).
 * - H5: native file input.
 */
export async function pickJsonFile(
  maxBytes = MAX_JSON_BYTES,
): Promise<PickedFile | null> {
  // #ifdef MP-WEIXIN
  const wxApi = typeof wx !== 'undefined' ? wx : (globalThis as any).wx
  if (!wxApi || typeof wxApi.chooseMessageFile !== 'function') {
    throw new Error('当前环境不支持选择文件')
  }

  let result: any
  try {
    result = await new Promise<any>((resolve, reject) => {
      wxApi.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['json'],
        success: resolve,
        fail: reject,
      })
    })
  } catch (error: any) {
    const message = String(error?.errMsg ?? error?.message ?? error)
    if (message.includes('cancel')) return null
    throw new Error(message)
  }

  const file = result?.tempFiles?.[0]
  if (!file) return null
  ensureSize(Number(file.size) || 0, maxBytes)
  const text = await readTextAbsolute(file.path)
  return { name: String(file.name ?? '题库.json'), size: Number(file.size) || 0, text }
  // #endif

  // #ifdef H5
  return new Promise<PickedFile | null>((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    let settled = false
    let changeStarted = false

    const finish = (value: PickedFile | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    input.onchange = async () => {
      changeStarted = true
      try {
        const file = input.files?.[0]
        if (!file) {
          finish(null)
          return
        }
        ensureSize(file.size, maxBytes)
        const text = await file.text()
        finish({ name: file.name, size: file.size, text })
      } catch (error) {
        if (!settled) {
          settled = true
          reject(error)
        }
      }
    }

    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!settled && !changeStarted) finish(null)
        }, 400)
      },
      { once: true },
    )

    input.click()
  })
  // #endif

  return null
}
