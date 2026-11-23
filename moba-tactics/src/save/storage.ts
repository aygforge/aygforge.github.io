import { DEFAULT_BUILDS, BuildKind } from '../data/builds';
import { CHAMP_BY_ID, Position } from '../data/champions';
import { ITEM_BY_ID } from '../data/items';
import type { Style, JungleStrategy } from '../core/types';
import type { Difficulty, Personality } from '../ai/botCommander';

export const SAVE_VERSION = 1;
const KEY = 'mobaTactics.save';

export interface TeamPrefs {
  picks: { champId: string; style: Style; buildKind: BuildKind }[]; // index 0 top, 1 jungle, 2 bot
  jungleStrategy: JungleStrategy;
  difficulty: Difficulty;
  personality: Personality | 'random';
}
export interface SaveData {
  version: number;
  team: TeamPrefs;
  builds: Record<string, Partial<Record<BuildKind, number[]>>>; // user overrides
  prefs: { sound: boolean; quality: 'high' | 'low'; damageNumbers: boolean; speed: number };
  stats: { played: number; wins: number; losses: number; byDifficulty: Record<string, { w: number; l: number }>; lastResults: { win: boolean; time: number; kills: number; deaths: number; date: string }[] };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    team: {
      picks: [
        { champId: 'boran', style: 'balanced', buildKind: 'defense' },
        { champId: 'nyra', style: 'aggressive', buildKind: 'attack' },
        { champId: 'edrin', style: 'balanced', buildKind: 'attack' },
      ],
      jungleStrategy: 'balanced', difficulty: 'normal', personality: 'random',
    },
    builds: {},
    prefs: { sound: true, quality: 'high', damageNumbers: true, speed: 1 },
    stats: { played: 0, wins: 0, losses: 0, byDifficulty: {}, lastResults: [] },
  };
}

function validBuild(b: unknown): b is number[] {
  return Array.isArray(b) && b.length === 4 && new Set(b).size === 4 && b.every((i) => typeof i === 'number' && !!ITEM_BY_ID[i]);
}

/** Load save data; corrupted or old data never blocks the game. */
export function loadSave(): SaveData {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object' || s.version !== SAVE_VERSION) return d;
    if (s.team && Array.isArray(s.team.picks) && s.team.picks.length === 3) {
      const ids = s.team.picks.map((p: any) => p?.champId);
      if (ids.every((id: string) => CHAMP_BY_ID[id]) && new Set(ids).size === 3) {
        d.team.picks = s.team.picks.map((p: any) => ({
          champId: p.champId,
          style: ['aggressive', 'balanced', 'defensive'].includes(p.style) ? p.style : 'balanced',
          buildKind: ['attack', 'defense', 'hybrid'].includes(p.buildKind) ? p.buildKind : 'attack',
        }));
      }
      if (['aggressive', 'balanced', 'farm'].includes(s.team.jungleStrategy)) d.team.jungleStrategy = s.team.jungleStrategy;
      if (['easy', 'normal', 'hard'].includes(s.team.difficulty)) d.team.difficulty = s.team.difficulty;
      if (['aggressive', 'controlled', 'objective', 'random'].includes(s.team.personality)) d.team.personality = s.team.personality;
    }
    if (s.builds && typeof s.builds === 'object') {
      for (const [id, kinds] of Object.entries(s.builds as Record<string, any>)) {
        if (!CHAMP_BY_ID[id] || !kinds) continue;
        for (const k of ['attack', 'defense', 'hybrid'] as BuildKind[]) if (validBuild(kinds[k])) (d.builds[id] ??= {})[k] = kinds[k];
      }
    }
    if (s.prefs) {
      d.prefs.sound = s.prefs.sound !== false;
      d.prefs.quality = s.prefs.quality === 'low' ? 'low' : 'high';
      d.prefs.damageNumbers = s.prefs.damageNumbers !== false;
      d.prefs.speed = [1, 1.5, 2].includes(s.prefs.speed) ? s.prefs.speed : 1;
    }
    if (s.stats && typeof s.stats.played === 'number') {
      d.stats.played = s.stats.played | 0; d.stats.wins = s.stats.wins | 0; d.stats.losses = s.stats.losses | 0;
      if (s.stats.byDifficulty) d.stats.byDifficulty = s.stats.byDifficulty;
      if (Array.isArray(s.stats.lastResults)) d.stats.lastResults = s.stats.lastResults.slice(0, 10);
    }
  } catch {
    return defaultSave();
  }
  return d;
}

export function saveSave(d: SaveData) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ }
}

export function getBuild(d: SaveData, champId: string, kind: BuildKind): number[] {
  return [...(d.builds[champId]?.[kind] ?? DEFAULT_BUILDS[champId][kind])];
}
export function setBuild(d: SaveData, champId: string, kind: BuildKind, items: number[]) {
  if (!validBuild(items)) return;
  (d.builds[champId] ??= {})[kind] = [...items];
  saveSave(d);
}
export function resetBuild(d: SaveData, champId: string, kind: BuildKind) {
  if (d.builds[champId]) delete d.builds[champId]![kind];
  saveSave(d);
}
export type { Position };
