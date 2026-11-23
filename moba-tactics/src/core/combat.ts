import { BALANCE } from './config';
import { dist } from './math';
import type { Unit } from './unit';
import type { World } from './world';
import type { DmgType } from './types';
import type { DmgOpts } from './kits/types';
import { getKit } from './kits/registry';
import { hasItem } from './stats';
import { SYNERGIES } from '../data/champions';

/** Returns the champion responsible for damage from src (src itself or summon owner). */
export function ownerChamp(w: World, src: Unit | null | undefined): Unit | null {
  if (!src) return null;
  if (src.kind === 'champion') return src;
  if (src.kind === 'summon' && src.ownerId) {
    const o = w.get(src.ownerId);
    return o && o.kind === 'champion' ? o : null;
  }
  return null;
}

export function isEnemy(a: { team: number }, b: { team: number }): boolean {
  return a.team !== b.team;
}

function synergyBonus(w: World, champ: Unit, src: Unit, tgt: Unit): number {
  const team = w.teams[champ.team as 0 | 1];
  const ids = team.champIds.map((id) => w.get(id)!.champ!.defId);
  const me = champ.champ!.defId;
  const now = w.time;
  let b = 0;
  for (const s of SYNERGIES) {
    if (!(ids.includes(s.a) && ids.includes(s.b))) continue;
    if (me !== s.a && me !== s.b) continue;
    let ok = false;
    switch (s.a) {
      case 'liris': ok = tgt.rootUntil > now || tgt.stunUntil > now; break;
      case 'tharok': ok = tgt.isControlled(now); break;
      case 'boran': {
        if (me === 'edrin') {
          const bor = team.champIds.map((id) => w.get(id)!).find((x) => x.champ!.defId === 'boran');
          ok = !!bor && bor.alive && dist(bor.x, bor.y, champ.x, champ.y) < 600;
        }
        break;
      }
      case 'korruk': ok = tgt.isSlowed(now); break;
      case 'rughan': ok = (tgt.marks.poison ?? 0) > 0 && (tgt.marks.poisonUntil ?? 0) > now; break;
      case 'nekmar': ok = src.kind === 'summon'; break;
    }
    if (ok) b += BALANCE.synergyBonus;
  }
  return Math.min(BALANCE.synergyCap, b);
}

export function structureAttackable(w: World, s: Unit): boolean {
  if (!s.alive) return false;
  if (s.kind === 'tower') {
    if (s.tier === 'inner') {
      const outer = w.units.find((t) => t.kind === 'tower' && t.team === s.team && t.lane === s.lane && t.tier === 'outer');
      return !outer || !outer.alive;
    }
    return true;
  }
  if (s.kind === 'crystal') {
    for (const lane of ['top', 'bot']) {
      const lt = w.units.filter((t) => t.kind === 'tower' && t.team === s.team && t.lane === lane);
      if (lt.every((t) => !t.alive)) return true;
    }
    return false;
  }
  return true;
}

export function canTarget(w: World, src: Unit, tgt: Unit): boolean {
  if (!tgt.alive || tgt.team === src.team) return false;
  if (tgt.untargetableUntil > w.time) return false;
  if (tgt.isStructure && !structureAttackable(w, tgt)) return false;
  return true;
}

