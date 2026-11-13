// Kaynak toplama (ağaç/kaya/mantar/meyve), tarım yatakları ve küçük olta etkinliği.
import { RESOURCE_NODES, ACTION_MIN } from '../data/supplement.js';
import * as Inv from './inventory.js';

export const nodeDef = (kind) => RESOURCE_NODES[kind];
export function nodeState(sim, n) { return sim.s.nodes[n.id] || { hp: nodeDef(n.kind).hits, alive: true }; }
export function nodeById(sim, id) { return sim.map('railway_outdoors').nodes.find((n) => n.id === id); }
export function hitNode(sim, id) {
  const s = sim.s, n = nodeById(sim, id); if (!n) return sim.fail('Kaynak yok');
  const d = nodeDef(n.kind), st = nodeState(sim, n);
  if (!st.alive) return sim.fail('Bu kaynak henüz yenilenmedi');
  if (s.closing.active) return sim.fail('23:00\'ten sonra kaynak toplanamaz');
  if (d.tool && Inv.count(sim, d.tool) < 1) return sim.fail(`${sim.C.items[d.tool].name} gerekli (tozlu sandıkta)`);
  if (st.hp <= 1 && !Inv.canFitInv(sim, d.item, d.qty[1])) return sim.fail('Çantan dolu');
  sim.setBusy('node', d.tool === 'axe' ? ACTION_MIN.chop : d.tool === 'pickaxe' ? ACTION_MIN.mine : ACTION_MIN.gather, { target: id, tool: d.tool, nodeKind: n.kind });
  return { ok: true };
}
export function finishHit(sim, b) {
  const s = sim.s, n = nodeById(sim, b.target), d = nodeDef(n.kind); const st = (s.nodes[n.id] ||= { hp: d.hits, alive: true });
  st.hp -= 1; sim.emit('node_hit', { id: n.id, kind: n.kind, x: n.x, y: n.y, left: st.hp });
  if (st.hp > 0) return;
  const qty = sim.ri(d.qty[0], d.qty[1]); Inv.give(sim, d.item, qty);
  st.alive = false; st.respawn = s.day + sim.ri(d.respawn[0], d.respawn[1]); sim.invalidate('railway_outdoors');
  sim.emit('gathered', { item: d.item, qty, kind: n.kind, x: n.x, y: n.y });
}
export function respawnNodes(sim) { let ch = false; for (const [id, st] of Object.entries(sim.s.nodes)) if (!st.alive && sim.s.day >= st.respawn) { delete sim.s.nodes[id]; ch = true; } if (ch) sim.invalidate('railway_outdoors'); }

