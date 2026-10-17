// Biçim yardımcıları testleri (prompt 135).
import { formatBytes } from '../../src/renderer/src/utils/format'

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
