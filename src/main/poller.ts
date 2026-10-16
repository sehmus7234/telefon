import type { BrowserWindow } from 'electron'
import { listDevices, getDeviceInfo } from './services/adb'
import { diffDevices } from './services/adb/devices'
import type { Device } from '@shared/types'
import log from './logger'

let timer: NodeJS.Timeout | null = null
let previous: Device[] = []
let firstScan = true
let getWindowRef: (() => BrowserWindow | null) | null = null

// Tek tarama yapar; bağlanan/çıkan cihazları renderer'a olay olarak bildirir.
async function scanOnce(): Promise<Device[]> {
  const win = getWindowRef?.()
  const devices = await listDevices()

  if (firstScan) {
    // Açılıştaki ilk taramada bildirim fırlatma (toast gürültüsü olmasın).
    firstScan = false
    previous = devices
    win?.webContents.send('devices:changed', devices)
    return devices
  }

  const { added, removed } = diffDevices(previous, devices)
  previous = devices
  win?.webContents.send('devices:changed', devices)

  // Çıkarılanlar (prompt 38) ve yeni bağlananlar (prompt 37) ayrı bildirilir.
  for (const d of removed) win?.webContents.send('device:removed', d)
  for (const d of added) {
    win?.webContents.send('device:connected', d)
    // Yeni cihaz bağlanınca bilgilerini otomatik çek (prompt 49).
    const serial = d.serialNumber ?? d.id
    void getDeviceInfo(serial)
      .then((info) => win?.webContents.send('device:info', { serial, info }))
      .catch(() => {
        /* bilgi çekilemedi; sessiz geç */
      })
  }
  return devices
}

// Belirli aralıklarla cihaz listesini yeniler (prompt 30).
// USB kablo çıkarıldığında / takıldığında liste otomatik güncellenir.
export function startDevicePolling(
  getWindow: () => BrowserWindow | null,
  intervalMs = 2000
): void {
  stopDevicePolling()
  getWindowRef = getWindow
  previous = []
  firstScan = true
  let lastErrorSent = false

  const tick = async (): Promise<void> => {
    try {
      await scanOnce()
      lastErrorSent = false
    } catch (e) {
      log.warn('Cihaz taraması başarısız:', e)
      // Hata yalnızca bir kez bildirilir; renderer "adb kurulu değil" uyarısını gösterir.
      if (!lastErrorSent) {
        lastErrorSent = true
        getWindow()?.webContents.send('devices:error', e instanceof Error ? e.message : String(e))
      }
    }
  }

  void tick()
  timer = setInterval(() => void tick(), intervalMs)
}

export function stopDevicePolling(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// Manuel yenileme (prompt 47).
export async function refreshDevices(): Promise<Device[]> {
  return scanOnce()
}
