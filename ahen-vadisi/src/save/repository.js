// SaveRepository — kayıt deposu (V3.1 sağlamlaştırma).
//
// İlkeler (oyuncu ilerlemesi hiçbir koşulda sessizce silinmez):
//  1. Çift yazım: her kayıt IndexedDB'ye (birincil, tek transaction'da atomik) VE localStorage aynasına yazılır.
//     Biri açılamaz/bozulursa diğeri kullanılır; yüklemede ikisindeki bütün kopyalar karşılaştırılır, en yenisi seçilir.
//  2. Yıkıcı yazım yok: okunamayan/doğrulanamayan kayıt ham haliyle 'rescue_*' anahtarına kopyalanır ve onarılmaya
//     çalışılır (serialize.salvage). Boş profil asla dolu bir kaydın üzerine kendiliğinden yazılmaz.
//  3. İlerleme koruması: yeni yazılacak kayıtta önceki kayıttaki bir karakter yoksa (bilinçli silme hariç) ya da seviyesi
//     düşmüşse, önceki kayıt 'rescue_*' olarak saklanır.
//  4. Geçmiş: son iki sağlam kayıt (snap_0/1, ~2 dk arayla) + oturum başı ve 15 dakikada bir 5'li geçmiş halkası (hist_*).
//  5. Daha yeni bir oyun sürümünün kaydı açılırsa (eski önbellekli sürüm) depo salt okunur olur — üstüne yazılmaz.
//  6. IndexedDB bağlantısı koparsa (mobil Safari arka plan) yeniden açılır ve yazım tekrar denenir.
// Eski anahtarlar (profile, snap_0, snap_1, v1_backup, v2_backup, localStorage 'ahen-vadisi:profile:*') aynen okunur.
import { wrap, unwrap, salvage } from './serialize.js';
import { SCHEMA_VERSION } from '../data/constants.js';

const DB_NAME = 'ahen-vadisi';
const STORE = 'kv';
const SNAPSHOT_INTERVAL = 120000;        // ms — snap_0/snap_1 dönüşü
const HISTORY_INTERVAL = 15 * 60000;     // ms — hist_* halkası
const HIST_N = 5;
const RESCUE_MAX = 8;
const LS_KEY = 'ahen-vadisi:profile';    // eski localStorage modu anahtar öneki
const LS_MIRROR = 'ahen-vadisi:mirror';  // her kayıtta yazılan ayna
const MAIN_KEYS = ['profile', 'snap_0', 'snap_1'];
const HIST_KEYS = Array.from({ length: HIST_N }, (_, i) => `hist_${i}`);
const BACKUP_KEYS = ['v2_backup', 'v1_backup'];

const lsOk = () => { try { return typeof localStorage !== 'undefined' && !!localStorage; } catch { return false; } };

// Zarftaki karakter özeti (eski zarflarda yoksa veriden çıkarılır)
export function envSummary(env) {
  if (!env) return null;
  if (env.meta?.chars) return env.meta;
  try {
    const p = JSON.parse(env.data);
    return { chars: (p.characters || []).map((c) => (c ? { id: c.id, name: c.name, level: c.level, cls: c.cls } : null)), deleted: p.deletedChars || [] };
  } catch { return null; }
}

// Yeni kayıt önceki kayda göre ilerleme kaybettiriyor mu? (bilinçli silinen karakterler hariç)
export function losesProgress(prevMeta, nextMeta) {
  if (!prevMeta?.chars) return false;
  const next = new Map((nextMeta?.chars || []).filter(Boolean).map((c) => [c.id, c]));
  const deleted = new Set(nextMeta?.deleted || []);
  for (const c of prevMeta.chars.filter(Boolean)) {
    if (deleted.has(c.id)) continue;
    const n = next.get(c.id);
    if (!n || (n.level ?? 0) < (c.level ?? 0)) return true;
  }
  return false;
}

