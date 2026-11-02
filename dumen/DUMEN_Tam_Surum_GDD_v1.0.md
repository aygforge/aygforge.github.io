# DÜMEN — TAM SÜRÜM OYUN TASARIM DOKÜMANI (GDD)

**Belge:** Full Release GDD v1.0  
**Oyun adı:** DÜMEN  
**Tür:** Mizahi balıkçılık / kasaba ilerlemesi / keşif / koleksiyon / hafif simülasyon  
**Hedef platform:** Mobil tarayıcıda yatay ekran (HTML5 / JavaScript), masaüstü tarayıcıya da uyarlanabilir  
**Geliştirme:** Sıfırdan Codex destekli vibecoding, veri odaklı JavaScript mimarisi  
**Hedef:** MVP değil, sekiz bölgesi, tüm ekonomisi, NPC görevleri ve uzun vadeli oynanışıyla TAM SÜRÜM  
**Dil:** Başlangıçta Türkçe; içerik verileri yerelleştirmeye uygun  
**Ton:** Sıcak, absürt, mizahi; gizemli ama karanlık olmayan bir balıkçı kasabası

> **Belge statüsü:** “Kanonik” ibaresi önceki tasarım görüşmelerinde netleşen kararlara işaret eder. “Önerilen” değerler, dengeleme veya teknik uygulama sırasında kesinleştirilecek tasarım parametreleridir. Mevcut sahnelerin birebir varlık isimleri ve tüm balıkların eksiksiz ad listesi bu metinde doğrulanmış değildir; hiçbir tahmini liste kesinleşmiş içerik gibi sunulmamalıdır.

---

## 1. Oyun vizyonu

DÜMEN, oyuncunun küçük, tuhaf bir sahil kasabasından denize açıldığı; farklı davranışlara sahip komik balıkları avladığı, kasabaya dönüp balıklarını sattığı, teknesini ve oltalarını geliştirdiği ve sekiz benzersiz balıkçılık bölgesini keşfettiği mobil öncelikli bir oyundur.

DÜMEN’in farkı, yalnızca **balık tut → sat → geliştir** formülünden ibaret olmamasıdır. Her yeni bölgenin ayrı karakteri ve balık havuzu; her kasaba NPC’sinin kendine özgü mizahı; tazelik, hazine, hurdacılık, özel oltalar, sipariş panosu, koleksiyon ve gizli mekan gibi birbirini besleyen sistemler bulunur.

**Oyuncuya verilen temel vaat:** “Bugün nasıl bir saçma balık yakalayacağım, bir sonraki bölge neye benzeyecek ve kasabada şimdi ne olacak?”

### 1.1 Tasarım sütunları

- **Mizah ve özgünlük:** İsimler, balık açıklamaları, NPC replikleri ve çevresel detaylar oyunun kimliğini taşır.
- **Aktif, anlaşılır balıkçılık:** Gerilim, sarma ve balık davranışı oyuncunun kararına tepki verir.
- **Bölge keşfi:** Sekiz bölgenin görsel kimliği, balıkları, materyalleri ve özel ödülleri ayrıdır.
- **Kasabaya dönüş:** Avlanma sonucu pazarda, atölyede, görevlerde, koleksiyonda ve gizli sistemlerde karşılık bulur.
- **Uzun vadeli ilerleme:** Tekne seviyeleri, oltalar, koleksiyonlar ve NPC hikâyeleri net hedefler sunar.
- **Saygılı mobil deneyim:** Kısa oturumlar anlamlıdır; reklamlar zorunlu değildir.

### 1.2 Hedef oyun ritmi

**2–5 dakika:** Birkaç av, bir satış veya sipariş ilerlemesi.  
**15–30 dakika:** Kaynak biriktirme, sandık açma, bir geliştirme, özel görev bölümü veya yeni bölge hedefi.  
**Uzun vadede:** Sekiz bölgeyi açma, oltaları edinme, koleksiyon ve boss kayıtlarını tamamlama, NPC hikâyelerini bitirme.

---

## 2. Tam sürüm kapsamı

Tam sürümde aşağıdaki sistemlerin tamamı işlevsel olmalıdır:

1. Boot/yükleme, ayarlar ve kalıcı kayıt.
2. Kasaba ana ekranı ve alt mekanlar.
3. Harita ve sekiz bölge.
4. Olta atma, karşılaşma belirleme ve balık tutma mini-game’i.
5. Hazine mini-game’i ve sandıkların envantere alınması.
6. Balık, sandık, yem, materyal, özel eşya ve kozmetik envanteri.
7. Rüstem’in balık satış sistemi ve tazelik ekonomisi.
8. Market, standart oltalar ve yem alışverişi.
9. Hurdacı Hasan, hurda ve craft sistemi.
10. Tekne seviye yükseltme, görünüm evrimi ve bölge açma.
11. Yeni sokak: Zıpırleone’nin Mekanı, Geri Dönüşüm Fabrikası, Tekne Atölyesi.
12. Sipariş panosu, not defteri, ana ve günlük görevler.
13. Martı, Don Zıpırleone, Müfettiş Tarçov, Komplo Teorisyeni ve ilgili NPC diyalogları.
14. Zıpırleone Kara Pazar Çarkı ve Miyav Puanı.
15. Balık koleksiyon defteri ve rekor kayıtları.
16. Legendary ve boss balık karşılaşmaları.
17. Görsel efekt, ses, animasyon ve mobil kontrol desteği.
18. Dengeleme, erişilebilirlik, hata önleme, test ve veri bütünlüğü.

**Bu belge üretim yol haritası değildir:** Sistemlerin tek tek geliştirilme sırası ayrı Roadmap dokümanında planlanacaktır.

---

## 3. Dünya, ton ve sanat yönü

### 3.1 Dünya

DÜMEN kasabası küçük bir balıkçı yerleşimidir. Tuhaflığı herkes için son derece normaldir. Kahramanımız eski bir tekneyle yola çıkar, gittikçe daha zor ve gerçeküstü balıkçılık sularına ulaşır.

Kasaba sevimli ve gündelik; balıklar absürt; karakterler hafif karikatürizedir. Gizemli unsurlar mevcut olsa da korku oyunu atmosferine dönüşülmez.

### 3.2 Görsel kimlik

- 2D, karakteristik illüstratif çizgi film estetiği.
- Bölgelere göre belirgin renk paletleri ve ayırt edici arka plan katmanları.
- Ahşap, ip, deniz, pas ve metal gibi denizci motifleri.
- Hafif dalga, tekne sallanması, martı hareketleri ve çevresel animasyonlar.
- İşlevsel UI’da okunaklı yazı, açık kontrast, büyük dokunma alanları.
- Rarity vurgusu ikon, çerçeve ve renk ile verilir; yalnız renk farkına dayanmaz.

### 3.3 Mizah kuralları

- Tekrarlanan şakalar miktar açısından kontrol edilir.
- Görevler sistem öğretirken kısa ve komik ifadeler kullanır.
- NPC kişilikleri tutarlı kalır.
- Oyuncunun başarısızlığı aşağılayıcı değil, eğlenceli şekilde anlatılır.
- Her bölgenin balık açıklamalarında bölgeye özgü mizah bulunur.

---

## 4. Temel oyun döngüleri

### 4.1 Av döngüsü

Kasaba → Harita → Bölge → Olta/yem seç → Oltayı at → Balık/sandık/özel karşılaşma → Mini-game → Sonuç → Envanter → Devam veya Kasabaya dön.

### 4.2 Ekonomi döngüsü

Balık yakala → Envantere ekle → Sat / siparişe ayır / sakla → Coin veya materyal kazan → Market/craft/tekneye harca → Daha zorlu ve kazançlı avlara eriş.

