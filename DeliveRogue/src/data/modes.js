// data/modes.js — the 6 game modes (Master Prompt §13). Phase 02: only Campaign is implemented;
// the others are shown in RunPrep with their real unlock rule and are not startable until Phase 10.
export const MODES = [
  { id: 'campaign', unlockEp: 0, implemented: true },
  { id: 'endless', unlockEp: 3, implemented: false },
  { id: 'timeAttack', unlockEp: 1, implemented: false },
  { id: 'daily', unlockEp: 1, implemented: false },
  { id: 'bossRush', unlockEp: 3, implemented: false },
  { id: 'nightmare', unlockEp: 10, implemented: false },
];
