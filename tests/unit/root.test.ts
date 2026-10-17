// Root durumu ayrıştırma testleri (headless; gerçek cihaz gerekmez).
/** @jest-environment node */
import { buildRootStatus } from '../../src/main/services/adb/root'

describe('buildRootStatus', () => {
  test('su -c id uid=0(root) ise rootlu sayar', () => {
    const st = buildRootStatus('uid=0(root) gid=0(root)', '/system/xbin/su', '28.0')
    expect(st.isRooted).toBe(true)
    expect(st.suPath).toBe('/system/xbin/su')
    expect(st.magiskVersion).toBe('28.0')
  })

  test('çıktı boşsa root değildir ve alanlar null', () => {
    const st = buildRootStatus('', '', '')
    expect(st.isRooted).toBe(false)
    expect(st.suPath).toBeNull()
    expect(st.magiskVersion).toBeNull()
  })

  test('Permission denied root değildir', () => {
    const st = buildRootStatus('Permission denied', '', '')
    expect(st.isRooted).toBe(false)
  })

  test('magisk -v çok satırlıysa ilk satır alınır', () => {
    const st = buildRootStatus('uid=0(root)', '/sbin/su', '28.0:28100\nsomething')
    expect(st.magiskVersion).toBe('28.0:28100')
  })
})
