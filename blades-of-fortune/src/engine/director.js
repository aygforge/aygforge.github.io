// Event Director — Tides of Fortune'un durum makinesi ve adım yürütücüsünün (runSteps/tickSteps/exec/flushInstant) taşınmış hali.
import { CFG } from '../config.js';
import { EVENTS } from '../data/index.js';
import { ITEMS } from '../data/items.js';
import { INTENTS, ENEMIES } from '../data/enemies.js';
import { buildScene, o, par } from './choreo.js';
import { iconForItem } from '../render/sprites.js';

export const PH = {
  SAIL: 'NORMAL_SAILING', APPROACH: 'ENCOUNTER_APPROACH', INTRO: 'ENCOUNTER_INTRO', DECISION: 'PLAYER_DECISION', ACTION: 'ACTION_ANIMATION',
  OUTCOME: 'OUTCOME_ANIMATION', EXIT: 'ENCOUNTER_EXIT', RESUME: 'RESUME_SAILING', DOCKING: 'DOCKING', DOCKED: 'DOCKED', IDLE: 'IDLE', COMBAT: 'ACTION_ANIMATION',
};
const WALK = 22;
function flatten(steps) {
  const out = [];
  for (const s of steps || []) {
    if (!s) continue;
    if (Array.isArray(s) && s.some(Array.isArray)) out.push(...flatten(s));
    else if (Array.isArray(s)) { const f = s.filter(Boolean); if (f.length) out.push(f); }
    else out.push(s);
  }
  return out;
}

export class Director {
  constructor(world, core, hooks = {}) {
    this.world = world; this.core = core; this.hooks = hooks;
    this.phase = PH.IDLE; this.steps = []; this.stepT = 0; this.stepDur = -1; this.after = null;
    this.scene = null; this.eventId = null; this.nextAt = null; this.persistT = 0; this.ff = 1; this.busy = false; this.combatOn = false; this.inArrival = false;
    this.baseWeather = 'clear';
  }
  get run() { return this.core.run; }
  setPhase(p) {
    this.phase = p;
    const enc = [PH.INTRO, PH.DECISION, PH.ACTION, PH.OUTCOME].includes(p) || this.combatOn;
    this.world.lift = enc ? 52 : (this.world.mode === 'town' ? 40 : 0);
    this.world.zoom = this.world.mode === 'town' ? 1 : (enc || p === PH.APPROACH || p === PH.EXIT) ? 1.38 : 1;
    this.hooks.onPhase && this.hooks.onPhase(p);
  }
  reset() { this.steps = []; this.after = null; this.stepDur = -1; this.stepT = 0; }

