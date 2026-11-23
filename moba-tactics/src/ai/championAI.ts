import type { Unit } from '../core/unit';
import type { World } from '../core/world';
import type { Style } from '../core/types';
import { BALANCE } from '../core/config';
import { dist } from '../core/math';
import {
  BOSS_POS, CAMPS, FOUNTAIN_POS, LaneId, TeamId, laneDistance, laneLength, lanePoint, laneProgress, regionOf,
} from '../core/map';
import { canTarget } from '../core/combat';
import { costToNext, inBase } from '../core/shop';
import { perceptionFor, Perception } from './perception';
import { AIMode, SKILL_AI, SkillAICtx } from './skillAI';
import { CHAMP_BY_ID } from '../data/champions';

export const STYLE_PARAMS: Record<Style, { risk: number; retreatHp: number; chase: number; dive: boolean; harass: number }> = {
  aggressive: { risk: 1.35, retreatHp: 0.2, chase: 750, dive: true, harass: 0.8 },
  balanced: { risk: 1.0, retreatHp: 0.3, chase: 560, dive: false, harass: 0.45 },
  defensive: { risk: 0.75, retreatHp: 0.42, chase: 380, dive: false, harass: 0.15 },
};

interface AIState {
  intent?: { type: string; id?: number; x?: number; y?: number; stop?: number };
  init?: boolean;
  taskReset?: boolean;
  retreating?: boolean;
  fightId?: number;
  campId?: number;
  autoRaid?: { lane: LaneId; until: number } | null;
  autoBoss?: { until: number } | null;
  healWaitUntil?: number;
  lastMode?: AIMode;
  focusId?: number;
  harassAt?: number;
  harassOk?: boolean;
}

export function unitPower(u: Unit): number {
  const hp = u.hp + u.shieldTotal;
  switch (u.kind) {
    case 'champion': return hp * (u.stats.ad * u.stats.as + u.stats.ap * 0.8 + 30 + u.champ!.level * 9);
    case 'minion': return hp * u.stats.ad * u.stats.as * 0.5;
    case 'summon': return hp * u.stats.ad * u.stats.as * 0.7;
    default: return 0;
  }
}

/** local fight evaluation from the team's perception only */
export function fightRatio(P: Perception, x: number, y: number, r = 750): number {
  let a = 0, e = 0;
  for (const u of P.alliesNear(x, y, r)) if (u.kind === 'champion' || u.kind === 'summon' || u.kind === 'minion') a += unitPower(u);
  for (const u of P.enemiesNear(x, y, r)) if (u.kind === 'champion' || u.kind === 'summon' || u.kind === 'minion') e += unitPower(u);
  // structures
  const et = P.enemyTowerCovering(x, y, 40);
  if (et) {
    const tankers = P.alliesNear(et.x, et.y, et.stats.range, 'minion').length;
    e += tankers > 0 ? 250000 : 900000;
  }
  for (const t of P.ownTowers()) if (dist(t.x, t.y, x, y) <= t.stats.range) a += 500000;
  return (a + 1) / (e + 1);
}

function burst(w: World, u: Unit): number {
  const c = u.champ!;
  const L = c.level - 1;
  let b = u.stats.ad * u.stats.as * 3 + 40;
  for (const k of ['s1', 's2', 'ult'] as const) if (w.skillReady(u, k)) b += (k === 'ult' ? 150 : 65 + 18 * L) + 0.6 * (u.stats.ad + u.stats.ap);
  return b;
}

function hitDamage(u: Unit, t: Unit): number {
  return u.stats.ad * (100 / (100 + Math.max(0, t.stats.armor * (1 - u.stats.armorPen))));
}

const moveTo = (u: Unit, x: number, y: number, stop = 10) => { u.ai.intent = { type: 'move', x, y, stop }; };
const attack = (u: Unit, t: Unit) => { u.ai.intent = { type: 'attack', id: t.id }; };
const hold = (u: Unit) => { u.ai.intent = { type: 'hold' }; };

