'use strict';
// ================= TIMELINE (from narration silences) =================
const T = { s1: 0, s2: 8.80, s3: 11.70, s4: 19.92, s5: 26.33, s6: 31.58, s7: 39.51, s8: 45.41, s9: 53.79, s10: 59.21, s11: 66.95, s12: 71.84, s13: 81.30, s14: 85.25, end: 88.9 };
const FPS = 30, DURATION = T.end;
const SIL = [[4.27, 4.96], [8.04, 8.80], [10.78, 11.70], [12.36, 12.69], [15.19, 15.56], [19.11, 19.92], [22.88, 23.23], [25.50, 26.33], [30.65, 31.58], [34.78, 35.11], [38.65, 39.51], [44.42, 45.41], [48.96, 49.42], [52.75, 53.79], [56.41, 56.72], [58.36, 59.21], [60.60, 61.00], [65.96, 66.95], [70.76, 71.84], [76.13, 76.60], [78.50, 78.85], [80.18, 81.30], [82.24, 82.74]];
const CAPS = [
  [0.06, 8.04, '2016’da Microsoft internete bir yapay zekâ bıraktı… yaklaşık 16 saat sonra kapatmak zorunda kaldı.'],
  [8.80, 10.78, 'Yapay zekânın adı Tay’di.'],
  [11.70, 19.11, 'Microsoft, Tay’i gençlerle sosyal medyada konuşarak insanların nasıl iletişim kurduğunu öğrenmesi için geliştirmişti.'],
  [19.92, 25.50, 'Tay, Twitter üzerinden insanlarla sohbet ediyor ve aldığı mesajlara cevap veriyordu.'],
  [26.33, 30.65, 'Ama internet kullanıcıları kısa sürede sistemin nasıl çalıştığını fark etti.'],
  [31.58, 38.65, 'Bazı kullanıcılar Tay’e bilinçli olarak saldırgan, nefret dolu ve uygunsuz ifadeler öğretmeye başladı.'],
  [39.51, 44.42, 'Tay de gördüğü bu içerikleri tekrar etmeye ve benzer cevaplar üretmeye başladı.'],
  [45.41, 52.75, 'Başlangıçta eğlenceli bir sohbet botu olarak tasarlanan sistem, birkaç saat içinde tamamen kontrolden çıkmış görünüyordu.'],
  [53.79, 58.36, 'Microsoft bazı mesajları silmeye başladı ve Tay’i çevrimdışı aldı.'],
  [59.21, 65.96, 'Şirket daha sonra bunun, botun özelliklerini kötüye kullanmak için yapılan koordineli bir girişim olduğunu açıkladı.'],
  [66.95, 70.76, 'Tay yaklaşık 16 saat içinde internetten kaldırılmıştı.'],
  [71.84, 80.18, 'Microsoft’un insanlardan öğrenmesi için internete bıraktığı yapay zekâ, insanlardan öğrendikleri yüzünden aynı gün kapatılmıştı.'],
];
const FINAL1 = [81.30, 82.24, 'İnanması güç ama'], FINAL2 = [82.74, 84.70, 'bu gerçekten yaşandı.'];

// word timings: spread words over the speech (non-silent) portion of the sentence
function wordTimes(a, b, text) {
  const words = text.split(' ');
  const segs = []; let cur = a;
  for (const [s0, s1] of SIL) { if (s0 > a && s1 < b) { segs.push([cur, s0]); cur = s1; } }
  segs.push([cur, b]);
  const total = segs.reduce((s, x) => s + x[1] - x[0], 0);
  const wts = words.map(w => w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.2);
  const sum = wts.reduce((s, x) => s + x, 0);
  let acc = 0; const out = [];
  for (let i = 0; i < words.length; i++) {
    let d = acc / sum * total, tt = segs[segs.length - 1][1];
    for (const [s0, s1] of segs) { if (d <= s1 - s0 + 1e-6) { tt = s0 + d; break; } d -= s1 - s0; }
    out.push(tt); acc += wts[i];
  }
  return { words, times: out };
}
function layoutCap(text, weight = 700) {
  const maxW = 968;
  for (let size = 66; size >= 40; size -= 2) {
    g.font = `${weight} ${size}px Kalam`;
    const words = text.split(' '); const lines = [[]]; let w = 0; const sp = g.measureText(' ').width;
    const pos = [];
    for (let i = 0; i < words.length; i++) {
      const ww = g.measureText(words[i]).width;
      if (w > 0 && w + sp + ww > maxW) { lines.push([]); w = 0; }
      const x = w > 0 ? w + sp : 0; lines[lines.length - 1].push(i); pos.push({ x, ww, line: lines.length - 1 }); w = x + ww;
    }
    const lh = size * 1.22;
    if (lines.length * lh <= 400 || size === 40) {
      const lw = lines.map(L => { const p = pos[L[L.length - 1]]; return p.x + p.ww; });
      return { size, lh, pos, lw, n: lines.length };
    }
  }
}
let CAPL = null;
function drawCaptions(t) {
  if (!CAPL) CAPL = CAPS.map(c => ({ a: c[0], b: c[1], ...wordTimes(c[0], c[1], c[2]), lay: layoutCap(c[2]) }));
  for (let i = 0; i < CAPL.length; i++) {
    const c = CAPL[i]; const nextA = i + 1 < CAPL.length ? CAPL[i + 1].a : FINAL1[0];
    if (t < c.a - .1 || t > nextA) continue;
    const al = 1 - seg(t, nextA - .2, nextA - .03);
    const L = c.lay; g.save(); g.font = `700 ${L.size}px Kalam`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillStyle = C.ink;
    const y0 = 58 + L.size + (400 - L.n * L.lh) * .28;
    for (let k = 0; k < c.words.length; k++) {
      const p = L.pos[k]; const r = seg(t, c.times[k] - .1, c.times[k] + .1); if (r <= 0) continue;
      const x = (W - L.lw[p.line]) / 2 + p.x, y = y0 + p.line * L.lh + (1 - eo(r)) * 10 + Math.sin(p.line * 2.1 + k) * 1.5;
      g.globalAlpha = al * r; g.fillText(c.words[k], x, y);
    }
    g.restore();
  }
  // final two-tone line
  if (t >= FINAL1[0] - .1) {
    const al = 1 - seg(t, T.s14, T.s14 + .5);
    const draw = (F, y, size, weight, color, bold) => {
      const wt = wordTimes(F[0], F[1], F[2]); g.save(); g.font = `${weight} ${size}px Kalam`; g.textAlign = 'left'; g.fillStyle = color;
      const sp = g.measureText(' ').width; const ws = wt.words.map(w => g.measureText(w).width); const tot = ws.reduce((s, x) => s + x, 0) + sp * (ws.length - 1);
      let x = (W - tot) / 2;
      for (let k = 0; k < wt.words.length; k++) {
        const r = seg(t, wt.times[k] - .1, wt.times[k] + .12);
        if (r > 0) { g.globalAlpha = al * r; const yy = y + (1 - eo(r)) * 12; g.fillText(wt.words[k], x, yy); if (bold) { g.fillText(wt.words[k], x + 1.5, yy + .8); } }
        x += ws[k] + sp;
      }
      g.restore();
    };
    draw(FINAL1, 190, 70, 400, '#77739c', false);
    draw(FINAL2, 318, 96, 700, '#1b1842', true);
  }
  if (t >= T.s14) { A(seg(t, T.s14 + .5, T.s14 + .95), () => txt('Gerçek görüntü', 540, 290, 78, 700, '#1b1842')); }
}

