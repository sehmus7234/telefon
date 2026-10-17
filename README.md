# Telefon — Electron + React + TypeScript Masaüstü Uygulaması

Cihaz yönetimi ve yedekleme için masaüstü uygulama iskeleti. 15 promptun tamamı
bu projeye işlendi.

## Teknoloji Yığını

- Electron (main + preload + renderer)
- React 18 + TypeScript
- Vite tabanlı derleme: `electron-vite` (main/preload/renderer'ı ayrı ayrı paketler)
- TailwindCSS 3 (dark mode: `class`)
- Zustand (global state)
- electron-log (dosyaya loglama)
- electron-updater + electron-builder (otomatik güncelleme)

## Kurulum (prompt 2)

```bash
cd /root/telefon
npm install        # bağımlılıklar + Electron ikili dosyası
npm run dev        # geliştirme (hot reload)
npm run build      # üretim derlemesi (out/)
npm run typecheck  # main + renderer tip kontrolü
npm run preview    # derlenmiş uygulamayı çalıştır
npm run pack       # paketlenmemiş klasör çıktısı (release/)
npm run dist       # kurulabilir paket (electron-builder)
```

## Klasör Yapısı (prompt 1 + 5)

```
telefon/
├── package.json
├── electron.vite.config.ts   # main/preload/renderer derleme ayarları
├── tsconfig.json             # çözüm kökü (node + web referansları)
├── tsconfig.node.json        # main + preload tip ayarları
├── tsconfig.web.json         # renderer tip ayarları
├── tailwind.config.js
├── postcss.config.js
├── electron-builder.yml      # paketleme + publish (otomatik güncelleme)
└── src/
    ├── main/                 # MAIN PROCESS (Node yetkisi)
    │   ├── index.ts          # pencere, tek örnek kilidi, açılış sırası
    │   ├── splash.ts         # splash screen
    │   ├── ipc.ts            # ipcMain.handle tanımları
    │   ├── logger.ts         # electron-log kurulumu
    │   └── updater.ts        # autoUpdater
    ├── preload/              # PRELOAD (güvenli köprü)
    │   ├── index.ts          # contextBridge ile window.api
    │   └── index.d.ts        # window.api tip bildirimi
    ├── shared/
    │   └── types/index.ts    # ortak tipler (Device, BackupFile, ...)
    └── renderer/             # RENDERER PROCESS (React UI)
        ├── index.html        # ana pencere
        ├── splash.html       # splash screen (statik)
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── index.css     # tailwind direktifleri
            ├── components/   # yeniden kullanılabilir UI (DeviceList)
            ├── services/     # IPC çağrılarını saran servisler (deviceService)
            ├── hooks/        # özel hook'lar (useTheme)
            ├── store/        # zustand store'ları (useDeviceStore, useThemeStore)
            ├── utils/        # saf yardımcılar (formatBytes)
            └── types/        # shared tiplerin yeniden dışa aktarımı
```

Klasörler ne işe yarar (prompt 5):

- `components` — sunum bileşenleri; state bilmez, props/store ile beslenir.
- `services` — dış dünyayla konuşan katman (IPC, ileride HTTP/dosya). Bileşenler
  doğrudan `window.api` çağırmak yerine servis kullanır, böylece test edilebilir.
- `hooks` — React mantığını paylaşan custom hook'lar (tema, cihaz dinleme).
- `store` — zustand ile global state; bileşenler arası paylaşılan durum.
- `utils` — saf fonksiyonlar (formatlama, hesaplama), yan etkisiz.
- `types` — tip tanımları; bu projede kanonik tipler `src/shared/types` altında
  tutulur çünkü main ve renderer aynı tipleri kullanır (prompt 15).

## Mimari ve IPC İletişimi (prompt 3)

Electron üç izole süreçten oluşur:

1. **Main process** (Node.js): pencere yönetimi, dosya sistemi, ağ, otomatik
   güncelleme. Tam Node yetkisine sahiptir; UI çizemez.
2. **Renderer process** (Chromium): React arayüzü. Güvenlik için Node erişimi
   kapalıdır (`nodeIntegration: false`).
3. **Preload script**: ikisi arasındaki köprü. Renderer'dan önce yüklenir, sınırlı
   Node yetkisi vardır ve `contextBridge.exposeInMainWorld` ile renderer'a güvenli
   bir `window.api` nesnesi açar.

İletişim akışı (renderer -> main):

```
React bileşeni
  -> window.api.listDevices()                 (preload'un açtığı API)
  -> ipcRenderer.invoke('devices:list')       (preload)
  -> ipcMain.handle('devices:list', ...)      (main)
  -> sonuç Promise olarak geri döner
```

Main -> renderer (olay akışı, örn. güncelleme ilerlemesi):

```
main:  window.webContents.send('updater:progress', p)
preload: ipcRenderer.on('updater:progress', cb)  -> callback'i renderer'a iletir
renderer: callback ile state günceller
```

Kural: renderer'a asla ham `ipcRenderer` verilmez. Preload yalnızca ihtiyaç duyulan,
beyaz listeye alınmış metodları açar.

## Güvenlik Modeli (prompt 4)

Ana pencerede ve splash'ta:

- `contextIsolation: true` — preload ile renderer ayrı JS bağlamlarında çalışır.
- `nodeIntegration: false` — renderer'da `require`/Node yok.
- `sandbox: false` — electron-vite preload'u CJS paketlediği için gerekli (yoksa
  preload çalışmaz). Renderer hâlâ contextIsolation ile izole.
