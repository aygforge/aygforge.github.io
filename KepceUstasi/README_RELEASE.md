# Kepçe Ustası V1.0 — Yayın rehberi

## Web / itch.io
```bash
npm ci
npm test            # 127 birim testi
npm run build       # dist/ (çevrimdışı çalışır, service worker dahil)
```
`KepceUstasi_V1.0_web_dist.zip` = `dist/` içeriği; itch.io'ya "HTML" proje olarak yüklenir (`index.html` kökte). Web'de reklam ve satın alma **kapalıdır**; sahte ödül verilmez.

## Android (Capacitor 8)
- Paket ID (**geçici öneri**): `com.aygforge.kepceustasi` — `capacitor.config.json` ve `android/app/build.gradle` (`applicationId`). Play'e ilk yüklemeden ÖNCE kesinleştirin; sonradan değişmez.
- compileSdk / targetSdk **36**, minSdk 24, yalnız portrait, geri tuşu = duraklat / menü kapat.
- Bu teslimde derlendi ve doğrulandı (aapt2): `app-debug.apk` (debug imzalı, cihaza kurulabilir) ve `app-release.aab` (**imzasız** — Play'e yüklenemez, yalnız derlemenin çalıştığını gösterir).

```bash
npm run build && npx cap sync android
cd android
export ANDROID_HOME=/path/to/android-sdk     # platforms;android-36, build-tools;36.0.0
./gradlew assembleDebug                      # app/build/outputs/apk/debug/app-debug.apk
```

### İmzalı AAB (sizin anahtarınızla)
```bash
keytool -genkeypair -v -keystore kepce-upload.jks -alias kepce -keyalg RSA -keysize 2048 -validity 10000
```
`android/keystore.properties` (git'e EKLEMEYİN):
```
storeFile=../kepce-upload.jks
storePassword=...
keyAlias=kepce
keyPassword=...
```
`android/app/build.gradle` içine `signingConfigs { release { ... } }` ekleyip `buildTypes.release.signingConfig signingConfigs.release` bağlayın, sonra:
```bash
./gradlew bundleRelease   # app/build/outputs/bundle/release/app-release.aab
```
Play App Signing'i açın; `versionCode`'u her yüklemede artırın.

## Reklam (AdMob) — kurulu DEĞİL, hazır adaptör var
1. `npm i @capacitor-community/admob && npx cap sync android`
2. `android/app/src/main/AndroidManifest.xml` `<application>` içine:
   `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-...~..."/>` (geliştirmede Google test App ID'si: `ca-app-pub-3940256099942544~3347511713`).
3. `src/platform/monetization.config.js`: `appId`, `units.rewarded`, `units.interstitial` gerçek kimlikler; `useTestAds: false`.
4. AdMob konsolunda GDPR (UMP) mesajı. SSV (sunucu tarafı ödül doğrulaması) için sunucu gerekir; şu an istemci callback'i + `rewardId` tekilliği kullanılır.
Eklenti yokken (`Capacitor.isPluginAvailable('AdMob')` false) tüm reklam düğmeleri kapalı kalır.

## Satın alma (Google Play Billing) — kurulu DEĞİL, hazır adaptör var
1. `npm i cordova-plugin-purchase && npx cap sync android`
2. Play Console'da ürünler: `remove_ads`, `starter_pack` (kalıcı), `tip_pack` (tüketilebilir), `apron_cosmetic` (kalıcı).
3. `PurchaseService` `CdvPurchase.store`'a bağlanır; tahsis `Monetization.applyPurchase` (token başına bir kez), geri yükleme `restorePurchases` (iade edilen kalıcı haklar düşer).
4. Üretim güvenliği için satın alma doğrulaması (Google Play Developer API) **sunucu** gerektirir — bu sürümde yok.

## Kontrol listesi (sizde)
Play geliştirici hesabı, gizlilik politikası URL'si (`PRIVACY_NOTES.md`), veri güvenliği formu, içerik derecelendirme, mağaza görselleri, gerçek cihazda test (bu teslimde gerçek cihaz/emülatörde çalıştırılmadı).
