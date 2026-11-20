# TEST PLAN & SONUÇLAR — Kepçe Ustası Alpha 0.1

Tarih: 20 Kasım 2026 · Ortam: Linux container, Node 22.23, Chromium (Playwright, başsız, yazılım GL)

Üç test katmanı **gerçekten çalıştırıldı**:

| Katman | Komut | Ne çalışır | Sonuç |
|---|---|---|---|
| Birim + entegrasyon | `npm test` | 56 test; gerçek Matter.js tencere/kepçe fiziği, gerçek RunController durum makinesi, CombatResolver, kayıt servisi | **56/56 geçti** |
| Tohumlu toplu simülasyon | `npm run test:sim -- 100 random` | 100 tam koşu (50 Menemen + 50 Patates), rastgele dokunuş zamanı, rastgele yetenek seçimi, gerçek fizik | **100/100 temiz** (kilit, NaN, negatif HP/bahşiş, çift ölüm, çift sonuç yok) |
| Uçtan uca tarayıcı | `npm run build && npm run test:e2e` | `dist/` derlemesi Chromium'da, **gerçek fare/dokunma tıklamalarıyla** | **16/16 geçti** (`tests/e2e/results.json`, ekran görüntüleri `tests/e2e/screenshots/`) |

Gerçek bir Android/iOS telefonda test **ÇALIŞTIRILMADI** (ortamda cihaz yok). Dokunmatik giriş Chromium mobil
emülasyonu (`hasTouch`, `isMobile`) ile test edildi.

---

## Prompt §6 QA maddeleri

