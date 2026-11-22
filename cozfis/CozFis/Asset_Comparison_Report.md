# CozFis — Görsel Karşılaştırma Raporu (A/B)

- **A** — `reference/CozFis_Multilanguage_v1.html`: Faz 1'in tek dosyası, değiştirilmedi. Her şey prosedürel çizilir.
- **B** — `index.html`: modüler sürüm, görseller PNG atlaslarından gelir. Doğrulamada `?assets=all` ile tüm sayfalar yüklenir.
- **C** — `index.html?assets=off`: modüler sürüm, prosedürel. Kontrol grubudur.

Ortak koşullar:
- Üç sürüm aynı yerel sunucudan, Headless Chromium ile çalıştırıldı.
- `Math.random` tohumlu bir LCG ile değiştirildi, `Date.now` sabitlendi ve `Game.t` her karede aynı değere ayarlandı.
- Ekran testlerinde `requestAnimationFrame` durduruldu ve kare elle çizildi.
- Karşılaştırma ölçütü **bit düzeyinde eşitliktir** (RGBA, tolerans 0).

## 1. Varlık ve önbellek düzeyi (`tools/validate/pixel-validate.js`)

Aynı çağrı dizisi (`tools/validate/driver.js`) 6 dilin her birinde A, B ve C'de çalıştırıldı. Dizinin kapsamı:
- 70 balık × 4 varyant ve ansiklopedi silüeti
- 231 simge, 9 arayüz çerçevesi, 24 deniz canlısı × 6 görünüm, 24 kıyı buluntusu × 3 görünüm
- Ev, kıyı ve deniz haritası
- Kasaba ve iskele: 4 mevsim × 2 proje durumu (`0000` / `1111`, `decorate*` üst katmanıyla birlikte); 7 bölge × 4 mevsim
- Teknelerin bütün yükseltme alt kümeleri (54 + 36 + 36 + 36 = 162 kombinasyon) × 5 renk, ayrıca isim levhası ve süslü sürümler
- 1.360 karakter sprite'ı: 8 saç × 8 renk × 13 poz; 11 şapka × 8 saç × 6 poz. El noktası `handOf()` dahil
- 9 sahne: MainMenu, CharacterCreator, Town, Home, PierFishing, SeaMap, Shore, EndDay ve 7 bölgede BoatFishing. Her biri 3 farklı zamanda, tüm 640×360 tampon. EndDay, gün sonu raporu olmadan çizilemediği için A ve B'de aynı hatayı verir; bu durum her dil için 1 girdi olarak karşılaştırmaya dahildir

| Karşılaştırma | Önbellek girdisi | Data-URL (`<img>`, CSS çerçeve) | Sahne karesi (640×360) |
|---|---|---|---|
| **A ↔ B** | **9.071 / 9.071 aynı** | **2.982 / 2.982 aynı** | **258 / 258 aynı** |
| A ↔ C | 9.071 / 9.071 aynı | — | 258 / 258 aynı |

B'nin atlas istatistiği: 6.213 atlas isabeti, 384 katman/damga birleştirmesi, **0 geri dönüş**, 0 yükleme hatası.
Sayfa hatası: A 0, B 0, C 0. Ham çıktı: `reports/pixel_validation.json`.

**Negatif kontrol:** Aracın gerçek farkları yakalayıp yakalamadığı ayrıca sınandı. `assets/fish/fish_kefal_left.png`
üzerine 2×2 magenta piksel eklendi ve `npm run pack` çalıştırıldı. Araç tam olarak 2 farkı yakaladı:
`tr|fish:kefal` önbellek girdisi ve `tr|fish:kefal@2` data-URL'i. Diğer 4.475 girdi ve 43 sahne karesi değişmedi.
Bu deneme aynı zamanda "PNG değiştir → motor kodu değişmeden oyuna yansır" akışının çalıştığını gösterir.
Sonra özgün PNG geri kondu. Ham çıktı: `reports/negative_control.json`.

## 2. Ekran düzeyi (`tests/screens-ab.js`)

İstenen 11 ekran, 6 dilde, sayfanın tamamı (canvas ve HTML arayüz) 844×390 boyutunda yakalandı ve piksel piksel karşılaştırıldı.

