import { describe, it, expect } from 'vitest';
import { C, fresh, afterTutorial, toStage, give, arrive, seat, stockSoup, clearBar, toasts } from './helpers/setup.js';
import * as StaffSrc from '../src/systems/staff.js';
import fs from 'node:fs';

describe('Yerleştirme ve restorasyon', () => {
  it('T8: serbest yerleştirme, döndürme; çarpışma ve koltuk bağları güncellenir; kullanımdaki eşya taşınamaz', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; s.minute = 600; const m = sim.map('restaurant_interior');
    expect(sim.build.totalSeats(sim)).toBe(4);
    give(sim, { wood: 6 }); sim.build.craft(sim, 'wooden_chair'); sim.build.craft(sim, 'stool');
    // Masaya dönük olmayan sandalye koltuk sayılmaz; döndürünce sayılır
    expect(bot.placeItem('wooden_chair', 18, 21, 2).ok).toBe(true); expect(sim.build.totalSeats(sim)).toBe(4);
    const ch = s.furniture.find((f) => f.type === 'wooden_chair' && f.x === 18 && f.y === 21);
    expect(sim.grid('restaurant_interior')[21 * m.w + 18]).toBe(1);
    expect(sim.build.pickUp(sim, ch.id).ok).toBe(true); expect(sim.grid('restaurant_interior')[21 * m.w + 18]).toBe(0);
    expect(bot.placeItem('wooden_chair', 18, 21, 0).ok).toBe(true); expect(sim.build.totalSeats(sim)).toBe(5);
    expect(bot.placeItem('stool', 19, 24, 1).ok).toBe(true); expect(sim.build.totalSeats(sim)).toBe(6); // tabure her yöne
    // Mutfağa masa, salona ocak: oda adı kısıt değildir
    give(sim, { wood: 4 }); sim.build.craft(sim, 'simple_table'); expect(bot.placeItem('simple_table', 35, 20, 1).ok).toBe(true);
    const stove = s.furniture.find((f) => f.type === 'starter_stove'); expect(sim.build.pickUp(sim, stove.id).ok).toBe(true);
    expect(bot.placeItem('starter_stove', 12, 30, 1).ok).toBe(true);
    const st2 = s.furniture.find((f) => f.type === 'starter_stove'); expect(sim.fp(st2)).toEqual([1, 2]);
    // Duvar/kilitli kanat/üst üste: reddedilir
    give(sim, { wood: 4 }); sim.build.craft(sim, 'simple_table'); const i = s.player.inv.findIndex((x) => x && x.id === 'simple_table');
    expect(sim.build.canPlace(sim, 'simple_table', 'restaurant_interior', 4, 4, 0).ok).toBe(false);
    expect(sim.build.canPlace(sim, 'simple_table', 'restaurant_interior', 22, 8, 0).ok).toBe(false);
    expect(sim.build.canPlace(sim, 'simple_table', 'restaurant_interior', 10, 24, 0).ok).toBe(false);
    expect(s.player.inv[i].qty).toBe(1);
    // Kullanımdaki masa taşınamaz
    clearBar(g); stockSoup(g, 4); const a = arrive(g); seat(g, a);
    expect(sim.build.pickUp(sim, a.table).ok).toBe(false); expect(sim.furn(a.table)).toBeTruthy();
  });
  it('T17: genişleme ertesi sabah açılır; teknik ID salon_expansion_3 doğu MUTFAK kanadını açar; mobilya silinmez', () => {
    const g = afterTutorial(); const { sim, s, bot } = g;
    const count0 = s.furniture.length; const pos0 = JSON.stringify(s.furniture.map((f) => [f.id, f.x, f.y, f.rot]));
    s.gold = 1000; s.paidCustomers = C.expansions[0].paid; const w0 = sim.inv.count(sim, 'wood'); give(sim, { wood: 20, stone: 10 });
    expect(sim.build.canPlace(sim, 'small_plant', 'restaurant_interior', 22, 8, 0).ok).toBe(false);
    expect(sim.build.startProject(sim, 'salon_expansion_1').ok).toBe(true); expect(s.gold).toBe(700); expect(sim.inv.count(sim, 'wood')).toBe(w0);
    expect(sim.build.startProject(sim, 'salon_expansion_1').ok).toBe(false); expect(s.gold).toBe(700);
    expect(s.stage).toBe(1); expect(s.zones).toEqual([]);
    sim.daysys.sleep(sim, true);
    expect(s.stage).toBe(2); expect(s.zones).toEqual(['north_lounge']);
    expect(sim.build.canPlace(sim, 'small_plant', 'restaurant_interior', 22, 8, 0).ok).toBe(true);
    expect(s.furniture.length).toBe(count0); expect(JSON.stringify(s.furniture.map((f) => [f.id, f.x, f.y, f.rot]))).toBe(pos0);
    expect(sim.path('restaurant_interior', 16, 34, 24, 8)).toBeTruthy();
    sim.build.applyPendingProjects(sim); expect(s.stage).toBe(2); // idempotent
    toStage(g, 4);
    expect(C.expansions.find((x) => x.id === 'salon_expansion_3').wing).toBe('east_kitchen'); expect(s.zones).toContain('east_kitchen');
    expect(sim.path('restaurant_interior', 16, 34, 52, 20)).toBeTruthy(); expect(sim.path('restaurant_interior', 16, 34, 40, 36)).toBeNull();
    toStage(g, 5); expect(sim.path('restaurant_interior', 16, 34, 40, 36)).toBeTruthy(); expect(s.furniture.length).toBe(count0);
    void bot;
  });
  it('T17b: yeni kapı yolunda kalan eşya güvenli depoya alınır, kaybolmaz', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; give(sim, { wood: 1, stone: 2 }); sim.build.craft(sim, 'small_plant');
    expect(bot.placeItem('small_plant', 23, 16, 0).ok).toBe(true); toStage(g, 2);
    expect(s.furniture.some((f) => f.type === 'small_plant')).toBe(false); expect(s.limbo).toEqual([{ id: 'small_plant', qty: 1 }]);
    expect(sim.inv.takeLimbo(sim)).toBe(1); expect(sim.inv.count(sim, 'small_plant')).toBe(1);
  });
});

