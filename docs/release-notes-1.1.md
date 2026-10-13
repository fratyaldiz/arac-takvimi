# 1.1 sürüm notları

## App Store — "What's New" (Türkçe yerelleştirme)

```
- Yakıt fiyatı yenileme hatası giderildi: bağlantı takılırsa artık yenile düğmesi çalışmaya devam ediyor, hata açıkça yazılıyor.
- Uygulama dili Türkçe olarak tanıtıldı.
- Ayarlar'a "Mağazada puan ver" eklendi.
- Pro özellikleri hazırlandı: sınırsız araç, belge cüzdanı, masraf raporu ve CSV dışa aktarma. Satın alma çok yakında açılıyor.
```

## App Store — "What's New" (English (U.S.) yerelleştirmesi)

```
- Fixed fuel price refresh: a stalled request no longer blocks the refresh button, and errors are now shown clearly.
- The app is now listed as Turkish.
- Added "Rate the app" in Settings.
- Pro features are in place: unlimited vehicles, document wallet, expense report and CSV export. Purchasing opens soon.
```

## Google Play — sürüm notu (tr-TR)

```
<tr-TR>
- Yakıt fiyatı yenileme hatası giderildi
- Ayarlar'a "Mağazada puan ver" eklendi
- Pro özellikleri hazırlandı: sınırsız araç, belge cüzdanı, masraf raporu, CSV dışa aktarma
</tr-TR>
```

## Bu sürümde ne var

| Değişiklik | Commit |
|---|---|
| Pro kapısı, paywall ekranı, ücretsiz araç sınırı | `2a19856` |
| CSV dışa aktarma | `e2932d8` |
| Masraf raporu ekranı | `00f2ceb` |
| Belge cüzdanı + kayıt şeması v3 | `61423e0` |
| Yakıt fiyatı yenileme kilitlenmesi düzeltmesi | `8a740f1` |
| Uygulama içi puan isteği + mağaza bağlantısı | `58fad76` |
| Sürüm 1.1.0, Türkçe dil etiketi | bu commit |

## Bu sürümde **olmayan**

- **Satın alma kapalı.** `src/pro/iap.ts` içinde `PURCHASES_ENABLED = false`; paywall "Satın alma yakında" diyor ve düğme pasif. Mağazada ürün tanımlanıp `expo-iap` bağlanınca 1.2 ile açılacak.
- Özelleştirilebilir hatırlatma (Pro listesinde duruyor ama kodlanmadı) — 1.2.
- İl bazlı yakıt fiyatı — ücretli API gerektiriyor.

## Yayın adımları

1. Derleme (Apple girişi etkileşimli olduğu için Fırat çalıştırır):
   ```
   npx eas-cli build -p ios --profile production
   npx eas-cli submit -p ios --latest
   ```
2. App Store Connect > "+ Version or Platform" > 1.1 > yukarıdaki "What's New" metni > build seç > incelemeye gönder.
3. Android:
   ```
   npx eas-cli build -p android --profile production
   ```
   AAB'yi Play Console > Kapalı test > yeni sürüm olarak yükle (dosya 10 MB'ı aştığı için yüklemeyi Fırat yapar).
4. Kapalı testte 12 kayıtlı kullanıcı şartı sürüyor; şu an 2/12.
