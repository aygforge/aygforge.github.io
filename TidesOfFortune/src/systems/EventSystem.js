/*
 * EventSystem — Tides of Fortune'un kalbi.
 *
 * EVENT DSL
 *  { id, cat, title, tier, regions?, weight?, tags[], cond?, art, text, chain?, step?, auto?[], options[] }
 *  cond (havuza girme koşulu): { crew, notCrew, pet, destTypeNot, volcanicNear }
 *  auto: [{ when, text, fx }] — koşul sağlanırsa event otomatik çözülür (tayfa/hayvan "otomatik engeller").
 *  option: {
 *    label, icon, hint?, tags?[] (escape|combat|negotiate|navigate|explore|reckless|pass|smuggle|loot|brave),
 *    req?: { item, crew, crewAny[], pet, cargoFree, cargoGood, cargoGoods[], chainFree },
 *    show?: when  — sağlanmazsa seçenek hiç listelenmez,
 *    cost?: { gold }, consume?: itemId, chance?: base%, bonus?: [{item|crew|pet|flag, add}],
 *    cases?: [{ when, text, fx }] — başarı durumunda koşula bağlı özel sonuç,
 *    win: {text, fx} | [{w, text, fx, rotten?}], lose?: {text, fx}
 *  }
 *  when: { crew, pet, item, flag, cargoGood, noCargoGood, crewAvailable, all[], any[] }
 *  fx: hull, hullRaw, repairFull, gold, goldR, xp, xpExplore, cargoLoss(%), cargoSpoil(n), cargoAdd, cargoRemove,
 *      cargoRemoveQty, cargoEat[], confiscate(%), item('ID'|'rare'|'random'), loseItem, crewOffer, crewJoin,
 *      crewRemove, pet, petChance, special, skip, extra, extraChance, lucky, luckBuff, status, reroute,
 *      next/nextAt, startChain, endChain, flag, spawnNextRoute, reveal, fixSpoiled, codexHarbor, codexNote,
 *      routeEvents, warnOff, fortunePenalty, trade, shop, ach, explosionRisk
 */
import * as X1 from './X1System.js';
import { BALANCE } from '../config/balance.js';
import { EVENT_BY_ID, POOL_EVENTS, CHAINS, PET_DECK_EVENTS } from '../data/events.js';
import { ITEM_BY_ID, ITEMS } from '../data/items.js';
import { CREW_BY_ID } from '../data/crew.js';
import { PET_BY_ID } from '../data/pets.js';
import { GOOD_BY_ID, TRADE_GOODS } from '../data/goods.js';
import { HARBOR_BY_ID, HARBORS } from '../data/harbors.js';
import { SeededRNG } from '../core/SeededRNG.js';
import { hasUpgrade } from '../core/GameState.js';
import { hullCategory, escapePenalty, changeHull, maxHull, cargoFree, itemSlots, crewSlots } from './ShipSystem.js';
import { hasCrew, hasPet, hasItem, crewSkillMult, tarcinMult, crewCandidates, addCrew, dismissCrew, crewAvailableForRun } from './CrewSystem.js';
import { addPet, isOldFriendsPair, scheduleSecondEncounter } from './PetSystem.js';
import { addItem, consumeItem, randomItemFor, wearItem } from './ItemSystem.js';
import { removeRandomUnits, splitSpoil, addCargo, cargoUnitsOf, addContractLot } from './TradeSystem.js';
import { routeEventCount, rerouteTarget } from './RouteSystem.js';
import { addXp, unlockAchievement } from './ProgressionSystem.js';

export const STATUS_NAMES = {
  contraband: 'Kaçak statüsü (fiyatlar %20 pahalı)',
  fine: 'Fiyat cezası (satışlar %20 düşük)',
  hero: 'Kahraman statüsü (fiyatlar %20 ucuz)',
  damaged: 'Hasarlı liman (stoklar %50)',
  boom: 'Fiyat avantajı (satışlar +%15)',
  pirateRep: 'Korsan itibarı +1',
};

// ───────────────────────── Koşullar ─────────────────────────

export function chainFlags(run, ev) {
  const cf = (ev && ev.chain && run.chains[ev.chain]?.flags) || {};
  const mem = run.x1?.mem?.flags;
  return mem ? { ...mem, ...cf } : cf;
}

export function checkWhen(G, when, flags = {}) {
  if (!when) return true;
  const run = G.run;
  if (when.all) return when.all.every((w) => checkWhen(G, w, flags));
  if (when.any) return when.any.some((w) => checkWhen(G, w, flags));
  if (when.crew && !hasCrew(G, when.crew)) return false;
  if (when.noCrew && hasCrew(G, when.noCrew)) return false;
  if (when.upgrade && !hasUpgrade(G.meta, when.upgrade)) return false;
  if (when.contract && !(run.x1?.contracts || []).some((c) => c.type === when.contract)) return false;
  if (when.pet && !hasPet(G, when.pet)) return false;
  if (when.item && !hasItem(G, when.item)) return false;
  if (when.flag && !flags[when.flag]) return false;
  if (when.cargoGood && cargoUnitsOf(run, when.cargoGood) <= 0) return false;
  if (when.noCargoGood && cargoUnitsOf(run, when.noCargoGood) > 0) return false;
  if (when.crewAvailable && !crewAvailableForRun(G, when.crewAvailable)) return false;
  return true;
}

function condOk(G, cond, ctx) {
  if (!cond) return true;
  if (cond.crew && !hasCrew(G, cond.crew)) return false;
  if (cond.notCrew && hasCrew(G, cond.notCrew)) return false;
  if (cond.pet && !hasPet(G, cond.pet)) return false;
  if (cond.destTypeNot && ctx.dest && ctx.dest.type === cond.destTypeNot) return false;
  if (cond.volcanicNear && !(ctx.region >= 5 || ctx.dest?.type === 'volcanic' || ctx.origin?.type === 'volcanic')) return false;
  return true;
}

// ───────────────────────── Ağırlıklar ve kuyruk ─────────────────────────

export function categoryWeights(G, region, dest, { fortunePenalty = 0 } = {}) {
  const w = { ...BALANCE.regionWeights[region] };
  w.repair = BALANCE.repairWeightBase;
  const cat = hullCategory(G);
  if (cat === 'critical' || cat === 'sinking') {
    w.repair += BALANCE.repairWeightCriticalBonus;
    w.danger = Math.max(0, w.danger - BALANCE.dangerWeightCriticalPenalty);
  }
  if (hasPet(G, 'PET_ZIPIR')) w.fortune += isOldFriendsPair(G.run) ? BALANCE.zipirOldFriendsFortuneBonus : BALANCE.zipirFortuneBonus;
  if (dest && dest.type === 'mystery') w.danger += BALANCE.mysteryIslandDangerBonus;
  if (fortunePenalty) w.fortune = Math.max(0, w.fortune - fortunePenalty);
  // Seçilen deniz yolunun tehlikesi (rework)
  if (G.run.laneDanger) w.danger += Math.max(0, G.run.laneDanger - 2) * BALANCE.lanes.dangerWeightPerLevel;
  // Aziz Mehmed: askerî liman ve ticaret şehrine giden rotalarda olumsuz event çıkmaz.
  X1.adjustWeights(G, w); // Sonsuz Deniz: Deniz Koşulu
  if (hasCrew(G, 'CREW_MEHMED') && dest && (dest.type === 'military' || dest.type === 'trade')) {
    w.danger = 0;
    w.disaster = 0;
  }
  return w;
}

function routeCtx(G, toIdx) {
  const run = G.run;
  const dest = HARBOR_BY_ID[run.route[toIdx].harborId];
  const origin = HARBOR_BY_ID[run.route[Math.max(0, toIdx - 1)].harborId];
  return { dest, origin, region: dest.region };
}

function eventEligible(G, ev, ctx, exclude) {
  if (ev.pool === false) return false;
  if (ev.minCrew && G.run.crew.length < ev.minCrew) return false;
  if (ev.minCargo && G.run.cargo.reduce((s, l) => s + (l.contract ? 0 : l.qty), 0) < ev.minCargo) return false;
  if (ev.regions && !ev.regions.includes(ctx.region)) return false;
  if (ev.chain && G.run.chains[ev.chain]) return false;
  if (!condOk(G, ev.cond, ctx)) return false;
  if (exclude.has(ev.id)) return false;
  return true;
}

