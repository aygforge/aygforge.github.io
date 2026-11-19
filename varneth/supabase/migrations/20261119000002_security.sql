-- VARNETH — Row Level Security & privileges.
-- Browser (anon/authenticated, publishable key) may only READ its own rows, plus
-- active market listings. No client INSERT/UPDATE/DELETE on any game table:
-- currency and items are created/moved exclusively by the trusted command layer.

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','account_wallets','characters','character_progress','character_loadouts',
    'item_instances','material_balances','active_farm_sessions','farm_settlements','reward_grants',
    'offline_claims','character_quests','account_weekly','account_achievements','discoveries',
    'crafting_transactions','market_listings','market_transactions','currency_ledger',
    'inventory_ledger','command_log','notifications']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- SELECT grants (RLS still filters rows)
grant select on public.profiles, public.account_wallets, public.characters, public.character_progress,
  public.character_loadouts, public.item_instances, public.material_balances, public.farm_settlements,
  public.offline_claims, public.character_quests, public.account_weekly, public.account_achievements,
  public.discoveries, public.market_listings, public.market_transactions, public.currency_ledger,
  public.notifications to authenticated;
-- the seed / loot stream of active sessions is never readable from the client tables
-- (the command layer returns only what the client needs)

create policy own_profile on public.profiles for select to authenticated using (user_id = auth.uid());
create policy own_wallet on public.account_wallets for select to authenticated using (user_id = auth.uid());
create policy own_characters on public.characters for select to authenticated using (user_id = auth.uid());
create policy own_progress on public.character_progress for select to authenticated
  using (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));
create policy own_loadouts on public.character_loadouts for select to authenticated
  using (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));
create policy own_items on public.item_instances for select to authenticated using (owner_user = auth.uid());
create policy own_materials on public.material_balances for select to authenticated using (user_id = auth.uid());
create policy own_settlements on public.farm_settlements for select to authenticated using (user_id = auth.uid());
create policy own_offline on public.offline_claims for select to authenticated using (user_id = auth.uid());
create policy own_quests on public.character_quests for select to authenticated
  using (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));
create policy own_weekly on public.account_weekly for select to authenticated using (user_id = auth.uid());
create policy own_achievements on public.account_achievements for select to authenticated using (user_id = auth.uid());
create policy own_discoveries on public.discoveries for select to authenticated using (user_id = auth.uid());
create policy market_public on public.market_listings for select to authenticated
  using (status = 'active' or seller_user = auth.uid() or buyer_user = auth.uid());
create policy own_market_tx on public.market_transactions for select to authenticated
  using (buyer_user = auth.uid() or seller_user = auth.uid());
create policy own_ledger on public.currency_ledger for select to authenticated using (user_id = auth.uid());
create policy own_notifications on public.notifications for select to authenticated using (user_id = auth.uid());
-- active_farm_sessions, reward_grants, crafting_transactions, inventory_ledger, command_log:
-- no client policy at all (RLS enabled + forced => invisible to anon/authenticated).
