// Bağlama duyarlı etkileşim (E). Hedef listesi ve eylem yönlendirmesi tek yerde.
// Dönüş: {ui:'panelAdı', ...} → arayüz paneli açılır; aksi halde eylem doğrudan uygulanır.
import * as Kitchen from './kitchen.js';
import * as Service from './service.js';
import * as Build from './building.js';
import * as Farm from './farming.js';
import * as Town from './town.js';
import * as Inv from './inventory.js';
import { DIRV } from './sim.js';

export function targets(sim) {
  const s = sim.s, scene = s.player.scene, m = sim.map(scene), out = [];
  for (const f of s.furniture) { if (f.scene !== scene) continue; const [w, h] = sim.fp(f); out.push({ kind: 'furn', id: f.id, x: f.x, y: f.y, w, h, f }); }
  for (const o of m.objects) if (o.interact) out.push({ kind: 'obj', id: o.interact, x: o.x, y: o.y, w: o.w, h: o.h });
  if (scene === 'railway_outdoors') { for (const n of m.nodes) if (Farm.nodeState(sim, n).alive) out.push({ kind: 'node', id: n.id, x: n.x, y: n.y, w: 1, h: 1, n }); out.push({ kind: 'door', id: 'door_out', x: m.doorCell[0], y: m.doorCell[1], w: 1, h: 1 }); }
  if (scene === 'restaurant_interior') {
    out.push({ kind: 'door', id: 'door_in', x: 16, y: 35, w: 1, h: 1 });
    for (const g of s.groups) if (g.state === 'ENTRY_QUEUE') { const c = Service.members(sim, g)[0]; if (c) out.push({ kind: 'group', id: g.id, x: c.x - 0.5, y: c.y - 0.5, w: 1, h: 1, g }); }
    for (const st of s.stains) out.push({ kind: 'stain', id: st.id, x: st.x, y: st.y, w: 1, h: 1 });
  }
  for (const n of Object.values(s.npcs)) if (n.scene === scene) out.push({ kind: 'npc', id: n.name, x: n.x - 0.5, y: n.y - 0.5, w: 1, h: 1 });
  return out;
}
function dist(p, t) { const cx = Math.max(t.x, Math.min(p.x, t.x + t.w)), cy = Math.max(t.y, Math.min(p.y, t.y + t.h)); return Math.hypot(p.x - cx, p.y - cy); }
// En yakın, tercihen bakılan yöndeki hedef (menzil ~1,5 karo)
export function nearest(sim) {
  const p = sim.s.player; const v = DIRV[p.dir]; let best = null;
  for (const t of targets(sim)) {
    if (!label(sim, t)) continue;
    let d = dist(p, t); if (d > 1.5) continue;
    const tx = t.x + t.w / 2 - p.x, ty = t.y + t.h / 2 - p.y; if (tx * v[0] + ty * v[1] > 0.2) d -= 0.45;
    if (t.kind === 'group' || t.kind === 'npc') d -= 0.3;
    if (!best || d < best.d) best = { t, d };
  }
  return best ? best.t : null;
}
function tableOf(sim, f) { const d = sim.def(f); if (d.kind === 'table') return f; if (d.kind === 'seat') return Build.tables(sim).find((t) => Build.seatsOfTable(sim, t).some((s) => s.inst === f.id)) || null; return null; }

