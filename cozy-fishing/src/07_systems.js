/* =====================================================================
   07_systems.js : Inventory, Tx (atomik işlem), FishSelector, Catch, Market, Orders,
   Shop, BoatManager, Automation, WorldClock/Weather/Events, Achievements, NPCDialogues, Tutorial
   ===================================================================== */
const Bus = { q: [], toast(msg, kind, icon) { this.q.push({ msg, kind: kind || 'info', icon }); }, take() { const a = this.q; this.q = []; return a; } };

/* ---------- Atomik işlem ---------- */
const Tx = {
  busy: false, lastAt: {},
  run(name, fn, opts) {
    if (this.busy) return { ok: false, msg: 'İşlem sürüyor…' };
    this.busy = true; const snap = JSON.stringify(S); let r;
    try {
      r = fn() || { ok: true };
      if (r.ok !== false) {
        S.txSeq++; S.lastTx = name + '#' + S.txSeq; S.revision++;
        Ach.check(); Cosmetics.check();
        if (!(opts && opts.noSave)) Save.now();
      }
    } catch (e) { console.error('Tx hata', name, e); S = JSON.parse(snap); r = { ok: false, msg: 'Beklenmeyen hata, işlem geri alındı.' }; }
    finally { this.busy = false; }
    try { if (typeof UI !== 'undefined' && UI.refresh) UI.refresh(); } catch (e) { console.error('UI yenileme', e); }
    return r;
  }
};
function spend(amount, cat) { S.cash -= amount; S.stats.spent += amount; S.today.expenses += amount; S.today.expBy[cat] = (S.today.expBy[cat] || 0) + amount; }

/* ---------- Envanter ---------- */
const Inv = {
  arr(key) { if (key === 'bag') return S.bag; if (key === 'chest') return S.chest; if (key && key.startsWith('boat:')) { const b = S.boats.byId[key.slice(5)]; return b ? b.storage : null; } return null; },
  cap(key) { if (key === 'bag') return INVC.bag[S.bagLevel][1]; if (key === 'chest') return INVC.home_chest[S.chestLevel][1]; if (key && key.startsWith('boat:')) return Boats.stats(key.slice(5)).storage; return 0; },
  label(key) { if (key === 'bag') return 'Sırt Çantası'; if (key === 'chest') return 'Ev Sandığı'; const id = key.slice(5); const b = S.boats.byId[id]; return BOAT[id].name + (b && b.name ? ' «' + b.name + '»' : '') + ' deposu'; },
  used(key) { const a = this.arr(key); return a ? a.length : 0; },
  total(key) { const a = this.arr(key); return a ? sum(a.map(s => s.q)) : 0; },
  space(key, f) { const a = this.arr(key); if (!a) return 0; let n = Math.max(0, this.cap(key) - a.length) * STACK; for (const s of a) if (s.f === f) n += STACK - s.q; return n; },
  hasRoomAny(key) { const a = this.arr(key); return !!a && a.length < this.cap(key); },
  add(key, f, n) {
    const a = this.arr(key); if (!a || !FISH[f]) return 0; let left = n;
    for (const s of a) if (s.f === f && s.q < STACK && left > 0) { const k = Math.min(STACK - s.q, left); s.q += k; left -= k; }
    while (left > 0 && a.length < this.cap(key)) { const k = Math.min(STACK, left); a.push({ f, q: k }); left -= k; }
    return n - left;
  },
  count(keys, f) { let n = 0; for (const k of keys) { const a = this.arr(k); if (a) for (const s of a) if (s.f === f) n += s.q; } return n; },
  remove(keys, f, n) {
    let left = n;
    for (const key of keys) { const a = this.arr(key); if (!a) continue; for (let i = a.length - 1; i >= 0 && left > 0; i--) { if (a[i].f !== f) continue; const k = Math.min(a[i].q, left); a[i].q -= k; left -= k; } this.normalize(key); if (left <= 0) break; }
    return n - left;
  },
  normalize(key) {
    const a = this.arr(key); if (!a) return; const order = [], tot = {};
    for (const s of a) { if (!s || s.q <= 0 || !FISH[s.f]) continue; if (!(s.f in tot)) { order.push(s.f); tot[s.f] = 0; } tot[s.f] += s.q; }
    a.length = 0; for (const f of order) { let q = tot[f]; while (q > 0) { const k = Math.min(STACK, q); a.push({ f, q: k }); q -= k; } }
  },
  species(keys) { const m = {}; for (const k of keys) { const a = this.arr(k); if (a) for (const s of a) m[s.f] = (m[s.f] || 0) + s.q; } return m; },
  activeBoatKey() { return S.boats.active ? 'boat:' + S.boats.active : null; },
  manualOrder() { const b = this.activeBoatKey(); return b ? ['bag', b] : ['bag']; },
  autoOrder() { const b = this.activeBoatKey(); return b ? [b, 'bag'] : ['bag']; },
  place(keys, f) { for (const k of keys) if (this.space(k, f) > 0) { this.add(k, f, 1); return k; } return null; },
  canPlace(keys, f) { return keys.some(k => this.space(k, f) > 0); },
  /* sahneye göre erişilebilir depolar */
  accessible() {
    if (Game.sceneName === 'Home') return ['bag', 'chest'];
    if (Game.sceneName === 'BoatFishing') return ['bag'].concat(S.boats.active ? ['boat:' + S.boats.active] : []);
    return ['bag'].concat(S.boats.owned.map(id => 'boat:' + id));
  },
  transfer(from, to, f, n) {
    return Tx.run('transfer', () => {
      const have = this.count([from], f); const k = Math.min(n, have, this.space(to, f));
      if (k <= 0) return { ok: false, msg: 'Hedef depoda yer yok.' };
      const rem = this.remove([from], f, k); const added = this.add(to, f, rem);
      if (added !== rem) throw new Error('transfer tutarsız');
      return { ok: true, n: added };
    });
  },
  transferAll(from, to) {
    return Tx.run('transferAll', () => {
      let moved = 0; const sp = this.species([from]);
      for (const f in sp) { const k = Math.min(sp[f], this.space(to, f)); if (k > 0) { const rem = this.remove([from], f, k); const added = this.add(to, f, rem); if (added !== rem) throw new Error('tutarsız'); moved += added; } }
      if (!moved) return { ok: false, msg: 'Aktarılabilecek balık veya yer yok.' };
      return { ok: true, n: moved };
    });
  },
  releaseStack(key, idx) {
    return Tx.run('release', () => { const a = this.arr(key); if (!a || !a[idx]) return { ok: false }; const s = a.splice(idx, 1)[0]; S.stats.released += s.q; S.today.released += s.q; return { ok: true, s }; });
  },
  validate(st) {
    const s = st || S; const errs = [];
    const chk = (name, arr, cap) => { if (!Array.isArray(arr)) { errs.push(name + ' dizi değil'); return; } if (arr.length > cap) errs.push(name + ' kapasite aşımı ' + arr.length + '>' + cap); arr.forEach(x => { if (!x || !FISH[x.f] || !(x.q >= 1 && x.q <= STACK) || x.q !== (x.q | 0)) errs.push(name + ' bozuk stack ' + JSON.stringify(x)); }); };
    chk('bag', s.bag, INVC.bag[s.bagLevel][1]); chk('chest', s.chest, INVC.home_chest[s.chestLevel][1]);
    for (const id of s.boats.owned) { const b = s.boats.byId[id]; if (!b) { errs.push('tekne yok ' + id); continue; } const info = BOAT_INFO[id]; let st2 = BOAT[id].initial_storage; for (const u of info.ups) if (b.ups[u.key] && u.type === 'storage') st2 = Math.max(st2, u.val); chk(id, b.storage, st2); }
    if (s.cash < 0 || s.energy < 0) errs.push('negatif değer');
    for (const k in s.baitStock) if (s.baitStock[k] < 0) errs.push('negatif yem');
    return errs;
  }
};

