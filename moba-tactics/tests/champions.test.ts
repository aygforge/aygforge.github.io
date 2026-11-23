import { describe, it, expect } from 'vitest';
import { CHAMPIONS } from '../src/data/champions';
import { sandbox, champ, duel, setLevel, run, runCollect, place } from './helpers';
import { dealDamage } from '../src/core/combat';
import { getKit } from '../src/core/kits/registry';
import type { World } from '../src/core/world';
import type { Unit } from '../src/core/unit';
import type { CastPlan } from '../src/core/kits/types';

function snapshot(w: World, me: Unit, foe: Unit) {
  return {
    foeHp: foe.hp + foe.shieldTotal,
    meHp: me.hp,
    meShield: me.shieldTotal,
    foeStatus: foe.stunUntil + foe.rootUntil + foe.knockupUntil + foe.slows.length + foe.armorShred.length + foe.dots.length + Object.keys(foe.marks).length,
    meBuffs: me.asBuffs.length + me.msBuffs.length + me.dmgRed.length + me.stealthUntil + Object.values(me.champ!.passive).reduce((a, b) => a + (b || 0), 0),
    summons: w.units.filter((s) => s.alive && s.kind === 'summon' && s.ownerId === me.id).length,
    zones: w.zones.filter((z) => !z.dead).length,
    vision: w.zones.filter((z) => z.vision && !z.dead).length,
    pos: Math.round(me.x) * 10000 + Math.round(me.y),
  };
}

function planFor(key: 's1' | 's2' | 'ult', me: Unit, foe: Unit): CastPlan {
  return { tgt: foe, x: foe.x, y: foe.y };
}

describe('18 champions: passive, basic attack, skills, ult rules', () => {
  for (const d of CHAMPIONS) {
    describe(d.name, () => {
      it('basic attack deals damage (projectile/melee hit event)', () => {
        const w = sandbox([d.id, 'nyra', 'edrin'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).concat(['liris']).slice(0, 3), ['boran', 'korruk', 'tharok']);
        const me = champ(w, 0, 0), foe = champ(w, 1, 0);
        duel(w, me, foe, me.stats.range * 0.7 + 40);
        const hp0 = foe.hp + foe.shieldTotal;
        me.ai.intent = { type: 'attack', id: foe.id };
        const ev = runCollect(w, 2.5);
        expect(ev.some((e) => e.t === 'attack' && e.id === me.id)).toBe(true);
        expect(foe.hp + foe.shieldTotal).toBeLessThan(hp0);
      });

      for (const key of ['s1', 's2', 'ult'] as const) {
        it(`${key} casts and produces a real effect`, () => {
          const w = sandbox([d.id, d.id === 'nyra' ? 'zereth' : 'nyra', d.id === 'edrin' ? 'tessa' : 'edrin'], ['boran', 'korruk', 'tharok']);
          const me = champ(w, 0, 0), foe = champ(w, 1, 0);
          setLevel(w, me, 5);
          duel(w, me, foe, d.ranged ? 260 : 110);
          // make selda's parry and similar reactive skills observable
          const before = snapshot(w, me, foe);
          const ok = w.castSkill(me, key, planFor(key, me, foe));
          expect(ok).toBe(true);
          me.ai.intent = { type: 'hold' };
          let changed = false;
          for (let i = 0; i < 60 && !changed; i++) {
            run(w, 0.05);
            if (d.id === 'selda' && key === 's1' && i === 2) dealDamage(w, foe, me, 50, 'phys', { attack: true });
            const now = snapshot(w, me, foe);
            changed = (Object.keys(now) as (keyof typeof now)[]).some((k) => now[k] !== before[k]);
          }
          expect(changed).toBe(true);
          // cooldown started
          expect(me.champ!.cds[key]).toBeGreaterThan(w.time);
        });
      }

      it('ult is locked before level 5 and empowered at level 9', () => {
        const w = sandbox([d.id, d.id === 'nyra' ? 'zereth' : 'nyra', d.id === 'edrin' ? 'tessa' : 'edrin'], ['boran', 'korruk', 'tharok']);
        const me = champ(w, 0, 0), foe = champ(w, 1, 0);
        setLevel(w, me, 4);
        duel(w, me, foe, d.ranged ? 260 : 110);
        expect(w.skillReady(me, 'ult')).toBe(false);
        expect(w.castSkill(me, 'ult', planFor('ult', me, foe))).toBe(false);
        setLevel(w, me, 5);
        expect(w.skillReady(me, 'ult')).toBe(true);
        const kit = getKit(d.id);
        // rank-2 cooldown never longer, and level-9 casts use rank 2
        expect(kit.ult.cd(8, 2)).toBeLessThanOrEqual(kit.ult.cd(4, 1));
        setLevel(w, me, 9);
        const ev: any[] = [];
        expect(w.castSkill(me, 'ult', planFor('ult', me, foe))).toBe(true);
        ev.push(...w.drainEvents());
        expect(ev.find((e) => e.t === 'cast' && e.k === 'ult')?.v).toBe(2);
      });

      it('respawns after death with items and gold kept', () => {
        const w = sandbox([d.id, d.id === 'nyra' ? 'zereth' : 'nyra', d.id === 'edrin' ? 'tessa' : 'edrin'], ['boran', 'korruk', 'tharok']);
        const me = champ(w, 0, 0), foe = champ(w, 1, 0);
        setLevel(w, me, 3);
        me.champ!.inventory.push({ kind: 'comp', code: 'F', spent: 180 });
        const gold = me.champ!.gold;
        dealDamage(w, foe, me, 99999, 'true');
        expect(me.alive).toBe(false);
        expect(me.champ!.respawnAt - w.time).toBeGreaterThan(6);
        expect(me.champ!.respawnAt - w.time).toBeLessThan(20);
        run(w, 15);
        expect(me.alive).toBe(true);
        // the component bought before death is still owned (auto-shop may add more at base)
        expect(me.champ!.inventory.some((s) => s.kind === 'comp' && s.code === 'F') || me.champ!.inventory.some((s) => s.kind === 'item')).toBe(true);
        expect(me.champ!.totalGold).toBeGreaterThanOrEqual(gold);
      });

      it('AI moves the champion on its own (lane or jungle)', () => {
        const w = sandbox([d.id, d.id === 'nyra' ? 'zereth' : 'nyra', d.id === 'edrin' ? 'tessa' : 'edrin'], ['boran', 'korruk', 'tharok'], { ai: true });
        const me = champ(w, 0, 0);
        const x0 = me.x, y0 = me.y;
        run(w, 25);
        expect(Math.hypot(me.x - x0, me.y - y0)).toBeGreaterThan(300);
      });
    });
  }
});

