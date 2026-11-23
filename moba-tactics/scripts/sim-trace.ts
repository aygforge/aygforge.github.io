import { Match } from '../src/match';
import { botDraft } from '../src/ai/draft';
import { Rng } from '../src/core/rng';
import { regionOf } from '../src/core/map';
import type { Personality, Difficulty } from '../src/ai/botCommander';
const i = Number(process.argv[2] ?? 4);
const from = Number(process.argv[3] ?? 0), to = Number(process.argv[4] ?? 1500), every = Number(process.argv[5] ?? 30);
const pers: Personality[] = ['aggressive', 'controlled', 'objective'];
const diffs: Difficulty[] = ['easy', 'normal', 'hard'];
const seed = 1000 + i * 17;
const rng = new Rng(seed);
const p0 = pers[i % 3], p1 = pers[(i + 1) % 3];
const t0 = botDraft(rng, p0), t1 = botDraft(rng, p1);
const m = new Match({ seed, teams: [t0, t1] }, [{ team: 0, difficulty: diffs[i % 3], personality: p0 }, { team: 1, difficulty: 'normal', personality: p1 }]);
const w = m.world;
while (!w.over && w.time < to) {
  m.step();
  for (const e of w.drainEvents()) if (w.time >= from && (e.t === 'alert')) console.log(`  [${w.time.toFixed(0)}] ${e.text}`);
  if (w.time >= from && w.tick % (every * 20) === 0) {
    const tw = w.units.filter((u) => u.isStructure).map((u) => `${u.team}${u.lane ?? 'C'}${u.tier[0] ?? ''}:${u.alive ? u.hp.toFixed(0) : 'X'}`);
    console.log(`${(w.time / 60).toFixed(2)}m ${tw.join(' ')} mins=${w.units.filter((u) => u.alive && u.kind === 'minion' && u.team === 0).length}/${w.units.filter((u) => u.alive && u.kind === 'minion' && u.team === 1).length}`);
    for (const c of w.champions()) console.log(`   T${c.team} ${c.sub.padEnd(7)} L${c.champ!.level} ${(c.alive ? regionOf(c.x, c.y) : 'dead').padEnd(6)} ${c.champ!.order.padEnd(7)} hp${(c.hp / c.stats.maxHp * 100).toFixed(0).padStart(3)} (${c.x.toFixed(0)},${c.y.toFixed(0)}) ret=${!!c.ai.retreating} int=${c.ai.intent?.type}${c.ai.intent?.id ? ':' + w.get(c.ai.intent.id)?.kind : ''} items=${c.champ!.inventory.length}`);
  }
}
console.log('winner', w.winner, (w.time / 60).toFixed(2));
