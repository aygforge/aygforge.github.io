// data/garage.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).

/** Garage: permanent upgrades. cost(level) = base * 1.3^level. */
export const GARAGE = {
  motor:  { id: 'motor',  base: 110, per: 0.0075, fmt: v => '+' + (v * 100).toFixed(2).replace(/\.?0+$/, '') + '% hız' },
  helmet: { id: 'helmet', base: 100, per: 0.02,   fmt: v => '+' + Math.round(v * 100) + '% HP' },
  jacket: { id: 'jacket', base: 120, per: 0.01,   fmt: v => (v > 0 ? '-' : '') + Math.round(v * 100) + '% hasar' },
  pos:    { id: 'pos',    base: 150, per: 0.025,  fmt: v => '+' + (v * 100).toFixed(1).replace(/\.0$/, '') + '% hasar' },
};
export const GARAGE_ORDER = ['motor', 'helmet', 'jacket', 'pos'];
export const GARAGE_MAX = 20;
export const garageCost = (id, lvl) => Math.round(GARAGE[id].base * Math.pow(1.3, lvl));
