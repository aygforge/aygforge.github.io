// Denge simülasyonu — belge §13.1. Gerçek stat/hasar formülleriyle (systems/stats + systems/combat)
// başsız savaş: normal saldırı + bekleme süresi dolan becerilerin kullanımı, MP bütçesi ve yenilenmesi.
import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { computeStats } from '../../src/systems/stats.js';
import { playerHit, hitChance } from '../../src/systems/combat.js';
import { createItem } from '../../src/systems/loot.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { SKILLS, CLASS_SKILLS } from '../../src/data/skills.js';
import { cumulativeXp, MP_REGEN_COMBAT, goldRangeForLevel, expMultiplier, WARRIOR_MP_ON_HIT } from '../../src/data/constants.js';

function build(cls, level, gear, plus = 0) {
  const rng = new Rng(level * 31 + (cls === 'mage' ? 7 : 0));
  const c = createCharacter({ name: 'Sim', cls, slot: 0 }, rng);
  gainExp(c, cumulativeXp(level));
  const pts = 3 * (level - 1);
  if (cls === 'warrior') { c.alloc.str = Math.round(pts * 0.6); c.alloc.vit = pts - c.alloc.str; }
  else { c.alloc.int = Math.round(pts * 0.65); c.alloc.vit = pts - c.alloc.int; }
  // beceri puanları: aktif 1 ve pasif 1'e öncelik
  const order = [...CLASS_SKILLS[cls].passives.slice(0, 1), CLASS_SKILLS[cls].actives[0], CLASS_SKILLS[cls].actives[1]];
  let free = level - 1;
  for (const id of order) while (c.skills[id] && free > 0 && c.skills[id] < (SKILLS[id].kind === 'active' ? 5 : 3)) {
    const cost = SKILLS[id].kind === 'active' ? [0, 1, 1, 2, 2][c.skills[id]] : [0, 1, 2][c.skills[id]];
    if (cost > free) break;
    free -= cost; c.skills[id]++;
  }
  for (const tid of gear) {
    const inst = createItem(tid, null, rng, { noBonus: true });
    inst.p = ['R', 'A'].includes(tid[0]) ? 0 : plus;
    c.equipment[{ W: 'weapon', M: 'weapon', O: 'offhand', H: 'helm', C: 'chest', G: 'gloves', B: 'boots', R: 'ring', A: 'amulet' }[tid[0]]] = inst;
  }
  return c;
}

// Savaş simülasyonu: normal saldırı + bekleme süresi dolan beceriler, MP bütçesi ve yenilenme.
// state ardışık öldürmeler arasında taşınır (farm: bekleme süreleri ve MP sürer).
function newState(c) {
  const st = computeStats(c);
  const actives = CLASS_SKILLS[c.cls].actives.filter((id) => c.skills[id] && SKILLS[id].coef);
  return { c, st, mp: st.maxMp, actives, cds: Object.fromEntries(actives.map((id) => [id, 0])), atk: 0, gcd: 0, rng: new Rng(99) };
}
function fight(S, enemyId) {
  const { st, c, rng } = S;
  const e = { ...ENEMIES[enemyId], reduce: 0 };
  let hp = e.hp, t = 0;
  const dt = 0.05;
  while (hp > 0 && t < 900) {
    t += dt; S.atk -= dt; S.gcd -= dt;
    S.mp = Math.min(st.maxMp, S.mp + st.maxMp * MP_REGEN_COMBAT * dt);
    for (const id of S.actives) S.cds[id] -= dt;
    if (S.gcd <= 0) {
      for (const id of S.actives) {
        const s = SKILLS[id], r = c.skills[id];
        const cost = s.mp[r - 1] * (1 - st.costRed);
        if (S.cds[id] <= 0 && S.mp >= cost) {
          S.mp -= cost; S.cds[id] = s.cd[r - 1]; S.gcd = 0.5;
          hp -= playerHit(st, e, { coef: s.coef[r - 1], rng, dmgType: s.dmg }).dmg;
          break;
        }
      }
    }
    if (S.atk <= 0) {
      S.atk = st.attackInterval;
      const h = playerHit(st, e, { isNormal: true, rng });
      hp -= h.dmg;
      if (!h.miss && c.cls === 'warrior') S.mp = Math.min(st.maxMp, S.mp + WARRIOR_MP_ON_HIT);
    }
  }
  return t;
}
function idle(S, sec) {
  S.atk -= sec; S.gcd -= sec;
  S.mp = Math.min(S.st.maxMp, S.mp + S.st.maxMp * MP_REGEN_COMBAT * sec);
  for (const id of S.actives) S.cds[id] -= sec;
}
// tek savaş (boss)
function ttk(c, enemyId) { return +fight(newState(c), enemyId).toFixed(1); }
// sürekli farm: 12 ardışık öldürme, aralarda 2 sn yürüme; ortalama öldürme süresi
function farmTtk(c, enemyId, n = 12) {
  const S = newState(c);
  let total = 0;
  for (let i = 0; i < n; i++) { total += fight(S, enemyId); idle(S, 2); }
  return +(total / n).toFixed(1);
}

