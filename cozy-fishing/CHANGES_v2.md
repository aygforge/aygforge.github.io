# Cozy Fishing v2.0 — Değişiklik Özeti

Çıktı: `cozyfishing_v2.html` (tek dosya, çevrimdışı, harici kaynak yok). v1 dosyası (`index.html`) değiştirilmedi.
Kayıt şeması 2 → 3. Eski kayıtlar kayıpsız açılır; göçten önce ham kayıt `cozyfishing_premigrate_v2` adıyla yedeklenir.

## Korunanlar
70 tür, 21 nokta, 7 bölge, 4 tekne, 13 NPC, şenlikler/yarışmalar, mevcut 40 başarım, mini oyun, kontroller, kayıt/dışa-içe aktarma.
Tekne ve balık fiyatları, günlük 100 enerji, günlük 6 otomatik av sınırı ve festival ödülleri değiştirilmedi.

## Yeni özellikler
- **Balıkçı Defteri** (5 sekme): Tür Rehberi (yakalanmayan türler gizli), Bugünkü Av (gerçek seçim formülü: FishDB ağırlığı × yem × mevsim × hava × mesafe × olay, olta gücü filtresi; garanti verilmez), Av Kayıtları (1/5/12 avda kademeli ayrıntı), Eksik Türler (bölge X/10, silüetler, ustalık rozetleri), Favoriler (satış favorilerinden ayrı, “Sefer Planına Ekle”).
- **Sefer Planı**: en fazla 3 hedef, 1–99 adet; yalnızca hedeften sonraki gerçek manuel/otomatik avlar sayılır, hedefte durur, azalmaz. Yeni günde koru/sıfırla seçeneği. İskele/teknede sağ üstte küçük takip kutusu. İlan panosundan miktar seçerek hedef ekleme. Sefer Planı Panosu kasabada iskele girişinde.
- **Bölge Ustalığı** (21 kademe): Bronz rozet (3 nokta), Gümüş poster dekoru (6 tür), Altın tekne süsü (10 tür; Tekne Atölyesi → Görünüm). Yalnızca görsel, eski kayıttan tanınır, iki kez verilmez.
- **Mücadele geri bildirimi**: tür karakterine göre görsel/ses ipuçları (dart, zikzak, dalış, ağır çekiş, zıplama uyarısı, mükemmel tasma, doğru yön kıvılcımı). Tür yakalanana kadar gizli (havadaki balık da silüet).
- **NPC rutinleri**: gün/şenlik/havaya göre deterministik; dükkânlar sahibinin yerinden bağımsız hep açık.
- **Yeni diyaloglar**: ilk tekne, yeni deniz, büyük rekor, şenlik zaferi, akvaryum alımı/koleksiyonu, dört tekne, 70 tür; şenlik günü konuşmaları.
- **Rakip kariyerleri** (Ali, Mert, Elif, Efe, Selçuk): kişilik, uzmanlık, yarışma/şampiyonluk/podyum/en iyi sıra/geçmiş. Her yarışma bir kez kaydedilir. Eski kayıtlarda “Eski yarışma kaydı bulunmuyor”.
- **Kişisel Av Rekorları**: ilk 10 (tür, cm, kg, bölge, nokta, gün, olta, manuel/oto); 5'i evdeki Rekor Duvarı'nda. Satıştan sonra silinmez. Eski kayıtlarda yalnızca ansiklopedideki ağırlık rekoru “eski kayıt” olarak gösterilir; boy ayrı rekor olduğundan birleştirilmez, bilinmeyen alanlar “Bilinmiyor”.
- **Şenlik atmosferi**: mevsime özel meydan süsleri, şenlik konuşmaları, meydanda SONUÇ panosu ve önceki yarışmalar, şampiyonluk kutlaması (konfeti + havai fişek).
- **Ticaret · Akıllı Satış**: hal / ilan / çay bahçesi karşılaştırması, miktar ve limitlere göre dağılım; favoriler ve akvaryum balıkları hariç; yalnızca onayla ve kasabada satış.
- **Olta setleri** (3 adlandırılabilir set): sahip olunmayan ekipman kuşanılmaz, ücretli yem yoksa temel yem + uyarı, mücadelede değiştirilemez.
- **Oto yem politikası** (cihaz başına): Ekonomik / Sabit / Hedef balık / Yedek yemli. Mevcut kurallar korunur (temel yem kullanılmaz, yem yoksa cihaz bekler, 6 sınırı).
- **Mali Günlük**: son 30 gün; manuel/oto av, hal, ilan, çay bahçesi, ödül, yem, yakıt, ekipman, diğer; 7/30 gün grafik. Eski günler uydurulmaz.
- **Akvaryum**: Küçük 550 (3 balık/2 tür), Orta 2.200 (7/4), Büyük 8.500 (12/6); Kerem → “Akvaryumlar” sekmesi. Evde etkileşim noktaları, canlı panel (ekle/çıkar/taşı, dekor, arka plan). Kaynak: çanta, sandık, aktif tekne. Dekor: Kumlu Dip (ücretsiz), Yeşil Bitkiler 150, Kayalık 300, Mercan 500. 20 uygun tür; koleksiyon 5 → rozet, 10 → okyanus arka planı, 20 → “Deniz Koleksiyoncusu” unvanı (3 yeni başarım; toplam dinamik sayılır).
- **Menü**: Envanter, Balıkçı Defteri, Sefer Planı, Ticaret, Tekneler, Başarımlar, Mali Günlük, Kasabalılar, Ayarlar + “Diğer” (Ansiklopedi, İstatistikler, İlanlar, Kupalar, Rekorlar, Yardım, Fotoğraf). Uzaktan Tekneler paneli yalnız görüntüleme; satın alma kasabada.
- **Fotoğraf modu** (kasaba, iskele, ev, deniz): arayüz gizlenir, oyun durur, sınırlı kaydırma, 1×/2×, gün/bölge etiketi, PNG kaydet (indirme engellenirse görüntü penceresi). Mücadelede açılmaz, oyun durumunu değiştirmez.

