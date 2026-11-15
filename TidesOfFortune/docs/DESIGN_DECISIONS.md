# Tasarım Kararları (GDD açık soruları ve HTML5 uyarlaması)

GDD'de kesinleşmiş değerler değiştirilmedi. Belirsiz alanlarda alınan kararlar aşağıdadır; sayısal olanların hepsi `src/config/balance.js` içinde `KARAR` yorumuyla işaretlidir.

## Prompt'ta belirtilen varsayılanlar (uygulandı)

| Konu | Karar |
|---|---|
| Dünya keşfi | Run 6–10 liman; 45 limanın tamamı run'lar boyunca keşfedilir, Codex takip eder. |
| Kilitli limanlar | Gizemli Ada ve Buzul tipleri `UPG_MYSTERY_MAPS` / `UPG_ICE_ROUTES` ile açılır; kilitliler rota havuzundan çıkarılır. Rota üretici komşu bölgelere taşarak her zaman geçerli 6–10 limanlık rota + Büyük Liman finali üretir. |
| Hull kategorileri | Maksimum hull'un yüzdesi (%76/51/26/1). |
| Eksik itemler | Buz Kıran Pruva 190 (Kutup Buzulları'nda güvenli geçiş, buz hasarı −%50), Isı Kalkanı 180 (Volkanik Patlama'da az hasar, yangın/volkan hasarı −%25), Hırsızlık Aleti 120 (Korsanın Teklifi'nde sandığı açar; Yüzen Sandık'ta ek ganimet). Codex/item detayında "geçici tasarım kararı" notu gösterilir. |
| EVT_CREW_01–05 | Kazazede, Yüzen Meyhane, Fener Adası (Tobias), Kaçak Askerler, Ada Kabilesinin Sınavı. |
| Veri biçimi | JavaScript veri modülleri; mantık veriden ayrı. |
| Aktif run kaydı | Her karar/işlem sonrası otomatik kayıt; menüde "Devam Et". |
| Eski Dostlar | İlk özel eventte ikisi de reddedilirse aynı run'da ikinci karşılaşma yok (yalnızca bir karelik gri gölge). Biri alınırsa diğerinin karşılaşması 2–4 liman sonra, run bitmeden (gerekirse son rotaya kaydırılarak) garanti edilir. |
| Başlangıç itemleri | İlk limanda 3 ücretsiz seçim (`BALANCE.start.freeStarterItems`). |

## Ek kararlar

