# Ahen Vadisi — Test Raporu

## 4.5.3 — iPhone'da tam ekran ve dar ekran (oyuncu bildirimi, 25 Ekim 2026)
- Birim: 232/232.
- Yeni E2E `run-e2e-screen.mjs` 15/15. Gerçek oyun sunucusu süreci ve iPhone Safari kimliğiyle tarayıcı:
  - sunucu `/health` (`"web": true`), kök adreste oyun sayfası, manifest türü, önbellek başlıkları; klasör dışı → 404;
  - oyun sunucu adresinden hatasız açılıyor;
  - 734×330'da (iPhone 15 yatay + Safari çubukları) ve 560×300'de bütün sekmeler sığıyor, Ayarlar görünür ve
    dokunulabilir; 1280×720'de sekmeler tam adlarıyla;
  - "Tam ekrana geç" Ana Ekrana Ekle anlatımını açıyor, pencere ekrana sığıyor; başka adreste (itch.io gibi) oyunun
    kalıcı adresine bağlantı veriliyor.
- Render derleme komutu temiz bir kopyada koşuldu (`npm ci --include=dev && npm run build && cd server && npm ci`); sunucu
  oyunu sunarak açıldı.
- Diğer e2e takımlarının hepsi geçti: ana 61/61, V2 32/32, V3 37/37, V4 39/39, kayıt 14/14, çevrimiçi 27/27, parti 25/25,
  ortak dünya 15/15, raid 17/17, hata regresyonu 6/6.
- Gerçek iPhone'da denenmedi (bu ortamda yok). Safari'nin tam ekran kısıtı Apple'ın; ana ekran uygulamasının çubuksuz
  açılması iOS'un bilinen davranışı.

## 4.5.2 — Bitmiş dungeon koşusu hatası (oyuncu bildirimi, 23 Ekim 2026)
- Birim: 232/232. Yeni:
  - `quests.test.js`: boss'u yenilmiş koşu (eski kayıt biçimi dahil) devam ettirilmez; yeni koşuda boss ganimeti hakkı
    var ve "Madenin Kalbi" tamamlanır.
  - `server.test.js`: bitmiş örnek boşalınca kapanır; yeni koşuyla gelen olursa örnek baştan kurulur (partide
    içerideki üye de yeni durumu alır).
- Yeni E2E `run-e2e-bugs.mjs` 6/6, gerçek tarayıcıda oyuncunun senaryosu: Derin Ocak önceden bitmiş + m17 sonradan
  alınmış.
  - Kapı "yeni koşu" soruyor; yeni koşuda golem doğuyor; golem ölünce görev tamamlanıyor.
  - Koşu "bitti" işaretleniyor; "Yeni koşu" düğmesi baştan başlatıyor ve golem yeniden doğuyor.
- Diğer e2e takımlarının tamamı yeniden koşuldu ve geçti. Ana takımda bir kez "normal saldırı hedefi öldürür"
  zamanlama kontrolü düştü (−1,0 sn); dungeon kodunu kullanmıyor, aynı takım hemen tekrar koşulunca 61/61 geçti.

## 4.5.1 — Parti dungeon boss canı ölçeklemesi (23 Ekim 2026)
- Birim: 230/230. Yeni 3 test:
  - ağırlık ve çarpan tablosu (tek kişi değişmez, 2 kişi ×1,75, 4 kişi ×3,25, düşük seviyeli yardımcı ×1,375);
  - katılma, ayrılma ve seviye atlamada yeniden hesap; can yüzdesinin korunması ve duyuru;
  - açık dünya boss'unun ölçeklenmemesi.
- E2E `run-e2e-raid.mjs` 17/17. İki Lv.20 oyuncu Derin Ocak'ta Maden Golemi'nin canını 35.000 (20.000 × 1,75) görüyor;
  boss çubuğunda "Parti ×1,75" yazıyor.
- Ortak dünya 15/15, ana e2e 61/61 yeniden koşuldu.

## 4.5.0 — Ortak boss'lar, parti dungeon'ları, ortak görev olayları, ticaret (23 Ekim 2026)
- Birim: 227/227.
  - `server.test.js` 26 test. Yenileri:
    - parti başına dungeon örneği; ilk girenin koşu durumu; partisiz oyuncunun ayrı örneği;
    - bölüm yaratıkları ve kapılar, bölüm temizlenince kapı açılması; kayıtlı koşudan açılış;
    - Buz Mabedi mühür dalgaları; Karanlık Mahzen mekanizmaları ve yanıltıcı düğüm;
    - açık dünya boss'u ve ödül kimliği;
    - Alfa Kurt'un sürü çağrısı, öfkesi, sıfırlanması ve çağrılmışların dağılması;
    - Maden Golemi kristal kalkanı; Fırtına Tiranı'nın çatlak zırhı;
    - alan savunması (tamamlanma ve başarısızlık), refakatin ilerleyip durması ve pusu, sunak dalgaları, ortak görev avı.
  - `trade.test.js` 6 test: kilitli eşya ve görev eşyası yasağı; takas; hep-ya-hiç; sunucu aracılığı (akış, sıfırlanan
    kilitler, "yer yok" ile iptal, kopma, ret, çevrimdışı hedef).
- E2E `run-e2e-raid.mjs` 16/16: gerçek sunucu süreci ve üç tarayıcı. Doğrulananlar:
  - **ticaret gerçek arayüzle:** istek → kabul → teklifler → kilitle → onayla. Eşya ve altın bir yöne, iksir diğer yöne
    geçti; kopya kalmadı; kayıt yazıldı.
  - **açık dünya boss'u (Alfa Kurt):** iki oyuncu aynı boss'u görüyor; sürü çağrısı ve boss çubuğu arkadaşta da var;
    parti üyesi tek seferlik boss ödülünü alıyor.
  - **Derin Ocak parti örneği:** ikinci üye "Bölgesine git" ile aynı örneğe giriyor; A 1. bölümü temizleyince B'nin
    koşusu ilerliyor ve kapı B'de de açılıyor; partisiz üçüncü oyuncu ayrı örnekte.
  - Eksik doku yok; konsol hatası yok.
- **Bulunan ve düzeltilen hata:** yalnız ses taşıyan boss olayları (uluma, kükreme) ekranda siyah "eksik doku" karesi
  çiziyordu. Testte ekran görüntüsünden yakalandı; düzeltildi ve teste eksik doku kontrolü eklendi.
- Diğer e2e takımları: 61/61, 32/32, 37/37, 39/39, kayıt 14/14, çevrimiçi 27/27, parti 25/25, ortak dünya 15/15.
- **Denenmedi:**
  - Gerçek Render sunucusunda ve internet gecikmesinde çok oyunculu boss/dungeon dengesi.
  - Dungeon boss'larının parti büyüklüğüne göre zorluğu (can ölçeklenmez; dört kişi daha kolay keser).
  - Boss mekaniklerinin tamamı tek tek uçtan uca: tarayıcıda yalnız Alfa Kurt, birim testte Golem, Tiran ve Alfa denendi.
    Diğerleri istemci kodunun birebir taşıması.

## 4.4.0 — Ortak dünya oyun sunucusu (23 Ekim 2026)
- Birim: 208/208. Yeni `tests/unit/server.test.js` (13 test) şunları doğrular:
  - harita başına yuva sayısı, ortak/dungeon ayrımı;
  - saldırgan yaratığın yakındaki oyuncuya saldırması, güvenli bölgede saldırı olmaması;
  - vuruş toplama, ölüm ve tek oyuncunun tam payı;
  - parti paylaşımı (2 kişi ×0,6; uzaktaki üye ve partisiz yabancı almaz), iki ayrı grubun ayrı payı;
  - elit kuralı ve duyurusu; elit alan yeteneğinin telegrafı ve alandaki herkesi vurması;
  - oyuncu ölünce/çıkınca hedef bırakma, yavaşlatma ve sersemletme;
  - sürüm/oturum reddi, aynı hesabın ikinci bağlantısı, kanallar ve presence, partinin EXP paylaşımı için tanınması,
    dungeon'ın ortak olmaması.
