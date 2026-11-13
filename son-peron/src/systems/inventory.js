// Envanter / ortak depo / atomik eşya işlemleri. Hiçbir eşya sessizce silinmez.
const stackOf = (sim, id) => sim.C.items[id]?.stack ?? 99;

export function countIn(slots, id) { let n = 0; for (const s of slots) if (s && s.id === id) n += s.qty; return n; }
export function count(sim, id) { return countIn(sim.s.player.inv, id) + countIn(sim.s.depot, id); }
export function has(sim, mats) { return Object.entries(mats || {}).every(([id, q]) => count(sim, id) >= q); }

// Ortak depo kapasitesi: başlangıç + sandık/raf/dolap + renovasyon bonusları
export function depotCapacity(sim) {
  let cap = sim.C.depotSlots;
  for (const f of sim.s.furniture) cap += sim.def(f).storage || 0;
  for (const r of sim.s.renovations) cap += sim.C.renoFx?.[r]?.depot || 0;
  return cap;
}
export function syncDepot(sim) {
  const cap = depotCapacity(sim); const d = sim.s.depot;
  while (d.length < cap) d.push(null);
  while (d.length > cap && d[d.length - 1] === null) d.pop();
}
export function usedSlots(slots) { return slots.filter(Boolean).length; }

export function fitRoom(sim, slots, id) {
  const st = stackOf(sim, id); let room = 0;
  for (const s of slots) { if (!s) room += st; else if (s.id === id) room += st - s.qty; }
  return room;
}
export function addTo(sim, slots, id, qty) {
  const st = stackOf(sim, id);
  for (const s of slots) { if (qty <= 0) break; if (s && s.id === id && s.qty < st) { const k = Math.min(st - s.qty, qty); s.qty += k; qty -= k; } }
  for (let i = 0; i < slots.length && qty > 0; i++) if (!slots[i]) { const k = Math.min(st, qty); slots[i] = { id, qty: k }; qty -= k; }
  return qty; // sığmayan
}
export function removeFrom(slots, id, qty) {
  for (let i = slots.length - 1; i >= 0 && qty > 0; i--) { const s = slots[i]; if (s && s.id === id) { const k = Math.min(s.qty, qty); s.qty -= k; qty -= k; if (!s.qty) slots[i] = null; } }
  return qty;
}
// Oyuncuya ver; sığmazsa depo; o da dolarsa güvenli geçici depo (limbo). Dönen: çantaya girmeyen adet.
export function give(sim, id, qty, opts = {}) {
  let left = addTo(sim, sim.s.player.inv, id, qty);
  const overflow = left;
  if (left > 0 && !opts.invOnly) { left = addTo(sim, sim.s.depot, id, left); if (left > 0) { toLimbo(sim, id, left); left = 0; } }
  return opts.invOnly ? left : overflow;
}
export function toLimbo(sim, id, qty) { const l = sim.s.limbo.find((e) => e.id === id); if (l) l.qty += qty; else sim.s.limbo.push({ id, qty }); }
export function canFitInv(sim, id, qty) { return fitRoom(sim, sim.s.player.inv, id) >= qty; }
// Atomik tüketim: önce depo, sonra çanta. Yetmiyorsa hiçbir şey düşmez.
export function take(sim, mats) {
  if (!has(sim, mats)) return false;
  for (const [id, q] of Object.entries(mats || {})) { const rest = removeFrom(sim.s.depot, id, q); if (rest > 0) removeFrom(sim.s.player.inv, id, rest); }
  return true;
}
export function missingText(sim, mats) {
  return Object.entries(mats || {}).filter(([id, q]) => count(sim, id) < q).map(([id, q]) => `${q - count(sim, id)} ${sim.C.items[id].name}`).join(', ');
}
export function matsText(sim, mats) { return Object.entries(mats || {}).map(([id, q]) => `${q} ${sim.C.items[id].name}`).join(' + ') || '—'; }

// UI işlemleri: slot taşıma (sürükle-bırak), hızlı aktarım, sıralama
export function moveSlot(sim, fromKey, fi, toKey, ti, qty) {
  const from = fromKey === 'inv' ? sim.s.player.inv : sim.s.depot; const to = toKey === 'inv' ? sim.s.player.inv : sim.s.depot;
  const a = from[fi]; if (!a || (from === to && fi === ti)) return false;
  const n = Math.min(qty || a.qty, a.qty); const b = to[ti]; const st = stackOf(sim, a.id);
  if (!b) { to[ti] = { id: a.id, qty: n }; a.qty -= n; if (!a.qty) from[fi] = null; return true; }
  if (b.id === a.id) { const k = Math.min(st - b.qty, n); b.qty += k; a.qty -= k; if (!a.qty) from[fi] = null; return k > 0; }
  if (n === a.qty) { to[ti] = a; from[fi] = b; return true; }
  return false;
}
export function quickTransfer(sim, fromKey, fi, qty) {
  const from = fromKey === 'inv' ? sim.s.player.inv : sim.s.depot; const to = fromKey === 'inv' ? sim.s.depot : sim.s.player.inv;
  const a = from[fi]; if (!a) return false; const n = Math.min(qty || a.qty, a.qty);
  const left = addTo(sim, to, a.id, n); a.qty -= n - left; if (!a.qty) from[fi] = null; return left < n;
}
export function sortSlots(sim, key) {
  const slots = key === 'inv' ? sim.s.player.inv : sim.s.depot; const start = key === 'inv' ? 8 : 0; // hızlı slotlar yerinde kalır
  const tot = {}; for (let i = start; i < slots.length; i++) { const s = slots[i]; if (s) { tot[s.id] = (tot[s.id] || 0) + s.qty; slots[i] = null; } }
  const order = ['handtool', 'tool', 'resource', 'ingredient', 'drink', 'seed', 'food', 'equipment', 'furniture', 'cosmetic'];
  const ids = Object.keys(tot).sort((a, b) => order.indexOf(sim.C.items[a].cat) - order.indexOf(sim.C.items[b].cat) || sim.C.items[a].name.localeCompare(sim.C.items[b].name, 'tr'));
  const view = slots.slice(start); for (const id of ids) addTo(sim, view, id, tot[id]);
  for (let i = start; i < slots.length; i++) slots[i] = view[i - start];
}
export function takeLimbo(sim) {
  const l = sim.s.limbo; let moved = 0;
  for (let i = l.length - 1; i >= 0; i--) { const left = addTo(sim, sim.s.player.inv, l[i].id, l[i].qty); moved += l[i].qty - left; if (left) l[i].qty = left; else l.splice(i, 1); }
  return moved;
}
