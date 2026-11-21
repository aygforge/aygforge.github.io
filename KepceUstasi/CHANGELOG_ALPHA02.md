# CHANGELOG — Alpha 0.2 (Yetenek ve Denge Revizyonu)

Temel: Alpha 0.1 (commit `0cd3e26`). Oyun sıfırdan yazılmadı. Fizik, kepçe, hibrit tencere, durum makinesi, kayıt,
menü, iki chapter, ekonomi, reklam/IAP köprüleri yerinde korunup genişletildi.

## Başlangıçta doğrulanan durum (Alpha 0.1)
- `src/data/content.js`: 2 yağ (normal, büyük), 6 düşman + minyon + 2 boss (HP 2–7, boss 24/36), spawn x 0,86–0,93,
  temas 0,20, adım 0,10, `SKILL_WAVES=[1,3,5,6]`, 16 yetenek, `SECONDARY_EVENT_CAP=12`.
- `npm test`: 56/56 geçti (log: Alpha 0.1 çalışma ağacında yeniden koşuldu).
- 100 tohumlu Alpha 0.1 simülasyonu bu revizyonda yeniden ölçüldü: rastgele bot Menemen %100, Patates %100
  (bkz. BALANCE_REPORT_ALPHA02.md). Önceki rapordaki "%100" sonucu doğrulandı.
- Doğrulanan yanlış test varsayımı: Alpha 0.1'in "good" botu neredeyse kusursuz bir bottu (kepçe tam
  merkezdeyken dokunuyordu). Alpha 0.2'de bu bot `perfect` adını aldı; `good` artık zamanlama hatalı
  (σ ≈ 67 ms) bir insan oyuncu modeli. Eski sonuçlar `perfect` olarak raporlandı.

## Dosya bazında değişiklikler

