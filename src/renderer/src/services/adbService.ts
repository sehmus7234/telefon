import type { AdbStatusInfo, AdbHistoryEntry } from '@shared/types'

// ADB ile ilgili IPC çağrılarını saran servis.
export const adbService = {
  durum: (): Promise<AdbStatusInfo> => window.api.getAdbStatus(),
  surum: (): Promise<string> => window.api.getAdbVersion(),
  sunucuBaslat: (): Promise<string> => window.api.startServer(),
  sunucuDurdur: (): Promise<string> => window.api.stopServer(),
  sunucuYenidenBaslat: (): Promise<string> => window.api.restartServer(),
  kablosuzAc: (serial: string, port: number): Promise<string> =>
    window.api.enableWireless(serial, port),
  kablosuzBaglan: (ip: string, port: number): Promise<string> =>
    window.api.connectWireless(ip, port),
  kablosuzKopar: (ip: string, port: number): Promise<string> =>
    window.api.disconnectWireless(ip, port),
  gecmis: (): Promise<AdbHistoryEntry[]> => window.api.getHistory(),
  gecmisTemizle: (): Promise<boolean> => window.api.clearHistory()
}
