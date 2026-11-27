// Alpha 0.4A kısa deterministik smoke: 5 level × 1 koşu (aynı tohum, okuyan "good" bot, rastgele kart).
import { simulateRun } from './simlib.mjs';
import { stageByLevel } from '../../src/data/stages.js';
import { defaultSave } from '../../src/systems/SaveService.js';
import { applyStageResult } from '../../src/systems/Progression.js';

const save = defaultSave();
for (const lvl of [1, 5, 10, 15, 20]) {
  const st = stageByLevel(lvl);
  const r = simulateRun({ chapterId: st.id, seed: 4040 + lvl, policy: 'good', pickPolicy: 'random' });
  const run = r.run;
  const final = run.enemies.find((e) => e.boss);
  const picks = Object.values(run.abilities).reduce((a, b) => a + b, 0);
  const out = r.result ? applyStageResult(save, st, run, r.result) : null;
  console.log(JSON.stringify({
    level: lvl, type: st.stageType, finished: r.ctl.finished, results: r.log.results, victory: r.result?.victory, stars: r.result?.stars,
    turns: run.turn, wavesCleared: run.stats.completedWaves, picks, final: final && { type: final.type, maxHp: final.maxHp, shield: final.maxShield, dead: final.dead },
    hpLost: run.stats.hpLost, tips: out?.reward?.total, errors: r.log.errors.length,
  }));
}
