import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { Device, BackupFile } from '@shared/types'

// Güvenli preload (prompt 4)
// contextIsolation: true + nodeIntegration: false altında renderer'a yalnızca
// aşağıdaki whitelist API açılır. ipcRenderer doğrudan renderer'a verilmez.
const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  listDevices: (): Promise<Device[]> => ipcRenderer.invoke('devices:list'),
  createBackup: (deviceId: string): Promise<BackupFile | null> =>
    ipcRenderer.invoke('backup:create', deviceId),
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-directory'),

  // Yalnızca izinli kanallar dinlenebilir; genel ipcRenderer.on renderer'a verilmez.
  onUpdaterEvent: (channel: string, callback: (payload: unknown) => void): (() => void) => {
    const allowed = ['updater:available', 'updater:progress', 'updater:downloaded']
    if (!allowed.includes(channel)) return () => {}
    const listener = (_e: IpcRendererEvent, payload: unknown): void => callback(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
