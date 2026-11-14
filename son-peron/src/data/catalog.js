// Birleşik JSON'u doğrulanmış, normalleştirilmiş kataloglara dönüştürür.
// Girdi dosyası değiştirilmez; burada yalnızca türev üretilir.
import { FURNITURE_META, EQUIPMENT_META, FIXTURES, HAND_TOOLS, COSMETIC_META, RENOVATION_EFFECTS, EXPANSION_PAID, TRAIN_SCHEDULE, VISITOR_TARGETS, PROFILES } from './supplement.js';

const hhmm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

export function buildCatalog(raw) {
  const eco = raw.economy_and_content_v07;
  const world = raw.world_and_simulation_v08;
  const sys = raw.systems_and_scope_v09;
  const C = { raw, items: {}, recipes: {}, placeables: {}, errors: [] };
  const addItem = (it) => {
    if (C.items[it.id]) C.errors.push(`Yinelenen item ID: ${it.id}`);
    C.items[it.id] = it;
  };

  C.core = eco.core;
  C.startGold = eco.core.starting_gold;
  C.invSlots = eco.core.starting_inventory_slots;
  C.depotSlots = eco.core.starting_depot_slots;
  C.portionsPerSlot = eco.core.portions_per_bar_slot;
  C.dayStart = hhmm(raw.locked.game_day.start);
  C.dayEnd = hhmm(raw.locked.game_day.end);
  C.realSecPerGameMin = raw.locked.game_day.real_seconds / raw.locked.game_day.game_minutes;
  C.daysPerSeason = raw.locked.seasons.days_each;
  C.yearDays = raw.locked.seasons.year_days;
  C.seasons = ['spring', 'summer', 'autumn', 'winter'];
  // Kullanıcı kararı önceliklidir: JSON'daki 3 sefer yerine TRAIN_SCHEDULE (5 sefer). JSON'daki 09/15/21 alt kümedir.
  C.trainTimes = TRAIN_SCHEDULE.map(hhmm);
  C.trainTimesGdd = raw.locked.train_arrivals.map(hhmm);
  C.train = {
    approach: world.train_simulation.approach_game_minutes_before,
    dwell: world.train_simulation.station_dwell_game_minutes,
    batch: world.train_simulation.disembark_batch_size,
    batchInterval: world.train_simulation.disembark_batch_interval_game_minutes
  };
  C.queueMax = world.restaurant_gameplay.queue_max_parties;
  C.canonical = raw.canonical;
  C.world = world.world;

  for (const g of eco.ingredients) addItem({ id: g.id, name: g.name, cat: 'ingredient', buy: g.mail_buy_g, sell: g.shop_sell_g, stack: g.stack_max });
  for (const g of eco.craft_resources) addItem({ id: g.id, name: g.name, cat: 'resource', buy: g.mail_buy_g, sell: g.shop_sell_g, stack: g.stack_max, source: g.source });
  C.seeds = {};
  for (const g of eco.seeds) {
    addItem({ id: g.id, name: g.name, cat: 'seed', buy: g.mail_buy_g, sell: 0, stack: 99 });
    C.seeds[g.id] = { id: g.id, crop: g.harvest_item_id, days: g.grow_watered_days, qty: g.harvest_quantity };
  }

  // Tarifler (yemek + içecek) — kilit koşulları v0.9'dan birleştirilir
  const unlocks = Object.fromEntries(sys.recipe_unlocks.map((u) => [u.recipe_id, u]));
  const bevUnlocks = Object.fromEntries(sys.beverage_unlocks.map((u) => [u.id, u]));
  for (const r of eco.food_recipes) {
    const u = unlocks[r.id];
    if (!u) C.errors.push(`Tarif kilidi eksik: ${r.id}`);
    C.recipes[r.id] = {
      id: r.id, name: r.name, kind: 'food', tier: r.tier, station: r.station, ingredients: r.ingredients,
      cook: r.cook_game_minutes, prep: r.prep_game_minutes, yield: r.yield_servings, price: r.sell_g_per_serving,
      cost: r.batch_material_cost_g, sales: r.full_batch_sales_g, profit: r.full_batch_gross_profit_g,
      freshDays: r.freshness_days, fridgeDays: r.refrigerated_freshness_days, perish: true,
      unlock: { stage: u?.min_stage ?? 1, paid: u?.min_paid_customers ?? 0, equip: u?.required_installed_equipment ?? null }
    };
    addItem({ id: r.id, name: r.name, cat: 'food', buy: null, sell: 0, stack: 99, price: r.sell_g_per_serving });
  }
  for (const b of eco.beverages) {
    const u = bevUnlocks[b.id] || {};
    C.recipes[b.id] = {
      id: b.id, name: b.name, kind: 'drink', tier: b.tier, station: b.station, ingredients: b.ingredients,
      cook: b.cook_game_minutes, prep: b.is_ready_bought ? 0 : 4, yield: b.yield_servings, price: b.sell_g_per_serving,
      cost: b.batch_material_cost_g, sales: b.full_batch_sales_g, profit: b.full_batch_gross_profit_g,
      ready: !!b.is_ready_bought, freshDays: 2, fridgeDays: 4, perish: !b.is_ready_bought,
      unlock: { stage: 1, paid: 0, equip: u.requires_installed ?? null }
    };
    addItem({ id: b.id, name: b.name, cat: 'drink', buy: b.is_ready_bought ? b.mail_buy_g_per_bottle : null, sell: 0, stack: 99, price: b.sell_g_per_serving, ready: !!b.is_ready_bought });
  }

  // Yerleştirilebilirler: 38 mobilya + 14 ekipman + 9 kozmetik + başlangıç sabitleri
  C.furniture = {}; C.equipment = {}; C.cosmetics = {}; C.tools = {};
  for (const f of eco.furniture) {
    const meta = FURNITURE_META[f.id];
    if (!meta) C.errors.push(`Mobilya meta eksik: ${f.id}`);
    const def = { id: f.id, name: f.name, w: f.width_cells, h: f.height_cells, materials: f.materials, stage: f.unlocks_at_restoration_stage, effect: f.effect, origin: 'furniture', ...(meta || {}) };
    if (def.footW) { def.w = def.footW; def.h = def.footH; }
    C.furniture[f.id] = def; C.placeables[f.id] = def;
    addItem({ id: f.id, name: f.name, cat: 'furniture', buy: null, sell: 0, stack: 1, desc: f.effect });
  }
  for (const e of eco.purchased_equipment) {
    const meta = EQUIPMENT_META[e.id];
    if (!meta) C.errors.push(`Ekipman meta eksik: ${e.id}`);
    const def = { id: e.id, name: e.name, price: e.mail_purchase_g, install: e.install_materials, stage: e.unlocks_at_restoration_stage, effect: e.effect, origin: 'equipment', solid: true, place: 'floor', kind: 'equipment', ...(meta || {}) };
    C.equipment[e.id] = def; C.placeables[e.id] = def;
    addItem({ id: e.id, name: e.name, cat: 'equipment', buy: e.mail_purchase_g, sell: 0, stack: 1, desc: e.effect });
  }
  for (const c of sys.cosmetics.items) {
    const meta = COSMETIC_META[c.id] || {};
    const def = { id: c.id, name: c.name, w: 1, h: 1, origin: 'cosmetic', kind: 'decor', comfort: 2, source: c.source, place: c.kind === 'wall_decor' ? 'wall' : 'floor', solid: c.kind !== 'wall_decor', light: c.kind === 'floor_light', ...meta };
    C.cosmetics[c.id] = def; C.placeables[c.id] = def;
    addItem({ id: c.id, name: c.name, cat: 'cosmetic', buy: null, sell: 0, stack: 1, desc: 'Benzersiz hatıra eşyası' });
  }
  for (const [id, f] of Object.entries(FIXTURES)) { C.placeables[id] = { id, origin: 'fixture', place: 'floor', solid: true, ...f }; addItem({ id, name: f.name, cat: 'furniture', buy: null, sell: 0, stack: 1, desc: 'Lokantanın eski demirbaşı' }); }
  for (const t of eco.crafted_tools) {
    C.tools[t.id] = { id: t.id, name: t.name, stage: t.stage, materials: t.materials, capacity: t.carry_capacity };
    addItem({ id: t.id, name: t.name, cat: 'tool', buy: null, sell: 0, stack: 1, desc: `Aynı anda ${t.carry_capacity} ürün taşır` });
  }
  for (const [id, t] of Object.entries(HAND_TOOLS)) addItem({ id, name: t.name, cat: 'handtool', buy: t.buy ?? null, sell: 0, stack: 1, desc: t.desc });

  C.expansions = eco.main_expansions.map((x) => ({
    id: x.id, name: x.name, stageAfter: x.restoration_stage_after_completion, paid: x.required_completed_paid_customers,
    gold: x.gold_cost_g, materials: x.materials, wing: raw.canonical.restoration_project_visual_wings[x.id]
  }));
  applyProgression(C, EXPANSION_PAID);
  C.renovations = eco.optional_renovations.map((x) => ({ id: x.id, name: x.name, stage: x.stage, gold: x.gold_cost_g, materials: x.materials }));
  C.renoFx = RENOVATION_EFFECTS;
  C.stageLabels = raw.canonical.restoration_stage_labels;
  C.wings = Object.fromEntries(world.world.interior.expansions.map((w) => [w.id, w]));

  C.roles = Object.fromEntries(eco.employees.map((r) => [r.role_id, { id: r.role_id, name: r.name, wage: r.base_daily_wage_g, tasks: r.allowed_tasks }]));
  const st = sys.staff_system;
  C.staff = {
    refreshDays: st.candidate_refresh_every_days, shown: st.candidate_count_displayed, minStage: st.initial_recruitment_stage,
    maxActive: st.max_active_by_restoration_stage, forbidden: st.all_helpers_must_not,
    candidates: Object.fromEntries(st.candidate_pool.map((c) => [c.candidate_id, { id: c.candidate_id, name: c.name, role: c.role_id, wage: c.daily_wage_g, skill: c.skill, speed: c.task_speed_factor }]))
  };

  const q = sys.quest_system;
  C.quests = {
    story: q.main_story_quests.map((m) => ({ id: m.id, name: m.name, chapter: m.chapter, prereq: m.prerequisite_quest_id, objectives: m.objectives, gold: m.reward.gold_g, cosmetic: m.reward.cosmetic_id })),
    side: q.side_quest_templates.map((s) => ({ id: s.id, giver: s.giver, name: s.title, type: s.type, target: s.target, gold: s.reward_g })),
    daily: q.daily_quest_templates.map((d) => ({ id: d.id, name: d.name, metric: d.metric, target: d.target, gold: d.reward_g })),
    limits: q.active_slot_limits, interactables: q.special_world_interactables
  };
  C.events = sys.train_events.events.map((e) => ({ id: e.id, name: e.name, stage: e.required_stage, seasons: e.eligible_seasons, time: hhmm(e.train_time), pax: e.passenger_multiplier, tip: e.tip_multiplier }));
  C.eventDays = sys.train_events.weekly_days;
  C.festivals = sys.festivals.festivals.map((f) => ({ id: f.id, name: f.name, season: f.season, day: f.day_of_season, cosmetic: f.cosmetic_reward_id, focus: f.focus }));
  C.weather = sys.weather_and_simulation.weights_by_season_percent;
  C.river = { stage: sys.riverbank.unlock_stage, rod: sys.riverbank.rod_purchase_g, casts: sys.riverbank.casts_per_day, success: sys.riverbank.base_success_percent / 100 };
  C.tutorial = { order: raw.canonical.tutorial_first_mail_order, cost: raw.canonical.tutorial_first_order_cost_g, repairs: Object.fromEntries(raw.canonical.tutorial_repairs.map((r) => [r.id, r.materials])) };
  C.npcs = world.named_npc_routines;
  C.acceptance = sys.acceptance_tests;

  C.errors.push(...validateCatalog(C));
  return C;
}

