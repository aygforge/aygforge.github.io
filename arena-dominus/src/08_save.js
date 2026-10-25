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
      const tx = this.db.transaction(this.STORE, 'readonly');
      const rq = tx.objectStore(this.STORE).get(key);
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  },
  idbPutMany(pairs) {
    // single transaction → both records commit atomically
    return new Promise((res, rej) => {
      const tx = this.db.transaction(this.STORE, 'readwrite');
      const st = tx.objectStore(this.STORE);
      for (const [k, v] of pairs) st.put(v, k);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
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
    if (!obj || typeof obj !== 'object') return 'Dosya geçerli bir kayıt değil.';
    if (obj.v == null || obj.v > SAVE_VERSION) return 'Kayıt sürümü desteklenmiyor.';
    if (!Array.isArray(obj.clubs) || obj.clubs.length !== 240) return 'Kulüp verisi eksik ya da bozuk.';
    if (!obj.glads || typeof obj.glads !== 'object') return 'Gladyatör verisi eksik.';
    if (!Array.isArray(obj.leagues) || obj.leagues.length !== 30) return 'Lig verisi eksik ya da bozuk.';
    if (!(obj.season >= 1) || !(obj.week >= 0 && obj.week <= SEASON_WEEKS)) return 'Sezon bilgisi bozuk.';
    if (!(obj.player >= 0 && obj.player < 240)) return 'Oyuncu kulübü bulunamadı.';
    if (!Array.isArray(obj.rng) || obj.rng.length !== 4) return 'Rastgelelik durumu bozuk.';
    const ids = new Set();
    for (const c of obj.clubs) {
      if (!c || typeof c.id !== 'number' || ids.has(c.id) || !Array.isArray(c.roster) || !c.fac || !c.staff) return 'Kulüp kaydı bozuk.';
      ids.add(c.id);
      if (c.roster.length > 5) return 'Kadro sınırı aşılmış bir kulüp var.';
    }
    for (const lg of obj.leagues) {
      if (!lg || !Array.isArray(lg.clubs) || lg.clubs.length !== 8 || !Array.isArray(lg.rounds) || lg.rounds.length !== 14) return 'Lig fikstürü bozuk.';
    }
    for (const id in obj.glads) { const g = obj.glads[id]; if (!g || !CLASSES[g.cls] || typeof g.id !== 'number') return 'Gladyatör kaydı bozuk.'; }
    return null;
  },
  apply(raw) {
    let obj;
    try { obj = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return { ok: false, msg: 'JSON okunamadı.' }; }
    const err = this.validate(obj);
    if (err) return { ok: false, msg: err };
    const prevS = S, prevR = R;
    try {
      S = obj;
      R = new RNG(S.rng);
      this.migrate(S);
      Leagues.invalidate();
      Sanity.check(true);
      return { ok: true };
    } catch (e) {
      S = prevS; R = prevR;
      return { ok: false, msg: 'Kayıt yüklenirken hata: ' + e.message };
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
    const name = 'arena-dominus-' + (me ? me.n.replace(/[^a-z0-9]+/gi, '-').toLowerCase() : 'kayit') + '-s' + S.season + 'h' + S.week + '.json';
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
