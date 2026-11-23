import type { CampKind } from '../core/map';

export interface MonsterDef { sub: string; hp: number; ad: number; as: number; range: number; armor: number; mr: number; ms: number; radius: number; gold: number; xp: number; offX: number; offY: number }
export interface CampData { kind: CampKind; name: string; gold: number; xp: number; monsters: MonsterDef[]; buff?: string }

export const CAMP_DATA: Record<CampKind, CampData> = {
  wolf: {
    kind: 'wolf', name: 'Kurt Sürüsü', gold: 70, xp: 60,
    monsters: [
      { sub: 'alphawolf', hp: 560, ad: 28, as: 0.9, range: 70, armor: 12, mr: 8, ms: 190, radius: 22, gold: 40, xp: 30, offX: 0, offY: 0 },
      { sub: 'wolfling', hp: 240, ad: 13, as: 1.0, range: 60, armor: 6, mr: 4, ms: 200, radius: 15, gold: 15, xp: 15, offX: -55, offY: 35 },
      { sub: 'wolfling', hp: 240, ad: 13, as: 1.0, range: 60, armor: 6, mr: 4, ms: 200, radius: 15, gold: 15, xp: 15, offX: 55, offY: 35 },
    ],
  },
  golem: {
    kind: 'golem', name: 'Kadim Golem', gold: 90, xp: 70,
    monsters: [{ sub: 'golem', hp: 1100, ad: 36, as: 0.6, range: 85, armor: 24, mr: 10, ms: 150, radius: 30, gold: 90, xp: 70, offX: 0, offY: 0 }],
  },
  spirit: {
    kind: 'spirit', name: 'Ruh Bekçisi', gold: 75, xp: 80, buff: 'speed',
    monsters: [
      { sub: 'spirit', hp: 680, ad: 30, as: 0.75, range: 260, armor: 10, mr: 22, ms: 170, radius: 22, gold: 60, xp: 64, offX: 0, offY: 0 },
      { sub: 'wisp', hp: 190, ad: 12, as: 0.9, range: 220, armor: 4, mr: 12, ms: 190, radius: 12, gold: 15, xp: 16, offX: 50, offY: -40 },
    ],
  },
};

export interface BossDef { sub: 'blood' | 'titan'; name: string; hp: number; ad: number; as: number; range: number; armor: number; mr: number; ms: number; radius: number }
export const BOSS_DATA: Record<'blood' | 'titan', BossDef> = {
  blood: { sub: 'blood', name: 'Kan Hükümdarı', hp: 3000, ad: 62, as: 0.7, range: 130, armor: 30, mr: 30, ms: 160, radius: 46 },
  titan: { sub: 'titan', name: 'Harabe Titanı', hp: 3900, ad: 74, as: 0.55, range: 140, armor: 48, mr: 22, ms: 140, radius: 52 },
};

export interface MinionDef { sub: 'melee' | 'ranged' | 'siege'; hp: number; ad: number; as: number; range: number; armor: number; mr: number; ms: number; radius: number; gold: number; xp: number }
export const MINION_DATA: Record<'melee' | 'ranged' | 'siege', MinionDef> = {
  melee: { sub: 'melee', hp: 310, ad: 13, as: 0.85, range: 70, armor: 10, mr: 5, ms: 135, radius: 16, gold: 16, xp: 28 },
  ranged: { sub: 'ranged', hp: 220, ad: 20, as: 0.75, range: 300, armor: 4, mr: 4, ms: 135, radius: 14, gold: 18, xp: 22 },
  siege: { sub: 'siege', hp: 540, ad: 30, as: 0.6, range: 340, armor: 20, mr: 10, ms: 112, radius: 22, gold: 30, xp: 45 },
};
