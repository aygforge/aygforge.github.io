// VARNETH deterministic combat simulation.
// One engine is used by the server (authoritative settlement) and by the Phaser
// client (visual presentation). Fixed 50ms ticks, seeded RNG streams, plain-JSON state.
//
// Player AI states: IDLE, ACQUIRE_TARGET, APPROACH, REPOSITION, BASIC_ATTACK, CAST_SKILL,
//                   EVADE_TELEGRAPH, HIT_REACTION, DYING, RESPAWN, TRAVEL
import * as R from '../rng.js';
import { BALANCE } from '../data/balance.js';
import { CLASSES } from '../data/classes.js';
import { SKILLS } from '../data/skills.js';
import { ENEMIES } from '../data/enemies.js';
import { ZONE_BY_ID, REGION_BY_ID, REGIONS, DUNGEONS, BOSS_ENCOUNTERS } from '../data/regions.js';
import { enemyStats, killXp, killGold, xpLevelFactor, scale } from '../formulas.js';
import { rollKillLoot } from '../loot.js';

const DT = BALANCE.TICK_S;
const ARENA_MIN = 16, ARENA_MAX = 624;
export const STATES = ['IDLE', 'ACQUIRE_TARGET', 'APPROACH', 'REPOSITION', 'BASIC_ATTACK', 'CAST_SKILL', 'EVADE_TELEGRAPH', 'HIT_REACTION', 'DYING', 'RESPAWN', 'TRAVEL'];

function freshAcc() {
  return { kills: 0, xp: 0, gold: 0, loot: [], killsBy: {}, tiers: { normal: 0, elite: 0, champion: 0, boss: 0 }, bossKills: {}, eliteRegions: {}, zoneKills: {}, deaths: 0, dmgDealt: 0, dmgTaken: 0 };
}

export function createSim(opts) {
  const { seed, mode = 'farm', stats } = opts;
  const C = CLASSES[stats.cls];
  const sim = {
    v: 1, t: 0, mode,
    rng: R.makeRng(seed >>> 0),
    lrng: R.makeRng(R.deriveSeed(String(seed), 'loot')),
    zoneId: opts.zoneId || null,
    bossId: opts.bossId || null,
    dungeonId: opts.dungeonId || null,
    difficulty: opts.difficulty || 'normal',
    deathRule: opts.deathRule || 'continue',
    forceChampion: opts.forceChampion || 0,
    status: 'running', endReason: null,
    nextId: 1,
    scroll: 0,
    travelT: 1.0,
    p: {
      id: 0, x: 140, hp: stats.maxHp, res: C.resourceStart, state: 'IDLE', facing: 1,
      cds: {}, target: null, atkT: 0, cast: null, buffs: [], dots: [], shield: 0, shieldT: 0,
      deathTimes: [], respawnT: 0, stunT: 0, rootT: 0, hurtT: 0, combo: 0, spellCount: 0, ucd: {},
      stats,
    },
    e: [], proj: [], tel: [], delayed: [],
    dungeon: mode === 'dungeon' ? { stage: 0, wave: 0, done: false } : null,
    bossT: 0,
    acc: freshAcc(),
    ev: [],
  };
  return sim;
}

export function takeAcc(sim) {
  const a = sim.acc;
  sim.acc = freshAcc();
  return a;
}

export function setPlayerStats(sim, stats) {
  const p = sim.p;
  const ratio = p.stats.maxHp ? p.hp / p.stats.maxHp : 1;
  p.stats = stats;
  p.hp = Math.max(p.hp > 0 ? 1 : 0, Math.round(stats.maxHp * ratio));
}

// ------------------------------------------------------------------ helpers
const ev = (sim, e) => { sim.ev.push(e); };
const alive = (e) => e.hp > 0 && !e.dead;
const enemiesAlive = (sim) => sim.e.filter(alive);
const dist = (a, b) => Math.abs(a.x - b.x);
const halfW = (e) => (ENEMIES[e.tpl].w || 32) / 2;

function zoneRegion(sim) {
  if (sim.mode === 'farm') return ZONE_BY_ID[sim.zoneId]?.region;
  if (sim.mode === 'boss') return BOSS_ENCOUNTERS[sim.bossId]?.region;
  if (sim.mode === 'dungeon') return DUNGEONS[sim.dungeonId]?.region;
  return null;
}

function buffSum(p, key) {
  let s = 0;
  for (const b of p.buffs) if (b[key]) s += b[key];
  return s;
}

function cooldownOf(p, id) {
  const sk = SKILLS[id];
  const mod = p.stats.skillMods[id] || {};
  return sk.cd * (1 - p.stats.cdr) * (1 + (mod.cd || 0));
}
function costOf(p, id) {
  const sk = SKILLS[id];
  if (!sk.cost) return 0;
  if (p.stats.flags.set_arcanist4 && p.stats.cls === 'mage' && p.spellCount % 4 === 3) return 0;
  return Math.round(sk.cost * (1 - p.stats.costReduction));
}

// ------------------------------------------------------------------ spawning
function spawnEnemy(sim, tplId, level, x, extra = {}) {
  const tpl = ENEMIES[tplId];
  const diff = sim.mode === 'dungeon' ? DUNGEONS[sim.dungeonId].difficulties[sim.difficulty] : null;
  const st = enemyStats(tpl, level, diff ? { hpMult: diff.hpMult, dmgMult: diff.dmgMult } : {});
  const e = {
    id: sim.nextId++, tpl: tplId, tier: tpl.tier, level, x, hp: st.hp, maxHp: st.maxHp, hit: st.hit,
    armor: st.armor, resist: Math.max(0.1, Math.min(0.45, 0.24 + 0.12 * (tpl.armor - 1))),
    as: tpl.as, state: 'APPROACH', atkT: 0, cds: {}, dots: [], slowT: 0, slowPct: 0, stunT: 0, rootT: 0,
    guardT: 0, guardDr: 0, phase: 0, casting: null, fresh: true, enrage: null, dyingT: 0, backT: 0,
    facing: x > sim.p.x ? -1 : 1, summoned: !!extra.summoned, offset: (sim.nextId % 5) * 7,
  };
  // stagger initial ability cooldowns
  const abil = currentAbilities(e);
  for (const a of abil) e.cds[a.id] = (a.cd || 6) * (0.4 + 0.4 * R.next(sim.rng));
  sim.e.push(e);
  ev(sim, { k: 'spawn', id: e.id, tpl: tplId, tier: e.tier });
  return e;
}

function currentAbilities(e) {
  const tpl = ENEMIES[e.tpl];
  if (tpl.phases) {
    const list = [];
    for (let i = 0; i <= e.phase && i < tpl.phases.length; i++) if (tpl.phases[i].abilities) list.push(...tpl.phases[i].abilities);
    return list;
  }
  return tpl.abilities || [];
}

