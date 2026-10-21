// Görev yön rehberi: takip edilen görevin bir sonraki hedefini (harita + tile) bulur ve
// başka haritadaysa oraya götüren geçidi seçer. Saf mantık — çizim WorldScene'de.
import { MAPS } from '../data/maps/index.js';
import { QUEST_MAP } from '../data/quests.js';
import { trackedQuestList, objectiveDone, canInteractQuestObject, currentHint } from '../systems/quests.js';

function npcSpot(npcId) {
  for (const def of Object.values(MAPS)) {
    const o = def.objects.find((x) => x.type === 'npc' && x.npc === npcId);
    if (o) return { map: def.id, x: o.x, y: o.y, r: 1.5 };
  }
  return null;
}

// Görev rehberinin hedefi: { map, x, y, r, label } (tile koordinatı) ya da null
export function guideTarget(ch) {
  const list = trackedQuestList(ch);
  const t = list.find((x) => x.q.id === ch.tracked) || list.find((x) => x.q.main) || list[0];
  if (!t) {
    // aktif görev yok: seviyesi uygun ilk ana görev için Köy Muhtarı'na
    const next = Object.values(QUEST_MAP).filter((q) => q.main && !ch.quests[q.id] && ch.level >= q.minLevel).sort((a, b) => a.order - b.order)[0];
    const spot = next && npcSpot(next.giver);
    return spot && { ...spot, label: `Yeni görev: ${next.name}` };
  }
  const q = t.q;
  if (t.ready) { const spot = npcSpot(q.turnIn); return spot && { ...spot, label: `Teslim: ${q.name}` }; }
  const i = q.objectives.findIndex((o, k) => o.type !== 'talk' && !objectiveDone(ch, q, k));
  const o = q.objectives[i];
  if (o?.type === 'interact') {
    // henüz kullanılmamış en yakın görev nesnesi (ipucu haritasında öncelikli)
    const hint = currentHint(ch, q);
    for (const def of [MAPS[hint?.map], ...Object.values(MAPS)].filter(Boolean)) {
      const ob = def.objects.find((x) => x.group === o.group && canInteractQuestObject(ch, o.group, x.id));
      if (ob) return { map: def.id, x: ob.x, y: ob.y, r: 1.2, label: o.label };
    }
  }
  if (o?.type === 'reach') {
    for (const def of Object.values(MAPS)) {
      const l = (def.locations || []).find((x) => x.id === o.loc);
      if (l) return { map: def.id, x: l.x, y: l.y, r: Math.max(1.5, l.r * 0.8), label: o.label };
    }
  }
  const h = currentHint(ch, q);
  return h ? { map: h.map, x: h.x, y: h.y, r: Math.max(2, (h.r || 4) * 0.6), label: o?.label || q.name } : null;
}

// Haritalar arası bağlantılar: portal ve dungeon kapısı
function links(mapId) {
  return MAPS[mapId].objects.filter((o) => (o.type === 'portal' || o.type === 'dungeon_gate') && o.to && MAPS[o.to]);
}

// from → to yolundaki ilk geçit nesnesi (BFS); aynı haritaysa null
export function nextGateway(from, to) {
  if (from === to) return null;
  const prev = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const m = queue.shift();
    if (m === to) break;
    for (const l of links(m)) if (!(l.to in prev)) { prev[l.to] = { map: m, obj: l }; queue.push(l.to); }
  }
  if (!(to in prev)) return null;
  let step = prev[to];
  while (step && step.map !== from) step = prev[step.map];
  return step?.obj || null;
}
