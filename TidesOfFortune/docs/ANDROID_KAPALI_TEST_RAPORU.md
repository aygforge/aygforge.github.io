# Tides of Fortune — Android kapalı test sürümü raporu (0.1.0 / 1)

> ⚠️ **Bu derleme yalnızca Google Play KAPALI TEST kanalı içindir. Üretim (production) kanalına doğrudan
> çıkarılmamalı, Play Console'da "üretime yükselt" (promote) ile de taşınmamalıdır.**
> Nedenleri:
> 1. Tam oyun ücretsiz açıktır; satın alma yoktur.
> 2. Çoklu dil desteği yoktur.
> 3. Gerçek Android cihaz veya emülatörde çalıştırılarak doğrulanmamıştır.
>
> Üretim sürümü, dil ve satın alma sistemi eklendikten sonra yeni bir `versionCode` ile ayrıca derlenip test edilmelidir.

## 1. Teslim edilenler
| Dosya | Açıklama |
|---|---|
| `TidesOfFortune-0.1.0-vc1-closedtest.aab` | İmzalı release Android App Bundle (3,3 MB) |
| `tidesoffortune-upload.p12` + `keystore.properties` | Yükleme anahtarı ve şifreleri (**depoda yok**; güvenli yerde saklayın) |
| `android/` (depoda) | Capacitor Android projesi, ikonlar, açılış ekranı, imza yapılandırması |
| `docs/ANDROID.md` | Derleme ve güncelleme kılavuzu |

**AAB doğrulama bilgileri**
- AAB SHA-256: `13f624b5a7d283e4d66a5db2be8975d974d772e75f435ed3515f0a9db2d91057`
- İmza: `jarsigner -verify` → *jar verified*, imzalayan `CN=Ayg Forge, O=Ayg Forge`
- Yükleme sertifikası SHA-256: `03:EB:3B:15:2C:C0:0E:BE:78:FD:35:1C:55:BA:02:43:C2:28:3A:7D:84:2D:0A:77:A3:A0:48:21:B6:F0:94:6C`
- Yükleme sertifikası SHA-1: `04:E5:6A:24:BC:55:4C:E9:D0:D5:A9:AE:8B:2E:8F:33:D6:2E:83:DA`
- Anahtar: RSA 4096, PKCS12, takma ad `upload`, geçerlilik 2054'e kadar
- AAB içindeki `game.js`, depodaki `dist/web/game.js` ile birebir aynıdır (SHA-256 eşleşti).
- Yerel (.so) kütüphane yoktur; Play'in 16 KB bellek sayfası şartı bu uygulamayı etkilemez.

**Paketlenen manifest (birleştirilmiş)**
- Paket: `com.aygforge.tidesoffortune`
- versionCode 1, versionName 0.1.0
- minSdk 24, targetSdk 36
- Etkinlik `sensorLandscape`
- `allowBackup=true`
- İzinler: yalnızca `INTERNET`. Capacitor şablonunun standart izni; oyun ağ kullanmaz.

## 2. Uygulama kimliği — onay bekliyor
`com.aygforge.tidesoffortune`, verdiğiniz değer olarak derlemeye yazıldı. Bu kimlik, AAB **Play Console'a ilk
yüklendiğinde kalıcılaşır** ve sonradan değiştirilemez. Ben yükleme yapmadım.
Kimliği onaylamadan AAB'yi yüklemeyin. Değişiklik gerekirse iki yerde güncellenip yeniden derlenmelidir:
- `capacitor.config.json` → `appId`
- `android/app/build.gradle` → `namespace` ve `applicationId` (Java paket klasörüyle birlikte)

## 3. Kapsam (istenenler)
| İstek | Durum |
|---|---|
| Tam HTML5 sürümü, mekanikler ve kayıt yapısı korunarak Android'e | ✅ Oyun kodu değişmedi; aynı `dist/web` paketlendi |
| Çoklu dil | ⛔ Eklenmedi (istenmedi) |
| Demo sınırı veya satın alma kilidi | ⛔ Eklenmedi |
| Google Play Billing veya reklam | ⛔ Eklenmedi; bağımlılık yok |
| Tam oyun testçilere açık | ✅ |
| İmzalı release AAB | ✅ |
| Kayıt uyumluluğu ve güncellenebilirlik | ✅ Bkz. bölüm 4 |
| Ücretsiz erişim kalıcı satın alma hakkı tanımlamaz | ✅ Bkz. bölüm 5 |

