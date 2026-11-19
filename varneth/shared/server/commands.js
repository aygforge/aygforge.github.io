// VARNETH trusted command layer.
// Every mutation of gold, items, materials, XP and quests happens here, inside a single
// database transaction per command, with row locks and idempotency keys.
// Runs in: Supabase Edge Function (Deno), local Node server, and the in-browser sandbox (PGlite).
import { GameError, J, ACCOUNT_SCOPE, uuid, secureSeed, num, isoWeek, withTx } from './util.js';
import * as RNG from '../rng.js';
import { BALANCE, STARTING_GOLD } from '../data/balance.js';
import { CLASSES } from '../data/classes.js';
import { BASE_BY_ID, FAMILIES, RANDOM_BASES, baseAllowedForClass, equipSlotsFor, SLOTS } from '../data/items.js';
import { MATERIALS, SALVAGE_YIELD } from '../data/materials.js';
import { SKILLS, NODE_BY_ID, TREES, skillPointsForLevel, defaultLoadout, CLASS_SKILLS, RULES } from '../data/skills.js';
import { REGIONS, REGION_BY_ID, ZONE_BY_ID, DUNGEONS, BOSS_ENCOUNTERS } from '../data/regions.js';
import { MAIN_QUESTS, MAIN_QUEST_BY_ID, CONTRACT_TEMPLATES, CONTRACT_BY_ID, WEEKLY_HUNTS, ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from '../data/quests.js';
import { SMITH_BY_ID, ALCHEMY_BY_ID } from '../data/recipes.js';
import { ENEMIES } from '../data/enemies.js';
import { applyXp, xpToNext, npcSellValue, upgradeCost, reforgeCost, polishCost, skillResetCost, marketFees, killGold, killXp } from '../formulas.js';
import { generateItem, reforgeAffix, polishAffix } from '../loot.js';
import { deriveStats } from '../stats.js';
import { createSim, restore, snapshot, run, takeAcc, setPlayerStats } from '../combat/sim.js';

const TICK = BALANCE.TICK_MS;
const MUTATING = new Set([
  'create_profile', 'create_character', 'delete_character', 'select_character',
  'farm_start', 'farm_heartbeat', 'farm_stop',
  'equip', 'unequip', 'move_item', 'lock_item', 'sell_npc', 'salvage',
  'upgrade', 'reforge', 'polish', 'polish_choose', 'craft', 'brew', 'use_elixir',
  'skill_alloc', 'skill_reset', 'set_loadout', 'set_active_build', 'set_char_settings',
  'quest_claim', 'contract_accept', 'contract_abandon', 'contract_claim', 'weekly_claim', 'achievement_claim',
  'market_list', 'market_cancel', 'market_buy', 'notifications_read', 'wishlist_toggle',
]);
const READ = new Set(['bootstrap', 'character', 'market_search', 'market_history', 'collection']);

// =====================================================================================
export function createGameServer(db, opts = {}) {
  const clockOffsetMs = opts.clockOffsetMs || 0; // tests can shift server time
  async function exec(userId, name, args = {}, idemKey = null) {
    if (!userId) throw new GameError('UNAUTHENTICATED', 'Oturum gerekli.');
    const handler = HANDLERS[name];
    if (!handler || (!MUTATING.has(name) && !READ.has(name))) throw new GameError('UNKNOWN_COMMAND', name);
    if (MUTATING.has(name) && (typeof idemKey !== 'string' || idemKey.length < 8 || idemKey.length > 80)) {
      throw new GameError('IDEMPOTENCY_KEY_REQUIRED', 'Geçerli bir işlem kimliği gerekli.');
    }
    return withTx(db, async (q) => {
      const t = (await q("select (extract(epoch from clock_timestamp()) * 1000)::float8 as ms"))[0];
      const ctx = { q, uid: userId, now: num(t.ms) + (opts.clockOffset ? opts.clockOffset() : clockOffsetMs), name };
      if (MUTATING.has(name)) {
        const ins = await q('insert into command_log (user_id, idem_key, command) values ($1,$2,$3) on conflict do nothing returning 1 as ok', [userId, idemKey, name]);
        if (!ins.length) {
          const prev = await q('select response, command from command_log where user_id=$1 and idem_key=$2', [userId, idemKey]);
          if (prev[0]?.command !== name) throw new GameError('IDEMPOTENCY_CONFLICT', 'Bu işlem kimliği başka bir komutta kullanılmış.');
          return { ...(prev[0].response || {}), replayed: true };
        }
      }
      const res = await handler(ctx, args || {});
      if (MUTATING.has(name)) await q('update command_log set response=$3::jsonb where user_id=$1 and idem_key=$2', [userId, idemKey, J(res)]);
      return res;
    });
  }
  return { exec };
}

// =====================================================================================
// helpers
const tsArg = (ms) => new Date(ms).toISOString();

async function getProfile(ctx, lock = false) {
  const r = await ctx.q(`select *, (extract(epoch from offline_since)*1000)::float8 as offline_ms from profiles where user_id=$1 ${lock ? 'for update' : ''}`, [ctx.uid]);
  if (!r.length) throw new GameError('NO_PROFILE', 'Önce bir avcı profili oluştur.');
  return r[0];
}

async function getChar(ctx, id, lock = false) {
  if (typeof id !== 'string') throw new GameError('BAD_ARGS', 'Karakter gerekli.');
  const r = await ctx.q(`select * from characters where id=$1 and user_id=$2 and deleted_at is null ${lock ? 'for update' : ''}`, [id, ctx.uid]);
  if (!r.length) throw new GameError('NO_CHARACTER', 'Karakter bulunamadı.');
  return r[0];
}

async function getProgress(ctx, charId) {
  return (await ctx.q('select * from character_progress where character_id=$1', [charId]))[0];
}

async function gold(ctx) {
  const r = await ctx.q('select gold::float8 as gold from account_wallets where user_id=$1', [ctx.uid]);
  return r.length ? num(r[0].gold) : 0;
}

async function addGold(ctx, delta, reason, ref = null, userId = ctx.uid) {
  delta = Math.round(delta);
  if (!delta) return gold(ctx);
  const r = await ctx.q('update account_wallets set gold = gold + $1, updated_at = now() where user_id=$2 and gold + $1 >= 0 returning gold::float8 as gold', [delta, userId]);
  if (!r.length) throw new GameError('NOT_ENOUGH_GOLD', 'Yeterli altının yok.');
  await ctx.q('insert into currency_ledger (user_id, delta, balance_after, reason, ref) values ($1,$2,$3,$4,$5)', [userId, delta, num(r[0].gold), reason, ref]);
  return num(r[0].gold);
}

async function changeMats(ctx, scope, deltas, userId = ctx.uid) {
  for (const [id, d0] of Object.entries(deltas)) {
    const d = Math.round(d0);
    if (!d) continue;
    if (!MATERIALS[id]) throw new GameError('BAD_MATERIAL', id);
    if (d > 0) {
      await ctx.q('insert into material_balances (user_id, scope, material_id, qty) values ($1,$2,$3,$4) on conflict (user_id, scope, material_id) do update set qty = material_balances.qty + excluded.qty', [userId, scope, id, d]);
    } else {
      const r = await ctx.q('update material_balances set qty = qty + $4 where user_id=$1 and scope=$2 and material_id=$3 and qty + $4 >= 0 returning qty', [userId, scope, id, d]);
      if (!r.length) throw new GameError('NOT_ENOUGH_MATERIALS', `Yetersiz malzeme: ${MATERIALS[id].name}`);
    }
  }
}

async function mats(ctx, scope) {
  const r = await ctx.q('select material_id, qty from material_balances where user_id=$1 and scope=$2 and qty > 0', [ctx.uid, scope]);
  return Object.fromEntries(r.map((x) => [x.material_id, num(x.qty)]));
}

function itemRow(r) {
  if (!r) return null;
  return {
    id: r.id, base_id: r.base_id, rarity: num(r.rarity), item_level: num(r.item_level), upgrade: num(r.upgrade),
    affixes: typeof r.affixes === 'string' ? JSON.parse(r.affixes) : r.affixes, reforge_count: num(r.reforge_count), polish_count: num(r.polish_count),
    pending_polish: typeof r.pending_polish === 'string' ? JSON.parse(r.pending_polish) : r.pending_polish,
    locked: !!r.locked, tradeable: !!r.tradeable, bound_character: r.bound_character, location: r.location,
    character_id: r.character_id, equip_slot: r.equip_slot, origin: r.origin,
  };
}

async function getItem(ctx, id, lock = true) {
  if (typeof id !== 'string') throw new GameError('BAD_ARGS', 'Eşya gerekli.');
  const r = await ctx.q(`select * from item_instances where id=$1 and owner_user=$2 and location <> 'destroyed' ${lock ? 'for update' : ''}`, [id, ctx.uid]);
  if (!r.length) throw new GameError('NO_ITEM', 'Eşya bulunamadı.');
  return itemRow(r[0]);
}

async function countLoc(ctx, loc, charId = null) {
  const r = charId
    ? await ctx.q('select count(*)::int as n from item_instances where character_id=$1 and location=$2', [charId, loc])
    : await ctx.q('select count(*)::int as n from item_instances where owner_user=$1 and location=$2', [ctx.uid, loc]);
  return num(r[0].n);
}

async function invLog(ctx, itemId, action, from, to, ref = null, userId = ctx.uid) {
  await ctx.q('insert into inventory_ledger (user_id, item_id, action, from_loc, to_loc, ref) values ($1,$2,$3,$4,$5,$6)', [userId, itemId, action, from, to, ref]);
}

async function createItem(ctx, item, { location, characterId = null, origin, ref = null, bound = null }) {
  const id = uuid();
  await ctx.q(`insert into item_instances (id, owner_user, base_id, rarity, item_level, upgrade, affixes, location, character_id, origin, origin_ref, tradeable, bound_character)
    values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13)`,
  [id, ctx.uid, item.base_id, item.rarity, item.item_level, item.upgrade || 0, J(item.affixes || []), location, characterId, origin, ref, !bound, bound]);
  await invLog(ctx, id, 'create:' + origin, null, location, ref);
  return id;
}

// Place a freshly obtained item: bag (if char & space) -> stash? no: bag else overflow. Never silently deleted.
async function placeForCharacter(ctx, item, charId, origin, ref) {
  const bag = await countLoc(ctx, 'bag', charId);
  const location = bag < BALANCE.BAG_SLOTS ? 'bag' : 'overflow';
  const id = await createItem(ctx, item, { location, characterId: location === 'bag' ? charId : null, origin, ref });
  return { id, location };
}

async function placeInStash(ctx, itemId, fromLoc, ref, userId = ctx.uid) {
  const r = await ctx.q("select count(*)::int as n from item_instances where owner_user=$1 and location='stash'", [userId]);
  const to = num(r[0].n) < BALANCE.STASH_SLOTS ? 'stash' : 'overflow';
  await ctx.q('update item_instances set location=$2, character_id=null, equip_slot=null, owner_user=$3, updated_at=now() where id=$1', [itemId, to, userId]);
  await invLog(ctx, itemId, 'move', fromLoc, to, ref, userId);
  return to;
}

async function equippedMap(ctx, charId) {
  const r = await ctx.q("select * from item_instances where character_id=$1 and location='equipped'", [charId]);
  const m = {};
  for (const x of r) m[x.equip_slot] = itemRow(x);
  return m;
}

function parseJson(v, d) {
  if (v == null) return d;
  return typeof v === 'string' ? JSON.parse(v) : v;
}

async function getLoadout(ctx, charId, idx) {
  const r = await ctx.q('select * from character_loadouts where character_id=$1 and idx=$2', [charId, idx]);
  const l = r[0];
  return { idx, name: l.name, tree: parseJson(l.tree, {}), actives: l.actives || [], passives: l.passives || [], rules: parseJson(l.rules, {}) };
}

async function computeStats(ctx, char) {
  const eq = await equippedMap(ctx, char.id);
  const lo = await getLoadout(ctx, char.id, num(char.active_build));
  const buffs = parseJson(char.buffs, []).filter((b) => b.remaining > 0).map((b) => ({ stat: MATERIALS[b.id].buff.stat, value: MATERIALS[b.id].buff.value }));
  return deriveStats({ cls: char.class, level: num(char.level), equipped: eq, loadout: lo, buffs });
}

function reqLevelOf(item) {
  const b = BASE_BY_ID[item.base_id];
  return Math.max(1, b.reqLevel, item.item_level - 3);
}

// ---- account statistics (achievements)
async function bumpStats(ctx, deltas, maxes = {}) {
  const p = await ctx.q('select stats from profiles where user_id=$1 for update', [ctx.uid]);
  const s = parseJson(p[0].stats, {});
  for (const [k, v] of Object.entries(deltas)) if (v) s[k] = (s[k] || 0) + v;
  for (const [k, v] of Object.entries(maxes)) s[k] = Math.max(s[k] || 0, v);
  await ctx.q('update profiles set stats=$2::jsonb where user_id=$1', [ctx.uid, J(s)]);
  return s;
}

async function checkAchievements(ctx) {
  const p = await ctx.q('select stats from profiles where user_id=$1', [ctx.uid]);
  const s = parseJson(p[0].stats, {});
  const lv = await ctx.q('select coalesce(max(level),0)::int as m from characters where user_id=$1', [ctx.uid]);
  s.maxLevel = num(lv[0].m);
  const u = await ctx.q("select count(*)::int as n from discoveries where user_id=$1 and kind='unique'", [ctx.uid]);
  s.uniques = num(u[0].n);
  const have = new Set((await ctx.q('select achievement_id from account_achievements where user_id=$1', [ctx.uid])).map((r) => r.achievement_id));
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (have.has(a.id)) continue;
    if ((s[a.stat] || 0) >= a.target) {
      await ctx.q('insert into account_achievements (user_id, achievement_id) values ($1,$2) on conflict do nothing', [ctx.uid, a.id]);
      unlocked.push(a.id);
    }
  }
  return unlocked;
}

