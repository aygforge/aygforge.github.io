// Oyun saati.
// - playTime: yalnız oyun görünürken ve menü dışında akan "aktif oyun saniyesi". Tazelik ve süreli siparişler buna bağlıdır.
//   Sahne değiştirmek zaman atlatmaz; oyun kapalıyken bozulma olmaz.
// - dayKey: günlük görev / çark yenilemesi için yerel takvim günü. Cihaz saati geri alınırsa en büyük görülen
//   zaman damgası kullanılır (geri alma ile tekrar hak kazanılmaz).
(function (D) {
  'use strict';
  const Clock = {
    now: () => Date.now(), // testlerde değiştirilebilir
    localDayKey(ts) {
      const d = new Date(ts);
      return d.getFullYear() + '-' + D.pad2(d.getMonth() + 1) + '-' + D.pad2(d.getDate());
    },
    // state.clock = { playTime, maxRealTs }
    effectiveNow(state, now) {
      now = now == null ? Clock.now() : now;
      const c = state.clock;
      if (!c.maxRealTs || now > c.maxRealTs) c.maxRealTs = now;
      return Math.max(now, c.maxRealTs);
    },
    dayKey(state, now) { return Clock.localDayKey(Clock.effectiveNow(state, now)); },
    tick(state, dt) {
      if (!(dt > 0)) return;
      state.clock.playTime = Math.round((state.clock.playTime + Math.min(dt, 1)) * 1000) / 1000;
    }
  };
  D.Clock = Clock;
})(globalThis.DUMEN);
