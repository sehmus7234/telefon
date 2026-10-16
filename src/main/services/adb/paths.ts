import { existsSync } from 'fs'
import { delimiter, join } from 'path'
import type { AdbStatusInfo } from '@shared/types'

// PATH üzerinde adb arar (prompt 33).
function which(name: string): string | null {
  const pathEnv = process.env.PATH ?? ''
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue
    const p = join(dir, name)
    if (existsSync(p)) return p
  }
  return null
}

// ADB binary'sini platforma göre otomatik bulur (prompt 33).
// Öncelik sırası: ADB_PATH -> paketlenmiş resources -> SDK ortam değişkenleri
// -> yaygın kurulum konumları -> PATH.
export function findAdbPath(): string | null {
  if (process.env.ADB_PATH) return process.env.ADB_PATH

  const exe = process.platform === 'win32' ? 'adb.exe' : 'adb'
  const resourcesPath = (process as unknown as { resourcesPath?: string }).resourcesPath

  const candidates: string[] = []

  // 1) Paketlenmiş uygulama: resources/platform-tools (prompt 18)
  if (resourcesPath) candidates.push(join(resourcesPath, 'platform-tools', exe))

  // 2) Geliştirme sırasında proje içi resources
  candidates.push(join(process.cwd(), 'resources', 'platform-tools', exe))

  // 3) Android SDK ortam değişkenleri
  for (const env of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    const v = process.env[env]
    if (v) candidates.push(join(v, 'platform-tools', exe))
  }

  // 4) Yaygın kurulum konumları
  const home = process.env.HOME ?? process.env.USERPROFILE ?? ''
  if (process.platform === 'win32') {
    candidates.push(join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk', 'platform-tools', exe))
  } else if (process.platform === 'darwin') {
    candidates.push(join(home, 'Library', 'Android', 'sdk', 'platform-tools', exe))
  } else {
    candidates.push(join(home, 'Android', 'Sdk', 'platform-tools', exe))
    candidates.push(`/usr/lib/android-sdk/platform-tools/${exe}`)
    candidates.push(`/opt/android-sdk/platform-tools/${exe}`)
  }

  for (const c of candidates) {
    if (c && existsSync(c)) return c
  }

  // 5) PATH (son çare)
  return which(exe)
}

// ADB kurulu mu? (prompt 17)
export function isAdbInstalled(): boolean {
  return findAdbPath() !== null
}

export function getAdbStatus(): AdbStatusInfo {
  const path = findAdbPath()
  return { installed: path !== null, path }
}
