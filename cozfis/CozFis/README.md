# CozFis — Modüler Proje ve Hibrit Varlık Hattı (Faz 2)

CozFis, 640×360 mantıksal çözünürlükte çalışan 2D piksel sanat balıkçılık oyunudur. Bu klasör, Faz 1'in tek dosyalık
sürümünden (`reference/CozFis_Multilanguage_v1.html`) türetilen **çalışır modüler projedir**:

- Grafikler artık **PNG atlaslarından** yüklenir. Atlaslar, oyunun kendi prosedürel üreticileriyle dışa aktarılmıştır.
  Ekran görüntüsünden kırpılmamıştır.
- Bir görsel yoksa ya da yüklenemezse oyun aynı görseli **prosedürel olarak** üretir. Sonuç piksel düzeyinde aynıdır.
- Oyun mekaniği, ekonomi, kayıt şeması, kayıt anahtarları ve 6 dilin çevirileri **değiştirilmedi**.
- Çalışmak için internet bağlantısı gerekmez. Tüm yollar göreli olduğundan proje ileride Android'e/Capacitor'a taşınmaya hazırdır.

## Hızlı başlangıç

```bash
npm run start                # = node tools/serve.js . 8080  →  http://localhost:8080/
```

Node.js ≥ 18 yeterlidir. Oyunu çalıştırmak için `npm install` gerekmez: sunucu bağımlılıksızdır.

| Nasıl açılır | Sonuç |
|---|---|
| `http://localhost:8080/` (yerel sunucu) | Önerilen yol. Atlaslar PNG dosyalarından yüklenir. |
| `dist/CozFis_Standalone.html` dosyasına çift tıklamak (`file://`) | Tek dosyadır. Atlaslar dosyanın içine `data:` URI olarak gömülüdür. Çevrimdışı çalışır. |
| `index.html` dosyasını doğrudan açmak (`file://`) | Çalışır, ancak tarayıcı yerel PNG'lerin canvas'a çizilmesini güvenlik gereği engeller. `AssetManager` bunu algılar ve **prosedürel moda** geçer. Görüntü aynıdır, yalnızca atlas kullanılmaz. |
| `?assets=off` parametresi | Atlaslar kapanır, çizimler tamamen prosedürel olur. Karşılaştırma ve dışa aktarma bu modu kullanır. |
| `?assets=all` parametresi | Tüm atlas sayfaları en başta yüklenir ve bellekten bırakılmaz. Doğrulama araçları bu modu kullanır. |
| `?debug=1` parametresi veya F3 | Oyun içi QA panelini açar (149 kabul testi). |

## Klasör yapısı

```
index.html                 kabuk: DOM + script sırası (özgün yükleme sırası korunur)
css/style.css              özgün stil (değiştirilmedi)
src/
  data/game_data.js        FISHDB / GAMECONFIG / EXPANSION verisi
  localization/            00_i18n.js (çalışma zamanı), locale_data.js (6 dil; değiştirilmedi)
  core/                    01_core, 12_main, 12_v4_tests, start.js (atlas yükle → boot)
  rendering/               02_art_base … 06_v4_art (prosedürel üreticiler), asset_manager.js, asset_hooks.js
  systems/                 07_* (oyun sistemleri), 08_save_audio (kayıt + sentez ses), 09_* (balık tutma)
  scenes/                  10_* (sahneler)
  ui/                      11_* (HTML paneller)
assets/
  atlases/                 *.png + *.json — çalışma zamanının okuduğu atlas sayfaları
  manifest.js|json         çalışma zamanı manifesti (pack.js üretir)
  sprites.json             kaynak metaveri: id, anahtar, pivot, katman, dil yamaları
  fish/ characters/ boats/ ui/ environments/ l10n/   tek tek kaynak PNG'ler (sanatçının düzenlediği dosyalar)
  audio/                   boş (ses Web Audio ile sentezlenir; bkz. README)
tools/
  serve.js, serve-lib.js   bağımlılıksız statik sunucu
  export-assets/           export.js + collect.js — prosedürel → PNG dışa aktarıcı
  build/                   pack.js (atlas), build.js (dist), library.js (varlık kütüphanesi), split-monolith.js
  validate/                pixel-validate.js (+driver.js), offline-check.js
tests/                     qa-langs, screens-ab, save-compat, smoke, perf, run-all.sh
reports/                   test çıktıları (JSON/log) ve ekran karşılaştırma görüntüleri
reference/                 CozFis_Multilanguage_v1.html — A/B karşılaştırma referansı (özgün)
```

Her `src/**.js` dosyası klasik bir `<script>` olarak yüklenir. Bu sayede özgün tek dosyadaki global kapsam ve yükleme sırası
birebir korunur. ES modüllerine ya da bir paketleyiciye geçilmedi; geçmek, fonksiyon kaldırma (hoisting) ve global
davranışını değiştirirdi.

## Geliştirme komutları

