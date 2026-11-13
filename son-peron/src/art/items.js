// 16×16 eşya ikonları: 23 gıda, 5 kaynak, 5 tohum, 15 yemek, 6 içecek, aletler. Hepsi özgün ve prosedürel.
import { Px, P } from './px.js';

const O = P.ink;
const fin = (p) => p.outline(O);
function sack(m, l, d, mark) { const p = new Px(16, 16); p.blob(8, 10, 5, 4, m, l, d); p.rect(6, 3, 4, 3, m); p.hline(5, 6, 6, d); p.set(6, 3, l); p.rect(7, 2, 2, 1, d); if (mark) { p.rect(6, 9, 4, 3, mark); p.set(7, 10, l); } return fin(p); }
function bottle(liq, liqL, cap) { const p = new Px(16, 16); p.rect(7, 2, 2, 3, cap); p.rect(6, 5, 4, 2, '#cfe4ea'); p.box(5, 7, 6, 7, liq, liqL, null); p.rect(5, 7, 6, 1, '#dff0f4'); p.rect(6, 10, 4, 2, P.white); p.set(7, 11, liq); p.vline(6, 8, 5, liqL); return fin(p); }
function bowl(c, cl, garnish = []) { const p = new Px(16, 16); p.blob(8, 9, 6, 4, P.cream, P.white, P.paperD); p.rect(2, 6, 12, 3, P.cream); p.ellipse(8, 7, 5, 2, c); p.hline(5, 6, 4, cl); garnish.forEach((g, i) => { p.set(6 + i * 2, 7 + (i % 2), g); p.set(7 + i * 2, 6 + (i % 2), g); }); p.hline(5, 13, 6, P.paperD); return fin(p); }
function plate(draw) { const p = new Px(16, 16); p.ellipse(8, 10, 7, 4, P.white); p.ellipse(8, 10, 5, 3, P.cream); p.hline(3, 13, 10, P.grayL); draw(p); return fin(p); }
function glass(liq, liqL, extra) { const p = new Px(16, 16); p.rect(5, 4, 6, 9, '#dff0f4'); p.rect(6, 6, 4, 6, liq); p.vline(6, 6, 6, liqL); p.hline(5, 13, 6, '#b9d3da'); if (extra) extra(p); return fin(p); }

