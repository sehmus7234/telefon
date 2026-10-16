import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type {
  Device,
  DeviceInfo,
  BackupFile,
  AdbStatusInfo,
  AdbHistoryEntry,
  AdbRunResult
} from '@shared/types'

// Yalnızca izinli kanallar dinlenebilir; genel ipcRenderer.on renderer'a verilmez.
function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_e: IpcRendererEvent, payload: unknown): void => callback(payload as T)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

// Güvenli preload (prompt 4): renderer'a yalnızca whitelist API açılır.
const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  listDevices: (): Promise<Device[]> => ipcRenderer.invoke('devices:list'),
  refreshDevices: (): Promise<Device[]> => ipcRenderer.invoke('devices:refresh'),
  getDeviceInfo: (serial: string): Promise<DeviceInfo> =>
    ipcRenderer.invoke('devices:info', serial),
  listUnauthorized: (): Promise<string[]> => ipcRenderer.invoke('devices:unauthorized'),
  createBackup: (deviceId: string): Promise<BackupFile> =>
    ipcRenderer.invoke('backup:create', deviceId),
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-directory'),

  // ADB
  getAdbStatus: (): Promise<AdbStatusInfo> => ipcRenderer.invoke('adb:status'),
  getAdbVersion: (): Promise<string> => ipcRenderer.invoke('adb:version'),
  startServer: (): Promise<string> => ipcRenderer.invoke('adb:server:start'),
  stopServer: (): Promise<string> => ipcRenderer.invoke('adb:server:stop'),
  restartServer: (): Promise<string> => ipcRenderer.invoke('adb:server:restart'),
  enableWireless: (serial: string, port: number): Promise<string> =>
    ipcRenderer.invoke('adb:wireless:enable', serial, port),
  connectWireless: (ip: string, port: number): Promise<string> =>
    ipcRenderer.invoke('adb:wireless:connect', ip, port),
  disconnectWireless: (ip: string, port: number): Promise<string> =>
    ipcRenderer.invoke('adb:wireless:disconnect', ip, port),
  getHistory: (): Promise<AdbHistoryEntry[]> => ipcRenderer.invoke('adb:history'),
  clearHistory: (): Promise<boolean> => ipcRenderer.invoke('adb:history:clear'),
  runCommand: (
    args: string[],
    opts?: { serial?: string; timeoutMs?: number }
  ): Promise<string> => ipcRenderer.invoke('adb:run', args, opts),
  cancelCommand: (runId: string): Promise<boolean> => ipcRenderer.invoke('adb:cancel', runId),

  // Olaylar (prompt 48)
  onDevicesChanged: (cb: (devices: Device[]) => void): (() => void) =>
    subscribe('devices:changed', cb),
  onDeviceConnected: (cb: (device: Device) => void): (() => void) =>
    subscribe('device:connected', cb),
  onDeviceRemoved: (cb: (device: Device) => void): (() => void) =>
    subscribe('device:removed', cb),
  onDeviceInfo: (cb: (payload: { serial: string; info: DeviceInfo }) => void): (() => void) =>
    subscribe('device:info', cb),
  onDevicesError: (cb: (message: string) => void): (() => void) =>
    subscribe('devices:error', cb),
  onAdbResult: (cb: (result: AdbRunResult) => void): (() => void) =>
    subscribe('adb:result', cb),
  onUpdaterEvent: (channel: string, cb: (payload: unknown) => void): (() => void) => {
    const allowed = ['updater:available', 'updater:progress', 'updater:downloaded']
    if (!allowed.includes(channel)) return () => {}
    return subscribe(channel, cb)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
