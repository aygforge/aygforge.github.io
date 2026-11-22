# CozFis — Çizim Hattı Geçiş Raporu (Faz 2)

## 1. Ne yapıldı

| Önce (v1) | Sonra (Faz 2) |
|---|---|
| Tek HTML dosyası (2,1 MB), 8.100 satırlık tek bir `<script>` | `index.html` kabuğu, `css/`, `src/` altında 28 modül + 3 yeni dosya, `assets/` |
| Tüm grafikler çalışma anında `PB`/Canvas ile üretiliyor | Deterministik grafikler PNG atlaslarından; su, hava, parçacık ve oyuncu verisine bağlı görseller prosedürel |
| Varlık hattı yok | Dışa aktarıcı → kaynak PNG'ler → paketleyici → atlas + manifest → `AssetManager` |

Oyun mantığına dokunulmadı: olasılıklar, mini oyun, enerji, ekipman, fiyatlar, balık gücü, otomasyon, görevler,
başarımlar, NPC'ler, yarışmalar, kayıt şeması ve çeviriler aynı. Kanıt: 149 kabul testi 6 dilde geçti, kayıt testleri geçti
ve 9.071 önbellek girdisi ile 258 sahne karesi özgünle bit düzeyinde aynı (bkz. `Asset_Comparison_Report.md`).

## 2. Modüler bölme

- `tools/build/split-monolith.js`, özgün dosyadaki `/* ---- NN_ad.js ---- */` işaretlerine göre dosyayı 28 modüle böler.
  Bu bir kerelik geçiş aracıdır; bundan sonra kaynak `src/` klasörüdür.
- **Yükleme sırası korundu.** Her modül klasik bir `<script src>` olarak, özgün sırada yüklenir. Klasik scriptler tek bir
  global sözcüksel kapsamı paylaşır. Bu yüzden `let`/`const` küreselleri, fonksiyon bildirimleri ve sonradan yapılan yeniden
  atamalar (`decorateTown = function…`) aynen çalışır.
- **Tek bilinçli sıra değişikliği:** Özgün dosyada `boot()` çağrısı `12_main` sonunda, `12_v4_tests` tanımlanmadan önce
  yapılıyordu. Tek script içinde fonksiyon bildirimleri yukarı taşındığı (hoisting) için bu sorun çıkarmıyordu. Ayrı dosyalarda
  ise `boot()` artık `src/core/start.js` içinde, tüm modüller ve çekirdek atlaslar yüklendikten sonra çağrılır.
- **Uyarlanan iki öz-test.** İkisi de "tek dosya" varsayımını sınıyordu; amaçları, yani çevrimdışılık korunarak güncellendi:
  - `17. Dış kaynak yok`: artık göreli yerel `src`/`href` değerlerine izin veriyor, uzak şema ve `//` yasak. Dosya
    içeriklerindeki ağ API'si taraması `tools/validate/offline-check.js`'e taşındı (2,33 M karakter tarandı, 0 bulgu).
  - `v4-91. Tek HTML`: yeni adı "Harici (uzak) kaynak yok". Tek dosya sürümünde (`dist/CozFis_Standalone.html`) iki test özgün
    hâliyle de geçerli, çünkü tüm kod satır içinde.
- Vite veya benzeri bir paketleyici **kullanılmadı.** ES modülüne geçmek global kapsam davranışını değiştirirdi. Bağımlılıksız
  `tools/serve.js` geliştirme için yeterli. Playwright yalnızca dışa aktarma ve testler için geliştirme bağımlılığıdır.

## 3. Varlık hattı

```
oyun (?assets=off) ──collect.js──▶ assets/<kategori>/<id>.png + sprites.json ──pack.js──▶ assets/atlases/*.png|json + manifest.js
   (oyunun kendi üreticileri)          (sanatçının düzenlediği kaynak)                          (çalışma zamanının okuduğu)
```

**Dışa aktarıcı** (`tools/export-assets/collect.js`):
- Tarayıcıda oyunun kendisini çalıştırır. Ekran görüntüsü kırpmaz.
- `Atlas.get` çağrılarını **oyunun gerçek çağrı noktalarından** kaydeder. Bunun için tüm balıkları, simgeleri ve deniz yaşamını
  çağırır, tüm sahneleri 40 farklı zaman değerinde çizer.
- Her görseli dışa aktarmadan önce dört kontrol yapar:
  - Üretici çalışırken oyun durumuna (`S`/`SETTINGS`) erişiyor mu? Proxy ile denetlenir; erişiyorsa görsel D sınıfına düşer.
  - 6 dilin hepsinde aynı görseli mi üretiyor? Farklıysa dil yaması çıkarılır.
  - Zamana bağlı mı? Yakalanan çıktı esas alınır.
  - Aynı anahtarı birden fazla üretici mi dolduruyor? Doluyorsa imza eşlemesi yapılır.
