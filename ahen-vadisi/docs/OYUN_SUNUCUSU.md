# Ortak dünya oyun sunucusu (4.4.0+, raid ve ticaret 4.5.0)

Bu sunucuya bağlanan herkes **aynı dünyayı** görür: açık haritalardaki yaratıklar ve boss'lar sunucuda yaşar, partiler
dungeon'ları birlikte yapar, oyuncular ticaret yapar. Bir yaratığa vurduğunda
arkadaşın da canının düştüğünü görür, öldürünce ikiniz de ölümü görürsünüz. Partideyseniz EXP ve altını paylaşırsınız.

Supabase giriş/kayıt, bulut kaydı ve liderlik için kullanılmaya devam eder. Oyun sunucusu ayrı ve küçük bir Node.js
programıdır (`server/`). Ücretsiz olarak Render'da çalışır.

## Neler ortak (4.5.0)

| Ortak (sunucuda, herkes aynısını görür) | Notlar |
|---|---|
| Açık haritalardaki kamp yaratıkları, elitler ve **boss'lar** (Alfa Kurt, Kül Devi, Mezar Komutanı, Fırtına Tiranı) | Boss mekanikleri (çağrılar, kalkan kristalleri, yer tehlikeleri, fazlar) alandaki herkesi etkiler |
| **Dungeon'lar parti başına ayrı örnek** (Derin Ocak, Buz Mabedi, Karanlık Mahzen, Gökyarık Mabedi) | Partideki herkes aynı örnekte: bölümler, kapılar, mühürler/mekanizmalar, muhafız dalgaları, boss. Partisiz oyuncunun kendi örneği olur |
| **Görev olayları:** refakat (kervan/yolcu), alan savunması, sunak dalgaları, görev avları | Bölgede biri başlatınca herkes görür ve yardım eder; tamamlanınca görevi olan herkesin görev hedefi işler |
| **Ticaret:** çevrimiçi oyuncularla eşya, malzeme ve altın takası | Kilitle → Onayla → iki tarafta aynı anda uygulanır |

**Dungeon kuralları:**
- Her oyuncunun dungeon kilidi kendi karakterinde açık olmalı. Kapıdan girersin ya da parti penceresinden arkadaşının
  yanına "Bölgesine git" dersin.
- Örneği ilk giren oyuncunun koşu durumu kurar. Sonradan gelenlerin koşusu örneğe uyar: temizlenen bölümler, kırılan
  mühürler.
- Boss ganimeti her oyuncuya kendi koşusunda bir kez düşer (yerel kural).
- **Boss canı parti gücüne göre (4.5.1):** her oyuncu boss seviyesine göre 0,5–1,5 ağırlık taşır (aynı seviye = 1,
  seviye farkı başına %5). En güçlü oyuncu temel; diğer her oyuncu ağırlığının %75'i kadar can ekler. Örnekler:
  - boss seviyesinde 2 kişi ×1,75, 4 kişi ×3,25;
  - 10 seviye düşük yardımcı ×1,375; tek kişi değişmez.

  Katılan, ayrılan ya da seviye atlayan olursa can yüzdesi korunarak yeniden hesaplanır.
- Ölünce kendi kontrol noktanda doğarsın. Partide herkes bayılırsa boss eve döner ve sıfırlanır.

**Ticaret kuralları:**
- Kilitli eşyalar ve görev eşyaları takas edilemez.
- Teklif değişirse iki tarafın kilidi açılır.
- Takastan hemen önce her iki oyun da "verebilir miyim, çantama sığar mı" diye kontrol eder; biri hayır derse ticaret
  iptal olur ve hiçbir şey değişmez.
- Takas biter bitmez kayıt yazılır.

**Ödül kuralı:**
- Yaratığa hasar veren her grup ödül alır. Grup, bir parti ya da partisiz tek bir oyuncudur.
- Partide, yaratığın 30 kare yakınındaki üyeler EXP'yi ve altını **bonuslu** paylaşır. Paylaşan üye vurmamış da olabilir.
  - Kişi başı pay: 2 kişide ×0,6, 3 kişide ×0,47, 4 kişide ×0,4. Toplamda tek başına avlanmaktan %20–60 fazla EXP eder.
- Ganimet (eşya, malzeme) herkese **ayrı** düşer; kimse kimsenin ganimetini kapmaz.
- Görev öldürme sayacı, paylaşan herkese işler.
- Partisiz ve hiç vurmayan bir oyuncu, başkasının öldürdüğü yaratıktan ödül almaz.

**Kalan sınırlar:** karakterler hâlâ oyuncunun cihazında (ve bulut kaydında) durur; oyuncu hasarını istemci hesaplar
(hileye karşı korumalı değil).

Sunucu kapanırsa ya da uyursa oyun **durmaz**: tek oyunculu devam eder, sunucu dönünce kendiliğinden ortak dünyaya geçer.

