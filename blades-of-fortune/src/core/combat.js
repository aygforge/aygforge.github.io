// Kısa sıra tabanlı savaş motoru. Saf mantık: run durumunu ve deterministik RNG'yi kullanır, animasyon için "beat" listesi döndürür.
import { CFG, clamp } from '../config.js';
import { ENEMIES, INTENTS } from '../data/enemies.js';
import { ITEMS } from '../data/items.js';
import { ENDLESS_CONDITIONS } from '../data/world.js';
import { heroStats, hasUpg, removeOne, hasInBag, clampHp } from './state.js';

export function foeScale(G, region) {
  const r = G.run;
  let m = CFG.regionFoeMult[region] || 1;
  if (r.endless) m *= 1 + Math.min(r.endless.stage, CFG.endless.maxScaleStage) * CFG.endless.scalePerStage;
  return m;
}

export function startCombat(G, rng, foes, region, extra = {}) {
  const r = G.run, mult = foeScale(G, region);
  const cond = r.endless && r.endless.cond ? ENDLESS_CONDITIONS[r.endless.cond] : null;
  const list = foes.map(([eid, enemyId], i) => {
    const E = ENEMIES[enemyId];
    let m = mult;
    if (cond && cond.foe) for (const t of E.tags) if (cond.foe[t]) m *= cond.foe[t];
    const hp = Math.round(E.hp * m);
    return { eid, id: enemyId, name: E.name, kind: E.kind, hp, max: hp, atk: Math.round(E.atk * (0.5 + m * 0.5)), def: E.def + Math.floor((region - 1) / 2), spd: E.spd, tags: E.tags, pi: rng.int(0, E.pattern.length - 1) * (E.boss ? 0 : 1), buff: 0, defMult: 1, dead: false, boss: !!E.boss, ethereal: E.ethereal || 0, noFlee: !!E.noFlee, death: E.death };
  });
  // Sonsuz Macera: yüksek aşamada yeni düşman kombinasyonu (bir yardımcı eklenir)
  if (r.endless && r.endless.stage >= 2 && list.length < 3 && !list.some((f) => f.boss) && rng.chance(25 + r.endless.stage * 8)) {
    const base = list[0];
    const pool = base.tags.includes('undead') ? 'E_SKELETON' : base.tags.includes('beast') ? 'E_WOLF' : base.tags.includes('construct') ? 'E_SKELETON' : 'E_ARCHER';
    const E = ENEMIES[pool], hp = Math.round(E.hp * mult * 0.8);
    list.push({ eid: '__add' + list.length, spawnKind: E.kind, id: pool, name: E.name, kind: E.kind, hp, max: hp, atk: Math.round(E.atk * (0.5 + mult * 0.5)), def: E.def, spd: E.spd, tags: E.tags, pi: 0, buff: 0, defMult: 1, dead: false, boss: false, ethereal: E.ethereal || 0, death: E.death });
  }
  const cb = { foes: list, focus: 0, turn: 1, defending: false, ward: false, agiDebuff: 0, atkDebuff: 0, over: null, region, ...extra };
  for (const f of list) f.intent = pickIntent(f);
  return cb;
}
function pickIntent(f) { const E = ENEMIES[f.id]; return E.pattern[f.pi % E.pattern.length]; }
export const alive = (cb) => cb.foes.filter((f) => !f.dead);