| Konu | Karar | Alternatif / not |
|---|---|---|
| Gemi yükseltme fiyatları | 2: 180 · 3: 420 · 4: 800 · 5: 1350 | Simülasyonla ayarlandı; bkz. TEST_REPORT. Yükseltmede eksik HP korunur, yeni kapasite eklenir. Yalnız tam tersaneli limanlarda. |
| Bölgeye göre hasar ölçeği | Event hasarı × {0.9, 1.2, 1.6, 2.2, 2.8} | Gemi hull'u 100→450 büyüdüğü için sabit HP hasarları geç oyunda anlamsızlaşırdı. Sabit fiyatlı rüşvetler ölçeklenmez. |
| Bölgeye göre event altını | `goldR` ödülleri × {1.1 … 2.4}; GDD'de açık rakam verilen ödüller (500 altın vb.) ölçeklenmez. | |
| Tamir eventi ağırlığı | Normalde 3; Kritik/Batmak Üzere iken +15 (GDD), tehlike −10 (GDD). | GDD tabloda tamir kategorisi vermiyor. |
| Aynı limanda al-sat | Bu ziyarette alınan mal yalnızca alış fiyatına iade edilir. | GDD fiyatları (alış < satış) sınırsız kâr döngüsü yaratırdı. |
| Fiyat çarpanı | Liman çarpanı alışa ve satışa birlikte uygulanır (arbitraj limanlar arasında oluşur) + seed ile ±%5 çarpan ve ±%15 fiyat sapması + liman tipi eğilimi (ticaret şehri pahalı/kârlı, balıkçı/sis ucuz). | |
| Pazar stoğu | Mal başına 2–6 (temel +2, nadir −1); "Hasarlı liman" stoğu yarıya indirir. | GDD "ticaret kapasitesi %50" için stok kavramı gerekti. |
| Bozulma | Rota sonunda birim başına GDD riski × mesafe (kısa 0.6, orta 1, uzun 1.4). | |
| Kaçak mal | Askerî limanda satılamaz ve pazarda bulunmaz; Askerî Denetim'de müsadere (Bölme ve Reza her biri şansı yarıya indirir). | |
| Kritik/Batmak Üzere kargo cezası | Kapasite düşer; fazla kargo kaybolmaz ama yeni alım yapılamaz. | Alternatif: fazlalık denize atılır. |
| Item slotları | Gemi slotu + Geniş Cephanelik + İkinci Cephanelik (en fazla 7). | GDD "4./5. slot başlangıçta açık"; toplamalı yorum seçildi. |
| Item değiştirme ücreti | 30 altın (Ucuz Takas ile 15). Başlangıç seçimlerinde ücretsiz. | GDD ücret tanımlamıyor ama Ucuz Takas'tan anlaşılıyor. |
| Aktif itemler | Kullanınca harcanmaz (Top, Kara Bayrak, Balık Ağı); yalnızca tek kullanımlıklar tükenir. | GDD etki tablosunda "aktif item harcanır" ifadesi var; 150+ altınlık Topun tek savaşta gitmesi cezalandırıcı bulundu. Seçenek bazında `consume` ile değiştirilebilir. |
| Onarım Takımı | Eventlerdeki seçeneğe ek olarak item barından istendiği an kullanılabilir (+30 HP). | "Item ile tamir" gereksinimi. |
| Antik Harita | Limana varışta otomatik harcanır → o limanda nadir item garantisi. Bazı eventlerde ayrıca seçenek olarak harcanabilir. | |
| Kesin/şans çarpışması | Seçeneğe özel bonus (ör. Korsan Baskını'nda Hafif Yelken +30) genel pasifin (+40) yerine geçer — "en spesifik kural" ilkesi. | |
| Tayfa bonusları | Genel pasifler etiket sistemiyle (escape/combat/negotiate/navigate…) uygulanır: Bjorn korsan +25 / diğer savaş +15, Diego korsan müzakere +30, Tobias sis/gece +20, Old Finn sis/kaya başarısızlık −%35, Oksana savaş +10 ve hasar −%20, Lena topla savaş +10, Yara korsan savaşı +15, Kenji saldırıda ilk 15 HP. Pita ×1.10 (Tarçın ile ×1.15), bisküvi ×1.08. | "Hasar +30" gibi değerler şans bonusuna çevrildi; savaşlar şansla çözülür. |
| Kalani / Magda | Ada-keşif eventlerinde (Kalani) ve Deniz Tanrısı eventlerinde (Magda) şans %100. Magda ayrıca gizem başarısızlıklarında olumsuz etkileri ×0.7 yapar. | |
| "Bir olay kaybedilir / geçer / gecikir" | Kuyruğa +1 event eklenir (zaman kaybı). "Bir olay atlanır" sıradaki normal eventi siler. | |
| Başka limana yönlen | Hedef aynı bölgeden kullanılmamış bir limanla değişir, kalan normal eventler silinip 1 dolambaç eventi eklenir, bekleyen liman statüleri sıfırlanır. Final limanında yalnızca +1 event. | |
| Liman statüleri | Kaçak (alış/item/tamir +%20), fiyat cezası (satış −%20), kahraman (alış −%20), fiyat avantajı (satış +%15, Tarık'ın karşı hamlesi), hasarlı liman (stok %50), korsan itibarı (korsan yuvalarında satış +%10, kalıcı). | |
| Aziz Mehmed | Askerî liman ve ticaret şehrine giden rotalarda tehlike ve felaket ağırlığı 0. | |
| Selene | Rakip Tüccar ve Ticaret Savaşı havuza girmez; ticaret panelinde sonraki limanın fiyatları görünür. | |
| Tarçın'ın Erken Uyarısı | Tehlike eventine "Tarçın'ın Uyarısı" seçeneği eklenir (%70; bisküvi/kasa ile artar). Yaklaşan tehlike HUD'da ve güvertede havlamayla gösterilir; Eski Dostlar ile 2 event önceden. | |
| Diğer hayvan seçenekleri | Kaptan Kırmızı: ticaret eventlerinde "Papağan Fısıltısı"; Gece Yarısı: gizemde "Gece Yarısı'na Sor"; Hamid: ticaret eventlerinde pazarlık. | |
| Zıpır & Tarçın satın alma | Limanlarda satılmazlar; yalnızca özel eventlerle gelirler (GDD'deki 80/100 altın fiyatı Codex'te bilgi olarak durur). | Hikâye akışını korumak için. |
| İlk özel event | Rotanın ilk 3 limanından birine **varışta** (rıhtım sahnesi) oynatılır; ikinci karşılaşmalar yolculuk eventidir. | |
| Rota başına zincir | Tek rotada en fazla bir yeni zincir başlar. | Aynı rotada iki zincir aşırı yoğun bulundu. |
| Run'ı terk etme | Ayarlar/yeni run onayıyla; XP aktarılır, "batış" veya "tamamlama" sayılmaz. | |
| Ek başarımlar | Eski Dostlar dışında 14 başarım eklendi (ilk yolculuk, galeon, zincir ustası, hazine, hayalet kaptan, prenses vb.). | |
| Kayıt | localStorage (anahtar başına yedekli `.bak`), sürüm numaralı (v3), dışa/içe aktarma metni `TOF1:` + base64. | IndexedDB yerine: veri küçük ve senkron yazım tek eylemli atomikliği basitleştirir. |
| Görsel ölçek | Dünya 1/3 çözünürlükte (≈427×240) çizilip nearest-neighbor ile büyütülür; yazılar DOM'da pixel font ile. | |

## Top-down yolculuk reworkü kararları

| Konu | Karar | Gerekçe |
|---|---|---|
| Görsel ölçek | `pixelScale` 3 → 2 (640×360 tampon). Karakter karesi 22 px, 1 px kontur. | Telefonda karakterlerin ayırt edilebilmesi için (önceki ~9 CSS px çok küçüktü). |
| Gemi boyutu | Gövde boyu 156–216, genişliği 64–112 mantıksal px; gemi ekran yüksekliğinin ~%50'sini kaplar. | Brief: %45–60. |
| Rota | Run başında yalnızca uzunluk (gizli) belirlenir; her limanda 2–3 deniz yolu seed'den üretilir. Seçilen yol hedefi belirler, tekrar yok, bölge ilerlemesi korunur, son ayakta tüm yollar Büyük Liman'a çıkar. | Roguelite belirsizlik; determinism korunur (aynı seed + aynı seçimler = aynı oyun). |
| Yol tipleri | Kıyı, Ticaret, Açık Deniz, Vahşi Sular, Kaçakçı. Tehlike seviyesi event kategori ağırlığına `dangerWeightPerLevel = 4` ekler. | |
| İpucu doğruluğu | Temel tip %60, söylenti %65. Compass Rose / Old Finn / Liman Gözü upgrade → tip %100; Tobias %80; Gece Yarısı %85; Tarık/Selene → ticaret %100; Hamid/Mei Lin %85; Kırmızı %80. Yanıltıcı ipuçları yalnızca yakın bölgede mümkün olan tiplerden seçilir. | Tayfa bilgisinin değerli olması; saçma ipuçlarının (1. bölgede buz) önlenmesi. |
| Bölgesel talep | Her (seed, bölge, mal) için 0,82–1,25 çarpanı (`trade.regionDemandRange`), mevcut fiyat formülüne eklendi. | Ticaret söylentilerinin ve rota seçiminin anlamlı olması; mevcut değerler korunur. |
| Yolculuk süresi | `voyage.duration` ayarları (yukarıda); ilk event ≥ 20 s, arası ≥ 22 s; son 30 s'de kıyı ipucu. Ortalama run ~38 dk (simülasyon). | Brief: 25–45 dk. |
| Teslim olma | Korsan Baskını (EVT_D_01) seçeneklerine "Teslim ol" eklendi: kargonun %50'si + 40 altın; Halatlar teslimiyette kargoyu korumaz. | Brief'teki teslim olma + yağma animasyonu. |
| Çift uygulama koruması | Mantık sonucu karar anında tek seferde uygulanıp kaydedilir. `EncounterDirector` görüntü katmanını (`display` altın/gövde, `cargoOverride`) animasyonla eskiden yeniye taşır. Yeniden yüklemede sonuçlu olay → OUTCOME ekranı anlık kurulur; sonuçsuz olay → karar ekranı. | Kabul kriteri 16. |
| Sahneler | 109 eventin hepsinin kendine özgü sahnesi var (`src/presentation/scenes/*.js`). Her seçenek ayrı koreografi oynatır; başarı/başarısızlık dalları farklıdır; otomatik çözümler (Tobias'ın feneri, Selene'nin tanıması, Reza + Cüce Kaptan vb.) kendi sahnesini oynar. Veri güdümlü genel sahne yalnızca yedek olarak kaldı. | Eventler oyunun imzası; her biri tek tek kurgulandı. |
| Sahne kiti | `kit.js`: `def({ setup, approach, intro, opts[i], auto, outcome, skip, from, exit })` ile sahne tanımı; ortak ritim parçaları (kaptan/tayfa konuşması, yanaşma, sandalla kıyıya çıkış, dalış, gemiye çıkan NPC, tayfa toplanması, hayvan aksiyonu, güverte nesnesi, fırlatma). Sonuç anlatısı (hasar, kargo, altın, item, tayfa) diff'ten gelir; sahne kendi anlattığını `skip` ile tekrarlatmaz. | Yeni event eklemek: tek bir `def` bloğu. |
| Yeni ilkeller | `board`/`unboard` (yabancı biri gemimize çıkar, yürür, iner), `gather`, `pet`, `deckProp`, `throw`, `cargoUse`, `flash`, `shipTo`, `heel`, `npcState`, `set`/`opts`. Askerlerin el koyması `boardSteal` ile iskele (plank) üzerinden yürüyerek yapılır. | Korsan yağması dışındaki el koyma ve teslimatlar da görünür olsun diye. |
| Yeni çizimler | 40+ yeni nesne (gökkuşağı, aurora, yıldız/takımyıldız, ay yansıması, batık şehir, ağ, enkaz alanı, yüzen meyhane, seyyar tüccar teknesi, volkan, lav, tsunami, buz tarlası, mağara, hazine adası, tapınak, fener ışığı, balina, yunus, kum sandalı, güverte nesneleri…), 19 yeni NPC görünümü (asker, subay, gümrük memuru, tüccar, pelerinli yabancı, yaşlı denizci, şef, hasta, fener bekçisi, prenses, ödül avcısı, lonca temsilcisi, kartograf, kaçakçı, kazazede…) ve 12 yeni ses (çan, gök gürültüsü, sihir, papağan, boru, gıcırtı, kükreme, ıslık, tezahürat, zar, davul, martı). | |
| Rıhtım eventleri | Limana varışta oynayan zincir adımları (korsan, kaçakçı, savaş, lonca, madalyon) artık kurulum + giriş animasyonuyla açılır; figürler iskelede durur, tayfa sandıkları iskeleye taşır. Durum karar anına kadar değişmediği için yeniden yüklemede giriş tekrar oynar, sonuç tekrarlanmaz. | |
| Sahne güvenliği | Yönetmen sahne değişince (`enterVoyage`/`enterHarbor`/menü) bekleyen adımları ve geri çağrıları iptal eder; yarım kalan bir animasyon yeni run'ın durumuna dokunamaz. | Sahne denetleyicinin bulduğu bir yarış durumu. |
| Kayıt sürümü | `SAVE_VERSION = 4` (rota planı, deniz yolları, `voyage.elapsed`). Eski kayıtlar güvenle yeni run'a yönlendirilir. | |
