import { useDeviceStore } from '../store/useDeviceStore'
import { formatBytes } from '../utils/format'
import type { BatteryInfo } from '@shared/types'
import DeviceStatusBadge from './DeviceStatusBadge'

const pilSaglik: Record<string, string> = {
  good: 'iyi',
  overheat: 'aşırı ısındı',
  cold: 'soğuk',
  dead: 'arızalı',
  'over voltage': 'yüksek voltaj',
  'unspecified failure': 'arıza',
  unknown: 'bilinmiyor'
}

function pilMetni(b: BatteryInfo): string {
  const saglik = pilSaglik[b.health] ?? b.health
  return `Pil %${b.level} · ${b.temperatureC}°C · ${saglik}`
}

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
                {info?.apiLevel ? ` (API ${info.apiLevel})` : ''}
                {c.connectionType ? ` · ${c.connectionType === 'wifi' ? 'Wi-Fi' : 'USB'}` : ''}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{c.serialNumber}</div>

              {info && (
                <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {info.battery && <div>{pilMetni(info.battery)}</div>}
                  {info.screen && (
                    <div>
                      {info.screen.width}x{info.screen.height} · {info.screen.densityDpi} dpi
                    </div>
                  )}
                  {info.cpu && info.cpu.cores > 0 && (
                    <div>
                      CPU: {info.cpu.cores} çekirdek
                      {info.cpu.hardware ? ` · ${info.cpu.hardware}` : ''}
                    </div>
                  )}
                  {info.memory && (
                    <div>
                      RAM: {info.memory.availableGb} GB boş / {info.memory.totalGb} GB
                    </div>
                  )}
                  {info.storage && (
                    <div>
                      Depolama: {formatBytes(info.storage.freeBytes)} boş /{' '}
                      {formatBytes(info.storage.totalBytes)}
                    </div>
                  )}
                  {info.serialNo && <div>Seri: {info.serialNo}</div>}
                  {info.imei && <div>IMEI: {info.imei}</div>}
                  {info.locale && <div>Dil: {info.locale}</div>}
                  {info.isRooted && (
                    <div className="font-medium text-amber-600 dark:text-amber-400">Root'lu cihaz</div>
                  )}
                </div>
              )}

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
