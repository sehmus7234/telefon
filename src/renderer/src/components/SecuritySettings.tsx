import { useEffect, useState } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import type { SecurityUpdateStatus } from '@shared/types'

const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800'

// Güvenlik ayarları: oturum (146), şifreli ayar deposu (147), güncelleme kontrolü (150).
export default function SecuritySettings() {
  const session = useSessionStore((s) => s.state)
  const yukle = useSessionStore((s) => s.yukle)
  const kilitKapat = useSessionStore((s) => s.kilitKapat)
  const parolaBelirle = useSessionStore((s) => s.parolaBelirle)
  const parolaDegistir = useSessionStore((s) => s.parolaDegistir)
  const parolaKaldir = useSessionStore((s) => s.parolaKaldir)

  const [yeniParola, setYeniParola] = useState('')
  const [eskiParola, setEskiParola] = useState('')
  const [yeniParola2, setYeniParola2] = useState('')
  const [kaldirParola, setKaldirParola] = useState('')

  const [guncelleme, setGuncelleme] = useState<SecurityUpdateStatus | null>(null)
  const [kontrolEdiliyor, setKontrolEdiliyor] = useState(false)

  const [gizliNot, setGizliNot] = useState('')
  const [gizliNotKaydedildi, setGizliNotKaydedildi] = useState(false)

  useEffect(() => {
    void yukle()
    void window.api.getSecureSetting('demo.gizliNot').then((v) => setGizliNot(v ?? ''))
    void window.api.getSecurityUpdatesStatus().then((s) => setGuncelleme(s))
  }, [yukle])

  const kontrolEt = async () => {
    setKontrolEdiliyor(true)
    try {
      setGuncelleme(await window.api.checkSecurityUpdates())
    } finally {
      setKontrolEdiliyor(false)
    }
  }

  const notKaydet = async () => {
    await window.api.setSecureSetting('demo.gizliNot', gizliNot)
    setGizliNotKaydedildi(true)
    setTimeout(() => setGizliNotKaydedildi(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Oturum yönetimi (146) */}
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Kullanıcı oturumu (opsiyonel)</h2>
        {!session.hasPassword ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ana parola tanımlayarak uygulamayı kilitleyebilirsiniz. Parola hash'i şifreli saklanır.
            </p>
            <input
              type="password"
              value={yeniParola}
              onChange={(e) => setYeniParola(e.target.value)}
              placeholder="Yeni ana parola"
              className={inputCls}
            />
            <button
              onClick={() => void parolaBelirle(yeniParola).then(() => setYeniParola(''))}
              disabled={!yeniParola}
              className="btn-primary"
            >
              Parola belirle
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Durum: ana parola tanımlı ✅</span>
              <button onClick={() => void kilitKapat()} className="btn-ghost">
                Şimdi kilitle
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 border-t border-gray-200 pt-3 dark:border-gray-700 sm:grid-cols-2">
              <input
                type="password"
                value={eskiParola}
                onChange={(e) => setEskiParola(e.target.value)}
                placeholder="Mevcut parola"
                className={inputCls}
              />
              <input
                type="password"
                value={yeniParola2}
                onChange={(e) => setYeniParola2(e.target.value)}
                placeholder="Yeni parola"
                className={inputCls}
              />
            </div>
            <button
              onClick={() =>
                void parolaDegistir(eskiParola, yeniParola2).then((ok) => {
                  if (!ok) return
                  setEskiParola('')
                  setYeniParola2('')
                })
              }
              disabled={!eskiParola || !yeniParola2}
              className="btn-ghost"
            >
              Parolayı değiştir
            </button>
            <div className="flex gap-2">
              <input
                type="password"
                value={kaldirParola}
                onChange={(e) => setKaldirParola(e.target.value)}
                placeholder="Parolayı kaldırmak için gir"
                className={inputCls}
              />
              <button
                onClick={() => void parolaKaldir(kaldirParola).then(() => setKaldirParola(''))}
                disabled={!kaldirParola}
                className="btn-ghost text-red-600"
              >
                Kaldır
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Şifreli ayar deposu (147) */}
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Şifreli ayar deposu</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hassas değerler diske AES-256-GCM ile şifrelenerek yazılır (secure_settings tablosu).
          Aşağıdaki not bu şekilde saklanır:
        </p>
        <input
          value={gizliNot}
          onChange={(e) => setGizliNot(e.target.value)}
          placeholder="Şifreli saklanacak not"
          className={inputCls}
        />
        <button onClick={() => void notKaydet()} className="btn-ghost">
          {gizliNotKaydedildi ? 'Kaydedildi ✓' : 'Şifreli kaydet'}
        </button>
      </div>

      {/* Güvenlik güncellemeleri (150) */}
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Güvenlik güncellemeleri</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Elektron sürümünüzü etkileyen GitHub Security Advisories bültenlerini kontrol eder.
        </p>
        <button onClick={() => void kontrolEt()} disabled={kontrolEdiliyor} className="btn-ghost">
          {kontrolEdiliyor ? 'Kontrol ediliyor...' : 'Şimdi kontrol et'}
        </button>
        {guncelleme && (
          <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
            {guncelleme.checked ? (
              guncelleme.hasSecurityUpdates ? (
                <div className="space-y-1 text-red-600 dark:text-red-400">
                  <div className="font-medium">
                    ⚠️ {guncelleme.advisories.length} güvenlik güncellemesi mevcut
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-xs">
                    {guncelleme.advisories.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-green-600 dark:text-green-400">
                  ✅ Güvenlik güncellemesi gerekmiyor (Electron {guncelleme.electronVersion}).
                </div>
              )
            ) : (
              <div className="text-amber-600 dark:text-amber-400">
                Kontrol başarısız: {guncelleme.error}
              </div>
            )}
            {guncelleme.checkedAt && (
              <div className="mt-1 text-xs text-gray-400">
                Son kontrol: {new Date(guncelleme.checkedAt).toLocaleString('tr-TR')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
