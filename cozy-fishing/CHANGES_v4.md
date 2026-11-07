# Cozy Fishing v4.0 — The Cozy Adventure Update · Değişiklik Özeti

Çıktı: `cozyfishing_v4.html` (tek dosya, çevrimdışı, harici kaynak yok). `index.html`, `cozyfishing_v2.html`, `cozyfishing_v3.html` değiştirilmedi.
Kayıt şeması 4 → 5. Eski (şema 1–4) kayıtlar açılır; göçten önce ham kayıt `cozyfishing_premigrate_v<eski şema>` olarak yedeklenir.

## Korunanlar (kontrol özeti)
70 tür ve FishDB, 7 bölge, 21 nokta, 4 tekne (2.200 / 8.000 / 25.000 / 70.000) ve yükseltmeler, tüm ekipman ve yem fiyatları, balık taban fiyatları,
başlangıç parası 100, günlük 100 enerji, 3 av yöntemi, sabah/gündüz/akşamüstü, çok duraklı sefer, hızlı tekrar, Balıkçı Defteri, Sefer Planı,
Bölge Ustalığı, ansiklopedi ve rekorlar, depolar ve 10'lu yığın, hal/ilan/çay bahçesi, akıllı satış, Mali Günlük, ev ve kıyafet, akvaryumlar,
kasaba projeleri, 24 deniz canlısı, NPC rutinleri, misafir gezileri, filo (8 NPC, 2–4 balık), festivaller ve 8 atış kuralı, rakipler,
başarımlar, sefer raporları, fotoğraf modu, kayıt dışa/içe aktarma, IndexedDB + localStorage, sesler, mobil yatay ve tam ekran.
Günlük 6 otomatik av sınırı ve filo sınırları değişmedi. Yeni para birimi, mikro ödeme veya reklam yok.

