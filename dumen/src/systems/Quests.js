// Görev motoru: ana görevler, hikâye zincirleri (adım adım), pano siparişleri, günlükler, koleksiyon.
// Durumlar: LOCKED → AVAILABLE → ACTIVE → COMPLETABLE → COMPLETED (+ EXPIRED). Ödüller yalnız bir kez.
(function (D) {
  'use strict';
  const Q = {};

  // ---------- koşullar ----------
  Q.speciesCount = (s) => Object.keys(s.collection).length;
  Q.chapterDone = (s, id) => s.quests[id] && s.quests[id].state === 'COMPLETED';
  Q.cond = (s, c) => {
    if (!c) return true;
    if (c.quest) return Q.chapterDone(s, c.quest);
    if (c.chapter) return Q.chapterDone(s, c.chapter);
    if (c.boat) return s.boat.level >= c.boat;
    if (c.region) return s.unlockedRegions.includes(c.region);
    if (c.flag) return !!s.flags[c.flag];
    if (c.rel) return (s.npc.rel[c.rel.npc] || 0) >= c.rel.gte;
    if (c.species) return Q.speciesCount(s) >= c.species;
    if (c.stat) return (s.stats[c.stat] || 0) >= c.gte;
    if (c.ownsAny) return c.ownsAny.some((id) => D.Inv.owns(s, id));
    if (c.ownsAll) return c.ownsAll.every((id) => D.Inv.owns(s, id));
    return false;
  };
  Q.condText = (c) => {
    if (c.quest) return 'Ana görev: ' + D.mainById[c.quest].title;
    if (c.chapter) return 'Bölüm: ' + D.storyById[c.chapter].title;
    if (c.boat) return 'Tekne Sv.' + c.boat;
    if (c.region) return D.RegionDB[c.region].name + ' açık';
    if (c.flag) return 'Hikâye koşulu';
    if (c.rel) return D.NPCDB[c.rel.npc].name + ' ilişki ≥ ' + c.rel.gte;
    if (c.species) return c.species + ' farklı tür keşfet';
    return '?';
  };

  // Balık filtre eşleşmesi
  Q.fishMatch = (f, filter) => {
    if (!filter) return true;
    const b = D.FishBalanceDB[f.fishId];
    if (filter.fishId && f.fishId !== filter.fishId) return false;
    if (filter.region && f.regionCode !== filter.region) return false;
    if (filter.rarityMin && D.rarityRank(b.rarity) < D.rarityRank(filter.rarityMin)) return false;
    if (filter.behavior && b.behavior !== filter.behavior) return false;
    if (filter.sizeLabel && D.Econ.sizeLabel(f.fishId, f.size) !== filter.sizeLabel && !(filter.sizeLabel === 'Büyük' && D.Econ.sizeLabel(f.fishId, f.size) === 'Dev')) return false;
    return true;
  };
  Q.filterText = (flt) => {
    if (!flt) return '';
    const p = [];
    if (flt.fishId) p.push(D.FishDBSource.FishDB[flt.fishId].name);
    if (flt.region) p.push(D.RegionDB[flt.region].name);
    if (flt.rarityMin) p.push(D.RARITY_TR[flt.rarityMin] + '+');
    if (flt.behavior) p.push(D.BEHAVIOR_TR[flt.behavior]);
    if (flt.sizeLabel) p.push(flt.sizeLabel + ' boy');
    return p.join(', ');
  };

  // ---------- hikâye ----------
  Q.storyRec = (s, id) => s.quests[id] || { state: 'LOCKED', step: 0, prog: 0 };
  Q.currentStep = (s, id) => { const r = Q.storyRec(s, id); const ch = D.storyById[id]; return ch.steps[r.step] || null; };
  Q.activeChapters = (s) => D.QuestDB.story.filter((c) => { const r = s.quests[c.id]; return r && (r.state === 'AVAILABLE' || r.state === 'ACTIVE'); });
  Q.refreshStory = (s, ctx) => {
    for (const ch of D.QuestDB.story) {
      const r = s.quests[ch.id];
      if (!r && ch.unlock.every((c) => Q.cond(s, c))) {
        s.quests[ch.id] = { state: 'AVAILABLE', step: 0, prog: 0 };
        if (ctx) ctx.events.push({ type: 'story', text: 'Yeni hikâye bölümü: ' + ch.title });
      }
    }
  };
  Q.advanceStep = (s, ch, ctx) => {
    const r = s.quests[ch.id];
    r.step += 1; r.prog = 0;
    if (r.state === 'AVAILABLE') r.state = 'ACTIVE';
    if (r.step >= ch.steps.length) {
      r.state = 'COMPLETED';
      r.doneAt = Math.round(s.clock.playTime);
      const got = D.Inv.grant(s, ch.rewards, { reason: ch.title });
      Object.assign(s.flags, (ch.onComplete && ch.onComplete.flags) || {});
      if (ctx) ctx.events.push({ type: 'storyDone', text: '"' + ch.title + '" tamamlandı!', rewards: D.Inv.describe(got) });
      // Tarçov ayrıldıysa mühürlü kasanın kilidi kalkar; çark açıldıysa çark durumu hazır
      Q.refreshStory(s, ctx);
    } else {
      Q.protectForSteps(s);
    }
  };
  // Mevcut adım konuşma/inceleme ise tamamla. Döner: diyalog anahtarı ya da null.
  Q.talkStep = (s, npc, ctx) => {
    for (const ch of Q.activeChapters(s)) {
      const st = Q.currentStep(s, ch.id);
      if (st && st.t === 'talk' && st.npc === npc) {
        Q.advanceStep(s, ch, ctx);
        return { dlg: st.dlg, chapter: ch.id };
      }
    }
    return null;
  };
  Q.inspectStep = (s, spot, ctx) => {
    for (const ch of Q.activeChapters(s)) {
      const st = Q.currentStep(s, ch.id);
      if (st && st.t === 'inspect' && st.spot === spot) { Q.advanceStep(s, ch, ctx); return { dlg: st.dlg, chapter: ch.id }; }
    }
    return null;
  };
  Q.activeInspectSpots = (s, scene) => {
    const out = [];
    for (const ch of Q.activeChapters(s)) {
      const st = Q.currentStep(s, ch.id);
      if (st && st.t === 'inspect' && st.scene === scene) out.push(st);
    }
    return out;
  };
  Q.npcHasStory = (s, npc) => Q.activeChapters(s).some((ch) => { const st = Q.currentStep(s, ch.id); return st && (st.t === 'talk' || st.t === 'deliver') && st.npc === npc; });
  Q.deliverStepFor = (s, npc) => {
    for (const ch of Q.activeChapters(s)) {
      const st = Q.currentStep(s, ch.id);
      if (st && st.t === 'deliver' && st.npc === npc) return { ch, st };
    }
    return null;
  };
  Q.deliverCandidates = (s, st, chId) => {
    if (!st.n) return [];
    const pool = s.inv.fish.filter((f) => !f.locked && (f.questProtected === chId || !f.questProtected) && Q.fishMatch(f, st.filter));
    pool.sort((a, b) => (b.questProtected === chId) - (a.questProtected === chId) || D.Econ.fishValue(s, a, 'estimate') - D.Econ.fishValue(s, b, 'estimate'));
    return pool.slice(0, st.n);
  };
  Q.deliverReady = (s, ch, st) => {
    const fish = Q.deliverCandidates(s, st, ch.id);
    const okFish = fish.length >= (st.n || 0);
    const okM = !st.miyav || s.wallet.CUR_MIYAV >= st.miyav;
    const okC = !st.coin || s.wallet.CUR_COIN >= st.coin;
    return { ok: okFish && okM && okC, fish, okFish, okM, okC };
  };
  // Teslim gereken adımlar için yeni yakalanan uygun balıkları otomatik koru.
  Q.protectForSteps = (s) => {
    for (const ch of Q.activeChapters(s)) {
      const st = Q.currentStep(s, ch.id);
      if (!st || st.t !== 'deliver' || !st.n) continue;
      let have = s.inv.fish.filter((f) => f.questProtected === ch.id).length;
      for (const f of s.inv.fish) {
        if (have >= st.n) break;
        if (!f.questProtected && !f.locked && Q.fishMatch(f, st.filter)) { f.questProtected = ch.id; have++; }
      }
    }
  };

  // ---------- olaylar ----------
  // ev: {type:'catch', fish, noBait, everRed} | {type:'chest', regionCode, quality} | {type:'sell', coins} | {type:'openChest'} | {type:'recycle', n} | {type:'useBait'} | {type:'install'}
  Q.onEvent = (s, ev, ctx) => {
    // Hikâye adımları
    for (const ch of Q.activeChapters(s)) {
      const st = Q.currentStep(s, ch.id); const r = s.quests[ch.id];
      if (!st) continue;
      let inc = 0;
      if (st.t === 'catch' && ev.type === 'catch' && Q.fishMatch(ev.fish, st.filter)) inc = 1;
      if (st.t === 'chest' && ev.type === 'chest' && (!st.filter || !st.filter.region || st.filter.region === ev.regionCode)) inc = 1;
      if (st.t === 'green' && ev.type === 'chest' && ev.quality === 'gold') inc = 1;
      if (inc) { r.prog += inc; if (r.prog >= st.n) Q.advanceStep(s, ch, ctx); }
    }
    // installed adımı durum kontrolüdür
    Q.checkStateSteps(s, ctx);
    // Pano siparişleri (ilerleme türleri)
    for (const o of Object.values(s.orders)) {
      if (o.state !== 'ACTIVE') continue;
      const tpl = D.orderTplById[o.tpl];
      if (tpl.kind === 'chest' && ev.type === 'chest' && (!tpl.spec.region || tpl.spec.region === ev.regionCode)) o.prog++;
      if (tpl.kind === 'green' && ev.type === 'chest' && ev.quality === 'gold') o.prog++;
      if (tpl.kind === 'noBait' && ev.type === 'catch' && ev.noBait) o.prog++;
    }
    // Günlükler
    for (const d of s.daily.list) {
      if (d.claimed) continue;
      const tpl = D.dailyTplById[d.tpl];
      let inc = 0;
      if (tpl.kind === 'catch' && ev.type === 'catch') inc = 1;
      if (tpl.kind === 'catchRegion' && ev.type === 'catch' && ev.fish.regionCode === d.region) inc = 1;
      if (tpl.kind === 'sellCoin' && ev.type === 'sell') inc = ev.coins;
      if (tpl.kind === 'green' && ev.type === 'chest' && ev.quality === 'gold') inc = 1;
      if (tpl.kind === 'openChest' && ev.type === 'openChest') inc = 1;
      if (tpl.kind === 'recycle' && ev.type === 'recycle') inc = ev.n;
      if (tpl.kind === 'useBait' && ev.type === 'useBait') inc = 1;
      if (tpl.kind === 'rarity' && ev.type === 'catch' && D.rarityRank(D.FishBalanceDB[ev.fish.fishId].rarity) >= D.rarityRank(tpl.spec.rarityMin)) inc = 1;
      if (tpl.kind === 'behavior' && ev.type === 'catch' && D.FishBalanceDB[ev.fish.fishId].behavior === tpl.spec.behavior) inc = 1;
      if (tpl.kind === 'noRed' && ev.type === 'catch' && !ev.everRed) inc = 1;
      if (inc) d.prog = Math.min(tpl.spec.n, d.prog + inc);
    }
    if (ev.type === 'catch') { Q.autoProtectOrders(s); Q.protectForSteps(s); }
  };
  Q.checkStateSteps = (s, ctx) => {
    for (const ch of Q.activeChapters(s)) {
      const st = Q.currentStep(s, ch.id);
      if (st && st.t === 'installed' && s.boat.installed.length >= st.n) Q.advanceStep(s, ch, ctx);
    }
  };

  // ---------- ana görevler ----------
  Q.mainState = (s, q) => {
    const r = s.quests[q.id];
    if (r && r.state === 'COMPLETED') return 'COMPLETED';
    if (q.after && !Q.chapterDone(s, q.after)) return 'LOCKED';
    return Q.cond(s, q.cond) ? 'COMPLETABLE' : 'ACTIVE';
  };
  Q.mainProgressText = (s, q) => {
    const c = q.cond;
    if (c.stat) return Math.min(s.stats[c.stat] || 0, c.gte) + ' / ' + c.gte;
    if (c.boat) return 'Sv.' + s.boat.level + ' / ' + c.boat;
    if (c.region) return s.unlockedRegions.includes(c.region) ? 'Açık' : 'Kilitli';
    if (c.ownsAll) return c.ownsAll.filter((id) => D.Inv.owns(s, id)).length + ' / ' + c.ownsAll.length;
    if (c.ownsAny) return c.ownsAny.some((id) => D.Inv.owns(s, id)) ? '1 / 1' : '0 / 1';
    return '';
  };

  // ---------- pano siparişleri ----------
  Q.orderProgress = (s, o) => {
    const tpl = D.orderTplById[o.tpl];
    const n = tpl.spec.n || 1;
    if (['chest', 'green', 'noBait'].includes(tpl.kind)) return { have: Math.min(n, o.prog), n };
    if (tpl.kind === 'trash') return { have: Math.min(n, D.sum(Object.values(s.inv.trash))), n };
    if (tpl.kind === 'regionSet') {
      const species = new Set(s.inv.fish.filter((f) => !f.locked && f.regionCode === tpl.spec.region && (!f.questProtected || f.questProtected === o.oid)).map((f) => f.fishId));
      return { have: Math.min(n, species.size), n };
    }
    return { have: Math.min(n, Q.orderFish(s, o).length), n };
  };
  Q.orderFilter = (tpl) => {
    const sp = tpl.spec;
    if (tpl.kind === 'fish') return { fishId: sp.fishId };
    if (tpl.kind === 'rarity') return { rarityMin: sp.rarityMin, region: sp.region };
    if (tpl.kind === 'size') return { region: sp.region, sizeLabel: sp.label };
    if (tpl.kind === 'behavior') return { behavior: sp.behavior };
    return null;
  };
  Q.orderFish = (s, o) => {
    const tpl = D.orderTplById[o.tpl];
    if (!['fish', 'rarity', 'size', 'behavior'].includes(tpl.kind)) return [];
    const flt = Q.orderFilter(tpl);
    const list = s.inv.fish.filter((f) => !f.locked && (f.questProtected === o.oid || !f.questProtected) && Q.fishMatch(f, flt));
    list.sort((a, b) => (b.questProtected === o.oid) - (a.questProtected === o.oid));
    return list.slice(0, tpl.spec.n);
  };
  Q.autoProtectOrders = (s) => {
    for (const o of Object.values(s.orders)) {
      if (o.state !== 'ACTIVE') continue;
      const tpl = D.orderTplById[o.tpl];
      if (!['fish', 'rarity', 'size', 'behavior'].includes(tpl.kind)) continue;
      const flt = Q.orderFilter(tpl);
      let have = s.inv.fish.filter((f) => f.questProtected === o.oid).length;
      for (const f of s.inv.fish) {
        if (have >= tpl.spec.n) break;
        if (!f.questProtected && !f.locked && Q.fishMatch(f, flt)) { f.questProtected = o.oid; have++; }
      }
    }
  };
  Q.unprotect = (s, tag) => { for (const f of s.inv.fish) if (f.questProtected === tag) f.questProtected = false; };
  Q.orderState = (s, o) => {
    if (o.state !== 'ACTIVE') return o.state;
    const p = Q.orderProgress(s, o);
    return p.have >= p.n ? 'COMPLETABLE' : 'ACTIVE';
  };
  Q.regionUnlockedFor = (s, reg) => s.unlockedRegions.includes(reg);
  Q.refreshBoard = (s, force) => {
    const pt = s.clock.playTime;
    const B = s.board;
    let changed = false;
    // Süreli siparişlerin süresi
    for (const o of Object.values(s.orders)) {
      if (o.state === 'ACTIVE' && o.expiresAt && pt > o.expiresAt) { o.state = 'EXPIRED'; Q.unprotect(s, o.oid); changed = true; }
    }
    if (!force && pt < B.nextRefreshAt && B.offers.length >= D.EconomyConfig.boardSlots) return changed;
    const activeTpls = new Set(Object.values(s.orders).filter((o) => o.state === 'ACTIVE').map((o) => o.tpl));
    const doneTpls = new Set(Object.values(s.orders).filter((o) => o.state === 'COMPLETED').map((o) => o.tpl));
    const keep = force || pt >= B.nextRefreshAt ? [] : B.offers;
    const offered = new Set(keep.map((x) => x.tpl));
    const rng = D.RNG.forKey(s.seed, 'board:' + s.counters.order + ':' + Math.floor(pt));
    const pool = D.QuestDB.orders.filter((t) => Q.regionUnlockedFor(s, t.reg) && !activeTpls.has(t.id) && !offered.has(t.id));
    // Henüz yapılmamışları öne al, sonra tekrarlanabilirler (yeni örnek kimliğiyle)
    const fresh = rng.shuffle(pool.filter((t) => !doneTpls.has(t.id))), again = rng.shuffle(pool.filter((t) => doneTpls.has(t.id)));
    const sorted = fresh.concat(again);
    const offers = keep.slice();
    while (offers.length < D.EconomyConfig.boardSlots && sorted.length) {
      const t = sorted.shift();
      s.counters.order += 1;
      offers.push({ oid: 'ORD_' + s.counters.order, tpl: t.id, postedAt: Math.round(pt) });
    }
    B.offers = offers;
    if (pt >= B.nextRefreshAt || force) B.nextRefreshAt = pt + D.EconomyConfig.boardRefreshSec;
    return true;
  };

  // ---------- günlükler ----------
  Q.ensureDaily = (s, dayKey) => {
    if (s.daily.dayKey === dayKey) return false;
    const rng = D.RNG.forKey(s.seed, 'daily:' + dayKey);
    const tpls = rng.shuffle(D.QuestDB.daily.filter((t) => t.kind !== 'recycle' || s.unlockedRegions.length >= 1)).slice(0, D.EconomyConfig.dailyCount);
    s.daily = {
      dayKey,
      list: tpls.map((t, i) => ({ id: 'D_' + dayKey + '_' + i, tpl: t.id, region: t.kind === 'catchRegion' ? rng.pick(s.unlockedRegions) : null, prog: 0, claimed: false }))
    };
    s.wheel = { dayKey, freeUsed: false, rewardedUsed: 0, totalSpins: s.wheel.totalSpins || 0 };
    return true;
  };
  Q.dailyTitle = (d) => D.dailyTplById[d.tpl].title.replace('{region}', d.region ? D.RegionDB[d.region].name : '');

  // ---------- koleksiyon ----------
  Q.regionCollection = (s, reg) => {
    const ids = D.RegionDB[reg].fishIds; const got = ids.filter((id) => s.collection[id]).length;
    return { got, total: ids.length, pct: Math.floor((got / ids.length) * 100) };
  };
  Q.totalCollection = (s) => ({ got: Object.keys(s.collection).length, total: Object.keys(D.FishDBSource.FishDB).length });

  // Her başarılı işlemden sonra çağrılır (tx içinde): kilit açılımları, süre kontrolleri.
  Q.afterTx = (s, ctx) => {
    Q.refreshStory(s, ctx);
    Q.checkStateSteps(s, ctx);
  };

  D.Quests = Q;
})(globalThis.DUMEN);
