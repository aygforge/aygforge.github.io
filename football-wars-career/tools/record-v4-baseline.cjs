// M0: records reference battles from the ORIGINAL, unmodified V4 engine (tests/fixtures/v4-engine-original.cjs).
const fs = require('fs'), path = require('path');
globalThis.window = globalThis;
eval(fs.readFileSync(process.argv[2], 'utf8')); // V4 data block (FW_MASTER_DB, FW_ENGINE_CONFIG)
const E = require(path.resolve(__dirname, '../tests/fixtures/v4-engine-original.cjs'));
const db = globalThis.FW_MASTER_DB, cfg = globalThis.FW_ENGINE_CONFIG;
const pairs = [[0, 1], [12, 77], [33, 150], [60, 61], [101, 190], [5, 140]];
const out = { source: 'football-wars-v4.html FWEngine (unmodified)', cases: [] };
const teams = {};
for (const [i, j] of pairs) {
  const anon = (t, k) => ({ id: 'REF_' + k, name: 'Ref ' + k, visual: { primary_color: t.visual.primary_color, secondary_color: t.visual.secondary_color }, battle_profile: t.battle_profile });
  const a = anon(db.clubs[i], i), b = anon(db.clubs[j], j);
  // anonymise: keep only what the engine reads (ids/colours do not affect outcome except id in rng hash)
  for (const t of [a, b]) teams[t.id] = t;
  for (const ruleset of ['classic', 'fusion']) for (const seed of [11, 4242]) {
    const w = E.simulate({ seed, teamA: a, teamB: b, cfg, duration: 'standard', ruleset, fbIntensity: 'normal', fxLevel: 1 });
    const s = E.summaryV4(w);
    out.cases.push({ a: a.id, b: b.id, seed, ruleset, winner: s.winner, endTick: w.endTick, hash: s.hash, events: s.events, survivors: s.survivors, goals: s.football ? s.football.goals : null });
  }
}
out.teams = teams;
out.cfg = { simulation_engine_recommendation: cfg.simulation_engine_recommendation, archetype_definitions: cfg.archetype_definitions };
fs.writeFileSync(path.resolve(__dirname, '../tests/fixtures/v4-baseline.json'), JSON.stringify(out, null, 1));
console.log(out.cases.map(c => [c.ruleset, c.seed, c.winner, c.endTick, c.hash].join(' ')).join('\n'));
