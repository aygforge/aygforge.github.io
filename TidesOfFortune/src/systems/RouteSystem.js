// Belirsiz rota sistemi (Top-Down Rework).
// Run başında yalnızca başlangıç limanı ve toplam durak sayısı (gizli) belirlenir.
// Her limandan ayrılırken 2–3 deniz yolu önerilir; hedef liman seed ile belirlenir ama oyuncuya
// yalnızca ipuçları (bölge, tehlike, korsan etkinliği, ticaret söylentileri, belirsizlik) gösterilir.
import { BALANCE } from '../config/balance.js';
import { HARBORS, HARBOR_BY_ID, HARBOR_TYPES, GRAND_HARBOR_ID, REGIONS } from '../data/harbors.js';
import { GOOD_BY_ID, TRADE_GOODS, HARBOR_PRICE_MULT } from '../data/goods.js';
import { SeededRNG } from '../core/SeededRNG.js';
import { hasUpgrade } from '../core/GameState.js';

export function harborUnlocked(meta, harbor) {
  const lock = HARBOR_TYPES[harbor.type].locked;
  return !lock || meta.upgrades.includes(lock);
}

/** Toplam durak sayısının i'inci konumu için hedef bölge (GDD: 1 → 2 → 3 → 4–5 karışık) */
export function regionForPosition(i, total, rng) {
  if (i === 0) return 1;
  const t = i / (total - 1);
  let r = 1 + Math.floor(t * 5);
  if (r >= 4) r = rng.chance(35 + (t - 0.6) * 150) ? 5 : 4;
  return Math.max(1, Math.min(5, r));
}

function pickHarbor(rng, meta, region, used, prefer = null) {
  for (const r of [region, region - 1, region + 1, region - 2, region + 2]) {
    if (r < 1 || r > 5) continue;
    let pool = HARBORS.filter((h) => h.region === r && !h.final && !used.has(h.id) && harborUnlocked(meta, h));
    if (prefer) {
      const pref = pool.filter((h) => prefer.includes(h.type));
      if (pref.length) pool = pref;
    }
    if (pool.length) return rng.pick(pool);
  }
  return null;
}

/** Run planı: başlangıç limanı + toplam liman sayısı (6–10, final dahil). Aynı seed → aynı plan. */
export function generateRoute(seed, meta) {
  const rng = SeededRNG.derive(seed, 'route');
  const total = rng.int(BALANCE.route.minHarbors, BALANCE.route.maxHarbors);
  const start = pickHarbor(rng, meta, 1, new Set([GRAND_HARBOR_ID]));
  return { total, route: [{ harborId: start.id, distance: null }] };
}

export const LANE_TYPES = {
  coast: { name: 'Kıyı Yolu', desc: 'Kıyıya yakın, sığ ve korunaklı sular.', dist: { short: 6, medium: 3, long: 1 }, danger: -1, regionShift: -0.4, prefer: ['fishing', 'trade', 'military'] },
  trade: { name: 'Ticaret Akıntısı', desc: 'Tüccar gemilerinin sık kullandığı ana akıntı.', dist: { short: 2, medium: 6, long: 2 }, danger: 0, regionShift: 0, prefer: ['trade', 'military'], rumorBoost: 15 },
  open: { name: 'Açık Deniz', desc: 'Uzun ama hızlı rüzgârlı derin sular.', dist: { short: 1, medium: 4, long: 5 }, danger: 1, regionShift: 0.4, prefer: null },
  wild: { name: 'Sisli Geçit', desc: 'Haritalarda yarım kalmış, sisle kaplı bir geçit.', dist: { short: 2, medium: 4, long: 4 }, danger: 1, regionShift: 0.6, prefer: ['fog', 'pirate', 'mystery', 'volcanic', 'ice'], uncertain: true },
  smuggler: { name: 'Kaçakçı Rotası', desc: 'Korsan ve kaçakçıların sevdiği tenha yollar.', dist: { short: 3, medium: 5, long: 2 }, danger: 2, regionShift: 0.2, prefer: ['pirate', 'fog'], pirates: true },
};

