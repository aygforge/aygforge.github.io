// Web Audio ile tamamen sentezlenmiş ses: ortam sesleri, üretken müzik ve efektler.
// Mobil tarayıcı kuralları nedeniyle ilk kullanıcı etkileşiminde etkinleşir.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

const MUSIC = {
  menu: { bpm: 84, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], chords: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 10, 14]], lead: 0.5, pad: true },
  harbor: { bpm: 100, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], lead: 0.6, pluck: true },
  voyage: { bpm: 92, root: 62, scale: [0, 2, 3, 5, 7, 9, 10], chords: [[0, 3, 7], [10, 14, 17], [5, 9, 12], [7, 10, 14]], lead: 0.45, pluck: true, six8: true },
  danger: { bpm: 112, root: 57, scale: [0, 1, 3, 5, 7, 8, 10], chords: [[0, 3, 7], [1, 5, 8], [0, 3, 7], [-2, 2, 5]], lead: 0.35, drums: true },
  mystery: { bpm: 70, root: 59, scale: [0, 2, 3, 6, 7, 8, 11], chords: [[0, 3, 7], [6, 9, 13], [3, 7, 10], [8, 11, 15]], lead: 0.3, pad: true },
  oldfriends: { bpm: 66, root: 64, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], lead: 0.55, box: true },
  summary: { bpm: 72, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], lead: 0.4, pad: true },
};

