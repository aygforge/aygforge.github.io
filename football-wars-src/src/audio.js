/* FOOTBALL WARS — original procedural audio (SFX + chiptune), deterministic.
 * The same plan drives live playback (WebAudio) and the offline mix that is encoded into the video. */
(function (root) {
'use strict';
const SR = 48000;
const E = root.FWEngine;
function Rng(s) { this.s = s >>> 0; }
Rng.prototype.n = function () { let a = (this.s = (this.s + 0x6D2B79F5) | 0); let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1; };

function buf(sec) { return new Float32Array(Math.max(1, Math.round(sec * SR))); }
function sq(ph, duty) { return (ph % 1) < (duty || 0.5) ? 1 : -1; }
function tri(ph) { const x = ph % 1; return x < 0.5 ? 4 * x - 1 : 3 - 4 * x; }
function biquadBP(f, q) { const w0 = 2 * Math.PI * f / SR, al = Math.sin(w0) / (2 * q), a0 = 1 + al; return { b0: al / a0, b1: 0, b2: -al / a0, a1: -2 * Math.cos(w0) / a0, a2: (1 - al) / a0, x1: 0, x2: 0, y1: 0, y2: 0 }; }
function bq(s, x) { const y = s.b0 * x + s.b1 * s.x1 + s.b2 * s.x2 - s.a1 * s.y1 - s.a2 * s.y2; s.x2 = s.x1; s.x1 = x; s.y2 = s.y1; s.y1 = y; return y; }
function norm(b, peak) { let m = 0; for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(b[i])); if (m > 0) { const k = (peak || 0.9) / m; for (let i = 0; i < b.length; i++) b[i] *= k; } return b; }

function synthBank() {
  const r = new Rng(1234567);
  const B = {};
  // ball strike
  B.kick = (() => { const b = buf(0.1); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; const f = 60 + 160 * Math.exp(-t * 35); ph += f / SR; b[i] = Math.sin(ph * 6.283) * Math.exp(-t * 32) + (t < 0.004 ? r.n() * 0.8 : 0); } return norm(b, 0.9); })();
  B.curve = (() => { const b = buf(0.16); let ph = 0, p2 = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; ph += (70 + 190 * Math.exp(-t * 30)) / SR; p2 += (1400 - 2500 * t) / SR; b[i] = Math.sin(ph * 6.283) * Math.exp(-t * 30) + 0.18 * Math.sin(p2 * 6.283) * Math.exp(-t * 14) + (t < 0.004 ? r.n() * 0.7 : 0); } return norm(b, 0.9); })();
  B.hit = (() => { const b = buf(0.09); let lp = 0, ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; lp += (r.n() - lp) * 0.25; ph += 115 / SR; b[i] = (lp * 1.4 + Math.sin(ph * 6.283) * 0.7) * Math.exp(-t * 45); } return norm(b, 0.85); })();
  B.crit = (() => { const b = buf(0.16); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; ph += (1200 * Math.exp(-t * 12) + 200) / SR; b[i] = (sq(ph, 0.25) * 0.5 + r.n() * 0.5 * Math.exp(-t * 60)) * Math.exp(-t * 18); } return norm(b, 0.8); })();
  B.ko = (() => { const b = buf(0.28); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; const f = t < 0.06 ? 660 : t < 0.12 ? 440 : 220; ph += f / SR; b[i] = sq(ph, 0.5) * 0.45 * Math.exp(-t * 7) + (t < 0.02 ? r.n() * (1 - t / 0.02) : 0); } return norm(b, 0.8); })();
  B.save = (() => { const b = buf(0.24); let hp = 0, prev = 0, p1 = 0, p2 = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; const n = r.n(); hp = 0.8 * (hp + n - prev); prev = n; p1 += 1320 / SR; p2 += 1980 / SR; b[i] = (t < 0.035 ? hp : 0) + (0.45 * Math.sin(p1 * 6.283) + 0.25 * Math.sin(p2 * 6.283)) * Math.exp(-t * 14); } return norm(b, 0.8); })();
  B.tackle = (() => { const b = buf(0.24); let a = 0, c = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; const n = r.n(); a += (n - a) * 0.5; c += (n - c) * 0.08; b[i] = (a - c) * Math.sin(Math.PI * Math.min(1, t / 0.24)) * 1.3; } return norm(b, 0.75); })();
  B.pass = (() => { const b = buf(0.07); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; ph += 900 / SR; b[i] = 0.5 * Math.sin(ph * 6.283) * Math.exp(-t * 50) + (t < 0.003 ? r.n() * 0.5 : 0); } return norm(b, 0.6); })();
  B.heal = (() => { const b = buf(0.34); const f = [880, 1175, 1568]; for (let i = 0; i < b.length; i++) { const t = i / SR; let v = 0; for (let k = 0; k < 3; k++) { const tt = t - k * 0.08; if (tt >= 0) v += Math.sin(tt * f[k] * 6.283) * Math.exp(-tt * 18); } b[i] = v * 0.4; } return norm(b, 0.55); })();
  B.special = (() => { const b = buf(0.6); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; const f = 220 * Math.pow(4, t / 0.6) * (1 + 0.03 * Math.sin(t * 60)); ph += f / SR; const env = Math.min(1, t / 0.08) * (t > 0.45 ? Math.max(0, 1 - (t - 0.45) / 0.15) : 1); b[i] = ((ph % 1) * 2 - 1) * 0.4 * env + r.n() * 0.15 * env * (t / 0.6); } return norm(b, 0.7); })();
  B.boom = (() => { const b = buf(0.8); let lp = 0, ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; const k = 0.4 * Math.exp(-t * 5) + 0.01; lp += (r.n() - lp) * k; ph += (40 + 40 * Math.exp(-t * 8)) / SR; b[i] = (lp * 1.6 + Math.sin(ph * 6.283) * 0.9) * Math.exp(-t * 4.5); } return norm(b, 0.95); })();
  B.whoosh = (() => { const b = buf(0.5); const f = biquadBP(400, 1.2); for (let i = 0; i < b.length; i++) { const t = i / SR; if (i % 64 === 0) { const s = biquadBP(300 + 3500 * Math.sin(Math.PI * t / 0.5), 1.4); f.b0 = s.b0; f.b2 = s.b2; f.a1 = s.a1; f.a2 = s.a2; } b[i] = bq(f, r.n()) * Math.sin(Math.PI * t / 0.5); } return norm(b, 0.7); })();
  B.vs = (() => { const b = buf(1.4); let lp = 0, hp = 0, prev = 0, ph = 0; const ch = [261.6, 329.6, 392, 523.3]; for (let i = 0; i < b.length; i++) { const t = i / SR; const n = r.n(); lp += (n - lp) * (0.3 * Math.exp(-t * 4) + 0.01); hp = 0.9 * (hp + n - prev); prev = n; ph += (45 + 60 * Math.exp(-t * 6)) / SR; let stab = 0; for (const f of ch) stab += sq(t * f, 0.5); b[i] = lp * 1.2 * Math.exp(-t * 3) + Math.sin(ph * 6.283) * Math.exp(-t * 3.5) + hp * 0.5 * Math.exp(-t * 2.5) + stab * 0.08 * Math.exp(-t * 3); } return norm(b, 0.95); })();
  B.blip = (() => { const b = buf(0.1); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = sq(t * 880, 0.5) * 0.5 * Math.exp(-t * 25); } return norm(b, 0.6); })();
  B.go = (() => { const b = buf(0.6); for (let i = 0; i < b.length; i++) { const t = i / SR; const env = Math.min(1, t / 0.02) * Math.max(0, 1 - Math.max(0, t - 0.45) / 0.15); b[i] = Math.sin(t * 2900 * 6.283) * (0.65 + 0.35 * sq(t * 34, 0.5)) * env * 0.5; } return norm(b, 0.6); })();
  B.whistle3 = (() => { const b = buf(1.25); const segs = [[0, 0.18], [0.26, 0.44], [0.55, 1.2]]; for (let i = 0; i < b.length; i++) { const t = i / SR; let on = 0; for (const [a, z] of segs) if (t >= a && t < z) on = Math.min(1, (t - a) / 0.015, (z - t) / 0.04); b[i] = Math.sin(t * 2900 * 6.283) * (0.65 + 0.35 * sq(t * 34, 0.5)) * on * 0.5; } return norm(b, 0.6); })();
  B.final = (() => { const b = buf(0.44); for (let i = 0; i < b.length; i++) { const t = i / SR; const f = Math.floor(t / 0.11) % 2 ? 988 : 740; b[i] = sq(t * f, 0.5) * 0.4 * Math.min(1, (0.44 - t) / 0.05); } return norm(b, 0.6); })();
  B.heart = (() => { const b = buf(0.5); for (let i = 0; i < b.length; i++) { const t = i / SR; let v = 0; for (const s of [0, 0.18]) { const tt = t - s; if (tt >= 0) v += Math.sin(tt * 62 * 6.283) * Math.exp(-tt * 18); } b[i] = v; } return norm(b, 0.9); })();
  B.stinger = (() => {
    const b = buf(2.0); const mel = [523.3, 659.3, 784, 1046.5]; const chord = [523.3, 659.3, 784, 1046.5];
    for (let i = 0; i < b.length; i++) {
      const t = i / SR; let v = 0;
      if (t < 0.48) { const k = Math.floor(t / 0.12); const tt = t - k * 0.12; v += sq(t * mel[k], 0.25) * 0.35 * Math.exp(-tt * 6); }
      else { const tt = t - 0.48; const vib = 1 + 0.006 * Math.sin(tt * 34); for (const f of chord) v += sq(t * f * vib, 0.5) * 0.12; v *= Math.min(1, tt / 0.02) * Math.max(0, 1 - Math.max(0, tt - 1.0) / 0.5); v += tri(t * 130.8) * 0.3 * Math.max(0, 1 - tt / 1.5); }
      if ((t > 0.48 && t < 0.56) || (t > 0.72 && t < 0.78)) v += r.n() * 0.3;
      b[i] = v;
    }
    return norm(b, 0.85);
  })();
  B.cheer = (() => {
    const b = buf(2.8); const bands = [biquadBP(700, 1.6), biquadBP(1300, 2), biquadBP(2500, 2.4)];
    for (let i = 0; i < b.length; i++) {
      const t = i / SR; const env = Math.min(1, t / 0.35) * Math.max(0, 1 - Math.max(0, t - 1.4) / 1.4);
      const n = r.n(); let v = 0; for (const f of bands) v += bq(f, n);
      const clap = (Math.abs(r.n()) > 0.9993) ? 2.5 : 0;
      b[i] = (v * 0.9 + clap * 0.2) * env;
    }
    return norm(b, 0.7);
  })();
  B.crowd = (() => {
    const len = 6; const b = buf(len); let lp = 0; const bp = biquadBP(500, 0.8);
    for (let i = 0; i < b.length; i++) { const t = i / SR; lp += (r.n() - lp) * 0.06; const am = 0.75 + 0.15 * Math.sin(t * 2 * Math.PI / len * 3) + 0.1 * Math.sin(t * 2 * Math.PI / len * 5); b[i] = (lp * 0.7 + bq(bp, r.n()) * 0.5) * am; }
    const fade = Math.round(0.25 * SR); for (let i = 0; i < fade; i++) { const k = i / fade; b[i] = b[i] * k + b[b.length - fade + i] * (1 - k); }
    return norm(b.subarray(0, b.length - fade).slice(), 0.6);
  })();
  return B;
}

