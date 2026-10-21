// LootService — belge §8. Sıra: nadirlik çekilişi (tek) → uygun havuz → rastgele bonus.
// Legendary yalnızca 'golem' tablosundan gelir; boş havuz uygunsuz eşya üretmez.
import { ITEMS, ITEM_LIST, canClassUse } from '../data/items.js';
import { ENEMIES } from '../data/enemies.js';
import { MATERIALS, POTION_LIST } from '../data/materials.js';
import {
  LOOT_TABLES, LEGENDARY_SOURCE_TABLE, LEGENDARY_CLASS_WEIGHT, VARIANT_BAND_BELOW, VARIANT_BAND_ABOVE,
  GOLEM_RARE_MIN_LEVEL, CLASS_POOL_WEIGHT, CANONICAL_WEIGHT, BONUS_TYPES,
} from '../data/loot.js';
import { RARITY_INFO, SPECIES } from '../data/constants.js';
import { makeUid } from '../core/rng.js';

const TIER_ORDER = ['L', 'E', 'R', 'U', 'N'];

// Kaynağın "loot kimliği": dungeon varyantı aynı elit türünün havuzunu kullanır
export function lootSourceId(enemyId) {
  return ENEMIES[enemyId]?.variantOf || enemyId;
}

// --------------------------------------------------------------------- Havuzlar
const poolCache = new Map();

// Bir kaynak + nadirlik için uygun şablonlar: [{ tid, canonical }]
export function buildPool(enemyId, rarity) {
  const key = `${enemyId}|${rarity}`;
  if (poolCache.has(key)) return poolCache.get(key);
  const src = lootSourceId(enemyId);
  const e = ENEMIES[src];
  const table = e.lootTable;
  const out = [];
  if (rarity === 'L') {
    // Sıfır tolerans: Legendary yalnız Golem tablosu ve kanonik kaynağı Golem olan L eşyalar
    if (table === LEGENDARY_SOURCE_TABLE) {
      for (const t of ITEM_LIST) if (t.rarity === 'L' && t.sources.includes(src)) out.push({ tid: t.id, canonical: true });
    }
  } else {
    for (const t of ITEM_LIST) {
      if (t.rarity === 'L') continue;
      const canonicalHere = t.sources.includes(src) && t.rarity === rarity;
      if (canonicalHere) { out.push({ tid: t.id, canonical: true }); continue; }
      // Varyant: kanonik N/U temel şablonlar, kaynak seviye bandında, N/U/R olarak
      if (t.allowedRarities.length === 1 || !t.allowedRarities.includes(rarity)) continue;
      const lvOk = t.lv >= e.level - VARIANT_BAND_BELOW && t.lv <= e.level + VARIANT_BAND_ABOVE;
      if (lvOk && table !== 'golem') out.push({ tid: t.id, canonical: false });
    }
    // Golem Rare havuzu: kanonik üst seviye Rare şablonlar
    if (table === 'golem' && rarity === 'R') {
      for (const t of ITEM_LIST) if (t.rarity === 'R' && t.lv >= GOLEM_RARE_MIN_LEVEL) out.push({ tid: t.id, canonical: false });
    }
  }
  poolCache.set(key, out);
  return out;
}

export function rollRarity(tableId, rng) {
  const t = LOOT_TABLES[tableId];
  const r = rng.float() * 100;
  let acc = 0;
  for (const k of TIER_ORDER) {
    acc += t[k];
    if (r < acc) return k;
  }
  return null; // ekipmansız
}

export function pickTemplate(enemyId, rarity, cls, rng) {
  const pool = buildPool(enemyId, rarity);
  if (!pool.length) return null;
  if (rarity === 'L') {
    const own = pool.filter((p) => canClassUse(ITEMS[p.tid], cls));
    const other = pool.filter((p) => !canClassUse(ITEMS[p.tid], cls));
    const list = own.length && other.length ? (rng.float() < LEGENDARY_CLASS_WEIGHT ? own : other) : pool;
    return rng.pick(list).tid;
  }
  const entries = pool.map((p) => {
    const t = ITEMS[p.tid];
    const cw = canClassUse(t, cls) ? CLASS_POOL_WEIGHT.own : CLASS_POOL_WEIGHT.other;
    return { tid: p.tid, w: cw * (p.canonical ? CANONICAL_WEIGHT : 1) };
  });
  return rng.weighted(entries).tid;
}

