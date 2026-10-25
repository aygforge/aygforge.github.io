# Çevrimiçi test katmanı — kurulum (Supabase, ücretsiz)

Oyun tek oyunculu kalır ve çevrimiçi olmadan da tamamen çalışır. Bu katman yalnız şunları ekler:

- **Bulut kaydı:** hesabınla ilerlemen buluta da yedeklenir; başka cihazda/tarayıcıda "Buluttan yükle" ile devam edersin.
- **Liderlik tablosu:** arkadaşların karakterleri (seviye, öldürme, boss, görev).
- **Hata / öneri bildir:** oyun içinden; sürüm, harita, sınıf ve seviye otomatik eklenir.
- **Ortak dünya (4.4.0):** ayrı küçük oyun sunucusu ile herkes aynı yaratıkları görür, partide EXP paylaşılır —
  kurulum: [`OYUN_SUNUCUSU.md`](OYUN_SUNUCUSU.md).
- **Parti (4.3.0):** arkadaşlarınla parti kur, haritada birbirinizi görün, birlikte bölgeden bölgeye gezin, sohbet edin.
- **Çevrimiçi oyuncular (4.2.0):** oyundayken mini haritanın altında "● N çevrimiçi"; dokununca kim, hangi karakterle, hangi haritada.

Sunucu kodu yazmak ya da sunucu kiralamak gerekmez: Supabase'in ücretsiz katmanı (veritabanı + giriş sistemi) yeterli.
Kurulumu **bir kişi** (sen) bir kez yapar, arkadaşların yalnız oyunda hesap açar.

> Supabase paneli zaman zaman yeniden düzenlenir; menü adları aşağıdakinden biraz farklı olabilir.

## 1. Proje oluştur (≈3 dk)

1. <https://supabase.com> → **Start your project** → GitHub hesabınla giriş (ücretsiz, kart istemez).
2. **New project**: ad `ahen-vadisi`, bir veritabanı şifresi (bir yere not et; oyunda kullanılmaz), bölge olarak
   Türkiye'ye yakın bir Avrupa bölgesi (ör. Frankfurt). Plan: **Free**.
3. Proje hazırlanınca devam et.

## 2. Tabloları kur (≈1 dk)

1. Sol menü → **SQL Editor** → **New query**.
2. Bu depodaki `supabase/kurulum.sql` dosyasının **tamamını** yapıştır → **Run**. "Success" görmelisin.
   (Tekrar çalıştırmak güvenlidir; mevcut veriyi silmez.)

Bu betik beş tablo (+ `online_players` görünümü) kurar ve satır güvenliğini açar: herkes yalnız **kendi** bulut kaydını okuyup yazabilir, liderlik
tablosunu herkes okur ama yalnız kendi satırını yazar, hata bildirimleri yalnız eklenebilir (yalnız sen panelden okursun).

**Doğrulama:** sol menü → **Table Editor**'da `players`, `cloud_saves`, `leaderboard`, `feedback`, `presence` görünmeli.
Yeni sürümle gelen betiği her zaman **baştan sona yeniden çalıştır** (eski tablolara ve veriye dokunmaz, eksikleri ekler).

### Oyunda "Sunucuda … tablosu yok [PGRST205]" ya da "Sunucu tabloları yok" görürsen

1. Betik bu projede hiç çalışmamış ya da yarıda kalmış olabilir: SQL Editor'da betiğin **tamamını** (ilk satırdan son satıra)
   yapıştırıp **Run** de; altta kırmızı hata varsa metnini bana gönder.
2. Doğru projede olduğundan emin ol: panelin üstündeki proje adı, oyundaki adresle (`https://<kod>.supabase.co`) aynı olmalı.
3. Betiğin son satırı Veri API'sinin şema önbelleğini yeniler. Yine de görünmezse: Project Settings → Data API →
   "Exposed schemas" listesinde `public` olmalı.
4. Oyunda Çevrimiçi penceresini kapatıp aç (ya da sayfayı yenile); takma ad kayıtta verdiğinle otomatik onarılır.

## 3. E-posta onayını kapat (test için)

**Authentication → Sign In / Providers → Email**: "Enable Email provider" açık kalsın, **"Confirm email" kapalı** olsun → Save.

Açık kalırsa arkadaşlarına onay e-postası gider ve bağlantı oyuna geri dönmez; kapalıyken kayıt anında tamamlanır.

## 3b. Anlık bağlantı (parti için) — genelde ayar gerekmez

Parti, Supabase **Realtime** (Broadcast + Presence) kullanır; varsayılan olarak açıktır. Parti "bağlantı hatası" derse:
**Project Settings → Realtime** (ya da sol menü **Realtime → Settings**) altında herkese açık kanallara izin veren seçenek
("Allow public access" / "private channels only" kapalı) açık olmalı.

