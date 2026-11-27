// core/DistrictRuntimeCore.js — migrated from DeliveRogue.html (Phase 01 Core Migration).
// Single simulation authority for a district run (legacy name inside: `Game`).
// Phase 01 changes vs. source: gameplay procs (crit / electric chain / cashback) now use the run-owned
// seeded combat stream `run.crng` instead of Math.random (map + spawn stream `run.rng` is unchanged,
// so layouts/spawns are identical to the HTML5 build for the same seed). Visual randomness stays cosmetic.
// Phase 03: manual fire + auto aim (fire only from real fire input; nearest attackable target in range + LOS,
// stable idx tie-break), hybrid Run XP (unique route segments, checkpoint, kills, one risky bonus) with queued
// level-up picks, 60 skills + 20 evolutions, hard caps and a proc budget. Skill offers use `run.srng`.
// Phase 04: 12-package rules (PackageRules), multi-drop routes (sequential drop zones), seeded route variants,
// mandatory boss arena on finals (BossArena: gates, separate boss timer, 3 phases), Mystery rule per attempt.
import { TT } from './Art.js';
import { Audio } from './AudioManager.js';
import { Input } from './InputManager.js';
import { Save } from './SaveManager.js';
import { T } from './i18n.js';
import { Bus, G, View } from './state.js';
import { COLS, RNG, TAU, TILE, clamp, dist, dist2, hashStr, lerp } from './util.js';
import { ACTIVE_CAP, CHAPTERS } from '../data/chapters.js';
import { ENEMY_DB, ENEMY_SHORT } from '../data/enemies.js';
import { GARAGE } from '../data/garage.js';
import { pkgOf } from '../data/packages.js';
import { CONFIG } from '../data/config.js';
import { PackageRules, resolveMystery } from '../systems/PackageRules.js';
import { BossArena } from '../systems/BossArena.js';
import { chapterKey } from '../data/ids.js';
import { PLAYER_BASE } from '../data/player.js';
import { Haptic } from '../platform/Haptics.js';
import { Fx } from '../systems/Fx.js';
import { MapBuilder } from '../systems/MapBuilder.js';
import { Nav } from '../systems/Nav.js';
import { Progression } from '../systems/Progression.js';
import { SkillMgr } from '../systems/SkillMgr.js';
import { RUN_XP_PER_LEVEL, xpPlan } from '../data/runxp.js';

