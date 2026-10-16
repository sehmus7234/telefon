import type { Device, DeviceStatus, ConnectionType } from '@shared/types'
import { adbExec } from './exec'
import { parseDevices } from './parse'

function toStatus(state: string): DeviceStatus {
  switch (state) {
    case 'device':
      return 'online'
    case 'offline':
      return 'offline'
    case 'unauthorized':
      return 'unauthorized'
    default:
      return 'disconnected'
  }
}

// Serial formatına göre bağlantı türünü tahmin eder (prompt 46).
// Kablosuz cihazlar `adb connect ip:port` ile bağlanır, serial ip:port olur.
export function detectConnectionType(serial: string): ConnectionType {
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(serial)) return 'wifi' // IPv4:port
  if (/^\[[0-9a-f:]+\]:\d+$/i.test(serial)) return 'wifi' // [IPv6]:port
  return 'usb'
}

// Önceki/yeni liste farkı; cihazlar seri numarasına göre benzersiz eşleştirilir (prompt 40).
export function diffDevices(
  prev: Device[],
  next: Device[]
): { added: Device[]; removed: Device[] } {
  const key = (d: Device): string => d.serialNumber ?? d.id
  const prevSet = new Set(prev.map(key))
  const nextSet = new Set(next.map(key))
  const added = next.filter((d) => !prevSet.has(key(d)))
  const removed = prev.filter((d) => !nextSet.has(key(d)))
  return { added, removed }
}

// Bağlı cihazları listeler: `adb devices -l` (prompt 22).
export async function listDevices(): Promise<Device[]> {
  const out = await adbExec(['devices', '-l'])
  return parseDevices(out).map((d) => ({
    id: d.serial,
    name: d.attrs.model ?? d.serial,
    model: d.attrs.model ?? 'Bilinmiyor',
    platform: 'android',
    serialNumber: d.serial,
    status: toStatus(d.state),
    connectionType: detectConnectionType(d.serial),
    lastConnectedAt: d.state === 'device' ? new Date().toISOString() : undefined
  }))
}

// Tek bir cihazın ham durumunu döndürür: 'device' | 'unauthorized' | 'offline' | ... (prompt 23).
export async function getDeviceState(serial: string): Promise<string | null> {
  const out = await adbExec(['devices', '-l'])
  return parseDevices(out).find((d) => d.serial === serial)?.state ?? null
}

// Yetkisiz (unauthorized) cihazların serial listesi (prompt 24).
export async function listUnauthorized(): Promise<string[]> {
  const out = await adbExec(['devices', '-l'])
  return parseDevices(out)
    .filter((d) => d.state === 'unauthorized')
    .map((d) => d.serial)
}

// Kablosuz (Wi-Fi) bağlantı (prompt 31)
export function enableWireless(serial: string, port = 5555): Promise<string> {
  return adbExec(['tcpip', String(port)], { serial })
}

export function connectWireless(ip: string, port = 5555): Promise<string> {
  return adbExec(['connect', `${ip}:${port}`])
}

export function disconnectWireless(ip: string, port = 5555): Promise<string> {
  return adbExec(['disconnect', `${ip}:${port}`])
}