function spawnFarmPack(sim) {
  const zone = ZONE_BY_ID[sim.zoneId];
  const region = REGION_BY_ID[zone.region];
  // Monsters stay inside the zone's level band; a low-level hunter meets the low end of the band
  // first. They never scale above the zone, so overleveled hunters clear old zones quickly.
  const pl = sim.p.stats.level;
  const top = Math.max(zone.levels[0], Math.min(zone.levels[1], pl + 1));
  const lvl = () => R.int(sim.rng, zone.levels[0], top);
  const baseX = Math.min(ARENA_MAX - 20, sim.p.x + 330);
  const r = R.next(sim.rng);
  const champChance = BALANCE.CHAMPION_SPAWN_CHANCE;
  if (sim.forceChampion > 0 || (r < champChance && pl >= zone.levels[0] + 2)) {
    if (sim.forceChampion > 0) sim.forceChampion--;
    spawnEnemy(sim, R.pick(sim.rng, region.champions), Math.min(zone.levels[1] + 1, top + 2), baseX);
    ev(sim, { k: 'announce', text: 'Nadir şampiyon belirdi!', tone: 'champion' });
    return;
  }
  // elites only once the hunter has outgrown the bottom of the zone band
  const eliteOk = pl >= zone.levels[0] + 2;
  if (eliteOk && (r < champChance + BALANCE.ELITE_SPAWN_CHANCE && zone.levels[0] >= region.levels[0] + 4 || r < champChance + BALANCE.ELITE_SPAWN_CHANCE * 0.5)) {
    spawnEnemy(sim, R.pick(sim.rng, region.elites), Math.min(zone.levels[1], top + 1), baseX);
    if (R.chance(sim.rng, 0.5)) spawnEnemy(sim, R.weighted(sim.rng, zone.pool), lvl(), baseX + 40);
    return;
  }
  const count = R.weighted(sim.rng, [[1, 4], [2, 5], [3, 3]]);
  for (let i = 0; i < count; i++) {
    const tplId = R.weighted(sim.rng, zone.pool);
    const tpl = ENEMIES[tplId];
    const n = tpl.group ? R.int(sim.rng, tpl.group[0], tpl.group[1]) : 1;
    for (let j = 0; j < n; j++) spawnEnemy(sim, tplId, lvl(), Math.min(ARENA_MAX, baseX + i * 36 + j * 18));
    if (tpl.group) break;
  }
}

function spawnDungeonWave(sim) {
  const D = DUNGEONS[sim.dungeonId];
  const diff = D.difficulties[sim.difficulty];
  const d = sim.dungeon;
  const stage = D.stages[d.stage];
  if (!stage) return;
  if (d.wave === 0) ev(sim, { k: 'stage', idx: d.stage, name: stage.name, total: D.stages.length });
  const baseX = Math.min(ARENA_MAX - 20, sim.p.x + 320);
  if (stage.boss) {
    spawnEnemy(sim, stage.boss, diff.level + 2, 500);
    ev(sim, { k: 'announce', text: ENEMIES[stage.boss].name + ' uyanıyor!', tone: 'boss' });
    return;
  }
  const wave = stage.waves[d.wave];
  let i = 0;
  for (const [tplId, n] of wave) for (let j = 0; j < n; j++) spawnEnemy(sim, tplId, diff.level + (ENEMIES[tplId].tier === 'elite' ? 1 : 0), Math.min(ARENA_MAX, baseX + (i++) * 30));
}

function advanceDungeon(sim) {
  const D = DUNGEONS[sim.dungeonId];
  const d = sim.dungeon;
  const stage = D.stages[d.stage];
  if (!stage.boss && d.wave + 1 < stage.waves.length) d.wave++;
  else { d.stage++; d.wave = 0; }
}

// ------------------------------------------------------------------ damage
function playerDamage(sim, target, amount, opt = {}) {
  if (!alive(target)) return 0;
  const p = sim.p, S = p.stats;
  let dmg = amount * S.dmgMult * (1 + buffSum(p, 'dmg'));
  const tpl = ENEMIES[target.tpl];
  if (opt.element) dmg *= 1 + S.elemDmg;
  if (target.tier === 'boss') dmg *= 1 + S.bossDmg;
  if (target.tier === 'elite' || target.tier === 'champion') dmg *= 1 + S.eliteDmg;
  if (S.flags.u_seal && target.tier !== 'normal') dmg *= 1.12;
  if (S.flags.bloody_rage && p.res > 50) dmg *= 1.1;
  if (S.flags.shatter && target.slowT > 0) dmg *= 1 + 0.1 * S.flags.shatter;
  if (S.flags.long_range && dist(p, target) > 100) dmg *= 1 + 0.05 * S.flags.long_range;
  if (S.flags.ambush && target.fresh) dmg *= 1 + 0.25 * S.flags.ambush;
  if (opt.skill === 'rapid_shot' && S.flags.set_greenshade4 && target.dots.some((d) => d.kind === 'poison')) dmg *= 1.15;
  let crit = false;
  if (!opt.dot && R.next(sim.rng) < S.critChance) { crit = true; dmg *= S.critDamage; }
  // mitigation
  if (opt.dot || opt.element || S.cls === 'mage') dmg *= 1 - target.resist;
  else dmg *= 1 - Math.min(0.75, target.armor / (target.armor + 60 * scale(S.level)));
  if (target.guardT > 0) dmg *= 1 - target.guardDr;
  if (target.phaseGuard) dmg *= 1 - target.phaseGuard;
  dmg = Math.max(1, Math.round(dmg));
  target.fresh = false;
  target.hp -= dmg;
  sim.acc.dmgDealt += dmg;
  ev(sim, { k: 'hit', src: 0, dst: target.id, dmg, crit, el: opt.element || (opt.dot ? opt.dotKind : null), skill: opt.skill || null });
  // lifesteal
  const ls = Math.min(BALANCE.CAPS.lifesteal + 0.1, S.lifesteal + buffSum(p, 'lifesteal'));
  if (ls > 0 && !opt.dot && p.hp > 0) healPlayer(sim, dmg * ls, true);
  // on-hit uniques
  if (!opt.dot && !opt.proc) {
    if (S.flags.u_ember && R.next(sim.rng) < 0.15) addDot(target, 'burn', (dmg * 0.4) / 3, 3, 1);
    if (S.flags.u_storm && R.next(sim.rng) < 0.2) {
      const others = enemiesAlive(sim);
      if (others.length) {
        const t2 = others[Math.floor(R.next(sim.rng) * others.length)];
        ev(sim, { k: 'fx', fx: 'mini_lightning', x: t2.x, id: t2.id });
        playerDamage(sim, t2, S.weaponDps * 0.6, { element: 'lightning', proc: true });
      }
    }
  }
  if (target.hp <= 0) killEnemy(sim, target, opt);
  return dmg;
}

function addDot(target, kind, dps, dur, maxStacks = 1) {
  const same = target.dots.filter((d) => d.kind === kind);
  if (same.length >= maxStacks) {
    same.sort((a, b) => a.t - b.t);
    same[0].t = dur; same[0].dps = Math.max(same[0].dps, dps);
  } else target.dots.push({ kind, dps, t: dur, acc: 0 });
}

function healPlayer(sim, amount, silent = false) {
  const p = sim.p;
  if (p.hp <= 0) return;
  const before = p.hp;
  p.hp = Math.min(p.stats.maxHp, p.hp + amount);
  const h = Math.round(p.hp - before);
  if (!silent && h > 0) ev(sim, { k: 'heal', dst: 0, amt: h });
}