export function championThink(w: World, u: Unit) {
  const c = u.champ!;
  const team = u.team as TeamId;
  const P = perceptionFor(w, team);
  const ai = u.ai as AIState;
  const now = w.time;
  const sp = STYLE_PARAMS[c.style];
  const hpPct = u.hp / u.stats.maxHp;
  if (!ai.init) { ai.init = true; ai.autoRaid = null; ai.autoBoss = null; }
  if (ai.taskReset) { ai.taskReset = false; ai.campId = undefined; ai.autoRaid = null; ai.autoBoss = null; ai.retreating = c.order === 'retreat' ? true : ai.retreating; }
  if (!u.alive) return;

  const nearChamps = P.enemyChampsNear(u.x, u.y, 900);

  // ---------- recall channel ----------
  if (c.recallUntil > 0) {
    if (P.enemyChampsNear(u.x, u.y, 650).length) w.cancelRecall(u);
    else return;
  }

  // ---------- heal at base ----------
  if (inBase(u)) {
    if (ai.retreating && hpPct > 0.92) ai.retreating = false;
    if (c.order === 'retreat' && hpPct > 0.95) w.setOrder(u, c.baseOrder);
    if (hpPct < 0.9 && nearChamps.length === 0) {
      if (ai.healWaitUntil === undefined || ai.healWaitUntil < now - 10) ai.healWaitUntil = now + 8;
      if (now < ai.healWaitUntil!) { hold(u); return; }
    }
  }

  // ---------- retreat ----------
  if (!ai.retreating && hpPct < sp.retreatHp && (nearChamps.length > 0 || hpPct < sp.retreatHp * 0.6)) {
    // stay if the fight is clearly won and target almost dead
    const t = ai.fightId ? w.get(ai.fightId) : undefined;
    const finishing = t && t.alive && P.visible(t) && t.hp < burst(w, u) * 0.6 && fightRatio(P, t.x, t.y) > 1.2;
    if (!finishing) ai.retreating = true;
  }
  if (c.order === 'retreat' || ai.retreating) {
    retreat(w, u, P, ai);
    return;
  }

  // ---------- shop / low hp recall ----------
  if (!inBase(u) && now - c.lastCombat > 4 && P.enemyChampsNear(u.x, u.y, 1000).length === 0 && !['raid_top', 'raid_bot', 'boss'].includes(c.order) && !ai.autoBoss) {
    const cost = costToNext(u);
    const wantShop = c.gold >= cost && (hpPct < 0.75 || c.gold >= cost + 350 || c.gold >= 1100);
    if ((wantShop || hpPct < 0.38) && !bossFightNearby(w, u, P)) {
      if (w.startRecall(u)) return;
    }
  }

  // ---------- combat vs champions ----------
  const fightT = chooseChampTarget(w, u, P, ai, sp);
  if (fightT) {
    ai.fightId = fightT.id;
    attack(u, fightT);
    kite(w, u, fightT);
    castSkills(w, u, P, fightT, true, 'fight');
    return;
  }
  ai.fightId = undefined;

  // ---------- objective window: enemies dead -> push structures ----------
  const order = c.order;
  if (order !== 'defend' && order !== 'boss' && hpPct > 0.5) {
    const deadEnemies = P.enemyChampIds().filter((id) => P.enemyDead(id)).length;
    const crystal = P.enemyTowers().find((t) => t.kind === 'crystal');
    const crystalOpen = !!crystal && P.attackable(crystal) && hpPct > 0.55;
    if (crystalOpen && (w.tick + u.id) % 3 === 0 && siegeCrystal(w, u, P, crystal!, deadEnemies)) return;
    if (deadEnemies >= 2 || (deadEnemies >= 1 && w.minute() > 7 && c.style !== 'defensive')) {
      if (objectivePush(w, u, P)) return;
    }
  }

  // ---------- tasks ----------
  if (order === 'raid_top' || order === 'raid_bot') return raid(w, u, P, order === 'raid_top' ? 'top' : 'bot', true);
  if (order === 'boss') return bossTask(w, u, P, true);
  if (c.position === 'jungle') return jungle(w, u, P, ai);
  return lane(w, u, P, ai, order === 'push' ? 'push' : order === 'defend' ? 'defend' : 'farm');
}

