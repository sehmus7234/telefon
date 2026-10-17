import { useCallback, useEffect, useState } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import { useToastStore } from '../store/useToastStore'
import EmptyState from '../components/ui/EmptyState'
import DeviceStatusBadge from '../components/DeviceStatusBadge'
import type { Device, DeviceInfo } from '@shared/types'

// Cihazın bilgi deposundaki anahtarı (serial ya da id).
function serialOf(d: Device): string {
  return d.serialNumber ?? d.id
}

// Telefon IMEI sayfası: bağlı cihazların IMEI'sini yalnızca okuma modunda gösterir.
export default function ImeiView() {
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const bilgiler = useDeviceStore((s) => s.bilgiler)
  const cihazBilgiEkle = useDeviceStore((s) => s.cihazBilgiEkle)
  const push = useToastStore((s) => s.push)
  const [yukleniyor, setYukleniyor] = useState<Record<string, boolean>>({})

  const bagli = cihazlar.filter((d) => d.status === 'online')

  const bilgiCek = useCallback(
    async (d: Device): Promise<void> => {
      const serial = serialOf(d)
      setYukleniyor((s) => ({ ...s, [serial]: true }))
      try {
        const info = await window.api.getDeviceInfo(serial)
        cihazBilgiEkle(serial, info)
      } catch {
        // Bilgi çekilemedi; sessiz geç (kullanıcı yeniden deneyebilir).
      } finally {
        setYukleniyor((s) => ({ ...s, [serial]: false }))
      }
    },
    [cihazBilgiEkle]
  )

  // Açılışta zaten bağlı olan cihazların bilgisi yoksa otomatik çek.
  useEffect(() => {
    for (const d of cihazlar) {
      if (d.status !== 'online') continue
      if (!bilgiler[serialOf(d)]) void bilgiCek(d)
    }
  }, [cihazlar, bilgiler, bilgiCek])

  const kopyala = async (imei: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(imei)
      push('IMEI kopyalandı', 'success')
    } catch {
      push('IMEI kopyalanamadı', 'error')
    }
  }

  if (bagli.length === 0) {
    return (
      <EmptyState
        title="Telefon bağlı değil"
        description="IMEI'yi görmek için USB kablosuyla bir cihaz bağlayın veya Wi-Fi üzerinden bağlanın."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {bagli.map((d) => {
          const serial = serialOf(d)
          const info: DeviceInfo | undefined = bilgiler[serial]
          const imei = info?.imei
          const yukleniyorMu = yukleniyor[serial] === true
          return (
            <div key={d.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{d.name}</span>
                <DeviceStatusBadge status={d.status} />
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {info ? `${info.manufacturer} · ${info.model}` : d.model}
              </div>

              <div className="mt-4 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  IMEI
                </div>
                {yukleniyorMu ? (
                  <div className="mt-1 text-sm text-gray-400">Okunuyor…</div>
                ) : imei ? (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-lg tracking-wider">{imei}</span>
                    <button
                      onClick={() => void kopyala(imei)}
                      className="btn-ghost shrink-0 text-xs"
                      aria-label="IMEI kopyala"
                    >
                      Kopyala
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    IMEI alınamadı
                    <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                      Android 10 ve üzeri cihazlar, yetkisiz erişimde IMEI döndürmeyebilir.
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => void bilgiCek(d)}
                disabled={yukleniyorMu}
                className="btn-ghost mt-3 text-sm"
              >
                Yenile
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