| Komut | Ne yapar |
|---|---|
| `npm run start` | Yerel sunucuyu başlatır (port 8080). Kodda yapılan değişiklik için sayfayı yenilemek yeterlidir. |
| `npm run export-assets` | Oyunu başsız Chromium'da `?assets=off` modunda açar ve tüm deterministik görselleri oyunun kendi üreticileriyle PNG olarak yazar. Ardından `pack` çalışır. |
| `npm run pack` | `assets/**/*.png` ve `sprites.json` dosyalarından atlas sayfalarını ve `manifest.js`'i yeniden kurar. |
| `npm run build` | `dist/web/` (sunucu/Capacitor için) ve `dist/CozFis_Standalone.html` (tek dosya) çıktılarını üretir. |
| `npm run validate` | Piksel doğrulaması yapar: A (özgün) ile B (atlas) ve C (modüler, prosedürel) karşılaştırılır. |
| `npm test` | Tüm doğrulamaları çalıştırır (`tests/run-all.sh`). |

`export-assets`, `pack`, `library` ve testler için Playwright (Chromium) gerekir: `npm install`. Oyunun kendisi için gerekmez.

## Bir görseli daha iyi bir çizimle değiştirmek (motor kodu değişmez)

1. İlgili PNG'yi düzenleyin, örneğin `assets/fish/fish_kefal_left.png`. Hangi dosyanın nerede kullanıldığı
   `dist/CozFis_AssetLibrary/CATALOG.md` içinde listelenir.
2. `npm run pack` çalıştırın. Atlaslar ve manifest yeniden kurulur. Görselin boyutu değiştiyse yeni boyut dosyadan okunur.
3. Sayfayı yenileyin.

Bu akış test edildi: bir balık PNG'sine piksel eklendi, `pack` çalıştırıldı ve değişiklik oyunda ve ansiklopedide göründü.
Doğrulama aracı da farkı yalnızca o sprite'ta yakaladı (`reports/negative_control.json`).

**Dikkat:** `npm run export-assets` komutu kaynak PNG'leri prosedürel çıktıyla **yeniden yazar**. Elle çizilmiş
görselleri koruyun ya da bu komutu çalıştırmayın.

Kurallar:
- **Balık:** `_left` asıl görseldir. `_right` ve silüet sürümleri ayrı dosyalardır; yeni çizimde hepsini birlikte güncelleyin.
- **Saç ve şapka** (`char_hair_<stil>_c<renk>`, `char_hat_<id>`): karakter gövdesinin üzerine basılan damgalardır.
  `sprites.json` içindeki `meta.off` değeri kafa noktasına göre konumu belirtir. El ve olta tutma noktası koddan
  (`personPB`) gelir ve değişmez.
- **Tekneler:** `boat_<id>_<renk>_base_back|front` dış hattı (outline) olmayan temel görsellerdir. Yükseltme damgaları
  (`_motor3_back` gibi) bu temelin üzerine basılır. Alfa değeri 1 olan pikseller "sil" anlamına gelir. Dış hat
  birleştirmeden sonra kodla çizilir.
- **Tabela içeren görseller** (kasaba ana katmanı, ev, deniz haritası): temel görsel Türkçedir. Diğer dillerin yazıları
  `assets/l10n/<id>__<dil>_<n>.png` yamalarıdır.

## Varlık kütüphanesi

```bash
node tools/build/library.js dist/CozFis_AssetLibrary
```

Kütüphane şunları içerir: tek tek PNG'ler, atlaslar, manifest, `CATALOG.md` ve `previews/` önizleme sayfaları.

## Android / Capacitor notları (bu aşamada uygulanmadı)

- Tüm yollar görelidir. `dist/web/` klasörü Capacitor'ın `webDir` klasörü olarak kullanılabilir.
- Capacitor uygulaması `https://localhost` kökeninde çalışır. Tarayıcıda (`aygforge.github.io` veya `localhost:8080`)
  oluşan kayıtlar **farklı bir kökende** kalır ve uygulamaya kendiliğinden taşınmaz. Taşıma yolu, oyunun mevcut
  "Kaydı dışa aktar / içe aktar" özelliğidir (biçim: `cozyfishing-save`, şema 5). Ayrıntı `Rendering_Migration_Report.md` §7'de.
- Kayıt ve ayar anahtarları değişmedi: IndexedDB `cozyfishing` / `saves`; localStorage `cozyfishing_save_v1`,
  `cozyfishing_backup_v1`, `cozyfishing_prev_v1`, `cozyfishing_settings_v1`, `cozyfishing_lang_v1`.

## Android (Faz 3)

Capacitor 8 tabanlı Android projesi `android/` klasöründedir. APK üretmek için `npm run android:apk` (→ `dist/CozFis_Debug.apk`).
Ayrıntılar: `README_Android.md`, `CozFis_Android_Build_Report.md`, `CozFis_Android_Test_Checklist.md`.

## Raporlar

`Asset_Inventory.md` · `Rendering_Migration_Report.md` · `Asset_Comparison_Report.md` · `Performance_Report.md`. Ham test çıktıları `reports/` klasöründedir.