function vsMult(G, f) {
  const r = G.run; let m = 1;
  for (const slot of ['weapon', 'acc']) { const it = ITEMS[r.equip[slot]]; if (it && it.vs) for (const t of f.tags) if (it.vs[t]) m = Math.max(m, it.vs[t]); }
  return m;
}
function heroHit(G, rng, cb, f, mult, { ignoreDef = false } = {}) {
  const st = heroStats(G);
  const holy = ['W_SWORD_3'].includes(G.run.equip.weapon) || G.run.equip.acc === 'X_HOLY';
  if (f.ethereal && !holy && rng.chance(f.ethereal)) return { miss: true, dmg: 0 };
  let atk = Math.max(1, st.atk - cb.atkDebuff) * mult * vsMult(G, f) * rng.range(0.9, 1.1);
  if (hasUpg(G.meta, 'U_FINISH') && f.hp < f.max * 0.3) atk *= 1.15;
  const def = ignoreDef ? 0 : f.def * f.defMult * 0.5;
  let dmg = Math.max(1, Math.round(atk - def));
  if (f.intent === 'guard') dmg = Math.max(1, Math.round(dmg * 0.5));
  f.hp = Math.max(0, f.hp - dmg);
  const kill = f.hp <= 0;
  if (kill) f.dead = true;
  return { dmg, kill };
}

// action: { type: 'attack'|'defend'|'special'|'item'|'flee', target: eid, item: id }
export function combatAct(G, rng, cb, action) {
  const beats = [], r = G.run, st = heroStats(G);
  if (cb.over) return { ok: false, reason: 'Savaş bitti.' };
  const foes = alive(cb);
  let target = foes.find((f) => f.eid === action.target) || foes[0];
  cb.defending = false;
  let skipEnemy = false;
  switch (action.type) {
    case 'attack': {
      const h = heroHit(G, rng, cb, target, 1);
      beats.push({ t: 'hAtk', eid: target.eid, ...h });
      cb.focus = Math.min(CFG.combat.focusMax, cb.focus + 1);
      break;
    }
    case 'defend': {
      cb.defending = true;
      cb.focus = Math.min(CFG.combat.focusMax, cb.focus + 1);
      beats.push({ t: 'hDef' });
      break;
    }
    case 'special': {
      if (cb.focus < CFG.combat.specialCost) return { ok: false, reason: 'Yeterli Odak yok.' };
      cb.focus -= CFG.combat.specialCost;
      const bonus = hasUpg(G.meta, 'U_MASTER') ? 1.08 : 1;
      if (st.fam === 'sword') {
        const h1 = heroHit(G, rng, cb, target, 0.7 * bonus);
        let t2 = target.dead ? alive(cb)[0] : target;
        const h2 = t2 ? heroHit(G, rng, cb, t2, 0.7 * bonus) : null;
        beats.push({ t: 'hSpec', fam: 'sword', hits: [{ eid: target.eid, ...h1 }, ...(h2 ? [{ eid: t2.eid, ...h2 }] : [])] });
      } else if (st.fam === 'axe') {
        const h = heroHit(G, rng, cb, target, 1.3 * bonus, { ignoreDef: true });
        target.defMult = 0.5;
        beats.push({ t: 'hSpec', fam: 'axe', hits: [{ eid: target.eid, ...h }] });
      } else {
        const hits = alive(cb).map((f) => ({ eid: f.eid, ...heroHit(G, rng, cb, f, 0.8 * bonus) }));
        beats.push({ t: 'hSpec', fam: 'spear', hits });
      }
      break;
    }
    case 'item': {
      const id = action.item, it = ITEMS[id];
      if (!it || !it.combat || !hasInBag(r, id)) return { ok: false, reason: 'Eşya yok.' };
      removeOne(r, id);
      if (it.heal) {
        const before = r.hero.hp;
        r.hero.hp += Math.round(it.heal * (hasUpg(G.meta, 'U_HEALER') && id.startsWith('C_POTION') ? 1.1 : 1));
        clampHp(G);
        beats.push({ t: 'hItem', item: id, heal: r.hero.hp - before });
      } else if (it.aoe) {
        const hits = alive(cb).map((f) => { const dmg = Math.round(it.aoe * (CFG.regionDmgMult[cb.region] || 1)); f.hp = Math.max(0, f.hp - dmg); if (f.hp <= 0) f.dead = true; return { eid: f.eid, dmg, kill: f.dead }; });
        beats.push({ t: 'hItem', item: id, hits });
      } else if (it.ward) {
        cb.ward = true; beats.push({ t: 'hItem', item: id, ward: 1 });
      } else if (it.flee) {
        cb.over = 'flee'; beats.push({ t: 'hItem', item: id, flee: 1 }); beats.push({ t: 'flee', ok: true });
        return { ok: true, beats };
      }
      break;
    }
    case 'flee': {
      if (cb.foes.some((f) => f.noFlee && !f.dead)) return { ok: false, reason: 'Bu savaştan kaçılamaz.' };
      const spd = Math.max(...foes.map((f) => f.spd));
      const ch = fleeChance(G, cb);
      const ok = rng.next() * 100 < ch;
      beats.push({ t: 'flee', ok, chance: ch, spd });
      if (ok) { cb.over = 'flee'; return { ok: true, beats }; }
      break;
    }
    default: return { ok: false, reason: 'Geçersiz eylem.' };
  }
  if (!alive(cb).length) { cb.over = 'win'; beats.push({ t: 'win' }); return { ok: true, beats }; }
  if (!skipEnemy) enemyTurn(G, rng, cb, beats);
  if (r.hero.hp <= 0) { cb.over = 'dead'; beats.push({ t: 'dead' }); return { ok: true, beats }; }
  // Savaşçı İçgüdüsü
  if (hasUpg(G.meta, 'U_INSTINCT') && !r.instinctUsed && r.hero.hp < heroStats(G).maxHp * 0.3) {
    r.instinctUsed = true; cb.focus = CFG.combat.focusMax; beats.push({ t: 'instinct' });
  }
  cb.turn++;
  return { ok: true, beats };
}