// ---- Tarım: çapa → tohum → sulama → sulanmış gün sayısı → hasat. Susuz ürün ölmez, bekler.
export function growNeed(sim, seedId) { return sim.C.seeds[seedId].days + (sim.season() === 'winter' ? 1 : 0); }
export function plotInfo(sim, f) {
  if (!f.crop) return { stage: f.tilled ? 'tilled' : 'empty' };
  const need = growNeed(sim, f.crop.seed); return { stage: f.crop.grown >= need ? 'ripe' : 'growing', pct: Math.min(1, f.crop.grown / need), need, seed: f.crop.seed };
}
export function nextFarmAction(sim, f) {
  const p = sim.s.player, info = plotInfo(sim, f);
  if (info.stage === 'ripe') return { act: 'harvest', label: 'Hasat et' };
  if (info.stage === 'empty') return Inv.count(sim, 'hoe') ? { act: 'till', label: 'Çapala' } : { err: 'Çapa gerekli' };
  if (info.stage === 'tilled') {
    const sel = p.inv[p.sel]; const seed = sel && sim.C.seeds[sel.id] ? sel.id : p.inv.find((x) => x && sim.C.seeds[x.id])?.id;
    return seed ? { act: 'plant', seed, label: `${sim.C.items[seed].name} ek` } : { err: 'Çantanda tohum yok (posta kataloğu ya da Şirin\'in serası)' };
  }
  if (!f.watered) return Inv.count(sim, 'watering_can') ? { act: 'water', label: 'Sula' } : { err: 'Sulama kabı gerekli' };
  return { err: 'Bugün sulandı; büyümesi için uyu' };
}
export function farmAction(sim, id) {
  const f = sim.furn(id); if (!f || !sim.def(f).plot) return sim.fail('Tarım yatağı değil');
  const a = nextFarmAction(sim, f); if (a.err) return sim.fail(a.err);
  if (a.act === 'harvest' && !Inv.canFitInv(sim, sim.C.seeds[f.crop.seed].crop, sim.C.seeds[f.crop.seed].qty)) return sim.fail('Çantan dolu');
  sim.setBusy('farm', a.act === 'till' ? ACTION_MIN.hoe : a.act === 'water' ? ACTION_MIN.water : a.act === 'plant' ? ACTION_MIN.plant : ACTION_MIN.harvest, { target: id, act: a.act, seed: a.seed, tool: a.act === 'till' ? 'hoe' : a.act === 'water' ? 'watering_can' : null });
  return { ok: true };
}
export function finishFarm(sim, b) {
  const f = sim.furn(b.target); if (!f) return;
  if (b.act === 'till') { f.tilled = true; sim.emit('tilled', { inst: f.id }); }
  else if (b.act === 'plant') { if (Inv.removeFrom(sim.s.player.inv, b.seed, 1) === 0) { f.crop = { seed: b.seed, grown: 0 }; sim.emit('planted', { seed: b.seed }); } }
  else if (b.act === 'water') { f.watered = true; sim.emit('watered', { inst: f.id }); }
  else if (b.act === 'harvest' && f.crop) { const sd = sim.C.seeds[f.crop.seed]; Inv.give(sim, sd.crop, sd.qty); f.crop = null; f.tilled = false; f.watered = false; sim.emit('harvested', { item: sd.crop, qty: sd.qty }); }
}
// Gün sonu: yalnız sulanan (ya da yağmurlu) günde büyür
export function growDay(sim) {
  const rain = ['rain', 'storm'].includes(sim.s.weather);
  for (const f of sim.s.furniture) { if (!sim.def(f).plot) continue; if (f.crop && (f.watered || rain)) f.crop.grown += 1; f.watered = false; }
}
// ---- Dere: günde 4 atış, %80 temel başarı, olta kaybolmaz
export function canFish(sim) {
  const s = sim.s; if (s.stage < sim.C.river.stage) return 'Dere kenarı 2. aşamada açılır';
  if (Inv.count(sim, 'fishing_rod') < 1) return 'Olta gerekli (iskele yanındaki tezgâhtan 75 G)';
  if (s.fishing.casts >= sim.C.river.casts) return 'Bugünkü 4 atış hakkın bitti';
  if (s.closing.active) return 'Bu saatte balık tutulmaz';
  return null;
}
export function fishCast(sim) { const why = canFish(sim); if (why) return sim.fail(why); sim.s.fishing.casts += 1; sim.emit('fish_cast'); return { ok: true, wait: 2 + sim.rand() * 2, window: 1 }; }
export function fishResolve(sim, reacted) {
  if (reacted && sim.rand() < sim.C.river.success) { Inv.give(sim, 'fish', 1); sim.emit('fish_caught'); return sim.msg('Bir balık tuttun!', 'good'); }
  sim.emit('fish_missed'); return sim.msg(reacted ? 'Balık kaçtı…' : 'Geç kaldın, balık kaçtı.');
}
export function buyRod(sim) {
  const s = sim.s; if (Inv.count(sim, 'fishing_rod')) return sim.msg('Zaten bir oltan var');
  if (s.gold < sim.C.river.rod) return sim.fail(`Olta ${sim.C.river.rod} G`);
  if (!Inv.canFitInv(sim, 'fishing_rod', 1)) return sim.fail('Çantan dolu');
  s.gold -= sim.C.river.rod; s.today.purchases += sim.C.river.rod; Inv.give(sim, 'fishing_rod', 1); return sim.msg('Olta satın alındı (75 G)', 'good');
}
