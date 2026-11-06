/* =====================================================================
   08_save_audio.js : SaveManager (IndexedDB + localStorage yedeği, şema, sağlama) ve Sound (WebAudio)
   ===================================================================== */
const Save = {
  DBN: 'cozyfishing', ST: 'saves', LS: 'cozyfishing_save_v1', LSB: 'cozyfishing_backup_v1', LSP: 'cozyfishing_prev_v1', SET: 'cozyfishing_settings_v1',
  db: null, suspended: false, timer: 0, lastError: null, storageOk: true,
  init() {
    return new Promise(res => {
      try {
        if (!window.indexedDB) return res(false);
        const rq = indexedDB.open(this.DBN, 1);
        rq.onupgradeneeded = () => { try { rq.result.createObjectStore(this.ST); } catch (e) { } };
        rq.onsuccess = () => { this.db = rq.result; res(true); };
        rq.onerror = () => res(false); rq.onblocked = () => res(false);
        setTimeout(() => res(!!this.db), 1500);
      } catch (e) { res(false); }
    });
  },
  idbGet(key) { return new Promise(res => { if (!this.db) return res(null); try { const t = this.db.transaction(this.ST, 'readonly').objectStore(this.ST).get(key); t.onsuccess = () => res(t.result || null); t.onerror = () => res(null); } catch (e) { res(null); } }); },
  idbPut(key, v) { if (!this.db) return; try { this.db.transaction(this.ST, 'readwrite').objectStore(this.ST).put(v, key); } catch (e) { } },
  lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { this.storageOk = false; return false; } },
  pack(s) { const st = deepClone(s); st.savedAt = Date.now(); const body = JSON.stringify(st); return JSON.stringify({ format: 'cozyfishing-save', schemaVersion: SCHEMA, revision: st.revision, savedAt: st.savedAt, checksum: hash32(body), state: st }); },
  unpack(str) {
    let o; try { o = JSON.parse(str); } catch (e) { return { ok: false, msg: 'Dosya geçerli JSON değil.' }; }
    if (!o || o.format !== 'cozyfishing-save' || !o.state) return { ok: false, msg: 'Bu bir Cozy Fishing kaydı değil.' };
    if (o.schemaVersion > SCHEMA) return { ok: false, msg: 'Kayıt daha yeni bir oyun sürümüne ait.' };
    if ((o.schemaVersion || 1) < SCHEMA && !this.suspended) { const k = 'cozyfishing_premigrate_v' + (o.schemaVersion || 1); if (!this.lsGet(k)) { this.lsSet(k, str); this.idbPut('premigrate_v' + (o.schemaVersion || 1), str); } }
    if (hash32(JSON.stringify(o.state)) !== o.checksum) return { ok: false, msg: 'Kayıt sağlaması tutmuyor (bozuk veya elle değiştirilmiş).', raw: o.state };
    const st = this.migrate(o.state); const errs = this.validate(st);
    if (errs.length) return { ok: false, msg: 'Kayıt doğrulanamadı: ' + errs.slice(0, 3).join('; '), raw: st };
    return { ok: true, state: st };
  },
  migrate(st) {
    const from = st.schemaVersion || 1; const base = newState(st.player);
    const fill = (dst, src) => { for (const k in src) { if (dst[k] === undefined) dst[k] = deepClone(src[k]); else if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) fill(dst[k], src[k]); } };
    fill(st, base); st.schemaVersion = SCHEMA;
    if (from < 3) { Records.legacyFill(st); st.migratedFrom = from; }
    if (from < 4) { st.migratedFrom = st.migratedFrom || from; st.method = 'float'; st.daypart = 'day'; st.trip = null; }
    if (st.trip && !st.trip.stops) st.trip = null;
    for (const d in st.auto.devices) { const dv = st.auto.devices[d]; if (!dv.policy) dv.policy = { mode: 'econ', bait: null, backup: null, target: null }; }
    while (st.gearSets.length < 3) st.gearSets.push({ name: 'Set ' + (st.gearSets.length + 1) });
    for (const id of st.boats.owned) { const b = st.boats.byId[id]; if (b) { b.ups = b.ups || {}; b.storage = b.storage || []; b.color = b.color || 'sea_green'; b.name = b.name || ''; } }
    return st;
  },
  validate(st) {
    const e = [];
    const num = (v, n) => { if (typeof v !== 'number' || !isFinite(v)) e.push(n + ' sayı değil'); };
    num(st.day, 'gün'); num(st.cash, 'para'); num(st.energy, 'enerji');
    if (st.day < 1) e.push('gün < 1'); if (st.energy > CORE.daily_energy) e.push('enerji fazla');
    if (!RODS.find(r => r.id === st.gear.rod) || !st.gear.owned.rod.includes(st.gear.rod)) e.push('olta geçersiz');
    if (!(st.bagLevel >= 0 && st.bagLevel < INVC.bag.length)) e.push('çanta seviyesi'); if (!(st.chestLevel >= 0 && st.chestLevel < INVC.home_chest.length)) e.push('sandık seviyesi');
    if (!Array.isArray(st.orders)) e.push('ilanlar');
    for (const id of st.boats.owned) if (!BOAT[id] || !st.boats.byId[id]) e.push('tekne ' + id);
    for (const d in st.auto.devices) { const b = st.auto.devices[d].boat; if (b && !st.boats.owned.includes(b)) e.push('cihaz teknesi'); }
    e.push(...Aq.validate(st)); if (!Array.isArray(st.records) || !Array.isArray(st.fin) || !Array.isArray(st.plan.goals) || st.plan.goals.length > 3) e.push('v2 alanları'); if (typeof V3 !== 'undefined') e.push(...V3.validate(st));
    if (!e.length) { const prev = S; S = st; try { e.push(...Inv.validate(st)); const per = {}; for (const d in st.auto.devices) { const b = st.auto.devices[d].boat; if (b) per[b] = (per[b] || 0) + 1; } for (const b in per) if (per[b] > BOAT[b].slots) e.push('yuva aşımı'); } catch (x) { e.push('iç hata'); } S = prev; }
    return e;
  },
  now() {
    if (this.suspended || !S) return;
    clearTimeout(this.timer); this.timer = 0;
    const json = this.pack(S); this.lsSet(this.LS, json); this.idbPut('main', json);
  },
  soon() { if (this.suspended) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.now(), 400); },
  backup() { if (this.suspended || !S) return; const j = this.pack(S); this.lsSet(this.LSB, j); this.idbPut('backup', j); },
  async readAll() {
    const cands = []; const add = (src, str) => { if (!str) return; const u = this.unpack(str); cands.push(Object.assign({ src, str }, u)); };
    add('idb', await this.idbGet('main')); add('local', this.lsGet(this.LS));
    return cands;
  },
  async loadBest() {
    const c = await this.readAll(); const ok = c.filter(x => x.ok).sort((a, b) => (b.state.revision - a.state.revision) || (b.state.savedAt - a.state.savedAt));
    if (ok.length) return { state: ok[0].state };
    if (c.length) return { error: c[0].msg, raw: c[0].str };
    return { none: true };
  },
  async loadBackup() { const s = (await this.idbGet('backup')) || this.lsGet(this.LSB); if (!s) return null; const u = this.unpack(s); return u.ok ? u.state : null; },
  keepPrevious() { const cur = this.lsGet(this.LS); if (cur) this.lsSet(this.LSP, cur); },
  settings() { const def = { music: 0.5, sfx: 0.8, amb: 0.6, mute: false, comfort: false, reduced: false }; try { return Object.assign(def, JSON.parse(this.lsGet(this.SET) || '{}')); } catch (e) { return def; } },
  saveSettings(o) { this.lsSet(this.SET, JSON.stringify(o)); }
};
let SETTINGS = null;

