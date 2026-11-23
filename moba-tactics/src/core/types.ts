import type { Dir } from './math';
import type { LaneId, TeamId, CampKind } from './map';
import type { CompCode, StatBlock } from '../data/items';
import type { Position } from '../data/champions';

export type UnitKind = 'champion' | 'minion' | 'tower' | 'crystal' | 'monster' | 'boss' | 'summon';
export type Side = TeamId | 2; // 2 = neutral
export type DmgType = 'phys' | 'magic' | 'true';
export type Style = 'aggressive' | 'balanced' | 'defensive';
export type JungleStrategy = 'aggressive' | 'balanced' | 'farm';
export type OrderKind = 'farm' | 'push' | 'defend' | 'retreat' | 'jungle' | 'raid_top' | 'raid_bot' | 'boss';
export const TEMP_ORDERS: OrderKind[] = ['retreat', 'raid_top', 'raid_bot', 'boss'];
export const LANER_ORDERS: OrderKind[] = ['farm', 'push', 'defend', 'retreat'];
export const JUNGLER_ORDERS: OrderKind[] = ['jungle', 'raid_top', 'raid_bot', 'boss', 'retreat'];

export interface Shield { amount: number; until: number; src: string }
export interface Dot { srcId: number; perSec: number; type: DmgType; until: number; key: string; tickAcc: number; abil: boolean }

export interface InvSlot { kind: 'comp' | 'item'; code?: CompCode; itemId?: number; spent: number }

export interface ChampState {
  defId: string;
  slot: number; // 0 top, 1 jungle, 2 bot
  position: Position;
  level: number;
  xp: number;
  gold: number;
  totalGold: number;
  inventory: InvSlot[];
  build: number[];
  style: Style;
  baseOrder: OrderKind; // persistent
  baseFromCmd: boolean; // persistent order explicitly chosen by the commander
  order: OrderKind; // current (may be temp)
  orderSince: number;
  orderData: Record<string, number>;
  cds: { s1: number; s2: number; ult: number }; // time when ready
  kills: number; deaths: number; assists: number; cs: number;
  respawnAt: number;
  recallUntil: number; // >0 while channeling
  lastCombat: number;
  lastMoved: number;
  stillSince: number;
  attackCount: number;
  dmgDealtChamps: number;
  passive: Record<string, number>;
  itemCd: Record<string, number>;
  damagedBy: Map<number, number>; // champ id -> time
  lane: LaneId | null;
}

export interface UnitStats {
  maxHp: number; ad: number; ap: number; armor: number; mr: number; as: number; range: number; ms: number;
  cdr: number; armorPen: number; mrPen: number; lifesteal: number; regen: number;
}

export interface GameEvent {
  t: string;
  id?: number;
  tgt?: number;
  x?: number; y?: number; x2?: number; y2?: number;
  v?: number;
  k?: string;
  team?: number;
  r?: number;
  dur?: number;
  text?: string;
}

export type { Dir, LaneId, TeamId, CampKind, StatBlock, CompCode };
