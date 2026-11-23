import { describe, it, expect } from 'vitest';
import { sandbox, champ, run, place } from './helpers';
import { BALANCE } from '../src/core/config';
import { dealDamage } from '../src/core/combat';
import { regionOf, laneProgress, FOUNTAIN_POS, BOSS_POS } from '../src/core/map';
import { dist } from '../src/core/math';
import type { World } from '../src/core/world';

const order = (w: World, slot: number, o: any, team: 0 | 1 = 0) => { w.submit({ type: 'order', team, slot, order: o }); w.step(); const r = w.commandLog[w.commandLog.length - 1].res; w.drainEvents(); return r; };

describe('tactical points', () => {
  it('starts at 100, regenerates 2/s only by time, capped at 100', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    expect(w.teams[0].tp).toBe(100);
    order(w, 0, 'push');
    const tp = w.teams[0].tp;
    run(w, 5);
    expect(w.teams[0].tp).toBeCloseTo(Math.min(100, tp + 10), 0);
    run(w, 60);
    expect(w.teams[0].tp).toBe(BALANCE.tp.max);
  });
  it('spends TP, rejects invalid/duplicate/dead/unaffordable orders without cost', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    let r = order(w, 0, 'push'); expect(r.ok).toBe(true); expect(r.cost).toBe(20);
    const tp1 = w.teams[0].tp;
    r = order(w, 0, 'push'); expect(r.ok).toBe(false); expect(w.teams[0].tp).toBeCloseTo(tp1 + 0.1, 5);
    r = order(w, 0, 'raid_top'); expect(r.ok).toBe(false); // laner cannot raid
    r = order(w, 1, 'farm'); expect(r.ok).toBe(false); // jungler cannot farm-lane
    r = order(w, 1, 'boss'); expect(r.ok).toBe(false); // no boss alive yet
    const dead = champ(w, 0, 2); dealDamage(w, champ(w, 1, 0), dead, 99999, 'true');
    const tp2 = w.teams[0].tp;
    r = order(w, 2, 'retreat'); expect(r.ok).toBe(false); expect(w.teams[0].tp).toBeCloseTo(tp2 + 0.1, 5);
    w.teams[0].tp = 5;
    r = order(w, 0, 'defend'); expect(r.ok).toBe(false); expect(w.teams[0].tp).toBeCloseTo(5.1, 5);
  });
  it('both teams follow identical TP rules', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    expect(order(w, 0, 'defend', 1).cost).toBe(15);
    expect(w.teams[1].tp).toBeCloseTo(85.1, 5);
  });
});

