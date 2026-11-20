// RunController — bütün tur fazlarının TEK otoritesi (durum makinesi + girdi kilidi + token).
// Sıra: kepçe → mermi kuyruğu → isabet → ölüm/tava/yetenek → boss zafer kapısı → düşman eylemi →
//       sağdan sola hareket → temas → dalga/boss geçişi → hibrit tencere yenileme → sonraki kepçe.
// Sahne (Phaser) yalnızca olayları oynatır ve token ile "bitti" bildirir; hiçbir oyun sonucu sahnede hesaplanmaz.
import { CHAPTERS, CHEF, POT, SKILL_WAVES, NORMAL_WAVES, COLD_OIL_RATE } from '../data/content.js';
import { Rng } from '../core/rng.js';
import { PotPhysics, STEP_MS } from './PotPhysics.js';
import { LadleController } from './LadleController.js';
import { spawnWave, enemyAction, resolveContacts, living } from './EnemyDirector.js';
import { resolveVolley, buildShots } from './CombatResolver.js';
import { emptyRecipe, starsFor } from './RecipeTracker.js';
import { makeOffer, applyAbility, ladleParams } from './Abilities.js';

export const PHASE = {
  WAVE_PREP: 'WAVE_PREP',
  SWING_WAIT: 'SWING_WAIT',
  CLAW_DROP: 'CLAW_DROP',
  CLAW_CAPTURE: 'CLAW_CAPTURE',
  CLAW_LIFT: 'CLAW_LIFT',
  CLAW_RETURN: 'CLAW_RETURN',
  VOLLEY: 'VOLLEY',
  RESOLVE_KILLS: 'RESOLVE_KILLS',
  ENEMY_ACTION: 'ENEMY_ACTION',
  CONTACT_RESOLVE: 'CONTACT_RESOLVE',
  WAVE_OR_TURN_END: 'WAVE_OR_TURN_END',
  POT_REFILL: 'POT_REFILL',
  SKILL_CHOICE: 'SKILL_CHOICE',
  BOSS_RESULT: 'BOSS_RESULT',
  GAME_OVER: 'GAME_OVER',
  PAUSED: 'PAUSED',
};

const REFILL_SETTLE_STEPS = 45;
const MAX_STEPS_PER_UPDATE = 6;

// Alpha 0.2 run counters. Missing keys in an Alpha 0.1 snapshot are filled by migrateRunState().
export const RUN_COUNTER_DEFAULTS = {
  permShot: 0, powerShot: 0, doubleShot: 0, panKills: 0, echoUsedThisWave: false,
  pierce: 0, explode: 0, knock: 0, healDmg: 0, shuffleUsedThisWave: false,
};

// Safe migration of an older (Alpha 0.1) wave snapshot: only adds missing fields with neutral defaults.
export function migrateRunState(run) {
  run.counters = { ...RUN_COUNTER_DEFAULTS, ...(run.counters || {}) };
  run.stats = { crits: 0, cappedEvents: 0, heals: 0, shuffles: 0, bossStartTurn: null, procs: {}, ...(run.stats || {}) };
  if (!run.critRng) run.critRng = ((run.seed || 1) ^ 0x9e3779b9) >>> 0 || 1;
  if (run.offerSeq == null) run.offerSeq = 0;
  if (run.lastOffer === undefined) run.lastOffer = null;
  for (const e of run.enemies || []) {
    if (e.frozen == null) e.frozen = false;
    if (e.lastFrozenAction === undefined) e.lastFrozenAction = null;
  }
  return run;
}

export function newRunState({ chapter, perm, seed, runId }) {
  return {
    runId,
    seed,
    chapterId: chapter.id,
    wave: 1,
    turn: 0,
    waveTurn: 0,
    chef: { hp: perm.hp, maxHp: perm.hp, shield: perm.shield, saltCharges: 0 },
    enemies: [],
    nextEnemyId: 1,
    abilities: {},
    perm: { ...perm },
    counters: { ...RUN_COUNTER_DEFAULTS },
    pending: { chain: 0, mastery: 0 },
    recipe: emptyRecipe(chapter),
    stats: {
      hpLost: 0, kills: 0, escaped: 0, shots: 0, normalShots: 0, damageDealt: 0,
      completedWaves: 0, taps: 0, catches: [], loads: [],
      crits: 0, cappedEvents: 0, heals: 0, shuffles: 0, bossStartTurn: null, procs: {},
    },
    critRng: (seed ^ 0x9e3779b9) >>> 0 || 1, // dedicated deterministic crit stream (snapshot-safe)
    offerSeq: 0,
    lastOffer: null,
    rerollUsed: false,
    choiceCount: 0,
    offer: null,
    turnKills: 0,
    turnSecondary: 0,
    result: null,
  };
}

