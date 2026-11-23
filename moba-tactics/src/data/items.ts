export type CompCode = 'F' | 'H' | 'B' | 'R' | 'Z' | 'C' | 'G' | 'M';

export interface StatBlock {
  ad?: number; ap?: number; as?: number; cdr?: number; armor?: number; mr?: number; hp?: number; ms?: number;
  armorPen?: number; mrPen?: number; lifesteal?: number;
}

export interface ComponentDef { code: CompCode; name: string; price: number; stats: StatBlock; desc: string }
export const COMPONENTS: Record<CompCode, ComponentDef> = {
  F: { code: 'F', name: 'Keskin Uç', price: 180, stats: { ad: 8 }, desc: '+8 fiziksel saldırı' },
  H: { code: 'H', name: 'Hız Tılsımı', price: 160, stats: { as: 0.08 }, desc: '+%8 saldırı hızı' },
  B: { code: 'B', name: 'Büyü Kıvılcımı', price: 180, stats: { ap: 12 }, desc: '+12 büyü gücü' },
  R: { code: 'R', name: 'Ruh Küresi', price: 170, stats: { cdr: 0.06 }, desc: '+%6 bekleme süresi azaltımı' },
  Z: { code: 'Z', name: 'Çelik Levha', price: 170, stats: { armor: 12 }, desc: '+12 zırh' },
  C: { code: 'C', name: 'Can Cevheri', price: 180, stats: { hp: 110 }, desc: '+110 can' },
  G: { code: 'G', name: 'Gölge Botu', price: 160, stats: { ms: 0.07 }, desc: '+%7 hareket hızı' },
  M: { code: 'M', name: 'Mistik Deri', price: 170, stats: { mr: 12 }, desc: '+12 büyü direnci' },
};
export const COMP_CODES: CompCode[] = ['F', 'H', 'B', 'R', 'Z', 'C', 'G', 'M'];

export interface ItemDef { id: number; name: string; recipe: [CompCode, CompCode]; price: number; stats: StatBlock; passive: string; tags: string[] }

