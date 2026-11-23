import { Match } from '../src/match';
import { botDraft } from '../src/ai/draft';
import { Rng } from '../src/core/rng';
import { CHAMP_BY_ID } from '../src/data/champions';
import { regionOf } from '../src/core/map';
import { structureAttackable } from '../src/core/combat';
const seed = Number(process.argv[2] ?? 1000);
const rng = new Rng(seed);
const t0 = botDraft(rng, 'aggressive'), t1 = botDraft(rng, 'controlled');
const m = new Match({ seed, teams: [t0, t1] }, [{ team: 0, difficulty: 'easy', personality: 'aggressive' }, { team: 1, difficulty: 'normal', personality: 'controlled' }]);
const w = m.world;
while (!w.over && w.time < 1500) {
  m.step(); w.drainEvents();
  if (w.tick % 600 === 0) {
    const cr = w.units.filter((u) => u.kind === 'crystal');
    const line = cr.map((c) => `C${c.team}:${c.hp.toFixed(0)} att=${structureAttackable(w, c)}`).join(' ');
    const nearC = cr.map((c) => w.units.filter((u) => u.alive && u.team !== c.team && u.team !== 2 && Math.hypot(u.x - c.x, u.y - c.y) < 600).map((u) => u.kind[0] + (u.kind === 'champion' ? u.sub : '')).join(','));
    console.log(`${(w.time / 60).toFixed(1)}m ${line} near0=[${nearC[0]}] near1=[${nearC[1]}] towers=${w.teams[0].towersKilled},${w.teams[1].towersKilled}`);
    for (const c of w.champions()) console.log(`   T${c.team} ${c.sub} ${c.alive ? regionOf(c.x, c.y) : 'dead'} ${c.champ!.order} hp${(c.hp / c.stats.maxHp * 100).toFixed(0)} x${c.x.toFixed(0)} y${c.y.toFixed(0)} ret=${c.ai.retreating}`);
  }
}
