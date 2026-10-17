import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type {
  Device,
  DeviceInfo,
  BackupFile,
  AdbStatusInfo,
  AdbHistoryEntry,
  AdbRunResult,
  BackupType,
  BackupEstimate,
  BackupHistoryItem,
  BackupProgress,
  BackupReport,
  TestReport,
  FileEntry,
  AdbKeyInfo,
  DangerousCommandInfo,
  SessionState,
  SecurityUpdateStatus,
  ErrorLogEntry,
  CrashSummary,
  PerformanceMetrics,
  MemoryStatus,
  ErrorReportResult,
  ErrorReportDelivery
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
  startScrcpy: (serial: string): Promise<{ ok: boolean; message: string }> =>
    ipcRenderer.invoke('device:scrcpy', serial),
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:select-directory'),

  // ADB
  getAdbStatus: (): Promise<AdbStatusInfo> => ipcRenderer.invoke('adb:status'),
  getAdbPath: (): Promise<string | null> => ipcRenderer.invoke('adb:get-path'),
  setAdbPath: (path: string): Promise<AdbStatusInfo> => ipcRenderer.invoke('adb:set-path', path),
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
    opts?: { serial?: string; timeoutMs?: number; confirmed?: boolean }
  ): Promise<string> => ipcRenderer.invoke('adb:run', args, opts),
  cancelCommand: (runId: string): Promise<boolean> => ipcRenderer.invoke('adb:cancel', runId),

  // ADB anahtar yönetimi + parmak izi (141/143)
  getAdbKeyInfo: (): Promise<AdbKeyInfo> => ipcRenderer.invoke('adb:key:info'),
  ensureAdbKey: (): Promise<AdbKeyInfo> => ipcRenderer.invoke('adb:key:ensure'),
  rotateAdbKey: (): Promise<AdbKeyInfo> => ipcRenderer.invoke('adb:key:rotate'),
  deleteAdbKey: (): Promise<boolean> => ipcRenderer.invoke('adb:key:delete'),

  // Tehlikeli komut sınıflandırma + onay (148)
  classifyCommand: (args: string[]): Promise<DangerousCommandInfo> =>
    ipcRenderer.invoke('adb:command:classify', args),
  confirmDangerousCommand: (args: string[]): Promise<boolean> =>
    ipcRenderer.invoke('adb:command:confirm', args),

  // Yedekleme (96-110 + şifreleme 145)
  runBackup: (opts: {
    serial: string
    types?: BackupType[]
    exclude?: string[]
    zip?: boolean
    encrypt?: boolean
    password?: string
  }): Promise<string> => ipcRenderer.invoke('backup:run', opts),
  cancelBackup: (runId: string): Promise<boolean> => ipcRenderer.invoke('backup:cancel', runId),
  estimateBackup: (serial: string, paths: string[]): Promise<BackupEstimate> =>
    ipcRenderer.invoke('backup:estimate', serial, paths),
  listBackups: (): Promise<BackupHistoryItem[]> => ipcRenderer.invoke('backup:list'),
  deleteBackup: (id: number): Promise<boolean> => ipcRenderer.invoke('backup:delete', id),
  restoreBackup: (id: number, password?: string): Promise<string> =>
    ipcRenderer.invoke('backup:restore', id, password),

  // Cihaz testleri (114-128)
  runTests: (serial: string): Promise<TestReport> => ipcRenderer.invoke('tests:run', serial),
  exportTestPdf: (report: TestReport): Promise<string> =>
    ipcRenderer.invoke('tests:export-pdf', report),

  // Dosya işlemleri (129-140)
  listFiles: (serial: string, path: string): Promise<FileEntry[]> =>
    ipcRenderer.invoke('files:list', serial, path),
  pullFile: (serial: string, remotePath: string): Promise<string> =>
    ipcRenderer.invoke('files:pull', serial, remotePath),
  pushFile: (serial: string, localPath: string, remoteDir: string): Promise<void> =>
    ipcRenderer.invoke('files:push', serial, localPath, remoteDir),
  deleteFile: (serial: string, remotePath: string): Promise<void> =>
    ipcRenderer.invoke('files:delete', serial, remotePath),
  createFolder: (serial: string, parent: string, name: string): Promise<void> =>
    ipcRenderer.invoke('files:mkdir', serial, parent, name),
  getThumbnail: (serial: string, remotePath: string): Promise<string | null> =>
    ipcRenderer.invoke('files:thumbnail', serial, remotePath),
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  // Oturum yönetimi (146)
  getSessionState: (): Promise<SessionState> => ipcRenderer.invoke('security:session:state'),
  setSessionPassword: (password: string): Promise<SessionState> =>
    ipcRenderer.invoke('security:session:set-password', password),
  unlockSession: (password: string): Promise<SessionState> =>
    ipcRenderer.invoke('security:session:unlock', password),
  lockSession: (): Promise<SessionState> => ipcRenderer.invoke('security:session:lock'),
  changeSessionPassword: (oldPassword: string, newPassword: string): Promise<SessionState> =>
    ipcRenderer.invoke('security:session:change-password', oldPassword, newPassword),
  removeSessionPassword: (password: string): Promise<SessionState> =>
    ipcRenderer.invoke('security:session:remove-password', password),

  // Şifreli ayar deposu (147)
  setSecureSetting: (key: string, value: string): Promise<void> =>
    ipcRenderer.invoke('security:secure-setting:set', key, value),
  getSecureSetting: (key: string): Promise<string | null> =>
    ipcRenderer.invoke('security:secure-setting:get', key),
  deleteSecureSetting: (key: string): Promise<boolean> =>
    ipcRenderer.invoke('security:secure-setting:delete', key),

  // Güvenlik güncelleme kontrolü (150)
  checkSecurityUpdates: (): Promise<SecurityUpdateStatus> =>
    ipcRenderer.invoke('security:updates:check'),
  getSecurityUpdatesStatus: (): Promise<SecurityUpdateStatus | null> =>
    ipcRenderer.invoke('security:updates:status'),

  // Hata yönetimi + teşhis (151-160)
  getRecentErrors: (limit?: number): Promise<ErrorLogEntry[]> =>
    ipcRenderer.invoke('errors:list', limit),
  logError: (level: string, source: string, message: string, stack?: string): Promise<void> =>
    ipcRenderer.invoke('errors:log', level, source, message, stack),
  exportErrorReport: (): Promise<ErrorReportResult> => ipcRenderer.invoke('errors:export-report'),
  sendErrorReport: (): Promise<ErrorReportDelivery> => ipcRenderer.invoke('errors:send-report'),
  getSetting: (key: string): Promise<string | null> => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string): Promise<boolean> =>
    ipcRenderer.invoke('settings:set', key, value),
  getCrashSummary: (): Promise<CrashSummary> => ipcRenderer.invoke('errors:crash-summary'),
  getPerformanceMetrics: (): Promise<PerformanceMetrics> => ipcRenderer.invoke('perf:metrics'),
  getMemoryStatus: (): Promise<MemoryStatus> => ipcRenderer.invoke('memory:status'),
  getDebugMode: (): Promise<boolean> => ipcRenderer.invoke('debug:get'),
  setDebugMode: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke('debug:set', enabled),
  quitSafely: (): Promise<boolean> => ipcRenderer.invoke('app:quit-safely'),

  // Olaylar (prompt 48)
  onDevicesChanged: (cb: (devices: Device[]) => void): (() => void) =>
    subscribe('devices:changed', cb),
  onDeviceConnected: (cb: (device: Device) => void): (() => void) =>
    subscribe('device:connected', cb),
  onDeviceRemoved: (cb: (device: Device) => void): (() => void) => subscribe('device:removed', cb),
  onDeviceInfo: (cb: (payload: { serial: string; info: DeviceInfo }) => void): (() => void) =>
    subscribe('device:info', cb),
  onDevicesError: (cb: (message: string) => void): (() => void) => subscribe('devices:error', cb),
  onAdbResult: (cb: (result: AdbRunResult) => void): (() => void) => subscribe('adb:result', cb),
  onBackupProgress: (cb: (p: BackupProgress & { runId: string }) => void): (() => void) =>
    subscribe('backup:progress', cb),
  onBackupResult: (
    cb: (r: { runId: string; report?: BackupReport; dbId?: number; error?: string }) => void
  ): (() => void) => subscribe('backup:result', cb),
  onUpdaterEvent: (channel: string, cb: (payload: unknown) => void): (() => void) => {
    const allowed = ['updater:available', 'updater:progress', 'updater:downloaded']
    if (!allowed.includes(channel)) return () => {}
    return subscribe(channel, cb)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