function pickEvent(G, rng, cat, ctx, exclude) {
  const seen = new Set(G.run.seenEvents);
  const all = POOL_EVENTS.filter((e) => e.cat === cat && eventEligible(G, e, ctx, exclude));
  let cands = all.filter((e) => !seen.has(e.id));
  if (!cands.length) cands = all; // havuz tükendiyse tekrar serbest
  if (!cands.length) return null;
  const ev = rng.weighted(cands, (e) => {
    let w = e.weight ?? 10;
    if (e.weightBoost && ctx.dest?.type === e.weightBoost.destType) w *= e.weightBoost.mult;
    if (e.memBoost && G.run.x1?.mem?.flags?.[e.memBoost.flag]) w *= e.memBoost.mult;
    return w * X1.eventWeightMult(G, e);
  });
  return ev ? { id: ev.id, src: 'normal' } : null;
}

function pickChainStart(G, rng, ctx, exclude) {
  const cands = Object.values(CHAINS).filter(
    (c) => c.pool && !G.run.chains[c.id] && c.regions.includes(ctx.region) && condOk(G, c.cond, ctx) && !exclude.has(c.start) && X1.chainStartAllowed(G, c, G.run.idx + 1),
  );
  if (!cands.length) return null;
  const c = rng.weighted(cands, (q) => (q.memBoost && G.run.x1?.mem?.flags?.[q.memBoost] ? 3 : 1));
  G.run.chains[c.id] = { status: 'queued', flags: {}, step: 0 };
  return { id: c.start, src: 'chain', chain: c.id };
}

export function genSlot(G, rng, ctx, exclude, { cat = null, fortunePenalty = 0, noChain = false } = {}) {
  const weights = categoryWeights(G, ctx.region, ctx.dest, { fortunePenalty });
  if (noChain) weights.chain = 0;
  const entries = Object.entries(weights).map(([k, v]) => ({ k, weight: v }));
  for (let attempt = 0; attempt < 8; attempt++) {
    const chosen = cat && attempt === 0 ? cat : rng.weighted(entries)?.k;
    if (!chosen) break;
    const e = chosen === 'chain' ? pickChainStart(G, rng, ctx, exclude) : pickEvent(G, rng, chosen, ctx, exclude);
    if (e) return e;
    const ix = entries.findIndex((x) => x.k === chosen);
    if (ix >= 0) entries[ix].weight = 0;
  }
  return pickEvent(G, rng, 'fortune', ctx, new Set()) || { id: 'EVT_M_05', src: 'normal' };
}

/** Limandan ayrılırken rota event kuyruğunu üretir. */
export function buildVoyage(G) {
  const run = G.run;
  const fromIdx = run.idx;
  const toIdx = fromIdx + 1;
  const ctx = routeCtx(G, toIdx);
  const rng = SeededRNG.derive(run.seed, 'queue', fromIdx, run.route[toIdx].harborId, run.crew.join(','), hullCategory(G));
  const { n, mods } = routeEventCount(G, rng, run.route[fromIdx].distance, ctx.dest);
  run.buffs.nextRouteEvents = 0;
  const queue = [];
  for (const p of run.pendingRoute) queue.push({ ...p });
  run.pendingRoute = [];
  const exclude = new Set(queue.map((q) => q.id));
  let chainStarted = queue.some((q) => q.src === 'chain');
  for (let i = 0; i < n; i++) {
    const e = genSlot(G, rng, ctx, exclude, { noChain: chainStarted });
    if (e.src === 'chain') chainStarted = true;
    queue.push(e);
    exclude.add(e.id);
  }
  // Zıpır/Tarçın ikinci karşılaşması: ilgili hayvan gemideyken kesin enjekte edilir.
  const sp = run.special;
  if (sp.stage === 'awaitingSecond' && sp.secondDueAt != null && toIdx >= sp.secondDueAt) {
    const need = sp.secondPet === 'PET_ZIPIR' ? 'PET_TARCIN' : 'PET_ZIPIR';
    if (hasPet(G, need)) {
      const id = sp.secondPet === 'PET_ZIPIR' ? 'EVT_SPECIAL_ZIPIR_ALONE' : 'EVT_SPECIAL_TARCIN_ALONE';
      const pos = rng.int(Math.min(1, queue.length), queue.length);
      queue.splice(pos, 0, { id, src: 'special' });
      sp.stage = 'secondQueued';
    } else sp.stage = 'cancelled';
  }
  // X1: sözleşme karşılaşması / hikâye yankısı normal bir slotun yerini alır (olay yoğunluğu artmaz)
  const replaceSlot = (entry) => {
    const ix = queue.findIndex((q, i) => q.src === 'normal' && i > 0);
    if (ix >= 0) queue[ix] = entry;
    else if (queue.length) queue.splice(queue.length, 0, entry);
    else queue.push(entry);
  };
  const ce = X1.contractVoyageEntry(G);
  if (ce) replaceSlot(ce);
  else {
    const echo = pickEcho(G, rng);
    if (echo) replaceSlot(echo);
  }
  // Hayvanlara özel gemi içi olay: gemideki hayvan(lar)a uygun, bu run'da görülmemiş olanlardan biri
  const pdeck = pickPetDeckEvent(G, rng);
  if (pdeck) replaceSlot(pdeck);
  if (hasPet(G, 'PET_CUCE') && rng.next() < BALANCE.pets.monkeyTheftChance) {
    queue.splice(rng.int(0, queue.length), 0, { id: 'EVT_PET_MONKEY', src: 'pet' });
  }
  const hintIdx = hasPet(G, 'PET_GECEYARISI') && queue.length ? rng.int(0, queue.length - 1) : null;
  run.voyage = {
    fromIdx, toIdx, distance: run.route[fromIdx].distance,
    queue, pos: 0, current: null, revealBonus: 0, warnOff: false, fortunePenalty: 0, mods, hintIdx,
    showShadow: run.special.stage === 'skipped' && !run.special.shadowShown,
  };
  if (run.voyage.showShadow) run.special.shadowShown = true;
  return run.voyage;
}

function petDeckOk(G, ev) {
  return (!ev.cond?.pet || hasPet(G, ev.cond.pet)) && (!ev.cond2?.pet || hasPet(G, ev.cond2.pet));
}
function pickPetDeckEvent(G, rng) {
  const run = G.run;
  if (!run.pets.length || !rng.chance(BALANCE.pets.deckEventChance)) return null;
  run.petDeckSeen = run.petDeckSeen || [];
  let pool = PET_DECK_EVENTS.filter((e) => petDeckOk(G, e) && !run.petDeckSeen.includes(e.id));
  if (!pool.length) return null;
  // Eski Dostlar ikilisi gemideyse onların ortak sahnesi öncelikli
  const duo = pool.find((e) => e.cond2);
  const ev = duo && rng.chance(60) ? duo : rng.pick(pool);
  run.petDeckSeen.push(ev.id);
  return { id: ev.id, src: 'pet' };
}

/** Ekranda gösterilecek önceden bilinen eventler (Deniz Haritası, Compass Rose, ipuçları) */
/** Hikâye Yankısı: önceki run'larda finali görülen zincirin izleri (run başına her yankı bir kez, %20) */
function pickEcho(G, rng) {
  const run = G.run;
  const shown = run.x1.echoesShown;
  const avail = Object.keys(G.meta.x1?.finals || {}).filter((ch) => (G.meta.x1.finals[ch] || []).length && !shown.includes(ch) && EVENT_BY_ID[`EVT_X1_ECHO_${ch.replace('CH_X1_', '')}`]);
  if (!avail.length || !rng.chance(20)) return null;
  const ch = rng.pick(avail);
  shown.push(ch);
  return { id: `EVT_X1_ECHO_${ch.replace('CH_X1_', '')}`, src: 'echo' };
}

export function revealCount(G) {
  const v = G.run.voyage;
  let n = 0;
  if (hasItem(G, 'ITEM_SEA_CHART')) n = Math.max(n, 2);
  if (hasCrew(G, 'CREW_COMPASS')) n = Math.max(n, 2);
  if (hasPet(G, 'PET_MARTI')) n = Math.max(n, 1);
  if (v) n = Math.max(n, v.revealBonus || 0);
  return n;
}

export function upcoming(G, count) {
  const v = G.run.voyage;
  if (!v) return [];
  return v.queue.slice(v.pos, v.pos + count).map((q) => ({ ...q, ev: EVENT_BY_ID[q.id] }));
}

/** Tarçın'ın Erken Uyarısı: tehlike eventi yaklaşırken havlar (Eski Dostlar ile iki event önceden). */
export function tarcinWarning(G) {
  const v = G.run.voyage;
  if (!v || !hasPet(G, 'PET_TARCIN') || v.warnOff) return null;
  const range = isOldFriendsPair(G.run) ? 2 : 1;
  for (let i = 0; i < range; i++) {
    const q = v.queue[v.pos + i];
    if (!q) break;
    const ev = EVENT_BY_ID[q.id];
    if (ev && (ev.cat === 'danger' || ev.cat === 'disaster')) return { ahead: i + 1, ev };
  }
  return null;
}

