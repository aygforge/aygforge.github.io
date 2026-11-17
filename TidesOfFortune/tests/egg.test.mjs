// GİZLİ DENİZ HİKÂYELERİ — 23 easter egg kabul testleri (node:test)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBot, newCore } from '../tools/bot.mjs';
import * as Events from '../src/systems/EventSystem.js';
import * as Egg from '../src/systems/EggSystem.js';
import { EVENT_BY_ID, ALL_EVENTS, POOL_EVENTS, CHAINS } from '../src/data/events.js';
import { EGG_EVENTS, EGG_IDS } from '../src/data/events_egg.js';
import { UPGRADES } from '../src/data/upgrades.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { HARBORS } from '../src/data/harbors.js';
import { SHIPS } from '../src/data/ships.js';
import { BALANCE, SAVE_VERSION } from '../src/config/balance.js';
import { memoryStorage } from '../src/core/SaveManager.js';
import { GameCore } from '../src/core/GameCore.js';
import { SCENES } from '../src/presentation/scenes.js';

const EXPECT = {
  EVT_EGG_001: ['fortune', 'rare', [2, 3, 4, 5]], EVT_EGG_003: ['danger', 'very_rare', [3, 4, 5]], EVT_EGG_008: ['disaster', 'rare', [4, 5]],
  EVT_EGG_009: ['fortune', 'rare', [1, 2, 3, 4]], EVT_EGG_010: ['fortune', 'very_rare', [2, 3, 4, 5]], EVT_EGG_013: ['fortune', 'rare', [1, 2, 3, 4]],
  EVT_EGG_019: ['mystery', 'rare', [2, 3, 4]], EVT_EGG_025: ['fortune', 'rare', [2, 3, 4]], EVT_EGG_026: ['mystery', 'rare', [2, 3, 4, 5]],
  EVT_EGG_031: ['fortune', 'rare', [1, 2, 3, 4]], EVT_EGG_033: ['fortune', 'rare', [1, 2, 3, 4]], EVT_EGG_035: ['fortune', 'rare', [1, 2, 3]],
  EVT_EGG_043: ['mystery', 'rare', [2, 3, 4, 5]], EVT_EGG_046: ['mystery', 'rare', [1, 2, 3, 4]], EVT_EGG_051: ['mystery', 'rare', [2, 3, 4, 5]],
  EVT_EGG_055: ['mystery', 'very_rare', [3, 4, 5]], EVT_EGG_060: ['disaster', 'very_rare', [3, 4, 5]], EVT_EGG_075: ['fortune', 'rare', [1, 2, 3, 4]],
  EVT_EGG_086: ['mystery', 'very_rare', [3, 4, 5]], EVT_EGG_093: ['mystery', 'very_rare', [3, 4, 5]], EVT_EGG_095: ['mystery', 'rare', [4, 5]],
  EVT_EGG_116: ['fortune', 'rare', [1, 2, 3, 4]], EVT_EGG_117: ['fortune', 'rare', [2, 3, 4]],
};

function startAt(core, evId, prep = () => {}) {
  if (!core.run) core.newRun('EGGT' + evId);
  let g = 0;
  while (core.run.phase === 'arrival' && g++ < 10) { const a = core.run.arrival; if (a.current && !a.current.result) core.choose('o0'); else core.arrivalNext(); }
  prep(core.run);
  core.depart(0);
  const v = core.run.voyage;
  v.queue[v.pos] = { id: evId, src: 'egg' };
  const r = core.nextEvent();
  assert.ok(r.ok, `${evId}: ${r.reason}`);
  return core;
}
/** Bir sonraki zarı sabitle (şanslı seçeneğin iki dalı) */
function fixRoll(core, win) { const g = core.rng; const o = g.next.bind(g); let n = 0; g.next = () => (n++ === 0 ? (win ? 0 : 0.999) : o()); }

