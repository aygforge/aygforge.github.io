# V2.0 Mimari Notları ve Bilinen Sınırlamalar

## Mimari: V2 V1'in üzerine nasıl oturur

| Konu | Dosya(lar) | Not |
|---|---|---|
| Sürüm/şema | `src/data/constants.js` (`SCHEMA_VERSION = 2`, `GAME_VERSION`, `MAX_LEVEL = 30`, `V1_MAX_LEVEL`) | EXP formülü değişmedi; 20→30 değerleri formülden çıkar ve testte sabitlenir. |
| Kayıt geçişi | `src/save/serialize.js` (`migrate`), `src/systems/character.js` (`ensureV2Fields`), `src/save/repository.js` (`load`, `writeRaw`) | Geçiş yalnız alan ekler. Eski zarf `v<N>_backup` anahtarında bir kez saklanır. Doğrulama `skillBar` ve seviye ≤ 30 denetler. |
| Zindan genelleştirme | `src/systems/dungeon.js` (`DUNGEON_INFO`, `getRun`, `breakSeal`…) | Derin Ocak koşusu V1 uyumu için `char.dungeon`'da, Buz Mabedi `char.runs.frost_temple`'da. Bütün işlevler `mapId` alır (varsayılan `'dungeon'`). Kilitler: V1 `world.dungeonUnlocked`, V2 `world.flags.unlocked_<id>`. |
| Zindan çalışma zamanı | `src/world/spawner.js` (`initDungeon`, `spawnSealWave`), `src/scenes/WorldScene.js` (`checkSeals`, `checkStageCleared`), `src/entities/Interactables.js` (`SealObj`, `DungeonGateObj`) | Boss kimliği harita tanımındaki `boss` alanından gelir. Mühür dalgası yaratıkları 3. bölüme sayılır; mühür kırılması koşuda kalıcıdır, dalga yarıda kalırsa (kapanma) yeniden başlatılabilir. |
| Loot | `src/data/loot.js` (`LEGENDARY_SOURCE_TABLES`, `BOSS_RARE_POOL`, `BOSS_EXTRA_EPIC_SOURCES`), `src/systems/loot.js` | Golem Rare havuzu Lv.13–20 ile sınırlandı → V1 havuzu birebir aynı. `elemental` tür bonusu yalnız Lv.21+ eşyalarda çıkar (V1 eşyalarının bonus havuzu değişmez). |
| Boss/elit mekanikleri | `src/entities/bossesV2.js`, `src/entities/Enemy.js` (`butcher_cleave`, `ice_slam`, öfke, yavaşlatma), `src/world/combatRuntime.js` (`groundHazard`, `fallingShard`, `slowPlayer`, `lightningLink`) | Telegraf alanı = isabet alanı (`inTelegraphCircle`, `pointInBeam`). Yavaşlatma zincirlenmez (süre uzamaz, en güçlü oran geçerli). |
| Beceriler | `src/data/skills.js` (`blade_rain`, `chain_lightning`, `MASTERY_BOOKS`), `src/entities/Player.js` (`execSkill`, `book`), `src/systems/character.js` (`setSkillBar`, `applyMasteryBook`) | HUD düğmeleri `char.skillBar`'ı okur. Ustalık Kitabı etkisi yalnız beceri Rank 5 iken etkin (sıfırlamada kitap kaybolmaz). |
| Av Geçmişi | `src/systems/rewards.js` (`applyKill`), `src/world/combatRuntime.js` (zindan tamamlama), `src/ui/panels/gameMenu.js` (`historyTab`) | Sayaçlar `char.history`'de; loot çağrıları bu alanı okumaz (birim testte aynı tohumla kanıtlanır). |
| Procedural sanat | `src/art/monstersV2.js` (12 sprite + `collapse` ölüm kareleri), `src/art/tiles.js`, `src/art/objects.js`, `src/art/icons.js`, `src/art/characters.js` (V2 NPC'leri) | `tools/preview-art.mjs` ile sprite şeritleri tarayıcısız PNG olarak incelenebilir. |
| Atmosfer/ses | `src/scenes/WorldScene.js` (`flakes`), `src/audio/sound.js` (`ash`, `frost`, `temple` temaları) | Parçacık havuzu sabit sayıda (36/54/22), düşük performans modunda ~%35'i. |
| PWA | `vite.config.js` (servis işçisi üretimi), `src/main.js` (güncelleme bildirimi) | Gezinme isteği önce ağ, varlıklar önce önbellek; yeni işçi `SKIP_WAITING` mesajıyla etkinleşir. |

### Yeni bölge eklerken
1. `src/data/maps/<id>.js` tanımı (alanlar, yollar, damgalar, nesneler, girişler) → `src/data/maps/index.js`.
2. Gerekirse `tileRegistry.js`'e terrain/geçiş/kütle/dekor/damga, `art/tiles.js`'e çizimi.
3. `tests/unit/v2.test.js` ve `tests/unit/maps.test.js` haritayı otomatik olarak bağlantı/erişilebilirlik testinden geçirir.

## Denge özeti (simülasyon: `tests/unit/balance.test.js`)

| Senaryo | Sonuç |
|---|---|
| Warrior Lv.26 Rare+3 → Kül Devi | ~4,2 dk (hareket payı ×1,2) |
| Mage Lv.26 Rare+2 → Kül Devi | ~3,3 dk (hareket payı ×1,3) |
| Warrior Lv.30 Rare/Epic+4 → Donmuş Muhafız (+2 kristal) | ~5,4 dk |
| Mage Lv.30 Rare/Epic+3 → Donmuş Muhafız (+2 kristal) | ~4,0 dk |
| 20→30 tahmini süre | ~5,8 sa farm (≈120 öldürme/saat) + ~3 sa görev/boss/zindan ≈ 8,8 sa |

## Bilinen sınırlamalar (dürüst liste)

- **Denge simülasyonla doğrulandı, gerçek cihazda uzun oynanışla değil.** Boss süreleri ve 8–12 saatlik içerik tahmini
  gerçek formüllerle hesaplanan başsız simülasyondur; telegraf kaçışı "hareket payı" katsayısıyla yaklaşık modellenir.
  Normal yaratık öldürme süreleri (1,5–5,5 sn) V1'deki gibi kısadır; saatlik öldürme sayısını yürüme/dinlenme belirler.
- **Warrior, yüksek DEF'li Donmuş Muhafız'da Mage'den ~%35 yavaştır** (V1'de Golem'de de benzer fark vardı). İki sınıf da
  tek başına yenebilir; fark 1,6 katın altında tutulur. Boss statları belgeye bağlı olduğundan değiştirilmedi.
- **Ekipman görünümü:** Hazır LuizMelo kahraman sprite'ları ekipman katmanı desteklemez. Bu yüzden ya animasyonlu sprite
  (silah nadirliği halkasıyla) ya da ekipmanı gösteren piksel kahraman seçilebilir; ikisini birleştiren katmanlı çizim yoktur.
- **Mühür karşılaşması kapanmada sürmez:** Uygulama mühür dalgası sırasında kapanırsa o mühür kırılmamış sayılır ve
  yeniden başlatılabilir (önceden kırılan mühürler ve temizlenen bölümler korunur).
- **Kül Devi açık dünya bossudur:** 15 dk aktif oyun süresiyle yeniden doğar (Alfa Kurt gibi), her doğuşun ödülü bir kezdir.
- **V2 hikâye NPC'leri sözlü diyalog ağacı içermez;** görev metinleri ve kısa bildirimlerle anlatılır (V1 ile aynı yapı).
- **Güncelleme bildirimi** yalnız servis işçisinin çalıştığı ortamlarda (HTTPS/localhost) görünür; itch.io iframe'inde
  tarayıcıya bağlı olarak servis işçisi kayıt olmayabilir — oyun yine çalışır, sayfa her açılışta güncel sürümü alır.
- **Headless test ortamı** yazılımsal WebGL kullanır; e2e FPS değerleri gerçek telefondan düşüktür.
- Wizard Pack (Mage sprite'ı) paketinde lisans dosyası yoktur; itch.io sayfasındaki lisans yayından önce doğrulanmalıdır
  (V1'den devreden not, bkz. `CREDITS.md`). V2'de üçüncü taraf varlık eklenmedi.
