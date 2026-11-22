# CozFis — Performans Raporu (Faz 2)

Ölçüm aracı `tests/perf.js`. Her sürüm 3 kez ölçüldü ve medyan alındı. Ham veriler `reports/perf.json` dosyasında.

Ortam: Headless Chromium (Playwright), 844×390 görüntü alanı, yerel HTTP sunucusu. Bu ortam bir masaüstü sanal makinesidir
ve mutlak süreler telefonda daha uzun olur. Yine de **A/B oranları** karşılaştırma için anlamlıdır.

- **A**: özgün tek dosya, prosedürel
- **B**: modüler sürüm, PNG atlasları, isteğe bağlı çevre grupları
- **C**: modüler sürüm, `?assets=off`

## 1. Açılış ve ilk çizim

| Metrik (ms) | A (özgün) | B (atlas) | C (modüler, prosedürel) |
|---|---|---|---|
| Açılış (sayfa → ana menü hazır) | 173 | 177 | 164 |
| Bunun içinde atlas yüklemesi (çekirdek + ana menü grupları) | — | 20 | — |
| Kasaba: ilk giriş + ilk kare (`genTown` dahil) | 70 | **37** | 61,5 |
| Ev: ilk giriş + ilk kare | 18,3 | **4,1** | 18,3 |
| Tekne (Sakin Liman): ilk giriş + ilk kare | 20,3 | 18,1 | 19,3 |
| Ansiklopedi paneli ilk açılış (70 balık görseli + silüet) | 57,9 | **9,5** | 53,9 |

Açılış süresi değişmedi; atlas yüklemesi yaklaşık 20 ms ekliyor. Prosedürel üretimin yerine atlastan kesme kullanıldığında
ilk kasaba kurulumu yaklaşık 2 kat, ilk ansiklopedi açılışı yaklaşık 6 kat hızlandı. Ansiklopedinin hızlanması mobilde en çok
hissedilecek kazançtır.

## 2. Kare hızı ve kare çizim süresi (gerçek `requestAnimationFrame` döngüsü, 3 sn)

| Sahne | A FPS | B FPS | A çizim ort. / p95 (ms) | B çizim ort. / p95 (ms) |
|---|---|---|---|---|
| Kasaba | 60 | 60 | 0,282 / 0,5 | 0,288 / 0,6 |
| Tekne avı | 60 | 60,3 | 0,328 / 0,5 | 0,360 / 0,6 |

Kare başına çizim maliyeti aynı kaldı. Bu beklenen sonuçtur: her iki sürüm de önbellekteki canvas'ları `drawImage` ile çizer;
atlas yalnızca bu canvas'ların nereden üretildiğini değiştirir. Aradaki ±0,03 ms ölçüm gürültüsü düzeyindedir. Görüntü
yumuşatma kapalı (`imageSmoothingEnabled = false`).

## 3. Bellek

| Metrik | A | B | C |
|---|---|---|---|
| JS yığını (CDP `JSHeapUsedSize`) | 7,9 MB | 7,2 MB | 8,3 MB |
| Önbellekteki canvas pikselleri (Atlas.cache + bileşikler) | 15,0 MB / 169 girdi | 15,0 MB / 167 girdi | 15,0 MB / 168 girdi |
| Bellekte tutulan çözülmüş atlas sayfaları | — | 27,2 MB (çekirdek 6,2 + ana menü bölgesi 4,2 + bahar grubu 16,7) | — |
| Tüm atlas sayfaları aynı anda çözülseydi | — | 191,7 MB (bu yüzden **yapılmıyor**) | — |

- Oyunun kendi önbellek davranışı değişmedi: bölgelerde 2, kasabada 1 tahliye (evict) sınırı aynen geçerli.
- **Ek bellek** B'nin tuttuğu çözülmüş atlas sayfalarından gelir. İlk sürümde tüm çevre sayfaları arka planda yükleniyordu ve
  bu ~240 MB'lık 2048² sayfa demekti. Bu ölçüm üzerine iki değişiklik yapıldı:
  1. Çevre sayfaları gruplara ayrıldı ve yalnızca gerektiğinde yükleniyor. 45 saniye kullanılmayan grup bellekten bırakılıyor.
  2. Atlas sayfaları kullanılan alana kırpıldı. Tekne damgaları sınır kutusuna (bbox) kırpıldı; böylece tekne atlası 2048²
     boyutundan 1024×710 boyutuna indi.
  
  Kararlı durumda (oyuncu bir sahnede beklerken) bellekte çekirdek atlaslar (6,2 MB) ile o anki mevsim ve bölge grupları kalır.
  En kötü durum deniz haritasıdır: 7 bölge grubunun önceden yüklenmesi geçici olarak +29 MB tutar ve bu da 45 saniye sonra bırakılır.
- Mobil için bütçe önerisi: çekirdek 6 MB + mevsim 17 MB + bölge 4 MB ≈ 27 MB. Bu, oyunun zaten tuttuğu 15 MB'lık canvas
  önbelleğine eklenir.

## 4. Aktarım ve dosya boyutu

| | A | B (sunucu) | Tek dosya (`dist/CozFis_Standalone.html`) |
|---|---|---|---|
| İlk yüklemede aktarılan | 2.109 KB, 1 istek | 3.051 KB, 45 istek | 7,4 MB, 1 dosya |
| Uzak istek (internet) | 0 | 0 | 0 |
| Toplam atlas PNG | — | 3,8 MB, 42 sayfa; çekirdek ≈ 0,3 MB | gömülü |

B, ilk açılışta 45 yerel dosya ister: 35 kod/stil dosyası, 9 atlas sayfası (çekirdek + ana menü grupları) ve tarayıcının favicon isteği. Diğer çevre
grupları oyun ilerledikçe ve yalnızca ihtiyaç olduğunda yüklenir. Capacitor/Android'de bu dosyalar paketin içinden okunur,
ağ gerekmez.

## 5. Tembel yükleme (lazy-load) politikası

| Grup | Ne zaman |
|---|---|
| core (balık, arayüz, karakter, tekne, dekor, deniz haritası) | Açılıştan önce (`start.js` bekler) |
| `region_sakin_liman_spring`, `season_spring` | Açılıştan önce (ana menü arka planı bunları kullanır) |
| `season_<mevsim>` | `go()` ile Town / Home / PierFishing / Shore / EndDay sahnesine geçerken. EndDay'de ertesi günün mevsimi de yüklenir |
| `region_<bölge>_<mevsim>` | SeaMap açılınca (tüm bölgeler), Town'da (geçerli bölge), BoatFishing'e girerken, kayıt yüklenince (kayıttaki bölge) |
| Bırakma | 45 saniye kullanılmayan isteğe bağlı grup (15 saniyede bir kontrol) |

Bir grup zamanında yüklenmemişse görsel o anda prosedürel olarak üretilir. Görüntü aynıdır, yalnızca o seferlik atlastan
okunmaz. Ölçüm oturumlarında (normal akış ile ana menü → kasaba → ev → tekne) `AssetManager.stats.fallbacks = 0` çıktı.
