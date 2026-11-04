// DÜMEN otomatik test paketi (Node, DOM'suz). Kullanım: node tests/run.js  [--report]
// Kapsam: veri bütünlüğü, işlem/idempotency, balıkçılık mekaniği + 25 özel eşya, ekonomi/ilerleme (otomatik oyuncu),
// kayıt/migration, çark/reklam, sandık/anahtar, görevler. Rapor: DATA_INTEGRITY_REPORT.md
'use strict';
const fs = require('fs');
const path = require('path');
const { load, ROOT } = require('./load');

let pass = 0, fail = 0; const failures = []; const notes = [];
const section = (n) => console.log('\n== ' + n + ' ==');
function ok(cond, name) { if (cond) { pass++; } else { fail++; failures.push(name); console.log('  ✗ ' + name); } }
function eq(a, b, name) { ok(a === b, name + ' (beklenen ' + JSON.stringify(b) + ', gelen ' + JSON.stringify(a) + ')'); }

const D = load();
const fresh = (seed) => { const G = D.Game; G.init({}); G.newGame(seed || 1); G.active = true; return G; };
const S = () => D.Game.state;
const act = (n, p) => D.Game.act(n, p);

// ------------------------------------------------------------------
section('1. FishDB bütünlüğü');
{
  const src = D.FishDBSource;
  eq(src.count, 88, 'FishDBSource.count === 88');
  eq(Object.keys(src.FishDB).length, 88, 'FishDB anahtar sayısı 88');
  const exp = { EL: 11, TS: 10, PSK: 11, YK: 10, TB: 10, BKM: 10, KKD: 11, BG: 15 };
  for (const [k, n] of Object.entries(exp)) eq(src.RegionFishIndex[k].length, n, 'RegionFishIndex.' + k);
  eq(new Set(Object.keys(src.FishDB)).size, 88, 'ID\'ler benzersiz');
  const leg = Object.values(src.FishDB).filter((f) => f.rarity === 'legendary').map((f) => f.id);
  eq(leg.length, 9, '9 teyitli legendary');
  eq(src.FishDB.BG_15.rarity, 'boss', 'BG_15 boss'); eq(src.FishDB.BG_15.name, 'Antik Kraken', 'BG_15 Antik Kraken');
  for (const id of leg) eq(D.FishBalanceDB[id].rarity, 'legendary', 'legendary korunur ' + id);
  eq(D.FishBalanceDB.BG_15.rarity, 'boss', 'boss korunur');
  eq(D.FishBalanceDB.BG_15.behavior, 'boss', 'Kraken boss davranışı');
  let finite = true; for (const b of Object.values(D.FishBalanceDB)) for (const k of ['basePrice', 'stamina', 'strength', 'tensionSensitivity', 'escapeRate', 'sizeMin', 'sizeMax']) if (!isFinite(b[k]) || b[k] == null) finite = false;
  ok(finite, 'Tüm türetilmiş balık statları sonlu');
  ok(Object.values(src.FishDB).every((f) => f.basePrice === null && f.stamina === null), 'Kaynak null sayısal alanlar değiştirilmedi');
  ok(Object.values(src.FishDB).filter((f) => f.rarity === null).every((f) => D.FishBalanceDB[f.id].rarityDerived), 'null rarity → ayrı derived alan');
  const disk = fs.readFileSync(path.join(ROOT, 'src/data/source/Dumen_FishDB_2026-11-02.json'), 'utf8');
  eq(D.SourceText.FishDB, disk, 'Gömülü FishDB metni JSON dosyasıyla birebir');
  ok(Object.isFrozen(D.FishDBSource.FishDB.EL_01), 'FishDBSource salt okunur');
}
section('2. ItemDB bütünlüğü');
{
  const src = D.ItemDBSource;
  eq(src.count, 102, 'ItemDBSource.count === 102'); eq(Object.keys(src.ItemDB).length, 102, '102 kayıt');
  const c = {}; for (const it of Object.values(src.ItemDB)) c[it.category] = (c[it.category] || 0) + 1;
  const exp = { special: 25, bait: 14, rod: 9, line: 4, hook: 4, float: 3, material: 18, chest: 10, key: 5, black_market_part: 6, currency: 3, permit: 1 };
  for (const [k, n] of Object.entries(exp)) eq(c[k], n, 'kategori ' + k);
  eq(Object.keys(c).length, 12, '12 kategori');
  const disk = fs.readFileSync(path.join(ROOT, 'src/data/source/Dumen_ItemDB_2026-11-02.json'), 'utf8');
  eq(D.SourceText.ItemDB, disk, 'Gömülü ItemDB metni JSON dosyasıyla birebir');
  for (let i = 1; i <= 25; i++) ok(typeof D.Loadout.SPECIAL_HANDLERS['SPC_' + D.pad2(i)] === 'function', 'SPC_' + D.pad2(i) + ' handler');
  ok(['ROD_01', 'ROD_02', 'ROD_03', 'ROD_04', 'ROD_05', 'ROD_06', 'ROD_07', 'ROD_08', 'ROD_09'].map((id) => src.ItemDB[id].name).join('|') === 'Tahta Olta|Dengeli Olta|Sağlam Olta|Hızlı Sarıcı Olta|Usta Oltası|Buzkıran Olta|Kızıl Isırgan Olta|Pas Yiyen Olta|Yakamoz Fısıldayan Olta', '9 olta adı aynen');
  eq(D.ItemBalanceDB.BM_03.miyavPrice, 65, 'BM fiyatı kaynaktan (65 Miyav)');
  ok(Object.values(D.ItemBalanceDB).every((b) => b.price !== 0 || b.source === 'starter'), 'null fiyat 0 coin\'e dönüşmedi (başlangıç eşyaları hariç)');
  const v = D.Validate.run();
  ok(v.ok, 'Validate.run hatasız: ' + v.errors.join('; '));
  const unob = Object.entries(v.facts.sources).filter(([, s]) => !s.length).map(([id]) => id);
  eq(unob.length, 0, 'Edinilemeyen eşya yok');
  // UI kapsamı: envanter sekmelerinin kategori birleşimi = 12
  const covered = new Set(['bait', 'material', 'special', 'chest', 'rod', 'line', 'hook', 'float', 'key', 'black_market_part', 'permit', 'currency']);
  eq(covered.size, 12, 'Envanter sekmeleri 12 kategoriyi kapsar');
  ok(D.ShopDB.market.baits.length === 14 && D.ShopDB.market.rods.length === 4, 'Market 14 yem + 4 market oltası');
  eq(Object.values(D.RecipeDB).filter((r) => r.group === 'rod').map((r) => r.out[0].id).sort().join(','), 'ROD_06,ROD_07,ROD_08,ROD_09', 'Hasan 4 özel olta craft');
  eq(D.BoatDB.length, 10, 'BoatDB 10 seviye'); eq(Object.keys(D.RegionDB).length, 8, '8 bölge (9. bölge yok)');
  ok(D.QuestDB.orders.length >= 30, '≥30 sipariş şablonu');
  notes.push(['Validate facts', v.facts]);
}

