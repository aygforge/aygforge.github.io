// core/SkillGlyphs.js — procedural 48×48 glyphs for the 40 Phase 03 skills (same art pipeline as the
// preserved Art.js icons: drawn once, cached by Art.sprite). Replaceable later with real icon files.
const OUT = '#24140c';
function st(g, w = 2.4) { g.strokeStyle = OUT; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; }
function fillst(g, c, w) { g.fillStyle = c; g.fill(); st(g, w); g.stroke(); }
function card(g, x, y, w = 20, h = 13, c = '#ffd166', a = 0) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 2.5); fillst(g, c, 1.8); g.fillStyle = '#2a5f8a'; g.fillRect(-w / 2 + 1, -h / 2 + 3, w - 2, 2.5); g.restore(); }
function star(g, x, y, r, n, c, inner = 0.45) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, rr = i % 2 ? r * inner : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); fillst(g, c, 1.8); }
function bolt(g, x, y, s = 1, c = '#ffe14d') { g.beginPath(); [[2, -14], [-7, 2], [0, 2], [-3, 14], [8, -3], [1, -3], [4, -14]].forEach(([a, b], i) => i ? g.lineTo(x + a * s, y + b * s) : g.moveTo(x + a * s, y + b * s)); g.closePath(); fillst(g, c, 1.8); }
function ring(g, x, y, r, c, w = 3) { g.beginPath(); g.arc(x, y, r, 0, 6.3); g.strokeStyle = c; g.lineWidth = w; g.stroke(); }
function coin(g, x, y, r = 9) { g.beginPath(); g.arc(x, y, r, 0, 6.3); fillst(g, '#ffd23f', 2); g.fillStyle = '#c98a10'; g.font = `900 ${r * 1.2}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('¢', x, y + 1); }
function flame(g, x, y, s = 1, c = '#ff7b3a') { g.beginPath(); g.moveTo(x, y - 14 * s); g.bezierCurveTo(x + 10 * s, y - 4 * s, x + 9 * s, y + 10 * s, x, y + 11 * s); g.bezierCurveTo(x - 9 * s, y + 10 * s, x - 10 * s, y - 2 * s, x, y - 14 * s); fillst(g, c, 1.8); g.beginPath(); g.ellipse(x, y + 4 * s, 4 * s, 6 * s, 0, 0, 6.3); g.fillStyle = '#ffe14d'; g.fill(); }
function drop(g, x, y, c) { g.beginPath(); g.moveTo(x, y - 12); g.bezierCurveTo(x + 9, y, x + 8, y + 10, x, y + 10); g.bezierCurveTo(x - 8, y + 10, x - 9, y, x, y - 12); fillst(g, c, 1.8); }
function snow(g, x, y, r) { st(g, 2.6); g.strokeStyle = '#e7f6ff'; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); } }
function shield(g, x, y, c) { g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 12, y - 9); g.lineTo(x + 11, y + 3); g.quadraticCurveTo(x + 8, y + 11, x, y + 15); g.quadraticCurveTo(x - 8, y + 11, x - 11, y + 3); g.lineTo(x - 12, y - 9); g.closePath(); fillst(g, c, 2); }
function arrow(g, x, y, a, c = '#fff') { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(12, 0); g.lineTo(-2, -9); g.lineTo(-2, -4); g.lineTo(-12, -4); g.lineTo(-12, 4); g.lineTo(-2, 4); g.lineTo(-2, 9); g.closePath(); fillst(g, c, 1.8); g.restore(); }
function boxG(g, x, y, c = '#d9a066') { g.beginPath(); g.rect(x - 11, y - 8, 22, 17); fillst(g, c, 2); g.fillStyle = 'rgba(255,240,200,.6)'; g.fillRect(x - 2, y - 8, 4, 17); }
function plus(g, x, y, s, c = '#6ee06a') { g.beginPath(); g.rect(x - s / 5, y - s / 2, s / 2.5, s); g.rect(x - s / 2, y - s / 5, s, s / 2.5); fillst(g, c, 1.6); }
function clock(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 6.3); fillst(g, '#fff6e4', 2); st(g, 2.2); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - r * 0.65); g.moveTo(x, y); g.lineTo(x + r * 0.5, y); g.stroke(); }

export const GLYPHS = {
  power_transaction: g => { card(g, 20, 26); plus(g, 33, 16, 14); },
  extended_signal: g => { card(g, 14, 30, 16, 11); [10, 16, 22].forEach(r => { g.beginPath(); g.arc(14, 30, r, -1.1, 0.2); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }); },
  overcharged_pos: g => { card(g, 20, 28); bolt(g, 32, 18, 0.8); },
  triple_transaction: g => { card(g, 16, 18, 18, 11); card(g, 24, 25, 18, 11); card(g, 32, 32, 18, 11, '#ff9a3c'); },
  precision_payment: g => { ring(g, 24, 24, 13, '#fff', 3.2); ring(g, 24, 24, 5, '#ff6b5a', 3); st(g, 3); g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(24, 5); g.lineTo(24, 13); g.moveTo(24, 35); g.lineTo(24, 43); g.moveTo(5, 24); g.lineTo(13, 24); g.moveTo(35, 24); g.lineTo(43, 24); g.stroke(); },
  heavy_receipt: g => { g.beginPath(); g.moveTo(14, 18); g.lineTo(34, 18); g.lineTo(39, 38); g.lineTo(9, 38); g.closePath(); fillst(g, '#5d6b82', 2); g.beginPath(); g.arc(24, 15, 5, 0, 6.3); ring(g, 24, 14, 5, OUT, 2.5); },
  explosive_card: g => { star(g, 24, 24, 17, 8, '#ff9a3c', 0.5); card(g, 24, 25, 14, 9); },
  execution_receipt: g => { g.beginPath(); g.arc(24, 21, 12, 0, 6.3); fillst(g, '#f4ead2', 2); g.fillStyle = OUT; g.beginPath(); g.arc(19, 21, 3.5, 0, 6.3); g.arc(29, 21, 3.5, 0, 6.3); g.fill(); g.fillRect(18, 33, 12, 6); },
  elite_collector: g => { g.beginPath(); g.moveTo(10, 32); g.lineTo(12, 14); g.lineTo(19, 22); g.lineTo(24, 11); g.lineTo(29, 22); g.lineTo(36, 14); g.lineTo(38, 32); g.closePath(); fillst(g, '#ffd23f', 2); },
  boss_invoice: g => { g.beginPath(); g.arc(24, 27, 12, 0, 6.3); fillst(g, '#a83526', 2); g.beginPath(); g.moveTo(14, 20); g.lineTo(9, 7); g.lineTo(19, 16); g.moveTo(34, 20); g.lineTo(39, 7); g.lineTo(29, 16); fillst(g, '#f4ead2', 1.8); },
  point_blank: g => { ring(g, 24, 24, 15, 'rgba(255,255,255,.35)', 2); ring(g, 24, 24, 7, '#ffd23f', 4); g.fillStyle = '#fff'; g.beginPath(); g.arc(24, 24, 3, 0, 6.3); g.fill(); },
  long_distance_payment: g => { ring(g, 24, 24, 15, '#ffd23f', 4); ring(g, 24, 24, 7, 'rgba(255,255,255,.35)', 2); arrow(g, 24, 24, -0.6); },
  static_charge: g => { bolt(g, 18, 24, 0.9); bolt(g, 32, 24, 0.9); },
  thunder_strike: g => { g.beginPath(); g.ellipse(24, 15, 15, 8, 0, 0, 6.3); fillst(g, '#cfd8e6', 2); bolt(g, 24, 30, 0.9); },
  frostbite: g => { snow(g, 24, 24, 15); g.beginPath(); g.arc(24, 24, 4, 0, 6.3); fillst(g, '#9fd8ff', 1.5); },
  ice_shatter: g => { [[16, 18, 0.4], [31, 20, -0.5], [24, 33, 0.1]].forEach(([x, y, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 0); g.lineTo(0, 9); g.lineTo(-6, 0); g.closePath(); fillst(g, '#bfefff', 1.8); g.restore(); }); },
  flame_burst: g => { star(g, 24, 26, 18, 7, '#ffb347', 0.55); flame(g, 24, 25, 0.7); },
  heatwave: g => { [14, 24, 34].forEach(x => { g.beginPath(); g.moveTo(x, 40); g.bezierCurveTo(x - 6, 32, x + 6, 24, x, 16); g.bezierCurveTo(x - 6, 12, x + 2, 8, x, 6); g.strokeStyle = '#ffe14d'; g.lineWidth = 3.5; g.stroke(); }); },
  venom_spread: g => { drop(g, 16, 20, '#7ddc4a'); drop(g, 31, 26, '#7ddc4a'); drop(g, 22, 34, '#9ff06a'); },
  corrosion: g => { drop(g, 24, 20, '#c9f04a'); g.fillStyle = 'rgba(20,32,58,.6)'; g.fillRect(10, 34, 28, 5); },
  heavy_armor: g => { shield(g, 24, 24, '#8e99a8'); g.fillStyle = '#cfd8e6'; g.fillRect(18, 16, 12, 4); g.fillRect(18, 24, 12, 4); },
  first_aid_kit: g => { g.beginPath(); g.roundRect(9, 13, 30, 24, 4); fillst(g, '#fff6e4', 2); plus(g, 24, 25, 16, '#ef5350'); },
  shock_absorber: g => { st(g, 3); g.strokeStyle = '#cfd8e6'; g.beginPath(); for (let i = 0; i <= 6; i++) g.lineTo(i % 2 ? 31 : 17, 10 + i * 4.5); g.stroke(); boxG(g, 24, 37, '#d9a066'); },
  insulated_box: g => { boxG(g, 24, 26, '#9fd8ff'); snow(g, 34, 14, 7); },
  cooling_system: g => { g.beginPath(); g.arc(24, 24, 15, 0, 6.3); fillst(g, '#5aa9e6', 2); for (let i = 0; i < 3; i++) { g.save(); g.translate(24, 24); g.rotate(i * 2.09); g.beginPath(); g.ellipse(0, -7, 4, 7, 0, 0, 6.3); g.fillStyle = '#e7f6ff'; g.fill(); g.restore(); } },
  last_stand: g => { shield(g, 24, 24, '#ef5350'); g.fillStyle = '#fff'; g.fillRect(22, 13, 4, 12); g.fillRect(22, 28, 4, 4); },
  package_repair: g => { boxG(g, 20, 28); st(g, 3.2); g.strokeStyle = '#cfd8e6'; g.beginPath(); g.moveTo(26, 22); g.lineTo(38, 10); g.stroke(); g.beginPath(); g.arc(38, 10, 4, 0, 6.3); ring(g, 38, 10, 4, '#cfd8e6', 2.5); },
  turbo_delivery: g => { arrow(g, 22, 24, 0, '#7fe1ff'); arrow(g, 32, 24, 0, '#fff'); },
  quick_recovery: g => { clock(g, 22, 26, 12); arrow(g, 34, 14, -0.8, '#6ee06a'); },
  smooth_rider: g => { [16, 26, 36].forEach(y => { g.beginPath(); g.moveTo(8, y); g.bezierCurveTo(16, y - 6, 24, y + 6, 40, y); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }); },
  light_footprint: g => { g.beginPath(); g.ellipse(24, 24, 7, 17, 0.6, 0, 6.3); fillst(g, '#fff6e4', 2); st(g, 1.5); g.beginPath(); g.moveTo(14, 36); g.lineTo(33, 12); g.stroke(); },
  time_extension: g => { clock(g, 21, 26, 13); plus(g, 36, 14, 12); },
  checkpoint_boost: g => { st(g, 3); g.beginPath(); g.moveTo(14, 8); g.lineTo(14, 40); g.stroke(); g.beginPath(); g.moveTo(14, 9); g.lineTo(32, 9); g.lineTo(28, 16); g.lineTo(32, 23); g.lineTo(14, 23); fillst(g, '#5fd3b4', 2); arrow(g, 32, 34, 0, '#ffd23f'); },
  final_sprint: g => { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : OUT; g.fillRect(12 + i * 6, 9 + j * 6, 6, 6); } st(g, 3); g.beginPath(); g.moveTo(12, 9); g.lineTo(12, 40); g.stroke(); arrow(g, 32, 33, 0, '#ffd23f'); },
  golden_receipt: g => { g.beginPath(); g.moveTo(12, 8); g.lineTo(32, 8); g.lineTo(32, 38); g.lineTo(27, 35); g.lineTo(22, 38); g.lineTo(17, 35); g.lineTo(12, 38); g.closePath(); fillst(g, '#fff6e4', 2); coin(g, 33, 32, 8); },
  lucky_customer: g => { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; g.beginPath(); g.arc(24 + Math.cos(a) * 8, 22 + Math.sin(a) * 8, 7.5, 0, 6.3); fillst(g, '#6ee06a', 1.8); } st(g, 2.5); g.beginPath(); g.moveTo(24, 24); g.lineTo(28, 42); g.stroke(); },
  fast_learner: g => { g.beginPath(); g.moveTo(8, 16); g.lineTo(24, 8); g.lineTo(40, 16); g.lineTo(24, 24); g.closePath(); fillst(g, '#5aa9e6', 2); g.beginPath(); g.rect(15, 20, 18, 10); fillst(g, '#5aa9e6', 2); arrow(g, 33, 36, -1.57, '#7fe1ff'); },
  bonus_contract: g => { g.beginPath(); g.roundRect(10, 7, 26, 34, 3); fillst(g, '#fff6e4', 2); st(g, 2); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(15, 15 + i * 7); g.lineTo(31, 15 + i * 7); g.stroke(); } coin(g, 34, 34, 8); },
  elite_bounty: g => { g.beginPath(); g.moveTo(10, 30); g.lineTo(12, 14); g.lineTo(19, 21); g.lineTo(24, 11); g.lineTo(29, 21); g.lineTo(36, 14); g.lineTo(38, 30); g.closePath(); fillst(g, '#ffd23f', 2); coin(g, 24, 36, 8); },
  second_choice: g => { st(g, 3.5); g.strokeStyle = '#fff'; g.beginPath(); g.arc(24, 24, 13, 0.3, 5.2); g.stroke(); g.beginPath(); g.moveTo(35, 7); g.lineTo(37, 17); g.lineTo(27, 16); fillst(g, '#fff', 2); },
};
export function drawGlyph(g, id) { (GLYPHS[id] || (gg => { card(gg, 24, 24); }))(g); }