export function disasterAhead(G) {
  const v = G.run.voyage;
  if (!v) return false;
  const q = v.queue[v.pos];
  return !!q && EVENT_BY_ID[q.id]?.cat === 'disaster';
}

// ───────────────────────── Tetikleme ─────────────────────────

function validAtTrigger(G, ev, entry) {
  const run = G.run;
  if (!ev) return false;
  if (ev.id === 'EVT_SPECIAL_ZIPIR_ALONE' && !hasPet(G, 'PET_TARCIN')) return false;
  if (ev.id === 'EVT_SPECIAL_TARCIN_ALONE' && !hasPet(G, 'PET_ZIPIR')) return false;
  if (ev.id === 'EVT_PET_MONKEY' && !hasPet(G, 'PET_CUCE')) return false;
  if (ev.minCrew && run.crew.length < ev.minCrew) return false;
  if (ev.minCargo && run.cargo.reduce((s, l) => s + (l.contract ? 0 : l.qty), 0) < ev.minCargo) return false;
  if (ev.cond) {
    // Kuyruk üretildikten sonra değişebilecek koşullar (tayfa/hayvan) tetiklenirken yeniden kontrol edilir.
    const c = ev.cond;
    if (c.crew && !hasCrew(G, c.crew)) return false;
    if (c.pet && !hasPet(G, c.pet)) return false;
    if (ev.cond2?.pet && !hasPet(G, ev.cond2.pet)) return false;
    if (c.notCrew && hasCrew(G, c.notCrew)) return false;
  }
  if (ev.chain && run.chains[ev.chain]?.status === 'done') return false;
  if (entry?.contract && !run.x1?.contracts?.some((c) => c.id === entry.contract)) return false;
  if (ev.needCrew && !hasCrew(G, ev.needCrew) && !ev.altClose) return false;
  return true;
}

/**
 * host: run.voyage veya run.arrival — { queue, pos, current }
 * Bir sonraki eventi aktif eder. Kuyruk bittiyse null döner.
 */
export function triggerNext(G, host, rng, ctx) {
  const run = G.run;
  if (host.current) return host.current;
  while (host.pos < host.queue.length) {
    let entry = host.queue[host.pos];
    host.pos++;
    if (run.buffs.lucky && entry.src === 'normal') {
      const rep = pickEvent(G, rng, 'fortune', ctx, new Set(host.queue.slice(host.pos).map((q) => q.id)));
      if (rep) {
        entry = { ...rep, lucky: true };
        host.queue[host.pos - 1] = entry;
      }
      run.buffs.lucky = false;
    }
    const ev = EVENT_BY_ID[entry.id];
    if (!validAtTrigger(G, ev, entry)) {
      if (ev?.chain && run.chains[ev.chain] && run.chains[ev.chain].status !== 'done') run.chains[ev.chain].status = 'done';
      if (ev?.cat === 'special' && run.special.stage === 'secondQueued') run.special.stage = 'cancelled';
      continue;
    }
    host.current = { id: ev.id, src: entry.src, lucky: !!entry.lucky, result: null };
    if (!run.seenEvents.includes(ev.id)) run.seenEvents.push(ev.id);
    G.meta.codex.events[ev.chain && ev.step > 1 ? CHAINS[ev.chain].start : ev.id] = true;
    X1.checkStoryHunter(G, unlockAchievement);
    if (ev.cat === 'mystery' && run.x1) run.x1.mysteryHinted = true;
    if (ev.chain) {
      const cs = (run.chains[ev.chain] ||= { status: 'active', flags: {}, step: 0 });
      cs.status = 'active';
      cs.step = ev.step || 1;
      cs.node = ev.id;
    }
    if (run.buffs.luck) {
      run.buffs.luck.events -= 1;
      host.current.luck = run.buffs.luck.add;
      if (run.buffs.luck.events <= 0) run.buffs.luck = null;
    }
    const auto = (ev.auto || []).find((a) => checkWhen(G, a.when, chainFlags(run, ev)));
    if (auto) resolveAuto(G, host, ev, auto, rng, ctx);
    return host.current;
  }
  return null;
}

// ───────────────────────── Seçenekler ─────────────────────────

const INJECTED = {
  __tarcin: {
    label: "Tarçın'ın Uyarısı", icon: 'dog', chance: BALANCE.pets.tarcinWarnBaseChance, tarcin: true, tags: ['tarcin'],
    hint: 'Tarçın tehlikeyi önceden sezdi: +1 seçenek',
    win: { text: `Tarçın tehlikeyi herkesten önce sezmişti. Havlamasıyla erkenden önlem aldınız ve olay zararsız atlatıldı.`, fx: { xp: 5 } },
    lose: { text: `Tarçın havladı ama önlem almak için geç kalmıştınız. Yine de hasar sınırlı kaldı.`, fx: { hull: -10 } },
  },
  __parrot: {
    label: 'Papağan Fısıltısı', icon: 'parrot', chance: 75, tags: ['negotiate'],
    hint: 'Kaptan Kırmızı karşı tarafın sırlarını taklit eder',
    win: { text: `Kaptan Kırmızı karşı tarafın gizli fiyatlarını taklit edip ele verdi; pazarlıkta üstün geldin.`, fx: { goldR: 50 } },
    lose: { text: `Kaptan Kırmızı yanlış anda "Rum iç!" diye bağırdı. Herkes güldü ama kimse ikna olmadı.`, fx: {} },
  },
  __midnight: {
    label: "Gece Yarısı'na Sor", icon: 'parrot', tags: ['explore'],
    hint: 'Kahin papağan güvenli yolu gösterir',
    win: { text: `Gece Yarısı kanat çırpıp doğru yolu gösterdi. Tehlikeye bulaşmadan sırrın bir kısmını çözdün.`, fx: { xpExplore: 15, goldR: 30 } },
  },
  __hamid: {
    label: 'Hamid pazarlık etsin', icon: 'beads', chance: 80, tags: ['negotiate'],
    hint: 'Hamid: ekstra pazarlık seçeneği',
    win: { text: `Hamid tespihini çevirerek pazarlığa girdi ve karşı tarafı ikna etti.`, fx: { goldR: 60, xp: 5 } },
    lose: { text: `Bu sefer Hamid bile pazarlığı kazanamadı.`, fx: {} },
  },
};

// X1: itibar ve Dünya Hafızası ile açılan seçenekler
const INJECTED_X1 = {
  __crown: { label: 'Muhafızları çağır', icon: 'crown', tags: ['pass'], hint: 'Muhafızlar +3: run başına bir kez askerî yardım',
    win: { text: `İşaret fişeğin göğe yükseldi. Ufuktan bir kraliyet savaş gemisi çıktı; korsanlar yelkenlerini çevirip kaçtı.`, fx: { x1: { once: 'crownHelp' } } } },
  __redTalk: { label: 'Kızıl Yelken işaretini göster', icon: 'flag', chance: 65, tags: ['negotiate'], hint: 'Kızıl Yelken itibarı ile müzakere',
    win: { text: `Korsanlar Kardeşliğin işaretini tanıdı. Selamlaşıp yollarına devam ettiler.`, fx: {} },
    lose: { text: `İşaret onları yumuşattı ama yine de küçük bir "hediye" istediler.`, fx: { gold: -40 } } },
  __redSafe: { label: 'Kardeşlik parolası', icon: 'flag', tags: ['pass'], hint: 'Kızıl Yelken +3: run başına bir kez güvenli müzakere',
    win: { text: `Parolayı fısıldadın. Korsan kaptan şapkasını çıkardı: "Kardeşliğin dostu, bizim dostumuzdur."`, fx: { x1: { once: 'redSafe' } } } },
  __redAlly: { label: "Kızıl Kaptan'ın eskortu", icon: 'flag', tags: ['pass'], hint: 'İttifak: run içinde bir kez korsan eskortu',
    win: { text: `Kırmızı yelkenler ufukta belirdi. Kızıl Kaptan'ın gemisi yanına geldi; saldırganlar onu görünce yollarını değiştirdi.`, fx: { x1: { once: 'redAlly' } } } },
  __guild: { label: 'Lonca özel teklifi', icon: 'compass', hint: 'Lonca +3: run başına bir kez özel ticaret',
    win: { text: `Altın Pusula Loncası'nın mührünü gören tüccar sana yalnızca loncanın en güvendiklerine yaptığı teklifi sundu.`, fx: { trade: 'friendly', x1: { once: 'guildOffer' } } } },
  __eye: { label: 'Gözün işaretini izle', icon: 'eye', tags: ['explore'], hint: 'Karanlıktaki Dev Göz bir iz bırakmıştı',
    win: { text: `Dev gözün suya çizdiği iz, gizemin kalbine giden yolu gösterdi.`, fx: { xpExplore: 15, goldR: 40, x1: { unmem: ['eyeSeen'] } } } },
  __zipir: { label: "Zıpır'ın sezgisi", icon: 'cat', tags: ['pass'], hint: 'Zıpır tehlikeyi önceden fark etmişti',
    win: { text: `Zıpır güvertenin tam ortasına oturmuştu; erkenden önlem aldınız ve tehlike zararsız geçti.`, fx: { xp: 5, x1: { unmem: ['zipirWarn'] } } } },
};
export { INJECTED_X1 };

