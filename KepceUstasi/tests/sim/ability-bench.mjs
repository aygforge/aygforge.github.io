// Yetenek karşılaştırma tezgâhı (Alpha 0.3). Her kart en yüksek seviyesinde, kartsız temel çizgiye göre ölçülür.
// Savaş kartları: gerçek CombatResolver, sabit yakalama (5 normal + 1 büyük), 4 salvo, deterministik tohum.
// Savunma kartları: gerçek temas çözümü. Yakalama kartları: gerçek fizik (9 konum × σ=4 adım, ısıtılmış tencere).
// Kullanım: node tests/sim/ability-bench.mjs  -> markdown tablo + JSON (tests/sim/ability-bench.json)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ABILITIES, CHAPTERS, LADLE, POT } from '../../src/data/content.js';
import { newRunState } from '../../src/systems/RunController.js';
import { permStats } from '../../src/systems/Progression.js';
import { defaultSave } from '../../src/systems/SaveService.js';
import { resolveVolley, buildShots } from '../../src/systems/CombatResolver.js';
import { resolveContacts, enemyAction } from '../../src/systems/EnemyDirector.js';
import { ladleParams } from '../../src/systems/Abilities.js';
import { ENEMIES } from '../../src/data/content.js';
import { Rng } from '../../src/core/rng.js';
import { PotPhysics } from '../../src/systems/PotPhysics.js';
import { LadleController } from '../../src/systems/LadleController.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CH1 = CHAPTERS[0];

function run0(abilities = {}) {
  const r = newRunState({ chapter: CH1, perm: permStats(defaultSave()), seed: 7, runId: 'bench' });
  r.abilities = { ...abilities };
  return r;
}
function enemy(run, type, x, y, hp) {
  const def = ENEMIES[type];
  const e = { id: run.nextEnemyId++, type, x, y, hp: hp ?? def.hp, maxHp: hp ?? def.hp, shield: def.shield, maxShield: def.shield, moveOpp: 0, dead: false, escaped: false, counted: false, boss: !!def.boss, guard: false, guardWarn: false, actionCount: 0, summoned: false, hasted: false, frozen: false, lastFrozenAction: null };
  run.enemies.push(e);
  return e;
}
const SCEN = {
  single: (r) => enemy(r, 'tomato', 0.6, 0.5, 60),
  boss: (r) => enemy(r, 'giant_tomato', 0.7, 0.5, 60),
  crowd: (r) => [0.25, 0.4, 0.55, 0.7, 0.85].forEach((y, i) => enemy(r, 'tomato', 0.5 + (i % 2) * 0.06, y, 6)),
  weakCrowd: (r) => [0.25, 0.4, 0.55, 0.7, 0.85].forEach((y, i) => enemy(r, 'egg', 0.5 + (i % 2) * 0.06, y, 3)),
};
const CATCH = [{ id: 1, type: 'normal' }, { id: 2, type: 'normal' }, { id: 3, type: 'normal' }, { id: 4, type: 'big' }, { id: 5, type: 'normal' }, { id: 6, type: 'normal' }];
// with Soğuk Sos one of the six caught balls is a cold ball (the card only changes what is in the pot)
const CATCH_COLD = [...CATCH.slice(0, 5), { id: 6, type: 'cold' }];

// damage dealt (HP + shield removed) and kills over 4 volleys; enemies also take their move phase
function combat(abilities, scen, volleys = scen.includes('rowd') ? 1 : 4) {
  const run = run0(abilities);
  SCEN[scen](run);
  const before = run.enemies.reduce((a, e) => a + e.hp + e.shield, 0);
  const rng = new Rng(3);
  let heals = 0;
  run.chef.hp = 3;
  for (let v = 0; v < volleys; v++) {
    const res = resolveVolley(run, CH1, buildShots(run, abilities.cold_oil ? CATCH_COLD : CATCH));
    heals += res.events.filter((e) => e.type === 'heal').reduce((a, e) => a + e.amount, 0);
    if (res.victory) break;
    enemyAction(run, rng);
    for (const e of run.enemies) if (e.x < 0.3 && !e.boss) e.x = 0.3; // keep the bench about damage, not contact
  }
  const after = run.enemies.reduce((a, e) => a + e.hp + e.shield, 0);
    const alive = run.enemies.filter((e) => !e.dead);
  const avgX = alive.length ? alive.reduce((a, e) => a + e.x, 0) / alive.length : null;
  return { dmg: before - after, kills: run.enemies.filter((e) => e.dead).length, heals, avgX };
}

// chef HP left after 4 turns with one 2-HP tomato touching per turn; healthy (5/5) and injured (2/5) start
function defense(abilities, injured) {
  const run = run0({});
  for (const [id, n] of Object.entries(abilities)) {
    for (let i = 0; i < n; i++) {
      run.abilities[id] = (run.abilities[id] || 0) + 1;
      if (id === 'thick_apron') { run.chef.maxHp++; run.chef.hp++; }
      if (id === 'salt_shield') run.chef.saltCharges++;
    }
  }
  if (injured) run.chef.hp = 2;
  if (abilities.first_aid) run.chef.hp = Math.min(run.chef.maxHp, run.chef.hp + 2);
  const start = run.chef.hp;
  let cooked = 0;
  let survived = 0;
  for (let t = 0; t < 4 && run.chef.hp > 0; t++) {
    enemy(run, 'tomato', 0.2, 0.5, 2);
    resolveContacts(run, CH1);
    cooked = run.enemies.filter((e) => e.dead).length;
    if (run.chef.hp > 0) survived++;
  }
  return { hpLeft: run.chef.hp, start, cooked, survived };
}

