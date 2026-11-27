// V1.0 kısa smoke: L31, L40, L60, L80, L120, Boss Mutfağı, Kule ilk blok — deterministik tohum, "good" bot.
// Geç level'lar bölüme uygun hazırlanmış (ekipman + güçlendirme) bir kayıtla oynanır; tek koşu/hedef, 120 level baştan değil.
import { simulateRun } from './simlib.mjs';
import { defaultSave } from '../../src/systems/SaveService.js';
import { chefPower } from '../../src/systems/Progression.js';
import { stageByLevel } from '../../src/data/stages.js';

const geared = (rar, lvl, up) => {
  const s = defaultSave();
  Object.assign(s.equipment, { weapon: rar, ladle: rar, apron: rar, pan: rar });
  s.equipLevels = { weapon: lvl, ladle: lvl, apron: lvl, pan: lvl };
  for (const k of Object.keys(s.upgrades)) s.upgrades[k] = up;
  return s;
};
const jobs = [
  ['L31', geared('rare', 0, 4)],
  ['L40', geared('rare', 6, 5)],
  ['L60', geared('epic', 14, 6)],
  ['L80', geared('epic', 22, 6)],
  ['L120', geared('legendary', 30, 6)],
  ['D_boss_kitchen:10,20,30', geared('rare', 4, 4)],
  ['T_tower:0', geared('rare', 4, 4)],
];
for (const [id, save] of jobs) {
  const r = simulateRun({ chapterId: id, seed: 1201, policy: 'good', pickPolicy: 'random', save });
  const run = r.run;
  const fin = run.enemies.filter((e) => e.boss);
  console.log(JSON.stringify({
    id, sg: chefPower(save), rec: id.startsWith('L') ? stageByLevel(Number(id.slice(1))).recommendedChefPower : null,
    finished: r.ctl.finished, results: r.log.results, victory: r.result?.victory, stars: r.result?.stars, turns: run.turn, waves: run.stats.completedWaves,
    finals: fin.map((f) => [f.type, f.maxHp, f.dead]), summoned: run.enemies.filter((e) => e.summonedBy).length, hpLost: run.stats.hpLost, errors: r.log.errors.length,
  }));
}
