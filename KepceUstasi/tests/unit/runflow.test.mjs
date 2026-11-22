// QA 4, 6, 9, 10, 13, 14 — RunController durum makinesi, girdi kilidi, kayıt snapshot'ı, iki chapter'ın tamamı.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RunController, PHASE } from '../../src/systems/RunController.js';
import { STEP_MS } from '../../src/systems/PotPhysics.js';
import { permStats, applyRunResult, purchaseUpgrade } from '../../src/systems/Progression.js';
import { defaultSave, SaveService } from '../../src/systems/SaveService.js';
import { CHAPTERS } from '../../src/data/content.js';
import { simulateRun } from '../sim/simlib.mjs';
import { memStorage } from './helpers.mjs';

function ctl(opts = {}) {
  const c = new RunController({ chapterId: 'menemen', perm: permStats(defaultSave()), seed: 5, runId: 'r', autoAck: true, ...opts });
  const events = [];
  c.on((e) => events.push(e));
  c.start();
  return { c, events };
}
const stepN = (c, n) => {
  for (let i = 0; i < n; i++) c.update(STEP_MS + 0.0001);
};
function untilPhase(c, phase, max = 3000) {
  for (let i = 0; i < max && c.phase !== phase; i++) c.update(STEP_MS + 0.0001);
  assert.equal(c.phase, phase);
}

test('single tap per swing: double tap / spam creates only one ladle drop and one turn', () => {
  const { c, events } = ctl();
  untilPhase(c, PHASE.SWING_WAIT);
  stepN(c, 20);
  assert.equal(c.tap(), true);
  for (let i = 0; i < 25; i++) assert.equal(c.tap(), false);
  stepN(c, 30);
  for (let i = 0; i < 10; i++) c.tap();
  untilPhase(c, PHASE.SWING_WAIT);
  assert.equal(events.filter((e) => e.kind === 'drop').length, 1);
  assert.equal(events.filter((e) => e.kind === 'catch').length, 1);
  assert.equal(events.filter((e) => e.kind === 'volley').length, 1);
  assert.equal(c.run.stats.taps, 1);
});

test('pause/resume spam: no taps while paused, no time fast-forward, no double turn', () => {
  const { c, events } = ctl();
  untilPhase(c, PHASE.SWING_WAIT);
  const swingStep = c.ladle.swingStep;
  for (let i = 0; i < 50; i++) {
    c.pause();
    assert.equal(c.tap(), false);
    c.update(5000); // background time is ignored
    c.resume();
  }
  assert.ok(c.ladle.swingStep - swingStep < 50, 'no catch-up of paused time');
  assert.equal(c.tap(), false, 'resume guard swallows the resume click');
  stepN(c, 10);
  assert.equal(c.tap(), true);
  c.pause();
  c.update(10000);
  assert.equal(c.phase, PHASE.PAUSED);
  c.resume();
  untilPhase(c, PHASE.SWING_WAIT);
  assert.equal(events.filter((e) => e.kind === 'volley').length, 1);
});

test('stale / duplicate acks are ignored (token check)', () => {
  const c = new RunController({ chapterId: 'menemen', perm: permStats(defaultSave()), seed: 5, runId: 'r' });
  const tokens = [];
  c.on((e) => e.token && tokens.push(e.token));
  c.start();
  assert.equal(c.phase, PHASE.WAVE_PREP);
  assert.equal(c.ack(999), false);
  assert.equal(c.ack(tokens[0]), true);
  assert.equal(c.ack(tokens[0]), false);
  assert.equal(c.phase, PHASE.SWING_WAIT);
});

test('enemies move only in ENEMY_ACTION and only leftwards', () => {
  const c = new RunController({ chapterId: 'fries', perm: permStats(defaultSave()), seed: 12, runId: 'r', autoAck: true });
  let prev = new Map();
  const changes = [];
  c.on((e) => {
    // compare logical positions at every emitted event: who changed x, and during which event
    for (const en of c.run?.enemies || []) {
      if (prev.has(en.id) && prev.get(en.id) !== en.x) {
        const knocked = e.kind === 'volley' && e.events.some((x) => x.type === 'knockback' && x.id === en.id);
        changes.push({ kind: e.kind, dx: en.x - prev.get(en.id), boss: en.boss, knocked });
      }
    }
    prev = new Map((c.run?.enemies || []).map((en) => [en.id, en.x]));
  });
  c.start();
  for (let i = 0; i < 200000 && !c.finished; i++) {
    if (c.phase === PHASE.SWING_WAIT && c.ladle.swingStep === 50) c.tap();
    if (c.phase === PHASE.SKILL_CHOICE) c.chooseSkill(c.run.offer[0]);
    c.update(STEP_MS + 0.0001);
  }
  assert.ok(c.finished);
  assert.ok(changes.length > 0);
  for (const ch of changes) {
    if (ch.dx < 0) assert.equal(ch.kind, 'enemyAction', 'leftward moves happen only in the enemy action phase');
    else assert.ok(ch.kind === 'contact' || ch.knocked, 'rightward only as a contact retreat or an explicit knockback hit effect');
  }
});

test('boss dies -> instant victory: no enemy action / contact after, result emitted once', () => {
  const r = simulateRun({ chapterId: 'menemen', seed: 3, policy: 'perfect' });
  assert.equal(r.result.victory, true);
  assert.equal(r.log.results, 1);
  const c = r.ctl;
  const evs = [];
  c.on((e) => evs.push(e));
  c.update(1000);
  c.finish(true);
  assert.equal(evs.length, 0, 'no events after the result');
});

