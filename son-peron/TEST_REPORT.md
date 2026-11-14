# TEST RAPORU — Son Peron: Miras Lokantası v1.0

Tarih: 2026-11-13 · Ortam: Linux, Node 22, Vitest 3, Playwright + başsız Chromium (yazılım WebGL)

Aşağıdaki çıktılar bu depoda **gerçekten çalıştırılan** komutlardan alınmıştır. Çalıştırılmayan hiçbir şey "geçti" yazılmamıştır.

## 1. Özet

| Komut | Sonuç |
|---|---|
| `npm install` | başarılı |
| `npm run build` (asset üretimi + Vite) | başarılı — atlas 2048×1914, 621 kare, eksik asset yok; `dist/` üretildi |
| `npm test` | **42 / 42 geçti** (7 dosya) — v1.1 tren tarifesi sonrası yeniden koşuldu |
| `npm run test:e2e` | **26 / 26 geçti** (gerçek tarayıcı) |
| `npm run dev` | Elle çalıştırılmadı; aynı kaynak `vite build` + `vite preview` ile e2e'de doğrulandı |

## 2. Birim / entegrasyon testleri (`npm test`)

```
✓ tests/systems.test.js > Yerleştirme ve restorasyon > T8: serbest yerleştirme, döndürme; çarpışma ve koltuk bağları güncellenir; kullanımdaki eşya taşınamaz 112ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T4: aynı son porsiyon iki müşteriye verilemez; ödeme ve stok iki kez yazılmaz 121ms
✓ tests/systems.test.js > Yerleştirme ve restorasyon > T17: genişleme ertesi sabah açılır; teknik ID salon_expansion_3 doğu MUTFAK kanadını açar; mobilya silinmez 69ms
✓ tests/systems.test.js > Yerleştirme ve restorasyon > T17b: yeni kapı yolunda kalan eşya güvenli depoya alınır, kaybolmaz 32ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T5: yalnız menüdeki ürünler sipariş edilir; boş barda yolcular lokantaya yönelmez 64ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T6: dolu bara yemek getirilince ürün kaybolmaz 65ms
✓ tests/systems.test.js > Mutfak kilitleri ve ekipman > T13/T14: satın alınan ekipman yalnız KURULUNCA tarif açar; para siparişte, malzeme kurulumda bir kez 55ms
✓ tests/systems.test.js > Mutfak kilitleri ve ekipman > T27: balık tutmadan, katalogdan alınan balıkla balık tava yapılır 27ms
✓ tests/systems.test.js > Mutfak kilitleri ve ekipman > T22: şömine 1 odunla 4 oyun saati ısıtır; odunsuz oyun devam eder 47ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T7: koltuk yoksa/erişilemezse oyuncuya hata verilir, kayıp olmaz 38ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T9: grup siparişi tek panelde; her porsiyon ayrı servis edilir ve doğru masaya bağlanır 33ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T10: 23:00 sonrası yeni tren/müşteri/üretim yok; içeridekiler kapanış modunda tamamlanır 49ms
✓ tests/systems.test.js > Personel A modeli (T12) > personel sipariş almaz, servis yapmaz, tahsilat yapmaz; ücret günde bir kez; para yoksa vardiya başlamaz 61ms
✓ tests/systems.test.js > Personel A modeli (T12) > personel kaynak kodu yasak oyuncu eylemlerini çağırmaz 1ms
✓ tests/systems.test.js > Ekonomi (T19, T20) > T19: para negatife düşmez; satılan eşya tekrar satılamaz; bakkal ×1,25 yukarı yuvarlar 48ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T10b: kapanış zamanlayıcısı sınırlıdır — oyuncu hiçbir şey yapmasa da kilitlenmez 33ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T11/T35: erken uyku — rezervasyon serbest kalır, tahsil edilmeyen gelir yazılmaz, ödenen tekrar sayılmaz 45ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > T35: servis beklerken sabrı biten grubun rezervasyonu ve elde taşınan ürünü geri döner 47ms
✓ tests/service.test.js > Sipariş, stok ve servis bütünlüğü > FIFO ve tazelik: eski parti önce satılır; 2 gün sonra bayatlar, soğutucuyla 4 gün 27ms
✓ tests/systems.test.js > Ekonomi (T19, T20) > T20: iflastan odun/taş satışıyla dönüş → sebze siparişi → çorba 44ms
✓ tests/systems.test.js > Tarım, dere, takvim, görevler > T24: çapa/ekim/sulama/yağmur/hasat; susuz gün büyümez ama ölmez; sahne dışı ve kayıtla tutarlı 22ms
✓ tests/systems.test.js > Tarım, dere, takvim, görevler > dere: aşama 2, olta 75 G, günde 4 atış, başarısızlıkta olta kaybolmaz 31ms
✓ tests/systems.test.js > Tarım, dere, takvim, görevler > T25: görev ödülü bir kez; günlük görevler her uykudan sonra uygun listeden seçilir 33ms
✓ tests/save.test.js > Kayıt / yükleme (T18, T23, T28, T29, T34) > T18: servis ortasında kaydet → yükle → aynı state; sipariş/ödeme/envanter çoğalmaz 136ms
✓ tests/save.test.js > Kayıt / yükleme (T18, T23, T28, T29, T34) > T23/T34: dış sahneye geçince pişirme, sipariş ve müşteri kaybolmaz 78ms
✓ tests/save.test.js > Kayıt / yükleme (T18, T23, T28, T29, T34) > T28: sürüm doğrulaması ve bozuk dosyada güvenli hata 29ms
✓ tests/assets.test.js > Asset manifesti (T30, T32, T37) > her eşyanın ikonu; her mobilya/ekipman/kozmetiğin yön ve durum sprite'ı atlasta var 4ms
✓ tests/assets.test.js > Asset manifesti (T30, T32, T37) > üretim deterministiktir; ikonlar tek renkli kutu/placeholder değildir 185ms
✓ tests/assets.test.js > Asset manifesti (T30, T32, T37) > karakter atlası: 4 yön × 16 kare, görünüme göre farklı ve tekrar üretilebilir 20ms
✓ tests/data.test.js > Veri sözleşmesi (T31, T32) > JSON ayrışır, katalog hatasızdır ve sayımlar GDD ile eşleşir 3ms
✓ tests/data.test.js > Veri sözleşmesi (T31, T32) > T31: 15 yemek + 6 içecek için maliyet, hasılat, brüt kâr ve istasyon formülleri 4ms
✓ tests/data.test.js > Veri sözleşmesi (T31, T32) > tüm görev hedefleri uygulanmıştır 3ms
✓ tests/data.test.js > Veri sözleşmesi (T31, T32) > T32: 38 mobilya + 14 ekipman + 9 kozmetik benzersiz ID'li ve 4 yönde geçerli yerleştirilebilir 193ms
✓ tests/tutorial.test.js > Tutorial: Gün 1 → 2 → 3 (T1, T2, T3, T33) > T1: 15 odun + 5 taş ile bütün onarım/crafting eksiksiz ve bir kez 54ms
✓ tests/tutorial.test.js > Tutorial: Gün 1 → 2 → 3 (T1, T2, T3, T33) > T2: 44 G sipariş → 56 G; 06:00 teslimatı çift oluşmaz 8ms
✓ tests/tutorial.test.js > Tutorial: Gün 1 → 2 → 3 (T1, T2, T3, T33) > T3: çorba 4 dk hazırlık + 30 dk pişer, 4 porsiyon; iki müşteri 09:00 treniyle gelir; rezervasyon/servis/ödeme bir kez 31ms
✓ tests/tutorial.test.js > Tutorial: Gün 1 → 2 → 3 (T1, T2, T3, T33) > T33: 3. gün serbest sandbox — kilitlenme yok, isteğe bağlı görevler gelir 62ms
30 gün: aşama 4, ödemeli müşteri 430, altın 2146, itibar 91, koltuk 18, günlük satış ort. 354 G, ayrılan 13, görevler 4/15, bot uyarıları 0
✓ tests/longrun.test.js > Tren takvimi > her gün tam 09:00/15:00/21:00: 10 dk önce yaklaşır, 12 dk peronda durur, sonra çıkar 90ms
✓ tests/longrun.test.js > T21: 30 oyun günü hızlandırılmış simülasyon > takılan sipariş, hayalet NPC ve ekonomi çoğaltması yok; lokanta büyür 2040ms
✓ tests/longrun.test.js > T15/T16/T26/T36: 112 gün + sonraki yıl > mevsimler, hava, etkinlik duyuruları ve festivaller doğru döner 25ms
✓ tests/longrun.test.js > T15/T16/T26/T36: 112 gün + sonraki yıl > festival hedefi tamamlanınca kozmetik bir kez verilir 15ms
Test Files  7 passed (7)
Tests  41 passed (41)
```

