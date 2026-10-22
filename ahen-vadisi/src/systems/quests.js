// QuestService — görev koşulları, sayaçlar, tek seferlik ödüller ve Av Sözleşmeleri.
import { ALL_QUESTS, QUEST_MAP, CONTRACT_KILLS, CONTRACT_EXP_FACTOR, CONTRACT_GOLD_FACTOR, CONTRACT_LEVEL_WINDOW } from '../data/quests.js';
import { ENEMIES } from '../data/enemies.js';
import { NPCS } from '../data/npcs.js';
import { STACKABLES } from '../data/materials.js';
import { countStack, removeStack, stackCapacity, addStack, hasMaterials, consumeMaterials } from './inventory.js';
import { gainExp } from './character.js';
import { DUNGEON_INFO, unlockDungeon } from './dungeon.js';

export function questState(char, qid) {
  return char.quests[qid] || null;
}

// V3: aynı anda en çok bu kadar aktif yan görev (yeni oyuncu görev listesinde kaybolmasın; ana/sınıf görevleri hariç)
export const MAX_ACTIVE_SIDE = 8;

export function questStatus(char, q) {
  const st = char.quests[q.id];
  if (st) return st.s; // active | done
  if (q.cls && q.cls !== char.cls) return 'locked';
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
  return Math.min(o.count ?? 1, st.p[i] || 0);
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
    .filter((x) => (x.status === 'available' && x.q.giver === npcId) || (x.status === 'active' && x.q.turnIn === npcId) || (x.status === 'lowlevel' && x.q.giver === npcId && x.q.minLevel - char.level <= 2 && !(x.q.cls && x.q.cls !== char.cls)));
}

export function acceptQuest(char, qid) {
  const q = QUEST_MAP[qid];
  if (!q) return { ok: false, msg: 'Görev yok' };
  const s = questStatus(char, q);
  if (s !== 'available') return { ok: false, msg: s === 'lowlevel' ? `Seviye ${q.minLevel} gerekli` : 'Görev alınamaz' };
  if (!q.main && !q.classQuest && activeSideCount(char) >= MAX_ACTIVE_SIDE) return { ok: false, msg: `En çok ${MAX_ACTIVE_SIDE} yan görev aynı anda yürütülebilir. Önce birini teslim et ya da bırak.` };
  // görevle verilen eşyalar (ör. mühürlü paket): çantada yer yoksa görev alınmaz
  for (const g of q.giveOnAccept || []) if (stackCapacity(char.bag, g.id) < g.qty) return { ok: false, msg: 'Görev eşyası için çantada yer aç' };
  for (const g of q.giveOnAccept || []) addStack(char.bag, g.id, g.qty);
  char.quests[qid] = { s: 'active', p: q.objectives.map(() => 0), used: [], at: Date.now() };
  char.tracking = char.tracking || [];
  if (!q.main && char.tracking.length < 3 && !char.tracking.includes(qid)) char.tracking.push(qid);
  return { ok: true, q };
}

export function abandonQuest(char, qid) {
  const st = char.quests[qid];
  if (!st || st.s !== 'active') return { ok: false };
  const q = QUEST_MAP[qid];
  // bırakılan görevin verdiği görev eşyaları geri alınır (yeniden alınınca tekrar verilir)
  for (const g of q?.giveOnAccept || []) removeStack(char.bag, g.id, Math.min(g.qty, countStack(char.bag, g.id)));
  delete char.quests[qid];
  if (char.tracking) char.tracking = char.tracking.filter((x) => x !== qid);
  return { ok: true };
}

export function activeSideCount(char) {
  return Object.entries(char.quests).filter(([id, s]) => s.s === 'active' && QUEST_MAP[id] && !QUEST_MAP[id].main && !QUEST_MAP[id].classQuest).length;
}

// HUD takibi: en çok 3 görev
export function toggleTrack(char, qid) {
  char.tracking = char.tracking || [];
  if (char.tracking.includes(qid)) { char.tracking = char.tracking.filter((x) => x !== qid); return { ok: true, tracked: false }; }
  if (char.quests[qid]?.s !== 'active') return { ok: false, msg: 'Yalnız aktif görevler takip edilir' };
  if (char.tracking.length >= 3) return { ok: false, msg: 'En çok 3 görev takip edilebilir' };
  char.tracking.push(qid);
  return { ok: true, tracked: true };
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

// Kullanılmış nesne anahtarı: V1/V2'de düz nesne kimliği; aynı nesneyi ikinci bir hedefte (ör. önce incele, sonra
// arındır) yeniden kullanan V3 hedefleri hedef sırasıyla ayrışır.
function usedKey(o, i, objId) {
  return o.sameObjectAgain ? `${objId}#${i}` : objId;
}

// Görev nesnesinin bu karakter için açık hedefi: { q, i, o } (ilk uygun) ya da null.
// V3: 'ordered' hedeflerde nesneler sırayla incelenir (objOrder = nesnenin 1'den başlayan sırası).
function interactTarget(char, group, objId, objOrder = null) {
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    for (let i = 0; i < q.objectives.length; i++) {
      const o = q.objectives[i];
      if (o.type !== 'interact' || o.group !== group || !afterOk(char, q, o)) continue;
      if (st.p[i] >= o.count || st.used.includes(usedKey(o, i, objId))) continue;
      return { q, i, o, st, wrongOrder: !!(o.ordered && objOrder !== null && objOrder !== (st.p[i] || 0) + 1) };
    }
  }
  return null;
}

