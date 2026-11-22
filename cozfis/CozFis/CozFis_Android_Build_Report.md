# CozFis — Android Derleme Raporu (Faz 3)

Kaynak: Faz 2 modüler projesi (`cozfis/CozFis/`, commit `274ef8a`). Android uygulamasının web içeriği `npm run build`
çıktısı olan `dist/web` klasörüdür. Tek dosyalık sürüm (`CozFis_Standalone.html`) kullanılmadı.

## 1. Özet

| Teslim | Durum |
|---|---|
| `CozFis_Debug.apk` | ✅ **Gerçekten derlendi.** Debug anahtarıyla imzalı (`apksigner verify` başarılı), 8,52 MB, `com.aygforge.cozfis.debug`. Emülatöre kuruldu ve etkinlik başlatıldı (bkz. §5) |
| Release APK / AAB | ✅ Derleme hattı çalışıyor: `CozFis_Release.apk` 7,42 MB, `CozFis_Release.aab` 6,70 MB. ⚠️ **İmzasız taslaklardır**, yüklenemez (yayın anahtarı yok, bkz. §7) |
| Emülatörde oynanış testi | ❌ **Yapılamadı.** Ortamda donanım hızlandırma (KVM) yok. Yazılımsal öykünmede Android System WebView başlatılırken çöküyor. Sistemin kendi WebView test uygulaması da aynı şekilde çöküyor, yani sorun CozFis'te değil (§5) |
| Gerçek cihaz testi | ⏭️ Fiziksel cihaz bağlı değildi → `CozFis_Android_Test_Checklist.md` |
| Android kabuk mantığı | ✅ 16/16. Ancak bu bir **simülasyondur**: masaüstü Chromium + sahte Capacitor köprüsü (§6) |
| Web regresyonu (Faz 2 testleri) | ✅ Hepsi geçti (§6) |

## 2. Araç zinciri ve sürümler