/* ---------- Tür seçici ---------- */
const BAND_MATCH = 1.25, BAND_MISS = 0.85;
const Selector = {
  weights(spotId, o) {
    const sp = SPOTS[spotId]; const rid = sp.region_id; const wx = S.world.weather[rid] || 'sunny';
    const season = World.season(); const ev = World.event(); const list = [];
    for (const fid in sp.weights) {
      const f = FISH[fid]; if (!f) continue; const base = sp.weights[fid];
      if (o.auto) { if (f.power > o.maxPower || f.power >= RC.hard_fish_only_manual_power) continue; }
      else if (f.power > o.rodPower + 1) continue;
      const fac = {};
      fac.bait = (!o.bait || o.bait === 'basic') ? K.basic_bait_multiplier : (f.favored_baits.includes(o.bait) ? K.bait_favorable_multiplier : K.bait_unfavorable_multiplier);
      fac.season = f.season_boost === season ? f.season_modifier : 1;
      fac.weather = f.weather_boost ? (f.weather_boost === wx ? K.weather_favorable_multiplier : (WX_BAD[f.weather_boost] === wx ? K.weather_unfavorable_multiplier : 1)) : 1;
      fac.band = !o.band ? 1 : (f.preferred_cast_band === o.band ? BAND_MATCH : ((f.preferred_cast_band === 'mid' || o.band === 'mid') ? 1 : BAND_MISS));
      fac.event = (ev && ev.species === fid && ev.region === rid) ? ev.modifier : 1;
      list.push({ id: fid, base, fac, w: base * fac.bait * fac.season * fac.weather * fac.band * fac.event });
    }
    const total = sum(list.map(x => x.w)); list.forEach(x => x.p = total > 0 ? x.w / total : 0);
    return { list, total, baseTotal: sum(Object.values(sp.weights)) };
  },
  pick(list) { const r = rand(); let acc = 0; for (const x of list) { acc += x.p; if (r < acc) return x.id; } return list[list.length - 1].id; },
  rollSize(fid) {
    const f = FISH[fid], sd = K.size_distribution; const r = rand(); let cls = 'normal';
    if (r >= sd.normal.prob) cls = r < sd.normal.prob + sd.large.prob ? 'large' : 'exceptional';
    const tr = sd[cls].t_range; const t = lerp(tr[0], tr[1], rand());
    const [l0, l1] = f.size_game_range.length_cm, [w0, w1] = f.size_game_range.weight_kg;
    return { cls, t, cm: Math.round(l0 + t * (l1 - l0)), kg: round2(w0 + Math.pow(t, 3) * (w1 - w0)) };
  }
};
const discovered = () => Object.keys(S.ency).filter(k => S.ency[k].caught > 0).length;
const totalCatches = () => S.stats.manualCatches + S.stats.autoCatches;
const rodOf = () => RODS.find(r => r.id === S.gear.rod);
const maxRodPower = () => Math.max(...S.gear.owned.rod.map(id => RODS.find(r => r.id === id).power));

/* ---------- Yakalama kaydı ---------- */
const Catch = {
  record(fid, size, auto) {
    const e = S.ency[fid] || (S.ency[fid] = { caught: 0, maxLen: 0, maxKg: 0, firstDay: S.day });
    const isNew = e.caught === 0; const isRecord = !isNew && size.cm > e.maxLen;
    e.caught++; if (size.cm > e.maxLen) e.maxLen = size.cm; if (size.kg > e.maxKg) e.maxKg = size.kg;
    if (isRecord) { S.stats.records++; S.today.records.push(fid); }
    if (isNew) S.today.newSpecies.push(fid);
    if (auto) { S.stats.autoCatches++; S.today.autoCatches++; } else { S.stats.manualCatches++; S.today.manualCatches++; }
    const p = FISH[fid].power; if (p === 4) S.stats.power4++; if (p === 5) S.stats.power5++;
    if (size.cm > S.stats.biggestCm) { S.stats.biggestCm = size.cm; S.stats.biggestId = fid; }
    return { isNew, isRecord };
  }
};