test('T02/T06: tam 23 benzersiz EVT_EGG_; kategori, bölge, nadirlik tablosu; 11/9/2/1 ve 17/6; seçilmiş A konseptleri', () => {
  assert.equal(EGG_IDS.length, 23);
  assert.equal(new Set(EGG_IDS).size, 23);
  assert.equal(ALL_EVENTS.filter((e) => e.id.startsWith('EVT_EGG_')).length, 23);
  assert.deepEqual(EGG_IDS.slice().sort(), Object.keys(EXPECT).sort());
  for (const e of EGG_EVENTS) {
    const [cat, rar, reg] = EXPECT[e.id];
    assert.equal(e.cat, cat, e.id); assert.equal(e.egg, rar, e.id); assert.deepEqual(e.regions, reg, e.id);
    assert.equal(e.pool, false, `${e.id} normal havuza girmez`);
    assert.ok(e.eggDesc && e.eggDesc.length > 10);
  }
  const c = (k) => EGG_EVENTS.filter((e) => e.cat === k).length;
  assert.deepEqual([c('fortune'), c('mystery'), c('disaster'), c('danger')], [11, 9, 2, 1]);
  assert.equal(EGG_EVENTS.filter((e) => e.egg === 'rare').length, 17);
  assert.equal(EGG_EVENTS.filter((e) => e.egg === 'very_rare').length, 6);
  assert.equal(EVENT_BY_ID.EVT_EGG_025.title, 'X İşaretli Hazine');
  assert.equal(EVENT_BY_ID.EVT_EGG_035.title, 'Yağmurlu Gün Balıkçısı');
  assert.equal(EVENT_BY_ID.EVT_EGG_093.title, 'Adanın Altındaki Kapak');
  assert.ok(!ALL_EVENTS.some((e) => /İskelet Müzisyen|Deniz Çiftçisi|Şamandıra.*Sayı|Sayılarla/.test(e.title || '')));
  assert.ok(!POOL_EVENTS.some((e) => e.id.startsWith('EVT_EGG_')));
});

test('T03/T04: 23×3 = 69 seçenek, gerçek sonuçlar; 23 sahne kaydı event.id ile', () => {
  let n = 0;
  for (const e of EGG_EVENTS) {
    assert.equal(e.options.length, 3, e.id);
    for (const o of e.options) { n++; assert.ok(o.win && (o.win.text || o.cases), `${e.id} ${o.label}`); if (o.chance != null) assert.ok(o.lose?.text, `${e.id} başarısızlık dalı`); }
    assert.equal(typeof SCENES[e.id], 'function', `${e.id} sahne kaydı`);
  }
  assert.equal(n, 69);
});

test('T05: mevcut envanter korunur — 260 tanımlı olay (177 olay/özel + 83 aşama), 52 yükseltme, 45 liman, 5 gemi, normal sefer 6–10', () => {
  const nonEgg = ALL_EVENTS.filter((e) => !e.id.startsWith('EVT_EGG_'));
  const stages = nonEgg.filter((e) => e.cat === 'chain').length;
  const events = nonEgg.length - stages;
  assert.equal(nonEgg.length + 23, ALL_EVENTS.length);
  // Gerçek kayıt taraması: 177 olay/özel karşılaşma + 83 hikâye aşaması = 260 (girdi (8).html ile aynı ID kümesi)
  assert.equal(stages, 83);
  assert.equal(events, 177, `olay ${events}`);
  assert.equal(ALL_EVENTS.length, 283);
  assert.equal(UPGRADES.length, 52);
  assert.equal(HARBORS.length, 45);
  assert.equal(SHIPS.length, 5);
  assert.equal(BALANCE.route.minHarbors, 6); assert.equal(BALANCE.route.maxHarbors, 10);
  assert.equal(BALANCE.start.gold, 100);
  assert.equal(SAVE_VERSION, 7);
  assert.ok(ACHIEVEMENTS.every((a) => !a.id.includes('EGG')), 'bu pakette yeni başarım yok');
  assert.equal(Object.keys(CHAINS).length, 24);
});

