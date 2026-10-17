// IMEI yardımcıları: biçim normalleştirme + Luhn checksum doğrulama.
// Salt okuma/doğrulama amaçlıdır; IMEI değiştirme yapılmaz.

// Boşluk ve tireleri kaldırır (örn. "35-123456-789012-3" -> "351234567890123").
export function normalizeImei(input: string): string {
  return input.replace(/[\s-]/g, '')
}

// Luhn algoritması ile 15 haneli IMEI'nin checksum'unu doğrular.
// IMEI: TAC (8) + seri (6) + kontrol basamağı (1); son basamak Luhn toplamını 10'a tamamlar.
export function isValidImei(input: string): boolean {
  const imei = normalizeImei(input)
  if (!/^\d{15}$/.test(imei)) return false

  // Tamamı sıfır olan IMEI "null/placeholder" değeridir; Luhn'dan geçse de geçersizdir.
  if (/^0{15}$/.test(imei)) return false

  let sum = 0
  let cift = false // sağdan başlayarak her ikinci basamak ikiye katlanır
  for (let i = imei.length - 1; i >= 0; i--) {
    let d = imei.charCodeAt(i) - 48
    if (cift) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    cift = !cift
  }
  return sum % 10 === 0
}
