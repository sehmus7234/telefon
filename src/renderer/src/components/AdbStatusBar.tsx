import { useAdbStore } from '../store/useAdbStore'

// ADB durumu, sürümü ve server kontrolleri (prompt 17/19/28/29).
export default function AdbStatusBar() {
  const durum = useAdbStore((s) => s.durum)
  const surum = useAdbStore((s) => s.surum)
  const serverMesgul = useAdbStore((s) => s.serverMesgul)
  const serverBaslat = useAdbStore((s) => s.serverBaslat)
  const serverDurdur = useAdbStore((s) => s.serverDurdur)
  const serverYenidenBaslat = useAdbStore((s) => s.serverYenidenBaslat)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 px-4 py-2 text-sm dark:border-gray-700">
      <span
        className={`inline-flex items-center gap-2 font-medium ${
          durum?.installed ? 'text-green-600 dark:text-green-400' : 'text-red-500'
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-current" />
        {durum?.installed ? 'ADB hazır' : 'ADB bulunamadı'}
      </span>
      {durum?.path && (
        <span className="max-w-[260px] truncate text-xs text-gray-500 dark:text-gray-400">
          {durum.path}
        </span>
      )}
      {surum && <span className="text-xs text-gray-500 dark:text-gray-400">v{surum}</span>}
      <div className="ml-auto flex gap-2">
        <button
          onClick={() => void serverBaslat()}
          disabled={serverMesgul}
          className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Başlat
        </button>
        <button
          onClick={() => void serverDurdur()}
          disabled={serverMesgul}
          className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Durdur
        </button>
        <button
          onClick={() => void serverYenidenBaslat()}
          disabled={serverMesgul}
          className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Yeniden Başlat
        </button>
      </div>
    </div>
  )
}
