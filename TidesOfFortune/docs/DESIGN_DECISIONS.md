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
