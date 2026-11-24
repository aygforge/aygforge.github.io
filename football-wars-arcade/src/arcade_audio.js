/* FOOTBALL WARS — ARCADE REBORN: ArcadeAudio. Reuses the V4 procedural FWAudio bank (battle SFX, crowd,
 * chiptune loops) and adds arcade cues (UI, rewards, Momentum Normal/Good/Perfect, pack/rarity reveals,
 * 12 signature-ability motifs). Categories: music · battle SFX · crowd & ambience · UI & rewards.
 * Live sounds are played "now" (no timeline), throttled and prioritised so 200-unit battles never stutter. */
(function (root) {
'use strict';
const SR = 48000;
const CROWD = new Set(['crowd', 'cheer', 'roar', 'gasp', 'heart']);
const UI = new Set(['ui', 'coin', 'upgrade', 'levelup', 'trophy', 'pack_standard', 'pack_premium', 'pack_legend', 'rev_common', 'rev_rare', 'rev_epic', 'rev_legendary', 'error']);
const PRIO_HI = new Set(['boom', 'stinger', 'cheer', 'roar', 'mom_normal', 'mom_good', 'mom_perfect', 'mom_ready', 'save', 'ko', 'special', 'go', 'whistle3']);
function tone(sec, fn) { const n = Math.max(1, Math.round(sec * SR)), b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = fn(i / SR, i); let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(b[i])); if (m > 0) for (let i = 0; i < n; i++) b[i] *= 0.85 / m; return b; }
const sq = (ph, d) => (ph % 1) < (d || 0.5) ? 1 : -1;
const tri = ph => { const x = ph % 1; return x < 0.5 ? 4 * x - 1 : 3 - 4 * x; };
function arp(notes, step, wave, dec) { return tone(notes.length * step + 0.25, t => { const k = Math.min(notes.length - 1, Math.floor(t / step)), tt = t - k * step; const f = notes[k]; const w = wave === 'tri' ? tri(t * f) : wave === 'sin' ? Math.sin(t * f * 6.283) : sq(t * f, 0.25); return w * Math.exp(-tt * (dec || 9)) * 0.5; }); }
let noiseS = 99991; function noise() { noiseS = (noiseS * 16807) % 2147483647; return noiseS / 1073741823.5 - 1; }
function extraBank() {
  const B = {};
  B.ui = tone(0.06, t => sq(t * 1320, 0.5) * Math.exp(-t * 60) * 0.4);
  B.error = tone(0.18, t => sq(t * 160, 0.5) * Math.exp(-t * 14) * 0.5);
  B.coin = arp([988, 1319], 0.07, 'sq', 10);
  B.upgrade = arp([523, 659, 784, 1047], 0.05, 'tri', 12);
  B.levelup = arp([523, 659, 784, 1047, 1319, 1568], 0.075, 'sq', 7);
  B.trophy = arp([392, 523, 659, 784, 659, 784, 1047, 1047], 0.13, 'sq', 4);
  B.mom_ready = arp([880, 1175], 0.06, 'tri', 14);
  B.mom_normal = tone(0.22, t => (Math.sin(t * (300 + 400 * t) * 6.283) * 0.6 + noise() * 0.2 * Math.exp(-t * 40)) * Math.exp(-t * 12));
  B.mom_good = tone(0.36, t => (sq(t * (440 + 900 * t), 0.5) * 0.35 + Math.sin(t * 220 * 6.283) * 0.5 + noise() * 0.3 * Math.exp(-t * 30)) * Math.exp(-t * 8));
  B.mom_perfect = tone(0.7, t => { const k = Math.min(3, Math.floor(t / 0.06)), f = [784, 1047, 1319, 1568][k]; return (sq(t * f, 0.25) * 0.35 * Math.exp(-(t - k * 0.06) * 6) + Math.sin(t * 110 * 6.283) * 0.6 * Math.exp(-t * 7) + noise() * 0.35 * Math.exp(-t * 18)); });
  B.pack_standard = tone(0.9, t => (sq(t * (200 + 300 * t), 0.5) * 0.25 + noise() * 0.3 * t) * Math.min(1, (0.9 - t) * 8));
  B.pack_premium = tone(1.0, t => (sq(t * (260 + 520 * t), 0.4) * 0.3 + tri(t * 130) * 0.3 + noise() * 0.25 * t) * Math.min(1, (1 - t) * 8));
  B.pack_legend = tone(1.2, t => (sq(t * (330 + 700 * t * t), 0.3) * 0.3 + Math.sin(t * 82 * 6.283) * 0.5 + noise() * 0.3 * t) * Math.min(1, (1.2 - t) * 8));
  B.rev_common = arp([660, 880], 0.06, 'tri', 14);
  B.rev_rare = arp([660, 880, 1175], 0.06, 'tri', 10);
  B.rev_epic = arp([523, 784, 1047, 1319], 0.07, 'sq', 8);
  B.rev_legendary = arp([523, 659, 784, 1047, 1319, 1568, 2093], 0.07, 'sq', 5);
  // 12 signature motifs (distinct base pitch, waveform and rhythm)
  const AB = { pressing_storm: [196, 'sq', [0, 0.05, 0.1, 0.15]], high_line_interception: [880, 'tri', [0, 0.09]], one_two_combo: [659, 'sq', [0, 0.08, 0.16]],
    precision_through_ball: [1175, 'sin', [0, 0.12]], counter_burst: [262, 'sq', [0, 0.04, 0.08, 0.12, 0.16]], quick_transition: [523, 'tri', [0, 0.05, 0.1]],
    iron_wall: [110, 'sq', [0]], last_line_save: [988, 'sin', [0, 0.1, 0.2]], shoulder_charge: [147, 'sq', [0, 0.11]], stamina_surge: [440, 'tri', [0, 0.07, 0.14, 0.21]],
    cross_fire: [740, 'sq', [0, 0.06, 0.12]], flank_overload: [587, 'tri', [0, 0.05, 0.1, 0.15]] };
  for (const id in AB) {
    const [f, wv, hits] = AB[id];
    B['ab_' + id] = tone(0.5, t => { let v = 0; hits.forEach((h, i) => { const tt = t - h; if (tt >= 0) { const ff = f * (1 + i * 0.25); v += (wv === 'sq' ? sq(tt * ff, 0.3) : wv === 'tri' ? tri(tt * ff) : Math.sin(tt * ff * 6.283)) * Math.exp(-tt * 10); } }); return v * 0.5 + (id === 'iron_wall' ? noise() * 0.2 * Math.exp(-t * 6) : 0); });
  }
  return B;
}
const AA = {
  ctx: null, buffers: null, gains: null, set: { master: 0.8, music: 0.5, sfx: 0.8, crowd: 0.6, mute: false }, last: {}, active: 0, musicSrc: null, crowdSrc: null, planner: null, ok: false,
  init() {
    if (AA.ctx) { if (AA.ctx.state === 'suspended') AA.ctx.resume().catch(() => {}); return true; }
    try {
      const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return false;
      AA.ctx = new AC({ sampleRate: SR });
      const g = AA.gains = {}; g.master = AA.ctx.createGain(); const comp = AA.ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 6;
      g.master.connect(comp); comp.connect(AA.ctx.destination);
      for (const k of ['music', 'sfx', 'crowd', 'ui']) { g[k] = AA.ctx.createGain(); g[k].connect(g.master); }
      AA.buffers = {};
      const { bank, loops } = root.FWAudio.ensure();
      const add = (k, data) => { const b = AA.ctx.createBuffer(1, data.length, SR); b.copyToChannel(data, 0); AA.buffers[k] = b; };
      for (const k in bank) add(k, bank[k]);
      for (const k in loops) add('loop_' + k, loops[k]);
      const ex = extraBank(); for (const k in ex) add(k, ex[k]);
      AA.ok = true; AA.apply(AA.set);
      if (AA.ctx.state === 'suspended') AA.ctx.resume().catch(() => {});
      return true;
    } catch (e) { AA.ok = false; return false; }
  },
  apply(s) {
    AA.set = Object.assign(AA.set, s || {});
    if (!AA.gains) return;
    const m = AA.set.mute ? 0 : AA.set.master;
    AA.gains.master.gain.value = m; AA.gains.music.gain.value = AA.set.music; AA.gains.sfx.gain.value = AA.set.sfx; AA.gains.crowd.gain.value = AA.set.crowd; AA.gains.ui.gain.value = Math.max(0.4, AA.set.sfx);
  },
  cat(id) { return id.startsWith('loop_') ? 'music' : CROWD.has(id) ? 'crowd' : UI.has(id) ? 'ui' : 'sfx'; },
  play(id, gain, pan, rate, loop) {
    if (!AA.ok || AA.set.mute) return null;
    const b = AA.buffers[id]; if (!b) return null;
    const now = AA.ctx.currentTime;
    if (!loop && !PRIO_HI.has(id)) { // throttle: low-priority sounds are skipped under load
      if (AA.active > 14) return null;
      if (AA.last[id] != null && now - AA.last[id] < 0.035) return null;
    }
    AA.last[id] = now;
    const src = AA.ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate || 1; src.loop = !!loop;
    const g = AA.ctx.createGain(); g.gain.value = gain == null ? 0.6 : gain;
    let node = src; if (pan && AA.ctx.createStereoPanner) { const p = AA.ctx.createStereoPanner(); p.pan.value = pan; src.connect(p); node = p; }
    node.connect(g); g.connect(AA.gains[AA.cat(id)]);
    src.start(now); AA.active++;
    src.onended = () => { AA.active--; try { g.disconnect(); } catch (e) {} };
    return { src, g };
  },
  ui(id) { AA.play(id || 'ui', 0.5); },
  // ---- battle ----
  battleStart() {
    AA.battleStop();
    AA.planner = new root.FWAudio.Planner(); AA.planner.intro();
    for (const it of AA.planner.items) setTimeout(() => AA.play(it.id, it.gain, it.pan, it.rate), it.t * 1000);
    AA.planner.items.length = 0;
    AA.crowdSrc = AA.play('crowd', 0.35, 0, 1, true);
    AA.musicOn = false; AA.intense = false; AA.cues = new root.FWAudio.V3Cues({ crowd: true, epic: true, mvp: false });
  },
  battleFeed(w, obs) {
    if (!AA.planner || !AA.ok) return;
    const items = AA.planner.feed(w); AA.planner.items.length = 0;
    for (const it of items) AA.play(it.id, it.gain, it.pan, it.rate);
    for (const it of AA.cues.feed(w, obs)) AA.play(it.id, it.gain, it.pan, it.rate);
    if (!AA.musicOn && w.phase === 'battle') { AA.musicOn = true; AA.musicSrc = AA.play('loop_calm', 0.55, 0, 1, true); }
    if (!AA.intense && w.final15 >= 0 && w.phase === 'battle') { AA.intense = true; AA.stopMusic(); AA.musicSrc = AA.play('loop_intense', 0.5, 0, 1, true); }
    if (w.phase === 'ended' && AA.musicSrc) AA.stopMusic();
  },
  stopMusic() { const m = AA.musicSrc; AA.musicSrc = null; if (m) { try { m.g.gain.setTargetAtTime(0, AA.ctx.currentTime, 0.08); m.src.stop(AA.ctx.currentTime + 0.4); } catch (e) {} } },
  battleStop() { AA.stopMusic(); if (AA.crowdSrc) { try { AA.crowdSrc.src.stop(); } catch (e) {} AA.crowdSrc = null; } AA.planner = null; },
  pause(on) { if (!AA.ctx) return; if (on) AA.ctx.suspend().catch(() => {}); else AA.ctx.resume().catch(() => {}); },
  vibrate(p) { try { if (AA.set.vibration !== false && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
};
root.ArcadeAudio = AA;
})(typeof window !== 'undefined' ? window : globalThis);
