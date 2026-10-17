# Windows'ta Kurulum ve Derleme

Bu uygulamanın Windows .exe'si, içindeki native veritabanı modülü (better-sqlite3)
nedeniyle **Linux'tan doğru şekilde üretilemez**; Windows üzerinde derlenmesi gerekir.
Bu paket, derlemeyi tek tıkla yapmanızı sağlar.

## 1) Gereksinimler (yalnızca bir kez)

1. **Node.js LTS** — https://nodejs.org (indir, kur)
2. **Python 3** — https://www.python.org (kurarken "Add to PATH" işaretle)
3. **Visual Studio Build Tools** — https://visualstudio.microsoft.com/visual-cpp-build-tools
   → "Desktop development with C++" (Masaüstü C++ geliştirme) iş yükünü seç, kur.

## 2) Derleme

1. Bu zip'i bir klasöre çıkar (ör. `C:\telefon`).
2. `build-windows.bat` dosyasına **çift tıkla**.
   - İlk seferde `npm install` Electron ikilisini indirir (2-5 dk).
   - Script sırayla: bağımlılıklar → native modül derleme → .exe üretimi yapar.
3. Bittiğinde kurulumcu burada:
   ```
   release\telefon-0.1.0-setup.exe
   ```

## 3) Kurulum

`telefon-0.1.0-setup.exe` dosyasına çift tıkla → kurulum sihirbazı → çalıştır.

> İmzasız olduğu için Windows SmartScreen "Windows protected your PC" diyebilir:
> **More info → Run anyway** deyin.

## 4) Komut satırı ile (bat yerine)

```cmd
npm install
npm run rebuild:native
npm run dist:win
```

## Not

- Uygulama Android cihaz yönetimi içindir; cihaz olmadan da arayüz açılır ama
  cihaz listesi boş gelir (normal). Gerçek cihaz için telefonda "USB hata ayıklama"
  açık olmalı ve ADB kurulu olmalı (veya uygulama içi platform-tools kullanılır).