**Test grubunun sunucusu (4.4.1'den beri oyuna gömülü):** `https://ahen-vadisi-sunucu.onrender.com`
(durum: `/health`, oyun bağlantısı: `wss://ahen-vadisi-sunucu.onrender.com/ws`).

## Render'a kurulum (ücretsiz, ≈5 dk)

1. <https://render.com> → **Get Started** → GitHub hesabınla giriş yap.
2. Panelde **New + → Blueprint**. Bu depoyu (`aygforge/aygforge.github.io`) seç. Render, depo kökündeki `render.yaml`
   dosyasını bulur.
   - Dal (branch): sunucu kodunun olduğu dal. Şu an `ccr-ad07308b-v4wgyw`; ana dala birleştirildiyse `main`.
3. **Apply** → kurulum birkaç dakika sürer.
   - Hizmet adı `ahen-vadisi-sunucu`, plan **Free**, bölge Frankfurt.
   - Supabase adresi ve herkese açık anahtar depodaki `public/online.json`'dan okunur; ek ayar gerekmez.
4. Bitince adresi açarak doğrula: `https://ahen-vadisi-sunucu.onrender.com/health` → `{"ok":true,"version":"4.4.0",…}`.
   Render adresi farklı verdiyse onu kullan.
5. Oyuna bağla — iki yol:
   - **En kolayı:** adresi bana gönder. `public/online.json` dosyasına
     `"gameServer": "wss://ahen-vadisi-sunucu.onrender.com"` satırını ekleyip yeni ZIP'i hazırlarım. Arkadaşların hiçbir
     ayar yapmaz.
   - **Hemen denemek için:** oyunda Ayarlar → Çevrimiçi → **Oyun sunucusu** → adresi yaz → Kaydet. Bu ayar yalnız o
     tarayıcıda geçerlidir.

Oyunda giriş yapıp haritaya girince sağ üstte **"● N çevrimiçi · sunucu"** yazar.

### Ücretsiz plan notları (Render)

- Hizmet **15 dakika hiç bağlantı olmazsa uyur**. İlk giren oyuncu onu uyandırır; bu yaklaşık 1 dakika sürer.
  - Bu sürede oyunda "○ sunucuya bağlanıyor…" yazar ve oyun tek oyunculu devam eder.
  - Sunucu kalkınca ortak dünyaya kendiliğinden geçilir.
- Ayda 750 ücretsiz saat var; tek bir hizmet bütün ay açık kalsa bile yeter.
- Uyuyunca ya da yeniden kurulunca dünya sıfırdan başlar: yaratıklar yeniden doğar. **Karakterler etkilenmez.**
- Oyunun ve sunucunun sürümü (ilk iki hane, ör. 4.4) aynı olmalı. Depo güncellenince Render sunucuyu kendisi yeniden
  kurar (`autoDeploy`). Eski sürümle bağlanan oyuncuya "oyunu güncelle" denir.

### Kendi sunucunda (VPS) çalıştırmak

```sh
cd ahen-vadisi
docker build -f server/Dockerfile -t ahen-sunucu .
docker run -d --restart=always -p 8787:8787 ahen-sunucu
```

Önüne TLS'li bir ters vekil (Caddy/Nginx) koy; oyun itch.io'da https üzerinden açıldığı için `wss://` gerekir.
Docker olmadan: `cd server && npm ci && cd .. && node server/index.mjs` (Node 20+).

## Teknik özet

- **Sunucu (`server/`):** `index.mjs` (HTTP `/health` + WebSocket `/ws`), `hub.mjs` (bağlantılar, kimlik, bölgeler,
  parti/davet kanalları), `sim/zone.mjs` (harita başına simülasyon), `sim/enemy.mjs` (yaratık yapay zekâsı ve elit/normal
  yetenekleri; istemcidekinin görüntüsüz kopyası).
- **Kimlik:** istemci Supabase oturum belirtecini gönderir. Sunucu bunu Supabase'in `/auth/v1/user` ucundan doğrular;
  gizli anahtar gerekmez.
- **Güven:** oyuncunun verdiği hasarı istemci hesaplar, sunucu yalnız sınırlar. Arkadaş grubu için yeterlidir, hileye
  karşı korumalı değildir.
- **Trafik:** sunucu 20 Hz simüle eder. Her oyuncuya görüş alanındaki **değişen** yaratıkları 10 Hz'de gönderir.
  Oyuncu konumu en sık 8 Hz gider. Parti ve davet mesajları da bu sunucudan geçer; Supabase Realtime kotası harcanmaz.
- **Testler:** `tests/unit/server.test.js` (simülasyon ve merkez), `tests/e2e/run-e2e-world.mjs` (gerçek sunucu süreci
  ve iki tarayıcı).
