// Genişleme Paketi 3 — Efsanevi Denizler ve Rakip Kaptanlar kabul testleri (node:test)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBot, newCore } from '../tools/bot.mjs';
import * as X1 from '../src/systems/X1System.js';
import * as X3 from '../src/systems/X3System.js';
import * as Events from '../src/systems/EventSystem.js';
import { EVENT_BY_ID, CHAINS, ALL_EVENTS } from '../src/data/events.js';
import { X3_STANDALONE } from '../src/data/events_x3.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { memoryStorage } from '../src/core/SaveManager.js';
import { GameCore } from '../src/core/GameCore.js';
import { SeededRNG } from '../src/core/SeededRNG.js';
import { SAVE_VERSION } from '../src/config/balance.js';

const CHAIN_IDS = ['CH_X3_COUNCIL', 'CH_X3_ARMADA', 'CH_X3_ATLAS', 'CH_X3_FLAGS'];
const deps = { addXp: (G, n) => { G.run.xp.total += n; return n; }, unlockAchievement: (G, id) => { if (!G.meta.achievements.includes(id)) G.meta.achievements.push(id); } };

/** Limandan ayrılıp kuyruğun başına belirli bir olayı koyar ve tetikler */
function startAt(core, evId, prep = () => {}) {
  if (!core.run) core.newRun('X3T' + evId);
  let g = 0;
  while (core.run.phase === 'arrival' && g++ < 10) { const a = core.run.arrival; if (a.current && !a.current.result) core.choose('o0'); else core.arrivalNext(); }
  const run = core.run;
  run.gold = 2000;
  prep(run);
  core.depart(0);
  const v = core.run.voyage;
  const ev = EVENT_BY_ID[evId];
  v.queue[v.pos] = { id: evId, src: 'test' };
  if (ev.chain) core.run.chains[ev.chain] = core.run.chains[ev.chain] || { status: 'active', flags: {}, step: ev.step || 1 };
  const r = core.nextEvent();
  assert.ok(r.ok, `${evId} tetiklenemedi: ${r.reason}`);
  return core;
}
/** Seçeneğin gereksinimlerini karşıla (test kurulumu) */
function satisfy(core, ev, opt) {
  const run = core.run;
  const need = (c) => { if (c && !run.crew.includes(c)) run.crew.push(c); };
  if (ev.cond?.crew) need(ev.cond.crew);
  for (const p of [ev.cond?.pet, ...(ev.cond?.pets || [])]) if (p && !run.pets.includes(p)) run.pets.push(p);
  const r = opt.req || {};
  need(r.crew);
  if (r.crewAny) need(r.crewAny[0]);
  if (opt.show?.crew) need(opt.show.crew);
  if (opt.show?.crewAny) need(opt.show.crewAny[0]);
  if (r.item && !run.items.some((i) => i.id === r.item)) run.items.push({ id: r.item, uid: r.item + '#t' });
  if (r.cargoGoods) run.cargo.push({ id: run.lotSeq++, good: r.cargoGoods[0], qty: 2, cost: 10 });
  if (r.cargoGood) run.cargo.push({ id: run.lotSeq++, good: r.cargoGood, qty: 2, cost: 10 });
  const x = r.x3;
  if (x?.repOr) run.x1.rep[x.repOr.faction] = x.repOr.min;
  if (x?.anyOf?.items) run.items.push({ id: x.anyOf.items[0], uid: 't#map' });
  if (x?.relAtLeast) { run.x3.captains.liora.rep = 1; run.x3.captains.boran.rep = 1; }
  if (x?.capSeen) run.x3.captains[x.capSeen].seen = 1;
  if (opt.show?.x3?.capSeen) run.x3.captains[opt.show.x3.capSeen].seen = 1;
  if (opt.show?.upgrade && !core.meta.upgrades.includes(opt.show.upgrade)) core.meta.upgrades.push(opt.show.upgrade);
  if (opt.show?.any) core.meta.upgrades.push(opt.show.any[0].upgrade);
  if (ev.x3pursuit) run.x3.pursuit = 'boran';
  run.ship.level = 3;
}
function chainFlagsFor(core, ev, opt) {
  const cs = core.run.chains[ev.chain];
  if (!cs) return;
  const r = opt.req?.x3 || {};
  if (r.minFlags) for (const f of r.minFlags.of.slice(0, r.minFlags.n)) cs.flags[f] = true;
  if (opt.show?.anyFlag) cs.flags[opt.show.anyFlag[0]] = true;
}

