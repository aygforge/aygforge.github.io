// Ticaret: fiyat hesabı, pazar üretimi, alış/satış, bozulma, kaçak mallar.
// GDD: Satış fiyatı = baz satış × liman tipi çarpanı × (1 + tayfa ve upgrade satış bonusları) × bozulma çarpanı.
import * as X1 from './X1System.js';
import * as X2 from './X2System.js';
import { BALANCE } from '../config/balance.js';
import { GOOD_BY_ID, TRADE_GOODS, HARBOR_PRICE_MULT, HARBOR_MARKET_BIAS } from '../data/goods.js';
import { HARBOR_BY_ID } from '../data/harbors.js';
import { SeededRNG, hashString } from '../core/SeededRNG.js';
import { hasUpgrade } from '../core/GameState.js';
import { cargoFree, cargoUsed } from './ShipSystem.js';
import { regionDemand } from './RouteSystem.js';
import { hasCrew, hasItem, hasPet, crewSkillMult } from './CrewSystem.js';
import { wearItem } from './ItemSystem.js';

const RARE_GROUP = 'rare';

function jitter(seed, ...keys) {
  // [-1, 1] deterministik sapma
  const h = hashString(`${seed}|${keys.join('|')}`);
  return (h / 4294967295) * 2 - 1;
}

/** Limanın tipine ve seed'e göre mal çarpanı (alış ve satışa birlikte uygulanır). */
export function harborGoodMult(seed, harbor, goodId) {
  const base = HARBOR_PRICE_MULT[harbor.type]?.[goodId] ?? 1;
  const mj = 1 + jitter(seed, 'hm', harbor.id, goodId) * BALANCE.trade.harborMultJitter;
  const pj = 1 + jitter(seed, 'pj', harbor.id, goodId) * BALANCE.trade.priceJitter;
  return base * mj * pj * regionDemand(seed, harbor.region, goodId);
}

export function isContrabandAt(goodId, harbor) {
  return !!GOOD_BY_ID[goodId]?.contraband && harbor.type === 'military';
}

export function statusList(G) {
  return G.run.visit?.statuses || [];
}

/** DENGE: malın piyasa değeri (tek değer). Alış bunun üstünde, satış altında; aradaki makas limanda al-sat kârını
 *  ve rastgele ticareti zararlı yapar. Kâr ancak ucuz limandan alıp pahalı limana taşıyınca çıkar. */
export function marketValue(G, harbor, goodId) {
  const good = GOOD_BY_ID[goodId];
  return good.sell * BALANCE.trade.valueFactor * harborGoodMult(G.run.seed, harbor, goodId);
}
/** Bu ziyarette aynı maldan satılan birim sayısına göre doygunluk çarpanı */
export function saturation(G, harborId, goodId, extra = 0) {
  const v = G.run.visit;
  if (!v || v.harborId !== harborId) return 1;
  const n = (v.soldUnits?.[goodId] || 0) + extra;
  return Math.max(BALANCE.trade.saturationFloor, 1 - n * BALANCE.trade.saturationPerUnit);
}

/** Alış fiyatı (birim) */
export function buyPrice(G, harborId, goodId, statuses = null) {
  const good = GOOD_BY_ID[goodId];
  const harbor = HARBOR_BY_ID[harborId];
  const econ = BALANCE.harborEconomy[harbor.type];
  let p = marketValue(G, harbor, goodId) * econ.buy * (1 + BALANCE.trade.spread / 2);
  const cm = crewSkillMult(G);
  let disc = 0;
  if (hasCrew(G, 'CREW_FATIMA') && (goodId === 'GOOD_SPICE' || goodId === 'GOOD_EXOTIC_ANIMAL')) disc += 0.2 * cm;
  if (hasCrew(G, 'CREW_ISADORA') && (harbor.type === 'military' || harbor.type === 'trade')) disc += 0.15 * cm;
  p *= Math.max(0.3, 1 - disc);
  const st = statuses ?? statusList(G);
  if (st.includes('contraband')) p *= BALANCE.trade.contrabandStatusMult;
  if (st.includes('hero')) p *= BALANCE.trade.heroBuyMult;
  return Math.max(1, Math.round(p));
}

