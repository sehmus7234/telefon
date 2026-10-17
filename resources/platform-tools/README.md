# platform-tools (ADB)

Bu klasör, uygulama içine paketlenen ADB binary'lerini tutar.
`electron-builder.yml` içindeki `extraResources` bloğu bu klasörü pakete dahil
eder ve uygulama çalışma anında `process.resourcesPath/platform-tools/adb`
yolundan bulur (`src/main/services/adb/paths.ts`).

Mevcut durum:

- **Windows**: `adb.exe`, `AdbWinApi.dll`, `AdbWinUsbApi.dll`, `libwinpthread-1.dll`
  gömülüdür (platform-tools 37.0.1). Kurulumdan sonra ayrıca platform-tools
  kurmaya gerek kalmaz.
- **macOS / Linux**: pakete gömülü adb yoktur; uygulama sistemdeki adb'yi
  (PATH / SDK / ADB_PATH) kullanır. Eklemek için bu klasöre ilgili platformun
  `adb` binary'sini koy (ikisi de `adb` adını kullandığından aynı anda gömülemez;
  gerekirse electron-builder'da platforma özel `extraResources` kullan).

Not: adb Apache 2.0 lisanslıdır; yeniden dağıtımına izin verilir.
