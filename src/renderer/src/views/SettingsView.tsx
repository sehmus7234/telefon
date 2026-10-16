import { useEffect, useState } from 'react'
import { useThemeStore } from '../store/useThemeStore'
import SecuritySettings from '../components/SecuritySettings'
import type { ThemeMode } from '@shared/types'

function load(key: string, def: string): string {
  try {
    return localStorage.getItem(key) ?? def
  } catch {
    return def
  }
}

// Ayarlar sayfası (prompt 88): tema, dil, ADB yolu, otomatik güncelleme.
export default function SettingsView() {
  const mod = useThemeStore((s) => s.mod)
  const setMod = useThemeStore((s) => s.setMod)
  const [dil, setDil] = useState(() => load('telefon:ayar:dil', 'tr'))
  const [adbYolu, setAdbYolu] = useState(() => load('telefon:ayar:adbYolu', ''))
  const [otoGuncelle, setOtoGuncelle] = useState(() => load('telefon:ayar:otoGuncelle', 'true') === 'true')

  useEffect(() => {
    try {
      localStorage.setItem('telefon:ayar:dil', dil)
    } catch {
      /* yoksay */
    }
  }, [dil])
  useEffect(() => {
    try {
      localStorage.setItem('telefon:ayar:adbYolu', adbYolu)
    } catch {
      /* yoksay */
    }
  }, [adbYolu])
  useEffect(() => {
    try {
      localStorage.setItem('telefon:ayar:otoGuncelle', String(otoGuncelle))
    } catch {
      /* yoksay */
    }
  }, [otoGuncelle])

  const selectCls =
    'mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800'

  return (
    <div className="max-w-xl space-y-4">
      <div className="card p-5">
        <label className="block text-sm font-medium">Tema</label>
        <select
          value={mod}
          onChange={(e) => setMod(e.target.value as ThemeMode)}
          className={selectCls}
        >
          <option value="system">Sistem</option>
          <option value="dark">Koyu</option>
          <option value="light">Açık</option>
        </select>
      </div>

      <div className="card p-5">
        <label className="block text-sm font-medium">Dil</label>
        <select value={dil} onChange={(e) => setDil(e.target.value)} className={selectCls}>
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="card p-5">
        <label className="block text-sm font-medium">ADB yolu</label>
        <input
          value={adbYolu}
          onChange={(e) => setAdbYolu(e.target.value)}
          placeholder="boş = otomatik bul"
          className={selectCls}
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Boş bırakılırsa otomatik algılanır (src/main/services/adb/paths.ts).
        </p>
      </div>

      <div className="card flex items-center justify-between p-5">
        <div>
          <div className="text-sm font-medium">Otomatik güncelleme</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">Yeni sürüm gelince bildir</div>
        </div>
        <button
          onClick={() => setOtoGuncelle((v) => !v)}
          className={`relative h-6 w-11 rounded-full transition-colors ${otoGuncelle ? 'bg-brand-600' : 'bg-gray-300'}`}
          aria-label="Otomatik güncelleme"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              otoGuncelle ? 'left-6' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <SecuritySettings />
    </div>
  )
}
