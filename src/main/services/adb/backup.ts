import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { BackupFile } from '@shared/types'
import { adbExec } from './exec'

// Cihaz yolu -> güvenli dosya adı (/sdcard -> sdcard)
function sanitizePath(p: string): string {
  return p.replace(/^\//, '').replace(/[/\\]/g, '_')
}

// Yedeklenen dosyaların toplam boyutunu ve sha256 manifestini hesaplar.
async function buildManifest(dir: string): Promise<{ totalBytes: number; manifest: string }> {
  const files: string[] = []
  let totalBytes = 0

  async function walk(d: string, rel = ''): Promise<void> {
    for (const entry of await fs.readdir(d, { withFileTypes: true })) {
      const full = join(d, entry.name)
      const r = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        await walk(full, r)
      } else {
        const st = await fs.stat(full)
        totalBytes += st.size
        files.push(`${r}\t${st.size}`)
      }
    }
  }

  await walk(dir)
  files.sort()
  return { totalBytes, manifest: createHash('sha256').update(files.join('\n')).digest('hex') }
}

export interface BackupOptions {
  paths?: string[] // cihazda çekilecek yollar (varsayılan: /sdcard)
}

// Cihazdan dosyaları `adb pull` ile çeker; boyut + sha256 manifest üretir.
export async function createBackup(
  serial: string,
  baseDir: string,
  options: BackupOptions = {}
): Promise<BackupFile> {
  const paths = options.paths ?? ['/sdcard']
  const id = `${serial}-${Date.now()}`
  const backupDir = join(baseDir, 'backups', id)
  await fs.mkdir(backupDir, { recursive: true })

  for (const p of paths) {
    await adbExec(['pull', p, join(backupDir, sanitizePath(p))], { serial })
  }

  const { totalBytes, manifest } = await buildManifest(backupDir)

  return {
    id,
    deviceId: serial,
    fileName: `backup-${id}`,
    filePath: backupDir,
    sizeBytes: totalBytes,
    createdAt: new Date().toISOString(),
    status: 'completed',
    checksum: manifest
  }
}