/** Satış bonusları (toplam yüzde, açıklamalarıyla) */
export function sellBonuses(G, goodId) {
  const good = GOOD_BY_ID[goodId];
  const cm = crewSkillMult(G);
  const list = [];
  if (hasCrew(G, 'CREW_HAMID')) list.push({ label: 'Hamid', v: 0.12 * cm });
  if (hasCrew(G, 'CREW_MEILIN') && good.group === RARE_GROUP) list.push({ label: 'Mei Lin', v: 0.2 * cm });
  if (hasItem(G, 'ITEM_MERCHANT_SEAL')) list.push({ label: 'Tüccar Mühürü', v: 0.15 });
  if (hasUpgrade(G.meta, 'UPG_GLOBAL_NET')) list.push({ label: 'Global Satış Ağı', v: 0.05 });
  if (good.contraband && hasItem(G, 'ITEM_SMUGGLER_HOLD')) list.push({ label: 'Kaçakçılık Bölmesi', v: 0.3 });
  return list;
}

/** Satış fiyatı (birim). spoiled: bozulmuş mal %40. */
export function sellPrice(G, harborId, goodId, { spoiled = false, statuses = null } = {}) {
  const good = GOOD_BY_ID[goodId];
  if (good.questItem) return 0;
  const harbor = HARBOR_BY_ID[harborId];
  const econ = BALANCE.harborEconomy[harbor.type];
  let p = marketValue(G, harbor, goodId) * econ.sell * (1 - BALANCE.trade.spread / 2) * saturation(G, harborId, goodId);
  const bonus = sellBonuses(G, goodId).reduce((s, b) => s + b.v, 0);
  p *= 1 + bonus;
  const st = statuses ?? statusList(G);
  if (st.includes('fine')) p *= BALANCE.trade.fineSellMult;
  if (st.includes('boom')) p *= 1.15;
  if (harbor.type === 'pirate') p *= X1.pirateHarborMult(G); // Korsan Yuvası'nda Kızıl Yelken itibarı (tek kaynak)
  p *= X1.sellMult(G, harbor, good);
  p *= X2.sellMult(G.run);
  if (spoiled) p *= BALANCE.trade.spoiledSellFactor;
  return Math.max(1, Math.round(p));
}

export function generateMarket(G, harborIdx, statuses) {
  const harbor = HARBOR_BY_ID[G.run.route[harborIdx].harborId];
  const rng = SeededRNG.derive(G.run.seed, 'market', harborIdx, harbor.id);
  const [mn, mx] = BALANCE.trade.marketGoods;
  const n = harbor.final ? TRADE_GOODS.length : rng.int(mn, mx);
  const bias = HARBOR_MARKET_BIAS[harbor.type] || [];
  const candidates = TRADE_GOODS.filter((g) => !(harbor.type === 'military' && g.contraband));
  const picked = [];
  const rest = candidates.slice();
  while (picked.length < n && rest.length) {
    const g = rng.weighted(rest, (x) => {
      let w = bias.includes(x.id) ? 6 : 2;
      if (x.group === 'rare' && harbor.region <= 1) w *= 0.3;
      if (x.group === 'valuable' && harbor.region <= 1 && harbor.type === 'fishing') w *= 0.5;
      return w;
    });
    picked.push(g);
    rest.splice(rest.indexOf(g), 1);
  }
  const [smin, smax] = BALANCE.trade.marketStock;
  const stockMult = statuses.includes('damaged') ? BALANCE.trade.damagedHarborStockMult : 1;
  return picked.map((g) => {
    let stock = rng.int(smin, smax) + (g.group === 'basic' ? 2 : 0) - (g.group === 'rare' ? 1 : 0);
    stock = Math.max(1, Math.round(stock * stockMult));
    return { good: g.id, stock };
  });
}

