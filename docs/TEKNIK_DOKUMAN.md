# Teknik Dokümantasyon — Telefon (prompt 178)

Okul projesi raporu için hazırlanmış teknik özet.

## 1. Proje Tanımı

**Telefon**, Android cihazları bir masaüstü uygulaması üzerinden yönetmek ve
yedeklemek için geliştirilmiş bir Electron uygulamasıdır. USB (ADB) ile bağlanan
cihazları algılar; donanım bilgisi toplar, fotoğraf/kişi/SMS/uygulama yedekler,
dosya aktarır, 12 donanım testi çalıştırır ve scrcpy ile ekran yansıtır.

## 2. Teknoloji Yığını

| Katman             | Teknoloji                                           |
| ------------------ | --------------------------------------------------- |
| Masaüstü çerçevesi | Electron 33 (main + preload + renderer)             |
| Arayüz             | React 18 + TypeScript + TailwindCSS 3               |
| Durum yönetimi     | Zustand                                             |
| Derleme            | electron-vite (esbuild + Vite)                      |
| Veritabanı         | better-sqlite3 (WAL, migration'lı)                  |
| Log                | electron-log (dosyaya)                              |
| Güncelleme         | electron-updater + electron-builder                 |
| Test               | Jest + ts-jest + React Testing Library + Playwright |
| Kalite             | ESLint 9 + Prettier + Husky/lint-staged             |

## 3. Mimari

Üç süreç modeli (Electron standardı):

- **Main (`src/main/`)** — Node yetkisi: ADB servisleri, SQLite, yedekleme motoru,
  güvenlik, hata yönetimi. `ipcMain.handle` ile renderer isteklerine yanıt verir.
- **Preload (`src/preload/`)** — `contextBridge` ile güvenli köprü; renderer'a
  yalnızca beyaz listeli `window.api` açılır.
- **Renderer (`src/renderer/src/`)** — React arayüzü; `nodeIntegration: false`,
  `contextIsolation: true`.

### Ana Modüller

- `services/adb/` — binary bulma, spawn sarmalayıcı (timeout/abort), komut kuyruğu,
  çıktı ayrıştırma, cihaz algılama (polling + diff).
- `services/backup/` — aşamalı yedekleme (foto/kişi/SMS/uygulama), zip, tahmin,
  iptal, rapor, restore.
- `services/security/` — AES-256-GCM şifreleme, ADB RSA anahtar/fingerprint,
  tehlikeli komut sınıflandırma, log maskeleme, oturum kilidi.
- `services/errors/` — ErrorBoundary köprüsü, ADB hata çevirisi, retry, kalıcı
  hata logu, çökme raporu, heap sızıntı analizi, performans metrikleri.
- `services/files/` — dosya tarayıcı (listele/pull/push/sil/mkdir, thumbnail).
- `services/tests/` — 12 donanım testi + PDF rapor.

## 4. Veri Modeli

SQLite tabloları (migration'lı `schema_migrations`): `devices`, `backups`,
`settings`, `secure_settings` (şifreli), `logs`, `accounts`, `sessions`,
`verification_tokens`. Hassas değerler diske yazılmadan önce master key ile
AES-256-GCM şifrelenir (`secretStore`).

## 5. Güvenlik Modeli

- IPC whitelist + `contextIsolation` (renderer'a ham `ipcRenderer` açılmaz).
- Hassas veri (IMEI/MAC/seri/token/parola) loglanmadan önce maskelenir.
- Tehlikeli ADB komutları (`rm`, `pm uninstall`, `reboot`, sistem bölümüne push …)
  çalıştırılmadan önce kullanıcı onayı ister.
- Yedek dosyalar için isteğe bağlı şifreleme; uygulama ayarları şifreli saklanır.
- Dış bağlantılar `shell.openExternal` ile, Electron içinde yeni pencere açılmadan.

## 6. Test ve Kalite

- **Birim/servis:** Jest (node ortamı) — ADB parse/exec, hata çevirisi, maskeleme,
  tehlikeli komut sınıflandırma. ADB servisleri sahte `adb` ikilisiyle headless test
  edilir (`tests/fixtures/fake-adb.sh`).
- **Bileşen:** React Testing Library (jsdom) — ProgressBar, EmptyState,
  DeviceStatusBadge, DataTable.
- **E2E:** Playwright `_electron` — uygulama başlar, ana pencere açılır.
- **Kapılar:** `npm run typecheck` (strict), `npm test` (60 test), `npm run lint`,
  `npm run build`.

## 7. Paketleme ve Dağıtım

electron-builder: Windows `.exe` (NSIS), macOS `.dmg`/`.zip`, Linux `.AppImage`/`.deb`.
Otomatik güncelleme GitHub Releases üzerinden (`electron-updater`). Ayrıntılar:
`docs/RELEASE.md`, `docs/AUTO_UPDATE.md`, `docs/CODE_SIGNING.md`.

## 8. Kurulum

```bash
npm install
npm run rebuild:native   # better-sqlite3 (native modül) Electron'a derlenir
npm run dev              # geliştirme
```

## 9. Sınırlamalar

- `adb backup` Android 12+ üzerinde kaldırıldı; uygulama yedeği modern cihazlarda
  aşama hatası olarak raporlanır.
- IMEI, Android 10+ üzerinde yetkisiz erişimde boş döner (best-effort).
- macOS/Windows kurulumcuları yalnızca ilgili işletim sisteminde (veya CI'da)
  üretilebilir.
