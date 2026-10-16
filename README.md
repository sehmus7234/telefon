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

## ADB / Cihaz Servisi (gerçek cihaz mantığı)

`src/main/services/adb.ts` gerçek cihaz işlemlerini yapar (saf Node, electron
bağımsız — test edilebilir):

- `listDevices()` — `adb devices -l` çıktısını ayrıştırır (serial, durum, model).
- `getDeviceInfo(serial)` — `getprop` ile model/üretici/Android sürümü okur.
- `createBackup(serial, baseDir)` — `adb pull` ile dosyaları çeker; toplam boyut
  + sha256 manifest üretir.

Yedekler `userData/backups/<cihaz>-<zaman>/` altına yazılır. adb yoksa Türkçe bir
hata fırlatılır (renderer `hata` state'ine düşer). adb yolunu `ADB_PATH` ortam
değişkeniyle de belirtebilirsin.

## İkon ve Paketleme

- `build/icon.png` (512x512) + `build/icon.ico` (çok boyutlu) uygulama logosu.
- Linux'ta Windows kurulumcusu (.exe/NSIS) üretmek wine gerektirir; bu yüzden
  `.github/workflows/build.yml` Windows/macOS/Linux kurulumcularını CI'da
  (yerel runner) üretir. `v*` etiketi itince GitHub Releases'a da yayınlar.
- Kendi makinende Windows ise `npm run dist:win` doğrudan çalışır.
