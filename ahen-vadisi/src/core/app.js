// Uygulama çekirdeği: profil, aktif karakter, kayıt zamanlaması, Phaser oyunu ve arayüz bağlantısı.
import { SaveRepository } from '../save/repository.js';
import { setHeroGear } from '../art/spriteRuntime.js';
import { newProfile, validateProfile, repairProfile } from '../save/serialize.js';
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
    let r;
    try {
      await this.repo.open();
      r = await this.repo.load();
    } catch (e) {
      // beklenmeyen okuma hatası: kayıt silinmesin diye depo salt okunur başlar (oyuncu isterse açabilir)
      console.error('Kayıt okunamadı', e);
      this.repo.readOnly = true;
      r = { profile: null, source: null, tried: [{ key: 'profile', msg: String(e?.message || e) }], error: e, recoverable: [] };
    }
    // Kayıt veritabanı açılamadı ve hiçbir kopya okunamadı: bu "karakter yok" demek değildir. Boş profil eski kaydın
    // üzerine yazılmasın diye depo salt okunur başlar; oyuncuya hata türü, yedek/kurtarma seçenekleri gösterilir.
    if (!r.profile && r.storageError && !r.error) { this.repo.readOnly = true; r.error = new Error(r.storageError.text); r.errorKind = r.storageError; }
    this.loadInfo = r;
    this.profile = r.profile || newProfile();
    if (!this.profile.notices || typeof this.profile.notices !== 'object') this.profile.notices = {};
    if (!Array.isArray(this.profile.deletedChars)) this.profile.deletedChars = [];
    if (!r.profile && r.tried.some((t) => t.msg !== 'yok')) this.loadInfo.corrupt = true;
    sound.applySettings(this.profile.settings);
    setHeroGear(this.profile.settings.heroLook === 'gear');
    // tarayıcıdan kalıcı depolama iste (depolama baskısında otomatik silinmeye karşı)
    this.repo.persist().then(() => bus.emit('storageStatus')).catch(() => {});
    return r;
  },

  // Kurtarılabilir karakteri (başka bir kayıt kopyasında bulunan) profile geri koy. Aynı karakterin daha düşük seviyeli
  // hali varsa onun yerine geçer; yoksa ilk boş yuvaya yerleşir. Ortak depo değişmez.
  async recoverCharacter(entry) {
    const chars = this.profile.characters;
    const copy = JSON.parse(JSON.stringify(entry.char));
    let slot = chars.findIndex((c) => c && c.id === copy.id);
    if (slot < 0) slot = chars.findIndex((c) => !c);
    if (slot < 0) return { ok: false, msg: 'Boş karakter yuvası yok. Önce bir yuvayı boşalt.' };
    if (this.char && chars[slot] === this.char) return { ok: false, msg: 'Oynadığın karakterin yerine geri yüklenemez; ana menüden dene.' };
    copy.slot = slot;
    chars[slot] = copy;
    // geri gelen karakterin eşya kimlikleri ortak depodakilerle çakışabilir: profil doğrulanır, gerekirse onarılır
    if (!validateProfile(this.profile).ok) repairProfile(this.profile);
    this.profile.deletedChars = (this.profile.deletedChars || []).filter((id) => id !== copy.id);
    if (this.loadInfo?.recoverable) this.loadInfo.recoverable = this.loadInfo.recoverable.filter((x) => x.char.id !== copy.id);
    await this.flushSave('recover');
    return { ok: !this.save.error, slot, msg: this.save.error?.message };
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
    if (this.repo.readOnly) return;   // daha yeni sürüm kaydı ya da okunamayan depo: üzerine yazılmaz
    if (this.save.inFlight) { this.save.again = true; return; }
    this.save.inFlight = true;
    try {
      if (this.world && this.char) this.world.syncToChar();
      if (this.char) this.char.updatedAt = Date.now();
      await this.repo.save(this.profile);
      this.save.lastAt = Date.now();
      // kalıcı yazım doğrulanmadıysa (yalnız geçici bellek) "kaydedildi" denmez
      this.save.persistent = !!this.repo.lastWrite?.persistent;
      if (!this.save.persistent && !this.save.warnedMemory) {
        this.save.warnedMemory = true;
        bus.emit('toast', { text: 'Dikkat: kayıt yalnız geçici bellekte! Tarayıcı kapanınca kaybolur — Ayarlar → Kayıt Güvenliği.', kind: 'warn' });
      }
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
    setHeroGear(this.profile.settings.heroLook === 'gear');
    bus.emit('settings', this.profile.settings);
    this.requestSave('settings');
  },
};

if (typeof window !== 'undefined') window.__AHEN = app;
