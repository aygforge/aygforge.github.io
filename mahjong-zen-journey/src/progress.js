/*
 * Mahjong: Zen Journey — LevelManager / progression rules (DOM-free).
 * Save schema, import validation + migration, unlocks, stars, statistics
 * and achievements. Pure functions over a plain save object.
 */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MJCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MJProgress = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  const GAME_ID = 'mahjong-zen-journey';
  const SAVE_VERSION = 1;
  const N = Core.LEVEL_COUNT;

  const ACHIEVEMENTS = [
    { id: 'first_match', name: 'İlk Eşleşme', desc: 'İlk eşleştirmeni yap.' },
    { id: 'perfect_start', name: 'Kusursuz Başlangıç', desc: 'Bir bölümü 3 yıldızla tamamla.' },
    { id: 'apprentice', name: 'Zen Çırağı', desc: 'Beş rehberli bölümün hepsini tamamla.' },
    { id: 'final_challenger', name: 'Final Fatihi', desc: 'Bir dünyanın Final Mücadelesini kazan.' },
    { id: 'first_journey', name: 'İlk Yolculuk', desc: 'Bambu Bahçesi dünyasını tamamla.' },
    { id: 'levels_25', name: '25 Bölüm Tamamlandı', desc: '25 farklı bölümü tamamla.' },
    { id: 'levels_100', name: '100 Bölüm Tamamlandı', desc: '100 farklı bölümü tamamla.' },
    { id: 'levels_250', name: '250 Bölüm Tamamlandı', desc: '250 farklı bölümü tamamla.' },
    { id: 'mahjong_master', name: 'Mahjong Ustası', desc: '500 bölümün hepsini tamamla.' },
    { id: 'three_star_100', name: '100 Üç Yıldızlı Bölüm', desc: '100 bölümde 3 yıldız kazan.' },
    { id: 'all_stars', name: '1500 Yıldızın Tamamı', desc: 'Yolculuktaki her yıldızı topla.' },
    { id: 'pure_mind', name: 'Saf Zihin', desc: '80+ taşlı bir bölümü ipucu, karıştırma veya geri alma kullanmadan bitir.' },
    { id: 'serenity', name: 'Dinginlik Serisi', desc: 'Üst üste 10 bölümde 3 yıldız kazan.' },
    { id: 'pairs_1000', name: 'Bin Çift', desc: '1.000 eşleştirme yap.' },
    { id: 'pairs_10000', name: 'On Bin Çift', desc: '10.000 eşleştirme yap.' },
    { id: 'explorer', name: 'Kâşif', desc: '20 yerleşim ailesinin hepsinde bir bölüm tamamla.' },
    { id: 'zen_hour', name: 'Zen Saati', desc: 'Yolculuğunda bir saat geçir.' },
    { id: 'dragons_crown', name: 'Ejderha Tacı', desc: 'Son dünyayı tamamla.' }
  ];

  function defaultSave() {
    return {
      game: GAME_ID, version: SAVE_VERSION, updatedAt: 0,
      progress: { unlocked: 1, stars: new Array(N).fill(0), bestTime: new Array(N).fill(0), bestMoves: new Array(N).fill(0) },
      stats: { playTimeMs: 0, matches: 0, hints: 0, shuffles: 0, undos: 0, wins: 0, perfect: 0, streak3: 0, bestStreak3: 0, families: new Array(Core.FAMILIES.length).fill(0), firstPlayedAt: 0 },
      achievements: {},
      settings: { music: true, sfx: true, volume: 0.6, effects: true },
      seen: { worlds: [], tips: {} },
      current: null
    };
  }

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const nonNeg = (v, d) => (Number.isFinite(v) && v >= 0 ? v : d);
  function numArray(src, len, max) {
    const out = new Array(len).fill(0);
    if (Array.isArray(src)) for (let i = 0; i < len && i < src.length; i++) {
      const v = Math.floor(nonNeg(src[i], 0));
      out[i] = max !== undefined ? Math.min(max, v) : v;
    }
    return out;
  }

  function migrate(obj) {
    // Version 1 is the first public format. Future versions add steps here.
    return obj;
  }

  // Validates untrusted save data (localStorage, IndexedDB or an imported file).
  // Throws an Error with a user-readable message if it is not a usable save.
  function sanitizeSave(raw) {
    let obj = raw;
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch (e) { throw new Error('Dosya geçerli bir JSON değil.'); }
    }
    if (!isObj(obj)) throw new Error('Dosyada bir kayıt bulunmuyor.');
    if (obj.game !== GAME_ID) throw new Error('Bu bir Mahjong: Zen Journey kaydı değil.');
    if (!Number.isInteger(obj.version) || obj.version < 1) throw new Error('Bilinmeyen kayıt sürümü.');
    if (obj.version > SAVE_VERSION) throw new Error('Bu kayıt oyunun daha yeni bir sürümünden geliyor (v' + obj.version + ').');
    obj = migrate(obj);
    const s = defaultSave();
    s.updatedAt = nonNeg(obj.updatedAt, 0);
    const p = isObj(obj.progress) ? obj.progress : {};
    s.progress.stars = numArray(p.stars, N, 3);
    s.progress.bestTime = numArray(p.bestTime, N);
    s.progress.bestMoves = numArray(p.bestMoves, N);
    let unlocked = Math.floor(nonNeg(p.unlocked, 1));
    // a level can't be cleared without being unlocked; keep data consistent
    let lastCleared = 0;
    s.progress.stars.forEach((v, i) => { if (v > 0) lastCleared = i + 1; });
    unlocked = Math.max(unlocked, Math.min(N, lastCleared + 1));
    s.progress.unlocked = Math.min(N, Math.max(1, unlocked));
    const st = isObj(obj.stats) ? obj.stats : {};
    for (const k of ['playTimeMs', 'matches', 'hints', 'shuffles', 'undos', 'wins', 'perfect', 'streak3', 'bestStreak3', 'firstPlayedAt']) s.stats[k] = Math.floor(nonNeg(st[k], 0));
    s.stats.families = numArray(st.families, Core.FAMILIES.length);
    if (isObj(obj.achievements)) {
      for (const a of ACHIEVEMENTS) if (Number.isFinite(obj.achievements[a.id])) s.achievements[a.id] = obj.achievements[a.id];
    }
    const se = isObj(obj.settings) ? obj.settings : {};
    if (typeof se.music === 'boolean') s.settings.music = se.music;
    if (typeof se.sfx === 'boolean') s.settings.sfx = se.sfx;
    if (typeof se.effects === 'boolean') s.settings.effects = se.effects;
    if (Number.isFinite(se.volume)) s.settings.volume = Math.min(1, Math.max(0, se.volume));
    if (isObj(obj.seen)) {
      if (Array.isArray(obj.seen.worlds)) s.seen.worlds = obj.seen.worlds.filter(w => Number.isInteger(w) && w >= 0 && w < Core.WORLD_COUNT);
      if (isObj(obj.seen.tips)) for (const k of Object.keys(obj.seen.tips)) if (obj.seen.tips[k] === true) s.seen.tips[k] = true;
    }
    if (isObj(obj.current) && Number.isInteger(obj.current.lv) && obj.current.lv >= 1 && obj.current.lv <= s.progress.unlocked) s.current = obj.current;
    return s;
  }

  function isUnlocked(save, n) { return n >= 1 && n <= save.progress.unlocked; }
  function worldUnlocked(save, w) { return isUnlocked(save, w * Core.WORLD_SIZE + 1); }
  function levelsCleared(save) { return save.progress.stars.filter(v => v > 0).length; }
  function totalStars(save) { return save.progress.stars.reduce((a, b) => a + b, 0); }
  function worldStats(save, w) {
    let cleared = 0, stars = 0;
    for (let i = w * Core.WORLD_SIZE; i < (w + 1) * Core.WORLD_SIZE; i++) {
      if (save.progress.stars[i] > 0) cleared++;
      stars += save.progress.stars[i];
    }
    return { cleared, stars, unlocked: worldUnlocked(save, w), complete: cleared === Core.WORLD_SIZE };
  }
  // Level the "Continue" button should open.
  function continueLevel(save) {
    if (save.current && isUnlocked(save, save.current.lv)) return save.current.lv;
    const u = save.progress.unlocked;
    if (save.progress.stars[u - 1] > 0) {
      // everything up to the frontier is cleared (frontier is level 500)
      return u;
    }
    return u;
  }
  function journeyComplete(save) { return levelsCleared(save) === N; }

  function grant(save, id, out) {
    if (save.achievements[id]) return;
    save.achievements[id] = Date.now();
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (a) out.push(a);
  }

  // Checks every achievement against the current save; returns newly earned ones.
  function checkAchievements(save, ctx) {
    const out = [];
    const cleared = levelsCleared(save);
    const stars = save.progress.stars;
    if (save.stats.matches >= 1) grant(save, 'first_match', out);
    if (stars.some(v => v === 3)) grant(save, 'perfect_start', out);
    if (stars.slice(0, 5).every(v => v > 0)) grant(save, 'apprentice', out);
    for (let w = 0; w < Core.WORLD_COUNT; w++) if (stars[(w + 1) * Core.WORLD_SIZE - 1] > 0) { grant(save, 'final_challenger', out); break; }
    if (stars.slice(0, 25).every(v => v > 0)) grant(save, 'first_journey', out);
    if (cleared >= 25) grant(save, 'levels_25', out);
    if (cleared >= 100) grant(save, 'levels_100', out);
    if (cleared >= 250) grant(save, 'levels_250', out);
    if (cleared >= N) grant(save, 'mahjong_master', out);
    if (stars.filter(v => v === 3).length >= 100) grant(save, 'three_star_100', out);
    if (totalStars(save) >= N * 3) grant(save, 'all_stars', out);
    if (ctx && ctx.pure) grant(save, 'pure_mind', out);
    if (save.stats.bestStreak3 >= 10) grant(save, 'serenity', out);
    if (save.stats.matches >= 1000) grant(save, 'pairs_1000', out);
    if (save.stats.matches >= 10000) grant(save, 'pairs_10000', out);
    if (save.stats.families.every(v => v > 0)) grant(save, 'explorer', out);
    if (save.stats.playTimeMs >= 3600000) grant(save, 'zen_hour', out);
    if (stars.slice(N - Core.WORLD_SIZE).every(v => v > 0)) grant(save, 'dragons_crown', out);
    return out;
  }

  function recordMatch(save) { save.stats.matches++; return checkAchievements(save); }

  // result: { stars, timeMs, moves, hints, shuffles, undos, tiles, family }
  function recordWin(save, n, result) {
    const i = n - 1;
    const p = save.progress;
    const firstClear = p.stars[i] === 0;
    const prevStars = p.stars[i];
    p.stars[i] = Math.max(prevStars, result.stars);
    const t = Math.max(1, Math.round(result.timeMs));
    if (!p.bestTime[i] || t < p.bestTime[i]) p.bestTime[i] = t;
    if (!p.bestMoves[i] || result.moves < p.bestMoves[i]) p.bestMoves[i] = result.moves;
    const st = save.stats;
    st.wins++;
    if (result.stars === 3) { st.perfect++; st.streak3++; } else st.streak3 = 0;
    st.bestStreak3 = Math.max(st.bestStreak3, st.streak3);
    if (result.family >= 0 && result.family < st.families.length) st.families[result.family]++;
    let unlockedNext = false;
    if (n < N && p.unlocked < n + 1) { p.unlocked = n + 1; unlockedNext = true; }
    const meta = Core.levelMeta(n);
    const worldComplete = meta.isFinal || worldStats(save, meta.world).complete;
    const newWorld = unlockedNext && meta.isFinal && n < N ? meta.world + 1 : -1;
    if (save.current && save.current.lv === n) save.current = null;
    const pure = result.tiles >= 80 && result.hints === 0 && result.shuffles === 0 && result.undos === 0;
    const achievements = checkAchievements(save, { pure });
    return {
      firstClear, prevStars, stars: result.stars, newBest: result.stars > prevStars,
      unlockedNext, newWorld, worldComplete, isFinal: meta.isFinal,
      gameComplete: n === N, journeyComplete: journeyComplete(save),
      nextLevel: n < N ? n + 1 : null, achievements
    };
  }

  return {
    GAME_ID, SAVE_VERSION, ACHIEVEMENTS,
    defaultSave, sanitizeSave, isUnlocked, worldUnlocked, levelsCleared, totalStars, worldStats,
    continueLevel, journeyComplete, checkAchievements, recordMatch, recordWin
  };
}));