async function discover(ctx, kind, refId, n = 1) {
  await ctx.q('insert into discoveries (user_id, kind, ref_id, count) values ($1,$2,$3,$4) on conflict (user_id, kind, ref_id) do update set count = discoveries.count + excluded.count', [ctx.uid, kind, refId, n]);
}

// ---- quests
async function ensureMainQuest(ctx, charId, questId, level) {
  const q = MAIN_QUEST_BY_ID[questId];
  if (!q) return;
  const progress = q.obj.type === 'reach_level' ? Math.min(level, q.obj.level) : 0;
  const target = q.obj.count || q.obj.level;
  await ctx.q("insert into character_quests (character_id, quest_id, kind, progress, target, state) values ($1,$2,'main',$3,$4,$5) on conflict do nothing",
    [charId, questId, progress, target, progress >= target ? 'complete' : 'active']);
}

function objectiveGain(obj, ev) {
  switch (obj.type) {
    case 'kill_zone': return ev.zoneKills[obj.zone] || 0;
    case 'kill_enemy': return obj.enemy ? ev.killsBy[obj.enemy] || 0 : 0;
    case 'kill_any': return ev.kills || 0;
    case 'kill_tier': return obj.region ? (ev.eliteRegions[obj.region] || 0) : (ev.tiers[obj.tier] || 0) + (obj.tier === 'elite' ? ev.tiers.champion || 0 : 0);
    case 'defeat_boss': return obj.boss ? ev.bossKills[obj.boss] || 0 : Object.values(ev.bossKills).reduce((a, b) => a + b, 0);
    case 'complete_dungeon': return ev.dungeons || 0;
    case 'collect_material': return ev.matsCollected || 0;
    default: return 0;
  }
}

async function progressQuests(ctx, char, ev) {
  const rows = await ctx.q("select * from character_quests where character_id=$1 and state='active' for update", [char.id]);
  const updates = [];
  for (const r of rows) {
    const data = parseJson(r.data, {});
    const obj = r.kind === 'main' ? MAIN_QUEST_BY_ID[r.quest_id]?.obj : CONTRACT_BY_ID[data.template]?.obj;
    if (!obj) continue;
    let p = num(r.progress);
    if (obj.type === 'reach_level') p = Math.min(num(r.target), ev.level);
    else p = Math.min(num(r.target), p + objectiveGain(obj, ev));
    if (p !== num(r.progress)) {
      const state = p >= num(r.target) ? 'complete' : 'active';
      await ctx.q('update character_quests set progress=$3, state=$4 where character_id=$1 and quest_id=$2', [char.id, r.quest_id, p, state]);
      updates.push({ quest: r.quest_id, progress: p, target: num(r.target), state });
    }
  }
  // weekly (account-wide)
  const period = isoWeek(ctx.now);
  for (const h of WEEKLY_HUNTS) {
    const g = objectiveGain(h.obj, ev);
    if (!g) continue;
    await ctx.q('insert into account_weekly (user_id, period, hunt_id, progress) values ($1,$2,$3,least($4::int,$5::int)) on conflict (user_id, period, hunt_id) do update set progress = least($5::int, account_weekly.progress + excluded.progress)', [ctx.uid, period, h.id, g, h.count]);
  }
  return updates;
}

// =====================================================================================
// farm sessions
async function sessionRow(ctx, lock = true) {
  const r = await ctx.q(`select *, (extract(epoch from started_at)*1000)::float8 as started_ms, (extract(epoch from last_heartbeat_at)*1000)::float8 as hb_ms
    from active_farm_sessions where user_id=$1 ${lock ? 'for update' : ''}`, [ctx.uid]);
  return r[0] || null;
}

function sessionPayload(sess, sim, ctx) {
  return {
    id: sess.id, kind: sess.kind, target: sess.target, difficulty: sess.difficulty, characterId: sess.character_id,
    startedAtMs: num(sess.started_ms), serverNowMs: ctx.now, tickMs: TICK, tick: sim.t, snapshot: snapshot(sim),
  };
}

// Simulate the session up to `untilMs` (server clock), apply verified rewards.
async function settle(ctx, sess, untilMs, { end = false } = {}) {
  const char = await getChar(ctx, sess.character_id, true);
  const sim = restore(parseJson(sess.sim_state, {}));
  const stats = await computeStats(ctx, char);
  setPlayerStats(sim, stats);
  const targetTick = Math.floor((untilMs - num(sess.started_ms)) / TICK);
  const ticks = Math.max(0, Math.min(targetTick - sim.t, BALANCE.MAX_SETTLE_S * (1000 / TICK)));
  const fromTick = sim.t;
  run(sim, ticks);
  const acc = takeAcc(sim);
  const result = await applyAcc(ctx, char, acc, sim, sess, ticks * TICK / 1000);
  result.fromTick = fromTick; result.toTick = sim.t;
  // apply level change to the live sim
  if (result.levelsGained) {
    const c2 = await getChar(ctx, char.id);
    setPlayerStats(sim, await computeStats(ctx, c2));
  }
  const finished = sim.status !== 'running' || end;
  if (finished) {
    await finishSession(ctx, sess, sim, Math.min(untilMs, num(sess.started_ms) + sim.t * TICK));
    result.ended = { status: sim.status === 'running' ? 'stopped' : sim.status, reason: sim.endReason || (end ? 'player' : null), kind: sess.kind, target: sess.target };
  } else {
    await ctx.q('update active_farm_sessions set sim_state=$2::jsonb, settled_tick=$3 where user_id=$1', [ctx.uid, J(snapshot(sim)), sim.t]);
  }
  return { result, sim };
}

async function applyAcc(ctx, char, acc, sim, sess, seconds) {
  const out = { kills: acc.kills, xp: 0, gold: 0, items: [], autoSold: 0, autoSalvaged: 0, mats: {}, levelsGained: 0, deaths: acc.deaths, questUpdates: [], unlocked: [], achievements: [] };
  // XP (Alpha cap 30)
  const lvl0 = num(char.level);
  const xpRes = applyXp(lvl0, num(char.xp), acc.xp);
  out.xp = acc.xp; out.levelsGained = xpRes.levelsGained; out.level = xpRes.level;
  await ctx.q('update characters set level=$2, xp=$3 where id=$1', [char.id, xpRes.level, xpRes.xp]);
  // gold
  if (acc.gold) { await addGold(ctx, acc.gold, 'farm', sess.id); out.gold = acc.gold; }
  // loot
  const filter = parseJson(char.loot_filter, { sellBelow: -1, salvageBelow: -1 });
  const matGain = {};
  let legendaries = 0;
  for (const l of acc.loot) {
    if (l.t === 'mat') { matGain[l.id] = (matGain[l.id] || 0) + l.n; continue; }
    const it = l.item;
    const base = BASE_BY_ID[it.base_id];
    await discover(ctx, 'item', it.base_id);
    if (base.unique) await discover(ctx, 'unique', it.base_id);
    if (base.set) await discover(ctx, 'set', it.base_id);
    if (it.rarity >= 4) legendaries++;
    if (!base.unique && !base.set && it.rarity <= filter.sellBelow) {
      const v = npcSellValue(it); await addGold(ctx, v, 'autosell', sess.id); out.autoSold++; out.gold += v; continue;
    }
    if (!base.unique && !base.set && it.rarity <= filter.salvageBelow) {
      const y = salvageYield(it, sim.lrng.s ^ out.autoSalvaged);
      for (const [m, n] of Object.entries(y)) matGain[m] = (matGain[m] || 0) + n;
      out.autoSalvaged++; continue;
    }
    const placed = await placeForCharacter(ctx, it, char.id, 'drop:' + l.src, sess.id);
    out.items.push({ ...it, id: placed.id, location: placed.location, src: l.src });
  }
  if (Object.keys(matGain).length) await changeMats(ctx, ACCOUNT_SCOPE, matGain);
  out.mats = matGain;
  const matsCollected = Object.values(matGain).reduce((a, b) => a + b, 0);

  // progress / stats
  const prog = await getProgress(ctx, char.id);
  const st = parseJson(prog.stats, {});
  st.kills = (st.kills || 0) + acc.kills;
  st.deaths = (st.deaths || 0) + acc.deaths;
  st.elites = (st.elites || 0) + acc.tiers.elite;
  st.champions = (st.champions || 0) + acc.tiers.champion;
  st.seconds = (st.seconds || 0) + Math.round(seconds);
  st.killsBy = st.killsBy || {};
  for (const [k, v] of Object.entries(acc.killsBy)) { st.killsBy[k] = (st.killsBy[k] || 0) + v; await discover(ctx, 'enemy', k, v); }
  const bossKills = parseJson(prog.boss_kills, {});
  let unlockedRegions = prog.unlocked_regions || ['broken_meadows'];
  for (const [b, n] of Object.entries(acc.bossKills)) {
    bossKills[b] = (bossKills[b] || 0) + n;
    await discover(ctx, 'boss', b, n);
    const region = REGIONS.find((r) => r.boss === b);
    if (region) {
      const next = REGIONS.find((r) => r.order === region.order + 1 && r.available);
      if (next && !unlockedRegions.includes(next.id)) { unlockedRegions = [...unlockedRegions, next.id]; out.unlocked.push(next.id); }
    }
  }
  let dungeons = 0;
  let dungeonKey = null;
  if (sess.kind === 'dungeon' && sim.status === 'won') {
    dungeons = 1; dungeonKey = `dungeon_${sess.difficulty}`;
    st.dungeons = (st.dungeons || 0) + 1;
  }
  await ctx.q(`update character_progress set stats=$2::jsonb, boss_kills=$3::jsonb, unlocked_regions=array(select jsonb_array_elements_text($4::jsonb)), current_zone=coalesce($5, current_zone) where character_id=$1`,
    [char.id, J(st), J(bossKills), J(unlockedRegions), sim.zoneId || null]);
  const bossTotal = Object.values(acc.bossKills).reduce((a, b) => a + b, 0);
  const statDelta = { kills: acc.kills, elites: acc.tiers.elite, champions: acc.tiers.champion, bosses: bossTotal, legendaries };
  for (const [b, n] of Object.entries(acc.bossKills)) statDelta['boss_' + b] = n;
  if (dungeonKey) statDelta[dungeonKey] = 1;
  await bumpStats(ctx, statDelta);

  out.questUpdates = await progressQuests(ctx, char, { ...acc, dungeons, matsCollected, level: xpRes.level });
  out.achievements = await checkAchievements(ctx);

  // elixir buffs tick down with simulated active time
  const buffs = parseJson(char.buffs, []);
  if (buffs.length && seconds > 0) {
    const nb = buffs.map((b) => ({ ...b, remaining: Math.max(0, b.remaining - seconds) })).filter((b) => b.remaining > 0);
    await ctx.q('update characters set buffs=$2::jsonb where id=$1', [char.id, J(nb)]);
  }
  // offline rate from verified active farm (exponential moving average)
  if (sess.kind === 'farm' && seconds >= 5) {
    const prof = await getProfile(ctx);
    const rate = parseJson(prof.offline_rate, {});
    const xpps = acc.xp / seconds;
    const regionMats = Object.entries(matGain).filter(([m]) => !['arcane_dust', 'mystic_essence', 'void_crystal', 'starfire_shard'].includes(m)).reduce((a, [, n]) => a + n, 0);
    const mps = regionMats / seconds;
    const a = rate.characterId === char.id && rate.n ? Math.min(0.5, 30 / (rate.n * 30 + 30)) : 1;
    const nr = {
      characterId: char.id, zone: sim.zoneId,
      xpPerSec: (rate.characterId === char.id && rate.xpPerSec ? rate.xpPerSec * (1 - a) : 0) + xpps * a,
      matPerSec: (rate.characterId === char.id && rate.matPerSec ? rate.matPerSec * (1 - a) : 0) + mps * a,
      n: (rate.characterId === char.id ? rate.n || 0 : 0) + 1,
    };
    await ctx.q('update profiles set offline_rate=$2::jsonb where user_id=$1', [ctx.uid, J(nr)]);
  }
  await ctx.q(`insert into farm_settlements (session_id, user_id, character_id, from_tick, to_tick, kills, xp, gold, items, materials, outcome)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11) on conflict (session_id, from_tick) do nothing`,
  [sess.id, ctx.uid, char.id, sim.t - Math.round(seconds * 1000 / TICK), sim.t, acc.kills, acc.xp, out.gold, out.items.length, J(matGain), sim.status]);
  return out;
}

