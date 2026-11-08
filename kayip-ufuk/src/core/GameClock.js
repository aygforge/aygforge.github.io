// Single simulation time authority: 18 real-minute day (11 day / 2 dusk / 5 night), pause, sleep, daily event ids.
export const DAY_SECONDS = 1080;
export const DAYLIGHT = 11 * 60, DUSK = 2 * 60, NIGHT = 5 * 60;

export class GameClock {
  constructor(clockState) {
    this.s = clockState; // persisted object inside StateStore
    this.paused = false;
    this.hiddenPaused = false;
    this.dayListeners = [];
  }
  static initial() {
    // Day 1 starts in the morning (60 s after dawn) so the player has daylight.
    return { gameElapsedSeconds: 60, dayIndex: 1, timeOfDaySeconds: 60, lastDailyUpdateIndex: 1, processedDailyEventIds: [], sleepCounter: 0 };
  }
  get running() { return !this.paused && !this.hiddenPaused; }
  onDayAdvance(fn) { this.dayListeners.push(fn); }

  /** Advance by dt seconds (only when running). Triggers daily processing for each crossed boundary exactly once. */
  advance(dt, reason = 'tick') {
    if (dt <= 0) return;
    const s = this.s;
    s.gameElapsedSeconds += dt;
    const newDay = 1 + Math.floor(s.gameElapsedSeconds / DAY_SECONDS);
    s.timeOfDaySeconds = s.gameElapsedSeconds % DAY_SECONDS;
    s.dayIndex = newDay;
    while (s.lastDailyUpdateIndex < newDay) {
      const day = s.lastDailyUpdateIndex + 1;
      const eventId = `DAY:${day}`;
      if (!s.processedDailyEventIds.includes(eventId)) {
        s.processedDailyEventIds.push(eventId);
        if (s.processedDailyEventIds.length > 400) s.processedDailyEventIds.splice(0, s.processedDailyEventIds.length - 400);
        for (const fn of this.dayListeners) fn(day, reason);
      }
      s.lastDailyUpdateIndex = day;
    }
  }

  get day() { return this.s.dayIndex; }
  get tod() { return this.s.timeOfDaySeconds; }
  /** normalized time of day 0..1 */
  get t01() { return this.s.timeOfDaySeconds / DAY_SECONDS; }
  /** Day phases for AI/fish: MORNING, DAY, EVENING (dusk), NIGHT */
  phase() {
    const t = this.s.timeOfDaySeconds;
    if (t < 180) return 'MORNING';
    if (t < DAYLIGHT) return 'DAY';
    if (t < DAYLIGHT + DUSK) return 'EVENING';
    return 'NIGHT';
  }
  isNight() { return this.s.timeOfDaySeconds >= DAYLIGHT + DUSK; }
  /** 0 = full daylight, 1 = full night darkness */
  darkness() {
    const t = this.s.timeOfDaySeconds;
    if (t < 40) return 0.55 * (1 - t / 40); // dawn fade-in
    if (t < DAYLIGHT) return 0;
    if (t < DAYLIGHT + DUSK) return ((t - DAYLIGHT) / DUSK) * 0.75;
    if (t > DAY_SECONDS - 40) return 0.75 - 0.2 * ((t - (DAY_SECONDS - 40)) / 40);
    return 0.75;
  }
  clockText() {
    // Map 1080 s day to a 24h dial: dawn 06:00 at t=0.
    const hours = (6 + (this.s.timeOfDaySeconds / DAY_SECONDS) * 24) % 24;
    const h = Math.floor(hours), m = Math.floor((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  secondsUntilMorning() {
    const t = this.s.timeOfDaySeconds;
    return DAY_SECONDS - t + 30; // wake 30 s after dawn of next day
  }
}