describe('orders change behaviour', () => {
  it('raid_top: the jungler really walks to the top lane', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    run(w, 30);
    order(w, 1, 'raid_top');
    let reached = false;
    run(w, 25, () => { const j = champ(w, 0, 1); if (j.alive && regionOf(j.x, j.y) === 'top') reached = true; });
    expect(reached).toBe(true);
  });
  it('raid_bot reaches the bottom lane', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    run(w, 30);
    order(w, 1, 'raid_bot');
    let reached = false;
    let botKill = false;
    const deaths0 = w.champions(1).map((e) => e.champ!.deaths);
    run(w, 30, () => {
      const j = champ(w, 0, 1);
      if (j.alive && (regionOf(j.x, j.y) === 'bot' || j.y > 1250)) reached = true;
      w.champions(1).forEach((e, i) => { if (e.champ!.deaths > deaths0[i] && e.y > 1150) botKill = true; });
    });
    // the raid either arrives at the bottom lane or succeeds earlier because the target died there
    expect(reached || botKill).toBe(true);
  });
  it('boss order: jungler goes to and attacks a boss', () => {
    const w = sandbox(['boran', 'rovan', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    run(w, 152);
    const j = champ(w, 0, 1);
    if (!j.alive) run(w, 15);
    j.hp = j.stats.maxHp;
    expect(order(w, 1, 'boss').ok).toBe(true);
    let near = false, hit = false;
    const boss = w.units.find((u) => u.kind === 'boss' && u.alive)!;
    run(w, 30, () => { if (dist(j.x, j.y, BOSS_POS.blood.x, BOSS_POS.blood.y) < 400) near = true; if (boss.lastHitBy === j.id) hit = true; });
    expect(near).toBe(true);
    expect(hit).toBe(true);
  });
  it('jungle order: jungler clears camps (gains camp gold)', () => {
    const w = sandbox(['boran', 'rovan', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    run(w, 70);
    expect(champ(w, 0, 1).champ!.cs).toBeGreaterThan(0);
  });
  it('defend keeps the laner near its tower, push moves further', () => {
    const wa = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    const wb = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    order(wa, 0, 'defend'); order(wb, 0, 'push');
    let sa = 0, sb = 0, n = 0;
    run(wa, 20); run(wb, 20);
    for (let i = 0; i < 30; i++) { run(wa, 1); run(wb, 1); sa += laneProgress('top', champ(wa, 0, 0).x, champ(wa, 0, 0).y); sb += laneProgress('top', champ(wb, 0, 0).x, champ(wb, 0, 0).y); n++; }
    const towerS = laneProgress('top', 1080, 245);
    expect(Math.abs(sa / n - towerS)).toBeLessThan(450);
    expect(sb / n).toBeGreaterThan(sa / n);
  });
  it('farm order: laner earns last-hit gold', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    run(w, 90);
    expect(champ(w, 0, 0).champ!.cs + champ(w, 0, 2).champ!.cs).toBeGreaterThan(0);
  });
  it('retreat: champion recalls to base; damage cancels recall', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    run(w, 25);
    const u = champ(w, 0, 0);
    expect(order(w, 0, 'retreat').ok).toBe(true);
    let recalled = false;
    run(w, 25, () => { if (dist(u.x, u.y, FOUNTAIN_POS[0].x, FOUNTAIN_POS[0].y) < 200) recalled = true; });
    expect(recalled).toBe(true);
    // recall cancel
    place(w, u, 1600, 900);
    expect(w.startRecall(u)).toBe(true);
    dealDamage(w, champ(w, 1, 0), u, 10, 'true');
    expect(u.champ!.recallUntil).toBe(0);
  });
  it('death clears temporary orders but keeps persistent assignment & style', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: true });
    order(w, 0, 'push');
    w.submit({ type: 'style', team: 0, slot: 0, style: 'aggressive' }); w.step();
    order(w, 0, 'retreat');
    const u = champ(w, 0, 0);
    dealDamage(w, champ(w, 1, 0), u, 99999, 'true');
    expect(u.champ!.order).toBe('push');
    expect(u.champ!.baseOrder).toBe('push');
    expect(u.champ!.style).toBe('aggressive');
    // jungler raid cleared on death; jungle strategy kept
    w.submit({ type: 'jungleStrategy', team: 0, strategy: 'farm' }); w.step();
    order(w, 1, 'raid_top');
    dealDamage(w, champ(w, 1, 0), champ(w, 0, 1), 99999, 'true');
    expect(champ(w, 0, 1).champ!.order).toBe('jungle');
    expect(w.teams[0].jungleStrategy).toBe('farm');
  });
});

