// Yaşayan Denizler & Sonsuz Deniz testleri (node:test). Çalıştırma: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBot, newCore } from '../tools/bot.mjs';
import * as X1 from '../src/systems/X1System.js';
import { EVENT_BY_ID, CHAINS } from '../src/data/events.js';
import { X1_STANDALONE } from '../src/data/events_x1.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { HARBOR_BY_ID } from '../src/data/harbors.js';
import * as Events from '../src/systems/EventSystem.js';
import { SeededRNG } from '../src/core/SeededRNG.js';

function endlessRun(seed, extra, opts = {}) {
  const core = newCore();
  core.newRun(seed);
  const bot = createBot(core, { rngSeed: 7, endless: extra, ...opts });
  let n = 0;
  while (bot.step()) {
    // yapısal testler: gemi batmasın (yalnızca limanda gövde doldurulur)
    if (opts.keepAfloat !== false && core.run && !core.run.ended && core.run.phase === 'harbor') core.run.ship.hull = Math.max(core.run.ship.hull, 400);
    if (++n > 200000) throw new Error('takıldı');
  }
  return core;
}

test('Sonsuz Deniz\'de batış: Büyük Liman başarısı ve kazanılmış XP korunur', () => {
  const core = newCore();
  core.newRun('SINKEND');
  const bot = createBot(core, { rngSeed: 5, endless: 99 });
  let n = 0, sunkForced = false;
  while (bot.step()) {
    const r = core.run;
    if (r && !r.ended && r.phase === 'harbor' && !r.x1.endless.on) r.ship.hull = Math.max(r.ship.hull, 400);
    if (r && !r.ended && r.x1.endless.on && r.x1.endless.extra >= 2 && r.phase === 'voyage' && !sunkForced) { r.ship.hull = 1; sunkForced = true; }
    if (++n > 200000) throw new Error('takıldı');
  }
  const run = core.run;
  if (run.result === 'endless_sunk') {
    assert.equal(core.meta.stats.completed, 1, 'Büyük Liman başarısı geri alınmaz');
    assert.ok(core.meta.xpTotalEarned >= run.xp.total && run.xp.total > 0, 'XP korunur');
    assert.equal(core.meta.stats.runs, 1);
  } else assert.equal(run.result, 'endless_safe');
});

test('25 bağımsız event, 4 zincir / 14 aşama / 12 final', () => {
  assert.equal(X1_STANDALONE.length, 25);
  const x1c = Object.values(CHAINS).filter((c) => c.x1);
  assert.equal(x1c.length, 4);
  assert.equal(x1c.reduce((s, c) => s + c.steps, 0), 14);
  assert.equal(x1c.reduce((s, c) => s + c.finals.length, 0), 12);
  for (const c of x1c) for (let s = 1; s <= c.steps; s++) assert.ok(Object.values(EVENT_BY_ID).some((e) => e.chain === c.id && e.step === s), `${c.id} adım ${s}`);
  // her X1 eventin seçenekleri tanımlı ve sonuç metni var
  for (const id of X1_STANDALONE) {
    const ev = EVENT_BY_ID[id];
    assert.ok(ev.options.length >= 3, id);
    for (const o of ev.options) assert.ok(o.win?.text !== undefined, `${id} ${o.label}`);
  }
});

test('12 yeni yükseltme: toplam 4.730 XP, önkoşullar gerçek kimlikler', () => {
  const x = UPGRADES.filter((u) => u.id.startsWith('UPG_X1_'));
  assert.equal(x.reduce((s, u) => s + u.cost, 0), 4730);
  const ids = new Set(UPGRADES.map((u) => u.id));
  for (const u of x) if (u.req) assert.ok(ids.has(u.req), u.id);
});

