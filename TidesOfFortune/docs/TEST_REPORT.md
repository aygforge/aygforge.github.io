# Test Raporu

Ortam: Node 22, Chromium (Playwright), Linux. Tarih: 2026-11-14.

## 1. Mantık testleri — `npm test` (node:test) — 17/17 geçti

Rework ile eklenenler: belirsiz deniz yolları (2–3 yol, gizli hedef, tekrar yok, son ayak Büyük Liman), bölgesel talep çarpanı.

| # | Senaryo | Test | Sonuç |
|---|---|---|---|
| — | İçerik sayıları (45 liman/bölge dağılımı, 15 mal, 18 item, 30 tayfa, 5 hayvan, 20 upgrade, 18/15/12/8/3/5 event, 12 zincir) ve tüm zincir referanslarının geçerliliği | İçerik sayıları | ✅ |
| 1 | Yeni run oluşturulabiliyor | 1 | ✅ |
| 2 | Aynı seed aynı rotayı üretiyor (200 seed; tekrar yok, final Büyük Liman, kilitli tip yok) | 2 | ✅ |
| 3 | Liman teklifleri ziyaret boyunca (kayıt/yükleme dahil) değişmiyor | 3 | ✅ |
| 4 | Alım-satım doğru altın değişimi | 4–5 | ✅ |
| 5 | Kargo kapasitesi aşılamıyor | 4–5 | ✅ |
| 6 | Item gerektiren seçenek item olmadan kilitli ve nedeni yazıyor | 6–7 | ✅ |
| 7 | Tek kullanımlık item tüketiliyor; aynı seçenek ikinci kez seçilemiyor | 6–7 | ✅ |
| 8 | Tayfa pasifleri (Hamid satış, Pita çarpanı, Groot rota sonu onarımı) | 8–9 | ✅ |
| 9 | Tayfa bırakılınca bonus kalkıyor, tayfa run'a geri dönmüyor | 8–9 | ✅ |
| 10 | Tamir maksimumu aşmıyor (Onarım Takımı, tam tamir) | 10–11 | ✅ |
| 11 | Hasar kategorileri yüzdeyle doğru (sınır değerleri + 450 hull'da %50) | 10–11 | ✅ |
| 12 | Batma run'ı bitiriyor ve XP kalıcı hesaba aktarılıyor | 12 | ✅ (hull 0'a test içinde zorlanıyor) |
| 13 | Zincir yarıda kaybolmuyor: sonraki rotaya ertelenen adım kayıt/yükleme sonrası kuyruğun başına geliyor | 13 | ✅ |
| 14 | Zıpır & Tarçın: ilk karşılaşma ilk 3 limanda (40 seed), Tarçın alınınca ikinci karşılaşma 2–4 liman içinde planlanıp oynuyor | 14–15 | ✅ |
| 15 | Eski Dostlar başarımı, kapasite 2, Codex sayfası | 14–15 | ✅ |
| 16 | Yeni run'da altın, gemi, tayfa sıfırlanıyor (kalıcı bonuslar uygulanarak: 150 altın, 110 hull) | 16–17 | ✅ |
| 17 | Kalıcı XP ve yükseltmeler korunuyor | 16–17 | ✅ |
| 18 | Kayıt yükleme event ödülünü çoğaltmıyor; RNG durumu korunuyor (aynı sonraki event) | 18 | ✅ |
| 19 | Büyük Liman finali tamamlanabiliyor (otomatik oyuncu, 60 seed) | 19 | ✅ |
| — | Aynı seed + aynı kararlar = aynı run sonucu | Deterministik | ✅ |

## 2. Gerçek tarayıcı testi — `node tests/browser.test.cjs` — 16/16 geçti (top-down rework)

`dist/TidesOfFortune.html?hiz=30` `file://` ile açıldı; dokunmatik etkin. Run tamamen arayüz tıklamalarıyla oynandı: seed, başlangıç item, Yola Çık → deniz yolu kartı, karşılaşma seçenek kartları, Devam, Limana Gir, Eski Dostlar sinematiği.

| Kontrol | 800×360 | 1280×720 |
|---|---|---|
| Run baştan sona UI ile oynandı, JS hatası yok (tüm director fazları görüldü) | ✅ | ✅ |
| Gemi top-down (dikey) çiziliyor | ✅ | ✅ |
| Karar sonrası, sonuç animasyonu sırasında yeniden yükleme: altın/gövde/kargo/XP değişmiyor, sonuç ekranından devam | ✅ | ✅ |
| İşe alınan tayfa güvertede beliriyor | ✅ | ✅ |
| Alınan 3 birim kargo güvertede 3 sandık | ✅ | ✅ |
| Deniz yolu kartlarında hedef liman adı yok | ✅ | ✅ |
| Sayılar okunaklı UI fontunda (tabular) | ✅ | ✅ |
| Taşan buton yok | ✅ | ✅ |

Ekran görüntüleri (915×412, 2×): `docs/screenshots/td_harbor.png`, `td_sailing.png`, `td_decision.png`. Geliştirme sırasında Korsan Baskını (Savaş, Teslim ol), Dev Dalga, Yüzen Sandık, Hayalet Gemi ve Zıpır sahneleri de ekran görüntüsüyle gözden geçirildi.

## 2b. Sahne taraması — `node tools/scenecheck.cjs` — 297/297 geçti

