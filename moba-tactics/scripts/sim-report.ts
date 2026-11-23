import { runHeadless } from '../src/match';
import { botDraft } from '../src/ai/draft';
import { Rng } from '../src/core/rng';
import type { Personality, Difficulty } from '../src/ai/botCommander';
import { CHAMP_BY_ID } from '../src/data/champions';

const n = Number(process.argv[2] ?? 6);
const pers: Personality[] = ['aggressive', 'controlled', 'objective'];
const diffs: Difficulty[] = ['easy', 'normal', 'hard'];
const times: number[] = [];
for (let i = 0; i < n; i++) {
  const seed = 1000 + i * 17;
  const rng = new Rng(seed);
  const p0 = pers[i % 3], p1 = pers[(i + 1) % 3];
  const t0 = botDraft(rng, p0), t1 = botDraft(rng, p1);
  const t = Date.now();
  const tk: string[] = [];
  const r = runHeadless({ seed, teams: [t0, t1] }, [{ team: 0, difficulty: diffs[i % 3], personality: p0 }, { team: 1, difficulty: 'normal', personality: p1 }], 1500, (m) => { const w = m.world; if (w.tick % 20 === 0) { const k = w.teams[0].towersKilled + w.teams[1].towersKilled; if (k > tk.length) tk.push((w.time / 60).toFixed(1)); } });
  times.push(r.time);
  const names = (ts: typeof t0) => ts.picks.map((p) => CHAMP_BY_ID[p.champId].name).join('/');
  console.log(`#${i} seed=${seed} ${names(t0)} vs ${names(t1)} -> winner=${r.winner} t=${(r.time / 60).toFixed(2)}m kills=${r.kills} towers=${r.towers} lv=${r.levels} gold=${r.gold} (${Date.now() - t}ms) towersAt=${tk.join(',')}`);
}
console.log('avg min', (times.reduce((a, b) => a + b, 0) / times.length / 60).toFixed(2));
