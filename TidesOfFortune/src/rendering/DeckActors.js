// Güverte hayatı: tayfa ve hayvanlar yürür, durur, görev animasyonu oynar ve birbirleriyle etkileşir.
// GDD Bölüm 10: hayvan–tayfa etkileşimleri, Zıpır & Tarçın birlikte animasyonları, event tepkileri.
import { crewFrame, petFrame, FW, FH, PET_FW, PET_FH } from './Characters.js';
import { blit, px, rect } from './pixel.js';
import { CREW_BY_ID } from '../data/crew.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const MIN_GAP = 9;

export class Deck {
  constructor() {
    this.actors = new Map();
    this.geom = null;
    this.mood = 'calm';
    this.bubbles = [];
    this.props = []; // kemik, bisküvi gibi uçan nesneler
    this.script = null;
    this.scriptCooldown = rnd(5, 9);
    this.time = 0;
    this.sunDir = 1;
  }

  sync(crewIds, petIds, geom) {
    const changedGeom = this.geom !== geom;
    this.geom = geom;
    const want = new Set([...crewIds, ...petIds]);
    for (const id of [...this.actors.keys()]) if (!want.has(id)) this.actors.delete(id);
    if (this.script && [...this.script.ids].some((id) => !want.has(id))) this.endScript();
    let i = 0;
    const span = geom.deckX1 - geom.deckX0;
    const all = [...crewIds, ...petIds];
    for (const id of all) {
      const kind = id.startsWith('CREW_') ? 'crew' : id === 'PET_ZIPIR' ? 'cat' : id === 'PET_TARCIN' ? 'dog' : id === 'PET_CUCE' ? 'monkey' : 'parrot';
      if (!this.actors.has(id)) {
        const x = geom.deckX0 + ((i + 0.5) / all.length) * span;
        this.actors.set(id, { id, kind, x, y: 0, dir: Math.random() < 0.5 ? 1 : -1, state: kind === 'parrot' ? 'perch' : 'idle', t: rnd(0.5, 3), target: null, frame: 0, ft: 0, busy: false, perch: null, carry: null, yOff: 0 });
      } else if (changedGeom) {
        const a = this.actors.get(id);
        a.x = Math.max(geom.deckX0, Math.min(geom.deckX1, a.x));
        a.perch = null;
      }
      i++;
    }
    for (const a of this.actors.values()) {
      if (a.kind === 'parrot' && !a.perch) this.pickPerch(a);
      if (a.kind === 'crew') a.idleType = CREW_BY_ID[a.id]?.idle;
    }
  }

  setMood(m) {
    if (m === this.mood) return;
    this.mood = m;
    if (this.script && this.script.name !== 'reaction') this.endScript();
    const dog = this.actors.get('PET_TARCIN');
    const cat = this.actors.get('PET_ZIPIR');
    const mid = (this.geom.deckX0 + this.geom.deckX1) / 2;
    const groot = this.actors.get('CREW_GROOT');
    if (m === 'danger') {
      if (dog) { this.goto(dog, this.geom.deckX1 - 2, 'run'); dog.after = 'bark'; dog.busy = true; }
      if (cat) { this.goto(cat, mid, 'walk'); cat.after = 'sitStill'; cat.busy = true; }
      for (const a of this.actors.values()) if (a.kind === 'crew' && ['sharpen', 'bow', 'guard', 'twinblades', 'spear', 'polish'].includes(this.crewIdle(a))) { a.state = 'act'; a.t = 6; }
    } else if (m === 'disaster') {
      const tx = groot ? groot.x : mid;
      if (dog) { this.goto(dog, tx - 6, 'run'); dog.after = 'sleep'; dog.busy = true; }
      if (cat) { this.goto(cat, tx + 6, 'walk'); cat.after = 'sleep'; cat.busy = true; }
      const gy = this.actors.get('PET_GECEYARISI');
      if (gy) { gy.fluff = 6; }
    } else if (m === 'fortune') {
      if (dog) { dog.state = 'wag'; dog.t = 4; dog.busy = false; }
      if (cat) { cat.dir = this.sunDir; cat.state = 'sit'; cat.t = 5; cat.busy = false; }
    } else {
      for (const a of this.actors.values()) { a.busy = false; a.after = null; }
    }
  }

  crewIdle(a) {
    return a.idleType;
  }

  say(id, text, dur = 2.2) {
    const a = this.actors.get(id);
    if (!a) return;
    this.bubbles = this.bubbles.filter((b) => b.id !== id);
    this.bubbles.push({ id, text, t: dur });
  }