### 4.3 Uzun vadeli döngü

Tekne geliştir → Bölge aç → Yeni balık, sandık ve materyal topla → Yeni olta üret → Efsanevi ve boss hedeflerine ulaş → Koleksiyon ve özel görevleri ilerlet.

### 4.4 Görev döngüsü

Pano veya NPC ile konuş → Görevi kabul et → Takip defterinde izle → Gerekli eylemleri yap → Teslim et veya otomatik doğrulat → Ödül al → Yeni görev/özellik aç.

---

## 5. Oyun sahneleri ve gezinme

### 5.1 Boot / Init

- Statik veri kataloglarını yükler.
- Kayıt sürümünü doğrular, gerekirse dönüştürür.
- Eksik kayıt alanlarını varsayılan değerle tamamlar.
- İlk oyun ve devam eden oyun akışını ayırır.
- Başarısız veri yüklemede hata ekranına güvenli biçimde düşer.
- Ana kasaba ekranına geçiş yapar.

### 5.2 Kasaba / Town

**Kanonik görsel unsurlar:** Denizin karşıdan görüldüğü sahil kasabası; evin önünde halatla bağlı ve dalgalarda hafif sallanan tekne; tekneye konan konuşkan Martı; çevrede tıklanabilir mekanlar ve yeni sokak girişi.

Ana erişim: **Balığa Çık**, Harita, Envanter, Balık Pazarı/Rüstem, Market, Hurdacı, Görev Panosu/Not Defteri, Koleksiyon, Yeni Sokak, Ayarlar.

### 5.3 Harita / Region Select

Her bölge için ad, resim, açık/kilitli durumu, çıkabilecek balık/rarity ön bilgisi, önerilen ekipman ve kilit koşulları gösterilir. Kilitli bölgeye dokununca eksik gereksinimler açıklanır.

### 5.4 Fishing Scene

Olta atma, su/tekne görseli, av karşılaşması, balık siluetleri, balık veya hazine mini-game’i, sonuç paneli ve aynı bölgede tekrar avlanma eylemlerini içerir. Sahneler arası dönüş envanteri kaybetmez.

### 5.5 Rüstem / Balık Pazarı

Balık listesi, tekli satış, seçili satış, uygun balıkların toplu satışı, tazelik/bedel göstergesi, satış onayı ve coin güncellemesi. Görev için işaretli veya kilitlenmiş balıklar yanlışlıkla satılmaz.

### 5.6 Market

Satın alınabilir standart oltalar, yemler ve uygun temel ürünler; sahiplik, fiyat, eksik coin ve satın alım geri bildirimi.

### 5.7 Hurdacı Hasan

Malzeme envanteri, tarif listesi, üretim koşulları, sonuç istatistikleri, craft onayı ve mizahi diyaloglar.

### 5.8 Yeni Sokak

Üç temel mekan: **Zıpırleone’nin Mekanı**, **Geri Dönüşüm Fabrikası**, **Tekne Atölyesi**.

### 5.9 Zıpırleone’nin Mekanı

İlişki, özel görevler, Miyav Puanı, görevin açtığı Kara Pazar Çarkı ve orta oyunda açılan özel/gizli mekan bağlantısı.

### 5.10 Geri Dönüşüm Fabrikası

Bayat veya düşük değerli balıkların daha düşük bedelle değerlendirilmesi; uygun dönüşüm tariflerinden hurda/materyal kazanımı.

### 5.11 Tekne Atölyesi

Mevcut tekne görünümü ve seviyesi, sıradaki geliştirme maliyeti, bonuslar, açılacak bölgeler ve onay/uygulama akışı.

### 5.12 Envanter

Sekmeler: Balık, Sandık, Yem, Materyal, Özel Eşya, Kozmetik. Her kartın tipi ve sahiplik durumu açık görünür; arama, sıralama ve filtreleme tasarımın parçasıdır.

### 5.13 Sipariş Panosu / Not Defteri

Panoda yeni ilanlar; not defterinde kabul edilmiş görevler, teslim miktarları, kalan süre, ödüller ve görev türleri.

### 5.14 Koleksiyon Defteri

Sekiz bölge sayfası; keşfedilen balıklar, bilinmeyen siluetler, en büyük boy ve toplam av sayıları, Legendary/boss vitrinleri.

### 5.15 Ayarlar

Müzik, ses efekti, titreşim, dil hazırlığı, erişilebilirlik tercihleri, kayıt hakkında bilgi, doğrulanmış sıfırlama akışı.

---

## 6. Balık tutma: tam mekanik tasarımı

### 6.1 Temel kural

**Kanonik referans mekanik:** Klasik makara sarma sistemi. Oyuncu sarma temposuyla balığın **İnat Barı**, **ip gerilimi** ve **mesafesini** birlikte yönetir. Çok hızlı sarma ipi koparır; uzun süre bırakma balığın kaçmasına yol açabilir. İnat yeterince düşünce **Çek** eylemi ile yakalama tamamlanır.

Bu çekirdek, yeni HTML5 sürümünde daha eğlenceli hale getirmek için oyun testlerinde ayarlanabilir; fakat GDD’nin sistemsel amacı korunur.

### 6.2 Atış ve karşılaşma akışı

1. Oyuncu bölgeye girer; mevcut olta ve yemi görür.
2. **Oltayı At** etkinleştirilir.
3. Atış animasyonu ve uygun bekleme/dalga gösterimi başlar.
4. Karşılaşma sistemi bölgenin veri havuzundan sonuç seçer.
5. Balık/hazine/özel durum silueti ile oyuncuya sinyal verilir.
6. Oyuncu hedefi belirler; balık mini-game’i veya hazine mini-game’i başlar.
7. Sonuç tek kez kesinleştirilir; envanter ve görev ilerlemesi güncellenir.

### 6.3 Makara/sarma kontrolü

Mobilde basılı tutarak sarma veya büyük, kolay erişilen sarma kontrolü; bırakma eylemi gerilimi düşürür. Sık/uzun sarma gerilim biriktirir. Oyun arka plana geçtiğinde mini-game haksız biçimde kaybettirilmemelidir.

### 6.4 İp gerilimi

- **Yeşil:** Güvenli gerilim.
- **Sarı:** Daha yüksek risk, dikkatli sarma.
- **Kırmızı:** Devam edilirse kopmaya yol açar.

Gerilim; balık çekişi, sarma süresi, olta dayanımı ve kontrol statına göre değişir. Kırmızıya anlık giriş otomatik kayıp olmamalı; kısa düzeltme fırsatı verilmelidir.

### 6.5 Mesafe

Başlangıç mesafesi balık/rarity davranışına göre belirlenir. Sarma mesafeyi azaltır; balığın kaçış hamlesi artırabilir. Mesafe kaçış sınırını aşarsa av başarısız olur.

### 6.6 İnat Barı

Başlangıç dayanıklılığı balığa göre değişir. Etkin sarma/denge ile azalır. **Çek** yalnız uygun eşik ve koşullarda başarılı olabilir. Erken çekmek başarısızlık veya ilave gerilim doğurur.

### 6.7 Davranış arketipleri

| Arketip | Davranış | Oyuncu becerisi |
|---|---|---|
| Calm | Yavaş/sakin | Öğrenme |
| Wiggler | Ufak sık tepkiler | Ritim |
| Runner | Ani uzaklaşma | Mesafe takibi |
| Heavy | Güçlü ve ağır | Gerilim yönetimi |
| Trickster | Sakinlik sonrası ani hamle | Tepki |
| Berserk | Kısa yoğun ataklar | Soğukkanlılık |
| Boss | Çok evreli özel pattern | Ustalık |

