/* FOOTBALL WARS — deterministic 100v100 battle engine (no DOM).
 * Fixed 1/60 s step, seeded mulberry32 PRNG. Same (seed, teams, settings) => identical battle.
 * Math.random() is never used here. */
(function (root) {
'use strict';

const DT = 1 / 60;
const LW = 360, LH = 640;                       // logical (pixel-art) frame
const ARENA = { x0: 16, x1: 344, y0: 106, y1: 608 };
const MIDY = (ARENA.y0 + ARENA.y1) / 2;
const TL = { freezeEnd: 1.05, battleStart: 2.2 }; // intro timeline (s)
const MAX_TOTAL = 65;                            // hard cap for whole video (s)
const OUTRO_MIN = 3.3, OUTRO_MAX = 6.4;
const MAX_BATTLE = 59.2;                         // battle seconds hard cap (2.2 + 59.2 + 3.3 <= 65)
const ROLES = ['striker', 'winger', 'playmaker', 'defender', 'goalkeeper', 'support', 'captain'];
const ATTRS = ['attack', 'defense', 'speed', 'pressing', 'stamina', 'teamwork', 'physical', 'technique', 'goalkeeping', 'finishing'];

// role base stats, logical px & seconds. range = battle_engine_config default_range * RANGE_SCALE
const RANGE_SCALE = 0.45;
let ADV_DMG = 0.5, ADV_HP = 0.25;
const ROLE_BASE = {
  striker:    { hp: 105, armor: 0.05, dmg: 15, interval: 1.35, speed: 30, proj: 185 },
  winger:     { hp: 95,  armor: 0.04, dmg: 11, interval: 1.05, speed: 37, proj: 165 },
  playmaker:  { hp: 100, armor: 0.05, dmg: 10, interval: 1.2,  speed: 31, proj: 160 },
  defender:   { hp: 172, armor: 0.19, dmg: 18, interval: 1.25, speed: 33, proj: 0 },
  goalkeeper: { hp: 190, armor: 0.15, dmg: 11, interval: 1.5,  speed: 27, proj: 150 },
  support:    { hp: 110, armor: 0.06, dmg: 6,  interval: 1.35, speed: 32, proj: 150 },
  captain:    { hp: 170, armor: 0.14, dmg: 13, interval: 1.2,  speed: 31, proj: 175 }
};
const DEFAULT_RANGE = { striker: 130, winger: 110, playmaker: 160, defender: 46, goalkeeper: 65, support: 125, captain: 100 };

// duration presets: damage scale + anti-stall schedule (battle seconds)
const DURATION = {
  short:    { dmg: 0.86, hunt: 18, zone: 27, storm: 38 },
  standard: { dmg: 0.66, hunt: 24, zone: 36, storm: 47 },
  long:     { dmg: 0.54, hunt: 30, zone: 42, storm: 53 }
};

const SPECIAL_NAMES = {
  pressing_storm: { tr: 'PRES FIRTINASI', en: 'PRESSING STORM' },
  high_line_interception: { tr: 'YÜKSEK HAT KESİCİ', en: 'HIGH LINE INTERCEPT' },
  one_two_combo: { tr: 'VER-KAÇ KOMBO', en: 'ONE-TWO COMBO' },
  precision_through_ball: { tr: 'ARA PASI', en: 'THROUGH BALL' },
  counter_burst: { tr: 'KONTRA PATLAMASI', en: 'COUNTER BURST' },
  quick_transition: { tr: 'HIZLI GEÇİŞ', en: 'QUICK TRANSITION' },
  iron_wall: { tr: 'DEMİR DUVAR', en: 'IRON WALL' },
  last_line_save: { tr: 'SON ÇİZGİ KURTARIŞI', en: 'LAST LINE SAVE' },
  shoulder_charge: { tr: 'OMUZ ŞARJI', en: 'SHOULDER CHARGE' },
  stamina_surge: { tr: 'KONDİSYON PATLAMASI', en: 'STAMINA SURGE' },
  cross_fire: { tr: 'ÇAPRAZ ATEŞ', en: 'CROSS FIRE' },
  flank_overload: { tr: 'KANAT BASKISI', en: 'FLANK OVERLOAD' }
};
const ROLE_NAMES = {
  striker: { tr: 'Forvet', en: 'Striker' }, winger: { tr: 'Kanat', en: 'Winger' },
  playmaker: { tr: 'Oyun kurucu', en: 'Playmaker' }, defender: { tr: 'Defans', en: 'Defender' },
  goalkeeper: { tr: 'Kaleci', en: 'Goalkeeper' }, support: { tr: 'Destek', en: 'Support' },
  captain: { tr: 'Kaptan', en: 'Captain' }
};

// ---- event types (compact event log) ----
const EV = { SHOT: 1, CURVE: 2, PASS: 3, TACKLE: 4, HIT: 5, CRIT: 6, KO: 7, SAVE: 8, HEAL: 9, SPECIAL: 10,
  SPECIAL_FIRE: 11, INTERCEPT: 12, CLEAR: 13, FINAL15: 14, FINAL5: 15, HUNT: 16, ZONE: 17, STORM: 18,
  SUDDEN: 19, END: 20, ADAPT: 21, ENTRY: 22, START: 23, ASSIST: 24, EXPLODE: 25, MISS: 26 };

// ---------------- PRNG ----------------
function Rng(seed) { this.s = seed >>> 0; }
Rng.prototype.next = function () {
  let a = (this.s = (this.s + 0x6D2B79F5) | 0);
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
Rng.prototype.range = function (a, b) { return a + (b - a) * this.next(); };
Rng.prototype.int = function (n) { return Math.floor(this.next() * n); };
Rng.prototype.chance = function (p) { return this.next() < p; };
Rng.prototype.normal = function () {
  let u = this.next(); if (u < 1e-9) u = 1e-9;
  const v = this.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function eff(v, k) { return 1 + k * (v - 70) / 30; }

// ---------------- team derivation ----------------
function deriveTeam(team, cfg, side, oppPower, rng, dur) {
  const bp = team.battle_profile;
  const archDef = (cfg.archetype_definitions && cfg.archetype_definitions[bp.archetype]) || { stat: {}, tendency: 'formation' };
  // Attributes shape the team's *profile* (mean-centred around 70) plus the archetype's tactical bonus;
  // overall strength enters only via the soft-capped power gap below, so huge rating gaps are not compounded.
  let mean = 0; for (const k of ATTRS) mean += (bp.attributes[k] || 60); mean /= ATTRS.length;
  const at = {}, raw = {};
  for (const k of ATTRS) { raw[k] = bp.attributes[k] || 60; at[k] = clamp(70 + (raw[k] - mean) * 1.4 + ((archDef.stat && archDef.stat[k]) || 0), 1, 100); }
  const v = bp.variance || {};
  const formStd = (v.team_form_std_pct != null ? v.team_form_std_pct : 9) / 100;
  const form = clamp(1 + rng.normal() * formStd, 0.80, 1.20);
  const cap = ((cfg.simulation_engine_recommendation && cfg.simulation_engine_recommendation.upset_control &&
    cfg.simulation_engine_recommendation.upset_control.power_advantage_cap_pct) || 18) / 100;
  // soft non-linear cap on the power gap (game-scale power_index, never raw Elo/FIFA points)
  const adv = cap * Math.tanh((bp.power_index - oppPower) / 24);
  const T = {
    side, team, id: team.id, archetype: bp.archetype, tendency: archDef.tendency || 'formation', at, raw, form, adv,
    specialsIds: (bp.specials || []).slice(0, 2),
    powMul: 1 + adv * ADV_DMG,
    dmgMul: eff(at.attack, 0.07) * form,
    shotMul: eff(at.finishing, 0.06),
    hpMul: eff(at.physical, 0.05) * eff(at.defense, 0.05) * (1 + adv * ADV_HP),
    armorAdd: (at.defense - 70) / 600,
    speedMul: eff(at.speed, 0.07) * (0.94 + 0.06 * form),
    atkRate: eff(at.pressing, 0.04) * (0.96 + 0.04 * form),
    drain: clamp(1.35 - at.stamina / 160, 0.6, 1.4),
    teamwork: eff(at.teamwork, 0.10),
    tech: eff(at.technique, 0.06),
    gk: at.goalkeeping,
    critChance: clamp(((v.critical_chance_pct != null ? v.critical_chance_pct : 7) / 100) + (at.technique - 70) / 2000, 0.03, 0.12),
    critMul: v.critical_multiplier || 1.45,
    unitStd: (v.unit_trait_std_pct != null ? v.unit_trait_std_pct : 14) / 100,
    acq: 95 + at.pressing * 0.45 + (bp.aggression || 60) * 0.2,
    knock: eff(at.physical, 0.12),
    dmgScale: dur.dmg,
    streakAdapt: v.streak_adaptation !== false,
    // runtime
    alive: 0, kills: 0, elimByRole: {}, lossByRole: {}, specialsUsed: {}, recentKO: [], adaptCd: 0,
    specials: [], aliveList: []
  };
  for (const r of ROLES) { T.elimByRole[r] = 0; T.lossByRole[r] = 0; }
  return T;
}

// ---------------- world creation ----------------
function createWorld(opts) {
  // opts: {seed, teamA, teamB, cfg, duration:'standard', fxLevel: 1}
  const seed = opts.seed >>> 0;
  const dur = DURATION[opts.duration] || DURATION.standard;
  const rng = new Rng(seed ^ hashStr(opts.teamA.id + '|' + opts.teamB.id));
  const fxRng = new Rng((seed * 2654435761) ^ 0x9E3779B9);
  const w = {
    seed, opts, dur, rng, fxRng, tick: 0, t: 0, phase: 'freeze', battleT: 0,
    units: [], teams: [], proj: [], specials: [], parts: [], texts: [], banners: [], events: [],
    hash: 2166136261 >>> 0, evCount: 0,
    grid: null, gridNext: null, zone: { x0: ARENA.x0, x1: ARENA.x1, y0: ARENA.y0, y1: ARENA.y1, active: false },
    hunt: false, storm: false, sudden: false, winner: -1, endT: 0, endTick: 0, outroLen: OUTRO_MIN,
    final15: -1, final5: -1, rules: [], shake: 0, flash: 0, lastKO: null, fxLevel: opts.fxLevel == null ? 1 : opts.fxLevel,
    partCap: [260, 520, 900][opts.fxLevel == null ? 1 : opts.fxLevel] || 520, auraTimer: 0, lastDamageT: 0,
    tiebreak: null, startTotal: 0, cam: { x: LW / 2, y: MIDY, z: 1 }
  };
  const pa = opts.teamA.battle_profile.power_index, pb = opts.teamB.battle_profile.power_index;
  w.teams[0] = deriveTeam(opts.teamA, opts.cfg, 0, pb, rng, dur);
  w.teams[1] = deriveTeam(opts.teamB, opts.cfg, 1, pa, rng, dur);
  for (let s = 0; s < 2; s++) spawnTeam(w, s);
  for (let s = 0; s < 2; s++) {
    const T = w.teams[s];
    T.specials = T.specialsIds.map((id, i) => ({ id, cd: 5.5 + i * 4 + rng.range(0, 2.5), uses: 0 }));
  }
  w.startTotal = w.units.length;
  if (opts.ruleset === 'fusion') w.fb = fbCreate(w, opts); // Classic worlds have no w.fb at all
  // grid
  w.gcs = 16; w.gcols = Math.ceil(LW / w.gcs); w.grows = Math.ceil(LH / w.gcs);
  w.grid = new Int32Array(w.gcols * w.grows); w.gridNext = new Int32Array(w.units.length);
  for (let i = 0; i < 360; i++) w.proj.push(newProj());
  return w;
}

function newProj() {
  return { on: false, kind: 0, side: 0, owner: -1, tgt: -1, x: 0, y: 0, vx: 0, vy: 0, sp: 0, dmg: 0, life: 0, max: 0,
    turn: 0, pierce: 0, hits: [], z: 0, vz: 0, aoe: 0, ax: 0, ay: 0, checked: [], tr: new Float32Array(10), trN: 0, trI: 0, crit: false, special: 0 };
}
const PK = { SHOT: 1, CURVE: 2, PASS: 3, CLEAR: 4, POWER: 5, PIERCE: 6, CROSS: 7, COMBO: 8, WEAK: 9 };

function spawnTeam(w, side) {
  const T = w.teams[side], rng = w.rng, team = T.team;
  const roles = team.battle_profile.roles_per_100;
  const dir = side === 0 ? -1 : 1;                         // forward direction in y
  const goalY = side === 0 ? ARENA.y1 - 8 : ARENA.y0 + 8;
  const frontY = side === 0 ? MIDY + 64 : MIDY - 64;
  const depth = { goalkeeper: 0.04, defender: 0.30, support: 0.50, captain: 0.55, playmaker: 0.62, winger: 0.82, striker: 0.92 };
  const variants = 6;
  for (const role of ROLES) {
    const n = roles[role] | 0; if (!n) continue;
    const d = depth[role];
    const bandY = goalY + (frontY - goalY) * d;
    let cols, x0 = ARENA.x0 + 10, x1 = ARENA.x1 - 10;
    if (role === 'goalkeeper') { x0 = 70; x1 = 290; }
    cols = Math.min(n, role === 'winger' ? 6 : 12);
    const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      let x;
      if (role === 'winger') {
        // split wingers to both flanks
        const left = (i % 2 === 0); const k = Math.floor(i / 2), m = Math.ceil(n / 2);
        x = left ? (ARENA.x0 + 14 + (k % 3) * 18) : (ARENA.x1 - 14 - (k % 3) * 18);
        const rr = Math.floor(k / 3);
        const y = bandY - dir * rr * 13 + rng.range(-3, 3);
        addUnit(w, T, role, x + rng.range(-3, 3), y, variants, dir); void m; continue;
      }
      const cw = (x1 - x0) / cols;
      x = x0 + (c + 0.5) * cw + rng.range(-cw * 0.28, cw * 0.28);
      const y = bandY - dir * (r - (rows - 1) / 2) * 12 + rng.range(-3, 3);
      addUnit(w, T, role, x, y, variants, dir);
    }
  }
}

function addUnit(w, T, role, fx, fy, variants, dir) {
  const rng = w.rng, b = ROLE_BASE[role];
  const skill = clamp(1 + rng.normal() * T.unitStd, 0.78, 1.22);
  const id = w.units.length;
  const hp = b.hp * T.hpMul * (0.85 + 0.15 * skill) * (role === 'goalkeeper' ? eff(T.gk, 0.08) : 1);
  const back = role === 'goalkeeper' ? 4 : 22 + rng.range(0, 8);
  const u = {
    id, side: T.side, role, ri: ROLES.indexOf(role),
    x: clamp(fx, ARENA.x0 + 2, ARENA.x1 - 2), y: clamp(fy - dir * back, ARENA.y0 + 2, ARENA.y1 - 2),
    hx: clamp(fx, ARENA.x0 + 2, ARENA.x1 - 2), hy: clamp(fy, ARENA.y0 + 2, ARENA.y1 - 2),
    mvx: 0, mvy: 0, kbx: 0, kby: 0, face: rng.chance(0.5) ? 1 : -1, back: T.side === 0,
    hp, maxHp: hp, armor: b.armor + T.armorAdd, dmg: b.dmg * skill, interval: b.interval / (0.9 + 0.1 * skill),
    range: DEFAULT_RANGE[role] * RANGE_SCALE, speed: b.speed * (0.92 + 0.08 * skill), projSp: b.proj,
    cd: rng.range(0.1, 1.2), passCd: rng.range(0.5, 2), healCd: rng.range(0.5, 2), tgt: -1, retarget: 0,
    targetedBy: 0, state: 'idle', act: '', actT: 0, animT: rng.range(0, 1), stun: 0, dashT: 0, dvx: 0, dvy: 0, dashHit: false,
    recover: 0, skill, alive: true, deadT: 0, kills: 0, assists: 0, variant: rng.int(variants), sta: 100,
    hasteT: 0, hasteMul: 1, atkSpdT: 0, atkSpdMul: 1, dmgBuffT: 0, dmgBuffMul: 1, shieldT: 0, shield: 0, invulnT: 0,
    slowT: 0, slowMul: 1, regenT: 0, regen: 0, critT: 0, critAdd: 0, interceptT: 0, kbImmuneT: 0, adaptT: 0,
    assistMul: 1, assistFrom: -1, aura: false, flash: 0, side2: rng.chance(0.5) ? 1 : -1, wob: rng.range(0, 6.28),
    killedBy: -1, koT: 0, guard: false, hitT: -9, spread: 0.3 + rng.next() * 0.8
  };
  if (role === 'goalkeeper') { const g = w.units.filter(o => o.side === T.side && o.role === 'goalkeeper').length; u.guard = g < 2; if (!u.guard) u.range = 40; }
  w.units.push(u); T.alive++; T.aliveList.push(u);
}

// ---------------- event log + hash ----------------
function ev(w, type, a, b, c, x, y) {
  w.events.push({ k: w.tick, t: w.t, type, a: a == null ? -1 : a, b: b == null ? -1 : b, c: c == null ? 0 : c, x: x == null ? 0 : x, y: y == null ? 0 : y });
  w.evCount++;
  let h = w.hash;
  h = Math.imul(h ^ w.tick, 16777619) >>> 0;
  h = Math.imul(h ^ type, 16777619) >>> 0;
  h = Math.imul(h ^ (a == null ? 65535 : a & 0xffff), 16777619) >>> 0;
  h = Math.imul(h ^ (b == null ? 65535 : b & 0xffff), 16777619) >>> 0;
  h = Math.imul(h ^ (Math.round((c || 0) * 100) | 0), 16777619) >>> 0;
  w.hash = h;
}

// ---------------- grid ----------------
function rebuildGrid(w) {
  w.grid.fill(-1);
  const cs = w.gcs, cols = w.gcols, rows = w.grows;
  for (let i = 0; i < w.units.length; i++) {
    const u = w.units[i]; if (!u.alive) continue;
    const cx = clamp((u.x / cs) | 0, 0, cols - 1), cy = clamp((u.y / cs) | 0, 0, rows - 1);
    const c = cy * cols + cx; w.gridNext[i] = w.grid[c]; w.grid[c] = i;
  }
}
// collect units within r into out array (reused)
const _q = [];
function query(w, x, y, r, side) { // side: -1 any, 0/1 only that side
  _q.length = 0;
  const cs = w.gcs, cols = w.gcols, rows = w.grows, r2 = r * r;
  const cx0 = clamp(((x - r) / cs) | 0, 0, cols - 1), cx1 = clamp(((x + r) / cs) | 0, 0, cols - 1);
  const cy0 = clamp(((y - r) / cs) | 0, 0, rows - 1), cy1 = clamp(((y + r) / cs) | 0, 0, rows - 1);
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    let i = w.grid[cy * cols + cx];
    while (i !== -1) {
      const u = w.units[i];
      if (u.alive && (side < 0 || u.side === side)) { const dx = u.x - x, dy = u.y - y; if (dx * dx + dy * dy <= r2) _q.push(u); }
      i = w.gridNext[i];
    }
  }
  return _q;
}

// ---------------- FX (deterministic, separate RNG; never affects battle) ----------------
function part(w, type, x, y, vx, vy, life, color, size, z, vz) {
  if (w.parts.length >= w.partCap) return;
  w.parts.push({ type, x, y, vx, vy, life, max: life, color, size: size || 1, z: z || 0, vz: vz || 0 });
}
function burst(w, x, y, n, colors, spd, life, type, up) {
  const r = w.fxRng; n = Math.round(n * [0.45, 1, 1.6][w.fxLevel]);
  for (let i = 0; i < n; i++) {
    const a = r.next() * 6.283, s = spd * (0.3 + r.next() * 0.9);
    part(w, type || 'spark', x, y, Math.cos(a) * s, Math.sin(a) * s * 0.7, life * (0.6 + r.next() * 0.7),
      colors[i % colors.length], r.next() < 0.3 ? 2 : 1, up ? 2 : 0, up ? (20 + r.next() * up) : 0);
  }
}
function ftext(w, text, x, y, color, life, big) { if (w.texts.length > 14) w.texts.shift(); w.texts.push({ text, x, y, color, life: life || 0.9, max: life || 0.9, big: !!big }); }
function banner(w, key, dur, color) { w.banners.push({ key, t0: w.t, dur, color: color || '#fff' }); }
function updateFx(w, dt) {
  const P = w.parts; let j = 0;
  for (let i = 0; i < P.length; i++) {
    const p = P[i]; p.life -= dt; if (p.life <= 0) continue;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.type === 'confetti') { p.vy += 26 * dt; p.vx *= (1 - 0.8 * dt); p.x += Math.sin((p.life + p.size) * 9) * 10 * dt; }
    else if (p.type === 'ring') { p.size += p.vx * dt; }
    else { p.vx *= (1 - 3.2 * dt); p.vy *= (1 - 3.2 * dt); if (p.vz || p.z) { p.vz -= 140 * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.3; } } }
    P[j++] = p;
  }
  P.length = j;
  const Tx = w.texts; j = 0;
  for (let i = 0; i < Tx.length; i++) { const t = Tx[i]; t.life -= dt; t.y -= 14 * dt; if (t.life > 0) Tx[j++] = t; }
  Tx.length = j;
  w.shake *= Math.pow(0.0009, dt); if (w.shake < 0.05) w.shake = 0;
  w.flash = Math.max(0, w.flash - dt * 3.2);
}

