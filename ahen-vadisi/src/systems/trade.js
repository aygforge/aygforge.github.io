// Oyuncular arası ticaret — saf kurallar (sunucu aracılık eder: src/online/trade.js, server/hub.mjs).
// Teklif: { items: [eşya örneği], stacks: [{ tid, q }], gold }. Yalnız çantadaki, kilitsiz eşyalar verilebilir.
// Uygulama hep-ya-hiç: önce çantanın kopyasında denenir, sığmazsa ya da eşya artık yoksa hiçbir şey değişmez.
import { ITEMS } from '../data/items.js';
import { isStackable, QUEST_ITEM_LIST } from '../data/materials.js';

// görev eşyaları takas edilemez (görev ilerlemesi kopyalanmasın)
const QUEST_ITEMS = new Set(QUEST_ITEM_LIST.map((q) => q.id));
export const tradableStack = (tid) => isStackable(tid) && !QUEST_ITEMS.has(tid);
import { RARITIES } from '../data/constants.js';
import { countStack, removeStack, addStack, firstFree } from './inventory.js';

export const TRADE_MAX_ITEMS = 12;
export const TRADE_MAX_STACKS = 8;
export const TRADE_MAX_GOLD = 10_000_000;

export const emptyOffer = () => ({ items: [], stacks: [], gold: 0 });

// Çantadan teklif edilebilecekler (kilitli eşya hariç)
export function offerable(char) {
  const out = [];
  for (const s of char.bag.slots) {
    if (!s) continue;
    if (s.q !== undefined) { if (tradableStack(s.tid)) out.push({ kind: 'stack', tid: s.tid, q: s.q, uid: s.uid }); }
    else if (!s.lock && ITEMS[s.tid]) out.push({ kind: 'item', inst: s });
  }
  return out;
}

// Gelen (karşı taraftan) teklifin biçimini temizle — güvenilmez veri
export function sanitizeOffer(o) {
  const items = [], stacks = [];
  for (const it of Array.isArray(o?.items) ? o.items.slice(0, TRADE_MAX_ITEMS) : []) {
    if (!it || typeof it !== 'object' || typeof it.uid !== 'string' || !ITEMS[it.tid]) continue;
    if (!RARITIES.includes(it.r)) continue;
    const clean = { ...it };
    delete clean.lock;
    items.push(clean);
  }
  const seen = new Map();
  for (const st of Array.isArray(o?.stacks) ? o.stacks.slice(0, TRADE_MAX_STACKS) : []) {
    const q = Math.floor(+st?.q);
    if (!st || !tradableStack(st.tid) || !(q > 0)) continue;
    seen.set(st.tid, Math.min(9999, (seen.get(st.tid) || 0) + q));
  }
  for (const [tid, q] of seen) stacks.push({ tid, q });
  const gold = Math.max(0, Math.min(TRADE_MAX_GOLD, Math.floor(+o?.gold || 0)));
  return { items, stacks, gold };
}

// Bu oyuncu bu teklifi verebilir mi? (eşyalar çantada ve kilitsiz, istifler yeterli, altın yeterli)
export function canGive(char, offer) {
  for (const it of offer.items) {
    const s = char.bag.slots.find((x) => x && x.uid === it.uid);
    if (!s || s.q !== undefined) return { ok: false, msg: `${ITEMS[it.tid]?.name || 'Eşya'} artık çantada değil` };
    if (s.lock) return { ok: false, msg: `${ITEMS[it.tid].name} kilitli` };
  }
  for (const st of offer.stacks) if (countStack(char.bag, st.tid) < st.q) return { ok: false, msg: 'Yeterli malzeme yok' };
  if ((char.gold || 0) < offer.gold) return { ok: false, msg: 'Yeterli altın yok' };
  return { ok: true };
}

function cloneBag(bag) { return { size: bag.size, slots: bag.slots.map((s) => (s ? { ...s } : null)) }; }

// Takası bir çanta kopyasında dene: verilecekler çıkar, gelenler sığıyor mu?
function simulate(char, give, get) {
  const bag = cloneBag(char.bag);
  for (const it of give.items) {
    const i = bag.slots.findIndex((x) => x && x.uid === it.uid && x.q === undefined);
    if (i < 0) return { ok: false, msg: 'Verilecek eşya bulunamadı' };
    bag.slots[i] = null;
  }
  for (const st of give.stacks) if (!removeStack(bag, st.tid, st.q)) return { ok: false, msg: 'Yeterli malzeme yok' };
  for (const it of get.items) {
    const i = firstFree(bag);
    if (i < 0) return { ok: false, msg: 'Çantada yer yok' };
    bag.slots[i] = { ...it };
  }
  for (const st of get.stacks) if (addStack(bag, st.tid, st.q) > 0) return { ok: false, msg: 'Çantada yer yok' };
  return { ok: true, bag };
}

// Hazırlık: hem verebiliyor hem alabiliyor mu
export function canTrade(char, give, get) {
  const g = canGive(char, give);
  if (!g.ok) return g;
  const s = simulate(char, give, get);
  return s.ok ? { ok: true } : s;
}

// Uygula (hep-ya-hiç). give: benim teklifim, get: karşı teklif (temizlenmiş)
export function applyTrade(char, give, get) {
  const g = canGive(char, give);
  if (!g.ok) return g;
  const s = simulate(char, give, get);
  if (!s.ok) return s;
  char.bag.slots = s.bag.slots;
  char.gold = (char.gold || 0) - give.gold + get.gold;
  return { ok: true };
}