// ================= PAPER =================
let paperC = null, grainC = [];
function buildPaper() {
  paperC = document.createElement('canvas'); paperC.width = W; paperC.height = H; const p = paperC.getContext('2d');
  p.fillStyle = C.paper; p.fillRect(0, 0, W, H);
  const r = rng(5);
  for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H, rad = 120 + r() * 380; const gr = p.createRadialGradient(x, y, 0, x, y, rad); const c = r() < .5 ? '255,250,235' : '196,170,128'; gr.addColorStop(0, `rgba(${c},.07)`); gr.addColorStop(1, `rgba(${c},0)`); p.fillStyle = gr; p.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  for (let i = 0; i < 900; i++) { p.strokeStyle = `rgba(120,95,60,${.03 + r() * .05})`; p.lineWidth = .6 + r(); const x = r() * W, y = r() * H, a = r() * 6.28, l = 6 + r() * 26; p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
  const id = p.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 13; d[i] += n; d[i + 1] += n; d[i + 2] += n * .9; }
  p.putImageData(id, 0, 0);
  const vg = p.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .72); vg.addColorStop(0, 'rgba(120,90,50,0)'); vg.addColorStop(1, 'rgba(120,90,50,.14)'); p.fillStyle = vg; p.fillRect(0, 0, W, H);
  for (let k = 0; k < 3; k++) {
    const c = document.createElement('canvas'); c.width = W / 2; c.height = H / 2; const q = c.getContext('2d'); const im = q.createImageData(W / 2, H / 2); const e = im.data; const rr = rng(50 + k);
    for (let i = 0; i < e.length; i += 4) { const v = 255 - Math.pow(rr(), 2.2) * 62; e[i] = v; e[i + 1] = v; e[i + 2] = v; e[i + 3] = 255; }
    q.putImageData(im, 0, 0); grainC.push(c);
  }
}

// ================= PHONE + SCREENS =================
function phone(cx, cy, s, alpha, rot, screenFn) {
  if (alpha <= 0.004) return;
  const w = 600 * s, h = 1060 * s, x = cx - w / 2, y = cy - h / 2;
  g.save(); g.globalAlpha *= alpha; g.translate(cx, cy); g.rotate(rot || 0); g.translate(-cx, -cy);
  shape(rrectPts(x, y, w, h, 74 * s), C.body, { seed: 11, w: 7, solid: true, base: .92 });
  const R = { x: x + 28 * s, y: y + 100 * s, w: w - 56 * s, h: h - 220 * s, s };
  g.fillStyle = C.white; g.fillRect(R.x, R.y, R.w, R.h);
  g.save(); g.beginPath(); g.rect(R.x, R.y, R.w, R.h); g.clip(); screenFn(R); g.restore();
  stroke(rrectPts(R.x, R.y, R.w, R.h, 10 * s), { closed: true, w: 4.5, seed: 12 });
  stroke([[cx - 46 * s, y + 52 * s], [cx + 46 * s, y + 52 * s]], { w: 7 * s + 1, color: '#8f8bb5', seed: 13 });
  shape(ellPts(cx, y + h - 60 * s, 36 * s, 36 * s, 12), '#6b66a0', { seed: 14, w: 4, gap: 7 });
  g.restore();
}
function feed(R, o) {
  const s = R.s, hh = o.headerH * s, ph = 150 * s, bottom = R.y + R.h - 14 * s, n = o.n;
  const bw = 300 * s, bh = 100 * s;
  for (let i = Math.floor(n); i >= Math.max(0, Math.floor(n) - 8); i--) {
    const top = bottom - ph * (n - i); if (top + ph < R.y + hh - 10) break;
    const k = o.kind(i), ap = clamp(n - i), cy = top + ph / 2;
    const d = o.del ? o.del(i) : 0; let a = 1 - seg(d, .55, 1);
    if (o.flick && hsh(i, BOIL) > 1 - o.flick) a *= .18;
    if (a <= 0) continue;
    A(a * seg(ap, 0, .4), () => {
      const isT = k.who === 'tay';
      const bx = isT ? R.x + R.w - 118 * s - bw / 2 : R.x + 118 * s + bw / 2;
      TR(bx, cy, .55 + .45 * back(seg(ap, 0, 1)), 0, () => {
        if (isT) { avatar(R.x + R.w - 60 * s, cy, 78 * s, { mood: k.dark ? 1 : 0, glitch: k.dark ? .45 : 0 }); bubble(bx, cy, bw, bh, { col: k.dark ? '#cfd3e2' : C.cyanL, side: 'r', content: k.content, seed: 200 + i * 9 }); }
        else { user(R.x + 60 * s, cy, 40 * s, { ci: i >> 1, troll: k.dark ? 1 : 0, seed: 300 + i * 7 }); bubble(bx, cy, bw, bh, { col: k.dark ? '#dad5e2' : C.white, side: 'l', content: k.content, seed: 200 + i * 9 }); }
      });
      if (d > 0) { const q = seg(d, 0, .4); stroke(linePts(R.x + 30 * s, cy - 30 * s, R.x + 30 * s + (R.w - 60 * s) * q, cy + 30 * s - 60 * s * (1 - q)), { color: C.red, w: 9, seed: 500 + i }); if (d > .2) { const q2 = seg(d, .2, .55); stroke(linePts(R.x + 30 * s, cy + 30 * s, R.x + 30 * s + (R.w - 60 * s) * q2, cy + 30 * s - 60 * s * q2), { color: C.red, w: 9, seed: 600 + i }); } }
    });
  }
  // header
  g.fillStyle = C.white; g.fillRect(R.x, R.y, R.w, hh);
  A(.5, () => fill([[R.x, R.y], [R.x + R.w, R.y], [R.x + R.w, R.y + hh], [R.x, R.y + hh]], C.cyanL, { seed: 21, sharp: true, amp: 0 }));
  stroke([[R.x, R.y + hh], [R.x + R.w, R.y + hh]], { w: 4, seed: 22 });
  const ax = R.x + R.w / 2, ay = R.y + hh * .5, as = hh * .76;
  if (o.av.show !== false) avatar(ax, ay, as, o.av);
  else stroke(ellPts(ax, ay, as * .45, as * .45, 12), { closed: true, w: 3.5, dash: [10, 10], color: C.inkSoft, seed: 23 });
  shape(ellPts(ax + as * .62, ay + as * .38, 13 * s, 13 * s, 8), mix(C.green, C.greyD, o.av.offline || 0), { seed: 24, w: 3, gap: 5, base: .95, solid: true });
  scribLine(R.x + 24 * s, ay - 10 * s, 110 * s, 25, C.inkSoft, 4); scribLine(R.x + 24 * s, ay + 22 * s, 70 * s, 26, C.inkSoft, 4);
  for (let i = 0; i < 3; i++) { g.fillStyle = C.inkSoft; g.beginPath(); g.arc(R.x + R.w - 36 * s, ay - 22 * s + i * 22 * s, 4.5 * s, 0, 7); g.fill(); }
  if (o.dim > 0) { g.save(); g.globalAlpha *= o.dim * .62; g.fillStyle = '#9d99b3'; g.fillRect(R.x, R.y, R.w, R.h); g.restore(); A(o.dim, () => { if (o.pill) pill(R.x + R.w / 2, R.y + R.h * .56, s * 1.05, 'çevrimdışı'); }); }
}
function offlineScreen(R, withAvatar, withPill) {
  g.fillStyle = '#dad7e4'; g.fillRect(R.x, R.y, R.w, R.h);
  A(.5, () => fill([[R.x, R.y], [R.x + R.w, R.y], [R.x + R.w, R.y + R.h], [R.x, R.y + R.h]], '#b9b5ca', { seed: 31, sharp: true, amp: 0, gap: 16 }));
  if (withAvatar) avatar(R.x + R.w / 2, R.y + R.h * .4, 330 * R.s, { offline: 1 });
  if (withPill) pill(R.x + R.w / 2, R.y + R.h * .72, R.s * 1.15, 'çevrimdışı');
}

