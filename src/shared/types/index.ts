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

// --- Root durumu (yalnızca algılama; root YÜKLEME yapılmaz) ---

export interface RootStatus {
  isRooted: boolean
  suPath: string | null
  magiskVersion: string | null
}

export interface AdbRootResult {
  ok: boolean
  output: string
}

export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

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
  encrypted?: boolean
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
  encrypted: boolean
  createdAt: string
}

export type TestStatus = 'pass' | 'fail' | 'error'

export type FileKind = 'folder' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'

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

// --- Güvenlik tipleri (prompt 141-150) ---

export interface AdbKeyInfo {
  exists: boolean
  keyDir: string
  privatePath: string
  publicPath: string
  fingerprintMd5: string | null
  fingerprintSha256: string | null
  comment: string | null
}

export interface DangerousCommandInfo {
  dangerous: boolean
  reason: string | null
}

export interface SessionState {
  hasPassword: boolean
  locked: boolean
}

export interface SecurityUpdateStatus {
  checked: boolean
  checkedAt: string | null
  currentVersion: string
  electronVersion: string
  hasSecurityUpdates: boolean
  advisories: string[]
  error?: string
}

// --- Hata/teşhis tipleri (prompt 151-160) ---

export interface PerformanceMetrics {
  startupMs: number
  uptimeMs: number
  memoryRssMb: number
  memoryHeapUsedMb: number
  memoryHeapTotalMb: number
  adbCommandCount: number
  avgAdbCommandMs: number
}

export type MemoryTrend = 'stable' | 'growing' | 'critical'

export interface MemoryStatus {
  heapUsedMb: number
  heapTotalMb: number
  rssMb: number
  trend: MemoryTrend
  samples: number
}

export interface ErrorLogEntry {
  id: number
  timestamp: string
  level: string
  source: string
  message: string
  stack?: string
}

export interface CrashSummary {
  count: number
  lastCrashAt: string | null
  topMessages: { message: string; count: number }[]
}

export interface ErrorReportResult {
  filePath: string | null
  entryCount: number
  crashCount: number
  summary: string
}

export interface ErrorReportDelivery {
  method: 'endpoint' | 'github' | 'file'
  delivered: boolean
  filePath: string | null
  url?: string
  entryCount: number
  crashCount: number
  summary: string
  error?: string
}
