// V4 denge simülasyonu — dört sınıf, Lv.1–50. Gerçek stat/hasar formülleri (tests/unit/v4sim.js; V3 ile aynı başsız model).
// Sınırlar: farm 3,5–14 sn; Okçu/Ölü Çağıran Savaşçı–Büyücü ortalamasının 0,6–1,45 katı; elitler 40–90 sn;
// Fırtına Tiranı 4–7 dk; Göğün Mahkûmu 4–8 dk; iskelet katkısı Ölü Çağıran'ın kendi hasarının %25–35'i (Lv.25+).
// Başsız modelde kaçma/konumlanma yoktur: MOVE çarpanı telegraflardan kaçma payıdır (V2/V3 testleriyle aynı yaklaşım).
import { describe, it, expect } from 'vitest';
import { build, farmTtk, ttk, survive, gearFor, GEAR, CLS4, newState, fight } from './v4sim.js';
import { computeStats } from '../../src/systems/stats.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { cumulativeXp, MAX_LEVEL } from '../../src/data/constants.js';
import { QUESTS } from '../../src/data/quests.js';

const MOVE = { warrior: 1.2, mage: 1.3, archer: 1.15, necromancer: 1.25 };
const report = [];
const log = (k, v) => report.push(`${k}: ${v}`);

// 1–50 örnek noktaları (her bölgeden bir yaratık); bütün sınıflar aynı içerikte
const PTS = [[10, 'pick_goblin'], [15, 'ore_priest'], [20, 'rotten_guard'], [25, 'burnt_warrior'], [30, 'snow_shaman'], [35, 'obsidian_sentinel'], [40, 'void_priest'], [45, 'thunder_golem'], [50, 'star_oracle']];
const V4_MOBS = [['storm_hound', 41], ['rift_wing', 42], ['lightning_raider', 43], ['thunder_golem', 44], ['star_parasite', 46], ['astral_hunter', 47], ['void_armor', 48], ['star_oracle', 49]];

