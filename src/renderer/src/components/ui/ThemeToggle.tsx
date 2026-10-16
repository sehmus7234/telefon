import { motion } from 'framer-motion'
import { useThemeStore } from '../../store/useThemeStore'

// Animasyonlu karanlık/aydınlık tema toggle (prompt 94).
export default function ThemeToggle() {
  const tema = useThemeStore((s) => s.tema)
  const setMod = useThemeStore((s) => s.setMod)
  const karanlik = tema === 'dark'

  return (
    <button
      onClick={() => setMod(karanlik ? 'light' : 'dark')}
      className={`relative h-7 w-14 rounded-full transition-colors ${karanlik ? 'bg-brand-600' : 'bg-gray-300'}`}
      aria-label="Tema değiştir"
    >
      <motion.span
        className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow"
        animate={{ x: karanlik ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {karanlik ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        )}
      </motion.span>
    </button>
  )
}
