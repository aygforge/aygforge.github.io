// EconomyService — NPC alım/satım, parçalama, tamir, çanta/depo genişletme, iksir, crafting ve yükseltme.
// Her işlem önce bütün koşulları kontrol eder, sonra tek seferde uygular (yarım işlem yok).
import { ITEMS, ITEM_LIST, MERCHANT_PRICE, isUpgradeable } from '../data/items.js';
import { STACKABLES, POTIONS, POTION_LIST } from '../data/materials.js';
import { RECIPE_MAP, UPGRADE_STEPS, UPGRADE_NU_FINAL, UPGRADE_SLOT_MULT, LOW_LEVEL_UPGRADE_MULT, V2_UPGRADE_MIN_LEVEL, V2_UPGRADE_GOLD_MULT, UPGRADE_STEPS_V2_MATS, UPGRADE_NU_FINAL_V2,
  V3_UPGRADE_MIN_LEVEL, V3_UPGRADE_GOLD_MULT, UPGRADE_STEPS_V3_MATS, UPGRADE_NU_FINAL_V3,
  V4_UPGRADE_MIN_LEVEL, V4_UPGRADE_GOLD_MULT, UPGRADE_STEPS_V4_MATS, UPGRADE_NU_FINAL_V4 } from '../data/recipes.js';
import { RARITY_INFO, BAG_STEPS, STORAGE_MAX, DEATH_DURABILITY_LOSS, SLOTS } from '../data/constants.js';
import {
  addStack, removeStack, countStack, stackCapacity, firstFree, freeSlots, resizeContainer, hasMaterials, consumeMaterials, addItem,
} from './inventory.js';
import { createItem } from './loot.js';

// ------------------------------------------------------------------ Fiyatlar
export const SELL_RANGES = { N: [5, 30], U: [15, 70], R: [80, 250], E: [250, 600] };

export function itemSellPrice(inst) {
  if (inst.q !== undefined) return (STACKABLES[inst.tid]?.sell || 0) * inst.q;
  const t = ITEMS[inst.tid];
  if (inst.r === 'L') return 0;
  const [lo, hi] = SELL_RANGES[inst.r];
  return Math.round(lo + (hi - lo) * (t.lv - 1) / 19);
}

export function merchantStock() {
  return ITEM_LIST.filter((t) => t.sources.includes('merchant')).map((t) => ({ tid: t.id, price: MERCHANT_PRICE[t.slot] }));
}

export const BOTTLE_PRICE = 5;
export const BAG_EXPAND_COST = { 42: 1500, 48: 4000 };
export const STORAGE_EXPAND_COST = 2500;

// ------------------------------------------------------------------ Alış / satış
export function buyEquipment(char, tid) {
  const offer = merchantStock().find((o) => o.tid === tid);
  if (!offer) return { ok: false, msg: 'Satılık değil' };
  if (char.gold < offer.price) return { ok: false, msg: 'Yetersiz Gold' };
  if (firstFree(char.bag) < 0) return { ok: false, msg: 'Çanta dolu' };
  const inst = createItem(tid, ITEMS[tid].rarity, null, { noBonus: true, src: 'merchant' });
  char.gold -= offer.price;
  addItem(char, inst, { allowPending: false });
  return { ok: true, inst, price: offer.price };
}

export function buyStack(char, tid, qty, price) {
  qty = Math.max(1, qty | 0);
  const cost = price * qty;
  if (char.gold < cost) return { ok: false, msg: 'Yetersiz Gold' };
  if (stackCapacity(char.bag, tid) < qty) return { ok: false, msg: 'Çanta dolu' };
  char.gold -= cost;
  addStack(char.bag, tid, qty);
  return { ok: true, cost };
}

export function buyPotion(char, tid, qty = 1) {
  const p = POTIONS[tid];
  if (!p) return { ok: false, msg: 'Geçersiz iksir' };
  return buyStack(char, tid, qty, p.buy);
}

export function buyBottle(char, qty = 1) {
  return buyStack(char, 'empty_bottle', qty, BOTTLE_PRICE);
}

