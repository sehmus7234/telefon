import AdmZip from 'adm-zip'
import { promises as fs } from 'fs'
import { join } from 'path'
import { adbExec } from '../adb'
import type { BackupEstimate } from '@shared/types'

// Klasördeki dosya sayısı + toplam boyut.
export async function measureDir(
  dir: string
): Promise<{ fileCount: number; totalBytes: number }> {
  let fileCount = 0
  let totalBytes = 0
  async function walk(d: string): Promise<void> {
    for (const entry of await fs.readdir(d, { withFileTypes: true })) {
      const full = join(d, entry.name)
      if (entry.isDirectory()) await walk(full)
      else {
        const st = await fs.stat(full)
        fileCount++
        totalBytes += st.size
      }
    }
  }
  await walk(dir)
  return { fileCount, totalBytes }
}

// Klasörü zip'ler; zip boyutu + içindeki dosya sayısını döner (prompt 104).
export async function zipFolder(
  srcDir: string,
  zipPath: string
): Promise<{ sizeBytes: number; fileCount: number }> {
  const zip = new AdmZip()
  zip.addLocalFolder(srcDir)
  zip.writeZip(zipPath)
  const st = await fs.stat(zipPath)
  const fileCount = zip.getEntries().filter((e) => !e.isDirectory).length
  return { sizeBytes: st.size, fileCount }
}

// Zip'i bir hedef klasöre açar (şifreli yedek geri yüklemede kullanılır, 145).
export async function unzipFolder(zipPath: string, destDir: string): Promise<void> {
  const zip = new AdmZip(zipPath)
  zip.extractAllTo(destDir, true)
}

// Yedekleme öncesi tahmin (prompt 105): `du -sk` ile boyut, hız varsayımıyla süre.
const ADB_SPEED_BPS = 5 * 1024 * 1024 // 5 MB/s (USB 2.0 yaklaşık)

export async function estimateBackup(serial: string, paths: string[]): Promise<BackupEstimate> {
  let totalBytes = 0
  for (const p of paths) {
    try {
      const out = await adbExec(['shell', 'du', '-sk', p], { serial })
      const m = out.trim().match(/^(\d+)\s+/)
      if (m) totalBytes += Number(m[1]) * 1024
    } catch {
      /* yol yoksa yok say */
    }
  }
  const estimatedSeconds =
    totalBytes > 0 ? Math.max(1, Math.round(totalBytes / ADB_SPEED_BPS)) : 0
  return { totalBytes, estimatedSeconds }
}