**Ücretsiz katman sınırları (Supabase belgelerine göre):** ayda 2 milyon Realtime mesajı, aynı anda 200 bağlantı, saniyede
100 mesaj. Her yayın 1 gönderim + alan kişi sayısı kadar mesaj sayılır. Oyun konumu yalnız yürürken ve aynı bölgede parti
arkadaşı varken en sık 0,4 sn'de bir gönderir, dururken susar. Kabaca: 2 kişi birlikte sürekli yürürse saatte ≈ 36 bin,
4 kişi ≈ 140 bin mesaj; gerçek oyunda duraklamalarla daha az. Kullanımı **Reports / Usage → Realtime** altında izle.

## 4. Adres ve herkese açık anahtarı al

- **Project URL:** `https://xxxxxxxx.supabase.co` (Project Settings → Data API, ya da üstteki **Connect** düğmesi).
- **Herkese açık anahtar:** Project Settings → **API Keys** → `sb_publishable_…` ile başlayan **Publishable key**
  (ya da "Legacy API keys" altındaki **anon public** anahtarı).

⚠️ **`sb_secret_…` / `service_role` anahtarını asla oyuna koyma ya da kimseyle paylaşma.** Oyun bu anahtarları zaten reddeder.
Herkese açık anahtarın oyunda görünmesi normaldir: verileri satır güvenliği korur.

## 5. Oyuna bağla — iki yol

> 4.1.1'den itibaren test grubunun projesi `online.json` ile oyuna gömülüdür; aşağıdakiler başka bir proje için.

**A) En kolayı — adres ve anahtarı bana gönder:** `online.json` dosyasına yazıp yeni itch.io ZIP'ini hazırlarım. Arkadaşların
hiçbir ayar yapmadan doğrudan "Kayıt ol" der.

**B) Kendin, ZIP'i yeniden yüklemeden:** oyunda **Ana menü → Çevrimiçi → Sunucu ayarı** → adres + anahtar → Kaydet.
Sonra **Çevrimiçi → Sunucu kodunu paylaş** ile `AHO1:…` kodunu arkadaşlarına gönder; onlar da Sunucu ayarı'na yapıştırır.
(Bu ayar yalnız o tarayıcıda saklanır.)

İstersen ZIP içindeki `online.json`'u kendin de düzenleyebilirsin:
`{ "url": "https://xxxxxxxx.supabase.co", "anonKey": "sb_publishable_..." }` — sonra ZIP'i (index.html kökte kalacak şekilde)
yeniden itch.io'ya yükle.

## 6. Kullanım

- **Kayıt ol / Giriş yap:** e-posta + şifre (en az 6 karakter) + takma ad (liderlikte görünür). Test sunucusu olduğu için
  başka yerde kullandığın bir şifreyi kullanma.
- **Buluta kaydet:** elle; giriş yaptıysan ayrıca **otomatik** (yerel kayıttan sonra, en sık 3 dakikada bir).
- **Buluttan yükle:** bulut ve bu cihaz yan yana gösterilir; onaylarsan yüklenir, şu anki profilin kurtarma kopyası saklanır
  (Ayarlar → Önceki kayıtlar).
- **Koruma:** boş profil buluta asla yazılmaz. Bulutta bu cihazda olmayan ya da daha ileri bir karakter varsa otomatik yükleme
  durur; elle yüklemede uyarı çıkar ("Yine de buluta yaz" bilinçli seçimdir).
- **Hata bildirimleri:** Supabase → **Table Editor → feedback**. Liderlik: **leaderboard**, kayıtlar: **cloud_saves**.

## Ücretsiz katman notları

- Ücretsiz proje **bir hafta hiç kullanılmazsa duraklatılır**; panelden tek tıkla yeniden başlatılır (veri kaybolmaz).
- Sınırlar küçük bir test grubu için fazlasıyla yeterli (veritabanı yüzlerce MB, aylık on binlerce kullanıcı). Güncel
  sınırlar: Supabase fiyat sayfası.
- Şifre sıfırlama oyunda yok: gerekirse Authentication → Users'tan kullanıcıyı silip yeniden kayıt olunur (bulut kaydı da
  silinir; yerel kayıt durur).
- E-posta adresleri Supabase projende saklanır; arkadaşlarına bunu söyle.

## Ne değildir

Oyun sunucusu (4.4.0) **olmadan** parti arkadaşları haritada görünür ama savaş herkesin kendi dünyasındadır. Oyun sunucusu
kuruluysa açık haritalardaki yaratıklar ortaktır ve EXP paylaşılır; boss'lar ve dungeon'lar henüz kişiseldir. Eşya ticareti yoktur.
Parti kanalları herkese açık anahtarla açılır: kodu bilen katılabilir (arkadaş grubu için yeterli). Liderlik ve
kayıt verisi istemciden gelir (arkadaş grubu için yeterli; hileye karşı korumalı değildir).