Her event zorla tetiklenir (gerekli tayfa/item/hayvan/koşul otomatik sağlanır), her seçenek ve her otomatik çözüm gerçek tarayıcıda baştan sona oynatılır: yaklaşma → giriş → karar → aksiyon → sonuç → çıkış → seyre dönüş. Rıhtım eventleri liman sahnesinde oynatılır.

| Kapsam | Sonuç |
|---|---|
| 109 event, 289 seçenek + 8 otomatik çözüm = 297 senaryo | 297 geçti, JS hatası 0, takılma 0 |
| Ortalama sahne süresi (yaklaşmadan seyre dönüşe, karar beklemesi hariç) | 18,5 sn oyun zamanı |

Tarama sırasında bulunup düzeltilenler: sahne değişiminde eski adım geri çağrılarının yeni duruma dokunabilmesi (yönetmen artık sahne değişince bekleyen adımları iptal ediyor); karar paneli açıkken öndeki nesnelerin (tsunami vb.) ekranın üstünden taşması (kamera öne odaklıysa kaldırma azaltılıyor). Ekran görüntüsüyle ayrıca gözden geçirilenler: Askerî Denetim, Köle Gemisi, Balık Sürüsü, Kuzey Işıkları, Terk Edilmiş Ada, Tsunami, Korsan Filosu, Madalyon (rıhtım), Rıhtımdaki Korsan.

## 3. Denge simülasyonu

Rework sonrası `node tools/simulate.mjs 300`: tamamlanma %82,7 · 1,14 yükseltme/run · ~31 event/run · hata yok. Tahmini run süresi, özel sahnelerle ölçülen event süresiyle (sahne ~19 sn + karar/okuma ~10 sn) **43,2 dk** (saf seyir 18,1 dk); hedef aralık 25–45 dk'nın üst tarafında.

Rework öncesi `node tools/simulate.mjs 400`:

Otomatik oyuncu (makul ama bilgisiz tüccar, kalıcı upgrade yok):

| Ölçüt | Değer |
|---|---|
| Tamamlanan / batan | %87 / %13 |
| Ortalama rota | 7.9 liman |
| Ortalama en yüksek altın | 575 |
| Run XP | ~563 |
| Gemi yükseltme | 1.12 / run (≈ her 6 limanda bir) |
| Run sonu gemi seviyesi | Sv1 %22 · Sv2 %48 · Sv3 %28 · Sv4 %3 |
| Event / run | ~29 (tehlike %24, şans %26, gizem %18, zincir adımı %18, özel %6,5, felaket %6, tamir %3) |
| Batış bölgeleri | Bölge 5: 37, Bölge 4: 5, Bölge 3: 2 |

Meta birikimli (`--meta`, 40 run): tüm 20 upgrade alınabiliyor, tamamlanma %100, yükseltme 1.73/run.

Yorum: Tehlike ilerleyen bölgelerle artıyor (batışların çoğu Bölge 5'te), kayıp sonrası da XP kazanılıyor. Botun ekonomi hedefinin (2–3 limanda bir yükseltme) gerisinde kalması ve genel zorluğun kolay tarafta olması açık bir ayar konusu olarak raporlanmıştır (bkz. SYSTEM_STATUS "Bilinen sınırlamalar").

## Çalıştırılmayan testler
- Gerçek Android cihazda dokunmatik/performans testi yapılmadı (yalnızca Chromium mobil viewport emülasyonu).
- Ses çıktısı otomatik test edilmedi (Web Audio grafiği hatasız kuruluyor; dinleme testi yapılmadı).

## Yaşayan Denizler & Sonsuz Deniz genişlemesi
- `npm test`: 32/32 (15 yeni X1 testi dahil: kayıt v4→v5 taşıma, idempotent ödüller, sözleşme kapasitesi/satılamaz kargo/%70 buluşma, fraksiyon sınırları, Dünya Hafızası bağlantıları, Günlük ağırlığı ve determinizm, Sonsuz Deniz derinlik/koşul/kilometre taşı/skor, 50/100/200 ek liman simülasyonu, batışta XP ve Büyük Liman başarısının korunması).
- `PREFIX=EVT_X1,CH_X1,CT_X1 node tools/scenecheck.cjs`: 25 event + 14 zincir aşaması + 3 hafıza takibi + 4 yankı + 4 sözleşme sahnesi, tüm seçenekler ve otomatik çözümler → **190 senaryo, 0 hata, 0 takılma**.
- Görsel denetim (temas sayfaları): Dev Yengeç, Dev Göz, Müzayede, Yüzer Tersane, Siyah Yağmur, Kızıl Kaptan ittifak finali. Dev Göz konumu ve müzayede gemileri bu denetimde düzeltildi.
- `tests/browser.test.cjs`: 16/16. Yeni arayüz ekranları (Büyük Liman seçimi, Sözleşmeler, Sonsuz Deniz göstergeleri, Denizci Günlüğü, rekorlar, 6 dallı yükseltme ekranı) tarayıcıda açıldı, JS hatası yok.
- `tools/simulate.mjs 150`: tamamlanma %91,3, run ~43 dk, ~31 event/run — tempo genişleme öncesiyle aynı.
- Doğrulanmayanlar: gerçek cihazda performans; her sahnenin her başarı/başarısızlık dalının tek tek göz ile incelenmesi (otomatik tarama hepsini oynattı ama yalnızca 6 sahne kare kare incelendi); Sonsuz Deniz'in 20+ ek limana kadar elle oynanması (yalnızca simülasyonla doğrulandı).
