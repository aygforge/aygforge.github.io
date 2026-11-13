// Serbest mobilya yerleştirme, onarım, crafting ve restorasyon projeleri.
import { T, OUTDOOR_PROPERTY, INTERIOR_DOORS } from '../world/maps.js';
import { flood, neighborsOfRect } from '../world/grid.js';
import { mkSlots, DIRV, ROT_DIR } from './sim.js';
import * as Inv from './inventory.js';
import { RENOVATION_EFFECTS } from '../data/supplement.js';

const GRASS = new Set([T.GRASS, T.GRASS2, T.FLOWERS]);
const layerOf = (d) => d.plot ? 'solid' : (d.place === 'tile' || d.tile) ? 'tile' : d.place === 'wall' ? 'wall' : d.place === 'ceiling' ? 'ceiling' : 'solid';
const fpOf = (d, rot) => (rot % 2 ? [d.h, d.w] : [d.w, d.h]);

function overlaps(sim, scene, x, y, w, h, layer, ignoreId) {
  for (const f of sim.s.furniture) {
    if (f.scene !== scene || f.id === ignoreId) continue;
    const d = sim.def(f); const l = layerOf(d);
    if (l !== layer) continue;
    const [fw, fh] = sim.fp(f);
    if (x < f.x + fw && x + w > f.x && y < f.y + fh && y + h > f.y) return f;
  }
  return null;
}

// Erişim gerektiren mobilyalar: yatak, depo, ocak/istasyon, bar, masa, koltuk, tezgâh
const needsAccess = (d) => d.kind === 'table' || d.kind === 'seat' || d.kind === 'bed' || d.kind === 'equipment' || d.depotAccess || d.starterChest || d.letter;

export function canPlace(sim, type, scene, x, y, rot = 0, ignoreId = null) {
  const C = sim.C, d = C.placeables[type]; if (!d) return { ok: false, msg: 'Bilinmeyen eşya' };
  const m = sim.map(scene); const [w, h] = fpOf(d, rot); const layer = layerOf(d);
  if (x < 0 || y < 0 || x + w > m.w || y + h > m.h) return { ok: false, msg: 'Harita dışı' };
  const outdoorItem = d.place === 'outdoor';
  if (outdoorItem && scene !== 'railway_outdoors') return { ok: false, msg: 'Bu eşya dış mekâna yerleştirilir' };
  if (!outdoorItem && scene !== 'restaurant_interior') return { ok: false, msg: 'Bu eşya lokantanın içine yerleştirilir' };
  for (let cy = y; cy < y + h; cy++) for (let cx = x; cx < x + w; cx++) {
    const i = cy * m.w + cx, g = m.ground[i];
    if (scene === 'restaurant_interior') {
      if (layer === 'wall') { if (g !== T.WALL_FACE) return { ok: false, msg: 'Duvar dekoru bir duvar yüzüne asılır' }; continue; }
      if (m.zone[i] < 0 || g === T.DOOR) return { ok: false, msg: 'Burası açılmış bir zemin değil' };
      if (m.noPlace[i] && layer === 'solid') return { ok: false, msg: 'Kapı eşiği ve giriş yolu boş kalmalı' };
    } else {
      const [l, t, r, b] = OUTDOOR_PROPERTY;
      if (cx < l || cx > r || cy < t || cy > b) return { ok: false, msg: 'Lokanta arazisinin dışında' };
      if (!(GRASS.has(g) || (d.tile && g === T.PATH)) || m.solid[i]) return { ok: false, msg: 'Zemin uygun değil' };
      if (d.plot) { const gr = m.garden; if (cx <= gr[0] || cx >= gr[2] || cy <= gr[1] || cy >= gr[3]) return { ok: false, msg: 'Tarım yatağı bahçenin içine kurulur' }; }
      if (m.nodes.some((n) => n.x === cx && n.y === cy)) return { ok: false, msg: 'Burada bir kaynak var' };
    }
  }
  if (overlaps(sim, scene, x, y, w, h, layer, ignoreId)) return { ok: false, msg: 'Burada başka bir eşya var' };
  if (d.plot && !ignoreId && sim.s.furniture.filter((f) => f.type === 'garden_bed').length >= 20) return { ok: false, msg: 'En fazla 20 tarım yatağı kurulabilir' };
  if (d.solid) {
    const ents = [sim.s.player, ...sim.s.customers, ...Object.values(sim.s.staff.agents), ...Object.values(sim.s.npcs)];
    for (const e of ents) if (e.scene === scene && !e.seat && e.x >= x && e.x < x + w && e.y >= y && e.y < y + h) return { ok: false, msg: 'Burada biri duruyor' };
    const acc = accessCheck(sim, scene, { x, y, w, h }, ignoreId, d);
    if (!acc.ok) return acc;
  }
  return { ok: true };
}