// ---------------- helpers ----------------
function teamColor(w, side) { return w.teams[side].team.visual.primary_color; }
function teamColor2(w, side) { return w.teams[side].team.visual.secondary_color; }
function dist2(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
function unitDmgMul(w, u) {
  const T = w.teams[u.side];
  let m = T.dmgMul * T.powMul * T.dmgScale;
  if (u.dmgBuffT > 0) m *= u.dmgBuffMul;
  if (u.aura) m *= 1 + 0.10 * T.teamwork;
  if (w.fb && w.fb.buff[u.side] > 0) m *= BUFF_MUL;
  if (T.tendency === 'formation') m *= 1.03;          // possession: combination play
  else if (T.tendency === 'flank' && (u.role === 'winger' || u.role === 'striker')) m *= 1.10;
  return m;
}
function unitArmor(w, u) {
  let a = u.armor;
  if (u.shieldT > 0) a += u.shield;
  if (u.aura) a += 0.04;
  if (u.adaptT > 0) a += 0.08;
  const td = w.teams[u.side].tendency;
  if (td === 'formation') a += 0.03;                    // compact shape
  else if (td === 'hold_line') a += 0.02;               // low block
  return clamp(a, 0, 0.62);
}
function curSpeed(w, u) {
  const T = w.teams[u.side];
  let s = u.speed * T.speedMul;
  if (u.hasteT > 0) s *= u.hasteMul;
  if (u.slowT > 0) s *= u.slowMul;
  if (u.sta < 28) s *= 0.84;
  if (w.hunt) s *= 1.12;
  if (w.fb && w.fb.buff[u.side] > 0) s *= BUFF_MUL;
  return s;
}
function atkRate(w, u) {
  const T = w.teams[u.side];
  let r = T.atkRate;
  if (u.atkSpdT > 0) r *= u.atkSpdMul;
  if (u.sta < 20) r *= 0.88;
  return r;
}

// ---------------- damage / KO ----------------
function applyDamage(w, att, tgt, base, opts) {
  if (!tgt.alive) return 0;
  opts = opts || {};
  const AT = att ? w.teams[att.side] : null;
  let dmg = base;
  let crit = false;
  if (att) {
    dmg *= unitDmgMul(w, att);
    if (opts.shot) dmg *= AT.shotMul;
    if (att.assistMul > 1 && !opts.noAssist) { dmg *= att.assistMul; opts.assisted = att.assistFrom; att.assistMul = 1; }
    const cc = AT.critChance + (att.critT > 0 ? att.critAdd : 0);
    if (w.rng.next() < cc) { dmg *= AT.critMul; crit = true; }
    dmg *= 0.9 + 0.2 * w.rng.next();
  }
  if (tgt.invulnT > 0 && !opts.true) dmg = 0;
  else if (!opts.true) dmg *= 1 - unitArmor(w, tgt);
  if (dmg <= 0) return 0;
  tgt.hp -= dmg; tgt.flash = 0.09; tgt.hitT = w.t; w.lastDamageT = w.t;
  if (opts.kb && tgt.kbImmuneT <= 0 && att) {
    const dx = tgt.x - (opts.fx != null ? opts.fx : att.x), dy = tgt.y - (opts.fy != null ? opts.fy : att.y);
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const k = opts.kb * AT.knock / w.teams[tgt.side].knock;
    tgt.kbx += dx / d * k; tgt.kby += dy / d * k;
  }
  if (opts.stun && tgt.kbImmuneT <= 0) tgt.stun = Math.max(tgt.stun, opts.stun);
  if (!opts.silent) ev(w, crit ? EV.CRIT : EV.HIT, att ? att.id : -1, tgt.id, dmg, tgt.x, tgt.y);
  // fx
  const col = teamColor(w, tgt.side);
  burst(w, tgt.x, tgt.y - 5, crit ? 7 : 3, crit ? ['#fff', '#ffe066', col] : ['#fff', col], crit ? 60 : 38, 0.32);
  if (crit) { w.shake = Math.max(w.shake, 1.0); if (w.texts.filter(t => t.text === 'CRIT').length < 3) ftext(w, 'CRIT', tgt.x, tgt.y - 14, '#ffe066', 0.55); }
  if (tgt.hp <= 0) ko(w, tgt, att, opts);
  return dmg;
}

function ko(w, u, killer, opts) {
  u.alive = false; u.hp = 0; u.deadT = 0; u.koT = w.t; u.state = 'ko';
  const T = w.teams[u.side];
  T.alive--; const ix = T.aliveList.indexOf(u); if (ix >= 0) T.aliveList.splice(ix, 1);
  T.lossByRole[u.role]++;
  if (killer) {
    u.killedBy = killer.id; killer.kills++;
    const KT = w.teams[killer.side]; KT.kills++; KT.elimByRole[killer.role]++;
    if (opts && opts.assisted != null && opts.assisted >= 0) { const as = w.units[opts.assisted]; if (as) { as.assists++; ev(w, EV.ASSIST, as.id, killer.id, 0); } }
  }
  ev(w, EV.KO, killer ? killer.id : -1, u.id, u.role === 'captain' ? 1 : 0, u.x, u.y);
  const col = teamColor(w, u.side), col2 = teamColor2(w, u.side);
  burst(w, u.x, u.y - 5, 12, ['#fff', col, col2, '#ffe066'], 75, 0.55, 'spark', 40);
  part(w, 'ring', u.x, u.y - 4, 70, 0, 0.28, '#ffffff', 2);
  w.shake = Math.max(w.shake, 0.8);
  w.lastKO = { x: u.x, y: u.y, side: u.side, t: w.t };
  // streak adaptation (config: streak_adaptation): 3 losses within 2 s -> short armor boost for survivors
  if (T.streakAdapt) {
    T.recentKO.push(w.t); while (T.recentKO.length && w.t - T.recentKO[0] > 2) T.recentKO.shift();
    if (T.recentKO.length >= 3 && T.adaptCd <= 0 && T.alive > 0) {
      T.adaptCd = 6; T.recentKO.length = 0;
      for (const a of T.aliveList) a.adaptT = 3;
      ev(w, EV.ADAPT, u.side, -1, 0); addRule(w, 'ADAPT');
    }
  }
}
function addRule(w, r) { if (w.rules.indexOf(r) < 0) w.rules.push(r); }

// ---------------- projectiles ----------------
function spawnProj(w, kind, owner, tx, ty, opts) {
  let p = null;
  for (let i = 0; i < w.proj.length; i++) if (!w.proj[i].on) { p = w.proj[i]; break; }
  if (!p) return null;
  const sp = opts.sp;
  let ax = tx - owner.x, ay = ty - owner.y; const d = Math.sqrt(ax * ax + ay * ay) || 1;
  let ang = Math.atan2(ay, ax) + (opts.err || 0) + (opts.angOff || 0);
  p.on = true; p.kind = kind; p.side = owner.side; p.owner = owner.id; p.tgt = opts.tgt == null ? -1 : opts.tgt;
  p.x = owner.x + Math.cos(ang) * 4; p.y = owner.y - 3 + Math.sin(ang) * 4;
  p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp; p.sp = sp; p.dmg = opts.dmg || 0;
  p.life = 0; p.max = opts.max || (d * 1.5 + 30) / sp; p.turn = opts.turn || 0; p.pierce = opts.pierce || 0;
  p.hits.length = 0; p.checked.length = 0; p.z = 0; p.vz = opts.vz || 0; p.aoe = opts.aoe || 0; p.ax = tx; p.ay = ty;
  p.trN = 0; p.trI = 0; p.crit = false; p.special = opts.special || 0;
  return p;
}

function updateProjectiles(w) {
  for (let i = 0; i < w.proj.length; i++) {
    const p = w.proj[i]; if (!p.on) continue;
    p.life += DT;
    // homing/curving
    if (p.turn) {
      let tx = p.ax, ty = p.ay;
      if (p.tgt >= 0) { const t = w.units[p.tgt]; if (t.alive) { tx = t.x; ty = t.y - 3; } }
      const want = Math.atan2(ty - p.y, tx - p.x), cur = Math.atan2(p.vy, p.vx);
      let da = want - cur; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      const mx = p.turn * DT; da = clamp(da, -mx, mx);
      const na = cur + da; p.vx = Math.cos(na) * p.sp; p.vy = Math.sin(na) * p.sp;
    }
    p.x += p.vx * DT; p.y += p.vy * DT;
    if (p.vz || p.z > 0) { p.vz -= 260 * DT; p.z += p.vz * DT; if (p.z < 0) { p.z = 0; p.vz = 0; } }
    if ((w.tick & 1) === 0) { p.tr[p.trI * 2] = p.x; p.tr[p.trI * 2 + 1] = p.y - p.z; p.trI = (p.trI + 1) % 5; if (p.trN < 5) p.trN++; }
    // out of arena or expired
    if (p.x < ARENA.x0 - 6 || p.x > ARENA.x1 + 6 || p.y < ARENA.y0 - 10 || p.y > ARENA.y1 + 6 || p.life > p.max) {
      if (p.kind === PK.CROSS && p.life > p.max) explode(w, p);
      else part(w, 'dust', p.x, p.y, 0, -6, 0.3, '#c8d89a', 1);
      p.on = false; continue;
    }
    const owner = w.units[p.owner];
    if (p.kind === PK.PASS || p.kind === PK.COMBO) {
      const t = p.tgt >= 0 ? w.units[p.tgt] : null;
      if (!t || !t.alive) { p.on = false; continue; }
      if (p.kind === PK.PASS) { // interceptable by enemy supports / high-line defenders
        const near = query(w, p.x, p.y, 9, 1 - p.side);
        let cut = false;
        for (let k = 0; k < near.length; k++) {
          const e = near[k]; if (p.checked.indexOf(e.id) >= 0) continue; p.checked.push(e.id);
          const ch = e.role === 'support' ? 0.30 : (e.interceptT > 0 ? 0.45 : 0);
          if (ch > 0 && w.rng.next() < ch) { cut = true; e.cd = 0; ev(w, EV.INTERCEPT, e.id, p.owner, 1, p.x, p.y); ftext(w, 'CUT!', e.x, e.y - 14, '#7df9ff', 0.6); break; }
        }
        if (cut) { p.on = false; continue; }
      }
      if ((t.x - p.x) * (t.x - p.x) + (t.y - 3 - p.y) * (t.y - 3 - p.y) < 36) {
        const T = w.teams[p.side];
        t.assistMul = Math.max(t.assistMul, (p.kind === PK.COMBO ? 1.5 : 1.35) + 0.12 * (T.teamwork - 1) + 0.1 * (T.tech - 1));
        t.assistFrom = p.owner; t.cd = Math.min(t.cd, 0.18);
        part(w, 'ring', t.x, t.y - 4, 40, 0, 0.22, '#7df9ff', 1);
        p.on = false;
      }
      continue;
    }
    if (p.z > 7) continue; // ball in the air (arcing clearance) flies over heads
    // GK saves / interceptions on enemy shots
    if (p.kind !== PK.CROSS) {
      const near = query(w, p.x, p.y, 12, 1 - p.side);
      let saved = false;
      for (let k = 0; k < near.length; k++) {
        const e = near[k];
        if (e.stun > 0 || p.checked.indexOf(e.id) >= 0) continue;
        let ch = 0;
        if (e.role === 'goalkeeper') ch = clamp(0.14 + (w.teams[e.side].gk - 70) / 260, 0.06, 0.3);
        else if (e.interceptT > 0 && (e.role === 'defender' || e.role === 'support' || e.role === 'captain')) ch = 0.30;
        else if (e.role === 'support') ch = 0.07;
        if (ch <= 0) continue;
        p.checked.push(e.id);
        if (p.kind === PK.PIERCE || p.kind === PK.POWER) ch *= 0.4;
        if (w.rng.next() < ch) {
          saved = true;
          if (e.role === 'goalkeeper') { e.act = 'dive'; e.actT = 0.4; e.face = p.x < e.x ? -1 : 1; ev(w, EV.SAVE, e.id, p.owner, 0, e.x, e.y); ftext(w, 'SAVE!', e.x, e.y - 15, '#7dff9a', 0.7); }
          else { e.cd = Math.min(e.cd, 0.1); ev(w, EV.INTERCEPT, e.id, p.owner, 0, e.x, e.y); ftext(w, 'BLOCK', e.x, e.y - 15, '#7df9ff', 0.6); }
          burst(w, p.x, p.y, 6, ['#ffffff', '#b8ffcf'], 50, 0.3);
          break;
        }
      }
      if (saved) { p.on = false; continue; }
    }
    // hit test
    const hitR = p.kind === PK.POWER ? 6 : 4.8;
    const near = query(w, p.x, p.y + 3, hitR, 1 - p.side);
    for (let k = 0; k < near.length; k++) {
      const e = near[k]; if (p.hits.indexOf(e.id) >= 0) continue;
      if (p.kind === PK.CROSS) { explode(w, p); p.on = false; break; }
      p.hits.push(e.id);
      const kb = p.kind === PK.CLEAR ? 45 : p.kind === PK.POWER ? 40 : 16;
      applyDamage(w, owner, e, p.dmg, { shot: p.kind !== PK.CLEAR, kb, fx: p.x - p.vx * 0.05, fy: p.y - p.vy * 0.05, stun: p.kind === PK.CLEAR ? 0.25 : 0 });
      if (p.pierce > 0) { p.pierce--; continue; }
      p.on = false; break;
    }
  }
}
function explode(w, p) {
  const owner = w.units[p.owner];
  const hit = query(w, p.x, p.y, p.aoe || 20, 1 - p.side).slice();
  ev(w, EV.EXPLODE, p.owner, hit.length, 0, p.x, p.y);
  part(w, 'ring', p.x, p.y, 120, 0, 0.3, '#ffe066', 2);
  burst(w, p.x, p.y, 10, ['#ffe066', '#ff8a3d', '#fff'], 80, 0.45, 'spark', 30);
  w.shake = Math.max(w.shake, 1.6);
  for (const e of hit) applyDamage(w, owner, e, p.dmg, { kb: 22, fx: p.x, fy: p.y, noAssist: true });
}

// ---------------- AI ----------------
function acquire(w, u) {
  const E = w.teams[1 - u.side].aliveList;
  if (u.tgt >= 0) w.units[u.tgt].targetedBy--;
  let best = null, bs = 1e18;
  const ownGoalY = u.side === 0 ? ARENA.y1 : ARENA.y0;
  for (let i = 0; i < E.length; i++) {
    const e = E[i];
    const dx = e.x - u.x, dy = e.y - u.y; let s = Math.sqrt(dx * dx + dy * dy);
    if (u.role === 'striker') s -= 22 * (1 - e.hp / e.maxHp);
    else if (u.role === 'defender' || u.role === 'goalkeeper') s += 0.25 * Math.abs(e.y - ownGoalY);
    else if (u.role === 'winger') { if (e.role === 'playmaker' || e.role === 'support' || e.role === 'goalkeeper') s -= 30; }
    else if (u.role === 'captain' && e.role === 'captain') s -= 25;
    s += 7 * e.targetedBy;
    if (s < bs) { bs = s; best = e; }
  }
  u.tgt = best ? best.id : -1;
  if (best) best.targetedBy++;
  u.retarget = 0.35 + w.rng.next() * 0.35;
}

function updateUnit(w, u) {
  const T = w.teams[u.side];
  // timers
  if (u.hasteT > 0) u.hasteT -= DT; if (u.atkSpdT > 0) u.atkSpdT -= DT; if (u.dmgBuffT > 0) u.dmgBuffT -= DT;
  if (u.shieldT > 0) u.shieldT -= DT; if (u.invulnT > 0) u.invulnT -= DT; if (u.slowT > 0) u.slowT -= DT;
  if (u.critT > 0) u.critT -= DT; if (u.interceptT > 0) u.interceptT -= DT; if (u.kbImmuneT > 0) u.kbImmuneT -= DT;
  if (u.adaptT > 0) u.adaptT -= DT; if (u.flash > 0) u.flash -= DT; if (u.actT > 0) { u.actT -= DT; if (u.actT <= 0) u.act = ''; }
  if (u.regenT > 0) { u.regenT -= DT; u.hp = Math.min(u.maxHp, u.hp + u.regen * u.maxHp * DT); }
  u.cd -= DT * atkRate(w, u); u.passCd -= DT; u.healCd -= DT;
  // knockback
  if (u.kbx !== 0 || u.kby !== 0) {
    u.x += u.kbx * DT; u.y += u.kby * DT; const f = Math.pow(0.004, DT); u.kbx *= f; u.kby *= f;
    if (Math.abs(u.kbx) + Math.abs(u.kby) < 1) { u.kbx = 0; u.kby = 0; }
  }
  if (u.stun > 0) { u.stun -= DT; u.state = 'stun'; u.mvx = u.mvy = 0; return; }
  // slide tackle dash
  if (u.dashT > 0) {
    u.dashT -= DT; u.x += u.dvx * DT; u.y += u.dvy * DT; u.state = 'tackle';
    if (!u.dashHit) {
      const near = query(w, u.x, u.y, 7, 1 - u.side);
      if (near.length) {
        const e = near[0]; u.dashHit = true;
        const st = 0.4 * T.knock;
        applyDamage(w, u, e, u.dmg, { kb: T.tendency === 'brawl' ? 37 : 34, stun: st });
        burst(w, e.x, e.y, 5, ['#9ed36a', '#c9e3a0'], 40, 0.35, 'dust');
      }
    }
    if (u.dashT <= 0) { u.recover = 0.28; }
    part(w, 'dust', u.x - u.dvx * 0.05, u.y + 1, -u.dvx * 0.1, -3, 0.35, (w.tick & 2) ? '#a7c76b' : '#d6e6a8', 1);
    return;
  }
  if (u.recover > 0) { u.recover -= DT; u.state = 'recover'; return; }
  if (w.fb && w.fb.ball.state === 'CONTROLLED' && w.fb.ball.owner === u.id) { fbCarry(w, u); return; } // Fusion: ball carrier dribbles

  u.retarget -= DT;
  let tgt = u.tgt >= 0 ? w.units[u.tgt] : null;
  if (!tgt || !tgt.alive || u.retarget <= 0) { acquire(w, u); tgt = u.tgt >= 0 ? w.units[u.tgt] : null; }
  if (!tgt) { u.state = 'idle'; return; }
  const dx = tgt.x - u.x, dy = tgt.y - u.y; const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
  const nx = dx / d, ny = dy / d;
  let mx = 0, my = 0, sf = 1;
  const bt = w.battleT;
  const tend = T.tendency;
  const dirF = u.side === 0 ? -1 : 1;
  // tactical tendencies
  let hold = false;
  if (!w.hunt) {
    if (tend === 'hold_line' && bt < 4 && d > 55 && u.role === 'defender') hold = true;
    if (tend === 'burst' && bt < 1.5) sf = 0.9;
    if (tend === 'burst' && bt >= 1.5 && bt < 9) sf = 1.35;
    if (tend === 'close_range') sf *= 1.06;
  }
  const role = u.role;
  if (role === 'goalkeeper' && u.guard && !w.hunt && bt < 10 + (tend === 'hold_line' ? 4 : 0) && d > 70) {
    // guard the goal area, shift laterally with the nearest threat
    const gy = u.hy; const gx = clamp(tgt.x, 110, 250);
    mx = (gx - u.x); my = (gy - u.y); const m = Math.sqrt(mx * mx + my * my);
    if (m > 2) { mx /= m; my /= m; sf *= 0.7; } else { mx = my = 0; }
    u.state = 'guard';
  } else if (role === 'defender' || role === 'goalkeeper') {
    const reach = role === 'defender' ? u.range + 4 : u.range;
    if (hold) { mx = (u.hx - u.x) * 0.05 + nx * 0.25; my = (u.hy - u.y) * 0.05; u.state = 'hold'; }
    else if (d > reach * 0.9) { mx = nx; my = ny; u.state = 'engage'; }
    else { u.state = 'engage'; }
    if (d <= reach && u.cd <= 0) {
      if (role === 'defender') {
        const sp = 96 * (0.95 + 0.1 * T.knock);
        u.dashT = 0.26; u.dvx = nx * sp; u.dvy = ny * sp; u.dashHit = false; u.cd = u.interval * (0.9 + 0.2 * w.rng.next());
        u.face = nx < 0 ? -1 : 1; ev(w, EV.TACKLE, u.id, tgt.id, 0, u.x, u.y); return;
      } else {
        // goalkeeper clearance: arcing long kick that knocks back
        u.cd = u.interval * (0.9 + 0.2 * w.rng.next()); u.act = 'kick'; u.actT = 0.25;
        spawnProj(w, PK.CLEAR, u, tgt.x, tgt.y - 3, { sp: u.projSp, dmg: u.dmg, tgt: tgt.id, err: (w.rng.next() - 0.5) * 0.2, vz: 0 });
        ev(w, EV.CLEAR, u.id, tgt.id, 0, u.x, u.y);
      }
    }
  } else if (role === 'support') {
    // heal / buff the most wounded ally nearby, otherwise weak shots
    if (u.healCd <= 0) {
      const allies = query(w, u.x, u.y, 34, u.side);
      let low = null, lf = 0.86;
      for (let k = 0; k < allies.length; k++) { const a = allies[k]; const f = a.hp / a.maxHp; if (f < lf) { lf = f; low = a; } }
      if (low) {
        const amt = 0.07 * T.teamwork;
        low.hp = Math.min(low.maxHp, low.hp + low.maxHp * amt);
        for (let k = 0; k < allies.length; k++) { const a = allies[k]; if (a !== low && dist2(a, u) < 400) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.025 * T.teamwork); a.dmgBuffT = Math.max(a.dmgBuffT, 2); a.dmgBuffMul = Math.max(a.dmgBuffT > 0 ? a.dmgBuffMul : 1, 1.1); }
        u.healCd = 2.3; u.act = 'special'; u.actT = 0.3;
        ev(w, EV.HEAL, u.id, low.id, amt, low.x, low.y);
        burst(w, low.x, low.y - 6, 4, ['#9dffb0', '#e9fff0'], 18, 0.6, 'heal');
      } else u.healCd = 0.4;
    }
    const want = u.range * 0.85;
    if (d > want) { mx = nx; my = ny; u.state = 'engage'; }
    else if (d < u.range * 0.45) { mx = -nx * 0.6; my = -ny * 0.6; u.state = 'kite'; }
    else { mx = -ny * 0.3 * u.side2; my = nx * 0.3 * u.side2; u.state = 'support'; }
    if (d <= u.range && u.cd <= 0) {
      u.cd = u.interval * (0.9 + 0.2 * w.rng.next()); u.act = 'kick'; u.actT = 0.22;
      fireShot(w, u, tgt, PK.WEAK, d);
    }
  } else {
    // ranged roles: striker, winger, playmaker, captain
    const want = u.range * (role === 'playmaker' ? 0.95 : 0.88);
    if (role === 'winger' && bt < 5 && !w.hunt) {
      // run the flank first
      const fx = u.hx < 180 ? ARENA.x0 + 20 : ARENA.x1 - 20;
      mx = (fx - u.x) * 0.04 + nx * 0.6; my = ny; u.state = 'flank';
    } else if (d > want) {
      // approach a firing spot offset to one side of the target (spreads the front into arcs)
      const ang = Math.atan2(-dy, -dx) + u.side2 * u.spread;
      const px = tgt.x + Math.cos(ang) * want, py = tgt.y + Math.sin(ang) * want;
      mx = px - u.x; my = py - u.y; const mm = Math.sqrt(mx * mx + my * my) || 1; mx /= mm; my /= mm; u.state = 'engage';
    }
    else if (d < u.range * 0.4 && role !== 'captain') { mx = -nx * 0.55; my = -ny * 0.55; u.state = 'kite'; }
    else { mx = -ny * 0.35 * u.side2; my = nx * 0.35 * u.side2; u.state = 'engage'; }
    if (tend === 'formation' && !w.hunt) { // possession: keep shape around captain-line
      mx += (u.hx - u.x) * 0.004; my += 0;
    }
    if (role === 'playmaker' && u.passCd <= 0 && d <= u.range * 1.3) {
      // feed an attacking teammate (assist bonus) - separate from own shot cooldown
      const allies = query(w, u.x, u.y, 70, u.side);
      let mate = null, md = 1e9;
      for (let k = 0; k < allies.length; k++) {
        const a = allies[k]; if (a === u || a.assistMul > 1) continue;
        if (a.role !== 'striker' && a.role !== 'winger' && a.role !== 'captain') continue;
        const dd = dist2(a, u); if (dd < md && dd > 100) { md = dd; mate = a; }
      }
      if (mate) {
        spawnProj(w, PK.PASS, u, mate.x, mate.y - 3, { sp: 170, tgt: mate.id, turn: 9, max: 1.2 });
        ev(w, EV.PASS, u.id, mate.id, 0, u.x, u.y); u.passCd = 1.8 + w.rng.next() * 0.8; u.act = 'kick'; u.actT = 0.2;
      } else u.passCd = 0.5;
    }
    if (d <= u.range && u.cd <= 0) {
      u.cd = u.interval * (0.9 + 0.2 * w.rng.next());
      u.act = 'kick'; u.actT = 0.24; u.face = nx < 0 ? -1 : 1;
      fireShot(w, u, tgt, role === 'winger' ? PK.CURVE : PK.SHOT, d);
    }
  }
  if (hold && role !== 'defender' && role !== 'goalkeeper') { mx = (u.hx - u.x) * 0.05; my = (u.hy - u.y) * 0.05; }
  // move
  if (w.fb) { const md = w.fb.mode[u.id]; if (md) { const v = fbSteer(w, u, md); if (v) { mx = v[0]; my = v[1]; } } } // Fusion: ball-related runs
  const m = Math.sqrt(mx * mx + my * my);
  if (m > 0.01) {
    const s = curSpeed(w, u) * sf * Math.min(1, m);
    const vx = mx / m * s, vy = my / m * s;
    u.x += vx * DT; u.y += vy * DT; u.mvx = vx; u.mvy = vy;
    u.sta = Math.max(0, u.sta - 3.2 * T.drain * DT * Math.min(1, m));
    if (Math.abs(vx) > 2) u.face = vx < 0 ? -1 : 1;
    u.back = vy < -1 ? true : vy > 1 ? false : u.back;
  } else { u.mvx = u.mvy = 0; u.sta = Math.min(100, u.sta + 7 * DT); }
  if (!u.act) u.back = (ny < 0);
  if (u.act === 'kick') u.back = ny < 0;
}