const ING = {
  potato: () => { const p = new Px(16, 16); p.blob(8, 9, 5, 4, '#c79a5e', '#dcb47c', '#9c7440'); p.blob(11, 6, 2, 2, '#c79a5e', '#dcb47c', '#9c7440'); p.set(6, 8, '#7d5a30'); p.set(9, 11, '#7d5a30'); p.set(10, 8, '#7d5a30'); return fin(p); },
  carrot: () => { const p = new Px(16, 16); for (let i = 0; i < 9; i++) { const w = 1 + ((9 - i) / 3 | 0); p.rect(4 + i - (w >> 1) + 1, 13 - i - (w >> 1), w, w, i % 3 === 0 ? '#c96f22' : P.orange); } p.line(11, 5, 13, 2, P.green); p.line(12, 5, 14, 4, P.greenD); p.line(10, 4, 10, 1, P.greenL); p.set(5, 12, '#f2a65a'); return fin(p); },
  onion: () => { const p = new Px(16, 16); p.blob(8, 10, 5, 4, '#e2c08a', '#f2dcae', '#b8935c'); p.rect(7, 4, 2, 3, '#e2c08a'); p.line(8, 4, 9, 1, P.greenL); p.vline(8, 7, 6, '#c9a56e'); p.vline(5, 8, 4, '#f2dcae'); return fin(p); },
  tomato: () => { const p = new Px(16, 16); p.blob(8, 9, 5, 5, P.red, '#e5675a', P.redD); p.rect(7, 4, 3, 1, P.greenD); p.set(8, 3, P.green); p.set(6, 5, P.green); p.set(10, 5, P.green); p.set(6, 7, '#f29a8d'); return fin(p); },
  pepper: () => { const p = new Px(16, 16); p.blob(8, 9, 4, 5, P.green, P.greenL, P.greenD); p.blob(6, 12, 2, 2, P.green, P.greenL, P.greenD); p.rect(8, 2, 2, 3, P.greenDD); p.vline(6, 6, 4, '#b7e08c'); return fin(p); },
  flour: () => sack(P.cream, P.white, P.paperD, '#b08a60'),
  lentil: () => { const p = sack('#c9a56e', '#dcc08f', '#a08052'); p.rect(5, 2, 6, 2, '#d9702e'); p.speckle(5, 1, 6, 3, ['#e89a4e', '#b85a22'], 0.5, 3); return p; },
  rice: () => { const p = sack('#e9e1d0', P.white, '#c4baa4', '#4f8fc0'); p.speckle(5, 1, 6, 2, [P.white], 0.6, 4); return p; },
  pasta: () => { const p = new Px(16, 16); for (let i = 0; i < 6; i++) p.line(4 + i, 3, 6 + i, 13, i % 2 ? '#e9c35a' : '#f3d77a'); p.rect(4, 7, 8, 2, P.red); p.hline(4, 7, 8, '#e5675a'); return fin(p); },
  egg: () => { const p = new Px(16, 16); p.blob(8, 9, 4, 5, '#f4ead6', P.white, '#d2c3a3'); p.blob(8, 7, 3, 3, '#f4ead6', P.white, null); return fin(p); },
  milk: () => bottle(P.white, P.white, P.blue),
  butter: () => { const p = new Px(16, 16); p.ellipse(8, 12, 6, 2, P.grayL); p.box(4, 7, 8, 5, P.yellow, '#f8e58e', '#c9a53a'); p.rect(4, 5, 8, 2, '#f8e58e'); p.hline(4, 7, 8, '#d9b84a'); return fin(p); },
  sugar: () => { const p = new Px(16, 16); p.box(3, 8, 5, 5, P.white, P.white, P.grayL); p.box(8, 8, 5, 5, '#f1f1ec', P.white, P.grayL); p.box(6, 4, 5, 5, P.white, P.white, P.grayL); return fin(p); },
  salt: () => { const p = new Px(16, 16); p.box(5, 6, 6, 8, '#dff0f4', P.white, '#b9d3da'); p.rect(6, 9, 4, 4, P.white); p.box(5, 3, 6, 3, P.metal, P.metalL, P.metalD); p.set(7, 4, P.iron); p.set(9, 4, P.iron); return fin(p); },
  chicken: () => { const p = new Px(16, 16); p.blob(7, 7, 4, 4, '#e0a25c', '#f0be7c', '#b57a3a'); p.line(9, 10, 12, 13, P.cream); p.line(10, 10, 13, 13, P.cream); p.rect(12, 12, 2, 2, P.white); return fin(p); },
  minced_meat: () => { const p = new Px(16, 16); p.rect(3, 10, 10, 4, P.paper); p.blob(8, 8, 5, 3, '#c9605a', '#e08a80', '#9a403c'); p.speckle(4, 6, 9, 5, ['#e9a59c', '#a84a44'], 0.3, 9); return fin(p); },
  beef: () => { const p = new Px(16, 16); p.blob(8, 9, 6, 4, '#b3413c', '#cf625a', '#872c2a'); p.line(4, 8, 8, 6, P.cream); p.line(8, 6, 11, 8, P.cream); p.blob(11, 11, 1, 1, P.white, P.white, P.grayL); return fin(p); },
  fish: () => { const p = new Px(16, 16); p.blob(7, 9, 5, 3, '#6fa3c9', '#a9cfe6', '#44749a'); p.rect(12, 7, 1, 5, '#44749a'); p.rect(13, 6, 1, 7, '#6fa3c9'); p.set(4, 8, O); p.hline(5, 11, 5, P.white); p.line(7, 6, 9, 5, '#44749a'); return fin(p); },
  apple: () => { const p = new Px(16, 16); p.blob(8, 9, 5, 5, P.red, '#e87868', P.redD); p.vline(8, 2, 3, P.woodD); p.rect(9, 3, 3, 2, P.green); p.set(6, 7, '#f6b0a3'); p.set(8, 5, P.redD); return fin(p); },
  mushroom: () => { const p = new Px(16, 16); p.rect(7, 9, 3, 5, P.cream); p.vline(9, 9, 5, P.paperD); p.blob(8, 7, 6, 3, '#b8693f', '#d48a5a', '#8a4826'); p.rect(2, 8, 13, 2, '#b8693f'); p.set(6, 6, P.cream); p.set(10, 5, P.cream); p.hline(3, 10, 11, P.paper); return fin(p); },
  wild_berries: () => { const p = new Px(16, 16); for (const [x, y] of [[6, 8], [10, 8], [8, 11], [5, 12], [11, 12], [8, 6]]) p.blob(x, y, 2, 2, P.purple, '#b48ad0', '#5f3d78'); p.rect(7, 2, 4, 2, P.green); p.set(8, 4, P.greenD); return fin(p); },
  tea_leaves: () => { const p = new Px(16, 16); p.box(4, 6, 8, 8, P.maroon, '#a34858', '#55202a'); p.rect(4, 4, 8, 2, P.gold); p.rect(6, 8, 4, 4, P.cream); p.line(7, 11, 9, 9, P.greenD); p.set(7, 9, P.green); return fin(p); },
  coffee_beans: () => { const p = sack('#8a6a45', '#a8845a', '#63492e'); for (const [x, y] of [[6, 2], [9, 3], [7, 4]]) { p.blob(x, y, 1, 1, '#4a2f1d', '#6b4630', null); } p.rect(6, 9, 4, 3, '#4a2f1d'); p.set(8, 10, '#8a6a45'); return p; },
  wood: () => { const p = new Px(16, 16); for (const y of [5, 10]) { p.box(2, y, 11, 4, P.wood, P.woodL, P.woodD); p.blob(13, y + 1, 1, 2, P.woodL, '#f0c58e', P.wood); p.hline(4, y + 2, 6, P.woodD); } return fin(p); },
  stone: () => { const p = new Px(16, 16); p.blob(6, 10, 4, 3, P.stone, P.stoneL, P.stoneD); p.blob(11, 9, 3, 4, '#a39c90', '#c7c1b4', P.stoneD); p.blob(8, 6, 3, 2, P.stoneL, '#d6d0c3', P.stone); return fin(p); },
  metal_part: () => { const p = new Px(16, 16); p.blob(8, 8, 5, 5, P.metal, P.metalL, P.metalD); for (const [x, y] of [[8, 2], [8, 14], [2, 8], [14, 8], [4, 4], [12, 4], [4, 12], [12, 12]]) p.rect(x - 1, y - 1, 2, 2, P.metal); p.blob(8, 8, 2, 2, P.iron, P.metalD, P.ink); return fin(p); },
  fabric: () => { const p = new Px(16, 16); p.box(3, 5, 10, 8, P.teal, '#77c4bb', '#2e6f69'); p.blob(3, 9, 1, 4, '#77c4bb', P.white, P.teal); p.hline(5, 8, 7, '#2e6f69'); p.hline(5, 11, 7, '#2e6f69'); p.rect(11, 12, 3, 2, P.teal); return fin(p); },
  glass: () => { const p = new Px(16, 16); p.box(3, 3, 10, 10, '#b9dbe6', '#e3f3f7', '#86b4c2'); p.line(5, 9, 9, 5, P.white); p.line(8, 11, 11, 8, P.white); return fin(p); }
};
const SEED_MARK = { potato_seed: '#c79a5e', carrot_seed: P.orange, onion_seed: '#e2c08a', tomato_seed: P.red, pepper_seed: P.green };
function seed(id) { const p = new Px(16, 16); p.box(4, 3, 8, 11, P.paper, P.cream, P.paperD); p.rect(4, 3, 8, 2, P.greenD); p.blob(8, 9, 2, 2, SEED_MARK[id], P.white, null); p.set(8, 6, P.green); p.set(9, 5, P.green); return fin(p); }

