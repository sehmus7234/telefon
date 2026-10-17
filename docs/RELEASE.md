# Paketleme, İkon ve Versiyonlama (prompt 171-174)

## 171 — Windows için .exe (NSIS)

`electron-builder.yml` içindeki `win` + `nsis` blokları Windows kurulumcusunu tanımlar:

- `win.executableName: telefon`, `win.icon: build/icon.ico`
- NSIS kurulumcusu: `oneClick: false` + `allowToChangeInstallationDirectory: true`
  (kullanıcı kurulum dizinini seçebilir), masaüstü kısayolu her zaman oluşturulur.

Üretim:

```bash
npm run dist:win          # Windows üzerinde doğrudan çalışır
# Linux'ta .exe üretmek için wine gerekir; bu yüzden CI kullanılır:
```

`.github/workflows/build.yml` `windows-latest` runner üzerinde `npm run dist:win`
çalıştırır; `v*` etiketi itilirse `release/telefon-<sürüm>-setup.exe` üretilip
GitHub Releases'a yayınlanır. Yerel Linux ortamında .exe üretilmez (wine yok).

## 172 — macOS .dmg ve Linux .AppImage

- **Linux .AppImage + .deb** (`linux.target`): yerel olarak üretildi ve doğrulandı:

```
release/telefon-0.1.0.AppImage   (126 MB)
release/telefon_0.1.0_amd64.deb   (86 MB)
release/latest-linux.yml          (otomatik güncelleme meta verisi)
```

```bash
npm run dist:linux
```

Paketli uygulama smoke test edildi: `release/linux-unpacked/telefon --no-sandbox`
altında başlıyor, `initDb` (better-sqlite3) sorunsuz yükleniyor; native modül
`app.asar.unpacked/.../better_sqlite3.node` içine doğru açılıyor.

- **macOS .dmg + .zip** (`mac.target`): .dmg yalnızca macOS üzerinde üretilebilir.
  CI'daki `macos-latest` runner `npm run dist:mac` ile `release/telefon-<sürüm>.dmg`
  üretir. İmzalama/notarizasyon için `docs/CODE_SIGNING.md` dosyasına bakın.

## 173 — Uygulama İkonu ve Installer Tasarımı

Kaynak dosyalar (`build/`):

| Dosya      | Boyut                     | Kullanım                                                         |
| ---------- | ------------------------- | ---------------------------------------------------------------- |
| `icon.png` | 512×512 RGBA              | Tüm platformların ana kaynağı (electron-builder icns/ico üretir) |
| `icon.ico` | 16/32/48/256… çok boyutlu | Windows .exe + NSIS                                              |

Tasarım dili: koyu lacivert (`#0f172a`) zemin + mor-mavi gradyan (`from-brand-500
to-violet-500`) — uygulamanın `ProgressBar` ve genel temasıyla aynı palet. Installer
deneyimi: NSIS "assisted" kurulum (dizin seçimi), masaüstü kısayolu, tek tıkla
kaldırma.

İkonu değiştirmek için `build/icon.png` (512×512) dosyasını güncelleyin; Windows
için `build/icon.ico` yeniden üretilmelidir (ör. ImageMagick ile).

## 174 — Versiyonlama Stratejisi (SemVer)

Kural: `MAJOR.MINOR.PATCH` (SemVer 2.0.0)

- **MAJOR** — geriye dönük uyumsuz değişiklik (ör. Electron major atlama, şema değişimi)
- **MINOR** — geriye dönük uyumlu yeni özellik (yeni bir yedekleme türü, yeni sekme)
- **PATCH** — geriye dönük uyumlu düzeltme (hata düzeltme, doküman)

İşleyiş:

1. `package.json` içindeki `version` alanı tek doğruluk kaynağıdır; yapıt adları
   (`telefon-<sürüm>.AppImage` vb.) buradan türer.
2. Değişiklikler `CHANGELOG.md` dosyasına "Keep a Changelog" biçiminde işlenir.
3. Yayın için `v<MAJOR.MINOR.PATCH>` (ör. `v0.2.0`) etiketi itilir → CI
   `build.yml` kurulumcuları üretir ve GitHub Releases'a yayınlar; otomatik
   güncelleme bu sürümü dağıtır (bkz. `docs/AUTO_UPDATE.md`).

Geçerli sürüm: **0.1.0** (okul projesi geliştirme aşaması; 1.0.0 öncesi MINOR
artışları geriye dönük uyumluluğu garanti etmez).