/** Core damage pipeline. Returns damage dealt to hp+shields. */
export function dealDamage(w: World, src: Unit, tgt: Unit, raw: number, type: DmgType, o: DmgOpts = {}): number {
  if (!tgt.alive || raw <= 0) return 0;
  if (tgt.isStructure && !structureAttackable(w, tgt)) return 0;
  if (tgt.untargetableUntil > w.time && !o.dot) return 0;
  const now = w.time;
  const champ = ownerChamp(w, src);
  let amt = raw;
  // percent based damage cap vs big monsters
  if (o.percent && (tgt.kind === 'boss' || tgt.kind === 'monster' || tgt.isStructure)) amt = Math.min(amt, BALANCE.bossPercentCap);

  // ---------- outgoing modifiers ----------
  let mul = 1;
  if (champ) {
    const c = champ.champ!;
    mul *= 1 + (champ.data.posEff ?? 0);
    const team = w.teams[champ.team as 0 | 1];
    if (tgt.kind === 'champion' && team.buffs.blood > now) mul *= 1 + team.buffs.bloodAmt;
    if (tgt.isStructure && src === champ && team.buffs.titan > now) mul *= 1 + team.buffs.titanTower;
    if (tgt.isStructure) {
      const minionNear = w.units.some((m) => m.alive && m.kind === 'minion' && m.team === champ.team && dist(m.x, m.y, tgt.x, tgt.y) <= BALANCE.towerRange);
      if (!minionNear) mul *= 1 - BALANCE.noMinionTowerReduction;
      else {
        mul *= BALANCE.champSiegeMul;
        if (hasItem(champ, 23) && src === champ) mul *= 1.15;
      }
    }
    if (hasItem(champ, 24)) {
      if (tgt.kind === 'monster') mul *= 1.2;
      else if (tgt.kind === 'boss') mul *= 1.08;
    }
    mul *= 1 + synergyBonus(w, champ, src, tgt);
    const kit = getKit(c.defId);
    if (kit.outgoingMul) mul *= kit.outgoingMul(w, champ, tgt, { ...o, srcSummon: src !== champ }, type);
    if (src.kind === 'summon') {
      if (hasItem(champ, 21) && src.data.living) mul *= 1.15;
      if (hasItem(champ, 22) && src.data.structure) mul *= 1.15;
    }
  }
  if (src.kind === 'minion' && tgt.isStructure) mul *= src.sub === 'siege' ? 4 : 1.6;
  // early tower fortification: towers take reduced damage during the first minutes
  if (tgt.kind === 'tower') {
    const m = now / 60;
    mul *= m < BALANCE.fortifyUntil ? BALANCE.fortifyMul : m < BALANCE.fortifyFade ? BALANCE.fortifyMul + (1 - BALANCE.fortifyMul) * ((m - BALANCE.fortifyUntil) / (BALANCE.fortifyFade - BALANCE.fortifyUntil)) : 1;
  }
  amt *= mul;

  // ---------- mitigation ----------
  if (type === 'phys') {
    let shred = 0;
    for (const s of tgt.armorShred) if (s.until > now) shred += s.amt;
    shred = Math.min(0.4, shred);
    let pen = src.kind === 'champion' ? src.stats.armorPen : 0;
    if (champ && src === champ) pen += getKit(champ.champ!.defId).armorIgnore?.(w, champ, tgt) ?? 0;
    const armor = Math.max(0, tgt.stats.armor * (1 - shred) * (1 - Math.min(0.6, pen)));
    amt *= 100 / (100 + armor);
  } else if (type === 'magic') {
    let shred = 0;
    for (const s of tgt.mrShred) if (s.until > now) shred += s.amt;
    shred = Math.min(0.4, shred);
    const pen = src.kind === 'champion' ? src.stats.mrPen : 0;
    const mr = Math.max(0, tgt.stats.mr * (1 - shred) * (1 - Math.min(0.6, pen)));
    amt *= 100 / (100 + mr);
  }

  // ---------- incoming modifiers ----------
  if (tgt.kind === 'champion') {
    if (champ && hasItem(tgt, 9) && o.attack) amt *= 0.92;
    if (champ && hasItem(tgt, 10) && type === 'magic') amt *= 0.92;
    const kit = getKit(tgt.champ!.defId);
    if (kit.incomingMul) {
      const m = kit.incomingMul(w, tgt, src, o, type);
      if (m <= 0) {
        w.emit({ t: 'block', id: tgt.id, tgt: src.id });
        return 0;
      }
      amt *= m;
    }
  }
  let red = 1;
  for (const r of tgt.dmgRed) if (r.until > now) red *= 1 - r.amt;
  amt *= Math.max(0.2, red);
  if (amt <= 0) return 0;

  // ---------- shields ----------
  let hpDmg = amt;
  if (tgt.shields.length) {
    const breaker = o.attack && champ && src === champ && hasItem(champ, 19) ? 1.4 : 1;
    let pool = hpDmg * breaker;
    for (const sh of tgt.shields) {
      if (sh.until <= now || pool <= 0) continue;
      const take = Math.min(sh.amount, pool);
      sh.amount -= take;
      pool -= take;
    }
    tgt.shields = tgt.shields.filter((s) => s.amount > 0.5 && s.until > now);
    hpDmg = pool / breaker;
  }
  tgt.hp -= hpDmg;
  const total = amt;

  // ---------- bookkeeping ----------
  tgt.lastHitBy = src.id;
  tgt.lastHitAt = now;
  if (champ && tgt.kind === 'champion') {
    tgt.champ!.damagedBy.set(champ.id, now);
    champ.champ!.dmgDealtChamps += total;
    champ.lastAttackedChampAt = now;
    if (src !== champ) src.lastAttackedChampAt = now;
  }
  if (tgt.champ) {
    tgt.champ.lastCombat = now;
    if (tgt.champ.recallUntil > 0) w.cancelRecall(tgt);
  }
  if (champ) champ.champ!.lastCombat = now;
  if (src.stealthUntil > now && !o.dot) src.stealthUntil = 0;

  w.emit({ t: 'dmg', id: tgt.id, tgt: src.id, v: Math.round(total), k: o.attack ? 'atk' : type });

  // ---------- sustain ----------
  if (champ && !o.dot) {
    if (o.attack && src === champ && champ.stats.lifesteal > 0) {
      const ls = champ.stats.lifesteal * (tgt.kind === 'minion' ? 0.5 : 1);
      heal(w, champ, total * ls, champ);
    }
    getKit(champ.champ!.defId).onDealDamage?.(w, champ, tgt, total, o);
  }
  if (tgt.kind === 'champion') {
    getKit(tgt.champ!.defId).onDamaged?.(w, tgt, src, total, o);
    // item 12 - Son Siper
    if (hasItem(tgt, 12) && tgt.hp > 0 && tgt.hp / tgt.stats.maxHp < 0.3 && (tgt.champ!.itemCd.i12 ?? -1) <= now) {
      tgt.champ!.itemCd.i12 = now + 75;
      addShield(w, tgt, tgt.stats.maxHp * 0.18, 3, 'i12');
    }
  }

  if (tgt.hp <= 0) {
    tgt.hp = 0;
    w.killUnit(tgt, src);
  }

  // ---------- item procs for ability hits ----------
  if (champ && o.ability && !o.noProc && !o.dot && o.ability !== 'item' && o.ability !== 'passive') {
    abilityItemProcs(w, champ, tgt, o.ability);
  }
  return total;
}

