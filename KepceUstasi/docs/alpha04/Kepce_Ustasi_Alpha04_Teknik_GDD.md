# Kepçe Ustası — Alpha 0.4 Teknik GDD (20 Level Dikey Kesit)

**Durum:** kodlanmamış tasarım paketi. **Kapsam:** 0.4A ve 0.4B. **Temel:** Alpha 0.3 raporları + 120 Level Progression v1.1 çalışma kitabının ilk 20 satırı.

> Alpha 0.3 kaynak ZIP’i bu teslim sırasında elimizde olmadığından, ekli JSON dosyaları **yeni entegrasyon sözleşmesidir**; mevcut kodun birebir şeması olduğu varsayılmamalıdır. Opus önceki kaynağı açıp veri adaptörünü kurmalıdır.

## 1. Değişmeyecek oyun özü
- Tek **isimsiz Şef**; portrait ekran ikiye bölünür: üstte sağdan sola tur bazlı savaş, altta Matter.js kepçe + fiziksel yağ topçukları.
- Hibrit tencere, gerçek yakalama, 24 koşu içi yetenek, altı seçim, mevcut silah atışı, düşman ölümü/tava, mevcut kayıt sistemi korunur.
- 20 level = 20 ayrı koşu. Her campaign level’ında **6 normal dalga + son karşılaşma** vardır; 6 yetenek seçimi de korunur. Level 5/15 mini boss, 10/20 chapter boss.
- Minimalist restoran ekranı; yeni karakter seçimi, ağır animasyon, ekstra sahne/sistem, rastgele sandık veya ücretli güç duvarı eklenmez.

## 2. 20 level oyun içeriği
**Ana veri:** `data/alpha04_campaign_20.json`. 20 level × 6 dalga = 120 tanımlı normal dalga; final karşılaşmaları ayrı. Tüm düşman ID’leri mevcut Alpha 0.1/0.3 ailesinden gelir. Yeni büyük sprite zorunlu değil.

| Level | Chapter içi | Tür | Önerilen SG | Normal HP × | Son HP | Temel bahşiş | Açılım |
|---:|---:|---|---:|---:|---:|---:|---|
| 1 | 1 | standard | 100 | 0.75 | 14 | 60 | — |
| 2 | 2 | standard | 102 | 0.78 | 16 | 62 | — |
| 3 | 3 | standard | 105 | 0.81 | 18 | 64 | — |
| 4 | 4 | standard | 107 | 0.85 | 20 | 66 | — |
| 5 | 5 | mini_boss | 119 | 0.90 | 28 | 68 | — |
| 6 | 6 | standard | 112 | 0.92 | 22 | 70 | — |
| 7 | 7 | standard | 115 | 0.97 | 24 | 72 | gold_kitchen |
| 8 | 8 | special | 122 | 1.02 | 26 | 75 | — |
| 9 | 9 | special | 125 | 1.08 | 29 | 77 | — |
| 10 | 10 | chapter_boss | 138 | 1.12 | 42 | 80 | chapter2_fries |
| 11 | 1 | standard | 126 | 0.75 | 20 | 82 | — |
| 12 | 2 | standard | 128 | 0.80 | 23 | 85 | — |
| 13 | 3 | standard | 131 | 0.84 | 25 | 88 | — |
| 14 | 4 | standard | 134 | 0.89 | 28 | 90 | — |
| 15 | 5 | mini_boss | 148 | 0.93 | 36 | 93 | materials_depot, materials_starter_grant_18 |
| 16 | 6 | standard | 141 | 0.95 | 30 | 96 | rare_crafting |
| 17 | 7 | standard | 144 | 1.00 | 34 | 99 | — |
| 18 | 8 | special | 153 | 1.06 | 38 | 102 | — |
| 19 | 9 | special | 157 | 1.10 | 42 | 106 | — |
| 20 | 10 | chapter_boss | 183 | 1.15 | 54 | 109 | alpha04_campaign_complete |

**Önemli HP prensibi:** `hpScale` değerleri, `alpha04_campaign_20.json` içindeki `enemyHpAlpha03` bazları üzerine uygulanır. Eski Excel’deki "Normal düşman HP" alanı doğrudan Alpha 0.3 düşmanlarına yazılmayacak; aksi takdirde halihazırdaki denge yanlışlıkla sıfırlanır. Final HP değerleri de bilinçli olarak 0.3’teki Menemen 42 ve Patates 54 değerlerine sabitlenmiştir (eski 120-level taslağındaki 62 yerine).

