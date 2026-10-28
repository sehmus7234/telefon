import { useEffect, useRef, useState } from 'react'
import { useThemeStore } from '../store/useThemeStore'
import { useAdbStore } from '../store/useAdbStore'
import { useLicenseStore } from '../store/useLicenseStore'
import { kalanSureyiFormatla } from '../utils/format'
import SecuritySettings from '../components/SecuritySettings'
import ErrorDiagnostics from '../components/ErrorDiagnostics'
import type { ThemeMode } from '@shared/types'

function load(key: string, def: string): string {
  try {
    return localStorage.getItem(key) ?? def
  } catch {
    return def
  }
}

// Ayarlar sayfası (prompt 88): tema, dil, ADB yolu, otomatik güncelleme, lisans.
export default function SettingsView() {
  const mod = useThemeStore((s) => s.mod)
  const setMod = useThemeStore((s) => s.setMod)
  const lisans = useLicenseStore((s) => s.status)
  const [dil, setDil] = useState(() => load('telefon:ayar:dil', 'tr'))
  const [adbYolu, setAdbYolu] = useState('')
  const [otoGuncelle, setOtoGuncelle] = useState(
    () => load('telefon:ayar:otoGuncelle', 'true') === 'true'
  )
  const [simdi, setSimdi] = useState(() => Date.now())
  const adbYoluYuklendi = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem('telefon:ayar:dil', dil)
    } catch {
      /* yoksay */
    }
  }, [dil])

  // ADB yolu: değeri main süreçten oku, değişince (debounce ile) main sürece yaz
  // ve ADB durumunu tazele. localStorage artık kullanılmaz; yetkili kaynak DB'dir.
  useEffect(() => {
    let iptal = false
    void window.api.getAdbPath().then((p) => {
      if (iptal) return
      setAdbYolu(p ?? '')
      adbYoluYuklendi.current = true
    })
    return () => {
      iptal = true
    }
  }, [])

  useEffect(() => {
    if (!adbYoluYuklendi.current) return
    const t = setTimeout(() => {
      void window.api.setAdbPath(adbYolu).then(() => useAdbStore.getState().durumYukle())
    }, 400)
    return () => clearTimeout(t)
  }, [adbYolu])
  useEffect(() => {
    try {
      localStorage.setItem('telefon:ayar:otoGuncelle', String(otoGuncelle))
    } catch {
      /* yoksay */
    }
  }, [otoGuncelle])

  // Lisans geri sayımı: lisans aktifken her saniye güncelle (ay/gün/saat/dakika/saniye).
  useEffect(() => {
    if (!lisans?.active) return
    const t = setInterval(() => setSimdi(Date.now()), 1000)
    return () => clearInterval(t)
  }, [lisans?.active])

  const selectCls =
    'mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800'

  const kalanMs =
    lisans?.active && lisans.expiresAt ? new Date(lisans.expiresAt).getTime() - simdi : 0

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
          Boş bırakılırsa otomatik algılanır. Tam dosya yolu ya da klasör yazabilirsiniz; değişiklik
          ADB durumunu otomatik yeniler.
        </p>
      </div>

      <div className="card p-5">
        <div className="text-sm font-medium">Lisans</div>
        {lisans?.active ? (
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Durum</span>
              <span className="font-medium text-green-600 dark:text-green-400">Aktif</span>
            </div>
            <div className="rounded-md bg-brand-50 px-3 py-2 dark:bg-brand-900/20">
              <div className="text-xs text-gray-500 dark:text-gray-400">Kalan süre</div>
              <div className="font-mono text-sm tabular-nums text-brand-700 dark:text-brand-300">
                {kalanSureyiFormatla(kalanMs)}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Bitiş tarihi</span>
              <span>
                {lisans.expiresAt ? new Date(lisans.expiresAt).toLocaleDateString('tr-TR') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Serial</span>
              <span>•••• {lisans.serialLast4 ?? ''}</span>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Aktif lisans bilgisi yok.
          </div>
        )}
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

      <ErrorDiagnostics />
    </div>
  )
}