  // ——— Adım yürütücü ———
  runSteps(steps, after) { this.steps = flatten(steps); this.after = after; this.stepT = 0; this.stepDur = -1; }
  flushInstant() {
    let n = 0;
    while (this.steps.length && n++ < 400) { const s = this.steps.shift(); for (const x of [].concat(s)) this.exec(x, true); }
    for (const e of [this.world.hero, ...this.world.entities]) if (e.tween) { for (const k of Object.keys(e.tween.to)) e[k] = e.tween.to[k]; const a = e.tween.after; e.tween = null; if (a) a(e); if (!e.prop && (e.pose === 'walk' || e.pose === 'run')) e.pose = 'idle'; }
    this.world.proj = []; this.steps = []; this.stepDur = -1;
    if (this.world.scrollLeft > 0) { this.world.advance(this.world.scrollLeft); this.world.scrollLeft = 0; }
  }
  skip() { if (this.phase === PH.ACTION || this.phase === PH.OUTCOME || this.phase === PH.INTRO || this.phase === PH.EXIT || this.phase === PH.APPROACH) { this.flushInstant(); } }
  tickSteps(dt) {
    if (this.stepDur < 0) {
      if (!this.steps.length) { const a = this.after; this.after = null; this.stepDur = -1; if (a) a(); return; }
      const s = this.steps.shift(); let d = 0;
      for (const x of [].concat(s)) d = Math.max(d, this.exec(x, false) || 0);
      this.stepDur = d; this.stepT = 0;
    }
    this.stepT += dt; if (this.stepT >= this.stepDur) this.stepDur = -1;
  }
  exec(a, instant) {
    const w = this.world, sfx = (n) => !instant && this.hooks.sfx && this.hooks.sfx(n);
    const ent = (id) => w.get(id);
    switch (a.type) {
      case 'spawn': { const e = w.spawn({ ...a.e }); if (e.alpha == null) e.alpha = 1; return 0; }
      case 'remove': w.remove(a.id); return 0;
      case 'set': { const e = ent(a.id); if (e) Object.assign(e, a.props); return 0; }
      case 'move': case 'tween': {
        const e = ent(a.id); if (!e) return 0;
        const to = { ...a.to }, extra = {};
        for (const k of ['crouch', 'hang', 'limp', 'fly', 'slow']) if (a[k] != null) extra[k] = a[k];
        Object.assign(e, extra);
        if (a.show) e.hidden = false;
        if (a.from) Object.assign(e, a.from);
        if (instant) { Object.assign(e, to); if (a.type === 'move' && !e.prop) e.pose = 'idle'; return 0; }
        const from = {}; for (const k of Object.keys(to)) from[k] = e[k] != null ? e[k] : (k === 'alpha' || k === 'scale' ? 1 : 0);
        const walk = a.type === 'move' && !e.prop && (to.x != null || to.y != null);
        e.tween = { from, to, t: 0, dur: Math.max(0.01, a.dur / (a.run ? 1 : 1)), walk, run: a.run, endDir: e.id === 'hero' ? (to.y != null && to.y > (from.y || 0) + 4 ? 'down' : 'up') : null };
        return a.wait === false ? 0 : a.dur;
      }
      case 'wait': return instant ? 0 : a.dur;
      case 'say': { if (instant) return 0; this.hooks.say && this.hooks.say(a.id, a.text, a.hold + 0.8, a.think); return a.hold; }
      case 'pose': { const e = ent(a.id); if (e) { if (a.pose) e.pose = a.pose; if (a.dir) e.dir = a.dir; } return 0; }
      case 'shake': if (!instant) { w.shake(a.amp, a.dur); if (a.rumble) sfx('rumble'); } return 0;
      case 'flash': if (!instant) w.flash(a.color, a.dur); return 0;
      case 'sound': sfx(a.name); return 0;
      case 'weather': { const p = a.preset === 'clear' ? this.baseWeather : a.preset; w.setWeather(p, a); return 0; }
      case 'particles': if (!instant) w.particles(a.kind, a.at, a.n, a); return 0;
      case 'float': if (!instant && this.hooks.float) this.hooks.float(a.at, a.text, a.color); return 0;
      case 'coins': if (!instant && a.n) { w.coins(a.from, a.to, a.n); sfx('coins'); } return instant ? 0 : 0.5 + a.n * 0.05;
      case 'give': if (!instant) w.give(a.from, a.to, a.icon); return instant ? 0 : 0.7;
      case 'proj': if (!instant) w.projectile(a.from, a.to, a.kind, a.dur); return instant ? 0 : a.dur;
      case 'state': { const e = ent(a.id); if (e) e.state = a.state; if (!instant && /open|broken|ajar/.test(a.state)) sfx('chest'); return 0; }
      case 'glow': { const e = ent(a.id); if (e) e.glow = a.on ? a.color : null; return 0; }
      case 'emote': { const e = ent(a.id); if (e && !instant) { e.emote = a.icon; e.emoteT = a.dur; } return 0; }
      case 'hit': { const e = ent(a.id); if (!e || instant) return 0; e.hitT = 0.45; sfx(a.id === 'hero' ? 'hurt' : 'hit'); w.particles('blood', e.id, 4); return 0.3; }
      case 'swing': { const e = ent(a.id); if (e) e.swingT = 0.25; return 0; }
      case 'lunge': {
        const e = ent(a.id); if (!e || instant) return 0;
        const tp = w.pos(a.target), dx = tp.x - e.x, dy = (tp.y + 8) - e.y, d = Math.hypot(dx, dy) || 1, near = Math.max(0, d - 12);
        const ox = e.x, oy = e.y, tx = e.x + (dx / d) * near, ty = e.y + (dy / d) * near;
        e.swingT = 0.35;
        e.tween = { from: { x: ox, y: oy }, to: { x: tx, y: ty }, t: 0, dur: 0.16, ease: 'linear', after: (en) => { en.tween = { from: { x: tx, y: ty }, to: { x: ox, y: oy }, t: 0, dur: 0.24 }; } };
        return 0.42;
      }
      case 'fall': { const e = ent(a.id); if (!e) return 0; if (a.crumble || e.kind === 'skeleton' || e.kind === 'golem') { if (!instant) w.particles(e.kind === 'golem' ? 'stone' : 'bones', e.id, 18); e.alpha = 0.0; e.dead = true; } else e.pose = 'down'; if (!instant) sfx('thud'); return instant ? 0 : 0.5; }
      case 'flee': {
        const e = ent(a.id); if (!e) return 0;
        if (instant) { e.dead = true; w.entities = w.entities.filter((x) => x !== e); return 0; }
        const sp = a.fast ? 200 : a.slow ? 60 : 130, v = { up: [0, -sp], down: [0, sp], left: [-sp, 0], right: [sp, 0] }[a.dir] || [0, -sp];
        e.tween = null; e.flee = { vx: v[0], vy: v[1] }; e.pose = 'run'; e.dir = a.dir; if (a.fly) e.fly = 1; e.encounter = 1;
        return 0.5;
      }
      case 'jump': { const e = ent(a.id); if (!e || instant) return 0; e.jumpT = 0; e.jumpDur = a.dur; e.jumpH = a.h; return a.dur; }
      case 'spin': { const e = ent(a.id); if (!e || instant) return 0; e.spinEnd = e.dir; e.spinT = a.dur; return a.dur; }
      case 'scroll': { if (instant) { w.advance(a.dy); return 0; } w.scrollLeft = a.dy; w.scrollRate = a.dy / a.dur; this.hooks.sfx && this.hooks.sfx('steps'); return a.dur; }
      case 'camera': { if (a.focus) { w.cam.tx = a.focus.x * 0.35; w.cam.ty = (a.focus.y + 40) * 0.3; } else { w.cam.tx = 0; w.cam.ty = 0; } return 0; }
      case 'dark': { w.darkTarget = a.v; if (instant) w.darkCur = a.v; else w.darkRate = Math.max(0.05, Math.abs(a.v - w.darkCur) / Math.max(0.1, a.dur)); return 0; }
      case 'banner': if (!instant && this.hooks.banner) { this.hooks.banner(a.text, a.color); sfx('fanfare'); } return instant ? 0 : 1.4;
      case 'timestop': if (!instant) w.timeStop = a.dur; return 0;
      case 'speed': w.targetSpeed = a.v; return 0;
      case 'call': a.fn(this, instant); return 0;
      case 'sync': this.hooks.sync && this.hooks.sync(); return 0;
      default: return 0;
    }
  }

