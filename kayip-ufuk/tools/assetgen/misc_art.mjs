// VFX (16 × 6 frames), 27 HUD icons (48×48), raft/escape boat afloat (4 dirs × 8 frames, 256×128),
// 5 finale/intro scenes × 3 layers (512×256).
import { Pix, shade, prng, hex } from './raster.mjs';
import { P } from './palette.mjs';
import { drawBuild } from './builds.mjs';
import { drawItemIcon, scaleDown } from './icons.mjs';

export function drawFx(kind, f) {
  const p = new Pix(64, 64); const r = prng(kind.length * 97 + f * 13); const t = f / 6;
  const A = (c, a) => [...hex(c).slice(0, 3), Math.max(0, Math.min(255, Math.round(a)))];
  switch (kind) {
    case 'fire': p.ellipse(32, 50 - f, 10 - f * 0.4, 14 + (f % 3), A('#f28a2a', 230)); p.ellipse(32, 52 - f * 0.5, 6, 9 + (f % 2) * 2, A('#ffd04a', 240)); p.ellipse(32, 55, 3, 4, A('#fff6c0', 255)); break;
    case 'smoke': for (let i = 0; i < 4; i++) p.circle(28 + i * 3 + t * 6, 50 - i * 9 - t * 10, 5 + i * 1.5, A('#9aa0a8', 160 - i * 30 - t * 60)); break;
    case 'axe_impact': case 'pickaxe_impact': case 'wood_chips': { const c = kind === 'wood_chips' ? P.wood_light : kind === 'axe_impact' ? '#c9a676' : P.stone_light; for (let i = 0; i < 8; i++) { const a = r() * Math.PI * 2, d = 6 + t * 22; p.rect(32 + Math.cos(a) * d, 36 + Math.sin(a) * d * 0.7 - t * 6, 3, 2, A(c, 255 - t * 200)); } if (f < 2) p.circle(32, 36, 6 - f * 2, A('#ffffff', 200)); break; }
    case 'splash': case 'fish_splash': for (let i = 0; i < 10; i++) { const a = -Math.PI * (0.1 + 0.8 * (i / 9)); const d = 4 + t * 20; p.circle(32 + Math.cos(a) * d, 46 + Math.sin(a) * d + t * t * 20, 2, A('#c8f0ff', 230 - t * 160)); } p.ellipse(32, 48, 8 + t * 14, 3 + t * 3, A('#ffffff', 150 - t * 120)); break;
    case 'fish_bite': p.ellipse(32, 44, 6 + t * 18, 2 + t * 5, A('#ffffff', 220 - t * 200)); p.ellipse(32, 44, 3 + t * 9, 1 + t * 2, A('#ffffff', 200 - t * 150)); p.rect(30, 28 - (f % 2) * 3, 4, 8, A('#e83a3a', 255)); break;
    case 'footstep': p.ellipse(26, 50, 3, 2, A('#5a4a3a', 160 - t * 140)); p.ellipse(38, 46, 3, 2, A('#5a4a3a', 160 - t * 140)); break;
    case 'healing': for (let i = 0; i < 5; i++) { const x = 18 + i * 7, y = 52 - ((t * 40 + i * 9) % 40); p.rect(x - 1, y - 3, 3, 7, A('#5cdc7a', 230)); p.rect(x - 3, y - 1, 7, 3, A('#5cdc7a', 230)); } break;
    case 'lightning': if (f >= 4) { p.ellipse(32, 30, 26 - f * 3, 26 - f * 3, A('#fff6c0', 70 - f * 8)); } else { let x = 32; for (let y = 0; y < 60; y += 6) { const nx = x + (r() - 0.5) * 14; p.line(x, y, nx, y + 6, A('#fff6c0', 255), 2); x = nx; } } break;
    case 'ocean_wake': for (let i = 0; i < 3; i++) p.ellipse(32, 40 + i * 6, 10 + i * 6 + t * 6, 3, A('#ffffff', 180 - i * 50 - t * 80)); p.ellipse(32, 40, 8, 2, [69, 174, 181, 255]); break;
    case 'rain': for (let i = 0; i < 14; i++) { const x = (i * 9 + f * 5) % 64, y = (i * 23 + f * 11) % 64; p.line(x, y, x - 2, y + 6, A('#c8e6f5', 200)); } break;
    case 'sand_dust': for (let i = 0; i < 6; i++) p.circle(22 + i * 4 + t * 8, 50 - t * 12 - (i % 2) * 3, 3 + t * 3, A(P.sand_light, 180 - t * 160)); break;
    case 'torch_glow': case 'camp_light': { const R = kind === 'camp_light' ? 30 : 22; for (let rr = R; rr > 0; rr -= 3) p.circle(32, 32, rr + Math.sin(f) * 1.5, A('#ffcf7a', 18 + (R - rr) * 1.2)); break; }
  }
  return p;
}

