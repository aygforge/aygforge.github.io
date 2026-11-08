// Unique item instances, stacking, slots, filters, storage transfer, equipment & water vessels.
import { TxError } from '../core/StateStore.js';

export const PLAYER_INV = 'inv_player';
const FILTERS = {
  food: (it) => ['food', 'foraged_food', 'crop'].includes(it.category) || it.id === 'MAT_RAW_FISH' || it.id === 'MAT_RAW_MEAT' || it.id === 'MAT_CRAB_MEAT',
  logs: (it) => it.id === 'MAT_LOG' || it.id === 'MAT_HARDWOOD',
  ore: (it) => it.category === 'mineral',
  material: (it) => ['plant_material', 'mineral', 'animal_material', 'marine_material', 'salvage', 'processed_material'].includes(it.category),
  equipment: (it) => it.category === 'tool' || it.category === 'equipment',
};
export const WATER_VESSELS = { TOOL_BAMBOO_CUP: 2, SAL_BOTTLE: 2, SAL_TIN_CAN: 1 };

export class InventorySystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }

  // ---------- containers ----------
  createContainer(tx, id, capacity, { filter = null, ownerEntityId = null, unitCap = null } = {}) {
    const cont = { id, capacity, filter, ownerEntityId, unitCap, slots: new Array(capacity).fill(null) };
    if (tx) tx.set(this.s.containers.byId, id, cont); else this.s.containers.byId[id] = cont;
    return cont;
  }
  cont(id) { const c = this.s.containers.byId[id]; if (!c) throw new TxError('NO_CONTAINER', id); return c; }
  item(uid) { return this.s.containers.items[uid]; }

  accepts(cont, itemId) {
    if (!cont.filter) return true;
    const it = this.c.items.get(itemId);
    const f = FILTERS[cont.filter];
    return f ? f(it) : true;
  }

  stackLimit(cont, itemId) { return this.c.stackMax(itemId); }

  // ---------- instances ----------
  newInstance(tx, itemId, quantity, meta = {}) {
    const it = this.c.item(itemId);
    const uid = this.g.store.nextUid('it');
    const dmax = this.durabilityMax(itemId);
    const inst = {
      uid, itemId, quantity,
      durability: dmax > 0 ? Math.round(dmax * (meta.durabilityMul || 1)) : null,
      maxDurability: dmax > 0 ? Math.round(dmax * (meta.durabilityMul || 1)) : null,
      perishAtGameSeconds: it.perishGameDays ? Math.round(this.s.clock.gameElapsedSeconds + it.perishGameDays * 1080 + (meta.shelfBonusDays || 0) * 1080) : null,
      metadata: meta.metadata || {},
    };
    tx.set(this.s.containers.items, uid, inst);
    return inst;
  }
  durabilityMax(itemId) {
    const d = this.c.durability.get(itemId);
    if (d) return d.durabilityMax;
    const it = this.c.items.get(itemId);
    return it?.durabilityMax || 0;
  }

  canMerge(a, itemId, cont) {
    if (!a || a.itemId !== itemId) return false;
    if (a.durability != null) return false; // tools never stack
    return a.quantity < this.stackLimit(cont, itemId);
  }

  unitCount(cont) { let n = 0; for (const u of cont.slots) if (u) n += this.item(u).quantity; return n; }

  /** How many of itemId can be added to container. */
  spaceFor(containerId, itemId) {
    const cont = this.cont(containerId);
    if (!this.accepts(cont, itemId)) return 0;
    const lim = this.stackLimit(cont, itemId);
    const isTool = this.durabilityMax(itemId) > 0;
    let n = 0;
    for (const u of cont.slots) {
      if (!u) n += isTool ? 1 : lim;
      else { const a = this.item(u); if (!isTool && a.itemId === itemId && a.durability == null) n += lim - a.quantity; }
    }
    if (cont.unitCap != null) n = Math.min(n, cont.unitCap - this.unitCount(cont));
    if (containerId === PLAYER_INV && itemId.startsWith('WATER_')) n = Math.min(n, this.waterCapacity() - this.waterCarried());
    return Math.max(0, n);
  }

  waterCapacity() {
    let cap = 0;
    for (const u of this.cont(PLAYER_INV).slots) if (u) { const a = this.item(u); if (WATER_VESSELS[a.itemId]) cap += WATER_VESSELS[a.itemId] * a.quantity; }
    return cap;
  }
  waterCarried() { return this.count([PLAYER_INV], 'WATER_CLEAN') + this.count([PLAYER_INV], 'WATER_DIRTY'); }

  /** Add quantity; returns leftover that did not fit (0 = all added). Uses tx for atomicity. */
  add(tx, containerId, itemId, qty, meta = {}) {
    const cont = this.cont(containerId);
    let left = Math.min(qty, this.spaceFor(containerId, itemId));
    const overflow = qty - left;
    const isTool = this.durabilityMax(itemId) > 0;
    const lim = this.stackLimit(cont, itemId);
    if (!isTool) {
      for (let i = 0; i < cont.slots.length && left > 0; i++) {
        const u = cont.slots[i]; if (!u) continue;
        const a = this.item(u);
        if (this.canMerge(a, itemId, cont)) {
          const put = Math.min(left, lim - a.quantity);
          tx.set(a, 'quantity', a.quantity + put);
          if (a.perishAtGameSeconds != null && meta.perishAt != null) tx.set(a, 'perishAtGameSeconds', Math.min(a.perishAtGameSeconds, meta.perishAt));
          left -= put;
        }
      }
    }
    for (let i = 0; i < cont.slots.length && left > 0; i++) {
      if (cont.slots[i]) continue;
      const put = isTool ? 1 : Math.min(left, lim);
      const inst = this.newInstance(tx, itemId, put, meta);
      if (meta.perishAt != null) inst.perishAtGameSeconds = meta.perishAt;
      if (meta.durability != null && inst.durability != null) inst.durability = meta.durability;
      tx.set(cont.slots, i, inst.uid);
      left -= put;
    }
    if (left > 0) throw new TxError('INVENTORY_INVARIANT', 'space computation mismatch');
    if (qty - overflow > 0) {
      this.g.knowledge?.learnMaterial(tx, itemId);
      tx.emit('inventory.changed', { containerId, itemId, delta: qty - overflow });
    }
    return overflow;
  }

  /** Add all or fail (no partial). */
  addAll(tx, containerId, itemId, qty, meta) {
    if (this.spaceFor(containerId, itemId) < qty) tx.fail('INVENTORY_FULL', `${itemId} x${qty}`);
    return this.add(tx, containerId, itemId, qty, meta);
  }

  /** Place an existing instance (e.g. moving a tool) into first free slot. */
  placeInstance(tx, containerId, uid) {
    const cont = this.cont(containerId); const a = this.item(uid);
    if (!this.accepts(cont, a.itemId)) tx.fail('FILTER_REJECTS', a.itemId);
    if (a.durability == null) {
      // try merge
      const lim = this.stackLimit(cont, a.itemId);
      for (let i = 0; i < cont.slots.length; i++) {
        const u = cont.slots[i]; if (!u || u === uid) continue; const b = this.item(u);
        if (this.canMerge(b, a.itemId, cont)) {
          const put = Math.min(a.quantity, lim - b.quantity);
          tx.set(b, 'quantity', b.quantity + put); tx.set(a, 'quantity', a.quantity - put);
          if (a.quantity === 0) { tx.del(this.s.containers.items, uid); return true; }
        }
      }
    }
    const i = cont.slots.indexOf(null);
    if (i < 0) tx.fail('INVENTORY_FULL', a.itemId);
    tx.set(cont.slots, i, uid);
    return true;
  }

  count(containerIds, itemId, { usableOnly = false } = {}) {
    let n = 0;
    for (const cid of containerIds) {
      const cont = this.s.containers.byId[cid]; if (!cont) continue;
      for (const u of cont.slots) if (u) { const a = this.item(u); if (a.itemId === itemId && (!usableOnly || a.durability == null || a.durability > 0)) n += a.quantity; }
    }
    return n;
  }

  /** Remove qty of itemId across containers (in order). Fails atomically if insufficient. Returns removed instance snapshots. */
  remove(tx, containerIds, itemId, qty) {
    if (this.count(containerIds, itemId) < qty) tx.fail('MISSING_ITEMS', `${itemId} x${qty}`, { itemId, qty });
    let left = qty; const removed = [];
    for (const cid of containerIds) {
      const cont = this.s.containers.byId[cid]; if (!cont) continue;
      // consume oldest-perishing first
      const idxs = cont.slots.map((u, i) => [u, i]).filter(([u]) => u && this.item(u).itemId === itemId)
        .sort((a, b) => (this.item(a[0]).perishAtGameSeconds ?? 1e15) - (this.item(b[0]).perishAtGameSeconds ?? 1e15));
      for (const [u, i] of idxs) {
        if (left <= 0) break;
        const a = this.item(u); const take = Math.min(left, a.quantity);
        removed.push({ itemId, quantity: take, durability: a.durability, perishAt: a.perishAtGameSeconds });
        if (take === a.quantity) { tx.set(cont.slots, i, null); tx.del(this.s.containers.items, u); this.unequipIfNeeded(tx, u); }
        else tx.set(a, 'quantity', a.quantity - take);
        left -= take;
      }
      if (left <= 0) break;
    }
    tx.emit('inventory.changed', { itemId, delta: -qty });
    return removed;
  }

  removeInstance(tx, uid) {
    for (const cont of Object.values(this.s.containers.byId)) {
      const i = cont.slots.indexOf(uid);
      if (i >= 0) { tx.set(cont.slots, i, null); this.unequipIfNeeded(tx, uid); return cont.id; }
    }
    return null;
  }

  locate(uid) {
    for (const cont of Object.values(this.s.containers.byId)) { const i = cont.slots.indexOf(uid); if (i >= 0) return [cont.id, i]; }
    return null;
  }

  /** Move (split/merge) from container slot to another container (optionally specific slot). */
  moveSlot(tx, fromId, fromSlot, toId, qty = null, toSlot = null) {
    const from = this.cont(fromId), to = this.cont(toId);
    const uid = from.slots[fromSlot]; if (!uid) tx.fail('EMPTY_SLOT');
    const a = this.item(uid);
    const it = this.c.items.get(a.itemId);
    if (it.category === 'special' && toId !== PLAYER_INV && !to.allowSpecial) tx.fail('NON_DROPPABLE', a.itemId);
    if (!this.accepts(to, a.itemId)) tx.fail('FILTER_REJECTS', a.itemId);
    const amount = qty == null ? a.quantity : Math.min(qty, a.quantity);
    if (amount <= 0) tx.fail('BAD_QTY');
    if (fromId === toId && toSlot != null) {
      const other = from.slots[toSlot];
      tx.set(from.slots, toSlot, uid); tx.set(from.slots, fromSlot, other || null);
      return;
    }
    if (toId === PLAYER_INV && a.itemId.startsWith('WATER_') && fromId !== PLAYER_INV && this.spaceFor(toId, a.itemId) < amount) tx.fail('NO_WATER_VESSEL');
    if (amount === a.quantity && (a.durability != null || toSlot != null)) {
      tx.set(from.slots, fromSlot, null); this.unequipIfNeeded(tx, uid);
      if (toSlot != null && !to.slots[toSlot]) { tx.set(to.slots, toSlot, uid); }
      else this.placeInstance(tx, toId, uid);
    } else {
      if (this.spaceFor(toId, a.itemId) < amount) tx.fail('INVENTORY_FULL', a.itemId);
      if (amount === a.quantity) { tx.set(from.slots, fromSlot, null); tx.del(this.s.containers.items, uid); this.unequipIfNeeded(tx, uid); }
      else tx.set(a, 'quantity', a.quantity - amount);
      this.add(tx, toId, a.itemId, amount, { perishAt: a.perishAtGameSeconds, durability: a.durability });
    }
    tx.emit('inventory.changed', { from: fromId, to: toId, itemId: a.itemId });
  }

  splitStack(tx, contId, slot) {
    const cont = this.cont(contId); const uid = cont.slots[slot]; if (!uid) tx.fail('EMPTY_SLOT');
    const a = this.item(uid); if (a.quantity < 2) tx.fail('CANNOT_SPLIT');
    const free = cont.slots.indexOf(null); if (free < 0) tx.fail('INVENTORY_FULL');
    const half = Math.floor(a.quantity / 2);
    tx.set(a, 'quantity', a.quantity - half);
    const inst = this.newInstance(tx, a.itemId, half);
    inst.perishAtGameSeconds = a.perishAtGameSeconds;
    tx.set(cont.slots, free, inst.uid);
  }

  // ---------- equipment ----------
  equip(tx, uid) {
    const a = this.item(uid); if (!a) tx.fail('NO_ITEM');
    const loc = this.locate(uid); if (!loc || loc[0] !== PLAYER_INV) tx.fail('NOT_IN_BACKPACK');
    const it = this.c.items.get(a.itemId);
    const slot = it.equipmentSlot; if (!slot) tx.fail('NOT_EQUIPPABLE');
    const eq = this.s.player.equipment;
    if (slot === 'backpack') {
      const cap = it.inventoryCapacity || 24;
      this.resizePlayerInventory(tx, cap);
    }
    tx.set(eq, slot, uid);
    tx.emit('equipment.changed', { slot, itemId: a.itemId });
  }
  unequip(tx, slot) {
    const eq = this.s.player.equipment; if (!eq[slot]) return;
    if (slot === 'backpack') this.resizePlayerInventory(tx, this.g.content.db.DesignConstants.startingBackpackSlots);
    tx.set(eq, slot, null);
    tx.emit('equipment.changed', { slot, itemId: null });
  }
  unequipIfNeeded(tx, uid) {
    const eq = this.s.player.equipment;
    for (const k of Object.keys(eq)) if (eq[k] === uid) {
      if (k === 'backpack') { tx.set(eq, k, null); this.resizePlayerInventory(tx, 24, true); } else tx.set(eq, k, null);
    }
  }
  resizePlayerInventory(tx, cap, force = false) {
    const cont = this.cont(PLAYER_INV);
    if (cap === cont.slots.length) return;
    if (cap > cont.slots.length) {
      const ns = cont.slots.concat(new Array(cap - cont.slots.length).fill(null));
      tx.set(cont, 'slots', ns); tx.set(cont, 'capacity', cap);
    } else {
      const used = cont.slots.filter(Boolean);
      if (used.length > cap && !force) tx.fail('BAG_TOO_FULL', 'Çantayı çıkarmadan önce eşyaları boşalt');
      const ns = used.slice(0, cap); while (ns.length < cap) ns.push(null);
      tx.set(cont, 'slots', ns); tx.set(cont, 'capacity', cap);
    }
  }
  equipped(slot) { const u = this.s.player.equipment[slot]; return u ? this.item(u) : null; }

  /** Best usable tool for a gather class (axe/pick) from backpack (equipped preferred). */
  bestTool(kind) {
    const mh = this.equipped('main_hand');
    const fits = (a) => {
      if (!a || (a.durability != null && a.durability <= 0)) return false;
      const it = this.c.items.get(a.itemId);
      if (kind === 'axe') return /AXE$/.test(a.itemId);
      if (kind === 'pick') return /PICK$/.test(a.itemId);
      if (kind === 'rod') return a.itemId.startsWith('TOOL_FISH_ROD');
      if (kind === 'spear') return /SPEAR$/.test(a.itemId);
      if (kind === 'bow') return /BOW$/.test(a.itemId) && it;
      return a.itemId === kind;
    };
    if (fits(mh)) return mh;
    let best = null;
    for (const u of this.cont(PLAYER_INV).slots) if (u) {
      const a = this.item(u);
      if (fits(a)) { const t = this.c.items.get(a.itemId).gatherTier || 0; if (!best || t > (this.c.items.get(best.itemId).gatherTier || 0)) best = a; }
    }
    return best;
  }
  hasItem(itemId, qty = 1) { return this.count([PLAYER_INV], itemId) >= qty; }
  hasAny(ids) { return ids.some((id) => this.hasItem(id)); }

  wear(tx, inst, amount = 1) {
    if (!inst || inst.durability == null) return;
    tx.set(inst, 'durability', Math.max(0, inst.durability - amount));
    if (inst.durability === 0) tx.emit('tool.broken', { itemId: inst.itemId, uid: inst.uid });
  }

  // ---------- spoilage ----------
  tickSpoilage(nowSec) {
    const s = this.s;
    for (const cont of Object.values(s.containers.byId)) {
      const slow = cont.filter === 'food' && cont.pantry;
      for (let i = 0; i < cont.slots.length; i++) {
        const u = cont.slots[i]; if (!u) continue; const a = this.item(u);
        if (a.perishAtGameSeconds == null) continue;
        if (slow && !a.metadata.pantryAdjusted) { a.perishAtGameSeconds = nowSec + (a.perishAtGameSeconds - nowSec) * 2; a.metadata.pantryAdjusted = true; }
        if (nowSec >= a.perishAtGameSeconds) {
          // spoiled food becomes organic waste (compost input) — no item vanishes silently
          const q = a.quantity;
          delete s.containers.items[u]; cont.slots[i] = null;
          this.g.store.transaction(null, (tx) => { this.add(tx, cont.id, 'MAT_ORGANIC_WASTE', q); });
          this.g.bus.emit('item.spoiled', { itemId: a.itemId, quantity: q, containerId: cont.id });
        }
      }
    }
  }

  /** Invariant check used by tests and save validation. */
  validate() {
    const s = this.s; const errs = []; const seen = new Map();
    for (const cont of Object.values(s.containers.byId)) {
      cont.slots.forEach((u) => {
        if (!u) return;
        if (seen.has(u)) errs.push(`uid ${u} in ${seen.get(u)} and ${cont.id}`);
        seen.set(u, cont.id);
        const a = s.containers.items[u];
        if (!a) errs.push(`dangling uid ${u}`);
        else {
          if (!(a.quantity > 0)) errs.push(`non-positive qty ${u}`);
          if (!this.c.items.has(a.itemId)) errs.push(`unknown item ${a.itemId}`);
          if (a.quantity > this.c.stackMax(a.itemId)) errs.push(`over stack ${u}`);
        }
      });
    }
    for (const u of Object.keys(s.containers.items)) if (!seen.has(u) && !this.isEscrowed(u)) errs.push(`orphan uid ${u}`);
    return errs;
  }
  isEscrowed() { return false; }
}
