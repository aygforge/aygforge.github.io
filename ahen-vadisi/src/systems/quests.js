// QuestService — görev koşulları, sayaçlar, tek seferlik ödüller ve Av Sözleşmeleri.
import { ALL_QUESTS, QUEST_MAP, CONTRACT_KILLS, CONTRACT_EXP_FACTOR, CONTRACT_GOLD_FACTOR, CONTRACT_LEVEL_WINDOW } from '../data/quests.js';
import { ENEMIES } from '../data/enemies.js';
import { STACKABLES } from '../data/materials.js';
import { countStack, removeStack, stackCapacity, addStack } from './inventory.js';
import { gainExp } from './character.js';

export function questState(char, qid) {
  return char.quests[qid] || null;
}

export function questStatus(char, q) {
  const st = char.quests[q.id];
  if (st) return st.s; // active | done
  if ((q.prereq || []).some((p) => char.quests[p]?.s !== 'done')) return 'locked';
  if (char.level < q.minLevel) return 'lowlevel';
  return 'available';
}

export function objectiveProgress(char, q, i) {
  const o = q.objectives[i];
  const st = char.quests[q.id];
  if (!st) return 0;
  if (st.s === 'done') return o.count ?? 1;
  if (o.type === 'deliver') return Math.min(o.count, countStack(char.bag, o.item));
  if (o.type === 'talk') return 0;
  return st.p[i] || 0;
}

export function objectiveTarget(o) {
  return o.count ?? 1;
}

export function objectiveDone(char, q, i) {
  return objectiveProgress(char, q, i) >= objectiveTarget(q.objectives[i]);
}

export function isReady(char, q) {
  const st = char.quests[q.id];
  if (!st || st.s !== 'active') return false;
  return q.objectives.every((o, i) => o.type === 'talk' || objectiveDone(char, q, i));
}

export function questsForNpc(char, npcId) {
  return ALL_QUESTS.filter((q) => q.giver === npcId || q.turnIn === npcId)
    .map((q) => ({ q, status: questStatus(char, q), ready: isReady(char, q) }))
    .filter((x) => (x.status === 'available' && x.q.giver === npcId) || (x.status === 'active' && x.q.turnIn === npcId) || (x.status === 'lowlevel' && x.q.giver === npcId && x.q.minLevel - char.level <= 2));
}

export function acceptQuest(char, qid) {
  const q = QUEST_MAP[qid];
  if (!q) return { ok: false, msg: 'Görev yok' };
  const s = questStatus(char, q);
  if (s !== 'available') return { ok: false, msg: s === 'lowlevel' ? `Seviye ${q.minLevel} gerekli` : 'Görev alınamaz' };
  char.quests[qid] = { s: 'active', p: q.objectives.map(() => 0), used: [], at: Date.now() };
  return { ok: true, q };
}

export function abandonQuest(char, qid) {
  const st = char.quests[qid];
  if (!st || st.s !== 'active') return { ok: false };
  delete char.quests[qid];
  return { ok: true };
}

function activeQuests(char) {
  return Object.entries(char.quests).filter(([, s]) => s.s === 'active').map(([id]) => QUEST_MAP[id]).filter(Boolean);
}

function afterOk(char, q, o) {
  return (o.after || []).every((j) => objectiveDone(char, q, j));
}

// ----------------------------------------------------------------- olaylar
export function onKill(char, enemyId, rng) {
  const e = ENEMIES[enemyId];
  const updates = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (!afterOk(char, q, o)) return;
      if (st.p[i] >= objectiveTarget(o)) return;
      if (o.type === 'kill') {
        const match = o.enemy ? (o.enemy === enemyId || ENEMIES[enemyId]?.variantOf === o.enemy)
          : (o.enemies === '*' ? (e.kind === 'normal' || e.kind === 'elite' || e.kind === 'boss') && e.level >= (o.minLevel || 0) : o.enemies.includes(enemyId));
        if (match) { st.p[i]++; updates.push({ q, i, label: o.label, p: st.p[i], n: o.count }); }
      } else if (o.type === 'qitem' && o.from.includes(enemyId)) {
        if (rng.float() < o.chance) { st.p[i]++; updates.push({ q, i, label: o.name, p: st.p[i], n: o.count, item: true }); }
      }
    });
  }
  // Av sözleşmesi
  if (char.contract && char.contract.enemy === enemyId && char.contract.p < char.contract.n) {
    char.contract.p++;
    updates.push({ contract: true, label: `Sözleşme: ${ENEMIES[enemyId].name}`, p: char.contract.p, n: char.contract.n });
  }
  return updates;
}

export function onReach(char, locId) {
  const updates = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (o.type === 'reach' && o.loc === locId && !st.p[i] && afterOk(char, q, o)) {
        st.p[i] = 1;
        updates.push({ q, i, label: o.label, p: 1, n: 1 });
      }
    });
  }
  return updates;
}

// Görev nesnesi etkileşimi. Döner: { counted, updates }
export function onInteract(char, group, objId) {
  const updates = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (o.type !== 'interact' || o.group !== group) return;
      if (!afterOk(char, q, o)) return;
      if (st.p[i] >= o.count) return;
      if (st.used.includes(objId)) return;
      st.used.push(objId);
      st.p[i]++;
      updates.push({ q, i, label: o.label, p: st.p[i], n: o.count });
      if (q.unlocksDungeon && group === 'dungeon_gate') char.world.dungeonUnlocked = true;
    });
  }
  return updates;
}

