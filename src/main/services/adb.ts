import { execFile } from 'child_process'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import type { Device, DeviceInfo, DeviceStatus, BackupFile } from '@shared/types'

const execFileAsync = promisify(execFile)
const ADB_TIMEOUT_MS = 15_000
const MAX_BUFFER = 10 * 1024 * 1024

// Tek adb komutu çalıştırır; adb yoksa Türkçe, net bir hata fırlatır.
async function runAdb(args: string[]): Promise<string> {
  const adb = process.env.ADB_PATH ?? 'adb'
  try {
    const { stdout } = await execFileAsync(adb, args, {
      timeout: ADB_TIMEOUT_MS,
      maxBuffer: MAX_BUFFER
    })
    return stdout
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string; killed?: boolean }
    if (e.code === 'ENOENT') {
      throw new Error(
        "adb bulunamadı. Android SDK platform-tools kurun ve PATH'e ekleyin ya da ADB_PATH ortam değişkenini tanımlayın."
      )
    }
    if (e.killed) {
      throw new Error(`adb komutu zaman aşımına uğradı (${args[0]}).`)
    }
    throw new Error(
      `adb komutu başarısız (${args[0]}): ${(e.stderr ?? e.message ?? '').toString().trim()}`
    )
  }
}

// `model:Pixel_6 product:...` gibi anahtar:değer çiftlerini ayrıştırır.
function parseAttrs(s: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of s.split(/\s+/)) {
    const idx = part.indexOf(':')
    if (idx > 0) out[part.slice(0, idx)] = part.slice(idx + 1)
  }
  return out
}

// `adb devices -l` çıktısını Device[] listesine çevirir.
export async function listDevices(): Promise<Device[]> {
  const out = await runAdb(['devices', '-l'])
  const devices: Device[] = []

  for (const raw of out.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('List of devices') || line.startsWith('* daemon')) continue

    const [serial, state, ...rest] = line.split(/\s+/)
    if (!serial) continue

    const attrs = parseAttrs(rest.join(' '))
    const status: DeviceStatus =
      state === 'device' ? 'online' : state === 'offline' ? 'offline' : 'disconnected'

    devices.push({
      id: serial,
      name: attrs.model ?? serial,
      model: attrs.model ?? 'Bilinmiyor',
      platform: 'android',
      serialNumber: serial,
      status,
      lastConnectedAt: status === 'online' ? new Date().toISOString() : undefined
    })
  }

  return devices
}

// Cihaz detaylarını getprop üzerinden okur.
export async function getDeviceInfo(serial: string): Promise<DeviceInfo> {
  const prop = async (key: string): Promise<string> =>
    (await runAdb(['-s', serial, 'shell', 'getprop', key])).trim()

  const [model, manufacturer, osVersion] = await Promise.all([
    prop('ro.product.model'),
    prop('ro.product.manufacturer'),
    prop('ro.build.version.release')
  ])

  return {
    device: {
      id: serial,
      name: model || serial,
      model: model || 'Bilinmiyor',
      platform: 'android',
      serialNumber: serial,
      status: 'online'
    },
    manufacturer: manufacturer || 'Bilinmiyor',
    osVersion: osVersion || 'Bilinmiyor'
  }
}

// Cihaz yolu -> güvenli dosya adı (/sdcard -> sdcard)
function sanitizePath(p: string): string {
  return p.replace(/^\//, '').replace(/[\/\\]/g, '_')
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
  const manifest = createHash('sha256').update(files.join('\n')).digest('hex')
  return { totalBytes, manifest }
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
    const dest = join(backupDir, sanitizePath(p))
    await runAdb(['-s', serial, 'pull', p, dest])
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
