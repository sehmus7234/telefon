# Katkıda Bulunma Rehberi (CONTRIBUTING)

Telefon projesine katkıda bulunmak istediğiniz için teşekkürler. Bu rehber,
değişikliklerin hızlı ve sorunsuz kabul edilmesi için izlenecek adımları özetler.

## 1. Başlarken

```bash
git clone https://github.com/PATRON/telefon.git
cd telefon
npm install
npm run rebuild:native   # better-sqlite3'ü Electron ABI'sine göre derler
npm run dev              # geliştirme modu (hot reload)
```

## 2. Geliştirme Döngüsü

1. Bir konu (issue) açın veya mevcut bir konuya atanın.
2. `main` dalından yeni bir dal oluşturun: `git checkout -b ozellik/kisa-aciklama`
   (veya `duzeltme/...`).
3. Değişikliği yapın; kod yorumlarını **Türkçe** yazın.
4. Testleri ekleyin/güncelleyin:
   - Saf mantık / servisler → `tests/unit/`
   - React bileşenleri → `tests/components/`
   - Uçtan uca akış → `e2e/`
5. Doğrulama kapılarını çalıştırın:

```bash
npm run typecheck    # Tip kontrolü (main + renderer)
npm test             # 60+ birim/bileşen testi
npm run lint         # ESLint (0 hata hedef)
npm run format:check # Prettier
npm run build        # Üretim derlemesi
```

6. Commit yazarken neyi/niçin yaptığınızı özetleyin (Türkçe). Pre-commit hook'u
   (Husky + lint-staged) staged dosyalarda ESLint + Prettier'i otomatik uygular.

## 3. Kod İnceleme

Her PR, `docs/CODE_REVIEW_CHECKLIST.md` listesine göre değerlendirilir. Özellikle:

- **Güvenlik:** IPC yalnızca preload whitelist üzerinden; hassas veri maskelenir;
  tehlikeli ADB komutları onay ister.
- **Test:** Yeni davranış için test zorunlu; ADB servisi değiştiyse
  `tests/fixtures/fake-adb.sh` güncel tutulur.
- **Tip:** `strict` mod ihlali yok; `@shared/types` hem main hem renderer'da tutarlı.

## 4. Taahhüt Sözleşmesi (Commit Convention)

Commit mesajları `tür: özet` biçiminde Türkçe yazılır:

- `feat:` yeni özellik
- `fix:` hata düzeltmesi
- `docs:` dokümantasyon
- `test:` test ekleme/güncelleme
- `refactor:` davranış değiştirmeyen yeniden düzenleme
- `chore:` yapı/araç bakımı

## 5. Sorun Bildirme

Hata bildirirken şunları ekleyin: işletim sistemi, uygulama sürümü, tekrarlama
adımları, beklenen/gerçekleşen davranış ve (varsa) `logs/main.log` çıktısı.
