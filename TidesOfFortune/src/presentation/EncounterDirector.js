// EncounterDirector: eventlerin görsel sunumu. Kurallar/şans/ödüller EventSystem'de kalır.
// Akış: NORMAL_SAILING → ENCOUNTER_APPROACH → ENCOUNTER_INTRO → PLAYER_DECISION → ACTION_ANIMATION
//       → OUTCOME_ANIMATION → ENCOUNTER_EXIT → RESUME_SAILING → NORMAL_SAILING  (+ DOCKING, DOCKED)
// Oyun durumu karar anında bir kez değişir ve kaydedilir; animasyon yalnızca görsel "gösterim katmanını"
// (kargo/altın/gövde göstergesi) eski değerden yeni değere taşır. Kayıt yüklenince yarım animasyon atlanır.
import { BALANCE } from '../config/balance.js';
import { EVENT_BY_ID } from '../data/events.js';
import { GOOD_BY_ID } from '../data/goods.js';
import { ITEM_BY_ID } from '../data/items.js';
import { CREW_BY_ID } from '../data/crew.js';
import { PET_BY_ID } from '../data/pets.js';
import { HARBOR_BY_ID } from '../data/harbors.js';
import { hashString } from '../core/SeededRNG.js';
import { SCENES, sceneFor } from './scenes.js';

export const PH = {
  SAIL: 'NORMAL_SAILING', APPROACH: 'ENCOUNTER_APPROACH', INTRO: 'ENCOUNTER_INTRO', DECISION: 'PLAYER_DECISION',
  ACTION: 'ACTION_ANIMATION', OUTCOME: 'OUTCOME_ANIMATION', EXIT: 'ENCOUNTER_EXIT', RESUME: 'RESUME_SAILING',
  DOCKING: 'DOCKING', DOCKED: 'DOCKED', IDLE: 'IDLE',
};

const SAIL_SPEED = 30;

function units(run) {
  const u = [];
  for (const lot of run.cargo) for (let i = 0; i < lot.qty; i++) u.push({ good: lot.good, spoiled: lot.spoiled });
  return u;
}

export class EncounterDirector {
  constructor(world, core, hooks = {}) {
    this.world = world;
    this.core = core;
    this.hooks = hooks; // { sfx(name), onPhase(phase), music(mode) }
    this.phase = PH.IDLE;
    this.steps = [];
    this.stepT = 0;
    this.stepDur = 0;
    this.after = null;
    this.display = null;
    this.ff = 1;
    this.persistT = 0;
    this.scene = null;
    this.eventId = null;
  }

  setPhase(p) {
    this.phase = p;
    this.world.lift = [PH.INTRO, PH.DECISION, PH.ACTION, PH.OUTCOME].includes(p) ? 62 : 0;
    this.hooks.onPhase?.(p);
  }

  get run() {
    return this.core.run;
  }

  /** Bekleyen adımları ve geri çağrıları iptal et (sahne değişince eski animasyon yeni duruma dokunmasın) */
  reset() {
    this.steps = [];
    this.after = null;
    this.stepDur = -1;
    this.stepT = 0;
    this.world.extraRot = 0;
    this.world.shipTargetY = 0;
    this.world.flagUp = false;
    this.world.deck.temp = [];
  }

  // ───────── Kurulum (ekran değişince) ─────────
  enterVoyage() {
    this.reset();
    const run = this.run;
    const v = run.voyage;
    const w = this.world;
    w.mode = 'sail';
    w.harbor = null;
    w.coast = null;
    w.cam.tx = 0; w.cam.ty = 0; w.cam.tzoom = 1;
    w.shipTargetX = 0;
    w.region = HARBOR_BY_ID[run.route[v.toIdx].harborId].region;
    this.applyWeather();
    this.nextAt = null;
    this.ff = 1;
    if (v.current) {
      // kayıttan devam: yaklaşma atlanır
      this.eventId = v.current.id;
      this.scene = sceneFor(EVENT_BY_ID[v.current.id], this.sideFor(v.current.id));
      w.clearEncounter();
      this.runSteps(this.scene.setup(this.ctx(), true), null);
      this.flushInstant();
      w.targetSpeed = 3;
      w.speed = 3;
      w.sails = 'furled';
      if (v.current.result) this.setPhase(PH.OUTCOME);
      else this.setPhase(PH.DECISION);
    } else {
      w.clearEncounter();
      w.targetSpeed = SAIL_SPEED;
      w.sails = 'full';
      this.setPhase(PH.SAIL);
    }
  }

