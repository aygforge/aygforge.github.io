// İçerik kaydı: 100 bağımsız olay + 20 zincir (74 aşama) + Başkent finali.
import danger from './events/danger.js';
import npc from './events/npc.js';
import explore from './events/explore.js';
import treasure from './events/treasure.js';
import royal from './events/royal.js';
import nature from './events/nature.js';
import mystic from './events/mystic.js';
import absurd from './events/absurd.js';
import { CHAINS_A } from './chains_a.js';
import { CHAINS_B } from './chains_b.js';
import { FINAL } from './final.js';

export const STANDALONE = [...danger, ...npc, ...explore, ...treasure, ...royal, ...nature, ...mystic, ...absurd];
export const CHAINS = {};
export const EVENTS = {};
export const CHAIN_STAGES = [];
export const CATEGORY_NAMES = { danger: 'Tehlike', npc: 'Gezginler', explore: 'Keşif', treasure: 'Hazine', royal: 'Kraliyet', nature: 'Doğa', mystic: 'Gizem', absurd: 'Tuhaf', chain: 'Hikâye', special: 'Final' };

for (const e of STANDALONE) {
  if (EVENTS[e.id]) throw new Error('Yinelenen olay kimliği: ' + e.id);
  EVENTS[e.id] = e;
}
for (const c of [...CHAINS_A, ...CHAINS_B]) {
  CHAINS[c.id] = { id: c.id, name: c.name, reg: c.reg, stages: [] };
  c.stages.forEach((s, i) => {
    const id = `${c.id}_${i + 1}`;
    const ev = { ...s, id, cat: 'chain', chain: c.id, stage: i + 1, last: i === c.stages.length - 1, tags: [...(s.tags || []), 'chain'], reg: c.reg, chainName: c.name };
    if (EVENTS[id]) throw new Error('Yinelenen zincir kimliği: ' + id);
    EVENTS[id] = ev;
    CHAINS[c.id].stages.push(id);
    CHAIN_STAGES.push(ev);
  });
}
EVENTS[FINAL.id] = FINAL;
export const POOL_IDS = STANDALONE.map((e) => e.id);
