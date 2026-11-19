#!/usr/bin/env node
// Headless balance simulator: thousands of virtual fights, no graphics.
// Usage: node tools/simulate-balance/simulate.js [--minutes 30] [--quick]
import { createSim, run, takeAcc } from '../../shared/combat/sim.js';
import { makeStats } from '../../shared/testkit.js';
import { REGIONS, BOSS_ENCOUNTERS, DUNGEONS } from '../../shared/data/regions.js';
import { BALANCE } from '../../shared/data/balance.js';
import { RARITIES } from '../../shared/data/rarities.js';
import { xpToNext, upgradeCost, npcSellValue } from '../../shared/formulas.js';

const args = process.argv.slice(2);
const MIN = Number(args[args.indexOf('--minutes') + 1]) || 20;
const QUICK = args.includes('--quick');
const TPS = 1000 / BALANCE.TICK_MS;

export function farmRun(cls, level, zoneId, rarity, minutes, seed = 7) {
  const stats = makeStats(cls, level, rarity, seed);
  const sim = createSim({ seed: seed * 7919 + level, mode: 'farm', zoneId, stats, deathRule: 'continue' });
  run(sim, Math.round(minutes * 60 * TPS));
  const a = takeAcc(sim);
  const h = minutes / 60;
  const rar = [0, 0, 0, 0, 0, 0, 0];
  let items = 0, valuable = 0;
  for (const l of a.loot) if (l.t === 'item') { items++; rar[l.item.rarity]++; if (l.item.rarity >= 3) valuable++; }
  return {
    cls, level, zoneId, rarity,
    dps: Math.round(a.dmgDealt / (minutes * 60)),
    killsPerHour: Math.round(a.kills / h), avgKillS: +(minutes * 60 / Math.max(1, a.kills)).toFixed(2),
    xpPerHour: Math.round(a.xp / h), goldPerHour: Math.round(a.gold / h),
    deathsPerHour: +(a.deaths / h).toFixed(2), itemsPerHour: +(items / h).toFixed(1), valuablePerHour: +(valuable / h).toFixed(2),
    rarity: rar, hoursToLevel: +(xpToNext(level) / Math.max(1, a.xp / h)).toFixed(2),
    estDps: stats.estDps, maxHp: stats.maxHp,
  };
}

export function bossRun(cls, level, bossId, rarity, seed = 3) {
  const stats = makeStats(cls, level, rarity, seed);
  const sim = createSim({ seed, mode: 'boss', bossId, stats });
  run(sim, 200 * TPS);
  return { won: sim.status === 'won', seconds: +(sim.t / TPS).toFixed(1), status: sim.status };
}

export function dungeonRun(cls, level, difficulty, rarity, seed = 5) {
  const stats = makeStats(cls, level, rarity, seed);
  const sim = createSim({ seed, mode: 'dungeon', dungeonId: 'rotting_roots', difficulty, stats });
  run(sim, 600 * TPS);
  return { won: sim.status === 'won', seconds: +(sim.t / TPS).toFixed(1), status: sim.status };
}

function table(rows, cols) {
  console.log(cols.join('\t'));
  for (const r of rows) console.log(cols.map((c) => (Array.isArray(r[c]) ? r[c].join('/') : r[c])).join('\t'));
}