function enemyDamage(sim, e, amount, opt = {}) {
  const p = sim.p, S = p.stats;
  if (p.hp <= 0 || p.state === 'RESPAWN') return 0;
  let dmg = amount * (e.enrage ? 1 + e.enrage.dmg : 1);
  if (sim.mode === 'boss' && sim.bossT > 150) dmg *= 3;
  if (!opt.unavoidable) {
    const ev2 = Math.min(BALANCE.CAPS.evasion, S.evasion + buffSum(p, 'evasion'));
    if (R.next(sim.rng) < ev2) { ev(sim, { k: 'miss', dst: 0 }); return 0; }
    const block = S.blockChance + (S.flags.u_millstone ? 0.12 : 0);
    if (block > 0 && R.next(sim.rng) < block) {
      ev(sim, { k: 'block', dst: 0 });
      if (S.flags.u_millstone && !opt.ranged) playerDamage(sim, e, dmg * 0.5 / Math.max(0.01, S.dmgMult), { proc: true, dot: true, dotKind: 'reflect' });
      return 0;
    }
  }
  const armorRed = Math.min(0.75, S.armor / (S.armor + 60 * scale(e.level)));
  if (opt.element) dmg *= (1 - S.resist) * (1 - armorRed * 0.5);
  else if (!opt.dot) dmg *= 1 - armorRed;
  const dr = Math.min(BALANCE.CAPS.damageReduction, S.dr + buffSum(p, 'dr'));
  dmg *= 1 - dr;
  dmg = Math.max(1, Math.round(dmg));
  if (S.flags.arcane_ward && p.res > 5) {
    const absorbed = Math.round(dmg * 0.15);
    const cost = absorbed / scale(S.level) * 0.5;
    if (p.res >= cost) { p.res -= cost; dmg -= absorbed; }
  }
  if (p.shield > 0) {
    const a = Math.min(p.shield, dmg);
    p.shield -= a; dmg -= a;
    if (a > 0) ev(sim, { k: 'absorb', dst: 0, amt: a });
  }
  p.hp -= dmg;
  sim.acc.dmgTaken += dmg;
  if (dmg > 0) ev(sim, { k: 'hit', src: e.id, dst: 0, dmg, crit: false, el: opt.element || null });
  if (dmg > p.stats.maxHp * 0.08) p.hurtT = 0.18;
  const C = CLASSES[S.cls];
  p.res = Math.min(S.resourceMax, p.res + C.resourceOnHurt);
  // thorns & counter (melee only)
  if (!opt.ranged && !opt.dot && dmg > 0 && alive(e)) {
    if (S.thorns > 0) playerDamage(sim, e, (dmg * S.thorns) / Math.max(0.01, S.dmgMult), { proc: true, dot: true, dotKind: 'thorns' });
    if (alive(e) && S.counterChance > 0 && R.next(sim.rng) < S.counterChance) {
      ev(sim, { k: 'counter', id: 0, target: e.id });
      basicHit(sim, e, true);
    }
  }
  if (p.hp <= 0) playerDies(sim);
  return dmg;
}

function playerDies(sim) {
  const p = sim.p;
  p.hp = 0; p.state = 'DYING'; p.cast = null; p.dots = []; p.buffs = []; p.shield = 0;
  p.respawnT = BALANCE.RESPAWN_S;
  sim.acc.deaths++;
  p.deathTimes.push(sim.t);
  ev(sim, { k: 'player_death' });
  if (sim.mode === 'boss') { finish(sim, 'failed', 'death'); return; }
  if (sim.mode === 'dungeon' && p.deathTimes.length >= 3) { finish(sim, 'failed', 'death'); return; }
  if (sim.mode === 'farm') {
    const window = BALANCE.DEATH_WINDOW_S / DT;
    p.deathTimes = p.deathTimes.filter((t) => sim.t - t <= window);
    if (p.deathTimes.length >= BALANCE.DEATH_LIMIT) {
      if (sim.deathRule === 'stop') finish(sim, 'stopped', 'deaths');
      else if (sim.deathRule === 'retreat') {
        const prev = previousZone(sim.zoneId);
        if (prev) {
          sim.zoneId = prev;
          sim.e = []; sim.tel = []; sim.proj = []; sim.delayed = [];
          p.deathTimes = [];
          ev(sim, { k: 'retreat', zone: prev });
        } else p.deathTimes = []; // already in the safest zone: keep hunting
      }
    }
  }
}

export function previousZone(zoneId) {
  const order = [];
  for (const r of REGIONS) for (const z of r.zones) order.push(z.id);
  const i = order.indexOf(zoneId);
  return i > 0 ? order[i - 1] : null;
}

function finish(sim, status, reason) {
  if (sim.status !== 'running') return;
  sim.status = status; sim.endReason = reason;
  ev(sim, { k: 'status', status, reason });
}

function killEnemy(sim, e, opt = {}) {
  e.hp = 0; e.dead = true; e.dyingT = 0.9; e.casting = null;
  sim.tel = sim.tel.filter((t) => t.owner !== e.id);
  const tpl = ENEMIES[e.tpl];
  const p = sim.p, S = p.stats;
  const tierXp = 1;
  const xp = Math.round(killXp(e.level) * tpl.xp * tierXp * xpLevelFactor(S.level, e.level) * (1 + S.xpBonus));
  const gold = Math.round(killGold(e.level) * tpl.gold * (1 + S.goldBonus));
  const region = zoneRegion(sim);
  const ctx = { level: e.level, tier: e.tier, region, cls: S.cls, lootBonus: S.lootBonus };
  if (e.tier === 'boss') ctx.bossId = e.tpl;
  if (e.tier === 'champion') ctx.championId = e.tpl;
  if (sim.mode === 'dungeon') {
    const diff = DUNGEONS[sim.dungeonId].difficulties[sim.difficulty];
    ctx.difficultyBonus = diff.lootBonus;
    if (e.tier === 'boss') ctx.setChance = sim.difficulty === 'heroic' ? 0.35 : 0.15;
  }
  if (e.tpl === 'forge_warden') ctx.setChance = 0.12;
  if (e.tpl === 'iron_executioner') ctx.setChance = 0.03;
  const loot = e.summoned ? [] : rollKillLoot(sim.lrng, ctx);
  const A = sim.acc;
  A.kills++; A.xp += xp; A.gold += gold;
  A.killsBy[e.tpl] = (A.killsBy[e.tpl] || 0) + 1;
  A.tiers[e.tier]++;
  if (e.tier === 'boss') A.bossKills[e.tpl] = (A.bossKills[e.tpl] || 0) + 1;
  if (e.tier === 'elite' && region) A.eliteRegions[region] = (A.eliteRegions[region] || 0) + 1;
  if (sim.zoneId) A.zoneKills[sim.zoneId] = (A.zoneKills[sim.zoneId] || 0) + 1;
  for (const l of loot) A.loot.push({ ...l, tick: sim.t, src: e.tpl });
  ev(sim, { k: 'kill', id: e.id, tpl: e.tpl, tier: e.tier, xp, gold, loot, x: e.x });
  // on-kill effects
  if (S.flags.u_viper) {
    const poison = e.dots.find((d) => d.kind === 'poison');
    if (poison) for (const o of enemiesAlive(sim)) if (dist(o, e) < 90) { addDot(o, 'poison', poison.dps, Math.max(2, poison.t), S.flags.poison_stacks ? 3 : 1); ev(sim, { k: 'fx', fx: 'poison_spread', x: o.x, id: o.id }); }
  }
  if (S.flags.u_seal && (e.tier === 'elite' || e.tier === 'champion')) p.buffs.push({ id: 'seal', t: 6, as: 0.25 });
  if (opt.skill === 'execute' && S.flags.u_crimson) { p.cds.execute = 0; healPlayer(sim, S.maxHp * 0.05); }
  const tplD = ENEMIES[e.tpl];
  if (tplD.onDeath?.poisonCloud) {
    const c = tplD.onDeath.poisonCloud;
    addTelegraph(sim, { owner: -1, a: e.x - c.radius, b: e.x + c.radius, t: 0.6, mult: 0, name: 'Spor Bulutu', poison: { pct: c.pct, dur: c.dur }, srcLevel: e.level, srcHit: e.hit });
  }
  if (sim.mode === 'boss' && e.tier === 'boss') {
    for (const o of sim.e) if (alive(o)) { o.hp = 0; o.dead = true; o.dyingT = 0.9; }
    finish(sim, 'won', 'boss');
  }
  if (sim.mode === 'dungeon' && e.tier === 'boss') {
    for (const o of sim.e) if (alive(o)) { o.hp = 0; o.dead = true; o.dyingT = 0.9; }
    finish(sim, 'won', 'dungeon');
  }
}

