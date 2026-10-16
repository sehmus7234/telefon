import { useEffect } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import { useAdbStore } from '../store/useAdbStore'
import { useToastStore } from '../store/useToastStore'

// Main -> renderer olaylarını store'lara ve bildirimlere bağlar (prompt 48).
export function useAdbBridge() {
  const ayarla = useDeviceStore((s) => s.ayarla)
  const cihazBilgiEkle = useDeviceStore((s) => s.cihazBilgiEkle)
  const sonucIsle = useAdbStore((s) => s.sonucIsle)
  const hataAta = useAdbStore((s) => s.hataAta)
  const pushToast = useToastStore((s) => s.push)

  useEffect(() => {
    const offDevices = window.api.onDevicesChanged((devices) => ayarla(devices))
    const offConnected = window.api.onDeviceConnected((d) => pushToast(`${d.name} bağlandı`, 'success'))
    const offRemoved = window.api.onDeviceRemoved((d) => pushToast(`${d.name} çıkarıldı`, 'info'))
    const offInfo = window.api.onDeviceInfo(({ serial, info }) => cihazBilgiEkle(serial, info))
    const offError = window.api.onDevicesError((message) => {
      hataAta(message)
      pushToast(message, 'error')
    })
    const offResult = window.api.onAdbResult((r) => sonucIsle(r))
    return () => {
      offDevices()
      offConnected()
      offRemoved()
      offInfo()
      offError()
      offResult()
    }
  }, [ayarla, cihazBilgiEkle, sonucIsle, hataAta, pushToast])
}
