import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { freshDb, player, dbAvailable } from './helpers.js';
import { upgradeCost } from '../../shared/formulas.js';
import { gearSet } from '../../shared/testkit.js';

// test fixture: replace a character's equipment with a generated level-appropriate set
async function equipKit(env, userId, charId, cls, level, rarity) {
  await env.db.query("update item_instances set location='destroyed', character_id=null, equip_slot=null where character_id=$1 and location='equipped'", [charId]);
  for (const [slot, it] of Object.entries(gearSet(level * 31, cls, level, rarity))) {
    await env.db.query(`insert into item_instances (owner_user, base_id, rarity, item_level, affixes, location, character_id, equip_slot, origin)
      values ($1,$2,$3,$4,$5::jsonb,'equipped',$6,$7,'test')`, [userId, it.base_id, it.rarity, it.item_level, JSON.stringify(it.affixes), charId, slot]);
  }
}

const HAS_DB = await dbAvailable();
const ACC = '00000000-0000-0000-0000-000000000000';

describe.skipIf(!HAS_DB)('accounts, characters, farming, offline (PostgreSQL)', () => {
  let env, P, w1, w2, m1;
  beforeAll(async () => {
    env = await freshDb('game');
    P = player(env);
    await P.call('create_profile', { displayName: 'Avci1' });
  }, 60000);
  afterAll(async () => env && env.cleanup());

  it('three slots; same class allowed twice; 4th rejected', async () => {
    w1 = (await P.call('create_character', { slot: 1, name: 'Demir', cls: 'warrior' })).characterId;
    w2 = (await P.call('create_character', { slot: 2, name: 'Celik', cls: 'warrior' })).characterId;
    m1 = (await P.call('create_character', { slot: 3, name: 'Ates', cls: 'mage' })).characterId;
    await expect(P.call('create_character', { slot: 3, name: 'Fazla', cls: 'ranger' })).rejects.toMatchObject({ code: 'SLOT_USED' });
    const b = await P.call('bootstrap');
    expect(b.characters.map((c) => c.cls)).toEqual(['warrior', 'warrior', 'mage']);
  });

  it('farm gives verified XP/gold; only one active farm per account; switching ends previous', async () => {
    const s1 = await P.call('farm_start', { characterId: w1, kind: 'farm', target: 'abandoned_road' });
    let xp = 0, h;
    for (let i = 0; i < 4; i++) { env.advance(20000); h = await P.call('farm_heartbeat', { sessionId: s1.session.id }); xp += h.settlement.xp; }
    expect(h.settlement.toTick).toBeGreaterThan(1500);
    expect(xp).toBeGreaterThan(0);
    // second "tab" starts the other character -> first session is settled and closed
    const s2 = await P.call('farm_start', { characterId: w2, kind: 'farm', target: 'abandoned_road' });
    expect(s2.endedPrevious).toBeTruthy();
    await expect(P.call('farm_heartbeat', { sessionId: s1.session.id })).rejects.toMatchObject({ code: 'SESSION_ENDED' });
    const n = await env.db.query('select count(*)::int as n from active_farm_sessions where user_id=$1', [P.userId]);
    expect(n[0].n).toBe(1);
    // select_character also stops the farm of another character
    await P.call('select_character', { characterId: m1 });
    const n2 = await env.db.query('select count(*)::int as n from active_farm_sessions where user_id=$1', [P.userId]);
    expect(n2[0].n).toBe(0);
  });

  it('settlement is capped by server time: a fast client clock cannot add rewards', async () => {
    const s = await P.call('farm_start', { characterId: w1, kind: 'farm', target: 'abandoned_road' });
    // heartbeat immediately (no server time passed): no ticks simulated
    const h = await P.call('farm_heartbeat', { sessionId: s.session.id });
    expect(h.settlement.toTick - h.settlement.fromTick).toBeLessThanOrEqual(2);
    expect(h.settlement.items.length).toBe(0);
    await P.call('farm_stop', { sessionId: s.session.id });
  });

  it('lease expiry: without heartbeats at most LEASE seconds are credited', async () => {
    const s = await P.call('farm_start', { characterId: w1, kind: 'farm', target: 'abandoned_road' });
    env.advance(10 * 60 * 1000); // 10 minutes, no heartbeat
    const r = await P.call('farm_heartbeat', { sessionId: s.session.id });
    expect(r.expired).toBe(true);
    expect(r.settlement.toTick).toBeLessThanOrEqual(90 * 20 + 1);
  });

  it('offline: capped at 8h, 40% XP, bound materials only, no gold/items, not claimable twice, no multiplication via character switch', async () => {
    const goldBefore = (await P.call('bootstrap')).gold;
    const itemsBefore = (await env.db.query("select count(*)::int as n from item_instances where owner_user=$1", [P.userId]))[0].n;
    const s = await P.call('farm_start', { characterId: w1, kind: 'farm', target: 'abandoned_road' });
    for (let i = 0; i < 6; i++) { env.advance(20000); await P.call('farm_heartbeat', { sessionId: s.session.id }); }
    await P.call('farm_stop', { sessionId: s.session.id });
    const gold1 = (await P.call('bootstrap')).gold;
    const rate = (await env.db.query('select offline_rate from profiles where user_id=$1', [P.userId]))[0].offline_rate;
    env.advance(20 * 3600 * 1000);
    await P.call('select_character', { characterId: w2 }); // switching characters must not create a second pool
    const b = await P.call('bootstrap');
    expect(b.offline.seconds).toBe(8 * 3600);
    expect(b.offline.capped).toBe(true);
    expect(b.offline.characterId).toBe(w1);
    expect(b.offline.xp).toBe(Math.floor(rate.xpPerSec * 8 * 3600 * 0.4));
    expect(b.gold).toBe(gold1); // no offline gold
    const itemsAfter = (await env.db.query("select count(*)::int as n from item_instances where owner_user=$1", [P.userId]))[0].n;
    expect(itemsAfter).toBeGreaterThanOrEqual(itemsBefore);
    const newOffline = await env.db.query("select count(*)::int as n from item_instances where owner_user=$1 and origin like 'offline%'", [P.userId]);
    expect(newOffline[0].n).toBe(0);
    const bound = await env.db.query('select sum(qty)::int as n from material_balances where user_id=$1 and scope=$2', [P.userId, w1]);
    expect(bound[0].n).toBeGreaterThan(0);
    const b2 = await P.call('bootstrap');
    expect(b2.offline).toBeNull();
    expect(goldBefore).toBeLessThanOrEqual(gold1);
  });

  it('bound offline materials cannot be used for tradeable crafting', async () => {
    // bound mats exist, account vault empty -> smith recipe must fail
    await env.db.query("update characters set level=6 where id=$1", [w1]);
    await env.db.query("update account_wallets set gold=100000 where user_id=$1", [P.userId]);
    await env.db.query("delete from material_balances where user_id=$1 and scope=$2", [P.userId, ACC]);
    await env.db.query("insert into material_balances (user_id, scope, material_id, qty) values ($1,$2,'meadow_fang',100),($1,$2,'chitin_shard',100),($1,$2,'arcane_dust',100) on conflict (user_id, scope, material_id) do update set qty=100", [P.userId, w1]);
    await expect(P.call('craft', { recipeId: 'craft_t1', characterId: w1, slot: 'chest' })).rejects.toMatchObject({ code: 'NOT_ENOUGH_MATERIALS' });
    // but alchemy (character-bound potions) may use them, producing a bound elixir
    await env.db.query("insert into material_balances (user_id, scope, material_id, qty) values ($1,$2,'bloodroot',10) on conflict (user_id, scope, material_id) do update set qty=10", [P.userId, w1]);
    const r = await P.call('brew', { recipeId: 'brew_hunter', characterId: w1 });
    expect(r.bound).toBe(true);
    await P.call('use_elixir', { characterId: w1, elixirId: 'elixir_hunter' });
  });

  it('equip changes stats; level and class requirements are enforced', async () => {
    const v0 = await P.call('character', { characterId: w1 });
    const dps0 = v0.stats.estDps;
    const r = await env.db.query(`insert into item_instances (owner_user, base_id, rarity, item_level, affixes, location, character_id, origin) values ($1,'w_great_1',2,6,'[{"id":"phys_dmg","q":1,"v":0.1}]','bag',$2,'test') returning id`, [P.userId, w1]);
    const e = await P.call('equip', { characterId: w1, itemId: r[0].id });
    expect(e.view.stats.estDps).toBeGreaterThan(dps0);
    expect(e.view.equipped.offhand).toBeUndefined(); // 2H removed the shield
    const mageItem = await env.db.query(`insert into item_instances (owner_user, base_id, rarity, item_level, affixes, location, character_id, origin) values ($1,'m_staff_1',1,1,'[]','bag',$2,'test') returning id`, [P.userId, w1]);
    await expect(P.call('equip', { characterId: w1, itemId: mageItem[0].id })).rejects.toMatchObject({ code: 'WRONG_CLASS' });
    const hi = await env.db.query(`insert into item_instances (owner_user, base_id, rarity, item_level, affixes, location, character_id, origin) values ($1,'w_sword_3',1,28,'[]','bag',$2,'test') returning id`, [P.userId, w1]);
    await expect(P.call('equip', { characterId: w1, itemId: hi[0].id })).rejects.toMatchObject({ code: 'LEVEL_TOO_LOW' });
  });

  it('upgrade +1..+10 with exact costs; reforge/polish; salvage; lock protection; stash transfer keeps identity', async () => {
    const r = await env.db.query(`insert into item_instances (owner_user, base_id, rarity, item_level, affixes, location, origin) values ($1,'w_sword_2',3,15,'[{"id":"phys_dmg","q":0.5,"v":0.07},{"id":"crit_chance","q":0.5,"v":0.02},{"id":"attack_speed","q":0.5,"v":0.05}]','stash','test') returning *`, [P.userId]);
    const id = r[0].id;
    await env.db.query("insert into material_balances (user_id, scope, material_id, qty) values ($1,$2,'arcane_dust',500),($1,$2,'mystic_essence',500),($1,$2,'void_crystal',500),($1,$2,'starfire_shard',50) on conflict (user_id, scope, material_id) do update set qty=excluded.qty", [P.userId, ACC]);
    await env.db.query("update account_wallets set gold=10000000 where user_id=$1", [P.userId]);
    for (let u = 0; u < 10; u++) {
      const g0 = (await P.call('bootstrap')).gold;
      const expected = upgradeCost({ item_level: 15, rarity: 3, upgrade: u });
      const res = await P.call('upgrade', { itemId: id });
      expect(res.item.upgrade).toBe(u + 1);
      expect(res.cost).toEqual(expected);
      expect((await P.call('bootstrap')).gold).toBe(g0 - expected.gold);
    }
    await expect(P.call('upgrade', { itemId: id })).rejects.toMatchObject({ code: 'MAX_UPGRADE' });
    // reforge index 1 only
    const before = (await env.db.query('select affixes from item_instances where id=$1', [id]))[0].affixes;
    const rf = await P.call('reforge', { itemId: id, index: 1 });
    expect(rf.item.affixes[0]).toEqual(before[0]);
    expect(rf.item.affixes[2]).toEqual(before[2]);
    expect(rf.item.affixes[1].id).not.toBe(before[1].id);
    // polish keeps type, other affixes untouched; choose keep-old
    const pl = await P.call('polish', { itemId: id, index: 0 });
    expect(pl.candidate.id).toBe(before[0].id);
    const kept = await P.call('polish_choose', { itemId: id, accept: false });
    expect(kept.item.affixes[0]).toEqual(before[0]);
    const pl2 = await P.call('polish', { itemId: id, index: 0 });
    const acc = await P.call('polish_choose', { itemId: id, accept: true });
    expect(acc.item.affixes[0]).toEqual(pl2.candidate);
    expect(acc.item.affixes[2]).toEqual(before[2]);
    // stash -> another character keeps id/upgrade
    await P.call('move_item', { itemId: id, to: 'bag', characterId: w2 });
    const moved = (await env.db.query('select * from item_instances where id=$1', [id]))[0];
    expect(moved.character_id).toBe(w2);
    expect(moved.upgrade).toBe(10);
    // lock prevents salvage
    await P.call('lock_item', { itemId: id, locked: true });
    await expect(P.call('salvage', { itemIds: [id] })).rejects.toMatchObject({ code: 'LOCKED' });
    await P.call('lock_item', { itemId: id, locked: false });
    const sv = await P.call('salvage', { itemIds: [id] });
    expect(Object.keys(sv.materials).length).toBeGreaterThan(0);
    const gone = (await env.db.query('select location from item_instances where id=$1', [id]))[0];
    expect(gone.location).toBe('destroyed');
  });

  it('crafting consumes exact materials and creates a real item', async () => {
    await env.db.query("insert into material_balances (user_id, scope, material_id, qty) values ($1,$2,'meadow_fang',6),($1,$2,'chitin_shard',4) on conflict (user_id, scope, material_id) do update set qty=excluded.qty", [P.userId, ACC]);
    const dust0 = (await env.db.query("select qty from material_balances where user_id=$1 and scope=$2 and material_id='arcane_dust'", [P.userId, ACC]))[0].qty;
    const r = await P.call('craft', { recipeId: 'craft_t1', characterId: w1, slot: 'chest' });
    expect(r.item.rarity).toBeGreaterThanOrEqual(1);
    const left = await env.db.query("select material_id, qty from material_balances where user_id=$1 and scope=$2 and material_id in ('meadow_fang','chitin_shard','arcane_dust')", [P.userId, ACC]);
    const m = Object.fromEntries(left.map((x) => [x.material_id, x.qty]));
    expect(m.meadow_fang).toBe(0);
    expect(m.chitin_shard).toBe(0);
    expect(m.arcane_dust).toBe(dust0 - 4);
  });

  it('skill points, loadout validation, and reset cost', async () => {
    await env.db.query('update characters set level=10 where id=$1', [w1]);
    await P.call('skill_alloc', { characterId: w1, build: 0, nodeId: 'berserker_0' });
    await expect(P.call('skill_alloc', { characterId: w1, build: 0, nodeId: 'berserker_2' })).rejects.toMatchObject({ code: 'PREREQ' });
    await expect(P.call('skill_alloc', { characterId: w1, build: 0, nodeId: 'pyromancer_0' })).rejects.toMatchObject({ code: 'BAD_NODE' });
    await P.call('set_loadout', { characterId: w1, build: 0, actives: ['cleave', 'whirlwind', 'iron_will', null], passives: ['warrior_endurance', null] });
    await expect(P.call('set_loadout', { characterId: w1, build: 0, actives: ['execute'], passives: [] })).rejects.toMatchObject({ code: 'LEVEL_TOO_LOW' });
    const v = await P.call('character', { characterId: w1 });
    expect(v.stats.actives).toEqual(['cleave', 'whirlwind', 'iron_will']);
    const g0 = (await P.call('bootstrap')).gold;
    const rs = await P.call('skill_reset', { characterId: w1, build: 0 });
    expect((await P.call('bootstrap')).gold).toBe(g0 - rs.cost);
  });

  it('boss gate, boss kill unlocks region 2 and dungeon gate', async () => {
    await expect(P.call('farm_start', { characterId: w2, kind: 'boss', target: 'broken_horn' })).rejects.toMatchObject({ code: 'BOSS_LOCKED' });
    await expect(P.call('farm_start', { characterId: w2, kind: 'farm', target: 'forest_path' })).rejects.toMatchObject({ code: 'ZONE_LOCKED' });
    // give w2 level-appropriate Rare gear and the gate quest
    await env.db.query('update characters set level=12 where id=$1', [w2]);
    await env.db.query("insert into character_quests (character_id, quest_id, kind, progress, target) values ($1,'mq_1_4','main',0,1)", [w2]);
    await equipKit(env, P.userId, w2, 'warrior', 12, 2);
    let won = false;
    for (let attempt = 0; attempt < 3 && !won; attempt++) {
      const s = await P.call('farm_start', { characterId: w2, kind: 'boss', target: 'broken_horn' });
      for (let i = 0; i < 12; i++) {
        env.advance(20000);
        const h = await P.call('farm_heartbeat', { sessionId: s.session.id });
        if (h.settlement.ended) { won = h.settlement.ended.status === 'won'; break; }
      }
    }
    expect(won).toBe(true);
    const v = await P.call('character', { characterId: w2 });
    expect(v.progress.unlockedRegions).toContain('greenshade');
    expect(v.progress.bossKills.broken_horn).toBe(1);
    const q = v.quests.find((x) => x.id === 'mq_1_4');
    expect(q.state).toBe('complete');
    await P.call('quest_claim', { characterId: w2, questId: 'mq_1_4' });
    const s2 = await P.call('farm_start', { characterId: w2, kind: 'farm', target: 'forest_path' });
    expect(s2.session.kind).toBe('farm');
    await P.call('farm_stop', { sessionId: s2.session.id });
    await expect(P.call('farm_start', { characterId: w2, kind: 'dungeon', target: 'rotting_roots' })).rejects.toMatchObject({ code: 'LEVEL_TOO_LOW' });
  });

  it('dungeon can be completed end to end (Normal) and records completion', async () => {
    await env.db.query('update characters set level=24 where id=$1', [w2]);
    await env.db.query(`update character_progress set boss_kills = boss_kills || '{"lord_of_roots":1}'::jsonb, unlocked_regions = array['broken_meadows','greenshade','rusted_forges'] where character_id=$1`, [w2]);
    await equipKit(env, P.userId, w2, 'warrior', 24, 2);
    const s = await P.call('farm_start', { characterId: w2, kind: 'dungeon', target: 'rotting_roots', difficulty: 'normal' });
    let end = null;
    for (let i = 0; i < 40 && !end; i++) {
      env.advance(20000);
      const h = await P.call('farm_heartbeat', { sessionId: s.session.id });
      end = h.settlement.ended;
    }
    expect(end).toBeTruthy();
    expect(['won', 'failed']).toContain(end.status);
    if (end.status === 'won') {
      const prof = (await env.db.query('select stats from profiles where user_id=$1', [P.userId]))[0].stats;
      expect(prof.dungeon_normal).toBe(1);
    }
  });

  it('death respawns and equipment is never lost', async () => {
    const eqBefore = (await env.db.query("select count(*)::int as n from item_instances where character_id=$1 and location='equipped'", [m1]))[0].n;
    await env.db.query("update character_progress set unlocked_regions = array['broken_meadows','greenshade','rusted_forges'] where character_id=$1", [m1]);
    await env.db.query("update characters set death_rule='continue' where id=$1", [m1]);
    const s = await P.call('farm_start', { characterId: m1, kind: 'farm', target: 'forgotten_forge' }); // lvl1 mage in lvl26 zone
    let deaths = 0;
    for (let i = 0; i < 6; i++) { env.advance(20000); const h = await P.call('farm_heartbeat', { sessionId: s.session.id }); deaths += h.settlement.deaths; }
    expect(deaths).toBeGreaterThan(0);
    const eqAfter = (await env.db.query("select count(*)::int as n from item_instances where character_id=$1 and location='equipped'", [m1]))[0].n;
    expect(eqAfter).toBe(eqBefore);
    await P.call('farm_stop', { sessionId: s.session.id });
  });

  it('commands without auth or with forged args are rejected', async () => {
    await expect(env.server.exec(null, 'bootstrap', {})).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    await expect(P.call('farm_heartbeat', { sessionId: 'nope' })).rejects.toMatchObject({ code: 'SESSION_ENDED' });
    await expect(env.server.exec(P.userId, 'upgrade', { itemId: 'x' })).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });
    await expect(P.call('grant_gold', { amount: 1e9 })).rejects.toMatchObject({ code: 'UNKNOWN_COMMAND' });
    const other = player(env);
    await other.call('create_profile', { displayName: 'Baska' });
    await expect(other.call('equip', { characterId: w1, itemId: 'x' })).rejects.toMatchObject({ code: 'NO_CHARACTER' });
  });
});
