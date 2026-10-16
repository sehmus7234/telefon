# platform-tools (ADB)

Uygulama içine ADB binary'sini paketlemek için bu klasöre platform-tools içeriğini
koy (prompt 18):

1. https://developer.android.com/tools/releases/platform-tools adresinden
   işletim sistemine uygun platform-tools zip'ini indir.
2. İçindeki `adb` (veya Windows'ta `adb.exe`) dosyasını bu klasöre kopyala.
3. electron-builder.yml içindeki `extraResources` bloğu bu klasörü pakete dahil
   eder ve uygulama çalışma anında `process.resourcesPath/platform-tools/adb`
   yolundan bulur (`src/main/services/adb/paths.ts`).

Not: adb Apache 2.0 lisanslıdır; yeniden dağıtımına izin verilir. Paket boyutu
yaklaşık 15 MB artar. Klasör boşsa uygulama sistemdeki adb'yi (PATH / SDK)
kullanmaya devam eder.
