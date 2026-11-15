// Itemler: liman teklifleri, satın alma/değiştirme, tüketim, item ile tamir.
import { BALANCE } from '../config/balance.js';
import { ITEMS, ITEM_BY_ID } from '../data/items.js';
import { HARBOR_BY_ID } from '../data/harbors.js';
import { SeededRNG } from '../core/SeededRNG.js';
import { hasUpgrade } from '../core/GameState.js';
import { whereMatches } from '../utils/helpers.js';
import { itemSlots, changeHull } from './ShipSystem.js';

export const isRare = (id) => ITEM_BY_ID[id].rarity !== 'common';

export function itemPoolFor(G, region, type, isFinal = false) {
  const rareSupplier = hasUpgrade(G.meta, 'UPG_RARE_SUPPLIER');
  return ITEMS.filter((it) => {
    if (isFinal) return true;
    if (whereMatches(it.where, region, type)) return true;
    if (rareSupplier && it.rarity !== 'common') return true;
    return false;
  });
}

function itemWeight(it, region, type, G) {
  let w = it.rarity === 'common' ? 10 : it.rarity === 'uncommon' ? 5 : 3;
  const rc = BALANCE.items.rareChanceByRegion[region] ?? 0.2;
  if (it.rarity === 'rare') w *= 0.5 + rc * 4;
  if (type === 'military' && it.cat === 'defense') w *= 2;
  if (type === 'fog' && it.cat === 'luck') w *= 2;
  if (type === 'mystery' && it.rarity !== 'common') w *= 3;
  if (type === 'trade' && it.cat === 'trade') w *= 1.6;
  if (hasUpgrade(G.meta, 'UPG_RARE_SUPPLIER') && it.rarity !== 'common') w *= 1.5;
  return w;
}

export function generateItemOffers(G, harborIdx, { rareGuaranteed = false } = {}) {
  const harbor = HARBOR_BY_ID[G.run.route[harborIdx].harborId];
  const rng = SeededRNG.derive(G.run.seed, 'items', harborIdx, harbor.id);
  const held = new Set(G.run.items.map((i) => i.id));
  const pool = itemPoolFor(G, harbor.region, harbor.type, harbor.final).filter((it) => !(held.has(it.id) && it.type !== 'consumable'));
  const [mn, mx] = BALANCE.items.offers;
  const n = harbor.type === 'trade' ? mx : rng.int(mn, mx);
  const offers = [];
  const guaranteed = harbor.type === 'pirate' ? 'ITEM_BLACK_FLAG' : harbor.type === 'volcanic' ? 'ITEM_HEAT_SHIELD' : harbor.type === 'ice' ? 'ITEM_ICEBREAKER' : null;
  if (guaranteed && !held.has(guaranteed)) offers.push(guaranteed);
  const rest = pool.filter((it) => !offers.includes(it.id));
  if (rareGuaranteed) {
    const rares = rest.filter((it) => it.rarity === 'rare');
    const allRares = rares.length ? rares : ITEMS.filter((it) => it.rarity === 'rare' && !held.has(it.id) && !offers.includes(it.id));
    if (allRares.length) {
      const r = rng.pick(allRares);
      offers.push(r.id);
      const ix = rest.findIndex((x) => x.id === r.id);
      if (ix >= 0) rest.splice(ix, 1);
    }
  }
  while (offers.length < n && rest.length) {
    const it = rng.weighted(rest, (x) => itemWeight(x, harbor.region, harbor.type, G));
    offers.push(it.id);
    rest.splice(rest.indexOf(it), 1);
  }
  return offers;
}

export function swapFee(G) {
  return Math.round(BALANCE.items.swapFee * (hasUpgrade(G.meta, 'UPG_CHEAP_SWAP') ? 0.5 : 1));
}

export function itemPrice(G, id) {
  const visit = G.run.visit;
  if (visit && visit.starterPicks > 0) return 0;
  let p = ITEM_BY_ID[id].price;
  const st = visit?.statuses || [];
  if (st.includes('contraband')) p *= BALANCE.trade.contrabandStatusMult;
  if (st.includes('hero')) p *= BALANCE.trade.heroBuyMult;
  return Math.round(p);
}