// ---- feed logic ----
const FRIENDLY = ['heart', 'smile', 'lines', 'star', 'note'];
const NASTY = ['dark', 'warn', 'corrupt'];
function nIntro(t) { let n = t < 4.3 ? 3 + 3.2 * t : 16.76 + (Math.min(t, 7) - 4.3) * 1.2; if (t > 8.1) n = lerp(n, 4, eio(seg(t, 8.1, 8.7))); return n; }
function introKind(i) { const dark = i >= 8; return { who: i % 2 ? 'tay' : 'user', dark, content: dark ? NASTY[i % 3] : FRIENDLY[Math.floor(hsh(i, 1) * 5)] }; }
const NK = [[19.92, 2], [26.3, 9], [31.58, 11], [39.5, 21], [45.4, 27], [49.4, 32], [53.6, 62]];
const nLin = t => kf(t, NK, lin);
function nMain(t) { const n = nLin(Math.min(t, 53.6)); const f = Math.floor(n); return f + eo(clamp((n - f) * 1.25)); }
const entryT = []; (function () { let i = 0; for (let t = 19.9; t < 54; t += .02) { const n = nLin(t); while (i <= n) entryT[i++] = t; } for (; i < 80; i++) entryT[i] = 54; })();
function mainKind(i) {
  const tau = entryT[i] || 0, who = i % 2 === 0 ? 'user' : 'tay'; let dark;
  if (who === 'user') dark = tau > 31.9 && hsh(i, 2) < kf(tau, [[31.6, .2], [32.6, .8], [38, 1]], lin);
  else dark = tau > 39.6;
  return { who, dark, content: dark ? NASTY[Math.floor(hsh(i, 3) * 3)] : (who === 'tay' && tau > 32.5 ? 'lines' : FRIENDLY[Math.floor(hsh(i, 1) * 5)]) };
}
const N9 = Math.floor(nLin(53.6));
const DEL = {}; (function () { let j = 0; for (let i = N9 - 6; i < N9; i++) { DEL[i] = 54.25 + j * .36; j++; } })();
const delFn = t => i => DEL[i] !== undefined ? seg(t, DEL[i], DEL[i] + .5) : 0;

// ================= ACTOR STATE =================
function phoneState(t) {
  let cx = kf(t, [[8.8, 440], [9.6, 230], [19.7, 230], [19.71, 540], [26.33, 540], [27.1, 300], [31.58, 300], [32.3, 540], [45.41, 540], [46.1, 470], [53.79, 470], [54.4, 540], [80.8, 540], [80.81, 450]]);
  let cy = kf(t, [[8.8, 1180], [9.6, 1570], [19.7, 1570], [19.71, 1300], [20.6, 1190], [26.33, 1190], [27.1, 1010], [39.51, 1010], [40.2, 1200], [45.41, 1200], [46.1, 1230], [53.79, 1230], [54.4, 1210], [59.21, 1210], [60, 900], [66.9, 900], [67.5, 1010], [80.8, 1010], [80.81, 1290], [81.8, 1200]]);
  const s = kf(t, [[8.8, 1], [9.6, .42], [19.7, .42], [19.71, .8], [20.6, 1.18], [26.33, 1.18], [27.1, .62], [31.58, .62], [32.3, .85], [39.51, .85], [40.2, 1.15], [45.41, 1.15], [46.1, 1.05], [53.79, 1.05], [54.4, 1.12], [59.21, 1.12], [60, .6], [66.9, .6], [67.5, .25], [80.8, .25], [80.81, .8], [81.8, 1]]);
  const a = kf(t, [[11.7, 1], [12.3, 0], [19.7, 0], [20.3, 1], [66.9, 1], [67.45, 0], [80.85, 0], [81.6, 1]], lin);
  const rot = kf(t, [[8.8, 0], [9.6, -.12], [12.3, -.12], [12.31, 0]]);
  // shake
  let amp = 0;
  if (t < 8) amp = kf(t, [[1.6, 0], [3, 5], [6.9, 6], [7.05, 0]], lin);
  else if (t > 33 && t < 39.6) amp = kf(t, [[33, 0], [36, 3], [39.3, 3], [39.6, 0]], lin);
  else if (t > 40 && t < 45.6) amp = kf(t, [[40.2, 0], [42, 3], [45.2, 4], [45.6, 2]], lin);
  else if (t >= 45.6 && t < 54.3) amp = kf(t, [[45.6, 2], [49.4, 3], [53.5, 10], [53.79, 10], [54.2, 0]], lin);
  if (amp > 0) { const r = rng(4000 + Math.floor(t * 15)); cx += (r() - .5) * 2 * amp; cy += (r() - .5) * 2 * amp; }
  cy += Math.sin(t * 1.3) * 4;
  return { cx, cy, s, a, rot };
}
function freeAvatar(t) {
  const a = kf(t, [[8.74, 0], [8.8, 1], [20.4, 1], [20.65, 0], [67.2, 0], [67.5, 1]], lin);
  if (a <= 0) return null;
  let x, y, size, mood = 0, glitch = 0, offline = 0;
  if (t < 30) {
    const e = t < 11 ? back : eio;
    x = t < 11.7 ? lerp(440, 540, back(seg(t, 8.8, 9.5))) : kf(t, [[11.7, 540], [19.7, 540]]);
    y = t < 11.7 ? lerp(865, 1080, back(seg(t, 8.8, 9.5))) : kf(t, [[11.7, 1080], [12.5, 1140], [19.7, 1140], [20.5, 777]]);
    size = t < 11.7 ? lerp(180, 520, back(seg(t, 8.8, 9.5))) : kf(t, [[11.7, 520], [12.5, 300], [19.7, 300], [20.5, 150]]);
    y += Math.sin(t * 2.2) * 8;
  } else {
    const h = hours11(t);
    x = kf(t, [[71.84, lerp(150, 930, h / 16)], [72.7, 540], [80.9, 540], [81.8, 450]]);
    y = kf(t, [[71.84, 1590], [72.7, 1060], [80.9, 1060], [81.8, 1110]]);
    size = kf(t, [[71.84, 115], [72.7, 340], [80.9, 340], [81.8, 300]]);
    if (t < 71.84) offline = seg(h, 15.2, 16); else if (t < 79.3) { offline = 1 - seg(t, 71.84, 72.4); glitch = kf(t, [[75.6, 0], [78.8, .9]], lin); mood = glitch > .6 ? 1 : glitch > .15 ? .5 : 0; size *= 1 + .1 * glitch + .015 * Math.sin(t * 9); }
    else offline = 1;
    y += Math.sin(t * 1.7) * 5;
  }
  return { x, y, size, a, mood, glitch, offline, blink: (t > 10.45 && t < 10.62) || (t % 3.1 < .12 && t > 12) };
}
const hours11 = t => kf(t, [[67.4, 0], [70.4, 16]]);

