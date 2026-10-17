// Cihaz durum rozeti testleri (prompt 43).
import { render } from '@testing-library/react'
import DeviceStatusBadge from '../../src/renderer/src/components/DeviceStatusBadge'

describe('DeviceStatusBadge', () => {
  test.each([
    ['online', 'Bağlı'],
    ['unauthorized', 'Yetkisiz'],
    ['offline', 'Çevrimdışı'],
    ['disconnected', 'Bağlantı yok'],
    ['charging', 'Bağlantı yok'] // bilinmeyen durum varsayılana düşer
  ] as const)('%s → "%s"', (status, label) => {
    const { getByText } = render(<DeviceStatusBadge status={status} />)
    expect(getByText(label)).toBeTruthy()
  })
})
