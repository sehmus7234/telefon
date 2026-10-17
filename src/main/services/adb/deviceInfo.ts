import { adbExec } from './exec'
import type {
  DeviceInfo,
  BatteryInfo,
  ScreenInfo,
  CpuInfo,
  MemoryInfo,
  StorageInfo,
  PackageInfo
} from '@shared/types'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// getprop okur; hata olursa boş döner.
async function prop(serial: string, key: string): Promise<string> {
  try {
    return (await adbExec(['shell', 'getprop', key], { serial })).trim()
  } catch {
    return ''
  }
}

// Genel shell komutu; hata olursa boş döner.
async function shell(serial: string, args: string[]): Promise<string> {
  try {
    return await adbExec(['shell', ...args], { serial })
  } catch {
    return ''
  }
}

// --- ayrıştırıcılar ---

const BATTERY_STATUS: Record<string, string> = {
  '1': 'unknown',
  '2': 'charging',
  '3': 'discharging',
  '4': 'not charging',
  '5': 'full'
}

const BATTERY_HEALTH: Record<string, string> = {
  '1': 'unknown',
  '2': 'good',
  '3': 'overheat',
  '4': 'dead',
  '5': 'over voltage',
  '6': 'unspecified failure',
  '7': 'cold'
}

// `dumpsys battery` -> BatteryInfo (prompt 57/58)
function parseBattery(raw: string): BatteryInfo | null {
  const level = raw.match(/level:\s*(\d+)/i)?.[1]
  if (!level) return null
  const status = raw.match(/status:\s*(\d+)/i)?.[1] ?? '1'
  const health = raw.match(/health:\s*(\d+)/i)?.[1] ?? '1'
  const tempRaw = raw.match(/temperature:\s*(\d+)/i)?.[1]
  const voltage = raw.match(/voltage:\s*(\d+)/i)?.[1]
  const technology = raw.match(/technology:\s*(\S+)/i)?.[1]
  return {
    level: Number(level),
    status: BATTERY_STATUS[status] ?? 'unknown',
    health: BATTERY_HEALTH[health] ?? 'unknown',
    temperatureC: tempRaw ? round2(Number(tempRaw) / 10) : 0,
    voltageMv: voltage ? Number(voltage) : undefined,
    technology
  }
}

// `wm size` + `wm density` -> ScreenInfo (prompt 59/60)
function parseScreen(sizeRaw: string, densityRaw: string): ScreenInfo | null {
  const sizeM = sizeRaw.match(/Physical size:\s*(\d+)x(\d+)/) ?? sizeRaw.match(/(\d+)x(\d+)/)
  const densityM = densityRaw.match(/density:\s*(\d+)/) ?? densityRaw.match(/(\d+)/)
  if (!sizeM || !densityM) return null
  return { width: Number(sizeM[1]), height: Number(sizeM[2]), densityDpi: Number(densityM[1]) }
}

// `/proc/cpuinfo` -> CpuInfo (prompt 61)
function parseCpu(raw: string): CpuInfo | null {
  const cores = (raw.match(/processor\s*:/g) ?? []).length
  const hardware = raw.match(/Hardware\s*:\s*(.+)/)?.[1]?.trim() ?? ''
  const model =
    raw.match(/model name\s*:\s*(.+)/)?.[1]?.trim() ??
    raw.match(/Processor\s*:\s*(.+)/)?.[1]?.trim() ??
    ''
  if (cores === 0 && !hardware && !model) return null
  return { cores, model, hardware }
}

// `/proc/meminfo` -> MemoryInfo (prompt 62)
function parseMemory(raw: string): MemoryInfo | null {
  const total = raw.match(/MemTotal:\s*(\d+)\s*kB/i)?.[1]
  if (!total) return null
  const avail = raw.match(/MemAvailable:\s*(\d+)\s*kB/i)?.[1]
  const totalKb = Number(total)
  const availableKb = avail ? Number(avail) : 0
  return {
    totalKb,
    availableKb,
    totalGb: round2(totalKb / 1024 / 1024),
    availableGb: round2(availableKb / 1024 / 1024)
  }
}

// `df /data` -> StorageInfo (prompt 63)
function parseStorage(raw: string): StorageInfo | null {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const dataLine = lines.find((l) => /\/data\s*$/.test(l)) ?? lines[1]
  if (!dataLine) return null
  const parts = dataLine.split(/\s+/)
  if (parts.length < 4) return null
  const totalBytes = Number(parts[1]) * 1024
  const usedBytes = Number(parts[2]) * 1024
  const freeBytes = Number(parts[3]) * 1024
  if (!Number.isFinite(totalBytes)) return null
  return { totalBytes, usedBytes, freeBytes }
}

