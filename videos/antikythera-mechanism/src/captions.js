'use strict';
// On-screen text == ElevenLabs narration, word for word.
// Start times (s) were measured from the narration's pauses (ffmpeg silencedetect).
const SENTENCES = [
  { start: 0.00, text: 'Denizin dibinden yaklaşık 2 bin yıllık mekanik bir “bilgisayar” çıkarıldı.', hl: ['2 bin yıllık', '“bilgisayar”'] },
  { start: 5.49, text: 'Antikythera Mekanizması, 1900’lerin başında Yunanistan açıklarındaki antik bir gemi batığında bulundu.', hl: ['Antikythera Mekanizması,', 'antik bir gemi batığında'] },
  { start: 13.09, text: 'İlk bakışta paslanmış bronz parçalar gibi görünüyordu.', hl: ['paslanmış bronz parçalar'] },
  { start: 17.14, text: 'Ama araştırmacılar içinde onlarca birbirine bağlı dişli olduğunu fark etti.', hl: ['onlarca birbirine bağlı dişli'] },
  { start: 23.10, text: 'Cihaz, Güneş ve Ay’ın hareketlerini takip edebiliyor, takvim döngülerini hesaplayabiliyor ve tutulmaların zamanını gösterebiliyordu.', hl: ['Güneş', 'Ay’ın', 'takvim döngülerini', 'tutulmaların'] },
  { start: 32.82, text: 'Üstelik yaklaşık iki bin yıl önce yapılmış olmasına rağmen, benzer karmaşıklıkta mekanik sistemlere yüzyıllar boyunca tekrar rastlanmadı.', hl: ['iki bin yıl önce', 'yüzyıllar boyunca'] },
  { start: 42.45, text: 'Bugün Antikythera Mekanizması, bilinen en eski mekanik hesaplama cihazlarından biri ve çoğu araştırmacı tarafından antik dünyanın analog bilgisayarı olarak kabul ediliyor.', hl: ['en eski mekanik hesaplama', 'analog bilgisayarı'] },
  { start: 54.44, text: 'İnanması güç ama bu gerçekten yaşandı.', final: true, split: 'İnanması güç ama', splitAt: 55.62 },
];
const NARRATION_END = 57.73;
const LEAD = 0.18;          // caption shows a hair before the voice
const CARD_TOP = 58, CARD_MAXB = 462, CARD_X = 44, CARD_W = W - 88;

const LAYOUT = [];
function layoutCaptions(ctx) {
  for (const s of SENTENCES) {
    if (s.final) { LAYOUT.push(null); continue; }
    const words = s.text.split(' ');
    // highlight flags by character range
    const ranges = (s.hl || []).map(h => { const i = s.text.indexOf(h); if (i < 0) throw new Error('hl not found: ' + h); return [i, i + h.length]; });
    let pos = 0; const flags = words.map(w => { const a = pos, b = pos + w.length; pos = b + 1; return ranges.some(r => a < r[1] && b > r[0]); });
    // keep each highlighted phrase on one line: wrap by units
    const rid = words.map((w, i) => { let a = 0; for (let j = 0; j < i; j++) a += words[j].length + 1; const b = a + w.length; return ranges.findIndex(r => a < r[1] && b > r[0]); });
    const units = []; words.forEach((w, i) => { if (i && rid[i] >= 0 && rid[i] === rid[i - 1]) units[units.length - 1].push(i); else units.push([i]); });
    let best = null;
    for (let size = 70; size >= 38; size -= 2) {
      ctx.font = font(size, 700);
      const sp = ctx.measureText(' ').width, maxW = CARD_W - 70;
      const lines = []; let cur = [], cw = 0;
      units.forEach(u => { const uw = ctx.measureText(u.map(i => words[i]).join(' ')).width; if (cur.length && cw + sp + uw > maxW) { lines.push(cur); cur = []; cw = 0; } cw += (cur.length ? sp : 0) + uw; cur.push(...u); });
      if (cur.length) lines.push(cur);
      const lh = size * 1.2, hgt = lines.length * lh + 56;
      if (CARD_TOP + hgt <= CARD_MAXB) { best = { size, lines, lh, hgt, sp }; break; }
    }
    // join check: the rendered words must reproduce the narration sentence exactly
    const rebuilt = best.lines.map(l => l.map(i => words[i]).join(' ')).join(' ');
    if (rebuilt !== s.text) throw new Error('caption mismatch: ' + s.text);
    ctx.font = font(best.size, 700);
    best.widths = words.map(w => ctx.measureText(w).width);
    LAYOUT.push(Object.assign(best, { words, flags }));
  }
}

