// ADB servisinin genel arayüzü (barrel).
export {
  findAdbPath,
  isAdbInstalled,
  getAdbStatus,
  setConfiguredAdbPath,
  getConfiguredAdbPath
} from './paths'
export type { AdbStatusInfo } from '@shared/types'
export { adbExec, adbExecFull, runAbortable, cancelRun, DEFAULT_TIMEOUT_MS } from './exec'
export type { AdbExecOptions, AdbExecResult } from './exec'
export { lines, parseDevices, parseVersion } from './parse'
export type { ParsedAdbDevice } from './parse'
export { startServer, killServer, restartServer } from './server'
export {
  listDevices,
  getDeviceState,
  listUnauthorized,
  enableWireless,
  connectWireless,
  disconnectWireless,
  detectConnectionType,
  diffDevices
} from './devices'
export { getAdbVersion } from './version'
export { getHistory, clearHistory } from './history'
export { createBackup } from './backup'
export type { BackupOptions } from './backup'
export { getDeviceInfo } from './deviceInfo'
export { adbQueue, CommandQueue } from './queue'
