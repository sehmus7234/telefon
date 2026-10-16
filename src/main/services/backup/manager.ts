import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { adbExec, type AdbExecOptions } from '../adb'
import { backupPhotos, backupContacts, backupSms, backupApps } from './stages'
import { measureDir, zipFolder, unzipFolder } from './util'
import { encryptFile, decryptFile } from '../security/encryption'
import type { BackupReport, BackupType, BackupStageResult, BackupProgress } from '@shared/types'

export interface RunBackupOptions {
  serial: string
  baseDir: string
  types?: BackupType[]
  exclude?: string[]
  zip?: boolean
  encrypt?: boolean
  password?: string
  signal?: AbortSignal
  onProgress?: (p: BackupProgress) => void
}

const TUM_TIPLER: BackupType[] = ['photos', 'contacts', 'sms', 'apps']

// Yedekleme orkestratörü (prompt 100-108):
// tarih damgalı klasör (101), aşama aşama ilerleme (100), iptal (106), exclude (107),
// zip (104), şifreleme (145) ve rapor (108).
export async function runBackup(options: RunBackupOptions): Promise<BackupReport> {
  const {
    serial,
    baseDir,
    types = TUM_TIPLER,
    exclude = [],
    zip = false,
    encrypt = false,
    password,
    signal,
    onProgress
  } = options

  // Şifreleme parolasız çalışamaz (145).
  if (encrypt && !password) {
    throw new Error('Şifreli yedek için bir parola belirtmelisiniz.')
  }

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

  // Şifreleme istenirse arşiv zorunlu (tek dosya üzerinden şifreliyoruz).
  const wantArchive = zip || encrypt

  let zipPath: string | undefined
  if (wantArchive && !cancelled) {
    reportProgress('zip', done)
    const plainZip = join(dir, 'backup.zip')
    await zipFolder(dir, plainZip)
    if (encrypt) {
      // Zip'i AES-256-GCM ile şifreler; düz metin zip silinir (145).
      reportProgress('encrypt', done)
      const encPath = join(dir, 'backup.zip.enc')
      await encryptFile(plainZip, encPath, password as string)
      await fs.unlink(plainZip).catch(() => {})
      zipPath = encPath
    } else {
      zipPath = plainZip
    }
  }

  const measured = await measureDir(dir)
  const report: BackupReport = {
    id,
    deviceSerial: serial,
    types,
    dir,
    zipPath,
    encrypted: encrypt,
    fileCount: measured.fileCount,
    sizeBytes: measured.totalBytes,
    durationMs: Date.now() - started,
    status: cancelled ? 'cancelled' : 'completed',
    createdAt,
    stages
  }
  return report
}

// Geri yükleme (prompt 103 + şifreli yedek desteği 145):
// şifreli (.enc) yedek önce çözülüp açılır, sonra cihaza push edilir.
export async function restoreBackup(
  serial: string,
  backupDir: string,
  opts: AdbExecOptions = {},
  password?: string
): Promise<string> {
  let sourceDir = backupDir
  let tempDir: string | null = null

  if (backupDir.endsWith('.enc')) {
    if (!password) throw new Error('Bu yedek şifreli; geri yüklemek için parola gerekli.')
    tempDir = join(tmpdir(), `telefon-restore-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })
    const plainZip = join(tempDir, 'backup.zip')
    await decryptFile(backupDir, plainZip, password)
    await unzipFolder(plainZip, tempDir)
    sourceDir = tempDir
  }

  try {
    const photosDir = join(sourceDir, 'photos')
    const hasPhotos = await fs
      .stat(photosDir)
      .then(() => true)
      .catch(() => false)
    if (hasPhotos) {
      await adbExec(['push', `${photosDir}/.`, '/sdcard/DCIM/'], { ...opts, serial })
      return 'Fotoğraflar geri yüklendi'
    }
    await adbExec(['push', `${sourceDir}/.`, '/sdcard/'], { ...opts, serial })
    return 'Yedek geri yüklendi'
  } finally {
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}