- Bileşik üreticiler, `AssetHooks.orig` içinde saklanan özgün fonksiyonlarla dışa aktarılır.
- Tekne katmanları dışa aktarılırken her yükseltme kombinasyonu × her renk özgün çıktıyla karşılaştırılır.
- Çıktı kayıpsız PNG'dir ve özgün çözünürlüktedir (ölçeklenmez). `imageSmoothingEnabled = false`.
- Deterministiktir: sanat üreticilerinde `Math.random` yok (`ihash`, `mulberry` tohumları kodda sabit). İki ardışık
  dışa aktarma, PNG, atlas ve manifest dahil 1.522 dosyayı byte düzeyinde aynı üretti. Çıktı sırası id'ye göre sıralanır.

**Paketleyici** (`tools/build/pack.js`):
- Raf (shelf) algoritmasıyla sayfa genişliği 1024 veya 2048 px olacak şekilde paketler. Sayfalar kullanılan alana kırpılır,
  böylece çözülmüş bellek boşa harcanmaz. Sprite'lar arasında 1 px boşluk vardır.
- 2048 px'i aşan kasaba ana katmanı (2960×360) bağımsız dosya olarak kalır.
- Her atlas için JSON (`frames: id → rect, w, h, pivot, key, layer`) ve tek bir çalışma zamanı manifesti
  (`pages, keys, sprites, anims, bootGroups`) yazar. Manifest `.js` biçimindedir; `file://` altında da okunabilsin diye
  ağ API'si (fetch/XHR) kullanılmaz.

Atlas grupları:

| Grup | İçerik | Ne zaman yüklenir | Çözülmüş bellek |
|---|---|---|---|
| core | fish_atlas, ui_atlas, character_atlas, boat_atlas, props_atlas, environment_common | Açılıştan önce | 6,2 MB |
| bootGroups: `region_sakin_liman_spring`, `season_spring` | Ana menü arka planı | Açılıştan önce | 4,2 + 16,7 MB |
| `season_<mevsim>` (4) | Kasaba katmanları, iskele ×3, ev, kıyı ×3 | Kasaba/ev/iskele/kıyı/gün sonuna geçişte | 16,7 MB |
| `region_<bölge>_<mevsim>` (28) | far/mid/near/bed | Deniz haritası açılınca, tekneye binince | 4,2 MB |

İsteğe bağlı gruplar 45 saniye kullanılmazsa bellekten bırakılır. Tüm grupların aynı anda çözülmesi 192 MB tutardı;
özgün oyun da aynı anda en fazla 2 bölge tuttuğu için (`evict('region:', k, 2)`) bu tasarım onunla uyumludur.

## 4. AssetManager (`src/rendering/asset_manager.js`)

```js
AssetManager.load()                 // çekirdek + açılış grupları (start.js bekler), file:// kirlenme denetimi
AssetManager.want('region_yesil_koy_spring')   // isteğe bağlı grubu önceden yükle
AssetManager.get(id)                // → yeni <canvas> (+ etkin dilin yamaları) | null
AssetManager.pb(id)                 // → PB kopyası (katman/damga birleştirme için)
AssetManager.draw(ctx, id, x, y, { flip, scale })   // pivotlu doğrudan çizim
AssetManager.url(id, scale)         // → data URL (Atlas.url önbelleği üzerinden)
AssetManager.has(id) / meta(id) / stats / heldMB() / releaseIdle(ms)
```

- **Daima `drawImage` ile uyumlu canvas döner.** `Image` veya `ImageBitmap` hiçbir çağırana verilmez. Bu sayede
  `sprite.width`, `getContext` ve `toDataURL` kullanan mevcut kod aynen çalışır.
- **`Atlas.get(key, make)` kancası:** Bütün mevcut çağrı noktaları değişmeden atlastan beslenir. Bu kapsama hem canvas
  tüketicileri (`drawImage`) hem de data-URL tüketicileri (`Atlas.url` → `<img src>`, `--skin-*` CSS border-image) girer.
  Arayüz isabet alanları (hitbox) ve CSS değişmedi.
- **Geri dönüş:** Manifestte olmayan, henüz yüklenmemiş, yüklenemeyen veya `?assets=off` ile kapatılan her görsel özgün
  `make()` ile üretilir. Sonuç piksel düzeyinde aynıdır, `C = assets=off` testi bunu doğrular.
- **`file://`:** Yerel PNG canvas'ı kirletir ve bu durumda `toDataURL` ile foto modu bozulur. `AssetManager` bunu ilk sayfada
  algılar ve tamamen prosedürel moda geçer. Duman testinde hata çıkmadı, foto modu ve ansiklopedi görselleri çalıştı.
- Görüntü yumuşatma her yerde kapalıdır (`mkCanvas` ve `draw`).

## 5. Bileşik ve katmanlı bağlantılar (`src/rendering/asset_hooks.js`)

