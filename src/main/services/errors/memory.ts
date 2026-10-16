// Bellek sızıntısı sezgisel tespiti (prompt 159).
// Heap kullanımını düzenli örnekler; sürekli artan eğilimde uyarı üretir.
// Not: gerçek sızıntı profili değil, artan heap eğilimi için en iyi çaba sezgiselidir.
import type { MemoryStatus, MemoryTrend } from '@shared/types'
import { logError } from './errorLog'

const MAX_SAMPLES = 60
let samples: number[] = [] // heapUsedMb
let timer: NodeJS.Timeout | null = null
let warned = false

function toMb(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 10) / 10
}

// Bir örnek alır.
export function recordMemorySample(): void {
  const mb = toMb(process.memoryUsage().heapUsed)
  samples.push(mb)
  if (samples.length > MAX_SAMPLES) samples = samples.slice(-MAX_SAMPLES)
}

// Eğilimi hesaplar (saf — test edilebilir).
export function computeTrend(series: number[]): MemoryTrend {
  const n = series.length
  if (n < 5) return 'stable'
  const early = series.slice(0, Math.max(1, Math.floor(n / 3)))
  const late = series.slice(-Math.max(1, Math.floor(n / 3)))
  const avg = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length
  const earlyAvg = avg(early)
  const lateAvg = avg(late)
  if (earlyAvg <= 0) return 'stable'
  const growth = (lateAvg - earlyAvg) / earlyAvg
  if (growth > 0.3) return 'critical'
  if (growth > 0.1) return 'growing'
  return 'stable'
}

// Periyodik izlemeyi başlatır (main süreçte çağrılır).
export function startMemoryMonitor(intervalMs = 30_000): void {
  stopMemoryMonitor()
  recordMemorySample()
  timer = setInterval(() => {
    recordMemorySample()
    const trend = computeTrend(samples)
    if (trend === 'critical' && !warned) {
      warned = true
      logError('warn', 'memory', 'Bellek kullanımı sürekli artıyor — olası bellek sızıntısı.')
    } else if (trend === 'stable') {
      warned = false
    }
  }, intervalMs)
}

export function stopMemoryMonitor(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// Güncel bellek durumunu döndürür.
export function getMemoryStatus(): MemoryStatus {
  const mem = process.memoryUsage()
  return {
    heapUsedMb: toMb(mem.heapUsed),
    heapTotalMb: toMb(mem.heapTotal),
    rssMb: toMb(mem.rss),
    trend: computeTrend(samples),
    samples: samples.length
  }
}