test('İçerik sayıları: 25 olay (danger 6 / fortune 8 / mystery 6 / disaster 4 / repair 1), 3 efsane, 4 zincir / 15 aşama / 12 final', () => {
  assert.equal(X3_STANDALONE.length, 25);
  const cnt = (c) => X3_STANDALONE.filter((id) => EVENT_BY_ID[id].cat === c).length;
  assert.deepEqual([cnt('danger'), cnt('fortune'), cnt('mystery'), cnt('disaster'), cnt('repair')], [6, 8, 6, 4, 1]);
  assert.deepEqual(X3_STANDALONE.filter((id) => EVENT_BY_ID[id].legend), ['EVT_X3_L01', 'EVT_X3_L03', 'EVT_X3_L02']);
  const stages = ALL_EVENTS.filter((e) => /^CH_X3_/.test(e.id));
  assert.equal(stages.length, 15);
  for (const c of CHAIN_IDS) { assert.ok(CHAINS[c] && !CHAINS[c].personal && !CHAINS[c].needCrew); assert.equal(CHAINS[c].finals.length, 3); }
  assert.equal(CHAIN_IDS.reduce((s, c) => s + CHAINS[c].steps, 0), 15);
  assert.equal(ALL_EVENTS.filter((e) => /^EVT_X3_ECHO_/.test(e.id)).length, 4);
  const up = UPGRADES.filter((u) => u.id.startsWith('UPG_X3_'));
  assert.equal(up.length, 8);
  assert.equal(up.reduce((s, u) => s + u.cost, 0), 4370);
  assert.equal(UPGRADES.length, 52);
  assert.equal(ACHIEVEMENTS.filter((a) => a.id.startsWith('ACH_X3_')).length, 10);
  assert.equal(SAVE_VERSION, 7);
});

test('25 olayın ve 15 zincir aşamasının her seçeneği çözülebilir; ikinci seçim sonucu değiştirmez', () => {
  const ids = [...X3_STANDALONE, ...ALL_EVENTS.filter((e) => /^CH_X3_/.test(e.id)).map((e) => e.id), 'EVT_X3_PURSUIT', 'EVT_X3_EPILOGUE'];
  let resolved = 0;
  for (const id of ids) {
    const ev = EVENT_BY_ID[id];
    ev.options.forEach((opt, i) => {
      const core = newCore();
      core.newRun('X3O' + id + i);
      startAt(core, id, () => satisfy(core, ev, opt));
      chainFlagsFor(core, ev, opt);
      const host = core.host();
      const r = core.choose(`o${i}`);
      assert.ok(r.ok, `${id} o${i}: ${r.reason}`);
      const res = host.current.result;
      assert.ok(res && res.text.length > 5, `${id} o${i} sonuç metni`);
      const g = core.run.gold, h = core.run.ship.hull, xp = core.run.xp.total;
      assert.equal(core.choose(`o${i}`).ok, false);
      assert.equal(core.run.gold, g); assert.equal(core.run.ship.hull, h); assert.equal(core.run.xp.total, xp);
      resolved++;
    });
  }
  const expected = ids.reduce((n, id) => n + EVENT_BY_ID[id].options.length, 0);
  assert.equal(resolved, expected);
  assert.ok(resolved >= 120, `çözülen seçenek ${resolved}`);
});

