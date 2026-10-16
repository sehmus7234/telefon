import { create } from 'zustand'
import type { SessionState } from '@shared/types'

interface SessionStore {
  state: SessionState
  yuklendi: boolean
  yukle: () => Promise<void>
  kilitAc: (password: string) => Promise<boolean>
  kilitKapat: () => Promise<void>
  parolaBelirle: (password: string) => Promise<void>
  parolaDegistir: (oldPassword: string, newPassword: string) => Promise<boolean>
  parolaKaldir: (password: string) => Promise<boolean>
}

// Kullanıcı oturumu (prompt 146). Main süreçteki session.ts ile konuşur.
export const useSessionStore = create<SessionStore>((set) => ({
  state: { hasPassword: false, locked: false },
  yuklendi: false,

  yukle: async () => {
    try {
      set({ state: await window.api.getSessionState(), yuklendi: true })
    } catch {
      set({ yuklendi: true })
    }
  },

  kilitAc: async (password) => {
    const state = await window.api.unlockSession(password)
    set({ state })
    return !state.locked
  },

  kilitKapat: async () => {
    set({ state: await window.api.lockSession() })
  },

  parolaBelirle: async (password) => {
    set({ state: await window.api.setSessionPassword(password) })
  },

  parolaDegistir: async (oldPassword, newPassword) => {
    try {
      set({ state: await window.api.changeSessionPassword(oldPassword, newPassword) })
      return true
    } catch {
      return false
    }
  },

  parolaKaldir: async (password) => {
    try {
      set({ state: await window.api.removeSessionPassword(password) })
      return true
    } catch {
      return false
    }
  }
}))