  pickPerch(a, exclude = null) {
    const perches = this.geom.perches.filter((p) => p !== exclude && ![...this.actors.values()].some((o) => o !== a && o.perch === p));
    a.perch = perches.length ? perches[Math.floor(Math.random() * perches.length)] : this.geom.perches[0];
    a.x = a.perch.x;
    a.y = a.perch.y;
  }

  freeSpot(a, lo = this.geom.deckX0, hi = this.geom.deckX1) {
    for (let k = 0; k < 8; k++) {
      const x = rnd(lo, hi);
      let ok = true;
      for (const o of this.actors.values()) {
        if (o === a || o.kind === 'parrot') continue;
        const ox = o.target ?? o.x;
        if (Math.abs(ox - x) < MIN_GAP) { ok = false; break; }
      }
      if (ok) return x;
    }
    return rnd(lo, hi);
  }

  goto(a, x, mode = 'walk') {
    a.target = Math.max(this.geom.deckX0, Math.min(this.geom.deckX1, x));
    a.state = mode;
    a.dir = a.target >= a.x ? 1 : -1;
  }

  speed(a) {
    switch (a.kind) {
      case 'cat': return 5;
      case 'dog': return a.state === 'run' ? 30 : 12;
      case 'monkey': return a.state === 'run' ? 34 : 16;
      case 'parrot': return 34;
      default: return a.state === 'run' ? 24 : 11;
    }
  }

  // ───────── Senaryolar (etkileşimler) ─────────

  available(id) {
    const a = this.actors.get(id);
    return a && !a.busy && a.state !== 'fly';
  }

  startScript() {
    const has = (id) => this.actors.has(id);
    const opts = [];
    if (has('PET_ZIPIR') && has('PET_TARCIN')) {
      opts.push('sunnyCorner', 'scentTrail', 'play');
      if (has('CREW_PITA')) opts.push('biscuitMoment');
      if (this.mood === 'night') opts.push('nightWatch', 'nightWatch');
    }
    if (has('PET_ZIPIR') && has('CREW_GROOT')) opts.push('zipirGroot');
    if (has('PET_TARCIN') && has('CREW_BJORN')) opts.push('fetch');
    if (has('PET_TARCIN') && has('CREW_PITA')) opts.push('tarcinPita');
    if (has('PET_CUCE') && has('CREW_HAMID')) opts.push('stealBeads');
    if (has('PET_CUCE') && has('CREW_REZA')) opts.push('shoulder');
    if (has('PET_KIRMIZI') && has('CREW_DIEGO')) opts.push('rum');
    if (has('PET_GECEYARISI') && has('CREW_MAGDA')) opts.push('corner');
    if (has('PET_CUCE') && !has('CREW_HAMID') && [...this.actors.values()].some((a) => a.kind === 'crew')) opts.push('stealRandom');
    if (!opts.length) return;
    const name = opts[Math.floor(Math.random() * opts.length)];
    this.runScript(name);
  }

