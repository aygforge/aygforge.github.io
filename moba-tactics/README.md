# Project MOBA Tactics (çalışma adı) — v0.1 oynanabilir HTML5 bot prototipi

3v3 gerçek zamanlı MOBA strateji / auto-battler hibriti. Oyuncu üç şampiyonu doğrudan yürütmez;
takım kompozisyonu, davranış stilleri, buildler ve taktik puanı (TP) harcayan bireysel emirlerle yönetir.
Rakip takımı, oyuncuyla aynı kuralları ve aynı görüş bilgisini kullanan bir bot komutanı yönetir.

## Çalıştırma

```bash
npm install
npm run generate:assets   # tüm pixel art'ı deterministik olarak yeniden üretir (assets/generated)
npm run dev               # geliştirme sunucusu
npm run build             # dist/web  (çevrimdışı çalışan web paketi + catalog.html asset kataloğu)
npm run build:standalone  # dist/standalone.html (tek dosya, tüm JS/CSS/PNG gömülü)
npm run package:itch      # dist/moba-tactics-html5.zip (itch.io HTML5 yüklemesi)
npm run test              # 217 headless test (vitest)
npm run sim -- 12         # 12 bot-bot maçlık hızlı denge raporu
node scripts/ui-smoke.mjs <klasör>   # (vite preview açıkken) tarayıcı smoke testi + ekran görüntüleri
```

## Mimari

| Katman | Konum | Not |
|---|---|---|
| Game Core | `src/core` | Phaser'dan bağımsız; 20 Hz sabit adım, seed'li PRNG, hasar/iyileşme hattı, yetenek kitleri, eşyalar, minyon/kule/orman/boss, görüş, ölüm/doğma, kazanma |
| Champion AI | `src/ai/championAI.ts`, `src/ai/skillAI.ts` | Yalnızca `Perception` (takım görüşü) üzerinden okur |
| Bot Commander | `src/ai/botCommander.ts` | Yalnızca `observe()` çıktısını görür; oyuncuyla aynı komutları kullanır |
| Player Controller / UI | `src/ui` | DOM tabanlı mobil HUD, menü, hazırlık, build paneli |
| Renderer | `src/render` | Phaser 3 sahnesi, atlas animasyonları, VFX, savaş sisi, kamera, Web Audio sentezi |
| Kayıt | `src/save/storage.ts` | Sürümlü LocalStorage şeması; bozuk kayıt oyunu engellemez |
| Gelecek ağ arayüzü | `src/network/protocol.ts` | Yalnızca tipler (canlı sunucu yok) |
| Asset üretici | `scripts/generate-assets.ts`, `scripts/gen/*` | Programatik pixel art → PNG atlas + JSON + animasyon manifesti |

## İçerik
- 18 şampiyon (6 sınıf × 3), her birinde pasif + 2 yetenek + ulti (Sv.5'te açılır, Sv.9'da güçlenir), normal saldırı, özel AI tercihleri.
- 8 bileşen, 24 eşya (tüm pasifleri gerçek hasar/iyileşme olaylarına bağlı), 4 yuva, atomik ikinci bileşen + birleşim, %70 satış, 54 hazır build.
- 8 kule, 2 kristal, 6 orman kampı, 2 boss (Kan Hükümdarı, Harabe Titanı) ve takım bufları.
- Minyon dalgaları (0:10, 22 sn, her 3. dalgada kuşatma), dakikaya bağlı güçlenme.
- Taktik puanı (100 maks, 2/sn), rol bazlı emirler, ormancı stratejileri, davranış stilleri.
- Takım bazlı görüş + LOS (ağaçlar görüşü keser), son görülen konum, gizlenme, Şahin Gözü görüşü.
- 3 bot zorluğu, 3 bot kişiliği, duruma göre değişen bot stratejisi, Zor botta karşı build uyarlaması.

## Üretilen görseller
`assets/generated`: **42 atlas, 5.500 kare**, 1600×900 harita kompozisyonu, minimap, manifest.
- 18 şampiyon × 9 animasyon (idle, walk, attack, s1, s2, ult, hit, death, recall) × 4 yön = 172 kare/şampiyon
- 18 birim atlası: 6 minyon varyantı, 5 orman yaratığı, 5 çağrılan birim (kurt, ayı, iskelet, kemik devi, rün nöbetçisi), 2 boss (96 px) — her biri 6 animasyon × 4 yön
- Kuleler/kristaller/üs, 18 zemin tile'ı, 27 dekor sprite'ı, 66 VFX/mermi animasyonu, 46 ikon, 18 portre
- Önizleme: `dist/web/catalog.html`

## Testler (son çalıştırma: 217/217 geçti)
`tests/` — şampiyon başına normal saldırı, 3 yetenek, ulti kilidi/güçlenmesi, ölüm/doğma, AI hareketi ve
18 pasifin tek tek doğrulanması; 24 eşya/8 bileşen/54 build veri bütünlüğü ve pasifler; TP ve emirler;
görüş/son görülen konum/AI'nın görünmeyen hedef kullanmaması; kule/kristal kuralları; 10 tam headless
bot maçı (hepsi kristal yıkımıyla biter, sıkışan minyon/arazi dışı birim yok); determinizm; atlas/kare doğrulaması.

## Bilinen sınırlamalar
- Gerçek Android cihazda test edilmedi; yalnızca headless Chromium'da 1280×720 ve 915×412 yatay görünümler denendi.
- Sağ yön kareleri sol yönün yansımasıdır (yan profil çizimi tek, aynalanmış).
- Bot-bot maç süresi ortalaması ~7,6 dk (hedef 6–8 dk), ancak dağılım geniş: 4,5–13 dk arası maçlar görülüyor.
- Olay akışı (`GameEvent`) henüz takıma göre filtrelenmiyor; PvP sunucusu için `observe()` dışında olay filtresi eklenmeli.
- Ses efektleri basit Web Audio sentezidir; müzik yok.
