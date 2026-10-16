import { adbExec } from '../adb'
import type { TestReport, TestResult } from '@shared/types'
import { TEST_DEFINITIONS } from './definitions'

// Tüm testleri sırayla çalıştırır ve rapor üretir (prompt 126/127).
export async function runTests(serial: string): Promise<TestReport> {
  const results: TestResult[] = []

  for (const def of TEST_DEFINITIONS) {
    const started = Date.now()
    try {
      const out = await adbExec(def.args, { serial })
      const pass = def.check ? def.check(out) : out.trim().length > 0
      results.push({
        id: def.id,
        name: def.name,
        status: pass ? 'pass' : 'fail',
        output: out.trim().slice(0, 400),
        durationMs: Date.now() - started,
        detail: def.summary ? def.summary(out) : def.description
      })
    } catch (e) {
      results.push({
        id: def.id,
        name: def.name,
        status: 'error',
        output: '',
        durationMs: Date.now() - started,
        detail: e instanceof Error ? e.message : String(e)
      })
    }
  }

  const passed = results.filter((r) => r.status === 'pass').length
  return {
    deviceSerial: serial,
    createdAt: new Date().toISOString(),
    total: results.length,
    passed,
    failed: results.length - passed,
    results
  }
}