// physical catch with the ladle parameters a run would have (warm pot, 9 positions, sigma 4 steps)
function catchLoad(abilities) {
  const r = run0(abilities);
  const params = ladleParams(r);
  const T = (params.period * 1000) / (1000 / 60);
  let sum = 0;
  let n = 0;
  let bestSum = 0;
  for (let s = 1; s <= 12; s++) {
    const pot = new PotPhysics(new Rng(500 + s));
    pot.fillInitial(POT.startCount, CH1.bigOilRate);
    pot.settle(60);
    const snap = pot.serialize();
    const noise = new Rng(s);
    const perPos = [];
    for (let i = 0; i < 9; i++) {
      const p2 = new PotPhysics(new Rng(500 + s));
      p2.restore(snap);
      const l = new LadleController(p2);
      l.configure(params);
      const x = l.centerX - l.amp + (2 * l.amp * i) / 8;
      const a = Math.asin(Math.max(-1, Math.min(1, (x - l.centerX) / l.amp)));
      const tc = [a / (2 * Math.PI) * T, (0.5 - a / (2 * Math.PI)) * T, (1 + a / (2 * Math.PI)) * T].filter((t) => t >= 10).sort((p, q) => p - q)[0];
      const g = Math.sqrt(-2 * Math.log(1 - noise.next())) * Math.cos(2 * Math.PI * noise.next());
      l.startSwing();
      const tap = Math.max(1, Math.round(tc + g * 4));
      for (let k = 0; k < tap; k++) l.step();
      l.drop();
      let guard = 0;
      while (l.step() !== 'CAUGHT' && guard++ < 500);
      const load = l.resolveCatch().load;
      perPos.push(load);
      sum += load;
      n++;
    }
    bestSum += perPos[4]; // centre pool = the usual best spot
  }
  return { mean: +(sum / n).toFixed(2), centre: +(bestSum / 12).toFixed(2) };
}

const maxed = (id) => ({ [id]: ABILITIES.find((a) => a.id === id).max });
const base = { single: combat({}, 'single'), boss: combat({}, 'boss'), crowd: combat({}, 'crowd'), weakCrowd: combat({}, 'weakCrowd') };
const baseDef = { healthy: defense({}, false), injured: defense({}, true) };
const baseCatch = catchLoad({});
const rows = [];
for (const a of ABILITIES) {
  const ab = maxed(a.id);
  const row = { id: a.id, name: a.name, cat: a.cat, level: a.max };
  if (a.cat === 'catch' && a.id !== 'pot_shuffle') {
    row.catchLoad = catchLoad(ab);
    row.catchDelta = `${(row.catchLoad.mean - baseCatch.mean).toFixed(2)} / ${(row.catchLoad.centre - baseCatch.centre).toFixed(2)}`;
  }
  for (const s of Object.keys(SCEN)) {
    const c = combat(ab, s);
    row[s] = c.dmg - base[s].dmg;
    row[`${s}Kills`] = c.kills - base[s].kills;
    if (c.heals) row.heals = (row.heals || 0) + c.heals;
    if (s === 'crowd' && c.avgX != null && base[s].avgX != null && Math.abs(c.avgX - base[s].avgX) > 1e-6) row.crowdPushback = +(c.avgX - base[s].avgX).toFixed(2);
  }
  const dh = defense(ab, false);
  const di = defense(ab, true);
  row.defHealthy = dh.hpLeft - baseDef.healthy.hpLeft;
  row.defInjured = di.survived - baseDef.injured.survived; // extra turns survived from 2/5 HP
  row.cookedOnContact = dh.cooked;
  rows.push(row);
}
writeFileSync(join(HERE, 'ability-bench.json'), JSON.stringify({ base, baseDef, baseCatch, rows }, null, 2));
console.log('Kalabalık senaryoları tek salvo; tek hedef/boss 4 salvo.');
console.log(`Temel: tek hedef ${base.single.dmg} hasar, boss ${base.boss.dmg}, kalabalık ${base.crowd.dmg} (${base.crowd.kills} öldürme), zayıf kalabalık ${base.weakCrowd.dmg} (${base.weakCrowd.kills}); yakalama yükü (9 konum ort. / orta havuz) ${baseCatch.mean} / ${baseCatch.centre}`);
console.log('| Kart | Sv | Tek hedef +hasar | Boss +hasar | Kalabalık +hasar / +öldürme | Zayıf kalabalık +öldürme | Sağlıklı Şef +can (4 temas sonrası) | Yaralı Şef +tur hayatta | Yakalama yükü Δ (ort. / orta) | Not |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');
for (const r of rows) {
  const note = [r.heals ? `+${r.heals} can (salvo)` : '', r.crowdPushback ? `kalan düşmanlar ort. ${r.crowdPushback > 0 ? '+' : ''}${r.crowdPushback} x (${r.crowdPushback > 0 ? 'daha geride' : 'daha yakın'})` : '', r.cookedOnContact ? `${r.cookedOnContact} düşman temasla pişti` : ''].filter(Boolean).join('; ');
  console.log(`| ${r.name} | ${r.level} | ${r.single} | ${r.boss} | ${r.crowd} / ${r.crowdKills} | ${r.weakCrowdKills} | ${r.defHealthy} | ${r.defInjured} | ${r.catchDelta ?? '—'} | ${note} |`);
}