test('Her X3 olayında koşulsuz seçilebilen en az bir seçenek var (altın 0, ambar dolu, tayfa/hayvan yok)', () => {
  for (const ev of ALL_EVENTS.filter((e) => /^(EVT|CH)_X3_/.test(e.id))) {
    const free = ev.options.filter((o) => !o.req && !o.cost && !(o.show && (o.show.crew || o.show.crewAny || o.show.upgrade || o.show.any || o.show.x3 || o.show.anyFlag)));
    assert.ok(free.length >= 1, `${ev.id}: koşulsuz seçenek yok`);
  }
  // uç durum: gövde 1, altın 0, ambar dolu, en küçük gemi — olay yine çözülür
  const core = newCore();
  core.newRun('X3EDGE');
  startAt(core, 'EVT_X3_DIS01', (run) => { run.gold = 0; run.ship.hull = 1; run.ship.level = 1; run.crew = []; run.pets = []; });
  const opts = Events.getOptions(core.G, core.host());
  const pass = opts.find((o) => o.view.available && (o.opt.tags || []).includes('pass'));
  assert.ok(pass, 'güvenli seçenek var');
  assert.ok(core.choose(pass.key).ok);
});

test('Kaptan ilişkisi −2..+2 sınırında; Tayfa Elçisi yanlış anlaşılmayı run başına bir kez önler; İki Müttefik başarımı', () => {
  const core = newCore();
  core.newRun('X3REL');
  const G = core.G;
  for (let i = 0; i < 6; i++) X3.changeRel(G, 'neris', 1, [], { deps });
  assert.equal(X3.rel(core.run, 'neris'), 2);
  for (let i = 0; i < 9; i++) X3.changeRel(G, 'boran', -1, [], { deps });
  assert.equal(X3.rel(core.run, 'boran'), -2);
  // Elçi: yalnızca soft (yanlış anlaşılma) düşüşte ve bir kez
  core.meta.upgrades.push('UPG_X3_CREW_LIAISON');
  const lines = [];
  X3.changeRel(G, 'liora', -1, lines, { soft: true, deps });
  assert.equal(X3.rel(core.run, 'liora'), 0);
  X3.changeRel(G, 'liora', -1, lines, { soft: true, deps });
  assert.equal(X3.rel(core.run, 'liora'), -1);
  X3.changeRel(G, 'liora', -1, lines, { deps }); // saldırı/hile: hiç önlenmez
  assert.equal(X3.rel(core.run, 'liora'), -2);
  assert.ok(!core.meta.achievements.includes('ACH_X3_TWO_ALLIES'));
  X3.changeRel(G, 'liora', 4, [], { deps });
  assert.ok(core.meta.achievements.includes('ACH_X3_TWO_ALLIES'));
  // ilişki run'a ait: yeni run sıfırdan, Codex tanışıklığı korur
  core.run.ended = true; core.newRun('X3REL2');
  assert.equal(X3.rel(core.run, 'neris'), 0);
  assert.ok(core.meta.x3.captainHistory.neris.met && core.meta.x3.captainHistory.neris.best === 2);
});

test('Kaptan karşılaşması: aynı kaptan bir seferde tek slot; son görüldüğü limandan 2 liman bekler', () => {
  const core = newCore();
  core.newRun('X3CD');
  const G = core.G;
  const d05 = EVENT_BY_ID.EVT_X3_D05; // Neris
  const m01 = EVENT_BY_ID.EVT_X3_M01; // Neris
  const f04 = EVENT_BY_ID.EVT_X3_F04; // Liora + Boran
  assert.ok(X3.eligible(G, d05, new Set(), EVENT_BY_ID));
  assert.equal(X3.eligible(G, m01, new Set(['EVT_X3_D05']), EVENT_BY_ID), false, 'aynı seferde ikinci Neris yok');
  assert.ok(X3.eligible(G, f04, new Set(['EVT_X3_D05']), EVENT_BY_ID), 'farklı kaptan olabilir');
  core.run.stats.harborsReached = 5;
  X3.onTrigger(G, d05);
  assert.equal(X3.eligible(G, m01, new Set(), EVENT_BY_ID), false);
  core.run.stats.harborsReached = 6;
  assert.equal(X3.eligible(G, m01, new Set(), EVENT_BY_ID), false);
  core.run.stats.harborsReached = 7;
  assert.ok(X3.eligible(G, m01, new Set(), EVENT_BY_ID));
  // Sonsuz Deniz'de daha seyrek
  core.run.x1.endless.on = true;
  assert.ok(X3.weightMult(G, d05) < 1);
  assert.equal(X3.weightMult(G, EVENT_BY_ID.EVT_X3_D01), 1);
});

