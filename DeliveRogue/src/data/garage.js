// data/garage.js — 8 categories × 20 levels, linear stats only (Master Prompt §9). Price = round(base × 1.20^level).
// Effects (per level): motor +0.75 % speed, helmet +2 % max HP, jacket 1 pt damage reduction, pos +2.5 % card
// damage, bag +2 % max package HP, tires 2 pt less slip, brakes 2 pt less impact package damage, battery +1.5 %
// attack frequency (interval = base / frequencyMultiplier). All equipment is available from the start.
const pct = (v, d = 1) => (v * 100).toFixed(d).replace(/\.?0+$/, '');
export const GARAGE = {
  motor:   { id: 'motor',   base: 110, per: 0.0075, fmt: v => '+' + pct(v, 2) + '% hız' },
  helmet:  { id: 'helmet',  base: 100, per: 0.02,   fmt: v => '+' + pct(v) + '% HP' },
  jacket:  { id: 'jacket',  base: 120, per: 0.01,   fmt: v => (v > 0 ? '-' : '') + pct(v) + '% hasar' },
  pos:     { id: 'pos',     base: 150, per: 0.025,  fmt: v => '+' + pct(v) + '% kart hasarı' },
  bag:     { id: 'bag',     base: 130, per: 0.02,   fmt: v => '+' + pct(v) + '% paket HP' },
  tires:   { id: 'tires',   base: 110, per: 0.02,   fmt: v => (v > 0 ? '-' : '') + pct(v) + '% kayma' },
  brakes:  { id: 'brakes',  base: 100, per: 0.02,   fmt: v => (v > 0 ? '-' : '') + pct(v) + '% çarpma hasarı' },
  battery: { id: 'battery', base: 150, per: 0.015,  fmt: v => '+' + pct(v) + '% atış sıklığı' },
};
export const GARAGE_ORDER = ['motor', 'helmet', 'jacket', 'pos', 'bag', 'tires', 'brakes', 'battery'];
export const GARAGE_MAX = 20;
export const GARAGE_GROWTH = 1.20;
export const garageCost = (id, lvl) => Math.round(GARAGE[id].base * Math.pow(GARAGE_GROWTH, lvl));
/** Total coins to max every category (balance reference). */
export const garageTotalCost = () => GARAGE_ORDER.reduce((a, id) => { for (let l = 0; l < GARAGE_MAX; l++) a += garageCost(id, l); return a; }, 0);