export function fleeChance(G, cb) {
  const st = heroStats(G), foes = alive(cb);
  if (!foes.length) return 100;
  const spd = Math.max(...foes.map((f) => f.spd));
  return clamp(Math.round(CFG.combat.fleeBase + (st.agi - cb.agiDebuff - spd) * CFG.combat.fleePerAgi), 10, 90);
}

function enemyTurn(G, rng, cb, beats) {
  const r = G.run, st = heroStats(G);
  for (const f of alive(cb)) {
    const I = INTENTS[f.intent] || INTENTS.atk;
    const b = { t: 'fAct', eid: f.eid, intent: f.intent };
    if (I.mult > 0) {
      const dodge = clamp(CFG.combat.dodgeBase + (st.agi - cb.agiDebuff - f.spd) * CFG.combat.dodgePerAgi, 0, CFG.combat.dodgeMax);
      if (cb.ward) { cb.ward = false; b.warded = 1; b.dmg = 0; }
      else if (rng.next() * 100 < dodge) { b.dodged = 1; b.dmg = 0; }
      else {
        let dmg = (f.atk + f.buff) * I.mult * rng.range(0.9, 1.1) - st.def * 0.5;
        dmg = Math.max(1, dmg);
        if (cb.defending) dmg *= 1 - (CFG.combat.defendCut + (hasUpg(G.meta, 'U_SHIELD') ? 0.08 : 0));
        dmg = Math.max(cb.defending ? 0 : 1, Math.round(dmg));
        r.hero.hp = Math.max(0, r.hero.hp - dmg);
        b.dmg = dmg;
        if (f.intent === 'drain') { const h = Math.min(dmg, f.max - f.hp); f.hp += h; b.heal = h; }
        if (f.intent === 'web') { cb.agiDebuff = Math.min(6, cb.agiDebuff + 3); b.debuff = 'agi'; }
        if (f.intent === 'wail') { cb.atkDebuff = Math.min(4, cb.atkDebuff + 2); b.debuff = 'atk'; }
      }
    } else if (f.intent === 'howl') { for (const o of alive(cb)) o.buff += 2; b.buffAll = 2; }
    else if (f.intent === 'rally') { for (const o of alive(cb)) { o.hp = Math.min(o.max, o.hp + 8); o.buff += 1; } b.rally = 8; }
    beats.push(b);
    if (r.hero.hp <= 0) break;
  }
  for (const f of alive(cb)) { f.pi++; f.intent = pickIntent(f); }
}
