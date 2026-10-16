import { spawn, execFileSync } from 'child_process'
import log from './logger'

// scrcpy ile cihaz ekranını canlı görüntüleme (prompt 89).
// scrcpy ayrı bir programdır; kurulu değilse kullanıcıya net mesaj döner.
export function startScrcpy(serial: string): { ok: boolean; message: string } {
  try {
    execFileSync('scrcpy', ['--version'], { stdio: 'ignore' })
  } catch {
    return {
      ok: false,
      message: 'scrcpy bulunamadı. https://github.com/Genymobile/scrcpy adresinden kurun.'
    }
  }

  const child = spawn(
    'scrcpy',
    ['-s', serial, '--window-title', `Telefon - ${serial}`],
    { detached: true, stdio: 'ignore' }
  )
  child.on('error', (err) => log.error('scrcpy başlatılamadı:', err.message))
  child.unref()
  log.info(`scrcpy başlatıldı: ${serial}`)
  return { ok: true, message: 'scrcpy başlatıldı.' }
}
