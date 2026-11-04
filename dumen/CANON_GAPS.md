# CANON_GAPS — Kaynakta belirsiz → bu sürümde seçilen çözüm

Kaynaklar: `DUMEN_Tam_Surum_GDD_v1.0.md`, `src/data/source/Dumen_FishDB_2026-11-02.json` (88 balık), `src/data/source/Dumen_ItemDB_2026-11-02.json` (102 eşya).
Kaynak JSON dosyaları **birebir** korunur (testler gömülü kopyanın bayt eşitliğini doğrular). Aşağıdaki her şey **türetilmiş (derived) uygulama kararıdır**; GDD kanonu olarak sunulmaz.

## Kesin alınan kanon (değiştirilmedi)
- 8 bölge adı ve sırası; 88 balık ID/ad/bölge; 9 teyitli `legendary`, `BG_15 Antik Kraken` = `boss`.
- 102 eşya ID/ad/kategori/effect; 12 kategori sayaçları (25/14/9/4/4/3/18/10/5/6/3/1). `MAT_SCRAP` (Hurda Metal, materyal) ve `CUR_SCRAP` (Scrap, para birimi) ayrı kalır.
- 9 olta; 4 özel olta Hurdacı Hasan'da craft. İnat Barı + gerilim + mesafe + SAR + **Çek** çekirdeği.
- Hazine oltayla çıkar, zamanlama barı yeşil/sarı/kırmızı; sandık balık tutarken açılmaz, Envanter'de açılır.
- Tarçov × Zıpırleone 5 bölüm → **Kara Pazar Çarkı** açılır (mahzen/mekan açılmaz), Tarçov kalıcı ayrılır. Zıpırleone orta oyun 5 bölüm → **gizli mekan**. Komplo Teorisyeni 3 bölüm → dördüncü duvar. Bölüm adları aynen.
- Çark: günde 1 ücretsiz + 2 ödüllü reklam. Martı tekneye konar, görev vermez. Pano evin yanında; kabul edilen sipariş Not Defteri'ne gider.

## Sayısal değerler (FishDB / ItemDB'de `null`)
| Kaynakta belirsiz | Bu sürümdeki çözüm | Yer |
|---|---|---|
| 78 balığın rarity'si `null` | Her balığa ad/tema/bölge tier'ına göre elle `derivedRarity` atandı (bölge başına ~4 Yaygın, 3 Sıradışı, 2 Nadir, 1 Epik). Kaynak alanı silinmedi; `rarityDerived:true` ile işaretli, Fishpedia'da "denge kararı" yazar. | `FishBalanceDB.js` |
| `basePrice`, `stamina`, `tensionSensitivity`, `escapeRate` hepsi `null` | Formül: bölge tabanı (EL 10 … BG 170) × nadirlik çarpanı (1 / 1.8 / 3.4 / 6.5 / 18 / 60) × ±%10 deterministik sapma. İnat = 36 × (1+0.3·(tier−1)) × nadirlik × davranış. | `FishBalanceDB.js`, `EconomyConfig.js` |
| Davranış ailesi atamaları | 7 aile (Calm, Wiggler, Runner, Heavy, Trickster, Berserk, Boss) isim temasına göre atandı; her aile ayrı hamle seti. | `FishBalanceDB.js`, `systems/Fishing.js` |
| Boy aralıkları | Balığın adına göre (hamsi küçük, balina büyük) elle atandı. | `FishBalanceDB.js` |
| Spawn ağırlıkları | Yaygın 60, Sıradışı 26, Nadir 10, Epik 3.4, Efsanevi 2.2, Boss 4. Efsanevi+Boss payı hiçbir kombinasyonla %12'yi geçemez (yem garanti vermez). Pity sistemi **eklenmedi** (kaynakta yok). | `FishBalanceDB.js`, `Encounter.js` |
| Eşya fiyatları (BM hariç `null`) | Market fiyatları ItemBalanceDB'de (ör. Dengeli 380, Sağlam 950, Hızlı Sarıcı 1500, Usta 3600). `null` hiçbir yerde 0'a çevrilmez. BM_01..06 kaynak Miyav fiyatları (30/45/65/90/120/160) aynen kullanıldı. | `ItemBalanceDB.js` |
| 25 özel eşyanın teknik parametreleri | Kaynak effect metni tooltip'te aynen gösterilir; sayı gerekenler kaynaktaki değerle (SPC_06 0,3 sn, SPC_07 %50, SPC_10 HP +%10, SPC_11 %25, SPC_13 %15, SPC_18 +%10, SPC_19 %40, SPC_20 20 sn). Diğerleri: SPC_01 Asılma +2 sn gecikme, SPC_02 Son Çırpınış gerilimi ×0.6, SPC_04 0,9 sn önceden uyarı, SPC_08 girdi gecikmesi 0,22→0,06 sn, SPC_16 Asılma ×0.55 / Dip süresi ×1.6, SPC_21 gerilim ×0.85, SPC_23 hata sonrası 1,4 sn duraklama, SPC_24 10 sn HP kaybı ×1.8 / gerilim ×1.35, SPC_25 Efsanevi ×2 + Hırçın. | `ItemBalanceDB.js`, `Loadout.js`, `Fishing.js` |
| Özel eşya tüketim/yuva kuralı | Pasif / şarjlı (mücadele ya da sefer başına 1, tükenmez) / tüketilir türleri. Yuva: tekne Sv.1–4: 2, Sv.5–8: 3, Sv.9+: 4; BM_06 +1. "Kaçak Yem" atışta tüketilir. | `ItemBalanceDB.js` |
| "Tembel ve dengeli balık" (SPC_05) | Tembel = Calm ×1.5, Dengeli = Wiggler ×1.3 olarak yorumlandı. | `ItemBalanceDB.js` |
| "Asılma", "Dip Yapma", "Son Çırpınış", "Hırçın" | Yeni UI metriği değil; balık davranış sistemi içindeki türetilmiş hamle/evre adları. Son Çırpınış İnat %35 altında başlar; Çek için İnat ≤ %22, mesafe ≤ çek bölgesi, gerilim kırmızı dışında. | `Fishing.js` |