function addTelegraph(sim, t) {
  const tg = { id: sim.nextId++, total: t.t, ...t };
  tg.a = Math.max(ARENA_MIN - 20, tg.a); tg.b = Math.min(ARENA_MAX + 20, tg.b);
  sim.tel.push(tg);
  ev(sim, { k: 'telegraph', tid: tg.id, a: tg.a, b: tg.b, t: tg.t, name: tg.name, owner: tg.owner });
  return tg;
}

// ------------------------------------------------------------------ player actions
function basicHit(sim, target, isCounter = false) {
  const p = sim.p, S = p.stats;
  const C = CLASSES[S.cls];
  const baseAps = S.aps / (1 + S.attackSpeed);
  let dmg = S.weaponDps / baseAps;
  p.combo++;
  if (S.flags.combo && p.combo % 4 === 0) dmg *= 1 + 0.5 * S.flags.combo;
  const gain = C.resourceOnHit * (1 + S.rageGain + S.resourceRegen + (S.flags.set_bloodlord4 ? 0.3 : 0));
  p.res = Math.min(S.resourceMax, p.res + gain);
  ev(sim, { k: 'attack', id: 0, target: target.id, counter: isCounter });
  if (S.cls === 'mage' || (S.ranged && S.cls === 'ranger')) {
    spawnProjectile(sim, { from: 0, to: target.id, x: p.x + p.facing * 10, speed: S.cls === 'mage' ? 320 : 420, kind: S.cls === 'mage' ? 'bolt' : 'arrow', dmg, opt: { element: S.cls === 'mage' ? 'arcane' : null, basic: true } });
  } else {
    playerDamage(sim, target, dmg, { basic: true });
    if (S.flags.u_grip && R.next(sim.rng) < 0.1) {
      ev(sim, { k: 'fx', fx: 'spark_burst', x: target.x });
      for (const o of enemiesAlive(sim)) if (dist(o, target) < 40) playerDamage(sim, o, S.weaponDps * 0.8, { element: 'fire', proc: true });
    }
  }
}

function spawnProjectile(sim, pr) {
  const proj = { id: sim.nextId++, ...pr };
  sim.proj.push(proj);
  ev(sim, { k: 'proj', pid: proj.id, kind: proj.kind, from: proj.from, to: proj.to, x: proj.x });
}

function ruleMatches(sim, rule, skill, target) {
  const p = sim.p, S = p.stats;
  const near = enemiesAlive(sim).filter((e) => dist(e, p) < 120).length;
  switch (rule) {
    case 'always': return true;
    case 'never': return false;
    case 'enemies_ge_2': return near >= 2;
    case 'enemies_ge_3': return near >= 3;
    case 'hp_below_70': return p.hp < S.maxHp * 0.7;
    case 'hp_below_50': return p.hp < S.maxHp * 0.5;
    case 'target_hp_below_25': return !!target && target.hp < target.maxHp * (S.flags.u_crimson && skill.id === 'execute' ? 0.35 : 0.25);
    case 'boss_or_elite': return !!target && target.tier !== 'normal';
    case 'target_not_poisoned': return !!target && !target.dots.some((d) => d.kind === 'poison');
    case 'resource_below_30': return p.res < S.resourceMax * 0.3;
    case 'enemy_close': return enemiesAlive(sim).some((e) => dist(e, p) - halfW(e) < 40);
    case 'telegraph': return threatened(sim) !== null;
    default: return false;
  }
}

function skillRange(p, sk) {
  if (sk.target === 'self') return Infinity;
  if (sk.target === 'aoe_self') return sk.radius;
  if (sk.target === 'cone') return sk.radius;
  return p.stats.cls === 'warrior' ? p.stats.range + 6 : 230;
}

function chooseSkill(sim, target, forDefense = false) {
  const p = sim.p, S = p.stats;
  for (const id of S.actives) {
    const sk = SKILLS[id];
    if ((p.cds[id] || 0) > 0) continue;
    if (p.res < costOf(p, id)) continue;
    if (forDefense && !sk.defensive) continue;
    const rules = (S.rules && S.rules[id]) || sk.rules;
    if (!forDefense && !rules.some((r) => ruleMatches(sim, r, sk, target))) continue;
    if (forDefense && !rules.includes('telegraph')) continue;
    if (sk.target !== 'self') {
      if (!target) continue;
      const d = dist(p, target) - halfW(target);
      if (sk.target === 'aoe_self') { if (!enemiesAlive(sim).some((e) => dist(e, p) - halfW(e) <= sk.radius)) continue; }
      else if (d > skillRange(p, sk)) continue;
    }
    return id;
  }
  return null;
}

function startCast(sim, id, target) {
  const p = sim.p;
  const sk = SKILLS[id];
  p.res -= costOf(p, id);
  p.cds[id] = cooldownOf(p, id);
  p.cast = { id, t: sk.cast, total: sk.cast, target: target ? target.id : null, tx: target ? target.x : p.x };
  p.state = 'CAST_SKILL';
  if (target) p.facing = target.x >= p.x ? 1 : -1;
  ev(sim, { k: 'cast', id: 0, skill: id, target: target ? target.id : null, t: sk.cast });
}

