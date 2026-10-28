'use strict';
const END = 59.2; // narration ends 57.73s; short hold on the final card
const SCENES = [
  { a: 0.00, b: 5.45, f: scene1 },
  { a: 4.85, b: 13.05, f: scene2, tin: { type: 'iris', at: p => irisS1(p) } },
  { a: 12.55, b: 17.55, f: scene3, tin: { type: 'dissolve' } },
  { a: 17.05, b: 23.35, f: scene4, tin: { type: 'dissolve' } },
  { a: 22.75, b: 32.75, f: scene5, tin: { type: 'dissolve' } },
  { a: 32.15, b: 42.65, f: scene6, tin: { type: 'wipe' } },
  { a: 42.05, b: 54.45, f: scene7, tin: { type: 'dissolve' } },
  { a: 53.85, b: END + 1, f: scene8, tin: { type: 'dissolve' } },
];
let CTX;
function init() {
  const cv = document.getElementById('c'); CTX = cv.getContext('2d');
  buildTextures(CTX); layoutCaptions(CTX);
}
function renderFrame(t) {
  TIME = t; BOIL = Math.floor(t * 8);
  const ctx = CTX; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
  const act = SCENES.filter(s => t >= s.a && t < s.b);
  if (act.length === 1) { ctx.save(); act[0].f(ctx, t); ctx.restore(); }
  else {
    const [A, B] = act, p = clamp((t - B.a) / (A.b - B.a));
    LAYER_DEPTH = 2;
    const la = layer(0); A.f(la, t);
    const lb = layer(1); B.f(lb, t);
    ctx.drawImage(la.canvas, 0, 0);
    const tp = B.tin || { type: 'dissolve' };
    if (tp.type === 'dissolve') { ctx.globalAlpha = smooth(p); ctx.drawImage(lb.canvas, 0, 0); ctx.globalAlpha = 1; }
    else {
      lb.globalCompositeOperation = 'destination-in';
      let edge;
      if (tp.type === 'iris') { const [x, y, r] = tp.at(p); edge = circAt(x, y, r, 40); }
      else { const ex = lerp(-120, W + 160, ease(p)); edge = [[-50, -50], [ex, -50]]; for (let i = 0; i <= 20; i++) edge.push([ex + Math.sin(i * 1.7 + t * 3) * 30 + vn(i * 0.5, 3) * 30, i / 20 * H]); edge.push([ex, H + 50], [-50, H + 50]); }
      lb.beginPath(); tr(lb, edge, true); lb.fillStyle = '#000'; lb.fill();
      lb.globalCompositeOperation = 'source-over';
      ctx.drawImage(lb.canvas, 0, 0);
      if (tp.type === 'iris') draw(ctx, edge, { fill: null, stroke: '#eef6f4', lw: 7, seed: 600 });
      else { const pts = edge.slice(2, -2); line(ctx, pts, { lw: 6, seed: 601 }); }
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.9; ctx.drawImage(GRAIN[0], 0, 0); ctx.globalAlpha = 1;
  drawCaptions(ctx, t);
  handle(ctx, easeOut(prog(t, 54.2, 54.8)));
}
window.renderFrame = renderFrame;
window.ready = document.fonts.load('700 40px Kalam', 'aİş“').then(() => document.fonts.load('400 40px Kalam', 'aİş“')).then(() => document.fonts.load('300 40px Kalam', 'aİş“')).then(() => document.fonts.ready).then(() => { init(); return true; });
