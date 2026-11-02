// Balıkçılık çekirdeği (GDD §6): İNAT barı + İP GERİLİMİ + MESAFE + SAR (basılı) + ÇEK.
// Saf, deterministik simülasyon (DOM yok). Sabit 1/60 sn alt adımlarla ilerler → FPS bağımsız.
// Davranış aileleri ayrı hamle setleri kullanır; "Asılma", "Dip Yapma", "Son Çırpınış", "Hırçın" türetilmiş evre/hamle adlarıdır.
(function (D) {
  'use strict';
  const STEP = 1 / 60;
  const RED = 0.85, YELLOW = 0.6;

  // Hamle setleri (ağırlıklı). Boss evreleri ayrı.
  const MOVESETS = {
    calm: [['rest', 4], ['tug', 2], ['dip', 1], ['asilma', 0.6]],
    wiggler: [['tug', 6], ['frenzy', 1], ['asilma', 1], ['dart', 1]],
    runner: [['dart', 5], ['tug', 1], ['dip', 1.5], ['asilma', 1]],
    heavy: [['heave', 4], ['dip', 2.5], ['asilma', 2], ['rest', 1]],
    trickster: [['feint', 4], ['asilma', 2], ['dart', 1.5], ['rest', 1.5]],
    berserk: [['frenzy', 4], ['asilma', 2.5], ['tug', 1.5], ['heave', 1]],
    son: [['frenzy', 3], ['asilma', 2], ['tug', 2], ['dart', 1]],
    boss1: [['tentacle', 3], ['heave', 2], ['asilma', 1]],
    boss2: [['ink', 1.5], ['deepdive', 2], ['tentacle', 2], ['asilma', 1.5]],
    boss3: [['whirl', 3], ['frenzy', 2], ['asilma', 2], ['tentacle', 2]]
  };
  const MOVE_DUR = { rest: 2.0, tug: 0.35, dip: 1.6, asilma: 0.8, dart: 1.2, heave: 2.0, feint: 1.6, frenzy: 1.4, tentacle: 0.6, ink: 5, deepdive: 2.4, whirl: 2.2 };
  D.MOVE_TR = { rest: 'Dinlenme', tug: 'Silkeleme', dip: 'Dip Yapma', asilma: 'Asılma', dart: 'Ani Kaçış', heave: 'Ağır Çekiş', feint: 'Sahte Sakinlik', frenzy: 'Çırpınma Atağı', tentacle: 'Dokunaç Darbesi', ink: 'Mürekkep Bulutu', deepdive: 'Derin Dalış', whirl: 'Girdap' };

  class FightSim {
    constructor(o) {
      const b = (this.b = D.FishBalanceDB[o.fishId]);
      this.fishId = o.fishId;
      this.L = o.L;
      this.rng = new D.RNG(o.seed >>> 0);
      this.hircin = !!o.hircin;
      this.boss = b.behavior === 'boss';
      this.sizeT = D.Econ.sizeT(o.fishId, o.size);
      this.rank = D.rarityRank(b.rarity);
      this.maxInat = b.stamina * this.L.hpMult * (0.9 + 0.25 * this.sizeT);
      this.inat = this.maxInat;
      this.tension = 0.12;
      this.startDist = b.startDistance + this.sizeT * 4;
      this.dist = this.startDist;
      this.maxDist = this.startDist * 1.55 + 6;
      this.pullDist = Math.max(3.5, this.startDist * 0.28);
      this.pullInat = 0.22;
      this.sonAt = 0.35;
      this.phase = this.boss ? 1 : 'normal';
      this.reel = 0;
      this.t = 0; this.acc = 0;
      this.queue = []; this.active = null; this.teleShown = null;
      this.redTime = 0; this.inRed = false; this.slackTime = 0; this.everRed = false; this.maxTension = 0;
      this.pauseUntil = 0; this.energyUntil = 0; this.noAsilmaUntil = 0; this.inkUntil = 0;
      this.snapSaveTried = false; this.escapeSaveTried = false;
      this.earlyPulls = 0; this.result = null; this.warn = false; this.fleeing = false;
      this.charges = {};
      for (const id of this.L.actives) if (D.ItemBalanceDB[id].kind === 'charge' && D.ItemBalanceDB[id].params.perFight) this.charges[id] = 1;
      this.events = [];
      this.genCycle(1.6);
      if (this.hircin) this.ev('hircin', 'Hırçın! Balık normalden saldırgan.');
      if (this.L.revealFirst && this.queue[0]) this.ev('reveal', 'İlk hamle: ' + D.MOVE_TR[this.queue[0].type] + ' (~' + this.queue[0].at.toFixed(1) + ' sn)');
    }
    ev(type, text, extra) { this.events.push(Object.assign({ type, text, t: this.t }, extra || {})); }
    drain() { const e = this.events; this.events = []; return e; }
    movesetKey() { return this.boss ? 'boss' + this.phase : this.phase === 'son' ? 'son' : this.b.behavior; }
    genCycle(firstGap) {
      const set = MOVESETS[this.movesetKey()];
      const n = 3 + this.L.extraMoves;
      let [a, c] = this.b.moveEvery;
      let k = 1;
      if (this.phase === 'son') k *= 0.65;
      if (this.hircin) k *= 0.7;
      a *= k; c *= k;
      let at = Math.max(this.t, this.active ? this.active.end : this.t);
      for (let i = 0; i < n; i++) {
        const gap = i === 0 && firstGap ? firstGap : (this.L.regular ? (a + c) / 2 : this.rng.range(a, c));
        at += gap;
        const type = this.rng.weighted(set.map(([v, w]) => ({ v, w })));
        let delay = type === 'asilma' ? this.L.asilmaDelay : 0;
        const hidden = (this.L.unsignaled && this.rng.chance(this.L.unsignaled)) || false;
        const mv = { type, at: at + delay, tele: this.L.telegraph + delay, hidden, power: (1 + 0.07 * this.rank) * (this.hircin ? 1.25 : 1) };
        this.queue.push(mv);
        at = mv.at + MOVE_DUR[type];
      }
    }
    teleTime(mv) { return mv.tele; }
    mult() {
      let m = this.L.tensionMult * this.L.tensionEnvMult * this.b.tensionSensitivity;
      if (this.t < this.energyUntil) m *= D.ItemBalanceDB.SPC_24.params.tensionMult;
      if (this.phase === 'son') m *= 1 + 0.3 * this.L.sonTensionMult;
      if (this.hircin) m *= 1.12;
      return m;
    }
    spike(x) { this.tension = D.clamp(this.tension + x, 0, 1); }
    mistake(kind) {
      const base = kind === 'early' ? 0.25 : 0.12;
      this.spike(base * this.L.mistakeSpikeMult);
      if (this.L.mistakePause > 0) this.pauseUntil = Math.max(this.pauseUntil, this.t + this.L.mistakePause);
      this.ev('mistake', kind === 'early' ? 'Erken çektin! Gerilim fırladı.' : 'Kırmızı bölge! Hemen bırak.', { kind });
    }
    activate(mv) {
      if (mv.type === 'asilma' && this.t < this.noAsilmaUntil) { mv = Object.assign({}, mv, { type: 'rest' }); this.ev('blocked', 'Sakinleştirici Sprey: Asılma engellendi.'); }
      const dur = MOVE_DUR[mv.type] * (mv.type === 'dip' || mv.type === 'deepdive' ? this.L.dipDurationMult : 1);
      this.active = Object.assign({}, mv, { start: this.t, end: this.t + dur, tick: 0 });
      const s = this.b.tensionSensitivity * this.L.tensionMult * mv.power;
      switch (mv.type) {
        case 'tug': this.spike(0.13 * s); this.dist += 0.5; break;
        case 'asilma': this.spike(0.3 * s * this.L.asilmaTensionMult); break;
        case 'tentacle': this.spike(0.32 * s); this.dist += 2; break;
        case 'ink': this.inkUntil = this.t + 5; break;
        default: break;
      }
      if (this.L.escapeSlip && this.rng.chance(this.L.escapeSlip)) { this.dist += 2.5; this.ev('slip', 'Körelmiş iğne kaydı! Balık biraz uzaklaştı.'); }
      this.ev('move', D.MOVE_TR[mv.type], { move: mv.type });
    }
    // Hamle etkisi: {pull, tens (sn başı), dist (sn başı), dmg}
    moveEffect() {
      const m = this.active; const e = { pull: 1, tens: 0, dist: 0, dmg: 1 };
      if (!m) return e;
      const p = m.power, el = this.t - m.start;
      switch (m.type) {
        case 'rest': e.pull = 0.4; e.dmg = 1.3; break;
        case 'dip': case 'deepdive': {
          const k = m.type === 'deepdive' ? 2 : 1;
          e.dist = 1.6 * k * p; e.tens = 0.25 * k * p * this.reel; e.dmg = 0.5; break;
        }
        case 'asilma': e.tens = 0.2 * p * this.L.asilmaTensionMult; break;
        case 'dart': e.dist = this.b.escapeRate * 2.1 * p; e.tens = 0.45 * p * this.reel; break;
        case 'heave': e.pull = 2.2 * p; break;
        case 'feint':
          if (el < 0.9) e.pull = 0.3;
          else if (!m.burst) { m.burst = true; this.spike(0.28 * p * this.b.tensionSensitivity); this.dist += 3; }
          break;
        case 'frenzy': e.pull = 1.6 * p; if (Math.floor(el / 0.25) > m.tick) { m.tick++; this.spike(0.055 * p); } break;
        case 'tentacle': e.pull = 1.5 * p; break;
        case 'whirl': e.dist = 2.5 * p; e.tens = 0.15 * Math.sin(this.t * 7); break;
        case 'ink': e.pull = 1.1; break;
        default: break;
      }
      return e;
    }
    // Dış arayüz: dt kadar ilerle (alt adımlara böler).
    advance(dt, input) {
      if (this.result) return;
      this.acc += Math.min(dt, 0.25);
      while (this.acc >= STEP && !this.result) { this.acc -= STEP; this.step(STEP, input); }
    }
    step(dt, input) {
      const L = this.L, b = this.b;
      this.t += dt;
      // Girdi gecikmesi (Kahve Termosu azaltır)
      const target = input && input.reel ? 1 : 0;
      this.reel += (target - this.reel) * (1 - Math.exp(-dt / Math.max(0.02, L.inputLag)));
      const reeling = this.reel > 0.05;
      const paused = this.t < this.pauseUntil;
      // Hamle zamanlaması
      if (this.active && this.t >= this.active.end) this.active = null;
      if (paused && this.queue[0]) this.queue[0].at += dt; // duraksama hamleyi erteler
      const next = this.queue[0];
      if (next && !this.active) {
        if (!next.hidden && this.t < this.inkUntil) next.hidden = true;
        if (this.teleShown !== next && !next.hidden && this.t >= next.at - this.teleTime(next)) {
          this.teleShown = next; this.ev('tele', D.MOVE_TR[next.type] + ' geliyor!', { move: next.type, at: next.at });
        }
        if (this.t >= next.at) { this.queue.shift(); this.activate(next); }
      }
      if (!this.queue.length && !this.active) this.genCycle();
      const fx = paused ? { pull: 0, tens: 0, dist: 0, dmg: 1 } : this.moveEffect();
      // Balık çekişi
      let pull = b.strength * fx.pull * (this.rank >= 2 ? 1 - L.rh * 0.4 : 1) * (this.hircin ? 1.15 : 1);
      // Gerilim
      const m = this.mult();
      let dT = 0;
      if (reeling) dT += (0.12 * L.reelTension * this.reel + pull * 0.28 * (0.5 + 0.5 * this.reel)) * m * (1 - L.ct);
      else dT += pull * 0.05 * m;
      dT += fx.tens * m;
      dT -= (0.62 + L.ct * 0.7) * (1 - this.reel);
      if (L.wobble) dT += Math.sin(this.t * 2.7) * L.wobble * 5;
      if (L.dipFreeze && this.active && (this.active.type === 'dip' || this.active.type === 'deepdive')) dT = 0;
      this.tension = D.clamp(this.tension + dT * dt, 0, 1);
      this.maxTension = Math.max(this.maxTension, this.tension);
      this.warn = L.warnAhead > 0 && dT > 0.01 && (1 - this.tension) / dT < L.warnAhead;
      // Kırmızı bölge + düzeltme süresi
      const red = this.tension >= RED;
      if (red && !this.inRed) this.mistake('red');
      this.inRed = red;
      if (red) { this.redTime += dt * (this.tension >= 0.999 ? 2 : 1); this.everRed = true; }
      else this.redTime = Math.max(0, this.redTime - dt * 1.5);
      if (this.redTime > L.grace) {
        if (L.snapSave > 0 && !this.snapSaveTried) {
          this.snapSaveTried = true;
          if (this.rng.chance(L.snapSave)) { this.tension = 0.6; this.redTime = 0; this.ev('saved', 'Melek Tokası ipi kurtardı!'); }
        }
        if (this.redTime > L.grace) { this.finish('snap'); return; }
      }
      // Mesafe
      const slowedByMove = this.active && ['dart', 'dip', 'deepdive', 'whirl'].includes(this.active.type);
      const reelRate = 3.0 * L.rs * L.reelEnvMult * this.reel * (slowedByMove ? 0.35 : 1);
      let fishRate = paused ? 0 : b.escapeRate * (this.reel > 0.3 ? 0.18 : 0.5) * Math.min(1.5, fx.pull) + fx.dist;
      if (this.tension < 0.12 && !reeling) this.slackTime += dt; else this.slackTime = 0;
      const wasFleeing = this.fleeing;
      this.fleeing = this.slackTime > 3.2;
      if (this.fleeing) { fishRate += b.escapeRate * 1.6; if (!wasFleeing) this.ev('flee', 'Misina çok gevşek — balık kaçıyor!'); }
      this.dist = Math.max(1, this.dist + (fishRate - reelRate) * dt);
      if (this.dist > this.maxDist) {
        if (L.escapeSave > 0 && !this.escapeSaveTried) {
          this.escapeSaveTried = true;
          if (this.rng.chance(L.escapeSave)) { this.dist = this.maxDist * 0.8; this.ev('saved', 'Melek Kanadı balığı tuttu!'); }
        }
        if (this.dist > this.maxDist) { this.finish('escape'); return; }
      }
      // İnat
      const zone = this.tension < 0.3 ? 0.45 : this.tension < YELLOW ? 1 : this.tension < RED ? 1.4 : 1.6;
      const energy = this.t < this.energyUntil ? D.ItemBalanceDB.SPC_24.params.hpLossMult : 1;
      this.inat -= 5.2 * L.sd * this.reel * zone * energy * fx.dmg * dt;
      if (this.slackTime > 1.2) this.inat += this.maxInat * 0.025 * dt;
      this.inat = D.clamp(this.inat, 0, this.maxInat);
      // Evreler
      const frac = this.inat / this.maxInat;
      if (this.boss) {
        const ph = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
        if (ph > this.phase) {
          this.phase = ph; this.dist = Math.min(this.maxDist - 2, this.dist + 6); this.spike(0.12);
          this.queue = []; this.genCycle(1.2);
          this.ev('phase', ph === 2 ? 'Antik Kraken öfkelendi! (Evre 2: Mürekkep ve derin dalış)' : 'Son evre! Kraken girdabı başlattı! (Evre 3)', { phase: ph });
        }
      } else if (this.phase !== 'son' && frac <= this.sonAt) {
        this.phase = 'son'; this.queue = []; this.genCycle(0.8);
        this.ev('son', 'Son Çırpınış! Balık son gücüyle direniyor.');
      }
    }
    canPull() { return !this.result && this.inat / this.maxInat <= this.pullInat && this.dist <= this.pullDist && this.tension < RED; }
    pull() {
      if (this.result) return null;
      if (this.canPull()) { this.finish('caught'); return 'caught'; }
      this.earlyPulls += 1;
      this.mistake('early');
      this.dist += 2;
      if (this.earlyPulls >= 2) { this.finish('early'); return 'early'; }
      this.ev('earlyWarn', 'Erken! İnat ' + Math.round(this.pullInat * 100) + '% altına, mesafe ' + this.pullDist.toFixed(1) + ' m altına inmeli. Bir daha erken çekersen balık kaçar.');
      return 'penalty';
    }
    useCharge(id) {
      if (this.result || !this.charges[id]) return false;
      if (id === 'SPC_15') {
        const n = this.queue.length || 3;
        this.queue = []; const save = this.L.extraMoves; this.L = Object.assign({}, this.L, { extraMoves: Math.max(0, n - 3) });
        this.genCycle(1.0); this.L.extraMoves = save;
        this.ev('special', 'Çatlak Pusula: hamle dizilimi karıştı!');
      } else if (id === 'SPC_22') {
        if (this.active) { this.active = null; this.ev('special', 'Eski Kumanda: hamle iptal!'); }
        else if (this.queue.length) { this.queue.shift(); this.teleShown = null; this.ev('special', 'Eski Kumanda: sıradaki hamle iptal!'); }
        else return false;
      } else return false;
      this.charges[id] = 0;
      return true;
    }
    applyConsumable(id) {
      if (this.result) return false;
      if (id === 'SPC_19') {
        this.tension *= 1 - D.ItemBalanceDB.SPC_19.params.tensionCut;
        if (this.boss) {
          const floor = this.phase === 1 ? 0.66 : 0.33;
          if (this.phase < 3) this.inat = Math.min(this.inat, this.maxInat * floor);
        } else {
          this.inat = Math.min(this.inat, this.maxInat * this.sonAt);
          if (this.phase !== 'son') { this.phase = 'son'; this.queue = []; this.genCycle(0.8); }
        }
        this.ev('special', 'Acil Durum Butonu: gerilim −%40, Son Çırpınış!');
      } else if (id === 'SPC_20') { this.noAsilmaUntil = this.t + D.ItemBalanceDB.SPC_20.params.noAsilma; this.ev('special', '20 sn boyunca Asılma yok.'); }
      else if (id === 'SPC_24') { this.energyUntil = this.t + D.ItemBalanceDB.SPC_24.params.duration; this.ev('special', 'Enerji İçeceği! İnat hızla düşüyor ama gerilim agresif.'); }
      else return false;
      return true;
    }
    finish(outcome) {
      this.result = { outcome, everRed: this.everRed, duration: Math.round(this.t * 10) / 10, maxTension: this.maxTension };
      const T = { caught: 'Yakalandı!', snap: 'İp koptu', escape: 'Balık kaçtı', early: 'Erken çektin' };
      this.ev('end', T[outcome], { outcome });
    }
    snapshot() {
      return { inat: this.inat / this.maxInat, tension: this.tension, dist: this.dist, maxDist: this.maxDist, pullDist: this.pullDist, phase: this.phase, canPull: this.canPull(), red: this.inRed, redFrac: this.redTime / this.L.grace, warn: this.warn, fleeing: this.fleeing, active: this.active && this.active.type, ink: this.t < this.inkUntil };
    }
  }

  // Hazine zamanlama barı (GDD §7.2): yalnız YENİ basış sayılır (sahne o tuşu dinlemeye başladıktan sonraki pointerdown).
  class TreasureBar {
    constructor(seed, chestId, L) {
      const rng = new D.RNG(seed >>> 0);
      const tier = D.ChestDB[chestId] ? Math.max(1, D.ChestDB[chestId].rolls) : 2;
      this.speed = 0.75 + tier * 0.12 + rng.float() * 0.15; // tur/sn
      this.green = D.clamp(0.08 + L.tb * 0.6, 0.06, 0.2);
      this.yellow = D.clamp(0.24 + L.tb * 0.8, 0.2, 0.42);
      this.center = 0.3 + rng.float() * 0.4;
      this.pos = 0; this.dir = 1; this.t = 0; this.done = null;
    }
    update(dt) {
      if (this.done) return;
      this.t += dt;
      this.pos += this.dir * this.speed * dt;
      if (this.pos > 1) { this.pos = 2 - this.pos; this.dir = -1; }
      if (this.pos < 0) { this.pos = -this.pos; this.dir = 1; }
    }
    zoneAt(p) {
      const d = Math.abs(p - this.center);
      if (d <= this.green / 2) return 'green';
      if (d <= this.yellow / 2) return 'yellow';
      return 'red';
    }
    stop() { if (!this.done) this.done = this.zoneAt(this.pos); return this.done; }
  }

  D.FightSim = FightSim;
  D.TreasureBar = TreasureBar;
  D.MOVESETS = MOVESETS;
  D.FISH_ZONES = { RED, YELLOW };
})(globalThis.DUMEN);
