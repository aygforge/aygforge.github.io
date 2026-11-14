// Seed ile rota üretimi (GDD Bölüm 3) ve rota başına event sayısı.
import { BALANCE } from '../config/balance.js';
import { HARBORS, HARBOR_BY_ID, HARBOR_TYPES, GRAND_HARBOR_ID } from '../data/harbors.js';
import { SeededRNG } from '../core/SeededRNG.js';
import { hasUpgrade } from '../core/GameState.js';

export function harborUnlocked(meta, harbor) {
  const lock = HARBOR_TYPES[harbor.type].locked;
  return !lock || meta.upgrades.includes(lock);
}

function regionForPosition(i, total, rng) {
  // i: 0..total-2 (final hariç). Bölge 1 → 2 → 3 → (4–5 karışık)
  if (i === 0) return 1;
  const t = i / (total - 1);
  let r = 1 + Math.floor(t * 5);
  if (r >= 4) r = rng.chance(35 + (t - 0.6) * 150) ? 5 : 4;
  return Math.max(1, Math.min(5, r));
}

/** Aynı seed + aynı kilit durumu → aynı rota. */
export function generateRoute(seed, meta) {
  const rng = SeededRNG.derive(seed, 'route');
  const n = rng.int(BALANCE.route.minHarbors, BALANCE.route.maxHarbors);
  const used = new Set([GRAND_HARBOR_ID]);
  const route = [];
  for (let i = 0; i < n - 1; i++) {
    let region = regionForPosition(i, n, rng);
    let harbor = null;
    for (const r of [region, region - 1, region + 1, region - 2, region + 2]) {
      if (r < 1 || r > 5) continue;
      const pool = HARBORS.filter((h) => h.region === r && !h.final && !used.has(h.id) && harborUnlocked(meta, h));
      if (pool.length) {
        harbor = rng.pick(pool);
        region = r;
        break;
      }
    }
    if (!harbor) break;
    used.add(harbor.id);
    route.push({ harborId: harbor.id, distance: null });
  }
  route.push({ harborId: GRAND_HARBOR_ID, distance: null });
  for (let i = 0; i < route.length - 1; i++) {
    const d = rng.weighted(BALANCE.route.distances);
    route[i].distance = d.id;
  }
  return route;
}

/** "Başka limana yönlen": hedefi aynı bölgeden kullanılmamış bir limanla değiştirir. */
export function rerouteTarget(G, rng) {
  const run = G.run;
  const toIdx = run.idx + 1;
  const cur = HARBOR_BY_ID[run.route[toIdx].harborId];
  if (cur.final) return null;
  const used = new Set(run.route.map((r) => r.harborId));
  const pool = HARBORS.filter((h) => !h.final && !used.has(h.id) && harborUnlocked(G.meta, h) && Math.abs(h.region - cur.region) <= 0);
  const alt = pool.length ? rng.pick(pool) : null;
  if (!alt) return null;
  run.route[toIdx].harborId = alt.id;
  return alt;
}

export function distanceInfo(id) {
  return BALANCE.route.distances.find((d) => d.id === id);
}

export const DISTANCE_NAMES = { short: 'Kısa', medium: 'Orta', long: 'Uzun' };

/** Rota başına event sayısı ve değiştiricileri */
export function routeEventCount(G, rng, distanceId, destHarbor) {
  const d = distanceInfo(distanceId);
  let n = rng.int(d.events[0], d.events[1]);
  const mods = [];
  const run = G.run;
  if (run.crew.includes('CREW_FINN')) { n -= 1; mods.push('Old Finn −1'); }
  if (hasUpgrade(G.meta, 'UPG_SEASONED_ROUTE')) { n -= 1; mods.push('Deneyimli Rota −1'); }
  if (run.crew.includes('CREW_YUSUF') && rng.chance(20)) { n -= 1; mods.push('Yusuf −1'); }
  if (run.buffs.nextRouteEvents) { n += run.buffs.nextRouteEvents; mods.push(`Yıldız Haritası ${run.buffs.nextRouteEvents}`); }
  if (destHarbor.type === 'fog') { n += BALANCE.route.fogHarborExtraEvent; mods.push('Sis limanı +1'); }
  n = Math.max(BALANCE.route.minEventsPerRoute, n);
  return { n, mods };
}