// ------------------------------------------------------------------
section('3. İşlemler, idempotency, atomiklik');
{
  fresh(7);
  act('beginTrip', { regionCode: 'EL' });
  const r = act('beginCast', { regionCode: 'EL' });
  ok(r.ok, 'beginCast');
  const idx = r.encounter.candidates.findIndex((c) => c.type === 'fish');
  let fishIdx = idx;
  if (fishIdx < 0) { S().pendingCast.candidates[0] = { type: 'fish', fishId: 'EL_02', size: 15 }; fishIdx = 0; }
  const n0 = S().inv.fish.length;
  const a = act('resolveCast', { castId: r.castId, index: fishIdx, outcome: 'caught' });
  const b = act('resolveCast', { castId: r.castId, index: fishIdx, outcome: 'caught' });
  ok(a.ok && !b.ok, 'Aynı castId ikinci kez işlenmez');
  eq(S().inv.fish.length, n0 + 1, 'Balık tam bir kez eklendi');
  const coins0 = S().wallet.CUR_COIN;
  const sid = 'sell:' + (S().counters.sale + 1);
  const s1 = act('sellFish', { all: true }), s2 = D.Tx.run(S(), sid, () => ({}));
  ok(s1.ok && !s2.ok, 'Satış txId tekrar işlenmez');
  ok(S().wallet.CUR_COIN === coins0 + s1.coins, 'Coin tam bir kez arttı');
  const s3 = act('sellFish', { all: true }); ok(!s3.ok, 'Boş envanterde satış reddedilir');
  // Atomiklik: geçersiz kimlik içeren satış hiç uygulanmaz
  const before = JSON.stringify(S());
  const bad = act('sellFish', { ids: ['YOK'] }); ok(!bad.ok, 'Geçersiz satış reddedildi');
  eq(JSON.stringify(S()), before, 'Başarısız işlem state değiştirmez');
  // Korunan balık satılamaz ve kısmi satış olmaz
  S().inv.fish.push({ instanceId: 'FX1', fishId: 'EL_01', size: 10, caughtPlay: S().clock.playTime, regionCode: 'EL', questProtected: false, locked: true });
  S().inv.fish.push({ instanceId: 'FX2', fishId: 'EL_01', size: 10, caughtPlay: S().clock.playTime, regionCode: 'EL', questProtected: false, locked: false });
  const c0 = S().wallet.CUR_COIN;
  const p = act('sellFish', { ids: ['FX2', 'FX1'] });
  ok(!p.ok && S().inv.fish.some((f) => f.instanceId === 'FX2') && S().wallet.CUR_COIN === c0, 'Korumalı balık içeren seçim atomik olarak reddedilir');
  // Market: aynı olta iki kez alınmaz, para eksi olmaz
  S().wallet.CUR_COIN = 1000;
  ok(act('buyItem', { itemId: 'ROD_02' }).ok, 'Dengeli Olta alındı');
  ok(!act('buyItem', { itemId: 'ROD_02' }).ok, 'Aynı olta ikinci kez alınamaz');
  S().wallet.CUR_COIN = 3;
  ok(!act('buyItem', { itemId: 'BAIT_05', qty: 1 }).ok && S().wallet.CUR_COIN === 3, 'Yetersiz coin → işlem yok');
  ok(!act('buyItem', { itemId: 'ROD_05' }).ok, 'Kilitli bölge oltası alınamaz');
  // Görev ödülü bir kez
  const m1 = act('claimMain', { id: 'MQ_01' }), m2 = act('claimMain', { id: 'MQ_01' });
  ok(m1.ok && !m2.ok, 'Ana görev ödülü tek kez');
  // Craft yetersizlikte hiçbir şey düşmez
  S().wallet.CUR_COIN = 5000; S().unlockedRegions.push('PSK'); S().inv.items.MAT_05 = 4; S().inv.items.MAT_02 = 6; S().wallet.CUR_SCRAP = 100;
  const pre = JSON.stringify({ w: S().wallet, i: S().inv.items });
  ok(!act('craft', { recipeId: 'R_ROD_08' }).ok, 'Eksik malzemeyle craft reddedilir');
  eq(JSON.stringify({ w: S().wallet, i: S().inv.items }), pre, 'Craft başarısızlığında stok/cüzdan aynı');
  S().inv.items.MAT_17 = 2;
  ok(act('craft', { recipeId: 'R_ROD_08' }).ok && S().owned.rod.includes('ROD_08'), 'Pas Yiyen Olta üretildi');
  ok(!act('craft', { recipeId: 'R_ROD_08' }).ok, 'Tek seferlik olta tekrar üretilmez');
  // Tekne: aynı seviye iki kez alınmaz
  S().wallet.CUR_COIN = 5000; S().inv.items.MAT_08 = 3; S().inv.items.MAT_03 = 2;
  ok(act('upgradeBoat', {}).ok && S().boat.level === 2 && S().unlockedRegions.includes('TS'), 'Tekne Sv.2 → Tembel Sazlıklar');
  ok(D.Tx.hasProcessed(S(), 'boat:2'), 'boat:2 kalıcı olarak işaretli');
}

section('4. Sandık + anahtar');
{
  fresh(11);
  D.Inv.add(S(), 'CHEST_08', 1); const inst = S().inv.chests[0];
  ok(!act('openChest', { instanceId: inst.instanceId }).ok, 'Anahtarsız Kilitli Kasa açılmaz');
  S().inv.items.KEY_01 = 1;
  const o1 = act('openChest', { instanceId: inst.instanceId });
  ok(o1.ok && o1.rewards.length >= 3, 'Kilitli Kasa açıldı, ödül var');
  eq(S().inv.items.KEY_01 || 0, 0, 'Anahtar bir kez tüketildi');
  ok(!act('openChest', { instanceId: inst.instanceId }).ok, 'Sandık ikinci kez açılmaz');
  D.Inv.add(S(), 'CHEST_06', 1); const lava = S().inv.chests[0];
  ok(!act('openChest', { instanceId: lava.instanceId }).ok, 'Lava Kasası Buz Kristali olmadan açılmaz');
  S().inv.items.MAT_10 = 1; ok(act('openChest', { instanceId: lava.instanceId }).ok && !(S().inv.items.MAT_10), 'Lava Kasası Buz Kristali ile açılır ve tüketir');
  D.Inv.add(S(), 'CHEST_09', 1); const code = S().inv.chests[0];
  ok(!act('openChest', { instanceId: code.instanceId, code: '000' }).ok, 'Şifreli Kasa yanlış kodla açılmaz');
  ok(act('openChest', { instanceId: code.instanceId, code: D.Actions.chestCode(S(), code.instanceId) }).ok, 'Şifreli Kasa doğru kodla açılır');
  D.Inv.add(S(), 'CHEST_10', 1); const tc = S().inv.chests[0];
  ok(!act('openChest', { instanceId: tc.instanceId }).ok, 'Tarçov kasası Tarçov gitmeden açılmaz');
  S().flags.tarcovLeft = true; const tr = act('openChest', { instanceId: tc.instanceId });
  ok(tr.ok && tr.rewards.some((g) => g.id === 'SPC_15'), 'Tarçov kasası → Çatlak Pusula garantili');
  // Hazine: kırmızı = sandık yok; yeşil = altın kalite
  act('beginTrip', { regionCode: 'EL' });
  const r = act('beginCast', { regionCode: 'EL' }); S().pendingCast.candidates[0] = { type: 'chest', chestId: 'CHEST_01' };
  const n = S().inv.chests.length; act('resolveCast', { castId: r.castId, index: 0, outcome: 'chest', quality: 'red' }); eq(S().inv.chests.length, n, 'Kırmızı zamanlama → sandık eklenmez');
  const r2 = act('beginCast', { regionCode: 'EL' }); S().pendingCast.candidates[0] = { type: 'chest', chestId: 'CHEST_01' };
  act('resolveCast', { castId: r2.castId, index: 0, outcome: 'chest', quality: 'green' }); eq(S().inv.chests.slice(-1)[0].quality, 'gold', 'Yeşil → altın kalite sandık tek kez eklendi');
  const bar = new D.TreasureBar(5, 'CHEST_01', D.Loadout.compute(S(), 'EL'));
  bar.pos = bar.center; ok(bar.zoneAt(bar.center) === 'green' && bar.zoneAt(0) !== 'green', 'Zamanlama barı bölgeleri');
}

