// Alpha 0.5A kısa smoke (3 koşu): L22 kabuk, L29 çift final, L30 Koca Mantar — deterministik tohum, "good" bot.
import { simulateRun } from './simlib.mjs';
import { defaultSave } from '../../src/systems/SaveService.js';

for (const id of ['L22', 'L29', 'L30']) {
  const r = simulateRun({ chapterId: id, seed: 5151, policy: 'good', pickPolicy: 'random', save: defaultSave() });
  const run = r.run;
  const finals = run.enemies.filter((e) => e.boss);
  console.log(JSON.stringify({
    id, finished: r.ctl.finished, results: r.log.results, victory: r.result?.victory, stars: r.result?.stars, turns: run.turn,
    waves: run.stats.completedWaves, picks: Object.values(run.abilities).reduce((a, b) => a + b, 0), recipe: run.recipe,
    finals: finals.map((f) => ({ type: f.type, hp: f.maxHp, dead: f.dead })), summoned: run.enemies.filter((e) => e.summonedBy).length,
    hpLost: run.stats.hpLost, errors: r.log.errors.length,
  }));
}
