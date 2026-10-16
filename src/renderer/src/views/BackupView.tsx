import { useState } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import { useToastStore } from '../store/useToastStore'
import ProgressBar from '../components/ui/ProgressBar'
import EmptyState from '../components/ui/EmptyState'
import type { BackupFile } from '@shared/types'

export default function BackupView() {
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const push = useToastStore((s) => s.push)
  const [ilerleme, setIlerleme] = useState<number | null>(null)
  const [sonYedek, setSonYedek] = useState<BackupFile | null>(null)

  const yedekle = async () => {
    if (!seciliCihaz) return
    setIlerleme(10)
    try {
      const b = await window.api.createBackup(seciliCihaz.id)
      setSonYedek(b)
      setIlerleme(100)
      push(`Yedekleme tamamlandı: ${b.fileName}`, 'success')
    } catch (e) {
      setIlerleme(null)
      push(e instanceof Error ? e.message : 'Yedekleme başarısız', 'error')
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

  return (
    <div className="max-w-xl space-y-4">
      <div className="card p-5">
        <h2 className="font-semibold">{seciliCihaz.name} yedeklemesi</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          /sdcard içeriği cihazdan çekilir.
        </p>
        {ilerleme !== null && (
          <div className="mt-4">
            <ProgressBar value={ilerleme} label="Yedekleme" />
          </div>
        )}
        <button
          onClick={() => void yedekle()}
          disabled={ilerleme !== null && ilerleme < 100}
          className="btn-primary mt-4"
        >
          Yedekleme başlat
        </button>
      </div>

      {sonYedek && (
        <div className="card p-5 text-sm">
          <div className="font-medium">Son yedekleme</div>
          <div className="mt-2 space-y-1 text-gray-500 dark:text-gray-400">
            <div>Dosya: {sonYedek.fileName}</div>
            <div>Boyut: {sonYedek.sizeBytes} bayt</div>
            <div>Durum: {sonYedek.status}</div>
          </div>
        </div>
      )}
    </div>
  )
}
