import { spawn } from 'child_process'
import { findAdbPath } from './paths'
import { adbQueue } from './queue'
import { record } from './history'

export const DEFAULT_TIMEOUT_MS = 30_000

export interface AdbExecOptions {
  serial?: string // -s <serial> (prompt 25)
  timeoutMs?: number
  signal?: AbortSignal
  onStderr?: (chunk: string) => void
}

export interface AdbExecResult {
  stdout: string
  stderr: string
  code: number | null
  timedOut: boolean
  aborted: boolean
}

// Düşük seviye spawn sarmalayıcısı (prompt 16): timeout (26), abort (34), stderr (32).
function runSpawn(args: string[], options: AdbExecOptions = {}): Promise<AdbExecResult> {
  const adbPath = findAdbPath()
  if (!adbPath) {
    return Promise.reject(
      new Error(
        'adb bulunamadı. Android SDK platform-tools kurun ve PATH\'e ekleyin ya da ADB_PATH tanımlayın.'
      )
    )
  }

  const fullArgs = options.serial ? ['-s', options.serial, ...args] : args
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return new Promise<AdbExecResult>((resolve, reject) => {
    const child = spawn(adbPath, fullArgs, { windowsHide: true })

    let stdout = ''
    let stderr = ''
    let timedOut = false
    let aborted = false
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const signal = options.signal

    function cleanup(): void {
      if (timer) clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }

    function settle(): void {
      if (settled) return
      settled = true
      cleanup()
      resolve({ stdout, stderr, code: child.exitCode ?? null, timedOut, aborted })
    }

    function onAbort(): void {
      aborted = true
      child.kill('SIGKILL')
    }

    timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    if (signal) {
      if (signal.aborted) onAbort()
      else signal.addEventListener('abort', onAbort, { once: true })
    }

    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()))
    child.stderr.on('data', (d: Buffer) => {
      const s = d.toString()
      stderr += s
      options.onStderr?.(s)
    })

    child.on('error', (err) => {
      if (settled) return
      settled = true
      cleanup()
      const e = err as NodeJS.ErrnoException
      reject(e.code === 'ENOENT' ? new Error(`adb yolu geçersiz: ${adbPath}`) : err)
    })

    child.on('close', settle)
  })
}

// Komutu kuyruktan geçirir ve geçmişe kaydeder (prompt 27 + 35).
function execute(args: string[], options: AdbExecOptions = {}): Promise<AdbExecResult> {
  return adbQueue.run(async () => {
    const started = Date.now()
    const result = await runSpawn(args, options)
    record({
      command: ['adb', ...(options.serial ? ['-s', options.serial] : []), ...args].join(' '),
      timestamp: new Date().toISOString(),
      code: result.code,
      durationMs: Date.now() - started,
      timedOut: result.timedOut,
      aborted: result.aborted
    })
    return result
  })
}

// Promise tabanlı wrapper: adbExec(args) => Promise<string> (prompt 20).
export function adbExec(args: string[], options: AdbExecOptions = {}): Promise<string> {
  return execute(args, options).then((r) => {
    if (r.timedOut) throw new Error(`adb komutu zaman aşımına uğradı (${args[0]}).`)
    if (r.aborted) throw new Error(`adb komutu iptal edildi (${args[0]}).`)
    if (r.code !== 0 && r.code !== null) {
      throw new Error(`adb komutu hata kodu ${r.code} döndürdü (${args[0]}): ${r.stderr.trim()}`)
    }
    return r.stdout
  })
}

// stdout + stderr'i birlikte döndürür (prompt 32).
export function adbExecFull(args: string[], options: AdbExecOptions = {}): Promise<AdbExecResult> {
  return execute(args, options)
}

// İptal edilebilir komutlar (prompt 34).
const activeRuns = new Map<string, AbortController>()

export function runAbortable(
  args: string[],
  options: AdbExecOptions = {}
): { id: string; promise: Promise<AdbExecResult> } {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const controller = new AbortController()
  activeRuns.set(id, controller)
  const promise = execute(args, { ...options, signal: controller.signal }).finally(() => {
    activeRuns.delete(id)
  })
  return { id, promise }
}

export function cancelRun(id: string): boolean {
  const controller = activeRuns.get(id)
  if (!controller) return false
  controller.abort()
  return true
}
