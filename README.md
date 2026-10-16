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
- IMEI (56) — `dumpsys iphonesubinfo`, yalnızca okuma; Android 10+ genelde boş döner
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
- **Menü (72):** Dashboard, Cihazlar, Yedekleme, Testler, Dosyalar, Ayarlar (SVG ikonlu).
- **Palet (73):** Tailwind'de `brand` (mavi-mor) skalası; koyu tema ağırlıklı — yüzey
  `surface` (#171923), arka plan #0f1117, accent gradyan brand->violet.
- **Cihaz kartı (74/75):** `devices/DeviceCard` — ad, model, durum rozeti, pil ikonu;
  Framer Motion ile hover scale + glow shadow.
- **Dashboard (76):** bağlı cihaz, son yedekleme, toplam depolama, çevrimiçi oran kartları.
- **Cihaz detay (77/78):** `DeviceDetailView` sekmeli (Genel/Uygulamalar/Dosyalar/Testler);
  `AnimatePresence` + `layoutId` ile smooth sekme geçişi.
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

## İkon ve Paketleme

- `build/icon.png` (512x512) + `build/icon.ico` (çok boyutlu) uygulama logosu.
- Linux'ta Windows kurulumcusu (.exe/NSIS) üretmek wine gerektirir; bu yüzden
  `.github/workflows/build.yml` Windows/macOS/Linux kurulumcularını CI'da
  (yerel runner) üretir. `v*` etiketi itince GitHub Releases'a da yayınlar.
- Kendi makinende Windows ise `npm run dist:win` doğrudan çalışır.
