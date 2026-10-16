import log from './logger'

// node-usb (isteğe bağlı) ile USB attach/detach dinleme (prompt 36).
// node-usb NATIVE bir modüldür ve USB seviyesinde çalışır (ADB farkında değildir);
// kurulu değilse try/catch ile sessizce devre dışı kalır. Cihaz algılama yine de
// ADB polling (poller.ts) ile çalışır. electron.vite.config.ts'te `usb` external
// işaretlidir, böylece kurulu olmasa da derleme kırılmaz.
//
// Kurulum (isteğe bağlı):
//   npm i usb
//   npx electron-rebuild -f -w usb   (Electron ABI'sine göre yeniden derle)
// electron-builder için: npmRebuild:false + buildDependenciesFromSource:true.
declare const require: (id: string) => unknown

interface UsbModule {
  on: (event: 'attach' | 'detach', listener: () => void) => void
}

let started = false

export function startUsbWatcher(onChange: () => void): void {
  if (started) return
  started = true

  try {
    const usb = require('usb') as UsbModule
    usb.on('attach', () => {
      log.info('USB cihaz takıldı (node-usb)')
      onChange()
    })
    usb.on('detach', () => {
      log.info('USB cihaz çıkarıldı (node-usb)')
      onChange()
    })
    log.info('USB watcher aktif (node-usb)')
  } catch {
    log.info('node-usb kurulu değil; USB watcher devre dışı (ADB polling kullanılıyor).')
  }
}