  enterHarbor(type, seed, docked = true) {
    this.reset();
    const w = this.world;
    w.mode = 'harbor';
    w.clearEncounter();
    w.coast = null;
    w.harbor = { type, offY: 0, seed };
    w.targetSpeed = 0;
    w.speed = 0;
    w.sails = 'furled';
    w.cam.tx = 0; w.cam.ty = 0; w.cam.tzoom = 1;
    w.weatherFx = type === 'ice' ? ['snow'] : type === 'volcanic' ? ['ash'] : [];
    w.ocean.preset = type === 'ice' ? 'ice' : type === 'volcanic' ? 'ash' : type === 'pirate' ? 'dark' : 'calm';
    w.ocean.fog = type === 'fog' ? 1 : 0;
    w.ocean.night = false;
    w.ocean.dark = 0;
    this.setPhase(docked ? PH.DOCKED : PH.IDLE);
    // varış eventi (rıhtım) devam ediyorsa sahneyi kur
    const a = this.run?.arrival;
    if (a && a.current) {
      this.eventId = a.current.id;
      this.scene = sceneFor(EVENT_BY_ID[a.current.id], 1);
      if (a.current.result) {
        this.runSteps(this.scene.setup(this.ctx(), true), null);
        this.flushInstant();
        this.setPhase(PH.OUTCOME);
      } else {
        // rıhtım eventi: kurulum + giriş animasyonu oynar (durum henüz değişmedi, tekrar oynatmak güvenli)
        const c = this.ctx();
        this.setPhase(PH.APPROACH);
        this.runSteps([...this.scene.setup(c, false), ...(this.scene.dockApproach ? this.scene.dockApproach(c) : [])], () => {
          this.setPhase(PH.INTRO);
          this.runSteps(this.scene.intro(this.ctx()), () => this.setPhase(PH.DECISION));
        });
      }
    }
  }

  applyWeather() {
    const run = this.run;
    const w = this.world;
    const v = run.voyage;
    const region = w.region;
    const h = hashString(run.seed + '|w|' + v.toIdx) % 4;
    const opts = {
      1: [['calm', []], ['calm', []], ['tropical', []], ['open', []]],
      2: [['open', []], ['calm', []], ['open', ['rain']], ['open', []]],
      3: [['open', []], ['dark', []], ['open', ['rain']], ['calm', ['fog']]],
      4: [['dark', ['rain']], ['ash', ['ash']], ['storm', ['rain', 'lightning']], ['dark', []]],
      5: [['ice', ['snow']], ['dark', []], ['storm', ['rain', 'lightning']], ['ice', []]],
    }[region][h];
    w.ocean.preset = opts[0];
    w.weatherFx = opts[1].filter((x) => x !== 'fog');
    w.ocean.fog = opts[1].includes('fog') ? 1 : 0;
    w.ocean.night = region >= 4 && h === 3;
    w.ocean.dark = 0;
    this.baseWeather = { preset: w.ocean.preset, fx: w.weatherFx.slice(), fog: w.ocean.fog, night: w.ocean.night };
  }

  restoreWeather() {
    const b = this.baseWeather;
    if (!b) return;
    const w = this.world;
    w.ocean.preset = b.preset;
    w.weatherFx = b.fx.slice();
    w.ocean.fog = b.fog;
    w.ocean.night = b.night;
    w.ocean.dark = 0;
  }

  sideFor(id) {
    return hashString(id + (this.run?.seed || '')) % 2 ? 1 : -1;
  }

  ctx() {
    const w = this.world;
    const L = w.layout();
    return { world: w, L, beam: L.beam, len: L.len, side: this.scene?.side ?? 1, run: this.run, core: this.core, ev: EVENT_BY_ID[this.eventId] };
  }

  // ───────── Adımlar ─────────
  runSteps(steps, after) {
    this.steps = steps.filter(Boolean);
    this.after = after;
    this.stepT = 0;
    this.stepDur = -1;
  }

  flushInstant() {
    // kurulum adımlarını beklemeden uygula (kayıttan dönüş)
    let guard = 0;
    while (this.steps.length && guard++ < 50) {
      const step = this.steps.shift();
      for (const a of [].concat(step)) this.exec(a, true);
    }
    for (const e of this.world.entities) if (e.tween) { for (const k of Object.keys(e.tween.to)) e[k] = e.tween.to[k]; e.tween = null; }
    this.steps = [];
    this.stepDur = -1;
  }

  tickSteps(dt) {
    if (this.stepDur < 0) {
      if (!this.steps.length) {
        const f = this.after;
        this.after = null;
        this.stepDur = -1;
        if (f) f();
        return;
      }
      const step = this.steps.shift();
      let d = 0;
      for (const a of [].concat(step)) d = Math.max(d, this.exec(a, false) || 0);
      this.stepDur = d;
      this.stepT = 0;
    }
    this.stepT += dt;
    if (this.stepT >= this.stepDur) this.stepDur = -1;
  }

