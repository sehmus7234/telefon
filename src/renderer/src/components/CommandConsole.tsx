import { useState } from 'react'
import { useAdbStore } from '../store/useAdbStore'

// İptal edilebilir komut konsolu + geçmiş (prompt 27/32/34).
export default function CommandConsole() {
  const [komut, setKomut] = useState('devices -l')
  const calisiyor = useAdbStore((s) => s.calisiyor)
  const sonSonuc = useAdbStore((s) => s.sonSonuc)
  const gecmis = useAdbStore((s) => s.gecmis)
  const komutCalistir = useAdbStore((s) => s.komutCalistir)
  const komutIptal = useAdbStore((s) => s.komutIptal)
  const gecmisYukle = useAdbStore((s) => s.gecmisYukle)

  const calistir = async () => {
    const args = komut.trim().split(/\s+/).filter(Boolean)
    if (!args.length) return
    // Tehlikeli komutlarda kullanıcı onayı istenir (148).
    try {
      const sinif = await window.api.classifyCommand(args)
      if (sinif.dangerous) {
        const onay = await window.api.confirmDangerousCommand(args)
        if (!onay) return
        void komutCalistir(args, { confirmed: true })
        return
      }
    } catch {
      // sınıflandırma/onay alınamadı; yine de sunucu tarafı kontrol eder
    }
    void komutCalistir(args)
  }

  return (
    <section className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
      <h2 className="mb-2 font-semibold">ADB Komut Konsolu</h2>
      <div className="flex gap-2">
        <input
          value={komut}
          onChange={(e) => setKomut(e.target.value)}
          placeholder="örn: devices -l"
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
        <button
          onClick={calistir}
          disabled={calisiyor}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Çalıştır
        </button>
        <button
          onClick={() => void komutIptal()}
          disabled={!calisiyor}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:hover:bg-red-900/30"
        >
          İptal
        </button>
      </div>

      {sonSonuc && (
        <div className="mt-3 space-y-2 text-xs">
          {sonSonuc.error && <div className="text-red-500">{sonSonuc.error}</div>}
          {sonSonuc.stdout && (
            <pre className="whitespace-pre-wrap rounded bg-gray-100 p-2 dark:bg-gray-800">
              {sonSonuc.stdout}
            </pre>
          )}
          {sonSonuc.stderr && (
            <pre className="whitespace-pre-wrap rounded bg-red-50 p-2 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {sonSonuc.stderr}
            </pre>
          )}
          <div className="text-gray-500 dark:text-gray-400">
            çıkış kodu: {sonSonuc.code ?? '—'}
            {sonSonuc.timedOut ? ' · zaman aşımı' : ''}
            {sonSonuc.aborted ? ' · iptal edildi' : ''}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Komut geçmişi (son {gecmis.length})</span>
          <button onClick={() => void gecmisYukle()} className="text-xs underline">
            Yenile
          </button>
        </div>
        <ul className="mt-1 max-h-40 space-y-1 overflow-auto text-xs">
          {[...gecmis].reverse().map((g) => (
            <li key={g.id} className="text-gray-600 dark:text-gray-300">
              <code>{g.command}</code>{' '}
              <span className="text-gray-400 dark:text-gray-500">
                {g.durationMs}ms · kod {g.code ?? '—'}
                {g.timedOut ? ' · zaman aşımı' : ''}
                {g.aborted ? ' · iptal' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
