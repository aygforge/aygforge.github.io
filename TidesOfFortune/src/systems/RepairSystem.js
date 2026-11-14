// Tamir: tersane seçenekleri, rota sonu (Groot → sızıntı) ve varış (Doc Vargas → Esperanza) sırası.
import { BALANCE } from '../config/balance.js';
import { HARBOR_BY_ID, HARBOR_TYPES } from '../data/harbors.js';
import { hullCategory, maxHull, categoryFloorHp, changeHull } from './ShipSystem.js';
import { hasCrew, crewSkillMult } from './CrewSystem.js';

const NEXT_CAT = { sinking: 'critical', critical: 'damaged', damaged: 'healthy' };

export function shipyardOf(G) {
  const harbor = HARBOR_BY_ID[G.run.visit.harborId];
  const t = HARBOR_TYPES[harbor.type];
  return { full: !!t.fullShipyard, patch: !!t.patch, upgrade: !!t.fullShipyard };
}

function statusMult(G) {
  const st = G.run.visit?.statuses || [];
  let m = 1;
  if (st.includes('contraband')) m *= BALANCE.trade.contrabandStatusMult;
  if (st.includes('hero')) m *= BALANCE.trade.heroBuyMult;
  return m;
}

export function repairOptions(G) {
  const yard = shipyardOf(G);
  const cat = hullCategory(G);
  const missing = maxHull(G) - G.run.ship.hull;
  const sm = statusMult(G);
  const opts = [];
  if (yard.full) {
    const next = NEXT_CAT[cat];
    if (next) {
      const target = categoryFloorHp(G, next);
      opts.push({ id: 'partial', name: 'Kısmi tamir', cost: Math.round(BALANCE.repair.partialCost[cat] * sm), heal: Math.max(0, target - G.run.ship.hull), desc: `Hull'u "${next === 'healthy' ? 'Sağlam' : next === 'damaged' ? 'Hasarlı' : 'Kritik'}" kategorisinin alt sınırına (${target}) çıkarır.` });
    } else opts.push({ id: 'partial', name: 'Kısmi tamir', cost: 0, heal: 0, disabled: 'Gemi zaten Sağlam kategorisinde.' });
    opts.push({ id: 'full', name: 'Tam tamir', cost: Math.round(missing * BALANCE.repair.fullCostPerHp * sm), heal: missing, desc: `Eksik HP × ${BALANCE.repair.fullCostPerHp} altın.`, disabled: missing <= 0 ? 'Gemi zaten tam sağlam.' : null });
  }
  if (yard.patch) {
    opts.push({ id: 'patch', name: 'Acil yama', cost: Math.round(BALANCE.repair.patchCost * sm), heal: Math.min(BALANCE.repair.patchHp, missing), desc: `+${BALANCE.repair.patchHp} HP.${yard.full ? '' : ' Bu limandaki tek seçenek.'}`, disabled: missing <= 0 ? 'Gemi zaten tam sağlam.' : null });
  }
  return opts;
}

export function doRepair(G, id) {
  const o = repairOptions(G).find((x) => x.id === id);
  if (!o) return { ok: false, reason: 'Bu limanda bu tamir yapılamaz.' };
  if (o.disabled) return { ok: false, reason: o.disabled };
  if (o.heal <= 0) return { ok: false, reason: 'Onarılacak hasar yok.' };
  if (G.run.gold < o.cost) return { ok: false, reason: `Yetersiz altın (${o.cost} gerekli).` };
  G.run.gold -= o.cost;
  const r = changeHull(G, o.heal);
  return { ok: true, healed: r.delta, cost: o.cost };
}

/** Rota sonu: önce Groot onarımı, sonra sızıntı. */
export function routeEndRepairs(G) {
  const lines = [];
  if (hasCrew(G, 'CREW_GROOT')) {
    const r = changeHull(G, Math.round(BALANCE.repair.grootRouteHp * crewSkillMult(G)));
    if (r.delta > 0) lines.push({ kind: 'heal', text: `Groot rota boyunca gövdeyi onardı: +${r.delta} HP` });
  }
  if (hullCategory(G) === 'sinking') {
    const r = changeHull(G, -BALANCE.hull.leakDamage);
    lines.push({ kind: 'damage', text: `Batmak üzere olan gemi su aldı (sızıntı): ${r.delta} HP` });
  }
  return lines;
}

/** Limana varış: Doc Vargas, ardından Esperanza (Doc Vargas ile birlikteyse). */
export function arrivalRepairs(G) {
  const lines = [];
  const m = crewSkillMult(G);
  if (hasCrew(G, 'CREW_VARGAS')) {
    const r = changeHull(G, Math.round(BALANCE.repair.docArrivalHp * m));
    if (r.delta > 0) lines.push({ kind: 'heal', text: `Doc Vargas yaraları sardı: +${r.delta} HP` });
    if (hasCrew(G, 'CREW_ESPERANZA')) {
      const r2 = changeHull(G, Math.round(BALANCE.repair.esperanzaBonusHp * m));
      if (r2.delta > 0) lines.push({ kind: 'heal', text: `Esperanza'nın duası Doc Vargas'ın elini güçlendirdi: +${r2.delta} HP` });
    }
  }
  return lines;
}
