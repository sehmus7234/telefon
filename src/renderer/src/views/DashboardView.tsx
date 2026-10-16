import { motion } from 'framer-motion'
import { useDeviceStore } from '../store/useDeviceStore'
import AdbStatusBar from '../components/AdbStatusBar'
import { formatBytes } from '../utils/format'

function StatCard({
  label,
  value,
  sub,
  delay
}: {
  label: string
  value: string
  sub?: string
  delay: number
}) {
  return (
    <motion.div
      className="card p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</div>}
    </motion.div>
  )
}

// Özet istatistikler (prompt 76): bağlı cihaz, son yedekleme, toplam depolama.
export default function DashboardView() {
  const cihazlar = useDeviceStore((s) => s.cihazlar)
  const bilgiler = useDeviceStore((s) => s.bilgiler)
  const bagli = cihazlar.filter((c) => c.status === 'online').length
  const toplamDepolama = cihazlar.reduce(
    (sum, c) => sum + (bilgiler[c.serialNumber ?? c.id]?.storage?.totalBytes ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <AdbStatusBar />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bağlı cihaz" value={String(bagli)} sub={`toplam ${cihazlar.length} cihaz`} delay={0} />
        <StatCard label="Son yedekleme" value="—" sub="henüz yedek yok" delay={0.05} />
        <StatCard
          label="Toplam depolama"
          value={toplamDepolama ? formatBytes(toplamDepolama) : '—'}
          sub="bağlı cihazlar"
          delay={0.1}
        />
        <StatCard
          label="Çevrimiçi oran"
          value={cihazlar.length ? `${Math.round((bagli / cihazlar.length) * 100)}%` : '—'}
          sub="bağlantı durumu"
          delay={0.15}
        />
      </div>
    </div>
  )
}