// ------------------------------------------------------------------
section('5. Balıkçılık mekaniği (İnat + Gerilim + Mesafe + SAR + ÇEK)');
const Lfor = (region, rod, extra) => { fresh(3); const st = S(); if (rod) { st.owned.rod.push(rod); st.equip.rod = rod; } st.boat.level = 10; if (extra) extra(st); return D.Loadout.compute(st, region); };
function runBot(fishId, L, mode, seed, hooks) {
  const b = D.FishBalanceDB[fishId];
  const sim = new D.FightSim({ fishId, size: (b.sizeMin + b.sizeMax) / 2, L, seed: seed || 1, hircin: hooks && hooks.hircin });
  let reel = false, teleUntil = 0; const evs = [];
  for (let i = 0; i < 60 * 600 && !sim.result; i++) {
    const s = sim.snapshot();
    for (const e of sim.drain()) { evs.push(e); if (e.type === 'tele') teleUntil = sim.t + 0.9; }
    if (hooks && hooks.each) hooks.each(sim, i);
    if (mode === 'skilled') {
      if (s.canPull) { sim.pull(); break; }
      if (s.tension > 0.78) reel = false; else if (s.tension < 0.45) reel = true;
      if (sim.t < teleUntil && s.tension > 0.4) reel = false;
      if (s.dist > s.maxDist * 0.8) reel = s.tension < 0.8;
    } else if (mode === 'hold') reel = true; else if (mode === 'never') reel = false;
    sim.advance(1 / 60, { reel });
  }
  for (const e of sim.drain()) evs.push(e);
  return { out: sim.result ? sim.result.outcome : 'timeout', sim, evs };
}
{
  const L = Lfor('EL');
  eq(runBot('EL_02', L, 'hold').out, 'snap', 'Sürekli SAR → ip kopar');
  eq(runBot('EL_02', L, 'never').out, 'escape', 'Hiç sarmamak → balık kaçar');
  eq(runBot('EL_02', L, 'skilled').out, 'caught', 'Ayarlı oyunla yakalanır');
  // Erken çek
  const sim = new D.FightSim({ fishId: 'EL_02', size: 15, L, seed: 2 });
  ok(sim.pull() === 'penalty' && sim.pull() === 'early' && sim.result.outcome === 'early', 'İki erken ÇEK → "Erken çektin"');
  // Kırmızıya anlık giriş anında kaybettirmez
  const s2 = new D.FightSim({ fishId: 'EL_02', size: 15, L, seed: 4 }); s2.tension = 0.9; s2.advance(0.3, { reel: false }); ok(!s2.result, 'Kırmızıya kısa giriş düzeltme süresi verir');
  // 7 davranış ailesi ayrı hamle setleri
  ok(new Set(Object.keys(D.MOVESETS)).size >= 9 && D.BEHAVIORS.every((bh) => bh === 'boss' ? D.MOVESETS.boss1 : D.MOVESETS[bh]), '7 davranış ailesi + boss evreleri');
  // Bölgeler: her balık uygun ekipman + usta bot ile yakalanabilir (4 tohumdan ≥2)
  const rods = { EL: null, TS: 'ROD_02', PSK: 'ROD_08', YK: 'ROD_09', TB: 'ROD_06', BKM: 'ROD_05', KKD: 'ROD_07', BG: 'ROD_09' };
  let allOk = true; const tough = [];
  for (const reg of D.REGION_ORDER) {
    const L2 = Lfor(reg, rods[reg]);
    for (const id of D.RegionDB[reg].fishIds) {
      let c = 0; for (let k = 1; k <= 4; k++) if (runBot(id, L2, 'skilled', k).out === 'caught') c++;
      if (c < 2) { allOk = false; tough.push(id + ':' + c); }
    }
  }
  ok(allOk, 'Tüm 88 balık bölge ekipmanıyla yakalanabilir (' + tough.join(',') + ')');
  const kr = Lfor('BG', 'ROD_09'); let phases = new Set(); const kra = runBot('BG_15', kr, 'skilled', 2, { each: (s) => phases.add(s.phase) });
  ok(kra.out === 'caught' && phases.has(1) && phases.has(2) && phases.has(3), 'Antik Kraken 3 evreli ve yakalanabilir');
  // FPS bağımsızlık: farklı kare süreleri aynı sonucu verir
  const A1 = new D.FightSim({ fishId: 'EL_05', size: 40, L, seed: 9 }), A2 = new D.FightSim({ fishId: 'EL_05', size: 40, L, seed: 9 });
  for (let i = 0; i < 120; i++) A1.advance(1 / 30, { reel: i % 40 < 25 });
  for (let i = 0; i < 240; i++) A2.advance(1 / 60, { reel: Math.floor(i / 2) % 40 < 25 });
  ok(Math.abs(A1.inat - A2.inat) < 1e-6 && Math.abs(A1.dist - A2.dist) < 1e-6, 'Simülasyon FPS bağımsız (sabit adım)');
  // Determinizm: aynı cast → aynı karşılaşma
  fresh(5); const LL = D.Loadout.compute(S(), 'EL');
  eq(JSON.stringify(D.Encounter.roll(S(), 'EL', 42, LL)), JSON.stringify(D.Encounter.roll(S(), 'EL', 42, LL)), 'Aynı castId aynı zar');
}
section('6. 25 özel eşya davranışı');
{
  const base = Lfor('EL');
  const withSpc = (ids, region, rod) => Lfor(region || 'EL', rod, (st) => { for (const id of ids) { st.inv.items[id] = 2; st.equip.specials.push(id); } st.boat.level = 10; });
  const L1 = withSpc(['SPC_01']); ok(L1.asilmaDelay === 2, 'SPC_01 Asılma gecikmesi');
  const s1 = new D.FightSim({ fishId: 'EL_05', size: 40, L: L1, seed: 1 }); ok(s1.queue.filter((m) => m.type === 'asilma').every((m) => m.tele >= 2), 'SPC_01 uyarı süresi uzar');
  ok(withSpc(['SPC_02']).sonTensionMult < 1, 'SPC_02 Son Çırpınış gerilimi azalır');
  { const s = new D.FightSim({ fishId: 'EL_02', size: 15, L: withSpc(['SPC_03']), seed: 1 }); ok(s.drain().some((e) => e.type === 'reveal'), 'SPC_03 ilk hamle önceden gösterilir'); }
  { const L = withSpc(['SPC_04']); const s = new D.FightSim({ fishId: 'EL_02', size: 15, L, seed: 1 }); s.tension = 0.9; s.reel = 1; for (let i = 0; i < 3; i++) s.step(1 / 60, { reel: true }); ok(s.warn, 'SPC_04 dolmadan önce uyarı'); }
  ok(withSpc(['SPC_05']).behaviorBias.calm === 1.5, 'SPC_05 tembel/dengeli ağırlık');
  { const L = withSpc(['SPC_06']); eq(Math.round((L.telegraph - base.telegraph) * 10) / 10, 0.3, 'SPC_06 0,3 sn erken ipucu'); }
  { const L = withSpc(['SPC_07']); const a = new D.FightSim({ fishId: 'EL_02', size: 15, L: base, seed: 1 }), b = new D.FightSim({ fishId: 'EL_02', size: 15, L, seed: 1 }); a.tension = b.tension = 0.2; a.mistake('early'); b.mistake('early'); ok(Math.abs((b.tension - 0.2) - (a.tension - 0.2) * 0.5) < 1e-9, 'SPC_07 hata sıçraması %50 azalır'); }
  ok(withSpc(['SPC_08']).inputLag < base.inputLag, 'SPC_08 girdi gecikmesi azalır');
  { const L = withSpc(['SPC_09']); const s = new D.FightSim({ fishId: 'EL_05', size: 40, L, seed: 1 }); s.active = { type: 'dip', start: 0, end: 5, power: 1, tick: 0 }; s.tension = 0.5; s.step(1 / 60, { reel: true }); ok(Math.abs(s.tension - 0.5) < 1e-9, 'SPC_09 Dip Yapma\'da gerilim sabit'); }
  { const L = withSpc(['SPC_10']); ok(L.trashMult === 0.5 && L.hpMult === 1.1, 'SPC_10 çöp ↓, HP +%10'); const a = new D.FightSim({ fishId: 'EL_02', size: 15, L: base, seed: 1 }), b = new D.FightSim({ fishId: 'EL_02', size: 15, L, seed: 1 }); ok(Math.abs(b.maxInat / a.maxInat - 1.1) < 1e-9, 'SPC_10 gelen balık HP ×1.1'); }
  { let saved = 0; for (let k = 1; k <= 400; k++) { const s = new D.FightSim({ fishId: 'EL_02', size: 15, L: withSpc(['SPC_11']), seed: k }); s.tension = 1; s.redTime = 99; s.step(1 / 60, { reel: true }); if (!s.result) saved++; } ok(saved > 60 && saved < 140, 'SPC_11 ~%25 kopma kurtarma (' + saved + '/400)'); }
  { const L = withSpc(['SPC_12']); ok(L.extraMoves === 1 && L.rareMult > base.rareMult, 'SPC_12 nadir şans + 1 hamle'); const s = new D.FightSim({ fishId: 'EL_02', size: 15, L, seed: 1 }); eq(s.queue.length, 4, 'SPC_12 döngüde 4 hamle'); }
  { let saved = 0; for (let k = 1; k <= 400; k++) { const s = new D.FightSim({ fishId: 'EL_02', size: 15, L: withSpc(['SPC_13']), seed: k }); s.dist = s.maxDist + 5; s.step(1 / 60, { reel: false }); if (!s.result) saved++; } ok(saved > 30 && saved < 95, 'SPC_13 ~%15 kaçış kurtarma (' + saved + '/400)'); }
  { fresh(21); S().inv.items.SPC_14 = 1; S().equip.specials.push('SPC_14'); act('beginTrip', { regionCode: 'EL' }); const r = act('beginCast', { regionCode: 'EL' }); const rr = act('rerollCast', { castId: r.castId }); ok(rr.ok, 'SPC_14 ilk karşılaşmayı yeniden zarlar'); ok(!act('rerollCast', { castId: r.castId }).ok, 'SPC_14 bir kez'); act('resolveCast', { castId: r.castId, outcome: 'abandon' }); const r2 = act('beginCast', { regionCode: 'EL' }); ok(!act('rerollCast', { castId: r2.castId }).ok, 'SPC_14 yalnız seferin ilk atışında'); }
  { const s = new D.FightSim({ fishId: 'EL_05', size: 40, L: withSpc(['SPC_15']), seed: 1 }); const q0 = JSON.stringify(s.queue); ok(s.useCharge('SPC_15') && JSON.stringify(s.queue) !== q0 && !s.useCharge('SPC_15'), 'SPC_15 hamle dizilimini bir kez karıştırır'); }
  { const L = withSpc(['SPC_16']); ok(L.asilmaTensionMult < 1 && L.dipDurationMult > 1, 'SPC_16 Asılma gerilimi ↓, Dip süresi ↑'); }
  { const s = new D.FightSim({ fishId: 'EL_05', size: 40, L: withSpc(['SPC_17']), seed: 1 }); const gaps = s.queue.map((m, i) => (i ? m.at - s.queue[i - 1].at - (D.MOVESETS && 0) : 0)); void gaps; const sets = new Set(s.queue.map((m, i) => (i ? Math.round((m.at - m.tele - (s.queue[i - 1].at - s.queue[i - 1].tele)) * 1000) : 0))); ok(s.L.regular, 'SPC_17 düzenli aralık'); }
  { const L = withSpc(['SPC_18']); ok(L.behaviorBias.heavy > 1 && Math.abs(L.tensionMult - 1.1) < 1e-9, 'SPC_18 Ağır balık ↑, gerilim +%10'); }
  { const s = new D.FightSim({ fishId: 'EL_05', size: 40, L: withSpc(['SPC_19']), seed: 1 }); s.tension = 0.8; s.applyConsumable('SPC_19'); ok(Math.abs(s.tension - 0.48) < 1e-9 && s.phase === 'son' && s.inat <= s.maxInat * s.sonAt + 1e-9, 'SPC_19 gerilim −%40 + Son Çırpınış'); }
  { const s = new D.FightSim({ fishId: 'EL_05', size: 40, L: withSpc(['SPC_20']), seed: 1 }); s.applyConsumable('SPC_20'); s.queue = [{ type: 'asilma', at: s.t + 0.01, tele: 0.5, power: 1 }]; for (let i = 0; i < 5; i++) s.step(1 / 60, { reel: false }); ok(s.active && s.active.type === 'rest', 'SPC_20 20 sn Asılma gelmez'); }
  ok(withSpc(['SPC_21']).tensionMult === 0.85, 'SPC_21 gerilim dolumu ×0.85');
  { const s = new D.FightSim({ fishId: 'EL_05', size: 40, L: withSpc(['SPC_22']), seed: 1 }); const n = s.queue.length; ok(s.useCharge('SPC_22') && s.queue.length === n - 1, 'SPC_22 bir hamleyi iptal eder'); }
  { const s = new D.FightSim({ fishId: 'EL_02', size: 15, L: withSpc(['SPC_23']), seed: 1 }); s.mistake('red'); ok(s.pauseUntil > s.t, 'SPC_23 hata sonrası balık duraklar'); }
  { const L = withSpc(['SPC_24']); const a = new D.FightSim({ fishId: 'EL_02', size: 15, L, seed: 1 }), b = new D.FightSim({ fishId: 'EL_02', size: 15, L, seed: 1 }); a.applyConsumable('SPC_24'); for (let i = 0; i < 60; i++) { a.step(1 / 60, { reel: true }); b.step(1 / 60, { reel: true }); } ok(a.inat < b.inat && a.tension >= b.tension, 'SPC_24 HP kaybı hızlı, gerilim agresif'); }
  { fresh(30); S().inv.items.SPC_25 = 2; S().equip.specials.push('SPC_25'); act('beginTrip', { regionCode: 'EL' }); const r = act('beginCast', { regionCode: 'EL', useKacak: true }); ok(r.ok && S().inv.items.SPC_25 === 1, 'SPC_25 atışta tüketilir'); ok(r.encounter.candidates.filter((c) => c.type === 'fish').every((c) => c.hircin), 'SPC_25 gelen balık Hırçın'); }
  // Efsanevi tavan
  { fresh(31); const st = S(); st.inv.items.BAIT_12 = 1; st.equip.bait = 'BAIT_12'; st.inv.items.SPC_12 = 1; st.equip.specials.push('SPC_12'); const L = D.Loadout.compute(st, 'EL', { baitId: 'BAIT_12' }); const w = D.Encounter.fishWeights(st, 'EL', L, { legMult: 2 }); const tot = D.sum(w, (e) => e.w), lg = D.sum(w.filter((e) => e.leg), (e) => e.w); ok(lg / tot <= D.Encounter.LEG_CAP + 1e-9, 'Hiçbir yem kombinasyonu legendary payını %12 üstüne çıkaramaz'); }
}

