// Ses yöneticisi — Tides'ın WebAudio yapısı (master/music/sfx/amb kanalları, kompresör, gürültü tamponu, zamanlayıcı)
// Orta Çağ sesleri tamamen sentezlenir; dış dosya veya bağlantı gerekmez.
export class Audio {
  constructor(settings) { this.settings = settings; this.ctx = null; this.musicMode = null; this.step = 0; this.nextTime = 0; this.timer = null; this.ambMode = null; this.ambNodes = []; this.last = {}; }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const c = (this.ctx = new A());
    this.master = c.createGain(); this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -16; this.comp.ratio.value = 4;
    this.master.connect(this.comp).connect(c.destination);
    this.music = c.createGain(); this.sfx = c.createGain(); this.amb = c.createGain();
    this.music.connect(this.master); this.sfx.connect(this.master); this.amb.connect(this.master);
    this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolumes();
    this.timer = setInterval(() => this.schedule(), 60);
    if (this.pendingMusic) this.setMusic(this.pendingMusic);
    if (this.pendingAmb) this.setAmbient(this.pendingAmb);
  }
  applyVolumes() {
    if (!this.ctx) return; const s = this.settings, t = this.ctx.currentTime, m = s.muted ? 0 : s.master;
    this.master.gain.setTargetAtTime(m, t, 0.05); this.music.gain.setTargetAtTime(s.music * 0.3, t, 0.1); this.sfx.gain.setTargetAtTime(s.sfx * 0.7, t, 0.05); this.amb.gain.setTargetAtTime(s.sfx * 0.25, t, 0.2);
  }
  suspend(on) { if (this.ctx) on ? this.ctx.suspend() : this.ctx.resume(); }
  // ——— temel üreteçler ———
  tone(freq, dur, { type = 'triangle', vol = 0.3, at = 0, slide = 0, attack = 0.005, dest = this.sfx } = {}) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  burst(dur, { freq = 1200, q = 1, vol = 0.3, at = 0, type = 'bandpass', slide = 0, dest = this.sfx } = {}) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.setValueAtTime(freq, t); if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur); f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f).connect(g).connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  pluck(freq, at = 0, vol = 0.18, dest = this.music) { this.tone(freq, 0.6, { type: 'triangle', vol, at, dest }); this.tone(freq * 2, 0.25, { type: 'sine', vol: vol * 0.3, at, dest }); }
  play(name) {
    if (!this.ctx || this.settings.muted) return;
    const now = this.ctx.currentTime; if (this.last[name] && now - this.last[name] < 0.04) return; this.last[name] = now;
    const T = (f, d, o) => this.tone(f, d, o), B = (d, o) => this.burst(d, o);
    switch (name) {
      case 'slash': B(0.16, { freq: 3000, q: 2, vol: 0.35, slide: 0.4 }); T(900, 0.08, { type: 'square', vol: 0.05, slide: 0.5 }); break;
      case 'heavy': B(0.25, { freq: 400, q: 1, vol: 0.5, slide: 0.5 }); T(90, 0.3, { type: 'sine', vol: 0.4, slide: 0.6 }); break;
      case 'sweep': B(0.35, { freq: 1800, q: 1.2, vol: 0.3, slide: 0.3 }); break;
      case 'hit': case 'enemyHit': B(0.1, { freq: 900, q: 1, vol: 0.35 }); T(140, 0.12, { type: 'square', vol: 0.12, slide: 0.6 }); break;
      case 'hurt': B(0.12, { freq: 600, vol: 0.4 }); T(220, 0.2, { type: 'sawtooth', vol: 0.12, slide: 0.5 }); break;
      case 'shield': case 'clang': case 'metal': T(1400, 0.25, { type: 'square', vol: 0.08 }); T(2100, 0.2, { type: 'triangle', vol: 0.08 }); B(0.08, { freq: 4000, q: 4, vol: 0.2 }); break;
      case 'draw': B(0.3, { freq: 5000, q: 6, vol: 0.12, slide: 1.6 }); break;
      case 'coins': case 'clink': case 'plink': case 'jingle': for (let i = 0; i < 4; i++) T(2200 + Math.random() * 1400, 0.12, { type: 'square', vol: 0.05, at: i * 0.045 }); break;
      case 'chest': T(300, 0.3, { type: 'sawtooth', vol: 0.06, slide: 1.8 }); for (let i = 0; i < 3; i++) T(880 * (1 + i * 0.26), 0.3, { vol: 0.1, at: 0.15 + i * 0.07 }); break;
      case 'pickup': T(660, 0.1, { vol: 0.15 }); T(990, 0.15, { vol: 0.15, at: 0.08 }); break;
      case 'rare': [523, 659, 784, 1046].forEach((f, i) => T(f, 0.35, { vol: 0.14, at: i * 0.08 })); break;
      case 'success': [392, 523, 659].forEach((f, i) => T(f, 0.3, { vol: 0.14, at: i * 0.07 })); break;
      case 'fail': [330, 262].forEach((f, i) => T(f, 0.35, { type: 'square', vol: 0.06, at: i * 0.12 })); break;
      case 'death': [262, 220, 175, 131].forEach((f, i) => T(f, 0.6, { type: 'sawtooth', vol: 0.08, at: i * 0.22 })); break;
      case 'fanfare': case 'horn': [392, 392, 523, 659, 784].forEach((f, i) => T(f, 0.28, { type: 'sawtooth', vol: 0.06, at: i * 0.11 })); break;
      case 'cheer': for (let i = 0; i < 6; i++) B(0.3, { freq: 700 + i * 200, q: 3, vol: 0.08, at: i * 0.05 }); break;
      case 'shout': case 'roar': B(0.4, { freq: name === 'roar' ? 260 : 700, q: 2, vol: 0.35, slide: 0.6 }); T(name === 'roar' ? 70 : 200, 0.4, { type: 'sawtooth', vol: 0.12, slide: 0.7 }); break;
      case 'growl': case 'snort': T(90, 0.5, { type: 'sawtooth', vol: 0.15, slide: 0.8 }); B(0.4, { freq: 300, vol: 0.12 }); break;
      case 'howl': T(500, 1.2, { type: 'sine', vol: 0.14, slide: 1.4, attack: 0.3 }); T(505, 1.2, { type: 'sine', vol: 0.08, slide: 1.35, attack: 0.3 }); break;
      case 'bark': case 'whine': T(name === 'bark' ? 400 : 900, 0.12, { type: 'square', vol: 0.08, slide: 0.6 }); break;
      case 'hiss': B(0.5, { freq: 6000, q: 1, vol: 0.15, type: 'highpass' }); break;
      case 'bones': case 'crack': case 'snap': case 'click': for (let i = 0; i < 3; i++) B(0.04, { freq: 2500, q: 5, vol: 0.25, at: i * 0.06 }); break;
      case 'crumble': case 'stone': case 'rumble': B(0.8, { freq: 200, q: 0.7, vol: 0.4, slide: 0.5 }); break;
      case 'crash': case 'thud': B(0.3, { freq: 300, vol: 0.45, slide: 0.4 }); T(80, 0.3, { type: 'sine', vol: 0.3 }); break;
      case 'fire': case 'crackle': for (let i = 0; i < 8; i++) B(0.05, { freq: 1500 + Math.random() * 2000, q: 3, vol: 0.12, at: Math.random() * 0.6 }); B(0.7, { freq: 500, vol: 0.12 }); break;
      case 'splash': case 'river': case 'pour': B(0.5, { freq: 1500, q: 0.8, vol: 0.3, slide: 0.5 }); break;
      case 'wind': case 'whoosh': case 'whisper': B(name === 'wind' ? 1.2 : 0.4, { freq: name === 'whisper' ? 2500 : 700, q: 2, vol: 0.18, slide: 1.4 }); break;
      case 'thunder': B(1.4, { freq: 120, q: 0.5, vol: 0.6, slide: 0.6, type: 'lowpass' }); break;
      case 'chime': case 'rune': case 'zap': [1046, 1318, 1568].forEach((f, i) => T(f, 0.6, { type: 'sine', vol: 0.08, at: i * 0.06 })); break;
      case 'magic': case 'hum': T(220, 0.8, { type: 'sine', vol: 0.1, attack: 0.2 }); T(330, 0.8, { type: 'sine', vol: 0.06, attack: 0.2 }); break;
      case 'heal': [523, 784, 1046].forEach((f, i) => T(f, 0.5, { type: 'sine', vol: 0.1, at: i * 0.09 })); break;
      case 'poof': B(0.35, { freq: 800, q: 0.6, vol: 0.3, slide: 0.4 }); break;
      case 'bell': T(330, 2, { type: 'sine', vol: 0.18 }); T(660, 1.6, { type: 'sine', vol: 0.08 }); T(830, 1.2, { type: 'sine', vol: 0.05 }); break;
      case 'arrow': B(0.18, { freq: 3500, q: 3, vol: 0.18, slide: 0.5 }); break;
      case 'lute': case 'aria': [392, 494, 587, 784].forEach((f, i) => this.pluck(f, i * 0.12, 0.12, this.sfx)); break;
      case 'honk': case 'bray': case 'baa': case 'neigh': case 'caw': case 'squeak': { const f = { honk: 330, bray: 220, baa: 440, neigh: 600, caw: 700, squeak: 1600 }[name]; T(f, 0.25, { type: 'sawtooth', vol: 0.08, slide: name === 'neigh' ? 1.5 : 0.8 }); if (name === 'bray') T(f * 1.5, 0.25, { type: 'sawtooth', vol: 0.06, at: 0.25, slide: 0.7 }); break; }
      case 'munch': case 'gulp': case 'squelch': case 'bubble': for (let i = 0; i < 3; i++) B(0.06, { freq: 400 + i * 150, q: 2, vol: 0.18, at: i * 0.1 }); break;
      case 'page': case 'rustle': case 'cloth': case 'rip': case 'chalk': case 'seal': case 'dig': B(0.2, { freq: 2500, q: 0.8, vol: 0.12 }); break;
      case 'hammer': case 'anvil': case 'pick': case 'grind': T(1800, 0.2, { type: 'square', vol: 0.07 }); B(0.06, { freq: 3000, q: 3, vol: 0.2 }); break;
      case 'wood': case 'creak': case 'rope': case 'chain': case 'clank': T(180, 0.25, { type: 'sawtooth', vol: 0.06, slide: 1.3 }); break;
      case 'pan': case 'gong': T(500, 0.8, { type: 'square', vol: 0.06 }); T(745, 0.8, { type: 'triangle', vol: 0.08 }); break;
      case 'wail': T(700, 1, { type: 'sine', vol: 0.1, slide: 0.6, attack: 0.2 }); break;
      case 'groan': case 'cough': case 'snore': T(110, 0.5, { type: 'sawtooth', vol: 0.08, slide: 0.8 }); break;
      case 'shatter': case 'glass': case 'ice': for (let i = 0; i < 6; i++) T(2500 + Math.random() * 2500, 0.15, { type: 'square', vol: 0.04, at: i * 0.03 }); break;
      case 'buzz': T(220, 0.5, { type: 'sawtooth', vol: 0.06 }); break;
      case 'bat': for (let i = 0; i < 5; i++) T(3000, 0.04, { type: 'square', vol: 0.03, at: i * 0.07 }); break;
      case 'tick': for (let i = 0; i < 4; i++) B(0.02, { freq: 4000, q: 8, vol: 0.2, at: i * 0.25 }); break;
      case 'hooves': for (let i = 0; i < 6; i++) B(0.05, { freq: 500, q: 2, vol: 0.25, at: i * 0.11 }); break;
      case 'steps': for (let i = 0; i < 3; i++) B(0.04, { freq: 700, q: 1.5, vol: 0.1, at: i * 0.3 }); break;
      case 'throw': case 'pop': B(0.12, { freq: 2000, q: 2, vol: 0.15, slide: 0.6 }); break;
      case 'mill': T(120, 1, { type: 'sawtooth', vol: 0.04 }); break;
      case 'echo': for (let i = 0; i < 3; i++) T(440, 0.3, { type: 'sawtooth', vol: 0.06 / (i + 1), at: i * 0.25 }); break;
      case 'danger': T(196, 0.5, { type: 'sawtooth', vol: 0.06 }); T(185, 0.5, { type: 'sawtooth', vol: 0.06, at: 0.25 }); break;
      case 'event': T(660, 0.18, { vol: 0.08 }); T(880, 0.25, { vol: 0.08, at: 0.12 }); break;
      case 'town': [262, 330, 392, 523].forEach((f, i) => this.pluck(f, i * 0.15, 0.12, this.sfx)); break;
      case 'ui': T(880, 0.05, { type: 'square', vol: 0.04 }); break;
      case 'quest': [523, 659, 784, 1046, 784].forEach((f, i) => T(f, 0.25, { vol: 0.1, at: i * 0.08 })); break;
      default: B(0.1, { freq: 1000, vol: 0.12 });
    }
  }
  // ——— Müzik: dorian/aeolian modlarda prosedürel lavta ezgisi + bas burdon ———
  setMusic(mode) { if (!this.ctx) { this.pendingMusic = mode; return; } if (mode !== this.musicMode) { this.musicMode = mode; this.step = 0; this.nextTime = this.ctx.currentTime + 0.1; this.phrase = null; } }
  schedule() {
    if (!this.ctx || !this.musicMode || this.settings.muted) return;
    const c = this.ctx, modes = { road: { root: 196, scale: [0, 2, 3, 5, 7, 9, 10], tempo: 0.32 }, town: { root: 262, scale: [0, 2, 4, 5, 7, 9, 11], tempo: 0.28 }, danger: { root: 165, scale: [0, 1, 3, 5, 7, 8, 10], tempo: 0.22 }, menu: { root: 220, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 0.38 }, combat: { root: 147, scale: [0, 1, 3, 5, 7, 8, 10], tempo: 0.18 } };
    const M = modes[this.musicMode] || modes.road;
    while (this.nextTime < c.currentTime + 0.3) {
      if (!this.phrase || this.step % 16 === 0) { this.phrase = Array.from({ length: 16 }, (_, i) => (i % 4 === 3 && Math.random() < 0.5) ? null : M.scale[Math.floor(Math.random() * M.scale.length)] + (Math.random() < 0.2 ? 12 : 0)); }
      const at = this.nextTime - c.currentTime, n = this.phrase[this.step % 16];
      if (n != null) this.pluck(M.root * Math.pow(2, n / 12), at, 0.09);
      if (this.step % 8 === 0) this.tone(M.root / 2, M.tempo * 8, { type: 'sine', vol: 0.06, at, dest: this.music, attack: 0.2 });
      if (this.musicMode === 'combat' && this.step % 2 === 0) this.burst(0.06, { freq: 200, q: 1, vol: 0.12, at, dest: this.music });
      this.step++; this.nextTime += M.tempo;
    }
  }
  setAmbient(mode) {
    if (!this.ctx) { this.pendingAmb = mode; return; }
    if (mode === this.ambMode) return; this.ambMode = mode;
    for (const n of this.ambNodes) { try { n.stop(); } catch {} } this.ambNodes = [];
    if (!mode || mode === 'none') return;
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.loop = true; f.type = mode === 'rain' ? 'highpass' : 'lowpass'; f.frequency.value = mode === 'rain' ? 1500 : mode === 'town' ? 600 : 350; g.gain.value = mode === 'rain' ? 0.35 : 0.18;
    s.connect(f).connect(g).connect(this.amb); s.start(); this.ambNodes.push(s);
  }
}