function resolveCast(sim) {
  const p = sim.p, S = p.stats;
  const { id } = p.cast;
  const sk = SKILLS[id];
  const mod = S.skillMods[id] || {};
  let mult = (sk.mult || 0) * (1 + (mod.mult || 0));
  if (S.cls === 'mage') {
    p.spellCount++;
    if (S.flags.set_arcanist4 && p.spellCount % 4 === 0) { mult *= 1.4; ev(sim, { k: 'fx', fx: 'arcane_empower', x: p.x }); }
  }
  const W = S.weaponDps;
  let target = sim.e.find((e) => e.id === p.cast.target && alive(e));
  if (!target && sk.target !== 'self' && sk.target !== 'aoe_self' && sk.target !== 'cone') target = nearestEnemy(sim);
  ev(sim, { k: 'skill', id: 0, skill: id, target: target?.id ?? null, x: target ? target.x : p.x, px: p.x, facing: p.facing });
  p.cast = null; p.state = 'IDLE';
  switch (id) {
    case 'cleave': case 'execute': case 'blood_rush': {
      if (!target) return;
      let m = mult;
      if (id === 'execute') {
        const thr = S.flags.u_crimson ? 0.35 : sk.executeAt;
        if (target.hp < target.maxHp * thr) m *= sk.executeMult;
      }
      if (id === 'blood_rush') {
        p.buffs.push({ id: 'blood_rush', t: sk.buff.dur, lifesteal: sk.buff.lifesteal });
        const hits = S.flags.set_bloodlord4 ? enemiesAlive(sim).filter((e) => dist(e, target) < 40) : [target];
        for (const e of hits) { playerDamage(sim, e, W * m, { skill: id }); if (S.flags.set_bloodlord4) healPlayer(sim, S.maxHp * 0.03); }
        return;
      }
      playerDamage(sim, target, W * m, { skill: id });
      return;
    }
    case 'whirlwind': case 'ground_slam': {
      for (const e of enemiesAlive(sim)) {
        if (dist(e, p) - halfW(e) > sk.radius) continue;
        playerDamage(sim, e, W * mult, { skill: id });
        if (sk.stun && alive(e) && e.tier !== 'boss') { e.stunT = sk.stun; e.casting = null; sim.tel = sim.tel.filter((t) => t.owner !== e.id); }
        if (sk.stun && alive(e) && e.tier === 'boss') e.stunT = sk.stun * 0.3;
        if (id === 'whirlwind' && S.flags.whirl_bleed && alive(e)) addDot(e, 'bleed', (W * S.dmgMult * 0.4 * S.flags.whirl_bleed) / 4, 4);
      }
      return;
    }
    case 'iron_will': p.buffs.push({ id: 'iron_will', t: sk.buff.dur, dr: sk.buff.dr }); return;
    case 'rapid_shot': {
      if (!target) return;
      for (let i = 0; i < sk.hits; i++) sim.delayed.push({ t: i * 0.1, k: 'proj', pr: { from: 0, to: target.id, x: p.x + p.facing * 10, speed: 460, kind: 'arrow', dmg: W * mult, opt: { skill: id } } });
      return;
    }
    case 'poison_arrow': {
      if (!target) return;
      spawnProjectile(sim, { from: 0, to: target.id, x: p.x + p.facing * 10, speed: 420, kind: 'arrow_poison', dmg: W * mult, opt: { skill: id, poison: true } });
      return;
    }
    case 'arrow_rain': case 'meteor': case 'hunter_trap': {
      const x = target ? target.x : p.x + p.facing * 80;
      const ticks = sk.ticks || 1;
      const delay = sk.delay || (id === 'hunter_trap' ? 0.3 : 0.25);
      for (let i = 0; i < ticks; i++) sim.delayed.push({ t: delay + i * 0.5, k: 'aoe', x, radius: sk.radius, dmg: W * mult, opt: { skill: id, element: sk.element }, root: sk.root, fx: id });
      return;
    }
    case 'leap_back': {
      const dir = -p.facing;
      p.x = Math.max(ARENA_MIN, Math.min(ARENA_MAX, p.x + dir * sk.leap));
      p.buffs.push({ id: 'leap', t: sk.buff.dur, evasion: sk.buff.evasion });
      return;
    }
    case 'first_aid': p.buffs.push({ id: 'first_aid', t: sk.heal.dur, regen: sk.heal.pct / sk.heal.dur }); return;
    case 'fireball': {
      if (!target) return;
      spawnProjectile(sim, { from: 0, to: target.id, x: p.x + p.facing * 12, speed: 300, kind: 'fireball', dmg: W * mult, opt: { skill: id, element: 'fire', splash: sk.splash, burn: sk.burn } });
      return;
    }
    case 'chain_lightning': {
      if (!target) return;
      const jumps = sk.jumps + (S.flags.u_storm ? 2 : 0);
      const hit = new Set();
      let cur = target, m = mult;
      const chain = [];
      for (let i = 0; i <= jumps && cur; i++) {
        hit.add(cur.id); chain.push(cur.id);
        playerDamage(sim, cur, W * m, { skill: id, element: 'lightning' });
        m *= 1 - sk.falloff;
        const from = cur;
        cur = enemiesAlive(sim).filter((e) => !hit.has(e.id) && dist(e, from) < 130).sort((a, b) => dist(a, from) - dist(b, from) || a.id - b.id)[0];
      }
      ev(sim, { k: 'fx', fx: 'chain', ids: chain });
      return;
    }
    case 'frost_wave': {
      for (const e of enemiesAlive(sim)) {
        const dx = (e.x - p.x) * p.facing;
        if (dx < -10 || dx - halfW(e) > sk.radius) continue;
        playerDamage(sim, e, W * mult, { skill: id, element: 'ice' });
        if (alive(e)) {
          e.slowT = sk.slow.dur; e.slowPct = sk.slow.pct;
          if (S.flags.frost_freeze) e.stunT = Math.max(e.stunT, (e.tier === 'boss' ? 0.1 : 0.4) * S.flags.frost_freeze);
        }
      }
      return;
    }
    case 'mana_drain': {
      if (!target) return;
      playerDamage(sim, target, W * mult, { skill: id, element: 'arcane' });
      p.res = Math.min(S.resourceMax, p.res + S.resourceMax * sk.restore);
      return;
    }
    case 'spell_shield': {
      const amt = S.maxHp * sk.shield.pct * (1 + (mod.amount || 0));
      p.shield = amt; p.shieldT = sk.shield.dur;
      return;
    }
    default: return;
  }
}

function nearestEnemy(sim) {
  const p = sim.p;
  let best = null, bd = Infinity;
  for (const e of sim.e) {
    if (!alive(e)) continue;
    let d = dist(e, p);
    // bosses guarded by adds: prioritize adds
    if (e.tier === 'boss' && e.phaseGuard && sim.e.some((o) => alive(o) && o.summoned)) d += 1000;
    if (d < bd || (d === bd && e.id < best.id)) { bd = d; best = e; }
  }
  return best;
}

function threatened(sim) {
  const p = sim.p;
  let worst = null;
  for (const t of sim.tel) {
    if (t.owner === 0) continue;
    if (p.x >= t.a - 6 && p.x <= t.b + 6) if (!worst || t.t < worst.t) worst = t;
  }
  return worst;
}

function moveToward(p, x, speed) {
  const dx = x - p.x;
  const step = speed * DT;
  if (Math.abs(dx) <= step) p.x = x; else p.x += Math.sign(dx) * step;
  p.x = Math.max(ARENA_MIN, Math.min(ARENA_MAX, p.x));
}

