// ADB hatalarını kullanıcı dostu Türkçe mesajlara çevirir (prompt 152).
// Saf fonksiyon — headless test edilebilir.

interface Rule {
  pattern: RegExp
  message: string
}

const RULES: Rule[] = [
  { pattern: /device (not found|offline)|no devices\/emulators found/i, message: 'Cihaz bulunamadı veya bağlı değil.' },
  { pattern: /more than one device\/emulator/i, message: 'Birden fazla cihaz bağlı; önce bir cihaz seçin.' },
  { pattern: /unauthorized/i, message: 'Cihaz yetkili değil — telefonda "USB hata ayıklamaya izin ver" onayını verin.' },
  { pattern: /offline/i, message: 'Cihaz çevrimdışı; kabloyu kontrol edin ve tekrar bağlanın.' },
  { pattern: /permission denied/i, message: 'İzin reddedildi (yetersiz yetki).' },
  { pattern: /operation not permitted/i, message: 'İşlem için izin yok.' },
  { pattern: /connection (timed out|refused)|timed out/i, message: 'Bağlantı kurulamadı veya zaman aşımına uğradı.' },
  { pattern: /cannot connect to daemon|daemon not running|failed to connect to daemon/i, message: 'ADB sunucusuna bağlanılamadı; sunucuyu yeniden başlatın.' },
  { pattern: /adb server (is out of date|version)/i, message: 'ADB sunucusu güncel değil; yeniden başlatın.' },
  { pattern: /adb bulunamadı/i, message: 'ADB kurulu değil. Android SDK platform-tools yükleyin.' },
  { pattern: /adb yolu geçersiz/i, message: 'ADB yolu geçersiz; ayarlardan doğru yolu belirleyin.' },
  { pattern: /zaman aşımına uğradı/i, message: 'Komut zaman aşımına uğradı (cihaz yanıt vermiyor).' },
  { pattern: /iptal edildi/i, message: 'Komut iptal edildi.' },
  { pattern: /hata kodu (\d+)/i, message: 'Komut hata ile tamamlandı.' },
  { pattern: /does not exist|no such file/i, message: 'Dosya veya klasör bulunamadı.' },
  { pattern: /read-only file system/i, message: 'Dosya sistemi salt-okunur; yazma izni yok.' },
  { pattern: /insufficient permissions/i, message: 'Yetersiz izin (root gerekli olabilir).' }
]

// Ham hata metnini kullanıcı dostu mesaja çevirir; tanınmayanlar aynen kalır.
export function humanizeAdbError(message: string): string {
  if (!message) return 'Bilinmeyen ADB hatası.'
  const trimmed = message.trim()
  for (const rule of RULES) {
    if (rule.pattern.test(trimmed)) return rule.message
  }
  return trimmed
}

// Error nesnesini (message + stderr birleşimi) dost mesaja çevirir.
export function humanizeError(err: unknown): string {
  if (err instanceof Error) return humanizeAdbError(err.message)
  return humanizeAdbError(String(err))
}
