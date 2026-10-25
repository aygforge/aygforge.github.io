# V4.0 «Gökyarık Genişlemesi» — Mimari Notları, Denge ve Bilinen Sınırlamalar

V4, V3.0.1'in üzerine kurulur: mevcut karakterler, eşyalar, görev durumları, kayıtlar, hazır sprite yolları ve eski görev
kimlikleri korunur. Denetim ve uygulama sırası: [`V4_PLAN.md`](V4_PLAN.md).

## Mimari: V4 V3'ün üzerine nasıl oturur

| Konu | Dosya(lar) | Not |
|---|---|---|
| Sürüm/şema | `src/data/constants.js` (`SCHEMA_VERSION = 4`, `GAME_VERSION = '4.0.0'`, `MAX_LEVEL = 50`, `CHAR_SLOTS = 5`) | EXP formülü değişmedi; 40→50 değerleri (153.680 … 282.440, toplam 2.142.150) testte sabitlenir. |
| Kayıt geçişi | `src/save/serialize.js` (`migrate` doğrulamadan **önce** 3 → 5 yuva), `src/systems/character.js` (`ensureV4Fields`), `src/save/repository.js` | Yalnız alan ekler: `mastery3`, `minion` (ana iskelet + can oranı), `deletedChars`. Eski zarf `v3_backup` olarak bir kez saklanır. Depolama açılamazsa boş profil asla "yüklendi" sayılmaz ve üzerine yazılmaz (`storageError` + hata türü). |
| Kayıt Güvenliği | `src/ui/panels/settings.js` (`saveSafetyBox`, `saveStatusRows`), `src/ui/menu.js` (depolama hatası penceresi, V4 hatırlatması) | Son kalıcı kayıt zamanı ve teknolojisi, kalıcı depolama izni, son yedek, şimdi kaydet, yedek kodu kopyala/yapıştır, JSON dışa/içe aktar, önceki kayıtlar, kayıp karakter ara. Yalnız bellekte çalışılıyorsa açık uyarı. |
| Sınıflar | `src/data/classes.js`, `src/systems/stats.js` | Okçu: HP 80+10(L−1)+10VIT, MP 55+4(L−1)+4INT, güç = yay + 1,05 DEX + 0,35 STR + 0,35 L, 1,25 sn, 7 tile. Ölü Çağıran: HP 65+9(L−1)+10VIT, MP 90+7(L−1)+8INT, güç = silah + 1,35 INT + 0,30 L, 1,6 sn, 6 tile. Saldırı aralığı mevcut DEX hız kuralıyla biraz kısalır (Lv.1 Okçu ≈1,23 sn). |
| Beceriler | `src/data/skills.js`, `src/entities/playerV4.js` (`execSkillV4`, `fireArrow`), `src/entities/Player.js` | 2 × 7 aktif + 3 pasif, Ustalık I/II/III; Savaşçı Yıldırım Yarığı ve Büyücü Astral Patlama (Lv.45); dört sınıfa Ustalık III. Beceri çubuğu 7 aktiften 4'ünü taşır. Tek hedefli beceriler görüş hattı ister. |
| Ok / Ruh Mermisi | `src/world/combatRuntime.js` (`projectile` `blockable`) | Ok görünür mermidir; her karede opak karo kontrolü, duvara çarpan ok kırılır. Ruh Mermisi MP harcamaz. |
| İskelet | `src/entities/Minion.js`, `src/world/minions.js` (`MinionManager`), `src/systems/stats.js` (`MINION`) | Ayrı varlık listesi (düşman listesine girmez). Yalnız oyuncunun **seçili** hedefine (≤10 tile) saldırır; hedef yoksa takip eder → AFK farm yok. Hasar `applyToEnemy` üzerinden: tek öldürme, tek EXP/ganimet, görev sayacı bir kez. En çok 2 (ana + Ölüler Ordusu). Kayda yalnız `{ main: true, hpPct }`; harita geçişinde/yüklemede tek kez kurulur, ölümde silinir. Hasarı "ruh bağı" ile büyü savunmasına göre hesaplanır. |
| İskelet ve bosslar | `src/world/fx.js` (`telegraph`), `src/world/minions.js` (`telegraphHit`), `src/world/combatRuntime.js` (`minionHit`) | Telegraf bittiğinde içindeki iskelet maks. HP'nin %35'ini kaybeder. Normal yaratık iskelete 3 sn yönelebilir (%45), elit %20, **boss asla**. |
| Haritalar | `src/data/maps/skyRift.js` (124×88), `starGrave.js` (128×92), `astralSanctum.js` (112×80) | 7 zemin, 3 kütle, 6 dekor, 9 damga (`tileRegistry.js`, `art/tiles.js`). Geçişler: Kara Taht kuzey kenarı → Gökyarık (`sky_rift_open`, m47) → Yıldız Mezarı (`star_grave_open`, m53) → Mabet (m56 kapı mührü). Yol taşları `ws_rift`, `ws_star`. |
| Yaratık yetenekleri | `src/entities/enemyV4.js` | Fırtına Sıçrayışı (hat + yavaşlatma), Yarık Pençesi (çember, dalış), Yıldız Düşüşü (2 düşen yıldız); Şimşek Yağmacısı/Gökgürültüsü Golemi/Boşluk Zırhlısı V3 yeteneklerini kendi adı ve rengiyle kullanır. Elitler: Fırtına Celladı (alan → yıldırım zinciri → koni + fırtına izi, %30 öfke), Hiçlik Muhafızı (alan → boşluk yağmuru → 5 sn %35 azaltma). |
| Bosslar | `src/entities/bossesV4.js` | Bkz. aşağıdaki tablo. |
| Zindan | `src/systems/dungeon.js` (`bossStage`), `src/scenes/WorldScene.js`, `src/world/spawner.js` (`waves`), `src/entities/Interactables.js` (`SealObj`) | 5 bölüm; `kind: 'decoy'` mühür sayımına girmez ve yalnız ipucu verir; `waves` çok dalgalı mühür savunması. Kontrol noktaları cp1–cp3 + checkpoint. |
| Görevler | `src/data/quests.js`, `src/systems/quests.js` | m47–m58, s43–s52, c40a/c40n, c50w/m/a/n (`mastery3` ödülü), 4 rehber görevi (`guide: true`, sayım dışı). Yeni bölgeler `rift` / `star`. Görev avları (`kind: 'hunt'`) normal yeteneklerini kullanır. |
| Loot | `src/data/loot.js`, `src/systems/loot.js` | `storm_tyrant` R26/E3,5/L0 + garantili Tiran Çekirdeği; `sky_prisoner` R34/E9/L0,4 + garantili Mahkûmun Zinciri. Legendary yalnız Golem, Donmuş Muhafız, Kayıp Kral, Göğün Mahkûmu (toplam %0,4; %80 kendi sınıfı, %20 diğer üç sınıfın havuzu). |