test('İlişki +1 ek konuşma, +2 bir kez güvenli işbirliği, −1 gergin (riskli seçime −5); −2 rakip takibi her zaman kaçış/uzlaşma/çatışma sunar', () => {
  const core = newCore();
  core.newRun('X3INJ');
  startAt(core, 'EVT_X3_D05', (run) => { run.x3.captains.neris.rep = 1; });
  let opts = Events.getOptions(core.G, core.host());
  assert.ok(opts.some((o) => o.key === '__x3talk_neris'));
  core.run.x3.captains.neris.rep = 2;
  opts = Events.getOptions(core.G, core.host());
  const ally = opts.find((o) => o.key === '__x3ally_neris');
  assert.ok(ally && ally.view.available && ally.view.chance == null);
  assert.ok(core.choose('__x3ally_neris').ok);
  assert.ok(core.run.x3.captains.neris.offerOnce);
  // ikinci karşılaşmada işbirliği yok (bir kez)
  const c2 = newCore(); c2.newRun('X3INJ2');
  startAt(c2, 'EVT_X3_D05', (run) => { run.x3.captains.neris.rep = 2; run.x3.captains.neris.offerOnce = true; });
  assert.ok(!Events.getOptions(c2.G, c2.host()).some((o) => o.key.startsWith('__x3ally')));
  // gergin: riskli seçime −5
  const c3 = newCore(); c3.newRun('X3INJ3');
  startAt(c3, 'EVT_X3_D05', (run) => { run.x3.captains.neris.rep = -1; });
  const o0 = Events.getOptions(c3.G, c3.host()).find((o) => o.key === 'o0');
  assert.ok(o0.view.breakdown.some((b) => b.label === 'Gergin ilişki' && b.v === -5));
  // takip: −2 olan kaptan seçilir, −1'de asla
  const c4 = newCore(); c4.newRun('X3PUR');
  c4.run.stats.harborsReached = 9;
  let got = 0;
  for (let i = 0; i < 60; i++) { c4.run.x3.captains.boran.hostileCooldown = 0; if (X3.pickPursuit(c4.G, new SeededRNG('p' + i), [], EVENT_BY_ID)) got++; }
  assert.equal(got, 0, '−2 olmadan takip yok');
  c4.run.x3.captains.boran.rep = -2;
  for (let i = 0; i < 60; i++) { c4.run.x3.captains.boran.hostileCooldown = 0; c4.run.x3.captains.boran.lastPort = -99; if (X3.pickPursuit(c4.G, new SeededRNG('p' + i), [], EVENT_BY_ID)) got++; }
  assert.ok(got > 5 && got < 40, `takip sıklığı ${got}/60`);
  const pur = EVENT_BY_ID.EVT_X3_PURSUIT;
  assert.ok(pur.options.some((o) => (o.tags || []).includes('escape')) && pur.options.some((o) => o.cost?.gold) && pur.options.some((o) => (o.tags || []).includes('combat')));
});

test('Efsaneler: run içinde tekrar yok; Sonsuz Deniz 4 limanlık dilimde en fazla bir; ilk keşif ödülü bir kez; Efsane Bekçisi', () => {
  const core = newCore();
  core.newRun('X3LEG');
  const G = core.G;
  const L01 = EVENT_BY_ID.EVT_X3_L01;
  assert.ok(X3.eligible(G, L01, new Set(), EVENT_BY_ID));
  assert.equal(X3.eligible(G, L01, new Set(['EVT_X3_L03']), EVENT_BY_ID), false, 'kuyrukta tek efsane');
  core.meta.upgrades.push('UPG_X3_LEGEND_KEEPER');
  const lines = [];
  const xp0 = core.run.xp.total;
  X3.afterResolve(G, L01, lines, deps);
  assert.equal(core.run.xp.total - xp0, 25, 'ilk keşif +10, Efsane Bekçisi +15');
  assert.ok(core.meta.achievements.includes('ACH_X3_FROZEN_ARMADA'));
  assert.equal(X3.eligible(G, L01, new Set(), EVENT_BY_ID), false, 'aynı run tekrar yok');
  core.run.ended = true; core.newRun('X3LEG2');
  const xp1 = core.run.xp.total;
  X3.afterResolve(core.G, L01, [], deps);
  assert.equal(core.run.xp.total - xp1, 0, 'ikinci keşifte ödül yok');
  // Sonsuz Deniz dilimi
  core.run.x1.endless.on = true; core.run.x1.endless.extra = 10;
  core.run.stats.harborsReached = 12;
  X3.onTrigger(core.G, EVENT_BY_ID.EVT_X3_L03);
  assert.equal(X3.eligible(core.G, EVENT_BY_ID.EVT_X3_L02, new Set(), EVENT_BY_ID), false, 'aynı 4 limanlık dilim');
  core.run.stats.harborsReached = 16;
  assert.ok(X3.eligible(core.G, EVENT_BY_ID.EVT_X3_L02, new Set(), EVENT_BY_ID));
  // derinlikle açılma: L02 III+
  core.run.x1.endless.extra = 2; // Derinlik I
  assert.equal(X3.regionBypass(core.G, EVENT_BY_ID.EVT_X3_L02), false);
  core.run.x1.endless.extra = 10; // Derinlik III
  assert.ok(X3.regionBypass(core.G, EVENT_BY_ID.EVT_X3_L02));
});

