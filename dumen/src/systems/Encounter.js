// Karşılaşma zarı: atış başına TEK seed (masterSeed + castId). Render/sahne değişimi zarı değiştirmez.
(function (D) {
  'use strict';
  const LEG_CAP = 0.12; // Efsanevi+Boss toplam payı en fazla %12 (hiçbir yem garanti veremez)

  function fishWeights(s, regionCode, L, extra) {
    const ids = D.RegionDB[regionCode].fishIds;
    const list = [];
    for (const id of ids) {
      const b = D.FishBalanceDB[id];
      let w = b.spawnWeight;
      const rr = D.rarityRank(b.rarity);
      if (b.rarity === 'common') w *= L.commonMult;
      if (b.rarity === 'uncommon') w *= L.uncommonMult;
      if (rr >= 2) w *= L.rareMult * (extra.rareMult || 1);
      if (rr >= 4) w *= L.legMult * (extra.legMult || 1);
      if (L.regionBait && rr >= 1) w *= L.regionMult;
      if (L.behaviorBias[b.behavior]) w *= L.behaviorBias[b.behavior];
      if (L.favorite === id) w *= L.favoriteMult;
      list.push({ w, v: id, leg: rr >= 4 });
    }
    // Efsanevi payı tavanı
    const tot = D.sum(list, (e) => e.w), legTot = D.sum(list.filter((e) => e.leg), (e) => e.w);
    if (legTot / tot > LEG_CAP) {
      const nonLeg = tot - legTot;
      const k = (LEG_CAP * nonLeg) / ((1 - LEG_CAP) * legTot);
      for (const e of list) if (e.leg) e.w *= k;
    }
    return list;
  }

  function trashPick(rng, regionCode) {
    const list = Object.values(D.TrashDB).filter((t) => t.regions.includes('*') || t.regions.includes(regionCode)).map((t) => ({ w: t.w, v: t.id }));
    return rng.weighted(list);
  }

  const SUSPICIOUS = [
    { id: 'rare', text: 'Yasaklı Sucuk: nadir balıklar coştu!', rareMult: 2.2 },
    { id: 'trash', text: 'Yasaklı Sucuk: çöpler bayılıyor buna...', trashMult: 3 },
    { id: 'treasure', text: 'Yasaklı Sucuk: sandıklar kokuyu aldı!', treasureMult: 2.8 },
    { id: 'fast', text: 'Yasaklı Sucuk: herkes aç! Bekleme çok kısa.', waitMult: 0.4 }
  ];

  function roll(s, regionCode, castId, L, opts) {
    opts = opts || {};
    const rng = D.RNG.forKey(s.seed, 'cast:' + castId + ':' + (opts.reroll || 0));
    const region = D.RegionDB[regionCode];
    const extra = { rareMult: 1, legMult: 1 };
    let trashMult = L.trashMult, treasureMult = L.treasureBaitMult || 1, waitMult = L.waitMult;
    let suspicious = null;
    if (L.suspicious) {
      suspicious = rng.pick(SUSPICIOUS);
      if (suspicious.rareMult) extra.rareMult = suspicious.rareMult;
      if (suspicious.trashMult) trashMult *= suspicious.trashMult;
      if (suspicious.treasureMult) treasureMult *= suspicious.treasureMult;
      if (suspicious.waitMult) waitMult *= suspicious.waitMult;
    }
    if (opts.kacakYem) extra.legMult = D.ItemBalanceDB.SPC_25.params.legMult;
    const weights = fishWeights(s, regionCode, L, extra);
    const pTreasure = D.clamp((region.treasureRate + L.treasure) * treasureMult, 0, 0.45);
    const pTrash = D.clamp(region.trashRate * trashMult + L.trashAdd, 0.01, 0.6);
    const nRoll = rng.float();
    const n = nRoll < 0.3 ? 1 : nRoll < 0.75 ? 2 : 3;
    const cands = [];
    let chestUsed = false, trashUsed = false;
    for (let i = 0; i < n; i++) {
      const r = rng.float();
      if (!chestUsed && r < pTreasure) {
        chestUsed = true;
        const chestId = rng.weighted(region.chestPool.map((c) => ({ w: c.w, v: c.id })));
        cands.push({ type: 'chest', chestId });
      } else if (!trashUsed && r < pTreasure + pTrash) {
        trashUsed = true;
        cands.push({ type: 'trash', trashId: trashPick(rng, regionCode) });
      } else {
        const fishId = rng.weighted(weights);
        const b = D.FishBalanceDB[fishId];
        const t = Math.pow(rng.float(), 1.6);
        const size = Math.round((b.sizeMin + (b.sizeMax - b.sizeMin) * t) * 10) / 10;
        cands.push({ type: 'fish', fishId, size, hircin: !!opts.kacakYem });
      }
    }
    if (L.decoys && rng.chance(0.55)) cands.push({ type: 'decoy' });
    // Siluet sırası karışık; görünüm parametreleri (yüzme yolu) da aynı seed'den.
    const order = rng.shuffle(cands.map((c, i) => i));
    const candidates = order.map((i) => Object.assign({}, cands[i], { lane: rng.float(), speed: 0.6 + rng.float() * 0.8, phase: rng.float() * 6.28 }));
    const wait = D.round1(D.clamp(rng.range(2.0, 4.8) * waitMult + (L.fog ? 0.8 : 0), 0.8, 8));
    return { castId, regionCode, candidates, wait, suspicious: suspicious ? suspicious.text : null, pTreasure, pTrash };
  }

  D.round1 = (x) => Math.round(x * 10) / 10;
  D.Encounter = { roll, fishWeights, LEG_CAP };
})(globalThis.DUMEN);