## 3. Şef Gücü ve duvarlar
Şef Gücü (SG) = 100 + 6 kalıcı upgrade seviyelerinin ağırlıklı katkısı + dört kuşanılmış ekipmanın nadirlik katkısı. Şef Gücü **gerçek statlardan türetilen yol gösterici göstergedir**, düşmana gizli bir hasar çarpanı uygulanmaz ve otomatik giriş kilidi yaratmaz.

- Level 10: **softwall**, önerilen SG 138. Altın Mutfak Level 7’den sonra açılır.
- Level 20: **hardwall**, önerilen SG 183, örnek oyuncu varış SG 159, fark 24. Level 15’te Malzeme Deposu ve Level 16’da Rare crafting yolu açılır; zorlu boss daha önceki içerikle hazırlanarak aşılabilir.
- Bu varış SG varsayımının **gerçek oyuncu ortalaması olmadığı** kabul edilir. Deneysel testten sonra değiştirilir.

## 4. Enerji / günlük reset
| Kural | Değer |
|---|---|
| Maksimum / başlangıç | 30 / 30 enerji |
| Campaign ve dungeon giriş bedeli | 10 enerji; runId başına bir kez |
| Doğal yenilenme | Her 12 dakikada 1 enerji; çevrimdışıyken de işler |
| Tam doldurmalı ödüllü reklam | UTC günü başına en çok 2 doğrulanmış ödül |
| Ödül işlemi | `energy = min(max, max)` yani doğrudan **30’a tamamla**, +30 ekleme değil |
| İlk üç level ilk başarılı temizleme ödülü | Her birinde **+10 enerji iadesi**, bir kere; ilk 3 koşunun erken bitmesini yumuşatmak için önerilen onboarding ayarı |
| Hata/iptal/çevrimdışı reklam | Ödül ve kullanım hakkı verme; web build’de reklam devre dışı |
| Uygulama kapanınca | UTC timestamp ile birikmiş enerji hesaplanır; 30 üstü birikmez |

Enerji tüketimi koşu başlatılırken, kalıcı işlem olarak yapılır. Devam ettirme ikinci kez enerji tüketmez. UTC gün sıfırlaması ekranda gösterilir. Sunucu olmadan cihaz saati hilesi tamamen önlenemez; Android’de doğrulanmış reklam callback’i gereklidir.

## 5. Ekipman (Alpha 0.4B)
Dört yuva: Yağ Silahı, Kepçe, Önlük, Tava. Başlangıçta her yuvada Common mevcut. Alpha 0.4’te **Common → Uncommon → Rare** garantili craft vardır; Epic ve Legendary daha sonra. Ayrı loot kutusu veya rastgele envanter **yok**. Tüm yuvalarda bonusun gerçek mekanik karşılığı bulunur.

| Slot | Uncommon | Rare (toplam) | Şef Gücü puanı (U/R) |
|---|---|---|---|
| Yağ Silahı | each 6th REAL normal shot +1 damage | each 4th REAL normal shot +1 damage; replaces uncommon threshold | 8/20 |
| Kepçe | real mouth width +3%; collision geometry changes | real mouth width +6% total; collision geometry changes | 7/18 |
| Önlük | maxHP +1 | maxHP +2 total | 8/20 |
| Tava | every 7th unique kill grants one non-proccing bonus normal oil next volley | every 5th unique kill grants one non-proccing bonus normal oil next volley; replaces uncommon threshold | 7/18 |

Craft maliyeti: Common→Uncommon **40 parça + 120 bahşiş**, Uncommon→Rare **60 ek parça + 260 bahşiş**. Common→Rare toplam 100 parça ve 380 bahşiştir. Nadire yükseltme Level 16’dan sonra açılır; oyuncu Level 20’yi geçmek zorunda değildir.

**Garanti materyal hesabı:** Level 15 ilk tamamlaması +18 parça, Malzeme Deposu ilk temizlemesi +10 parça, dört kez tam ödüllü depo temizlemesi 4×18=72 parça, toplam **100**. Dört ödüllü giriş, günde ikişer tam ödül verildiği için iki güne yayılabilir. Oyuncu daha fazla koşu yaparsa düşük ama pozitif tekrar ödülü alır. Böylece nadir eşya rastgele drop’a bağlı değildir.

