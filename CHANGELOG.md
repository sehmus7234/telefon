# Changelog

Bu dosyadaki tüm önemli değişiklikler [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/)
biçiminde ve [SemVer](https://semver.org/lang/tr/) kurallarına göre kaydedilir.

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
