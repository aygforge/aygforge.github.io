// YAŞAYAN GÜVERTE: tayfa ve hayvanlar top-down gemi üzerinde gerçek koordinatlarla dolaşır.
// Davranış durumları: idle → walk (A* yol) → work (istasyon görevi) / social / react / special.
import { crewSprite, petSprite, npcSprite, CS } from './TopChars.js';
import { findPath, randomWalkable } from './TopShip.js';
import { CREW_BY_ID } from '../../data/crew.js';
import { PET_BY_ID } from '../../data/pets.js';
import { px } from '../pixel.js';
import { cargoSprite } from './Props.js';

const rnd = (a, b) => a + Math.random() * (b - a);

// Kişiliğe göre görev istasyonları (idle türü → tercih edilen istasyonlar ve görev adı)
const JOBS = {
  hammer: { st: ['railL', 'railR', 'mast', 'stern'], task: 'Gövdeyi kontrol edip küçük tamiratlar yapıyor' },
  sharpen: { st: ['cannon', 'railL', 'railR'], task: 'Baltasını ve silahlarını kontrol ediyor' },
  bag: { st: ['center', 'stern'], task: 'Sağlık çantasını düzenliyor' },
  stir: { st: ['galley'], task: 'Kazanda yemek hazırlıyor' },
  map: { st: ['helm', 'center'], task: 'Haritayı ve pusulayı kontrol ediyor' },
  spyglass: { st: ['bow', 'bowL', 'bowR'], task: 'Dürbünle ufku tarıyor' },
  lantern: { st: ['bow', 'bowL', 'bowR'], task: 'Feneriyle suları gözlüyor' },
  fish: { st: ['railL', 'railR'], task: 'Küpeşteden olta sallıyor' },
  bow: { st: ['railL', 'railR', 'bowL', 'bowR'], task: 'Yayını gerip nöbet tutuyor' },
  beads: { st: ['cargo', 'center'], task: 'Tespih çekip mal hesabı yapıyor' },
  count: { st: ['cargo'], task: 'Abaküsle fiyat hesaplıyor' },
  inspect: { st: ['cargo'], task: 'Kargonun kalitesini inceliyor' },
  sniff: { st: ['cargo', 'galley'], task: 'Baharat çuvallarını kokluyor' },
  fan: { st: ['cargo', 'center'], task: 'Yelpazesiyle ipekleri sayıyor' },
  lookback: { st: ['stern', 'railL', 'railR'], task: 'Gizlice arkayı kolluyor' },
  swagger: { st: ['bow', 'railL', 'railR'], task: 'Rom şişesiyle eski günleri anıyor' },
  guard: { st: ['helm', 'stern', 'center'], task: 'Nöbette, kılıcı elinde' },
  twinblades: { st: ['center', 'railL', 'railR'], task: 'Kılıç talimi yapıyor' },
  spear: { st: ['railL', 'railR', 'bow'], task: 'Mızrağıyla nöbet tutuyor' },
  windsense: { st: ['bow', 'mast'], task: 'Rüzgârı kokluyor' },
  wetfinger: { st: ['bow', 'mast'], task: 'Parmağını ıslatıp rüzgârı okuyor' },
  stretch: { st: ['railL', 'railR'], task: 'Dalış öncesi esneme yapıyor' },
  spell: { st: ['stern', 'bow'], task: 'Denize fısıldıyor, tılsım yapıyor' },
  pray: { st: ['center', 'stern'], task: 'Sessizce dua ediyor' },
  polish: { st: ['cannon', 'railL', 'railR'], task: 'Topları temizliyor' },
  whisper: { st: ['stern', 'railL'], task: 'Notlarına bir şeyler yazıyor' },
  staff: { st: ['bow', 'center'], task: 'Asasıyla atalarına dua ediyor' },
  curtsy: { st: ['stern', 'center'], task: 'Ufka dalgın dalgın bakıyor' },
  scroll: { st: ['helm', 'center'], task: 'Fermanları okuyor' },
  sunglow: { st: ['bow', 'center'], task: 'Güneşe dua ediyor' },
};

const PET_TASK = { sleep: 'Uyuyor', sit: 'Oturuyor', walk: 'Dolaşıyor', run: 'Koşturuyor', wag: 'Kuyruk sallıyor', bark: 'Havlıyor!', perch: 'Tünekte', fly: 'Uçuyor', beg: 'Bisküvi bekliyor', hold: 'Bir şey yürüttü!', climb: 'Direğe tırmandı', inspect: 'Kargoyu inceliyor' };

export class Deck2D {
  constructor() {
    this.actors = new Map();
    this.ship = null;
    this.mood = 'calm';
    this.bubbles = [];
    this.props = [];
    this.script = null;
    this.cooldown = rnd(6, 10);
    this.time = 0;
    this.reserved = new Map();
    this.temp = []; // geçici NPC'ler (korsanlar vb.)
  }

