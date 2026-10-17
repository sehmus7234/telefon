import { create } from 'zustand'

export type PageId =
  'dashboard' | 'devices' | 'device-detail' | 'imei' | 'backup' | 'tests' | 'files' | 'settings'

interface NavState {
  page: PageId
  seciliCihazId: string | null
  sidebarDar: boolean
  git: (page: PageId) => void
  cihazAc: (serial: string) => void
  sidebarToggle: () => void
  sidebarDarAyarla: (dar: boolean) => void
}

// Basit sayfa yönlendirmesi + seçili cihaz + sidebar durumu (prompt 71/87).
export const useNavStore = create<NavState>((set) => ({
  page: 'dashboard',
  seciliCihazId: null,
  sidebarDar: false,
  git: (page) => set({ page }),
  cihazAc: (serial) => set({ page: 'device-detail', seciliCihazId: serial }),
  sidebarToggle: () => set((s) => ({ sidebarDar: !s.sidebarDar })),
  sidebarDarAyarla: (dar) => set({ sidebarDar: dar })
}))