test('T08: 69 seçeneğin hepsi gerçek çözücüyle; şanslı dallar başarı ve başarısızlıkla ayrı; tek etki, tekrar seçim yok', () => {
  let ran = 0;
  for (const e of EGG_EVENTS) {
    e.options.forEach((o, i) => {
      for (const win of o.chance != null ? [true, false] : [true]) {
        const core = newCore();
        core.newRun('EGGO' + e.id + i + win);
        startAt(core, e.id, (run) => {
          run.gold = 500;
          const r = o.req || {};
          if (r.crew) run.crew.push(r.crew);
          if (r.crewAny) run.crew.push(r.crewAny[0]);
          if (r.item) run.items.push({ id: r.item, uid: 't#' + r.item });
        });
        const g0 = core.run.gold, h0 = core.run.ship.hull, xp0 = core.run.xp.total;
        if (o.chance != null) fixRoll(core, win);
        const r = core.choose(`o${i}`);
        assert.ok(r.ok, `${e.id} o${i}: ${r.reason}`);
        const res = core.host().current.result;
        assert.equal(res.success, win, `${e.id} o${i} dal`);
        const g1 = core.run.gold, h1 = core.run.ship.hull, xp1 = core.run.xp.total;
        assert.equal(core.choose(`o${i}`).ok, false);
        assert.equal(core.run.gold, g1); assert.equal(core.run.ship.hull, h1); assert.equal(core.run.xp.total, xp1);
        assert.ok(g1 >= 0 && h1 > 0);
        void g0; void h0; void xp0;
        ran++;
      }
    });
  }
  assert.equal(ran, 69 + EGG_EVENTS.reduce((s, e) => s + e.options.filter((o) => o.chance != null).length, 0));
});

test('T10/ekonomi: tam tutarlar — #01 o2 net +10, #51 o1 net 0, #25 o0 +20, #08 o1 +30/−6, #10 balık gerçekten düşer', () => {
  const run1 = (id, k, prep, win) => { const c = newCore(); c.newRun('EGGE' + id + k + win); startAt(c, id, (r) => { r.gold = 100; prep?.(r); }); const g = c.run.gold, h = c.run.ship.hull; if (win != null) fixRoll(c, win); assert.ok(c.choose('o' + k).ok); return { c, dg: c.run.gold - g, dh: c.run.ship.hull - h }; };
  assert.equal(run1('EVT_EGG_001', 2).dg, 10);
  assert.equal(run1('EVT_EGG_051', 1).dg, 0);
  assert.equal(run1('EVT_EGG_025', 0).dg, 20);
  assert.equal(run1('EVT_EGG_008', 1, null, true).dg, 30);
  const lose8 = run1('EVT_EGG_008', 1, null, false).dh;
  assert.ok(lose8 < 0 && lose8 >= -8, `hasar ${lose8} (temel −6, bölge çarpanıyla)`);
  assert.equal(run1('EVT_EGG_031', 1).dg, -20);
  assert.equal(run1('EVT_EGG_075', 1).dg, -15);
  assert.equal(run1('EVT_EGG_009', 1).dg, -10);
  const f = run1('EVT_EGG_010', 0, (r) => { r.cargo.push({ id: r.lotSeq++, good: 'GOOD_FISH', qty: 2, cost: 5 }); });
  assert.equal(f.c.run.cargo.find((l) => l.good === 'GOOD_FISH').qty, 1, 'bir balık tüketildi');
  const nf = run1('EVT_EGG_010', 0, (r) => { r.cargo = []; });
  assert.equal(nf.c.run.cargo.length, 0, 'balık yoksa kargo uydurulmaz');
  // #03 çay: borç bayrağı yok
  const t = run1('EVT_EGG_003', 1);
  assert.equal(t.dg, 15);
  assert.ok(!JSON.stringify(t.c.run.x2 || {}).includes('debt'));
  // koşullar: 0 altınla maliyetli seçenekler kilitli; tayfasız koşullu seçenekler kilitli, diğerleri açık
  const c = newCore(); c.newRun('EGGL');
  startAt(c, 'EVT_EGG_001', (r) => { r.gold = 0; });
  const opts = Events.getOptions(c.G, c.host());
  assert.equal(opts.length, 3, 'enjekte seçenek eklenmez');
  assert.equal(opts.find((o) => o.key === 'o2').view.available, false);
  assert.ok(opts.find((o) => o.key === 'o0').view.available && opts.find((o) => o.key === 'o1').view.available);
  for (const [id, k] of [['EVT_EGG_013', 1], ['EVT_EGG_033', 1], ['EVT_EGG_046', 2], ['EVT_EGG_055', 0], ['EVT_EGG_060', 1], ['EVT_EGG_075', 2], ['EVT_EGG_093', 2], ['EVT_EGG_035', 1]]) {
    const d = newCore(); d.newRun('EGGQ' + id);
    startAt(d, id, (r) => { r.crew = []; r.items = []; r.gold = 100; });
    const v = Events.getOptions(d.G, d.host());
    assert.equal(v.find((o) => o.key === `o${k}`).view.available, false, `${id} o${k} kilitli`);
    assert.equal(v.filter((o) => o.view.available).length, 2, `${id} diğer iki seçenek açık`);
  }
  // #93: Mira YA DA Compass yeterli
  for (const crew of ['CREW_MIRA', 'CREW_COMPASS']) {
    const d = newCore(); d.newRun('EGG93' + crew);
    startAt(d, 'EVT_EGG_093', (r) => { r.crew = [crew]; });
    assert.ok(Events.getOptions(d.G, d.host()).find((o) => o.key === 'o2').view.available, crew);
  }
});

