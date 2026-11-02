// Tek yetkili eylem katmanı. Her eylem: txId(state, payload) + run(draft, payload, ctx).
// UI yalnız Game.act(ad, payload) çağırır; hesap yapmaz, kayıt mutasyonu yapmaz.
(function (D) {
  'use strict';
  const Inv = () => D.Inv, Q = () => D.Quests, E = () => D.Econ;
  const A = {};
  const def = (name, o) => { A[name] = o; };

  // ---------- yardımcılar ----------
  function syncRegions(s, ctx) {
    for (const code of D.REGION_ORDER) {
      if (s.unlockedRegions.includes(code)) continue;
      const u = D.RegionDB[code].unlock;
      if (s.boat.level >= u.boatLevel && (!u.flag || s.flags[u.flag])) {
        s.unlockedRegions.push(code);
        if (ctx) ctx.events.push({ type: 'region', text: 'Yeni bölge açıldı: ' + D.RegionDB[code].name + '!' });
      }
    }
  }
  function regionUnlockText(s, code) {
    const u = D.RegionDB[code].unlock; const miss = [];
    if (s.boat.level < u.boatLevel) miss.push('Tekne Seviye ' + u.boatLevel + ' (şu an ' + s.boat.level + ')');
    if (u.flag && !s.flags[u.flag]) miss.push('Bermuda koordinatları (Komplo Teorisyeni, 3. bölüm "Bizi İzliyorlar")');
    return miss;
  }
  function chestCode(s, instanceId) {
    const rng = D.RNG.forKey(s.seed, 'code:' + instanceId);
    return [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)].join('');
  }
  function unlockOk(s, ib) {
    if (ib.unlockRegion && !s.unlockedRegions.includes(ib.unlockRegion)) return 'Kilitli: ' + D.RegionDB[ib.unlockRegion].name + ' açılmalı.';
    if (ib.unlockFlag && !s.flags[ib.unlockFlag]) return 'Tezgâh altında… Kara Pazar Çarkı açılınca satışa çıkar.';
    return null;
  }
  function recipeLock(s, r) {
    if (r.unlock && r.unlock.region && !s.unlockedRegions.includes(r.unlock.region)) return D.RegionDB[r.unlock.region].name + ' açılmalı';
    if (r.oneTime && r.out.length && r.out.every((o) => D.Inv.owns(s, o.id) && ['rod', 'line', 'hook', 'float'].includes(D.Inv.cat(o.id)))) return 'Zaten sahipsin';
    if (r.oneTime && s.tx.once['craft:' + r.id]) return 'Zaten üretildi';
    return null;
  }
  function rollChest(s, instanceId, chestId, quality) {
    const C = D.ChestDB[chestId];
    const rng = D.RNG.forKey(s.seed, 'chestopen:' + instanceId);
    const out = [];
    for (const g of C.guaranteed || []) out.push(g);
    const rolls = C.rolls + (quality === 'gold' && C.rolls > 0 ? 1 : 0);
    for (let i = 0; i < rolls; i++) out.push(rng.weighted(C.pool.map((e) => ({ w: e.w, v: e }))));
    const tier = Math.max(1, s.unlockedRegions.length);
    return out.map((e) => {
      const n = e.min != null ? rng.int(e.min, e.max) : e.n;
      if (e.type === 'coin') return { type: 'coin', n: Math.round(n * (quality === 'gold' ? 1.25 : 1) * (C.regions[0] === '*' ? 0.7 + tier * 0.15 : 1)) };
      if (e.type === 'miyav') return { type: 'miyav', n };
      if (e.type === 'scrap') return { type: 'scrap', n };
      if (e.type === 'item') return { type: 'item', id: e.id, n };
      if (e.type === 'cosmetic') return { type: 'cosmetic', id: e.id };
      return null;
    }).filter(Boolean);
  }
  A.syncRegions = syncRegions; A.regionUnlockText = regionUnlockText; A.chestCode = chestCode; A.unlockOk = unlockOk; A.recipeLock = recipeLock;

  // ---------- SEFER / ATIŞ ----------
  def('beginTrip', {
    txId: (s) => 'trip:' + ((s.counters.trip || 0) + 1),
    run(s, p) {
      D.assert(s.unlockedRegions.includes(p.regionCode), 'Bu bölge kilitli: ' + regionUnlockText(s, p.regionCode).join(', '));
      s.counters.trip = (s.counters.trip || 0) + 1;
      s.trip = { id: s.counters.trip, regionCode: p.regionCode, firstCastId: null, rerollUsed: false, casts: 0 };
      if (s.pendingCast) s.pendingCast = null;
      return { tripId: s.trip.id };
    }
  });
  def('beginCast', {
    txId: (s) => 'castbegin:' + (s.counters.cast + 1),
    run(s, p, ctx) {
      const reg = p.regionCode;
      D.assert(s.unlockedRegions.includes(reg), 'Bu bölge kilitli.');
      D.assert(!Inv().fishFull(s), 'Ambar dolu (' + s.inv.fish.length + '/' + Inv().capacity(s) + '). Kasabada sat, fabrikaya ver ya da Envanter\'den balık bırak.', 'FULL');
      if (s.pendingCast) s.pendingCast = null; // yarım kalan atış iptal (ganimet yok)
      let baitId = null;
      if (p.useBait && s.equip.bait) {
        D.assert((s.inv.items[s.equip.bait] || 0) > 0, 'Seçili yem kalmadı: ' + D.itemName(s.equip.bait));
        baitId = s.equip.bait;
        Inv().remove(s, baitId, 1);
        s.stats.baitUsed += 1;
        Q().onEvent(s, { type: 'useBait' }, ctx);
      }
      let kacak = false;
      if (p.useKacak) {
        D.assert(s.equip.specials.includes('SPC_25') && (s.inv.items.SPC_25 || 0) > 0, 'Kaçak Yem takılı değil ya da kalmadı.');
        Inv().remove(s, 'SPC_25', 1); kacak = true;
      }
      s.counters.cast += 1; s.stats.casts += 1;
      const castId = s.counters.cast;
      if (s.trip) { s.trip.casts += 1; if (s.trip.firstCastId == null) s.trip.firstCastId = castId; }
      const L = D.Loadout.compute(s, reg, { baitId });
      const enc = D.Encounter.roll(s, reg, castId, L, { kacakYem: kacak });
      s.pendingCast = { castId, regionCode: reg, candidates: enc.candidates, noBait: !baitId, baitId, rerolled: false };
      return { castId, encounter: enc, baitId };
    }
  });
  def('rerollCast', {
    txId: (s, p) => 'reroll:' + p.castId,
    run(s, p) {
      const pc = s.pendingCast;
      D.assert(pc && pc.castId === p.castId, 'Atış bulunamadı.');
      D.assert(s.equip.specials.includes('SPC_14') && (s.inv.items.SPC_14 || 0) > 0, 'Şanslı Çorap takılı değil.');
      D.assert(s.trip && s.trip.firstCastId === p.castId && !s.trip.rerollUsed, 'Şanslı Çorap yalnız seferin ilk karşılaşmasında, bir kez çalışır.');
      s.trip.rerollUsed = true;
      const L = D.Loadout.compute(s, pc.regionCode, { baitId: pc.baitId });
      const enc = D.Encounter.roll(s, pc.regionCode, p.castId, L, { reroll: 1 });
      pc.candidates = enc.candidates; pc.rerolled = true;
      return { encounter: enc };
    }
  });
  def('useConsumable', {
    txId: (s, p) => 'use:' + p.castId + ':' + p.id,
    run(s, p) {
      D.assert(s.pendingCast && s.pendingCast.castId === p.castId, 'Mücadele bitti.');
      const ib = D.ItemBalanceDB[p.id];
      D.assert(ib && ib.kind === 'consumable' && s.equip.specials.includes(p.id), 'Bu eşya takılı değil.');
      Inv().remove(s, p.id, 1);
      return { id: p.id };
    }
  });
  def('resolveCast', {
    txId: (s, p) => 'cast:' + p.castId,
    run(s, p, ctx) {
      const pc = s.pendingCast;
      D.assert(pc && pc.castId === p.castId, 'Bu atış zaten sonuçlandı.', 'STALE_CAST');
      s.pendingCast = null;
      if (p.outcome === 'abandon') return { kind: 'abandon' };
      const c = pc.candidates[p.index];
      D.assert(c, 'Geçersiz hedef.');
      const res = { kind: c.type, outcome: p.outcome, regionCode: pc.regionCode, questLines: [] };
      if (c.type === 'fish') {
        D.assert(['caught', 'escape', 'snap', 'early'].includes(p.outcome), 'Geçersiz sonuç');
        if (p.outcome !== 'caught') {
          s.stats[p.outcome === 'escape' ? 'escapes' : p.outcome === 'snap' ? 'snaps' : 'earlyPulls'] += 1;
          res.fishId = c.fishId; // kaçan balığın adı yalnız keşfedildiyse gösterilir (UI)
          return res;
        }
        const f = { instanceId: Inv().newId(s, 'F'), fishId: c.fishId, size: c.size, caughtPlay: Math.round(s.clock.playTime * 10) / 10, regionCode: pc.regionCode, questProtected: false, locked: false, castId: p.castId };
        s.inv.fish.push(f);
        const b = D.FishBalanceDB[c.fishId];
        const est = E().fishValue(s, f, 'estimate');
        const col = s.collection[c.fishId];
        res.isNew = !col;
        res.isRecord = !!col && c.size > col.maxSize;
        if (!col) s.collection[c.fishId] = { count: 1, maxSize: c.size, maxValue: est, firstAt: Math.round(s.clock.playTime) };
        else { col.count += 1; if (c.size > col.maxSize) col.maxSize = c.size; if (est > col.maxValue) col.maxValue = est; }
        s.stats.fishCaught += 1;
        if (b.rarity === 'legendary') s.stats.legendaryCaught += 1;
        if (b.rarity === 'boss') s.stats.bossCaught += 1;
        Q().onEvent(s, { type: 'catch', fish: f, noBait: pc.noBait, everRed: !!p.everRed }, ctx);
        res.fish = D.clone(f); res.value = E().fishValue(s, f); res.estimate = est;
        if (f.questProtected) res.questLines.push('Görev için ayrıldı');
        return res;
      }
      if (c.type === 'chest') {
        D.assert(['green', 'yellow', 'red'].includes(p.quality), 'Geçersiz hazine sonucu');
        res.chestId = c.chestId; res.quality = p.quality;
        if (p.quality === 'red') { res.outcome = 'chestFail'; return res; }
        const q = p.quality === 'green' ? 'gold' : 'normal';
        Inv().add(s, c.chestId, 1, { quality: q, from: pc.regionCode });
        s.stats.chestsCaught += 1;
        if (q === 'gold') s.stats.greenTreasures += 1;
        Q().onEvent(s, { type: 'chest', regionCode: pc.regionCode, quality: q }, ctx);
        res.outcome = 'chest';
        return res;
      }
      if (c.type === 'trash') {
        s.inv.trash[c.trashId] = (s.inv.trash[c.trashId] || 0) + 1;
        s.stats.trashCaught += 1; res.trashId = c.trashId; res.outcome = 'trash';
        return res;
      }
      res.outcome = 'decoy';
      return res;
    }
  });

  // ---------- RÜSTEM ----------
  def('sellFish', {
    txId: (s) => 'sell:' + (s.counters.sale + 1),
    run(s, p, ctx) {
      const ids = p.all ? s.inv.fish.filter((f) => E().sellableAtRustem(s, f)).map((f) => f.instanceId) : (p.ids || []);
      D.assert(ids.length > 0, 'Satılacak uygun balık yok.');
      let total = 0;
      for (const id of new Set(ids)) {
        const i = s.inv.fish.findIndex((f) => f.instanceId === id);
        D.assert(i >= 0, 'Balık bulunamadı (zaten satılmış olabilir).');
        const f = s.inv.fish[i];
        D.assert(!f.questProtected, D.FishDBSource.FishDB[f.fishId].name + ' bir görev için ayrılmış.');
        D.assert(!f.locked, D.FishDBSource.FishDB[f.fishId].name + ' korumada (kilitli).');
        D.assert(E().freshness(s, f) !== 'STALE', 'Rüstem bayat balık almaz — Geri Dönüşüm Fabrikası\'na götür.');
        total += E().fishValue(s, f);
        s.inv.fish.splice(i, 1);
        s.stats.fishSold += 1;
      }
      s.counters.sale += 1;
      Inv().addWallet(s, 'CUR_COIN', total);
      s.npc.rel.rustem = Math.min(100, (s.npc.rel.rustem || 0) + Math.min(3, Math.ceil(ids.length / 5)));
      Q().onEvent(s, { type: 'sell', coins: total }, ctx);
      return { coins: total, count: ids.length };
    }
  });
  def('lockFish', { txId: (s, p) => 'lock:' + p.id + ':' + s.tx.count, run(s, p) { const f = s.inv.fish.find((x) => x.instanceId === p.id); D.assert(f, 'Balık yok'); f.locked = !!p.locked; return {}; } });
  def('releaseFish', {
    txId: (s, p) => 'release:' + p.id,
    run(s, p) {
      const i = s.inv.fish.findIndex((x) => x.instanceId === p.id); D.assert(i >= 0, 'Balık yok');
      D.assert(!s.inv.fish[i].questProtected, 'Görev için ayrılmış balık bırakılamaz (önce görevi bırak).');
      s.inv.fish.splice(i, 1); return {};
    }
  });

  // ---------- FABRİKA ----------
  def('recycleFish', {
    txId: (s) => 'recycle:' + (s.stats.recycled + 1) + ':' + s.tx.count,
    run(s, p, ctx) {
      const ids = p.ids || [];
      D.assert(ids.length > 0, 'Seçili balık yok.');
      let coins = 0; const mats = {};
      for (const id of new Set(ids)) {
        const i = s.inv.fish.findIndex((f) => f.instanceId === id);
        D.assert(i >= 0, 'Balık bulunamadı.');
        const f = s.inv.fish[i];
        D.assert(!f.questProtected && !f.locked, 'Korunan/görev balığı işlenemez.');
        if (p.mode === 'coin') coins += E().fishValue(s, f, 'factory');
        else for (const o of E().factoryOutput(f)) mats[o.id] = (mats[o.id] || 0) + o.n;
        s.inv.fish.splice(i, 1);
      }
      if (coins) Inv().addWallet(s, 'CUR_COIN', coins);
      for (const [id, n] of Object.entries(mats)) Inv().add(s, id, n);
      s.stats.recycled += ids.length;
      Q().onEvent(s, { type: 'recycle', n: ids.length }, ctx);
      return { coins, mats };
    }
  });
  def('recycleTrash', {
    txId: (s) => 'trash:' + s.stats.trashCaught + ':' + s.tx.count,
    run(s, p, ctx) {
      const entries = Object.entries(s.inv.trash).filter(([, n]) => n > 0);
      D.assert(entries.length, 'Ayrıştırılacak çöp yok.');
      const mats = {}; let scrap = 0, coin = 0, n = 0;
      for (const [id, cnt] of entries) {
        const t = D.TrashDB[id];
        for (const o of t.out) mats[o.id] = (mats[o.id] || 0) + o.n * cnt;
        scrap += D.FactoryDB.trashScrapEach * cnt; coin += (t.coin || 0) * cnt; n += cnt;
        s.inv.trash[id] = 0;
      }
      for (const [id, k] of Object.entries(mats)) Inv().add(s, id, k);
      Inv().addWallet(s, 'CUR_SCRAP', scrap); if (coin) Inv().addWallet(s, 'CUR_COIN', coin);
      s.stats.recycled += n;
      Q().onEvent(s, { type: 'recycle', n }, ctx);
      return { mats, scrap, coin, n };
    }
  });

  // ---------- MARKET ----------
  def('buyItem', {
    txId: (s, p) => 'buy:' + p.itemId + ':' + s.tx.count,
    run(s, p) {
      const ib = D.ItemBalanceDB[p.itemId];
      const shop = D.ShopDB.market;
      const matEntry = shop.materials.find((m) => m.id === p.itemId);
      const listed = shop.rods.includes(p.itemId) || shop.gear.includes(p.itemId) || shop.baits.includes(p.itemId) || shop.specials.includes(p.itemId) || matEntry;
      D.assert(ib && listed, 'Bu ürün markette yok.');
      const lock = unlockOk(s, ib); D.assert(!lock, lock);
      const qty = D.clamp(Math.floor(p.qty || 1), 1, 99);
      const gear = ['rod', 'line', 'hook', 'float'].includes(ib.category);
      if (gear) D.assert(!Inv().owns(s, p.itemId), 'Bu ekipmana zaten sahipsin.');
      const unit = matEntry ? matEntry.price : ib.price;
      D.assert(unit != null && unit > 0, 'Fiyat tanımsız.');
      const cost = unit * (gear ? 1 : qty);
      Inv().spendWallet(s, 'CUR_COIN', cost);
      Inv().add(s, p.itemId, gear ? 1 : qty);
      return { cost, qty: gear ? 1 : qty };
    }
  });
  def('buyMiyav', {
    txId: (s, p) => 'buym:' + p.shop + ':' + p.id + ':' + s.tx.count,
    run(s, p) {
      let price = null; let isCos = false;
      if (p.shop === 'zip') {
        D.assert(s.flags.wheelUnlocked || D.ShopDB.zipirleone.parts.includes(p.id), 'Don şimdilik satış yapmıyor.');
        if (D.ShopDB.zipirleone.parts.includes(p.id) || D.ShopDB.zipirleone.specials.includes(p.id)) price = D.ItemBalanceDB[p.id].miyavPrice;
        const b = D.ShopDB.zipirleone.baits.find((x) => x.id === p.id); if (b) price = b.miyav;
        if (D.ShopDB.zipirleone.specials.includes(p.id) || b) D.assert(s.flags.wheelUnlocked, 'Önce Tarçov hikâyesini bitir.');
      } else if (p.shop === 'venue') {
        D.assert(s.flags.secretVenue, 'Arka Oda kapalı.');
        const c = D.ShopDB.secretVenue.cosmetics.find((x) => x.id === p.id); if (c) { price = c.miyav; isCos = true; }
        const sp = D.ShopDB.secretVenue.specials.find((x) => x.id === p.id); if (sp) price = sp.miyav;
      }
      D.assert(price != null, 'Bu ürün burada satılmıyor.');
      if (isCos) {
        D.assert(!s.cosmetics.owned.includes(p.id), 'Zaten sahipsin.');
        Inv().spendWallet(s, 'CUR_MIYAV', price, 'kozmetik');
        s.cosmetics.owned.push(p.id);
        return { price };
      }
      if (D.Inv.cat(p.id) === 'black_market_part') D.assert(!s.boat.installed.includes(p.id) && !Inv().owns(s, p.id), 'Bu parçaya zaten sahipsin.');
      Inv().spendWallet(s, 'CUR_MIYAV', price, D.itemName(p.id));
      Inv().add(s, p.id, 1);
      return { price };
    }
  });

  // ---------- HASAN (craft) ----------
  def('craft', {
    txId: (s, p) => { const r = D.RecipeDB[p.recipeId]; return r && r.oneTime ? 'craft:' + p.recipeId : 'craft:' + p.recipeId + ':' + s.stats.crafted + ':' + s.tx.count; },
    once: (s, p) => !!(D.RecipeDB[p.recipeId] && D.RecipeDB[p.recipeId].oneTime),
    run(s, p) {
      const r = D.RecipeDB[p.recipeId];
      D.assert(r, 'Tarif yok');
      const lock = recipeLock(s, r); D.assert(!lock, lock);
      // önce yeterlilik, sonra hepsi tek seferde
      for (const m of r.materials) D.assert((s.inv.items[m.id] || 0) >= m.n, 'Eksik: ' + D.itemName(m.id) + ' (' + (s.inv.items[m.id] || 0) + '/' + m.n + ')', 'INSUFFICIENT');
      Inv().spendWallet(s, 'CUR_COIN', r.coin);
      Inv().spendWallet(s, 'CUR_SCRAP', r.scrap);
      for (const m of r.materials) Inv().remove(s, m.id, m.n);
      for (const o of r.out) Inv().add(s, o.id, o.n);
      if (r.scrapOut) Inv().addWallet(s, 'CUR_SCRAP', r.scrapOut);
      s.stats.crafted += 1;
      return { out: r.out, scrapOut: r.scrapOut || 0 };
    }
  });

  // ---------- TEKNE ATÖLYESİ ----------
  def('buyPermit', {
    txId: () => 'permit', once: () => true,
    run(s) {
      const P = D.ShopDB.boatyard.permit;
      D.assert(!Inv().owns(s, P.id), 'Tersane İzni zaten sende.');
      D.assert(s.boat.level >= P.requiresBoat, 'Tersane İzni için önce Tekne Sv.' + P.requiresBoat + ' gerekir.');
      for (const m of P.materials) D.assert((s.inv.items[m.id] || 0) >= m.n, 'Eksik: ' + D.itemName(m.id));
      Inv().spendWallet(s, 'CUR_COIN', P.coin);
      for (const m of P.materials) Inv().remove(s, m.id, m.n);
      Inv().add(s, P.id, 1);
      return {};
    }
  });
  def('upgradeBoat', {
    txId: (s) => 'boat:' + (s.boat.level + 1), once: () => true,
    run(s, p, ctx) {
      const next = D.boatLevel(s.boat.level + 1);
      D.assert(next, 'Tekne zaten en üst seviyede.');
      if (next.permit) D.assert(Inv().owns(s, 'TCK_BOATYARD_PERMIT'), 'Bu seviye için Tersane İzni gerekir.');
      for (const m of next.materials) D.assert((s.inv.items[m.id] || 0) >= m.n, 'Eksik: ' + D.itemName(m.id) + ' (' + (s.inv.items[m.id] || 0) + '/' + m.n + ')', 'INSUFFICIENT');
      Inv().spendWallet(s, 'CUR_COIN', next.cost);
      for (const m of next.materials) Inv().remove(s, m.id, m.n);
      s.boat.level = next.level;
      syncRegions(s, ctx);
      return { level: next.level };
    }
  });
  def('installBM', {
    txId: (s, p) => 'install:' + p.id, once: () => true,
    run(s, p, ctx) {
      D.assert(D.Inv.cat(p.id) === 'black_market_part', 'Bu bir kara pazar parçası değil.');
      D.assert(!s.boat.installed.includes(p.id), 'Zaten takılı.');
      Inv().remove(s, p.id, 1);
      s.boat.installed.push(p.id);
      Q().onEvent(s, { type: 'install' }, ctx);
      return {};
    }
  });

  // ---------- EKİPMAN ----------
  def('equip', {
    txId: (s, p) => 'equip:' + p.slot + ':' + (p.id || 'none') + ':' + s.tx.count,
    run(s, p) {
      if (['rod', 'line', 'hook', 'float'].includes(p.slot)) {
        D.assert(s.owned[p.slot].includes(p.id), 'Bu ekipmana sahip değilsin.');
        s.equip[p.slot] = p.id;
      } else if (p.slot === 'bait') {
        if (p.id) { D.assert(D.Inv.cat(p.id) === 'bait' && (s.inv.items[p.id] || 0) > 0, 'Bu yemden yok.'); }
        s.equip.bait = p.id || null;
      } else if (p.slot === 'special') {
        const i = s.equip.specials.indexOf(p.id);
        if (i >= 0) s.equip.specials.splice(i, 1);
        else {
          D.assert(D.Inv.cat(p.id) === 'special' && (s.inv.items[p.id] || 0) > 0, 'Bu eşyaya sahip değilsin.');
          D.assert(s.equip.specials.length < Inv().specialSlots(s), 'Özel eşya yuvaları dolu (' + Inv().specialSlots(s) + '). Önce birini çıkar.');
          s.equip.specials.push(p.id);
        }
      } else if (p.slot === 'cosmetic') {
        const c = p.id ? D.CosmeticDB[p.id] : null;
        if (c) { D.assert(s.cosmetics.owned.includes(p.id), 'Sahip değilsin.'); s.cosmetics.equipped[c.slot] = s.cosmetics.equipped[c.slot] === p.id ? null : p.id; }
      } else D.fail('Bilinmeyen yuva');
      return {};
    }
  });

  // ---------- SANDIK ----------
  def('openChest', {
    txId: (s, p) => 'chest:' + p.instanceId, once: () => true,
    run(s, p, ctx) {
      const i = s.inv.chests.findIndex((c) => c.instanceId === p.instanceId);
      D.assert(i >= 0, 'Sandık bulunamadı.');
      const inst = s.inv.chests[i];
      const C = D.ChestDB[inst.chestId];
      if (C.key) D.assert((s.inv.items[C.key] || 0) > 0, 'Gerekli anahtar yok: ' + D.itemName(C.key));
      if (C.req && C.req.item) D.assert((s.inv.items[C.req.item] || 0) >= C.req.n, C.req.text);
      if (C.req && C.req.flag) D.assert(s.flags[C.req.flag], C.req.text);
      if (C.req && C.req.puzzle) D.assert(String(p.code || '') === chestCode(s, inst.instanceId), 'Şifre yanlış.');
      if (C.key) Inv().remove(s, C.key, 1);
      if (C.req && C.req.item) Inv().remove(s, C.req.item, C.req.n);
      s.inv.chests.splice(i, 1);
      const rewards = rollChest(s, inst.instanceId, inst.chestId, inst.quality);
      const got = Inv().grant(s, rewards, { reason: D.itemName(inst.chestId) });
      s.stats.chestsOpened += 1;
      Q().onEvent(s, { type: 'openChest' }, ctx);
      return { chestId: inst.chestId, quality: inst.quality, rewards: got };
    }
  });

  // ---------- PANO / SİPARİŞ ----------
  def('acceptOrder', {
    txId: (s, p) => 'accept:' + p.oid, once: () => true,
    run(s, p) {
      const i = s.board.offers.findIndex((o) => o.oid === p.oid);
      D.assert(i >= 0, 'Bu ilan artık panoda değil.');
      const off = s.board.offers[i];
      const tpl = D.orderTplById[off.tpl];
      const activeN = Object.values(s.orders).filter((o) => o.state === 'ACTIVE').length;
      D.assert(activeN < 6, 'Not defterinde en fazla 6 aktif sipariş olabilir.');
      s.board.offers.splice(i, 1);
      s.orders[off.oid] = { oid: off.oid, tpl: off.tpl, state: 'ACTIVE', acceptedAt: Math.round(s.clock.playTime), expiresAt: tpl.timed ? Math.round(s.clock.playTime + tpl.timed) : null, prog: 0 };
      s.stats.ordersAccepted = (s.stats.ordersAccepted || 0) + 1;
      Q().autoProtectOrders(s);
      Q().refreshBoard(s, false);
      return { oid: off.oid };
    }
  });
  def('abandonOrder', {
    txId: (s, p) => 'abandon:' + p.oid, once: () => true,
    run(s, p) { const o = s.orders[p.oid]; D.assert(o && o.state === 'ACTIVE', 'Aktif sipariş yok'); o.state = 'ABANDONED'; Q().unprotect(s, o.oid); return {}; }
  });
  def('deliverOrder', {
    txId: (s, p) => 'deliver:' + p.oid, once: () => true,
    run(s, p) {
      const o = s.orders[p.oid];
      D.assert(o && o.state === 'ACTIVE', 'Sipariş aktif değil.');
      D.assert(!(o.expiresAt && s.clock.playTime > o.expiresAt), 'Süresi geçti.');
      const tpl = D.orderTplById[o.tpl];
      const pr = Q().orderProgress(s, o);
      D.assert(pr.have >= pr.n, 'Henüz tamamlanmadı (' + pr.have + '/' + pr.n + ').');
      if (['fish', 'rarity', 'size', 'behavior'].includes(tpl.kind)) {
        const ids = Q().orderFish(s, o).map((f) => f.instanceId);
        s.inv.fish = s.inv.fish.filter((f) => !ids.includes(f.instanceId));
      } else if (tpl.kind === 'regionSet') {
        const used = new Set();
        const keep = [];
        for (const f of s.inv.fish) {
          if (used.size < tpl.spec.n && !f.locked && f.regionCode === tpl.spec.region && !used.has(f.fishId) && (!f.questProtected || f.questProtected === o.oid)) { used.add(f.fishId); continue; }
          keep.push(f);
        }
        s.inv.fish = keep;
      } else if (tpl.kind === 'trash') {
        let need = tpl.spec.n;
        for (const id of Object.keys(s.inv.trash)) { const take = Math.min(need, s.inv.trash[id]); s.inv.trash[id] -= take; need -= take; if (!need) break; }
      }
      Q().unprotect(s, o.oid);
      o.state = 'COMPLETED'; o.doneAt = Math.round(s.clock.playTime);
      const got = Inv().grant(s, tpl.rewards, { reason: 'sipariş' });
      return { rewards: got };
    }
  });

  // ---------- ÖDÜLLER ----------
  def('claimMain', {
    txId: (s, p) => 'main:' + p.id, once: () => true,
    run(s, p) {
      const q = D.mainById[p.id]; D.assert(q, 'Görev yok');
      D.assert(Q().mainState(s, q) === 'COMPLETABLE', 'Görev henüz tamamlanmadı.');
      s.quests[p.id] = { state: 'COMPLETED', doneAt: Math.round(s.clock.playTime) };
      return { rewards: Inv().grant(s, q.rewards, { reason: q.title }) };
    }
  });
  def('claimDaily', {
    txId: (s, p) => 'dailyclaim:' + p.id, once: () => true,
    run(s, p) {
      const d = s.daily.list.find((x) => x.id === p.id); D.assert(d && !d.claimed, 'Günlük görev yok ya da alındı.');
      const tpl = D.dailyTplById[d.tpl]; D.assert(d.prog >= tpl.spec.n, 'Henüz tamamlanmadı.');
      d.claimed = true;
      return { rewards: Inv().grant(s, tpl.rewards, { reason: 'günlük' }) };
    }
  });
  def('claimCollection', {
    txId: (s, p) => 'col:' + p.region + ':' + p.pct, once: () => true,
    run(s, p) {
      if (p.region === 'ALL') {
        const t = Q().totalCollection(s); D.assert(t.got >= t.total, 'Tüm türler henüz keşfedilmedi (' + t.got + '/' + t.total + ').');
        s.collectionRewards.ALL = true;
        return { rewards: Inv().grant(s, D.QuestDB.collection.all) };
      }
      const rc = Q().regionCollection(s, p.region); D.assert(rc.pct >= p.pct, 'Yüzde henüz yeterli değil.');
      const key = p.region + ':' + p.pct; D.assert(!s.collectionRewards[key], 'Ödül alındı.');
      s.collectionRewards[key] = true;
      return { rewards: Inv().grant(s, D.QuestDB.collection.rewards[p.region][p.pct]) };
    }
  });

  // ---------- HİKÂYE ----------
  def('talk', {
    txId: (s, p) => 'talk:' + p.npc + ':' + s.tx.count,
    run(s, p, ctx) {
      if (p.npc === 'tarcov') D.assert(!s.flags.tarcovLeft, 'Müfettiş Tarçov kasabadan ayrıldı.');
      const st = Q().talkStep(s, p.npc, ctx);
      if (st) return { dlg: st.dlg, chapter: st.chapter };
      const lines = D.IdleLines[p.npc] || ['...'];
      const k = s.npc.talk[p.npc] || 0;
      s.npc.talk[p.npc] = k + 1;
      return { idle: lines[k % lines.length] };
    }
  });
  def('inspect', {
    txId: (s, p) => 'inspect:' + p.spot + ':' + s.tx.count,
    run(s, p, ctx) { const st = Q().inspectStep(s, p.spot, ctx); D.assert(st, 'Burada incelenecek bir şey yok.'); return { dlg: st.dlg }; }
  });
  def('choice', {
    txId: (s, p) => 'choice:' + Object.keys(p.set || {}).join(',') + ':' + s.tx.count,
    run(s, p) { for (const [k, v] of Object.entries(p.set || {})) s.flags[k] = v; return {}; }
  });
  def('storyDeliver', {
    txId: (s, p) => { const x = Q().deliverStepFor(s, p.npc); return 'sdeliver:' + p.npc + ':' + (x ? x.ch.id + ':' + s.quests[x.ch.id].step : 'none'); },
    once: () => true,
    run(s, p, ctx) {
      const x = Q().deliverStepFor(s, p.npc); D.assert(x, 'Teslim edilecek bir şey yok.');
      const r = Q().deliverReady(s, x.ch, x.st);
      D.assert(r.okFish, 'Uygun balık yok: ' + x.st.n + ' × ' + (Q().filterText(x.st.filter) || 'balık') + ' (korumadaki balıklar sayılmaz).');
      if (x.st.miyav) Inv().spendWallet(s, 'CUR_MIYAV', x.st.miyav, x.ch.title);
      if (x.st.coin) Inv().spendWallet(s, 'CUR_COIN', x.st.coin);
      const ids = r.fish.map((f) => f.instanceId);
      s.inv.fish = s.inv.fish.filter((f) => !ids.includes(f.instanceId));
      Q().unprotect(s, x.ch.id);
      const dlg = x.st.dlg;
      Q().advanceStep(s, x.ch, ctx);
      return { dlg };
    }
  });

  // ---------- ÇARK ----------
  def('spinWheel', {
    txId: (s, p) => { const dk = D.Clock.dayKey(s); return 'wheel:' + dk + ':' + (p.kind === 'free' ? 'free' : 'ad' + ((s.wheel.dayKey === dk ? s.wheel.rewardedUsed : 0) + 1)); },
    once: () => true,
    run(s, p, ctx) {
      D.assert(s.flags.wheelUnlocked, 'Kara Pazar Çarkı henüz açılmadı.');
      const dk = D.Clock.dayKey(s);
      Q().ensureDaily(s, dk);
      let slot;
      if (p.kind === 'free') { D.assert(!s.wheel.freeUsed, 'Bugünün ücretsiz çevirmesi kullanıldı. Yarın tekrar gel.'); s.wheel.freeUsed = true; slot = 'free'; }
      else {
        D.assert(s.wheel.rewardedUsed < D.EconomyConfig.rewardedAdsPerDay, 'Bugünkü reklamlı haklar bitti.');
        D.assert(D.Ads && D.Ads.consumeToken(p.token), 'Reklam ödül doğrulaması yok — hak verilmedi.');
        s.wheel.rewardedUsed += 1; slot = 'ad' + s.wheel.rewardedUsed;
      }
      const rng = D.RNG.forKey(s.seed, 'wheel:' + dk + ':' + slot);
      const segs = D.WheelDB.segments;
      const idx = rng.weighted(segs.map((g, i) => ({ w: g.w, v: i })));
      const seg = segs[idx];
      const r = seg.reward; let rewards = [];
      if (r.type === 'coin') rewards = [{ type: 'coin', n: r.n }];
      else if (r.type === 'miyav') rewards = [{ type: 'miyav', n: r.n }];
      else if (r.type === 'item') rewards = [{ type: 'item', id: r.id, n: r.n }];
      else if (r.type === 'chest') rewards = [{ type: 'chest', id: r.id }];
      else if (r.type === 'regionMaterial') {
        const top = s.unlockedRegions.slice().sort((a, b) => D.RegionDB[b].order - D.RegionDB[a].order)[0];
        rewards = [{ type: 'item', id: D.FactoryDB.fishToMaterial[top].base[0].id, n: r.n }];
      } else if (r.type === 'cosmetic') {
        const free = r.pool.filter((id) => !s.cosmetics.owned.includes(id));
        rewards = free.length ? [{ type: 'cosmetic', id: rng.pick(free) }] : [{ type: 'miyav', n: 20 }];
      } else if (r.type === 'special') rewards = [{ type: 'item', id: rng.pick(r.pool), n: 1 }];
      const got = Inv().grant(s, rewards, { reason: 'çark' });
      s.wheel.totalSpins = (s.wheel.totalSpins || 0) + 1; s.stats.spins += 1;
      s.npc.rel.zip = Math.min(100, (s.npc.rel.zip || 0) + 2);
      return { index: idx, segment: seg.id, rewards: got };
    }
  });

  // ---------- DON'UN İŞLERİ (tekrarlanabilir Miyav kaynağı) ----------
  def('donJobNew', {
    txId: (s) => 'donjob:new:' + s.donJobs.done,
    run(s) {
      D.assert(s.flags.wheelUnlocked, 'Don henüz iş vermiyor.');
      D.assert(!s.donJobs.current, 'Zaten bir iş var.');
      D.assert(s.clock.playTime >= s.donJobs.nextAt, 'Don şu an meşgul. ' + D.fmtTime(s.donJobs.nextAt - s.clock.playTime) + ' sonra gel.');
      const rng = D.RNG.forKey(s.seed, 'donjob:' + s.donJobs.done);
      const reg = rng.pick(s.unlockedRegions);
      const rar = rng.chance(0.3) ? 'uncommon' : 'common';
      const n = rng.int(2, 3);
      s.donJobs.current = { region: reg, rarityMin: rar, n, miyav: 6 + n * 2 + D.RegionDB[reg].order, coin: 20 * D.RegionDB[reg].order };
      return {};
    }
  });
  def('donJobDeliver', {
    txId: (s) => 'donjob:deliver:' + s.donJobs.done, once: () => true,
    run(s) {
      const j = s.donJobs.current; D.assert(j, 'Aktif iş yok.');
      const flt = { region: j.region, rarityMin: j.rarityMin };
      const pool = s.inv.fish.filter((f) => !f.locked && !f.questProtected && Q().fishMatch(f, flt)).slice(0, j.n);
      D.assert(pool.length >= j.n, 'Gereken: ' + j.n + ' × ' + Q().filterText(flt) + ' (sende ' + pool.length + ').');
      const ids = pool.map((f) => f.instanceId);
      s.inv.fish = s.inv.fish.filter((f) => !ids.includes(f.instanceId));
      Inv().addWallet(s, 'CUR_MIYAV', j.miyav, 'Don\'un işi'); Inv().addWallet(s, 'CUR_COIN', j.coin);
      s.npc.rel.zip = Math.min(100, (s.npc.rel.zip || 0) + 4);
      s.donJobs.current = null; s.donJobs.done += 1; s.donJobs.nextAt = Math.round(s.clock.playTime + D.EconomyConfig.donJobCooldownSec);
      return { miyav: j.miyav, coin: j.coin };
    }
  });
  def('poemNight', {
    txId: (s) => 'poem:' + D.Clock.dayKey(s), once: () => true,
    run(s) {
      D.assert(s.flags.secretVenue, 'Arka Oda kapalı.');
      const k = s.npc.talk.poem || 0; s.npc.talk.poem = k + 1;
      Inv().addWallet(s, 'CUR_MIYAV', 5, 'şiir gecesi');
      s.npc.rel.zip = Math.min(100, (s.npc.rel.zip || 0) + 1);
      return { poem: k % D.DialogueDB.poem.length };
    }
  });

  // ---------- BAKIM (zaman tabanlı) ----------
  def('maintenance', {
    txId: (s) => 'maint:' + s.tx.count,
    run(s, p) {
      if (p && p.dayKey) Q().ensureDaily(s, p.dayKey);
      Q().refreshBoard(s, !!(p && p.forceBoard));
      return {};
    }
  });
  def('setFlagDebug', { txId: (s, p) => 'debug:' + s.tx.count, run(s, p) { D.assert(p.debug === true, 'debug'); if (p.fn) p.fn(s); return {}; } });

  // Tüm işlemlerden sonra: hikâye kilitleri + bölge senkronu
  A.after = (s, ctx) => { D.Quests.afterTx(s, ctx); syncRegions(s, ctx); };
  D.Actions = A;
})(globalThis.DUMEN);