/** Bu limanda satılabilir mi? */
export function canSellHere(G, lot) {
  const good = GOOD_BY_ID[lot.good];
  const harbor = HARBOR_BY_ID[G.run.visit.harborId];
  if (good.questItem) return { ok: false, reason: 'Bu sandık satılamaz; zincir görevine ait.' };
  if (isContrabandAt(lot.good, harbor)) return { ok: false, reason: 'Askerî limanda kaçak mal satılamaz.' };
  return { ok: true };
}

export function lotSellPrice(G, lot) {
  const visit = G.run.visit;
  // Aynı ziyarette alınan mal yalnızca alış fiyatına iade edilebilir (aynı limanda al-sat kârı yok).
  if (lot.boughtVisit === visit.key && !lot.spoiled) return lot.cost;
  return sellPrice(G, visit.harborId, lot.good, { spoiled: lot.spoiled });
}

export function buyGood(G, goodId, qty = 1) {
  const run = G.run;
  const visit = run.visit;
  if (!visit) return { ok: false, reason: 'Limanda değilsin.' };
  const entry = visit.market.find((m) => m.good === goodId);
  if (!entry) return { ok: false, reason: 'Bu mal bu limanda satılmıyor.' };
  if (entry.stock < qty) return { ok: false, reason: 'Limanda yeterli stok yok.' };
  if (cargoFree(G) < qty) return { ok: false, reason: 'Kargo dolu.' };
  const price = buyPrice(G, visit.harborId, goodId);
  const total = price * qty;
  if (run.gold < total) return { ok: false, reason: `Yetersiz altın (${total} gerekli).` };
  run.gold -= total;
  entry.stock -= qty;
  const existing = run.cargo.find((l) => l.good === goodId && l.cost === price && !l.spoiled && l.boughtVisit === visit.key);
  if (existing) existing.qty += qty;
  else run.cargo.push({ id: run.lotSeq++, good: goodId, qty, cost: price, spoiled: false, boughtVisit: visit.key });
  G.meta.codex.goods[goodId] = true;
  return { ok: true, price, total };
}

export function sellLot(G, lotId, qty = 1) {
  const run = G.run;
  const lot = run.cargo.find((l) => l.id === lotId);
  if (!lot) return { ok: false, reason: 'Kargoda böyle bir parti yok.' };
  if (lot.qty < qty) return { ok: false, reason: 'Yeterli miktar yok.' };
  const chk = canSellHere(G, lot);
  if (!chk.ok) return chk;
  const refund = lot.boughtVisit === run.visit.key && !lot.spoiled;
  let total = 0;
  const v0 = run.visit;
  v0.soldUnits = v0.soldUnits || {};
  for (let i = 0; i < qty; i++) {
    total += lotSellPrice(G, lot);
    if (!refund) v0.soldUnits[lot.good] = (v0.soldUnits[lot.good] || 0) + 1; // aynı malı yığınca fiyat düşer
  }
  const unit = Math.round(total / qty);
  const profit = refund ? 0 : total - lot.cost * qty;
  run.gold += total;
  lot.qty -= qty;
  if (lot.qty <= 0) run.cargo.splice(run.cargo.indexOf(lot), 1);
  if (!refund) {
    const entry = run.visit.market.find((m) => m.good === lot.good);
    if (entry) entry.stock += qty;
    run.stats.goldEarned += total;
  }
  if (profit > 0) {
    run.stats.profit += profit;
    run.stats.bestSale = Math.max(run.stats.bestSale, profit);
  }
  G.meta.codex.goods[lot.good] = true;
  // Dayanıklılık: satış bonusu veren itemler her liman ziyaretinde bir kez yıpranır
  const worn = [];
  if (!refund) {
    const v = run.visit;
    v.wornItems = v.wornItems || [];
    const ids = ['ITEM_MERCHANT_SEAL', ...(GOOD_BY_ID[lot.good].contraband ? ['ITEM_SMUGGLER_HOLD'] : [])];
    for (const id of ids) if (hasItem(G, id) && !v.wornItems.includes(id)) { v.wornItems.push(id); wearItem(G, id, worn); }
  }
  return { ok: true, unit, total, profit, refund, worn };
}

