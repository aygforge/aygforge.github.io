// Hedefli akış testleri: tam run (başkente kadar), Kraliyet Sınavı, Sonsuz Macera, ölüm + XP aktarımı, emeklilik,
// savaş ortasında kaydet/yükle, zincir aşamalarının tamamlanması, çanta taşması ve determinizm.
import { makeEnv, tick, PH, memoryStorage } from './harness.mjs';
import { EVENTS, CHAINS } from '../src/data/index.js';
import { ITEMS } from '../src/data/items.js';
import { heroStats } from '../src/core/state.js';
import assert from 'node:assert/strict';

const results = [];
const ok = (name, extra = '') => { results.push({ name, ok: true, extra }); console.log('✔', name, extra); };
const fail = (name, e) => { results.push({ name, ok: false, extra: e.message }); console.log('✘', name, e.message); process.exitCode = 1; };
const test = (name, fn) => { try { const x = fn(); ok(name, x || ''); } catch (e) { fail(name, e); } };

// Basit oyuncu yapay zekâsı: en yüksek şanslı/uygun seçeneği seçer, savaşta odak dolunca özel saldırı kullanır, düşük HP'de iksir.
function autoplay(env, { maxSec = 7200, strong = false, endlessTowns = 0, pick = 'best', onTown = null } = {}) {
  const { game: g, director: d } = env; let simSec = 0; const step = 1 / 20;
  const stats = { events: 0, combats: 0, towns: 0, chainStages: 0, trial: false };
  if (strong) { const r = g.run; r.hero.baseHp = 260; r.hero.hp = 260; r.hero.baseAtk = 30; r.hero.baseDef = 14; }
  let guard = 0;
  while (simSec < maxSec && guard++ < 400000) {
    const r = g.run;
    if (!r || r.ended) break;
    if (d.phase === PH.DOCKED || (r.phase === 'town' && d.phase !== PH.DOCKING)) {
      stats.towns++;
      while (r.overflow.length) g.overflowDiscard(0);
      const st = heroStats(g.G);
      if (r.hero.hp < st.maxHp * 0.8) { g.heal(); g.rest(); }
      // eşya al: iksir
      if (r.gold > 60 && r.visit && r.visit.stock.market.includes('C_POTION')) g.buy('C_POTION');
      // daha iyi silah/zırh
      if (r.visit) for (const id of r.visit.stock.smith) { const it = ITEMS[id], cur = ITEMS[r.equip[it.slot]]; if ((it.atk || 0) + (it.def || 0) > ((cur && (cur.atk || 0) + (cur.def || 0)) || 0) && g.priceBuy(id) < r.gold - 20) { if (g.buy(id).ok) { const i = r.bag.findIndex((b) => b.id === id); if (i >= 0) g.equip(i); } } }
      if (r.visit && r.visit.contracts.length && r.contracts.filter((c) => !c.done && !c.failed).length < 2) g.acceptContract(0);
      if (onTown) onTown(env, stats);
      const town = g.town();
      if (town.type === 'capital' && !r.capitalWon && !r.endless) {
        stats.trial = true; g.startTrial(); d.inArrival = true; d.playArrival();
      } else if (r.capitalWon && !r.endless) {
        if (endlessTowns > 0) { g.enterEndless(); } else { g.completeRun(); break; }
      } else if (r.endless && endlessTowns > 0 && r.stats.towns >= endlessTowns) { g.retire(); break; }
      else { if (!g.depart(0).ok) throw new Error('ayrılamadı'); d.enterVoyage(); }
      continue;
    }
    if (d.phase === PH.DECISION) {
      const ev = EVENTS[d.eventId]; stats.events++; if (ev.chain) stats.chainStages++;
      const opts = g.options(ev).filter((o) => o.view.available);
      let choice;
      if (pick === 'first') choice = opts[0];
      else if (pick === 'chainFollow' && ev.chain) choice = opts.find((o) => !o.opt.ch) || opts[0];
      else choice = opts.slice().sort((a, b) => (b.view.chance == null ? (b.opt.fight ? 60 : 80) : b.view.chance) - (a.view.chance == null ? (a.opt.fight ? 60 : 80) : a.view.chance))[0];
      const res = d.choose(choice.opt.k); if (!res.ok) throw new Error('seçim: ' + res.reason + ' ' + ev.id);
      if (res.combat) stats.combats++;
    } else if (d.combatOn && !d.busy) {
      const cb = g.host().current.combat, st = heroStats(g.G);
      let a = { type: cb.focus >= 2 ? 'special' : 'attack' };
      if (g.run.hero.hp < st.maxHp * 0.3 && g.run.quick.length) a = { type: 'item', item: g.run.quick[0] };
      const r2 = d.combatAction(a); if (!r2.ok) d.combatAction({ type: 'attack' });
    } else if (d.phase === PH.OUTCOME && !d.steps.length && d.stepDur < 0 && !d.after) {
      while (g.run.overflow.length) g.overflowDiscard(0);
      d.continueAfter();
    }
    d.update(step); env.world.update(step); simSec += step;
  }
  stats.simSec = Math.round(simSec);
  return stats;
}