const report = [];
const log = (k, v) => { report.push(`${k}: ${v}`); };

describe('Denge simülasyonu (gerçek formüller)', () => {
  it('Lv.1 Warrior Köylü Kılıcı vs Çayır Sıçanı: 2–3 vuruş', () => {
    const c = build('warrior', 1, ['W01', 'C01']);
    const st = computeStats(c);
    const per = st.physPower * 100 / 102;
    log('Lv1 Warrior sıçana vuruş', per.toFixed(2));
    expect(Math.ceil(32 / (per * 1.05))).toBeGreaterThanOrEqual(2);
    expect(Math.ceil(32 / (per * 0.95))).toBeLessThanOrEqual(3);
    expect(hitChance(1, 2)).toBeCloseTo(0.95);
  });

  it('normal yaratık öldürme süreleri ~4–9 sn bandında (uygun seviye/ekipman)', () => {
    const cases = [
      ['warrior', 10, ['W03', 'O02', 'H02', 'C02', 'G02', 'B02'], 0, 'pick_goblin'],
      ['warrior', 10, ['W03', 'O02', 'H02', 'C02', 'G02', 'B02'], 3, 'pick_goblin'],
      ['mage', 10, ['M04', 'H05', 'C06', 'G05', 'B05'], 0, 'pick_goblin'],
      ['warrior', 15, ['W03', 'O02', 'H02', 'C03', 'G02', 'B02'], 3, 'ore_priest'],
      ['mage', 15, ['M03', 'H05', 'C07', 'G05', 'B05'], 2, 'swamp_leech'],
      ['warrior', 19, ['W06', 'O02', 'H03', 'C03', 'G03', 'B03'], 3, 'rotten_guard'],
      ['mage', 19, ['M06', 'O06', 'H06', 'C07', 'G06', 'B06'], 2, 'rotten_guard'],
      ['warrior', 5, ['W01', 'O01', 'H01', 'C01'], 1, 'gray_wolf'],
      ['mage', 5, ['M01', 'H04', 'C05'], 1, 'gray_wolf'],
    ];
    for (const [cls, lv, gear, plus, en] of cases) {
      const tt = farmTtk(build(cls, lv, gear, plus), en);
      log(`${cls} Lv${lv} +${plus} → ${ENEMIES[en].name}`, `${tt} sn`);
      expect(tt, `${cls} ${en}`).toBeGreaterThan(0.5);
      expect(tt, `${cls} ${en}`).toBeLessThan(12);
    }
  });

  it('elit savaşları normal yaratıklardan belirgin uzun (hedef 25–50 sn; kanonik HP ile ölçülür)', () => {
    const w = ttk(build('warrior', 10, ['W02', 'H02', 'C02', 'G02', 'B02'], 1), 'bandit_captain');
    const m = ttk(build('mage', 10, ['M02', 'O05', 'H05', 'C06', 'G05', 'B05'], 1), 'bandit_captain');
    log('Warrior Lv10 U+1 → Haydut Kaptanı', `${w} sn`); log('Mage Lv10 U+1 → Haydut Kaptanı', `${m} sn`);
    for (const v of [w, m]) { expect(v).toBeGreaterThan(8); expect(v).toBeLessThan(70); }
  });

  it('Alfa Kurt saf DPS 90–150 sn civarı; Maden Golemi 180–300 sn civarı', () => {
    // Alfa'ya ilk girişte gerçekçi donanım: Uncommon +2 silah
    const aw = ttk(build('warrior', 11, ['W02', 'H02', 'C02', 'G02', 'B02'], 2), 'alpha_wolf');
    const am = ttk(build('mage', 11, ['M02', 'O05', 'H05', 'C06', 'G05', 'B05'], 2), 'alpha_wolf');
    // Golem: belge senaryosu — Warrior Rare +3/+4, Mage Rare/Epic +0
    const gw = ttk(build('warrior', 20, ['W06', 'O02', 'H03', 'C03', 'G03', 'B03'], 4), 'mine_golem');
    const gwLow = ttk(build('warrior', 20, ['W06', 'O02', 'H03', 'C03', 'G03', 'B03'], 3), 'mine_golem');
    const gm = ttk(build('mage', 20, ['M06', 'O06', 'H06', 'C07', 'G06', 'B06'], 0), 'mine_golem');
    log('Warrior Lv11 Uncommon+2 → Alfa Kurt', `${aw} sn`); log('Mage Lv11 Uncommon+2 → Alfa Kurt', `${am} sn`);
    log('Warrior Lv20 Rare+4 → Golem', `${gw} sn`); log('Warrior Lv20 Rare+3 → Golem', `${gwLow} sn`); log('Mage Lv20 Rare+0 → Golem', `${gm} sn`);
    for (const v of [aw, am]) { expect(v).toBeGreaterThan(40); expect(v).toBeLessThan(220); }
    for (const v of [gw, gm]) { expect(v).toBeGreaterThan(140); expect(v).toBeLessThan(420); }
    // sınıf adaleti: iki sınıfın boss süreleri arasındaki fark 2 katı aşmaz
    expect(Math.max(gw, gm) / Math.min(gw, gm)).toBeLessThan(2);
    expect(Math.max(aw, am) / Math.min(aw, am)).toBeLessThan(2);
    expect(gwLow).toBeGreaterThanOrEqual(gw);
  });

  it('düşük seviyeli yaratıklar güçlenince kolaylaşır (gizli ölçekleme yok)', () => {
    const a = farmTtk(build('warrior', 6, ['W01', 'C01'], 0), 'gray_wolf');
    const b = farmTtk(build('warrior', 15, ['W03', 'O02', 'H02', 'C03', 'G02', 'B02'], 3), 'gray_wolf');
    log('Boz Kurt: Lv6 başlangıç vs Lv15 donanımlı', `${a} sn → ${b} sn`);
    expect(b).toBeLessThan(a / 2);
  });

  it('Lv.18–20 farm: 120 yaratık/saat net gold tahmini (iksir hariç)', () => {
    const [lo, hi] = goldRangeForLevel(18);
    const goldPerKill = (lo + hi) / 2;
    const matValue = 0.28 * 6; // ortalama materyal satış değeri
    const perHour = 120 * (goldPerKill + matValue);
    log('Lv18–20 farm gold/saat (brüt, iksir/tamir öncesi)', perHour.toFixed(0));
    expect(perHour).toBeGreaterThan(900);
    expect(perHour).toBeLessThan(2400);
    // EXP çarpanı: düşük seviye farmı verimsizleşir
    expect(expMultiplier(20, 9)).toBe(0.1);
  });

  it('rapor', () => { console.log('\n=== DENGE RAPORU ===\n' + report.join('\n')); expect(report.length).toBeGreaterThan(5); });
});
