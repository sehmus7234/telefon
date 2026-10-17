import { adbExecFull } from './exec'
import type { RootStatus, AdbRootResult } from '@shared/types'

// Kabuk komutu çalıştırır; hata olsa bile ham çıktıyı (trim) döndürür, asla fırlatmaz.
async function shellFull(serial: string, args: string[]): Promise<string> {
  try {
    const r = await adbExecFull(['shell', ...args], { serial })
    return (r.stdout || '').trim()
  } catch {
    return ''
  }
}

// Ham çıktılardan root durumunu kurar (saf fonksiyon; headless test edilebilir).
export function buildRootStatus(suId: string, suWhich: string, magisk: string): RootStatus {
  return {
    isRooted: /uid=0\s*\(root\)/i.test(suId),
    suPath: suWhich.split('\n')[0].trim() || null,
    magiskVersion: magisk.split('\n')[0].trim() || null
  }
}

// Cihazın root durumunu okur (yalnızca okuma; root YÜKLEMEZ).
export async function getRootStatus(serial: string): Promise<RootStatus> {
  const [suId, suWhich, magisk] = await Promise.all([
    shellFull(serial, ['su', '-c', 'id']),
    shellFull(serial, ['which', 'su']),
    shellFull(serial, ['magisk', '-v'])
  ])
  return buildRootStatus(suId, suWhich, magisk)
}

// adbd'yi root olarak yeniden başlatmayı DENER (yalnızca userdebug/eng build'lerde çalışır;
// production build'de "cannot run as root" döner). Kalıcı root kurulumu DEĞİLDİR.
export async function adbRoot(serial: string): Promise<AdbRootResult> {
  try {
    const r = await adbExecFull(['root'], { serial })
    return { ok: r.code === 0, output: (r.stdout || r.stderr || '').trim() }
  } catch (e) {
    return { ok: false, output: e instanceof Error ? e.message : String(e) }
  }
}

// adbd'yi normal (unroot) moda döndürür.
export async function adbUnroot(serial: string): Promise<AdbRootResult> {
  try {
    const r = await adbExecFull(['unroot'], { serial })
    return { ok: r.code === 0, output: (r.stdout || r.stderr || '').trim() }
  } catch (e) {
    return { ok: false, output: e instanceof Error ? e.message : String(e) }
  }
}
