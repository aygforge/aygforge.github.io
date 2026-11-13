// Görev sistemi: 15 ana hikâye, 10 yan, 8 günlük şablon + festival hedefleri.
// Görev tanımları veriden gelir; ilerleme oyun olaylarından otomatik işler; ödül işlem kimliğiyle bir kez verilir.
import * as Inv from './inventory.js';
import * as Kitchen from './kitchen.js';
import * as Build from './building.js';
import { FESTIVAL_GOALS } from '../data/supplement.js';

const paidInWindow = (sim) => sim.s.celebration && sim.s.day >= sim.s.celebration && sim.s.day <= sim.s.celebration + 2;
// ev: olay tipi (+f filtre, amt miktar, n hedef) | poll: durum sorgusu | mark: yön işareti [sahne,x,y]
export const OBJ = {
  read_heirloom_letter: { text: 'Yatak odasındaki miras mektubunu oku (E)', ev: 'letter_read', mark: ['restaurant_interior', 13, 9] },
  open_starter_chest: { text: 'Salondaki tozlu sandığı aç: balta, kazma, çapa, sulama kabı', ev: 'chest_opened', mark: ['restaurant_interior', 8, 18] },
  collect_wood_15: { text: 'Kuzeydeki ormandan 15 odun topla (ağaca E)', ev: 'gathered', f: (e) => e.item === 'wood', amt: (e) => e.qty, n: 15, mark: ['railway_outdoors', 54, 21] },
  collect_stone_5: { text: 'Ormandan 5 taş topla (kayaya E)', ev: 'gathered', f: (e) => e.item === 'stone', amt: (e) => e.qty, n: 5, mark: ['railway_outdoors', 54, 21] },
  repair_entrance: { text: 'Giriş kapısını onar (2 odun + 1 taş)', poll: (sim) => !!sim.s.flags.repair_entrance, mark: ['restaurant_interior', 16, 35] },
  repair_workbench: { text: 'Marangoz tezgâhını onar (3 odun + 1 taş)', poll: (sim) => !!sim.s.flags.repair_workbench, mark: ['restaurant_interior', 26, 30] },
  craft_table_1: { text: 'Tezgâhta 1 basit masa üret (4 odun)', ev: 'crafted', f: (e, sim) => sim.C.furniture[e.item]?.kind === 'table', n: 1, mark: ['restaurant_interior', 26, 30] },
  craft_chairs_2: { text: 'Tezgâhta 2 sandalye üret (4 odun)', ev: 'crafted', f: (e, sim) => sim.C.furniture[e.item]?.kind === 'seat', n: 2, mark: ['restaurant_interior', 26, 30] },
  repair_stove: { text: 'Mutfaktaki ocağı onar (2 odun + 3 taş)', poll: (sim) => !!sim.s.flags.repair_stove, mark: ['restaurant_interior', 36, 14] },
  place_table_and_chairs: { text: 'Masa ve sandalyeleri yerleştir (B): toplam 4 oturma yeri', poll: (sim) => Build.totalSeats(sim) >= 4 },
  place_first_mail_order: { text: 'Posta kutusundan ilk siparişi ver: 4 patates, 2 havuç, 2 soğan, 3 meyve suyu (44 G)', ev: 'mail_ordered', mark: ['railway_outdoors', 68, 46] },
  sleep_day1: { text: 'Yatakta uyu ve günü bitir', ev: 'slept', mark: ['restaurant_interior', 8, 6] },
  collect_first_delivery: { text: 'Teslimat kutusundan siparişini al', ev: 'delivery_collected', mark: ['railway_outdoors', 70, 46] },
  make_vegetable_soup: { text: 'Ocakta sebze çorbası pişir (4 porsiyon)', ev: 'cooked', f: (e, sim) => sim.C.recipes[e.recipe].kind === 'food', n: 1, mark: ['restaurant_interior', 36, 14] },
  stock_bar: { text: 'Çorbayı barın yemek slotuna, meyve suyunu içecek slotuna koy', poll: (sim) => { const m = Object.values(Kitchen.menu(sim)); return m.some((x) => x.kind === 'food') && (m.some((x) => x.kind === 'drink') || !Object.values(sim.C.recipes).some((r) => r.ready && Inv.count(sim, r.id) > 0)); }, mark: ['restaurant_interior', 26, 22] },
  serve_first_2_customers: { text: 'AÇIK tabelasını çevir; 09:00 treniyle gelen 2 müşteriyi karşıla, oturt ve servis yap', ev: 'served', amt: (e) => e.qty, n: 2, mark: ['restaurant_interior', 16, 35] },
  collect_payment_2: { text: '2 müşteriden hesabı tahsil et', ev: 'paid', amt: (e) => e.count, n: 2 },
  clean_first_table: { text: 'Kirli masayı bezle temizle (temizlik dolabını da incele)', ev: 'table_cleaned', n: 1, mark: ['restaurant_interior', 28, 16] },
  speak_stationmaster: { text: 'Gar müdürü Kemal ile konuş', ev: 'talked', f: (e) => e.npc === 'Kemal', mark: ['railway_outdoors', 22, 45] },
  inspect_timetable: { text: 'Gardaki sefer panosunu incele', ev: 'timetable', mark: ['railway_outdoors', 27, 44] },
  complete_1_daily_task: { text: '1 günlük görev tamamla', ev: 'daily_done' },
  speak_sevim: { text: 'Kasabada emekli aşçı Sevim ile konuş', ev: 'talked', f: (e) => e.npc === 'Sevim', mark: ['town_square', 23, 27] },
  cook_3_distinct_recipes: { text: '3 farklı tarif pişir', poll: (sim) => Object.keys(sim.s.recipesCooked).length >= 3, prog: (sim) => `${Math.min(3, Object.keys(sim.s.recipesCooked).length)}/3` },
  visit_town_square: { text: 'Kasaba meydanını ziyaret et (batı yolu)', poll: (sim) => sim.s.player.scene === 'town_square', mark: ['railway_outdoors', 0, 37] },
  talk_to_3_named_npcs: { text: '3 farklı kasabalıyla konuş', ev: 'talked', distinct: (e) => e.npc, n: 3 },
  finish_25_paid_customers_after_quest_start: { text: '25 müşteriden hesap tahsil et', ev: 'paid', amt: (e) => e.count, n: 25 },
  complete_one_station_request: { text: 'Kemal\'in bir gar isteğini tamamla', ev: 'side_done', f: (e) => e.giver === 'Kemal' },
  repair_old_gar_noticeboard: { text: 'Gardaki eski ilan panosunu onar (5 odun + 2 taş)', poll: (sim) => !!sim.s.flags.noticeboard, mark: ['railway_outdoors', 10, 44] },
  meet_rana: { text: 'Gazeteci Rana ile tanış (15:00 treninden sonra gar meydanında)', ev: 'talked', f: (e) => e.npc === 'Rana', mark: ['railway_outdoors', 30, 47] },
  reach_reputation_65: { text: 'İtibarı 65\'e çıkar', poll: (sim) => sim.s.reputation >= 65, prog: (sim) => `${Math.floor(sim.s.reputation)}/65` },
  serve_one_party_of_3_or_more: { text: '3+ kişilik bir grubu ağırla', ev: 'paid', f: (e) => e.size >= 3 },
  serve_2_different_foods_in_a_day: { text: 'Aynı gün 2 farklı yemek sat', poll: (sim) => Object.keys(sim.s.today.sold).filter((k) => sim.C.recipes[k].kind === 'food').length >= 2 },
  successfully_serve_5_customers_during_1_train_event: { text: 'Özel bir tren etkinliğinde 5 müşteri ağırla', poll: (sim) => sim.s.today.eventServed >= 5, prog: (sim) => `${Math.min(5, sim.s.today.eventServed)}/5` },
  reach_restoration_stage_4: { text: 'Lokantayı 4. aşamaya getir', poll: (sim) => sim.s.stage >= 4, prog: (sim) => `${sim.s.stage}/4` },
  serve_8_customers_in_one_day: { text: 'Bir günde 8 müşteri ağırla', poll: (sim) => sim.s.today.customers >= 8, prog: (sim) => `${Math.min(8, sim.s.today.customers)}/8` },
  reach_reputation_80: { text: 'İtibarı 80\'e çıkar', poll: (sim) => sim.s.reputation >= 80, prog: (sim) => `${Math.floor(sim.s.reputation)}/80` },
  complete_2_renovation_projects: { text: '2 isteğe bağlı renovasyon tamamla', poll: (sim) => sim.s.renovations.length >= 2, prog: (sim) => `${Math.min(2, sim.s.renovations.length)}/2` },
  host_grand_station_celebration: { text: 'Kemal ile konuş, sonra gardaki kutlama panosundan Büyük Gar Kutlaması\'nı başlat', ev: 'celebration_hosted', mark: ['railway_outdoors', 15, 46] },
  finish_10_paid_customers_during_celebration_or_next_2_days: { text: 'Kutlama günü ve sonraki 2 günde 10 müşteri ağırla', ev: 'paid', f: (e, sim) => paidInWindow(sim), amt: (e) => e.count, n: 10 }
};
const STORY_RECIPE_GIFTS = { story_06: ['fried_bread', 'lentil_soup', 'omelet'], story_11: ['tomato_pasta', 'chicken_stew'], story_13: ['mushroom_rice', 'night_stew'] };
const DAILY_EV = {
  serve_customers: ['paid', (e) => e.count], sell_vegetable_soup: ['sold', (e) => (e.item === 'vegetable_soup' ? 1 : 0)], sell_drinks: ['sold', (e) => (e.kind === 'drink' ? 1 : 0)],
  clean_tables: ['table_cleaned', () => 1], harvest_crops: ['harvested', () => 1], gather_wood: ['gathered', (e) => (e.item === 'wood' ? e.qty : 0)], earn_tips: ['tip', () => 1]
};