/** Group up on the opened lane and siege the enemy crystal together with minions. */
function siegeCrystal(w: World, u: Unit, P: Perception, crystal: Unit, deadEnemies: number): boolean {
  const team = u.team as TeamId;
  // pick open lane (both enemy towers dead), prefer the one where our wave is closest to the crystal
  let laneId: LaneId | null = null, bestFront = -Infinity;
  for (const l of ['top', 'bot'] as LaneId[]) {
    if (P.enemyTowers().some((t) => t.kind === 'tower' && t.lane === l)) continue;
    const f = laneFront(w, P, l, team);
    const adv = f === null ? -9999 : team === 0 ? f : laneLength(l) - f;
    if (adv > bestFront) { bestFront = adv; laneId = l; }
  }
  if (!laneId) return false;
  const allies = P.allyChamps().filter((a) => a.alive && a.hp / a.stats.maxHp > 0.45);
  const grouped = allies.filter((a) => dist(a.x, a.y, u.x, u.y) < 700).length;
  const enemiesAlive = P.enemyChampIds().length - deadEnemies;
  const enough = grouped >= Math.min(allies.length, 2) || deadEnemies >= 2 || grouped > enemiesAlive;
  const minionsAtCrystal = P.alliesNear(crystal.x, crystal.y, crystal.stats.range + 120, 'minion').length;
  const front = laneFront(w, P, laneId, team);
  const rally = lanePoint(laneId, front !== null ? front - (team === 0 ? 1 : -1) * 120 : laneLength(laneId) / 2);
  const foe = P.enemiesNear(u.x, u.y, u.stats.range + 120).filter((e) => e.kind === 'champion' || e.kind === 'minion' || e.kind === 'summon').sort((a, b) => (a.kind === 'champion' ? -1 : 0) - (b.kind === 'champion' ? -1 : 0) || a.hp - b.hp)[0];
  if (enough && minionsAtCrystal > 0) {
    const t = foe && foe.kind === 'champion' && fightRatio(P, foe.x, foe.y) > 0.8 ? foe : crystal;
    attack(u, t);
    castSkills(w, u, P, t, t.kind === 'champion', t.kind === 'champion' ? 'fight' : 'push');
    return true;
  }
  if (foe) { attack(u, foe); castSkills(w, u, P, foe, foe.kind === 'champion', foe.kind === 'champion' ? 'fight' : 'push'); return true; }
  moveTo(u, rally.x, rally.y, 60);
  return true;
}

/** push the most advanced attackable enemy structure that has allied minions near it */
function objectivePush(w: World, u: Unit, P: Perception): boolean {
  let best: Unit | null = null, bs = Infinity;
  for (const s of P.enemyTowers()) {
    if (!P.attackable(s)) continue;
    const mins = P.alliesNear(s.x, s.y, s.stats.range + 250, 'minion').length;
    if (!mins) continue;
    const d = dist(s.x, s.y, u.x, u.y) - (s.kind === 'crystal' ? 600 : 0);
    if (d < bs && d < 2200) { bs = d; best = s; }
  }
  if (!best) return false;
  const tankers = P.alliesNear(best.x, best.y, best.stats.range, 'minion').length;
  const foe = P.enemiesNear(u.x, u.y, u.stats.range + 150, (e) => e.kind === 'minion' || e.kind === 'summon' || e.kind === 'champion').sort((a, b) => a.hp - b.hp)[0];
  if (dist(u.x, u.y, best.x, best.y) > best.stats.range + 150 || !tankers || (best.targetId === u.id && tankers === 0)) {
    if (foe) { attack(u, foe); castSkills(w, u, P, foe, false, 'push'); return true; }
    const mm = P.alliesNear(best.x, best.y, best.stats.range + 250, 'minion')[0];
    moveTo(u, mm.x, mm.y, 40);
    return true;
  }
  attack(u, foe && foe.kind !== 'champion' && dist(foe.x, foe.y, u.x, u.y) < u.stats.range + 40 && best.targetId === u.id ? foe : best);
  castSkills(w, u, P, best, false, 'push');
  return true;
}

function bossFightNearby(w: World, u: Unit, P: Perception): boolean {
  for (const b of w.bosses) {
    const bu = b.unitId ? w.get(b.unitId) : undefined;
    if (!bu || !bu.alive || !P.visible(bu)) continue;
    if (bu.targetId && dist(bu.x, bu.y, u.x, u.y) < 1000) {
      const t = w.get(bu.targetId);
      if (t && t.team === u.team) return true;
    }
  }
  return false;
}