test('T10: zamanlayıcı — normal run en fazla 1 egg; 2000 seed\'de oran %20–25 civarı; 23 egg\'in hepsi erişilebilir; asla 2', () => {
  const per = {}; let withEgg = 0, two = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const c = newCore(); c.newRun('EGGF' + i);
    createBot(c, { rngSeed: i + 1 }).playRun();
    const eggs = c.run.seenEvents.filter(Egg.isEgg);
    if (eggs.length) withEgg++;
    if (eggs.length > 1) two++;
    for (const e of eggs) per[e] = (per[e] || 0) + 1;
  }
  assert.equal(two, 0);
  const pct = (100 * withEgg) / N;
  assert.ok(pct >= 18 && pct <= 28, `egg oranı %${pct.toFixed(1)}`);
  assert.equal(Object.keys(per).length, 23, `erişilen ${Object.keys(per).length}`);
  const rare = EGG_EVENTS.filter((e) => e.egg === 'rare').reduce((s, e) => s + (per[e.id] || 0), 0) / 17;
  const vr = EGG_EVENTS.filter((e) => e.egg === 'very_rare').reduce((s, e) => s + (per[e.id] || 0), 0) / 6;
  assert.ok(rare > vr * 1.3, `rare ort ${rare.toFixed(1)} / very_rare ort ${vr.toFixed(1)}`);
});

test('T10: bölge filtreleri — bölge 1\'de yalnız 1 içeren egg\'ler; #08 yalnız 4–5', () => {
  const core = newCore(); core.newRun('EGGR');
  const r1 = Egg.eggCandidates(core.G, 1).map((e) => e.id);
  assert.ok(r1.every((id) => EVENT_BY_ID[id].regions.includes(1)));
  assert.ok(!r1.includes('EVT_EGG_008') && !r1.includes('EVT_EGG_060') && !r1.includes('EVT_EGG_003'));
  assert.ok(Egg.eggCandidates(core.G, 5).some((e) => e.id === 'EVT_EGG_008'));
  assert.ok(!Egg.eggCandidates(core.G, 3).some((e) => e.id === 'EVT_EGG_008'));
});