### 6.8 Rarity

**Common, Uncommon, Rare, Epic, Legendary, Boss**. Nadirlik; karşılaşma ağırlığını, genel zorluğu ve koleksiyon/ödül değerini etkiler. Ancak tüm balıklar aynı davranışın yalnız sayısal olarak güçlendirilmiş kopyası olmamalıdır.

### 6.9 Başarı ve başarısızlık

Başarı ekranında balık resmi, ad, rarity, boy, satış değeri, “Yeni!”/“Rekor!” bildirimleri ve görev ilerlemesi görünür. Başarısızlıkta neden açıkça yazılır: **Balık kaçtı**, **İp koptu**, **Erken çektin**.

### 6.10 Boss balıklar

Boss’lar farklı evreler, belirgin saldırı sinyalleri ve özel yakalama sahnesine sahiptir. İlk yakalamada büyük koleksiyon/başarı geri bildirimi verilir. Sonraki denemeler boy rekoru ve tekrar av motivasyonu sağlar. Günlük deneme sınırı kesinleşmiş değildir; zorunlu sınır eklenmemesi önerilir.

---

## 7. Hazine mini-game’i ve sandıklar

### 7.1 Kanonik akış

Sandıklar **oltayla yakalanır**. Hazine karşılaşmasında balık mini-game’i yerine hareketli işaretçili **zamanlama barı** çalışır. Yakalanan sandık hemen açılmaz; **Sandık Envanteri**ne kaydedilir ve daha sonra Envanter ekranından açılır.

### 7.2 Zamanlama barı

- **Yeşil:** En iyi sonuç; başarılı yakalama ve kalite avantajı.
- **Sarı:** Geçerli başarı; normal sandık yakalama.
- **Kırmızı:** Başarısızlık ya da tarif edilen özel başarısızlık sonucu.

Hareketli işaretçi, input’un yalnız yeni basılmasına tepki verir; önceki sahnede basılı tutulan parmağın hazine ekranına taşınması otomatik tıklama yapmaz.

### 7.3 Sandık havuzu

| Sandık | İlişkili yer | Genel tema |
|---|---|---|
| Eski Sandık | Eski Liman | Başlangıç coin/yem |
| Sazlık Sandığı | Tembel Sazlıklar | Yem ve küçük materyaller |
| Paslı Sandık | Paslı Sanayi Kanalı | Hurda/dişli |
| Yakamoz Sandığı | Yakamoz Koyu | Mistik materyal |
| Donmuş Sandık | Titrek Buzullar | Buz malzemesi |
| Korsan Sandığı | Batık Korsan Mezarlığı | Korsan temalı ödüller |
| Kaynar Sandık | Kaynar Kazan Deltası | Yüksek riskli değerli ödüller |
| Bermuda Sandığı | Bermuda Girdabı | En nadir ödül havuzu |
| Kara Pazar Sandığı | Zıpırleone | Şüpheli/özel ödüller |

Sandık türleri ve yüzdeleri merkezi ChestDB’de tutulur. Bu tabloda yer alan bazı sandık adları önceki öneri kapsamındadır; son isim listesi ayrı içerik kataloğunda kilitlenebilir.

### 7.4 Açılma arayüzü

Oyuncu sandığı seçer → **Aç** → kısa animasyon → ödüller → tek seferlik envanter/coin değişimi → sonuç paneli. Aynı sandık iki kez açılamaz. Animasyonun tekrar oynatılması ödülü tekrar vermez.

---

## 8. Sekiz kanonik bölge

Bölge adları ve sıralaması **kanoniktir**.

| Sıra | Bölge | Tasarım rolü | Atmosfer | Ana ilerleme |
|---:|---|---|---|---|
| 1 | **Eski Liman** | Başlangıç | Ahşap iskele, sakin deniz | Temel balıkçılık |
| 2 | **Tembel Sazlıklar** | Erken oyun | Saz, sis, kurbağalar | Davranış çeşitliliği |
| 3 | **Paslı Sanayi Kanalı** | Erken/orta | Boru, fabrika, pas | Hurda ve craft |
| 4 | **Yakamoz Koyu** | Orta | Parlayan gece suyu | Mistik/nadir av |
| 5 | **Titrek Buzullar** | Orta/ileri | Buz, soğuk rüzgâr | Özel olta stratejisi |
| 6 | **Batık Korsan Mezarlığı** | İleri | Batık gemiler | Sandık ve korsan avları |
| 7 | **Kaynar Kazan Deltası** | İleri | Buhar, sıcak akıntılar | Agresif zorlu mücadele |
| 8 | **Bermuda Girdabı** | Endgame | Gerçeküstü dönen sular | En nadir balık ve sırlar |

### 8.1 Eski Liman

İlk av, ilk satış ve ilk görevler burada gerçekleşir. Common/Uncommon ağırlıklı havuz, az sayıda sürpriz nadir karşılaşma, Eski Sandık. Görsel: sıcak kasaba limanı, tahta iskele, kısa dalgalar ve martılar.

### 8.2 Tembel Sazlıklar

Sazlık, sis, dingin yeşil su; beklenmedik hareket yapan balıklar ve mizahi canlılar. Ninja Kurbağa gibi absürt örnekler burada temaya uyar. Sazlık sandığı ve bölge siparişleri.

### 8.3 Paslı Sanayi Kanalı

Paslı boru, fabrika atığı estetiği, mekanik çevre sesleri. Hurdacı Hasan’la güçlü bağlantı. Paslı materyal, çark/dişli, Pas Yiyen Olta yapımına ilişkin kaynaklar ve dayanıklı balıklar.

### 8.4 Yakamoz Koyu

Lacivert/mor palet ve parlayan su. Rare/Epic ağırlığının hissedildiği, gizemli balıkların ve Yakamoz Fısıldayan Olta materyallerinin bulunduğu bölge.

### 8.5 Titrek Buzullar

Buz parçaları ve güçlü soğuk ambiyansı. Gerilim yönetimi ve özel olta avantajı belirginleşir. Buzkıran Olta, buz kristalleri, Donmuş Sandık.

### 8.6 Batık Korsan Mezarlığı

Batık gemiler, eski yelkenler, korsan eşyaları ve hafif hayaletimsi ışıklar. Korsan Sandığı, özel malzemeler ve Legendary/Boss hedefleri.

### 8.7 Kaynar Kazan Deltası

Buhar, kızıl ışıklar, sıcak akıntılar. Daha saldırgan davranışlı balıklar; Kızıl Isırgan Olta, kızıl temalı materyal ve yüksek risk/ödül.

### 8.8 Bermuda Girdabı

Gerçeküstü atmosfer, anormal çevre etkileri, büyük zorluk ve son koleksiyon hedefleri. Yakamoz Fısıldayan Olta avantajı; Komplo Teorisyeni ve gizli hikâye ile tematik bağ.

### 8.9 Bölge içerik standardı

Her bölgenin **kendine özgü arka planı, atmosfer sesi, karşılaşma tablosu, balık kayıtları, sandığı, materyali, görevleri, koleksiyon sayfası ve yüksek nadirlik hedefi** bulunmalıdır.

---

## 9. Balık kataloğu ve koleksiyon

### 9.1 Balık verisi

Her balığın benzersiz ID’si, adı, bölgesi, rarity’si, satılabilir temel değeri, boy aralığı, dayanıklılığı, çekişi, kaçış baskısı, gerilim baskısı, davranış arketipi, yem tercihi, varsa ekipman koşulu ve mizahi açıklaması vardır.