function fireShot(w, u, tgt, kind, d) {
  const T = w.teams[u.side];
  const acc = (T.at.finishing + T.at.technique) / 200;
  const err = w.rng.normal() * 0.085 * (1.35 - acc) * (kind === PK.WEAK ? 1.4 : 1);
  const lead = d / (u.projSp || 160);
  const tx = tgt.x + tgt.mvx * lead * 0.8, ty = tgt.y - 3 + tgt.mvy * lead * 0.8;
  if (kind === PK.CURVE) {
    const off = (u.side2 > 0 ? 1 : -1) * (0.45 + 0.2 * w.rng.next());
    spawnProj(w, PK.CURVE, u, tx, ty, { sp: u.projSp, dmg: u.dmg, tgt: tgt.id, err, angOff: off, turn: 4.2 + 1.5 * T.tech, max: (d * 1.8 + 40) / u.projSp });
    ev(w, EV.CURVE, u.id, tgt.id, 0, u.x, u.y);
  } else {
    spawnProj(w, kind, u, tx, ty, { sp: u.projSp, dmg: u.dmg, tgt: tgt.id, err });
    ev(w, EV.SHOT, u.id, tgt.id, kind === PK.WEAK ? 1 : 0, u.x, u.y);
  }
}

function separate(w) {
  const U = w.units, R = 8.2, R2 = R * R;
  for (let i = 0; i < U.length; i++) {
    const u = U[i]; if (!u.alive) continue;
    const near = query(w, u.x, u.y, R, -1);
    for (let k = 0; k < near.length; k++) {
      const o = near[k]; if (o.id <= u.id) continue;
      let dx = o.x - u.x, dy = o.y - u.y; let d2 = dx * dx + dy * dy;
      if (d2 >= R2) continue;
      if (d2 < 0.0001) { dx = ((u.id * 7 + o.id) % 3) - 1 || 0.5; dy = 0.3; d2 = dx * dx + dy * dy; }
      const d = Math.sqrt(d2), push = (R - d) * 0.5;
      const px = dx / d * push, py = dy / d * push;
      u.x -= px; u.y -= py; o.x += px; o.y += py;
    }
  }
  const z = w.zone;
  for (let i = 0; i < U.length; i++) {
    const u = U[i]; if (!u.alive) continue;
    u.x = clamp(u.x, z.x0 + 3, z.x1 - 3); u.y = clamp(u.y, z.y0 + 4, z.y1 - 2);
  }
}

