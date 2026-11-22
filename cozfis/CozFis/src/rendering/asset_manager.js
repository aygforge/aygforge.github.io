'use strict';
/* =====================================================================
   asset_manager.js : Hibrit varlık yöneticisi (PNG atlas + prosedürel geri dönüş)
   - assets/manifest.js (window.ASSET_MANIFEST) → atlas sayfaları + bağımsız katman görselleri
   - get(id) / canvas(key) daima drawImage ile uyumlu bir <canvas> döndürür (asla Image/ImageBitmap değil)
   - Atlas.get(key, make) kancası: dışa aktarılmış sprite varsa atlastan kesilir, yoksa make() (prosedürel)
   - Dil yamaları: tabela/yazı içeren katmanlarda temel (tr) piksellerinin üstüne o dilin dikdörtgenleri
   - Çevrimdışı: yalnız göreli yollar; ağ API'si kullanılmaz (Image öğesi ile yükleme)
   - Kapatma: ?assets=off  (tamamen prosedürel; karşılaştırma ve dışa aktarma bunu kullanır)
   ===================================================================== */
const AssetManager = (() => {
  const M = window.ASSET_MANIFEST || null;
  const imgs = new Map();          // sayfa/dosya adı → HTMLImageElement (yüklenmiş)
  const pending = new Map();       // sayfa adı → Promise
  const stats = { hits: 0, fallbacks: 0, fallbackKeys: [], pbHits: 0, loadMs: 0, bytes: 0, pages: 0, errors: [] };
  let enabled = !!M && !/[?&]assets=off\b/.test(location.search);
  let ready = false, disabledReason = M ? (enabled ? null : 'assets=off') : 'manifest yok';

  const spriteOf = id => (M && M.sprites[id]) || null;
  const idOfKey = key => (M && M.keys[key]) || null;

  function loadPage(name) {
    if (imgs.has(name)) return Promise.resolve(imgs.get(name));
    if (pending.has(name)) return pending.get(name);
    const page = M.pages[name];
    const p = new Promise(res => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => { imgs.set(name, im); stats.pages++; stats.bytes += page.bytes || 0; res(im); };
      im.onerror = () => { stats.errors.push(page.file); pending.delete(name); res(null); };   // sonra yeniden denenebilir
      im.src = page.file;
    });
    pending.set(name, p); return p;
  }
  /* file:// altında yüklenen PNG canvas'ı "kirletir" (toDataURL / getImageData yasak). O durumda
     Atlas.url ve foto modu bozulmasın diye tamamen prosedürel moda düşülür. */
  function taintCheck(im) {
    try { const [c, x] = mkCanvas(1, 1); x.drawImage(im, 0, 0, 1, 1, 0, 0, 1, 1); x.getImageData(0, 0, 1, 1); c.toDataURL(); return true; }
    catch (e) { return false; }
  }
  /* Gruplar: 'core' (balık/arayüz/karakter/tekne/dekor + deniz haritası) açılıştan önce beklenir; manifest.bootGroups
     (ana menü arka planı) da beklenir. Çevre grupları (season_<mevsim>, region_<bölge>_<mevsim>) isteğe bağlıdır:
     want(grup) ile önceden yüklenir; yüklenmemiş bir çevre görseli istenirse o anda prosedürel üretime düşülür
     (piksel düzeyinde aynı çıktı) ve grup arka planda yüklenir. 45 sn kullanılmayan isteğe bağlı gruplar bırakılır
     (çözülmüş görüntü belleği geri verilir; gerekirse HTTP önbelleğinden yeniden yüklenir). */
  const pagesOf = g => Object.keys(M.pages).filter(n => M.pages[n].group === g);
  const lastUse = new Map();     // grup → zaman
  function want(group) {
    if (!enabled || !M || group === 'core') return Promise.resolve(true);
    lastUse.set(group, performance.now());
    return Promise.all(pagesOf(group).map(loadPage)).then(r => r.every(Boolean));
  }
  function releaseIdle(maxIdleMs) {
    const now = performance.now(); let n = 0;
    for (const [g, t] of lastUse) if (now - t > maxIdleMs) { for (const pg of pagesOf(g)) { imgs.delete(pg); pending.delete(pg); } lastUse.delete(g); n++; }
    return n;
  }
  function heldMB() { let px = 0; for (const n of imgs.keys()) px += M.pages[n].w * M.pages[n].h; return +(px * 4 / 1048576).toFixed(1); }
  async function load(opts) {
    opts = opts || {}; if (/[?&]assets=all\b/.test(location.search)) opts.all = true;   // doğrulama: hepsini yükle, bırakma
    if (!enabled) { ready = true; return { enabled, reason: disabledReason }; }
    const t0 = performance.now();
    const names = Object.keys(M.pages);
    const boot = new Set(['core', ...(M.bootGroups || [])]);
    const first = names.filter(n => boot.has(M.pages[n].group) || opts.all);
    (M.bootGroups || []).forEach(g => lastUse.set(g, performance.now()));
    const firstOk = await Promise.all(first.map(loadPage));
    const probe = firstOk.find(Boolean);
    if (!probe || !taintCheck(probe)) {
      enabled = false; disabledReason = probe ? 'canvas kirlendi (file:// ?) — prosedürel mod' : 'atlaslar yüklenemedi — prosedürel mod';
      imgs.clear(); console.warn('[AssetManager]', disabledReason);
    } else if (!opts.all) setInterval(() => releaseIdle(45000), 15000);
    stats.loadMs = Math.round(performance.now() - t0); ready = true;
    return { enabled, reason: disabledReason, ms: stats.loadMs };
  }
  const loaded = name => imgs.get(name) || null;

  /* Bir sprite'ı yeni bir canvas'a çizer (+ etkin dilin yamaları). Görsel hazır değilse null (+ grubu yüklemeye başlar). */
  function render(sp, lang) {
    const g = M.pages[sp.page].group; if (g !== 'core') lastUse.set(g, performance.now());
    const im = loaded(sp.page); if (!im) { if (g !== 'core') want(g); return null; }
    const [c, x] = mkCanvas(sp.w, sp.h);
    x.drawImage(im, sp.x, sp.y, sp.w, sp.h, 0, 0, sp.w, sp.h);
    const L = sp.l10n && sp.l10n[lang];
    if (L) for (const p of L) {
      const pm = loaded(p.page); if (!pm) { want(M.pages[p.page].group); return null; }
      x.clearRect(p.dx, p.dy, p.w, p.h); x.drawImage(pm, p.x, p.y, p.w, p.h, p.dx, p.dy, p.w, p.h);
    }
    return c;
  }
  const curLang = () => (typeof I18N !== 'undefined' ? I18N.lang : 'tr');

  /* ---- genel API ---- */
  function has(id) { return enabled && !!spriteOf(id); }
  function get(id) {                       // id ile canvas (her çağrıda yeni kopya; çağıran önbelleğe alır)
    if (!enabled) return null; const sp = spriteOf(id); if (!sp) return null;
    const c = render(sp, curLang()); if (c) { stats.hits++; c._assetId = id; if (sp.pivot) c._pivot = sp.pivot; } return c;
  }
  function canvas(key, make) { const id = M && (make ? idFor(key, make) : idOfKey(key)); return id && typeof id === 'string' ? get(id) : null; }
  function pb(id) {                        // PB (piksel tamponu) kopyası — katman/damga birleştirmesi için
    const c = get(id); if (!c) return null;
    const p = new PB(c.width, c.height); p.d.set(new Uint32Array(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.buffer));
    stats.pbHits++; return p;
  }
  function draw(ctx, id, x, y, o) {        // doğrudan çizim (pivot, yatay çevirme, ölçek)
    o = o || {}; const sp = spriteOf(id); const c = (sp && o.cache !== false) ? Atlas.get('asset:' + id, () => get(id) || new PB(1, 1)) : get(id); if (!c) return false;
    const s = o.scale || 1, pv = (sp && sp.pivot) || [0, 0];
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(y));
    if (o.flip) { ctx.scale(-1, 1); } ctx.drawImage(c, -pv[0] * s, -pv[1] * s, c.width * s, c.height * s); ctx.restore(); return true;
  }
  function url(id, scale) { return Atlas.url('asset:' + id, () => get(id) || new PB(1, 1), scale || 1); }
  function meta(id) { const sp = spriteOf(id); return sp ? sp.meta || null : null; }

  /* ---- Atlas.get kancası: tüm mevcut çağrı noktaları (drawImage + Atlas.url data-URL tüketicileri) aynen çalışır ---- */
  /* Aynı anahtar farklı üreticilerle doldurulabiliyor (ör. 'fishsil:' hem oyun içi hem ansiklopedi rengi;
     özgün oyunda hangisi önce çağrılırsa önbelleğe o girer). Bu davranışı birebir korumak için anahtar,
     üretici fonksiyonun kaynak imzasıyla eşlenir: keys[key] = id  |  { <imza>: id }. */
  const sigCache = new Map();
  function makerSig(fn) { const src = String(fn); let h = sigCache.get(src); if (h === undefined) { h = 0x811c9dc5; for (let i = 0; i < src.length; i++) h = Math.imul(h ^ src.charCodeAt(i), 16777619); h = (h >>> 0).toString(36); sigCache.set(src, h); } return h; }
  function idFor(key, make) { const e = M.keys[key]; if (!e) return null; return typeof e === 'string' ? e : (e[makerSig(make)] || null); }
  const _get = Atlas.get;
  Atlas.get = function (key, make) {
    let c = this.cache.get(key); if (c) return c;
    const id = enabled ? idFor(key, make) : null;
    if (id) { c = get(id); if (c) { this.cache.set(key, c); return c; } stats.fallbacks++; if (stats.fallbackKeys.length < 50) stats.fallbackKeys.push(key); }
    return _get.call(this, key, make);
  };

  return {
    load, want, releaseIdle, heldMB, has, get, canvas, makerSig, pb, draw, url, meta, stats,
    get enabled() { return enabled; }, get ready() { return ready; }, get reason() { return disabledReason; },
    get manifest() { return M; },
    disable(reason) { enabled = false; disabledReason = reason || 'disabled'; }
  };
})();
