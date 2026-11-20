// CombatResolver — mermi kuyruğu, hedef seçimi, hasar, kalkan, ölüm/tava ve yetenek zincirleri.
// Sonuçlar burada BİR KEZ hesaplanır; sahne yalnızca olay listesini oynatır.
import { ENEMIES, FIELD, OILS, SECONDARY_EVENT_CAP, AREA_RADIUS } from '../data/content.js';
import { living, nextSteps } from './EnemyDirector.js';
import { addRecipe } from './RecipeTracker.js';

export function threatScore(e) {
  return e.x - nextSteps(e) * FIELD.step <= FIELD.contactX + 1e-6 ? 1 : 0;
}

function speedOf(e) {
  if (e.type === 'potato_king' && e.hasted) return 1;
  return ENEMIES[e.type].speed;
}

// Priority: (1) contact threat next move (2) speed (3) closer to the left (4) lower remaining HP (5) spawn id.
export function selectTarget(run) {
  const alive = living(run);
  if (!alive.length) return null;
  alive.sort(
    (a, b) =>
      threatScore(b) - threatScore(a) ||
      speedOf(b) - speedOf(a) ||
      a.x - b.x ||
      a.hp + a.shield - (b.hp + b.shield) ||
      a.id - b.id,
  );
  return alive[0];
}

function nearestLiving(run, from, n, radius) {
  const alive = living(run).filter((e) => e.id !== from.id);
  alive.sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y) || a.id - b.id);
  if (radius != null) {
    const within = alive.filter((e) => Math.hypot(e.x - from.x, e.y - from.y) <= radius);
    if (within.length) return within.slice(0, n);
  }
  return alive.slice(0, n);
}

// Applies damage to an enemy: guard (-1) -> shield points -> HP. HP never negative.
export function applyDamage(e, amount) {
  let dmg = Math.max(0, amount);
  let guarded = 0;
  if (e.guard && dmg > 0) {
    e.guard = false;
    guarded = 1;
    dmg -= 1;
  }
  const shieldDmg = Math.min(e.shield, dmg);
  e.shield -= shieldDmg;
  dmg -= shieldDmg;
  const hpDmg = Math.min(e.hp, dmg);
  e.hp -= hpDmg;
  return { guarded, shieldDmg, hpDmg, shieldBroken: shieldDmg > 0 && e.shield === 0 };
}

const POWER_SHOT = [null, { every: 4, bonus: 1 }, { every: 3, bonus: 1 }, { every: 3, bonus: 2 }];

/**
 * Resolve a full volley.
 * shots: [{ oil:'normal'|'big', isBonus:boolean, source:string }]
 * Returns { events, victory, kills }.
 */
