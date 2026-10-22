# V3.0 «Kayıp Krallığın Mirası» — Mimari Notları, Denge ve Bilinen Sınırlamalar

V3, V2'nin üzerine kurulur: mevcut karakterler, eşyalar, görev durumları, kayıtlar ve hazır sprite yolları korunur.
Kimlik ve kararların ilk planı: [`V3_PLAN.md`](V3_PLAN.md).

## Mimari: V3 V2'nin üzerine nasıl oturur

| Konu | Dosya(lar) | Not |
|---|---|---|
| Sürüm/şema | `src/data/constants.js` (`SCHEMA_VERSION = 3`, `GAME_VERSION = '3.0.0'`, `MAX_LEVEL = 40`, `PLAYER_DR_CAP = 0.6`) | EXP formülü değişmedi; 30→40 değerleri (64.880 … 142.450, toplam 1.006.820) testte sabitlenir. |
| Kayıt geçişi | `src/save/serialize.js`, `src/systems/character.js` (`ensureV3Fields`), `src/save/repository.js` | Yalnız alan ekler: `tracking[]` (eski `tracked`'tan), `mastery2`, `statResets`, `effects`, `world.flags/chests`. Eski zarf `v2_backup` olarak bir kez saklanır; Ayarlar → Yedekler'den geri dönülebilir. IndexedDB sıfırlanmaz. |
| Görev motoru | `src/systems/quests.js` | Yeni hedef tipleri: `visit` (NPC'ye uğra / görev eşyası teslim), `craft` (gerçek üretim olayı), `interact` + `ordered` / `consume` / `channel` / `mode` / `setFlag` / `sameObjectAgain`, `escort`, `defend`, `kill` + `spawn` (görev varyantı av), `dungeon` + `dungeon: <harita>`. Eski görevlerin `used` anahtarları aynı kalır. Aynı anda en çok 8 yan görev, HUD'da en çok 3 takip. |
| Görev olayları | `src/world/questEvents.js` (`EscortObj`, `DefenseObj`) | Refakat yalnız oyuncu 5 tile içindeyken ve tehdit yokken ilerler; A* rotası + 1,5 sn takılma kurtarması; 22 tile uzaklaşma veya bayılma başarısızlıktır, yeniden denenir. Savunma dalgaları korunan nesneye saldırır (oyuncu vurursa ona döner). Olay yaratıkları `questSpawn`: EXP / ganimet / görev sayacı / elit katkısı yok. |
| Haritalar | `src/data/maps/deadKingdom.js` (120×88), `blackThrone.js` (124×92), `darkCrypt.js` (100×76) | 7 yeni zemin, 3 kütle, 7 dekor, 12 damga (`tileRegistry.js`, `art/tiles.js`). Geçişler: Ayaz → Ölü Krallık (`m37` alınınca), Ölü Krallık → Kara Taht (`black_gate_open` bayrağı, `m42`), Kara Taht → Karanlık Mahzen (`m45` kapı mührü). `tools/map-preview.mjs` haritayı tarayıcısız PNG'ye çizer. |
| Zindan | `src/systems/dungeon.js`, `src/scenes/WorldScene.js` (`sealCount`, `checkStageCleared`), `src/entities/Interactables.js` (`SealObj`) | Mühürler bölüm bazında: `seals[].stage` (varsayılan 3) ve `kind: 'lever'` (kapı mekanizması, kanal, karşılaşmasız). Karanlık Mahzen: 2. bölüm 2 mekanizma, 3. bölüm 3 mühür karşılaşması. Ölümde son kontrol noktası, boss tam can ve kalkan sıfır. |
| Yaratıklar | `src/data/enemies.js`, `src/entities/Enemy.js` (`updateNormalAbility`, `dashAt`, `updateEliteV3`, `skirmish` yapay zekâsı), `src/entities/bossesV3.js` | Normal yaratık yetenekleri: Mezar Laneti, Obsidyen Darbe, Gölge Atılışı (+geri çekilme), Taht Yarması, Hiçlik Kalkanı. Lanet: kısa süreli alınan hasar artışı (`cursePlayer`, zincirlenmez). |
| Bosslar | `src/entities/bossesV3.js` | Mezar Komutanı: Mezar Darbesi, Mezar Çatlağı (≤3), Kemik Çağrısı (%70/%40), Lanetli Bayrak (%80, kırılabilir, 25 sn sonra yeniden), Son Nöbet (%25). Kayıp Kral: Kraliyet Yargısı, Ani Hamle, Kara Mermiler; %65 Kırık Taç kalkanı + 2 kadim mühür; %30 Son Hüküm (3 dilim güvenli boşluklu halka, en çok 4 kalıcı karanlık alan). |
| Loot | `src/data/loot.js` | `grave_commander` R25/E3/L0, `lost_king` R33/E8/L0,4. `LEGENDARY_SOURCE_TABLES = ['golem', 'frost_keeper', 'lost_king']`. Golem ve Donmuş Muhafız oranları/havuzları değişmedi. |
| Eşyalar | `src/data/items.js` (126 şablon), `src/data/recipes.js` | 36 V3 eşyası; Kralın Son Emri (`kings_command`, normal vuruşta %10, 8 sn iç bekleme) ve Sonsuz Hüküm (`eternal_verdict`, büyüde %9, 10 sn) `combatRuntime.js`'de; zincirlenmez. Lv.31+ yükseltme kademesi: Kara Çelik / Ruh Özü / Taht Çekirdeği (+ Sertleştirme Taşı, Sunak Kristali). |
| Kullanım eşyaları | `src/data/materials.js` (`USABLE_LIST`), `src/entities/Player.js` (`useUsable`, `inCombat`), `src/ui/panels/itemcard.js` | Çantadaki eşya kartında "Kullan". Savaş kontrolü (son 5 sn hasar / peşinde saldırgan). Arındırma Tuzu ve Kraliyet Mürekkebi görev nesnesine dokununca tüketilir. Hiçbiri ganimet çekilişini okumaz. |
| Beceriler | `src/data/skills.js`, `src/entities/Player.js` (`iron_fury`, `time_freeze`, `dmgBuffMult`), `src/systems/stats.js` (Ustalık II) | 6 aktif, 4 düğme (çubuk kayıtta). Hasar azaltma toplamı `enemyHit`'te %60 ile sınırlı ve çarpımsal. |
| Görev günlüğü | `src/ui/panels/gameMenu.js` (`questsTab`), `src/ui/hud.js` (takip, NPC işaretleri) | Ana / Yan / Sınıf / Sözleşme, bölge filtresi, kademeli alınabilir listesi, tamamlananlar, hedef türü açıklamaları. Mini haritada NPC görev işareti (yeşil teslim, sarı yeni). |

## Denge (simülasyon: `tests/unit/v3balance.test.js`, gerçek stat/hasar formülleri)

Seviyeye uygun Rare/Uncommon +3 donanım (rastgele bonuslu), bütün beceri puanları harcanmış karakter. Boss süreleri
V2 testiyle aynı hareket payını (Warrior ×1,2, Mage ×1,3) ve çağrılan yardımcıların / mühürlerin kırılma süresini içerir.

| Senaryo | Warrior | Mage | Hedef |
|---|---|---|---|
| Kefen Sürüngeni (Lv.31) | 6,1 sn | 4,1 sn | 5–12 sn |
| Kemik Okçu (Lv.32) | 5,7 sn | 3,9 sn | 5–12 sn |
| Lanetli Muhafız (Lv.33) | 11,1 sn | 6,2 sn | 5–12 sn |
| Mezar Büyücüsü (Lv.34) | 5,4 sn | 5,2 sn | 5–12 sn |
| Obsidyen Nöbetçi (Lv.36) | 11,1 sn | 5,9 sn | 5–12 sn |
| Gölge Avcısı (Lv.37) | 6,2 sn | 5,5 sn | 5–12 sn |
| Taht Celladı (Lv.38) | 11,8 sn | 6,7 sn | 5–12 sn |
| Hiçlik Rahibi (Lv.39) | 8,5 sn | 7,7 sn | 5–12 sn |
| Kefen Avcısı (elit, Lv.34) | ~66 sn | ~49 sn | 35–75 sn |
| Obsidyen Celladı (elit, Lv.39) | ~69 sn | ~53 sn | 35–75 sn |
| Mezar Komutanı (Lv.35) | ~4,9 dk | ~4,0 dk | 3–5 dk |
| Kayıp Kral (Lv.40) | ~5,8 dk | ~5,4 dk | 4–6 dk |
| 30→40 tahmini | ~6,4 sa farm (≈120 öldürme/saat) + ~4 sa görev/boss/zindan ≈ 10,4 sa | | |

Kemik Okçu ve Kefen Sürüngeni Mage'de 5 sn'nin biraz altında kalır; okçunun geri çekilmesi ve sürüngenin hızı başsız
simülasyonda yoktur (oyunda süreyi uzatır). Süre yalnız HP artırılarak uzatılmadı.

### Belge başlangıç değerlerinden sapmalar (simülasyon gerekçeli)

Belge bu statları "başlangıç denge değeri" olarak verip gerçek DPS ile kontrol edilmesini istedi. Seviye, ATK ve EXP
belgede kaldı; yalnız aşağıdakiler hedef sürelere çekildi:

| Yaratık | Belge | V3.0 | Gerekçe |
|---|---|---|---|
| Obsidyen Nöbetçi | HP 3.000, DEF 185 | HP 2.600, DEF 165 | Warrior 14,8 sn → 11,1 sn (hedef ≤12) |
| Taht Celladı | HP 3.600, DEF 215 | HP 3.100, DEF 185 | Warrior 15,7 sn → 11,8 sn |
| Obsidyen Celladı (elit) | HP 23.000, DEF 245 | HP 16.000, DEF 190 | Warrior 124 sn → 69 sn (hedef 35–75; ayrıca 5 sn'lik %30 savunma kalkanı var) |
| Mezar Komutanı | HP 70.000 (ATK/DEF serbest) | DEF 105, MDEF 120, ATK 345 | 3–5 dk |
| Kayıp Kral | HP 125.000 | HP aynı; DEF 110, MDEF 125, ATK 420 | 6,9–8,8 dk → 5,4–5,8 dk |
| Kemik Asker / Lanetli Bayrak / Kadim Mühür | — | 1.800 / 3.000 / 5.000 HP | yardımcılar savaşı uzatmasın |

## Bilinen sınırlamalar (dürüst liste)

- **Denge gerçek cihazda uzun oynanışla değil, simülasyonla doğrulandı.** Telegraflardan kaçış "hareket payı" katsayısıyla
  yaklaşık modellenir; Sarsılmaz Öfke'nin hasar artışı ve Ustalık II simülasyona katılmadı (oyunda süreleri biraz kısaltır).
- **Warrior yüksek DEF'li yaratıklarda Mage'den yavaştır** (Lanetli Muhafız, Obsidyen Nöbetçi, Taht Celladı ≈11–12 sn;
  Mage ≈6–7 sn). Bu, belgenin "yüksek fiziksel savunma" tasarımının sonucudur; ikisi de hedef aralıktadır.
- **Uçtan uca testler savaşları geliştirici kancalarıyla hızlandırır** (hasarı doğrudan uygular, karakteri hedefe taşır).
  Faz geçişleri, çağrılar, kalkanlar, refakat ve savunma gerçek oyun döngüsünde çalışır; ama tam bir boss savaşı dokunmatik
  kontrolle baştan sona oynanarak test edilmedi. Gerçek Android/iOS cihazında test **yapılamadı**.
- **Elitler V1 kuralıyla doğar** (kendi kampında 25 öldürme + 120 sn aktif süre). Testler elitleri doğrudan çağırdı.
- **Refakat / savunma olayı kayda yazılmaz:** harita değişince, bayılınca ya da uygulama kapanınca olay sıfırlanır ve
  yeniden başlatılabilir; tamamlanan hedef kayıtta kalır. Takılma kurtarması refakatçiyi sonraki yol noktasına yerleştirir
  (nadiren küçük bir sıçrama gibi görünebilir).
- **V3 yaratık, elit, boss ve NPC görselleri procedural piksel sanattır** (üçüncü taraf sprite paketi eklenmedi). Ustalık II
  görevindeki Kadim Gölge, Hiçlik Rahibi çizimini mavi tonla kullanır. Eşya/materyal ikonları mevcut Clockwork Raven / Raven
  Fantasy paketlerindeki çizimlerin renk uyarlamalarıdır.
- **Dönüş Parşömeni** keşfedilmiş Yol Taşı'nın bulunduğu bölge girişine götürür (Yol Taşı seyahatiyle aynı hedef).
- **NPC'lerin dallanan diyalog ağacı yoktur;** karşılama cümlesi, görev metni ve teslim/ziyaret konuşmalarıyla anlatılır.
- **Headless test ortamı** yazılımsal WebGL kullanır; e2e FPS değerleri (≈20–35) gerçek telefondan düşüktür.
- itch.io iframe'inde servis işçisi tarayıcıya göre kayıt olmayabilir; oyun yine çalışır (V2 notu).
- **Kayıt tarayıcıda tutulur (3.0.1 notu).** Oyun kaydı IndexedDB + localStorage'da birkaç kopya halinde saklar ve bozuk ya da
  eksik kopyalardan kendini kurtarır; ancak tarayıcı site verisini tamamen silerse (geçmiş/önbellek temizleme, gizli sekme,
  Safari'nin uzun süre ziyaret edilmeyen sitelerin verisini silmesi, itch.io iframe'inde üçüncü taraf depolama kısıtları)
  bütün kopyalar birlikte gider. Bu durumda ilerleme yalnız **yedek kodu / yedek dosyası** ile geri getirilebilir.
