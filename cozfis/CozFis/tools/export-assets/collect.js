/* tools/export-assets/collect.js — sayfaya enjekte edilir (oyun ?assets=off ile, yani tamamen prosedürel açılır).
   Oyunun KENDİ üretici fonksiyonlarıyla (PB/Canvas) tüm deterministik görselleri üretir; ekran görüntüsü kırpılmaz.
   Çıktı: window.__EXP.items  [{ id, key, sig?, cat, w, h, pivot, meta, l10n }] + __EXP.png(id) → dataURL       */
(() => {
  'use strict';
  const LANGS = ['tr', 'en', 'es', 'de', 'fr', 'pt-BR'];
  const EXCLUDE = /^(sky:|uw:|wave:|cloud:|dpcloud:|nightsky|binocmask|p:|pp:|portrait:|bthumb:|boat:|town:|pier:|region:|asset:)/;
  const items = new Map(), pngs = new Map(), report = { dynamic: [], excluded: [], collisions: [], langSized: [], boatsExcluded: {}, keysSeen: 0 };
  const toCanvas = v => (v instanceof PB ? v.canvas() : v);
  const pix = c => new Uint32Array(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.buffer);
  const same = (a, b) => { if (a.width !== b.width || a.height !== b.height) return false; const A = pix(a), B = pix(b); for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false; return true; };
  const setLang = l => I18N.setLang(l, { noSave: true, silent: true });

  /* Durum bağımlılığı: üretici S veya SETTINGS'e dokunursa görsel oyuna göre değişebilir → dışa aktarılmaz (D sınıfı) */
  function probe(fn) {
    let touched = null; const rS = S, rSet = SETTINGS;
    const px = (o, n) => o && typeof o === 'object' ? new Proxy(o, { get(t, p) { if (typeof p === 'string') touched = touched || (n + '.' + p); return Reflect.get(t, p); } }) : o;
    S = px(rS, 'S'); SETTINGS = px(rSet, 'SETTINGS');
    try { return { v: fn(), touched }; } finally { S = rS; SETTINGS = rSet; }
  }
  /* Dil yamaları: tr temel; diğer dillerde farklı pikseller 8×8 hücre bileşenlerine ayrılıp dikdörtgen yama olur */
  function patches(base, other) {
    const W = base.width, H = base.height, A = pix(base), B = pix(other), CS = 8, cw = Math.ceil(W / CS), ch = Math.ceil(H / CS);
    const cell = new Uint8Array(cw * ch); let any = false;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A[y * W + x] !== B[y * W + x]) { cell[((y / CS) | 0) * cw + ((x / CS) | 0)] = 1; any = true; }
    if (!any) return null;
    const seen = new Uint8Array(cw * ch), out = [];
    for (let i = 0; i < cell.length; i++) {
      if (!cell[i] || seen[i]) continue;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const st = [i]; seen[i] = 1;
      while (st.length) { const j = st.pop(), cx = j % cw, cy = (j / cw) | 0; x0 = Math.min(x0, cx); y0 = Math.min(y0, cy); x1 = Math.max(x1, cx); y1 = Math.max(y1, cy);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue; const k = ny * cw + nx; if (cell[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
      const px0 = x0 * CS, py0 = y0 * CS, pw = Math.min(W, (x1 + 1) * CS) - px0, ph = Math.min(H, (y1 + 1) * CS) - py0;
      const [c, g] = mkCanvas(pw, ph); g.drawImage(other, px0, py0, pw, ph, 0, 0, pw, ph); out.push({ dx: px0, dy: py0, w: pw, h: ph, canvas: c });
    }
    return out;
  }
  /* Bir görseli tüm dillerde üretip kaydeder. gen() her çağrıda taze canvas/PB döndürmeli. */
  function addImage(id, cat, gen, extra) {
    setLang('tr'); const p = probe(gen); if (p.touched) { report.dynamic.push({ id, touched: p.touched }); return false; }
    let base = toCanvas(p.v); const l10n = {};
    /* üretim anında yakalanan çıktı esastır (bazı üreticiler Game.t'yi okur; sonradan çağırmak başka kare verir) */
    if (gen.captured && !same(gen.captured, base)) { report.timeDependent = (report.timeDependent || []).concat(id); pngs.set(id, gen.captured.toDataURL('image/png')); items.set(id, Object.assign({ id, cat, w: gen.captured.width, h: gen.captured.height }, extra || {})); return true; }
    for (const l of LANGS.slice(1)) {
      setLang(l); const o = toCanvas(gen());
      if (o.width !== base.width || o.height !== base.height) { report.langSized.push(id); setLang('tr'); return false; }
      const ps = patches(base, o); if (ps) l10n[l] = ps.map((q, n) => { const pid = id + '__' + l.replace('-', '') + '_' + n; pngs.set(pid, q.canvas.toDataURL('image/png')); return { id: pid, dx: q.dx, dy: q.dy, w: q.w, h: q.h }; });
    }
    setLang('tr');
    pngs.set(id, base.toDataURL('image/png'));
    items.set(id, Object.assign({ id, cat, w: base.width, h: base.height, l10n: Object.keys(l10n).length ? l10n : undefined }, extra || {}));
    return true;
  }

  /* ---------- 1) Atlas anahtarları: oyunun gerçek çağrı noktalarından kaydedilir ---------- */
  const rec = new Map();      // key → Map(sig → make)
  const _get = Atlas.get;
  Atlas.get = function (key, make) { let m = rec.get(key); if (!m) rec.set(key, m = new Map()); const s = AssetManager.makerSig(make); if (!m.has(s)) { let cap = null; try { cap = toCanvas(make()); } catch (e) { } const f = () => make(); f.captured = cap; m.set(s, f); } return _get.call(this, key, make); };
  function tourScenes() {
    const params = { BoatFishing: () => ({ rid: REGIONS[0].id }) };
    for (const name of Object.keys(Game.scenes)) {
      for (const rid of name === 'BoatFishing' ? REGIONS.map(r => r.id) : [null]) {
        try {
          if (name === 'BoatFishing') { S.regionId = rid; }
          go(name, rid ? { rid } : (params[name] ? params[name]() : {}));
          for (let k = 0; k < 40; k++) { Game.t = k * 0.11; Atlas.cache.forEach((v, key) => { if (!rec.has(key)) rec.set(key, new Map()); }); Game.scene.render(G, 1 / 60); }
        } catch (e) { report.excluded.push({ scene: name, err: String(e && e.message || e) }); }
      }
    }
  }
  function triggerAll() {
    for (const f of FISH_LIST) { fishSprite(f.id); fishSil(f.id); fishSprR(f.id); fishSilR(f.id); }
    for (const f of FISH_LIST) { Atlas.cache.delete('fishsil:' + f.id); fishSilUrl(f.id); fishUrl(f.id); }   // ansiklopedi silüet rengi (aynı anahtar, farklı üretici)
    for (const n of Object.keys(ICONS)) { iconCanvas(n); iconUrl(n); }
    Atlas.urls.clear(); ['wood', 'paper', 'btn', 'btnP', 'btnG', 'btnR', 'btnB', 'slot', 'dark'].forEach(k => Atlas.cache.delete('skin:' + k)); installSkins();
    for (const id of Object.keys(W_ART)) { for (const f of [0, 1]) { wildSprite(id, f); wildSpriteR(id, f); } wildUrl(id, 2, true); wildUrl(id, 2, false); }
    for (const id of Object.keys(SH_ART)) { shoreSprite(id); shoreUrl(id, 3, true); shoreUrl(id, 3, false); }
    for (const s of SEASONS) { homeArt(s); for (const env of Object.keys(SHORE_POS)) shoreArt(env, s); }
    /* sahne içi anahtarlar — üretici kaynağı oyundaki çağrı noktasıyla birebir aynı yazıldı (imza eşleşir) */
    Atlas.get('dolphin', dolphinPB); Atlas.get('sinker', sinkerPB); Atlas.get('follower', followerPB); Atlas.get('bobber', bobberPB); Atlas.get('gullS', gullStandPB);
    for (let i = 0; i < 4; i++) Atlas.get('shrock' + (i % 4), () => rockPB(i % 4));
    for (const t of [0, 0.2]) { Game.t = t; Atlas.get('lure' + (Math.floor(Game.t * 6) % 2), () => lurePB(Math.floor(Game.t * 6) % 2)); }
    for (let f = 0; f < 3; f++) Atlas.get('gull' + f, () => gullPB(f));
    for (let cf = 0; cf < 2; cf++) Atlas.get('cat' + cf, () => catPB(cf));
    Atlas.get('icon:fishI', () => iconPB('fishI'));
    mapArt(); sunSprite(); for (const dp of ['morning', 'evening']) dpSun(dp);
  }
  function idForKey(key, sigIdx) {
    const m = key.match(/^(fish|fishR|fishsil|fishsilR):(.+)$/);
    if (m) return 'fish_' + m[2] + ({ fish: '_left', fishR: '_right', fishsil: '_sil_left', fishsilR: '_sil_right' }[m[1]]) + (sigIdx ? '_ui' : '');
    const k = key.replace(/^icon:/, 'icon_').replace(/^skin:/, 'skin_').replace(/^wildR:(.+):(\d)$/, 'wild_$1_right_f$2').replace(/^wild:(.+):(\d)$/, 'wild_$1_left_f$2')
      .replace(/^wildu:(.+):sil$/, 'wild_$1_ui_sil').replace(/^wildu:(.+)$/, 'wild_$1_ui').replace(/^shu:(.+):s$/, 'shore_$1_ui_sil').replace(/^shu:(.+)$/, 'shore_$1_ui').replace(/^sh:/, 'shore_')
      .replace(/^home:/, 'env_home_').replace(/^shore:(sand|rocks|tide)(\w+)$/, 'env_shore_$1_$2').replace(/^seamap$/, 'env_seamap').replace(/^dpsun:/, 'sun_').replace(/^sun$/, 'sun_day');
    return (k.replace(/[^A-Za-z0-9_]+/g, '_') + (sigIdx ? '_v' + sigIdx : '')).replace(/^_+/, '');
  }
  const catOf = id => /^fish_/.test(id) ? 'fish' : /^(icon_|skin_)/.test(id) ? 'ui' : /^env_/.test(id) ? 'environment' : /^char_/.test(id) ? 'characters' : /^boat_/.test(id) ? 'boats' : 'props';

  function exportKeys() {
    const keyMap = {};
    for (const [key, makers] of rec) {
      report.keysSeen++;
      if (EXCLUDE.test(key)) { report.excluded.push({ key, why: 'prosedürel aile' }); continue; }
      if (!makers.size) { report.excluded.push({ key, why: 'üretici kaydedilmedi' }); continue; }
      const sigs = [...makers.keys()]; if (sigs.length > 1) report.collisions.push({ key, sigs: sigs.length });
      const seenImg = new Map();   // aynı anahtar + aynı piksel çıktısı veren farklı üreticiler tek görsele bağlanır
      sigs.forEach((sig, i) => {
        const make = makers.get(sig);
        let url0 = null; try { setLang('tr'); url0 = (make.captured || toCanvas(make())).toDataURL(); } catch (e) { }
        if (url0 && seenImg.has(url0)) { const prev = seenImg.get(url0); if (sigs.length > 1) { keyMap[key] = keyMap[key] && typeof keyMap[key] === 'object' ? keyMap[key] : {}; keyMap[key][sig] = prev; } return; }
        const id = idForKey(key, seenImg.size); if (url0) seenImg.set(url0, id);
        if (addImage(id, catOf(id), make, { key, sig: sigs.length > 1 ? sig : undefined })) {
          if (sigs.length > 1) { keyMap[key] = keyMap[key] && typeof keyMap[key] === 'object' ? keyMap[key] : {}; keyMap[key][sig] = id; } else keyMap[key] = id;
        }
      });
    }
    return keyMap;
  }

  /* ---------- 2) Çevre katmanları (bileşik üreticiler) ---------- */
  const memo = new Map(); const M1 = (k, fn) => { k += '|' + I18N.lang; if (!memo.has(k)) memo.set(k, fn()); return memo.get(k); };
  function exportEnv() {
    const H = AssetHooks.orig, O = { genTown: s => M1('t' + s, () => H.genTown(s)), genRegion: (r, s) => M1('r' + r + s, () => H.genRegion(r, s)), genPier: (i, s) => H.genPier(i, s) };
    for (const s of SEASONS) {
      for (const L of ['far', 'mid', 'main']) addImage('env_town_' + s + '_' + L, 'environment', () => O.genTown(s)[L], L === 'far' ? { meta: (() => { const v = O.genTown(s); return { FW: v.FW, MW: v.MW }; })() } : undefined);
      for (const r of REGIONS) for (const L of ['far', 'mid', 'near', 'bed']) addImage('env_region_' + r.id + '_' + s + '_' + L, 'environment', () => O.genRegion(r.id, s)[L], L === 'far' ? { meta: (() => { const v = O.genRegion(r.id, s); const m = {}; for (const k in v) if (!(v[k] instanceof HTMLCanvasElement)) m[k] = v[k]; return m; })() } : undefined);
      for (let i = 0; i < PIER_SPOTS.length; i++) addImage('env_pier_' + i + '_' + s, 'environment', () => O.genPier(i, s));
    }
  }
  /* ---------- 3) Karakter katmanları: saç (stil × renk) ve şapka damgaları ---------- */
  function crop(pb, ox, oy) {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < pb.h; y++) for (let x = 0; x < pb.w; x++) if (pb.d[y * pb.w + x] >>> 24) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 < 0) return null; const o = new PB(x1 - x0 + 1, y1 - y0 + 1); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) o.d[(y - y0) * o.w + (x - x0)] = pb.d[y * pb.w + x];
    return { pb: o, off: [x0 - ox, y0 - oy] };
  }
  function exportChars() {
    const O = AssetHooks.orig, styles = [...new Set((String(O.drawHair).match(/case (\d+):/g) || []).map(s => +s.match(/\d+/)[0]))];
    for (const st of styles) for (let c = 0; c < HAIR_COLORS.length; c++) {
      const gen = () => { const p = new PB(CH_W + 16, CH_H + 16); O.drawHair(p, { hair: st, hairColor: c }, 8, 8); return crop(p, 8, 8); };
      const r = gen(); if (r) addImage('char_hair_' + st + '_c' + c, 'characters', () => gen().pb, { meta: { off: r.off, layer: 'hair', style: st, color: c }, pivot: [-r.off[0], -r.off[1]] });
    }
    const hats = [...new Set((String(O.drawHat).match(/case '([\w]+)'/g) || []).map(s => s.match(/'(\w+)'/)[1]))];
    for (const h of hats) { const gen = () => { const p = new PB(CH_W + 16, CH_H + 16); O.drawHat(p, h, 8, 8); return crop(p, 8, 8); }; const r = gen(); if (r) addImage('char_hat_' + h, 'characters', () => gen().pb, { meta: { off: r.off, layer: 'hat' }, pivot: [-r.off[0], -r.off[1]] }); }
    return { styles, hats, colors: HAIR_COLORS.length };
  }
  /* ---------- 4) Tekneler: renk başına temel (dış hat öncesi) + boyut başına fark damgaları; tüm kombinasyonlar doğrulanır ---------- */
  function exportBoats() {
    const O = AssetHooks.orig, DIMS = AssetHooks.BOAT_DIMS, out = {};
    const noOutline = fn => { const o = PB.prototype.outline; PB.prototype.outline = function () { }; try { return fn(); } finally { PB.prototype.outline = o; } };
    const realByIdBak = JSON.stringify(S.boats.byId);
    for (const id of Object.keys(BOAT_INFO)) {
      const ups = BOAT_INFO[id].ups, tuples = new Map();
      for (let mask = 0; mask < (1 << ups.length); mask++) {
        const u = {}; ups.forEach((x, i) => { if (mask & (1 << i)) u[x.key] = true; });
        S.boats.byId[id] = { ups: u, color: 'sea_green', name: '' }; const st = Boats.stats(id);
        const t = { motor: st.motor, hull: st.hull, nav: st.nav, storage: st.storage }; tuples.set(DIMS.map(k => t[k]).join(','), t);
      }
      S.boats.byId[id] = { ups: {}, color: 'sea_green', name: '' }; const st0 = Boats.stats(id); const base = { motor: st0.motor, hull: st0.hull, nav: st0.nav, storage: st0.storage };
      const levels = {}; for (const k of DIMS) levels[k] = [...new Set([...tuples.values()].map(t => t[k]))].filter(v => v !== base[k]);
      for (const col of BOAT_COLORS) {
        const pre = 'boat_' + id + '_' + col.id, cfgOf = t => Object.assign({ color: col.id, name: '', ornament: null }, base, t);
        const b0 = noOutline(() => O.boatParts(id, cfgOf({})));
        const res = {}; for (const k in b0) if (!(b0[k] instanceof PB)) res[k] = b0[k];
        const exclude = [];
        const stamps = {};
        for (const k of DIMS) for (const v of levels[k]) {
          const bv = noOutline(() => O.boatParts(id, cfgOf({ [k]: v })));
          for (const L of ['back', 'front']) { const s = new PB(bv[L].w, bv[L].h); for (let i = 0; i < s.d.length; i++) { const a = b0[L].d[i], b = bv[L].d[i]; if (a !== b) s.d[i] = (b >>> 24) ? b : 0x01000000; } stamps[k + v + '_' + L] = s; }
        }
        // doğrulama: her kombinasyon için damga birleşimi + dış hat == özgün boatParts
        for (const [tk, t] of tuples) {
          const ref = O.boatParts(id, cfgOf(t)); const B = new PB(b0.back.w, b0.back.h), F = new PB(b0.front.w, b0.front.h); B.d.set(b0.back.d); F.d.set(b0.front.d);
          for (const k of DIMS) if (t[k] !== base[k]) { AssetHooks.applyStamp(B, stamps[k + t[k] + '_back']); AssetHooks.applyStamp(F, stamps[k + t[k] + '_front']); }
          B.outline(null, 0.55); F.outline(null, 0.55);
          const eq = (p, q) => p.d.length === q.d.length && p.d.every((v, i) => v === q.d[i]);
          if (!eq(B, ref.back) || !eq(F, ref.front)) exclude.push(tk);
        }
        if (exclude.length) report.boatsExcluded[pre] = exclude;
        addImage(pre + '_base_back', 'boats', () => noOutline(() => O.boatParts(id, cfgOf({}))).back, { meta: { res, base, levels, exclude, tuples: tuples.size, layer: 'back' } });
        addImage(pre + '_base_front', 'boats', () => noOutline(() => O.boatParts(id, cfgOf({}))).front, { meta: { layer: 'front' } });
        for (const sk in stamps) { const c = crop(stamps[sk], 0, 0); if (!c) continue; addImage(pre + '_' + sk, 'boats', () => crop(stamps[sk], 0, 0).pb, { meta: { layer: sk.endsWith('back') ? 'back' : 'front', stamp: true, off: c.off } }); }
      }
      out[id] = { tuples: tuples.size, levels, base };
    }
    S.boats.byId = JSON.parse(realByIdBak);
    return out;
  }

  window.__EXP = {
    run() {
      const t0 = performance.now();
      Atlas.cache.clear(); Atlas.urls.clear();
      triggerAll(); tourScenes(); go('MainMenu');
      const keyMap = exportKeys();
      exportEnv();
      const chars = exportChars();
      const boats = exportBoats();
      setLang('tr');
      return { keyMap, chars, boats, report, n: items.size, patches: [...pngs.keys()].filter(k => k.includes('__')).length, ms: Math.round(performance.now() - t0) };
    },
    list() { return [...items.values()]; },
    png(ids) { return ids.map(id => pngs.get(id)); },
    ids() { return [...pngs.keys()]; }
  };
})();