export function init(sim) { if (!sim.s.quests.story && !sim.s.quests.done.length) startStory(sim, sim.C.quests.story[0].id); }
export function storyDef(sim, id) { return sim.C.quests.story.find((q) => q.id === id); }
export function storyActive(sim, id) { return sim.s.quests.story?.id === id; }
export function storyDone(sim, id) { return sim.s.quests.done.includes(id); }
function startStory(sim, id) { sim.s.quests.story = { id, done: {}, c: {}, startDay: sim.s.day }; sim.fx.push({ type: 'quest_started', id }); }

function progress(sim, state, objId, ev) {
  if (state.done[objId]) return; const o = OBJ[objId]; if (!o) return;
  if (o.poll) { if (o.poll(sim)) state.done[objId] = true; return; }
  if (!ev || ev.type !== o.ev || (o.f && !o.f(ev, sim))) return;
  if (o.distinct) { const set = (state.c[objId] ||= []); const k = o.distinct(ev); if (!set.includes(k)) set.push(k); if (set.length >= o.n) state.done[objId] = true; return; }
  state.c[objId] = (state.c[objId] || 0) + (o.amt ? o.amt(ev) : 1);
  if (state.c[objId] >= (o.n || 1)) state.done[objId] = true;
}
export function objectiveProgress(sim, state, objId) {
  const o = OBJ[objId]; if (!o || state.done[objId]) return ''; if (o.prog) return o.prog(sim);
  if (o.n > 1) return `${Math.min(o.n, Array.isArray(state.c[objId]) ? state.c[objId].length : state.c[objId] || 0)}/${o.n}`; return '';
}