export function getOptions(G, host) {
  const run = G.run;
  const cur = host.current;
  if (!cur) return [];
  const ev = EVENT_BY_ID[cur.id];
  const flags = chainFlags(run, ev);
  const list = [];
  ev.options.forEach((o, i) => {
    if (o.show && !checkWhen(G, o.show, flags)) return;
    list.push({ key: `o${i}`, opt: o });
  });
  const v = run.voyage;
  const warnOff = v && host === v ? v.warnOff : false;
  if (ev.cat === 'danger' && hasPet(G, 'PET_TARCIN') && !warnOff && !ev.auto?.some((a) => checkWhen(G, a.when, flags))) list.push({ key: '__tarcin', opt: INJECTED.__tarcin, injected: true });
  if (ev.tags?.includes('trade') && hasPet(G, 'PET_KIRMIZI')) list.push({ key: '__parrot', opt: INJECTED.__parrot, injected: true });
  if (ev.cat === 'mystery' && hasPet(G, 'PET_GECEYARISI') && !ev.chain) list.push({ key: '__midnight', opt: INJECTED.__midnight, injected: true });
  if (ev.tags?.includes('trade') && hasCrew(G, 'CREW_HAMID') && ev.cat !== 'chain') list.push({ key: '__hamid', opt: INJECTED.__hamid, injected: true });
  // X1 enjekte seçenekler
  const x1 = run.x1;
  if (x1) {
    const pirateEv = (ev.tags || []).includes('pirate') && (ev.cat === 'danger' || ev.cat === 'disaster' || ev.cat === 'chain');
    if (pirateEv && X1.rep(run, 'crown') >= 3 && !x1.once.crownHelp) list.push({ key: '__crown', opt: INJECTED_X1.__crown, injected: true });
    if (pirateEv && x1.mem.flags.redAlly && !x1.once.redAlly) list.push({ key: '__redAlly', opt: INJECTED_X1.__redAlly, injected: true });
    if (pirateEv && (X1.rep(run, 'red') >= 3 || x1.mem.flags.redPeace) && !x1.once.redSafe) list.push({ key: '__redSafe', opt: INJECTED_X1.__redSafe, injected: true });
    else if (pirateEv && X1.rep(run, 'red') >= 1) list.push({ key: '__redTalk', opt: INJECTED_X1.__redTalk, injected: true });
    if ((ev.tags || []).includes('trade') && ev.cat === 'fortune' && X1.rep(run, 'guild') >= 3 && !x1.once.guildOffer) list.push({ key: '__guild', opt: INJECTED_X1.__guild, injected: true });
    if (ev.cat === 'mystery' && !ev.chain && x1.mem.flags.eyeSeen) list.push({ key: '__eye', opt: INJECTED_X1.__eye, injected: true });
    if ((ev.cat === 'danger' || ev.cat === 'disaster') && x1.mem.flags.zipirWarn && hasPet(G, 'PET_ZIPIR')) list.push({ key: '__zipir', opt: INJECTED_X1.__zipir, injected: true });
  }
  return list.map((x) => ({ ...x, view: evalOption(G, ev, x.opt, flags, cur) }));
}

function reqItems(o) {
  const r = o.req || {};
  const ids = [];
  if (r.item) ids.push(r.item);
  if (o.consume && !ids.includes(o.consume)) ids.push(o.consume);
  return ids;
}

export function evalOption(G, ev, o, flags = {}, cur = null) {
  const run = G.run;
  const r = o.req || {};
  const reasons = [];
  if (r.item && !hasItem(G, r.item)) reasons.push(`Gerekli item: ${ITEM_BY_ID[r.item].name}`);
  if (r.crew && !hasCrew(G, r.crew)) reasons.push(`Gerekli tayfa: ${CREW_BY_ID[r.crew].name}`);
  if (r.crewAny && !r.crewAny.some((c) => hasCrew(G, c))) reasons.push(`Gerekli tayfa: ${r.crewAny.map((c) => CREW_BY_ID[c].name).join(' veya ')}`);
  if (r.pet && !hasPet(G, r.pet)) reasons.push(`Gerekli hayvan: ${PET_BY_ID[r.pet].name}`);
  if (r.cargoFree && cargoFree(G) < r.cargoFree) reasons.push(`Kargoda ${r.cargoFree} boş yer gerekli`);
  if (r.cargoGood && cargoUnitsOf(run, r.cargoGood) <= 0) reasons.push(`Kargoda ${GOOD_BY_ID[r.cargoGood].name} yok`);
  if (r.cargoGoods && !r.cargoGoods.some((g) => cargoUnitsOf(run, g) > 0)) reasons.push('Kargoda uygun erzak yok');
  if (r.chainFree && run.chains[r.chainFree]) reasons.push('Bu zincir bu run\'da zaten yaşandı');
  const cost = o.cost?.gold || 0;
  if (cost && run.gold < cost) reasons.push(`Yetersiz altın (${cost} gerekli)`);

  let chance = null;
  const breakdown = [];
  if (o.chance != null) {
    const base = o.chance;
    let c = base;
    breakdown.push({ label: 'Temel', v: base });
    const cm = crewSkillMult(G);
    const add = (label, v) => {
      v = Math.round(v);
      if (!v) return;
      c += v;
      breakdown.push({ label, v });
    };
    const tags = o.tags || [];
    const etags = ev.tags || [];
    const explicit = o.bonus || [];
    const explicitIds = new Set(explicit.map((b) => b.item || b.crew || b.pet || b.flag));
    for (const b of explicit) {
      if (b.item && hasItem(G, b.item)) add(ITEM_BY_ID[b.item].name, b.add);
      if (b.crew && hasCrew(G, b.crew)) add(CREW_BY_ID[b.crew].name, b.add * cm);
      if (b.pet && hasPet(G, b.pet)) add(PET_BY_ID[b.pet].name, b.add);
      if (b.flag && flags[b.flag]) add('Önceki kararın', b.add);
    }
    const reqCrew = r.crew;
    const pirate = etags.includes('pirate');
    if (tags.includes('escape')) {
      const pen = escapePenalty(G);
      if (pen) add('Gemi hasarı', -pen);
      if (!explicitIds.has('ITEM_LIGHT_SAIL') && hasItem(G, 'ITEM_LIGHT_SAIL')) add('Hafif Yelken', 40);
      if (pirate && hasPet(G, 'PET_KIRMIZI')) add('Kaptan Kırmızı', 15);
      if ((etags.includes('storm') || etags.includes('wave')) && hasUpgrade(G.meta, 'UPG_STORM_SENSE')) add('Fırtına Sezgisi', 10);
    }
    if (tags.includes('navigate') && !explicitIds.has('ITEM_SEXTANT') && hasItem(G, 'ITEM_SEXTANT')) add('Sekstant', 30);
    // Yeni hayvanlar
    if (tags.includes('escape') && hasPet(G, 'PET_AHTAPOT')) add('Mürekkep', 10);
    if ((etags.includes('wreck') || etags.includes('deep') || tags.includes('dive') || /\bdal/i.test(o.label || '')) && hasPet(G, 'PET_AHTAPOT')) add('Mürekkep (dalış)', 15);
    if (etags.includes('fish') && hasPet(G, 'PET_MARTI')) add('Kaşif', 15);
    if (ev.cat === 'mystery' && hasPet(G, 'PET_KAPLUMBAGA')) add('Bilge', 10);
    if (hasCrew(G, 'CREW_BJORN') && reqCrew !== 'CREW_BJORN' && !explicitIds.has('CREW_BJORN')) {
      if (pirate && (tags.includes('combat') || tags.includes('escape'))) add('Bjorn', 25 * cm);
      else if (tags.includes('combat')) add('Bjorn', 15 * cm);
    }
    if (tags.includes('combat') && pirate && hasCrew(G, 'CREW_YARA')) add('Yara', 15 * cm);
    if (tags.includes('combat') && hasCrew(G, 'CREW_OKSANA')) add('Oksana', 10 * cm);
    if (tags.includes('combat') && r.item === 'ITEM_CANNON' && hasCrew(G, 'CREW_LENA')) add('Lena', 10 * cm);
    if (tags.includes('negotiate') && pirate && hasCrew(G, 'CREW_DIEGO') && reqCrew !== 'CREW_DIEGO') add('Diego', 30 * cm);
    if ((etags.includes('fog') || etags.includes('night')) && hasCrew(G, 'CREW_TOBIAS') && !explicitIds.has('CREW_TOBIAS')) add('Tobias', 20 * cm);
    if ((etags.includes('fog') || etags.includes('rocks')) && hasCrew(G, 'CREW_FINN') && !tags.includes('pass')) add('Old Finn', (100 - base) * 0.35 * cm);
    if (etags.includes('pursuit') && hasCrew(G, 'CREW_OKSANA') && !explicitIds.has('CREW_OKSANA')) add('Oksana (takip)', 15 * cm);
    if (reqItems(o).length && hasPet(G, 'PET_CUCE')) add('Cüce Kaptan', 15);
    if (o.tarcin) {
      const tm = tarcinMult(G) * crewSkillMult(G);
      if (tm > 1) add('Bisküvi', base * (tm - 1));
    }
    if (cur && cur.luck) add('Şans', cur.luck);
    if ((etags.includes('island') || etags.includes('explore')) && hasCrew(G, 'CREW_KALANI')) {
      breakdown.push({ label: 'Kral Kalani: ada bilgisi', v: 100 - c, override: true });
      c = 100;
    }
    if (etags.includes('sea_god') && hasCrew(G, 'CREW_MAGDA')) {
      breakdown.push({ label: 'Magda: Deniz Tanrısı', v: 100 - c, override: true });
      c = 100;
    }
    X1.chanceMods(G, ev, o, add);
    chance = Math.max(0, Math.min(100, Math.round(c)));
  }
  return {
    available: reasons.length === 0,
    reasons,
    chance,
    breakdown,
    cost,
    items: reqItems(o),
    consumes: o.consume || null,
    hint: o.hint || null,
  };
}