describe('V4 denge simülasyonu (dört sınıf, gerçek formüller)', () => {
  it('Lv.10–50 farm: dört sınıf da ilerleyebilir; yeni sınıflar eski iki sınıfın ortalamasına yakın', () => {
    for (const [lv, mob] of PTS) {
      const t = Object.fromEntries(CLS4.map((cls) => [cls, farmTtk(build(cls, lv, gearFor(cls, lv)), mob).t]));
      log(`farm Lv.${lv} ${ENEMIES[mob].name}`, CLS4.map((c) => `${c} ${t[c]} sn`).join(' · '));
      const ref = (t.warrior + t.mage) / 2;
      for (const c of CLS4) expect(t[c], `${c} Lv.${lv}`).toBeLessThan(14);
      for (const c of ['archer', 'necromancer']) {
        expect(t[c] / ref, `${c} Lv.${lv}`).toBeGreaterThan(0.6);
        expect(t[c] / ref, `${c} Lv.${lv}`).toBeLessThan(1.45);
      }
    }
  });

  it('V4 yaratıkları (Lv.41–49) dört sınıfta 3,5–14 sn; 40→50 tahmini süre', () => {
    let expPerHour = 0;
    for (const [id, lv] of V4_MOBS) {
      const t = CLS4.map((cls) => farmTtk(build(cls, lv, gearFor(cls, lv)), id).t);
      log(`V4 farm ${ENEMIES[id].name} (Lv.${lv})`, CLS4.map((c, i) => `${c} ${t[i]} sn`).join(' · '));
      for (const v of t) { expect(v, id).toBeGreaterThan(3.5); expect(v, id).toBeLessThan(14); }
      expPerHour += 110 * ENEMIES[id].exp / V4_MOBS.length;
    }
    const total = cumulativeXp(MAX_LEVEL) - cumulativeXp(40);
    expect(total).toBe(2142150);
    const questExp = QUESTS.filter((q) => /^[ms](4[3-9]|5\d)$/.test(q.id) && !['m43', 'm44', 'm45', 'm46'].includes(q.id)).reduce((a, q) => a + q.exp, 0);
    expect(questExp).toBe(512000 + 132000);
    const farmH = (total - questExp) / expPerHour;
    log('V4 40→50 tahmini', `${farmH.toFixed(1)} sa farm (~110 öldürme/sa) + ~5 sa görev/boss/zindan = ~${(farmH + 5).toFixed(1)} sa`);
    expect(farmH + 5).toBeGreaterThan(10);
    expect(farmH + 5).toBeLessThan(24);
  });

  it('elitler 40–90 sn (hareket payıyla, dört sınıf)', () => {
    for (const [id, lv, gearLv] of [['storm_executioner', 45, 45], ['void_warden', 49, 50]]) {
      const t = CLS4.map((cls) => ttk(build(cls, lv, GEAR[gearLv][cls]), id) * MOVE[cls]);
      log(`V4 elit ${ENEMIES[id].name} (Lv.${lv})`, CLS4.map((c, i) => `${c} ${t[i].toFixed(0)} sn`).join(' · '));
      for (const v of t) { expect(v, id).toBeGreaterThan(40); expect(v, id).toBeLessThan(90); }
    }
  });

  it('Fırtına Tiranı 4–7 dk, Göğün Mahkûmu 4–8 dk (kristaller/mühürler dahil); iskelet bossu kısaltmaz', () => {
    const boss = (cls, id, lv, extra) => {
      const c = build(cls, lv, GEAR[lv][cls]);
      return (ttk(c, id) + extra.reduce((a, x) => a + ttk(c, x), 0)) * MOVE[cls] / 60;
    };
    const ty = CLS4.map((c) => boss(c, 'storm_tyrant', 45, ['tyrant_crystal', 'tyrant_crystal']));
    const pr = CLS4.map((c) => boss(c, 'sky_prisoner', 50, ['sky_seal', 'sky_seal']));
    log('Fırtına Tiranı (Lv.45, Rare +3)', CLS4.map((c, i) => `${c} ${ty[i].toFixed(1)} dk`).join(' · '));
    log('Göğün Mahkûmu (Lv.50, Epic/Rare +3)', CLS4.map((c, i) => `${c} ${pr[i].toFixed(1)} dk`).join(' · '));
    for (const v of ty) { expect(v).toBeGreaterThan(4); expect(v).toBeLessThan(7); }
    for (const v of pr) { expect(v).toBeGreaterThan(4); expect(v).toBeLessThan(8); }
    // Ölü Çağıran en hızlı sınıf olmamalı (iskelet boss mekaniklerini kolaylaştırmaz; boss iskelete yönelmez)
    expect(ty[3]).toBeGreaterThanOrEqual(Math.min(...ty) * 0.98);
    expect(pr[3]).toBeGreaterThanOrEqual(Math.min(...pr) * 0.98);
  });

  it('iskelet katkısı Lv.25–50 farmda Ölü Çağıran\'ın kendi hasarının %25–35\'i; bossta %35\'i aşmaz', () => {
    for (const [lv, mob] of PTS.filter(([lv]) => lv >= 25)) {
      const r = farmTtk(build('necromancer', lv, gearFor('necromancer', lv)), mob);
      log(`iskelet payı Lv.${lv} ${ENEMIES[mob].name}`, `%${Math.round(r.minionShare * 100)}`);
      expect(r.minionShare, `Lv.${lv}`).toBeGreaterThan(0.24);
      expect(r.minionShare, `Lv.${lv}`).toBeLessThan(0.36);
    }
    const S = newState(build('necromancer', 50, GEAR[50].necromancer));
    fight(S, 'sky_prisoner');
    log('iskelet payı Göğün Mahkûmu', `%${Math.round(S.dmgMinion / S.dmgOwn * 100)}`);
    expect(S.dmgMinion / S.dmgOwn).toBeLessThan(0.36);
    // iskelet yokken (öldü / çağrılmadı) Ölü Çağıran yine ilerleyebilir
    const solo = farmTtk(build('necromancer', 45, gearFor('necromancer', 45)), 'thunder_golem', 12, { minion: false }).t;
    log('Ölü Çağıran iskeletsiz Lv.45', `${solo} sn`);
    expect(solo).toBeLessThan(14);
  });

  it('MP: Okçu ve Ölü Çağıran uzun farmda tamamen kilitlenmez (normal saldırı MP harcamaz)', () => {
    for (const [lv, mob] of PTS) {
      for (const cls of ['archer', 'necromancer']) {
        const c = build(cls, lv, gearFor(cls, lv));
        const st = computeStats(c);
        const r = farmTtk(c, mob, 20);
        expect(r.t, `${cls} Lv.${lv}`).toBeLessThan(14);
        if (cls === 'necromancer') expect(r.mpLeft, `necro Lv.${lv}`).toBeGreaterThan(0.5);
        void st;
      }
    }
  });

  it('hayatta kalma: V4 yaratıklarına karşı iksirsiz ölüm süresi (kaçınma dahil)', () => {
    for (const [id, lv] of V4_MOBS) {
      const s = CLS4.map((cls) => survive(build(cls, lv, gearFor(cls, lv)), id));
      log(`hayatta kalma vs ${ENEMIES[id].name}`, CLS4.map((c, i) => `${c} ${s[i]} sn`).join(' · '));
      expect(s[0], id).toBeGreaterThan(12);
      for (const v of s.slice(1)) expect(v, id).toBeGreaterThan(7);
    }
  });

  it('rapor', () => { console.log('\n=== V4 DENGE RAPORU ===\n' + report.join('\n')); expect(report.length).toBeGreaterThan(20); });
});
