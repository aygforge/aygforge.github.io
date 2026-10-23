# Ortak dünya oyun sunucusu (4.4.0)

Bu sunucuya bağlanan herkes **aynı dünyayı** görür: açık haritalardaki yaratıklar sunucuda yaşar. Bir yaratığa vurduğunda
arkadaşın da canının düştüğünü görür, öldürünce ikiniz de ölümü görürsünüz. Partideyseniz EXP ve altını paylaşırsınız.

Supabase giriş/kayıt, bulut kaydı ve liderlik için kullanılmaya devam eder. Oyun sunucusu ayrı ve küçük bir Node.js
programıdır (`server/`). Ücretsiz olarak Render'da çalışır.

## Neler ortak, neler değil (bu sürüm)

| Ortak (herkes aynısını görür) | Henüz kişisel (yalnız sen görürsün) |
|---|---|
| Açık haritalardaki kamp yaratıkları ve elitler (yetenekleri, telegrafları, ateş/buz izleri dahil) | Açık dünya boss'ları (Alfa Kurt, Kül Devi, Mezar Komutanı, Fırtına Tiranı) |
| Yaratığın kime saldırdığı, canı, ölümü, yeniden doğması | Dungeon'lar (her oyuncunun kendi koşusu) |
| Elitin doğması (kampında yeterli yaratık ölünce, herkese duyurulur) | Görev olayları (kervan, kamp savunması), görev avları, sunak dalgaları |
| Bölgedeki tüm oyuncular haritada görünür (parti üyeleri yeşil, diğerleri mavi) | Eşya ticareti (sonraki aşama) |

**Ödül kuralı:**
- Yaratığa hasar veren her grup ödül alır. Grup, bir parti ya da partisiz tek bir oyuncudur.
- Partide, yaratığın 30 kare yakınındaki üyeler EXP'yi ve altını **bonuslu** paylaşır. Paylaşan üye vurmamış da olabilir.
  - Kişi başı pay: 2 kişide ×0,6, 3 kişide ×0,47, 4 kişide ×0,4. Toplamda tek başına avlanmaktan %20–60 fazla EXP eder.
- Ganimet (eşya, malzeme) herkese **ayrı** düşer; kimse kimsenin ganimetini kapmaz.
- Görev öldürme sayacı, paylaşan herkese işler.
- Partisiz ve hiç vurmayan bir oyuncu, başkasının öldürdüğü yaratıktan ödül almaz.

Karakterler hâlâ oyuncunun cihazında (ve bulut kaydında) durur. Sunucu yalnız dünyayı yönetir. Sunucu kapanırsa ya da
uyursa oyun **durmaz**: tek oyunculu devam eder, sunucu dönünce kendiliğinden ortak dünyaya geçer.

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