/* ---------- Balık hali ---------- */
const Market = {
  sources(withChest) { const s = ['bag']; if (S.boats.active) s.push('boat:' + S.boats.active); if (withChest) s.push('chest'); return s; },
  betterOffer(fid) { const base = FISH[fid].base_price; let best = null; for (const o of Orders.active()) if (o.fishId === fid && Orders.remaining(o) > 0 && o.unitPrice > base && (!best || o.unitPrice > best.unitPrice)) best = o; return best; },
  sell(fid, n, src) {
    return Tx.run('marketSell', () => {
      const have = Inv.count(src, fid); const k = Math.min(n | 0, have); if (k <= 0) return { ok: false, msg: 'Satılacak balık yok.' };
      const rem = Inv.remove(src, fid, k); const inc = rem * FISH[fid].base_price;
      S.cash += inc; S.stats.totalSales += inc; S.stats.marketSales += inc; S.stats.fishSoldMarket += rem; S.today.marketIncome += inc;
      Sound.sfx('coin'); return { ok: true, n: rem, income: inc };
    });
  },
  sellAllPlan(src, includeFav) { const sp = Inv.species(src); const out = []; for (const f in sp) { if (!includeFav && S.favorites[f]) continue; out.push({ f, n: sp[f], income: sp[f] * FISH[f].base_price, better: this.betterOffer(f) }); } return out; },
  sellAll(src, includeFav) {
    return Tx.run('marketSellAll', () => {
      const plan = this.sellAllPlan(src, includeFav); if (!plan.length) return { ok: false, msg: 'Satılacak uygun balık yok.' };
      let inc = 0, cnt = 0; for (const p of plan) { const rem = Inv.remove(src, p.f, p.n); inc += rem * FISH[p.f].base_price; cnt += rem; }
      S.cash += inc; S.stats.totalSales += inc; S.stats.marketSales += inc; S.stats.fishSoldMarket += cnt; S.today.marketIncome += inc;
      Sound.sfx('coin'); return { ok: true, n: cnt, income: inc };
    });
  }
};

/* ---------- Sipariş panosu ---------- */
const Orders = {
  slots() { const n = Object.keys(S.world.unlocked).filter(k => S.world.unlocked[k]).length; return n >= 5 ? CFG.orders.board_slots_after_five_regions : n >= 3 ? CFG.orders.board_slots_after_three_regions : CFG.orders.starting_board_slots; },
  active() { return S.orders.filter(o => S.day < o.expiresAtDayExclusive); },
  remaining(o) { return Math.max(0, o.requestedTotal - o.delivered); },
  daysLeft(o) { return o.expiresAtDayExclusive - S.day; },
  relDelivered(cid) { return (S.customers[cid] && S.customers[cid].delivered) || 0; },
  relLevel(cid) { const d = this.relDelivered(cid); const th = CFG.orders.relationship_threshold_fish_delivered; let l = 0; th.forEach(t => { if (d >= t) l++; }); return l; },
  gen(day, opts) {
    opts = opts || {};
    const r = mulberry(hash32(S.seed, 'order', day, S.orderSeq));
    const unlocked = REGIONS.filter(x => S.world.unlocked[x.id]).map(x => x.id);
    const fut = opts.future || null; let cust;
    if (opts.customerId) cust = CUST[opts.customerId];
    else { const c = CUSTOMERS.filter(c => fut ? c.focus.includes(fut) : c.focus.some(f => unlocked.includes(f))); cust = c.length ? c[Math.floor(r() * c.length)] : CUST.bahar; }
    const regs = fut ? [fut] : cust.focus.filter(f => unlocked.includes(f));
    let pool = []; (regs.length ? regs : ['sakin_liman']).forEach(rg => REGION[rg].fish_ids.forEach(fid => pool.push(fid)));
    if (!fut) { const rp = maxRodPower(); const ok = pool.filter(fid => FISH[fid].power <= rp + 1); if (ok.length && r() < 0.88) pool = ok; }
    const existing = new Set(S.orders.map(o => o.fishId)); const p2 = pool.filter(f => !existing.has(f)); if (p2.length) pool = p2;
    const fid = pool[Math.floor(r() * pool.length)]; const f = FISH[fid];
    const lvl = this.relLevel(cust.id);
    const t = opts.fair ? 0.82 + r() * 0.18 : Math.pow(r(), 1 / (1 + 0.6 * lvl));
    const bonus = clamp(lerp(cust.bonus_range[0], cust.bonus_range[1], t), CFG.orders.bonus_min, CFG.orders.bonus_max);
    const unitPrice = roundHalfUp(f.base_price * (1 + bonus));
    let qty = Math.max(2, Math.round(lerp(0.5, 2.6, r()) * 520 / (f.base_price + 22)));
    if (r() < 0.12) qty = Math.max(qty * 4, 50);
    qty = Math.min(qty, 120);
    const dur = opts.duration || CFG.orders.durations_days[Math.floor(r() * CFG.orders.durations_days.length)];
    const o = { id: 'o' + S.orderSeq, customerId: cust.id, fishId: fid, requestedTotal: qty, delivered: 0, unitPrice, bonus: round2(bonus), createdDay: day, expiresAtDayExclusive: day + dur, future: !!fut, tag: opts.tag || null };
    S.orderSeq++; return o;
  },
  refresh(day, ev) {
    S.orders = S.orders.filter(o => o.expiresAtDayExclusive > day && o.delivered < o.requestedTotal);
    const slots = this.slots(); let fc = S.orders.filter(o => o.future).length; let guard = 0;
    while (S.orders.filter(o => !o.tag).length < slots && guard++ < 20) {
      let fut = null;
      if (fc === 0 && hrand('fut', day, S.orderSeq) < 0.22) { const nx = REGIONS.find(x => !S.world.unlocked[x.id]); if (nx) fut = nx.id; }
      S.orders.push(this.gen(day, { future: fut })); if (fut) fc++;
    }
    if (ev && ev.effect === 'extra_fair_order') S.orders.push(this.gen(day, { customerId: 'bahar', fair: true, duration: 1, tag: 'event' }));
    if (ev && ev.effect === 'one_extra_order') S.orders.push(this.gen(day, { duration: 1, tag: 'event' }));
  },
  deliver(oid, n, src) {
    return Tx.run('orderDeliver', () => {
      const o = S.orders.find(x => x.id === oid); if (!o || S.day >= o.expiresAtDayExclusive) return { ok: false, msg: 'İlan geçerli değil.' };
      const rem = this.remaining(o); const have = Inv.count(src, o.fishId); const k = Math.min(n | 0, rem, have);
      if (k <= 0) return { ok: false, msg: have ? 'İlan doldu.' : 'Elinde bu türden balık yok.' };
      const got = Inv.remove(src, o.fishId, k); const inc = got * o.unitPrice;
      o.delivered += got; S.cash += inc;
      const c = S.customers[o.customerId] || (S.customers[o.customerId] = { delivered: 0 }); const before = this.relLevel(o.customerId); c.delivered += got;
      S.stats.ordersDelivered += got; S.stats.orderSales += inc; S.stats.totalSales += inc; S.stats.buyers[o.customerId] = true; S.today.orderIncome += inc;
      if (this.relLevel(o.customerId) > before) Bus.toast(CUST[o.customerId].name + ' ile ilişki seviyesi ' + this.relLevel(o.customerId) + ' oldu!', 'good', 'cust_' + o.customerId);
      Sound.sfx('coin'); return { ok: true, n: got, income: inc };
    });
  }
};

