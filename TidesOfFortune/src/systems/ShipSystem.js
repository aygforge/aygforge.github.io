// Gemi: hull, kategoriler, slotlar, kargo kapasitesi, yükseltme.
import { BALANCE } from '../config/balance.js';
import { SHIP_BY_LEVEL, MAX_ITEM_SLOTS } from '../data/ships.js';
import { hasUpgrade } from '../core/GameState.js';

export const HULL_CATEGORY_NAMES = {
  healthy: 'Sağlam',
  damaged: 'Hasarlı',
  critical: 'Kritik',
  sinking: 'Batmak Üzere',
  sunk: 'Batık',
};

export function shipDef(run) {
  return SHIP_BY_LEVEL[run.ship.level];
}

export function maxHull(G) {
  return shipDef(G.run).hull + (G.run.ship.hullBonus || 0);
}

export function hullPct(G) {
  return Math.max(0, Math.min(100, (G.run.ship.hull / maxHull(G)) * 100));
}

/** GDD: kategoriler maksimum hull'un yüzdesiyle okunur (%76–100, %51–75, %26–50, %1–25, 0). */
export function hullCategoryFor(hull, max) {
  if (hull <= 0) return 'sunk';
  const pct = (hull / max) * 100 + 1e-9;
  for (const c of BALANCE.hull.categories) if (pct >= c.min) return c.id;
  return 'sinking';
}

export function hullCategory(G) {
  return hullCategoryFor(G.run.ship.hull, maxHull(G));
}

/** Kategori alt sınırının HP karşılığı (kısmi tamir hedefi) */
export function categoryFloorHp(G, cat) {
  const c = BALANCE.hull.categories.find((x) => x.id === cat);
  return Math.ceil((c.min / 100) * maxHull(G));
}

export function escapePenalty(G) {
  return BALANCE.hull.escapePenalty[hullCategory(G)] || 0;
}

export function cargoCapacity(G) {
  const base = shipDef(G.run).cargo + (hasUpgrade(G.meta, 'UPG_EXTRA_HOLD') ? 1 : 0);
  const pen = BALANCE.hull.cargoPenalty[hullCategory(G)] || 0;
  return Math.max(1, base - pen);
}

export function cargoUsed(run) {
  return run.cargo.reduce((s, l) => s + l.qty, 0);
}

export function cargoFree(G) {
  return Math.max(0, cargoCapacity(G) - cargoUsed(G.run));
}

export function itemSlots(G) {
  let n = shipDef(G.run).items;
  if (hasUpgrade(G.meta, 'UPG_ARMORY_1')) n++;
  if (hasUpgrade(G.meta, 'UPG_ARMORY_2')) n++;
  return Math.min(MAX_ITEM_SLOTS, n);
}

export function crewSlots(G) {
  return shipDef(G.run).crew;
}

/** Hull'u değiştirir; batma durumunu döndürür. */
export function changeHull(G, delta) {
  const before = G.run.ship.hull;
  const max = maxHull(G);
  G.run.ship.hull = Math.max(0, Math.min(max, Math.round(before + delta)));
  return { before, after: G.run.ship.hull, delta: G.run.ship.hull - before, sunk: G.run.ship.hull <= 0 };
}

export function upgradeCost(G) {
  const next = G.run.ship.level + 1;
  const c = BALANCE.shipUpgradeCost[next];
  if (c == null) return null;
  return G.run.x1?.endless?.on ? Math.round(c * 1.5) : c; // DENGE: Sonsuz Deniz'de tersane fiyatları (X1 ENDLESS_ECON)
}

export function canUpgrade(G) {
  const cost = upgradeCost(G);
  if (cost == null) return { ok: false, reason: 'Gemin zaten en büyük seviyede.' };
  if (G.run.gold < cost) return { ok: false, reason: `Yetersiz altın (${cost} gerekli).` };
  return { ok: true, cost };
}

export function upgradeShip(G) {
  const chk = canUpgrade(G);
  if (!chk.ok) return chk;
  const oldMax = maxHull(G);
  G.run.gold -= chk.cost;
  G.run.ship.level += 1;
  const newMax = maxHull(G);
  // Hasar korunur: eksik HP aynı kalır, yeni kapasite eklenir.
  G.run.ship.hull = Math.min(newMax, G.run.ship.hull + (newMax - oldMax));
  G.run.stats.upgradesBought++;
  return { ok: true, cost: chk.cost, level: G.run.ship.level };
}
