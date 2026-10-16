import type { Device, BackupFile } from '@shared/types'

// Renderer -> preload -> main IPC çağrılarını sarmalar.
// Bileşenler doğrudan window.api yerine bu servisi kullanır (test edilebilirlik).
export const deviceService = {
  listele: (): Promise<Device[]> => window.api.listDevices(),
  yedekle: (deviceId: string): Promise<BackupFile | null> =>
    window.api.createBackup(deviceId),
  surum: (): Promise<string> => window.api.getVersion()
}
