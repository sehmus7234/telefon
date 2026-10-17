# Otomatik Güncelleme (prompt 175)

## Nasıl Çalışır

- `electron-updater` paketlenmiş uygulamada (`app.isPackaged`) devreye girer; dev
  modda kapalıdır (`src/main/updater.ts`).
- Açılıştan 10 saniye sonra ilk kontrol yapılır; `autoDownload = false` olduğundan
  indirme kullanıcı onayıyla başlar, `autoInstallOnAppQuit = true` ile çıkışta kurulur.
- Olaylar renderer'a `updater:available` / `updater:progress` / `updater:downloaded`
  kanallarıyla iletilir.

## Güncelleme Sunucusu: GitHub Releases (varsayılan)

`electron-builder.yml` içindeki `publish` bloğu güncelleme kaynağını belirler:

```yaml
publish:
  provider: github
  owner: PATRON # <-- GitHub kullanıcı/org adınızla değiştirin
  repo: telefon
```

Paketleme sırasında electron-builder uygulamanın içine `app-update.yml` ve
`latest-linux.yml` (veya `latest.yml`/`latest-mac.yml`) gömülür. Uygulama bu
dosyadaki repo adresine gider; `releases.atom` beslemesini sorgular ve en yeni
sürümle karşılaştırır.

Yayın akışı:

```bash
npm version patch -m "chore: v%s"   # sürümü artır + etiket oluştur (veya elle)
git push --follow-tags
# CI build.yml `v*` etiketini görür, kurulumcuları üretir ve GH_TOKEN ile
# GitHub Releases'a yükler -> electron-updater bunu algılar.
```

İlk kurulum öncesi: `electron-builder.yml` içindeki `owner` alanını gerçek GitHub
kullanıcı/org adıyla değiştirin. Yayın için CI'da `GH_TOKEN` secret'i tanımlı
olmalıdır (mevcut `build.yml` `secrets.GITHUB_TOKEN` kullanır).

## Alternatif: Generic (kendi HTTP sunucunuz)

Kendi sunucunuzdan güncelleme dağıtmak için `publish` bloğunu şu şekilde değiştirin:

```yaml
publish:
  provider: generic
  url: https://guncelleme.ornek.com/telefon
```

`npm run dist:linux` sonrası `release/` içindeki üç dosyayı (`*.AppImage`,
`*.deb`, `latest-linux.yml`) bu URL'ye yükleyin. Statik dosya sunan herhangi bir
HTTP sunucu (nginx, S3, GitHub Pages) yeterlidir; ayrı bir "güncelleme sunucusu"
yazılımı gerekmez.

## Doğrulananlar

- Paketleme sonrası `release/latest-linux.yml` ve `resources/app-update.yml`
  üretildi (electron-builder "adding autoupdate files" çıktısında görüldü).
- Paketli uygulama açılışta güncelleme kontrolü yaptı; repo henüz olmadığı için
  `404` döndü (beklenen — `owner` gerçek hesap yapılınca çözülür).
