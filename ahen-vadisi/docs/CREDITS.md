# Emeği geçenler / Lisanslar

| Kullanım | Kaynak | Lisans |
|---|---|---|
| Warrior oyuncu sprite'ı (`public/sprites/hero_warrior`) | Fantasy Warrior — LuizMelo, https://luizmelo.itch.io/fantasy-warrior | CC0 (pakette License.txt) |
| Mage oyuncu sprite'ı (`public/sprites/hero_mage`) | Wizard Pack — LuizMelo, https://luizmelo.itch.io/ | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Çayır Sıçanı sprite'ı (`public/sprites/mon_meadow_rat`) | Monsters Creatures Fantasy 2 — Rat, LuizMelo, https://luizmelo.itch.io/ | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Mağara Yarasası sprite'ı (`public/sprites/mon_cave_bat`) | Monsters Creatures Fantasy 2 — Bat, LuizMelo, https://luizmelo.itch.io/ | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Orman Yağmacısı sprite'ı (`public/sprites/mon_forest_raider`) | Bandits — Light Bandit, Sven Thole | Sven Thole EULA (`public/sprites/mon_forest_raider/LICENSE.txt`): oyunlarda kullanım serbest, kredi verilmeli; varlıkların kendisi mağaza/dosya paylaşım sitelerinde dağıtılamaz |
| Kazmacı Goblin, Diken Kökçüsü, Çürük Muhafız, Kızıl Damar Gözcüsü sprite'ları (`public/sprites/mon_pick_goblin`, `mon_thorn_rootling`, `mon_rotten_guard`, `mon_red_vein_watcher`) | Monsters Creatures Fantasy — Goblin, Mushroom, Skeleton, Flying Eye, LuizMelo, https://luizmelo.itch.io/monsters-creatures-fantasy | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Bataklık Balçığı sprite'ı (`public/sprites/mon_swamp_leech`) | Monsters Creatures Fantasy 2 — Slime, LuizMelo, https://luizmelo.itch.io/ | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Kızıl Akrep sprite'ı (`public/sprites/mon_crimson_scorpion`) | "Scorpian" (32×32, mor akrep) | Pakette lisans dosyası ve yazar bilgisi yok; kaynak sayfadaki lisans doğrulanmalı |
| 72 eşya/iksir ikonu (`src/art/iconPack.js`) | Clockwork Raven Studios — "FREE RPG Icon Pack: 100+ Weapons and Potions" ve "100+ Accessories and Armor", https://clockworkraven.itch.io/ | Silah/iksir paketi README'si: ticari kullanım serbest, kredi zorunlu değil. Zırh/aksesuar paketinde lisans dosyası yok; itch.io sayfasından doğrulanmalı |
| 26 kalkan/odak/eldiven/kolye, 47 materyal ve 18 beceri ikonu (`src/art/iconPack.js`) | Clockwork Raven Studios — "Free - Raven Fantasy Icons", https://clockworkraven.itch.io/ | Pakette lisans dosyası yok (yalnız teşekkür notu); itch.io sayfasındaki lisans doğrulanmalı |
| Cevher Rahibi sprite'ı (`public/sprites/mon_ore_priest`) | Evil Wizard 2 — LuizMelo, https://luizmelo.itch.io/evil-wizard-2 | CC0 (pakette License.txt) |

Sprite'lar `tools/import-sprites.py` ile kırpılıp oyun boyuna ölçeklenmiştir (ham paketler repoda tutulmaz; Aseprite
dosyaları `tools/aseprite.py` ile okunur). Sola bakan paket (Light Bandit) aynalanmıştır. Pakette olmayan
animasyonlar mevcut karelerden türetilmiştir: Light Bandit ölümü = "Recover" karelerinin tersi;
Goblin, Mushroom, Skeleton ve Flying Eye paketin kendi bekleme/koşma/saldırı/darbe/ölüm şeritlerini kullanır.
Akrebin darbe/ölüm kareleri türetilir. Flying Eye ve akrep kızıla boyanmıştır.
Kurtlar (Boz Kurt, Sürü Kurdu, Alfa Kurt, Ayaz Kurdu) `src/art/wolf.js` ile procedural çizilir (2.0.2'de Skullwolf paketi kaldırıldı).
Diğer tüm görseller, sesler ve müzik oyun içinde procedural olarak üretilir.

**V2.0 (Kül ve Ayaz):** Yeni üçüncü taraf varlık eklenmedi. 12 yeni yaratık/elit/boss sprite'ı, 4 yeni NPC, kül/kar/buz
tile set'leri, 30 eşya ikonu, 18 materyal ikonu, 2 beceri ikonu ve efektleri, müzik ve ortam sesleri oyun içinde procedural
olarak üretilir (`src/art/monstersV2.js`, `src/art/tiles.js`, `src/art/objects.js`, `src/art/icons.js`, `src/audio/sound.js`).

İkonlar `tools/import-icons.py` ile seçilip (16×16, ölçeklemesiz) aktarılır; aynı çizimi paylaşan eşyalar oyundaki renk
kimliklerine göre tonlanır. Pakette uygun karşılığı olmayan mühürler (Gözcü/Kar/Buz Gardiyanı Mührü), Yarasa Kanadı, görev
eşyaları ve arayüz simgeleri procedural kalır.
