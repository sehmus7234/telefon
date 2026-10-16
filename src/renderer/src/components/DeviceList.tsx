import { useDeviceStore } from '../store/useDeviceStore'

export default function DeviceList() {
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const yukleniyor = useDeviceStore((s) => s.yukleniyor)
  const hata = useDeviceStore((s) => s.hata)
  const sec = useDeviceStore((s) => s.sec)

  if (yukleniyor) return <p className="text-gray-500 dark:text-gray-400">Cihazlar yükleniyor...</p>
  if (hata) return <p className="text-red-500">Hata: {hata}</p>
  if (cihazlar.length === 0) return <p className="text-gray-500 dark:text-gray-400">Bağlı cihaz yok.</p>

  return (
    <ul className="space-y-2">
      {cihazlar.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => sec(c)}
            className={`w-full rounded-md border px-4 py-3 text-left ${
              seciliCihaz?.id === c.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <span className="font-medium">{c.name}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{c.model}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