async function finishSession(ctx, sess, sim, endMs) {
  await ctx.q('delete from active_farm_sessions where user_id=$1', [ctx.uid]);
  if (sess.kind === 'farm') {
    await ctx.q('update profiles set offline_since=$2, offline_character_id=$3, offline_zone=$4 where user_id=$1', [ctx.uid, tsArg(endMs), sess.character_id, sim.zoneId]);
  }
}

// Close a session whose lease expired (no heartbeat for LEASE_S): simulate only until lease end.
async function expireStale(ctx) {
  const s = await sessionRow(ctx, true);
  if (!s) return null;
  const leaseEnd = num(s.hb_ms) + BALANCE.LEASE_S * 1000;
  if (ctx.now <= leaseEnd) return null;
  const { result } = await settle(ctx, s, leaseEnd, { end: true });
  return result;
}

async function endActiveSession(ctx) {
  const s = await sessionRow(ctx, true);
  if (!s) return null;
  const leaseEnd = num(s.hb_ms) + BALANCE.LEASE_S * 1000;
  const { result } = await settle(ctx, s, Math.min(ctx.now, leaseEnd), { end: true });
  return result;
}

// Settle the active session (if this character is farming) so equipment/build changes apply from now on.
async function settleIfActive(ctx, charId) {
  const s = await sessionRow(ctx, true);
  if (!s || s.character_id !== charId) return null;
  if (ctx.now - num(s.hb_ms) > BALANCE.LEASE_S * 1000) { await settle(ctx, s, num(s.hb_ms) + BALANCE.LEASE_S * 1000, { end: true }); return null; }
  const { result } = await settle(ctx, s, ctx.now);
  return result;
}

async function refreshSessionStats(ctx, charId) {
  const s = await sessionRow(ctx, true);
  if (!s || s.character_id !== charId) return null;
  const char = await getChar(ctx, charId);
  const sim = restore(parseJson(s.sim_state, {}));
  setPlayerStats(sim, await computeStats(ctx, char));
  await ctx.q('update active_farm_sessions set sim_state=$2::jsonb where user_id=$1', [ctx.uid, J(snapshot(sim))]);
  return sessionPayload(s, sim, ctx);
}

