import type { World, Command } from '../core/world';
import type { TeamId } from '../core/map';
import { observe, TeamObservation } from '../core/observation';
import { BALANCE } from '../core/config';
import { Rng } from '../core/rng';
import { dist } from '../core/math';
import { counterSuggestions } from './counters';
import type { OrderKind } from '../core/types';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Personality = 'aggressive' | 'controlled' | 'objective';

export const DIFFICULTY_NAMES: Record<Difficulty, string> = { easy: 'Kolay', normal: 'Normal', hard: 'Zor' };
export const PERSONALITY_NAMES: Record<Personality, string> = { aggressive: 'Saldırgan', controlled: 'Kontrollü', objective: 'Hedef odaklı' };

const DIFF: Record<Difficulty, { interval: number; mistake: number; react: number; riskBias: number; adapt: boolean }> = {
  easy: { interval: 5, mistake: 0.35, react: 2.2, riskBias: 0.8, adapt: false },
  normal: { interval: 2.4, mistake: 0.12, react: 1.0, riskBias: 1.0, adapt: false },
  hard: { interval: 1.0, mistake: 0.02, react: 0.35, riskBias: 1.15, adapt: true },
};

interface Action { slot: number; order: OrderKind; prio: number; why: string }

/**
 * Bot commander: uses exactly the same command interface and TP rules as the player,
 * and sees the match only through its team observation.
 */
export class BotCommander {
  private nextAt = 3;
  private pending: { at: number; cmd: Command }[] = [];
  private rng: Rng;
  mode: 'normal' | 'defensive' | 'pressure' = 'normal';
  lastActions: string[] = [];
  private lastAdapt = 0;
  private slotCd: number[] = [0, 0, 0];
  constructor(public team: TeamId, public difficulty: Difficulty, public personality: Personality, seed: number) {
    this.rng = new Rng(seed ^ 0x5bd1e995);
  }

  update(w: World) {
    const now = w.time;
    for (const p of this.pending) if (p.at <= now) w.submit(p.cmd);
    this.pending = this.pending.filter((p) => p.at > now);
    if (now < this.nextAt) return;
    const d = DIFF[this.difficulty];
    this.nextAt = now + d.interval * (0.8 + this.rng.next() * 0.4);
    const obs = observe(w, this.team);
    this.evaluateMode(obs);
    const acts = this.candidates(obs).filter((a) => a.prio >= 90 || now >= this.slotCd[a.slot]).sort((a, b) => b.prio - a.prio);
    if (!acts.length) return;
    let pick = acts[0];
    if (this.rng.chance(d.mistake)) {
      if (this.rng.chance(0.5)) return; // missed the moment
      pick = this.rng.pick(acts);
    }
    const cost = BALANCE.orderCost[pick.order] ?? 10;
    if (obs.tp < cost) return;
    const cmd: Command = { type: 'order', team: this.team, slot: pick.slot, order: pick.order };
    this.pending.push({ at: now + d.react, cmd });
    this.slotCd[pick.slot] = now + 10 + d.react;
    this.lastActions.unshift(`${Math.floor(now)}s ${pick.why}`);
    this.lastActions.length = Math.min(this.lastActions.length, 6);
    if (d.adapt && now - this.lastAdapt > 30) { this.lastAdapt = now; this.adaptBuilds(w, obs); }
  }

  private evaluateMode(obs: TeamObservation) {
    const killDiff = obs.kills[0] - obs.kills[1];
    const towerDiff = obs.towersKilled[0] - obs.towersKilled[1];
    const score = killDiff + towerDiff * 2;
    if (score <= -4) this.mode = 'defensive';
    else if (score >= 4) this.mode = 'pressure';
    else this.mode = 'normal';
  }

