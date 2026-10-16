// Hata ayıklama modu (prompt 157).
// Geliştirici için detaylı loglama; açıkken debug() çıktıları ve verbose loglar etkinleşir.
let enabled = false
let sink: (message: string) => void = (m) => console.debug(m)

export function setDebug(value: boolean): void {
  enabled = value
}

export function isDebug(): boolean {
  return enabled
}

// Debug çıktılarının yazılacağı hedefi ayarlar (electron-log'a bağlanır).
export function setDebugSink(fn: (message: string) => void): void {
  sink = fn
}

// Yalnızca debug modu açıkken çıktı üretir.
export function debug(...args: unknown[]): void {
  if (!enabled) return
  const message = args
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ')
  sink(message)
}
