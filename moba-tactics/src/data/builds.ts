export type BuildKind = 'attack' | 'defense' | 'hybrid';
export const BUILD_NAMES: Record<BuildKind, string> = { attack: 'Saldırı', defense: 'Savunma', hybrid: 'Hibrit' };
/** 54 starting builds: 18 champions x 3 */
export const DEFAULT_BUILDS: Record<string, Record<BuildKind, number[]>> = {
  boran: { attack: [14, 23, 9, 12], defense: [9, 12, 11, 10], hybrid: [9, 14, 11, 23] },
  korruk: { attack: [23, 9, 11, 15], defense: [11, 9, 10, 12], hybrid: [9, 11, 23, 12] },
  tharok: { attack: [14, 23, 9, 15], defense: [9, 12, 11, 10], hybrid: [9, 14, 12, 23] },
  rovan: { attack: [2, 4, 1, 14], defense: [4, 11, 9, 12], hybrid: [4, 2, 9, 14] },
  selda: { attack: [3, 1, 15, 4], defense: [4, 9, 12, 14], hybrid: [3, 4, 15, 12] },
  malvek: { attack: [4, 1, 14, 2], defense: [4, 11, 9, 12], hybrid: [4, 9, 14, 1] },
  asira: { attack: [5, 6, 7, 20], defense: [8, 5, 18, 12], hybrid: [6, 8, 5, 7] },
  liris: { attack: [5, 8, 7, 6], defense: [8, 12, 10, 18], hybrid: [8, 5, 12, 7] },
  orun: { attack: [5, 7, 20, 6], defense: [5, 12, 8, 10], hybrid: [5, 8, 7, 12] },
  nyra: { attack: [3, 1, 14, 19], defense: [14, 12, 3, 4], hybrid: [3, 14, 4, 12] },
  zereth: { attack: [2, 17, 4, 1], defense: [17, 4, 12, 13], hybrid: [17, 2, 4, 12] },
  vaelis: { attack: [3, 15, 1, 14], defense: [15, 12, 14, 4], hybrid: [15, 3, 14, 12] },
  edrin: { attack: [3, 1, 2, 19], defense: [2, 4, 12, 13], hybrid: [3, 2, 17, 12] },
  tessa: { attack: [2, 15, 4, 1], defense: [2, 4, 12, 13], hybrid: [2, 15, 17, 12] },
  dorn: { attack: [1, 23, 3, 15], defense: [23, 9, 12, 1], hybrid: [23, 1, 14, 12] },
  rughan: { attack: [21, 2, 24, 4], defense: [21, 11, 9, 12], hybrid: [21, 24, 4, 12] },
  nekmar: { attack: [21, 5, 6, 8], defense: [21, 11, 12, 8], hybrid: [21, 5, 8, 12] },
  ilvara: { attack: [22, 5, 6, 8], defense: [22, 9, 12, 8], hybrid: [22, 5, 8, 12] },
};
