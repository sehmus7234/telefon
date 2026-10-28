# Changelog

Bu dosyadaki tüm önemli değişiklikler [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/)
biçiminde ve [SemVer](https://semver.org/lang/tr/) kurallarına göre kaydedilir.

## [0.2.1] - 2026-10-28

### Eklenenler

- Saat geri alma koruması: son açılış zamanı izlenir; sistem saati 1 günden fazla geriye
  alınırsa lisans şüpheli sayılır ve uygulama kilitlenir (clock-tampered).
- Lisans kalan süresi canlı geri sayım: Ayarlar -> Lisans'ta ay/gün/saat/dakika/saniye
  olarak her saniye güncellenir.

### Değişenler

- Lisans süresi 183 günden 180 güne (tam 6 ay) sabitlendi.

## [0.2.0] - 2026-10-28

### Eklenenler

- Lisans (serial) sistemi: çevrimdışı, HMAC imzalı kısa serial (~32 karakter). Süre 183 gün
  (6 ay), ilk aktivasyonda başlar ve makine kimliğine bağlanır; süre dolunca uygulama tamamen
  kilitlenir, yeni serial girilmeden açılmaz. Aktivasyon ekranı (`LicenseGate`), Ayarlar'da
  lisans bilgisi (kalan gün/bitiş), `scripts/generate-license.mjs` serial üretici, `license`
  DB tablosu (migration v3), `tests/unit/license.test.ts`.

## [0.1.4] - 2026-10-17

### Eklenenler

- Çift SIM desteği: IMEI okuma artık IMEI1 + IMEI2'yi birlikte döndürür; IMEI sayfasında
  her ikisi ayrı ayrı gösterilir (Luhn doğrulaması + kopyalama ile).

## [0.1.3] - 2026-10-17

### Eklenenler

- Windows taşınabilir (portable) ZIP paketi: kurulum gerektirmeden çıkar-çalıştır.

## [0.1.2] - 2026-10-17

### Eklenenler

- "Telefon IMEI" sayfası: bağlı cihazın IMEI'sini gösterir (kopyala/yenile) + elle girilen
  IMEI'nin biçim ve Luhn checksum doğrulaması (`utils/imei.ts`).
- "Root" sayfası: cihazın root durumunu okur (su yolu, Magisk sürümü) ve `adb root`/`adb unroot`
  denemesi yapar; kalıcı root YÜKLEME yapılmaz (Magisk rehberi gösterilir).
- IMEI okuma genişletildi: `dumpsys iphonesubinfo` boşsa tüm `getprop` çıktısı "imei"
  anahtarları için taranır (imei1/imei2 + vendor anahtarları).

## [Yayınlanmadı]

### Eklenenler

- Test + kod kalitesi altyapısı: Jest/ts-jest (60 test), ADB mock'ları, RTL bileşen
  testleri, Playwright Electron E2E, coverage raporu (prompt 161-165).
- GitHub Actions CI (`ci.yml`) + ESLint 9 flat + Prettier + Husky/lint-staged (166-168).
- TypeScript ek strict bayrakları (`noImplicitOverride` vb.) (169).
- Kod inceleme listesi (`docs/CODE_REVIEW_CHECKLIST.md`) (170).
- Windows NSIS / macOS dmg / Linux AppImage+deb paketleme yapılandırması (171-172).
- `rebuild:native` scripti; better-sqlite3 v11'e indirildi (Electron 33 uyumluluğu).
- MIT lisansı, CONTRIBUTING, yayın ve dokümantasyon seti (173-180).

### Değişenler

- better-sqlite3 ^13.0.3 → ^11.10.0 (Electron 33'te SIGSEGV'yi giderir).

## [0.1.1] - 2026-10-17

### Eklenenler

- Windows paketine ADB (platform-tools 37.0.1) gömüldü: `adb.exe` + AdbWin
  DLL'leri `resources/platform-tools` altına eklendi; kurulumdan sonra ayrıca
  platform-tools kurmaya gerek kalmaz.
- Ayarlar → "ADB yolu" alanı artık gerçekten çalışıyor: değer DB'ye kaydedilir,
  main süreçte aktif ADB yolu olarak kullanılır (tam dosya yolu ya da klasör).

### Düzeltilenler

- "ADB yolu" ayarı yalnızca localStorage'a yazılıyor, main süreç hiç okumuyordu;
  cihaz algılanamıyordu. Artık `adb:set-path`/`adb:get-path` IPC kanalları ve
  `setConfiguredAdbPath` üzerinden bağlı.

## [0.1.0] - 2026-10-16

### Eklenenler

- İlk sürüm: 160 promptluk cihaz yönetimi + yedekleme özellik seti (cihaz algılama,
  bilgi, ADB servisleri, yedekleme motoru, cihaz testleri, dosya tarayıcı, güvenlik
  katmanı, hata yönetimi/teşhis).
