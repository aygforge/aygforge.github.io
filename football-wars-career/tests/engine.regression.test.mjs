// M0/M1: the modular engine must reproduce the ORIGINAL V4 engine bit-for-bit for legacy rulesets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import E from '../src/battle/engine.js';
const base = JSON.parse(readFileSync(new URL('./fixtures/v4-baseline.json', import.meta.url)));
for (const headless of [false, true]) {
  test(`V4 reference battles reproduced (headless=${headless})`, () => {
    for (const c of base.cases) {
      const w = E.simulate({ seed: c.seed, teamA: base.teams[c.a], teamB: base.teams[c.b], cfg: base.cfg, duration: 'standard', ruleset: c.ruleset, fbIntensity: 'normal', fxLevel: 1, headless, noLog: headless });
      const s = E.summaryV4(w);
      assert.equal(s.winner, c.winner, `winner ${c.a}-${c.b} ${c.ruleset} ${c.seed}`);
      assert.equal(w.endTick, c.endTick, `endTick ${c.a}-${c.b} ${c.ruleset} ${c.seed}`);
      assert.equal(s.hash, c.hash, `hash ${c.a}-${c.b} ${c.ruleset} ${c.seed}`);
      assert.equal(s.events, c.events);
      if (c.goals) assert.deepEqual(s.football.goals, c.goals);
    }
  });
}