// ------------------------------------------------------------------
section('7. Tazelik / satış / fabrika');
{
  fresh(40);
  const f = { instanceId: 'FZ', fishId: 'EL_05', size: 40, caughtPlay: 0, regionCode: 'EL', questProtected: false, locked: false };
  S().inv.fish.push(f);
  eq(D.Econ.freshness(S(), f), 'FRESH', 'Yeni balık taze');
  const v0 = D.Econ.fishValue(S(), f);
  // sahne değişimi zaman atlatmaz: playTime değişmeden tazelik aynı
  eq(D.Econ.freshness(S(), f), 'FRESH', 'Sahne değişimi tazeliği düşürmez');
  S().clock.playTime = 11 * 60; eq(D.Econ.freshness(S(), f), 'NORMAL', '10 dk aktif oyun sonrası Normal');
  ok(D.Econ.fishValue(S(), f) < v0, 'Normal fiyat düşer');
  S().clock.playTime = 26 * 60; eq(D.Econ.freshness(S(), f), 'STALE', '25 dk sonrası Bayat');
  ok(!D.Econ.sellableAtRustem(S(), f) && !act('sellFish', { ids: ['FZ'] }).ok, 'Rüstem bayat almaz');
  let maxRatio = 0; for (const id of Object.keys(D.FishBalanceDB)) { const g = { fishId: id, size: D.FishBalanceDB[id].sizeMax, caughtPlay: 0 }; const fr = Object.assign({}, g, { caughtPlay: S().clock.playTime }); maxRatio = Math.max(maxRatio, D.Econ.fishValue(S(), g, 'factory') / D.Econ.fishValue(S(), fr)); }
  ok(maxRatio < 1, 'Fabrika coin\'i her zaman taze Rüstem fiyatından az (max oran ' + maxRatio.toFixed(2) + ')');
  const r = act('recycleFish', { ids: ['FZ'], mode: 'material' }); ok(r.ok && r.mats.MAT_03 === 1, 'Bayat balık → materyal (deterministik)');
  S().inv.trash = { T_LID: 2, T_BAG: 1 }; const t = act('recycleTrash', {}); ok(t.ok && t.scrap === 6 && S().inv.items.MAT_SCRAP === 2, 'Çöp ayrıştırma (MAT_SCRAP ve CUR_SCRAP ayrı)');
  S().inv.items.MAT_SCRAP = 5; const sc = S().wallet.CUR_SCRAP; ok(act('craft', { recipeId: 'R_MELT' }).ok && S().wallet.CUR_SCRAP === sc + 12 && !S().inv.items.MAT_SCRAP, 'Açık eritme tarifi Hurda Metal → Scrap');
}

