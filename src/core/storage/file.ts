function getWx(): any {
  return typeof wx !== 'undefined' ? wx : undefined
}

export function hasFileSystem(): boolean {
  const wx = getWx()
  return (
    !!wx &&
    typeof wx.getFileSystemManager === 'function' &&
    !!wx.env &&
    typeof wx.env.USER_DATA_PATH === 'string' &&
    wx.env.USER_DATA_PATH.length > 0
  )
}

export function userDataPath(): string {
  const wx = getWx()
  return wx?.env?.USER_DATA_PATH ?? ''
}

export function absolutePath(relativePath: string): string {
  return `${userDataPath()}/${relativePath}`
}

function manager(): any {
  return getWx().getFileSystemManager()
}

function errorMessage(error: any): string {
  return String(error?.errMsg ?? error?.message ?? error ?? '未知错误')
}

function ensureDirectory(relativeDir: string): Promise<void> {
  if (!relativeDir) return Promise.resolve()
  const dirPath = absolutePath(relativeDir)
  return new Promise((resolve, reject) => {
    manager().mkdir({
      dirPath,
      recursive: true,
      success: () => resolve(),
      fail: (error: any) => {
        const message = errorMessage(error)
        if (
          message.includes('already exists') ||
          message.includes('exist') ||
          message.includes('已存在')
        ) {
          resolve()
        } else {
          reject(new Error(message))
        }
      },
    })
  })
}

export async function writeText(relativePath: string, text: string): Promise<void> {
  if (!hasFileSystem()) throw new Error('当前环境不支持本地文件存储')
  const slash = relativePath.lastIndexOf('/')
  if (slash > 0) {
    await ensureDirectory(relativePath.slice(0, slash))
  }
  await new Promise<void>((resolve, reject) => {
    manager().writeFile({
      filePath: absolutePath(relativePath),
      data: text,
      encoding: 'utf8',
      success: () => resolve(),
      fail: (error: any) => reject(new Error(errorMessage(error))),
    })
  })
}

export async function readText(relativePath: string): Promise<string> {
  if (!hasFileSystem()) throw new Error('当前环境不支持本地文件存储')
  return readTextAbsolute(absolutePath(relativePath))
}

export async function readTextAbsolute(filePath: string): Promise<string> {
  if (!hasFileSystem()) throw new Error('当前环境不支持本地文件存储')
  return new Promise((resolve, reject) => {
    manager().readFile({
      filePath,
      encoding: 'utf8',
      success: (result: any) => resolve(String(result.data)),
      fail: (error: any) => reject(new Error(errorMessage(error))),
    })
  })
}

export async function removeFile(relativePath: string): Promise<void> {
  if (!hasFileSystem()) return
  await new Promise<void>((resolve) => {
    manager().unlink({
      filePath: absolutePath(relativePath),
      success: () => resolve(),
      fail: () => resolve(),
    })
  })
}

export async function removeDirectory(relativePath: string): Promise<void> {
  if (!hasFileSystem()) return
  await new Promise<void>((resolve) => {
    manager().rmdir({
      dirPath: absolutePath(relativePath),
      recursive: true,
      success: () => resolve(),
      fail: () => resolve(),
    })
  })
}

export async function fileExists(relativePath: string): Promise<boolean> {
  if (!hasFileSystem()) return false
  return new Promise((resolve) => {
    manager().access({
      path: absolutePath(relativePath),
      success: () => resolve(true),
      fail: () => resolve(false),
    })
  })
}
