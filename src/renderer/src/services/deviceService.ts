import type { Device, DeviceInfo, BackupFile } from '@shared/types'

// Renderer -> preload -> main IPC çağrılarını sarmalar.
// Bileşenler doğrudan window.api yerine bu servisi kullanır (test edilebilirlik).
export const deviceService = {
  listele: (): Promise<Device[]> => window.api.listDevices(),
  bilgi: (serial: string): Promise<DeviceInfo> => window.api.getDeviceInfo(serial),
  yedekle: (serial: string): Promise<string> => window.api.runBackup({ serial }),
  surum: (): Promise<string> => window.api.getVersion()
}
