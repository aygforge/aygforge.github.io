/* tools/validate/driver.js — A (özgün tek dosya) ve B (modüler + atlas) sayfalarına aynen enjekte edilir.
   Aynı çağrı dizisini çalıştırır ve Atlas önbelleğindeki her girdinin + sahne karelerinin piksel özetini döndürür. */
(() => {
  'use strict';
  const fnv = (u8) => { let h = 0x811c9dc5; for (let i = 0; i < u8.length; i++) h = Math.imul(h ^ u8[i], 16777619); return (h >>> 0).toString(16); };
  const hashCanvas = c => { if (c instanceof PB) c = c.canvas(); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; return c.width + 'x' + c.height + ':' + fnv(d); };
  const hashVal = v => {
    if (!v) return String(v);
    if (v instanceof HTMLCanvasElement || v instanceof PB) return hashCanvas(v);
    if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v).sort()) o[k] = (v[k] instanceof HTMLCanvasElement || v[k] instanceof PB) ? hashCanvas(v[k]) : JSON.stringify(v[k]); return JSON.stringify(o); }
    return String(v);
  };
  window.__VAL = {
    run(opts) {
      const out = { cache: {}, urls: {}, frames: {}, counts: {} };
      const langs = opts.langs; const t0 = performance.now();
      beginNewGame({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' });
      const snapCache = (lang) => { for (const [k, v] of Atlas.cache) { const key = lang + '|' + k; if (!(key in out.cache)) out.cache[key] = hashVal(v); } };
      for (const lang of langs) {
        I18N.setLang(lang, { noSave: true, silent: true });
        Atlas.cache.clear(); Atlas.urls.clear();
        // 1) basit sprite aileleri (gerçek sarmalayıcılar)
        for (const f of FISH_LIST) { fishSprite(f.id); fishSprR(f.id); fishSilR(f.id); fishUrl(f.id); }
        for (const f of FISH_LIST) fishSil(f.id);
        snapCache(lang);
        for (const f of FISH_LIST) { Atlas.cache.delete('fishsil:' + f.id); fishSilUrl(f.id); out.cache[lang + '|fishsil(ui):' + f.id] = hashVal(Atlas.cache.get('fishsil:' + f.id)); }
        for (const n of Object.keys(ICONS)) { iconCanvas(n); iconUrl(n); }
        for (const id of Object.keys(W_ART)) { for (const f of [0, 1]) { wildSprite(id, f); wildSpriteR(id, f); } wildUrl(id, 2, true); wildUrl(id, 2, false); }
        for (const id of Object.keys(SH_ART)) { shoreSprite(id); shoreUrl(id, 3, true); shoreUrl(id, 3, false); }
        for (const s of SEASONS) { homeArt(s); for (const env of Object.keys(SHORE_POS)) shoreArt(env, s); }
        mapArt(); sunSprite(); dpSun('morning'); dpSun('evening');
        snapCache(lang);
        // 2) çevre: kasaba / bölge / iskele (+ proje maskeleri: decorate* prosedürel üstte)
        const pmReal = Projects.mask;
        for (const pm of ['0000', '1111']) {
          Projects.mask = () => pm;
          for (const s of SEASONS) {
            out.cache[lang + '|town:' + s + ':' + pm] = hashVal(townArt(s));
            for (let i = 0; i < PIER_SPOTS.length; i++) out.cache[lang + '|pier:' + i + s + ':' + pm] = hashVal(pierArt(i, s));
            if (pm === '0000') for (const r of REGIONS) out.cache[lang + '|region:' + r.id + ':' + s] = hashVal(regionArt(r.id, s));
          }
        }
        Projects.mask = pmReal;
        // 3) tekneler: tüm yükseltme alt kümeleri × renk (+ isim levhası ve süs)
        if (lang === langs[0] || opts.allLangBoats) {
          for (const id of Object.keys(BOAT_INFO)) {
            const ups = BOAT_INFO[id].ups, bak = S.boats.byId[id];
            for (let mask = 0; mask < (1 << ups.length); mask++) {
              const u = {}; ups.forEach((x, i) => { if (mask & (1 << i)) u[x.key] = true; });
              S.boats.byId[id] = { ups: u, color: 'sea_green', name: '' }; const st = Boats.stats(id);
              for (const col of BOAT_COLORS) {
                const cfg = { color: col.id, name: '', motor: st.motor, hull: st.hull, nav: st.nav, storage: st.storage, ornament: null };
                out.cache[lang + '|boat:' + id + ':' + JSON.stringify(cfg)] = hashVal(boatSprite(id, cfg));
                if (mask === (1 << ups.length) - 1) { const c2 = Object.assign({}, cfg, { name: 'Martı Ğİ', ornament: 'orn_' + REGIONS[mask % REGIONS.length].id }); out.cache[lang + '|boat:' + id + ':' + JSON.stringify(c2)] = hashVal(boatSprite(id, c2)); }
              }
            }
            if (bak) S.boats.byId[id] = bak; else delete S.boats.byId[id];
          }
          // 4) karakterler: saç stili × renk × poz, şapka × saç × poz
          const look = (o) => Object.assign({ name: 'QA', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'none' }, o);
          for (let h = 0; h < 8; h++) for (let c = 0; c < HAIR_COLORS.length; c++) for (const p of POSES) { const L = look({ hair: h, hairColor: c, body: (h + c) % 2, skin: c % SKINS.length }); out.cache[lang + '|p:' + lookKey(L) + p] = hashVal(personSprite(L, p)) + '|' + JSON.stringify(handOf(L, p)); }
          for (const hat of ['klasik', 'bere', 'hasir', 'kaptan', 'usta', 'kasket', 'flat', 'denizci_bere', 'cicek_taci', 'fener_beresi', 'bandana']) for (let h = 0; h < 8; h++) for (const p of ['idle0', 'idle1', 'walk1', 'sad', 'catch', 'reel1']) { const L = look({ hair: h, hat, hairColor: h % HAIR_COLORS.length }); out.cache[lang + '|p:' + lookKey(L) + p] = hashVal(personSprite(L, p)) + '|' + JSON.stringify(handOf(L, p)); }
        }
        snapCache(lang);
        // 5) sahne kareleri (Math.random tohumlu; aynı Game.t) — tüm canvas tamponu
        for (const name of Object.keys(Game.scenes)) {
          for (const rid of name === 'BoatFishing' ? REGIONS.map(r => r.id) : [null]) {
            try {
              if (rid) S.regionId = rid;
              go(name, rid ? { rid } : {});
              for (const t of [0.5, 1.7, 3.3]) { Game.t = t; Game.fade = 0; G.setTransform(1, 0, 0, 1, 0, 0); G.globalAlpha = 1; G.fillStyle = '#100c18'; G.fillRect(0, 0, LW, LH); Game.scene.render(G, 0); out.frames[lang + '|' + name + (rid ? ':' + rid : '') + '@' + t] = hashCanvas(BUF); }
            } catch (e) { out.frames[lang + '|' + name + (rid ? ':' + rid : '')] = 'ERR ' + e.message; }
          }
        }
        snapCache(lang);
        for (const [k, u] of Atlas.urls) out.urls[lang + '|' + k] = u.length + ':' + fnv(new TextEncoder().encode(u));
      }
      go('MainMenu'); I18N.setLang(langs[0], { noSave: true, silent: true });
      out.ms = Math.round(performance.now() - t0);
      out.am = typeof AssetManager !== 'undefined' ? { enabled: AssetManager.enabled, stats: AssetManager.stats, reason: AssetManager.reason } : null;
      return out;
    }
  };
})();
