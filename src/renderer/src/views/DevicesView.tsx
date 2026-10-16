import { useState } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import DeviceCard from '../components/devices/DeviceCard'
import DeviceSelect from '../components/DeviceSelect'
import WirelessConnect from '../components/WirelessConnect'
import SearchBar from '../components/ui/SearchBar'
import EmptyState from '../components/ui/EmptyState'
import { DeviceCardSkeleton } from '../components/ui/Skeleton'

export default function DevicesView() {
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const bilgiler = useDeviceStore((s) => s.bilgiler)
  const taraniyor = useDeviceStore((s) => s.taraniyor)
  const [arama, setArama] = useState('')

  const filtrelenmis = cihazlar.filter(
    (c) =>
      c.name.toLowerCase().includes(arama.toLowerCase()) ||
      (c.model ?? '').toLowerCase().includes(arama.toLowerCase()) ||
      (c.serialNumber ?? '').toLowerCase().includes(arama.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <SearchBar value={arama} onChange={setArama} placeholder="Cihaz ara..." />
        </div>
        <DeviceSelect />
      </div>

      {taraniyor && cihazlar.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <DeviceCardSkeleton key={i} />
          ))}
        </div>
      ) : filtrelenmis.length === 0 ? (
        <EmptyState
          title={cihazlar.length === 0 ? 'Henüz cihaz bağlı değil' : 'Aramayla eşleşen cihaz yok'}
          description="USB kablosuyla bir cihaz bağlayın veya Wi-Fi üzerinden bağlanın."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrelenmis.map((c) => (
            <DeviceCard key={c.id} device={c} info={bilgiler[c.serialNumber ?? c.id]} />
          ))}
        </div>
      )}

      <WirelessConnect />
    </div>
  )
}
