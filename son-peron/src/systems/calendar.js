// Takvim: 4 mevsim × 28 gün = 112 gün/yıl; hava; haftalık tren etkinlikleri; festivaller.
export const dayOfYear = (C, day) => ((day - 1) % C.yearDays) + 1;
export const yearOf = (C, day) => Math.floor((day - 1) / C.yearDays) + 1;
export const seasonOf = (C, day) => C.seasons[Math.floor((dayOfYear(C, day) - 1) / C.daysPerSeason)];
export const dayOfSeason = (C, day) => ((dayOfYear(C, day) - 1) % C.daysPerSeason) + 1;
export function fmtTime(min) { const m = Math.floor(min); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }

export function rollWeather(sim) {
  const w = sim.C.weather[seasonOf(sim.C, sim.s.day)]; let r = sim.rand() * 100;
  for (const [k, p] of Object.entries(w)) { r -= p; if (r < 0) return k; }
  return Object.keys(w)[0];
}
export function festivalOn(C, day) { const dos = dayOfSeason(C, day); const se = seasonOf(C, day); return C.festivals.find((f) => f.season === se && f.day === dos) || null; }
// Etkinlik: 7/14/21. günler; ilk 3 gün yok; 28. gün festival önceliklidir; yalnız mevcut seferlerden birini etkiler
export function rollEvent(sim, day) {
  const C = sim.C; const dos = dayOfSeason(C, day);
  if (day <= 3 || festivalOn(C, day) || !C.eventDays.includes(dos)) return null;
  const pool = C.events.filter((e) => e.stage <= sim.s.stage && e.seasons.includes(seasonOf(C, day)));
  return pool.length ? { ...sim.pick(pool) } : null;
}
export function plan(sim, first) {
  const s = sim.s, C = sim.C;
  s.event = first ? rollEvent(sim, s.day) : s.eventTomorrow; s.eventTomorrow = rollEvent(sim, s.day + 1);
  const f = festivalOn(C, s.day), ft = festivalOn(C, s.day + 1);
  s.festival = f ? f.id : null; s.festivalTomorrow = ft ? ft.id : null;
  s.quests.festival = f ? { id: f.id, done: false } : null;
  if (s.event) sim.msg(`Bugün özel sefer: ${s.event.name} (${fmtTime(s.event.time)} treni)`, 'good');
  if (f) sim.msg(`Bugün ${f.name}! İsteğe bağlı festival hedefi görev defterinde.`, 'good');
  if (s.eventTomorrow) sim.msg(`Duyuru: yarın ${s.eventTomorrow.name} — ${fmtTime(s.eventTomorrow.time)} treni kalabalık olacak.`);
  if (ft) sim.msg(`Duyuru: yarın ${ft.name}!`);
}
