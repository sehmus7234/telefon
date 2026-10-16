import { useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import { useDeviceStore } from './store/useDeviceStore'
import { useThemeStore } from './store/useThemeStore'
import DeviceList from './components/DeviceList'

export default function App() {
  useTheme()
  const listele = useDeviceStore((s) => s.listele)
  const mod = useThemeStore((s) => s.mod)
  const tema = useThemeStore((s) => s.tema)
  const setMod = useThemeStore((s) => s.setMod)

  useEffect(() => {
    void listele()
  }, [listele])

  const temaDegistir = () => {
    setMod(tema === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-gray-900 dark:text-gray-100">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h1 className="text-xl font-semibold">Telefon Yöneticisi</h1>
        <button
          onClick={temaDegistir}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Tema: {mod} ({tema})
        </button>
      </header>
      <main className="p-6">
        <DeviceList />
      </main>
    </div>
  )
}