## 4. Kayıt uyumluluğu ve güncellenebilirlik
- **Kayıt biçimi aynı:** anahtarlar `tof.meta`, `tof.run`, `tof.settings` (+ `.bak`), kayıt sürümü 7.
  Gelecek sürümler mevcut göç zinciriyle (`SaveManager`) bu kayıtları okur.
- **Sabit adres:** WebView kaydı `https://localhost` adresine bağlıdır. Adres `capacitor.config.json` içinde açıkça
  sabitlendi; Capacitor'ın varsayılanı ileride değişse bile kayıtlar kaybolmaz.
- **İkinci kopya:** Android'de her kayıt ayrıca SharedPreferences'a yazılır. WebView deposu tamamen boşalırsa
  açılışta oradan geri yüklenir. Bitmiş bir seferin silinmiş kaydı gibi kısmi eksikler bilerek geri getirilmez.
- **Arka plana alınınca kayıt:** Uygulama arka plana alındığında (`pause`) ve görünmez olduğunda oyun hemen kaydedilir.
- **Service worker kapalı:** Android'de devre dışı. Mağaza güncellemesinden sonra eski dosyalar önbellekten sunulmaz.
- **Android yedeklemesi açık** (`allowBackup`).
- **Sonraki yüklemelerde** yalnız `versionCode` artırılmalı. Uygulama kimliği, adres ve yükleme anahtarı aynı kalmalı.

## 5. Ücretsiz test erişimi kalıcı hak değildir
- Bu derleme hiçbir satın alma, hak (entitlement) ya da "tam oyun açık" bilgisi **yazmaz**.
  Kayıtta böyle bir alan yoktur; birim testiyle doğrulandı (`tests/native.test.mjs`).
- Tam oyunun açık olması yalnızca bu derlemenin davranışıdır, oyuncu verisine işlenmez.
- Sonraki aşama için öneri:
  - Tek seferlik "tam oyun" ürünü, Play Billing satın alma kayıtlarından (`queryPurchasesAsync` + onaylama) okunmalı.
  - Yerel kayıt yalnızca önbellek/ipucu olarak kullanılmalı, asla kaynak olmamalı.
  - Böylece kapalı testte ücretsiz oynayan testçiler de ilk turdan sonra diğer oyuncularla aynı kilide gelir.
    İlerlemeleri (kayıtları) korunur ama satın alma hakkı kazanmazlar.
  - Satın almayı denemek için Play Console "lisans testçisi" hesapları kullanılabilir.

## 6. Android'e özgü düzenlemeler
- **Uygulama kimliği:** ad "Tides of Fortune", kimlik `com.aygforge.tidesoffortune`, sürüm 0.1.0 (kod 1).
- **Ekran:** yatay ve tam ekran; sistem çubukları gizli, kenardan kaydırınca geçici görünür.
- **Çentik ve güvenli alan:** Capacitor SystemBars boşlukları CSS değişkeni olarak verir; oyunun yerleşimi bunları
  `env(safe-area-inset-*)` ile birlikte okur.
- **Geri tuşu:**
  1. Açık pencereyi kapatır.
  2. Pencere yoksa haritayı veya alt ekranı kapatır.
  3. En sonda oyunu kapatmadan arka plana alır.
- **Tam ekran düğmesi:** Menüdeki tarayıcı tam ekran düğmesi gizlendi.
- **Görseller:** Oyunun piksel ikonundan uyarlanabilir ikon (gemi güvenli alanın içinde), yuvarlak ikon ve koyu
  açılış ekranı üretildi (`tools/android-assets.py`).
- **Güvenlik:** Release'te WebView hata ayıklaması kapalı; karışık içerik (http) kapalı.