function playerTick(sim) {
  const p = sim.p, S = p.stats;
  const C = CLASSES[S.cls];
  // buffs & regen
  for (const b of p.buffs) { b.t -= DT; if (b.regen) healPlayer(sim, S.maxHp * b.regen * DT, true); }
  p.buffs = p.buffs.filter((b) => b.t > 0);
  if (p.shieldT > 0) { p.shieldT -= DT; if (p.shieldT <= 0) p.shield = 0; }
  for (const k in p.cds) if (p.cds[k] > 0) p.cds[k] = Math.max(0, p.cds[k] - DT);
  for (const k in p.ucd) if (p.ucd[k] > 0) p.ucd[k] = Math.max(0, p.ucd[k] - DT);
  if (p.hurtT > 0) p.hurtT -= DT;
  // player dots
  for (const d of p.dots) {
    d.t -= DT; d.acc += d.dps * DT;
    if (d.acc >= 1 && p.hp > 0) {
      const dmg = Math.floor(d.acc); d.acc -= dmg;
      p.hp -= dmg; sim.acc.dmgTaken += dmg;
      ev(sim, { k: 'hit', src: -1, dst: 0, dmg, crit: false, el: d.kind });
      if (p.hp <= 0) { playerDies(sim); return; }
    }
  }
  p.dots = p.dots.filter((d) => d.t > 0);

  if (p.state === 'DYING') {
    p.respawnT -= DT;
    if (p.respawnT <= 0) {
      p.hp = S.maxHp; p.res = C.resourceStart; p.state = 'RESPAWN'; p.respawnT = 0.6; p.x = 140;
      ev(sim, { k: 'respawn' });
    }
    return;
  }
  if (p.state === 'RESPAWN') { p.respawnT -= DT; if (p.respawnT <= 0) p.state = 'IDLE'; return; }

  const inCombat = enemiesAlive(sim).length > 0;
  // resource regen
  let regen = C.resourceRegen;
  if (regen > 0) regen *= 1 + S.resourceRegen;
  if (S.cls === 'warrior' && inCombat) regen = 0;
  p.res = Math.max(0, Math.min(S.resourceMax, p.res + regen * DT));
  // hp regen
  healPlayer(sim, S.maxHp * (inCombat ? 0.004 : 0.03) * DT, true);
  // Crown of roots
  if (S.flags.u_roots && p.hp < S.maxHp * 0.35 && !(p.ucd.roots > 0)) {
    p.ucd.roots = 30;
    p.buffs.push({ id: 'roots', t: 5, dr: 0.25, regen: 0.03 });
    ev(sim, { k: 'fx', fx: 'roots', x: p.x });
  }

  if (p.stunT > 0) { p.stunT -= DT; p.state = 'HIT_REACTION'; return; }
  if (p.rootT > 0) p.rootT -= DT;

  if (p.cast) {
    p.cast.t -= DT;
    if (p.cast.t <= 0) resolveCast(sim);
    return;
  }

  // telegraph evasion
  const threat = threatened(sim);
  if (threat) {
    const def = chooseSkill(sim, null, true);
    if (def && threat.t < 0.9) { startCast(sim, def, null); return; }
    if (p.rootT <= 0) {
      const exitL = threat.a - 10, exitR = threat.b + 10;
      const dl = p.x - exitL, dr = exitR - p.x;
      const canL = exitL >= ARENA_MIN, canR = exitR <= ARENA_MAX;
      let goal = null;
      if (canL && (!canR || dl <= dr)) goal = exitL; else if (canR) goal = exitR;
      if (goal !== null) {
        const tNeed = Math.abs(goal - p.x) / (S.moveSpeed * 1.25);
        if (tNeed < threat.t + 0.05) {
          p.state = 'EVADE_TELEGRAPH';
          p.facing = goal > p.x ? 1 : -1;
          moveToward(p, goal, S.moveSpeed * 1.25);
          return;
        }
      }
    }
  }

  // target
  let target = sim.e.find((e) => e.id === p.target && alive(e));
  if (target && sim.t % 10 === 0) {
    const n = nearestEnemy(sim);
    if (n && n.id !== target.id && dist(n, p) + 40 < dist(target, p)) target = null;
  }
  if (!target) {
    target = nearestEnemy(sim);
    p.target = target ? target.id : null;
    if (target) { p.state = 'ACQUIRE_TARGET'; ev(sim, { k: 'target', id: target.id }); }
  }
  if (!target) {
    if (sim.travelT > 0) { p.state = 'TRAVEL'; p.facing = 1; sim.scroll += S.moveSpeed * DT; moveToward(p, 140, S.moveSpeed); }
    else p.state = 'IDLE';
    p.atkT = 0;
    return;
  }
  p.facing = target.x >= p.x ? 1 : -1;
  const d = dist(p, target) - halfW(target);

  // skills
  const sid = chooseSkill(sim, target);
  if (sid) { startCast(sim, sid, target); return; }

  // ranged kiting
  const kite = C.kiteRange && S.ranged;
  const closest = enemiesAlive(sim).reduce((m, e) => Math.min(m, dist(e, p) - halfW(e)), Infinity);
  if (p.kiteCd > 0) p.kiteCd -= DT;
  if (kite && closest < C.kiteRange && p.rootT <= 0 && p.x > ARENA_MIN + 30 && !(p.kiteCd > 0)) {
    p.state = 'REPOSITION';
    p.kiteT = (p.kiteT || 0) + DT;
    if (p.kiteT > 1.0) { p.kiteT = 0; p.kiteCd = 2.0; }
    moveToward(p, p.x - p.facing * 40, S.moveSpeed);
    // keep shooting while backing off (slower)
    p.atkT += DT * 0.5;
  } else if (d > S.range) {
    if (p.rootT <= 0) { p.state = 'APPROACH'; moveToward(p, target.x - p.facing * (S.preferredRange + halfW(target)), S.moveSpeed); }
    return;
  } else {
    p.state = 'BASIC_ATTACK';
    p.atkT += DT;
  }
  const interval = 1 / (S.aps * (1 + buffSum(p, 'as')));
  if (p.atkT >= interval && d <= S.range + 4) { p.atkT -= interval; basicHit(sim, target); }
}

