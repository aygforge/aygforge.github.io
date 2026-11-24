// freeze / replay reference battles: node ref_freeze.js check  (the 'save' mode was run once with the Arcade Mayhem release core to freeze Legacy/Mayhem/V4 battle options + hashes in ref_battles.json)
const fs = require('fs'), path = require('path'); const A = require('./load.js'); const E = FWEngine, B = A.Battle;
const F = path.join(__dirname, 'ref_battles.json');
const run = o => { const w = E.createWorld(o); while (w.phase !== 'ended' && w.t < 90) E.step(w); return w.hash.toString(16); };
if (process.argv[2] === 'save') {
  const s = A.Save.fresh('ENG_ARSENAL', 4711); for (const k of A.Upgrades.KEYS) s.upgrades[k] = 6;
  const ids = A.Stars.defs.filter(d => d.role !== 'captain').slice(0, 3).map(d => d.id); for (const id of ids) s.stars[id] = { id, ovr: 60, contract: 5, rarity: A.Stars.def(id).rarity }; s.active = ids.slice();
  const snap = B.snapshot(s, 'league'); const list = [];
  for (const seed of [11, 22, 33]) {
    const base = Object.assign({}, snap, { seed });
    list.push({ kind: 'legacy', o: B.worldOpts(Object.assign({}, base, { mech: undefined }), { headless: true, inputs: [{ tick: 900, q: 'tap' }] }) });
    list.push({ kind: 'mayhem', o: B.worldOpts(Object.assign({}, base, { mech: 'mayhem' }), { headless: true, cmds: [{ tick: 700, side: 0, type: 'rush', tx: 180, ty: 330 }, { tick: 1500, side: 0, type: 'iron', tx: 180, ty: 520 }, { tick: 1900, side: 0, type: 'kick', tx: 180, ty: 104 }] }) });
    list.push({ kind: 'v4', o: { seed, teamA: FW_MASTER_DB.clubs[seed % 50], teamB: FW_MASTER_DB.clubs[seed % 50 + 60], cfg: null, ruleset: 'fusion', duration: 'standard' } });
  }
  for (const L of list) { const o = Object.assign({}, L.o, { cfg: FW_ENGINE_CONFIG }); L.hash = run(o); L.o.cfg = null; }
  fs.writeFileSync(F, JSON.stringify(list)); console.log(list.map(l => l.kind + ' ' + l.hash).join('\n'));
} else {
  const list = JSON.parse(fs.readFileSync(F, 'utf8')); let ok = 0;
  for (const L of list) { const h = run(Object.assign({}, L.o, { cfg: FW_ENGINE_CONFIG })); const same = h === L.hash; if (same) ok++; console.log((same ? 'PASS ' : 'FAIL ') + 'R-' + L.kind + ' frozen ' + L.o.seed + ' ' + h + (same ? '' : ' expected ' + L.hash)); }
  console.log('frozen reference battles: ' + ok + '/' + list.length);
}
