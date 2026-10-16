import { ipcMain, dialog, app } from 'electron'
import type { Device, DeviceInfo, BackupFile, AdbRunResult } from '@shared/types'
import log from './logger'
import * as adb from './services/adb'
import { refreshDevices } from './poller'
import { startScrcpy } from './scrcpy'

// IPC kanalları: main süreçte ipcMain.handle ile tanımlanır, preload'da
// contextBridge ile renderer'a açılır.
export function registerIpcHandlers(): void {
  ipcMain.handle('app:get-version', () => app.getVersion())

  // ADB durumu (prompt 17)
  ipcMain.handle('adb:status', () => adb.getAdbStatus())

  // ADB sürümü (prompt 28)
  ipcMain.handle('adb:version', () => adb.getAdbVersion())

  // Server kontrolü (prompt 19/29)
  ipcMain.handle('adb:server:start', () => adb.startServer())
  ipcMain.handle('adb:server:stop', () => adb.killServer())
  ipcMain.handle('adb:server:restart', () => adb.restartServer())

  // Cihazlar (prompt 22/23/24)
  ipcMain.handle('devices:list', async (): Promise<Device[]> => {
    log.info('Cihaz listesi isteniyor...')
    try {
      const devices = await adb.listDevices()
      log.info(`Bulunan cihaz sayısı: ${devices.length}`)
      return devices
    } catch (e) {
      log.error('Cihaz taraması başarısız:', e)
      throw e
    }
  })
  ipcMain.handle('devices:info', (_e, serial: string): Promise<DeviceInfo> =>
    adb.getDeviceInfo(serial)
  )
  ipcMain.handle('devices:refresh', () => refreshDevices())
  ipcMain.handle('device:scrcpy', (_e, serial: string) => startScrcpy(serial))
  ipcMain.handle('devices:unauthorized', (): Promise<string[]> => adb.listUnauthorized())

  // Kablosuz (prompt 31)
  ipcMain.handle('adb:wireless:enable', (_e, serial: string, port: number) =>
    adb.enableWireless(serial, port)
  )
  ipcMain.handle('adb:wireless:connect', (_e, ip: string, port: number) =>
    adb.connectWireless(ip, port)
  )
  ipcMain.handle('adb:wireless:disconnect', (_e, ip: string, port: number) =>
    adb.disconnectWireless(ip, port)
  )

  // Yedekleme
  ipcMain.handle('backup:create', (_e, deviceId: string): Promise<BackupFile> =>
    adb.createBackup(deviceId, app.getPath('userData'))
  )

  // Komut geçmişi (prompt 27)
  ipcMain.handle('adb:history', () => adb.getHistory())
  ipcMain.handle('adb:history:clear', () => {
    adb.clearHistory()
    return true
  })

  // İptal edilebilir genel komut (prompt 32/34)
  ipcMain.handle(
    'adb:run',
    (event, args: string[], opts?: { serial?: string; timeoutMs?: number }) => {
      const { id, promise } = adb.runAbortable(args, opts)
      promise
        .then((r) => {
          const payload: AdbRunResult = { runId: id, ...r }
          event.sender.send('adb:result', payload)
        })
        .catch((e) => {
          const payload: AdbRunResult = {
            runId: id,
            stdout: '',
            stderr: '',
            code: null,
            timedOut: false,
            aborted: false,
            error: e instanceof Error ? e.message : String(e)
          }
          event.sender.send('adb:result', payload)
        })
      return id
    }
  )
  ipcMain.handle('adb:cancel', (_e, runId: string) => adb.cancelRun(runId))

  ipcMain.handle('dialog:select-directory', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })
}