  private candidates(obs: TeamObservation): Action[] {
    const out: Action[] = [];
    const per = this.personality;
    const bias = DIFF[this.difficulty].riskBias;
    const mine = obs.team;
    for (const a of obs.allies) {
      if (!a.alive) continue;
      const hpPct = a.hp / a.maxHp;
      const threats = obs.enemies.filter((e) => e.visible && e.alive && dist(e.x!, e.y!, a.x, a.y) < 800);
      // survival
      if (hpPct < 0.3 && threats.length && a.order !== 'retreat' && !a.inBase && !a.autoRetreat) out.push({ slot: a.slot, order: 'retreat', prio: 95, why: `${a.defId} geri çekil` });
      if (a.position === 'jungle') {
        // raids
        for (const e of obs.enemies) {
          if (!e.visible || !e.alive || e.hp === undefined) continue;
          const lane = e.y! < 520 ? 'top' : e.y! > 1280 ? 'bot' : null;
          if (!lane) continue;
          const low = e.hp / e.maxHp! < 0.6 * bias;
          const tower = obs.structures.find((s) => s.alive && s.team !== mine && dist(s.x, s.y, e.x!, e.y!) < 430);
          if (low && !tower && hpPct > 0.5 && a.order === 'jungle') {
            const order = lane === 'top' ? 'raid_top' : 'raid_bot';
            out.push({ slot: a.slot, order, prio: 60 + (per === 'aggressive' ? 15 : 0) + (this.mode === 'pressure' ? 8 : 0), why: `${a.defId} ${lane} baskını` });
          }
        }
        // bosses
        const boss = obs.bosses.find((b) => b.alive);
        if (boss && hpPct > 0.65 && a.level >= 5 && a.order === 'jungle') {
          const ej = obs.enemies.find((e) => e.position === 'jungle');
          const ejNear = ej && ((ej.visible && dist(ej.x!, ej.y!, boss.x, boss.y) < 900) || (ej.lastSeen && ej.lastSeen.age < 8 && dist(ej.lastSeen.x, ej.lastSeen.y, boss.x, boss.y) < 900));
          const ejDead = ej && !ej.alive;
          const deadEnemies = obs.enemies.filter((e) => !e.alive).length;
          if (!ejNear || ejDead || deadEnemies >= 2) {
            out.push({ slot: a.slot, order: 'boss', prio: 52 + (per === 'objective' ? 22 : 0) + deadEnemies * 8 - (this.mode === 'defensive' ? 20 : 0), why: `${a.defId} boss` });
          }
        }
        // return to jungle when idle in a temp state
        if (a.order !== 'jungle' && a.order !== 'retreat' && hpPct > 0.4 && threats.length === 0 && this.rng.chance(0.2)) out.push({ slot: a.slot, order: 'jungle', prio: 10, why: `${a.defId} ormana dön` });
      } else {
        const lane = a.position as 'top' | 'bot';
        const myTowers = obs.structures.filter((s) => s.team === mine && s.kind === 'tower' && s.lane === lane && s.alive);
        const enemyLaneTowers = obs.structures.filter((s) => s.team !== mine && s.kind === 'tower' && s.lane === lane && s.alive).length;
        const threatened = myTowers.some((s) => s.threatened && obs.enemies.some((e) => e.visible && e.alive && dist(e.x!, e.y!, s.x, s.y) < 520));
        const opp = obs.enemies.find((e) => e.position === lane);
        const oppGone = !!opp && !opp.alive;
        const late = obs.time > 330;
        const wantPush = hpPct > 0.55 && (oppGone || enemyLaneTowers === 0 || this.mode === 'pressure' || (late && this.mode !== 'defensive'));
        if (threatened && a.order !== 'defend' && (this.mode !== 'pressure' || per === 'controlled')) out.push({ slot: a.slot, order: 'defend', prio: 70, why: `${a.defId} savun` });
        else if (wantPush && a.order !== 'push' && !threatened) {
          out.push({ slot: a.slot, order: 'push', prio: 45 + (enemyLaneTowers === 0 ? 20 : 0) + (per === 'objective' ? 12 : 0) + (per === 'aggressive' ? 6 : 0), why: `${a.defId} baskı` });
        } else if (a.order !== 'farm' && !threatened && !wantPush && threats.length === 0) {
          out.push({ slot: a.slot, order: 'farm', prio: 18 + (this.mode === 'defensive' ? 10 : 0), why: `${a.defId} farm` });
        }
      }
    }
    return out;
  }

  private adaptBuilds(w: World, obs: TeamObservation) {
    for (const a of obs.allies) {
      const sug = counterSuggestions(obs, a.slot);
      if (!sug.length) continue;
      const remaining = a.build.filter((id) => !a.items.includes(id));
      if (remaining.length < 2) continue;
      const nb = [...a.build];
      const replaceIdx = nb.lastIndexOf(remaining[remaining.length - 1]);
      if (nb.includes(sug[0].itemId)) continue;
      nb[replaceIdx] = sug[0].itemId;
      w.submit({ type: 'setBuild', team: this.team, slot: a.slot, build: nb });
    }
  }
}
