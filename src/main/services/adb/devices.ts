import type { Device, DeviceStatus } from '@shared/types'
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