  /** Aksiyon yürütücü (yeniden kullanılabilir görsel olay ilkelleri) */
  exec(a, instant) {
    const w = this.world;
    const sfx = (n) => !instant && this.hooks.sfx?.(n);
    const at = (ref) => {
      if (ref === 'ship' || ref == null) return { x: w.ship.x, y: w.ship.y };
      if (typeof ref === 'string') { const e = w.get(ref); return e ? { x: e.x, y: e.y } : { x: 0, y: -100 }; }
      if (ref.slot != null) { const L = w.layout(); const sl = L.cargoSlots[ref.slot % L.cargoSlots.length]; return w.shipToWorld(sl.x, sl.y); }
      if (ref.rail) { const L = w.layout(); return { x: w.ship.x + ref.rail * (L.beam / 2 - 4), y: w.ship.y + (ref.dy || 0) }; }
      return ref;
    };
    switch (a.type) {
      case 'spawn': w.spawn({ ...a.e }); return 0;
      case 'remove': w.remove(a.id); return 0;
      case 'move': {
        const e = w.get(a.id);
        if (!e) return 0;
        if (instant) { Object.assign(e, a.to); return 0; }
        const from = {};
        for (const k of Object.keys(a.to)) from[k] = e[k] ?? 0;
        e.tween = { from, to: a.to, t: 0, dur: a.dur, ease: a.ease };
        e.drift = false;
        return a.wait === false ? 0 : a.dur;
      }
      case 'wait': return instant ? 0 : a.dur;
      case 'say': {
        if (instant) return 0;
        if (a.prefer) {
          // tercih sırasına göre gemide olan ilk kişi konuşur (yoksa kaptan)
          const who = a.prefer.find((id) => w.deck.actors.has(id)) || (a.any ? [...w.deck.actors.values()].find((x) => x.kind === 'crew')?.id : null) || a.fallback || 'CAPTAIN';
          if (!who || (a.only && !a.prefer.includes(who))) return 0;
          w.deck.say(who, a.text, a.dur || 2.4);
          return a.hold ?? 0.6;
        }
        if (a.actor) { w.deck.say(a.actor, a.text, a.dur || 2.4); return a.hold ?? 0.6; }
        const e = w.get(a.id);
        if (e) { e.say = a.text; e.sayT = a.dur || 3; e.sayDx = a.dx || 0; }
        return a.hold ?? 1.2;
      }
      case 'react': w.deck.react(a.kind, { side: a.side }); if (!instant && a.kind === 'danger' && w.ship.pets.includes('PET_TARCIN')) sfx('bark'); return 0;
      case 'speed': w.targetSpeed = a.v; if (instant) w.speed = a.v; return 0;
      case 'sails': w.sails = a.state; return 0;
      case 'flag': w.flagUp = a.up; w.flagColor = a.color || null; return 0;
      case 'camera': {
        const p = a.focus ? at(a.focus) : { x: 0, y: 0 };
        w.cam.tx = -p.x * (a.k ?? 0.35); w.cam.ty = -p.y * (a.k ?? 0.35); w.cam.tzoom = a.zoom ?? 1;
        if (instant) { w.cam.x = w.cam.tx; w.cam.y = w.cam.ty; w.cam.zoom = w.cam.tzoom; }
        return 0;
      }
      case 'shake': if (!instant) w.shake(a.amount || 4); return 0;
      case 'sound': sfx(a.name); return 0;
      case 'weather': {
        if (a.preset) w.ocean.preset = a.preset;
        if (a.fx) w.weatherFx = a.fx;
        if (a.fog != null) w.ocean.fog = a.fog;
        if (a.dark != null) w.ocean.dark = a.dark;
        if (a.night != null) w.ocean.night = a.night;
        if (a.restore) this.restoreWeather();
        return 0;
      }
      case 'particles': if (!instant) { const p = at(a.at); w.burst(p.x + (a.dx || 0), p.y + (a.dy || 0), a.kind, a.n || 14); } return 0;
      case 'fire': {
        if (instant) return 0;
        const n = a.n || 1;
        for (let i = 0; i < n; i++) {
          setTimeout(() => {
            const f0 = at(a.from);
            const t0 = at(a.to);
            const L = w.layout();
            const from = a.from === 'ship' ? { x: f0.x + Math.sign(t0.x - f0.x) * (L.beam / 2 - 4), y: f0.y + (i - n / 2) * 14 } : f0;
            const miss = a.hit === false || (a.hit === 'some' && i % 2 === 1);
            const to = { x: t0.x + (miss ? (Math.random() - 0.5) * 40 : (Math.random() - 0.5) * 14), y: t0.y + (miss ? -20 + Math.random() * 40 : (Math.random() - 0.5) * 30) };
            w.burst(from.x, from.y, 'smoke', 6);
            sfx('cannon');
            w.projectile(from, to, { dur: 0.7, arc: 18, onHit: () => {
              if (miss) { w.burst(to.x, to.y, 'splash', 16); sfx('splash'); }
              else { w.burst(to.x, to.y, 'fire', 12); w.burst(to.x, to.y, 'splinter', 10); sfx('impact'); if (a.to === 'ship') w.shake(5); else { const e = w.get(a.to); if (e && a.burn) e.fire = { dx: (Math.random() - 0.5) * 10, dy: (Math.random() - 0.5) * 20 }; } }
            } });
          }, i * 380);
        }
        return 0.7 + n * 0.38 + 0.3;
      }
      case 'impact': {
        if (instant) return 0;
        const p = at(a.target);
        w.burst(p.x + (Math.random() - 0.5) * 20, p.y + (Math.random() - 0.5) * 40, 'splinter', 16);
        w.burst(p.x, p.y, 'fire', 8);
        w.shake(a.amount || 6);
        sfx('damage');
        return 0.5;
      }
      case 'displayHull': if (this.display) this.display.hull = this.after_.hull; this.hooks.onDisplay?.(); return 0;
      case 'displayGold': if (this.display) this.display.gold = this.after_.gold; this.hooks.onDisplay?.(); return 0;
      case 'float': if (!instant) { const p = at(a.at); w.floatText(p.x, p.y - 10, a.text, a.color); } return 0;
      case 'coins': if (!instant) { w.coins(at(a.from), at(a.to), a.n || 10); sfx('coin'); } return instant ? 0 : 1.1;
      case 'chest': {
        if (instant) return 0;
        const f = at(a.from), t = at(a.to);
        w.projectile(f, t, { dur: 1.1, arc: 22, kind: 'chest', onHit: () => { w.burst(t.x, t.y, 'gold', 10); sfx('coin'); } });
        return 1.3;
      }
      case 'icon': if (!instant) { w.iconFly(a.icon, at(a.from), at(a.to)); sfx('coin'); } return instant ? 0 : 1.1;
      case 'cargoOverboard': {
        // görüntülenen kargodan n sandık denize uçar
        const list = w.cargoOverride || [];
        const lost = a.goods || [];
        let delay = 0;
        for (const g of lost) {
          const ix = list.findIndex((u) => u && u.good === g);
          if (ix < 0) continue;
          const L = w.layout();
          const from = w.shipToWorld(L.cargoSlots[ix % L.cargoSlots.length].x, L.cargoSlots[ix % L.cargoSlots.length].y);
          const side = a.side || (Math.random() < 0.5 ? -1 : 1);
          const tgt = a.to ? at(a.to) : null;
          const to = tgt ? { x: tgt.x + (Math.random() - 0.5) * 10, y: tgt.y + (Math.random() - 0.5) * 10 } : { x: from.x + side * (L.beam / 2 + 20 + Math.random() * 20), y: from.y + 10 + Math.random() * 20 };
          const u = list[ix];
          if (instant) { list[ix] = null; continue; }
          setTimeout(() => { list[ix] = null; w.projectile(from, to, { dur: a.dur || 0.8, arc: a.arc ?? 14, kind: 'crate', onHit: () => { if (a.use) { w.burst(to.x, to.y, a.use === true ? 'spark' : a.use, 6); sfx('pickup'); } else if (tgt) { sfx('pickup'); } else { w.burst(to.x, to.y, 'splash', 12); sfx('splash'); } } }); w.fx[w.fx.length - 1].good = u.good; }, delay * 1000);
          delay += 0.25;
        }
        return instant ? 0 : delay + 0.9;
      }
      case 'boardSteal': return this.boardSteal(a, instant);
      case 'cargoUse': {
        const L = w.layout();
        const st = L.stations.find((q) => q.type === (a.at || 'galley')) || { x: L.cx, y: L.center.y };
        return this.exec({ type: 'cargoOverboard', goods: a.goods, to: w.shipToWorld(st.x, st.y), use: true, arc: 8, dur: 0.7 }, instant);
      }
      case 'pickup': {
        // tayfa halat atar, yüzen nesne gemiye çekilir
        const e = w.get(a.id);
        if (!e || instant) { if (e && a.remove !== false) w.remove(a.id); return 0; }
        const L = w.layout();
        const side = Math.sign(e.x - w.ship.x) || 1;
        const rail = w.ship.x + side * (L.beam / 2 - 4);
        const sx = side < 0 ? 'railL' : 'railR';
        const st = L.stations.find((s) => s.type === sx);
        w.deck.sendWorker(a.prefer || [], st ? st.x : L.cx, st ? st.y : L.center.y, a.task || 'Halatla çekiyor', 3.5);
        w.projectile({ x: rail, y: e.y }, { x: e.x, y: e.y }, { dur: 0.6, arc: 10, kind: 'rope' });
        setTimeout(() => {
          e.tween = { from: { x: e.x, y: e.y }, to: { x: rail + side * 4, y: w.ship.y + 10 }, t: 0, dur: 1.4, ease: 'out', done: () => { w.burst(rail, w.ship.y + 10, 'splash', 10); if (a.remove !== false) w.remove(a.id); } };
          e.drift = false;
        }, 700);
        return 2.4;
      }
      case 'crewWork': {
        if (instant) return 0;
        const L = w.layout();
        let p = a.at;
        if (typeof p === 'string') { const st = L.stations.find((s) => s.type === p); p = st || { x: L.cx, y: L.center.y }; }
        w.deck.sendWorker(a.prefer || [], p.x, p.y, a.task || 'Çalışıyor', a.dur || 3);
        return a.hold ?? 0;
      }
      case 'deckFire': {
        const L = w.layout();
        const p = { x: L.cx + (a.dx || 8), y: L.center.y + (a.dy || 10) };
        if (a.on) w.spawn({ id: 'deckfire', kind: 'fire', x: 0, y: 0, drift: false, layer: 2, persistOnShip: true, local: p, opts: { n: 16, w: 16, h: 12 } });
        else w.remove('deckfire');
        return 0;
      }
      case 'syncDisplay': w.cargoOverride = null; this.display = null; this.hooks.onDisplay?.(); return 0;
      case 'call': if (!instant) a.fn?.(this); return a.dur || 0;
      // ───── sahne kiti ilkelleri ─────
      case 'board': return this.board(a, instant);
      case 'unboard': return this.unboard(a, instant);
      case 'npcState': { const t = w.deck.temp.find((x) => x.id === a.id); if (t) { if (a.state) t.state = a.state; if (a.dir) t.dir = a.dir; if (a.carry !== undefined) { t.carry = a.carry ? 'crate' : null; t.crateGood = a.carry; } } return 0; }
      case 'gather': return this.gather(a, instant);
      case 'pet': return this.petAct(a, instant);
      case 'flash': if (!instant) { w.ocean.flash = 1; w.ocean.onThunder?.(); } return 0;
      case 'shipTo': if (a.x != null) w.shipTargetX = a.x; if (a.y != null) w.shipTargetY = a.y; if (instant) { if (a.x != null) w.ship.x = a.x; if (a.y != null) w.ship.y = a.y; } return 0;
      case 'heel': w.extraRot = a.rot || 0; return 0;
      case 'deckProp': {
        const L = w.layout();
        let p = a.at;
        if (typeof p === 'string') { const st = L.stations.find((q) => q.type === p); p = st ? { x: st.x, y: st.y } : { x: L.cx, y: L.center.y }; }
        else if (!p) p = { x: L.cx, y: L.center.y };
        w.remove(a.id);
        w.spawn({ id: a.id, kind: a.kind, x: 0, y: 0, drift: false, layer: a.layer ?? 2, local: { x: p.x + (a.dx || 0), y: p.y + (a.dy || 0) }, encounter: true, opts: a.opts || {}, alpha: a.alpha ?? 1 });
        const e = w.get(a.id); const q = w.shipToWorld(e.local.x, e.local.y); e.x = q.x; e.y = q.y;
        return 0;
      }
      case 'throw': {
        if (instant) return 0;
        const f = at(a.from), t = at(a.to);
        w.projectile({ x: f.x + (a.fdx || 0), y: f.y + (a.fdy || 0) }, { x: t.x + (a.dx || 0), y: t.y + (a.dy || 0) }, { dur: a.dur || 0.8, arc: a.arc ?? 16, kind: a.kind || 'ball', onHit: () => { if (a.burst) w.burst(t.x + (a.dx || 0), t.y + (a.dy || 0), a.burst, a.n || 12); if (a.sfx) sfx(a.sfx); } });
        if (a.kind === 'crate' && a.good) w.fx[w.fx.length - 1].good = a.good;
        return a.wait === false ? 0 : (a.dur || 0.8) + 0.1;
      }
      case 'opts': { const e = w.get(a.id); if (e) e.opts = { ...(e.opts || {}), ...a.opts }; return 0; }
      case 'set': { const e = w.get(a.id); if (e) Object.assign(e, a.props); return 0; }
      default: return 0;
    }
  }

