import { useEffect } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import { useAdbStore } from '../store/useAdbStore'

// Main -> renderer olaylarını store'lara bağlar:
// cihaz polling sonuçları, adb hataları ve komut sonuçları.
export function useAdbBridge() {
  const ayarla = useDeviceStore((s) => s.ayarla)
  const sonucIsle = useAdbStore((s) => s.sonucIsle)
  const hataAta = useAdbStore((s) => s.hataAta)

  useEffect(() => {
    const offDevices = window.api.onDevicesChanged((devices) => ayarla(devices))
    const offError = window.api.onDevicesError((message) => hataAta(message))
    const offResult = window.api.onAdbResult((r) => sonucIsle(r))
    return () => {
      offDevices()
      offError()
      offResult()
    }
  }, [ayarla, sonucIsle, hataAta])
}
