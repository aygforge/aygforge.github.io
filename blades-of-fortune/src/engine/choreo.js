// Koreografi kütüphanesi — Tides'ın o()/d() adım dili (sıralı adımlar, dizi = paralel grup) kara yolu için.
// Koordinatlar: kahraman (0,0); y negatif = yolun ilerisi (ekranın üstü); x: yol ekseninden sapma. Yol genişliği ~±30.
export const o = (type, a = {}) => ({ type, ...a });
export const par = (...s) => s.flat().filter(Boolean);

export const spawn = (id, kind, x, y, p = {}) => o('spawn', { e: { id, kind, x, y, ...p } });
export const prop = (id, kind, x, y, p = {}) => o('spawn', { e: { id, kind, x, y, prop: 1, ...p } });
export const rm = (id) => o('remove', { id });
export const mv = (id, x, y, dur = 1.2, p = {}) => o('move', { id, to: { x, y }, dur, ...p });
export const run = (id, x, y, dur = 0.7, p = {}) => o('move', { id, to: { x, y }, dur, run: 1, ...p });
export const mvNoWait = (id, x, y, dur = 1.2, p = {}) => o('move', { id, to: { x, y }, dur, wait: false, ...p });
export const set = (id, props) => o('set', { id, props });
export const tw = (id, to, dur = 0.8, p = {}) => o('tween', { id, to, dur, ...p });
export const say = (id, text, hold) => o('say', { id, text, hold: hold == null ? Math.min(2.6, 0.9 + text.length * 0.028) : hold });
export const think = (id, text, hold) => o('say', { id, text, think: 1, hold: hold == null ? Math.min(2.4, 0.8 + text.length * 0.026) : hold });
export const wait = (dur) => o('wait', { dur });
export const pose = (id, p, dir) => o('pose', { id, pose: p, dir });
export const face = (id, dir) => o('pose', { id, dir });
export const shake = (amp = 4, dur = 0.4) => o('shake', { amp, dur });
export const flash = (color = '#ffffff', dur = 0.25) => o('flash', { color, dur });
export const sfx = (name) => o('sound', { name });
export const weather = (preset, p = {}) => o('weather', { preset, ...p });
export const fx = (kind, at = 'hero', n = 12, p = {}) => o('particles', { kind, at, n, ...p });
export const txt = (at, text, color = '#f4ead5') => o('float', { at, text, color });
export const coins = (from, to, n = 8) => o('coins', { from, to, n });
export const give = (from, to, icon, p = {}) => o('give', { from, to, icon, ...p });
export const open = (id, state = 'open') => o('state', { id, state });
export const st = (id, state) => o('state', { id, state });
export const hit = (id, p = {}) => o('hit', { id, ...p });
export const lunge = (id, target, p = {}) => o('lunge', { id, target, ...p });
export const fall = (id) => o('fall', { id });
export const flee = (id, dir = 'up', p = {}) => o('flee', { id, dir, ...p });
export const fade = (id, to = 0, dur = 0.8) => o('tween', { id, to: { alpha: to }, dur });
export const appear = (id, dur = 0.6) => o('tween', { id, to: { alpha: 1 }, dur, from: { alpha: 0 }, show: 1 });
export const glow = (id, color = '#ffe27a', on = 1) => o('glow', { id, color, on });
export const emote = (id, icon, dur = 1.2) => o('emote', { id, icon, dur });
export const proj = (from, to, kind = 'arrow', dur = 0.5) => o('proj', { from, to, kind, dur });
export const jump = (id, h = 8, dur = 0.4) => o('jump', { id, h, dur });
export const scroll = (dy = 110, dur = 2.4) => o('scroll', { dy, dur });
export const cam = (x = 0, y = -40, zoom = 1) => o('camera', { focus: { x, y }, zoom });
export const camReset = () => o('camera', {});
export const call = (fn) => o('call', { fn });
export const auto = () => o('auto');
export const spin = (id, turns = 1, dur = 0.6) => o('spin', { id, turns, dur });
export const dark = (v = 0.4, dur = 1) => o('dark', { v, dur });
export const quake = (dur = 1.2) => o('shake', { amp: 3, dur, rumble: 1 });
export const banner = (text, color = '#f2c14e') => o('banner', { text, color });

// Hazır mikro-diziler (paylaşılan nesneler, olaylar kendi düzenini kurar)
export const heroDraw = () => par(pose('hero', 'ready'), sfx('draw'));
export const heroBack = () => par(mv('hero', 0, 0, 0.6), pose('hero', 'idle', 'up'));
export const pay = (to, n = 6) => par(coins('hero', to, n), sfx('coins'));
export const gain = (from, n = 8) => par(coins(from, 'hero', n), sfx('coins'));
export const heroTo = (x, y, dur = 0.9) => mv('hero', x, y, dur);
export const heroHurt = (amt = 1) => par(hit('hero'), shake(2 + amt, 0.3), sfx('hurt'));
export const strike = (target, p = {}) => par(lunge('hero', target, p), o('swing', { id: 'hero' }), sfx('slash'));

// Sahne kurucu: olay tanımından Event Director'ın beklediği setup/approach/intro/action/outcome/exit üretir.
export function buildScene(ev) {
  const main = ev.main || (ev.setup || []).find((s) => s.type === 'spawn' && !s.e.prop)?.e.id || (ev.setup || []).find((s) => s.type === 'spawn')?.e.id || null;
  const pick = (map, key) => {
    if (!map) return null;
    const v = map[key];
    return v == null ? null : v;
  };
  const resolve = (v, info) => (typeof v === 'function' ? v(info) : v) || [];
  return {
    main,
    setup: () => ev.setup || [],
    approach: () => ev.appr || [scroll(110, 2.4)],
    intro: () => ev.intro || [],
    action: (info) => resolve(pick(ev.act, info.key), info),
    outcome: (info) => {
      const k = info.key, oc = info.outcome;
      const v = pick(ev.out, k + '.' + oc) ?? pick(ev.out, k) ?? pick(ev.out, '*.' + oc) ?? pick(ev.out, '*');
      return resolve(v, info);
    },
    exit: (info) => resolve(ev.exit, info),
  };
}
