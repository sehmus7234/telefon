// IMEI yardımcıları testleri (biçim + Luhn checksum).
import { normalizeImei, isValidImei } from '../../src/renderer/src/utils/imei'

describe('normalizeImei', () => {
  test('boşluk ve tireleri kaldırır', () => {
    expect(normalizeImei('49-015420-323751-8')).toBe('490154203237518')
    expect(normalizeImei(' 490154203237518 ')).toBe('490154203237518')
  })
})

describe('isValidImei', () => {
  test("geçerli IMEI'yi kabul eder", () => {
    expect(isValidImei('490154203237518')).toBe(true)
    expect(isValidImei('356938035643809')).toBe(true)
  })

  test("tireli/boşluklu geçerli IMEI'yi kabul eder", () => {
    expect(isValidImei('49-015420-323751-8')).toBe(true)
  })

  test('hatalı checksum reddeder', () => {
    // Son basamağı değiştirilmiş: 490154203237519
    expect(isValidImei('490154203237519')).toBe(false)
  })

  test('yanlış uzunluk reddeder', () => {
    expect(isValidImei('49015420323751')).toBe(false) // 14 hane
    expect(isValidImei('4901542032375180')).toBe(false) // 16 hane
  })

  test('rakam dışı karakter reddeder', () => {
    expect(isValidImei('49015420323751a')).toBe(false)
  })

  test("tamamı sıfır (null/placeholder) IMEI'yi reddeder", () => {
    expect(isValidImei('000000000000000')).toBe(false)
  })

  test('boş değer reddeder', () => {
    expect(isValidImei('')).toBe(false)
  })
})