/* ---------- Dükkân ---------- */
const Shop = {
  owns(kind, id) { return S.gear.owned[kind].includes(id); },
  gearState(kind, id) {
    const list = GEAR[kind], i = list.findIndex(x => x.id === id), it = list[i];
    if (this.owns(kind, id)) return S.gear[kind] === id ? 'equipped' : 'owned';
    if (i > 0 && !this.owns(kind, list[i - 1].id)) return 'locked';
    return S.cash >= it.price ? 'buy' : 'poor';
  },
  buyGear(kind, id) {
    return Tx.run('buyGear', () => {
      const st = this.gearState(kind, id); const it = GEAR[kind].find(x => x.id === id);
      if (st === 'owned' || st === 'equipped') return { ok: false, msg: 'Zaten sahipsin.' };
      if (st === 'locked') return { ok: false, msg: 'Önce bir önceki seviyeyi almalısın.' };
      if (S.cash < it.price) return { ok: false, msg: 'Paran yetmiyor.' };
      spend(it.price, 'gear'); S.gear.owned[kind].push(id); S.gear[kind] = id; S.stats.gearBought++;
      Sound.sfx('buy'); return { ok: true };
    });
  },
  equip(kind, id) { if (!this.owns(kind, id)) return; S.gear[kind] = id; Save.soon(); UI.refresh(); },
  baitMult() { const e = World.event(); return e && e.effect === 'bait_prices_multiplier' ? e.modifier : 1; },
  baitCost(id, qty) { return roundHalfUp(BAIT[id].purchase_price * qty * this.baitMult()); },
  buyBait(id, qty) {
    return Tx.run('buyBait', () => {
      if (!PAID_BAITS.includes(id) || !(qty > 0)) return { ok: false };
      const c = this.baitCost(id, qty); if (S.cash < c) return { ok: false, msg: 'Paran yetmiyor.' };
      spend(c, 'bait'); S.baitStock[id] += qty; Sound.sfx('buy'); return { ok: true };
    });
  },
  setBait(id) { if (id !== 'basic' && !(S.baitStock[id] > 0)) return false; S.gear.bait = id; Save.soon(); UI.refresh(); return true; },
  buyBag() {
    return Tx.run('buyBag', () => { const n = S.bagLevel + 1; const t = INVC.bag[n]; if (!t) return { ok: false, msg: 'Çanta en üst seviyede.' }; if (S.cash < t[2]) return { ok: false, msg: 'Paran yetmiyor.' }; spend(t[2], 'gear'); S.bagLevel = n; S.stats.gearBought++; Sound.sfx('buy'); return { ok: true }; });
  },
  buyChest() {
    return Tx.run('buyChest', () => { const n = S.chestLevel + 1; const t = INVC.home_chest[n]; if (!t) return { ok: false, msg: 'Sandık en üst seviyede.' }; if (S.cash < t[2]) return { ok: false, msg: 'Paran yetmiyor.' }; spend(t[2], 'home'); S.chestLevel = n; Sound.sfx('buy'); return { ok: true }; });
  },
  buyCosmetic(kind, id) {
    return Tx.run('buyCos', () => {
      let it, list;
      if (kind === 'outfit') { it = OUTFITS.find(o => o.id === id); list = S.wardrobe.outfits; }
      else if (kind === 'hat') { it = HATS.find(o => o.id === id); list = S.wardrobe.hats; }
      else if (kind === 'decor') { it = DECOR_BY[id]; list = S.home.owned; }
      else if (kind === 'boatColor') { it = BOAT_COLORS.find(o => o.id === id); list = S.cosmetics.boatColors; }
      if (!it || !it.price) return { ok: false, msg: 'Satın alınamaz.' };
      if (list.includes(id)) return { ok: false, msg: 'Zaten sahipsin.' };
      if (S.cash < it.price) return { ok: false, msg: 'Paran yetmiyor.' };
      spend(it.price, 'cosmetic'); list.push(id); Sound.sfx('buy'); return { ok: true };
    });
  }
};
const Cosmetics = {
  check() {
    const un = (list, id, name) => { if (!list.includes(id)) { list.push(id); Bus.toast('Yeni kozmetik açıldı: ' + name, 'good', 'wardrobe'); } };
    if (S.stats.regionsVisited.sisli_kuzey) un(S.wardrobe.outfits, 'kuzey', 'Kuzey Kazağı');
    if (S.stats.regionsVisited.gunes_adalari) un(S.wardrobe.outfits, 'tropik', 'Tropik Gömlek');
    if (S.ach.species42) un(S.wardrobe.hats, 'usta', 'Usta Balıkçı Şapkası');
    if (S.ach.all_boats) un(S.wardrobe.hats, 'kaptan', 'Kaptan Şapkası');
    if (discovered() >= 30) un(S.cosmetics.boatColors, 'sand', 'Kum Sarısı tekne boyası');
  },
  placeDecor(slot, id) {
    if (id && (!S.home.owned.includes(id) || DECOR_BY[id].slot !== slot)) return;
    S.home.decor[slot] = id || null; Ach.check(); Save.soon(); UI.refresh();
  }
};

