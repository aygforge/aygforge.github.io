# Veritabanı ve Sunucu Kurulumu

VARNETH'in tüm ekonomik işlemleri (altın, eşya, malzeme, XP, görev, pazar) **sunucu tarafındaki komut
katmanında** (`shared/server/commands.js`) tek bir PostgreSQL transaction'ı içinde çalışır. Tarayıcı
yalnızca komut gönderir; sonuçları sunucu hesaplar.

Komut katmanı üç ortamda **aynı kodla** çalışır:

| Ortam | Nerede | Kimlik doğrulama | Pazar |
|---|---|---|---|
| Çevrimiçi | Supabase Edge Function `game` + Supabase Postgres | Supabase Auth (JWT) | Gerçek oyuncu pazarı |
| Yerel sunucu | `node server/dev-server.js` + kendi PostgreSQL'in | Kullanıcı adı/şifre (scrypt + HMAC token) | Gerçek (iki tarayıcı/iki hesap) |
| Sandbox | Tarayıcı içinde PGlite (WASM PostgreSQL) | Yerel hesap | **Kapalı** (sahte ilan yok) |

## 1. Migration dosyaları

```
supabase/migrations/20261119000001_schema.sql    # tablolar, kısıtlar, indeksler
supabase/migrations/20261119000002_security.sql  # RLS + yetkiler
supabase/local/00_supabase_compat.sql            # SADECE yerel: anon/authenticated rolleri, auth.uid()
supabase/local/10_local_auth.sql                 # SADECE yerel/sandbox: local_auth_users
```

Supabase'e yalnızca `supabase/migrations/*` uygulanır (Supabase zaten `auth` şemasını ve rolleri sağlar).

### Önemli tablolar

| Tablo | Amaç |
|---|---|
| `profiles`, `account_wallets` | Hesap, ortak altın cüzdanı (`gold >= 0` kısıtı) |
| `characters`, `character_progress`, `character_loadouts` | 3 yuva, ilerleme, 3 build (ağaç + aktif/pasif + otomasyon kuralları) |
| `item_instances` | Her eşya tek satır, benzersiz UUID. `location` ∈ bag/equipped/stash/market/overflow/destroyed; kısıtlar durumları birbirinden ayırır. Kuşanılan yuva için benzersiz indeks. |
| `material_balances` | İstiflenebilir malzemeler. `scope` = hesap (`000…0`) veya karakter id (offline, karaktere bağlı) |
| `active_farm_sessions` | **PK = user_id** → hesap başına tek aktif av. Sim durumu + seed burada; istemciden okunamaz. |
| `farm_settlements`, `offline_claims`, `reward_grants` | Doğrulanmış ödül kayıtları (unique kısıtlarla tekrar engellenir) |
| `market_listings`, `market_transactions` | Aktif ilan başına bir eşya (kısmi unique indeks), satış başına tek işlem (`listing_id unique`) |
| `currency_ledger`, `inventory_ledger` | Her altın/eşya hareketinin denetim kaydı |
| `command_log` | Idempotency: `(user_id, idem_key)` PK; tekrar eden istek aynı yanıtı döner |

> Spesifikasyondaki `item_locations` ayrı tablo yerine `item_instances` içindeki `location/character_id/equip_slot`
> sütunları + CHECK kısıtları olarak modellendi (tek satır kilidiyle atomik taşıma için). `character_skills`
> verisi `character_loadouts` içinde (build başına ağaç puanları) tutulur.

### Güvenlik kuralları (20261119000002_security.sql)

* Tüm tablolarda RLS açık; `anon` ve `authenticated` rollerinden **tüm yetkiler geri alınır**.
* `authenticated` yalnızca SELECT alır; RLS kendi satırlarını görmesini sağlar. Aktif pazar ilanları herkese açık.
* `active_farm_sessions` (seed/sim), `command_log`, `inventory_ledger`, `reward_grants`, `crafting_transactions`:
  istemciye hiç açık değil.
* Hiçbir tabloda istemci INSERT/UPDATE/DELETE yetkisi yok. Altın/eşya yalnızca komut katmanı tarafından,
  Edge Function'ın özel DB bağlantısıyla yazılır. `SUPABASE_DB_URL` ve secret anahtarlar tarayıcıya hiç gitmez.

## 2. Yerel PostgreSQL ile çalıştırma

```bash
# PostgreSQL 14+ çalışıyor olmalı
createdb varneth
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/varneth
node server/migrate.js                 # migration'ları uygular (compat + schema + RLS + local auth)
LOCAL_SERVER_SECRET=uzun-rastgele-bir-dizi npm run server   # http://localhost:8787
```

`.env` içinde `VITE_LOCAL_SERVER_URL=http://localhost:8787` tanımla, `npm run dev` ile oyunu aç,
giriş ekranında **Yerel Sunucu** modunu seç. İki farklı tarayıcı (veya gizli pencere) ile iki hesap aç:
biri eşyasını pazara koyar, diğeri satın alır.

## 3. Supabase kurulumu

1. Supabase projesi oluştur. **Authentication → Providers → Email** açık olsun.
2. Migration'ları uygula:
   ```bash
   supabase link --project-ref <ref>
   supabase db push           # supabase/migrations/* uygulanır
   ```
3. Edge Function'ı hazırla ve dağıt:
   ```bash
   npm run build:edge         # shared/ -> supabase/functions/game/_shared
   supabase functions deploy game
   ```
   Supabase, fonksiyona `SUPABASE_URL`, `SUPABASE_ANON_KEY` ve `SUPABASE_DB_URL` ortam değişkenlerini otomatik verir.
   İsteğe bağlı: `supabase secrets set ALLOWED_ORIGIN=https://senin-oyun-alanin`.
4. İstemci `.env`:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key>
   ```
   Service-role / secret anahtar **asla** `VITE_` değişkenine konmaz.

## 4. Doğrulama durumu

* Yerel PostgreSQL 16 üzerinde: migration'lar, RLS politikaları (gerçek `authenticated`/`anon` rolleriyle),
  pazar eşzamanlılığı ve idempotency **otomatik testlerle doğrulandı** (`npm run test`, bkz. TEST_REPORT.md).
* PGlite (tarayıcı/Node) üzerinde aynı migration'lar ve komut katmanı çalıştırıldı.
* **Gerçek bir Supabase projesine dağıtım bu ortamda yapılamadı** (proje kimlik bilgisi yok). Edge Function
  kodu yazıldı fakat Deno/Supabase çalışma zamanında test edilmedi.
