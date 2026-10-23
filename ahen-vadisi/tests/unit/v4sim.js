// V4 denge simülasyonu yardımcıları — dört sınıf, gerçek stat/hasar formülleri (systems/stats + systems/combat).
// Başsız savaş modeli eski denge testleriyle aynı: normal saldırı + bekleme süresi dolan hasar becerileri,
// MP bütçesi ve yenilenmesi. V4 eklemeleri: Okçu Delici Ok (DEF yok sayma) ve Avcı İşareti (hasar +%10),
// Ölü Çağıran Ruh Hasadı (vuruş başına MP) ve iskelet yardımcı (gerçek iskelet statlarıyla ayrı vuruş döngüsü).
import { Rng } from '../../src/core/rng.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { computeStats, MINION } from '../../src/systems/stats.js';
import { playerHit, defenseFactor, hitChance } from '../../src/systems/combat.js';
import { createItem } from '../../src/systems/loot.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { ITEMS } from '../../src/data/items.js';
import { SKILLS, CLASS_SKILLS } from '../../src/data/skills.js';
import { cumulativeXp, MP_REGEN_COMBAT, WARRIOR_MP_ON_HIT } from '../../src/data/constants.js';

export const CLS4 = ['warrior', 'mage', 'archer', 'necromancer'];
// stat dağıtımı: ana stat %60–65, kalan VIT (Okçu: DEX %60, STR %10, VIT %30)
export const ALLOC = {
  warrior: (p) => ({ str: Math.round(p * 0.6), dex: 0, int: 0, vit: p - Math.round(p * 0.6) }),
  mage: (p) => ({ str: 0, dex: 0, int: Math.round(p * 0.65), vit: p - Math.round(p * 0.65) }),
  archer: (p) => ({ str: Math.round(p * 0.1), dex: Math.round(p * 0.6), int: 0, vit: p - Math.round(p * 0.1) - Math.round(p * 0.6) }),
  necromancer: (p) => ({ str: 0, dex: 0, int: Math.round(p * 0.65), vit: p - Math.round(p * 0.65) }),
};

export function build(cls, level, gear, plus = 3, { bonuses = true, mastery = level >= 20, mastery2 = level >= 40, mastery3 = level >= 50 } = {}) {
  const rng = new Rng(level * 31 + CLS4.indexOf(cls) * 7);
  const c = createCharacter({ name: 'Sim', cls, slot: 0 }, rng);
  gainExp(c, cumulativeXp(level));
  c.alloc = ALLOC[cls](3 * (level - 1));
  c.mastery = mastery; c.mastery2 = mastery2; c.mastery3 = mastery3;
  // bütün beceri puanları: pasifler, sonra hasar becerileri (sınıf görevleri +2)
  const order = [...CLASS_SKILLS[cls].passives, ...CLASS_SKILLS[cls].actives.filter((id) => SKILLS[id].coef || id === 'summon_skeleton')];
  let free = level - 1 + (level >= 20 ? 2 : level >= 10 ? 1 : 0);
  for (const id of order) while (c.skills[id] && free > 0 && c.skills[id] < (SKILLS[id].kind === 'active' ? 5 : 3)) {
    const cost = SKILLS[id].kind === 'active' ? [0, 1, 1, 2, 2][c.skills[id]] : [0, 1, 2][c.skills[id]];
    if (cost > free) break;
    free -= cost; c.skills[id]++;
  }
  for (const k of Object.keys(c.equipment)) c.equipment[k] = null;
  for (const tid of gear) {
    const t = ITEMS[tid];
    const inst = createItem(tid, null, rng, { noBonus: !bonuses });
    inst.p = t.slot === 'ring' || t.slot === 'amulet' ? 0 : plus;
    c.equipment[t.slot] = inst;
  }
  return c;
}

