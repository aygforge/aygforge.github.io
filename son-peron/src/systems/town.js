// Kasaba NPC rutinleri, dükkânlar, posta kataloğu ve teslimat kutusu.
import { NPC_SCHEDULES, SHOPS, SHOP_MARKUP, VISITOR_TARGETS } from '../data/supplement.js';
import * as Inv from './inventory.js';
import * as Quests from './quests.js';
import { fmtTime } from './calendar.js';

export function ranaVisits(sim) { return sim.s.day % 7 === 5 || Quests.storyActive(sim, 'story_10') || sim.s.quests.side.some((q) => q.id === 'side_rana_review'); }
function planSpot(sim, name) {
  const sch = NPC_SCHEDULES[name]; if (sch.visitor && !(ranaVisits(sim) && sim.s.minute >= sch.plan[0][0] + sim.C.train.dwell)) return null;
  let cur = sch.plan[0]; for (const p of sch.plan) if (sim.s.minute >= p[0]) cur = p; return cur;
}
export function initNpcs(sim) {
  const s = sim.s; s.npcs = {};
  for (const name of Object.keys(NPC_SCHEDULES)) { const sp = planSpot(sim, name); s.npcs[name] = { name, scene: sp ? sp[1] : 'away', x: sp ? sp[2] + 0.5 : 0, y: sp ? sp[3] + 0.5 : 0, dir: 'down', path: null, pi: 0, look: NPC_SCHEDULES[name].look }; }
}
// Sahne dışında da mantıksal olarak güncellenir (çizim yapılmaz)
export function tick(sim, dt) {
  for (const n of Object.values(sim.s.npcs)) {
    const sp = planSpot(sim, n.name);
    if (!sp) { n.scene = 'away'; continue; }
    if (n.scene !== sp[1]) { n.scene = sp[1]; n.x = sp[2] + 0.5; n.y = sp[3] + 0.5; n.path = null; if (n.name === 'Rana') { n.x = 26.5; n.y = 53.5; } }
    if (n.path) { sim.step(n, dt, sim.npcSpeed(11)); continue; }
    if (Math.abs(n.x - sp[2] - 0.5) + Math.abs(n.y - sp[3] - 0.5) > 0.6) { if (!sim.goto(n, sp[2], sp[3])) { n.x = sp[2] + 0.5; n.y = sp[3] + 0.5; } } else n.dir = 'down';
  }
}
const LINES = {
  Kemal: ['Trenler her gün tam 09:00, 15:00 ve 21:00\'de gelir. Saat şaşmaz!', 'Yolcular peronda sıcak bir çorba kokusu alınca lokantaya yönelir.', 'Sefer panosunda yarının yoğunluk tahminini bulursun.'],
  Feriha: ['Acil malzeme lazımsa buradayım; posta kadar ucuz değil ama hemen veririm.', 'Odun ve taş getirirsen satın alırım, zor günde işe yarar.'],
  'Rıza': ['Deden o marangoz tezgâhında ne masalar yapardı… Metal parça, kumaş, cam bende bulunur.', 'Sandalyeyi masaya döndürmeyi unutma; R tuşu işini görür.'],
  'Şirin': ['Tohumu çapaladığın yatağa ek, her gün sula. Yağmur yağarsa toprak kendini sular.', 'Kışın ürünler bir gün geç olgunlaşır, sabırlı ol.'],
  Sevim: ['O lokantanın mutfağında yıllarca çalıştım. Çorbayı barın üstüne koymadan kimse sipariş vermezdi!', 'Eski tarif defterindeki yemekler, misafir sayın arttıkça aklıma geliyor.'],
  Rana: ['Gar lokantalarını yazıyorum. Sizinkinin hikâyesi kulağıma geldi!', 'Temiz masa, hızlı servis, sıcak ortam… Okurlarım bunları sever.']
};
export function talk(sim, name) {
  const s = sim.s; const n = s.npcs[name]; if (!n) return sim.fail('Kimse yok');
  const lines = LINES[name]; let text = lines[(s.day + name.length) % lines.length]; const extra = [];
  if (name === 'Kemal') {
    s.flags.metKemal = true;
    s.coop = Math.max(s.coop, (s.flags.stationRequests || 0) >= 3 && s.stage >= 4 || Quests.storyDone(sim, 'story_15') ? 3 : (s.flags.stationRequests || 0) >= 1 ? 2 : 1);
    extra.push(`Gar İş Birliği: ${['', 'Tanışıklık', 'Güvenilir İşletme', 'Resmî Ortak'][s.coop]}`);
    if (Quests.storyActive(sim, 'story_15') && !s.flags.celebrationTalk) { s.flags.celebrationTalk = true; text = 'Büyük Gar Kutlaması için her şey hazır! Meydandaki kutlama panosundan başlatabilirsin.'; }
  }
  sim.emit('talked', { npc: name });
  return { ok: true, name, role: NPC_SCHEDULES[name].role, text, extra, side: Quests.sideFor(sim, name), shop: SHOPS[name] ? name : null };
}
// ---- Dükkânlar: anlık alım = posta fiyatı ×1,25 (yukarı yuvarlanır)
export const shopPrice = (sim, id) => Math.ceil(sim.C.items[id].buy * SHOP_MARKUP);
export function shopBuy(sim, shop, id, qty = 1) {
  const s = sim.s, def = SHOPS[shop]; if (!def?.sells.includes(id)) return sim.fail('Bu dükkânda satılmıyor');
  qty = Math.max(1, Math.floor(qty)); const cost = shopPrice(sim, id) * qty;
  if (s.gold < cost) return sim.fail(`Yetersiz altın (${cost} G gerekli)`);
  if (!Inv.canFitInv(sim, id, qty)) return sim.fail('Çantanda yer yok');
  s.gold -= cost; s.today.purchases += cost; Inv.give(sim, id, qty, { invOnly: true }); sim.emit('shop_buy', { item: id, qty, cost });
  return { ok: true, cost };
}
export function shopSell(sim, shop, id, qty = 1) {
  const s = sim.s, def = SHOPS[shop], it = sim.C.items[id]; if (!def?.buys.includes(id) || !it.sell) return sim.fail('Bu dükkân bunu almıyor');
  qty = Math.min(Math.floor(qty), Inv.countIn(s.player.inv, id)); if (qty <= 0) return sim.fail('Çantanda yok');
  Inv.removeFrom(s.player.inv, id, qty); const gain = it.sell * qty; s.gold += gain; s.today.resourceSales += gain; sim.emit('shop_sell', { item: id, qty, gain });
  return { ok: true, gain };
}
// ---- Posta kataloğu: para sepet onayında BİR KEZ düşer; ürünler ertesi sabah 06:00 teslimat kutusunda
export function catalogue(sim) {
  const C = sim.C, s = sim.s; const cat = (name, ids) => ({ name, items: ids.map((id) => ({ id, name: C.items[id].name, price: C.items[id].buy })) });
  const owned = (id) => s.furniture.some((f) => f.type === id) || Inv.count(sim, id) > 0 || s.crate.some((c) => c.id === id) || s.deliveries.some((d) => d.items[id]) || s.limbo.some((c) => c.id === id);
  const eq = Object.values(C.equipment).map((e) => ({ id: e.id, name: e.name, price: e.price, locked: e.stage > s.stage ? `${e.stage}. aşama` : owned(e.id) ? 'Alındı' : null, note: `${e.effect}${Object.keys(e.install).length ? ' · Kurulum: ' + Inv.matsText(sim, e.install) : ''}`, single: true }));
  return [
    cat('Gıda', Object.values(C.items).filter((i) => i.cat === 'ingredient').map((i) => i.id)),
    cat('Hazır içecek', Object.values(C.recipes).filter((r) => r.ready).map((r) => r.id)),
    cat('Tohum', Object.keys(C.seeds)),
    cat('Malzeme', Object.values(C.items).filter((i) => i.cat === 'resource' && i.buy != null).map((i) => i.id)),
    { name: 'Ekipman', items: eq }
  ];
}
export function cartCost(sim, cart) { return Object.entries(cart).reduce((a, [id, q]) => a + sim.C.items[id].buy * q, 0); }
export function mailOrder(sim, cart) {
  const s = sim.s, C = sim.C; const items = {}; for (const [id, q] of Object.entries(cart)) if (q > 0) items[id] = Math.floor(q);
  if (!Object.keys(items).length) return sim.fail('Sepet boş');
  for (const id of Object.keys(items)) {
    const it = C.items[id]; if (!it || it.buy == null) return sim.fail('Katalogda olmayan ürün');
    if (it.cat === 'equipment') { const e = catalogue(sim)[4].items.find((x) => x.id === id); if (e.locked || items[id] !== 1) return sim.fail(`${it.name}: ${e.locked || 'yalnız 1 adet'}`); }
  }
  const cost = cartCost(sim, items); if (s.gold < cost) return sim.fail(`Yetersiz altın: sepet ${cost} G, kasada ${s.gold} G`);
  const d = { id: sim.nid('d'), items, day: s.day + 1, cost, arrived: false };
  sim.once('mailpay:' + d.id, () => { s.gold -= cost; s.today.purchases += cost; s.deliveries.push(d); });
  sim.emit('mail_ordered', { cost, id: d.id });
  return sim.msg(`Sipariş verildi (${cost} G). Yarın sabah 06:00'da teslimat kutusunda.`, 'good');
}
export function collectCrate(sim) {
  const s = sim.s; if (!s.crate.length) return sim.msg(s.deliveries.length ? 'Kutu boş. Siparişin yarın sabah 06:00\'da gelecek.' : 'Teslimat kutusu boş.');
  let got = 0, left = 0;
  for (let i = s.crate.length - 1; i >= 0; i--) { const c = s.crate[i]; const rest = Inv.addTo(sim, s.player.inv, c.id, c.qty); got += c.qty - rest; if (rest) { c.qty = rest; left += rest; } else s.crate.splice(i, 1); }
  if (got) sim.emit('delivery_collected', { qty: got });
  return got ? sim.msg(left ? `${got} ürün alındı; ${left} ürün çantaya sığmadı, kutuda bekliyor.` : `Teslimat alındı: ${got} ürün çantanda.`, 'good') : sim.fail('Çantan dolu; ürünler kutuda bekliyor.');
}
export function timetable(sim) {
  const s = sim.s, C = sim.C; sim.emit('timetable');
  return { times: C.trainTimes.map(fmtTime), today: s.event, tomorrow: s.eventTomorrow, festival: s.festival, festivalTomorrow: s.festivalTomorrow, forecast: VISITOR_TARGETS[s.stage].map(([a, b]) => { const k = (s.eventTomorrow ? 1.15 : 1) * (s.festivalTomorrow ? 1.25 : 1); return [Math.round(a * k), Math.round(b * k)]; }), coop: s.coop };
}
export function repairNoticeboard(sim) {
  const mats = sim.C.quests.interactables.find((x) => x.id === 'old_gar_noticeboard').repair_materials;
  if (sim.s.flags.noticeboard) return sim.msg('Pano onarılmış; kasabanın ilanları yeniden asılı.');
  if (!Inv.has(sim, mats)) return sim.fail(`Pano onarımı için eksik: ${Inv.missingText(sim, mats)}`);
  sim.once('repair:noticeboard', () => { Inv.take(sim, mats); sim.s.flags.noticeboard = true; }); sim.emit('repaired', { id: 'noticeboard' });
  return sim.msg('Eski gar ilan panosu onarıldı!', 'good');
}
export function hostCelebration(sim) {
  const s = sim.s; if (!Quests.storyActive(sim, 'story_15')) return sim.msg('Büyük Gar Kutlaması panosu. Hikâyenin sonunda burada bir kutlama düzenlenecek.');
  if (!s.flags.celebrationTalk) return sim.fail('Önce gar müdürü Kemal ile konuş');
  if (s.celebration) return sim.msg('Kutlama duyuruldu!');
  s.celebration = s.day; sim.emit('celebration_hosted'); return sim.msg('Büyük Gar Kutlaması başladı! Bugün ve sonraki 2 gün trenler daha kalabalık.', 'good');
}
