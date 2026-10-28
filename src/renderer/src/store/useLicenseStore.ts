import { create } from 'zustand'
import type { LicenseStatus } from '@shared/types'

interface LicenseStore {
  status: LicenseStatus | null
  yuklendi: boolean
  yukle: () => Promise<void>
  aktiveEt: (serial: string) => Promise<{ ok: boolean; hata?: string }>
}

// Lisans (serial) durumu. Main süreçteki license servisiyle konuşur.
export const useLicenseStore = create<LicenseStore>((set) => ({
  status: null,
  yuklendi: false,

  yukle: async () => {
    try {
      set({ status: await window.api.getLicenseStatus(), yuklendi: true })
    } catch {
      set({ yuklendi: true })
    }
  },

  aktiveEt: async (serial) => {
    try {
      set({ status: await window.api.activateLicense(serial) })
      return { ok: true }
    } catch (e) {
      return { ok: false, hata: e instanceof Error ? e.message : String(e) }
    }
  }
}))
