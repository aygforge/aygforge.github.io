import { CHAMP_BY_ID } from '../data/champions';
import { ITEM_BY_ID } from '../data/items';
import type { TeamObservation } from '../core/observation';

export interface CounterSuggestion { itemId: number; reason: string }

const AP_CHAMPS = new Set(['asira', 'liris', 'orun', 'nekmar', 'ilvara']);
export const damageTypeOf = (defId: string) => (AP_CHAMPS.has(defId) ? 'ap' : 'ad');

/**
 * Optional counter-item suggestions from the team's observation only:
 * enemy picks are public (draft), enemy items only when they were visible.
 */
export function counterSuggestions(obs: TeamObservation, slot: number): CounterSuggestion[] {
  const me = obs.allies.find((a) => a.slot === slot);
  if (!me) return [];
  const type = damageTypeOf(me.defId);
  const out: CounterSuggestion[] = [];
  const enemyDefs = obs.enemies.map((e) => e.defId);
  const visItems = obs.enemies.flatMap((e) => e.items ?? []);
  const healers = enemyDefs.filter((d) => ['malvek', 'rovan'].includes(d)).length + visItems.filter((i) => i === 4).length;
  const armorHeavy = enemyDefs.filter((d) => CHAMP_BY_ID[d].cls === 'tank').length + visItems.filter((i) => [9, 12, 23, 8, 22].includes(i)).length;
  const mrHeavy = enemyDefs.filter((d) => CHAMP_BY_ID[d].cls === 'tank').length * 0.5 + visItems.filter((i) => [10, 12, 16, 19].includes(i)).length;
  const shields = enemyDefs.filter((d) => ['boran'].includes(d)).length + visItems.filter((i) => i === 12).length;
  if (healers >= 1) out.push(type === 'ad' ? { itemId: 17, reason: 'Rakipte yüksek iyileşme var' } : { itemId: 18, reason: 'Rakipte yüksek iyileşme var' });
  if (type === 'ad' && armorHeavy >= 2) out.push({ itemId: 3, reason: 'Rakipte çok zırh var' });
  if (type === 'ap' && mrHeavy >= 1.5) out.push({ itemId: 7, reason: 'Rakipte büyü direnci yüksek' }, { itemId: 20, reason: 'Rakipte büyü direnci yüksek' });
  if (type === 'ad' && shields >= 1) out.push({ itemId: 19, reason: 'Rakipte kalkan etkileri var' });
  if (me.position === 'jungle' && obs.jungleStrategy !== 'farm' && type === 'ad') out.push({ itemId: 24, reason: 'Orman odaklı strateji' });
  // remove already in build/owned
  return out.filter((s, i) => out.findIndex((o) => o.itemId === s.itemId) === i && !me.build.includes(s.itemId) && ITEM_BY_ID[s.itemId]);
}
