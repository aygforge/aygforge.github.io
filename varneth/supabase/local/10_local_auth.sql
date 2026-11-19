-- Local server mode / browser sandbox only: simple username+password accounts.
-- On Supabase, Supabase Auth (auth.users) is used instead and this file is NOT applied.
create table if not exists public.local_auth_users (
  user_id    uuid primary key default gen_random_uuid(),
  username   text not null unique,
  pass_hash  text not null,
  created_at timestamptz not null default now()
);
alter table public.local_auth_users enable row level security;
revoke all on public.local_auth_users from anon, authenticated;
