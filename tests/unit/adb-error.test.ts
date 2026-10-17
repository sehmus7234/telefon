// ADB hata çevirisi testleri (prompt 152).
import { humanizeAdbError, humanizeError } from '../../src/main/services/errors/adbError'

describe('adbError', () => {
  test.each([
    ['device not found', 'Cihaz bulunamadı veya bağlı değil.'],
    ['more than one device/emulator', 'Birden fazla cihaz bağlı; önce bir cihaz seçin.'],
    [
      'unauthorized',
      'Cihaz yetkili değil — telefonda "USB hata ayıklamaya izin ver" onayını verin.'
    ],
    ['permission denied', 'İzin reddedildi (yetersiz yetki).'],
    ['connection timed out', 'Bağlantı kurulamadı veya zaman aşımına uğradı.'],
    ['cannot connect to daemon', 'ADB sunucusuna bağlanılamadı; sunucuyu yeniden başlatın.'],
    ['no such file or directory', 'Dosya veya klasör bulunamadı.'],
    ['read-only file system', 'Dosya sistemi salt-okunur; yazma izni yok.']
  ])('%s → "%s"', (input, expected) => {
    expect(humanizeAdbError(input)).toBe(expected)
  })

  test('boş mesaj → bilinmeyen hata', () => {
    expect(humanizeAdbError('')).toBe('Bilinmeyen ADB hatası.')
  })

  test('tanınmayan mesaj aynen döner', () => {
    expect(humanizeAdbError('garip bir hata')).toBe('garip bir hata')
  })

  test('humanizeError: Error nesnesini çevirir', () => {
    expect(humanizeError(new Error('offline'))).toBe(
      'Cihaz çevrimdışı; kabloyu kontrol edin ve tekrar bağlanın.'
    )
  })

  test('humanizeError: Error olmayan değeri stringe çevirir', () => {
    expect(humanizeError('permission denied')).toBe('İzin reddedildi (yetersiz yetki).')
  })
})