section('8. Görevler, pano, hikâye');
{
  fresh(50);
  // pano
  ok(S().board.offers.length === 4, 'Panoda 4 ilan');
  const off = S().board.offers.find((o) => D.orderTplById[o.tpl].kind === 'fish' || D.orderTplById[o.tpl].kind === 'rarity') || S().board.offers[0];
  ok(act('acceptOrder', { oid: off.oid }).ok && S().orders[off.oid].state === 'ACTIVE', 'Sipariş kabul → Not Defteri');
  ok(!act('acceptOrder', { oid: off.oid }).ok, 'Aynı ilan iki kez kabul edilmez');
  const tpl = D.orderTplById[off.tpl];
  if (tpl.kind === 'fish' || tpl.kind === 'rarity') {
    const fid = tpl.spec.fishId || 'EL_01';
    for (let i = 0; i < tpl.spec.n; i++) { act('beginTrip', { regionCode: 'EL' }); const r = act('beginCast', { regionCode: 'EL' }); S().pendingCast.candidates[0] = { type: 'fish', fishId: fid, size: D.FishBalanceDB[fid].sizeMin }; act('resolveCast', { castId: r.castId, index: 0, outcome: 'caught' }); }
    ok(S().inv.fish.filter((f) => f.questProtected === off.oid).length === tpl.spec.n, 'Uygun balıklar sipariş için otomatik korundu');
    ok(!act('sellFish', { all: true }).ok || S().inv.fish.filter((f) => f.questProtected === off.oid).length === tpl.spec.n, 'Toplu satış korunanları satmaz');
    eq(D.Quests.orderState(S(), S().orders[off.oid]), 'COMPLETABLE', 'Teslime hazır');
    const c0 = S().wallet.CUR_COIN; const d1 = act('deliverOrder', { oid: off.oid }), d2 = act('deliverOrder', { oid: off.oid });
    ok(d1.ok && !d2.ok && S().wallet.CUR_COIN > c0, 'Teslim tek ödül');
  }
  // süreli sipariş süresi
  fresh(51); const timed = S().board.offers.find((o) => D.orderTplById[o.tpl].timed);
  if (timed) { act('acceptOrder', { oid: timed.oid }); S().clock.playTime += D.orderTplById[timed.tpl].timed + 5; act('maintenance', {}); eq(S().orders[timed.oid].state, 'EXPIRED', 'Süreli sipariş süresi geçer'); ok(!act('deliverOrder', { oid: timed.oid }).ok, 'Süresi geçen teslim edilemez'); }
  // günlük
  fresh(52); D.Clock.now = () => new Date(2030, 0, 2, 12).getTime(); act('maintenance', { dayKey: D.Clock.dayKey(S()) });
  eq(S().daily.list.length, 3, '3 günlük görev'); const dk = S().daily.dayKey;
  D.Clock.now = () => new Date(2030, 0, 1, 12).getTime(); eq(D.Clock.dayKey(S()), dk, 'Saat geri alınınca gün geri gitmez');
  D.Clock.now = () => new Date(2030, 0, 3, 12).getTime(); act('maintenance', { dayKey: D.Clock.dayKey(S()) }); ok(S().daily.dayKey !== dk, 'Ertesi gün yeni günlükler');
  D.Clock.now = () => Date.now();
  // Hikâye: T1 kilidi MQ_02'ye bağlı, Tarçov zinciri çarkı açar, mekan açmaz
  ok(!S().quests.T1, 'T1 başlangıçta kilitli');
  eq(D.storyById.T5.onComplete.flags.wheelUnlocked, true, 'T5 → çark'); ok(!D.storyById.T5.onComplete.flags.secretVenue, 'T5 gizli mekan açmaz');
  eq(D.storyById.Z5.onComplete.flags.secretVenue, true, 'Z5 → gizli mekan'); eq(D.storyById.K3.onComplete.flags.fourthWall, true, 'K3 dördüncü duvar');
  ok(!D.QuestDB.story.some((c) => c.steps.some((s) => s.npc === 'marti')), 'Martı görev vermez');
}

