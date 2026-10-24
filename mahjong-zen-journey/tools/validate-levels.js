#!/usr/bin/env node
/*
 * Validates all 500 embedded levels.
 *  - every SolvabilityValidator check (certificate replay, geometry, uniqueness, ...)
 *  - an independent exact solve of each initial board (does not use the certificate)
 *  - near-duplicate scan (Jaccard similarity of aligned tile sets, all pairs)
 *  - random-play statistics (how forgiving each board is)
 * Can validate the level data inside a built index.html: node tools/validate-levels.js index.html
 * Writes tools/out/level-validation.json and prints a summary.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Core = require('../src/core.js');
const V = require('../src/validator.js');
const Gen = require('../src/layout-generator.js');

function loadLevels() {
  const arg = process.argv[2];
  if (arg && arg.endsWith('.html')) {
    const html = fs.readFileSync(arg, 'utf8');
    const m = html.match(/const MJ_LEVELS = (\[[^\]]*\]);/);
    if (!m) throw new Error('level data not found in ' + arg);
    return { levels: JSON.parse(m[1]), source: arg };
  }
  return { levels: require('../src/levels-data.js'), source: 'src/levels-data.js' };
}

function main() {
  const t0 = Date.now();
  const { levels, source } = loadLevels();
  console.log(`Validating ${levels.length} levels from ${source}`);
  const { results, summary } = V.validateAll(levels);

  // independent exact solve
  let exactSolved = 0, exactUnknown = 0, exactUnsolvable = 0;
  const rng = Core.mulberry32(12345);
  const randomRates = [];
  for (const r of results) {
    const lv = Core.decodeLevel(levels[r.n - 1]);
    const geom = Core.buildGeometry(lv.tiles);
    const faces = lv.tiles.map(t => t.face);
    const ex = Core.solveExact(geom, faces, null, { budget: 400000 });
    r.exact = ex.status;
    if (ex.status === 'solved') {
      // replay the found solution to make sure it is real
      const st = new Core.BoardState(geom, null);
      for (const [a, b] of ex.moves) {
        if (!st.isFree(a) || !st.isFree(b) || Core.faceClass(faces[a]) !== Core.faceClass(faces[b])) { r.exact = 'invalid'; break; }
        st.remove(a); st.remove(b);
      }
      if (st.remaining !== 0) r.exact = 'invalid';
    }
    if (r.exact === 'solved') exactSolved++; else if (r.exact === 'unknown') exactUnknown++; else exactUnsolvable++;
    let ok = 0;
    for (let k = 0; k < 30; k++) if (Core.randomPlayout(geom, faces, rng).cleared) ok++;
    r.randomSuccess = ok / 30;
    randomRates.push(r.randomSuccess);
  }

  // near-duplicate scan
  const sets = levels.map(s => Gen.alignedSet(Core.decodeLevel(s).tiles));
  let maxSim = 0, maxPair = null;
  for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
    const s = Gen.setSimilarity(sets[i], sets[j]);
    if (s > maxSim) { maxSim = s; maxPair = [i + 1, j + 1]; }
  }

  const perSegment = Core.TILE_CURVE.map(([a, b, lo, hi]) => {
    const rs = results.filter(r => r.n >= a && r.n <= b);
    return {
      levels: `${a}-${b}`, curve: `${lo}-${hi}`,
      tiles: `${Math.min(...rs.map(r => r.tiles))}-${Math.max(...rs.map(r => r.tiles))}`,
      avgLayers: +(rs.reduce((s, r) => s + r.layers, 0) / rs.length).toFixed(2),
      avgOpenPairs: +(rs.reduce((s, r) => s + r.openPairs, 0) / rs.length).toFixed(1),
      avgRandomClear: +(rs.reduce((s, r) => s + r.randomSuccess, 0) / rs.length).toFixed(2)
    };
  });

  const out = {
    validatedAt: new Date().toISOString(), source, seconds: (Date.now() - t0) / 1000,
    summary: { ...summary, exactSolved, exactUnknown, exactUnsolvable, maxPairSimilarity: +maxSim.toFixed(3), mostSimilarPair: maxPair },
    perSegment,
    levels: results.map(r => ({ n: r.n, ok: r.ok, family: r.family, tiles: r.tiles, layers: r.layers, hash: r.hash, openPairs: r.openPairs, tileWidthMobile: r.tileWidthMobile, exact: r.exact, randomSuccess: r.randomSuccess, errors: r.errors }))
  };
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'level-validation.json'), JSON.stringify(out, null, 1));

  const S = out.summary;
  console.log('Checks passed per criterion:');
  for (const k of V.CHECKS) console.log(`  ${k.padEnd(12)} ${S.passCounts[k]}/${S.total}`);
  console.log(`Levels fully valid:          ${S.passed}/${S.total}`);
  console.log(`Unique layout hashes:        ${S.uniqueHashes}  (unique canonical geometries: ${S.uniqueGeometries})`);
  console.log(`Independent exact solve:     solved ${exactSolved}, unknown ${exactUnknown}, unsolvable/invalid ${exactUnsolvable}`);
  console.log(`Max pairwise similarity:     ${S.maxPairSimilarity} (levels ${maxPair})`);
  console.log(`Min tile width on 360x640:   ${S.minMobileTileWidth}px`);
  console.log(`Total tiles:                 ${S.totalTiles}`);
  console.table(perSegment);
  if (S.failed.length) { console.log('FAILURES:'); for (const f of S.failed.slice(0, 30)) console.log('  ', f.n, f.errors.join('; ')); }
  console.log(`Done in ${out.seconds.toFixed(1)}s`);
  process.exit(S.passed === S.total && exactUnsolvable === 0 ? 0 : 1);
}

main();