function retreat(w: World, u: Unit, P: Perception, ai: AIState) {
  const f = FOUNTAIN_POS[u.team as TeamId];
  const c = u.champ!;
  if (inBase(u)) { hold(u); return; }
  const threats = P.enemyChampsNear(u.x, u.y, 850);
  castSkills(w, u, P, threats[0], threats.length > 0 && threats[0].hp < burst(w, u) * 0.5, 'retreat');
  if (threats.length === 0 && w.time - c.lastCombat > 1.2 && !P.enemyTowerCovering(u.x, u.y)) {
    if (w.startRecall(u)) return;
  }
  // fight back if cornered by something killable
  const close = threats.find((t) => dist(t.x, t.y, u.x, u.y) < u.stats.range + 40 && t.hp < hitDamage(u, t) * 2);
  if (close) { attack(u, close); return; }
  moveTo(u, f.x, f.y, 30);
  void ai;
}

function chooseChampTarget(w: World, u: Unit, P: Perception, ai: AIState, sp: typeof STYLE_PARAMS.balanced): Unit | null {
  const c = u.champ!;
  const raidLane: LaneId | null = c.order === 'raid_top' ? 'top' : c.order === 'raid_bot' ? 'bot' : ai.autoRaid?.lane ?? null;
  const acquire = u.stats.range + (c.position === 'jungle' || raidLane ? 450 : 280);
  const cands = P.enemyChampsNear(u.x, u.y, Math.max(acquire, sp.chase));
  if (!cands.length) return null;
  const myBurst = burst(w, u);
  const risk = sp.risk * (raidLane ? 1.3 : 1) * (c.order === 'defend' ? 1.15 : 1);
  const role = CHAMP_BY_ID[c.defId].cls;
  let best: Unit | null = null, bestS = Infinity;
  for (const t of cands) {
    const d = dist(t.x, t.y, u.x, u.y);
    const isCur = ai.fightId === t.id;
    if (d > (isCur ? sp.chase : acquire)) continue;
    const killable = t.hp + t.shieldTotal < myBurst;
    const ratio = fightRatio(P, t.x, t.y);
    const tower = P.enemyTowerCovering(t.x, t.y, 20);
    if (tower) {
      const tank = P.alliesNear(tower.x, tower.y, tower.stats.range, 'minion').length > 0 && tower.targetId !== u.id;
      const dive = sp.dive && killable && u.hp / u.stats.maxHp > 0.5;
      if (!tank && !dive) continue;
    }
    const need = isCur ? 0.72 : 1.0;
    if (!(ratio * risk >= need || (killable && ratio * risk >= 0.5))) continue;
    // laners in farm mode with defensive style only take fights near their tower or when attacked
    if (c.position !== 'jungle' && !raidLane && c.order === 'farm' && !isCur) {
      const attacked = w.time - u.lastHitAt < 1.5 && u.lastHitBy === t.id;
      if (ai.harassAt === undefined || w.time > ai.harassAt) { ai.harassAt = w.time + 2.5; ai.harassOk = w.rng.next() < sp.harass; }
      if (!attacked && !killable && !ai.harassOk) continue;
    }
    let s = t.hp / t.stats.maxHp * 100 + d * 0.08 - (killable ? 45 : 0) - (isCur ? 25 : 0);
    if ((role === 'assassin' || c.defId === 'tharok') && ['mage', 'marksman', 'summoner'].includes(CHAMP_BY_ID[t.sub].cls)) s -= 25;
    if (t.isCC(w.time)) s -= 15;
    if (s < bestS) { bestS = s; best = t; }
  }
  return best;
}

/** Ranged champions keep distance from melee threats (Tessa kites while attacking) */
function kite(w: World, u: Unit, t: Unit) {
  if (u.stats.range < 200) return;
  const d = dist(u.x, u.y, t.x, t.y);
  const melee = t.stats.range < 200;
  if (melee && d < u.stats.range * 0.55 && w.time < u.attackReadyAt - 0.1) {
    const f = FOUNTAIN_POS[u.team as TeamId];
    const dx = u.x - t.x + (f.x - u.x) * 0.15, dy = u.y - t.y + (f.y - u.y) * 0.15;
    const l = Math.hypot(dx, dy) || 1;
    u.ai.intent = { type: u.data.kite ? 'attack' : 'move', id: t.id, x: u.x + (dx / l) * 120, y: u.y + (dy / l) * 120, stop: 4 };
  }
}

