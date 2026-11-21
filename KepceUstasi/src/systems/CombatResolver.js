// CombatResolver — mermi kuyruğu, hedef seçimi, hasar, kalkan, ölüm/tava ve yetenek zincirleri.
// TEK hasar/ölüm otoritesi: atışlar, alan etkileri ve Dikenli Önlük karşılık hasarı hep buradan geçer.
// Sonuçlar burada BİR KEZ hesaplanır; sahne yalnızca olay listesini oynatır.
//
// Alpha 0.2 atış modeli: her merminin { id, source, isBonus, parentShotId, canProc } alanları vardır.
//  - Gerçek mermi (tencereden fiziksel olarak yakalanan topçuk): canProc=true → kritik, delme, patlama,
//    geri itme, çifte atış sayaçlarını tetikleyebilir.
//  - Bonus mermi (çifte atış, zincir pişirme, tava ustalığı, güvence damlası): canProc=false → hiçbir şey
//    tetiklemez, kritik olmaz, kendini kopyalamaz. Fiziksel topçuk sayısı asla artmaz.
import { ENEMIES, FIELD, OILS, SECONDARY_EVENT_CAP, AREA_RADIUS, ABILITY_VALUES, CHAPTERS } from '../data/content.js';
import { findChapter } from '../data/stages.js';
import { living, nextSteps, BOSS_FREEZE_EVERY } from './EnemyDirector.js';
import { addRecipe } from './RecipeTracker.js';
import { Rng } from '../core/rng.js';

const AV = ABILITY_VALUES;
// Alpha 0.3: count every time an ability actually did something (used to report "ineffective" cards).
export function proc(run, id) {
  if (!run.stats.procs) run.stats.procs = {};
  run.stats.procs[id] = (run.stats.procs[id] || 0) + 1;
}
const lvl = (run, id) => run.abilities[id] || 0;
const val = (run, id) => (lvl(run, id) ? AV[id][lvl(run, id) - 1] : null);

export function threatScore(e) {
  return e.x - nextSteps(e) * FIELD.step <= FIELD.contactX + 1e-6 ? 1 : 0;
}

function speedOf(e) {
  if (e.type === 'potato_king' && e.hasted) return 1;
  if (e.frozen) return 0; // a frozen enemy will not move next phase
  if (e.move === 'pepper') return 2;
  return ENEMIES[e.type].speed;
}

// Priority: (1) contact threat next move (2) speed (3) closer to the left (4) lower remaining HP (5) spawn id.
export function selectTarget(run) {
  const alive = living(run);
  if (!alive.length) return null;
  alive.sort(
    (a, b) =>
      (b.frozen ? 0 : threatScore(b)) - (a.frozen ? 0 : threatScore(a)) ||
      speedOf(b) - speedOf(a) ||
      a.x - b.x ||
      a.hp + a.shield - (b.hp + b.shield) ||
      a.id - b.id,
  );
  return alive[0];
}

function nearestLiving(run, from, n, radius, excludeIds = []) {
  const alive = living(run).filter((e) => e.id !== from.id && !excludeIds.includes(e.id));
  alive.sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y) || a.id - b.id);
  if (radius != null) {
    const within = alive.filter((e) => Math.hypot(e.x - from.x, e.y - from.y) <= radius);
    if (within.length) return within.slice(0, n);
  }
  return alive.slice(0, n);
}