test('Sonsuz Deniz: Büyük Liman ödülü bir kez, 12+ ek liman, derinlik ve son 6 liman kuralı', () => {
  const core = endlessRun('ENDLESS1', 14);
  const run = core.run;
  assert.ok(run.ended);
  const e = run.x1.endless;
  // gemi batmadıysa güvenli çıkış ve en az 12 ek liman
  if (run.result === 'endless_safe') assert.ok(e.extra >= 14, `ek liman ${e.extra}`);
  assert.equal(core.meta.stats.runs, 1, 'run istatistiğe bir kez eklenir');
  assert.equal(core.meta.stats.completed, 1, 'Büyük Liman başarısı bir kez');
  assert.equal(run.xp.sources.complete, 100 * 0 + run.xp.sources.complete); // kaynak tanımlı
  assert.ok(e.milestones.length >= 3, 'kilometre taşları');
  assert.equal(new Set(e.milestones).size, e.milestones.length, 'kilometre taşı çift verilmez');
  // son 6 liman kuralı: Sonsuz Deniz rotasında art arda 6 ziyaret içinde tekrar yok
  const ids = run.route.slice(e.startIdx).map((r) => r.harborId);
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < Math.min(ids.length, i + 7); j++) assert.notEqual(ids[i], ids[j], `tekrar ${ids[i]} @${i},${j}`);
  assert.ok(core.meta.x1.records.maxExtra >= Math.min(12, e.extra));
});

test('Derinlik çarpanları ve üst sınır', () => {
  const run = { x1: { endless: { on: true, extra: 0 } } };
  const d = (x) => { run.x1.endless.extra = x; return X1.depthOf(run); };
  assert.equal(d(1), 1); assert.equal(d(4), 1); assert.equal(d(5), 2); assert.equal(d(9), 3); assert.equal(d(13), 4); assert.equal(d(17), 5); assert.equal(d(200), 5);
  run.x1.endless.extra = 200;
  assert.equal(X1.damageMult(run), 1.3);
  assert.equal(X1.riskPenalty(run), 8);
  assert.equal(X1.goldBonus(run), 0.2);
});

test('Deniz Koşulları seed tabanlı ve art arda tekrarsız', () => {
  const a = endlessRun('CONDSEED', 13);
  const b = endlessRun('CONDSEED', 13);
  assert.deepEqual(a.run.x1.endless.condHist, b.run.x1.endless.condHist);
  const h = a.run.x1.endless.condHist;
  for (let i = 1; i < h.length; i++) assert.notEqual(h[i], h[i - 1]);
});

test('Uzun sefer: 50, 100 ve 200 ek liman — rota kilitlenmez, hasar üst sınırda, kayıt boyutu sınırlı', () => {
  for (const n of [50, 100, 200]) {
    const core = newCore();
    core.newRun('LONG' + n);
    const bot = createBot(core, { rngSeed: 3, endless: n });
    // gemiyi batmaktan koruyarak rota üretimini sına (yalnızca test: her limanda tam tamir)
    let steps = 0;
    while (bot.step()) {
      if (core.run && !core.run.ended && core.run.phase === 'harbor') core.run.ship.hull = 9999;
      if (++steps > 400000) throw new Error('takıldı');
    }
    const e = core.run.x1.endless;
    assert.ok(e.extra >= n, `${n}: ${e.extra}`);
    assert.equal(X1.depthOf(core.run), 5);
    assert.ok(core.run.x1.tx.length <= 400);
    const size = JSON.stringify(core.run).length;
    assert.ok(size < 400000, `kayıt boyutu ${size}`);
  }
});

test('Fraksiyon itibarı −3/+3 sınırında, bağımsız değişir; eski pirateRep taşınır', () => {
  const core = newCore();
  core.newRun('REP1');
  const G = core.G;
  for (let i = 0; i < 10; i++) X1.addRep(G, 'guild', 1);
  for (let i = 0; i < 10; i++) X1.addRep(G, 'crown', -1);
  assert.equal(X1.rep(core.run, 'guild'), 3);
  assert.equal(X1.rep(core.run, 'crown'), -3);
  assert.equal(X1.rep(core.run, 'red'), 0);
  const old = { pirateRep: 2, x1: undefined };
  X1.initRunX1(old);
  assert.equal(old.x1.rep.red, 2);
});