  // ——— Yolculuk ———
  enterVoyage(resume = false) {
    this.reset(); this.combatOn = false;
    const v = this.run.voyage, w = this.world;
    w.mode = 'road'; w.town = null;
    w.entities = w.entities.filter((e) => !e.townNpc);
    w.setRoad({ region: v.region, lane: v.lane, tod: v.tod, seed: this.run.seed + '|' + this.run.idx });
    this.baseWeather = this.legWeather(v);
    w.setWeather(this.baseWeather); w.darkTarget = 0; w.darkCur = 0; w.gate = null;
    w.hero.x = 0; w.hero.y = 0; w.hero.alpha = 1; w.hero.pose = 'idle'; w.hero.dir = 'up';
    this.escort();
    this.nextAt = null;
    this.hooks.onVoyage && this.hooks.onVoyage(v);
    if (v.current) { this.resumeEncounter(v.current); return; }
    w.targetSpeed = WALK; this.setPhase(PH.SAIL);
  }
  legWeather(v) {
    const cond = this.run.endless && this.run.endless.cond;
    if (cond === 'hardWinter') return 'snow';
    const reg = [null, ['clear', 'clear', 'rain'], ['clear', 'fog', 'rain'], ['clear', 'snow', 'fog'], ['fog', 'fog', 'rain'], ['clear', 'clear', 'rain']][v.region] || ['clear'];
    let h = 0; for (const ch of (this.run.seed + this.run.idx)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return reg[h % reg.length];
  }
  escort() { const esc = this.run.contracts.find((c) => c.type === 'escort' && !c.done && !c.failed); const w = this.world; w.remove('escortNpc'); if (esc) w.spawn({ id: 'escortNpc', kind: 'pilgrim', x: 14, y: 18, follow: 1, persist: 1, encounter: 0 }); }
  update(dt) {
    const run = this.run; if (!run) return;
    dt *= this.ff;
    if (this.steps.length || this.stepDur >= 0 || this.after) this.tickSteps(dt);
    if (this.world.mode === 'town') this.world.townWander(dt);
    if (run.phase === 'voyage' && run.voyage && this.phase === PH.SAIL) this.sail(dt);
  }
  sail(dt) {
    const v = this.run.voyage, C = CFG.voyage, w = this.world;
    w.targetSpeed = WALK;
    v.elapsed = (v.elapsed || 0) + dt * C.walkRate;
    this.persistT += dt; if (this.persistT > 5) { this.persistT = 0; this.core.setVoyageElapsed(v.elapsed, true); }
    const s = v.queue.length - v.pos;
    if (s > 0 && v.elapsed > v.duration - C.minGap) v.duration = v.elapsed + C.minGap * (s + 1);
    if (this.nextAt == null) {
      if (s > 0) { const gap = Math.max(C.minGap, (v.duration - v.elapsed) / (s + 1)); this.nextAt = Math.max(v.elapsed + gap * (0.85 + Math.random() * 0.3), v.pos === 0 ? C.firstEventMin : 0); }
      else this.nextAt = v.duration;
    }
    const left = v.duration - v.elapsed;
    if (s === 0 && left < 32) {
      const town = this.run.towns[v.toId];
      if (!w.gate) w.gate = { type: town.type, y: -260 };
      w.gate.y = Math.min(w.gate.y, -40 - (left / C.walkRate) * WALK);
    }
    this.hooks.onProgress && this.hooks.onProgress();
    if (v.elapsed >= this.nextAt) { this.nextAt = null; if (s > 0) this.beginEncounter(); else this.beginDocking(); }
  }
  setFast(on) { this.ff = on ? 2.2 : 1; }

  // ——— Karşılaşma ———
  beginEncounter() {
    const r = this.core.nextEvent();
    if (!r.ok) { if (r.done) this.beginDocking(); return; }
    this.startScene(r.id, false);
  }
  startScene(id, arrival) {
    const ev = EVENTS[id];
    this.eventId = id; this.scene = buildScene(ev); this.inArrival = arrival;
    const w = this.world;
    w.clearEncounter(); w.cam.tx = 0; w.cam.ty = 0;
    if (arrival) { w.mode = 'road'; w.gate = w.gate || { type: this.core.town() ? this.core.town().type : 'village', y: -150 }; w.gate.y = -150; w.hero.x = 0; w.hero.y = 0; w.hero.alpha = 1; }
    this.setPhase(PH.APPROACH);
    this.hooks.onEncounter && this.hooks.onEncounter(ev);
    this.hooks.sfx && this.hooks.sfx(['danger', 'chain'].includes(ev.cat) ? 'danger' : 'event');
    w.targetSpeed = 0;
    this.runSteps([...this.scene.setup(), ...this.scene.approach()], () => {
      this.setPhase(PH.INTRO);
      this.runSteps(this.scene.intro(), () => this.setPhase(PH.DECISION));
    });
  }
  resumeEncounter(cur) {
    const ev = EVENTS[cur.id];
    this.eventId = cur.id; this.scene = buildScene(ev);
    this.world.clearEncounter(); this.world.targetSpeed = 0; this.world.speed = 0;
    if (this.inArrival || this.run.phase === 'arrival') { this.inArrival = true; this.world.gate = { type: this.core.town() ? this.core.town().type : 'village', y: -150 }; }
    this.runSteps([...this.scene.setup(), ...this.scene.approach()]); this.flushInstant();
    this.hooks.onEncounter && this.hooks.onEncounter(ev);
    if (cur.result) { this.lastInfo = { key: cur.result.key, outcome: cur.result.outcome, result: cur.result }; this.setPhase(PH.OUTCOME); this.hooks.showOutcome && this.hooks.showOutcome(cur.result, ev); return; }
    if (cur.combat) { this.ensureFoes(cur.combat); this.combatOn = true; this.setPhase(PH.ACTION); this.hooks.showCombat && this.hooks.showCombat(cur.combat); return; }
    this.setPhase(PH.DECISION);
  }
  snapshot() { const r = this.run; return { hp: r.hero.hp, gold: r.gold, bag: r.bag.map((b) => b.id + ':' + (b.n || 1)), equip: { ...r.equip }, overflow: r.overflow.length }; }
  choose(key) {
    if (this.phase !== PH.DECISION || this.busy) return { ok: false };
    const before = this.snapshot();
    const res = this.core.choose(key);
    if (!res.ok) return res;
    const h = this.core.host(), cur = h.current;
    if (res.combat) {
      this.setPhase(PH.ACTION);
      this.runSteps(this.scene.action({ key, outcome: 'pending' }), () => { this.ensureFoes(cur.combat); this.combatOn = true; this.setPhase(PH.ACTION); this.hooks.showCombat && this.hooks.showCombat(cur.combat); });
      return res;
    }
    this.playOutcome(cur.result, before, true);
    return res;
  }
  ensureFoes(cb) {
    const w = this.world;
    cb.foes.forEach((f, i) => {
      if (f.dead) { const e = w.get(f.eid); if (e && !e.prop) { if (['fade', 'crumble', 'flee', 'sink'].includes(f.death)) w.remove(f.eid); else e.pose = f.death === 'kneel' ? 'kneel' : 'down'; } return; }
      if (!w.get(f.eid)) w.spawn({ id: f.eid, kind: f.spawnKind || ENEMIES[f.id].kind, x: (i - (cb.foes.length - 1) / 2) * 22, y: -40, dir: 'down', scale: ENEMIES[f.id].scale, tint: ENEMIES[f.id].tint });
      const e = w.get(f.eid); if (e) { e.pose = 'idle'; e.alpha = Math.max(e.alpha || 0, 0.85); e.hidden = false; if (e.hang) e.hang = 0; }
    });
  }
  playOutcome(result, before, withAction) {
    const ev = EVENTS[this.eventId], info = { key: result.key, outcome: result.outcome, result };
    this.lastInfo = info;
    this.setPhase(PH.ACTION);
    const autoSteps = this.autoFx(before, result);
    let outSteps = flatten(this.scene.outcome(info));
    const ai = outSteps.findIndex((s) => !Array.isArray(s) && s.type === 'auto');
    if (ai >= 0) outSteps.splice(ai, 1, ...autoSteps); else outSteps.push(...autoSteps);
    if (result.dead) outSteps = [...flatten(this.scene.outcome(info)).filter((s) => Array.isArray(s) || s.type !== 'auto').slice(0, 2), ...this.deathSteps()];
    const steps = [...(withAction ? this.scene.action(info) : []), o('call', { fn: (d) => d.setPhase(PH.OUTCOME) }), ...outSteps, o('sync')];
    this.runSteps(steps, () => { this.hooks.sfx && this.hooks.sfx(result.dead ? 'death' : result.success ? 'success' : 'fail'); if (this.phase !== PH.OUTCOME) this.setPhase(PH.OUTCOME); this.hooks.showOutcome && this.hooks.showOutcome(result, ev); });
  }
  deathSteps() { return [par(o('pose', { id: 'hero', pose: 'down' }), o('flash', { color: '#8a0a0a', dur: 0.6 }), o('dark', { v: 0.5, dur: 1 }), o('sound', { name: 'death' })), o('wait', { dur: 1.2 })]; }
  autoFx(before, result) {
    if (!before) return [];
    const r = this.run, s = [], main = this.scene.main && this.world.get(this.scene.main) ? this.scene.main : { x: 0, y: -60 };
    const dhp = r.hero.hp - before.hp, dg = r.gold - before.gold;
    if (dhp < 0 && !result.combat) s.push(par(o('hit', { id: 'hero' }), o('shake', { amp: Math.min(6, 2 - dhp / 8), dur: 0.3 }), o('float', { at: 'hero', text: `${dhp} HP`, color: '#ff6b5e' })));
    if (dhp > 0) s.push(par(o('particles', { kind: 'heal', at: 'hero', n: 12 }), o('float', { at: 'hero', text: `+${dhp} HP`, color: '#6fd36a' }), o('sound', { name: 'heal' })));
    if (dg > 0) s.push(par(o('coins', { from: main, to: 'hero', n: Math.min(10, 3 + Math.round(dg / 10)) }), o('float', { at: 'hero', text: `+${dg} altın`, color: '#f2c14e' })));
    if (dg < 0) s.push(par(o('coins', { from: 'hero', to: main, n: Math.min(8, 2 + Math.round(-dg / 10)) }), o('float', { at: 'hero', text: `${dg} altın`, color: '#f2a04e' })));
    const now = r.bag.map((b) => b.id + ':' + (b.n || 1));
    const cnt = (arr) => { const m = {}; for (const x of arr) { const [id, n] = x.split(':'); m[id] = (m[id] || 0) + Number(n); } return m; };
    const a = cnt(before.bag), b = cnt(now);
    for (const slot of ['weapon', 'armor', 'acc']) { if (r.equip[slot] && r.equip[slot] !== before.equip[slot]) b[r.equip[slot]] = (b[r.equip[slot]] || 0) + 1; }
    const gained = Object.keys(b).filter((k) => (b[k] || 0) > (a[k] || 0)), lost = Object.keys(a).filter((k) => (a[k] || 0) > (b[k] || 0));
    for (const id of gained.slice(0, 3)) s.push(par(o('give', { from: main, to: 'hero', icon: iconForItem(ITEMS[id].icon || id) }), o('float', { at: 'hero', text: ITEMS[id].name, color: '#bfe0ff' }), o('sound', { name: ['rare', 'legendary'].includes(ITEMS[id].rarity) ? 'rare' : 'pickup' })));
    for (const id of lost.slice(0, 2)) s.push(o('give', { from: 'hero', to: { x: 80, y: -20 }, icon: iconForItem(ITEMS[id].icon || id) }));
    if (r.overflow.length > before.overflow) s.push(o('float', { at: 'hero', text: 'Çanta dolu!', color: '#ffb03a' }));
    return s;
  }
  // ——— Savaş ———
  combatAction(action) {
    if (!this.combatOn || this.busy) return { ok: false };
    const before = this.snapshot();
    const res = this.core.combatAction(action);
    if (!res.ok) return res;
    this.busy = true;
    const cb = this.core.host().current.combat;
    const steps = this.beatSteps(res.beats, cb);
    this.hooks.onCombatStep && this.hooks.onCombatStep(true);
    this.runSteps([...steps, o('wait', { dur: 0.2 })], () => {
      this.busy = false;
      if (res.over) {
        this.combatOn = false; this.hooks.hideCombat && this.hooks.hideCombat();
        const cur = this.core.host().current;
        const pre = res.over === 'flee' ? [par(o('move', { id: 'hero', to: { x: 46, y: -20 }, dur: 0.5, run: 1 }), o('sound', { name: 'whoosh' })), o('move', { id: 'hero', to: { x: 36, y: -120 }, dur: 0.6, run: 1 })] : [];
        this.runSteps(pre, () => this.playOutcome(cur.result, before, false));
      } else this.hooks.showCombat && this.hooks.showCombat(cb);
    });
    return res;
  }
  beatSteps(beats, cb) {
    const s = [], foe = (eid) => cb.foes.find((f) => f.eid === eid);
    const dmgF = (eid, h) => h.miss ? o('float', { at: eid, text: 'Iska!', color: '#c8d0e0' }) : o('float', { at: eid, text: `-${h.dmg}`, color: h.kill ? '#ffd23a' : '#ffffff' });
    const death = (eid) => {
      const f = foe(eid); if (!f) return [];
      switch (f.death) {
        case 'flee': return [o('flee', { id: eid, dir: 'up' }), o('sound', { name: 'whine' })];
        case 'kneel': return [o('pose', { id: eid, pose: 'kneel' }), o('emote', { id: eid, icon: '💧' })];
        case 'crumble': return [o('fall', { id: eid, crumble: 1 }), o('sound', { name: 'crumble' })];
        case 'fade': return [o('tween', { id: eid, to: { alpha: 0 }, dur: 0.6 }), o('particles', { kind: 'mist', at: eid, n: 14 }), o('sound', { name: 'wail' })];
        case 'sink': return [o('set', { id: eid, props: { sink: 1 } }), o('tween', { id: eid, to: { alpha: 0 }, dur: 0.6 }), o('particles', { kind: 'bubble', at: eid, n: 10 })];
        case 'curl': return [o('fall', { id: eid })];
        default: return [o('fall', { id: eid })];
      }
    };
    for (const b of beats) {
      switch (b.t) {
        case 'hAtk': s.push(par(o('lunge', { id: 'hero', target: b.eid }), o('sound', { name: 'slash' }))); s.push(par(b.miss ? null : o('hit', { id: b.eid }), dmgF(b.eid, b))); if (b.kill) s.push(par(...death(b.eid))); break;
        case 'hSpec': {
          if (b.fam === 'sword') { for (const h of b.hits) { s.push(par(o('lunge', { id: 'hero', target: h.eid }), o('sound', { name: 'slash' }))); s.push(par(h.miss ? null : o('hit', { id: h.eid }), dmgF(h.eid, h))); if (h.kill) s.push(par(...death(h.eid))); } s.unshift(o('float', { at: 'hero', text: 'Çifte Darbe!', color: '#ffd76a' })); }
          else if (b.fam === 'axe') { const h = b.hits[0]; s.push(o('float', { at: 'hero', text: 'Zırh Kırıcı!', color: '#ffd76a' }), par(o('lunge', { id: 'hero', target: h.eid }), o('sound', { name: 'heavy' })), par(o('hit', { id: h.eid }), o('shake', { amp: 5, dur: 0.35 }), o('particles', { kind: 'spark', at: h.eid, n: 14 }), dmgF(h.eid, h))); if (h.kill) s.push(par(...death(h.eid))); }
          else { s.push(o('float', { at: 'hero', text: 'Süpürme Saldırısı!', color: '#ffd76a' }), par(o('spin', { id: 'hero', dur: 0.45 }), o('sound', { name: 'sweep' }))); s.push(par(...b.hits.flatMap((h) => [h.miss ? null : o('hit', { id: h.eid }), dmgF(h.eid, h)]))); const k = b.hits.filter((h) => h.kill); if (k.length) s.push(par(...k.flatMap((h) => death(h.eid)))); }
          break;
        }
        case 'hDef': s.push(par(o('pose', { id: 'hero', pose: 'guard' }), o('glow', { id: 'hero', color: '#9ad8ff', on: 1 }), o('float', { at: 'hero', text: 'Savunma', color: '#9ad8ff' }), o('sound', { name: 'shield' })), o('wait', { dur: 0.25 })); break;
        case 'hItem': {
          const it = ITEMS[b.item];
          s.push(par(o('give', { from: { x: 0, y: -24 }, to: 'hero', icon: iconForItem(it.icon || b.item) }), o('float', { at: 'hero', text: it.name, color: '#bfe0ff' })));
          if (b.heal) s.push(par(o('particles', { kind: 'heal', at: 'hero', n: 14 }), o('float', { at: 'hero', text: `+${b.heal} HP`, color: '#6fd36a' }), o('sound', { name: 'heal' })));
          if (b.hits) { s.push(par(...b.hits.map((h) => o('proj', { from: 'hero', to: h.eid, kind: 'bomb', dur: 0.45 })))); s.push(par(o('flash', { color: '#ff9a40', dur: 0.2 }), o('sound', { name: 'fire' }), ...b.hits.flatMap((h) => [o('particles', { kind: 'fire', at: h.eid, n: 16 }), o('hit', { id: h.eid }), o('float', { at: h.eid, text: `-${h.dmg}`, color: '#ffb03a' })]))); const k = b.hits.filter((h) => h.kill); if (k.length) s.push(par(...k.flatMap((h) => death(h.eid)))); }
          if (b.ward) s.push(par(o('glow', { id: 'hero', color: '#7ac8ff', on: 1 }), o('sound', { name: 'chime' })));
          if (b.flee) s.push(par(o('particles', { kind: 'smoke', at: 'hero', n: 40 }), o('sound', { name: 'poof' })));
          break;
        }
        case 'flee': if (!b.ok) s.push(par(o('move', { id: 'hero', to: { x: 22, y: 6 }, dur: 0.3, run: 1 }), o('float', { at: 'hero', text: `Kaçamadın! (%${b.chance})`, color: '#ff8a6a' })), o('move', { id: 'hero', to: { x: 0, y: 0 }, dur: 0.3 })); break;
        case 'fAct': {
          const f = foe(b.eid); const I = INTENTS[b.intent] || INTENTS.atk;
          if (!f) break;
          if (I.mult > 0) {
            if (I.ranged) s.push(par(o('pose', { id: b.eid, pose: 'aim' }), o('proj', { from: b.eid, to: 'hero', kind: b.intent === 'web' ? 'rope' : b.intent === 'wail' ? 'magic' : 'arrow', dur: 0.35 }), o('sound', { name: b.intent === 'wail' ? 'wail' : 'arrow' })));
            else s.push(par(o('lunge', { id: b.eid, target: 'hero' }), o('sound', { name: b.intent === 'slam' || b.intent === 'heavy' || b.intent === 'charge' ? 'heavy' : 'enemyHit' }), b.intent === 'slam' ? o('shake', { amp: 6, dur: 0.4 }) : null));
            if (b.dodged) s.push(par(o('jump', { id: 'hero', h: 6, dur: 0.3 }), o('float', { at: 'hero', text: 'Kaçındın!', color: '#bfe0ff' })));
            else if (b.warded) s.push(par(o('glow', { id: 'hero', on: 0 }), o('flash', { color: '#7ac8ff', dur: 0.2 }), o('float', { at: 'hero', text: 'Engellendi!', color: '#7ac8ff' })));
            else s.push(par(o('hit', { id: 'hero' }), o('shake', { amp: Math.min(5, 1 + b.dmg / 6), dur: 0.25 }), o('float', { at: 'hero', text: `-${b.dmg} HP`, color: '#ff6b5e' })));
            if (b.heal) s.push(par(o('particles', { kind: 'curse', at: b.eid, n: 10 }), o('float', { at: b.eid, text: `+${b.heal}`, color: '#9ef08a' })));
            if (b.debuff) s.push(o('float', { at: 'hero', text: b.debuff === 'agi' ? 'Ağa takıldın! −Çeviklik' : 'Ürperdin! −Saldırı', color: '#c8a8ff' }));
            s.push(o('pose', { id: b.eid, pose: 'idle' }));
          } else if (b.intent === 'howl') s.push(par(o('pose', { id: b.eid, pose: 'howl' }), o('sound', { name: 'howl' }), o('float', { at: b.eid, text: '+Saldırı', color: '#ff9a6a' })), o('pose', { id: b.eid, pose: 'idle' }));
          else if (b.intent === 'rally') s.push(par(o('float', { at: b.eid, text: 'Toparlanıyor!', color: '#9ef08a' }), o('sound', { name: 'shout' }), o('particles', { kind: 'heal', at: b.eid, n: 8 })));
          else if (b.intent === 'guard') s.push(par(o('float', { at: b.eid, text: 'Savunmada', color: '#9ad8ff' }), o('sound', { name: 'shield' })));
          else if (b.intent === 'aim') s.push(par(o('pose', { id: b.eid, pose: 'aim' }), o('float', { at: b.eid, text: 'Nişan alıyor...', color: '#ffd76a' })));
          s.push(o('wait', { dur: 0.12 }));
          break;
        }
        case 'instinct': s.push(par(o('glow', { id: 'hero', color: '#ffd76a', on: 1 }), o('float', { at: 'hero', text: 'Savaşçı İçgüdüsü! Odak doldu', color: '#ffd76a' }), o('sound', { name: 'rare' })), o('wait', { dur: 0.4 }), o('glow', { id: 'hero', on: 0 })); break;
        case 'dead': s.push(...this.deathSteps()); break;
      }
    }
    s.push(par(o('pose', { id: 'hero', pose: 'ready' }), o('glow', { id: 'hero', on: 0 })));
    return s;
  }
  continueAfter() {
    if (this.phase !== PH.OUTCOME) return;
    const res = this.core.continueEvent();
    if (!res.ok) return;
    if (this.run.ended) { this.setPhase(PH.IDLE); this.hooks.onEnded && this.hooks.onEnded(); return; }
    this.setPhase(PH.EXIT);
    const exitSteps = [...this.scene.exit(this.lastInfo || {}), o('sync')];
    if (this.inArrival) {
      this.runSteps(exitSteps, () => { if (this.run.phase === 'arrival') this.playArrival(); else this.enterTownAnim(); });
      return;
    }
    this.runSteps(exitSteps, () => this.toSail());
  }
  toSail() {
    const w = this.world, h = w.hero;
    this.setPhase(PH.RESUME);
    w.setWeather(this.baseWeather); w.darkTarget = 0; w.cam.tx = 0; w.cam.ty = 0;
    const steps = [];
    // kahramanı yola geri hizala (yukarıdaysa dünya kayar, yanlardaysa yürür)
    if (h.y < -4) { const dy = -h.y; steps.push(o('call', { fn: () => { for (const e of w.entities) e.y += dy; for (const ch of w.chunks) ch.y += dy; h.y = 0; } })); }
    if (Math.abs(h.x) > 2 || h.y > 2) steps.push(o('move', { id: 'hero', to: { x: 0, y: 0 }, dur: 0.6 }));
    steps.push(o('pose', { id: 'hero', pose: 'idle', dir: 'up' }), o('call', { fn: () => { h.alpha = 1; h.glow = null; h.carry = null; h.sunk = 0; h.swim = 0; h.climb = 0; h.elev = 0; h.tint = null; h.cursedBlade = 0; } }), o('speed', { v: WALK }), o('wait', { dur: 0.8 }));
    this.runSteps(steps, () => { for (const e of w.entities) if (e.encounter && !e.flee) e.encounter = 1; this.escort(); this.setPhase(PH.SAIL); });
  }
  // ——— Varış ———
  beginDocking() {
    const w = this.world;
    this.setPhase(PH.DOCKING);
    w.targetSpeed = 0;
    if (!w.gate) w.gate = { type: this.run.towns[this.run.voyage.toId].type, y: -60 };
    this.hooks.sfx && this.hooks.sfx('town');
    this.runSteps([o('scroll', { dy: Math.max(0, -40 - w.gate.y + 30), dur: 1.2 }), o('call', { fn: () => { w.gate.open = 1; } }), o('move', { id: 'hero', to: { x: 0, y: -18 }, dur: 1 })], () => {
      const r = this.core.finishRoute();
      if (!r.ok) { this.toSail(); return; }
      this.world.hero.y = 0; w.gate.y = -150; w.gate.open = 0;
      if (this.run.phase === 'arrival') this.playArrival(); else this.enterTownAnim();
    });
  }
  playArrival() {
    const r = this.core.arrivalNext();
    if (!r.ok) { this.enterTownAnim(); return; }
    this.startScene(r.id, true);
  }
  enterTownAnim() {
    const w = this.world;
    this.inArrival = false; w.clearEncounter();
    this.setPhase(PH.DOCKING);
    w.gate = w.gate || { type: this.core.town().type, y: -60 };
    this.runSteps([o('call', { fn: () => { w.gate.open = 1; if (w.gate.y < -60) w.gate.y = -60; } }), o('move', { id: 'hero', to: { x: 0, y: w.gate.y + 16 }, dur: 0.8 }), o('tween', { id: 'hero', to: { alpha: 0 }, dur: 0.4 })], () => this.toTown());
  }
  toTown() {
    const w = this.world, town = this.core.town();
    w.gate = null; w.clearEncounter(); w.hero.alpha = 1; w.hero.glow = null; w.setWeather('clear'); w.darkTarget = 0; w.darkCur = 0; w.tod = 'day';
    w.setTown(town);
    this.combatOn = false;
    this.setPhase(PH.DOCKED);
    this.hooks.onDocked && this.hooks.onDocked(town);
  }
}
