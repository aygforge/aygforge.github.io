# CHANGELOG — Kepçe Ustası

## Alpha 0.1 — 20 Kasım 2026 (ilk oynanabilir sürüm)

### Eklendi
- Portrait iki yarılı oyun ekranı: üstte Şef + sebze düşmanlar, altta Matter.js fizikli tencere ve kepçe.
- Sağa-sola salınan, **tek dokunuşla** o anki konumundan inen, açılıp kapanan delikli kepçe (kevgir ağzı).
  Kepçenin her parçası gerçek bir çarpıştırıcıdır; yakalama yalnızca topçukların gerçek konumundan hesaplanır.
- Hibrit tencere: 30 topçukla başlar, yakalanmayanlar korunur, `add = min(36-remain, max(6, 24-remain))`
  ile yenilenir, hafif fiziksel karıştırma (impuls) uygulanır, yer yoksa topçuklar sıraya alınır.
- İki yağ: Normal (yük 1, hasar 1) ve Büyük (yük 2, tek atışta 3 hasar). Kapasite 7.
- Chapter 1 **Menemen** (6 dalga + Dev Domates 24 HP) ve Chapter 2 **Patates Kızartması**
  (6 dalga + Patates Kral 36 HP), GDD dalga tabloları, tarif sayaçları, servis sonucu.
- 6 normal düşman (domates, biber, yumurta, patates, zırhlı patates, tuz) + küçük domates minyonu + 2 boss.
- 16 koşu içi yetenek, dalga 1/3/5/6 sonunda 3 kartlık seçim, koşu başına 1 ücretsiz yeniden seçim.
- 6 kalıcı geliştirme hattı (GDD §12 maliyetleri ve değerleri), bahşiş ekonomisi, 1–3 yıldız, ilk servis bonusu,
  kısmi başarısızlık ödülü, chapter açılımı ve tekrar oynama.
- Sade restoran ana menüsü (OYNA/DEVAM ET, TARİFLER, GELİŞTİR, MAĞAZA, AYARLAR), oyun içi eğitim ipuçları,
  duraklatma, sonuç ekranı, ses/müzik/titreşim/düşük hareket/animasyon hızı ayarları.
- Sürümlü + sağlama toplamlı + yedekli kayıt, dalga başı checkpoint ve güvenli devam.
- Çevrimdışı service worker, `AdService` / `PurchaseService` soyutlamaları (tarayıcıda "unavailable").
- Özgün pixel art (30 PNG) ve sentez ses efektleri + döngüsel müzik (15 WAV), hepsi `tools/gen-assets.mjs` ile üretildi.
- Otomatik testler: birim/entegrasyon (Node), tohumlu toplu simülasyon, Playwright uçtan uca test.

### GDD'den sapmalar ve tasarım varsayımları (tamamı veri dosyasında tek yerden değiştirilebilir)

