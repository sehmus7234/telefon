// Lisans (serial) sistemi testleri: base32, HMAC imza doğrulama, süre hesapları.
import { createHmac, randomBytes } from 'crypto'
import {
  base32Encode,
  base32Decode,
  verifySerial,
  computeExpiry,
  remainingDays,
  groupSerial,
  LICENSE_VALIDITY_DAYS
} from '../../src/main/services/license'

const TEST_SECRET = 'test-lisans-secret-1234567890abcdef'
const PRODUCT_BYTE = 0x11

function makeSerial(secret = TEST_SECRET, productByte = PRODUCT_BYTE): string {
  const payload = Buffer.concat([Buffer.from([productByte]), randomBytes(3)])
  const mac = createHmac('sha256', secret).update(payload).digest().subarray(0, 16)
  return groupSerial(base32Encode(Buffer.concat([payload, mac])))
}

describe('base32', () => {
  test('encode/decode round-trip', () => {
    const buf = Buffer.from('hello lisans 123')
    expect(base32Decode(base32Encode(buf))).toEqual(buf)
  })

  test('tire/boşluk ve küçük harf tolere edilir', () => {
    const buf = Buffer.from([1, 2, 3, 4, 5])
    const enc = base32Encode(buf)
    expect(base32Decode(`  ${enc.slice(0, 4)}-${enc.slice(4)}  `)).toEqual(buf)
  })
})

describe('verifySerial', () => {
  test('geçerli serial kabul edilir', () => {
    const r = verifySerial(makeSerial(), TEST_SECRET)
    expect(r.ok).toBe(true)
    expect(r.product).toBe('telefon')
    expect(r.serialLast4).toHaveLength(4)
  })

  test('serial 32 karakterdir (kısa format)', () => {
    expect(makeSerial().replace(/-/g, '')).toHaveLength(32)
  })

  test('boş/rastgele değer reddedilir', () => {
    expect(verifySerial('AAAA-BBBB-CCCC-DDDD', TEST_SECRET).ok).toBe(false)
    expect(verifySerial('', TEST_SECRET).ok).toBe(false)
    expect(verifySerial('not a valid serial', TEST_SECRET).ok).toBe(false)
  })

  test('yanlış anahtarla imzalanmış serial reddedilir', () => {
    const forged = makeSerial('baska-secret-000000000000000000000')
    expect(verifySerial(forged, TEST_SECRET).ok).toBe(false)
  })

  test('imzası bozulmuş serial reddedilir', () => {
    const s = makeSerial()
    const bozuk = s.slice(0, -4) + 'ZZZZ' // son karakterler değişir -> imza geçersiz
    expect(verifySerial(bozuk, TEST_SECRET).ok).toBe(false)
  })

  test('ürün kodu farklıysa reddedilir', () => {
    const forged = makeSerial(TEST_SECRET, 0x99)
    expect(verifySerial(forged, TEST_SECRET).ok).toBe(false)
  })
})

describe('süre hesapları', () => {
  test('computeExpiry 183 gün sonrasını verir', () => {
    const d = new Date('2026-01-01T00:00:00Z')
    const e = computeExpiry(d)
    expect((e.getTime() - d.getTime()) / 86400000).toBe(LICENSE_VALIDITY_DAYS)
    expect(LICENSE_VALIDITY_DAYS).toBe(183)
  })

  test('remainingDays kalan günü hesaplar', () => {
    const gelecek = new Date(Date.now() + 10 * 86400000).toISOString()
    expect(remainingDays(gelecek)).toBeGreaterThanOrEqual(9)
    expect(remainingDays(gelecek)).toBeLessThanOrEqual(10)
    const gecmis = new Date(Date.now() - 10 * 86400000).toISOString()
    expect(remainingDays(gecmis)).toBe(0)
  })
})

describe('groupSerial', () => {
  test('5li gruplara ayırır', () => {
    expect(groupSerial('ABCDEFGHIJ', 5)).toBe('ABCDE-FGHIJ')
  })
})