// ───────────────────────── Çözüm ─────────────────────────

function pickVariant(G, rng, out) {
  if (!Array.isArray(out)) return out;
  const zipir = hasPet(G, 'PET_ZIPIR');
  const list = out.filter((v) => !(zipir && v.rotten));
  return rng.weighted(list, (v) => v.w ?? 1);
}

function resolveAuto(G, host, ev, auto, rng, ctx) {
  const pending = [];
  const lines = applyFx(G, auto.fx || {}, { ev, opt: {}, success: true, region: ctx.region, host, rng, pending });
  const xp = addXp(G, BALANCE.xp.eventSuccess, 'events');
  lines.push({ kind: 'xp', text: `Olay çözüldü: +${xp} XP` });
  host.current.result = { auto: true, success: true, text: auto.text, lines, pending, label: 'Otomatik çözüm' };
  X1.recordOutcome(G, ev.id, null, true, true);
  G.run.stats.eventsResolved++;
  afterChain(G, ev, auto.fx || {});
}

/** Oyuncunun seçimini uygular. Sonuç host.current.result içine yazılır; tekrar çağrılamaz. */
export function resolveOption(G, host, key, rng, ctx) {
  const run = G.run;
  const cur = host.current;
  if (!cur) return { ok: false, reason: 'Aktif event yok.' };
  if (cur.result) return { ok: false, reason: 'Bu event zaten çözüldü.' };
  const ev = EVENT_BY_ID[cur.id];
  const opts = getOptions(G, host);
  const o = opts.find((x) => x.key === key);
  if (!o) return { ok: false, reason: 'Geçersiz seçenek.' };
  if (!o.view.available) return { ok: false, reason: o.view.reasons.join(', ') };
  G.ctxRegion = ctx.region;
  const opt = o.opt;
  if (o.view.cost) run.gold -= o.view.cost;
  const lines = [];
  if (o.view.cost) lines.push({ kind: 'gold', text: `Ödenen: −${o.view.cost} altın` });
  if (opt.consume && consumeItem(G, opt.consume)) lines.push({ kind: 'item', text: `${ITEM_BY_ID[opt.consume].name} kullanıldı ve tükendi.` });
  // Dayanıklılık: bu seçimde etkisi kullanılan itemler (şans bonusu veren / seçeneği açan) yıpranır
  const wear = new Set();
  for (const b of o.view.breakdown || []) { const it = ITEMS.find((x) => x.name === b.label); if (it && b.v > 0) wear.add(it.id); }
  for (const id of o.view.items || []) if (id !== opt.consume && hasItem(G, id)) wear.add(id);

  let success = true;
  let roll = null;
  let saved = false;
  if (o.view.chance != null) {
    roll = Math.floor(rng.next() * 100);
    success = roll < o.view.chance;
    if (!success && opt.lose && hasItem(G, 'ITEM_AMULET') && rng.chance(25)) {
      success = true;
      saved = true;
      wear.add('ITEM_AMULET');
    }
  }
  const flags = chainFlags(run, ev);
  let out;
  if (success) out = (opt.cases || []).find((c) => checkWhen(G, c.when, flags)) || pickVariant(G, rng, opt.win);
  else out = pickVariant(G, rng, opt.lose);
  const pending = [];
  if (saved) lines.push({ kind: 'info', text: 'Deniz Tanrısı Muskası parladı: kötü sonuç iyiye döndü!' });
  const fxCtx = { ev, opt, success, region: ctx.region, host, rng, pending, wear };
  lines.push(...applyFx(G, out.fx || {}, fxCtx));
  for (const id of wear) wearItem(G, id, lines);
  const isPass = (opt.tags || []).includes('pass');
  if (success && !isPass && ev.cat !== 'special') {
    const xp = addXp(G, BALANCE.xp.eventSuccess, 'events');
    lines.push({ kind: 'xp', text: `Olay başarıyla çözüldü: +${xp} XP` });
  }
  if (success && ((ev.tags || []).includes('chest') || (ev.tags || []).includes('wreck')) && ((opt.tags || []).includes('loot') || ev.tags.includes('chest')) && !isPass) {
    if (hasPet(G, 'PET_CUCE')) {
      const g = Math.round(35 * (BALANCE.regionGoldMult[ctx.region] || 1));
      run.gold += g;
      run.stats.goldEarned += g;
      lines.push({ kind: 'gold', text: `Cüce Kaptan gizli bir bölme buldu: +${g} altın` });
    }
  }
  cur.result = { key, label: opt.label, success, saved, roll, chance: o.view.chance, text: out.text, lines, pending };
  X1.recordOutcome(G, ev.id, key, success);
  run.stats.eventsResolved++;
  afterChain(G, ev, out.fx || {});
  return { ok: true, result: cur.result };
}

function afterChain(G, ev, fx) {
  const run = G.run;
  if (!ev.chain) return;
  const cs = run.chains[ev.chain];
  if (!cs) return;
  if (fx.endChain || (!fx.next && cs.status !== 'done')) {
    if (cs.status !== 'done') {
      cs.status = 'done';
      if ((ev.step || 1) >= CHAINS[ev.chain].steps) {
        run.stats.chainsCompleted++;
        if (['CH_GHOST', 'CH_CURSE', 'CH_X1_LIGHTKEEPER'].includes(ev.chain)) G.meta.x1.mysteryChains[ev.chain] = true;
        unlockAchievement(G, 'ACH_CHAIN_MASTER');
      }
    }
  }
}

// ───────────────────────── Etkiler ─────────────────────────

function negMult(G, ctx) {
  const { ev, success } = ctx;
  let m = 1;
  const notes = [];
  const etags = ev.tags || [];
  if (ev.cat === 'mystery' && !success && hasCrew(G, 'CREW_MAGDA')) { m *= 0.7; notes.push('Magda'); }
  if (etags.includes('plague')) {
    if (hasPet(G, 'PET_ZIPIR')) { m *= 0.7; notes.push('Zıpır'); }
    if (hasCrew(G, 'CREW_ESPERANZA') && !hasCrew(G, 'CREW_VARGAS')) { m *= 0.4; notes.push('Esperanza'); }
  }
  if (ev.cat === 'disaster') {
    if (hasCrew(G, 'CREW_SOLARA')) { m *= 0.7; notes.push('Solara'); }
    if (hasUpgrade(G.meta, 'UPG_ETERNAL_LIGHT')) { m *= 0.7; notes.push('Ebedi Işık'); }
  }
  return { m, notes };
}

