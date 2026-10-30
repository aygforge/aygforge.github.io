// ---------- compositing, captions, frame driver ----------
const CAPS = [
  { s: 0.0, text: '897 yılında ölmüş bir Papa, mezarından çıkarılıp mahkemeye çıkarıldı.', hl: [2, 3, 4] },
  { s: 5.93, text: 'Papa Formosus yaklaşık dokuz ay önce ölmüş ve Roma’da gömülmüştü.', hl: [3, 4] },
  { s: 11.27, text: 'Ancak yeni Papa VI. Stephen, Formosus’un mezarının açılmasını emretti.', hl: [6, 7] },
  { s: 17.26, text: 'Formosus’un naaşına papalık kıyafetleri giydirildi, bir koltuğa oturtuldu ve karşısına gerçek bir mahkeme kuruldu.', hl: [10, 11, 12] },
  { s: 26.21, text: 'Üstelik ölü Papa kendini savunamayacağı için yanına onun adına cevap vermesi için bir diyakoz bile yerleştirildi.', hl: [12, 13] },
  { s: 34.39, text: 'Mahkeme sonunda Formosus suçlu bulundu ve Papa olarak yaptığı bazı işlemler geçersiz ilan edildi.', hl: [3, 4] },
  { s: 41.90, text: 'Fakat olay Roma’da büyük tepki yarattı ve kısa süre sonra VI. Stephen da iktidardan düşürüldü.', hl: [3, 4] },
  { s: 49.70, text: 'Bu inanılmaz olay tarihe “Kadavra Sinodu” olarak geçti.', hl: [4, 5] },
];
const FINAL = { a: 'İnanması güç ama', b: 'bu gerçekten yaşandı.', ta: 54.2, tb: 55.55 };

let main, mctx, sceneBuf, sctx, bufA, actx, bufB, bctx, paper, mask, tooth, grain;
function mk(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function buildTextures() {
  const R = rng(1234);
  // paper
  paper = mk(); const p = paper.getContext('2d');
  p.fillStyle = C.paper; p.fillRect(0, 0, W, H);
  const id = p.getImageData(0, 0, W, H); const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const x = (i / 4) % W, y = Math.floor(i / 4 / W);
    const n = (R() - 0.5) * 16 + (vnoise(x * 0.012, y * 0.012) - 0.5) * 14 + (vnoise(x * 0.004 + 9, y * 0.004) - 0.5) * 12;
    d[i] += n; d[i + 1] += n * 0.95; d[i + 2] += n * 0.85;
  }
  p.putImageData(id, 0, 0);
  p.globalAlpha = 0.07; p.strokeStyle = '#8a7350'; p.lineWidth = 1;
  for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H, a = R() * 6.28, l = 20 + R() * 60; p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.5, y + Math.sin(a + 0.4) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
  p.globalAlpha = 1;
  const vg = p.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.75);
  vg.addColorStop(0, 'rgba(120,90,50,0)'); vg.addColorStop(1, 'rgba(120,90,50,0.22)');
  p.fillStyle = vg; p.fillRect(0, 0, W, H);

  // art mask: illustration fades into paper toward the caption zone
  mask = mk(); const m = mask.getContext('2d');
  const mi = m.createImageData(W, H); const md = mi.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = 478 + (vnoise(x * 0.012, 3) - 0.5) * 46 + (vnoise(x * 0.05, 7) - 0.5) * 10;
    let a = clamp((y - edge) / 60);
    
    const i = (y * W + x) * 4; md[i] = md[i + 1] = md[i + 2] = 255; md[i + 3] = a * 255;
  }
  m.putImageData(mi, 0, 0);

  // pencil tooth: paper specks showing through the crayon
  tooth = mk(); const t = tooth.getContext('2d');
  const ti = t.createImageData(W, H); const td = ti.data;
  for (let i = 0; i < td.length; i += 4) {
    const x = (i / 4) % W, y = Math.floor(i / 4 / W);
    const v = R() * 0.75 + vnoise(x * 0.3, y * 0.3) * 0.35;
    if (v > 0.84) { td[i] = 247; td[i + 1] = 239; td[i + 2] = 222; td[i + 3] = (v - 0.84) * 900; }
  }
  t.putImageData(ti, 0, 0);
  grain = mk(); const g = grain.getContext('2d');
  const gi = g.createImageData(W, H); const gd = gi.data;
  for (let i = 0; i < gd.length; i += 4) { const v = 200 + R() * 55; gd[i] = v; gd[i + 1] = v * 0.98; gd[i + 2] = v * 0.94; gd[i + 3] = 255; }
  g.putImageData(gi, 0, 0);
}

function sceneIndex(t) { for (let i = 1; i < B.length; i++) if (t < B[i]) return i; return 9; }

function drawSceneTo(ctx, i, t) {
  CTX = ctx; ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const lt = t - B[i - 1];
  ctx.save(); const cm = CAMS[i](lt); camera(cm[0], cm[1], cm[2]);
  SCENES[i](lt);
  ctx.restore();
  if (POSTS[i]) POSTS[i](lt);
}