function main() {
  const classes = ['warrior', 'ranger', 'mage'];
  console.log(`# VARNETH balance simulation — ${MIN} simulated minutes per farm run\n`);
  console.log('## Farm efficiency (gear: Uncommon, item level = character level)');
  const rows = [];
  const zones = [['abandoned_road', 3], ['broken_mill', 8], ['forest_path', 13], ['dark_grove', 18], ['old_mine', 23], ['forgotten_forge', 28]];
  for (const [z, L] of QUICK ? zones.slice(0, 3) : zones) for (const c of classes) rows.push(farmRun(c, L, z, 1, MIN));
  table(rows, ['cls', 'level', 'zoneId', 'dps', 'avgKillS', 'killsPerHour', 'xpPerHour', 'goldPerHour', 'deathsPerHour', 'itemsPerHour', 'valuablePerHour', 'hoursToLevel']);

  console.log('\n## Gear quality impact (Lv18 Karanlık Koruluk)');
  const q = [];
  for (const c of classes) for (const r of [0, 1, 2, 3]) q.push({ ...farmRun(c, 18, 'dark_grove', r, MIN / 2), gear: RARITIES[r].name });
  table(q, ['cls', 'gear', 'dps', 'avgKillS', 'deathsPerHour', 'xpPerHour']);

  console.log('\n## Overlevel farming (Lv30 in Terk Edilmiş Yol)');
  table(classes.map((c) => farmRun(c, 30, 'abandoned_road', 2, MIN / 2)), ['cls', 'avgKillS', 'xpPerHour', 'goldPerHour']);

  console.log('\n## Bosses (10 seeds each; win rate / avg seconds)');
  const bossRows = [];
  for (const [bossId, enc] of Object.entries(BOSS_ENCOUNTERS)) for (const c of classes) for (const r of [1, 2]) {
    let wins = 0, secs = 0;
    for (let s = 1; s <= (QUICK ? 4 : 10); s++) { const b = bossRun(c, enc.level, bossId, r, s); if (b.won) { wins++; secs += b.seconds; } }
    bossRows.push({ boss: bossId, cls: c, gear: RARITIES[r].name, winRate: wins / (QUICK ? 4 : 10), avgS: wins ? Math.round(secs / wins) : '-' });
  }
  table(bossRows, ['boss', 'cls', 'gear', 'winRate', 'avgS']);

  console.log('\n## Dungeon Çürüyen Kökler');
  const dRows = [];
  for (const c of classes) for (const [d, L, r] of [['normal', 22, 1], ['normal', 22, 2], ['heroic', 28, 2], ['heroic', 30, 3]]) {
    let wins = 0, secs = 0;
    for (let s = 1; s <= (QUICK ? 3 : 6); s++) { const x = dungeonRun(c, L, d, r, s); if (x.won) { wins++; secs += x.seconds; } }
    dRows.push({ cls: c, diff: d, level: L, gear: RARITIES[r].name, winRate: +(wins / (QUICK ? 3 : 6)).toFixed(2), avgS: wins ? Math.round(secs / wins) : '-' });
  }
  table(dRows, ['cls', 'diff', 'level', 'gear', 'winRate', 'avgS']);

  console.log('\n## Leveling time estimate 1→30 (active farm in level-appropriate zone, Uncommon gear)');
  let total = 0;
  const zoneFor = (L) => (L <= 5 ? 'abandoned_road' : L <= 10 ? 'broken_mill' : L <= 15 ? 'forest_path' : L <= 20 ? 'dark_grove' : L <= 25 ? 'old_mine' : 'forgotten_forge');
  const perClass = {};
  for (const c of classes) {
    let t = 0;
    for (let L = 1; L < 30; L += QUICK ? 4 : 2) {
      const r = farmRun(c, L, zoneFor(L), 1, QUICK ? 5 : 8, L);
      const span = QUICK ? 4 : 2;
      for (let k = L; k < Math.min(30, L + span); k++) t += xpToNext(k) / Math.max(1, r.xpPerHour);
    }
    perClass[c] = +t.toFixed(1);
    total += t;
  }
  console.log(perClass, '(hours, excludes quest XP)');

  console.log('\n## Economy: gold sinks vs income (per character to Lv30)');
  const income = rows.reduce((s, r) => s + r.goldPerHour, 0) / rows.length;
  const sampleItem = { item_level: 30, rarity: 3, upgrade: 0 };
  let upg = 0;
  for (let u = 0; u < 10; u++) upg += upgradeCost({ ...sampleItem, upgrade: u }).gold;
  console.log({ avgGoldPerHour: Math.round(income), estHoursTo30: +(total / 3).toFixed(1), estGoldTo30: Math.round(income * total / 3), cost_epic_lv30_plus10: upg, npcValue_epic_lv30: npcSellValue(sampleItem) });
}

if (process.argv[1] && process.argv[1].endsWith('simulate.js')) main();