test('Menemen and Patates Kızartması are completed end-to-end (first time + replay); unlocks and tips are right', () => {
  const save = defaultSave();
  const r1 = simulateRun({ chapterId: 'menemen', seed: 21, save, policy: 'perfect' });
  assert.ok(r1.result.victory);
  const o1 = applyRunResult(save, CHAPTERS[0], r1.run, r1.result);
  assert.equal(o1.firstClear, true);
  assert.equal(save.highestUnlocked, 2);
  const tips1 = save.tips;
  assert.equal(tips1, o1.reward.total);
  // spend on a permanent upgrade, then fries
  assert.ok(purchaseUpgrade(save, 'capacity').ok);
  const r2 = simulateRun({ chapterId: 'fries', seed: 22, save, policy: 'perfect' });
  assert.ok(r2.result.victory, 'second boss defeated');
  assert.equal(r2.run.perm.capacity, 8, 'upgrade applied in the run');
  const o2 = applyRunResult(save, CHAPTERS[1], r2.run, r2.result);
  assert.equal(o2.reward.firstBonus, 35);
  // replay chapter 1: no first-clear bonus
  const r3 = simulateRun({ chapterId: 'menemen', seed: 23, save, policy: 'perfect' });
  const o3 = applyRunResult(save, CHAPTERS[0], r3.run, r3.result);
  assert.equal(o3.reward.firstBonus, 0);
  assert.equal(save.chapters.menemen.plays, 2);
});

test('checkpoint snapshot: restore resumes at wave start without double kill, double reward or double wave', () => {
  const first = simulateRun({ chapterId: 'menemen', seed: 31, snapshotAt: 3 });
  const snap = first.log.checkpoints[2];
  assert.ok(snap.run.wave >= 2);
  const recipeAtSnap = JSON.stringify(snap.run.recipe);
  const killsAtSnap = snap.run.stats.kills;
  // persist through the real SaveService (JSON round trip)
  const st = memStorage();
  const svc = new SaveService(st);
  const save = defaultSave();
  save.activeRun = snap;
  svc.save(save);
  const loaded = new SaveService(st).load();
  const c = new RunController({ snapshot: loaded.activeRun, autoAck: true });
  const ev = [];
  c.on((e) => ev.push(e));
  c.start();
  // Alpha 0.5A.1: with leftover ammo the wave starts with its volley, otherwise with the ladle swing
  assert.equal(c.phase, snap.run.pendingAmmo?.length ? PHASE.VOLLEY : PHASE.SWING_WAIT);
  assert.equal(c.run.wave, snap.run.wave);
  assert.equal(JSON.stringify(c.run.recipe), recipeAtSnap);
  assert.equal(c.run.stats.kills, killsAtSnap);
  assert.equal(c.pot.count, snap.pot.balls.length + snap.pot.pending.length);
  assert.equal(ev.filter((e) => e.kind === 'wavePrep').length, 0, 'no duplicate wave spawn on restore');
  // play it out
  let steps = 0;
  while (!c.finished && steps++ < 200000) {
    if (c.phase === PHASE.SWING_WAIT && c.ladle.swingStep === 55) c.tap();
    if (c.phase === PHASE.SKILL_CHOICE) c.chooseSkill(c.run.offer[0]);
    c.update(STEP_MS + 0.0001);
  }
  assert.ok(c.finished);
  const killIds = ev.filter((e) => e.kind === 'volley').flatMap((v) => v.events.filter((x) => x.type === 'kill').map((k) => k.id));
  assert.equal(new Set(killIds).size, killIds.length, 'each enemy killed once');
  const s2 = defaultSave();
  const a = applyRunResult(s2, CHAPTERS[0], c.run, c.run.result);
  const b = applyRunResult(s2, CHAPTERS[0], c.run, c.run.result);
  assert.equal(b.duplicate, true);
  assert.equal(s2.tips, a.reward.total);
  assert.equal(s2.activeRun, null);
});

test('skill choice (Alpha 0.2): after every normal wave 1–6, 6 picks per run, none after the boss; one free reroll; stale card rejected', () => {
  const { c, events } = ctl({ seed: 8 });
  const waves = [];
  let rerolled = false;
  for (let i = 0; i < 200000 && !c.finished; i++) {
    if (c.phase === PHASE.SWING_WAIT && c.ladle.swingStep === 52) c.tap();
    if (c.phase === PHASE.SKILL_CHOICE) {
      waves.push(c.run.wave);
      if (!rerolled) {
        const before = c.run.offer.slice();
        assert.equal(c.rerollSkills(), true);
        assert.notDeepEqual(c.run.offer, before);
        assert.equal(c.rerollSkills(), false, 'second free reroll refused');
        rerolled = true;
      }
      assert.equal(c.chooseSkill('not_offered'), false);
      assert.equal(c.chooseSkill(c.run.offer[0], c.run.offerSeq - 1), false, 'card from an older offer is rejected');
      assert.ok(c.chooseSkill(c.run.offer[0], c.run.offerSeq));
    }
    c.update(STEP_MS + 0.0001);
  }
  assert.deepEqual(waves, [1, 2, 3, 4, 5, 6]);
  assert.equal(Object.values(c.run.abilities).reduce((a, b) => a + b, 0), 6);
  assert.equal(events.filter((e) => e.kind === 'skillChoice').length, 7);
  assert.ok(events.filter((e) => e.kind === 'skillChoice').every((e) => e.total === 6));
  const lastPick = events.findLastIndex((e) => e.kind === 'skillPicked');
  const bossWave = events.findIndex((e) => e.kind === 'wavePrep' && e.isBoss);
  assert.ok(lastPick < bossWave, 'the 6th pick happens before the boss; none after');
});