```json
{
  "id": "old_port_fish_001",
  "name": "Örnek Balık",
  "regionId": "old_port",
  "rarity": "COMMON",
  "baseValue": 12,
  "sizeMin": 10,
  "sizeMax": 35,
  "stamina": 30,
  "strength": 1,
  "escapePressure": 0.8,
  "linePressure": 0.7,
  "behavior": "CALM",
  "preferredBaitTags": ["basic"],
  "requiredRodTag": null,
  "collectionText": "Mizahi açıklama.",
  "questTags": ["old_port"]
}
```

**Önemli:** Bu kayıt bir veri şeması örneğidir; yeni bir kanonik balık ilanı değildir. Önceki görüşmelerde kesinleştirilen balık adları ve bölge eşlemeleri özgün katalogdan aktarılmalıdır. Bu belgede tüm liste kesin olarak yeniden üretilemediği için hayali 80–120 isim uydurulmamalıdır.

### 9.2 Koleksiyon

Her balık için: keşfedildi mi, ilk yakalanma, toplam adet, en büyük boy, en yüksek değer, açıklama ve rarity gösterilir. Bilinmeyen balıklar siluettir. Bölge sayfalarının tamamlanma yüzdesi hesaplanır.

### 9.3 Boy ve rekor

Boy rastgele aralıktan hesaplanır; *Küçük / Normal / Büyük / Dev / Rekor* sunum etiketleridir. Rekor, aynı fishId için önceki en yüksek boyu geçtiğinde güncellenir. Kayıt çift sayım yapmaz.

### 9.4 Tam sürüm içerik hedefi

Önceki GDD’deki **her bölgede yaklaşık 10–15, toplam 80–120 balık** sayısı üretim hedefi niteliğindedir. Her bölgede özel Legendary veya Boss karşılaşması bulunması hedeflenir. Tam kesin sayı ve adların son kataloğu, tasarımın ayrı içerik tablosuyla kilitlenmelidir.

---

## 10. Oltalar

### 10.1 Kanonik olta listesi

| Kategori | Olta | Oynanış rolü |
|---|---|---|
| Starter | **Tahta Olta** | Başlangıç |
| Market | **Dengeli Olta** | Dengeli genel performans |
| Market | **Sağlam Olta** | Daha iyi ip dayanımı |
| Market | **Hızlı Sarıcı Olta** | Daha hızlı sarma, riskli agresif oyun |
| Market | **Usta Oltası** | İleri seviye genel kullanım |
| Craft | **Buzkıran Olta** | Titrek Buzullar avantajı |
| Craft | **Kızıl Isırgan Olta** | Kaynar Kazan Deltası avantajı |
| Craft | **Pas Yiyen Olta** | Paslı Sanayi Kanalı avantajı |
| Craft | **Yakamoz Fısıldayan Olta** | Yakamoz Koyu ve Bermuda Girdabı avantajı |

### 10.2 Olta statları

- **Line Strength:** Kopma toleransı.
- **Reel Speed:** Sarma etkinliği.
- **Control:** Gerilim yönetimi.
- **Stamina Damage:** İnat azaltma.
- **Treasure Timing Bonus:** Hazine zamanlamasına katkı.
- **Region Bonus:** Bölgeye özgü üstünlük.
- **Rarity Handling:** Nadir balık mücadelelerine destek.

Statlar RodDB’de saklanır ve oyuncunun seçili olta ID’sine göre oyun başında değil, her av başlangıcında uygulanır. Aynı olta tekrar satın alınamaz (tüketilebilir olta sistemi tasarlanmamıştır).

### 10.3 Edinim

Tahta Olta başlangıçta; dört market oltası coin ile; dört özel olta materyal + coin craft ile edinilir. Olta seçimi oyuncunun sahip olduğu listeden yapılır. Özel olta, belirli bölgede daha faydalı olmalıdır; tüm bölgelerde tartışmasız en güçlü seçenek olmamalıdır.

---

## 11. Yem sistemi

Yem olmadan da balık tutulabilir. Yemler **karşılaşma olasılığını** veya bekleme süresini etkiler; hiçbir zaman otomatik kazanma garantisi vermez.

| Yem | Önerilen etki |
|---|---|
| Basit Yem | Normal avlarda küçük avantaj |
| Kokulu Yem | Bekleme süresi avantajı |
| Parlak Yem | Rare ve üstü için küçük ihtimal artışı |
| Bölge Yemi | Belirli bölge balığına ağırlık |
| Efsanevi Yem | Legendary/Boss denemeleri için bonus |
| Şüpheli Yem | Kara pazar kaynaklı rastgele etki |

Yem tüketimi başarıdan bağımsız biçimde **atış başına** gerçekleşecekse bu kural kullanıcı arayüzünde açık belirtilir. Bir atış için bir kez tüketilir; sahne yeniden çizilmesi ikinci tüketim oluşturmaz.

---

## 12. Tekne geliştirme ve bölge açılımı

### 12.1 Kanonik yön

Tekne ana progression aracıdır. **Seviye tabanlı** geliştirilir; seviyeler görsel değişim ve oynanış bonusu verir. Bölge açılımları öncelikle tekne gelişimine dayanır. Yeni sokaktaki **Tekne Atölyesi** bu sistemin merkezidir.

### 12.2 Önerilen seviye dağılımı

**Seviye 1–10** tasarım hedefi. Her seviye için BoatDB kaydı bulunur: maliyet, materyal gereksinimi, görsel varyant, bonus ve bölge kilit koşulu. Bu sayı öneridir; nihai ekonomi dengesinde netleştirilir.

| Gelişim bandı | Görünüm |
|---|---|
| 1 | Eski küçük sandal |
| 2–3 | Onarılmış balıkçı teknesi |
| 4–5 | Motorlu ve sağlam tekne |
| 6–7 | Bölgesel ekipmanlı tekne |
| 8–9 | İleri keşif teknesi |
| 10 | Absürt ve gösterişli endgame teknesi |

### 12.3 Açılım mantığı

Eski Liman başlangıçta açıktır. Tembel Sazlıklar erken geliştirmeyle, Paslı Sanayi Kanalı dayanıklılık ilerlemesiyle, Yakamoz Koyu navigasyonla, Titrek Buzullar soğuk hazırlığıyla, Batık Korsan Mezarlığı motor/navigasyonla, Kaynar Kazan Deltası ısı dayanımıyla ve Bermuda Girdabı en ileri navigasyon + özel ilerleme koşuluyla açılır.

### 12.4 Bonus alanları

Önerilen bonus havuzu: envanter kapasitesi, hazine karşılaşma ihtimali, bölge erişimi, çevre koşulu toleransı, seçili nadirliklere küçük bonuslar. Bu bonuslar oyuncunun sahip olduğu olta ve yem etkileriyle öngörülebilir biçimde birleştirilir.

---

## 13. Envanter

### 13.1 Kategoriler

**Balıklar, Sandıklar, Yemler, Materyaller, Özel Eşyalar, Kozmetikler.**

### 13.2 Balık örneği

Her yakalama bir örnek nesnedir; aynı tür iki balık farklı boy ve tazelik taşıyabilir. Bu nedenle sırf fishId üzerinde stack yapmak veri kaybına neden olabilir.

```json
{
  "instanceId": "fish_unique_001",
  "fishId": "old_port_fish_001",
  "size": 24.6,
  "caughtAt": 0,
  "regionId": "old_port",
  "freshness": "FRESH",
  "questProtected": false
}
```

`caughtAt` bir kayıt alanı örneğidir; gerçek sistemde yakalama zamanını temsil eden geçerli timestamp kullanılır.

### 13.3 Sandık envanteri

Sandıklar açılana kadar ayrı örnekler veya tür/kalite temelinde güvenli stack’lerle tutulur. Açma işlemi tam olarak bir sandık tüketir ve ödülü tam olarak bir kez verir.