  sync(crewIds, petIds, ship, withCaptain = true) {
    const geomChanged = this.ship !== ship;
    this.ship = ship;
    const want = new Set([...crewIds, ...petIds]);
    if (withCaptain) want.add('CAPTAIN');
    for (const id of [...this.actors.keys()]) if (!want.has(id)) { this.actors.delete(id); this.reserved.forEach((v, k) => v === id && this.reserved.delete(k)); }
    if (this.script && [...this.script.ids].some((id) => !want.has(id))) this.endScript();
    for (const id of want) {
      let a = this.actors.get(id);
      if (!a) {
        const kind = id === 'CAPTAIN' ? 'captain' : id.startsWith('CREW_') ? 'crew' : id === 'PET_ZIPIR' ? 'cat' : id === 'PET_TARCIN' ? 'dog' : id === 'PET_CUCE' ? 'monkey' : 'parrot';
        const p = id === 'CAPTAIN' ? { ...(ship.stations.find((s) => s.type === 'helm') || ship.stations[0]) } : this.spawnAt ? { ...this.spawnAt } : randomWalkable(ship);
        if (id !== 'CAPTAIN' && this.spawnAt) { this.spawnAt = null; }
        a = { id, kind, x: p.x, y: p.y, dir: 'up', state: 'idle', t: rnd(0.5, 2.5), ft: Math.random() * 3, path: null, busy: false, task: 'idle', idle: kind === 'crew' ? CREW_BY_ID[id].idle : null, z: 0, perch: null, carry: null };
        if (kind === 'parrot') { a.perch = ship.perches[Math.floor(Math.random() * ship.perches.length)]; a.x = a.perch.x; a.y = a.perch.y; a.state = 'perch'; a.z = 1; }
        this.actors.set(id, a);
      } else if (geomChanged) {
        const p = a.kind === 'parrot' ? ship.perches[0] : randomWalkable(ship);
        a.x = p.x; a.y = p.y; a.path = null; a.perch = a.kind === 'parrot' ? p : null; a.state = a.kind === 'parrot' ? 'perch' : 'idle';
      }
    }
  }

  // ───────── Yardımcılar ─────────
  stationFor(a, types) {
    const st = this.ship.stations.filter((s) => types.includes(s.type) && (!this.reserved.has(s.x + ',' + s.y) || this.reserved.get(s.x + ',' + s.y) === a.id));
    if (!st.length) return null;
    return st[Math.floor(Math.random() * st.length)];
  }

  reserve(a, s) {
    for (const [k, v] of this.reserved) if (v === a.id) this.reserved.delete(k);
    if (s) this.reserved.set(s.x + ',' + s.y, a.id);
  }

  goto(a, x, y, mode = 'walk', after = null) {
    const path = findPath(this.ship, a.x, a.y, x, y);
    if (!path) { a.state = 'idle'; a.t = 0.5; return false; }
    a.path = path;
    a.state = mode;
    a.after = after;
    return true;
  }

  speed(a) {
    switch (a.kind) {
      case 'cat': return 7;
      case 'dog': return a.state === 'run' ? 46 : 18;
      case 'monkey': return a.state === 'run' ? 40 : 20;
      case 'npc': return a.state === 'run' ? 30 : 20;
      default: return a.state === 'run' ? 32 : 15;
    }
  }

  say(id, text, dur = 2.3) {
    const a = this.actors.get(id) || this.temp.find((t) => t.id === id);
    if (!a) return;
    this.bubbles = this.bubbles.filter((b) => b.id !== id);
    this.bubbles.push({ id, text, t: dur });
  }

  // ───────── Tepkiler (EncounterDirector çağırır) ─────────
  react(kind, opts = {}) {
    this.mood = kind;
    if (this.script) this.endScript();
    const side = opts.side || 1;
    for (const a of this.actors.values()) {
      if (a.kind === 'parrot') { if (kind === 'disaster' && a.id === 'PET_GECEYARISI') a.fluff = 8; continue; }
      a.busy = kind !== 'calm';
      a.after = null;
      if (kind === 'calm') { a.state = 'idle'; a.t = rnd(0.3, 1.5); a.busy = false; continue; }
      if (kind === 'danger' || kind === 'disaster') {
        if (a.kind === 'dog') { const s = this.ship.stations.find((x) => x.type === 'bow'); this.goto(a, s.x, s.y, 'run', 'bark'); continue; }
        if (a.kind === 'cat') { const s = kind === 'disaster' ? this.near('CREW_GROOT') || this.ship.stations.find((x) => x.type === 'center') : this.ship.stations.find((x) => x.type === 'center'); this.goto(a, s.x, s.y, 'walk', kind === 'disaster' ? 'sleep' : 'sitStill'); continue; }
        if (a.kind === 'monkey') { const s = this.ship.stations.find((x) => x.type === 'mast'); this.goto(a, s.x, s.y, 'run', 'climb'); continue; }
        const combat = a.kind === 'crew' && ['combat'].includes(CREW_BY_ID[a.id].cls);
        if (combat || a.kind === 'captain') {
          const s = this.stationFor(a, side < 0 ? ['railL', 'cannon'] : ['railR', 'cannon']) || this.stationFor(a, ['center']);
          if (s) { this.reserve(a, s); this.goto(a, s.x, s.y, 'run', 'reactFace'); a.faceSide = side; }
          a.task = 'Tehlikeye hazırlanıyor';
        } else { a.state = 'react'; a.t = 99; a.dir = side < 0 ? 'left' : 'right'; a.task = 'Gözlerini karşılaşmadan ayıramıyor'; }
      } else if (kind === 'fortune') {
        if (a.kind === 'dog') { a.state = 'wag'; a.t = 4; }
        else if (a.kind === 'cat') { a.state = 'sit'; a.dir = 'right'; a.t = 5; }
        else { a.state = 'react'; a.t = 2; a.dir = side < 0 ? 'left' : 'right'; }
        a.busy = false;
      }
    }
  }

