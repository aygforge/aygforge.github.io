// Kasaba, rota (şerit) ve olay seçimi üretimi — Tides'ın seed tabanlı rota/olay yaklaşımı.
import { CFG, clamp } from '../config.js';
import { Rng } from '../engine/rng.js';
import { REGIONS, TOWN_TYPES, TOWN_TYPE_BY_REGION, TOWN_NAMES, CAPITAL_NAME, START_NAME, LANE_TYPES, ENDLESS_CONDITIONS } from '../data/world.js';
import { EVENTS, CHAINS, STANDALONE } from '../data/index.js';
import { ITEMS } from '../data/items.js';
import { hasItem, hasUpg } from './state.js';

export function regionFor(run, k) {
  if (k > run.legsTotal) return 1 + ((k - run.legsTotal - 1) % 5);
  return clamp(1 + Math.floor((k * 5) / (run.legsTotal + 1)), 1, 5);
}
// Zorluk için kullanılan bölge: Sonsuz Macera'da daima 5 (aşama çarpanı ayrıca uygulanır)
export const diffRegion = (run, region) => (run.endless ? 5 : region);

export function makeStartTown(run) {
  const t = { id: 'T0', name: START_NAME, type: 'village', region: 1, k: 0 };
  run.towns[t.id] = t; run.route = [t.id]; run.idx = 0;
  return t;
}
function townName(run, rng, region) {
  const used = new Set(Object.values(run.towns).map((t) => t.name));
  const pool = TOWN_NAMES[region].filter((n) => !used.has(n));
  return rng.pick(pool.length ? pool : TOWN_NAMES[region]) + (pool.length ? '' : ' ' + ['II', 'III', 'IV'][rng.int(0, 2)]);
}

// Bir sonraki ayrılış için 2–3 rota üret
export function makeLanes(G, from) {
  const run = G.run, k = from.k + 1;
  const rng = Rng.derive(run.seed, 'lanes', k);
  const region = regionFor(run, k);
  const isCapital = !run.endless && k === run.legsTotal;
  const n = isCapital ? 2 : rng.int(CFG.route.lanes[0], CFG.route.lanes[1]);
  const types = rng.shuffle(Object.keys(LANE_TYPES));
  // Teslimat görevi: hedef türü ulaşılabilir kıl
  const deliv = run.contracts.find((c) => c.type === 'delivery' && !c.done && !c.failed);
  const lanes = [];
  for (let i = 0; i < n; i++) {
    const type = types[i % types.length];
    const dist = rng.weighted(CFG.route.distances);
    let ttype = isCapital ? 'capital' : rng.pick(TOWN_TYPE_BY_REGION[region]);
    if (deliv && i === 0 && !isCapital) ttype = deliv.target;
    const id = 'T' + k + '_' + i;
    const town = { id, name: isCapital ? CAPITAL_NAME : townName(run, rng, region), type: ttype, region, k };
    const danger = clamp((region >= 3 ? 2 : 1) + LANE_TYPES[type].danger + (dist.id === 'long' ? 1 : 0) + rng.int(-1, 1), 1, 5);
    const rumors = makeRumors(rng, type, region);
    lanes.push({ type, distance: dist.id, town, danger, rumors, tod: rng.pick(['day', 'day', 'dusk', 'night']) });
  }
  return lanes;
}
const RUMORS = {
  royal: ['Kraliyet devriyeleri bu yolu sık kullanıyor.', 'Vergi memurlarının yeni bir barikat kurduğu söyleniyor.', 'Yol taş döşeli ve güvenli görünüyor.'],
  forest: ['Ağaçlarda kırmızı işaretler görülmüş.', 'Ormandan kurt ulumaları geliyor.', 'Eski bir sunağın orada olduğu fısıldanıyor.'],
  mountain: ['Geçitte heyelan riski var.', 'Madenciler parlayan taşlardan bahsediyor.', 'Bir trolün köprü bekçiliği yaptığı söyleniyor.'],
  trade: ['Gezgin tüccarlar bu yolda sık mola veriyor.', 'Bir kervanın soyulduğu duyuldu.', 'Yol kenarında seyyar aşçılar var.'],
  wild: ['Bu yolda tuhaf ışıklar görülmüş.', 'Bir falcının arabası bu yöne gitmiş.', 'Konuşan bir ağaçtan söz ediliyor.'],
};
function makeRumors(rng, type, region) { return rng.sample(RUMORS[type], 1).concat(region >= 4 ? ['Sisli ve lanetli topraklardan geçiyor.'] : []); }

export function voyageEventCount(rng, distance) {
  const d = CFG.route.distances.find((x) => x.id === distance);
  return rng.int(d.events[0], d.events[1]);
}