| Ekran | tr | en | es | de | fr | pt-BR |
|---|---|---|---|---|---|---|
| Ana menü | 0 | 0 | 0 | 0 | 0 | 0 |
| Karakter oluşturma | 0 | 0 | 0 | 0 | 0 | 0 |
| Kasaba | 0 | 0 | 0 | 0 | 0 | 0 |
| İskele | 0 | 0 | 0 | 0 | 0 | 0 |
| Balık mücadelesi (HUD + misina) | 0 | 0 | 0 | 0 | 0 | 0 |
| Tekne avı | 0 | 0 | 0 | 0 | 0 | 0 |
| Deniz haritası | 0 | 0 | 0 | 0 | 0 | 0 |
| Envanter | 0 | 0 | 0 | 0 | 0 | 0 |
| Ansiklopedi | 0 | 0 | 0 | 0 | 0 | 0 |
| Ev / dekor | 0 | 0 | 0 | 0 | 0 | 0 |
| Ayarlar | 0 | 0 | 0 | 0 | 0 | 0 |

Tablodaki değerler farklı piksel sayısıdır. **66 / 66 ekranda fark 0.**

Görüntüler `reports/screens/tr_<ekran>_A.png` ve `_B.png` dosyalarında. Yan yana özet: `reports/screens/overview_tr_A_vs_B.png`.

Test ilk çalıştırıldığında *tekne* ve *deniz haritası* ekranlarında 20.784 piksel fark çıktı. İnceleme, farkın HTML bildirim
kutularının (toast) CSS giriş animasyonunun hangi aşamada yakalandığından kaynaklandığını gösterdi; sprite'larla ilgisi yoktu.
Ölçüm, iki sürümde de bildirimler temizlenip CSS animasyonları dondurularak yeniden yapıldı ve fark 0 çıktı.

## 3. Özellik bazında sonuç

| Özellik | Sonuç |
|---|---|
| Statik sprite'lar (balık, simge, kıyı, deniz yaşamı, dekor) | Bit düzeyinde aynı |
| Animasyonlar (martı, kedi, yem, deniz canlısı kareleri) | Kare zamanlaması kodda; kareler aynı. Sahne kareleri 3 zaman noktasında aynı |
| Karakterler (saç/şapka damgası + parametrik gövde) | 1.360 sprite ve el noktaları aynı |
| Tekneler (temel + yükseltme damgaları + isim/süs) | 162 × 5 + 20 varyant aynı |
| Çevre (paralaks katmanları, proje süslemeleri, dil yamaları) | 6 dil × 4 mevsim × 2 proje durumu aynı |
| Su, gökyüzü, hava, parçacık (prosedürel) | Aynı. Kod değişmedi |
| HTML arayüz, CSS çerçeveleri, isabet alanları | Aynı. CSS ve DOM değişmedi, data-URL'ler aynı |
| `imageSmoothingEnabled` | Her yerde `false` (özgün `mkCanvas` + `AssetManager.draw`) |

## 4. Diğer doğrulamalar

| Test | Sonuç | Çıktı |
|---|---|---|
| Oyun içi 149 kabul testi × 6 dil (B, atlas açık) | **149/149** her dilde, sayfa hatası 0 | `reports/qa_langs.json` |
| Tek dosya sürümü `file://` ile, 149 test | 149/149, atlaslar `data:` URI'den | `reports/smoke.json` |
| Modüler sürüm `file://` ile | Kirlenme algılandı, prosedürel mod; hata 0, foto modu çalışıyor | `reports/smoke.json` |
| Çevrimdışı statik tarama | 35 dosya, 2,33 M karakter; uzak URL/ağ API'si 0 | `reports/run_all.log` |
| Ağ istekleri (B, oturum boyunca) | Yalnızca yerel; uzak istek 0 | `reports/smoke.json`, `reports/perf.json` |
| Kayıt uyumluluğu (aynı köken) | A → B yüklendi, açılışta değişmedi; B → A geri açıldı | `reports/save_compat.json` |
| Ses (Web Audio sentezi) | `AudioContext` çalışıyor (`running`), efektler hatasız | `reports/smoke.json` |
| Karakter oluşturucu, 6 dilde canlı dil değişimi | Çalışıyor (33 kontrol, envanter başlıkları her dilde doğru) | `reports/smoke.json` |
| Yüklemeden sonra ağ bağlantısı kesildi | Oyun devam etti, tekne sahnesi çizildi. Önceden yüklenmemiş bir bölge grubu yüklenemedi; tarayıcı 1 `ERR_INTERNET_DISCONNECTED` kaydı yazdı ve görsel prosedürel çizildi. Paketli (Capacitor) kurulumda dosyalar yereldir | `reports/smoke.json` |
| Dışa aktarma determinizmi | Ardışık iki çalıştırma: 1.522 dosya byte düzeyinde aynı | — |
