import { CHAPTERS } from '../../src/data/content.js';
import { newRunState } from '../../src/systems/RunController.js';
import { permStats } from '../../src/systems/Progression.js';
import { defaultSave } from '../../src/systems/SaveService.js';
import { ENEMIES } from '../../src/data/content.js';

export const CH1 = CHAPTERS[0];
export const CH2 = CHAPTERS[1];

export function makeRun(chapter = CH1, save = defaultSave()) {
  return newRunState({ chapter, perm: permStats(save), seed: 1, runId: 'test' });
}

export function addEnemy(run, type, x = 0.9, y = 0.5, over = {}) {
  const def = ENEMIES[type];
  const e = {
    id: run.nextEnemyId++, type, x, y, hp: def.hp, maxHp: def.hp, shield: def.shield, maxShield: def.shield,
    moveOpp: 0, dead: false, escaped: false, counted: false, boss: !!def.boss, guard: false, guardWarn: false,
    actionCount: 0, summoned: false, hasted: false, ...over,
  };
  run.enemies.push(e);
  return e;
}

export const normal = (n, extra = {}) => Array.from({ length: n }, () => ({ oil: 'normal', isBonus: false, source: 'pot', ...extra }));
export const big = (n) => Array.from({ length: n }, () => ({ oil: 'big', isBonus: false, source: 'pot' }));

export function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}
