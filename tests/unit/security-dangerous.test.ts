// Tehlikeli komut sınıflandırma testleri (prompt 148).
import { classifyCommand } from '../../src/main/services/security/dangerous'

describe('security/dangerous', () => {
  test('reboot tehlikelidir', () => {
    expect(classifyCommand(['reboot']).dangerous).toBe(true)
  })

  test('shell rm tehlikelidir', () => {
    expect(classifyCommand(['shell', 'rm', '-rf', '/data/app']).dangerous).toBe(true)
  })

  test('shell pm uninstall tehlikelidir', () => {
    expect(classifyCommand(['shell', 'pm', 'uninstall', 'com.foo']).dangerous).toBe(true)
  })

  test('shell am force-stop tehlikelidir', () => {
    expect(classifyCommand(['shell', 'am', 'force-stop', 'com.foo']).dangerous).toBe(true)
  })

  test('push /system tehlikelidir', () => {
    expect(classifyCommand(['push', 'a.txt', '/system/x']).dangerous).toBe(true)
  })

  test('push /sdcard güvenlidir', () => {
    expect(classifyCommand(['push', 'a.txt', '/sdcard/x']).dangerous).toBe(false)
  })

  test('-s <serial> bayrağı atlanır, komut bulunur', () => {
    expect(classifyCommand(['-s', 'emulator-5554', 'reboot']).dangerous).toBe(true)
  })

  test('zararsız komut güvenlidir', () => {
    expect(classifyCommand(['devices']).dangerous).toBe(false)
  })

  test('boş argüman güvenlidir', () => {
    expect(classifyCommand([])).toEqual({ dangerous: false, reason: null })
  })
})