## 6. Dungeon’lar (Alpha 0.4B)
**Veri:** `data/alpha04_dungeons.json`. İki dungeon da aynı üst savaş/alt kepçe ekranını kullanır. 4 normal dalga + final düşmanı, dört yetenek seçimi; tarif veya yıldız zorunlu değil.

| Dungeon | Açılım | İlk 2 günlük bitiriş | Sonraki tekrar | Enerji |
|---|---:|---:|---:|---:|
| Altın Mutfak | Level 7 | 240 bahşiş/koşu | 120 bahşiş/koşu | 10 |
| Malzeme Deposu | Level 15 | 18 parça/koşu | 8 parça/koşu | 10 |

Bu günlük haklar **ödüllü reklam hakkı değildir**. Bunlar dungeon’ın yüksek ödüllü iki günlük tamamlamasıdır. Reklamla enerji doldurma hakkı ayrı (2/UTC gün). Dungeon’lar günlük limit sonrası kilitlenmez, düşük ödülle tekrar oynanabilir.

## 7. Mevcut kayıtların korunması
Alpha 0.3 kayıtları silinmeyecek. Mevcut bahşiş, kalıcı upgrade, ayarlar ve yıldızlar korunur. Eski Chapter 1–2 tamamlanmaları `legacyCompletedChapters` altında saklanır. Yeni 20-level hattı L1’den başlar; eski tek chapter tamamlanması, henüz oynanmamış on yeni level’ı geçilmiş saydırmaz. Migrasyon idempotenttir. Ekipman Common ve enerji 30 ile ilk kez eklenir.

## 8. Uygulama adımları — Opus limitlerini korumak için
**0.4A:** level veri adaptörü, 20 stage, enerjinin offline yenilenmesi, minimal level seçim/enerji göstergesi, kayıt migrasyonu. Kullanılacak prompt: `prompts/01_Opus_Alpha04A_Level_Enerji.md`.

**0.4B:** dört ekipman slotu, garantili crafting, iki dungeon, SG göstergesi, kaynak ödülleri. Kullanılacak prompt: `prompts/02_Opus_Alpha04B_Ekipman_Dungeon.md`.

**Test bütçesi:** Derleme + gerekli birkaç birim testi + 5–10 kısa smoke koşusu. 1000+ seed, uzun benchmark veya eski/yeni devasa rapor **yasak**; istenirse daha sonra ayrıca yapılır. Gerçek telefon hissi manuel olarak değerlendirilir.

## 9. Hedefli kabul maddeleri
- 20 ayrı level ID’si, menüden seçme, kilit ve bölüm geçişleri doğru;
- Level 5/15 mini boss, Level 10/20 chapter boss; her campaign levelında 6 dalga + 6 yetenek seçimi;
- Gerçek kepçe fiziği ve Alpha03 tencere parametreleri olduğu gibi korunur;
- Bir koşu bir kez enerji düşer, devama ikinci düşüm yok;
- 12 dakikada +1, maksimum 30, UTC reset ve 2 doğrulanmış reklam hakkı;
- Yeni menü minimalist; gerçek reklam yokken ödül verilmez;
- L7 altın, L15 depo, L16 Rare craft açılır; L20 kilidi döngü yaratmaz;
- Her ekipman nadirliği gerçek savaş veya yakalama parametresini değiştirir;
- Run ödülü/ilk-clear/enerji iadesi tek kez verilir;
- Alpha03 kayıtları geriye dönük açılır; kullanıcı kaynakları kaybolmaz;
- Android touch/pause/in-app ad köprüsü bozulmaz;
- Build geçer; kısa smoke test özeti sunulur, ağır analiz yapılmaz.

## 10. Açık ve öneri olan kararlar
Şef Gücü ağırlıkları, craft maliyetleri, stage HP ölçekleri, 3 ilk temizlemenin enerji iadesi, dungeon ödülleri ve başlangıç elite final HP’leri kullanıcı tarafından tek tek onaylanmış nihai denge değerleri **değil**; bu paket kodlanabilir ilk öneridir. Alpha03 oyununun fizik kuralları ve kullanıcı tarafından kesinleştirilmiş ekran/karakter standardı ise değişmez.