/* ---------- Tekneler ---------- */
const Boats = {
  stats(id) {
    const def = BOAT[id], info = BOAT_INFO[id], b = S.boats.byId[id]; const ups = (b && b.ups) || {};
    let motor = def.default_motor, nav = info.nav0, hull = 0, storage = def.initial_storage;
    for (const u of info.ups) if (ups[u.key]) { if (u.type === 'motor') motor = Math.max(motor, u.val); if (u.type === 'navigation') nav = Math.max(nav, u.val); if (u.type === 'hull') hull = Math.max(hull, u.val); if (u.type === 'storage') storage = Math.max(storage, u.val); }
    return { tier: info.tier, motor, nav, hull, storage, slots: def.slots };
  },
  owned(id) { return S.boats.owned.includes(id); },
  upState(id, key) {
    const info = BOAT_INFO[id], u = info.ups.find(x => x.key === key), b = S.boats.byId[id];
    if (!b) return 'noboat'; if (b.ups[key]) return 'owned'; if (u.req && !b.ups[u.req]) return 'locked';
    return S.cash >= u.price ? 'buy' : 'poor';
  },
  buy(id) {
    return Tx.run('buyBoat', () => {
      if (this.owned(id)) return { ok: false, msg: 'Bu tekneye zaten sahipsin.' };
      const p = BOAT[id].price; if (S.cash < p) return { ok: false, msg: 'Paran yetmiyor.' };
      spend(p, 'boat'); S.boats.owned.push(id); S.boats.byId[id] = { ups: {}, storage: [], color: 'sea_green', name: '' };
      if (!S.boats.active) S.boats.active = id;
      this.updateUnlocked(); Sound.sfx('fanfare'); return { ok: true };
    });
  },
  buyUpgrade(id, key) {
    return Tx.run('buyUpgrade', () => {
      const st = this.upState(id, key); const u = BOAT_INFO[id].ups.find(x => x.key === key);
      if (st === 'owned') return { ok: false, msg: 'Zaten yüklü.' }; if (st === 'locked') return { ok: false, msg: 'Önce önceki basamak gerekli.' }; if (st === 'noboat') return { ok: false, msg: 'Tekne yok.' };
      if (S.cash < u.price) return { ok: false, msg: 'Paran yetmiyor.' };
      spend(u.price, 'boat'); S.boats.byId[id].ups[key] = true; this.updateUnlocked(); Sound.sfx('buy'); return { ok: true };
    });
  },
  setActive(id) { return Tx.run('setActiveBoat', () => { if (!this.owned(id)) return { ok: false }; S.boats.active = id; return { ok: true }; }); },
  reach(rid, id) {
    const q = REGION_REQ[rid]; if (rid === 'sakin_liman') return { ok: true, miss: [] };
    if (!id) return { ok: false, miss: ['Tekne gerekli'] };
    const st = this.stats(id); const miss = [];
    if (st.tier < q.tier) miss.push('En az ' + BOATS[q.tier - 1].name);
    if (st.motor < q.motor) miss.push('Motor ' + ROMAN_S[q.motor]);
    if (st.nav < q.nav) miss.push('Navigasyon ' + ROMAN_S[q.nav]);
    return { ok: miss.length === 0, miss };
  },
  updateUnlocked() { for (const r of REGIONS) if (!S.world.unlocked[r.id] && S.boats.owned.some(b => this.reach(r.id, b).ok)) { S.world.unlocked[r.id] = true; Bus.toast(r.name + ' artık erişilebilir!', 'good', 'map'); } },
  setColor(id, cid) { const b = S.boats.byId[id]; if (!b || !S.cosmetics.boatColors.includes(cid)) return; b.color = cid; Save.soon(); UI.refresh(); },
  setName(id, name) { const b = S.boats.byId[id]; if (!b) return; b.name = upTR(name).split('').filter(ch => FONT[ch] && ch !== '?').join('').slice(0, 12).trim(); Save.soon(); UI.refresh(); }
};

