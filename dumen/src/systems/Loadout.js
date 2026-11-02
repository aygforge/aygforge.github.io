// Loadout: olta + misina + kanca + şamandıra + yem + takılı özel eşyalar + tekne + kara pazar parçaları + bölge çevresi
// → tek bir etkin stat nesnesi. Hem karşılaşma zarı hem mücadele simülasyonu bunu kullanır. UI aynı değerleri gösterir.
(function (D) {
  'use strict';

  // Her özel eşyanın loadout'a etkisi (pasifler) ve aktif kullanım bilgisi — 25/25 kayıt zorunlu (testler kontrol eder).
  const SPECIAL_HANDLERS = {
    SPC_01: (L, p) => { L.asilmaDelay += p.asilmaDelay; },
    SPC_02: (L, p) => { L.sonTensionMult *= p.sonCirpinisTensionMult; },
    SPC_03: (L) => { L.revealFirst = true; },
    SPC_04: (L, p) => { L.warnAhead = Math.max(L.warnAhead, p.warnAhead); },
    SPC_05: (L, p) => { for (const k in p.behaviorBias) L.behaviorBias[k] = (L.behaviorBias[k] || 1) * p.behaviorBias[k]; },
    SPC_06: (L, p) => { L.telegraph += p.telegraphBonus; },
    SPC_07: (L, p) => { L.mistakeSpikeMult *= p.mistakeSpikeMult; },
    SPC_08: (L, p) => { L.inputLag = Math.min(L.inputLag, p.inputLag); },
    SPC_09: (L) => { L.dipFreeze = true; },
    SPC_10: (L, p) => { L.trashMult *= p.trashMult; L.hpMult *= p.hpMult; },
    SPC_11: (L, p) => { L.snapSave = Math.max(L.snapSave, p.snapSave); },
    SPC_12: (L, p) => { L.rareMult *= p.rareMult; L.extraMoves += p.extraMoves; },
    SPC_13: (L, p) => { L.escapeSave = Math.max(L.escapeSave, p.escapeSave); },
    SPC_14: (L) => { L.actives.push('SPC_14'); },
    SPC_15: (L) => { L.actives.push('SPC_15'); },
    SPC_16: (L, p) => { L.asilmaTensionMult *= p.asilmaTensionMult; L.dipDurationMult *= p.dipDurationMult; },
    SPC_17: (L) => { L.regular = true; },
    SPC_18: (L, p) => { for (const k in p.behaviorBias) L.behaviorBias[k] = (L.behaviorBias[k] || 1) * p.behaviorBias[k]; L.tensionMult *= p.tensionMult; },
    SPC_19: (L) => { L.actives.push('SPC_19'); },
    SPC_20: (L) => { L.actives.push('SPC_20'); },
    SPC_21: (L, p) => { L.tensionMult *= p.tensionMult; },
    SPC_22: (L) => { L.actives.push('SPC_22'); },
    SPC_23: (L, p) => { L.mistakePause = Math.max(L.mistakePause, p.mistakePause); },
    SPC_24: (L) => { L.actives.push('SPC_24'); },
    SPC_25: (L) => { L.perCast.push('SPC_25'); }
  };

  function compute(s, regionCode, opts) {
    opts = opts || {};
    const IB = D.ItemBalanceDB;
    const rod = IB[s.equip.rod], line = IB[s.equip.line], hook = IB[s.equip.hook], flt = IB[s.equip.float];
    const baitId = opts.baitId !== undefined ? opts.baitId : s.equip.bait;
    const bait = baitId ? IB[baitId] : null;
    const boat = D.boatLevel(s.boat.level).stats;
    const region = D.RegionDB[regionCode];
    const L = {
      regionCode, rodId: rod.id, lineId: line.id, hookId: hook.id, floatId: flt.id, baitId: baitId || null,
      ls: rod.ls, rs: rod.rs, ct: rod.ct, sd: rod.sd, tb: rod.tb, rh: rod.rh, reelTension: rod.reelTension,
      inputLag: 0.22, telegraph: 0.55, asilmaDelay: 0, warnAhead: 0, revealFirst: false,
      mistakeSpikeMult: 1, mistakePause: 0, dipFreeze: false, dipDurationMult: 1, asilmaTensionMult: 1, sonTensionMult: 1,
      tensionMult: 1, hpMult: 1, snapSave: 0, escapeSave: 0, extraMoves: 0, regular: false,
      grace: 1.15, escapeSlip: 0,
      // karşılaşma
      waitMult: boat.waitMult, treasure: boat.treasure, trashMult: 1, trashAdd: 0, treasureBaitMult: 1, rareMult: boat.rareMult, legMult: 1,
      commonMult: 1, uncommonMult: 1, behaviorBias: {}, favorite: null, favoriteMult: 1, clarity: false, rarityHint: false, ghostReveal: false,
      regionBait: false, suspicious: false,
      env: null, envActive: false, envImmune: false, reelEnvMult: 1, tensionEnvMult: 1, lsEnvMult: 1, wobble: 0,
      actives: [], perCast: [], specialsEquipped: [],
      notes: []
    };
    // Olta bölge bonusu
    const rb = rod.regionBonus && rod.regionBonus[regionCode];
    if (rb) {
      if (rb.sd) L.sd *= rb.sd;
      if (rb.ls) L.ls *= rb.ls;
      if (rb.ct) L.ct += rb.ct;
      if (rb.rh) L.rh += rb.rh;
      if (rb.envImmune) L.envImmune = true;
      L.notes.push(rod.name + ': bölge avantajı');
    }
    // Misina / kanca / şamandıra
    for (const g of [line, hook, flt]) {
      const m = g.mods || {};
      if (m.ls) L.ls += m.ls;
      if (m.ct) L.ct += m.ct;
      if (m.sd) L.sd *= 1 + m.sd;
      if (m.treasure) L.treasure += m.treasure;
      if (m.trash) L.trashAdd += m.trash;
      if (m.wait) L.waitMult *= 1 + m.wait;
      if (m.heavyBias) L.behaviorBias.heavy = (L.behaviorBias.heavy || 1) * m.heavyBias;
      if (m.clarity) L.clarity = true;
      if (m.rarityHint) L.rarityHint = true;
      if (m.ghostReveal) L.ghostReveal = true;
      if (m.escapeSlip) L.escapeSlip = m.escapeSlip;
      if (m.coldImmune && regionCode === 'TB') L.envImmune = true;
    }
    // Yem
    if (bait) {
      L.waitMult *= bait.wait;
      L.rareMult *= bait.rare;
      L.legMult *= bait.leg;
      if (bait.common) L.commonMult *= bait.common;
      if (bait.uncommon) L.uncommonMult *= bait.uncommon;
      L.trashMult *= bait.trash;
      L.treasureBaitMult = bait.treasure;
      if (bait.behaviorBias) for (const k in bait.behaviorBias) L.behaviorBias[k] = (L.behaviorBias[k] || 1) * bait.behaviorBias[k];
      if (bait.favorite) { L.favorite = bait.favorite; L.favoriteMult = bait.favoriteMult; }
      if (bait.region && bait.region === regionCode) { L.regionBait = true; L.regionMult = bait.regionMult; L.waitMult *= 0.85; L.trashMult *= 0.7; }
      if (bait.suspicious) L.suspicious = true;
    }
    // Kara pazar parçaları
    for (const bm of s.boat.installed) {
      const b = IB[bm].bonus;
      if (b.waitMult) L.waitMult *= b.waitMult;
      if (b.grace) L.grace += b.grace;
      if (b.rareMult) L.rareMult *= b.rareMult;
      if (b.treasure) L.treasure += b.treasure;
    }
    // Özel eşyalar (yalnız sahip olunan + takılı olanlar)
    const slots = D.Inv.specialSlots(s);
    for (const id of s.equip.specials.slice(0, slots)) {
      const ib = IB[id];
      if (!ib || ib.slot !== 'special') continue;
      const have = s.inv.items[id] || 0;
      if (have <= 0 && ib.kind !== 'consumable') continue; // pasif/charge sahip olmayı gerektirir
      L.specialsEquipped.push(id);
      SPECIAL_HANDLERS[id](L, ib.params || {});
    }
    // Rod rarity handling → nadir balıklara karşı güç
    L.rareMult *= 1 + L.rh * 0.25;
    // Bölge çevresi
    if (region.env) {
      L.env = region.env.type;
      const tol = D.boatLevel(s.boat.level).stats.tolerance;
      const immuneByBoat = tol.includes(region.env.type);
      const immune = L.envImmune || immuneByBoat;
      L.envImmune = immune;
      L.envActive = !immune;
      if (!immune) {
        if (region.env.reelMult) L.reelEnvMult = region.env.reelMult;
        if (region.env.tensionMult) L.tensionEnvMult = region.env.tensionMult;
        if (region.env.lineStrengthMult) L.lsEnvMult = region.env.lineStrengthMult;
        if (region.env.wobble) L.wobble = region.env.wobble;
      }
      // Karanlık / hayalet / sis: ekipmanla aşılabilen bilgi cezaları
      if (L.env === 'dark' || L.env === 'anomaly') L.decoys = !(L.clarity || rod.id === 'ROD_09');
      if (L.env === 'ghost') L.unsignaled = L.ghostReveal ? 0 : 0.3;
      if (L.env === 'fog') L.fog = !L.clarity;
    }
    L.grace *= L.ls * L.lsEnvMult;
    L.ct = D.clamp(L.ct, 0, 0.6);
    return L;
  }

  D.Loadout = { compute, SPECIAL_HANDLERS };
})(globalThis.DUMEN);
