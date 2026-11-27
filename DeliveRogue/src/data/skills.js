// data/skills.js — 60 run skills (20 preserved from the HTML5 build + 40 new, Master Prompt Ek B).
// Fields: id, name, cat (attack|elemental|defense|movement|economy), max rank, rarity (C|R|E|L),
// prereq (skill id that must be owned), base (true = one of the 4 mutually exclusive base elements),
// req (context filter: 'checkpoint' | 'boss' | 'thermal' | 'fizzy'), desc (TR tooltip).
// Effects are computed from scratch in SkillMgr.compute(); numbers here are starting balance values.
export const RARITY = { C: { w: 55, key: 'rar_C' }, R: { w: 30, key: 'rar_R' }, E: { w: 12, key: 'rar_E' }, L: { w: 3, key: 'rar_L' } };

export const SKILLS = [
  // ---- preserved 20 (source semantics kept) ----
  { id: 'double_order', name: 'Double Order', cat: 'attack', max: 2, rarity: 'R', desc: 'Ek bir ödeme kartı fırlatır (%60 hasar). 2 kez alınabilir.' },
  { id: 'rapid_payment', name: 'Rapid Payment', cat: 'attack', max: 2, rarity: 'C', desc: 'Saldırı hızı +%25. 2 kez alınabilir.' },
  { id: 'piercing_card', name: 'Piercing Card', cat: 'attack', max: 1, rarity: 'R', desc: 'Kartlar 1 ek düşmanı deler (delme sonrası %65 hasar).' },
  { id: 'ricochet', name: 'Ricochet', cat: 'attack', max: 1, rarity: 'R', desc: 'Kartlar yakındaki en fazla 2 düşmana seker (her sekmede %70 hasar).' },
  { id: 'critical_receipt', name: 'Critical Receipt', cat: 'attack', max: 2, rarity: 'C', desc: 'Kritik şansı +%15 ve kritik hasar +%50.' },
  { id: 'diagonal_delivery', name: 'Diagonal Delivery', cat: 'attack', max: 1, rarity: 'R', desc: 'Her atışa iki çapraz kart ekler (%50 hasar).' },
  { id: 'electric_card', name: 'Electric Card', cat: 'elemental', max: 1, rarity: 'E', base: true, desc: 'İsabetlerin %35\'i yakındaki 2 düşmana zincir yıldırım sıçratır (%45 hasar).' },
  { id: 'frozen_payment', name: 'Frozen Payment', cat: 'elemental', max: 1, rarity: 'R', base: true, desc: 'İsabet alan düşmanlar 1.6 sn boyunca %45 yavaşlar.' },
  { id: 'burning_receipt', name: 'Burning Receipt', cat: 'elemental', max: 1, rarity: 'R', base: true, desc: 'İsabetler 2 sn yakar (toplam isabet hasarının %80\'i).' },
  { id: 'toxic_payment', name: 'Toxic Payment', cat: 'elemental', max: 1, rarity: 'R', base: true, desc: 'İsabetler 4 sn zehirler (toplam isabet hasarının %120\'si).' },
  { id: 'reinforced_helmet', name: 'Reinforced Helmet', cat: 'defense', max: 2, rarity: 'C', desc: 'Bu teslimat için maks. HP +25 ve anında +25 HP.' },
  { id: 'emergency_shield', name: 'Emergency Shield', cat: 'defense', max: 1, rarity: 'R', desc: 'Her 8 sn\'de dolan kalkan, gelen bir darbeyi tamamen engeller.' },
  { id: 'cashback', name: 'Cashback', cat: 'defense', max: 1, rarity: 'C', desc: 'Düşman yenince %25 şansla 6 HP iyileşirsin.' },
  { id: 'protective_packaging', name: 'Protective Packaging', cat: 'defense', max: 1, rarity: 'C', desc: 'Pakete gelen tüm hasar -%30.' },
  { id: 'heat_resistant_bag', name: 'Heat Resistant Bag', cat: 'defense', max: 1, rarity: 'C', desc: 'Buhar kaynaklı paket hasarı -%60.' },
  { id: 'express_courier', name: 'Express Courier', cat: 'movement', max: 2, rarity: 'C', desc: 'Hareket hızı +%10. 2 kez alınabilir.' },
  { id: 'emergency_brake', name: 'Emergency Brake', cat: 'movement', max: 1, rarity: 'C', desc: 'Kaygan zeminde kontrol kaybı -%75.' },
  { id: 'last_minute', name: 'Last Minute', cat: 'movement', max: 1, rarity: 'R', desc: 'Kalan süre %30\'un altına düşünce hareket hızı +%25.' },
  { id: 'shortcut_expert', name: 'Shortcut Expert', cat: 'movement', max: 1, rarity: 'C', desc: 'Teslimat rotası yönünde ilerlerken hareket hızı +%14.' },
  { id: 'perfect_balance', name: 'Perfect Balance', cat: 'movement', max: 1, rarity: 'R', desc: 'Geri tepme -%60, kayma -%40, çarpma kaynaklı paket hasarı -%50.' },
  // ---- new attack (12) ----
  { id: 'power_transaction', name: 'Power Transaction', cat: 'attack', max: 2, rarity: 'C', desc: 'Kart hasarı +%15 (seviye başına).' },
  { id: 'extended_signal', name: 'Extended Signal', cat: 'attack', max: 2, rarity: 'C', desc: 'Nişan ve kart menzili +%15 (seviye başına).' },
  { id: 'overcharged_pos', name: 'Overcharged POS', cat: 'attack', max: 1, rarity: 'E', desc: 'Her 5. gerçek atış ×1.75 hasar verir.' },
  { id: 'triple_transaction', name: 'Triple Transaction', cat: 'attack', max: 1, rarity: 'R', desc: 'Her 3. atış ×1.5 hasar verir.' },
  { id: 'precision_payment', name: 'Precision Payment', cat: 'attack', max: 2, rarity: 'C', desc: 'Kritik şansı +8 puan (seviye başına).' },
  { id: 'heavy_receipt', name: 'Heavy Receipt', cat: 'attack', max: 1, rarity: 'C', desc: 'Kartlar düşmanı geri iter (geri itme +%40). Elitler yarı, boss etkilenmez.' },
  { id: 'explosive_card', name: 'Explosive Card', cat: 'attack', max: 1, rarity: 'E', desc: 'Ana isabet küçük bir patlama yapar: çevreye %40 hasar. Zincirleme yok.' },
  { id: 'execution_receipt', name: 'Execution Receipt', cat: 'attack', max: 1, rarity: 'R', desc: 'Canı %25\'in altındaki hedeflere +%35 hasar.' },
  { id: 'elite_collector', name: 'Elite Collector', cat: 'attack', max: 1, rarity: 'R', desc: 'Elit düşmanlara +%25 hasar.' },
  { id: 'boss_invoice', name: 'Boss Invoice', cat: 'attack', max: 1, rarity: 'R', req: 'boss', desc: 'Boss\'lara +%25 hasar. Yalnız boss bölümlerinde çıkar.' },
  { id: 'point_blank', name: 'Point Blank', cat: 'attack', max: 1, rarity: 'C', desc: 'Menzilin ilk %35\'indeki isabetler +%25 hasar.' },
  { id: 'long_distance_payment', name: 'Long Distance Payment', cat: 'attack', max: 1, rarity: 'C', desc: 'Menzilin son %35\'indeki isabetler +%25 hasar.' },
  // ---- new elemental supports (8) ----
  { id: 'static_charge', name: 'Static Charge', cat: 'elemental', max: 1, rarity: 'R', prereq: 'electric_card', desc: 'Zincir yıldırım hasarı +%25. (Electric Card gerekir)' },
  { id: 'thunder_strike', name: 'Thunder Strike', cat: 'elemental', max: 1, rarity: 'L', prereq: 'electric_card', desc: 'Ana isabetlerin %15\'i alan yıldırımı çağırır (%60 hasar, 1.5 sn bekleme). (Electric Card gerekir)' },
  { id: 'frostbite', name: 'Frostbite', cat: 'elemental', max: 1, rarity: 'C', prereq: 'frozen_payment', desc: 'Yavaşlatma süresi +%50. (Frozen Payment gerekir)' },
  { id: 'ice_shatter', name: 'Ice Shatter', cat: 'elemental', max: 1, rarity: 'R', prereq: 'frozen_payment', desc: 'Yavaşlamış hedeflere +%20 hasar. (Frozen Payment gerekir)' },
  { id: 'flame_burst', name: 'Flame Burst', cat: 'elemental', max: 1, rarity: 'E', prereq: 'burning_receipt', desc: 'Yanan düşman ölünce çevresine alev patlaması (sınırlı). (Burning Receipt gerekir)' },
  { id: 'heatwave', name: 'Heatwave', cat: 'elemental', max: 1, rarity: 'R', prereq: 'burning_receipt', desc: 'Yanma hasarı +%35. (Burning Receipt gerekir)' },
  { id: 'venom_spread', name: 'Venom Spread', cat: 'elemental', max: 1, rarity: 'E', prereq: 'toxic_payment', desc: 'Zehirli düşman ölünce zehir en fazla 2 düşmana yayılır. (Toxic Payment gerekir)' },
  { id: 'corrosion', name: 'Corrosion', cat: 'elemental', max: 1, rarity: 'R', prereq: 'toxic_payment', desc: 'Zehirli hedefler +%15 hasar alır. (Toxic Payment gerekir)' },
  // ---- new defense (7) ----
  { id: 'heavy_armor', name: 'Heavy Armor', cat: 'defense', max: 2, rarity: 'C', desc: 'Kuryeye gelen hasar -%10 (seviye başına; toplam sınır %80).' },
  { id: 'first_aid_kit', name: 'First Aid Kit', cat: 'defense', max: 1, rarity: 'C', req: 'checkpoint', desc: 'Kontrol noktasında maks. HP\'nin %15\'i kadar ek iyileşme.' },
  { id: 'shock_absorber', name: 'Shock Absorber', cat: 'defense', max: 1, rarity: 'C', desc: 'Çarpma kaynaklı paket hasarı -%30.' },
  { id: 'insulated_box', name: 'Insulated Box', cat: 'defense', max: 1, rarity: 'C', req: 'thermal', desc: 'Sıcak/Soğuk paketlerde sıcaklık kaybı -%25.' },
  { id: 'cooling_system', name: 'Cooling System', cat: 'defense', max: 1, rarity: 'R', req: 'thermal', desc: 'Sıcak/Soğuk paketlerde ısı alışverişi -%25.' },
  { id: 'last_stand', name: 'Last Stand', cat: 'defense', max: 1, rarity: 'R', desc: 'Canın %25\'in altındayken alınan hasar ek -%20 (sınırlı).' },
  { id: 'package_repair', name: 'Package Repair', cat: 'defense', max: 1, rarity: 'C', req: 'checkpoint', desc: 'Kontrol noktasında paket maks. HP\'sinin %15\'i onarılır.' },
  // ---- new movement / delivery (7) ----
  { id: 'turbo_delivery', name: 'Turbo Delivery', cat: 'movement', max: 1, rarity: 'R', desc: '5 sn hasarsız ilerleyince 2 sn hız +%20 (10 sn bekleme).' },
  { id: 'quick_recovery', name: 'Quick Recovery', cat: 'movement', max: 1, rarity: 'C', desc: 'Yavaşlatma etkileri -%40.' },
  { id: 'smooth_rider', name: 'Smooth Rider', cat: 'movement', max: 1, rarity: 'C', req: 'fizzy', desc: 'Gazlı paketlerde basınç artışı -%30.' },
  { id: 'light_footprint', name: 'Light Footprint', cat: 'movement', max: 1, rarity: 'C', desc: 'Kaygan zeminde kontrol kaybı -%25.' },
  { id: 'time_extension', name: 'Time Extension', cat: 'movement', max: 1, rarity: 'E', desc: 'Teslimat süresine bir kez +8 sn.' },
  { id: 'checkpoint_boost', name: 'Checkpoint Boost', cat: 'movement', max: 1, rarity: 'C', req: 'checkpoint', desc: 'Kontrol noktasından sonra 5 sn hız +%20.' },
  { id: 'final_sprint', name: 'Final Sprint', cat: 'movement', max: 1, rarity: 'C', desc: 'Son teslimat bölümünde hız +%15.' },
  // ---- economy / utility (6) ----
  { id: 'golden_receipt', name: 'Golden Receipt', cat: 'economy', max: 1, rarity: 'R', desc: 'Başarılı teslimatta temel jeton +%15.' },
  { id: 'lucky_customer', name: 'Lucky Customer', cat: 'economy', max: 1, rarity: 'R', desc: 'Başarılı teslimatta %25 şansla temel jeton +%20.' },
  { id: 'fast_learner', name: 'Fast Learner', cat: 'economy', max: 1, rarity: 'R', desc: 'Bundan sonra kazanılan rota/savaş XP\'si +%15.' },
  { id: 'bonus_contract', name: 'Bonus Contract', cat: 'economy', max: 1, rarity: 'R', desc: '3★ süre hedefini tutturursan temel jeton +%20.' },
  { id: 'elite_bounty', name: 'Elite Bounty', cat: 'economy', max: 1, rarity: 'R', desc: 'Her elit için başarıda temel jeton +%5 (en fazla +%20).' },
  { id: 'second_choice', name: 'Second Choice', cat: 'economy', max: 1, rarity: 'L', desc: 'Bu teslimat için +1 ücretsiz yeniden seçim hakkı.' },
];
export const SKILL_BY_ID = {}; SKILLS.forEach(s => SKILL_BY_ID[s.id] = s);
export const BASE_ELEMENTS = SKILLS.filter(s => s.base).map(s => s.id);