## Düzeltmeler
- Başarım toplamı sabit sayı yerine dinamik (`ACHS.length`).
- Çay bahçesi satışı artık hal gelirine karışmıyor (ayrı `teaSales` / günlük `teaIncome`); festival ödülü günlük `prizeIncome` olarak ayrı.
- Kapı seçimi en yakın kapıya göre; NPC'ler dükkân kapılarını engellemez.

## Testler (gerçekten çalıştırıldı)
- Yerleşik QA paketi: **67/67** (eski 47 + yeni 20), aynı sayfada 40 kez tekrarlandı, hata yok.
- Playwright arayüz akışı 960×540, 844×390, 740×360: tüm yeni paneller, düğmeler, satın alma, akvaryum ekle/çıkar/taşı, set kaydet/kuşan, politika seçimi, akıllı satış onayı, fotoğraf PNG indirme, kaydet → yeniden yükle. Konsol hatası yok, yatay taşma yok.
- Gerçek göç: v1 (`index.html`, şema 2) ile oluşturulan kayıt v2'de açıldı; para, balıklar, tekne, kupa, başarımlar korundu, göç öncesi yedek oluştu.
- Eski arayüz/kalıcılık betikleri (8 adet) v2 üzerinde hatasız. Ekonomi simülasyonu v1 ile benzer ilerleme (ilk tekne ~14–15. gün).

## Test edilemeyenler
- Sesler (başsız tarayıcıda yalnızca hatasız çalıştığı doğrulandı, kulakla dinlenmedi).
- Gerçek iOS/Android cihazlar (yalnızca masaüstü Chromium'da dokunmatik emülasyonu ve mobil boyutlar).
- Gerçek mobil tarayıcıda PNG indirme davranışı (yedek görüntü penceresi kodda var, cihazda denenmedi).
