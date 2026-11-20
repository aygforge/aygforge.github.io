// Denge deneyi (yalnızca RAPOR içindir — oyun verisini değiştirmez).
// GDD sayıları ile birkaç alternatif ayarı aynı tohumlarla karşılaştırır.
// Kullanım: node tests/sim/balance.mjs [runsPerVariant=16] [policy=random]
import { simulateRun } from './simlib.mjs';
import { ENEMIES, FIELD, LADLE } from '../../src/data/content.js';

const N = Number(process.argv[2] || 16);
const policy = process.argv[3] || 'random';
const base = JSON.parse(JSON.stringify({ ENEMIES, FIELD, LADLE }));

function reset() {
  for (const k of Object.keys(base.ENEMIES)) Object.assign(ENEMIES[k], base.ENEMIES[k]);
  Object.assign(FIELD, base.FIELD);
  Object.assign(LADLE, base.LADLE);
}

const variants = {
  'GDD (mevcut)': () => {},
  'Spawn x≈0.62 (4 adım)': () => Object.assign(FIELD, { spawnXMin: 0.6, spawnXMax: 0.66 }),
  'Düşman HP x1.6': () => {
    for (const e of Object.values(ENEMIES)) e.hp = Math.round(e.hp * 1.6);
  },
  'Spawn x≈0.62 + HP x1.6': () => {
    Object.assign(FIELD, { spawnXMin: 0.6, spawnXMax: 0.66 });
    for (const e of Object.values(ENEMIES)) e.hp = Math.round(e.hp * 1.6);
  },
};

const out = [];
for (const [name, apply] of Object.entries(variants)) {
  reset();
  apply();
  let wins = 0;
  let hp = 0;
  let turns = 0;
  const stars = [0, 0, 0, 0];
  for (let i = 1; i <= N; i++) {
    const r = simulateRun({ chapterId: i % 2 ? 'menemen' : 'fries', seed: 5000 + i, policy, pickPolicy: 'random', maxSteps: 150000 });
    if (r.result?.victory) wins++;
    stars[r.result?.stars || 0]++;
    hp += r.run.stats.hpLost;
    turns += r.run.turn;
  }
  out.push({ variant: name, policy, runs: N, winRate: +(wins / N).toFixed(2), avgHpLost: +(hp / N).toFixed(2), avgTurns: +(turns / N).toFixed(1), stars });
}
reset();
console.table(out);
console.log(JSON.stringify(out));
