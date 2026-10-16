import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'

// Sistem temasını otomatik algılar ve değişiklikleri dinler (prompt 14).
function sistemTemasi(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const mod = useThemeStore((s) => s.mod)
  const setTema = useThemeStore((s) => s.setTema)

  useEffect(() => {
    const uygula = () => {
      const tema = mod === 'system' ? sistemTemasi() : mod
      setTema(tema)
      document.documentElement.classList.toggle('dark', tema === 'dark')
    }

    uygula()

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', uygula)
    return () => mq.removeEventListener('change', uygula)
  }, [mod, setTema])
}