### 13.4 Materyal envanteri

Aynı tür materyal adet bazında tutulabilir: `materialId -> count`. Negatif stok oluşturulmaz. Tarif işlemi önce yeterliliği kontrol eder, sonra bütün materyalleri tek işlemde düşer.

### 13.5 Filtreleme ve güvenlik

- Balığı bölge, rarity, tazelik ve göreve ayrılmış olma durumuna göre filtrele.
- Tümünü sat, korunan balıkları atlar.
- Boş envanterde sıfır adet/sıfır coin doğru görünür.
- Panel aç/kapat herhangi bir satın alma veya satış event’ini yeniden yürütmez.

---

## 14. Tazelik, satış ve geri dönüşüm

### 14.1 Tazelik

Kanonik sistemde balık **fresh / stale** durumu satış kabiliyetini etkiler. Önceki geliştirmede sahneler arası geçişte Fresh:1 → Fresh:0 dönüşmesi hatası yaşanmıştır. Yeni sistemde tazelik açıkça tarif edilmiş zamana bağlanmalıdır; **yalnız sahne değiştirmek asla tazelik azaltmamalıdır**.

GDD önerisi: `FRESH`, `NORMAL`, `STALE` durumları; süre eşikleri EconomyConfig’den okunur. Kesin süreler dengeleme aşamasında belirlenir.

### 14.2 Rüstem’in balık pazarı

Rüstem taze/uygun balıkları satın alır. Her balığın hesaplanan birim değeri ve toplam satılabilir miktar görünür. Toplu satışı bir kez tıklamak yalnız bir satış işlemi doğurur.

### 14.3 Satış fiyatı

Önerilen şema:

`Satış Değeri = Temel Değer × Nadirlik × Boy × Tazelik × Özel Bonus`

Bölge bazlı fiyat farklılıkları gerekiyorsa temel değer tablosunda veya ayrı çarpanla tanımlanır. Aynı faktör iki kez uygulanmaz. Para tam sayı olarak saklanır; yuvarlama kuralı merkezi ekonomide yönetilir.

### 14.4 Geri Dönüşüm Fabrikası

Bayat balıklar düşük coin değerine veya uygun tariflerden materyale dönüştürülebilir. Oyuncuya bu iki seçenek ve karşılığı önceden gösterilir. Geri dönüşüm normal taze balık satışından daha kârlı hale gelmemelidir (istisnai görev ödülü dışında).

---

## 15. Coin, hurda ve diğer kaynaklar

### 15.1 Coin

Temel para birimidir. Kaynaklar: balık satışı, sipariş, görev, sandık, çark ve bazı milestone’lar. Harcama: market, craft, tekne gelişimi, yem ve uygun hizmetler.

### 15.2 Hurda/materyaller

Hurdacı Hasan, geri dönüşüm, bölge karşılaşmaları ve sandık ödüllerinden elde edilir; craft ve uygun tekne geliştirmelerinde kullanılır.

Önerilen materyal isimleri: **Hurda Parçası, Paslı Dişli, Buz Kristali, Yakamoz Taşı, Kızıl Lif, Korsan Çivisi, Bermuda Pusulası**. Önceki ayrıntılı ItemDB referansı bulunursa adlar oradaki kanonik katalogla eşleştirilir.

### 15.3 Ekonomi dengesi

- İlk ekipman yükseltmesi ulaşılabilir olmalıdır.
- İleri tekne seviyeleri kaynak hedefi yaratır; sırf tekrar için aşırı grind oluşturmaz.
- Sandık/çark ödülleri ekonomik dengeyi kırmaz.
- Oyuncuya yeni hedefin maliyeti ve nereden kaynak toplanacağı gösterilir.
- Fiyatlar merkezi veri kataloglarında tanımlıdır.

---

## 16. Hurdacı Hasan ve craft

Craft’ın merkezi **Hurdacı Hasan**dır. Kanonik dört özel olta bu sistemden üretilir. Her tarif `id`, `resultItemId`, `coinCost`, `materials`, `unlockRequirements` ve `oneTime` alanlarını taşır.

```json
{
  "id": "rod_rust_eater_recipe",
  "resultItemId": "rod_rust_eater",
  "coinCost": 500,
  "materials": [
    { "itemId": "rusty_gear", "quantity": 8 },
    { "itemId": "scrap_piece", "quantity": 20 }
  ],
  "unlockRequirements": { "regionId": "rusty_industrial_canal" },
  "oneTime": true
}
```

Bu rakamlar **yalnız teknik örnektir**. Gerçek maliyetler ekonomi tablosunda kararlaştırılır. Craft sonucu kalıcı sahiplik olarak save’e işlenir. Aynı eşyanın iki kez üretilmesi istenmiyorsa buton kilitlenir.

---

## 17. Görev ve sipariş sistemleri

### 17.1 Görev kategorileri

- Ana ilerleme/tutorial görevleri
- NPC özel hikâye zincirleri
- Bölge görevleri
- Günlük görevler
- Sipariş panosu ilanları
- Koleksiyon hedefleri

### 17.2 Ev yanındaki ilan panosu

**Kanonik:** Garip balık siparişleri evin yanındaki panoda yer alır. Bazı ilanlar **süreli ve yüksek getirili**, bazıları **süresiz**dir. Kabul edilen siparişler **Not Defteri**ne taşınır.

Sipariş tipleri: belirli balık türü, belli sayı, belirli rarity, bölge temelli set, tematik komik istekler. Aktif görevin gerektirdiği stok yanlış satışa karşı korunabilir.

### 17.3 Görev durumu

`LOCKED → AVAILABLE → ACTIVE → COMPLETABLE → COMPLETED`. Süreli görevler için `EXPIRED`, terk edilebilir görevler için `ABANDONED` eklenebilir. Her görev yalnız bir kez tamamlanma ödülü verir; tekrarlanabilir görevlerin gün/instance kimliği ayrıdır.

### 17.4 Günlük görevler

Balık yakalama, rarity hedefi, bölgede av, satış, hazine zamanlama başarısı, sandık, hurda ve yem kullanma gibi farklı mekanikleri teşvik eder.

Ödül havuzu: coin, yem, materyal, sandık, uygun NPC ilişki puanı ve Miyav Puanı. Günlük yenileme takvim günü bazlıysa, saat dilimi ve cihaz saati değişimi için koruma gereklidir.

### 17.5 Tam sürüm yazım ilkeleri

Görevler yalnız “X balık getir” tekrarıyla dolmamalı. NPC hikâyeleri keşif, konuşma, teknik eylem, karşılaşma ve kısa mizahi olaylara çeşitlendirilmelidir.

---

## 18. NPC’ler

### 18.1 Martı

**Kanonik:** Başlangıçta oyuncunun teknesine konar. Görev vermez. Aralıklı saçma yorumlarla dünyayı canlandırır; sahnedeki başarılara/başarısızlıklara tepki verebilir.

Örnek replikler: “Ben bu tekneye konmadım, tekne benim altıma park etti.” / “O balık kaçmadı. Stratejik geri çekildi.”

### 18.2 Don Zıpırleone

Mafya parodisi tonunda, şüpheli ama komik karakter. Miyav Puanı, Kara Pazar Çarkı, Tarçov çatışması ve ikinci özel hikâyenin merkezidir. Suç doğrudan ispatlanmaz; karakter imalı konuşur.

### 18.3 Müfettiş Tarçov

**Kanonik:** Kısa boylu, siyah-beyaz rozetli bir köpektir. Zıpırleone’nin düşmanıdır. Kasabaya **yalnız bir defa** gelir. Beş bölümlük zincirde önce Zıpırleone’yi araştırır, Komplo Teorisyeni’ni uyarır, kanıt bulamadan gider ve artık kasabada rutin NPC olarak kalmaz.