// ------------------------------------------------------------------ enemies
function enemyTick(sim, e) {
  const p = sim.p;
  const tpl = ENEMIES[e.tpl];
  if (e.dead) { e.dyingT -= DT; return; }
  // dots
  for (const d of e.dots) {
    d.t -= DT; d.acc += d.dps * DT;
    if (d.acc >= 1 && alive(e)) {
      const dmg = Math.floor(d.acc); d.acc -= dmg;
      e.hp -= dmg; sim.acc.dmgDealt += dmg;
      ev(sim, { k: 'hit', src: 0, dst: e.id, dmg, crit: false, el: d.kind, dot: true });
      if (e.hp <= 0) { killEnemy(sim, e, { dot: true }); return; }
    }
  }
  e.dots = e.dots.filter((d) => d.t > 0);
  if (e.slowT > 0) e.slowT -= DT;
  if (e.guardT > 0) e.guardT -= DT;
  if (e.backT > 0) e.backT -= DT;
  for (const k in e.cds) if (e.cds[k] > 0) e.cds[k] -= DT;

  // boss phases
  if (tpl.phases) {
    const next = tpl.phases[e.phase + 1];
    if (next && e.hp <= e.maxHp * next.at) {
      e.phase++;
      ev(sim, { k: 'phase', id: e.id, phase: e.phase, text: next.text });
      if (next.summon) for (let i = 0; i < next.summon.count; i++) spawnEnemy(sim, next.summon.id, Math.max(1, e.level - 1), Math.min(ARENA_MAX, e.x + 40 + i * 30), { summoned: true });
      if (next.enrage) e.enrage = next.enrage;
      if (next.guard) { e.guardT = next.guard.dur; e.guardDr = next.guard.dr; if (next.then) e.pendingThen = { ...next.then, delay: next.guard.dur - next.then.windup }; }
      if (next.guardWhileAdds) e.phaseGuard = next.guardWhileAdds.dr;
      for (const a of currentAbilities(e)) if (e.cds[a.id] == null) e.cds[a.id] = 2;
    }
    if (e.phaseGuard && !sim.e.some((o) => alive(o) && o.summoned)) { e.phaseGuard = 0; ev(sim, { k: 'phase', id: e.id, text: 'Koruma kırıldı!' }); }
    if (e.pendingThen) {
      e.pendingThen.delay -= DT;
      if (e.pendingThen.delay <= 0) { startAbility(sim, e, e.pendingThen); e.pendingThen = null; }
    }
  }

  if (e.stunT > 0) { e.stunT -= DT; e.state = 'HIT_REACTION'; return; }

  if (e.casting) {
    e.casting.t -= DT;
    if (e.casting.t <= 0) {
      const a = e.casting.a;
      if (a.dash && e.casting.dashTo != null && e.rootT <= 0) e.x = Math.max(ARENA_MIN, Math.min(ARENA_MAX, e.casting.dashTo));
      e.casting = null;
      e.state = 'APPROACH';
    } else { e.state = 'CAST_SKILL'; return; }
  }
  if (p.hp <= 0 || p.state === 'RESPAWN') { e.state = 'IDLE'; return; }

  const facing = p.x >= e.x ? 1 : -1;
  e.facing = facing;
  const d = Math.abs(p.x - e.x) - (tpl.range > 60 ? 0 : halfW(e) * 0.5);

  // abilities
  for (const a of currentAbilities(e)) {
    if ((e.cds[a.id] || 0) > 0) continue;
    if (a.type === 'telegraph') {
      const reach = a.atTarget ? 400 : a.shape === 'circle' ? a.radius + 10 : (a.width || a.radius || 100);
      if (Math.abs(p.x - e.x) > reach) continue;
    }
    if (a.type === 'lunge' && (d < 40 || d > a.range)) continue;
    if (a.type === 'guard' && d > 80) continue;
    e.cds[a.id] = a.cd;
    startAbility(sim, e, a);
    return;
  }

  // movement
  const speed = tpl.speed * (e.slowT > 0 ? 1 - e.slowPct : 1) * (e.enrage ? 1.15 : 1);
  const desired = tpl.behavior === 'ranged' ? tpl.range * 0.8 : tpl.range;
  if (e.backT > 0 && e.rootT <= 0) {
    e.state = 'REPOSITION';
    e.x = Math.max(ARENA_MIN, Math.min(ARENA_MAX, e.x - facing * speed * DT));
  } else if (d > desired && e.rootT <= 0 && speed > 0) {
    e.state = 'APPROACH';
    const goal = p.x - facing * (desired * 0.9 + e.offset * 0.3);
    const step = speed * DT;
    const dx = goal - e.x;
    e.x += Math.abs(dx) <= step ? dx : Math.sign(dx) * step;
    e.x = Math.max(ARENA_MIN, Math.min(ARENA_MAX + 30, e.x));
    e.atkT = Math.min(e.atkT, 0.3 / e.as);
  } else {
    e.state = 'BASIC_ATTACK';
    e.atkT += DT * (e.slowT > 0 ? 1 - e.slowPct * 0.5 : 1);
    const interval = 1 / (e.as * (e.enrage ? 1 + e.enrage.as : 1));
    if (e.atkT >= interval && d <= desired + 6) {
      e.atkT -= interval;
      ev(sim, { k: 'attack', id: e.id, target: 0 });
      if (tpl.behavior === 'ranged' || tpl.projectile) {
        spawnProjectile(sim, { from: e.id, to: 0, x: e.x + facing * 10, speed: 240, kind: tpl.projectile || 'spit', dmg: e.hit, opt: { element: tpl.element || null } });
      } else {
        enemyDamage(sim, e, e.hit, { element: tpl.element || null });
        if (tpl.onHit?.poison && p.hp > 0) addPlayerDot(sim, 'poison', (e.hit * tpl.onHit.poison.pct) / tpl.onHit.poison.dur, tpl.onHit.poison.dur);
        if (tpl.behavior === 'skirmish') e.backT = 0.5;
      }
    }
  }
}

function addPlayerDot(sim, kind, dps, dur) {
  const p = sim.p;
  const S = p.stats;
  const m = 1 - (kind === 'poison' || kind === 'burn' ? S.resist : 0);
  const ex = p.dots.find((d) => d.kind === kind);
  if (ex) { ex.t = Math.max(ex.t, dur); ex.dps = Math.max(ex.dps, dps * m); }
  else p.dots.push({ kind, dps: dps * m, t: dur, acc: 0 });
}

function startAbility(sim, e, a) {
  const p = sim.p;
  const facing = p.x >= e.x ? 1 : -1;
  if (a.type === 'guard') {
    e.guardT = a.dur; e.guardDr = a.dr;
    ev(sim, { k: 'guard', id: e.id, t: a.dur });
    return;
  }
  if (a.type === 'lunge') {
    e.x = p.x - facing * (halfW(e) + 10);
    ev(sim, { k: 'lunge', id: e.id });
    enemyDamage(sim, e, e.hit * a.mult, {});
    e.backT = 0.6;
    return;
  }
  if (a.type === 'projectile') {
    ev(sim, { k: 'attack', id: e.id, target: 0, special: a.id });
    spawnProjectile(sim, { from: e.id, to: 0, x: e.x + facing * 20, speed: 220, kind: a.projectile || 'spit', dmg: e.hit * a.mult, opt: { poison: a.poison } });
    return;
  }
  if (a.type === 'telegraph') {
    let A, B, dashTo = null;
    if (a.shape === 'circle') {
      const cx = a.atTarget ? p.x : e.x;
      A = cx - a.radius; B = cx + a.radius;
    } else {
      const len = a.width || a.radius;
      if (facing > 0) { A = e.x; B = e.x + len; } else { A = e.x - len; B = e.x; }
      if (a.dash) dashTo = e.x + facing * (len - halfW(e));
    }
    e.casting = { a, t: a.windup, dashTo };
    e.state = 'CAST_SKILL';
    addTelegraph(sim, { owner: e.id, a: A, b: B, t: a.windup, mult: a.mult, name: a.name, element: a.element || null, poison: a.poison, root: a.root, stun: a.stun, srcHit: e.hit, srcLevel: e.level });
  }
}