| # | Madde | Nasıl test edildi | Sonuç |
|---|---|---|---|
| 1 | 360×640, 390×844, uzun telefon (412×915 = 20:9), 1080×1920'de üst/alt alan kırpılmaması | E2E `A01`: her çözünürlükte menü + oyun açılır, canvas'ın görünür alanda olduğu ve savaş/tencere/ocak bölgelerinin oyun yüksekliği içinde kaldığı ölçülür; masaüstü yatay 1280×720'de ortalanmış portrait çerçeve | **GEÇTİ** (5/5 düzen; ekran görüntüleri `layout_*`) |
| 2 | Doğru/yanlış anda bırakma farkı gerçek fizikten | `physics.test` "timing matters": aynı yığın, ortada bırakma ≥4 top, kenarda ≤1 top; ayrıca 12 konumda ölçüm (kenar 0–2, orta 5–7 yük). Simülasyon: iyi zamanlama ort. **6,57** yük, rastgele **3,91** yük | **GEÇTİ** |
| 3 | 0 top; 7 normal; 2 büyük + 3 normal (7 kapasite, 5 atış, 9 hasar) | `physics.test`: boş tencerede 0 yakalama → 1 güvence damlası (tencere sayısı değişmez); **fiziksel** 2B+3N yakalama → yük 7, 5 atış, boss'ta 9 hasar (Kepçe Genişliği Sv6 ile, çünkü 5 topluk yığın ~110 px yayılıyor). `combat.test`: 7 normal → 7 atış/7 hasar | **GEÇTİ** |
| 4 | Çift dokunuş ve pause spam ile çift kepçe/tur olmaması | `runflow.test` (25 ekstra tap, 50 pause/resume döngüsü, duraklatmada 5–10 sn zaman verme) + E2E `A02` (20 gerçek tıklama → +1 iniş, 1 tur) + E2E `A15` (16× P tuşu) | **GEÇTİ** |
| 5 | Hibrit tencerede kalan topçuklar silinmez; max 36, min 24 hedefi | `physics.test`: 12 tur boyunca yakalanmayan her topçuğun kimliği ve türü korunuyor, sayı ≤36, hedef ≥ min(36, max(24, kalan+6)); formül tablo testi; yer yoksa çakışmadan sıraya alma | **GEÇTİ** |
| 6 | Düşmanlar yalnızca sağdan sola ve yalnızca saldırıdan sonra; biber kendi 3. hareketinde 2 adım | `runflow.test`: tam bir Patates koşusunda her konum değişimi olayla eşleştirildi → sola hareket yalnızca `enemyAction` olayında, sağa yalnızca boss'un temas sonrası geri çekilmesi; `enemyAction` her zaman aynı turun `volley` olayından sonra. `combat.test`: biber 1,1,2,1,1,2; zırhlı patates 1,0,1,0 | **GEÇTİ** |
| 7 | Zırh/kalkan normal ve büyük yağla doğru erir; negatif HP yok | `combat.test`: zırhlı patates 1 normal → kalkan 2→1; büyük → kalkan 0 + 2 HP; 99 hasar → HP 0; Patates Kral 4 normal yağ → yalnızca kabuk kırılır. Simülasyonda 100 koşuda negatif HP yok | **GEÇTİ** |
| 8 | Üç düşman aynı anda ölürse tavaya/tarife birer kez; sonsuz zincir yok | `combat.test`: 3 domates + Tava Patlaması/Sos Sıçraması/Tava Yankısı → 3 öldürme, tarif +3, tekrar çağrıda artmıyor; 8 düşman + tüm zincir yetenekleri → ikincil olay ≤12; bonus mermi bonus üretmiyor | **GEÇTİ** |
| 9 | Boss'un son HP'si gidince temas yok, ödül bir kez | `combat.test` (boss ölünce kalan atışlar durur, son olay `victory`); `runflow.test` (sonuçtan sonra hiçbir olay, `finish` ikinci kez çalışmıyor); `progression.test` (aynı runId ikinci kez ödül almaz) | **GEÇTİ** |
| 10 | İki chapter ilk kez ve tekrar; yıldız, bahşiş, sonraki chapter açılışı | `runflow.test` (Menemen → upgrade → Patates → Menemen tekrar: ilk bonus yalnızca ilkinde, açılış 2) + E2E `A14`, `A14b` (gerçek tıklamalarla iki chapter boss'a kadar oynandı) | **GEÇTİ** |
| 11 | 16 yeteneğin hepsinin test edilmiş etkisi | `abilities.test`: her yetenek için ayrı ölçülebilir test (geometri, kapasite, periyot, hasar, HP, kalkan, alan hasarı, bonus mermi); teklif kuralları 200 rastgele teklif üzerinde (3 farklı kart, ≥2 aile, maks. yığın hariç, Patates'te Sos Sıçraması yok, sağlıklı Şef'e İlk Yardım yok, yeniden seçim aynı üçlüyü vermez) | **GEÇTİ** (16/16) |
| 12 | Altı upgrade hattının maliyet ve etkileri kayıttan geri gelir | `progression.test`: maliyet tablosu GDD ile birebir; atomik satın alma; Sv1–6'da kapasite 7→12, ağız 44→55 px, can/kalkan tablosu, ustalık/tava/baharat değerleri koşuya gerçekten yansıyor; kayıt/yedek round-trip. E2E `A13` + `SAVE` (tıklamayla satın alma, sayfa yeniden açılınca korunuyor) | **GEÇTİ** |
| 13 | İnternet kapalı + sekme arka planda; 100 başlatma/savaş çözümünde kilit yok | Simülasyon 100/100 temiz; E2E `A15` (visibilitychange → PAUSED, geri gelince duraklatılmış kalıyor, zaman ileri sarılmıyor); E2E `A16` (çevrimdışı yeniden açılış + gerçek bir tur); E2E `NET` (localhost dışına hiç istek yok) | **GEÇTİ** |
| 14 | Kaydedilmiş koşu yüklenince tekrar ödül, çift öldürme, çift dalga, ikinci menü yok | `runflow.test` (snapshot → SaveService JSON round-trip → restore: aynı dalga/tarif/öldürme sayısı, yeni `wavePrep` yok, her düşman bir kez ölüyor, ödül bir kez) + E2E `A15b` (3. dalgada sayfa yeniden yüklendi → DEVAM ET → aynı dalga ve tarif, koşu bitti, runId bir kez talep edildi, snapshot silindi) | **GEÇTİ** |

## GDD §18 kabul kapıları (A01–A18)

| ID | Durum | Kanıt |
|---|---|---|
| A01 Portrait | GEÇTİ | E2E layout ×5 |
| A02 Tek dokunuş/spam | GEÇTİ | runflow.test + E2E A02 |
| A03 0 topçuk | GEÇTİ | physics.test |
| A04 7 normal | GEÇTİ | combat.test |
| A05 2B + 3N | GEÇTİ | physics.test (fiziksel) + combat.test |
| A06 Hibrit yenileme | GEÇTİ | physics.test |
| A07 Tur hareketi | GEÇTİ | runflow.test |
| A08 Biber 3. hareket | GEÇTİ | combat.test; oyunda biberin üstünde "»" uyarı ikonu bir sonraki hareketi 2 adımsa görünür |
| A09 Zırh | GEÇTİ | combat.test |
| A10 Çoklu öldürme | GEÇTİ | combat.test + sim (çift ölüm taraması) |
| A11 Boss 0 HP | GEÇTİ | combat.test + runflow.test |
| A12 Yetenek seçimi | GEÇTİ | runflow.test (yalnızca dalga 1/3/5/6, 4 seçim, 1 ücretsiz yenileme, teklif dışı seçim reddi) |
| A13 Upgrade | GEÇTİ | progression.test + E2E A13 |
| A14 Chapter 1/2 | GEÇTİ | runflow.test + E2E A14/A14b |
| A15 Arka plan | GEÇTİ | E2E A15 + runflow.test |
| A16 Offline | GEÇTİ | E2E A16: ağ kapalıyken yeniden açılış + gerçek bir kepçe turu; ayrıca sunucu tamamen kapatılarak manuel doğrulandı |
| A17 İçerik | GEÇTİ (görsel inceleme) | 30 özgün PNG + 15 WAV, emoji/placeholder yok; ekran görüntüleri |
| A18 100 seed | GEÇTİ | `npm run test:sim -- 100 random` |

## Uçtan uca (E2E) sonuçları — `tests/e2e/results.json`

| ID | Kontrol | Sonuç | Ayrıntı |
|---|---|---|---|
| A01 | portrait layout 360x640 | GEÇTİ | canvas 360×640 @(0,0) in 360×640, game H=960, scale 0.667, battle h=410 |
| A01 | portrait layout 390x844 | GEÇTİ | canvas 390×844 @(0,0) in 390×844, game H=1169, scale 0.722, battle h=511 |
| A01 | portrait layout 412x915_20-9 | GEÇTİ | canvas 412×915 @(0,0) in 412×915, game H=1199, scale 0.763, battle h=526 |
| A01 | portrait layout 1080x1920 | GEÇTİ | canvas 1080×1920 @(0,0) in 1080×1920, game H=960, scale 2.000, battle h=410 |
| A01 | portrait layout desktop_1280x720 | GEÇTİ | canvas 405×720 @(437,0) in 1280×720, game H=960, scale 0.750, battle h=410 |
| A02 | tap spam → one drop / one turn | GEÇTİ | taps +1, catches 1 |
| A15 | pause spam + background auto-pause + resume | GEÇTİ | even toggles→running:true, hidden→PAUSED:true, stays paused on return:true, resume:true |
| PERF | frame rate while swinging (headless Chromium, software GL) | GEÇTİ | 45.0 fps |
| A14 | Menemen played to the boss and served | GEÇTİ | stars 3, tips 108, unlocked 2 |
| A13 | upgrade purchase by click (atomic, persisted) | GEÇTİ | toughness Sv2, spent 45, tips 63 |
| A14b | Patates Kızartması played to Patates Kral and served (upgrade active) | GEÇTİ | chapter fries, chef max HP 6, stars 3, tips 202 |
| SAVE | close/reopen keeps tips, upgrades, stars, unlocks | GEÇTİ | tips 202, stars M3/F3 |
| A15b | wave checkpoint resume after reload: no double kill/wave/reward | GEÇTİ | wave 3, recipe {"tomato":3,"pepper":1,"egg":0}, result victory 3★, +78 tips once |
| A16 | offline: reload with network off, menu + a real turn work | GEÇTİ | service worker cache |
| NET | no request to any external host (no CDN/ads/analytics) | GEÇTİ | only localhost |
| ERR | no page errors / console errors | GEÇTİ |  |

**16/16 kontrol geçti** — çalıştırma: 2026-11-20T14:07:03.786Z. Tam oynanış E2E'de animasyon hızı 2x idi (oyun mantığını etkilemez).

## Tohumlu simülasyon (100 koşu, rastgele dokunuş)

```json
{ "runs": 100, "policy": "random", "failures": 0, "wins": 100, "winRate": 1,
  "avgLoad": "3.91", "avgTurns": { "menemen": "22.90", "fries": "27.62" },
  "avgHpLost": { "menemen": "0.18", "fries": "0.28" }, "stars": [0, 0, 8, 92], "seconds": "329.1" }
```

Ek ölçüm (40 koşu, "iyi oyuncu": kepçe tencerenin ortasındayken dokunur): kazanma %100, ort. yük **6,57**,
ort. tur Menemen 14,7 / Patates 18,3, can kaybı 0, 40/40 üç yıldız.

## Denge gözlemleri (önemli)

GDD'deki sayılar **değiştirilmeden** uygulandı. Simülasyonlar bu sayılarla oyunun GDD'nin hedeflediğinden
(ilk denemede ~%60–80 tamamlanma) **çok daha kolay** olduğunu gösteriyor: rastgele zamanda dokunan bir bot bile
iki chapter'ı %100 bitiriyor. Nedeni: düşmanlar x≈0,90'da doğup temas sınırına (x≤0,20) 7 hareketle ulaşıyor;
Şef tur başına 4–7 hasar veriyor; dalga toplam HP'si 8–14 olduğu için çoğu dalga 2–3 turda bitiyor.

Aynı tohumlarla karşılaştırma (`node tests/sim/balance.mjs 16 random`, oyun verisini değiştirmeyen deney betiği):

| Deney (yalnızca test) | Kazanma | Ort. can kaybı | Ort. tur | Yıldız (0/1/2/3) |
|---|---:|---:|---:|---|
| GDD (mevcut) | %100 | 0,31 | 24,8 | 0/0/2/14 |
| Spawn x≈0,62 (temasa 4 adım) | %100 | 0,38 | 24,9 | 0/0/2/14 |
| Tüm düşman HP ×1,6 | %100 | 1,81 | 36,4 | 0/0/11/5 |
| Spawn x≈0,62 + HP ×1,6 | **%69** | 2,75 | 35,9 | 5/0/7/4 |

Öneri: gerçek oyuncu testinden önce düşman HP'sini ve/veya başlangıç mesafesini birlikte ayarlamak
(`src/data/content.js` → `ENEMIES[*].hp`, `FIELD.spawnXMin/Max`). Bu karar tasarımcıya bırakıldı.

## Performans

* Başsız Chromium + yazılım GL (GPU yok) ile salınım sırasında ölçülen kare hızı: E2E `PERF` satırına bakın
  (son koşu 45 fps, önceki boşta koşu ~51 fps; aynı makinede 3 simülasyon paralel koşarken ~20 fps ölçüldü). Gerçek cihazda GPU ile ölçülmedi.
* Fizik: 60 Hz sabit adım × 3 alt adım; Node'da 30 topçukla adım başına ~0,35 ms.
* Fizik yalnızca salınım/kepçe/yenileme fazlarında ilerler; animasyon fazlarında donar. Bu yüzden animasyon
  hızı (1x/2x) veya FPS düşüşü tur sonucunu değiştirmez; arka plandan dönüşte zaman ileri sarılmaz
  (kare başına en fazla 6 adım, duraklatmada biriken süre sıfırlanır).

## Çalıştırılmayan / eksik testler

* Gerçek telefon (Android/iOS) üzerinde dokunma, çentik/safe-area ve ses: **ÇALIŞTIRILMADI**.
* Gerçek Android geri tuşu: tarayıcıda `popstate` ile taklit edildi; Capacitor'da **ÇALIŞTIRILMADI**.
* Uzun süreli bellek/ısı testi: **ÇALIŞTIRILMADI**.
* Ses/titreşim çıktısının kulakla doğrulanması: **ÇALIŞTIRILMADI** (dosyalar üretildi ve yükleniyor).
