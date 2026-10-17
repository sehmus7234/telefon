// ADB exec servisi testleri (prompt 16/20/25/26/32/34).
// Sahte adb ikilisiyle (tests/fixtures/fake-adb.sh) headless doğrulanır:
// gerçek cihaz/adb gerekmez. ADB_PATH ortam değişkeniyle yönlendirilir.
/** @jest-environment node */
import { resolve } from 'path'
import { adbExec, adbExecFull } from '../../src/main/services/adb/exec'

const FAKE_ADB = resolve(__dirname, '../fixtures/fake-adb.sh')

beforeAll(() => {
  process.env.ADB_PATH = FAKE_ADB
})

describe('adb/exec (sahte adb ile)', () => {
  test('version çıktısını döndürür', async () => {
    const out = await adbExec(['version'])
    expect(out).toContain('Android Debug Bridge version 1.0.41')
  })

  test('devices çıktısını döndürür', async () => {
    const out = await adbExec(['devices'])
    expect(out).toContain('emulator-5554')
    expect(out).toContain('192.168.1.42:5555')
  })

  test('shell echo argümanları yansıtır', async () => {
    const out = await adbExec(['shell', 'echo', 'merhaba'])
    expect(out.trim()).toBe('merhaba')
  })

  test('serial seçeneğiyle -s bayrağı eklenir ve çıktı döner', async () => {
    const out = await adbExec(['get-state'], { serial: 'emulator-5554' })
    expect(out.trim()).toBe('device')
  })

  test('sıfır olmayan çıkış kodunda humanize edilmiş hata fırlatır', async () => {
    await expect(adbExec(['fail-cmd'])).rejects.toThrow('Cihaz bulunamadı veya bağlı değil.')
  })

  test('zaman aşımında hata fırlatır', async () => {
    await expect(adbExec(['sleep-loop'], { timeoutMs: 200 })).rejects.toThrow(
      'zaman aşımına uğradı'
    )
  })

  test('adbExecFull hata durumunda fırlatmaz, stderr döndürür', async () => {
    const r = await adbExecFull(['fail-cmd'])
    expect(r.code).toBe(1)
    expect(r.stderr).toContain('device not found')
  })
})
