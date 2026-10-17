// Hassas veri maskeleme testleri (prompt 149).
import { maskSensitive, maskImei, maskMac, REDACTED } from '../../src/main/services/security/redact'

describe('security/redact', () => {
  test('maskImei: 15 haneli IMEI gizlenir', () => {
    expect(maskImei('IMEI: 123456789012345')).toBe(`IMEI: ${REDACTED}`)
  })

  test('maskMac: MAC adresi gizlenir', () => {
    expect(maskMac('mac=aa:bb:cc:dd:ee:ff')).toBe(`mac=${REDACTED}`)
  })

  test('maskSensitive: token=değer çifti gizlenir', () => {
    const out = maskSensitive('token=abc123secret')
    expect(out).toContain(`token=${REDACTED}`)
    expect(out).not.toContain('abc123secret')
  })

  test('maskSensitive: seri no ve IMEI birlikte gizlenir', () => {
    const out = maskSensitive('[ro.serialno]: [ABC123] imei=123456789012345')
    expect(out).not.toContain('ABC123')
    expect(out).not.toContain('123456789012345')
  })

  test('maskSensitive: 40+ hex belirteç gizlenir', () => {
    const long = 'a'.repeat(48)
    expect(maskSensitive(`auth ${long}`)).not.toContain(long)
  })

  test('maskSensitive: boş giriş aynen döner', () => {
    expect(maskSensitive('')).toBe('')
  })
})