// ---------- original chiptune (A minor, Am-F-C-G) ----------
const BPM = 132, BEAT = 60 / BPM, BAR = BEAT * 4, LOOP_BARS = 8, LOOP = BAR * LOOP_BARS;
function noteF(n) { return 440 * Math.pow(2, (n - 69) / 12); }
function renderLoop(intense) {
  const b = buf(LOOP); const r = new Rng(intense ? 77 : 42);
  const roots = [45, 41, 48, 43]; // A2 F2 C3 G2
  const triads = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]];
  const lead = [76, 74, 72, 74, 76, -1, 79, 76, 77, 76, 74, 72, 74, -1, 72, 71, 72, 74, 76, 79, 76, -1, 74, 72, 71, 72, 74, 71, 67, -1, 69, -1];
  const add = (t0, dur, fn, gain) => { const s0 = Math.round(t0 * SR), n = Math.round(dur * SR); for (let i = 0; i < n && s0 + i < b.length; i++) b[s0 + i] += fn(i / SR) * gain; };
  for (let bar = 0; bar < LOOP_BARS; bar++) {
    const ch = Math.floor(bar / 2) % 4, t0 = bar * BAR;
    // bass eighths
    for (let e = 0; e < 8; e++) { const n = roots[ch] + (e % 2 ? 12 : 0); const f = noteF(n); add(t0 + e * BEAT / 2, BEAT / 2 * 0.9, t => sq(t * f, 0.25) * Math.exp(-t * 4), intense ? 0.16 : 0.13); }
    // arp sixteenths
    if (intense || bar % 2 === 1 || true) for (let s = 0; s < 16; s++) { const n = triads[ch][s % 3] + (intense ? 12 : 0) + (s % 6 === 5 ? 12 : 0); const f = noteF(n); add(t0 + s * BEAT / 4, BEAT / 4 * 0.8, t => sq(t * f, 0.125) * Math.exp(-t * 14), intense ? 0.07 : 0.045); }
    // drums
    for (let q = 0; q < 4; q++) {
      const tq = t0 + q * BEAT;
      if (q === 0 || q === 2 || intense) add(tq, 0.16, t => Math.sin(2 * Math.PI * (50 * t + 90 / 30 * (1 - Math.exp(-t * 30)))) * Math.exp(-t * 18), 0.45);
      if (q === 1 || q === 3) add(tq, 0.14, t => (r.n() * 0.7 + Math.sin(t * 190 * 6.283) * 0.3) * Math.exp(-t * 22), 0.22);
      const hats = intense ? 4 : 2;
      for (let h = 0; h < hats; h++) add(tq + h * BEAT / hats, 0.04, t => r.n() * Math.exp(-t * 90), intense ? 0.09 : 0.07);
    }
    // lead (calm loop only; intense layer doubles an octave up)
    for (let k = 0; k < 4; k++) {
      const n = lead[(bar * 4 + k) % lead.length]; if (n < 0) continue; const f = noteF(n + (intense ? 12 : 0));
      add(t0 + k * BEAT, BEAT * 0.85, t => (sq(t * f * (1 + 0.004 * Math.sin(t * 30)), 0.5) * 0.6 + tri(t * f) * 0.4) * Math.min(1, t / 0.01) * Math.exp(-t * 1.6), intense ? 0.05 : 0.07);
    }
  }
  return b;
}