### 18.4 Komplo Teorisyeni

Oyundaki saçma balıkları, kasabanın fizik kurallarına aykırı objelerini ve dördüncü duvarı sorgular. Kendi üç bölümlük diyalog zincirinin üçüncüsünde dördüncü duvarı kırar.

### 18.5 Hurdacı Hasan

Craft ustası; hurda ve pas sevgisiyle tanınır. Özel oltaların üretim rehberi; Paslı Sanayi ve geri dönüşümle bağ kurar.

### 18.6 Rüstem ve diğer mekan sahipleri

Rüstem balık pazarı satış akışının karakter yüzüdür. Tekne Atölyesi ve Geri Dönüşüm Fabrikası için çalışan/usta karakterler gerekiyorsa ayrı diyalog ve portre varlıklarıyla tanımlanır. Bilinmeyen kesin isimler uydurulmaz.

---

## 19. Tarçov × Zıpırleone: erken oyun zinciri

**Kanonik yapı:** Beş bölüm; hikâye ağırlıklı; basit balık teslim etme zinciri değil. Sonuçta **Kara Pazar Çarkı açılır; mahzen açılmaz.** Tarçov kalıcı ayrılır.

### Bölüm 1 — Rozetin Gölgesi

Tarçov kasabaya gelip Zıpırleone hakkında soruşturma başlatır. Oyuncu şüpheli görünen ama tam açıklanamayan bir durumla tanışır.

### Bölüm 2 — Miyav Puanı Meselesi

Oyuncu Miyav Puanı’nın ne olduğunu öğrenmeye çalışır. NPC’lerden birbiriyle çelişen absürt yanıtlar gelir; Zıpırleone doğrudan itiraf etmez.

### Bölüm 3 — Resmi Uyarı

Tarçov, Komplo Teorisyeni’ni kasaba düzenine ve oyunun işleyişine karışmaması için resmi üslupla uyarır. Komplo Teorisyeni bunun bile önceden programlandığını söyler.

### Bölüm 4 — Kanıt Yok

Şüphe büyür ama somut kanıt bulunamaz. Oyuncu iki tarafın arasındadır.

### Bölüm 5 — Çark Döner

Tarçov kasabadan ayrılır. Zıpırleone, oyuncuya “tamamen yasal” Kara Pazar Çarkı’nı tanıtır ve mekanik açılır.

**Teknik:** Zincir bayrakları birbirini dışlamaz; görevin diyalogu tekrar açılırsa ödül ikinci kez verilmez. Tarçov’un görünmesi ayrılış bayrağına bağlıdır.

---

## 20. Zıpırleone: orta oyun özel zinciri

**Kanonik:** İlişki seviyesi yükseldikten sonra açılır. Beş bölümlük, giderek ciddileşen fakat mizahi tonunu koruyan zincir. Final orta-zor seviyededir. Sonuçta **özel/gizli mekan** açılır (erken Tarçov zincirinde değil).

1. **Sessiz Miyav Anlaşması:** Güven testi, absürt görev mizahı.
2. **Yanlışlıkla Gizli Toplantı:** Aşırı ciddi toplantı ve saçma gündem.
3. **Eksik Defter:** Kayıp kayıt defteri; içerik utanç verici balık şiirleridir.
4. **Miyav Borcu:** Geçmişten gelen daha ciddi problem.
5. **Kapının Arkasındaki Mekan:** Birkaç sistemi kullanan final görev; gizli mekan açılımı.

Özel mekanın kesin işlevi geçmiş belgede açıkça kilitlenmediği için **henüz açık tasarım kararıdır**. Kodda boş ve çalışmayan buton yerine içerik kesinleştiğinde aktifleştirilecek uygun koşullu giriş tasarlanır.

---

## 21. Komplo Teorisyeni: üç bölüm

1. **Balıklar Normal Değil:** Balıkların “veritabanından kaçmış olabileceği” iddiası.
2. **Kasabanın Açısı Yanlış:** Sahnenin fizik mantığıyla ilgili absürt teori.
3. **Bizi İzliyorlar:** Kontrollü dördüncü duvar kırılması; oyuncuya ve oyunun tuhaflığına gönderme.

Kısa diyalog zinciridir; oyuncuyu uzun süre balık tutmaktan alıkoymamalıdır. Tarçov göreviyle olay bağlamı korunur.

---

## 22. Kara Pazar Çarkı ve Miyav Puanı

### 22.1 Açılım

Tarçov × Zıpırleone erken oyun zincirinin beşinci bölümü tamamlandığında açılır.

### 22.2 Günlük kullanım (kanonik)

- **Günde 1 ücretsiz çevirme**
- **Günde 2 ek reklamlı çevirme**

### 22.3 Ödüller

Coin, nadir yem, craft materyali, sandık, Miyav Puanı, kozmetik ve çok düşük ihtimalle özel eşya. Çark ödülleri ve ağırlıkları WheelDB veya EconomyConfig içinde kayıtlıdır.

### 22.4 Miyav Puanı

Zıpırleone ile ilişkili özel puandır. Nerede ve nasıl harcanacağı, son ayrıntılı eski DB doğrulanmadan kesinleştirilmemelidir. Genel sistemde cüzdan, kazanma nedeni ve işlem geçmişi alanları bulunabilir.

### 22.5 Reklam entegrasyonu

Reklam başarısız, iptal veya yüklenememişse spin tüketilmez. Gerçek reklam ödül onayı gelmeden çark hakkı veya ödül verilmez. Tarayıcıda reklam altyapısı bulunmadığında kullanıcıya bozuk bir buton gösterilmez; teknik demo için ayrı geliştirme modu kullanılabilir.

---

## 23. Koleksiyon ve endgame

- Her bölgenin keşif yüzdesi.
- Tüm balık türleri için siluet → görünür koleksiyon.
- Her türde en büyük boy ve toplam yakalama sayısı.
- Legendary/Boss avlarının ayrı vurgusu.
- Bölgesel tamamlanma ödülleri (ör. %25, %50, %75, %100).
- Son bölgelerin özel av görevleri.
- Tüm oltaları edinme, tekneyi maksimuma çıkarma, tüm hikâye zincirlerini bitirme.

Ödüller coin, yem, kozmetik, sandık ve diğer kontrollü ekonomik teşvikler olabilir. Koleksiyon tamamlaması oyunu sonlandırmak zorunda değildir; serbest balıkçılık devam eder.

---

## 24. UI / UX ve mobil kontroller

### 24.1 Ekran kuralı

**Yatay (landscape) mobil ekran**, yeni HTML5 üretim hedefidir. Oyun geniş ekran ve farklı en-boy oranlarına güvenli biçimde uyum sağlar; kritik dokunma alanları kesilmez.

### 24.2 Ana HUD

Coin, gerekli kaynaklar, görev ilerlemesi veya uyarı, Envanter, Harita, Ayarlar. Kalabalık metin şeritleri yerine gerektiğinde açılan paneller.

### 24.3 Fishing HUD

İnat Barı, gerilim, mesafe, sarma kontrolü ve **Çek** aksiyonu, olta/yem bilgisi. Paneller mini-game’in kritik kısmını kapatmaz.

### 24.4 Tıklama güvenliği

- Tam ekran ve dokunma etkileşimi birbirini engellemez.
- Tek fiziksel dokunuş, tek oyun aksiyonudur.
- Sahne geçerken önceki basılı tutulma yeni sahnede otomatik aksiyona dönmez.
- Sonuç paneli kapanırken yeni av başlatma tuşuna tıklama sızmaz.
- Modal açıldığında arka plan tıklanamaz.
- Dokunma hedefleri yeterince büyük, görsel durumlar belirgindir.

