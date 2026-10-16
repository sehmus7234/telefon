import log from 'electron-log/main'
import { app } from 'electron'
import { join } from 'path'

// Loglama servisi (prompt 10)
// electron-log main süreçte dosyaya + konsola yazar; renderer için 'electron-log/renderer' kullanılır.
export function setupLogger(): void {
  log.initialize()
  log.errorHandler.startCatching()

  log.transports.file.resolvePathFn = () =>
    join(app.getPath('userData'), 'logs', 'main.log')
  log.transports.file.maxSize = 5 * 1024 * 1024 // 5 MB (üstüne çıkınca döndürülür)
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
  log.transports.console.level = 'info'
  log.transports.file.level = 'debug'

  log.info('Logger hazır. Log dosyası:', join(app.getPath('userData'), 'logs', 'main.log'))
}

export default log