// Topolojik bağlantı kontrolü: kapılar, yatak, depo, ocak, bar ve masalar erişilebilir kalmalı
export function accessCheck(sim, scene, extra, ignoreId, newDef) {
  const m = sim.map(scene);
  let g = sim.grid(scene, extra || { x: 0, y: 0, w: 0, h: 0 });
  if (ignoreId) { const f = sim.furn(ignoreId); if (f && sim.def(f).solid && f.scene === scene) { const [w, h] = sim.fp(f); g = Uint8Array.from(g); for (let y = f.y; y < f.y + h; y++) for (let x = f.x; x < f.x + w; x++) if (!m.solid[y * m.w + x]) g[y * m.w + x] = 0; if (extra) for (let y = extra.y; y < extra.y + extra.h; y++) for (let x = extra.x; x < extra.x + extra.w; x++) g[y * m.w + x] = 1; } }
  if (scene === 'restaurant_interior') {
    const seen = flood(g, m.w, m.h, 16, 34);
    for (const d of m.doors) if (!seen[d.y * m.w + d.x]) return { ok: false, msg: 'Kapı yolu kapanıyor' };
    const reach = (x, y, w, h) => neighborsOfRect(x, y, w, h).some(([nx, ny]) => nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && seen[ny * m.w + nx]);
    for (const f of sim.s.furniture) {
      if (f.scene !== scene || f.id === ignoreId) continue; const d = sim.def(f); if (!needsAccess(d)) continue;
      const [w, h] = sim.fp(f); if (!reach(f.x, f.y, w, h)) return { ok: false, msg: `${d.name} erişilemez kalıyor` };
    }
    if (extra && extra.w && newDef && needsAccess(newDef) && !reach(extra.x, extra.y, extra.w, extra.h)) return { ok: false, msg: 'Bu konuma ulaşılamıyor' };
    for (const z of sim.s.zones) { const dz = INTERIOR_DOORS[z]; if (dz && !seen[dz[1] * m.w + dz[0]]) return { ok: false, msg: 'Kanat girişi kapanıyor' }; }
  } else if (scene === 'railway_outdoors') {
    const seen = flood(g, m.w, m.h, 54, 45);
    for (const [x, y] of [[25, 53], [54, 23], [70, 38], [68, 47], [70, 47], [1, 37], [114, 47]]) if (!seen[y * m.w + x]) return { ok: false, msg: 'Ana yürüyüş yolu kapanıyor' };
  }
  return { ok: true };
}

