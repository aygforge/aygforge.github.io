// Original procedural audio (Web Audio API). No external/copyrighted sound files.
// Music: generative "dark fantasy ambient + medieval" score with chord progressions, pad,
// drone, plucked harp arpeggios, flute-like melodic phrases, frame drums and a choir pad.

const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MODES = { aeolian: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11] };

const THEMES = {
  menu:    { root: 50, mode: 'aeolian', bpm: 64, prog: [0, 5, 2, 6], pad: 0.9, harp: 0.5, flute: 0.35, drum: 0, choir: 0.4 },
  hub:     { root: 55, mode: 'dorian', bpm: 84, prog: [0, 3, 0, 4], pad: 0.6, harp: 0.8, flute: 0.5, drum: 0.25, choir: 0 },
  meadow:  { root: 52, mode: 'dorian', bpm: 92, prog: [0, 6, 3, 4], pad: 0.6, harp: 0.7, flute: 0.4, drum: 0.35, choir: 0 },
  forest:  { root: 50, mode: 'aeolian', bpm: 80, prog: [0, 5, 6, 4], pad: 0.8, harp: 0.6, flute: 0.3, drum: 0.25, choir: 0.25 },
  forge:   { root: 45, mode: 'phrygian', bpm: 100, prog: [0, 1, 0, 6], pad: 0.7, harp: 0.4, flute: 0.2, drum: 0.6, choir: 0.2 },
  dungeon: { root: 47, mode: 'harmonic', bpm: 72, prog: [0, 5, 3, 4], pad: 0.9, harp: 0.35, flute: 0.2, drum: 0.3, choir: 0.6 },
  boss:    { root: 45, mode: 'harmonic', bpm: 128, prog: [0, 5, 1, 4], pad: 0.7, harp: 0.6, flute: 0, drum: 1, choir: 0.5 },
  rare:    { root: 57, mode: 'dorian', bpm: 110, prog: [0, 4, 5, 3], pad: 0.6, harp: 0.9, flute: 0.6, drum: 0.6, choir: 0.4 },
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.vol = { music: 0.55, sfx: 0.7, ui: 0.6, muted: false };
    this.theme = null;
    this.wanted = 'menu';
    this.nextTime = 0;
    this.step = 0;
    this.motif = null;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain(); this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain(); this.sfxBus = ctx.createGain(); this.uiBus = ctx.createGain();
    // reverb from generated impulse
    const len = ctx.sampleRate * 2.6;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.reverb = ctx.createConvolver(); this.reverb.buffer = ir;
    this.revGain = ctx.createGain(); this.revGain.gain.value = 0.45;
    this.reverb.connect(this.revGain); this.revGain.connect(this.master);
    for (const b of [this.musicBus, this.sfxBus, this.uiBus]) { b.connect(this.master); }
    this.musicBus.connect(this.reverb);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = this.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.applyVolumes();
    this.timer = setInterval(() => this.schedule(), 90);
    if (this.wanted) this.playMusic(this.wanted, true);
  }

  setVolumes(v) { Object.assign(this.vol, v); this.applyVolumes(); }
  applyVolumes() {
    if (!this.ctx) return;
    const m = this.vol.muted ? 0 : 1;
    this.master.gain.value = m;
    this.musicBus.gain.value = this.vol.music * 0.5;
    this.sfxBus.gain.value = this.vol.sfx * 0.6;
    this.uiBus.gain.value = this.vol.ui * 0.6;
  }

  playMusic(name, force = false) {
    this.wanted = name;
    if (!this.ctx) return;
    if (!force && this.theme && this.theme.name === name) return;
    const t = THEMES[name] || THEMES.menu;
    // crossfade: drop the bus briefly
    const g = this.musicBus.gain, now = this.ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0.0001, now + 0.8);
    g.linearRampToValueAtTime(this.vol.music * 0.5, now + 2.4);
    this.theme = { ...t, name, scale: MODES[t.mode] };
    this.nextTime = now + 0.9;
    this.step = 0;
    this.motif = this.makeMotif();
  }

  makeMotif() {
    const m = [];
    let deg = 4;
    for (let i = 0; i < 8; i++) { deg = Math.max(0, Math.min(9, deg + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)])); m.push(Math.random() < 0.25 ? null : deg); }
    return m;
  }

  deg(d, oct = 0) {
    const s = this.theme.scale;
    const o = Math.floor(d / 7);
    return this.theme.root + s[((d % 7) + 7) % 7] + 12 * (o + oct);
  }

  schedule() {
    if (!this.ctx || !this.theme || this.vol.muted) return;
    const ahead = this.ctx.currentTime + 0.35;
    const th = this.theme;
    const eighth = 60 / th.bpm / 2;
    while (this.nextTime < ahead) {
      const s = this.step;
      const bar = Math.floor(s / 8);
      const chordDeg = th.prog[Math.floor(bar / 2) % th.prog.length];
      const t = this.nextTime;
      const inBar = s % 8;
      if (s % 16 === 0) {
        const dur = eighth * 16;
        if (th.pad) for (const d of [0, 2, 4]) this.pad(NOTE(this.deg(chordDeg + d)), t, dur, th.pad * 0.05);
        this.drone(NOTE(this.deg(chordDeg, -1)), t, dur, 0.09);
        if (th.choir) this.choir(NOTE(this.deg(chordDeg + 4, 1)), t, dur, th.choir * 0.03);
        if (bar % 8 === 0) this.motif = Math.random() < 0.5 ? this.motif : this.makeMotif();
      }
      if (th.harp && Math.random() < 0.55 + th.harp * 0.4) {
        const pattern = [0, 2, 4, 7, 4, 2, 4, 9];
        const d = chordDeg + pattern[inBar];
        if (!(inBar % 2) || Math.random() < 0.6) this.pluck(NOTE(this.deg(d, 1)), t, th.harp * 0.07);
      }
      if (th.flute && bar % 4 >= 2 && inBar % 2 === 0) {
        const m = this.motif[(Math.floor(s / 2)) % 8];
        if (m != null && Math.random() < 0.85) this.flute(NOTE(this.deg(chordDeg + m, 1)), t, eighth * 2, th.flute * 0.05);
      }
      if (th.drum) {
        if (inBar === 0 || inBar === 4) this.drum(t, 0.5 * th.drum, 70);
        if (th.drum > 0.5 && (inBar === 3 || inBar === 6 || inBar === 7)) this.drum(t, 0.25 * th.drum, 110);
        if (inBar % 2 === 1 && Math.random() < th.drum) this.shaker(t, 0.05 * th.drum);
      }
      this.nextTime += eighth;
      this.step++;
    }
  }

  env(g, t, a, peak, dur, rel = 0.3) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  pad(f, t, dur, v) {
    const c = this.ctx;
    const g = c.createGain(); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.7;
    for (const det of [-7, 7]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); }
    lp.connect(g); g.connect(this.musicBus);
    this.env(g, t, 1.6, v, dur, 1.2);
  }
  drone(f, t, dur, v) {
    const c = this.ctx; const g = c.createGain();
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f / 2;
    o.connect(g); o2.connect(g); g.connect(this.musicBus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
    this.env(g, t, 0.8, v, dur, 0.8);
  }
  choir(f, t, dur, v) {
    const c = this.ctx; const g = c.createGain();
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    for (const [freq, q] of [[f, 30], [f * 2, 25], [800, 6]]) {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q; src.connect(bp); bp.connect(g);
    }
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const og = c.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(g);
    g.connect(this.musicBus);
    src.start(t); o.start(t); src.stop(t + dur + 0.1); o.stop(t + dur + 0.1);
    this.env(g, t, 2.0, v * 3, dur, 1.5);
  }
  pluck(f, t, v) {
    const c = this.ctx; const g = c.createGain();
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = f * 2; const g2 = c.createGain(); g2.gain.value = 0.08;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(4000, t); lp.frequency.exponentialRampToValueAtTime(600, t + 0.6);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(this.musicBus);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.start(t); o2.start(t); o.stop(t + 1.5); o2.stop(t + 1.5);
  }
  flute(f, t, dur, v) {
    const c = this.ctx; const g = c.createGain();
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const vib = c.createOscillator(); vib.frequency.value = 5.2; const vg = c.createGain(); vg.gain.value = f * 0.006; vib.connect(vg); vg.connect(o.frequency);
    const br = c.createBufferSource(); br.buffer = this.noise; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 4; const bg = c.createGain(); bg.gain.value = 0.08;
    br.connect(bp); bp.connect(bg); bg.connect(g);
    o.connect(g); g.connect(this.musicBus);
    o.start(t); vib.start(t); br.start(t); o.stop(t + dur + 0.2); vib.stop(t + dur + 0.2); br.stop(t + dur + 0.2);
    this.env(g, t, 0.08, v, dur + 0.15, 0.15);
  }
  drum(t, v, f) {
    const c = this.ctx; const g = c.createGain(); const o = c.createOscillator();
    o.frequency.setValueAtTime(f * 1.8, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    o.connect(g); g.connect(this.musicBus);
    g.gain.setValueAtTime(v * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.start(t); o.stop(t + 0.5);
    this.noiseHit(this.musicBus, t, v * 0.12, 1200, 0.08);
  }
  shaker(t, v) { this.noiseHit(this.musicBus, t, v, 6000, 0.05, 'highpass'); }
  noiseHit(bus, t, v, freq, dur, type = 'bandpass') {
    const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 1.2;
    const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  tone(bus, type, f0, f1, t, dur, v) {
    const c = this.ctx; const o = c.createOscillator(); o.type = type; const g = c.createGain();
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
  }

  sfx(name) {
    if (!this.ctx || this.vol.muted) return;
    const t = this.ctx.currentTime, B = this.sfxBus, U = this.uiBus;
    switch (name) {
      case 'hit': this.noiseHit(B, t, 0.35, 900, 0.09); this.tone(B, 'square', 180, 80, t, 0.07, 0.08); break;
      case 'crit': this.noiseHit(B, t, 0.5, 1800, 0.14); this.tone(B, 'sawtooth', 320, 90, t, 0.18, 0.15); break;
      case 'slash': this.noiseHit(B, t, 0.25, 3000, 0.12, 'highpass'); break;
      case 'arrow': this.noiseHit(B, t, 0.2, 2500, 0.08, 'highpass'); this.tone(B, 'triangle', 900, 300, t, 0.08, 0.05); break;
      case 'fire': this.noiseHit(B, t, 0.4, 500, 0.4, 'lowpass'); this.tone(B, 'sawtooth', 120, 60, t, 0.3, 0.08); break;
      case 'ice': for (let i = 0; i < 4; i++) this.tone(B, 'sine', 1800 + i * 400, 1200, t + i * 0.03, 0.2, 0.05); break;
      case 'lightning': this.noiseHit(B, t, 0.5, 5000, 0.25, 'highpass'); this.tone(B, 'square', 1200, 100, t, 0.2, 0.06); break;
      case 'death': this.tone(B, 'sawtooth', 220, 60, t, 0.35, 0.09); this.noiseHit(B, t, 0.15, 400, 0.3, 'lowpass'); break;
      case 'player_death': this.tone(B, 'sine', 300, 70, t, 1.2, 0.2); break;
      case 'gold': this.tone(U, 'triangle', 1500, 1500, t, 0.08, 0.06); this.tone(U, 'triangle', 2000, 2000, t + 0.05, 0.1, 0.06); break;
      case 'item': this.tone(U, 'triangle', 660, 660, t, 0.12, 0.08); this.tone(U, 'triangle', 990, 990, t + 0.08, 0.18, 0.08); break;
      case 'rare': [523, 659, 784].forEach((f, i) => this.tone(U, 'triangle', f, f, t + i * 0.07, 0.3, 0.09)); break;
      case 'legendary': [392, 523, 659, 784, 1046].forEach((f, i) => { this.tone(U, 'triangle', f, f, t + i * 0.09, 0.6, 0.11); this.tone(U, 'sine', f * 2, f * 2, t + i * 0.09, 0.5, 0.04); }); break;
      case 'levelup': [440, 554, 659, 880].forEach((f, i) => this.tone(U, 'square', f, f, t + i * 0.1, 0.35, 0.06)); break;
      case 'craft': this.tone(U, 'square', 900, 900, t, 0.04, 0.08); this.noiseHit(U, t, 0.3, 3500, 0.2); this.tone(U, 'triangle', 1400, 1400, t + 0.05, 0.4, 0.06); break;
      case 'market': [784, 988, 1175].forEach((f, i) => this.tone(U, 'sine', f, f, t + i * 0.08, 0.4, 0.08)); break;
      case 'click': this.tone(U, 'square', 700, 500, t, 0.03, 0.04); break;
      case 'error': this.tone(U, 'square', 200, 150, t, 0.15, 0.06); break;
      case 'telegraph': this.tone(B, 'sawtooth', 110, 140, t, 0.4, 0.06); break;
      case 'heal': [660, 880].forEach((f, i) => this.tone(B, 'sine', f, f * 1.2, t + i * 0.08, 0.3, 0.05)); break;
      default: break;
    }
  }
}

export const audio = new AudioEngine();
