import { useEffect, useState } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import { useToastStore } from '../store/useToastStore'
import ProgressBar from '../components/ui/ProgressBar'
import EmptyState from '../components/ui/EmptyState'
import { formatBytes } from '../utils/format'
import type { BackupHistoryItem, BackupReport, BackupType } from '@shared/types'

const TIPLER: { id: BackupType; label: string }[] = [
  { id: 'photos', label: 'Fotoğraflar' },
  { id: 'contacts', label: 'Kişiler' },
  { id: 'sms', label: 'SMS' },
  { id: 'apps', label: 'Uygulamalar' }
]

export default function BackupView() {
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const push = useToastStore((s) => s.push)

  const [gecmis, setGecmis] = useState<BackupHistoryItem[]>([])
  const [seciliTipler, setSeciliTipler] = useState<BackupType[]>(['photos', 'contacts', 'sms'])
  const [exclude, setExclude] = useState('Thumbnails')
  const [zip, setZip] = useState(true)
  const [tahmin, setTahmin] = useState<{ totalBytes: number; estimatedSeconds: number } | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [ilerleme, setIlerleme] = useState<{ stage: string; percent: number } | null>(null)
  const [sonRapor, setSonRapor] = useState<BackupReport | null>(null)

  const gecmisYukle = async () => setGecmis(await window.api.listBackups())

  useEffect(() => {
    void gecmisYukle()
  }, [])

  useEffect(() => {
    const offP = window.api.onBackupProgress((p) => {
      if (p.runId === runId) setIlerleme({ stage: p.stage, percent: p.percent })
    })
    const offR = window.api.onBackupResult((r) => {
      if (r.runId !== runId) return
      setCalisiyor(false)
      setIlerleme(null)
      if (r.error) push(r.error, 'error')
      else if (r.report) {
        setSonRapor(r.report)
        push(
          r.report.status === 'completed' ? 'Yedekleme tamamlandı' : 'Yedekleme iptal edildi',
          r.report.status === 'completed' ? 'success' : 'warning'
        )
        void gecmisYukle()
      }
    })
    return () => {
      offP()
      offR()
    }
  }, [runId, push])

  const tahminAl = async () => {
    if (!seciliCihaz) return
    setTahmin(await window.api.estimateBackup(seciliCihaz.id, ['/sdcard/DCIM']))
  }

  const baslat = async () => {
    if (!seciliCihaz || seciliTipler.length === 0) return
    setCalisiyor(true)
    setSonRapor(null)
    setIlerleme(null)
    const id = await window.api.runBackup({
      serial: seciliCihaz.id,
      types: seciliTipler,
      exclude: exclude
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      zip
    })
    setRunId(id)
  }

  const iptal = async () => {
    if (runId) await window.api.cancelBackup(runId)
  }

  const sil = async (id: number) => {
    await window.api.deleteBackup(id)
    push('Yedek silindi', 'info')
    void gecmisYukle()
  }

  const geriYukle = async (id: number) => {
    try {
      push(await window.api.restoreBackup(id), 'success')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Geri yükleme başarısız', 'error')
    }
  }

  if (!seciliCihaz) {
    return (
      <EmptyState
        title="Cihaz seçilmedi"
        description="Yedekleme için cihazlar sayfasından bir cihaz seçin."
      />
    )
  }

  const inputCls =
    'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800'

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Yedekleme paneli (96-108) */}
      <div className="card space-y-4 p-5">
        <h2 className="font-semibold">{seciliCihaz.name} yedeklemesi</h2>

        <div>
          <div className="mb-1 text-sm font-medium">Yedeklenecekler</div>
          <div className="flex flex-wrap gap-3">
            {TIPLER.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={seciliTipler.includes(t.id)}
                  onChange={(e) =>
                    setSeciliTipler((prev) =>
                      e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id)
                    )
                  }
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Hariç tutulacak klasörler (virgülle, 107)</div>
          <input value={exclude} onChange={(e) => setExclude(e.target.value)} className={inputCls} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={zip} onChange={(e) => setZip(e.target.checked)} />
          Zip olarak sıkıştır (104)
        </label>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => void tahminAl()} className="btn-ghost">
            Tahmini hesapla
          </button>
          <button
            onClick={() => void baslat()}
            disabled={calisiyor || seciliTipler.length === 0}
            className="btn-primary"
          >
            Yedekle
          </button>
          <button onClick={() => void iptal()} disabled={!calisiyor} className="btn-ghost text-red-600">
            İptal
          </button>
        </div>

        {tahmin && !calisiyor && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Tahmin (105): ~{formatBytes(tahmin.totalBytes)} · ~{tahmin.estimatedSeconds} sn
          </div>
        )}

        {calisiyor && ilerleme && (
          <ProgressBar value={ilerleme.percent} label={`${ilerleme.stage} (%${ilerleme.percent})`} />
        )}

        {sonRapor && (
          <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
            <div className="font-medium">Son rapor (108)</div>
            <div className="mt-1 space-y-0.5 text-gray-600 dark:text-gray-300">
              <div>Durum: {sonRapor.status}</div>
              <div>
                Dosya: {sonRapor.fileCount} · Boyut: {formatBytes(sonRapor.sizeBytes)}
              </div>
              <div>Süre: {(sonRapor.durationMs / 1000).toFixed(1)} sn</div>
              {sonRapor.zipPath && <div className="truncate">Zip: {sonRapor.zipPath}</div>}
              {sonRapor.stages.map((s) => (
                <div key={s.type}>
                  {s.type}: {s.fileCount} dosya · {formatBytes(s.sizeBytes)}
                  {s.error ? ` · hata: ${s.error}` : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Geçmiş + yönetim (102/109) */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Yedek geçmişi</h2>
          <button onClick={() => void gecmisYukle()} className="text-xs underline">
            Yenile
          </button>
        </div>
        {gecmis.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Henüz yedek yok.</p>
        ) : (
          <ul className="space-y-2">
            {gecmis.map((b) => (
              <li key={b.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{b.type}</span>
                  <span
                    className={`text-xs ${b.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {b.deviceSerial} · {new Date(b.createdAt).toLocaleString('tr-TR')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatBytes(b.sizeBytes)} · {b.fileCount} dosya · {(b.durationMs / 1000).toFixed(1)} sn
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => void geriYukle(b.id)} className="btn-ghost text-xs">
                    Geri yükle (103)
                  </button>
                  <button onClick={() => void sil(b.id)} className="btn-ghost text-xs text-red-600">
                    Sil (109)
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