  /** Yabancı biri gemimize çıkar: küpeşteden (railL/railR/bow/stern) hedef noktaya yürür */
  board(a, instant) {
    const w = this.world;
    const L = w.layout();
    const st = (type) => L.stations.find((q) => q.type === type);
    const fromSt = typeof a.from === 'string' ? st(a.from) : a.from;
    const start = fromSt ? { x: fromSt.x, y: fromSt.y + (a.fdy || 0) } : { x: L.cx, y: L.center.y };
    let tgt = typeof a.to === 'string' ? st(a.to) : a.to;
    tgt = tgt ? { x: tgt.x + (a.dx || 0), y: tgt.y + (a.dy || 0) } : { x: L.cx, y: L.center.y };
    tgt = w.deck.nearestWalk(tgt.x, tgt.y) || tgt;
    w.deck.temp = w.deck.temp.filter((q) => q.id !== a.id);
    const t = { id: a.id, kind: 'npc', npc: a.npc || 'sailor', x: start.x, y: start.y, dir: 'down', ft: 0, t: 99, busy: true, state: 'idle', endState: a.endState, faceDir: a.face };
    if (a.carry) { t.carry = 'crate'; t.crateGood = a.carry; }
    w.deck.temp.push(t);
    if (instant) { t.x = tgt.x; t.y = tgt.y; t.state = a.endState || 'idle'; if (a.face) t.dir = a.face; return 0; }
    this.hooks.sfx?.(a.sfx || 'creak');
    w.deck.goto(t, tgt.x, tgt.y, 'walk');
    if (a.say) setTimeout(() => w.deck.say(a.id, a.say, a.sayDur || 2.6), Math.max(0, (a.sayAt ?? 0.4) * 1000));
    const d = Math.hypot(tgt.x - start.x, tgt.y - start.y) / 20;
    return a.wait === false ? 0 : Math.min(5, d + 0.3);
  }