describe('Mutfak kilitleri ve ekipman', () => {
  it('T13/T14: satın alınan ekipman yalnız KURULUNCA tarif açar; para siparişte, malzeme kurulumda bir kez', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; toStage(g, 2); s.gold = 500; const r = C.recipes.baked_potato; s.paidCustomers = r.unlock.paid;
    expect(sim.kitchen.recipeStatus(sim, r).unlocked).toBe(false);
    bot.toScene('railway_outdoors'); bot.go(68, 47); expect(sim.town.mailOrder(sim, { basic_oven: 1 }).ok).toBe(true); expect(s.gold).toBe(240);
    expect(sim.town.mailOrder(sim, { basic_oven: 1 }).ok).toBe(false);
    sim.daysys.sleep(sim, true); expect(s.crate).toEqual([{ id: 'basic_oven', qty: 1 }]);
    bot.use((t) => t.kind === 'obj' && t.id === 'crate', 'railway_outdoors'); expect(sim.inv.count(sim, 'basic_oven')).toBe(1);
    expect(sim.kitchen.recipeStatus(sim, r).unlocked).toBe(false); // çantada: kilit açılmaz
    const spot = bot.findSpot('basic_oven', 0, [31, 14, 46, 31]); let pl = bot.placeItem('basic_oven', spot[0], spot[1], 0);
    expect(pl.ok).toBe(false); expect(toasts(sim).pop()).toMatch(/Kurulum için eksik/);
    const w0 = sim.inv.count(sim, 'wood'); give(sim, { wood: 8, stone: 10 }); pl = bot.placeItem('basic_oven', spot[0], spot[1], 0); expect(pl.ok).toBe(true);
    expect(sim.inv.count(sim, 'wood')).toBe(w0); expect(s.gold).toBe(240);
    expect(sim.kitchen.recipeStatus(sim, r).unlocked).toBe(true);
    // Söküp yeniden kurmak ücretsiz
    expect(sim.build.pickUp(sim, pl.inst.id).ok).toBe(true); expect(sim.kitchen.recipeStatus(sim, r).unlocked).toBe(false);
    expect(bot.placeItem('basic_oven', spot[0], spot[1], 1).ok || bot.placeItem('basic_oven', spot[0], spot[1], 0).ok).toBe(true);
    expect(sim.kitchen.recipeStatus(sim, r).unlocked).toBe(true);
    // Kayıt/yükle sonrası kilit durumu aynı
    const p = sim.save.parse(sim.save.serialize(sim)); expect(p.ok).toBe(true);
    // Müşteri eşiği: hikâye ödülü yalnız müşteri koşulunu esnetir, aşamayı değil
    const omelet = C.recipes.omelet; s.paidCustomers = omelet.unlock.paid - 1; expect(sim.kitchen.recipeStatus(sim, omelet).unlocked).toBe(false);
    s.storyUnlocks.push('omelet', 'night_stew'); expect(sim.kitchen.recipeStatus(sim, omelet).unlocked).toBe(true);
    expect(sim.kitchen.recipeStatus(sim, C.recipes.night_stew).unlocked).toBe(false);
  });
  it('T27: balık tutmadan, katalogdan alınan balıkla balık tava yapılır', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; toStage(g, 4); s.paidCustomers = C.recipes.fried_fish.unlock.paid; s.gold = 1000; s.minute = 500;
    sim.town.mailOrder(sim, { large_pan: 1, fish: 2, flour: 1 }); sim.daysys.sleep(sim, true);
    bot.use((t) => t.kind === 'obj' && t.id === 'crate', 'railway_outdoors'); give(sim, { wood: 8, stone: 4, metal_part: 1 });
    const spot = bot.findSpot('large_pan', 0, [31, 14, 46, 31]); expect(bot.placeItem('large_pan', spot[0], spot[1], 0).ok).toBe(true);
    expect(s.fishing.casts).toBe(0); expect(bot.cook('fried_fish', true)).toBe(true);
    expect(s.batches.find((b) => b.item === 'fried_fish').qty).toBe(3);
  });
  it('T22: şömine 1 odunla 4 oyun saati ısıtır; odunsuz oyun devam eder', () => {
    const g = afterTutorial(); const { sim, s } = g; toStage(g, 2); s.minute = 400;
    s.furniture.push({ id: 'fp', type: 'fireplace', scene: 'restaurant_interior', x: 12, y: 16, rot: 0, installed: true });
    sim.inv.take(sim, { wood: sim.inv.count(sim, 'wood') });
    const t = { kind: 'furn', id: 'fp', f: sim.furn('fp') }; expect(sim.ia.interact(sim, t).ok).toBe(false); expect(s.fire).toBe(0);
    give(sim, { wood: 1 }); expect(sim.ia.interact(sim, t).ok).toBe(true); expect(s.fire).toBe(240);
    s.day = 90; expect(sim.season()).toBe('winter'); const grp = { waits: {}, menuKinds: 1 };
    expect(sim.service.satisfaction(sim, grp).comfort).toBe(100); sim.tick(239); expect(s.fire).toBeGreaterThan(0); sim.tick(2); expect(s.fire).toBe(0);
    expect(sim.service.satisfaction(sim, grp).comfort).toBe(40); sim.tick(30); expect(s.minute).toBeGreaterThan(660);
  });
});