function telegraphTick(sim) {
  const p = sim.p;
  for (const t of sim.tel) {
    t.t -= DT;
    if (t.t > 0) continue;
    t.done = true;
    ev(sim, { k: 'telegraph_fire', tid: t.id, a: t.a, b: t.b, name: t.name });
    const owner = sim.e.find((e) => e.id === t.owner);
    if (p.hp > 0 && p.state !== 'RESPAWN' && p.x >= t.a && p.x <= t.b) {
      const src = owner || { id: -1, level: t.srcLevel, hit: t.srcHit, enrage: null, tpl: 'rot_sporeling' };
      if (t.mult > 0) enemyDamage(sim, src, (t.srcHit || src.hit) * t.mult, { element: t.element, unavoidable: true });
      if (t.poison && p.hp > 0) addPlayerDot(sim, 'poison', ((t.srcHit || src.hit) * t.poison.pct) / t.poison.dur, t.poison.dur);
      if (t.root && p.hp > 0) p.rootT = Math.max(p.rootT, t.root);
      if (t.stun && p.hp > 0) { p.stunT = Math.max(p.stunT, t.stun); p.cast = null; }
    }
  }
  sim.tel = sim.tel.filter((t) => !t.done);
}

function projTick(sim) {
  const p = sim.p;
  for (const pr of sim.proj) {
    const target = pr.to === 0 ? p : sim.e.find((e) => e.id === pr.to);
    if (!target || (pr.to !== 0 && !alive(target)) || (pr.to === 0 && p.hp <= 0)) { pr.done = true; continue; }
    const dx = target.x - pr.x;
    const step = pr.speed * DT;
    if (Math.abs(dx) <= step + 4) {
      pr.done = true;
      if (pr.from === 0) {
        const o = pr.opt || {};
        playerDamage(sim, target, pr.dmg, o);
        if (o.poison && alive(target)) {
          const S = p.stats;
          const sk = SKILLS.poison_arrow;
          const dur = sk.poison.dur * (1 + S.poisonDur) * (S.flags.set_greenshade4 ? 1.5 : 1);
          const dps = (S.weaponDps * S.dmgMult * sk.poison.pct * (1 + S.poisonDmg)) / sk.poison.dur;
          addDot(target, 'poison', dps, dur, S.flags.poison_stacks ? 3 : 1);
          if (S.flags.poison_splash) {
            const other = enemiesAlive(sim).find((e) => e.id !== target.id && dist(e, target) < 70);
            if (other && R.next(sim.rng) < 0.25 * S.flags.poison_splash) addDot(other, 'poison', dps, dur, S.flags.poison_stacks ? 3 : 1);
          }
        }
        if (o.splash) for (const e of enemiesAlive(sim)) if (e.id !== target.id && dist(e, target) < o.splash.radius + halfW(e)) playerDamage(sim, e, pr.dmg * o.splash.pct, { ...o, splash: null, proc: true });
        if (o.burn && alive(target)) addDot(target, 'burn', (pr.dmg * p.stats.dmgMult * o.burn.pct * (1 + p.stats.burnDmg)) / o.burn.dur, o.burn.dur);
      } else {
        const owner = sim.e.find((e) => e.id === pr.from) || { id: pr.from, level: 1, enrage: null };
        enemyDamage(sim, owner, pr.dmg, { ranged: true, element: pr.opt?.element });
        if (pr.opt?.poison && p.hp > 0) addPlayerDot(sim, 'poison', (pr.dmg * pr.opt.poison.pct) / pr.opt.poison.dur, pr.opt.poison.dur);
      }
    } else pr.x += Math.sign(dx) * step;
  }
  sim.proj = sim.proj.filter((x) => !x.done);
}

function delayedTick(sim) {
  for (const d of sim.delayed) {
    d.t -= DT;
    if (d.t > 0) continue;
    d.done = true;
    if (d.k === 'proj') spawnProjectile(sim, d.pr);
    else if (d.k === 'aoe') {
      ev(sim, { k: 'fx', fx: d.fx, x: d.x, r: d.radius });
      for (const e of enemiesAlive(sim)) {
        if (Math.abs(e.x - d.x) - halfW(e) > d.radius) continue;
        playerDamage(sim, e, d.dmg, d.opt);
        if (d.root && alive(e)) e.rootT = d.root;
      }
    }
  }
  sim.delayed = sim.delayed.filter((d) => !d.done);
}

function hazardTick(sim) {
  if (sim.mode !== 'dungeon') return;
  const D = DUNGEONS[sim.dungeonId];
  const st = D.stages[sim.dungeon.stage];
  if (!st || st.hazard !== 'poison') return;
  if (sim.t % 110 === 0) {
    const x = sim.p.x + (R.next(sim.rng) - 0.5) * 80;
    const lvl = D.difficulties[sim.difficulty].level;
    addTelegraph(sim, { owner: -1, a: x - 45, b: x + 45, t: 1.5, mult: 0.6, name: 'Zehirli Gaz', poison: { pct: 0.8, dur: 4 }, srcHit: 5.2 * scale(lvl) / 1.0, srcLevel: lvl });
  }
}

// ------------------------------------------------------------------ main step
export function step(sim) {
  if (sim.status !== 'running') { sim.t++; return; }
  sim.t++;
  if (sim.mode === 'boss') sim.bossT += DT;
  const anyAlive = sim.e.some(alive);
  if (!anyAlive) {
    if (sim.mode === 'boss') {
      if (sim.t > 20 && !sim.e.length) {
        const enc = BOSS_ENCOUNTERS[sim.bossId];
        spawnEnemy(sim, sim.bossId, enc.level, 470);
        ev(sim, { k: 'announce', text: ENEMIES[sim.bossId].name + ' savaşa giriyor!', tone: 'boss' });
      }
    } else if (sim.travelT > 0) {
      sim.travelT -= DT;
    } else {
      sim.e = sim.e.filter((e) => !e.dead || e.dyingT > 0);
      if (sim.mode === 'farm') spawnFarmPack(sim);
      else if (sim.mode === 'dungeon') {
        if (sim.dungeon.started) advanceDungeon(sim);
        sim.dungeon.started = true;
        spawnDungeonWave(sim);
      }
    }
  } else if (sim.travelT <= 0) {
    // reset travel timer for after this pack
    sim.travelT = sim.mode === 'farm' ? 1.4 : 1.8;
  }
  hazardTick(sim);
  playerTick(sim);
  for (const e of sim.e) enemyTick(sim, e);
  projTick(sim);
  delayedTick(sim);
  telegraphTick(sim);
  sim.e = sim.e.filter((e) => !e.dead || e.dyingT > 0);
}

export function run(sim, ticks, keepEvents = false) {
  for (let i = 0; i < ticks && sim.status === 'running'; i++) {
    step(sim);
    if (!keepEvents) sim.ev.length = 0;
  }
  if (sim.status !== 'running') sim.ev.length = keepEvents ? sim.ev.length : 0;
}

export function snapshot(sim) {
  const { ev: _ev, ...rest } = sim;
  return JSON.parse(JSON.stringify(rest));
}
export function restore(snap) {
  return { ...JSON.parse(JSON.stringify(snap)), ev: [] };
}