// Enemy "behind" the target (further right, i.e. further from the chef), closest in lane-free y.
export function behindTarget(run, target) {
  const cands = living(run).filter((e) => e.id !== target.id && e.x > target.x + 1e-6);
  cands.sort((a, b) => Math.abs(a.y - target.y) - Math.abs(b.y - target.y) || a.x - b.x || a.id - b.id);
  return cands[0] || null;
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

// Deterministic crit roll from a dedicated RNG stream stored in the run (snapshot-safe).
function rollCrit(run, chance) {
  const r = new Rng(1);
  r.state = run.critRng >>> 0 || 1;
  const hit = r.next() < chance;
  run.critRng = r.state;
  return hit;
}

function chapterFor(run, chapter) {
  return chapter || findChapter(run.chapterId) || CHAPTERS[0];
}

// Shared death path: an enemy dies exactly once; the recipe counts exactly once (countedForRecipe).
export function killEnemy(run, chapter, e, cause, ctx) {
  if (e.dead) return;
  e.dead = true;
  run.stats.kills++;
  run.turnKills = (run.turnKills || 0) + 1;
  run.counters.panKills++;
  const def = ENEMIES[e.type];
  let counted = false;
  if (!e.counted) {
    e.counted = true;
    counted = def.recipe ? addRecipe(run, chapterFor(run, chapter), def.recipe) : false;
  }
  ctx.events.push({ type: 'kill', id: e.id, enemyType: e.type, recipeKey: def.recipe, counted, cause, recipe: { ...run.recipe } });
  if (e.boss) {
    ctx.victory = true;
    return;
  }
  if (!ctx.chains) return; // reflect kills do not start pan chains
  const from = { id: e.id, x: e.x, y: e.y };
  if (lvl(run, 'pan_burst') && run.turnKills % AV.pan_burst_every === 0) ctx.pending.push({ kind: 'pan_burst', from, dmg: val(run, 'pan_burst') });
  if (lvl(run, 'tomato_splash') && def.recipe === 'tomato') ctx.pending.push({ kind: 'tomato_splash', from, n: val(run, 'tomato_splash') });
  if (lvl(run, 'pan_echo') && !run.counters.echoUsedThisWave) {
    run.counters.echoUsedThisWave = true;
    ctx.pending.push({ kind: 'pan_echo', from });
  }
}

function makeCtx(run, chains) {
  return { events: [], victory: false, pending: [], chains, hpDamage: 0 };
}

// A secondary damage event (area, splash, pierce, explosion, boss knock). Capped per turn; overflow is
// counted and reported instead of silently vanishing.
function secondaryHit(run, chapter, ctx, source, from, target, dmg, extra = {}) {
  if (run.turnSecondary >= SECONDARY_EVENT_CAP) {
    run.stats.cappedEvents = (run.stats.cappedEvents || 0) + 1;
    ctx.capped = (ctx.capped || 0) + 1;
    return false;
  }
  run.turnSecondary++;
  const r = applyDamage(target, dmg);
  ctx.hpDamage += r.hpDmg;
  run.stats.damageDealt += r.hpDmg + r.shieldDmg;
  ctx.events.push({ type: 'area', source, fromId: from.id, fromX: from.x, fromY: from.y, targetId: target.id, damage: dmg, ...r, hp: target.hp, shield: target.shield, ...extra });
  if (target.hp <= 0) killEnemy(run, chapter, target, source, ctx);
  const owner = { knockback_boss: 'oil_knockback' }[source] || source;
  proc(run, owner);
  return true;
}

function drainPending(run, chapter, ctx) {
  while (ctx.pending.length && !ctx.victory) {
    const fx = ctx.pending.shift();
    if (fx.kind === 'pan_burst') {
      for (const t of nearestLiving(run, fx.from, 8, AREA_RADIUS)) if (!ctx.victory) secondaryHit(run, chapter, ctx, 'pan_burst', fx.from, t, fx.dmg);
    } else if (fx.kind === 'tomato_splash') {
      for (const t of nearestLiving(run, fx.from, fx.n, null)) if (!ctx.victory) secondaryHit(run, chapter, ctx, 'tomato_splash', fx.from, t, 1);
    } else if (fx.kind === 'pan_echo') {
      for (const t of nearestLiving(run, fx.from, 1, null)) if (!ctx.victory) secondaryHit(run, chapter, ctx, 'pan_echo', fx.from, t, 1);
    }
  }
}

/**
 * Resolve a full volley.
 * shots: [{ oil:'normal'|'big'|'cold', isBonus, source, canProc?, parentShotId? }]
 * Returns { events, victory }.
 */
export function resolveVolley(run, chapter, shots) {
  const ab = run.abilities;
  const ctx = makeCtx(run, true);
  const events = ctx.events;
  let nextId = 1;
  const queue = shots.map((s) => ({ canProc: !s.isBonus, parentShotId: null, ...s, id: nextId++ }));
  run.turnKills = 0;
  run.turnSecondary = 0;
  let firstRealDone = false;
  const lastNormalId = (() => {
    let id = null;
    for (const s of queue) if (s.oil === 'normal' && s.canProc) id = s.id;
    return id;
  })();

  for (let i = 0; i < queue.length && !ctx.victory; i++) {
    const shot = queue[i];
    const target = selectTarget(run);
    if (!target) {
      events.push({ type: 'fizzle', remaining: queue.length - i });
      break;
    }
    const real = !!shot.canProc;
    let dmg = OILS[shot.oil].damage;
    const bonusParts = [];
    if (shot.oil === 'big' && ab.heavy_oil) {
      dmg += val(run, 'heavy_oil');
      bonusParts.push('heavy_oil');
      proc(run, 'heavy_oil');
    }
    if (shot.oil === 'normal' && real) {
      run.stats.normalShots++;
      const m = run.perm.mastery; // permanent Atış Ustalığı (separate counter)
      if (m) {
        run.counters.permShot++;
        if (run.counters.permShot >= m.every) {
          run.counters.permShot = 0;
          dmg += m.bonus;
          bonusParts.push('mastery');
        }
      }
      const p = val(run, 'power_shot');
      if (p) {
        run.counters.powerShot++;
        if (run.counters.powerShot >= p.every) {
          run.counters.powerShot = 0;
          dmg += p.bonus;
          bonusParts.push('power_shot');
          proc(run, 'power_shot');
        }
      }
      if (ab.last_drop && shot.id === lastNormalId) {
        dmg += AV.last_drop[0];
        bonusParts.push('last_drop');
        proc(run, 'last_drop');
      }
    }
    if (real && !firstRealDone) {
      firstRealDone = true;
      if (ab.first_bite) {
        dmg += val(run, 'first_bite');
        bonusParts.push('first_bite');
        proc(run, 'first_bite');
      }
    }
    let crit = false;
    if (real && ab.critical_fry && rollCrit(run, val(run, 'critical_fry'))) {
      crit = true;
      dmg *= 2;
      run.stats.crits = (run.stats.crits || 0) + 1;
      proc(run, 'critical_fry');
    }
    const r = applyDamage(target, dmg);
    ctx.hpDamage += r.hpDmg;
    run.stats.shots++;
    run.stats.damageDealt += r.hpDmg + r.shieldDmg;
    const shotEv = {
      type: 'shot', index: i, shotId: shot.id, parentShotId: shot.parentShotId, oil: shot.oil, isBonus: !!shot.isBonus,
      canProc: real, source: shot.source, targetId: target.id, damage: dmg, crit, bonusParts, ...r, hp: target.hp, shield: target.shield,
    };
    events.push(shotEv);
    if (target.hp <= 0) killEnemy(run, chapter, target, 'shot', ctx);
    if (ctx.victory) break;

    if (real) {
      // Soğuk Sos: freeze the hit enemy (boss: at most once per 3 of its own actions)
      if (shot.oil === 'cold' && !target.dead) {
        const okBoss = !target.boss || target.lastFrozenAction == null || target.actionCount - target.lastFrozenAction >= BOSS_FREEZE_EVERY;
        if (okBoss && !target.frozen) {
          target.frozen = true;
          if (target.boss) target.lastFrozenAction = target.actionCount;
          events.push({ type: 'freeze', id: target.id, boss: !!target.boss });
          proc(run, 'cold_oil');
        } else if (!okBoss) {
          events.push({ type: 'freezeResisted', id: target.id });
        }
      }
      // Delici Yağ: every Nth real shot also hits one enemy behind the target
      if (ab.piercing_oil) {
        run.counters.pierce++;
        if (run.counters.pierce >= val(run, 'piercing_oil')) {
          run.counters.pierce = 0;
          const behind = behindTarget(run, target);
          if (behind) secondaryHit(run, chapter, ctx, 'piercing_oil', { id: target.id, x: target.x, y: target.y }, behind, 1, { shotId: shot.id });
          else if (!target.dead) {
            // Alpha 0.3: nobody behind (e.g. the boss alone) -> the oil drills through the target itself: +1 damage.
            // Shown on the card; never silently wasted.
            secondaryHit(run, chapter, ctx, 'piercing_oil', { id: target.id, x: target.x, y: target.y }, target, 1, { shotId: shot.id, drill: true });
          } else events.push({ type: 'pierceMiss', shotId: shot.id });
        }
      }
      // Patlayan Yağ: every Nth real hit explodes on up to 2 nearby enemies (never chains)
      if (!ctx.victory && ab.explosive_oil) {
        run.counters.explode++;
        if (run.counters.explode >= val(run, 'explosive_oil')) {
          run.counters.explode = 0;
          const from = { id: target.id, x: target.x, y: target.y };
          events.push({ type: 'explosion', x: target.x, y: target.y, shotId: shot.id }); // proc counted per real hit below
          for (const t of nearestLiving(run, from, 2, AREA_RADIUS * 1.4)) if (!ctx.victory) secondaryHit(run, chapter, ctx, 'explosive_oil', from, t, 1, { shotId: shot.id });
        }
      }
      // Güçlü Püskürtme: every Nth real hit pushes a NORMAL enemy one step right (a hit effect, not its own move)
      if (!ctx.victory && ab.oil_knockback) {
        run.counters.knock++;
        if (run.counters.knock >= val(run, 'oil_knockback')) {
          run.counters.knock = 0;
          if (!target.dead && !target.boss) {
            const fromX = target.x;
            target.x = +Math.min(FIELD.knockbackMaxX, target.x + FIELD.step).toFixed(4);
            events.push({ type: 'knockback', id: target.id, fromX, toX: target.x, shotId: shot.id });
            proc(run, 'oil_knockback');
          } else if (!target.dead && target.boss) {
            secondaryHit(run, chapter, ctx, 'knockback_boss', { id: target.id, x: target.x, y: target.y }, target, 1, { shotId: shot.id });
          }
        }
      }
    }
    drainPending(run, chapter, ctx);
    if (ctx.victory) break;
    // Çifte Yağ Atışı: a bonus oil after every Nth REAL normal shot; bonuses never trigger bonuses.
    if (ab.double_shot && shot.oil === 'normal' && real) {
      run.counters.doubleShot++;
      if (run.counters.doubleShot >= val(run, 'double_shot')) {
        run.counters.doubleShot = 0;
        queue.splice(i + 1, 0, { oil: 'normal', isBonus: true, canProc: false, source: 'double_shot', parentShotId: shot.id, id: nextId++ });
        proc(run, 'double_shot');
      }
    }
  }

  // Lezzetli Lokma: heal from REAL HP damage dealt this volley; max 1 heal per volley; no banking.
  if (ab.tasty_heal && ctx.hpDamage > 0) {
    const need = val(run, 'tasty_heal');
    run.counters.healDmg += ctx.hpDamage;
    if (run.counters.healDmg >= need) {
      run.counters.healDmg = Math.min(need - 1, run.counters.healDmg - need);
      const before = run.chef.hp;
      run.chef.hp = Math.min(run.chef.maxHp, run.chef.hp + 1);
      events.push({ type: 'heal', amount: run.chef.hp - before, hp: run.chef.hp });
      if (run.chef.hp > before) proc(run, 'tasty_heal');
    }
  }

  if (!ctx.victory) {
    if (ab.chain_cooking && run.turnKills >= AV.chain_min_kills) {
      run.pending.chain = 1;
      events.push({ type: 'bonusReady', source: 'chain_cooking' });
      proc(run, 'chain_cooking');
    }
    const every = run.perm.pan;
    if (every && run.counters.panKills >= every) {
      run.counters.panKills -= every; // max one award per turn
      run.pending.mastery += 1;
      events.push({ type: 'bonusReady', source: 'pan_mastery' });
    }
  }
  if (ctx.capped) events.push({ type: 'capReached', dropped: ctx.capped });
  if (ctx.victory) events.push({ type: 'victory' });
  return { events, victory: ctx.victory };
}

// Dikenli Önlük: reflect damage on the enemy that touched the chef (same damage/death authority).
export function resolveReflect(run, chapter, e, dmg) {
  const ctx = makeCtx(run, false);
  const r = applyDamage(e, dmg);
  run.stats.damageDealt += r.hpDmg + r.shieldDmg;
  ctx.events.push({ type: 'reflect', id: e.id, damage: dmg, ...r, hp: e.hp, shield: e.shield });
  proc(run, 'spiked_apron');
  if (e.hp <= 0) killEnemy(run, chapter, e, 'reflect', ctx);
  return { events: ctx.events, victory: ctx.victory };
}

// Builds the shot list for a volley from the PHYSICALLY caught balls (one shot per ball) + flagged bonuses.
export function buildShots(run, caught) {
  const shots = [];
  for (let i = 0; i < run.pending.chain; i++) shots.push({ oil: 'normal', isBonus: true, canProc: false, source: 'chain_cooking' });
  for (let i = 0; i < run.pending.mastery; i++) shots.push({ oil: 'normal', isBonus: true, canProc: false, source: 'pan_mastery' });
  run.pending.chain = 0;
  run.pending.mastery = 0;
  for (const b of caught) shots.push({ oil: b.type, isBonus: false, canProc: true, source: 'pot', ballId: b.id });
  if (caught.length === 0) shots.push({ oil: 'normal', isBonus: true, canProc: false, source: 'guarantee' });
  return shots;
}