const UI = {
  attack(p) { p.line(12, 36, 34, 14, '#d6dce2', 4); p.line(10, 38, 16, 32, P.leather, 4); p.poly([[34, 14], [38, 10], [36, 16]], '#ffffff'); },
  backpack(p) { p.blit(scaleDown(drawItemIcon('EQ_BAG_SMALL'), 1.25), 4, 2); },
  build(p) { p.line(10, 38, 30, 18, P.wood, 4); p.rect(24, 8, 18, 10, P.iron); p.rect(24, 8, 18, 3, P.stone_light); },
  button(p) { p.rect(2, 2, 44, 44, '#2b3d45'); p.frame(2, 2, 44, 44, '#7fb8b0'); p.rect(4, 4, 40, 3, '#3e5660'); },
  collection(p) { for (let i = 0; i < 3; i++) p.rect(8 + i * 11, 10, 9, 28, [P.red, P.teal, P.yellow][i]); p.rect(6, 38, 36, 3, P.wood); },
  compass(p) { p.blit(scaleDown(drawItemIcon('TOOL_COMPASS'), 1.4), 2, 2); },
  craft(p) { p.line(10, 38, 26, 22, P.wood, 4); p.poly([[24, 10], [38, 12], [36, 24], [28, 20]], P.stone_light); p.line(22, 38, 38, 22, P.rope, 3); },
  dialog(p) { p.rect(6, 8, 36, 24, P.paper); p.poly([[14, 32], [22, 32], [12, 40]], P.paper); for (let y = 14; y < 30; y += 5) p.line(10, y, 38, y, '#9aa4b8'); },
  fullscreen(p) { for (const [x, y, dx, dy] of [[6, 6, 1, 1], [42, 6, -1, 1], [6, 42, 1, -1], [42, 42, -1, -1]]) { p.line(x, y, x + dx * 12, y, '#ffffff', 3); p.line(x, y, x, y + dy * 12, '#ffffff', 3); } },
  interact(p) { p.circle(24, 24, 18, '#3fb6a8'); p.circle(24, 24, 14, '#5fd6c8'); p.poly([[18, 14], [32, 24], [18, 34]], '#ffffff'); },
  journal(p) { p.rect(8, 6, 32, 36, P.leather); p.rect(12, 8, 26, 32, P.paper); for (let y = 14; y < 36; y += 5) p.line(15, y, 34, y, '#9aa4b8'); p.rect(8, 6, 4, 36, P.leather_dark); },
  joystick(p) { p.circle(24, 24, 21, [255, 255, 255, 60]); p.circle(24, 24, 20, [36, 50, 56, 90]); p.circle(24, 24, 9, [255, 255, 255, 170]); },
  map(p) { p.poly([[6, 10], [18, 6], [30, 10], [42, 6], [42, 38], [30, 42], [18, 38], [6, 42]], P.paper); p.line(18, 6, 18, 38, '#c9b590'); p.line(30, 10, 30, 42, '#c9b590'); p.ellipse(24, 24, 9, 7, P.grass); p.circle(30, 20, 2, P.red); },
  pause(p) { p.rect(13, 10, 8, 28, '#ffffff'); p.rect(27, 10, 8, 28, '#ffffff'); },
  pets(p) { p.circle(24, 28, 9, '#e9b07a'); for (const [x, y] of [[12, 16], [20, 10], [28, 10], [36, 16]]) p.circle(x, y, 4.5, '#e9b07a'); },
  progress_fill(p) { p.rect(2, 18, 44, 12, '#1d2a30'); p.rect(4, 20, 30, 8, '#5cdc7a'); p.rect(4, 20, 30, 2, '#9cf0b0'); },
  quest(p) { p.circle(24, 24, 18, P.gold); p.rect(21, 10, 6, 18, '#3a2a10'); p.rect(21, 32, 6, 6, '#3a2a10'); },
  save(p) { p.rect(8, 8, 32, 32, '#3d5a7a'); p.rect(14, 8, 20, 12, P.white); p.rect(28, 10, 4, 8, '#3d5a7a'); p.rect(12, 26, 24, 12, '#2a3e55'); },
  settings(p) { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.rect(24 + Math.cos(a) * 16 - 3, 24 + Math.sin(a) * 16 - 3, 7, 7, '#c9cfd6'); } p.circle(24, 24, 14, '#c9cfd6'); p.circle(24, 24, 6, '#2b3d45'); },
  skills(p) { p.poly([[24, 4], [29, 18], [44, 18], [32, 27], [37, 42], [24, 33], [11, 42], [16, 27], [4, 18], [19, 18]], P.gold); },
  slot(p) { p.rect(2, 2, 44, 44, [36, 50, 56, 200]); p.frame(2, 2, 44, 44, '#7fa0a8'); p.frame(3, 3, 42, 42, '#2a3a40'); },
  slot_selected(p) { p.rect(2, 2, 44, 44, [60, 90, 70, 220]); p.frame(1, 1, 46, 46, P.gold); p.frame(2, 2, 44, 44, P.yellow); },
  sprint(p) { for (let i = 0; i < 3; i++) p.poly([[8 + i * 10, 12], [18 + i * 10, 24], [8 + i * 10, 36], [12 + i * 10, 24]], ['#ffffff', '#c8f0ff', '#8ad0f0'][i]); },
  success(p) { p.circle(24, 24, 18, '#3a8a5a'); p.line(14, 24, 21, 32, '#ffffff', 4); p.line(21, 32, 34, 15, '#ffffff', 4); },
  tide(p) { for (let k = 0; k < 3; k++) for (let x = 4; x < 44; x++) p.rect(x, 14 + k * 9 + Math.round(Math.sin(x / 4 + k) * 3), 1, 3, k === 1 ? '#45aeb5' : '#7fd3e6'); },
  warning(p) { p.poly([[24, 4], [44, 40], [4, 40]], P.yellow); p.rect(22, 14, 4, 14, '#3a2a10'); p.rect(22, 32, 4, 4, '#3a2a10'); },
  weather(p) { p.circle(18, 18, 9, P.yellow); p.ellipse(28, 28, 14, 9, '#e9eef2'); p.ellipse(22, 30, 9, 7, '#ffffff'); for (let i = 0; i < 4; i++) p.line(16 + i * 6, 38, 14 + i * 6, 44, '#7fd3e6'); },
};
export function drawUI(name) { const p = new Pix(48, 48); UI[name](p); if (!['joystick', 'slot', 'slot_selected', 'button', 'progress_fill'].includes(name)) p.outline(P.outline); return p; }

