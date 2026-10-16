import type { DeviceStatus } from '@shared/types'

// Bağlantı durumu rozeti (prompt 43):
// yeşil = bağlı, sarı = yetkisiz, kırmızı = çevrimdışı.
function stil(status: DeviceStatus): { text: string; dot: string; textCls: string } {
  switch (status) {
    case 'online':
      return { text: 'Bağlı', dot: 'bg-green-500', textCls: 'text-green-600 dark:text-green-400' }
    case 'unauthorized':
      return {
        text: 'Yetkisiz',
        dot: 'bg-amber-500',
        textCls: 'text-amber-600 dark:text-amber-400'
      }
    case 'offline':
      return { text: 'Çevrimdışı', dot: 'bg-red-500', textCls: 'text-red-500' }
    default:
      return {
        text: 'Bağlantı yok',
        dot: 'bg-gray-400',
        textCls: 'text-gray-500 dark:text-gray-400'
      }
  }
}

export default function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  const s = stil(status)
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.textCls}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  )
}
