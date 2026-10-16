import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import log, { setupLogger, setDebugMode } from './logger'
import { registerIpcHandlers } from './ipc'
import { createSplashWindow, closeSplashWindow } from './splash'
import { setupAutoUpdater } from './updater'
import { startDevicePolling, stopDevicePolling, refreshDevices } from './poller'
import { startUsbWatcher } from './usbWatcher'
import { initDb, closeDb, getSetting } from './db'
import { initSecretStore } from './services/security'
import {
  initErrorLog,
  logError,
  flushErrorLog,
  initPerformance,
  startMemoryMonitor,
  stopMemoryMonitor,
  writeCrashReport,
  setDebug,
  setDebugSink
} from './services/errors'

let mainWindow: BrowserWindow | null = null

// Ana pencere: 1200x800, minimum 900x600 (prompt 11)
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false, // hazır olunca gösterilir (splash kapandıktan sonra)
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true, // renderer yalnızca contextBridge ile açılan API'ye erişir
      nodeIntegration: false, // renderer'da require/Node yok
      sandbox: false // electron-vite preload'u CJS paketlediği için gerekli
    }
  })

  mainWindow.once('ready-to-show', () => {
    closeSplashWindow()
    mainWindow?.show()
  })

  // Dış bağlantılar varsayılan tarayıcıda açılır, Electron içinde pencere açılmaz.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Tek örnek kilidi (prompt 13): ikinci açılış mevcut pencereyi öne getirir.
const gotTheLock = app.requestSingleInstanceLock()

// Kritik hatalarda güvenli kapatma (156): logları boşalt, DB'yi kapat, çık.
function shutdownSafely(reason: string): void {
  log.error('Kritik hata — uygulama güvenli şekilde kapatılıyor:', reason)
  stopDevicePolling()
  stopMemoryMonitor()
  void flushErrorLog().finally(() => {
    try {
      closeDb()
    } catch {
      /* DB zaten kapalı olabilir */
    }
    // app.quit() bazı hata bağlamlarında tetiklenmeyebilir; app.exit daha güvenilir.
    app.exit(1)
  })
}

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    setupLogger()
    log.info('Uygulama başlatılıyor...')
    const userData = app.getPath('userData')

    // Hata yönetimi + teşhis altyapısı (154-160).
    initErrorLog(userData)
    initPerformance()
    setDebugSink((m) => log.debug(m))

    // Kritik hata yakalama: çökme raporu + güvenli kapatma (156/160).
    process.on('uncaughtException', (err) => {
      logError('critical', 'uncaughtException', err.message, err.stack)
      void writeCrashReport(userData, 'uncaughtException', err)
      shutdownSafely('uncaughtException')
    })
    process.on('unhandledRejection', (reason) => {
      const msg = reason instanceof Error ? reason.message : String(reason)
      const stack = reason instanceof Error ? reason.stack : undefined
      logError('error', 'unhandledRejection', msg, stack)
      void writeCrashReport(userData, 'unhandledRejection', reason)
    })

    // Şifreli ayar deposu (147) DB'den önce başlatılmalı (secure settings master key).
    await initSecretStore(userData)
    initDb(join(userData, 'telefon.db'))

    // Debug modu (157): kalıcı ayardan yükle.
    const debugEnabled = getSetting('debug.enabled') === '1'
    setDebug(debugEnabled)
    setDebugMode(debugEnabled)

    registerIpcHandlers()
    createSplashWindow()
    createMainWindow()
    startDevicePolling(() => mainWindow)
    startUsbWatcher(() => void refreshDevices())
    setupAutoUpdater(() => mainWindow)
    startMemoryMonitor() // bellek izleme (159)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('will-quit', () => {
    stopDevicePolling()
    stopMemoryMonitor()
    void flushErrorLog()
    closeDb()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