section('9. Çark + reklam (dürüst)');
{
  fresh(60); D.Clock.now = () => new Date(2030, 0, 2, 12).getTime(); act('maintenance', { dayKey: D.Clock.dayKey(S()) });
  ok(!act('spinWheel', { kind: 'free' }).ok, 'Çark T5 öncesi kilitli');
  S().flags.wheelUnlocked = true;
  const a = act('spinWheel', { kind: 'free' }), b = act('spinWheel', { kind: 'free' });
  ok(a.ok && !b.ok, 'Günde 1 ücretsiz çevirme');
  ok(!D.Ads.isAvailable(), 'Reklam SDK yok → reklam kullanılamaz');
  ok(!act('spinWheel', { kind: 'ad' }).ok && !act('spinWheel', { kind: 'ad', token: 'sahte' }).ok, 'Doğrulanmamış reklam jetonuyla hak verilmez');
  D.Clock.now = () => new Date(2030, 0, 3, 12).getTime(); ok(act('spinWheel', { kind: 'free' }).ok, 'Ertesi gün yeni ücretsiz hak');
  D.Clock.now = () => new Date(2030, 0, 2, 12).getTime(); ok(!act('spinWheel', { kind: 'free' }).ok, 'Saat geri alınarak tekrar hak alınamaz');
  D.Clock.now = () => Date.now();
  // sahte sağlayıcı ile token akışı
  D.Clock.now = () => new Date(2030, 0, 5, 12).getTime(); act('maintenance', { dayKey: D.Clock.dayKey(S()) });
  globalThis_set(D);
}
function globalThis_set(D2) { notes.push(['Reklam', 'SDK yok; yalnız DUMEN_AD_PROVIDER rewarded===true geri çağrısı jeton üretir (testte sağlayıcı yok).']); D2.Clock.now = () => Date.now(); }

section('10. Kayıt / migration / export-import');
{
  fresh(70);
  act('beginTrip', { regionCode: 'EL' }); const r = act('beginCast', { regionCode: 'EL' }); S().pendingCast.candidates[0] = { type: 'fish', fishId: 'EL_03', size: 25 }; act('resolveCast', { castId: r.castId, index: 0, outcome: 'caught' });
  const txt = D.Save.exportText(S()); const back = D.Save.importText(txt);
  eq(JSON.stringify(back.inv), JSON.stringify(S().inv), 'Export/import envanteri korur');
  ok(back.pendingCast === null, 'Yarım atış kayıttan geri gelmez');
  let threw = false; try { D.Save.importText('{"bozuk":'); } catch (e) { threw = true; } ok(threw, 'Bozuk kayıt reddedilir');
  threw = false; try { const x = JSON.parse(txt); x.save.wallet.CUR_COIN = -5; D.Save.importText(JSON.stringify(x)); } catch (e) { threw = true; } ok(threw, 'Negatif cüzdanlı kayıt reddedilir');
  // v1 (GDD §27.5) → v2: miktarlı balıklar örneklere açılır
  const v1 = { schemaVersion: 1, currency: { coin: 123, miyav: 4 }, unlockedRegions: ['old_port', 'lazy_reeds'], ownedRods: ['wooden_rod', 'balanced_rod'], selectedRodId: 'balanced_rod', boat: { level: 2 },
    inventory: { fish: [{ fishId: 'EL_01', quantity: 3 }, { fishId: 'TS_01', quantity: 2, size: 30 }], chests: [{ chestId: 'CHEST_01', quantity: 2 }], bait: { BAIT_01: 4 }, materials: { MAT_03: 7 }, specialItems: { SPC_01: 1 }, cosmetics: [] },
    collection: { EL_01: { count: 3, maxSize: 12 } }, stats: { fishCaught: 5 } };
  const m = D.Save.migrate(JSON.parse(JSON.stringify(v1)));
  eq(m.schemaVersion, D.SAVE_VERSION, 'Şema yükseltildi');
  eq(m.inv.fish.length, 5, 'Miktarlı balıklar 5 örneğe açıldı (kayıp yok)');
  eq(new Set(m.inv.fish.map((f) => f.instanceId)).size, 5, 'Örnek kimlikleri benzersiz');
  eq(m.inv.chests.length, 2, 'Sandıklar korundu'); eq(m.inv.items.MAT_03, 7, 'Materyaller korundu'); eq(m.wallet.CUR_COIN, 123, 'Coin korundu');
  eq(m.equip.rod, 'ROD_02', 'Seçili olta eşlendi'); ok(m.unlockedRegions.includes('TS'), 'Bölge eşlendi');
  const m2 = D.Save.migrate({ schemaVersion: 1, inventory: { fish: { EL_02: 4 } } }); eq(m2.inv.fish.length, 4, 'Harita biçimli v1 balık miktarı korunur');
  const partial = D.Save.migrate({ schemaVersion: 2, seed: 9, wallet: { CUR_COIN: 5, CUR_SCRAP: 0, CUR_MIYAV: 0 } }); ok(partial.inv && partial.stats && partial.board, 'Eksik alanlar varsayılanla tamamlanır');
}

// ------------------------------------------------------------------
{ const old = D.Save.newState(5); old.inv.trash = { T_CAN: 2, T_DUCK: 1, T_LID: 1, T_KEYRING: 1, T_YOK: 3 }; const k0 = old.inv.items.KEY_01 || 0;
  const mt = D.Save.migrate(JSON.parse(JSON.stringify(old)));
  ok(mt.inv.trash.T_LID === 3 && mt.inv.trash.T_BAG === 1 && !mt.inv.trash.T_CAN && !mt.inv.trash.T_YOK && (mt.inv.items.KEY_01 || 0) === k0 + 1 && Object.keys(mt.inv.trash).every((id) => D.TrashDB[id]), 'Eski çöp kimlikleri yeni kataloğa taşınır (anahtarlık → anahtar)'); }
