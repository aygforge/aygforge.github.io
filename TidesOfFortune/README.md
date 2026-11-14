# Tides of Fortune — HTML5 Mobil Sürüm

Roguelite deniz ticareti ve keşif oyunu. Küçük bir balıkçı teknesi **Paslı Martı** ile limandan limana ticaret yap, yolculuk eventlerinde kararlar ver, tayfa ve hayvan topla, gemini büyüt ve **Büyük Liman**'a ulaşmaya çalış — eğer batmazsan.

- Tür: Roguelite / ticaret / keşif / event kartı · Dil: Türkçe · Yatay ekran
- Teknoloji: HTML5 Canvas 2D, CSS3, Vanilla JavaScript (ES2022 modülleri), Web Audio API, localStorage
- Çalışma zamanında **hiçbir harici bağımlılık / CDN yok**; tüm pixel art ve sesler oyun içinde prosedürel üretilir. Tek harici kaynak gömülü Pixelify Sans fontudur (SIL OFL 1.1, `assets/fonts/OFL-PixelifySans.txt`).

## Hızlı başlangıç

| Ne istiyorsun | Komut / dosya |
|---|---|
| Tek dosyayı oyna | `dist/TidesOfFortune.html` dosyasını tarayıcıda aç (internet gerekmez) |
| Kaynaktan geliştirme sunucusu | `node tools/serve.mjs 8080` → `http://localhost:8080/` |
| Derleme | `npm install` (yalnızca esbuild, derleme için) → `npm run build` |
| Mantık testleri | `npm test` |
| Tarayıcı uçtan uca testi | `npm run build && node tests/browser.test.cjs` (Playwright gerekir) |
| Denge simülasyonu | `node tools/simulate.mjs 400` · `--smart` (bilgili tüccar) · `--meta` (kalıcı ilerleme birikir) |

GitHub Pages üzerinde: bu klasör depo kökündeki `TidesOfFortune/` altında olduğu için `https://aygforge.github.io/TidesOfFortune/` adresinden de açılır (ES modülleri statik sunucu ister; `file://` ile açılacaksa tek dosyalık sürümü kullan).

## Mobilde test

1. Bilgisayarda `node tools/serve.mjs 8080` çalıştır; telefon aynı Wi-Fi ağında `http://<bilgisayar-ip>:8080/` adresini Chrome'da açsın.
2. Ya da `dist/TidesOfFortune.html` dosyasını telefona kopyalayıp Chrome ile aç.
3. Telefonu yatay çevir (dikey tutulursa "telefonunu çevir" ekranı çıkar). Ana menüdeki tam ekran butonu isteğe bağlıdır.
4. Chrome'da "Ana ekrana ekle" ile PWA olarak yüklenebilir (HTTPS veya localhost üzerinden servis edildiğinde service worker çevrimdışı önbellek sağlar).

## itch.io'da yayınlama

1. `npm run build`
2. `dist/web/` klasörünün **içeriğini** zip'le (`index.html` zip'in kökünde olmalı).
3. itch.io → New project → Kind of project: **HTML** → zip'i yükle → "This file will be played in the browser" işaretle.
4. Embed options: viewport 1280×720, **Mobile friendly** işaretli, Orientation: **Landscape**, "Fullscreen button" açık.
   Alternatif: tek dosya `dist/TidesOfFortune.html` → `index.html` olarak yeniden adlandırıp zip'le.

## Android APK'ya hazırlık (Capacitor)

`capacitor.config.json` hazır (`webDir: dist/web`). APK üretmek için:

```bash
npm run build
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
npx cap open android      # Android Studio'da Build > Build APK
```
`AndroidManifest.xml` içinde aktiviteye `android:screenOrientation="sensorLandscape"` ekle. Oyun mutlak yol kullanmadığı ve çevrimdışı çalıştığı için WebView içinde ek ayar gerektirmez.

## Top-down yolculuk (rework)