function castSkills(w: World, u: Unit, P: Perception, focus: Unit | undefined, fight: boolean, mode: AIMode) {
  if (!w.canAct(u)) return;
  const c = u.champ!;
  const sk = SKILL_AI[c.defId];
  const ctx: SkillAICtx = { w, u, P, focus, fight, mode, style: c.style, hpPct: u.hp / u.stats.maxHp, L: c.level - 1 };
  for (const key of ['ult', 's2', 's1'] as const) {
    if (!w.skillReady(u, key)) continue;
    const plan = sk[key](ctx);
    if (plan && w.castSkill(u, key, plan)) return;
  }
}

// ------------------------------------------------------------------ lanes
function laneFront(w: World, P: Perception, lane: LaneId, team: TeamId): number | null {
  let best: number | null = null;
  for (const m of P.alliesNear(1600, 900, 4000, 'minion')) {
    if (m.lane !== lane) continue;
    const s = laneProgress(lane, m.x, m.y);
    if (best === null || (team === 0 ? s > best : s < best)) best = s;
  }
  return best;
}

function ownFrontTower(P: Perception, lane: LaneId, team: TeamId): Unit | null {
  const ts = P.ownTowers().filter((t) => t.kind === 'tower' && t.lane === lane);
  if (!ts.length) return null;
  ts.sort((a, b) => (team === 0 ? b.x - a.x : a.x - b.x));
  return ts[0];
}