function computeDamage(G, base, ctx, raw = false) {
  const { ev, opt } = ctx;
  const etags = ev.tags || [];
  const otags = opt.tags || [];
  let d = raw ? base : base * (BALANCE.regionDamageMult[ctx.region] || 1);
  const notes = [];
  d = X1.damageMods(G, d, ev, raw, notes); // Deniz Derinliği (hullRaw hariç) + Yedek Halatlar
  const nm = negMult(G, ctx);
  d *= nm.m;
  notes.push(...nm.notes);
  if (otags.includes('combat') && hasCrew(G, 'CREW_OKSANA')) { d *= 0.8; notes.push('Oksana'); }
  if ((etags.includes('fire') || etags.includes('leak')) && hasCrew(G, 'CREW_GROOT')) { d *= 0.6; notes.push('Groot'); }
  if (etags.includes('leak') && hasCrew(G, 'CREW_DONNA')) { d *= 0.5; notes.push('Donna'); }
  if ((etags.includes('fire') || etags.includes('volcano')) && hasItem(G, 'ITEM_HEAT_SHIELD')) { d *= 0.75; notes.push('Isı Kalkanı'); ctx.wear?.add('ITEM_HEAT_SHIELD'); }
  if (etags.includes('ice') && hasItem(G, 'ITEM_ICEBREAKER')) { d *= 0.5; notes.push('Buz Kıran Pruva'); ctx.wear?.add('ITEM_ICEBREAKER'); }
  if ((etags.includes('storm') || etags.includes('wave')) && hasCrew(G, 'CREW_SURGE')) { d *= 0.5; notes.push('Surge'); }
  if ((etags.includes('storm') || etags.includes('wave')) && hasPet(G, 'PET_KAPLUMBAGA')) { d *= 0.85; notes.push('Bilge'); }
  for (const dm of ev.dmgMods || []) if (dm.crew && hasCrew(G, dm.crew)) { d *= dm.mult; notes.push(dm.note || CREW_BY_ID[dm.crew].name); }
  if (etags.includes('attack') && hasCrew(G, 'CREW_KENJI')) { d = Math.max(0, d - 15); notes.push('Kenji (−15)'); }
  return { dmg: Math.max(0, Math.round(d)), notes };
}

function insertNow(host, entry) {
  host.queue.splice(host.pos, 0, entry);
}

function addExtraEvents(G, ctx, n, cat = null) {
  const { host, rng } = ctx;
  const v = G.run.voyage;
  if (!v || host !== v) return 0;
  const rctx = routeCtx(G, v.toIdx);
  const exclude = new Set(v.queue.slice(v.pos).map((q) => q.id));
  for (let i = 0; i < n; i++) {
    const e = genSlot(G, rng, rctx, exclude, { cat, fortunePenalty: v.fortunePenalty });
    exclude.add(e.id);
    if (cat) insertNow(v, e);
    else v.queue.push(e);
  }
  return n;
}

