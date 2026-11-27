// data/packages.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).

/* ------------------------------ DB ----------------------------- */
export const PACKAGES = {
  STANDARD_ORDER: { id: 'STANDARD_ORDER', hp: 100, speedMul: 1.0, hazardMul: 1.0, impactMul: 1.0, color: '#f2a541', icon: 'S' },
  HEAVY_ORDER:    { id: 'HEAVY_ORDER',    hp: 150, speedMul: 0.9, hazardMul: 1.0, impactMul: 0.9, color: '#8d6e63', icon: 'A' },
  FRAGILE_ORDER:  { id: 'FRAGILE_ORDER',  hp: 70,  speedMul: 1.0, hazardMul: 1.5, impactMul: 1.5, color: '#5aa9e6', icon: 'K' },
  RUSH_DELIVERY:  { id: 'RUSH_DELIVERY',  hp: 100, speedMul: 1.0, hazardMul: 1.0, impactMul: 1.0, color: '#e5533d', icon: '!' },
  FINAL_RUSH:     { id: 'FINAL_RUSH',     hp: 100, speedMul: 1.0, hazardMul: 1.0, impactMul: 1.0, color: '#b78cff', icon: '★' },
};
