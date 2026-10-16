import { useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import { useThemeStore } from './store/useThemeStore'
import { useDeviceStore } from './store/useDeviceStore'
import { useAdbStore } from './store/useAdbStore'
import { useAdbBridge } from './hooks/useAdbBridge'
import AdbStatusBar from './components/AdbStatusBar'
import DeviceSelect from './components/DeviceSelect'
import DeviceList from './components/DeviceList'
import WirelessConnect from './components/WirelessConnect'
import CommandConsole from './components/CommandConsole'
import Toasts from './components/Toasts'

export default function App() {
  useTheme()
  useAdbBridge()

  const mod = useThemeStore((s) => s.mod)
  const tema = useThemeStore((s) => s.tema)
  const setMod = useThemeStore((s) => s.setMod)

  const durumYukle = useAdbStore((s) => s.durumYukle)
  const surumYukle = useAdbStore((s) => s.surumYukle)
  const gecmisYukle = useAdbStore((s) => s.gecmisYukle)
  const adbHata = useAdbStore((s) => s.hata)
  const cihazRefresh = useDeviceStore((s) => s.refresh)
  const taraniyor = useDeviceStore((s) => s.taraniyor)

  useEffect(() => {
    void durumYukle()
    void surumYukle()
    void gecmisYukle()
    void useDeviceStore.getState().listele()
  }, [durumYukle, surumYukle, gecmisYukle])

  const temaDegistir = () => {
    setMod(tema === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-gray-900 dark:text-gray-100">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h1 className="text-xl font-semibold">Telefon Yöneticisi</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void cihazRefresh()}
            disabled={taraniyor}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Yenile
          </button>
          <button
            onClick={temaDegistir}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Tema: {mod} ({tema})
          </button>
        </div>
      </header>
      <main className="space-y-4 p-6">
        {adbHata && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {adbHata}
          </div>
        )}
        <AdbStatusBar />
        <DeviceSelect />
        <DeviceList />
        <WirelessConnect />
        <CommandConsole />
      </main>
      <Toasts />
    </div>
  )
}