export class RunController {
  /**
   * opts: { chapterId, perm, seed, runId, snapshot, autoAck }
   */
  constructor(opts) {
    this.chapter = CHAPTERS.find((c) => c.id === (opts.snapshot ? opts.snapshot.chapterId : opts.chapterId));
    if (!this.chapter) throw new Error('unknown chapter');
    this.listeners = [];
    this.autoAck = !!opts.autoAck;
    this.tokenSeq = 0;
    this.waitToken = null;
    this.deferredAck = null;
    this.acc = 0;
    this.phase = null;
    this.resumePhase = null;
    this.inputArmed = false;
    this.inputGuard = 0;
    this.finished = false;
    this.lastCatch = null;
    this.opts = opts;
  }

  on(fn) {
    this.listeners.push(fn);
    return () => (this.listeners = this.listeners.filter((f) => f !== fn));
  }

  emit(evt) {
    for (const fn of this.listeners) fn(evt);
  }

  get paused() {
    return this.phase === PHASE.PAUSED;
  }

  get coldRate() {
    return this.run.abilities.cold_oil ? COLD_OIL_RATE : 0;
  }

  get bigRate() {
    return Math.min(0.18, this.chapter.bigOilRate + (this.run.perm.spice || 0));
  }

  start() {
    const o = this.opts;
    if (o.snapshot) {
      const snap = JSON.parse(JSON.stringify(o.snapshot));
      this.run = migrateRunState(snap.run);
      this.rng = new Rng(1);
      this.rng.state = snap.rngState >>> 0;
      this.pot = new PotPhysics(this.rng);
      this.pot.restore(snap.pot);
      this.ladle = new LadleController(this.pot);
      this.ladle.configure(ladleParams(this.run));
      this.emit({ kind: 'restored', run: this.run });
      this.enterSwing(false);
      return;
    }
    this.rng = new Rng(o.seed);
    this.run = newRunState({ chapter: this.chapter, perm: o.perm, seed: o.seed, runId: o.runId });
    this.pot = new PotPhysics(this.rng);
    this.pot.fillInitial(POT.startCount, this.bigRate);
    this.ladle = new LadleController(this.pot);
    this.ladle.configure(ladleParams(this.run));
    this.emit({ kind: 'runStart', run: this.run });
    this.enterWavePrep();
  }

  // ---------------- await helpers ----------------
  awaitAck(evt) {
    const token = ++this.tokenSeq;
    this.waitToken = token;
    this.emit({ ...evt, token });
    return token;
  }

  ack(token) {
    if (token == null || token !== this.waitToken) return false; // stale / duplicate ack
    if (this.paused) {
      this.deferredAck = token;
      return true;
    }
    this.waitToken = null;
    const cont = this.onAck;
    this.onAck = null;
    if (cont) cont();
    return true;
  }

  // ---------------- phases ----------------
  setPhase(p) {
    this.phase = p;
    this.emit({ kind: 'phase', phase: p });
  }

  enterWavePrep() {
    this.setPhase(PHASE.WAVE_PREP);
    this.run.counters.echoUsedThisWave = false;
    this.run.counters.shuffleUsedThisWave = false;
    this.run.waveTurn = 0;
    if (this.run.wave > NORMAL_WAVES && this.run.stats.bossStartTurn == null) this.run.stats.bossStartTurn = this.run.turn;
    const spawned = spawnWave(this.run, this.chapter, this.rng);
    const firstOfRun = this.run.turn === 0;
    this.onAck = () => (firstOfRun ? this.enterSwing(true) : this.enterPotRefill(true));
    this.awaitAck({
      kind: 'wavePrep',
      wave: this.run.wave,
      isBoss: this.run.wave > NORMAL_WAVES,
      enemies: spawned.map((e) => ({ ...e })),
    });
  }

  enterPotRefill(waveStart) {
    this.setPhase(PHASE.POT_REFILL);
    const r = this.pot.refill(this.bigRate, this.coldRate);
    this.refillSteps = REFILL_SETTLE_STEPS;
    this.refillWaveStart = waveStart;
    this.emit({ kind: 'potRefill', ...r });
  }

