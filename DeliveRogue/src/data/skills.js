// data/skills.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).

/** 20 run skills. Effects are computed in SkillMgr.compute() from the picked list. */
export const SKILLS = [
  { id: 'double_order', name: 'Double Order', cat: 'attack', max: 2, desc: 'Ek bir ödeme kartı fırlatır (%60 hasar). 2 kez alınabilir.' },
  { id: 'rapid_payment', name: 'Rapid Payment', cat: 'attack', max: 2, desc: 'Saldırı hızı +%25. 2 kez alınabilir.' },
  { id: 'piercing_card', name: 'Piercing Card', cat: 'attack', max: 1, desc: 'Kartlar 1 ek düşmanı deler (delme sonrası %65 hasar).' },
  { id: 'ricochet', name: 'Ricochet', cat: 'attack', max: 1, desc: 'Kartlar yakındaki en fazla 2 düşmana seker (her sekmede %70 hasar).' },
  { id: 'critical_receipt', name: 'Critical Receipt', cat: 'attack', max: 2, desc: 'Kritik şansı +%15 ve kritik hasar +%50.' },
  { id: 'diagonal_delivery', name: 'Diagonal Delivery', cat: 'attack', max: 1, desc: 'Her atışa iki çapraz kart ekler (%50 hasar).' },
  { id: 'electric_card', name: 'Electric Card', cat: 'elemental', max: 1, desc: 'İsabetlerin %35\'i yakındaki 2 düşmana zincir yıldırım sıçratır (%45 hasar).' },
  { id: 'frozen_payment', name: 'Frozen Payment', cat: 'elemental', max: 1, desc: 'İsabet alan düşmanlar 1.6 sn boyunca %45 yavaşlar.' },
  { id: 'burning_receipt', name: 'Burning Receipt', cat: 'elemental', max: 1, desc: 'İsabetler 2 sn yakar (toplam isabet hasarının %80\'i).' },
  { id: 'toxic_payment', name: 'Toxic Payment', cat: 'elemental', max: 1, desc: 'İsabetler 4 sn zehirler (toplam isabet hasarının %120\'si).' },
  { id: 'reinforced_helmet', name: 'Reinforced Helmet', cat: 'defense', max: 2, desc: 'Bu teslimat için maks. HP +25 ve anında +25 HP.' },
  { id: 'emergency_shield', name: 'Emergency Shield', cat: 'defense', max: 1, desc: 'Her 8 sn\'de dolan kalkan, gelen bir darbeyi tamamen engeller.' },
  { id: 'cashback', name: 'Cashback', cat: 'defense', max: 1, desc: 'Düşman yenince %25 şansla 6 HP iyileşirsin.' },
  { id: 'protective_packaging', name: 'Protective Packaging', cat: 'defense', max: 1, desc: 'Pakete gelen tüm hasar -%30.' },
  { id: 'heat_resistant_bag', name: 'Heat Resistant Bag', cat: 'defense', max: 1, desc: 'Buhar kaynaklı paket hasarı -%60.' },
  { id: 'express_courier', name: 'Express Courier', cat: 'movement', max: 2, desc: 'Hareket hızı +%10. 2 kez alınabilir.' },
  { id: 'emergency_brake', name: 'Emergency Brake', cat: 'movement', max: 1, desc: 'Kaygan zeminde kontrol kaybı -%75.' },
  { id: 'last_minute', name: 'Last Minute', cat: 'movement', max: 1, desc: 'Kalan süre %30\'un altına düşünce hareket hızı +%25.' },
  { id: 'shortcut_expert', name: 'Shortcut Expert', cat: 'movement', max: 1, desc: 'Teslimat rotası yönünde ilerlerken hareket hızı +%14.' },
  { id: 'perfect_balance', name: 'Perfect Balance', cat: 'movement', max: 1, desc: 'Geri tepme -%60, kayma -%40, çarpma kaynaklı paket hasarı -%50.' },
];
export const SKILL_BY_ID = {}; SKILLS.forEach(s => SKILL_BY_ID[s.id] = s);