/* ---------- Otomasyon ---------- */
const Auto = {
  DEV: ['auto1', 'auto2', 'auto3'], GLB: ['auto_reel', 'sensing', 'deep_sea_gear'], anim: [],
  owned(id) { return AUTO[id].type === 'device' ? !!S.auto.devices[id] : !!S.auto.globals[id]; },
  state(id) { if (this.owned(id)) return 'owned'; const rq = AUTO[id].requires; if (rq && !this.owned(rq)) return 'locked'; return S.cash >= AUTO[id].price ? 'buy' : 'poor'; },
  mountedOn(bid) { return this.DEV.filter(d => S.auto.devices[d] && S.auto.devices[d].boat === bid); },
  slotsFree(bid) { return BOAT[bid].slots - this.mountedOn(bid).length; },
  buy(id) {
    return Tx.run('buyAuto', () => {
      const st = this.state(id); if (st === 'owned') return { ok: false, msg: 'Zaten sahipsin.' }; if (st === 'locked') return { ok: false, msg: 'Önce ' + AUTO[AUTO[id].requires].name + ' gerekli.' };
      if (S.cash < AUTO[id].price) return { ok: false, msg: 'Paran yetmiyor.' };
      spend(AUTO[id].price, 'automation');
      if (AUTO[id].type === 'device') { const a = S.boats.active; S.auto.devices[id] = { boat: (a && this.slotsFree(a) > 0) ? a : null, counter: 0 }; }
      else S.auto.globals[id] = true;
      Sound.sfx('buy'); return { ok: true };
    });
  },
  mount(dev, bid) {
    return Tx.run('mountDevice', () => {
      const d = S.auto.devices[dev]; if (!d) return { ok: false, msg: 'Cihaz yok.' }; if (!Boats.owned(bid)) return { ok: false };
      if (d.boat === bid) return { ok: false, msg: 'Zaten bu teknede.' };
      if (this.slotsFree(bid) <= 0) return { ok: false, msg: 'Teknede boş olta yuvası yok.' };
      d.boat = bid; return { ok: true };
    });
  },
  unmount(dev) { return Tx.run('unmountDevice', () => { const d = S.auto.devices[dev]; if (!d || !d.boat) return { ok: false }; d.boat = null; return { ok: true }; }); },
  every() { return S.auto.globals.auto_reel ? AUTO.auto_reel.attempt_every_casts : AUTO.auto1.attempt_every_casts; },
  success() { return S.auto.globals.sensing ? AUTO.sensing.success : S.auto.globals.auto_reel ? AUTO.auto_reel.success : AUTO.auto1.success; },
  maxPower(bid) { let p = AUTO.auto1.max_power; if (S.auto.globals.auto_reel) p = AUTO.auto_reel.max_power; if (S.auto.globals.deep_sea_gear && bid === AUTO.deep_sea_gear.only_boat) p = AUTO.deep_sea_gear.max_power; return Math.min(p, RC.hard_fish_only_manual_power - 1); },
  pickBait() { const cur = S.gear.bait; if (cur !== 'basic' && S.baitStock[cur] > 0) return cur; for (const b of PAID_BAITS) if (S.baitStock[b] > 0) return b; return null; },
  /* tamamlanan her geçerli manuel atışta çağrılır */
  onCastComplete(spotId, mode) {
    const ev = [];
    if (mode !== 'boat' || !S.boats.active) return ev;
    if (S.auto.dailyDay !== S.day) { S.auto.dailyDay = S.day; S.auto.dailyCaught = 0; }
    const bid = S.boats.active, every = this.every();
    for (const dev of this.mountedOn(bid)) {
      const d = S.auto.devices[dev]; d.counter = Math.min(every, d.counter + 1);
      if (d.counter < every) { ev.push({ dev, type: 'tick' }); continue; }
      const reason = this.blocker(spotId, bid);
      if (reason) { d.paused = reason; ev.push({ dev, type: 'paused', reason }); continue; }
      d.paused = null;
      const bait = this.pickBait(); S.baitStock[bait]--; S.stats.baitUsed++; d.counter = 0; S.auto.attempts++; S.stats.autoAttempts++;
      if (rand() < this.success()) {
        const sel = Selector.weights(spotId, { auto: true, maxPower: this.maxPower(bid), bait });
        let list = sel.list.filter(x => Inv.canPlace(Inv.autoOrder(), x.id));
        const tot = sum(list.map(x => x.w)); list.forEach(x => x.p = x.w / tot);
        const fid = Selector.pick(list); const size = Selector.rollSize(fid);
        const where = Inv.place(Inv.autoOrder(), fid); if (!where) throw new Error('auto place fail');
        const rec = Catch.record(fid, size, true); S.auto.dailyCaught++; S.auto.total++;
        ev.push({ dev, type: 'catch', fid, size, where, rec });
      } else { S.stats.autoFails++; ev.push({ dev, type: 'miss' }); }
    }
    return ev;
  },
  blocker(spotId, bid) {
    if (S.auto.dailyCaught >= CORE.auto_daily_catch_cap) return 'cap';
    const sel = Selector.weights(spotId, { auto: true, maxPower: this.maxPower(bid), bait: 'worm' }); if (!sel.list.length) return 'power';
    if (!this.pickBait()) return 'bait';
    const keys = Inv.autoOrder(); if (!keys.some(k => Inv.hasRoomAny(k)) && !sel.list.some(x => Inv.canPlace(keys, x.id))) return 'full';
    return null;
  },
  reasonTr: { cap: 'Günlük 6 otomatik av sınırı doldu', power: 'Bu noktadaki türler cihaz gücünü aşıyor', bait: 'Ücretli yem yok (temel yem kullanılamaz)', full: 'Depo ve çanta dolu' }
};