  near(id) {
    const a = this.actors.get(id);
    if (!a) return null;
    return { x: a.x + 8, y: a.y };
  }

  /** Belirli bir tayfayı (veya en uygununu) bir noktaya iş yapmaya gönder */
  sendWorker(prefer, x, y, task, dur = 3) {
    let a = prefer.map((id) => this.actors.get(id)).find(Boolean);
    if (!a) a = [...this.actors.values()].filter((q) => q.kind === 'crew' || q.kind === 'captain').sort((p, q) => Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y))[0];
    if (!a) return null;
    a.busy = true;
    a.task = task;
    const tgt = this.nearestWalk(x, y);
    this.goto(a, tgt.x, tgt.y, 'run', 'workHere');
    a.workDur = dur;
    return a;
  }

  nearestWalk(x, y) {
    const { gw, gh, walk } = this.ship;
    let best = null, bd = 1e9;
    for (let i = 0; i < gw * gh; i++) {
      if (!walk[i]) continue;
      const cx = (i % gw) * 3 + 1.5, cy = Math.floor(i / gw) * 3 + 1.5;
      const d = Math.hypot(cx - x, cy - y);
      if (d < bd) { bd = d; best = { x: cx, y: cy }; }
    }
    return best;
  }

  release() {
    for (const a of this.actors.values()) { a.busy = false; if (a.state !== 'walk' && a.state !== 'run') { a.state = 'idle'; a.t = rnd(0.2, 1); } }
    this.mood = 'calm';
  }

  // ───────── Güncelleme ─────────
  update(dt) {
    if (!this.ship) return;
    this.time += dt;
    for (const b of this.bubbles) b.t -= dt;
    this.bubbles = this.bubbles.filter((b) => b.t > 0);
    for (const p of this.props) { p.t += dt; const f = Math.min(1, p.t / p.dur); p.x = p.x0 + (p.x1 - p.x0) * f; p.y = p.y0 + (p.y1 - p.y0) * f; p.z = Math.sin(f * Math.PI) * 10; if (f >= 1 && !p.landed) { p.landed = true; p.onLand?.(); } }
    this.props = this.props.filter((p) => !p.taken);
    if (this.script) {
      this.script.t += dt;
      this.script.tick?.(this.script);
      if (this.script.t > this.script.dur) this.endScript();
    } else if (this.mood === 'calm' || this.mood === 'night') {
      this.cooldown -= dt;
      if (this.cooldown <= 0) { this.cooldown = rnd(9, 16); this.startScript(); }
    }
    for (const a of this.actors.values()) this.updateActor(a, dt);
    for (const a of this.temp) this.updateActor(a, dt);
  }

  updateActor(a, dt) {
    a.ft += dt;
    if (a.kind === 'parrot') return this.updateParrot(a, dt);
    if (a.ride) { a.x = a.ride.x; a.y = a.ride.y + 1; a.dir = a.ride.dir; return; }
    if (a.path && a.path.length) {
      const n = a.path[0];
      const dx = n.x - a.x, dy = n.y - a.y;
      const d = Math.hypot(dx, dy);
      const sp = this.speed(a) * (a.sniff ? 0.5 : 1) * dt;
      if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left'; else if (d > 0.01) a.dir = dy > 0 ? 'down' : 'up';
      // basit çarpışma: önde duran biri varsa kısa bekle
      if (!a.busy && a.kind !== 'npc') {
        for (const o of this.actors.values()) {
          if (o === a || o.kind === 'parrot' || o.z) continue;
          if (Math.hypot(o.x - n.x, o.y - n.y) < 6 && !(o.path && o.path.length)) { a.wait = (a.wait || 0) + dt; if (a.wait < 0.6) return; if (a.wait > 1.2) { a.path = null; a.wait = 0; a.state = 'idle'; a.t = 0.3; return; } }
        }
      }
      a.wait = 0;
      if (d <= sp) { a.x = n.x; a.y = n.y; a.path.shift(); } else { a.x += (dx / d) * sp; a.y += (dy / d) * sp; }
      if (!a.path.length) { a.path = null; this.arrive(a); }
      return;
    }
    a.t -= dt;
    if (a.t > 0 || a.busy) {
      if (a.busy && a.state === 'workHere' && a.t <= 0) { a.state = 'idle'; a.busy = false; }
      return;
    }
    this.nextFree(a);
  }

  arrive(a) {
    const after = a.after;
    a.after = null;
    if (a.onArrive) { const f = a.onArrive; a.onArrive = null; f(a); return; }
    switch (after) {
      case 'bark': a.state = 'bark'; a.dir = 'up'; a.t = 99; this.say(a.id, 'Hav! Hav!', 2.5); this.onBark?.(); return;
      case 'sitStill': a.state = 'sit'; a.t = 99; return;
      case 'sleep': a.state = 'sleep'; a.t = 99; return;
      case 'climb': a.state = 'climb'; a.z = 1; a.t = 99; return;
      case 'reactFace': a.state = 'react'; a.dir = a.faceSide < 0 ? 'left' : 'right'; a.t = 99; return;
      case 'workHere': a.state = 'work'; a.t = a.workDur || 3; a.busy = true; a.stateAfterWork = true; setTimeout(() => { if (a.state === 'work') { a.busy = false; a.state = 'idle'; a.t = 0.5; } }, (a.workDur || 3) * 1000); return;
      case 'watch': a.state = 'sit'; a.dir = 'up'; a.t = 99; return;
      case 'beg': a.state = 'beg'; a.t = 99; return;
      case 'eat': a.state = 'wag'; a.t = 99; this.say(a.id, 'Hav!', 1.4); return;
      case 'sniff': a.state = 'sit'; a.t = 99; return;
      case 'grab': {
        a.carry = 'beads'; a.state = 'hold';
        const v = this.script?.victim;
        if (v) { v.state = 'react'; v.t = 2; this.say(v.id, v.id === 'CREW_HAMID' ? 'Tespihim!' : 'Hey! Geri ver!', 2); }
        const far = randomWalkable(this.ship);
        this.goto(a, far.x, far.y, 'run', 'hide');
        return;
      }
      case 'hide': a.state = 'hold'; a.t = 99; return;
      case 'shoulder': { const r = this.script?.reza; if (r) { a.ride = r; a.z = 1; r.dir = 'down'; } return; }
      case 'sitCorner': a.state = 'sit'; a.t = 99; a.dir = 'up'; return;
      case 'pickBone': {
        const bone = this.props.find((p) => p.kind === 'bone');
        if (bone) bone.taken = true;
        a.carry = 'bone';
        const bj = this.actors.get('CREW_BJORN');
        if (bj) this.goto(a, bj.x + (bj.x > this.ship.cx ? -7 : 7), bj.y, 'run', 'returnBone');
        return;
      }
      case 'returnBone': a.carry = null; a.state = 'wag'; a.t = 99; this.say('CREW_BJORN', 'Aferin oğlum!', 1.6); return;
      default: break;
    }
    if (a.kind === 'crew' || a.kind === 'captain') {
      a.state = a.job ? 'work' : 'idle';
      if (a.job) { a.dir = a.job.face || a.dir; a.task = a.jobTask; }
      a.t = a.job ? rnd(5, 10) : rnd(1.5, 4);
    } else if (a.kind === 'monkey' && a.inspect) { a.state = 'hold'; a.t = rnd(2, 4); a.inspect = false; a.task = PET_TASK.inspect; }
    else { a.state = 'sit'; a.t = rnd(2, 5); }
  }

  nextFree(a) {
    const ship = this.ship;
    if (a.kind === 'captain') {
      const r = Math.random();
      const s = r < 0.7 ? ship.stations.find((x) => x.type === 'helm') : this.stationFor(a, ['center', 'bow', 'railL', 'railR', 'cargo']);
      a.job = s; a.jobTask = s?.type === 'helm' ? 'Dümende, rotayı tutuyor' : 'Güverteyi denetliyor';
      if (s && this.goto(a, s.x, s.y, 'walk')) return;
      a.state = 'idle'; a.t = 2; return;
    }
    if (a.kind === 'crew') {
      const r = Math.random();
      const job = JOBS[a.idle] || { st: ['railL', 'railR', 'center', 'mast'], task: 'Güvertede iş görüyor' };
      if (r < 0.62) {
        const s = this.stationFor(a, job.st) || this.stationFor(a, ['railL', 'railR', 'center', 'mast', 'stern']);
        if (s) { this.reserve(a, s); a.job = s; a.jobTask = job.task; if (this.goto(a, s.x, s.y, 'walk')) { a.task = 'Görevine gidiyor'; return; } }
      }
      if (r < 0.85) { const p = randomWalkable(ship); a.job = null; a.task = 'Güvertede dolaşıyor'; if (this.goto(a, p.x, p.y, 'walk')) return; }
      a.job = null; a.state = 'idle'; a.t = rnd(1.5, 3.5); a.task = 'Dinleniyor';
      return;
    }
    if (a.kind === 'cat') {
      const r = Math.random();
      if (r < 0.35) { const p = randomWalkable(ship); if (this.goto(a, p.x, p.y, 'walk')) { a.task = PET_TASK.walk; return; } }
      if (r < 0.65) { a.state = 'sit'; a.t = rnd(4, 9); a.task = PET_TASK.sit; } else { a.state = 'sleep'; a.t = rnd(8, 16); a.task = PET_TASK.sleep; }
      return;
    }
    if (a.kind === 'dog') {
      const r = Math.random();
      if (r < 0.6) { const p = randomWalkable(ship); const run = Math.random() < 0.55; if (this.goto(a, p.x, p.y, run ? 'run' : 'walk')) { a.task = run ? PET_TASK.run : PET_TASK.walk; a.sniff = !run && Math.random() < 0.5; return; } }
      if (r < 0.85) { a.state = Math.random() < 0.5 ? 'wag' : 'sit'; a.t = rnd(1, 3); a.task = PET_TASK.wag; } else { a.state = 'sleep'; a.t = rnd(2, 5); a.task = PET_TASK.sleep; }
      return;
    }
    if (a.kind === 'monkey') {
      a.z = 0; a.carry = null;
      const r = Math.random();
      if (r < 0.25) { const s = ship.stations.find((x) => x.type === 'mast'); if (s && this.goto(a, s.x, s.y, 'run', 'climb')) { a.task = PET_TASK.climb; return; } }
      if (r < 0.5) { const s = this.stationFor(a, ['cargo']); if (s && this.goto(a, s.x, s.y, 'walk')) { a.inspect = true; a.task = PET_TASK.inspect; return; } }
      const p = randomWalkable(ship);
      if (this.goto(a, p.x, p.y, Math.random() < 0.4 ? 'run' : 'walk')) { a.task = PET_TASK.walk; return; }
      a.state = 'sit'; a.t = 2;
      return;
    }
    if (a.kind === 'npc') { a.state = 'idle'; a.t = 1; }
  }

  updateParrot(a, dt) {
    if (a.state === 'fly') {
      a.flyT += dt;
      const f = Math.min(1, a.flyT / a.flyDur);
      const tx = a.perch.follow ? a.perch.follow.x : a.perch.x;
      const ty = a.perch.follow ? a.perch.follow.y - 3 : a.perch.y;
      a.x = a.from.x + (tx - a.from.x) * f;
      a.y = a.from.y + (ty - a.from.y) * f;
      a.dir = Math.abs(tx - a.from.x) > Math.abs(ty - a.from.y) ? (tx > a.from.x ? 'right' : 'left') : ty > a.from.y ? 'down' : 'up';
      if (f >= 1) { a.state = 'perch'; a.t = rnd(5, 11); a.task = PET_TASK.perch; }
      return;
    }
    if (a.perch?.follow) { a.x = a.perch.follow.x; a.y = a.perch.follow.y - 3; }
    if (a.fluff) a.fluff = Math.max(0, a.fluff - dt);
    a.t -= dt;
    if (a.t <= 0 && !a.busy) this.flyTo(a, null);
  }

  flyTo(a, perch) {
    a.from = { x: a.x, y: a.y };
    if (!perch) {
      const opts = this.ship.perches.filter((p) => p !== a.perch);
      perch = opts[Math.floor(Math.random() * opts.length)] || this.ship.perches[0];
    }
    a.perch = perch;
    a.state = 'fly';
    a.task = PET_TASK.fly;
    a.flyT = 0;
    a.flyDur = Math.max(0.7, Math.hypot(perch.x - a.x, perch.y - a.y) / 40);
  }

  // ───────── Etkileşim senaryoları (GDD Bölüm 10) ─────────
  startScript() {
    const has = (id) => this.actors.has(id) && !this.actors.get(id).busy;
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
    if (has('PET_CUCE') && !has('CREW_HAMID')) opts.push('stealRandom');
    const crew = [...this.actors.values()].filter((a) => (a.kind === 'crew' || a.kind === 'captain') && !a.busy);
    if (crew.length >= 2) opts.push('chat');
    if (!opts.length) return;
    this.runScript(opts[Math.floor(Math.random() * opts.length)]);
  }

  runScript(name) {
    const A = (id) => this.actors.get(id);
    const ship = this.ship;
    const S = { name, ids: new Set(), t: 0, dur: 14 };
    const use = (...ids) => ids.forEach((i) => { S.ids.add(i); const a = A(i); a.busy = true; a.after = null; a.path = null; });
    const cat = A('PET_ZIPIR'), dog = A('PET_TARCIN');
    const st = (type) => ship.stations.find((x) => x.type === type);
    switch (name) {
      case 'sunnyCorner': { // Güneşli Köşe
        use('PET_ZIPIR', 'PET_TARCIN');
        const c = st('bowR');
        this.goto(dog, c.x, c.y, 'walk', 'sleep'); dog.task = 'Güneşli köşede yatıyor';
        S.tick = (s) => { if (s.t > 3 && !s.cat) { s.cat = true; const n = this.nearestWalk(c.x - 7, c.y + 3); this.goto(cat, n.x, n.y, 'walk', 'sleep'); cat.task = 'Tarçın’ın yanına kıvrıldı'; } };
        S.dur = 22; break;
      }
      case 'scentTrail': { // Koku Takibi
        use('PET_ZIPIR', 'PET_TARCIN');
        const a = st('stern'), b = st('bow');
        dog.sniff = true; this.goto(dog, b.x, b.y, 'walk'); dog.task = 'Bir koku peşinde';
        S.tick = (s) => {
          if (!s.c && s.t > 1.2) { s.c = true; const m = st('center'); this.goto(cat, m.x - 10, m.y, 'walk'); cat.task = 'Umursamadan yürüyor'; }
          if (!s.stop && Math.hypot(cat.x - dog.x, cat.y - dog.y) < 10) { s.stop = true; dog.path = null; dog.state = 'wag'; dog.t = 3; }
        };
        S.dur = 14; break;
      }
      case 'play': { // Oyun
        use('PET_ZIPIR', 'PET_TARCIN');
        cat.path = null; cat.state = 'sit'; cat.t = 99; cat.task = 'Tarçın’ı izliyor';
        S.tick = (s) => {
          if (!dog.path) {
            s.lap = (s.lap || 0) + 1;
            if (s.lap === 5) { this.say('PET_ZIPIR', 'Miyav.', 1.5); cat.state = 'sit'; dog.state = 'wag'; dog.t = 2; }
            else if (s.lap < 5) { const ang = s.lap * 1.6; const n = this.nearestWalk(cat.x + Math.cos(ang) * 14, cat.y + Math.sin(ang) * 14); this.goto(dog, n.x, n.y, 'run'); dog.task = 'Zıpır’ın etrafında koşuyor'; }
          }
        };
        S.dur = 12; break;
      }
      case 'biscuitMoment': { // Bisküvi Anı
        use('PET_ZIPIR', 'PET_TARCIN', 'CREW_PITA');
        const p = A('CREW_PITA');
        p.state = 'work'; p.t = 99; p.task = 'Bisküvi dağıtıyor';
        this.say('CREW_PITA', 'Bisküvi!', 1.8);
        const n1 = this.nearestWalk(p.x + 8, p.y), n2 = this.nearestWalk(p.x - 8, p.y);
        this.goto(dog, n1.x, n1.y, 'run', 'eat');
        this.goto(cat, n2.x, n2.y, 'walk', 'sniff'); cat.task = 'Bisküviyi önce kokluyor';
        S.dur = 12; break;
      }
      case 'nightWatch': { // Gece Nöbeti
        use('PET_ZIPIR', 'PET_TARCIN');
        const b = st('bow');
        this.goto(dog, b.x, b.y, 'walk', 'watch'); dog.task = 'Burunda ufka bakıyor';
        const n = this.nearestWalk(b.x + 7, b.y + 4);
        this.goto(cat, n.x, n.y, 'walk', 'watch'); cat.task = 'Tarçın’la aynı yöne bakıyor';
        S.dur = 22; break;
      }
      case 'zipirGroot': {
        use('PET_ZIPIR', 'CREW_GROOT');
        const g = A('CREW_GROOT');
        g.path = null; g.state = 'sit'; g.t = 99; g.task = 'Zıpır’ı okşuyor';
        const n = this.nearestWalk(g.x + 7, g.y);
        this.goto(cat, n.x, n.y, 'walk', 'sleep'); cat.task = 'Groot’un yanında uyuyor';
        S.tick = (s) => { if (cat.state === 'sleep') { g.state = Math.floor(s.t) % 3 === 0 ? 'work' : 'sit'; g.dir = 'right'; } };
        S.dur = 18; break;
      }
      case 'fetch': {
        use('PET_TARCIN', 'CREW_BJORN');
        const bj = A('CREW_BJORN');
        bj.path = null; bj.state = 'work'; bj.t = 99; bj.task = 'Tarçın’a kemik atıyor';
        const tgt = randomWalkable(ship);
        this.say('CREW_BJORN', 'Getir!', 1.6);
        dog.state = 'wag'; dog.t = 99;
        this.props.push({ kind: 'bone', x0: bj.x, y0: bj.y, x1: tgt.x, y1: tgt.y, x: bj.x, y: bj.y, t: 0, dur: 1, onLand: () => this.goto(dog, tgt.x, tgt.y, 'run', 'pickBone') });
        dog.task = 'Kemiği kovalıyor';
        S.dur = 14; break;
      }
      case 'tarcinPita': {
        use('PET_TARCIN', 'CREW_PITA');
        const p = A('CREW_PITA');
        p.state = 'work'; p.t = 99;
        const n = this.nearestWalk(p.x + 7, p.y);
        this.goto(dog, n.x, n.y, 'walk', 'beg'); dog.task = PET_TASK.beg;
        S.dur = 9; break;
      }
      case 'stealBeads': case 'stealRandom': {
        const victim = name === 'stealBeads' ? A('CREW_HAMID') : [...this.actors.values()].find((a) => a.kind === 'crew' && !a.busy) || A('CAPTAIN');
        if (!victim) return;
        use('PET_CUCE', victim.id);
        victim.path = null; victim.state = name === 'stealBeads' ? 'work' : 'idle'; victim.t = 99;
        const m = A('PET_CUCE');
        S.victim = victim;
        const n = this.nearestWalk(victim.x + 6, victim.y);
        this.goto(m, n.x, n.y, 'walk', 'grab'); m.task = 'Bir şeyler çalmaya gidiyor';
        S.dur = 11; break;
      }
      case 'shoulder': {
        use('PET_CUCE', 'CREW_REZA');
        const r = A('CREW_REZA');
        r.path = null; r.state = 'idle'; r.t = 99; r.task = 'Omzunda Cüce Kaptan, arkayı kolluyor';
        S.reza = r;
        this.goto(A('PET_CUCE'), r.x, r.y + 3, 'walk', 'shoulder');
        S.dur = 12; break;
      }
      case 'rum': {
        use('PET_KIRMIZI', 'CREW_DIEGO');
        const d = A('CREW_DIEGO');
        d.path = null; d.state = 'idle'; d.t = 99;
        const p = A('PET_KIRMIZI');
        this.flyTo(p, { x: d.x, y: d.y, follow: d });
        S.tick = (s) => { if (p.state === 'perch' && !s.said) { s.said = true; this.say('PET_KIRMIZI', 'Rum iç! Rum iç!', 2.5); } };
        S.dur = 9; break;
      }
      case 'corner': {
        use('PET_GECEYARISI', 'CREW_MAGDA');
        const c = st('stern');
        const mg = A('CREW_MAGDA');
        this.goto(mg, c.x, c.y, 'walk', 'sitCorner'); mg.task = 'Gece Yarısı ile köşede oturuyor';
        this.flyTo(A('PET_GECEYARISI'), { x: c.x + 6, y: c.y - 1 });
        S.dur = 16; break;
      }
      case 'chat': {
        const crew = [...this.actors.values()].filter((a) => (a.kind === 'crew' || a.kind === 'captain') && !a.busy);
        const [p, q] = crew.sort(() => Math.random() - 0.5);
        use(p.id, q.id);
        const m = randomWalkable(ship);
        const n1 = this.nearestWalk(m.x - 6, m.y), n2 = this.nearestWalk(m.x + 6, m.y);
        this.goto(p, n1.x, n1.y, 'walk'); this.goto(q, n2.x, n2.y, 'walk');
        p.task = q.task = 'Sohbet ediyor';
        S.tick = (s) => { if (!p.path && !q.path && !s.f) { s.f = true; p.dir = 'right'; q.dir = 'left'; p.state = q.state = 'idle'; p.t = q.t = 99; } };
        S.dur = 9; break;
      }
    }
    this.script = S;
  }

  endScript() {
    if (!this.script) return;
    for (const id of this.script.ids) {
      const a = this.actors.get(id);
      if (!a) continue;
      a.busy = false; a.after = null; a.sniff = false; a.carry = null; a.ride = null; a.z = 0;
      if (a.kind === 'parrot') { if (a.perch?.follow) this.flyTo(a, null); }
      else if (!a.path) { a.state = 'idle'; a.t = rnd(0.5, 2); }
    }
    this.script = null;
    this.cooldown = rnd(8, 14);
  }

  // ───────── Çizim ─────────
  frameOf(a) {
    const walk = !!(a.path && a.path.length);
    const f4 = Math.floor(a.ft * (a.state === 'run' ? 10 : a.kind === 'cat' ? 3 : 6)) % 4;
    if (a.kind === 'crew' || a.kind === 'captain' || a.kind === 'npc') {
      let state = walk ? 'walk' : a.state === 'work' || a.state === 'workHere' ? 'work' : a.state === 'sit' ? 'sit' : a.state === 'react' ? 'react' : 'idle';
      const frame = walk ? f4 : state === 'work' ? Math.floor(a.ft * 3) % 4 : 0;
      if (a.kind === 'crew') return crewSprite(a.id, a.dir, state, frame);
      return npcSprite(a.kind === 'captain' ? 'captain' : a.npc, a.dir, state, frame);
    }
    let pose = 'idle';
    if (a.kind === 'parrot') pose = a.state === 'fly' ? (Math.floor(a.ft * 8) % 2 ? 'fly0' : 'fly1') : a.fluff ? 'fluff' : 'perch';
    else if (walk) pose = 'walk' + f4;
    else if (a.state === 'wag') pose = Math.floor(a.ft * 8) % 2 ? 'wag1' : 'wag0';
    else if (a.state === 'bark') pose = Math.floor(a.ft * 4) % 2 ? 'bark' : 'sit';
    else if (a.state === 'beg') pose = Math.floor(a.ft * 4) % 2 ? 'beg' : 'wag1';
    else if (a.state === 'sleep') pose = 'sleep';
    else if (a.state === 'hold') pose = 'hold';
    else if (a.state === 'sit' || a.state === 'climb') pose = a.kind === 'monkey' ? 'idle' : 'sit';
    return petSprite(a.id, a.dir, pose);
  }

  /** layer: 'deck' (güvertedekiler) | 'air' (uçanlar, direkte olanlar) */
  draw(ctx, layer = 'deck') {
    if (!this.ship) return;
    const list = [...this.actors.values(), ...this.temp].filter((a) => (layer === 'air') === (a.kind === 'parrot' || !!a.z));
    list.sort((p, q) => p.y - q.y);
    for (const a of list) {
      const img = this.frameOf(a);
      let x = a.x, y = a.y;
      if (a.state === 'climb') { const m = this.ship.masts.find((mm) => Math.abs(mm.y - a.y) < 14) || this.ship.masts[0]; x = m.x + 10; y = m.y - 6; }
      if (layer === 'deck') { ctx.fillStyle = 'rgba(20,10,4,0.28)'; ctx.fillRect(Math.round(x - 4), Math.round(y + 3), 8, 3); }
      else if (a.kind === 'parrot' && a.state === 'fly') { ctx.fillStyle = 'rgba(20,10,4,0.2)'; ctx.fillRect(Math.round(x - 3), Math.round(y + 9), 6, 2); }
      ctx.drawImage(img, Math.round(x - CS / 2), Math.round(y - CS / 2 - (a.hop || 0)));
      if (a.carry === 'bone') { ctx.fillStyle = '#f4ead5'; ctx.fillRect(Math.round(x - 3), Math.round(y - 8), 6, 2); }
      if (a.carry === 'crate' && a.crateGood) ctx.drawImage(cargoSprite(a.crateGood), Math.round(x - 5), Math.round(y - 12));
      if (a.carry === 'chest') { ctx.fillStyle = '#7a4a24'; ctx.fillRect(Math.round(x - 4), Math.round(y - 12), 8, 6); ctx.fillStyle = '#f2c14e'; ctx.fillRect(Math.round(x - 4), Math.round(y - 10), 8, 1); }
      if (a.state === 'sleep' && Math.floor(this.time * 1.5) % 3 === 0) px(ctx, x + 5, y - 7 - (this.time % 1) * 4, '#e8f0ff');
    }
    if (layer === 'deck') for (const p of this.props) { if (p.taken) continue; ctx.fillStyle = '#f4ead5'; ctx.fillRect(Math.round(p.x - 3), Math.round(p.y - p.z), 6, 2); }
  }

  /** Dokunulan aktör (sprite koordinatında) */
  actorAt(x, y) {
    let best = null, bd = 12;
    for (const a of [...this.actors.values()]) {
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }

  info(a) {
    if (a.kind === 'captain') return { name: 'Kaptan (sen)', title: 'Geminin sahibi', ability: 'Rotayı ve kararları sen belirlersin.', task: a.jobTask || a.task || 'Dümende' };
    if (a.kind === 'crew') { const c = CREW_BY_ID[a.id]; return { name: c.name, title: c.title, ability: c.passive, task: a.state === 'work' && a.jobTask ? a.jobTask : a.task || 'Dinleniyor', id: a.id }; }
    const p = PET_BY_ID[a.id];
    return { name: p.name, title: p.species, ability: p.passive, task: a.task || 'Dolaşıyor', id: a.id, pet: true };
  }

  bubblePositions() {
    return this.bubbles.map((b) => {
      const a = this.actors.get(b.id) || this.temp.find((t) => t.id === b.id);
      return a ? { text: b.text, x: a.x, y: a.y - 12 } : null;
    }).filter(Boolean);
  }
}
