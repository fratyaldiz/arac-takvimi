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

## Kalan adımlar

1. **Derleme** (Apple girişi tarayıcıda onay ister, bu yüzden Fırat çalıştırır):
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

## Sürüm 1.1 planı

- İl bazlı yakıt fiyatı (ücretli API + Cloudflare Worker proxy)
- Hata izleme (Sentry)
- Google Play yayını (12 test kullanıcısı x 14 gün kapalı test şartı)
