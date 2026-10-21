// Öldürme ödüllerini tek yerde ve tek seferde uygular (EXP, Gold, ekipman, materyal, görev sayacı).
// Boss öldürmeleri benzersiz killId ile talep edilir; aynı kill ikinci kez ödül vermez.
import { ENEMIES } from '../data/enemies.js';
import { expMultiplier } from '../data/constants.js';
import { rollKillLoot } from './loot.js';
import { addItem, addStack } from './inventory.js';
import { gainExp } from './character.js';
import { onKill } from './quests.js';

export function applyKill(char, enemyId, { killId, unique = false } = {}, rng) {
  const e = ENEMIES[enemyId];
  const res = { exp: 0, gold: 0, items: [], pending: [], lost: [], stacks: [], lostStacks: [], quest: [], levelEvents: [], duplicate: false };
  if (!e) return res;
  if (unique) {
    if (char.claims[killId]) { res.duplicate = true; return res; }
  }
  // Görev sayacı (eğitim kuklası dahil)
  res.quest = onKill(char, enemyId, rng);
  char.record.kills += e.kind === 'dummy' ? 0 : 1;
  char.record.killsByEnemy[enemyId] = (char.record.killsByEnemy[enemyId] || 0) + 1;
  // Av Geçmişi (V2'den itibaren kaydedilir; ganimet şansını etkilemez)
  const hist = char.history;
  if (hist && e.kind !== 'dummy' && e.kind !== 'summon') {
    hist.kills += 1;
    hist.byEnemy[enemyId] = (hist.byEnemy[enemyId] || 0) + 1;
  }
  if (e.noReward) return res;

  const loot = rollKillLoot(enemyId, { cls: char.cls, killId }, rng);
  res.gold = loot.gold;
  char.gold += loot.gold;
  for (const inst of loot.equipment) {
    const r = addItem(char, inst, { allowPending: true });
    if (r.where === 'bag') res.items.push(inst);
    else if (r.where === 'pending') res.pending.push(inst);
    else res.lost.push(inst);
    if (inst.r === 'L') char.record.legendaries += 1;
    if (hist && r.ok && hist.found[inst.r] !== undefined) hist.found[inst.r] += 1;
  }
  for (const st of loot.stacks) {
    const left = addStack(char.bag, st.id, st.qty);
    if (st.qty - left > 0) res.stacks.push({ id: st.id, qty: st.qty - left });
    if (left > 0) res.lostStacks.push({ id: st.id, qty: left });
  }
  const mult = expMultiplier(char.level, e.level);
  res.exp = Math.round(e.exp * mult);
  const g = gainExp(char, res.exp);
  res.levelEvents = g.events;
  if (unique) char.claims[killId] = Date.now();
  if (e.kind === 'boss') char.record.bossKills[enemyId] = (char.record.bossKills[enemyId] || 0) + 1;
  if (e.kind === 'boss' && hist) hist.bossKills[enemyId] = (hist.bossKills[enemyId] || 0) + 1;
  return res;
}
