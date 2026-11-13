import { describe, it, expect } from 'vitest';
import { C, afterTutorial, fresh } from './helpers/setup.js';
import * as Cal from '../src/systems/calendar.js';
import { trainX } from '../src/systems/trains.js';

describe('Tren takvimi', () => {
  it('her gün tam 09:00/15:00/21:00: 10 dk önce yaklaşır, 12 dk peronda durur, sonra çıkar', () => {
    const { sim, s } = fresh(); const seen = [];
    for (let m = 360; m < 1380; m += 0.5) { sim.tick(0.5); for (const e of sim.fx.splice(0)) if (e.type.startsWith('train_')) seen.push([e.type, Math.round(s.minute)]); }
    expect(seen).toEqual([['train_approach', 530], ['train_stop', 540], ['train_depart', 552], ['train_approach', 890], ['train_stop', 900], ['train_depart', 912], ['train_approach', 1250], ['train_stop', 1260], ['train_depart', 1272]]);
    const tr = { time: 540 }; s.minute = 529; expect(trainX(sim, tr)).toBeNull(); s.minute = 531; const far = trainX(sim, tr); s.minute = 539; const near = trainX(sim, tr); s.minute = 545; const stop = trainX(sim, tr);
    expect(far).toBeGreaterThan(near); expect(near).toBeGreaterThan(stop); expect(stop).toBe(11); s.minute = 556; expect(trainX(sim, tr)).toBeLessThan(stop);
    expect(s.groups.length).toBe(0); // 1. gün lokantaya müşteri girmez
  });
});

describe('T21: 30 oyun günü hızlandırılmış simülasyon', () => {
  it('takılan sipariş, hayalet NPC ve ekonomi çoğaltması yok; lokanta büyür', () => {
    const g = afterTutorial(); const { sim, s, bot } = g; const reports = []; let prevGold = null;
    for (let d = 0; d < 30; d++) {
      const goldStart = s.today.goldStart;
      const r = bot.playDay({ morning: (b) => b.progress() });
      expect(r.ok, `gün ${s.day}`).toBe(true); const rep = r.report; reports.push(rep);
      // Muhasebe: kasa değişimi = satış + bahşiş + görev + kaynak satışı − alım − ücret (çift sayım yok)
      expect(rep.net).toBe(rep.sales + rep.tips + rep.questGold + rep.resourceSales - rep.purchases - rep.wages);
      expect(rep.gold).toBe(goldStart + rep.net); if (prevGold != null) expect(goldStart).toBe(prevGold); prevGold = rep.gold;
      expect(rep.gold).toBeGreaterThanOrEqual(0);
      expect(s.groups.length + s.customers.length + s.orders.length + s.passers.length).toBe(0);
      expect(s.player.carry.length).toBe(0); expect(sim.kitchen.integrity(sim)).toEqual([]);
      expect(s.batches.every((b) => b.reserved === 0)).toBe(true);
    }
    expect(s.day).toBe(32); const sales = reports.reduce((a, r) => a + r.sales, 0); const cust = reports.reduce((a, r) => a + r.customers, 0);
    expect(cust).toBe(s.paidCustomers); expect(sales).toBe(s.stats.totalSales);
    expect(s.stage).toBeGreaterThanOrEqual(2); expect(s.paidCustomers).toBeGreaterThan(150);
    expect(reports.filter((r) => r.customers > 0).length).toBeGreaterThan(26);
    console.log(`30 gün: aşama ${s.stage}, ödemeli müşteri ${s.paidCustomers}, altın ${s.gold}, itibar ${s.reputation}, koltuk ${sim.build.totalSeats(sim)}, günlük satış ort. ${Math.round(sales / 30)} G, ayrılan ${reports.reduce((a, r) => a + r.left, 0)}, görevler ${s.quests.done.length}/15, bot uyarıları ${bot.log.length}`);
  });
});

describe('T15/T16/T26/T36: 112 gün + sonraki yıl', () => {
  it('mevsimler, hava, etkinlik duyuruları ve festivaller doğru döner', () => {
    const g = afterTutorial(); const { sim, s } = g; s.stage = 3;
    const seasons = {}; const weather = {}; const festivals = []; const events = []; let announced = null, announcedFest = null;
    while (s.day <= 113 + 28) {
      const se = sim.season(); seasons[se] = (seasons[se] || 0) + 1; (weather[se] ||= new Set()).add(s.weather);
      const dos = Cal.dayOfSeason(C, s.day);
      expect(s.trains.map((t) => t.time)).toEqual([540, 900, 1260]); // etkinlik yeni saat eklemez
      if (announced !== null) expect(s.event?.id ?? null).toBe(announced); // bir gün önce duyurulan = gerçekleşen
      if (announcedFest !== null) expect(s.festival).toBe(announcedFest);
      if (s.event) { events.push([s.day, s.event.id]); expect([7, 14, 21]).toContain(dos); expect(C.trainTimes).toContain(s.event.time); expect(s.day).toBeGreaterThan(3); expect(s.event.seasons).toContain(se); }
      if (dos === 28) { expect(s.festival).toBeTruthy(); expect(s.event).toBeNull(); expect(s.quests.festival.id).toBe(s.festival); festivals.push([s.day, s.festival]); } else expect(s.festival).toBeNull();
      if (['snow', 'blizzard'].includes(s.weather)) expect(se).toBe('winter'); if (['rain', 'storm'].includes(s.weather)) expect(se).not.toBe('winter');
      announced = s.eventTomorrow?.id ?? null; announcedFest = s.festivalTomorrow;
      expect(sim.daysys.sleep(sim, true).ok).toBe(true);
    }
    expect(Cal.yearOf(C, 112)).toBe(1); expect(Cal.yearOf(C, 113)).toBe(2); expect(Cal.seasonOf(C, 113)).toBe('spring'); expect(Cal.dayOfSeason(C, 113)).toBe(1);
    expect(Cal.seasonOf(C, 29)).toBe('summer'); expect(Cal.seasonOf(C, 57)).toBe('autumn'); expect(Cal.seasonOf(C, 85)).toBe('winter');
    expect(festivals.map((f) => f[0])).toEqual([28, 56, 84, 112, 140]); expect(festivals.map((f) => f[1])).toEqual(['flower_festival', 'station_fair', 'harvest_fair', 'lantern_night', 'flower_festival']);
    expect(events.length).toBeGreaterThanOrEqual(12); expect(new Set(events.map((e) => e[1])).size).toBeGreaterThanOrEqual(3);
    expect(weather.winter.has('snow')).toBe(true); expect(weather.autumn.has('rain')).toBe(true);
    // T26: kaçırılan festival kilit yaratmaz; ikinci yıl aynı festival yeniden gelir ve ödül o zaman alınabilir
    expect(s.cosmeticsOwned).not.toContain('spring_flower_wreath'); expect(s.quests.story).toBeTruthy();
  });
  it('festival hedefi tamamlanınca kozmetik bir kez verilir', () => {
    const g = afterTutorial(); const { sim, s } = g; s.day = 55; sim.daysys.sleep(sim, true); expect(s.festival).toBe('station_fair');
    s.today.customers = 6; sim.emit('paid', { count: 0, size: 1 }); expect(s.cosmeticsOwned).toContain('summer_station_pennant'); expect(sim.inv.count(sim, 'summer_station_pennant')).toBe(1);
    s.quests.festival.done = false; const gold = s.gold; sim.emit('paid', { count: 0, size: 1 }); expect(sim.inv.count(sim, 'summer_station_pennant')).toBe(1); expect(s.gold).toBe(gold + 60);
  });
});
