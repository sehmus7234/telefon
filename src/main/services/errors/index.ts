// Hata yönetimi + teşhis modülünün genel arayüzü (prompt 151-160).
export { humanizeAdbError, humanizeError } from './adbError'
export { withRetry, isNetworkError } from './retry'
export type { RetryOptions } from './retry'
export {
  initErrorLog,
  logError,
  getRecentErrors,
  readAllErrors,
  getErrorLogPath,
  flushErrorLog
} from './errorLog'
export {
  initPerformance,
  recordAdbCommand,
  getPerformanceMetrics
} from './performance'
export {
  startMemoryMonitor,
  stopMemoryMonitor,
  recordMemorySample,
  getMemoryStatus,
  computeTrend
} from './memory'
export {
  writeCrashReport,
  analyzeCrashes
} from './crash'
export type { CrashReportFile } from './crash'
export { setDebug, isDebug, debug, setDebugSink } from './debug'
export { exportErrorReport } from './report'
