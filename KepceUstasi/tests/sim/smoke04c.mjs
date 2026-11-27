// Alpha 0.4C kısa smoke (3 koşu): L1 (3 dalga), L9 (çift elit), L20 (Patates Kral), deterministik tohum.
import { simulateRun } from './simlib.mjs';
import { defaultSave } from '../../src/systems/SaveService.js';

for (const id of ['L1', 'L9', 'L20']) {
  const r = simulateRun({ chapterId: id, seed: 4141, policy: 'good', pickPolicy: 'random', save: defaultSave() });
  const run = r.run;
  const finals = run.enemies.filter((e) => e.boss);
  console.log(JSON.stringify({
    id, finished: r.ctl.finished, results: r.log.results, victory: r.result?.victory, turns: run.turn,
    waves: run.stats.completedWaves, picks: Object.values(run.abilities).reduce((a, b) => a + b, 0),
    finals: finals.map((f) => ({ type: f.type, hp: f.maxHp, shield: f.maxShield, dead: f.dead })), hpLost: run.stats.hpLost, errors: r.log.errors.length,
  }));
}