export function abilityItemProcs(w: World, champ: Unit, tgt: Unit, key: string) {
  const now = w.time;
  const c = champ.champ!;
  getKit(c.defId).onAbilityHit?.(w, champ, tgt, key);
  // 05 Yıldız Asası
  if (hasItem(champ, 5) && tgt.alive) {
    const mk = `i5_${champ.id}`;
    const lastKey = tgt.marks[mk + '_k'];
    const lastT = tgt.marks[mk + '_t'] ?? -99;
    const keyNum = key === 's1' ? 1 : key === 's2' ? 2 : 3;
    if (lastKey && lastKey !== keyNum && now - lastT < 5 && (tgt.marks[mk + '_cd'] ?? -1) <= now) {
      tgt.marks[mk + '_cd'] = now + 8;
      dealDamage(w, champ, tgt, 30, 'magic', { ability: 'item' });
      w.emit({ t: 'vfx', k: 'star', x: tgt.x, y: tgt.y });
    }
    tgt.marks[mk + '_k'] = keyNum;
    tgt.marks[mk + '_t'] = now;
  }
  // 06 Kor Mührü
  if (hasItem(champ, 6) && tgt.alive) {
    let total = tgt.stats.maxHp * 0.03;
    if (tgt.kind === 'boss' || tgt.kind === 'monster' || tgt.isStructure) total = Math.min(total, BALANCE.bossPercentCap);
    addDot(w, champ, tgt, total / 3, 3, 'magic', `i6_${champ.id}`, true);
  }
  // 08 Ayaz Tacı
  if (hasItem(champ, 8) && tgt.alive && (tgt.marks[`i8_${champ.id}`] ?? -1) <= now) {
    tgt.marks[`i8_${champ.id}`] = now + 5;
    slow(w, tgt, 0.15, 1.2);
  }
  // 18 Solgun Mühür
  if (hasItem(champ, 18)) grievous(w, tgt, 0.35, 3);
  // 20 Delici Mühür
  if (hasItem(champ, 20)) addShred(tgt.mrShred, 0.12, now + 3, `i20_${champ.id}`);
  // 15 Tetik Bileziği flag set on cast (see world.castSkill)
}

