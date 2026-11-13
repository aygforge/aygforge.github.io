// Tamamen özgün, çalışma zamanında Web Audio ile üretilen müzik ve efektler (harici dosya yok).
// AudioContext ilk kullanıcı etkileşiminde açılır. Ana/müzik/ortam/efekt ayrı ayarlanır.
export class Audio {
  constructor(settings = {}) { this.vol = { master: 0.7, music: 0.5, ambient: 0.5, sfx: 0.8, ...(settings.vol || {}) }; this.ctx = null; this.mood = 'morning'; this.step = 0; this.amb = null; }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC(); const c = this.ctx; this.master = c.createGain(); this.master.connect(c.destination);
    this.bus = {}; for (const k of ['music', 'ambient', 'sfx']) { this.bus[k] = c.createGain(); this.bus[k].connect(this.master); }
    const len = c.sampleRate; this.noise = c.createBuffer(1, len, c.sampleRate); const d = this.noise.getChannelData(0); let s = 1234567; for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff) - 1; }
    this.applyVol(); this.timer = setInterval(() => this.tickMusic(), 300);
  }
  applyVol() { if (!this.ctx) return; this.master.gain.value = this.vol.master; for (const k of ['music', 'ambient', 'sfx']) this.bus[k].gain.value = this.vol[k]; }
  setVol(k, v) { this.vol[k] = v; this.applyVol(); }
  tone(freq, dur, { type = 'triangle', vol = 0.15, bus = 'sfx', slide = 0, delay = 0, attack = 0.01 } = {}) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.bus[bus]); o.start(t); o.stop(t + dur + 0.05);
  }
  hiss(dur, { vol = 0.12, freq = 1200, q = 0.8, bus = 'sfx', delay = 0, type = 'bandpass' } = {}) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + delay; const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); src.connect(f); f.connect(g); g.connect(this.bus[bus]); src.start(t); src.stop(t + dur + 0.05);
  }
  sfx(name) {
    if (!this.ctx) return; const T = (...a) => this.tone(...a), H = (...a) => this.hiss(...a);
    switch (name) {
      case 'step': H(0.05, { vol: 0.035, freq: 500, q: 1.5 }); break;
      case 'chop': H(0.09, { vol: 0.2, freq: 900 }); T(170, 0.1, { type: 'square', vol: 0.08, slide: -80 }); break;
      case 'mine': H(0.06, { vol: 0.18, freq: 2600, q: 3 }); T(900, 0.07, { type: 'square', vol: 0.05, slide: -300 }); break;
      case 'pick': T(520, 0.07, { vol: 0.1 }); T(780, 0.09, { vol: 0.1, delay: 0.06 }); break;
      case 'dig': H(0.12, { vol: 0.12, freq: 400 }); break;
      case 'water': H(0.35, { vol: 0.08, freq: 2400, q: 0.5 }); break;
      case 'ui': T(660, 0.05, { vol: 0.06 }); break;
      case 'open': T(440, 0.06, { vol: 0.07 }); T(660, 0.08, { vol: 0.07, delay: 0.05 }); break;
      case 'error': T(160, 0.16, { type: 'square', vol: 0.07, slide: -40 }); break;
      case 'coin': T(1250, 0.07, { type: 'square', vol: 0.06 }); T(1660, 0.16, { type: 'square', vol: 0.06, delay: 0.07 }); break;
      case 'plate': T(1900, 0.05, { vol: 0.05 }); H(0.04, { vol: 0.05, freq: 5000, q: 4 }); break;
      case 'sizzle': H(0.7, { vol: 0.06, freq: 4200, q: 0.6 }); break;
      case 'ding': T(1320, 0.5, { type: 'sine', vol: 0.12 }); T(1980, 0.4, { type: 'sine', vol: 0.06, delay: 0.02 }); break;
      case 'craft': for (let i = 0; i < 3; i++) { H(0.05, { vol: 0.14, freq: 1500, delay: i * 0.14 }); T(240, 0.05, { type: 'square', vol: 0.05, delay: i * 0.14 }); } break;
      case 'place': T(200, 0.08, { type: 'square', vol: 0.08, slide: -60 }); H(0.05, { vol: 0.08, freq: 700 }); break;
      case 'clean': H(0.18, { vol: 0.07, freq: 3000, q: 0.7 }); H(0.18, { vol: 0.07, freq: 2600, q: 0.7, delay: 0.22 }); break;
      case 'quest': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.22, { vol: 0.09, delay: i * 0.09 })); break;
      case 'whistle': T(880, 0.5, { type: 'square', vol: 0.07, bus: 'ambient' }); T(1108, 0.5, { type: 'square', vol: 0.05, bus: 'ambient' }); T(880, 0.9, { type: 'square', vol: 0.07, delay: 0.6, bus: 'ambient' }); T(1108, 0.9, { type: 'square', vol: 0.05, delay: 0.6, bus: 'ambient' }); break;
      case 'brake': H(1.6, { vol: 0.1, freq: 3200, q: 6, bus: 'ambient' }); H(1.2, { vol: 0.12, freq: 300, q: 0.5, bus: 'ambient' }); break;
      case 'chug': for (let i = 0; i < 8; i++) H(0.12, { vol: 0.1 * (1 - i / 10), freq: 260, q: 0.8, delay: i * (0.3 - i * 0.02), bus: 'ambient' }); break;
      case 'door': T(140, 0.12, { type: 'square', vol: 0.06 }); H(0.08, { vol: 0.06, freq: 500 }); break;
      case 'sleep': [392, 330, 262].forEach((f, i) => T(f, 0.5, { type: 'sine', vol: 0.09, delay: i * 0.28 })); break;
      case 'splash': H(0.3, { vol: 0.12, freq: 1800, q: 0.5 }); break;
      case 'fire': H(0.4, { vol: 0.08, freq: 700, q: 0.4 }); break;
    }
  }
  // Basit cozy sıralayıcı: günün vaktine göre dizi ve tempo (sabah/öğle/akşam/gece)
  setMood(m) { this.mood = m; }
  setAmbient(kind) { this.ambKind = kind; }
  tickMusic() {
    if (!this.ctx || this.ctx.state !== 'running') return; const i = this.step++;
    const M = { morning: { scale: [262, 294, 330, 392, 440, 523, 587], pat: [0, 2, 4, 5, 4, 2, 3, 1, 0, 4, 2, 5, 6, 5, 4, 2], bass: [131, 131, 175, 196], every: 1 }, noon: { scale: [294, 330, 370, 440, 494, 587, 659], pat: [0, 3, 4, 3, 5, 4, 2, 0, 1, 3, 5, 6, 5, 3, 4, 2], bass: [147, 196, 220, 147], every: 1 }, evening: { scale: [220, 262, 294, 330, 392, 440, 523], pat: [4, 2, 0, 2, 3, 1, 0, -1, 4, 5, 3, 2, 1, 0, 2, -1], bass: [110, 131, 147, 165], every: 2 }, night: { scale: [196, 233, 262, 294, 349, 392, 466], pat: [0, -1, 2, -1, 4, -1, 2, -1, 3, -1, 1, -1, 0, -1, -1, -1], bass: [98, 117, 131, 98], every: 2 } }[this.mood] || null;
    if (M && i % M.every === 0) { const k = (i / M.every) | 0; const n = M.pat[k % M.pat.length]; if (n >= 0) this.tone(M.scale[n], 0.5, { type: 'triangle', vol: 0.05, bus: 'music', attack: 0.02 }); if (k % 4 === 0) this.tone(M.bass[(k / 4 | 0) % M.bass.length], 1.1, { type: 'sine', vol: 0.06, bus: 'music', attack: 0.05 }); if (k % 8 === 4) this.tone(M.scale[(n + 2 + 7) % 7] * 2, 0.3, { type: 'sine', vol: 0.02, bus: 'music' }); }
    // ortam: yağmur/kar/orman kuşu/rüzgâr
    if (this.ambKind === 'rain' && i % 2 === 0) this.hiss(0.7, { vol: 0.05, freq: 3000, q: 0.3, bus: 'ambient' });
    else if (this.ambKind === 'snow' && i % 6 === 0) this.hiss(1.6, { vol: 0.03, freq: 500, q: 0.3, bus: 'ambient' });
    else if (this.ambKind === 'forest' && i % 13 === 0) { const f = 2200 + (i * 97) % 900; this.tone(f, 0.09, { type: 'sine', vol: 0.03, bus: 'ambient', slide: 300 }); this.tone(f * 1.1, 0.09, { type: 'sine', vol: 0.03, bus: 'ambient', delay: 0.13, slide: -200 }); }
    else if (this.ambKind === 'indoor' && i % 23 === 0) this.hiss(0.25, { vol: 0.015, freq: 900, q: 0.4, bus: 'ambient' });
  }
}
