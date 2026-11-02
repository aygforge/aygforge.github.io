// Veri bütünlüğü + referans + edinim + ilerleme (deadlock) doğrulaması. Boot'ta ve testlerde çalışır.
(function (D) {
  'use strict';
  function run() {
    const errors = [], warn = [], facts = {};
    const err = (m) => errors.push(m);
    const FS = D.FishDBSource, IS = D.ItemDBSource;
    const FISH = FS.FishDB, ITEM = IS.ItemDB;
    // ---- FishDB ----
    const fishIds = Object.keys(FISH);
    facts.fishCount = fishIds.length;
    if (FS.count !== 88) err('FishDBSource.count ≠ 88');
    if (fishIds.length !== 88) err('FishDB kayıt sayısı ' + fishIds.length);
    const expected = { EL: 11, TS: 10, PSK: 11, YK: 10, TB: 10, BKM: 10, KKD: 11, BG: 15 };
    const indexed = new Set();
    for (const [code, n] of Object.entries(expected)) {
      const list = FS.RegionFishIndex[code] || [];
      if (list.length !== n) err('RegionFishIndex.' + code + ' = ' + list.length + ' (beklenen ' + n + ')');
      const reg = FS.regions.find((r) => r.code === code);
      for (const id of list) {
        if (indexed.has(id)) err('Çift index: ' + id);
        indexed.add(id);
        const f = FISH[id];
        if (!f) { err('Index\'te olup DB\'de olmayan: ' + id); continue; }
        if (f.id !== id || f.regionCode !== code || f.region !== reg.name) err('ID/bölge uyuşmazlığı: ' + id);
      }
    }
    if (indexed.size !== 88) err('Index toplamı ' + indexed.size);
    const leg = fishIds.filter((id) => FISH[id].rarity === 'legendary'), boss = fishIds.filter((id) => FISH[id].rarity === 'boss');
    facts.legendary = leg.length; facts.boss = boss.length; facts.rarityNull = fishIds.filter((id) => FISH[id].rarity === null).length;
    if (leg.length !== 9) err('Legendary sayısı ' + leg.length);
    if (boss.length !== 1 || boss[0] !== 'BG_15') err('Boss BG_15 değil');
    for (const id of fishIds) {
      const b = D.FishBalanceDB[id];
      if (!b) { err('FishBalanceDB eksik: ' + id); continue; }
      if (FISH[id].rarity && b.rarity !== FISH[id].rarity) err('Kaynak rarity ezildi: ' + id);
      if (!D.RARITIES.includes(b.rarity)) err('Geçersiz rarity: ' + id);
      if (!D.BEHAVIORS.includes(b.behavior)) err('Geçersiz behavior: ' + id);
      for (const k of ['basePrice', 'stamina', 'strength', 'tensionSensitivity', 'escapeRate', 'escapePressure', 'sizeMin', 'sizeMax', 'startDistance', 'spawnWeight']) {
        if (typeof b[k] !== 'number' || !isFinite(b[k]) || b[k] <= 0) err('Geçersiz sayı ' + id + '.' + k + '=' + b[k]);
      }
      if (b.sizeMax <= b.sizeMin) err('Boy aralığı ' + id);
      if (FISH[id].basePrice !== null || FISH[id].stamina !== null) warn.push('Kaynakta sayısal değer var: ' + id);
    }
    const behSeen = new Set(Object.values(D.FishBalanceDB).map((b) => b.behavior));
    for (const bh of D.BEHAVIORS) if (!behSeen.has(bh)) err('Kullanılmayan davranış: ' + bh);
    const rarSeen = new Set(Object.values(D.FishBalanceDB).map((b) => b.rarity));
    for (const r of D.RARITIES) if (!rarSeen.has(r)) err('Kullanılmayan rarity: ' + r);
    // ---- ItemDB ----
    const itemIds = Object.keys(ITEM);
    facts.itemCount = itemIds.length;
    if (IS.count !== 102 || itemIds.length !== 102) err('ItemDB sayısı ' + itemIds.length);
    const catCount = {};
    for (const id of itemIds) { const c = ITEM[id].category; catCount[c] = (catCount[c] || 0) + 1; if (ITEM[id].id !== id) err('Item id uyuşmazlığı ' + id); }
    const expC = { special: 25, bait: 14, rod: 9, line: 4, hook: 4, float: 3, material: 18, chest: 10, key: 5, black_market_part: 6, currency: 3, permit: 1 };
    for (const [c, n] of Object.entries(expC)) {
      if (catCount[c] !== n) err('Kategori ' + c + ' = ' + catCount[c] + ' (beklenen ' + n + ')');
      if (IS.categories[c] !== n) err('categories sayacı ' + c);
    }
    if (Object.keys(catCount).length !== 12) err('Kategori sayısı ' + Object.keys(catCount).length);
    facts.categories = catCount;
    for (const id of itemIds) if (!D.ItemBalanceDB[id]) err('ItemBalanceDB eksik ' + id);
    for (let i = 1; i <= 25; i++) {
      const id = 'SPC_' + D.pad2(i);
      if (!D.Loadout.SPECIAL_HANDLERS[id]) err('Özel eşya handler yok: ' + id);
      if (!ITEM[id].effect) err('Kaynak effect yok: ' + id);
    }
    // ---- Referanslar ----
    const refs = [];
    const addRef = (id, where) => refs.push([id, where]);
    for (const r of Object.values(D.RecipeDB)) { r.materials.forEach((m) => addRef(m.id, r.id)); r.out.forEach((m) => addRef(m.id, r.id)); if (r.out.some((o) => r.materials.some((m) => m.id === o.id))) err('Kendine referans veren tarif: ' + r.id); }
    for (const [cid, c] of Object.entries(D.ChestDB)) { addRef(cid, 'ChestDB'); if (c.key) addRef(c.key, cid); (c.pool || []).concat(c.guaranteed || []).forEach((e) => { if (e.type === 'item') addRef(e.id, cid); if (e.type === 'cosmetic' && !D.CosmeticDB[e.id]) err('Kozmetik yok ' + e.id); }); }
    for (const t of Object.values(D.TrashDB)) t.out.forEach((o) => addRef(o.id, t.id));
    for (const l of D.BoatDB) l.materials.forEach((m) => addRef(m.id, 'Boat' + l.level));
    const sh = D.ShopDB;
    [].concat(sh.market.rods, sh.market.gear, sh.market.baits, sh.market.specials, sh.market.materials.map((m) => m.id), sh.zipirleone.parts, sh.zipirleone.specials, sh.zipirleone.baits.map((b) => b.id), sh.secretVenue.specials.map((x) => x.id)).forEach((id) => addRef(id, 'ShopDB'));
    for (const g of D.WheelDB.segments) { if (g.reward.id) addRef(g.reward.id, g.id); (g.reward.pool || []).forEach((id) => { if (id.startsWith('COS_')) { if (!D.CosmeticDB[id]) err('Kozmetik yok ' + id); } else addRef(id, g.id); }); }
    const rewardLists = [].concat(D.QuestDB.main.map((q) => q.rewards), D.QuestDB.story.map((c) => c.rewards), D.QuestDB.orders.map((o) => o.rewards), D.QuestDB.daily.map((d) => d.rewards), Object.values(D.QuestDB.collection.rewards).flatMap((r) => Object.values(r)), [D.QuestDB.collection.all]);
    for (const l of rewardLists) for (const r of l) { if (r.type === 'item' || r.type === 'chest') addRef(r.id, 'QuestDB'); if (r.type === 'cosmetic' && !D.CosmeticDB[r.id]) err('Kozmetik yok ' + r.id); }
    for (const o of D.QuestDB.orders) { if (o.spec.fishId && !FISH[o.spec.fishId]) err('Siparişte geçersiz fishId ' + o.id); if (!D.RegionDB[o.reg]) err('Sipariş bölgesi ' + o.id); }
    for (const [id, where] of refs) if (!ITEM[id]) err('Geçersiz itemId referansı: ' + id + ' (' + where + ')');
    for (const ch of D.QuestDB.story) for (const st of ch.steps) if (st.dlg && !D.DialogueDB[st.dlg]) err('Diyalog yok: ' + st.dlg);
    // ---- Edinim kaynakları ----
    const sources = {};
    const src = (id, s) => { (sources[id] = sources[id] || new Set()).add(s); };
    ['ROD_01', 'LINE_01', 'HOOK_01', 'FLOAT_01', 'BAIT_01', 'CUR_COIN'].forEach((id) => src(id, 'başlangıç'));
    [].concat(sh.market.rods, sh.market.gear, sh.market.baits, sh.market.specials, sh.market.materials.map((m) => m.id)).forEach((id) => src(id, 'Market'));
    [].concat(sh.zipirleone.parts, sh.zipirleone.specials, sh.zipirleone.baits.map((b) => b.id)).forEach((id) => src(id, 'Zıpırleone (Miyav)'));
    sh.secretVenue.specials.forEach((x) => src(x.id, 'Arka Oda'));
    src(sh.boatyard.permit.id, 'Tekne Atölyesi');
    for (const r of Object.values(D.RecipeDB)) { r.out.forEach((o) => src(o.id, 'Hasan: ' + r.id)); if (r.scrapOut) src('CUR_SCRAP', 'Hasan: eritme'); }
    for (const [cid, c] of Object.entries(D.ChestDB)) (c.pool || []).concat(c.guaranteed || []).forEach((e) => { if (e.type === 'item') src(e.id, cid); if (e.type === 'miyav') src('CUR_MIYAV', cid); if (e.type === 'scrap') src('CUR_SCRAP', cid); });
    for (const [cid, c] of Object.entries(D.ChestDB)) for (const reg of c.regions) if (reg !== '*') src(cid, 'Hazine: ' + reg); else src(cid, 'Hazine: tüm bölgeler');
    for (const t of Object.values(D.TrashDB)) t.out.forEach((o) => src(o.id, 'Çöp: ' + t.name));
    src('CUR_SCRAP', 'Fabrika: çöp ayrıştırma');
    for (const [reg, f] of Object.entries(D.FactoryDB.fishToMaterial)) f.base.concat(f.rareBonus).forEach((o) => src(o.id, 'Fabrika: ' + reg));
    for (const l of rewardLists) for (const r of l) { if (r.type === 'item' || r.type === 'chest') src(r.id, 'Görev ödülü'); if (r.type === 'miyav') src('CUR_MIYAV', 'Görev ödülü'); }
    for (const g of D.WheelDB.segments) { if (g.reward.id) src(g.reward.id, 'Çark'); (g.reward.pool || []).forEach((id) => src(id, 'Çark')); if (g.reward.type === 'miyav') src('CUR_MIYAV', 'Çark'); }
    const unobtainable = itemIds.filter((id) => !sources[id]);
    if (unobtainable.length) err('Edinilemeyen eşyalar: ' + unobtainable.join(', '));
    facts.sources = Object.fromEntries(itemIds.map((id) => [id, sources[id] ? [...sources[id]] : []]));
    // ---- İlerleme / deadlock: bir bölgeyi açan seviyenin materyalleri önceki bölgelerden gelmeli ----
    const order = (c) => D.RegionDB[c].order;
    const matRegions = {}; // materyal → elde edilebildiği en erken bölge sırası
    const setMin = (id, o) => { if (matRegions[id] == null || o < matRegions[id]) matRegions[id] = o; };
    for (const m of sh.market.materials) setMin(m.id, 1);
    for (const [reg, f] of Object.entries(D.FactoryDB.fishToMaterial)) f.base.concat(f.rareBonus).forEach((o) => setMin(o.id, order(reg)));
    for (const t of Object.values(D.TrashDB)) for (const o of t.out) { const regs = t.regions.includes('*') ? ['EL'] : t.regions; setMin(o.id, Math.min(...regs.map(order))); }
    for (const [cid, c] of Object.entries(D.ChestDB)) if (!c.key && !c.req) for (const e of c.pool) if (e.type === 'item') setMin(e.id, Math.min(...c.regions.map((r) => (r === '*' ? 1 : order(r)))));
    for (let pass = 0; pass < 4; pass++) for (const r of Object.values(D.RecipeDB)) {
      const reqO = Math.max(r.unlock && r.unlock.region ? order(r.unlock.region) : 1, ...r.materials.map((m) => (matRegions[m.id] == null ? 99 : matRegions[m.id])));
      for (const o of r.out) if (D.Inv.cat(o.id) === 'material') setMin(o.id, reqO);
    }
    facts.materialEarliestRegion = matRegions;
    for (const lvl of D.BoatDB) {
      for (const reg of lvl.unlocks) {
        for (const m of lvl.materials) {
          if (matRegions[m.id] == null) err('Tekne Sv.' + lvl.level + ' materyali hiçbir yerden gelmiyor: ' + m.id);
          else if (matRegions[m.id] >= order(reg)) err('DEADLOCK: Tekne Sv.' + lvl.level + ' (' + reg + ' açar) ' + m.id + ' ister ama o materyal en erken bölge #' + matRegions[m.id] + '\'den gelir.');
        }
      }
    }
    for (const r of Object.values(D.RecipeDB)) for (const m of r.materials) if (matRegions[m.id] == null) err('Tarif materyali kaynaksız: ' + r.id + ' → ' + m.id);
    // ---- Yapısal ----
    if (D.BoatDB.length !== 10) err('BoatDB 10 seviye değil');
    if (Object.keys(D.RegionDB).length !== 8) err('RegionDB 8 bölge değil');
    const regionUnlocks = D.BoatDB.flatMap((l) => l.unlocks);
    if (regionUnlocks.join(',') !== 'TS,PSK,YK,TB,BKM,KKD,BG') err('Bölge açılım sırası hatalı: ' + regionUnlocks.join(','));
    const titles = { tarcov: ['Rozetin Gölgesi', 'Miyav Puanı Meselesi', 'Resmi Uyarı', 'Kanıt Yok', 'Çark Döner'], zip: ['Sessiz Miyav Anlaşması', 'Yanlışlıkla Gizli Toplantı', 'Eksik Defter', 'Miyav Borcu', 'Kapının Arkasındaki Mekan'], komplo: ['Balıklar Normal Değil', 'Kasabanın Açısı Yanlış', 'Bizi İzliyorlar'] };
    for (const [chain, list] of Object.entries(titles)) {
      const got = D.QuestDB.story.filter((c) => c.chain === chain).sort((a, b) => a.no - b.no).map((c) => c.title);
      if (got.join('|') !== list.join('|')) err('Hikâye başlıkları hatalı: ' + chain);
    }
    if (!D.storyById.T5.onComplete.flags.wheelUnlocked || D.storyById.T5.onComplete.flags.secretVenue) err('T5 çarkı açmalı, mekanı açmamalı');
    if (!D.storyById.Z5.onComplete.flags.secretVenue) err('Z5 gizli mekanı açmalı');
    if (D.QuestDB.orders.length < 30) err('Sipariş şablonu < 30');
    facts.orders = D.QuestDB.orders.length; facts.daily = D.QuestDB.daily.length; facts.main = D.QuestDB.main.length;
    facts.trash = Object.keys(D.TrashDB).length; facts.cosmetics = Object.keys(D.CosmeticDB).length;
    return { ok: errors.length === 0, errors, warnings: warn, facts };
  }
  D.Validate = { run };
})(globalThis.DUMEN);
