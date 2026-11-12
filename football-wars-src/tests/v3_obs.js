// V3 observer truth tests: duel/last-hope/multi-KO finals, streak tags vs real kills, momentum direction & mirror.
const E = require('../src/engine.js'); globalThis.FWEngine = E; const D = require('../src/director.js');
const db = require('../data/football_wars_master_2026_27.json'); const cfg = require('../data/battle_engine_config.json');
const all = [...db.clubs, ...db.national_teams]; const r = new E.Rng(4242);
let duel = 0, hope = 0, multiFinal = 0, games = 0, bad = [], examples = { duel: null, noDuel: null, multi: null };
for (let i = 0; i < 160; i++) {
  const a = all[r.int(all.length)], b = all[r.int(all.length)]; if (a === b) continue;
  const seed = r.int(2 ** 31); const o = { seed, teamA: a, teamB: b, cfg, duration: 'standard', fxLevel: 1 };
  const w = E.createWorld(o); w.observer = D.createObserver({}); while (w.phase !== 'ended') E.step(w); games++;
  const st = w.observer.state;
  // final KOs on the very last tick
  const lastKOs = w.events.filter(e => e.type === E.EV.KO && e.k === w.endTick).length;
  if (lastKOs > 1) { multiFinal++; if (!examples.multi) examples.multi = [a.id, b.id, seed]; }
  if (st.duel) { duel++; if (!examples.duel) examples.duel = [a.id, b.id, seed];
    // verify: at duel.t exactly one alive per side (replay KOs)
    let A = 100, B = 100; for (const e of w.events) if (e.type === E.EV.KO && e.t <= st.duel.t + 1e-9) { if (w.units[e.b].side === 0) A--; else B--; }
    if (!(A === 1 && B === 1)) bad.push(['duel', a.id, b.id, seed, A, B]);
  } else if (!examples.noDuel) examples.noDuel = [a.id, b.id, seed];
  if (st.hope) hope++;
  for (const tg of st.tags) { const k = w.units[tg.unit]; let kills = 0; for (const e of w.events) if (e.type === E.EV.KO && e.a === tg.unit && e.t <= tg.t + 1e-9) kills++; if (kills !== tg.n || k.side !== tg.side) bad.push(['tag', tg, kills]); }
  if (st.alerts.some(x => x.type === 'STREAK')) bad.push(['double streak alert']);
  if (Math.abs(st.mom) > 1) bad.push(['mom range', st.mom]);
}
// mirror test: swapping A/B flips momentum sign at same time? (different battle due to side order -> compare sign vs who dealt more pressure)
const by = id => all.find(t => t.id === id); let agree = 0, tot = 0;
for (const seed of [1, 2, 3, 4, 5]) { const w = E.createWorld({ seed, teamA: by('NAT_SPAIN'), teamB: by('NAT_SAN_MARINO'), cfg, duration: 'standard' }); w.observer = D.createObserver({});
  let snaps = 0; while (w.phase !== 'ended') { E.step(w); if (w.phase === 'battle' && w.tick % 120 === 0) { const st = w.observer.state; tot++; const pa = st.momSum[0], pb = st.momSum[1]; if (Math.sign(st.momRaw) === Math.sign(pa - pb) || pa === pb) agree++; } } }
console.log({ games, duel, hope, multiFinal, examples, momSignAgree: agree + '/' + tot, bad: bad.slice(0, 5), badN: bad.length });
