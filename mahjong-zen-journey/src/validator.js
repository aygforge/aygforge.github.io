/*
 * Mahjong: Zen Journey — SolvabilityValidator.
 * Verifies every embedded level: data present, even tile count, grid/support
 * rules, no overlaps, an opening match, the stored solution certificate,
 * geometric uniqueness and that the board fits a phone screen.
 */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MJCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MJValidator = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  // Reference phone viewport used for the "fits on mobile" check: the board
  // area left on a 360x640 CSS px screen after HUD and toolbar (see renderer).
  const MOBILE_REF = { boardW: 344, boardH: 452, minTileW: 30 };
  const DEPTH = 0.1; // layer offset as fraction of tile width (same as renderer)
  const TILE_ASPECT = 0.76;

  function fitTileWidth(tiles, areaW, areaH) {
    const b = Core.layoutBounds(tiles);
    const unitsW = b.spanX / 2 + (b.maxZ + 1) * DEPTH;
    const unitsH = (b.spanY / 2) / TILE_ASPECT + (b.maxZ + 1) * DEPTH;
    return Math.min(areaW / unitsW, areaH / unitsH);
  }

  const CHECKS = ['exists', 'even', 'geometry', 'overlap', 'firstMatch', 'clearable', 'certificate', 'unique', 'mobile', 'faces', 'curve'];

  function validateLevel(n, str) {
    const res = { n, ok: false, checks: {}, errors: [], hash: null, tiles: 0, layers: 0, family: null };
    const fail = (k, msg) => { res.checks[k] = false; res.errors.push(k + ': ' + msg); };
    let lv;
    try { lv = Core.decodeLevel(str); res.checks.exists = lv.tiles.length > 0; }
    catch (e) { fail('exists', e.message); return res; }
    const tiles = lv.tiles;
    res.tiles = tiles.length;
    res.family = Core.FAMILIES[lv.family] || null;
    if (!res.family) fail('exists', 'unknown family');
    res.checks.even = tiles.length > 0 && tiles.length % 2 === 0;
    if (!res.checks.even) fail('even', 'tile count ' + tiles.length);

    const b = Core.layoutBounds(tiles);
    res.layers = b.layers;
    let geoOk = true;
    for (const t of tiles) {
      if (t.x < 0 || t.y < 0 || t.x > Core.GRID.maxX || t.y > Core.GRID.maxY || t.z > Core.GRID.maxZ) { geoOk = false; break; }
    }
    const unsupported = Core.checkSupport(tiles);
    if (unsupported.length) geoOk = false;
    res.checks.geometry = geoOk;
    if (!geoOk) fail('geometry', unsupported.length ? unsupported.length + ' unsupported tiles' : 'out of grid');

    const geom = Core.buildGeometry(tiles);
    const seen = new Set();
    let dupPos = false;
    for (const t of tiles) { const k = t.x + ',' + t.y + ',' + t.z; if (seen.has(k)) dupPos = true; seen.add(k); }
    res.checks.overlap = geom.overlaps.length === 0 && !dupPos;
    if (!res.checks.overlap) fail('overlap', geom.overlaps.length + ' overlapping pairs');

    const faces = tiles.map(t => t.face);
    let facesOk = faces.every(f => Number.isInteger(f) && f >= 0 && f < Core.FACE_COUNT);
    const classCount = new Map(), faceCount = new Map();
    for (const f of faces) {
      classCount.set(Core.faceClass(f), (classCount.get(Core.faceClass(f)) || 0) + 1);
      faceCount.set(f, (faceCount.get(f) || 0) + 1);
    }
    for (const [c, k] of classCount) if (k % 2 || k > 4) facesOk = false;
    for (const [f, k] of faceCount) if (f >= 34 && k > 1) facesOk = false; // each flower/season tile is unique
    res.checks.faces = facesOk;
    if (!facesOk) fail('faces', 'invalid face distribution');

    const st0 = new Core.BoardState(geom, null);
    res.openPairs = Core.availablePairs(st0, faces).length;
    res.checks.firstMatch = res.openPairs > 0;
    if (!res.checks.firstMatch) fail('firstMatch', 'no opening match');

    // replay the certificate: pairs (0,1), (2,3), ... must each be free and matching
    const st = new Core.BoardState(geom, null);
    let certOk = true;
    for (let i = 0; i + 1 < tiles.length; i += 2) {
      if (!st.isFree(i) || !st.isFree(i + 1) || Core.faceClass(faces[i]) !== Core.faceClass(faces[i + 1])) { certOk = false; break; }
      st.remove(i); st.remove(i + 1);
    }
    res.checks.certificate = certOk && st.remaining === 0;
    res.checks.clearable = res.checks.certificate;
    if (!res.checks.certificate) fail('certificate', 'stored clearing order is invalid at ' + (tiles.length - st.remaining));

    res.tileWidthMobile = Math.floor(fitTileWidth(tiles, MOBILE_REF.boardW, MOBILE_REF.boardH));
    res.checks.mobile = b.spanX <= 2 * Core.GRID.maxCols && b.spanY <= 2 * Core.GRID.maxRows && res.tileWidthMobile >= MOBILE_REF.minTileW;
    if (!res.checks.mobile) fail('mobile', 'tile width on 360x640 would be ' + res.tileWidthMobile + 'px');

    const range = Core.tileRange(n);
    res.checks.curve = tiles.length >= range.lo && tiles.length <= range.hi;
    if (!res.checks.curve) fail('curve', tiles.length + ' tiles outside ' + range.lo + '-' + range.hi);

    const sig = Core.layoutSignature(tiles);
    res.hash = sig.hash;
    res.canonical = sig.canonical;
    res.checks.unique = true; // resolved in validateAll
    return res;
  }

  function summarize(results) {
    const byCanon = new Map();
    for (const r of results) {
      if (!r.canonical) continue;
      if (!byCanon.has(r.canonical)) byCanon.set(r.canonical, []);
      byCanon.get(r.canonical).push(r.n);
    }
    const duplicates = [];
    for (const list of byCanon.values()) {
      if (list.length > 1) {
        duplicates.push(list);
        for (const n of list) { const r = results[n - 1]; r.checks.unique = false; r.errors.push('unique: same geometry as levels ' + list.join(', ')); }
      }
    }
    const passCounts = {};
    for (const k of CHECKS) passCounts[k] = results.filter(r => r.checks[k] === true).length;
    for (const r of results) r.ok = CHECKS.every(k => r.checks[k] === true);
    const hashes = new Set(results.map(r => r.hash).filter(Boolean));
    return {
      total: results.length,
      passed: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).map(r => ({ n: r.n, errors: r.errors })),
      passCounts,
      uniqueGeometries: byCanon.size,
      uniqueHashes: hashes.size,
      duplicates,
      totalTiles: results.reduce((s, r) => s + r.tiles, 0),
      minMobileTileWidth: Math.min(...results.map(r => r.tileWidthMobile || 0))
    };
  }

  function validateAll(levelStrings) {
    const results = [];
    for (let n = 1; n <= Core.LEVEL_COUNT; n++) {
      const str = levelStrings[n - 1];
      if (typeof str !== 'string') { results.push({ n, ok: false, checks: { exists: false }, errors: ['exists: missing'], tiles: 0 }); continue; }
      results.push(validateLevel(n, str));
    }
    return { results, summary: summarize(results) };
  }

  // Chunked variant for the browser debug panel (keeps the UI responsive).
  function validateAllAsync(levelStrings, onProgress) {
    return new Promise((resolve) => {
      const results = [];
      let n = 1;
      const step = () => {
        const end = Math.min(Core.LEVEL_COUNT, n + 24);
        for (; n <= end; n++) {
          const str = levelStrings[n - 1];
          results.push(typeof str === 'string' ? validateLevel(n, str) : { n, ok: false, checks: { exists: false }, errors: ['exists: missing'], tiles: 0 });
        }
        if (onProgress) onProgress(n - 1);
        if (n <= Core.LEVEL_COUNT) setTimeout(step, 0);
        else resolve({ results, summary: summarize(results) });
      };
      step();
    });
  }

  return { CHECKS, MOBILE_REF, fitTileWidth, validateLevel, validateAll, validateAllAsync };
}));
