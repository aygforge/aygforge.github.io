// InventoryEquipment — çanta, depo, kuşanma, istif, sıralama, bekleyen loot.
// Konteyner: { size, slots: Array<null | ItemInstance | Stack> }   Stack: { uid, tid, q }
import { ITEMS, canClassUse, isTwoHanded } from '../data/items.js';
import { STACKABLES, isStackable } from '../data/materials.js';
import { MAX_STACK, PENDING_LOOT_MAX, SLOTS, RARITIES } from '../data/constants.js';
import { makeUid } from '../core/rng.js';

export function makeContainer(size) {
  return { size, slots: new Array(size).fill(null) };
}

export function resizeContainer(c, size) {
  while (c.slots.length < size) c.slots.push(null);
  c.size = size;
}

export function freeSlots(c) {
  let n = 0;
  for (let i = 0; i < c.size; i++) if (!c.slots[i]) n++;
  return n;
}

export function firstFree(c) {
  for (let i = 0; i < c.size; i++) if (!c.slots[i]) return i;
  return -1;
}

export function countStack(c, tid) {
  let n = 0;
  for (const s of c.slots) if (s && s.tid === tid && s.q !== undefined) n += s.q;
  return n;
}

// Bu kadar istif sığar mı?
export function stackCapacity(c, tid) {
  let cap = 0;
  for (let i = 0; i < c.size; i++) {
    const s = c.slots[i];
    if (!s) cap += MAX_STACK;
    else if (s.tid === tid && s.q !== undefined) cap += MAX_STACK - s.q;
  }
  return cap;
}

// İstiflenebilir ekle; sığmayan miktarı döndürür
export function addStack(c, tid, qty) {
  if (!isStackable(tid)) throw new Error(`İstiflenemez: ${tid}`);
  let left = qty;
  for (let i = 0; i < c.size && left > 0; i++) {
    const s = c.slots[i];
    if (s && s.tid === tid && s.q !== undefined && s.q < MAX_STACK) {
      const add = Math.min(left, MAX_STACK - s.q);
      s.q += add; left -= add;
    }
  }
  for (let i = 0; i < c.size && left > 0; i++) {
    if (!c.slots[i]) {
      const add = Math.min(left, MAX_STACK);
      c.slots[i] = { uid: makeUid('s'), tid, q: add };
      left -= add;
    }
  }
  return left;
}

// Hepsi-ya-hiç tüketim
export function removeStack(c, tid, qty) {
  if (countStack(c, tid) < qty) return false;
  let left = qty;
  for (let i = c.size - 1; i >= 0 && left > 0; i--) {
    const s = c.slots[i];
    if (s && s.tid === tid && s.q !== undefined) {
      const take = Math.min(left, s.q);
      s.q -= take; left -= take;
      if (s.q <= 0) c.slots[i] = null;
    }
  }
  return true;
}

export function hasMaterials(char, list) {
  return list.every((m) => countStack(char.bag, m.id) >= m.qty);
}

export function consumeMaterials(char, list) {
  if (!hasMaterials(char, list)) return false;
  for (const m of list) removeStack(char.bag, m.id, m.qty);
  return true;
}

export function findByUid(c, uid) {
  const i = c.slots.findIndex((s) => s && s.uid === uid);
  return i;
}

// Ekipman örneği ekle. Rare+ ve çanta doluysa bekleyen loot'a aktar (silinmez).
export function addItem(char, inst, { allowPending = true } = {}) {
  const i = firstFree(char.bag);
  if (i >= 0) {
    char.bag.slots[i] = inst;
    return { ok: true, where: 'bag', index: i };
  }
  const rarityIdx = RARITIES.indexOf(inst.r);
  if (allowPending && rarityIdx >= 2) {
    if (char.pending.length < PENDING_LOOT_MAX || inst.r !== 'R') {
      char.pending.push(inst);
      return { ok: true, where: 'pending' };
    }
  }
  return { ok: false, where: 'none', msg: 'Çanta dolu' };
}

// Bekleyen loot'u boş slotlara taşı
export function claimPending(char) {
  let moved = 0;
  while (char.pending.length && firstFree(char.bag) >= 0) {
    char.bag.slots[firstFree(char.bag)] = char.pending.shift();
    moved++;
  }
  return moved;
}

export function canEquip(char, inst) {
  const t = ITEMS[inst.tid];
  if (!t) return { ok: false, msg: 'Geçersiz eşya' };
  if (!canClassUse(t, char.cls)) return { ok: false, msg: 'Bu sınıf kullanamaz' };
  if (char.level < t.lv) return { ok: false, msg: `Seviye ${t.lv} gerekli` };
  if (t.slot === 'offhand') {
    const w = char.equipment.weapon;
    if (w && isTwoHanded(ITEMS[w.tid])) return { ok: false, msg: 'İki elli silah kullanırken yardımcı el kuşanılamaz' };
  }
  return { ok: true };
}