- E2E `run-e2e-world.mjs` 15/15 (iki kez arka arkaya). **Gerçek sunucu süreci** (`server/index.mjs`) ve iki tarayıcı
  kullanıldı; oturum, sahte Supabase'in yerel `/auth/v1/user` ucundan doğrulandı. Doğrulananlar:
  - bağlanma ve HUD sayısı; Fısıldayan Orman'da yaratıkların yalnız sunucudan gelmesi;
  - iki oyuncunun aynı yaratığı aynı kimlik ve konumda görmesi; partisiz diğer oyuncunun görünmesi;
  - yaratık saldırısının oyuncunun kendi savunmasıyla işlenmesi;
  - partinin sunucu üzerinden kurulması; A'nın vuruşunun B'de görünmesi; ölümü ikisinin de görmesi;
  - vurmayan parti üyesinin EXP payı ve öldürme sayacı alması (ekranda "Parti payı ×0,60 (2 kişi)"); partisiz
    yabancının ödül almaması;
  - sunucu kapanınca tek oyunculu devam, sunucu dönünce kendiliğinden yeniden bağlanma; `/health`; konsol hatası yok.
- Diğer e2e takımları: 61/61, 32/32, 37/37, 39/39, kayıt 14/14, çevrimiçi 27/27, parti 25/25.
- İlk tam koşuda ortak dünya testi 14/15 kaldı. Sebep testin kendisiydi: yaratık B'ye değil A'ya saldırmıştı, test
  yalnız B'ye bakıyordu. Test iki oyuncuyu da kontrol edecek şekilde düzeltildi.