export function drawBoat(id, dir, f) {
  const p = new Pix(256, 128); const ph = (f / 8) * Math.PI * 2; const bob = Math.round(Math.sin(ph) * 2);
  // wake / ripples
  for (let x = 20; x < 236; x += 3) p.set(x, 112 + Math.round(Math.sin(x / 9 + ph) * 2), [255, 255, 255, 140]);
  const raft = id === 'BUILD_RAFT';
  const src = drawBuild(id, 'complete', raft ? 96 : 224, raft ? 80 : 112);
  if (dir === 'left' || dir === 'right') {
    p.blit(src, (256 - src.w) / 2, 128 - src.h - 10 + bob, { flipX: dir === 'left' });
  } else {
    // bow toward/away from camera: draw foreshortened hull
    const hw = raft ? 44 : 60, hl = raft ? 50 : 96;
    const cx = 128, cy = 80 + bob;
    p.ellipse(cx, cy, hw, hl / 2.2, raft ? P.wood : '#7a5a3e');
    for (let k = -3; k <= 3; k++) p.line(cx + k * (hw / 4), cy - hl / 2.6, cx + k * (hw / 4), cy + hl / 2.6, P.wood_dark);
    p.rect(cx - 2, cy - 70, 5, 70, P.wood_dark);
    p.poly([[cx + 3, cy - 68], [cx + 3 + (raft ? 24 : 40), cy - 20], [cx + 3, cy - 16]], P.canvas);
    if (dir === 'down') p.poly([[cx - hw * 0.4, cy + hl / 2.4], [cx, cy + hl / 2.4 + 12], [cx + hw * 0.4, cy + hl / 2.4]], shade(raft ? P.wood : '#7a5a3e', -0.2));
    else p.poly([[cx - hw * 0.4, cy - hl / 2.4], [cx, cy - hl / 2.4 - 12], [cx + hw * 0.4, cy - hl / 2.4]], shade(raft ? P.wood : '#7a5a3e', 0.1));
  }
  p.outline(P.outline);
  return p;
}

