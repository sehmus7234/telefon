// Genel veri tablosu testleri (prompt 84): filtreleme + sıralama.
import { render, screen, fireEvent } from '@testing-library/react'
import DataTable, { type Column } from '../../src/renderer/src/components/ui/DataTable'

interface Row {
  id: string
  name: string
  size: number
}

const cols: Column<Row>[] = [
  { key: 'name', header: 'Ad', accessor: (r) => r.name },
  { key: 'size', header: 'Boyut', accessor: (r) => r.size }
]

const rows: Row[] = [
  { id: '1', name: 'beta', size: 2 },
  { id: '2', name: 'alpha', size: 10 },
  { id: '3', name: 'gamma', size: 5 }
]

function firstColumn(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('tbody tr td:first-child')).map(
    (td) => td.textContent ?? ''
  )
}

describe('DataTable', () => {
  test('satırları render eder', () => {
    render(<DataTable columns={cols} rows={rows} />)
    expect(screen.getByText('beta')).toBeTruthy()
    expect(screen.getByText('alpha')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
  })

  test('filtreleme: yalnızca eşleşen satırlar kalır', () => {
    render(<DataTable columns={cols} rows={rows} />)
    fireEvent.change(screen.getByPlaceholderText('Filtrele...'), {
      target: { value: 'alpha' }
    })
    expect(screen.getByText('alpha')).toBeTruthy()
    expect(screen.queryByText('beta')).toBeNull()
    expect(screen.queryByText('gamma')).toBeNull()
  })

  test('başlığa tıklayınca artan, tekrar tıklayınca azalan sıralar', () => {
    const { container } = render(<DataTable columns={cols} rows={rows} />)
    const header = () => screen.getByRole('columnheader', { name: /Ad/ })

    fireEvent.click(header())
    expect(firstColumn(container)).toEqual(['alpha', 'beta', 'gamma'])

    fireEvent.click(header())
    expect(firstColumn(container)).toEqual(['gamma', 'beta', 'alpha'])
  })
})