export function label(sim, t) {
  const s = sim.s, p = s.player;
  if (t.kind === 'node') return { tree: 'Ağacı kes', rock: 'Kayayı kır', mushroom: 'Mantar topla', berry: 'Meyve topla' }[t.n.kind];
  if (t.kind === 'group') return 'Karşıla ve masa seç';
  if (t.kind === 'npc') return `${t.id} ile konuş`;
  if (t.kind === 'stain') return 'Lekeyi sil';
  if (t.kind === 'door') return !s.flags.repair_entrance ? 'Kapıyı onar (2 odun + 1 taş)' : s.flags.canOpen ? (s.open ? 'Tabela: AÇIK → KAPALI yap' : 'Tabela: KAPALI → AÇIK yap') : 'Tabela (ilk onarımlar bitince)';
  if (t.kind === 'obj') return { mailbox: 'Posta kataloğu', crate: 'Teslimat kutusu', old_gar_noticeboard: s.flags.noticeboard ? 'İlan panosu' : 'Panoyu onar (5 odun + 2 taş)', grand_celebration_board: 'Kutlama panosu', timetable: 'Sefer panosu', rod_stand: 'Olta tezgâhı', fishing: 'Olta at', town_board: 'Kasaba panosu', heirloom_letter: 'Mektup' }[t.id];
  const f = t.f, d = sim.def(f);
  const tb = tableOf(sim, f);
  if (tb) {
    const g = s.groups.find((x) => x.table === tb.id);
    if (g) { if (g.state === 'ORDER_READY') return 'Sipariş al'; if (g.state === 'WAITING_FOR_SERVE') return p.carry.some((c) => c.order === g.order && !c.orphan) ? 'Servis yap' : 'Servis bekliyor (bardan al)'; if (g.state === 'WAIT_PAYMENT') return 'Hesabı tahsil et'; return 'Müşteriler yerleşiyor'; }
    if (s.dirty[tb.id]) return 'Masayı temizle';
    return null;
  }
  if (d.letter) return 'Miras mektubunu oku';
  if (d.starterChest) return s.flags.chest ? null : 'Tozlu sandığı aç';
  if (d.kind === 'bed') return 'Uyu (günü bitir)';
  if (d.wardrobe) return 'Görünümü değiştir';
  if (d.depotAccess || d.storage) return 'Depo';
  if (d.workbench) return s.flags.repair_workbench ? 'Marangoz tezgâhı (üret)' : 'Tezgâhı onar (3 odun + 1 taş)';
  if (d.station) {
    if (d.repair && !s.flags[d.repair]) return 'Ocağı onar (2 odun + 3 taş)';
    if (!f.cook) return p.pot && d.station === 'stove' ? 'Tencereyi bırak' : `${d.name}: pişir`;
    return f.cook.phase === 'done' ? 'Hazır yemeği al' : 'Pişiyor…';
  }
  if (d.readyShelf) return p.pot ? 'Tencereyi tezgâha bırak' : Kitchen.readyBatches(sim, f.id).length ? 'Bekleyen yemeği al' : 'Hazırlık tezgâhı';
  if (d.barModule) {
    if (p.pot) return 'Yemeği bara koy';
    if (p.carry.some((c) => c.orphan)) return 'Ürünü bara geri koy';
    if (Service.pendingAt(sim, f.id).length && p.carry.length < Build.trayCapacity(sim)) return 'Siparişi al';
    return 'Bar stoğu';
  }
  if (d.cleaning) return 'Temizlik dolabı';
  if (d.projectBoard) return 'Restorasyon projeleri';
  if (d.fireplace) return s.fire > 0 ? `Şömine (${Math.ceil(s.fire / 60)} sa ısı) · odun at` : 'Şömineyi yak (1 odun)';
  if (d.plot) { const a = Farm.nextFarmAction(sim, f); return a.label || null; }
  if (d.fridge) return 'Soğutucu: yemekler 4 gün taze kalır';
  if (d.prepBonus) return 'Gelişmiş hazırlık tezgâhı';
  return null;
}