const SCENES = {
  intro_shipwreck: { sky: ['#f2b07a', '#7ac0d8'], sea: '#237c9f' }, sea_success: { sky: ['#ffd78a', '#5ab0e0'], sea: '#2f86a8' }, sea_retry: { sky: ['#5a6a7a', '#3a4a5a'], sea: '#2a5a7a' },
  radio_signal: { sky: ['#162b46', '#3a4a8a'], sea: '#1a3a5a' }, radio_rescue: { sky: ['#f6c08a', '#8ac8e8'], sea: '#2f86a8' },
};
export function drawScene(name, layer) {
  const p = new Pix(512, 256); const S = SCENES[name]; const r = prng(name.length * 31 + layer.length);
  if (layer === 'backdrop') {
    for (let y = 0; y < 170; y++) p.rect(0, y, 512, 1, [...hex(S.sky[0]).slice(0, 3).map((v, i) => Math.round(v + (hex(S.sky[1])[i] - v) * (y / 170))), 255]);
    if (name.startsWith('radio_signal')) for (let i = 0; i < 70; i++) p.set(r() * 512, r() * 150, '#ffffff');
    else p.circle(380, 70, 26, name === 'sea_retry' ? '#8a9aaa' : '#fff2b0');
    p.rect(0, 170, 512, 86, S.sea);
    for (let i = 0; i < 40; i++) p.rect(r() * 500, 175 + r() * 80, 10 + r() * 20, 1, shade(S.sea, 0.25));
    if (name === 'sea_retry') for (let i = 0; i < 50; i++) p.line(r() * 512, r() * 170, r() * 512 - 6, r() * 170 + 12, '#a8c0d0');
  } else if (layer === 'foreground') {
    if (name === 'intro_shipwreck') { p.ellipse(256, 250, 300, 40, P.sand); p.blit(drawBuild('BUILD_RAFT', 'complete', 96, 80), 140, 170); for (let i = 0; i < 4; i++) p.rect(300 + i * 30, 214 + (i % 2) * 6, 22, 6, P.wood); }
    if (name === 'sea_success' || name === 'sea_retry') { const b = drawBuild('BUILD_ESCAPE_BOAT', 'complete', 224, 112); p.blit(b, 150, 120); if (name === 'sea_retry') for (let i = 0; i < 6; i++) p.poly([[40 + i * 80, 256], [60 + i * 80, 200], [80 + i * 80, 256]], P.stone_dark); }
    if (name === 'radio_signal') { p.ellipse(256, 256, 220, 40, P.stone_dark); p.poly([[236, 230], [276, 230], [268, 70], [244, 70]], P.white); for (let y = 90; y < 230; y += 40) p.rect(240, y, 32, 12, P.red); p.rect(240, 56, 32, 16, '#ffe48a'); for (let rr = 20; rr < 120; rr += 24) for (let a = -0.6; a < 0.6; a += 0.02) p.set(256 + Math.cos(a - Math.PI / 2) * rr, 50 + Math.sin(a - Math.PI / 2) * rr * 0.6, [140, 220, 255, 200]); }
    if (name === 'radio_rescue') { p.ellipse(256, 256, 260, 36, P.sand); p.poly([[300, 200], [470, 200], [450, 236], [320, 236]], '#e9eef2'); p.rect(360, 160, 60, 40, '#e9eef2'); p.rect(370, 168, 40, 10, '#3a5a8a'); p.rect(320, 216, 140, 6, P.red); }
  } else {
    // title art: emblem banner
    p.rect(106, 90, 300, 76, [20, 32, 40, 170]); p.frame(106, 90, 300, 76, P.gold);
    const ic = { intro_shipwreck: 'MAT_BRANCH', sea_success: 'CMP_SAIL', sea_retry: 'CMP_RUDDER', radio_signal: 'CMP_ANTENNA', radio_rescue: 'SPC_TX_MODULE' }[name];
    p.blit(scaleDown(drawItemIcon(ic), 2), 124, 96);
    for (let i = 0; i < 9; i++) p.rect(206 + i * 20, 118, 14, 4, P.gold); p.rect(206, 132, 180, 3, P.sand_light);
  }
  return p;
}
