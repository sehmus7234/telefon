import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavStore, type PageId } from '../../store/useNavStore'

interface MenuItem {
  id: PageId
  label: string
  icon: ReactNode
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
} as const

const menu: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    id: 'devices',
    label: 'Cihazlar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    )
  },
  {
    id: 'imei',
    label: 'Telefon IMEI',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <path d="M6 3h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M9 11h6" />
        <path d="M9 15h6" />
      </svg>
    )
  },
  {
    id: 'backup',
    label: 'Yedekleme',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
      </svg>
    )
  },
  {
    id: 'tests',
    label: 'Testler',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    )
  },
  {
    id: 'files',
    label: 'Dosyalar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Ayarlar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  }
]

// Sol sidebar (prompt 71/72). Dar pencereye inince otomatik daralır (87).
export default function Sidebar() {
  const page = useNavStore((s) => s.page)
  const git = useNavStore((s) => s.git)
  const dar = useNavStore((s) => s.sidebarDar)
  const toggle = useNavStore((s) => s.sidebarToggle)
  const sidebarDarAyarla = useNavStore((s) => s.sidebarDarAyarla)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const onChange = (e: MediaQueryListEvent) => sidebarDarAyarla(e.matches)
    sidebarDarAyarla(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [sidebarDarAyarla])

  return (
    <aside
      className={`flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-surface ${
        dar ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-800">
        {!dar && (
          <span className="bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-lg font-bold text-transparent">
            Telefon
          </span>
        )}
        <button
          onClick={toggle}
          className="ml-auto rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Sidebar daralt"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => git(item.id)}
            title={item.label}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              page === item.id
                ? 'bg-brand-500/10 font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {!dar && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        {!dar && (
          <span className="truncate text-xs text-gray-400 dark:text-gray-500">
            v0.1.0 · Electron
          </span>
        )}
      </div>
    </aside>
  )
}
