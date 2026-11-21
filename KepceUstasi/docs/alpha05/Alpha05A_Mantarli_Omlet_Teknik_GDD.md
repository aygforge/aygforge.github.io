# Kepçe Ustası — Alpha 0.5A Teknik GDD v1.0

**Durum:** Uygulanacak içerik/tasarım önerisi; mevcut Alpha 0.4C çalışan kaynak kodu bu teslimde bulunmadığı için birebir şema uyumu doğrulanmamıştır.
**Amaç:** Alpha 0.4C'nin Level 1–20'sini bozmadan, Mantarlı Omlet chapter'ı için 21–30'u eklemek. Yeni tekrar hissi yaratmadan özgün düşman davranışı getirmek.

## 1. Değişmez kurallar

Tek isimsiz Şef, portrait üst savaş/alt fiziksel kepçe, sağdan sola ve **yalnız düşman fazında hareket**, 24 mevcut koşu içi yetenek, gerçek Matter.js yakalama ve hibrit tencere; dört ekipman, enerji, iki dungeon, bahşiş, kayıt, reklam köprüleri ve tüm Level 1–20 korunur. Yeni oynanabilir karakter, ayrı oyun modu, ağır animasyon, sınırsız summon veya paralel savaş motoru yoktur. Level 21–30 her biri bir run, 10 enerji; dalga sayısına göre 3–6 yetenek seçimi.

## 2. İçerik özeti

| Level | Başlık | Normal dalga | Farklılık | Önerilen SG | Final HP | Baz bahşiş |
|---:|---|---:|---|---:|---:|---:|
| 21 | İlk Mantarlı Omlet | 3 | Yeni Lezzet | 165 | 20 | 112 |
| 22 | Çatlayan Kabuk | 4 | Kabuk Kır | 169 | 24 | 115 |
| 23 | Koruyucu Şapkalar | 4 | Kalkan Desteği | 174 | 22 + 16 | 118 |
| 24 | Kabuk ve Kalkan | 5 | İki Tehdit | 178 | 23 + 22 | 121 |
| 25 | Elit Şapka | 5 | Mini Boss | 191 | 38 | 124 |
| 26 | Yumurta Telaşı | 3 | Yumurta Sürüsü | 185 | 22 | 127 |
| 27 | Kalkan Zinciri | 4 | Koruyucular | 190 | 29 + 22 | 130 |
| 28 | Kabuğun Altında | 5 | Yakın Tehlike | 197 | 34 | 133 |
| 29 | İkili Mutfak | 5 | Çift Elit | 203 | 28 + 30 | 136 |
| 30 | Koca Mantar | 6 | Chapter Boss | 216 | 72 | 139 |

Normal dalga 3–6 arasında; final karşılaşması ayrıca vardır. 21–24 öğretici mekanik adımları, 25 mini boss, 26 kısa kalabalık koşu, 27 koruma kombinasyonu, 28 yakın doğum baskısı, 29 iki elit, 30 Koca Mantar chapter boss.

## 3. Normal düşman verileri (final HP override'ları hariç)

| ID | Yemek sayacı | Baz HP | Kalkan | Hareket | Davranış |
|---|---|---:|---:|---|---|
| `mushroom` | mushroom | 7 | 0 | [1] | Normal |
| `mushroom_guard` | mushroom | 9 | 0 | [1] | Kalkan veren koruyucu |
| `onion` | onion | 8 | 2 kabuk | [1], kırıldıktan sonra [1,2] | Kabuk kırılınca hızlanır |
| `egg` | egg | 3 | 0 | mevcut | Eski yumurta sprite ve davranışı |

Normal HP `round(baseHp * stage.enemyBalance.hpScale)`; en az 1. **Kabuk/kalkan HP bu çarpanla tekrar çarpılmaz.** Koruyucu Mantar piştiğinde 1 adet mantar malzemesi sayılır. Koruyucunun eklediği `shield` ile soğanın kendi `shellHP` değeri **ayrı katmanlardır**: hasar sırası **harici kalkan → doğal kabuk → HP**. Kabuğun kalan hasarının HP'ye aktarılması mevcut zırh kurallarını izler. Bu ayrım kabuk kırılınca hızlanma tetiklenmesini doğru kılar.

### Koruyucu Mantar