function lane(w: World, u: Unit, P: Perception, ai: AIState, mode: 'farm' | 'push' | 'defend') {
  const c = u.champ!;
  const team = u.team as TeamId;
  const laneId: LaneId = c.lane ?? 'top';
  const dir = team === 0 ? 1 : -1;
  const ranged = u.stats.range > 200;
  const now = w.time;

  // help jungler on boss when close
  if (!c.lane || mode !== 'defend') {
    for (const b of w.bosses) {
      const bu = b.unitId ? w.get(b.unitId) : undefined;
      if (bu && bu.alive && P.visible(bu) && dist(bu.x, bu.y, u.x, u.y) < 1000 && bu.targetId) {
        const jg = P.allyChamps().find((a) => a.champ!.position === 'jungle' && a.alive && dist(a.x, a.y, bu.x, bu.y) < 450);
        const t = w.get(bu.targetId);
        if (jg && t && t.team === team && dist(bu.x, bu.y, u.x, u.y) < 800 && P.enemyChampsNear(u.x, u.y, 1200).length <= 1 && w.minute() > 4) {
          attack(u, bu);
          castSkills(w, u, P, bu, false, 'boss');
          return;
        }
      }
    }
  }

  // auto-defend: own tower in our lane attacked by visible enemies
  const tw = ownFrontTower(P, laneId, team);
  let effMode: 'farm' | 'push' | 'defend' = mode;
  if (mode === 'farm' && !c.baseFromCmd) {
    const enemyLaneTowers = P.enemyTowers().filter((t) => t.kind === 'tower' && t.lane === laneId).length;
    const opp = P.enemyChampIds().map((id) => w.get(id)!).find((e) => e.champ!.lane === laneId);
    const oppDead = !!opp && P.enemyDead(opp.id);
    if (enemyLaneTowers === 0 || oppDead || (w.minute() >= 6 && c.style !== 'defensive' && u.hp / u.stats.maxHp > 0.6)) effMode = 'push';
  }
  if (tw && mode !== 'push') {
    const attackers = P.enemiesNear(tw.x, tw.y, tw.stats.range + 120, (e) => e.kind === 'champion' || e.kind === 'minion');
    if (attackers.length >= 3 || attackers.some((a) => a.kind === 'champion' && a.targetId === tw.id)) effMode = 'defend';
  }

  // pick minion/structure target
  const acq = u.stats.range + 260;
  const center = effMode === 'defend' && tw ? tw : u;
  const foes = P.enemiesNear(center.x, center.y, effMode === 'defend' ? 700 : acq, (e) => e.kind === 'minion' || e.kind === 'summon');
  const allyMinions = P.alliesNear(u.x, u.y, 700, 'minion');
  let target: Unit | null = null;
  const lasthit = foes.filter((m) => m.hp <= hitDamage(u, m) * 1.02 && dist(m.x, m.y, u.x, u.y) < u.stats.range + 160).sort((a, b) => a.hp - b.hp || a.id - b.id)[0];
  if (lasthit) target = lasthit;
  else if (effMode === 'push' || effMode === 'defend') target = foes.sort((a, b) => a.hp - b.hp || a.id - b.id)[0] ?? null;
  else if (foes.length) {
    const soon = foes.some((m) => m.hp < hitDamage(u, m) * 2.3 && dist(m.x, m.y, u.x, u.y) < u.stats.range + 100);
    if (!soon && (foes.length > allyMinions.length + 1 || allyMinions.length === 0)) target = foes.sort((a, b) => b.hp - a.hp || a.id - b.id)[0];
    else if (!soon && c.style === 'aggressive') target = foes.sort((a, b) => b.hp - a.hp || a.id - b.id)[0];
  }
  // structures
  if (!target) {
    for (const s of P.enemyTowers()) {
      if (!P.attackable(s) || dist(s.x, s.y, u.x, u.y) > acq + 200) continue;
      const tankers = P.alliesNear(s.x, s.y, s.stats.range, 'minion').length;
      const safe = tankers > 0 && s.targetId !== u.id;
      if (safe || (effMode === 'push' && c.style === 'aggressive' && s.hp < s.stats.maxHp * 0.15 && u.hp / u.stats.maxHp > 0.6)) { target = s; break; }
    }
  }
  // enemy tower danger: tower targeting me and no reason to stay
  const danger = P.enemyTowerCovering(u.x, u.y, 30);
  if (danger && (danger.targetId === u.id || P.alliesNear(danger.x, danger.y, danger.stats.range, 'minion').length === 0) && !(target && target.isStructure && target.hp < 120)) {
    const back = lanePoint(laneId, laneProgress(laneId, danger.x, danger.y) - dir * (danger.stats.range + 80));
    moveTo(u, back.x, back.y, 10);
    castSkills(w, u, P, target ?? undefined, false, effMode);
    return;
  }
  if (target) {
    // don't walk into enemy tower range for a minion without tankers
    const tc = P.enemyTowerCovering(target.x, target.y, 0);
    if (!target.isStructure && tc && P.alliesNear(tc.x, tc.y, tc.stats.range, 'minion').length === 0) target = null;
  }
  if (target) {
    attack(u, target);
    castSkills(w, u, P, target, false, effMode);
    return;
  }
  // positioning
  let s: number;
  const front = laneFront(w, P, laneId, team);
  if (effMode === 'defend' && tw) {
    s = laneProgress(laneId, tw.x, tw.y) + dir * 40;
  } else if (front !== null) {
    s = front - dir * (ranged ? 220 : 110);
  } else {
    s = tw ? laneProgress(laneId, tw.x, tw.y) + dir * 120 : (team === 0 ? 300 : laneLength(laneId) - 300);
  }
  // never stand in an enemy tower range without minions
  for (const et of P.enemyTowers()) {
    if (et.kind !== 'tower' || et.lane !== laneId) continue;
    const es = laneProgress(laneId, et.x, et.y);
    const lim = es - dir * (et.stats.range + 60);
    const tankers = P.alliesNear(et.x, et.y, et.stats.range, 'minion').length;
    if (!tankers && (team === 0 ? s > lim : s < lim)) s = lim;
  }
  const p = lanePoint(laneId, s);
  const jitter = ((u.id * 37) % 60) - 30;
  moveTo(u, p.x, p.y + jitter * 0.6, 24);
  castSkills(w, u, P, undefined, false, effMode);
  void ai; void now;
}

// ------------------------------------------------------------------ jungle
function chooseCamp(w: World, u: Unit, P: Perception): number | null {
  const team = u.team as TeamId;
  const T = w.teams[team];
  const strat = T.jungleStrategy;
  let best: number | null = null, bestS = Infinity;
  for (const cd of CAMPS) {
    const k = T.campKnown[cd.id];
    if (!k.alive) continue;
    const enemySide = cd.side !== team;
    if (enemySide && strat === 'farm') continue;
    let s = dist(u.x, u.y, cd.pos.x, cd.pos.y);
    if (enemySide) {
      s += strat === 'aggressive' ? 250 : 750;
      // avoid invading when enemy jungler was recently seen near
      for (const id of P.enemyChampIds()) {
        const ls = P.lastSeen(id);
        if (ls && ls.age < 8 && dist(ls.x, ls.y, cd.pos.x, cd.pos.y) < 700 && !P.enemyDead(id)) s += strat === 'aggressive' ? 300 : 1500;
      }
    }
    if (P.enemyChampsNear(cd.pos.x, cd.pos.y, 600).length && fightRatio(P, cd.pos.x, cd.pos.y) < 1) s += 2000;
    if (s < bestS) { bestS = s; best = cd.id; }
  }
  return best;
}

