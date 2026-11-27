// data/cosmetics.js — the 6 original courier skins (Master Prompt §9; GDevelop GARAGE_M21_SHOP_SKINS_V8, index 0–5).
// Visual only: same hitbox / physics / stats. `asset` / `icon` are the original GDevelop resource paths
// (not included in the package -> procedural fallback palette `c` is drawn until the bitmaps are supplied).
export const COSMETICS = [
  { id: 'SKIN_DEFAULT',   index: 0, name: 'Default',    price: 0,    asset: 'PlayerYeni3.png',             icon: 'PlayerYeni4.png',
    c: { jacket: '#e2553f', jacket2: '#a83526', helmet: '#f4c542', helmet2: '#c9952a', bag: '#f08a2c', bag2: '#b5601a', trim: '#fff1dc', pants: '#3b3f58', moto: '#3b82c4', moto2: '#24578a' } },
  { id: 'SKIN_COFFEE',    index: 1, name: 'Coffee',     price: 500,  asset: 'batch/b2/Coffee.png',         icon: 'Coffee5.png',
    c: { jacket: '#7b4a2e', jacket2: '#55301b', helmet: '#f1e3c8', helmet2: '#c9b48e', bag: '#c58b52', bag2: '#8a5a2e', trim: '#ffe9c0', pants: '#2e2620', moto: '#d2b48c', moto2: '#8a6a44' } },
  { id: 'SKIN_FARMER',    index: 2, name: 'Farmer',     price: 750,  asset: 'batch/b2/farmer.png',         icon: 'farmer3.png',
    c: { jacket: '#4f8f3a', jacket2: '#356127', helmet: '#e8c66a', helmet2: '#b8953a', bag: '#a8743a', bag2: '#704b22', trim: '#f6e7b4', pants: '#3a5f8f', moto: '#c94f2c', moto2: '#8a2f17' } },
  { id: 'SKIN_HAZARDOUS', index: 3, name: 'Hazardous',  price: 1000, asset: 'batch/b2/Hazardous.png',      icon: 'Hazardous3.png',
    c: { jacket: '#f5c518', jacket2: '#b8900a', helmet: '#2b2f3a', helmet2: '#14161c', bag: '#ff7a1a', bag2: '#b5520c', trim: '#2b2f3a', pants: '#2b2f3a', moto: '#f5c518', moto2: '#2b2f3a' } },
  { id: 'SKIN_MONSTERTR', index: 4, name: 'MonsterTR',  price: 1250, asset: 'batch/b2/monstertrainer.png', icon: 'monstertrainer3.png',
    c: { jacket: '#e23b3b', jacket2: '#a01f1f', helmet: '#fff6ea', helmet2: '#c8c0b0', bag: '#3b6fd6', bag2: '#244a99', trim: '#fff6ea', pants: '#2b2f3a', moto: '#e23b3b', moto2: '#2b2f3a' } },
  { id: 'SKIN_NEON',      index: 5, name: 'Neon',       price: 1500, asset: 'batch/b2/Neon.png',           icon: 'Neon3.png',
    c: { jacket: '#2a1f5c', jacket2: '#160f3a', helmet: '#4df2ff', helmet2: '#18a8c0', bag: '#ff3fd2', bag2: '#a8188a', trim: '#4df2ff', pants: '#160f3a', moto: '#ff3fd2', moto2: '#4df2ff' } },
];
export const SKIN_IDS = COSMETICS.map(c => c.id);
export const DEFAULT_SKIN = 'SKIN_DEFAULT';
/** Legacy HTML5 temporary skins: no meaningful 1:1 mapping exists. `classic` -> default; purchased others are
 *  refunded once at their original price (recorded in the save as legacy history). */
export const LEGACY_SKINS = { classic: { to: 'SKIN_DEFAULT', price: 0 }, mint: { price: 300 }, barista: { price: 350 }, midnight: { price: 450 }, golden: { price: 700 } };