  runScript(name) {
    const A = (id) => this.actors.get(id);
    const g = this.geom;
    const S = { name, ids: new Set(), step: 0, t: 0 };
    const use = (...ids) => ids.forEach((i) => { S.ids.add(i); const a = A(i); a.busy = true; a.after = null; });
    const cat = A('PET_ZIPIR'), dog = A('PET_TARCIN');
    switch (name) {
      case 'sunnyCorner': // Güneşli Köşe
        use('PET_ZIPIR', 'PET_TARCIN');
        this.goto(dog, g.deckX1 - 3, 'walk'); dog.after = 'sleep';
        S.tick = (s) => { if (s.t > 2.5 && cat.state !== 'walk' && cat.state !== 'sleep') { this.goto(cat, g.deckX1 - 9, 'walk'); cat.after = 'sleep'; } };
        S.dur = 22;
        break;
      case 'scentTrail': // Koku Takibi
        use('PET_ZIPIR', 'PET_TARCIN');
        dog.x = Math.min(dog.x, g.deckX0 + 10);
        this.goto(dog, g.deckX1 - 4, 'walk'); dog.sniff = true;
        S.tick = (s) => {
          if (s.step === 0 && s.t > 1) { cat.x = Math.max(cat.x, dog.x + 14); this.goto(cat, g.deckX0 + 2, 'walk'); s.step = 1; }
          if (s.step === 1 && Math.abs(cat.x - dog.x) < 9) { dog.state = 'wag'; dog.t = 3; dog.target = null; s.step = 2; }
        };
        S.dur = 14;
        break;
      case 'play': // Oyun
        use('PET_ZIPIR', 'PET_TARCIN');
        cat.state = 'sit'; cat.target = null; cat.t = 99;
        S.tick = (s) => {
          if (dog.state !== 'run' || dog.target == null) {
            s.lap = (s.lap || 0) + 1;
            if (s.lap === 4) { this.say('PET_ZIPIR', 'Miyav.', 1.5); dog.state = 'wag'; dog.t = 1.5; }
            else this.goto(dog, cat.x + (s.lap % 2 ? 14 : -14), 'run');
          }
        };
        S.dur = 11;
        break;
      case 'biscuitMoment': { // Bisküvi Anı
        use('PET_ZIPIR', 'PET_TARCIN', 'CREW_PITA');
        const pita = A('CREW_PITA');
        pita.state = 'act'; pita.t = 99;
        this.say('CREW_PITA', 'Bisküvi!', 1.8);
        this.goto(dog, pita.x + 7, 'run'); dog.after = 'eat';
        this.goto(cat, pita.x - 7, 'walk'); cat.after = 'sniff';
        S.dur = 12;
        break;
      }
      case 'nightWatch': // Gece Nöbeti
        use('PET_ZIPIR', 'PET_TARCIN');
        this.goto(dog, g.deckX1 - 1, 'walk'); dog.after = 'watch';
        this.goto(cat, g.deckX1 - 8, 'walk'); cat.after = 'watch';
        S.dur = 20;
        break;
      case 'zipirGroot': {
        use('PET_ZIPIR', 'CREW_GROOT');
        const gr = A('CREW_GROOT');
        gr.state = 'sit'; gr.target = null; gr.t = 99;
        this.goto(cat, gr.x + 7, 'walk'); cat.after = 'sleep';
        S.tick = (s) => { if (cat.state === 'sleep') { gr.dir = 1; gr.state = s.t % 3 < 1.5 ? 'sit' : 'act'; } };
        S.dur = 18;
        break;
      }
      case 'fetch': { // Bjorn kemik atar, Tarçın getirir
        use('PET_TARCIN', 'CREW_BJORN');
        const bj = A('CREW_BJORN');
        bj.state = 'idle'; bj.target = null; bj.t = 99;
        const tx = bj.x > (g.deckX0 + g.deckX1) / 2 ? rnd(g.deckX0, bj.x - 20) : rnd(bj.x + 20, g.deckX1);
        this.say('CREW_BJORN', 'Getir!', 1.6);
        this.props.push({ kind: 'bone', x: bj.x, y: -10, x0: bj.x, x1: tx, t: 0, dur: 1.1, onLand: () => { this.goto(dog, tx, 'run'); dog.after = 'pickBone'; } });
        dog.state = 'wag'; dog.t = 99;
        S.bjorn = bj;
        S.dur = 14;
        break;
      }
      case 'tarcinPita': {
        use('PET_TARCIN', 'CREW_PITA');
        const p = A('CREW_PITA');
        p.state = 'act'; p.t = 99;
        this.goto(dog, p.x + 7, 'walk'); dog.after = 'beg';
        S.dur = 9;
        break;
      }
      case 'stealBeads':
      case 'stealRandom': {
        const victimId = name === 'stealBeads' ? 'CREW_HAMID' : [...this.actors.values()].find((a) => a.kind === 'crew')?.id;
        if (!victimId) return;
        use('PET_CUCE', victimId);
        const v = A(victimId);
        v.state = name === 'stealBeads' ? 'act' : 'idle'; v.t = 99;
        const m = A('PET_CUCE');
        this.goto(m, v.x + 6, 'walk'); m.after = 'grab';
        S.victim = v;
        S.dur = 12;
        break;
      }
      case 'shoulder': {
        use('PET_CUCE', 'CREW_REZA');
        const r = A('CREW_REZA');
        r.state = 'idle'; r.target = null; r.t = 99;
        const m = A('PET_CUCE');
        this.goto(m, r.x, 'walk'); m.after = 'shoulder';
        S.reza = r;
        S.dur = 12;
        break;
      }
      case 'rum': {
        use('PET_KIRMIZI', 'CREW_DIEGO');
        const d = A('CREW_DIEGO');
        d.state = 'idle'; d.target = null; d.t = 99;
        const p = A('PET_KIRMIZI');
        this.flyTo(p, { x: d.x + 2, y: g.deckY - 15, kind: 'shoulder', follow: d });
        S.dur = 9;
        S.tick = (s) => { if (p.state === 'perch' && !s.said) { s.said = true; this.say('PET_KIRMIZI', 'Rum iç! Rum iç!', 2.5); } };
        break;
      }
      case 'corner': {
        use('PET_GECEYARISI', 'CREW_MAGDA');
        const mg = A('CREW_MAGDA');
        this.goto(mg, g.deckX0 + 2, 'walk'); mg.after = 'sitCorner';
        const p = A('PET_GECEYARISI');
        this.flyTo(p, { x: g.deckX0 - 2, y: g.deckY - 2, kind: 'rail' });
        S.dur = 16;
        break;
      }
    }
    this.script = S;
  }

