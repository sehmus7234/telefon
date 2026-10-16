// Hata raporu dışa aktarma + gönderme (prompt 155).
// Hata logları + çökme raporları + ana logu tek bir zip'te toplar; istenirse
// yapılandırılmış bir endpoint'e yükler veya GitHub issue bağlantısı üretir.
import { promises as fs } from 'fs'
import { join, basename } from 'path'
import AdmZip from 'adm-zip'
import type { ErrorReportResult, ErrorReportDelivery } from '@shared/types'
import { readAllErrors } from './errorLog'
import { analyzeCrashes } from './crash'
import { withRetry } from './retry'

export interface ExportErrorReportOptions {
  baseDir: string // userData
  outputDir: string // örn. Downloads
}

export interface UploadErrorReportOptions extends ExportErrorReportOptions {
  endpoint?: string // POST edilecek webhook URL
  githubRepo?: string // "owner/repo" — GitHub issue ön doldurması için
  token?: string // endpoint için Bearer token (opsiyonel)
}

// Rapor zip'ini üretir; yol + özet döndürür.
export async function exportErrorReport(
  opts: ExportErrorReportOptions
): Promise<ErrorReportResult> {
  return buildErrorReport(opts)
}

async function buildErrorReport(
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

// Raporu gönderir: endpoint varsa POST, yoksa GitHub issue bağlantısı üretir;
// her iki durumda da zip yerelde bırakılır (kullanıcı ekleyebilir).
export async function uploadErrorReport(
  opts: UploadErrorReportOptions
): Promise<ErrorReportDelivery> {
  const report = await buildErrorReport(opts)
  const base = {
    filePath: report.filePath,
    entryCount: report.entryCount,
    crashCount: report.crashCount,
    summary: report.summary
  }

  // 1) Yapılandırılmış endpoint'e yükle.
  if (opts.endpoint) {
    try {
      const buf = await fs.readFile(report.filePath as string)
      const form = new FormData()
      form.append(
        'report',
        new Blob([new Uint8Array(buf)], { type: 'application/zip' }),
        basename(report.filePath as string)
      )
      form.append('summary', report.summary)

      const res = await withRetry(
        () =>
          fetch(opts.endpoint as string, {
            method: 'POST',
            headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
            body: form
          }),
        { retries: 3 }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return { ...base, method: 'endpoint', delivered: true }
    } catch (e) {
      return {
        ...base,
        method: 'endpoint',
        delivered: false,
        error: e instanceof Error ? e.message : String(e)
      }
    }
  }

  // 2) GitHub issue bağlantısı üret (ön doldurulmuş gövde).
  if (opts.githubRepo) {
    const [owner, repo] = opts.githubRepo.split('/')
    const url =
      `https://github.com/${owner}/${repo}/issues/new` +
      `?title=${encodeURIComponent('Hata raporu (Telefon)')}` +
      `&body=${encodeURIComponent(report.summary)}`
    return { ...base, method: 'github', delivered: false, url }
  }

  // 3) Sadece dosya.
  return { ...base, method: 'file', delivered: true }
}