### 24.5 Erişilebilirlik

Yüksek kontrastlı metin, renk dışı rarity işaretleri, titreşim kapama, ses düzeyi, animasyon azaltma seçeneği ve açık hata mesajları önerilir.

---

## 25. Ses ve animasyon

### 25.1 Bölge müzikleri

Kasaba için sıcak denizci atmosferi; Eski Liman sakin; Sanayi metalik ritim; Yakamoz mistik; Buzullar ince/soğuk; Korsan bölgesi deniz macerası; Kaynar Kazan hareketli; Bermuda sürreal.

### 25.2 Gerekli SFX

Olta atma, suya düşme, balığın ısırması, sarma, gerilim alarmı, kopma, yakalama, başarısızlık, sandık zamanlama, sandık açılışı, coin, görev, craft, tekne yükseltme, NPC diyalog açılışı, çark.

### 25.3 Hareket

Teknenin sallanması, su parıltıları, balık siluetleri, karakter idle, kısa UI geçişleri ve nadirlik anonsu. Efektler görsel geri bildirimi destekler fakat düşük performanslı telefonda oyunu yavaşlatmaz.

---

## 26. Monetizasyon ilkeleri

- **Zorunlu reklam yok.** Balık tutma veya hikâye bölünmez.
- Kara Pazar Çarkı günlük 1 ücretsiz + 2 ödüllü reklamlı hak.
- Ek ödül reklamları düşünülebilir; dengeyi bozmamalıdır.
- Reklamın oynatılması oyuncunun açık tercihine bağlıdır.
- Ad SDK yoksa ana gameplay eksiksiz çalışır.
- Satın alma ve reklam ödülleri ayrı işlem türleri olarak kaydedilir.

---

## 27. Teknik mimari — sıfırdan Codex/vibecoding

### 27.1 Tercih edilen teknoloji

Yeni kurulum için **HTML5, JavaScript, Canvas tabanlı veya uygun 2D render katmanına sahip modüler web oyunu**. Mobil yatay tam ekran hedeflenir. GDevelop’e özgü event/variable alışkanlıkları yeni sürüme aynen taşınmak zorunda değildir.

### 27.2 Temel mimari kurallar

- **Static DB ≠ Save State ≠ Runtime State.**
- Tüm ürün, balık, bölge, görev ve ekonomi parametreleri veri tabanından okunur.
- UI, coin/çıkma ihtimali gibi hesapları kendi içinde tekrar kodlamaz.
- Her ekonomik eylemin tek yetkili işlem fonksiyonu vardır.
- Oyunun resetlenmesi, sahne değişimi veya ekran yeniden çizilmesi envanteri çoğaltmaz.
- Save sürümü, migration ve güvenli varsayılan alan tamamlama bulunur.
- Sabit ID’ler Türkçe görsel adlardan ayrıdır.
- Mobil tarayıcıdaki sekme arka plana geçme/geri gelme durumları ele alınır.

### 27.3 Önerilen kod organizasyonu

```text
src/
  core/          bootstrap, game loop, routing, events, rng, save
  data/          fish, region, rod, item, quest, chest, economy
  systems/       fishing, encounter, inventory, economy, market,
                 craft, boat, quests, orders, NPC, wheel, collection
  scenes/        town, map, fishing, market, inventory, workshop ...
  ui/            hud, panels, dialog, modals, responsive layout
  audio/         music and SFX manager
  assets/        sprites, backgrounds, atlases, effects
  tests/         data integrity, economy, inventory, progression
index.html
```

Proje istenirse `globalThis.DUMEN` namespace ile yönetilebilir, ancak ES modülleri ve açık import sınırları daha sağlam uzun vadeli tercih olabilir.

### 27.4 Veri katalogları

`FishDB`, `RegionDB`, `RodDB`, `BoatDB`, `ItemDB`, `BaitDB`, `ChestDB`, `CraftRecipeDB`, `ShopDB`, `QuestDB`, `DailyQuestDB`, `NPCDB`, `DialogueDB`, `EconomyConfig`, `WheelDB`.

Veriler başlangıçta yüklendikten sonra şema doğrulaması yapılır. Eksik `fishId`, bozuk görev koşulu veya kendisine referans veren craft tarifi geliştirme sırasında hata olarak görünür.

### 27.5 Önerilen save şeması

```json
{
  "schemaVersion": 1,
  "currency": { "coin": 0, "miyav": 0 },
  "unlockedRegions": ["old_port"],
  "ownedRods": ["wooden_rod"],
  "selectedRodId": "wooden_rod",
  "boat": { "level": 1, "bonuses": {} },
  "inventory": {
    "fish": [], "chests": [], "bait": {},
    "materials": {}, "specialItems": {}, "cosmetics": []
  },
  "collection": {},
  "npcRelations": {},
  "questProgress": {},
  "acceptedOrders": [],
  "daily": { "dateKey": null, "quests": [] },
  "blackMarketWheel": {
    "dateKey": null, "freeUsed": false, "rewardedUsed": 0
  },
  "stats": {
    "fishCaught": 0, "chestsOpened": 0, "coinsEarned": 0
  },
  "settings": {
    "music": true, "sfx": true, "haptics": true,
    "language": "tr"
  }
}
```

### 27.6 Oyun durum makinesi

Fishing aşamalarının açık adları vardır (ör. `IDLE`, `CASTING`, `PANEL`, `FISH_FIGHT`, `TREASURE_TIMING`, `RESULT`, `TRANSITION`). Her input yalnız beklenen durumda kabul edilir. `PANEL` durumundaki siluete dokunmak doğru mini-game’i başlatır; eski sonucunun tekrar işlemesini önleyen turn/catch ID kullanılır.

### 27.7 Rastgelelik

Karşılaşma olasılıkları normalize edilir. Random roll tek bir yerde uygulanır. Aynı atış için sahne değişiminden ya da tekrar render’dan dolayı yeniden roll yapılmaz. Test için seed veya kayıtlı karşılaşma listeleri kullanılabilir.

### 27.8 Save güvenliği

Av sonucu, sandık açma, satış, craft, satın alma ve görev ödülü gibi kalıcı eylemler birer **atomik işlem** gibi ele alınır: doğrula → hesapla → uygula → kaydet → UI’ı güncelle. Başarısızlıkta kısmi coin/ürün değişimi kalmaz.

### 27.9 Codex görev verme ilkeleri

Her görevde değişecek modüller, korunacak sistemler, beklenen davranış, kapsam dışı maddeler ve test senaryoları yazılır. Bir özellik tamamlandığında somut testlerle doğrulanır. Geliştirme Roadmap’i bu teknik çerçeve üzerinde ayrıca hazırlanır.

---

## 28. Tam sürüm içerik kabul kriterleri

### 28.1 Bölge

Sekiz bölgenin tümünde: çalışan giriş, özgün arka plan, karşılaşma tablosu, balık, sandık/özel ödül, çevre atmosferi, ilgili görevler ve koleksiyon verisi.

### 28.2 Balık

Final FishDB’de planlanan tüm türlerin geçerli veri kaydı ve görsel karşılığı; tüm rarity ve behavior kategorilerinin gerçek oyunda kullanılması; bölgelere uygun olasılık dengesi.

### 28.3 Ekonomi

Market, Rüstem, hurda, craft, tekne, çark, görev, sandık ve tazelik arasında tutarlı coin/materyal akışı. Negatif bakiye, sonsuz satış veya kopyalama hatası olmaması.

### 28.4 Görevler

