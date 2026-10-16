import { promises as fs } from 'fs'
import { join } from 'path'
import { adbExec, lines, type AdbExecOptions } from '../adb'
import { measureDir } from './util'

export interface StageResult {
  fileCount: number
  sizeBytes: number
}

// 96 — Fotoğraflar: /sdcard/DCIM alt klasörlerini çeker (exclude destekli, 107).
export async function backupPhotos(
  serial: string,
  destDir: string,
  exclude: string[] = [],
  opts: AdbExecOptions = {}
): Promise<StageResult> {
  const photosDir = join(destDir, 'photos')
  await fs.mkdir(photosDir, { recursive: true })

  const ls = await adbExec(['shell', 'ls', '/sdcard/DCIM'], { ...opts, serial })
  const folders = lines(ls).filter((f) => f && !f.includes('*') && !exclude.includes(f))

  let fileCount = 0
  let sizeBytes = 0
  for (const f of folders) {
    const dest = join(photosDir, f)
    await adbExec(['pull', `/sdcard/DCIM/${f}`, dest], { ...opts, serial })
    const m = await measureDir(dest)
    fileCount += m.fileCount
    sizeBytes += m.totalBytes
  }
  return { fileCount, sizeBytes }
}

// 97 — Kişiler: content query ile ham döküm.
export async function backupContacts(
  serial: string,
  destDir: string,
  opts: AdbExecOptions = {}
): Promise<StageResult> {
  const out = await adbExec(
    ['shell', 'content', 'query', '--uri', 'content://contacts/phones'],
    { ...opts, serial }
  )
  const file = join(destDir, 'contacts.txt')
  await fs.writeFile(file, out, 'utf8')
  const st = await fs.stat(file)
  return { fileCount: 1, sizeBytes: st.size }
}

// 98 — SMS: content query ile ham döküm.
export async function backupSms(
  serial: string,
  destDir: string,
  opts: AdbExecOptions = {}
): Promise<StageResult> {
  const out = await adbExec(['shell', 'content', 'query', '--uri', 'content://sms'], {
    ...opts,
    serial
  })
  const file = join(destDir, 'sms.txt')
  await fs.writeFile(file, out, 'utf8')
  const st = await fs.stat(file)
  return { fileCount: 1, sizeBytes: st.size }
}

// 99 — Uygulama verileri: adb backup (Android 12+ kaldırıldı/deprecated).
export async function backupApps(
  serial: string,
  destDir: string,
  opts: AdbExecOptions = {}
): Promise<StageResult> {
  const file = join(destDir, 'apps.ab')
  await adbExec(['backup', '-f', file, '-apk', '-nosystem'], { ...opts, serial })
  const st = await fs.stat(file).catch(() => ({ size: 0 }))
  return { fileCount: 1, sizeBytes: st.size }
}