export function resolveVolley(run, chapter, shots) {
  const ab = run.abilities;
  const events = [];
  const queue = shots.map((s) => ({ ...s }));
  run.turnKills = 0;
  run.turnSecondary = 0;
  let firstHitDone = false;
  let victory = false;
  const lastNormalIdx = (() => {
    let idx = -1;
    queue.forEach((s, i) => {
      if (s.oil === 'normal' && !s.isBonus) idx = i;
    });
    return idx;
  })();
  const pendingEffects = [];

  const kill = (e, cause) => {
    if (e.dead) return; // a death is produced exactly once
    e.dead = true;
    run.stats.kills++;
    run.turnKills++;
    run.counters.panKills++;
    const def = ENEMIES[e.type];
    let counted = false;
    if (!e.counted) {
      e.counted = true;
      counted = def.recipe ? addRecipe(run, chapter, def.recipe) : false;
    }
    events.push({ type: 'kill', id: e.id, enemyType: e.type, recipeKey: def.recipe, counted, cause, recipe: { ...run.recipe } });
    if (e.boss) {
      victory = true;
      return;
    }
    if (ab.pan_burst && run.turnKills % 3 === 0) {
      pendingEffects.push({ kind: 'pan_burst', from: { id: e.id, x: e.x, y: e.y }, dmg: ab.pan_burst });
    }
    if (ab.tomato_splash && def.recipe === 'tomato') {
      pendingEffects.push({ kind: 'tomato_splash', from: { id: e.id, x: e.x, y: e.y }, n: ab.tomato_splash });
    }
    if (ab.pan_echo && !run.counters.echoUsedThisWave) {
      run.counters.echoUsedThisWave = true;
      pendingEffects.push({ kind: 'pan_echo', from: { id: e.id, x: e.x, y: e.y } });
    }
  };

  const secondaryHit = (source, from, target, dmg) => {
    if (run.turnSecondary >= SECONDARY_EVENT_CAP) return false;
    run.turnSecondary++;
    const r = applyDamage(target, dmg);
    events.push({ type: 'area', source, fromId: from.id, fromX: from.x, fromY: from.y, targetId: target.id, damage: dmg, ...r, hp: target.hp, shield: target.shield });
    if (target.hp <= 0) kill(target, source);
    return true;
  };

  const drainEffects = () => {
    while (pendingEffects.length && !victory) {
      const fx = pendingEffects.shift();
      if (fx.kind === 'pan_burst') {
        for (const t of nearestLiving(run, fx.from, 8, AREA_RADIUS)) if (!victory) secondaryHit('pan_burst', fx.from, t, fx.dmg);
      } else if (fx.kind === 'tomato_splash') {
        for (const t of nearestLiving(run, fx.from, fx.n, null)) if (!victory) secondaryHit('tomato_splash', fx.from, t, 1);
      } else if (fx.kind === 'pan_echo') {
        for (const t of nearestLiving(run, fx.from, 1, null)) if (!victory) secondaryHit('pan_echo', fx.from, t, 1);
      }
    }
  };

  for (let i = 0; i < queue.length && !victory; i++) {
    const shot = queue[i];
    const target = selectTarget(run);
    if (!target) {
      events.push({ type: 'fizzle', remaining: queue.length - i });
      break;
    }
    let dmg = OILS[shot.oil].damage;
    const bonusParts = [];
    if (shot.oil === 'big' && ab.heavy_oil) {
      dmg += ab.heavy_oil;
      bonusParts.push('heavy_oil');
    }
    if (shot.oil === 'normal' && !shot.isBonus) {
      run.stats.normalShots++;
      // permanent Atış Ustalığı counter (separate from the temporary one)
      const m = run.perm.mastery;
      if (m) {
        run.counters.permShot++;
        if (run.counters.permShot >= m.every) {
          run.counters.permShot = 0;
          dmg += m.bonus;
          bonusParts.push('mastery');
        }
      }
      const p = POWER_SHOT[ab.power_shot || 0];
      if (p) {
        run.counters.powerShot++;
        if (run.counters.powerShot >= p.every) {
          run.counters.powerShot = 0;
          dmg += p.bonus;
          bonusParts.push('power_shot');
        }
      }
      if (ab.last_drop && i === lastNormalIdx) {
        dmg += 2;
        bonusParts.push('last_drop');
      }
    }
    if (!firstHitDone) {
      firstHitDone = true;
      if (ab.first_bite) {
        dmg += ab.first_bite;
        bonusParts.push('first_bite');
      }
    }
    const r = applyDamage(target, dmg);
    run.stats.shots++;
    run.stats.damageDealt += r.hpDmg + r.shieldDmg;
    events.push({
      type: 'shot',
      index: i,
      oil: shot.oil,
      isBonus: !!shot.isBonus,
      source: shot.source,
      targetId: target.id,
      damage: dmg,
      bonusParts,
      ...r,
      hp: target.hp,
      shield: target.shield,
    });
    if (target.hp <= 0) kill(target, 'shot');
    drainEffects();
    // Çifte Atış: counts real normal hits only; bonus shots can never trigger another bonus.
    if (!victory && ab.double_shot && shot.oil === 'normal' && !shot.isBonus) {
      run.counters.doubleShot++;
      const every = ab.double_shot >= 2 ? 4 : 5;
      if (run.counters.doubleShot >= every) {
        run.counters.doubleShot = 0;
        if (run.turnSecondary < SECONDARY_EVENT_CAP) {
          run.turnSecondary++;
          queue.splice(i + 1, 0, { oil: 'normal', isBonus: true, source: 'double_shot' });
        }
      }
    }
  }

  // Post-volley bonuses for the NEXT volley (marked isBonus, never chain themselves).
  if (!victory) {
    if (ab.chain_cooking && run.turnKills >= 3) {
      run.pending.chain = 1;
      events.push({ type: 'bonusReady', source: 'chain_cooking' });
    }
    const every = run.perm.pan;
    if (every && run.counters.panKills >= every) {
      run.counters.panKills -= every; // max one award per turn
      run.pending.mastery += 1;
      events.push({ type: 'bonusReady', source: 'pan_mastery' });
    }
  }
  if (victory) events.push({ type: 'victory' });
  return { events, victory };
}

// Builds the shot list for a volley from the PHYSICALLY caught balls (one shot per ball) + flagged bonuses.
export function buildShots(run, caught) {
  const shots = [];
  for (let i = 0; i < run.pending.chain; i++) shots.push({ oil: 'normal', isBonus: true, source: 'chain_cooking' });
  for (let i = 0; i < run.pending.mastery; i++) shots.push({ oil: 'normal', isBonus: true, source: 'pan_mastery' });
  run.pending.chain = 0;
  run.pending.mastery = 0;
  for (const b of caught) shots.push({ oil: b.type, isBonus: false, source: 'pot', ballId: b.id });
  if (caught.length === 0) shots.push({ oil: 'normal', isBonus: true, source: 'guarantee' });
  return shots;
}
