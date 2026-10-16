import { create } from 'zustand'
import type { ThemeMode } from '@shared/types'

// Tema durumu (prompt 14)
type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  mod: ThemeMode
  tema: ResolvedTheme
  setMod: (mod: ThemeMode) => void
  setTema: (tema: ResolvedTheme) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  mod: 'system',
  tema: 'light',
  setMod: (mod) => set({ mod }),
  setTema: (tema) => set({ tema })
}))
