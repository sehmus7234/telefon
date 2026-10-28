// Lisans (serial) sistemi testleri: base32, imza doğrulama, süre hesapları.
import { generateKeyPairSync, sign } from 'crypto'
import {
  base32Encode,
  base32Decode,
  verifySerial,
  computeExpiry,
  remainingDays,
  groupSerial,
  LICENSE_VALIDITY_DAYS
} from '../../src/main/services/license'

// Test için bağımsız anahtar çifti (uygulamanın gömülü anahtarına bağımlı değil).
const { publicKey, privateKey } = generateKeyPairSync('ed25519')
const pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString()

function makeSerial(
  payload = `telefon.v1.${'a'.repeat(16)}`,
  key: { export: () => void } & object = privateKey
): string {
  const sig = sign(null, Buffer.from(payload), key as never)
  const body = Buffer.concat([Buffer.from([Buffer.byteLength(payload)]), Buffer.from(payload), sig])
  return groupSerial(base32Encode(body))
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
    const r = verifySerial(makeSerial(), pubPem)
    expect(r.ok).toBe(true)
    expect(r.product).toBe('telefon')
    expect(r.serialLast4).toHaveLength(4)
  })

  test('boş/rastgele değer reddedilir', () => {
    expect(verifySerial('AAAA-BBBB-CCCC-DDDD', pubPem).ok).toBe(false)
    expect(verifySerial('', pubPem).ok).toBe(false)
    expect(verifySerial('not a valid serial at all', pubPem).ok).toBe(false)
  })

  test('yanlış anahtarla imzalanmış serial reddedilir', () => {
    const other = generateKeyPairSync('ed25519')
    const forged = makeSerial(undefined, other.privateKey as never)
    expect(verifySerial(forged, pubPem).ok).toBe(false)
  })

  test('imzası bozulmuş serial reddedilir', () => {
    const s = makeSerial()
    const bozuk = s.slice(0, -4) + 'ZZZZ' // son karakterler değişir -> imza geçersiz
    expect(verifySerial(bozuk, pubPem).ok).toBe(false)
  })

  test('ürün adı farklıysa reddedilir', () => {
    const forged = makeSerial(`baska.v1.${'a'.repeat(16)}`)
    expect(verifySerial(forged, pubPem).ok).toBe(false)
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