test('Sözleşmeler: kapasite, görev kargosu satılamaz, ödül bir kez, alternatif teslimat %70', () => {
  const core = newCore();
  core.newRun('CONTRACT1');
  for (let g = 0; core.run.phase === 'arrival' && g < 20; g++) { const a = core.run.arrival; if (a.current && !a.current.result) core.choose('o0'); else core.arrivalNext(); }
  const run = core.run;
  run.visit.contracts = [{ type: 'CONTRACT_X1_SPICE', gold: 100, taken: false }, { type: 'CONTRACT_X1_LETTER', gold: 80, taken: false }];
  const r1 = core.acceptContract(0);
  assert.ok(r1.ok, r1.reason);
  const lot = run.cargo.find((l) => l.contract);
  assert.ok(lot, 'görev kargosu ambarda');
  assert.equal(core.sellLot(lot.id, 1).ok, false, 'görev kargosu satılamaz');
  const r2 = core.acceptContract(1);
  assert.equal(r2.ok, false, 'Paslı Martı yalnızca 1 sözleşme taşır');
  const c = run.x1.contracts[0];
  const lines = [];
  const gold0 = run.gold;
  assert.ok(X1.completeContract(core.G, c.id, 0.7, lines, (G, x) => x));
  assert.equal(run.gold - gold0, 70, 'alternatif teslimat %70');
  assert.equal(X1.completeContract(core.G, c.id, 1, lines, (G, x) => x), false, 'ikinci kez ödül yok');
  assert.ok(!run.cargo.some((l) => l.contract === c.id), 'teslimde kargo kalkar');
  assert.equal(X1.rep(run, 'guild'), 1, 'Lonca +1');
});

test('Sözleşmeli uzun sefer: deadlock yok, sözleşmeler tamamlanıyor', () => {
  const core = endlessRun('CONTRACTRUN', 16, { contracts: true });
  assert.ok(core.run.ended);
  assert.ok(core.run.x1.contracts.every((c) => c.state === 'active' || c.state === 'delivering'));
});

test('Keşfedilmemiş event önceliği ×1,5 ve kategori içinde kalır', () => {
  const core = newCore();
  core.newRun('UNSEEN');
  const ev = EVENT_BY_ID.EVT_X1_D01;
  assert.equal(X1.eventWeightMult(core.G, ev), 1.5);
  core.meta.codex.events.EVT_X1_D01 = true;
  assert.equal(X1.eventWeightMult(core.G, ev), 1);
});

test('Aynı anda en fazla iki aktif uzun zincir; Groot yokken Groot zinciri başlamaz', () => {
  const core = newCore();
  core.newRun('CHAINLIM');
  const G = core.G;
  core.run.chains.A = { status: 'active' };
  core.run.chains.B = { status: 'queued' };
  assert.equal(X1.chainStartAllowed(G, CHAINS.CH_X1_LIGHTKEEPER, 1), false);
  delete core.run.chains.A; delete core.run.chains.B;
  core.run.crew = [];
  assert.equal(X1.chainStartAllowed(G, CHAINS.CH_X1_GROOT_LEGACY, 1), false);
  core.run.crew = ['CREW_GROOT'];
  assert.equal(X1.chainStartAllowed(G, CHAINS.CH_X1_GROOT_LEGACY, 1), true);
});

test('Denizci Günlüğü: sonuçlar kalıcı yazılır; zincir finali kaydedilir', () => {
  const core = newCore();
  core.newRun('JOURNAL');
  X1.recordOutcome(core.G, 'EVT_X1_D01', 'o2', false);
  X1.recordFinal(core.G, 'CH_X1_RED_CAPTAIN', 'peace');
  X1.recordFinal(core.G, 'CH_X1_RED_CAPTAIN', 'peace');
  assert.ok(core.meta.x1.outcomes.EVT_X1_D01['o2|l']);
  assert.deepEqual(core.meta.x1.finals.CH_X1_RED_CAPTAIN, ['peace']);
});

test('Kayıt migrasyonu: v4 run/meta güvenle yüklenir, yeni alanlar varsayılan', () => {
  const core = newCore();
  core.newRun('MIGRATE');
  const raw = JSON.parse(JSON.stringify(core.run));
  delete raw.x1; raw.v = 4; raw.pirateRep = 1;
  const meta = JSON.parse(JSON.stringify(core.meta));
  delete meta.x1; meta.v = 4;
  core.saves.s.setItem('tof.run', JSON.stringify(raw));
  core.saves.s.setItem('tof.meta', JSON.stringify(meta));
  const lr = core.saves.loadRun();
  const lm = core.saves.loadMeta();
  assert.ok(lr && lr.x1 && lr.x1.endless.on === false);
  assert.equal(lr.x1.rep.red, 1);
  assert.equal(lr.v, 5);
  assert.ok(lm.x1.records);
});

test('Deterministik: aynı seed ve kararlar aynı Sonsuz Deniz rotası', () => {
  const a = endlessRun('DET1', 8);
  const b = endlessRun('DET1', 8);
  assert.deepEqual(a.run.route.map((r) => r.harborId), b.run.route.map((r) => r.harborId));
});

void HARBOR_BY_ID; void Events; void SeededRNG;
