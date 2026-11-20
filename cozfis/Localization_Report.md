# CozFis — Faz 1: Yeniden Markalama ve Altı Dilli Yerelleştirme Raporu

**Teslim dosyası:** `CozFis_Multilanguage_v1.html` (tek dosya, çevrimdışı, ~2,1 MB; kaynak sürüm ~1,0 MB)
**Kaynak:** `DOC-20261109-WA0031.html` (Cozy Fishing, şema 5, v4.0 içerik)
**Kapsam dışı (bu fazda dokunulmadı):** Android port, APK, reklam, monetizasyon, oyun ekonomisi.

---

## 1. Özet

| Konu | Sonuç |
|---|---|
| Oyun adı | Oyuncuya görünen her yerde **CozFis** (logo, `<title>`, meta, yükleme yazısı, döndürme ekranı, kayıt hata mesajı, fotoğraf modu). Kaynakta “Cozy Fishing / COZY FISHING” metni **kalmadı** (derleme betiği bunu doğrular). |
| Diller | Türkçe (kaynak), English, Español, Deutsch, Français, Português (Brasil) |
| Çeviri anahtarı | **2.207** anahtar × 6 dil (1.692 kod mesajı + 503 veri alanı + 12 çalışma zamanı anahtarı). Her yabancı dilde **eksik: 0**, parametre uyumsuzluğu: **0** |
| Dil seçimi | Ana menü → Ayarlar ve oyun içi Ayarlar panelinin en üstünde; her dil kendi yerel adıyla. Değişiklik **oyunu yeniden başlatmadan** anında uygulanır. |
| İlk açılış | Kayıtlı tercih varsa o; yoksa cihaz dili (tr/en/es/de/fr/pt*); desteklenmeyen dillerde İngilizce. |
| Kayıt uyumluluğu | `cozyfishing` IndexedDB adı, `cozyfishing_save_v1` vb. anahtarlar ve `cozyfishing-save` biçimi **değişmedi**. Eski kayıtlar sorunsuz açılıyor. |
| Oyun sistemleri | Hiçbir mekanik/ekonomi değeri değiştirilmedi. Türkçe derleme, orijinal oyunla **bayt düzeyinde aynı** arayüz çıktısını üretiyor (yalnızca eklenen dil bölümü hariç). |
| Dahili QA | 149/149 kabul testi **altı dilin her birinde** geçti; konsol hatası yok. |

---

## 2. Kullanılan mimari

### 2.1 Çekirdek: `I18N` modülü (dosyanın içinde, ağ bağlantısı gerektirmez)

```
window.LOCALE_DATA = { tr:{…}, en:{…}, es:{…}, de:{…}, fr:{…}, 'pt-BR':{…} }   // merkezî sözlük
I18N.t(key, params)   // kısaltması: _t(key, [p0, p1, …])
```

- **Anahtarlar** anlamlıdır: `modül.metin_özeti` (ör. `fish.balik_vurmadi_bir_dahaki_atista`, `ui.siparis_panosu`) ve veri için `d.<tür>.<id>.<alan>` (ör. `d.fish.sardalya.name`, `d.npc.efe.first_meet`).
- **Parametreli şablonlar:** `{0}`, `{1}` … — kelime sırası her dilde serbestçe değişebilir.
- **Çoğul:** `{0|tekil|çoğul}` sözdizimi `Intl.PluralRules` ile seçilir (Fransızcada 0 ve 1 tekil sayılır). Ör. `{0} {0|day|days}`.
- **Sayı biçimi:** `fmt()` binlik ayırıcı, `fmtKg()` ve oyun içi çarpanlar ondalık ayırıcıyı dile göre kullanır (en: `1,234.5` · tr/es/de/pt: `1.234,5` · fr: `1 234,5`). Yüzde: tr `%50`, en/pt `50%`, es/de/fr `50 %`.
- **Kontrollü geri dönüş:** Seçili dilde anahtar yoksa İngilizce → Türkçe → anahtar adı. Geri dönüşe düşen her anahtar `I18N.missingReport()` ile raporlanır (şu an boş).
- **Doğrulama:** `I18N.validate()` dil bazında toplam / eksik / fazla / parametre uyumsuz anahtar sayısını verir. QA panelinde (`?debug=1` veya F3) “Çeviri doğrulaması” başlığıyla görünür.
- **Büyük/küçük harf:** `I18N.upper()` / `I18N.lower()` seçili dilin yerel ayarıyla (`tr-TR`, `de-DE` …) çalışır; sabit `tr-TR` dönüşümü kaldırıldı (ör. İngilizcede `i → I`, Türkçede `i → İ`; Almancada `ß → SS`).