// ---------------- specials ----------------
function densestEnemy(w, side, cx, cy, maxD) {
  const E = w.teams[1 - side].aliveList; let best = null, bn = -1;
  const step = Math.max(1, Math.floor(E.length / 24));
  for (let i = 0; i < E.length; i += step) {
    const e = E[i]; if (cx != null && (e.x - cx) * (e.x - cx) + (e.y - cy) * (e.y - cy) > maxD * maxD) continue;
    const n = query(w, e.x, e.y, 28, 1 - side).length;
    if (n > bn) { bn = n; best = e; }
  }
  return best ? { x: best.x, y: best.y, n: bn } : null;
}
function pickCaster(w, side) {
  const L = w.teams[side].aliveList; let c = null, best = -1;
  for (const u of L) if (u.role === 'captain' && u.stun <= 0) { const s = u.hp; if (s > best) { best = s; c = u; } }
  if (!c) for (const u of L) { if (u.stun <= 0 && u.maxHp * (u.hp / u.maxHp) > best) { best = u.hp; c = u; } }
  return c;
}
function updateSpecials(w) {
  if (w.sudden) return;
  for (let s = 0; s < 2; s++) {
    const T = w.teams[s]; if (T.alive === 0) continue;
    if (T.adaptCd > 0) T.adaptCd -= DT;
    for (const sp of T.specials) {
      sp.cd -= DT; if (sp.cd > 0) continue;
      if (w.specials.some(a => a.side === s && !a.fired)) { sp.cd = 0.4; continue; }
      const c = pickCaster(w, s); if (!c) { sp.cd = 1; continue; }
      const act = startSpecial(w, T, sp.id, c);
      if (act) { sp.cd = 10.5 + w.rng.next() * 3.5; sp.uses++; T.specialsUsed[sp.id] = (T.specialsUsed[sp.id] || 0) + 1; }
      else sp.cd = 0.6;
    }
  }
  for (let i = 0; i < w.specials.length; i++) {
    const a = w.specials[i]; a.t += DT;
    if (!a.fired && a.t >= a.tele) { a.fired = true; fireSpecial(w, a); }
    if (a.fired && a.seq) runSeq(w, a);
  }
  w.specials = w.specials.filter(a => !a.fired || a.t < a.tele + a.hold);
}
function startSpecial(w, T, id, c) {
  const s = T.side; const a = { id, side: s, caster: c.id, t: 0, tele: 0.6, hold: 0.5, fired: false, x: c.x, y: c.y, r: 30, ang: 0, len: 0, shape: 'circle', seq: null, data: {} };
  const tgtCluster = densestEnemy(w, s, c.x, c.y, 140);
  const fwd = s === 0 ? -Math.PI / 2 : Math.PI / 2;
  switch (id) {
    case 'pressing_storm': if (!tgtCluster || tgtCluster.n < 3) return null; a.x = tgtCluster.x; a.y = tgtCluster.y; a.r = 30; break;
    case 'cross_fire': if (!tgtCluster || tgtCluster.n < 3) return null; a.x = tgtCluster.x; a.y = tgtCluster.y; a.r = 24; a.tele = 0.7; a.hold = 1.2; break;
    case 'precision_through_ball': {
      const tc = tgtCluster || densestEnemy(w, s); if (!tc) return null;
      a.shape = 'line'; a.ang = Math.atan2(tc.y - c.y, tc.x - c.x); a.len = 210; a.tele = 0.55; break; }
    case 'shoulder_charge': {
      const tc = tgtCluster; if (!tc || (tc.x - c.x) ** 2 + (tc.y - c.y) ** 2 > 120 * 120) return null;
      a.shape = 'cone'; a.ang = Math.atan2(tc.y - c.y, tc.x - c.x); a.len = 70; a.r = 0.5; a.tele = 0.55; break; }
    case 'high_line_interception': a.shape = 'hline'; a.tele = 0.45; a.hold = 0.6;
      a.y = T.aliveList.reduce((m, u) => m + u.y, 0) / Math.max(1, T.aliveList.length); break;
    case 'one_two_combo': {
      const mates = query(w, c.x, c.y, 70, s).filter(u => u !== c && (u.role === 'striker' || u.role === 'winger' || u.role === 'playmaker')).slice(0, 2);
      if (mates.length < 1 || !tgtCluster) return null;
      a.shape = 'link'; a.data.chain = [c.id].concat(mates.map(m => m.id)); a.tele = 0.35; a.hold = 1.1; a.seq = 0; break; }
    case 'counter_burst': a.r = 110; a.tele = 0.4; a.hold = 0.4; if (w.battleT < 4) return null; break;
    case 'quick_transition': a.shape = 'arrows'; a.ang = fwd; a.tele = 0.4; a.hold = 0.4; break;
    case 'iron_wall': a.r = 80; a.tele = 0.5; break;
    case 'last_line_save': {
      const low = query(w, c.x, c.y, 90, s).filter(u => u.hp / u.maxHp < 0.4);
      if (low.length < 2) return null; a.r = 90; a.tele = 0.45; break; }
    case 'stamina_surge': a.r = 100; a.tele = 0.4; break;
    case 'flank_overload': a.shape = 'arrows'; a.ang = fwd; a.tele = 0.4; break;
    default: return null;
  }
  w.specials.push(a);
  ev(w, EV.SPECIAL, s, c.id, Object.keys(SPECIAL_NAMES).indexOf(id), c.x, c.y);
  c.act = 'special'; c.actT = a.tele + 0.2;
  w.banners.push({ key: 'special:' + id, side: s, t0: w.t, dur: 1.3, x: c.x, y: c.y });
  return a;
}
function fireSpecial(w, a) {
  const T = w.teams[a.side], c = w.units[a.caster], s = a.side;
  ev(w, EV.SPECIAL_FIRE, s, a.caster, Object.keys(SPECIAL_NAMES).indexOf(a.id), a.x, a.y);
  const col = teamColor(w, s);
  switch (a.id) {
    case 'pressing_storm': {
      const en = query(w, a.x, a.y, a.r, 1 - s).slice();
      for (const e of en) { applyDamage(w, c, e, 15, { kb: 14, fx: a.x, fy: a.y, noAssist: true }); e.slowT = 2; e.slowMul = 0.55; }
      for (const u of query(w, a.x, a.y, 70, s)) { u.hasteT = 4; u.hasteMul = 1.35; u.atkSpdT = 4; u.atkSpdMul = 1.25; }
      part(w, 'ring', a.x, a.y, 150, 0, 0.35, col, 2); w.shake = Math.max(w.shake, 2); break; }
    case 'cross_fire': {
      const shooters = T.aliveList.filter(u => u.role === 'winger' || u.role === 'striker').sort((p, q) => dist2(p, a) - dist2(q, a)).slice(0, 6);
      if (c.alive && shooters.indexOf(c) < 0) shooters.push(c);
      shooters.forEach((u, i) => {
        const off = (u.x < a.x ? -1 : 1) * 0.7;
        const d = Math.sqrt(dist2(u, a));
        spawnProj(w, PK.CROSS, u, a.x, a.y, { sp: 175, dmg: 17, aoe: 22, angOff: off, turn: 5.5, max: (d * 1.5 + 20) / 175 });
      });
      break; }
    case 'precision_through_ball': {
      const tx = c.x + Math.cos(a.ang) * 200, ty = c.y + Math.sin(a.ang) * 200;
      spawnProj(w, PK.PIERCE, c, tx, ty, { sp: 260, dmg: 20, pierce: 5, max: 1.0 }); break; }
    case 'shoulder_charge': {
      const en = query(w, c.x, c.y, a.len, 1 - s).slice();
      for (const e of en) {
        const ang = Math.atan2(e.y - c.y, e.x - c.x); let da = Math.abs(ang - a.ang); if (da > Math.PI) da = 2 * Math.PI - da;
        if (da <= a.r) applyDamage(w, c, e, 14, { kb: 44, stun: 0.5, noAssist: true });
      }
      for (const u of query(w, c.x, c.y, 40, s)) if (u.role === 'defender' || u.role === 'captain') { u.dashT = 0.22; u.dvx = Math.cos(a.ang) * 110; u.dvy = Math.sin(a.ang) * 110; u.dashHit = false; }
      w.shake = Math.max(w.shake, 2.2); break; }
    case 'high_line_interception':
      for (const u of T.aliveList) if (u.role === 'defender' || u.role === 'support' || u.role === 'captain') u.interceptT = 5;
      break;
    case 'one_two_combo': a.seq = 0; a.data.next = 0; break;
    case 'counter_burst':
      for (const u of T.aliveList) { const near = dist2(u, c) < a.r * a.r; u.hasteT = 3.5; u.hasteMul = near ? 1.5 : 1.3; u.dmgBuffT = 3.5; u.dmgBuffMul = near ? 1.3 : 1.18; }
      break;
    case 'quick_transition': {
      const runners = T.aliveList.filter(u => (u.role === 'striker' || u.role === 'winger') && u.stun <= 0).slice(0, 8);
      for (const u of runners) {
        const t = u.tgt >= 0 ? w.units[u.tgt] : null; if (!t || !t.alive) continue;
        const ang = Math.atan2(t.y - u.y, t.x - u.x); u.dashT = 0.3; u.dvx = Math.cos(ang) * 120; u.dvy = Math.sin(ang) * 120; u.dashHit = true; u.cd = 0; u.dmgBuffT = 2.5; u.dmgBuffMul = 1.3;
      }
      break; }
    case 'iron_wall':
      for (const u of query(w, c.x, c.y, a.r, s)) if (u.role === 'defender' || u.role === 'goalkeeper' || u.role === 'captain' || u.role === 'support') { u.shieldT = 5; u.shield = 0.3; u.kbImmuneT = 5; }
      break;
    case 'last_line_save':
      for (const u of query(w, c.x, c.y, a.r, s)) if (u.hp / u.maxHp < 0.4) { u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.32); u.invulnT = 1.1; burst(w, u.x, u.y - 6, 3, ['#9dffb0', '#fff'], 20, 0.6, 'heal'); }
      break;
    case 'stamina_surge':
      for (const u of query(w, c.x, c.y, a.r, s)) { u.sta = 100; u.regenT = 4; u.regen = 0.025; u.atkSpdT = 4; u.atkSpdMul = 1.15; }
      break;
    case 'flank_overload':
      for (const u of T.aliveList) if (u.role === 'winger') { u.hasteT = 4; u.hasteMul = 1.45; u.critT = 4; u.critAdd = 0.15; u.atkSpdT = 4; u.atkSpdMul = 1.25; }
      break;
  }
}
function runSeq(w, a) {
  // one-two combo: pass, pass, power shot
  const ch = a.data.chain; const st = a.t - a.tele;
  const step = Math.floor(st / 0.28);
  if (step > a.data.next || a.data.next === 0 && st >= 0) {
    const i = a.data.next; a.data.next++;
    if (i < ch.length - 1) {
      const from = w.units[ch[i]], to = w.units[ch[i + 1]];
      if (from.alive && to.alive) spawnProj(w, PK.COMBO, from, to.x, to.y - 3, { sp: 230, tgt: to.id, turn: 14, max: 0.8 });
      if (from.alive) ev(w, EV.PASS, from.id, to.id, 1, from.x, from.y);
    } else if (i === ch.length - 1) {
      const sh = w.units[ch[i]]; if (!sh.alive) return;
      acquire(w, sh); const t = sh.tgt >= 0 ? w.units[sh.tgt] : null; if (!t) return;
      sh.act = 'kick'; sh.actT = 0.3; sh.assistMul = Math.max(sh.assistMul, 1.4); sh.assistFrom = ch[0];
      spawnProj(w, PK.POWER, sh, t.x, t.y - 3, { sp: 240, dmg: 30, tgt: t.id, pierce: 2, max: 1.2 });
      ev(w, EV.SHOT, sh.id, t.id, 2, sh.x, sh.y);
    }
  }
}

