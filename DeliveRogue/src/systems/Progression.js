// systems/Progression.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { RNG } from '../core/util.js';
import { CONFIG } from '../data/config.js';
import { chapterKey } from '../data/ids.js';
import { Save } from '../core/SaveManager.js';
import { CHAPTERS, MASTERY_CHECK, MASTERY_REWARD, MASTERY_TEXT } from '../data/chapters.js';
import { COSMETICS } from '../data/cosmetics.js';
import { GARAGE_MAX, garageCost } from '../data/garage.js';
import { MILESTONES, QUESTS, xpToNext } from '../data/quests.js';

/* ========================= Progression =========================
   Reward settlement runs EXACTLY once per run id (guarded by
   Save.data.settled). Everything is committed to localStorage at once.
   =============================================================== */
export const Progression = (() => {
  function addXp(s, v) { let ups = 0; s.xp += v; while (s.xp >= xpToNext(s.level)) { s.xp -= xpToNext(s.level); s.level++; ups++; } return ups; }
  function questDone(s, q) { return (s.stats[q.stat] || 0) >= q.target; }
  function settle(run) {
    const s = Save.data, ch = run.ch, i = ch.n - 1, st = run.stats;
    if (s.settled.includes(run.id)) return run.settled;
    const res = { success: run.success, reason: run.reason, n: ch.n, coins: 0, base: 0, xp: 0, stars: 0, grade: 'F', first: false, firstBonus: 0, perfBonus: 0, killBonus: 0,
      unlockedNext: false, newBest: false, mastery: [], levelUps: 0, epComplete: false, milestones: [], quests: [], consolation: 0, level: s.level };
    s.settled.push(run.id); if (s.settled.length > 40) s.settled.splice(0, s.settled.length - 40);
    if (run.reason === 'quit') { Save.write(); return res; } // abort: Mystery rule stays fixed (no free reroll)
    if (run.mysteryRule && s.mysteries) delete s.mysteries[chapterKey('campaign', 'COF', ch.n)]; // real terminal result -> new Mystery next attempt
    const qBefore = QUESTS.filter(q => questDone(s, q)).map(q => q.id);
    const base = ch.coins; res.base = base;
    if (run.success) {
      const stars = 1 + (st.pkgPct >= 0.7 ? 1 : 0) + (st.time <= ch.fast ? 1 : 0);
      res.stars = stars; res.grade = ['F', 'B', 'A', 'S'][stars];
      res.first = !s.completed[i];
      res.firstBonus = res.first ? Math.round(base * 0.5) : 0;
      res.perfBonus = stars === 3 ? Math.round(base * 0.2) : stars === 2 ? Math.round(base * 0.1) : 0;
      res.killBonus = Math.min(st.kills * 2, Math.round(base * 0.1));
      // Phase 03 economy skills: applied only on successful settlement, once (inside the settled guard).
      const m = run.mods || {}; let pct = m.coinGold || 0;
      if (m.lucky && RNG((run.seed ^ 0x51ED270B) >>> 0).next() < 0.25) { pct += 0.2; res.lucky = true; }
      if (m.bonusContract && st.time <= ch.fast) pct += m.bonusContract;
      if (m.eliteBounty) pct += Math.min(0.2, 0.05 * (st.eliteKills || 0));
      res.skillBonus = Math.round(base * Math.min(0.85, pct));
      res.pkgBonus = Math.round(base * ((run.pkg && run.pkg.reward) || 1) - base); // package reward (Mystery: +40 % once)
      if (ch.boss && st.bossKill && !s.bossClears.COF) { res.bossFirst = CONFIG.bossFirstClearCoins.COF || 0; s.bossClears.COF = true; s.legacyFinalClear = false; }
      res.coins = base + res.firstBonus + res.perfBonus + res.killBonus + res.skillBonus + res.pkgBonus + (res.bossFirst || 0);
      res.xp = 40 + 15 * ch.n; if (res.first) res.xp = Math.round(res.xp * 1.5); if (stars === 3) res.xp += 10;
      s.completed[i] = true; res.prevStars = s.stars[i]; if (stars > s.stars[i]) s.stars[i] = stars;
      if (!s.bestTime[i] || st.time < s.bestTime[i]) { res.newBest = !!s.bestTime[i]; s.bestTime[i] = Math.round(st.time * 10) / 10; }
      if (ch.n < CHAPTERS.length && s.unlocked < ch.n + 1) { s.unlocked = ch.n + 1; res.unlockedNext = true; }
      if (ch.boss && s.bossClears.COF && !s.episodes.coffee) { s.episodes.coffee = true; res.epComplete = true; }
      if (st.bossKill) s.stats.bossKills = (s.stats.bossKills || 0) + 1;
      s.stats.deliveries++; if (st.pkgPct >= 0.7) s.stats.pkg70++;
      const rid = run.pkg ? run.pkg.ruleId : ch.pkg; if (rid === 'FRAGILE_ORDER') s.stats.fragileDone++; if (rid === 'HEAVY_PACKAGE') s.stats.heavyDone++; if (stars === 3) s.stats.threeStarRuns++;
      ch.mastery.forEach((m, k) => {
        const key = ch.id + '_' + k;
        if (!s.mastery[key] && MASTERY_CHECK[m.k](m, st, ch)) { s.mastery[key] = true; s.stats.mastery++; res.coins += MASTERY_REWARD; res.mastery.push(MASTERY_TEXT[m.k](m)); }
      });
    } else {
      s.stats.failures++;
      const pr = st.progress || 0;
      if (pr >= 0.3 && st.time >= 15) { res.consolation = Math.min(Math.round(base * 0.15 * pr), Math.round(base * 0.15)); res.coins = res.consolation; res.xp = Math.round((20 + 5 * ch.n) * pr * 0.5); }
    }
    s.stats.kills += st.kills; s.stats.eliteKills += st.eliteKills;
    s.coins += res.coins; res.levelUps = addXp(s, res.xp); res.level = s.level;
    MILESTONES.forEach(m => { if (!s.milestones.unlocked[m.id] && m.check(s)) { s.milestones.unlocked[m.id] = true; res.milestones.push(m.name); } });
    QUESTS.forEach(q => { if (!qBefore.includes(q.id) && !s.quests.claimed[q.id] && questDone(s, q)) res.quests.push(q.text); });
    Save.write();
    return res;
  }
  function claimQuest(id) { const s = Save.data, q = QUESTS.find(x => x.id === id); if (!q || s.quests.claimed[id] || !questDone(s, q)) return false; s.quests.claimed[id] = true; s.coins += q.reward; Save.write(); return true; }
  function claimMilestone(id) { const s = Save.data, m = MILESTONES.find(x => x.id === id); if (!m || !s.milestones.unlocked[id] || s.milestones.claimed[id]) return false; s.milestones.claimed[id] = true; s.coins += m.reward; Save.write(); return true; }
  function buyUpgrade(id) { const s = Save.data, l = s.garage[id]; if (l >= GARAGE_MAX) return false; const c = garageCost(id, l); if (s.coins < c) return false; s.coins -= c; s.garage[id] = l + 1; Save.write(); return true; }
  function buySkin(id) { const s = Save.data, c = COSMETICS.find(x => x.id === id); if (!c || s.cosmetics.owned.includes(id) || s.level < c.lvl || s.coins < c.price) return false; s.coins -= c.price; s.cosmetics.owned.push(id); s.cosmetics.selected = id; Save.write(); return true; }
  function claimableCount() { const s = Save.data; return QUESTS.filter(q => !s.quests.claimed[q.id] && questDone(s, q)).length + MILESTONES.filter(m => s.milestones.unlocked[m.id] && !s.milestones.claimed[m.id]).length; }
  function totalStars() { return Save.data.stars.reduce((a, b) => a + b, 0); }
  return { settle, claimQuest, claimMilestone, buyUpgrade, buySkin, claimableCount, totalStars, questDone };
})();