test('Yeni oyun ve kasaba hizmetleri', () => {
  const env = makeEnv(); const g = env.game; g.newRun('SVC'); const r = g.run;
  assert.equal(r.phase, 'town'); assert.ok(r.visit.lanes.length >= 2 && r.visit.lanes.length <= 3);
  r.gold = 500; const id = r.visit.stock.smith[0]; assert.ok(g.buy(id).ok, 'demirci alım');
  const i = r.bag.findIndex((b) => b.id === id); if (i >= 0) assert.ok(g.equip(i).ok, 'kuşanma');
  r.hero.hp = 20; assert.ok(g.rest().ok, 'han'); assert.ok(r.hero.hp > 20);
  assert.ok(g.heal().ok, 'şifacı'); assert.equal(r.hero.hp, heroStats(g.G).maxHp);
  assert.ok(g.acceptContract(0).ok, 'görev alma');
  const s = g.sell(0); assert.ok(s.ok, 'satış');
  // al-sat açığı yok: satış fiyatı alış fiyatından düşük
  for (const k of Object.keys(ITEMS)) if (ITEMS[k].price) assert.ok(g.priceSell(k) < g.priceBuy(k), 'arbitraj ' + k);
  return `stok ${r.visit.stock.smith.length}+${r.visit.stock.market.length}`;
});

test('Çanta taşması: eşya silinmez, seçim beklenir', () => {
  const env = makeEnv(); const g = env.game; g.newRun('BAG'); const r = g.run;
  r.bag = []; for (let i = 0; i < 8; i++) r.bag.push({ id: 'C_LOCKPICK', n: 3 });
  g.applyFx({ item: 'W_AXE_2' }, { ev: EVENTS.EV_D01, opt: {}, success: true }, null);
  assert.equal(r.overflow.length, 1); assert.ok(!g.depart(0).ok, 'taşma varken yola çıkılamaz');
  assert.ok(g.overflowTake(0, 2).ok); assert.ok(r.bag.some((b) => b.id === 'W_AXE_2')); assert.equal(r.overflow.length, 0);
});

test('Tam normal run: başkente varış + Kraliyet Sınavı + Macerayı Tamamla (güçlü kahraman)', () => {
  const env = makeEnv(); env.game.newRun('FULLRUN1');
  const s = autoplay(env, { strong: true });
  const r = env.game.run; assert.ok(r.ended, 'run bitmeli'); assert.equal(r.ended.reason, 'complete'); assert.ok(r.capitalWon); assert.ok(s.trial);
  assert.ok(r.stats.towns >= 8 && r.stats.towns <= 9, 'yerleşim sayısı ' + r.stats.towns);
  assert.ok(r.xpBanked && env.game.meta.xp === r.xp, 'XP bir kez aktarılmalı');
  return `yerleşim ${r.stats.towns}, olay ${s.events}, savaş ${s.combats}, zincir aşaması ${s.chainStages}, oyun süresi ~${Math.round(s.simSec / 60)} dk (atlama/hızlandırma olmadan)`;
});

