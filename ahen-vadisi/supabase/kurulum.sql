-- Ahen Vadisi — çevrimiçi test katmanı (Supabase ücretsiz katman) kurulumu.
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run. Tekrar çalıştırmak güvenlidir.
-- Satır güvenliği (RLS): her oyuncu yalnız kendi kaydını okur/yazar; liderlik tablosunu herkes okur;
-- hata bildirimleri yalnız eklenebilir (okumak için Table Editor → feedback).

-- Takma adlar
create table if not exists public.players (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 3 and 16),
  created_at timestamptz not null default now()
);

-- Bulut kaydı: oyunun yedek kodunun aynısı (sıkıştırılmış + checksum'lı) ve küçük bir özet
create table if not exists public.cloud_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null check (char_length(code) < 4000000),
  summary jsonb not null default '[]'::jsonb,
  game_version text,
  schema_version int,
  updated_at timestamptz not null default now()
);

-- Liderlik tablosu: karakter başına bir satır
create table if not exists public.leaderboard (
  user_id uuid not null references auth.users(id) on delete cascade,
  char_id text not null check (char_length(char_id) < 64),
  nickname text not null check (char_length(nickname) <= 16),
  char_name text not null check (char_length(char_name) <= 16),
  cls text not null check (cls in ('warrior', 'mage', 'archer', 'necromancer')),
  level int not null check (level between 1 and 50),
  exp bigint not null default 0,
  kills int not null default 0,
  boss_kills int not null default 0,
  quests int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, char_id)
);
create index if not exists leaderboard_rank on public.leaderboard (level desc, exp desc);

-- Hata / öneri bildirimleri (giriş yapmadan da gönderilebilir)
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  message text not null check (char_length(message) between 3 and 2000),
  context jsonb,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.cloud_saves enable row level security;
alter table public.leaderboard enable row level security;
alter table public.feedback enable row level security;

grant select on public.players, public.leaderboard to anon, authenticated;
grant insert, update on public.players, public.leaderboard to authenticated;
grant delete on public.leaderboard to authenticated;
grant select, insert, update, delete on public.cloud_saves to authenticated;
grant insert on public.feedback to anon, authenticated;

drop policy if exists players_read on public.players;
drop policy if exists players_write on public.players;
drop policy if exists players_update on public.players;
create policy players_read on public.players for select to anon, authenticated using (true);
create policy players_write on public.players for insert to authenticated with check ((select auth.uid()) = user_id);
create policy players_update on public.players for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists saves_own on public.cloud_saves;
create policy saves_own on public.cloud_saves for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists board_read on public.leaderboard;
drop policy if exists board_insert on public.leaderboard;
drop policy if exists board_update on public.leaderboard;
drop policy if exists board_delete on public.leaderboard;
create policy board_read on public.leaderboard for select to anon, authenticated using (true);
create policy board_insert on public.leaderboard for insert to authenticated with check ((select auth.uid()) = user_id);
create policy board_update on public.leaderboard for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy board_delete on public.leaderboard for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback for insert to anon, authenticated
  with check (user_id is null or (select auth.uid()) = user_id);

-- 4.2.0: çevrimiçi oyuncular. Oyundaki (giriş yapmış) oyuncu 45 sn'de bir "buradayım" der; son 90 sn içinde
-- görülenler çevrimiçi sayılır. Zaman damgası sunucuda atılır (cihaz saati yanlış olsa da doğru çalışır).
create table if not exists public.presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) <= 16),
  char_name text check (char_length(char_name) <= 16),
  cls text check (cls in ('warrior', 'mage', 'archer', 'necromancer')),
  level int check (level between 1 and 50),
  map text check (char_length(map) <= 40),
  last_seen timestamptz not null default now()
);

create or replace function public.presence_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.last_seen := now();
  return new;
end $$;
drop trigger if exists presence_touch on public.presence;
create trigger presence_touch before insert or update on public.presence
  for each row execute function public.presence_touch();

-- user_id (4.3.0): parti daveti kime gidecek (sona eklenir; "create or replace view" yalnız sona sütun eklemeye izin verir)
create or replace view public.online_players with (security_invoker = true) as
  select nickname, char_name, cls, level, map, last_seen, user_id
  from public.presence
  where last_seen > now() - interval '90 seconds';

alter table public.presence enable row level security;
grant select on public.presence, public.online_players to anon, authenticated;
grant insert, update, delete on public.presence to authenticated;

drop policy if exists presence_read on public.presence;
drop policy if exists presence_insert on public.presence;
drop policy if exists presence_update on public.presence;
drop policy if exists presence_delete on public.presence;
create policy presence_read on public.presence for select to anon, authenticated using (true);
create policy presence_insert on public.presence for insert to authenticated with check ((select auth.uid()) = user_id);
create policy presence_update on public.presence for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy presence_delete on public.presence for delete to authenticated using ((select auth.uid()) = user_id);

-- Veri API'sinin şema önbelleğini yenile (yeni tablolar hemen görünsün; "Could not find the table" hatasını önler)
notify pgrst, 'reload schema';