test('Efsaneler nadir ama ulaşılabilir: 1000 seed\'lik bot taramasında üçü de görülür', () => {
  const seen = { EVT_X3_L01: 0, EVT_X3_L02: 0, EVT_X3_L03: 0 };
  let runsWith = 0;
  for (let i = 0; i < 1000; i++) {
    const core = newCore();
    core.newRun('LEGSCAN' + i);
    createBot(core, { rngSeed: i + 1 }).playRun();
    let any = false;
    for (const id of Object.keys(seen)) if (core.run.seenEvents.includes(id)) { seen[id]++; any = true; }
    if (any) runsWith++;
  }
  for (const [id, n] of Object.entries(seen)) assert.ok(n >= 5, `${id} çok nadir: ${n}/1000`);
  assert.ok(runsWith < 350, `efsaneler fazla sık: ${runsWith}/1000`);
});

test('Zincirler uçtan uca: 12 finalin hepsi Codex\'e; alt sonuçlar; başarımlar bir kez; Kronikçi', () => {
  const core = newCore();
  const G = () => core.G;
  const playChain = (chain, picks, prep) => {
    core.run = null; core.newRun('X3CH' + chain + picks.join(''));
    const ch = CHAINS[chain];
    for (let s = 1; s <= ch.steps; s++) {
      const id = `${chain}_${s}`;
      const ev = EVENT_BY_ID[id];
      startAt(core, id, (run) => { prep?.(run); });
      const k = picks[s - 1];
      const opt = ev.options[k];
      satisfy(core, ev, opt);
      chainFlagsFor(core, ev, opt);
      if (opt.chance != null) core.run.buffs.luck = null;
      const r = core.choose(`o${k}`);
      assert.ok(r.ok, `${id} o${k}: ${r.reason}`);
      core.run.voyage.current = null;
    }
  };
  playChain('CH_X3_COUNCIL', [0, 1, 1, 0], (run) => { run.x3.captains.liora.rep = 1; run.x3.captains.boran.rep = 1; });
  playChain('CH_X3_COUNCIL', [0, 1, 1, 2]);
  playChain('CH_X3_COUNCIL', [0, 1, 1, 1]);
  playChain('CH_X3_ARMADA', [0, 1, 0, 0]);
  playChain('CH_X3_ARMADA', [0, 1, 0, 2]);
  playChain('CH_X3_ARMADA', [0, 1, 0, 3]);
  playChain('CH_X3_ATLAS', [0, 2, 1, 0]);
  playChain('CH_X3_ATLAS', [0, 2, 1, 1]);
  playChain('CH_X3_ATLAS', [0, 2, 1, 2]);
  playChain('CH_X3_FLAGS', [0, 0, 0]);
  playChain('CH_X3_FLAGS', [0, 0, 2]);
  playChain('CH_X3_FLAGS', [0, 0, 3]);
  const f = core.meta.x3.chainFinals;
  assert.deepEqual(f.CH_X3_COUNCIL.sort(), ['alliance', 'independent', 'rivalry']);
  assert.deepEqual(f.CH_X3_ARMADA.sort(), ['guard', 'release', 'salvage']);
  assert.deepEqual(f.CH_X3_ATLAS.sort(), ['destroy', 'publish', 'secret']);
  assert.deepEqual(f.CH_X3_FLAGS.sort(), ['expose', 'trade', 'treaty']);
  assert.ok(core.meta.x3.subs['CH_X3_COUNCIL:rivalry']?.length >= 1);
  for (const a of ['ACH_X3_FLEET_KEEPER', 'ACH_X3_TRUE_ATLAS', 'ACH_X3_THREE_FLAGS', 'ACH_X3_CHRONICLER']) assert.ok(core.meta.achievements.includes(a), a);
  assert.equal(core.meta.achievements.filter((a) => a === 'ACH_X3_CHRONICLER').length, 1);
  // Onurlu Zafer yalnızca rekabet kazanılınca
  const won = (core.meta.x3.subs['CH_X3_COUNCIL:rivalry'] || []).includes('win');
  assert.equal(core.meta.achievements.includes('ACH_X3_HONOR_WIN'), won);
  void G;
});

