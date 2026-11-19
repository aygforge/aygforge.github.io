-- VARNETH: The Endless Hunt — core schema (Alpha 0.1)
-- All gold / item / progression mutations go through the trusted command layer
-- (supabase/functions/game -> shared/server/commands.js) using a privileged DB
-- connection inside explicit transactions. Browser clients only get SELECT access
-- through RLS (see 20261119000002_security.sql).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- accounts
create table if not exists public.profiles (
  user_id            uuid primary key,
  display_name       text not null,
  created_at         timestamptz not null default now(),
  last_character_id  uuid,
  offline_since      timestamptz,
  offline_character_id uuid,
  offline_zone       text,
  offline_rate       jsonb not null default '{}'::jsonb,
  daily_hunts        int not null default 1 check (daily_hunts between 0 and 7),
  daily_hunt_day     date not null default current_date,
  settings           jsonb not null default '{}'::jsonb,
  stats              jsonb not null default '{}'::jsonb,
  constraint display_name_len check (char_length(display_name) between 3 and 20)
);
create unique index if not exists profiles_display_name_ci on public.profiles (lower(display_name));

create table if not exists public.account_wallets (
  user_id    uuid primary key references public.profiles(user_id) on delete cascade,
  gold       bigint not null default 0 check (gold >= 0),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- characters
create table if not exists public.characters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  slot         smallint not null check (slot between 1 and 3),
  name         text not null check (char_length(name) between 3 and 16),
  class        text not null check (class in ('warrior','ranger','mage')),
  appearance   jsonb not null default '{}'::jsonb,
  level        int not null default 1 check (level between 1 and 100),
  xp           bigint not null default 0 check (xp >= 0),
  active_build smallint not null default 0 check (active_build between 0 and 2),
  death_rule   text not null default 'retreat' check (death_rule in ('continue','retreat','stop')),
  loot_filter  jsonb not null default '{"sellBelow":-1,"salvageBelow":-1}'::jsonb,
  buffs        jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create unique index if not exists characters_user_slot on public.characters (user_id, slot) where deleted_at is null;
create index if not exists characters_user on public.characters (user_id);

create table if not exists public.character_progress (
  character_id     uuid primary key references public.characters(id) on delete cascade,
  unlocked_regions text[] not null default array['broken_meadows'],
  boss_kills       jsonb not null default '{}'::jsonb,
  seals            text[] not null default '{}',
  stats            jsonb not null default '{}'::jsonb,
  current_zone     text not null default 'abandoned_road',
  contract_offers  jsonb not null default '[]'::jsonb,
  offers_refresh_at timestamptz not null default now()
);

-- 3 saved builds per character: tree points, equipped actives/passives, automation rules
create table if not exists public.character_loadouts (
  character_id uuid not null references public.characters(id) on delete cascade,
  idx          smallint not null check (idx between 0 and 2),
  name         text not null default 'Build',
  tree         jsonb not null default '{}'::jsonb,
  actives      text[] not null default '{}',
  passives     text[] not null default '{}',
  rules        jsonb not null default '{}'::jsonb,
  primary key (character_id, idx)
);

-- ---------------------------------------------------------------- items
-- One row per unique item. `location` + `character_id` + `equip_slot` describe where it is,
-- and the constraints make bag/equipped/stash/market/overflow states mutually exclusive.
create table if not exists public.item_instances (
  id              uuid primary key default gen_random_uuid(),
  owner_user      uuid not null references public.profiles(user_id),
  base_id         text not null,
  rarity          smallint not null check (rarity between 0 and 6),
  item_level      int not null check (item_level between 1 and 120),
  upgrade         smallint not null default 0 check (upgrade between 0 and 10),
  affixes         jsonb not null default '[]'::jsonb,
  reforge_count   int not null default 0,
  polish_count    int not null default 0,
  pending_polish  jsonb,
  locked          boolean not null default false,
  tradeable       boolean not null default true,
  bound_character uuid,
  location        text not null check (location in ('bag','equipped','stash','market','overflow','destroyed')),
  character_id    uuid references public.characters(id),
  equip_slot      text check (equip_slot in ('mainhand','offhand','head','chest','gloves','legs','boots','belt','amulet','ring1','ring2')),
  origin          text not null,
  origin_ref      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint item_loc_char check (
    (location in ('bag','equipped') and character_id is not null) or
    (location not in ('bag','equipped') and character_id is null)),
  constraint item_loc_slot check ((location = 'equipped') = (equip_slot is not null)),
  constraint item_bound_not_tradeable check (bound_character is null or tradeable = false)
);
create unique index if not exists item_equipped_unique on public.item_instances (character_id, equip_slot) where location = 'equipped';
create index if not exists item_owner_loc on public.item_instances (owner_user, location);
create index if not exists item_char_loc on public.item_instances (character_id, location);

-- Stackable materials. scope = '00000000-0000-0000-0000-000000000000' for the account vault,
-- or a character id for character-bound (offline) materials that cannot enter the trade economy.
create table if not exists public.material_balances (
  user_id     uuid not null references public.profiles(user_id) on delete cascade,
  scope       uuid not null default '00000000-0000-0000-0000-000000000000',
  material_id text not null,
  qty         int not null default 0 check (qty >= 0),
  primary key (user_id, scope, material_id)
);

-- ---------------------------------------------------------------- farming
-- PK on user_id => at most ONE active farm per account (any tab / device).
create table if not exists public.active_farm_sessions (
  user_id           uuid primary key references public.profiles(user_id) on delete cascade,
  id                uuid not null unique default gen_random_uuid(),
  character_id      uuid not null references public.characters(id),
  kind              text not null check (kind in ('farm','boss','dungeon')),
  target            text not null,
  difficulty        text,
  seed              bigint not null,
  started_at        timestamptz not null,
  last_heartbeat_at timestamptz not null,
  settled_tick      int not null default 0,
  sim_state         jsonb not null
);

create table if not exists public.farm_settlements (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null,
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  character_id uuid not null,
  from_tick    int not null,
  to_tick      int not null,
  kills        int not null default 0,
  xp           bigint not null default 0,
  gold         bigint not null default 0,
  items        int not null default 0,
  materials    jsonb not null default '{}'::jsonb,
  outcome      text,
  created_at   timestamptz not null default now(),
  unique (session_id, from_tick)
);
create index if not exists farm_settlements_user on public.farm_settlements (user_id, created_at desc);

create table if not exists public.reward_grants (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  character_id uuid,
  grant_key    text not null,
  kind         text not null,
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  unique (user_id, grant_key)
);

create table if not exists public.offline_claims (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  character_id uuid not null,
  from_at      timestamptz not null,
  to_at        timestamptz not null,
  seconds      int not null check (seconds between 0 and 28800),
  xp           bigint not null default 0,
  materials    jsonb not null default '{}'::jsonb,
  levels       int not null default 0,
  created_at   timestamptz not null default now(),
  unique (user_id, from_at)
);

-- ---------------------------------------------------------------- quests & collection
create table if not exists public.character_quests (
  character_id uuid not null references public.characters(id) on delete cascade,
  quest_id     text not null,
  kind         text not null check (kind in ('main','contract')),
  progress     int not null default 0,
  target       int not null,
  state        text not null default 'active' check (state in ('active','complete','claimed')),
  data         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  primary key (character_id, quest_id)
);

create table if not exists public.account_weekly (
  user_id   uuid not null references public.profiles(user_id) on delete cascade,
  period    text not null,
  hunt_id   text not null,
  progress  int not null default 0,
  claimed   boolean not null default false,
  primary key (user_id, period, hunt_id)
);

create table if not exists public.account_achievements (
  user_id        uuid not null references public.profiles(user_id) on delete cascade,
  achievement_id text not null,
  completed_at   timestamptz not null default now(),
  claimed_at     timestamptz,
  primary key (user_id, achievement_id)
);

create table if not exists public.discoveries (
  user_id  uuid not null references public.profiles(user_id) on delete cascade,
  kind     text not null check (kind in ('enemy','item','unique','set','boss')),
  ref_id   text not null,
  count    int not null default 1,
  first_at timestamptz not null default now(),
  primary key (user_id, kind, ref_id)
);

create table if not exists public.crafting_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  character_id uuid,
  kind         text not null,
  item_id      uuid,
  cost         jsonb not null default '{}'::jsonb,
  result       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- market
create table if not exists public.market_listings (
  id            uuid primary key default gen_random_uuid(),
  seller_user   uuid not null references public.profiles(user_id),
  seller_name   text not null,
  item_id       uuid not null references public.item_instances(id),
  price         bigint not null check (price between 10 and 2000000000),
  listing_fee   bigint not null check (listing_fee >= 0),
  status        text not null default 'active' check (status in ('active','sold','cancelled','expired')),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  closed_at     timestamptz,
  buyer_user    uuid references public.profiles(user_id),
  item_snapshot jsonb not null,
  base_id       text not null,
  slot          text not null,
  class_req     text,
  rarity        smallint not null,
  item_level    int not null,
  upgrade       smallint not null default 0,
  affix_ids     text[] not null default '{}'
);
-- an item can only be in ONE active listing
create unique index if not exists market_one_active_per_item on public.market_listings (item_id) where status = 'active';
create index if not exists market_active_search on public.market_listings (status, rarity, item_level, price) where status = 'active';
create index if not exists market_seller on public.market_listings (seller_user, status);

create table if not exists public.market_transactions (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null unique references public.market_listings(id),
  item_id     uuid not null,
  buyer_user  uuid not null references public.profiles(user_id),
  seller_user uuid not null references public.profiles(user_id),
  price       bigint not null,
  commission  bigint not null,
  created_at  timestamptz not null default now(),
  constraint no_self_trade check (buyer_user <> seller_user)
);

-- ---------------------------------------------------------------- ledgers & idempotency
create table if not exists public.currency_ledger (
  id            bigserial primary key,
  user_id       uuid not null references public.profiles(user_id) on delete cascade,
  delta         bigint not null,
  balance_after bigint not null check (balance_after >= 0),
  reason        text not null,
  ref           text,
  created_at    timestamptz not null default now()
);
create index if not exists currency_ledger_user on public.currency_ledger (user_id, id desc);

create table if not exists public.inventory_ledger (
  id         bigserial primary key,
  user_id    uuid not null,
  item_id    uuid not null,
  action     text not null,
  from_loc   text,
  to_loc     text,
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists inventory_ledger_item on public.inventory_ledger (item_id, id);

create table if not exists public.command_log (
  user_id    uuid not null,
  idem_key   text not null,
  command    text not null,
  response   jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, idem_key)
);

create table if not exists public.notifications (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  kind       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user on public.notifications (user_id, read, id desc);
