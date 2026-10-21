// Uygulama çekirdeği: profil, aktif karakter, kayıt zamanlaması, Phaser oyunu ve arayüz bağlantısı.
import { SaveRepository } from '../save/repository.js';
import { newProfile } from '../save/serialize.js';
import { Rng } from './rng.js';
import { bus } from './events.js';
import { computeStats } from '../systems/stats.js';
import { claimPending } from '../systems/inventory.js';
import { sound } from '../audio/sound.js';

const PERIODIC_SAVE_MS = 30000;

export const app = {
  profile: null,
  char: null,
  slot: -1,
  repo: new SaveRepository(),
  rng: new Rng(),
  dev: false,
  game: null,
  world: null,
  ui: null,
  loadInfo: null,
  _stats: null,
  _statsVer: -1,
  ver: 0,
  save: { timer: null, inFlight: false, again: false, lastAt: 0, error: null, count: 0 },

  get settings() { return this.profile?.settings || {}; },

  async loadProfile() {
    await this.repo.open();
    const r = await this.repo.load();
    this.loadInfo = r;
    this.profile = r.profile || newProfile();
    if (!r.profile && r.tried.some((t) => t.msg !== 'yok')) this.loadInfo.corrupt = true;
    sound.applySettings(this.profile.settings);
    return r;
  },

  // ---------------------------------------------------------------- statlar (tek yetkili hesap + önbellek)
  stats() {
    if (!this.char) return null;
    if (this._statsVer !== this.ver) { this._stats = computeStats(this.char); this._statsVer = this.ver; }
    return this._stats;
  },
  changed(what = 'stats') {
    this.ver++;
    const st = this.stats();
    if (st && this.char) {
      this.char.hp = Math.min(this.char.hp, st.maxHp);
      this.char.mp = Math.min(this.char.mp, st.maxMp);
    }
    bus.emit('changed', what);
  },

  // ---------------------------------------------------------------- karakter seçimi
  selectCharacter(slot) {
    this.slot = slot;
    this.char = this.profile.characters[slot];
    this.ver++;
    claimPending(this.char);
    bus.emit('charSelected', this.char);
  },

  // ---------------------------------------------------------------- kayıt
  // critical: hemen kaydet (seviye, loot, boss, görev, yükseltme, ticaret, harita)
  requestSave(reason = 'auto', critical = false) {
    if (!this.profile) return;
    if (critical) { this.flushSave(reason); return; }
    if (this.save.timer) return;
    this.save.timer = setTimeout(() => this.flushSave(reason), 2500);
  },

  async flushSave(reason = 'auto') {
    if (this.save.timer) { clearTimeout(this.save.timer); this.save.timer = null; }
    if (this.save.inFlight) { this.save.again = true; return; }
    this.save.inFlight = true;
    try {
      if (this.world && this.char) this.world.syncToChar();
      if (this.char) this.char.updatedAt = Date.now();
      await this.repo.save(this.profile);
      this.save.lastAt = Date.now();
      this.save.count++;
      if (this.save.error) bus.emit('toast', { text: 'Kayıt yeniden başarılı.', kind: 'ok' });
      this.save.error = null;
      bus.emit('saved', reason);
    } catch (e) {
      console.error('Kayıt hatası', e);
      this.save.error = e;
      bus.emit('saveError', e);
      // tekrar dene
      setTimeout(() => this.requestSave('retry', true), 4000);
    } finally {
      this.save.inFlight = false;
      if (this.save.again) { this.save.again = false; this.flushSave('coalesced'); }
    }
  },

  startPeriodicSave() {
    clearInterval(this._periodic);
    this._periodic = setInterval(() => { if (this.char) this.requestSave('periodic', true); }, PERIODIC_SAVE_MS);
  },

  setSettings(patch) {
    Object.assign(this.profile.settings, patch);
    sound.applySettings(this.profile.settings);
    bus.emit('settings', this.profile.settings);
    this.requestSave('settings');
  },
};

if (typeof window !== 'undefined') window.__AHEN = app;
