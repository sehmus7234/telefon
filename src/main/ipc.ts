import { ipcMain, dialog, app } from 'electron'
import type { Device, DeviceInfo, BackupFile } from '@shared/types'
import log from './logger'
import { listDevices, getDeviceInfo, createBackup } from './services/adb'

// IPC kanalları (prompt 3)
// main süreçte ipcMain.handle ile tanımlanır, preload'da contextBridge ile renderer'a açılır.
export function registerIpcHandlers(): void {
  ipcMain.handle('app:get-version', () => app.getVersion())

  ipcMain.handle('devices:list', async (): Promise<Device[]> => {
    log.info('Cihaz listesi isteniyor...')
    try {
      const devices = await listDevices()
      log.info(`Bulunan cihaz sayısı: ${devices.length}`)
      return devices
    } catch (e) {
      log.error('Cihaz taraması başarısız:', e)
      throw e // renderer'a iletilir, store hata state'ini doldurur
    }
  })

  ipcMain.handle('devices:info', async (_event, serial: string): Promise<DeviceInfo> => {
    log.info(`Cihaz bilgisi isteniyor: ${serial}`)
    return getDeviceInfo(serial)
  })

  ipcMain.handle('backup:create', async (_event, deviceId: string): Promise<BackupFile> => {
    log.info(`Yedekleme başlatıldı: ${deviceId}`)
    return createBackup(deviceId, app.getPath('userData'))
  })

  ipcMain.handle('dialog:select-directory', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })
}