function resample(P, n) {
  const D = densify(P, true, 2); const L = [0];
  for (let i = 1; i <= D.length; i++) { const a = D[i - 1], b = D[i % D.length]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const tot = L[L.length - 1]; const out = []; let j = 0;
  for (let k = 0; k < n; k++) { const s = tot * k / n; while (L[j + 1] < s) j++; const a = D[j], b = D[(j + 1) % D.length]; const f = (s - L[j]) / ((L[j + 1] - L[j]) || 1); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
  return out;
}
function area(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s; }
function morphPolys(A, Bp, k) {
  const n = 120; let a = resample(A, n), b = resample(Bp, n);
  if (Math.sign(area(a)) !== Math.sign(area(b))) b.reverse();
  const ca = centroid(a), cb = centroid(b);
  let best = 0, bd = 1e18;
  for (let s = 0; s < n; s += 2) { let d = 0; for (let i = 0; i < n; i += 4) { const p = a[i], q = b[(i + s) % n]; d += (p[0] - ca[0] - q[0] + cb[0]) ** 2 + (p[1] - ca[1] - q[1] + cb[1]) ** 2; } if (d < bd) { bd = d; best = s; } }
  return a.map((p, i) => { const q = b[(i + best) % n]; return [lerp(p[0], q[0], k), lerp(p[1], q[1], k)]; });
}

function drawCaption(ctx, cap, t, next) {
  const t0 = cap.s === 0 ? -1 : cap.s - 0.18;
  if (t < t0) return;
  const out = next != null ? clamp((t - (next - 0.2)) / 0.2) : 0;
  if (out >= 1) return;
  const words = cap.text.split(' ');
  // fit: glue "VI." to the following word so the regnal number never wraps alone
  const tokens = []; for (let i = 0; i < words.length; i++) { if (words[i] === 'VI.' && i + 1 < words.length) { tokens.push({ w: words[i] + ' ' + words[i + 1], idx: [i, i + 1] }); i++; } else tokens.push({ w: words[i], idx: [i] }); }
  let size = 84, lines;
  for (; size >= 54; size -= 2) {
    ctx.font = `700 ${size}px Caveat`;
    const space = ctx.measureText(' ').width; lines = [[]]; let lw = 0;
    for (const tk of tokens) { const w = ctx.measureText(tk.w).width; if (lines[lines.length - 1].length && lw + space + w > 960) { lines.push([]); lw = 0; } lines[lines.length - 1].push(tk); lw += (lw ? space : 0) + w; }
    if (lines.length * size * 1.02 <= 345) break;
  }
  const lh = size * 1.02; const top = 268 - (lines.length * lh) / 2 + size * 0.36;
  ctx.font = `700 ${size}px Caveat`; ctx.textBaseline = 'middle';
  const space = ctx.measureText(' ').width;
  let wi = 0;
  lines.forEach((ln, li) => {
    const widths = ln.map(tk => ctx.measureText(tk.w).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (ln.length - 1);
    let x = 540 - total / 2; const y = top + li * lh;
    ln.forEach((tk, k) => {
      const appear = clamp((t - (t0 + wi * 0.045)) / 0.2); wi++;
      const a = appear * (1 - out);
      if (a > 0) {
        const hl = tk.idx.some(i => cap.hl.includes(i));
        const jx = (vnoise(wi * 3.1, BOIL * 0.9) - 0.5) * 1.2, jy = (vnoise(wi * 1.7 + 9, BOIL * 0.9) - 0.5) * 1.2;
        const rot = (hash(wi * 2.3 + li) - 0.5) * 0.018;
        ctx.save(); ctx.translate(x + widths[k] / 2 + jx, y + jy + (1 - easeOut(appear)) * 10); ctx.rotate(rot);
        ctx.globalAlpha = a; ctx.fillStyle = hl ? C.burg : C.ink; ctx.textAlign = 'center';
        ctx.fillText(tk.w, 0, 0);
        ctx.globalAlpha = a * 0.3; ctx.fillText(tk.w, 0.9, 0.7);
        ctx.restore();
      }
      x += widths[k] + space;
    });
  });
}

function drawFinal(ctx, t) {
  const ka = clamp((t - FINAL.ta) / 0.35), kb = clamp((t - FINAL.tb) / 0.35);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (ka > 0) {
    ctx.save(); ctx.globalAlpha = ka; ctx.font = '500 92px Caveat'; ctx.fillStyle = C.inkL;
    ctx.translate(540, 190 + (1 - easeOut(ka)) * 10); ctx.rotate(-0.012); ctx.fillText(FINAL.a, 0, 0); ctx.restore();
  }
  if (kb > 0) {
    ctx.save(); ctx.globalAlpha = kb; ctx.font = '700 124px Caveat'; ctx.fillStyle = '#15113a'; ctx.strokeStyle = '#15113a'; ctx.lineWidth = 3.2; ctx.lineJoin = 'round';
    ctx.translate(540, 318 + (1 - easeOut(kb)) * 12); ctx.rotate(0.008);
    ctx.strokeText(FINAL.b, 0, 0); ctx.fillText(FINAL.b, 0, 0);
    ctx.restore();
    // hand-drawn underline
    const uk = clamp((t - FINAL.tb - 0.25) / 0.5);
    if (uk > 0) { CTX = ctx; seeded(5, () => L(cr([[250, 392], [540, 384], [540 + 290 * (2 * uk - 1), 390]], false), { lw: 6, stroke: C.burg, amp: 1.2, salpha: 0.85 })); }
  }
}

function drawHandle(ctx, t) {
  const fin = clamp((t - 54.0) / 0.6);
  const size = lerp(42, 50, fin);
  ctx.save(); ctx.font = `600 ${size}px Caveat`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const w = ctx.measureText('@bugercektenyasandi').width;
  CTX = ctx; seeded(9, () => S(rrP(1048 - w - 22, 1846 - size * 0.62, w + 40, size * 1.24, 14), { fill: '#f4ecda', lw: 2.2, salpha: 0.5, alpha: 0.88, hatch: false, amp: 1 }));
  ctx.globalAlpha = lerp(0.85, 1, fin); ctx.fillStyle = C.ink; ctx.fillText('@bugercektenyasandi', 1048, 1848);
  ctx.restore();
}

function renderFrame(t) {
  TIME = t; BOIL = Math.floor(t * 8);
  const i = sceneIndex(t);
  // scene (with transitions)
  let k = 0, tr = null;
  for (let j = 1; j <= 8; j++) if (Math.abs(t - B[j]) < TD / 2) { tr = j; k = (t - (B[j] - TD / 2)) / TD; }
  if (tr) {
    drawSceneTo(actx, tr, t); drawSceneTo(bctx, tr + 1, t);
    CTX = sctx; sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over';
    sctx.drawImage(bufA, 0, 0);
    const spec = TR[tr]; const r = ease(k) * 1650;
    const bp = blobPath(spec.c[0], spec.c[1], r, tr * 3.3);
    sctx.save(); pathP(bp, true); sctx.clip(); sctx.drawImage(bufB, 0, 0); sctx.restore();
    if (k < 0.95) { L(bp.concat([bp[0]]), { lw: 7, salpha: 0.55 * (1 - k), amp: 3 }); L(blobPath(spec.c[0], spec.c[1], r * 0.97, tr * 7.1).concat([bp[0]]), { lw: 3, salpha: 0.35 * (1 - k), amp: 3 }); }
    if (spec.A && k > 0.08 && k < 0.92) {
      const mk2 = ease((k - 0.08) / 0.84);
      const P = morphPolys(spec.A(), spec.B(), mk2);
      const a = Math.pow(Math.sin(Math.PI * (k - 0.08) / 0.84), 0.6);
      seeded(tr * 11, () => { S(P, { lw: 6, alpha: a * 0.85, amp: 2.2, stroke: mix(shade(spec.fa, -0.45), shade(spec.fb, -0.45), mk2) }); S(P, { lw: 2.5, alpha: a * 0.5, amp: 3.5 }); });
    }
  } else {
    drawSceneTo(sctx, i, t);
  }
  // composite
  mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.globalAlpha = 1; mctx.globalCompositeOperation = 'source-over';
  mctx.drawImage(paper, 0, 0);
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1;
  sctx.globalCompositeOperation = 'destination-in'; sctx.drawImage(mask, 0, 0); sctx.globalCompositeOperation = 'source-over';
  mctx.drawImage(sceneBuf, 0, 0);
  // pencil edge where the illustration meets the paper
  // captions
  for (let c = 0; c < CAPS.length; c++) {
    const next = (c + 1 < CAPS.length ? CAPS[c + 1].s : FINAL.ta) - 0.18;
    if (t >= CAPS[c].s - 0.3 && t < next + 0.05) drawCaption(mctx, CAPS[c], t, next);
  }
  if (t >= B[8] - 0.1) drawFinal(mctx, t);
  // texture overlays
  mctx.globalCompositeOperation = 'multiply'; mctx.globalAlpha = 0.28; mctx.drawImage(grain, 0, 0);
  mctx.globalCompositeOperation = 'source-over'; mctx.globalAlpha = 0.55; mctx.drawImage(tooth, 0, 0);
  mctx.globalAlpha = 1;
  drawHandle(mctx, t);
}

async function init() {
  main = document.getElementById('c'); mctx = main.getContext('2d');
  sceneBuf = mk(); sctx = sceneBuf.getContext('2d');
  bufA = mk(); actx = bufA.getContext('2d'); bufB = mk(); bctx = bufB.getContext('2d');
  await Promise.all([400, 500, 600, 700].map(w => document.fonts.load(`${w} 80px Caveat`, 'İıŞşĞğÜüÖöÇç’“”')));
  buildTextures();
  window.READY = true;
}
window.renderFrame = renderFrame;
init();
