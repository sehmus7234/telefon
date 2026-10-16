// Hassas bilgi maskeleme (prompt 149).
// Loglara/çıktılara yazılmadan önce IMEI, MAC, seri no, token, parola vb. gizlenir.
// Saf fonksiyon — headless test edilebilir.

export const REDACTED = '[GİZLİ]'

// 15 haneli IMEI.
const IMEI_RE = /\b\d{15}\b/g

// MAC adresi: aa:bb:cc:dd:ee:ff veya aa-bb-cc-dd-ee-ff.
const MAC_RE = /\b([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}\b/g

// Uzun sayı dizileri (13-19 hane): IMEI dışındaki kredi kartı/seri benzerleri.
const LONG_DIGITS_RE = /\b\d{13,19}\b/g

// Gizli anahtar=değer çiftleri (token, parola, api key, secret, ...).
const SECRET_KV_RE =
  /\b(token|access[_-]?token|refresh[_-]?token|api[_-]?key|apikey|secret|password|passwd|pwd|authorization|bearer|session[_-]?id|cookie)\b\s*[:=]\s*["']?[^\s"'&]+["']?/gi

// getprop çıktısındaki seri no alanları: `[ro.serialno]: [ABC123]` veya `key=value`.
const SERIAL_PROP_RE =
  /\[?(ro\.(boot\.)?serialno|persist\.sys\.serial)\s*\]?\s*[:=]\s*(\[[^\]]*\]|[^\s"'&\]]+)/gi

// Android yetki belirteci satırları (adb unauthorized çıktısındaki uzun token).
const ANDROID_TOKEN_RE = /\b[a-fA-F0-9]{40,}\b/g

export function maskImei(input: string): string {
  return input.replace(IMEI_RE, REDACTED)
}

export function maskMac(input: string): string {
  return input.replace(MAC_RE, REDACTED)
}

export function maskSecretKeyValues(input: string): string {
  return input.replace(SECRET_KV_RE, (_m, key: string) => `${key}=${REDACTED}`)
}

export function maskSerialProps(input: string): string {
  return input.replace(SERIAL_PROP_RE, (_m, key: string) => `${key}=${REDACTED}`)
}

// Uzun belirteçler/hash'ler (40+ hex karakter) gizlenir.
export function maskLongTokens(input: string): string {
  return input.replace(ANDROID_TOKEN_RE, REDACTED)
}

// Tüm hassas kalıpları sırayla uygular; loglarda kullanılacak ana giriş noktası.
export function maskSensitive(input: string): string {
  if (!input) return input
  let out = maskSecretKeyValues(input)
  out = maskSerialProps(out)
  out = maskImei(out)
  out = maskMac(out)
  out = maskLongTokens(out)
  out = out.replace(LONG_DIGITS_RE, REDACTED)
  return out
}

// Bir objeyi JSON'a çevirip maskeleyerek döndürür (loglama için).
export function maskObject<T>(obj: T): string {
  try {
    return maskSensitive(JSON.stringify(obj))
  } catch {
    return '[serileştirilemedi]'
  }
}