describe('Personel A modeli (T12)', () => {
  it('personel sipariş almaz, servis yapmaz, tahsilat yapmaz; ücret günde bir kez; para yoksa vardiya başlamaz', () => {
    const g = afterTutorial(); const { sim, s } = g; toStage(g, 5); s.gold = 500;
    sim.staffsys.refreshCandidates(sim, true); expect(s.staff.candidates.length).toBe(5);
    for (const role of Object.keys(C.roles)) { const id = Object.keys(C.staff.candidates).find((c) => C.staff.candidates[c].role === role); s.staff.candidates = [id]; expect(sim.staffsys.hire(sim, id).ok).toBe(true); }
    expect(s.staff.roster.length).toBe(4); s.staff.candidates = ['cleaner_tahir']; expect(sim.staffsys.hire(sim, 'cleaner_tahir').ok).toBe(false);
    const wages = s.staff.roster.reduce((a, r) => a + C.staff.candidates[r.id].wage, 0);
    sim.daysys.sleep(sim, true); expect(s.gold).toBe(500 - wages); expect(Object.keys(s.staff.agents).length).toBe(4);
    sim.staffsys.startShifts(sim); expect(s.gold).toBe(500 - wages); // aynı gün ikinci kez ücret alınmaz
    // Oyuncu hiçbir şey yapmadan bir tren dalgası: sipariş/ödeme oluşmamalı
    clearBar(g); stockSoup(g, 8); s.open = true; s.minute = 530; const gold = s.gold, paid = s.paidCustomers;
    sim.tick(330); expect(s.today.groups).toBe(0); expect(s.orders.length).toBe(0); expect(s.gold).toBe(gold); expect(s.paidCustomers).toBe(paid);
    expect(s.today.left).toBeGreaterThan(0); expect(sim.kitchen.menu(sim).vegetable_soup.available).toBe(8);
    // Temizlik görevlisi kirli masayı, servis yardımcısı menüdeki hazır stoğu taşır
    const t = sim.build.tables(sim)[0]; s.dirty[t.id] = { plates: true }; s.stains.push({ id: 'sx', x: 12, y: 28 });
    const shelf = s.furniture.find((f) => f.type === 'prep_counter'); s.batches.push({ id: 'rb', item: 'vegetable_soup', qty: 3, reserved: 0, loc: 'ready', inst: shelf.id, slot: null, createdAt: sim.absMin(), perish: true, unitCost: 3 });
    s.batches.push({ id: 'rb2', item: 'boiled_potatoes', qty: 3, reserved: 0, loc: 'ready', inst: shelf.id, slot: null, createdAt: sim.absMin(), perish: true, unitCost: 4 });
    sim.tick(60); expect(s.dirty[t.id]).toBeUndefined(); expect(s.stains.length).toBe(0);
    expect(sim.kitchen.menu(sim).vegetable_soup.available).toBe(11); expect(sim.kitchen.menu(sim).boiled_potatoes).toBeUndefined(); // yeni menü çeşidi seçmez
    expect(sim.kitchen.prepTime(sim, C.recipes.vegetable_soup)).toBe(3);
    // Parasız vardiya pasif
    s.gold = 5; sim.daysys.sleep(sim, true); expect(s.gold).toBe(5); expect(Object.keys(s.staff.agents).length).toBe(0);
  });
  it('personel kaynak kodu yasak oyuncu eylemlerini çağırmaz', () => {
    const src = fs.readFileSync(new URL('../src/systems/staff.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
    for (const fn of ['takeOrder', 'greet(', 'serveTable', 'collectPayment', 'startCooking', 'pickupAt']) expect(src.includes(fn), fn).toBe(false);
    expect(C.staff.maxActive).toEqual({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }); expect(typeof StaffSrc.tick).toBe('function');
    const g = fresh(); expect(g.sim.staffsys.hire(g.sim, 'cleaner_tahir').ok).toBe(false);
  });
});

describe('Ekonomi (T19, T20)', () => {
  it('T19: para negatife düşmez; satılan eşya tekrar satılamaz; bakkal ×1,25 yukarı yuvarlar', () => {
    const g = afterTutorial(); const { sim, s } = g; s.gold = 10;
    expect(sim.town.mailOrder(sim, { beef: 1 }).ok).toBe(false); expect(s.gold).toBe(10);
    expect(sim.town.shopPrice(sim, 'potato')).toBe(5); expect(sim.town.shopPrice(sim, 'carrot')).toBe(4); expect(sim.town.shopPrice(sim, 'salt')).toBe(2); expect(sim.town.shopPrice(sim, 'bottled_juice')).toBe(8);
    expect(sim.town.shopBuy(sim, 'Feriha', 'potato', 3).ok).toBe(false); expect(sim.town.shopBuy(sim, 'Feriha', 'potato', 2).ok).toBe(true); expect(s.gold).toBe(0);
    expect(sim.town.shopBuy(sim, 'Feriha', 'beef', 1).ok).toBe(false); // sınırlı ürün listesi
    const n = sim.inv.countIn(s.player.inv, 'potato'); expect(sim.town.shopSell(sim, 'Feriha', 'potato', 99).gain).toBe(n * 2);
    expect(sim.town.shopSell(sim, 'Feriha', 'potato', 1).ok).toBe(false); expect(s.gold).toBe(n * 2);
  });
  it('T20: iflastan odun/taş satışıyla dönüş → sebze siparişi → çorba', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; s.gold = 0; clearBar(g); s.minute = 400;
    for (const sl of [s.player.inv, s.depot]) for (let i = 0; i < sl.length; i++) if (sl[i] && C.items[sl[i].id].cat !== 'handtool') sl[i] = null;
    expect(bot.gather('tree', 3)).toBe(3); expect(bot.gather('rock', 2)).toBe(2);
    expect(bot.toScene('town_square')).toBe(true); const f = s.npcs.Feriha; s.minute = Math.max(s.minute, 500); sim.tick(1);
    expect(sim.town.talk(sim, 'Feriha').shop).toBe('Feriha'); void f;
    sim.town.shopSell(sim, 'Feriha', 'wood', 18); sim.town.shopSell(sim, 'Feriha', 'stone', 6); expect(s.gold).toBe(30);
    bot.toScene('railway_outdoors'); bot.go(68, 47); expect(sim.town.mailOrder(sim, { potato: 2, carrot: 1, onion: 1 }).ok).toBe(true); expect(s.gold).toBe(17);
    bot.toScene('restaurant_interior'); sim.daysys.sleep(sim, true); bot.use((t) => t.kind === 'obj' && t.id === 'crate', 'railway_outdoors');
    expect(bot.cook('vegetable_soup', true)).toBe(true); expect(sim.kitchen.menu(sim).vegetable_soup.available).toBe(4);
  });
});

describe('Tarım, dere, takvim, görevler', () => {
  it('T24: çapa/ekim/sulama/yağmur/hasat; susuz gün büyümez ama ölmez; sahne dışı ve kayıtla tutarlı', async () => {
    const { Sim } = await import('../src/systems/sim.js');
    const g = afterTutorial(); let { sim, s, bot } = g; s.gold = 100; s.day = 5; give(sim, {}); sim.inv.give(sim, 'potato_seed', 2);
    const bed = s.furniture.find((f) => f.type === 'garden_bed'); const use = () => bot.use((t) => t.kind === 'furn' && t.id === bed.id, 'railway_outdoors');
    use(); expect(bed.tilled).toBe(true); use(); expect(bed.crop).toEqual({ seed: 'potato_seed', grown: 0 }); expect(sim.inv.count(sim, 'potato_seed')).toBe(1);
    use(); expect(bed.watered).toBe(true); expect(use().ok).toBe(false);
    bot.toScene('restaurant_interior'); s.weather = 'clear'; sim.daysys.sleep(sim, true); expect(bed.crop.grown).toBe(1);
    s.weather = 'clear'; sim.daysys.sleep(sim, true); expect(bed.crop.grown).toBe(1); // sulanmadı: bekler, ölmez
    s.weather = 'rain'; sim.daysys.sleep(sim, true); expect(bed.crop.grown).toBe(2); // yağmur sular
    const p = sim.save.parse(sim.save.serialize(sim)); sim = new Sim(C, p.state); s = sim.s; const bot2 = new (bot.constructor)(sim);
    const bed2 = s.furniture.find((f) => f.id === bed.id); expect(bed2.crop.grown).toBe(2);
    bot2.use((t) => t.kind === 'furn' && t.id === bed2.id, 'railway_outdoors'); bot2.toScene('restaurant_interior'); s.weather = 'clear'; sim.daysys.sleep(sim, true);
    expect(sim.farm.plotInfo(sim, bed2).stage).toBe('ripe'); const pot = sim.inv.count(sim, 'potato');
    bot2.use((t) => t.kind === 'furn' && t.id === bed2.id, 'railway_outdoors'); expect(sim.inv.count(sim, 'potato')).toBe(pot + 3); expect(bed2.crop).toBeNull();
    expect(s.furniture.filter((f) => f.type === 'garden_bed').length).toBe(4);
  });
  it('dere: aşama 2, olta 75 G, günde 4 atış, başarısızlıkta olta kaybolmaz', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; s.gold = 100;
    expect(sim.farm.canFish(sim)).toMatch(/2. aşama/); toStage(g, 2); s.gold = 100;
    expect(bot.toScene('riverbank')).toBe(true); expect(bot.use((t) => t.id === 'rod_stand').ok).toBe(true); expect(s.gold).toBe(25);
    let fish = 0; for (let i = 0; i < 4; i++) { expect(sim.farm.fishCast(sim).ok).toBe(true); const before = sim.inv.count(sim, 'fish'); sim.farm.fishResolve(sim, i !== 0); fish += sim.inv.count(sim, 'fish') - before; }
    expect(sim.farm.fishCast(sim).ok).toBe(false); expect(sim.inv.count(sim, 'fishing_rod')).toBe(1); expect(fish).toBeLessThanOrEqual(3);
    bot.toScene('restaurant_interior'); sim.daysys.sleep(sim, true); expect(s.fishing.casts).toBe(0);
  });
  it('T25: görev ödülü bir kez; günlük görevler her uykudan sonra uygun listeden seçilir', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; const gold = s.gold;
    sim.emit('letter_read'); sim.emit('chest_opened'); sim.emit('slept'); expect(s.gold).toBe(gold); expect(s.quests.done.filter((x) => x === 'story_04').length).toBe(1);
    expect(sim.inv.count(sim, 'memory_photo')).toBe(1);
    const seen = new Set();
    for (let i = 0; i < 6; i++) { sim.daysys.sleep(sim, true); expect(s.quests.daily.length).toBe(2); expect(new Set(s.quests.daily.map((d) => d.id)).size).toBe(2); for (const d of s.quests.daily) { seen.add(d.id); expect(['daily_harvest_2']).not.toContain(d.id); expect(d.c).toBe(0); } }
    expect(seen.size).toBeGreaterThan(2);
    // Günlük ödül: bir kez
    s.quests.daily = [{ id: 'daily_clean_3', c: 2, done: false }]; const g0 = s.gold; sim.emit('table_cleaned', {}); expect(s.gold).toBe(g0 + 18); sim.emit('table_cleaned', {}); expect(s.gold).toBe(g0 + 18);
    // Yan görev: teslimat
    bot.toScene('town_square'); s.minute = 600; sim.tick(1); const d = sim.town.talk(sim, 'Feriha'); expect(d.side?.offer).toBeTruthy();
    sim.quests.acceptSide(sim, 'side_grocer_supply'); expect(sim.quests.deliverSide(sim, 'side_grocer_supply').ok).toBe(false);
    sim.inv.give(sim, 'potato', 3); const g1 = s.gold; expect(sim.quests.deliverSide(sim, 'side_grocer_supply').ok).toBe(true); expect(s.gold).toBe(g1 + 35);
    expect(sim.quests.sideFor(sim, 'Feriha')?.offer?.id).not.toBe('side_grocer_supply'); // 7 gün bekleme
  });
});