// --------------------------------------------------------------------- Eşya örneği ve bonuslar
export function bonusCandidates(t) {
  const out = [];
  for (const [type, bt] of Object.entries(BONUS_TYPES)) {
    if (bt.slots !== 'all' && !bt.slots.includes(t.slot)) continue;
    if (t.cls !== 'any' && !bt.cls.includes(t.cls)) continue;
    out.push(type);
  }
  return out;
}

export function rollBonuses(t, rarity, rng) {
  if (rarity === 'L' || t.rarity === 'L') return [];
  const n = RARITY_INFO[rarity].bonusCount;
  if (!n) return [];
  const cands = rng.shuffle(bonusCandidates(t).slice());
  const out = [];
  for (const type of cands.slice(0, n)) {
    const [lo, hi] = BONUS_TYPES[type][rarity];
    const isPct = BONUS_TYPES[type].fmt === 'pct';
    const v = rng.int(lo, hi);
    const b = { t: type, v: isPct ? v / 100 : v };
    if (type === 'species') b.s = rng.pick(Object.keys(SPECIES));
    out.push(b);
  }
  return out;
}

export function createItem(tid, rarity, rng, opts = {}) {
  const t = ITEMS[tid];
  if (!t) throw new Error(`Bilinmeyen eşya ${tid}`);
  const r = rarity || t.rarity;
  if (r === 'L' && t.rarity !== 'L') throw new Error('Legendary varyant üretilemez');
  if (!t.allowedRarities.includes(r)) throw new Error(`${tid} için ${r} nadirliği geçersiz`);
  return {
    uid: makeUid('i'), tid, r,
    b: opts.noBonus ? [] : rollBonuses(t, r, rng),
    p: 0, d: 100, lock: false,
    ...(opts.src ? { src: opts.src } : {}),
  };
}

// --------------------------------------------------------------------- Öldürme sonucu
// ctx: { cls, killId } → { gold, equipment:[inst], stacks:[{id,qty}], killId }
export function rollKillLoot(enemyId, ctx, rng) {
  const e = ENEMIES[enemyId];
  const result = { killId: ctx.killId || makeUid('k'), gold: 0, equipment: [], stacks: [], rarity: null };
  if (!e || !e.lootTable || e.noReward) return result;
  const table = LOOT_TABLES[e.lootTable];
  result.gold = rng.int(e.gold[0], e.gold[1]);
  // Ekipman: tek ve birbirini dışlayan nadirlik çekilişi
  const rarity = rollRarity(e.lootTable, rng);
  if (rarity) {
    const tid = pickTemplate(enemyId, rarity, ctx.cls, rng);
    if (tid) {
      result.equipment.push(createItem(tid, rarity, rng, { src: enemyId }));
      result.rarity = rarity;
    }
  }
  // Bağımsız materyal çekilişi
  if (table.materialChance && e.materials?.length && rng.float() < table.materialChance) {
    const m = rng.weighted(e.materials);
    result.stacks.push({ id: m.id, qty: 1 });
  }
  // Bağımsız iksir çekilişi (seviyeye uygun)
  if (table.potionChance && rng.float() < table.potionChance) {
    const ok = POTION_LIST.filter((p) => p.lv <= Math.max(1, e.level));
    const tier = Math.max(...ok.map((p) => p.lv));
    const p = rng.pick(ok.filter((x) => x.lv === tier));
    result.stacks.push({ id: p.id, qty: 1 });
  }
  // Garantili elit/boss materyalleri
  for (const g of e.guaranteed || []) result.stacks.push({ id: g.id, qty: rng.int(g.qty[0], g.qty[1]) });
  for (const x of e.extraRolls || []) if (rng.float() < x.chance) result.stacks.push({ id: x.id, qty: 1 });
  return result;
}

// Toplama düğümleri (cevher/ot)
export function rollGather(kind, rng) {
  if (!MATERIALS[kind]) return null;
  return { id: kind, qty: rng.chance(0.3) ? 2 : 1 };
}

// Sunak tamamlama: 1–2 Sunak Tozu + bölgeye bağlı doğrudan Sunak Kristali şansı (Legendary yok)
export function rollAltar(crystalChance, rng) {
  const out = [{ id: 'altar_dust', qty: rng.int(1, 2) }];
  if (rng.float() < crystalChance) out.push({ id: 'altar_crystal', qty: 1 });
  return out;
}
