// getprop tabanlı IMEI ayrıştırma testleri (headless; gerçek cihaz gerekmez).
/** @jest-environment node */
import { parseImeisFromProps } from '../../src/main/services/adb/deviceInfo'

describe('parseImeisFromProps', () => {
  test('imei anahtarından 15 haneyi çıkarır', () => {
    const dump = [
      '[ro.product.model]: [Pixel 7]',
      '[gsm.imei]: [490154203237518]',
      '[ro.build.version.release]: [14]'
    ].join('\n')
    expect(parseImeisFromProps(dump)).toEqual(['490154203237518'])
  })

  test('imei1/imei2 ikisini de döndürür', () => {
    const dump = [
      '[persist.radio.imei1]: [490154203237518]',
      '[persist.radio.imei2]: [356938035643809]'
    ].join('\n')
    expect(parseImeisFromProps(dump)).toEqual(['490154203237518', '356938035643809'])
  })

  test('imei anahtarı boşsa atlar, sonraki geçerliyi döndürür', () => {
    const dump = ['[persist.radio.imei]: []', '[ro.ril.oem.imei]: [356938035643809]'].join('\n')
    expect(parseImeisFromProps(dump)).toEqual(['356938035643809'])
  })

  test('aynı IMEI tekrarlanırsa tek kez döner', () => {
    const dump = ['[gsm.imei]: [490154203237518]', '[persist.radio.imei]: [490154203237518]'].join(
      '\n'
    )
    expect(parseImeisFromProps(dump)).toEqual(['490154203237518'])
  })

  test('imei anahtarı yoksa boş dizi döner', () => {
    expect(parseImeisFromProps('[ro.product.model]: [Pixel 7]')).toEqual([])
  })
})
