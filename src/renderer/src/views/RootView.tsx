import { useCallback, useEffect, useState } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import DeviceStatusBadge from '../components/DeviceStatusBadge'
import EmptyState from '../components/ui/EmptyState'
import type { Device, RootStatus } from '@shared/types'

// Cihazın bilgi deposundaki anahtarı (serial ya da id).
function serialOf(d: Device): string {
  return d.serialNumber ?? d.id
}

// Root sayfası: bağlı cihazların root durumunu okur (yalnızca algılama) ve
// adbd'yi root moda almayı dener (adb root — yalnızca userdebug/eng build'lerde).
// Kalıcı root YÜKLEME (Magisk flash) yapılmaz.
export default function RootView() {
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const [durumlar, setDurumlar] = useState<Record<string, RootStatus>>({})
  const [yukleniyor, setYukleniyor] = useState<Record<string, boolean>>({})
  const [cikti, setCikti] = useState<Record<string, string>>({})

  const bagli = cihazlar.filter((d) => d.status === 'online')

  const durumCek = useCallback(async (d: Device): Promise<void> => {
    const serial = serialOf(d)
    setYukleniyor((s) => ({ ...s, [serial]: true }))
    try {
      const st = await window.api.getRootStatus(serial)
      setDurumlar((s) => ({ ...s, [serial]: st }))
    } catch {
      // Algılanamadı; kullanıcı yeniden deneyebilir.
    } finally {
      setYukleniyor((s) => ({ ...s, [serial]: false }))
    }
  }, [])

  // Bağlı cihazların durumu daha önce çekilmediyse otomatik çek.
  useEffect(() => {
    for (const d of cihazlar) {
      if (d.status !== 'online') continue
      if (durumlar[serialOf(d)] === undefined) void durumCek(d)
    }
  }, [cihazlar, durumlar, durumCek])

  const adbRootDene = async (d: Device): Promise<void> => {
    const serial = serialOf(d)
    setCikti((s) => ({ ...s, [serial]: 'Çalıştırılıyor…' }))
    const r = await window.api.adbRoot(serial)
    setCikti((s) => ({ ...s, [serial]: r.output || (r.ok ? 'OK' : 'Hata') }))
    void durumCek(d)
  }

  const adbUnrootDene = async (d: Device): Promise<void> => {
    const serial = serialOf(d)
    setCikti((s) => ({ ...s, [serial]: 'Çalıştırılıyor…' }))
    const r = await window.api.adbUnroot(serial)
    setCikti((s) => ({ ...s, [serial]: r.output || (r.ok ? 'OK' : 'Hata') }))
    void durumCek(d)
  }

  return (
    <div className="space-y-4">
      {bagli.length === 0 ? (
        <EmptyState
          title="Telefon bağlı değil"
          description="Root durumunu görmek için USB kablosuyla bir cihaz bağlayın veya Wi-Fi üzerinden bağlanın."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bagli.map((d) => {
            const serial = serialOf(d)
            const st = durumlar[serial]
            const yukleniyorMu = yukleniyor[serial] === true
            return (
              <div key={d.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{d.name}</span>
                  <DeviceStatusBadge status={d.status} />
                </div>

                <div className="mt-4 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Root durumu
                  </div>
                  {yukleniyorMu ? (
                    <div className="mt-1 text-sm text-gray-400">Kontrol ediliyor…</div>
                  ) : st ? (
                    <div className="mt-1">
                      <span
                        className={
                          st.isRooted
                            ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                            : 'font-semibold text-gray-700 dark:text-gray-200'
                        }
                      >
                        {st.isRooted ? 'Rootlu' : "Root'suz"}
                      </span>
                      {st.suPath && (
                        <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                          su: {st.suPath}
                        </div>
                      )}
                      {st.magiskVersion && (
                        <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                          Magisk: {st.magiskVersion}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-gray-400">Durum alınamadı</div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => void durumCek(d)}
                    disabled={yukleniyorMu}
                    className="btn-ghost text-sm"
                  >
                    Yenile
                  </button>
                  <button onClick={() => void adbRootDene(d)} className="btn-ghost text-sm">
                    ADB root dene
                  </button>
                  <button onClick={() => void adbUnrootDene(d)} className="btn-ghost text-sm">
                    ADB unroot
                  </button>
                </div>

                {cikti[serial] && (
                  <div className="mt-2 rounded-md bg-gray-50 p-2 font-mono text-xs text-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
                    {cikti[serial]}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <RootGuide />
    </div>
  )
}

// Kalıcı root'un neden tek tıkla yapılamayacağını açıklayan rehber.
function RootGuide() {
  return (
    <section className="card space-y-3 p-5">
      <h2 className="font-semibold">Root hakkında (önemli)</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Bu sayfa yalnızca root <strong>durumunu okur</strong> ve <code>adb root</code> ile adbd'yi
        root moda almayı <strong>dener</strong>. Bu, geliştirici/yazılım (userdebug/eng)
        build'lerinde çalışır; normal (production) cihazlarda Android{' '}
        <strong>"adbd cannot run as root in production builds"</strong> diyerek reddeder.
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Bu uygulama otomatik root <strong>YÜKLEMEZ</strong>. Kalıcı root, cihaz modeline özel boot
        imajının Magisk ile yamanıp fastboot'tan flash'lanmasını gerektirir; tek tıkla yapılamaz ve
        yanlış imaj cihazı bozabilir (brick). Gerekirse:
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
        <li>
          Üreticiden <strong>bootloader kilidini açma</strong> izni alın (bazı operatörler
          kilitler).
        </li>
        <li>
          Cihazın <strong>stok firmware</strong>'ini indirin, <code>boot.img</code> dosyasını bulun.
        </li>
        <li>
          <strong>Magisk</strong> ile <code>boot.img</code> dosyasını yamalayın.
        </li>
        <li>
          Telefonu <strong>fastboot</strong> moduna alın ve yamalı imajı flash'layın.
        </li>
      </ol>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Root garantiyi geçersiz kılar ve risk taşır; yalnızca ne yaptığınızı biliyorsanız devam
        edin.
      </p>
    </section>
  )
}
