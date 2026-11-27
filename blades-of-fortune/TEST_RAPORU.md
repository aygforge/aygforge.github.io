# Blades of Fortune — Test Raporu

Tarih: 27.11.2026 · Derleme: `BladesOfFortune.html` (~572 KB, tek dosya, çevrimdışı)

Aşağıdaki sayılar çalışan koddan otomatik olarak hesaplandı (`tests/validate.mjs` → `tests/validate-report.json`, `tests/sim.mjs` → `tests/sim-report.json`).

## İçerik sayıları

| Öğe | Hedef | Koddaki |
|---|---|---|
| Bağımsız olay | 100 | **100** (tehlike 20 · gezgin 15 · keşif 15 · hazine 12 · kraliyet 12 · doğa 10 · gizem 8 · absürt 8) |
| Hikâye zinciri | 20 | **20** |
| Zincir aşaması | 74 | **74** (her zincirin aşama sayısı istenen listeyle birebir) |
| Olay düğümü toplamı | 174 | **174** |
| Özgün koreografi tanımı | 174 | **174** (parmak izi karşılaştırmasıyla birbirinin kopyası olan yok) |
| Oynatılan seçenek | — | **498** (her düğümün her seçeneği) |
| Eşya | 32 | **32** (9 silah · 7 zırh · 6 aksesuar · 10 tüketilebilir/özel) |
| Düşman türü | ≥12 | **12** temel + **10** mini-boss/özel varyant |
| Kalıcı geliştirme | 18 | **18** (3 dal × 6) |

Kraliyet Sınavı (`EV_FINAL`) bu 174 düğüme dahil değildir.

## 174 düğüm doğrulaması (`npm test` → validate)

Her düğüm için kontrol edilenler: benzersiz kimlik; 2–4 seçenek; bölge tanımı; seçenek başına aksiyon koreografisi ve sonuç koreografisi; bilinen adım türleri; çizilebilen aktör türleri; geçerli düşman/eşya/görev eşyası bağlantıları; koreografi benzersizliği.

Ardından **her düğümün her seçeneği gerçek çekirdek ve gerçek Event Director ile** (Node'da sahte tuvalle) baştan sona oynatılır: kurulum → yaklaşma → giriş → karar → aksiyon (gerekirse savaş) → sonuç → **sonuç ekranında kaydet/yükle tutarlılık kontrolü** → çıkış → yolculuğa veya kasabaya dönüş.

Sonuç: **174/174 düğüm, 498/498 seçenek, 51 savaş — 0 hata, 0 uyarı.**

## Hedefli akış testleri (`tests/sim.mjs`) — 13/13 başarılı

| Test | Sonuç |
|---|---|
| Yeni oyun, kasaba hizmetleri (demirci, kuşanma, han, şifacı, görev alma, satış) | ✔ · al-sat açığı yok (her eşyada satış < alış) |
| Çanta dolu: eşya silinmez, bırak/vazgeç seçimi beklenir, karar verilmeden yola çıkılamaz | ✔ |
| Tam run: başkente varış → Kraliyet Sınavı → Macerayı Tamamla | ✔ · 8 yerleşim, 31 olay, 7 savaş, 6 zincir aşaması |
| Normal istatistiklerle 6 run (otomatik oyuncu) | ✔ · 4 zafer, 2 ölüm; 6–9 yerleşim |
| Ölüm: run biter, XP korunur, aktarım tek sefer, kayıtta kalıcı | ✔ |
| Savaş ortasında kaydet/yükle: savaş kaldığı yerden sürer; sonuç bir kez; tekrar seçim/savaş reddedilir | ✔ |
| Zincirlerin tüm aşamaları (CH01, CH04, CH18) ve tek seferlik ödül | ✔ · 4/4, 4/4, 4/4 |
| Sonsuz Macera: 4 yerleşimde bir aşama, bölgesel koşul, rekor kaydı | ✔ · 18 yerleşim, aşama 2 |
| Determinizm: aynı seed + aynı kararlar → aynı sonuç | ✔ |
| Gönüllü emeklilik: XP aktarılır, başkent ödülü yok | ✔ |
| Kalıcı gelişim: sıralı açılır, yeni run'a etki eder | ✔ |
| Kayıt dışa/içe aktarma; bozuk kayıtta `.bak` yedeğinden kurtarma; yabancı kayıt reddi | ✔ |

Oyun süresi: otomatik oyuncu (anında karar, hızlandırmasız) normal bir runu 10–15 dakikada bitiriyor. Okuma ve kasaba alışverişi eklendiğinde gerçek oyuncu için tahmin 20–30 dakika.

## Tarayıcı testleri (Chromium / Playwright)

- `tests/browser.mjs`: arayüz üzerinden oynanış (seçenek kartları, savaş butonları, Devam, kasaba hizmetleri, rota kartları). 4 yerleşim, 12 karar, 13 savaş eylemi, 12 sonuç — **0 sayfa hatası**.
- Başkent senaryosu: rota → başkent → Kraliyet Sınavı → Şampiyon savaşı → zafer penceresi → Sonsuz Macera → emeklilik → run özeti → kalıcı gelişim — **0 hata**.
- Telefon görünümü (Pixel 7 yatay): ölçekleme ve dokunma doğru; dikey modda "telefonu çevir" ekranı çıkıyor.
- Ekran görüntüleri: `docs/screens/`.

## Bilinen eksikler ve sınırlar

- Denge sınırlı sayıda otomatik oyunla ayarlandı; gerçek oyuncu testleriyle zorluk ve XP maliyetleri ince ayar isteyebilir.
- Karakter ve düşman animasyonları bilinçli olarak sade tutuldu (yürüme, saldırı, hasar, düşme/kaçma). Görsel bütçenin çoğu olay koreografilerine ayrıldı.
- Müzik prosedürel ve basit: kipsel lavta ezgisi + bas burdon.
- Gerçek dokunmatik cihazda elle test yapılmadı; mobil uyumluluk yalnızca Playwright cihaz emülasyonuyla doğrulandı.
- Kaynak Tides paketi sıkıştırılmıştı. Çekirdek alt sistemler (RNG, kayıt, Director durum makinesi ve adım yürütücü, ses yapısı) okunabilir modüllere taşındı. Denize özgü çizim ve sistemler yeniden yazıldı; sıkıştırılmış kod birebir korunmadı.
