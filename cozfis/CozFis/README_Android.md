# CozFis — Android (Capacitor) Rehberi

CozFis'in Android sürümü, oyunun modüler web sürümünü (`dist/web/`) yerel bir Android uygulamasının içinde çalıştırır.
Bunun için Capacitor kullanılır. Oyunun kodu, grafikleri, dilleri ve kayıt sistemi web sürümüyle **aynıdır**.
Android'e özgü kod iki dosyadadır:

| Dosya | Görevi |
|---|---|
| `src/platform/android.js` | Uygulama içinde (web tarafında) çalışır. Geri tuşu, uygulama arka plana alınıp geri dönülmesi, ses odağı, dosya paylaşımı ve güvenli alan. Tarayıcıda hiçbir şey yapmaz. |
| `android/app/src/main/java/com/aygforge/cozfis/MainActivity.java` | Yerel (native) tarafta çalışır. Tam ekran yatay görünüm, ekran kesiği, WebView ayarları ve ses odağı. |

## 1. Gerekenler

| Araç | Sürüm |
|---|---|
| Node.js | ≥ 18 (22 ile test edildi) |
| JDK | **21** (Capacitor 8 / AGP 8.13 için zorunlu) |
| Android SDK | Platform **36**, Build-Tools **36.0.0** (Gradle, 35.0.0'ı kendisi indirir), Platform-Tools |
| Android Studio | Önerilir (Otter / 2025.2 veya daha yeni). Komut satırıyla da derlenebilir |
| Gradle | Sarmalayıcı (`android/gradlew`) 8.14.3'ü kendisi indirir |

SDK konumu iki yoldan biriyle bildirilir: `ANDROID_HOME` ortam değişkeni ya da `android/local.properties` içinde
`sdk.dir=/yol/Android/Sdk` satırı. Bu dosya Git'e eklenmez.

## 2. İlk kurulum

```bash
cd cozfis/CozFis
npm install                 # Capacitor 8.6.2 ve eklentileri (app, filesystem, share)
npm run android:sync        # dist/web üretilir ve android/app/src/main/assets/public klasörüne kopyalanır
```

## 3. APK üretmek

```bash
npm run android:apk         # → dist/CozFis_Debug.apk  (debug anahtarıyla imzalı, telefona kurulabilir)
```

Komut sırasıyla şunları yapar:
1. `tools/build/build.js` ile `dist/web` klasörünü oluşturur.
2. `npx cap sync android` ile web dosyalarını Android projesine kopyalar.
3. `gradlew assembleDebug` ile APK'yı derler.

Android Studio ile: `npm run android:open` komutunu çalıştırın ve ardından *Build › Build APK(s)* seçin.

## 4. Telefona kurmak

**USB ile (önerilen):**
1. Telefonda *Ayarlar › Telefon hakkında › Yapım numarası*na 7 kez dokunun. Ardından
   *Geliştirici seçenekleri › USB hata ayıklama*yı açın.
2. Telefonu bilgisayara bağlayın ve şu komutu çalıştırın:
   ```bash
   adb install -r dist/CozFis_Debug.apk
   ```
   `-r` güncelleme olarak kurar; kayıtlar korunur.

**Dosya ile:** `CozFis_Debug.apk` dosyasını telefona kopyalayın, dosya yöneticisinden açın ve
"Bilinmeyen kaynaklardan yükleme" iznini verin.

Uygulama ana ekranda **"CozFis (debug)"** adıyla görünür. Debug kimliği `com.aygforge.cozfis.debug` olduğu için
ileride yayın sürümüyle yan yana kurulabilir.

## 5. Oyun kodu değişince Android'i güncellemek

```bash
npm run android:apk         # derleme + senkron + APK; kodda veya grafikte yapılan her değişiklikten sonra yeterlidir
```

Bir grafik değiştirildiyse önce `npm run pack`, sonra `npm run android:apk` çalıştırın.
`npm run export-assets` komutunu çalıştırmayın: kaynak PNG'lerin üzerine yazar.

Sürüm numarası `android/version.properties` dosyasındadır. Google Play'e yapılan her yüklemede `versionCode` artırılmalıdır.

## 6. Yayın (release) ve AAB

```bash
npm run android:aab         # → dist/CozFis_Release.aab    (Google Play paketi)
npm run android:release     # → dist/CozFis_Release.apk
```

`android/keystore.properties` dosyası **yoksa** bu çıktılar **imzasızdır**. İmzasız bir AAB, Google Play'e yüklenemez;
yalnızca derleme hattının çalıştığını gösterir. İmzalamak için:

1. Bir yükleme anahtarı (upload key) oluşturun ve bu dosyayı **güvenli bir yerde, Git dışında** saklayın:
   ```bash
   keytool -genkeypair -v -keystore cozfis-upload.jks -alias cozfis -keyalg RSA -keysize 4096 -validity 10000
   ```
2. `android/keystore.properties` dosyasını oluşturun. Bu dosya `.gitignore` içinde olduğu için Git'e eklenmez:
   ```properties
   storeFile=../../cozfis-upload.jks      # android/ klasörüne göre yol
   storePassword=********
   keyAlias=cozfis
   keyPassword=********
   ```
3. `npm run android:aab` çalıştırın. Google Play'de *Play App Signing* kullanılır: siz yükleme anahtarıyla imzalarsınız,
   Google da uygulama imzalama anahtarını yönetir.

**Yayından önce karar verilmesi gerekenler** (bkz. `CozFis_Android_Build_Report.md` §7):
- Kalıcı uygulama kimliği. Şu anki `com.aygforge.cozfis` **geçicidir**. Uygulama Google Play'de yayımlandıktan sonra kimlik değiştirilemez.
- Gerçek marka ikonu. Şu anki ikon ve açılış ekranı, oyunun çipura sprite'ından üretilmiş **geçici geliştirme görselleridir**.
- Gizlilik politikası ve veri güvenliği formu (oyun ağ kullanmaz ve izin istemez).

## 7. Yapılandırma özeti

- `capacitor.config.json`:
  - `webDir: dist/web`
  - `androidScheme: https` ve `hostname: localhost`. Uygulama kökeni (origin) `https://localhost` olarak sabittir.
    **Bu değeri değiştirmeyin:** IndexedDB ve localStorage kayıtları kökene bağlıdır, köken değişirse oyuncunun kayıtları görünmez olur.
  - `SystemBars.insetsHandling: css` (güvenli alan değişkenleri) ve `hidden: true`.
  - Yapılandırmada geliştirme sunucusu adresi (`server.url`) **yoktur**. Oyun her zaman paketin içindeki dosyalardan açılır.
- Uygulama hiçbir izin istemez. İnternet izni bile kaldırılmıştır; oyun tamamen çevrimdışı çalışır.
- Yön `sensorLandscape`'tir: yatay, iki yön de desteklenir. Android 16 ve sonrasında büyük ekranlarda (tablet, katlanabilir,
  en kısa kenarı 600 dp ve üzeri) sistem bu kısıtı yok sayabilir. Bu durumda oyun dikey ekranda kendi "telefonu çevirin"
  ekranını gösterir.
- WebView hata ayıklama yalnızca debug derlemede açıktır (`chrome://inspect`).

## 8. Testler

```bash
npm test                          # web regresyonu (piksel, ekran A/B, 149 kabul testi × 6 dil, kayıt, çevrimdışı, performans)
node tests/android-shell.js       # Android kabuk mantığı — SİMÜLASYON (masaüstü Chromium + sahte Capacitor köprüsü)
```

Gerçek telefonda uygulanacak adımlar: `CozFis_Android_Test_Checklist.md`.