export const ITEMS: ItemDef[] = [
  { id: 1, name: 'Keskin Pençe', recipe: ['F', 'F'], price: 600, stats: { ad: 30 }, passive: 'Her 3. normal saldırı +24 fiziksel hasar.', tags: ['ad'] },
  { id: 2, name: 'Rüzgâr Yayı', recipe: ['H', 'H'], price: 550, stats: { as: 0.27 }, passive: 'Her 4. normal saldırı bir yeteneğin kalan bekleme süresini 0,6 sn azaltır.', tags: ['as'] },
  { id: 3, name: 'Kırık Mızrak', recipe: ['F', 'G'], price: 630, stats: { ad: 24, armorPen: 0.14 }, passive: '%14 zırh delme.', tags: ['ad', 'pen'] },
  { id: 4, name: 'Kan Çeliği', recipe: ['F', 'C'], price: 650, stats: { ad: 22, lifesteal: 0.1 }, passive: '%10 normal saldırı can çalma (minyonlarda yarı).', tags: ['ad', 'sustain'] },
  { id: 5, name: 'Yıldız Asası', recipe: ['B', 'B'], price: 630, stats: { ap: 55 }, passive: 'Aynı hedefe 5 sn içinde iki farklı yetenek +30 büyü hasarı (hedef başına 8 sn).', tags: ['ap'] },
  { id: 6, name: 'Kor Mührü', recipe: ['B', 'R'], price: 600, stats: { ap: 34, cdr: 0.06 }, passive: 'Yetenek isabeti 3 sn boyunca hedefin maks. canının %3\'ü kadar büyü hasarı.', tags: ['ap'] },
  { id: 7, name: 'Boşluk Merceği', recipe: ['B', 'M'], price: 620, stats: { ap: 38, mrPen: 0.15 }, passive: '%15 büyü direnci delme.', tags: ['ap', 'pen'] },
  { id: 8, name: 'Ayaz Tacı', recipe: ['B', 'Z'], price: 600, stats: { ap: 30, armor: 18 }, passive: 'Yetenek isabeti 1,2 sn %15 yavaşlatır (hedef başına 5 sn).', tags: ['ap', 'def'] },
  { id: 9, name: 'Sur Plakası', recipe: ['Z', 'C'], price: 650, stats: { armor: 32, hp: 190 }, passive: 'Rakip şampiyon normal saldırı hasarı %8 azalır.', tags: ['def'] },
  { id: 10, name: 'Ejder Pulu', recipe: ['M', 'C'], price: 650, stats: { mr: 32, hp: 190 }, passive: 'Rakip şampiyon büyü hasarı %8 azalır.', tags: ['def'] },
  { id: 11, name: 'Dev Yüreği', recipe: ['C', 'C'], price: 660, stats: { hp: 400 }, passive: 'Savaş dışında 5 sn sonra saniyede maks. canın %1\'i yenilenir.', tags: ['def'] },
  { id: 12, name: 'Son Siper', recipe: ['Z', 'M'], price: 660, stats: { armor: 22, mr: 22 }, passive: 'Can %30 altına düşünce 3 sn maks. canın %18\'i kalkan (75 sn).', tags: ['def'] },
  { id: 13, name: 'İz Sürücü Çizmesi', recipe: ['G', 'G'], price: 540, stats: {}, passive: 'Savaş dışında %16, savaşta %6 hareket hızı.', tags: ['ms'] },
  { id: 14, name: 'Savaş Ruhu', recipe: ['F', 'R'], price: 610, stats: { ad: 20, cdr: 0.06 }, passive: 'Öldürme/asist sonrası maks. canın %9\'u yenilenir (15 sn).', tags: ['ad'] },
  { id: 15, name: 'Tetik Bileziği', recipe: ['H', 'R'], price: 590, stats: { as: 0.17, cdr: 0.06 }, passive: 'Yetenek sonrası ilk normal saldırı +28 fiziksel hasar.', tags: ['as'] },
  { id: 16, name: 'Temkin Mantosu', recipe: ['G', 'M'], price: 580, stats: { mr: 20, ms: 0.09 }, passive: 'Savaş dışında 5 sn sonra saniyede %1,5 maks. can yenilenir.', tags: ['def', 'ms'] },
  { id: 17, name: 'Sönük Zincir', recipe: ['F', 'H'], price: 620, stats: { ad: 20, as: 0.12 }, passive: 'Normal saldırılar 3 sn %35 iyileştirme azaltma uygular.', tags: ['ad', 'anti-heal'] },
  { id: 18, name: 'Solgun Mühür', recipe: ['B', 'C'], price: 620, stats: { ap: 32, hp: 125 }, passive: 'Yetenekler 3 sn %35 iyileştirme azaltma uygular.', tags: ['ap', 'anti-heal'] },
  { id: 19, name: 'Kalkan Kırıcı', recipe: ['F', 'M'], price: 640, stats: { ad: 25, mr: 15 }, passive: 'Normal saldırılar kalkanlara %40 ekstra hasar verir.', tags: ['ad', 'anti-shield'] },
  { id: 20, name: 'Delici Mühür', recipe: ['B', 'R'], price: 640, stats: { ap: 35, cdr: 0.06 }, passive: 'Yetenek isabeti 3 sn %12 büyü direnci azaltır.', tags: ['ap', 'pen'] },
  { id: 21, name: 'Ruh Bağı', recipe: ['R', 'C'], price: 650, stats: { hp: 220, cdr: 0.06 }, passive: 'Çağrılan canlı/ölümsüz yaratıklar +%15 hasar, +%12 can.', tags: ['summon'] },
  { id: 22, name: 'Rün Çekirdeği', recipe: ['B', 'Z'], price: 650, stats: { ap: 34, armor: 18 }, passive: 'Çağrılan büyülü yapılar +%15 hasar ve can.', tags: ['summon', 'ap'] },
  { id: 23, name: 'Kuşatma Tokmağı', recipe: ['F', 'Z'], price: 670, stats: { ad: 25, armor: 20 }, passive: 'Dost minyon kule menzilindeyken kuleye verilen hasar +%15.', tags: ['ad', 'siege'] },
  { id: 24, name: 'Orman Pusulası', recipe: ['H', 'G'], price: 570, stats: { as: 0.15, ms: 0.08 }, passive: 'Orman kamplarına +%20, büyük bosslara +%8 hasar.', tags: ['jungle'] },
];
export const ITEM_BY_ID: Record<number, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const combineFee = (it: ItemDef) => it.price - COMPONENTS[it.recipe[0]].price - COMPONENTS[it.recipe[1]].price;
