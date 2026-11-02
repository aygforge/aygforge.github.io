// Envanter + cüzdan + ekonomi hesapları. TEK fiyat hesaplayıcı burada (UI yeniden hesaplamaz).
(function (D) {
  'use strict';
  const IB = () => D.ItemBalanceDB;
  const cat = (id) => (D.ItemDBSource.ItemDB[id] ? D.ItemDBSource.ItemDB[id].category : null);
  const GEAR = ['rod', 'line', 'hook', 'float'];

  const Inv = {
    cat,
    newId(s, prefix) { s.counters.instance += 1; return prefix + s.counters.instance; },
    count(s, id) {
      const c = cat(id);
      if (!c) return 0;
      if (c === 'currency') return s.wallet[id] || 0;
      if (GEAR.includes(c)) return s.owned[c].includes(id) ? 1 : 0;
      if (c === 'chest') return s.inv.chests.filter((x) => x.chestId === id).length;
      return s.inv.items[id] || 0;
    },
    owns(s, id) { return Inv.count(s, id) > 0; },
    add(s, id, n, ctx) {
      n = n == null ? 1 : n;
      D.assert(D.isInt(n) && n > 0, 'Geçersiz miktar');
      const c = cat(id);
      D.assert(c, 'Bilinmeyen eşya: ' + id);
      if (c === 'currency') return Inv.addWallet(s, id, n, ctx && ctx.reason);
      if (GEAR.includes(c)) {
        if (!s.owned[c].includes(id)) s.owned[c].push(id);
        return;
      }
      if (c === 'chest') {
        for (let i = 0; i < n; i++) s.inv.chests.push({ instanceId: Inv.newId(s, 'C'), chestId: id, quality: (ctx && ctx.quality) || 'normal', from: (ctx && ctx.from) || null });
        return;
      }
      s.inv.items[id] = (s.inv.items[id] || 0) + n;
    },
    remove(s, id, n) {
      n = n == null ? 1 : n;
      const c = cat(id);
      if (c === 'currency') return Inv.spendWallet(s, id, n);
      D.assert(c !== 'chest' && !GEAR.includes(c), 'Bu eşya bu yolla düşülemez: ' + id);
      const have = s.inv.items[id] || 0;
      D.assert(have >= n, 'Yetersiz: ' + D.itemName(id) + ' (' + have + '/' + n + ')', 'INSUFFICIENT');
      s.inv.items[id] = have - n;
    },
    addWallet(s, id, n, reason) {
      D.assert(D.isInt(n) && n >= 0, 'Geçersiz tutar');
      s.wallet[id] = (s.wallet[id] || 0) + n;
      if (id === 'CUR_COIN') s.stats.coinsEarned += n;
      if (id === 'CUR_MIYAV' && n > 0) { s.miyavLog.push({ t: Math.round(s.clock.playTime), n, reason: reason || '' }); if (s.miyavLog.length > 60) s.miyavLog.shift(); }
    },
    spendWallet(s, id, n, reason) {
      D.assert(D.isInt(n) && n >= 0, 'Geçersiz tutar');
      const have = s.wallet[id] || 0;
      const label = D.ItemBalanceDB[id].short;
      D.assert(have >= n, 'Yetersiz ' + label + ': ' + D.fmt(have) + ' / ' + D.fmt(n), 'INSUFFICIENT');
      s.wallet[id] = have - n;
      if (id === 'CUR_COIN') s.stats.coinsSpent += n;
      if (id === 'CUR_MIYAV' && n > 0) { s.miyavLog.push({ t: Math.round(s.clock.playTime), n: -n, reason: reason || '' }); if (s.miyavLog.length > 60) s.miyavLog.shift(); }
    },
    capacity(s) {
      let cap = D.boatLevel(s.boat.level).stats.capacity;
      if (s.boat.installed.includes('BM_02')) cap += IB().BM_02.bonus.capacity;
      return cap;
    },
    specialSlots(s) {
      let n = D.boatLevel(s.boat.level).stats.specialSlots;
      if (s.boat.installed.includes('BM_06')) n += 1;
      return n;
    },
    fishFull(s) { return s.inv.fish.length >= Inv.capacity(s); },
    // Bir ödül listesini uygular; okunabilir özet döner.
    grant(s, rewards, ctx) {
      const out = [];
      for (const r of rewards || []) {
        if (r.type === 'coin') { Inv.addWallet(s, 'CUR_COIN', r.n); out.push({ id: 'CUR_COIN', n: r.n }); }
        else if (r.type === 'miyav') { Inv.addWallet(s, 'CUR_MIYAV', r.n, ctx && ctx.reason); out.push({ id: 'CUR_MIYAV', n: r.n }); }
        else if (r.type === 'scrap') { Inv.addWallet(s, 'CUR_SCRAP', r.n); out.push({ id: 'CUR_SCRAP', n: r.n }); }
        else if (r.type === 'item') { Inv.add(s, r.id, r.n); out.push({ id: r.id, n: r.n }); }
        else if (r.type === 'chest') { Inv.add(s, r.id, 1, { from: 'reward' }); out.push({ id: r.id, n: 1 }); }
        else if (r.type === 'cosmetic') {
          if (!s.cosmetics.owned.includes(r.id)) { s.cosmetics.owned.push(r.id); out.push({ cosmetic: r.id, n: 1 }); }
          else { Inv.addWallet(s, 'CUR_MIYAV', 10, 'kozmetik tekrarı'); out.push({ id: 'CUR_MIYAV', n: 10, dup: r.id }); }
        } else if (r.type === 'rel') { s.npc.rel[r.npc] = Math.min(100, (s.npc.rel[r.npc] || 0) + r.n); out.push({ rel: r.npc, n: r.n }); }
        else throw new Error('Bilinmeyen ödül türü ' + r.type);
      }
      return out;
    },
    describe(list) {
      return list.map((g) => {
        if (g.cosmetic) return D.CosmeticDB[g.cosmetic].name;
        if (g.rel) return D.NPCDB[g.rel].name + ' ilişki +' + g.n;
        if (g.dup) return D.CosmeticDB[g.dup].name + ' (zaten var → +' + g.n + ' Miyav)';
        const ib = D.ItemBalanceDB[g.id];
        if (ib.slot === 'currency') return '+' + D.fmt(g.n) + ' ' + ib.short;
        return D.itemName(g.id) + (g.n > 1 ? ' ×' + g.n : '');
      });
    }
  };

  // ---- Ekonomi: tek fiyat hesaplayıcı ----
  const Econ = {
    fishAge(s, f) { return Math.max(0, s.clock.playTime - (f.caughtPlay || 0)); },
    freshness(s, f) {
      const age = Econ.fishAge(s, f);
      const F = D.EconomyConfig.freshness;
      if (age < F.FRESH.maxAge) return 'FRESH';
      if (age < F.NORMAL.maxAge) return 'NORMAL';
      return 'STALE';
    },
    freshLeft(s, f) {
      const age = Econ.fishAge(s, f); const F = D.EconomyConfig.freshness;
      if (age < F.FRESH.maxAge) return F.FRESH.maxAge - age;
      if (age < F.NORMAL.maxAge) return F.NORMAL.maxAge - age;
      return 0;
    },
    sizeT(fishId, size) { const b = D.FishBalanceDB[fishId]; return D.clamp((size - b.sizeMin) / Math.max(0.001, b.sizeMax - b.sizeMin), 0, 1); },
    sizeLabel(fishId, size) {
      const t = Econ.sizeT(fishId, size); let label = 'Küçük';
      for (const l of D.EconomyConfig.sizeLabels) if (t >= l.t) label = l.label;
      return label;
    },
    sizeMult(fishId, size) { const [a, b] = D.EconomyConfig.sizeMultRange; return a + (b - a) * Econ.sizeT(fishId, size); },
    rustemBonus(s) { return 1 + Math.min(0.1, (s.npc.rel.rustem || 0) / 1000); },
    // Satış Değeri = Temel × Nadirlik(temel fiyatta) × Boy × Tazelik × Özel Bonus
    fishValue(s, f, channel) {
      const b = D.FishBalanceDB[f.fishId];
      const fr = Econ.freshness(s, f);
      const base = b.basePrice * Econ.sizeMult(f.fishId, f.size);
      if (channel === 'factory') return Math.max(1, D.roundCoin(base * D.EconomyConfig.factory.coinMult[fr]));
      if (channel === 'estimate') return Math.max(1, D.roundCoin(base));
      const fm = D.EconomyConfig.freshness[fr].mult;
      if (fm <= 0) return 0;
      return Math.max(1, D.roundCoin(base * fm * Econ.rustemBonus(s)));
    },
    sellableAtRustem(s, f) { return !f.locked && !f.questProtected && Econ.freshness(s, f) !== 'STALE'; },
    factoryOutput(f) {
      const fdb = D.FactoryDB.fishToMaterial[f.regionCode];
      const rare = D.rarityRank(D.FishBalanceDB[f.fishId].rarity) >= D.rarityRank(D.FactoryDB.rareThreshold);
      return fdb.base.concat(rare ? fdb.rareBonus : []);
    },
    itemPrice(id) { const b = D.ItemBalanceDB[id]; return b && b.price != null ? b.price : null; }
  };

  D.Inv = Inv;
  D.Econ = Econ;
})(globalThis.DUMEN);