## Yeni özellikler
- **Akıcı Av** (varsayılan) / **Klasik Av** (Ayarlar): bekleme 1,5–3,5 sn / 2–6 sn. Enerji, yem, tür olasılığı (aynı rastgele sayı sırası), boy dağılımı, tasma penceresi ve fiyatlar iki modda aynı; değişiklik sonraki atıştan geçerli.
- **Güce göre mücadele**: güç 1 başarılı tasmadan sonra otomatik kısa çekiş (~0,9 sn, ek dokunuş yok); güç 2 kısa mücadele (~3 sn, en çok bir yön değişimi/bir sıçrama); güç 3 mevcut tam mücadele; güç 4 uyarılı en çok 2 özel hamle (kaçış/yana kaçış/kaldırma/sıçrama); güç 5 üç aşama (İlk Direnç → Karşı Hamle → Son Çekiş). Özel hamle hatası ilerleme kaybettirir, tek hatada koparmaz. Ekipman etkileri sürüyor.
- **Kompakt sonuç**: Akıcı Av'da normal avlar için ~1 sn'lik küçük gösterge (görsel, ad, boy/ağırlık, taban fiyat, depo, Tekrar At, İncele). Yeni tür, kişisel rekor, olağanüstü boy, trofe ve dolu depo kararında büyük kart korunur. Sonuç artık setTimeout ile değil oyun zamanıyla açılır; yeni atış veya sahne değişimi bekleyen sonucu iptal eder.
- **Dip Oltası**: sahte titreşim (atışta en çok 1; ilk 3 günde %12, sonra %35) ve derin bükülen gerçek vuruş (ses + titreşim + metin). Sahte titreşimde tasma normal başarısız tasma sayılır, ek ceza yok.
- **Spin**: yemi takip eden balık gölgesi; yalnızca rastgele sonuç ilgiyi gösteriyorsa görünür, ısırmazsa uzaklaşır (RNG ile çelişmez). Ritim kuralları ve 3 hareket sınırı aynen.
- **Özel av fırsatları** (Balık Sürüsü, Büyük Balık İzleri, Dip Hareketliliği, Avcı Balık Takibi): 2. manuel atıştan sonra her atışta %12, sefer/iskele gününde en çok 2, aynı anda 1, 2 atış geçerli. Sürü/dip ×1,30 göreli (yalnız noktadaki gerçek türler, yeniden normalize), büyük balık 80/16/4 boy dağılımı (yalnız şartlı atışta, FishDB sınırı içinde), avcı takibinde spin vurmasına ×1,08. Olay, gün, sefer, bölge, nokta, mesafe, kalan hak kaydedilir; yeniden yükleme değiştiremez. Otomatik olta, filo ve yarışmada yok. Sahnede piksel animasyonlarla görünür.
- **Yedi bölgesel trofe** (Zargana, Levrek, Sinarit, Akya, Halibut, Barrakuda, Yelken Balığı): yeni tür değil, mevcut türlerin özel davranışlı büyük örnekleri. Tür keşfedilince hedeflenebilir (Balıkçı Defteri → Trofe Avları); doğru bölge ve nokta + yeterli olta ile ortalama ~4,5 atışta bir trofe izi. Boy FishDB sınırında, satış normal taban fiyatla. İlk yakalamada bir kez ödül (Zargana Trofesi, Levrek bayrağı, Kayalık olta süsü, Akıntı gövde boyası, Kuzey balık tablosu, Tropik flama, Yelken Altın Kupası); yedisi “Yedi Denizin Ustası” unvanı. Yalnızca manuel avda.
- **Balıkçı Birliği** (3. günden; kasabadaki Birlik panosu): 24 şablon (A av becerisi, B deniz keşfi, C kasaba ve ticaret, D koleksiyon ve yönetim). Her hafta (gün 1–7, 8–14…) 3 görev: av / keşif-ustalık / kasaba-koleksiyon; en az biri balık tutmadan. Erişilemeyen sistemlerin görevi seçilmez, önceki hafta tekrarlanmaz, haftada 1 ücretsiz değiştirme, olay tabanlı ilerleme, tek ödül. Haftalık 3 görevin toplam ödülü: başlangıç 54, orta 138, ileri 315 (para + yem). Mali Günlük'te ayrı gelir.
- **Kasaba Hikâyeleri** (5 NPC × 3 aşama): Efe'nin Eski Av Defteri, Mert'in İlk Açık Deniz Yolculuğu (misafir sistemiyle), Elif'in Deniz Çizimleri, Kerem'in Deniz Koleksiyonu (önceden bulunan nesneleri sayar), Bora'nın Eski Teknesi. Süre/ceza yok, en çok 2 hikâye ekranda takip edilir, Hatıra Albümü'nde tekrar okunur; ödüller kozmetik ve bir kez.
- **Kıyı Keşfi** (iskele yanındaki Sahil Patikası, ilk avdan sonra): Kumluk Sahil (ipucu okuma, 7 nokta), Kayalık Kıyı (kabarcık/iz takibi, 6 kaya), Gelgit Havuzları (su ~7 sn'de bir çekilir, ~3 sn görünür, tekrar eder). Günde bir tamamlanmış keşif, enerji/para yok, süre yok, yanlış seçim cezasız, İpucu Göster, yarım oturum kayıtlı. 24 nesne (4 kategori, özgün çizim); ilk keşifte yeni nesne garanti, iki tekrar sonrası yeni nesne garantisi. 6/12/18/24'te rozet, kabuk sergisi, sahil posteri, unvan. Satılamaz, depoyu doldurmaz.
- **Dürbünle Gözlem** (ilk tekneyle): seferde bir kez, 5 enerji, ◀ ▶ veya dokunarak tara, işareti ortaya al (1,2 sn odak), 40 sn. Yalnız bölgenin gerçek canlıları, günlük 4 gözlem sınırına dahil, başarı garanti değil, hareket halinde başlamaz, kayıt yükleyerek tekrarlanamaz.
- **Açılış sırası ve tanıtımlar**: aynı gün yalnızca en önemli tanıtım bildirimi; diğerleri menüde “yeni” işaretiyle.
- **Mobil kontroller**: tek büyük ana düğme aşamaya göre değişir; yön düğmeleri yalnızca gerektiğinde görünür; titreşim Ayarlar'dan kapatılabilir; uyarılar metinle de verilir.

## Bulunan ve düzeltilen hatalar
- **Zıplayan balık yorgunken havada takılıyordu (v3'ten gelen hata):** dayanıklılık bittiği anda sıçrama durumu ilerlemiyor, oyuncu bırakınca balık gevşeyip kaçıyordu. Sıçrama artık her durumda mevcut kurallarla tamamlanıyor.
- **Sonuç kartı setTimeout ile açılıyordu:** yeni atış/sahne değişiminde eski kart gecikmeli açılabiliyordu. Sonuç artık oyun zamanına bağlı bir kuyrukla, yalnızca ilgili av hâlâ sonuç aşamasındayken gösteriliyor; sahne değişimi bekleyen sonucu iptal ediyor.
- **Güç 2 zikzak balıklar** ilk yön penceresinde ikinci kez yön değiştirebiliyordu; tek belirgin yön değişimi garanti edildi.
- **Test paneli** artık arayüzü test verisiyle yenilemiyor ve bildirim sızdırmıyor (v3'te teknedeyken test çalıştırınca hata görülebiliyordu). Testler sahne, av bağlamı, panel ve efekt durumlarını geri yüklüyor.
- Kayıt tablosundaki rekor kaydı geçersiz nokta kimliğine karşı sağlamlaştırıldı.

## Testler (gerçekten çalıştırıldı)
- **Yerleşik QA paketi: 148/148** (eski 93 + 55 yeni v4 testi; promptun 36. maddesindeki 1–91 numaralı testlerin hepsi kapsanıyor, test adlarında numaralar var). Aynı sayfada 16 kez tekrarlandı, hata yok. Eski iki test bilinçli güncellendi: 13a (yeni trofe ve kıyı başarımları için kurulum eklendi, sayım zaten dinamik) ve v3-25 (göç hedefi “şema 4” yerine güncel `SCHEMA`).
- **Mücadele süreleri** (ortalama ekipman, iyi oyuncu / özensiz oyuncu simülasyonu): güç 1 ≈0,9 sn (dokunuşsuz), güç 2 ≈3,1 sn, güç 3 ≈5,5 sn, güç 4 ≈11,5–12,8 sn, güç 5 ≈15,4 / 21 sn; trofeler: Zargana 6,5, Levrek 9,2, Sinarit 13,5, Akya 14,5, Halibut 15,4, Barrakuda 12,3, Yelken 18,6 sn (hepsi hedef aralıkta; başarısız dövüş yok).
- **Tarayıcıda gerçek etkileşimle (960×540, 844×390, 740×360)**: yeni oyun, art arda Akıcı Av (11–14 atışta 7–10 av; normal avların tamamı kompakt, yalnız rekor/olağanüstü büyük kart), Klasik Av'a geçiş, dip oltası sahte titreşimi, spin takibi, dört fırsat görseli, Efe hikâyesinin tamamlanması (konuşma → Dalgakıran'da inceleme → ödül), Birlik paneli ve çay bahçesiyle görev tamamlama + ödül alma, Kıyı Keşfi (yanlış seçim, iki ipucu, doğru noktalar, sonuç), kayalık ve gelgit ortamları, trofe hedefi seçimi ve gerçek mücadeleyle Levrek trofesi, dürbün etkinliği, iki tekneli filo görevi ve teslimat, menüdeki tüm düğmeler, oyun içinde QA 148/148 sonrası sahnenin sağlamlığı, kaydet → yeniden yükle. Konsol hatası ve yatay taşma yok.
- **Gerçek kayıt göçü**: `cozyfishing_v3.html` (şema 4) kaydı v4'te açıldı; para, enerji, balıklar, tekneler, akvaryum, kupa, başarımlar, plan, ilanlar, görevdeki filo teknesi ve proje bağışı korundu, `cozyfishing_premigrate_v4` yedeği oluştu; geçmiş trofe/kıyı/hikâye/görev verisi uydurulmadı.
- **Denge simülasyonları**: başlangıç (gün 1–7, iskele, bambu) atıştan güç 1 yakalamaya medyan ~4 sn, günde ~12 atış, fırsat ~1,4/gün, 7 günde 6/24 kıyı nesnesi, 2 Birlik görevi; orta (gün 14–30) trofe izi ~4,5 atışta bir, 3 haftada 14/24 nesne; ileri (gün 30–60) filo 31 günde 107 balık ve net 1.620 para (manuel gelir 185 bin yanında küçük), otomatik olta payı değişmedi. Eski ekonomi simülasyonu v3 ile aynı ilerlemeyi verdi (ilk tekne 14. gün, Açık Deniz 77. gün). 200 günlük oturumda kayıt 9,8 KB → 33 KB, paketleme 0,9 ms, kare ~1 ms.
- Eski arayüz/kalıcılık betikleri v4'te hatasız.

## Test edilemeyenler / sınırlamalar
- Sesler ve titreşim yalnızca hatasız çağrıldıkları doğrulanarak test edildi; kulakla dinlenmedi, gerçek cihazda titreşim hissedilmedi.
- Gerçek iOS/Android cihazlarda denenmedi (masaüstü Chromium'da mobil boyut + dokunmatik emülasyonu).
- Mücadele süreleri simüle edilmiş “iyi” ve “özensiz” oyuncu davranışıyla ölçüldü; gerçek insan oyuncu süreleri farklılık gösterebilir.
- Dürbün etkinliğinde canlı görünme ihtimali %70'tir (terasla ×1,1); testlerin bazı turlarında canlı çıkmadı, bu beklenen davranıştır.