test('Normal istatistikli 6 run (gerçekçi denge örneklemi)', () => {
  const out = [];
  for (const seed of ['BAL1', 'BAL2', 'BAL3', 'BAL4', 'BAL5', 'BAL6']) {
    const env = makeEnv(); env.game.newRun(seed);
    const s = autoplay(env, {});
    const r = env.game.run;
    out.push(`${seed}:${r.ended ? r.ended.reason : 'devam'}/${r.stats.towns}y/${Math.round(s.simSec / 60)}dk/${r.xp}xp`);
    assert.ok(r.ended, 'run sonlanmalı');
    assert.equal(env.game.meta.xp, r.xp, 'XP aktarımı tek sefer');
  }
  return out.join(' ');
});

test('Ölüm: run biter, XP korunur ve yalnızca bir kez aktarılır', () => {
  const env = makeEnv(); const g = env.game; g.newRun('DEATH'); g.run.xp = 77;
  g.depart(0); g.run.voyage.queue = [{ id: 'EV_D09', src: 'test' }]; env.director.enterVoyage(); env.director.nextAt = 0;
  tick(env, 30, () => env.director.phase === PH.DECISION);
  g.run.hero.hp = 1;
  const r = env.director.choose('fight'); assert.ok(r.combat);
  tick(env, 10, () => env.director.combatOn);
  let n = 0; while (env.director.combatOn && n++ < 30) { env.director.combatAction({ type: 'attack' }); tick(env, 10, () => !env.director.busy); }
  tick(env, 30, () => env.director.phase === PH.OUTCOME && !env.director.steps.length);
  assert.ok(g.host().current.result.dead, 'ölüm sonucu'); env.director.continueAfter();
  assert.equal(g.run.ended.reason, 'dead'); const xp = g.meta.xp; assert.ok(xp >= 77);
  g._endRun('dead'); assert.equal(g.meta.xp, xp, 'ikinci aktarım olmamalı'); assert.equal(env.log.ended, 1);
  const env2 = makeEnv(env.storage); assert.equal(env2.game.meta.xp, xp, 'kayıtta XP');
  return `kalıcı XP ${xp}`;
});

test('Savaş ortasında kaydet/yükle: çift ödül ve sonsuz savaş yok', () => {
  const env = makeEnv(); const g = env.game; g.newRun('MIDSAVE'); const r = g.run; r.hero.baseAtk = 14;
  g.depart(0); r.voyage.queue = [{ id: 'EV_D01', src: 'test' }]; env.director.enterVoyage(); env.director.nextAt = 0;
  tick(env, 30, () => env.director.phase === PH.DECISION);
  env.director.choose('fight'); tick(env, 10, () => env.director.combatOn);
  env.director.combatAction({ type: 'attack' }); tick(env, 10, () => !env.director.busy);
  const env2 = makeEnv(env.storage); const g2 = env2.game;
  assert.ok(g2.run.voyage.current.combat && !g2.run.voyage.current.result, 'savaş kayıtta sürüyor');
  env2.director.enterVoyage(true); assert.ok(env2.director.combatOn, 'savaş geri yüklendi');
  const foesBefore = g2.run.voyage.current.combat.foes.map((f) => f.hp).join();
  let n = 0; while (env2.director.combatOn && n++ < 40) { env2.director.combatAction({ type: 'attack' }); tick(env2, 10, () => !env2.director.busy); }
  assert.ok(!env2.director.combatOn, 'savaş bitti');
  const res = g2.run.voyage.current.result; assert.ok(res, 'sonuç tek kez'); const gold = g2.run.gold;
  assert.equal(g2.combatAction({ type: 'attack' }).ok, false, 'sonuçtan sonra savaş eylemi reddedilir');
  assert.equal(g2.choose('pay').ok, false, 'çözülmüş olay yeniden seçilemez');
  const env3 = makeEnv(env2.storage); assert.equal(env3.game.run.gold, gold, 'yeniden yüklemede altın aynı');
  return `düşman HP (yükleme anı): ${foesBefore}`;
});

