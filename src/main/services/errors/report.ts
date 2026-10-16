// Hata raporu dışa aktarma (prompt 155).
// Hata logları + çökme raporları + ana logu tek bir zip'te toplar.
import { promises as fs } from 'fs'
import { join } from 'path'
import AdmZip from 'adm-zip'
import type { ErrorReportResult } from '@shared/types'
import { readAllErrors } from './errorLog'
import { analyzeCrashes } from './crash'

export interface ExportErrorReportOptions {
  baseDir: string // userData
  outputDir: string // örn. Downloads
}

// Rapor zip'ini üretir; yol + özet döndürür.
export async function exportErrorReport(
  opts: ExportErrorReportOptions
): Promise<ErrorReportResult> {
  const { baseDir, outputDir } = opts
  const errors = await readAllErrors()
  const crashes = await analyzeCrashes(baseDir)

  const mainLogPath = join(baseDir, 'logs', 'main.log')
  let mainLog = ''
  try {
    mainLog = await fs.readFile(mainLogPath, 'utf8')
  } catch {
    /* log yok */
  }

  const summary =
    `Telefon hata raporu\n` +
    `Üretim: ${new Date().toISOString()}\n` +
    `Hata kaydı: ${errors.length}\n` +
    `Çökme raporu: ${crashes.count}\n` +
    (crashes.lastCrashAt ? `Son çökme: ${crashes.lastCrashAt}\n` : '') +
    `Platform: ${process.platform} ${process.arch}\n` +
    `Node: ${process.versions.node} · Electron: ${process.versions.electron ?? '?'}\n`

  const zip = new AdmZip()
  zip.addFile('rapor.txt', Buffer.from(summary, 'utf8'))
  zip.addFile(
    'errors.jsonl',
    Buffer.from(errors.map((e) => JSON.stringify(e)).join('\n'), 'utf8')
  )
  if (mainLog) zip.addFile('main.log', Buffer.from(mainLog, 'utf8'))

  // Çökme raporlarını da ekle.
  try {
    const crashDir = join(baseDir, 'crashes')
    for (const f of await fs.readdir(crashDir)) {
      if (f.endsWith('.json')) {
        zip.addFile(`crashes/${f}`, await fs.readFile(join(crashDir, f)))
      }
    }
  } catch {
    /* çökme klasörü yok */
  }

  const filePath = join(outputDir, `telefon-hata-raporu-${Date.now()}.zip`)
  await fs.mkdir(outputDir, { recursive: true })
  zip.writeZip(filePath)

  return {
    filePath,
    entryCount: errors.length,
    crashCount: crashes.count,
    summary
  }
}
