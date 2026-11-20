# CozFis — Çeviri Denetimi (Translation Audit)

Denetlenen dosya: `CozFis_Multilanguage_v1.html` · Toplam anahtar: **2.207** · Kaynak dil: Türkçe

## 1. Dil bazında eksik anahtar sayısı

| Dil | Toplam | Çevrilmiş | Eksik | Fazla | Parametre/etiket uyumsuz | Çalışma anında geri dönüşe düşen |
|---|---|---|---|---|---|---|
| English (`en`) | 2.207 | 2.207 | **0** | 0 | 0 | 0 |
| Español (`es`) | 2.207 | 2.207 | **0** | 0 | 0 | 0 |
| Deutsch (`de`) | 2.207 | 2.207 | **0** | 0 | 0 | 0 |
| Français (`fr`) | 2.207 | 2.207 | **0** | 0 | 0 | 0 |
| Português (Brasil) (`pt-BR`) | 2.207 | 2.207 | **0** | 0 | 0 | 0 |

Kaynak: oyun içi `I18N.validate()` (QA paneli → “Çeviri doğrulaması”) ve derleme betiğinin etiket/parametre kontrolü. Derleme, bir çeviride HTML etiketi ya da `{n}` parametresi eksik/fazla olursa dosyayı üretmez.

Metin hacmi (karakter): tr 113.282 · en 117.170 · es 125.835 · de 124.012 · fr 129.367 · pt-BR 122.568.
Dile özgü çoğul kalıbı (`{n|tekil|çoğul}`) kullanan mesaj: en 22 · es 36 · de 36 · fr 35 · pt-BR 36.

## 2. Çevrilmeden kalmış oyuncuya dönük metinler

**Oyuncuya dönük çevrilmemiş metin yoktur.** Kaynakla bilerek aynı bırakılanlar:

| Tür | Anahtarlar | Gerekçe |
|---|---|---|
| Özel adlar | `sys2.selcuk`, `sys3.riza`, `d.rival.mert/elif/efe.name` (+ NPC adları Zeynep, Nihat, Bora, Bahar, Selin, Kerem, Hasan, Halil, filo balıkçıları Tuna, Ozan, Melis, Duru, Kemal, Nil) | Karakter adı; unvanları ise çevrildi (Fatma Teyze → Auntie Fatma / Tía Fatma / Tante Fatma / Tata Fatma / Tia Fatma vb.) |
| Uluslararası tür adları | `d.fish.wahoo.name` (en, de), `d.fish.opah.name` (en, es, fr, pt), `d.fish.barrakuda.name` (de: Barrakuda), `sys3.fulmar` (pt) | Hedef dilde yerleşik ad zaten budur |
| Hedef dilde aynı yazılan kelimeler | `core.motor`, `sys.motor_n` (es, de, pt: Motor), `ui.menu` (de: Menü), `save.set_n` (en, de: Set), `ui2.manuel_n` (fr: Manuel), `sys3.spin` (en: Spin) | Doğru çeviri kaynakla aynı |
| Yalnız sayı/birim şablonu | `ui2.n_n_n_n_cm`, `ui2.n_cm`, `ui2.n_n_n_n_n_2`, `ui.n_menu` (de) | Çevrilecek kelime içermiyor (cm, kg, simge) |

Geliştiriciye dönük (oyuncu görmez) ve bu nedenle Türkçe bırakılanlar:
- **QA / Test paneli** (`?debug=1` veya F3) arayüzü ve 149 kabul testinin adları/bilgi satırları.
- 4 dahili `Error` mesajı (`transfer tutarsız`, `tutarsız`, `dağılım tutarsız`, `yer açılmadı`) — atomik işlem katmanı bunları yakalar, oyuncuya çevrilmiş “Beklenmeyen hata, işlem geri alındı.” mesajı gösterilir.
- `console.*` günlük mesajları ve kaynak kod yorumları.

Kullanıcı verisi olduğu için çevrilmeyenler: oyuncunun girdiği ad, tekne isim levhası, olta seti adları ve yeni oyunda atanan varsayılan değerleri (o anki dilde atanır).

## 3. Kontrol edilen ekranlar

Her dil için hem **temiz açılışta** hem **Türkçe başlayıp oyun ortasında dil değiştirerek** (zengin durum: tüm tekneler, ekipman, 70 tür, gün 14 şenliği, 3 uyku, 6 atış) aşağıdaki çıktılar alındı ve karşılaştırıldı — **5 dilde fark 0**:

