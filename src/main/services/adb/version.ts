import { adbExec } from './exec'
import { parseVersion } from './parse'

// ADB sürümünü okur (prompt 28).
export async function getAdbVersion(): Promise<string> {
  const out = await adbExec(['version'])
  return parseVersion(out)
}