| Üretici | Kanca davranışı | Prosedürel kalan |
|---|---|---|
| `genTown(season)` | `env_town_<s>_far/mid/main` katmanlarından yeni canvas'lar + `{FW, MW}` | `decorateTown` (projeler, Birlik panosu, sahil tabelası) bunların üstüne çizer |
| `genRegion(rid, s)` | `far/mid/near/bed` + metaveri | Su, gökyüzü, hava, parçacık |
| `genPier(i, s)` | PB olarak verir | `decoratePier` (proje süslemeleri) |
| `drawHair` / `drawHat` | Saç/şapka damgası blit edilir (`meta.off`) | Gövde, ten, kıyafet, kollar, el noktası, outline (`personPB`) |
| `boatParts(id, cfg)` | Renk temeli + yükseltme damgaları (alfa 1 = sil) | Süs, isim levhası, outline. Kod `boatParts` kuyruğunun birebir kopyası |

Özgün fonksiyonlar `AssetHooks.orig` içinde durur. Kanca, gerekli parça eksikse o çağrıda özgün fonksiyonu çalıştırır.

## 6. Yeniden kullanılabilir sınırlar

Bilinçli olarak genel bir çerçeve kurulmadı. Yeniden kullanılabilecek sınırlar şunlar:
- `AssetManager` yalnızca `ASSET_MANIFEST` biçimine, `mkCanvas` ve `PB` fonksiyonlarına bağlıdır.
- Paketleyici yalnızca `sprites.json` ve PNG dosyalarına bağlıdır, oyun kodunu bilmez.
- Dışa aktarıcı oyuna özgüdür; aile adları ve tetikleyiciler `collect.js` içindedir.
- Yeni bir prosedürel görseli PNG'ye çevirmek için anahtarı `Atlas.get` üzerinden geçiyorsa hiçbir şey yapmak gerekmez:
  dışa aktarıcı onu otomatik bulur. Bileşik bir görsel için `asset_hooks.js` içine 3–5 satırlık bir sarmalayıcı yeterlidir.

## 7. Kayıtlar ve köken (origin) — Android geçişi uyarısı

- Kayıt sistemine dokunulmadı. Değişmeyenler: IndexedDB adı `cozyfishing`, object store `saves`; localStorage anahtarları
  `cozyfishing_save_v1`, `_backup_v1`, `_prev_v1`, `_settings_v1`, `_lang_v1`; biçim `cozyfishing-save`; şema 5.
- **Aynı köken testi** (`tests/save-compat.js`, aynı yerel sunucu):
  1. Özgün v1'de oluşturulan kayıt (gün 23, para, çanta, tekne, karakter) modüler sürümün açılışında birebir yüklendi.
  2. Açılış kayda dokunmadı: `cozyfishing_save_v1` değeri ve IndexedDB `main` kaydı byte düzeyinde aynı kaldı.
  3. Modüler sürümde oynanıp kaydedilen oyun özgün v1'de geri açıldı.
  
  Sessiz sıfırlama yok: kayıt doğrulanamazsa özgün davranış korunur, kayıt silinmez ve hata mesajı gösterilir.
- **Farklı köken:** Tarayıcı depolaması kökene bağlıdır. GitHub Pages'teki v1 (`https://aygforge.github.io/cozfis/…`) ile
  aynı sitedeki modüler sürüm (`…/cozfis/CozFis/`) **aynı kökeni** paylaşır, yani kayıt görünür. Ancak `localhost:8080`,
  `file://` ve ileride Capacitor'ın `https://localhost` kökeni **ayrı depolardır.**
- **Öneri (Android fazı):** Oyunun mevcut "Kaydı dışa aktar / içe aktar" akışı (dosya veya metin) taşıma yolu olarak
  belgelenmeli. İlk açılışta kayıt yoksa oyuncuya "Başka cihazdan/tarayıcıdan kayıt aktar" seçeneği sunulmalı. Capacitor'da
  `androidScheme: 'https'` ayarı kökeni sabit tutar; bu ayar sonradan değiştirilirse kayıtlar kaybolmuş gibi görünür.

## 8. Bilinen sınırlar

- Bir çevre grubu, sahneye girmeden önce yüklenmemişse o sahnenin ilk görünümü prosedürel üretilir. Görüntü aynıdır, yalnızca
  atlas kullanılmaz; bu durum `AssetManager.stats.fallbacks` ile izlenir. `go()` geçişlerindeki önceden yükleme bu durumu
  çoğunlukla önler. Kayıttan doğrudan tekne sahnesine dönüldüğünde bölge grubu açılıştan sonra yüklenir.
- Karakter gövdesi, kıyafet, portre ve tekne isim levhası prosedürel kalır (bkz. Asset_Inventory §2). Daha iyi bir çizimle
  değiştirilebilen karakter katmanları şimdilik saç ve şapka damgalarıdır.
- `npm run export-assets` kaynak PNG'leri prosedürel çıktıyla yeniden yazar. Elle çizilmiş görseller varsa bu komut
  çalıştırılmamalı ya da çıktı başka bir klasöre yönlendirilmelidir. Elle çizilmiş görseller için doğru komut `npm run pack`'tir.
