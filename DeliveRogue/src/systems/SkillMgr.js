// systems/SkillMgr.js — run skill / evolution system (Phase 03).
// - compute(): derived modifiers are ALWAYS recomputed from scratch from the picked skill list + evolutions
//   (no double stacking); hard caps are applied in Game.recalc().
// - offer(): 3 distinct eligible options drawn with the run's dedicated seeded stream (`run.srng`) using
//   rarity class weights 55/30/12/3. Filters: max rank, prerequisites, one base element, chapter context
//   (checkpoint / boss / package type). An eligible evolution always takes one slot. If nothing is valid the
//   limited utility fallback is offered — never a fake choice.
import { Audio } from '../core/AudioManager.js';
import { Game } from '../core/DistrictRuntimeCore.js';
import { G } from '../core/state.js';
import { SKILLS, SKILL_BY_ID, EVOLUTIONS, EVO_BY_ID, RARITY, FALLBACK } from '../data/skills.js';
import { Fx } from './Fx.js';

const count = (list, id) => { let n = 0; for (const s of list) if (s === id) n++; return n; };
const maxed = (list, id) => count(list, id) >= SKILL_BY_ID[id].max;

/** Chapter / package context used for skill relevance filtering. */
export function skillContext(run) {
  const pk = run.pkg ? run.pkg.id : 'STANDARD_ORDER';
  return { checkpoint: !!run.ch.cp, boss: !!run.ch.boss, thermal: pk === 'HOT_ORDER' || pk === 'FROZEN_ORDER', fizzy: pk === 'FIZZY_ORDER' };
}