export function heal(w: World, tgt: Unit, amount: number, _src: Unit | null) {
  if (!tgt.alive || amount <= 0) return 0;
  let g = 0;
  for (const gr of tgt.grievous) if (gr.until > w.time) g = Math.max(g, gr.amt); // strongest only, no stacking
  const a = Math.min(amount * (1 - g), tgt.stats.maxHp - tgt.hp);
  if (a <= 0) return 0;
  tgt.hp += a;
  if (a >= 8) w.emit({ t: 'heal', id: tgt.id, v: Math.round(a) });
  return a;
}

export function addShield(w: World, u: Unit, amount: number, dur: number, src: string) {
  u.shields.push({ amount, until: w.time + dur, src });
  w.emit({ t: 'vfx', k: 'shield', id: u.id, x: u.x, y: u.y, dur });
}

export function addShred(list: { amt: number; until: number; key: string }[], amt: number, until: number, key: string) {
  const ex = list.find((s) => s.key === key);
  if (ex) { ex.amt = Math.max(ex.amt, amt); ex.until = Math.max(ex.until, until); }
  else list.push({ amt, until, key });
}

export function slow(w: World, u: Unit, amt: number, dur: number) {
  if (!u.alive || u.isStructure) return;
  if (u.kind === 'boss') amt *= 0.4;
  u.slows.push({ amt, until: w.time + dur });
}
export function stun(w: World, u: Unit, dur: number) {
  if (!u.alive || u.isStructure) return;
  if (u.kind === 'boss') dur *= 0.3;
  u.stunUntil = Math.max(u.stunUntil, w.time + dur);
  u.windupUntil = 0;
  if (u.champ?.recallUntil) w.cancelRecall(u);
  w.emit({ t: 'status', id: u.id, k: 'stun', dur });
}
export function root(w: World, u: Unit, dur: number) {
  if (!u.alive || u.isStructure) return;
  if (u.kind === 'boss') dur *= 0.3;
  u.rootUntil = Math.max(u.rootUntil, w.time + dur);
  w.emit({ t: 'status', id: u.id, k: 'root', dur });
}
export function knockup(w: World, u: Unit, dur: number) {
  if (!u.alive || u.isStructure) return;
  if (u.kind === 'boss') dur *= 0.3;
  u.knockupUntil = Math.max(u.knockupUntil, w.time + dur);
  u.windupUntil = 0;
  if (u.champ?.recallUntil) w.cancelRecall(u);
  w.emit({ t: 'status', id: u.id, k: 'knockup', dur });
}
export function grievous(w: World, u: Unit, amt: number, dur: number) {
  u.grievous = u.grievous.filter((g) => g.until > w.time);
  u.grievous.push({ amt, until: w.time + dur });
}
export function addDot(w: World, src: Unit, tgt: Unit, perSec: number, dur: number, type: DmgType, key: string, abil: boolean) {
  const ex = tgt.dots.find((d) => d.key === key);
  if (ex) { ex.perSec = Math.max(ex.perSec, perSec); ex.until = w.time + dur; ex.srcId = src.id; return; }
  tgt.dots.push({ srcId: src.id, perSec, type, until: w.time + dur, key, tickAcc: 0, abil });
}
