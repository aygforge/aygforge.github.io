const { load } = require('./load');
const AD = load();
(async () => {
  AD.WorldGenerator.generate(4242);
  const pc = AD.WorldGenerator.createNewLudus('valeria', 'Ludus X', { sh: 0, sy: 0, c1: '#900', c2: '#fd0' });
  AD.WorldGenerator.setPlayer(pc.id, true); pc.autoManage = true;
  const N = +(process.argv[2] || 2);
  for (let s = 0; s < N; s++) {
    for (let w = 0; w <= 30; w++) await AD.Game.processWeek();
    const S = AD.S;
    console.log('== season', S.season - 1);
    for (let t = 1; t <= 6; t++) {
      const cs = S.clubs.filter(c => c.finHist.length && c.finHist[c.finHist.length - 1] && c.hist.length && c.hist[c.hist.length - 1].tier === t);
      const inc = {}, exp = {};
      for (const c of cs) { const f = c.finHist[c.finHist.length - 1]; for (const k in f.inc) inc[k] = (inc[k] || 0) + f.inc[k] / cs.length; for (const k in f.exp) exp[k] = (exp[k] || 0) + f.exp[k] / cs.length; }
      const ti = Object.values(inc).reduce((a, b) => a + b, 0), te = Object.values(exp).reduce((a, b) => a + b, 0);
      const r = o => Object.entries(o).filter(([k, v]) => v > 0).map(([k, v]) => k + ':' + Math.round(v)).join(' ');
      console.log(`T${t} n${cs.length} inc ${Math.round(ti)} [${r(inc)}]\n    exp ${Math.round(te)} [${r(exp)}]  net ${Math.round(ti - te)}`);
    }
  }
})();
