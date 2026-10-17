// ADB çıktı ayrıştırma testleri (prompt 21/33, prompt 162 kapsamı).
import { lines, parseDevices, parseVersion } from '../../src/main/services/adb/parse'

describe('adb/parse', () => {
  test('lines: CRLF ve boş satırları temizler', () => {
    expect(lines('a\r\n\r\n b \n\n')).toEqual(['a', 'b'])
  })

  test('parseDevices: başlık satırını atlar, serial/state/attrs ayrıştırır', () => {
    const out = [
      'List of devices attached',
      'emulator-5554          device product:sdk_gphone64_x86_64 model:Pixel_7',
      'ABC123                unauthorized'
    ].join('\n')

    const devices = parseDevices(out)

    expect(devices).toHaveLength(2)
    expect(devices[0]).toEqual({
      serial: 'emulator-5554',
      state: 'device',
      attrs: { product: 'sdk_gphone64_x86_64', model: 'Pixel_7' }
    })
    expect(devices[1].serial).toBe('ABC123')
    expect(devices[1].state).toBe('unauthorized')
  })

  test('parseDevices: daemon ve bozuk satırları yok sayar', () => {
    const out = ['* daemon started successfully', 'List of devices attached', ''].join('\n')
    expect(parseDevices(out)).toEqual([])
  })

  test('parseVersion: sürüm numarasını ayıklar', () => {
    expect(parseVersion('Android Debug Bridge version 1.0.41\nVersion 35.0.2')).toBe('1.0.41')
  })

  test('parseVersion: sürüm yoksa ilk satırı döndürür', () => {
    expect(parseVersion('bilinmeyen çıktı')).toBe('bilinmeyen çıktı')
  })
})