test('Hikâye zinciri tüm aşamalarıyla tamamlanır (CH01, CH04, CH18) ve ödül tek kez', () => {
  const out = [];
  for (const cid of ['CH01', 'CH04', 'CH18']) {
    const env = makeEnv(); const g = env.game; g.newRun('CHAIN' + cid); const r = g.run; r.hero.baseHp = 400; r.hero.hp = 400; r.hero.baseAtk = 50; r.gold = 500;
    r.bag.push({ id: 'C_POTION', n: 3 }, { id: 'C_BANDAGE', n: 3 });
    r.pendingRoute.push({ id: CHAINS[cid].stages[0], src: 'test' });
    let guard = 0;
    while (!(r.chains[cid] && r.chains[cid].status !== 'active') && guard++ < 12) {
      const s = autoplay(env, { maxSec: 900, pick: 'chainFollow', onTown: (e, st) => { if (st.towns > 1 && !r.pendingRoute.length && !r.pendingArrival.length && r.chains[cid] && r.chains[cid].status === 'active') { /* sıradaki aşama zaten kuyrukta */ } } });
      if (r.ended) break;
    }
    assert.ok(r.chains[cid], 'zincir başladı'); assert.equal(r.chains[cid].status, 'done', cid + ' durum ' + r.chains[cid].status + ' aşama ' + r.chains[cid].stage);
    assert.ok(r.chains[cid].rewarded); out.push(`${cid}:${r.chains[cid].stage}/${CHAINS[cid].stages.length}`);
  }
  return out.join(' ');
});

test('Sonsuz Macera: aşama her 4 yerleşimde artar, koşul atanır, rekor tutulur', () => {
  const env = makeEnv(); const g = env.game; g.newRun('ENDLESS');
  const s = autoplay(env, { strong: true, endlessTowns: 18 });
  const r = g.run; assert.ok(r.endless, 'sonsuz mod'); assert.ok(r.endless.stage >= 2, 'aşama ' + r.endless.stage); assert.ok(r.endless.cond);
  assert.ok(g.meta.records.maxEndless >= 2); assert.ok(r.ended && r.ended.reason === 'endless_retire');
  return `yerleşim ${r.stats.towns}, aşama ${r.endless.stage}, koşul ${r.endless.cond}`;
});

test('Determinizm: aynı seed + aynı kararlar = aynı mekanik sonuç', () => {
  const run = () => { const env = makeEnv(); env.game.newRun('DET42'); const s = autoplay(env, { strong: true, maxSec: 1500 }); const r = env.game.run; return JSON.stringify([r.gold, r.xp, r.hero.hp, r.stats, r.recent]); };
  assert.equal(run(), run());
});

test('Gönüllü emeklilik: XP aktarılır, başkent ödülü yok', () => {
  const env = makeEnv(); const g = env.game; g.newRun('RET'); g.run.xp = 33; assert.ok(g.retire().ok); assert.equal(g.run.ended.reason, 'retire'); assert.equal(g.meta.xp, 33); assert.equal(g.meta.wins, 0);
});

test('Kalıcı gelişim: sıralı açılır, maliyet düşer, yeni run\'a etki eder', () => {
  const env = makeEnv(); const g = env.game; g.meta.xp = 1000;
  assert.equal(g.buyUpgrade('U_STANCE').ok, false, 'sıra dışı açılamaz');
  assert.ok(g.buyUpgrade('U_SHARP').ok); assert.ok(g.buyUpgrade('U_TOUGH').ok); assert.ok(g.buyUpgrade('U_PURSE').ok);
  g.newRun('META'); const st = heroStats(g.G); assert.equal(st.maxHp, 105); assert.equal(g.run.gold, 80); assert.equal(g.run.hero.baseAtk, 13);
});

test('Kayıt dışa/içe aktarma ve bozuk kayıt kurtarma', () => {
  const st = memoryStorage(); const env = makeEnv(st); env.game.newRun('EXP'); env.game.persist(); const s = env.game.exportSave(); assert.ok(s.startsWith('BOF1:'));
  const env2 = makeEnv(); assert.ok(env2.game.importSave(s).ok); assert.equal(env2.game.run.seed, 'EXP');
  st.setItem('bof.run', '{bozuk json'); const env3 = makeEnv(st); assert.ok(env3.game.run && env3.game.run.seed === 'EXP', '.bak yedeğinden kurtarma');
  assert.equal(makeEnv().game.importSave('TOF1:xxx').ok, false);
});

import('node:fs').then((fs) => fs.writeFileSync(new URL('./sim-report.json', import.meta.url), JSON.stringify(results, null, 1)));
