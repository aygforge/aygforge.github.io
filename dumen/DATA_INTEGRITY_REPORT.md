# DATA_INTEGRITY_REPORT

Bu rapor `node tests/run.js --report` tarafından otomatik üretildi (2026-11-02T22:39:20.990Z).

## Sonuç

- Test: **209 geçti, 0 başarısız**
- Validate.run: hatasız

## Kaynak sayımları

| Kalem | Değer |
|---|---|
| FishDB kayıt | 88 |
| Legendary (kaynak teyitli) | 9 |
| Boss | 1 (BG_15 Antik Kraken) |
| rarity=null (türetilmiş) | 78 |
| ItemDB kayıt | 102 |
| Kategoriler | special 25, bait 14, rod 9, line 4, hook 4, float 3, material 18, chest 10, key 5, black_market_part 6, currency 3, permit 1 |
| Sipariş şablonu | 36 |
| Günlük görev şablonu | 10 |
| Ana görev | 19 |
| TrashDB (ayrı katalog) | 20 |
| CosmeticDB (ayrı katalog) | 12 |

## Bölge → balık

| Bölge | Kod | Balık | Legendary/Boss |
|---|---|---|---|
| Eski Liman | EL | 11 | EL_11 Bıyıklı Amca Balığı |
| Tembel Sazlıklar | TS | 10 | TS_09 Minyatür Göl Canavarı, TS_10 Bataklık Cadısı Balığı |
| Paslı Sanayi Kanalı | PSK | 11 | PSK_11 Robo-Köpekbalığı Mk.1 |
| Yakamoz Koyu | YK | 10 | YK_10 Yavru Ay Işığı Balinası |
| Titrek Buzullar | TB | 10 | TB_10 Antik Buzul Canavarı |
| Batık Korsan Mezarlığı | BKM | 10 | BKM_10 Kraken'in Küçük Yeğeni |
| Kaynar Kazan Deltası | KKD | 11 | KKD_11 Anka Balığı |
| Bermuda Girdabı | BG | 15 | BG_14 Oyun Geliştiricisi Balığı, BG_15 Antik Kraken |

## Materyal → en erken bölge (deadlock analizi)

- MAT_03 Cıvata & Somun Paketi: bölge #1 (EL)
- MAT_08 Çatlak Plastik Parça: bölge #1 (EL)
- MAT_SCRAP Hurda Metal: bölge #1 (EL)
- MAT_07 Kırık Pervane: bölge #1 (EL)
- MAT_02 Paslı Plaka: bölge #2 (TS)
- MAT_17 Pas Yiyen Çekirdek: bölge #2 (TS)
- MAT_12 Yakamoz İnci: bölge #4 (YK)
- MAT_18 Yakamoz Fısıltı Taşı: bölge #4 (YK)
- MAT_10 Buz Kristali Parçası: bölge #5 (TB)
- MAT_15 Buzkıran Dişi: bölge #5 (TB)
- MAT_13 Korsan Altın Pulu: bölge #6 (BKM)
- MAT_06 Eski Motor Parçası: bölge #3 (PSK)
- MAT_11 Lava Çekirdeği: bölge #7 (KKD)
- MAT_16 Kızıl Isırgan Tohumu: bölge #7 (KKD)
- MAT_14 Manyetik Çekirdek: bölge #8 (BG)
- MAT_09 Elektrik Kablosu Demeti: bölge #3 (PSK)
- MAT_04 Yay Mekanizması: bölge #1 (EL)
- MAT_05 Dişli Seti: bölge #2 (TS)

## Otomatik oyuncu (uçtan uca ilerleme)

- Atış: 1955, varsayılan aktif süre ≈ 14.1 saat (25 sn/atış varsayımı)
- Tekne: Sv.10, bölge: 8/8, tür: 74/88, boss: 1
- Hikâye bölümleri: T1, T2, T3, T4, T5, K1, K2, K3, Z1, Z2, Z3, Z4, Z5
- Tekne yükseltme zaman çizelgesi: Sv.2 @24 atış · Sv.3 @108 atış · Sv.4 @156 atış · Sv.5 @420 atış · Sv.6 @432 atış · Sv.7 @624 atış · Sv.8 @1632 atış · Sv.9 @1656 atış · Sv.10 @1692 atış

## Eşya edinim kaynakları (102)