test('T11: Sonsuz Deniz 200 ek liman — 6 limanlık pencerede en fazla 1 egg; aynı egg run içinde tekrar yok; kayıt sınırlı', () => {
  const core = newCore();
  core.newRun('EGGLONG');
  const bot = createBot(core, { rngSeed: 4, endless: 200 });
  const at = [];
  let steps = 0;
  while (bot.step()) {
    const run = core.run;
    if (run && !run.ended) {
      run.ship.hull = 9999;
      const cur = run.voyage?.current;
      if (cur && Egg.isEgg(cur.id) && !at.some((a) => a.id === cur.id)) at.push({ id: cur.id, h: run.stats.harborsReached, endless: run.x1.endless.on });
    }
    if (++steps > 400000) throw new Error('takıldı');
  }
  assert.ok(core.run.x1.endless.extra >= 200);
  assert.equal(new Set(at.map((a) => a.id)).size, at.length, 'tekrar yok');
  const e = at.filter((a) => a.endless);
  for (let i = 1; i < e.length; i++) assert.ok(e[i].h - e[i - 1].h >= Egg.ENDLESS_WINDOW, `pencere ${e[i - 1].h}→${e[i].h}`);
  assert.ok(at.length >= 2, `uzun seferde egg sayısı ${at.length}`);
  assert.ok(JSON.stringify(core.run).length < 400000);
});

test('T12: deterministik — aynı seed + kararlar aynı egg/ödül; egg akışı eski seçim zarını tüketmez', () => {
  const play = () => { const c = newCore(); c.newRun('EGGDET7'); createBot(c, { rngSeed: 9 }).playRun(); return JSON.stringify([c.run.seenEvents, c.run.gold, c.run.ship.hull, c.run.xp.total]); };
  assert.equal(play(), play());
  // egg yerleşimi yalnız ayrı akıştan: kuyruk dışındaki gameplay rng durumu aynı kalır
  const c = newCore(); c.newRun('EGGISO');
  const s0 = c.rng.getState();
  const q = [{ id: 'EVT_M_05', src: 'normal' }, { id: 'EVT_F_01', src: 'normal' }];
  for (let i = 0; i < 50; i++) Egg.scheduleEgg(c.G, q.map((x) => ({ ...x })), { region: 3 }, i, 'H' + i);
  assert.equal(c.rng.getState(), s0);
});

test('T13: v7 kayıt — egg Codex keşfi kalıcı; dışa/içe aktarma iki kez aynı; eski kayıt (eggLast yok) sorunsuz', () => {
  const s = memoryStorage();
  const a = new GameCore(s);
  a.meta.tutorialDone = true;
  a.newRun('EGGSAVE');
  startAt(a, 'EVT_EGG_046');
  assert.ok(a.choose('o0').ok);
  const res = a.host().current.result;
  assert.ok(res.lines.some((l) => /Gizli bir deniz hikâyesi keşfedildi \(1\/23\)/.test(l.text)));
  assert.equal(Egg.eggProgress(a.meta), 1);
  delete a.run.x3.eggLast;
  a.persist();
  const b = new GameCore(s);
  assert.equal(b.run.v, 7);
  assert.ok(b.meta.codex.events.EVT_EGG_046);
  assert.ok(Egg.eggAllowed(b.run) === false || b.run.seenEvents.includes('EVT_EGG_046'));
  const ex = b.saves.parseImport(b.saves.exportString(b.meta, b.run, b.settings));
  const ex2 = b.saves.parseImport(b.saves.exportString(ex.meta, ex.run, null));
  assert.deepEqual(ex2.meta.codex.events, ex.meta.codex.events);
  assert.ok(ex2.meta.codex.events.EVT_EGG_046);
  // ikinci keşif bildirimi yok
  const c2 = newCore(); c2.meta.codex.events.EVT_EGG_046 = true; c2.newRun('EGGS2');
  startAt(c2, 'EVT_EGG_046');
  assert.ok(c2.choose('o1').ok);
  assert.ok(!c2.host().current.result.lines.some((l) => /keşfedildi/.test(l.text)));
});

test('Kopuzun rüzgârı: sonraki uygun denemeye bir kez +5, yığılmaz', () => {
  const c = newCore(); c.newRun('EGGKOPUZ');
  startAt(c, 'EVT_EGG_116');
  assert.ok(c.choose('o0').ok);
  assert.equal(c.run.x2.chanceOnce.filter((x) => x.label === 'Kopuzun rüzgârı').length, 1);
  const ev = EVENT_BY_ID.EVT_X3_D03;
  const v = Events.evalOption(c.G, ev, ev.options[0], {});
  assert.ok(v.breakdown.some((b) => b.label === 'Kopuzun rüzgârı' && b.v === 5));
});