Ana ilerleme, günlük, süreli/süresiz sipariş, Tarçov/Zıpırleone, orta oyun Zıpırleone, Komplo Teorisyeni ve ilgili craft/tekne görevlerinin baştan sona tamamlanabilir olması.

### 28.5 Kaydetme

Oyun kapatılıp açıldığında seçili olta, tekne seviyesi, coin, envanter, koleksiyon, NPC ilişki ve tamamlanan görevler korunur.

### 28.6 Kullanılabilirlik

Dokunma, cihaz döndürme, tam ekran, geri butonu, alt menüler, hata mesajları, performans ve erişilebilirlik kabul testlerinden geçilmesi.

---

## 29. Teknik testler ve geçmiş hatalara yönelik korumalar

Daha önce karşılaşılan sorunlar yeni sürümün mimarisini doğrudan bilgilendirmelidir:

1. **Balık yakalandı ama envantere eklenmedi:** Sonuç tam olarak bir kez işlenmeli; `catchId` ile idempotent ödül.
2. **Sahne geçince balık tazeliği anında bozuldu:** Tazelik, sahne girişine değil belirlenmiş zamana bağlı olmalı.
3. **Satış butonu sonsuz coin artırdı:** Tıklama tek seferlik transaction; render döngüsünden bağımsız iş mantığı.
4. **Balık sayısı UI’da sürekli arttı:** UI hesaplaması yan etki oluşturmaz, yalnız state okur.
5. **Sandık animasyonunda önceki basış ekranı hemen kapattı:** Input edge detection ve pointer release kilidi.
6. **Panelde siluete dokununca mini-game açılmadı:** State machine ve input routing testleri.
7. **Sandık sayısı inventory’de artmadı:** Hazine başarı sonucu tek bir ödül servisinden geçer.
8. **Shop/Hurdacı HUD’ında sayı görünmedi:** Ortak ekonomik HUD state’i ve sahne giriş güncellemesi.
9. **Save migration sonrası nesneler eksildi:** Şema yükseltme, varsayılan değer ve otomatik veri doğrulama.
10. **Mobil ekran tıklamaları çakıştı:** Modallar ve alt katman inputlarının ayrılması.

---

## 30. Açık ve kesinleşmemiş ayrıntılar

Tam sürüm kapsamını eksik bırakmadan aşağıdaki parametreler üretim öncesinde kilitlenmeli veya testle ayarlanmalıdır:

- Tüm kanonik balık adlarının ve bölge eşlemelerinin eksiksiz FishDB listesi.
- Marketin tüm satılık item ve fiyatlarının kesin listesi.
- Olta ve tekne seviyelerinin sayısal stat/fiyat tabloları.
- Balıkların tazelik zaman eşikleri ve gerçek/oyun zamanı kuralı.
- Envanter kapasitesi ve genişleme ücreti.
- Boss karşılaşmalarının tekrar sınırı olup olmayacağı.
- Zıpırleone’nin gizli mekanının tam kullanımı.
- Miyav Puanı’nın harcama ve kazanma koşulları.
- Tüm craft tariflerinin son materyal adetleri.
- Sandık drop ve ödül yüzdeleri.
- Günlük görev yenileme saati ve gün değişimi yöntemi.
- Sandık açmanın anlık mı yoksa bazı türlerde beklemeli mi olacağı.
- Tekne kozmetiklerinin ve dekorasyonun nihai kapsamı.
- Legendary yemlerin zorunlu mu, sadece bonus mu olduğu.
- Opsiyonel reklamın hedef dağıtım ortamındaki teknik uygulanabilirliği.

Bu maddeler **oyundan çıkarılmış özellikler değildir**; tam sürümün içerik ve denge verileri olarak tamamlanması gereken kısımlarıdır.

---

## 31. Kanonik kararların özeti

1. DÜMEN mizahi balıkçılık ve kasaba ilerlemesi oyunudur.
2. Yeni geliştirme hedefi mobil yatay HTML5/JavaScript, Codex ile sıfırdan kurulumdur.
3. Oyuncu ana sahil kasabasından bölgelere açılır.
4. Tekne evin önünde halatla bağlıdır ve dalgayla sallanır.
5. Martı başlangıçta tekneye konar, görev vermez, absürt yorum yapar.
6. Ev yanındaki ilan panosunda süreli ve süresiz garip balık siparişleri vardır.
7. Kabul edilen siparişler not defterine gider.
8. Fishing, sarma/gerilim/mesafe/İnat Barı ve **Çek** aksiyonu etrafında kurulur.
9. Aşırı sarma ipi koparabilir, uzun bırakma balığın kaçmasına yol açabilir.
10. Hazine oltayla yakalanır; yeşil/sarı/kırmızı zamanlama mini-game’i vardır.
11. Sandıklar envantere girer; ana ekranda değil Envanter’de açılır.
12. Sekiz bölge: Eski Liman, Tembel Sazlıklar, Paslı Sanayi Kanalı, Yakamoz Koyu, Titrek Buzullar, Batık Korsan Mezarlığı, Kaynar Kazan Deltası, Bermuda Girdabı.
13. Dokuz olta: Tahta, Dengeli, Sağlam, Hızlı Sarıcı, Usta, Buzkıran, Kızıl Isırgan, Pas Yiyen, Yakamoz Fısıldayan.
14. Dört özel olta Hurdacı Hasan’dan craft edilir.
15. Tekne seviye tabanlıdır; görünümü ve bonusları gelişir; bölge kilitlerinde belirleyicidir.
16. Yeni sokakta Zıpırleone’nin Mekanı, Geri Dönüşüm Fabrikası, Tekne Atölyesi vardır.
17. Bayat balıklar Geri Dönüşüm Fabrikası’nda değerlendirilir.
18. Don Zıpırleone, Miyav Puanı ve Kara Pazar Çarkı ile bağlantılıdır.
19. Müfettiş Tarçov kısa boylu ve siyah-beyaz rozetli köpektir; tek defa gelir ve ayrılır.
20. Tarçov × Zıpırleone beş görevlik erken hikâye, sonunda **Kara Pazar Çarkı** açılır; mahzen açılmaz.
21. Kara Pazar Çarkı her gün **1 ücretsiz + 2 reklamlı** hak verir.
22. Zıpırleone’nin orta oyun hikâyesi beş bölümdür ve finalde gizli mekan açar.
23. Komplo Teorisyeni’nin üç bölümlük hikâyesi sonunda dördüncü duvar kırılır.
24. Günlük görevler bol, kısa ve mizah odaklıdır.
25. Yeni oyun sürümünde veriler, runtime durum ve kayıt birbirinden ayrılır.
26. Satış, av, sandık, craft ve görev ödülleri yalnız bir kez işlendiği doğrulanan güvenli işlemlerdir.

---

## 32. Tam sürüm başarı tanımı

Oyuncu kolay anlaşılır ama ustalaşılabilir bir balık tutma sistemiyle karşılaşır; ilk oturumdan itibaren kasaba, NPC ve geliştirmelerin bağlantısını kavrar. Sekiz bölgenin tamamı birbirinden farklı hissedilir. Tüm satıcı, üretim, tazelik, görev, sipariş, sandık, tekne, koleksiyon ve hikâye sistemleri çalışır. Oyuncu sadece içerik bitirmek için değil, yeni balık, rekor, sandık ve komik sahne görmek için geri döner.

**Üretim hedefi:** Yalnız bir prototip değil, baştan sona oynanabilir, kaydı güvenilir, ekonomisi dengeli, mobilde rahat çalışan **tam sürüm DÜMEN**.

**Sonraki ayrı doküman:** Codex için modüler üretim Roadmap’i ve her aşamanın test/kabul kriterleri.