## Sistem kararları
| Kaynakta belirsiz | Çözüm |
|---|---|
| Tazelik zaman eşikleri ve saat kuralı | **Aktif oyun saati** (sekme görünür + menü dışında). FRESH < 10 dk, NORMAL < 25 dk (×0.78), sonra STALE. Oyun kapalıyken / sahne değişince bozulma yok. Rüstem bayat almaz → fabrika. |
| Geri dönüşüm tarifleri | Deterministik: her bölgenin balığı → bölge materyali (Nadir+ ek özel materyal). Fabrika coin çarpanı 0.22–0.32; testler fabrikanın Rüstem'in taze fiyatını hiç geçmediğini doğrular. |
| Çöp | GDD'de var, ItemDB'de yok → ayrı **TrashDB** (20 tür). ItemDB 102'de kalır. |
| 10 sandık havuzu, 5 anahtar kuralı | ChestDB: Islak Karton (EL/TS, anahtarsız), Teneke (TS/PSK, anahtarsız), Korsan (KEY_02), Yakamoz (KEY_03), Buzlu (KEY_04), Lava Kasası (1 Buz Kristali ile soğutulur), Bermuda Mührü (KEY_05), Kilitli Kasa (KEY_01, her bölge), Şifreli Kasa (3 haneli kod bulmacası), Tarçov Mühürlü Kasa (T4 ödülü; Tarçov ayrılınca açılır). Anahtarlar Hasan'da tekrar üretilebilir. GDD §7.3 tablosundaki önerilen sandık adları yerine ItemDB adları kullanıldı. |
| Tekne seviye sayısı | GDD "1–10 önerilir" → **10 seviye** seçildi. Açılımlar: Sv.2 TS, Sv.3 PSK, Sv.4 YK, Sv.5 TB, Sv.6 BKM, Sv.8 KKD, Sv.10 BG. Sv.7/9 çevre dayanımı ve bonus verir. |
| `TCK_BOATYARD_PERMIT` | Tekne Sv.5 sonrası Tekne Atölyesi'nden 1.600 coin + 5 Cıvata; Sv.6+ yükseltmeler için gerekli, tüketilmez. |
| Bermuda "özel ilerleme koşulu" | Sv.10 + Komplo Teorisyeni 3. bölümünde verilen "Bermuda koordinatları" (GDD §8.8 tematik bağı). |
| Bölge çevre etkileri | Pas (dayanım −%15), soğuk (sarma −%22), sıcak (gerilim +%18), sis/karanlık/hayalet/anomali bilgi cezaları; bölge oltaları, misina/kanca/şamandıra ve tekne seviyeleri korur. Özel oltalar kendi bölgelerinde üstün, dışarıda Usta'dan biraz zayıf. |
| Envanter kapasitesi | Tekne seviyesine bağlı ambar (12 → 60), BM_02 +6. Dolunca atış engellenir; Envanter'den "denize bırak" ile softlock yok. |
| Miyav Puanı kazanma/harcama | Kazanç: hikâye bölümleri, günlükler, çark, Don'un tekrarlanabilir işleri, şiir gecesi. Harcama: BM parçaları, özel eşyalar, Yasaklı Sucuk, Arka Oda kozmetikleri, Z4 "Miyav Borcu". Cüzdanda hareket geçmişi tutulur. |
| Gizli mekanın işlevi | **"Arka Oda"**: günlük şiir gecesi (5 Miyav), Hatıra Duvarı (biten hikâyeler), Miyav butiği, gardırop. Balıkçılık bölgesi değildir. |
| Kara pazar parçalarının işlevi | Tekneye takılan kalıcı bonuslar (bekleme, ambar, düzeltme süresi, nadirlik, hazine, +1 yuva). Z5 en az bir takılı parça ister. |
| Günlük yenileme | Yerel takvim günü; cihaz saati geri alınırsa en büyük görülen zaman damgası kullanılır (tekrar hak yok). İleri alma çevrimdışı tamamen engellenemez. |
| Sipariş sayısı | 36 şablon (GDD'de kilitli sayı yok; hedef ≥30). 10 günlük şablon. |
| Kozmetikler | Ayrı **CosmeticDB** (12): bayrak/boya/şapka; tekne ve oyuncuda görünür. |
| Reklam | Gerçek SDK yok. `window.DUMEN_AD_PROVIDER` adaptörü tanımlı; yalnız `rewarded===true` sonrası tek kullanımlık jeton. SDK yoksa reklamlı haklar devre dışı ve açıklamalı. `?debug=1` emülatörü ödül yazmaz. |
| Boss tekrar sınırı | Konmadı (GDD önerisi). |
| Legendary yemler zorunlu mu | Hayır; yalnız bonus. |

## Karakterler
- **Kaya Usta** (Denizin Defteri) ve **Kropi Usta** (Tekne Atölyesi): önceki sürümden yardımcı roller; GDD'de tam kilitli değil.
- Fabrika ve Market çalışanlarına isim uydurulmadı (GDD §18.6): "Fabrika Görevlisi", "Market Kasiyeri".
- **Masalcı** bu sürümde yok (yalnız önceki tasarım bağlamında geçiyordu; ana mekânları değiştirmemek için eklenmedi).
- Tüm diyaloglar ve 88 balık açıklaması bu sürüm için yazıldı.

## Kasaba ana görünümü (kullanıcı görseli)
- Kasaba artık kullanıcının verdiği illüstrasyonla çizilir (`assets/town_main.webp`, 2000×1103). Dokunma alanları görselin piksel koordinatlarında tanımlıdır (`src/scenes/Town.js` → `AREA`); geniş ekranda yükseklik en fazla %12 kırpılır, yanlar kenar uzatmasıyla dolar; dar ekranda alt kısım deniz uzatmasıyla dolar. Görsel yüklenemezse eski prosedürel kasaba çizilir.
- Kullanıcının belirttiği yerleşim: Evim, Market, Restoran (şimdilik kapalı; dokununca bilgi penceresi), Hurdacı, Belediye; sahilde Komplo Teorisyeni'nin evi ve Rüstem Aga. Evin solu → Diğer Sokak (şimdilik eski Yeni Sokak: Zıpırleone, Fabrika, Tekne Atölyesi; kullanıcı yeniden tanımlayacak).
- Benim seçtiğim yerleştirmeler (kullanıcı değiştirebilir): **İlan panosu** evin içinde, kapının yanında (GDD "evin yanı"); **Denizin Defteri / Kaya Usta** ve **Tersane İzni** Belediye'de (izin Tekne Atölyesi'nden de alınabilir); **Müfettiş Tarçov** hikâye boyunca Belediye önünde durur; **Martı** iskele yanındaki kayığa konar. Görselde oyuncunun teknesi ayrıca çizilmez (GDD'deki "halatla bağlı sallanan tekne" yerine görseldeki kayık/iskele); tekne seviyesi görünümü Tekne Atölyesi'nde ve balık sahnesinde görünür.
- Komplo 2. bölüm inceleme noktaları görsele uyarlandı: Komplo'nun çatısındaki eğri anten, Belediye'nin durmuş saati, Belediye'nin arkası olmayan yan cephesi (kayıt uyumu için iç kimlikler aynı).

## Liman Sokağı, harita ve karakter görselleri (kullanıcı)
- **Liman Sokağı** (`assets/street_main.webp`): fabrika binaları → Geri Dönüşüm Fabrikası; **Café → Zıpırleone'nin Mekanı** (görselde tabelası "Café"; "tamamen yasal kafe" olarak yorumlandı — kullanıcı farklı isterse değiştirilir); tekne hangarı → Tekne Atölyesi; ara sokak → kasabaya dönüş; iskele/tekneler → harita. T1 "şüpheli sandıklar" iskeledeki sandık yığınına taşındı.
- **Harita** (`assets/world_map.webp`): bölge alanları görseldeki biyomlara göre eşlendi (Eski Liman sol alt liman, Yakamoz sol üst gece koyu, Titrek Buzullar üst orta, Batık Korsan sağ üst batıklar, Kaynar Kazan sağ volkanlar, Tembel Sazlıklar sağ alt bataklık, Paslı Sanayi alt orta paslı borular, Bermuda ortadaki girdap). Bermuda'nın merkezde olması yalnız görsel yerleşimdir; açılış sırası değişmedi.
- **Karakterler** (`assets/chars/*.webp`; orijinal 2816×1536 PNG'ler figüre kırpılıp şeffaf WebP'ye çevrildi, ~13 MB → ~600 KB): Ahmet = Market sahibi (önceki "Market Kasiyeri"), Başkan = Belediye Başkanı (Tersane İzni ve duyurular; Kaya Usta arşivde yanında), Geri Dönüşümcü = fabrika görevlisi, **Tekir = Don Zıpırleone'nin sağ kolu** (yeni yan karakter; görev vermez, Liman Sokağı'nda ve mekânda konuşulur). Başkan ve Tekir için diyaloglar bu sürümde yazıldı.
- Görseli olmayanlar (Tarçov, Komplo Teorisyeni, Martı, oyuncu) prosedürel çizimle kalır.