/** İstihbarat doğruluğu (tayfa, hayvan ve kalıcı yükseltmelerle artar) */
export function intelAccuracy(G) {
  const run = G.run;
  let type = BALANCE.lanes.baseTypeAccuracy;
  let trade = BALANCE.lanes.baseRumorAccuracy;
  if (run.crew.includes('CREW_COMPASS') || run.crew.includes('CREW_FINN')) type = 100;
  if (hasUpgrade(G.meta, 'UPG_HARBOR_SIGHT')) type = 100;
  if (run.crew.includes('CREW_TOBIAS')) type = Math.max(type, 80);
  if (run.crew.includes('CREW_TARIK') || run.crew.includes('CREW_SELENE')) trade = 100;
  if (run.crew.includes('CREW_HAMID') || run.crew.includes('CREW_MEILIN')) trade = Math.max(trade, 85);
  if (run.pets.includes('PET_KIRMIZI')) trade = Math.max(trade, 80);
  if (run.pets.includes('PET_GECEYARISI')) type = Math.max(type, 85);
  return { type, trade };
}

/** Bölgesel arz-talep (run başına seed ile): bölge × mal çarpanı */
export function regionDemand(seed, region, goodId) {
  const rng = SeededRNG.derive(seed, 'demand', region, goodId);
  const [lo, hi] = BALANCE.trade.regionDemandRange;
  return lo + rng.next() * (hi - lo);
}

const TYPE_HINTS = {
  fishing: 'Kıyıda balıkçı kayıkları görülmüş',
  trade: 'Ufukta kalabalık bir ticaret limanının dumanları',
  military: 'Kraliyet devriyeleri bu sularda dolaşıyor',
  pirate: 'Kara bayraklı gemiler bu yönden geliyor',
  fog: 'Bu sular sık sık sisle kaplanıyor',
  mystery: 'Denizciler bu yönde tuhaf ışıklar görmüş',
  volcanic: 'Rüzgâr kükürt ve kül kokusu taşıyor',
  ice: 'Sular giderek soğuyor, buz parçaları yüzüyor',
};

/** Limandan ayrılırken önerilen deniz yolları (ziyaret boyunca sabit). */
export function generateLanes(G, idx) {
  const run = G.run;
  const meta = G.meta;
  const total = run.totalHarbors;
  const rng = SeededRNG.derive(run.seed, 'lanes', idx);
  const used = new Set(run.route.map((r) => r.harborId));
  used.add(GRAND_HARBOR_ID);
  const nextIdx = idx + 1;
  const acc = intelAccuracy(G);
  const finalLeg = nextIdx >= total - 1;
  const lanes = [];
  const typeIds = finalLeg ? rng.sample(['trade', 'open', 'coast'], 2) : rng.sample(Object.keys(LANE_TYPES), rng.int(2, 3));
  for (const lt of typeIds) {
    const L = LANE_TYPES[lt];
    let harbor;
    if (finalLeg) harbor = HARBOR_BY_ID[GRAND_HARBOR_ID];
    else {
      const base = regionForPosition(nextIdx, total, rng);
      const region = Math.max(1, Math.min(5, Math.round(base + L.regionShift * rng.next())));
      harbor = pickHarbor(rng, meta, region, used, L.prefer && rng.chance(65) ? L.prefer : null);
      if (!harbor) continue;
      used.add(harbor.id);
    }
    const distance = rng.weighted(Object.entries(L.dist).map(([id, w]) => ({ id, weight: w }))).id;
    const danger = Math.max(1, Math.min(5, Math.round(harbor.region * 0.8 + L.danger + (harbor.type === 'pirate' ? 1 : 0) + (harbor.type === 'mystery' ? 1 : 0) + (distance === 'long' ? 0.5 : 0))));
    const pirates = Math.max(0, Math.min(3, (L.pirates ? 2 : 0) + (harbor.type === 'pirate' ? 1 : 0) + (harbor.region >= 3 ? 1 : 0) - (L.danger < 0 ? 1 : 0)));
    // tip ipucu (yanıltıcı olabilir)
    const typeAcc = L.uncertain ? acc.type - 25 : acc.type;
    const typeTrue = rng.chance(typeAcc);
    const plausible = [...new Set(HARBORS.filter((h) => Math.abs(h.region - harbor.region) <= 1 && !h.final && harborUnlocked(meta, h)).map((h) => h.type))].filter((t) => t !== harbor.type);
    const hintType = finalLeg ? null : typeTrue || !plausible.length ? harbor.type : rng.pick(plausible);
    // ticaret söylentileri: hedef limanda gerçekten yüksek satılan mallar
    const scored = TRADE_GOODS.filter((g) => g.group !== 'special').map((g) => ({ g, m: harborRelativeSell(run.seed, harbor, g.id) })).sort((a, b) => b.m - a.m);
    const rumors = [];
    const n = finalLeg ? 2 : 1 + (rng.chance(40 + (L.rumorBoost || 0)) ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const truthful = rng.chance(acc.trade - (L.uncertain ? 20 : 0));
      const good = truthful ? scored[k].g : rng.pick(scored.slice(6)).g;
      rumors.push({ good: good.id, truthful });
    }
    lanes.push({
      type: lt, harborId: harbor.id, distance, danger, pirates,
      region: harbor.region, hintType, typeTrue, rumors,
      uncertainty: finalLeg ? 0 : L.uncertain ? 3 : typeAcc >= 95 ? 1 : 2,
      final: finalLeg,
    });
  }
  return lanes;
}