- Hayatta kaldığı kendi 3. ve 6. düşman eyleminde, normalize yatay mesafesi en fazla `0.26` olan en yakın **mantar koruyucu olmayan** müttefiğe **+2 kalkan** verir.
- Verilen kalkanın bir düşmanda ulaşabileceği üst sınır **3**. Pulse sayısı koruyucu başına en fazla **2**.
- Aynı düşman eylemi boyunca birden çok koruyucu uygun olsa bile **en fazla 1 kalkan verme olayı** gerçekleşir. Öncelik sabit düşman ID sırasıdır.
- Hedef yoksa o pulse kullanılmadan geçer, sonradan telafi edilmez. Kendini veya başka koruyucuyu koruyamaz.
- Kısa kalkan ikonu/sayacı yeterli; yeni saldırı animasyonu gereksiz.

### Kabuklu Soğan

- Başlangıç `shellHP=2`. Kabuk kırılsa bile **aynı saldırı içinde aniden yürümez**.
- Sonraki düşman hareket fazlarından itibaren sıra ile **1,2,1,2…** adım ilerler. Kabuğu kırılmamışken her faz 1 adım.
- Yeniden kabuk üretmez. Kırılma anında küçük çatlak işareti ve hız ikonu gösterilir.

### Koca Mantar (L30)

