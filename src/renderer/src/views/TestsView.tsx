import { useState } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import { useToastStore } from '../store/useToastStore'
import EmptyState from '../components/ui/EmptyState'
import CommandConsole from '../components/CommandConsole'
import type { TestReport } from '@shared/types'

const durumStil: Record<string, string> = {
  pass: 'text-green-600 dark:text-green-400',
  fail: 'text-red-500',
  error: 'text-amber-600 dark:text-amber-400'
}

// Cihaz testleri (prompt 114-128): suite + rapor + PDF dışa aktarım.
export default function TestsView() {
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const push = useToastStore((s) => s.push)
  const [rapor, setRapor] = useState<TestReport | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)

  const calistir = async () => {
    if (!seciliCihaz) return
    setCalisiyor(true)
    setRapor(null)
    try {
      setRapor(await window.api.runTests(seciliCihaz.id))
    } catch (e) {
      push(e instanceof Error ? e.message : 'Test çalıştırılamadı', 'error')
    } finally {
      setCalisiyor(false)
    }
  }

  const pdfIndir = async () => {
    if (!rapor) return
    try {
      push(`PDF kaydedildi: ${await window.api.exportTestPdf(rapor)}`, 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'PDF alınamadı', 'error')
    }
  }

  if (!seciliCihaz) {
    return (
      <EmptyState
        title="Cihaz seçilmedi"
        description="Test için cihazlar sayfasından bir cihaz seçin."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => void calistir()} disabled={calisiyor} className="btn-primary">
          {calisiyor ? 'Testler çalışıyor...' : 'Tüm testleri çalıştır (126)'}
        </button>
        {rapor && (
          <button onClick={() => void pdfIndir()} className="btn-ghost">
            PDF indir (128)
          </button>
        )}
        {rapor && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rapor.passed}/{rapor.total} başarılı · {rapor.failed} başarısız
          </span>
        )}
      </div>

      {rapor && (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {rapor.results.map((r) => (
              <li key={r.id} className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.name}</span>
                  <span className={`text-sm font-semibold ${durumStil[r.status]}`}>{r.status}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {r.durationMs}ms{r.detail ? ` · ${r.detail}` : ''}
                </div>
                {r.output && (
                  <pre className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs dark:bg-gray-800/50">
                    {r.output}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-medium">Manuel komut konsolu</summary>
        <div className="mt-3">
          <CommandConsole />
        </div>
      </details>
    </div>
  )
}