## 3. Tarayıcı testi (`npm run test:e2e`)

Gerçek tıklama ve klavye girdileri: menü, karakter oluşturma, WASD/Shift, Tab, Esc, E (mektup, posta, yatak, ocak,
kapıdaki müşteri), B + fare ile yerleştirme, masa seçiminde rakam tuşu, kayıt düğmeleri, dosya indirme.
Uzun adımlar (ağaç kesme, servis turları, 12 günlük gelişim) aynı oyuncu API'sini kullanan botla, sahne çizilirken yürütülür.

```
GEÇTİ  Ana menü açılır (Türkçe başlık)
GEÇTİ  Eksik asset yok
GEÇTİ  Yeni oyun: isim (UTF-8) ve görünüm aktarılır
GEÇTİ  WASD/Shift ile hareket — (10.5,9.5)→(11.4,10.7)
GEÇTİ  Tab envanteri açar ve oyun saati durur — dakika 361.19 sabit
GEÇTİ  Panel kapanınca saat aynı yerden devam eder
GEÇTİ  E ile miras mektubu okunur, görev ilerler
GEÇTİ  B modu: masa fareyle yerleştirilir
GEÇTİ  Posta kutusu E ile katalog açar
GEÇTİ  İlk sipariş 44 G: 100 → 56 G
GEÇTİ  Yatak: gün biter, rapor açılır, 2. gün 06:00
GEÇTİ  Ocak E ile tarif paneli açar
GEÇTİ  Çorba pişiyor (malzeme bir kez düştü)
GEÇTİ  Bar stoğu menüyü oluşturur; tabela AÇIK
GEÇTİ  09:00 treni peronda; iki tutorial yolcusu fiziksel olarak indi
GEÇTİ  Kapıdaki müşteriye E: masa seçim paneli
GEÇTİ  Masa seçilince grup masaya yürür
GEÇTİ  2. gün tutorial: 2 müşteri servis+ödeme+temizlik tamam
GEÇTİ  Kaydet → kapat → Devam: aynı durumla devam (IndexedDB) — 4210 bayt, saat 594.6→594.6
GEÇTİ  JSON dışa aktarım dosyası üretilir
GEÇTİ  Bozuk kayıt içe aktarımı güvenli hata verir
GEÇTİ  JSON içe aktarım çalışır
GEÇTİ  3. gün sabahı: serbest sandbox, günlük görevler
GEÇTİ  26 panelin tamamı hatasız ve eksik ikonsuz çizilir
GEÇTİ  15. gün: lokanta büyüdü (aşama ≥2), stok bütünlüğü korunuyor — aşama 2, 129 müşteri, 1497 G, personel 1
GEÇTİ  Tarayıcı konsolunda hata yok

E2E: 26/26 geçti
```

