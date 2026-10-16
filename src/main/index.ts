import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import log, { setupLogger } from './logger'
import { registerIpcHandlers } from './ipc'
import { createSplashWindow, closeSplashWindow } from './splash'
import { setupAutoUpdater } from './updater'
import { startDevicePolling, stopDevicePolling, refreshDevices } from './poller'
import { startUsbWatcher } from './usbWatcher'
import { initDb, closeDb } from './db'

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

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    setupLogger()
    log.info('Uygulama başlatılıyor...')
    initDb(join(app.getPath('userData'), 'telefon.db'))

    registerIpcHandlers()
    createSplashWindow()
    createMainWindow()
    startDevicePolling(() => mainWindow)
    startUsbWatcher(() => void refreshDevices())
    setupAutoUpdater(() => mainWindow)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('will-quit', () => {
    stopDevicePolling()
    closeDb()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