  endScript() {
    if (!this.script) return;
    for (const id of this.script.ids) {
      const a = this.actors.get(id);
      if (!a) continue;
      a.busy = false; a.after = null; a.sniff = false; a.carry = null; a.yOff = 0; a.ride = null;
      if (a.kind === 'parrot') { if (a.perch?.follow) this.flyTo(a, null); }
      else if (a.state !== 'walk' && a.state !== 'run') { a.state = 'idle'; a.t = rnd(0.5, 2); }
    }
    this.script = null;
    this.scriptCooldown = rnd(8, 16);
  }

  flyTo(a, perch) {
    a.from = { x: a.x, y: a.y };
    if (!perch) {
      const opts = this.geom.perches.filter((p) => p !== a.perch);
      perch = opts[Math.floor(Math.random() * opts.length)] || this.geom.perches[0];
    }
    a.perch = perch;
    a.state = 'fly';
    a.flyT = 0;
    a.flyDur = Math.max(0.6, Math.hypot(perch.x - a.x, perch.y - a.y) / this.speed(a));
    a.dir = perch.x >= a.x ? 1 : -1;
  }

  // ───────── Güncelleme ─────────

  update(dt) {
    if (!this.geom) return;
    this.time += dt;
    for (const b of this.bubbles) b.t -= dt;
    this.bubbles = this.bubbles.filter((b) => b.t > 0);
    for (const p of this.props) {
      p.t += dt;
      const f = Math.min(1, p.t / p.dur);
      p.x = p.x0 + (p.x1 - p.x0) * f;
      p.y = -Math.sin(f * Math.PI) * 14;
      if (f >= 1 && !p.landed) { p.landed = true; p.onLand?.(); }
    }
    this.props = this.props.filter((p) => !p.taken);
    if (this.script) {
      this.script.t += dt;
      this.script.tick?.(this.script);
      if (this.script.t > this.script.dur) this.endScript();
    } else if (this.mood === 'calm' || this.mood === 'night' || this.mood === 'fortune') {
      this.scriptCooldown -= dt;
      if (this.scriptCooldown <= 0) {
        this.scriptCooldown = rnd(10, 18);
        this.startScript();
      }
    }
    for (const a of this.actors.values()) this.updateActor(a, dt);
  }

  updateActor(a, dt) {
    a.ft += dt;
    const g = this.geom;
    if (a.kind === 'parrot') return this.updateParrot(a, dt);
    if (a.ride) {
      a.x = a.ride.x;
      a.dir = a.ride.dir;
      return;
    }
    if ((a.state === 'walk' || a.state === 'run') && a.target != null) {
      const sp = this.speed(a) * (a.sniff ? 0.45 : 1);
      const d = a.target - a.x;
      a.dir = d >= 0 ? 1 : -1;
      // Çarpışmadan kaçın (yalnızca serbest yürüyüşte)
      if (!a.busy && a.kind === 'crew') {
        for (const o of this.actors.values()) {
          if (o === a || o.kind === 'parrot') continue;
          const ahead = (o.x - a.x) * a.dir;
          if (ahead > 0 && ahead < 7 && (o.state !== 'walk' || o.dir !== a.dir)) {
            a.target = null;
            a.state = 'idle';
            a.t = rnd(0.8, 2);
            a.dir *= -1;
            return;
          }
        }
      }
      if (Math.abs(d) <= sp * dt) {
        a.x = a.target;
        a.target = null;
        this.arrive(a);
      } else a.x += Math.sign(d) * sp * dt;
      a.x = Math.max(g.deckX0, Math.min(g.deckX1, a.x));
      return;
    }
    a.t -= dt;
    if (a.t > 0) return;
    if (a.busy) {
      if (a.state === 'wag' && a.kind === 'dog') { a.state = 'sit'; a.t = 2; }
      return;
    }
    // Serbest davranış
    this.nextFree(a);
  }