test('İttifak finali: en az iki dost kaptan ya da kanıt gerekir; sonraki seferde bir kez dost kaptan yardımı', () => {
  const core = newCore();
  core.newRun('X3ALLY');
  startAt(core, 'CH_X3_COUNCIL_4');
  let o = Events.getOptions(core.G, core.host()).find((x) => x.key === 'o0');
  assert.equal(o.view.available, false);
  assert.ok(o.view.reasons[0].includes('kaptan'));
  core.run.chains.CH_X3_COUNCIL.flags.evidence = true;
  o = Events.getOptions(core.G, core.host()).find((x) => x.key === 'o0');
  assert.ok(o.view.available);
  assert.ok(core.choose('o0').ok);
  assert.equal(core.run.x3.friendlyHelp, 1);
  // aynı seferde de, varıştan sonraki seferde de tehlikede bir kez
  const x = core.run.x3;
  const lines = [];
  X3.onArrival(core.G, lines, deps); // ilk liman: silahlanır
  assert.equal(x.friendlyHelp, 1);
  assert.ok(X3.injectedOptions(core.G, EVENT_BY_ID.EVT_X3_D01).some((q) => q.key === '__x3help'));
  X3.onArrival(core.G, lines, deps); // ikinci liman: süresi doldu
  assert.equal(x.friendlyHelp, 0);
});