  /** Gemideki yabancı küpeşteye yürüyüp ayrılır */
  unboard(a, instant) {
    const w = this.world;
    const t = w.deck.temp.find((q) => q.id === a.id);
    if (!t) return 0;
    if (instant) { w.deck.temp = w.deck.temp.filter((q) => q !== t); return 0; }
    const L = w.layout();
    const s0 = L.stations.find((q) => q.type === (a.to || 'railR')) || L.stations[0];
    t.busy = true;
    t.onArrive = () => { setTimeout(() => { w.deck.temp = w.deck.temp.filter((q) => q !== t); }, 150); };
    w.deck.goto(t, s0.x, s0.y, 'walk');
    if (t.carry === null || a.carry) { if (a.carry) { t.carry = 'crate'; t.crateGood = a.carry; } }
    const d = Math.hypot(s0.x - t.x, s0.y - t.y) / 20;
    return a.wait === false ? 0 : Math.min(5, d + 0.3);
  }

  /** Birkaç tayfayı bir noktanın çevresine toplar */
  gather(a, instant) {
    if (instant) return 0;
    const w = this.world;
    const L = w.layout();
    let p = a.at;
    if (typeof p === 'string') { const q = L.stations.find((x) => x.type === p); p = q || { x: L.cx, y: L.center.y }; }
    p = p || { x: L.cx, y: L.center.y };
    const pref = (a.prefer || []).map((id) => w.deck.actors.get(id)).filter(Boolean);
    const rest = [...w.deck.actors.values()].filter((q) => (q.kind === 'crew' || (a.captain && q.kind === 'captain')) && !pref.includes(q));
    const list = [...pref, ...rest].slice(0, a.n || 3);
    list.forEach((act, i) => {
      const ang = (i / Math.max(1, list.length)) * Math.PI * 2 + 0.6;
      const r = a.r || 10;
      const tgt = w.deck.nearestWalk(p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r * 0.8);
      act.busy = true;
      act.task = a.task || 'Toplandı';
      act.workDur = a.dur || 4;
      w.deck.goto(act, tgt.x, tgt.y, a.run ? 'run' : 'walk', a.state === 'react' ? 'reactFace' : 'workHere');
      act.faceSide = Math.sign(p.x - tgt.x) || 1;
    });
    return a.hold ?? 0;
  }

