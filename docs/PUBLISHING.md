# Açık Kaynak Yayınlama Rehberi (prompt 180)

Proje açık kaynak yayına hazır hale getirildi; aşağıdaki adımlar GitHub'da gerçek
yayını tamamlar.

## Hazır Olanlar

- `README.md` — kapsamlı tanıtım, kurulum, mimari, komutlar.
- `LICENSE` — MIT.
- `CONTRIBUTING.md` — katkı rehberi (kurulum, test, commit sözleşmesi).
- `CHANGELOG.md` — Keep a Changelog biçiminde sürüm geçmişi.
- `docs/` — RELEASE, AUTO_UPDATE, CODE_SIGNING, TEKNIK_DOKUMAN, DEMO_SENARYO,
  CODE_REVIEW_CHECKLIST.
- `.github/workflows/` — CI (test/lint/typecheck) + CD (paketleme/yayın).

## Yayın Adımları (elle, tek sefer)

**Tek komutla hazırlık:** `scripts/publish.sh` yer tutucuları değiştirir, remote'u
ekler ve push/tag komutlarını yazdırır:

```bash
bash scripts/publish.sh KULLANICI          # veya: GITHUB_USER=KULLANICI bash scripts/publish.sh
```

Ardından komut dosyasının yazdırdığı `git push` + `git tag` adımlarını çalıştırın.
Manuel yol (aşağıda) aynı işi adım adım anlatır.

1. GitHub'da `telefon` adıyla boş bir repo oluşturun (private/public).
2. `electron-builder.yml` içinde `publish.owner` alanını kullanıcı/org adınızla
   değiştirin; `package.json` içindeki `homepage` ve `repository.url` alanlarını
   da gerçek adrese güncelleyin.
3. Depoyu bağlayıp itin:

```bash
git remote add origin https://github.com/KULLANICI/telefon.git
git branch -M main
git push -u origin main
```

4. İlk sürümü etiketleyin (otomatik güncelleme + paket üretimi için):

```bash
git tag v0.1.0
git push --tags
```

5. GitHub Actions ilk `v0.1.0` çalışmasında Windows `.exe`, macOS `.dmg`,
   Linux `.AppImage`/`.deb` üretip Releases'a yükler.

## Repo Görünürlüğü ve Rozetler

- Public yapıldığında README üstüne CI rozeti ekleyebilirsiniz:

```markdown
[![CI](https://github.com/KULLANICI/telefon/actions/workflows/ci.yml/badge.svg)](https://github.com/KULLANICI/telefon/actions)
```

## Dikkat

- Kullanıcı adı `patron` olarak ayarlandı; GitHub hesabınız farklıysa
  `bash scripts/publish.sh KULLANICI` ile değiştirin (veya `git remote set-url`).
- Sırlar (token, sertifika) repoya girmemelidir; CI'da secret olarak tanımlanır
  (bkz. `docs/CODE_SIGNING.md`).