/* ---------- Dünya saati, hava, olaylar ---------- */
const World = {
  season(d) { d = d || S.day; return SEASONS[Math.floor(((d - 1) % CORE.year_days) / CORE.season_days)]; },
  seasonDay(d) { d = d || S.day; return ((d - 1) % CORE.season_days) + 1; },
  year(d) { d = d || S.day; return Math.floor((d - 1) / CORE.year_days) + 1; },
  weatherFor(rid, d) {
    const cl = Object.assign({}, CLIMATE[rid]); const sm = SEASON_WX[this.season(d)]; for (const k in sm) cl[k] *= sm[k];
    const r = hrand('wx', d, rid); return wpick(CFG.weather.types, t => cl[t] || 0, r);
  },
  event() { return S.world.eventId ? EVENT[S.world.eventId] : null; },
  rollEvent(d) {
    if (hrand('evc', d) >= CORE.daily_event_chance) return null;
    const h = S.world.eventHist; const last2 = h.slice(-2);
    const el = EVENTS.filter(e => (!e.region || S.world.unlocked[e.region]) && !(last2.length === 2 && last2[0] === e.id && last2[1] === e.id));
    if (!el.length) return null; return el[Math.floor(hrand('evp', d) * el.length)].id;
  },
  eventText(e) {
    if (!e) return '';
    if (e.species) return REGION[e.region].name + ': ' + FISH[e.species].name_tr + ' görülme ağırlığı ×' + String(e.modifier).replace('.', ',');
    switch (e.effect) {
      case 'reel_tension_gain_multiplier': return REGION[e.region].name + ': misina gerilim artışı ×' + String(e.modifier).replace('.', ',');
      case 'extra_fair_order': return 'Bahar Lokantası panoya yüksek primli bir ek ilan astı';
      case 'one_extra_order': return 'Panoda bugünlük bir ek alım ilanı var';
      case 'bait_prices_multiplier': return 'Zeynep\'in dükkânında yem fiyatları ×' + String(e.modifier).replace('.', ',');
      case 'bite_chance_bonus': return REGION[e.region].name + ': vurma şansı +%' + Math.round(e.modifier * 100);
    }
    return '';
  },
  startDay() {
    S.world.weather = {}; for (const r of REGIONS) S.world.weather[r.id] = this.weatherFor(r.id, S.day);
    const ev = this.rollEvent(S.day); S.world.eventId = ev; S.world.eventHist.push(ev || '-'); if (S.world.eventHist.length > 6) S.world.eventHist.shift();
    S.world.seasonsSeen[this.season()] = true;
    Orders.refresh(S.day, this.event());
    S.auto.dailyCaught = 0; S.auto.dailyDay = S.day;
    S.energy = CORE.daily_energy; S.today = newToday(S);
  },
  sleep() {
    let rep = null;
    const r = Tx.run('sleep', () => {
      if (S.pendingCast) S.pendingCast = null;
      rep = deepClone(S.today); rep.endCash = S.cash; rep.energyLeft = S.energy; rep.prevDay = S.day;
      S.stats.daysCompleted++; S.day++; this.startDay(); S.scene = 'Home';
      rep.newDay = S.day; rep.season = this.season(); rep.weather = S.world.weather.sakin_liman; rep.event = S.world.eventId;
      rep.newSeason = this.seasonDay() === 1; rep.newYear = rep.newSeason && this.season() === 'spring';
      return { ok: true };
    });
    return r.ok ? rep : null;
  }
};

/* ---------- Başarımlar ---------- */
const ACH_DEF = {
  first_catch: [() => totalCatches(), 1], first_sale: [() => S.stats.fishSoldMarket + S.stats.ordersDelivered, 1], first_partial: [() => S.stats.ordersDelivered, 1],
  first_sleep: [() => S.stats.daysCompleted, 1], first_gear: [() => S.stats.gearBought, 1], ten_fish: [() => totalCatches(), 10],
  fifty_manual: [() => S.stats.manualCatches, 50], twofifty_manual: [() => S.stats.manualCatches, 250], thousand_manual: [() => S.stats.manualCatches, 1000],
  first_power4: [() => S.stats.power4, 1], first_power5: [() => S.stats.power5, 1], species25: [() => discovered(), 25],
  first_trip: [() => S.stats.trips, 1], visit3: [() => Object.keys(S.stats.regionsVisited).length, 3], visit7: [() => Object.keys(S.stats.regionsVisited).length, 7],
  spots10: [() => Object.keys(S.stats.spotsVisited).length, 10], spots21: [() => Object.keys(S.stats.spotsVisited).length, 21], all_seasons: [() => Object.keys(S.world.seasonsSeen).length, 4],
  sales10k: [() => S.stats.totalSales, 10000], sales100k: [() => S.stats.totalSales, 100000], orders50: [() => S.stats.ordersDelivered, 50], orders500: [() => S.stats.ordersDelivered, 500],
  buyers5: [() => Object.keys(S.stats.buyers).length, 5], relation3: [() => Math.max(0, ...CUSTOMERS.map(c => Orders.relLevel(c.id))), 3],
  first_boat: [() => S.boats.owned.includes('coastal_skiff') ? 1 : 0, 1], second_boat: [() => S.boats.owned.length, 2], all_boats: [() => S.boats.owned.length, 4],
  first_auto: [() => S.auto.total, 1], auto100: [() => S.auto.total, 100], motor5: [() => (S.boats.byId.offshore && S.boats.byId.offshore.ups.motor_V) ? 1 : 0, 1],
  species5: [() => discovered(), 5], species20: [() => discovered(), 20], species42: [() => discovered(), 42], records10: [() => S.stats.records, 10],
  day100: [() => S.stats.daysCompleted, 100], home3: [() => Object.values(S.home.decor).filter(Boolean).length, 3]
};
const Ach = {
  progress(id) { const d = ACH_DEF[id]; const v = d[0](); return { v: Math.min(v, d[1]), t: d[1], done: !!S.ach[id] }; },
  check() {
    for (const a of ACHS) {
      if (S.ach[a.id]) continue; const d = ACH_DEF[a.id]; if (!d) continue;
      if (d[0]() >= d[1]) {
        S.ach[a.id] = S.day; if (S.today) S.today.achievements.push(a.id);
        const rw = ACH_REWARD[a.id]; if (rw && rw.type === 'decor' && !S.home.owned.includes(rw.id)) S.home.owned.push(rw.id);
        Bus.toast('Başarım: ' + a.name + (rw ? ' · Ödül: ' + rw.name : ''), 'ach', 'trophy'); Sound.sfx('ach');
      }
    }
  }
};

