// Evcil hayvanlar: teklifler, bisküvi, Zıpır & Tarçın özel akışı, Eski Dostlar.
import { BALANCE } from '../config/balance.js';
import { PETS, PET_BY_ID } from '../data/pets.js';
import { HARBOR_BY_ID, HARBOR_TYPES } from '../data/harbors.js';
import { SeededRNG } from '../core/SeededRNG.js';
import { whereMatches } from '../utils/helpers.js';
import { hasPet } from './CrewSystem.js';

export function generatePetOffer(G, harborIdx) {
  const harbor = HARBOR_BY_ID[G.run.route[harborIdx].harborId];
  const rng = SeededRNG.derive(G.run.seed, 'pet', harborIdx, harbor.id);
  const chance = HARBOR_TYPES[harbor.type].petChance ?? BALANCE.pets.offerChance.default;
  if (!rng.chance(chance)) return null;
  // Zıpır ve Tarçın limanda satılmaz: hikâyeleri özel eventlerle ilerler (KARAR).
  const pool = PETS.filter((p) => !p.special && !hasPet(G, p.id) && (harbor.final || whereMatches(p.where, harbor.region, harbor.type)));
  if (!pool.length) return null;
  return rng.weighted(pool, (p) => p.weight).id;
}

export function petPrice(G, id) {
  let p = PET_BY_ID[id].price;
  const st = G.run.visit?.statuses || [];
  if (st.includes('contraband')) p *= BALANCE.trade.contrabandStatusMult;
  if (st.includes('hero')) p *= BALANCE.trade.heroBuyMult;
  return Math.round(p);
}

export function isOldFriendsPair(run) {
  return run.pets.includes('PET_ZIPIR') && run.pets.includes('PET_TARCIN');
}

/**
 * Hayvanı gemiye ekler.
 * Eski Dostlar: Zıpır gemideyken Tarçın (veya tersi) gelirse slot sessizce ikiye çıkar.
 * Dönüş: { ok, oldFriends?, needsSlot? }
 */
export function addPet(G, id, replaceId = null) {
  const run = G.run;
  if (run.pets.includes(id)) return { ok: false, reason: 'Bu hayvan zaten gemide.' };
  const pairing = (id === 'PET_ZIPIR' && run.pets.includes('PET_TARCIN')) || (id === 'PET_TARCIN' && run.pets.includes('PET_ZIPIR'));
  if (pairing) {
    run.petCap = Math.max(run.petCap, 2);
    // İkinci slot yalnızca ikilinin içindir; başka hayvan varsa ikiliye yer açmak için gider.
    const others = run.pets.filter((p) => p !== 'PET_ZIPIR' && p !== 'PET_TARCIN');
    for (const o of others) run.pets.splice(run.pets.indexOf(o), 1);
    run.pets.push(id);
    G.meta.codex.pets[id] = true;
    const first = !run.special.oldFriends;
    run.special.oldFriends = true;
    run.special.stage = 'reunited';
    return { ok: true, oldFriends: first };
  }
  const cap = isOldFriendsPair(run) ? 2 : 1;
  if (run.pets.length >= cap) {
    if (!replaceId || !run.pets.includes(replaceId)) return { ok: false, needsSlot: true, reason: 'Hayvan slotun dolu.' };
    releasePet(G, replaceId);
  }
  run.pets.push(id);
  G.meta.codex.pets[id] = true;
  return { ok: true };
}

export function releasePet(G, id) {
  const run = G.run;
  const ix = run.pets.indexOf(id);
  if (ix < 0) return false;
  run.pets.splice(ix, 1);
  if (!isOldFriendsPair(run)) run.petCap = 1;
  // Bekleyen ikinci özel karşılaşmanın koşulu (ilk hayvan gemide) bozulursa iptal edilir.
  if (run.special.stage === 'awaitingSecond') {
    const need = run.special.secondPet === 'PET_ZIPIR' ? 'PET_TARCIN' : 'PET_ZIPIR';
    if (!run.pets.includes(need)) run.special.stage = 'cancelled';
  }
  return true;
}

export function buyPet(G, replaceId = null) {
  const visit = G.run.visit;
  if (!visit || !visit.pet) return { ok: false, reason: 'Bu limanda hayvan teklifi yok.' };
  if (visit.petBought) return { ok: false, reason: 'Bu hayvan zaten alındı.' };
  const price = petPrice(G, visit.pet);
  if (G.run.gold < price) return { ok: false, reason: `Yetersiz altın (${price} gerekli).` };
  const res = addPet(G, visit.pet, replaceId);
  if (!res.ok) return res;
  G.run.gold -= price;
  visit.petBought = true;
  return { ok: true, price };
}

export function buyBiscuit(G) {
  if (!hasPet(G, 'PET_TARCIN')) return { ok: false, reason: 'Bisküvi Tarçın içindir; gemide değil.' };
  if (G.run.buffs.biscuit) return { ok: false, reason: 'Tarçın bu rota için bisküvisini zaten aldı.' };
  if (G.run.gold < BALANCE.pets.biscuitCost) return { ok: false, reason: 'Yetersiz altın.' };
  G.run.gold -= BALANCE.pets.biscuitCost;
  G.run.buffs.biscuit = true;
  return { ok: true };
}

/** İlk özel event sonrası ikinci karşılaşmayı planlar (2–4 liman sonra, run bitmeden). */
export function scheduleSecondEncounter(G, takenPet) {
  const run = G.run;
  const rng = SeededRNG.derive(run.seed, 'special2');
  const [a, b] = BALANCE.special.secondAfterHarbors;
  const firstAt = run.special.firstAt;
  let due = firstAt + rng.int(a, b);
  due = Math.min(due, run.route.length - 1);
  due = Math.max(due, Math.min(run.idx + 1, run.route.length - 1));
  run.special.secondDueAt = due;
  run.special.secondPet = takenPet === 'PET_TARCIN' ? 'PET_ZIPIR' : 'PET_TARCIN';
  run.special.stage = 'awaitingSecond';
}
