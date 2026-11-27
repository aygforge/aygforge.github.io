// Denge yapılandırması — Tides'ın Aa nesnesinin kara yolu karşılığı.
export const CFG = {
  start: { gold: 60, hp: 100, atk: 12, def: 5, agi: 8, weapon: 'W_SWORD_1', armor: 'A_LIGHT_1', acc: null, items: [['C_POTION', 1]] },
  route: {
    legs: [7, 8],                       // başlangıç köyü + 7–8 yolculuk = 8–9 yerleşim
    distances: [
      { id: 'short', weight: 35, events: [2, 2] },
      { id: 'medium', weight: 45, events: [3, 4] },
      { id: 'long', weight: 20, events: [4, 5] },
    ],
    lanes: [2, 3],
  },
  voyage: { duration: { short: [80, 120], medium: [120, 170], long: [160, 220] }, minGap: 22, firstEventMin: 16, walkRate: 3, fastForward: 3 },
  regionWeights: {
    1: { danger: 18, npc: 22, explore: 14, treasure: 14, royal: 10, nature: 8, mystic: 4, absurd: 10, chain: 10 },
    2: { danger: 24, npc: 16, explore: 18, treasure: 12, royal: 6, nature: 10, mystic: 10, absurd: 6, chain: 10 },
    3: { danger: 26, npc: 12, explore: 16, treasure: 12, royal: 8, nature: 16, mystic: 8, absurd: 5, chain: 10 },
    4: { danger: 30, npc: 10, explore: 16, treasure: 10, royal: 6, nature: 10, mystic: 14, absurd: 4, chain: 10 },
    5: { danger: 24, npc: 12, explore: 10, treasure: 10, royal: 22, nature: 6, mystic: 8, absurd: 6, chain: 10 },
  },
  regionDmgMult: { 1: 0.9, 2: 1.1, 3: 1.3, 4: 1.5, 5: 1.7 },
  regionGoldMult: { 1: 1, 2: 1.25, 3: 1.5, 4: 1.8, 5: 2.1 },
  regionFoeMult: { 1: 1, 2: 1.15, 3: 1.32, 4: 1.5, 5: 1.68 },
  combat: { defendCut: 0.6, focusMax: 2, specialCost: 2, dodgeBase: 4, dodgePerAgi: 2, dodgeMax: 30, fleeBase: 40, fleePerAgi: 5 },
  check: { base: 50, perPoint: 5, min: 5, max: 95 },
  bag: { slots: 8, stack: 3, quick: 3 },
  economy: { sellRate: 0.4, innBase: 12, healerBase: 20 },
  xp: { arrival: 10, eventSuccess: 5, kill: 3, quest: 25, chainEnd: 40, capital: 120, endlessStage: 40, newTownType: 10 },
  endless: { stageEvery: 4, maxScaleStage: 8, scalePerStage: 0.1 },
  render: { w: 427, h: 240 },
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