- **72 HP + 4 başlangıç kalkanı**, başlangıç `x=0.70`, temas hasarı 2, ilk hareket paterni `[1]`.
- HP ilk kez **%50 veya altına** düştüğünde yalnızca **bir kez** iki normal mantar çağırır (6 HP'li, tarifte mantar sayılır); çağırma bir sonraki düşman eyleminde gerçekleşir. Boss bu arada ölürse çağırma iptal.
- İkinci fazda hareket paterni `[1,2]` olur. Yeni yol şeridi veya dikey yürüyüş eklenmez.
- Boss her 3. kendi düşman eyleminde en fazla iki kez kalkan güçlendirmesi yapar: yaşayan çağrılmış mantara +2 (maksimum 3), hiç yoksa kendine +1 (maksimum 4 kalkan).
- Boss ölünce bekleyen çağırmalar, diğer eylemler ve sonradan gelecek hasarlar iptal olur; zafer ve ödül bir kez gerçekleşir. Koca Mantar için yeni uzun animasyon yok; büyük mantar sprite ve kısa efekt yeterli.

## 4. Dalga tabloları

Kısaltmalar: **M** mantar, **K** koruyucu mantar, **S** soğan, **Y** yumurta. Tam sayılı JSON doğrudan veri kaynağıdır.

| Level | Dalga kompozisyonları (sırayla) |
|---:|---|
| 21 | 2 yumurta, 1 mantar / 2 mantar, 1 yumurta / 1 soğan, 1 mantar |
| 22 | 2 soğan, 1 yumurta / 1 soğan, 1 mantar / 2 soğan, 1 yumurta / 2 soğan, 1 mantar |
| 23 | 1 koruyucu mantar, 1 mantar, 1 yumurta / 1 koruyucu mantar, 1 soğan, 1 mantar / 1 koruyucu mantar, 2 mantar, 1 yumurta / 1 koruyucu mantar, 1 soğan, 2 mantar |
| 24 | 2 soğan, 1 mantar / 1 koruyucu mantar, 2 mantar / 2 soğan, 2 yumurta / 1 koruyucu mantar, 1 soğan, 2 mantar / 2 soğan, 1 koruyucu mantar, 2 yumurta |
| 25 | 2 mantar, 2 yumurta / 1 koruyucu mantar, 2 soğan / 1 koruyucu mantar, 2 mantar, 1 yumurta / 2 soğan, 2 mantar / 1 koruyucu mantar, 1 soğan, 2 yumurta |
| 26 | 5 yumurta, 1 mantar / 4 yumurta, 2 soğan / 5 yumurta, 2 mantar, 1 koruyucu mantar |
| 27 | 1 koruyucu mantar, 2 mantar / 2 soğan, 1 koruyucu mantar / 2 koruyucu mantar, 1 mantar, 2 yumurta / 1 koruyucu mantar, 2 soğan, 2 mantar |
| 28 | 2 soğan, 2 yumurta / 3 soğan, 1 mantar / 2 soğan, 1 koruyucu mantar / 3 soğan, 2 yumurta / 2 soğan, 2 mantar, 1 yumurta |
| 29 | 1 koruyucu mantar, 2 soğan / 2 mantar, 3 yumurta / 1 koruyucu mantar, 2 soğan, 1 mantar / 2 soğan, 2 yumurta, 1 koruyucu mantar / 1 koruyucu mantar, 2 mantar, 2 soğan |
| 30 | 2 mantar, 2 yumurta / 2 soğan, 1 mantar / 1 koruyucu mantar, 2 mantar, 1 yumurta / 2 soğan, 1 koruyucu mantar, 1 mantar / 1 koruyucu mantar, 2 soğan, 2 yumurta / 1 koruyucu mantar, 2 soğan, 2 mantar, 2 yumurta |

Her level için tarifler JSON'da belirlenmiştir. Dalga içindeki toplam düşman malzemesi sayısı, tarif hedeflerine ulaşmak için yeterlidir; ancak hepsinin tavaya düşmesi garanti olmadığından yıldız farkı devam eder. Finaldeki yenilmiş koruyucu mantar da mantar sayacını en fazla bir kez ilerletir.

## 5. Mini boss ve çift final

- **L25 Elit Şapka:** 38 HP + 3 kalkan; HP %50'nin altına ilk kez indiğinde bir kez +2 kalkan, toplam kalkan sınırı 4. Minyon üretmez.
- **L23, L24, L27 ve L29 çift final:** iki final düşmanı **ikisi de** yenilmeden zafer olmaz. Düşmanlardan biri kaçarsa mevcut final başarısızlık/kaybetme kuralı uygulanır; başarısızlıkta tek sefer ödül koşulları korunur.
- **L30:** Koca Mantar boss'unun ölmesi bölüm zaferinin tek otoritesidir; önceden çağırdığı mantarları bitirmek şart değildir.

## 6. İlerleme, ekonomi, açılımlar

- L21'e erişim: L20 ilk tamamlanmış olmalı; mevcut kayıtlar ve L1–20 progress korunur.
- L21–30 enerji maliyeti her girişte 10; devam edilen aynı run'dan tekrar enerji düşmez.
- Baz bahşiş L21=112'den L30=139'a uzanır; ilk tamamlama bonusu L21=56'dan L30=70'e çıkar (tüm kesin değerler JSON'da).
- Star çarpanları 1/1.15/1.30; mevcut yıldız ve tarif değerlendirme mantığı korunur.
- L25'te gelecekte açılacak Boss Mutfağı için `boss_kitchen_future_eligibility` bayrağı kaydedilebilir; mod 0.5B'de eklenene dek kullanılmayan buton gösterme.
- L30, Chapter 4 için `chapter4_pasta_future_eligibility` bayrağını hazırlar. Chapter 4 henüz oynanabilir olmadığı için doğrudan başlatma seçeneği gösterme.
- L21–30 için hiçbir SG sert kilidi veya ücret gereksinimi yoktur. L25 ve L30 birer **softwall** olarak önerilir. Bütün sayıların oyun içi gerçek dengesi oynanışla teyit edilecektir.

## 7. Teknik entegrasyon notları

- Kaynak referansı **önceki Alpha04C JSON tasarım sözleşmesidir**; gerçek Alpha04C kaynak ZIP'i paylaşılmadığından `level`, `chapterId`, `waves`, `enemyBalance`, `finalEncounter`, `stageIdentity` gibi alanları çalışma koduna birebir uyarlama zorunluluğu doğabilir.
- Yeni düşmanları mevcut `EnemyDirector`, `CombatResolver`, `RecipeTracker` ve `RunController` üzerinden veri odaklı uygula; yeni bir combat authority yazma.
- Kalkan durumları ve soğan kabuğu fazı dalga başı/koşu snapshot'larına dahil olmalı. Aynı run ikinci kez ödül vermemeli.
- Önceki sürümde yarım kalmış L1–20 run'ları varsa 0.5A yeni dalga şemasına dönüştürülmemeli; eski level tanımları korunmalı.
- Görsel bütçe: mantar, soğan ve büyük mantar için basit özgün sprite; koruyucu mantar mevcut mantarın rengi/ikonu ile farklılaşabilir. Yumurta sprite'ı yeniden kullanılmalı.

## 8. Kısa test bütçesi (Claude limitini korumak için)

`npm run build` + yeni davranışları hedefleyen birkaç birim testi + **en fazla 3 kısa smoke koşusu**. Öncelik: L22 kabuk, L23 koruyucu, L25 mini boss, L29 iki final, L30 çağırma+zafer, eski kayda uyumluluk. 100+, 1000+ seed, çoklu denge araması, benchmark veya sayfalarca analiz **yapılmayacak**. Teslim özeti 10 satırdan kısa.

## 9. Kesinleşmiş / önerilen ayrımı

Kesinleşmişler: tek isimsiz Şef, portrait iki yarı, fiziksel kepçe ve hibrit tencere, tur sonu yatay düşman yaklaşması, mevcut 24 yetenek, dört ekipman yuvası, enerji ve dungeon altyapısının korunması. **Yeni HP değerleri, pulse süreleri, boss HP/fazı, SG hedefleri, ödüller ve dalga kompozisyonları tasarım önerisidir**, uygulama ve gerçek oyuncu geri bildirimiyle ayarlanabilir.