test('Yükseltmeler: İskandil, Kaptanlar Masası, Kurtarma İskelesi (çifte bonus yok), Kıç Kirişi, Elçi Sandığı, Prizma — run başına bir kez kuralları', () => {
  const core = newCore();
  core.newRun('X3UPG');
  const G = core.G;
  const bd = (evId, k) => { const ev = EVENT_BY_ID[evId]; return Events.evalOption(G, ev, ev.options[k], {}).breakdown.map((b) => b.label); };
  core.meta.upgrades.push('UPG_X3_SOUNDINGS', 'UPG_X3_CAPTAIN_PARLEY', 'UPG_X3_RESCUE_WALKWAY');
  assert.ok(bd('EVT_X3_DIS01', 0).includes('İskandil Takımı'));
  assert.ok(!bd('EVT_X3_D04', 2).includes('İskandil Takımı'));
  assert.ok(bd('EVT_X3_F04', 2).includes('Kaptanlar Masası'));
  assert.ok(!bd('EVT_X3_D04', 2).includes('Kaptanlar Masası'));
  assert.ok(bd('EVT_X3_D02', 1).includes('Kurtarma İskelesi'));
  assert.ok(bd('EVT_X3_D01', 1).includes('Kurtarma İskelesi'));
  core.meta.upgrades.push('UPG_X2_TOW_HOOK');
  const d01 = bd('EVT_X3_D01', 1);
  assert.ok(d01.includes('Gemi Çekme Kancası') && !d01.includes('Kurtarma İskelesi'), 'aynı manevraya tek bonus');
  // Kıç Destek Kirişi: hasar yoksa harcanmaz, ilk çarpışmada −12, ikinci çarpışmada yok
  core.meta.upgrades.push('UPG_X3_STERN_BRACE');
  const notes = [];
  const ev = EVENT_BY_ID.EVT_X3_DIS01;
  assert.equal(X3.damageMods(G, 0, ev, ev.options[0], notes), 0);
  assert.ok(!core.run.x3.once.sternBrace);
  assert.equal(X3.damageMods(G, 20, ev, ev.options[0], notes), 8);
  assert.equal(X3.damageMods(G, 20, ev, ev.options[0], notes), 20);
  // Elçi Sandığı: ilk başarılı dost kaptan ticareti +%20, en fazla +40, bir kez
  core.meta.upgrades.push('UPG_X3_ENVOY_CHEST');
  const g0 = core.run.gold;
  X3.applyX3(G, { envoy: true }, { ev: EVENT_BY_ID.EVT_X3_D05, opt: { label: 'a' }, success: true }, [], deps, { goldR: 500 });
  assert.equal(core.run.gold - g0, 40);
  X3.applyX3(G, { envoy: true }, { ev: EVENT_BY_ID.EVT_X3_D05, opt: { label: 'b' }, success: true }, [], deps, { goldR: 500 });
  assert.equal(core.run.gold - g0, 40);
  // Prizma: yalnızca efsane/çok gemili işaret olayında ve bir kez; fenerlerden ayrı hak
  core.meta.upgrades.push('UPG_X3_SIGNAL_PRISM');
  assert.ok(X3.injectedOptions(G, EVENT_BY_ID.EVT_X3_L01).some((o) => o.key === '__prism'));
  assert.ok(!X3.injectedOptions(G, EVENT_BY_ID.EVT_X3_D03).some((o) => o.key === '__prism'));
  core.run.x2.once.signalLamps = true; // fener hakkı harcanmış olsa da prizma çalışır
  assert.ok(X3.injectedOptions(G, EVENT_BY_ID.EVT_X3_L01).some((o) => o.key === '__prism'));
  core.run.x3.once.prism = true;
  assert.ok(!X3.injectedOptions(G, EVENT_BY_ID.EVT_X3_L01).some((o) => o.key === '__prism'));
});

test('52 yükseltmenin hepsi satın alınabilir; Paket 3 önkoşulları geçerli', () => {
  const core = newCore();
  core.meta.xpAvailable = 999999;
  for (const e of ALL_EVENTS.filter((x) => x.cat === 'mystery').slice(0, 6)) core.meta.codex.events[e.id] = true;
  core.meta.x1.mysteryChains.CH_GHOST = true;
  core.meta.solaraHired = true;
  for (let pass = 0; pass < 6; pass++) for (const u of UPGRADES) if (!core.meta.upgrades.includes(u.id)) core.buyUpgrade(u.id);
  for (const u of UPGRADES.filter((x) => x.id.startsWith('UPG_X3_'))) assert.ok(core.meta.upgrades.includes(u.id), `${u.id} alınamadı`);
  for (const u of UPGRADES.filter((x) => x.id.startsWith('UPG_X3_'))) assert.ok(UPGRADES.some((p) => p.id === u.req), `${u.id} önkoşulu`);
});

test('Mektup bir sonraki limanda bir kez ödenir; gövde altı kontrolü sonraki hasarı bir kez 8 azaltır', () => {
  const core = newCore();
  core.newRun('X3MAIL');
  startAt(core, 'EVT_X3_F02');
  assert.ok(core.choose('o0').ok);
  assert.ok(core.run.x3.pendingCourier);
  const g = core.run.gold;
  core.run.stats.harborsReached += 1;
  X3.onArrival(core.G, [], deps);
  assert.equal(core.run.gold - g, 70);
  X3.onArrival(core.G, [], deps);
  assert.equal(core.run.gold - g, 70, 'ikinci kez ödenmez');
  const c2 = newCore(); c2.newRun('X3PRE');
  startAt(c2, 'EVT_X3_REPAIR01');
  assert.ok(c2.choose('o1').ok);
  const ev = EVENT_BY_ID.EVT_X3_D03;
  assert.equal(X3.damageMods(c2.G, 15, ev, ev.options[1], []), 7);
  assert.equal(X3.damageMods(c2.G, 15, ev, ev.options[1], []), 15);
});

