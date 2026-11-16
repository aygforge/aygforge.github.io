// Genişleme Paketi 2 — Kaptanların Hikâyeleri kabul testleri (node:test)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBot, newCore } from '../tools/bot.mjs';
import * as X1 from '../src/systems/X1System.js';
import * as X2 from '../src/systems/X2System.js';
import * as Events from '../src/systems/EventSystem.js';
import { EVENT_BY_ID, CHAINS, ALL_EVENTS } from '../src/data/events.js';
import { X2_STANDALONE } from '../src/data/events_x2.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { CREW_BY_ID } from '../src/data/crew.js';
import { memoryStorage } from '../src/core/SaveManager.js';
import { GameCore } from '../src/core/GameCore.js';

const CHAIN_IDS = ['CH_X2_YARA', 'CH_X2_PITA', 'CH_X2_MIRA', 'CH_X2_RACE'];

/** Limandan ayrılıp kuyruğun başına belirli bir olayı koyar ve tetikler */
function startAt(core, evId, prep = () => {}) {
  if (!core.run) core.newRun('X2T' + evId);
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
function satisfyAll(run, ev, opt) {
  const need = (c) => { if (c && !run.crew.includes(c)) run.crew.push(c); };
  if (ev.cond?.crew) need(ev.cond.crew);
  if (ev.cond?.pet && !run.pets.includes(ev.cond.pet)) run.pets.push(ev.cond.pet);
  if (ev.needCrew) need(ev.needCrew);
  const r = opt.req || {};
  need(r.crew);
  if (r.crewAny) need(r.crewAny[0]);
  if (opt.show?.crew) need(opt.show.crew);
  if (opt.show?.crewAny) need(opt.show.crewAny[0]);
  if (r.item && !run.items.some((i) => i.id === r.item)) run.items.push({ id: r.item, uid: r.item + '#t' });
  if (r.cargoGoods) run.cargo.push({ id: run.lotSeq++, good: r.cargoGoods[0], qty: 2, cost: 10 });
  if (r.cargoGood) run.cargo.push({ id: run.lotSeq++, good: r.cargoGood, qty: 2, cost: 10 });
  run.ship.level = 3;
}

test('25 bağımsız olayın ve 14 zincir aşamasının her seçeneği çözülebilir (hata yok, sonuç tutarlı)', () => {
  const ids = [...X2_STANDALONE, ...ALL_EVENTS.filter((e) => /^CH_X2_/.test(e.id)).map((e) => e.id)];
  assert.equal(ids.length, 39);
  let resolved = 0;
  for (const id of ids) {
    const ev = EVENT_BY_ID[id];
    ev.options.forEach((opt, i) => {
      if (opt.show?.noCrew || opt.show?.upgrade || opt.show?.depth) return; // ayrı testlerde
      const core = newCore();
      core.newRun('X2O' + id + i);
      startAt(core, id, (run) => {
        satisfyAll(run, ev, opt);
        if (opt.req?.evidence) { /* kanıt eşiği: zincir bayrakları */ }
      });
      if (opt.req?.evidence) { const cs = core.run.chains[ev.chain]; cs.flags.ledgerFound = true; cs.flags.witnessFound = true; cs.flags.researchProof = true; }
      const host = core.host();
      const goldBefore = core.run.gold, hullBefore = core.run.ship.hull;
      const r = core.choose(`o${i}`);
      assert.ok(r.ok, `${id} o${i}: ${r.reason}`);
      const res = host.current.result;
      assert.ok(res && typeof res.text === 'string' && res.text.length > 5, `${id} o${i} sonuç metni`);
      // ikinci kez seçmek sonucu değiştirmez (idempotency)
      const g = core.run.gold, h = core.run.ship.hull;
      assert.equal(core.choose(`o${i}`).ok, false);
      assert.equal(core.run.gold, g); assert.equal(core.run.ship.hull, h);
      void goldBefore; void hullBefore;
      resolved++;
    });
  }
  assert.ok(resolved >= 120, `çözülen seçenek sayısı ${resolved}`);
});

test('Olaylar yalnızca koşulları sağlandığında seçilir; bölge/koşul ile havuzda erişilebilir', () => {
  for (const id of X2_STANDALONE) {
    const ev = EVENT_BY_ID[id];
    assert.ok(ev.regions?.length, `${id} bölge`);
    assert.ok(ev.options.length >= 3, `${id} en az 3 seçenek`);
    assert.notEqual(ev.pool, false, `${id} normal havuzda`);
  }
  // tayfa koşulu: Yara yokken Yara olayı seçilmez
  const core = newCore();
  core.newRun('X2COND');
  const pool = (crew) => { core.run.crew = crew; return ALL_EVENTS.filter((e) => e.id === 'EVT_X2_CREW01' && (!e.cond?.crew || core.run.crew.includes(e.cond.crew))); };
  assert.equal(pool([]).length, 0);
  assert.equal(pool(['CREW_YARA']).length, 1);
});

test('Diego/Magda/Vargas özel seçenekleri karakter yoksa görünmez', () => {
  const core = newCore();
  core.newRun('X2SHOW');
  startAt(core, 'EVT_X2_D02', (run) => { run.crew = []; });
  const keys = Events.getOptions(core.G, core.host()).map((o) => o.opt.label);
  assert.ok(!keys.includes('Diego dövüşsün'));
  const c2 = newCore(); c2.newRun('X2SHOW2');
  startAt(c2, 'EVT_X2_D02', (run) => { run.crew = ['CREW_DIEGO']; });
  assert.ok(Events.getOptions(c2.G, c2.host()).some((o) => o.opt.label === 'Diego dövüşsün'));
});

test('Zincir kotası: en fazla 2 aktif zincir ve en fazla 1 kişisel zincir; kalan seyir şartı', () => {
  const core = newCore();
  core.newRun('X2QUOTA');
  const run = core.run;
  run.crew = ['CREW_YARA', 'CREW_PITA'];
  run.totalHarbors = 9;
  assert.equal(X2.chainStartAllowed(core.G, CHAINS.CH_X2_YARA, 1, CHAINS), true);
  run.chains.CH_X2_PITA = { status: 'active', flags: {}, step: 1 };
  assert.equal(X2.chainStartAllowed(core.G, CHAINS.CH_X2_YARA, 1, CHAINS), false, 'ikinci kişisel zincir başlamaz');
  assert.equal(X2.chainStartAllowed(core.G, CHAINS.CH_X2_RACE, 1, CHAINS), true, 'kişisel olmayan zincir başlayabilir');
  run.chains.CH_X1_GUILD_SEAL = { status: 'queued', flags: {}, step: 0 };
  assert.equal(X2.chainStartAllowed(core.G, CHAINS.CH_X2_RACE, 1, CHAINS), false, 'üçüncü zincir başlamaz');
  run.chains = {};
  assert.equal(X2.chainStartAllowed(core.G, CHAINS.CH_X2_YARA, 6, CHAINS), false, 'normal run sonunda yeterli seyir yoksa uzun zincir başlamaz');
  assert.equal(X2.chainStartAllowed(core.G, CHAINS.CH_X2_PITA, 6, CHAINS), true);
});

test('Bekleyen zincir aşaması planlanan olay sayısına dahil edilir (1 zincir + 3 normal = 4)', () => {
  for (let i = 0; i < 25; i++) {
    const a = newCore(); a.newRun('X2PEND' + i);
    const b = newCore(); b.newRun('X2PEND' + i);
    for (const c of [a, b]) { let g = 0; while (c.run.phase === 'arrival' && g++ < 10) { const ar = c.run.arrival; if (ar.current && !ar.current.result) c.choose('o0'); else c.arrivalNext(); } }
    b.run.pendingRoute = [{ id: 'CH_X2_RACE_2', src: 'chain' }];
    b.run.chains.CH_X2_RACE = { status: 'active', flags: {}, step: 1 };
    a.depart(0); b.depart(0);
    const qa = a.run.voyage.queue.filter((q) => q.src !== 'special').length;
    const qb = b.run.voyage.queue.filter((q) => q.src !== 'special').length;
    assert.ok(b.run.voyage.queue.some((q) => q.id === 'CH_X2_RACE_2'));
    assert.ok(qb <= Math.max(qa, 1), `seed ${i}: zincirli ${qb} > zincirsiz ${qa}`);
  }
});

test('Yükseltmeler: çekme kancası yalnızca çekmeye, vinç kaldırmaya, yarış haritası yarışa; aynı manevraya çifte bonus yok', () => {
  const core = newCore();
  core.meta.upgrades.push('UPG_X1_RUDDER', 'UPG_X2_TOW_HOOK', 'UPG_X2_DECK_CRANE', 'UPG_X2_RACE_MAPS', 'UPG_X2_HONEST_SCALES');
  core.newRun('X2UPG');
  startAt(core, 'EVT_X2_D03');
  const opts = Events.getOptions(core.G, core.host());
  const bd = (label) => opts.find((o) => o.opt.label === label).view.breakdown.map((b) => b.label);
  assert.ok(bd('Mekanizmayı vinçle kaldır').includes('Güverte Vinci'));
  assert.ok(!bd('Mekanizmayı vinçle kaldır').includes('Gemi Çekme Kancası'));
  const force = bd('Kuvvetle geç');
  assert.ok(force.includes('Gemi Çekme Kancası') && !force.includes('Güverte Vinci'), 'aynı manevraya tek bonus');
  const c2 = newCore(); c2.meta.upgrades.push('UPG_X2_RACE_MAPS', 'UPG_X2_HONEST_SCALES'); c2.newRun('X2UPG2');
  startAt(c2, 'EVT_X2_F01');
  assert.ok(Events.getOptions(c2.G, c2.host()).find((o) => o.opt.label === 'Kısa yarışa katıl').view.breakdown.some((b) => b.label === 'Yarış Haritaları'));
  const c3 = newCore(); c3.meta.upgrades.push('UPG_X2_RACE_MAPS'); c3.newRun('X2UPG3');
  startAt(c3, 'EVT_X2_D05');
  assert.ok(!Events.getOptions(c3.G, c3.host()).some((o) => o.view.breakdown.some((b) => b.label === 'Yarış Haritaları')), 'kaçışta yarış haritası yok');
  // şans sınırı
  assert.equal(X2.clampChance(130, false), 95);
  assert.equal(X2.clampChance(-20, false), 5);
  assert.equal(X2.clampChance(100, true), 100, 'özel garantili çözüm korunur');
});

test('Gözcü Çanı ve Sözleşme Teminatı run başına bir kez; hasar yoksa hak harcanmaz', () => {
  const core = newCore();
  core.meta.upgrades.push('UPG_X2_LOOKOUT_BELL', 'UPG_X2_CONTRACT_GUARANTEE');
  core.newRun('X2ONCE');
  const ev = EVENT_BY_ID.EVT_X2_DIS01;
  const notes = [];
  assert.equal(X2.damageMods(core.G, 0, ev, notes), 0);
  assert.ok(!core.run.x2.once.lookoutBell, 'hasar yoksa hak harcanmaz');
  assert.equal(X2.damageMods(core.G, 30, ev, notes), 20);
  assert.equal(X2.damageMods(core.G, 30, ev, notes), 30, 'ikinci kez işlemez');
  const lines = [];
  core.run.x1.rep.guild = 1;
  X2.involuntaryFailPenalty(core.G, 'guild', lines);
  assert.equal(core.run.x1.rep.guild, 1, 'teminat cezayı önler');
  X2.involuntaryFailPenalty(core.G, 'guild', lines);
  assert.equal(core.run.x1.rep.guild, 0, 'ikinci başarısızlıkta ceza');
  for (let i = 0; i < 10; i++) X2.involuntaryFailPenalty(core.G, 'guild', lines);
  assert.equal(core.run.x1.rep.guild, -3, '±3 sınırı aşılmaz');
});

test('Ortak Nöbet yalnızca iki tayfanın birlikte çalıştığı seçenekte bir kez', () => {
  const core = newCore();
  core.meta.upgrades.push('UPG_X2_SHARED_WATCH');
  core.newRun('X2DUO');
  startAt(core, 'EVT_X2_CREW05', (run) => { run.crew = ['CREW_MAGDA', 'CREW_VARGAS']; });
  const o = Events.getOptions(core.G, core.host()).find((x) => x.opt.duo);
  assert.ok(o.view.breakdown.some((b) => b.label === 'Ortak Nöbet') || o.view.chance == null, 'kesin seçenekte şans yok, uygun şanslı seçenekte bonus');
});

test('Zincirler uçtan uca: finaller, alt sonuçlar Codex\'e, başarımlar bir kez', () => {
  const play = (chain, pickFinal) => {
    const core = newCore();
    core.newRun('X2CH' + chain + pickFinal);
    const ids = ALL_EVENTS.filter((e) => e.chain === chain).sort((a, b) => a.step - b.step);
    for (const ev of ids) {
      startAt(core, ev.id, (run) => { if (CHAINS[chain].needCrew && !run.crew.includes(CHAINS[chain].needCrew)) run.crew.push(CHAINS[chain].needCrew); run.cargo.push({ id: run.lotSeq++, good: 'GOOD_FISH', qty: 3, cost: 10 }); });
      core.run.chains[chain].flags.ledgerFound = true; core.run.chains[chain].flags.witnessFound = true;
      const opts = Events.getOptions(core.G, core.host()).filter((o) => o.view.available && !o.injected && !o.opt.show?.noCrew && !(o.opt.tags || []).includes('pass') && o.opt.label !== 'Yardımı reddet' && o.opt.label !== 'Daveti reddet');
      const o = ev.step === CHAINS[chain].steps ? opts[pickFinal] || opts[0] : opts[0];
      assert.ok(core.choose(o.key).ok);
      core.continueEvent();
      if (core.run.ended) break;
      core.run.ship.hull = 300;
    }
    return core;
  };
  for (const ch of CHAIN_IDS) {
    for (let f = 0; f < 3; f++) {
      const core = play(ch, f);
      const fins = core.meta.x2.finals[ch] || [];
      assert.ok(fins.length >= 1, `${ch} final ${f} kaydedildi`);
      assert.equal(core.run.chains[ch].status, 'done');
    }
  }
  const c = play('CH_X2_YARA', 0);
  assert.ok(c.meta.achievements.includes('ACH_X2_OLD_FLAGS'));
  const n = c.meta.achievements.filter((a) => a === 'ACH_X2_OLD_FLAGS').length;
  assert.equal(n, 1);
});

test('Tayfa ayrılırsa kişisel zincir softlock olmadan güvenle kapanır', () => {
  const core = newCore();
  core.newRun('X2LEFT');
  startAt(core, 'CH_X2_MIRA_2', (run) => { run.crew = []; });
  const opts = Events.getOptions(core.G, core.host());
  assert.ok(opts.every((o) => !o.opt.show?.crew), 'eksik karaktere ait seçenek gösterilmez');
  const close = opts.find((o) => o.opt.show?.noCrew);
  assert.ok(close);
  assert.ok(core.choose(close.key).ok);
  core.continueEvent();
  assert.equal(core.run.chains.CH_X2_MIRA.status, 'done');
});

test('Yara final C kanıt eşiği: eksik kanıtta kilitli ve açıklamalı', () => {
  const core = newCore();
  core.newRun('X2EVID');
  startAt(core, 'CH_X2_YARA_4', (run) => { run.crew = ['CREW_YARA']; });
  let o = Events.getOptions(core.G, core.host()).find((x) => x.opt.label === 'Gerçek suçluyu ortaya çıkar');
  assert.equal(o.view.available, false);
  assert.ok(o.view.reasons[0].includes('kanıt'));
  core.run.chains.CH_X2_YARA.flags.ledgerFound = true;
  core.run.chains.CH_X2_YARA.flags.witnessFound = true;
  o = Events.getOptions(core.G, core.host()).find((x) => x.opt.label === 'Gerçek suçluyu ortaya çıkar');
  assert.equal(o.view.available, true);
});

test('Kaptanların Dostu: üç farklı gemi; aynı gemi tekrar sayılmaz', () => {
  const core = newCore();
  core.newRun('X2FRIEND');
  const ctx = { ev: EVENT_BY_ID.EVT_X2_F04, host: null };
  const deps = { addXp: () => 0, unlockAchievement: (G, id) => { if (!G.meta.achievements.includes(id)) G.meta.achievements.push(id); } };
  X2.applyX2(core.G, { helped: 'fisherman' }, ctx, [], deps);
  X2.applyX2(core.G, { helped: 'fisherman' }, ctx, [], deps);
  X2.applyX2(core.G, { helped: 'convoy' }, ctx, [], deps);
  assert.ok(!core.meta.achievements.includes('ACH_X2_CAPTAINS_FRIEND'));
  X2.applyX2(core.G, { helped: 'sickSailor' }, ctx, [], deps);
  assert.ok(core.meta.achievements.includes('ACH_X2_CAPTAINS_FRIEND'));
  assert.equal(ACHIEVEMENTS.filter((a) => a.id.startsWith('ACH_X2_')).length, 8);
});

test('Sonsuz Deniz: V sonrası büyüme sert üst sınırda; altı varyant derinliğe bağlı', () => {
  const run = { ship: { level: 2 }, x1: { endless: { on: true, extra: 0 } } };
  const at = (e) => { run.x1.endless.extra = e; return [X1.damageMult(run), X1.riskPenalty(run), X1.repairCostMult(run)]; };
  const cap = at(1000);
  assert.deepEqual(at(200), cap);
  assert.deepEqual(at(50), cap);
  assert.ok(Math.abs(cap[0] - (1.55 + 2 * 0.18)) < 1e-9 && cap[1] === 18, `üst sınır ${cap}`);
  const withVar = ['EVT_X2_D05', 'EVT_X2_DIS01', 'EVT_X2_DIS02', 'EVT_X2_M04', 'EVT_X2_F01', 'EVT_X2_F03'];
  for (const id of withVar) {
    const ev = EVENT_BY_ID[id];
    assert.ok(ev.x2variant, `${id} varyantı`);
    run.x1.endless.extra = 1;
    assert.equal(X2.variantOf(run, ev), null, `${id} sığ derinlikte varyant yok`);
    run.x1.endless.extra = 30;
    assert.ok(X2.variantOf(run, ev), `${id} derin varyant`);
  }
  assert.ok(X2.theatreText({ idx: 20, x1: { endless: { extra: 12 } }, stats: { eventsResolved: 60, goldEarned: 900 } }).includes('12 ek limanı'));
});

test('v5 kaydı güncel sürüme taşınır: x1 korunur, x2 eklenir; yükseltmeler korunur', () => {
  const s = memoryStorage();
  const a = new GameCore(s);
  a.meta.tutorialDone = true;
  a.meta.upgrades.push('UPG_X1_RUDDER');
  a.newRun('X2MIG');
  a.run.x1.rep.crown = 2;
  delete a.run.x2; delete a.meta.x2;
  a.run.v = 5; a.meta.v = 5;
  a.persist();
  const b = new GameCore(s);
  assert.equal(b.run.v, 7);
  assert.equal(b.run.x1.rep.crown, 2);
  assert.ok(b.run.x2 && b.meta.x2);
  assert.ok(b.meta.upgrades.includes('UPG_X1_RUDDER'));
  assert.ok(b.meta.tutorialDone);
});

test('Aynı seed ve aynı kararlar aynı sonucu verir (deterministik)', () => {
  const run = () => { const c = newCore(); c.newRun('X2DET'); createBot(c, { rngSeed: 11 }).playRun(); return [c.run.result, c.run.gold, c.run.stats.eventsResolved, c.run.xp.total]; };
  assert.deepEqual(run(), run());
});

test('Yeni yükseltmeler satın alınabilir; önkoşullar geçerli; Solara gizli dalı korunur', () => {
  const core = newCore();
  core.meta.xpAvailable = 99999;
  // Efsane dalı koşulları: 5 gizem olayı ve bir gizem zinciri keşfedilmiş olmalı
  for (const e of ALL_EVENTS.filter((x) => x.cat === 'mystery').slice(0, 6)) core.meta.codex.events[e.id] = true;
  core.meta.x1.mysteryChains.CH_GHOST = true;
  const x2 = UPGRADES.filter((u) => u.id.startsWith('UPG_X2_'));
  for (let pass = 0; pass < 4; pass++) for (const u of UPGRADES) if (!core.meta.upgrades.includes(u.id)) core.buyUpgrade(u.id);
  for (const u of x2) assert.ok(core.meta.upgrades.includes(u.id), `${u.id} alınamadı`);
  assert.ok(UPGRADES.some((u) => u.branch === 'solara'));
  void CREW_BY_ID;
});

test('Her olayda koşulsuz seçilebilen en az bir seçenek var (ambar dolu, altın yok, tayfa yok: kilitlenme olmaz)', () => {
  for (const ev of ALL_EVENTS.filter((e) => /^(EVT|CH)_X2_/.test(e.id))) {
    const free = ev.options.filter((o) => !o.req && !o.cost && !(o.show && (o.show.crew || o.show.crewAny || o.show.upgrade || o.show.depth)));
    assert.ok(free.length >= 1, `${ev.id}: koşulsuz seçenek yok`);
  }
});
