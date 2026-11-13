import fs from 'node:fs';
import { buildCatalog } from '../../src/data/catalog.js';
import { Sim, newState } from '../../src/systems/sim.js';
import { Bot } from '../../src/dev/bot.js';

export const raw = JSON.parse(fs.readFileSync(new URL('../../Son_Peron_v1_0_Birlesik_Oyun_Verileri.json', import.meta.url), 'utf8'));
export const C = buildCatalog(raw);
export function fresh(opts = {}) { const sim = new Sim(C, newState(C, opts)); return { sim, s: sim.s, bot: new Bot(sim) }; }
// Tutorial sonrası (3. gün sabahı) hazır oyun
export function afterTutorial(opts = {}) {
  const g = fresh(opts); g.bot.day1(); g.bot.day2Prep();
  let n = 0; while (!g.s.flags.tutorialDone && n++ < 3000) { if (!g.bot.serviceStep()) g.bot.tick(1); }
  return g;
}
export function give(sim, items) { for (const [id, q] of Object.entries(items)) sim.inv.addTo(sim, sim.s.depot, id, q); }
// Belirli aşamaya hızlı geçiş (test kurulumu): projeleri gerçek API ile başlatır ve sabah uygular
export function toStage(g, stage) {
  const { sim, s } = g;
  for (const x of C.expansions) { if (x.stageAfter > stage || s.stage >= x.stageAfter) continue; s.gold += x.gold; s.paidCustomers = Math.max(s.paidCustomers, x.paid); sim.inv.syncDepot(sim); give(sim, x.materials); const r = sim.build.startProject(sim, x.id); if (!r.ok) throw new Error(r.msg); sim.build.applyPendingProjects(sim); }
}
export const toasts = (sim) => sim.fx.filter((e) => e.type === 'toast').map((e) => e.text);
// Bir grubu kapı kuyruğuna getirir (fiziksel yürüyüşle); isteğe bağlı olarak oturtur
export function arrive(g, size = 1, profile = 'regular') {
  const { sim, s } = g; if (!s.open) { s.flags.canOpen = true; s.open = true; }
  const grp = sim.service.spawnGroup(sim, { profile, size, train: 540, delay: 0 });
  let n = 0; while (grp.state !== 'ENTRY_QUEUE' && s.groups.includes(grp) && n++ < 400) sim.tick(0.5);
  return grp;
}
export function seat(g, grp) {
  const { sim } = g; const opt = sim.service.freeTablesFor(sim, grp.members.length)[0]; if (!opt) return false;
  if (!sim.service.greet(sim, grp.id, opt.table.id).ok) return false;
  let n = 0; while (grp.state !== 'ORDER_READY' && n++ < 400) sim.tick(0.25); return grp.state === 'ORDER_READY';
}
export function stockSoup(g, portions = 4) {
  const { sim, s } = g; const bar = s.furniture.find((f) => f.type === 'bar_counter');
  const b = { id: sim.nid('b'), item: 'vegetable_soup', qty: portions, reserved: 0, loc: 'bar', inst: bar.id, slot: 0, createdAt: sim.absMin(), perish: true, unitCost: 3.25 };
  s.batches.push(b); bar.slots[0].item = 'vegetable_soup'; return b;
}
export function clearBar(g) { const { s } = g; s.batches = []; for (const f of s.furniture) if (f.slots) f.slots.forEach((sl) => (sl.item = null)); }