## Bosslar

| Boss | Mekanikler |
|---|---|
| **Fırtına Tiranı** (Lv.45, 155.000 HP, açık dünya) | Yıldırım Çekici (ön koni + itme), Fırtına Halkası (12 dilim, ardışık 3 dilim güvenli), Yıldırım Yağmuru (3/4/5 yıldırım). **%60 Kristal Çağrısı:** 2 Enerji Kristali; ayaktaki her kristal %30 hasar azaltma; ikisi kırılınca 15 sn savunma −%35; 25 sn içinde kırılmazsa kristaller uyarılı patlar, kalkan söner, zırh çatlamaz. **%25 Son Gök Gürültüsü:** hızlanır, yağmur sıklaşır, en çok 3 fırtına izi. |
| **Göğün Mahkûmu** (Lv.50, 210.000 HP, Mabet 5. bölüm) | I: Göğün Zincirleri (10 tile hat, isabette çekme), Zincir Savuruşu (koni), Gök Yargısı (düşen yıldızlar). **%65 Kırılan Mühürler:** %85 kalkan + 2 Gök Mührü (en çok 30 sn). **%30 Yıldızların Sonu:** hızlanır, güvenli boşluklu yıldız halkası, en çok 4 kalıcı yıldız alanı. Ölümde tam cana döner, kalkan ve mühürler sıfırlanır. |

## Denge (simülasyon: `tests/unit/v4balance.test.js`, gerçek stat/hasar formülleri)

Seviyeye uygun Rare/Uncommon +3 donanım (`tests/unit/v4sim.js` → `GEAR`), bütün beceri puanları harcanmış karakter. Hareket
payı (telegraflardan kaçma): Savaşçı ×1,2, Büyücü ×1,3, Okçu ×1,15, Ölü Çağıran ×1,25. Ölü Çağıran sürelerine iskelet dahildir.

| Senaryo | Savaşçı | Büyücü | Okçu | Ölü Çağıran | Hedef |
|---|---|---|---|---|---|
| Farm Lv.10 / 20 / 30 / 40 (eski içerik) | 1,7 / 2,8 / 3,1 / 8,5 sn | 1,1 / 1,6 / 3,0 / 7,4 | 1,4 / 2,0 / 2,6 / 6,0 | 1,2 / 1,7 / 3,0 / 7,6 | ≤14 sn; yeni sınıflar eski iki sınıfın ortalamasının 0,6–1,45 katı |
| V4 yaratıkları Lv.41–49 | 8,2–13,7 sn | 6,8–10,3 | 6,7–12,4 | 7,8–10,6 | 3,5–14 sn |
| Fırtına Celladı (elit, Lv.45) | 84 sn | 57 | 52 | 54 | 40–90 sn |
| Hiçlik Muhafızı (elit, Lv.49) | 83 sn | 68 | 79 | 81 | 40–90 sn |
| Fırtına Tiranı (+2 kristal) | 6,7 dk | 4,5 | 5,0 | 4,4 | 4–7 dk |
| Göğün Mahkûmu (+2 Gök Mührü) | 7,4 dk | 5,9 | 6,5 | 6,8 | 4–8 dk |
| İskelet katkısı (Lv.25–50 farm) | — | — | — | %25–35 (bossta %32) | %25–35 |
| 40→50 tahmini | ~5,2 sa farm (≈110 öldürme/sa) + ~5 sa görev/boss/zindan ≈ **10,2 sa** | | | | |

