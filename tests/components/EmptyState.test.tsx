// Boş durum bileşeni testleri (prompt 80).
import { render } from '@testing-library/react'
import EmptyState from '../../src/renderer/src/components/ui/EmptyState'

describe('EmptyState', () => {
  test('başlık ve açıklama render edilir', () => {
    const { getByText } = render(
      <EmptyState title="Cihaz yok" description="Bağlı cihaz bulunamadı" />
    )
    expect(getByText('Cihaz yok')).toBeTruthy()
    expect(getByText('Bağlı cihaz bulunamadı')).toBeTruthy()
  })

  test('açıklama yoksa render edilmez', () => {
    const { queryByText } = render(<EmptyState title="Boş" />)
    expect(queryByText('Bağlı cihaz bulunamadı')).toBeNull()
  })

  test('opsiyonel aksiyon render edilir', () => {
    const { getByText } = render(
      <EmptyState title="Boş" action={<button type="button">Ekle</button>} />
    )
    expect(getByText('Ekle')).toBeTruthy()
  })

  test('opsiyonel ikon render edilir', () => {
    const { getByText } = render(<EmptyState title="Boş" icon={<span>📱</span>} />)
    expect(getByText('📱')).toBeTruthy()
  })
})
