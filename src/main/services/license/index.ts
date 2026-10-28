// Lisans (serial) sistemi: çevrimdışı, HMAC imzalı serial doğrulama.
//
// Serial formatı: base32( payload || HMAC-SHA256(payload)[:16] )
//   payload = 4 bayt: [0] = ürün+sürüm kodu (0x11 = telefon v1), [1..3] = nonce
//   imza    = 16 bayt (128 bit güvenlik)
// İmza anahtarı uygulamaya gömülüdür (LICENSE_SECRET). Bu yüzden serial kısadır
// (~32 karakter); anahtar tersine mühendislikle elde edilebilir, daha güçlü koruma
// için ileride asimetrik (Ed25519) imzaya dönülebilir.
//
// Süre: 183 gün (6 ay), İLK AKTİVASYONDA başlar ve makine kimliğine bağlanır.
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { LICENSE_SECRET } from './secret'
import { getMachineId } from './machineId'
import { getLicense as dbGetLicense, saveLicense as dbSaveLicense } from '../../db'
import type { LicenseStatus } from '@shared/types'

export const LICENSE_VALIDITY_DAYS = 183 // 6 ay
export const LICENSE_PRODUCT = 'telefon'
export const LICENSE_PRODUCT_BYTE = 0x11 // ürün+sürüm: telefon v1
const HMAC_BYTES = 16 // 128 bit güvenlik
const NONCE_BYTES = 3
const PAYLOAD_BYTES = 1 + NONCE_BYTES // 4
const SERIAL_BYTES = PAYLOAD_BYTES + HMAC_BYTES // 20 bayt -> base32 32 karakter

const DAY_MS = 24 * 60 * 60 * 1000

// Crockford Base32 (I, L, O, U hariç) — elle yazımda karışan karakterlerden kaçınır.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

function b32Char(c: string): number {
  const v = B32.indexOf(c)
  if (v >= 0) return v
  if (c === 'I' || c === 'L') return 1
  if (c === 'O') return 0
  return -1
}

export function base32Decode(str: string): Buffer {
  const clean = str.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const ch of clean) {
    const v = b32Char(ch)
    if (v < 0) throw new Error('Serial geçersiz karakter içeriyor.')
    value = (value << 5) | v
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

// Serial'i 5'li gruplara ayırır (yalnızca görüntüleme).
export function groupSerial(serial: string, n = 5): string {
  return serial.match(new RegExp(`.{1,${n}}`, 'g'))?.join('-') ?? serial
}

export interface SerialVerifyResult {
  ok: boolean
  product: string | null
  serialLast4: string
  reason: string
}

// Serial'i doğrular: uzunluk, HMAC imza ve ürün kodu. Saf fonksiyon (test edilebilir).
export function verifySerial(serial: string, secret: string = LICENSE_SECRET): SerialVerifyResult {
  const clean = serial.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  const last4 = clean.slice(-4) || ''
  const fail = (reason: string): SerialVerifyResult => ({
    ok: false,
    product: null,
    serialLast4: last4,
    reason
  })
  try {
    const buf = base32Decode(clean)
    if (buf.length !== SERIAL_BYTES) {
      return fail('uzunluk hatalı')
    }
    const payload = buf.subarray(0, PAYLOAD_BYTES)
    const mac = buf.subarray(PAYLOAD_BYTES)
    const expected = createHmac('sha256', secret).update(payload).digest().subarray(0, HMAC_BYTES)
    if (!timingSafeEqual(mac, expected)) {
      return fail('imza geçersiz')
    }
    if (payload[0] !== LICENSE_PRODUCT_BYTE) {
      return fail('ürün uyuşmuyor')
    }
    return { ok: true, product: LICENSE_PRODUCT, serialLast4: last4, reason: '' }
  } catch {
    return fail('çözümlenemedi')
  }
}

// Aktivasyon anından itibaren 183 gün sonrasını hesaplar.
export function computeExpiry(activatedAt: Date): Date {
  return new Date(activatedAt.getTime() + LICENSE_VALIDITY_DAYS * DAY_MS)
}

export function remainingDays(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / DAY_MS))
}

// Mevcut lisans durumu (DB kaydı + makine kimliği ile karşılaştırma).
export function getLicenseStatus(): LicenseStatus {
  const rec = dbGetLicense()
  const machineId = getMachineId()
  const empty: LicenseStatus = {
    active: false,
    reason: 'none',
    product: null,
    machineId,
    activatedAt: null,
    expiresAt: null,
    remainingDays: 0,
    serialLast4: null
  }
  if (!rec) return empty
  if (rec.machineId !== machineId) {
    return {
      active: false,
      reason: 'machine-mismatch',
      product: rec.product,
      machineId,
      activatedAt: rec.activatedAt,
      expiresAt: rec.expiresAt,
      remainingDays: 0,
      serialLast4: rec.serialLast4
    }
  }
  const left = remainingDays(rec.expiresAt)
  if (left <= 0) {
    return {
      active: false,
      reason: 'expired',
      product: rec.product,
      machineId,
      activatedAt: rec.activatedAt,
      expiresAt: rec.expiresAt,
      remainingDays: 0,
      serialLast4: rec.serialLast4
    }
  }
  return {
    active: true,
    reason: 'valid',
    product: rec.product,
    machineId,
    activatedAt: rec.activatedAt,
    expiresAt: rec.expiresAt,
    remainingDays: left,
    serialLast4: rec.serialLast4
  }
}

// Yeni serial ile aktivasyon. Geçersiz serial ya da aynı serialin yeniden girişi hata fırlatır.
export function activateLicense(serial: string): LicenseStatus {
  const v = verifySerial(serial)
  if (!v.ok || !v.product) {
    throw new Error(`Serial geçersiz (${v.reason}).`)
  }
  const normalized = serial.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
  const serialHash = createHash('sha256').update(normalized).digest('hex')
  const existing = dbGetLicense()
  if (existing && existing.serialHash === serialHash) {
    throw new Error('Bu serial zaten aktif edilmiş. Süre uzatmak için yeni bir serial girin.')
  }
  const machineId = getMachineId()
  const activatedAt = new Date()
  const expiresAt = computeExpiry(activatedAt)
  dbSaveLicense({
    serialHash,
    product: v.product,
    machineId,
    activatedAt: activatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    serialLast4: v.serialLast4
  })
  return getLicenseStatus()
}