// Çantadaki eşyayı kuşan
export function equipFromBag(char, bagIndex) {
  const inst = char.bag.slots[bagIndex];
  if (!inst || inst.q !== undefined) return { ok: false, msg: 'Kuşanılamaz' };
  const chk = canEquip(char, inst);
  if (!chk.ok) return chk;
  const t = ITEMS[inst.tid];
  const prev = char.equipment[t.slot];
  // İki elli silah: yardımcı eli çantaya indir (yer gerekir)
  const offToBag = (t.slot === 'weapon' && isTwoHanded(t) && char.equipment.offhand) ? char.equipment.offhand : null;
  char.bag.slots[bagIndex] = prev || null;
  char.equipment[t.slot] = inst;
  if (offToBag) {
    const fi = firstFree(char.bag);
    if (fi < 0) {
      // geri al (atomik)
      char.equipment[t.slot] = prev || null;
      char.bag.slots[bagIndex] = inst;
      return { ok: false, msg: 'Yardımcı el için çantada yer yok' };
    }
    char.bag.slots[fi] = offToBag;
    char.equipment.offhand = null;
  }
  return { ok: true, slot: t.slot };
}

export function unequip(char, slot) {
  const inst = char.equipment[slot];
  if (!inst) return { ok: false, msg: 'Boş slot' };
  const fi = firstFree(char.bag);
  if (fi < 0) return { ok: false, msg: 'Çanta dolu' };
  char.bag.slots[fi] = inst;
  char.equipment[slot] = null;
  return { ok: true };
}

export function toggleLock(char, uid) {
  const all = [...char.bag.slots, ...Object.values(char.equipment), ...char.pending];
  const it = all.find((s) => s && s.uid === uid);
  if (!it || it.q !== undefined) return { ok: false };
  it.lock = !it.lock;
  return { ok: true, lock: it.lock };
}

const CAT_ORDER = { weapon: 0, offhand: 1, helm: 2, chest: 3, gloves: 4, boots: 5, ring: 6, amulet: 7, potion: 8, material: 9 };
export function sortContainer(c) {
  const items = c.slots.filter(Boolean);
  // önce istifleri birleştir
  const merged = [];
  const stacks = {};
  for (const s of items) {
    if (s.q !== undefined) {
      stacks[s.tid] = (stacks[s.tid] || 0) + s.q;
    } else merged.push(s);
  }
  for (const [tid, q] of Object.entries(stacks)) {
    let left = q;
    while (left > 0) {
      const take = Math.min(MAX_STACK, left);
      merged.push({ uid: makeUid('s'), tid, q: take });
      left -= take;
    }
  }
  const key = (s) => {
    if (s.q !== undefined) {
      const st = STACKABLES[s.tid];
      return [CAT_ORDER[st.cat], 0, 0, st.name];
    }
    const t = ITEMS[s.tid];
    return [CAT_ORDER[t.slot], -RARITIES.indexOf(s.r), -t.lv, t.name];
  };
  merged.sort((a, b) => {
    const ka = key(a), kb = key(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] < kb[i]) return -1;
      if (ka[i] > kb[i]) return 1;
    }
    return 0;
  });
  if (merged.length > c.size) return false;
  c.slots = new Array(c.size).fill(null);
  merged.forEach((s, i) => { c.slots[i] = s; });
  return true;
}

// Konteynerler arası taşıma (çanta ↔ depo)
export function moveBetween(from, index, to) {
  const s = from.slots[index];
  if (!s) return { ok: false };
  if (s.q !== undefined) {
    const cap = stackCapacity(to, s.tid);
    if (cap <= 0) return { ok: false, msg: 'Yer yok' };
    const moving = Math.min(cap, s.q);
    addStack(to, s.tid, moving);
    s.q -= moving;
    if (s.q <= 0) from.slots[index] = null;
    return { ok: true, moved: moving };
  }
  const fi = firstFree(to);
  if (fi < 0) return { ok: false, msg: 'Yer yok' };
  to.slots[fi] = s;
  from.slots[index] = null;
  return { ok: true };
}

export function allItems(char) {
  return [...char.bag.slots.filter(Boolean), ...Object.values(char.equipment).filter(Boolean), ...char.pending];
}

export function equippedList(char) {
  return SLOTS.map((s) => char.equipment[s]).filter(Boolean);
}
