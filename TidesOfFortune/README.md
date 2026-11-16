# Tides of Fortune — HTML5 Mobil Sürüm

Roguelite deniz ticareti ve keşif oyunu. Küçük bir balıkçı teknesi **Paslı Martı** ile limandan limana ticaret yap, yolculuk eventlerinde kararlar ver, tayfa ve hayvan topla, gemini büyüt ve **Büyük Liman**'a ulaşmaya çalış — eğer batmazsan.

- Tür: Roguelite / ticaret / keşif / event kartı · Dil: Türkçe · Yatay ekran
- Teknoloji: HTML5 Canvas 2D, CSS3, Vanilla JavaScript (ES2022 modülleri), Web Audio API, localStorage
- Çalışma zamanında **hiçbir harici bağımlılık / CDN yok**; tüm pixel art ve sesler oyun içinde prosedürel üretilir. Tek harici kaynak gömülü Rubik fontudur (SIL OFL 1.1, `assets/fonts/OFL-Rubik.txt`); rakamlar ve Türkçe harfler net okunsun diye pixel font yerine seçildi.

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
- Yolculuk gerçek zamanlıdır; sakin seyir eski ×3 hızında akar (hız düğmesi kaldırıldı): kısa yol ~30–50 s, orta ~45–65 s, uzun ~55–80 s seyir. Karşılaşma sahneleri normal hızda oynar.
- Her limanda 2–3 deniz yolu seçilir (tehlike, mesafe, korsan, söylenti ipuçları; tayfa ve upgrade'ler doğruluğu artırır). Hedef liman seed ile belirlenir ama varana kadar gizlidir.
- Eventler dünyada oynar: `NORMAL_SAILING → ENCOUNTER_APPROACH → ENCOUNTER_INTRO → PLAYER_DECISION → ACTION_ANIMATION → OUTCOME_ANIMATION → ENCOUNTER_EXIT → RESUME_SAILING`. Sonuç kararda bir kez uygulanıp kaydedilir; animasyon yalnızca görüntü katmanını eski değerden yeniye taşır, bu yüzden yeniden yükleme ödülü tekrarlamaz.
- Her eventin kendine özgü sahnesi var (yanaşan gemiler, gemiye çıkan subaylar, sandalla adaya çıkış, dalışlar, aurora, batık şehir, tsunami…). Yeni sahne eklemek için `src/presentation/scenes/` altında bir `def({...})` bloğu yazmak yeterli.
- Geliştirici / test: URL'ye `?hiz=N` eklenirse oyun zamanı N kat hızlanır. `node tools/scenecheck.cjs [EVENT_ID] [seçenek] [shots]` eventleri zorla tetikleyip her seçeneği tarayıcıda oynatır (hata/takılma taraması, isteğe bağlı kare kare ekran görüntüsü).

## Yaşayan Denizler & Sonsuz Deniz genişlemesi

- **25 yeni bağımsız olay** (`src/data/events_x1.js`, `EVT_X1_*`) ve her biri için ayrı koreografi (`src/presentation/scenes/x1.js`): dev yengecin küpeşteye tırmanması, gece dalgıç hırsızları, devrilen direk, açık deniz müzayedesi, tenteli pazar tekneleri, yüzer tersane, gökten düşen yıldız, Karanlıktaki Dev Göz, ters akıntı, gaz kabarcıkları, siyah yağmur…
- **4 yeni hikâye zinciri** (`src/data/chains_x1.js`, 14 aşama, her zincirde 3 farklı final ve her finalin kendi görüntüsü), Codex'te **Denizci Günlüğü** (görülmemiş sonuçlar `???`), sonraki seferlerde sahne olarak oynayan **Hikâye Yankıları**.
- **Dünya Hafızası** (`src/systems/X1System.js`): olay → yolculuk → sefer → kalıcı katmanlar; geri dönen gemiler aynı görsel kimlikle fiziksel olarak sahneye gelir.
- **3 fraksiyon** (Altın Pusula Loncası, Kraliyet Deniz Muhafızları, Kızıl Yelken Kardeşliği; −3..+3) ve limanlarda **6 sözleşme türü** (Sözleşmeler sekmesi). Görev kargoları satılamaz, ambarda yer kaplar; süre dolarken fraksiyon gemisiyle %70 ödüllü buluşma.
- **12 yeni yükseltme** (Mürettebat ve Deniz Efsaneleri dalları), **12 yeni başarım**.
- **Sonsuz Deniz**: Büyük Liman'da *Seferi Bitir* ya da *Sonsuz Denize Açıl*. Derinlik I–V, 4 limanlık bölümlerde deniz koşulları, kilometre taşları, skor ve rekorlar, kozmetik bayrak ve kıç süsü.
- Kayıt sürümü 5; eski kayıtlar (`tof.meta`, `tof.run`, `tof.settings`) otomatik taşınır.

## Genişleme Paketi 2 — Kaptanların Hikâyeleri

- **25 bağımsız olay** (`src/data/events_x2.js`, `EVT_X2_*`): 6 tehlike, 9 şans, 6 gizem, 3 felaket, 1 tamir. Mürettebat/hayvan olayları ilgili ana kategoride `cond` ile seçilir. Her olayın kendi sahnesi `src/presentation/scenes/x2.js` içinde (düello kalası, kıyı top mevzileri, su altı zinciri, suyun üstünde ayak izleri, taşlaşan balıklar, dönen su duvarı, iki fırtına cephesi, yüzen tiyatro, hileli terazi, şamandıra onarımı…).
- **4 hikâye zinciri** (`src/data/chains_x2.js`): Yara (4), Pita (3), Mira (4), Üç Kaptanın Yarışı (3) — 14 aşama, 12 final; finaller ve başarılı/başarısız alt sonuçlar Denizci Günlüğü'ne yazılır. Sonraki run'larda küçük yankılar.
- **Zincir kuralları:** en fazla 2 aktif zincir ve en fazla 1 kişisel tayfa zinciri; normal run'da kalan seyir sayısı yetmiyorsa uzun zincir başlamaz; bekleyen zincir aşamaları rota olay sayısının **içinde** sayılır (1 zincir + 3 normal = 4). Tayfa ayrılırsa kişisel zincir güvenle kapatılabilir.
- **12 yükseltme** (toplam 5680 XP, registry 44) ve **8 başarım**. Şanslı seçenekler %5–95 aralığında (özel garantili çözümler korunur).
- **Sonsuz Deniz:** V'ten sonraki büyüme en fazla 2 kademe (hasar ≤ ×1,91, risk ≤ −18, onarım ≤ ×1,7). Altı olayda derinliğe bağlı özel varyant.
- **Kayıt v6:** yalnızca `run.x2` / `meta.x2` eklenir; `x1` ve eğitim durumu korunur.
- **3/4 görünüm çizimleri** artık kaynak kodda (`src/rendering/td/*`, `src/rendering/icons.js`); diğer daldaki küçültülmüş-paket yamaları kaynak haritasıyla gerçek isimlere taşındı.

## Genişleme Paketi 3 — Efsanevi Denizler ve Rakip Kaptanlar

- **25 bağımsız olay** (`src/data/events_x3.js`, `EVT_X3_*`): 6 tehlike, 8 şans, 6 gizem, 4 felaket, 1 tamir. Üçü **efsane**: Sönmeyen Armada (donmuş üç gemi, fenerler), Denizin Üzerindeki Taş Yol (dipten yükselen taş sütunlar), Uyuyan Ada (nefes alan dev yaratık). Efsaneler kategori içinde düşük ağırlıklı, run içinde tekrar etmez, Sonsuz Deniz'de 4 limanlık dilimde en fazla bir kez çıkar ve ilk keşif ödülü bir kez verilir.
- **Rakip kaptan ilişkisi** (`src/systems/X3System.js`): Liora (turkuaz), Boran (koyu kırmızı) ve yeni kaptan **Neris** ("Kül Pusulası": kömür gövde, bakır çizgili yelken, kurtarma vinci). Her run'da −2..+2; fraksiyon itibarından ayrı. +2 bir kez güvenli işbirliği, +1 ek konuşma, −1 gergin (riskli seçime −5), −2 rakip takibi (her zaman kaçış / 60 altınla uzlaşma / çatışma yolu). Aynı kaptan bir seferde en fazla bir karşılaşma ve son görüldüğü limandan 2 liman sonra yeniden çıkar. Karşılaşma panelinde küçük üç renkli ilişki işareti.
- **4 hikâye zinciri** (`src/data/chains_x3.js`): Rakip Kaptanlar Konseyi (4), Sönmeyen Armada'nın Sırrı (4), Kayıp Atlas (4), Sahte Bayraklar (3) — 15 aşama, 12 final. Kişisel değil; toplam 2 aktif zincir sınırı ve aşamaların rota olay sayısına dahil olması korunur. 4 yankı olayı.
- **8 yükseltme** (toplam 4370 XP, registry 52) ve **10 başarım**. Codex'te **Denizci Kroniği**: kaptan tanışıklıkları ve en iyi/en kötü ilişki, üç efsane, 12 final (görülmeyenler ???), önceki paketlerin sonları ve en uzun Sonsuz Deniz yolculuğu. Üç efsane keşfedilip bir run'da iki yeni hikâye bitince sonraki limanda kısa "Denizcilerin Mirası" kutlaması (ek XP yok).
- **Sonsuz Deniz:** üst sınırlar değişmedi. III+ derinlikte çok kaptanlı görsel varyantlar, IV+ daha sert taş yol, V+ gece Uyuyan Ada.
- **Kayıt v7:** yalnızca `run.x3` / `meta.x3` eklenir; `x1`, `x2` ve eğitim durumu korunur. Aynı karar iki kez uygulanmaz (işlem anahtarı).
- **Sahne motoru düzeltmesi:** `[par(...), wait(n)]` biçimindeki iç içe adım grupları önceden sessizce atlanıyordu; artık sırayla oynatılıyor (`normSteps`). Bu, Paket 2 sahnelerindeki bazı kıvılcım/ses/parlama vuruşlarını da görünür kıldı.
- Görsel regresyon aracı: `node tools/visual.cjs <html> <klasör>` sabit 14 ekranı yakalar (önce/sonra karşılaştırması için).

## İlk oyun eğitimi

İlk run'da oyuncu her adımı kendisi uygulayarak öğrenir (`src/ui/tutorial.js`). Hedef düğme parlayan bir halkayla gösterilir, yanında kısa bir açıklama balonu durur; eylem yapılınca sonraki adıma geçilir:
1. 3 ücretsiz item seçmek → 2. boş kargo kadar mal almak → 3. deniz yolu seçip yola çıkmak → 4. yolculukta bir olaya karar vermek ve sonucu görmek → 5. sonraki limanda malları satmak (kâr/zarar göstergesi) → 6. tayfa almak (eğitim hediyesi: ücretsiz) → 7. hayvan almak (hediye).

Eğitim tamamlanınca ya da atlanınca `meta.tutorialDone` kaydedilir ve bir daha gösterilmez; Ayarlar → Eğitim → "Yeniden göster" ile bir sonraki yeni run'da tekrar açılabilir. Tarayıcı testi: `node tests/tutorial.test.cjs [shots]`.

## Denge güncellemesi

- **Item dayanıklılığı:** pasif ve aktif itemlerin kullanım hakkı var (2–4). Item etkisini her gösterdiğinde 1 hak gider, bitince kırılır; kalan hak item simgesinde görünür.
- **Zıpır & Tarçın:** ilk karşılaşma artık garanti değil (run'ların ~%40'ı); biri gemideyken diğeriyle de karşılaşma %30 (Eski Dostlar ≈ %12).
- **Yeni hayvanlar:** Kaşif (martı), Bilge (deniz kaplumbağası), Fındık (gelincik), Mürekkep (küçük ahtapot). Her birinin güverte davranışı, durumsal etkisi ve portresi var.
- **Hayvan güverte olayları:** 12 yeni gemi içi olay (Tarçın denize düşer, ambardaki kaçak, Zıpır fare avlar / gözcü sepetine çıkar, Eski Dostlar kovalamacası, papağanlar, maymun, yeni hayvanlar). Normal bir olayın yerine geçer; tempo değişmez.
- **Ticaret:** her limanda malın tek bir piyasa değeri var; alış biraz üstünde, satış biraz altında. Aynı maldan çok satınca fiyat düşer. Rastgele alım-satımların ~%40'ı kârlı; kâr ucuz limandan alıp pahalı limana taşımakla gelir.
- **Sonsuz Deniz:** derinlik hasarı I–V'te 1,0→1,55; V'ten sonra her 4 ek limanda Uçurum kademesi (+%18 hasar, +3 risk). 4–5. seviye gemiler daha büyük tehdit çeker. Sonsuz Deniz'de onarım ve gemi yükseltmesi daha pahalı.
- **Eskort:** kraliyet gemisi karşılaşma sırasında geride bekler, karşılaşmalar sancaktan gelir; görev bitişinde konvoy açık suya demirler.

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
│   │                           kit.js (sahne dili) + scenes/ (109 eventin her biri için özel sahne)
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