/* ----------------------------- Game ----------------------------- */
export const Game = (() => {
  const hintQ = []; let hintT = 0;
  function showHint(key) {
    if (Save.data.tutorial[key] || hintQ.includes(key)) return;
    Save.data.tutorial[key] = true; Save.write(); hintQ.push(key);
  }
  function updateHints(dt) {
    const el = document.getElementById('hint');
    if (hintT > 0) { hintT -= dt; if (hintT <= 0) el.classList.remove('show'); return; }
    if (hintQ.length && G.run && !G.run.ended) { el.textContent = T(hintQ.shift()); el.classList.add('show'); hintT = 3.8; }
  }
  function clearHints() { hintQ.length = 0; hintT = 0; const el = document.getElementById('hint'); if (el) el.classList.remove('show'); }

  /* ---------- run setup ---------- */
  /** Mystery rule for this chapter attempt: fixed in the save until a real terminal result (no free reroll). */
  function mysteryFor(ch) {
    const s = Save.data, key = chapterKey('campaign', 'COF', ch.n);
    s.mysteries = s.mysteries || {};
    if (!s.mysteries[key]) { s.mysteries[key] = { attempt: (s.mysteryAttempts = (s.mysteryAttempts || 0) + 1), rule: null }; s.mysteries[key].rule = resolveMystery(key, s.mysteries[key].attempt, ch); Save.write(); }
    return s.mysteries[key].rule;
  }
  /** opts (debug/tests/modes): { pkg: package id override, mysteryRule, variants: false|array } */
  function start(n, opts = {}) {
    const ch = CHAPTERS[n - 1], s = Save.data;
    s.runCounter++; s.stats.runs++; Save.write();
    const seed = (hashStr(ch.id) ^ Math.imul(s.runCounter, 2654435761)) >>> 0;
    const pkgId = opts.pkg || ch.pkg, shown = pkgOf(pkgId);
    const mRule = shown.rule === 'mystery' ? (opts.mysteryRule || mysteryFor(ch)) : null;
    const world = opts.variants === false ? MapBuilder.build(ch) : MapBuilder.build(ch, Array.isArray(opts.variants) ? { variants: opts.variants } : { seed });
    G.world = world;
    const run = G.run = {
      id: Date.now().toString(36) + '_' + s.runCounter, ch, n, pkg: PackageRules.effective(pkgId, mRule), mysteryRule: mRule, dropIdx: 0, configVersion: CONFIG.version, seq: s.runCounter, garage: Object.assign({}, s.garage), rng: RNG(seed), crng: RNG((seed ^ 0x9E3779B9) >>> 0), srng: RNG((seed ^ 0x85EBCA6B) >>> 0), seed, state: 'intro', paused: false,
      time: 0, timer: ch.timer, picked: false, ended: false, success: false, reason: null, endT: 0, skills: [], evos: [], mods: SkillMgr.compute([], []),
      picksLeft: ch.picks, pickIdx: 0, pickTotal: ch.picks, pickKind: 'start', offer: [], rerolls: 1, pendingPicks: 0, settled: null, seenTypes: {},
      xp: 0, level: 1, xpPlan: xpPlan(ch, world), segSeen: {}, riskyXp: false, xpLog: { route: 0, cp: 0, combat: 0, risky: 0, drop: 0 },
      shots: 0, procT: 0, procN: 0, thunderCd: 0, turboT: 0, turboCd: 0, cpBoostT: 0, guardCd: 0,
      stats: { kills: 0, eliteKills: 0, steamHits: 0, playerDmg: 0, pkgDmg: 0, impacts: 0, risky: false, healUsed: false, minDist: world.pathLen, time: 0, pkgPct: 1, drops: 0, dropsTotal: world.drops.length, bossKill: false },
    };
    const st = world.start;
    G.player = { x: st.x, y: st.y, half: 7, vx: 0, vy: 0, kbx: 0, kby: 0, hp: 100, maxHp: 100, pkgHp: run.pkg.hp, pkgMax: run.pkg.hp,
      dir: 1, walkT: 0, moving: false, inv: 0, pkgInv: 0, flash: 0, pkgFlash: 0, fireCd: 0, shootT: 0, target: null, retarget: 0, aimA: -Math.PI / 2, noDmgT: 0, range: PLAYER_BASE.range,
      shield: false, shieldCd: 0, slowed: false, onSpill: false, impactCd: 0, cartCd: 0, shortcut: false, speedNow: 0, stats: {} };
    recalc(); G.player.hp = G.player.maxHp; G.player.pkgHp = G.player.pkgMax;
    // enemies
    G.enemies = []; spawnEnemies(world, run);
    PackageRules.init(run); BossArena.setup(run, world);
    // hazards
    const per = ch.steam.idle + ch.steam.warn + ch.steam.active + 0.35;
    G.jets = world.jets.map(j => Object.assign({}, j, { t: run.rng.range(0, per), per, ph: 'idle', cyc: 0, hit: false }));
    G.grates = world.grates.map(j => Object.assign({}, j, { t: run.rng.range(0, per), per, ph: 'idle', cyc: 0, hit: false }));
    G.carts = world.carts.map(k => ({ x: k.x, y: k.y, minX: k.minX, maxX: k.maxX, vx: (run.rng.next() < 0.5 ? -1 : 1) * 52, hw: 20, hh: 8 }));
    G.proj = []; G.eproj = []; G.lobs = []; G.puddles = []; G.zones = []; G.parts = []; G.floats = []; G.bolts = [];
    G.enemyField = new Int16Array(world.rows * COLS); G.navT = 0;
    G.cam.y = clamp(G.player.y - View.h * 0.6, 0, Math.max(0, world.h - View.h)); G.cam.shake = 0;
    clearHints(); Input.reset();
    return run;
  }
  /** Place exactly the configured enemies on authored slots (seeded shuffle), falling back to free floor in the same segment. */
  function spawnEnemies(world, run) {
    const rng = run.rng, tier = run.ch.tier;
    world.segs.forEach(seg => {
      if (!seg.enemies.length) return;
      const slots = rng.shuffle(seg.slots.slice()), eslots = rng.shuffle(seg.eslots.slice());
      const floor = rng.shuffle(seg.floor.filter(f => Nav.tileAt(f.c, f.r) === TT.FLOOR && !Nav.blocked(f.x, f.y, 10, true)));
      let swarmAnchor = null;
      seg.enemies.forEach(sh => {
        const id = ENEMY_SHORT[sh], d = ENEMY_DB[id]; let pos;
        if (d.elite && eslots.length) pos = eslots.shift();
        else if (sh === 'SS' && swarmAnchor) {
          pos = null;
          for (let k = 0; k < 12 && !pos; k++) { const a = rng.range(0, TAU), r = rng.range(14, 28), x = swarmAnchor.x + Math.cos(a) * r, y = swarmAnchor.y + Math.sin(a) * r; if (!Nav.blocked(x, y, d.half + 1, true)) pos = { x, y }; }
          if (!pos) pos = slots.shift() || floor.shift();
        } else pos = slots.shift() || eslots.shift() || floor.shift();
        if (!pos) pos = { x: seg.floor[0].x, y: seg.floor[0].y };
        const x = pos.x + rng.range(-4, 4), y = pos.y + rng.range(-4, 4);
        if (sh === 'SS' && !swarmAnchor) swarmAnchor = { x, y };
        const hp = d.hp[tier];
        const e = { idx: G.enemies.length, id, d, sh, ai: d.ai, x, y, half: d.half, hp, maxHp: hp, home: { x, y }, active: false, state: d.ai === 'mimic' ? 'dormant' : 'idle',
          t: 0, cd: rng.range(0.3, 1.0), ccd: rng.range(1, 2.5), mcd: 1, dirx: 0, diry: 1, face: 1, flash: 0, slowT: 0, burn: null, poison: null, dotT: 0, vuln: 0,
          dead: false, deadT: 0, anim: rng.range(0, 4), shots: 0, stuck: 0, wob: rng.range(0, TAU), lx: 0, ly: 0, jz: 0, steamCyc: -1, seen: false };
        if (Nav.blocked(e.x, e.y, e.half, true)) Nav.unstick(e, true);
        e.home.x = e.x; e.home.y = e.y;
        G.enemies.push(e);
      });
    });
  }
  /** Hard caps (Master Prompt §9): damage reduction 80%, attack interval floor .12s, crit 100%, speed ×1.75 of the garage/package base. */
  const CAPS = { dr: 0.8, intervalFloor: 0.12, crit: 1, speedMul: 1.75, procPerWindow: 14, procWindow: 0.5, maxBurning: 6 };
  /** Proc budget: bounded number of secondary effects (chains, AoE, spreads) per window — no infinite chains. */
  function proc() { const r = G.run; if (r.procN >= CAPS.procPerWindow) return false; r.procN++; return true; }
  function aoe(x, y, r, dmg, except, max = 6) { let n = 0; for (const t of nearest(x, y, r, except)) { if (n++ >= max) break; hitEnemy(t, dmg, { proc: true }); } }
  /** Run XP (unique sources only). Level-ups queue skill picks that open at the next safe frame. */
  function addXp(v, src) {
    const run = G.run; if (!run || run.ended || v <= 0) return;
    v *= run.mods.xpMul; run.xp += v; run.xpLog[src] += v;
    while (run.xp >= RUN_XP_PER_LEVEL - 1e-6) { run.xp = Math.max(0, run.xp - RUN_XP_PER_LEVEL); run.level++; run.pendingPicks++; const p = G.player; Fx.text(p.x, p.y - 44, T('runLevelUp', run.level), '#7fe1ff', 12, 1.3); Fx.ring(p.x, p.y - 10, '#7fe1ff', 44); Audio.play('checkpoint'); }
  }
  /** Boss helper (unique id, active immediately, no rewards). */
  function spawnHelper(sh, x, y, uid) {
    const d = ENEMY_DB[ENEMY_SHORT[sh]], hp = d.hp[G.run.ch.tier];
    const e = { idx: G.enemies.length, uid, helper: true, id: d.id, d, sh, ai: d.ai, x, y, half: d.half, hp, maxHp: hp, home: { x, y }, active: true, state: 'chase',
      t: 0, cd: 0.6, ccd: 2, mcd: 1, dirx: 0, diry: 1, face: 1, flash: 0, slowT: 0, burn: null, poison: null, dotT: 0, vuln: 0, dead: false, deadT: 0, anim: 0, shots: 0, stuck: 0, wob: 0, lx: 0, ly: 0, jz: 0, steamCyc: -1, seen: true };
    if (Nav.blocked(e.x, e.y, e.half, true)) Nav.unstick(e, true);
    G.enemies.push(e); Fx.ring(x, y - 6, '#fffaf2', 24);
  }
  /** Recompute derived player stats from Garage levels + run skills (never stacks twice). */
  function recalc() {
    // run-start garage snapshot: no in-run purchase can change stats; skins never change stats
    const p = G.player, g = G.run.garage || Save.data.garage, m = G.run.mods, pk = G.run.pkg;
    p.maxHp = Math.round(PLAYER_BASE.hp * (1 + GARAGE.helmet.per * g.helmet)) + 25 * m.helmet + m.hpAdd;
    p.dmg = PLAYER_BASE.dmg * (1 + GARAGE.pos.per * g.pos) * m.dmgMul;
    p.interval = Math.max(CAPS.intervalFloor, PLAYER_BASE.interval / (1 + 0.25 * m.rapid) * m.intervalMul / (1 + GARAGE.battery.per * g.battery));
    p.pkgMax = Math.round(pk.hp * (1 + GARAGE.bag.per * g.bag));
    p.slipMul = 1 - GARAGE.tires.per * g.tires;      // tires: less control loss on slick floors
    p.impactGarage = 1 - GARAGE.brakes.per * g.brakes; // brakes: less impact package damage
    p.range = PLAYER_BASE.range * m.rangeMul;
    const spBase = PLAYER_BASE.speed * (1 + GARAGE.motor.per * g.motor) * pk.speedMul;
    p.speedCap = spBase * CAPS.speedMul;
    p.speed = Math.min(p.speedCap, spBase * (1 + 0.10 * m.express) * m.speedMul);
    p.dr = Math.min(CAPS.dr, GARAGE.jacket.per * g.jacket + m.drAdd);
    p.critC = Math.min(CAPS.crit, PLAYER_BASE.critChance + m.critC); p.critM = PLAYER_BASE.critMul + m.critM;
  }

  /* ---------- damage routing ---------- */
  /**
   * Central player/package damage entry point.
   * o.pkg: package damage (only special attacks & hazards), o.steam: steam source, o.impact: collision source,
   * o.kx/ky: knockback direction, o.kf: knockback force.
   */
  function hurtPlayer(dmg, o = {}) {
    const p = G.player, run = G.run; if (run.ended || !run.picked) return false;
    if (p.shield && (dmg > 0 || o.pkg > 0)) {
      p.shield = false; p.shieldCd = run.mods.shieldCd; p.noDmgT = 0; Fx.ring(p.x, p.y - 8, '#9fd8ff', 30); Fx.text(p.x, p.y - 26, 'KALKAN', '#9fd8ff', 9); Audio.play('shield'); p.inv = 0.4; return false;
    }
    let did = false;
    if (dmg > 0 && p.inv <= 0) {
      let dr = p.dr; if (run.mods.lastStand && p.hp < p.maxHp * 0.25) dr = Math.min(CAPS.dr, dr + run.mods.lastStand);
      const v = Math.max(1, Math.round(dmg * (1 - dr))); p.noDmgT = 0;
      p.hp = Math.max(0, p.hp - v); p.inv = PLAYER_BASE.invuln; p.flash = 0.12; run.stats.playerDmg += v; did = true;
      Fx.text(p.x, p.y - 24, '-' + v, '#ff6b5a', 11); Audio.play('hurt'); Haptic.buzz(40); Fx.shake(dmg >= 15 ? 5 : 2.5);
      if (o.kf) { const f = o.kf * run.mods.kbMul; p.kbx += o.kx * f; p.kby += o.ky * f; }
      if (run.mods.guardian && !p.shield && run.guardCd <= 0 && p.hp > 0 && p.hp < p.maxHp * 0.35) { p.shield = true; run.guardCd = 12; Fx.ring(p.x, p.y - 8, '#9fd8ff', 40); }
    }
    if (o.pkg > 0 && p.pkgInv <= 0) {
      let pv = o.pkg * run.pkg.hazardMul * run.mods.pkgMul * (run.pkg.pkgDmgMul || 1);
      if (o.steam) pv *= run.mods.steamPkgMul;
      if (o.impact && run.mods.balance) pv *= 0.5;
      if (o.impact) pv *= run.mods.impactPkgMul * p.impactGarage;
      pv = Math.max(1, Math.round(pv));
      p.pkgHp = Math.max(0, p.pkgHp - pv); p.pkgInv = 0.4; p.pkgFlash = 0.35; run.stats.pkgDmg += pv; did = true;
      Fx.text(p.x + 8, p.y - 34, '-' + pv, '#ffb347', 10, 0.9, 'pkg'); Audio.play('pkg'); Fx.burst(p.x, p.y - 14, '#d9a36a', 6, 60, 2);
      if (run.n <= 3) showHint('tut_pkg');
    }
    if (did && o.steam) { run.stats.steamHits++; PackageRules.event(run, 'steam'); }
    if (did && o.impact) PackageRules.event(run, 'impact'); else if (did && o.kf) PackageRules.event(run, 'knock');
    return did;
  }
  function healPlayer(v) { const p = G.player; const h = Math.min(p.maxHp - p.hp, v); if (h > 0) { p.hp += h; Fx.text(p.x, p.y - 26, '+' + Math.round(h), '#5fd3b4', 11); } }

  function hitEnemy(e, dmg, o = {}) {
    if (e.dead) return;
    if (e.boss && (e.invuln > 0 || !G.run.boss || G.run.boss.state !== 'fight')) { if (!o.dot && !o.proc) Fx.text(e.x, e.y - e.d.h * 0.8, T('immune'), '#bfe9ff', 9, 0.5); return; }
    const p = G.player, run = G.run, m = run.mods; let crit = false;
    if (o.canCrit && run.crng.next() < p.critC) { dmg *= p.critM; crit = true; }
    if (e.vuln > 0) dmg *= 1.5;
    if (!o.dot) {
      if (e.d.elite) dmg *= m.eliteMul;
      if (e.d.role === 'Boss') dmg *= m.bossMul;
      if (m.execute && e.hp < e.maxHp * 0.25) dmg *= 1 + m.execute;
      if (o.range && o.travel != null) { const f = o.travel / o.range; if (m.pointBlank && f <= 0.35) dmg *= 1.25; if (m.longDist && f >= 0.65) dmg *= 1.25; }
    }
    if (m.slowedBonus && e.slowT > 0) dmg *= 1 + m.slowedBonus;
    if (m.corrode && e.poison) dmg *= 1 + m.corrode;
    if (e.acid) dmg *= 1 + 0.05 * e.acid;
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg; e.flash = 0.09;
    if (!e.active && e.state !== 'dormant' && !o.noAggro) activate(e, true);
    Fx.text(e.x, e.y - e.d.h * 0.7, dmg, crit ? '#ffd166' : o.proc ? '#bfe9ff' : '#ffffff', crit ? 12 : 9, 0.6);
    if (crit) Audio.play('crit'); else Audio.play('hit', 0.05);
    if (o.primary && !o.proc) {
      const base = o.base || dmg, boss = e.d.role === 'Boss';
      if (m.acid) e.acid = Math.min(5, (e.acid || 0) + 1);
      if (m.knock && o.kx != null && !boss && !e.dead) { const f = 14 * (e.d.elite ? 0.5 : 1); Nav.move(e, o.kx * f, o.ky * f, true); }
      const el = m.elem;
      if (el === 'electric' && run.crng.next() < 0.35 * (o.bounced ? 0.5 : 1)) {
        let n = 0;
        for (const t of nearest(e.x, e.y, 85, e)) { if (n >= 2) break; if (!Nav.los(e.x, e.y, t.x, t.y)) continue; Fx.bolt(e.x, e.y - 8, t.x, t.y - 8); hitEnemy(t, base * 0.45 * m.chainMul, { proc: true }); n++; }
        if (n) Audio.play('zap');
      } else if (el === 'frozen') { const keep = e.slowT > 0 && e.slowMul < m.slowMul; e.slowT = Math.max(e.slowT, 1.6 * m.slowDur * (boss ? 0.5 : 1)); if (!keep) e.slowMul = m.slowMul; }
      else if (el === 'burn') { e.burn = { t: 2, dps: base * 0.8 / 2 * (crit && m.critBurn ? 2 : 1) * (boss ? 0.5 : 1) }; }
      else if (el === 'toxic') { e.poison = { t: m.poisonDur, dps: base * 1.2 / 4 * (boss ? 0.5 : 1) }; }
      if (o.pierce && m.pierceFreeze) { e.slowT = 2.4 * m.slowDur * (boss ? 0.5 : 1); e.slowMul = boss ? 0.55 : 0.3; }
      if (m.thunder && run.thunderCd <= 0 && run.crng.next() < m.thunder.ch && proc()) {
        run.thunderCd = m.thunder.cd; Fx.bolt(e.x + 6, e.y - 90, e.x, e.y - 8); Fx.ring(e.x, e.y - 6, '#ffe14d', m.thunder.r); Audio.play('zap');
        hitEnemy(e, base * m.thunder.mul, { proc: true }); aoe(e.x, e.y, m.thunder.r, base * m.thunder.mul, e);
      }
      if (m.explode && proc()) { Fx.ring(e.x, e.y - 6, '#ff9a3c', 26); aoe(e.x, e.y, 26, base * 0.4, e); }
      if (o.atomic && proc()) { Fx.ring(e.x, e.y - 6, '#ff5a2c', 60, 0.6); Fx.shake(4); Audio.play('slam'); aoe(e.x, e.y, 60, base * 1.5, e, 8); }
      if (o.bounced && m.bounceChain && proc()) { const t = nearest(e.x, e.y, 85, e).find(q => Nav.los(e.x, e.y, q.x, q.y)); if (t) { Fx.bolt(e.x, e.y - 8, t.x, t.y - 8); hitEnemy(t, base * 0.45 * m.chainMul, { proc: true }); } }
    }
    if (e.hp <= 0) killEnemy(e);
  }
  function nearest(x, y, r, except) { const out = []; for (const t of G.enemies) if (!t.dead && t !== except && t.state !== 'dormant' && dist2(x, y, t.x, t.y) < r * r) out.push(t); out.sort((a, b) => dist2(x, y, a.x, a.y) - dist2(x, y, b.x, b.y)); return out; }
  function killEnemy(e) {
    e.dead = true; e.deadT = 0.35; e.hp = 0; const run = G.run;
    if (e.helper) { Fx.burst(e.x, e.y - e.d.h * 0.4, '#fffaf2', 10, 80, 2); Audio.play('kill'); if (G.player.target === e) G.player.target = null; return; } // boss helpers: no XP / coins / stats
    if (e.boss) { const bk = Save.data.book[e.id]; if (bk) bk.def++; run.stats.kills++; Fx.burst(e.x, e.y - 40, '#fff1dc', 40, 180, 3.5); Fx.ring(e.x, e.y - 30, '#ffd166', 110, 1); Audio.play('win'); if (G.player.target === e) G.player.target = null; BossArena.onDeath(run); return; }
    run.stats.kills++; if (e.d.elite) run.stats.eliteKills++;
    const bk = Save.data.book[e.id]; if (bk) bk.def++;
    const col = { BB: '#6b3b1f', SS: '#fffaf2', LI: '#e9cfa6', BG: '#6fae4c', DC: '#5a3524', MM: '#f1ebdf', CD: '#fffaf0', GK: '#9aa3ad', SJ: '#c27a3a' }[e.sh];
    Fx.burst(e.x, e.y - e.d.h * 0.4, col, e.d.elite ? 26 : 12, e.d.elite ? 140 : 90, e.d.elite ? 3 : 2.2);
    Fx.ring(e.x, e.y - e.d.h * 0.4, '#fff1dc', e.d.elite ? 50 : 24);
    Audio.play('kill'); if (e.d.elite) { Fx.shake(6); Fx.text(e.x, e.y - 50, 'ELİT YENİLDİ!', '#ffd166', 13, 1.4); }
    if (run.mods.cashback && G.run.crng.next() < 0.25) healPlayer(6);
    if (G.player.target === e) G.player.target = null;
    // Run XP: each enemy can die only once (dead flag), so kill XP is unique per enemy.
    addXp(run.xpPlan.killUnit * (e.d.elite ? 3 : 1), 'combat');
    const m = run.mods;
    if (m.flameBurst && e.burn && proc()) { Fx.ring(e.x, e.y - 6, '#ff7b3a', 36); Fx.burst(e.x, e.y - 8, '#ff7b3a', 10, 90, 2.2); aoe(e.x, e.y, 36, G.player.dmg, e); }
    if (m.venom && e.poison && proc()) { let n = 0; for (const t of nearest(e.x, e.y, 60, e)) { if (n++ >= m.venom) break; t.poison = { t: m.poisonDur, dps: e.poison.dps }; Fx.bolt(e.x, e.y - 6, t.x, t.y - 6); } }
  }
  function activate(e, forced) {
    e.active = true; if (e.state === 'idle' || e.state === 'return') { e.state = 'chase'; e.t = 0; }
    if (!e.seen) { e.seen = true; const bk = Save.data.book[e.id]; if (bk) { const first = !bk.seen; bk.seen = true; bk.enc++; if (first) { Save.write(); Bus.emit('discover', e.id); } } }
    if (e.d.elite) showHint('tut_elite');
    void forced;
  }

  /* ---------- player ---------- */
  function remainingFrac() { const r = G.run; return r.picked ? Math.max(0, 1 - r.time / r.timer) : 1; }
  function updatePlayer(dt) {
    const p = G.player, run = G.run, m = run.mods;
    const v = (run.state === 'play') ? Input.vec() : { x: 0, y: 0 };
    const mag = Math.hypot(v.x, v.y); p.moving = mag > 0.08;
    let spd = p.speed;
    if (m.lastMinute && run.picked && remainingFrac() < 0.3) spd *= 1.25;
    p.shortcut = false;
    if (m.shortcut && p.moving) {
      const f = Nav.flowDir(run.picked ? G.world.dropField : G.world.pickField, p.x, p.y);
      if (f && (v.x * f.x + v.y * f.y) / mag > 0.6) { spd *= 1.14; p.shortcut = true; }
    }
    p.slowed = false; for (const pd of G.puddles) if (dist2(p.x, p.y, pd.x, pd.y) < pd.r * pd.r) { p.slowed = true; break; }
    if (p.slowed) spd *= 1 - 0.45 * (1 - m.slowResist);
    // Phase 03 movement skills
    if (m.turbo && run.picked) {
      if (p.moving) p.noDmgT += dt; if (run.turboCd > 0) run.turboCd -= dt;
      if (p.noDmgT >= 5 && run.turboCd <= 0) { run.turboT = 2; run.turboCd = 10; p.noDmgT = 0; Fx.text(p.x, p.y - 30, 'TURBO', '#7fe1ff', 10); }
    }
    if (run.turboT > 0) { run.turboT -= dt; spd *= 1.2; }
    if (run.cpBoostT > 0) { run.cpBoostT -= dt; spd *= 1.2; }
    if (m.finalSprint && run.picked && G.world.rowSeg[clamp(Math.floor(p.y / TILE), 0, G.world.rows - 1)] <= 1) spd *= 1.15;
    spd = Math.min(spd, p.speedCap);
    p.speedNow = spd;
    const tile = Nav.tileAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE));
    const wasSpill = p.onSpill; p.onSpill = tile === TT.SPILL;
    if (p.onSpill && !wasSpill && run.picked) showHint('tut_spill');
    let acc = 18; if (p.onSpill) acc = Math.min(18, 1.7 * (m.brake ? 4 : 1) * (m.balance ? 1.6 : 1) / (m.slickMul * p.slipMul));
    const k = Math.min(1, acc * dt);
    p.vx += (v.x * spd - p.vx) * k; p.vy += (v.y * spd - p.vy) * k;
    const kd = Math.exp(-9 * dt); p.kbx *= kd; p.kby *= kd;
    const mvx = p.vx + p.kbx, mvy = p.vy + p.kby;
    const hit = Nav.move(p, mvx * dt, mvy * dt, false, true);
    // impact: sliding / knocked into a solid at speed shakes the package
    p.impactCd -= dt;
    const thr = p.speed * (run.pkg.ruleId === 'FRAGILE_ORDER' ? 0.55 : 0.7) * (m.balance ? 1.3 : 1);
    if ((hit.hx && Math.abs(mvx) > thr) || (hit.hy && Math.abs(mvy) > thr)) {
      if ((p.onSpill || Math.hypot(p.kbx, p.kby) > 60) && p.impactCd <= 0 && run.picked) {
        p.impactCd = 0.9; run.stats.impacts++;
        hurtPlayer(0, { pkg: 4 * run.pkg.impactMul, impact: true });
        Fx.burst(p.x + Math.sign(mvx) * 6, p.y - 6, '#fff1dc', 6, 70, 1.6); Audio.play('bump'); Fx.shake(2.5);
      }
      if (p.onSpill) { if (hit.hx) p.vx *= -0.35; if (hit.hy) p.vy *= -0.35; }
    }
    if (p.moving) {
      if (Math.abs(v.x) > Math.abs(v.y) * 1.1) p.dir = v.x < 0 ? 2 : 3; else p.dir = v.y < 0 ? 1 : 0;
      p.walkT += dt * (Math.hypot(p.vx, p.vy) / 100) * 9;
    } else p.walkT = 0;
    // scooter exhaust puffs behind the courier
    const sp2 = Math.hypot(p.vx, p.vy);
    if (sp2 > 25 && Math.random() < dt * 9) { const ux = -p.vx / sp2, uy = -p.vy / sp2; Fx.part({ x: p.x + ux * 14, y: p.y - 4 + uy * 10, vx: ux * 18 + (Math.random() - 0.5) * 10, vy: uy * 18 - 8, life: 0.45, max: 0.45, size: 2.5, color: 'rgba(210,205,200,.55)', kind: 'steam', drag: 1.5 }); }
    if (p.onSpill && Math.hypot(p.vx, p.vy) > 30 && Math.random() < dt * 14) Fx.part({ x: p.x + (Math.random() - 0.5) * 8, y: p.y, vx: -p.vx * 0.2, vy: -p.vy * 0.2, life: 0.4, max: 0.4, size: 1.8, color: '#6b3a17' });
    p.inv -= dt; p.pkgInv -= dt; p.flash -= dt; p.pkgFlash -= dt; p.shootT -= dt; p.cartCd -= dt;
    if (m.shield && !p.shield) { p.shieldCd -= dt; if (p.shieldCd <= 0) { p.shield = true; Fx.ring(p.x, p.y - 8, '#9fd8ff', 24); } }
  }

  /* ---------- weapon: Manual Fire + Auto Aim ---------- */
  /** Nearest live attackable target in range with line of sight; stable tie-break by enemy idx;
   *  a small hysteresis keeps the current target unless another one is clearly closer. */
  function pickTarget(p) {
    const R = p.range; let best = null, bd = 1e9;
    for (const e of G.enemies) {
      if (e.dead || e.state === 'dormant' || e.jz > 4) continue;
      const d = dist(p.x, p.y, e.x, e.y); if (d > R) continue;
      const s = d - (e === p.target ? 6 : 0);
      if ((s < bd || (s === bd && best && e.idx < best.idx)) && Nav.los(p.x, p.y - 6, e.x, e.y - 6)) { bd = s; best = e; }
    }
    return best;
  }
  function updateWeapon(dt) {
    const p = G.player, run = G.run; if (run.state !== 'play') return;
    p.fireCd -= dt; p.retarget -= dt;
    const R = p.range;
    const valid = e => e && !e.dead && e.state !== 'dormant' && e.jz <= 4 && dist2(p.x, p.y, e.x, e.y) < R * R && Nav.los(p.x, p.y - 6, e.x, e.y - 6);
    if (p.target && !valid(p.target)) p.target = null;
    if (p.retarget <= 0 || !p.target) {
      p.retarget = 0.1; const best = pickTarget(p);
      if (best && best !== p.target && run.n === 1 && run.picked) showHint('tut_auto');
      p.target = best;
    }
    // aim: target, else last aim / riding direction (only used when fire is pressed)
    if (p.target) p.aimA = Math.atan2((p.target.y - p.target.d.h * 0.35) - (p.y - 10), p.target.x - p.x);
    else if (p.moving && Math.hypot(p.vx, p.vy) > 20) p.aimA = Math.atan2(p.vy, p.vx);
    const tap = Input.takeFireTap(), held = Input.fireHeld();
    if (!run.picked) return; // the POS is armed once the order is picked up (source rule)
    if ((tap || held) && p.fireCd <= 0) { fire(); p.fireCd = p.interval; }
  }
  function fire() {
    const p = G.player, run = G.run, m = run.mods, sx = p.x, sy = p.y - 10, a = p.aimA;
    const n = ++run.shots; let mul = 1, atomic = false;
    if (m.every5 && n % 5 === 0) { mul *= m.every5; atomic = m.atomic; }
    if (m.every3 && n % 3 === 0) mul *= m.every3;
    const d = p.dmg * mul;
    shoot(sx, sy, a, d, true, atomic);
    for (let k = 1; k <= m.extra; k++) shoot(sx, sy, a + (k % 2 ? 1 : -1) * 0.13 * Math.ceil(k / 2), d * m.extraMul, true);
    if (m.barrage) { [0.4, -0.4, 0.8, -0.8].forEach(o => shoot(sx, sy, a + o, d * 0.6, true)); if (n % 3 === 0) { shoot(sx, sy, a + 1.15, d * 0.5, true); shoot(sx, sy, a - 1.15, d * 0.5, true); } }
    else if (m.diag) { shoot(sx, sy, a + 0.62, d * 0.5, true); shoot(sx, sy, a - 0.62, d * 0.5, true); }
    p.shootT = 0.12; Audio.play('fire', 0.06); run.stats.shots = n;
    if (!p.moving) { if (Math.abs(Math.cos(a)) > Math.abs(Math.sin(a))) p.dir = Math.cos(a) < 0 ? 2 : 3; else p.dir = Math.sin(a) < 0 ? 1 : 0; }
  }
  function shoot(x, y, a, dmg, primary, atomic = false) {
    if (G.proj.length > (View.low ? 60 : 110)) return;
    const sp = 340, m = G.run.mods, range = G.player.range;
    G.proj.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, a, life: range / sp + 0.12, range, travel: 0, dmg, base: dmg, primary, pierce: m.pierce, canPierce: m.pierce > 0, bounce: m.bounce, hit: [], bounced: false, atomic });
  }
  function updateProj(dt) {
    for (let i = G.proj.length - 1; i >= 0; i--) {
      const b = G.proj[i]; b.life -= dt; let dead = b.life <= 0;
      const steps = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 6);
      for (let s = 0; s < steps && !dead; s++) {
        b.x += b.vx * dt / steps; b.y += b.vy * dt / steps; b.travel += Math.hypot(b.vx, b.vy) * dt / steps;
        if (Nav.isSolidT(Nav.tileAt(Math.floor(b.x / TILE), Math.floor(b.y / TILE)))) { Fx.burst(b.x, b.y, '#ffd166', 4, 50, 1.4, 0.25); dead = true; break; }
        for (const e of G.enemies) {
          if (e.dead || e.state === 'dormant' || e.jz > 6 || b.hit.includes(e.idx)) continue;
          const hy = e.y - e.d.h * 0.35;
          if (Math.abs(b.x - e.x) < e.half + 4 && Math.abs(b.y - hy) < e.half + 6) {
            b.hit.push(e.idx); hitEnemy(e, b.dmg, { primary: b.primary, canCrit: true, base: b.base, bounced: b.bounced, travel: b.travel, range: b.range, kx: b.vx / 340, ky: b.vy / 340, pierce: b.canPierce, atomic: b.atomic });
            b.atomic = false;
            Fx.burst(b.x, b.y, '#ffe9a8', 3, 60, 1.4, 0.2);
            const m = G.run.mods;
            if (b.pierce > 0) { b.pierce--; b.dmg *= m.pierceFall; }
            else if (b.bounce > 0) {
              b.bounce--; b.bounced = true; b.dmg *= m.bounceFall; b.travel = 0;
              const nt = nearest(b.x, b.y, 130, null).find(t => !b.hit.includes(t.idx) && Nav.los(b.x, b.y, t.x, t.y - 6));
              if (nt) { const a = Math.atan2(nt.y - nt.d.h * 0.35 - b.y, nt.x - b.x); b.vx = Math.cos(a) * 340; b.vy = Math.sin(a) * 340; b.a = a; b.life = 0.5; }
              else dead = true;
            } else dead = true;
            break;
          }
        }
      }
      if (dead) G.proj.splice(i, 1);
    }
    // enemy projectiles (normal ones damage the player only)
    const p = G.player;
    for (let i = G.eproj.length - 1; i >= 0; i--) {
      const b = G.eproj[i]; b.life -= dt; let dead = b.life <= 0;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (Nav.isSolidT(Nav.tileAt(Math.floor(b.x / TILE), Math.floor(b.y / TILE)))) { Fx.burst(b.x, b.y, '#7a4a28', 5, 50, 1.6, 0.3); dead = true; }
      else if (Math.abs(b.x - p.x) < p.half + b.r && Math.abs(b.y - (p.y - 8)) < p.half + 4 + b.r) {
        hurtPlayer(b.dmg, { kx: b.vx / 160, ky: b.vy / 160, kf: 60 }); Fx.burst(b.x, b.y, '#7a4a28', 6, 60, 1.8, 0.3); dead = true;
      }
      if (dead) G.eproj.splice(i, 1);
    }
  }

  /* ---------- enemy AI ---------- */
  function steer(e, tx, ty, spd, dt, useField = true) {
    let dx = tx - e.x, dy = ty - e.y; const d = Math.hypot(dx, dy); if (d < 0.5) return { hx: false, hy: false };
    let dir = null;
    if (useField && !Nav.los(e.x, e.y, tx, ty)) dir = Nav.flowDir(G.enemyField, e.x, e.y);
    if (!dir) dir = { x: dx / d, y: dy / d };
    const sp = spd * (e.slowT > 0 ? (e.slowMul || 0.55) : 1) * dt;
    e.dirx = dir.x; e.diry = dir.y; if (Math.abs(dir.x) > 0.15) e.face = dir.x < 0 ? -1 : 1;
    return Nav.move(e, dir.x * sp, dir.y * sp, true);
  }
  function away(e, tx, ty, spd, dt) { const dx = e.x - tx, dy = e.y - ty, d = Math.hypot(dx, dy) || 1; const sp = spd * (e.slowT > 0 ? (e.slowMul || 0.55) : 1) * dt; Nav.move(e, dx / d * sp, dy / d * sp, true); }
  function activeCount() { let n = 0; for (const e of G.enemies) if (e.active && !e.dead) n++; return n; }

  function updateEnemies(dt) {
    const p = G.player, run = G.run, cap = ACTIVE_CAP[run.ch.tier];
    let act = activeCount();
    const viewTop = G.cam.y - 160, viewBot = G.cam.y + View.h + 160;
    for (const e of G.enemies) {
      if (e.dead) { e.deadT -= dt; continue; }
      e.anim += dt * (e.state === 'chase' ? 7 : 3); e.flash -= dt; e.slowT -= dt; e.vuln -= dt;
      if (!run.picked) continue;
      const near = e.y > viewTop && e.y < viewBot;
      if (!near && !e.active) continue; // distant enemies are not simulated
      // damage over time
      if (e.burn || e.poison) {
        e.dotT -= dt;
        if (e.dotT <= 0) { e.dotT = 0.5; let v = 0; if (e.burn) { v += e.burn.dps * 0.5 * run.mods.dotMul; e.burn.t -= 0.5; if (e.burn.t <= 0) e.burn = null; Fx.part({ x: e.x, y: e.y - 10, vy: -30, life: 0.4, max: 0.4, size: 2.5, color: '#ff7b3a' }); } if (e.poison) { v += e.poison.dps * 0.5; e.poison.t -= 0.5; if (e.poison.t <= 0) e.poison = null; Fx.part({ x: e.x, y: e.y - 10, vy: -20, life: 0.5, max: 0.5, size: 2.5, color: '#7ddc4a' }); } if (v > 0) hitEnemy(e, v, { noAggro: true, dot: true, proc: true }); if (e.dead) continue;
          if (run.mods.wildfire && e.burn && (e.wfT = (e.wfT || 0) - 0.5) <= 0) { e.wfT = 1; if (G.enemies.filter(q => q.burn && !q.dead).length < CAPS.maxBurning) { const t = nearest(e.x, e.y, 50, e).find(q => !q.burn); if (t) { t.burn = { t: 2, dps: e.burn.dps }; Fx.bolt(e.x, e.y - 6, t.x, t.y - 6); } } } }
      }
      if (e.ai === 'boss') { BossArena.tickBoss(e, dt); continue; }
      const dP = dist(e.x, e.y, p.x, p.y);
      if (!e.active) {
        if (e.state === 'dormant') {
          if (dP < e.d.act && act < cap + 1) { e.active = true; e.state = 'alert'; e.t = 0.55; act++; activate(e); Audio.play('leap'); if (run.n >= 8) showHint('tut_mimic'); }
          continue;
        }
        if (e.state === 'return') {
          const r = steer(e, e.home.x, e.home.y, e.d.speed * 0.8, dt, false);
          if (r.hx && r.hy) e.stuck += dt; if (e.stuck > 1.5 || dist2(e.x, e.y, e.home.x, e.home.y) < 64) { e.state = 'idle'; e.stuck = 0; e.home.x = e.x; e.home.y = e.y; }
        }
        if (dP < e.d.act && act < cap && (dP < e.d.act * 0.55 || Nav.los(e.x, e.y - 6, p.x, p.y - 6))) { activate(e); act++; }
        continue;
      }
      // leash / disengage
      if (dist(e.x, e.y, e.home.x, e.home.y) > e.d.leash || dP > e.d.act * 2.4) {
        if (!['charge', 'leap'].includes(e.state)) { e.active = false; e.state = 'return'; act--; continue; }
      }
      AI[e.ai](e, dt, dP, p);
    }
    // separation between active enemies + keep off the player
    const A = G.enemies.filter(e => !e.dead && (e.active || e.state === 'return'));
    for (let i = 0; i < A.length; i++) {
      const a = A[i];
      for (let j = i + 1; j < A.length; j++) {
        const b = A[j], md = a.half + b.half + 3, dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 < md * md && d2 > 0.01) { const d = Math.sqrt(d2), push = (md - d) * 0.5, nx = dx / d, ny = dy / d; Nav.move(a, -nx * push, -ny * push, true); Nav.move(b, nx * push, ny * push, true); }
      }
      if (a.state !== 'charge' && a.state !== 'leap') {
        const md = a.half + G.player.half + 1, dx = a.x - p.x, dy = a.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < md * md && d2 > 0.01) { const d = Math.sqrt(d2); Nav.move(a, dx / d * (md - d), dy / d * (md - d), true); }
      }
    }
    G.enemies = G.enemies.filter(e => !e.dead || e.deadT > 0);
  }
  const meleeHit = (e, cx, cy, r) => dist(cx, cy, G.player.x, G.player.y - 4) < r + G.player.half;
  const AI = {
    /* Bean Bandit: fast chaser, telegraphed short lunge that can be side-stepped */
    runner(e, dt, dP, p) {
      e.cd -= dt;
      if (e.state === 'chase') {
        steer(e, p.x, p.y, e.d.speed, dt);
        if (dP < 34 && e.cd <= 0) { e.state = 'windup'; e.t = e.d.windup; const d = dP || 1; e.lx = (p.x - e.x) / d; e.ly = (p.y - e.y) / d; }
      } else if (e.state === 'windup') { e.t -= dt; if (e.t <= 0) { e.state = 'strike'; e.t = 0.13; } }
      else if (e.state === 'strike') {
        e.t -= dt; Nav.move(e, e.lx * 210 * dt, e.ly * 210 * dt, true);
        if (e.t <= 0) { if (meleeHit(e, e.x + e.lx * 6, e.y + e.ly * 6, 13)) hurtPlayer(e.d.dmg, { kx: e.lx, ky: e.ly, kf: 90 }); e.state = 'recover'; e.t = 0.35; e.cd = e.d.cd; }
      } else if (e.state === 'recover') { e.t -= dt; if (e.t <= 0) e.state = 'chase'; }
      else e.state = 'chase';
    },
    /* Sugar Sprite: quick wobbling swarm with light contact damage */
    swarm(e, dt, dP, p) {
      e.cd -= dt; e.wob += dt * 6;
      const px = -(p.y - e.y), py = p.x - e.x, pl = Math.hypot(px, py) || 1, w = Math.sin(e.wob) * 26;
      steer(e, p.x + px / pl * w, p.y + py / pl * w, e.d.speed, dt);
      if (dP < e.half + p.half + 5 && e.cd <= 0) { hurtPlayer(e.d.dmg, { kx: (p.x - e.x) / (dP || 1), ky: (p.y - e.y) / (dP || 1), kf: 40 }); e.cd = e.d.cd; }
    },
    /* Latte Imp: keeps distance ahead of the player and lobs slowing latte splashes */
    imp(e, dt, dP, p) {
      e.cd -= dt;
      if (e.state === 'windup') {
        e.t -= dt;
        if (e.t <= 0) {
          const lead = 0.55; let tx = p.x + p.vx * lead, ty = p.y + p.vy * lead;
          const dd = dist(tx, ty, p.x, p.y); if (dd > 60) { tx = p.x + (tx - p.x) / dd * 60; ty = p.y + (ty - p.y) / dd * 60; }
          G.lobs.push({ x0: e.x, y0: e.y - 14, x: e.x, y: e.y - 14, tx, ty, t: 0, dur: 0.75, kind: 'latte' }); Audio.play('splash');
          e.state = 'chase'; e.cd = e.d.cd;
        }
        return;
      }
      const f = Nav.flowDir(G.world.dropField, p.x, p.y) || { x: 0, y: -1 };
      const gx = p.x + f.x * 80, gy = p.y + f.y * 80;
      if (dP < 85) away(e, p.x, p.y, e.d.speed, dt);
      else if (dist(e.x, e.y, gx, gy) > 30) steer(e, gx, gy, e.d.speed, dt);
      e.face = p.x < e.x ? -1 : 1;
      if (e.cd <= 0 && dP < 175 && Nav.los(e.x, e.y - 8, p.x, p.y - 8)) { e.state = 'windup'; e.t = e.d.windup; }
    },
    /* Barista Goblin: slow bruiser, long visible windup, vulnerable recovery */
    bruiser(e, dt, dP, p) {
      e.cd -= dt;
      if (e.state === 'chase') {
        steer(e, p.x, p.y, e.d.speed, dt);
        if (dP < 42 && e.cd <= 0) { e.state = 'windup'; e.t = e.d.windup; const d = dP || 1; e.lx = e.x + (p.x - e.x) / d * 16; e.ly = e.y + (p.y - e.y) / d * 16; e.face = p.x < e.x ? -1 : 1; }
      } else if (e.state === 'windup') {
        e.t -= dt;
        if (e.t <= 0) {
          if (meleeHit(e, e.lx, e.ly, 24)) hurtPlayer(e.d.dmg, { kx: (p.x - e.x) / (dP || 1), ky: (p.y - e.y) / (dP || 1), kf: 150 });
          Fx.ring(e.lx, e.ly, '#ffb347', 26, 0.3); Fx.burst(e.lx, e.ly, '#c9b48e', 8, 80, 2); Audio.play('slam'); Fx.shake(2);
          e.state = 'recover'; e.t = 0.9; e.vuln = 0.9; e.cd = e.d.cd;
        }
      } else if (e.state === 'recover') { e.t -= dt; if (e.t <= 0) e.state = 'chase'; }
      else e.state = 'chase';
    },
    /* Drip Cultist: ranged caster that keeps distance; every 3rd attack is a telegraphed triple shot */
    caster(e, dt, dP, p) {
      e.cd -= dt; e.face = p.x < e.x ? -1 : 1;
      const see = Nav.los(e.x, e.y - 12, p.x, p.y - 8);
      if (e.state === 'windup' || e.state === 'charge3') {
        e.t -= dt;
        if (e.t <= 0) {
          const a = Math.atan2(p.y - 8 - (e.y - 18), p.x - e.x), n = e.state === 'charge3' ? 3 : 1;
          for (let k = 0; k < n; k++) { const aa = a + (n > 1 ? (k - 1) * 0.26 : 0), sp = n > 1 ? 140 : 160; G.eproj.push({ x: e.x, y: e.y - 18, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, life: 2.2, dmg: e.d.dmg, r: n > 1 ? 4.5 : 3.5, big: n > 1 }); }
          e.state = 'chase'; e.cd = e.d.cd;
        }
        return;
      }
      if (dP < 105) away(e, p.x, p.y, e.d.speed, dt);
      else if (dP > 165 || !see) steer(e, p.x, p.y, e.d.speed, dt);
      if (e.cd <= 0 && see && dP < 195) { e.shots++; if (e.shots % 3 === 0) { e.state = 'charge3'; e.t = 0.65; Audio.play('charge'); } else { e.state = 'windup'; e.t = e.d.windup; } }
    },
    /* Mug Mimic: disguised; alerts with '!' and leaps to the spot the player stood on */
    mimic(e, dt, dP, p) {
      e.cd -= dt;
      if (e.state === 'alert') {
        e.t -= dt; e.lx = p.x; e.ly = p.y;
        if (e.t <= 0) { e.state = 'leap'; e.t = 0; e.x0 = e.x; e.y0 = e.y; e.dur = 0.45; }
      } else if (e.state === 'leap') {
        e.t += dt; const k = Math.min(1, e.t / e.dur);
        e.x = lerp(e.x0, e.lx, k); e.y = lerp(e.y0, e.ly, k); e.jz = Math.sin(k * Math.PI) * 26;
        if (k >= 1) {
          e.jz = 0; if (Nav.blocked(e.x, e.y, e.half, true)) Nav.unstick(e, true);
          if (dist(e.x, e.y, p.x, p.y) < 20) hurtPlayer(e.d.dmg, { pkg: 5, kx: (p.x - e.x) / (dP || 1), ky: (p.y - e.y) / (dP || 1), kf: 120 });
          Fx.ring(e.x, e.y, '#f1ebdf', 22, 0.3); Fx.burst(e.x, e.y, '#f1ebdf', 8, 70, 2); Audio.play('bump');
          e.state = 'recover'; e.t = 0.5; e.cd = 0.8;
        }
      } else if (e.state === 'chase') {
        steer(e, p.x, p.y, e.d.speed, dt);
        if (dP < 28 && e.cd <= 0) { e.state = 'windup'; e.t = 0.32; }
      } else if (e.state === 'windup') { e.t -= dt; if (e.t <= 0) { if (meleeHit(e, e.x, e.y, 16)) hurtPlayer(6, { kx: (p.x - e.x) / (dP || 1), ky: (p.y - e.y) / (dP || 1), kf: 70 }); e.state = 'recover'; e.t = 0.4; e.cd = e.d.cd; } }
      else if (e.state === 'recover') { e.t -= dt; if (e.t <= 0) e.state = 'chase'; }
      else e.state = 'chase';
    },
    /* Cream Drifter: slow, huge and tanky; contact shoves the courier */
    tank(e, dt, dP, p) {
      e.cd -= dt; steer(e, p.x, p.y, e.d.speed, dt);
      if (dP < e.half + p.half + 6 && e.cd <= 0) { const d = dP || 1; hurtPlayer(e.d.dmg, { kx: (p.x - e.x) / d, ky: (p.y - e.y) / d, kf: 170 }); e.cd = e.d.cd; Audio.play('bump'); }
    },
    /* Grinder Knight (Elite): melee swings + telegraphed lane charge; stunned when it hits a wall */
    knight(e, dt, dP, p) {
      e.cd -= dt; e.ccd -= dt;
      const st = e.state;
      if (st === 'chase') {
        steer(e, p.x, p.y, e.d.speed, dt);
        if (dP < 44 && e.cd <= 0) { e.state = 'windup'; e.t = e.d.windup; const d = dP || 1; e.lx = e.x + (p.x - e.x) / d * 18; e.ly = e.y + (p.y - e.y) / d * 18; }
        else if (e.ccd <= 0 && dP > 70 && dP < 220 && Nav.los(e.x, e.y - 10, p.x, p.y - 6)) {
          e.state = 'aim'; e.t = 0.85; const d = dP || 1; e.lx = (p.x - e.x) / d; e.ly = (p.y - e.y) / d; e.face = e.lx < 0 ? -1 : 1;
          let L = 0; while (L < 300 && !Nav.blocked(e.x + e.lx * L, e.y + e.ly * L, 6, false)) L += 6; e.lane = L; Audio.play('charge');
        }
      } else if (st === 'windup') {
        e.t -= dt;
        if (e.t <= 0) { if (meleeHit(e, e.lx, e.ly, 28)) hurtPlayer(e.d.dmg, { kx: (p.x - e.x) / (dP || 1), ky: (p.y - e.y) / (dP || 1), kf: 160 }); Fx.ring(e.lx, e.ly, '#c6ccd3', 30, 0.3); Audio.play('slam'); e.state = 'recover'; e.t = 0.6; e.cd = e.d.cd; }
      } else if (st === 'aim') { e.t -= dt; if (e.t <= 0) { e.state = 'charge'; e.t = 0; e.cdist = 0; } }
      else if (st === 'charge') {
        const sp = 300 * dt, hit = Nav.move(e, e.lx * sp, e.ly * sp, true); e.cdist += sp;
        if (Math.random() < 0.6) Fx.part({ x: e.x, y: e.y, vx: -e.lx * 40, vy: -e.ly * 40, life: 0.35, max: 0.35, size: 3, color: 'rgba(200,200,200,.6)', kind: 'steam' });
        if (dist(e.x, e.y, p.x, p.y) < e.half + p.half + 4) {
          hurtPlayer(20, { pkg: 12, kx: e.lx, ky: e.ly, kf: 230 }); Fx.shake(6); Audio.play('slam');
          e.state = 'recover'; e.t = 0.7; e.ccd = 4.5;
        } else if (hit.hx || hit.hy) {
          e.state = 'stunned'; e.t = 1.6; e.vuln = 1.6; e.ccd = 4.5; Fx.shake(5); Audio.play('slam'); Fx.burst(e.x + e.lx * 14, e.y + e.ly * 14 - 10, '#c6ccd3', 12, 110, 2.2);
        } else if (e.cdist > 290) { e.state = 'recover'; e.t = 0.5; e.ccd = 4.5; }
      } else if (st === 'stunned' || st === 'recover') { e.t -= dt; if (e.t <= 0) e.state = 'chase'; }
      else e.state = 'chase';
    },
    /* Steam Jugger (Elite): slow tank that marks steam zones ahead of time; steam burns HP and package */
    jugger(e, dt, dP, p) {
      e.cd -= dt; e.mcd -= dt;
      if (e.state === 'chase') {
        if (dP > 90) steer(e, p.x, p.y, e.d.speed, dt); e.face = p.x < e.x ? -1 : 1;
        if (dP < 42 && e.mcd <= 0) { e.state = 'slam'; e.t = 0.8; e.lx = e.x; e.ly = e.y; }
        else if (e.cd <= 0 && dP < 230) { e.state = 'windup'; e.t = e.d.windup; Audio.play('charge'); }
      } else if (e.state === 'windup') {
        e.t -= dt;
        if (e.t <= 0) {
          const f = Nav.flowDir(G.world.dropField, p.x, p.y) || { x: 0, y: -1 };
          const pts = [[p.x, p.y], [p.x + p.vx * 0.7 + f.x * 30, p.y + p.vy * 0.7 + f.y * 30], [p.x + G.run.rng.range(-60, 60), p.y + G.run.rng.range(-50, 20)]];
          for (const [x, y] of pts) { if (Nav.blocked(x, y, 4, false)) continue; G.zones.push({ x, y, r: 26, t: 0, warn: 1.0, act: 0.7, hit: false, src: e }); }
          e.state = 'chase'; e.cd = e.d.cd;
        }
      } else if (e.state === 'slam') {
        e.t -= dt;
        if (e.t <= 0) { if (meleeHit(e, e.lx, e.ly, 40)) hurtPlayer(14, { kx: (p.x - e.x) / (dP || 1), ky: (p.y - e.y) / (dP || 1), kf: 190 }); Fx.ring(e.x, e.y, '#ffb347', 40, 0.35); Fx.steam(e.x, e.y - 20, 8, 30); Audio.play('slam'); Fx.shake(4); e.state = 'chase'; e.mcd = 2.2; }
      } else e.state = 'chase';
    },
  };

  /* ---------- hazards ---------- */
  function steamPhase(h, s) { const t = h.t; if (t < s.idle) return 'idle'; if (t < s.idle + s.warn) return 'warn'; if (t < s.idle + s.warn + s.active) return 'active'; return 'cool'; }
  function updateHazards(dt) {
    const run = G.run, p = G.player, s = run.ch.steam;
    const onScreen = y => y > G.cam.y - 40 && y < G.cam.y + View.h + 40;
    const cycle = (h, hitTest, sx, sy) => {
      h.t += dt; if (h.t >= h.per) { h.t -= h.per; h.cyc++; h.hit = false; }
      const ph = steamPhase(h, s);
      if (ph !== h.ph) { if (ph === 'active' && onScreen(sy)) Audio.play('steam', 0.2); if (ph === 'warn' && onScreen(sy)) { Audio.play('warn', 0.2); if (run.n >= 3) showHint('tut_steam'); } h.ph = ph; }
      if (ph === 'active') {
        if (!h.hit && hitTest(p.x, p.y, p.half)) { if (hurtPlayer(9, { pkg: 7, steam: true })) h.hit = true; }
        for (const e of G.enemies) if (!e.dead && e.steamCyc !== h.cyc + h.x0 + h.y && e.state !== 'dormant' && hitTest(e.x, e.y, e.half)) { e.steamCyc = h.cyc + h.x0 + h.y; hitEnemy(e, 10, { noAggro: true }); }
        if (onScreen(sy) && Math.random() < dt * 30) Fx.steam(sx(), sy, 1, 8);
      }
    };
    for (const j of G.jets) cycle(j, (x, y, hh) => x + hh > j.x0 && x - hh < j.x1 && y > j.y - 12 && y < j.y + 16, () => lerp(j.x0, j.x1, Math.random()), j.y);
    for (const g of G.grates) { g.x0 = g.x; cycle(g, (x, y, hh) => dist(x, y, g.x, g.y) < g.r + 2 + hh * 0.2, () => g.x + (Math.random() - 0.5) * 30, g.y); }
    // Steam Jugger zones
    for (let i = G.zones.length - 1; i >= 0; i--) {
      const z = G.zones[i]; z.t += dt;
      if (z.t > z.warn && z.t < z.warn + z.act) {
        if (!z.hit && dist(p.x, p.y, z.x, z.y) < z.r + 2) { if (hurtPlayer(10, { pkg: 8, steam: true })) z.hit = true; }
        if (Math.random() < dt * 40) Fx.steam(z.x, z.y, 1, z.r * 1.4);
        if (!z.snd) { z.snd = true; Audio.play('steam', 0.15); }
      }
      if (z.t > z.warn + z.act) G.zones.splice(i, 1);
    }
    // latte lobs & puddles
    for (let i = G.lobs.length - 1; i >= 0; i--) {
      const l = G.lobs[i]; l.t += dt; const k = Math.min(1, l.t / l.dur);
      l.x = lerp(l.x0, l.tx, k); l.y = lerp(l.y0, l.ty, k) - Math.sin(k * Math.PI) * 30;
      if (k >= 1) {
        if (!Nav.blocked(l.tx, l.ty, 2, false)) G.puddles.push({ x: l.tx, y: l.ty, r: 22, t: 4.5, max: 4.5 });
        if (dist(l.tx, l.ty, p.x, p.y) < 16) hurtPlayer(4, {});
        Fx.burst(l.tx, l.ty, '#f3e1c4', 8, 60, 2); G.lobs.splice(i, 1);
      }
    }
    for (let i = G.puddles.length - 1; i >= 0; i--) { G.puddles[i].t -= dt; if (G.puddles[i].t <= 0) G.puddles.splice(i, 1); }
    // moving service carts — fair dynamic obstacles
    for (const c of G.carts) {
      const ox = c.x; c.x += c.vx * dt;
      if (c.x < c.minX) { c.x = c.minX; c.vx = Math.abs(c.vx); } if (c.x > c.maxX) { c.x = c.maxX; c.vx = -Math.abs(c.vx); }
      const dx = c.x - ox, ovX = (c.hw + p.half) - Math.abs(p.x - c.x), ovY = (c.hh + p.half) - Math.abs(p.y - c.y);
      if (ovX > 0 && ovY > 0) {
        if (ovY < ovX) { Nav.move(p, 0, (p.y < c.y ? -ovY : ovY), false); }
        else {
          const want = (p.x < c.x ? -ovX : ovX), bx = p.x; Nav.move(p, want, 0, false);
          if (Math.abs(p.x - bx) < Math.abs(want) - 0.5) { c.x = ox - dx; c.vx = -c.vx; Nav.move(p, 0, p.y < c.y ? -2 : 2, false); }
          if (p.cartCd <= 0 && Math.sign(dx) === Math.sign(p.x - c.x) && run.picked) {
            p.cartCd = 1.1; hurtPlayer(6, { pkg: 5 * run.pkg.impactMul, impact: true, kx: Math.sign(dx), ky: 0, kf: 150 }); Audio.play('bump'); Fx.shake(3);
          }
        }
      }
      for (const e of G.enemies) if (!e.dead && Math.abs(e.x - c.x) < c.hw + e.half && Math.abs(e.y - c.y) < c.hh + e.half) Nav.move(e, 0, e.y < c.y ? -2 : 2, true);
    }
  }

  /* ---------- stations, checkpoint, delivery ---------- */
  function updateStations() {
    const run = G.run, p = G.player, w = G.world;
    if (!run.picked && dist(p.x, p.y, w.pickup.x, w.pickup.y) < 26) {
      run.picked = true; Audio.play('pickup'); Fx.burst(w.pickup.x, w.pickup.y - 12, '#ffd166', 16, 100, 2.4); Fx.ring(p.x, p.y - 10, '#ffd166', 40);
      Fx.text(p.x, p.y - 34, T('orderTaken'), '#ffd166', 11, 1.2);
      showHint('tut_go');
      if (run.n === 5) showHint('tut_heavy');
      (run.ch.tut || []).forEach(showHint);
      const rh = { hot: 'tut_hot', frozen: 'tut_frozen', fizzy: 'tut_fizzy', vip: 'tut_vip' }[run.pkg.rule]; if (rh) showHint(rh);
      if (run.pkg.shownAs === 'MYSTERY_ORDER') showHint('tut_mystery');
      if (G.world.drops.length > 1) showHint('tut_multidrop');
    }
    for (const h of w.heals) {
      if (h.y > G.cam.y && h.y < G.cam.y + View.h && run.picked) showHint('tut_heal');
      if (!h.used && run.picked && dist(p.x, p.y, h.x, h.y) < 20) {
        h.used = true; run.stats.healUsed = true; healPlayer(35); Audio.play('heal'); Fx.burst(h.x, h.y - 10, '#5fd3b4', 14, 80, 2.4); Fx.ring(p.x, p.y - 8, '#5fd3b4', 34);
      }
    }
    const cp = w.checkpoint;
    if (cp && !cp.used && run.picked && cp.y > G.cam.y && cp.y < G.cam.y + View.h) showHint('tut_check');
    if (cp && !cp.used && run.picked && p.y < cp.y + 2) {
      // Phase 03: the checkpoint keeps its heal and grants Run XP instead of an independent extra skill pick.
      cp.used = true; healPlayer(15); Audio.play('checkpoint'); Fx.ring(p.x, p.y - 8, '#5fd3b4', 50, 0.6);
      const m = run.mods;
      if (m.cpHeal) healPlayer(p.maxHp * m.cpHeal);
      if (m.cpPkg) { p.pkgHp = Math.min(p.pkgMax, p.pkgHp + p.pkgMax * m.cpPkg); Fx.text(p.x + 10, p.y - 40, T('pkgRepaired'), '#ffd38a', 9); }
      if (m.cpBoost) run.cpBoostT = 5;
      Fx.text(p.x, p.y - 30, T('checkpoint'), '#5fd3b4', 11, 1.2);
      addXp(run.xpPlan.cp, 'cp');
    }
    const fl = w.flag[Math.floor(p.y / TILE) * COLS + Math.floor(p.x / TILE)];
    if (fl & 1) { run.stats.risky = true; if (run.picked && !run.riskyXp) { run.riskyXp = true; addXp(run.xpPlan.risky, 'risky'); } }
    if (run.picked) {
      const si = w.rowSeg[clamp(Math.floor(p.y / TILE), 0, w.rows - 1)];
      if (run.xpPlan.routeSegIdx.has(si) && !run.segSeen[si]) { run.segSeen[si] = 1; addXp(run.xpPlan.seg, 'route'); }
      const seg = w.segs[w.rowSeg[clamp(Math.floor(p.y / TILE), 0, w.rows - 1)]];
      if (seg && seg.name.startsWith('SPLIT') && p.y < (seg.r1 + 3) * TILE) showHint('tut_split');
      const d = Nav.fieldAt(w.dropField, p.x, p.y); if (d >= 0 && d < run.stats.minDist) run.stats.minDist = d;
    }
  }

  /** Intermediate multi-drop delivery: real hand-over, XP once, next customer becomes the active target. */
  function completeDrop(run, d) {
    const w = G.world, p = G.player; if (d.done) return;
    d.done = true; run.stats.drops++; run.dropIdx++;
    const next = w.drops[run.dropIdx]; w.drop = next; w.dropField = next.field;
    addXp(run.xpPlan.drop, 'drop'); Audio.play('pickup'); Fx.ring(p.x, p.y - 10, '#5fd3b4', 46); Fx.burst(d.cx, d.cy, '#5fd3b4', 14, 90, 2.2);
    Fx.text(p.x, p.y - 36, T('dropDone', run.stats.drops, run.stats.dropsTotal), '#5fd3b4', 11, 1.4);
    Bus.emit('DROP_COMPLETED', { idx: d.idx, of: run.stats.dropsTotal });
  }
  /* ---------- end of run (terminal state entered exactly once) ---------- */
  function endRun(success, reason) {
    const run = G.run; if (!run || run.ended) return;
    run.ended = true; run.success = success; run.reason = reason; run.state = 'ending'; run.endT = success ? 1.7 : 1.5;
    const p = G.player;
    run.stats.time = run.time; run.stats.pkgPct = p.pkgHp / p.pkgMax; run.stats.hp = p.hp; run.stats.maxHp = p.maxHp; run.stats.pkgHp = p.pkgHp; run.stats.pkgMax = p.pkgMax;
    run.stats.progress = clamp(1 - run.stats.minDist / Math.max(1, G.world.pathLen), 0, 1);
    if (success) run.stats.progress = 1;
    Input.reset(); clearHints();
    run.settled = Progression.settle(run);
    if (success) { Audio.play('win'); for (let i = 0; i < 40; i++) Fx.part({ x: p.x, y: p.y - 10, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 260, grav: 400, life: 1.4, max: 1.4, size: 3, color: ['#ffd166', '#e5533d', '#5fd3b4', '#5aa9e6', '#fff1dc'][i % 5], kind: 'sq', drag: 0.6 }); }
    else { Audio.play('fail'); Fx.burst(p.x, p.y - 10, '#3a2418', 16, 80, 3); Fx.shake(5); }
  }

  /* ---------- per-frame ---------- */
  function update(dt) {
    const run = G.run; if (!run) return;
    G.t += dt;
    updateHints(dt);
    if (run.paused || run.state === 'intro' || run.state === 'pick') { updateCam(dt, true); return; }
    if (run.state === 'ending') {
      run.endT -= dt; updateFx(dt); updateCam(dt);
      if (run.endT <= 0 && run.state === 'ending') { run.state = 'done'; Bus.emit('end', run); }
      return;
    }
    if (run.state !== 'play') return;
    if (run.picked && !BossArena.inArena(run)) run.time += dt; // the delivery timer pauses inside the boss arena
    run.procT -= dt; if (run.procT <= 0) { run.procT = CAPS.procWindow; run.procN = 0; }
    run.thunderCd -= dt; run.guardCd -= dt;
    G.navT -= dt;
    if (G.navT <= 0 && run.picked) { G.navT = 0.25; const p = G.player; Nav.bfs([[Math.floor(p.x / TILE), Math.floor(p.y / TILE)]], true, 34, G.enemyField); }
    updatePlayer(dt);
    updateWeapon(dt);
    updateProj(dt);
    if (run.picked) { updateEnemies(dt); updateHazards(dt); } else { for (const e of G.enemies) e.anim += dt * 3; }
    updateStations();
    updateFx(dt);
    updateCam(dt);
    // Terminal checks. Rule: failure conditions are evaluated before delivery,
    // so reaching the dropoff on the same frame HP/package hits zero is a failure.
    if (run.state !== 'play') return;
    const p = G.player;
    const ruleFail = PackageRules.update(run, p, dt, { nearSteam: run.picked && PackageRules.nearSteam(G, p) });
    const bossFail = BossArena.update(run, dt);
    if (p.hp <= 0) endRun(false, 'hp');
    else if (p.pkgHp <= 0) endRun(false, 'pkg');
    else if (ruleFail) endRun(false, ruleFail);
    else if (bossFail) endRun(false, bossFail);
    else if (run.picked && run.time >= run.timer) { run.time = run.timer; endRun(false, 'time'); }
    else if (run.picked) {
      const d = G.world.drop;
      if (p.x > d.x0 && p.x < d.x1 && p.y > d.y0 && p.y < d.y1) {
        const vf = PackageRules.deliveryCheck(run, p);
        if (vf) endRun(false, vf);
        else if (!d.final) completeDrop(run, d);
        else if (!run.boss || run.boss.state === 'dead') { run.stats.drops = run.stats.dropsTotal; endRun(true, null); }
      }
    }
    // queued level-up choices open at the next safe frame (never on the delivery / failure frame)
    if (run.state === 'play' && run.pendingPicks > 0) openLevelPick();
  }
  function updateFx(dt) {
    for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= dt; if (q.life <= 0) { G.parts.splice(i, 1); continue; } const dr = Math.exp(-q.drag * dt); q.vx *= dr; q.vy *= dr; q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    for (let i = G.floats.length - 1; i >= 0; i--) { const f = G.floats[i]; f.life -= dt; f.y -= 26 * dt; if (f.life <= 0) G.floats.splice(i, 1); }
    for (let i = G.bolts.length - 1; i >= 0; i--) { G.bolts[i].life -= dt; if (G.bolts[i].life <= 0) G.bolts.splice(i, 1); }
  }
  function updateCam(dt, frozen) {
    const c = G.cam, p = G.player, w = G.world; if (!p) return;
    const target = clamp(p.y - View.h * 0.6, 0, Math.max(0, w.h - View.h));
    if (!frozen) c.y += (target - c.y) * Math.min(1, 7 * dt); c.y = clamp(c.y, 0, Math.max(0, w.h - View.h));
    c.shake = Math.max(0, c.shake - dt * 18);
    c.ox = (Math.random() - 0.5) * c.shake; c.oy = (Math.random() - 0.5) * c.shake;
  }
  /* ---------- flow control used by UI (all choices are validated against the engine-owned offer) ---------- */
  function newOffer(r) { r.offer = SkillMgr.offer(r); }
  function beginPicks() { const r = G.run; r.state = 'pick'; r.pickKind = 'start'; r.pickIdx = 0; r.pickTotal = r.ch.picks; r.picksLeft = r.ch.picks; newOffer(r); Bus.emit('pick', { kind: 'start' }); }
  function openLevelPick() {
    const r = G.run; r.state = 'pick'; r.pickKind = 'level'; r.pickIdx = 0; r.pickTotal = r.pendingPicks; r.picksLeft = r.pendingPicks; r.pendingPicks = 0;
    Input.reset(); newOffer(r); Bus.emit('pick', { kind: 'level' });
  }
  function choose(id) {
    const r = G.run; if (!r || r.state !== 'pick' || !r.offer.includes(id)) return false;
    SkillMgr.apply(r, id); r.picksLeft--; r.pickIdx++;
    Bus.emit('SKILL_PICKED', { id, kind: SkillMgr.kindOf(id) });
    if (r.picksLeft > 0) { newOffer(r); Bus.emit('pick', { kind: r.pickKind }); }
    else if (r.pendingPicks > 0) openLevelPick();
    else { r.state = 'play'; r.offer = []; Bus.emit('resume'); if (r.n === 1 && !r.picked) { showHint('tut_move'); showHint('tut_pickup'); } }
    return true;
  }
  /** Free reroll (1 per run, +1 with Second Choice). Replaces the whole offer deterministically. */
  function reroll() { const r = G.run; if (!r || r.state !== 'pick' || r.rerolls <= 0) return false; r.rerolls--; newOffer(r); Bus.emit('pick', { kind: r.pickKind, reroll: true }); return true; }
  function pause(v) { const r = G.run; if (!r || r.ended || r.state !== 'play') return false; r.paused = v; Input.reset(); return true; }
  function quit() { const r = G.run; if (!r) return; if (!r.ended) { r.ended = true; r.success = false; r.reason = 'quit'; r.state = 'done'; } clearHints(); G.run = null; }
  BossArena.bind({ G, hurtPlayer, spawnHelper, Fx, Audio, Bus, showHint, T, Save, activate });
  return { start, update, recalc, beginPicks, choose, reroll, pause, quit, endRun, hurtPlayer, remainingFrac, showHint, pickTarget, addXp, CAPS, completeDrop };
})();
