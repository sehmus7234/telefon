import { useDeviceStore } from '../store/useDeviceStore'

function durumEtiketi(status: string): { text: string; cls: string } {
  switch (status) {
    case 'online':
      return { text: 'Bağlı', cls: 'text-green-600 dark:text-green-400' }
    case 'offline':
      return { text: 'Çevrimdışı', cls: 'text-gray-500 dark:text-gray-400' }
    case 'unauthorized':
      return { text: 'Yetkisiz', cls: 'text-amber-600 dark:text-amber-400' }
    default:
      return { text: 'Bağlantı yok', cls: 'text-gray-500 dark:text-gray-400' }
  }
}

export default function DeviceList() {
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const sec = useDeviceStore((s) => s.sec)

  if (cihazlar.length === 0)
    return <p className="text-gray-500 dark:text-gray-400">Bağlı cihaz yok.</p>

  return (
    <ul className="space-y-2">
      {cihazlar.map((c) => {
        const durum = durumEtiketi(c.status)
        return (
          <li key={c.id}>
            <button
              onClick={() => sec(c)}
              className={`w-full rounded-md border px-4 py-3 text-left ${
                seciliCihaz?.id === c.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.name}</span>
                <span className={`text-xs font-medium ${durum.cls}`}>{durum.text}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {c.model} · {c.serialNumber}
              </div>
              {c.status === 'unauthorized' && (
                <div className="mt-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  Telefondan izin verin: cihazda "USB hata ayıklamaya izin verilsin mi?" onayını kabul edin.
                </div>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
