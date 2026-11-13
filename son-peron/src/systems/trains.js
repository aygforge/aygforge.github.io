// Tren seferleri: her gün tam 09:00 / 15:00 / 21:00. Konum yalnız oyun saatinden türetilir (kayıtla tutarlı).
import { VISITOR_TARGETS, PROFILES, FESTIVAL_PAX_MULT, RENOVATION_EFFECTS } from '../data/supplement.js';
import * as Kitchen from './kitchen.js';
import * as Build from './building.js';
import * as Service from './service.js';

export const STOP_X = 24, TRAIN_LEN = 26, DEPART_MIN = 9;
export function resetDay(sim) { sim.s.trains = sim.C.trainTimes.map((time) => ({ time, phase: 'wait', spawned: false })); }
// Lokomotif burnunun karo x'i; doğudan gelir, batıya gider. null = görünmüyor
export function trainX(sim, tr) {
  const m = sim.s.minute, C = sim.C.train; const t0 = tr.time - C.approach, t1 = tr.time, t2 = tr.time + C.dwell, nose = STOP_X - TRAIN_LEN / 2;
  if (m < t0 || m > t2 + DEPART_MIN) return null;
  if (m < t1) { const k = (m - t0) / C.approach; return nose + 118 * (1 - k) * (1 - k); }
  if (m <= t2) return nose;
  const k = (m - t2) / DEPART_MIN; return nose - 70 * k * k;
}
export function nextTrain(sim) { const m = sim.s.minute; const t = sim.C.trainTimes.find((x) => x + sim.C.train.dwell > m); return t == null ? null : { time: t, eta: t - m }; }

export function tick(sim) {
  const s = sim.s, C = sim.C.train;
  for (const tr of s.trains) {
    if (tr.phase === 'wait' && s.minute >= tr.time - C.approach) { tr.phase = s.minute >= tr.time + C.dwell ? 'gone' : 'approach'; if (tr.phase === 'approach') sim.emit('train_approach', { time: tr.time }); }
    if (tr.phase === 'approach' && s.minute >= tr.time) { tr.phase = 'stopped'; sim.emit('train_stop', { time: tr.time }); if (!tr.spawned) { tr.spawned = true; sim.once(`train:${s.day}:${tr.time}`, () => spawnPassengers(sim, tr)); } }
    if (tr.phase === 'stopped' && s.minute >= tr.time + C.dwell) { tr.phase = 'depart'; sim.emit('train_depart', { time: tr.time }); }
    if (tr.phase === 'depart' && s.minute >= tr.time + C.dwell + DEPART_MIN) tr.phase = 'gone';
  }
}
export function potentialVisitors(sim, time) {
  const s = sim.s; const ti = sim.C.trainTimes.indexOf(time); const [a, b] = VISITOR_TARGETS[s.stage][ti];
  let n = sim.ri(a, b); let mult = 1;
  const ev = s.event && s.event.time === time ? s.event : null; if (ev) mult *= ev.pax;
  if (s.festival) mult *= FESTIVAL_PAX_MULT;
  if (s.celebration === s.day) mult *= 1.3;
  for (const r of s.renovations) mult *= 1 + (RENOVATION_EFFECTS[r].attract || 0);
  if (['storm', 'blizzard'].includes(s.weather)) mult *= 0.85; else if (s.weather === 'rain') mult *= 0.95;
  mult *= 0.9 + s.reputation / 500;
  return { n: Math.max(1, Math.round(n * mult)), ev };
}
function spawnPassengers(sim, tr) {
  const s = sim.s; const ti = sim.C.trainTimes.indexOf(tr.time); let delay = 0.5; const C = sim.C.train;
  const nextDelay = (size) => { const d = delay; delay += (size / C.batch) * C.batchInterval; return d; };
  const townies = sim.ri(2, 4);
  const accepts = s.flags.canOpen && s.open && Kitchen.menuAvailable(sim);
  if (accepts && sim.quests.storyActive(sim, 'story_04') && !s.flags.tutorialTrain && tr.time === sim.C.trainTimes[0]) {
    // 2. gün: iki tutorial müşterisi (cömert sabır)
    s.flags.tutorialTrain = true;
    for (let i = 0; i < 2; i++) Service.spawnGroup(sim, { profile: 'regular', size: 1, train: tr.time, tutorial: true, delay: nextDelay(1) });
  } else if (accepts) {
    const { n, ev } = potentialVisitors(sim, tr.time); const seats = Build.totalSeats(sim);
    let left = Math.min(n, seats + 3); const maxTable = Math.max(1, ...Build.tables(sim).map((t) => Build.seatsOfTable(sim, t).length));
    const bias = ev?.id === 'railworkers_day' ? 'railworker' : ev?.id === 'first_class' ? 'business' : ev && ev.id !== 'winter_journey' ? 'tourist' : null;
    while (left > 0) {
      const keys = Object.keys(PROFILES).filter((k) => PROFILES[k].group[0] <= Math.min(left, maxTable));
      const weights = keys.map((k) => PROFILES[k].w[ti] * (k === bias ? 4 : 1)); let r = sim.rand() * weights.reduce((a, b) => a + b, 0); let prof = keys[0];
      for (let i = 0; i < keys.length; i++) { r -= weights[i]; if (r <= 0) { prof = keys[i]; break; } }
      const [ga, gb] = PROFILES[prof].group; const size = Math.min(left, maxTable, sim.ri(ga, gb));
      const regular = prof === 'regular' && size <= 2 && sim.rand() < 0.3 ? Service.pickRegular(sim) : null;
      Service.spawnGroup(sim, { profile: prof, size, train: tr.time, event: ev?.id, delay: nextDelay(size), regular }); left -= size;
    }
  }
  for (let i = 0; i < townies; i++) s.passers.push({ id: sim.nid('p'), scene: 'railway_outdoors', x: 12 + sim.ri(0, 22) + 0.5, y: 55.5, dir: 'up', t: nextDelay(1), tx: 1, ty: 37, n: sim.ri(0, 30), look: { skin: sim.ri(0, 3), hair: sim.ri(0, 5), style: sim.ri(0, 4), outfit: sim.ri(0, 7) } });
  if (!accepts && s.flags.canOpen && s.open) sim.msg('Barda satılacak ürün yok; yolcular kasabaya yöneldi.');
  sim.emit('passengers', { time: tr.time });
}
