// Ortak tip tanımları (prompt 15)
// Hem main (yedekleme/cihaz işlemleri) hem renderer (UI) aynı tipleri kullanır.
// Alias: `@shared/types`

export type DevicePlatform = 'android' | 'ios' | 'unknown'

export type DeviceStatus = 'online' | 'offline' | 'unauthorized' | 'charging' | 'disconnected'

export type ConnectionType = 'usb' | 'wifi'

export interface Device {
  id: string
  name: string
  model: string
  platform: DevicePlatform
  serialNumber?: string
  status: DeviceStatus
  connectionType?: ConnectionType
  batteryLevel?: number
  storageTotalBytes?: number
  storageFreeBytes?: number
  lastConnectedAt?: string // ISO 8601
}

export interface BatteryInfo {
  level: number // 0-100
  status: string // charging | discharging | full | not charging | unknown
  health: string // good | overheat | cold | dead | over voltage | unknown
  temperatureC: number
  voltageMv?: number
  technology?: string
}

export interface ScreenInfo {
  width: number
  height: number
  densityDpi: number
}

export interface CpuInfo {
  cores: number
  model: string
  hardware: string
}

export interface MemoryInfo {
  totalKb: number
  availableKb: number
  totalGb: number
  availableGb: number
}

export interface StorageInfo {
  totalBytes: number
  usedBytes: number
  freeBytes: number
}

export interface PackageInfo {
  system: string[]
  thirdParty: string[]
}

export interface DeviceInfo {
  device: Device
  model: string
  manufacturer: string
  osVersion: string
  apiLevel: number | null
  serialNo: string | null
  imei: string | null
  battery: BatteryInfo | null
  screen: ScreenInfo | null
  cpu: CpuInfo | null
  memory: MemoryInfo | null
  storage: StorageInfo | null
  isRooted: boolean
  macAddress: string | null
  locale: string | null
  packages: PackageInfo | null
  firmwareVersion?: string
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

export type BackupType = 'photos' | 'contacts' | 'sms' | 'apps'

export interface BackupStageResult {
  type: BackupType
  fileCount: number
  sizeBytes: number
  error?: string
}

export interface BackupReport {
  id: string
  deviceSerial: string
  types: BackupType[]
  dir: string
  zipPath?: string
  fileCount: number
  sizeBytes: number
  durationMs: number
  status: 'completed' | 'cancelled' | 'failed'
  createdAt: string
  stages: BackupStageResult[]
  error?: string
}

export interface BackupEstimate {
  totalBytes: number
  estimatedSeconds: number
}

export interface BackupProgress {
  stage: string
  percent: number
}

export interface BackupHistoryItem {
  id: number
  deviceSerial: string
  type: string
  path: string
  fileCount: number
  sizeBytes: number
  durationMs: number
  status: string
  createdAt: string
}

export type TestStatus = 'pass' | 'fail' | 'error'

export type FileKind =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'other'

export interface FileEntry {
  name: string
  path: string
  sizeBytes: number
  isDir: boolean
  permissions?: string
  modified?: string
}

export interface TestResult {
  id: string
  name: string
  status: TestStatus
  output: string
  durationMs: number
  detail?: string
}

export interface TestReport {
  deviceSerial: string
  createdAt: string
  total: number
  passed: number
  failed: number
  results: TestResult[]
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