// ---------- plan: events -> sound cues (shared by live + offline) ----------
const EVMAP = {};
function initMap() {
  const V = E.EV;
  Object.assign(EVMAP, {
    [V.SHOT]: ['kick', 0.30], [V.CURVE]: ['curve', 0.28], [V.PASS]: ['pass', 0.22], [V.TACKLE]: ['tackle', 0.34], [V.HIT]: ['hit', 0.22],
    [V.CRIT]: ['crit', 0.36], [V.KO]: ['ko', 0.42], [V.SAVE]: ['save', 0.5], [V.HEAL]: ['heal', 0.2], [V.SPECIAL]: ['special', 0.55],
    [V.SPECIAL_FIRE]: ['boom', 0.35], [V.EXPLODE]: ['boom', 0.45], [V.INTERCEPT]: ['save', 0.3], [V.CLEAR]: ['kick', 0.34],
    [V.FINAL15]: ['final', 0.55], [V.FINAL5]: ['heart', 0.7], [V.ZONE]: ['final', 0.45], [V.STORM]: ['special', 0.5],
    [V.SUDDEN]: ['vs', 0.6], [V.END]: ['whistle3', 0.6], [V.START]: ['go', 0.55]
  });
}
const IMPORTANT = new Set(['ko', 'save', 'special', 'final', 'heart', 'vs', 'whistle3', 'go', 'boom', 'crit', 'stinger', 'cheer']);
function Planner() { this.last = {}; this.win = []; this.items = []; this.idx = 0; }
Planner.prototype.push = function (t, id, gain, pan, rate) { this.items.push({ t, id, gain, pan: pan || 0, rate: rate || 1 }); };
Planner.prototype.intro = function () {
  this.push(0.0, 'whoosh', 0.55, -0.4); this.push(0.3, 'whoosh', 0.5, 0.4); this.push(0.66, 'vs', 0.9, 0); this.push(1.05, 'whoosh', 0.35, 0);
  this.push(1.55, 'blip', 0.45, 0, 1); this.push(1.75, 'blip', 0.45, 0, 1); this.push(1.95, 'blip', 0.5, 0, 1.5);
};
// feed events (array, reads from this.idx onward); returns new items
Planner.prototype.feed = function (w) {
  if (!EVMAP[1]) initMap();
  const start = this.items.length;
  const evs = w.events;
  for (; this.idx < evs.length; this.idx++) {
    const e = evs[this.idx]; const m = EVMAP[e.type]; if (!m) continue;
    const id = m[0]; const t = e.t;
    const imp = IMPORTANT.has(id);
    // per-sound and global throttling (deterministic)
    const gap = id === 'hit' ? 0.045 : id === 'kick' || id === 'curve' ? 0.04 : 0.03;
    if (!imp && this.last[id] != null && t - this.last[id] < gap) continue;
    while (this.win.length && t - this.win[0] > 0.08) this.win.shift();
    if (!imp && this.win.length >= 6) continue;
    this.win.push(t); this.last[id] = t;
    const pan = e.x ? Math.max(-0.7, Math.min(0.7, (e.x - 180) / 180 * 0.7)) : 0;
    const rate = 1 + (((e.k * 31 + (e.a & 1023)) % 11) - 5) * 0.015;
    this.push(t, id, m[1], pan, imp ? 1 : rate);
    if (e.type === E.EV.FINAL15) this.push(t, 'cheer', 0.4, 0);
    if (e.type === E.EV.END) { this.push(t, 'boom', 0.8, 0); this.push(t + 0.45, 'stinger', 0.75, 0); this.push(t + 0.5, 'cheer', 0.6, 0); }
  }
  return this.items.slice(start);
};

