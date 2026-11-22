# CozFis — Grafik Envanteri (Faz 2)

Kaynak: `reference/CozFis_Multilanguage_v1.html`. Oyunun bütün grafikleri koddan üretilir: `PB` piksel tamponu ve Canvas
2D, harici görsel dosyası yoktur. Envanter, kaynak kodun taranmasıyla ve dışa aktarıcının (`tools/export-assets`) oyunun
gerçek çağrı noktalarından kaydettiği `Atlas` anahtarlarıyla çıkarıldı. Bu anahtarlar 848 farklı önbellek girdisine karşılık geliyor.

**Sınıflar:**
- **A** — statik sprite
- **B** — animasyon karesi
- **C** — katmanlı veya parametrik (bileşik)
- **D** — prosedürel kalan

"Dışa aktarıldı" sütunu, PNG olarak yazılıp atlasa paketlenen görsel sayısıdır.

## 1. Özet

| Grup | Üretici (kod) | Çalışma zamanı anahtarı / kancası | Sınıf | Dışa aktarıldı | Atlas |
|---|---|---|---|---|---|
| Balık, sola bakan | `fishPB` → `fishSprite` | `fish:<id>` | A | 70 | fish_atlas |
| Balık, sağa bakan | `fishPB().flipX()` → `fishSprR` | `fishR:<id>` | A | 70 | fish_atlas |
| Balık silüeti, oyun içi (sol/sağ) | `silhouette('#1d2a3e' / '#14253a')` | `fishsil:`, `fishsilR:` | A | 140 | fish_atlas |
| Balık silüeti, ansiklopedi rengi | `fishSilUrl` → `silhouette('#3a4658')` | `fishsil:` (aynı anahtar, farklı üretici; bkz. §3) | A | 70 | fish_atlas |
| Simgeler | `ICONS` / `ic()` / `iconPB` (outline) | `icon:<ad>` | A | 231 | ui_atlas |
| Arayüz çerçeveleri (CSS border-image) | `frameSkin` → `installSkins` | `skin:<tür>` → `--skin-*: url(data:)` | A | 9 | ui_atlas |
| Deniz yaşamı | `W_ART[id](f)` | `wild:<id>:<f>`, `wildR:` | **B** (2 kare × 2 yön) | 96 | props_atlas |
| Deniz yaşamı, ansiklopedi | `wildUrl` (görüldü/silüet) | `wildu:<id>[:sil]` | A | 48 | props_atlas |
| Kıyı buluntuları | `SH_ART[id]` | `sh:`, `shu:` (+silüet) | A | 72 | props_atlas |
| Martı uçuş / duran martı | `gullPB(f)`, `gullStandPB` | `gull0..2`, `gullS` | **B** / A | 4 | props_atlas |
| Kedi | `catPB(f)` | `cat0`, `cat1` | **B** | 2 | props_atlas |
| Yem (lure) | `lurePB(f)` | `lure0`, `lure1` | **B** | 2 | props_atlas |
| Şamandıra, kurşun, takipçi, yunus, kıyı kayası | `bobberPB` … `rockPB(v)` | `bobber`, `sinker`, `follower`, `dolphin`, `shrock0..3` | A | 8 | props_atlas |
| Güneş (gündüz/sabah/akşam) | `sunSprite`, `dpSun` | `sun`, `dpsun:<dp>` | A | 3 | props_atlas |
| Karakter: saç | `drawHair` (8 stil × 8 renk) | kanca: `drawHair` → `char_hair_<s>_c<r>` | **C** (katman damgası) | 64 | character_atlas |
| Karakter: şapka | `drawHat` (11 şapka) | kanca: `drawHat` → `char_hat_<id>` | **C** (katman damgası) | 11 | character_atlas |
| Karakter: gövde, ten, kıyafet, kollar, poz, göz | `personPB` | `p:<look>:<poz>` | **C/D** — parametrik, prosedürel | — | — |
| Portre (40×40) | `portraitPB` | `portrait:<look>` | D | — | — |
| Tekne: temel arka/ön | `boatParts(id, cfg)` (outline öncesi) | kanca: `boatParts` | **C** (katman) | 40 (4 tekne × 5 renk × 2) | boat_atlas |
| Tekne: yükseltme damgaları | motor / gövde / seyir / depo fark damgaları | kanca: `boatParts` | **C** (katman) | 125 | boat_atlas |
| Tekne: süs, isim levhası, dış hat | `ornamentPB`, `drawText`, `outline` | birleştirme sonrası kod | D (oyuncu verisi) | — | — |
| Kasaba | `genTown(season)` far/mid/main | kanca: `genTown` | **C** (paralaks katmanı) | 12 (+200 dil yaması) | environment_season_*, ana katman ayrı dosya |
| Kasaba projeleri, Birlik panosu, sahil tabelası | `decorateTown(v, season, pm)` | prosedürel üst katman | D | — | — |
| Bölgeler (7 × 4 mevsim) | `genRegion` far/mid/near/bed | kanca: `genRegion` | **C** (paralaks) | 112 | environment_region_* |
| İskele sahnesi (3 × 4 mevsim) | `genPier` | kanca: `genPier` (+`decoratePier` prosedürel) | **C** | 12 | environment_season_* |
| Ev içi (4 mevsim) | `genHome` + akvaryum köşesi | `home:<mevsim>` | A (dil yamalı) | 4 (+20 yama) | environment_season_* |
| Kıyı ortamları (3 × 4) | `genShore` | `shore:<env><mevsim>` | A | 12 | environment_season_* |
| Deniz haritası | `genMap` | `seamap` | A (dil yamalı) | 1 (+5 yama) | environment_common |
| Gökyüzü, gece göğü, sualtı gradyanı | `skyCanvas`, `underwaterCanvas`, `nightsky` | `sky:`, `uw:` | **D** (hava/gün ışığı) | — | — |
| Dalga kareleri | `waveFrame(seaKey, sea, f)` | `wave:` | **D** (su) | — | — |
| Bulutlar | `cloudPB`, `dpCloud` | `cloud:`, `dpcloud:` | **D** (hava tonlaması) | — | — |
| Parçacıklar, yağmur, kutlama, dürbün maskesi, akvaryum yüzücüleri, ışık efektleri | sahne `render` kodu | — | **D** | — | — |
| Tekne küçük resmi | `Atlas.url('bthumb:'…)` | `bthumb:` | D (kancalı `boatParts`'tan bileşik) | — | — |
| Yazı (bitmap font) | `FONT`, `drawText`, `TXT` | — | D (6 dil, çalışma anı) | — | — |

**Toplam:** 1.218 görsel, 225 dil yaması, 1.443 PNG. Atlaslar 6 çekirdek sayfa ve 32 isteğe bağlı çevre grubundan oluşur;
toplam 42 sayfa ve 3,8 MB PNG. Kullanılmayan boş damgalar (o katmanda değişiklik yapmayan yükseltmeler) yazılmaz.

## 2. Sınıflandırma kuralları ve gerekçe

- **A, statik:** Üretici yalnızca anahtarın içindeki parametrelere (tür kimliği, simge adı, mevsim) bağlıdır. Dışa
  aktarıcı bunu otomatik doğrular: üretici çalışırken `S` (oyun durumu) veya `SETTINGS` nesnesine erişirse görsel D sınıfına
  düşer. Bu çalıştırmada 0 görsel bu nedenle D'ye düştü, çünkü sanat üreticileri oyun durumuna erişmiyor.
- **B, animasyon:** Kareler ayrı sprite olarak atlastadır. Manifestteki `anims` alanı kare listelerini tutar
  (`gull: [gull0, gull1, gull2]`, `wild_<id>_left: [..._f0, ..._f1]` …). Kare zamanlaması oyunun kodunda kalır.
  Bu yüzden animasyon hızı ve sırası değişmedi.
- **C, katmanlı:** Tüm kombinasyonlar dışa aktarılmadı.
  - *Karakter:* 64 saç + 11 şapka damgası, karakter çiziminde özgün `drawHair` ve `drawHat` fonksiyonlarının yerine basılır.
    Gövde, ten, kıyafet deseni, kollar ve el noktası `personPB` içinde parametrik olarak kalır. Bunlar renk paleti × desen ×
    vücut × poz × göz kırpma kombinasyonlarıdır; PNG katmanına bölmek ya birebir sonuç vermez ya da kombinasyon patlamasına
    yol açar. Bu nedenle hibrit yaklaşım seçildi. **El ve olta tutma noktası değişmedi:** 1.360 karakter sprite'ının hem
    pikselleri hem de `handOf()` noktaları özgünle aynı çıktı.
  - *Tekne:* Her tekne ve renk için outline öncesi temel görsel + boyut başına fark damgaları kullanılır. Tekne başına
    54/36/36/36 erişilebilir yükseltme kombinasyonu vardır. Bunlar, tekne ve renk başına 5–7 yükseltme seviyesinin
    damgalarıyla kurulur; toplam 125 damga. Dışa aktarıcı, 162 kombinasyonun
    × 5 rengin tamamını özgün `boatParts` çıktısıyla karşılaştırdı ve hepsi birebir eşleşti. Eşleşmeyen bir kombinasyon olsaydı
    manifestin `exclude` listesine girer ve o kombinasyon prosedürel çizilirdi.
  - *Çevre:* Paralaks katmanları (far, mid, main/near, bed) ayrı PNG'lerdir. Paralaks kaydırma kodu değişmedi.
    Proje ve tabela süslemeleri (`decorateTown`, `decoratePier`) prosedürel üst katman olarak kaldı, çünkü oyun ilerlemesine bağlıdırlar.
- **D, prosedürel kalan:** Su, hava, gökyüzü, bulut ve parçacıklar istendiği gibi koddan üretilmeye devam ediyor. Ayrıca oyuncuya
  bağlı görseller (tekne adı, karakter gövdesi, portre) ve bitmap yazı da prosedürel kalıyor.

## 3. Bulunan özel durumlar

1. **Aynı anahtar, iki üretici (`fishsil:<id>`):** Oyun içi silüet (`#1d2a3e`) ile ansiklopedi silüeti (`#3a4658`) aynı önbellek
   anahtarını kullanıyor. Özgün oyunda hangisi önce çağrılırsa önbelleğe o giriyor. Bu davranışı birebir korumak için manifest bu
   anahtarı üreticinin kaynak imzasıyla eşler (`keys[key] = { <imza>: id }`). Benzer şekilde iki farklı martı çağrı noktası ve
   `icon:fishI` piksel olarak aynı çıktı verdiği için tek görsele bağlandı.
2. **Zamana bağlı üretici (`lure0`):** Üretici, kare numarasını çağrıldığı andaki `Game.t` değerinden okuyor. Sonradan yeniden
   çağrılırsa başka bir kare çıkıyor. Dışa aktarıcı bu yüzden oyunun çağırdığı anda yakalanan çıktıyı esas alır ve bu durumu raporlar.
3. **Dile bağlı görseller:** Kasaba tabelaları (OLTA, BALIK HALİ, …), ev "Rekor Duvarı" yazısı ve haritadaki pusula harfi.
   Temel PNG Türkçedir. Diğer 5 dil için yalnızca değişen dikdörtgenler 8 px hücreli yama olarak saklanır: kasaba ana katmanı
   başına 10, ev 1, harita 1 yama. Yama boyutu dile göre değişmez; bunu dışa aktarıcı doğrular.
4. **`genTown` ana katmanı 2960 px:** 2048 px atlas sınırını aştığı için bağımsız PNG dosyası olarak kalır.
5. **Doğrudan önbellek kullanan sarmalayıcılar:** `townArt`, `regionArt` ve `boatSprite` `Atlas.get` yerine `Atlas.cache`
   kullanıyor. Bu yüzden atlas bağlantısı bu sarmalayıcıların içinde değil, bir alt seviyedeki üreticilerde
   (`genTown`, `genRegion`, `boatParts`) kuruldu. Önbellek ve tahliye (evict) stratejisi değişmedi.

## 4. Dosya adlandırma

`fish_<id>_left|right`, `fish_<id>_sil_left|right[_ui]` · `icon_<ad>` · `skin_<tür>` · `wild_<id>_left|right_f<kare>`,
`wild_<id>_ui[_sil]` · `shore_<id>[_ui[_sil]]` · `char_hair_<stil>_c<renk>`, `char_hat_<id>` ·
`boat_<tekne>_<renk>_base_back|front`, `boat_<tekne>_<renk>_<boyut><değer>_back|front` · `env_town_<mevsim>_far|mid|main`,
`env_region_<bölge>_<mevsim>_far|mid|near|bed`, `env_pier_<i>_<mevsim>`, `env_home_<mevsim>`, `env_shore_<tür>_<mevsim>`,
`env_seamap` · dil yamaları `<id>__<dil>_<n>`.

Görsellerin tam listesi (boyut, anahtar, dil yaması, dosya): `CozFis_AssetLibrary/CATALOG.md`.