// ---------------- anti-stall + end conditions ----------------
function antiStall(w) {
  const bt = w.battleT, D = w.dur;
  const total = w.teams[0].alive + w.teams[1].alive;
  if (!w.hunt && (bt >= D.hunt || total <= 16)) { w.hunt = true; ev(w, EV.HUNT, total, -1, 0); addRule(w, 'HUNT'); }
  if (!w.sudden && bt >= D.zone) {
    if (!w.zone.active) { w.zone.active = true; ev(w, EV.ZONE, -1, -1, 0); addRule(w, 'ZONE'); banner(w, 'zone', 1.6, '#ff8a3d'); }
    const k = clamp((bt - D.zone) / 12, 0, 1);
    const shrink = 0.56 * k * (2 - k); // ease-out to 44% size
    const cx = (ARENA.x0 + ARENA.x1) / 2, cy = MIDY, hw = (ARENA.x1 - ARENA.x0) / 2, hh = (ARENA.y1 - ARENA.y0) / 2;
    w.zone.x0 = cx - hw * (1 - shrink); w.zone.x1 = cx + hw * (1 - shrink);
    w.zone.y0 = cy - hh * (1 - shrink); w.zone.y1 = cy + hh * (1 - shrink);
  }
  if (!w.sudden && bt >= D.storm) {
    if (!w.storm) { w.storm = true; ev(w, EV.STORM, -1, -1, 0); addRule(w, 'STORM'); banner(w, 'storm', 1.6, '#ff4d6d'); }
    const s = bt - D.storm; const f = 0.03 * s + 0.06 * s * s; // fraction of max HP per second, rising
    for (let i = 0; i < w.units.length; i++) {
      const u = w.units[i]; if (!u.alive) continue;
      u.hp -= u.maxHp * f * DT;
      if ((w.tick % 20) === (u.id % 20)) part(w, 'spark', u.x, u.y - 6, 0, -12, 0.3, '#ff4d6d', 1);
      if (u.hp <= 0) ko(w, u, null, null);
    }
  }
}