function jungle(w: World, u: Unit, P: Perception, ai: AIState) {
  const c = u.champ!;
  const team = u.team as TeamId;
  const now = w.time;
  const strat = w.teams[team].jungleStrategy;
  const hpPct = u.hp / u.stats.maxHp;

  // continue auto raid / auto boss
  if (ai.autoRaid) {
    if (now > ai.autoRaid.until) ai.autoRaid = null;
    else return raid(w, u, P, ai.autoRaid.lane, false);
  }
  if (ai.autoBoss) {
    if (now > ai.autoBoss.until || hpPct < 0.35) ai.autoBoss = null;
    else return bossTask(w, u, P, false);
  }

  // look for raid opportunities
  if ((w.tick + u.id) % 15 === 0 && c.level >= 2) {
    const thresh = strat === 'aggressive' ? 0.75 : strat === 'balanced' ? 0.5 : 0.3;
    for (const e of P.enemies) {
      if (e.kind !== 'champion') continue;
      const reg = regionOf(e.x, e.y);
      if (reg !== 'top' && reg !== 'bot') continue;
      if (e.hp / e.stats.maxHp > thresh) continue;
      if (dist(e.x, e.y, u.x, u.y) > (strat === 'aggressive' ? 1900 : 1400)) continue;
      if (P.enemyTowerCovering(e.x, e.y, 0) && strat !== 'aggressive') continue;
      ai.autoRaid = { lane: reg, until: now + 18 };
      return raid(w, u, P, reg, false);
    }
    // boss decision
    const boss = aliveBossKnown(w, P, u);
    if (boss && hpPct > 0.7 && c.level >= (strat === 'farm' ? 6 : 4)) {
      const enemyJ = P.enemyChampIds().map((id) => w.get(id)!).find((e) => e.champ!.position === 'jungle');
      const ejDead = enemyJ ? P.enemyDead(enemyJ.id) : true;
      const ls = enemyJ ? P.lastSeen(enemyJ.id) : null;
      const ejNear = ls && ls.age < 10 && dist(ls.x, ls.y, boss.x, boss.y) < 900;
      const want = strat === 'aggressive' ? !ejNear || ejDead : strat === 'balanced' ? ejDead || (!ejNear && c.level >= 5) : ejDead && c.level >= 6;
      if (want) { ai.autoBoss = { until: now + 40 }; return bossTask(w, u, P, false); }
    }
  }

  // camp farming
  if (ai.campId === undefined || !w.teams[team].campKnown[ai.campId].alive) ai.campId = chooseCamp(w, u, P) ?? undefined;
  if (ai.campId !== undefined) {
    const cd = CAMPS[ai.campId];
    const mons = P.neutralsNear(cd.pos.x, cd.pos.y, 330).filter((m) => m.kind === 'monster');
    if (dist(u.x, u.y, cd.pos.x, cd.pos.y) < 380 && P.visible(mons[0] ?? u)) {
      if (!mons.length) {
        // camp empty (knowledge will update from vision)
        ai.campId = undefined;
        hold(u);
        return;
      }
      const t = mons.sort((a, b) => (a.targetId === u.id ? -1 : 0) - (b.targetId === u.id ? -1 : 0) || a.hp - b.hp || a.id - b.id)[0];
      attack(u, t);
      castSkills(w, u, P, t, false, 'jungle');
      return;
    }
    moveTo(u, cd.pos.x, cd.pos.y, 60);
    castSkills(w, u, P, undefined, false, 'idle');
    return;
  }
  // nothing to farm: wait near next respawning own camp or help a lane
  const T = w.teams[team];
  let wait: number | null = null, wt = Infinity;
  for (const cd of CAMPS) {
    if (cd.side !== team && strat === 'farm') continue;
    const k = T.campKnown[cd.id];
    if (k.respawnAt > 0 && k.respawnAt < wt) { wt = k.respawnAt; wait = cd.id; }
  }
  if (wait !== null && wt - now < 12) {
    const cd = CAMPS[wait];
    moveTo(u, cd.pos.x, cd.pos.y, 80);
    return;
  }
  // help push the weaker lane
  const laneId: LaneId = (u.id + Math.floor(now / 30)) % 2 === 0 ? 'top' : 'bot';
  const front = laneFront(w, P, laneId, team);
  const p = lanePoint(laneId, front ?? laneLength(laneId) / 2);
  moveTo(u, p.x, p.y, 60);
}

