import { create } from 'zustand'
import type { Device } from '@shared/types'

// Global cihaz durumu (prompt 8)
interface DeviceState {
  cihazlar: Device[]
  seciliCihaz: Device | null
  yukleniyor: boolean
  hata: string | null
  listele: () => Promise<void>
  sec: (cihaz: Device | null) => void
  temizleHata: () => void
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  cihazlar: [],
  seciliCihaz: null,
  yukleniyor: false,
  hata: null,

  listele: async () => {
    set({ yukleniyor: true, hata: null })
    try {
      const cihazlar = await window.api.listDevices()
      set({ cihazlar, seciliCihaz: get().seciliCihaz ?? cihazlar[0] ?? null })
    } catch (e) {
      set({ hata: e instanceof Error ? e.message : 'Cihazlar listelenemedi' })
    } finally {
      set({ yukleniyor: false })
    }
  },

  sec: (cihaz) => set({ seciliCihaz: cihaz }),
  temizleHata: () => set({ hata: null })
}))
