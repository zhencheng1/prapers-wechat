import { writeKey } from './uni'

const timers = new Map<string, ReturnType<typeof setTimeout>>()
const pending = new Map<string, unknown>()

export function persistLater<T>(key: string, value: T, delay = 400): void {
  pending.set(key, value)
  const timer = timers.get(key)
  if (timer) clearTimeout(timer)
  timers.set(
    key,
    setTimeout(() => flushKey(key), delay),
  )
}

export function persistNow<T>(key: string, value: T): void {
  pending.delete(key)
  const timer = timers.get(key)
  if (timer) clearTimeout(timer)
  timers.delete(key)
  try {
    writeKey(key, value)
  } catch (error) {
    console.error('[persist] write failed', key, error)
  }
}

export function flushKey(key: string): void {
  const value = pending.get(key)
  if (value === undefined) return
  pending.delete(key)
  const timer = timers.get(key)
  if (timer) clearTimeout(timer)
  timers.delete(key)
  try {
    writeKey(key, value)
  } catch (error) {
    console.error('[persist] flush failed', key, error)
  }
}

export function flushAll(): void {
  const keys = [...pending.keys()]
  keys.forEach((key) => flushKey(key))
}

/** 丢弃尚未写入的延迟任务，避免清空数据后被补写回来。 */
export function cancelPending(): void {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
  pending.clear()
}
