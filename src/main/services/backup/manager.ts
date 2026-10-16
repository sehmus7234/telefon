import { promises as fs } from 'fs'
import { join } from 'path'
import { adbExec, type AdbExecOptions } from '../adb'
import { backupPhotos, backupContacts, backupSms, backupApps } from './stages'
import { measureDir, zipFolder } from './util'
import type { BackupReport, BackupType, BackupStageResult, BackupProgress } from '@shared/types'

export interface RunBackupOptions {
  serial: string
  baseDir: string
  types?: BackupType[]
  exclude?: string[]
  zip?: boolean
  signal?: AbortSignal
  onProgress?: (p: BackupProgress) => void
}

const TUM_TIPLER: BackupType[] = ['photos', 'contacts', 'sms', 'apps']

// Yedekleme orkestratörü (prompt 100-108):
// tarih damgalı klasör (101), aşama aşama ilerleme (100), iptal (106), exclude (107),
// zip (104) ve rapor (108).
export async function runBackup(options: RunBackupOptions): Promise<BackupReport> {
  const { serial, baseDir, types = TUM_TIPLER, exclude = [], zip = false, signal, onProgress } = options
  const id = `bk-${Date.now()}`
  const createdAt = new Date().toISOString()
  const timestamp = createdAt.replace(/[:.]/g, '-')
  const dir = join(baseDir, 'backups', `${serial}_${timestamp}`)
  await fs.mkdir(dir, { recursive: true })

  const started = Date.now()
  const stages: BackupStageResult[] = []
  const total = types.length

  const reportProgress = (stage: string, done: number) => {
    const percent = total === 0 ? 100 : Math.round((done / total) * 100)
    onProgress?.({ stage, percent })
  }

  let done = 0
  for (const t of types) {
    if (signal?.aborted) break
    try {
      let r: { fileCount: number; sizeBytes: number }
      if (t === 'photos') r = await backupPhotos(serial, dir, exclude, { signal })
      else if (t === 'contacts') r = await backupContacts(serial, dir, { signal })
      else if (t === 'sms') r = await backupSms(serial, dir, { signal })
      else if (t === 'apps') r = await backupApps(serial, dir, { signal })
      else continue
      stages.push({ type: t, fileCount: r.fileCount, sizeBytes: r.sizeBytes })
    } catch (e) {
      stages.push({
        type: t,
        fileCount: 0,
        sizeBytes: 0,
        error: e instanceof Error ? e.message : String(e)
      })
    }
    done++
    reportProgress(t, done)
  }

  const cancelled = signal?.aborted ?? false

  let zipPath: string | undefined
  if (zip && !cancelled) {
    reportProgress('zip', done)
    zipPath = join(dir, 'backup.zip')
    await zipFolder(dir, zipPath)
  }

  const measured = await measureDir(dir)
  const report: BackupReport = {
    id,
    deviceSerial: serial,
    types,
    dir,
    zipPath,
    fileCount: measured.fileCount,
    sizeBytes: measured.totalBytes,
    durationMs: Date.now() - started,
    status: cancelled ? 'cancelled' : 'completed',
    createdAt,
    stages
  }
  return report
}

// Geri yükleme (prompt 103): yedek klasörünü cihaza push eder.
export async function restoreBackup(
  serial: string,
  backupDir: string,
  opts: AdbExecOptions = {}
): Promise<string> {
  const photosDir = join(backupDir, 'photos')
  const hasPhotos = await fs
    .stat(photosDir)
    .then(() => true)
    .catch(() => false)
  if (hasPhotos) {
    await adbExec(['push', `${photosDir}/.`, '/sdcard/DCIM/'], { ...opts, serial })
    return 'Fotoğraflar geri yüklendi'
  }
  await adbExec(['push', `${backupDir}/.`, '/sdcard/'], { ...opts, serial })
  return 'Yedek geri yüklendi'
}
