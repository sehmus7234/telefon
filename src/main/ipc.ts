import { ipcMain, dialog, app } from 'electron'
import type { Device, BackupFile } from '@shared/types'
import log from './logger'

// IPC kanalları (prompt 3)
// main süreçte ipcMain.handle ile tanımlanır, preload'da contextBridge ile renderer'a açılır.
export function registerIpcHandlers(): void {
  ipcMain.handle('app:get-version', () => app.getVersion())

  ipcMain.handle('devices:list', async (): Promise<Device[]> => {
    // Gerçek cihaz taraması buraya gelecek (ADB / USB / platform bağımlı kod).
    log.info('Cihaz listesi istendi (şu an boş).')
    return []
  })

  ipcMain.handle(
    'backup:create',
    async (_event, deviceId: string): Promise<BackupFile | null> => {
      log.info(`Yedekleme başlatıldı: ${deviceId}`)
      // Yedekleme mantığı buraya gelecek; şimdilik null dönüyor.
      return null
    }
  )

  ipcMain.handle('dialog:select-directory', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })
}