// İskelet katkısı: iskelet statlarıyla normal vuruş (isabet + varyans + kritik dahil), saniyedeki ortalama
export function minionDps(c, enemyId) {
  const st = computeStats(c);
  if (!st.minion) return 0;
  const e = ENEMIES[enemyId];
  const m = st.minion;
  return (m.power * defenseFactor(MINION.dmgType === 'magic' ? e.mdef : e.def) * (1 + m.critChance * 0.5) * hitChance(m.level, e.level)) / m.attackInterval;
}

export function newState(c, { minion = true, minionUptime = 1 } = {}) {
  const st = computeStats(c);
  const actives = CLASS_SKILLS[c.cls].actives.filter((id) => c.skills[id] && (SKILLS[id].coef || id === 'hunter_mark'));
  return { c, st, mp: st.maxMp, actives, cds: Object.fromEntries(actives.map((id) => [id, 0])), atk: 0, gcd: 0, rng: new Rng(99), markUntil: -1, t: 0,
    minion: minion && !!st.minion, minionUptime, mAtk: 0.6, dmgOwn: 0, dmgMinion: 0 };
}

export function fight(S, enemyId) {
  const { st, c, rng } = S;
  const e = { ...ENEMIES[enemyId], reduce: 0 };
  let hp = e.hp, t = 0;
  const dt = 0.05;
  const ms = st.minion ? { power: st.minion.power, damageType: MINION.dmgType, dmgMult: 1, species: {}, critChance: st.minion.critChance, level: st.minion.level, slowedDmg: 0 } : null;
  while (hp > 0 && t < 1500) {
    t += dt; S.t += dt; S.atk -= dt; S.gcd -= dt; S.mAtk -= dt;
    S.mp = Math.min(st.maxMp, S.mp + st.maxMp * MP_REGEN_COMBAT * dt);
    for (const id of S.actives) S.cds[id] -= dt;
    const mark = S.t < S.markUntil ? SKILLS.hunter_mark.bonus[(c.skills.hunter_mark || 1) - 1] : 0;
    if (S.gcd <= 0) {
      for (const id of S.actives) {
        const s = SKILLS[id], r = c.skills[id];
        const cost = s.mp[r - 1] * (1 - st.costRed);
        if (S.cds[id] <= 0 && S.mp >= cost) {
          S.mp -= cost; S.cds[id] = s.cd[r - 1]; S.gcd = 0.5;
          if (id === 'hunter_mark') { S.markUntil = S.t + s.dur[r - 1]; break; }
          const d = playerHit(st, e, { coef: s.coef[r - 1], rng, dmgType: s.dmg, defIgnore: s.defIgnore || 0, markBonus: mark }).dmg;
          hp -= d; S.dmgOwn += d;
          break;
        }
      }
    }
    if (S.atk <= 0) {
      S.atk = st.attackInterval;
      const h = playerHit(st, e, { isNormal: true, rng, markBonus: mark });
      hp -= h.dmg; S.dmgOwn += h.dmg;
      if (!h.miss && c.cls === 'warrior') S.mp = Math.min(st.maxMp, S.mp + WARRIOR_MP_ON_HIT);
      if (!h.miss && st.mpOnHit) S.mp = Math.min(st.maxMp, S.mp + st.mpOnHit);
    }
    if (S.minion && ms && S.mAtk <= 0) {
      S.mAtk = st.minion.attackInterval;
      if (rng.float() < S.minionUptime) {
        const h = playerHit(ms, e, { isNormal: true, rng, dmgType: MINION.dmgType });
        hp -= h.dmg; S.dmgMinion += h.dmg;
      }
    }
  }
  return t;
}

export function idle(S, sec) {
  S.atk -= sec; S.gcd -= sec; S.t += sec;
  S.mp = Math.min(S.st.maxMp, S.mp + S.st.maxMp * MP_REGEN_COMBAT * sec);
  for (const id of S.actives) S.cds[id] -= sec;
}

export function ttk(c, enemyId, opts) { return +fight(newState(c, opts), enemyId).toFixed(1); }
export function farmTtk(c, enemyId, n = 12, opts) {
  const S = newState(c, opts);
  let total = 0;
  for (let i = 0; i < n; i++) { total += fight(S, enemyId); idle(S, 2); }
  return { t: +(total / n).toFixed(1), mpLeft: S.mp / S.st.maxMp, minionShare: S.dmgMinion / Math.max(1, S.dmgOwn) };
}

