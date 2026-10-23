// Çevrimiçi test katmanı — durum ve akışlar. Arayüz: src/ui/panels/online.js.
// Oyun bu katman olmadan tamamen çalışır; hiçbir çevrimiçi hata yerel kaydı değiştirmez.
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { SCHEMA_VERSION, GAME_VERSION } from '../data/constants.js';
import { encodeBackupCode, decodeBackupCode } from '../save/serialize.js';
import { OnlineApi } from './api.js';
import { loadConfig, saveLocalConfig } from './config.js';
import { summarize, uploadCheck, leaderboardRows, AUTO_UPLOAD_MIN_MS } from './cloud.js';

const AUTO_KEY = 'ahen_online_auto';

export const online = {
  cfg: null, source: null, api: null,
  nickname: null, cloudMeta: null, metaLoaded: false,
  lastUploadAt: 0, uploading: false, lastError: null,
  autoSync: true,

  get configured() { return !!this.api; },
  get loggedIn() { return !!this.api?.loggedIn; },

  changed() { bus.emit('online'); },

  async init() {
    try { this.autoSync = localStorage.getItem(AUTO_KEY) !== '0'; } catch { /* */ }
    const c = await loadConfig();
    if (c.ok) this.use(c.cfg, c.source);
    bus.on('saved', (reason) => { this.autoUpload(reason); });
    if (this.loggedIn) this.refresh();
  },

  use(cfg, source = 'local') {
    this.cfg = cfg; this.source = source;
    this.api = cfg ? new OnlineApi(cfg) : null;
    this.nickname = null; this.cloudMeta = null; this.metaLoaded = false;
    this.changed();
  },

  // elle girilen sunucu ayarı (yalnız bu tarayıcıda)
  setLocalConfig(cfg) {
    saveLocalConfig(cfg);
    if (this.source !== 'bundle') this.use(cfg, 'local');
  },

  setAutoSync(v) {
    this.autoSync = !!v;
    try { localStorage.setItem(AUTO_KEY, v ? '1' : '0'); } catch { /* */ }
    this.changed();
  },

  async refresh() {
    if (!this.loggedIn) return;
    const [nick, meta] = await Promise.all([this.api.getNickname(), this.api.getCloudMeta()]);
    if (nick) this.nickname = nick;
    if (meta.ok) { this.cloudMeta = meta.meta; this.metaLoaded = true; this.lastError = null; } else this.lastError = meta.msg;
    if (!this.loggedIn) { this.nickname = null; this.cloudMeta = null; }
    this.changed();
  },

  async register(email, password, nickname) {
    const r = await this.api.signUp(email, password, nickname);
    if (r.ok) { this.nickname = nickname; await this.refresh(); }
    return r;
  },

  async login(email, password) {
    const r = await this.api.signIn(email, password);
    if (r.ok) await this.refresh();
    return r;
  },

  async logout() {
    await this.api?.signOut();
    this.nickname = null; this.cloudMeta = null; this.metaLoaded = false;
    this.changed();
  },

  // Buluta yükle. force: oyuncu "bulut ileride" uyarısını onayladı
  async upload({ force = false, auto = false } = {}) {
    if (!this.loggedIn) return { ok: false, msg: 'Giriş yapılmamış' };
    if (this.uploading) return { ok: false, msg: 'Yükleme sürüyor' };
    if (app.repo?.readOnly) return { ok: false, msg: 'Kayıt salt okunur — buluta yazılmıyor' };
    this.uploading = true;
    try {
      // her yüklemeden hemen önce bulutun güncel özetini oku: başka cihaz bu arada ilerlemiş olabilir
      const m = await this.api.getCloudMeta();
      if (!m.ok) { this.lastError = m.msg; return m; }
      this.cloudMeta = m.meta; this.metaLoaded = true;
      const chk = uploadCheck(app.profile, this.cloudMeta?.summary);
      if (!chk.ok && (chk.reason === 'empty' || !force)) return { ok: false, ...chk };
      const code = await encodeBackupCode(app.profile);
      const summary = summarize(app.profile);
      const r = await this.api.putCloud({ code, summary, gameVersion: GAME_VERSION, schemaVersion: SCHEMA_VERSION });
      if (!r.ok) { this.lastError = r.msg; return r; }
      this.lastUploadAt = Date.now();
      this.cloudMeta = { summary, game_version: GAME_VERSION, updated_at: new Date().toISOString() };
      this.lastError = null;
      // liderlik hatası bulut kaydını başarısız saymaz
      const lb = await this.api.putLeaderboard(leaderboardRows(app.profile, this.nickname));
      if (!lb.ok) this.lastError = 'Liderlik tablosu güncellenemedi: ' + lb.msg;
      if (!auto) bus.emit('toast', { text: 'Bulut kaydı güncellendi', kind: 'ok' });
      return { ok: true };
    } finally {
      this.uploading = false;
      this.changed();
    }
  },

  // yerel kayıt başarıyla yazıldıktan sonra (en sık 3 dk'da bir); bulut ilerideyse sessizce atlar ve bir kez uyarır
  async autoUpload(reason) {
    if (!this.autoSync || !this.loggedIn || this.uploading) return;
    if (!app.save?.persistent && reason !== 'manual') return;   // yerel kalıcı kayıt doğrulanmadıysa önce o düzelsin
    if (Date.now() - this.lastUploadAt < AUTO_UPLOAD_MIN_MS) return;
    this.lastUploadAt = Date.now();   // başarısızlıkta da sıklığı sınırla
    const r = await this.upload({ auto: true });
    if (!r.ok && r.reason === 'behind' && !this.warnedBehind) {
      this.warnedBehind = true;
      bus.emit('toast', { text: 'Bulut kaydı bu cihazdakinden ileri — otomatik bulut kaydı durdu. Ayarlar → Çevrimiçi.', kind: 'warn' });
    }
  },

  // Buluttaki kaydı indir ve çöz (yükleme kararı arayüzde, içe aktarma onayıyla)
  async fetchCloudSave() {
    const r = await this.api.getCloudCode();
    if (!r.ok) return r;
    const d = await decodeBackupCode(r.row.code);
    if (!d.ok) return { ok: false, msg: 'Bulut kaydı açılamadı: ' + d.msg };
    return { ...d, updatedAt: r.row.updated_at, summary: r.row.summary };
  },

  // yükleme sonrası: bulut özeti artık yerel profille aynı
  afterRestore(summary) {
    this.cloudMeta = { ...(this.cloudMeta || {}), summary };
    this.warnedBehind = false;
    this.lastUploadAt = Date.now();
    this.changed();
  },

  async leaderboard() { return this.api.getLeaderboard(50); },

  async feedback(message) {
    const ch = app.char;
    const context = {
      version: GAME_VERSION, map: app.world?.mapId || null,
      cls: ch?.cls || null, level: ch?.level || null,
      ua: (navigator.userAgent || '').slice(0, 160), screen: `${innerWidth}x${innerHeight}`,
    };
    return this.api.sendFeedback(String(message).slice(0, 2000), context);
  },
};