export class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.musicMode = null;
    this.ambientMode = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.ambNodes = [];
    this.muted = false;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain();
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.ratio.value = 4;
    this.master.connect(this.comp).connect(c.destination);
    this.music = c.createGain();
    this.sfx = c.createGain();
    this.amb = c.createGain();
    this.music.connect(this.master);
    this.sfx.connect(this.master);
    this.amb.connect(this.master);
    this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolumes();
    this.timer = setInterval(() => this.schedule(), 60);
    if (this.pendingMusic) this.setMusic(this.pendingMusic);
    if (this.pendingAmb) this.setAmbient(this.pendingAmb);
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings;
    const m = this.muted ? 0 : s.master;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(m, t, 0.05);
    this.music.gain.setTargetAtTime(s.music * 0.32 * (this.duck || 1), t, 0.1);
    this.sfx.gain.setTargetAtTime(s.sfx * 0.7, t, 0.05);
    this.amb.gain.setTargetAtTime(s.sfx * 0.32, t, 0.2);
  }

  suspend(on) {
    if (!this.ctx) return;
    if (on) this.ctx.suspend();
    else this.ctx.resume();
  }

  // ───────── Müzik ─────────

  setMusic(mode) {
    if (!this.ctx) { this.pendingMusic = mode; return; }
    if (mode === this.musicMode) return;
    this.musicMode = mode;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.melody = null;
  }

  silence(sec) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setTargetAtTime(0, t, 0.15);
    this.amb.gain.setTargetAtTime(0.0, t, 0.2);
    this.silentUntil = t + sec;
    setTimeout(() => this.applyVolumes(), sec * 1000);
  }

  schedule() {
    const c = this.ctx;
    if (!c || !this.musicMode) return;
    const M = MUSIC[this.musicMode];
    if (!M) return;
    const spb = 60 / M.bpm / 2; // 8'lik
    while (this.nextTime < c.currentTime + 0.25) {
      if (!(this.silentUntil && this.nextTime < this.silentUntil)) this.playStep(M, this.step, this.nextTime, spb);
      this.nextTime += spb;
      this.step++;
    }
  }

  playStep(M, step, t, spb) {
    const barLen = M.six8 ? 6 : 8;
    const bar = Math.floor(step / barLen) % M.chords.length;
    const pos = step % barLen;
    const chord = M.chords[bar];
    // bas
    if (pos === 0 || pos === (M.six8 ? 3 : 4)) this.tone(NOTE(M.root - 24 + chord[0]), t, spb * (M.six8 ? 2.6 : 3.6), 'triangle', 0.22, this.music);
    // pad
    if (M.pad && pos === 0) for (const n of chord) this.tone(NOTE(M.root - 12 + n), t, spb * barLen, 'sine', 0.05, this.music, 0.6);
    // pluck arpej
    if (M.pluck && pos % 1 === 0) {
      const n = chord[(pos + bar) % chord.length];
      this.pluck(NOTE(M.root + n), t, 0.08);
    }
    if (M.box && pos % 2 === 0) this.tone(NOTE(M.root + 12 + chord[(pos / 2) % chord.length]), t, spb * 1.6, 'sine', 0.08, this.music);
    // melodi (yarı rastgele, ölçek içinde)
    if (pos % 2 === 0 && Math.random() < M.lead) {
      if (this.melody == null) this.melody = 2;
      this.melody = Math.max(0, Math.min(M.scale.length * 2 - 1, this.melody + Math.round((Math.random() - 0.5) * 3)));
      const deg = this.melody % M.scale.length;
      const oct = Math.floor(this.melody / M.scale.length);
      this.tone(NOTE(M.root + 12 + M.scale[deg] + 12 * oct), t, spb * (Math.random() < 0.3 ? 3 : 1.6), 'square', 0.035, this.music, 0.02, 1800);
    }
    if (M.drums) {
      if (pos % 4 === 0) this.noise(t, 0.12, 0.25, 140, this.music);
      if (pos % 4 === 2) this.noise(t, 0.05, 0.08, 3000, this.music);
    }
  }

  tone(freq, t, dur, type = 'sine', vol = 0.1, dest = this.sfx, attack = 0.01, lp = null) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o.connect(g);
    if (lp) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lp;
      g.connect(f);
      node = f;
    }
    node.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  pluck(freq, t, vol = 0.08) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(f).connect(g).connect(this.music);
    o.start(t);
    o.stop(t + 0.4);
  }

  noise(t, dur, vol, freq, dest = this.sfx, type = 'lowpass') {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }

  // ───────── Ortam ─────────

  setAmbient(mode) {
    if (!this.ctx) { this.pendingAmb = mode; return; }
    if (mode === this.ambientMode) return;
    this.ambientMode = mode;
    for (const n of this.ambNodes) { try { n.stop(); } catch { /* */ } }
    this.ambNodes = [];
    clearInterval(this.ambTimer);
    if (!mode || mode === 'none') return;
    const c = this.ctx;
    // dalga: filtrelenmiş gürültü + yavaş LFO
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = mode === 'storm' ? 900 : 520;
    const g = c.createGain();
    g.gain.value = mode === 'storm' ? 0.5 : 0.28;
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = mode === 'storm' ? 0.35 : 0.14;
    lg.gain.value = mode === 'storm' ? 0.25 : 0.16;
    lfo.connect(lg).connect(g.gain);
    src.connect(f).connect(g).connect(this.amb);
    src.start();
    lfo.start();
    this.ambNodes.push(src, lfo);
    this.ambTimer = setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (mode === 'harbor' && Math.random() < 0.25) this.gull(t);
      if (mode === 'harbor' && Math.random() < 0.05) this.tone(523, t, 1.6, 'sine', 0.03, this.amb);
      if ((mode === 'storm') && Math.random() < 0.08) this.thunder();
      if (mode === 'sea' && Math.random() < 0.08) this.gull(t, 0.5);
      if (mode === 'sea' && Math.random() < 0.1) this.creak(t);
    }, 1000);
  }

  gull(t, vol = 1) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.18);
    o.frequency.exponentialRampToValueAtTime(1300, t + 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03 * vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(this.amb);
    o.start(t);
    o.stop(t + 0.4);
  }

  creak(t) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t);
    o.frequency.linearRampToValueAtTime(130, t + 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 400;
    o.connect(f).connect(g).connect(this.amb);
    o.start(t);
    o.stop(t + 0.7);
  }

  thunder() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noise(t, 2.2, 0.5, 180, this.amb);
    this.noise(t + 0.05, 0.3, 0.3, 1200, this.amb);
  }

  // ───────── Efektler ─────────

  play(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'click': this.tone(660, t, 0.05, 'square', 0.04); break;
      case 'coin': this.tone(988, t, 0.08, 'square', 0.06); this.tone(1319, t + 0.07, 0.18, 'square', 0.06); break;
      case 'buy': this.tone(523, t, 0.08, 'triangle', 0.1); this.tone(392, t + 0.07, 0.12, 'triangle', 0.08); this.noise(t, 0.05, 0.05, 4000); break;
      case 'sell': for (let i = 0; i < 3; i++) this.tone(1200 + i * 220, t + i * 0.05, 0.1, 'square', 0.05); break;
      case 'damage': this.noise(t, 0.4, 0.5, 600); this.tone(80, t, 0.4, 'sine', 0.35); break;
      case 'repair': for (let i = 0; i < 3; i++) { this.noise(t + i * 0.16, 0.06, 0.3, 2500, this.sfx, 'bandpass'); this.tone(320, t + i * 0.16, 0.08, 'triangle', 0.06); } break;
      case 'event': this.noise(t, 0.5, 0.12, 1200, this.sfx, 'bandpass'); this.tone(784, t + 0.15, 0.6, 'sine', 0.06); this.tone(1175, t + 0.25, 0.7, 'sine', 0.04); break;
      case 'danger': this.tone(110, t, 0.7, 'sawtooth', 0.08, this.sfx, 0.05, 600); this.tone(104, t + 0.3, 0.8, 'sawtooth', 0.07, this.sfx, 0.05, 600); break;
      case 'success': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.08, 0.3, 'triangle', 0.08)); break;
      case 'fail': [392, 330, 262].forEach((f, i) => this.tone(f, t + i * 0.12, 0.35, 'triangle', 0.08)); break;
      case 'achievement': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, t + i * 0.09, 0.5, 'square', 0.045)); break;
      case 'bark': this.noise(t, 0.08, 0.25, 900, this.sfx, 'bandpass'); this.tone(320, t, 0.08, 'sawtooth', 0.05); this.noise(t + 0.16, 0.08, 0.2, 900, this.sfx, 'bandpass'); break;
      case 'meow': { const c = this.ctx; const o = c.createOscillator(); const g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(700, t); o.frequency.linearRampToValueAtTime(1000, t + 0.15); o.frequency.linearRampToValueAtTime(600, t + 0.4); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45); o.connect(g).connect(this.sfx); o.start(t); o.stop(t + 0.5); break; }
      case 'page': this.noise(t, 0.15, 0.08, 3000, this.sfx, 'highpass'); break;
      case 'splash': this.noise(t, 0.6, 0.3, 1500, this.sfx, 'bandpass'); break;
      case 'depart': this.tone(196, t, 0.8, 'sawtooth', 0.05, this.sfx, 0.1, 700); this.tone(247, t + 0.1, 0.8, 'sawtooth', 0.04, this.sfx, 0.1, 700); break;
      case 'oldfriends': [659, 784, 988, 1175, 988, 1319].forEach((f, i) => this.tone(f, t + i * 0.32, 1.4, 'sine', 0.07)); break;
      case 'cannon': this.noise(t, 0.5, 0.6, 400); this.tone(60, t, 0.5, 'sine', 0.4); break;
      case 'impact': this.noise(t, 0.35, 0.5, 900); this.tone(90, t, 0.3, 'square', 0.12); break;
      case 'hook': this.tone(900, t, 0.06, 'square', 0.05); this.noise(t + 0.05, 0.1, 0.15, 3000, this.sfx, 'highpass'); break;
      case 'pickup': this.tone(520, t, 0.06, 'triangle', 0.08); this.tone(660, t + 0.05, 0.06, 'triangle', 0.06); break;
      case 'dock': this.tone(220, t, 1.2, 'sine', 0.06); this.tone(330, t + 0.3, 1.0, 'sine', 0.05); this.creak(t + 0.2); break;
      case 'anchor': for (let i = 0; i < 6; i++) this.noise(t + i * 0.07, 0.05, 0.2, 2500, this.sfx, 'bandpass'); this.noise(t + 0.5, 0.5, 0.3, 800); break;
      case 'ghost': this.tone(220, t, 2, 'sine', 0.06, this.sfx, 0.5); this.tone(233, t, 2, 'sine', 0.05, this.sfx, 0.5); break;
      case 'chest': this.tone(300, t, 0.1, 'square', 0.06); [784, 988, 1175].forEach((f, i) => this.tone(f, t + 0.15 + i * 0.07, 0.3, 'triangle', 0.06)); break;
      case 'flag': this.noise(t, 0.4, 0.15, 1500, this.sfx, 'bandpass'); break;
      case 'thunder': this.thunder(); break;
      case 'bell': [0, 1.1].forEach((d) => { this.tone(392, t + d, 2.2, 'sine', 0.08); this.tone(784, t + d, 1.2, 'sine', 0.03); this.tone(1176, t + d, 0.6, 'sine', 0.015); }); break;
      case 'magic': [880, 1175, 1397, 1760, 2093].forEach((f, i) => this.tone(f, t + i * 0.07, 0.6, 'sine', 0.035)); break;
      case 'squawk': for (let i = 0; i < 2; i++) { this.tone(1400 - i * 300, t + i * 0.12, 0.09, 'sawtooth', 0.04); this.noise(t + i * 0.12, 0.08, 0.1, 2500, this.sfx, 'bandpass'); } break;
      case 'horn': this.tone(110, t, 1.4, 'sawtooth', 0.06, this.sfx, 0.2, 400); this.tone(165, t, 1.4, 'sawtooth', 0.04, this.sfx, 0.2, 400); break;
      case 'creak': this.creak(t); break;
      case 'gull': this.gull(t, 1); break;
      case 'roar': this.noise(t, 1.4, 0.45, 300); this.tone(55, t, 1.3, 'sawtooth', 0.12, this.sfx, 0.1, 200); break;
      case 'whistle': this.tone(1568, t, 0.25, 'sine', 0.05); this.tone(1976, t + 0.25, 0.35, 'sine', 0.05); break;
      case 'cheer': for (let i = 0; i < 5; i++) this.noise(t + i * 0.08, 0.3, 0.08, 1800 + i * 200, this.sfx, 'bandpass'); [523, 659, 784].forEach((f, i) => this.tone(f, t + 0.2 + i * 0.06, 0.25, 'triangle', 0.05)); break;
      case 'dice': for (let i = 0; i < 4; i++) this.noise(t + i * 0.07, 0.03, 0.2, 3500, this.sfx, 'highpass'); break;
      case 'drum': for (let i = 0; i < 4; i++) this.tone(70, t + i * 0.28, 0.2, 'sine', 0.25); break;
      case 'error': this.tone(180, t, 0.12, 'square', 0.05); this.tone(140, t + 0.1, 0.15, 'square', 0.05); break;
    }
  }
}