describe('passives', () => {
  const w0 = () => sandbox(['boran', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
  it('Boran Siper: frontal damage is reduced', () => {
    const w = w0(); const b = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, b, e, 100);
    b.facing = 'right';
    const h0 = b.hp; dealDamage(w, e, b, 100, 'true'); const front = h0 - b.hp;
    b.facing = 'left';
    const h1 = b.hp; dealDamage(w, e, b, 100, 'true'); const back = h1 - b.hp;
    expect(front).toBeLessThan(back);
  });
  it('Korruk Taş Katmanları: stacks armor when hit', () => {
    const w = w0(); const k = champ(w, 1, 0), e = champ(w, 0, 0);
    duel(w, e, k);
    const a0 = k.stats.armor;
    for (let i = 0; i < 3; i++) { dealDamage(w, e, k, 30, 'phys'); run(w, 0.6); }
    expect(k.champ!.passive.stacks).toBeGreaterThan(1);
    expect(k.stats.armor).toBeGreaterThan(a0);
  });
  it('Tharok Zincir Damgası: more damage vs controlled targets', () => {
    const w = sandbox(['tharok', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const t = champ(w, 0, 0), e = champ(w, 1, 2);
    duel(w, t, e);
    const d1 = dealDamage(w, t, e, 100, 'true');
    e.slows.push({ amt: 0.3, until: w.time + 3 });
    const d2 = dealDamage(w, t, e, 100, 'true');
    expect(d2).toBeGreaterThan(d1 * 1.1);
  });
  it('Rovan Öfke raises attack speed', () => {
    const w = sandbox(['rovan', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const r = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, r, e, 100);
    const as0 = r.stats.as;
    r.ai.intent = { type: 'attack', id: e.id };
    run(w, 4);
    expect(r.champ!.passive.rage).toBeGreaterThan(2);
    expect(r.stats.as).toBeGreaterThan(as0);
  });
  it('Selda Zayıf Nokta stacks on the same target', () => {
    const w = sandbox(['selda', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const s = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, s, e, 100); s.ai.intent = { type: 'attack', id: e.id }; run(w, 4);
    expect(s.champ!.passive.wpStacks).toBeGreaterThanOrEqual(2);
  });
  it('Malvek Kan Borcu: more damage when low', () => {
    const w = sandbox(['malvek', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const m = champ(w, 0, 0), e = champ(w, 1, 2);
    duel(w, m, e);
    const a = dealDamage(w, m, e, 100, 'true');
    m.hp = m.stats.maxHp * 0.3;
    const b = dealDamage(w, m, e, 100, 'true');
    expect(b).toBeGreaterThan(a * 1.3);
  });
  it('Aşira Kor Birikimi explodes on the 3rd stack', () => {
    const w = sandbox(['asira', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const a = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, a, e, 200);
    const ev: any[] = [];
    for (const k of ['s1', 's1', 's1']) { dealDamage(w, a, e, 10, 'magic', { ability: k }); ev.push(...w.drainEvents()); }
    expect(ev.some((x) => x.t === 'vfx' && x.k === 'emberBurst')).toBe(true);
  });
  it('Liris Soğuk Mühür roots after 3 frost stacks', () => {
    const w = sandbox(['liris', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const l = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, l, e, 200);
    for (let i = 0; i < 3; i++) dealDamage(w, l, e, 10, 'magic', { ability: 's1' });
    expect(e.rootUntil).toBeGreaterThan(w.time);
  });
  it('Orun Yankı Mührü triggers on two different spells', () => {
    const w = sandbox(['orun', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const o = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, o, e, 200);
    dealDamage(w, o, e, 10, 'magic', { ability: 's1' });
    dealDamage(w, o, e, 10, 'magic', { ability: 's2' });
    const ev = runCollect(w, 0.3);
    expect(ev.some((x) => x.t === 'vfx' && x.k === 'echoSeal')).toBe(true);
  });
  it('Nyra Gölgeden Çıkış: bonus from stealth', () => {
    const w = sandbox(['nyra', 'zereth', 'edrin'], ['korruk', 'vaelis', 'tessa']); const n = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, n, e, 90);
    n.stealthUntil = w.time + 3;
    n.ai.intent = { type: 'attack', id: e.id };
    const ev = runCollect(w, 1.5);
    expect(ev.some((x) => x.t === 'vfx' && x.k === 'shadowStrike')).toBe(true);
  });
  it('Zereth Kara Toksin applies poison stacks', () => {
    const w = sandbox(['zereth', 'nyra', 'edrin'], ['korruk', 'vaelis', 'tessa']); const z = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, z, e, 100); z.ai.intent = { type: 'attack', id: e.id }; run(w, 3);
    expect(e.marks.poison).toBeGreaterThanOrEqual(2);
    expect(e.dots.length).toBeGreaterThan(0);
  });
  it('Vaelis Yarık Darbesi empowers the attack after a blink', () => {
    const w = sandbox(['vaelis', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const v = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, v, e, 400);
    expect(w.castSkill(v, 's1', { tgt: e })).toBe(true);
    run(w, 0.2);
    expect(v.champ!.passive.empowered).toBeGreaterThan(w.time);
  });
  it('Edrin Sabit Nişan increases range when standing still', () => {
    const w = sandbox(['edrin', 'nyra', 'tessa'], ['korruk', 'zereth', 'dorn']); const e = champ(w, 0, 0);
    e.champ!.stillSince = w.time;
    run(w, 0.1);
    const r0 = e.stats.range;
    run(w, 1.5);
    expect(e.stats.range).toBeGreaterThan(r0);
  });
  it('Tessa Seri Atış builds attack speed', () => {
    const w = sandbox(['tessa', 'nyra', 'edrin'], ['korruk', 'zereth', 'dorn']); const t = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, t, e, 250); const as0 = t.stats.as; t.ai.intent = { type: 'attack', id: e.id }; run(w, 3);
    expect(t.champ!.passive.rapid).toBeGreaterThan(1);
    expect(t.stats.as).toBeGreaterThan(as0);
  });
  it('Dorn Patlayıcı Mühimmat explodes every 3rd attack', () => {
    const w = sandbox(['dorn', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const d = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, d, e, 250); d.ai.intent = { type: 'attack', id: e.id };
    const ev = runCollect(w, 5);
    expect(ev.some((x) => x.t === 'vfx' && x.k === 'smallBoom')).toBe(true);
  });
  it('Rughan Sürü Bağı: permanent wolf companion that respawns', () => {
    const w = sandbox(['rughan', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const r = champ(w, 0, 0), e = champ(w, 1, 0);
    const wolf = w.units.find((s) => s.kind === 'summon' && s.ownerId === r.id && s.sub === 'wolf')!;
    expect(wolf).toBeTruthy();
    dealDamage(w, e, wolf, 99999, 'true');
    run(w, 16);
    expect(w.units.some((s) => s.alive && s.kind === 'summon' && s.ownerId === r.id && s.sub === 'wolf')).toBe(true);
  });
  it('Nekmar Ruh Kalıntısı reduces summon cooldown on nearby deaths', () => {
    const w = sandbox(['nekmar', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']); const n = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, n, e, 200);
    expect(w.castSkill(n, 's1', {})).toBe(true);
    run(w, 0.5);
    const cd0 = n.champ!.cds.s1;
    dealDamage(w, n, e, 99999, 'true');
    expect(n.champ!.cds.s1).toBeLessThan(cd0);
  });
  it('İlvara Rün Birikimi: sentry attacks generate energy', () => {
    const w = sandbox(['ilvara', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa'], { ai: false }); const il = champ(w, 0, 0), e = champ(w, 1, 0);
    duel(w, il, e, 250);
    expect(w.castSkill(il, 's1', { x: il.x + 60, y: il.y })).toBe(true);
    run(w, 6);
    expect(il.champ!.passive.energy ?? 0).toBeGreaterThan(0);
  });
  it('summons credit boss last hit to owner team', () => {
    const w = sandbox(['rughan', 'nyra', 'edrin'], ['korruk', 'zereth', 'tessa']);
    run(w, 151);
    const boss = w.units.find((u) => u.kind === 'boss' && u.alive)!;
    expect(boss).toBeTruthy();
    const r = champ(w, 0, 0);
    const wolf = w.units.find((s) => s.alive && s.kind === 'summon' && s.ownerId === r.id)!;
    place(w, wolf, boss.x + 60, boss.y);
    boss.hp = 5;
    dealDamage(w, wolf, boss, 50, 'phys', { attack: true });
    expect(w.teams[0].buffs.blood).toBeGreaterThan(w.time);
  });
});