// `pm list packages` -> string[] (prompt 65/66/67)
function parsePackages(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('package:'))
    .map((l) => l.slice('package:'.length))
}

// Bir metindeki tüm 15 haneli IMEI değerlerini bulur (tekrarsız, sırayla).
function parseImeis(raw: string): string[] {
  const found = new Set<string>()
  for (const m of raw.matchAll(/\b\d{15}\b/g)) found.add(m[0])
  return [...found]
}

// getprop çıktısında "imei" içeren anahtarlardaki 15 haneli değerleri bulur (imei1/imei2 dahil).
export function parseImeisFromProps(raw: string): string[] {
  const found = new Set<string>()
  for (const line of raw.split('\n')) {
    if (!/imei/i.test(line)) continue
    for (const imei of parseImeis(line)) found.add(imei)
  }
  return [...found]
}

// IMEI (prompt 56) — YALNIZCA OKUMA. Android 10+ root'suz cihazlarda genelde boş döner.
// `dumpsys iphonesubinfo` + tüm getprop çıktısı taranır; çift SIM'de IMEI1/IMEI2 birlikte döner.
async function readImeis(serial: string): Promise<string[]> {
  const found = new Set<string>()
  for (const imei of parseImeis(await shell(serial, ['dumpsys', 'iphonesubinfo']))) {
    found.add(imei)
  }
  for (const imei of parseImeisFromProps(await shell(serial, ['getprop']))) {
    found.add(imei)
  }
  return [...found]
}

// Paket listeleri: sistem + üçüncü parti (prompt 65/66/67)
async function readPackages(serial: string): Promise<PackageInfo | null> {
  try {
    const [sys, third] = await Promise.all([
      adbExec(['shell', 'pm', 'list', 'packages', '-s'], { serial }),
      adbExec(['shell', 'pm', 'list', 'packages', '-3'], { serial })
    ])
    return { system: parsePackages(sys), thirdParty: parsePackages(third) }
  } catch {
    return null
  }
}

// Tüm cihaz bilgilerini tek bir JSON objesinde toplar (prompt 70).
export async function getDeviceInfo(serial: string): Promise<DeviceInfo> {
  const [
    model, // 51
    manufacturer, // 52
    osVersion, // 53
    apiLevelRaw, // 54
    serialNo, // 55
    imeis, // 56
    batteryRaw, // 57
    wmSize, // 59
    wmDensity, // 60
    cpuRaw, // 61
    memRaw, // 62
    dfRaw, // 63
    suRaw, // 64
    macRaw, // 68
    localeRaw // 69
  ] = await Promise.all([
    prop(serial, 'ro.product.model'),
    prop(serial, 'ro.product.manufacturer'),
    prop(serial, 'ro.build.version.release'),
    prop(serial, 'ro.build.version.sdk'),
    prop(serial, 'ro.serialno'),
    readImeis(serial),
    shell(serial, ['dumpsys', 'battery']),
    shell(serial, ['wm', 'size']),
    shell(serial, ['wm', 'density']),
    shell(serial, ['cat', '/proc/cpuinfo']),
    shell(serial, ['cat', '/proc/meminfo']),
    shell(serial, ['df', '/data']),
    shell(serial, ['su', '-c', 'id']),
    shell(serial, ['cat', '/sys/class/net/wlan0/address']),
    prop(serial, 'persist.sys.locale')
  ])

  const packages = await readPackages(serial)

  return {
    device: {
      id: serial,
      name: model || serial,
      model: model || 'Bilinmiyor',
      platform: 'android',
      serialNumber: serial,
      status: 'online'
    },
    model: model || 'Bilinmiyor',
    manufacturer: manufacturer || 'Bilinmiyor',
    osVersion: osVersion || 'Bilinmiyor',
    apiLevel: apiLevelRaw ? Number(apiLevelRaw) : null,
    serialNo: serialNo || null,
    imei: imeis[0] ?? null,
    imeis,
    battery: parseBattery(batteryRaw),
    screen: parseScreen(wmSize, wmDensity),
    cpu: parseCpu(cpuRaw),
    memory: parseMemory(memRaw),
    storage: parseStorage(dfRaw),
    isRooted: /uid=0\s*\(root\)/i.test(suRaw),
    macAddress: macRaw.trim() || null,
    locale: localeRaw || null,
    packages
  }
}