### 2.2 Kaynak koddaki metinlerin taşınması
Elle tek tek düzenlemek yerine **AST tabanlı** (acorn) bir hat kuruldu:
1. Oyuncuya görünen tüm dizgeler, şablon dizgeleri ve **dizge birleştirme zincirleri** (`'Hoş geldin ' + ad + '!'`) bulunur; zincirler tek bir parametreli mesaja dönüştürülür (Türkçe ek/kelime sırası sorunları çevirilere taşınmaz).
2. HTML içeren şablonlarda etiketler çevirmenden gizlenip (`⟦n⟧`) derlemede geri konur; `title`/`placeholder` öznitelikleri ayrıca çevrilir. Derleyici her çevirinin etiket ve parametre kümesini kaynakla karşılaştırır — bozuk HTML üretmek mümkün değildir.
3. Karşılaştırma/anahtar olarak kullanılan dizgeler (sahne/panel kimlikleri, `case` etiketleri, `.includes()` aramaları vb.) otomatik olarak dışarıda bırakıldı.
4. **Yükleme anında** oluşturulan tablolar (mevsim/hava adları, kıyafetler, dekorlar, deniz canlıları, kıyı nesneleri, trofeler, Birlik görevleri, hikâyeler …) için 612 tembel getter ve 26 tembel dizi üretildi; böylece dil değişince bu tablolar da anında yeni dilde okunur.

### 2.3 Veri odaklı çeviri (FISHDB_DATA, GAMECONFIG_DATA, EXPANSION_DATA)
- JSON verilerine **dokunulmadı**; `id` alanları ve tüm sayısal değerler aynı.
- Açılışta `I18N.bindData()` görünen alanları (`name`, `name_tr`, `encyclopedia_tr`, `condition_tr`, `category`, `text_tr`, `desc`, `rule`, `comp_name`, `requirements`) **id bazında** çeviri anahtarına bağlayan getter'lar kurar. Kod `FISH[id].name_tr` okumaya devam eder ama seçili dildeki adı alır.
- `species42` başarımının koşul metni tür sayısıyla dinamik üretilir (`i18n.ach_all_species`).

### 2.4 Canlı dil değişimi
`I18N.setLang()` → tercihi kaydeder → `UI.relocalize()`: yazı içeren önbellekli pikselleri (`Atlas`, `TXT`) temizler, sahne çubuğunu/HUD'u/açık paneli yeniden çizer. Kasaba tabelaları, ev, harita ve oltacı HUD'u bir sonraki karede yeni dilde çizilir. Oyun durumu (`S`) hiç değişmez (test edildi).

### 2.5 Tercih saklama
`localStorage['cozyfishing_lang_v1']` — kayıt dosyasından **ayrı** bir uygulama tercihi; kayıt şeması etkilenmez.

---

## 3. Desteklenen diller

| Kod | Seçicide görünen ad | Hitap | Not |
|---|---|---|---|
| `tr` | Türkçe | sen | Kaynak dil; metinler orijinalle aynı |
| `en` | English | you | ABD İngilizcesi yazımı (color, harbor) |
| `es` | Español | tú | İspanya İspanyolcası, nötr kelime seçimi |
| `de` | Deutsch | du | Oyun dünyasına uygun samimi hitap |
| `fr` | Français | tu | Tipografik boşluklar (`: ! ? »`) uygulandı |
| `pt-BR` | Português (Brasil) | você | Brezilya kullanımı (celular, tela, você) |

Cihaz dili `pt-PT` ise Portekizce (Brezilya) seçilir; `it`, `ja` gibi desteklenmeyen dillerde İngilizce açılır.

---

## 4. Çevrilen sistemler

Ana menü · karakter oluşturma · Ayarlar · Yardım ve v2/v3 yenilik metinleri · öğretici adımları · balıkçılık kontrolleri ve canvas üzerindeki tüm av mesajları (gerilim, yön, özel hamle, trofe, dip oltası, spin) · HUD · envanter, sandık, tekne deposu · **70 balığın adı ve ansiklopedi açıklaması** · 7 bölge, 21 av noktası, bölge gereksinimleri · yemler, olta/misina/makara/iğne · 4 tekne, yükseltmeler, otomasyon cihazları · ticaret, balık hali, akıllı satış, sipariş panosu, müşteriler · **13 NPC'nin 161 diyalog satırı** (kişilikleri korunarak) + misafir sohbetleri + rakip profilleri · 5 kasaba hikâyesi · Birlik görevleri · 40 başarım ve kategorileri · 4 şenlik, yarışma kuralları, kupalar · akvaryum ve dekorlar · 24 kıyı nesnesi · 24 deniz canlısı · dürbün gözlemi · günlük olaylar ve hava · bildirimler/toast'lar · onay/hata pencereleri · kayıt içe/dışa aktarma ve doğrulama mesajları · telefon döndürme ekranı · fotoğraf modu ve etiketi · gün sonu raporu · sefer raporu · filo · mali günlük · rekorlar · trofe avları · kasaba tabelaları (canvas).

