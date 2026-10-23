# V4.0 «Gökyarık» — denetim ve uygulama planı

Kaynak: mevcut V3.0.1 projesi (Phaser 3 + Vite, ~18.5k satır). Bu belge kod denetiminin sonucudur; uygulama aynı sırayla yapılır.

## Denetim bulguları (sınıfa bağlı noktalar)
| Yer | Durum | V4 işi |
|---|---|---|
| `data/classes.js` | warrior/mage; hp/mp fonksiyonları, aralık, menzil, başlangıç kiti | archer/necromancer + sınıfa özgü güç formülü (`power(attr, L, weaponPhys, weaponMag)`) |
| `systems/stats.js` | `physPower = silah + 1.2 STR + 0.35 L`, `magicPower = silah + 1.5 INT + 0.3 L`; pasifler isimle okunuyor | güç formülü sınıftan; yeni pasifler (kaçınma, hareket, kritik, MP/vuruş, iskelet); Ustalık III; kaçınma `evade` |
| `systems/combat.js` | `enemyHit` buff yığını (%60 sınırı) | `evade` (yalnız normal saldırı), hedef zayıflatma (Lanet Mührü), Avcı İşareti çarpanı |
| `data/skills.js` | 6 aktif + 3 pasif + Ustalık I/II, Ustalık kitapları | archer/necro 7 aktif, 3 pasif, Ustalık I/II/III; W/M Lv.45 becerileri; tüm sınıflara Ustalık III |
| `entities/Player.js` | `normalAttack`: phys = yakın kılıç, değilse büyü mermisi; `execSkill` switch | menzilli fiziksel (ok mermisi, duvar engeli), Ruh Mermisi; 16 yeni beceri; buff'lar; yardımcı (iskelet) yönetimi |
| `world/combatRuntime.js` | tek öldürme yolu `applyToEnemy → killEnemy → applyKill` | iskelet hasarı aynı yoldan (tek ödül, tek görev sayacı); can sömürme; engellenebilir mermi |
| `entities/Enemy.js` | hep oyuncuyu hedefler; `objective` (kervan/mühür) desteği var | iskelete kısa süreli yönelme (yalnız normal/elit, boss asla); iskelete vuruş |
| `art/characters.js`, `scenes/textures.js` | hazır sprite paketi yalnız warrior/mage; diğerleri procedural insansı | okçu/ölü çağıran görünümü, yay/kemik asa/kitap/sadak/tılsım sprite'ı, darbe karesi; iskelet yaratık çizimi |
| `ui/menu.js` | 2 sınıf kartı, 3 yuva | 4 sınıf, 5 yuva |
| `ui/hud.js`, `ui/panels/gameMenu.js` | 4 beceri düğmesi, beceri ekranı | 7 aktiften 4'ü; iskelet HP göstergesi; Ustalık III satırı |
| `ui/panels/npc.js` | tüccar `cls === ch.cls` filtresi | genel çalışır; yeni sınıf eşyaları tüccarda |
| `data/loot.js` | bonus türleri `cls: ['warrior','mage']` | 4 sınıf; STR okçu, INT ölü çağıran |
| `systems/loot.js` | Legendary %80 kendi / %20 diğer (liste) | 4 sınıfta aynı mantık; diğer üç sınıf tek havuzda eşit |
| `data/quests.js` | sınıf görevleri c10/c20 genel; c40w/c40m sınıfa özel; eşya ödülü yok | c40a/c40n, c50w/m/a/n; okçu/necro rehber görevleri; m47–m58, s43–s52 |
| `save/serialize.js` | şema 3, `CHAR_SLOTS = 3` doğrulaması | şema 4: önce migrate (3→5 yuva), sonra doğrula |
| `dev/bot.js`, testler | warrior/mage varsayımları | 4 sınıf |

## Tasarım kararları
- **Archer**: fiziksel menzilli (7 tile, 1,25 sn). Güç = silah + 1,05 DEX + 0,35 STR + 0,35 L. Kritik/saldırı hızı mevcut DEX kuralları ve üst sınırlarıyla. Ok mermisi her karede duvar kontrolü yapar; duvara çarpan ok kırılır.
- **Necromancer**: büyü (6 tile, 1,6 sn). Güç = silah + 1,35 INT + 0,30 L. Ruh Mermisi MP harcamaz.
- **İskelet**: ayrı `Minion` varlığı ve `scene.minions` listesi (düşman listesine girmez). Yalnız oyuncunun seçili hedefine (oyuncuya ≤10 tile) saldırır; hedef yoksa takip eder. En çok 2 (ana + Ölüler Ordusu). Hasar `combat.applyToEnemy` üzerinden — EXP/loot/görev tek öldürmeden. Kayda yalnız `char.minion = { main: true, hpPct }` yazılır; harita geçişi/yüklemede yeniden kurulur; ölümde silinir.
- **İskelet ve bosslar**: boss davranışları iskeleti hedeflemez. Telegraf alanları (`fx.telegraph`) bittiğinde içindeki iskeletlere maks. HP'nin %35'i hasar → boss mekanikleri iskeletle atlatılamaz. Normal yaratık iskelet vurunca 3 sn ona yönelebilir; elit %40, boss asla.
- **Kaçınma**: yalnız normal (telegrafsız) saldırılara; telegraflı yetenekler kaçınılamaz.
- **Lanet Mührü**: hedefin hasarı −%12 (boss −%6), 8 sn. **Avcı İşareti**: işaretli hedefe okçu hasarı +%10.
- **Can Sömürüsü**: verilen gerçek hasarın %20'si, tek kullanımda en çok maks. HP'nin %5'i.
- **Ustalık III** (Lv.50 + m58): küçük kalıcı pasif (`char.mastery3`).
- **Şema 4**: 3 → 5 yuva (sıra ve kimlik korunur), `mastery3`, `minion`, `deletedChars`. Eski kayıt önce migrate edilir.
- **Eşya kimlikleri**: Okçu yayları `Y01–Y14`, ölü çağıran silahları `K01–K14`, okçu zırhı `YH/YC/YG/YB 01–04`, ölü çağıran zırhı `KH/KC/KG/KB 01–04`, sadak `YO01–04`, tılsım/odak `KO01–04`, W/M Lv.40–50 `W20–W22, C17, M20–M22, C18`, aksesuar `R13 R14 A13 A14`, ara seviye `YH05 YC05 KG05 KH05`.

## Uygulama sırası
1. Şema 4 + 5 yuva + Kayıt Güvenliği ekranı + ilk giriş yedek hatırlatması
2. Sınıf verisi, stat/savaş formülleri, beceri tablosu
3. Eşyalar, loot, materyaller, tarifler
4. Oyuncu: ok/ruh mermisi, 16 beceri, iskelet sistemi, sprite'lar
5. Karakter oluşturma (4 sınıf), 5 yuva, HUD, beceri ekranı
6. Lv.50, iki harita, 8 yaratık, 2 elit, Fırtına Tiranı
7. Gökyarık Mabedi + Göğün Mahkûmu
8. NPC'ler, görevler, sınıf ustalıkları, 1–40 uyumluluk
9. Denge simülasyonları, birim/e2e testleri, belgeler, paket
