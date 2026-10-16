import { create } from 'zustand'
import type { Device, DeviceInfo } from '@shared/types'

const STORAGE_KEY = 'telefon:cihazlar'

// Son bilinen cihazları localStorage'dan yükle (prompt 50).
function loadCihazlar(): Device[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Device[]) : []
  } catch {
    return []
  }
}

function persist(cihazlar: Device[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cihazlar))
  } catch {
    /* dolu ya da erişilemez */
  }
}

interface DeviceState {
  cihazlar: Device[]
  seciliCihaz: Device | null
  taraniyor: boolean
  yukleniyor: boolean
  hata: string | null
  bilgiler: Record<string, DeviceInfo>
  listele: () => Promise<void>
  refresh: () => Promise<void>
  sec: (cihaz: Device | null) => void
  ayarla: (cihazlar: Device[]) => void
  cihazBilgiEkle: (serial: string, info: DeviceInfo) => void
  temizleHata: () => void
}

// Global cihaz durumu (prompt 8/42). Güncellemeler otomatik olarak bileşenlere yansır.
export const useDeviceStore = create<DeviceState>((set, get) => ({
  cihazlar: loadCihazlar(),
  seciliCihaz: null,
  taraniyor: true,
  yukleniyor: false,
  hata: null,
  bilgiler: {},

  listele: async () => {
    set({ yukleniyor: true, hata: null })
    try {
      const cihazlar = await window.api.listDevices()
      set({ cihazlar, seciliCihaz: get().seciliCihaz ?? cihazlar[0] ?? null })
      persist(cihazlar)
    } catch (e) {
      set({ hata: e instanceof Error ? e.message : 'Cihazlar listelenemedi' })
    } finally {
      set({ yukleniyor: false })
    }
  },

  refresh: async () => {
    set({ taraniyor: true, hata: null })
    try {
      const cihazlar = await window.api.refreshDevices()
      set({ cihazlar, seciliCihaz: get().seciliCihaz ?? cihazlar[0] ?? null })
      persist(cihazlar)
    } catch (e) {
      set({ hata: e instanceof Error ? e.message : 'Cihazlar yenilenemedi' })
    } finally {
      set({ taraniyor: false })
    }
  },

  sec: (cihaz) => set({ seciliCihaz: cihaz }),
  ayarla: (cihazlar) => {
    set({ cihazlar, seciliCihaz: get().seciliCihaz ?? cihazlar[0] ?? null, taraniyor: false })
    persist(cihazlar)
  },
  cihazBilgiEkle: (serial, info) =>
    set((s) => ({ bilgiler: { ...s.bilgiler, [serial]: info } })),
  temizleHata: () => set({ hata: null })
}))
