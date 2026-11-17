// GİZLİ DENİZ HİKÂYELERİ zamanlayıcısı.
// - Olaylar normal havuzda değildir; sefer kuyruğu kurulduktan sonra AYRI bir türetilmiş RNG akışıyla ("egg")
//   en fazla bir normal slotun yerine konur. Böylece eski olay/ekonomi seçimlerinin zar akışı değişmez.
// - Normal sefer (run) başına en fazla 1 farklı EVT_EGG_; Sonsuz Deniz'de 6 ek limanlık pencerede en fazla 1.
// - Aynı egg aynı run'da tekrar etmez. Codex'te hiç görülmemiş olanlara hafif öncelik (×1,25).
// Durum: run.seenEvents (mevcut) + run.x3.eggLast (son egg'in tetiklendiği liman sayısı; v7 içinde varsayılanlı alan).
import { SeededRNG } from '../core/SeededRNG.js';
import { EGG_EVENTS } from '../data/events_egg.js';
import * as X1 from './X1System.js';

export const EGG_RATE = 3.8; // sefer başına egg denemesi (%)
/** Denge karşılaştırması için (testler/simülasyon): oran buradan okunur */
export const EGG_CONFIG = { rate: EGG_RATE };
export const RARITY_WEIGHT = { rare: 2, very_rare: 1 };
export const ENDLESS_WINDOW = 6;
const harbors = (run) => run.stats?.harborsReached ?? 0;
export const isEgg = (id) => typeof id === 'string' && id.startsWith('EVT_EGG_');

/** Bu seferde egg denenebilir mi (zar atmadan önce) */
export function eggAllowed(run) {
  if (run.tutorial) return false;
  const endless = X1.endlessOn(run);
  if (!endless) return !run.seenEvents.some(isEgg);
  const last = run.x3?.eggLast ?? -99;
  return harbors(run) - last >= ENDLESS_WINDOW;
}

/** Aday egg'ler: bölge filtresi, bu run'da görülmemiş */
export function eggCandidates(G, region) {
  const run = G.run;
  return EGG_EVENTS.filter((e) => e.regions.includes(region) && !run.seenEvents.includes(e.id));
}

/**
 * Kuyruğa egg yerleştir (normal slotlardan birinin yerine). Döner: yerleştirilen id ya da null.
 * rng: SeededRNG.derive(seed, 'egg', fromIdx, harborId) — gameplay akışından bağımsız.
 */
export function scheduleEgg(G, queue, ctx, fromIdx, harborId) {
  const run = G.run;
  if (!eggAllowed(run)) return null;
  if (queue.some((q) => isEgg(q.id))) return null;
  const slots = queue.map((q, i) => (q.src === 'normal' ? i : -1)).filter((i) => i >= 0);
  if (!slots.length) return null;
  const rng = SeededRNG.derive(run.seed, 'egg', fromIdx, harborId);
  if (!rng.chance(EGG_CONFIG.rate)) return null;
  const cands = eggCandidates(G, ctx.region);
  if (!cands.length) return null;
  const ev = rng.weighted(cands, (e) => RARITY_WEIGHT[e.egg] * (G.meta.codex.events[e.id] ? 1 : 1.25));
  const later = slots.filter((i) => i > 0);
  const at = later.length ? later[rng.int(0, later.length - 1)] : slots[0];
  queue[at] = { id: ev.id, src: 'egg' };
  return ev.id;
}

/** Tetiklendiğinde Sonsuz Deniz penceresi için konum kaydı */
export function onEggTrigger(G) {
  const run = G.run;
  if (run.x3) run.x3.eggLast = harbors(run);
}

export function eggProgress(meta) {
  return EGG_EVENTS.filter((e) => meta.codex.events[e.id]).length;
}
