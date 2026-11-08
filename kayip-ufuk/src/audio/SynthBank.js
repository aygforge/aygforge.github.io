// Original procedural audio for all 63 AudioManifest cues. Pure JS DSP renders mono Float32Array PCM;
// AudioMixer wraps them in AudioBuffers after the first user gesture. No files, no network, no samples.
export const SR = 22050;

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s / 4294967296) * 2 - 1; }; }
const buf = (sec) => new Float32Array(Math.max(1, Math.floor(sec * SR)));
const env = (t, a, d, len) => (t < a ? t / a : t > len - d ? Math.max(0, (len - t) / d) : 1);
function noise(out, seed, gain = 1, { lp = 1, start = 0, len = out.length / SR, attack = 0.005, decay = 0.1, hp = 0 } = {}) {
  const r = rng(seed); let y = 0, x1 = 0, h = 0;
  const s0 = Math.floor(start * SR), n = Math.floor(len * SR);
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / SR; const v = r(); y += lp * (v - y);
    let o = y; if (hp) { h = hp * (h + o - x1); x1 = o; o = h; }
    out[s0 + i] += o * gain * env(t, attack, decay, len);
  }
}
function tone(out, f0, f1, gain, { start = 0, len = 0.2, attack = 0.005, decay = 0.1, type = 'sine', vib = 0 } = {}) {
  const s0 = Math.floor(start * SR), n = Math.floor(len * SR); let ph = 0;
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / SR; const f = f0 + (f1 - f0) * (t / len) + (vib ? Math.sin(t * 30) * vib : 0);
    ph += (2 * Math.PI * f) / SR;
    let w = Math.sin(ph);
    if (type === 'square') w = w > 0 ? 0.6 : -0.6; else if (type === 'tri') w = (2 / Math.PI) * Math.asin(Math.sin(ph)); else if (type === 'saw') w = ((ph / Math.PI) % 2) - 1;
    out[s0 + i] += w * gain * env(t, attack, decay, len);
  }
}
function pluck(out, freq, gain, start, len = 0.6) { // Karplus-Strong
  const s0 = Math.floor(start * SR); const N = Math.max(2, Math.floor(SR / freq)); const r = rng(Math.floor(freq * 13));
  const d = new Float32Array(N); for (let i = 0; i < N; i++) d[i] = r();
  const n = Math.floor(len * SR); let idx = 0;
  for (let i = 0; i < n && s0 + i < out.length; i++) { const a = d[idx], b = d[(idx + 1) % N]; const v = 0.497 * (a + b); d[idx] = v; idx = (idx + 1) % N; out[s0 + i] += a * gain; }
}
const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);
function music(len, seed, { scale, root, tempo, pad = 0.05, lead = 0.12, bass = 0.1, pluckLead = true }) {
  const out = buf(len); const r = rng(seed); const beat = 60 / tempo; const steps = Math.floor(len / (beat / 2));
  const chords = [[0, 2, 4], [3, 5, 0], [4, 6, 1], [5, 0, 2]];
  for (let bar = 0; bar < Math.ceil(len / (beat * 4)); bar++) {
    const ch = chords[bar % chords.length]; const st = bar * beat * 4;
    for (const deg of ch) tone(out, NOTE(root + scale[deg % scale.length] - 12), NOTE(root + scale[deg % scale.length] - 12), pad, { start: st, len: beat * 4, attack: 0.4, decay: 0.6, type: 'tri' });
    tone(out, NOTE(root - 24 + scale[ch[0] % scale.length]), NOTE(root - 24 + scale[ch[0] % scale.length]), bass, { start: st, len: beat * 2, attack: 0.01, decay: 0.4 });
    tone(out, NOTE(root - 24 + scale[ch[0] % scale.length]), NOTE(root - 24 + scale[ch[0] % scale.length]), bass * 0.8, { start: st + beat * 2, len: beat * 2, attack: 0.01, decay: 0.4 });
  }
  let deg = 2;
  for (let s = 0; s < steps; s++) {
    if (r() < 0.35) continue;
    deg = Math.max(0, Math.min(scale.length * 2 - 1, deg + Math.round(r() * 2.4 - 1.2)));
    const m = root + 12 + scale[deg % scale.length] + (deg >= scale.length ? 12 : 0);
    if (pluckLead) pluck(out, NOTE(m), lead, s * beat / 2, beat * 1.2);
    else tone(out, NOTE(m), NOTE(m), lead, { start: s * beat / 2, len: beat * 0.9, attack: 0.02, decay: 0.3, type: 'tri' });
  }
  // seamless loop: crossfade tail into head
  const xf = Math.floor(0.25 * SR); for (let i = 0; i < xf; i++) { const k = i / xf; out[i] = out[i] * k + out[out.length - xf + i] * (1 - k); }
  return out.subarray(0, out.length - xf);
}
const PENTA = [0, 2, 4, 7, 9], MINOR = [0, 3, 5, 7, 10], DORIAN = [0, 2, 3, 5, 7, 9, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11];