test('Kayıt v6 → v7: x1, x2 ve eğitim korunur; x3 eklenir; dışa/içe aktarma; ikinci yükleme aynı', () => {
  const s = memoryStorage();
  const a = new GameCore(s);
  a.meta.tutorialDone = true;
  a.meta.upgrades.push('UPG_X2_TOW_HOOK');
  a.meta.x2.finals.CH_X2_RACE = ['aid'];
  a.newRun('X3MIG');
  a.run.x1.rep.guild = 2;
  a.run.x2.flags.reefMapped = true;
  delete a.run.x3; delete a.meta.x3;
  a.run.v = 6; a.meta.v = 6;
  a.persist();
  const b = new GameCore(s);
  assert.equal(b.run.v, 7); assert.equal(b.meta.v, 7);
  assert.equal(b.run.x1.rep.guild, 2);
  assert.ok(b.run.x2.flags.reefMapped);
  assert.deepEqual(b.meta.x2.finals.CH_X2_RACE, ['aid']);
  assert.ok(b.meta.tutorialDone && b.meta.upgrades.includes('UPG_X2_TOW_HOOK'));
  assert.ok(b.run.x3.captains.neris && b.meta.x3.captainHistory.liora);
  b.run.x3.captains.liora.rep = 2;
  b.meta.x3.legendDiscovered.EVT_X3_L02 = true;
  const str = b.saves.exportString(b.meta, b.run, b.settings);
  const imp = b.saves.parseImport(str);
  assert.ok(imp.ok);
  assert.equal(imp.run.x3.captains.liora.rep, 2);
  assert.ok(imp.meta.x3.legendDiscovered.EVT_X3_L02);
  const again = b.saves.parseImport(b.saves.exportString(imp.meta, imp.run, null));
  assert.deepEqual(again.meta.x3, imp.meta.x3);
});

test('Sonsuz Deniz 200 ek liman: efsaneler 4 limanlık dilimde en fazla bir, aynı efsane run içinde tekrar yok; kayıt sınırlı', () => {
  const core = newCore();
  core.newRun('X3LONG');
  const bot = createBot(core, { rngSeed: 4, endless: 200 });
  const legendAt = [];
  let steps = 0;
  while (bot.step()) {
    const run = core.run;
    if (run && !run.ended) {
      run.ship.hull = 9999;
      const cur = run.voyage?.current;
      if (cur && EVENT_BY_ID[cur.id]?.legend && !legendAt.some((l) => l.id === cur.id && l.at === run.stats.harborsReached)) legendAt.push({ id: cur.id, at: run.stats.harborsReached, endless: X1.endlessOn(run) });
    }
    if (++steps > 400000) throw new Error('takıldı');
  }
  const run = core.run;
  assert.ok(run.x1.endless.extra >= 200);
  const ids = legendAt.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, 'efsane tekrarı yok');
  const segs = legendAt.filter((l) => l.endless).map((l) => Math.floor(l.at / 4));
  assert.equal(new Set(segs).size, segs.length, 'dilimde tek efsane');
  assert.ok(run.x3.tx.length <= 300);
  assert.ok(JSON.stringify(run).length < 400000);
});

test('Aynı seed ve aynı kararlar aynı sonucu verir (Paket 3 içeriği dahil, deterministik)', () => {
  const play = () => { const c = newCore(); c.newRun('X3DET'); createBot(c, { rngSeed: 21 }).playRun(); return JSON.stringify([c.run.result, c.run.gold, c.run.stats.eventsResolved, c.run.seenEvents, c.run.x3.captains]); };
  assert.equal(play(), play());
});

test('Yankılar sonraki seferlerde görünür; bağımsız olay sayılmaz', () => {
  for (const c of CHAIN_IDS) {
    const id = `EVT_X3_ECHO_${c.replace('CH_X3_', '')}`;
    const ev = EVENT_BY_ID[id];
    assert.ok(ev && ev.pool === false && ev.cat === 'special', id);
    assert.ok(!X3_STANDALONE.includes(id));
    const xp = ev.options[0].win.fx.xp;
    assert.ok(xp >= 2 && xp <= 5);
  }
});
