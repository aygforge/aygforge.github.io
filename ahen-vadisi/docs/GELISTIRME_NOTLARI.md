# Geliştirme Notları — Veri Sistemini Genişletme

Ahen Vadisi'nde oyun içeriği `src/data/*` altındaki merkezi tablolardadır; mantık `src/systems/*` (saf, test edilebilir),
görsel `src/art/*` (procedural), dünya ve arayüz bu ikisini okur. Yeni içerik çoğunlukla **yalnız veri eklemekle** gelir.

## Yeni sınıf (Assassin / Archer)

1. `src/data/classes.js` → `CLASSES.assassin = { base, attackInterval, attackRange, damageType, hp(L,vit), mp(L,int), starterKit, ... }`.
   Menzilli sınıf için `attackRange` 5–7 tile; Player normal saldırıda `damageType` ve menzile göre mermi kullanır
   (`entities/Player.js → normalAttack`: `phys` yakın dövüş vuruşu; menzilli fiziksel için `projectile('arrow')` dalı eklenmeli).
2. `src/data/skills.js` → 4 aktif + 3 pasif + 1 ustalık kaydı ve `CLASS_SKILLS.assassin`. Aktif beceri tipleri:
   `single`, `self_aoe`, `ground`, `self`. Yeni bir etki türü gerekiyorsa `Player.execSkill` içine bir `case` ekleyin.
3. Pasif anahtarları `systems/stats.js → computeStats` içinde `passiveValue(char, id, key)` ile okunur; yeni anahtar ekleyin.
4. Eşyalar: `src/data/items.js` içinde `cls: 'assassin'` şablonları (silah türü `look.type` için `art/characters.js → weaponSprite`
   ve `art/icons.js → itemIcon` içinde çizim dalı). Loot havuzları sınıf ağırlığını otomatik uygular.
5. Görünüm: `art/characters.js → BASE` ve `playerLook` (zırh renkleri eşya `look` alanından gelir).
6. Menü: `ui/menu.js → showCreate` sınıf listesine id ekleyin. Kayıt şeması değişmez (sınıf bir string).
7. Testler: `tests/unit/data.test.js` sınıf başına her slot havuzu kontrolü otomatik genişler.

## Yeni bölge / harita

1. `src/data/maps/<id>.js` oluşturun: `w, h, seed, base, mass, border|carve, areas (camp, spawns, elite, boss, safePocket),
   paths, ponds, stamps, scatter, decor, objects (portal, waystone, altar, gather, qobj, npc, fx), entries, locations`.
2. `src/data/maps/index.js` → `MAPS` ve gerekirse `WAYSTONES` (ücret).
3. Komşu haritaya `portal` nesnesi ve `entries` ekleyin (bağlantı testi çift yönlülüğü doğrular).
4. Yeni zemin/kütle türü gerekirse `world/tileRegistry.js` (TERRAINS, TRANSITIONS, MASSES, STAMPS) ve `art/tiles.js`
   (renk paleti + çizim dalı). Tile indeksleri otomatik üretilir.
5. `tests/unit/maps.test.js` erişilebilirlik ve onarımsız üretim testini yeni harita için de çalıştırır.

## Yeni yaratık / elit / boss

1. `src/data/enemies.js` → `{ id, name, kind, level, hp, atk, def, mdef, exp, species, ai, aggro, leash, speed,
   attackInterval, attackRange, dmgType, respawn, radius, sprite, lootTable, materials, projectile?, poison? }`.
   AI türleri: `passive, aggressive, pack, ranged, tank, elite, static, boss_*`.
2. Görsel: `art/monsters.js → DESIGNS` (özel çizim) veya `HUMANOIDS` (insansı tabanlı) içine `sprite` anahtarı.
3. Elit yeteneği: `entities/Enemy.js → updateAbility` içine yeni bir telegraflı dal. Boss: `entities/bosses.js` içinde
   `makeBossBehavior` + davranış nesnesi (`update`, `reset`, `onDeath`, `phase`).
4. Haritada bir alanın `spawns`, `elite` veya `boss` alanına ekleyin. Elit, yalnız **kendi kampındaki** normal yaratık
   öldürmeleri `ELITE_RULE.killsNeeded` (25) sayısına ulaşınca ve son elit ölümünden `minActiveSec` (120 sn aktif oyun) geçince doğar.

## Yeni eşyalar

- Şablon: `ITEM_LIST`'e ekleyin (`base` yükseltmeden etkilenir, `fixed` etkilenmez, `sources` loot kaynağıdır).
- `allowedRarities` otomatik: kanonik N/U ve benzersiz olmayanlar N/U/R varyantı olabilir; R/E/L kanonik kalır.
- Legendary eklemek: `rarity: 'L'`, `legendaryFixed`, `effect` ve kaynağı `LEGENDARY_SOURCE_TABLE` olan bir boss.
  Efektin savaş kodu `world/combatRuntime.js` (normal vuruş: Kızıl Hüküm örneği; büyü: Ruh Yankısı örneği).
  **Kural:** `tests/unit/loot.test.js` boss dışı her kaynakta 0 Legendary'yi doğrular.

## Seviye sınırını yükseltme (Lv.21–40)

- `data/constants.js → MAX_LEVEL`; `xpToNext` formülü genel; `RESET_COST` aralıkları.
- Beceri rank dizileri ve `ACTIVE_RANK_COST` uzatılabilir; `skillPointsTotal` seviye-1 + sınıf görevleri.
- Yükseltme +9 için `UPGRADE_STEPS` tablosuna kademeler ve `isUpgradeable`/doğrulama sınırları (`save/serialize.js` p ≤ 5).

## Kayıt şeması geçişleri

`data/constants.js → SCHEMA_VERSION` artırın ve `save/serialize.js → migrate()` içine `if (fromVersion < N) { ... }`
dönüşümü yazın. Doğrulama (`validateProfile`) yeni alanları kontrol etmeli. Snapshot ve checksum mekanizması değişmez.

## Doğrulama botu (yalnız geliştirme)

`src/dev/bot.js` ana görev zincirini gerçek oyun kodu üzerinden oynayan bir test botudur (yalnız geliştirme sunucusunda `/src/dev/bot.js` olarak
içe aktarılır; hiçbir modül onu içe aktarmadığı için üretim paketine girmez). `npm run dev` açıkken:

```
node tools/bot-run.mjs warrior 4 110   # sınıf, oyun hızı çarpanı, gerçek dakika sınırı
```

Bot dokunarak hedef seçer, telegraflardan kaçar, iksir/ekipman alır, ot toplayıp iksir üretir, ölünce seviye kasar ve
her ölümde son 20 sn'deki hasar kaynaklarını yazar (`ÖLÜM #n … son20sn={…}`). Denge değişikliğinden sonra
çalıştırıp ölüm noktalarına bakın. Bot oynanışı insan oyuncunun yerini tutmaz (kaçma/kiting yapmaz).

## Sabit kurallar (değiştirilmemeli)

- Legendary yalnız boss çekilişinden; pity, garanti, parça, sandık, NPC satışı, craft yok.
- Joystick her zaman önceliklidir; otomatik yaklaşmayı keser; bırakınca yeniden başlatmaz.
- Başarısız yükseltme eşyayı kırmaz, silmez, seviyesini düşürmez.
- Enerji, günlük bilet, premium para, AFK savaş yok.