Balık adlarında her dilin yerleşik tür adları kullanıldı (ör. `lufer`: Bluefish / Anchova / Blaubarsch / Tassergal / Anchova; `izmarit`: Picarel / Caramel / Pikarel / Picarel / Picarel; `orfoz`: Dusky Grouper / Mero / Brauner Zackenbarsch / Mérou brun / Garoupa-verdadeira). Bölge adları terim sözlüğüne göre her yerde tutarlı (`i18n_kaynak/glossary.txt`).

---

## 5. Çeviri kapsamı kontrolü

| Ölçüm | Değer |
|---|---|
| Koddaki oyuncuya dönük dizge kullanımı | 1.923 kullanım → 1.692 tekil mesaj (388'i HTML içerir, 465'i parametreli) |
| JSON veri alanları | 503 anahtar (NPC 161, balık 140, başarım 80, nokta 21, bölge 14, …) |
| Çalışma zamanı ek anahtarları | 12 (`i18n.*`: meta açıklaması, döndürme ekranı, dil başlığı, mesafe harfleri, pusula yönü …) |
| Çevrilmemiş/eksik | **0** (5 dilin hepsinde) |
| Kaynakla bilerek aynı bırakılan | özel adlar (Selçuk, Rıza, Mert, Elif, Efe), uluslararası adlar (Wahoo, Opah), salt sayı/etiket şablonları — ayrıntı `Translation_Audit.md` |
| Kodda kalan Türkçe dizge (QA dışı) | yalnızca 6 bitmap font glif anahtarı (`'Ç','Ş'…`) ve 4 dahili `Error` mesajı (oyuncuya hiç gösterilmez; Tx bunları yakalayıp çevrilmiş “Beklenmeyen hata” mesajını gösterir) |

---

## 6. Pixel font ve canvas desteği

- 3×5 bitmap yazı tipine **21 aksanlı büyük harf** eklendi: `Á À Ä Ã Å É È Ê Ë Í Ì Ï Ó Ò Ô Õ Ú Ù Ñ Ÿ Ý` (akut = sağ nokta, grav = sol nokta, şapka = orta nokta, iki nokta, tilde = üst çizgi; Türkçedeki `Ç Ş Ğ Ö Ü İ Â Î Û` korunuyor).
- Ek işaretler: `¿ ¡ « » „ " ‘ ’ ; = * # _ [ ] º ◀ ▶ → ← ✓ ★ < — −`.
- `fontNorm()`: dile göre büyük harf → glif yoksa eşleme (`Œ→OE`, `Æ→AE`, `ẞ→SS`, `…→...`, ince boşluklar → boşluk) → yine yoksa aksansız taban harf → son çare boşluk. **Hiçbir karakter artık `?` olarak çizilmez.**
- `textWidth()` ve `drawText()` aynı normalizasyonu kullanır; ortalama/genişlik hesapları çeviri uzunluğuna göre doğru.
- Uzunluğa duyarlı canvas öğeleri düzenlendi: balık yön uyarısı kutusu metne göre genişliyor; sipariş panosu tabelası metne göre boyutlanıyor; sabit genişlikli tabelalar için (OLTA, SEFER, ilan) kısa ve doğal karşılıklar seçildi.
- Mesafe çubuğu harfleri (U/O/Y) ve harita pusulası (K) dile göre (ör. en F/M/N, N).

---

## 7. Eski kayıt uyumluluğu

- Kayıt biçimi, şema sürümü (5), sağlama, IndexedDB/localStorage anahtarları **aynı**.
- Orijinal oyunla oluşturulan bir kayıt yeni sürümde İngilizce arayüzle açıldı: gün, para, envanter, ad korunarak (test 4).
- Dil değiştirmek `S` nesnesini **hiç değiştirmez** (6 dil arasında geçişte JSON karşılaştırması eşit).
- Not: Yeni oyun oluşturulurken atanan **varsayılan kullanıcı verileri** (oyuncu adı alanı boşsa “Balıkçı”, varsayılan olta seti adları “Kıyı Avı / Kayalık Avı / Açık Deniz”) o andaki dilde kayda yazılır; bunlar kullanıcının değiştirebildiği verilerdir ve sonradan dil değişince çevrilmez (bilinçli tercih — kullanıcı verisine dokunulmaz).

