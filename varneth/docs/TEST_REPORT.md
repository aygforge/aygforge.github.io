# Test Raporu — Alpha 0.1

Ortam: Linux, Node 22, PostgreSQL 16 (yerel), Chromium (Playwright, headless), Deno 2.1.4.
Tarih: 2026-11-19.

## 1. Otomatik testler — `npm run test` (GERÇEKTEN ÇALIŞTIRILDI)

```
Test Files  6 passed (6)
     Tests  52 passed (52)
```

| Dosya | Kapsam |
|---|---|
| `tests/unit/core.test.js` (18) | İçerik şartları (≥60 eşya, 11 yuva, 7 rarity, ≥9 farklı sprite'lı normal düşman, 3 elit, 4 boss, 10 bölge/3 açık, 6 farm alanı, zindan 2 zorluk, 6+3 beceri, 3×8 ağaç, görev/kontrat/başarım sayıları); XP eğrisi ve Sv 30 sınırı; upgrade maliyeti monoton ve +10'da durur; pazar ücretleri; zırh sınırı; aynı temel eşyanın farklı affix'leri; çelişen affix yok; Alpha'da Mitik/Kadim düşmez; reforge yalnızca seçili affix'i değiştirir, polish türü korur; stat üst sınırları; **simülasyon determinizmi** (snapshot/restore ve parça parça çalıştırma = tek seferde çalıştırma); her sınıf normal düşmanı 2–9 sn'de öldürür; AI beceri kullanır, telegraf + boss fazı oluşur, boss yenilir; Engerek'in Fısıltısı ve Fırtına Asası etkileri savaşta tetiklenir. |
| `tests/unit/pglite.test.js` (1) | Tarayıcı sandbox'ının veritabanı (PGlite) aynı migration'ları ve komut katmanını çalıştırır. |
| `tests/db/game.test.js` (14) | 3 yuva / aynı sınıftan iki karakter / 4. reddedilir; farm doğrulanmış XP verir; **hesap başına tek aktif farm**, karakter değişimi önceki farmı bitirir; sunucu saatine bağlı uzlaştırma (anında heartbeat ödül üretmez); kiralama bitince en fazla 90 sn kredilenir; **offline**: 8 saat sınırı, XP = oran×%40, altın yok, eşya yok, bağlı malzeme var, ikinci kez alınamaz, karakter değişimiyle çoğalmaz; bağlı malzeme ticari üretimde kullanılamaz ama simyada kullanılır; kuşanma statları değiştirir, sınıf/seviye kontrolü, 2H ikinci eli çıkarır; +1..+10 tam maliyet kontrolü; reforge/polish (seç/koru); depo üzerinden başka karaktere aktarım kimliği korur; kilitli eşya parçalanamaz; üretim doğru malzemeyi tüketir; yetenek puanı/önkoşul/sınıf doğrulaması, build ve sıfırlama maliyeti; boss kilidi, **ilk boss yenilip 2. bölge açılır**, görev ödülü; **zindan uçtan uca** tamamlanır ve kaydedilir; ölüm-yeniden doğma, ekipman kaybı yok; yetkisiz/sahte komutlar reddedilir. |
| `tests/db/market.test.js` (12) | Gerçek eşya pazara konur (%2 ücret, emanet); diğer kullanıcı satıcı adıyla görür; kendi ilanını alamaz; yetersiz altın → hiçbir şey değişmez; **3 eşzamanlı alıcıdan yalnızca biri başarılı**, toplam altın sadece %5 komisyon kadar azalır; eşya aynı kimlik ve affix'lerle alıcıya geçer, satıcıda kopya kalmaz; satılmış ilan tekrar alınamaz; **aynı idempotency anahtarıyla tekrar istek çift ödeme üretmez**; +10/reforge'lu eşya tüm özellikleriyle satılır; süresi dolan ilan depoya döner; sahte eşya kimliği/fiyat/süre reddedilir; başlangıç eşyası ticarete kapalı; 10 aktif ilan sınırı. |
| `tests/db/rls.test.js` (5) | Gerçek `authenticated`/`anon` rolleri + `auth.uid()` ile: kullanıcı yalnızca kendi karakter/eşya/cüzdanını görür; istemci altın/eşya/ilan/seviye **yazamaz**; oturum seed'i, komut günlüğü görünmez; anon hiçbir şey görmez; aktif ilanlar giriş yapmış herkese açık. |
| `tests/db/devserver.test.js` (1) | HTTP üzerinden yerel sunucu: kayıt/giriş, sahte token reddi, iki hesap arasında satış (+7 yükseltmeli benzersiz eşya), satıcı bildirimi. |

PostgreSQL bulunamazsa `tests/db/*` otomatik olarak atlanır (sahte "geçti" yok).

## 2. Edge Function (Deno) — GERÇEKTEN ÇALIŞTIRILDI, gerçek Supabase'de DEĞİL

`node tools/test-edge-local.mjs <deno-binary>`: gerçek `supabase/functions/game/index.ts` Deno 2.1.4 altında,
postgres.js ile yerel PostgreSQL'e bağlanarak; Supabase Auth `/auth/v1/user` uç noktası küçük bir taklitle.
**9/9 kontrol geçti** (geçersiz JWT reddi, profil/karakter oluşturma, farm_start snapshot, sunucu saatine göre
~60 tick uzlaştırma, bilinmeyen komut reddi, bigint/jsonb dönüşümleri). Bu test sırasında postgres.js'in JSON
parametrelerini çift serileştirdiği bir hata bulundu ve düzeltildi.

## 3. Tarayıcı uçtan uca (Playwright, headless Chromium) — GERÇEKTEN ÇALIŞTIRILDI

* Sandbox: hesap oluşturma → profil → karakter yaratma → otomatik av; sunucu (PGlite) ve istemci sayımları eşleşir
  (5 öldürme / 70 XP). Bu test, iki paralel PGlite örneği açan bir yarış hatasını ortaya çıkardı (düzeltildi:
  tek bağlantı + sekme kilidi).
* Yerel sunucu modu: Sv 13 savaşçı ile **Kırık Boynuz boss savaşı arayüzden kazanıldı** (telegraflar, boss HP
  çubuğu, zafer paneli, mühür parçası, görev/başarım bildirimleri).
* Yerel sunucu modu, **iki ayrı hesap / iki tarayıcı bağlamı**: A, benzersiz yayı arayüzden 5.000 altına listeledi;
  B pazarda gördü ve satın aldı; A'nın geçmişinde "Satıldı".
* Mobil yatay (iPhone 13 landscape emülasyonu): HUD ve menüler kullanılabilir (kompakt düzen eklendi).
* `npm run package:itch` ZIP'i alt klasörden servis edildi: başarısız istek yok, sandbox açıldı.
* Konsolda kritik hata yok (yalnızca WebGL sürücü performans bildirimleri).

## 4. Denge simülasyonu — `npm run balance` (GERÇEKTEN ÇALIŞTIRILDI)

Tam çıktı: [BALANCE_REPORT.txt](BALANCE_REPORT.txt). Özet GAME_DESIGN.md'de.

## 5. Yapılamayan / doğrulanamayan

* Gerçek Supabase projesine migration + Edge Function dağıtımı ve Supabase Auth e-posta akışı (kimlik bilgisi yok).
* Gerçek mobil cihazda dokunmatik test (yalnızca emülasyon).
* Uzun süreli (saatlerce) tarayıcı oturumu / bellek profili.
* Ses: Web Audio kodu derlenir ve headless'ta hata vermez, fakat işitsel kalite insan kulağıyla değerlendirilmedi.
* Firefox/Safari'de determinizm: simülasyon yalnızca IEEE aritmetiği kullanır ve sunucu her heartbeat'te istemciyi
  yeniden eşitler; yine de bu tarayıcılarda çalıştırılmadı.
