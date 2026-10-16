// Hata loglarını dosyaya kaydeder (prompt 154).
// Yapılandırılmış JSON satırları `userData/logs/errors.jsonl`'e yazılır;
// son N kayıt bellekte tutulur (UI için). Yazımlar sırayla (kuyruk) yapılır.
import { promises as fs } from 'fs'
import { join } from 'path'
import type { ErrorLogEntry } from '@shared/types'

const MAX_BUFFER = 200
let logPath: string | null = null
let buffer: ErrorLogEntry[] = []
let seq = 0
let writeTail: Promise<void> = Promise.resolve()

export function initErrorLog(baseDir: string): void {
  logPath = join(baseDir, 'logs', 'errors.jsonl')
}

export async function getErrorLogPath(): Promise<string | null> {
  if (!logPath) return null
  await fs.mkdir(join(logPath, '..'), { recursive: true })
  return logPath
}

// Bellekteki son hataları döndürür (en yeni ilk).
export function getRecentErrors(limit = 50): ErrorLogEntry[] {
  return buffer.slice(-limit).reverse()
}

// Diskten tüm hataları okur (analiz/rapor için).
export async function readAllErrors(): Promise<ErrorLogEntry[]> {
  if (!logPath) return []
  try {
    const raw = await fs.readFile(logPath, 'utf8')
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ErrorLogEntry)
  } catch {
    return []
  }
}

// Hatayı belleğe ve dosyaya ekler (fire-and-forget, sıralı yazım).
export function logError(
  level: string,
  source: string,
  message: string,
  stack?: string
): void {
  const entry: ErrorLogEntry = {
    id: ++seq,
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    stack
  }
  buffer.push(entry)
  if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER)

  if (!logPath) return
  const line = JSON.stringify(entry)
  // Yazımlar sıralı: önceki yazım bitince bunu ekle.
  writeTail = writeTail
    .then(() => fs.mkdir(join(logPath!, '..'), { recursive: true }))
    .then(() => fs.appendFile(logPath!, line + '\n', 'utf8'))
    .catch(() => {
      /* disk yazım hatası sessizce geçilir */
    })
}

// Kuyruktaki bekleyen yazımların bitmesini bekler (kapatmadan önce).
export async function flushErrorLog(): Promise<void> {
  await writeTail.catch(() => {})
}
