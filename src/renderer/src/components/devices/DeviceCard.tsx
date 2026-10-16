import { motion } from 'framer-motion'
import type { Device, DeviceInfo, BatteryInfo } from '@shared/types'
import { useNavStore } from '../../store/useNavStore'
import DeviceStatusBadge from '../DeviceStatusBadge'

// Pil ikonu (prompt 74).
function PilIkoni({ battery }: { battery?: BatteryInfo | null }) {
  const level = battery?.level ?? 0
  const color = level > 50 ? 'text-emerald-500' : level > 20 ? 'text-amber-500' : 'text-red-500'
  const w = Math.max(0, Math.min(15, Math.round((level / 100) * 15)))
  return (
    <span className={`inline-flex items-center ${color}`}>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
        <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke="currentColor" />
        <rect x="19.5" y="3.5" width="2" height="5" rx="0.5" fill="currentColor" />
        <rect x="2" y="2" width={w} height="8" rx="1" fill="currentColor" />
      </svg>
      <span className="ml-1 text-xs">{level}%</span>
    </span>
  )
}

// Cihaz kartı (prompt 74) + hover animasyonu scale/shadow (75).
export default function DeviceCard({ device, info }: { device: Device; info?: DeviceInfo }) {
  const cihazAc = useNavStore((s) => s.cihazAc)
  return (
    <motion.button
      onClick={() => cihazAc(device.serialNumber ?? device.id)}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="card p-4 text-left hover:shadow-glow"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{device.name}</span>
        <DeviceStatusBadge status={device.status} />
      </div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{device.model}</div>
      <div className="mt-3 flex items-center justify-between">
        <PilIkoni battery={info?.battery} />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {device.connectionType === 'wifi' ? 'Wi-Fi' : 'USB'}
        </span>
      </div>
    </motion.button>
  )
}
