/* ---- 00_i18n.js ---- */
/* =====================================================================
   00_i18n.js : CozFis yerelleştirme çekirdeği (çevrimdışı, veri odaklı)
   - window.LOCALE_DATA: { tr: {anahtar: metin}, en: {...}, es, de, fr, 'pt-BR' }
   - t(key, args): {0} parametreleri, {0|tekil|çoğul} çoğul seçimi (Intl.PluralRules)
   - Eksik anahtar: İngilizce → Türkçe → anahtar (kontrollü geri dönüş + rapor)
   - Dil tercihi ayrı uygulama ayarı olarak saklanır (kayıt şemasına dokunmaz)
   ===================================================================== */
'use strict';
const I18N = (() => {
  const LANGS = [
    { code: 'tr', name: 'Türkçe', tag: 'tr-TR' }, { code: 'en', name: 'English', tag: 'en-US' },
    { code: 'es', name: 'Español', tag: 'es-ES' }, { code: 'de', name: 'Deutsch', tag: 'de-DE' },
    { code: 'fr', name: 'Français', tag: 'fr-FR' }, { code: 'pt-BR', name: 'Português (Brasil)', tag: 'pt-BR' }
  ];
  const NUM = { tr: { group: '.', dec: ',' }, en: { group: ',', dec: '.' }, es: { group: '.', dec: ',' }, de: { group: '.', dec: ',' }, fr: { group: ' ', dec: ',' }, 'pt-BR': { group: '.', dec: ',' } };
  const PCT = { tr: n => '%' + n, en: n => n + '%', es: n => n + ' %', de: n => n + ' %', fr: n => n + ' %', 'pt-BR': n => n + '%' };
  const PREF = 'cozyfishing_lang_v1';
  const D = window.LOCALE_DATA || { tr: {} };
  const missing = new Map();
  const listeners = [];
  const byCode = c => LANGS.find(l => l.code === c);
  function match(tag) {
    if (!tag) return null; const t = String(tag).toLowerCase();
    if (t.startsWith('pt')) return 'pt-BR';
    for (const l of LANGS) if (t === l.code || t.startsWith(l.code + '-') || t.startsWith(l.code + '_')) return l.code;
    return null;
  }
  function stored() { try { const v = localStorage.getItem(PREF); return v && byCode(v) ? v : null; } catch (e) { return null; } }
  function detect() {
    const s = stored(); if (s) return s;
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || navigator.userLanguage || '']);
    for (const l of list) { const m = match(l); if (m) return m; }
    return 'en';
  }
  let lang = detect(); let info = byCode(lang); let num = NUM[lang]; let plural = null;
  const pr = () => plural || (plural = (typeof Intl !== 'undefined' && Intl.PluralRules) ? new Intl.PluralRules(info.tag) : { select: n => (n === 1 ? 'one' : 'other') });
  function format(m, args) {
    if (!args) return m;
    return m.replace(/\{(\d+)(?:\|([^{}|]*)\|([^{}]*))?\}/g, (all, i, one, other) => {
      const v = args[+i];
      if (one === undefined) return v === undefined || v === null ? '' : String(v);
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d,.-]/g, '').replace(',', '.'));
      return pr().select(isNaN(n) ? 0 : n) === 'one' ? one : other;
    });
  }
  function lookup(key) {
    const d = D[lang]; let m = d && d[key];
    if (m == null) {
      if (lang !== 'tr') { const k = lang + ':' + key; missing.set(k, (missing.get(k) || 0) + 1); }
      m = (D.en && D.en[key]) != null && lang !== 'tr' ? D.en[key] : (D.tr && D.tr[key]) != null ? D.tr[key] : key;
    }
    return m;
  }
  function t(key, args) { return format(lookup(key), args); }
  function has(key, l) { const d = D[l || lang]; return !!(d && d[key] != null); }
  function upper(s) { return String(s).normalize('NFC').toLocaleUpperCase(info.tag); }
  function lower(s) { return String(s).normalize('NFC').toLocaleLowerCase(info.tag); }
  /* ---- veri bağlama: JSON varlık alanları id bazında çeviri anahtarına bağlanır (id'ler değişmez) ---- */
  function bindField(obj, field, key) {
    if (!obj || !Object.prototype.hasOwnProperty.call(obj, field)) return;
    const orig = obj[field];
    Object.defineProperty(obj, field, {
      configurable: true, enumerable: true,
      get() { return has(key) ? D[lang][key] : (lang !== 'tr' && D.en && D.en[key] != null ? (missing.set(lang + ':' + key, 1), D.en[key]) : orig); },
      set(v) { Object.defineProperty(this, field, { value: v, writable: true, configurable: true, enumerable: true }); }
    });
  }
  const catKey = c => 'd.achcat.' + String(c).toLowerCase().replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  function bindData(o) {
    const { DB, CFG, EXP, REGIONS, ACHS } = o;
    const regs = [].concat(DB.regions, CFG.regions, REGIONS);
    for (const r of regs) { bindField(r, 'name', 'd.region.' + r.id + '.name'); bindField(r, 'requirements', 'd.region.' + r.id + '.req'); }
    for (const s of DB.spots) bindField(s, 'name', 'd.spot.' + s.id + '.name');
    for (const b of DB.bait_catalog) bindField(b, 'name', 'd.bait.' + b.id + '.name');
    for (const [kind, k] of [['rods', 'rod'], ['lines', 'line'], ['reels', 'reel'], ['hooks', 'hook'], ['bait', 'bait']]) for (const g of CFG.shop[kind]) bindField(g, 'name', 'd.' + k + '.' + g.id + '.name');
    for (const b of CFG.boats) bindField(b, 'name', 'd.boat.' + b.id + '.name');
    for (const a of CFG.automation) bindField(a, 'name', 'd.auto.' + a.id + '.name');
    for (const c of CFG.customers) bindField(c, 'name', 'd.cust.' + c.id + '.name');
    for (const e of CFG.events) bindField(e, 'name', 'd.event.' + e.id + '.name');
    for (const a of ACHS) {
      bindField(a, 'name', 'd.ach.' + a.id + '.name'); bindField(a, 'category', catKey(a.category));
      if (a.id === 'species42') Object.defineProperty(a, 'condition_tr', { configurable: true, enumerable: true, get() { return t('i18n.ach_all_species', [DB.fish.length]); }, set(v) { Object.defineProperty(this, 'condition_tr', { value: v, writable: true, configurable: true, enumerable: true }); } });
      else bindField(a, 'condition_tr', 'd.ach.' + a.id + '.cond');
    }
    for (const s of EXP.shops) bindField(s, 'name', 'd.shop.' + s.id + '.name');
    for (const s of EXP.snacks) { bindField(s, 'name', 'd.snack.' + s.id + '.name'); bindField(s, 'desc', 'd.snack.' + s.id + '.desc'); }
    for (const f of EXP.festivals) { bindField(f, 'name', 'd.fest.' + f.id + '.name'); bindField(f, 'comp_name', 'd.fest.' + f.id + '.comp'); bindField(f, 'rule', 'd.fest.' + f.id + '.rule'); }
    for (const r of EXP.rivals) bindField(r, 'name', 'd.rival.' + r.id + '.name');
    for (const f of DB.fish) { bindField(f, 'name_tr', 'd.fish.' + f.id + '.name'); bindField(f, 'encyclopedia_tr', 'd.fish.' + f.id + '.desc'); }
    for (const npc in CFG.npc_dialogues) for (const d of CFG.npc_dialogues[npc]) bindField(d, 'text_tr', 'd.npc.' + npc + '.' + d.trigger);
  }
  /* ---- statik HTML (döndürme ekranı, açılış yazısı, başlık) ---- */
  function applyStatic() {
    try {
      document.documentElement.lang = lang === 'pt-BR' ? 'pt-BR' : lang;
      document.title = 'CozFis';
      const md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', t('i18n.meta_desc'));
      document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
      const cv = document.getElementById('screen'); if (cv) cv.setAttribute('aria-label', t('i18n.canvas_label'));
    } catch (e) { }
  }
  function setLang(code, opts) {
    if (!byCode(code)) return false;
    const changed = code !== lang;
    lang = code; info = byCode(code); num = NUM[code]; plural = null; api.num = num;
    if (!(opts && opts.noSave)) { try { localStorage.setItem(PREF, code); } catch (e) { } }
    applyStatic();
    if (changed && !(opts && opts.silent)) for (const f of listeners) { try { f(code); } catch (e) { console.error('i18n listener', e); } }
    return true;
  }
  /* ---- doğrulama: dil bazında eksik / boş / kaynakla aynı kalmış anahtarlar ---- */
  function validate() {
    const base = Object.keys(D.tr || {}); const rep = {};
    for (const l of LANGS) {
      if (l.code === 'tr') continue; const d = D[l.code] || {};
      const miss = base.filter(k => d[k] == null || d[k] === '');
      const extra = Object.keys(d).filter(k => !(k in D.tr));
      const idx = m => [...new Set((String(m).match(/\{(\d+)/g) || []).map(x => x.slice(1)))].sort().join();
      const ph = base.filter(k => d[k] != null && idx(D.tr[k].replace(/<[^>]*>/g, '')) !== idx(d[k].replace(/<[^>]*>/g, '')));
      rep[l.code] = { total: base.length, missing: miss.length, missingKeys: miss.slice(0, 50), extra: extra.length, placeholderMismatch: ph.length, phKeys: ph.slice(0, 20) };
    }
    return rep;
  }
  const api = {
    LANGS, t, has, upper, lower, format, bindData, setLang, validate, applyStatic,
    get lang() { return lang; }, get tag() { return info.tag; }, get name() { return info.name; },
    num, pct: n => PCT[lang](n),
    onChange(f) { listeners.push(f); },
    missingReport() { return [...missing.keys()]; },
    stored, detect, match, PREF
  };
  return api;
})();
const _t = I18N.t;
/* yükleme anında tanımlı tablolar için tembel çeviri yardımcıları */
function _sv(o, k, v) { Object.defineProperty(o, k, { value: v, writable: true, configurable: true, enumerable: true }); }
function _L(f) { return { __i18n: f }; }
function _LA(arr) { arr.forEach((v, i) => { if (v && v.__i18n) { const f = v.__i18n; Object.defineProperty(arr, i, { get: f, set(x) { _sv(arr, i, x); }, enumerable: true, configurable: true }); } }); return arr; }
