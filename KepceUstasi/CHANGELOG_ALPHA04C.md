# Alpha 0.4C — Level Çeşitliliği

- Kaynak veri: `src/data/alpha04/alpha04c_level_identity_20.json` (level ID'leri L1–L20 aynı).
- Her level: kendi adı, tarifi, 3–6 normal dalgası, `skillPicksAfterWaves` (her normal dalgadan sonra 1 kart, finalden sonra yok).
- Finaller: L10 Dev Domates / L20 Patates Kral eski boss AI ve HP 42/54 ile korunur; L5/L15 mini boss; L4,6,9,14,17,19 çift final (ikisi de ölünce zafer, ödül tek sefer); diğerleri tekil elit. Mevcut sprite'lar yeniden kullanılır, elitlerde isim etiketi.
- Spawn: `near` (L2,8,12,18) daha yakın X aralığı; `staggered` (L4,9,17,19) üç derinlik grubu, şerit yok. Düşmanlar yine yalnızca tur sonunda sağdan sola hareket eder.
- L7 pot bonusu: yalnızca büyük yağ şansı ×1.35.
- Level girişinde 1.6 sn başlık: alt başlık, ekran kuralı, dalga sayısı, tarif hedefi; final dalgasında FİNAL / ÇİFT FİNAL afişi.
- Kısmi ödül, levelin kendi dalga sayısına göre hesaplanır.
- Korunan: fiziksel kepçe, otomatik savaş, 24 yetenek, enerji, ekipman/crafting, dungeon'lar (veri değişmedi), kayıt/migrasyon, ekonomi.
- Testler: `tests/unit/alpha04c.test.mjs` (+ 0.4A adaptör testi yeni veriye güncellendi), smoke: `tests/sim/smoke04c.mjs` (L1, L9, L20).
- Bilinen not: 0.4B'den kalan yarım bir koşu kaydı, devam ettirilirse yeni dalga sayısıyla oynanır.
