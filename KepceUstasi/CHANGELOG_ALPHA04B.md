# CHANGELOG — Alpha 0.4B (ekipman, crafting, dungeon)

Temel: Alpha 0.4A (`7e5e743`). Motor, fizik, 24 yetenek değişmedi. Veriler: `src/data/alpha04/*.json`.

| Dosya | Değişiklik |
|---|---|
| `src/systems/Equipment.js` (yeni) | 4 yuva × Common/Uncommon/Rare. Silah: her 6./4. gerçek normal atış +1 (ayrı sayaç). Kepçe: fiziksel ağız +%3/+%6 (upgrade ve Geniş Kepçe ile çarpımsal, gerçek çarpıştırıcı). Önlük: maks can +1/+2. Tava: her 7./5. tekil öldürme → sonraki salvoya proc etmeyen +1 yağ. Garantili craft: 40 parça + 120 bahşiş (L15 sonrası), 60 + 260 (L16 sonrası); atomik. |
| `src/data/stages.js` | Altın Mutfak / Malzeme Deposu: aynı motor, 4 dalga + final (JSON), her dalga sonrası yetenek seçimi, tarif/yıldız yok; Alpha03 can bazları. |
| `src/systems/RunController.js`, `GameScene.js` | Dalga sayısı ve seçim dalgaları chapter'dan (kampanya 6/6, dungeon 4/4). Dungeon sonucu ekranı; TEKRAR enerjiyle. |
| `src/systems/Progression.js` | SG = 100 + JSON upgrade ağırlıkları + ekipman puanı (yalnız gösterge). Dungeon: günde 2 tam ödül (UTC), sonra tekrar ödülü; kayıpta ödül/hak yok; ilk temizleme bonusu bir kez; runId ile tek seferlik. L15 +18 parça hibe sonucu aynı yazımda öder. |
| `src/game/StageLauncher.js` | `launchDungeon`: kilit (L7 / L15) + 10 enerji, runId başına bir kez. |
| `src/systems/SaveService.js` | Geriye uyumlu: ekipman yuvaları, `dungeonDaily`, `paidGrants`; 0.4A kaydındaki bekleyen 18 parça bir kez ödenir. |
| `src/scenes/MenuScene.js` | Yalnız iki küçük düğme: EKİPMAN (SG, L10 138 / L20 183 önerisi, craft) ve DUNGEON (haklar, ödüller, kilit). |
| `tests/unit/alpha04b.test.mjs`, `tests/sim/smoke04b.mjs` | 7 hedefli test (100 parçalık garantili yol dahil), 5 smoke koşusu. |

Notlar: L20 için kilit yok, SG kilit değil. Dungeon günlük tam ödül hakkı reklam hakkından ayrıdır. E2E testi bu sürümde çalıştırılmadı; gerçek cihaz testi yok.