- Gemi tam yukarıdan, pruva yukarı; 5 seviyenin her biri farklı gövde, güverte, direk, dümen ve kargo alanına sahip. Yelkenler karakterlerin üstünde yarı saydam.
- Tüm tayfa ve hayvanlar güvertede kişiliğe göre iş yapar, A* ile yürür; karaktere dokununca ad / yetenek / mevcut iş paneli açılır. Alınan, kaybedilen ve satılan mallar güvertede sandık/çuval/kereste olarak görünür.
- Yolculuk gerçek zamanlıdır: kısa 90–150 s, orta 130–190 s, uzun 170–240 s; olaylar arasında en az 22 s seyir. Sakin seyirde ×3 hızlandırma.
- Her limanda 2–3 deniz yolu seçilir (tehlike, mesafe, korsan, söylenti ipuçları; tayfa ve upgrade'ler doğruluğu artırır). Hedef liman seed ile belirlenir ama varana kadar gizlidir.
- Eventler dünyada oynar: `NORMAL_SAILING → ENCOUNTER_APPROACH → ENCOUNTER_INTRO → PLAYER_DECISION → ACTION_ANIMATION → OUTCOME_ANIMATION → ENCOUNTER_EXIT → RESUME_SAILING`. Sonuç kararda bir kez uygulanıp kaydedilir; animasyon yalnızca görüntü katmanını eski değerden yeniye taşır, bu yüzden yeniden yükleme ödülü tekrarlamaz.
- Geliştirici / test: URL'ye `?hiz=N` eklenirse oyun zamanı N kat hızlanır.

## Proje yapısı

```
TidesOfFortune/
├── index.html, style.css, manifest.webmanifest, sw.js, capacitor.config.json
├── src/
│   ├── main.js                 giriş noktası
│   ├── config/balance.js       TÜM denge parametreleri (GDD değerleri + KARAR'lar)
│   ├── core/                   GameCore (durum makinesi), GameState, SeededRNG, SaveManager
│   ├── systems/                Ship, Trade, Item, Crew, Pet, Repair, Route, Event, Progression
│   ├── data/                   45 liman, 15 mal, 18 item, 30 tayfa, 5 hayvan, ~110 event düğümü,
│   │                           12 zincir, 20 upgrade, başarımlar, arayüz metinleri (strings.js)
│   ├── rendering/td/           Top-down dünya: TopShip (5 gövde + yürünebilir ızgara + A*), TopChars
│   │                           (tayfa/hayvan/NPC sprite), Props (kargo, nesneler), Ocean (akan deniz,
│   │                           ambiyans), Deck2D (yaşayan güverte), World (kamera, efektler, varlıklar)
│   ├── rendering/              Renderer, parşömen harita, UI portreleri, ikonlar
│   ├── presentation/           EncounterDirector (karşılaşma yaşam döngüsü + aksiyon zaman çizelgesi),
│   │                           scenes.js (bespoke ve veri güdümlü event sahneleri)
│   ├── audio/AudioEngine.js    Sentezlenmiş ortam sesleri, üretken müzik, efektler
│   └── ui/                     Ekranlar (menü, harita, liman, yolculuk, event, özet, upgrade, Codex, ayarlar)
├── assets/fonts, assets/icons
├── tools/                      build, simulate, bot (otomatik oyuncu), serve, make-icons
├── tests/                      game.test.mjs (node:test), browser.test.cjs (Playwright)
├── dist/                       TidesOfFortune.html (tek dosya) + web/ (statik/itch.io/Capacitor)
└── docs/                       SYSTEM_STATUS.md, DESIGN_DECISIONS.md, TEST_REPORT.md
```

Mimari ilke: oyun mantığı (`core/`, `systems/`) DOM'a bağımlı değildir; Node'da test ve simülasyon edilir. Renderer yalnızca durumu okur; UI eylemleri `GameCore` üzerinden yapar. Her eylem atomiktir ve RNG durumuyla birlikte otomatik kaydedilir.

## Yeni içerik eklemek

- Yeni event: `src/data/events_core.js` içine DSL formatında bir nesne ekle (format `src/systems/EventSystem.js` başında). Kod değişikliği gerekmez.
- Özel illüstrasyon: `src/rendering/EventArt.js` içindeki `CUSTOM_ART[EVT_ID]` ile bir eventin çizimini değiştir; ya da `art.obj` listesine yeni bir nesne çizici ekle.
- Denge: yalnızca `src/config/balance.js`.
