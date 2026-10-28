// Yardımcı fonksiyonlar
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(1)} ${units[i]}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR')
}

// --- Kalan süre (lisans geri sayımı) ---

const SANIYE_MS = 1000
const DAKIKA_MS = 60 * SANIYE_MS
const SAAT_MS = 60 * DAKIKA_MS
const GUN_MS = 24 * SAAT_MS
const AY_MS = 30 * GUN_MS // 1 ay ≈ 30 gün

export interface KalanSure {
  ay: number
  gun: number
  saat: number
  dakika: number
  saniye: number
}

// Kalan süreyi (ms) ay/gün/saat/dakika/saniye olarak parçalar.
export function kalanSureyiParca(ms: number): KalanSure {
  let kalan = Math.max(0, ms)
  const ay = Math.floor(kalan / AY_MS)
  kalan -= ay * AY_MS
  const gun = Math.floor(kalan / GUN_MS)
  kalan -= gun * GUN_MS
  const saat = Math.floor(kalan / SAAT_MS)
  kalan -= saat * SAAT_MS
  const dakika = Math.floor(kalan / DAKIKA_MS)
  kalan -= dakika * DAKIKA_MS
  const saniye = Math.floor(kalan / SANIYE_MS)
  return { ay, gun, saat, dakika, saniye }
}

// Kalan süreyi "X ay Y gün Z saat W dakika V saniye" biçiminde verir.
export function kalanSureyiFormatla(ms: number): string {
  const { ay, gun, saat, dakika, saniye } = kalanSureyiParca(ms)
  return `${ay} ay ${gun} gün ${saat} saat ${dakika} dakika ${saniye} saniye`
}
