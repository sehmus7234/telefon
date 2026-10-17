# Kod İmzalama (Code Signing) — prompt 176

İmzalama, kurulumcuların ve uygulama ikililerinin değiştirilmediğini kanıtlar ve
işletim sisteminin "bilinmeyen yayıncı" uyarısını kaldırır. Bu projede imzalama
sertifikaları **tanımlanmamıştır**; aşağıdaki süreç her platform için izlenecek
yolu açıklar.

## Windows (Authenticode)

1. Sertifika alın: OV/EV Kod İmzalama sertifikası (ör. Sectigo, DigiCert) veya
   geliştirme için kendinden imzalı sertifika.
2. `build.yml` (CI) içine secret ekleyin:
   - `CSC_LINK` — `.pfx` dosyasının base64 veya URL'i
   - `CSC_KEY_PASSWORD` — sertifika parolası
3. electron-builder bu değişkenleri görünce `signtool` ile imzalar. Ek olarak:

```yaml
win:
  signtoolOptions:
    certificateSubjectName: 'Ornek Ltd. Sti.'
```

## macOS (İmzalama + Notarizasyon)

Apple Geliştirici hesabı + "Developer ID Application" sertifikası gerekir:

1. Keychain'de "Developer ID Application" sertifikası oluşturun.
2. CI secret'ları:
   - `CSC_LINK` — `.p12` (base64)
   - `CSC_KEY_PASSWORD`
   - `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` — notarizasyon
3. `mac` bloğuna ekleyin:

```yaml
mac:
  hardenedRuntime: true
  gatekeeperAssess: false
  notarize:
    teamId: 'TEAMID'
```

electron-builder imzalar ve `altool`/`notarytool` ile Apple'a notarize ettirir.
Notarize edilmemiş .dmg, Gatekeeper tarafından engellenir.

## Linux

Linux'ta kod imzalama zorunlu değildir; `.AppImage` ve `.deb` imzasız dağıtılır.
İstenirse `.deb` için GPG imzası `dpkg-sig` ile, AppImage için `appimagetool --sign`
ile eklenebilir.

## Öneri (okul projesi)

Okul projesi kapsamında ücretli sertifika gerekmez; Windows'ta kendinden imzalı
sertifika, macOS'ta "ad-hoc" imzalama (yerel çalıştırma) yeterlidir. Gerçek dağıtım
için resmi sertifika şarttır.
