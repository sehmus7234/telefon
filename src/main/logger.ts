import log from 'electron-log/main'
import { app } from 'electron'
import { join } from 'path'
import { maskSensitive } from './services/security/redact'

// Loglama servisi (prompt 10 + hassas bilgi maskeleme 149)
// electron-log main süreçte dosyaya + konsola yazar; renderer için 'electron-log/renderer' kullanılır.
export function setupLogger(): void {
  log.initialize()
  log.errorHandler.startCatching()

  // Hassas veriler (IMEI, MAC, seri no, token, parola) loga yazılmadan maskelenir (149).
  log.hooks.push((message) => {
    if (message && Array.isArray(message.data)) {
      message.data = message.data.map((d) => {
        if (typeof d === 'string') return maskSensitive(d)
        try {
          return maskSensitive(JSON.stringify(d))
        } catch {
          return maskSensitive(String(d))
        }
      })
    }
    return message
  })

  log.transports.file.resolvePathFn = () =>
    join(app.getPath('userData'), 'logs', 'main.log')
  log.transports.file.maxSize = 5 * 1024 * 1024 // 5 MB (üstüne çıkınca döndürülür)
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
  log.transports.console.level = 'info'
  log.transports.file.level = 'debug'

  log.info('Logger hazır. Log dosyası:', join(app.getPath('userData'), 'logs', 'main.log'))
}

export default log
