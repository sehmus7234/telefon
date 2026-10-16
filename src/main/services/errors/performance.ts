// Performans metrikleri (prompt 158).
// Başlangıç süresi, bellek kullanımı ve ADB komut süreleri ölçülür.
import type { PerformanceMetrics } from '@shared/types'

let startupMs = 0
let adbCount = 0
let adbTotalMs = 0

// Uygulama hazır olduğunda çağrılır; başlangıç süresini sabitler.
export function initPerformance(): void {
  startupMs = Math.round(process.uptime() * 1000)
}

// ADB komut süresini kaydeder (exec.ts tarafından çağrılır).
export function recordAdbCommand(durationMs: number): void {
  adbCount++
  adbTotalMs += durationMs
}

function toMb(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 10) / 10
}

// Güncel performans metriklerini döndürür.
export function getPerformanceMetrics(): PerformanceMetrics {
  const mem = process.memoryUsage()
  return {
    startupMs,
    uptimeMs: Math.round(process.uptime() * 1000),
    memoryRssMb: toMb(mem.rss),
    memoryHeapUsedMb: toMb(mem.heapUsed),
    memoryHeapTotalMb: toMb(mem.heapTotal),
    adbCommandCount: adbCount,
    avgAdbCommandMs: adbCount > 0 ? Math.round(adbTotalMs / adbCount) : 0
  }
}
