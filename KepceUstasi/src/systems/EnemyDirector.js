// EnemyDirector — dalga spawn'ı, SAĞDAN SOLA tur bazlı hareket, boss davranışları ve temas.
// Hareket yalnızca ENEMY_ACTION fazında, tur başına bir kez çağrılır. Asla sürekli hareket yok.
import { ENEMIES, FIELD, CHAPTERS, ABILITY_VALUES } from '../data/content.js';
import { findChapter } from '../data/stages.js';
import { resolveReflect } from './CombatResolver.js';

export const BOSS_FREEZE_EVERY = 3; // a boss can be frozen at most once per 3 of its own actions

export function chapterOf(run) {
  return findChapter(run.chapterId) || CHAPTERS[0];
}

// Spawned HP for this chapter's balance (base HP table unchanged; boss HP explicit).
export function scaledHp(chapter, type) {
  const def = ENEMIES[type];
  const b = chapter?.balance;
  if (!b) return def.hp;
  if (def.boss) return b.bossHp ?? def.hp;
  if (b.hp && b.hp[type] != null) return b.hp[type]; // Alpha 0.3: per-type HP (instead of one blanket multiplier)
  return Math.max(1, Math.round(def.hp * (b.hpScale ?? 1)));
}

// Alpha 0.5A.1: who uses the repeating contact loop (hit -> 1 step back -> 1 step in -> hit …): every enemy that is
// not a boss, plus elite finals (not mini/chapter bosses). Bosses keep their own contact/retreat logic untouched.
export function usesContactLoop(e) {
  const def = ENEMIES[e.type];
  return !e.boss || (!!def.elite && !def.miniBoss);
}

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
  // Alpha 0.5A: cracked onion / Koca Mantar phase 2 alternate 1,2,1,2… from their next move on
  if (e.altFrom != null) return (opp - e.altFrom) % 2 === 1 ? 1 : 2;
  switch (e.move || def.move) { // e.move: chapter balance override (Alpha 0.3), set at spawn
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
  const hp = scaledHp(chapterOf(run), type);
  const bal = chapterOf(run).balance;
  const bossShield = def.boss && bal?.bossShield != null ? bal.bossShield : def.shield; // Alpha 0.4 final shield
  const e = {
    id: run.nextEnemyId++,
    type,
    x,
    y,
    hp,
    maxHp: hp,
    shield: bossShield,
    maxShield: bossShield,
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
    move: chapterOf(run).balance?.move?.[type] || def.move, // movement pattern (chapter override allowed)
    shell: def.shell || 0, // Alpha 0.5A onion shell (separate from shield, never scaled, never regrows)
    maxShell: def.shell || 0,
    altFrom: null, // move index after which the 1,2 pattern starts (shell broken / boss phase 2)
    pulses: 0, // guard / Koca Mantar shield pulses used
    contactState: null, // Alpha 0.5A.1 non-boss contact loop: null | 'retreated' | 'approached' | 'strike'
    frozen: false, // Soğuk Sos: skips its next move once
    lastFrozenAction: null, // bosses: freeze limited to once per BOSS_FREEZE_EVERY actions
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
    // final wave: one boss/elite, or two elites placed apart vertically (Alpha 0.4C)
    const finals = chapter.finals || [chapter.boss];
    const ys = finals.length === 1 ? [0.5] : [0.32, 0.68];
    finals.forEach((t, i) => spawned.push(makeEnemy(run, t, (chapter.balance?.bossX ?? 0.86) - i * 0.04, ys[i])));
    return spawned;
  }
  const comp = chapter.waves[run.wave - 1];
  const list = [];
  for (const [type, n] of Object.entries(comp)) for (let i = 0; i < n; i++) list.push(type);
  const staggered = chapter.identity?.spawnStyle === 'staggered';
  for (const [i, type] of rng.shuffle(list).entries()) {
    const b = chapter.balance || FIELD;
    let xMin = b.spawnXMin ?? FIELD.spawnXMin;
    let xMax = b.spawnXMax ?? FIELD.spawnXMax;
    if (staggered) {
      // staggered: groups at three depths (no lanes; y stays free)
      const g = i % 3;
      xMin = Math.min(0.88, xMin + g * 0.08);
      xMax = Math.min(0.9, xMax + g * 0.08);
    }
    const spot = pickSpot(run, rng, xMin, xMax, 0.16);
    spawned.push(makeEnemy(run, type, spot.x, spot.y));
  }
  return spawned;
}

