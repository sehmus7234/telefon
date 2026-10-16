import { BrowserWindow } from 'electron'
import { join } from 'path'

let splashWindow: BrowserWindow | null = null

// Açılışta gösterilen splash screen (prompt 12)
export function createSplashWindow(): BrowserWindow {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void splashWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/splash.html`)
  } else {
    void splashWindow.loadFile(join(__dirname, '../renderer/splash.html'))
  }

  splashWindow.once('ready-to-show', () => splashWindow?.show())

  // Güvenlik: ana pencere hazır olmazsa splash en geç 15 sn sonra kapatılır.
  setTimeout(() => closeSplashWindow(), 15_000)

  return splashWindow
}

export function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
    splashWindow = null
  }
}