/** Bir limanın bir mal için göreli satış çarpanı (söylenti üretimi için) */
export function harborRelativeSell(seed, harbor, goodId) {
  // TradeSystem.harborGoodMult ile aynı sapmaları üretmemek için yalnızca kalıcı etkenler: tip çarpanı × bölgesel talep
  return harborMultBase(harbor.type, goodId) * regionDemand(seed, harbor.region, goodId);
}

function harborMultBase(type, goodId) {
  return HARBOR_PRICE_MULT[type]?.[goodId] ?? 1;
}

export function laneText(lane) {
  const r = REGIONS[lane.region];
  return {
    region: lane.final ? 'Büyük Liman\'ın ışıkları' : `${r.name} sularına doğru`,
    type: lane.hintType ? TYPE_HINTS[lane.hintType] : 'Büyük Liman’ın kuleleri ufukta',
    rumors: lane.rumors.map((x) => `${GOOD_BY_ID[x.good].name} talebi yüksek`),
  };
}

/** "Başka limana yönlen": hedefi aynı bölgeden kullanılmamış bir limanla değiştirir. */
export function rerouteTarget(G, rng) {
  const run = G.run;
  const toIdx = run.idx + 1;
  const cur = HARBOR_BY_ID[run.route[toIdx].harborId];
  if (cur.final) return null;
  const used = new Set(run.route.map((r) => r.harborId));
  const pool = HARBORS.filter((h) => !h.final && !used.has(h.id) && harborUnlocked(G.meta, h) && h.region === cur.region);
  const alt = pool.length ? rng.pick(pool) : null;
  if (!alt) return null;
  run.route[toIdx].harborId = alt.id;
  return alt;
}

export function distanceInfo(id) {
  return BALANCE.route.distances.find((d) => d.id === id);
}

export const DISTANCE_NAMES = { short: 'Kısa', medium: 'Orta', long: 'Uzun' };

/** Seyir süresi (saniye), mesafeye göre seed ile */
export function voyageDuration(seed, idx, distanceId) {
  const [a, b] = BALANCE.voyage.duration[distanceId];
  const rng = SeededRNG.derive(seed, 'dur', idx);
  return Math.round(a + rng.next() * (b - a));
}

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