function checkEnd(w) {
  const a = w.teams[0].alive, b = w.teams[1].alive;
  const total = a + b;
  if (w.final15 < 0 && total <= 15) { w.final15 = w.t; ev(w, EV.FINAL15, total, -1, 0); banner(w, 'final15', 1.4, '#ffe066'); }
  if (w.final5 < 0 && total <= 5) { w.final5 = w.t; ev(w, EV.FINAL5, total, -1, 0); }
  if (a > 0 && b > 0) {
    if (w.battleT >= MAX_BATTLE) {
      // hard cap: fair tiebreak on remaining health fraction, then seeded coin
      const hpf = s => w.teams[s].aliveList.reduce((m, u) => m + u.hp / u.maxHp, 0);
      const ha = hpf(0), hb = hpf(1);
      let win;
      if (Math.abs(ha - hb) > 1e-6) { win = ha > hb ? 0 : 1; w.tiebreak = 'hp'; addRule(w, 'TIEBREAK_HP'); }
      else { win = w.rng.next() < 0.5 ? 0 : 1; w.tiebreak = 'coin'; addRule(w, 'TIEBREAK_COIN'); }
      for (const u of w.teams[1 - win].aliveList.slice()) ko(w, u, null, null);
      finish(w, win);
    }
    return;
  }
  if (a === 0 && b === 0) {
    // simultaneous elimination -> sudden death: each team's last fallen captain (or last fallen unit) returns
    if (!w.sudden) { startSudden(w); return; }
    const win = w.rng.next() < 0.5 ? 0 : 1; w.tiebreak = 'coin'; addRule(w, 'TIEBREAK_COIN');
    revive(w, lastFallen(w, win), win === 0 ? MIDY + 30 : MIDY - 30); finish(w, win); return;
  }
  finish(w, a > 0 ? 0 : 1);
}
function lastFallen(w, side) {
  let best = null;
  for (const u of w.units) if (u.side === side && !u.alive) { if (!best || (u.role === 'captain' && best.role !== 'captain') || (u.role === best.role && u.koT >= best.koT)) best = u; }
  return best;
}
function revive(w, u, y) {
  u.alive = true; u.hp = 1; u.x = 180 + (u.side === 0 ? -8 : 8); u.y = y; u.cd = 0.25; u.tgt = -1; u.act = ''; u.actT = 0; // sudden death: first clean hit wins u.kbx = u.kby = 0; u.stun = 0; u.dashT = 0; u.invulnT = 0.6; u.deadT = 0;
  const T = w.teams[u.side]; T.alive++; T.aliveList.push(u); T.lossByRole[u.role]--;
  part(w, 'ring', u.x, u.y - 4, 90, 0, 0.4, '#ffffff', 2);
}
function startSudden(w) {
  w.sudden = true; w.storm = false; addRule(w, 'SUDDEN_DEATH');
  w.zone.x0 = 110; w.zone.x1 = 250; w.zone.y0 = MIDY - 70; w.zone.y1 = MIDY + 70;
  revive(w, lastFallen(w, 0), MIDY + 22); revive(w, lastFallen(w, 1), MIDY - 22);
  for (let i = 0; i < w.proj.length; i++) w.proj[i].on = false;
  ev(w, EV.SUDDEN, -1, -1, 0); banner(w, 'sudden', 1.8, '#ff4d6d');
}
function finish(w, win) {
  w.phase = 'ended'; w.winner = win; w.endT = w.t; w.endTick = w.tick;
  const outro = clamp(35 - w.endT, OUTRO_MIN, OUTRO_MAX);
  w.outroLen = Math.min(outro, MAX_TOTAL - w.endT);
  if (w.fb) fbEnd(w);
  ev(w, EV.END, win, w.teams[win].alive, 0);
  for (let i = 0; i < w.proj.length; i++) w.proj[i].on = false;
  w.specials.length = 0;
  w.flash = 1; w.shake = 3;
  const k = w.lastKO || { x: 180, y: MIDY };
  burst(w, k.x, k.y - 4, 40, ['#ffffff', '#ffe066', teamColor(w, 1 - win), teamColor2(w, 1 - win)], 120, 1.1, 'spark', 60);
  part(w, 'ring', k.x, k.y - 4, 220, 0, 0.6, '#ffffff', 3);
}

// ======================= FWFootball — "Football Fusion" ruleset (V4) =======================
// Active ONLY when createWorld(opts.ruleset === 'fusion') created w.fb. Classic worlds never run this code and
// never touch the football RNG, so Classic (V3) results, end ticks and event hashes are unchanged.
// One real match ball (separate from battle projectiles): LOOSE -> CONTROLLED -> PASSING / SHOOTING -> GOAL -> RESET.
const EVF = { BALL_GAIN: 40, DRIBBLE: 41, BALL_PASS: 42, PASS_COMPLETE: 43, PASS_INTERCEPT: 44, SHOT_ON_GOAL: 45, SAVE_GOAL: 46,
  GOAL: 47, POST: 48, WIDE: 49, BALL_RESET: 50, GOAL_BUFF_START: 51, GOAL_BUFF_END: 52, BALL_LOOSE: 53 };