| Bileşen | Sürüm |
|---|---|
| Capacitor (`@capacitor/core`, `cli`, `android`) | **8.6.2** (en son kararlı sürüm; 9.0 henüz RC) |
| Eklentiler | `@capacitor/app` 8.1.2 (geri tuşu, yaşam döngüsü), `@capacitor/filesystem` 8.1.5 ve `@capacitor/share` 8.0.3 (kayıt/fotoğraf dışa aktarma). SystemBars Capacitor 8 çekirdeğinde |
| compileSdk / **targetSdk** / minSdk | 36 / **36** (Android 16) / 24 (Android 7.0) |
| Android Gradle Plugin | 8.13.0 |
| Gradle (sarmalayıcı) | 8.14.3 |
| Java | OpenJDK 21.0.13 |
| Build-Tools | 36.0.0 (AGP ayrıca 35.0.0'ı indirdi) |
| Android SDK komut satırı araçları | 23.0 |
| AndroidX | core 1.17.0, appcompat 1.7.1, activity 1.11.0, webkit 1.14.0 |

Ortama özgü iki not:
- Ağ politikasında `dl.google.com` açıldı; Android SDK oradan indirildi.
- Maven Central (`repo.maven.apache.org`) vekil üzerinden 429 döndürdüğü için yalnızca bu makinede `~/.gradle/init.d/central-mirror.gradle`
  ile aynı içeriğin `repo1.maven.org` aynasına yönlendirildi. Proje dosyaları bundan etkilenmez.

## 3. Uygulama kimliği, ad, ikon

| Alan | Değer | Durum |
|---|---|---|
| Release `applicationId` | `com.aygforge.cozfis` | ⚠️ **GEÇİCİ.** Depoda, Play Console bilgisinde ya da marka dosyalarında kayıtlı bir kimlik bulunamadı. Depoda yalnızca `app-ads.txt` dosyası var: bir AdMob yayıncı satırı içeriyor, uygulama kimliği içermiyor. Yayından önce onaylanmalı; Google Play'e ilk yüklemeden sonra kimlik değiştirilemez |
| Debug `applicationId` | `com.aygforge.cozfis.debug` | Test içindir; yayın sürümüyle yan yana kurulabilir |
| Görünen ad | `CozFis` (debug: `CozFis (debug)`) | ✔ |
| İkon ve açılış ekranı | Oyunun çipura sprite'ı (`assets/fish/fish_cipura_left.png`), koyu mor zemin üzerinde | ⚠️ **GEÇİCİ geliştirme ikonu.** Stüdyonun marka logosu değildir, gerçek ikonla değiştirilmelidir |
| Sürüm | `versionCode 1`, `versionName 0.3.0` | `android/version.properties` dosyasından düzenlenir |

## 4. Uygulanan Android uyarlamaları

**Yapılandırma** (`capacitor.config.json`, `AndroidManifest.xml`, `app/build.gradle`)
- `webDir: dist/web`. Web dosyaları APK'nın içinde (`assets/public`, 82 dosya). Yapılandırmada geliştirme sunucusu
  adresi (`server.url`) yok.
- Köken `https://localhost` olarak sabitlendi (`androidScheme: https`, `hostname: localhost`). Kayıt anahtarları kökene bağlı
  olduğundan bu değer sonraki sürümlerde **değiştirilmemelidir**.
- **İzin yok.** İnternet izni de kaldırıldı (`tools:node="remove"`). Cihaza kurulumda "install permissions" listesi boş.
  APK'da görünen tek kayıt, AndroidX'in uygulamanın kendisine özel, imza düzeyindeki `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` kaydıdır.
- `screenOrientation="sensorLandscape"`. Emülatörde ekran 2400×1080 yatay açıldı.
- Debug ve release ayrı. Release: `debuggable false`, WebView hata ayıklama kapalı (Capacitor varsayılanı), imza
  `keystore.properties` dosyasından okunur (dosya Git'e girmez).
- **16 KB bellek sayfası uyumu:** APK ve AAB'de yerel `.so` kütüphanesi **yok**; Capacitor ve kullanılan eklentiler saf Java/Kotlin.
  Bu yüzden 16 KB hizalama gereksinimi uygulama tarafında karşılanmış durumdadır. WebView sistemden gelir.

**Ekran** (`MainActivity.java` + `android.js`)
- Sürükleyerek açılabilen tam ekran: sistem çubukları gizlenir, kenardan kaydırınca geçici olarak görünür.
- Ekran kesiğine yerleşim (`LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS`). Capacitor SystemBars `--safe-area-inset-*` değişkenlerini
  gönderir; `android.js` bunları oyunun mevcut `#safeprobe` ölçümüne ekler.
  - 640×360 mantıksal çözünürlük ve en-boy oranını koruyan ölçekleme **değişmedi**.
  - Canvas fiziksel piksellerle çizilir (DPR ≤ 3) ve görüntü yumuşatma kapalıdır.
- WebView'de yakınlaştırma kapalı, `textZoom` 100'e sabit (sistem yazı boyutu düzeni bozmaz), kaydırma taşma efekti kapalı.
  Uzun basış menüsü metin kutuları dışında kapalı. Oyunun kendi CSS kuralları (touch-action, user-select) zaten vardı.
- **Android 16 notu:** Hedef API 36'da, büyük ekranlarda (en kısa kenar ≥ 600 dp: tablet, katlanabilir) sistem yön kısıtını yok
  sayabilir. O durumda oyun kendi "telefonu yatay çevirin" ekranını gösterir. Telefonlarda yön kısıtı geçerlidir.

**Geri tuşu** (`android.js`)
- Oyunun mevcut Escape mantığını kullanır: fotoğraf modu → pencere → panel → atış iptali.
- Oyunda açık bir şey yoksa mevcut Menü paneli açılır.
- Karakter oluşturmada mevcut "ana menüye dön" eylemi çalışır.
- Ana menüde ilk basış "Çıkmak için geri tuşuna tekrar bas" uyarısını gösterir. 2 saniye içindeki ikinci basış kaydedip uygulamayı kapatır.
- Yeni bir kontrol sistemi eklenmedi.

**Ses ve yaşam döngüsü**
- Arka plana geçiş (`appStateChange`, `pause`): web'deki `visibilitychange` ile aynı işlem yapılır — duraklat, kaydet (`Save.now`), sesi askıya al.
- Dönüş: döngünün zaman damgası (`lastTs`) sıfırlanır. Böylece zaman sıçraması ya da hızlanma olmaz. Mevcut 50 ms'lik `dt` sınırı da yerinde.
- Ses odağı: arama veya başka bir uygulama ses aldığında yerel taraftan gelen olayla ses askıya alınır, odak dönünce sürer.

**Kayıt**
- Anahtarlar, biçim ve şema değişmedi: IndexedDB `cozyfishing` / `saves`, localStorage anahtarları, `cozyfishing-save`, şema 5.
- Dışa aktarma: `<a download>` + Blob tıklaması yakalanır, dosya önbelleğe yazılır ve Android paylaşım sayfası açılır. Bu, kayıt dosyası,
  bozuk kayıt ve fotoğraf modu için geçerlidir; oyun kodu değişmedi.
- İçe aktarma: mevcut `<input type=file>` kullanılır. Capacitor bunu Android dosya seçicisine bağlar.

**Diller:** Yeni Android mesajları (geri tuşu uyarısı, paylaşım başlığı, paylaşım hatası) 6 dile eklendi; her dilde anahtar sayısı 2.207'den 2.210'a çıktı.
Mevcut çeviriler değiştirilmedi.

## 5. Emülatör testi — sonuç ve sınırlar

| | |
|---|---|
| Emülatör | Android Emulator 37.3.10. AVD: `system-images;android-36;aosp_atd;x86_64` (Android 16, ATD), Pixel 7 profili, 1080×2400, 420 dpi |
| WebView | `com.android.webview` 133.0.6943.137 |
| Hızlandırma | **Yok.** Ortamda `/dev/kvm` olmadığı için `-accel off` (TCG yazılımsal CPU) ile zorlandı. Açılış 3–10 dakika sürdü; sistem gözetleyicisi (watchdog) `system_server`'ı birkaç kez yeniden başlattı |

Emülatörde **doğrulananlar:**
- APK kurulumu başarılı (`pm install` → Success).
- `versionCode=1`, `minSdk=24`, `targetSdk=36` doğru okundu.
- Kurulum izni listesi boş.
- Etkinlik `singleTask` olarak başlatıldı ve ekran yatay (2400×1080) açıldı.
- WebView yerel kütüphanesi yüklendi.

Emülatörde **doğrulanamayanlar:**
- Ekranda oyunun görüntülenmesi ve emülatörde oynanış (yeni oyun, balık tutma, kayıt, dil, ses).
- Sebep: CozFis süreci WebView başlatılırken `libwebviewchromium.so` içinde SIGTRAP ile çöktü. Bu, Chromium'un kendi
  denetimidir. Denendi:
  - `-gpu swiftshader_indirect`
  - `-gpu guest`
  - `-qemu -cpu max`

  Üçünde de sonuç aynıydı.
- **Kontrol deneyi:** Sistemin kendi WebView test uygulaması (`org.chromium.webview_shell`) aynı emülatörde aynı adreste ve aynı
  şekilde (SIGTRAP) çöktü. Bu, sorunun CozFis APK'sında değil, hızlandırmasız emülatördeki WebView'de olduğunu gösteriyor.
- Bu nedenle emülatörde FPS ve bellek ölçülemedi. Android'de 60 FPS **varsayılmamalıdır**; ölçüm Test Checklist F4/F5 ile gerçek cihazda yapılmalıdır.
- Emülatöre kurulan APK, son iki küçük düzeltmeden önceki derlemeydi:
  - geri tuşu günlüğünde sahne adının kaydı,
  - debug derlemede WebView hata ayıklamanın açılması.

  Teslim edilen APK bu düzeltmelerle yeniden derlendi; emülatöre tekrar kurulmadı.

**Gerçek cihaz:** bağlı değildi. **Hiçbir madde gerçek cihazda test edilmiş olarak işaretlenmedi.**

## 6. Otomatik testler (bu ortamda çalıştırıldı)

**Android kabuk mantığı — SİMÜLASYON** (`tests/android-shell.js`, `reports/android_shell.json`)
- Kurulum: `dist/web` masaüstü Chromium'da Pixel 7 yatay öykünmesiyle (dokunmatik, DPR 2.625) açıldı; Capacitor köprüsü sahte bir nesneyle taklit edildi.
- Sonuç: **16/16 geçti**.

| Kontrol | Sonuç |
|---|---|
| Açılış | Yerel mod, ana menü |
| Ölçek | 16:9 korunuyor ve ortalanıyor; canvas fiziksel piksel; yumuşatma kapalı |
| Güvenli alan | 48 px kesik → oyun alanı 136 px içeride |
| Dokunma | Dokunuşla dil değişiyor, tercih saklanıyor |
| Geri tuşu | Ana menüde iki basışla çıkış; karakter oluşturucuda ana menüye dönüş; oyunda Menü paneli aç/kapa, onay penceresi ve envanter kapanıyor; uygulama yanlışlıkla kapanmıyor |
| Arka plan | Duraklıyor, kayıt yazılıyor (para 424.242), ses `suspended`; 2,5 sn boyunca `Game.t` ilerlemiyor |
| Dönüş | Ses `running`; iki kare 0,033 sn (zaman sıçraması yok) |
| Ses odağı | Kaybında askıda, geri gelince sürüyor |
| Dışa aktarma | `CACHE/exports/cozyfishing_gun1.json` (biçim `cozyfishing-save`, şema 5, `Save.unpack` geçerli) + paylaşım sayfası çağrısı |
| İçe aktarma | Dosya seçici → doğrulama → onay penceresi |
| Kabul testleri | Kabuk etkinken 149/149 |
| Sayfa hatası | 0 |

**Web regresyonu** (Faz 2 testleri, Android değişikliklerinden sonra)

| Test | Sonuç |
|---|---|
| Piksel doğrulama A (özgün) ↔ B (atlas), 6 dil | 9.071/9.071 önbellek girdisi, 2.982/2.982 data-URL, 258/258 sahne karesi **aynı**; 0 geri dönüş |
| Ekran A/B, 11 ekran × 6 dil | **66/66 ekranda fark 0 piksel** |
| Kabul testleri × 6 dil | 149/149 her dilde |
| Kayıt uyumluluğu (aynı köken, iki yönlü) | Geçti |
| Çevrimdışı statik tarama | 0 sorun |
| Duman testleri | Tek dosya `file://` 149/149; uzak istek 0; ses çalışıyor |
| Performans (masaüstü Chromium) | B açılış 214 ms, kasaba ilk kare 47 ms, ansiklopedi 9,6 ms, 60 FPS, kare çizimi 0,27 ms. **Android değeri değildir** |

İlk tam çalıştırmada ekran testi, emülatörle aynı anda yürütüldüğü için CPU yetersizliğinden zaman aşımına uğradı.
Emülatör kapatılıp yeniden çalıştırıldığında 66/66 geçti.

## 7. Yayın hazırlığı — tamamlanmamış adımlar

| Adım | Durum |
|---|---|
| AAB derleme komutu (`npm run android:aab` → `bundleRelease`) | ✅ Çalışıyor. Çıktı **imzasız taslak**, yüklenemez |
| Yükleme anahtarı (upload key) ve `keystore.properties` | ❌ Yok. Sahte bir anahtar **oluşturulmadı**; adımlar README_Android §6'da |
| Kalıcı uygulama kimliği | ❌ Onay bekliyor (`com.aygforge.cozfis` geçici) |
| Marka ikonu ve açılış ekranı | ❌ Geçici geliştirme ikonu kullanılıyor |
| Gizlilik politikası, veri güvenliği formu, mağaza girişi | ❌ Bu fazın kapsamı dışında |
| Gerçek cihaz testleri | ❌ `CozFis_Android_Test_Checklist.md` |

## 8. Bilinen sorunlar ve riskler

1. Oynanış bu ortamda Android üzerinde **hiç görülemedi** (§5). İlk gerçek cihaz testi kritik önemdedir.
2. WebView sürümü cihaza göre değişir.
   - Chromium 140'tan eski WebView'lerde Capacitor SystemBars kesik boşluğunu dolgu ile çözer; 140 ve sonrasında `env()` değerleri kullanılır.
   - Her iki yol da `#safeprobe` üzerinden oyunun ölçeğine yansır. Ancak farklı kesik tiplerinde (sol/sağ, köşe) görsel kontrol gerekir (Checklist A4).
3. Ses odağı alındığında, telefonda çalan başka bir müzik (Spotify vb.) durur. Bu, oyunlar için standart davranıştır.
4. `allowBackup="true"` (Capacitor varsayılanı) bırakıldı. Android'in otomatik yedeklemesi WebView verilerini ve dolayısıyla kayıtları da
   yedekleyebilir; cihaz değişiminde faydalıdır. İstenmezse kapatılabilir.
5. Tarayıcı sürümündeki kayıtlar uygulamaya otomatik taşınmaz (farklı köken). Taşıma yolu, oyunun "Kaydı dışa aktar / içe aktar"
   özelliğidir; bu akış Android paylaşım sayfası ve dosya seçicisiyle uyumlu hale getirildi.
6. Debug kimliği (`.debug`) ile yayın kimliği farklıdır. Debug sürümde yapılan test kayıtları yayın sürümüne geçmez. Bu bilinçli bir tercihtir.