export function applyFx(G, fx, ctx) {
  const run = G.run;
  const { ev, rng, pending } = ctx;
  const lines = [];
  const ownWear = !ctx.wear;
  if (ownWear) ctx.wear = new Set();
  const region = ctx.region || 1;
  const etags = ev.tags || [];
  const nm = negMult(G, ctx);

  // Hull
  if (fx.hull || fx.hullRaw) {
    const v = fx.hull || fx.hullRaw;
    if (v < 0) {
      const { dmg, notes } = computeDamage(G, -v, ctx, !!fx.hullRaw);
      const r = changeHull(G, -dmg);
      lines.push({ kind: 'damage', text: `Gövde hasarı: ${r.delta} HP${notes.length ? ` (azaltan: ${notes.join(', ')})` : ''}` });
      if (dmg > 0 && run.x1?.escort && (ev.cat === 'danger' || ev.cat === 'disaster')) { run.x1.escort.hp -= 1; lines.push({ kind: 'info', text: 'Eşlik ettiğin nakliye gemisi de hasar aldı.' }); }
    } else {
      const r = changeHull(G, v + (hasUpgrade(G.meta, 'UPG_X1_MASTER_TOOLS') ? 5 : 0));
      lines.push({ kind: 'heal', text: r.delta > 0 ? `Onarım: +${r.delta} HP` : 'Gemi zaten tam sağlamdı.' });
    }
  }
  if (fx.explosionRisk && hasItem(G, 'ITEM_CANNON')) {
    if (hasCrew(G, 'CREW_LENA')) lines.push({ kind: 'info', text: 'Lena barut fıçılarını önceden emniyete almıştı: patlama riski yok.' });
    else {
      const { dmg } = computeDamage(G, fx.explosionRisk, ctx);
      const r = changeHull(G, -dmg);
      lines.push({ kind: 'damage', text: `Güverte topunun barutu patladı: ${r.delta} HP` });
    }
  }
  if (fx.repairFull) {
    const r = changeHull(G, maxHull(G));
    lines.push({ kind: 'heal', text: `Gemi tamamen onarıldı (+${r.delta} HP)` });
  }
  // Altın
  let goldGain = 0;
  if (fx.gold) goldGain += fx.gold;
  if (fx.goldR) goldGain += Math.round(fx.goldR * (BALANCE.regionGoldMult[region] || 1));
  if (goldGain > 0 && etags.includes('fish') && hasCrew(G, 'CREW_NAKAMURA') && ctx.opt.req?.crew !== 'CREW_NAKAMURA') {
    goldGain *= 2;
    lines.push({ kind: 'info', text: 'Nakamura\'nın balık sezgisi: altın ×2' });
  }
  goldGain = X1.eventGold(run, goldGain);
  if (goldGain > 0) {
    run.gold += goldGain;
    run.stats.goldEarned += goldGain;
    lines.push({ kind: 'gold', text: `+${goldGain} altın` });
  } else if (goldGain < 0) {
    let loss = -goldGain * nm.m;
    if (hasItem(G, 'ITEM_HIDDEN_SAFE')) { loss *= 0.5; ctx.wear.add('ITEM_HIDDEN_SAFE'); }
    loss = Math.min(run.gold, Math.round(loss));
    run.gold -= loss;
    lines.push({ kind: 'gold', text: `−${loss} altın${hasItem(G, 'ITEM_HIDDEN_SAFE') ? ' (Gizli Kasa kaybı yarıya indirdi)' : ''}` });
  }
  // XP
  if (fx.xp) {
    let x = fx.xp;
    if (ev.xpMult && hasCrew(G, ev.xpMult.crew) && x > 0) x *= ev.xpMult.mult;
    const got = addXp(G, x, 'events');
    lines.push({ kind: 'xp', text: got >= 0 ? `+${got} XP` : `${got} XP` });
  }
  if (fx.xpExplore) {
    const got = addXp(G, fx.xpExplore, 'exploration');
    lines.push({ kind: 'xp', text: `Keşif: +${got} XP` });
  }
  // Kargo
  if (fx.cargoLoss) {
    let pct = fx.cargoLoss * nm.m;
    const notes = [];
    if ((etags.includes('pirate') || etags.includes('rocks')) && hasItem(G, 'ITEM_ROPES') && !(ctx.opt.tags || []).includes('surrender') && pct > 0 && run.cargo.length) { pct = 0; notes.push('Halatlar ve Zincir kaybı engelledi'); ctx.wear.add('ITEM_ROPES'); }
    if (pct > 0 && etags.includes('pirate') && hasCrew(G, 'CREW_BARAKA')) { pct *= 0.65; notes.push('Baraka −%35'); }
    const total = run.cargo.reduce((s, l) => s + l.qty, 0);
    let n = pct > 0 && total > 0 ? Math.max(1, Math.round((total * pct) / 100)) : 0;
    if (n > 0 && X1.insuranceProtect(G, ev, ctx.opt)) { n -= 1; notes.push('Tüccar Sigortası 1 birimi korudu'); }
    const removed = removeRandomUnits(run, rng, n);
    const txt = Object.entries(removed).map(([g, q]) => `${q} ${GOOD_BY_ID[g].name}`).join(', ');
    if (txt) lines.push({ kind: 'cargo', text: `Kargo kaybı: ${txt}${notes.length ? ` (${notes.join(', ')})` : ''}` });
    else if (notes.length) lines.push({ kind: 'info', text: notes.join(', ') });
    else if (total === 0) lines.push({ kind: 'info', text: 'Ambar boştu; kaybedecek kargo yoktu.' });
  }
  if (fx.cargoSpoil) {
    if (hasItem(G, 'ITEM_QUALITY_SEAL')) { lines.push({ kind: 'info', text: 'Kalite Mühürü mallarını bozulmaktan korudu.' }); ctx.wear.add('ITEM_QUALITY_SEAL'); }
    else {
      let n = fx.cargoSpoil * nm.m;
      if (hasCrew(G, 'CREW_DONNA')) n *= 0.6;
      n = Math.round(n);
      let done = 0;
      for (let i = 0; i < n; i++) {
        const lots = run.cargo.filter((l) => !l.spoiled && l.qty > 0 && !GOOD_BY_ID[l.good].questItem);
        if (!lots.length) break;
        splitSpoil(run, rng.pick(lots), 1);
        done++;
      }
      if (done) lines.push({ kind: 'cargo', text: `${done} birim mal bozuldu.` });
    }
  }
  if (fx.confiscate) {
    let p = 1;
    if (hasItem(G, 'ITEM_SMUGGLER_HOLD') && run.cargo.some((l) => GOOD_BY_ID[l.good].contraband)) { p *= 0.5; ctx.wear.add('ITEM_SMUGGLER_HOLD'); }
    if (hasCrew(G, 'CREW_REZA')) p *= 0.5;
    const removed = {};
    for (const lot of run.cargo.slice()) {
      if (!GOOD_BY_ID[lot.good].contraband) continue;
      let n = 0;
      for (let i = 0; i < lot.qty; i++) if (rng.next() < p) n++;
      if (n) {
        lot.qty -= n;
        removed[lot.good] = (removed[lot.good] || 0) + n;
        if (lot.qty <= 0) run.cargo.splice(run.cargo.indexOf(lot), 1);
      }
    }
    const txt = Object.entries(removed).map(([g, q]) => `${q} ${GOOD_BY_ID[g].name}`).join(', ');
    lines.push(txt ? { kind: 'cargo', text: `El konulan kaçak mallar: ${txt}` } : { kind: 'info', text: 'Ambarında el konulacak kaçak mal bulunmadı.' });
  }
  if (fx.cargoRemove) {
    const want = fx.cargoRemoveQty || 1;
    let left = want;
    for (const lot of run.cargo.filter((l) => l.good === fx.cargoRemove)) {
      const n = Math.min(left, lot.qty);
      lot.qty -= n;
      left -= n;
      if (lot.qty <= 0) run.cargo.splice(run.cargo.indexOf(lot), 1);
      if (!left) break;
    }
    if (want - left > 0) lines.push({ kind: 'cargo', text: `Kargodan çıkarıldı: ${want - left} ${GOOD_BY_ID[fx.cargoRemove].name}` });
  }
  if (fx.cargoEat) {
    for (const g of fx.cargoEat) {
      const lot = run.cargo.find((l) => l.good === g && l.qty > 0);
      if (lot) {
        lot.qty -= 1;
        if (lot.qty <= 0) run.cargo.splice(run.cargo.indexOf(lot), 1);
        lines.push({ kind: 'cargo', text: `1 ${GOOD_BY_ID[g].name} yendi.` });
        break;
      }
    }
  }
  if (fx.cargoAdd) {
    const spec = fx.cargoAdd;
    let goodId = spec.good;
    if (!goodId) {
      const pool = TRADE_GOODS.filter((g) => g.group === (spec.random || 'valuable'));
      goodId = rng.pick(pool).id;
    }
    const want = spec.qty || 1;
    const got = addCargo(G, goodId, want, spec.free ? 0 : null);
    if (got) lines.push({ kind: 'cargo', text: `Kargoya eklendi: ${got} ${GOOD_BY_ID[goodId].name}` });
    if (got < want) lines.push({ kind: 'info', text: `Ambarda yer yoktu: ${want - got} ${GOOD_BY_ID[goodId].name} denizde kaldı.` });
  }
  if (fx.fixSpoiled) {
    let n = 0;
    for (const lot of run.cargo) if (lot.spoiled) { lot.spoiled = false; n += lot.qty; }
    lines.push({ kind: 'cargo', text: n ? `${n} birim bozulmuş mal toparlandı.` : 'Bozulmuş malın yoktu.' });
  }
  // Itemler
  if (fx.item) {
    let id = fx.item;
    if (id === 'rare' || id === 'random') {
      const rareBoost = id === 'random' && (etags.includes('island') || etags.includes('explore')) && hasCrew(G, 'CREW_COMPASS') ? 40 : 0;
      const miraWreck = id === 'random' && (etags.includes('wreck') || etags.includes('ruins')) && hasCrew(G, 'CREW_MIRA');
      id = randomItemFor(G, rng, miraWreck ? 'rare' : id, region, { rareBoost });
    }
    giveItem(G, id, lines, pending);
  }
  if (fx.loseItem) {
    const id = fx.loseItem === 'random' ? rng.pick(run.items)?.id : fx.loseItem;
    if (id && consumeItem(G, id)) lines.push({ kind: 'item', text: `Item kaybedildi: ${ITEM_BY_ID[id].name}` });
  }
  // Tayfa
  if (fx.crewOffer) {
    const ids = crewCandidates(G, fx.crewOffer, rng);
    if (ids.length) {
      pending.push({ type: 'crew', ids, done: false });
      lines.push({ kind: 'crew', text: `Tayfa teklifi: ${ids.map((i) => CREW_BY_ID[i].name).join(', ')}` });
    } else lines.push({ kind: 'info', text: 'Katılabilecek uygun tayfa kalmamıştı.' });
  }
  if (fx.crewJoin) {
    let id = typeof fx.crewJoin === 'string' ? fx.crewJoin : null;
    if (!id || !crewAvailableForRun(G, id)) {
      const ids = crewCandidates(G, typeof fx.crewJoin === 'object' ? { n: 1, ...fx.crewJoin } : 1, rng);
      id = ids[0] || null;
    }
    if (id) giveCrew(G, id, lines, pending);
    else giveItem(G, randomItemFor(G, rng, 'random', region), lines, pending);
  }
  if (fx.crewRemove && hasCrew(G, fx.crewRemove)) {
    dismissCrew(G, fx.crewRemove);
    lines.push({ kind: 'crew', text: `${CREW_BY_ID[fx.crewRemove].name} gemiden ayrıldı.` });
  }
  // Hayvanlar
  if (fx.pet) givePet(G, fx.pet, lines, pending, fx.special);
  if (fx.petChance && !hasPet(G, fx.petChance[1]) && rng.chance(fx.petChance[0])) {
    const p = PET_BY_ID[fx.petChance[1]];
    lines.push({ kind: 'pet', text: `${p.name} güverteye kondu ve gitmeye hiç niyeti yoktu!` });
    pending.push({ type: 'pet', id: p.id, done: false });
  }
  if (fx.special && !fx.pet) {
    if (fx.special === 'skipped') run.special.stage = 'skipped';
    if (fx.special === 'declinedSecond') run.special.stage = 'done';
  }
  // Kuyruk ve rota
  const v = run.voyage;
  const inVoyage = v && ctx.host === v;
  if (fx.skip && inVoyage) {
    let n = fx.skip;
    if (etags.includes('wind') && hasCrew(G, 'CREW_YUSUF')) n *= 2;
    let skipped = 0;
    for (let i = v.pos; i < v.queue.length && skipped < n; ) {
      if (v.queue[i].src === 'normal') {
        v.queue.splice(i, 1);
        skipped++;
      } else i++;
    }
    lines.push({ kind: 'route', text: skipped ? `${skipped} olay atlandı.` : 'Atlanacak olay kalmamıştı.' });
  }
  if (fx.extra) {
    const n = typeof fx.extra === 'object' ? fx.extra.n : fx.extra;
    const cat = typeof fx.extra === 'object' ? fx.extra.cat : null;
    if (addExtraEvents(G, ctx, n, cat)) lines.push({ kind: 'route', text: cat ? 'Yeni bir tehlike yaklaşıyor!' : `Yolculuk uzadı: +${n} olay` });
  }
  if (fx.extraChance && rng.chance(fx.extraChance[0])) {
    if (addExtraEvents(G, ctx, 1, fx.extraChance[1])) lines.push({ kind: 'route', text: 'Adada oyalanırken bir tehlike yaklaştı!' });
  }
  if (fx.reroute && inVoyage) {
    const alt = rerouteTarget(G, rng);
    if (alt) {
      for (let i = v.queue.length - 1; i >= v.pos; i--) if (v.queue[i].src === 'normal') v.queue.splice(i, 1);
      run.pendingStatus = [];
      addExtraEvents(G, ctx, 1);
      lines.push({ kind: 'route', text: `Yeni hedef: ${alt.name}` });
    } else {
      addExtraEvents(G, ctx, 1);
      lines.push({ kind: 'route', text: 'Başka liman yoktu; uzun bir dolambaçla yola devam ettin (+1 olay).' });
    }
  }
  if (fx.lucky) {
    run.buffs.lucky = true;
    lines.push({ kind: 'buff', text: 'Sonraki olay şanslı olacak.' });
  }
  if (fx.luckBuff) {
    run.buffs.luck = { add: fx.luckBuff.add, events: fx.luckBuff.events };
    lines.push({ kind: 'buff', text: `Sonraki ${fx.luckBuff.events} olayda başarı şansı +%${fx.luckBuff.add}` });
  }
  if (fx.reveal && v) {
    v.revealBonus = Math.max(v.revealBonus || 0, fx.reveal);
    lines.push({ kind: 'buff', text: `Sonraki ${fx.reveal} olay haritada görünüyor.` });
  }
  if (fx.routeEvents) {
    run.buffs.nextRouteEvents += fx.routeEvents;
    lines.push({ kind: 'buff', text: `Sonraki rotada olay sayısı ${fx.routeEvents}` });
  }
  if (fx.warnOff && v) {
    v.warnOff = true;
    lines.push({ kind: 'info', text: "Bu rota boyunca Tarçın'ın Erken Uyarısı çalışmayacak." });
  }
  if (fx.fortunePenalty && v) {
    v.fortunePenalty += fx.fortunePenalty;
    regenRemaining(G, rng);
    lines.push({ kind: 'info', text: `Bu rotada şans eventi ağırlığı −%${fx.fortunePenalty}` });
  }
  if (fx.status) {
    if (fx.status === 'pirateRep') X1.addRep(G, 'red', 1);
    else if (!run.pendingStatus.includes(fx.status)) run.pendingStatus.push(fx.status);
    lines.push({ kind: 'status', text: `Sonraki liman: ${STATUS_NAMES[fx.status]}` });
  }
  if (fx.x1) X1.applyX1(G, fx.x1, ctx, lines, { addXp, unlockAchievement, addCargoLot: addContractLot, cargoFree });
  // Zincirler
  if (fx.flag && ev.chain) Object.assign((run.chains[ev.chain] ||= { status: 'active', flags: {}, step: 0 }).flags, fx.flag);
  if (fx.startChain) {
    const ch = CHAINS[fx.startChain];
    if (!run.chains[ch.id]) {
      run.chains[ch.id] = { status: 'queued', flags: {}, step: 0 };
      insertNow(ctx.host, { id: ch.start, src: 'chain', chain: ch.id });
      lines.push({ kind: 'chain', text: `Zincir başladı: ${ch.name}` });
    } else lines.push({ kind: 'info', text: `${ch.name} zinciri bu run'da zaten yaşandı.` });
  }
  if (fx.next) {
    const node = EVENT_BY_ID[fx.next];
    const entry = { id: node.id, src: 'chain', chain: node.chain };
    const at = fx.nextAt || 'now';
    if (at === 'now') insertNow(ctx.host, entry);
    else if (at === 'route') run.pendingRoute.push(entry);
    else run.pendingArrival.push(entry);
    const ch = CHAINS[node.chain];
    lines.push({ kind: 'chain', text: `${ch.name} (${node.step}/${ch.steps}) ${at === 'now' ? 'hemen devam edecek' : at === 'route' ? 'bir sonraki rotada devam edecek' : 'limana varışta devam edecek'}.` });
  }
  if (fx.spawnNextRoute && rng.chance(fx.spawnNextRoute[0])) {
    run.pendingRoute.push({ id: fx.spawnNextRoute[1], src: 'spawn' });
    lines.push({ kind: 'route', text: 'Birileri peşine düşmüş olabilir...' });
  }
  // Codex, başarım
  if (fx.codexHarbor) {
    const known = G.meta.codex;
    const cands = HARBORS.filter((h) => !known.harbors[h.id] && !known.revealed[h.id]);
    if (cands.length) {
      const h = rng.pick(cands);
      known.revealed[h.id] = true;
      lines.push({ kind: 'codex', text: `Codex: ${h.name} limanının bilgisi eklendi.` });
    } else lines.push({ kind: 'codex', text: 'Codex: bildiğin bir limanın eski bir çizimi.' });
  }
  if (fx.codexNote) {
    G.meta.codex.notes[fx.codexNote] = true;
    lines.push({ kind: 'codex', text: 'Codex\'e yeni bir sayfa eklendi.' });
  }
  if (fx.ach) unlockAchievement(G, fx.ach);
  // Mini ticaret ve seyyar tüccar
  if (fx.trade) pending.push(makeTradeOffer(G, rng, fx.trade, region));
  if (fx.shop) pending.push(makeShopOffer(G, rng, region));
  if (ownWear) { for (const id of ctx.wear) wearItem(G, id, lines); ctx.wear = null; }
  return lines;
}

