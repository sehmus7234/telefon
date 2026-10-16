import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'
import log from './logger'

// Otomatik güncelleme altyapısı (prompt 9)
// Not: electron-updater yalnızca PAKETLENMİŞ uygulamada çalışır; dev modda devre dışıdır.
// Yayın kaynağı electron-builder.yml içindeki `publish` bloğundan gelir (GitHub Releases).
export function setupAutoUpdater(getWindow: () => BrowserWindow | null): void {
  if (!app.isPackaged) {
    log.info('AutoUpdater: geliştirme modunda devre dışı bırakıldı.')
    return
  }

  // Önce kullanıcıya haber ver, indirmeyi kullanıcı onayıyla başlat (istersen true yap).
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => log.info('Güncelleme kontrol ediliyor...'))
  autoUpdater.on('update-available', (info) => {
    log.info('Güncelleme mevcut:', info.version)
    getWindow()?.webContents.send('updater:available', info)
  })
  autoUpdater.on('update-not-available', () => log.info('Güncel sürüm kullanılıyor.'))
  autoUpdater.on('error', (err) => log.error('Güncelleme hatası:', err.message))
  autoUpdater.on('download-progress', (p) =>
    getWindow()?.webContents.send('updater:progress', p)
  )
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Güncelleme indirildi:', info.version)
    getWindow()?.webContents.send('updater:downloaded', info)
  })

  // Açılıştan 10 sn sonra ilk kontrolü başlat.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err: unknown) => {
      log.error('Güncelleme kontrolü başarısız:', err)
    })
  }, 10_000)
}

export { autoUpdater }