  /** Hayvan aksiyonu: bir noktaya koşar ve poz verir (havla, sallan, otur...) */
  petAct(a, instant) {
    if (instant) return 0;
    const w = this.world;
    const act = w.deck.actors.get(a.id);
    if (!act) return 0;
    const L = w.layout();
    let p = a.at;
    if (typeof p === 'string') { const q = L.stations.find((x) => x.type === p); p = q || { x: L.cx, y: L.center.y }; }
    if (act.kind === 'parrot') {
      // papağan: hedefe en yakın tüneğe ya da doğrudan noktaya uçar
      const tgt = p ? { x: p.x + (a.dx || 0), y: p.y + (a.dy || 0) } : null;
      w.deck.flyTo(act, tgt || null);
      act.busy = true;
      setTimeout(() => { act.busy = false; act.t = a.dur || 5; if (a.say) w.deck.say(act.id, a.say, 2.2); if (a.sfx) this.hooks.sfx?.(a.sfx); if (a.fluff) act.fluff = a.fluff; }, (act.flyDur || 1) * 1000);
      return a.hold ?? 0;
    }
    act.busy = true;
    act.task = a.task || act.task;
    const done = (x) => { x.state = a.pose || 'sit'; x.t = a.dur || 4; x.busy = false; if (a.pose === 'climb') x.z = 1; if (a.dir) x.dir = a.dir; if (a.say) w.deck.say(x.id, a.say, 2.2); if (a.sfx) this.hooks.sfx?.(a.sfx); };
    if (p) {
      const tgt = w.deck.nearestWalk(p.x + (a.dx || 0), p.y + (a.dy || 0));
      act.onArrive = done;
      w.deck.goto(act, tgt.x, tgt.y, a.run === false ? 'walk' : 'run');
    } else done(act);
    return a.hold ?? 0;
  }

  boardSteal(a, instant) {
    const w = this.world;
    const e = w.get(a.id);
    const goods = a.goods || [];
    if (!e) return 0;
    e.loot = e.loot || [];
    if (instant) { e.loot.push(...goods); return 0; }
    const L = w.layout();
    const list = w.cargoOverride || [];
    e.walkers = e.walkers || [];
    const side = Math.sign(e.x - w.ship.x) || 1;
    const railOur = w.ship.x + side * (L.beam / 2 - 6);
    const railTheirs = e.x - side * 18;
    // kancalar
    e.hooks = [0, 1, 2].map((i) => ({ x0: railTheirs, y0: e.y - 30 + i * 30, x1: railOur, y1: w.ship.y - 30 + i * 30, plank: a.plank }));
    this.hooks.sfx?.(a.plank ? 'creak' : 'hook');
    let n = 0;
    goods.forEach((g, k) => {
      const ix = list.findIndex((u, j) => u && u.good === g && !u.claimed);
      if (ix < 0) return;
      list[ix].claimed = true;
      const sl = L.cargoSlots[ix % L.cargoSlots.length];
      const tgt = w.shipToWorld(sl.x, sl.y);
      const startY = e.y - 20 + (k % 3) * 20;
      const walker = { npc: a.npc || 'pirate', x: railTheirs, y: startY, speed: 26, ft: 0 };
      walker.path = [{ x: railOur, y: startY }, { x: tgt.x + 6, y: tgt.y }];
      walker.onDone = () => {
        list[ix] = null;
        walker.carry = g;
        this.hooks.sfx?.('pickup');
        walker.path = [{ x: railOur, y: startY }, { x: railTheirs, y: startY }, { x: e.x, y: startY }];
        walker.onDone = () => { walker.carry = null; e.loot.push(g); walker.dead = true; };
      };
      setTimeout(() => e.walkers.push(walker), k * 600);
      n++;
    });
    if (!n) return 1;
    return 1.5 + n * 0.6 + 5.5;
  }

