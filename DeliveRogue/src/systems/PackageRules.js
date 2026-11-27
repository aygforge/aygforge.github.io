// systems/PackageRules.js — runtime for the 12-package system (Master Prompt §10).
// Base stats (HP, speed, hazard/impact multipliers, reward) are read from data/packages.js. Special rules run
// only after pickup and only on simulation time (paused / skill choice = frozen because the engine doesn't tick):
//   HOT     temperature 100 -> decays over timer×1.35; steam contact re-warms; < 25 % = fail ('cold')
//   FROZEN  coldness 100 -> decays; heat hazards (active steam nearby / steam hits) melt faster; < 20 % = fail ('melt')
//   FIZZY   pressure rises on impacts, knockback and hard turns at speed (threshold + cooldown; joystick
//           micro-turns are ignored), falls during calm driving; 100 % = fail ('burst')
//   VIP     every required delivery needs >= 80 % of the real max package HP ('vip')
//   MYSTERY resolves (in RunPrep, seeded, fixed per attempt) to one compatible rule; its reward is +40 % once.
import { PACKAGES, MYSTERY_POOL, FINAL_FORBIDDEN, pkgOf } from '../data/packages.js';
import { CONFIG } from '../data/config.js';
import { RNG, hashStr, dist } from '../core/util.js';

/** Resolve a MYSTERY rule deterministically from (chapterKey, attempt) — never Mystery itself. */
export function resolveMystery(key, attempt, ch) {
  const pool = MYSTERY_POOL.filter(id => !(ch && ch.boss && FINAL_FORBIDDEN.includes(id)));
  const rng = RNG((hashStr(key + '#' + attempt + '#' + CONFIG.version) ^ 0x6D2B79F5) >>> 0);
  return pool[Math.floor(rng.next() * pool.length)];
}

export const PackageRules = {
  /** Effective package for a run: { def (stats), id (shown), ruleId (special rule source), reward }. */
  effective(pkgId, mysteryRule) {
    const shown = pkgOf(pkgId);
    if (shown.rule === 'mystery') { const r = PACKAGES[mysteryRule] || PACKAGES.STANDARD_ORDER; return Object.assign({}, r, { id: shown.id, shownAs: shown.id, ruleId: r.id, rule: r.rule, reward: shown.reward, color: shown.color, icon: shown.icon }); }
    return Object.assign({}, shown, { ruleId: shown.id });
  },
  init(run) {
    run.pkgState = { temp: 1, cold: 1, pressure: 0, calmT: 0, turnCd: 0, heading: null, vipFail: false };
  },
  /** Per-tick update; returns a fail reason or null. */
  update(run, p, dt, ctx) {
    if (!run.picked || run.ended) return null;
    const st = run.pkgState, rule = run.pkg.rule, m = run.mods;
    if (rule === 'hot') {
      st.temp -= dt / (run.timer * CONFIG.hot.decayOverTimer) * 0.75 * m.thermalDecayMul;
      if (ctx.nearSteam) st.temp = Math.min(1, st.temp + dt * CONFIG.hot.steamWarm / 100 * m.heatExMul);
      if (st.temp < CONFIG.hot.failAt) return 'cold';
    } else if (rule === 'frozen') {
      st.cold -= dt / (run.timer * CONFIG.frozen.decayOverTimer) * 0.8 * m.thermalDecayMul;
      if (ctx.nearSteam) st.cold -= dt * CONFIG.frozen.heatMelt / 100 * m.heatExMul;
      if (st.cold < CONFIG.frozen.failAt) return 'melt';
    } else if (rule === 'fizzy') {
      const F = CONFIG.fizzy; st.calmT += dt; st.turnCd -= dt;
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 60) {
        const h = Math.atan2(p.vy, p.vx);
        if (st.heading != null) { let d = Math.abs(h - st.heading); if (d > Math.PI) d = 2 * Math.PI - d; if (d > 1.75 && st.turnCd <= 0) this.event(run, 'turn'); }
        st.heading = h;
      } else st.heading = null;
      if (st.calmT > F.calmAfter) st.pressure = Math.max(0, st.pressure - F.calmRate * dt / 100);
      if (st.pressure >= 1) { st.pressure = 1; return 'burst'; }
    }
    return null;
  },
  /** Physical events: 'impact' | 'knock' | 'turn' | 'steam'. */
  event(run, kind) {
    if (!run.picked || !run.pkgState) return;
    const st = run.pkgState, rule = run.pkg.rule, m = run.mods;
    if (rule === 'fizzy' && kind !== 'steam') { const F = CONFIG.fizzy; st.pressure += F[kind] / 100 * m.fizzyMul; st.calmT = 0; if (kind === 'turn') st.turnCd = F.turnCd; }
    if (rule === 'frozen' && kind === 'steam') st.cold -= CONFIG.frozen.steamMelt / 100 * m.heatExMul;
    if (rule === 'hot' && kind === 'steam') st.temp = Math.min(1, st.temp + CONFIG.hot.steamWarm / 100 * m.heatExMul);
  },
  /** Delivery gate (each required drop). Returns a fail reason or null. */
  deliveryCheck(run, p) {
    if (run.pkg.rule === 'vip' && p.pkgHp / p.pkgMax < (run.pkg.vipMin || 0.8)) return 'vip';
    return null;
  },
  /** Is any active steam hazard close to the courier (heat exposure)? */
  nearSteam(G, p) {
    const near = (x, y, r) => dist(x, y, p.x, p.y) < r;
    for (const j of G.jets) if (j.ph === 'active' && Math.abs(j.y - p.y) < 40 && p.x > j.x0 - 30 && p.x < j.x1 + 30) return true;
    for (const g of G.grates) if (g.ph === 'active' && near(g.x, g.y, 48)) return true;
    for (const z of G.zones) if (z.t > z.warn && near(z.x, z.y, z.r + 30)) return true;
    return false;
  },
  /** HUD meter for the special rule (null when the package has none). */
  meter(run) {
    const st = run.pkgState, r = run.pkg.rule; if (!st) return null;
    if (r === 'hot') return { key: 'meter_hot', v: st.temp, fail: CONFIG.hot.failAt, c1: '#ffb06a', c2: '#e2531b' };
    if (r === 'frozen') return { key: 'meter_frozen', v: st.cold, fail: CONFIG.frozen.failAt, c1: '#bff4ff', c2: '#2bb3e8' };
    if (r === 'fizzy') return { key: 'meter_fizzy', v: st.pressure, fail: 1, rising: true, c1: '#b6ff9a', c2: '#3fbf6a' };
    if (r === 'vip') return { key: 'meter_vip', v: null };
    return null;
  },
};