// ================= SCENES: BACK LAYER =================
const RING = []; for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i + .5) / 8 * Math.PI * 2; RING.push([540 + 395 * Math.cos(a), 1150 + 490 * Math.sin(a)]); }
const OBS = [[150, 1640], [345, 1640], [540, 1640], [735, 1640], [930, 1640]];
const TROLL = []; for (let i = 0; i < 7; i++) TROLL.push([110 + i * 143.3, 1650 + (i % 2 ? 70 : 0)]); TROLL.push([95, 1150]); TROLL.push([985, 1150]);
const OBS2T = [0, 2, 3, 4, 6];
const CLUS = [[150, 760], [930, 760], [150, 1110], [930, 1110]];

function backLayer(t) {
  // S3: ring of young users
  const ra = win(t, 11.9, 19.75, .01, .5);
  if (ra > 0) A(ra, () => {
    const pull = 1 - .45 * eio(seg(t, 19.6, 20.3));
    for (let i = 0; i < 8; i++) {
      const p = pop(t, 12.0 + i * .2); if (p <= 0) continue;
      const x = 540 + (RING[i][0] - 540) * pull, y = 1150 + (RING[i][1] - 1150) * pull + Math.sin(t * 1.8 + i) * 7;
      const ar = seg(t, 12.7 + i * .15, 13.4 + i * .15);
      if (ar > 0) { const dx = 540 - x, dy = 1140 - y, L = Math.hypot(dx, dy); A(.45, () => arrow(quadPts(x + dx / L * 95, y + dy / L * 95, (x + 540) / 2 + dy * .12, (y + 1140) / 2 - dx * .12, 540 - dx / L * 205, 1140 - dy / L * 205, ar), { color: C.inkSoft, w: 4, seed: 700 + i, dash: [14, 12] })); }
      TR(x, y, p, 0, () => user(x, y, 78, { ci: i, seed: 710 + i * 5, phone: true }));
    }
    // learning ring around Tay
    const lr = seg(t, 15.5, 19.3);
    if (lr > 0) { const pts = []; const m = Math.max(2, Math.round(40 * lr)); for (let k = 0; k <= m; k++) { const a = -Math.PI / 2 + k / 40 * Math.PI * 2; pts.push([540 + 205 * Math.cos(a), 1140 + 205 * Math.sin(a) + Math.sin(t * 2.2) * 8]); } stroke(pts, { color: C.cyan, w: 12, seed: 760, alpha: .9 }); }
  });
  // S4: floating reactions beside the phone
  const fa = win(t, 20.4, 26.2, .5, .4);
  if (fa > 0) A(fa * .8, () => { for (let i = 0; i < 8; i++) { const u = ((t - 20 + i * .9) % 5.2) / 5.2; const x = (i % 2 ? 985 : 95) + Math.sin(u * 7 + i) * 38, y = 1820 - u * 1250; A(Math.min(seg(u, 0, .12), 1 - seg(u, .8, 1)), () => { if (i % 3 === 0) heart(x, y, 62, C.mag, 800 + i); else if (i % 3 === 1) smiley(x, y, 58, 800 + i); else star(x, y, 66, C.yellow, 800 + i, u * 3); }); } });
  // S5/S6/S7: observers -> trolls
  const oa = win(t, 26.5, 45.3, .01, .4);
  if (oa > 0) A(oa, () => {
    const mv = eio(seg(t, 31.5, 32.3)); const leave = seg(t, 39.4, 40.0);
    for (let j = 0; j < 9; j++) {
      const oi = OBS2T.indexOf(j); let x, y, r, p, troll;
      if (oi >= 0) { x = lerp(OBS[oi][0], TROLL[j][0], mv); y = lerp(OBS[oi][1], TROLL[j][1], mv); r = lerp(85, 70, mv); p = pop(t, 26.55 + oi * .12); troll = Math.max((oi === 1 || oi === 3) ? seg(t, 29.5, 30.1) : 0, seg(t, 31.5, 32.2)); }
      else { x = TROLL[j][0]; y = TROLL[j][1]; r = 70; p = pop(t, 32.0 + (j % 4) * .15); troll = 1; }
      if (p <= 0) continue;
      let al = 1;
      if (j === 7) { x = lerp(x, 95, eio(leave)); y = lerp(y, 1130, eio(leave)); r = lerp(r, 62, leave); } else al = 1 - leave;
      y += Math.sin(t * 2 + j * 1.3) * 5;
      const ps = phoneState(t);
      A(al, () => TR(x, y, p, 0, () => user(x, y, r, { ci: j + 3, troll, seed: 900 + j * 5, eyes: t < 32.2, look: [(ps.cx - x) / 300, (ps.cy - y) / 300] })));
    }
  });
  // S10: clusters + converging arrows
  const ca = win(t, 59.5, 66.8, .01, .45);
  if (ca > 0) A(ca, () => {
    for (let c = 0; c < 4; c++) {
      const [cx, cy] = CLUS[c]; const p = pop(t, 59.6 + c * .22); if (p <= 0) continue;
      const tx = cx < 540 ? 385 : 695, ty = cy < 900 ? 800 : 1010, sx = cx < 540 ? cx + 95 : cx - 95;
      const ar = seg(t, 60.4 + c * .18, 61.2 + c * .18);
      if (ar > 0) { arrow(quadPts(sx, cy, (sx + tx) / 2, cy + (cy < 900 ? -50 : 50), tx, ty, ar), { color: '#a84f7a', w: 7, seed: 1000 + c, head: 28 });
        if (ar >= 1) { const u = ((t * .9 + c * .27) % 1); const q = quadPts(sx, cy, (sx + tx) / 2, cy + (cy < 900 ? -50 : 50), tx, ty, 1, 18)[Math.floor(u * 18)]; A(Math.min(1, 4 * (1 - u)), () => darkScrib(q[0], q[1], 20, 14, 1010 + c, C.dark, 4)); } }
      TR(cx, cy, p, 0, () => { [[-52, 34], [52, 34], [0, -48]].forEach((o, k) => user(cx + o[0], cy + o[1] + Math.sin(t * 2 + k + c) * 3, 47, { ci: c + k, troll: 1, seed: 1020 + c * 9 + k * 3 })); });
    }
  });
  // S11: day timeline
  const ta = win(t, 67.1, 71.7, .4, .5);
  if (ta > 0) A(ta, () => {
    const h = hours11(t), mx = lerp(150, 930, h / 16), y = 1730;
    stroke(linePts(150, y, 930, y), { w: 6, color: C.inkSoft, seed: 1100, dash: [4, 16] });
    if (mx > 160) stroke(linePts(150, y, mx, y), { w: 12, color: C.cyan, seed: 1101 });
    const st = [150, 410, 670, 930];
    for (let i = 0; i < 4; i++) {
      const on = h >= i * 16 / 3 - .2, x = st[i], b = 1 + .18 * (1 - seg(Math.abs(h - i * 16 / 3), 0, 1.2)) * (on ? 1 : 0);
      TR(x, y, b, 0, () => {
        shape(ellPts(x, y, 58, 58, 14), on ? [C.yellowL, C.yellowL, C.blueL, C.greyL][i] : C.white, { seed: 1110 + i, w: 5, solid: true });
        if (i === 0) { g.save(); g.beginPath(); g.rect(x - 60, y - 60, 120, 68); g.clip(); shape(ellPts(x, y + 8, 26, 26, 10), C.yellow, { seed: 1120, w: 4, gap: 6, base: .9 }); g.restore(); stroke([[x - 40, y + 8], [x + 40, y + 8]], { w: 4.5, seed: 1121 }); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * .7; stroke([[x + Math.cos(a) * 34, y + 8 + Math.sin(a) * 34], [x + Math.cos(a) * 46, y + 8 + Math.sin(a) * 46]], { w: 4, color: C.orange, seed: 1122 + k }); } }
        if (i === 1) { shape(ellPts(x, y, 22, 22, 10), C.orange, { seed: 1125, w: 4, gap: 6, base: .9 }); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + t * .5; stroke([[x + Math.cos(a) * 31, y + Math.sin(a) * 31], [x + Math.cos(a) * 44, y + Math.sin(a) * 44]], { w: 4, color: C.orange, seed: 1126 + k }); } }
        if (i === 2) { shape(ellPts(x - 4, y, 30, 30, 12), C.blue, { seed: 1135, w: 4, gap: 6, base: .9 }); g.fillStyle = on ? '#cfdbf0' : C.white; g.beginPath(); g.arc(x + 12, y - 8, 25, 0, 7); g.fill(); star(x + 22, y - 18, 20, C.yellow, 1136); }
        if (i === 3) { const arc = []; for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + .6 + k / 12 * (Math.PI * 2 - 1.2); arc.push([x + Math.cos(a) * 26, y + Math.sin(a) * 26]); } stroke(arc, { color: C.greyD, w: 7, seed: 1140 }); stroke([[x, y - 36], [x, y - 6]], { color: C.greyD, w: 7, seed: 1141 }); }
      });
    }
    stroke([[mx, 1652], [mx, 1670]], { w: 5, seed: 1150 });
  });
  // S13: fading chat bubbles + faded 2016 notification motifs
  const sa = seg(t, 81.2, 82.2);
  if (sa > 0) {
    const B = [[105, 1500, 'heart'], [935, 1330, 'smile'], [150, 1010, 'lines'], [900, 1640, 'star'], [985, 1180, 'lines'], [110, 1760, 'note'], [800, 1790, 'lines'], [120, 720, 'heart']];
    B.forEach((b, i) => { const dy = (t - 81.2) * 22 + Math.sin(t * 1.1 + i) * 8; const fade = clamp(1 - (t - 81.6 - i * .12) * .12); A(sa * .42 * fade, () => bubble(b[0] + Math.sin(t * .8 + i * 2) * 8, b[1] - dy, 170, 76, { content: b[2], seed: 1200 + i * 7, side: i % 2 ? 'r' : 'l', col: i % 2 ? C.cyanL : C.white })); });
    A(sa * .4, () => { badge(215, 640, 78, 0, 1260, -.15); badge(700, 640, 70, 1, 1264, .12); badge(960, 1500, 74, 2, 1268, .1); });
  }
}