  enterSwing(waveStart) {
    this.ladle.configure(ladleParams(this.run));
    if (this.ladle.phase !== 'idle' && this.ladle.phase !== 'swing') this.ladle.phase = 'idle';
    this.ladle.startSwing();
    if (waveStart) this.emit({ kind: 'checkpoint', snapshot: this.snapshot() });
    this.run.turn++;
    this.run.waveTurn++;
    this.setPhase(PHASE.SWING_WAIT);
    this.inputArmed = true;
    this.emit({ kind: 'swing', turn: this.run.turn, params: ladleParams(this.run) });
  }

  // Single-tap rule: exactly one drop per SWING_WAIT.
  tap() {
    if (this.phase !== PHASE.SWING_WAIT || !this.inputArmed || this.inputGuard > 0) return false;
    this.inputArmed = false;
    if (!this.ladle.drop()) return false;
    this.run.stats.taps++;
    this.setPhase(PHASE.CLAW_DROP);
    this.emit({ kind: 'drop', x: this.ladle.dropX });
    return true;
  }

  doCatch() {
    const res = this.ladle.resolveCatch();
    this.lastCatch = res;
    this.run.stats.catches.push(res.caught.length);
    this.run.stats.loads.push(res.load);
    // catch cards change the physical ladle itself: they are in effect on every catch
    for (const id of ['wide_ladle', 'deep_ladle', 'slow_swing', 'stable_rim']) {
      if (this.run.abilities[id]) this.run.stats.procs[id] = (this.run.stats.procs[id] || 0) + 1;
    }
    this.setPhase(PHASE.CLAW_RETURN);
    this.emit({ kind: 'catch', ...res });
  }

  enterVolley() {
    this.setPhase(PHASE.VOLLEY);
    const shots = buildShots(this.run, this.lastCatch.caught);
    const res = resolveVolley(this.run, this.chapter, shots);
    this.onAck = () => this.afterVolley(res.victory);
    this.awaitAck({ kind: 'volley', shots, events: res.events });
  }

  afterVolley(victory) {
    this.setPhase(PHASE.RESOLVE_KILLS);
    if (victory) return this.finish(true); // boss victory gate: no enemy action / damage this turn
    if (living(this.run).length === 0) return this.waveCleared();
    this.enterEnemyAction();
  }

  enterEnemyAction() {
    this.setPhase(PHASE.ENEMY_ACTION);
    const events = enemyAction(this.run, this.rng);
    this.onAck = () => this.enterContact();
    this.awaitAck({ kind: 'enemyAction', events });
  }

  enterContact() {
    this.setPhase(PHASE.CONTACT_RESOLVE);
    const events = resolveContacts(this.run, this.chapter);
    const bossDown = events.some((e) => e.type === 'victory');
    this.onAck = () => {
      if (bossDown) return this.finish(true); // boss died on Dikenli Önlük: victory gate first
      if (this.run.chef.hp <= 0) return this.finish(false);
      if (living(this.run).length === 0) return this.waveCleared();
      this.setPhase(PHASE.WAVE_OR_TURN_END);
      this.enterPotRefill(false);
    };
    this.awaitAck({ kind: 'contact', events, chef: { ...this.run.chef } });
  }

  waveCleared() {
    this.setPhase(PHASE.WAVE_OR_TURN_END);
    if (this.run.wave <= NORMAL_WAVES) this.run.stats.completedWaves = this.run.wave;
    this.emit({ kind: 'waveCleared', wave: this.run.wave });
    if (SKILL_WAVES.includes(this.run.wave)) return this.enterSkillChoice();
    this.nextWave();
  }

  nextWave() {
    this.run.wave++;
    this.enterWavePrep();
  }

  enterSkillChoice() {
    const offer = makeOffer(this.run, this.chapter, this.rng);
    if (!offer.length) return this.nextWave();
    this.run.offer = offer;
    this.run.offerSeq++;
    this.run.choiceCount++;
    this.setPhase(PHASE.SKILL_CHOICE);
    this.emit({ kind: 'skillChoice', offer, offerSeq: this.run.offerSeq, rerollAvailable: !this.run.rerollUsed, choice: this.run.choiceCount, total: SKILL_WAVES.length });
  }

  rerollSkills() {
    if (this.phase !== PHASE.SKILL_CHOICE || this.run.rerollUsed) return false;
    this.run.rerollUsed = true;
    const offer = makeOffer(this.run, this.chapter, this.rng, this.run.offer);
    this.run.offer = offer;
    this.run.offerSeq++;
    this.emit({ kind: 'skillChoice', offer, offerSeq: this.run.offerSeq, rerollAvailable: false, choice: this.run.choiceCount, total: SKILL_WAVES.length, rerolled: true });
    return true;
  }

