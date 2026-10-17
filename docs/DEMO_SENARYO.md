# Demo Videosu Senaryosu (prompt 179)

Hedef: 3-4 dakikalık tanıtım videosu. Ekran kaydı (OBS) + sesli anlatım. Her sahne
için süre, eylem ve söylenecek satır verilmiştir.

## Sahne 1 — Açılış ve İlk İzlenim (0:00-0:30)

- **Görüntü:** Uygulama simgesi tıklanır; splash ekranı, ardından koyu temalı ana
  pencere açılır. Solda kenar çubuğu (Dashboard, Cihazlar, Dosyalar, Yedekleme,
  Testler, Ayarlar).
- **Anlatım:** "Bu, Telefon: Android cihazlarınızı masaüstünden yöneten ve
  yedekleyen açık kaynak bir Electron uygulaması. İlk açılışta karşımıza cihaz
  yönetim paneli geliyor."

## Sahne 2 — Cihaz Bağlama (0:30-1:00)

- **Görüntü:** USB ile telefon bağlanır; sağ üstte "Bağlı" rozeti belirir, cihaz
  listesi otomatik yenilenir. Yetkisiz cihazda "USB hata ayıklamaya izin ver"
  rehberi + RSA parmak izi gösterilir.
- **Anlatım:** "Telefonu USB ile taktığımızda uygulama onu saniyeler içinde
  algılıyor. İlk bağlantıda güvenlik için RSA parmak izi doğrulaması isteniyor."

## Sahne 3 — Cihaz Bilgisi (1:00-1:30)

- **Görüntü:** Cihaz detay sayfası açılır: model, üretici, Android sürümü, pil,
  ekran, CPU/RAM, depolama, root durumu.
- **Anlatım:** "Cihaza tıkladığımızda model, Android sürümü, pil, ekran, bellek ve
  depolama gibi tüm donanım bilgileri tek ekranda toplanıyor."

## Sahne 4 — Dosya Tarayıcı (1:30-2:00)

- **Görüntü:** Dosyalar sekmesi: klasör listeleme, görsel önizleme (thumbnail),
  sürükle-bırak ile dosya gönderme, toplu indirme/silme.
- **Anlatım:** "Dosya tarayıcıyla cihazdaki dosyaları listeleyip sürükle-bırak ile
  bilgisayara aktarabiliyoruz; görseller küçük önizlemelerle geliyor."

## Sahne 5 — Yedekleme (2:00-2:40)

- **Görüntü:** Yedekleme sekmesi: fotoğraf/kişi/SMS/uygulama seçilir, ilerleme
  çubuğu dolar, zip oluşur, rapor gösterilir.
- **Anlatım:** "Yedekleme motoru fotoğraf, kişi, SMS ve uygulama verilerini tek
  tıkla zip'liyor; ilerlemeyi canlı izliyor, istediğimiz anda iptal edebiliyoruz.
  Hassas yedekler istenirse AES-256 ile şifreleniyor."

## Sahne 6 — Cihaz Testleri (2:40-3:10)

- **Görüntü:** Testler sekmesi: ekran/dokunmatik/ses/kamera/pil testleri çalışır,
  sonuçlar PDF rapor olarak alınır.
- **Anlatım:** "İkinci el cihaz kontrolü için 12 donanım testi var; ekran, dokunmatik,
  ses, kamera ve pil testleri çalışıp PDF rapor üretiyor."

## Sahne 7 — Kapanış (3:10-3:40)

- **Görüntü:** GitHub deposu (README, LICENSE), CI rozetleri, sürüm paketleri
  (AppImage/.exe/.dmg).
- **Anlatım:** "Telefon açık kaynak; MIT lisanslı. Windows, macOS ve Linux için
  hazır kurulumcuları ve otomatik güncellemesi var. Kaynak koda katkıda
  bulunabilirsiniz."

## Üretim Notları

- Kayıt: OBS, 1080p, 30 fps; uygulama `npm run dev` ile çalışırken çekilir.
- Cihaz yoksa ADB emülatörü veya `tests/fixtures/fake-adb.sh` kullanılabilir
  (ancak gerçek cihaz görüntüsü daha inandırıcıdır).
- Altyazı ve kapanış kartı için `sunum/` içindeki ikon kullanılabilir.
