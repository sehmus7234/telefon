import { create } from 'zustand'
import type { AdbStatusInfo, AdbHistoryEntry, AdbRunResult } from '@shared/types'

interface AdbState {
  durum: AdbStatusInfo | null
  surum: string | null
  gecmis: AdbHistoryEntry[]
  calisiyor: boolean
  aktifRunId: string | null
  sonSonuc: AdbRunResult | null
  hata: string | null
  serverMesgul: boolean

  durumYukle: () => Promise<void>
  surumYukle: () => Promise<void>
  gecmisYukle: () => Promise<void>
  serverBaslat: () => Promise<void>
  serverDurdur: () => Promise<void>
  serverYenidenBaslat: () => Promise<void>
  komutCalistir: (args: string[], opts?: { serial?: string; timeoutMs?: number }) => Promise<void>
  komutIptal: () => Promise<void>
  sonucIsle: (r: AdbRunResult) => void
  hataAta: (mesaj: string) => void
  hataTemizle: () => void
}

export const useAdbStore = create<AdbState>((set, get) => ({
  durum: null,
  surum: null,
  gecmis: [],
  calisiyor: false,
  aktifRunId: null,
  sonSonuc: null,
  hata: null,
  serverMesgul: false,

  durumYukle: async () => {
    try {
      set({ durum: await window.api.getAdbStatus() })
    } catch {
      /* yoksay */
    }
  },
  surumYukle: async () => {
    try {
      set({ surum: await window.api.getAdbVersion() })
    } catch {
      set({ surum: null })
    }
  },
  gecmisYukle: async () => {
    try {
      set({ gecmis: await window.api.getHistory() })
    } catch {
      /* yoksay */
    }
  },
  serverBaslat: async () => {
    set({ serverMesgul: true })
    try {
      await window.api.startServer()
    } finally {
      set({ serverMesgul: false })
    }
  },
  serverDurdur: async () => {
    set({ serverMesgul: true })
    try {
      await window.api.stopServer()
    } finally {
      set({ serverMesgul: false })
    }
  },
  serverYenidenBaslat: async () => {
    set({ serverMesgul: true })
    try {
      await window.api.restartServer()
    } finally {
      set({ serverMesgul: false })
    }
  },
  komutCalistir: async (args, opts) => {
    set({ calisiyor: true, sonSonuc: null, hata: null })
    try {
      const runId = await window.api.runCommand(args, opts)
      set({ aktifRunId: runId })
    } catch (e) {
      set({ calisiyor: false, aktifRunId: null, hata: e instanceof Error ? e.message : String(e) })
    }
  },
  komutIptal: async () => {
    const id = get().aktifRunId
    if (id) await window.api.cancelCommand(id)
  },
  sonucIsle: (r) => {
    set({ sonSonuc: r, calisiyor: false, aktifRunId: null })
    if (r.error) set({ hata: r.error })
    void get().gecmisYukle()
  },
  hataAta: (mesaj) => set({ hata: mesaj }),
  hataTemizle: () => set({ hata: null })
}))
