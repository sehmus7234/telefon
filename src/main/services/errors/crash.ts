// Çökme raporları: toplama + analiz (prompt 160) ve kritik hata işleme (156).
// Çökme raporları `userData/crashes/crash-<ts>.json` altına yazılır.
// Saf dosya/analiz mantığı burada; Electron process handler bağlantısı main/index.ts'te.
import { promises as fs } from 'fs'
import { join } from 'path'
import type { CrashSummary } from '@shared/types'

export interface CrashReportFile {
  kind: string
  timestamp: string
  message: string
  stack?: string
  context?: Record<string, unknown>
}

// Çökme raporunu dosyaya yazar; yolunu döndürür.
export async function writeCrashReport(
  baseDir: string,
  kind: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<string> {
  const dir = join(baseDir, 'crashes')
  await fs.mkdir(dir, { recursive: true })
  const report: CrashReportFile = {
    kind,
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context
  }
  const path = join(dir, `crash-${report.timestamp.replace(/[:.]/g, '-')}.json`)
  await fs.writeFile(path, JSON.stringify(report, null, 2), 'utf8')
  return path
}

// Çökme raporlarını okur ve özetler (analiz, prompt 160).
export async function analyzeCrashes(baseDir: string): Promise<CrashSummary> {
  const dir = join(baseDir, 'crashes')
  let files: string[] = []
  try {
    files = (await fs.readdir(dir)).filter((f) => f.startsWith('crash-') && f.endsWith('.json'))
  } catch {
    return { count: 0, lastCrashAt: null, topMessages: [] }
  }

  const reports: CrashReportFile[] = []
  for (const f of files) {
    try {
      reports.push(JSON.parse(await fs.readFile(join(dir, f), 'utf8')) as CrashReportFile)
    } catch {
      /* bozuk dosya atlanır */
    }
  }

  const counts = new Map<string, number>()
  for (const r of reports) {
    // Yığının ilk satırı + mesaj, gruplama anahtarı.
    const firstLine = r.stack?.split('\n')[1]?.trim() ?? r.message
    const key = `${r.kind}: ${firstLine.slice(0, 120)}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const topMessages = [...counts.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const lastCrashAt =
    reports.length > 0
      ? reports.map((r) => r.timestamp).sort().reverse()[0]
      : null

  return { count: reports.length, lastCrashAt, topMessages }
}
