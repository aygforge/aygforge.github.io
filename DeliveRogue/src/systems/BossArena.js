// systems/BossArena.js — shared boss arena controller (Phase 04: Latte Art Dragon; same controller for all bosses).
// Flow: courier crosses the entry gate -> gate closes behind -> intro roar (boss immune) -> fight in 3 phases
// (100–70 %, 70–30 %, 30–0 %; each transition: short immune roar, attack reset) -> boss death (single event)
// -> exit gate opens -> customer delivery. The delivery timer pauses inside the arena; a separate boss timer
// runs (CONFIG.bossArenaTime). Every attack has warn / active / recover times and a courier/package damage mask.
// Helpers have unique ids, a hard active cap and give no XP / coins / kill stats.
import { BOSSES } from '../data/bosses.js';
import { CONFIG } from '../data/config.js';
import { ENEMY_DB, ENEMY_SHORT } from '../data/enemies.js';
import { clamp, dist, TAU } from '../core/util.js';

let api = null; // { G, hurtPlayer, spawnHelper, Fx, Audio, Bus, showHint, T, Save, activate }

function angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }

export const BossArena = {
  bind(a) { api = a; },
  /** Create the boss (idle, untargetable) when the chapter has a boss and the world has an arena. */
  setup(run, world) {
    if (!run.ch.boss || !world.arena) { run.boss = null; return; }
    const def = BOSSES[run.ch.boss], d = ENEMY_DB[run.ch.boss], A = world.arena;
    const e = { idx: api.G.enemies.length, id: d.id, d, sh: d.short, ai: 'boss', x: A.cx, y: A.top + 80, half: def.half, hp: def.hp, maxHp: def.hp, home: { x: A.cx, y: A.top + 80 },
      active: false, state: 'dormant', t: 0, cd: 0, ccd: 0, mcd: 0, dirx: 0, diry: 1, face: 1, flash: 0, slowT: 0, burn: null, poison: null, dotT: 0, vuln: 0, invuln: 0,
      dead: false, deadT: 0, anim: 0, shots: 0, stuck: 0, wob: 0, lx: 0, ly: 0, jz: 0, steamCyc: -1, seen: false, boss: true };
    api.G.enemies.push(e);
    run.boss = { def, e, state: 'idle', phase: 0, time: CONFIG.bossArenaTime, atk: null, queue: [], cd: 1.4, t: 0, helperSeq: 0, attacks: 0, hitsTaken: 0, phaseLog: [] };
  },
  inArena(run) { return !!run.boss && (run.boss.state === 'intro' || run.boss.state === 'fight'); },
  /** Arena state machine (called every play tick). Returns a fail reason or null. */
  update(run, dt) {
    const B = run.boss; if (!B) return null;
    const G = api.G, p = G.player, A = G.world.arena;
    if (B.state === 'idle') {
      if (p.y < A.bottom - p.half - 4 && p.y > A.top) this.start(run);
      return null;
    }
    if (B.state === 'intro' || B.state === 'fight') {
      B.time -= dt; B.t += dt;
      if (B.state === 'intro' && B.t >= 1.6) { B.state = 'fight'; B.e.state = 'fight'; B.e.active = true; }
      if (B.time <= 0) { B.time = 0; return 'bossTime'; }
    }
    return null;
  },
  start(run) {
    const B = run.boss, G = api.G, w = G.world;
    w.gates.entry.forEach(i => { w.block[i] = 1; });
    B.state = 'intro'; B.t = 0; B.e.state = 'intro'; B.e.invuln = 1.6; B.e.seen = false; api.activate(B.e);
    api.Fx.shake(6); api.Audio.play('slam'); api.Fx.text(G.player.x, G.player.y - 40, api.T('bossGateClosed'), '#ff9a3c', 12, 1.6);
    api.showHint('tut_boss');
  },
  /** Boss AI tick (called from the enemy loop instead of the generic AI). */
  tickBoss(e, dt) {
    const run = api.G.run, B = run.boss; if (!B || B.state === 'idle' || B.state === 'dead') return;
    const G = api.G, p = G.player, A = G.world.arena, def = B.def;
    e.invuln -= dt; // anim / flash / slow timers are advanced by the shared enemy loop
    // hover + drift toward the courier column (slow; never leaves the arena)
    const sp = e.d.speed * (e.slowT > 0 ? 0.7 : 1);
    const tx = clamp(p.x, A.left + 46, A.right - 46);
    e.x += clamp(tx - e.x, -sp * dt, sp * dt); e.y = A.top + 78 + Math.sin(e.anim * 0.8) * 5; e.face = p.x < e.x ? -1 : 1;
    if (B.state !== 'fight') return;
    // phase thresholds
    const frac = e.hp / e.maxHp, want = frac <= def.phases[2] ? 2 : frac <= def.phases[1] ? 1 : 0;
    if (want > B.phase) {
      B.phase = want; B.phaseLog.push(want); B.atk = null; B.queue = []; B.cd = 1.2; e.invuln = 1.2;
      api.Fx.ring(e.x, e.y - 30, '#ff6b3a', 80, 0.8); api.Fx.shake(7); api.Audio.play('slam'); api.Fx.text(e.x, e.y - 70, api.T('bossPhase', want + 1), '#ff9a3c', 13, 1.4);
      api.Bus.emit('BOSS_PHASE', { phase: want });
      return;
    }
    const cad = def.cadence[B.phase];
    if (!B.atk) {
      B.cd -= dt; if (B.cd > 0) return;
      if (!B.queue.length) { const pool = def.pools[B.phase]; B.queue = pool[Math.floor(run.crng.next() * pool.length)].split('+'); }
      this.begin(run, B.queue.shift(), cad);
      return;
    }
    const k = B.atk, a = def.attacks[k.base];
    k.t += dt;
    if (k.stage === 'warn' && k.t >= k.warn) { k.stage = 'active'; k.t = 0; this.activeStart(run, k, a); }
    else if (k.stage === 'active') {
      if (k.base === 'sweep') { k.a = k.a0 + (k.t / a.active - 0.5) * 2 * a.arc; k.tick -= dt; if (k.tick <= 0) { k.tick = a.tick; this.coneHit(run, k, a); } }
      if (k.t >= a.active) { k.stage = 'recover'; k.t = 0; if (k.waves > 1) { k.waves--; k.stage = 'warn'; k.t = 0; k.warn = 0.45; k.marks = this.marks(run, 'steam', k.n, a.r); } }
    } else if (k.stage === 'recover' && k.t >= k.recover) { B.atk = null; B.cd = B.queue.length ? 0.15 : 0.55 * cad; B.attacks++; }
  },
  begin(run, kind, cad) {
    const B = run.boss, def = B.def, p = api.G.player, e = B.e;
    const base = kind === 'steam3' ? 'steam' : kind, a = def.attacks[base];
    const k = { kind, base, stage: 'warn', t: 0, warn: a.warn * cad, recover: a.recover * cad, hit: false, marks: [], waves: kind === 'steam3' ? 3 : 1, tick: 0 };
    if (base === 'breath' || base === 'sweep') { k.a = Math.atan2(p.y - (e.y - 20), p.x - e.x); k.a0 = k.a; k.half = a.half; k.range = a.range; }
    if (base === 'steam') { k.n = def.counts.steam[B.phase]; k.marks = this.marks(run, 'steam', k.n, a.r); }
    if (base === 'rain') { k.marks = this.marks(run, 'rain', def.counts.rain[B.phase], a.r); }
    B.atk = k; api.Audio.play('warn', 0.2);
  },
  /** Target circles: first one on the courier, the rest seeded around the arena (deterministic). */
  marks(run, kind, n, r) {
    const A = api.G.world.arena, p = api.G.player, out = [{ x: p.x, y: p.y, r }];
    for (let i = 1; i < n; i++) {
      const x = A.left + 20 + run.crng.next() * (A.right - A.left - 40), y = kind === 'rain' ? A.top + 30 + run.crng.next() * (A.bottom - A.top - 50) : clamp(p.y + (run.crng.next() - 0.5) * 160, A.top + 30, A.bottom - 20);
      out.push({ x: kind === 'steam' ? clamp(p.x + (run.crng.next() - 0.5) * 170, A.left + 16, A.right - 16) : x, y, r });
    }
    return out;
  },
  activeStart(run, k, a) {
    const p = api.G.player;
    if (k.base === 'breath') this.coneHit(run, k, a);
    else if (k.base === 'sweep') k.tick = 0;
    else if (k.base === 'steam' || k.base === 'rain') {
      for (const m of k.marks) {
        api.Fx.ring(m.x, m.y, k.base === 'steam' ? '#ffffff' : '#7a4a28', m.r + 4, 0.35); if (k.base === 'steam') api.Fx.steam(m.x, m.y, 4, m.r);
        if (dist(m.x, m.y, p.x, p.y) < m.r + p.half) { api.hurtPlayer(a.dmg, { pkg: a.pkg, steam: k.base === 'steam', kx: Math.sign(p.x - m.x) || 1, ky: 0.3, kf: 60, boss: true }); break; }
      }
      api.Audio.play(k.base === 'steam' ? 'steam' : 'hit', 0.2);
    } else if (k.base === 'summon') this.summon(run);
  },
  coneHit(run, k, a) {
    const B = run.boss, e = B.e, p = api.G.player, ox = e.x, oy = e.y - 20;
    const d = dist(ox, oy, p.x, p.y - 6), ang = Math.atan2(p.y - 6 - oy, p.x - ox);
    api.Fx.steam(ox + Math.cos(k.a) * 60, oy + Math.sin(k.a) * 60, 5, 30); api.Audio.play('steam', 0.15);
    if (d < k.range && Math.abs(angleDiff(ang, k.a)) < k.half) api.hurtPlayer(a.dmg, { pkg: a.pkg, steam: true, kx: Math.cos(k.a), ky: Math.sin(k.a), kf: 110, boss: true });
  },
  summon(run) {
    const B = run.boss, def = B.def, G = api.G, alive = G.enemies.filter(x => x.helper && !x.dead).length;
    const n = Math.min(def.helper.perSummon, def.helper.cap - alive);
    for (let i = 0; i < n; i++) { B.helperSeq++; api.spawnHelper(def.helper.short, B.e.x + (i ? 36 : -36), B.e.y + 20, `${B.e.id}#h${B.helperSeq}`); }
  },
  /** Single boss death event. */
  onDeath(run) {
    const B = run.boss; if (!B || B.state === 'dead') return;
    const G = api.G, w = G.world;
    B.state = 'dead'; B.atk = null; w.gates.exit.forEach(i => { w.block[i] = 0; });
    G.enemies.forEach(x => { if (x.helper && !x.dead) { x.dead = true; x.deadT = 0.3; x.hp = 0; } });
    run.stats.bossKill = true; run.stats.bossTime = CONFIG.bossArenaTime - B.time;
    api.Fx.shake(9); api.Fx.text(B.e.x, B.e.y - 70, api.T('bossDefeated'), '#ffd166', 15, 2);
    api.Bus.emit('BOSS_DEFEATED', { id: B.e.id, time: run.stats.bossTime });
  },
};
