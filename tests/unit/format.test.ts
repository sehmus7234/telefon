// Biçim yardımcıları testleri (prompt 135 + lisans geri sayımı).
import {
  formatBytes,
  kalanSureyiParca,
  kalanSureyiFormatla
} from '../../src/renderer/src/utils/format'

describe('formatBytes', () => {
  test('byte aralığı', () => {
    expect(formatBytes(500)).toBe('500 B')
  })

  test('KB aralığı', () => {
    expect(formatBytes(2048)).toBe('2.0 KB')
  })

  test('MB aralığı', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  test('GB aralığı', () => {
    expect(formatBytes(3 * 1024 ** 3)).toBe('3.0 GB')
  })

  test('TB aralığı', () => {
    expect(formatBytes(2 * 1024 ** 4)).toBe('2.0 TB')
  })
})

describe('kalanSureyiParca', () => {
  const GUN = 24 * 60 * 60 * 1000

  test('sıfır süre hepsi 0', () => {
    expect(kalanSureyiParca(0)).toEqual({ ay: 0, gun: 0, saat: 0, dakika: 0, saniye: 0 })
  })

  test('183 gün = 6 ay 3 gün', () => {
    expect(kalanSureyiParca(183 * GUN)).toEqual({
      ay: 6,
      gun: 3,
      saat: 0,
      dakika: 0,
      saniye: 0
    })
  })

  test('saat/dakika/saniye parçalanır', () => {
    const ms = 1 * 60 * 60 * 1000 + 2 * 60 * 1000 + 3 * 1000 // 1 saat 2 dk 3 sn
    expect(kalanSureyiParca(ms)).toEqual({ ay: 0, gun: 0, saat: 1, dakika: 2, saniye: 3 })
  })

  test('negatif süre 0 olarak kabul edilir', () => {
    expect(kalanSureyiParca(-5000)).toEqual({ ay: 0, gun: 0, saat: 0, dakika: 0, saniye: 0 })
  })
})

describe('kalanSureyiFormatla', () => {
  const GUN = 24 * 60 * 60 * 1000

  test('183 gün tam biçimde', () => {
    expect(kalanSureyiFormatla(183 * GUN)).toBe('6 ay 3 gün 0 saat 0 dakika 0 saniye')
  })

  test('1 saat 2 dk 3 sn', () => {
    const ms = 1 * 60 * 60 * 1000 + 2 * 60 * 1000 + 3 * 1000
    expect(kalanSureyiFormatla(ms)).toBe('0 ay 0 gün 1 saat 2 dakika 3 saniye')
  })
})
