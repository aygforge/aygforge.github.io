const { load } = require('./load');
const AD = load();
(async () => {
  AD.WorldGenerator.generate(99);
  const pc = AD.WorldGenerator.createNewLudus('aegion', 'Ludus X', { sh: 0, sy: 0, c1: '#900', c2: '#fd0' });
  AD.WorldGenerator.setPlayer(pc.id, true); pc.autoManage = true;
  for (let s = 0; s < 3; s++) {
    const snap = {}; for (const id in AD.S.glads) { const g = AD.S.glads[id]; snap[id] = { o: g.ovr, a: g.age, c: g.club, m: g.cs.m }; }
    for (let w = 0; w <= 30; w++) await AD.Game.processWeek();
    const b = {};
    for (const id in snap) { const g = AD.S.glads[id]; if (!g) continue; const k = snap[id].a <= 21 ? '18-21' : snap[id].a <= 25 ? '22-25' : snap[id].a <= 29 ? '26-29' : snap[id].a <= 32 ? '30-32' : '33+'; const played = g.cs.m - snap[id].m; const kk = k + (played >= 10 ? ' starter' : played > 0 ? ' rot' : ' none'); (b[kk] = b[kk] || []).push(g.ovr - snap[id].o); }
    console.log('season', AD.S.season - 1);
    for (const k of Object.keys(b).sort()) { const a = b[k]; a.sort((x, y) => x - y); console.log('  ', k.padEnd(16), 'n', String(a.length).padStart(4), 'mean', (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), 'p90', a[a.length * 0.9 | 0].toFixed(1)); }
  }
})();