  // ───────── Ana döngü ─────────
  update(dt) {
    const run = this.run;
    if (!run) return;
    if (this.steps.length || this.stepDur >= 0 || this.after) this.tickSteps(dt);
    const e0 = this.world.entities;
    for (const e of e0) { if (e.sayT) e.sayT -= dt; if (e.walkers) e.walkers = e.walkers.filter((x) => !x.dead); if (e.local) { const p = this.world.shipToWorld(e.local.x, e.local.y); e.x = p.x; e.y = p.y; } }
    if (run.phase !== 'voyage' || !run.voyage) return;
    if (this.phase === PH.SAIL) this.sail(dt);
  }

  sail(dt) {
    const v = this.run.voyage;
    const C = BALANCE.voyage;
    const w = this.world;
    const mul = this.ff;
    w.targetSpeed = SAIL_SPEED * (mul > 1 ? 2.2 : 1);
    v.elapsed = (v.elapsed || 0) + dt * mul;
    this.persistT += dt;
    if (this.persistT > 5) { this.persistT = 0; this.core.setVoyageElapsed(v.elapsed, true); }
    const remaining = v.queue.length - v.pos;
    if (remaining > 0 && v.elapsed > v.duration - C.minGap) v.duration = v.elapsed + C.minGap * (remaining + 1);
    if (this.nextAt == null) {
      if (remaining > 0) {
        const gap = Math.max(C.minGap, (v.duration - v.elapsed) / (remaining + 1));
        this.nextAt = Math.max(v.elapsed + gap * (0.85 + Math.random() * 0.3), v.pos === 0 ? C.firstEventMin : 0);
      } else this.nextAt = v.duration;
    }
    // kıyı ipuçları: son düzlükte
    const toEnd = v.duration - v.elapsed;
    if (remaining === 0 && toEnd < 30) {
      const hb = HARBOR_BY_ID[this.run.route[v.toIdx].harborId];
      if (!w.coast) { w.coast = { type: hb.final ? 'final' : hb.type, y: -60 }; this.hooks.onCoast?.(hb); }
      w.coast.y = -60 + (1 - toEnd / 30) * 90;
    }
    if (v.elapsed >= this.nextAt) {
      this.nextAt = null;
      if (remaining > 0) this.beginEncounter(v.queue[v.pos].id);
      else this.beginDocking();
    }
  }

  setFastForward(on) {
    this.ff = on ? BALANCE.voyage.fastForward : 1;
  }

  /** Yaklaşma: event henüz tetiklenmeden görsel kurulum */
  beginEncounter(peekId) {
    this.ff = 1;
    this.hooks.onFastOff?.();
    const ev = EVENT_BY_ID[peekId];
    this.eventId = peekId;
    this.scene = sceneFor(ev, this.sideFor(peekId));
    const c = this.ctx();
    this.setPhase(PH.APPROACH);
    this.hooks.sfx?.(ev.cat === 'danger' || ev.cat === 'disaster' ? 'danger' : 'event');
    this.runSteps([...this.scene.setup(c, false), ...this.scene.approach(c)], () => {
      const r = this.core.nextEvent();
      const cur = this.run.voyage?.current;
      if (!cur) { this.toSail(); return; }
      if (cur.id !== peekId) {
        // şanslı olay / geçersiz event değişimi: sahneyi yeniden kur
        this.world.clearEncounter();
        this.eventId = cur.id;
        this.scene = sceneFor(EVENT_BY_ID[cur.id], this.sideFor(cur.id));
        this.runSteps(this.scene.setup(this.ctx(), false), null);
        this.flushInstant();
      }
      void r;
      this.setPhase(PH.INTRO);
      this.runSteps(this.scene.intro(this.ctx()), () => {
        if (cur.result) this.playOutcome(cur.result, null, null);
        else this.setPhase(PH.DECISION);
      });
    });
  }

  host() {
    return this.core.host();
  }

  /** Oyuncu seçimi: durum bir kez değişir; sonra animasyon */
  choose(key) {
    if (this.phase !== PH.DECISION) return { ok: false };
    const run = this.run;
    const before = { units: units(run), gold: run.gold, hull: run.ship.hull, items: run.items.map((i) => i.id), crew: run.crew.slice(), pets: run.pets.slice() };
    const res = this.core.choose(key);
    if (!res.ok) return res;
    this.playOutcome(res.result, before, key);
    return res;
  }