  arrive(a) {
    const after = a.after;
    a.after = null;
    switch (after) {
      case 'bark': a.state = 'bark'; a.t = 99; a.dir = 1; this.say(a.id, 'Hav! Hav!', 2.5); return;
      case 'sitStill': a.state = 'sit'; a.t = 99; return;
      case 'sleep': a.state = 'sleep'; a.t = 99; return;
      case 'watch': a.state = 'sit'; a.dir = 1; a.t = 99; return;
      case 'eat': a.state = 'wag'; a.t = 99; this.say(a.id, 'Hav!', 1.4); return;
      case 'sniff': a.state = 'sit'; a.t = 99; a.dir = 1; return;
      case 'beg': a.state = 'beg'; a.t = 99; a.dir = -1; return;
      case 'pickBone': {
        const bone = this.props.find((p) => p.kind === 'bone');
        if (bone) bone.taken = true;
        a.carry = 'bone';
        const bj = this.actors.get('CREW_BJORN');
        this.goto(a, bj ? bj.x + 6 : a.x, 'run');
        a.after = 'returnBone';
        return;
      }
      case 'returnBone': a.carry = null; a.state = 'wag'; a.t = 99; a.dir = -1; this.say('CREW_BJORN', 'Aferin!', 1.6); return;
      case 'grab': {
        const s = this.script;
        a.carry = 'beads';
        a.state = 'hold';
        if (s?.victim) this.say(s.victim.id, s.victim.id === 'CREW_HAMID' ? 'Tespihim!' : 'Hey!', 2);
        const far = a.x > (this.geom.deckX0 + this.geom.deckX1) / 2 ? this.geom.deckX0 : this.geom.deckX1;
        setTimeout(() => { if (this.actors.get(a.id) === a) { this.goto(a, far, 'run'); a.after = 'hide'; } }, 400);
        return;
      }
      case 'hide': a.state = 'hold'; a.t = 99; return;
      case 'shoulder': {
        const r = this.script?.reza;
        if (r) { a.ride = r; a.yOff = -11; r.dir = -1; a.state = 'sit'; }
        return;
      }
      case 'sitCorner': a.state = 'sit'; a.dir = 1; a.t = 99; return;
      default:
        a.state = a.kind === 'crew' ? (Math.random() < 0.6 ? 'act' : 'idle') : 'sit';
        a.t = a.kind === 'crew' ? rnd(2.5, 6) : rnd(2, 5);
    }
  }

  nextFree(a) {
    const g = this.geom;
    if (a.kind === 'crew') {
      if (Math.random() < 0.45) this.goto(a, this.freeSpot(a), 'walk');
      else { a.state = Math.random() < 0.65 ? 'act' : 'idle'; a.t = rnd(2.5, 6); if (Math.random() < 0.3) a.dir *= -1; }
    } else if (a.kind === 'cat') {
      const r = Math.random();
      if (r < 0.35) this.goto(a, this.freeSpot(a), 'walk');
      else if (r < 0.7) { a.state = 'sit'; a.t = rnd(4, 9); }
      else { a.state = 'sleep'; a.t = rnd(8, 15); }
    } else if (a.kind === 'dog') {
      const r = Math.random();
      if (r < 0.55) { this.goto(a, rnd(g.deckX0, g.deckX1), Math.random() < 0.6 ? 'run' : 'walk'); }
      else if (r < 0.85) { a.state = Math.random() < 0.5 ? 'wag' : 'sit'; a.t = rnd(1, 3); }
      else { a.state = 'sleep'; a.t = rnd(2, 4); }
    } else if (a.kind === 'monkey') {
      const r = Math.random();
      if (r < 0.5) this.goto(a, rnd(g.deckX0, g.deckX1), Math.random() < 0.4 ? 'run' : 'walk');
      else { a.state = 'sit'; a.t = rnd(2, 5); }
    }
  }

  updateParrot(a, dt) {
    if (a.state === 'fly') {
      a.flyT += dt;
      const f = Math.min(1, a.flyT / a.flyDur);
      const tx = a.perch.follow ? a.perch.follow.x + 2 : a.perch.x;
      a.x = a.from.x + (tx - a.from.x) * f;
      a.y = a.from.y + (a.perch.y - a.from.y) * f - Math.sin(f * Math.PI) * 10;
      if (f >= 1) { a.state = 'perch'; a.t = rnd(4, 10); }
      return;
    }
    if (a.perch?.follow) { a.x = a.perch.follow.x + 2; a.y = a.perch.y; }
    if (a.fluff) { a.fluff -= dt; if (a.fluff < 0) a.fluff = 0; }
    a.t -= dt;
    if (a.t <= 0 && !a.busy) this.flyTo(a, null);
  }

