import { useState } from 'react'
import type { ReactNode } from 'react'

// Sıralama + filtreleme destekleyen genel tablo (prompt 84).
export interface Column<T> {
  key: string
  header: string
  accessor?: (row: T) => string | number
  render?: (row: T) => ReactNode
}

function valueOf<T>(col: Column<T>, row: T): string {
  if (col.accessor) return String(col.accessor(row) ?? '')
  return String((row as Record<string, unknown>)[col.key] ?? '')
}

export default function DataTable<T extends { id: string }>({
  columns,
  rows
}: {
  columns: Column<T>[]
  rows: T[]
}) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [filter, setFilter] = useState('')

  const filtered = rows.filter((r) =>
    columns.some((c) => valueOf(c, r).toLowerCase().includes(filter.toLowerCase()))
  )
  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return 0
    const cmp = valueOf(col, a).localeCompare(valueOf(col, b), undefined, { numeric: true })
    return dir === 'asc' ? cmp : -cmp
  })

  const onSort = (key: string) => {
    if (sortKey === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setDir('asc')
    }
  }

  return (
    <div>
      <div className="mb-2 max-w-xs">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrele..."
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left dark:border-gray-700 dark:bg-gray-800/50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => onSort(c.key)}
                  className="cursor-pointer select-none px-3 py-2 font-medium text-gray-500 dark:text-gray-400"
                >
                  {c.header} {sortKey === c.key ? (dir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2">
                    {c.render ? c.render(r) : valueOf(c, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
