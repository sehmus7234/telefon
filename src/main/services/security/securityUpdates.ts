// Güvenlik güncelleme kontrolü (prompt 150).
// GitHub Security Advisories API'sinden (npm ekosistemi, `electron` paketi)
// mevcut Electron sürümünü etkileyen güvenlik bültenlerini çeker.
// Ağ bağımsız kısımlar (sürüm karşılaştırma + ayrıştırma) saf fonksiyondur.
import type { SecurityUpdateStatus } from '@shared/types'

const ADVISORIES_URL =
  'https://api.github.com/advisories?ecosystem=npm&affects=electron&per_page=100'

// Semver karşılaştırma: a < b ise true (yalnızca sayısal bölümler; ön sürüm yok sayılır).
export function semverLt(a: string, b: string): boolean {
  const pa = a.split('.').map((x) => Number.parseInt(x, 10) || 0)
  const pb = b.split('.').map((x) => Number.parseInt(x, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x !== y) return x < y
  }
  return false
}

interface AdvisoryVuln {
  package: { name?: string } | null
  first_patched_version: { identifier?: string } | null
}

interface Advisory {
  ghsa_id?: string
  summary?: string
  severity?: string
  vulnerabilities?: AdvisoryVuln[]
}

// JSON bülten listesinden, mevcut Electron sürümünü etkileyenleri ayıklar.
export function parseAdvisories(json: unknown, currentElectronVersion: string): string[] {
  if (!Array.isArray(json)) return []
  const affected: string[] = []
  for (const item of json as Advisory[]) {
    const vulns = item.vulnerabilities ?? []
    const electronVuln = vulns.find((v) => v?.package?.name === 'electron')
    const patched = electronVuln?.first_patched_version?.identifier
    if (!patched) continue
    if (semverLt(currentElectronVersion, patched)) {
      affected.push(
        `${item.ghsa_id ?? '?'} (${item.severity ?? 'bilinmiyor'}): ${item.summary ?? 'açıklama yok'} — düzeltildi: ${patched}`
      )
    }
  }
  return affected
}

// Bültenleri getirir; test için fetchFn enjekte edilebilir.
export async function fetchSecurityAdvisories(
  fetchFn: typeof fetch = fetch
): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetchFn(ADVISORIES_URL, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'telefon-app' },
      signal: controller.signal
    })
    if (!res.ok) throw new Error(`Advisory API HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export interface CheckSecurityUpdatesOptions {
  currentVersion: string
  electronVersion: string
  fetchFn?: typeof fetch
}

// Ana giriş noktası: bültenleri çeker, etkilenenleri derler, durum döndürür.
export async function checkSecurityUpdates(
  opts: CheckSecurityUpdatesOptions
): Promise<SecurityUpdateStatus> {
  try {
    const json = await fetchSecurityAdvisories(opts.fetchFn)
    const advisories = parseAdvisories(json, opts.electronVersion)
    return {
      checked: true,
      checkedAt: new Date().toISOString(),
      currentVersion: opts.currentVersion,
      electronVersion: opts.electronVersion,
      hasSecurityUpdates: advisories.length > 0,
      advisories
    }
  } catch (e) {
    return {
      checked: false,
      checkedAt: new Date().toISOString(),
      currentVersion: opts.currentVersion,
      electronVersion: opts.electronVersion,
      hasSecurityUpdates: false,
      advisories: [],
      error: e instanceof Error ? e.message : String(e)
    }
  }
}