// =====================================================================================
// offline progress
async function claimOffline(ctx, prof) {
  if (!prof.offline_ms || !prof.offline_character_id) return null;
  const sess = await sessionRow(ctx, false);
  if (sess) return null;
  const fromMs = num(prof.offline_ms);
  const secondsRaw = Math.floor((ctx.now - fromMs) / 1000);
  if (secondsRaw < BALANCE.OFFLINE_MIN_S) return null;
  const seconds = Math.min(BALANCE.OFFLINE_MAX_S, secondsRaw);
  const charR = await ctx.q('select * from characters where id=$1 and user_id=$2 and deleted_at is null for update', [prof.offline_character_id, ctx.uid]);
  await ctx.q('update profiles set offline_since=$2 where user_id=$1', [ctx.uid, tsArg(ctx.now)]);
  if (!charR.length) return null;
  const char = charR[0];
  const rate = parseJson(prof.offline_rate, {});
  const xpps = rate.characterId === char.id ? rate.xpPerSec || 0 : 0;
  const mps = rate.characterId === char.id ? rate.matPerSec || 0 : 0;
  const xpGain = Math.floor(xpps * seconds * BALANCE.OFFLINE_XP_RATE);
  const res = applyXp(num(char.level), num(char.xp), xpGain);
  await ctx.q('update characters set level=$2, xp=$3 where id=$1', [char.id, res.level, res.xp]);
  // character-bound helper materials (alchemy only); no gold, no equipment
  const zone = ZONE_BY_ID[prof.offline_zone];
  const region = zone ? REGION_BY_ID[zone.region] : REGION_BY_ID.broken_meadows;
  const total = Math.floor(mps * seconds * BALANCE.OFFLINE_MAT_RATE);
  const pool = [...region.materials, ...region.herbs];
  const matGain = {};
  const rng = RNG.makeRng(secureSeed());
  for (let i = 0; i < Math.min(total, 5000); i++) { const m = RNG.pick(rng, pool); matGain[m] = (matGain[m] || 0) + 1; }
  await changeMats(ctx, char.id, matGain);
  await ctx.q(`insert into offline_claims (user_id, character_id, from_at, to_at, seconds, xp, materials, levels) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
    [ctx.uid, char.id, tsArg(fromMs), tsArg(ctx.now), seconds, xpGain, J(matGain), res.levelsGained]);
  if (res.levelsGained) await progressQuests(ctx, { ...char, level: res.level }, { zoneKills: {}, killsBy: {}, tiers: {}, bossKills: {}, eliteRegions: {}, kills: 0, level: res.level });
  return { characterId: char.id, characterName: char.name, seconds, secondsAway: secondsRaw, capped: secondsRaw > seconds, xp: xpGain, materials: matGain, levelsGained: res.levelsGained, level: res.level };
}

// =====================================================================================
// contracts
function contractOffers(level, unlocked, rng) {
  const pool = CONTRACT_TEMPLATES.filter((t) => (!t.region || unlocked.includes(t.region)) && (!t.minLevel || level >= t.minLevel));
  const picks = [];
  const used = new Set();
  for (let i = 0; i < 3 && used.size < pool.length; i++) {
    let t; do { t = RNG.pick(rng, pool); } while (used.has(t.id));
    used.add(t.id);
    const reg = t.region ? REGION_BY_ID[t.region] : REGION_BY_ID[unlocked[unlocked.length - 1]];
    const L = Math.min(level, reg.levels[1]);
    const count = Math.max(1, Math.round(t.counts * (0.8 + 0.4 * RNG.next(rng))));
    const mult = t.obj.type === 'defeat_boss' ? 25 : t.obj.type === 'kill_tier' ? 8 : t.obj.type === 'complete_dungeon' ? 40 : 1;
    picks.push({
      template: t.id, name: t.name, count,
      reward: { gold: Math.round(killGold(L) * count * mult * 3), xp: Math.round(killXp(L) * count * mult * 1.5), mats: { [reg.materials[0]]: 2 + Math.floor(count / 10) } },
    });
  }
  return picks;
}

// =====================================================================================
// views
async function characterView(ctx, char) {
  const id = char.id;
  // refresh contract board (3 offers, every 2 hours or when empty)
  const pr0 = await ctx.q('select contract_offers, unlocked_regions, (extract(epoch from offers_refresh_at)*1000)::float8 as rms from character_progress where character_id=$1', [id]);
  if (pr0.length && (parseJson(pr0[0].contract_offers, []).length === 0 || num(pr0[0].rms) < ctx.now)) {
    const offers = contractOffers(num(char.level), pr0[0].unlocked_regions, RNG.makeRng(secureSeed()));
    await ctx.q('update character_progress set contract_offers=$2::jsonb, offers_refresh_at=to_timestamp($3/1000.0) where character_id=$1', [id, J(offers), ctx.now + 2 * 3600000]);
  }
  const [prog, items, quests, loadouts] = await Promise.all([
    getProgress(ctx, id),
    ctx.q("select * from item_instances where character_id=$1 and location in ('bag','equipped') order by created_at", [id]),
    ctx.q('select * from character_quests where character_id=$1 order by created_at', [id]),
    ctx.q('select * from character_loadouts where character_id=$1 order by idx', [id]),
  ]);
  const stats = await computeStats(ctx, char);
  const lo = loadouts.map((l) => ({ idx: num(l.idx), name: l.name, tree: parseJson(l.tree, {}), actives: l.actives || [], passives: l.passives || [], rules: parseJson(l.rules, {}) }));
  const spent = (tree) => Object.values(tree).reduce((a, b) => a + b, 0);
  return {
    character: charSummary(char),
    progress: { unlockedRegions: prog.unlocked_regions, bossKills: parseJson(prog.boss_kills, {}), seals: prog.seals || [], stats: parseJson(prog.stats, {}), currentZone: prog.current_zone, contractOffers: parseJson(prog.contract_offers, []) },
    bag: items.filter((x) => x.location === 'bag').map(itemRow),
    equipped: Object.fromEntries(items.filter((x) => x.location === 'equipped').map((x) => [x.equip_slot, itemRow(x)])),
    quests: quests.map((qq) => ({ id: qq.quest_id, kind: qq.kind, progress: num(qq.progress), target: num(qq.target), state: qq.state, data: parseJson(qq.data, {}) })),
    loadouts: lo.map((l) => ({ ...l, pointsSpent: spent(l.tree), pointsTotal: skillPointsForLevel(num(char.level)) })),
    stats,
    boundMaterials: await mats(ctx, id),
  };
}

function charSummary(c) {
  return { id: c.id, slot: num(c.slot), name: c.name, cls: c.class, appearance: parseJson(c.appearance, {}), level: num(c.level), xp: num(c.xp), xpToNext: xpToNext(num(c.level)), activeBuild: num(c.active_build), deathRule: c.death_rule, lootFilter: parseJson(c.loot_filter, {}), buffs: parseJson(c.buffs, []) };
}

// =====================================================================================
// market helpers
async function expireListings(ctx, limit = 50) {
  const r = await ctx.q(`select * from market_listings where status='active' and expires_at < to_timestamp($1/1000.0) order by expires_at limit $2 for update skip locked`, [ctx.now, limit]);
  for (const l of r) {
    await ctx.q("update market_listings set status='expired', closed_at=to_timestamp($2/1000.0) where id=$1", [l.id, ctx.now]);
    const it = await ctx.q("select id from item_instances where id=$1 and location='market' for update", [l.item_id]);
    if (it.length) {
      await placeInStash(ctx, l.item_id, 'market', 'expired:' + l.id, l.seller_user);
      await ctx.q('insert into notifications (user_id, kind, payload) values ($1,$2,$3::jsonb)', [l.seller_user, 'market_expired', J({ listingId: l.id, base_id: l.base_id })]);
    }
  }
  return r.length;
}

function listingRow(l) {
  return {
    id: l.id, seller: l.seller_name, sellerUser: l.seller_user, price: num(l.price), status: l.status,
    createdAt: l.created_at, expiresAt: l.expires_at, closedAt: l.closed_at, item: { ...parseJson(l.item_snapshot, {}), id: l.item_id },
  };
}

// =====================================================================================
// HANDLERS
const HANDLERS = {
  // ---------------------------------------------------------------- account
  async bootstrap(ctx) {
    const pr = await ctx.q(`select *, (extract(epoch from offline_since)*1000)::float8 as offline_ms from profiles where user_id=$1 for update`, [ctx.uid]);
    if (!pr.length) return { profile: null };
    let prof = pr[0];
    const expired = await expireStale(ctx);
    if (expired) prof = await getProfile(ctx, true);
    // daily special hunts accumulate up to 7 (no streak, nothing lost by missing days)
    const today = new Date(ctx.now).toISOString().slice(0, 10);
    const last = new Date(prof.daily_hunt_day).toISOString().slice(0, 10);
    const days = Math.floor((Date.parse(today) - Date.parse(last)) / 86400000);
    if (days > 0) {
      await ctx.q('update profiles set daily_hunts=least(7, daily_hunts + $2), daily_hunt_day=$3::date where user_id=$1', [ctx.uid, days, today]);
    }
    const offline = await claimOffline(ctx, prof);
    prof = await getProfile(ctx);
    await expireListings(ctx);
    const [chars, stash, overflow, notes, ach, weekly, sess] = await Promise.all([
      ctx.q('select * from characters where user_id=$1 and deleted_at is null order by slot', [ctx.uid]),
      ctx.q("select * from item_instances where owner_user=$1 and location='stash' order by created_at", [ctx.uid]),
      ctx.q("select * from item_instances where owner_user=$1 and location='overflow' order by created_at", [ctx.uid]),
      ctx.q('select * from notifications where user_id=$1 order by id desc limit 30', [ctx.uid]),
      ctx.q('select * from account_achievements where user_id=$1', [ctx.uid]),
      ctx.q('select * from account_weekly where user_id=$1 and period=$2', [ctx.uid, isoWeek(ctx.now)]),
      sessionRow(ctx, false),
    ]);
    return {
      profile: { userId: prof.user_id, displayName: prof.display_name, lastCharacterId: prof.last_character_id, dailyHunts: num(prof.daily_hunts), settings: parseJson(prof.settings, {}), stats: parseJson(prof.stats, {}) },
      gold: await gold(ctx),
      materials: await mats(ctx, ACCOUNT_SCOPE),
      characters: chars.map(charSummary),
      stash: stash.map(itemRow), overflow: overflow.map(itemRow),
      notifications: notes.map((n) => ({ id: num(n.id), kind: n.kind, payload: parseJson(n.payload, {}), read: n.read, at: n.created_at })),
      achievements: ach.map((a) => ({ id: a.achievement_id, claimed: !!a.claimed_at })),
      weekly: { period: isoWeek(ctx.now), hunts: WEEKLY_HUNTS.map((h) => { const w = weekly.find((x) => x.hunt_id === h.id); return { id: h.id, progress: w ? num(w.progress) : 0, target: h.count, claimed: !!w?.claimed }; }) },
      session: sess ? { id: sess.id, characterId: sess.character_id, kind: sess.kind, target: sess.target } : null,
      offline, expired,
      serverNowMs: ctx.now,
    };
  },

  async create_profile(ctx, { displayName }) {
    const name = String(displayName || '').trim();
    if (!/^[\p{L}\p{N}_ ]{3,20}$/u.test(name)) throw new GameError('BAD_NAME', 'Ad 3-20 karakter olmalı (harf, rakam, boşluk, _).');
    const ex = await ctx.q('select 1 from profiles where user_id=$1', [ctx.uid]);
    if (ex.length) throw new GameError('PROFILE_EXISTS', 'Profil zaten var.');
    const dup = await ctx.q('select 1 from profiles where lower(display_name)=lower($1)', [name]);
    if (dup.length) throw new GameError('NAME_TAKEN', 'Bu avcı adı alınmış.');
    await ctx.q('insert into profiles (user_id, display_name, daily_hunt_day) values ($1,$2,$3::date)', [ctx.uid, name, new Date(ctx.now).toISOString().slice(0, 10)]);
    await ctx.q('insert into account_wallets (user_id, gold) values ($1,0)', [ctx.uid]);
    await addGold(ctx, STARTING_GOLD, 'starting_gold');
    return { ok: true };
  },

  async create_character(ctx, { slot, name, cls, appearance }) {
    await getProfile(ctx, true);
    slot = Number(slot);
    if (![1, 2, 3].includes(slot)) throw new GameError('BAD_SLOT', 'Geçersiz yuva.');
    if (!CLASSES[cls]) throw new GameError('BAD_CLASS', 'Geçersiz sınıf.');
    const nm = String(name || '').trim();
    if (!/^[\p{L}\p{N}_]{3,16}$/u.test(nm)) throw new GameError('BAD_NAME', 'Karakter adı 3-16 harf/rakam olmalı.');
    const used = await ctx.q('select 1 from characters where user_id=$1 and slot=$2 and deleted_at is null', [ctx.uid, slot]);
    if (used.length) throw new GameError('SLOT_USED', 'Bu yuva dolu.');
    const ap = appearance && typeof appearance === 'object' ? {
      body: Number(appearance.body) | 0, skin: Number(appearance.skin) | 0, hair: Number(appearance.hair) | 0,
      hairColor: Number(appearance.hairColor) | 0, cosmetic: Number(appearance.cosmetic) | 0,
    } : {};
    const id = uuid();
    await ctx.q('insert into characters (id, user_id, slot, name, class, appearance) values ($1,$2,$3,$4,$5,$6::jsonb)', [id, ctx.uid, slot, nm, cls, J(ap)]);
    await ctx.q('insert into character_progress (character_id) values ($1)', [id]);
    const dl = defaultLoadout(cls);
    for (let i = 0; i < 3; i++) {
      await ctx.q('insert into character_loadouts (character_id, idx, name, tree, actives, passives, rules) values ($1,$2,$3,$4::jsonb,array(select jsonb_array_elements_text($5::jsonb)),array(select jsonb_array_elements_text($6::jsonb)),$7::jsonb)',
        [id, i, `Build ${i + 1}`, '{}', J(dl.actives.map((x) => x || '')), J(dl.passives.map((x) => x || '')), J(dl.rules)]);
    }
    // starter equipment: system reward, character-bound (not tradeable)
    const C = CLASSES[cls];
    const rng = RNG.makeRng(secureSeed());
    for (const [baseId, slotName] of [[C.starterWeapon, 'mainhand'], [C.starterOff, 'offhand'], [C.starterArmor, 'chest']]) {
      if (!baseId) continue;
      const it = generateItem(rng, baseId, 1, 0);
      const itemId = await createItem(ctx, it, { location: 'bag', characterId: id, origin: 'starter', bound: id });
      await ctx.q("update item_instances set location='equipped', equip_slot=$2 where id=$1", [itemId, slotName]);
    }
    await ensureMainQuest(ctx, id, 'mq_1_1', 1);
    await ctx.q('update profiles set last_character_id=$2 where user_id=$1', [ctx.uid, id]);
    await bumpStats(ctx, { characters: 1 });
    await checkAchievements(ctx);
    return { ok: true, characterId: id };
  },

  async delete_character(ctx, { characterId }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    const s = await sessionRow(ctx, true);
    if (s && s.character_id === char.id) await endActiveSession(ctx);
    const items = await ctx.q("select id, location, bound_character from item_instances where character_id=$1 and location in ('bag','equipped') for update", [char.id]);
    for (const it of items) {
      if (it.bound_character === char.id) { await ctx.q("update item_instances set location='destroyed', character_id=null, equip_slot=null where id=$1", [it.id]); await invLog(ctx, it.id, 'destroy:char_deleted', it.location, 'destroyed'); }
      else await placeInStash(ctx, it.id, it.location, 'char_deleted');
    }
    await ctx.q('update characters set deleted_at=now() where id=$1', [char.id]);
    return { ok: true };
  },

  async select_character(ctx, { characterId }) {
    const prof = await getProfile(ctx, true);
    const char = await getChar(ctx, characterId);
    let ended = null;
    const s = await sessionRow(ctx, true);
    if (s && s.character_id !== char.id) ended = await endActiveSession(ctx);
    await ctx.q('update profiles set last_character_id=$2 where user_id=$1', [ctx.uid, char.id]);
    const view = await characterView(ctx, await getChar(ctx, char.id));
    return { ok: true, endedPrevious: ended, view, hadProfile: !!prof };
  },

  async character(ctx, { characterId }) {
    const char = await getChar(ctx, characterId);
    return characterView(ctx, char);
  },

  async set_char_settings(ctx, { characterId, deathRule, lootFilter }) {
    const char = await getChar(ctx, characterId, true);
    if (deathRule && !['continue', 'retreat', 'stop'].includes(deathRule)) throw new GameError('BAD_ARGS', 'Geçersiz ölüm kuralı.');
    const lf = lootFilter ? { sellBelow: Math.max(-1, Math.min(2, Number(lootFilter.sellBelow) | 0)), salvageBelow: Math.max(-1, Math.min(3, Number(lootFilter.salvageBelow) | 0)) } : null;
    await ctx.q('update characters set death_rule=coalesce($2, death_rule), loot_filter=coalesce($3::jsonb, loot_filter) where id=$1', [char.id, deathRule || null, lf ? J(lf) : null]);
    return { ok: true };
  },

  // ---------------------------------------------------------------- farming
  async farm_start(ctx, { characterId, kind = 'farm', target, difficulty = 'normal', useDailyHunt = false }) {
    const prof = await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    // end any previous session (other tab / other character)
    const prev = await sessionRow(ctx, true);
    let ended = null;
    if (prev) ended = await endActiveSession(ctx);
    // collect pending offline progress before starting active play
    const offline = await claimOffline(ctx, await getProfile(ctx, true));
    const prog = await getProgress(ctx, char.id);
    const level = num(char.level);
    const opts = { mode: kind, deathRule: char.death_rule };
    if (kind === 'farm') {
      const zone = ZONE_BY_ID[target];
      if (!zone) throw new GameError('BAD_ZONE', 'Bölge bulunamadı.');
      if (!prog.unlocked_regions.includes(zone.region)) throw new GameError('ZONE_LOCKED', 'Bu bölge henüz açılmadı.');
      opts.zoneId = zone.id;
    } else if (kind === 'boss') {
      const enc = BOSS_ENCOUNTERS[target];
      if (!enc) throw new GameError('BAD_BOSS', 'Boss bulunamadı.');
      if (!prog.unlocked_regions.includes(enc.region)) throw new GameError('ZONE_LOCKED', 'Bu bölge henüz açılmadı.');
      const gate = MAIN_QUESTS.find((q) => q.bossGate && q.obj.boss === target);
      const qr = await ctx.q('select 1 from character_quests where character_id=$1 and quest_id=$2', [char.id, gate.id]);
      if (!qr.length && !(parseJson(prog.boss_kills, {})[target] > 0)) throw new GameError('BOSS_LOCKED', 'Önce bölgenin ana görevlerini tamamla.');
      if (level < enc.minLevel) throw new GameError('LEVEL_TOO_LOW', `Bu boss için en az ${enc.minLevel}. seviye gerekli.`);
      opts.bossId = target;
    } else if (kind === 'dungeon') {
      const D = DUNGEONS[target];
      if (!D) throw new GameError('BAD_DUNGEON', 'Zindan bulunamadı.');
      const diff = D.difficulties[difficulty];
      if (!diff || diff.locked) throw new GameError('BAD_DIFFICULTY', 'Bu zorluk henüz açık değil.');
      if (level < D.minLevel) throw new GameError('LEVEL_TOO_LOW', `Zindan için en az ${D.minLevel}. seviye gerekli.`);
      if (!(parseJson(prog.boss_kills, {})[D.unlock.boss] > 0)) throw new GameError('DUNGEON_LOCKED', 'Önce Köklerin Efendisi\'ni yen.');
      if (difficulty === 'heroic' && !(parseJson(prog.stats, {}).dungeons > 0)) throw new GameError('DUNGEON_LOCKED', 'Kahraman zorluğu için önce Normal zorluğu tamamla.');
      opts.dungeonId = target; opts.difficulty = difficulty;
    } else throw new GameError('BAD_ARGS', 'Geçersiz oturum türü.');
    if (useDailyHunt && kind === 'farm') {
      if (num(prof.daily_hunts) <= 0) throw new GameError('NO_HUNTS', 'Özel av hakkın yok.');
      await ctx.q('update profiles set daily_hunts=daily_hunts-1 where user_id=$1', [ctx.uid]);
      opts.forceChampion = 1;
    }
    const stats = await computeStats(ctx, char);
    const seed = secureSeed();
    const sim = createSim({ ...opts, seed, stats });
    const id = uuid();
    await ctx.q(`insert into active_farm_sessions (user_id, id, character_id, kind, target, difficulty, seed, started_at, last_heartbeat_at, settled_tick, sim_state)
      values ($1,$2,$3,$4,$5,$6,$7,to_timestamp($8/1000.0),to_timestamp($8/1000.0),0,$9::jsonb)`,
    [ctx.uid, id, char.id, kind, target, kind === 'dungeon' ? difficulty : null, seed, ctx.now, J(snapshot(sim))]);
    await ctx.q('update profiles set offline_since=null, last_character_id=$2 where user_id=$1', [ctx.uid, char.id]);
    if (kind === 'farm') await ctx.q('update character_progress set current_zone=$2 where character_id=$1', [char.id, target]);
    const sess = (await sessionRow(ctx, false));
    return { ok: true, session: sessionPayload(sess, sim, ctx), endedPrevious: ended, offline };
  },

  async farm_heartbeat(ctx, { sessionId }) {
    await getProfile(ctx, true);
    const s = await sessionRow(ctx, true);
    if (!s || s.id !== sessionId) throw new GameError('SESSION_ENDED', 'Bu av oturumu sona erdi (başka bir sekme/cihaz veya zaman aşımı).');
    const leaseEnd = num(s.hb_ms) + BALANCE.LEASE_S * 1000;
    if (ctx.now > leaseEnd) {
      const { result } = await settle(ctx, s, leaseEnd, { end: true });
      return { ok: true, settlement: result, session: null, expired: true };
    }
    const { result, sim } = await settle(ctx, s, ctx.now);
    if (result.ended) return { ok: true, settlement: result, session: null };
    await ctx.q('update active_farm_sessions set last_heartbeat_at=to_timestamp($2/1000.0) where user_id=$1', [ctx.uid, ctx.now]);
    const s2 = await sessionRow(ctx, false);
    return { ok: true, settlement: result, session: sessionPayload(s2, sim, ctx), gold: await gold(ctx) };
  },

  async farm_stop(ctx, { sessionId }) {
    await getProfile(ctx, true);
    const s = await sessionRow(ctx, true);
    if (!s || (sessionId && s.id !== sessionId)) return { ok: true, settlement: null };
    const res = await endActiveSession(ctx);
    return { ok: true, settlement: res };
  },

  // ---------------------------------------------------------------- equipment
  async equip(ctx, { itemId, characterId, slot }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    await settleIfActive(ctx, char.id);
    const it = await getItem(ctx, itemId);
    if (!(it.location === 'bag' && it.character_id === char.id) && it.location !== 'stash') throw new GameError('BAD_LOCATION', 'Eşya çantanda veya depoda olmalı.');
    if (it.bound_character && it.bound_character !== char.id) throw new GameError('BOUND', 'Bu eşya başka bir karaktere bağlı.');
    const base = BASE_BY_ID[it.base_id];
    if (!baseAllowedForClass(base, char.class)) throw new GameError('WRONG_CLASS', 'Sınıfın bu eşyayı kuşanamaz.');
    if (num(char.level) < reqLevelOf(it)) throw new GameError('LEVEL_TOO_LOW', `Gerekli seviye: ${reqLevelOf(it)}`);
    if (it.pending_polish) throw new GameError('PENDING_POLISH', 'Önce bekleyen cila sonucunu seç.');
    const slots = equipSlotsFor(base);
    const eq = await equippedMap(ctx, char.id);
    let target = slot && slots.includes(slot) ? slot : null;
    if (!target) target = slots.find((s) => !eq[s]) || slots[0];
    const fam = FAMILIES[base.family];
    const toBag = [];
    if (eq[target]) toBag.push(eq[target]);
    if (target === 'mainhand' && fam.hands === 2 && eq.offhand) toBag.push(eq.offhand);
    if (target === 'offhand') {
      const main = eq.mainhand ? BASE_BY_ID[eq.mainhand.base_id] : null;
      if (main && FAMILIES[main.family].hands === 2) throw new GameError('TWO_HANDED', 'Çift elli silah varken ikinci el kuşanılamaz.');
      if (fam.kind === 'weapon' && (!main || !FAMILIES[main.family].offhandOk)) throw new GameError('NO_DUAL', 'Çift silah için ana elde tek elli bir silah olmalı.');
    }
    // capacity
    const bagCount = await countLoc(ctx, 'bag', char.id);
    const freed = it.location === 'bag' ? 1 : 0;
    if (bagCount - freed + toBag.length > BALANCE.BAG_SLOTS) throw new GameError('BAG_FULL', 'Çanta dolu.');
    for (const old of toBag) {
      await ctx.q("update item_instances set location='bag', equip_slot=null, character_id=$2, updated_at=now() where id=$1", [old.id, char.id]);
      await invLog(ctx, old.id, 'unequip', 'equipped', 'bag');
    }
    await ctx.q("update item_instances set location='equipped', equip_slot=$2, character_id=$3, updated_at=now() where id=$1", [it.id, target, char.id]);
    await invLog(ctx, it.id, 'equip', it.location, 'equipped');
    // set4 achievement
    const eq2 = await equippedMap(ctx, char.id);
    const sets = {};
    for (const x of Object.values(eq2)) { const b = BASE_BY_ID[x.base_id]; if (b.set) sets[b.set] = (sets[b.set] || 0) + 1; }
    if (Object.values(sets).some((n) => n >= 4)) { await bumpStats(ctx, {}, { set4: 1 }); await checkAchievements(ctx); }
    const session = await refreshSessionStats(ctx, char.id);
    return { ok: true, slot: target, session, view: await characterView(ctx, await getChar(ctx, char.id)) };
  },

  async unequip(ctx, { characterId, slot }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    if (!SLOTS.includes(slot)) throw new GameError('BAD_ARGS', 'Geçersiz yuva.');
    await settleIfActive(ctx, char.id);
    const eq = await equippedMap(ctx, char.id);
    const it = eq[slot];
    if (!it) throw new GameError('EMPTY_SLOT', 'Yuva boş.');
    if (await countLoc(ctx, 'bag', char.id) >= BALANCE.BAG_SLOTS) throw new GameError('BAG_FULL', 'Çanta dolu.');
    await ctx.q("update item_instances set location='bag', equip_slot=null, updated_at=now() where id=$1", [it.id]);
    await invLog(ctx, it.id, 'unequip', 'equipped', 'bag');
    const session = await refreshSessionStats(ctx, char.id);
    return { ok: true, session, view: await characterView(ctx, await getChar(ctx, char.id)) };
  },

  async move_item(ctx, { itemId, to, characterId }) {
    await getProfile(ctx, true);
    const it = await getItem(ctx, itemId);
    if (it.location === 'equipped' || it.location === 'market') throw new GameError('BAD_LOCATION', 'Bu eşya taşınamaz.');
    if (to === 'stash') {
      if (it.location === 'stash') return { ok: true };
      if (it.bound_character) throw new GameError('BOUND', 'Karaktere bağlı eşyalar ortak depoya konamaz.');
      if (await countLoc(ctx, 'stash') >= BALANCE.STASH_SLOTS) throw new GameError('STASH_FULL', 'Ortak depo dolu.');
      await ctx.q("update item_instances set location='stash', character_id=null, updated_at=now() where id=$1", [it.id]);
      await invLog(ctx, it.id, 'move', it.location, 'stash');
    } else if (to === 'bag') {
      const char = await getChar(ctx, characterId);
      if (it.location === 'bag' && it.character_id === char.id) return { ok: true };
      if (it.bound_character && it.bound_character !== char.id) throw new GameError('BOUND', 'Bu eşya başka bir karaktere bağlı.');
      if (await countLoc(ctx, 'bag', char.id) >= BALANCE.BAG_SLOTS) throw new GameError('BAG_FULL', 'Çanta dolu.');
      await ctx.q("update item_instances set location='bag', character_id=$2, updated_at=now() where id=$1", [it.id, char.id]);
      await invLog(ctx, it.id, 'move', it.location, 'bag');
    } else throw new GameError('BAD_ARGS', 'Geçersiz hedef.');
    return { ok: true };
  },

  async lock_item(ctx, { itemId, locked }) {
    const it = await getItem(ctx, itemId);
    await ctx.q('update item_instances set locked=$2 where id=$1', [it.id, !!locked]);
    return { ok: true, locked: !!locked };
  },

  async sell_npc(ctx, { itemIds }) {
    await getProfile(ctx, true);
    if (!Array.isArray(itemIds) || !itemIds.length || itemIds.length > 60) throw new GameError('BAD_ARGS', 'Eşya listesi gerekli.');
    let total = 0;
    for (const id of [...new Set(itemIds)]) {
      const it = await getItem(ctx, id);
      if (it.locked) throw new GameError('LOCKED', 'Kilitli eşya satılamaz.');
      if (!['bag', 'stash', 'overflow'].includes(it.location)) throw new GameError('BAD_LOCATION', 'Kuşanılmış veya pazardaki eşya satılamaz.');
      const v = npcSellValue(it);
      total += v;
      await ctx.q("update item_instances set location='destroyed', character_id=null, updated_at=now() where id=$1", [it.id]);
      await invLog(ctx, it.id, 'npc_sell', it.location, 'destroyed');
    }
    const g = await addGold(ctx, total, 'npc_sell');
    return { ok: true, gold: g, earned: total };
  },

  async salvage(ctx, { itemIds }) {
    await getProfile(ctx, true);
    if (!Array.isArray(itemIds) || !itemIds.length || itemIds.length > 60) throw new GameError('BAD_ARGS', 'Eşya listesi gerekli.');
    const gain = {};
    let n = 0;
    for (const id of [...new Set(itemIds)]) {
      const it = await getItem(ctx, id);
      if (it.locked) throw new GameError('LOCKED', 'Kilitli eşya parçalanamaz.');
      if (!['bag', 'stash', 'overflow'].includes(it.location)) throw new GameError('BAD_LOCATION', 'Kuşanılmış veya pazardaki eşya parçalanamaz.');
      const y = salvageYield(it, secureSeed());
      for (const [m, k] of Object.entries(y)) gain[m] = (gain[m] || 0) + k;
      await ctx.q("update item_instances set location='destroyed', character_id=null, updated_at=now() where id=$1", [it.id]);
      await invLog(ctx, it.id, 'salvage', it.location, 'destroyed');
      n++;
    }
    await changeMats(ctx, ACCOUNT_SCOPE, gain);
    await ctx.q('insert into crafting_transactions (user_id, kind, cost, result) values ($1,$2,$3::jsonb,$4::jsonb)', [ctx.uid, 'salvage', J({ items: itemIds }), J(gain)]);
    await bumpStats(ctx, { salvaged: n });
    await checkAchievements(ctx);
    return { ok: true, materials: gain };
  },

  // ---------------------------------------------------------------- crafting & item improvement
  async upgrade(ctx, { itemId, characterId }) {
    await getProfile(ctx, true);
    const it = await getItem(ctx, itemId);
    if (it.location === 'market' || it.location === 'overflow') throw new GameError('BAD_LOCATION', 'Bu eşya şu an geliştirilemez.');
    if (it.location === 'equipped') await settleIfActive(ctx, it.character_id);
    const cost = upgradeCost(it);
    if (!cost) throw new GameError('MAX_UPGRADE', 'Eşya zaten +10.');
    await addGold(ctx, -cost.gold, 'upgrade', it.id);
    await changeMats(ctx, ACCOUNT_SCOPE, Object.fromEntries(Object.entries(cost.mats).map(([k, v]) => [k, -v])));
    const nu = it.upgrade + 1;
    await ctx.q('update item_instances set upgrade=$2, updated_at=now() where id=$1', [it.id, nu]);
    await ctx.q('insert into crafting_transactions (user_id, character_id, kind, item_id, cost, result) values ($1,$2,$3,$4,$5::jsonb,$6::jsonb)', [ctx.uid, characterId || null, 'upgrade', it.id, J(cost), J({ upgrade: nu })]);
    await bumpStats(ctx, {}, { max_upgrade: nu });
    await checkAchievements(ctx);
    const session = it.location === 'equipped' ? await refreshSessionStats(ctx, it.character_id) : null;
    return { ok: true, item: await getItem(ctx, it.id, false), cost, session };
  },

  async reforge(ctx, { itemId, index }) {
    await getProfile(ctx, true);
    const it = await getItem(ctx, itemId);
    if (it.location === 'market') throw new GameError('BAD_LOCATION', 'Pazardaki eşya değiştirilemez.');
    if (it.pending_polish) throw new GameError('PENDING_POLISH', 'Önce bekleyen cila sonucunu seç.');
    index = Number(index);
    if (!(index >= 0 && index < it.affixes.length)) throw new GameError('BAD_ARGS', 'Geçersiz özellik.');
    if (it.location === 'equipped') await settleIfActive(ctx, it.character_id);
    const cost = reforgeCost(it);
    await addGold(ctx, -cost.gold, 'reforge', it.id);
    await changeMats(ctx, ACCOUNT_SCOPE, Object.fromEntries(Object.entries(cost.mats).map(([k, v]) => [k, -v])));
    const na = reforgeAffix(RNG.makeRng(secureSeed()), it, index);
    if (!na) throw new GameError('NO_POOL', 'Bu eşya için başka özellik yok.');
    const affixes = it.affixes.map((a, i) => (i === index ? na : a));
    await ctx.q('update item_instances set affixes=$2::jsonb, reforge_count=reforge_count+1, updated_at=now() where id=$1', [it.id, J(affixes)]);
    await ctx.q('insert into crafting_transactions (user_id, kind, item_id, cost, result) values ($1,$2,$3,$4::jsonb,$5::jsonb)', [ctx.uid, 'reforge', it.id, J(cost), J({ index, old: it.affixes[index], new: na })]);
    await bumpStats(ctx, { reforges: 1 });
    await checkAchievements(ctx);
    const session = it.location === 'equipped' ? await refreshSessionStats(ctx, it.character_id) : null;
    return { ok: true, item: await getItem(ctx, it.id, false), old: it.affixes[index], affix: na, session };
  },

  async polish(ctx, { itemId, index }) {
    await getProfile(ctx, true);
    const it = await getItem(ctx, itemId);
    if (it.location === 'market') throw new GameError('BAD_LOCATION', 'Pazardaki eşya değiştirilemez.');
    if (it.pending_polish) throw new GameError('PENDING_POLISH', 'Önce bekleyen cila sonucunu seç.');
    index = Number(index);
    if (!(index >= 0 && index < it.affixes.length)) throw new GameError('BAD_ARGS', 'Geçersiz özellik.');
    const cost = polishCost(it);
    await addGold(ctx, -cost.gold, 'polish', it.id);
    await changeMats(ctx, ACCOUNT_SCOPE, Object.fromEntries(Object.entries(cost.mats).map(([k, v]) => [k, -v])));
    const na = polishAffix(RNG.makeRng(secureSeed()), it, index);
    await ctx.q('update item_instances set pending_polish=$2::jsonb, polish_count=polish_count+1, updated_at=now() where id=$1', [it.id, J({ index, affix: na })]);
    await ctx.q('insert into crafting_transactions (user_id, kind, item_id, cost, result) values ($1,$2,$3,$4::jsonb,$5::jsonb)', [ctx.uid, 'polish', it.id, J(cost), J({ index, old: it.affixes[index], new: na })]);
    return { ok: true, item: await getItem(ctx, it.id, false), old: it.affixes[index], candidate: na, cost };
  },

  async polish_choose(ctx, { itemId, accept }) {
    await getProfile(ctx, true);
    const it = await getItem(ctx, itemId);
    if (!it.pending_polish) throw new GameError('NO_PENDING', 'Bekleyen cila yok.');
    if (it.location === 'equipped') await settleIfActive(ctx, it.character_id);
    let affixes = it.affixes;
    if (accept) affixes = it.affixes.map((a, i) => (i === it.pending_polish.index ? it.pending_polish.affix : a));
    await ctx.q('update item_instances set affixes=$2::jsonb, pending_polish=null, updated_at=now() where id=$1', [it.id, J(affixes)]);
    const session = it.location === 'equipped' ? await refreshSessionStats(ctx, it.character_id) : null;
    return { ok: true, item: await getItem(ctx, it.id, false), session };
  },

  async craft(ctx, { recipeId, characterId, slot, cls }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    const rec = SMITH_BY_ID[recipeId];
    if (!rec) throw new GameError('BAD_RECIPE', 'Tarif bulunamadı.');
    if (num(char.level) < rec.reqLevel) throw new GameError('LEVEL_TOO_LOW', `Gerekli seviye: ${rec.reqLevel}`);
    const forCls = CLASSES[cls] ? cls : char.class;
    const candidates = RANDOM_BASES.filter((b) => b.tier <= rec.tier && (b.slot === slot || (slot === 'ring' && b.slot === 'ring')) && (!b.classes || b.classes.includes(forCls)));
    if (!candidates.length) throw new GameError('BAD_ARGS', 'Bu yuva için tarif yok.');
    const maxTier = Math.max(...candidates.map((b) => b.tier));
    const bases = candidates.filter((b) => b.tier === maxTier);
    if (await countLoc(ctx, 'bag', char.id) >= BALANCE.BAG_SLOTS) throw new GameError('BAG_FULL', 'Çanta dolu.');
    await addGold(ctx, -rec.gold, 'craft', rec.id);
    await changeMats(ctx, ACCOUNT_SCOPE, Object.fromEntries(Object.entries(rec.mats).map(([k, v]) => [k, -v])));
    const rng = RNG.makeRng(secureSeed());
    const rarity = RNG.weighted(rng, rec.rarityWeights.map((w, i) => [i, w]).filter(([, w]) => w > 0));
    const base = RNG.pick(rng, bases);
    const item = generateItem(rng, base.id, Math.min(rec.itemLevel, Math.max(rec.itemLevel - 4, num(char.level))), rarity);
    const id = await createItem(ctx, item, { location: 'bag', characterId: char.id, origin: 'craft:' + rec.id });
    await ctx.q('insert into crafting_transactions (user_id, character_id, kind, item_id, cost, result) values ($1,$2,$3,$4,$5::jsonb,$6::jsonb)', [ctx.uid, char.id, 'craft', id, J({ gold: rec.gold, mats: rec.mats }), J(item)]);
    await discover(ctx, 'item', base.id);
    await bumpStats(ctx, { crafted: 1, legendaries: rarity >= 4 ? 1 : 0 });
    await checkAchievements(ctx);
    return { ok: true, item: await getItem(ctx, id, false) };
  },

  async brew(ctx, { recipeId, characterId, useBound = true, count = 1 }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    const rec = ALCHEMY_BY_ID[recipeId];
    if (!rec) throw new GameError('BAD_RECIPE', 'Tarif bulunamadı.');
    count = Math.max(1, Math.min(10, Number(count) | 0));
    // Prefer character-bound offline materials; output is bound if any bound material was used.
    const bound = await mats(ctx, char.id);
    const fromBound = {}, fromAccount = {};
    for (const [m, need0] of Object.entries(rec.mats)) {
      const need = need0 * count;
      const b = useBound ? Math.min(bound[m] || 0, need) : 0;
      if (b) fromBound[m] = -b;
      if (need - b) fromAccount[m] = -(need - b);
    }
    await addGold(ctx, -rec.gold * count, 'brew', rec.id);
    await changeMats(ctx, char.id, fromBound);
    await changeMats(ctx, ACCOUNT_SCOPE, fromAccount);
    const scope = Object.keys(fromBound).length ? char.id : ACCOUNT_SCOPE;
    await changeMats(ctx, scope, { [rec.output]: count });
    await ctx.q('insert into crafting_transactions (user_id, character_id, kind, cost, result) values ($1,$2,$3,$4::jsonb,$5::jsonb)', [ctx.uid, char.id, 'brew', J({ fromBound, fromAccount, gold: rec.gold * count }), J({ output: rec.output, count, scope: scope === ACCOUNT_SCOPE ? 'account' : 'character' })]);
    return { ok: true, output: rec.output, count, bound: scope !== ACCOUNT_SCOPE };
  },

  async use_elixir(ctx, { characterId, elixirId }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    const def = MATERIALS[elixirId];
    if (!def?.consumable) throw new GameError('BAD_ARGS', 'Geçersiz iksir.');
    await settleIfActive(ctx, char.id);
    const bound = await mats(ctx, char.id);
    await changeMats(ctx, (bound[elixirId] || 0) > 0 ? char.id : ACCOUNT_SCOPE, { [elixirId]: -1 });
    const buffs = parseJson(char.buffs, []);
    const ex = buffs.find((b) => b.id === elixirId);
    if (ex) ex.remaining = Math.min(3 * 3600, ex.remaining + def.buff.durationS);
    else buffs.push({ id: elixirId, remaining: def.buff.durationS });
    await ctx.q('update characters set buffs=$2::jsonb where id=$1', [char.id, J(buffs)]);
    const session = await refreshSessionStats(ctx, char.id);
    return { ok: true, buffs, session };
  },

  // ---------------------------------------------------------------- skills
  async skill_alloc(ctx, { characterId, build, nodeId }) {
    const char = await getChar(ctx, characterId, true);
    await settleIfActive(ctx, char.id);
    build = Number(build);
    if (![0, 1, 2].includes(build)) throw new GameError('BAD_ARGS', 'Geçersiz build.');
    const node = NODE_BY_ID[nodeId];
    const tree = TREES.find((t) => t.id === node?.tree);
    if (!node || tree.cls !== char.class) throw new GameError('BAD_NODE', 'Geçersiz yetenek düğümü.');
    const lo = await getLoadout(ctx, char.id, build);
    const spent = Object.values(lo.tree).reduce((a, b) => a + b, 0);
    if (spent >= skillPointsForLevel(num(char.level))) throw new GameError('NO_POINTS', 'Yetenek puanın yok.');
    if (node.reqLevel > num(char.level)) throw new GameError('LEVEL_TOO_LOW', `Gerekli seviye: ${node.reqLevel}`);
    if (node.req && !(lo.tree[node.req] > 0)) throw new GameError('PREREQ', 'Önce önceki düğümü aç.');
    if ((lo.tree[nodeId] || 0) >= node.maxRank) throw new GameError('MAX_RANK', 'Düğüm en üst seviyede.');
    lo.tree[nodeId] = (lo.tree[nodeId] || 0) + 1;
    await ctx.q('update character_loadouts set tree=$3::jsonb where character_id=$1 and idx=$2', [char.id, build, J(lo.tree)]);
    const session = build === num(char.active_build) ? await refreshSessionStats(ctx, char.id) : null;
    return { ok: true, tree: lo.tree, session };
  },

  async skill_reset(ctx, { characterId, build }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    await settleIfActive(ctx, char.id);
    build = Number(build);
    if (![0, 1, 2].includes(build)) throw new GameError('BAD_ARGS', 'Geçersiz build.');
    const cost = skillResetCost(num(char.level));
    await addGold(ctx, -cost, 'skill_reset', char.id);
    await ctx.q("update character_loadouts set tree='{}'::jsonb where character_id=$1 and idx=$2", [char.id, build]);
    const session = build === num(char.active_build) ? await refreshSessionStats(ctx, char.id) : null;
    return { ok: true, cost, session };
  },

  async set_loadout(ctx, { characterId, build, actives, passives, rules, name }) {
    const char = await getChar(ctx, characterId, true);
    await settleIfActive(ctx, char.id);
    build = Number(build);
    if (![0, 1, 2].includes(build)) throw new GameError('BAD_ARGS', 'Geçersiz build.');
    const lvl = num(char.level);
    const A = (Array.isArray(actives) ? actives : []).slice(0, 4).map((x) => x || null);
    const P = (Array.isArray(passives) ? passives : []).slice(0, 2).map((x) => x || null);
    const seen = new Set();
    for (const id of [...A, ...P]) {
      if (!id) continue;
      const s = SKILLS[id];
      if (!s || s.cls !== char.class) throw new GameError('BAD_SKILL', 'Geçersiz yetenek.');
      if (s.unlock > lvl) throw new GameError('LEVEL_TOO_LOW', `${s.name} ${s.unlock}. seviyede açılır.`);
      if (seen.has(id)) throw new GameError('DUPLICATE', 'Aynı yetenek iki kez seçilemez.');
      seen.add(id);
    }
    if (A.some((id) => id && SKILLS[id].passive) || P.some((id) => id && !SKILLS[id].passive)) throw new GameError('BAD_SKILL', 'Aktif/pasif yuvası uyumsuz.');
    const R2 = {};
    for (const [sid, list] of Object.entries(rules || {})) {
      if (!SKILLS[sid] || SKILLS[sid].cls !== char.class || !Array.isArray(list)) continue;
      R2[sid] = list.filter((r) => RULES[r]).slice(0, 4);
    }
    const lo = await getLoadout(ctx, char.id, build);
    await ctx.q(`update character_loadouts set actives=array(select jsonb_array_elements_text($3::jsonb)), passives=array(select jsonb_array_elements_text($4::jsonb)),
      rules=$5::jsonb, name=$6 where character_id=$1 and idx=$2`,
    [char.id, build, J(A.map((x) => x || '')), J(P.map((x) => x || '')), J({ ...lo.rules, ...R2 }), String(name || lo.name).slice(0, 24)]);
    const session = build === num(char.active_build) ? await refreshSessionStats(ctx, char.id) : null;
    return { ok: true, session };
  },

  async set_active_build(ctx, { characterId, build }) {
    const char = await getChar(ctx, characterId, true);
    build = Number(build);
    if (![0, 1, 2].includes(build)) throw new GameError('BAD_ARGS', 'Geçersiz build.');
    await settleIfActive(ctx, char.id);
    await ctx.q('update characters set active_build=$2 where id=$1', [char.id, build]);
    const session = await refreshSessionStats(ctx, char.id);
    return { ok: true, session };
  },

  // ---------------------------------------------------------------- quests
  async quest_claim(ctx, { characterId, questId }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    const r = await ctx.q("select * from character_quests where character_id=$1 and quest_id=$2 and kind='main' for update", [char.id, questId]);
    if (!r.length || r[0].state !== 'complete') throw new GameError('NOT_COMPLETE', 'Görev henüz tamamlanmadı.');
    const q = MAIN_QUEST_BY_ID[questId];
    await ctx.q("update character_quests set state='claimed' where character_id=$1 and quest_id=$2", [char.id, questId]);
    await addGold(ctx, q.reward.gold, 'quest', questId);
    const xr = applyXp(num(char.level), num(char.xp), q.reward.xp);
    await ctx.q('update characters set level=$2, xp=$3 where id=$1', [char.id, xr.level, xr.xp]);
    if (q.reward.seal) await ctx.q('update character_progress set seals = array_append(seals, $2) where character_id=$1 and not ($2 = any(seals))', [char.id, q.reward.seal]);
    // next quest in chain
    const idx = MAIN_QUESTS.findIndex((x) => x.id === questId);
    const next = MAIN_QUESTS[idx + 1];
    const prog = await getProgress(ctx, char.id);
    if (next && (next.region === q.region || prog.unlocked_regions.includes(next.region))) await ensureMainQuest(ctx, char.id, next.id, xr.level);
    if (xr.levelsGained) await progressQuests(ctx, { ...char, level: xr.level }, { zoneKills: {}, killsBy: {}, tiers: {}, bossKills: {}, eliteRegions: {}, kills: 0, level: xr.level });
    await checkAchievements(ctx);
    return { ok: true, reward: q.reward, levelsGained: xr.levelsGained, next: next?.id || null };
  },

  async contract_accept(ctx, { characterId, index }) {
    const char = await getChar(ctx, characterId, true);
    const prog = await getProgress(ctx, char.id);
    let offers = parseJson(prog.contract_offers, []);
    if (!offers.length) throw new GameError('NO_OFFER', 'Teklif yok.');
    const o = offers[Number(index)];
    if (!o) throw new GameError('BAD_ARGS', 'Geçersiz teklif.');
    const active = await ctx.q("select count(*)::int as n from character_quests where character_id=$1 and kind='contract' and state <> 'claimed'", [char.id]);
    if (num(active[0].n) >= 3) throw new GameError('TOO_MANY', 'En fazla 3 aktif kontrat alabilirsin.');
    await ctx.q("insert into character_quests (character_id, quest_id, kind, progress, target, data) values ($1,$2,'contract',0,$3,$4::jsonb)", [char.id, 'contract:' + uuid(), o.count, J(o)]);
    offers = offers.filter((_, i) => i !== Number(index));
    await ctx.q('update character_progress set contract_offers=$2::jsonb where character_id=$1', [char.id, J(offers)]);
    return { ok: true };
  },

  async contract_abandon(ctx, { characterId, questId }) {
    const char = await getChar(ctx, characterId, true);
    await ctx.q("delete from character_quests where character_id=$1 and quest_id=$2 and kind='contract' and state <> 'claimed'", [char.id, questId]);
    return { ok: true };
  },

  async contract_claim(ctx, { characterId, questId }) {
    await getProfile(ctx, true);
    const char = await getChar(ctx, characterId, true);
    const r = await ctx.q("select * from character_quests where character_id=$1 and quest_id=$2 and kind='contract' for update", [char.id, questId]);
    if (!r.length || r[0].state !== 'complete') throw new GameError('NOT_COMPLETE', 'Kontrat tamamlanmadı.');
    const o = parseJson(r[0].data, {});
    await ctx.q('delete from character_quests where character_id=$1 and quest_id=$2', [char.id, questId]);
    await addGold(ctx, o.reward.gold, 'contract', questId);
    const xr = applyXp(num(char.level), num(char.xp), o.reward.xp);
    await ctx.q('update characters set level=$2, xp=$3 where id=$1', [char.id, xr.level, xr.xp]);
    await changeMats(ctx, ACCOUNT_SCOPE, o.reward.mats || {});
    return { ok: true, reward: o.reward, levelsGained: xr.levelsGained };
  },

  async weekly_claim(ctx, { huntId }) {
    await getProfile(ctx, true);
    const h = WEEKLY_HUNTS.find((x) => x.id === huntId);
    if (!h) throw new GameError('BAD_ARGS', 'Geçersiz av.');
    const period = isoWeek(ctx.now);
    const r = await ctx.q('select * from account_weekly where user_id=$1 and period=$2 and hunt_id=$3 for update', [ctx.uid, period, huntId]);
    if (!r.length || num(r[0].progress) < h.count || r[0].claimed) throw new GameError('NOT_COMPLETE', 'Hedef tamamlanmadı veya ödül alındı.');
    await ctx.q('update account_weekly set claimed=true where user_id=$1 and period=$2 and hunt_id=$3', [ctx.uid, period, huntId]);
    const gain = { mystic_essence: 3, void_crystal: 1 };
    await changeMats(ctx, ACCOUNT_SCOPE, gain);
    await addGold(ctx, 2500, 'weekly', huntId);
    return { ok: true, reward: { gold: 2500, mats: gain } };
  },

  async achievement_claim(ctx, { achievementId }) {
    await getProfile(ctx, true);
    const a = ACHIEVEMENT_BY_ID[achievementId];
    if (!a) throw new GameError('BAD_ARGS', 'Geçersiz başarım.');
    const r = await ctx.q('select * from account_achievements where user_id=$1 and achievement_id=$2 for update', [ctx.uid, a.id]);
    if (!r.length) throw new GameError('NOT_COMPLETE', 'Başarım tamamlanmadı.');
    if (r[0].claimed_at) throw new GameError('CLAIMED', 'Ödül zaten alındı.');
    await ctx.q('update account_achievements set claimed_at=now() where user_id=$1 and achievement_id=$2', [ctx.uid, a.id]);
    await ctx.q('insert into reward_grants (user_id, grant_key, kind, payload) values ($1,$2,$3,$4::jsonb)', [ctx.uid, 'ach:' + a.id, 'achievement', J({ gold: a.gold })]);
    await addGold(ctx, a.gold, 'achievement', a.id);
    return { ok: true, gold: a.gold };
  },

  async collection(ctx) {
    const d = await ctx.q('select kind, ref_id, count, first_at from discoveries where user_id=$1', [ctx.uid]);
    const prof = await getProfile(ctx);
    const chars = await ctx.q('select c.id, c.name, p.boss_kills, p.stats, p.seals from characters c join character_progress p on p.character_id=c.id where c.user_id=$1 and c.deleted_at is null', [ctx.uid]);
    return {
      discoveries: d.map((x) => ({ kind: x.kind, id: x.ref_id, count: num(x.count) })),
      wishlist: parseJson(prof.settings, {}).wishlist || [],
      characters: chars.map((c) => ({ id: c.id, name: c.name, bossKills: parseJson(c.boss_kills, {}), stats: parseJson(c.stats, {}), seals: c.seals || [] })),
    };
  },

  async wishlist_toggle(ctx, { baseId }) {
    const prof = await getProfile(ctx, true);
    if (!BASE_BY_ID[baseId]) throw new GameError('BAD_ARGS', 'Geçersiz eşya.');
    const s = parseJson(prof.settings, {});
    const w = new Set(s.wishlist || []);
    if (w.has(baseId)) w.delete(baseId); else w.add(baseId);
    s.wishlist = [...w].slice(0, 30);
    await ctx.q('update profiles set settings=$2::jsonb where user_id=$1', [ctx.uid, J(s)]);
    return { ok: true, wishlist: s.wishlist };
  },

  async notifications_read(ctx) {
    await ctx.q('update notifications set read=true where user_id=$1 and not read', [ctx.uid]);
    return { ok: true };
  },

  // ---------------------------------------------------------------- MARKET (real players)
  async market_list(ctx, { itemId, price, hours }) {
    const prof = await getProfile(ctx, true);
    price = Math.floor(Number(price));
    hours = Number(hours);
    if (!(price >= BALANCE.MARKET_MIN_PRICE && price <= BALANCE.MARKET_MAX_PRICE)) throw new GameError('BAD_PRICE', `Fiyat ${BALANCE.MARKET_MIN_PRICE} - ${BALANCE.MARKET_MAX_PRICE} arasında olmalı.`);
    if (!BALANCE.MARKET_DURATIONS_H.includes(hours)) throw new GameError('BAD_DURATION', 'Süre 12, 24 veya 48 saat olmalı.');
    await expireListings(ctx);
    const it = await getItem(ctx, itemId);
    if (!['bag', 'stash', 'overflow'].includes(it.location)) throw new GameError('BAD_LOCATION', 'Önce eşyayı çıkar.');
    if (!it.tradeable || it.bound_character) throw new GameError('NOT_TRADEABLE', 'Bu eşya ticarete kapalı (sistem ödülü).');
    if (it.locked) throw new GameError('LOCKED', 'Kilitli eşya pazara konamaz. Önce kilidi aç.');
    if (it.pending_polish) throw new GameError('PENDING_POLISH', 'Önce bekleyen cila sonucunu seç.');
    const act = await ctx.q("select count(*)::int as n from market_listings where seller_user=$1 and status='active'", [ctx.uid]);
    if (num(act[0].n) >= BALANCE.MARKET_MAX_ACTIVE) throw new GameError('TOO_MANY_LISTINGS', `En fazla ${BALANCE.MARKET_MAX_ACTIVE} aktif ilan.`);
    const { listingFee } = marketFees(price);
    const base = BASE_BY_ID[it.base_id];
    const listingId = uuid();
    await addGold(ctx, -listingFee, 'market_fee', listingId);
    await ctx.q("update item_instances set location='market', character_id=null, equip_slot=null, updated_at=now() where id=$1", [it.id]);
    await invLog(ctx, it.id, 'market_escrow', it.location, 'market', listingId);
    const snap = { base_id: it.base_id, rarity: it.rarity, item_level: it.item_level, upgrade: it.upgrade, affixes: it.affixes, reforge_count: it.reforge_count, polish_count: it.polish_count };
    await ctx.q(`insert into market_listings (id, seller_user, seller_name, item_id, price, listing_fee, expires_at, item_snapshot, base_id, slot, class_req, rarity, item_level, upgrade, affix_ids)
      values ($1,$2,$3,$4,$5,$6,to_timestamp($7/1000.0),$8::jsonb,$9,$10,$11,$12,$13,$14,array(select jsonb_array_elements_text($15::jsonb)))`,
    [listingId, ctx.uid, prof.display_name, it.id, price, listingFee, ctx.now + hours * 3600000, J(snap), it.base_id, base.slot, base.anyClass ? null : base.classes ? base.classes[0] : null, it.rarity, it.item_level, it.upgrade, J(it.affixes.map((a) => a.id))]);
    return { ok: true, listingId, fee: listingFee, gold: await gold(ctx) };
  },

  async market_cancel(ctx, { listingId }) {
    await getProfile(ctx, true);
    const r = await ctx.q('select * from market_listings where id=$1 for update', [listingId]);
    if (!r.length || r[0].seller_user !== ctx.uid) throw new GameError('NO_LISTING', 'İlan bulunamadı.');
    if (r[0].status !== 'active') throw new GameError('NOT_ACTIVE', 'İlan artık aktif değil.');
    await ctx.q("update market_listings set status='cancelled', closed_at=to_timestamp($2/1000.0) where id=$1", [listingId, ctx.now]);
    await ctx.q("select id from item_instances where id=$1 and location='market' for update", [r[0].item_id]);
    const to = await placeInStash(ctx, r[0].item_id, 'market', 'cancel:' + listingId);
    return { ok: true, returnedTo: to };
  },

  // Atomic purchase between two real accounts.
  async market_buy(ctx, { listingId }) {
    const buyer = await getProfile(ctx, true);
    if (typeof listingId !== 'string') throw new GameError('BAD_ARGS', 'İlan gerekli.');
    const r = await ctx.q('select *, (extract(epoch from expires_at)*1000)::float8 as exp_ms from market_listings where id=$1 for update', [listingId]);
    if (!r.length) throw new GameError('NO_LISTING', 'İlan bulunamadı.');
    const L = r[0];
    if (L.status !== 'active') throw new GameError('NOT_ACTIVE', 'Bu ilan artık satışta değil.');
    if (num(L.exp_ms) < ctx.now) throw new GameError('EXPIRED', 'İlanın süresi dolmuş.');
    if (L.seller_user === ctx.uid) throw new GameError('OWN_LISTING', 'Kendi ilanını satın alamazsın.');
    const it = await ctx.q('select * from item_instances where id=$1 for update', [L.item_id]);
    if (!it.length || it[0].location !== 'market' || it[0].owner_user !== L.seller_user) throw new GameError('ESCROW_MISMATCH', 'Eşya emanette değil.');
    const price = num(L.price);
    const { commission } = marketFees(price);
    // lock wallets in a stable order to avoid deadlocks between crossing purchases
    const ids = [ctx.uid, L.seller_user].sort();
    await ctx.q('select user_id from account_wallets where user_id = any(array[$1::uuid,$2::uuid]) order by user_id for update', ids);
    await addGold(ctx, -price, 'market_buy', listingId, ctx.uid);
    await addGold(ctx, price - commission, 'market_sale', listingId, L.seller_user);
    // transfer item ownership (all properties & unique id preserved)
    const to = await placeInStash(ctx, L.item_id, 'market', 'buy:' + listingId, ctx.uid);
    await ctx.q('update item_instances set locked=false where id=$1', [L.item_id]);
    await ctx.q("update market_listings set status='sold', buyer_user=$2, closed_at=to_timestamp($3/1000.0) where id=$1", [listingId, ctx.uid, ctx.now]);
    await ctx.q('insert into market_transactions (listing_id, item_id, buyer_user, seller_user, price, commission) values ($1,$2,$3,$4,$5,$6)', [listingId, L.item_id, ctx.uid, L.seller_user, price, commission]);
    await ctx.q('insert into notifications (user_id, kind, payload) values ($1,$2,$3::jsonb)', [L.seller_user, 'market_sold', J({ listingId, base_id: L.base_id, price, net: price - commission, buyer: buyer.display_name })]);
    await discover(ctx, 'item', L.base_id);
    if (BASE_BY_ID[L.base_id]?.unique) await discover(ctx, 'unique', L.base_id);
    await bumpStats(ctx, { market_buys: 1 });
    // seller stats (direct update; seller's profile row is not otherwise touched here)
    await ctx.q("update profiles set stats = jsonb_set(stats, '{market_sales}', to_jsonb(coalesce((stats->>'market_sales')::int,0)+1)) where user_id=$1", [L.seller_user]);
    await checkAchievements(ctx);
    return { ok: true, itemId: L.item_id, price, location: to, gold: await gold(ctx) };
  },

  async market_search(ctx, f = {}) {
    await expireListings(ctx);
    const where = ["status='active'"];
    const p = [];
    const add = (sql, v) => { p.push(v); where.push(sql.replace('?', '$' + p.length)); };
    if (f.cls) add('(class_req = ? or class_req is null)', f.cls);
    if (f.rarity != null && f.rarity !== '') add('rarity >= ?', Number(f.rarity));
    if (f.minLevel) add('item_level >= ?', Number(f.minLevel));
    if (f.maxLevel) add('item_level <= ?', Number(f.maxLevel));
    if (f.slot) add('slot = ?', String(f.slot));
    if (f.affix) add('? = any(affix_ids)', String(f.affix));
    if (f.minPrice) add('price >= ?', Number(f.minPrice));
    if (f.maxPrice) add('price <= ?', Number(f.maxPrice));
    if (f.mine) add('seller_user = ?', ctx.uid);
    const order = { price_asc: 'price asc', price_desc: 'price desc', level_desc: 'item_level desc', new: 'created_at desc', rarity_desc: 'rarity desc, price asc' }[f.sort] || 'created_at desc';
    const page = Math.max(0, Number(f.page) | 0);
    p.push(30, page * 30);
    const rows = await ctx.q(`select * from market_listings where ${where.join(' and ')} order by ${order} limit $${p.length - 1} offset $${p.length}`, p);
    const mine = await ctx.q("select count(*)::int as n from market_listings where seller_user=$1 and status='active'", [ctx.uid]);
    return { listings: rows.map(listingRow), myActive: num(mine[0].n), page };
  },

  async market_history(ctx) {
    await expireListings(ctx);
    const mine = await ctx.q('select * from market_listings where seller_user=$1 order by created_at desc limit 50', [ctx.uid]);
    const bought = await ctx.q('select l.*, t.price as paid from market_transactions t join market_listings l on l.id=t.listing_id where t.buyer_user=$1 order by t.created_at desc limit 50', [ctx.uid]);
    return { myListings: mine.map(listingRow), purchases: bought.map(listingRow) };
  },
};

function salvageYield(item, seed) {
  const rng = RNG.makeRng(seed >>> 0);
  const out = {};
  for (const [m, a, b] of SALVAGE_YIELD[item.rarity]) out[m] = (out[m] || 0) + RNG.int(rng, a, b);
  if (item.upgrade >= 2) out.mystic_essence = (out.mystic_essence || 0) + Math.floor(item.upgrade / 2);
  return out;
}

export { HANDLERS, MUTATING, READ };