// ================= SCENES: FRONT LAYER =================
function flyer(t, t0, dur, x0, y0, x1, y1, bendY) { const u = seg(t, t0, t0 + dur); const e = eio(u); const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + bendY; return { u, x: (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * mx + e * e * x1, y: (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * my + e * e * y1 }; }

function frontLayer(t) {
  // ---- S2: playful bubbles + sparkles
  const a2 = win(t, 9.3, 11.6, .01, .4);
  if (a2 > 0) A(a2, () => {
    let p = pop(t, 9.55); if (p > 0) TR(850, 790, p, .06, () => bubble(850, 790 + Math.sin(t * 2.5) * 6, 300, 130, { content: 'heart', col: C.cyanL, side: 'l', seed: 1300 }));
    p = pop(t, 10.15); if (p > 0) TR(215, 900, p, -.06, () => bubble(215, 900 + Math.sin(t * 2.5 + 1) * 6, 270, 118, { content: 'smile', col: C.magL, side: 'r', seed: 1310 }));
    [[150, 680, 9.7], [930, 1060, 9.9], [900, 1400, 10.3], [330, 620, 10.5], [780, 1500, 10.0]].forEach((s, i) => { const q = pop(t, s[2]); if (q > 0) star(s[0], s[1], (46 + 14 * Math.sin(t * 6 + i)) * q, i % 2 ? C.cyan : C.yellow, 1320 + i, t * .8 + i); });
  });
  // ---- S3: messages travel user -> Tay, then Tay echoes back
  if (t > 12.9 && t < 20.2) A(win(t, 12.9, 19.6, .2, .4), () => {
    const bob = Math.sin(t * 2.2) * 8;
    for (let k = 0; k < 16; k++) {
      const t0 = 13.1 + k * .42, ui = (k * 3) % 8; const f = flyer(t, t0, 1.0, RING[ui][0], RING[ui][1], 540, 1140 + bob, -60);
      if (f.u > 0 && f.u < 1) { const sc = lerp(1, .35, f.u); A(Math.min(1, (1 - f.u) * 4), () => TR(f.x, f.y, sc, 0, () => bubble(f.x, f.y, 150, 72, { content: FRIENDLY[k % 5], seed: 1400 + k * 5, side: RING[ui][0] < 540 ? 'l' : 'r', col: UCOL[ui][0] }))); }
      // echo back out
      const t1 = 15.8 + k * .45, uj = (k * 5 + 2) % 8;
      if (k < 8) { const e = flyer(t, t1, .9, 540, 1140 + bob, lerp(540, RING[uj][0], .72), lerp(1140, RING[uj][1], .72), -50); if (e.u > 0 && e.u < 1) A(Math.min(1, (1 - e.u) * 3.5), () => TR(e.x, e.y, lerp(.4, .95, e.u), 0, () => bubble(e.x, e.y, 140, 68, { content: FRIENDLY[(k * 2) % 5], seed: 1500 + k * 5, col: C.cyanL, side: RING[uj][0] < 540 ? 'r' : 'l' }))); }
    }
  });
  // ---- S5: how it works diagram
  const a5 = win(t, 27.1, 31.35, .01, .45);
  if (a5 > 0) A(a5, () => {
    const X = 790;
    [[650, 1470, 12], [690, 1400, 17], [735, 1330, 23]].forEach((d, i) => { const p = pop(t, 27.0 + i * .08); if (p > 0) shape(ellPts(d[0], d[1], d[2] * p, d[2] * p, 8), C.white, { seed: 1600 + i, w: 3.5, solid: true, hatch: false }); });
    const hl = t > 29.8 ? Math.floor((t - 29.8) / .45) % 3 : -1;
    let p = pop(t, 27.2); if (p > 0) TR(X, 720, p * (hl === 0 ? 1.08 : 1), 0, () => bubble(X, 720, 260, 112, { content: 'tri', seed: 1610, side: 'l' }));
    let ar = seg(t, 27.6, 27.95); if (ar > 0) arrow(linePts(X, 810, X, 810 + 80 * ar, 20), { w: 6, seed: 1620, color: C.blue });
    p = pop(t, 27.9); if (p > 0) avatar(X, 990, 180 * p * (hl === 1 ? 1.08 : 1), {});
    ar = seg(t, 28.3, 28.65); if (ar > 0) arrow(linePts(X, 1100, X, 1100 + 80 * ar, 20), { w: 6, seed: 1630, color: C.blue });
    p = pop(t, 28.6); if (p > 0) TR(X, 1260, p * (hl === 2 ? 1.08 : 1), 0, () => bubble(X, 1260, 260, 112, { content: 'tri', seed: 1640, col: C.cyanL, side: 'r' }));
    ar = seg(t, 29.0, 29.8); if (ar > 0) arrow(quadPts(X + 150, 1250, X + 285, 990, X + 150, 730, ar), { w: 6, seed: 1650, color: C.mag, head: 26 });
    // testers send a probe, phone echoes it back
    [[345, 29.9], [735, 30.25]].forEach((s, i) => { const f = flyer(t, s[1], .8, s[0], 1560, 300, 1150, -80); if (f.u > 0 && f.u < 1) A(Math.min(1, (1 - f.u) * 4), () => TR(f.x, f.y, lerp(1, .5, f.u), 0, () => bubble(f.x, f.y, 150, 70, { content: 'tri', seed: 1660 + i * 5, col: '#dad5e2' }))); });
    p = pop(t, 30.75); if (p > 0) TR(330, 640, p, 0, () => bubble(330, 640 + Math.sin(t * 3) * 4, 190, 84, { content: 'tri', seed: 1670, col: C.cyanL, side: 'l' }));
  });
  // ---- S6: harmful input, shown abstractly
  if (t > 32.3 && t < 40.2) A(win(t, 32.3, 39.4, .1, .5), () => {
    for (let k = 0; k < 19; k++) {
      const t0 = 32.45 + k * .355, si = (k * 4) % 9; const tx = 540 + (hsh(k, 5) - .5) * 300, ty = 880 + hsh(k, 6) * 420;
      const f = flyer(t, t0, 1.15, TROLL[si][0], TROLL[si][1] - 60, tx, ty, -120);
      if (f.u <= 0 || f.u >= 1) continue;
      const sc = lerp(1, .6, f.u), side = TROLL[si][0] < 540 ? 'l' : 'r';
      A(Math.min(1, (1 - f.u) * 5), () => TR(f.x, f.y, sc, Math.sin(k) * .1, () => {
        const a1 = 1 - seg(f.u, .22, .4), a2 = Math.min(seg(f.u, .22, .4), 1 - seg(f.u, .55, .7)), a3 = seg(f.u, .55, .7);
        A(a1, () => bubble(f.x, f.y, 200, 88, { content: 'lines', seed: 1700 + k * 7, side }));
        A(a2, () => bubble(f.x, f.y, 200, 88, { content: 'dark', seed: 1700 + k * 7, side, col: '#dad5e2' }));
        A(a3, () => bubble(f.x, f.y, 200, 88, { content: k % 3 === 0 ? 'warn' : k % 3 === 1 ? 'corrupt' : 'dark', seed: 1700 + k * 7, side, col: '#cfc9da' }));
      }));
    }
    [[205, 640, 35.3], [875, 650, 36.3], [200, 1440, 37.2], [880, 1430, 38.0]].forEach((s, i) => { const p = pop(t, s[2]); if (p > 0) TR(s[0], s[1], p, Math.sin(t * 5 + i) * .1, () => warn(s[0], s[1], 120, 1800 + i * 3)); });
  });
  // ---- S7: input -> Tay -> output loop
  const a7 = win(t, 39.9, 45.25, .3, .35);
  if (a7 > 0) A(a7, () => {
    const d1 = seg(t, 39.95, 40.5), d2 = seg(t, 40.25, 40.8), d3 = seg(t, 40.6, 41.4);
    if (d1 > 0) arrow(quadPts(250, 905, 350, 820, 455, 915, d1), { color: C.inkSoft, w: 6, seed: 1900 });
    if (d2 > 0) arrow(quadPts(625, 915, 730, 820, 830, 905, d2), { color: C.inkSoft, w: 6, seed: 1905 });
    if (d3 > 0) arrow(quadPts(820, 1400, 540, 1590, 262, 1400, d3), { color: C.mag, w: 6, seed: 1910, dash: [18, 14], head: 28 });
    const cyc = [[40.3, 1.5], [41.85, 1.25], [43.15, 1.05], [44.25, 1.0]];
    cyc.forEach(([c, d], i) => {
      const u = seg(t, c, c + d); if (u <= 0 || u >= 1) return;
      if (u < .48) { const q = eio(u / .48); const x = lerp(170, 440, q), y = 1130 - Math.sin(q * Math.PI) * 40; A(Math.min(1, (1 - q) * 5), () => TR(x, y, lerp(1, .55, q), 0, () => bubble(x, y, 220, 100, { content: i % 2 ? 'warn' : 'dark', seed: 1920 + i * 7, col: '#dad5e2', side: 'l' }))); }
      if (u > .46) { const q = eo((u - .46) / .54); const x = lerp(640, 960, q), y = 1130 - Math.sin(q * Math.PI) * 40; A(Math.min(1, q * 5, (1 - q) * 4), () => TR(x, y, lerp(.5, 1.05, q), 0, () => bubble(x, y, 220, 100, { content: i % 2 ? 'dark' : 'corrupt', seed: 1950 + i * 7, col: '#cfd3e2', side: 'r' }))); }
    });
  });
  // ---- S8: memory bubble, warnings, notification overload
  const am = win(t, 45.7, 49.0, .01, .5);
  if (am > 0) { const p = pop(t, 45.7); A(am, () => TR(215, 640, p, 0, () => { shape(ellPts(215, 640 + Math.sin(t * 2) * 5, 118, 96, 16), C.white, { seed: 2000, w: 5, solid: true, hatch: false }); shape(ellPts(300, 752, 20, 17, 8), C.white, { seed: 2001, w: 4, solid: true, hatch: false }); shape(ellPts(332, 790, 11, 10, 8), C.white, { seed: 2002, w: 3.5, solid: true, hatch: false }); avatar(180, 640 + Math.sin(t * 2) * 5, 120, {}); heart(278, 630 + Math.sin(t * 2) * 5, 56, C.mag, 2003); })); }
  if (t > 49.3 && t < 55) A(win(t, 49.3, 53.8, .1, .6), () => {
    [[92, 960, 50.2], [88, 1460, 51.3], [650, 640, 52.1], [96, 1210, 52.9]].forEach((s, i) => { const p = pop(t, s[2]); if (p > 0) TR(s[0], s[1], p, Math.sin(t * 6 + i) * .12, () => warn(s[0], s[1], 112, 2100 + i * 3)); });
    for (let j = 0; j < 16; j++) { const t0 = 49.6 + j * .235; const u = seg(t, t0, t0 + .4); if (u <= 0) continue; const x = j % 2 ? 990 : 875, y = 1770 - Math.floor(j / 2) * 98 - (1 - eo(u)) * 320; const fall = (t > 53.8 ? Math.pow(t - 53.8, 2) * 900 : 0); A(seg(u, 0, .3), () => badge(x + (hsh(j, 7) - .5) * 18, y + fall, 88, j, 2200 + j * 4, (hsh(j, 8) - .5) * .4 + Math.sin(t * 9 + j) * .03)); }
  });
  // ---- S9: moderation eraser
  if (t > 54.0 && t < 57.2) {
    const ks = Object.keys(DEL).map(Number).sort((a, b) => a - b);
    const ps = phoneState(t); const R0y = ps.cy - 530 * ps.s + 100 * ps.s, Rh = 840 * ps.s, bottom = R0y + Rh - 14 * ps.s;
    const keysX = [[54.0, 1180]], keysY = [[54.0, 1300]];
    ks.forEach(i => { const y = bottom - 150 * ps.s * (N9 - i) + 75 * ps.s; keysX.push([DEL[i] + .08, 560]); keysY.push([DEL[i] + .08, y]); keysX.push([DEL[i] + .3, 560]); keysY.push([DEL[i] + .3, y]); });
    keysX.push([56.9, 1200]); keysY.push([56.9, 1500]);
    const ex = kf(t, keysX) + Math.sin(t * 38) * 46 * (t > 54.3 && t < 56.5 ? 1 : 0), ey = kf(t, keysY);
    TR(ex, ey, 1, -.45, () => { shape(rrectPts(ex - 95, ey - 48, 190, 96, 16), C.magL, { seed: 2300, w: 5.5, solid: true, base: .9 }); shape(rrectPts(ex + 20, ey - 48, 75, 96, 16), C.blue, { seed: 2301, w: 5.5, solid: true, base: .9 }); });
  }
  // ---- S10: investigation document
  if (t > 61.3 && t < 68) {
    const dy = lerp(760, 0, eo(seg(t, 61.4, 62.3))) + 800 * eio(seg(t, 66.75, 67.5));
    g.save(); g.translate(0, dy); g.translate(540, 1545); g.rotate(-.018); g.translate(-540, -1545);
    A(.25, () => fill(rrectPts(112, 1249, 880, 620, 12), C.ink, { seed: 2400, hatch: false, base: 1 }));
    shape(rrectPts(100, 1235, 880, 620, 12), '#fffaf0', { seed: 2401, w: 5.5, solid: true, hatch: false, base: 1 });
    scribLine(150, 1292, 330, 2402, C.ink, 7);
    stroke([[880, 1215], [880, 1290], [910, 1290], [910, 1225]], { w: 5, color: C.greyD, seed: 2403 });
    // left: mini network
    [[185, 1420], [185, 1560], [185, 1700]].forEach((u, i) => { user(u[0], u[1], 36, { ci: i, troll: 1, seed: 2410 + i * 4 }); arrow(linePts(u[0] + 48, u[1], 268, 1560 + (u[1] - 1560) * .3, 30), { w: 4, seed: 2420 + i, color: '#a84f7a', head: 16 }); });
    avatar(335, 1560, 112, { offline: 1 });
    // right: repeated input patterns
    for (let r = 0; r < 3; r++) { for (let k = 0; k < 4; k++) { const p = pop(t, 62.5 + r * .35 + k * .07); if (p > 0) darkScrib(520 + k * 92, 1400 + r * 115, 30 * p, 24 * p, 2430 + r * 3, C.dark, 4.5); } const p = pop(t, 63.0 + r * .35); if (p > 0) TR(905, 1400 + r * 115, p, 0, () => warn(905, 1400 + r * 115, 66, 2440 + r * 3)); }
    const cr = seg(t, 63.7, 64.7); if (cr > 0) { const pts = []; const m = Math.round(30 * cr); for (let k = 0; k <= m; k++) { const a = -2.2 + k / 30 * 6.6; pts.push([660 + 215 * Math.cos(a), 1512 + 185 * Math.sin(a)]); } stroke(pts, { color: C.red, w: 7, seed: 2450 }); }
    for (let k = 0; k < 2; k++) { const x = 470 + k * 250; stroke(rrectPts(x, 1760, 44, 44, 6, 16), { closed: true, w: 4, seed: 2460 + k }); scribLine(x + 62, 1784, 150, 2462 + k, C.inkSoft, 4.5); const c = seg(t, 65.0 + k * .45, 65.3 + k * .45); if (c > 0) stroke([[x + 8, 1782], [x + 20, 1798], [x + 8 + 44 * c, 1798 - 46 * c]], { color: C.red, w: 6.5, seed: 2470 + k, sharp: true }); }
    // magnifier
    const mx = kf(t, [[62.5, 250], [64.3, 640], [66.4, 830]]), my = kf(t, [[62.5, 1480], [64.3, 1500], [66.4, 1690]]) + Math.sin(t * 2.4) * 10;
    A(seg(t, 62.4, 62.8), () => { A(.3, () => fill(ellPts(mx, my, 74, 74, 14), C.cyanL, { seed: 2480, hatch: false, base: 1 })); stroke(ellPts(mx, my, 74, 74, 14), { closed: true, w: 9, seed: 2481 }); stroke([[mx + 54, my + 54], [mx + 120, my + 120]], { w: 15, seed: 2482, color: C.hair }); });
    g.restore();
  }
  // ---- S12: irony streams + offline switch
  if (t > 72.3 && t < 81.6) {
    const fa = freeAvatar(t), ax = fa ? fa.x : 540, ay = fa ? fa.y : 1060;
    const frz = 79.3;
    const drawStream = (k, t0, fromLeft) => {
      const y0 = 740 + hsh(k, fromLeft ? 11 : 12) * 640; const tt = Math.min(t, frz);
      const f = flyer(tt, t0, 1.7, fromLeft ? -110 : 1190, y0, ax, ay, -70);
      if (f.u <= 0 || f.u >= 1) return;
      const drop = t > frz ? Math.pow(t - frz, 2) * 700 : 0, al = Math.min(1, (1 - f.u) * 4) * (1 - seg(t, frz + .1, frz + .9));
      A(al, () => TR(f.x, f.y + drop, lerp(1.15, .55, f.u), (t > frz ? (t - frz) * (fromLeft ? -.6 : .6) : 0), () => {
        if (fromLeft) bubble(f.x, f.y + drop, 210, 94, { content: FRIENDLY[k % 5], seed: 2500 + k * 7, side: 'l', col: [C.white, C.cyanL, C.magL][k % 3] });
        else bubble(f.x, f.y + drop, 210, 94, { content: NASTY[k % 3], seed: 2700 + k * 7, side: 'r', col: '#d3cede' });
      }));
    };
    for (let k = 0; k < 29; k++) drawStream(k, 72.4 + k * .24, true);
    for (let k = 0; k < 19; k++) drawStream(k, 75.2 + k * .215, false);
    // switch
    const sy = lerp(2150, 1610, eo(seg(t, 77.5, 78.5))) + 500 * eio(seg(t, 80.85, 81.5));
    const pos = eo(seg(t, 79.22, 79.42));
    A(1 - seg(t, 80.9, 81.5), () => TR(540, sy, 1 + .06 * Math.sin(seg(t, 79.2, 79.7) * Math.PI), 0, () => toggle(540, sy, 1, pos)));
  }
  // offline pill (S12 -> S13)
  if (t > 79.4) { const p = pop(t, 79.45); const x = kf(t, [[80.9, 540], [81.8, 450]]), y = kf(t, [[80.9, 1335], [81.8, 1400]]); TR(x, y, p, 0, () => pill(x, y, 1.1, 'çevrimdışı')); }
}

// ================= CLOCKS =================
function clocks(t) {
  if (t < 9.6) {
    const x = 860 + 520 * eio(seg(t, 8.8, 9.5)); const h = t < 8 ? kf(t, [[0, 0], [2.4, 16]], eo) : kf(t, [[8.1, 16], [8.75, 0]]);
    const fl = Math.max(seg(t, 2.3, 2.5) * (1 - seg(t, 2.5, 3.2)), seg(t, 5.4, 5.6) * (1 - seg(t, 5.9, 6.8)));
    const moving = (t < 2.4 || t > 8.1) ? 1 : 0;
    clock(x, 790 + Math.sin(t * 1.9) * 5, 165, h, { ghost: moving, flash: fl * .6 });
    TR(x, 1045, 1 + .16 * fl, 0, () => counter(x, 1045, .86, Math.round(h), { flash: fl }));
  }
  if (t > 45.5 && t < 59.9) {
    const p = pop(t, 45.6), al = 1 - seg(t, 59.2, 59.8);
    const x = kf(t, [[53.79, 900], [54.4, 905]]), y = kf(t, [[53.79, 760], [54.4, 700]]), r = kf(t, [[53.79, 140], [54.4, 120]]);
    const h = kf(t, [[45.6, 0], [49.4, 2.5], [53.8, 13], [57.4, 16]], lin);
    const jolt = t > 57.4 ? Math.sin(seg(t, 57.4, 57.8) * Math.PI * 3) * (1 - seg(t, 57.4, 57.8)) * .05 : 0;
    A(al, () => TR(x, y, p, jolt, () => clock(x, y + Math.sin(t * 1.9) * 4, r, h, { ghost: t < 57.4 ? .7 : 0 })));
  }
  if (t > 67.1 && t < 72.4) {
    const p = pop(t, 67.15, .45), out = eio(seg(t, 71.6, 72.3)); const h = hours11(t);
    const fl = seg(t, 70.35, 70.5) * (1 - seg(t, 70.7, 71.5));
    A(1 - out, () => { TR(540, 1000, p * (1 - .5 * out), 0, () => clock(540, 1000, 300, h, { ghost: (h > .2 && h < 15.8) ? 1 : 0, flash: fl * .7 })); TR(540, 1425, p * (1 + .15 * fl), 0, () => counter(540, 1425, 1, Math.round(h), { flash: fl })); });
  }
  if (t > 81.1) {
    const p = pop(t, 81.2, .45);
    TR(880, 800, p, 0, () => clock(880, 800 + Math.sin(t * 1.6) * 5, 150, 16, {}));
    TR(880, 1030, p, 0, () => counter(880, 1030 + Math.sin(t * 1.6) * 5, .8, 16, {}));
  }
}

// ================= MAIN RENDER =================
function scene(t) {
  backLayer(t);
  const ps = phoneState(t);
  phone(ps.cx, ps.cy, ps.s, ps.a, ps.rot, R => {
    if (t < 13) {
      const gl = kf(t, [[1.5, 0], [2.3, .5], [4.2, .9], [6.9, 1], [6.95, 0]], lin), off = seg(t, 6.95, 7.2) * (1 - seg(t, 8.15, 8.45));
      feed(R, { n: nIntro(t), kind: introKind, headerH: 230, av: { mood: gl > .6 ? 1 : gl > .2 ? .5 : 0, glitch: gl, offline: off, show: t < 8.8 }, dim: off, pill: true });
    } else if (t < 59.6) {
      const off = seg(t, 57.35, 57.6);
      const gl = t < 31.6 ? 0 : kf(t, [[33, 0], [39, .35], [45, .85], [49.4, .8], [53.5, 1], [57.35, 1], [57.4, 0]], lin);
      feed(R, { n: nMain(t), kind: mainKind, headerH: 160, av: { mood: gl > .6 ? 1 : gl > .12 ? .5 : 0, glitch: gl, offline: off, show: t > 20.45 }, del: delFn(t), flick: t > 49.4 && t < 53.9 ? kf(t, [[49.4, 0], [53.5, .3]], lin) : 0, dim: off, pill: true });
      const la = win(t, 39.5, 45.3, .45, .4);
      if (la > 0) A(la, () => { g.fillStyle = C.white; g.fillRect(R.x, R.y, R.w, R.h); A(.35, () => fill([[R.x, R.y], [R.x + R.w, R.y], [R.x + R.w, R.y + R.h], [R.x, R.y + R.h]], C.cyanL, { seed: 33, sharp: true, amp: 0, gap: 18 })); const gg = kf(t, [[40, .25], [45, .9]], lin); const hit = [40.3 + .72, 41.85 + .6, 43.15 + .5, 44.25 + .48].reduce((m, c) => Math.max(m, 1 - seg(Math.abs(t - c), 0, .22)), 0); avatar(R.x + R.w / 2, 1130 + (ps.cy - 1200), 330 * (1 + .08 * hit), { mood: gg > .55 ? 1 : .5, glitch: clamp(gg + hit * .3) }); });
      const oa = seg(t, 59.25, 59.6); if (oa > 0) A(oa, () => offlineScreen(R, true, true));
    } else if (t < 70) offlineScreen(R, true, true);
    else offlineScreen(R, false, false);
  });
  frontLayer(t);
  const fa = freeAvatar(t);
  if (fa) avatar(fa.x, fa.y, fa.size, fa);
  clocks(t);
}

function drawRealCard(t, imageOnly) {
  const a = seg(t, T.s14 + .1, T.s14 + .75); if (a <= 0) return;
  const z = 1 + .035 * seg(t, T.s14 + .1, T.end), cx = 540, cy = 1150;
  g.save(); g.globalAlpha = eio(a); g.translate(cx, cy); g.rotate(-.015); g.scale(z, z); g.translate(-cx, -cy);
  if (!imageOnly) {
    g.save(); g.shadowColor = 'rgba(60,45,30,.35)'; g.shadowBlur = 40; g.shadowOffsetY = 14; g.fillStyle = '#fbf6e9'; g.fillRect(cx - 410, cy - 440, 820, 900); g.restore();
    stroke(rrectPts(cx - 410, cy - 440, 820, 900, 6, 60), { closed: true, w: 3, color: '#8a8470', seed: 3000, amp: 1 });
    A(.7, () => { TR(cx - 380, cy - 430, 1, -.5, () => fill(rrectPts(cx - 460, cy - 455, 160, 50, 4), C.yellowL, { seed: 3001, base: .9, gap: 8 })); TR(cx + 380, cy - 430, 1, .5, () => fill(rrectPts(cx + 300, cy - 455, 160, 50, 4), C.yellowL, { seed: 3002, base: .9, gap: 8 })); });
  } else {
    const im = document.getElementById('real'); g.imageSmoothingQuality = 'high';
    g.drawImage(im, cx - 370, cy - 400, 740, 740);
    g.strokeStyle = 'rgba(40,35,60,.5)'; g.lineWidth = 2; g.strokeRect(cx - 370, cy - 400, 740, 740);
  }
  g.restore();
}

function render(t) {
  NOW = t; BOIL = Math.floor(Math.min(t, T.s14) * 8);
  g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  g.drawImage(paperC, 0, 0);
  const sa = 1 - seg(t, T.s14 + .05, T.s14 + .7);
  A(sa, () => scene(Math.min(t, T.s14 + .02)));
  // keep caption zone calm
  const gr = g.createLinearGradient(0, 430, 0, 560); gr.addColorStop(0, 'rgba(243,234,215,.0)'); gr.addColorStop(1, 'rgba(243,234,215,0)');
  drawCaptions(t);
  A(seg(t, T.s13, T.s13 + .6), () => txt('@bugercektenyasandi', 1044, 1876, 40, 700, 'rgba(42,39,80,.78)', 'right'));
  drawRealCard(t, false);
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .55; g.drawImage(grainC[Math.floor(BOIL / 2) % 3], 0, 0, W, H); g.restore();
  drawRealCard(t, true);
  const fo = seg(t, T.end - .55, T.end - .05);
  if (fo > 0) { g.save(); g.globalAlpha = eio(fo); g.fillStyle = '#14121f'; g.fillRect(0, 0, W, H); g.restore(); }
}

window.ready = (async () => {
  await Promise.all(['300', '400', '700'].map(w => document.fonts.load(`${w} 40px Kalam`, 'ğüşıöçİĞÜŞÖÇâ’…@abc16')));
  await document.fonts.ready;
  const im = document.getElementById('real'); if (!im.complete) await new Promise(r => { im.onload = r; im.onerror = r; });
  buildPaper();
  return true;
})();
window.render = render;
