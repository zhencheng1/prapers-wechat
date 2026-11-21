export function readKey<T>(key: string, fallback: T): T {
  try {
    const value = uni.getStorageSync(key)
    if (value === '' || value === null || value === undefined) return fallback
    return value as T
  } catch (error) {
    console.error('[storage] read failed', key, error)
    return fallback
  }
}

export function writeKey<T>(key: string, value: T): void {
  uni.setStorageSync(key, value)
}

export function removeKey(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch (error) {
    console.error('[storage] remove failed', key, error)
  }
}

export function storageInfo(): { currentSize: number; limitSize: number } {
  try {
    const info = uni.getStorageInfoSync()
    return {
      currentSize: info.currentSize ?? 0,
      limitSize: info.limitSize ?? 10240,
    }
  } catch {
    return { currentSize: 0, limitSize: 10240 }
  }
}

export function clearAllStorage(): void {
  try {
    uni.clearStorageSync()
  } catch (error) {
    console.error('[storage] clear failed', error)
  }
}