| Dosya | Değişiklik |
|---|---|
| `src/data/content.js` | `OILS.cold` (3. fiziksel yağ), `COLD_OIL_RATE` %7; `SKILL_WAVES=[1..6]`; 24 yetenek + `ABILITY_VALUES` (kart metni ve mekanik aynı veriden); yeni aile `control`; chapter başına `balance` (hpScale, bossHp, spawnX, bossX); `FIELD.knockbackMaxX=0.93`; `SECONDARY_EVENT_CAP` 12 → 40 (taşma sayılır ve raporlanır). Temel HP tablosu, dalga kompozisyonları, tarif, bahşiş, upgrade maliyetleri **değişmedi**. |
| `src/systems/CombatResolver.js` | Tek hasar/ölüm otoritesi korunarak genişletildi: merminin `id/source/isBonus/parentShotId/canProc` alanları; kritik (ayrı tohumlu RNG akışı, kayıtta saklanır), Çifte Yağ Atışı (yeni değerler), Delici Yağ, Patlayan Yağ (zincirlenmez), Güçlü Püskürtme (açık `knockback` olayı; boss'ta +1 hasar), Soğuk Sos dondurma (boss 3 eylemde 1), Lezzetli Lokma (salvo başına en fazla +1, birikme yok), ortak `killEnemy` (tarif bir kez), `resolveReflect` (Dikenli Önlük), `capReached` raporu. İlk Lokma artık salvodaki ilk **gerçek** isabet. |
| `src/systems/EnemyDirector.js` | Chapter `balance` ile HP ölçeği ve spawn konumu; donmuş düşman sıradaki hareket fırsatını atlar (`frozenSkip`); temas çözümünde Dikenli Önlük karşılık hasarı (normal düşman ölürse tavaya gider ve bir kez sayılır, boss ölürse zafer kapısı ilk çalışır). Kendi hareket kodu hâlâ yalnızca sola. |
| `src/systems/Abilities.js` | 24 yetenek; teklif: ≥2 aile, ilk iki seçimde en az bir doğrudan savaş kartı, önceki teklif/reroll ile aynı üçlü yok; `cardInfo` (şimdiki seviye, sonraki seviye, maks); kepçe parametreleri `ABILITY_VALUES`'tan. |
| `src/systems/RunController.js` | 6 seçim (her normal dalga sonrası, boss sonrası yok); `offerSeq` ile eskimiş kart reddi; `shufflePot` (yalnızca kart varsa, SWING_WAIT'te, dalga başına 1, tur harcamaz); soğuk sos oranı refill'e bağlandı; Dikenli Önlük ile boss ölürse zafer; `migrateRunState` (Alpha 0.1 snapshot → 0.2 varsayılanları); boss başlangıç turu istatistiği. |
| `src/systems/PotPhysics.js` | `rollType(big, cold)`, `refill(big, cold)`; `shuffle()` (fiziksel impuls, kimlik/tür korunur); `countByType` soğuk dahil. |
| `src/scenes/GameScene.js` | Yeni kart paneli (kategori ikonu, Sv I→II, sonraki etki + şu anki etki, toplam seçim sayısı veriden); KARIŞTIR düğmesi; kritik yazısı/parlaması, patlama halkası, kısa itme tween'i, donma rengi/ikonu, can çalma metni, karşılık hasarı, soğuk sos topçuğu/mermi görseli. Şef animasyonu değişmedi. |
| `src/scenes/BootScene.js`, `tools/gen-assets.mjs` | `oil_cold` sprite'ı ve 5 kart ailesi ikonu (özgün, 8–9 px). Diğer varlıklar birebir aynı üretildi. |
| `src/scenes/MenuScene.js`, `index.html`, `package.json` | Sürüm etiketi 0.2. |
| `tests/unit/*` | Eski 56 test korundu; yetenek sayısı (24), Çifte Atış değerleri, seçim sayısı (6), guarantee/bonus etiketleri, spawn aralığı, sağa itme istisnası yeni tasarıma göre güncellendi. Yeni `alpha02.test.mjs` (22 test). |
| `tests/sim/simlib.mjs` | `good` = insan benzeri zamanlama hatalı oyuncu; `perfect` = eski kusursuz bot; `bad`, `random` aynı. |
| `tests/sim/batch.mjs` (yeni), `tests/sim/balance.mjs` (yeniden) | Varyant × chapter × politika × profil paralel rapor; boss turu, yük, tahmini süre, yetenek seçim dağılımı. |
| `tests/e2e/e2e.mjs` | Yeni kart konumları; kayıpta "Tekrar Oyna" ile yeniden deneme (deneme sayısı raporlanır); 6 seçim kontrolü; KARIŞTIR düğmesi kepçe bırakmıyor; kartların 360×640 ve uzun ekranlara sığması. |

## Korunanlar (değişmedi)
Portrait iki yarı ekran, tek isimsiz Şef, tek dokunuş = tek kepçe, gerçek Matter.js yakalama, hibrit tencere
formülü, durum makinesi sırası ve token/ack kilidi, pause/arka plan davranışı, kayıt şeması (`schemaVersion` 1,
sağlama toplamı, yedek), ödülün tek kez verilmesi, chapter açılımı, bahşiş/yıldız/upgrade ekonomisi,
AdService/PurchaseService (dokunulmadı), çevrimdışı service worker, `dist/` ve artifact derlemeleri.

## Varsayımlar / öneriler (GDD'de açık olmayan noktalar)
- Kart aileleri: Yakalama (5), Saldırı (7), Tava/Alan (5), Savunma (5), Kontrol (2). "Savaş kartı" = Saldırı veya Tava/Alan.
- Soğuk Sos maks. 1 seviye (GDD seviye vermiyor), oran %7 (GDD önerisi).
- Güçlü Püskürtme'nin boss etkisi: +1 hasar (GDD "yavaşlatma/1 hasar" seçeneklerinden biri; kartta yazıyor).
- Delici Yağ "arka" = Şef'e göre daha sağdaki, dikeyde en yakın düşman.
- Patlayan Yağ yarıçapı 0,31 (eski alan yarıçapı × 1,4); yakında kimse yoksa en yakın 2 düşman.
- Donmuş düşmanın atladığı fırsat, biber/zırhlı patates hareket sayacını ilerletmez.
- Dikenli Önlük ile ölen düşman tava zinciri (Tava Patlaması vb.) başlatmaz; tarife bir kez sayılır.
- Lezzetli Lokma'da can tam doluysa iyileşme boşa gider (birikmez).
- İkincil olay sınırı 40'a çıkarıldı; 100 tohumlu raporlarda sınıra takılan olay sayısı ayrıca ölçüldü.
- Denge: düşman HP'si chapter başına çarpanla (Menemen ×1,7, Patates ×2,8), boss HP Menemen 42 / Patates 62,
  spawn x Menemen 0,58–0,64 / Patates 0,56–0,62, boss başlangıcı x 0,70. Gerekçe ve arama: BALANCE_REPORT_ALPHA02.md.
  Patates çarpanı GDD'nin önerdiği 1,4–1,7 arama aralığının dışında: arama adaylarında ×1,7 (spawn 0,66–0,72) ile rastgele bot %97, ×2,0 (spawn 0,60–0,66) ile %93 kazandı (30 tohum; ayrıntı raporda).

## Yeni 8 yetenek — ek tablo

| ID | Ad | Aile | Maks | Kod karşılığı | Boss'a karşı | Oyun içi açıklama (Sv I / Sv II) |
|---|---|---|---:|---|---|---|
| `critical_fry` | Kritik Kızartma | Saldırı | 2 | `rollCrit` (run.critRng) → 2x | normal etki | %15 / %25 şansla 2x hasar |
| `explosive_oil` | Patlayan Yağ | Tava/Alan | 2 | `explosion` + `area(explosive_oil)` | normal etki | Her 4./3. gerçek isabet yakındaki ≤2 düşmana 1 |
| `oil_knockback` | Güçlü Püskürtme | Kontrol | 2 | `knockback` olayı, x+0,10 (≤0,93) | itilmez, +1 hasar | Her 5./4. gerçek isabet 1 adım geri iter |
| `tasty_heal` | Lezzetli Lokma | Savunma | 2 | `heal` olayı, `counters.healDmg` | — | Her 10/8 gerçek can hasarında +1 can (salvo başına ≤1) |
| `spiked_apron` | Dikenli Önlük | Savunma | 2 | `resolveReflect` | etkiler (boss ölebilir → zafer) | Çarpan düşmana 2 / 3 hasar |
| `cold_oil` | Soğuk Sos | Kontrol | 1 | `OILS.cold`, `rollType`, `freeze`/`frozenSkip` | 3 eylemde en fazla 1 donma | Tencereye %7 soğuk küre; vurulan sonraki hareketini atlar |
| `pot_shuffle` | Tencereyi Karıştır | Yakalama | 1 | `RunController.shufflePot` → `PotPhysics.shuffle` | — | Salınımda KARIŞTIR: dalga başına 1 fiziksel karıştırma |
| `piercing_oil` | Delici Yağ | Saldırı | 2 | `behindTarget` + `area(piercing_oil)` | boss arkasında kimse yoksa boşa | Her 4./3. gerçek atış arkadaki düşmana 1 |

Güçlendirilen: `double_shot` (Çifte Yağ Atışı) Sv I her 2. gerçek normal atıştan sonra, Sv II her gerçek normal
atıştan sonra +1 bonus mermi (Alpha 0.1: her 5./4. isabette). Bonus mermiler kritik olmaz, hiçbir şey tetiklemez.