export function sellFromBag(char, index, qty = null) {
  const s = char.bag.slots[index];
  if (!s) return { ok: false, msg: 'Boş' };
  if (s.q !== undefined) {
    if (STACKABLES[s.tid]?.questItem) return { ok: false, msg: 'Görev eşyası satılamaz' };
    const n = Math.min(s.q, qty ?? s.q);
    const price = (STACKABLES[s.tid]?.sell || 0) * n;
    s.q -= n;
    if (s.q <= 0) char.bag.slots[index] = null;
    char.gold += price;
    return { ok: true, price };
  }
  if (s.r === 'L') return { ok: false, msg: 'Legendary satılamaz' };
  if (s.lock) return { ok: false, msg: 'Kilitli eşya' };
  const price = itemSellPrice(s);
  char.bag.slots[index] = null;
  char.gold += price;
  return { ok: true, price };
}

// ------------------------------------------------------------------ Parçalama
export function dismantleOutput(inst, rng) {
  switch (inst.r) {
    case 'N': return [{ id: 'scrap', qty: rng.int(1, 2) }];
    case 'U': return rng.float() < 0.25 ? [{ id: 'scrap', qty: 2 }, { id: 'weak_essence', qty: 1 }] : [{ id: 'scrap', qty: 2 }];
    case 'R': return [{ id: 'rare_essence', qty: rng.int(1, 2) }];
    case 'E': return [{ id: 'epic_remnant', qty: 1 }];
    default: return null;
  }
}

export function dismantle(char, index, rng) {
  const s = char.bag.slots[index];
  if (!s || s.q !== undefined) return { ok: false, msg: 'Parçalanamaz' };
  if (s.r === 'L') return { ok: false, msg: 'Legendary parçalanamaz' };
  if (s.lock) return { ok: false, msg: 'Kilitli eşya' };
  const out = dismantleOutput(s, rng);
  // Kapasite kontrolü (eşyanın boşalttığı slot dahil)
  char.bag.slots[index] = null;
  const fits = out.every((o) => stackCapacity(char.bag, o.id) >= o.qty);
  if (!fits) { char.bag.slots[index] = s; return { ok: false, msg: 'Çanta dolu' }; }
  for (const o of out) addStack(char.bag, o.id, o.qty);
  return { ok: true, out };
}

// ------------------------------------------------------------------ Dayanıklılık / tamir
export function repairCost(inst) {
  const t = ITEMS[inst.tid];
  const missing = 100 - inst.d;
  if (missing <= 0) return 0;
  return Math.ceil(missing * (0.4 + t.lv * 0.25) * RARITY_INFO[inst.r].upMult * 0.5);
}

export function repairAllCost(char) {
  return SLOTS.reduce((a, s) => a + (char.equipment[s] ? repairCost(char.equipment[s]) : 0), 0);
}

export function repairAll(char) {
  const cost = repairAllCost(char);
  if (cost <= 0) return { ok: false, msg: 'Tamir gerekmiyor' };
  if (char.gold < cost) return { ok: false, msg: 'Yetersiz Gold' };
  char.gold -= cost;
  for (const s of SLOTS) if (char.equipment[s]) char.equipment[s].d = 100;
  return { ok: true, cost };
}

export function applyDeathDurability(char) {
  for (const s of SLOTS) {
    const it = char.equipment[s];
    if (it) it.d = Math.max(0, it.d - DEATH_DURABILITY_LOSS);
  }
}

// ------------------------------------------------------------------ Genişletmeler
export function expandBag(char) {
  const next = BAG_STEPS.find((s) => s > char.bag.size);
  if (!next) return { ok: false, msg: 'Çanta en büyük boyutta' };
  const cost = BAG_EXPAND_COST[next];
  if (char.gold < cost) return { ok: false, msg: `${cost} Gold gerekli` };
  char.gold -= cost;
  resizeContainer(char.bag, next);
  return { ok: true, size: next, cost };
}

export function expandStorage(char, storage) {
  if (storage.size >= STORAGE_MAX) return { ok: false, msg: 'Depo en büyük boyutta' };
  if (char.gold < STORAGE_EXPAND_COST) return { ok: false, msg: `${STORAGE_EXPAND_COST} Gold gerekli` };
  char.gold -= STORAGE_EXPAND_COST;
  resizeContainer(storage, STORAGE_MAX);
  return { ok: true, cost: STORAGE_EXPAND_COST };
}