export function place(sim, invIdx, x, y, rot = 0) {
  const s = sim.s, slot = s.player.inv[invIdx]; if (!slot) return sim.fail('Yerleştirilecek eşya seçili değil');
  const d = sim.C.placeables[slot.id]; if (!d) return sim.fail('Bu eşya yerleştirilemez');
  const scene = s.player.scene; const chk = canPlace(sim, slot.id, scene, x, y, rot); if (!chk.ok) return sim.fail(chk.msg);
  const needInstall = d.origin === 'equipment' && Object.keys(d.install || {}).length > 0;
  // Kurulum malzemesi yalnız ilk kurulumda, bir kez tüketilir (altın siparişte ödendi)
  if (needInstall && !slot.installed) { if (!Inv.has(sim, d.install)) return sim.fail(`Kurulum için eksik: ${Inv.missingText(sim, d.install)}`); Inv.take(sim, d.install); }
  const inst = { id: sim.nid('f'), type: slot.id, scene, x, y, rot, installed: true, slots: mkSlots(sim.C, slot.id) };
  if (d.plot) Object.assign(inst, { crop: null, tilled: false, watered: false });
  s.furniture.push(inst);
  slot.qty -= 1; if (!slot.qty) s.player.inv[invIdx] = null;
  Inv.syncDepot(sim); sim.invalidate(scene);
  sim.emit('placed', { item: inst.type, inst: inst.id });
  return { ok: true, inst };
}

export function inUse(sim, f) {
  const s = sim.s, d = sim.def(f);
  if (d.kind === 'table') { if (s.groups.some((g) => g.table === f.id)) return 'Masa kullanımda'; if (s.dirty[f.id]) return 'Önce masayı temizle'; }
  if (d.kind === 'seat' && s.customers.some((c) => c.seat && c.seat.inst === f.id)) return 'Koltuk kullanımda';
  if (f.cook) return 'İstasyon çalışıyor';
  if (d.barModule && s.batches.some((b) => b.inst === f.id)) return 'Bar modülünde stok var';
  if (d.readyShelf && s.batches.some((b) => b.inst === f.id)) return 'Tezgâhta bekleyen yemek var';
  if (d.plot && f.crop) return 'Yatakta ekili ürün var';
  if (d.fireplace && s.fire > 0) return 'Şömine yanıyor';
  if (d.storage && Inv.usedSlots(s.depot) > Inv.depotCapacity(sim) - d.storage) return 'Önce depoda yer aç';
  return null;
}
// Boş mobilyayı sökmek ücretsizdir; eşya envantere döner (kurulu ekipman tekrar malzeme istemez)
export function pickUp(sim, id) {
  const s = sim.s, f = sim.furn(id); if (!f) return sim.fail('Eşya yok');
  const why = inUse(sim, f); if (why) return sim.fail(why);
  const i = s.player.inv.findIndex((x) => !x); if (i < 0) return sim.fail('Çantan dolu');
  if (sim.def(f).solid) { const acc = accessCheck(sim, f.scene, null, f.id); if (!acc.ok) return sim.fail(acc.msg); }
  s.furniture.splice(s.furniture.indexOf(f), 1);
  s.player.inv[i] = { id: f.type, qty: 1, installed: true };
  Inv.syncDepot(sim); sim.invalidate(f.scene);
  sim.emit('picked_up', { item: f.type });
  return { ok: true, slot: i };
}

// ---- Masa / koltuk bağları: koltuk masaya komşu ve masaya dönük olmalı
export function seatCells(sim, f) {
  const d = sim.def(f); const [w, h] = sim.fp(f); const out = []; let n = 0;
  for (let y = f.y; y < f.y + h; y++) for (let x = f.x; x < f.x + w; x++) if (n < (d.seats || 0)) out.push({ inst: f.id, idx: n++, x, y });
  return out;
}
export function seatsOfTable(sim, table) {
  const [tw, th] = sim.fp(table); const inT = (x, y) => x >= table.x && x < table.x + tw && y >= table.y && y < table.y + th; const out = [];
  for (const f of sim.s.furniture) {
    if (f.scene !== table.scene) continue; const d = sim.def(f); if (d.kind !== 'seat') continue;
    for (const c of seatCells(sim, f)) {
      let dir = null;
      if (d.anyFacing) { for (const k of ROT_DIR) { const v = DIRV[k]; if (inT(c.x + v[0], c.y + v[1])) dir = k; } }
      else { const k = ROT_DIR[f.rot % 4], v = DIRV[k]; if (inT(c.x + v[0], c.y + v[1])) dir = k; }
      if (dir) out.push({ ...c, dir });
    }
  }
  return out;
}
export function tables(sim) { return sim.s.furniture.filter((f) => sim.def(f).kind === 'table' && f.scene === 'restaurant_interior'); }
export function totalSeats(sim) { let n = 0; for (const t of tables(sim)) n += seatsOfTable(sim, t).length; return n; }
export function ambiance(sim) {
  let c = 0; for (const f of sim.s.furniture) if (f.scene === 'restaurant_interior') c += sim.def(f).comfort || 0;
  for (const r of sim.s.renovations) c += RENOVATION_EFFECTS[r]?.ambiance || 0;
  return c;
}