// One enemy action phase. Returns presentation events. Deterministic order (by id).
export const GUARD_RULE = { every: 3, maxPulses: 2, amount: 2, cap: 3, range: 0.26 };

// Koca Mantar (L30): first time at <= 50 % HP -> once, 2 mushrooms (6 HP, recipe mushroom) + phase 2 (1,2 moves).
function giantMushroomPhase(run, e, def, events) {
  if (e.summoned || e.hp > e.maxHp * def.phaseAt) return;
  e.summoned = true;
  e.altFrom = e.moveOpp; // the new pattern begins with this action's move
  const cap = FIELD.activeEnemyCap - living(run).length;
  const n = Math.max(0, Math.min(def.summonCount, cap));
  const minions = [];
  const offsets = [-0.24, 0.24];
  for (let i = 0; i < n; i++) {
    let y = e.y + offsets[i];
    if (y < 0.12 || y > 0.88) y = e.y - offsets[i] * 1.6;
    y = Math.max(0.1, Math.min(0.9, y));
    const m = makeEnemy(run, 'mushroom', Math.min(0.93, e.x + 0.03), y);
    m.hp = m.maxHp = def.summonHp;
    m.summonedBy = e.id;
    minions.push({ ...m });
  }
  events.push({ type: 'phase', id: e.id });
  events.push({ type: 'summon', id: e.id, minions, label: 'Koca Mantar iki mantar çağırdı!' });
}

// Support pulses happen after every move of the phase (before contact). At most ONE guard shield event per phase.
function supportPulses(run, actors, events) {
  let granted = false;
  for (const g of actors) {
    if (g.dead || g.escaped) continue;
    const def = ENEMIES[g.type];
    if (def.guardPulse && g.actionCount % GUARD_RULE.every === 0 && g.pulses < GUARD_RULE.maxPulses) {
      g.pulses++; // a pulse with no target (or blocked by this phase's event) is lost, never made up
      if (granted) continue;
      const t = living(run)
        .filter((o) => o.id !== g.id && !ENEMIES[o.type].guardPulse && o.shield < GUARD_RULE.cap && Math.abs(o.x - g.x) <= GUARD_RULE.range + 1e-9)
        .sort((a, b) => Math.abs(a.x - g.x) - Math.abs(b.x - g.x) || a.id - b.id)[0];
      if (!t) continue;
      const amount = Math.min(GUARD_RULE.cap, t.shield + GUARD_RULE.amount) - t.shield;
      t.shield += amount;
      t.maxShield = Math.max(t.maxShield, t.shield);
      granted = true;
      events.push({ type: 'shieldGranted', id: g.id, targetId: t.id, amount, shield: t.shield });
    }
    if (g.type === 'giant_mushroom' && g.actionCount % def.pulseEvery === 0 && g.pulses < def.maxPulses) {
      g.pulses++;
      const m = living(run)
        .filter((o) => o.summonedBy === g.id && o.shield < 3)
        .sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y) || a.id - b.id)[0];
      const t = m || (g.shield < 4 ? g : null);
      if (!t) continue;
      const amount = m ? Math.min(3, m.shield + 2) - m.shield : 1;
      t.shield += amount;
      t.maxShield = Math.max(t.maxShield, t.shield);
      events.push({ type: 'shieldGranted', id: g.id, targetId: t.id, amount, shield: t.shield, boss: true });
    }
  }
}

