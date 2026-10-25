const { load } = require('./load');
const AD = load();
(async () => {
  AD.WorldGenerator.generate(4242);
  const pc = AD.WorldGenerator.createNewLudus('valeria', 'Ludus X', { sh: 0, sy: 0, c1: '#900', c2: '#fd0' });
  AD.WorldGenerator.setPlayer(pc.id, true); pc.autoManage = true;
  const rep = (lbl) => {
    const S = AD.S; const out = [];
    for (let t = 1; t <= 6; t++) {
      const cs = S.clubs.filter(c => c.tier === t);
      const gl = cs.flatMap(c => c.roster.map(id => S.glads[id]));
      const w = gl.reduce((a, g) => a + g.con.wage, 0) / gl.length;
      const o = gl.reduce((a, g) => a + g.ovr, 0) / gl.length;
      const ew = gl.reduce((a, g) => a + AD.TransferMath.expectedWage(g), 0) / gl.length;
      const b = cs.reduce((a, c) => a + c.budget, 0) / cs.length;
      const arr = cs.filter(c => c.arrears > 0).length;
      out.push(`T${t} ovr ${o.toFixed(1)} wage ${w.toFixed(0)} exp ${ew.toFixed(0)} bud ${Math.round(b)} arr ${arr}`);
    }
    console.log(lbl + '\n  ' + out.join('\n  '));
  };
  rep('start');
  for (let s = 0; s < +(process.argv[2] || 4); s++) { for (let w = 0; w <= 30; w++) await AD.Game.processWeek(); rep('after season ' + (AD.S.season - 1)); }
})();