// ---------- offline mix (for the exported video) ----------
function mixOffline(bank, loops, items, w, dur, vol) {
  const n = Math.ceil(dur * SR) + 1;
  const L = new Float32Array(n), R = new Float32Array(n);
  const sfxG = vol.sfx, musG = vol.music;
  const addBuf = (b, t, g, pan, rate) => {
    const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
    const s0 = Math.round(t * SR); const len = Math.floor(b.length / rate);
    for (let i = 0; i < len; i++) {
      const o = s0 + i; if (o < 0) continue; if (o >= n) break;
      const p = i * rate, k = p | 0, f = p - k; const v = (b[k] + ((b[k + 1] || 0) - b[k]) * f) * g;
      L[o] += v * gl; R[o] += v * gr;
    }
  };
  // crowd ambience
  const crowd = bank.crowd; const cg = 0.16 * sfxG;
  for (let i = 0; i < n; i++) { const v = crowd[i % crowd.length] * cg; L[i] += v; R[i] += v * 0.95; }
  for (const it of items) addBuf(bank[it.id], it.t, it.gain * sfxG, it.pan, it.rate);
  // music: calm loop from battle start, intense layer from FINAL CLASH, fade at the end
  const tb = E.TL.battleStart, te = w.endT + 0.25;
  const fadeEnv = (t) => t < te - 0.25 ? 1 : Math.max(0, (te - t) / 0.25);
  const mus = (loop, from, g) => {
    for (let o = Math.round(from * SR); o < Math.min(n, Math.round(te * SR)); o++) {
      const t = o / SR; const li = Math.round((t - tb) * SR) % loop.length; const v = loop[li < 0 ? 0 : li] * g * fadeEnv(t);
      L[o] += v; R[o] += v;
    }
  };
  if (musG > 0) { mus(loops.calm, tb, 0.55 * musG); if (w.final15 >= 0) mus(loops.intense, w.final15, 0.5 * musG); }
  // master soft clip
  for (let i = 0; i < n; i++) { L[i] = Math.tanh(L[i] * 1.1); R[i] = Math.tanh(R[i] * 1.1); }
  return { L, R, sampleRate: SR, length: n };
}