- Docker imajındaki dosya kümesiyle sunucunun açıldığı yerelde denendi (Docker'ın kendisi bu ortamda yok).
- **Denenmedi:** Render'a gerçek kurulum ve internet üzerinden gecikme. Render'ın ücretsiz planda uyuma/uyanma davranışı
  belgelerine dayanır.

## 4.3.0 — Parti, Faz 1 (23 Ekim 2026)
- Birim: `tests/unit/party.test.js` (kod biçimi, güvenilmez verinin sınırlanması, lider sırası, kur/katıl, konum paylaşımı
  ve mesaj bütçesi, sohbet ve hız sınırı, ayrılma/kopma/bayat üye, 4 kişi sınırı, davetin yalnız hedefe gitmesi).
- E2E `run-e2e-party.mjs`: 25/25. **Gerçek** `@supabase/realtime-js` istemcisi, Playwright WebSocket yönlendirmesiyle
  Supabase Realtime protokolünü (Phoenix vsn 2.0.0: ikili yayın, presence_state/diff, kalp atışı) taklit eden sahte sunucuya
  bağlandı. Doğrulananlar: davet → kabul, birbirini haritada görme ve yürüyüş takibi, mini harita, parti çerçevesi, sohbet +
  balon, bölge değişimi bildirimi, "Bölgesine git", keşfedilmemiş bölge kuralı, lideri takip, yenilemede partiye dönüş,
  ayrılma, mobil sığma, konsol hatası yok. Ölçülen bütçe: 2 sn yürüyüş = 5 yayın, boşta 4 sn = 0 yayın.
- `kurulum.sql` yerel PostgreSQL 16'da 4.2.0 betiğinin üstüne iki kez çalıştırıldı; `online_players.user_id` geldi.
- **Denenmedi:** gerçek Supabase Realtime sunucusu (bu ortamdan `*.supabase.co`'ya erişim yok). Sahte sunucu
  kütüphanenin gönderdiği gerçek çerçevelerle çalıştı, ama Supabase'in ayarlarına (ör. herkese açık kanal izni) ve
  gecikmesine dair bir doğrulama değildir.

## 4.2.0 — Çevrimiçi oyuncular (23 Ekim 2026)
- `supabase/kurulum.sql` yerel PostgreSQL 16'da iki kez art arda çalıştırıldı (tekrar güvenli). `presence` denetimleri:
  istemci eski zaman gönderse de sunucu zamanı yazılır; anonim çevrimiçi listesini okur; B, A adına yazamaz, A'nın satırını
  değiştiremez/silemez; 90 sn'den eski satır görünümde yok; A kendi satırını siler; anonim yazamaz — hepsi beklendiği gibi.
- Birim: 186/186 (yeni: hata kodu mesajları, takma ad onarımı, presence akışı sahte Supabase'te).
- E2E çevrimiçi: 27/27 (yeni: HUD sayısı 1 → arkadaş oyuna girince 2, listede takma ad/karakter/sınıf/seviye/harita ve
  "(sen)", çıkış yapan listeden hemen düşer, D cihazında konsol hatası yok).
- **Denenmedi:** gerçek Supabase projesine bağlantı (bu ortamın ağ politikası `*.supabase.co`'ya izin vermiyor); gerçek
  sunucudaki davranış SQL'in yerel PostgreSQL denemesine ve sahte sunucuya dayanır.

## 4.1.0 — Çevrimiçi test katmanı (23 Ekim 2026)

| Paket | Sonuç |
|---|---|
| Birim testleri (16 dosya) | **183 / 183 geçti** — +9 çevrimiçi (`online.test.js`: ayar doğrulama ve gizli anahtar reddi, bulut kaydı kuralları, liderlik satırları, REST istemcisi sahte Supabase'e karşı: kayıt/giriş, başka cihazda indirme, satır görünürlüğü, oturum yenileme, ağ hatası, e-posta onayı), +1 kayıt (`flushSave` birleştirme) |
| Çevrimiçi uçtan uca (`run-e2e-online.mjs`, yeni) | **22 / 22 geçti** (art arda 5 koşu). Gerçek oyun arayüzü; Supabase, Playwright ağ yönlendirmesiyle bellek içi sahte sunucu (`tests/fake-supabase.mjs`) — dış ağa çıkılmadı |
| Kayıt / V4 / V1 / V3 uçtan uca | **14 / 14**, **39 / 39**, **61 / 61**, **37 / 37** |
| V2 uçtan uca | **32 / 32** (art arda iki koşu) |
| Supabase SQL (`supabase/kurulum.sql`) | PostgreSQL ayrıştırıcısıyla 32 ifade; **yerel PostgreSQL 16'da** Supabase benzeri `auth` şeması ve `anon`/`authenticated` rolleriyle çalıştırıldı (iki kez — tekrar çalıştırılabilir): 16 politika denemesi beklendiği gibi (kendi kaydı okunur/yazılır, başkasınınki görünmez/yazılamaz, liderlik herkese açık okunur, anonim yazamaz, bildirim yalnız eklenir, takma ad tekil, seviye sınırı) |

**Gerçek bir Supabase projesine karşı test yapılamadı** (hesap yok). İstemci, Supabase'in belgelenmiş REST/Auth uç noktalarına
göre yazıldı ve sahte sunucuyla sınandı; ilk gerçek kurulumda `docs/ONLINE_KURULUM.md` adımlarıyla denenmesi gerekir.

Bu turda bulunan ve düzeltilenler:
- **Kayıt (önceden vardı):** bir kayıt sürerken istenen kayıt yalnız işaretlenip hemen dönüyordu; `await flushSave()` en son durumun
  yazıldığını garanti etmiyordu. Yük altında kayıt e2e testinde görüldü (bir kez 4/8). Artık ardından gelen kayıt bitene kadar
  beklenir; birim testi eklendi. Normal oyunda risk, sekme tam o anda kapanırsa son birkaç saniyelik ilerlemeydi.
- **Servis işçisi:** başka kökene giden GET istekleri önbellek denetiminden geçiyordu; artık doğrudan ağa gider.
- **Test zamanlamaları:** V2 "Buz Gardiyanı" kontrolü gerçek saatle 9 sn bekliyordu; yetenek 5–8 sn *oyun* süresinde gelir ve
  yazılımsal WebGL'de oyun saati yavaş akar (bir koşuda 8,8 sn oyun = 12,1 sn gerçek). Kontrol artık oyun saatiyle bekler.
  Önceki turda "Kırılan Ufuk" konum denetimi yarışı da giderilmişti. Oyun kodu bu iki test için değişmedi.

## 4.0.1 — Okçu / Ölü Çağıran / iskelet sprite'ları (23 Ekim 2026)

| Paket | Sonuç |
|---|---|
| Birim testleri | **173 / 173 geçti** (oyun mantığı değişmedi) |
| V4 uçtan uca | **39 / 39 geçti** (yeni sprite'larla: ok mermisi ve duvar, Ruh Mermisi, iskelet kuralları, 7'şer beceri) |
| V1 / V3 / kayıt uçtan uca | **61 / 61**, **37 / 37**, **14 / 14** |
| V2 uçtan uca | **32 / 32** (art arda iki koşu). "Kırılan Ufuk geçiş hedefleri" kontrolünün aralıklı düşmesinin nedeni bulundu: test, göçük konumunda görevi alıp geçidi hemen tetikliyordu; konumlar 0,5 sn oyun süresinde bir denetlendiği için ilk hedef bazen sayılmıyordu. Test artık geçitten önce konum denetimini bekliyor (oyun kodu değişmedi) |

Görsel kontrol (headless Chromium, kamera ×2): Okçu ve Ölü Çağıran hedefe döner; iskelet sağa bakar, saldırı karesinde kılıç
hedefe değer; mor mermi ve isabet patlaması görünür; karakter oluşturma kartlarında yeni sprite'lar. Gerçek cihazda görülmedi.

## 4.0.0 «Gökyarık Genişlemesi» (22–23 Ekim 2026)

Ortam önceki sürümlerle aynı (Linux, Node 22, Playwright headless Chromium, yazılımsal WebGL, mobil dokunmatik emülasyonu).
**Gerçek Android/iOS cihazında ve gerçek itch.io sayfasında test yapılamadı.** Komutlar: `npm test` ·
`npm run build && npm run test:e2e` (V1 + V2 + V3 + V4 + kayıt).

| Paket | Sonuç |
|---|---|
| Birim testleri (Vitest, 15 dosya) | **173 / 173 geçti** — +6 kayıt (`v4save`), +9 içerik (`v4content`), +8 denge (`v4balance`); eski testler V4 verisine göre güncellendi (davranış aynı: eski eşyalar `ITEM_LIST.slice(0,126)`, Legendary havuzları 4 eşya, şema ≥3, Lv.50, 102 görev, köyde +2 NPC, dört sınıfla görev zinciri) |
| V4 uçtan uca (`run-e2e-v4.mjs`, yeni) | **39 / 39 geçti** |
| V1 uçtan uca (`run-e2e.mjs`) | **61 / 61 geçti** |
| V2 uçtan uca (`run-e2e-v2.mjs`) | **32 / 32 geçti**. Bir koşuda "Kırılan Ufuk geçiş hedefleri ilerler" düştü (31/32), tekrar koşuda geçti — 3.0.1 raporundaki, 3.0.0 kodunda da düşen zamanlama kontrolüyle aynı |
| V3 uçtan uca (`run-e2e-v3.mjs`) | **37 / 37 geçti** |
| Kayıt uçtan uca (`run-e2e-save.mjs`) | **14 / 14 geçti** |
| Üretim derlemesi | Başarılı; servis işçisi sürümü 4.0.0 |

Eski e2e senaryolarında yapılan uyarlamalar (davranış testi değişmedi): ana menüde bir kez çıkan V4 yedek hatırlatması kapatılır;
şema beklentisi 3 → 4; ana menü yedek düğmeleri artık Kayıt Güvenliği bölümünde (`copy-code` / `paste-code`); PWA sürümü
`package.json`'dan okunur. Bir vitest çalışmasında ağır loot testinin iş parçacığı zaman aşımı uyarısı vardı; test olay
döngüsüne dönecek şekilde düzenlendi (çıkış kodu artık 0).

### V4 uçtan uca (gerçek tarayıcı, 844×390 ve 640×360)

5 karakter yuvası ve 4 sınıf kartı · Okçu Lv.1 değerleri (HP 130, MP 67, menzil 7, ≤1,25 sn), görünür okla uzaktan öldürme
(MP harcamadan) · **ok duvara çarpar** (arada opak karo varken hedef hasar almaz) · Okçu Lv.15 dört becerisi ve **Lv.50'de 7
aktif becerinin hepsi** · Ölü Çağıran Lv.1 değerleri (HP 115, MP 162, menzil 6) · Ruh Mermisi MP harcamaz · İskelet Çağır;
**hedef seçilmeden iskelet saldırmaz (AFK yok)**; yalnız seçili hedefe saldırır; iskeletin öldürdüğü yaratık tek öldürme / tek
ödül · en çok 2 iskelet; kayıtta yalnız `{main, hpPct}` · harita değişiminde çoğalmaz, ölümde dağılır ve geri gelmez,
kapat-açta bir kez geri gelir · Ölü Çağıran Lv.50 7 becerisi (Ölüler Ordusu sonrası ≤2 iskelet) · Kara Taht kuzey geçidi m47
olmadan kapalı, yarık incelenince açılır · Gökyarık Ovası yaratıkları, Fırtına Tiranı, Atlas, yol taşı, sandıklar, toplama,
parçacıklar · V4 yaratık ve elit yetenekleri telegrafla başlar · **Fırtına Tiranı:** %60 Kristal Çağrısı (2 kristal, %60
azaltma), kristaller kırılınca kalkan söner ve savunma 105 → 68, %25 Son Gök Gürültüsü, garantili Tiran Çekirdeği · Yıldız
Mezarı geçidi m53 ile açılır; yaratıklar, Leyla, Tufan, 3 mercek · Mabet kapısı m56 olmadan mühürlü; giriş mühürleri yanlış
sırada ipucu verir, doğru sırada kapı açılır · **Mabet:** kapı mührü olmadan 1. bölüm kapanmaz; yanıltıcı düğüm ipucu verir,
sayılmaz; üç gök mührünün her biri iki savunma dalgası, ikinci dalgadan sonra kırılır · **Göğün Mahkûmu:** %65 kalkan + 2 Gök
Mührü, mühürler kırılınca kalkan düşer; %30 Yıldızların Sonu (≤4 alan); ölümde boss tam can, kalkan/mühürler sıfır, bölümler
korunur (kontrol noktası); garantili Mahkûmun Zinciri, ikinci ödül yok · 640×360'ta iskelet HUD ekranda, yatay taşma yok ·
Ayarlar → Kayıt Güvenliği (son kalıcı kayıt, teknoloji, 7 düğme) · V4 yedek hatırlatması bir kez · PWA 4.0.0 çevrimdışı.
Bütün turlarda konsol hatası yok.

Not: e2e savaşları geliştirici kancalarıyla hızlandırılır (hasar doğrudan uygulanır, karakter taşınır, etkileşim kanal süresi
atlanır). Fazlar, kristaller, mühürler, dalgalar ve iskelet kuralları gerçek oyun döngüsünde çalışır; ama tam bir boss savaşı
dokunmatik kontrolle baştan sona oynanmadı. Yazılımsal WebGL'de FPS 19–44 (ekran görüntülerindeki sayaç).

### V4 birim testleri

| Alan | Doğrulanan |
|---|---|
| Kayıt (`v4save`) | 3 yuvalı profil 5'e genişler (sıra, kimlik, seviye, eşya, gold, stat, görev aynı); migrasyon doğrulamadan önce; şema 3 kaydı yüklenir, `v3_backup` bir kez; IndexedDB açılamaz ve kopya yoksa boş profil "yüklendi" sayılmaz, hata türü bildirilir; aynadaki eski kayıt yüklenir, üzerine boş yazılmaz; yalnız bellek kalıcı sayılmaz |
| İçerik (`v4content`) | Lv.50; 40→50 EXP 153.680 … 282.440 (toplam 2.142.150); şema 4, 5 yuva; Okçu/Ölü Çağıran taban stat, HP/MP/güç formülleri, aralık/menzil; 7 aktif (1/5/10/15/25/35/45) + 3 pasif adları; Ustalık II/III; Yıldırım Yarığı ×2,20 / Astral Patlama ×2,00 6 hedef, 24 sn; Can Sömürüsü ≤%5; 210 eşya (84 yeni); her 10 seviyelik bantta yeni sınıf silah+gövde; Lv.1–5 yaratıkları yeni sınıf ekipmanı düşürür; normal R %0,25 / elit E %0,75 değişmedi; 4 Legendary bossunda 4 sınıfın Legendary'si; 400.000 Mahkûm kesiminde L %0,4 ve %80 kendi sınıfı; Tiran ve V4 elitlerinde Legendary yok; Legendary tarifi yok; elit/boss değerleri ve loot tabloları; haritalar 124×88 / 128×92, 4 kamp, elit, 2 sandık, yol taşı, ≥6 toplama, onarımsız erişim; geçiş kilitleri gerçek görev bayraklarına bağlı; Mabet 5 bölüm, kontrol noktaları, koşu başına tek ödül, yanıltıcı düğüm sayılmaz; 5 NPC haritada ve görev verir; görevler Legendary vermez/istemez |
| Denge (`v4balance`) | Bkz. [`V4_NOTLARI.md`](V4_NOTLARI.md): dört sınıf Lv.10–50 farm, V4 yaratıkları 6,7–13,7 sn, elitler 52–84 sn, Tiran 4,4–6,7 dk, Mahkûm 5,9–7,4 dk, iskelet payı %25–35, 40→50 ≈10,2 sa |
| Görevler (`quests`, güncellendi) | 102 ana/yan görev + sınıf/rehber görevleri **dört sınıfla** sırayla alınır, tamamlanır, ödül bir kez; Gökyarık/Yıldız Mezarı bayrakları, Mabet kilidi, "Göğün Bekçisi" unvanı, Ustalık II ve III |

## 3.0.1 — Kayıt sağlamlaştırma (22 Ekim 2026)

Komutlar: `npm test` · `npm run build && npm run test:e2e:save`. Gerçek telefon / gerçek itch.io sayfasında test **yapılamadı**;
tarayıcı testleri yerel önizleme sunucusunda headless Chromium ile yapıldı.

| Paket | Sonuç |
|---|---|
| Birim testleri (Vitest, 12 dosya) | **150 / 150 geçti** (+21 kayıt sağlamlığı testi: `tests/unit/saveRobust.test.js`). Vitest bir kez, ağır denge simülasyonu sırasında iç "onTaskUpdate" zaman aşımı uyarısı verdi; bütün testler geçti |
| Kayıt uçtan uca (`run-e2e-save.mjs`, yeni) | **14 / 14 geçti** |
| V3 uçtan uca (`run-e2e-v3.mjs`) | **37 / 37 geçti** |
| V1 uçtan uca (`run-e2e.mjs`) | 60 / 61 — düşen tek kontrol "Performans: dungeon" (yazılımsal WebGL'de 8,8 FPS; ortam yükü) |
| V2 uçtan uca (`run-e2e-v2.mjs`) | 29–30 / 32 — "Kırılan Ufuk geçiş hedefi", "Buz Gardiyanı telegrafı" (ve bir koşuda "Kül Kasabı telegrafı") zamanlama kontrolleri. **Aynı kontroller değişiklik öncesi 3.0.0 koduyla da aynı ortamda düştü** (karşılaştırma koşusu: 30/32); kayıt değişikliğiyle ilgisizler |

Kayıt uçtan uca testi gerçek tarayıcı depolamasında şunları doğrular: iki karakterli profil her kayıtta localStorage aynasına
da yazılır · tek bozuk eşyalı kayıt sıfırlanmadan onarılarak açılır, oyuncuya bildirilir, ham kopyası `rescue_*`'da kalır ·
IndexedDB veritabanı tamamen silinince karakterler aynadan geri gelir · karakteri eksik daha yeni bir kayıt açılınca "Kayıp
karakter bulundu" penceresi çıkar, "Geri yükle" karakteri profile koyar ve kaydeder · bilinçli silinen karakter kayıp sayılmaz ·
yedek kodu üretilir; IndexedDB ve localStorage tamamen silindikten sonra kod yapıştırılarak profil aynen döner · daha yeni
sürüm kaydı eski sürümde açılınca uyarı gösterilir ve kayıt (IndexedDB + ayna) üzerine yazılmaz · sayfa hatası yok.

Birim testleri ayrıca: meta alanı olmayan 3.0.0 zarfları, eski localStorage modu anahtarı, V1/V2 şema geçişleri (mevcut
testler) aynen açılır; yükleme hiçbir eski anahtarı silmez; ilerleme koruması kopyası, oturum geçmişi, anlık görüntüye dönüş
öncesi kurtarma kopyası, çift uid onarımı, checksum'ı tutmayan ama okunabilen kaydın kurtarılması, daha yeni şema yedeğinin
reddi.

## V3.0 «Kayıp Krallığın Mirası» (22 Ekim 2026)

Ortam önceki sürümlerle aynı (Linux, Node 22, Playwright headless Chromium, yazılımsal WebGL). Gerçek Android/iOS
cihazında test **yapılamadı**. Komutlar: `npm test` · `npm run build && npm run test:e2e` (V1 + V2 regresyonu + V3).

| Paket | Sonuç |
|---|---|
| Birim testleri (Vitest, 11 dosya) | **129 / 129 geçti** (V1/V2 testleri V3 verisine göre güncellendi; +19 V3 içerik/kayıt testi, +6 V3 denge testi) |
| V1 uçtan uca regresyon (`run-e2e.mjs`) | **61 / 61 geçti** |
| V2 uçtan uca regresyon (`run-e2e-v2.mjs`) | **32 / 32 geçti** (V1 kaydı artık doğrudan şema 3'e geçer) |
| V3 uçtan uca (`run-e2e-v3.mjs`) | **37 / 37 geçti** |
| Üretim derlemesi | Başarılı; servis işçisi sürümü 3.0.0 |

### V3 birim testleri (`tests/unit/v3.test.js`, `tests/unit/v3balance.test.js`)

| Alan | Doğrulanan |
|---|---|
| Kayıt | Şema 2 Lv.30 zarfı kayıpsız açılır (seviye, EXP, gold, statlar, Legendary +4, beceri çubuğu, görevler, koşular, bayraklar); V3 alanları eklenir; `v2_backup` bir kez yazılır ve geri yüklenebilir; görev durumları aynen kalır, yeni görevler yapılmamış görünür |
| Seviye | 30→40 EXP tablosu (64.880 … 142.450, toplam 1.006.820); 30→31 ve 39→40 geçişleri; Lv.40 sınırı; her seviyede +3 stat / +1 beceri |
| Görevler | 80 tek seferlik görev; V3 ana 212.000, V3 yan 39.000, erken yan 44.260 EXP; ödüller ekipman içermez; 13 NPC doğru haritada ve görev verir; kademeli açılış; bütün görevler (ana, yan, sınıf) iki sınıf için programatik olarak alınır, tamamlanır, ödül bir kez verilir; üretim görevi yalnız gerçek üretimle; aynı araştırma nesnesi iki kez sayılmaz; Siyah Kapı arması tüketilir ve bayrak açılır; olay hedefleri bir kez sayılır |
| İçerik | 8 normal / 2 elit / 2 boss statları ve doğma haritaları; 126 eşya; **36 V3 eşyasının her biri bir loot havuzundan ya da tariften elde edilir**; Komutan'ın 2 özel Epic silahı |
| Loot | Legendary yalnız Golem, Donmuş Muhafız, Kayıp Kral havuzlarında (%0,4); Golem/Muhafız havuzları değişmedi; diğer her kaynak 100.000 öldürmede 0 Legendary; hiçbir tarif Legendary üretmez; Kırık Taç Parçası yalnız işleme/Epic tariflerinde; kullanım eşyası etkileri ganimeti değiştirmez (aynı tohum → aynı sonuç) |
| Haritalar | Her portalın hedef haritası ve girişi var; kilitler gerçek görev/bayrağa bağlı; V3 haritaları onarımsız erişilebilir; 120×88 / 124×92; 2'şer gizli sandık; Karanlık Mahzen 4 bölüm, 2 mekanizma, 3 mühür, kontrol noktaları |
| Beceriler / ekonomi | Sarsılmaz Öfke / Donmuş Zaman belge değerleri; 6 aktif / 4 düğme, eski çubuk korunur; Ustalık II sınıfa özel ve Lv.40 + hikâyeye bağlı; Lv.31+ yükseltme V3 materyalleri, +5 sınırı, başarısızlıkta kırılma yok; hasar azaltma %60 sınırı |
| Denge | Bkz. [`V3_NOTLARI.md`](V3_NOTLARI.md): normal 3,9–11,8 sn, elit 49–69 sn, Komutan 4,0–4,9 dk, Kral 5,4–5,8 dk, 30→40 ≈10,4 sa |

### V3 uçtan uca (gerçek tarayıcı, 844×390 mobil yatay)

V2 kaydı gerçek IndexedDB'den V3'e geçer; Ayaz → Ölü Krallık kilidi ve geçişi; Ölü Krallık yaratıkları, NPC'leri,
parçacıkları, sandık ve toplama düğümleri; gerçek öldürme EXP'siyle 30→31; Mezar Büyücüsü laneti; Kefen Avcısı öfkesi ve
garantili damgası; Mezar Komutanı çağrıları (ödülsüz), bayrağı, Son Nöbet'i ve garantili arması; Siyah Kapı (arma tüketimi)
ve Kara Taht geçişi; refakat (uzaktayken durur, yakındayken takılmadan ulaşır, pusular ödülsüz); savunma (başarısızlıkta
yeniden denenir, başarı bir kez sayılır, dalgalar ödülsüz); Sarsılmaz Öfke'nin çubuğa yerleştirilmesi ve etkisi; Karanlık
Mahzen (mekanizmalar, mühür karşılaşmaları, Kral'ın üç fazı, ölümde sıfırlanma, tek ödül); kapat-aç kalıcılığı; Donmuş Zaman
(normal %55 / boss %20); kullanım eşyaları (tüketim ve savaş kontrolü, Dönüş Parşömeni seyahati); görev günlüğü filtreleri
ve HUD'da 3 takip; PWA 3.0.0 önbelleği ve çevrimdışı açılış. Konsol hatası yok.

Not: e2e savaşları geliştirici kancalarıyla hızlandırılır (hasar doğrudan uygulanır); fazlar, çağrılar ve olaylar gerçek
oyun döngüsünde çalışır.

## V2.0 «Kül ve Ayaz» (21 Ekim 2026)

Ortam V1 ile aynı (Linux, Node 22, Playwright headless Chromium, yazılımsal WebGL). Gerçek Android/iOS cihazında test
**yapılamadı**. Komutlar: `npm test` · `npm run build && npm run test:e2e` (V1 regresyonu + V2 senaryoları).

| Paket | Sonuç |
|---|---|
| Birim testleri (Vitest, 9 dosya) | **103 / 103 geçti** (V1'in 75 testi V2 için güncellendi + 23 V2 testi + 5 V2 denge/veri testi) |
| V1 uçtan uca regresyon (`run-e2e.mjs`) | **61 / 61 geçti** — V1 kontrolleri, kayıt, PWA, Derin Ocak ve Golem değişmeden çalışıyor |
| V2 uçtan uca (`run-e2e-v2.mjs`) | **32 / 32 geçti** |
| Üretim derlemesi | Başarılı |

### V2 birim testleri (`tests/unit/v2.test.js` ve güncellenen dosyalar)

| Alan | Doğrulanan |
|---|---|
| Kayıt geçişi | Şema 1 zarfı açılır; seviye, gold, Legendary M08+3, görevler aynen; beceri çubuğu (V1 düzeni), Av Geçmişi (`fromV1`), koşu/kitap alanları eklenir; doğrulama geçer; V1 legendary etkisi aynı; daha yeni şema reddedilir; geçiş idempotent; depo `v1_backup`'ı bir kez yazar, sonraki açılışta yeniden yazmaz |
| Seviye | 20→21 ve 29→30 eşikleri tam EXP ile; Lv.30 sınırı (fazla EXP 0); 87 stat, 29 (+2 sınıf görevi) beceri puanı; her seviyede HP/MP artışı; Lv.25 becerisinin açılması; EXP tablosu 19.280 … 58.610 (toplam 368.300) |
| Haritalar | 112×80 ve 116×88 ölçüleri; 4 farm kampı (≥150 spawn hücresi), 1 elit, boss arenası, güvenli kamp, 2 gizli sandık, Yol Taşı, ≥10 toplama düğümü, NPC'ler; her girişten tüm hedeflere onarımsız erişim (V1 harita testleri V2 haritalarını da kapsar); gerçek ve çift yönlü geçitler; Maden→Kül (m27) ve Kül→Ayaz (m33) hikâye kilitleri; Buz Mabedi 4 bölüm, 3 mühür galeride, kapılar koridorları kapatır |
| Loot | **Donmuş Muhafız 1.000.000 kesim: Legendary %0,4 toplam (4σ), Rare %30, Epic %7, kendi sınıfı %80, 1000+ kesimlik kuraklık (pity yok)**; Kül Devi 300.000 kesim: Rare %22, Epic %2, **0 Legendary**; V2 elitleri Epic havuzlu, Legendary'siz; **30 V2 eşyasının tamamı bir kaynaktan elde edilebilir**; boss kanonik havuzları belgeyle aynı; Golem Legendary/Rare havuzu V1 ile birebir aynı; Golem ve Muhafız dışında hiçbir kaynakta Legendary yok (her kaynak 100.000 öldürme); hiçbir tarif Legendary üretmez; Av Geçmişi sayaçları ganimeti etkilemez (aynı tohum → aynı sonuç) |
| Buz Mabedi | Ayrı kilit ve koşu (V1 Derin Ocak etkilenmez); mühür bir kez sayılır; ölüm noktaları cp1/cp2/checkpoint; devam; koşu kimlikli tek boss ödülü; çıkış ve yeni koşu; "Buz Mabedinin Sırrı" kapı mührünü önce şamanlar yenilince açar |
| Beceriler | Kılıç Yağmuru / Zincir Yıldırım belge değerleri; beceri çubuğu (4 yuva, kilitli beceri konamaz, yer değiştirme, kayıtta kalır); Ustalık Kitabı (Lv.30 + Rank 5 + kitap, her beceriye bir kez, sıfırlamada kalır) |
| Ekonomi | Lv.21+ yükseltmeler aynı başarı oranı / daha yüksek maliyet; +3/+4 V1 materyali (Sertleştirme Taşı, Sunak Kristali) gerekir; +5 Kor Çekirdeği (Kadim Çekirdek'ten üretilir); başarısızlık eşyayı kırmaz/düşürmez; +5 sınırı; V2 tarifleri V1 materyallerini (Golem Parçası) tüketir; sınırsız gold döngüsü testi tüm 35 tarifi kapsar |
| Denge | Aşağıdaki tablo |

### V2 denge simülasyonu (gerçek stat/hasar formülleri; V2 senaryolarında rastgele bonuslu eşya ve bütün beceri puanları)

| Senaryo | Sonuç | Hedef |
|---|---|---|
| Warrior Lv.26 Rare+3 → Kül Devi | ~4,2 dk | 3–5 dk |
| Mage Lv.26 Rare+2 → Kül Devi | ~3,3 dk | 3–5 dk |
| Warrior Lv.30 Rare/Epic+4 → Donmuş Muhafız (+2 kristal) | ~5,4 dk | 4–6 dk |
| Mage Lv.30 Rare/Epic+3 → Donmuş Muhafız (+2 kristal) | ~4,0 dk | 4–6 dk |
| V2 normal yaratık öldürme süresi (seviyeye uygun donanım) | Warrior 1,6–5,4 sn · Mage 1,5–3,3 sn | ≤ 20 sn (120 öldürme/saat bütçesi) |
| 20→30 toplam süre | ~5,8 sa farm + ~3 sa görev/boss/zindan ≈ **8,8 sa** | 8–12 sa |

Hareket payı (telegraflardan kaçma) Warrior ×1,2, Mage ×1,3 olarak modellenir; gerçek oynanışla ölçülmemiştir.

### V2 uçtan uca testleri (`tests/e2e/run-e2e-v2.mjs`, gerçek oyun içinde)

| Test | Sonuç |
|---|---|
| Tarayıcı deposuna yazılan V1 zarfı açılır, V2'ye geçer, seviye/gold korunur, V1 yedeği saklanır | ✔ |
| Lv.20→26 gerçek EXP ile; V1 finali olmadan Kül Yaylaları geçidi kapalı (uyarı); "Kırılan Ufuk" sonrası geçiş ve görev hedefleri | ✔ |
| Kül Yaylaları: 4 yaratık + Kül Devi doğar; parçacıklar, NPC, sandık, Yol Taşı, cevher; V2 öldürme ödülleri ve Av Geçmişi | ✔ |
| V2 sprite'larının darbe/ölüm animasyonları | ✔ |
| Kül Devi gerçek AI ile: telegraflı saldırılar, ≤3 alev yarığı, %55'te 2 yardımcı; yardımcılar EXP vermez; ölümde tehlikeler temizlenir; yeniden doğma zamanlanır | ✔ |
| Kül Kasabı öfke + telegraflı satır + garantili nişan; gizli sandık tek seferlik | ✔ |
| Ayaz Geçidi: 4 yaratık, kar, mabet kapısı; Buz Gardiyanı telegrafları; mabet görev olmadan mühürlü | ✔ |
| Buz Mabedi: bölümler, mühürsüz galeri kapanmaz, 3 mühür karşılaşması → boss kapısı; Buz Mührü + 2 kristal; ölüm → boss tam can, bölümler korunur; tek boss ödülü; ikinci ödül yok; gönüllü çıkış | ✔ |
| Beceri çubuğu UI ile 5. beceri yerleşir; Ustalık Kitabı UI ile uygulanır (tam 1 kitap); Av Geçmişi ekranı | ✔ |
| Kılıç Yağmuru çok hedef; Mage Lv.25 Zincir Yıldırım ≥3 hedefe sıçrar; iki turda da konsol hatası yok | ✔ |

Performans (yazılımsal WebGL, 844×390): V1 ölçümleri değişmedi (orman ~26 FPS, dungeon ~19 FPS); V2 ekran görüntülerinde
Kül Yaylaları ~31 FPS, Ayaz Geçidi ~19 FPS, Buz Mabedi ~20 FPS. Yalnız etkin haritanın yaratıkları güncellenir; parçacıklar
sabit havuzdur. Gerçek telefonda ölçülmedi.

---

# Ahen Vadisi V1 — Test Raporu

Tarih: 21 Ekim 2026 · Ortam: Linux, Node 22, Chromium 141 (Playwright 1.56, headless, mobil dokunmatik emülasyonu,
**yazılımsal WebGL / SwiftShader**). Gerçek Android/iOS cihazında test **yapılamadı** (ortamda cihaz yok).

Komutlar: `npm test` (birim) · `npm run build && npm run test:e2e` (uçtan uca). E2E ekran görüntüleri: `tests/e2e/screens/`,
makine okunur sonuç: `tests/e2e/report.json`.

## Özet

| Paket | Sonuç |
|---|---|
| Birim testleri (Vitest, 8 dosya) | **75 / 75 geçti** |
| Uçtan uca testler (Playwright) | **61 / 61 geçti** |
| Üretim derlemesi (Vite) | Başarılı — toplam ~1,6 MB (Phaser 332 KB gzip, oyun 115 KB gzip) |

## Birim testleri (tests/unit)

| Alan | Doğrulanan |
|---|---|
| Veri | Tam 60 eşya; nadirlik 14/15/18/11/2; slot sayıları; her sınıf için her slotta eşya; 12 normal / 3 elit / 2 boss ve belge statları; loot tabloları toplam %100; tarif ID'leri; EXP tablosu (Lv1→20 = 88.150); 26 görev, EXP 16.550+5.500 ve Gold 5.365+1.590; görev hedeflerinin gerçek yaratık/konum/nesne/NPC'ye bağlılığı; köyde 7 NPC |
| Haritalar | 5 haritanın belge ölçüleri; her girişten tüm nesne/kamp/konumlara erişim (otomatik onarım gerekmeden); açık bölgelerde 4 farm kampı + 1 elit; çift yönlü geçitler; dungeon kapılarının gerçekten koridoru kapatması |
| Formüller | Lv1 HP/MP (174/51, 110/133); Lv1 Warrior→sıçan ≈15,6 hasar ve 2–3 vuruş eşiği; kritik ×1,5, %45 / hız %35 üst sınırları, min 1 hasar; DEF/MDEF ayrımı; Demir Deri ve Mana Kalkanı; +5 = temel saldırı +%30; 0 dayanıklılık −%25; karşılaştırmanın gerçek motordan gelmesi |
| Sınıflar | İki sınıf Lv1→20; 57 stat puanı; açılış seviyeleri (aktif 1/5/10/15, pasif 4/9/14); 21 beceri puanı, tümü maksimum için 33 puan; stat/beceri sıfırlama ücretleri |
| Loot RNG | Boz Kurt **200.000** öldürme: N/U/R oranları (%0,25 Rare dahil) 4σ içinde; Gözcü **150.000**: Epic %0,75; Maden Golemi **1.000.000** kesim: Legendary %0,397 (beklenen %0,4), Rare %28, Epic %6, sınıf ağırlığı %80; en uzun Legendary kuraklığı 2.492 kesim (pity yok); **Golem dışındaki her kaynak 100.000 öldürme: 0 Legendary**; havuzlar boş değil ve seviye uygun; bonus sayısı/aralık/tekrarsızlık/sınıf-slot uygunluğu (20.000 eşya); materyal %28; Kadim Çekirdek %25 |
| Envanter/ekonomi | 36 slot; çift el yardımcı eli kapatır; sınıf/seviye kontrolü; çanta doluyken Rare+ bekleyen ganimete gider; istif/sıralama; ortak depo aktarımı; alım/satım; Legendary satılamaz/parçalanamaz; kilitli eşya; crafting'in tek seferlik ve eksik materyalde hiç değişmemesi; 20 tarifin tamamı; **sınırsız gold döngüsü yok** (al→sat, craft→sat, al→parçala→sat, craft→parçala); tamir ve ölüm dayanıklılığı; çanta 36→42→48, depo 60→90 |
| Demirci | +1..+5 başarı oranları 20.000'er deneme (±%1,5); başarısızlıkta eşya kırılmaz/silinmez/seviye düşmez; materyal+gold tüketimi; maliyet çarpanları; yüzük/kolye yükseltilmez; N/U +5 için 3 Sunak Kristali |
| Görevler | Her hedefin harita işaretinin hedefin yapılabildiği haritayı göstermesi (çok haritalı görevde ipucu ilerler); 26 görevin + 2 sınıf görevinin her iki sınıfla gerçek olaylarla (öldürme, ulaşma, etkileşim, teslim, dungeon) alınıp tamamlanması; ödülün bir kez verilmesi; ön koşul ve seviye kilitleri; yanlış yaratık sayacı artırmaz; aynı nesne iki kez sayılmaz; Av Sözleşmeleri ayrı ve tekrarlanabilir |
| Dungeon | Kilit; koşu; kontrol noktaları; istemsiz kapanmada devam; tek boss loot'u (aynı killId ikinci kez ödül vermez); gönüllü çıkış ve yeni koşu |
| Kayıt | IndexedDB (fake-indexeddb) kapat-aç; checksum bozulunca snapshot'tan kurtarma; JSON dışa/içe aktarma, sürüm ve bütünlük kontrolü; geçersiz veri reddi (bilinmeyen eşya, çift uid); simüle edilmiş yazma hatası ve sonraki başarılı kayıt |
| Denge simülasyonu | Aşağıdaki tablo |

## Uçtan uca testler (tests/e2e/run-e2e.mjs)

| Test | Sonuç |
|---|---|
| HUD 640×360 (16:9), 780×360 (19,5:9), 800×360 (20:9), 844×390 (iPhone 14), 915×412 (Android 20:9): tüm kontroller ekran içinde, dokunma hedefleri ≥44 px, interaktif öğeler çakışmıyor, envanter paneli ekrana sığıyor, konsol hatası yok | ✔ (25 kontrol) |
| Dikey ekranda "telefonu yatay çevir" ekranı | ✔ |
| Düşmana dokunma (gerçek dokunmatik olay) → hedef seçimi ve yaklaşma | ✔ |
| Joystick sürükleme (CDP dokunmatik olayları) otomatik yaklaşmayı **1. karede** keser | ✔ |
| Joystick bırakılınca yaklaşma kendiliğinden başlamaz, hedef korunur | ✔ |
| Menzilde otomatik normal saldırı hedefi öldürür; hedef ölünce yeni hedef seçilmez | ✔ |
| Görüş hattı engelden geçmez; erişilemeyen hedefe sonsuz koşma yok | ✔ |
| Sayfa yeniden yüklenince karakter/gold/görev/harita/envanter korunur ve aynı haritaya dönülür | ✔ |
| Golem büyük saldırıyı telegrafla işaretler; Golem yenilir, bölüm 4 temizlenir; tek ölümden tek loot; gönüllü çıkış → yeni koşu ve yeni Golem | ✔ |
| PWA: servis işçisi etkin, **çevrimdışı yeniden açılış**, manifest | ✔ |
| Mage uzaktan (>3 tile) saldırır, normal büyü MP harcamaz | ✔ |
| Zehir tiki oyuncuyu öldürünce oyun döngüsü hatasız; ölüm penceresi ve yeniden doğma | ✔ |
| Görev yön okları aktif görevin hedefine giden gerçek yürüme yolu üzerinde görünür | ✔ |
| Joystick halkasının çevresine (halkanın dışına) dokunmak da yürütür | ✔ |
| Stat puanı 0'ın altına inmez (devre dışı butona zorla dokunulsa bile); onaylanınca kaydedilir | ✔ |
| Karakter panelinde 4 stat ve Onayla butonu kaydırmadan ekrana sığar (844×390) | ✔ |
| Harita geçişi okun tam üstü değil, geçidin 2 tile yanından da olur | ✔ |
| Tüccar: gold ve çanta doluluğu panel başlığında her zaman görünür | ✔ |
| Satın alma onay penceresi ister; Vazgeç ile gold değişmez, onayla düşer | ✔ |
| Kırmızı OTO butonu kapalıyken hedef kendiliğinden vurulmaz; büyük kılıç her basışta en yakın hedefe vurur | ✔ |
| Hazır sprite paketleri yüklenir: Warrior (Fantasy Warrior), Mage (Wizard Pack), Cevher Rahibi (Evil Wizard 2) | ✔ |

### Performans (SwiftShader yazılım GPU, 844×390)

| Senaryo | Oyun adımı / sn | Yaratık | JS bellek |
|---|---|---|---|
| Orman, normal yoğunluk | ~38–45 | 28 | ~35–65 MB |
| Orman + 30 saldırgan kurt | ~37–41 | 52 | ~35–65 MB |
| Düşük performans modu (30 FPS sınırı) | 23 (ekran 57 FPS'te yenilenirken) — **sınır uygulanıyor** | 52 | — |
| Derin Ocak (karanlık + ışıklar) | ~28–31 | 20 | — |

"Oyun adımı" WorldScene.update çağrı sayısıdır (Phaser'ın `actualFps` değeri ham ekran karelerini sayar ve FPS
sınırını göstermez; test bu yüzden adım sayacına göre yapılır).

Not: Bu değerler GPU'suz sanal makinede yazılımsal render ile ölçülmüştür; donanım hızlandırmalı telefonlarda
60 FPS hedefine ulaşılması beklenir ancak **gerçek cihazda ölçülemedi**. Oyun 60 FPS hedefler, ayarlardan
30 FPS düşük performans modu seçilebilir (efekt yoğunluğu da azalır).

## Denge simülasyonu (tests/unit/balance.test.js)

Gerçek `computeStats` + `playerHit` formülleriyle; normal saldırı + bekleme süresi dolan beceriler, MP bütçesi.
Normal yaratıklarda 12 ardışık öldürme (aralarda 2 sn yürüme) ortalamasıdır.

| Senaryo | Süre | Belge hedefi |
|---|---|---|
| Lv1 Warrior → Çayır Sıçanı vuruş başı | 15,64 hasar (2–3 vuruş) | ≈15,6 ✔ |
| Warrior Lv10 Rare +0/+3 → Kazmacı Goblin | ~2 sn | 4–9 sn |
| Warrior Lv19 Rare +3 → Çürük Muhafız | ~4 sn | 4–9 sn ✔ |
| Mage Lv19 Rare +2 → Çürük Muhafız | ~1,9 sn | 4–9 sn |
| Warrior / Mage Lv10 U+1 → Haydut Kaptanı | 20 / 13 sn | 25–50 sn |
| Warrior / Mage Lv11 U+2 → Alfa Kurt (saf DPS) | 79 / 59 sn | 90–150 sn |
| Warrior Lv20 Rare +4 / +3 → Maden Golemi | 185 / 189 sn | 180–300 sn ✔ |
| Mage Lv20 Rare +0 → Maden Golemi | 153 sn | 180–300 sn |
| Lv18–20 brüt farm geliri (120 öldürme/sa, iksir ve tamir öncesi) | ~1.800 G/sa | 900–1.400 net |

Hayatta kalma (yalnız düşmanın telegrafsız normal saldırıları, iksirsiz, oyuncu hiç kaçmadan):

| Senaryo | Ölüm süresi |
|---|---|
| Warrior / Mage Lv10 → Kazmacı Goblin | 28,4 / 15,6 sn |
| Warrior Lv10 → Haydut Kaptanı (elit) | 28,8 sn |
| Warrior / Mage Lv11 → Alfa Kurt | 43,1 / 24,3 sn |
| Warrior / Mage Lv20 → Maden Golemi | 42 / 21,9 sn |
| Warrior Lv19 → Çürük Muhafız | 30,2 sn |

Değerlendirme: Yaratık HP/ATK/DEF değerleri ve hasar formülleri belgedeki kanonik değerlerdir ve değiştirilmedi.
Bu değerlerle beceri patlaması (ilk 0,5 sn'de iki beceri + normal vuruş) erken/orta seviye normal yaratıkları hedeften
hızlı öldürüyor. Yalnız normal saldırı ve Uncommon/Normal ekipmanla süreler belge bandına (≈4–6 sn) giriyor.
Golem süreleri hedef aralıkta. Simülasyon üzerine yapılan V1 denge ayarları (belgede sabitlenmemiş parametreler):
aktif beceri rank artışı ~%6/rank, Warrior MP maliyetleri düşürüldü, Mage maliyetleri artırıldı, savaş içi MP
yenilenmesi %0,8/sn ve Warrior "Savaş Nefesi" (isabetli normal vuruş +2 MP).

Oynanış botu (aşağıda) bulguları üzerine yapılan ek ayarlar — **kanonik ATK değerleri değiştirilmedi**, yalnız
belgede sabitlenmemiş "telegrafsız normal saldırı katsayısı" eklendi: elitler ×0,7, Alfa Kurt ×0,35 (saldırı aralığı
2,0 sn), Maden Golemi ×0,5. Telegraflı büyük saldırılar (Yırtıcı Atılım ×1,8, Ezici Darbe ×2,2 vb.) tam güçte kaldı;
böylece hasarın çoğu kaçınılabilir saldırılardan gelir (belge §5: "boss hasarı kaçınılmaz tek vuruş ölümüne dönüşmemeli").
Alfa'nın çağırdığı Sürü Kurdu HP 160 / ATK 18'e indirildi ve 30 sn ömürlü yapıldı (belgede statı yok). Sürü uyarısı en yakın 2 boştaki
aynı tür yaratıkla, 5 tile ile sınırlandı; Yağmacı/Goblin/Yarasa/Cüce/Cevher Rahibi/Sis Cadısı algılama yarıçapları 4–5 tile'a düşürüldü. Sonraki denge turu için öneri:
normal/elit yaratık HP'lerinde ×1,5–1,8 artış veya Lv.1–12 aralığında beceri katsayılarının yumuşatılması.

## Oynanış botu (src/dev/bot.js · tools/bot-run.mjs)

Ana görev zincirini gerçek oyun kodu ve gerçek dokunmatik hedefleme API'si üzerinden oynayan bir Warrior botu
(Chromium + SwiftShader, oyun hızı ×4). Bot görev alır/teslim eder, hedefe dokunur, becerileri kullanır, telegraf
alanlarından kaçar, iksir/ekipman alır, çöpü parçalayıp Avcı Palası üretir, ot toplayıp iksir yapar, çok ölünce
seviye kasar ve her ölümde son 20 sn'nin hasar kaynaklarını yazar. Bot kiting yapmaz; bu yüzden insan oyuncudan
daha çok ölmesi beklenir.

**Bot sayesinde bulunup düzeltilen hatalar**

| Bulgu | Düzeltme |
|---|---|
| **Zehir tiki oyuncuyu öldürünce oyun döngüsü çöküyordu** (`poison.left` null) — oyun tamamen donuyordu | Sıra düzeltildi; e2e testi eklendi (zehirle ölüm → hatasız yeniden doğma); ayrıca dünya döngüsü varlık bazında korumalı: beklenmeyen bir hata konsola raporlanır ama oyunu dondurmaz |
| Elit sayacı haritadaki **tüm** öldürmeleri sayıyordu; Haydut Kaptanı (Lv10) görev 6'dan önce kampta beliriyordu | Belgedeki "alan-kesim katkısı" kuralı: yalnız elitin kendi kampındaki öldürmeler sayılır |
| Büyük boss gövdesi ev noktasına oturamayınca "dönüş" durumunda takılı kalıyor, iyileşiyor ve Sürü Kurtları haritada kalıcı tehlike olarak kalıyordu | Dönüşe 7 sn sınır; çağrılan yaratıklar savaş bitince dağılır; Sürü Kurdu 30 sn ömürlü |
| Görev 15 "Mührün Gücü"nün harita işareti Maden kapısını gösteriyordu, oysa ilk hedef (Çürük Muhafız) Bataklık'ta | Hedef bazlı ipucu: işaret önce Bataklık mezarlığını, sonra Maden kapısını gösterir; tüm görevler için birim testi |
| İki elli silah kuşanılıyken kalkan karşılaştırması sahte kazanç gösteriyordu (kalkan kuşanılamaz) | Karşılaştırma gerçek sonucu (değişiklik yok) gösterir; birim testi |
| Kalabalık kamplarda (Yağmacı, Cevher Rahibi, Sis Cadısı) uzak algılama 4–6 yaratığı aynı anda çekiyordu | Algılama yarıçapları 4–5 tile |
| **Daire telegrafları ekranda elips (dikey ×0,75) çiziliyor ama isabet testi tam daireydi** — oyuncu çizili alanın hemen üstünde/altında da vuruluyordu | İsabet testi görünen elipsle aynı (`inTelegraphCircle`; Ezici Darbe, Kristal Patlaması, Yer Sarsıntısı, Kasırga) |

**Son tam koşu (Warrior, ×4 hız):**

| Aşama | Seviye | Oyun içi süre | Toplam ölüm |
|---|---|---|---|
| Görev 6 Terk Edilmiş Kamp | 8 | 11,6 dk | 1 |
| Görev 7 Alfa'nın İni (Alfa Kurt) | 11 | 38,2 dk | 6 |
| Görev 10 Sert Kabuk | 12 | 48,3 dk | 6 |
| Görev 12 Sislerin Ardında | 15 | 83,4 dk | 17 |
| Görev 15 Mührün Gücü (dungeon kilidi) | 18 | 110,2 dk | 19 |
| Görev 16 Derinlere İniş (dungeon bölüm 1–3) | 19 | 129,9 dk | 26 |
| Lv.20'ye ulaşma, görev 17 (Madenin Kalbi) alındı | 20 | 150,2 dk | 30 |

Bot görev 1–16'yı tamamladı ve Lv.20'ye ulaştı. **Golem'i bu koşuda yenemedi:** bot, iksirleri bitince dungeon'dan
çıkıp ikmal yapmayı bilmediği için kontrol noktasından iksirsiz tekrar tekrar girdi (bot eksikliği). Ölümlerin çoğu
Cevher Rahibi (görev 11) ve Sis Cadısı (Lv.18–19 farmı) gruplarında; bunun üzerine bu menzilli yaratıkların algı
yarıçapı tekrar düşürüldü. Oyun içi 150 dk'da Lv.20 hızı, kiting yapmayan otomatik oyuncu içindir; insan oyuncuda
keşif, okuma ve ekonomi ile belgedeki 5–8 saatlik hedefin gerçekçiliği **ayrıca ölçülmedi**.

**Hedefli Golem denemesi** (`tools/golem-trial.mjs`; Lv.20, her denemeden önce 15 Büyük HP İksiri, bot telegraflardan
kaçar, gerçek oyun döngüsü, ×2 hız):

| Sınıf / donanım | Sonuç |
|---|---|
| Warrior, Rare +3 (6 slot) | 1. koşu: **181 sn'de yendi** (13 iksir). Telegraf düzeltmesinden sonra 2. koşu: 1. deneme Golem %9'dayken öldü (173 sn), 2. deneme **181 sn'de yendi** (12 iksir) — belge bandı 180–300 sn ✔ |
| Mage, Rare +0 | 3 denemede yenemedi; en iyi: Golem %54'te (71 sn). Ölümlerin çoğu Ezici Darbe (1,5 sn telegraf) — bot büyücü bu saldırıdan güvenilir kaçamıyor; Mage'in saf DPS'i Warrior'dan yüksek. **İnsan oyuncuyla Mage–Golem dengesi doğrulanmadı.** |

Golem savaşı iksir tüketimi yüksek (Warrior ~12–13 Büyük HP İksiri ≈ 1.700–1.800 Gold); Golem gold/loot getirisiyle
birlikte bir sonraki denge turunda değerlendirilmeli.

## Görsel inceleme

`tools/scenario.mjs`, `tools/panels.mjs`, `dev/gallery.html` ile 5 harita, tüm paneller, NPC hizmetleri,
karakter/yaratık/ikon/efekt sayfaları tarayıcıda çalıştırılıp ekran görüntüleriyle incelendi; konsol hatası yok.

## Kalan sınırlamalar (dürüst bildirim)

- **Gerçek cihaz testi yok:** Android/iOS donanımında FPS, dokunmatik his, ses gecikmesi ve tam ekran davranışı doğrulanmadı.
  Safari/WebKit motoru ortamda bulunmadığından test edilmedi. iPhone Safari tam ekran API'sini desteklemez; oyun
  "Ana Ekrana Ekle" ipucu ve yatay çevirme ekranıyla geri düşer.
- **Lv1→20 tam manuel (insan) oynanış (5–8 saat) yapılmadı.** Yerine oynanış botu gerçek oyun kodu üzerinden görev
  1–16'yı tamamlayıp Lv.20'ye ulaştı (yukarıda); Golem ayrıca hedefli denemeyle Warrior'la yenildi. Mage–Golem dengesi
  ve görev 17–18'in bot tarafından uçtan uca oynanması doğrulanmadı (görev zinciri birim testlerinde olay bazlı tamamlanıyor).
- **Denge:** yukarıdaki tabloda belge hedeflerinden sapmalar açıkça gösterildi; kanonik statlar korunduğu için ince ayar sonraki tura bırakıldı.
- **Görseller:** oyuncu karakterleri ve Cevher Rahibi hazır CC0 sprite paketleri (LuizMelo), diğerleri procedural. Hazır sprite'larda kuşanılan ekipman karakter üzerinde görünmez (statlara etkisi sürer). Karakterler 2 yönlü (sağ/sol). Su derin ve geçilmez.
- **Ses:** WebAudio sentezi; basit efekt/ortam/müzik döngüleri.
- **Kayıt güvenliği:** yerel kayıt bilerek düzenlenmeye karşı tam güvenli değildir (belge §1.3); checksum yalnız bozulmayı yakalar.
