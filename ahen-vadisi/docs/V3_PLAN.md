# V3.0 «Kayıp Krallığın Mirası» — Geliştirme Planı

Mevcut V2 mimarisi korunarak genişletilir (yeni oyun başlatılmaz). Bu belge kimlikleri ve kararları sabitler.

## Mimari kararlar

| Konu | Karar |
|---|---|
| Kayıt | `SCHEMA_VERSION = 3`. `migrate` → `ensureV3Fields` (yalnız alan ekler: `tracking[]`, `mastery2`, `statResets`, `world.flags`). Eski zarf `v2_backup` olarak bir kez saklanır. |
| Seviye | `MAX_LEVEL = 40`. EXP formülü değişmez (30→31 … 39→40 = 64.880 … 142.450; toplam 1.006.820). |
| Görev kimlikleri | Eski 40 görev aynen. Erken yan görevler `s13–s36` (24), V3 ana `m37–m46` (10), V3 yan `s37–s42` (6) → 80. Ustalık II: `c40w`, `c40m` (sınıf görevleri, 80'e dahil değil). |
| Yeni hedef tipleri | `visit` (NPC'ye uğra/teslim), `craft` (gerçek üretim olayı), `interact` + `ordered` / `consume` / `channel` / `mode: repair|purify`, `escort` (refakat olayı), `defend` (alan savunması), `kill` + `spawn` (görev varyantı avı). |
| Olay çalışma zamanı | `src/world/questEvents.js`: refakat (yol bulma + takılma kurtarma + HP) ve savunma (dalga, nesne HP'si). Görev dalgası yaratıkları `questSpawn`: EXP/loot/görev sayacı/elit katkısı vermez. |
| NPC'ler | 13 yeni: rauf, lale, nisa (köy), doruk, nil (orman), fikret (maden), isil (bataklık), beril (kül), kaya (ayaz), seher, hamit (Ölü Krallık), eren, veysel (Kara Taht). |
| Haritalar | `dead_kingdom` 120×88 (Lv.30–35), `black_throne` 124×92 (Lv.35–40), `dark_crypt` zindan (Lv.38–40, 4 aşama). Ayaz → Ölü Krallık (m37), Ölü Krallık → Kara Taht (m42 bayrağı `black_gate_open`), Kara Taht → Karanlık Mahzen (m45 kapı mührü). |
| Yaratıklar | Normal: shroud_crawler, bone_archer, cursed_guard, grave_mage, obsidian_sentinel, shadow_hunter, throne_executioner, void_priest. Elit: shroud_hunter, obsidian_executioner. Boss: grave_commander (açık dünya), lost_king (zindan). |
| Loot | Yeni tablolar `grave_commander` (R25/E3/L0), `lost_king` (R33/E8/L0,4). `LEGENDARY_SOURCE_TABLES` += `lost_king`. Golem / Donmuş Muhafız oranları değişmez. |
| Eşyalar | 36 şablon: W14–W19, M14–M19, O11–O14, H11–H14, C13–C16, G09–G10, B09–B10, R09–R12, A09–A12. Hepsi loot havuzu veya tarif ile bağlı. |
| Kullanılabilir eşyalar | `cat: 'usable'`: cleansing_salve, warming_tonic, return_scroll, camp_ration, miner_lamp, scout_compass, purify_salt, royal_ink. Savaşta kullanım kontrolü. |
| Beceriler | Lv.35: `iron_fury` (Sarsılmaz Öfke), `time_freeze` (Donmuş Zaman). 6 aktif, 4 düğme. Ustalık II pasifleri: `war_legacy`, `arcane_lore`. Oyuncu hasar azaltma toplamı %60 ile sınırlı. |
| Arayüz | Görev günlüğü: Ana/Yan/Sınıf/Sözleşme, bölge filtresi, tamamlananlar, en çok 3 takip (HUD), hedef konumu. Aynı anda en çok 8 aktif yan görev. |