/* ---------- NPC diyalogları ---------- */
const NPC_TRIG = {
  first_meet: [true, () => true],
  rod2: [true, () => Shop.owns('rod', 'light')], rod3: [true, () => Shop.owns('rod', 'fiberglass')], rod4: [true, () => Shop.owns('rod', 'carbon')], rod5: [true, () => Shop.owns('rod', 'professional')],
  first_boat: [true, () => S.boats.owned.length >= 1], second_boat: [true, () => S.boats.owned.length >= 2], third_boat: [true, () => S.boats.owned.length >= 3], fourth_boat: [true, () => S.boats.owned.length >= 4],
  kuzey: [true, () => !!S.world.unlocked.sisli_kuzey], north: [true, () => !!S.world.unlocked.sisli_kuzey], tropik: [true, () => !!S.world.unlocked.gunes_adalari], tropics: [true, () => !!S.world.unlocked.gunes_adalari],
  first_sale: [true, () => S.stats.totalSales > 0], sales10k: [true, () => S.stats.totalSales >= 10000], sales100k: [true, () => S.stats.totalSales >= 100000],
  first_partial: [true, () => S.stats.ordersDelivered >= 1], order50: [true, () => S.stats.ordersDelivered >= 50], relationship2: [true, () => Orders.relLevel('bahar') >= 2],
  first_catch: [true, () => totalCatches() >= 1], rocky: [true, () => !!S.world.unlocked.kayalik_adalar], currents: [true, () => !!S.world.unlocked.serin_akintilar], deep: [true, () => !!S.world.unlocked.derin_mavi], all_species: [true, () => discovered() >= 42],
  first_auto: [true, () => !!S.auto.devices.auto1], deep_gear: [true, () => !!S.auto.globals.deep_sea_gear], max_hull: [true, () => S.boats.owned.some(id => S.boats.byId[id].ups.hull_II)],
  big_order: [false, () => Orders.active().some(o => o.requestedTotal >= 50 && Orders.remaining(o) > 0)],
  record: [false, null]
};
const NPCDialog = {
  line(npc) {
    const st = S.npc[npc] || (S.npc[npc] = { seen: {}, lastRecord: 0, lastDay: 0, lastTrig: null, bigDay: 0 });
    const list = CFG.npc_dialogues[npc]; const by = Object.fromEntries(list.map(d => [d.trigger, d.text_tr]));
    let trig = null;
    if (!st.seen.first_meet) trig = 'first_meet';
    if (!trig) for (const d of list) { const t = NPC_TRIG[d.trigger]; if (t && t[0] && !st.seen[d.trigger] && t[1]()) { trig = d.trigger; break; } }
    if (!trig && by.record && S.stats.records > st.lastRecord) trig = 'record';
    if (!trig && by.big_order && st.bigDay !== S.day && NPC_TRIG.big_order[1]()) { trig = 'big_order'; st.bigDay = S.day; }
    for (const ft of ['festival_today', 'festival_soon']) if (!trig && by[ft] && st[ft + 'Day'] !== S.day && NPC_TRIG[ft] && NPC_TRIG[ft][1]()) { trig = ft; st[ft + 'Day'] = S.day; }
    if (!trig && st.lastDay === S.day && st.lastTrig && by[st.lastTrig]) trig = st.lastTrig;
    if (!trig) {
      const wx = S.world.weather.sakin_liman;
      if (by[wx] && hrand('npcwx', S.day, npc) < 0.5) trig = wx;
      else { const g = list.filter(d => d.trigger.startsWith('day_generic') || d.trigger === 'generic_after'); trig = g[(S.day + Object.keys(NPCS).indexOf(npc)) % g.length].trigger; }
    }
    if (NPC_TRIG[trig] && NPC_TRIG[trig][0]) st.seen[trig] = S.day;
    if (trig === 'record') st.lastRecord = S.stats.records;
    st.lastDay = S.day; st.lastTrig = trig;
    return { npc, trigger: trig, text: by[trig] };
  },
  tip() {
    const opts = REGIONS.filter(r => S.world.unlocked[r.id]);
    const r = opts[Math.floor(hrand('tipr', S.day) * opts.length)]; const wx = S.world.weather[r.id];
    const fans = r.fish_ids.filter(f => FISH[f].weather_boost === wx); const sea = r.fish_ids.filter(f => FISH[f].season_boost === World.season());
    let t = 'Bugün ' + r.name + ' ' + WEATHER_TR[wx].toLocaleLowerCase('tr-TR') + '.';
    if (fans.length) t += ' ' + FISH[fans[0]].name_tr + ' bu havayı sever.';
    if (sea.length) t += ' Bu mevsim ' + sea.map(f => FISH[f].name_tr).slice(0, 2).join(' ve ') + ' daha sık görülür.';
    return t;
  }
};

/* ---------- Öğretici (atlanabilir, kilit koymaz) ---------- */
const TUT = [
  { t: 'İskeleye yürü ve Efe ile tanış', done: () => S.npc.efe && S.npc.efe.seen.first_meet },
  { t: 'İskele ucunda olta at ve ilk balığını yakala', done: () => totalCatches() >= 1 },
  { t: 'Balığını Nihat\'ın haline sat ya da panodaki bir ilana teslim et', done: () => S.stats.totalSales > 0 },
  { t: 'Bora\'nın Tekne Atölyesi\'ne uğra: ilk tekne hedefi 2.200', done: () => !!S.flags.sawBoatyard }
];
const Tutorial = {
  current() { if (S.tutorial.skipped) return null; while (S.tutorial.step < TUT.length && TUT[S.tutorial.step].done()) S.tutorial.step++; return S.tutorial.step < TUT.length ? TUT[S.tutorial.step] : null; }
};