export const SkillMgr = {
  count,
  /** Pure: modifiers from skills + evolutions. */
  compute(list, evos = []) {
    const c = id => count(list, id), E = id => evos.includes(id);
    const elem = c('electric_card') ? 'electric' : c('frozen_payment') ? 'frozen' : c('burning_receipt') ? 'burn' : c('toxic_payment') ? 'toxic' : null;
    const m = {
      // preserved 20
      extra: c('double_order'), extraMul: 0.6, rapid: c('rapid_payment'), intervalMul: 1, pierce: c('piercing_card'), pierceFall: 0.65,
      bounce: c('ricochet') ? 2 : 0, bounceFall: 0.7, critC: 0.15 * c('critical_receipt') + 0.08 * c('precision_payment'), critM: 0.5 * c('critical_receipt'),
      diag: c('diagonal_delivery') > 0, elem, helmet: c('reinforced_helmet'), hpAdd: 0, shield: c('emergency_shield') > 0, shieldCd: 8, cashback: c('cashback') > 0,
      pkgMul: c('protective_packaging') ? 0.7 : 1, steamPkgMul: c('heat_resistant_bag') ? 0.4 : 1, express: c('express_courier'), brake: c('emergency_brake') > 0,
      lastMinute: c('last_minute') > 0, shortcut: c('shortcut_expert') > 0, balance: c('perfect_balance') > 0, kbMul: c('perfect_balance') ? 0.4 : 1,
      // new attack
      dmgMul: 1 + 0.15 * c('power_transaction'), rangeMul: 1 + 0.15 * c('extended_signal'), every5: c('overcharged_pos') ? 1.75 : 0, every3: c('triple_transaction') ? 1.5 : 0,
      knock: c('heavy_receipt') > 0, explode: c('explosive_card') > 0, execute: c('execution_receipt') ? 0.35 : 0, eliteMul: c('elite_collector') ? 1.25 : 1,
      bossMul: c('boss_invoice') ? 1.25 : 1, pointBlank: c('point_blank') > 0, longDist: c('long_distance_payment') > 0,
      // new elemental supports
      chainMul: c('static_charge') ? 1.25 : 1, thunder: c('thunder_strike') ? { ch: 0.15, r: 40, cd: 1.5, mul: 0.6 } : null, slowDur: c('frostbite') ? 1.5 : 1,
      slowMul: 0.55, slowedBonus: c('ice_shatter') ? 0.2 : 0, flameBurst: c('flame_burst') > 0, dotMul: c('heatwave') ? 1.35 : 1, venom: c('venom_spread') ? 2 : 0,
      poisonDur: 4, corrode: c('corrosion') ? 0.15 : 0,
      // new defense
      drAdd: 0.1 * c('heavy_armor'), cpHeal: c('first_aid_kit') ? 0.15 : 0, impactPkgMul: c('shock_absorber') ? 0.7 : 1, thermalDecayMul: c('insulated_box') ? 0.75 : 1,
      heatExMul: c('cooling_system') ? 0.75 : 1, lastStand: c('last_stand') ? 0.2 : 0, cpPkg: c('package_repair') ? 0.15 : 0,
      // new movement
      turbo: c('turbo_delivery') > 0, slowResist: c('quick_recovery') ? 0.4 : 0, fizzyMul: c('smooth_rider') ? 0.7 : 1, slickMul: c('light_footprint') ? 0.75 : 1,
      timeBonus: c('time_extension') ? 8 : 0, cpBoost: c('checkpoint_boost') > 0, finalSprint: c('final_sprint') > 0, speedMul: 1,
      // economy / utility
      coinGold: c('golden_receipt') ? 0.15 : 0, lucky: c('lucky_customer') > 0, xpMul: c('fast_learner') ? 1.15 : 1, bonusContract: c('bonus_contract') ? 0.2 : 0,
      eliteBounty: c('elite_bounty') > 0, rerollGrant: c('second_choice'),
      // evolution flags
      barrage: false, atomic: false, bounceChain: false, pierceFreeze: false, critBurn: false, wildfire: false, acid: false, guardian: false,
    };
    if (E('payment_storm')) { m.extraMul = 1.0; m.intervalMul *= 0.85; }
    if (E('infinity_receipt')) { m.pierce = 3; m.bounce = 4; m.pierceFall = 0.85; m.bounceFall = 0.85; }
    if (E('perfect_transaction')) { m.critC += 0.15; m.critM += 0.75; }
    if (E('card_barrage')) m.barrage = true;
    if (E('atomic_payment')) m.atomic = true;
    if (E('titan_breaker')) { m.eliteMul = 1.6; m.bossMul = 1.6; }
    if (E('chain_reaction')) m.bounceChain = true;
    if (E('thunder_network')) m.thunder = { ch: 0.3, r: 60, cd: 1.0, mul: 0.8 };
    if (E('absolute_zero')) m.pierceFreeze = true;
    if (E('glacial_impact')) m.slowedBonus = 0.45;
    if (E('inferno_receipt')) m.critBurn = true;
    if (E('wildfire')) m.wildfire = true;
    if (E('pandemic_payment')) { m.venom = 4; m.poisonDur = 6; }
    if (E('acid_transaction')) m.acid = true;
    if (E('iron_courier')) { m.hpAdd = 40; m.drAdd += 0.1; }
    if (E('guardian_protocol')) { m.shieldCd = 5; m.guardian = true; }
    if (E('fortress_package')) { m.pkgMul = 0.5; m.steamPkgMul = 0.25; }
    if (E('thermal_master')) { m.thermalDecayMul = 0.4; m.heatExMul = 0.4; }
    if (E('unstoppable_courier')) { m.speedMul = 1.15; m.kbMul = 0.2; m.slickMul *= 0.4; }
    if (E('golden_route')) { m.coinGold = 0.45; m.bonusContract = 0; }
    return m;
  },
  /** Is skill `id` eligible right now for this run? (max rank, prerequisite, element rule, context) */
  eligible(run, id, ctx = skillContext(run)) {
    const s = SKILL_BY_ID[id]; if (!s) return false;
    if (maxed(run.skills, id)) return false;
    if (s.prereq && !run.skills.includes(s.prereq)) return false;
    if (s.base && run.skills.some(k => SKILL_BY_ID[k].base && k !== id)) return false;
    if (s.req && !ctx[s.req]) return false;
    return true;
  },
  /** Evolutions whose two prerequisites are at max rank, not yet taken, and whose skills are not used by another evolution. */
  eligibleEvos(run) {
    const used = new Set(); run.evos.forEach(id => { const e = EVO_BY_ID[id]; used.add(e.a); used.add(e.b); });
    return EVOLUTIONS.filter(e => !run.evos.includes(e.id) && maxed(run.skills, e.a) && maxed(run.skills, e.b) && !used.has(e.a) && !used.has(e.b)).map(e => e.id);
  },
  /** Build an offer of up to 3 distinct options. Deterministic for a given run seed + pick history. */
  offer(run, { ensureAttack = false } = {}) {
    const rng = run.srng, ctx = skillContext(run), out = [];
    const evos = this.eligibleEvos(run);
    if (evos.length) out.push(evos[Math.floor(rng.next() * evos.length)]);
    let pool = SKILLS.filter(s => this.eligible(run, s.id, ctx)).map(s => s.id);
    const pickWeighted = list => {
      const cls = {}; list.forEach(id => { const r = SKILL_BY_ID[id].rarity; cls[r] = (cls[r] || 0) + 1; });
      const w = list.map(id => RARITY[SKILL_BY_ID[id].rarity].w / cls[SKILL_BY_ID[id].rarity]);
      let t = rng.next() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < list.length; i++) { t -= w[i]; if (t <= 0) return list[i]; }
      return list[list.length - 1];
    };
    if (ensureAttack && !out.length) { const atk = pool.filter(id => SKILL_BY_ID[id].cat === 'attack'); if (atk.length) { const id = pickWeighted(atk); out.push(id); pool = pool.filter(x => x !== id); } }
    while (out.length < 3 && pool.length) { const id = pickWeighted(pool); out.push(id); pool = pool.filter(x => x !== id); }
    if (!out.length) out.push(FALLBACK.id);
    return out;
  },
  kindOf(id) { return EVO_BY_ID[id] ? 'evo' : id === FALLBACK.id ? 'fallback' : 'skill'; },
  /** Apply one validated choice atomically, then recompute everything from scratch. */
  apply(run, id) {
    const kind = this.kindOf(id), p = G.player;
    if (kind === 'evo') run.evos.push(id);
    else if (kind === 'skill') run.skills.push(id);
    run.mods = this.compute(run.skills, run.evos);
    Game.recalc();
    if (kind === 'fallback') { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.2); p.pkgHp = Math.min(p.pkgMax, p.pkgHp + p.pkgMax * 0.1); }
    else if (id === 'reinforced_helmet') p.hp = Math.min(p.maxHp, p.hp + 25);
    else if (id === 'iron_courier') p.hp = Math.min(p.maxHp, p.hp + 40);
    else p.hp = Math.min(p.hp, p.maxHp);
    if (id === 'emergency_shield' || id === 'guardian_protocol') { p.shield = true; p.shieldCd = run.mods.shieldCd; }
    if (id === 'second_choice') run.rerolls += 1; // single grant (max rank 1)
    if (id === 'time_extension') run.timer += 8;     // single grant (max rank 1)
    Fx.ring(p.x, p.y - 8, kind === 'evo' ? '#b78cff' : '#ffd166', kind === 'evo' ? 52 : 36); Audio.play('skill');
  },
};
