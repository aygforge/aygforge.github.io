// Kadraj testi: tüm düğümlerin tüm seçeneklerinde, sahne sırasında kahraman ve görünür aktörlerin HUD ile alt panel arasındaki güvenli alanda kalıp kalmadığını ölçer.
import { makeEnv, tick, PH } from './harness.mjs';
import { STANDALONE, CHAIN_STAGES } from '../src/data/index.js';
import { ITEMS } from '../src/data/items.js';
const NODES = [...STANDALONE, ...CHAIN_STAGES];
let frames = 0, bad = 0; const worst = {}, kinds = {};
function check(env, id) {
  const w = env.world, d = env.director;
  if (!w.autoCam) return;
  const panel = d.combatOn ? 197 : (d.phase === PH.DECISION || (d.phase === PH.OUTCOME && d.outcomeShown)) ? 163 : 238;
  const bot = panel + 2;
  for (const e of [w.hero, ...w.entities]) {
    if (e !== w.hero && (e.flee || e.dead || e.prop || (e.alpha != null && e.alpha < 0.3) || Math.abs(e.x) > 190 || e.y < -150)) continue;
    const top = w.toScreen(e.x, e.y - 18).y, feet = w.toScreen(e.x, e.y).y;
    frames++;
    if (top < 26 || feet > bot) { bad++; worst[id] = (worst[id] || 0) + 1; const k = (top < 26 ? 'top' : 'bot') + ':' + d.phase + (e === w.hero ? ':hero' : ':' + e.kind); kinds[k] = (kinds[k] || 0) + 1; }
  }
}
for (const ev of NODES) for (const opt of ev.opts) {
  const env = makeEnv(), g = env.game; g.newRun('FR-' + ev.id + opt.k); const r = g.run;
  r.gold = 999; r.hero.baseAtk = 60; r.hero.baseHp = 400; r.hero.hp = 400; r.hero.baseDef = 30;
  const q = opt.req || {};
  for (const it of [].concat(q.item || [], opt.consume || [])) r.bag.push({ id: it, n: 1 });
  if (q.opens) { const m = { wolf: 'X_WOLF', holy: 'X_HOLY', royal: 'X_BROOCH', mystic: 'X_EYE', stealth: 'A_LIGHT_3', chop: 'W_AXE_1', stone: 'W_AXE_3', dawn: 'W_SWORD_3' }; const it = ITEMS[m[q.opens]]; r.equip[it.slot] = it.id; }
  if (q.wfam) r.equip.weapon = { sword: 'W_SWORD_1', axe: 'W_AXE_1', spear: 'W_SPEAR_1' }[q.wfam];
  for (const f of [].concat(q.flag || [])) r.flags[f] = 1; if (q.qitem) r.qitems[q.qitem] = 1;
  if (ev.chain) { r.chains[ev.chain] = { status: 'active', stage: ev.stage, flags: {} }; for (const f of [].concat(q.cf || [], q.cfAll || [])) r.chains[ev.chain].flags[f] = 1; }
  if (ev.where === 'town') { r.arrival = { townId: g.town().id, report: [], queue: [{ id: ev.id }], pos: 0, current: null }; r.phase = 'arrival'; r.visit = null; env.director.inArrival = true; env.director.playArrival(); }
  else { g.depart(0); r.voyage.queue = [{ id: ev.id }]; env.director.enterVoyage(); env.director.nextAt = 0; }
  const id = ev.id + '.' + opt.k, samp = () => { check(env, id); return false; };
  const run = (sec, until) => { for (let t = 0; t < sec; t += 0.1) { tick(env, 0.1); if (t > 0.8) check(env, id); if (until()) return; } };
  run(30, () => env.director.phase === PH.DECISION);
  const res = env.director.choose(opt.k);
  if (res.combat) { tick(env, 10, () => env.director.combatOn); let n = 0; while (env.director.combatOn && n++ < 40) { env.director.combatAction({ type: 'attack' }); run(10, () => !env.director.busy); } }
  run(60, () => env.director.phase === PH.OUTCOME && !env.director.steps.length && env.director.stepDur < 0);
}
const list = Object.entries(worst).sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify({ frames, outOfFrame: bad, pct: +(100 * bad / frames).toFixed(2), optionsWithIssues: list.length, top: list.slice(0, 8), kinds: Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 15) }));
