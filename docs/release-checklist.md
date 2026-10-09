# App Store yayın adımları

Durum: kod ve mağaza içeriği hazır; kalan adımlar Apple hesabı gerektiriyor.

## Tamamlananlar

- [x] Bundle ID: `com.aractakvimi.app` (değiştirilemez)
- [x] `eas.json` build profilleri
- [x] İkon, açılış görseli (1024x1024, saydamlıksız)
- [x] Gizlilik + destek sayfası: https://fratyaldiz.github.io/arac-takvimi-gizlilik/
- [x] Destek e-postası: aractakvimi.destek@gmail.com
- [x] Yedekleme (dışa/içe aktarma), Ayarlar ekranı, yasal uyarı
- [x] Mağaza metinleri: `docs/store-listing.md`
- [x] Ekran görüntüsü hazırlama betiği: `scripts/make-screenshots.mjs`
- [x] İlk production build alındı ve App Store Connect'e yüklendi
      (ASC App ID 6817512595, TestFlight: https://appstoreconnect.apple.com/apps/6817512595/testflight/ios)

## App Store Connect'te doldurulanlar (2026-09-30)

- [x] Ad/alt başlık: Araç Takvimi / Muayene, MTV ve masraf takibi
- [x] Kategori: Utilities (birincil), Finance (ikincil)
- [x] İçerik hakları: üçüncü taraf içerik var, haklar mevcut (yakıt fiyatı servisi)
- [x] Yaş sınırı anketi → 4+ (172 ülke)
- [x] Gizlilik politikası adresi + "veri toplanmıyor" beyanı yayınlandı
- [x] Fiyat: ücretsiz, 175 ülkede kullanılabilir
- [x] Tanıtım metni, açıklama, anahtar kelimeler, destek adresi, telif (İngilizce)
- [x] Türkçe yerelleştirme eklendi (açıklama + anahtar kelimeler)
- [x] Build 1 (1.0.0) sürüme eklendi
- [x] Yayın biçimi: inceleme onayından sonra otomatik
- [x] App Review iletişim bilgileri (ad, telefon, e-posta) ve inceleme notları
- [x] Ekran görüntüleri: TestFlight sürümünden çekildi, 1242x2688 (6.5") olarak
      markalı tuvale yerleştirilip yüklendi (5 adet)

## Kalan adımlar

0. **DURUM: 2 Ekim 2026'da yeniden incelemeye gönderildi (Waiting for Review).**

   Birinci gönderim 1 Ekim 08:01'de reddedildi: **Guideline 2.1 - Information
   Needed - New App Submission**. Uygulamada kusur bulunmadı; yeni geliştirici
   hesabı olduğu için ek bilgi istendi (fiziksel cihazda ekran kaydı + amaç,
   kullanım talimatı, dış servisler, bölgesel fark, düzenleme/üçüncü taraf
   içerik). Yapılanlar:
   - 2-6. maddelerin yanıtı App Review Information > Notes alanına yazıldı (3032 karakter)
   - Ekran kaydı iPhone'da TestFlight derlemesiyle çekildi, Drive'da herkese açık
     bağlantıyla paylaşıldı, Resolution Center yanıtında verildi
   - Yanıt 4000 karakterle sınırlı; metin 3957 karaktere kısaltıldı
   - Rejected sürüm doğrudan "Resubmit" edilemiyor: önce sürüm sayfasındaki
     **Update Review** basılıp durum "Ready for Review" olmalı, sonra
     **Resubmit to App Review** çalışıyor
   - Yayın biçimi: onaydan sonra otomatik (AFTER_APPROVAL) olarak kaldı

   Eski kayıt: 30 Eylül 2026 08:19'da ilk kez gönderilmişti.

   9 Ekim 2026: 7 gündür Waiting for Review'da beklediği için Apple'a durum
   sorgusu açıldı (Contact Us > App Review > App Review Status > Email).
   **Case ID 102991236675.** Resolution Center'daki mevcut konuya yeni mesaj
   yazılmadı; sıra kaybı riski olmasın diye ayrı destek kaydı tercih edildi.
   Apple genelde 48 saat içinde dönüyor; sonuç e-postayla geliyor. Onaylanırsa
   sürüm otomatik yayına girer.
   Not: "Sign-in required" kutusu varsayılan işaretli geliyordu, demo hesap
   istediği için gönderimi engelledi; kaldırıldı.

1. **Derleme** (tamamlandı, referans için):
   ```
   npx eas-cli build -p ios --profile production
   ```
   Sorular: "Generate a new Apple Distribution Certificate?" → evet.
   "Generate a new Apple Provisioning Profile?" → evet.

2. **App Store Connect'e yükleme**:
   ```
   npx eas-cli submit -p ios --latest
   ```
   Uygulama kaydı yoksa EAS oluşturmayı önerir; ad "Araç Takvimi", SKU `aractakvimi`.

3. **TestFlight**: yükleme bitince TestFlight'tan kendi telefonuna kur, gerçek
   derlemede dolaş. Expo Go'nun geliştirici düğmesi burada olmaz.

4. **Ekran görüntüleri**: TestFlight sürümünde 5 ekranı çek (Takvim, Garaj,
   Masraflar, araç detayı, Yolda), sonra:
   ```
   node scripts/make-screenshots.mjs <ham-klasör> <çıktı-klasörü>
   ```
   Çıktı 1290x2796 olur; App Store Connect'e yüklenir.

5. **Mağaza formu**: `docs/store-listing.md` içindeki metinler girilir.
   App Privacy → "Data Not Collected". Tracking → Hayır.

6. **İncelemeye gönder.** Apple genelde 1-3 gün içinde döner.

## Google Play durumu (1 Ekim 2026)

- [x] Uygulama kaydı: Araç Takvimi, com.aractakvimi.app, Türkçe, ücretsiz
- [x] Mağaza girişi: kısa/tam açıklama, 512 ikon, 1024x500 öne çıkan görsel,
      5 ekran görüntüsü (Play 9:16 ister → 1242x2208 üretildi)
- [x] Tüm uygulama içeriği beyanları: gizlilik politikası, reklam yok,
      reklam kimliği yok, uygulama erişimi kısıtsız, içerik derecelendirme
      (anket + IARC), hedef kitle 18+, veri güvenliği "veri toplanmıyor",
      resmi kurum değil, finans özelliği yok, sağlık özelliği yok
- [x] Mağaza ayarları: kategori Otomobil ve Araçlar, destek e-postası, web sitesi
- [x] Kapalı test (Alpha) kanalı kurulumu 2/4: ülke = Türkiye, test kullanıcıları seçildi
      - Yeni e-posta listesi "Araç Takvimi testçileri" (firatylz18@gmail.com,
        aractakvimi.destek@gmail.com) + hesapta var olan "Test" listesi (21 kişi)
        işaretlendi → 23 davetli
      - Geri bildirim adresi: aractakvimi.destek@gmail.com
- [x] **AAB yüklendi** (Fırat yükledi, 4 Ekim 2026 20:14): sürüm kodu 2, 1.0.0,
      hedef SDK 36, API 24+, indirme boyutu 21.7 MB.
      Not: aynı dosya ikinci kez yüklenince "2 sürüm kodu daha önce kullanıldı"
      hatası çıkıyor; çözüm dosyayı tekrar yüklemek değil **Kitaplıktan ekle**.
- [x] Sürüm hazırlandı ve gönderildi (5 Ekim 2026): sürüm adı "2 (1.0.0)",
      Türkçe sürüm notu girildi, Yayın özetinden 14 değişiklik incelemeye
      gönderildi. Kanal durumu: **Etkin · 2 (1.0.0) sürümü incelemede · 1 ülke**.
      Tek uyarı: R8/proguard eşleme (deobfuscation) dosyası yok — engelleyici değil.
- [x] Google incelemesi geçildi (9 Ekim 2026): kanal "Etkin · Son sürüm 2 (1.0.0) · 1 ülke".
      Katılım bağlantısı: https://play.google.com/apps/testing/com.aractakvimi.app
      Kayıtlı test kullanıcısı: 1 / 12
- [ ] Google incelemesi bitip sürüm yayına girince katılım bağlantısı
      (https://play.google.com/apps/testing/com.aractakvimi.app) etkinleşir;
      test kullanıcıları bu bağlantıdan kaydolmalı. Panoda hâlâ
      "0 test kullanıcısı kayıtlı"; 12 **kayıtlı** kullanıcı şartı buradan sayılıyor
      (davet etmek yetmiyor). Şu an listelerde 23 davetli var.
- [ ] 14 gün kesintisiz kapalı test, sonra üretim erişimi başvurusu

## Sürüm 1.1 planı

- İl bazlı yakıt fiyatı (ücretli API + Cloudflare Worker proxy)
- Hata izleme (Sentry)
- Google Play yayını (12 test kullanıcısı x 14 gün kapalı test şartı)