// Etkileşim gereksinimi (V3: onarım/arındırma materyali, sıralı inceleme, işlem süresi)
// Döner: { ok, msg?, channel, mode, consume[] }
export function interactRequirement(char, group, objId, objOrder = null) {
  const t = interactTarget(char, group, objId, objOrder);
  if (!t) return { ok: false, msg: null };
  const { o } = t;
  if (t.wrongOrder) return { ok: false, msg: o.orderMsg || 'Önce önceki ipucunu incele. İzler bir sıra izliyor.' };
  const consume = o.consume || [];
  if (consume.length && !hasMaterials(char, consume)) {
    return { ok: false, msg: `Gerekli: ${consume.map((m) => `${stackName(m.id)} ×${m.qty}`).join(', ')}` };
  }
  return { ok: true, channel: o.channel || 1.0, mode: o.mode || 'inspect', consume };
}

// Görev nesnesi etkileşimi (gereksinimler önceden interactRequirement ile denetlenir). Döner: updates[]
export function onInteract(char, group, objId, objOrder = null) {
  const updates = [];
  const t = interactTarget(char, group, objId, objOrder);
  if (!t || t.wrongOrder) return updates;
  const { q, i, o, st } = t;
  if (o.consume?.length) {
    if (!hasMaterials(char, o.consume)) return updates;
    consumeMaterials(char, o.consume);
  }
  // aynı nesne aynı hedefte bir kez sayılır (V1/V2 kimlikleri korunur: düz nesne kimliği)
  st.used.push(usedKey(o, i, objId));
  st.p[i]++;
  updates.push({ q, i, label: o.label, p: st.p[i], n: o.count });
  if (st.p[i] >= o.count && o.setFlag) { char.world.flags = char.world.flags || {}; char.world.flags[o.setFlag] = true; }
  const dId = q.unlocksDungeon === true ? 'dungeon' : q.unlocksDungeon;
  if (dId && group === DUNGEON_INFO[dId].gateGroup) unlockDungeon(char, dId);
  return updates;
}

// strict: sıralı hedefte yalnız sıradaki nesne "etkin" sayılır (parıltı/rehber için)
export function canInteractQuestObject(char, group, objId, objOrder = null, strict = false) {
  const t = interactTarget(char, group, objId, objOrder);
  return !!t && !(strict && t.wrongOrder);
}

// V3: NPC ziyareti ('visit' hedefi): NPC paneli açılınca. takes: teslim edilen görev eşyası
export function onTalk(char, npcId) {
  const updates = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (o.type !== 'visit' || o.npc !== npcId || st.p[i] || !afterOk(char, q, o)) return;
      if (o.takes?.length) {
        if (!hasMaterials(char, o.takes)) return;
        consumeMaterials(char, o.takes);
      }
      st.p[i] = 1;
      updates.push({ q, i, label: o.label, p: 1, n: 1, say: o.say });
    });
  }
  return updates;
}

// V3: gerçek üretim olayı ('craft' hedefi): yalnız craft() başarıyla çalışınca sayılır, taşınan materyal sayılmaz
export function onCraft(char, recipeId, outId, qty = 1) {
  const updates = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (o.type !== 'craft' || !afterOk(char, q, o)) return;
      if (!(o.recipe === recipeId || (o.item && o.item === outId))) return;
      if ((st.p[i] || 0) >= o.count) return;
      st.p[i] = Math.min(o.count, (st.p[i] || 0) + qty);
      updates.push({ q, i, label: o.label, p: st.p[i], n: o.count });
    });
  }
  return updates;
}

// V3: refakat / savunma olayı tamamlandı ('escort' | 'defend' hedefi)
export function onEventComplete(char, kind, eventId) {
  const updates = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (o.type !== kind || o.event !== eventId || st.p[i] || !afterOk(char, q, o)) return;
      st.p[i] = 1;
      updates.push({ q, i, label: o.label, p: 1, n: 1 });
      if (o.setFlag) { char.world.flags = char.world.flags || {}; char.world.flags[o.setFlag] = true; }
    });
  }
  return updates;
}

// Olay hedefi bu karakterde tamamlandı mı (görev teslim edilmiş olsa da)
export function eventDone(char, kind, eventId) {
  for (const q of ALL_QUESTS) {
    const st = char.quests[q.id];
    if (!st) continue;
    const i = q.objectives.findIndex((o) => o.type === kind && o.event === eventId);
    if (i >= 0 && (st.s === 'done' || st.p[i])) return true;
  }
  return false;
}

