import type { ReactNode } from 'react'

// İkonların üzerine gelince açıklama gösteren tooltip (prompt 86).
export default function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700">
        {text}
      </span>
    </span>
  )
}
