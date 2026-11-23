import { BALANCE, DT, TICK_RATE, minionScale, respawnTime } from './config';
import { Rng } from './rng';
import { Unit, emptyStats } from './unit';
import { dist, dirFrom } from './math';
import {
  BOSS_POS, CAMPS, CRYSTAL_POS, FOUNTAIN_POS, LANES, LaneId, TOWERS, TeamId,
  findPath, isWalkable, lanePoint, laneProgress, lineWalkable, nearestWalkable,
} from './map';
import type { ChampState, GameEvent, JungleStrategy, OrderKind, Side, Style, UnitStats } from './types';
import { TEMP_ORDERS } from './types';
import { CHAMP_BY_ID, Position } from '../data/champions';
import { BOSS_DATA, CAMP_DATA, MINION_DATA } from '../data/neutrals';
import { ITEM_BY_ID } from '../data/items';
import { champBaseStats, hasItem, recomputeChampion, recomputeGeneric } from './stats';
import { addDot, canTarget, dealDamage, grievous, heal, ownerChamp, structureAttackable } from './combat';
import { getKit } from './kits/registry';
import type { CastPlan, DmgOpts } from './kits/types';
import { Vision, unitVisibleTo } from './vision';
import { autoBuy, inBase } from './shop';

export interface PickSetup { champId: string; position: Position; style: Style; build: number[] }
export interface TeamSetup { picks: PickSetup[]; jungleStrategy: JungleStrategy; controller: 'player' | 'bot' }
export interface MatchSetup { seed: number; teams: [TeamSetup, TeamSetup] }

export interface Projectile {
  id: number; kind: string; team: Side; ownerId: number;
  x: number; y: number; speed: number;
  homing?: number;
  dirX?: number; dirY?: number; maxDist?: number;
  toX?: number; toY?: number;
  traveled: number; width: number; pierce: boolean; hit: number[];
  stopAtChampion?: boolean; hitsMinions?: boolean;
  onHit?: (w: World, tgt: Unit, p: Projectile) => void;
  onArrive?: (w: World, p: Projectile) => void;
  dead: boolean;
}

export interface Zone {
  id: number; kind: string; team: Side; ownerId: number;
  x: number; y: number; r: number; until: number; every: number; next: number;
  vision?: boolean; followId?: number;
  onTick?: (w: World, z: Zone) => void; onEnd?: (w: World, z: Zone) => void;
  data: Record<string, number>; dead: boolean;
}

export interface CampState { id: number; alive: number[]; spawnAt: number; side: TeamId }
export interface BossState { sub: 'blood' | 'titan'; unitId: number; spawnAt: number }
export interface TeamState {
  id: TeamId;
  tp: number;
  champIds: number[];
  buffs: { blood: number; bloodAmt: number; titan: number; titanTower: number };
  kills: number;
  towersKilled: number;
  jungleStrategy: JungleStrategy;
  controller: 'player' | 'bot';
  lastSeen: Map<number, { x: number; y: number; t: number }>;
  campKnown: { alive: boolean; respawnAt: number; seenAt: number }[];
  ordersIssued: number;
  tpSpent: number;
}

export type Command =
  | { type: 'order'; team: TeamId; slot: number; order: OrderKind }
  | { type: 'style'; team: TeamId; slot: number; style: Style }
  | { type: 'jungleStrategy'; team: TeamId; strategy: JungleStrategy }
  | { type: 'setBuild'; team: TeamId; slot: number; build: number[] }
  | { type: 'sell'; team: TeamId; slot: number; index: number };

export interface CommandResult { ok: boolean; reason?: string; cost?: number }

interface Scheduled { at: number; seq: number; fn: () => void }

export class World {
  time = 0;
  tick = 0;
  rng: Rng;
  units: Unit[] = [];
  private byId = new Map<number, Unit>();
  private nextId = 1;
  events: GameEvent[] = [];
  projectiles: Projectile[] = [];
  zones: Zone[] = [];
  private scheduled: Scheduled[] = [];
  private seq = 0;
  teams: [TeamState, TeamState];
  camps: CampState[] = [];
  bosses: BossState[] = [];
  vision = new Vision();
  over = false;
  winner: TeamId | -1 = -1;
  waveCount = 0;
  nextWaveAt = BALANCE.minion.firstWave;
  setup: MatchSetup;
  private cmdQueue: Command[] = [];
  commandLog: { tick: number; cmd: Command; res: CommandResult }[] = [];
  hooks: { champThink?: (w: World, u: Unit) => void; preTick?: (w: World) => void } = {};
  maxEvents = 4000;

  constructor(setup: MatchSetup) {
    this.setup = setup;
    this.rng = new Rng(setup.seed);
    const mkTeam = (id: TeamId): TeamState => ({
      id, tp: BALANCE.tp.start, champIds: [],
      buffs: { blood: 0, bloodAmt: 0, titan: 0, titanTower: 0 },
      kills: 0, towersKilled: 0,
      jungleStrategy: setup.teams[id].jungleStrategy,
      controller: setup.teams[id].controller,
      lastSeen: new Map(),
      campKnown: CAMPS.map((c) => ({ alive: false, respawnAt: BALANCE.jungle.firstSpawn, seenAt: c.side === id ? 0 : -99 })),
      ordersIssued: 0, tpSpent: 0,
    });
    this.teams = [mkTeam(0), mkTeam(1)];
    this.spawnStructures();
    for (const team of [0, 1] as TeamId[]) {
      setup.teams[team].picks.forEach((p, slot) => this.spawnChampion(team, slot, p));
    }
    for (const c of CAMPS) this.camps.push({ id: c.id, alive: [], spawnAt: BALANCE.jungle.firstSpawn, side: c.side });
    this.bosses.push({ sub: 'blood', unitId: 0, spawnAt: BALANCE.boss.bloodFirst });
    this.bosses.push({ sub: 'titan', unitId: 0, spawnAt: BALANCE.boss.titanFirst });
    this.vision.update(this);
  }