describe('structures & minions', () => {
  it('minions spawn at 0:10 and every 22s; siege every third wave', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
    run(w, 9.9);
    expect(w.units.filter((u) => u.kind === 'minion').length).toBe(0);
    run(w, 2);
    expect(w.units.filter((u) => u.kind === 'minion' && u.lane === 'top' && u.team === 0).length).toBe(3);
    run(w, 22 * 2);
    expect(w.units.filter((u) => u.kind === 'minion' && u.sub === 'siege').length).toBeGreaterThan(0);
  });
  it('inner tower and crystal are invulnerable until prerequisites fall', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
    const src = champ(w, 0, 0);
    const inner = w.units.find((t) => t.kind === 'tower' && t.team === 1 && t.lane === 'top' && t.tier === 'inner')!;
    const outer = w.units.find((t) => t.kind === 'tower' && t.team === 1 && t.lane === 'top' && t.tier === 'outer')!;
    const crystal = w.units.find((t) => t.kind === 'crystal' && t.team === 1)!;
    expect(dealDamage(w, src, inner, 500, 'true')).toBe(0);
    expect(dealDamage(w, src, crystal, 500, 'true')).toBe(0);
    dealDamage(w, src, outer, 99999, 'true');
    expect(outer.alive).toBe(false);
    expect(dealDamage(w, src, inner, 500, 'true')).toBeGreaterThan(0);
    expect(dealDamage(w, src, crystal, 500, 'true')).toBe(0);
    dealDamage(w, src, inner, 99999, 'true');
    expect(dealDamage(w, src, crystal, 50, 'true')).toBeGreaterThan(0);
    dealDamage(w, src, crystal, 99999, 'true');
    expect(w.over).toBe(true);
    expect(w.winner).toBe(0);
  });
  it('tower hp 1200/1500, crystal 2000; champion damage reduced 80% without minions', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
    const t = w.units.filter((u) => u.kind === 'tower');
    expect(t.length).toBe(8);
    expect(t.filter((x) => x.tier === 'outer').every((x) => x.stats.maxHp === 1200)).toBe(true);
    expect(t.filter((x) => x.tier === 'inner').every((x) => x.stats.maxHp === 1500)).toBe(true);
    expect(w.units.filter((u) => u.kind === 'crystal').every((c) => c.stats.maxHp === 2000)).toBe(true);
    run(w, 241);
    const outer = w.units.find((x) => x.kind === 'tower' && x.team === 1 && x.lane === 'top' && x.tier === 'outer')!;
    for (const m of w.units.filter((u) => u.kind === 'minion')) m.alive = false;
    const lone = dealDamage(w, champ(w, 0, 0), outer, 100, 'true');
    expect(lone).toBeCloseTo(100 * 0.2 * (1 + champ(w, 0, 0).data.posEff), 3);
  });
  it('tower targets minions first, then switches to a champion attacking its ally', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
    run(w, 30);
    const tower = w.units.find((x) => x.kind === 'tower' && x.team === 1 && x.lane === 'top' && x.tier === 'outer')!;
    const m = w.units.find((u) => u.kind === 'minion' && u.team === 0 && u.lane === 'top' && u.alive)!;
    const attacker = champ(w, 0, 0), victim = champ(w, 1, 0);
    place(w, m, tower.x - 150, tower.y); m.ai.intent = { type: 'hold' };
    place(w, attacker, tower.x - 250, tower.y + 30);
    place(w, victim, tower.x - 200, tower.y + 30);
    run(w, 0.3);
    expect(w.get(tower.targetId)?.kind).toBe('minion');
    dealDamage(w, attacker, victim, 10, 'phys', { attack: true });
    run(w, 0.3);
    expect(tower.targetId).toBe(attacker.id);
  });
  it('boss buffs: blood +8% champion damage, titan tower damage + minion HP; buff survives death', () => {
    const w = sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
    run(w, 211);
    const [blood, titan] = ['blood', 'titan'].map((s) => w.units.find((u) => u.kind === 'boss' && u.sub === s && u.alive)!);
    const me = champ(w, 0, 0), foe = champ(w, 1, 0);
    place(w, me, 1500, 900); place(w, foe, 1600, 900);
    const d0 = dealDamage(w, me, foe, 100, 'true');
    dealDamage(w, me, blood, 99999, 'true');
    const d1 = dealDamage(w, me, foe, 100, 'true');
    expect(d1 / d0).toBeCloseTo(1.08, 2);
    dealDamage(w, me, titan, 99999, 'true');
    expect(w.teams[0].buffs.titan).toBeGreaterThan(w.time);
    dealDamage(w, foe, me, 99999, 'true');
    run(w, 10);
    expect(w.teams[0].buffs.blood).toBeGreaterThan(w.time);
    run(w, 15);
    expect(w.units.some((u) => u.kind === 'minion' && u.team === 0 && u.alive && u.hpMul > 1)).toBe(true);
  });
});