export function enemyAction(run, rng) {
  const events = [];
  const actors = living(run).sort((a, b) => a.id - b.id);
  for (const e of actors) {
    if (e.dead || e.escaped) continue;
    const def = ENEMIES[e.type];
    let skipMove = false;
    if (def.guardPulse) e.actionCount++; // own actions (frozen ones included) drive the 3rd/6th pulse
    if (e.type === 'giant_mushroom') {
      e.actionCount++;
      giantMushroomPhase(run, e, def, events);
    }
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
    if (e.frozen) {
      // Soğuk Sos: this move opportunity is skipped once (specials above still happen)
      e.frozen = false;
      events.push({ type: 'frozenSkip', id: e.id });
      continue;
    }
    e.moveOpp++;
    if (skipMove) continue;
    // contact loop (frozen enemies never reach here, so a pending approach/strike simply waits)
    if (e.contactState === 'retreated') {
      const fromX = e.x;
      e.x = +(e.x - FIELD.step).toFixed(4); // exactly one step back in
      e.contactState = e.x <= FIELD.contactX + 1e-6 ? 'approached' : null;
      events.push({ type: 'move', id: e.id, fromX, toX: e.x, steps: 1, approach: true });
      continue;
    }
    if (e.contactState === 'approached') {
      if (e.x <= FIELD.contactX + 1e-6) {
        e.contactState = 'strike'; // holds at the chef; strikes in this action's contact phase
        events.push({ type: 'rest', id: e.id, strike: true });
        continue;
      }
      e.contactState = null; // pushed away (knockback): walk normally again
    }
    const steps = stepsFor(e, e.moveOpp);
    if (steps > 0) {
      const fromX = e.x;
      e.x = +(e.x - steps * FIELD.step).toFixed(4); // always to the LEFT
      events.push({ type: 'move', id: e.id, fromX, toX: e.x, steps });
    } else {
      events.push({ type: 'rest', id: e.id });
    }
  }
  supportPulses(run, actors, events);
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
    if (run.stats.procs) run.stats.procs.salt_shield = (run.stats.procs.salt_shield || 0) + 1;
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

export function resolveContacts(run, chapter = chapterOf(run)) {
  const events = [];
  // loop enemies only strike when walking in (state null) or on their 'strike' action — never right after an approach
  const touching = living(run)
    .filter((e) => e.x <= FIELD.contactX + 1e-6 && (!usesContactLoop(e) || e.contactState == null || e.contactState === 'strike'))
    .sort((a, b) => a.id - b.id);
  const spikes = run.abilities.spiked_apron ? ABILITY_VALUES.spiked_apron[run.abilities.spiked_apron - 1] : 0;
  for (const e of touching) {
    if (run.chef.hp <= 0) break;
    const def = ENEMIES[e.type];
    const r = damageChef(run, def.contactDamage);
    const ev = { type: 'contact', id: e.id, damage: def.contactDamage, ...r, boss: !!e.boss };
    events.push(ev);
    if (run.chef.hp <= 0) break;
    if (spikes > 0) {
      // Dikenli Önlük: the reflect goes through the combat authority (single kill / recipe path)
      const rr = resolveReflect(run, chapter, e, spikes);
      events.push(...rr.events);
      if (rr.victory) {
        events.push({ type: 'victory' });
        return events; // boss died on the spikes: nothing else happens this turn
      }
      if (e.dead) continue; // cooked in the pan (counted once)
    }
    if (usesContactLoop(e)) {
      // Alpha 0.5A.1: one hit, one step back; it stays alive/targetable with HP, shield, shell and speed kept
      e.x = +(e.x + FIELD.step).toFixed(4);
      e.contactState = 'retreated';
      ev.retreatX = e.x;
      ev.loop = true;
    } else {
      e.x = def.retreatX; // boss: safe retreat, one contact per turn (unchanged)
      ev.retreatX = e.x;
    }
  }
  if (run.chef.hp <= 0) events.push({ type: 'chefDown' });
  return events;
}
