import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavStore } from '../store/useNavStore'
import { useDeviceStore } from '../store/useDeviceStore'
import { useToastStore } from '../store/useToastStore'
import DataTable, { type Column } from '../components/ui/DataTable'
import CommandConsole from '../components/CommandConsole'
import DeviceStatusBadge from '../components/DeviceStatusBadge'
import EmptyState from '../components/ui/EmptyState'
import { formatBytes } from '../utils/format'
import type { DeviceInfo } from '@shared/types'

type Tab = 'genel' | 'uygulamalar' | 'dosyalar' | 'testler'

const sekmeler: { id: Tab; label: string }[] = [
  { id: 'genel', label: 'Genel' },
  { id: 'uygulamalar', label: 'Uygulamalar' },
  { id: 'dosyalar', label: 'Dosyalar' },
  { id: 'testler', label: 'Testler' }
]

interface BilgiSatiri {
  id: string
  ozellik: string
  deger: string
}

function bilgiSatirlari(info?: DeviceInfo): BilgiSatiri[] {
  if (!info) return []
  return [
    { id: 'model', ozellik: 'Model', deger: info.model },
    { id: 'uretici', ozellik: 'Üretici', deger: info.manufacturer },
    { id: 'android', ozellik: 'Android sürümü', deger: info.osVersion },
    { id: 'api', ozellik: 'API seviyesi', deger: info.apiLevel ? String(info.apiLevel) : '—' },
    { id: 'seri', ozellik: 'Seri no', deger: info.serialNo ?? '—' },
    { id: 'imei', ozellik: 'IMEI', deger: info.imei ?? '—' },
    {
      id: 'pil',
      ozellik: 'Pil',
      deger: info.battery
        ? `%${info.battery.level} · ${info.battery.temperatureC}°C · ${info.battery.health}`
        : '—'
    },
    {
      id: 'ekran',
      ozellik: 'Ekran',
      deger: info.screen
        ? `${info.screen.width}x${info.screen.height} · ${info.screen.densityDpi}dpi`
        : '—'
    },
    {
      id: 'cpu',
      ozellik: 'CPU',
      deger: info.cpu ? `${info.cpu.cores} çekirdek · ${info.cpu.hardware || info.cpu.model}` : '—'
    },
    {
      id: 'ram',
      ozellik: 'RAM',
      deger: info.memory ? `${info.memory.availableGb} GB boş / ${info.memory.totalGb} GB` : '—'
    },
    {
      id: 'depo',
      ozellik: 'Depolama',
      deger: info.storage
        ? `${formatBytes(info.storage.freeBytes)} boş / ${formatBytes(info.storage.totalBytes)}`
        : '—'
    },
    { id: 'mac', ozellik: 'MAC', deger: info.macAddress ?? '—' },
    { id: 'dil', ozellik: 'Dil/bölge', deger: info.locale ?? '—' },
    { id: 'root', ozellik: 'Root', deger: info.isRooted ? 'Evet' : 'Hayır' }
  ]
}

const bilgiKolonlari: Column<BilgiSatiri>[] = [
  { key: 'ozellik', header: 'Özellik', accessor: (r) => r.ozellik },
  { key: 'deger', header: 'Değer', accessor: (r) => r.deger }
]

interface PaketSatiri {
  id: string
  tur: string
  paket: string
}

function UygulamalarTab({ info }: { info?: DeviceInfo }) {
  const rows: PaketSatiri[] = [
    ...(info?.packages?.system ?? []).map((p) => ({ id: `s-${p}`, tur: 'Sistem', paket: p })),
    ...(info?.packages?.thirdParty ?? []).map((p) => ({ id: `t-${p}`, tur: 'Üçüncü parti', paket: p }))
  ]
  if (rows.length === 0)
    return <EmptyState title="Uygulama listesi yok" description="Cihaz bilgisi henüz çekilmedi." />
  const cols: Column<PaketSatiri>[] = [
    { key: 'paket', header: 'Paket', accessor: (r) => r.paket },
    { key: 'tur', header: 'Tür', accessor: (r) => r.tur }
  ]
  return <DataTable columns={cols} rows={rows} />
}

function DosyalarTab() {
  return <EmptyState title="Dosya yok" description="Dosya gezgini henüz eklenmedi." />
}

// Cihaz detay sayfası: sekmeli yapı + smooth geçişler (prompt 77/78) + scrcpy (89).
export default function DeviceDetailView() {
  const [tab, setTab] = useState<Tab>('genel')
  const seciliCihazId = useNavStore((s) => s.seciliCihazId)
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const bilgiler = useDeviceStore((s) => s.bilgiler)
  const push = useToastStore((s) => s.push)
  const device =
    cihazlar.find((c) => c.serialNumber === seciliCihazId) ??
    cihazlar.find((c) => c.id === seciliCihazId)
  const info = device ? bilgiler[device.serialNumber ?? device.id] : undefined

  const scrcpyBaslat = async () => {
    if (!device) return
    const r = await window.api.startScrcpy(device.serialNumber ?? device.id)
    push(r.message, r.ok ? 'success' : 'warning')
  }

  if (!device) return <EmptyState title="Cihaz bulunamadı" description="Cihazlar sayfasından bir cihaz seçin." />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">{device.name}</h2>
        <DeviceStatusBadge status={device.status} />
        {info && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {info.manufacturer} · {info.model}
          </span>
        )}
        <button onClick={() => void scrcpyBaslat()} className="btn-ghost ml-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="14" rx="2" />
            <path d="M8 22h8" />
            <path d="M12 18v4" />
          </svg>
          Canlı Ekran (scrcpy)
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {sekmeler.map((s) => (
          <button
            key={s.id}
            onClick={() => setTab(s.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              tab === s.id
                ? 'text-brand-600 dark:text-brand-300'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {s.label}
            {tab === s.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'genel' && <DataTable columns={bilgiKolonlari} rows={bilgiSatirlari(info)} />}
          {tab === 'uygulamalar' && <UygulamalarTab info={info} />}
          {tab === 'dosyalar' && <DosyalarTab />}
          {tab === 'testler' && <CommandConsole />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