// Depolama hatasının oyuncuya gösterilecek türü
export function errorKind(e) {
  const name = e?.name || '';
  const msg = String(e?.message || e || '');
  if (name === 'QuotaExceededError' || /quota/i.test(msg)) return { code: 'quota', text: 'Depolama alanı dolu (tarayıcı kotası)' };
  if (name === 'SecurityError' || /security|denied|not allowed|insecure/i.test(msg)) return { code: 'blocked', text: 'Tarayıcı bu sayfanın kayıt depolamasını engelliyor (gizli sekme, çerez/site verisi engeli ya da üçüncü taraf iframe kısıtı)' };
  if (name === 'InvalidStateError' || /closing|closed|connection/i.test(msg)) return { code: 'closed', text: 'Kayıt veritabanı bağlantısı kapandı' };
  if (/blocked/i.test(msg)) return { code: 'busy', text: 'Kayıt veritabanı başka bir sekmede kullanımda' };
  if (/IndexedDB yok/i.test(msg)) return { code: 'missing', text: 'Bu tarayıcıda IndexedDB yok' };
  return { code: 'unknown', text: `Depolama hatası: ${msg || name || 'bilinmiyor'}` };
}

export class SaveRepository {
  constructor(idb = (typeof indexedDB !== 'undefined' ? indexedDB : null)) {
    this.idb = idb;
    this.db = null;
    this.mode = 'none';
    this.lastSnapshotAt = 0;
    this.lastHistoryAt = 0;              // 0 → oturumun ilk kaydında geçmişe kopya alınır
    this.failNext = 0;                   // geliştirici: kayıt hatası testi
    this.lastError = null;
    this.readOnly = false;               // daha yeni sürüm kaydı: üzerine yazılmaz
    this.degraded = false;               // IndexedDB yazılamadı, yalnız ayna yazıldı
    this.persisted = null;               // navigator.storage.persist sonucu
    this.mem = {};
    this.useMirror = true;
    this.lastWrite = null;               // { at, idb, mirror, local, persistent } — son yazımın gerçekten nereye gittiği
    this.openError = null;               // IndexedDB açılamadıysa hata (kullanıcıya türüyle bildirilir)
  }

  // Kayıt teknolojisi özeti (Kayıt Güvenliği ekranı)
  storageInfo() {
    const w = this.lastWrite;
    return {
      mode: this.mode, readOnly: this.readOnly, degraded: this.degraded, persisted: this.persisted,
      openError: this.openError ? errorKind(this.openError) : null,
      lastPersistentAt: w?.persistentAt || null, lastWrite: w,
      memoryOnly: this.mode === 'memory' || (w && !w.persistent),
    };
  }

  // ------------------------------------------------------------------ bağlantı
  async open() {
    if (this.db) return this.mode;
    if (this.idb) {
      try {
        this.db = await new Promise((resolve, reject) => {
          const req = this.idb.open(DB_NAME, 1);
          req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
          req.onblocked = () => reject(new Error('blocked'));
        });
        // bağlantı koparsa (ör. iOS arka plan) sonraki işlemde yeniden açılır
        this.db.onclose = () => { this.db = null; };
        this.db.onversionchange = () => { try { this.db?.close(); } catch { /* */ } this.db = null; };
        this.mode = 'idb';
        this.openError = null;
        return this.mode;
      } catch (e) {
        this.lastError = e;
        this.openError = e;
        this.db = null;
      }
    }
    this.mode = lsOk() ? 'local' : 'memory';
    return this.mode;
  }

  // Tarayıcıdan kalıcı depolama iste (depolama baskısında silinmeye karşı). Hata vermez.
  async persist() {
    try {
      if (typeof navigator === 'undefined' || !navigator.storage?.persist) { this.persisted = null; return null; }
      this.persisted = (await navigator.storage.persisted?.()) || (await navigator.storage.persist());
    } catch { this.persisted = null; }
    return this.persisted;
  }