// telegrafsız normal saldırılara karşı iksirsiz ölüm süresi (kaçınma dahil)
export function survive(c, enemyId) {
  const st = computeStats(c), e = ENEMIES[enemyId];
  const def = e.dmgType === 'magic' ? st.mdef : st.def;
  const dps = (e.atk * (e.normalCoef ?? 1) * 100 / (100 + def)) * (1 - (st.evade || 0)) * (1 - (st.passiveReduce || 0)) / e.attackInterval;
  return +(st.maxHp / dps).toFixed(1);
}

// Seviyeye uygun tipik donanım (Rare/Uncommon ağırlıklı; Legendary yok)
export const GEAR = {
  10: { warrior: ['W03', 'O02', 'H02', 'C02', 'G02', 'B02', 'R02', 'A03'], mage: ['M02', 'O05', 'H05', 'C06', 'G05', 'B05', 'R03', 'A02'],
    archer: ['Y03', 'YO01', 'YH01', 'YC01', 'YG01', 'YB01', 'R02', 'A03'], necromancer: ['K03', 'KO01', 'KH01', 'KC01', 'KG01', 'KB01', 'R03', 'A02'] },
  20: { warrior: ['W06', 'O02', 'H03', 'C03', 'G03', 'B03', 'R05', 'A05'], mage: ['M06', 'O06', 'H06', 'C07', 'G06', 'B06', 'R05', 'A05'],
    archer: ['Y05', 'YO02', 'YH02', 'YC02', 'YG02', 'YB02', 'R05', 'A05'], necromancer: ['K05', 'KO02', 'KH02', 'KC02', 'KG02', 'KB02', 'R05', 'A05'] },
  30: { warrior: ['W12', 'O07', 'H08', 'C09', 'G07', 'B07', 'R07', 'A07'], mage: ['M12', 'O09', 'H10', 'C11', 'G08', 'B08', 'R07', 'A07'],
    archer: ['Y07', 'YO03', 'YH03', 'YC03', 'YG03', 'YB03', 'R07', 'A07'], necromancer: ['K07', 'KO03', 'KH03', 'KC03', 'KG03', 'KB03', 'R07', 'A07'] },
  40: { warrior: ['W17', 'O11', 'H11', 'C13', 'G09', 'B09', 'R09', 'A11'], mage: ['M17', 'O13', 'H13', 'C15', 'G10', 'B10', 'R11', 'A11'],
    archer: ['Y09', 'YO03', 'YH05', 'YC03', 'YG03', 'YB03', 'R09', 'A11'], necromancer: ['K09', 'KO03', 'KH03', 'KC03', 'KG05', 'KB03', 'R11', 'A11'] },
  45: { warrior: ['W20', 'O12', 'H12', 'C14', 'G09', 'B09', 'R13', 'A13'], mage: ['M20', 'O14', 'H14', 'C16', 'G10', 'B10', 'R13', 'A13'],
    archer: ['Y10', 'YO04', 'YH04', 'YC05', 'YG04', 'YB04', 'R13', 'A13'], necromancer: ['K10', 'KO04', 'KH05', 'KC04', 'KG04', 'KB04', 'R13', 'A13'] },
  50: { warrior: ['W21', 'O12', 'H12', 'C17', 'G09', 'B09', 'R14', 'A14'], mage: ['M21', 'O14', 'H14', 'C18', 'G10', 'B10', 'R14', 'A14'],
    archer: ['Y10', 'YO04', 'YH04', 'YC04', 'YG04', 'YB04', 'R14', 'A14'], necromancer: ['K10', 'KO04', 'KH04', 'KC04', 'KG04', 'KB04', 'R14', 'A14'] },
};
export function gearFor(cls, lv) {
  const k = [50, 45, 40, 30, 20, 10].find((x) => lv >= x) || 10;
  return GEAR[k][cls];
}
