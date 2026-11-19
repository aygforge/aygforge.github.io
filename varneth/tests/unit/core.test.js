import { describe, it, expect } from 'vitest';
import * as R from '../../shared/rng.js';
import { BASES, RANDOM_BASES, UNIQUE_BASES, SET_BASES, SLOTS, FAMILIES, BASE_BY_ID } from '../../shared/data/items.js';
import { ENEMIES } from '../../shared/data/enemies.js';
import { REGIONS, DUNGEONS } from '../../shared/data/regions.js';
import { RARITIES, maxRarityForLevel } from '../../shared/data/rarities.js';
import { SKILLS, TREES, CLASS_SKILLS } from '../../shared/data/skills.js';
import { MAIN_QUESTS, CONTRACT_TEMPLATES, ACHIEVEMENTS } from '../../shared/data/quests.js';
import { applyXp, xpToNext, upgradeCost, marketFees, armorReduction, scale } from '../../shared/formulas.js';
import { generateItem, rollEquipmentDrop, reforgeAffix, polishAffix, affixPool } from '../../shared/loot.js';
import { deriveStats } from '../../shared/stats.js';
import { createSim, run, step, snapshot, restore, takeAcc } from '../../shared/combat/sim.js';
import { makeStats, gearSet, autoLoadout } from '../../shared/testkit.js';
import { BALANCE } from '../../shared/data/balance.js';

describe('content requirements', () => {
  it('≥60 base items, 11 slots, sets and uniques', () => {
    expect(BASES.length).toBeGreaterThanOrEqual(60);
    expect(SLOTS.length).toBe(11);
    expect(SET_BASES.length).toBe(12);
    expect(UNIQUE_BASES.length).toBeGreaterThanOrEqual(6);
    for (const cls of ['warrior', 'ranger', 'mage']) {
      const n = RANDOM_BASES.filter((b) => !b.classes || b.classes.includes(cls)).length;
      expect(n).toBeGreaterThan(20);
    }
  });
  it('7 rarities, ≥9 normal enemies, 3 elites, champions, 3 bosses + dungeon boss', () => {
    expect(RARITIES.length).toBe(7);
    const tiers = Object.values(ENEMIES).reduce((m, e) => ((m[e.tier] = (m[e.tier] || 0) + 1), m), {});
    expect(tiers.normal).toBeGreaterThanOrEqual(9);
    expect(tiers.elite).toBeGreaterThanOrEqual(3);
    expect(tiers.champion).toBeGreaterThanOrEqual(3);
    expect(tiers.boss).toBeGreaterThanOrEqual(4);
    const sprites = new Set(Object.values(ENEMIES).map((e) => e.sprite));
    expect(sprites.size).toBe(Object.keys(ENEMIES).length); // no recolored duplicates
  });
  it('10 regions with 3 playable, 6 farm zones, 1 dungeon with 2+ difficulties', () => {
    expect(REGIONS.length).toBe(10);
    expect(REGIONS.filter((r) => r.available).length).toBe(3);
    expect(REGIONS.flatMap((r) => r.zones).length).toBe(6);
    const D = DUNGEONS.rotting_roots;
    expect(D.stages.length).toBe(6);
    expect(Object.keys(D.difficulties)).toEqual(expect.arrayContaining(['normal', 'heroic']));
  });
  it('6 actives + 3 passives per class, 3 trees × 8 nodes', () => {
    for (const c of ['warrior', 'ranger', 'mage']) {
      expect(CLASS_SKILLS[c].actives.length).toBe(6);
      expect(CLASS_SKILLS[c].passives.length).toBe(3);
      const t = TREES.filter((x) => x.cls === c);
      expect(t.length).toBe(3);
      for (const tr of t) expect(tr.nodes.length).toBe(8);
    }
  });
  it('quests: 3-4 main per region, ≥12 contracts, ≥20 achievements', () => {
    for (const r of REGIONS.filter((x) => x.available)) {
      const n = MAIN_QUESTS.filter((q) => q.region === r.id).length;
      expect(n).toBeGreaterThanOrEqual(3); expect(n).toBeLessThanOrEqual(4);
    }
    expect(CONTRACT_TEMPLATES.length).toBeGreaterThanOrEqual(12);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
  });
});