  // ------------------------------------------------------------------ basics
  get(id: number): Unit | undefined {
    return this.byId.get(id);
  }
  emit(e: GameEvent) {
    if (this.events.length < this.maxEvents) this.events.push(e);
  }
  drainEvents(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
  schedule(delay: number, fn: () => void) {
    this.scheduled.push({ at: this.time + delay, seq: this.seq++, fn });
  }
  addUnit(u: Unit): Unit {
    this.units.push(u);
    this.byId.set(u.id, u);
    u.spawnTime = this.time;
    this.emit({ t: 'spawn', id: u.id });
    return u;
  }
  newId() {
    return this.nextId++;
  }
  champions(team?: TeamId): Unit[] {
    const out: Unit[] = [];
    for (const t of team === undefined ? [0, 1] : [team]) for (const id of this.teams[t as TeamId].champIds) out.push(this.byId.get(id)!);
    return out;
  }
  isVisibleTo(u: Unit, team: TeamId) {
    return unitVisibleTo(this, u, team);
  }
  minute() {
    return this.time / 60;
  }

  // ------------------------------------------------------------------ spawning
  private spawnStructures() {
    for (const t of TOWERS) {
      const hp = t.tier === 'outer' ? 1200 : 1500;
      const st: UnitStats = { ...emptyStats(), maxHp: hp, ad: 125, as: 0.85, range: BALANCE.towerRange, armor: 30, mr: 30, ms: 0 };
      const u = new Unit(this.newId(), 'tower', t.team, 'tower', t.pos.x, t.pos.y, 34, st);
      u.lane = t.lane;
      u.tier = t.tier;
      this.addUnit(u);
    }
    for (const team of [0, 1] as TeamId[]) {
      const p = CRYSTAL_POS[team];
      const st: UnitStats = { ...emptyStats(), maxHp: 2000, ad: 95, as: 0.8, range: BALANCE.crystalRange, armor: 30, mr: 30, ms: 0 };
      const u = new Unit(this.newId(), 'crystal', team, 'crystal', p.x, p.y, 44, st);
      this.addUnit(u);
    }
  }

  private spawnChampion(team: TeamId, slot: number, p: PickSetup) {
    const def = CHAMP_BY_ID[p.champId];
    if (!def) throw new Error('Unknown champion ' + p.champId);
    const st = champBaseStats(p.champId, 1);
    const f = FOUNTAIN_POS[team];
    const u = new Unit(this.newId(), 'champion', team, p.champId, f.x + (team === 0 ? 40 : -40), f.y + (slot - 1) * 60, 20, st);
    const lane: LaneId | null = p.position === 'top' ? 'top' : p.position === 'bot' ? 'bot' : null;
    const c: ChampState = {
      defId: p.champId, slot, position: p.position, level: 1, xp: 0, gold: BALANCE.startGold, totalGold: BALANCE.startGold,
      inventory: [], build: [...p.build], style: p.style,
      baseOrder: p.position === 'jungle' ? 'jungle' : 'farm', baseFromCmd: false, order: p.position === 'jungle' ? 'jungle' : 'farm', orderSince: 0, orderData: {},
      cds: { s1: 0, s2: 0, ult: 0 }, kills: 0, deaths: 0, assists: 0, cs: 0, respawnAt: 0, recallUntil: 0,
      lastCombat: -99, lastMoved: 0, stillSince: 0, attackCount: 0, dmgDealtChamps: 0, passive: {}, itemCd: {}, damagedBy: new Map(), lane,
    };
    u.champ = c;
    u.lane = lane;
    u.facing = team === 0 ? 'right' : 'left';
    u.data.posEff = BALANCE.positionEff[def.pos[p.position]] ?? 0;
    this.addUnit(u);
    this.teams[team].champIds.push(u.id);
    recomputeChampion(this, u);
    u.hp = u.stats.maxHp;
    getKit(p.champId).onSpawn?.(this, u);
  }

  private spawnWave() {
    this.waveCount++;
    const siege = this.waveCount % BALANCE.minion.siegeEvery === 0;
    const scale = minionScale(this.time);
    for (const team of [0, 1] as TeamId[]) {
      for (const lane of ['top', 'bot'] as LaneId[]) {
        const list: ('melee' | 'ranged' | 'siege')[] = ['melee', 'melee', 'ranged'];
        if (siege) list.push('siege');
        list.forEach((sub, i) => {
          this.schedule(i * 0.45, () => this.spawnMinion(team, lane, sub, scale));
        });
      }
    }
  }

  private spawnMinion(team: TeamId, lane: LaneId, sub: 'melee' | 'ranged' | 'siege', scale: number) {
    if (this.over) return;
    const d = MINION_DATA[sub];
    const s0 = team === 0 ? 0 : laneLen(lane);
    const p = lanePoint(lane, s0 + (team === 0 ? 20 : -20));
    const extra = sub === 'siege' ? scale * 1.5 : scale;
    const st: UnitStats = { ...emptyStats(), maxHp: d.hp * (1 + extra), ad: d.ad * (1 + extra), as: d.as, range: d.range, armor: d.armor, mr: d.mr, ms: d.ms };
    const u = new Unit(this.newId(), 'minion', team, sub, p.x, p.y, d.radius, st);
    u.lane = lane;
    u.laneDir = team === 0 ? 1 : -1;
    u.data.gold = d.gold;
    u.data.xp = d.xp;
    u.facing = team === 0 ? 'right' : 'left';
    if (this.teams[team].buffs.titan > this.time) u.hpMul = 1 + BALANCE.bossBuff.titan.minionHp;
    u.stats.maxHp = u.base.maxHp * u.hpMul;
    u.hp = u.stats.maxHp;
    this.addUnit(u);
  }

  private spawnCamp(cs: CampState) {
    const def = CAMPS[cs.id];
    const data = CAMP_DATA[def.kind];
    const m = this.minute();
    const scale = 1 + Math.max(0, m - 2) * 0.07;
    cs.alive = [];
    for (const md of data.monsters) {
      const st: UnitStats = { ...emptyStats(), maxHp: md.hp * scale, ad: md.ad * scale, as: md.as, range: md.range, armor: md.armor, mr: md.mr, ms: md.ms };
      const x = def.pos.x + md.offX * (def.side === 0 ? 1 : -1), y = def.pos.y + md.offY;
      const u = new Unit(this.newId(), 'monster', 2, md.sub, x, y, md.radius, st);
      u.campId = cs.id;
      u.leashX = x; u.leashY = y;
      u.data.gold = md.gold;
      u.data.xp = md.xp;
      u.facing = def.side === 0 ? 'right' : 'left';
      this.addUnit(u);
      cs.alive.push(u.id);
    }
    cs.spawnAt = Infinity;
  }

  private spawnBoss(b: BossState) {
    const d = BOSS_DATA[b.sub];
    const m = this.minute();
    const scale = 1 + Math.max(0, m - 2) * 0.08;
    const p = BOSS_POS[b.sub];
    const st: UnitStats = { ...emptyStats(), maxHp: d.hp * scale, ad: d.ad * scale, as: d.as, range: d.range, armor: d.armor, mr: d.mr, ms: d.ms };
    const u = new Unit(this.newId(), 'boss', 2, b.sub, p.x, p.y, d.radius, st);
    u.leashX = p.x; u.leashY = p.y;
    u.data.specialAt = this.time + 5;
    this.addUnit(u);
    b.unitId = u.id;
    b.spawnAt = Infinity;
    this.emit({ t: 'alert', k: 'bossSpawn', text: `${d.name} doğdu!`, x: p.x, y: p.y });
  }

  spawnSummon(owner: Unit, sub: string, x: number, y: number, st: UnitStats, opts: { duration?: number; radius?: number; living?: boolean; structure?: boolean }): Unit {
    const c = owner.champ!;
    const s = { ...st };
    if (opts.living && hasItem(owner, 21)) s.maxHp *= 1.12;
    if (opts.structure && hasItem(owner, 22)) s.maxHp *= 1.15;
    const p = nearestWalkable(x, y);
    const u = new Unit(this.newId(), 'summon', owner.team, sub, p.x, p.y, opts.radius ?? 16, s);
    u.ownerId = owner.id;
    u.expireAt = opts.duration ? this.time + opts.duration : 0;
    u.data.living = opts.living ? 1 : 0;
    u.data.structure = opts.structure ? 1 : 0;
    u.facing = owner.facing;
    void c;
    return this.addUnit(u);
  }

  spawnProjectile(p: Omit<Projectile, 'id' | 'traveled' | 'hit' | 'dead'>): Projectile {
    const pr: Projectile = { ...p, id: this.newId(), traveled: 0, hit: [], dead: false };
    this.projectiles.push(pr);
    const tgt = pr.homing ? this.get(pr.homing) : undefined;
    let tx = pr.toX ?? (tgt ? tgt.x : pr.x + (pr.dirX ?? 0) * (pr.maxDist ?? 300));
    let ty = pr.toY ?? (tgt ? tgt.y : pr.y + (pr.dirY ?? 0) * (pr.maxDist ?? 300));
    this.emit({ t: 'proj', id: pr.id, k: pr.kind, x: pr.x, y: pr.y, x2: tx, y2: ty, tgt: pr.homing, v: pr.speed, team: pr.team as number });
    return pr;
  }

  spawnZone(z: Omit<Zone, 'id' | 'dead' | 'next' | 'data'> & { data?: Record<string, number>; delayFirst?: boolean }): Zone {
    const zone: Zone = { ...z, id: this.newId(), dead: false, next: this.time + (z.delayFirst ? z.every : 0), data: z.data ?? {} };
    this.zones.push(zone);
    this.emit({ t: 'zone', id: zone.id, k: zone.kind, x: zone.x, y: zone.y, r: zone.r, dur: zone.until - this.time, team: zone.team as number });
    return zone;
  }

  // ------------------------------------------------------------------ queries
  enemiesInRadius(team: Side, x: number, y: number, r: number, opts: { structures?: boolean; champsOnly?: boolean } = {}): Unit[] {
    const out: Unit[] = [];
    for (const u of this.units) {
      if (!u.alive || u.team === team) continue;
      if (u.untargetableUntil > this.time) continue;
      if (u.isStructure && (!opts.structures || !structureAttackable(this, u))) continue;
      if (opts.champsOnly && u.kind !== 'champion') continue;
      if (dist(u.x, u.y, x, y) <= r + u.radius) out.push(u);
    }
    return out;
  }

  alliesInRadius(team: Side, x: number, y: number, r: number, kinds?: string[]): Unit[] {
    return this.units.filter((u) => u.alive && u.team === team && (!kinds || kinds.includes(u.kind)) && dist(u.x, u.y, x, y) <= r);
  }

  // ------------------------------------------------------------------ commands
  submit(cmd: Command) {
    this.cmdQueue.push(cmd);
  }

  /** Validate & apply a command immediately (used at tick start). */
  applyCommand(cmd: Command): CommandResult {
    const team = this.teams[cmd.team];
    if (!team) return { ok: false, reason: 'Geçersiz takım' };
    if (cmd.type === 'jungleStrategy') {
      team.jungleStrategy = cmd.strategy;
      return { ok: true, cost: 0 };
    }
    const uid = team.champIds[cmd.slot];
    const u = uid ? this.get(uid) : undefined;
    if (!u || !u.champ) return { ok: false, reason: 'Geçersiz şampiyon' };
    const c = u.champ;
    switch (cmd.type) {
      case 'style':
        c.style = cmd.style;
        return { ok: true, cost: 0 };
      case 'setBuild': {
        if (!Array.isArray(cmd.build) || cmd.build.length !== 4) return { ok: false, reason: 'Build 4 eşya olmalı' };
        if (new Set(cmd.build).size !== 4 || cmd.build.some((i) => !ITEM_BY_ID[i])) return { ok: false, reason: 'Geçersiz eşya listesi' };
        c.build = [...cmd.build];
        return { ok: true, cost: 0 };
      }
      case 'sell': {
        if (!inBase(u) || !u.alive) return { ok: false, reason: 'Satış yalnızca üste' };
        const s = c.inventory[cmd.index];
        if (!s) return { ok: false, reason: 'Geçersiz yuva' };
        const refund = Math.floor(s.spent * BALANCE.sellRatio);
        c.gold += refund;
        c.inventory.splice(cmd.index, 1);
        this.emit({ t: 'sell', id: u.id, v: refund });
        return { ok: true, cost: 0 };
      }
      case 'order': {
        if (!u.alive) return { ok: false, reason: 'Şampiyon ölü' };
        const isJ = c.position === 'jungle';
        const allowed: OrderKind[] = isJ ? ['jungle', 'raid_top', 'raid_bot', 'boss', 'retreat'] : ['farm', 'push', 'defend', 'retreat'];
        if (!allowed.includes(cmd.order)) return { ok: false, reason: 'Bu şampiyon için geçersiz emir' };
        if (c.order === cmd.order) return { ok: false, reason: 'Emir zaten aktif' };
        if (cmd.order === 'boss' && !this.bosses.some((b) => b.unitId && this.get(b.unitId)?.alive)) return { ok: false, reason: 'Aktif boss yok' };
        const cost = BALANCE.orderCost[cmd.order] ?? 10;
        if (team.tp < cost) return { ok: false, reason: 'Yetersiz taktik puanı' };
        team.tp -= cost;
        team.tpSpent += cost;
        team.ordersIssued++;
        this.setOrder(u, cmd.order);
        if (!TEMP_ORDERS.includes(cmd.order)) { c.baseOrder = cmd.order; c.baseFromCmd = true; }
        this.emit({ t: 'order', id: u.id, k: cmd.order, team: cmd.team });
        return { ok: true, cost };
      }
    }
    return { ok: false, reason: 'Bilinmeyen komut' };
  }

  setOrder(u: Unit, order: OrderKind) {
    const c = u.champ!;
    c.order = order;
    c.orderSince = this.time;
    c.orderData = {};
    if (u.ai) u.ai.taskReset = true;
  }

  // ------------------------------------------------------------------ skills
  skillReady(u: Unit, key: 's1' | 's2' | 'ult'): boolean {
    const c = u.champ!;
    if (key === 'ult' && c.level < 5) return false;
    return c.cds[key] <= this.time;
  }

  canAct(u: Unit): boolean {
    return u.alive && !u.isCC(this.time) && u.castUntil <= this.time && !u.dash;
  }

  /** Cast a skill. AI layer chooses the plan; core validates and executes after cast time. */
  castSkill(u: Unit, key: 's1' | 's2' | 'ult', plan: CastPlan): boolean {
    const c = u.champ;
    if (!c || !this.canAct(u) || !this.skillReady(u, key)) return false;
    const kit = getKit(c.defId);
    const sk = kit[key];
    if (sk.needsTarget && (!plan.tgt || !plan.tgt.alive)) return false;
    if (plan.tgt && plan.tgt.team !== u.team && !this.isVisibleTo(plan.tgt, u.team as TeamId)) return false;
    const tx = plan.tgt ? plan.tgt.x : plan.x ?? u.x;
    const ty = plan.tgt ? plan.tgt.y : plan.y ?? u.y;
    if (sk.range > 0 && dist(u.x, u.y, tx, ty) > sk.range + (plan.tgt?.radius ?? 0) + 10) return false;
    const L = c.level - 1;
    const rank = c.level >= 9 ? 2 : 1;
    const cd = sk.cd(L, rank) * (1 - u.stats.cdr);
    c.cds[key] = this.time + cd;
    u.castUntil = this.time + sk.castTime;
    u.castSkill = key;
    u.windupUntil = 0;
    if (c.recallUntil) this.cancelRecall(u);
    if (dist(u.x, u.y, tx, ty) > 2) u.facing = dirFrom(tx - u.x, ty - u.y, u.facing);
    if (key !== 's2' || c.defId !== 'nyra') u.stealthUntil = 0;
    c.passive.lastCast = this.time;
    if (hasItem(u, 15)) c.passive.triggerReady = 1;
    c.lastCombat = Math.max(c.lastCombat, this.time - 3);
    this.emit({ t: 'cast', id: u.id, k: key, x: tx, y: ty, tgt: plan.tgt?.id, v: rank, dur: sk.castTime });
    const exec = () => {
      if (!u.alive) return;
      const p: CastPlan = plan.tgt && plan.tgt.alive ? plan : { x: plan.tgt ? plan.tgt.x : plan.x, y: plan.tgt ? plan.tgt.y : plan.y, tgt: plan.tgt && plan.tgt.alive ? plan.tgt : undefined };
      if (sk.needsTarget && !p.tgt) return;
      sk.exec({ w: this, u, L, rank }, p);
    };
    if (sk.castTime > 0) this.schedule(sk.castTime, exec);
    else exec();
    return true;
  }

  dashUnit(u: Unit, tx: number, ty: number, speed: number, onEnd?: () => void) {
    // clamp to walkable along the line
    const steps = Math.ceil(dist(u.x, u.y, tx, ty) / 20);
    let fx = u.x, fy = u.y;
    for (let i = 1; i <= steps; i++) {
      const nx = u.x + ((tx - u.x) * i) / steps, ny = u.y + ((ty - u.y) * i) / steps;
      if (!isWalkable(nx, ny)) break;
      fx = nx; fy = ny;
    }
    u.dash = { tx: fx, ty: fy, speed, onEnd };
    u.windupUntil = 0;
    u.facing = dirFrom(fx - u.x, fy - u.y, u.facing);
    if (u.champ?.recallUntil) this.cancelRecall(u);
    this.emit({ t: 'dash', id: u.id, x: u.x, y: u.y, x2: fx, y2: fy });
  }

  // ------------------------------------------------------------------ recall
  startRecall(u: Unit): boolean {
    const c = u.champ;
    if (!c || !u.alive || c.recallUntil > 0 || inBase(u) || u.isCC(this.time)) return false;
    c.recallUntil = this.time + BALANCE.recallTime;
    u.windupUntil = 0;
    u.ai.intent = { type: 'hold' };
    this.emit({ t: 'recall', id: u.id, k: 'start' });
    return true;
  }
  cancelRecall(u: Unit) {
    if (u.champ && u.champ.recallUntil > 0) {
      u.champ.recallUntil = 0;
      this.emit({ t: 'recall', id: u.id, k: 'cancel' });
    }
  }

  // ------------------------------------------------------------------ death & rewards
  giveGold(u: Unit, g: number) {
    if (!u.champ || g <= 0) return;
    u.champ.gold += g;
    u.champ.totalGold += g;
  }
  giveXp(u: Unit, xp: number) {
    const c = u.champ;
    if (!c || c.level >= BALANCE.maxLevel) return;
    c.xp += xp;
    while (c.level < BALANCE.maxLevel && c.xp >= BALANCE.xpTable[c.level]) {
      c.level++;
      const before = u.stats.maxHp;
      recomputeChampion(this, u);
      u.hp += Math.max(0, u.stats.maxHp - before);
      this.emit({ t: 'levelUp', id: u.id, v: c.level });
    }
  }

  killUnit(tgt: Unit, src: Unit) {
    if (!tgt.alive) return;
    tgt.alive = false;
    tgt.hp = 0;
    tgt.deathTime = this.time;
    tgt.dash = null;
    tgt.shields = [];
    tgt.dots = [];
    const now = this.time;
    let killer = ownerChamp(this, src);
    this.emit({ t: 'death', id: tgt.id, tgt: src.id });

    // nearby death hooks (e.g. Nekmar)
    for (const ch of this.champions()) {
      if (ch.alive && ch !== tgt && dist(ch.x, ch.y, tgt.x, tgt.y) < 650) getKit(ch.champ!.defId).onNearbyDeath?.(this, ch, tgt);
    }

    if (tgt.kind === 'champion') {
      const c = tgt.champ!;
      if (!killer) {
        let best = -1;
        for (const [id, t] of c.damagedBy) if (now - t < BALANCE.assistWindow && t > best) { best = t; killer = this.get(id)!; }
      }
      c.deaths++;
      c.respawnAt = now + respawnTime(c.level);
      c.recallUntil = 0;
      // temp orders cleared; persistent assignments kept
      if (TEMP_ORDERS.includes(c.order)) this.setOrder(tgt, c.baseOrder);
      tgt.ai.intent = { type: 'hold' };
      const victimTeam = tgt.team as TeamId;
      const kteam = (1 - victimTeam) as TeamId;
      this.teams[kteam].kills++;
      const assists: Unit[] = [];
      for (const [id, t] of c.damagedBy) {
        if (now - t > BALANCE.assistWindow) continue;
        const a = this.get(id)!;
        if (a !== killer && a.team === kteam) assists.push(a);
      }
      c.damagedBy.clear();
      const xp = BALANCE.killXpBase + BALANCE.killXpPerLevel * c.level;
      if (killer && killer.team === kteam) {
        killer.champ!.kills++;
        this.giveGold(killer, BALANCE.killGold);
        this.giveXp(killer, xp);
        this.onKillOrAssist(killer);
      }
      for (const a of assists) {
        a.champ!.assists++;
        this.giveGold(a, BALANCE.assistGold);
        this.giveXp(a, xp * 0.5);
        this.onKillOrAssist(a);
      }
      this.emit({ t: 'alert', k: 'kill', team: kteam, id: tgt.id, tgt: killer?.id, text: `${killer ? CHAMP_BY_ID[killer.sub].name : 'Birim'} ⚔ ${CHAMP_BY_ID[tgt.sub].name}`, x: tgt.x, y: tgt.y });
      return;
    }

    tgt.removeAt = now + 1.4;
    if (tgt.kind === 'minion') {
      if (killer && killer.team !== tgt.team && (src === killer || src.kind === 'summon')) {
        this.giveGold(killer, tgt.data.gold);
        killer.champ!.cs++;
        this.emit({ t: 'gold', id: killer.id, v: tgt.data.gold, x: tgt.x, y: tgt.y });
      }
      const near = this.champions((1 - (tgt.team as number)) as TeamId).filter((c) => c.alive && dist(c.x, c.y, tgt.x, tgt.y) < 820);
      if (near.length) {
        const share = (tgt.data.xp * (1 + 0.25 * (near.length - 1))) / near.length;
        for (const c of near) this.giveXp(c, share);
      }
    } else if (tgt.kind === 'monster') {
      if (killer) {
        this.giveGold(killer, tgt.data.gold);
        this.giveXp(killer, tgt.data.xp);
        killer.champ!.cs++;
        this.emit({ t: 'gold', id: killer.id, v: tgt.data.gold, x: tgt.x, y: tgt.y });
        if (tgt.sub === 'spirit') {
          killer.msBuffs.push({ amt: BALANCE.spiritSpeedBuff.amount, until: now + BALANCE.spiritSpeedBuff.duration, key: 'spirit' });
          this.emit({ t: 'vfx', k: 'speedbuff', id: killer.id, x: killer.x, y: killer.y });
        }
      }
      const cs = this.camps[tgt.campId];
      cs.alive = cs.alive.filter((id) => id !== tgt.id);
      if (cs.alive.length === 0) {
        cs.spawnAt = now + BALANCE.jungle.respawn;
        for (const t of [0, 1] as TeamId[]) {
          if (this.vision.cellVisible(t, CAMPS[cs.id].pos.x, CAMPS[cs.id].pos.y) || (killer && killer.team === t)) {
            this.teams[t].campKnown[cs.id] = { alive: false, respawnAt: cs.spawnAt, seenAt: now };
          }
        }
      }
    } else if (tgt.kind === 'boss') {
      const b = this.bosses.find((x) => x.unitId === tgt.id)!;
      b.unitId = 0;
      b.spawnAt = now + BALANCE.boss.respawn;
      if (killer) {
        const team = this.teams[killer.team as TeamId];
        const late = this.minute() >= BALANCE.bossBuff.lateMinute;
        if (b.sub === 'blood') {
          team.buffs.blood = now + BALANCE.bossBuff.blood.duration;
          team.buffs.bloodAmt = late ? BALANCE.bossBuff.blood.champDmgLate : BALANCE.bossBuff.blood.champDmg;
        } else {
          team.buffs.titan = now + BALANCE.bossBuff.titan.duration;
          team.buffs.titanTower = late ? BALANCE.bossBuff.titan.towerDmgLate : BALANCE.bossBuff.titan.towerDmg;
          for (const m of this.units) if (m.alive && m.kind === 'minion' && m.team === killer.team) m.hpMul = 1 + BALANCE.bossBuff.titan.minionHp;
        }
        this.giveGold(killer, 100);
        for (const c of this.champions(killer.team as TeamId)) this.giveXp(c, 90);
        this.emit({ t: 'buff', team: killer.team as number, k: b.sub });
        this.emit({ t: 'alert', k: 'boss', team: killer.team as number, text: `${killer.team === 0 ? 'Mavi' : 'Kırmızı'} takım ${BOSS_DATA[b.sub].name} yendi!`, x: tgt.x, y: tgt.y });
      }
    } else if (tgt.kind === 'tower') {
      const kteam = (1 - (tgt.team as number)) as TeamId;
      this.teams[kteam].towersKilled++;
      for (const c of this.champions(kteam)) this.giveGold(c, 80);
      this.emit({ t: 'alert', k: 'tower', team: kteam, text: `${tgt.team === 0 ? 'Mavi' : 'Kırmızı'} ${tgt.lane === 'top' ? 'üst' : 'alt'} ${tgt.tier === 'outer' ? 'dış' : 'iç'} kule yıkıldı!`, x: tgt.x, y: tgt.y });
    } else if (tgt.kind === 'crystal') {
      this.over = true;
      this.winner = (1 - (tgt.team as number)) as TeamId;
      this.emit({ t: 'gameOver', team: this.winner, x: tgt.x, y: tgt.y });
    } else if (tgt.kind === 'summon') {
      const owner = this.get(tgt.ownerId);
      if (owner?.champ && tgt.sub === 'wolf') owner.champ.passive.wolfRespawn = now + 14;
    }
  }

  private onKillOrAssist(u: Unit) {
    const c = u.champ!;
    if (hasItem(u, 14) && (c.itemCd.i14 ?? -1) <= this.time) {
      c.itemCd.i14 = this.time + 15;
      heal(this, u, u.stats.maxHp * 0.09, u);
    }
  }

  // ------------------------------------------------------------------ basic attacks
  private startAttack(u: Unit, tgt: Unit) {
    const now = this.time;
    const windup = Math.min(u.kind === 'champion' ? (u.stats.range > 150 ? 0.18 : 0.22) : 0.28, 0.4 / u.stats.as);
    u.windupUntil = now + windup;
    u.windupTarget = tgt.id;
    u.attackReadyAt = now + 1 / u.stats.as;
    u.facing = dirFrom(tgt.x - u.x, tgt.y - u.y, u.facing);
    if (u.stealthUntil > now) {
      u.stealthUntil = 0;
      u.data.fromStealth = 1;
    }
    if (u.champ) {
      u.champ.lastCombat = now;
      if (tgt.kind === 'champion') u.champ.lastCombat = now;
    }
    this.emit({ t: 'attack', id: u.id, tgt: tgt.id, dur: windup });
  }

  private resolveAttack(u: Unit) {
    const tgt = this.get(u.windupTarget);
    u.windupUntil = 0;
    if (!tgt || !canTarget(this, u, tgt)) return;
    if (dist(u.x, u.y, tgt.x, tgt.y) > u.stats.range + u.radius + tgt.radius + 90) return;
    const ranged = u.stats.range > 150;
    if (ranged) {
      const kind = projKindFor(u);
      this.spawnProjectile({
        kind, team: u.team, ownerId: u.id, x: u.x, y: u.y - 14, speed: u.kind === 'tower' || u.kind === 'crystal' ? 760 : 900,
        homing: tgt.id, width: 0, pierce: false,
        onHit: (w, t) => w.applyBasicAttack(u, t),
      });
    } else {
      this.applyBasicAttack(u, tgt);
    }
  }

  applyBasicAttack(u: Unit, tgt: Unit) {
    if (!tgt.alive) return;
    if (!u.alive && u.kind === 'champion') {
      // projectile in flight still lands
    }
    let dmg = u.stats.ad;
    const o: DmgOpts = { attack: true, srcX: u.x, srcY: u.y };
    if (u.kind === 'tower' || u.kind === 'crystal') {
      if (tgt.kind === 'minion') dmg = tgt.base.maxHp * (tgt.sub === 'siege' ? 0.11 : tgt.sub === 'ranged' ? 0.34 : 0.26);
      else if (tgt.kind === 'summon') dmg = Math.max(dmg, tgt.stats.maxHp * 0.3);
      else dmg = (u.kind === 'crystal' ? BALANCE.crystalChampDamage : u.stats.ad) * (1 + Math.min(0.35, this.minute() * 0.04));
      dealDamage(this, u, tgt, dmg, 'phys', o);
      return;
    }
    if (u.champ) {
      const c = u.champ;
      c.attackCount++;
      const kit = getKit(c.defId);
      dmg += kit.attackBonus?.(this, u, tgt, dmg) ?? 0;
      if (hasItem(u, 1) && c.attackCount % 3 === 0) dmg += 24;
      if (hasItem(u, 15) && c.passive.triggerReady) { dmg += 28; c.passive.triggerReady = 0; }
      dealDamage(this, u, tgt, dmg, 'phys', o);
      if (hasItem(u, 17)) grievous(this, tgt, 0.35, 3);
      if (hasItem(u, 2) && c.attackCount % 4 === 0) {
        const k = c.cds.s1 >= c.cds.s2 ? 's1' : 's2';
        if (c.cds[k] > this.time) c.cds[k] = Math.max(this.time, c.cds[k] - 0.6);
      }
      kit.onAttackHit?.(this, u, tgt);
      u.data.fromStealth = 0;
      return;
    }
    if (u.kind === 'summon') {
      const owner = this.get(u.ownerId);
      if (owner?.champ) {
        if (hasItem(owner, 21) && u.data.living) { /* handled in pipeline */ }
      }
      const isMagic = u.data.structure === 1;
      dealDamage(this, u, tgt, dmg, isMagic ? 'magic' : 'phys', o);
      if (u.sub === 'sentry' && owner?.champ) owner.champ.passive.energy = Math.min(10, (owner.champ.passive.energy ?? 0) + 1);
      if (u.sub === 'bonegiant' || u.sub === 'beast') {
        for (const e of this.enemiesInRadius(u.team, tgt.x, tgt.y, 110)) if (e !== tgt) dealDamage(this, u, e, dmg * 0.5, 'phys', { aoe: true });
      }
      return;
    }
    dealDamage(this, u, tgt, dmg, 'phys', o);
  }

  // ------------------------------------------------------------------ movement
  moveToward(u: Unit, tx: number, ty: number, stopDist = 4): boolean {
    const d = dist(u.x, u.y, tx, ty);
    if (d <= stopDist) { u.moving = false; return true; }
    if (u.isRooted(this.time) || u.stats.ms <= 0) { u.moving = false; return false; }
    let gx = tx, gy = ty;
    if (u.kind !== 'minion') {
      const direct = lineWalkable(u.x, u.y, tx, ty);
      if (!direct) {
        if (!u.path.length || dist(u.pathGoalX, u.pathGoalY, tx, ty) > 70 || this.time - u.pathAt > 2) {
          u.path = findPath(u.x, u.y, tx, ty);
          u.pathGoalX = tx; u.pathGoalY = ty; u.pathAt = this.time;
        }
        while (u.path.length > 1 && dist(u.x, u.y, u.path[0].x, u.path[0].y) < 14) u.path.shift();
        if (u.path.length) { gx = u.path[0].x; gy = u.path[0].y; }
      } else u.path = [];
    }
    const step = Math.min(u.stats.ms * DT, d - stopDist + 0.5);
    const dd = dist(u.x, u.y, gx, gy) || 1;
    const vx = ((gx - u.x) / dd) * step, vy = ((gy - u.y) / dd) * step;
    this.applyMove(u, vx, vy);
    return false;
  }

  private applyMove(u: Unit, vx: number, vy: number) {
    let nx = u.x + vx, ny = u.y + vy;
    if (!isWalkable(nx, ny)) {
      if (isWalkable(u.x + vx, u.y)) { nx = u.x + vx; ny = u.y; }
      else if (isWalkable(u.x, u.y + vy)) { nx = u.x; ny = u.y + vy; }
      else { nx = u.x; ny = u.y; u.path = []; }
    }
    if (nx !== u.x || ny !== u.y) {
      u.facing = dirFrom(nx - u.x, ny - u.y, u.facing);
      u.moving = true;
      u.x = nx; u.y = ny;
      if (u.champ) { u.champ.lastMoved = this.time; u.champ.stillSince = this.time; }
    } else u.moving = false;
  }

  /** Execute unit intent: attack target (chase if out of range) or move. */
  private execIntent(u: Unit) {
    const now = this.time;
    u.moving = false;
    if (u.dash) return;
    if (u.isCC(now)) { u.windupUntil = 0; return; }
    if (u.castUntil > now) return;
    if (u.windupUntil > 0) {
      if (now >= u.windupUntil) this.resolveAttack(u);
      if (!u.data.kite) return;
    }
    if (u.champ && u.champ.recallUntil > 0) return;
    const it = u.ai.intent as { type: string; id?: number; x?: number; y?: number; stop?: number } | undefined;
    if (!it) return;
    if (it.type === 'attack') {
      const tgt = this.get(it.id!);
      if (!tgt || !canTarget(this, u, tgt) || (u.team !== 2 && tgt.team !== 2 && !tgt.isStructure && !this.isVisibleTo(tgt, u.team as TeamId))) {
        u.ai.intent = { type: 'hold' };
        return;
      }
      const d = dist(u.x, u.y, tgt.x, tgt.y) - u.radius - tgt.radius;
      if (d <= u.stats.range) {
        if (now >= u.attackReadyAt && u.windupUntil === 0) this.startAttack(u, tgt);
        else if (u.data.kite && it.x !== undefined) this.moveToward(u, it.x, it.y!, 4);
        else u.facing = dirFrom(tgt.x - u.x, tgt.y - u.y, u.facing);
      } else this.moveToward(u, tgt.x, tgt.y, u.stats.range * 0.6);
    } else if (it.type === 'move') {
      this.moveToward(u, it.x!, it.y!, it.stop ?? 6);
    }
  }

  // ------------------------------------------------------------------ npc behaviours
  private thinkMinion(u: Unit) {
    const now = this.time;
    let tgt = u.targetId ? this.get(u.targetId) : undefined;
    const aggro = 400;
    if (tgt && (!canTarget(this, u, tgt) || dist(u.x, u.y, tgt.x, tgt.y) > aggro * 1.4)) tgt = undefined;
    if ((this.tick + u.id) % 5 === 0 || !tgt) {
      // re-evaluate: champion attacking allied champion has priority
      let best: Unit | undefined, bestScore = Infinity;
      for (const e of this.units) {
        if (!e.alive || e.team === u.team || e.team === 2) continue;
        const d = dist(u.x, u.y, e.x, e.y);
        if (d > aggro) continue;
        if (!canTarget(this, u, e)) continue;
        let score = d;
        if (e.kind === 'champion') {
          const aggroOnAlly = now - e.lastAttackedChampAt < 2 && this.alliesInRadius(u.team, e.x, e.y, 600, ['champion']).length > 0;
          score += aggroOnAlly ? -500 : 400;
        } else if (e.isStructure) score += 150;
        if (score < bestScore) { bestScore = score; best = e; }
      }
      if (best && (!tgt || best.id !== tgt.id)) {
        if (!tgt || bestScore < dist(u.x, u.y, tgt.x, tgt.y) - 100) tgt = best;
      }
    }
    if (tgt) {
      u.targetId = tgt.id;
      u.ai.intent = { type: 'attack', id: tgt.id };
    } else {
      u.targetId = 0;
      const lane = u.lane!;
      const s = laneProgress(lane, u.x, u.y);
      const len = laneLen(lane);
      const ns = s + u.laneDir * 110;
      if ((u.laneDir > 0 && ns >= len) || (u.laneDir < 0 && ns <= 0)) {
        const c = CRYSTAL_POS[1 - (u.team as number)];
        u.ai.intent = { type: 'move', x: c.x, y: c.y, stop: 60 };
      } else {
        const p = lanePoint(lane, ns);
        u.ai.intent = { type: 'move', x: p.x, y: p.y, stop: 2 };
      }
    }
  }

  private thinkStructure(u: Unit) {
    const now = this.time;
    const range = u.stats.range;
    let tgt = u.targetId ? this.get(u.targetId) : undefined;
    if (tgt && (!tgt.alive || tgt.untargetableUntil > now || dist(u.x, u.y, tgt.x, tgt.y) > range + tgt.radius || !this.isVisibleTo(tgt, u.team as TeamId))) tgt = undefined;
    // switch to an enemy champion that attacks our champion inside range
    for (const e of this.units) {
      if (!e.alive || e.team === u.team || e.team === 2 || (e.kind !== 'champion' && e.kind !== 'summon')) continue;
      if (dist(u.x, u.y, e.x, e.y) > range + e.radius) continue;
      if (now - e.lastAttackedChampAt < 1.2 && this.isVisibleTo(e, u.team as TeamId)) {
        const victimNear = this.alliesInRadius(u.team, e.x, e.y, 900, ['champion']).some((a) => a.lastHitBy === e.id && now - a.lastHitAt < 1.5);
        if (victimNear && (!tgt || tgt.kind !== 'champion')) { tgt = e; break; }
      }
    }
    if (!tgt) {
      let best: Unit | undefined, bd = Infinity;
      // minions first
      for (const pass of [0, 1]) {
        for (const e of this.units) {
          if (!e.alive || e.team === u.team || e.team === 2) continue;
          if (pass === 0 && e.kind !== 'minion' && e.kind !== 'summon') continue;
          if (pass === 1 && e.kind !== 'champion') continue;
          if (e.untargetableUntil > now || !this.isVisibleTo(e, u.team as TeamId)) continue;
          const d = dist(u.x, u.y, e.x, e.y);
          if (d <= range + e.radius && d < bd) { bd = d; best = e; }
        }
        if (best) break;
      }
      tgt = best;
    }
    u.targetId = tgt?.id ?? 0;
    u.ai.intent = tgt ? { type: 'attack', id: tgt.id } : { type: 'hold' };
  }

  private thinkNeutral(u: Unit) {
    const now = this.time;
    const leash = u.kind === 'boss' ? BALANCE.boss.leash : BALANCE.jungle.leash;
    let tgt = u.targetId ? this.get(u.targetId) : undefined;
    // camp-wide aggro
    if (!tgt && u.lastHitAt > now - 0.3) tgt = this.get(u.lastHitBy);
    if (!tgt && u.campId >= 0) {
      for (const id of this.camps[u.campId].alive) {
        const m = this.get(id);
        if (m && m !== u && m.targetId && now - m.lastHitAt < 4) { tgt = this.get(m.targetId); break; }
      }
    }
    const homeD = dist(u.x, u.y, u.leashX, u.leashY);
    if (tgt && (!tgt.alive || tgt.untargetableUntil > now || dist(tgt.x, tgt.y, u.leashX, u.leashY) > leash || now - u.lastHitAt > 6)) {
      // pick another nearby attacker
      tgt = undefined;
      if (u.lastHitAt > now - 3) {
        const alt = this.get(u.lastHitBy);
        if (alt && alt.alive && dist(alt.x, alt.y, u.leashX, u.leashY) <= leash) tgt = alt;
      }
    }
    if (tgt) {
      u.targetId = tgt.id;
      u.ai.intent = { type: 'attack', id: tgt.id };
      u.data.resetting = 0;
      if (u.kind === 'boss') this.bossSpecial(u, tgt);
    } else {
      u.targetId = 0;
      if (homeD > 10) {
        u.ai.intent = { type: 'move', x: u.leashX, y: u.leashY, stop: 4 };
        u.data.resetting = 1;
      } else u.ai.intent = { type: 'hold' };
      if (now - u.lastHitAt > 3) u.hp = Math.min(u.stats.maxHp, u.hp + u.stats.maxHp * 0.25 * DT * 5);
    }
  }

  private bossSpecial(u: Unit, tgt: Unit) {
    const now = this.time;
    if (now < u.data.specialAt || u.castUntil > now) return;
    if (dist(u.x, u.y, tgt.x, tgt.y) > 400) return;
    const m = this.minute();
    if (u.sub === 'blood') {
      u.data.specialAt = now + 7;
      u.castUntil = now + 0.7;
      this.emit({ t: 'cast', id: u.id, k: 's1', x: u.x, y: u.y, dur: 0.7 });
      this.emit({ t: 'vfx', k: 'bloodTele', x: u.x, y: u.y, r: 260, dur: 0.7 });
      this.schedule(0.7, () => {
        if (!u.alive) return;
        this.emit({ t: 'vfx', k: 'bloodNova', x: u.x, y: u.y, r: 260 });
        let total = 0;
        for (const e of this.enemiesInRadius(2, u.x, u.y, 260)) total += dealDamage(this, u, e, 85 + 12 * m, 'magic', { aoe: true });
        heal(this, u, total * 0.5, u);
      });
    } else {
      u.data.specialAt = now + 8;
      u.castUntil = now + 0.9;
      const tx = tgt.x, ty = tgt.y;
      u.facing = dirFrom(tx - u.x, ty - u.y, u.facing);
      this.emit({ t: 'cast', id: u.id, k: 's1', x: tx, y: ty, dur: 0.9 });
      this.emit({ t: 'vfx', k: 'titanTele', x: tx, y: ty, r: 220, dur: 0.9 });
      this.schedule(0.9, () => {
        if (!u.alive) return;
        this.emit({ t: 'vfx', k: 'titanSlam', x: tx, y: ty, r: 220 });
        for (const e of this.enemiesInRadius(2, tx, ty, 220)) {
          dealDamage(this, u, e, 110 + 14 * m, 'phys', { aoe: true });
          if (e.alive) { e.knockupUntil = Math.max(e.knockupUntil, now + 0.9 + 0.6); this.emit({ t: 'status', id: e.id, k: 'knockup', dur: 0.6 }); }
        }
      });
    }
  }

  private thinkSummon(u: Unit) {
    const now = this.time;
    const owner = this.get(u.ownerId);
    if (!owner || (u.expireAt && now >= u.expireAt) || (owner.kind === 'champion' && !owner.alive && u.sub !== 'sentry')) {
      if (u.alive) {
        u.alive = false;
        u.deathTime = now;
        u.removeAt = now + 1.2;
        this.emit({ t: 'death', id: u.id, k: 'expire' });
        if (u.sub === 'wolf' && owner?.champ) owner.champ.passive.wolfRespawn = now + (owner.alive ? 14 : 0.1);
      }
      return;
    }
    const range = u.sub === 'sentry' ? u.stats.range : 520;
    let tgt = u.targetId ? this.get(u.targetId) : undefined;
    const forced = u.data.forceUntil > now ? this.get(u.data.forceTarget) : undefined;
    if (forced && canTarget(this, u, forced)) tgt = forced;
    if (tgt && (!canTarget(this, u, tgt) || dist(tgt.x, tgt.y, u.sub === 'sentry' ? u.x : owner.x, u.sub === 'sentry' ? u.y : owner.y) > range + 120 || (tgt.team !== 2 && !tgt.isStructure && !this.isVisibleTo(tgt, u.team as TeamId)))) tgt = undefined;
    if (!tgt || (this.tick + u.id) % 6 === 0) {
      // follow owner's target
      const oi = owner.ai?.intent;
      const ot = oi && oi.type === 'attack' ? this.get(oi.id) : undefined;
      if (u.sub !== 'sentry' && ot && canTarget(this, u, ot) && dist(ot.x, ot.y, owner.x, owner.y) < range) tgt = ot;
      else if (!tgt) {
        let bd = Infinity;
        const cx = u.sub === 'sentry' ? u.x : owner.x, cy = u.sub === 'sentry' ? u.y : owner.y;
        for (const e of this.units) {
          if (!e.alive || e.team === u.team) continue;
          if (e.team === 2 && !(u.sub !== 'sentry' && ot === e)) continue;
          if (!canTarget(this, u, e) || (!e.isStructure && !this.isVisibleTo(e, u.team as TeamId))) continue;
          if (e.isStructure && u.sub === 'sentry') continue;
          const d = dist(cx, cy, e.x, e.y);
          const sc = d + (e.kind === 'champion' ? (now - e.lastAttackedChampAt < 2 ? -150 : 120) : 0) + (e.isStructure ? 200 : 0);
          if (d <= range && sc < bd) { bd = sc; tgt = e; }
        }
      }
    }
    if (tgt) {
      u.targetId = tgt.id;
      u.ai.intent = { type: 'attack', id: tgt.id };
    } else {
      u.targetId = 0;
      if (u.sub === 'sentry') u.ai.intent = { type: 'hold' };
      else {
        const off = u.sub === 'wolf' ? 50 : 70;
        const ox = owner.x + (owner.facing === 'left' ? off : -off) * 0.5, oy = owner.y + ((u.id % 3) - 1) * off * 0.6;
        u.ai.intent = dist(u.x, u.y, owner.x, owner.y) > 110 ? { type: 'move', x: ox, y: oy, stop: 20 } : { type: 'hold' };
        if (dist(u.x, u.y, owner.x, owner.y) > 900) { const p = nearestWalkable(owner.x, owner.y); u.x = p.x; u.y = p.y; }
      }
    }
  }

  // ------------------------------------------------------------------ main step
  step() {
    if (this.over) return;
    this.tick++;
    this.time = this.tick * DT;
    const now = this.time;

    // commands (deterministic order of submission)
    if (this.cmdQueue.length) {
      const q = this.cmdQueue;
      this.cmdQueue = [];
      for (const cmd of q) {
        const res = this.applyCommand(cmd);
        this.commandLog.push({ tick: this.tick, cmd, res });
        this.emit({ t: 'cmdResult', team: cmd.team, k: res.ok ? 'ok' : 'fail', text: res.reason });
      }
    }

    for (const u of this.units) { u.px = u.x; u.py = u.y; }

    // scheduled effects (time then insertion order)
    if (this.scheduled.length) {
      const due = this.scheduled.filter((s) => s.at <= now + 1e-9).sort((a, b) => a.at - b.at || a.seq - b.seq);
      if (due.length) {
        this.scheduled = this.scheduled.filter((s) => s.at > now + 1e-9);
        for (const s of due) s.fn();
      }
    }

    // spawns
    if (now >= this.nextWaveAt) { this.spawnWave(); this.nextWaveAt += BALANCE.minion.interval; }
    for (const cs of this.camps) if (now >= cs.spawnAt) this.spawnCamp(cs);
    for (const b of this.bosses) if (!b.unitId && now >= b.spawnAt) this.spawnBoss(b);

    // tactical points
    for (const t of this.teams) t.tp = Math.min(BALANCE.tp.max, t.tp + BALANCE.tp.regenPerSec * DT);
    for (const t of this.teams) if (t.buffs.titan > 0 && t.buffs.titan <= now) {
      t.buffs.titan = 0;
      for (const m of this.units) if (m.kind === 'minion' && m.team === t.id) m.hpMul = 1;
    }

    this.hooks.preTick?.(this);

    // champions: respawn, economy, recall, shopping
    for (const u of this.champions()) {
      const c = u.champ!;
      if (!u.alive) {
        if (now >= c.respawnAt) this.respawn(u);
        else { c.gold += BALANCE.passiveGoldPerSec * DT; c.totalGold += BALANCE.passiveGoldPerSec * DT; continue; }
      }
      c.gold += BALANCE.passiveGoldPerSec * DT;
      c.totalGold += BALANCE.passiveGoldPerSec * DT;
      if (now > 30) this.giveXp(u, BALANCE.passiveXpPerSec * DT);
      if (c.recallUntil > 0 && now >= c.recallUntil) {
        c.recallUntil = 0;
        const f = FOUNTAIN_POS[u.team as TeamId];
        u.x = u.px = f.x + (u.team === 0 ? 30 : -30);
        u.y = u.py = f.y + (c.slot - 1) * 50;
        u.path = [];
        this.emit({ t: 'recall', id: u.id, k: 'done' });
      }
      if (inBase(u)) {
        u.hp = Math.min(u.stats.maxHp, u.hp + u.stats.maxHp * BALANCE.baseHealPerSec * DT);
        if (this.tick % 5 === 0) autoBuy(this, u);
      } else {
        // regen & out-of-combat items
        let regen = u.stats.regen;
        const ooc = now - c.lastCombat > 5;
        if (ooc && hasItem(u, 11)) regen += u.stats.maxHp * 0.01;
        if (ooc && hasItem(u, 16)) regen += u.stats.maxHp * 0.015;
        u.hp = Math.min(u.stats.maxHp, u.hp + regen * DT);
      }
      if (c.passive.wolfRespawn && now >= c.passive.wolfRespawn && u.alive) {
        c.passive.wolfRespawn = 0;
        getKit(c.defId).onRespawn?.(this, u);
      }
    }

    // recompute stats
    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.champ) recomputeChampion(this, u);
      else if (u.kind !== 'tower' && u.kind !== 'crystal') recomputeGeneric(this, u);
      if (this.tick % 20 === 0) this.cleanupStatus(u);
    }

