import { ipcMain, dialog, app, shell, nativeImage } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import type {
  Device,
  DeviceInfo,
  BackupFile,
  AdbRunResult,
  BackupType,
  TestReport,
  SecurityUpdateStatus
} from '@shared/types'
import log, { setDebugMode } from './logger'
import * as adb from './services/adb'
import { refreshDevices } from './poller'
import { startScrcpy } from './scrcpy'
import { runBackup, restoreBackup, estimateBackup } from './services/backup'
import {
  addBackup,
  listBackups,
  getBackup,
  deleteBackup,
  setSecureSetting,
  getSecureSetting,
  deleteSecureSetting,
  setSetting,
  getSetting
} from './db'
import { runTests, exportPdf } from './services/tests'
import { listFiles, pullFile, pushFile, deleteFile, createFolder } from './services/files'
import * as security from './services/security'
import { classifyCommand } from './services/security'
import {
  getRecentErrors,
  exportErrorReport,
  analyzeCrashes,
  getPerformanceMetrics,
  getMemoryStatus,
  setDebug,
  isDebug,
  flushErrorLog,
  logError
} from './services/errors'

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
    (
      event,
      opts: {
        serial: string
        types?: BackupType[]
        exclude?: string[]
        zip?: boolean
        encrypt?: boolean
        password?: string
      }
    ) => {
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
  ipcMain.handle('backup:restore', async (_e, id: number, password?: string) => {
    const b = getBackup(id)
    if (!b) throw new Error('Yedek bulunamadı')
    return restoreBackup(b.deviceSerial, b.path, {}, password)
  })

  // Cihaz testleri (prompt 114-128)
  ipcMain.handle('tests:run', (_e, serial: string) => runTests(serial))
  ipcMain.handle('tests:export-pdf', async (_e, report: TestReport) => {
    const file = join(app.getPath('userData'), `test-raporu-${Date.now()}.pdf`)
    await exportPdf(report, file)
    void shell.openPath(file)
    return file
  })

  // Dosya işlemleri (prompt 129-140)
  ipcMain.handle('files:list', (_e, serial: string, path: string) => listFiles(serial, path))
  ipcMain.handle('files:pull', (_e, serial: string, remotePath: string) =>
    pullFile(serial, remotePath, app.getPath('downloads'))
  )
  ipcMain.handle('files:push', (_e, serial: string, localPath: string, remoteDir: string) =>
    pushFile(serial, localPath, remoteDir)
  )
  ipcMain.handle('files:delete', (_e, serial: string, remotePath: string) =>
    deleteFile(serial, remotePath)
  )
  ipcMain.handle('files:mkdir', (_e, serial: string, parent: string, name: string) =>
    createFolder(serial, parent, name)
  )
  ipcMain.handle('files:thumbnail', async (_e, serial: string, remotePath: string) => {
    const tmpDir = join(app.getPath('temp'), 'telefon-thumbs')
    await fs.mkdir(tmpDir, { recursive: true })
    const localPath = await pullFile(serial, remotePath, tmpDir)
    const img = nativeImage.createFromPath(localPath)
    if (img.isEmpty()) return null
    return img.resize({ width: 128 }).toDataURL()
  })

  // Komut geçmişi (prompt 27)
  ipcMain.handle('adb:history', () => adb.getHistory())
  ipcMain.handle('adb:history:clear', () => {
    adb.clearHistory()
    return true
  })

  // İptal edilebilir genel komut (prompt 32/34) + tehlikeli komut onayı (prompt 148).
  ipcMain.handle(
    'adb:run',
    (event, args: string[], opts?: { serial?: string; timeoutMs?: number; confirmed?: boolean }) => {
      // Tehlikeli komutlarda kullanıcı onayı şart (148).
      const danger = classifyCommand(args)
      if (danger.dangerous && !opts?.confirmed) {
        throw new Error(`ONAY GEREKLİ: ${danger.reason}`)
      }
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

  // --- Güvenlik (prompt 141-150) ---

  // ADB anahtar yönetimi (143) + parmak izi (141)
  ipcMain.handle('adb:key:info', () => security.getAdbKeyInfo())
  ipcMain.handle('adb:key:ensure', () => security.ensureAdbKey())
  ipcMain.handle('adb:key:rotate', () => security.rotateAdbKey())
  ipcMain.handle('adb:key:delete', () => security.deleteAdbKey())

  // Tehlikeli komut sınıflandırma + onay (148)
  ipcMain.handle('adb:command:classify', (_e, args: string[]) => classifyCommand(args))
  ipcMain.handle('adb:command:confirm', async (_e, args: string[]) => {
    const info = classifyCommand(args)
    if (!info.dangerous) return true
    const { response } = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Onayla', 'Vazgeç'],
      defaultId: 1,
      cancelId: 1,
      title: 'Tehlikeli ADB komutu',
      message: 'Bu komut tehlikeli olabilir. Devam etmek istiyor musunuz?',
      detail: `${args.join(' ')}\n\n${info.reason}`
    })
    return response === 0
  })

  // Oturum yönetimi (146)
  ipcMain.handle('security:session:state', () => security.sessionState())
  ipcMain.handle('security:session:set-password', (_e, password: string) => {
    security.setMasterPassword(password)
    return security.sessionState()
  })
  ipcMain.handle('security:session:unlock', (_e, password: string) => {
    security.unlock(password)
    return security.sessionState()
  })
  ipcMain.handle('security:session:lock', () => {
    security.lock()
    return security.sessionState()
  })
  ipcMain.handle('security:session:change-password', (_e, oldPw: string, newPw: string) => {
    const ok = security.changeMasterPassword(oldPw, newPw)
    if (!ok) throw new Error('Mevcut parola hatalı.')
    return security.sessionState()
  })
  ipcMain.handle('security:session:remove-password', (_e, password: string) => {
    const ok = security.removeMasterPassword(password)
    if (!ok) throw new Error('Parola hatalı.')
    return security.sessionState()
  })

  // Şifreli ayar deposu (147)
  ipcMain.handle('security:secure-setting:set', (_e, key: string, value: string) => {
    setSecureSetting(key, value)
  })
  ipcMain.handle('security:secure-setting:get', (_e, key: string) => getSecureSetting(key))
  ipcMain.handle('security:secure-setting:delete', (_e, key: string) => deleteSecureSetting(key))

  // Güvenlik güncelleme kontrolü (150)
  let lastSecurityStatus: SecurityUpdateStatus | null = null
  ipcMain.handle('security:updates:check', async (): Promise<SecurityUpdateStatus> => {
    lastSecurityStatus = await security.checkSecurityUpdates({
      currentVersion: app.getVersion(),
      electronVersion: process.versions.electron ?? '0.0.0'
    })
    return lastSecurityStatus
  })
  ipcMain.handle('security:updates:status', (): SecurityUpdateStatus | null => lastSecurityStatus)

  // --- Hata yönetimi + teşhis (prompt 151-160) ---

  // Hata logları (154)
  ipcMain.handle('errors:list', (_e, limit?: number) => getRecentErrors(limit ?? 50))
  // Renderer'dan hata logu (154) — ErrorBoundary tarafından kullanılır.
  ipcMain.handle(
    'errors:log',
    (_e, level: string, source: string, message: string, stack?: string) => {
      logError(level, source, message, stack)
    }
  )

  // Hata raporu dışa aktarma (155)
  ipcMain.handle('errors:export-report', async () => {
    const result = await exportErrorReport({
      baseDir: app.getPath('userData'),
      outputDir: app.getPath('downloads')
    })
    if (result.filePath) shell.showItemInFolder(result.filePath)
    return result
  })

  // Çökme raporu analizi (160)
  ipcMain.handle('errors:crash-summary', () => analyzeCrashes(app.getPath('userData')))

  // Performans metrikleri (158)
  ipcMain.handle('perf:metrics', () => getPerformanceMetrics())

  // Bellek durumu (159)
  ipcMain.handle('memory:status', () => getMemoryStatus())

  // Debug modu (157)
  ipcMain.handle('debug:get', () => isDebug())
  ipcMain.handle('debug:set', (_e, enabled: boolean) => {
    setDebug(enabled)
    setDebugMode(enabled)
    setSetting('debug.enabled', enabled ? '1' : '0')
    return enabled
  })

  // Güvenli kapatma (156) — kullanıcı tetikli.
  ipcMain.handle('app:quit-safely', async () => {
    await flushErrorLog()
    app.quit()
    return true
  })
}