describe('formulas', () => {
  it('xp curve grows and caps at Alpha level 30 without banking', () => {
    for (let L = 1; L < 99; L++) expect(xpToNext(L + 1)).toBeGreaterThan(xpToNext(L));
    const r = applyXp(29, 0, 1e12);
    expect(r.level).toBe(30);
    expect(r.xp).toBe(0);
    expect(applyXp(30, 0, 5000).level).toBe(30);
  });
  it('upgrade costs rise monotonically and stop at +10', () => {
    let prev = 0;
    for (let u = 0; u < 10; u++) { const c = upgradeCost({ item_level: 20, rarity: 2, upgrade: u }); expect(c.gold).toBeGreaterThan(prev); prev = c.gold; }
    expect(upgradeCost({ item_level: 20, rarity: 2, upgrade: 10 })).toBeNull();
  });
  it('market fees 2% listing, 5% commission', () => {
    expect(marketFees(1000)).toEqual({ listingFee: 20, commission: 50 });
  });
  it('armor mitigation capped at 75%', () => {
    expect(armorReduction(1e9, 1)).toBe(0.75);
    expect(armorReduction(0, 10)).toBe(0);
    expect(scale(30)).toBeGreaterThan(scale(10));
  });
});

describe('loot', () => {
  it('same base produces different affixes; affix groups never conflict', () => {
    const rng = R.makeRng(42);
    const a = generateItem(rng, 'w_sword_2', 15, 3);
    const b = generateItem(rng, 'w_sword_2', 15, 3);
    expect(a.affixes.length).toBe(3);
    expect(JSON.stringify(a.affixes)).not.toBe(JSON.stringify(b.affixes));
    for (let i = 0; i < 300; i++) {
      const it = generateItem(rng, R.pick(rng, RANDOM_BASES).id, 25, 4);
      const ids = it.affixes.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.includes('phys_dmg') && ids.includes('spell_dmg')).toBe(false);
      const base = BASE_BY_ID[it.base_id];
      if (base.classes?.[0] === 'mage') expect(ids).not.toContain('phys_dmg');
      if (base.classes?.[0] === 'warrior') expect(ids).not.toContain('spell_dmg');
    }
  });
  it('no Mythic/Ancient drops in Alpha level ranges; low levels capped', () => {
    const rng = R.makeRng(7);
    let maxSeen = 0;
    for (let i = 0; i < 20000; i++) {
      const lvl = 1 + (i % 30);
      const it = rollEquipmentDrop(rng, { level: lvl, tier: i % 50 === 0 ? 'boss' : 'normal', region: 'broken_meadows', lootBonus: 0.5 });
      maxSeen = Math.max(maxSeen, it.rarity);
      expect(it.rarity).toBeLessThanOrEqual(maxRarityForLevel(lvl, true));
    }
    expect(maxSeen).toBeLessThanOrEqual(4);
    expect(maxRarityForLevel(3)).toBe(2);
  });
  it('reforge changes only the chosen affix to a different valid one; polish keeps type', () => {
    const rng = R.makeRng(9);
    const it = generateItem(rng, 'r_bow_2', 18, 4);
    const na = reforgeAffix(rng, it, 1);
    expect(na.id).not.toBe(it.affixes[1].id);
    expect(it.affixes.filter((_, i) => i !== 1).map((a) => a.id)).not.toContain(na.id);
    const pa = polishAffix(rng, it, 2);
    expect(pa.id).toBe(it.affixes[2].id);
    expect(affixPool(BASE_BY_ID['r_bow_2'], []).length).toBeGreaterThan(5);
  });
});

describe('stats', () => {
  it('caps crit, lifesteal, attack speed and evasion', () => {
    const affixes = [{ id: 'crit_chance', v: 5 }, { id: 'lifesteal', v: 5 }, { id: 'attack_speed', v: 9 }, { id: 'evasion', v: 9 }];
    const eq = {};
    for (const s of ['ring1', 'ring2', 'amulet']) eq[s] = { base_id: s === 'amulet' ? 'amulet_1' : 'ring_1', item_level: 10, rarity: 2, upgrade: 0, affixes };
    const st = deriveStats({ cls: 'ranger', level: 10, equipped: eq, loadout: autoLoadout('ranger', 10) });
    expect(st.critChance).toBe(BALANCE.CAPS.critChance);
    expect(st.lifesteal).toBe(BALANCE.CAPS.lifesteal);
    expect(st.evasion).toBe(BALANCE.CAPS.evasion);
    expect(st.attackSpeed).toBe(BALANCE.CAPS.attackSpeedBonus);
  });
  it('better gear raises damage; two-handed weapon gives higher dps than 1H', () => {
    const lo = autoLoadout('warrior', 15);
    const c = deriveStats({ cls: 'warrior', level: 15, equipped: gearSet(1, 'warrior', 15, 0), loadout: lo });
    const e = deriveStats({ cls: 'warrior', level: 15, equipped: gearSet(1, 'warrior', 15, 3), loadout: lo });
    expect(e.estDps).toBeGreaterThan(c.estDps);
    const one = deriveStats({ cls: 'warrior', level: 15, equipped: { mainhand: { base_id: 'w_sword_2', item_level: 15, rarity: 1, upgrade: 0, affixes: [] } } });
    const two = deriveStats({ cls: 'warrior', level: 15, equipped: { mainhand: { base_id: 'w_great_2', item_level: 15, rarity: 1, upgrade: 0, affixes: [] } } });
    expect(two.weaponDps).toBeGreaterThan(one.weaponDps);
  });
});