// ------------------------------------------------------------------ Crafting
export function craftCheck(char, recipeId) {
  const r = RECIPE_MAP[recipeId];
  if (!r) return { ok: false, msg: 'Tarif yok' };
  if (char.gold < r.gold) return { ok: false, msg: 'Yetersiz Gold' };
  if (!hasMaterials(char, r.inputs)) return { ok: false, msg: 'Eksik materyal' };
  if (r.out.equip) {
    // girdiler tükenirse yer açılabilir; güvenli taraf: boş slot şart
    if (firstFree(char.bag) < 0) return { ok: false, msg: 'Çanta dolu' };
  } else {
    // girdiler tüketildikten sonra çıktı sığmalı: simülasyon
    const sim = { size: char.bag.size, slots: char.bag.slots.map((s) => (s ? { ...s } : null)) };
    for (const m of r.inputs) removeStack(sim, m.id, m.qty);
    if (stackCapacity(sim, r.out.id) < r.out.qty) return { ok: false, msg: 'Çanta dolu' };
  }
  return { ok: true, recipe: r };
}

export function craft(char, recipeId, rng) {
  const chk = craftCheck(char, recipeId);
  if (!chk.ok) return chk;
  const r = chk.recipe;
  consumeMaterials(char, r.inputs);
  char.gold -= r.gold;
  if (r.out.equip) {
    const t = ITEMS[r.out.id];
    const inst = createItem(r.out.id, t.rarity, rng, { src: 'craft' });
    addItem(char, inst, { allowPending: true });
    return { ok: true, inst };
  }
  addStack(char.bag, r.out.id, r.out.qty);
  return { ok: true, out: r.out };
}

// ------------------------------------------------------------------ Yükseltme (+0 → +5)
export function upgradeInfo(inst) {
  const t = ITEMS[inst.tid];
  if (!isUpgradeable(t)) return { ok: false, msg: 'Yüzük ve kolye yükseltilmez' };
  const cur = inst.p || 0;
  if (cur >= 5) return { ok: false, msg: 'En yüksek seviye (+5)' };
  const step = UPGRADE_STEPS[cur];
  const v4 = t.lv >= V4_UPGRADE_MIN_LEVEL;
  const v3 = !v4 && t.lv >= V3_UPGRADE_MIN_LEVEL;
  const v2 = !v4 && !v3 && t.lv >= V2_UPGRADE_MIN_LEVEL;
  let gold = step.gold * RARITY_INFO[inst.r].upMult * UPGRADE_SLOT_MULT[t.slot];
  if (t.lv < 10) gold *= LOW_LEVEL_UPGRADE_MULT;
  if (v2) gold *= V2_UPGRADE_GOLD_MULT;
  if (v3) gold *= V3_UPGRADE_GOLD_MULT;
  if (v4) gold *= V4_UPGRADE_GOLD_MULT;
  gold = Math.max(10, Math.round(gold / 10) * 10);
  const nuFinal = step.to === 5 && (inst.r === 'N' || inst.r === 'U');
  const mats = v4 ? (nuFinal ? UPGRADE_NU_FINAL_V4 : UPGRADE_STEPS_V4_MATS[cur])
    : v3 ? (nuFinal ? UPGRADE_NU_FINAL_V3 : UPGRADE_STEPS_V3_MATS[cur])
    : v2 ? (nuFinal ? UPGRADE_NU_FINAL_V2 : UPGRADE_STEPS_V2_MATS[cur]) : (nuFinal ? UPGRADE_NU_FINAL : step.mats);
  return { ok: true, from: cur, to: step.to, chance: step.chance, gold, mats };
}

// loc: { where: 'bag'|'equip', index|slot }
export function getInstance(char, loc) {
  return loc.where === 'equip' ? char.equipment[loc.slot] : char.bag.slots[loc.index];
}

export function upgrade(char, loc, rng) {
  const inst = getInstance(char, loc);
  if (!inst || inst.q !== undefined) return { ok: false, msg: 'Geçersiz eşya' };
  const info = upgradeInfo(inst);
  if (!info.ok) return info;
  if (char.gold < info.gold) return { ok: false, msg: 'Yetersiz Gold' };
  if (!hasMaterials(char, info.mats)) return { ok: false, msg: 'Eksik materyal' };
  // Atomik: kaynaklar her durumda tüketilir; başarısızlıkta eşya asla kırılmaz/düşmez
  consumeMaterials(char, info.mats);
  char.gold -= info.gold;
  const success = rng.float() < info.chance;
  if (success) inst.p = info.to;
  return { ok: true, success, plus: inst.p, info };
}

export { countStack, freeSlots, POTION_LIST };