// Restorasyon eşiklerini uygular. GDD eşikleri ün kademesi olarak saklanır; tarif müşteri kilitleri
// aşama aralıklarına orantılı (parçalı doğrusal) kaydırılır, böylece bir aşama açılınca tarifler yine kademeli açılır.
export function applyProgression(C, paidMap) {
  for (const x of C.expansions) { if (x.paidGdd == null) x.paidGdd = x.paid; x.paid = paidMap[x.id] ?? x.paidGdd; }
  for (const r of Object.values(C.recipes)) if (r.unlock.paidGdd == null) r.unlock.paidGdd = r.unlock.paid;
  C.demandTiers = C.expansions.map((x) => x.paidGdd);
  const from = [0, ...C.demandTiers], to = [0, ...C.expansions.map((x) => x.paid)];
  const interp = (p) => { for (let i = 1; i < from.length; i++) if (p <= from[i]) return Math.round(to[i - 1] + ((p - from[i - 1]) * (to[i] - to[i - 1])) / (from[i] - from[i - 1])); return Math.round(p * to[to.length - 1] / from[from.length - 1]); };
  for (const r of Object.values(C.recipes)) r.unlock.paid = interp(r.unlock.paidGdd);
}

// Veri tutarlılığı: benzersiz ID, malzeme referansları, maliyet/hasılat formülleri, istasyon eşleşmesi.
export function validateCatalog(C) {
  const errs = [];
  const stations = new Set(['stove', 'ready']);
  for (const e of Object.values(C.equipment)) if (e.station) stations.add(e.station);
  for (const r of Object.values(C.recipes)) {
    let cost = 0;
    for (const [ing, qty] of Object.entries(r.ingredients)) {
      const it = C.items[ing];
      if (!it || it.buy == null) { errs.push(`${r.id}: bilinmeyen/fiyatsız malzeme ${ing}`); continue; }
      cost += it.buy * qty;
    }
    if (r.ready) cost = C.items[r.id].buy;
    if (cost !== r.cost) errs.push(`${r.id}: maliyet ${cost} ≠ ${r.cost}`);
    if (r.yield * r.price !== r.sales) errs.push(`${r.id}: hasılat uyuşmuyor`);
    if (r.sales - r.cost !== r.profit) errs.push(`${r.id}: brüt kâr uyuşmuyor`);
    if (!stations.has(r.station)) errs.push(`${r.id}: istasyon yok ${r.station}`);
    if (r.unlock.equip && !C.equipment[r.unlock.equip]) errs.push(`${r.id}: kilit ekipmanı yok`);
  }
  for (const p of Object.values(C.placeables)) {
    if (!(p.w > 0 && p.h > 0)) errs.push(`${p.id}: ayak izi yok`);
    for (const m of Object.keys(p.materials || p.install || {})) if (!C.items[m]) errs.push(`${p.id}: bilinmeyen malzeme ${m}`);
  }
  for (const s of Object.values(C.seeds)) if (!C.items[s.crop]) errs.push(`${s.id}: hasat ürünü yok`);
  for (const [st, arr] of Object.entries(VISITOR_TARGETS)) if (arr.length !== C.trainTimes.length) errs.push(`ziyaretçi hedefi aşama ${st}: ${arr.length} ≠ ${C.trainTimes.length} sefer`);
  for (const [k, p] of Object.entries(PROFILES)) if (p.w.length !== C.trainTimes.length) errs.push(`profil ${k}: sefer ağırlığı sayısı yanlış`);
  for (const t of C.trainTimesGdd) if (!C.trainTimes.includes(t)) errs.push(`GDD seferi ${t} tarifede yok`);
  for (const e of C.events) if (!C.trainTimes.includes(e.time)) errs.push(`${e.id}: etkinlik treni tarifede yok`);
  for (const qd of C.quests.story) if (qd.cosmetic && !C.cosmetics[qd.cosmetic]) errs.push(`${qd.id}: kozmetik yok`);
  for (const f of C.festivals) if (!C.cosmetics[f.cosmetic]) errs.push(`${f.id}: kozmetik yok`);
  return errs;
}