    // kit ticks
    for (const u of this.champions()) if (u.alive) getKit(u.champ!.defId).onTick?.(this, u);

    // think (AI) — champions via injected controller
    for (const u of this.units) {
      if (!u.alive) continue;
      switch (u.kind) {
        case 'champion': if ((this.tick + u.id) % 3 === 0 && this.hooks.champThink) this.hooks.champThink(this, u); break;
        case 'minion': if ((this.tick + u.id) % 2 === 0 || !u.ai.intent) this.thinkMinion(u); break;
        case 'tower': case 'crystal': if ((this.tick + u.id) % 2 === 0) this.thinkStructure(u); break;
        case 'monster': case 'boss': if ((this.tick + u.id) % 3 === 0) this.thinkNeutral(u); break;
        case 'summon': if ((this.tick + u.id) % 3 === 0) this.thinkSummon(u); break;
      }
    }

    // act
    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.dash) this.stepDash(u);
      else this.execIntent(u);
    }

    this.separate();
    this.stepProjectiles();
    this.stepZones();
    this.stepDots();

    // cleanup removed units
    if (this.tick % 10 === 0) {
      const keep: Unit[] = [];
      for (const u of this.units) {
        if (!u.alive && u.kind !== 'champion' && !u.isStructure && now >= u.removeAt) { this.byId.delete(u.id); continue; }
        keep.push(u);
      }
      this.units = keep;
      this.projectiles = this.projectiles.filter((p) => !p.dead);
      this.zones = this.zones.filter((z) => !z.dead);
    }

    // vision & knowledge
    if (this.tick % 2 === 0) this.updateVision();
  }

  private cleanupStatus(u: Unit) {
    const now = this.time;
    u.slows = u.slows.filter((s) => s.until > now);
    u.msBuffs = u.msBuffs.filter((s) => s.until > now);
    u.asBuffs = u.asBuffs.filter((s) => s.until > now);
    u.dmgRed = u.dmgRed.filter((s) => s.until > now);
    u.grievous = u.grievous.filter((s) => s.until > now);
    u.armorShred = u.armorShred.filter((s) => s.until > now);
    u.mrShred = u.mrShred.filter((s) => s.until > now);
    u.shields = u.shields.filter((s) => s.until > now && s.amount > 0);
  }

  private updateVision() {
    this.vision.update(this);
    for (const team of [0, 1] as TeamId[]) {
      const T = this.teams[team];
      for (const e of this.champions((1 - team) as TeamId)) {
        if (this.isVisibleTo(e, team)) T.lastSeen.set(e.id, { x: e.x, y: e.y, t: this.time });
      }
      for (const cs of this.camps) {
        const p = CAMPS[cs.id].pos;
        if (this.vision.cellVisible(team, p.x, p.y)) {
          T.campKnown[cs.id] = { alive: cs.alive.length > 0, respawnAt: cs.alive.length > 0 ? 0 : cs.spawnAt, seenAt: this.time };
        } else if (!T.campKnown[cs.id].alive && T.campKnown[cs.id].respawnAt <= this.time && T.campKnown[cs.id].respawnAt > 0) {
          // known timer elapsed -> presumably alive
          T.campKnown[cs.id] = { ...T.campKnown[cs.id], alive: true };
        }
      }
    }
  }

  private respawn(u: Unit) {
    const c = u.champ!;
    const f = FOUNTAIN_POS[u.team as TeamId];
    u.alive = true;
    u.x = u.px = f.x + (u.team === 0 ? 30 : -30);
    u.y = u.py = f.y + (c.slot - 1) * 50;
    recomputeChampion(this, u);
    u.hp = u.stats.maxHp;
    u.stunUntil = u.rootUntil = u.knockupUntil = 0;
    u.slows = [];
    u.windupUntil = 0;
    u.castUntil = 0;
    u.path = [];
    u.ai.intent = { type: 'hold' };
    this.emit({ t: 'respawn', id: u.id });
    getKit(c.defId).onRespawn?.(this, u);
  }

  private stepDash(u: Unit) {
    const d = u.dash!;
    const dd = dist(u.x, u.y, d.tx, d.ty);
    const step = d.speed * DT;
    if (dd <= step) {
      u.x = d.tx; u.y = d.ty;
      u.dash = null;
      d.onEnd?.();
    } else {
      u.x += ((d.tx - u.x) / dd) * step;
      u.y += ((d.ty - u.y) / dd) * step;
    }
    u.moving = true;
  }

  private separate() {
    const list = this.units.filter((u) => u.alive && !u.isStructure && !u.dash && u.sub !== 'sentry');
    const n = list.length;
    for (let i = 0; i < n; i++) {
      const a = list[i];
      for (let j = i + 1; j < n; j++) {
        const b = list[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = (a.radius + b.radius) * 0.8;
        if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2) || 0.01;
        const push = (min - d) * 0.35;
        const ux = d2 > 0.0001 ? dx / d : (a.id % 2 ? 1 : -1), uy = d2 > 0.0001 ? dy / d : 0;
        const wa = a.kind === 'boss' ? 0.1 : 0.5, wb = b.kind === 'boss' ? 0.1 : 0.5;
        const ax = a.x - ux * push * wa * 2, ay = a.y - uy * push * wa * 2;
        const bx = b.x + ux * push * wb * 2, by = b.y + uy * push * wb * 2;
        if (isWalkable(ax, ay)) { a.x = ax; a.y = ay; }
        if (isWalkable(bx, by)) { b.x = bx; b.y = by; }
      }
    }
  }

  private stepProjectiles() {
    for (const p of this.projectiles) {
      if (p.dead) continue;
      const step = p.speed * DT;
      if (p.homing) {
        const t = this.get(p.homing);
        if (!t || !t.alive) { p.dead = true; this.emit({ t: 'projEnd', id: p.id, x: p.x, y: p.y }); continue; }
        const d = dist(p.x, p.y, t.x, t.y - 10);
        if (d <= step + t.radius * 0.5) {
          p.dead = true;
          this.emit({ t: 'projHit', id: p.id, x: t.x, y: t.y, tgt: t.id, k: p.kind });
          p.onHit?.(this, t, p);
        } else {
          p.x += ((t.x - p.x) / d) * step;
          p.y += ((t.y - 10 - p.y) / d) * step;
        }
        continue;
      }
      if (p.toX !== undefined && p.toY !== undefined) {
        const d = dist(p.x, p.y, p.toX, p.toY);
        if (d <= step) {
          p.x = p.toX; p.y = p.toY; p.dead = true;
          this.emit({ t: 'projHit', id: p.id, x: p.x, y: p.y, k: p.kind });
          p.onArrive?.(this, p);
        } else {
          p.x += ((p.toX - p.x) / d) * step;
          p.y += ((p.toY - p.y) / d) * step;
        }
        continue;
      }
      // skillshot
      p.x += (p.dirX ?? 0) * step;
      p.y += (p.dirY ?? 0) * step;
      p.traveled += step;
      for (const u of this.units) {
        if (!u.alive || u.team === p.team || u.isStructure || u.untargetableUntil > this.time) continue;
        if (p.hitsMinions === false && u.kind !== 'champion') continue;
        if (p.hit.includes(u.id)) continue;
        if (dist(p.x, p.y, u.x, u.y) <= u.radius + p.width) {
          p.hit.push(u.id);
          this.emit({ t: 'projHit', id: p.id, x: u.x, y: u.y, tgt: u.id, k: p.kind });
          p.onHit?.(this, u, p);
          if (!p.pierce || (p.stopAtChampion && u.kind === 'champion')) { p.dead = true; break; }
        }
      }
      if (!p.dead && (p.traveled >= (p.maxDist ?? 600) || !isWalkable(p.x, p.y) && p.traveled > 120)) {
        p.dead = true;
        this.emit({ t: 'projEnd', id: p.id, x: p.x, y: p.y });
        p.onArrive?.(this, p);
      }
    }
  }

  private stepZones() {
    const now = this.time;
    for (const z of this.zones) {
      if (z.dead) continue;
      if (z.followId) {
        const f = this.get(z.followId);
        if (f && f.alive) { z.x = f.x; z.y = f.y; } else if (z.kind !== 'fuse') { z.until = now; }
      }
      if (z.onTick && now >= z.next && now < z.until) {
        z.next = now + z.every;
        z.onTick(this, z);
      }
      if (now >= z.until) {
        z.dead = true;
        z.onEnd?.(this, z);
        this.emit({ t: 'zoneEnd', id: z.id });
      }
    }
  }

  private stepDots() {
    const now = this.time;
    for (const u of this.units) {
      if (!u.alive || !u.dots.length) continue;
      for (const d of u.dots) {
        if (d.until <= now) continue;
        d.tickAcc += DT;
        if (d.tickAcc >= 0.5) {
          d.tickAcc -= 0.5;
          const src = this.get(d.srcId);
          if (src) dealDamage(this, src, u, d.perSec * 0.5, d.type, { dot: true, ability: d.abil ? 'dot' : undefined, noProc: true });
          if (!u.alive) break;
        }
      }
      u.dots = u.dots.filter((d) => d.until > now);
    }
  }

  // ------------------------------------------------------------------ helpers for kits
  dot(src: Unit, tgt: Unit, perSec: number, dur: number, type: 'phys' | 'magic' | 'true', key: string) {
    addDot(this, src, tgt, perSec, dur, type, key, true);
  }

  /** Simple numeric summary (headless tests, PvP snapshot base) */
  snapshot() {
    return {
      tick: this.tick,
      time: this.time,
      teams: this.teams.map((t) => ({ tp: Math.round(t.tp * 100) / 100, kills: t.kills, towers: t.towersKilled })),
      units: this.units.filter((u) => u.alive).map((u) => ({ id: u.id, k: u.kind, s: u.sub, t: u.team, x: Math.round(u.x), y: Math.round(u.y), hp: Math.round(u.hp) })),
      over: this.over, winner: this.winner,
    };
  }

  stateHash(): number {
    let h = 2166136261;
    const mix = (v: number) => { h ^= Math.round(v * 10) | 0; h = Math.imul(h, 16777619) >>> 0; };
    mix(this.tick);
    for (const u of this.units) { mix(u.id); mix(u.x); mix(u.y); mix(u.hp); }
    for (const t of this.teams) { mix(t.tp); mix(t.kills); }
    for (const c of this.champions()) { mix(c.champ!.gold); mix(c.champ!.xp); }
    return h >>> 0;
  }
}

function laneLen(lane: LaneId): number {
  return laneProgress(lane, LANES[lane][LANES[lane].length - 1].x, LANES[lane][LANES[lane].length - 1].y);
}

function projKindFor(u: Unit): string {
  if (u.kind === 'tower' || u.kind === 'crystal') return u.team === 0 ? 'towerBlue' : 'towerRed';
  if (u.kind === 'minion') return u.sub === 'siege' ? 'cannon' : u.team === 0 ? 'minionBoltBlue' : 'minionBoltRed';
  if (u.kind === 'monster' || u.kind === 'boss') return 'wisp';
  if (u.kind === 'summon') return u.sub === 'sentry' ? 'runeBolt' : 'bone';
  switch (u.sub) {
    case 'edrin': return 'arrow';
    case 'tessa': return 'bolt';
    case 'dorn': return 'shot';
    case 'asira': return 'emberBolt';
    case 'liris': return 'frostBolt';
    case 'orun': return 'voidBolt';
    case 'nekmar': return 'soulBolt';
    case 'ilvara': return 'runeBolt';
  }
  return 'arrow';
}

export { TICK_RATE };
