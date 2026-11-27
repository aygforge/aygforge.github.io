# Kepçe Ustası — V1.0 değişiklikleri (Alpha 0.5A.1 üzerine)

## İçerik
- **120 level / 12 bölüm.** L1–30 (0.4C/0.5A verisi) değişmedi. L31–120: `src/data/v1/v1_compact_content.json` → `src/data/v1/v1Adapter.js`.
  - Dalgalar `[a,b,c]` = bölüm düşman sırasına göre adet (şerit değil). Normal HP = `round(e.hp × h)` bir kez; final/boss HP, kalkan, kabuk ölçeklenmez.
  - Final tipleri: B bölüm boss'u, M mini boss (L35…L115), D çift, T üçlü elit, E tek elit. Çift/üçlü finalde hepsi ölmeden zafer yok.
  - Ödül: `g` baz bahşiş, ilk temizleme `round(g×0.5)`, yıldız 1/1.15/1.30; `o=1.2` yalnız büyük yağ şansını çarpar. Spawn: standard / near / varied (3 derinlik, şerit yok).
  - Açılımlar: L25 Boss Mutfağı, L35 Epic + Kazan Kulesi, L70 Legendary, L120 "oyun tamamlandı" işareti ve sonuç ekranı mesajı.
- **Yeni düşman mekanikleri** (tek EnemyDirector / CombatResolver):
  bölünme (Spiral: bir kez 2×2 HP, tarif katkısı 0), +1 adım buff (Sarımsak/Soya her 3. eylem max 2; Pırasa bir kez), müttefik kalkanı (Brokoli/Peynir/Sos/Zerdeçal, mevcut koruyucu kuralı), kendi kalkanını bir kez yenileme (Havuç), kabuk (Hamur 3; Patlıcan 4 — veri sayı vermediği için 4 seçildi), katmanlı kabuk (Yufka 6 = her vuruşta 1 katman, 3 vuruş), acı temas (Acı Biber 2 hasar, 0.5A.1 vur-çekil-yaklaş-vur döngüsü), müttefik +1 can (Ispanak max 2), ilk gerçek isabet −1 (Sırlı/Kraliyet Domates), her 3. gerçek isabet −1 (Baharat), hedef önceliği (Lavaş; sadece eşit tehlikede), `move[]` döngüleri ([1,2], [1,1,2], [1,0]).
- **9 yeni boss fazı** (her eşik bir kez, boss ölünce hiçbiri çalışmaz): Spagetti Kralı (%60 2 spiral, %30 +3 kalkan), Hamur Devi (%50 +4 kabuk, %25 hızlanma), Acı Noodle Ejderi (her 3. hareket öncesi uyarı + 2 adım, %50 2 noodle), Güveç Golemi (%65 kalkanı kırar + hızlanır, %35 1 havuç), Tava Muhafızı (%66 +3 kalkan, %33 2 sırlı domates), Kat Kat Börek (kabuk kırılınca [1,2], %35 2 susam), Dev Dürüm (%50 2 turşu, %25 hızlanma), Köri Sultanı (%60 iki müttefiğe/kendine +2 kalkan; %30 sonrası Soğuk Sos en fazla 3 boss eyleminde 1 — **uyarlama:** %30 öncesi boss her eylemde dondurulabilir, sonrası mevcut sınıra döner), Ziyafet Efendisi (%66 2 kraliyet noodle, %33 +4 kalkan ve [1,2]).
- Görseller: 25 yeni düşman, 9 boss, 9 bölüm tabağı — `tools/gen-assets.mjs` ile özgün prosedürel pixel art; bölüm başına savaş arka planı tonu. Boss fazında ayrı `boss_warn` sesi.

## İlerleme / ekonomi
- **Epic / Legendary** (4 yuva, mevcut Common→Rare ve maliyetler aynı): Rare→Epic 140 parça + 2 mühür + 900 bahşiş (L35), Epic→Legendary 280 + 6 + 4000 (L70). Gerçek etkiler: Silah normal yağ taban hasarı +1/+2, Kepçe ağzı %9/%12 (fiziksel), Önlük +3/+4 can, Tava her 4./3. öldürmede non-proc bonus yağ.
- **Güçlendirme 0–30** (her yuva): maliyet `round(45×1.16^lvl)` bahşiş + `ceil((lvl+1)/3)×5` parça; Silah her 5 seviyede +1 gerçek hasar, Önlük her 10'da +1 can, Kepçe her 10'da +1 kapasite (≤15), Tava her 15'te aralık −1 (≥2).
- Şef Gücü = mevcut formül + Epic/Legendary gücü + güçlendirme seviyeleri (yalnız öneri, kilit değil). Hardwall etiketi L20/40/60/80/100/120, diğer bölüm sonları softwall.
- **Dungeon'lar** (hepsi 5 enerji, aynı motor): Altın Mutfak ve Malzeme Deposu L30 sonrası ödülleri ölçeklenir (L1–30 aynı). **Boss Mutfağı** (L25): yenilmiş en zor 3 bölüm boss'u art arda, aralarda kart; haftalık ilk 3 zafer 2 mühür + bahşiş, sonrası küçük bahşiş; Pazartesi 00:00 UTC sıfırlama. **Kazan Kulesi** (L35): 5 katlık bloklar (4 dalga + final), checkpoint, her 5 katta ilk kez bahşiş+parça, her 15. katta ilk kez 1 mühür, 100+ kat formülle devam.
- **Görevler:** 3 günlük + 3 haftalık, UTC sıfırlama, ödül bir kez.

## Platform
- **TR/EN** anahtar katmanı (`src/i18n.js`, Ayarlar → Dil). EN eksikse TR; ham anahtar gösterilmez. Level adları TR kalır (bilinçli).
- **Monetizasyon** (`src/systems/Monetization.js`, `src/platform/*`): interstitial yalnız sonuç→menü geçişinde, ilk 2 koşuda yok, 2 koşu + 5 dk aralık, reklam kaldırma hakkıyla hiç yok. Ödüllü: enerji doldurma (günde 2), +%40 bahşiş (koşu başına 1), 2 canla devam (koşu başına 1), ekstra kart yenileme. Ödül yalnız doğrulanmış callback + benzersiz `rewardId`. IAP: token başına tek tahsis, geri yüklemede iade edilen kalıcı haklar düşer. Web'de hepsi kapalı, sahte ödül yok.
- **Kayıt v6:** yeni alanlar varsayılanla bir kez eklenir; eski bahşiş/upgrade/ekipman/enerji/yıldız korunur. Açılamayan eski yarım koşu güvenle kapatılır, 5 enerji iade edilir.
- **Android:** Capacitor 8 projesi (`android/`), targetSdk/compileSdk 36, minSdk 24, portrait, geri tuşu = duraklat/menü kapat, ikon + splash.

## Testler
- `npm test`: 127 test (118 eski + 9 V1). Eski tasarımı doğrulayan 4 beklenti güncellendi (120 level, L30→L31 açılımı, Rare sonrası Epic kilidi, kayıt sürümü 6); hiçbir test silinmedi.
- Smoke: `tests/sim/smokeV1.mjs` (7 koşu), UI: `tests/e2e/v1-ui-smoke.mjs` (360×640, 390×844).