Hayatta kalma (telegrafsız normal saldırılara karşı iksirsiz ölüm süresi): Savaşçı 13–59 sn, diğerleri 9–29 sn (≥7 sn sınırı).
İskelet yokken Ölü Çağıran Lv.45'te 8,7 sn/öldürme ile ilerleyebilir.

### Belge değerlerinden sapmalar (simülasyon gerekçeli)

Belgede seviye, HP ve oranlar sabitti; HP'ler aynen kaldı. Yalnız savunma/ATK gibi belgede verilmeyen ya da başlangıç değeri
olan alanlar hedef sürelere çekildi:

| Kalem | İlk değer | V4.0 | Gerekçe |
|---|---|---|---|
| Fırtına Celladı DEF/MDEF | 360 / 310 | 220 / 200 | Savaşçı 123 sn → 84 sn (hedef ≤90); HP 24.000 aynı |
| Hiçlik Muhafızı DEF/MDEF | 430 / 400 | 230 / 210 | Savaşçı 212 sn → 83 sn; HP 35.000 aynı |
| Fırtına Tiranı DEF/MDEF | 150 / 150 | 105 / 105 | Savaşçı 7,7 dk → 6,7 dk; HP 155.000 aynı |
| Gökgürültüsü Golemi | HP 4.300, DEF 235 | HP 4.000, DEF 200 | Savaşçı 16,9 sn → 13,6 sn |
| Boşluk Zırhlısı | HP 5.400, DEF 260 | HP 4.800, DEF 220 | Savaşçı 17,2 sn → 13,4 sn |
| Yıldız Kâhini | HP 4.900, MDEF 300 | HP 4.600, MDEF 280 | Savaşçı 14,3 sn → 13,7 sn |
| İskelet gücü | 0,6 × büyü gücü, fiziksel | 0,7 × büyü gücü, ruh bağı (büyü) | Katkı %14–43 arasında dalgalanıyordu → %25–35 |
| Okçu beceri MP'leri | ilk taslak | düşürüldü | Uzun farmda MP kilitlenmesi |

## Bilinen sınırlamalar (dürüst liste)

- **Denge gerçek oynanışla değil, simülasyonla doğrulandı.** Kaçınma "hareket payı" katsayısıyla yaklaşık modellenir.
  Savaşçı yüksek savunmalı yaratıklarda diğer sınıflardan yavaştır (V3'teki tasarımın devamı; dayanıklılığı en yüksek sınıf).
- **Okçu ve Ölü Çağıran için Lv.47 Epic silah yoktur** (Savaşçı W21 / Büyücü M21 var). 84 eşyalık sınır içinde yeni sınıflar
  Lv.45 Uncommon silahtan (Y10/K10, Savaşçı'nın R44 silahından biraz güçlü) Lv.50 Legendary'ye geçer. Simülasyonda yine
  hedef aralıktalar; ama bu bir eşitsizliktir.
- **Uçtan uca testler savaşları geliştirici kancalarıyla hızlandırır** (hasar doğrudan uygulanır, karakter taşınır, kanal süresi
  atlanır). Faz geçişleri, kristaller/mühürler, iskelet kuralları ve dalgalar gerçek oyun döngüsünde çalışır; ancak tam bir boss
  savaşı dokunmatik kontrolle baştan sona oynanmadı. **Gerçek Android/iOS cihazında ve gerçek itch.io sayfasında test
  yapılamadı.**
- **Elitler V1 kuralıyla doğar** (kendi kampında 25 öldürme + 120 sn). Testler elitleri doğrudan çağırdı.
- **V4 yaratık, elit, boss ve NPC görselleri procedural piksel sanattır.** 4.0.1'den itibaren Okçu (Huntress 2), Ölü Çağıran
  (Evil Wizard 3) ve iskeletleri (Skeleton Sprite Pack) hazır sprite paketleriyle çizilir; "Ekipman görünür (piksel)" ayarında
  ya da paket yüklenemezse procedural çizime dönülür. Skeleton Sprite Pack arşivinde lisans dosyası yoktur (CREDITS).
  Görev avları mevcut çizimleri renk tonuyla kullanır.
- **Beceri çubuğu 4 düğmedir;** 7 aktiften hangilerinin çubukta olacağı Beceriler ekranından seçilir.
- **İskelet hasarı büyü savunmasıyla hesaplanır** (ruh bağı); bu, görsel olarak fiziksel bir pençe darbesidir.
- **Refakat / savunma olayı kayda yazılmaz** (V3 ile aynı): harita değişince olay sıfırlanır, yeniden başlatılabilir.
- **Kayıt tarayıcıda tutulur.** Kayıt Güvenliği bölümü ve yedek kodu, tarayıcı site verisini tamamen silerse ilerlemeyi geri
  getirmenin tek yoludur; oyun bunu kodla engelleyemez.
- Yazılımsal WebGL'li test ortamında FPS 19–44; gerçek telefonda ölçülmedi.