## İç mekân arka planları (kullanıcı)
- `assets/bg/*.webp` (2816 px PNG'ler 1920 px WebP'ye çevrildi, toplam ~1,9 MB): Ev, Belediye (müze), Rüstem Aga, Market, Hurdacı, Fabrika, Tekne Atölyesi, Karanlık Mahalle (Zıpırleone), Teorisyen. `TekneAtölye.png` iki zip'te de vardı (aynı dosya).
- **KayaUsta.png ve Marketnew.png aynı görsel** (yalnız köşedeki küçük işaret farklı). Olta raflı dükkân olduğu için Market'te kullanıldı; Kaya Usta Belediye'deki deniz müzesinde (Denizin Defteri arşivi) kalır. Kaya Usta için ayrı bir mekân görseli gelirse ona taşınır.
- Kullanıcının istediği değişiklikler: Zıpırleone'nin Mekanı = Liman Sokağı'nın ortasındaki **Karanlık Mahalle**; kasabaya dönüş sokağın **en sağından**; **Café kapalı** (restoran gibi, ileride açılacak); **Liman Sokağı iskelesinden balığa çıkılmaz**.
- Benim kararlarım: Tarçov'un T1 "şüpheli sandıklar" ipucu Karanlık Mahalle'deki sandığa taşındı; evdeki panoya ve müzedeki akvaryuma dokunulabilir; Rüstem tezgâhın arkasında (tezgâh önü karakterin üzerine yeniden çizilir). Komplo Teorisyeni, Tarçov, Martı ve oyuncu için çizim gelmediğinden prosedürel çizimler kullanılmaya devam ediyor.

