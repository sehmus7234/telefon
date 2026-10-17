import { useNavStore, type PageId } from '../../store/useNavStore'
import { useDeviceStore } from '../../store/useDeviceStore'
import ThemeToggle from '../ui/ThemeToggle'

const basliklar: Record<PageId, string> = {
  dashboard: 'Dashboard',
  devices: 'Cihazlar',
  'device-detail': 'Cihaz Detayı',
  imei: 'Telefon IMEI',
  backup: 'Yedekleme',
  tests: 'Testler',
  files: 'Dosyalar',
  settings: 'Ayarlar'
}

// Üst header (prompt 71): sidebar toggle + başlık + yenile + tema (94).
export default function Header() {
  const page = useNavStore((s) => s.page)
  const toggle = useNavStore((s) => s.sidebarToggle)
  const refresh = useDeviceStore((s) => s.refresh)
  const taraniyor = useDeviceStore((s) => s.taraniyor)

  return (
    <header className="flex h-14 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
      <button
        onClick={toggle}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="Menü"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <h1 className="text-lg font-semibold">{basliklar[page]}</h1>
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => void refresh()}
          disabled={taraniyor}
          className="btn-ghost text-sm"
          title="Cihaz listesini yenile"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={taraniyor ? 'animate-spin' : ''}
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          <span className="hidden sm:inline">Yenile</span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