| Konu | GDD | Uygulama | Gerekçe |
|---|---|---|---|
| Tencere tabanı | Belirtilmemiş | Kavisli (ortası derin, kenarlar 120 px yüksek) tencere tabanı | Düz tabanda topçuklar eşit yayılıyor ve zamanlama önemsizleşiyordu (rastgele dokunuşla da 5–7 yük). Kavisli tabanda topçuklar ortada toplanır; kenarda 0–2, ortada 5–7 yük fiziksel olarak yakalanır. |
| Kepçe ağız yarıçapı | "Kapma collider geometrisi ayarlanır" | %100 genişlikte 44 px (oyun birimi); Kepçe Genişliği upgrade'i ve Geniş Kepçe yeteneği bu yarıçapı ölçekler | Ölçüm: iyi zamanlamada ~6,6 yük, rastgele dokunuşta ~3,4 yük. |
| Kepçe süreleri | 2,0 sn salınım; 1,2–1,6 sn iniş/kapanma/çıkış | Salınım 2,0 sn; iniş 0,50 + kapanma 0,37 + kaldırma 0,60 + bekleme 0,13 = **1,60 sn**; sonra 0,40 sn görsel geri dönüş | Kaldırma eğrisi yerçekiminden yavaş fren yapar; aksi halde topçuklar tepe noktasında kepçeden fırlıyordu. |
| Salınım genişliği | Erişilebilir genişliğin %80'i | `min(%80, duvara çarpmadan açık kepçenin sığdığı genişlik)` → temel kepçede ≈ %74 | Açık kepçe kanatlarının tencere duvarına girmemesi için. |
| Kapasite aşımı | "Alabildiği kadar" + kapasite | Kepçedeki topçuklar alttan üste sayılır; kapasiteyi aşan en üstteki topçuklar **fiziksel olarak tencereye geri dökülür** | Kapasite birimi ile topçuk adedi ayrı tutulur; rastgelelik yok. |
| Sağlam Kenar | "Fiziksel kenar +%10" | Kepçe kenar dudağının yüksekliği yarıçapın %30'u → %40 → %50; kaldırma sırasında hafif sarsıntı (±3 px) | Kenarın gerçekten dökülmeyi azaltması için kaldırmada hafif fiziksel salınım var. |
| Küçük domates minyonu | HP belirtilmemiş | 2 HP, normal domates hareketi, `tomato` tarifine sayılır, %80 ölçek | GDD: minyonlar tarifte tanımlıysa sayılabilir. |
| Dev Domates teması | "Boss için özel temas … olabilir" | 1 hasar + x=0,55'e güvenli geri çekilme, tur başına tek temas | Boss sahadan çıkmamalı. |
| Patates Kral teması | 2 HP hasar + geri çekilme | 2 hasar + x=0,60'a geri çekilme | Geri çekilme konumu varsayım. |
| Patates Kral ilk hareket | "Alpha testinde ayarlanır" | Hızlanmadan önce tek sayılı hareket fırsatlarında 1 adım (iki turda bir); %50 altında her tur 1 adım | GDD'deki örnek. |
| Dev Domates savunması | "Her üçüncü kendi aksiyonunda, ön uyarıdan sonra" | 2., 5., 8.… aksiyonda uyarı ("!"), 3., 6., 9.… aksiyonda savunma; savunma ilk gelen vuruşta 1 hasar emer | Ön uyarının bir tur önceden okunabilmesi için. |
| Dev Domates çağırma | Eşikte iki minyon, hareket eylemiyle | Çağırma o turun hareketinin yerine geçer; aktif düşman sınırı 8 | — |
| Tava Patlaması "yakına alan hasarı" | Yarıçap yok | 0,22 normalize yarıçaptaki tüm canlılar; kimse yoksa en yakın tek canlı | Kart hiçbir zaman etkisiz kalmasın. |
| Sos Sıçraması / Tava Yankısı "yakındaki" | Mesafe yok | En yakın canlı(lar), mesafeden bağımsız | Aynı gerekçe. |
| Atış sayaçları | "Her N. normal atış" | Koşu boyunca devam eden sayaçlar (tur başında sıfırlanmaz); geçici Güçlü Yağ ve kalıcı Atış Ustalığı ayrı sayaçlar | GDD: "sayaçlar birbirinden ayrı tutulur". |
| Tava Ustalığı | "Her N öldürmede sonraki salvolara +1; tur sayacı çift ödül üretmez" | Koşu boyu öldürme sayacı; turda en fazla 1 bonus yağ, artan sayaç devreder | — |
| Boş yakalama | ALPHA varsayımı | 1 normal "güvence damlası" (bonus, tencereden sayılmaz) | GDD önerisi aynen. |
| Kuyrukta hedef kalmazsa | "Mermi kuyruğu güvenle kapanır" | Kalan topçuklar harcanmaz ve kaybolur (tencereye dönmez) | Tencere zaten yenileniyor; tekrar sayım riski yok. |
| Boss ölümü | Anında zafer | Kalan mermiler de atılmaz; düşman eylemi/temas yok; sonuç tek kez | — |
| Siparişi bırakma | Belirtilmemiş | Duraklatma → "Siparişi bırak" = yenilgi, kısmi bahşiş formülü uygulanır | — |
| Checkpoint | "Son tutarlı wave checkpoint" | Her dalganın ilk kepçe turu başında snapshot; devam edilince o dalganın başı | Dalga içi ilerleme kasıtlı olarak saklanmaz → çift öldürme/ödül imkânsız. |
| Spawn | x≈0,90, y≈0,2–0,8 | x ∈ [0,86; 0,93], y ∈ [0,2; 0,8], en az ≈0,16 ayrım (yumuşatmalı) | HP barları üst üste binmesin. |
| Hedefleme "hız" | Belirtilmemiş | Biber 2, normal 1, zırhlı patates 0,5, Patates Kral 0,5 → hızlanınca 1 | — |
| Fizik motoru | Phaser 3 + Matter.js | Phaser 3.90 (sunum) + **bağımsız matter-js 0.20** (yalnızca tencere) | Aynı fizik kodu Node testlerinde başsız çalışabilsin; 60 Hz sabit adım, 3 alt adım. |
| Yatay tutma | "Dikey tut örtüsü" | Dokunmatik cihaz yatay + kısa yükseklikte örtü; masaüstünde ortalanmış portrait çerçeve | Masaüstü testi engellenmesin. |

### Değiştirilen sayılar
GDD tablolarındaki **hiçbir HP, dalga kompozisyonu, tarif hedefi, bahşiş, yetenek değeri veya upgrade maliyeti
değiştirilmedi.** Yalnızca GDD'nin açıkça "ayarlanır" dediği kepçe/tencere geometrisi yukarıdaki gibi belirlendi.

### Bilinen denge durumu
Simülasyonlar GDD sayılarıyla oyunun kolay olduğunu gösteriyor (ayrıntı: TEST_PLAN.md → Denge gözlemleri).
Sayılar bilinçli olarak korunmuştur; önerilen ayar seçenekleri TEST_PLAN.md'de listelenmiştir.

### Teknik notlar
- Çevrimdışı önbellek `ignoreVary` ile eşleşir (önizleme sunucusunun `Vary: Origin` başlığı modül betiklerinin
  önbellekten açılmasını engelliyordu; E2E testinde yakalandı ve düzeltildi).
- Ortak açılış `src/boot.js`; `src/main.js` yerel/itch.io derlemesi, `src/main.artifact.js` claude.ai önizleme
  derlemesi (Phaser/matter-js CDN'den, aynı oyun kodu).
- Uzun bilgi başlıkları ekran genişliğine sığacak şekilde ölçeklenir (dar ekranda taşma düzeltildi).