- **Sahneler:** Ana menü, Karakter oluşturma, Kasaba, Ev, İskele avı (HUD + alt çubuk), Deniz haritası, Gün sonu raporu, mücadele HUD'u (canvas), kasaba tabelaları, ev içi.
- **Paneller (UI.P):** Menu, Inventory, Settings, Help, Dialog (Efe, Zeynep, Fatma Teyze, Muhtar Hasan, Ali Dayı), Encyclopedia (liste + tür kartı), Achievements, Statistics, Orders, TackleShop, Boatyard (+ sekmeler), BoatLoadout, FishMarket, Bakery, Boutique, HomeGoods, Wardrobe, Decor, Square, Teahouse, Trophies, Journal (rehber, bugünkü av, kayıtlar, eksik türler, favoriler, trofe, kıyı, deniz yaşamı), Plan, Trade, Finance, People, Records, Aquarium, Projects, TripLog, FleetJobs, FleetDeliver, Guild, Stories (hikâyeler + albüm).
- **Ek:** HUD çipleri ve `title` ipuçları, öğretici şeridi, toast'lar, onay pencereleri, kayıt içe/dışa aktarma pencereleri, döndürme ekranı, `<title>` ve meta açıklama.
- **Yerleşim:** 740×360 (küçük telefon yatay) ve 844×390'da 34 ekran × 6 dil taşma taraması → taşma yok. (Defter'in sekme çubuğu orijinal oyunda da yatay kaydırmalıdır.)

## 4. Özel karakter ve font testleri

**Bitmap fonta eklenen glifler:** `Á À Ä Ã Å É È Ê Ë Í Ì Ï Ó Ò Ô Õ Ú Ù Ñ Ÿ Ý ¿ ¡ « » „ " ‘ ’ ; = * # _ [ ] º ◀ ▶ → ← ✓ ★ < — −` (mevcut Türkçe glifler `Ç Ş Ğ Ö Ü İ Â Î Û` korundu).

**Büyük harf dönüşümü (dile göre):**

| Girdi | tr | en/es/fr/pt | de |
|---|---|---|---|
| `istavrit` | `İSTAVRİT` | `ISTAVRIT` | `ISTAVRIT` |
| `Kühle Strömungen` | — | — | `KÜHLE STRÖMUNGEN` |
| `Großer Geißbrassen` | — | — | `GROSSER GEISSBRASSEN` |
| `Pêche`, `Jardín`, `Coração` | — | `PÊCHE`, `JARDÍN`, `CORAÇÃO` | — |

**Kapsam taraması:** 6 dilde toplam ~730 bin karakterlik metnin tamamı `fontNorm()`'dan geçirildi. Canvas'a çizilen dizgelerde (tabelalar, logo alt yazısı, harita, HUD, ev) desteklenmeyen karakter **0**. Glifi olmayan ve yalnızca HTML'de (sistem fontuyla) kullanılan semboller: `✕ ✗ ☆ ≤ ≥ ≈ ▮` (+ fr `°`) — canvas'a çizilmez; çizilseydi `?` yerine boşluk/taban harfe düşerdi.

**Uzunluk ve sığma:** 
- Logo alt yazısı (“A CALM FISHING TALE” / “UNE PAISIBLE HISTOIRE DE PÊCHE” …) ortalanıyor.
- Balık yön uyarısı kutusu metin uzunluğuna göre genişliyor (es/pt için ayrıca kısa ifadeler).
- Sipariş panosu tabelası metne göre boyutlanıyor (ORDERS / PEDIDOS / AUFTRÄGE / COMMANDES).
- Sabit tabelalarda (OLTA → TACKLE/PESCA/ANGELN/PÊCHE/PESCA; SEFER → TRIPS/SALIDA/FAHRT/SORTIE/VIAGEM; mücadele çubukları) 6–9 karakterlik karşılıklar seçildi; ekran görüntüleriyle doğrulandı.

**Sayı/ondalık:** `fmt(1234567)` → tr/es/de/pt `1.234.567`, en `1,234,567`, fr `1 234 567`; `fmtKg(2.5)` → en `2.50`, diğerleri `2,50`.

## 5. Terim tutarlılığı (seçme)

| Türkçe | English | Español | Deutsch | Français | Português (BR) |
|---|---|---|---|---|---|
| Sakin Liman | Calm Harbor | Puerto Sereno | Stiller Hafen | Port Paisible | Porto Sereno |
| Olta / Misina / Makara / İğne / Yem | Rod / Line / Reel / Hook / Bait | Caña / Sedal / Carrete / Anzuelo / Cebo | Angel / Schnur / Rolle / Haken / Köder | Canne / Ligne / Moulinet / Hameçon / Appât | Vara / Linha / Molinete / Anzol / Isca |
| Sefer | Trip | Salida | Ausfahrt | Sortie | Viagem |
| İlan / Sipariş Panosu | Order / Order Board | Pedido / Tablón de pedidos | Auftrag / Auftragstafel | Commande / Tableau des commandes | Pedido / Quadro de Pedidos |
| Kupa / Trofe | Cup / Trophy | Copa / Trofeo | Pokal / Trophäe | Coupe / Trophée | Taça / Troféu |
| Balıkçı Birliği | Fishers' Guild | Gremio de Pescadores | Fischergilde | Guilde des pêcheurs | Guilda dos Pescadores |
| Akıcı Av / Klasik Av | Flow / Classic Fishing | Pesca fluida / clásica | Flüssiges / Klassisches Angeln | Pêche fluide / classique | Pesca Fluida / Clássica |

Tam sözlük: `i18n_kaynak/glossary.txt`; tüm çeviri kaynakları: `i18n_kaynak/ceviriler/`.
