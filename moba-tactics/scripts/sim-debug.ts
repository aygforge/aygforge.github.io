import { Match } from '../src/match';
import { botDraft } from '../src/ai/draft';
import { Rng } from '../src/core/rng';
import { CHAMP_BY_ID } from '../src/data/champions';
import { regionOf } from '../src/core/map';

const seed = Number(process.argv[2] ?? 1017);
const rng = new Rng(seed);
const t0 = botDraft(rng, 'aggressive'), t1 = botDraft(rng, 'controlled');
const m = new Match({ seed, teams: [t0, t1] }, [{ team: 0, difficulty: 'normal', personality: 'aggressive' }, { team: 1, difficulty: 'normal', personality: 'controlled' }]);
const w = m.world;
const counts: Record<string, number> = {};
while (!w.over && w.time < 900) {
  m.step();
  for (const e of w.drainEvents()) {
    counts[e.t] = (counts[e.t] ?? 0) + 1;
    if (e.t === 'alert') console.log(`  [${w.time.toFixed(0)}s] ${e.text}`);
    if (e.t === 'order') console.log(`  [${w.time.toFixed(0)}s] order team${e.team} ${CHAMP_BY_ID[w.get(e.id!)!.sub].name} -> ${e.k}`);
    if (e.t === 'cast' && w.get(e.id!)?.kind === 'champion') counts['cast_' + w.get(e.id!)!.sub + '_' + e.k] = (counts['cast_' + w.get(e.id!)!.sub + '_' + e.k] ?? 0) + 1;
  }
  if (w.tick % 1200 === 0) {
    console.log(`--- ${(w.time / 60).toFixed(0)} min TP ${w.teams[0].tp.toFixed(0)}/${w.teams[1].tp.toFixed(0)}`);
    for (const c of w.champions()) {
      const ch = c.champ!;
      console.log(`  T${c.team} ${CHAMP_BY_ID[c.sub].name.padEnd(7)} ${ch.position.padEnd(6)} L${ch.level} xp${ch.xp.toFixed(0)} g${ch.gold.toFixed(0)}/${ch.totalGold.toFixed(0)} cs${ch.cs} ${ch.kills}/${ch.deaths}/${ch.assists} hp${c.hp.toFixed(0)}/${c.stats.maxHp.toFixed(0)} ${c.alive ? regionOf(c.x, c.y) : 'DEAD'} ord=${ch.order} inv=${ch.inventory.map((s) => s.kind === 'item' ? s.itemId : s.code).join(',')}`);
    }
    const tw = w.units.filter((u) => u.isStructure).map((u) => `${u.team}${u.lane ?? 'C'}${u.tier[0] ?? ''}:${u.alive ? u.hp.toFixed(0) : 'X'}`);
    console.log('  ' + tw.join(' '));
    console.log('  minions', w.units.filter((u) => u.alive && u.kind === 'minion').length, 'monsters', w.units.filter((u) => u.alive && u.kind === 'monster').length);
  }
}
console.log('winner', w.winner, 'time', (w.time / 60).toFixed(2));
console.log(Object.entries(counts).filter(([k]) => k.startsWith('cast_')).map(([k, v]) => `${k}=${v}`).join(' '));
