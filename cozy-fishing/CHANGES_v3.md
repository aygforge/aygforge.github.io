# Cozy Fishing v3.0 — Değişiklik Özeti

Çıktı: `cozyfishing_v3.html` (tek dosya, çevrimdışı, harici kaynak yok). `index.html` (v1) ve `cozyfishing_v2.html` değiştirilmedi.
Kayıt şeması 3 → 4. Eski kayıtlar açılır; göçten önce ham kayıt `cozyfishing_premigrate_v3` adıyla yedeklenir.

## Korunanlar
70 tür ve FishDB, 7 bölge, 21 nokta, 4 tekne, günlük 100 enerji, tüm ekipman ve yemler, mücadele (quick/dart/zigzag/jumper/steady/diver),
Balıkçı Defteri, Sefer Planı, Bölge Ustalığı, ansiklopedi ve rekorlar, çanta/tekne/sandık ve 10'lu yığınlar, hal/ilan/çay bahçesi, akıllı satış,
olta setleri, otomatik oltalar ve yem politikaları, günlük 6 otomatik av sınırı, 13 NPC ve rutinleri, şenlikler ve yarışmalar, rakipler,
akvaryumlar, ev dekorları, başarımlar, Mali Günlük, fotoğraf modu, kayıt dışa/içe aktarma, mobil yatay düzen ve tam ekran.
Fiyatlar, enerji, otomatik av sınırı ve festival ödülleri değiştirilmedi.

## Yeni özellikler
- **Üç av yöntemi**: Şamandıra (mevcut yöntem, kontrol ve olasılıklar birebir aynı), Dip Oltası (kurşun dibe iner, kamış ucu sallanır, vuruşta belirgin bükülür + ses), Spin (yem durduğunda dokun; en çok 3 iyi hareket sayılır, sık dokunmak avantaj vermez; Metal Sahte Yem en verimli, temel yemle küçük avantaj). 70 türün hepsine uygun yöntem verisi; uygun yöntemde ×1,20–1,22, uygun olmayan yöntemde ×0,88 göreli ağırlık, yeniden normalize. Yarışmada standart şamandıra + gündüz.
- **Sabah / Gündüz / Akşamüstü**: Gerçek saat yok, enerji aynı. Seferde harita ekranında seçilir ve sefer boyunca sabittir; iskelede av ayarlarından. Sabah ve akşamüstü 21'er türe ×1,12 göreli bonus; gündüz mevcut dengeyle aynı. Ek gökyüzü paletleri, alçak güneş, su yansımaları ve ışık katmanı; mevcut arka planlar korunur.
- **Çok duraklı sefer**: Motorlu, Kabinli ve Açık Deniz teknesiyle iki ana bölge (Kıyı Kayığı tek). İkinci durak hedef bölge yakıtının %90'ı (ör. Yeşil Koy 12 + Kayalık Adalar 18 = 30). Enerji, depolar, otomatik sayaç, gün ışığı, hava korunur; üçüncü bölge engellenir; kayıttan yüklenince sefer sürer.
- **Sefer Raporu**: limana dönünce tek rapor (tekne, bölgeler, noktalar, gün ışığı, manuel/oto av, türler, enerji, yem maliyeti, yakıt, tahmini taban değer, yeni türler, rekorlar, gözlemler, misafir). Tahmini değer kasaya eklenmez. Son 10 rapor saklanır.
- **Hızlı tekrar atışı**: av sonucu kartında ve av ekranında. Önceki atış gücüyle tek atış; bekleme, tasma ve mücadele manuel; normal enerji ve yem; enerji veya depo yetersizse engellenir.
- **Kasaba Projeleri** (Muhtarlık): İskele Yenilemesi 3.500 (iskele avında %5 göreli vurma), Balık Pazarı 12.000 (+1 ilan kapasitesi), Liman Feneri 28.000 (mevcut fener yenilenir; iki bölge için deterministik yarın tahmini; akşamüstü/siste ışık huzmesi), Seyir Terası 55.000 (gözlem ihtimali ×1,1; bazı günler kasabalılar ziyaret eder). Parça parça bağış, atomik, para negatife düşmez, bir kez tamamlanır; kasaba ve iskele çizimleri yenilenir, açılış animasyonu.
- **Deniz Yaşamı** (Balıkçı Defteri → yeni sekme): 7 bölgeye dağıtılmış 24 gerçek canlı, her biri özgün piksel çizim ve animasyon (kuş sürüleri, dalış, yunus/manta sıçraması, kaplumbağa ve fok yüzeye çıkışı, orka yüzgeci, uzak balina püskürtmesi, denizanası, deniz yıldızı…). Atış ve varış bağlamına göre deterministik, günde en çok 4. 8 → rozet, 16 → ev posteri, 24 → unvan (3 yeni başarım). Envanteri veya parayı değiştirmez.
- **Misafir NPC**: Efe, Ali Dayı, Mert, Elif veya Bora ile bulundukları yerde konuşup davet et. Teknede görünür; selam, bölge anısı, hava yorumu ve av tepkisi. Ek balık, para, enerji, sipariş veya bölge sağlamaz; aynı anda bir misafir.
- **Yevmiyeli Balıkçılar ve Filo** (Tekne Atölyesi → Filo Yönetimi): 8 özgün balıkçı (Tuna, Balıkçı Selin, Ozan, Melis, Rıza, Duru, Kemal, Nil). Her gün deterministik 5 aday. Kapasite tekne − 1 (en çok 3). Aktif tekne gönderilemez, depo boş olmalı, erişim Boats.reach ile. Yalnızca oyuncunun keşfettiği türler, güç 5 asla. Görev 2–3 oyun günü, ücret peşin (yevmiye × katsayı + yakıt). 2–4 balık (%25/%55/%20 temel). Sonuç görev tohumuyla deterministik ve kalıcı. Keşif, rekor, manuel/oto sayaç, 6 sınırı ve Sefer Planı etkilenmez. Dönüşte bildirim; çanta/sandık/tekne deposuna teslim, sığmayanlar Liman Teslim Kasası'nda bekler. Tekne kalkış ve dönüş animasyonları. Mali Günlük'te Filo yevmiye ve Filo yakıtı ayrı.
- **Balıkçı Defteri tavsiyesi**: Yakalama Şansı ve Kazanç Potansiyeli modları (stoktaki yemler, yem fiyatı, yakıt payı, aktif ilan ve çay bahçesi teklifleri; garanti yok).
- **Rekorlar**: tür bazında kişisel rekor listesi (boy ve ağırlık ayrı).