// ——— Olay seçimi ———
function condOk(G, ev, voyage) {
  const c = ev.cond;
  if (!c) return true;
  if (c.night && voyage.tod !== 'night') return false;
  if (c.notItem && hasItem(G.run, c.notItem)) return false;
  return true;
}
export function activeChains(run) { return Object.values(run.chains).filter((c) => c.status === 'active'); }
function eligibleChains(G, region) {
  const run = G.run, legsLeft = run.endless ? 99 : run.legsTotal - run.idx - 1;
  if (activeChains(run).length >= 2) return [];
  return Object.values(CHAINS).filter((c) => !run.chains[c.id] && c.reg.includes(region) && legsLeft >= c.stages.length - 1);
}
export function pickEvent(G, rng, voyage) {
  const run = G.run, region = voyage.region, lane = LANE_TYPES[voyage.lane];
  const cond = run.endless && run.endless.cond ? ENDLESS_CONDITIONS[run.endless.cond] : null;
  const base = CFG.regionWeights[region];
  const recent = new Set(run.recent.slice(-15));
  const cats = Object.keys(base).map((cat) => {
    let w = base[cat] * ((lane.mult || {})[cat] || 1) * (((cond && cond.mult) || {})[cat] || 1);
    if (cat === 'chain') w = eligibleChains(G, region).length ? base.chain * (hasUpg(G.meta, 'U_MAPS') ? 1.3 : 1) : 0;
    return { cat, weight: w };
  });
  if (voyage.forceCat) { const fc = voyage.forceCat; voyage.forceCat = null; const ev = pickInCat(G, rng, fc, region, voyage, recent); if (ev) return ev; }
  for (let tries = 0; tries < 6; tries++) {
    const c = rng.weighted(cats);
    if (!c) break;
    if (c.cat === 'chain') {
      const ch = rng.pick(eligibleChains(G, region));
      if (ch) return ch.stages[0];
      c.weight = 0; continue;
    }
    const ev = pickInCat(G, rng, c.cat, region, voyage, recent);
    if (ev) return ev;
    c.weight = 0;
  }
  // Son çare: bölgedeki herhangi bir olay
  const any = STANDALONE.filter((e) => e.reg.includes(region) && condOk(G, e, voyage) && !recent.has(e.id));
  return (rng.pick(any.length ? any : STANDALONE.filter((e) => !recent.has(e.id))) || STANDALONE[0]).id;
}
function pickInCat(G, rng, cat, region, voyage, recent) {
  const run = G.run;
  let pool = STANDALONE.filter((e) => e.cat === cat && e.reg.includes(region) && condOk(G, e, voyage) && !recent.has(e.id));
  const unseen = pool.filter((e) => !run.seen[e.id]);
  if (unseen.length) pool = unseen;
  if (!pool.length) return null;
  const ev = rng.weighted(pool, (e) => (e.lanes && e.lanes[voyage.lane]) || 1);
  return ev && ev.id;
}

// ——— Dükkân stokları ———
export function shopStock(G, town) {
  const run = G.run, rng = Rng.derive(run.seed, 'shop', town.id);
  const T = TOWN_TYPES[town.type], tier = Math.min(5, town.region + (T.stock ? 1 : 0));
  const huntBonus = hasUpg(G.meta, 'U_HUNTER') ? 1 : 0;
  const gear = Object.values(ITEMS).filter((i) => (i.slot === 'weapon' || i.slot === 'armor') && i.tier <= tier && i.rarity !== 'legendary');
  const legend = Object.values(ITEMS).filter((i) => (i.slot === 'weapon' || i.slot === 'armor') && i.rarity === 'legendary' && i.tier <= tier);
  const smith = rng.sample(gear, T.stock ? 5 : 4).map((i) => i.id);
  if (legend.length && town.region >= 4 && rng.chance(25 + huntBonus * 10)) smith.push(rng.pick(legend).id);
  const cons = Object.values(ITEMS).filter((i) => i.kind === 'cons' && i.tier <= tier).map((i) => i.id);
  const accs = Object.values(ITEMS).filter((i) => i.slot === 'acc' && i.tier <= tier && i.rarity !== 'legendary').map((i) => i.id);
  const market = rng.sample(cons, T.stock ? 6 : 5);
  if (rng.chance(45)) market.push(rng.pick(accs));
  if (town.type === 'capital' || (town.type === 'city' && rng.chance(30))) market.push('X_EYE');
  // yerel koşul: fiyat dalgalanması
  const local = rng.range(0.92, 1.12);
  return { smith: [...new Set(smith)], market: [...new Set(market)], local };
}
