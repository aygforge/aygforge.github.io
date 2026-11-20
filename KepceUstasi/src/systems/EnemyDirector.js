// EnemyDirector — dalga spawn'ı, SAĞDAN SOLA tur bazlı hareket, boss davranışları ve temas.
// Hareket yalnızca ENEMY_ACTION fazında, tur başına bir kez çağrılır. Asla sürekli hareket yok.
import { ENEMIES, FIELD } from '../data/content.js';

export function enemyDef(e) {
  return ENEMIES[e.type];
}

export function living(run) {
  return run.enemies.filter((e) => !e.dead && !e.escaped);
}

// Steps to the LEFT for the enemy's given move-opportunity index (1-based).
export function stepsFor(e, opp) {
  const def = ENEMIES[e.type];
  if (e.type === 'potato_king' && e.hasted) return 1;
  switch (def.move) {
    case 'pepper':
      return opp % 3 === 0 ? 2 : 1;
    case 'odd':
      return opp % 2 === 1 ? 1 : 0;
    default:
      return 1;
  }
}

export function nextSteps(e) {
  return stepsFor(e, e.moveOpp + 1);
}

function makeEnemy(run, type, x, y) {
  const def = ENEMIES[type];
  const e = {
    id: run.nextEnemyId++,
    type,
    x,
    y,
    hp: def.hp,
    maxHp: def.hp,
    shield: def.shield,
    maxShield: def.shield,
    moveOpp: 0,
    dead: false,
    escaped: false,
    counted: false,
    boss: !!def.boss,
    guard: false,
    guardWarn: false,
    actionCount: 0,
    summoned: false,
    hasted: false,
  };
  run.enemies.push(e);
  return e;
}

// Free y placement on the right side: rejection sampling with a minimum distance, relaxing if needed.
function pickSpot(run, rng, xMin, xMax, minDist) {
  const others = living(run);
  let best = null;
  let bestD = -1;
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = rng.range(xMin, xMax);
    const y = rng.range(FIELD.spawnYMin, FIELD.spawnYMax);
    let dmin = 9;
    for (const o of others) {
      const dx = (o.x - x) * 0.6; // horizontal distance counts less: bars/sprites overlap vertically
      const dy = o.y - y;
      dmin = Math.min(dmin, Math.hypot(dx, dy));
    }
    if (dmin >= minDist) return { x, y };
    if (dmin > bestD) {
      bestD = dmin;
      best = { x, y };
    }
  }
  return best;
}

export function spawnWave(run, chapter, rng) {
  run.enemies = run.enemies.filter((e) => !e.dead && !e.escaped); // keep the list small
  const spawned = [];
  if (run.wave > chapter.waves.length) {
    const e = makeEnemy(run, chapter.boss, 0.86, 0.5);
    spawned.push(e);
    return spawned;
  }
  const comp = chapter.waves[run.wave - 1];
  const list = [];
  for (const [type, n] of Object.entries(comp)) for (let i = 0; i < n; i++) list.push(type);
  for (const type of rng.shuffle(list)) {
    const spot = pickSpot(run, rng, FIELD.spawnXMin, FIELD.spawnXMax, 0.16);
    spawned.push(makeEnemy(run, type, spot.x, spot.y));
  }
  return spawned;
}

// One enemy action phase. Returns presentation events. Deterministic order (by id).
export function enemyAction(run, rng) {
  const events = [];
  const actors = living(run).sort((a, b) => a.id - b.id);
  for (const e of actors) {
    if (e.dead || e.escaped) continue;
    const def = ENEMIES[e.type];
    let skipMove = false;
    if (e.type === 'giant_tomato') {
      e.actionCount++;
      if (!e.summoned && e.hp <= def.hp * def.summonAt) {
        e.summoned = true;
        skipMove = true; // the summon IS this turn's action
        const cap = FIELD.activeEnemyCap - living(run).length;
        const n = Math.max(0, Math.min(def.summonCount, cap));
        const minions = [];
        const offsets = [-0.27, 0.27];
        for (let i = 0; i < n; i++) {
          let y = e.y + offsets[i];
          if (y < 0.12 || y > 0.88) y = e.y - offsets[i] * 1.6;
          y = Math.max(0.1, Math.min(0.9, y));
          const m = makeEnemy(run, 'tomato_minion', Math.min(0.93, e.x + 0.03), y);
          minions.push({ ...m });
        }
        events.push({ type: 'summon', id: e.id, minions });
      }
      if (e.actionCount % def.guardEvery === def.guardEvery - 1) {
        e.guardWarn = true;
        events.push({ type: 'guardWarn', id: e.id });
      } else if (e.actionCount % def.guardEvery === 0) {
        e.guardWarn = false;
        e.guard = true;
        events.push({ type: 'guardUp', id: e.id });
      }
    }
    if (e.type === 'potato_king' && !e.hasted && e.hp <= def.hp * def.hasteAt) {
      e.hasted = true;
      events.push({ type: 'haste', id: e.id });
    }
    e.moveOpp++;
    if (skipMove) continue;
    const steps = stepsFor(e, e.moveOpp);
    if (steps > 0) {
      const fromX = e.x;
      e.x = +(e.x - steps * FIELD.step).toFixed(4); // always to the LEFT
      events.push({ type: 'move', id: e.id, fromX, toX: e.x, steps });
    } else {
      events.push({ type: 'rest', id: e.id });
    }
  }
  return events;
}

// Damage to the chef: salt shield charge (-1) -> starting shield points -> HP. Shield-prevented damage is not HP loss.
export function damageChef(run, amount) {
  let dmg = amount;
  let salt = 0;
  let shield = 0;
  if (dmg > 0 && run.chef.saltCharges > 0) {
    run.chef.saltCharges--;
    salt = 1;
    dmg -= 1;
  }
  if (dmg > 0 && run.chef.shield > 0) {
    shield = Math.min(run.chef.shield, dmg);
    run.chef.shield -= shield;
    dmg -= shield;
  }
  const hpLoss = Math.min(run.chef.hp, dmg);
  run.chef.hp -= hpLoss;
  run.stats.hpLost += hpLoss;
  return { salt, shield, hpLoss };
}

export function resolveContacts(run) {
  const events = [];
  const touching = living(run)
    .filter((e) => e.x <= FIELD.contactX + 1e-6)
    .sort((a, b) => a.id - b.id);
  for (const e of touching) {
    if (run.chef.hp <= 0) break;
    const def = ENEMIES[e.type];
    const r = damageChef(run, def.contactDamage);
    if (e.boss) {
      e.x = def.retreatX; // safe retreat, one contact per turn
      events.push({ type: 'contact', id: e.id, damage: def.contactDamage, ...r, retreatX: e.x, boss: true });
    } else {
      e.escaped = true; // leaves the field, NOT counted for the recipe
      run.stats.escaped++;
      events.push({ type: 'contact', id: e.id, damage: def.contactDamage, ...r, escaped: true });
    }
  }
  if (run.chef.hp <= 0) events.push({ type: 'chefDown' });
  return events;
}
