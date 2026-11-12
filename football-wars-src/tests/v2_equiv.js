// V1 vs V2 engine equivalence + story-alert truthfulness + edit-plan sanity (Node, no browser)
const path = require('path');
const V1 = require(process.env.V1 || '/tmp/claude-0/-home-user-aygforge-github-io/191a4712-9ac7-5807-a3c4-be4d74e74dc3/scratchpad/engine_v1.js');
delete require.cache[require.resolve('../src/engine.js')];
const E = require('../src/engine.js'); globalThis.FWEngine = E;
const D = require('../src/director.js');
const db = require('../data/football_wars_master_2026_27.json'); const cfg = require('../data/battle_engine_config.json');
const all = [...db.clubs, ...db.national_teams]; const by = id => all.find(t => t.id === id);
const pairs = [['TUR_GALATASARAY','TUR_FENERBAHCE'],['ESP_REAL_MADRID','ESP_FC_BARCELONA'],['NAT_TURKIYE','NAT_GERMANY'],['NAT_SPAIN','NAT_SAN_MARINO'],['ENG_ARSENAL','GRE_VOLOS_NFC'],['ITA_INTER','ITA_AC_MILAN']];
const seeds = [123456, 2024, 777, 99991, 31337];
let mism = 0, n = 0, alertTot = 0, bad = [], types = {}, durs = [];
for (const [a, b] of pairs) for (const seed of seeds) for (const dur of ['standard', 'short', 'long']) {
  if (dur !== 'standard' && seed !== 2024) continue;
  const o = { seed, teamA: by(a), teamB: by(b), cfg, duration: dur, fxLevel: 1 };
  const s1 = V1.summary(V1.simulate(o));
  const w = E.createWorld(o); const obs = D.createObserver({ smartCam: true, intensity: 'cinematic' }); w.observer = obs;
  while (w.phase !== 'ended') E.step(w);
  E.advanceTo(w, w.endT + w.outroLen);
  const s2 = E.summary(w); n++;
  if (JSON.stringify(s1) !== JSON.stringify(s2)) { mism++; console.log('MISMATCH', a, b, seed, s1, s2); }
  // alert truthfulness: replay score timeline from KO events
  const st = obs.state; alertTot += st.alerts.length;
  let A = 100, B = 100, maxDef = [0, 0];
  const snaps = [];
  for (const e of w.events) if (e.type === E.EV.KO) { const v = w.units[e.b]; if (v.side === 0) A--; else B--; snaps.push([e.t, A, B, e]); }
  for (const al of st.alerts) {
    types[al.type] = (types[al.type] || 0) + 1;
    const at = snaps.filter(x => x[0] <= al.t + 1e-9); const last = at.length ? at[at.length - 1] : [0, 100, 100];
    const a1 = last[1], b1 = last[2];
    const ok = {
      COMEBACK: () => { const md = Math.max(...at.map(x => al.side ? x[1] - x[2] : x[2] - x[1]), 0); return md >= 10 && (al.side ? b1 > a1 : a1 > b1); },
      LEAD_CHANGE: () => Math.abs(a1 - b1) >= 5 && (a1 > b1 ? 0 : 1) === al.side,
      DOMINATING: () => Math.abs(a1 - b1) >= 20,
      CAPTAIN_DOWN: () => at.some(x => x[3].c === 1 && w.units[x[3].b].side === al.side && Math.abs(x[0] - al.t) < 0.02),
      STREAK: () => w.units.some(u => u.side === al.side && u.kills >= 5),
      FINAL10: () => a1 + b1 <= 10,
      LAST_PLAYER: () => (al.side ? b1 : a1) === 1,
      LAST_HOPE: () => (al.side ? b1 : a1) === 1 && (al.side ? a1 : b1) > 1,
      DUEL: () => a1 === 1 && b1 === 1
    }[al.type]();
    if (!ok) bad.push([a, b, seed, al]);
    if (al.t < E.TL.battleStart || al.t > w.endT) bad.push(['time', al]);
  }
  for (let i = 1; i < st.alerts.length; i++) if (st.alerts[i].t - st.alerts[i - 1].t < 1.2) bad.push(['spacing', st.alerts[i - 1], st.alerts[i]]);
  if (st.alerts.length > 7) bad.push(['count', st.alerts.length]);
  // edit plan
  const plan = D.buildPlan(w, st, { style: 'cinematic', epicFinale: false });
  const p3 = D.buildPlan(w, st, { style: 'cinematic' }); const slowExtra = (p3.toOut(w.endT) - p3.toOut(w.endT - 2)) - 2;
  if (!(slowExtra > 0.25 && slowExtra < 0.7) || p3.outDur > 65 || Math.abs(p3.map(p3.outDur) - (w.endT + w.outroLen)) > 0.02) bad.push(['v3plan', a, b, seed, slowExtra, p3.outDur]);
  const total = w.endT + w.outroLen;
  // monotonic + intro identity + outro 1x
  let prev = -1, mono = true; for (let o2 = 0; o2 <= plan.outDur; o2 += 1 / 30) { const s = plan.map(o2); if (s < prev - 1e-9) mono = false; prev = s; }
  const introOk = Math.abs(plan.map(1.5) - 1.5) < 1e-3 && Math.abs(plan.map(2.2) - 2.2) < 1e-3;
  const endOut = plan.toOut(w.endT), tailOk = Math.abs((plan.outDur - endOut) - (total - w.endT)) < 0.02;
  const finalOk = Math.abs(plan.map(plan.outDur) - total) < 0.02;
  const lastSecOk = Math.abs((plan.toOut(w.endT) - plan.toOut(w.endT - 2)) - 2) < 0.05;
  if (!mono || !introOk || !tailOk || !finalOk || !lastSecOk) bad.push(['plan', a, b, seed, { mono, introOk, tailOk, finalOk, lastSecOk }]);
  durs.push([a.slice(4, 12), b.slice(4, 12), seed, dur, total.toFixed(1), plan.outDur.toFixed(1), plan.highlights, st.alerts.map(x => x.type).join(','), 'zMax', st.camStats.zMax.toFixed(2)]);
}
console.log('worlds', n, 'V1/V2 mismatches', mism);
console.log('alerts total', alertTot, 'avg', (alertTot / n).toFixed(1), JSON.stringify(types));
console.log('BAD', JSON.stringify(bad).slice(0, 2000));
for (const d of durs) console.log(d.join(' | '));
