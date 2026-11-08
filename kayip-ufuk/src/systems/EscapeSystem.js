// Two independent endings: own sailboat (4 stages, 2 nav sources, safe weather, reef finale) and
// automatic SOS via signal station powered by solar OR generator (+2 game days rescue). No human NPC/voice.
import { TILE } from '../world/TerrainSystem.js';
import { deepClone } from '../core/util.js';

export class EscapeSystem {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }
  get c() { return this.g.content; }
  route(id) { const r = this.s.story.escapeRoutes; if (!r[id]) r[id] = { unlocked: false, stages: {}, ready: false, completed: false }; return r[id]; }

  // ---------- radio ----------
  station() { return Object.values(this.s.buildingState.byId).find((b) => b.buildId === 'BUILD_SIGNAL_STATION') || null; }
  stationBuilt() { const b = this.station(); return !!(b && b.stage === 'complete'); }
  stationPowered() {
    const b = this.station(); if (!b || b.stage !== 'complete') return false;
    if (b.data.powerVariant === 'solar') return this.s.story.specialItemsGranted.includes('SPC_SOLAR_CORE');
    if (b.data.powerVariant === 'generator') return this.s.story.specialItemsGranted.includes('SPC_GEN_CORE');
    return false;
  }
  lighthouseLabel() {
    const sos = this.s.world.sos;
    if (sos?.sent) return 'SOS yayında — kurtarma bekleniyor';
    if (this.s.world.worldFlags.SIGNAL_TUNED) return 'Otomatik SOS gönder';
    if (this.stationBuilt()) return 'Acil sinyal frekansını ayarla';
    return 'Fener İstasyonu';
  }
  lighthouseInteract() {
    if (this.s.world.sos?.sent) { this.g.bus.emit('ui.toast', { text: `Otomatik röle onayı alındı. Kurtarma ${Math.max(0, this.s.world.sos.rescueDueDay - this.s.clock.dayIndex)} gün içinde sahile ulaşacak.` }); return { ok: true }; }
    if (this.s.world.worldFlags.SIGNAL_TUNED) return this.sendSOS();
    if (this.stationBuilt()) { this.g.ui?.openPuzzle('PZ_LIGHTHOUSE_TUNE'); return { ok: true, opened: 'puzzle' }; }
    this.g.bus.emit('ui.toast', { text: 'Anten ve haberleşme istasyonu feneri yanına kurulmalı (İnşa menüsü)' });
    return { ok: false };
  }
  onTuned() { this.g.bus.emit('ui.toast', { text: 'Frekans ayarlandı. Fenerden otomatik SOS gönderebilirsin.' }); }

  /** SEND_SOS: automatic packet, no conversation; rescueDueDay = signal day + 2. */
  sendSOS() {
    if (!this.s.world.worldFlags.SIGNAL_TUNED || !this.stationPowered()) return { ok: false, code: 'NOT_READY' };
    const r = this.g.store.transaction('SOS_SENT', (tx) => {
      tx.set(this.s.world, 'sos', { sent: true, signalDay: this.s.clock.dayIndex, rescueDueDay: this.s.clock.dayIndex + this.c.escapes.get('ESCAPE_RADIO').rescue.arrivalDelayGameDays, ready: false, power: this.station().data.powerVariant });
      tx.set(this.s.world.worldFlags, 'SOS_SENT', true);
      tx.set(this.s.world.worldFlags, 'START_RESCUE_TIMER', true);
      tx.emit('sos.sent', { text: 'OTOMATİK SOS PAKETİ GÖNDERİLDİ — Röle teslim onayı: ALINDI. (Sesli iletişim yok)' });
    });
    if (r.ok) this.g.persistence?.checkpoint('sos');
    return r;
  }
  rescueTile() {
    const route = this.c.seaRoutes.get('SEA_TO_WRECK');
    return this.g.terrain.localToAtlas('MAIN', ...route.departureDock.shoreFootTileLocal);
  }
  onDay(day) {
    const sos = this.s.world.sos;
    if (sos?.sent && !sos.ready && day >= sos.rescueDueDay) {
      sos.ready = true;
      this.g.bus.emit('rescue.ready', { text: 'Ufukta bir kurtarma teknesi! Başlangıç sahilindeki güvenli kıyıya yanaştı.' });
      this.g.audio?.play('snd_sos_received_indicator');
    }
  }
  rescueAvailable() { return !!this.s.world.sos?.ready; }

  // ---------- boat ----------
  boat() { return Object.values(this.s.buildingState.byId).find((b) => b.buildId === 'BUILD_ESCAPE_BOAT') || null; }
  navSources() { return ['SPC_CHART_COAST', 'SPC_CHART_OBSERVATORY', 'SPC_CHART_CAPTAIN'].filter((x) => this.s.story.specialItemsGranted.includes(x)).length; }
  departureCheck() {
    const b = this.boat(); const reasons = [];
    if (!b || b.stage !== 'complete') reasons.push('Yelkenli tamamlanmadı');
    if (this.navSources() < 2) reasons.push('En az iki seyir kaydı gerekli');
    if (!this.g.climate.launchAllowed(undefined, !!b?.data.stormAnchor)) reasons.push(`Hava uygun değil (${this.c.db.WeatherDB.states[this.g.climate.weather()].name}) — en geç 3 gün içinde sakin hava gelir`);
    return reasons;
  }

  onBuildCompleted(b) {
    if (b.buildId === 'BUILD_ESCAPE_BOAT') { this.route('ESCAPE_SAIL').ready = true; this.g.bus.emit('ui.toast', { text: 'Yelkenli hazır! Uygun havada yola çıkabilirsin.' }); }
    if (b.buildId === 'BUILD_SIGNAL_STATION') { this.route('ESCAPE_RADIO').stages.built = true; }
    this.checkStory15();
  }

  checkStory15() {
    const k = this.g.knowledge;
    if ((k.storyFlag('TWO_NAV_SOURCES') || k.storyFlag('RADIO_STATION_DISCOVERED')) && !this.s.story.storyRecordsRead.includes('STORY_15')) {
      this.g.exploration.readStory('STORY_15');
    }
    if (k.storyFlag('TWO_NAV_SOURCES')) this.route('ESCAPE_SAIL').unlocked = true;
    if (k.storyFlag('RADIO_STATION_DISCOVERED')) this.route('ESCAPE_RADIO').unlocked = true;
  }

  // ---------- finales ----------
  /** BOAT_CASTOFF: pre-finale safe snapshot, then sea finale scene. */
  castOff() {
    const reasons = this.departureCheck();
    if (reasons.length) { this.g.bus.emit('ui.error', { text: reasons[0] }); return { ok: false, reasons }; }
    this.preFinale = deepClone(this.s);
    this.g.persistence?.checkpoint('pre_finale');
    const b = this.boat();
    this.g.finale.startSea({ hullBonus: b.data.hullDurabilityBonus || 0, charts: this.navSources(), captain: this.s.story.specialItemsGranted.includes('SPC_CHART_CAPTAIN') });
    return { ok: true };
  }
  boardRescue() {
    if (!this.rescueAvailable()) return { ok: false };
    this.preFinale = deepClone(this.s);
    this.g.persistence?.checkpoint('pre_finale');
    this.g.finale.startRadio();
    return { ok: true };
  }
  /** REEF_FAIL: restore the safe pre-finale world; nothing unique is lost. */
  onSeaFail() {
    if (this.preFinale) this.g.restoreState(this.preFinale, 'reef_fail');
    this.g.bus.emit('ui.toast', { text: 'Resife çarptın — kıyıya güvenle döndün. Tekne ve kayıtlar yerinde.' });
  }
  /** END_ESCAPE: achievement + resume bookmark (pre-finale world). Idempotent per route. */
  complete(routeId) {
    const base = this.preFinale || deepClone(this.s);
    const already = base.story.endingAchievements.includes(routeId);
    if (!already) base.story.endingAchievements.push(routeId);
    base.story.escapeRoutes[routeId] = { ...(base.story.escapeRoutes[routeId] || {}), completed: true, unlocked: true, ready: true };
    base.world.worldFlags[routeId === 'ESCAPE_SAIL' ? 'ESCAPE_BY_BOAT' : 'ESCAPE_BY_RADIO'] = true;
    if (routeId === 'ESCAPE_RADIO' && base.world.sos) base.world.sos = { ...base.world.sos, ready: false, completed: true };
    base.stats.endingsCompleted = base.story.endingAchievements.length;
    const stats = this.endingStats(base);
    this.g.restoreState(base, 'ending');
    this.preFinale = null;
    this.g.persistence?.checkpoint('ending');
    return { ok: true, stats, firstTime: !already };
  }
  endingStats(st) {
    const sk = Object.values(st.skills).filter((s) => s.xp >= 800).length;
    return {
      daysSurvived: st.clock.dayIndex, poisDiscovered: st.world.visitedPoiIds.length, skillsMastered: sk,
      craftsLearned: Object.keys(st.knowledge.items).length, animalSpeciesObserved: st.ecosystem.natureJournal.length, buildsPlaced: st.stats.buildsPlaced || 0,
      endings: [...st.story.endingAchievements],
    };
  }
  rescueBoatPx() { const [x, y] = this.rescueTile(); return [(x + 0.5) * TILE, (y + 2.5) * TILE]; }
}