function loopNoise(len, seed, lp, gain, mod = null) {
  const out = buf(len); noise(out, seed, gain, { lp, attack: 0.3, decay: 0.3 });
  if (mod) for (let i = 0; i < out.length; i++) out[i] *= mod(i / SR);
  const xf = Math.floor(0.3 * SR); for (let i = 0; i < xf; i++) { const k = i / xf; out[i] = out[i] * k + out[out.length - xf + i] * (1 - k); }
  return out.subarray(0, out.length - xf);
}

/** Each entry: soundId -> () => Float32Array (functionRef recorded in reports/audio-provenance.json). */
export const CUES = {
  // ambience (loops)
  snd_beach_waves: () => loopNoise(8, 1, 0.08, 0.9, (t) => 0.35 + 0.65 * Math.pow(Math.sin(t * Math.PI / 4), 2)),
  snd_palm_wind: () => loopNoise(8, 2, 0.04, 0.8, (t) => 0.5 + 0.5 * Math.sin(t * 0.9) * Math.sin(t * 0.37)),
  snd_jungle_birds: () => { const o = loopNoise(8, 3, 0.03, 0.25); const r = rng(33); for (let k = 0; k < 14; k++) { const st = Math.abs(r()) * 7.5; const f = 1800 + Math.abs(r()) * 1600; for (let j = 0; j < 3; j++) tone(o, f, f * 1.25, 0.12, { start: st + j * 0.09, len: 0.07, decay: 0.04 }); } return o; },
  snd_rain_light: () => { const o = loopNoise(6, 4, 0.5, 0.25); const r = rng(44); for (let k = 0; k < 120; k++) noise(o, 400 + k, 0.25, { start: Math.abs(r()) * 5.6, len: 0.02, lp: 0.9, decay: 0.015 }); return o; },
  snd_rain_heavy: () => loopNoise(6, 5, 0.35, 0.8),
  snd_storm_wind: () => { const o = loopNoise(10, 6, 0.06, 1, (t) => 0.4 + 0.6 * Math.abs(Math.sin(t * 0.7))); noise(o, 66, 0.9, { start: 4, len: 2.5, lp: 0.02, attack: 0.02, decay: 2 }); return o; },
  snd_cave_drips: () => { const o = loopNoise(8, 7, 0.02, 0.12); const r = rng(77); for (let k = 0; k < 9; k++) tone(o, 1200 + Math.abs(r()) * 900, 500, 0.3, { start: Math.abs(r()) * 7.6, len: 0.12, decay: 0.1 }); return o; },
  snd_cave_bats: () => { const o = loopNoise(8, 8, 0.02, 0.12); const r = rng(88); for (let k = 0; k < 20; k++) tone(o, 3500 + Math.abs(r()) * 1500, 2500, 0.08, { start: Math.abs(r()) * 7.8, len: 0.04, decay: 0.03, type: 'tri' }); return o; },
  snd_swamp_insects: () => { const o = buf(8); for (let k = 0; k < 3; k++) tone(o, 3200 + k * 410, 3200 + k * 410, 0.05, { len: 8, attack: 0.5, decay: 0.5, vib: 300 }); noise(o, 9, 0.15, { lp: 0.05, attack: 0.5, decay: 0.5 }); return o; },
  snd_mountain_wind: () => loopNoise(10, 10, 0.025, 1, (t) => 0.3 + 0.7 * Math.pow(Math.sin(t * 0.45), 2)),
  snd_underwater_muffle: () => { const o = loopNoise(6, 11, 0.012, 1.2); const r = rng(111); for (let k = 0; k < 10; k++) tone(o, 300 + Math.abs(r()) * 200, 900, 0.08, { start: Math.abs(r()) * 5.7, len: 0.08, decay: 0.05 }); return o; },
  snd_campfire_crackle: () => { const o = loopNoise(6, 12, 0.03, 0.3); const r = rng(122); for (let k = 0; k < 60; k++) noise(o, 500 + k, 0.6 * Math.abs(r()), { start: Math.abs(r()) * 5.7, len: 0.015, lp: 0.95, decay: 0.012 }); return o; },
  // movement
  snd_foot_sand: () => { const o = buf(0.12); noise(o, 13, 0.6, { lp: 0.25, decay: 0.09 }); return o; },
  snd_foot_grass: () => { const o = buf(0.1); noise(o, 14, 0.5, { lp: 0.5, decay: 0.07, hp: 0.6 }); return o; },
  snd_foot_stone: () => { const o = buf(0.08); noise(o, 15, 0.6, { lp: 0.7, decay: 0.05 }); tone(o, 220, 180, 0.15, { len: 0.05, decay: 0.04 }); return o; },
  snd_foot_wood: () => { const o = buf(0.12); tone(o, 180, 140, 0.4, { len: 0.1, decay: 0.08 }); noise(o, 16, 0.2, { lp: 0.3, decay: 0.05 }); return o; },
  snd_swim_stroke: () => { const o = buf(0.4); noise(o, 17, 0.6, { lp: 0.15, attack: 0.05, decay: 0.3 }); return o; },
  snd_dive_bubble: () => { const o = buf(0.5); for (let k = 0; k < 6; k++) tone(o, 400 + k * 120, 900 + k * 150, 0.15, { start: k * 0.06, len: 0.08, decay: 0.06 }); return o; },
  snd_raft_oar: () => { const o = buf(0.5); noise(o, 18, 0.5, { lp: 0.1, attack: 0.1, decay: 0.3 }); tone(o, 120, 90, 0.15, { len: 0.2, decay: 0.15 }); return o; },
  snd_boat_wake: () => { const o = buf(1.2); noise(o, 19, 0.6, { lp: 0.08, attack: 0.3, decay: 0.8 }); return o; },
  // actions
  snd_axe_hit: () => { const o = buf(0.25); tone(o, 260, 120, 0.6, { len: 0.12, decay: 0.1 }); noise(o, 20, 0.5, { lp: 0.6, decay: 0.15 }); return o; },
  snd_tree_fall: () => { const o = buf(1.4); for (let k = 0; k < 8; k++) noise(o, 210 + k, 0.4, { start: k * 0.08, len: 0.06, lp: 0.8, decay: 0.05 }); noise(o, 21, 1.0, { start: 0.7, len: 0.7, lp: 0.05, decay: 0.6 }); return o; },
  snd_pick_hit: () => { const o = buf(0.3); tone(o, 1800, 1500, 0.4, { len: 0.18, decay: 0.16, type: 'tri' }); noise(o, 22, 0.4, { lp: 0.9, decay: 0.08 }); return o; },
  snd_ore_break: () => { const o = buf(0.6); for (let k = 0; k < 5; k++) noise(o, 230 + k, 0.6, { start: k * 0.05, len: 0.1, lp: 0.5, decay: 0.08 }); tone(o, 1400, 900, 0.2, { len: 0.3, decay: 0.25, type: 'tri' }); return o; },
  snd_item_collect: () => { const o = buf(0.25); tone(o, 880, 1320, 0.3, { len: 0.12, decay: 0.08, type: 'tri' }); tone(o, 1320, 1760, 0.25, { start: 0.08, len: 0.12, decay: 0.1, type: 'tri' }); return o; },
  snd_chest_open: () => { const o = buf(0.6); tone(o, 140, 260, 0.3, { len: 0.35, decay: 0.2, type: 'saw' }); noise(o, 24, 0.2, { lp: 0.3, len: 0.3, decay: 0.2 }); tone(o, 1046, 1046, 0.2, { start: 0.35, len: 0.2, decay: 0.15 }); return o; },
  snd_workbench_finish: () => { const o = buf(0.5); [0, 0.1, 0.2].forEach((s, i) => tone(o, [523, 659, 784][i], [523, 659, 784][i], 0.25, { start: s, len: 0.2, decay: 0.15, type: 'tri' })); return o; },
  snd_wood_build: () => { const o = buf(0.3); tone(o, 200, 150, 0.5, { len: 0.12, decay: 0.1 }); noise(o, 26, 0.3, { lp: 0.4, decay: 0.08 }); return o; },
  snd_build_finish: () => { const o = buf(0.9); [0, 0.12, 0.24, 0.36].forEach((s, i) => pluck(o, NOTE(60 + [0, 4, 7, 12][i]), 0.4, s, 0.5)); return o; },
  snd_fish_cast: () => { const o = buf(0.5); noise(o, 28, 0.4, { lp: 0.6, hp: 0.5, attack: 0.05, decay: 0.3, len: 0.35 }); tone(o, 900, 300, 0.08, { len: 0.35, decay: 0.2 }); noise(o, 281, 0.3, { start: 0.38, len: 0.1, lp: 0.2, decay: 0.08 }); return o; },
  snd_fish_bite: () => { const o = buf(0.3); noise(o, 29, 0.5, { lp: 0.25, decay: 0.15 }); tone(o, 660, 990, 0.2, { start: 0.05, len: 0.1, decay: 0.08, type: 'square' }); return o; },
  snd_fish_reel: () => { const o = buf(0.4); for (let k = 0; k < 10; k++) noise(o, 300 + k, 0.4, { start: k * 0.035, len: 0.02, lp: 0.95, decay: 0.015 }); return o; },
  snd_fish_landed: () => { const o = buf(0.7); noise(o, 31, 0.5, { lp: 0.2, decay: 0.2, len: 0.3 }); [0.25, 0.35, 0.45].forEach((s, i) => tone(o, [659, 784, 1046][i], [659, 784, 1046][i], 0.22, { start: s, len: 0.18, decay: 0.12, type: 'tri' })); return o; },
  snd_trap_set: () => { const o = buf(0.25); tone(o, 400, 900, 0.3, { len: 0.06, decay: 0.04, type: 'square' }); noise(o, 32, 0.3, { lp: 0.6, start: 0.06, len: 0.1, decay: 0.08 }); return o; },
  snd_trap_claim: () => { const o = buf(0.4); tone(o, 523, 784, 0.25, { len: 0.2, decay: 0.15, type: 'tri' }); noise(o, 33, 0.2, { lp: 0.3, start: 0.15, len: 0.2, decay: 0.15 }); return o; },
  snd_crop_plant: () => { const o = buf(0.3); noise(o, 34, 0.5, { lp: 0.2, decay: 0.2 }); tone(o, 600, 700, 0.1, { start: 0.15, len: 0.1, decay: 0.08 }); return o; },
  snd_crop_harvest: () => { const o = buf(0.4); noise(o, 35, 0.4, { lp: 0.5, hp: 0.4, decay: 0.15, len: 0.2 }); tone(o, 784, 1046, 0.22, { start: 0.15, len: 0.15, decay: 0.1, type: 'tri' }); return o; },
  snd_eat: () => { const o = buf(0.5); for (let k = 0; k < 3; k++) noise(o, 360 + k, 0.4, { start: k * 0.14, len: 0.08, lp: 0.4, decay: 0.06 }); return o; },
  snd_drink: () => { const o = buf(0.5); for (let k = 0; k < 3; k++) tone(o, 300, 500, 0.25, { start: k * 0.13, len: 0.09, decay: 0.06 }); return o; },
  snd_water_pour: () => { const o = buf(0.8); noise(o, 38, 0.5, { lp: 0.3, attack: 0.05, decay: 0.3 }); for (let k = 0; k < 6; k++) tone(o, 500 + k * 60, 800, 0.06, { start: k * 0.1, len: 0.06, decay: 0.05 }); return o; },
  snd_damage: () => { const o = buf(0.3); tone(o, 220, 90, 0.5, { len: 0.2, decay: 0.15, type: 'saw' }); noise(o, 39, 0.4, { lp: 0.5, decay: 0.12 }); return o; },
  snd_healing: () => { const o = buf(0.7); [0, 0.1, 0.2, 0.3].forEach((s, i) => tone(o, NOTE(72 + [0, 4, 7, 11][i]), NOTE(72 + [0, 4, 7, 11][i]), 0.15, { start: s, len: 0.3, decay: 0.25 })); return o; },
  snd_ui_confirm: () => { const o = buf(0.15); tone(o, 880, 1175, 0.25, { len: 0.1, decay: 0.06, type: 'tri' }); return o; },
  snd_ui_cancel: () => { const o = buf(0.15); tone(o, 660, 440, 0.22, { len: 0.1, decay: 0.06, type: 'tri' }); return o; },
  snd_ui_error: () => { const o = buf(0.25); tone(o, 220, 200, 0.25, { len: 0.08, decay: 0.03, type: 'square' }); tone(o, 196, 180, 0.25, { start: 0.1, len: 0.1, decay: 0.05, type: 'square' }); return o; },
  snd_door_open: () => { const o = buf(0.5); tone(o, 300, 180, 0.12, { len: 0.4, decay: 0.2, type: 'saw', vib: 20 }); noise(o, 43, 0.2, { lp: 0.2, start: 0.35, len: 0.1, decay: 0.08 }); return o; },
  // events
  snd_discovery: () => { const o = buf(1.2); [0, 0.15, 0.3, 0.5].forEach((s, i) => pluck(o, NOTE(67 + [0, 5, 9, 12][i]), 0.4, s, 0.7)); return o; },
  snd_blueprint_unlocked: () => { const o = buf(1.0); [0, 0.08, 0.16, 0.24, 0.32].forEach((s, i) => tone(o, NOTE(76 + PENTA[i]), NOTE(76 + PENTA[i]), 0.15, { start: s, len: 0.4, decay: 0.3, type: 'tri' })); return o; },
  snd_puzzle_correct: () => { const o = buf(1.0); [0, 0.12, 0.24].forEach((s, i) => tone(o, NOTE(72 + [0, 4, 7][i]), NOTE(72 + [0, 4, 7][i]), 0.22, { start: s, len: 0.5, decay: 0.4, type: 'tri' })); return o; },
  snd_puzzle_fail: () => { const o = buf(0.5); tone(o, 330, 300, 0.2, { len: 0.18, decay: 0.1, type: 'tri' }); tone(o, 277, 250, 0.2, { start: 0.18, len: 0.25, decay: 0.2, type: 'tri' }); return o; },
  snd_map_reveal: () => { const o = buf(0.6); noise(o, 48, 0.25, { lp: 0.6, hp: 0.6, attack: 0.1, decay: 0.4 }); tone(o, 1046, 1568, 0.1, { len: 0.5, decay: 0.3 }); return o; },
  snd_sos_transmit: () => { const o = buf(3.2); const pat = [1, 1, 1, 3, 3, 3, 1, 1, 1]; let t = 0; for (const d of pat) { tone(o, 1000, 1000, 0.25, { start: t, len: d * 0.1, attack: 0.005, decay: 0.01, type: 'square' }); t += d * 0.1 + 0.1; } return o; },
  snd_sos_received_indicator: () => { const o = buf(1.0); for (let k = 0; k < 3; k++) tone(o, 1318, 1318, 0.2, { start: k * 0.25, len: 0.12, decay: 0.05, type: 'tri' }); return o; },
  snd_sea_finale: () => music(10, 51, { scale: MAJOR, root: 62, tempo: 104, lead: 0.12 }),
  snd_radio_finale: () => music(10, 52, { scale: PENTA, root: 64, tempo: 92, lead: 0.12 }),
  // music (loops)
  snd_menu_theme: () => music(24, 61, { scale: PENTA, root: 62, tempo: 84 }),
  snd_calm_day: () => music(28, 62, { scale: MAJOR, root: 65, tempo: 96 }),
  snd_camp_evening: () => music(28, 63, { scale: DORIAN, root: 60, tempo: 76, pluckLead: true }),
  snd_exploration: () => music(28, 64, { scale: DORIAN, root: 62, tempo: 108 }),
  snd_night_ambience: () => music(28, 65, { scale: MINOR, root: 57, tempo: 64, lead: 0.07, bass: 0.06 }),
  snd_sea_journey: () => music(28, 66, { scale: MAJOR, root: 60, tempo: 100, pluckLead: false }),
  snd_ending_sea: () => music(24, 67, { scale: MAJOR, root: 67, tempo: 88 }),
  snd_ending_radio: () => music(24, 68, { scale: PENTA, root: 60, tempo: 80, pluckLead: false }),
};

export function renderCue(id) {
  const fn = CUES[id]; if (!fn) throw new Error('No synth for ' + id);
  const pcm = fn();
  let peak = 0; for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const k = peak > 0.9 ? 0.9 / peak : 1;
  if (k !== 1) for (let i = 0; i < pcm.length; i++) pcm[i] *= k;
  return pcm;
}
