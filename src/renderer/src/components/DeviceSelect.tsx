import { useDeviceStore } from '../store/useDeviceStore'

// Çoklu cihaz seçim dropdown'ı (prompt 39).
export default function DeviceSelect() {
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const sec = useDeviceStore((s) => s.sec)

  if (cihazlar.length < 2) return null

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">Cihaz:</span>
      <select
        value={seciliCihaz?.id ?? ''}
        onChange={(e) => sec(cihazlar.find((c) => c.id === e.target.value) ?? null)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
      >
        {cihazlar.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.serialNumber})
          </option>
        ))}
      </select>
    </label>
  )
}