| ID | Ad | Kaynaklar |
|---|---|---|
| SPC_01 | Papatya Çayı | Market; CHEST_04; CHEST_05; CHEST_08 |
| SPC_02 | Sıcak Çikolata | Market; CHEST_04; CHEST_05; CHEST_08; Görev ödülü |
| SPC_03 | Taso Yığını | Görev ödülü |
| SPC_04 | Tansiyon Aleti | Görev ödülü |
| SPC_05 | Özel Yazlık Şapka (Baseball) | Görev ödülü |
| SPC_06 | Anneanne Gözlüğü | Görev ödülü |
| SPC_07 | Ağrı Kesici | Görev ödülü |
| SPC_08 | Kahve Termosu | Market; CHEST_04; CHEST_05; CHEST_08; Görev ödülü |
| SPC_09 | Eski Balıkçı Eldiveni | Görev ödülü |
| SPC_10 | Yarım Bisküvi (Kardeş Payı) | Market; CHEST_04; CHEST_05; CHEST_08 |
| SPC_11 | Melek Tokası | Hasan: R_SPC_11; CHEST_03; CHEST_06; CHEST_07; CHEST_09 |
| SPC_12 | Uğurlu Kitap | Görev ödülü |
| SPC_13 | Melek Kanadı (Çift) | CHEST_07; CHEST_09; Görev ödülü; Çark |
| SPC_14 | Şanslı Çorap | Görev ödülü |
| SPC_15 | Çatlak Pusula | CHEST_10 |
| SPC_16 | Günay Bey’in Özel Misinası | Hasan: R_SPC_16; CHEST_03; CHEST_07; CHEST_09 |
| SPC_17 | Köstekli Saat | Görev ödülü |
| SPC_18 | Dambıl | Hasan: R_SPC_18; CHEST_07; CHEST_09 |
| SPC_19 | Acil Durum Butonu | Zıpırleone (Miyav); Arka Oda; CHEST_09; Görev ödülü; Çark |
| SPC_20 | Balık Sakinleştirici Sprey | Zıpırleone (Miyav); Arka Oda; CHEST_09; Görev ödülü; Çark |
| SPC_21 | Cep Vantilatörü | Market; CHEST_04; CHEST_05; CHEST_06; CHEST_08; Görev ödülü |
| SPC_22 | Eski Kumanda | Görev ödülü |
| SPC_23 | Balonlu Naylon (Patpat) | Market; CHEST_04; CHEST_05; CHEST_08 |
| SPC_24 | Enerji İçeceği | Market; CHEST_03; CHEST_04; CHEST_05; CHEST_06; CHEST_08 … |
| SPC_25 | Kaçak Yem | Zıpırleone (Miyav); Arka Oda; Görev ödülü; Çark |
| BAIT_01 | Ekmek Topu | başlangıç; Market; CHEST_01; Görev ödülü |
| BAIT_02 | Solucan Dürümü | Market; CHEST_01; Görev ödülü |
| BAIT_03 | Mısır Tanesi | Market; Görev ödülü |
| BAIT_04 | Midye Lokumu | Market; CHEST_01 |
| BAIT_05 | Karides Kırıntısı | Market; Görev ödülü; Çark |
| BAIT_06 | Simit Kırığı Deluxe | Market; Görev ödülü |
| BAIT_07 | Paslı Cıvata Yemi | Market; CHEST_02 |
| BAIT_08 | Yakamoz Jölesi | Market; CHEST_04; Görev ödülü |
| BAIT_09 | Buzlu Hamsi Küpü | Market; CHEST_05 |
| BAIT_10 | Acı Lava Çekirdeği | Market; CHEST_06; Görev ödülü |
| BAIT_11 | Hayalet Sardalya | Market; CHEST_03 |
| BAIT_12 | Efsane Sosu | Market; CHEST_07; Görev ödülü; Çark |
| BAIT_13 | Yasaklı Sucuk | Market; Zıpırleone (Miyav); Çark |
| BAIT_14 | Alüminyum Folyo Böceği | Market; CHEST_07 |
| ROD_01 | Tahta Olta | başlangıç |
| ROD_02 | Dengeli Olta | Market |
| ROD_03 | Sağlam Olta | Market |
| ROD_04 | Hızlı Sarıcı Olta | Market |
| ROD_05 | Usta Oltası | Market |
| ROD_06 | Buzkıran Olta | Hasan: R_ROD_06 |
| ROD_07 | Kızıl Isırgan Olta | Hasan: R_ROD_07 |
| ROD_08 | Pas Yiyen Olta | Hasan: R_ROD_08 |
| ROD_09 | Yakamoz Fısıldayan Olta | Hasan: R_ROD_09 |
| LINE_01 | Naylon Misina | başlangıç |
| LINE_02 | Çelik Örgü Misina | Market |
| LINE_03 | Yakamoz Misina | Hasan: R_LINE_03 |
| LINE_04 | Buz Kıran Misina | Hasan: R_LINE_04 |
| HOOK_01 | Körelmiş İğne | başlangıç |
| HOOK_02 | Keskin İğne | Market |
| HOOK_03 | Üç Dişli Kanca | Market |
| HOOK_04 | Korsan Çengeli | Hasan: R_HOOK_04 |
| FLOAT_01 | Mantarlı Şamandıra | başlangıç |
| FLOAT_02 | Kurşun Şamandıra | Market |
| FLOAT_03 | Neon Şamandıra | Market |
| MAT_SCRAP | Hurda Metal | Market; CHEST_02; Çöp: Ezik Teneke Kutu; Çöp: Ters Dönmüş Şemsiye; Çöp: Paslı Bisiklet Zili; Çöp: Kırık Vites Kutusu … |
| MAT_02 | Paslı Plaka | Hasan: R_PLATE; CHEST_02; Çöp: Boru Parçası; Fabrika: PSK |
| MAT_03 | Cıvata & Somun Paketi | Market; CHEST_01; Çöp: Ters Dönmüş Şemsiye; Çöp: Mangal Izgarası; Fabrika: EL; Fabrika: TS … |
| MAT_04 | Yay Mekanizması | Hasan: R_SPRING; CHEST_02; CHEST_05; CHEST_08; Çöp: Paslı Bisiklet Zili |
| MAT_05 | Dişli Seti | Hasan: R_GEARS; CHEST_02; Çöp: Kırık Vites Kutusu; Görev ödülü |
| MAT_06 | Eski Motor Parçası | Hasan: R_MOTOR; CHEST_03; CHEST_06; CHEST_08; Çöp: Mini Çapa; Fabrika: BKM |
| MAT_07 | Kırık Pervane | Hasan: R_PROP; CHEST_01; Çöp: Pervane Kanadı; Fabrika: EL; Görev ödülü |
| MAT_08 | Çatlak Plastik Parça | Market; CHEST_01; Çöp: Tek Lastik Çizme; Çöp: Plastik Ördek; Çöp: Tek Terlik; Çöp: Buzdolabı Magneti … |
| MAT_09 | Elektrik Kablosu Demeti | Hasan: R_CABLE; CHEST_04; Çöp: Pilsiz Kumanda; Çöp: Eski CD; Çöp: Dolanmış Kulaklık; Fabrika: BG |
| MAT_10 | Buz Kristali Parçası | CHEST_05; Çöp: Kar Küresi; Fabrika: TB; Görev ödülü |
| MAT_11 | Lava Çekirdeği | CHEST_06; Fabrika: KKD; Görev ödülü |
| MAT_12 | Yakamoz İnci | CHEST_04; Fabrika: YK; Görev ödülü |
| MAT_13 | Korsan Altın Pulu | CHEST_03; Fabrika: BKM; Görev ödülü |
| MAT_14 | Manyetik Çekirdek | CHEST_07; Çöp: Piksel Kümesi; Fabrika: BG; Görev ödülü |
| MAT_15 | Buzkıran Dişi | CHEST_05; Fabrika: TB; Görev ödülü |
| MAT_16 | Kızıl Isırgan Tohumu | CHEST_06; Fabrika: KKD; Görev ödülü |
| MAT_17 | Pas Yiyen Çekirdek | CHEST_02; Fabrika: PSK; Görev ödülü |
| MAT_18 | Yakamoz Fısıltı Taşı | CHEST_04; Fabrika: YK; Görev ödülü |
| CHEST_01 | Islak Karton Sandık | Hazine: EL; Hazine: TS |
| CHEST_02 | Teneke Sandık | Hazine: TS; Hazine: PSK |
| CHEST_03 | Korsan Sandığı | Hazine: BKM; Görev ödülü |
| CHEST_04 | Yakamoz Sandığı | Hazine: YK |
| CHEST_05 | Buzlu Sandık | Hazine: TB |
| CHEST_06 | Lava Kasası | Hazine: KKD |
| CHEST_07 | Bermuda Mührü Sandığı | Hazine: BG; Görev ödülü |
| CHEST_08 | Kilitli Kasa | Hazine: tüm bölgeler; Çark |
| CHEST_09 | Şifreli Kasa | Hazine: BKM; Hazine: KKD; Hazine: BG; Çark |
| CHEST_10 | Tarçov Mühürlü Kasa | Görev ödülü |
| KEY_01 | Paslı Anahtar | Hasan: R_KEY_01; CHEST_01; CHEST_02; Çöp: Paslı Anahtarlık; Görev ödülü |
| KEY_02 | Korsan Anahtarı | Hasan: R_KEY_02; CHEST_08; Görev ödülü |
| KEY_03 | Yakamoz Anahtarı | Hasan: R_KEY_03; CHEST_08; Görev ödülü |
| KEY_04 | Buz Mührü Anahtarı | Hasan: R_KEY_04; CHEST_08 |
| KEY_05 | Bermuda Gravür Anahtarı | Hasan: R_KEY_05 |
| BM_01 | Gizli Motor Parçası | Zıpırleone (Miyav) |
| BM_02 | Kara Pazar Gövde Plakası | Zıpırleone (Miyav) |
| BM_03 | Güçlendirilmiş Omurga | Zıpırleone (Miyav) |
| BM_04 | Derin Su Modülü | Zıpırleone (Miyav) |
| BM_05 | Kaçak Navigasyon Ünitesi | Zıpırleone (Miyav) |
| BM_06 | Kimseye Söyleme Çekirdeği | Zıpırleone (Miyav) |
| CUR_COIN | Coin | başlangıç |
| CUR_SCRAP | Scrap | Hasan: eritme; CHEST_08; CHEST_09; Fabrika: çöp ayrıştırma |
| CUR_MIYAV | Miyav Puanı | CHEST_07; CHEST_09; CHEST_10; Görev ödülü; Çark |
| TCK_BOATYARD_PERMIT | Tersane İzni | Tekne Atölyesi |