// ---- Onarım (tutorial): malzeme bir kez düşer
const REPAIR_NAMES = { repair_entrance: 'Giriş kapısı', repair_workbench: 'Marangoz tezgâhı', repair_stove: 'Ocak' };
export function repair(sim, id) {
  const mats = sim.C.tutorial.repairs[id]; if (!mats) return sim.fail('Bilinmeyen onarım');
  if (sim.s.flags[id]) return sim.msg('Zaten onarıldı');
  if (!Inv.has(sim, mats)) return sim.fail(`${REPAIR_NAMES[id]} onarımı için eksik: ${Inv.missingText(sim, mats)}`);
  sim.once('repair:' + id, () => { Inv.take(sim, mats); sim.s.flags[id] = true; });
  sim.setBusy('repair', 1.6); sim.emit('repaired', { id });
  return sim.msg(`${REPAIR_NAMES[id]} onarıldı!`, 'good');
}

// ---- Crafting: malzemeyi bir kez tüketir, tam bir adet ürün verir
export function craftables(sim) {
  const C = sim.C; return [...Object.values(C.furniture), ...Object.values(C.tools)].map((d) => ({ def: d, locked: d.stage > sim.s.stage, can: Inv.has(sim, d.materials) }));
}
export function craft(sim, id) {
  const s = sim.s, d = sim.C.furniture[id] || sim.C.tools[id]; if (!d) return sim.fail('Bilinmeyen tarif');
  if (s.closing.active) return sim.fail('Kapanıştan sonra üretim yapılamaz');
  if (!s.flags.repair_workbench) return sim.fail('Önce marangoz tezgâhını onar');
  if (d.stage > s.stage) return sim.fail(`${d.stage}. restoran aşamasında açılır`);
  if (!Inv.has(sim, d.materials)) return sim.fail(`Eksik: ${Inv.missingText(sim, d.materials)}`);
  if (!Inv.canFitInv(sim, id, 1)) return sim.fail('Çantanda boş yer yok');
  Inv.take(sim, d.materials); Inv.give(sim, id, 1, { invOnly: true });
  sim.emit('crafted', { item: id });
  return sim.msg(`${d.name} üretildi`, 'good');
}
export function trayCapacity(sim) { let c = 1; for (const t of Object.values(sim.C.tools)) if (Inv.count(sim, t.id) > 0) c = Math.max(c, t.capacity); return c; }

