// DÜMEN — ortak isim alanı ve küçük yardımcılar.
(function () {
  'use strict';
  const D = (globalThis.DUMEN = globalThis.DUMEN || {});
  D.VERSION = '1.0.0';
  D.SAVE_VERSION = 2;

  D.deepFreeze = function deepFreeze(o) {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) {
      Object.freeze(o);
      for (const k of Object.keys(o)) deepFreeze(o[k]);
    }
    return o;
  };
  D.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  D.lerp = (a, b, t) => a + (b - a) * t;
  D.clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
  D.isInt = (n) => Number.isInteger(n);
  D.fmt = (n) => {
    const s = String(Math.round(n));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  D.sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);
  D.pad2 = (n) => (n < 10 ? '0' + n : '' + n);
  D.fmtTime = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    if (m >= 60) return Math.floor(m / 60) + 'sa ' + D.pad2(m % 60) + 'dk';
    return m + ':' + D.pad2(s);
  };
  // Hata sınıfı: işlem doğrulaması başarısız olduğunda fırlatılır, kullanıcıya gösterilir.
  D.TxError = class TxError extends Error {
    constructor(msg, code) { super(msg); this.code = code || 'TX'; this.userMessage = msg; }
  };
  D.fail = (msg, code) => { throw new D.TxError(msg, code); };
  D.assert = (cond, msg, code) => { if (!cond) D.fail(msg, code); };

  D.RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'boss'];
  D.RARITY_TR = { common: 'Yaygın', uncommon: 'Sıradışı', rare: 'Nadir', epic: 'Epik', legendary: 'Efsanevi', boss: 'Boss' };
  D.RARITY_ICON = { common: '●', uncommon: '◆', rare: '★', epic: '✦', legendary: '♛', boss: '☠' };
  D.RARITY_COLOR = { common: '#9aa6ad', uncommon: '#4fb36b', rare: '#3d8fe0', epic: '#a35ee0', legendary: '#f0a81c', boss: '#e0453d' };
  D.rarityRank = (r) => D.RARITIES.indexOf(r);
  D.BEHAVIORS = ['calm', 'wiggler', 'runner', 'heavy', 'trickster', 'berserk', 'boss'];
  D.BEHAVIOR_TR = { calm: 'Sakin', wiggler: 'Kıpır', runner: 'Kaçak', heavy: 'Ağır', trickster: 'Hilebaz', berserk: 'Çılgın', boss: 'Boss' };
  D.REGION_ORDER = ['EL', 'TS', 'PSK', 'YK', 'TB', 'BKM', 'KKD', 'BG'];
})();