function captionCard(ctx, y0, hgt, a, seed) {
  ctx.save(); ctx.globalAlpha *= a;
  const pts = rr(CARD_X, y0, CARD_W, hgt, 26);
  draw(ctx, xf(pts, 7, 9), { fill: 'rgba(40,30,50,0.22)', stroke: null, lw: 0, tex: false, seed: seed + 1 });
  draw(ctx, pts, { fill: C.paperLt, seed, lw: 4.5, texA: 0.55 });
  // washi tape on the corners
  for (const [tx, ty, r] of [[CARD_X + 40, y0 + 4, -0.5], [CARD_X + CARD_W - 40, y0 + 4, 0.5]]) {
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(r);
    draw(ctx, [[-46, -16], [46, -14], [44, 16], [-44, 14]], { fill: 'rgba(195,155,74,0.55)', stroke: null, lw: 0, seed: seed + 7, sharp: true });
    ctx.restore();
  }
  ctx.restore();
}

function drawCaptions(ctx, t) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  let idx = -1; for (let i = 0; i < SENTENCES.length; i++) if (t >= SENTENCES[i].start - LEAD) idx = i;
  if (idx < 0) idx = 0;
  const s = SENTENCES[idx], k = t - (s.start - LEAD);
  if (s.final) { finalCaption(ctx, t, k); ctx.restore(); return; }
  const L = LAYOUT[idx], prevL = idx > 0 ? LAYOUT[idx - 1] : null;
  const hgt = prevL ? lerp(prevL.hgt, L.hgt, ease(k / 0.3)) : L.hgt;
  const cardA = idx === 0 ? 1 : 1;
  captionCard(ctx, CARD_TOP, hgt, cardA, 501);
  if (prevL && k < 0.16) drawWords(ctx, prevL, CARD_TOP, prevL.hgt, 99, 1 - k / 0.16, idx - 1);
  drawWords(ctx, L, CARD_TOP, hgt, idx === 0 ? 99 : k - 0.1, 1, idx);
  ctx.restore();
}
function drawWords(ctx, L, y0, hgt, k, alpha, si) {
  const total = L.words.length, dur = Math.min(0.75, 0.04 * total + 0.25);
  const top = y0 + (hgt - L.lines.length * L.lh) / 2 + L.size * 0.92;
  ctx.font = font(L.size, 700); ctx.textBaseline = 'alphabetic';
  L.lines.forEach((ln, li) => {
    const lw = ln.reduce((acc, i, j) => acc + L.widths[i] + (j ? L.sp : 0), 0);
    let x = W / 2 - lw / 2; const y = top + li * L.lh;
    ln.forEach(i => {
      const appear = clamp((k - (i / total) * dur) / 0.16);
      if (appear > 0) {
        const a = alpha * appear;
        ctx.save(); ctx.globalAlpha = a;
        const col = L.flags[i] ? '#8a5b12' : C.ink;
        hand(ctx, L.words[i], x, y + (1 - easeOut(appear)) * 10, L.size, col, 700, 'left', i * 3 + si * 31);
        if (L.flags[i]) {
          const u = clamp((k - 0.25 - (i / total) * dur) / 0.35);
          if (u > 0) line(ctx, [[x - 2, y + L.size * 0.16], [x + (L.widths[i] + 6) * u, y + L.size * 0.13 + Math.sin(i) * 2]], { stroke: C.brass, lw: 5, seed: i + si * 17, single: true, alpha: 0.9 });
        }
        ctx.restore();
      }
      x += L.widths[i] + L.sp;
    });
  });
}
function finalCaption(ctx, t, k) {
  const s = SENTENCES[SENTENCES.length - 1];
  const a1 = easeOut(k / 0.35), a2 = easeOut((t - (s.splitAt - LEAD)) / 0.35);
  captionCard(ctx, CARD_TOP, 330, 1, 501);
  const rest = s.text.slice(s.split.length + 1); // "bu gerçekten yaşandı."
  if (a1 > 0) { ctx.save(); ctx.globalAlpha = a1; hand(ctx, s.split, W / 2, CARD_TOP + 125 + (1 - a1) * 10, 74, '#6f6890', 400, 'center', 801); ctx.restore(); }
  if (a2 > 0) {
    ctx.save(); ctx.globalAlpha = a2;
    const y = CARD_TOP + 255 + (1 - a2) * 12;
    hand(ctx, rest, W / 2 + 2, y + 2, 96, 'rgba(20,16,40,0.35)', 700, 'center', 802);
    hand(ctx, rest, W / 2, y, 96, '#16132f', 700, 'center', 803);
    ctx.font = font(96, 700); const w = ctx.measureText(rest).width;
    const u = clamp((t - s.splitAt - 0.3) / 0.6);
    if (u > 0) line(ctx, [[W / 2 - w / 2, y + 22], [W / 2 - w / 2 + w * u, y + 18]], { stroke: C.brass, lw: 7, seed: 805, single: true });
    ctx.restore();
  }
}
function handle(ctx, a) {
  if (a <= 0) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  ctx.font = font(44, 700); ctx.textAlign = 'right'; ctx.lineJoin = 'round';
  ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(248,241,223,0.85)'; ctx.strokeText('@bugercektenyasandi', W - 44, H - 56);
  ctx.fillStyle = C.ink; ctx.fillText('@bugercektenyasandi', W - 44, H - 56);
  ctx.restore();
}