## 7. Yapılan testler
| Test | Sonuç |
|---|---|
| Birim testleri (`npm test`, Android kayıt yedeği testleri dahil) | 82/82 geçti |
| Tarayıcı oynanış testi (`tests/browser.test.cjs`) | 16/16 geçti |
| `dist/web` paketinin (Android'e giden dosyalar) yerel sunucudan açılması | Hatasız; kayıt anahtarları değişmedi |
| AAB imza doğrulaması (`jarsigner`) | Doğrulandı |
| AAB içeriği ↔ derleme eşleşmesi (game.js SHA-256) | Eşleşti |
| Anahtar yokken release derlemesi | Beklendiği gibi açık hatayla durdu (imzasız AAB üretilmedi) |

**Yapılamayanlar (açıkça):**
- **Android cihaz veya emülatörde çalıştırılmadı.** Derleme ortamında donanım sanallaştırması (KVM) yoktu.
  Bu yüzden şunlar gerçek cihazda doğrulanmadı:
  - geri tuşu
  - tam ekran ve çentik boşlukları
  - açılış ekranı ve ikonun görünümü
  - ses
  - arka plana alıp geri dönme
  - SharedPreferences yedeğinin gerçek yazımı (bu yalnızca sahte depoyla birim testinden geçti)
- `bundletool validate` çalıştırılamadı. Bu ortamda internetten indirilen aracın çalıştırılmasına izin verilmedi.
  Manifest, Gradle'ın AAB'ye koyduğu birleştirilmiş manifestten okundu.
  Play Console yükleme sırasında AAB'yi ayrıca doğrular.

## 8. Kapalı teste başlamadan önce sizin yapmanız gerekenler (Play Console)
1. Uygulama kimliğini onaylayın (bölüm 2). Ardından uygulamayı oluşturun ve **Play App Signing**'i kabul edin.
2. AAB'yi **Kapalı test** kanalına yükleyin. Üretim veya açık test kanalına yüklemeyin.
3. Zorunlu formlar:
   - **Gizlilik politikası URL'si:** oyun veri toplamasa da gerekir.
   - **Veri güvenliği:** veri toplanmıyor ve paylaşılmıyor. Kayıtlar yalnız cihazda tutulur; Android yedeklemesi açıktır.
   - **İçerik derecelendirme anketi**
   - **Hedef kitle**
   - **Reklam içeriği:** yok.
4. Mağaza girişi:
   - 512×512 ikon: `assets/icons/icon-512.png` kullanılabilir.
   - **1024×500 öne çıkan görsel** ve **ekran görüntüleri** hazırlanmadı; sizin eklemeniz gerekir.
5. Testçi listesi (e-posta veya Google Grubu) ve geri bildirim kanalı.

## 9. Testçiler için kısa kontrol listesi
- Yükleme ve ilk açılış: ikon, açılış ekranı, yatay yön.
- **Kayıt kalıcılığı:** Bir sefere başlayın, uygulamayı arka plana alın, son uygulamalardan kapatın ve yeniden açın.
  Kaldığınız yerden devam etmeli.
- **Geri tuşu:** açık pencere → kapanır; harita → kapanır; menüde → uygulama arka plana gider (kapanmaz).
- **Ekran:** Çentikli telefonda üst bilgi çubuğu ve düğmeler kesilmemeli. Kenardan kaydırınca sistem çubukları
  geçici görünmeli.
- **Ses:** müzik ve efektler; telefon kilitlenince ses durmalı.
- **Uzun oynanış:** ısınma ve kare hızı (özellikle limana yanaşma ve kalabalık sahneler).

## 10. Derleme ortamı notları
- **Araçlar:** Capacitor 8.6.2, Android Gradle Plugin 8.13.0, Gradle 8.14.3, JDK 21, build-tools 36.0.0.
- **Maven Central:** Derlemede Maven Central geçici olarak "çok fazla istek" (429) verdi; tekrar denemeyle tamamlandı.
  Depoda bu yüzden bir değişiklik yok.
- **`npm audit`:** 1 orta seviye uyarı verdi. Uyarı yalnızca geliştirme aracında (esbuild); uygulamaya girmez.
- **Yükleme anahtarı:** Geçici bir bulut ortamında üretildi ve size iletildi. Ortam kapanınca oradaki kopya silinir.
  **Anahtarı ve şifreleri güvenli bir yere yedekleyin.** Kaybolursa Play Console'dan yükleme anahtarı sıfırlatılabilir.
