# Dağıtım

## itch.io (HTML5)

```bash
cp .env.example .env      # çevrimiçi için Supabase değerlerini doldur; boş bırakılırsa oyun Sandbox ile açılır
npm run package:itch      # = npm run build + release/varneth-itch.zip
```

* `vite.config.js` → `base: './'`: tüm varlık yolları göreli. Paketleme scripti `index.html`'in ZIP kökünde
  olduğunu ve mutlak yol içermediğini doğrular.
* itch.io'da "This file will be played in the browser" seç; önerilen gömme boyutu 1280×720, tam ekran düğmesi açık.
* Doğrulama: ZIP içeriği alt klasörden (`/games/varneth/index.html`) servis edilip headless Chromium ile açıldı;
  başarısız istek yok, sandbox hesabı oluşturuldu.

## Supabase (çevrimiçi mod)

Bkz. [DATABASE_SETUP.md](DATABASE_SETUP.md#3-supabase-kurulumu). Özet:

```bash
supabase link --project-ref <ref>
supabase db push
npm run build:edge && supabase functions deploy game
```

İstemci yalnızca **publishable (anon) key** kullanır. `SUPABASE_DB_URL`/service-role anahtarı yalnızca
Edge Function ortamındadır. CORS için `supabase secrets set ALLOWED_ORIGIN=https://html-classic.itch.zone` gibi
oyunun servis edildiği köken verilebilir.

## Yerel çok oyunculu test sunucusu

```bash
DATABASE_URL=postgres://... LOCAL_SERVER_SECRET=<uzun-rastgele> npm run server
VITE_LOCAL_SERVER_URL=http://localhost:8787 npm run dev
```

Bu sunucu geliştirme/LAN testi içindir (scrypt şifre karması + HMAC token). İnternete açık üretim kullanımı için
Supabase Auth + Edge Function önerilir.

## Bilinen dağıtım sınırları

* Gerçek bir Supabase projesine dağıtım **bu çalışma ortamında yapılmadı** (kimlik bilgisi yok). Edge Function,
  Deno 2.1 altında yerel PostgreSQL'e karşı ve Supabase Auth `/user` uç noktasının küçük bir taklidiyle çalıştırılıp
  9/9 kontrolden geçti (`node tools/test-edge-local.mjs <deno>`), ancak gerçek Supabase çalışma zamanında test edilmedi.
* E-posta doğrulaması açık Supabase projelerinde kayıt sonrası doğrulama gerekir; oyun bunu kullanıcıya bildirir.