/** 20 evolutions (Ek B3): both prerequisites at max rank, chosen once, a skill feeds at most one evolution. */
export const EVOLUTIONS = [
  { id: 'payment_storm', name: 'Payment Storm', a: 'double_order', b: 'rapid_payment', desc: 'Ek kartlar tam hasar verir, saldırı aralığı -%15.' },
  { id: 'infinity_receipt', name: 'Infinity Receipt', a: 'piercing_card', b: 'ricochet', desc: 'Kartlar 3 düşman deler ve 4 kez seker (sınırlı), hasar kaybı azalır.' },
  { id: 'perfect_transaction', name: 'Perfect Transaction', a: 'critical_receipt', b: 'precision_payment', desc: 'Kritik şansı +%15, kritik hasar +%75.' },
  { id: 'card_barrage', name: 'Card Barrage', a: 'diagonal_delivery', b: 'triple_transaction', desc: 'Çapraz salvo 4 karta çıkar; her 3. atış geniş yelpaze.' },
  { id: 'atomic_payment', name: 'Atomic Payment', a: 'explosive_card', b: 'overcharged_pos', desc: 'Her 5. atışın isabeti büyük patlama yapar (%150, zincirleme yok).' },
  { id: 'titan_breaker', name: 'Titan Breaker', a: 'boss_invoice', b: 'elite_collector', desc: 'Elit ve boss hasarı toplam +%60.' },
  { id: 'chain_reaction', name: 'Chain Reaction', a: 'electric_card', b: 'ricochet', desc: 'Her sekme sınırlı zincir yıldırım tetikler.' },
  { id: 'thunder_network', name: 'Thunder Network', a: 'static_charge', b: 'thunder_strike', desc: 'Yıldırım şansı %30, alan daha geniş, bekleme 1 sn.' },
  { id: 'absolute_zero', name: 'Absolute Zero', a: 'frozen_payment', b: 'piercing_card', desc: 'Delici kartlar hedefi %70 yavaşlatır (2.4 sn; boss direnci).' },
  { id: 'glacial_impact', name: 'Glacial Impact', a: 'frostbite', b: 'ice_shatter', desc: 'Yavaşlamış hedeflere +%45 hasar.' },
  { id: 'inferno_receipt', name: 'Inferno Receipt', a: 'burning_receipt', b: 'critical_receipt', desc: 'Kritik isabetler iki kat güçlü yanma uygular.' },
  { id: 'wildfire', name: 'Wildfire', a: 'flame_burst', b: 'heatwave', desc: 'Yanan düşmanlar alevi yakındaki bir düşmana yayar (sınırlı).' },
  { id: 'pandemic_payment', name: 'Pandemic Payment', a: 'toxic_payment', b: 'venom_spread', desc: 'Zehir ölümde 4 hedefe yayılır ve 6 sn sürer.' },
  { id: 'acid_transaction', name: 'Acid Transaction', a: 'corrosion', b: 'power_transaction', desc: 'İsabetler zırh aşındırır: yığın başına +%5 hasar (en fazla 5).' },
  { id: 'iron_courier', name: 'Iron Courier', a: 'reinforced_helmet', b: 'heavy_armor', desc: 'Maks. HP +40 ve hasar azaltma +%10 (sınırlı).' },
  { id: 'guardian_protocol', name: 'Guardian Protocol', a: 'emergency_shield', b: 'last_stand', desc: 'Kalkan 5 sn\'de dolar; can %35 altına inince 12 sn\'de bir anında dolar.' },
  { id: 'fortress_package', name: 'Fortress Package', a: 'protective_packaging', b: 'heat_resistant_bag', desc: 'Paket hasarı -%50, buhar paket hasarı -%75.' },
  { id: 'thermal_master', name: 'Thermal Master', a: 'insulated_box', b: 'cooling_system', desc: 'Sıcaklık kaybı ve ısı alışverişi -%60 (başarısızlık koşulu kalkmaz).' },
  { id: 'unstoppable_courier', name: 'Unstoppable Courier', a: 'express_courier', b: 'perfect_balance', desc: 'Hız +%15, geri tepme -%80, kayma kaybı çok azalır.' },
  { id: 'golden_route', name: 'Golden Route', a: 'golden_receipt', b: 'bonus_contract', desc: 'Başarıda temel jeton +%45 (sınırlı).' },
];
export const EVO_BY_ID = {}; EVOLUTIONS.forEach(e => EVO_BY_ID[e.id] = e);
/** Utility fallback offered only when no valid skill/evolution remains (never a fake choice). */
export const FALLBACK = { id: 'field_repair', name: 'Field Repair', cat: 'utility', desc: 'Kurye HP\'si %20, paket HP\'si %10 onarılır.' };
