import { ipcMain, dialog, app } from 'electron'
import type { Device, DeviceInfo, BackupFile, AdbRunResult, BackupType } from '@shared/types'
import log from './logger'
import * as adb from './services/adb'
import { refreshDevices } from './poller'
import { startScrcpy } from './scrcpy'
import { runBackup, restoreBackup, estimateBackup } from './services/backup'
import { addBackup, listBackups, getBackup, deleteBackup } from './db'

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

  // Yedekleme (prompt 96-110)
  const activeBackups = new Map<string, AbortController>()

  ipcMain.handle(
    'backup:run',
    (event, opts: { serial: string; types?: BackupType[]; exclude?: string[]; zip?: boolean }) => {
      const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const controller = new AbortController()
      activeBackups.set(runId, controller)
      runBackup({
        ...opts,
        baseDir: app.getPath('userData'),
        signal: controller.signal,
        onProgress: (p) => event.sender.send('backup:progress', { runId, ...p })
      })
        .then((report) => {
          const dbId = addBackup(report)
          event.sender.send('backup:result', { runId, report, dbId })
        })
        .catch((e) => {
          event.sender.send('backup:result', {
            runId,
            error: e instanceof Error ? e.message : String(e)
          })
        })
        .finally(() => activeBackups.delete(runId))
      return runId
    }
  )
  ipcMain.handle('backup:cancel', (_e, runId: string) => {
    const c = activeBackups.get(runId)
    if (c) c.abort()
    return !!c
  })
  ipcMain.handle('backup:estimate', (_e, serial: string, paths: string[]) =>
    estimateBackup(serial, paths)
  )
  ipcMain.handle('backup:list', () => listBackups())
  ipcMain.handle('backup:delete', (_e, id: number) => deleteBackup(id))
  ipcMain.handle('backup:restore', async (_e, id: number) => {
    const b = getBackup(id)
    if (!b) throw new Error('Yedek bulunamadı')
    return restoreBackup(b.deviceSerial, b.path)
  })

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
