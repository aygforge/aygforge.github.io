import type { Kit } from './types';
import { TANK_KITS } from './tanks';
import { FIGHTER_KITS } from './fighters';
import { MAGE_KITS } from './mages';
import { ASSASSIN_KITS } from './assassins';
import { MARKSMAN_KITS } from './marksmen';
import { SUMMONER_KITS } from './summoners';

const ALL: Record<string, Kit> = { ...TANK_KITS, ...FIGHTER_KITS, ...MAGE_KITS, ...ASSASSIN_KITS, ...MARKSMAN_KITS, ...SUMMONER_KITS };

export function getKit(id: string): Kit {
  const k = ALL[id];
  if (!k) throw new Error('No kit for ' + id);
  return k;
}
export const KIT_IDS = Object.keys(ALL);
