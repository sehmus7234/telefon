// Ortak tip tanımları (prompt 15)
// Hem main (yedekleme/cihaz işlemleri) hem renderer (UI) aynı tipleri kullanır.
// Alias: `@shared/types`

export type DevicePlatform = 'android' | 'ios' | 'unknown'

export type DeviceStatus = 'online' | 'offline' | 'unauthorized' | 'charging' | 'disconnected'

export interface Device {
  id: string
  name: string
  model: string
  platform: DevicePlatform
  serialNumber?: string
  status: DeviceStatus
  batteryLevel?: number
  storageTotalBytes?: number
  storageFreeBytes?: number
  lastConnectedAt?: string // ISO 8601
}

export interface DeviceInfo {
  device: Device
  osVersion: string
  manufacturer: string
  firmwareVersion?: string
  isRooted?: boolean
}

export type BackupStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface BackupFile {
  id: string
  deviceId: string
  fileName: string
  filePath: string
  sizeBytes: number
  createdAt: string // ISO 8601
  status: BackupStatus
  checksum?: string
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppSettings {
  theme: ThemeMode
  backupDirectory: string
  autoUpdate: boolean
}

// ADB katmanı tipleri (main <-> renderer arasında paylaşılır)
export interface AdbStatusInfo {
  installed: boolean
  path: string | null
}

export interface AdbHistoryEntry {
  id: number
  command: string
  timestamp: string
  code: number | null
  durationMs: number
  timedOut?: boolean
  aborted?: boolean
}

export interface AdbRunResult {
  runId: string
  stdout: string
  stderr: string
  code: number | null
  timedOut: boolean
  aborted: boolean
  error?: string
}
