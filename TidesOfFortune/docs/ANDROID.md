# Tides of Fortune — Android derleme kılavuzu

Android sürümü, oyunun HTML5 derlemesini (`dist/web`) Capacitor ile bir Android uygulamasına sarar.
Oyun kodu, mekanikler ve kayıt biçimi web sürümüyle aynıdır.

| Alan | Değer |
|---|---|
| Uygulama adı | Tides of Fortune |
| Uygulama kimliği (applicationId) | `com.aygforge.tidesoffortune` (**Play'e ilk yüklemeyle kalıcılaşır; onay bekliyor**) |
| Geliştirici | Ayg Forge |
| Sürüm adı / kodu | `0.1.0` / `1` |
| Capacitor | 8.6.2 (core, android, cli) · @capacitor/app 8.1.2 · @capacitor/preferences 8.0.1 |
| minSdk / targetSdk / compileSdk | 24 / 36 / 36 |
| Yön | Yatay (`sensorLandscape`), tam ekran (sistem çubukları kaydırınca geçici görünür) |

## Gerekenler
- Node 20+ ve `npm install`
- JDK 21
- Android SDK: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0` (`ANDROID_HOME` ayarlı)

## Derleme
```bash
cd TidesOfFortune
npm install
npm run build                 # dist/web üretir
npx cap sync android          # dist/web → android/app/src/main/assets/public
cd android
./gradlew bundleRelease       # imzalı AAB: app/build/outputs/bundle/release/app-release.aab
```

### Yükleme (upload) anahtarı
Anahtar ve şifreleri **depoya girmez** (`android/.gitignore`: `*.jks`, `*.keystore`, `*.p12`, `keystore.properties`).
İki yoldan biriyle verilir:

1. `android/keystore.properties` (git dışı):
   ```properties
   storeFile=/güvenli/yol/tidesoffortune-upload.p12
   storePassword=...
   keyAlias=upload
   keyPassword=...
   ```
2. ya da ortam değişkenleri: `TOF_UPLOAD_STORE_FILE`, `TOF_UPLOAD_STORE_PASSWORD`, `TOF_UPLOAD_KEY_ALIAS`, `TOF_UPLOAD_KEY_PASSWORD`.

Anahtar tanımlı değilse `bundleRelease`/`assembleRelease` imzasız paket üretmez, açık bir hatayla durur.

Bu anahtar Play App Signing'deki **yükleme anahtarıdır**. Mağazadaki uygulamayı imzalayan asıl anahtarı Google saklar.
Yükleme anahtarı kaybolursa Play Console üzerinden sıfırlatılabilir. Yine de anahtarı en az iki güvenli yerde yedekleyin.

### Her yeni Play yüklemesinde
- `android/app/build.gradle` → `versionCode` **artırılmalı** (2, 3, …). Aynı kod ikinci kez yüklenemez.
- `versionName` serbesttir (ör. `0.1.1`, `0.2.0`).
- `applicationId`, `server.hostname`/`androidScheme` ve yükleme anahtarı **değiştirilmemelidir** (aşağıya bakın).

## Kayıt uyumluluğu ve güncellenebilirlik
- Kayıt anahtarları ve biçimi web sürümüyle **aynıdır**: `tof.meta`, `tof.run`, `tof.settings` (+ `.bak` yedekleri).
  Sürüm yükseltmeleri mevcut göç zinciriyle (`SaveManager`, kayıt v7) taşınır.
- WebView kaydı adrese bağlıdır. Adres `capacitor.config.json` içinde sabittir: `https://localhost`
  (`server.androidScheme: "https"`, `server.hostname: "localhost"`).
  **Bu değerler değişirse eski kayıtlar başka bir "site"ye ait görünür.** Değiştirmeyin.
- Ek güvence: Android'de her kayıt yazımı ayrıca SharedPreferences'a (Capacitor Preferences) yansıtılır
  (`src/platform/native.js`). WebView deposu tamamen boş bulunursa kayıtlar oradan geri yüklenir.
  Kısmi eksikler geri getirilmez; örneğin biten bir seferin silinmiş kaydı geri gelmez.
- `allowBackup="true"`: Android yedeklemesi açık. Yeni telefona geçişte kayıt taşınabilir.
- Service worker Android'de **kapalıdır**. Böylece mağaza güncellemesinden sonra eski oyun dosyaları önbellekten sunulmaz.
- Uygulama arka plana alınınca (`pause`) oyun hemen kaydedilir.

## Android'e özgü davranışlar (`src/platform/native.js`)
- **Geri tuşu:**
  1. Açık pencereyi kapatır.
  2. Pencere yoksa haritayı, Codex/Ayarlar/Yükseltmeler ekranını kapatır.
  3. En sonda uygulamayı kapatmadan arka plana alır (kayıt yapılır).
- Menüdeki tarayıcı "tam ekran" düğmesi gizlenir; tam ekranı sistem yönetir.
- Çentik ve güvenli alan: Capacitor SystemBars, boşlukları `--safe-area-inset-*` CSS değişkeni olarak verir.
  `Stage` bunları tarayıcının `env(safe-area-inset-*)` değerleriyle birlikte okur.
- Web ve tek dosya HTML sürümünde bu katman hiçbir şey yapmaz.

## İkon ve açılış ekranı
`python3 tools/android-assets.py` (Pillow gerekir) oyunun piksel ikonundan şunları üretir:
- uyarlanabilir ikon (arka plan: gökyüzü/deniz; ön plan: gemi, güvenli dairenin içinde)
- eski tip kare ve yuvarlak ikon
- açılış görselleri (koyu zemin, ortada ikon)

Üretilen PNG'ler `android/app/src/main/res` altındadır ve depoya dahildir.