function regenRemaining(G, rng) {
  const v = G.run.voyage;
  const rctx = routeCtx(G, v.toIdx);
  const exclude = new Set(v.queue.slice(0, v.pos).map((q) => q.id));
  for (let i = v.pos; i < v.queue.length; i++) {
    if (v.queue[i].src !== 'normal') continue;
    const e = genSlot(G, rng, rctx, exclude, { fortunePenalty: v.fortunePenalty });
    v.queue[i] = e;
    exclude.add(e.id);
  }
}

function giveItem(G, id, lines, pending) {
  if (G.run.items.length < itemSlots(G)) {
    addItem(G, id);
    lines.push({ kind: 'item', text: `Yeni item: ${ITEM_BY_ID[id].name}` });
  } else {
    pending.push({ type: 'item', id, done: false });
    lines.push({ kind: 'item', text: `Bulunan item: ${ITEM_BY_ID[id].name} (slotların dolu — aşağıdan karar ver)` });
  }
}

function giveCrew(G, id, lines, pending) {
  if (G.run.crew.length < crewSlots(G)) {
    addCrew(G, id);
    lines.push({ kind: 'crew', text: `${CREW_BY_ID[id].name} gemine katıldı!` });
  } else {
    pending.push({ type: 'crew', ids: [id], done: false });
    lines.push({ kind: 'crew', text: `${CREW_BY_ID[id].name} katılmak istiyor (tayfa slotların dolu).` });
  }
}

function givePet(G, id, lines, pending, special) {
  const res = addPet(G, id);
  if (res.ok) {
    lines.push({ kind: 'pet', text: `${PET_BY_ID[id].name} gemine katıldı!` });
    onPetJoined(G, id, special, res);
  } else if (res.needsSlot) {
    pending.push({ type: 'pet', id, special: special || null, done: false });
    lines.push({ kind: 'pet', text: `${PET_BY_ID[id].name} gemine katılmak istiyor ama hayvan slotun dolu.` });
  }
}

/** Hayvan katıldıktan sonra özel akış ve Eski Dostlar. */
export function onPetJoined(G, id, special, res) {
  const run = G.run;
  if (special === 'tookTarcin' || special === 'tookZipir') scheduleSecondEncounter(G, id);
  if (res && res.oldFriends) {
    unlockAchievement(G, 'ACH_OLD_FRIENDS');
    G.meta.codex.oldFriends = true;
    G.pendingToasts = G.pendingToasts || [];
    G.pendingToasts.push({ kind: 'oldFriends' });
    run.special.stage = 'reunited';
  }
}

/** Bekleyen özel seçim reddedilirse (ör. slot dolu olduğu için hayvan alınmadı) */
export function onPendingDeclined(G, p) {
  if (p.type === 'pet' && (p.special === 'tookTarcin' || p.special === 'tookZipir')) G.run.special.stage = 'skipped';
}

function makeTradeOffer(G, rng, mode, region) {
  const goodsPool = TRADE_GOODS.filter((g) => g.group !== 'special' && (region >= 3 || g.group !== 'rare'));
  const picks = rng.sample(goodsPool, 2);
  const buyMult = mode === 'friendly' ? 1 - BALANCE.trade.friendlyTraderBonus : 0.9;
  const sellMult = mode === 'friendly' ? 1 + BALANCE.trade.friendlyTraderBonus : 1.0;
  return {
    type: 'trade', mode, done: false, sellMult,
    goods: picks.map((g) => ({ good: g.id, price: Math.round(g.buy * buyMult), stock: 2 })),
  };
}

function makeShopOffer(G, rng, region) {
  const offered = new Set(G.run.visit?.items || G.run.lastVisitItems || []);
  const held = new Set(G.run.items.map((i) => i.id));
  const pool = ITEMS.filter((i) => !offered.has(i.id) && !held.has(i.id));
  const picks = rng.sample(pool.length ? pool : ITEMS, 3);
  return {
    type: 'shop', done: false,
    items: picks.map((it) => ({ id: it.id, price: Math.round(it.price * (1 - BALANCE.items.travelingMerchantDiscount)), bought: false })),
  };
}

export { routeCtx };