// ---- Restorasyon: altın + malzeme bir kez ödenir, etki ertesi sabah uygulanır
export function projects(sim) {
  const s = sim.s, C = sim.C; const out = [];
  for (const x of C.expansions) {
    const done = s.stage >= x.stageAfter, pending = s.pendingProjects.includes(x.id);
    const reasons = [];
    if (s.stage < x.stageAfter - 1) reasons.push('Önceki genişleme gerekli');
    if (s.paidCustomers < x.paid) reasons.push(`${x.paid} ödemeli müşteri (şu an ${s.paidCustomers})`);
    if (s.gold < x.gold) reasons.push(`${x.gold} G`);
    if (!Inv.has(sim, x.materials)) reasons.push(Inv.missingText(sim, x.materials));
    out.push({ ...x, main: true, done, pending, reasons, label: WING_NAMES[x.wing] });
  }
  for (const x of C.renovations) {
    const done = s.renovations.includes(x.id), pending = s.pendingProjects.includes(x.id); const reasons = [];
    if (s.stage < x.stage) reasons.push(`${x.stage}. aşama gerekli`);
    if (s.gold < x.gold) reasons.push(`${x.gold} G`);
    if (!Inv.has(sim, x.materials)) reasons.push(Inv.missingText(sim, x.materials));
    out.push({ ...x, main: false, done, pending, reasons, label: RENOVATION_EFFECTS[x.id].desc });
  }
  return out;
}
export const WING_NAMES = { north_lounge: 'Kuzey salonu', west_dining: 'Batı yemek salonu', east_kitchen: 'Doğu mutfak kanadı', southeast_hall: 'Güneydoğu büyük salonu' };
export function startProject(sim, id) {
  const p = projects(sim).find((x) => x.id === id); if (!p) return sim.fail('Proje yok');
  if (p.done || p.pending) return sim.fail('Bu proje zaten ' + (p.done ? 'tamamlandı' : 'başlatıldı'));
  if (p.reasons.length) return sim.fail('Eksik: ' + p.reasons.join(', '));
  const ok = sim.once('project:' + id, () => { sim.s.gold -= p.gold; sim.s.today.purchases += p.gold; Inv.take(sim, p.materials); sim.s.pendingProjects.push(id); });
  if (!ok) return sim.fail('Bu proje zaten işlendi');
  sim.emit('project_started', { id });
  return sim.msg(`${p.main ? p.label : p.name}: ustalar yarın sabaha bitirecek.`, 'good');
}
// Sabah işleme: idempotent; mobilya asla silinmez, çakışan eşya güvenli depoya alınır
export function applyPendingProjects(sim) {
  const s = sim.s; const list = s.pendingProjects.splice(0);
  for (const id of list) {
    const x = sim.C.expansions.find((e) => e.id === id);
    if (x) { if (!s.zones.includes(x.wing)) { s.zones.push(x.wing); s.stage = Math.max(s.stage, x.stageAfter); relocateConflicts(sim); sim.emit('stage_up', { stage: s.stage, wing: x.wing }); sim.msg(`${WING_NAMES[x.wing]} açıldı! Lokanta artık: ${sim.C.stageLabels[s.stage]}`, 'good'); } }
    else if (!s.renovations.includes(id)) {
      s.renovations.push(id); const fx = RENOVATION_EFFECTS[id];
      if (fx.zone && !s.zones.includes(fx.zone)) { s.zones.push(fx.zone); relocateConflicts(sim); }
      Inv.syncDepot(sim); sim.emit('renovation_done', { id }); sim.msg(`${sim.C.renovations.find((r) => r.id === id).name} tamamlandı.`, 'good');
    }
  }
  if (list.length) sim.invalidate('restaurant_interior');
}
function relocateConflicts(sim) {
  const s = sim.s; const m = sim.map('restaurant_interior'); let moved = 0;
  for (let k = s.furniture.length - 1; k >= 0; k--) {
    const f = s.furniture[k]; if (f.scene !== 'restaurant_interior') continue; const d = sim.def(f); const [w, h] = sim.fp(f); let bad = false;
    for (let y = f.y; y < f.y + h; y++) for (let x = f.x; x < f.x + w; x++) { const g = m.ground[y * m.w + x]; if (layerOf(d) === 'wall' ? g !== T.WALL_FACE : (g === T.DOOR || m.zone[y * m.w + x] < 0 || (d.solid && m.noPlace[y * m.w + x] && !inStartNoPlace(x, y)))) bad = true; }
    if (bad && !inUse(sim, f)) { s.furniture.splice(k, 1); Inv.toLimbo(sim, f.type, 1); moved++; }
  }
  if (moved) sim.msg(`${moved} eşya yeni kapı yolunda kaldığı için güvenli depoya alındı (depo sandığından geri al).`);
}
const inStartNoPlace = (x, y) => x >= 14 && x <= 19 && y >= 31 && y <= 34;
