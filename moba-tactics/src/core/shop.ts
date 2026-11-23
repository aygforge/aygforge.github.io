import { BALANCE } from './config';
import { COMPONENTS, CompCode, ITEM_BY_ID, combineFee } from '../data/items';
import type { Unit } from './unit';
import type { World } from './world';
import { FOUNTAIN_POS } from './map';
import { dist } from './math';

export const MAX_SLOTS = 4;

export function inBase(u: Unit): boolean {
  if (u.team > 1) return false;
  const f = FOUNTAIN_POS[u.team as 0 | 1];
  return dist(u.x, u.y, f.x, f.y) <= BALANCE.fountainRadius;
}

export function ownedItemIds(u: Unit): number[] {
  return u.champ!.inventory.filter((s) => s.kind === 'item').map((s) => s.itemId!);
}

/** The next build item that is not yet owned (completed). */
export function nextBuildItem(u: Unit): number | null {
  const owned = ownedItemIds(u);
  for (const id of u.champ!.build) if (!owned.includes(id)) return id;
  return null;
}

/** Gold still needed to finish the next build item from the current inventory. */
export function costToNext(u: Unit): number {
  const id = nextBuildItem(u);
  if (id == null) return Infinity;
  const it = ITEM_BY_ID[id];
  const inv = u.champ!.inventory;
  const used = new Set<number>();
  let cost = combineFee(it);
  for (const code of it.recipe) {
    const idx = inv.findIndex((s, i) => !used.has(i) && s.kind === 'comp' && s.code === code);
    if (idx >= 0) used.add(idx);
    else cost += COMPONENTS[code].price;
  }
  return cost;
}

/**
 * Buys towards the next item in the build. Returns true if something was bought.
 * Implements the 4-slot rule with the atomic "second component + combine" purchase.
 */
export function buyStep(w: World, u: Unit): boolean {
  const c = u.champ!;
  const id = nextBuildItem(u);
  if (id == null) return false;
  const it = ITEM_BY_ID[id];
  const inv = c.inventory;
  const fee = combineFee(it);
  // locate owned components for the recipe (distinct slots)
  const have: number[] = [];
  const missing: CompCode[] = [];
  for (const code of it.recipe) {
    const idx = inv.findIndex((s, i) => !have.includes(i) && s.kind === 'comp' && s.code === code);
    if (idx >= 0) have.push(idx);
    else missing.push(code);
  }
  const freeSlots = MAX_SLOTS - inv.length;
  const missingCost = missing.reduce((a, code) => a + COMPONENTS[code].price, 0);
  // Full atomic purchase when everything is affordable: needs at least one slot after consuming components
  const slotsAfter = inv.length - have.length + 1;
  if (c.gold >= missingCost + fee && slotsAfter <= MAX_SLOTS) {
    const spent = have.reduce((a, i) => a + inv[i].spent, 0) + missingCost + fee;
    c.gold -= missingCost + fee;
    c.inventory = inv.filter((_, i) => !have.includes(i));
    c.inventory.push({ kind: 'item', itemId: id, spent });
    w.emit({ t: 'buy', id: u.id, v: id, k: 'item' });
    return true;
  }
  // Otherwise buy one missing component if there is a free slot and it is affordable.
  if (missing.length > 0 && freeSlots > 0) {
    // do not fill the last free slot with the first of two missing comps unless atomic completion will be possible later
    const code = missing[0];
    const price = COMPONENTS[code].price;
    if (c.gold >= price) {
      c.gold -= price;
      c.inventory.push({ kind: 'comp', code, spent: price });
      w.emit({ t: 'buy', id: u.id, v: 0, k: code });
      return true;
    }
  }
  return false;
}

export function autoBuy(w: World, u: Unit) {
  let guard = 0;
  while (guard++ < 8 && buyStep(w, u)) {
    /* keep buying */
  }
}

export function sellSlot(w: World, u: Unit, index: number): { ok: boolean; reason?: string; refund?: number } {
  const c = u.champ!;
  if (!inBase(u) || !u.alive) return { ok: false, reason: 'Satış yalnızca üste yapılabilir.' };
  const s = c.inventory[index];
  if (!s) return { ok: false, reason: 'Geçersiz yuva.' };
  const refund = Math.floor(s.spent * BALANCE.sellRatio);
  c.gold += refund;
  c.inventory.splice(index, 1);
  w.emit({ t: 'sell', id: u.id, v: refund });
  return { ok: true, refund };
}
