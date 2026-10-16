import { useEffect, useState } from 'react'
import type {
  PerformanceMetrics,
  MemoryStatus,
  CrashSummary,
  ErrorLogEntry,
  ErrorReportDelivery
} from '@shared/types'

// Hata yönetimi + teşhis paneli (154-160). Ayarlar sayfasında gösterilir.
export default function ErrorDiagnostics() {
  const [debugModu, setDebugModu] = useState(false)
  const [perf, setPerf] = useState<PerformanceMetrics | null>(null)
  const [bellek, setBellek] = useState<MemoryStatus | null>(null)
  const [crash, setCrash] = useState<CrashSummary | null>(null)
  const [hatalar, setHatalar] = useState<ErrorLogEntry[]>([])
  const [gonderim, setGonderim] = useState<ErrorReportDelivery | null>(null)
  const [endpoint, setEndpoint] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [token, setToken] = useState('')

  const yukle = async () => {
    setDebugModu(await window.api.getDebugMode())
    setPerf(await window.api.getPerformanceMetrics())
    setBellek(await window.api.getMemoryStatus())
    setCrash(await window.api.getCrashSummary())
    setHatalar(await window.api.getRecentErrors(50))
    setEndpoint((await window.api.getSetting('errorReport.endpoint')) ?? '')
    setGithubRepo((await window.api.getSetting('errorReport.githubRepo')) ?? '')
    setToken((await window.api.getSecureSetting('errorReport.token')) ?? '')
  }

  const endpointKaydet = async (v: string) => {
    setEndpoint(v)
    await window.api.setSetting('errorReport.endpoint', v)
  }
  const repoKaydet = async (v: string) => {
    setGithubRepo(v)
    await window.api.setSetting('errorReport.githubRepo', v)
  }
  const tokenKaydet = async (v: string) => {
    setToken(v)
    await window.api.setSecureSetting('errorReport.token', v)
  }

  useEffect(() => {
    void yukle()
    const id = setInterval(() => {
      void window.api.getMemoryStatus().then(setBellek)
      void window.api.getPerformanceMetrics().then(setPerf)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const debugDegistir = async (v: boolean) => {
    setDebugModu(await window.api.setDebugMode(v))
  }

  const raporGonder = async () => {
    setGonderim(await window.api.sendErrorReport())
  }

  const guvenliKapat = async () => {
    if (confirm('Uygulama güvenli şekilde kapatılacak. Emin misiniz?')) {
      await window.api.quitSafely()
    }
  }

  const trendRenk =
    bellek?.trend === 'critical'
      ? 'text-red-600 dark:text-red-400'
      : bellek?.trend === 'growing'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400'

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Hata ayıklama modu</h2>
          <button
            onClick={() => void debugDegistir(!debugModu)}
            className={`relative h-6 w-11 rounded-full transition-colors ${debugModu ? 'bg-brand-600' : 'bg-gray-300'}`}
            aria-label="Hata ayıklama modu"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                debugModu ? 'left-6' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Açıkken geliştiriciler için ayrıntılı (debug) log üretilir.
        </p>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Performans metrikleri</h2>
          <button onClick={() => void yukle()} className="text-xs underline">
            Yenile
          </button>
        </div>
        {perf && (
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">Başlangıç</div>
              <div className="font-medium">{(perf.startupMs / 1000).toFixed(1)} sn</div>
            </div>
            <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">Çalışma süresi</div>
              <div className="font-medium">{Math.round(perf.uptimeMs / 1000)} sn</div>
            </div>
            <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">Bellek (RSS)</div>
              <div className="font-medium">{perf.memoryRssMb} MB</div>
            </div>
            <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">Heap kullanımı</div>
              <div className="font-medium">{perf.memoryHeapUsedMb} MB</div>
            </div>
            <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">ADB komutu</div>
              <div className="font-medium">{perf.adbCommandCount}</div>
            </div>
            <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">Ort. komut süresi</div>
              <div className="font-medium">{perf.avgAdbCommandMs} ms</div>
            </div>
          </div>
        )}
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Bellek izleme</h2>
        {bellek && (
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <span>Eğilim:</span>
              <span className={`font-medium ${trendRenk}`}>
                {bellek.trend === 'critical'
                  ? '⚠️ kritik (olası sızıntı)'
                  : bellek.trend === 'growing'
                    ? 'artıyor'
                    : 'kararlı'}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
                <div className="text-xs text-gray-500 dark:text-gray-400">Heap</div>
                <div className="font-medium">{bellek.heapUsedMb} MB</div>
              </div>
              <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
                <div className="text-xs text-gray-500 dark:text-gray-400">RSS</div>
                <div className="font-medium">{bellek.rssMb} MB</div>
              </div>
              <div className="rounded bg-gray-50 p-2 dark:bg-gray-800/50">
                <div className="text-xs text-gray-500 dark:text-gray-400">Örnek</div>
                <div className="font-medium">{bellek.samples}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Çökme raporları</h2>
          <button onClick={() => void yukle()} className="text-xs underline">
            Yenile
          </button>
        </div>
        {crash && (
          <div className="text-sm">
            <div>
              Toplam çökme: <span className="font-medium">{crash.count}</span>
              {crash.lastCrashAt && (
                <span className="text-gray-500 dark:text-gray-400">
                  {' '}
                  · son: {new Date(crash.lastCrashAt).toLocaleString('tr-TR')}
                </span>
              )}
            </div>
            {crash.topMessages.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {crash.topMessages.map((t) => (
                  <li key={t.message}>
                    {t.message} <span className="text-gray-400">({t.count}×)</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Son hatalar</h2>
          <button onClick={() => void yukle()} className="text-xs underline">
            Yenile
          </button>
        </div>
        {hatalar.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Hata kaydı yok.</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-auto text-xs">
            {hatalar.map((h) => (
              <li key={h.id} className="text-gray-600 dark:text-gray-300">
                <span className="text-gray-400">{new Date(h.timestamp).toLocaleTimeString('tr-TR')}</span>{' '}
                <span className="font-medium">[{h.level}]</span> {h.source}: {h.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Hata raporu</h2>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Hedef endpoint (POST webhook, opsiyonel)
            </div>
            <input
              value={endpoint}
              onChange={(e) => void endpointKaydet(e.target.value)}
              placeholder="https://ornek.com/hata-raporu"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              GitHub deposu (owner/repo — endpoint yoksa issue bağlantısı açılır)
            </div>
            <input
              value={githubRepo}
              onChange={(e) => void repoKaydet(e.target.value)}
              placeholder="kullanici/telefon"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Endpoint token (şifreli saklanır, opsiyonel)
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => void tokenKaydet(e.target.value)}
              placeholder="Bearer token"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void raporGonder()} className="btn-primary">
            Hata raporu gönder
          </button>
          <button onClick={() => void guvenliKapat()} className="btn-ghost text-red-600">
            Güvenli kapat
          </button>
        </div>
        {gonderim && (
          <div className="rounded bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
            <div>
              Yöntem: {gonderim.method} · Kayıt: {gonderim.entryCount} · Çökme:{' '}
              {gonderim.crashCount}
            </div>
            {gonderim.method === 'endpoint' && (
              <div className={gonderim.delivered ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {gonderim.delivered ? '✓ Endpoint\'e yüklendi' : `✗ ${gonderim.error}`}
              </div>
            )}
            {gonderim.method === 'github' && (
              <div>GitHub issue bağlantısı tarayıcıda açıldı; raporu ekleyerek gönderin.</div>
            )}
            {gonderim.filePath && <div className="truncate">Dosya: {gonderim.filePath}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