// ---------- live player ----------
function LivePlayer(ctx, bank, loops, vol) {
  this.ctx = ctx; this.vol = vol; this.sources = []; this.t0 = 0; this.buffers = {};
  this.master = ctx.createGain(); this.master.gain.value = 0.9;
  this.comp = ctx.createDynamicsCompressor(); this.comp.threshold.value = -10; this.comp.ratio.value = 6;
  this.master.connect(this.comp); this.comp.connect(ctx.destination);
  for (const k in bank) { const b = ctx.createBuffer(1, bank[k].length, SR); b.copyToChannel(bank[k], 0); this.buffers[k] = b; }
  for (const k in loops) { const b = ctx.createBuffer(1, loops[k].length, SR); b.copyToChannel(loops[k], 0); this.buffers['loop_' + k] = b; }
}
LivePlayer.prototype.start = function (timelineNow) { this.t0 = this.ctx.currentTime + 0.05 - (timelineNow || 0); this.play('crowd', 0, 0.16, 0, 1, true); };
LivePlayer.prototype.play = function (id, t, gain, pan, rate, loop, offset) {
  const ctx = this.ctx, b = this.buffers[id]; if (!b) return;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate || 1; src.loop = !!loop;
  const g = ctx.createGain(); g.gain.value = gain * (id.startsWith('loop_') ? this.vol.music : this.vol.sfx);
  let node = src;
  if (ctx.createStereoPanner && pan) { const p = ctx.createStereoPanner(); p.pan.value = pan; src.connect(p); node = p; }
  node.connect(g); g.connect(this.master);
  const when = Math.max(ctx.currentTime, this.t0 + t);
  src.start(when, offset || 0);
  const rec = { src, g, loop: !!loop };
  this.sources.push(rec);
  src.onended = () => { const i = this.sources.indexOf(rec); if (i >= 0) this.sources.splice(i, 1); try { g.disconnect(); } catch (e) {} };
  return rec;
};
LivePlayer.prototype.schedule = function (items) { for (const it of items) this.play(it.id, it.t, it.gain, it.pan, it.rate); };
LivePlayer.prototype.music = function (which, t) {
  const tb = E.TL.battleStart; const off = Math.max(0, t - tb) % LOOP;
  return this.play('loop_' + which, t, which === 'calm' ? 0.55 : 0.5, 0, 1, true, off);
};
LivePlayer.prototype.stopMusic = function (t) {
  const when = Math.max(this.ctx.currentTime, this.t0 + t);
  for (const s of this.sources) if (s.loop && s.src.buffer && s.src.buffer !== this.buffers.crowd) { try { s.g.gain.setTargetAtTime(0, when, 0.08); s.src.stop(when + 0.5); } catch (e) {} }
};
LivePlayer.prototype.stopAll = function () {
  for (const s of this.sources.slice()) { try { s.src.onended = null; s.src.stop(); s.g.disconnect(); } catch (e) {} }
  this.sources.length = 0;
  try { this.master.disconnect(); this.comp.disconnect(); } catch (e) {}
};

let BANK = null, LOOPS = null;
function ensure() { if (!BANK) { BANK = synthBank(); LOOPS = { calm: renderLoop(false), intense: renderLoop(true) }; } return { bank: BANK, loops: LOOPS }; }
root.FWAudio = { SR, ensure, Planner, mixOffline, LivePlayer, LOOP };
})(typeof window !== 'undefined' ? window : globalThis);