Object.assign(EV, EVF);
// goal geometry: the SAME constants are used by the renderer to draw the goals (FWRender.buildField)
const GOAL = { x0: 156, x1: 204, yTop: ARENA.y0 - 2, yBot: ARENA.y1 + 2, depth: 8, post: 1.6 };
const FB_INT = { low: { chase: 1, hold: 1.3, shoot: 0.8, support: 1 }, normal: { chase: 2, hold: 1.0, shoot: 1.0, support: 2 }, high: { chase: 3, hold: 0.8, shoot: 1.2, support: 2 } };
const SHOOT_RANGE = { striker: 160, winger: 130, captain: 125, playmaker: 120, support: 90, defender: 80, goalkeeper: 0 };
const BUFF_SEC = 2.8, BUFF_MUL = 1.06;         // goal advantage: +6 % damage & speed for 2.8 s, never stacks
const FB_STATE = { RESET: 0, LOOSE: 1, CONTROLLED: 2, PASSING: 3, SHOOTING: 4, GOAL: 5, DEAD: 6 };
function fbCreate(w, opts) {
  const n = w.units.length;
  return {
    rng: new Rng((w.seed ^ hashStr('FOOTBALL_FUSION_V4|' + opts.teamA.id + '|' + opts.teamB.id)) >>> 0),
    cfg: FB_INT[opts.fbIntensity] || FB_INT.normal, intensity: FB_INT[opts.fbIntensity] ? opts.fbIntensity : 'normal', goalAdv: opts.goalAdv !== false,
    ball: { x: LW / 2, y: MIDY, vx: 0, vy: 0, z: 0, state: 'RESET', owner: -1, side: -1, from: -1, target: -1, lastSide: -1,
      combo: 0, comboSide: -1, timer: 0.35, held: 0, decide: 0.3, looseT: 0, checked: [], dribbled: false, shot: null, flight: 0 },
    goals: [0, 0], buff: [0, 0],
    stats: { shots: [0, 0], onTarget: [0, 0], saves: [0, 0], passes: [0, 0], passAtt: [0, 0], intercepts: [0, 0], steals: [0, 0], posts: [0, 0], wide: [0, 0], poss: [0, 0] },
    shots: [], mode: new Int8Array(n), tackleT: new Float32Array(n).fill(-9), nextShot: 1
  };
}
function fbGoalY(side) { return side === 0 ? GOAL.yTop : GOAL.yBot; } // side 0 attacks the TOP goal, side 1 the BOTTOM goal
function fbGain(w, u, kind) {
  const fb = w.fb, b = fb.ball;
  if (b.lastSide !== u.side) { b.combo = 0; b.comboSide = u.side; }
  b.state = 'CONTROLLED'; b.owner = u.id; b.side = u.side; b.lastSide = u.side; b.held = 0; b.dribbled = false; b.target = -1; b.shot = null;
  b.decide = 0.22 + fb.rng.next() * 0.3; b.vx = b.vy = 0; b.looseT = 0;
  if (kind === 1) fb.stats.steals[u.side]++;
  ev(w, EV.BALL_GAIN, u.id, kind, 0, u.x, u.y); // kind: 0 loose, 1 tackle, 2 GK catch, 3 interception, 4 goal kick
}
function fbLoose(w, why, vx, vy) {
  const b = w.fb.ball; const o = b.owner >= 0 ? w.units[b.owner] : null;
  b.state = 'LOOSE'; b.vx = vx || 0; b.vy = vy || 0; b.looseT = 0; b.target = -1; b.shot = null;
  ev(w, EV.BALL_LOOSE, o ? o.id : -1, why, 0, b.x, b.y); b.owner = -1;
}
function fbReset(w, kind) {
  const b = w.fb.ball; b.state = 'RESET'; b.timer = 0.55; b.owner = -1; b.side = -1; b.lastSide = -1; b.combo = 0; b.vx = b.vy = 0; b.shot = null;
  ev(w, EV.BALL_RESET, kind, -1, 0, b.x, b.y);
}
function fbLineBlocked(w, a, c, side) {
  for (let k = 1; k <= 3; k++) { const x = a.x + (c.x - a.x) * k / 4, y = a.y + (c.y - a.y) * k / 4; if (query(w, x, y, 7, 1 - side).length) return true; }
  return false;
}
function fbBestMate(w, u) {
  const fb = w.fb, dir = u.side === 0 ? -1 : 1; let best = null, bs = -12;
  const longBall = u.role === 'playmaker' || u.role === 'captain' || u.role === 'defender' || u.role === 'goalkeeper';
  for (const m of query(w, u.x, u.y, longBall ? 175 : 110, u.side)) {
    if (m === u || m.role === 'goalkeeper' || m.stun > 0) continue;
    const dx = m.x - u.x, dy = m.y - u.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 24) continue;
    if (d > 110 && !(m.role === 'striker' || m.role === 'winger') ) continue; // long balls only to forwards
    let s = dy * dir * 0.7 - d * 0.04 - query(w, m.x, m.y, 16, 1 - u.side).length * 18;
    if (m.role === 'striker' || m.role === 'winger') s += 10; if (m.role === 'playmaker') s += 6;
    if (fbLineBlocked(w, u, m, u.side)) s -= 30;
    s += fb.rng.next() * 8;
    if (s > bs) { bs = s; best = m; }
  }
  return best;
}
function fbPass(w, u, m) {
  const fb = w.fb, b = fb.ball, T = w.teams[u.side];
  b.state = 'PASSING'; b.from = u.id; b.target = m.id; b.owner = -1; b.flight = 0; b.checked.length = 0;
  const pd = Math.hypot(m.x - u.x, m.y - u.y); b.sp = (pd > 110 ? 195 : 150) + (T.at.technique - 70) * 0.8; fb.stats.passAtt[u.side]++;
  u.act = 'kick'; u.actT = 0.2;
  ev(w, EV.BALL_PASS, u.id, m.id, 0, u.x, u.y);
}
function fbShoot(w, u) {
  const fb = w.fb, b = fb.ball, r = fb.rng, T = w.teams[u.side];
  const gy = fbGoalY(u.side), half = (GOAL.x1 - GOAL.x0) / 2, gx = (GOAL.x0 + GOAL.x1) / 2;
  const dg = Math.hypot(GOAL.x0 + half - b.x, gy - b.y);
  const err = r.normal() * 9 * (1.35 - T.at.finishing / 100) * (1 + dg / 160); // accuracy drops with distance
  const aimX = gx + (r.next() * 2 - 1) * (half + 7) + err;
  const sp = 215 + T.at.finishing * 0.5;
  const dx = aimX - b.x, dy = gy - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
  const onTarget = aimX > GOAL.x0 + GOAL.post && aimX < GOAL.x1 - GOAL.post;
  b.state = 'SHOOTING'; b.vx = dx / d * sp; b.vy = dy / d * sp; b.owner = -1; b.flight = 0; b.checked.length = 0;
  const shot = { id: fb.nextShot++, side: u.side, shooter: u.id, tick: w.tick, x: +u.x.toFixed(1), y: +u.y.toFixed(1), onTarget, result: 'in-flight', gk: -1 };
  b.shot = shot; fb.shots.push(shot); fb.stats.shots[u.side]++; if (onTarget) fb.stats.onTarget[u.side]++;
  u.act = 'kick'; u.actT = 0.28;
  ev(w, EV.SHOT_ON_GOAL, u.id, shot.id, onTarget ? 1 : 0, u.x, u.y);
}
function fbDecide(w, u) {
  const fb = w.fb, b = fb.ball, r = fb.rng, cfg = fb.cfg, T = w.teams[u.side];
  const gy = fbGoalY(u.side), gx = (GOAL.x0 + GOAL.x1) / 2, dGoal = Math.hypot(gx - u.x, gy - u.y);
  const press = query(w, u.x, u.y, 18, 1 - u.side).length;
  const range = (SHOOT_RANGE[u.role] || 60) * (0.85 + 0.3 * T.at.finishing / 100);
  if (dGoal < range) {
    let p = 0.3 + 0.45 * (1 - dGoal / range) + (u.role === 'striker' ? 0.2 : 0) + (press ? 0.1 : 0);
    if (r.next() < p * cfg.shoot) { fbShoot(w, u); return; }
  } else if (dGoal < range * 1.6 && u.role !== 'goalkeeper' && u.role !== 'defender') {
    if (r.next() < 0.25 * cfg.shoot) { fbShoot(w, u); return; } // occasional long-range effort
  }
  const hold = (u.role === 'playmaker' ? 0.7 : u.role === 'winger' ? 1.4 : u.role === 'striker' ? 1.2 : 0.8) * cfg.hold * (T.tendency === 'formation' ? 0.8 : 1);
  if (press >= 2 || b.held > hold || b.held > 3.0) {
    const m = fbBestMate(w, u);
    if (m) { fbPass(w, u, m); return; }
    if (b.held > 3.0) { if (dGoal < 170) { fbShoot(w, u); return; } const dir = u.side === 0 ? -1 : 1; u.act = 'kick'; u.actT = 0.2; fbLoose(w, 4, (r.next() - 0.5) * 60, dir * 130); return; }
  }
  b.decide = 0.2 + r.next() * 0.25;
}
function fbAssign(w) {
  const fb = w.fb, b = fb.ball, M = fb.mode, cfg = fb.cfg; M.fill(0);
  const near = (x, y, side, k, rad, filt) => {
    const out = []; for (const u of w.teams[side].aliveList) { if (filt && !filt(u)) continue; const d = (u.x - x) * (u.x - x) + (u.y - y) * (u.y - y); if (d <= rad * rad) out.push([d, u]); }
    out.sort((p, q) => p[0] - q[0] || p[1].id - q[1].id); return out.slice(0, k).map(x => x[1]);
  };
  const notGK = u => u.role !== 'goalkeeper' || Math.abs(u.y - fbGoalY(1 - u.side)) < 60;
  if (b.state === 'LOOSE' || b.state === 'RESET') {
    const rad = b.looseT > 2.5 ? 1e5 : 115;
    for (let s = 0; s < 2; s++) for (const u of near(b.x, b.y, s, cfg.chase, rad, notGK)) M[u.id] = 1;
  } else if (b.state === 'CONTROLLED') {
    const o = w.units[b.owner];
    for (const u of near(o.x, o.y, 1 - o.side, cfg.chase, 75, notGK)) M[u.id] = 2;          // press the carrier
    const dir = o.side === 0 ? -1 : 1;
    for (const u of near(o.x, o.y, o.side, cfg.support + 1, 110, m => m !== o && m.role !== 'goalkeeper' && (m.y - o.y) * dir > -10)) if (u !== o) M[u.id] = 4; // offer a pass
  } else if (b.state === 'PASSING') {
    const t = w.units[b.target]; if (t) M[t.id] = 5;
    for (const u of near(b.x, b.y, b.side >= 0 ? 1 - w.units[b.from].side : 0, 1, 60, notGK)) M[u.id] = 1;
  }
  // keepers: the guard keepers step between the ball and the goal centre when the ball is in their half
  for (let s = 0; s < 2; s++) { const gy = fbGoalY(1 - s); if (Math.abs(b.y - gy) < 230) for (const u of w.teams[s].aliveList) if (u.role === 'goalkeeper' && u.guard && !M[u.id]) M[u.id] = 7; }
  if (b.state === 'SHOOTING' && b.shot) {
    for (const u of near(b.x, b.y, 1 - b.shot.side, 2, 70, x => x.role === 'goalkeeper')) M[u.id] = 6;
  }
}
// unit steering for ball-related modes (movement only; battle attacks continue)
function fbSteer(w, u, md) {
  const b = w.fb.ball; let tx, ty;
  if (md === 1 || md === 6) { tx = b.x + b.vx * 0.15; ty = b.y + b.vy * 0.15; }
  else if (md === 2) { const o = w.units[b.owner]; if (!o) return null; tx = o.x; ty = o.y; }
  else if (md === 4) { const o = w.units[b.owner]; if (!o) return null; const dir = o.side === 0 ? -1 : 1; tx = o.x + (u.id % 2 ? 34 : -34); ty = o.y + dir * 42; }
  else if (md === 5) { tx = b.x; ty = b.y; }
  else if (md === 7) { const gy = fbGoalY(1 - u.side), gx = (GOAL.x0 + GOAL.x1) / 2; tx = gx + clamp((b.x - gx) * 0.3, -20, 20) + (u.id % 2 ? 8 : -8); ty = gy + (u.side === 0 ? -10 : 10); }
  else return null;
  const dx = tx - u.x, dy = ty - u.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 2) return [0, 0];
  return [dx / d, dy / d];
}
// the ball carrier dribbles toward the opponent goal, weaving away from the nearest presser
function fbCarry(w, u) {
  const T = w.teams[u.side], gy = fbGoalY(u.side), gx = (GOAL.x0 + GOAL.x1) / 2;
  let mx = gx - u.x, my = gy - u.y; const d = Math.sqrt(mx * mx + my * my) || 1; mx /= d; my /= d;
  if (u.role === 'winger' && Math.abs(gy - u.y) > 120) mx += (u.hx < 180 ? -0.5 : 0.5) * (Math.abs(u.x - 180) < 120 ? 1 : 0); // run the flank
  let best = null, bd = 400;
  for (const e of query(w, u.x, u.y, 20, 1 - u.side)) { const dd = (e.x - u.x) * (e.x - u.x) + (e.y - u.y) * (e.y - u.y); if (dd < bd) { bd = dd; best = e; } }
  if (best) { const ex = u.x - best.x, ey = u.y - best.y, ed = Math.sqrt(ex * ex + ey * ey) || 1; mx += ex / ed * 0.7; my += ey / ed * 0.35; }
  const m = Math.sqrt(mx * mx + my * my) || 1, s = curSpeed(w, u) * 1.05;
  const vx = mx / m * s, vy = my / m * s; u.x += vx * DT; u.y += vy * DT; u.mvx = vx; u.mvy = vy;
  if (Math.abs(vx) > 2) u.face = vx < 0 ? -1 : 1; u.back = vy < 0;
  u.sta = Math.max(0, u.sta - 3.2 * T.drain * DT); u.state = 'run';
}
function fbBounds(w) {
  const b = w.fb.ball, z = w.zone;
  const x0 = Math.max(ARENA.x0 + 2, z.active ? z.x0 + 3 : 0), x1 = Math.min(ARENA.x1 - 2, z.active ? z.x1 - 3 : 1e9);
  const y0 = Math.max(ARENA.y0 + 2, z.active ? z.y0 + 4 : 0), y1 = Math.min(ARENA.y1 - 2, z.active ? z.y1 - 2 : 1e9);
  if (b.x < x0) { b.x = x0; b.vx = Math.abs(b.vx) * 0.6; } else if (b.x > x1) { b.x = x1; b.vx = -Math.abs(b.vx) * 0.6; }
  if (b.y < y0) { b.y = y0; b.vy = Math.abs(b.vy) * 0.6; } else if (b.y > y1) { b.y = y1; b.vy = -Math.abs(b.vy) * 0.6; }
}
function fbGoalKick(w, defSide) {
  const L = w.teams[defSide].aliveList; if (!L.length) { fbReset(w, 2); return; }
  const gy = fbGoalY(1 - defSide); let best = null, bd = 1e9;
  for (const u of L) { const d = Math.abs(u.y - gy) * (u.role === 'goalkeeper' ? 0.5 : 1) + Math.abs(u.x - 180) * 0.3; if (d < bd || (d === bd && u.id < best.id)) { bd = d; best = u; } }
  w.fb.ball.x = clamp(w.fb.ball.x, ARENA.x0 + 4, ARENA.x1 - 4); w.fb.ball.y = clamp(w.fb.ball.y, ARENA.y0 + 4, ARENA.y1 - 4);
  fbGain(w, best, 4);
}
function fbTick(w) {
  const fb = w.fb, b = fb.ball, r = fb.rng, dt = DT;
  for (let s = 0; s < 2; s++) if (fb.buff[s] > 0) { fb.buff[s] -= dt; if (fb.buff[s] <= 0) { fb.buff[s] = 0; ev(w, EV.GOAL_BUFF_END, s, -1, 0); } }
  if ((w.tick % 6) === 0) fbAssign(w);
  if (b.state === 'RESET') {
    b.x += (LW / 2 - b.x) * Math.min(1, dt * 6); b.y += (MIDY - b.y) * Math.min(1, dt * 6);
    b.timer -= dt; if (b.timer <= 0) { b.x = LW / 2; b.y = MIDY; b.state = 'LOOSE'; b.looseT = 0; b.vx = b.vy = 0; }
    return;
  }
  if (b.state === 'GOAL') {
    b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.pow(0.02, dt); b.vy *= Math.pow(0.02, dt);
    const net = b.side === 0 ? GOAL.yTop - GOAL.depth + 1 : GOAL.yBot + GOAL.depth - 1;
    if ((b.side === 0 && b.y < net) || (b.side === 1 && b.y > net)) { b.y = net; b.vy = 0; }
    b.timer -= dt; if (b.timer <= 0) fbReset(w, 1);
    return;
  }
  if (b.state === 'LOOSE') {
    b.x += b.vx * dt; b.y += b.vy * dt; const f = Math.exp(-2.2 * dt); b.vx *= f; b.vy *= f; fbBounds(w); b.looseT += dt;
    if (Math.abs(b.vx) + Math.abs(b.vy) < 170) {
      let best = null, bd = 1e9;
      for (const u of query(w, b.x, b.y + 1, 6, -1)) { if (u.stun > 0 || u.dashT > 0) continue; const d = (u.x - b.x) * (u.x - b.x) + (u.y - b.y) * (u.y - b.y); if (d < bd || (d === bd && u.id < best.id)) { bd = d; best = u; } }
      if (best) fbGain(w, best, 0);
    }
    if (b.looseT > 9) fbReset(w, 3); // safety: nobody can reach it
    return;
  }
  if (b.state === 'CONTROLLED') {
    const o = w.units[b.owner];
    if (!o || !o.alive) { fbLoose(w, 1, 0, 0); return; }
    if (o.stun > 0) { fbLoose(w, 3, o.kbx * 0.6 + (r.next() - 0.5) * 30, o.kby * 0.6 + (r.next() - 0.5) * 30); return; }
    const tx = o.x + o.face * 3.5, ty = o.y + 1; b.x += (tx - b.x) * Math.min(1, dt * 16); b.y += (ty - b.y) * Math.min(1, dt * 16);
    b.held += dt; fb.stats.poss[o.side]++;
    if (!b.dribbled && b.held > 1.2) { b.dribbled = true; ev(w, EV.DRIBBLE, o.id, 0, b.held, o.x, o.y); }
    // tackles: real contact + timing + attributes
    for (const e of query(w, o.x, o.y, 9.5, 1 - o.side)) {
      if (e.stun > 0 || w.t - fb.tackleT[e.id] < 0.65) continue; fb.tackleT[e.id] = w.t;
      const TE = w.teams[e.side], TO = w.teams[o.side];
      const ch = 0.07 + (e.role === 'defender' ? 0.08 : 0) + (e.role === 'goalkeeper' ? 0.08 : 0) + (TE.at.pressing - 70) / 500 - (TO.at.technique - 70) / 500;
      if (r.next() < ch) { e.act = 'kick'; e.actT = 0.2; fbGain(w, e, 1); return; }
    }
    b.decide -= dt; if (b.decide <= 0) fbDecide(w, o);
    return;
  }
  if (b.state === 'PASSING') {
    const t = w.units[b.target], from = w.units[b.from]; b.flight += dt;
    if (!t || !t.alive || b.flight > 1.6) { fbLoose(w, 2, b.vx * 0.3, b.vy * 0.3); return; }
    const dx = t.x - b.x, dy = t.y + 1 - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    b.vx = dx / d * b.sp; b.vy = dy / d * b.sp; b.x += b.vx * dt; b.y += b.vy * dt;
    for (const e of query(w, b.x, b.y, 6, 1 - from.side)) {
      if (b.checked.indexOf(e.id) >= 0 || e.stun > 0) continue; b.checked.push(e.id);
      const ch = 0.2 + (e.role === 'defender' ? 0.15 : 0) + (w.teams[e.side].at.pressing - 70) / 400;
      if (r.next() < ch) { fb.stats.intercepts[e.side]++; ev(w, EV.PASS_INTERCEPT, e.id, from.id, 0, b.x, b.y); fbGain(w, e, 3); return; }
    }
    if (d < 6) {
      fb.stats.passes[from.side]++; if (b.comboSide === from.side) b.combo++; else { b.combo = 1; b.comboSide = from.side; }
      const combo = b.combo; ev(w, EV.PASS_COMPLETE, t.id, from.id, combo, t.x, t.y);
      b.lastSide = from.side; fbGain(w, t, 5); b.combo = combo; b.comboSide = from.side;
    }
    return;
  }
  if (b.state === 'SHOOTING') {
    const sh = b.shot; b.flight += dt; b.x += b.vx * dt; b.y += b.vy * dt;
    // goalkeeper save: real distance to the ball path + attributes
    for (const g of query(w, b.x, b.y, 17, 1 - sh.side)) {
      if (g.role !== 'goalkeeper' || g.stun > 0 || b.checked.indexOf(g.id) >= 0) continue; b.checked.push(g.id);
      const TG = w.teams[g.side]; let p = 0.38 + (TG.gk - 70) / 250 + (g.guard ? 0.08 : 0); if (!sh.onTarget) p *= 0.5;
      if (r.next() < p) {
        sh.result = 'save'; sh.gk = g.id; fb.stats.saves[g.side]++; g.act = 'dive'; g.actT = 0.4; g.face = b.x < g.x ? -1 : 1;
        ev(w, EV.SAVE_GOAL, g.id, sh.id, 0, b.x, b.y);
        if (r.next() < 0.55) fbGain(w, g, 2); else { const s2 = r.next() < 0.5 ? -1 : 1; b.state = 'LOOSE'; b.owner = -1; b.shot = null; b.looseT = 0; b.vx = s2 * (70 + r.next() * 40); b.vy = -b.vy * 0.35; }
        return;
      }
    }
    const gy = fbGoalY(sh.side), crossed = sh.side === 0 ? b.y <= gy : b.y >= gy;
    if (crossed) {
      const inMouth = b.x > GOAL.x0 + GOAL.post && b.x < GOAL.x1 - GOAL.post;
      const onPost = !inMouth && (Math.abs(b.x - GOAL.x0) <= GOAL.post || Math.abs(b.x - GOAL.x1) <= GOAL.post);
      const shooter = w.units[sh.shooter];
      if (inMouth) {
        sh.result = 'goal'; fb.goals[sh.side]++; b.state = 'GOAL'; b.side = sh.side; b.timer = 0.9; b.shot = null; b.vx *= 0.35; b.vy *= 0.35;
        ev(w, EV.GOAL, sh.shooter, sh.side, fb.goals[sh.side], b.x, gy);
        if (fb.goalAdv) { if (fb.buff[sh.side] <= 0) ev(w, EV.GOAL_BUFF_START, sh.side, -1, BUFF_SEC); fb.buff[sh.side] = BUFF_SEC; } // reset, never stacks
        const col = teamColor(w, sh.side); burst(w, b.x, gy, 18, ['#ffffff', col, '#ffe066'], 80, 0.7, 'spark', 40); w.shake = Math.max(w.shake, 1.6);
        void shooter; return;
      }
      if (onPost) { sh.result = 'post'; fb.stats.posts[sh.side]++; ev(w, EV.POST, sh.shooter, sh.id, 0, b.x, gy); b.y = gy + (sh.side === 0 ? 2 : -2); b.state = 'LOOSE'; b.shot = null; b.looseT = 0; b.vy = -b.vy * 0.45; b.vx = b.vx * 0.5 + (r.next() - 0.5) * 50; return; }
      sh.result = 'wide'; fb.stats.wide[sh.side]++; ev(w, EV.WIDE, sh.shooter, sh.id, 0, b.x, gy); b.shot = null; fbGoalKick(w, 1 - sh.side); return;
    }
    if (b.flight > 1.4 || b.x < ARENA.x0 - 8 || b.x > ARENA.x1 + 8) { sh.result = 'off'; b.state = 'LOOSE'; b.shot = null; b.looseT = 0; b.vx *= 0.2; b.vy *= 0.2; fbBounds(w); }
  }
}
function fbEnd(w) {
  const fb = w.fb; fb.ball.state = 'DEAD'; fb.ball.owner = -1;
  for (let s = 0; s < 2; s++) if (fb.buff[s] > 0) { fb.buff[s] = 0; ev(w, EV.GOAL_BUFF_END, s, -1, 1); }
}
function fbSummary(w) {
  const fb = w.fb, s = fb.stats, P = s.poss[0] + s.poss[1];
  return { ruleset: 'fusion-v4', intensity: fb.intensity, goalAdv: fb.goalAdv, goals: fb.goals.slice(), shots: s.shots.slice(), onTarget: s.onTarget.slice(), saves: s.saves.slice(),
    passes: s.passes.slice(), passAtt: s.passAtt.slice(), intercepts: s.intercepts.slice(), steals: s.steals.slice(), posts: s.posts.slice(), wide: s.wide.slice(),
    possession: P ? [Math.round(s.poss[0] / P * 100), 100 - Math.round(s.poss[0] / P * 100)] : [50, 50] };
}

