// systems/SkillMgr.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Audio } from '../core/AudioManager.js';
import { Game } from '../core/DistrictRuntimeCore.js';
import { G } from '../core/state.js';
import { SKILLS, SKILL_BY_ID } from '../data/skills.js';
import { Fx } from './Fx.js';

/* --------------------------- Skills --------------------------- */
export const SkillMgr = {
  count(list, id) { let n = 0; for (const s of list) if (s === id) n++; return n; },
  /** Deterministic: modifiers are always recomputed from scratch from the picked list. */
  compute(list) {
    const c = id => SkillMgr.count(list, id);
    const elem = c('electric_card') ? 'electric' : c('frozen_payment') ? 'frozen' : c('burning_receipt') ? 'burn' : c('toxic_payment') ? 'toxic' : null;
    return {
      extra: c('double_order'), rapid: c('rapid_payment'), pierce: c('piercing_card'), bounce: c('ricochet') ? 2 : 0,
      critC: 0.15 * c('critical_receipt'), critM: 0.5 * c('critical_receipt'), diag: c('diagonal_delivery') > 0, elem,
      helmet: c('reinforced_helmet'), shield: c('emergency_shield') > 0, cashback: c('cashback') > 0,
      pkgMul: c('protective_packaging') ? 0.7 : 1, steamPkgMul: c('heat_resistant_bag') ? 0.4 : 1,
      express: c('express_courier'), brake: c('emergency_brake') > 0, lastMinute: c('last_minute') > 0,
      shortcut: c('shortcut_expert') > 0, balance: c('perfect_balance') > 0,
    };
  },
  /** Three distinct, compatible random choices. Elemental skills are mutually exclusive. */
  roll(run) {
    const hasElem = run.skills.some(id => SKILL_BY_ID[id].cat === 'elemental');
    const pool = SKILLS.filter(s => SkillMgr.count(run.skills, s.id) < s.max && !(hasElem && s.cat === 'elemental')).map(s => s.id);
    run.rng.shuffle(pool); return pool.slice(0, 3);
  },
  apply(run, id) {
    run.skills.push(id); run.mods = SkillMgr.compute(run.skills);
    const p = G.player, old = p.maxHp; Game.recalc();
    if (id === 'reinforced_helmet') p.hp = Math.min(p.maxHp, p.hp + 25);
    else p.hp = Math.min(p.hp, p.maxHp);
    if (id === 'emergency_shield') { p.shield = true; p.shieldCd = 8; }
    Fx.ring(p.x, p.y - 8, '#ffd166', 36); Audio.play('skill');
    void old;
  },
};