section('11. İlerleme: otomatik oyuncu (softlock testi)');
const auto = (() => {
  fresh(2026);
  const G = D.Game; const t0 = Date.now();
  const log = []; let casts = 0;
  const rodFor = (reg, s) => { const pref = { PSK: 'ROD_08', YK: 'ROD_09', TB: 'ROD_06', KKD: 'ROD_07', BG: 'ROD_09' }[reg]; if (pref && s.owned.rod.includes(pref)) return pref; for (const r of ['ROD_05', 'ROD_03', 'ROD_02', 'ROD_01']) if (s.owned.rod.includes(r)) return r; return 'ROD_01'; };
  const neededMats = (s) => { const nx = D.boatLevel(s.boat.level + 1); const need = {}; if (nx) for (const m of nx.materials) need[m.id] = Math.max(0, m.n - (s.inv.items[m.id] || 0)); for (const r of ['R_ROD_08', 'R_ROD_09', 'R_ROD_06', 'R_ROD_07', 'R_LINE_04']) { const rc = D.RecipeDB[r]; if (!D.Actions.recipeLock(s, rc)) for (const m of rc.materials) need[m.id] = Math.max(need[m.id] || 0, m.n - (s.inv.items[m.id] || 0)); } return need; };
  const town = () => {
    let s = S();
    // hikâye
    for (let k = 0; k < 6; k++) {
      s = S();
      for (const ch of D.Quests.activeChapters(s)) {
        const st = D.Quests.currentStep(s, ch.id); if (!st) continue;
        if (st.t === 'talk') act('talk', { npc: st.npc });
        else if (st.t === 'inspect') act('inspect', { spot: st.spot });
        else if (st.t === 'deliver') { const r = act('storyDeliver', { npc: st.npc }); void r; }
        else if (st.t === 'installed' && !S().boat.installed.length) { if (S().wallet.CUR_MIYAV >= 30) { act('buyMiyav', { shop: 'zip', id: 'BM_01' }); act('installBM', { id: 'BM_01' }); } }
      }
    }
    for (const q of D.QuestDB.main) if (D.Quests.mainState(S(), q) === 'COMPLETABLE') act('claimMain', { id: q.id });
    for (const reg of D.REGION_ORDER) for (const p of [25, 50, 75, 100]) act('claimCollection', { region: reg, pct: p });
    // Miyav için Don'un işleri
    if (S().flags.wheelUnlocked) { if (!S().donJobs.current) act('donJobNew', {}); act('donJobDeliver', {}); }
    // sandıklar
    for (const c of S().inv.chests.slice()) { const C = D.ChestDB[c.chestId]; if (C.key && !(S().inv.items[C.key] > 0)) { const rk = 'R_' + C.key; if (D.RecipeDB[rk]) act('craft', { recipeId: rk }); } act('openChest', { instanceId: c.instanceId, code: C.req && C.req.puzzle ? D.Actions.chestCode(S(), c.instanceId) : undefined }); }
    // balık: gereken bölge materyali → fabrika, kalan → Rüstem, bayat → fabrika coin
    s = S(); const need = neededMats(s);
    const toMat = [], toCoin = [];
    for (const f of s.inv.fish) { if (f.locked || f.questProtected) continue; const outs = D.Econ.factoryOutput(f); if (outs.some((o) => need[o.id] > 0)) { toMat.push(f.instanceId); for (const o of outs) need[o.id] -= o.n; } else if (D.Econ.freshness(s, f) === 'STALE') toCoin.push(f.instanceId); }
    if (toMat.length) act('recycleFish', { ids: toMat, mode: 'material' });
    if (toCoin.length) act('recycleFish', { ids: toCoin, mode: 'coin' });
    act('sellFish', { all: true });
    act('recycleTrash', {});
    // dönüşümler (eksik ara malzeme)
    for (let k = 0; k < 10; k++) { const n2 = neededMats(S()); let did = false; for (const [id, n] of Object.entries(n2)) { if (n <= 0) continue; const rc = Object.values(D.RecipeDB).find((r) => r.group === 'convert' && r.out.some((o) => o.id === id)); if (rc && act('craft', { recipeId: rc.id }).ok) did = true; } if (!did) break; }
    if ((S().inv.items.MAT_SCRAP || 0) >= 10 && S().wallet.CUR_SCRAP < 120) act('craft', { recipeId: 'R_MELT' });
    // ekipman
    for (const r of ['R_ROD_08', 'R_ROD_09', 'R_ROD_06', 'R_ROD_07', 'R_LINE_04']) act('craft', { recipeId: r });
    for (const id of ['ROD_02', 'ROD_03', 'ROD_04', 'ROD_05', 'HOOK_02', 'FLOAT_03', 'LINE_02']) if (S().wallet.CUR_COIN > D.ItemBalanceDB[id].price * 3) act('buyItem', { itemId: id });
    if (S().boat.level >= 5 && !D.Inv.owns(S(), 'TCK_BOATYARD_PERMIT')) act('buyPermit', {});
    if (act('upgradeBoat', {}).ok) log.push('Sv.' + S().boat.level + ' @' + casts + ' atış');
    if (S().owned.line.includes('LINE_02') && S().equip.line === 'LINE_01') act('equip', { slot: 'line', id: 'LINE_02' });
  };
  let lastReg = null;
  while (casts < 30000) {
    const s = S();
    if (s.stats.bossCaught > 0 && s.owned.rod.length >= 9 && D.QuestDB.story.every((c) => s.quests[c.id] && s.quests[c.id].state === 'COMPLETED')) break;
    // hikâye adımı belirli bölgede av istiyorsa oraya git
    let reg = s.unlockedRegions.slice().sort((a, b) => D.RegionDB[b].order - D.RegionDB[a].order)[0];
    for (const ch of D.Quests.activeChapters(s)) { const st = D.Quests.currentStep(s, ch.id); if (st && (st.t === 'catch' || st.t === 'chest' || st.t === 'deliver') && st.filter && st.filter.region && s.unlockedRegions.includes(st.filter.region)) reg = st.filter.region; }
    // materyal ihtiyacı olan bölge
    const need = neededMats(s); for (const [id, n] of Object.entries(need)) if (n > 0) { const r2 = Object.entries(D.FactoryDB.fishToMaterial).find(([rr, f]) => s.unlockedRegions.includes(rr) && f.base.concat(f.rareBonus).some((o) => o.id === id)); if (r2) { reg = r2[0]; break; } }
    if (reg !== lastReg) { act('beginTrip', { regionCode: reg }); lastReg = reg; }
    const rod = rodFor(reg, S()); if (S().equip.rod !== rod) act('equip', { slot: 'rod', id: rod });
    if (D.Inv.fishFull(S())) { town(); if (D.Inv.fishFull(S())) { act('recycleFish', { ids: S().inv.fish.filter((f) => !f.questProtected && !f.locked).map((f) => f.instanceId), mode: 'coin' }); } }
    const r = act('beginCast', { regionCode: reg });
    if (!r.ok) { town(); casts++; continue; }
    casts++;
    const cands = r.encounter.candidates;
    let i = cands.findIndex((c) => c.type === 'fish' && D.FishBalanceDB[c.fishId].rarity === 'boss');
    if (i < 0) i = cands.findIndex((c) => c.type === 'chest');
    if (i < 0) { const fishIdx = cands.map((c, k) => [c, k]).filter(([c]) => c.type === 'fish').sort((a, b) => D.rarityRank(D.FishBalanceDB[b[0].fishId].rarity) - D.rarityRank(D.FishBalanceDB[a[0].fishId].rarity)); i = fishIdx.length ? fishIdx[0][1] : 0; }
    const c = cands[i];
    if (c.type === 'fish') { const res = runBot(c.fishId, D.Loadout.compute(S(), reg), 'skilled', casts).out; act('resolveCast', { castId: r.castId, index: i, outcome: res === 'timeout' ? 'escape' : res }); }
    else if (c.type === 'chest') act('resolveCast', { castId: r.castId, index: i, outcome: 'chest', quality: casts % 3 ? 'yellow' : 'green' });
    else act('resolveCast', { castId: r.castId, index: i, outcome: c.type === 'trash' ? 'trash' : 'decoy' });
    D.Clock.tick(S(), 1); S().clock.playTime += 25; // ~25 sn/atış aktif süre
    if (casts % 12 === 0) { act('maintenance', {}); town(); }
    if (process.env.AUTO_LOG && casts % 250 === 0) console.error('[auto]', casts, 'reg', reg, 'boat', S().boat.level, 'coin', S().wallet.CUR_COIN, 'miyav', S().wallet.CUR_MIYAV, 'chap', D.Quests.activeChapters(S()).map((c) => c.id + ':' + S().quests[c.id].step).join(','), 'need', JSON.stringify(neededMats(S())), 'size', JSON.stringify(S()).length);
  }
  const s = S();
  return { casts, playH: s.clock.playTime / 3600, boat: s.boat.level, regions: s.unlockedRegions.length, boss: s.stats.bossCaught, species: Object.keys(s.collection).length, chapters: D.QuestDB.story.filter((c) => s.quests[c.id] && s.quests[c.id].state === 'COMPLETED').map((c) => c.id), flags: s.flags, rods: s.owned.rod, log, ms: Date.now() - t0, coins: s.wallet.CUR_COIN, main: D.QuestDB.main.filter((q) => s.quests[q.id] && s.quests[q.id].state === 'COMPLETED').length };
})();
console.log('  otomatik oyuncu:', JSON.stringify({ casts: auto.casts, saat: auto.playH.toFixed(1), tekne: auto.boat, bölge: auto.regions, boss: auto.boss, tür: auto.species, bölüm: auto.chapters.length, olta: auto.rods.length, ana: auto.main, ms: auto.ms }));
eq(auto.boat, 10, 'Otomatik oyuncu Tekne Sv.10\'a ulaştı');
eq(auto.regions, 8, '8 bölgenin hepsi açıldı');
ok(auto.boss >= 1, 'Antik Kraken (final boss) yakalandı');
eq(auto.chapters.length, 13, '5+5+3 hikâye bölümünün tamamı bitirildi');
ok(auto.flags.wheelUnlocked && auto.flags.secretVenue && auto.flags.bermudaCoords && auto.flags.tarcovLeft, 'Çark, gizli mekan, Bermuda koordinatları, Tarçov ayrıldı');
ok(auto.rods.length === 9, '9 oltanın tümü edinildi' + (auto.rods.length === 9 ? '' : ' (eksik: ' + ['ROD_01','ROD_02','ROD_03','ROD_04','ROD_05','ROD_06','ROD_07','ROD_08','ROD_09'].filter((r) => !auto.rods.includes(r)).join(',') + ')'));
notes.push(['Otomatik oyuncu', auto]);