// ---------------- main step ----------------
// Optional cosmetic observer (V2 camera / story alerts). It only READS the world after each tick
// and may write w.cam (render-only); it never touches the battle RNG, units or the event hash.
function step(w) { stepCore(w); if (w.observer) w.observer(w); }
function stepCore(w) {
  w.tick++; w.t = w.tick * DT;
  const t = w.t;
  if (w.phase === 'ended') { postStep(w); return; }
  if (t < TL.freezeEnd) { w.phase = 'freeze'; idleAnim(w); updateFx(w, DT); return; }
  if (t < TL.battleStart) {
    if (w.phase !== 'entry') { w.phase = 'entry'; ev(w, EV.ENTRY, -1, -1, 0); }
    rebuildGrid(w);
    for (const u of w.units) {
      const dx = u.hx - u.x, dy = u.hy - u.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0.8) { const s = Math.min(d / DT, 26 + (u.id % 5) * 2); u.x += dx / d * s * DT; u.y += dy / d * s * DT; u.mvx = dx / d * s; u.mvy = dy / d * s; u.state = 'run'; u.back = u.side === 0; if ((w.tick + u.id) % 9 === 0) part(w, 'dust', u.x, u.y + 1, 0, -4, 0.35, '#c9df9b', 1); }
      else { u.mvx = u.mvy = 0; u.state = 'idle'; }
      u.animT += DT;
    }
    separate(w); updateFx(w, DT); return;
  }
  if (w.phase !== 'battle') { w.phase = 'battle'; ev(w, EV.START, -1, -1, 0); banner(w, 'fight', 0.6, '#fff'); }
  w.battleT = t - TL.battleStart;
  rebuildGrid(w);
  antiStall(w);
  // captain aura refresh every 0.5 s
  w.auraTimer -= DT;
  if (w.auraTimer <= 0) {
    w.auraTimer = 0.5;
    for (const u of w.units) u.aura = false;
    for (const c of w.units) if (c.alive && c.role === 'captain') for (const u of query(w, c.x, c.y, 34, c.side)) u.aura = true;
  }
  updateSpecials(w);
  const U = w.units, n = U.length;
  if (w.tick & 1) { for (let i = 0; i < n; i++) { const u = U[i]; if (u.alive) { updateUnit(w, u); u.animT += DT; } else u.deadT += DT; } }
  else { for (let i = n - 1; i >= 0; i--) { const u = U[i]; if (u.alive) { updateUnit(w, u); u.animT += DT; } else u.deadT += DT; } }
  rebuildGrid(w);
  separate(w);
  rebuildGrid(w);
  updateProjectiles(w);
  if (w.fb) fbTick(w);
  // grass dust from runners (cosmetic)
  if ((w.tick % 6) === 0) for (let i = w.tick % 12; i < n; i += 12) { const u = U[i]; if (u.alive && (Math.abs(u.mvx) + Math.abs(u.mvy) > 20)) part(w, 'dust', u.x, u.y + 1, -u.mvx * 0.05, -3, 0.3, '#c9df9b', 1); }
  checkEnd(w);
  updateFx(w, DT);
  updateCam(w, DT);
}
// cosmetic camera (deterministic, tick-based): mini focus shift for the last 5 and the final K.O.
function updateCam(w, dt) {
  let tz = 1, tx = LW / 2, ty = MIDY;
  if (w.phase === 'ended') { if (w.t - w.endT < 1.0 && w.lastKO) { tz = 1.14; tx = w.lastKO.x; ty = w.lastKO.y; } }
  else if (w.final5 >= 0) {
    let n = 0, sx = 0, sy = 0;
    for (const u of w.units) if (u.alive) { n++; sx += u.x; sy += u.y; }
    if (n) { tz = 1.1; tx = sx / n; ty = sy / n; }
  }
  const k = Math.min(1, dt * 2.2);
  w.cam.z += (tz - w.cam.z) * k; w.cam.x += (tx - w.cam.x) * k; w.cam.y += (ty - w.cam.y) * k;
}
function idleAnim(w) { for (const u of w.units) u.animT += DT; }
function postStep(w) {
  // outro: slow motion for the first 0.45 s, then victory celebration (cosmetic, deterministic)
  const since = w.t - w.endT;
  const sdt = since < 0.45 ? DT * 0.25 : DT;
  for (const u of w.units) {
    if (u.alive) { u.animT += sdt; u.state = 'victory'; u.act = ''; u.mvx = u.mvy = 0; u.back = false; }
    else u.deadT += sdt;
  }
  if (since > 0.45 && (w.tick % 3) === 0) {
    const r = w.fxRng, col = [teamColor(w, w.winner), teamColor2(w, w.winner), '#ffffff', '#ffe066'];
    for (let i = 0; i < [1, 2, 3][w.fxLevel]; i++) part(w, 'confetti', r.range(0, LW), r.range(-10, 40), r.range(-20, 20), r.range(20, 50), 4, col[r.int(4)], 1 + r.int(2));
  }
  const fl = w.flash; updateFx(w, sdt); w.flash = Math.max(0, fl - DT * 2.6);
  updateCam(w, DT);
}

function advanceTo(w, T) { let guard = 0; while (w.t + 1e-9 < T && guard++ < 100000) step(w); }
function totalDuration(w) { return w.phase === 'ended' ? w.endT + w.outroLen : null; }

// run a full battle without rendering (used for verification / balance tests)
function simulate(opts, maxT) {
  const w = createWorld(opts);
  const lim = maxT || 80;
  while (w.phase !== 'ended' && w.t < lim) step(w);
  return w;
}
function summary(w) {
  return {
    seed: w.seed, winner: w.winner, survivors: w.winner >= 0 ? w.teams[w.winner].alive : 0,
    endT: +w.endT.toFixed(3), battleSeconds: +(w.endT - TL.battleStart).toFixed(3), total: +(w.endT + w.outroLen).toFixed(3),
    hash: (w.hash >>> 0).toString(16), events: w.evCount, rules: w.rules.slice(), tiebreak: w.tiebreak,
    kills: [w.teams[0].kills, w.teams[1].kills], form: [w.teams[0].form, w.teams[1].form]
  };
}
function summaryV4(w) { const s = summary(w); s.ruleset = w.fb ? 'fusion-v4' : 'classic'; if (w.fb) s.football = fbSummary(w); return s; }

const API = { DT, LW, LH, ARENA, MIDY, TL, MAX_TOTAL, MAX_BATTLE, ROLES, ATTRS, ROLE_BASE, DEFAULT_RANGE, RANGE_SCALE, DURATION,
  SPECIAL_NAMES, ROLE_NAMES, EV, PK, setAdv: (d, h) => { ADV_DMG = d; ADV_HP = h; }, Rng, hashStr, createWorld, step, advanceTo, simulate, summary, summaryV4, totalDuration, clamp, GOAL, FB_STATE, fbSummary };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
root.FWEngine = API;
})(typeof window !== 'undefined' ? window : globalThis);
