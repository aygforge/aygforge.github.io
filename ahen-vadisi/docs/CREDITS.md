# Emeği geçenler / Lisanslar

| Kullanım | Kaynak | Lisans |
|---|---|---|
| Warrior oyuncu sprite'ı (`public/sprites/hero_warrior`) | Fantasy Warrior — LuizMelo, https://luizmelo.itch.io/fantasy-warrior | CC0 (pakette License.txt) |
| Mage oyuncu sprite'ı (`public/sprites/hero_mage`) | Wizard Pack — LuizMelo, https://luizmelo.itch.io/ | Pakette lisans dosyası yok; itch.io sayfasındaki lisans doğrulanmalı |
| Cevher Rahibi sprite'ı (`public/sprites/mon_ore_priest`) | Evil Wizard 2 — LuizMelo, https://luizmelo.itch.io/evil-wizard-2 | CC0 (pakette License.txt) |

Sprite'lar `tools/import-sprites.py` ile kırpılıp oyun boyuna ölçeklenmiştir (ham paketler repoda tutulmaz).
Diğer tüm görseller, sesler ve müzik oyun içinde procedural olarak üretilir.

**V2.0 (Kül ve Ayaz):** Yeni üçüncü taraf varlık eklenmedi. 12 yeni yaratık/elit/boss sprite'ı, 4 yeni NPC, kül/kar/buz
tile set'leri, 30 eşya ikonu, 18 materyal ikonu, 2 beceri ikonu ve efektleri, müzik ve ortam sesleri oyun içinde procedural
olarak üretilir (`src/art/monstersV2.js`, `src/art/tiles.js`, `src/art/objects.js`, `src/art/icons.js`, `src/audio/sound.js`).