/* ---------- Sound: tamamen sentezlenmiş özgün sesler ---------- */
const Sound = {
  ctx: null, out: null, gMusic: null, gSfx: null, gAmb: null, noiseBuf: null, mode: 'menu', wx: 'sunny', started: false, nextNote: 0, step: 0, timer: 0, amb: {}, engineOn: false, engine: null,
  start() {
    if (this.started) return; this.started = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); const c = this.ctx;
      this.out = c.createGain(); this.out.connect(c.destination);
      this.gMusic = c.createGain(); this.gSfx = c.createGain(); this.gAmb = c.createGain();
      [this.gMusic, this.gSfx, this.gAmb].forEach(g => g.connect(this.out));
      const len = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, len, c.sampleRate); const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.apply(); this.startAmbient(); this.nextNote = c.currentTime + 0.3;
      this.timer = setInterval(() => this.schedule(), 120);
    } catch (e) { this.ctx = null; }
  },
  apply() { if (!this.ctx) return; const s = SETTINGS; const t = this.ctx.currentTime; this.out.gain.setTargetAtTime(s.mute ? 0 : 1, t, 0.05); this.gMusic.gain.setTargetAtTime(s.music * 0.35, t, 0.1); this.gSfx.gain.setTargetAtTime(s.sfx * 0.6, t, 0.05); this.gAmb.gain.setTargetAtTime(s.amb * 0.5, t, 0.2); },
  suspend(v) { if (!this.ctx) return; try { v ? this.ctx.suspend() : this.ctx.resume(); } catch (e) { } },
  tone(f, dur, type, vol, when, slide, dest) {
    const c = this.ctx; if (!c) return; const t = when || c.currentTime; const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.gSfx); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, freq, type, vol, when, q, slide, dest) {
    const c = this.ctx; if (!c) return; const t = when || c.currentTime; const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq, t); if (slide) f.frequency.exponentialRampToValueAtTime(slide, t + dur); f.Q.value = q || 1;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.gSfx); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  sfx(n) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    switch (n) {
      case 'click': this.tone(880, 0.05, 'square', 0.06); this.tone(1320, 0.04, 'sine', 0.05, t + 0.02); break;
      case 'cast': this.noise(0.45, 2400, 'bandpass', 0.25, t, 2, 600); this.tone(500, 0.3, 'sine', 0.05, t, 900); break;
      case 'splash': this.noise(0.35, 1400, 'lowpass', 0.35, t, 1, 300); this.tone(260, 0.12, 'sine', 0.12, t, 120); break;
      case 'plop': this.tone(520, 0.12, 'sine', 0.25, t, 180); break;
      case 'bite': this.tone(300, 0.1, 'sine', 0.3, t, 140); this.noise(0.25, 1800, 'lowpass', 0.3, t + 0.02); this.tone(1046, 0.25, 'triangle', 0.18, t + 0.05); this.tone(1568, 0.3, 'triangle', 0.12, t + 0.12); break;
      case 'hook': this.tone(660, 0.08, 'square', 0.12); this.tone(990, 0.12, 'triangle', 0.15, t + 0.05); break;
      case 'reel': this.tone(1800 + Math.random() * 300, 0.025, 'square', 0.03); break;
      case 'warn': this.tone(740, 0.1, 'square', 0.12); this.tone(740, 0.1, 'square', 0.12, t + 0.16); break;
      case 'surge': this.noise(0.3, 900, 'bandpass', 0.25, t, 3, 300); this.tone(180, 0.3, 'sawtooth', 0.08, t, 90); break;
      case 'snap': this.noise(0.15, 4000, 'highpass', 0.4); this.tone(1200, 0.4, 'triangle', 0.15, t, 180); break;
      case 'escape': this.noise(0.4, 1200, 'lowpass', 0.25, t, 1, 200); this.tone(440, 0.35, 'sine', 0.1, t, 220); break;
      case 'catch': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.16, t + i * 0.08)); this.noise(0.3, 1600, 'lowpass', 0.2, t); break;
      case 'record': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.14, t + i * 0.09)); [1568, 2093].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.06, t + 0.4 + i * 0.1)); break;
      case 'coin': this.tone(1318, 0.08, 'square', 0.08); this.tone(1760, 0.2, 'triangle', 0.12, t + 0.07); break;
      case 'buy': [659, 880, 1108].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.12, t + i * 0.06)); break;
      case 'ach': [523, 784, 1046, 1318, 1568].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.1, t + i * 0.07)); break;
      case 'fanfare': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.45, 'triangle', 0.13, t + i * 0.1)); this.tone(262, 0.9, 'sine', 0.1, t); break;
      case 'error': this.tone(220, 0.15, 'square', 0.08); this.tone(180, 0.2, 'square', 0.08, t + 0.1); break;
      case 'auto': this.tone(980, 0.06, 'square', 0.05); this.tone(1470, 0.12, 'triangle', 0.08, t + 0.06); break;
      case 'sleep': [523, 440, 392, 330].forEach((f, i) => this.tone(f, 0.6, 'sine', 0.1, t + i * 0.25)); break;
      case 'step': this.noise(0.04, 900, 'lowpass', 0.05); break;
      case 'door': this.tone(200, 0.15, 'triangle', 0.1, t, 140); this.noise(0.12, 700, 'lowpass', 0.1); break;
      case 'nibble': this.tone(1400, 0.03, 'square', 0.05); this.tone(1100, 0.03, 'square', 0.04, t + 0.05); break;
      case 'rodtip': this.tone(1568, 0.08, 'triangle', 0.14); this.tone(1568, 0.08, 'triangle', 0.14, t + 0.12); this.tone(2093, 0.12, 'triangle', 0.12, t + 0.24); break;
      case 'twitch': this.noise(0.06, 2600, 'bandpass', 0.12, t, 3); this.tone(880, 0.04, 'sine', 0.06, t, 1200); break;
      case 'wild': [659, 784, 988].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.08, t + i * 0.12)); break;
      case 'perfect': [880, 1175, 1568, 2093].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.12, t + i * 0.05)); break;
      case 'tick': this.tone(2200, 0.03, 'sine', 0.04); break;
      case 'dart': this.noise(0.12, 3200, 'bandpass', 0.18, t, 3, 1200); break;
      case 'zig': this.tone(900, 0.05, 'square', 0.04); this.tone(700, 0.05, 'square', 0.04, t + 0.07); this.tone(900, 0.05, 'square', 0.04, t + 0.14); break;
      case 'dive': this.tone(320, 0.4, 'sine', 0.16, t, 90); this.noise(0.3, 600, 'lowpass', 0.12, t); break;
      case 'jumpwarn': this.tone(500, 0.35, 'triangle', 0.1, t, 1400); break;
      case 'shutter': this.noise(0.06, 5000, 'highpass', 0.2); this.tone(1200, 0.05, 'square', 0.05, t + 0.05); break;
      case 'horn': this.tone(196, 0.7, 'sawtooth', 0.07); this.tone(247, 0.7, 'sawtooth', 0.05); break;
    }
  },
  startAmbient() {
    const c = this.ctx; if (!c) return;
    const mk = (type, freq, q) => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7; const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.gAmb); s.start(); return { s, f, g }; };
    this.amb.waves = mk('lowpass', 420); this.amb.rain = mk('highpass', 2500); this.amb.wind = mk('bandpass', 600, 1.5);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.12; const lg = c.createGain(); lg.gain.value = 0.05; lfo.connect(lg); lg.connect(this.amb.waves.g.gain); lfo.start();
    const lfo2 = c.createOscillator(); lfo2.frequency.value = 0.21; const lg2 = c.createGain(); lg2.gain.value = 250; lfo2.connect(lg2); lg2.connect(this.amb.wind.f.frequency); lfo2.start();
    this.setScene(this.mode, this.wx);
  },
  setScene(mode, wx) {
    this.mode = mode; this.wx = wx || 'sunny'; if (!this.ctx || !this.amb.waves) return; const t = this.ctx.currentTime;
    const sea = mode === 'sea' || mode === 'pier' || mode === 'town' || mode === 'menu';
    this.amb.waves.g.gain.setTargetAtTime(sea ? (mode === 'town' ? 0.06 : 0.12) : 0.0, t, 0.8);
    this.amb.rain.g.gain.setTargetAtTime(this.wx === 'rain' && mode !== 'home' ? 0.07 : (this.wx === 'rain' ? 0.02 : 0), t, 0.8);
    this.amb.wind.g.gain.setTargetAtTime(this.wx === 'wind' && mode !== 'home' ? 0.08 : 0, t, 0.8);
  },
  setEngine(on, level) {
    if (!this.ctx) return; const c = this.ctx;
    if (on && !this.engine) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 48 + (level || 1) * 6; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; const g = c.createGain(); g.gain.value = 0; o.connect(f); f.connect(g); g.connect(this.gSfx); o.start(); g.gain.setTargetAtTime(0.09, c.currentTime, 0.1); this.engine = { o, g }; }
    else if (!on && this.engine) { const e = this.engine; e.g.gain.setTargetAtTime(0, c.currentTime, 0.1); setTimeout(() => { try { e.o.stop(); } catch (x) { } }, 500); this.engine = null; }
  },
  /* sakin, üretimsel müzik: pentatonik arpejler + yumuşak pad */
  PROG: {
    town: [[60, 64, 67, 71], [57, 60, 64, 67], [65, 69, 72, 76], [55, 59, 62, 67]],
    sea: [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 69]],
    home: [[53, 57, 60, 64], [55, 58, 62, 65], [57, 60, 64, 67], [52, 55, 59, 62]],
    menu: [[60, 64, 67, 72], [53, 57, 60, 65], [57, 60, 64, 69], [55, 59, 62, 67]]
  },
  schedule() {
    const c = this.ctx; if (!c || c.state !== 'running') return; const spb = 60 / 74 / 2;
    while (this.nextNote < c.currentTime + 0.5) {
      const mode = this.mode === 'pier' ? 'sea' : (this.PROG[this.mode] ? this.mode : 'town'); const prog = this.PROG[mode];
      const bar = Math.floor(this.step / 8) % prog.length, beat = this.step % 8, chord = prog[bar];
      const mf = m => 440 * Math.pow(2, (m - 69) / 12); const t = this.nextNote;
      if (beat === 0) { chord.forEach(m => this.tone(mf(m - 12), spb * 7.5, 'sine', 0.05, t, null, this.gMusic)); this.tone(mf(chord[0] - 24), spb * 4, 'triangle', 0.08, t, null, this.gMusic); }
      const pat = [0, 2, 1, 3, 2, 1, 3, 2]; const hm = hash32(this.step, mode) % 100;
      if (hm < 78) { const m = chord[pat[beat]] + (beat === 5 && hm < 30 ? 12 : 0); this.tone(mf(m), spb * 2.2, 'triangle', 0.07 + (beat % 4 === 0 ? 0.03 : 0), t, null, this.gMusic); }
      if (beat === 4 && hm < 25) this.tone(mf(chord[3] + 12), spb * 3, 'sine', 0.04, t + spb * 0.5, null, this.gMusic);
      this.nextNote += spb; this.step++;
    }
    if (this.mode !== 'home' && Math.random() < 0.012 && (this.mode === 'sea' || this.mode === 'town' || this.mode === 'pier')) { const tt = c.currentTime; this.tone(1600, 0.18, 'sine', 0.03, tt, 1100, this.gAmb); this.tone(1700, 0.2, 'sine', 0.025, tt + 0.22, 1150, this.gAmb); }
  }
};
