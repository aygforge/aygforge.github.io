# Emeği geçenler / Lisanslar

| Kullanım | Kaynak | Lisans |
|---|---|---|
| Warrior oyuncu sprite'ı (`public/sprites/hero_warrior`) | Fantasy Warrior — LuizMelo, https://luizmelo.itch.io/fantasy-warrior | CC0 (pakette License.txt) |
| Mage oyuncu sprite'ı (`public/sprites/hero_mage`) | Wizard Pack — LuizMelo, https://luizmelo.itch.io/ | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Çayır Sıçanı sprite'ı (`public/sprites/mon_meadow_rat`) | Monsters Creatures Fantasy 2 — Rat, LuizMelo, https://luizmelo.itch.io/ | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Mağara Yarasası sprite'ı (`public/sprites/mon_cave_bat`) | Monsters Creatures Fantasy 2 — Bat, LuizMelo, https://luizmelo.itch.io/ | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Orman Yağmacısı sprite'ı (`public/sprites/mon_forest_raider`) | Bandits — Light Bandit, Sven Thole | Sven Thole EULA (`public/sprites/mon_forest_raider/LICENSE.txt`): oyunlarda kullanım serbest, kredi verilmeli; varlıkların kendisi mağaza/dosya paylaşım sitelerinde dağıtılamaz |
| Boz Kurt ve Sürü Kurdu sprite'ı (`public/sprites/mon_gray_wolf`) | Skullwolf ("Massacre") | Pakette lisans dosyası yok; kaynak sayfadaki lisans doğrulanmalı |
| Kazmacı Goblin sprite'ı (`public/sprites/mon_pick_goblin`) | Goblin Pack 1 — Goblin Barbarian | Pakette lisans dosyası yok; kaynak sayfadaki lisans doğrulanmalı |
| 72 eşya/iksir ikonu (`src/art/iconPack.js`) | Clockwork Raven Studios — "FREE RPG Icon Pack: 100+ Weapons and Potions" ve "100+ Accessories and Armor", https://clockworkraven.itch.io/ | Silah/iksir paketi README'si: ticari kullanım serbest, kredi zorunlu değil. Zırh/aksesuar paketinde lisans dosyası yok; itch.io sayfasından doğrulanmalı |
| Cevher Rahibi sprite'ı (`public/sprites/mon_ore_priest`) | Evil Wizard 2 — LuizMelo, https://luizmelo.itch.io/evil-wizard-2 | CC0 (pakette License.txt) |

Sprite'lar `tools/import-sprites.py` ile kırpılıp oyun boyuna ölçeklenmiştir (ham paketler repoda tutulmaz; Aseprite
dosyaları `tools/aseprite.py` ile okunur). Sola bakan paketler (Light Bandit, Skullwolf) aynalanmıştır. Pakette olmayan
animasyonlar mevcut karelerden türetilmiştir: Light Bandit ölümü = "Recover" karelerinin tersi; Skullwolf koşusu ve
Goblin Barbarian yürüme/darbe/ölüm kareleri bekleme karelerinden üretilir.
Diğer tüm görseller, sesler ve müzik oyun içinde procedural olarak üretilir.

**V2.0 (Kül ve Ayaz):** Yeni üçüncü taraf varlık eklenmedi. 12 yeni yaratık/elit/boss sprite'ı, 4 yeni NPC, kül/kar/buz
tile set'leri, 30 eşya ikonu, 18 materyal ikonu, 2 beceri ikonu ve efektleri, müzik ve ortam sesleri oyun içinde procedural
olarak üretilir (`src/art/monstersV2.js`, `src/art/tiles.js`, `src/art/objects.js`, `src/art/icons.js`, `src/audio/sound.js`).

İkonlar `tools/import-icons.py` ile seçilip (16×16, ölçeklemesiz) aktarılır; aynı çizimi paylaşan eşyalar oyundaki renk
kimliklerine göre tonlanır. Pakette karşılığı olmayan kalkan, odak/ayna, eldiven, kolye ve materyal ikonları procedural kalır.