  playOutcome(result, before, key) {
    const run = this.run;
    const w = this.world;
    const after = { units: units(run), gold: run.gold, hull: run.ship.hull, items: run.items.map((i) => i.id), crew: run.crew.slice(), pets: run.pets.slice() };
    this.after_ = after;
    if (!before) {
      // kayıttan dönüş veya otomatik çözüm: kısa sonuç gösterimi
      before = after;
    }
    w.cargoOverride = before.units.map((u) => ({ ...u }));
    this.display = { gold: before.gold, hull: before.hull };
    const diff = diffUnits(before.units, after.units);
    const info = {
      success: result.success, auto: !!result.auto, key, label: result.label, text: result.text || '',
      hullDelta: after.hull - before.hull, goldDelta: after.gold - before.gold,
      lost: diff.lost, gained: diff.gained,
      itemsGained: after.items.filter((x, i) => !before.items.includes(x) || after.items.filter((y) => y === x).length > before.items.filter((y) => y === x).length),
      itemsLost: before.items.filter((x) => !after.items.includes(x)),
      crewJoined: after.crew.filter((x) => !before.crew.includes(x)),
      crewLeft: before.crew.filter((x) => !after.crew.includes(x)),
      petsJoined: after.pets.filter((x) => !before.pets.includes(x)),
      lines: result.lines || [],
      sunk: run.ship.hull <= 0,
    };
    this.lastInfo = info;
    this.setPhase(PH.ACTION);
    const c = this.ctx();
    const steps = [...this.scene.action(c, info), { type: 'call', fn: (d) => d.setPhase(PH.OUTCOME) }, ...this.scene.outcome(c, info), { type: 'syncDisplay' }];
    this.runSteps(steps, () => {
      this.hooks.sfx?.(info.success ? 'success' : 'fail');
      if (this.phase !== PH.OUTCOME) this.setPhase(PH.OUTCOME);
    });
  }

  /** Oyuncu "Devam" dedi */
  continueAfter() {
    const run = this.run;
    if (run.phase === 'arrival') {
      this.world.clearEncounter();
      this.display = null;
      this.phase = PH.DOCKED;
      this.core.arrivalNext();
      return;
    }
    const r = this.core.continueEvent();
    if (!r.ok) return;
    if (this.core.run.ended) return;
    this.setPhase(PH.EXIT);
    const c = this.ctx();
    this.runSteps([...this.scene.exit(c, this.lastInfo || {}), { type: 'syncDisplay' }], () => this.toSail());
  }

  toSail() {
    const w = this.world;
    this.setPhase(PH.RESUME);
    w.deck.react('calm');
    w.flagUp = false;
    this.restoreWeather();
    this.runSteps([{ type: 'sails', state: 'full' }, { type: 'speed', v: SAIL_SPEED }, { type: 'camera' }, { type: 'wait', dur: 1.2 }], () => {
      w.entities = w.entities.filter((e) => e.persist || (e.y > 400 || e.y < -400 ? false : !e.encounter));
      this.setPhase(PH.SAIL);
    });
  }

  // ───────── Limana yanaşma ─────────
  beginDocking() {
    const run = this.run;
    const v = run.voyage;
    const w = this.world;
    const hb = HARBOR_BY_ID[run.route[v.toIdx].harborId];
    this.ff = 1;
    this.hooks.onFastOff?.();
    this.setPhase(PH.DOCKING);
    this.hooks.sfx?.('dock');
    const type = hb.final ? 'final' : hb.type;
    w.harbor = { type, offY: -420, seed: hashString(hb.id) };
    w.coast = null;
    const D = BALANCE.voyage.dockTime;
    this.runSteps([
      [{ type: 'speed', v: 12 }, { type: 'sails', state: 'furled' }, { type: 'call', fn: () => { w.dockTween = { t: 0, dur: D }; }, dur: 0 }],
      { type: 'call', fn: () => {}, dur: D },
      [{ type: 'speed', v: 0 }],
    ], () => {
      w.harbor.offY = 0;
      w.dockTween = null;
      this.core.nextEvent(); // rota sonu → varış (durum değişimi + kayıt)
      w.mode = 'harbor';
      this.setPhase(PH.DOCKED);
    });
  }

  tickDock(dt) {
    const w = this.world;
    if (!w.dockTween || !w.harbor) return;
    w.dockTween.t += dt;
    const f = Math.min(1, w.dockTween.t / w.dockTween.dur);
    const k = 1 - (1 - f) * (1 - f);
    w.harbor.offY = -420 * (1 - k);
    w.cam.tx = -(w.W || 640) * 0.2 * k;
  }
}

function diffUnits(a, b) {
  const count = (list) => list.reduce((m, u) => ((m[u.good] = (m[u.good] || 0) + 1), m), {});
  const ca = count(a), cb = count(b);
  const lost = [], gained = [];
  for (const g of Object.keys(ca)) for (let i = 0; i < ca[g] - (cb[g] || 0); i++) lost.push(g);
  for (const g of Object.keys(cb)) for (let i = 0; i < cb[g] - (ca[g] || 0); i++) gained.push(g);
  return { lost, gained };
}

export { SCENES, GOOD_BY_ID, ITEM_BY_ID, CREW_BY_ID, PET_BY_ID };
