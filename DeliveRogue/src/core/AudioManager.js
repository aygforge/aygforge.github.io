// core/AudioManager.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Save } from './SaveManager.js';

/* ============================ Audio =========================== */
/** Procedural Web Audio SFX + a small synthesized lo-fi café loop. Initialised on first user gesture. */
export const Audio = (() => {
  let ac = null, master, sfxG, musG, noiseBuf, musicTimer = null, nextNote = 0, step = 0;
  const last = {};
  const S = () => Save.data.settings;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ac = new AC();
      master = ac.createGain(); master.connect(ac.destination);
      sfxG = ac.createGain(); sfxG.connect(master); musG = ac.createGain(); musG.connect(master);
      const len = ac.sampleRate * 0.6; noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const ch = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      apply(); startMusic();
    } catch (e) { ac = null; }
  }
  function apply() {
    if (!ac) return;
    const s = S(), t = ac.currentTime;
    master.gain.setTargetAtTime(s.master ? 0.8 : 0, t, 0.03);
    sfxG.gain.setTargetAtTime(s.sfx ? 0.9 : 0, t, 0.03);
    musG.gain.setTargetAtTime(s.music ? 0.32 : 0, t, 0.2);
  }
  function tone(type, f0, f1, dur, vol, when = 0, dest = sfxG) {
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, fType, freq, when = 0, q = 1, dest = sfxG) {
    const t = ac.currentTime + when, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = fType; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t); src.stop(t + dur + 0.02);
  }
  const SFX = {
    click: () => tone('triangle', 660, 880, 0.07, 0.18),
    pickup: () => { tone('square', 523, 523, 0.08, 0.08); tone('square', 784, 784, 0.12, 0.08, 0.08); tone('triangle', 1046, 1046, 0.18, 0.12, 0.16); },
    fire: () => { tone('square', 1500, 900, 0.05, 0.035); },
    hit: () => { noise(0.05, 0.12, 'highpass', 2200); tone('triangle', 420, 240, 0.06, 0.06); },
    crit: () => { tone('square', 1200, 600, 0.09, 0.07); noise(0.07, 0.12, 'highpass', 3000); },
    hurt: () => { tone('sawtooth', 220, 90, 0.2, 0.16); noise(0.12, 0.15, 'lowpass', 900); },
    pkg: () => { tone('square', 300, 140, 0.16, 0.12); noise(0.1, 0.12, 'bandpass', 600, 0, 3); },
    kill: () => { tone('triangle', 520, 1040, 0.1, 0.12); noise(0.12, 0.08, 'highpass', 1500); },
    steam: () => { noise(0.7, 0.07, 'bandpass', 2400, 0, 0.7); },
    warn: () => { tone('square', 880, 880, 0.05, 0.04); },
    checkpoint: () => { [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.2, 0.12, i * 0.08)); },
    skill: () => { tone('triangle', 784, 1568, 0.18, 0.12); tone('sine', 1046, 1046, 0.25, 0.08, 0.06); },
    coin: () => { tone('square', 988, 988, 0.06, 0.06); tone('square', 1318, 1318, 0.12, 0.06, 0.06); },
    win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, 0.32, 0.13, i * 0.1)); tone('sine', 262, 262, 0.8, 0.1, 0.1); },
    fail: () => { [392, 330, 262, 196].forEach((f, i) => tone('sawtooth', f, f * 0.97, 0.28, 0.08, i * 0.16)); },
    charge: () => { tone('sawtooth', 110, 440, 0.7, 0.08); },
    slam: () => { noise(0.25, 0.2, 'lowpass', 400); tone('sine', 120, 50, 0.3, 0.2); },
    shield: () => { tone('sine', 1200, 600, 0.2, 0.1); },
    heal: () => { [660, 880, 1100].forEach((f, i) => tone('sine', f, f, 0.18, 0.1, i * 0.06)); },
    leap: () => { tone('triangle', 300, 900, 0.25, 0.08); },
    zap: () => { noise(0.08, 0.1, 'highpass', 4000); tone('square', 2000, 300, 0.08, 0.04); },
    splash: () => { noise(0.18, 0.1, 'lowpass', 1200); },
    bump: () => { tone('sine', 160, 70, 0.12, 0.14); },
    buy: () => { tone('triangle', 660, 660, 0.06, 0.1); tone('triangle', 990, 990, 0.14, 0.1, 0.07); },
    error: () => { tone('square', 200, 160, 0.14, 0.07); },
  };
  function play(name, minGap = 0.04) {
    if (!ac || !S().master || !S().sfx) return;
    const now = ac.currentTime; if (last[name] && now - last[name] < minGap) return; last[name] = now;
    try { SFX[name] && SFX[name](); } catch (e) {}
  }
  /* --- music: Cmaj7 Am7 Dm7 G7 lo-fi loop, 84 bpm, scheduled ahead --- */
  const CH = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]];
  const MEL = [76, -1, 74, 72, -1, 71, 72, -1, 69, -1, 72, 74, -1, 76, -1, -1, 77, -1, 76, 74, -1, 72, 74, -1, 71, -1, 67, 69, -1, 71, -1, -1];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function schedule() {
    if (!ac) return;
    const spb = 60 / 84 / 2; // eighth notes
    while (nextNote < ac.currentTime + 0.35) {
      const t = nextNote - ac.currentTime, bar = Math.floor(step / 8) % 4, ch = CH[bar];
      if (S().music && S().master) {
        if (step % 8 === 0) ch.forEach((n, i) => tone('sine', mtof(n), mtof(n), 1.6, 0.05, t + i * 0.012, musG));
        if (step % 8 === 0 || step % 8 === 5) tone('triangle', mtof(ch[0] - 24), mtof(ch[0] - 24), 0.45, 0.13, t, musG);
        if (step % 2 === 1) noise(0.04, 0.025, 'highpass', 7000, t, 1, musG);
        if (step % 8 === 4) noise(0.12, 0.05, 'bandpass', 1800, t, 1.2, musG);
        if (step % 8 === 0) tone('sine', 90, 45, 0.18, 0.12, t, musG);
        const m = MEL[step % 32]; if (m > 0 && Math.floor(step / 32) % 2 === 1) tone('triangle', mtof(m), mtof(m), 0.35, 0.045, t, musG);
      }
      nextNote += spb; step++;
    }
  }
  function startMusic() { if (musicTimer) return; nextNote = ac.currentTime + 0.1; musicTimer = setInterval(schedule, 120); }
  function suspend() { if (ac && ac.state === 'running') ac.suspend().catch(() => {}); }
  function resume() { if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); }
  return { init, apply, play, suspend, resume, get ready() { return !!ac; } };
})();