## Düzeltmeler
- Test paneli artık oyun ortamına yan etki bırakmıyor: sahne, av bağlamı, kamera, panel, fotoğraf ve efekt durumları testten sonra geri yükleniyor; testler sırasında arayüz yenilenmiyor ve bildirimler gerçek ekrana sızmıyor (önceden teknedeyken test çalıştırınca “Cannot read properties of undefined” hatası oluşuyordu).
- Piksel yazı tipinde “·”, “–”, “>” ve tırnak karakterleri eklendi (önceden “?” görünüyordu).
- Panel başlığındaki sekmeler dar ekranda kapatma düğmesini aşağı itmiyor; sekme şeridi kaydırılabilir.

## Testler (gerçekten çalıştırıldı)
- Yerleşik QA paketi: **93/93** (eski 67 + yeni 26), aynı sayfada tekrarlı çalıştırıldı, hata yok.
- Playwright arayüz akışı 960×540, 844×390, 740×360: av ayarları, dip ve spin atışı, hızlı tekrar, gün ışıkları, misafir daveti, iki duraklı sefer, sefer raporu, proje bağışları ve görselleri, filo görevlendirme/dönüş/teslimat, defter sekmeleri, menü düğmeleri, kaydet → yeniden yükle; teknedeyken QA testleri çalıştırıldıktan sonra sahne sağlam. Konsol hatası yok.
- Gerçek göç: v2 (`cozyfishing_v2.html`, şema 3) ile oluşturulan kayıt v3'te açıldı.
- Eski arayüz/kalıcılık betikleri ve ekonomi simülasyonu v3 üzerinde çalıştırıldı.

## Test edilemeyenler
- Sesler (yalnızca hatasız çalıştıkları doğrulandı, kulakla dinlenmedi).
- Gerçek iOS/Android cihazlar (yalnızca masaüstü Chromium'da mobil boyut + dokunmatik emülasyonu).
- 100–200 oyun günü uzun oturum performansı yalnızca hızlandırılmış simülasyonla denendi, gerçek zamanlı uzun oyun oynanmadı.
