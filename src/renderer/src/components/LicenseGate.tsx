import { useState } from 'react'
import { useLicenseStore } from '../store/useLicenseStore'

// Lisans (serial) ekranı: lisans aktif değilken uygulamanın tamamını kaplar.
// Süre dolduğunda veya hiç lisans yokken yeni serial girilmeden içeri girilemez.
export default function LicenseGate() {
  const status = useLicenseStore((s) => s.status)
  const aktiveEt = useLicenseStore((s) => s.aktiveEt)
  const [serial, setSerial] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)

  const saatSorunu = status?.reason === 'clock-tampered'

  const baslik =
    status?.reason === 'expired'
      ? 'Lisans süresi doldu'
      : status?.reason === 'machine-mismatch'
        ? 'Lisans başka makinede aktif'
        : saatSorunu
          ? 'Sistem saati değiştirilmiş'
          : 'Aktivasyon gerekli'

  const aciklama =
    status?.reason === 'expired'
      ? '6 aylık lisans süreniz doldu. Devam etmek için yeni bir serial girin.'
      : status?.reason === 'machine-mismatch'
        ? 'Bu serial başka bir makinede aktif edilmiş. Yeni bir serial girin.'
        : saatSorunu
          ? 'Sistem saatiniz geri alınmış görünüyor. Saati doğru ayarlayıp uygulamayı yeniden başlatın.'
          : 'Programı kullanmak için 6 aylık serial kodunuzu girin.'

  const gonder = async (): Promise<void> => {
    setHata(null)
    if (!serial.trim()) {
      setHata('Lütfen serial girin.')
      return
    }
    setCalisiyor(true)
    const r = await aktiveEt(serial.trim())
    setCalisiyor(false)
    if (!r.ok) {
      setHata(r.hata ?? 'Aktivasyon başarısız.')
      setSerial('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-900 dark:bg-[#0f1117] dark:text-gray-100">
      <div className="card w-full max-w-md space-y-5 p-8">
        <div className="text-center">
          <div className="text-3xl">{saatSorunu ? '🕒' : '🔑'}</div>
          <h1 className="mt-3 text-xl font-semibold">{baslik}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{aciklama}</p>
        </div>

        {status?.serialLast4 && (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Mevcut serial: •••• {status.serialLast4}
          </div>
        )}

        {saatSorunu ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Saati düzelttikten sonra uygulamayı yeniden başlatın; lisansınız otomatik doğrulanacak.
          </p>
        ) : (
          <>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void gonder()}
              placeholder="XXXXX-XXXXX-XXXXX-..."
              autoFocus
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800"
            />
            {hata && <div className="text-sm text-red-500">{hata}</div>}
            <button
              onClick={() => void gonder()}
              disabled={calisiyor}
              className="btn-primary w-full"
            >
              {calisiyor ? 'Kontrol ediliyor…' : 'Aktive et'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
