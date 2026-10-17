# Kod İnceleme Kontrol Listesi (prompt 170)

Bu liste, `telefon` projesindeki her pull request / kod değişikliğini gözden geçirirken
uyulması gereken kalite kapılarını toplar. "Geçti" = gözden geçirildi ve sorun yok;
"U/D" = uygulanamaz/değil. Her madde için kısa bir not bırakılmalıdır.

## 1. İşlevsellik ve Doğruluk

- [ ] Değişiklik, bağlı olduğu prompt/un ihtiyacını tam karşılıyor mu?
- [ ] Mutlu yol dışında hata/kenar durumları ele alınmış mı? (boş girdi, sıfır cihaz, timeout, yetkisiz cihaz)
- [ ] ADB komutları hata koduna ve stderr'e göre doğru yorumlanıyor mu? (`adbError.ts` çevirisi kullanılıyor mu)
- [ ] Gerçek cihaz olmadan test edilebiliyor mu? (sahte adb / mock ile doğrulanabiliyor mu)

## 2. Test

- [ ] Yeni davranış için test yazıldı mı? (`tests/unit/`, `tests/components/`)
- [ ] Test önce başarısız oldu mu (RED), sonra geçti mi (GREEN)? (TDD)
- [ ] `npm test` temiz geçiyor mu? (60/60 gibi — sıfır başarısızlık)
- [ ] ADB servisi değiştiyse sahte-adb entegrasyon testi güncellendi mi? (`tests/fixtures/fake-adb.sh`)
- [ ] React bileşeni değiştiyse bileşen testi güncellendi mi?
- [ ] E2E kapsamına giren akış için `e2e/` senaryosu eklendi mi?

## 3. Tip ve Derleme

- [ ] `npm run typecheck` temiz mi? (node + web)
- [ ] `npm run build` temiz mi? (`out/` üretiliyor)
- [ ] strict mode ihlali yok mu? (herhangi bir `any` bilinçli mi, kaçınılmaz mı?)
- [ ] `@shared/types` ortak tipleri hem main hem renderer'da tutarlı mı?

## 4. Lint ve Biçim

- [ ] `npm run lint` hata vermiyor mu? (uyarılar gerekçeliyse kabul)
- [ ] `npm run format:check` temiz mi? (Prettier)
- [ ] Yeni kod mevcut stile uyuyor mu? (noktalı virgülsüz, tek tırnak, 100 sütun)

## 5. Güvenlik (kritik — Electron + cihaz erişimi)

- [ ] IPC yalnızca preload'daki whitelist üzerinden mi açılıyor? (`contextBridge`)
- [ ] `contextIsolation: true` ve `nodeIntegration: false` korunuyor mu?
- [ ] Hassas veri (IMEI, MAC, seri no, token, parola) loglanmadan önce maskeleniyor mu? (`redact.ts`)
- [ ] Tehlikeli ADB komutları çalıştırılmadan önce onay isteniyor mu? (`dangerous.ts`)
- [ ] Şifrelenmesi gereken veri AES-256-GCM ile şifreleniyor mu? (düz metin saklanmıyor)
- [ ] Kullanıcı girdisi bir komuta doğrudan eklenmiyor mu? (argüman enjeksiyonu yok)
- [ ] Dış bağlantılar `shell.openExternal` ile, uygulama içinde yeni pencere açılmadan mı? (`setWindowOpenHandler` deny)

## 6. Hata Yönetimi

- [ ] Hata yolları `uncaughtException`/`unhandledRejection` ile yakalanıyor mu?
- [ ] Kullanıcı dostu Türkçe hata mesajı var mı (ham stderr gösterilmiyor)?
- [ ] Uzun işlemler iptal edilebilir mi? (`runAbortable` + `cancelRun`)
- [ ] Zaman aşımı (timeout) her spawn'da tanımlı mı?

## 7. Performans

- [ ] ADB komutları kuyruktan mı geçiyor? (aynı anda tek komut — `queue.ts`)
- [ ] Yeni bir bellek büyümesi eğilimi yok mu? (gerekirse `npm run heap:check`)

## 8. Dokümantasyon ve Taahhüt

- [ ] `README.md` ilgili bölümü güncellendi mi? (yeni prompt/moddül varsa)
- [ ] Kod yorumları Türkçe ve açıklayıcı mı?
- [ ] Commit mesajı neyi/niçin yaptığını özetliyor mu?

## 9. Onay Sonucu

- [ ] Tüm kapılar yeşil — onaylı.
- [ ] Eksikler var — geri bildirim aşağıda.

### Geri Bildirim / Notlar

<!-- Gözden geçiren kişi notlarını buraya yazar. -->