describe('combat simulation', () => {
  it('is deterministic: snapshot/restore mid-fight gives identical results (client == server)', () => {
    const stats = makeStats('ranger', 14, 2, 3);
    const a = createSim({ seed: 1234, mode: 'farm', zoneId: 'forest_path', stats });
    run(a, 3000);
    const snap = snapshot(a);
    const b = restore(snap);
    run(a, 4000); run(b, 4000);
    expect(JSON.stringify(snapshot(a))).toBe(JSON.stringify(snapshot(b)));
    // chunked stepping (client heartbeats) == one big run (server)
    const c = createSim({ seed: 99, mode: 'farm', zoneId: 'forest_path', stats });
    const d = createSim({ seed: 99, mode: 'farm', zoneId: 'forest_path', stats });
    for (let i = 0; i < 20; i++) run(c, 200);
    run(d, 4000);
    expect(takeAcc(c)).toEqual(takeAcc(d));
  });
  it('each class kills normal enemies in ~3-8s at level with Uncommon gear', () => {
    for (const cls of ['warrior', 'ranger', 'mage']) {
      const sim = createSim({ seed: 5, mode: 'farm', zoneId: 'dark_grove', stats: makeStats(cls, 18, 1, 2) });
      run(sim, 20 * 60 * 10);
      const acc = takeAcc(sim);
      const avg = 600 / acc.kills;
      expect(avg).toBeGreaterThan(2);
      expect(avg).toBeLessThan(9);
    }
  });
  it('AI uses skills, evades telegraphs and bosses have phases', () => {
    const stats = makeStats('warrior', 12, 2, 4);
    const sim = createSim({ seed: 3, mode: 'boss', bossId: 'broken_horn', stats });
    const kinds = new Set(); const skills = new Set(); const states = new Set();
    for (let i = 0; i < 20 * 180 && sim.status === 'running'; i++) {
      step(sim);
      for (const e of sim.ev) { kinds.add(e.k); if (e.k === 'skill') skills.add(e.skill); }
      states.add(sim.p.state);
      sim.ev.length = 0;
    }
    expect(kinds.has('telegraph')).toBe(true);
    expect(kinds.has('phase')).toBe(true);
    expect(skills.size).toBeGreaterThanOrEqual(2);
    expect(states.has('APPROACH')).toBe(true);
    expect(sim.status).toBe('won');
  });
  it('unique effects run in combat (Viper spreads poison, Storm Staff procs lightning)', () => {
    const viper = makeStats('ranger', 20, 2, 1);
    const eq = gearSet(1, 'ranger', 20, 2);
    eq.mainhand = generateItem(R.makeRng(1), 'u_vipers_whisper', 20, 4);
    const lo = autoLoadout('ranger', 20);
    lo.actives = ['poison_arrow', 'rapid_shot', 'arrow_rain', 'leap_back'];
    const st = deriveStats({ cls: 'ranger', level: 20, equipped: eq, loadout: lo });
    expect(st.flags.u_viper).toBe(1);
    const sim = createSim({ seed: 8, mode: 'farm', zoneId: 'dark_grove', stats: st });
    let spread = 0;
    for (let i = 0; i < 20 * 300; i++) { step(sim); for (const e of sim.ev) if (e.fx === 'poison_spread') spread++; sim.ev.length = 0; }
    expect(spread).toBeGreaterThan(0);
    const eqm = gearSet(2, 'mage', 25, 2);
    eqm.mainhand = generateItem(R.makeRng(2), 'u_storm_staff', 25, 4);
    const sm = deriveStats({ cls: 'mage', level: 25, equipped: eqm, loadout: autoLoadout('mage', 25) });
    const sim2 = createSim({ seed: 8, mode: 'farm', zoneId: 'old_mine', stats: sm });
    let mini = 0;
    for (let i = 0; i < 20 * 120; i++) { step(sim2); for (const e of sim2.ev) if (e.fx === 'mini_lightning') mini++; sim2.ev.length = 0; }
    expect(mini).toBeGreaterThan(0);
    expect(viper.maxHp).toBeGreaterThan(0);
  });
});