---

## 8. Yapılan testler (Playwright + Chromium, telefon yatay 740×360 ve 844×390)

| # | Test | Sonuç |
|---|---|---|
| 1 | Dahili kabul testleri (`QA.runAll`, 149 test) — tr, en, es, de, fr, pt-BR | **149/149 × 6**; konsol hatası yok |
| 2 | Türkçe derleme ↔ orijinal oyun: 73 ekran/panel/sekme HTML çıktısı | Birebir aynı (yalnız Ayarlar'a eklenen dil bölümü farklı) |
| 3 | Her dilde temiz açılış ↔ Türkçe açılıp oyun ortasında canlı dil değişimi (73 ekran, zengin oyun durumu, 3 gün uyku, 6 atış) | 5 dilde **0 fark** (bayatlamış metin yok) |
| 4 | Yabancı dil ekranlarında Türkçeye özgü karakter (`ğ ı ş İ Ş Ğ`) taraması | Özel adlar dışında **0** |
| 5 | Cihaz dili algılama (tr-TR, en-US, es-MX, de-AT, fr-CA, pt-PT, pt-BR, ja-JP, it-IT) | Beklenen dil; desteklenmeyenlerde en |
| 6 | Tercih önceliği ve kalıcılık (de cihazda fr seçimi → yenileme) | fr korunuyor |
| 7 | Durum değişmezliği + kayıt biçimi + eski kayıt yükleme | Geçti |
| 8 | Bitmap font kapsamı (tüm 2.207 × 6 metin) ve canvas'a çizilen metinler | Canvas'ta desteklenmeyen karakter: **0** |
| 9 | Taşma taraması (34 ekran × 6 dil, 740×360) + ekran görüntüleri | Taşma yok (Defter sekme çubuğu orijinalde de yatay kaydırmalı) |
| 10 | Mücadele HUD'u ekran görüntüleri (6 dil) | Okunaklı, kutular metne göre |

Test betikleri `i18n_kaynak/araclar/` altındadır.

---

## 9. Bilinen eksiklikler / sınırlamalar

1. **QA / Test paneli ve kabul test adları yalnızca Türkçe.** Panel normal oyuncuya görünmez (`?debug=1` / F3). Kabul testleri Türkçe referans metinlerle yazıldığı için `QA.runAll` çalışırken dil geçici olarak Türkçeye alınıp sonra geri yüklenir (kaydedilmez).
2. **Özel adlar çevrilmedi:** Zeynep, Nihat, Bora, Bahar, Efe, Fatma, Selin, Kerem, Hasan, Halil, Ali, Mert, Elif, Selçuk, filo balıkçıları ve Kayalıköy. Unvanlar çevrildi (Teyze → Auntie/Tía/Tante/Tata/Tia, Muhtar → Mayor/Alcalde/Bürgermeister/Maire/Prefeito, Usta → Master…, Dayı → Uncle…).
3. **Kullanıcı verisi** (oyuncu adı, tekne isim levhası, set adları ve yeni oyunda atanan varsayılanları) çevrilmez.
4. Ekranda o anda süzülmekte olan kısa canvas uyarıları (ör. “+İLERLEME”) dil değiştiği an değil, bir sonraki gösterimde yeni dilde gelir.
5. HTML'de kullanılan bazı semboller (✕ ✗ ☆ ≤ ≥ ≈ ▮ °) bitmap fontta yok; bunlar zaten yalnızca HTML'de (sistem fontuyla) görünür, canvas'a çizilmez.
6. Çeviriler insan kalitesinde ve bağlama göre yapıldı; yine de mağaza yayını öncesi her dil için anadili konuşan bir oyuncuyla kısa bir **okuma turu** önerilir (özellikle oyun içi ince mizah ve balık yerel adları).
7. Fransızca ince bölünmez boşluk (binlik ayırıcı) canvas'ta normal boşluk olarak çizilir (görsel olarak fark edilmez).

---

## 10. Android'e hazırlık açısından durum
- Tüm metinler tek sözlükte; yeni dil eklemek = `LOCALE_DATA`'ya bir blok + `I18N.LANGS`'a bir satır.
- Dil tercihi kayıttan bağımsız ve cihaz dilinden otomatik geliyor (WebView `navigator.languages` ile uyumlu).
- Harici kaynak yok: 0 CDN, 0 ağ çağrısı (kabul testi v4-91 bunu doğruluyor).
