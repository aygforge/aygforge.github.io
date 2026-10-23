// V3 denge simülasyonu — Lv.31–40. Gerçek stat/hasar formülleri (balance.test.js ile aynı başsız savaş modeli).
import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { computeStats } from '../../src/systems/stats.js';
import { playerHit, hitChance, enemyHit } from '../../src/systems/combat.js';
import { createItem } from '../../src/systems/loot.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { SKILLS, CLASS_SKILLS } from '../../src/data/skills.js';
import { cumulativeXp, MP_REGEN_COMBAT, goldRangeForLevel, expMultiplier, WARRIOR_MP_ON_HIT } from '../../src/data/constants.js';

function build(cls, level, gear, plus = 0, fullSkills = false) {
  const rng = new Rng(level * 31 + (cls === 'mage' ? 7 : 0));
  const c = createCharacter({ name: 'Sim', cls, slot: 0 }, rng);
  gainExp(c, cumulativeXp(level));
  const pts = 3 * (level - 1);
  if (cls === 'warrior') { c.alloc.str = Math.round(pts * 0.6); c.alloc.vit = pts - c.alloc.str; }
  else { c.alloc.int = Math.round(pts * 0.65); c.alloc.vit = pts - c.alloc.int; }
  // beceri puanları: aktif 1 ve pasif 1'e öncelik
  // V2 senaryoları: Lv.21+ oyuncu bütün puanlarını harcar (pasifler, sonra hasar becerileri)
  const order = fullSkills
    ? [...CLASS_SKILLS[cls].passives, ...CLASS_SKILLS[cls].actives.filter((id) => SKILLS[id].coef)]
    : [...CLASS_SKILLS[cls].passives.slice(0, 1), CLASS_SKILLS[cls].actives[0], CLASS_SKILLS[cls].actives[1]];
  let free = level - 1 + (fullSkills ? 2 : 0);
  for (const id of order) while (c.skills[id] && free > 0 && c.skills[id] < (SKILLS[id].kind === 'active' ? 5 : 3)) {
    const cost = SKILLS[id].kind === 'active' ? [0, 1, 1, 2, 2][c.skills[id]] : [0, 1, 2][c.skills[id]];
    if (cost > free) break;
    free -= cost; c.skills[id]++;
  }
  for (const tid of gear) {
    const inst = createItem(tid, null, rng, { noBonus: !fullSkills });   // V2 senaryoları: gerçek rastgele bonuslarla
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
const MOVE = { warrior: 1.2, mage: 1.3 };   // telegraflardan kaçma / konumlanma payı (V2 testiyle aynı)
// seviyeye uygun V3 donanımı (Rare/Uncommon, rastgele bonuslu); bütün beceri puanları harcanmış karakter
const gear = (cls, lv) => {
  if (cls === 'warrior') return lv < 34 ? ['W14', 'O11', 'H11', 'C13', 'G07', 'B07', 'R09', 'A09'] : lv < 37 ? ['W15', 'O11', 'H11', 'C13', 'G09', 'B09', 'R09', 'A09'] : ['W17', 'O11', 'H11', 'C13', 'G09', 'B09', 'R09', 'A11'];
  return lv < 34 ? ['M14', 'O13', 'H13', 'C15', 'G08', 'B08', 'R09', 'A09'] : lv < 37 ? ['M15', 'O13', 'H13', 'C15', 'G10', 'B10', 'R11', 'A09'] : ['M17', 'O13', 'H13', 'C15', 'G10', 'B10', 'R11', 'A11'];
};
const MOBS = [['shroud_crawler', 31], ['bone_archer', 32], ['cursed_guard', 33], ['grave_mage', 34], ['obsidian_sentinel', 36], ['shadow_hunter', 37], ['throne_executioner', 38], ['void_priest', 39]];

describe('V3 denge simülasyonu (gerçek formüller)', () => {
  it('normal yaratıklar ~5–12 sn (Lv.31–39, seviyeye uygun Rare +3; iki sınıf)', () => {
    let expPerHour = 0;
    for (const [id, lv] of MOBS) {
      const w = farmTtk(build('warrior', lv, gear('warrior', lv), 3, true), id);
      const m = farmTtk(build('mage', lv, gear('mage', lv), 3, true), id);
      log(`V3 farm ${ENEMIES[id].name} (Lv.${lv})`, `Warrior ${w} sn · Mage ${m} sn`);
      // alt sınır: menzilli/kaçan yaratıkların (okçu, sürüngen) davranışı başsız simülasyonda yoktur
      for (const v of [w, m]) { expect(v, id).toBeGreaterThan(3.5); expect(v, id).toBeLessThan(12.5); }
      expPerHour += 120 * ENEMIES[id].exp / MOBS.length;
    }
    // 30→40 (1.006.820 EXP) − V3 görev EXP'si (251.000); ~120 öldürme/saat + boss/zindan/görev ~4 sa
    const farmH = (1006820 - 251000) / expPerHour;
    log('V3 30→40 tahmini', `${farmH.toFixed(1)} sa farm + ~4 sa görev/boss/zindan = ~${(farmH + 4).toFixed(1)} sa`);
    expect(farmH + 4).toBeGreaterThan(8);
    expect(farmH + 4).toBeLessThan(14);
  });

  it('elitler 35–75 sn (hareket payıyla)', () => {
    for (const [id, lv] of [['shroud_hunter', 34], ['obsidian_executioner', 39]]) {
      const w = ttk(build('warrior', lv, gear('warrior', lv), 3, true), id) * MOVE.warrior;
      const m = ttk(build('mage', lv, gear('mage', lv), 3, true), id) * MOVE.mage;
      log(`V3 elit ${ENEMIES[id].name} (Lv.${lv})`, `Warrior ${w.toFixed(0)} sn · Mage ${m.toFixed(0)} sn`);
      for (const v of [w, m]) { expect(v, id).toBeGreaterThan(35); expect(v, id).toBeLessThan(75); }
    }
  });

  it('Mezar Komutanı 3–5 dk, Kayıp Kral 4–6 dk (çağrılar, bayrak ve mühürler dahil)', () => {
    const cw = build('warrior', 35, ['W15', 'O11', 'H11', 'C13', 'G09', 'B09', 'R09', 'A09'], 4, true);
    const cm = build('mage', 35, ['M15', 'O13', 'H13', 'C15', 'G10', 'B10', 'R11', 'A09'], 3, true);
    const kw = build('warrior', 40, ['W16', 'O11', 'H12', 'C13', 'G09', 'B09', 'R10', 'A10'], 4, true);
    const km = build('mage', 40, ['M16', 'O14', 'H14', 'C15', 'G10', 'B10', 'R11', 'A10'], 3, true);
    // Komutan: 2 Kemik Çağrısı (4 asker) + 1 bayrak; Kral: Kırık Taç'ta 2 kadim mühür (kalkan %85 azaltma, önce kırılır)
    const extraC = (c) => 4 * ttk(c, 'bone_soldier') + ttk(c, 'cursed_banner');
    const extraK = (c) => 2 * ttk(c, 'king_seal');
    const a = (ttk(cw, 'grave_commander') + extraC(cw)) * MOVE.warrior, b = (ttk(cm, 'grave_commander') + extraC(cm)) * MOVE.mage;
    const c = (ttk(kw, 'lost_king') + extraK(kw)) * MOVE.warrior, d = (ttk(km, 'lost_king') + extraK(km)) * MOVE.mage;
    log('Mezar Komutanı (Lv.35, Rare +3/+4)', `Warrior ${(a / 60).toFixed(1)} dk · Mage ${(b / 60).toFixed(1)} dk`);
    log('Kayıp Kral (Lv.40, Epic/Rare +3/+4)', `Warrior ${(c / 60).toFixed(1)} dk · Mage ${(d / 60).toFixed(1)} dk`);
    for (const v of [a, b]) { expect(v).toBeGreaterThan(180); expect(v).toBeLessThan(300); }
    for (const v of [c, d]) { expect(v).toBeGreaterThan(240); expect(v).toBeLessThan(360); }
    expect(Math.max(c, d) / Math.min(c, d)).toBeLessThan(1.6);
  });

  it('hayatta kalma: telegrafsız normal saldırılara karşı iksirsiz ölüm süresi (V3 yaratıkları ölümcül ama adil)', () => {
    const surv = (c, id) => {
      const st = computeStats(c), e = ENEMIES[id];
      const def = e.dmgType === 'magic' ? st.mdef : st.def;
      const dps = (e.atk * (e.normalCoef ?? 1) * 100 / (100 + def)) / e.attackInterval;
      return +(st.maxHp / dps).toFixed(1);
    };
    for (const [id, lv] of MOBS) {
      const w = surv(build('warrior', lv, gear('warrior', lv), 3, true), id);
      const m = surv(build('mage', lv, gear('mage', lv), 3, true), id);
      log(`hayatta kalma vs ${ENEMIES[id].name}`, `Warrior ${w} sn · Mage ${m} sn`);
      expect(w, id).toBeGreaterThan(12); expect(m, id).toBeGreaterThan(7);
    }
  });

  it('Sarsılmaz Öfke + Demir Deri + İrade + Ustalık II azaltması %60 sınırını aşmaz', () => {
    const e = { atk: 400, level: 40, dmgType: 'phys' };
    const st = { def: 0, mdef: 0, level: 40 };
    const rng = new Rng(1);
    const full = enemyHit(e, st, { coef: 1, rng, buffs: {} }).dmg;
    // gerçek en yüksek yığın (Demir Deri R5 %35 + İrade %15 + Öfke %10 + Savaşın Mirası %4) = %52,3 → sınırın altında
    const real = enemyHit(e, st, { coef: 1, rng, buffs: { reduce: 0.35, willReduce: 0.15, furyReduce: 0.10, passiveReduce: 0.04 } }).dmg;
    // yapay aşırı yığın sınırda kesilir
    const capped = enemyHit(e, st, { coef: 1, rng, buffs: { reduce: 0.5, willReduce: 0.3, furyReduce: 0.3, passiveReduce: 0.1 } }).dmg;
    log('azaltma sınırı', `ham ${full} · gerçek yığın ${real} · aşırı yığın ${capped} (en çok %60 azaltma)`);
    expect(real / full).toBeGreaterThan(0.45);
    expect(capped / full).toBeCloseTo(0.4, 2);
  });

  it('rapor', () => { console.log('\n=== V3 DENGE RAPORU ===\n' + report.join('\n')); expect(report.length).toBeGreaterThan(10); });
});
