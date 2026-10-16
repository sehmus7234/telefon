import type { BrowserWindow } from 'electron'
import { listDevices } from './services/adb'
import log from './logger'

let timer: NodeJS.Timeout | null = null

// Belirli aralıklarla cihaz listesini yeniler ve renderer'a bildirir (prompt 30).
// USB kablo çıkarıldığında / takıldığında liste otomatik güncellenir.
export function startDevicePolling(
  getWindow: () => BrowserWindow | null,
  intervalMs = 2000
): void {
  stopDevicePolling()
  let lastErrorSent = false

  const tick = async (): Promise<void> => {
    try {
      const devices = await listDevices()
      lastErrorSent = false
      getWindow()?.webContents.send('devices:changed', devices)
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
