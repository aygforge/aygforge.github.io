# Alpha 0.5A — Mantarlı Omlet (L21–30)

- Veri: `src/data/alpha05/alpha05a_level_21_30.json` (paketten); belgeler `docs/alpha05/`. L1–20 verisi ve davranışı değişmedi.
- Adaptör: `stages.js` 30 level; omlet chapter tabanı (tarif Mantar/Soğan/Yumurta, `dish_omelet`), JSON HP (`baseHpById × hpScale`), finaller ve ödüller.
- Yeni düşmanlar (`content.js`): `mushroom`, `mushroom_guard`, `onion`, `giant_mushroom`; yeni sade pixel sprite'lar `tools/gen-assets.mjs` ile (yumurta yeniden kullanıldı).
- Hasar sırası (`CombatResolver.applyDamage`): savunma → harici kalkan → soğan kabuğu → HP (taşma HP'ye geçer, kabuk ölçeklenmez/yenilenmez).
- Soğan: kabuk kırılınca hareket bir SONRAKİ düşman fazından itibaren 1,2,1,2.
- Koruyucu Mantar: kendi 3./6. eyleminde, hareketlerden sonra, x ≤ 0.26 içindeki en yakın koruyucu olmayan müttefiğe +2 kalkan (hedefte max 3); koruyucu başına max 2 pulse; faz başına tek kalkan olayı; hedef yoksa pulse yanar.
- Elit Şapka (L25): 38 HP + 3 kalkan; %50 altına inip hayatta kalınca bir kez +2 kalkan (max 4).
- Çift final (L23/24/27/29): ikisi de yenilmeden zafer yok; 0.5A finalleri tarif malzemesi olarak bir kez sayılır.
- Koca Mantar (L30): 72 HP + 4 kalkan, x 0.70, temas 2; ≤%50'de bir kez 2 mantar (6 HP) + 1,2 hareket; her 3. eylemde (max 2) çağrılmışa +2 / yoksa kendine +1; ölünce anında zafer.
- Kayıt: L20'yi bitirmiş eski kayıtta L21 açılır; L25/L30 gelecek bayrakları bir kez kaydedilir, buton gösterilmez. Level seçim ekranı 5 sütun / 30 level.
- Testler: `tests/unit/alpha05a.test.mjs` (7 test); smoke `tests/sim/smoke05a.mjs` (L22, L29, L30).