function aliveBossKnown(w: World, P: Perception, u: Unit): Unit | null {
  let best: Unit | null = null, bd = Infinity;
  for (const b of w.bosses) {
    if (!b.unitId) continue;
    const bu = w.get(b.unitId);
    if (!bu || !bu.alive) continue; // boss spawn is announced globally
    const d = dist(u.x, u.y, bu.leashX, bu.leashY);
    if (d < bd) { bd = d; best = bu; }
  }
  return best;
}

function bossTask(w: World, u: Unit, P: Perception, ordered: boolean) {
  const c = u.champ!;
  const ai = u.ai as AIState;
  const boss = aliveBossKnown(w, P, u);
  const done = () => { if (ordered) w.setOrder(u, c.baseOrder); else ai.autoBoss = null; };
  if (!boss || (ordered && w.time - c.orderSince > 50)) return done();
  if (u.hp / u.stats.maxHp < 0.3 && boss.hp / boss.stats.maxHp > 0.25) { ai.retreating = true; return done(); }
  const home = BOSS_POS[boss.sub as 'blood' | 'titan'];
  if (dist(u.x, u.y, home.x, home.y) > 420 || !P.visible(boss)) {
    moveTo(u, home.x, home.y, 120);
    castSkills(w, u, P, undefined, false, 'idle');
    return;
  }
  attack(u, boss);
  castSkills(w, u, P, boss, false, 'boss');
}

function raid(w: World, u: Unit, P: Perception, laneId: LaneId, ordered: boolean) {
  const c = u.champ!;
  const ai = u.ai as AIState;
  const team = u.team as TeamId;
  const now = w.time;
  const od = c.orderData;
  const finish = () => { if (ordered) w.setOrder(u, c.baseOrder); else ai.autoRaid = null; };
  if (ordered && od.startKills === undefined) { od.startKills = w.teams[team].kills; od.lastEnemy = now; }
  if (ordered && (now - c.orderSince > 32 || w.teams[team].kills > od.startKills!)) return finish();
  // anchor: our laner in that lane, else lane middle
  const laner = P.allyChamps().find((a) => a.champ!.lane === laneId && a.alive && a !== u);
  let ax: number, ay: number;
  if (laner) { ax = laner.x; ay = laner.y; }
  else { const p = lanePoint(laneId, laneLength(laneId) / 2); ax = p.x; ay = p.y; }
  const targets = P.enemyChampsNear(ax, ay, 1100).filter((e) => laneDistance(laneId, e.x, e.y) < 400);
  if (targets.length) {
    od.lastEnemy = now;
    const t = targets.sort((a, b) => a.hp - b.hp || a.id - b.id)[0];
    // approach through jungle; fight evaluation is done in chooseChampTarget with raid bonus
    if (dist(t.x, t.y, u.x, u.y) < 700) {
      const ratio = fightRatio(P, t.x, t.y);
      if (ratio * STYLE_PARAMS[c.style].risk * 1.3 >= 0.6 && !P.enemyTowerCovering(t.x, t.y, 0)) {
        attack(u, t);
        castSkills(w, u, P, t, true, 'fight');
        return;
      }
    }
    moveTo(u, t.x, t.y, u.stats.range * 0.8);
    castSkills(w, u, P, t, false, 'idle');
    return;
  }
  const arrived = dist(u.x, u.y, ax, ay) < 350;
  if (arrived && od.arrived === undefined) od.arrived = now;
  if (ordered && od.arrived !== undefined && now - (od.lastEnemy ?? now) > 7) return finish();
  if (!ordered && arrived) return finish();
  // help the lane while there
  if (arrived) {
    const m = P.enemiesNear(u.x, u.y, u.stats.range + 200, (e) => e.kind === 'minion').sort((a, b) => a.hp - b.hp)[0];
    if (m && canTarget(w, u, m)) { attack(u, m); return; }
  }
  moveTo(u, ax, ay, 120);
  void BALANCE;
}