  // offerSeq (optional) rejects a stale card from an offer that was already rerolled/replaced.
  chooseSkill(id, offerSeq = null) {
    if (this.phase !== PHASE.SKILL_CHOICE || !this.run.offer || !this.run.offer.includes(id)) return false;
    if (offerSeq != null && offerSeq !== this.run.offerSeq) return false;
    if (!applyAbility(this.run, this.chapter, id)) return false;
    this.run.lastOffer = this.run.offer;
    this.run.offer = null;
    this.emit({ kind: 'skillPicked', id, stacks: this.run.abilities[id], chef: { ...this.run.chef } });
    this.nextWave();
    return true;
  }

  finish(victory) {
    if (this.finished) return; // result opens exactly once
    this.finished = true;
    this.inputArmed = false;
    this.waitToken = null; // late presentation acks can no longer advance the run
    this.onAck = null;
    const stars = starsFor(this.run, this.chapter, victory);
    this.run.result = { victory, stars };
    this.setPhase(victory ? PHASE.BOSS_RESULT : PHASE.GAME_OVER);
    this.emit({ kind: 'result', victory, stars, run: this.run });
  }

  // Tencereyi Karıştır: once per wave, only while the ladle swings; does not use the turn.
  canShuffle() {
    return this.phase === PHASE.SWING_WAIT && !!this.run.abilities.pot_shuffle && !this.run.counters.shuffleUsedThisWave && this.inputGuard <= 0;
  }

  shufflePot() {
    if (!this.canShuffle()) return false;
    this.run.counters.shuffleUsedThisWave = true;
    this.run.stats.shuffles++;
    this.run.stats.procs.pot_shuffle = (this.run.stats.procs.pot_shuffle || 0) + 1;
    this.pot.shuffle();
    this.emit({ kind: 'shuffle' });
    return true;
  }

  // ---------------- pause ----------------
  pause() {
    if (this.paused || this.finished) return false;
    this.resumePhase = this.phase;
    this.phase = PHASE.PAUSED;
    this.acc = 0;
    this.emit({ kind: 'phase', phase: PHASE.PAUSED });
    return true;
  }

  resume() {
    if (!this.paused) return false;
    this.phase = this.resumePhase;
    this.resumePhase = null;
    this.acc = 0; // never fast-forward time spent in background
    this.inputGuard = 8; // swallow the resume click / spam taps for a few steps
    this.emit({ kind: 'phase', phase: this.phase });
    if (this.deferredAck != null) {
      const t = this.deferredAck;
      this.deferredAck = null;
      this.ack(t);
    }
    return true;
  }

  // ---------------- fixed-step update ----------------
  update(dtMs) {
    if (this.paused || this.finished) return;
    if (this.autoAck && this.waitToken != null) this.ack(this.waitToken);
    this.acc += Math.min(dtMs, 100);
    let n = 0;
    while (this.acc >= STEP_MS && n < MAX_STEPS_PER_UPDATE) {
      this.acc -= STEP_MS;
      n++;
      this.fixedStep();
      if (this.paused || this.finished) break;
    }
    if (n >= MAX_STEPS_PER_UPDATE) this.acc = 0;
  }

  fixedStep() {
    if (this.inputGuard > 0) this.inputGuard--;
    switch (this.phase) {
      case PHASE.SWING_WAIT:
        this.ladle.step();
        break;
      case PHASE.CLAW_DROP:
      case PHASE.CLAW_CAPTURE:
      case PHASE.CLAW_LIFT: {
        const ev = this.ladle.step();
        if (ev === 'CLAW_CAPTURE') this.setPhase(PHASE.CLAW_CAPTURE);
        else if (ev === 'CLAW_LIFT') this.setPhase(PHASE.CLAW_LIFT);
        else if (ev === 'CAUGHT') this.doCatch();
        break;
      }
      case PHASE.CLAW_RETURN: {
        const ev = this.ladle.step();
        if (ev === 'RETURNED') this.enterVolley();
        break;
      }
      case PHASE.POT_REFILL:
        this.ladle.step();
        if (--this.refillSteps <= 0) this.enterSwing(this.refillWaveStart);
        break;
      default:
        break; // presentation phases: pot physics frozen so animation speed never changes outcomes
    }
  }

  // Wave-boundary snapshot (taken on SWING_WAIT entry of a wave's first turn).
  snapshot() {
    return JSON.parse(
      JSON.stringify({
        schema: 1,
        chapterId: this.chapter.id,
        runId: this.run.runId,
        rngState: this.rng.state,
        run: this.run,
        pot: this.pot.serialize(),
        savedAt: Date.now(),
      }),
    );
  }
}

export { CHEF };
