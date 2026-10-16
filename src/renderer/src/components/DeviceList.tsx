import { useDeviceStore } from '../store/useDeviceStore'
import DeviceStatusBadge from './DeviceStatusBadge'

export default function DeviceList() {
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const bilgiler = useDeviceStore((s) => s.bilgiler)
  const taraniyor = useDeviceStore((s) => s.taraniyor)
  const sec = useDeviceStore((s) => s.sec)

  if (cihazlar.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        {taraniyor && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        )}
        {taraniyor ? 'Cihazlar taranıyor...' : 'Bağlı cihaz yok.'}
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {cihazlar.map((c) => {
        const info = bilgiler[c.serialNumber ?? c.id]
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
                <DeviceStatusBadge status={c.status} />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {c.model}
                {info?.osVersion ? ` · Android ${info.osVersion}` : ''}
                {c.connectionType ? ` · ${c.connectionType === 'wifi' ? 'Wi-Fi' : 'USB'}` : ''}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{c.serialNumber}</div>
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
