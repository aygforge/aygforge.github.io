/* =========================================================================
   SaveManager — IndexedDB primary, localStorage fallback, JSON import/export
   ========================================================================= */

const SaveManager = {
  DB: 'arena-dominus', STORE: 'saves', db: null, mode: 'none', lastSave: 0, saving: null,
  async init() {
    if (this.mode !== 'none') return this.mode;
    try {
      if (typeof indexedDB === 'undefined') throw new Error('no idb');
      this.db = await new Promise((res, rej) => {
        const rq = indexedDB.open(this.DB, 1);
        rq.onupgradeneeded = () => { rq.result.createObjectStore(this.STORE); };
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
        setTimeout(() => rej(new Error('idb timeout')), 4000);
      });
      this.mode = 'idb';
    } catch (e) {
      try { localStorage.setItem('ad_test', '1'); localStorage.removeItem('ad_test'); this.mode = 'ls'; }
      catch (e2) { this.mode = 'mem'; }
    }
    return this.mode;
  },
  idbGet(key) {
    return new Promise((res, rej) => {
      const trn = this.db.transaction(this.STORE, 'readonly');
      const rq = trn.objectStore(this.STORE).get(key);
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  },
  idbPutMany(pairs) {
    // single transaction → both records commit atomically
    return new Promise((res, rej) => {
      const trn = this.db.transaction(this.STORE, 'readwrite');
      const st = trn.objectStore(this.STORE);
      for (const [k, v] of pairs) st.put(v, k);
      trn.oncomplete = () => res(true);
      trn.onerror = () => rej(trn.error);
      trn.onabort = () => rej(trn.error);
    });
  },
  mem: {},
  serialize() {
    GameState.syncRng();
    S.savedAt = Date.now();
    S.gv = GAME_VERSION;
    // caches are not persisted
    return JSON.stringify(S, (k, v) => (k === 'tableCache' ? undefined : v));
  },
  async save() {
    if (!S) return false;
    await this.init();
    const json = this.serialize();
    const meta = JSON.stringify({ v: SAVE_VERSION, s: S.season, w: S.week, club: GameState.player() ? GameState.player().n : '-', at: S.savedAt });
    try {
      if (this.mode === 'idb') {
        const prev = await this.idbGet('main').catch(() => null);
        const pairs = [['main', json], ['meta', meta]];
        if (prev) pairs.push(['backup', prev]);
        await this.idbPutMany(pairs);
      } else if (this.mode === 'ls') {
        try { const prev = localStorage.getItem('ad_main'); if (prev) localStorage.setItem('ad_backup', prev); } catch (e) { try { localStorage.removeItem('ad_backup'); } catch (_) { } }
        localStorage.setItem('ad_main', json);
        localStorage.setItem('ad_meta', meta);
      } else { this.mem.main = json; this.mem.meta = meta; }
      this.lastSave = Date.now();
      return true;
    } catch (e) {
      console.error('save failed', e);
      return false;
    }
  },
  async meta() {
    await this.init();
    try {
      let m = null;
      if (this.mode === 'idb') m = await this.idbGet('meta');
      else if (this.mode === 'ls') m = localStorage.getItem('ad_meta');
      else m = this.mem.meta;
      return m ? JSON.parse(m) : null;
    } catch (e) { return null; }
  },
  async loadRaw(key = 'main') {
    await this.init();
    if (this.mode === 'idb') return await this.idbGet(key);
    if (this.mode === 'ls') return localStorage.getItem('ad_' + key);
    return this.mem[key];
  },
  async load() {
    for (const key of ['main', 'backup']) {
      try {
        const raw = await this.loadRaw(key);
        if (!raw) continue;
        const r = this.apply(raw);
        if (r.ok) return { ok: true, from: key };
      } catch (e) { console.warn('load failed', key, e); }
    }
    return { ok: false };
  },
  validate(obj) {
    if (!obj || typeof obj !== 'object') return tx('Dosya geçerli bir kayıt değil.', 'The file is not a valid save.');
    if (obj.v == null || obj.v > SAVE_VERSION) return tx('Kayıt sürümü desteklenmiyor.', 'Save version not supported.');
    if (!Array.isArray(obj.clubs) || obj.clubs.length !== 240) return tx('Kulüp verisi eksik ya da bozuk.', 'Club data is missing or corrupt.');
    if (!obj.glads || typeof obj.glads !== 'object') return tx('Gladyatör verisi eksik.', 'Gladiator data is missing.');
    if (!Array.isArray(obj.leagues) || obj.leagues.length !== 30) return tx('Lig verisi eksik ya da bozuk.', 'League data is missing or corrupt.');
    if (!(obj.season >= 1) || !(obj.week >= 0 && obj.week <= SEASON_WEEKS)) return tx('Sezon bilgisi bozuk.', 'Season data is corrupt.');
    if (!(obj.player >= 0 && obj.player < 240)) return tx('Oyuncu kulübü bulunamadı.', 'Player club not found.');
    if (!Array.isArray(obj.rng) || obj.rng.length !== 4) return tx('Rastgelelik durumu bozuk.', 'Random state is corrupt.');
    const ids = new Set();
    for (const c of obj.clubs) {
      if (!c || typeof c.id !== 'number' || ids.has(c.id) || !Array.isArray(c.roster) || !c.fac || !c.staff) return tx('Kulüp kaydı bozuk.', 'A club record is corrupt.');
      ids.add(c.id);
      if (c.roster.length > 5) return tx('Kadro sınırı aşılmış bir kulüp var.', 'A club exceeds the squad limit.');
    }
    for (const lg of obj.leagues) {
      if (!lg || !Array.isArray(lg.clubs) || lg.clubs.length !== 8 || !Array.isArray(lg.rounds) || lg.rounds.length !== 14) return tx('Lig fikstürü bozuk.', 'League fixtures are corrupt.');
    }
    for (const id in obj.glads) { const g = obj.glads[id]; if (!g || !CLASSES[g.cls] || typeof g.id !== 'number') return tx('Gladyatör kaydı bozuk.', 'A gladiator record is corrupt.'); }
    return null;
  },
  apply(raw) {
    let obj;
    try { obj = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return { ok: false, msg: tx('JSON okunamadı.', 'Could not read JSON.') }; }
    const err = this.validate(obj);
    if (err) return { ok: false, msg: err };
    const prevS = S, prevR = R;
    try {
      S = obj;
      R = new RNG(S.rng);
      this.migrate(S);
      Leagues.invalidate();
      Sanity.check(true);
      GameState.applyLang();
      return { ok: true };
    } catch (e) {
      S = prevS; R = prevR;
      return { ok: false, msg: tx('Kayıt yüklenirken hata: ', 'Error while loading save: ') + e.message };
    }
  },
  migrate(s) {
    s.flags = s.flags || { tut: 0, done: {} };
    s.settings = s.settings || { sound: true };
    s.hist = s.hist || { seasons: [], retired: [], records: {}, champs: [] };
    s.hist.champs = s.hist.champs || [];
    s.offers = s.offers || []; s.nego = s.nego || {}; s.scout = s.scout || {};
    s.nid = s.nid || { g: 1, i: 1, o: 1 };
    for (const c of s.clubs) { c.weekFin = c.weekFin || Economy.blankFin(); c.seasonFin = c.seasonFin || Economy.blankFin(); c.finHist = c.finHist || []; c.riv = c.riv || {}; c.trophies = c.trophies || []; c.hist = c.hist || []; c.st = c.st || { w: 0, l: 0, ko: 0, homeW: 0 }; }
  },
  exportFile() {
    const json = this.serialize();
    const me = GameState.player();
    const name = 'arena-dominus-' + (me ? me.n.replace(/[^a-z0-9]+/gi, '-').toLowerCase() : 'save') + '-s' + S.season + 'w' + S.week + '.json';
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    return name;
  },
  async importText(text) {
    const r = this.apply(text);
    if (r.ok) await this.save();
    return r;
  },
  async wipe() {
    await this.init();
    try {
      if (this.mode === 'idb') await this.idbPutMany([['main', null], ['meta', null]]);
      else if (this.mode === 'ls') { localStorage.removeItem('ad_main'); localStorage.removeItem('ad_meta'); }
      else this.mem = {};
    } catch (e) { }
  }
};