export function addItem(G, id, replaceUid = null) {
  const run = G.run;
  if (run.items.length >= itemSlots(G)) {
    const ix = run.items.findIndex((i) => i.uid === replaceUid);
    if (ix < 0) return { ok: false, needsSlot: true, reason: 'Item slotların dolu.' };
    run.items.splice(ix, 1);
  }
  run.itemSeq = (run.itemSeq || 1) + 1;
  const it = { id, uid: `${id}#${run.itemSeq}` };
  if (ITEM_BY_ID[id].uses) it.uses = ITEM_BY_ID[id].uses;
  run.items.push(it);
  return { ok: true };
}

export function buyItem(G, id, replaceUid = null) {
  const run = G.run;
  const visit = run.visit;
  if (!visit || !visit.items.includes(id)) return { ok: false, reason: 'Bu item bu limanda yok.' };
  if (visit.itemsBought.includes(id)) return { ok: false, reason: 'Bu teklif zaten alındı.' };
  const starter = visit.starterPicks > 0;
  const price = itemPrice(G, id);
  const full = run.items.length >= itemSlots(G);
  const fee = full && !starter ? swapFee(G) : 0;
  if (full && !replaceUid) return { ok: false, needsSlot: true, reason: 'Item slotların dolu; değiştirmek için bir item seç.' };
  if (run.gold < price + fee) return { ok: false, reason: `Yetersiz altın (${price + fee} gerekli).` };
  const res = addItem(G, id, replaceUid);
  if (!res.ok) return res;
  run.gold -= price + fee;
  visit.itemsBought.push(id);
  if (starter) visit.starterPicks--;
  return { ok: true, price, fee };
}

export function discardItem(G, uid) {
  const ix = G.run.items.findIndex((i) => i.uid === uid);
  if (ix < 0) return false;
  G.run.items.splice(ix, 1);
  return true;
}

export function consumeItem(G, id) {
  const ix = G.run.items.findIndex((i) => i.id === id);
  if (ix < 0) return false;
  G.run.items.splice(ix, 1);
  return true;
}

/** Onarım Takımı'nı event dışında kullanma (item ile tamir). */
export function useRepairKit(G, uid) {
  const it = G.run.items.find((i) => i.uid === uid);
  if (!it || it.id !== 'ITEM_REPAIR_KIT') return { ok: false, reason: 'Bu item kullanılamaz.' };
  const r = changeHull(G, BALANCE.repair.repairKitHp);
  if (r.delta <= 0) return { ok: false, reason: 'Gemi zaten tam sağlam.' };
  discardItem(G, uid);
  return { ok: true, healed: r.delta };
}

export function randomItemFor(G, rng, kind, region, opts = {}) {
  const held = new Set(G.run.items.map((i) => i.id));
  let pool;
  if (kind === 'rare') pool = ITEMS.filter((it) => it.rarity !== 'common');
  else pool = ITEMS.filter((it) => whereMatches(it.where, region, null) || it.where.some((w) => !w.regions));
  if (kind !== 'rare' && opts.rareBoost && rng.chance(opts.rareBoost)) pool = ITEMS.filter((it) => it.rarity !== 'common');
  const fresh = pool.filter((it) => !held.has(it.id) || it.type === 'consumable');
  const src = fresh.length ? fresh : pool;
  return rng.weighted(src, (it) => (it.rarity === 'rare' ? 3 : it.rarity === 'uncommon' ? 5 : 8)).id;
}

// ───────── Dayanıklılık ─────────
/** Kalan kullanım hakkı (eski kayıtlarda alan yoksa tam kabul edilir); sınırsızsa null */
export function usesLeft(inst) {
  const max = ITEM_BY_ID[inst.id]?.uses;
  if (!max) return null;
  return inst.uses ?? max;
}
/** Item etkisini gösterdi: 1 hak düş; bitince kır. lines verilirse bilgi satırı eklenir. Aynı tx içinde bir item bir kez yıpranır. */
export function wearItem(G, id, lines = null, worn = null) {
  if (worn) { if (worn.has(id)) return false; worn.add(id); }
  const run = G.run;
  const inst = run.items.find((i) => i.id === id);
  if (!inst) return false;
  const max = ITEM_BY_ID[id].uses;
  if (!max) return false;
  inst.uses = (inst.uses ?? max) - 1;
  if (inst.uses <= 0) {
    run.items.splice(run.items.indexOf(inst), 1);
    lines?.push({ kind: 'item', text: `${ITEM_BY_ID[id].name} yıprandı ve kırıldı.` });
    run.stats.itemsBroken = (run.stats.itemsBroken || 0) + 1;
  } else lines?.push({ kind: 'info', text: `${ITEM_BY_ID[id].name}: ${inst.uses} kullanım hakkı kaldı.` });
  return true;
}
