// Tayfa: işe alma, bırakma, pasif çarpanları ve sinerjiler.
import { BALANCE } from '../config/balance.js';
import { CREW, CREW_BY_ID } from '../data/crew.js';
import { HARBOR_BY_ID, HARBOR_TYPES } from '../data/harbors.js';
import { SeededRNG } from '../core/SeededRNG.js';
import { whereMatches } from '../utils/helpers.js';
import { crewSlots } from './ShipSystem.js';

export const hasCrew = (G, id) => G.run.crew.includes(id);
export const hasPet = (G, id) => G.run.pets.includes(id);
export const hasItem = (G, id) => G.run.items.some((i) => i.id === id);

/**
 * GDD: Pita gemideyken tüm tayfa becerileri +%10 (Tarçın da varsa moral +%5 → %15).
 * Tarçın için alınan bisküvi bir sonraki rotada tüm tayfa becerilerini %8 güçlendirir.
 */
export function crewSkillMult(G) {
  let m = 1;
  if (hasCrew(G, 'CREW_PITA')) m *= hasPet(G, 'PET_TARCIN') ? BALANCE.crew.pitaTarcinMult : BALANCE.crew.pitaMult;
  if (G.run.buffs.biscuit && hasPet(G, 'PET_TARCIN')) m *= BALANCE.pets.biscuitBonus;
  return m;
}

/** Tarçın'ın becerilerine Bisküvi Kasası bonusu (kargoda varsa +%15) */
export function tarcinMult(G) {
  return G.run.cargo.some((l) => l.good === 'GOOD_BISCUIT_CRATE' && l.qty > 0) ? BALANCE.pets.biscuitCrateTarcinBonus : 1;
}

export function crewAvailableForRun(G, id) {
  return !G.run.crew.includes(id) && !G.run.dismissedCrew.includes(id);
}

export function generateCrewOffers(G, harborIdx) {
  const harbor = HARBOR_BY_ID[G.run.route[harborIdx].harborId];
  const rng = SeededRNG.derive(G.run.seed, 'crew', harborIdx, harbor.id);
  const type = HARBOR_TYPES[harbor.type];
  const isFinal = !!harbor.final;
  const pool = CREW.filter((c) => crewAvailableForRun(G, c.id) && (isFinal || whereMatches(c.where, harbor.region, harbor.type)));
  const [mn, mx] = BALANCE.crew.offers;
  const n = rng.int(mn, mx);
  const offers = [];
  if (type.guaranteedCrew && crewAvailableForRun(G, type.guaranteedCrew)) offers.push(type.guaranteedCrew);
  const rest = pool.filter((c) => !offers.includes(c.id));
  while (offers.length < n && rest.length) {
    const pick = rng.weighted(rest, (c) => (c.cls === 'rare' ? 4 : 10));
    offers.push(pick.id);
    rest.splice(rest.indexOf(pick), 1);
  }
  return offers;
}

/** Event ödülü için aday tayfalar */
export function crewCandidates(G, spec, rng) {
  const region = G.ctxRegion || 1;
  let pool = CREW.filter((c) => crewAvailableForRun(G, c.id));
  let n = 1;
  if (typeof spec === 'number') n = spec;
  else if (spec && typeof spec === 'object') {
    n = spec.n || 1;
    if (spec.pool) pool = pool.filter((c) => spec.pool.includes(c.id));
    if (spec.cls) {
      const cls = Array.isArray(spec.cls) ? spec.cls : [spec.cls];
      pool = pool.filter((c) => cls.includes(c.cls));
    }
  }
  if (!(spec && spec.pool) && !(spec && spec.cls === 'rare')) {
    // nadir tayfalar yalnızca geç bölgelerde
    if (region < 4) pool = pool.filter((c) => c.cls !== 'rare');
  }
  const out = [];
  const rest = pool.slice();
  while (out.length < n && rest.length) {
    const pick = rng.weighted(rest, (c) => (c.where.some((w) => !w.regions || w.regions.includes(region)) ? 10 : 3));
    out.push(pick.id);
    rest.splice(rest.indexOf(pick), 1);
  }
  return out;
}

export function crewPrice(G, id) {
  const base = CREW_BY_ID[id].price;
  const tut = G.run?.tutorial;
  if (tut && tut.giftAt != null && G.run.visit?.idx === tut.giftAt && !tut.crewGift) return 0; // eğitim hediyesi
  // Usta İşe Alımcı: run'da altınla işe alınan ilk tayfaya %15 indirim
  if (base > 0 && G.meta.upgrades.includes('UPG_X1_RECRUITER') && !G.run.x1?.once?.recruiter) return Math.round(base * 0.85);
  return base;
}

/** Tayfayı gemiye ekler. replaceId verilirse o tayfa bırakılır (run'a geri dönmez). */
export function addCrew(G, id, replaceId = null) {
  const run = G.run;
  if (run.crew.includes(id)) return { ok: false, reason: 'Bu tayfa zaten gemide.' };
  if (run.crew.length >= crewSlots(G)) {
    if (!replaceId || !run.crew.includes(replaceId)) return { ok: false, reason: 'Tayfa slotların dolu.', needsSlot: true };
    dismissCrew(G, replaceId);
  }
  run.crew.push(id);
  G.meta.codex.crewHired[id] = true;
  G.meta.codex.crewMet[id] = true;
  if (id === 'CREW_SOLARA') G.meta.solaraHired = true;
  if (id === 'CREW_ISADORA' && !run.chains.CH_PRINCESS) {
    run.chains.CH_PRINCESS = { status: 'queued', flags: {}, step: 0 };
    run.pendingRoute.push({ id: 'CH_PRINCESS_1', src: 'chain', chain: 'CH_PRINCESS' });
  }
  return { ok: true };
}

export function dismissCrew(G, id) {
  const run = G.run;
  const i = run.crew.indexOf(id);
  if (i < 0) return false;
  run.crew.splice(i, 1);
  if (!run.dismissedCrew.includes(id)) run.dismissedCrew.push(id);
  return true;
}

export function hireCrew(G, id, replaceId = null) {
  const visit = G.run.visit;
  if (!visit || !visit.crew.includes(id)) return { ok: false, reason: 'Bu tayfa bu limanda teklif edilmiyor.' };
  if (visit.crewHired.includes(id)) return { ok: false, reason: 'Bu tayfa zaten işe alındı.' };
  const price = crewPrice(G, id);
  if (G.run.gold < price) return { ok: false, reason: `Yetersiz altın (${price} gerekli).` };
  const res = addCrew(G, id, replaceId);
  if (!res.ok) return res;
  G.run.gold -= price;
  if (G.run.tutorial && G.run.tutorial.giftAt != null && price === 0) G.run.tutorial.crewGift = true;
  if (price > 0 && G.run.x1 && G.meta.upgrades.includes('UPG_X1_RECRUITER')) G.run.x1.once.recruiter = true;
  visit.crewHired.push(id);
  return { ok: true, price };
}