// Bu karakter için şu an başlatılabilir olay (refakat/savunma) hedefi var mı?
export function eventAvailable(char, kind, eventId) {
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    for (let i = 0; i < q.objectives.length; i++) {
      const o = q.objectives[i];
      if (o.type === kind && o.event === eventId && !st.p[i] && afterOk(char, q, o)) return { q, i, o };
    }
  }
  return null;
}

// V3: görev varyantı avları — haritada doğması gereken özel hedefler ({ enemy, map, x, y, key })
export function huntSpawns(char, mapId) {
  const out = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (o.type === 'kill' && o.spawn && o.spawn.map === mapId && (st.p[i] || 0) < o.count && afterOk(char, q, o)) {
        out.push({ enemy: o.enemy, x: o.spawn.x, y: o.spawn.y, key: `${q.id}:${i}`, n: o.count - (st.p[i] || 0) });
      }
    });
  }
  return out;
}

export function onDungeonStage(char, stage, mapId = 'dungeon') {
  const updates = [];
  for (const q of activeQuests(char)) {
    const st = char.quests[q.id];
    q.objectives.forEach((o, i) => {
      if (o.type === 'dungeon' && (o.dungeon || 'dungeon') === mapId && stage >= o.stage && !st.p[i]) {
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
  if (q.mastery2) char.mastery2 = true;
  if (q.title && !char.titles.includes(q.title)) char.titles.push(q.title);
  if (q.unlocksDungeon) unlockDungeon(char, q.unlocksDungeon === true ? 'dungeon' : q.unlocksDungeon);
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
  const tr = char.tracking || [];
  const rank = (q) => (tr.includes(q.id) ? tr.indexOf(q.id) : 10 + (q.main ? 0 : 1));
  return activeQuests(char).sort((a, b) => rank(a) - rank(b)).map((q) => ({
    tracked: tr.includes(q.id),
    q,
    ready: isReady(char, q),
    hint: currentHint(char, q),
    objectives: q.objectives.map((o, i) => ({ label: o.label, p: objectiveProgress(char, q, i), n: objectiveTarget(o), type: o.type })),
  }));
}

// V3 görev günlüğü: bölge (açık 'region' alanı yoksa ipucu haritasından / veren NPC'den türetilir)
export const QUEST_REGIONS = [
  ['village', 'Köy'], ['forest', 'Orman'], ['mine', 'Maden'], ['swamp', 'Bataklık'],
  ['ash', 'Kül Yaylaları'], ['frost', 'Ayaz Geçidi'], ['dead', 'Ölü Krallık'], ['throne', 'Kara Taht'],
];
const MAP_REGION = { village: 'village', forest: 'forest', mine: 'mine', dungeon: 'mine', swamp: 'swamp', ash: 'ash', frost: 'frost', frost_temple: 'frost', dead_kingdom: 'dead', black_throne: 'throne', dark_crypt: 'throne' };
export function questRegion(q) {
  if (q.region) return q.region;
  const h = q.hint || q.objectives.find((o) => o.hint)?.hint;
  return (h && MAP_REGION[h.map]) || NPCS[q.giver]?.region || 'village';
}
// Görev kategorisi: main | side | class
export function questCategory(q) {
  return q.main ? 'main' : q.classQuest ? 'class' : 'side';
}
// NPC görev işareti (harita simgesi ve NPC başı): 'ready' (teslim) | 'avail' (yeni) | null
export function npcQuestMark(char, npcId) {
  const list = questsForNpc(char, npcId);
  if (list.some((x) => x.status === 'active' && x.ready && x.q.turnIn === npcId)) return 'ready';
  if (list.some((x) => x.status === 'available')) return 'avail';
  return null;
}
// Hedef türü açıklamaları (günlükte kısa ipucu)
export const OBJECTIVE_HELP = {
  escort: 'Refakat: eşlik edilen yalnız sen yakınındayken ilerler; pusuda durur. Canı biterse yeniden deneyebilirsin.',
  defend: 'Savunma: korunan nesnenin can çubuğu üstünde görünür. Dalgalar EXP/ganimet vermez; başarısız olursan yeniden deneyebilirsin.',
  ordered: 'İz sürme: nesneler belirli bir sırayla incelenir; yanlış sırada ipucu verilir, ilerleme sayılmaz.',
  craft: 'Üretim: yalnız gerçek üretim sayılır (satın alınan ya da önceden üretilmiş eşya sayılmaz).',
  consume: 'Onarım / arındırma: gereken materyal nesneye dokununca tüketilir; işlem süresince hasar almamaya çalış.',
  spawn: 'Özel av: hedef haritada tek başına belirir; ekipman düşürmez.',
};

export function stackName(id) {
  return STACKABLES[id]?.name || id;
}
