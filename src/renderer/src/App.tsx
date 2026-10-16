import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from './hooks/useTheme'
import { useAdbBridge } from './hooks/useAdbBridge'
import { useNavStore, type PageId } from './store/useNavStore'
import { useAdbStore } from './store/useAdbStore'
import { useDeviceStore } from './store/useDeviceStore'
import { useSessionStore } from './store/useSessionStore'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Toasts from './components/Toasts'
import AppLock from './components/AppLock'
import DashboardView from './views/DashboardView'
import DevicesView from './views/DevicesView'
import DeviceDetailView from './views/DeviceDetailView'
import BackupView from './views/BackupView'
import TestsView from './views/TestsView'
import FilesView from './views/FilesView'
import SettingsView from './views/SettingsView'
import NotFoundView from './views/NotFoundView'

export default function App() {
  useTheme()
  useAdbBridge()
  const page = useNavStore((s) => s.page)

  const durumYukle = useAdbStore((s) => s.durumYukle)
  const surumYukle = useAdbStore((s) => s.surumYukle)
  const gecmisYukle = useAdbStore((s) => s.gecmisYukle)
  const adbHata = useAdbStore((s) => s.hata)
  const oturumKilitli = useSessionStore((s) => s.state.locked)
  const oturumYukle = useSessionStore((s) => s.yukle)

  useEffect(() => {
    void durumYukle()
    void surumYukle()
    void gecmisYukle()
    void useDeviceStore.getState().listele()
    void oturumYukle()
  }, [durumYukle, surumYukle, gecmisYukle, oturumYukle])

  const sayfalar: Record<PageId, ReactNode> = {
    dashboard: <DashboardView />,
    devices: <DevicesView />,
    'device-detail': <DeviceDetailView />,
    backup: <BackupView />,
    tests: <TestsView />,
    files: <FilesView />,
    settings: <SettingsView />
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 dark:bg-[#0f1117] dark:text-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {adbHata && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {adbHata}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {sayfalar[page] ?? <NotFoundView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toasts />
      {oturumKilitli && <AppLock />}
    </div>
  )
}
