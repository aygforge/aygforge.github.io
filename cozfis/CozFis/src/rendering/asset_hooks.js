'use strict';
/* =====================================================================
   asset_hooks.js : Katmanlı/bileşik varlıkların hibrit bağlantıları
   Prosedürel üreticiler (06_* sonrası nihai hâlleri) burada sarmalanır; PNG varsa ondan kurulur,
   yoksa (veya ?assets=off) özgün fonksiyon çalışır. Özgün fonksiyonlar AssetHooks.orig içinde
   saklanır — dışa aktarıcı (tools/export-assets) PNG'leri bunlarla üretir.
     • Kasaba    genTown(season)        → env_town_<mevsim>_{far,mid,main}   (+ decorateTown prosedürel kalır)
     • Bölgeler  genRegion(rid, season) → env_region_<bölge>_<mevsim>_{far,mid,near,bed}
     • İskele    genPier(i, season)     → env_pier_<i>_<mevsim>              (+ decoratePier prosedürel kalır)
     • Saç       drawHair(...)          → char_hair_<stil>_c<renk>  (damga; el/olta noktası koddan gelir, değişmez)
     • Şapka     drawHat(...)           → char_hat_<id>             (damga)
     • Tekneler  boatParts(id, cfg)     → boat_<id>_<renk>_base_{back,front} + yükseltme damgaları
                                          (isim levhası ve süs prosedürel; dış hat birleştirmeden sonra)
   ===================================================================== */
const AssetHooks = (() => {
  const orig = { genTown, genRegion, genPier, drawHair, drawHat, boatParts };
  const AM = AssetManager;
  const stampCache = new Map();
  const stamp = id => { if (!AM.enabled) return null; let s = stampCache.get(id); if (s === undefined) { s = AM.pb(id); if (s) s._meta = AM.meta(id) || {}; else return null; stampCache.set(id, s); } return s; };
  /* bileşik çıktı: { <katman>: canvas, ...meta }  — her çağrıda yeni canvas (decorate* fonksiyonları üstüne çizer) */
  function composite(prefix, layers) {
    if (!AM.enabled) return null; const out = {};
    for (const l of layers) { const c = AM.get(prefix + '_' + l); if (!c) return null; out[l] = c; }
    return Object.assign({}, AM.meta(prefix + '_' + layers[0]) || {}, out);
  }
  genTown = function (season) { return composite('env_town_' + season, ['far', 'mid', 'main']) || orig.genTown(season); };
  genRegion = function (rid, season) { return composite('env_region_' + rid + '_' + season, ['far', 'mid', 'near', 'bed']) || orig.genRegion(rid, season); };
  genPier = function (i, season) { return (AM.enabled && AM.pb('env_pier_' + i + '_' + season)) || orig.genPier(i, season); };

  const hairId = look => 'char_hair_' + (look.hair | 0) + '_c' + (HAIR_COLORS[look.hairColor] ? look.hairColor : 0);
  drawHair = function (pb, look, ox, oy, hat) {
    const s = stamp(hairId(look)); if (!s) return orig.drawHair(pb, look, ox, oy, hat);
    pb.blit(s, ox + s._meta.off[0], oy + s._meta.off[1]);
  };
  drawHat = function (pb, id, ox, oy) {
    const s = stamp('char_hat_' + id); if (!s) return orig.drawHat(pb, id, ox, oy);
    pb.blit(s, ox + s._meta.off[0], oy + s._meta.off[1]);
  };

  /* Tekne damgası: alfa 255 → piksel yaz, alfa 1 → pikseli sil (yükseltme eski parçayı kaldırıyorsa), 0 → dokunma */
  function applyStamp(dst, s, ox, oy) {
    ox = ox | 0; oy = oy | 0; const d = dst.d, src = s.d;
    for (let y = 0; y < s.h; y++) { const Y = y + oy; if (Y < 0 || Y >= dst.h) continue;
      for (let x = 0; x < s.w; x++) { const X = x + ox; if (X < 0 || X >= dst.w) continue; const v = src[y * s.w + x], a = v >>> 24; if (a === 0) continue; d[Y * dst.w + X] = a === 1 ? 0 : v; } }
  }
  const BOAT_DIMS = ['motor', 'hull', 'nav', 'storage'];
  boatParts = function (id, cfg) {
    if (!AM.enabled) return orig.boatParts(id, cfg);
    const color = (BOAT_COLORS.find(c => c.id === cfg.color) || BOAT_COLORS[0]).id;
    const pre = 'boat_' + id + '_' + color;
    const base = AM.meta(pre + '_base_back'); if (!base) return orig.boatParts(id, cfg);
    const tuple = BOAT_DIMS.map(k => cfg[k]).join(',');
    if (base.exclude && base.exclude.includes(tuple)) return orig.boatParts(id, cfg);
    const back = stamp(pre + '_base_back'), front = stamp(pre + '_base_front'); if (!back || !front) return orig.boatParts(id, cfg);
    const B = new PB(back.w, back.h), F = new PB(front.w, front.h); B.d.set(back.d); F.d.set(front.d);
    for (const k of BOAT_DIMS) {
      if (cfg[k] === base.base[k]) continue;
      const lv = base.levels[k] || []; if (!lv.includes(cfg[k])) return orig.boatParts(id, cfg);   // bilinmeyen seviye → prosedürel
      for (const [L, P] of [['back', B], ['front', F]]) {           // boş damga (o katmanda değişiklik yok) dışa aktarılmaz
        const sid = pre + '_' + k + cfg[k] + '_' + L; if (!AM.has(sid)) continue;
        const s = stamp(sid); if (!s) return orig.boatParts(id, cfg); applyStamp(P, s, s._meta.off[0], s._meta.off[1]);
      }
    }
    const res = JSON.parse(JSON.stringify(base.res));
    /* --- aşağısı boatParts'ın kuyruğu ile birebir aynı (süs + isim levhası + dış hat) --- */
    if (cfg.ornament && typeof ornamentPB === 'function') { const ox = { coastal_skiff: 64, motorboat: 92, cabin: 112, offshore: 142 }[id]; F.rect(ox + 6, res.deck - 3, 1, 4, '#5a3a1e'); ornamentPB(F, cfg.ornament.slice(4), ox, res.deck - 14); }
    const name = (cfg.name || '').slice(0, 12);
    if (name) {
      const tw = textWidth(name) + 4; const px = { coastal_skiff: 52, motorboat: 80, cabin: 100, offshore: 128 }[id] - tw / 2, py = res.deck + 4;
      F.rect(px - 1, py - 1, tw + 2, 8, '#5a3a1e'); F.rect(px, py, tw, 6, '#f6eed8'); drawText(F, name, px + 2, py + 1, '#2a2226');
    }
    B.outline(null, 0.55); F.outline(null, 0.55);
    return Object.assign(res, { back: B, front: F, w: B.w, h: B.h });
  };
  return { orig, stampCache, BOAT_DIMS, applyStamp, hairId };
})();