export function canInteractQuestObject(char, group, objId) {
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    for (let i = 0; i < q.objectives.length; i++) {
      const o = q.objectives[i];
      if (o.type === 'interact' && o.group === group && afterOk(char, q, o) && st.p[i] < o.count && !st.used.includes(objId)) return true;
    }
  }
  return false;
}

export function onDungeonStage(char, stage) {
  const updates = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (o.type === 'dungeon' && stage >= o.stage && !st.p[i]) {
        st.p[i] = 1;
        updates.push({ q, i, label: o.label, p: 1, n: 1 });
      }
    });
  }
  return updates;
}

// ----------------------------------------------------------------- teslim (tek seferlik ödül)
export function turnInQuest(char, qid, npcId) {
  const q = QUEST_MAP[qid];
  const st = char.quests[qid];
  if (!q || !st || st.s !== 'active') return { ok: false, msg: 'Aktif görev değil' };
  if (npcId && q.turnIn !== npcId) return { ok: false, msg: 'Teslim NPC\'si farklı' };
  if (!isReady(char, q)) return { ok: false, msg: 'Görev hedefleri tamamlanmadı' };
  // ödül eşyaları için yer kontrolü (teslim tüketimi düşülerek)
  const sim = { size: char.bag.size, slots: char.bag.slots.map((s) => (s ? { ...s } : null)) };
  for (const o of q.objectives) if (o.type === 'deliver') removeStack(sim, o.item, o.count);
  for (const r of q.rewardItems) {
    if (stackCapacity(sim, r.id) < r.qty) return { ok: false, msg: 'Ödül için çantada yer yok' };
  }
  for (const o of q.objectives) if (o.type === 'deliver') removeStack(char.bag, o.item, o.count);
  for (const r of q.rewardItems) addStack(char.bag, r.id, r.qty);
  st.s = 'done';
  st.done = Date.now();
  char.gold += q.gold;
  if (q.skillPoint) char.bonusSkillPoints = (char.bonusSkillPoints || 0) + q.skillPoint;
  if (q.mastery) char.mastery = true;
  if (q.title && !char.titles.includes(q.title)) char.titles.push(q.title);
  if (q.unlocksDungeon) char.world.dungeonUnlocked = true;
  const exp = gainExp(char, q.exp);
  return { ok: true, q, exp: q.exp, gold: q.gold, items: q.rewardItems, levelEvents: exp.events };
}


// ----------------------------------------------------------------- Av Sözleşmeleri (tekrarlanabilir, ana görevlerden ayrı)
export function contractOffers(char) {
  if (char.quests.s01?.s !== 'done') return [];
  return Object.values(ENEMIES)
    .filter((e) => e.kind === 'normal' && e.level - char.level >= CONTRACT_LEVEL_WINDOW[0] && e.level - char.level <= CONTRACT_LEVEL_WINDOW[1])
    .map((e) => ({
      enemy: e.id, n: CONTRACT_KILLS,
      exp: Math.round(CONTRACT_KILLS * e.exp * CONTRACT_EXP_FACTOR),
      gold: Math.round(CONTRACT_KILLS * ((e.gold[0] + e.gold[1]) / 2) * CONTRACT_GOLD_FACTOR),
    }));
}

export function acceptContract(char, enemyId) {
  if (char.contract) return { ok: false, msg: 'Zaten aktif bir sözleşmen var' };
  const offer = contractOffers(char).find((o) => o.enemy === enemyId);
  if (!offer) return { ok: false, msg: 'Sözleşme uygun değil' };
  char.contract = { ...offer, p: 0, id: `${enemyId}_${Date.now()}` };
  return { ok: true, contract: char.contract };
}

export function claimContract(char) {
  const c = char.contract;
  if (!c) return { ok: false, msg: 'Sözleşme yok' };
  if (c.p < c.n) return { ok: false, msg: 'Sözleşme tamamlanmadı' };
  char.contract = null;
  char.contractsDone = (char.contractsDone || 0) + 1;
  char.gold += c.gold;
  const exp = gainExp(char, c.exp);
  return { ok: true, exp: c.exp, gold: c.gold, levelEvents: exp.events };
}

export function cancelContract(char) {
  if (!char.contract) return { ok: false };
  char.contract = null;
  return { ok: true };
}

// Görevin şu anki ipucu: ilk tamamlanmamış hedefin kendi ipucu, yoksa görevin genel ipucu
export function currentHint(char, q) {
  const i = q.objectives.findIndex((o, k) => !objectiveDone(char, q, k));
  return (i >= 0 && q.objectives[i].hint) || q.hint || null;
}

export function trackedQuestList(char) {
  return activeQuests(char).map((q) => ({
    q,
    ready: isReady(char, q),
    hint: currentHint(char, q),
    objectives: q.objectives.map((o, i) => ({ label: o.label, p: objectiveProgress(char, q, i), n: objectiveTarget(o), type: o.type })),
  }));
}

export function stackName(id) {
  return STACKABLES[id]?.name || id;
}