/** Rota sonu bozulma. GDD bozulma riski × mesafe çarpanı; Donna −%40; Kalite Mühürü engeller. */
export function rollSpoilage(G, rng, distance) {
  const run = G.run;
  if (hasItem(G, 'ITEM_QUALITY_SEAL')) { if (run.cargo.some((l) => !l.spoiled && !GOOD_BY_ID[l.good].questItem)) wearItem(G, 'ITEM_QUALITY_SEAL'); return []; }
  const dm = BALANCE.trade.distanceSpoilMult[distance] ?? 1;
  const donna = hasCrew(G, 'CREW_DONNA') ? 1 - 0.4 * crewSkillMult(G) : 1;
  const spoiledReport = [];
  for (const lot of run.cargo.slice()) {
    if (lot.spoiled) continue;
    const good = GOOD_BY_ID[lot.good];
    const chance = good.spoil * dm * donna * (hasPet(G, 'PET_GELINCIK') ? 0.7 : 1);
    if (chance <= 0) continue;
    let n = 0;
    for (let i = 0; i < lot.qty; i++) if (rng.chance(chance)) n++;
    if (n > 0) {
      splitSpoil(run, lot, n);
      spoiledReport.push({ good: lot.good, n });
    }
  }
  return spoiledReport;
}

export function splitSpoil(run, lot, n) {
  n = Math.min(n, lot.qty);
  lot.qty -= n;
  const sp = run.cargo.find((l) => l.good === lot.good && l.spoiled && l.cost === lot.cost);
  if (sp) sp.qty += n;
  else run.cargo.push({ id: run.lotSeq++, good: lot.good, qty: n, cost: lot.cost, spoiled: true, boughtVisit: lot.boughtVisit });
  if (lot.qty <= 0) run.cargo.splice(run.cargo.indexOf(lot), 1);
}

/** Kargodan rastgele birim kaldırır. Kaldırılanları döndürür. */
export function removeRandomUnits(run, rng, n, filter = () => true) {
  const removed = {};
  for (let i = 0; i < n; i++) {
    const lots = run.cargo.filter((l) => l.qty > 0 && filter(l));
    if (!lots.length) break;
    const units = lots.reduce((s, l) => s + l.qty, 0);
    let r = Math.floor(rng.next() * units);
    let lot = lots[0];
    for (const l of lots) {
      if (r < l.qty) { lot = l; break; }
      r -= l.qty;
    }
    lot.qty -= 1;
    removed[lot.good] = (removed[lot.good] || 0) + 1;
    if (lot.qty <= 0) run.cargo.splice(run.cargo.indexOf(lot), 1);
  }
  return removed;
}

/** Sözleşme görev kargosu (1 birim, sözleşme kimliğiyle işaretli) */
export function addContractLot(G, goodId, contractId) {
  const run = G.run;
  run.cargo.push({ id: run.lotSeq++, good: goodId, qty: 1, cost: 0, spoiled: false, boughtVisit: 'contract', contract: contractId });
  G.meta.codex.goods[goodId] = true;
}

export function addCargo(G, goodId, qty, cost = null) {
  const run = G.run;
  const free = cargoFree(G);
  const n = Math.min(free, qty);
  if (n <= 0) return 0;
  const good = GOOD_BY_ID[goodId];
  const unitCost = cost ?? good.buy;
  const ex = run.cargo.find((l) => l.good === goodId && !l.spoiled && l.cost === unitCost && l.boughtVisit === 'event');
  if (ex) ex.qty += n;
  else run.cargo.push({ id: run.lotSeq++, good: goodId, qty: n, cost: unitCost, spoiled: false, boughtVisit: 'event' });
  G.meta.codex.goods[goodId] = true;
  return n;
}

export function cargoUnitsOf(run, goodId) {
  return run.cargo.filter((l) => l.good === goodId).reduce((s, l) => s + l.qty, 0);
}

export function snapshotPrices(G, harborId) {
  const out = {};
  for (const g of TRADE_GOODS) out[g.id] = sellPrice(G, harborId, g.id, { statuses: [] });
  return { harborId, prices: out };
}

export { cargoUsed };