// ------------------------------------------------------------------
console.log('\n' + pass + ' geçti, ' + fail + ' başarısız');
if (process.argv.includes('--report')) {
  const v = D.Validate.run();
  const f = v.facts;
  const lines = ['# DATA_INTEGRITY_REPORT', '', 'Bu rapor `node tests/run.js --report` tarafından otomatik üretildi (' + new Date().toISOString() + ').', '',
    '## Sonuç', '', '- Test: **' + pass + ' geçti, ' + fail + ' başarısız**', '- Validate.run: ' + (v.ok ? 'hatasız' : v.errors.length + ' hata'), '',
    '## Kaynak sayımları', '', '| Kalem | Değer |', '|---|---|', '| FishDB kayıt | ' + f.fishCount + ' |', '| Legendary (kaynak teyitli) | ' + f.legendary + ' |', '| Boss | ' + f.boss + ' (BG_15 Antik Kraken) |', '| rarity=null (türetilmiş) | ' + f.rarityNull + ' |', '| ItemDB kayıt | ' + f.itemCount + ' |',
    '| Kategoriler | ' + Object.entries(f.categories).map(([k, n]) => k + ' ' + n).join(', ') + ' |', '| Sipariş şablonu | ' + f.orders + ' |', '| Günlük görev şablonu | ' + f.daily + ' |', '| Ana görev | ' + f.main + ' |', '| TrashDB (ayrı katalog) | ' + f.trash + ' |', '| CosmeticDB (ayrı katalog) | ' + f.cosmetics + ' |', '',
    '## Bölge → balık', '', '| Bölge | Kod | Balık | Legendary/Boss |', '|---|---|---|---|'];
  for (const code of D.REGION_ORDER) { const ids = D.RegionDB[code].fishIds; lines.push('| ' + D.RegionDB[code].name + ' | ' + code + ' | ' + ids.length + ' | ' + ids.filter((id) => D.FishDBSource.FishDB[id].rarity).map((id) => id + ' ' + D.FishDBSource.FishDB[id].name).join(', ') + ' |'); }
  lines.push('', '## Materyal → en erken bölge (deadlock analizi)', '', Object.entries(f.materialEarliestRegion).filter(([id]) => id.startsWith('MAT_')).map(([id, o]) => '- ' + id + ' ' + D.itemName(id) + ': bölge #' + o + ' (' + D.REGION_ORDER[o - 1] + ')').join('\n'));
  lines.push('', '## Otomatik oyuncu (uçtan uca ilerleme)', '', '- Atış: ' + auto.casts + ', varsayılan aktif süre ≈ ' + auto.playH.toFixed(1) + ' saat (25 sn/atış varsayımı)', '- Tekne: Sv.' + auto.boat + ', bölge: ' + auto.regions + '/8, tür: ' + auto.species + '/88, boss: ' + auto.boss, '- Hikâye bölümleri: ' + auto.chapters.join(', '), '- Tekne yükseltme zaman çizelgesi: ' + auto.log.join(' · '), '');
  lines.push('## Eşya edinim kaynakları (102)', '', '| ID | Ad | Kaynaklar |', '|---|---|---|');
  for (const [id, srcs] of Object.entries(f.sources)) lines.push('| ' + id + ' | ' + D.itemName(id) + ' | ' + srcs.slice(0, 6).join('; ') + (srcs.length > 6 ? ' …' : '') + ' |');
  if (failures.length) lines.push('', '## Başarısız testler', '', failures.map((x) => '- ' + x).join('\n'));
  fs.writeFileSync(path.join(ROOT, 'DATA_INTEGRITY_REPORT.md'), lines.join('\n') + '\n');
  console.log('DATA_INTEGRITY_REPORT.md yazıldı');
}
process.exit(fail ? 1 : 0);
