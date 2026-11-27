# CHANGELOG — Alpha 0.4A (20 level kampanya + enerji)

Temel: Alpha 0.3 (`f4f73b8`). Motor, fizik, 24 yetenek, 6 dalga + 6 seçim ritmi değişmedi. Veri: `src/data/alpha04/`
(paketteki JSON'lar birebir), tasarım: `docs/alpha04/Kepce_Ustasi_Alpha04_Teknik_GDD.md`.

| Dosya | Değişiklik |
|---|---|
| `src/data/stages.js` (yeni) | Stage-data adaptörü: 20 level → motor "chapter" biçimi. Normal can = round(`enemyHpAlpha03` × `hpScale`), JSON dalgaları, spawn aralığı, tarif, ödül, SG önerisi, açılımlar. Final: L10/L20 mevcut boss davranışıyla (42/54, kalkan 4); diğerleri mevcut sprite'ı kullanan, özel davranışsız sentetik final düşman (JSON can/kalkan/hareket/geri çekilme). `findChapter` eski chapter'ları da çözer. |
| `src/systems/EnergyService.js` (yeni) | 30 maks/başlangıç, giriş 10, 12 dk'da +1 (çevrimdışı, artık devreder, geri saat kazandırmaz), runId başına tek düşüm, UTC günü 2 doğrulanmış reklam dolumu (30'a tamamlar), L1–L3 ilk temizlemede bir defalık +10 (30 sınırıyla). |
| `src/game/StageLauncher.js` (yeni) | Level başlatmanın tek yolu: kilit → enerji düşümü → kalıcı yazım → sahne. Devam/yeniden yükleme bu yoldan geçmez (ikinci düşüm yok). |
| `src/systems/SaveService.js` | İdempotent `migrateToAlpha04`: bahşiş, upgrade, ayar, eski chapter yıldızları korunur; `legacyCompletedChapters`, `stageProgress` (L1'den), `energy`, `equipment` (4× common), `dungeonDaily`, `currencyParts`, `unlockEvents`, `pendingGrants`. Şema sürümü aynı (1). |
| `src/systems/Progression.js` | `applyStageResult` (runId ile tek seferlik: bahşiş × yıldız çarpanı + ilk temizleme, en iyi yıldız, sonraki level kilidi, enerji iadesi, açılım olayları), `currentLevel`, `isStageUnlocked`, `chefPower` (gösterge; gizli çarpan/kilit yok). |
| `src/systems/RunController.js`, `EnemyDirector.js`, `CombatResolver.js` | Chapter araması `findChapter`'a; final kalkanı `balance.bossShield`. |
| `src/scenes/MenuScene.js` | Enerji göstergesi (+1 sayacı), "OYNA · L#", LEVEL SEÇ (L1–L20, yıldız, kilit, mini boss/boss rengi, SG önerisi, reklam dolumu hakkı + UTC sıfırlama, devre dışı reklam düğmesi, L7/L15/L16 içerikleri "Yakında", eski sürüm rozetleri). |
| `src/scenes/GameScene.js` | Kampanya runId'si, level sonucu/ödülü, enerji iadesi ve açılım satırları, SONRAKİ/TEKRAR enerjiyle. |
| `src/platform/AdService.js` | Doğrulanmış ödül sözleşmesi belgelendi; web'de hâlâ `unavailable`. |
| `tests/unit/alpha04.test.mjs`, `tests/sim/smoke04.mjs` (yeni) | 7 hedefli test; 5 deterministik smoke koşusu. |

**0.4A'da veri olarak kayıtlı, ekranı 0.4B'de:** `gold_kitchen` (L7), `materials_depot` + `materials_starter_grant_18` (L15, parça henüz `pendingGrants`'ta, verilmedi), `rare_crafting` (L16). Ekipman/craft/dungeon kodlanmadı.

**Bilinenler:** `tests/e2e/e2e.mjs` eski chapter akışına göre yazılı; bu sürümde güncellenmedi ve çalıştırılmadı (talimattaki test bütçesi). Gerçek cihaz testi yok. Level ilk temizleme iadesi 30 sınırını aşmaz (varsayım).