## Balıkçılık bölgesi arka planları ve su altı panelleri (kullanıcı)
- Arka planlar (`assets/regions/<KOD>.webp`, 2752×1536 PNG → 1920×1072 WebP) ve çerçeveli su altı panelleri (`assets/panels/<KOD>.webp`, 2240×1888 RGBA → şeffaf kenarı kırpılıp 1100 px genişlik). Dosya adı eşlemesi: EskiLiman/Liman = EL, TembelSazliklar/Sazl = TS, PasliSanayiKanali/Pas = PSK, YakamozKoyu/Yakamoz = YK, TitrekBuzullar/Buzul = TB, BatıkKorsanMezarlığı/Korsan = BKM, KaynarKazanDeltası/Kaynar = KKD, Bermuda = BG.
- Benim kararlarım: tekne her görselde sol taraftaki ön plan suyuna oturtuldu (`RegionArt.BG_INFO.boat`, görsel yüksekliğine oran); panel görselinin çerçevesi sahnede sağda ~860×718 alanda çizilir, oyun alanı (siluetler, kanca, balık, çek bölgesi, kaçış çizgisi) çerçevenin iç penceresidir (`RegionArt.PANEL_INSET`, görsel başına ölçüldü). Görselin üzerine yalnız hafif su yansıması ve kabarcık animasyonu eklenir. Harita kartı seçili bölgenin önizlemesini (arka plan + panel; kilitliyse karartılmış) gösterir.
- Görsel yüklenemezse eski prosedürel bölge çizimi (`RegionArt.backdrop` / `RegionArt.under`) kullanılır.