let depth = 0;
export function onEvent(sim, ev) {
  const s = sim.s, Q = s.quests; if (!Q || depth > 4 || ev.type === 'toast') return; depth++;
  try {
    // Ana hikâye
    for (let guard = 0; guard < 3 && Q.story; guard++) {
      const def = storyDef(sim, Q.story.id); for (const o of def.objectives) progress(sim, Q.story, o, ev);
      if (!def.objectives.every((o) => Q.story.done[o])) break;
      completeStory(sim, def); ev = null;
    }
    if (!ev) return;
    // Günlük görevler
    for (const d of Q.daily) {
      if (d.done) continue; const def = sim.C.quests.daily.find((x) => x.id === d.id); const [type, amt] = DAILY_EV[def.metric];
      if (ev.type !== type) continue; d.c += amt(ev);
      if (d.c >= def.target) { d.done = true; sim.once(`daily:${s.day}:${d.id}`, () => { s.gold += def.gold; s.today.questGold += def.gold; }); sim.msg(`Günlük görev tamam: ${def.name} (+${def.gold} G)`, 'good'); sim.emit('daily_done', { id: d.id }); }
    }
    // Yan görevler
    for (const q of [...Q.side]) {
      const def = sim.C.quests.side.find((x) => x.id === q.id); const t = def.target; let done = false;
      if (def.type === 'harvest' && ev.type === 'harvested') { const [item, n] = Object.entries(t)[0]; if (ev.item === item) q.c += ev.qty; done = q.c >= n; }
      else if (def.type === 'serve_product' && ev.type === 'sold') { const [item, n] = Object.entries(t)[0]; if (ev.item === item) q.c++; done = q.c >= n; }
      else if (def.type === 'successful_service_train' && ev.type === 'paid') { const [h, m] = t.hour.split(':').map(Number); if (ev.train === h * 60 + m) q.c += ev.count; done = q.c >= t.count; }
      else if (def.type === 'average_satisfaction' && ev.type === 'paid') { if (s.day > q.startDay + t.within_days) { q.sats = []; q.startDay = s.day; } q.sats = [...(q.sats || []), ev.sat].slice(-t.customers); q.c = q.sats.length; done = q.sats.length >= t.customers && q.sats.reduce((a, b) => a + b, 0) / q.sats.length >= t.min; }
      else if (def.type === 'build' && ev.type === 'placed') { const [item, n] = Object.entries(t)[0]; if (ev.item === item) q.c++; done = q.c >= n; }
      if (done) completeSide(sim, q, def);
    }
    // Festival hedefi
    if (Q.festival && !Q.festival.done) {
      const g = FESTIVAL_GOALS[Q.festival.id], d = s.today; let ok = true;
      if (g.serve && d.customers < g.serve) ok = false;
      if (g.plants && s.furniture.filter((f) => sim.def(f).plant).length < g.plants) ok = false;
      if (g.distinctFoods && Object.keys(d.sold).filter((k) => sim.C.recipes[k].kind === 'food').length < g.distinctFoods) ok = false;
      if (g.serveEvening && d.evening < g.serveEvening) ok = false;
      if (ok) {
        Q.festival.done = true; const f = sim.C.festivals.find((x) => x.id === Q.festival.id);
        if (!grantCosmetic(sim, f.cosmetic)) sim.once(`fest:${sim.cal.yearOf(sim.C, s.day)}:${f.id}`, () => { s.gold += 60; s.today.questGold += 60; });
        sim.msg(`${f.name} hedefi tamam! Ödül: ${sim.C.items[f.cosmetic].name}`, 'good'); sim.emit('festival_done', { id: f.id });
      }
    }
  } finally { depth--; }
}
function grantCosmetic(sim, id) { return sim.once('cosmetic:' + id, () => { sim.s.cosmeticsOwned.push(id); Inv.give(sim, id, 1); }); }
function completeStory(sim, def) {
  const s = sim.s, Q = s.quests;
  sim.once('quest:' + def.id, () => {
    s.gold += def.gold; s.today.questGold += def.gold; Q.done.push(def.id);
    if (def.cosmetic) grantCosmetic(sim, def.cosmetic);
    for (const r of STORY_RECIPE_GIFTS[def.id] || []) if (!s.storyUnlocks.includes(r)) s.storyUnlocks.push(r);
    if (def.id === 'story_03') s.flags.canOpen = true;
    if (def.id === 'story_04') s.flags.tutorialDone = true;
  });
  sim.fx.push({ type: 'quest_done', id: def.id, name: def.name, gold: def.gold, cosmetic: def.cosmetic });
  sim.msg(`Görev tamamlandı: ${def.name}${def.gold ? ` (+${def.gold} G)` : ''}${def.cosmetic ? ` · Hatıra: ${sim.C.items[def.cosmetic].name}` : ''}`, 'good');
  const next = sim.C.quests.story.find((q) => q.prereq === def.id);
  if (next) startStory(sim, next.id); else { Q.story = null; sim.msg('Ana hikâye tamamlandı. Lokanta artık tamamen senin — serbest oyun sürüyor!', 'good'); }
}
function completeSide(sim, q, def) {
  const s = sim.s; s.quests.side = s.quests.side.filter((x) => x !== q); s.quests.sideCooldown[def.id] = s.day + 7;
  sim.once(`side:${def.id}:${q.startDay}`, () => { s.gold += def.gold; s.today.questGold += def.gold; s.flags.stationRequests = (s.flags.stationRequests || 0) + (def.giver === 'Kemal' ? 1 : 0); });
  sim.msg(`${def.giver}: “${def.name}” tamamlandı (+${def.gold} G)`, 'good'); sim.emit('side_done', { id: def.id, giver: def.giver });
}
// NPC ile konuşunca: teslimat türü görevleri kapat ya da uygun yeni görev öner
export function sideFor(sim, npc) {
  const s = sim.s, Q = s.quests; const active = Q.side.find((q) => sim.C.quests.side.find((d) => d.id === q.id).giver === npc);
  if (active) return { active, def: sim.C.quests.side.find((d) => d.id === active.id) };
  if (Q.side.length >= sim.C.quests.limits.town_or_station || !s.flags.tutorialDone) return null;
  const opts = sim.C.quests.side.filter((d) => d.giver === npc && (Q.sideCooldown[d.id] || 0) <= s.day && feasibleSide(sim, d));
  return opts.length ? { offer: opts[(s.day + npc.length) % opts.length] } : null;
}
function feasibleSide(sim, d) { if (d.type === 'successful_service_train') return sim.s.flags.canOpen; if (d.type === 'build') return sim.s.furniture.filter((f) => f.type === 'garden_bed').length <= 18; return true; }
export function acceptSide(sim, id) {
  const Q = sim.s.quests; if (Q.side.some((q) => q.id === id) || Q.side.length >= sim.C.quests.limits.town_or_station) return sim.fail('Yeni yan görev alınamıyor (en fazla 2 aktif)');
  Q.side.push({ id, c: 0, startDay: sim.s.day }); const d = sim.C.quests.side.find((x) => x.id === id); return sim.msg(`Yeni görev: ${d.name}`, 'good');
}
export function deliverSide(sim, id) {
  const q = sim.s.quests.side.find((x) => x.id === id), def = sim.C.quests.side.find((x) => x.id === id); if (!q || def.type !== 'delivery') return sim.fail('Teslim edilecek görev yok');
  for (const [item, n] of Object.entries(def.target)) if (Inv.countIn(sim.s.player.inv, item) < n) return sim.fail(`Çantanda ${n} ${sim.C.items[item].name} olmalı`);
  for (const [item, n] of Object.entries(def.target)) Inv.removeFrom(sim.s.player.inv, item, n);
  completeSide(sim, q, def); return { ok: true };
}
export function sideText(sim, def) {
  const t = def.target, nm = (id) => sim.C.items[id]?.name || id;
  if (def.type === 'delivery') return Object.entries(t).map(([i, n]) => `${n} ${nm(i)} getir`).join(', ');
  if (def.type === 'harvest') return Object.entries(t).map(([i, n]) => `${n} ${nm(i)} hasat et`).join(', ');
  if (def.type === 'serve_product') return Object.entries(t).map(([i, n]) => `${n} porsiyon ${nm(i)} sat`).join(', ');
  if (def.type === 'successful_service_train') return `${t.hour} treninden ${t.count} müşteri ağırla`;
  if (def.type === 'average_satisfaction') return `${t.within_days} gün içinde ${t.customers} müşteride ortalama %${t.min} memnuniyet`;
  return Object.entries(t).map(([i, n]) => `${n} ${nm(i)} kur`).join(', ');
}
// Her sabah: yalnız mevcut becerilerle oynanabilir iki günlük görev
export function rollDaily(sim) {
  const s = sim.s; const feas = sim.C.quests.daily.filter((d) => {
    if (['serve_customers', 'sell_vegetable_soup', 'sell_drinks', 'clean_tables'].includes(d.metric)) return s.flags.tutorialDone && (d.target <= 3 || s.stage >= 2 || d.metric !== 'serve_customers');
    if (d.metric === 'earn_tips') return s.flags.tutorialDone && s.paidCustomers >= 4;
    if (d.metric === 'harvest_crops') return s.furniture.filter((f) => f.crop && f.crop.grown + 1 >= sim.C.seeds[f.crop.seed].days).length >= d.target;
    if (d.metric === 'gather_wood') return Inv.count(sim, 'axe') > 0 && s.flags.tutorialDone;
    return false;
  });
  const pool = [...feas]; const out = [];
  while (out.length < sim.C.quests.limits.daily && pool.length) { const d = pool.splice(Math.floor(sim.rand() * pool.length), 1)[0]; if (!out.some((o) => sim.C.quests.daily.find((x) => x.id === o.id).metric === d.metric)) out.push({ id: d.id, c: 0, done: false }); }
  s.quests.daily = out;
}
// 2. gün güvenliği: çorba+bar+AÇIK hazır olana dek saat 08:45'te bekler; tren saati 09:00 değişmez
export function checkHold(sim) {
  const s = sim.s; const t0 = sim.C.trainTimes[0];
  const need = storyActive(sim, 'story_04') && !s.flags.tutorialTrain && s.minute >= t0 - 15 && s.minute < t0 && !(s.open && Kitchen.menuAvailable(sim));
  if (need && !s.hold) sim.msg('Saat 08:45\'te bekliyor: çorbayı bara koy ve AÇIK tabelasını çevir; 09:00 treni seni bekler.');
  s.hold = need;
}
// HUD/defter için görev özeti
export function tracker(sim) {
  const s = sim.s, Q = s.quests; const out = [];
  if (Q.story) { const def = storyDef(sim, Q.story.id); out.push({ kind: 'story', title: `${def.chapter}. Bölüm · ${def.name}`, reward: def.gold, lines: def.objectives.map((o) => ({ id: o, text: OBJ[o]?.text || o, done: !!Q.story.done[o], prog: objectiveProgress(sim, Q.story, o), mark: OBJ[o]?.mark })) }); }
  for (const d of Q.daily) { const def = sim.C.quests.daily.find((x) => x.id === d.id); out.push({ kind: 'daily', title: 'Günlük', reward: def.gold, lines: [{ text: def.name, done: d.done, prog: `${Math.min(d.c, def.target)}/${def.target}` }] }); }
  for (const q of Q.side) { const def = sim.C.quests.side.find((x) => x.id === q.id); const n = def.type === 'successful_service_train' ? def.target.count : def.type === 'average_satisfaction' ? def.target.customers : Object.values(def.target)[0]; out.push({ kind: 'side', title: `${def.giver} · ${def.name}`, reward: def.gold, lines: [{ text: sideText(sim, def), done: false, prog: def.type === 'delivery' ? '' : `${Math.min(q.c, n)}/${n}` }] }); }
  if (Q.festival) { const f = sim.C.festivals.find((x) => x.id === Q.festival.id); out.push({ kind: 'festival', title: f.name, reward: 0, lines: [{ text: FESTIVAL_GOALS[f.id].text, done: Q.festival.done, prog: '' }] }); }
  return out;
}
export function nextMark(sim) { const t = tracker(sim)[0]; if (!t || t.kind !== 'story') return null; const l = t.lines.find((x) => !x.done && x.mark); return l ? l.mark : null; }