  // ───────── Çizim ─────────

  draw(ctx, sx, sy) {
    if (!this.geom) return;
    const g = this.geom;
    const order = [...this.actors.values()].sort((p, q) => (p.kind === 'parrot') - (q.kind === 'parrot'));
    for (const a of order) {
      const fx = Math.floor(a.ft * (a.kind === 'cat' ? 2.5 : a.state === 'run' ? 10 : 6));
      if (a.kind === 'crew') {
        let state = a.state;
        let frame = 0;
        if (state === 'walk' || state === 'run') { state = 'walk'; frame = fx % 4; }
        else if (state === 'act') frame = Math.floor(a.ft * 3) % 4;
        else if (state === 'sit') frame = 0;
        else { state = 'idle'; frame = Math.floor(a.ft * 1.5) % 2; }
        const img = crewFrame(a.id, state, frame);
        blit(ctx, img, sx + a.x - FW / 2, sy + g.deckY - FH + 1, a.dir < 0);
      } else if (a.kind === 'parrot') {
        let pose = a.state === 'fly' ? (fx % 2 ? 'fly0' : 'fly1') : Math.floor(a.ft * 1.2) % 3 === 0 ? 'perch1' : 'perch0';
        if (a.fluff > 0 && a.state !== 'fly') pose = 'fluff';
        const img = petFrame(a.id, pose);
        blit(ctx, img, sx + a.x - PET_FW / 2, sy + a.y - PET_FH + 1, a.dir < 0);
      } else {
        let pose = 'sit';
        if (a.kind === 'cat') pose = a.state === 'walk' ? (fx % 2 ? 'walk1' : 'walk0') : a.state === 'sleep' ? 'sleep' : 'sit';
        if (a.kind === 'dog') {
          if (a.state === 'run') pose = fx % 2 ? 'run1' : 'run0';
          else if (a.state === 'walk') pose = fx % 2 ? 'walk1' : 'walk0';
          else if (a.state === 'wag') pose = Math.floor(a.ft * 8) % 2 ? 'wag1' : 'wag0';
          else if (a.state === 'bark') pose = Math.floor(a.ft * 4) % 2 ? 'bark' : 'sit';
          else if (a.state === 'sleep') pose = 'sleep';
          else if (a.state === 'beg') pose = Math.floor(a.ft * 4) % 2 ? 'beg' : 'wag1';
          else pose = 'sit';
        }
        if (a.kind === 'monkey') {
          if (a.state === 'walk' || a.state === 'run') pose = a.carry ? 'hold' : fx % 2 ? 'walk1' : 'walk0';
          else if (a.state === 'hold') pose = 'hold';
          else pose = 'sit';
        }
        const img = petFrame(a.id, pose);
        blit(ctx, img, sx + a.x - PET_FW / 2, sy + g.deckY - PET_FH + 1 + (a.yOff || 0), a.dir < 0);
        if (a.carry === 'bone') { rect(ctx, sx + a.x + (a.dir > 0 ? 5 : -8), sy + g.deckY - 6, 3, 1, '#f4ead5'); }
        if (a.kind === 'cat' && a.state === 'sleep' && Math.floor(this.time) % 3 === 0) px(ctx, sx + a.x + 3, sy + g.deckY - 8 - (this.time % 1) * 3, '#d8e0f0');
      }
    }
    for (const p of this.props) {
      if (p.taken) continue;
      rect(ctx, sx + p.x - 1, sy + g.deckY - 3 + p.y, 3, 1, '#f4ead5');
      px(ctx, sx + p.x - 2, sy + g.deckY - 4 + p.y, '#f4ead5');
      px(ctx, sx + p.x + 2, sy + g.deckY - 4 + p.y, '#f4ead5');
    }
  }

  /** DOM konuşma balonları için tampon koordinatları */
  bubblePositions(sx, sy) {
    return this.bubbles.map((b) => {
      const a = this.actors.get(b.id);
      if (!a) return null;
      const y = a.kind === 'parrot' ? sy + a.y - 12 : sy + this.geom.deckY - (a.kind === 'crew' ? FH + 2 : PET_FH + 2) + (a.yOff || 0);
      return { text: b.text, x: sx + a.x, y };
    }).filter(Boolean);
  }
}