## Bölge kayıkları ve görsel HUD (kullanıcı)
- Kayıklar (`assets/boats/<KOD>.webp`; 2752×1536 PNG → kırpılıp 720 px): Liman = EL, Sazlık = TS, Sanayi = PSK, Yakamoz = YK, Buzul = TB, Korsan = BKM, Kaynar = KKD, Bermuda = BG. Kullanıcı isteği: kayıkta karakter görünmez, yalnız olta kayıktan atılır.
- Benim kararlarım: kayıklar **yatay aynalandı** (olta ucu sağdaki su altı paneline/misinaya baksın diye; burun solda). Görsellerdeki boyalı oltanın gunwale üstü kısmı ve sarkan boyalı misina silindi, çünkü oyunda misina oltanın ucundan atılır; olta tüm kayıklarda aynı yerden (ahşap tutucu) **çizilerek** eklenir ve gerilimle bükülür. Liman kayığında olta yoktu, aynı çizim olta ona da eklendi. Oyuncu şapkası/boya kozmetikleri bu kayıklarda görünmez; bayrak kıç direğine çizilir. Tekne seviyesinin (BoatDB) görseli Tekne Atölyesi'nde kalır; balıkçılık kayığı bölgeye göredir (oynanış değerleri değişmedi).
- HUD (`assets/hud/`): bar + Miyav / Hurda / Coin / Çanta. Sıra kullanıcının verdiği sırayla soldan sağa. Değerler ikonların alt plakasına yazılır; plakaya sığması için 10.000 üstü kısaltılır. Çanta = Envanter (metin "Envanter" düğmesi kaldırıldı); balıkçılıkta yalnız hazır durumdayken açılır. Tekne Sv. ve Ambar küçük etiketler olarak barın yanında kalır. Sol üstte açılan paneller (harita kartı, sol taraf iç mekân panelleri) barın altından başlar.

## Görseller
Kasaba, Liman Sokağı, harita, karakterler, iç mekânlar ve bölgeler kullanıcı görselidir. Balıklar, eşyalar, tekne, Tarçov/Komplo Teorisyeni/Martı/oyuncu ve efektler **prosedürel Canvas çizimidir**. Yerleşimler GDD'deki öğelere sadık kompozisyonlardır; piksel koordinatları kaynakta kilitli değildir. Sesler WebAudio ile üretilir.
