// Alpha 0.4B kısa smoke: 2 dungeon + 3 level (ekipmansız/ekipmanlı), deterministik tohum, okuyan "good" bot.
import { simulateRun } from './simlib.mjs';
import { defaultSave } from '../../src/systems/SaveService.js';

const rare = () => {
  const s = defaultSave();
  Object.assign(s.equipment, { weapon: 'rare', ladle: 'rare', apron: 'rare', pan: 'rare' });
  return s;
};
const jobs = [
  ['D_gold_kitchen', defaultSave(), 'common'],
  ['D_materials_depot', defaultSave(), 'common'],
  ['L10', defaultSave(), 'common'],
  ['L20', defaultSave(), 'common'],
  ['L20', rare(), 'rare x4'],
];
for (const [id, save, eq] of jobs) {
  const r = simulateRun({ chapterId: id, seed: 4141, policy: 'good', pickPolicy: 'random', save });
  const run = r.run;
  const fin = run.enemies.find((e) => e.boss);
  console.log(JSON.stringify({
    id, equipment: eq, finished: r.ctl.finished, results: r.log.results, victory: r.result?.victory, turns: run.turn,
    waves: run.stats.completedWaves, picks: Object.values(run.abilities).reduce((a, b) => a + b, 0), chefMaxHp: run.chef.maxHp,
    radius: r.ctl.ladle.params.radius, eqProcs: { weapon: run.counters.weaponShot != null, panBonus: run.stats.shots },
    final: fin && { type: fin.type, hp: fin.maxHp, shield: fin.maxShield, dead: fin.dead }, hpLost: run.stats.hpLost, errors: r.log.errors.length,
  }));
}
