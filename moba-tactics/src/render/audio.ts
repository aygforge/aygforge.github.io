/** Tiny Web Audio synthesizer: original short effects, no downloaded files. Failure never blocks gameplay. */
let ctx: AudioContext | null = null;
let enabled = true;
const last: Record<string, number> = {};

export function setSound(on: boolean) { enabled = on; }
export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, noise = false) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(ctx.destination);
  if (noise) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x7fffffff) * 2 - 1; }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = freq;
    src.connect(f); f.connect(g);
    src.start(t); src.stop(t + dur);
    return;
  }
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  o.connect(g);
  o.start(t); o.stop(t + dur);
}

const SOUNDS: Record<string, () => void> = {
  hit: () => tone(1800, 0.06, 'square', 0.02, -1200, true),
  shot: () => tone(900, 0.08, 'triangle', 0.03, -500),
  cast: () => tone(500, 0.18, 'sine', 0.05, 400),
  ult: () => { tone(220, 0.35, 'sawtooth', 0.04, 300); tone(660, 0.3, 'sine', 0.03, 200); },
  boom: () => tone(600, 0.35, 'sine', 0.12, 0, true),
  death: () => tone(300, 0.4, 'triangle', 0.06, -220),
  tower: () => tone(1200, 0.15, 'sine', 0.04, -700),
  alert: () => { tone(880, 0.12, 'square', 0.03); setTimeout(() => tone(1320, 0.14, 'square', 0.03), 120); },
  click: () => tone(1000, 0.04, 'square', 0.03),
  gold: () => tone(1500, 0.08, 'sine', 0.03, 400),
  level: () => { tone(523, 0.1, 'triangle', 0.04); setTimeout(() => tone(784, 0.15, 'triangle', 0.04), 90); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.05), i * 140)),
  lose: () => [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.05), i * 180)),
};

export function sfx(name: keyof typeof SOUNDS | string, minGapMs = 60) {
  if (!enabled || !ctx) return;
  const now = performance.now();
  if ((last[name] ?? 0) + minGapMs > now) return;
  last[name] = now;
  try { SOUNDS[name]?.(); } catch { /* ignore */ }
}
