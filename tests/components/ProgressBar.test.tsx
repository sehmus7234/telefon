// İlerleme çubuğu bileşen testleri (prompt 83).
import { render } from '@testing-library/react'
import ProgressBar from '../../src/renderer/src/components/ui/ProgressBar'

describe('ProgressBar', () => {
  test('yüzdeyi hesaplar ve etiketi gösterir', () => {
    const { getByText } = render(<ProgressBar value={50} label="Yedekleme" />)
    expect(getByText('Yedekleme')).toBeTruthy()
    expect(getByText('50%')).toBeTruthy()
  })

  test('100 üstü değer %100 kırpılır', () => {
    const { getByText } = render(<ProgressBar value={150} label="Test" />)
    expect(getByText('100%')).toBeTruthy()
  })

  test('negatif değer %0 kırpılır', () => {
    const { getByText } = render(<ProgressBar value={-10} label="Test" />)
    expect(getByText('0%')).toBeTruthy()
  })

  test('etiket yoksa yüzde satırı render edilmez', () => {
    const { queryByText } = render(<ProgressBar value={25} />)
    expect(queryByText('25%')).toBeNull()
  })
})