export function interact(sim, t) {
  const s = sim.s, p = s.player; if (p.busy) return { ok: false };
  if (t.kind === 'node') return Farm.hitNode(sim, t.id);
  if (t.kind === 'group') return { ui: 'seat', group: t.id };
  if (t.kind === 'npc') return { ui: 'talk', npc: t.id };
  if (t.kind === 'stain') return Service.startCleanStain(sim, t.id);
  if (t.kind === 'door') {
    if (!s.flags.repair_entrance) return Build.repair(sim, 'repair_entrance');
    if (!s.flags.canOpen) return sim.msg('Önce ilk onarımları tamamla, siparişini ver ve uyu. Lokanta yarın açılabilir.');
    if (s.closing.active) return sim.fail('23:00\'ten sonra lokanta açılamaz');
    s.open = !s.open; sim.emit('sign', { open: s.open });
    return sim.msg(s.open ? 'Tabela AÇIK: trenden inen yolcular gelebilir.' : 'Tabela KAPALI: yeni müşteri alınmaz, içeridekiler kalır.', 'good');
  }
  if (t.kind === 'obj') {
    switch (t.id) {
      case 'mailbox': return { ui: 'mail' };
      case 'crate': return Town.collectCrate(sim);
      case 'old_gar_noticeboard': return Town.repairNoticeboard(sim);
      case 'grand_celebration_board': return Town.hostCelebration(sim);
      case 'timetable': return { ui: 'timetable' };
      case 'rod_stand': return Farm.buyRod(sim);
      case 'fishing': { const why = Farm.canFish(sim); return why ? sim.fail(why) : { ui: 'fishing' }; }
      case 'town_board': return { ui: 'guestbook' };
    }
    return { ok: false };
  }
  const f = t.f, d = sim.def(f); const tb = tableOf(sim, f);
  if (tb) {
    const g = s.groups.find((x) => x.table === tb.id);
    if (g) {
      if (g.state === 'ORDER_READY') return { ui: 'order', group: g.id };
      if (g.state === 'WAITING_FOR_SERVE') return Service.serveTable(sim, tb.id);
      if (g.state === 'WAIT_PAYMENT') return Service.collectPayment(sim, g.id);
      return sim.msg('Müşteriler yerlerine geçiyor.');
    }
    if (s.dirty[tb.id]) return Service.startCleanTable(sim, tb.id);
    return { ok: false };
  }
  if (d.letter) { sim.emit('letter_read'); return { ui: 'letter' }; }
  if (d.starterChest) {
    if (s.flags.chest) return { ok: false };
    sim.once('starter_chest', () => { s.flags.chest = true; for (const id of ['axe', 'pickaxe', 'hoe', 'watering_can']) Inv.give(sim, id, 1); });
    sim.emit('chest_opened'); return sim.msg('Sandıktan balta, kazma, çapa ve sulama kabı çıktı!', 'good');
  }
  if (d.kind === 'bed') return { ui: 'sleep' };
  if (d.wardrobe) return { ui: 'wardrobe' };
  if (d.depotAccess || d.storage) return { ui: 'depot' };
  if (d.workbench) return s.flags.repair_workbench ? { ui: 'craft' } : Build.repair(sim, 'repair_workbench');
  if (d.station) {
    if (d.repair && !s.flags[d.repair]) return Build.repair(sim, d.repair);
    if (!f.cook) return { ui: 'cook', inst: f.id };
    if (f.cook.phase === 'done') return Kitchen.takePot(sim, f.id);
    const r = sim.C.recipes[f.cook.recipe]; const left = f.cook.phase === 'prep' ? f.cook.prep - f.cook.t + f.cook.cook : f.cook.cook - f.cook.t;
    return sim.msg(`${r.name} pişiyor: ${Math.ceil(left)} oyun dakikası kaldı.`);
  }
  if (d.readyShelf) { if (p.pot) return Kitchen.putPotDown(sim, f.id); if (Kitchen.readyBatches(sim, f.id).length) return Kitchen.takeReady(sim, f.id); return sim.msg('Hazırlık tezgâhı: bara sığmayan tencereleri buraya bırakabilirsin.'); }
  if (d.barModule) {
    if (p.pot) return Kitchen.stockPot(sim, f.id);
    if (p.carry.some((c) => c.orphan)) { Service.returnOrphans(sim); return { ok: true }; }
    if (Service.pendingAt(sim, f.id).length && p.carry.length < Build.trayCapacity(sim)) return Service.pickupAt(sim, f.id);
    return { ui: 'bar', inst: f.id };
  }
  if (d.cleaning) { s.flags.cleaningSeen = true; sim.emit('cleaning_seen'); return { ui: 'cleaning' }; }
  if (d.projectBoard) return { ui: 'projects' };
  if (d.fireplace) { if (!Inv.has(sim, { wood: 1 })) return sim.fail('Şömine için odun yok (lokanta yine de çalışır)'); if (s.fire >= 480) return sim.msg('Şömine yeterince dolu.'); Inv.take(sim, { wood: 1 }); s.fire += 240; sim.emit('fire_lit'); return sim.msg('Şömineye odun atıldı: 4 oyun saati ısı.', 'good'); }
  if (d.plot) return Farm.farmAction(sim, f.id);
  if (d.fridge || d.prepBonus) return sim.msg(d.effect);
  return { ok: false };
}
// F: seçili aletle bakılan hedefe uygula (ağaç/kaya/tarım)
export function useTool(sim) {
  const t = nearest(sim); if (!t) return { ok: false };
  if (t.kind === 'node' || (t.kind === 'furn' && sim.def(t.f).plot)) return interact(sim, t);
  return { ok: false };
}
// Q: taşınanı uygun yere bırak
export function dropCarried(sim) {
  const s = sim.s, p = s.player;
  if (p.pot) { const sh = s.furniture.find((f) => sim.def(f).readyShelf && f.scene === p.scene && Math.hypot(f.x + 1 - p.x, f.y + 0.5 - p.y) < 2.5); return sh ? Kitchen.putPotDown(sim, sh.id) : sim.fail('Tencereyi bırakmak için hazırlık tezgâhına yaklaş'); }
  if (p.carry.length) { const bar = s.furniture.find((f) => f.slots && f.scene === p.scene && Math.hypot(f.x + 1 - p.x, f.y + 0.5 - p.y) < 2.5); if (!bar) return sim.fail('Servisi bırakmak için bara yaklaş'); let n = 0; for (let i = p.carry.length - 1; i >= 0; i--) { const c = p.carry[i]; const o = Service.order(sim, c.order); const l = o?.lines.find((x) => x.id === c.line); if (Kitchen.returnToBar(sim, c)) { p.carry.splice(i, 1); n++; if (l && l.status === 'picked') { const b = Kitchen.reserve(sim, c.item); if (b) { l.status = 'reserved'; l.batch = b; } } } } return n ? sim.msg(`${n} ürün bara geri bırakıldı.`) : sim.fail('Barda yer yok'); }
  return { ok: false };
}