- Renderer'da CSP meta etiketi (`script-src 'self'`).
- `setWindowOpenHandler` dış bağlantıları sistem tarayıcısına yönlendirir.

## TailwindCSS Entegrasyonu (prompt 7) — Adım Adım

1. `npm install -D tailwindcss postcss autoprefixer` (package.json'a eklendi).
2. `tailwind.config.js` oluştur; `content` alanına HTML/TSX dosyalarını yaz:
   `['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}']`.
3. `darkMode: 'class'` yap (tema desteği için).
4. `postcss.config.js` oluştur: `tailwindcss` + `autoprefixer` plugin'leri.
5. Renderer CSS dosyasına direktifleri ekle (`src/renderer/src/index.css`):
   `@tailwind base; @tailwind components; @tailwind utilities;`.
6. Bu CSS'i React girişinde import et (`main.tsx` -> `import './index.css'`).
7. Vite `postcss.config.js`'i otomatik algılar; ekstra yapılandırma gerekmez.
   `electron.vite.config.ts` içinde renderer'a özel bir şey eklemek gerekmiyor.

## Zustand Store (prompt 8)

`src/renderer/src/store/useDeviceStore.ts` dört durumu tutar:

- `cihazlar: Device[]`
- `seciliCihaz: Device | null`
- `yukleniyor: boolean`
- `hata: string | null`

`listele()` IPC'den cihazları çeker, `yukleniyor` ve `hata` durumlarını yönetir.
Bileşenler seçici (selector) ile abone olur: `useDeviceStore((s) => s.cihazlar)`.

## Otomatik Güncelleme (prompt 9)

1. `electron-updater` bağımlılık olarak eklendi; `src/main/updater.ts` olayları
   dinler (`checking-for-update`, `update-available`, `download-progress`,
   `update-downloaded`).
2. `electron-builder.yml` içindeki `publish` bloğu yayın kaynağını belirler
   (örnek: GitHub Releases). `owner` ve `repo` kendi değerlerinle değiştir.
3. `npm run dist` ile paketleyip sürümü GitHub Releases'a yükle. Uygulama
   `app-update.yml` üzerinden yeni sürümü bulur.
4. Geliştirme modunda updater otomatik devre dışı (`app.isPackaged` kontrolü).

## Loglama (prompt 10)

`src/main/logger.ts` electron-log kullanır:

- Dosya: `userData/logs/main.log` (5 MB döngü).
- Konsol + dosya seviyeleri ayrı ayarlanır.
- `log.errorHandler.startCatching()` yakalanmamış hataları da loglar.
- Renderer için gerekirse `import log from 'electron-log/renderer'` kullanılır.

## Pencere (prompt 11)

`src/main/index.ts` -> `createMainWindow()`: `width: 1200, height: 800`,
`minWidth: 900, minHeight: 600`, `show: false` (ready-to-show'ta gösterilir).

## Splash Screen (prompt 12)

`src/main/splash.ts` frameless, resizable olmayan 420x280 bir pencere açar;
ana pencere `ready-to-show` olduğunda `closeSplashWindow()` ile kapatılır.
Güvenlik için 15 sn'lik bir zaman aşımı fallback'i var.

## Tek Örnek Kilidi (prompt 13)

`app.requestSingleInstanceLock()` false dönerse uygulama kapanır; ikinci açılış
denemesi `second-instance` olayıyla mevcut pencereyi öne getirir.

## Tema (prompt 14)

- `useThemeStore` `mod` (system/light/dark) ve çözümlenen `tema` tutar.
- `hooks/useTheme.ts` `prefers-color-scheme` medya sorgusunu dinler, sistem teması
  değişince otomatik günceller.
- `document.documentElement.classList.toggle('dark', ...)` ile Tailwind'in
  `dark:` sınıfları etkinleşir.

## Tip Tanımları (prompt 15)

`src/shared/types/index.ts`: `Device`, `DeviceInfo`, `DevicePlatform`,
`DeviceStatus`, `BackupFile`, `BackupStatus`, `ThemeMode`, `AppSettings`.
Main ve renderer aynı tanımları `@shared/types` alias'ıyla kullanır.

## ADB Servisi (src/main/services/adb/)

Saf Node (electron bağımsız, test edilebilir) modüler ADB katmanı. Dosyalar:

- `paths.ts` — adb binary'sini platforma göre bulur (prompt 17/33); `isAdbInstalled`.
- `exec.ts` — `child_process.spawn` tabanlı sarmalayıcı (prompt 16); `adbExec(args)`
  => Promise<string> (prompt 20), `-s <serial>` (25), 30 sn timeout (26), abort (34),
  stderr yakalama (32).
- `queue.ts` — aynı anda tek komut çalıştıran kuyruk (prompt 35).
- `history.ts` — son 50 komut (prompt 27).
- `parse.ts` — satır ayırma + cihaz çıktısı + sürüm ayrıştırma (prompt 21).
- `server.ts` — start-server / kill-server / yeniden başlat (prompt 19/29).
- `devices.ts` — `adb devices -l` (22), durum kontrolü device/unauthorized/offline
  (23/24), kablosuz tcpip + connect + disconnect (31).
- `version.ts` — `adb version` (28).
- `backup.ts` — `getDeviceInfo` + `createBackup` (adb pull + boyut + sha256 manifest).

Main süreç `poller.ts` 2 saniyede bir cihaz listesini yeniler (prompt 30); renderer
`devices:changed` olayıyla otomatik güncellenir. adb kurulu değilse `devices:error`
ile arayüzde uyarı gösterilir (prompt 17). Yetkisiz cihazlarda "Telefondan izin
verin" uyarısı gösterilir (prompt 24). ADB binary'sini uygulama içine paketlemek
için `resources/platform-tools/` klasörüne koy (prompt 18).

Yedekler `userData/backups/<cihaz>-<zaman>/` altına yazılır.

## Cihaz Algılama (prompt 36-50)

- **USB otomatik algılama (36):** İki katman. Güvenilir olanı `poller.ts` — 2 saniyede
  bir `adb devices` çeker, `diffDevices` ile bağlanan/çıkan cihazları bulur. İsteğe
  bağlı `usbWatcher.ts` node-usb (`usb.on('attach'/'detach')`) ile USB tak/çıkarmayı
  anında yakalayıp taramayı tetikler; kurulu değilse sessizce devre dışı kalır.
  node-usb native modüldür: `npm i usb && npx electron-rebuild -f -w usb` gerekir;
  electron-builder için `npmRebuild: false` + `buildDependenciesFromSource: true`.
- **Bildirim (37/38):** Cihaz bağlanınca/çıkarılınca main `device:connected` /
  `device:removed` gönderir; renderer toast gösterir (`useToastStore` + `Toasts`).
- **Dropdown (39):** Birden fazla cihazda `DeviceSelect` seçim kutusu gösterilir.
- **Benzersiz kimlik (40):** Cihazlar `serialNumber` ile eşleştirilir; aynı cihaz
  tekrar bağlanınca liste tekrarlanmaz.
- **Hook (41/42):** `useAdbBridge` main olaylarını store'a bağlar; cihaz listesi
  `useDeviceStore` içinde, güncellemeler otomatik yansır.
- **Rozet (43):** `DeviceStatusBadge` — yeşil bağlı, sarı yetkisiz, kırmızı çevrimdışı.
- **Spinner (44):** İlk taramada ve manuel yenilemede yükleme göstergesi.
- **Hata (45):** `devices:error` ile anlamlı Türkçe hata (banner + toast).
- **Bağlantı türü (46):** `detectConnectionType` serial formatına göre USB/Wi-Fi
  ayırır; cihaz kartında gösterilir.
- **Yenileme (47):** "Yenile" butonu `devices:refresh` ile anında tarama tetikler.
- **Event emitter (48):** `webContents.send` kanalları: `devices:changed`,
  `device:connected`, `device:removed`, `device:info`, `devices:error`.
- **Otomatik bilgi (49):** Yeni cihaz bağlanınca `getDeviceInfo` çekilir ve
  `device:info` ile gönderilir (Android sürümü/üretici).
- **Kalıcılık (50):** Cihaz listesi `localStorage`'a yazılır; uygulama yeniden
  açılınca son cihazlar gösterilir (ilk tarama gerçek listeyi getirir).

## Cihaz Bilgisi (prompt 51-70)

`src/main/services/adb/deviceInfo.ts` içindeki `getDeviceInfo(serial)` tüm cihaz
bilgilerini tek bir JSON objesinde toplar (prompt 70):

- model (51), üretici (52), Android sürümü (53), API seviyesi (54), seri no (55)
- IMEI (56) — `dumpsys iphonesubinfo`, yalnızca okuma; boşsa tüm `getprop` çıktısı
  "imei" anahtarları (gsm.imei, persist.radio.imei1/2, ro.ril.oem.imei vb.) için taranır;
  çift SIM'de IMEI1/IMEI2 birlikte döner. Android 10+ root'suz cihazlarda genelde boş döner
- pil: seviye (57), sağlık + sıcaklık (58) — arayüzde gösterilir
- ekran çözünürlüğü (59) + DPI (60)
- CPU (61), RAM (62), depolama (63) — `/proc/cpuinfo`, `/proc/meminfo`, `df /data`
- root kontrolü (64) — `su -c id`; `uid=0(root)` ise root'lu
- paketler: sistem (66) + üçüncü parti (67) — `pm list packages -s/-3`
- MAC adresi (68), dil/bölge (69) — `persist.sys.locale`

Her komut ayrı ayrı parse edilir; biri başarısız olursa ilgili alan `null`/boş
kalır, diğer alanları etkilemez. Bilgiler `device:info` olayıyla renderer'a gelir
ve cihaz kartında gösterilir (pil, ekran, CPU, RAM, depolama, seri, IMEI, root).

## Arayüz / Tasarım Sistemi (prompt 71-95)

- **Layout (71):** `components/layout/Sidebar` (sol menü) + `Header` (üst) + orta içerik.
  Sayfa yönlendirmesi `useNavStore` ile (react-router gerekmez).
- **Menü (72):** Dashboard, Cihazlar, Telefon IMEI, Root, Yedekleme, Testler, Dosyalar,
  Ayarlar (SVG ikonlu).
- **Palet (73):** Tailwind'de `brand` (mavi-mor) skalası; koyu tema ağırlıklı — yüzey
  `surface` (#171923), arka plan #0f1117, accent gradyan brand->violet.
- **Cihaz kartı (74/75):** `devices/DeviceCard` — ad, model, durum rozeti, pil ikonu;
  Framer Motion ile hover scale + glow shadow.
- **Dashboard (76):** bağlı cihaz, son yedekleme, toplam depolama, çevrimiçi oran kartları.
- **Cihaz detay (77/78):** `DeviceDetailView` sekmeli (Genel/Uygulamalar/Dosyalar/Testler);
  `AnimatePresence` + `layoutId` ile smooth sekme geçişi.
- **Telefon IMEI sayfası:** `views/ImeiView` — bağlı cihazların IMEI'lerini kart olarak
  gösterir (çift SIM'de IMEI1/IMEI2 ayrı; Kopyala + Yenile); cihaz bağlanınca veya uygulama
  açılışında bilgi otomatik çekilir. Okunan ve elle girilen IMEI'nin biçim + Luhn checksum
  doğrulaması yapılır (`utils/imei.ts`).
- **Root sayfası:** `views/RootView` — cihazın root durumunu okur (su yolu, Magisk sürümü) ve
  `adb root`/`adb unroot` denemesi yapar (yalnızca userdebug/eng build'lerde çalışır).
  Kalıcı root YÜKLEME yapılmaz; Magisk ile manuel root rehberi gösterilir.
- **UI bileşenleri (`components/ui/`):** Skeleton (79), EmptyState (80), Toast 4 tip (81),
  Modal (82), ProgressBar (83), DataTable sıralama+filtre (84), SearchBar (85), Tooltip (86).
- **Responsive (87):** Sidebar 900px altında otomatik daralır (ikon modu).
- **Ayarlar (88):** tema, dil, ADB yolu, otomatik güncelleme (localStorage kalıcı).
- **scrcpy (89):** Cihaz detayında "Canlı Ekran" butonu — scrcpy yüklüyse `scrcpy -s <serial>`
  açar, değilse uyarı toast'ı.
- **İkon/splash (90):** `build/icon.png`+`icon.ico` (512, çok boyutlu) ve `splash.html` (spinner).
- **Font (91):** Inter (@fontsource/inter) — 400/500/600/700 paketlenmiş.
- **Framer Motion (92):** `npm i framer-motion`; `motion` + `AnimatePresence` sayfa/sekme
  geçişleri, toast, modal ve toggle animasyonları.
- **Hata sayfaları (93):** `NotFoundView` (404); bağlantı hatası global banner + toast.
- **Tema toggle (94):** `ui/ThemeToggle` — yay animasyonlu, güneş/ay ikonlu.
- **Tipografi/spacing (95):** Tailwind config'de Inter + brand renk + keyframe animasyonları;
  `card`, `btn-primary`, `btn-ghost` bileşen sınıfları.

## Yedekleme + SQLite (prompt 96-113)

**Yedekleme motoru** (`src/main/services/backup/`):

- `stages.ts` — fotoğraf (96: `adb pull /sdcard/DCIM`), kişiler (97: content query
  contacts), SMS (98: content query sms), uygulama (99: `adb backup`, Android 12+ kaldırıldı).
- `manager.ts` — `runBackup` orkestratörü: tarih damgalı klasör (101), aşama ilerlemesi
  (100), AbortSignal ile iptal (106), exclude (107), zip (104), rapor (108), `restoreBackup` (103).
- `util.ts` — `measureDir`, `zipFolder` (adm-zip), `estimateBackup` (105: `du -sk` + hız varsayımı).

**Arayüz** (`views/BackupView.tsx`): yedek türü seçimi, exclude, zip, tahmin, ilerleme
çubuğu, iptal, rapor, geçmiş listesi (102), sil (109) ve geri yükle (103) butonları.

**Bulut (110):** Google Drive/Dropbox gerçek OAuth gerektirir; bu iskelette yedek
dosyalarına dosya sistemi üzerinden erişilebilir. Drive/Dropbox için ileride bir
`CloudProvider` arayüzü (`upload(filePath)`) + OAuth token akışı eklenmeli.

**SQLite (111-113)** (`src/main/db/`):

- `better-sqlite3` (senkron, native); `telefon.db` `userData` altına yazılır.
- Şema (112): `devices`, `backups`, `settings`, `logs` + `schema_migrations`.
- Migration altyapısı (113): `migrations.ts` içinde versiyonlanmış migration'lar;
  `migrate()` bekleyenleri transaction içinde uygular ve `schema_migrations`'a kaydeder.
- Repo: `addBackup`, `listBackups`, `getBackup`, `deleteBackup`, `upsertDevice`,
  `setSetting/getSetting`, `addLog`. Cihaz bilgisi bağlanınca `devices` tablosuna
  otomatik yazılır (poller.ts).

## Cihaz Testleri (prompt 114-128)

`src/main/services/tests/`:

- `definitions.ts` — 12 donanım testi: ekran (114), dokunmatik/getevent (115),
  hoparlör (116), mikrofon (117), kamera (118), titreşim (119), sensör (120),
  Wi-Fi (121), Bluetooth (122), GPS (123), pil (124), USB (125). Her test = bir ADB
  komutu + geçme koşulu (check) + özet (summary).
- `runner.ts` — `runTests(serial)` tüm testleri sırayla çalıştırır; her biri için
  pass/fail/error + çıktı + süre toplar (126/127).
- `report.ts` — `exportPdf(report, path)` pdfkit ile PDF rapor üretir (128).

**getevent (115):** `adb shell getevent -pl` giriş cihazlarını ve yeteneklerini
listeler; dokunmatik ekran `ABS_MT_*` olaylarıyla görünür. Canlı izleme:
`adb shell getevent -l` (dokunma koordinatlarını akış olarak basar).

**Arayüz** (`views/TestsView.tsx`): "Tüm testleri çalıştır" butonu, sonuç listesi
(pass/fail/error rozetleri) ve "PDF indir" (PDF'yi üretir + varsayılan görüntüleyicide açar).

Notlar: renk testi ile hoparlör/mikrofon doğrulaması görsel/işitsel olduğu için
komutlar ilgili ekranı/uygulamayı açar; otomatik pass/fail komut çıktısına göre belirlenir.

## Dosya Tarayıcı (prompt 129-140)

`src/main/services/files/` + `views/FilesView.tsx`:

- `listFiles` (129) — `adb shell ls -la` çıktısını parse eder (ad, boyut, klasör, izin, tarih).
- `pullFile` (130), `pushFile` (131), `deleteFile` (132), `createFolder` (133).
- Arama filtreleme (134), `formatBytes` ile okunabilir boyut (135).
- Tür ikonları (136): klasör/resim/video/müzik/belge/arşiv (`fileKind`).
- Sürükle-bırak yükleme (137) — `webUtils.getPathForFile` ile yerel yol alınır.
- Çoklu seçim + toplu işlem (138) — checkbox + toplu indir/sil.
- Önizleme (139) — resim dosyaları `nativeImage.resize` ile 128px thumbnail'e çevrilir
  ve data URL olarak gösterilir.
- Sağ tık menüsü (140) — Aç / İndir / Sil.

## Güvenlik (prompt 141-150)

`src/main/services/security/` altında toplanan güvenlik katmanı; hepsi saf Node
(electron bağımsız) ve headless test edilebilir:

- `encryption.ts` — AES-256-GCM + scrypt; metin ve dosya (akışlı) şifreleme, parola
  hash/doğrulama, SHA-256 özet. Yedek şifrelemede (145) ve ayar deposunda (147) kullanılır.
- `adbKey.ts` — ADB RSA anahtar yönetimi (143) + parmak izi (141). Anahtar yoksa
  otomatik üretir (önce `adb keygen`, yoksa Node crypto fallback: PKCS#8 PEM özel anahtar
  - PKCS#1 DER tabanlı `adbkey.pub`). `rotateAdbKey`/`deleteAdbKey` ile yönetim.
    Parmak izi = `adbkey.pub` içindeki blob'un MD5'i (adb'nin ekranda gösterdiği) + SHA-256.
- `secretStore.ts` — `userData/security/master.key` (rastgele 32B) ile AES-256-GCM
  şifreleme; DB'deki `secure_settings` tablosu bu katmanı kullanır (147).
- `session.ts` — opsiyonel ana parola ile uygulama kilidi (146). Parola hash'i scrypt ile
  şifreli ayar deposunda saklanır; oturum bellekte tutulur, kapanınca kilitlenir.
- `dangerous.ts` — tehlikeli ADB komutlarını sınıflandırır (148): `reboot`, `shell rm/su/dd/mount`,
  `uninstall`, `push /system`, `pm clear/uninstall` vb.
- `redact.ts` — log maskeleme (149): IMEI, MAC, seri no, token/parola, uzun hash.
- `securityUpdates.ts` — GitHub Security Advisories'ten Electron güvenlik bültenlerini çeker
  ve mevcut sürümü etkileyenleri listeler (150).

Arayüz tarafı:

- `AdbAuthGuide` (141) — RSA yetkilendirme sürecini açıklar + parmak izini gösterir
  (Cihazlar sayfasında).
- `UnauthorizedGuide` (142) — cihaz "yetkisiz" olduğunda adım adım rehber gösterir.
- `SecuritySettings` (146/147/150) — Ayarlar sayfasında oturum (parola belirle/kilitle/
  değiştir/kaldır), şifreli ayar deposu ve güvenlik güncelleme kontrolü.
- `AppLock` (146) — oturum kilitliyken tam ekran kilit ekranı.
- `CommandConsole` (148) — tehlikeli komutta önce sınıflandırıp native onay kutusu açar;
  sunucu tarafında da `adb:run` onaysız tehlikeli komutu reddeder (savunma katmanı).
- `BackupView` (145) — "Yedeği şifrele" seçeneği + parola; şifreli yedek geri yüklemede
  parola ister. Şifreleme, zip'i AES-256-GCM ile `backup.zip.enc`'e çevirir.

Doğrulama: `scripts/security.selfcheck.ts` tüm güvenlik fonksiyonlarını headless test
eder (35 asılırlık). Çalıştırma:

```bash
npx esbuild scripts/security.selfcheck.ts --bundle --platform=node --format=cjs \
  --external:better-sqlite3 --outfile=scripts/.security.selfcheck.cjs
node scripts/.security.selfcheck.cjs
```

## Hata Yönetimi ve Teşhis (prompt 151-160)

`src/main/services/errors/` altında hata yönetimi + gözlemlenebilirlik katmanı:

- `adbError.ts` — ADB hatalarını kullanıcı dostu Türkçe mesaja çevirir (152):
  `device not found` → "Cihaz bulunamadı...", `unauthorized` → izin rehberi vb.
  `exec.ts` hata fırlattığında bu çeviriyi kullanır.
- `retry.ts` — ağ hataları için üstel geri çekilmeli retry (153). `securityUpdates.ts`
  bülten çekerken bu mekanizmayı kullanır.
- `errorLog.ts` — hataları `userData/logs/errors.jsonl` dosyasına sıralı yazar + bellekte
  son 200 kaydı tutar (154).
- `crash.ts` — çökme raporlarını `userData/crashes/crash-*.json` olarak yazar ve analiz
  eder (toplam/özet/tekrarlayan mesaj) (160).
- `performance.ts` — başlangıç süresi, çalışma süresi, bellek, ADB komut sayısı/ort. süre (158).
- `memory.ts` — heap eğilimini izler; sürekli artan kullanımda "olası bellek sızıntısı"
  uyarısı üretir (159, sezgisel).
- `debug.ts` — hata ayıklama modu bayrağı + `debug()` çıktısı (157).
- `report.ts` — hata loglarını + çökme raporlarını + ana logu tek zip'te toplar (155).
  `uploadErrorReport` yapılandırılmış bir endpoint'e POST eder (multipart, retry ile) veya
  GitHub issue bağlantısı üretir; endpoint/repo/token Ayarlar → Hata raporu bölümünden
  belirlenir (token şifreli saklanır).

Main süreç (`index.ts`): `uncaughtException`/`unhandledRejection` yakalanır → çökme
raporu + hata logu yazılır; kritik hatada `shutdownSafely()` logları boşaltıp DB'yi
kapatıp güvenle çıkar (156). Debug modu `settings` tablosundan (`debug.enabled`) yüklenir.

Arayüz tarafı:

- `ErrorBoundary` (151) — uygulamanın tamamını sarar; render hatasında geri dönüş ekranı
  (yeniden yükle + hata raporu gönder) gösterir ve hatayı main'e loglar.
- `ErrorDiagnostics` (154-160) — Ayarlar sayfasında: debug modu anahtarı, performans
  metrikleri, bellek izleme, çökme raporları, son hatalar, hata raporu gönder + güvenli
  kapat butonları.

Gerçek bellek sızıntısı analizi (159) — `--inspect` + CDP heap snapshot farkı:

```bash
npm run dev:inspect     # ana süreci --inspect=9229 ile başlatır
npm run heap:check      # heap anlık görüntüleri alıp sürekli büyüyen sınıfları listeler
# seçenekler: --port 9229 --samples 4 --delay 4000 --min-intervals 2 --top 15
```

`scripts/heap-leak-check.mjs` inspector'a bağlanır, N heap anlık görüntüsü alır (arada GC)
ve ardışık aralıklarda SÜREKLİ büyüyen sınıfları sızıntı adayı olarak raporlar.
`--samples 2` tek seferlik farktır; `--samples 4` gibi çok örnek, tek seferlik büyüme ile
gerçek sızıntıyı ayırır (`aralık` sütunu kaç aralıkta büyüdüğünü gösterir; 3/3 güçlü işarettir).

Doğrulama: `scripts/security.selfcheck.ts` güvenlik + hata modüllerini birlikte test eder
(58 asılırlık); endpoint yükleme yerel bir HTTP sunucusuyla doğrulanır.

## İkon ve Paketleme

- `build/icon.png` (512x512) + `build/icon.ico` (çok boyutlu) uygulama logosu.
- Linux'ta Windows kurulumcusu (.exe/NSIS) üretmek wine gerektirir; bu yüzden
  `.github/workflows/build.yml` Windows/macOS/Linux kurulumcularını CI'da
  (yerel runner) üretir. `v*` etiketi itince GitHub Releases'a da yayınlar.
- Kendi makinende Windows ise `npm run dist:win` doğrudan çalışır.

## Test, Lint ve CI/CD (prompt 161-170)

### Test Altyapısı (161-165)

- **Jest + ts-jest** (`jest.config.js` + `tsconfig.test.json`): electron-vite'in ESNext
  modülü Jest'in CommonJS çalışma zamanıyla çakıştığı için testlere özel
  `tsconfig.test.json` (`module: commonjs`) kullanılır. Varsayılan ortam `jsdom`
  (renderer bileşenleri); main/services testleri `@jest-environment node` ile çalışır.
- **Test dosyaları:** `tests/unit/` (adb parse/exec, hata çevirisi, maskeleme, tehlikeli
  komut, format, imei/Luhn, device-info/getprop IMEI, root) ve `tests/components/` (ProgressBar,
  EmptyState, DeviceStatusBadge, DataTable, ImeiView, RootView). Toplam 88 test.
- **ADB mock'ları (162):** `tests/fixtures/fake-adb.sh` sahte adb ikilisidir;
  `ADB_PATH` ile yönlendirilip gerçek cihaz/adb olmadan `exec.ts` headless doğrulanır
  (version/devices/shell/timeout/hata kodu).
- **Komutlar:** `npm test` (tek sefer), `npm run test:watch`, `npm run test:coverage`.
- **Coverage raporu (165):** `coverage/` altında text + HTML + lcov. Test edilen birimler
  (parse, redact, adbError, dangerous, format, temel bileşenler) ~%90-100; kod tabanının
  tamamı için global kapsam ~%18 (160 özelliklik projede testler kademeli ekleniyor).

### E2E (164)

- **Playwright + `_electron`** (`playwright.config.ts` + `e2e/app.spec.ts`): derlenmiş
  uygulamayı (`out/main/index.js`) başlatır, ana pencerenin açıldığını doğrular.
- Headless Linux'ta `xvfb-run -a npm run test:e2e`; root kapsayıcıda `--no-sandbox` şart.
- **Native modül:** better-sqlite3 v13 (N-API 10) Electron 33 (Node 20/N-API 9) ile
  uyumsuz olduğu için v11'e indirildi ve Electron'a göre derlendi. `npm run rebuild:native`
  (electron-rebuild) taze kurulumda/CI'da binary'i Electron ABI'sine göre derler.

### CI/CD (166)

- `.github/workflows/ci.yml` — her push/PR'da `typecheck` + `lint` + `test:coverage`
  (unit/bileşen) çalıştırır; ayrı bir `e2e` job'ı Xvfb altında Playwright Electron
  testini koşar (yukarıdaki bağımlılık uyumsuzluğu giderilene dek kırmızı kalır).
- `.github/workflows/build.yml` — mevcut CD: `v*` etiketi veya manuel tetiklemede
  Windows/macOS/Linux kurulumcularını üretir ve GitHub Releases'a yayınlar.

### Kod Kalitesi (167-170)

- **ESLint 9 (flat)** (`eslint.config.mjs`): typescript-eslint + react + react-hooks +
  prettier uyumluluğu. `npm run lint` / `npm run lint:fix`.
- **Prettier** (`.prettierrc.json`): noktalı virgülsüz, tek tırnak, 100 sütun.
  `npm run format` / `npm run format:check`.
- **Husky + lint-staged (168):** `.husky/pre-commit` staged dosyalarda ESLint + Prettier
  uygular; `prepare` scripti ile kurulumda otomatik etkinleşir.
- **TypeScript strict (169):** `strict: true` zaten aktifti; ek olarak
  `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` eklendi
  (ErrorBoundary'de `override` belirteçleri).
- **Kod inceleme listesi (170):** `docs/CODE_REVIEW_CHECKLIST.md` — işlevsellik, test,
  tip/derleme, lint, güvenlik, hata yönetimi, performans, dokümantasyon başlıklarında
  PR öncesi kontrol listesi.

## Paketleme, Dağıtım ve Proje Çıktıları (prompt 171-180)

- **Paketleme (171-172):** electron-builder ile Windows `.exe` (NSIS), macOS `.dmg`/`.zip`,
  Linux `.AppImage`/`.deb`. Linux yerel olarak üretildi ve doğrulandı:
  `release/telefon-0.1.0.AppImage` (126 MB) + `release/telefon_0.1.0_amd64.deb` (86 MB).
  Windows/macOS kurulumcuları CI'da (`build.yml`) üretilir.
- **İkon + installer (173):** `build/icon.png` (512×512) + `build/icon.ico` (çok boyutlu);
  NSIS "assisted" kurulum (dizin seçimi + masaüstü kısayolu). Ayrıntı: `docs/RELEASE.md`.
- **Versiyonlama (174):** SemVer; `version` alanı tek doğruluk kaynağı, `CHANGELOG.md`
  "Keep a Changelog" biçiminde, `v*` etiketi yayın tetikler.
- **Otomatik güncelleme (175):** `electron-updater` + GitHub Releases (veya generic HTTP).
  Paketleme `latest-linux.yml` + `app-update.yml` üretiyor. Ayrıntı: `docs/AUTO_UPDATE.md`.
- **Kod imzalama (176):** Windows Authenticode, macOS notarizasyon, Linux GPG —
  `docs/CODE_SIGNING.md`.
- **Sunum (177):** `sunum/Telefon-Sunum.pptx` (10 slayt, 16:9; `sunum/sunum.json`
  ile yeniden üretilebilir).
- **Teknik dokümantasyon (178):** `docs/TEKNIK_DOKUMAN.md`.
- **Demo senaryosu (179):** `docs/DEMO_SENARYO.md` (7 sahne, süreli).
- **Açık kaynak yayın (180):** `LICENSE` (MIT), `CONTRIBUTING.md`, `docs/PUBLISHING.md`
  yayın rehberi. Kullanıcı adı `patron` olarak ayarlandı; farklıysa
  `scripts/publish.sh KULLANICI` ile değiştirin. Kalan adım: `git push` + `v0.1.0`
  etiketi (kimlik doğrulamalı terminalde).