const FOOD = {
  vegetable_soup: () => bowl('#d98a3c', '#f0b56a', [P.orange, P.greenL, '#f2dcae']),
  boiled_potatoes: () => plate((p) => { p.blob(6, 8, 2, 2, '#e9cf8a', '#f6e6b4', '#bfa25c'); p.blob(10, 8, 2, 2, '#e9cf8a', '#f6e6b4', '#bfa25c'); p.blob(8, 10, 2, 2, '#e9cf8a', '#f6e6b4', '#bfa25c'); p.set(8, 7, P.green); }),
  fried_bread: () => plate((p) => { p.box(4, 6, 6, 4, '#d9a03c', '#f0c468', '#a87425'); p.box(7, 8, 6, 4, '#c98e30', '#e8b858', '#946320'); }),
  lentil_soup: () => bowl('#d9702e', '#ee9550', [P.yellow, P.redD]),
  omelet: () => plate((p) => { p.blob(8, 9, 5, 2, P.yellow, '#f8e58e', '#c9a53a'); p.set(6, 9, P.greenL); p.set(10, 8, P.red); }),
  vegetable_rice: () => plate((p) => { p.blob(8, 8, 4, 3, '#f4ead6', P.white, '#d2c3a3'); p.set(6, 8, P.orange); p.set(9, 7, P.green); p.set(10, 9, P.orange); p.set(7, 10, P.green); }),
  baked_potato: () => plate((p) => { p.blob(8, 9, 4, 3, '#a8733f', '#c9955a', '#7a4f26'); p.rect(6, 7, 5, 2, P.yellow); p.set(8, 7, P.white); }),
  tomato_pasta: () => plate((p) => { p.blob(8, 9, 5, 3, '#f0d27a', '#f8e6a4', '#c9a84a'); p.blob(8, 8, 2, 1, P.red, '#e5675a', P.redD); p.set(10, 10, P.green); p.line(4, 10, 7, 11, '#c9a84a'); }),
  chicken_stew: () => bowl('#b8693f', '#d48a5a', ['#f0be7c', P.orange, '#e9cf8a']),
  meatballs: () => plate((p) => { for (const [x, y] of [[6, 8], [9, 8], [8, 10], [11, 10]]) p.blob(x, y, 1, 1, '#7a4a2a', '#9c6840', '#52301a'); p.rect(4, 10, 3, 2, P.greenL); }),
  apple_pie: () => { const p = new Px(16, 16); p.blob(8, 10, 7, 3, '#c98e30', '#e8b858', '#946320'); p.blob(8, 8, 5, 2, '#e8b858', '#f6d98a', '#c98e30'); p.line(5, 8, 11, 8, '#946320'); p.line(8, 6, 8, 10, '#946320'); p.set(8, 8, P.red); return fin(p); },
  mushroom_rice: () => plate((p) => { p.blob(8, 8, 4, 3, '#f4ead6', P.white, '#d2c3a3'); p.blob(6, 8, 1, 1, '#b8693f', '#d48a5a', null); p.blob(10, 9, 1, 1, '#b8693f', '#d48a5a', null); p.set(8, 7, P.greenD); }),
  fried_fish: () => plate((p) => { p.blob(7, 9, 4, 2, '#d9a03c', '#f0c468', '#a87425'); p.rect(11, 8, 2, 3, '#a87425'); p.set(4, 9, P.ink); p.rect(10, 11, 3, 1, P.yellow); }),
  station_kebab: () => plate((p) => { p.line(3, 11, 13, 7, P.woodD); for (const [x, y, c] of [[5, 10, '#8a4a2a'], [7, 9, P.green], [9, 8, '#8a4a2a'], [11, 8, P.red]]) p.blob(x, y, 1, 1, c, null, null); }),
  night_stew: () => { const p = new Px(16, 16); p.box(3, 7, 10, 7, '#7a4a35', '#9a6248', '#553021'); p.rect(2, 8, 1, 2, '#553021'); p.rect(13, 8, 1, 2, '#553021'); p.ellipse(8, 7, 4, 1, '#8e2c2c'); p.set(7, 7, '#e9cf8a'); p.set(9, 7, '#b8693f'); p.set(8, 4, P.grayL); p.set(9, 3, P.white); p.set(7, 2, P.grayL); return fin(p); }
};
const DRINK = {
  bottled_juice: () => bottle(P.orange, '#f2b06a', P.greenD),
  bottled_lemonade: () => bottle(P.yellow, '#f8e58e', P.blueD),
  tea: () => { const p = new Px(16, 16); p.ellipse(8, 13, 5, 1, P.white); p.rect(6, 4, 4, 2, '#dff0f4'); p.rect(7, 6, 2, 2, '#b3413c'); p.rect(6, 8, 4, 4, '#b3413c'); p.rect(6, 5, 4, 1, '#b3413c'); p.vline(6, 8, 3, '#d9655a'); p.hline(5, 12, 6, P.grayL); return fin(p); },
  coffee: () => { const p = new Px(16, 16); p.ellipse(8, 13, 6, 1, P.white); p.box(4, 6, 7, 6, P.white, P.white, P.grayL); p.rect(5, 6, 5, 2, '#4a2f1d'); p.rect(11, 7, 2, 1, P.white); p.rect(12, 8, 1, 2, P.white); p.rect(11, 10, 2, 1, P.white); p.set(7, 3, P.grayL); p.set(8, 2, P.grayL); return fin(p); },
  apple_juice: () => glass('#d9cf5a', '#eee58e', (p) => { p.blob(11, 4, 2, 2, P.red, '#e87868', P.redD); }),
  berry_juice: () => glass(P.purple, '#b48ad0', (p) => { p.blob(11, 4, 1, 1, '#5f3d78', P.purple, null); p.rect(8, 2, 1, 5, P.red); })
};
const TOOL = {
  axe: () => { const p = new Px(16, 16); p.line(4, 13, 11, 4, P.wood); p.line(5, 13, 12, 4, P.woodD); p.box(9, 2, 5, 5, P.metal, P.metalL, P.metalD); p.rect(13, 3, 1, 3, P.metalL); return fin(p); },
  pickaxe: () => { const p = new Px(16, 16); p.line(4, 13, 10, 5, P.wood); p.line(5, 13, 11, 5, P.woodD); p.line(5, 5, 9, 3, P.metal); p.line(9, 3, 14, 6, P.metal); p.line(5, 6, 9, 4, P.metalD); p.line(9, 4, 13, 7, P.metalD); return fin(p); },
  hoe: () => { const p = new Px(16, 16); p.line(3, 13, 11, 3, P.wood); p.line(4, 13, 12, 3, P.woodD); p.box(10, 2, 4, 2, P.metal, P.metalL, P.metalD); p.rect(13, 3, 1, 4, P.metal); return fin(p); },
  watering_can: () => { const p = new Px(16, 16); p.box(4, 7, 7, 6, P.teal, '#77c4bb', '#2e6f69'); p.line(11, 9, 14, 6, P.teal); p.rect(13, 5, 2, 2, '#2e6f69'); p.frame(5, 3, 5, 5, '#2e6f69'); p.rect(6, 4, 3, 3, null); p.clear(6, 4); p.clear(7, 4); p.clear(8, 4); p.clear(6, 5); p.clear(7, 5); p.clear(8, 5); p.clear(6, 6); p.clear(7, 6); p.clear(8, 6); return fin(p); },
  fishing_rod: () => { const p = new Px(16, 16); p.line(3, 13, 12, 2, P.wood); p.line(12, 2, 13, 10, P.grayL); p.rect(12, 10, 2, 2, P.red); p.rect(4, 11, 2, 2, P.metal); return fin(p); },
  serving_tray: () => { const p = new Px(16, 16); p.ellipse(8, 9, 7, 4, P.wood); p.ellipse(8, 8, 6, 3, P.woodL); p.ellipse(8, 8, 4, 2, P.wood); return fin(p); },
  advanced_tray: () => { const p = new Px(16, 16); p.ellipse(8, 9, 7, 4, P.metalD); p.ellipse(8, 8, 6, 3, P.metalL); p.ellipse(8, 8, 4, 2, P.metal); p.rect(1, 8, 1, 2, P.gold); p.rect(14, 8, 1, 2, P.gold); return fin(p); }
};
export const ITEM_PAINTERS = { ...ING, ...FOOD, ...DRINK, ...TOOL, ...Object.fromEntries(Object.keys(SEED_MARK).map((id) => [id, () => seed(id)])) };
export function itemIcon(id) { const f = ITEM_PAINTERS[id]; return f ? f() : null; }
// Dünya içi küçük taşıma görselleri
export function potSprite(color) { const p = new Px(16, 16); p.box(3, 6, 10, 7, P.metalD, P.metal, P.iron); p.rect(1, 7, 2, 2, P.iron); p.rect(13, 7, 2, 2, P.iron); p.ellipse(8, 6, 4, 1, color || '#d98a3c'); p.hline(4, 5, 8, P.metalL); return fin(p); }