  // IndexedDB işlemi: bağlantı kapanmışsa yeniden açıp bir kez daha dener
  async _tx(modeRW, body) {
    for (let attempt = 0; attempt < 2; attempt++) {
      await this.open();
      if (!this.db) throw this.lastError || new Error('IndexedDB yok');
      try {
        return await new Promise((resolve, reject) => {
          const tx = this.db.transaction(STORE, modeRW);
          let out;
          tx.oncomplete = () => resolve(out);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error || new Error('abort'));
          out = body(tx.objectStore(STORE), (v) => { out = v; });
        });
      } catch (e) {
        this.lastError = e;
        const closed = e?.name === 'InvalidStateError' || /closing|closed|connection/i.test(String(e?.message || e));
        if (attempt === 0 && closed) { try { this.db?.close(); } catch { /* */ } this.db = null; continue; }
        throw e;
      }
    }
    throw this.lastError;
  }

  _req(r) { return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }

  // ------------------------------------------------------------------ localStorage (eski mod + ayna)
  _ls() {
    const ok = this.mode === 'local' || (this.mode !== 'memory' && lsOk());
    const mem = this.mem;
    return {
      get: (k) => {
        if (!ok) return mem[k] ?? null;
        try { const v = localStorage.getItem(`${LS_KEY}:${k}`); return v ? JSON.parse(v) : null; } catch { return null; }
      },
      set: (k, v) => {
        if (!ok) { mem[k] = v; return; }
        localStorage.setItem(`${LS_KEY}:${k}`, JSON.stringify(v));
      },
    };
  }

  _readMirror() {
    if (!lsOk()) return null;
    try { const v = localStorage.getItem(LS_MIRROR); return v ? JSON.parse(v) : null; } catch { return null; }
  }

  _writeMirror(env) {
    if (!this.useMirror || !lsOk()) return false;
    try { localStorage.setItem(LS_MIRROR, JSON.stringify(env)); return true; } catch (e) { this.mirrorError = e; return false; }
  }

  // ------------------------------------------------------------------ yazım
  async save(profile, { forceSnapshot = false } = {}) {
    await this.open();
    if (this.readOnly) {
      const err = new Error('Kayıt salt okunur: bu cihazdaki kayıt oyunun daha yeni bir sürümünden. Sayfayı yenile.');
      this.lastError = err;
      throw err;
    }
    if (this.failNext > 0) {
      this.failNext--;
      const err = new Error('Simüle edilmiş kayıt hatası');
      this.lastError = err;
      throw err;
    }
    profile.commit = (profile.commit || 0) + 1;
    const env = wrap(profile);
    const now = Date.now();
    const doSnap = forceSnapshot || now - this.lastSnapshotAt > SNAPSHOT_INTERVAL;
    const doHist = this.lastHistoryAt === 0 || now - this.lastHistoryAt > HISTORY_INTERVAL;
    let idbOk = false;
    if (this.mode === 'idb' || this.idb) {
      try {
        await this._tx('readwrite', (st) => {
          const g0 = st.get('profile');
          g0.onsuccess = () => {
            const prev = g0.result;
            if (prev) {
              // ilerleme koruması: önceki kayıt kaybolacak karakter içeriyorsa ayrıca saklanır
              if (losesProgress(envSummary(prev), env.meta)) st.put(prev, `rescue_${now}_guard`);
              if (doHist) {
                const gi = st.get('hist_idx');
                gi.onsuccess = () => {
                  const idx = ((gi.result ?? -1) + 1) % HIST_N;
                  st.put(prev, `hist_${idx}`);
                  st.put(idx, 'hist_idx');
                };
              }
            }
            if (doSnap && prev && unwrap(prev).ok) {
              const g1 = st.get('snap_0');
              g1.onsuccess = () => {
                if (g1.result) st.put(g1.result, 'snap_1');
                st.put(prev, 'snap_0');
                st.put(env, 'profile');
              };
            } else st.put(env, 'profile');
          };
        });
        idbOk = true;
        this.mode = 'idb';
      } catch (e) {
        this.lastError = e;
      }
    }
    if (!idbOk) {
      // IndexedDB yok/yazılamadı: eski localStorage modu (snapshot'larla)
      const store = this._ls();
      try {
        if (doSnap) {
          const prev = store.get('profile');
          if (prev && unwrap(prev).ok) {
            const s0 = store.get('snap_0');
            if (s0) store.set('snap_1', s0);
            store.set('snap_0', prev);
          }
        }
        store.set('profile', env);
      } catch (e) {
        this.lastError = e;
        if (!this._writeMirror(env)) throw e;
      }
    }
    const mirrored = this._writeMirror(env);
    this.degraded = !idbOk;
    const local = !idbOk && this.mode === 'local';
    const persistent = idbOk || mirrored || local;
    this.lastWrite = { at: now, idb: idbOk, mirror: mirrored, local, persistent, persistentAt: persistent ? now : this.lastWrite?.persistentAt || null };
    if (!idbOk && !mirrored && this.mode !== 'local' && this.mode !== 'memory') throw this.lastError || new Error('Kayıt yazılamadı');
    if (doSnap) this.lastSnapshotAt = now;
    if (doHist) this.lastHistoryAt = now;
    if (idbOk) this.lastError = null;
    if (idbOk && doHist) this._pruneRescue().catch(() => {});
    return env;
  }

  async _pruneRescue() {
    const keys = await this.keys();
    const rescues = keys.filter((k) => k.startsWith('rescue_')).sort();
    const drop = rescues.slice(0, Math.max(0, rescues.length - RESCUE_MAX));
    if (!drop.length) return;
    await this._tx('readwrite', (st) => { for (const k of drop) st.delete(k); });
  }

  async keys() {
    try {
      return await this._tx('readonly', (st, set) => { const r = st.getAllKeys(); r.onsuccess = () => set(r.result.map(String)); });
    } catch { return []; }
  }

  async readRaw(key) {
    if (key === 'mirror') return this._readMirror();
    await this.open();
    if (this.db) {
      try { return await this._tx('readonly', (st, set) => { const r = st.get(key); r.onsuccess = () => set(r.result); }); } catch (e) { this.lastError = e; }
    }
    return this._ls().get(key);
  }

  async writeRaw(key, env) {
    await this.open();
    if (this.db) {
      try { await this._tx('readwrite', (st) => { st.put(env, key); }); return; } catch (e) { this.lastError = e; }
    }
    this._ls().set(key, env);
  }

  // ------------------------------------------------------------------ okuma
  // Bütün kopyaları (IndexedDB + localStorage) toplar. Her kopya için sıkı doğrulama, olmazsa onarım denenir.
  async candidates() {
    await this.open();
    const out = [];
    const add = (key, src, env) => { if (env) out.push({ key, src, env }); };
    if (this.db) {
      const ks = await this.keys();
      for (const key of [...MAIN_KEYS, ...HIST_KEYS, ...BACKUP_KEYS, ...ks.filter((k) => k.startsWith('rescue_'))]) {
        try { add(key, 'idb', await this._tx('readonly', (st, set) => { const r = st.get(key); r.onsuccess = () => set(r.result); })); } catch (e) { this.lastError = e; }
      }
    }
    if (lsOk()) {
      add('mirror', 'ls', this._readMirror());
      for (const key of MAIN_KEYS) {
        try { const v = localStorage.getItem(`${LS_KEY}:${key}`); if (v) add(key, 'ls', JSON.parse(v)); } catch { /* */ }
      }
    } else {
      for (const key of MAIN_KEYS) add(key, 'mem', this.mem[key]);
    }
    for (const c of out) c.res = salvage(c.env);
    return out;
  }

  // Yükle: en yeni sağlam kayıt seçilir; kayıtta olmayan (silinmemiş) karakterler "kurtarılabilir" listesine girer.
  // Eski sürüm kaydı ilk kez açılırken dokunulmamış zarf 'v<N>_backup' anahtarına bir kez kopyalanır.
  async load() {
    let all;
    try { all = await this.candidates(); } catch (e) { this.lastError = e; all = []; }
    const tried = [];
    const storageError = this.idb && !this.db && this.openError ? errorKind(this.openError) : null;
    const newer = all.filter((c) => c.res.newer && (c.key === 'profile' || c.key === 'mirror'));
    if (newer.length) {
      this.readOnly = true;
      return { profile: null, source: null, tried: newer.map((c) => ({ key: c.key, msg: c.res.msg })), newer: true, recoverable: [] };
    }
    const live = all.filter((c) => MAIN_KEYS.includes(c.key) || c.key === 'mirror' || HIST_KEYS.includes(c.key));
    for (const c of live) if (!c.res.ok) tried.push({ key: c.key, msg: c.res.msg });
    const time = (c) => c.env.savedAt || 0;
    const countChars = (c) => c.res.profile.characters.filter(Boolean).length;
    // güven sırası: sıkı doğrulanan ya da yalnız küçük onarım gereken (bütünlüğü sağlam) kopyalar; bütünlüğü bozuk
    // (checksum tutmayan) kopya yalnız başka hiçbir kopya yoksa kullanılır. Grup içinde en yeni kayıt seçilir.
    const trusted = live.filter((c) => c.res.ok && !c.res.checksumBad);
    const ok = trusted.length ? trusted : live.filter((c) => c.res.ok);
    ok.sort((a, b) => time(b) - time(a) || (a.res.repaired ? 1 : 0) - (b.res.repaired ? 1 : 0) || (a.key === 'profile' ? -1 : 1));
    let best = ok[0] || null;
    // en yeni kopya karaktersiz bir "sıfır" profilse ve karakterli başka bir kopya varsa (bilinçli silme değilse) onu seç
    if (best && countChars(best) === 0) {
      const deleted = new Set(best.res.profile.deletedChars || []);
      const rich = ok.find((c) => countChars(c) > 0 && c.res.profile.characters.some((ch) => ch && !deleted.has(ch.id)));
      if (rich) best = rich;
    }
    if (!best) {
      // hiçbir kopya kullanılamıyor: ham veriyi kurtarma anahtarına taşı (üzerine yazılmasın)
      for (const c of live) {
        try { await this.writeRaw(`rescue_${Date.now()}_${c.src}_${c.key}`, c.env); } catch { /* */ }
      }
      return { profile: null, source: null, tried, storageError, recoverable: this._recoverable(all, null) };
    }
    const env = best.env;
    const r = best.res;
    if (env.schemaVersion < SCHEMA_VERSION) {
      const bkey = `v${env.schemaVersion}_backup`;
      try { if (!(await this.readRaw(bkey))) await this.writeRaw(bkey, env); } catch (e) { this.lastError = e; }
    }
    if (r.repaired) {
      try { await this.writeRaw(`rescue_${Date.now()}_repair_${best.key}`, env); } catch { /* */ }
    }
    const out = {
      profile: r.profile,
      source: best.key === 'mirror' && best.src === 'ls' ? 'mirror' : best.key,
      sourceStore: best.src,
      tried, savedAt: env.savedAt,
      repaired: !!r.repaired, fixes: r.fixes || [], storageError,
      recoverable: this._recoverable(all, r.profile),
    };
    if (env.schemaVersion < SCHEMA_VERSION) out.migratedFrom = env.schemaVersion;
    return out;
  }

  // Seçilen profilde olmayan ya da daha yüksek seviyede bulunan karakterler (her karakter için en ileri kopya)
  _recoverable(all, profile) {
    const have = new Map((profile?.characters || []).filter(Boolean).map((c) => [c.id, c]));
    const deleted = new Set(profile?.deletedChars || []);
    const best = new Map();
    for (const c of all) {
      if (!c.res?.ok) continue;
      for (const ch of c.res.profile.characters) {
        if (!ch || !ch.id || deleted.has(ch.id)) continue;
        const cur = have.get(ch.id);
        if (cur && (cur.level > ch.level || (cur.level === ch.level && (cur.exp || 0) >= (ch.exp || 0)))) continue;
        const prev = best.get(ch.id);
        if (!prev || ch.level > prev.char.level || (ch.level === prev.char.level && (ch.exp || 0) > (prev.char.exp || 0))) {
          best.set(ch.id, { char: ch, key: c.key, src: c.src, savedAt: c.env.savedAt || 0, replaces: !!cur });
        }
      }
    }
    return [...best.values()].sort((a, b) => b.char.level - a.char.level);
  }

  async listSnapshots() {
    const all = await this.candidates();
    const order = (k) => (k === 'profile' ? 0 : k === 'mirror' ? 1 : k.startsWith('snap') ? 2 : k.startsWith('hist') ? 3 : k.startsWith('v') ? 4 : 5);
    return all
      .sort((a, b) => order(a.key) - order(b.key) || (b.env.savedAt || 0) - (a.env.savedAt || 0))
      .map((c) => ({
        key: c.key, src: c.src, savedAt: c.env.savedAt, ok: c.res.ok, repaired: !!c.res.repaired, msg: c.res.msg,
        chars: c.res.ok ? c.res.profile.characters.filter(Boolean).map((ch) => `${ch.name} Lv.${ch.level}`) : [],
      }));
  }

  async restoreSnapshot(key, src = null) {
    const all = await this.candidates();
    const c = all.find((x) => x.key === key && (!src || x.src === src));
    if (!c) return { ok: false, msg: 'Kayıt bulunamadı' };
    if (!c.res.ok) return c.res;
    const env = await this.readRaw('profile');
    if (env) { try { await this.writeRaw(`rescue_${Date.now()}_before_restore`, env); } catch { /* */ } }
    await this.save(c.res.profile, { forceSnapshot: true });
    return { ok: true, profile: c.res.profile };
  }
}