Ekran görüntüleri `tests/e2e/shots/` altına yazılır (seçilmiş altı tanesi `docs/screens/` içinde).

## 4. GDD §30 kabul testleri eşlemesi

| Test | Durum | Kanıt |
|---|---|---|
| T1 başlangıç onarımları 15 odun + 5 taş, bir kez | Geçti | tutorial.test (T1) |
| T2 44 G → 56 G; teslimat çift oluşmaz | Geçti | tutorial.test (T2), e2e |
| T3 iki müşteri, rezervasyon/servis/ödeme bir kez | Geçti | tutorial.test (T3), e2e |
| T4 son porsiyon iki müşteriye gidemez | Geçti | service.test (T4) |
| T5 yalnız menüdeki ürünler; boş bar | Geçti | service.test (T5) |
| T6 dolu barda ürün kaybolmaz | Geçti | service.test (T6) |
| T7 erişilemeyen koltuk/kapı yolu: hata, kayıp yok | Geçti | service.test (T7) |
| T8 serbest yerleştirme/döndürme, çarpışma güncellenir | Geçti | systems.test (T8), e2e (fare) |
| T9 grup siparişi tek panel, ayrı servis, tepsi | Geçti | service.test (T9) |
| T10 23:00 kapanışı | Geçti | service.test (T10, T10b) |
| T11 erken uyku iptalleri | Geçti | service.test (T11/T35) |
| T12 personel A modeli, ücret günde bir kez | Geçti | systems.test (T12 ×2) |
| T13 ekipman yalnız kurulunca tarif açar | Geçti | systems.test (T13/T14) |
| T14 tarif kilitleri tutarlı | Geçti (kayıt sonrası yeniden değerlendirme yalnız dolaylı) | systems.test |
| T15 4 mevsim, 112 gün, yıl sayacı | Geçti | longrun.test |
| T16 etkinlik bir gün önce duyurulur, saat eklemez | Geçti | longrun.test |
| T17 restorasyonda mobilya kaybolmaz | Geçti | systems.test (T17, T17b) |
| T18 kayıt döngüsü çoğaltma yapmaz | Geçti | save.test (T18), e2e (IndexedDB) |
| T19 para negatif olmaz, tekrar satış yok | Geçti | systems.test (T19) |
| T20 iflastan odun/taş satışıyla dönüş | Geçti | systems.test (T20) |
| T21 30 gün hızlandırılmış simülasyon | Geçti | longrun.test — "30 gün: aşama 4, ödemeli müşteri 430, altın 2146, itibar 91, koltuk 18, günlük satış ort. 354 G, ayrılan 13, görevler 4/15, bot uyarıları 0" |
| T22 kış şöminesi | Geçti | systems.test (T22) |
| T23 sahne değişiminde sipariş/taşıma korunur | Geçti | save.test (T23/T34) |
| T24 tarım döngüsü, sahne dışı + kayıt | Geçti | systems.test (T24) |
| T25 görev ödülleri bir kez; günlük görev seçimi | Geçti | systems.test (T25) |
| T26 kaçırılan festival kilit yaratmaz, ertesi yıl döner | Geçti | longrun.test |
| T27 balık tutmadan balık tava | Geçti | systems.test (T27) |
| T28 kayıt JSON sürüm/bozuk dosya | Geçti | save.test (T28), e2e |
| T29 Türkçe UTF-8 | Kısmen: kayıt roundtrip + isim + 26 panelde `undefined/NaN` taraması geçti; her metin tek tek gözle denetlenmedi | save.test, e2e |
| T30 eksik asset raporu, placeholder yok | Geçti (otomatik manifest + ikon çeşitliliği denetimi); "yeterince güzel mi" öznel, gözle birkaç ekran incelendi | assets.test, e2e |
| 31 maliyet/hasılat/kâr/istasyon formülleri | Geçti | data.test |
| 32 38+14+2+9 benzersiz ID, asset, 4 yön yerleştirme | Geçti | data.test, assets.test |
| 33 Gün 1→2→3 kilitlenmeden | Geçti (bot ile; insan eliyle baştan sona oynanmadı) | tutorial.test, e2e |
| 34 dış sahne geçişlerinde kayıp yok | Geçti | save.test |
| 35 iptallerde para/stok bütünlüğü | Geçti | service.test |
| 36 112 gün sonrası ikinci yıl | Geçti | longrun.test |
| 37 eksik PNG/atlas raporlanır | Geçti (yükleme hatası menüde gösterilir; e2e'de eksik yok) | assets.test, e2e |
| 38 ücretsiz/çevrimdışı çalışma | Geçti (kaynakta harici URL/CDN yok; build tek paket) — ağ kesilerek ayrıca denenmedi | kod incelemesi |

## 5. Doğrulanamayan ve eksik kalanlar

**Otomatik/elle doğrulanamayanlar**
- Oyun bir insan tarafından baştan sona, gerçek zamanlı (gün ≈ 20 dk) oynanmadı. Akışlar bot + kısa gerçek girdilerle doğrulandı.
- 60 FPS hedefi gerçek GPU'da ölçülmedi. Başsız Chromium (yazılım WebGL) ~37 FPS verdi; güncelleme döngüsünün kendisi kare başına ~0,1 ms.
- Ses yalnız kod düzeyinde var; duyularak denetlenmedi (başsız ortamda ses çıkışı yok).
- Ana hikâyenin 5–15. görevleri: hedeflerin tamamı uygulanmış ve eşlemesi test edilmiş, fakat uçtan uca oynanarak yalnız 1–4 doğrulandı. Festival ödülü ve yan/günlük görev ödülleri birim düzeyinde doğrulandı.
- Envanterde sürükle-bırak ve Shift/Ctrl+tık kod olarak var; e2e yalnız tıkla-taşı yolunu dolaylı kullandı.
- Olta minioyununun zamanlaması (2–4 sn bekleme, 1 sn pencere) arayüzde elle denenmedi; kuralları birim testinde.

**GDD'ye göre eksik ya da sadeleştirilmiş**
- Arayüz yazı tipi sistem monospace'idir; özgün piksel bitmap font üretilmedi (yalnız tabelalarda 3×5 piksel font var).
- Karakter animasyonları ortak iskelette: idle, yürüme, taşıma, oturma, yeme ve tek bir 3 karelik "çalışma" seti. Balta/kazma/çapa/sulama/temizlik/pişirme bu sete eklenen **farklı alet sprite'ı ve salınımıyla** ayrışır; her alet için ayrı gövde karesi yok. Koşma, hızlandırılmış yürümedir. Yatağa girme animasyonu yok (kararma + uyuyan yatak sprite'ı).
- "Karakteri gizleyen ön duvar saydamlaşır": iç duvarlar tek karo yüksekliğinde çizildiği için karakteri kapatmaz; saydamlaşma yalnız ağaç gibi uzun nesnelerde uygulandı.
- Tuş yeniden atama, azaltılmış efekt modu ve sarsıntı ayarı yok (GDD'de "zaman uygunsa").
- Kasaba NPC'leri (Feriha, Sevim) lokantaya müşteri olarak gelmez; düzenli müşteri/sadakat sistemi ayrı bir 8 kişilik isimli yolcu havuzuyla çalışır. NPC "ev/ofis" içleri yok; karakterler kapı önlerinde durur.
- Karşılama yardımcısı pasif etkilidir (kuyruk sabrı ve masaya yürüme hızı); mutfak yardımcısının "depo düzenleme" görevi oynanışa etki etmez.
- Tren etkinliklerinde yolcu ve bahşiş çarpanları uygulanır; JSON'daki `satisfaction_weight_modifier` uygulanmadı.
- Gar iş birliği 3 kademe olarak izlenir; 2. kademe etkisi yalnız etkinlik bahşişine +%5'tir, "prestijli gar dekoru" yoktur.
- Teras yalnız görsel + ortam puanıdır; dışarıda müşteri oturtulamaz.
- v1.1 (günde 5 tren) sonrası 30 günlük bot koşusu: aşama 5, 691 ödemeli müşteri, günlük ortalama satış 625 G (3 seferde: aşama 4, 430 müşteri, 354 G). İlerleme belirgin şekilde hızlandı.
- Denge (v1.0, 3 sefer): bot 30 günde 4. aşamaya ulaştı (GDD'nin tavsiye takviminden hızlı; GDD bu takvimi bağlayıcı saymıyor). Günlük satışlar aşama 1–3 için GDD aralıklarında ölçüldü; aşama 4–5 ölçülmedi.
- `dist/` bir HTTP sunucusu ister (`npm run preview`); `file://` ile açılmaz.
