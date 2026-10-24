/*
 * Mahjong: Zen Journey — core engine.
 * Shared by the game (browser) and the dev tools (Node): tile set, geometry,
 * freeness rules, solvers, level codec, layout signatures and the DOM-free
 * GameSession that implements Mahjong Solitaire rules.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MJCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LEVEL_COUNT = 500;
  const WORLD_SIZE = 25;
  const WORLD_COUNT = 20;

  // ---------------------------------------------------------------- tile set
  // Face ids: 0-8 Circles 1-9, 9-17 Bamboo 1-9, 18-26 Characters 1-9,
  // 27-30 Winds (E S W N), 31-33 Dragons (Red Green White),
  // 34-37 Flowers (Plum Orchid Chrysanthemum Bamboo), 38-41 Seasons.
  const FACE_COUNT = 42;
  const CLASS_COUNT = 36;
  const CLASS_FLOWER = 34;
  const CLASS_SEASON = 35;
  const SUITS = [
    { key: 'dots', name: 'Circles', start: 0, count: 9 },
    { key: 'bamboo', name: 'Bamboo', start: 9, count: 9 },
    { key: 'chars', name: 'Characters', start: 18, count: 9 },
    { key: 'wind', name: 'Wind', start: 27, count: 4 },
    { key: 'dragon', name: 'Dragon', start: 31, count: 3 },
    { key: 'flower', name: 'Flower', start: 34, count: 4 },
    { key: 'season', name: 'Season', start: 38, count: 4 }
  ];
  const RANK_NAMES = {
    wind: ['East', 'South', 'West', 'North'],
    dragon: ['Red', 'Green', 'White'],
    flower: ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo'],
    season: ['Spring', 'Summer', 'Autumn', 'Winter']
  };

  function faceClass(f) { return f < 34 ? f : (f < 38 ? CLASS_FLOWER : CLASS_SEASON); }
  function faceInfo(f) {
    for (const s of SUITS) {
      if (f >= s.start && f < s.start + s.count) {
        const rank = f - s.start;
        const named = RANK_NAMES[s.key];
        const label = named ? named[rank] + ' ' + s.name : s.name + ' ' + (rank + 1);
        return { suit: s.key, rank, label };
      }
    }
    return { suit: 'none', rank: 0, label: '?' };
  }

  const FAMILIES = [
    'Classic Turtle', 'Pyramid', 'Butterfly', 'Pagoda', 'Twin Towers',
    'Spiral', 'Diamond', 'Bridge', 'Lotus', 'Temple',
    'Mountain', 'Crescent', 'Cross', 'Hourglass', 'Dragon',
    'Fortress', 'Wave', 'Four Islands', 'Star', 'Grand Palace'
  ];

  const WORLD_NAMES = [
    'Bamboo Garden', 'Cherry Blossom', 'Autumn Temple', 'Misty Lake', 'Moonlight Garden',
    'Ancient Ruins', 'Lantern Village', 'Cloud Mountains', 'Jade Sanctuary', 'Golden Sands',
    'Lotus Paradise', 'Winter Palace', 'Festival of Lights', 'Starlight Harbor', 'Hidden Valley',
    'Sunken Temple', 'Crimson Canyon', 'Midnight Forest', 'Celestial Garden', "Dragon's Crown"
  ];

  // Difficulty curve from the design brief: [firstLevel, lastLevel, minTiles, maxTiles]
  const TILE_CURVE = [
    [1, 25, 24, 40], [26, 75, 40, 56], [76, 150, 48, 72], [151, 250, 56, 80],
    [251, 350, 64, 88], [351, 450, 72, 96], [451, 500, 80, 96]
  ];
  function tileRange(n) {
    for (const seg of TILE_CURVE) if (n >= seg[0] && n <= seg[1]) return { lo: seg[2], hi: seg[3], seg };
    return { lo: 24, hi: 96, seg: null };
  }

  function levelMeta(n) {
    const world = Math.floor((n - 1) / WORLD_SIZE); // 0-based
    const index = (n - 1) % WORLD_SIZE; // 0-based within world
    return {
      n, world, index,
      worldName: WORLD_NAMES[world],
      isFinal: index === WORLD_SIZE - 1,
      isWorldStart: index === 0,
      isTutorial: n <= 5
    };
  }

  // Board limits (half-tile units). 9 columns x 10 rows keeps tiles large
  // enough on a portrait phone; layouts never exceed it.
  const GRID = { maxCols: 9, maxRows: 10, maxX: 16, maxY: 18, maxZ: 7 };

  // ---------------------------------------------------------------- random
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  function levelSeed(n) { return fnv1a('mahjong-zen-journey/level/' + n); }
  function shuffleInPlace(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------------------------------------------------------------- geometry
  // A tile at (x, y, z) covers the half-unit cells [x, x+2) x [y, y+2) on layer z.
  function buildGeometry(tiles) {
    const n = tiles.length;
    const above = [], below = [], left = [], right = [], overlaps = [];
    for (let i = 0; i < n; i++) { above.push([]); below.push([]); left.push([]); right.push([]); }
    for (let i = 0; i < n; i++) {
      const a = tiles[i];
      for (let j = i + 1; j < n; j++) {
        const b = tiles[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dy <= -2 || dy >= 2) continue;
        if (a.z === b.z) {
          if (dx === 2) { right[i].push(j); left[j].push(i); }
          else if (dx === -2) { left[i].push(j); right[j].push(i); }
          else if (dx > -2 && dx < 2) overlaps.push([i, j]);
        } else if (dx > -2 && dx < 2) {
          if (b.z > a.z) { above[i].push(j); below[j].push(i); }
          else { above[j].push(i); below[i].push(j); }
        }
      }
    }
    return { n, tiles, above, below, left, right, overlaps, _belowAll: null };
  }

  // Transitive "is somewhere underneath" sets, used to prune impossible pairs.
  function belowAll(geom) {
    if (geom._belowAll) return geom._belowAll;
    const order = geom.tiles.map((t, i) => i).sort((a, b) => geom.tiles[a].z - geom.tiles[b].z);
    const sets = new Array(geom.n);
    for (const i of order) {
      const s = new Set();
      for (const b of geom.below[i]) { s.add(b); for (const bb of sets[b]) s.add(bb); }
      sets[i] = s;
    }
    geom._belowAll = sets;
    return sets;
  }

  // Unit-cell support: every one of the 4 cells under a raised tile must be occupied.
  function checkSupport(tiles) {
    const cells = new Set();
    for (const t of tiles) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) cells.add((t.z * 64 + t.y + dy) * 64 + t.x + dx);
    const bad = [];
    tiles.forEach((t, i) => {
      if (t.z === 0) return;
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) {
        if (!cells.has(((t.z - 1) * 64 + t.y + dy) * 64 + t.x + dx)) { bad.push(i); return; }
      }
    });
    return bad;
  }

  function layoutBounds(tiles) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = 0;
    for (const t of tiles) {
      if (t.x < minX) minX = t.x; if (t.y < minY) minY = t.y;
      if (t.x > maxX) maxX = t.x; if (t.y > maxY) maxY = t.y;
      if (t.z > maxZ) maxZ = t.z;
    }
    return { minX, minY, maxX, maxY, maxZ, spanX: maxX - minX + 2, spanY: maxY - minY + 2, layers: maxZ + 1 };
  }

  // ---------------------------------------------------------------- board state
  class BoardState {
    constructor(geom, present) {
      const n = geom.n;
      this.g = geom;
      this.present = new Uint8Array(n);
      this.cover = new Int16Array(n);
      this.lc = new Int16Array(n);
      this.rc = new Int16Array(n);
      this.remaining = 0;
      for (let i = 0; i < n; i++) this.present[i] = present ? (present[i] ? 1 : 0) : 1;
      for (let i = 0; i < n; i++) {
        if (this.present[i]) this.remaining++;
        let c = 0; for (const a of geom.above[i]) c += this.present[a]; this.cover[i] = c;
        c = 0; for (const l of geom.left[i]) c += this.present[l]; this.lc[i] = c;
        c = 0; for (const r of geom.right[i]) c += this.present[r]; this.rc[i] = c;
      }
    }
    isFree(i) {
      return this.present[i] === 1 && this.cover[i] === 0 && (this.lc[i] === 0 || this.rc[i] === 0);
    }
    remove(i) {
      const g = this.g;
      this.present[i] = 0; this.remaining--;
      for (const b of g.below[i]) this.cover[b]--;
      for (const r of g.right[i]) this.lc[r]--;
      for (const l of g.left[i]) this.rc[l]--;
    }
    restore(i) {
      const g = this.g;
      this.present[i] = 1; this.remaining++;
      for (const b of g.below[i]) this.cover[b]++;
      for (const r of g.right[i]) this.lc[r]++;
      for (const l of g.left[i]) this.rc[l]++;
    }
    freeList() {
      const out = [];
      for (let i = 0; i < this.g.n; i++) if (this.isFree(i)) out.push(i);
      return out;
    }
    key() {
      const p = this.present;
      let s = '';
      for (let i = 0; i < p.length; i += 15) {
        let v = 0;
        for (let j = 0; j < 15 && i + j < p.length; j++) if (p[i + j]) v |= 1 << j;
        s += String.fromCharCode(v + 32);
      }
      return s;
    }
  }

  function availablePairs(st, faces) {
    const groups = new Map();
    for (let i = 0; i < st.g.n; i++) {
      if (!st.isFree(i)) continue;
      const c = faceClass(faces[i]);
      let g = groups.get(c);
      if (!g) { g = []; groups.set(c, g); }
      g.push(i);
    }
    const pairs = [];
    for (const g of groups.values()) {
      for (let a = 0; a < g.length; a++) for (let b = a + 1; b < g.length; b++) pairs.push([g[a], g[b]]);
    }
    return pairs;
  }

  // ---------------------------------------------------------------- exact solver
  // Depth-first search over real matching moves with memoised dead states.
  // Safe-move reduction: if every remaining tile of a class is free, removing
  // them first never hurts (removals only free other tiles), so no branching.
  function solveExact(geom, faces, present, opts) {
    const budget = (opts && opts.budget) || 60000;
    const st = new BoardState(geom, present);
    const n = geom.n;
    const cls = new Int16Array(n);
    for (let i = 0; i < n; i++) cls[i] = faceClass(faces[i]);
    const below = belowAll(geom);
    const failed = new Set();
    const path = [];
    let nodes = 0, aborted = false;

    function deadByStacking() {
      // A class with exactly two tiles left, one buried under the other, can never be cleared.
      const first = new Int16Array(CLASS_COUNT).fill(-1), count = new Int16Array(CLASS_COUNT), second = new Int16Array(CLASS_COUNT).fill(-1);
      for (let i = 0; i < n; i++) {
        if (!st.present[i]) continue;
        const c = cls[i];
        if (count[c] === 0) first[c] = i; else if (count[c] === 1) second[c] = i;
        count[c]++;
      }
      for (let c = 0; c < CLASS_COUNT; c++) {
        if (count[c] === 2) {
          const a = first[c], b = second[c];
          if (below[a].has(b) || below[b].has(a)) return true;
        }
      }
      return false;
    }

    function dfs() {
      if (st.remaining === 0) return true;
      if (++nodes > budget) { aborted = true; return false; }
      const key = st.key();
      if (failed.has(key)) return false;
      if (deadByStacking()) { failed.add(key); return false; }

      const groups = new Map();
      const remCount = new Int16Array(CLASS_COUNT);
      for (let i = 0; i < n; i++) {
        if (!st.present[i]) continue;
        remCount[cls[i]]++;
        if (st.isFree(i)) {
          let g = groups.get(cls[i]);
          if (!g) { g = []; groups.set(cls[i], g); }
          g.push(i);
        }
      }
      // safe moves
      const safe = [];
      for (const [c, g] of groups) {
        if (g.length >= 2 && g.length === remCount[c]) {
          for (let k = 0; k + 1 < g.length; k += 2) safe.push([g[k], g[k + 1]]);
        }
      }
      if (safe.length) {
        for (const [a, b] of safe) { st.remove(a); st.remove(b); path.push([a, b]); }
        if (dfs()) return true;
        for (let k = safe.length - 1; k >= 0; k--) { const [a, b] = safe[k]; st.restore(a); st.restore(b); path.pop(); }
        if (!aborted) failed.add(key);
        return false;
      }
      const cands = [];
      for (const g of groups.values()) {
        for (let a = 0; a < g.length; a++) for (let b = a + 1; b < g.length; b++) {
          const ta = g[a], tb = g[b];
          const score = geom.below[ta].length + geom.below[tb].length + geom.tiles[ta].z + geom.tiles[tb].z +
            (st.lc[ta] + st.rc[ta] > 0 ? 0.5 : 0) + (st.lc[tb] + st.rc[tb] > 0 ? 0.5 : 0);
          cands.push([ta, tb, score]);
        }
      }
      if (!cands.length) { failed.add(key); return false; }
      cands.sort((p, q) => q[2] - p[2]);
      for (const [a, b] of cands) {
        st.remove(a); st.remove(b); path.push([a, b]);
        if (dfs()) return true;
        path.pop(); st.restore(a); st.restore(b);
        if (aborted) return false;
      }
      failed.add(key);
      return false;
    }

    const ok = dfs();
    return { status: ok ? 'solved' : (aborted ? 'unknown' : 'unsolvable'), moves: ok ? path.slice() : null, nodes };
  }

  // ---------------------------------------------------------------- geometric solver
  // Finds an order that removes every present tile two free tiles at a time,
  // ignoring faces. Used to build solvable boards and solvable shuffles.
  function findRemovalOrder(geom, present, rng, opts) {
    const restarts = (opts && opts.restarts) || 40;
    const budget = (opts && opts.budget) || 5000;
    rng = rng || Math.random;
    const n = geom.n;
    const weight = new Float64Array(n);
    for (let i = 0; i < n; i++) weight[i] = geom.tiles[i].z * 3 + geom.below[i].length * 1.5;
    for (let attempt = 0; attempt < restarts; attempt++) {
      const st = new BoardState(geom, present);
      if (st.remaining % 2) return null;
      const failed = new Set();
      const path = [];
      const noise = 0.8 + attempt * 0.35;
      let nodes = 0, aborted = false;
      const dfs = () => {
        if (st.remaining === 0) return true;
        if (++nodes > budget) { aborted = true; return false; }
        const free = st.freeList();
        if (free.length < 2) return false;
        const key = st.key();
        if (failed.has(key)) return false;
        const scored = free.map(i => [i, weight[i] + rng() * noise]);
        scored.sort((p, q) => q[1] - p[1]);
        const m = Math.min(scored.length, 5);
        const cand = [];
        for (let a = 0; a < m; a++) for (let b = a + 1; b < m; b++) cand.push([scored[a][0], scored[b][0]]);
        const tries = Math.min(cand.length, 6);
        for (let k = 0; k < tries; k++) {
          const [a, b] = cand[k];
          st.remove(a); st.remove(b); path.push([a, b]);
          if (dfs()) return true;
          path.pop(); st.restore(a); st.restore(b);
          if (aborted) return false;
        }
        failed.add(key);
        return false;
      };
      if (dfs()) return path;
    }
    return null;
  }

  // Random play (uniform over available matches) — used to measure difficulty.
  function randomPlayout(geom, faces, rng) {
    const st = new BoardState(geom, null);
    while (st.remaining > 0) {
      const pairs = availablePairs(st, faces);
      if (!pairs.length) return { cleared: false, removed: geom.n - st.remaining };
      const [a, b] = pairs[Math.floor(rng() * pairs.length)];
      st.remove(a); st.remove(b);
    }
    return { cleared: true, removed: geom.n };
  }

  // ---------------------------------------------------------------- level codec
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const B64I = {};
  for (let i = 0; i < 64; i++) B64I[B64[i]] = i;
  const GX = 20, GY = 24, GZ = 8;

  // Tiles are stored in solution order: tiles (0,1), (2,3), ... form a
  // verified removal sequence (the solvability certificate).
  function encodeLevel(level) {
    let s = B64[level.family];
    for (const t of level.tiles) {
      const v = ((t.face * GZ + t.z) * GY + t.y) * GX + t.x;
      s += B64[(v >> 12) & 63] + B64[(v >> 6) & 63] + B64[v & 63];
    }
    return s;
  }
  function decodeLevel(str) {
    if (typeof str !== 'string' || str.length < 4 || (str.length - 1) % 3 !== 0) throw new Error('bad level string');
    const family = B64I[str[0]];
    const tiles = [];
    for (let i = 1; i < str.length; i += 3) {
      const a = B64I[str[i]], b = B64I[str[i + 1]], c = B64I[str[i + 2]];
      if (a === undefined || b === undefined || c === undefined) throw new Error('bad level char');
      let v = (a << 12) | (b << 6) | c;
      const x = v % GX; v = Math.floor(v / GX);
      const y = v % GY; v = Math.floor(v / GY);
      const z = v % GZ; v = Math.floor(v / GZ);
      tiles.push({ x, y, z, face: v });
    }
    return { family, tiles };
  }
  function encodeFaces(faces) { let s = ''; for (const f of faces) s += B64[f]; return s; }
  function decodeFaces(str, n) {
    if (typeof str !== 'string' || str.length !== n) return null;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const v = B64I[str[i]];
      if (v === undefined || v >= FACE_COUNT) return null;
      out[i] = v;
    }
    return out;
  }

  // Canonical geometry signature: translation-normalised, mirror-invariant.
  function layoutSignature(tiles) {
    const b = layoutBounds(tiles);
    const w = b.maxX - b.minX;
    const a = tiles.map(t => [t.x - b.minX, t.y - b.minY, t.z]);
    const m = a.map(([x, y, z]) => [w - x, y, z]);
    const str = arr => arr.map(p => p.join('.')).sort().join(';');
    const s1 = str(a), s2 = str(m);
    const canonical = s1 < s2 ? s1 : s2;
    return { canonical, hash: fnv1a(canonical).toString(16).padStart(8, '0') + '-' + tiles.length.toString(16) };
  }

  // ---------------------------------------------------------------- stars
  function starsFor(hints, shuffles) {
    const help = hints + 2 * shuffles;
    if (help === 0) return 3;
    if (help <= 2) return 2;
    return 1;
  }

  // ---------------------------------------------------------------- session
  class GameSession {
    constructor(levelNo, level) {
      this.levelNo = levelNo;
      this.level = level;
      this.tiles = level.tiles;
      this.n = level.tiles.length;
      this.geom = buildGeometry(level.tiles);
      this.initialFaces = level.tiles.map(t => t.face);
      this.reset();
    }
    reset() {
      this.faces = this.initialFaces.slice();
      this.st = new BoardState(this.geom, null);
      this.history = [];
      this.selected = -1;
      this.moves = 0; this.hints = 0; this.shuffles = 0; this.undos = 0;
      this.elapsed = 0;
      this.won = false;
      this.version = (this.version || 0) + 1;
    }
    get remaining() { return this.st.remaining; }
    isPresent(i) { return this.st.present[i] === 1; }
    isFree(i) { return this.st.isFree(i); }
    matches(a, b) { return a !== b && faceClass(this.faces[a]) === faceClass(this.faces[b]); }
    availablePairs() { return availablePairs(this.st, this.faces); }

    tap(i) {
      if (this.won || !(i >= 0 && i < this.n) || !this.isPresent(i)) return { type: 'none' };
      if (!this.isFree(i)) return { type: 'blocked', tile: i };
      const s = this.selected;
      if (s === -1) { this.selected = i; return { type: 'select', tile: i }; }
      if (s === i) { this.selected = -1; return { type: 'deselect', tile: i }; }
      if (!this.isFree(s) || !this.isPresent(s)) { this.selected = i; return { type: 'select', tile: i }; }
      if (this.matches(s, i)) return this._match(s, i);
      this.selected = i;
      return { type: 'mismatch', prev: s, tile: i };
    }

    _match(a, b) {
      const g = this.geom;
      const near = new Set();
      for (const t of [a, b]) {
        for (const j of g.below[t]) near.add(j);
        for (const j of g.left[t]) near.add(j);
        for (const j of g.right[t]) near.add(j);
      }
      near.delete(a); near.delete(b);
      const wasFree = new Map();
      for (const j of near) wasFree.set(j, this.isFree(j));
      this.st.remove(a); this.st.remove(b);
      this.history.push({ t: 'm', a, b });
      this.moves++;
      this.selected = -1;
      this.version++;
      const revealed = [];
      for (const j of near) if (!wasFree.get(j) && this.isFree(j)) revealed.push(j);
      const won = this.st.remaining === 0;
      if (won) this.won = true;
      const noMoves = !won && this.availablePairs().length === 0;
      return { type: 'match', a, b, revealed, won, noMoves };
    }

    undo() {
      if (this.won || !this.history.length) return null;
      const e = this.history.pop();
      this._revert(e);
      this.undos++;
      return e;
    }
    _revert(e) {
      if (e.t === 'm') { this.st.restore(e.a); this.st.restore(e.b); }
      else this.faces = e.prev.slice();
      this.selected = -1;
      this.version++;
    }

    // Re-deal the remaining tiles so that the remaining geometry has a
    // concrete clearing order. Returns {ok:false} if the geometry itself
    // cannot be cleared (e.g. two tiles stacked directly on each other).
    shuffle(rng) {
      rng = rng || Math.random;
      if (this.won || this.st.remaining === 0) return { ok: false, reason: 'empty' };
      const order = findRemovalOrder(this.geom, this.st.present, rng, { restarts: 30, budget: 4000 });
      if (!order) return { ok: false, reason: 'geometry' };
      const prev = this.faces.slice();
      let best = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const byClass = new Map();
        for (let i = 0; i < this.n; i++) {
          if (!this.st.present[i]) continue;
          const c = faceClass(this.faces[i]);
          if (!byClass.has(c)) byClass.set(c, []);
          byClass.get(c).push(this.faces[i]);
        }
        const facePairs = [];
        for (const list of byClass.values()) {
          shuffleInPlace(list, rng);
          for (let k = 0; k + 1 < list.length; k += 2) facePairs.push([list[k], list[k + 1]]);
        }
        shuffleInPlace(facePairs, rng);
        const next = this.faces.slice();
        order.forEach(([a, b], k) => {
          let [f1, f2] = facePairs[k];
          if (rng() < 0.5) { const t = f1; f1 = f2; f2 = t; }
          next[a] = f1; next[b] = f2;
        });
        let changed = 0;
        for (let i = 0; i < this.n; i++) if (next[i] !== prev[i]) changed++;
        if (!best || changed > best.changed) best = { next, changed };
        if (changed >= Math.min(4, this.st.remaining)) break;
      }
      this.faces = best.next;
      this.history.push({ t: 's', prev });
      this.shuffles++;
      this.selected = -1;
      this.version++;
      const changedTiles = [];
      for (let i = 0; i < this.n; i++) if (this.st.present[i] && this.faces[i] !== prev[i]) changedTiles.push(i);
      return { ok: true, changed: changedTiles, order };
    }

    solvability(budget) {
      if (this.st.remaining === 0) return 'solved';
      return solveExact(this.geom, this.faces, this.st.present, { budget: budget || 40000 }).status;
    }

    // Suggest a match. Prefers the first move of a full solution so hints
    // never lead the player into a dead end when a solution is known.
    findHint(budget) {
      const pairs = this.availablePairs();
      if (!pairs.length) return null;
      const res = solveExact(this.geom, this.faces, this.st.present, { budget: budget || 30000 });
      if (res.status === 'solved' && res.moves && res.moves.length) return { pair: res.moves[0], solvable: true };
      let best = pairs[0], bestScore = -1;
      for (const [a, b] of pairs) {
        const sc = this.geom.below[a].length + this.geom.below[b].length + this.tiles[a].z + this.tiles[b].z;
        if (sc > bestScore) { bestScore = sc; best = [a, b]; }
      }
      return { pair: best, solvable: res.status === 'unsolvable' ? false : null };
    }
    useHint(budget) {
      if (this.won) return null;
      const h = this.findHint(budget);
      if (h) this.hints++;
      return h;
    }

    // Undo until the remaining board is provably clearable.
    rewindToSolvable(budget) {
      const undone = [];
      while (this.history.length && this.solvability(budget) !== 'solved') {
        const e = this.history.pop();
        this._revert(e);
        this.undos++;
        undone.push(e);
      }
      return undone;
    }

    stars() { return starsFor(this.hints, this.shuffles); }

    serialize() {
      return {
        v: 1, lv: this.levelNo,
        f: encodeFaces(this.faces),
        h: this.history.map(e => (e.t === 'm' ? [e.a, e.b] : encodeFaces(e.prev))),
        mv: this.moves, hi: this.hints, sh: this.shuffles, un: this.undos,
        el: Math.round(this.elapsed)
      };
    }

    // Rebuilds and fully re-validates a saved session (replaying every move).
    static restore(levelNo, level, data) {
      if (!data || data.v !== 1 || data.lv !== levelNo || !Array.isArray(data.h)) return null;
      const s = new GameSession(levelNo, level);
      const n = s.n;
      const finalFaces = decodeFaces(data.f, n);
      if (!finalFaces) return null;
      const hist = [];
      for (const e of data.h) {
        if (Array.isArray(e) && e.length === 2 && Number.isInteger(e[0]) && Number.isInteger(e[1])) hist.push({ t: 'm', a: e[0], b: e[1] });
        else if (typeof e === 'string') { const p = decodeFaces(e, n); if (!p) return null; hist.push({ t: 's', prev: p }); }
        else return null;
      }
      let faces = s.initialFaces.slice();
      const st = new BoardState(s.geom, null);
      for (let k = 0; k < hist.length; k++) {
        const e = hist[k];
        if (e.t === 'm') {
          const { a, b } = e;
          if (a === b || a < 0 || b < 0 || a >= n || b >= n) return null;
          if (!st.isFree(a) || !st.isFree(b) || faceClass(faces[a]) !== faceClass(faces[b])) return null;
          st.remove(a); st.remove(b);
        } else {
          if (e.prev.some((f, i) => f !== faces[i])) return null;
          let nextFaces = finalFaces;
          for (let j = k + 1; j < hist.length; j++) if (hist[j].t === 's') { nextFaces = hist[j].prev; break; }
          // a shuffle only permutes faces among present tiles within the multiset
          const cnt = new Map();
          for (let i = 0; i < n; i++) {
            if (!st.present[i]) { if (nextFaces[i] !== faces[i]) return null; continue; }
            cnt.set(faceClass(faces[i]), (cnt.get(faceClass(faces[i])) || 0) + 1);
            cnt.set(faceClass(nextFaces[i]), (cnt.get(faceClass(nextFaces[i])) || 0) - 1);
          }
          for (const v of cnt.values()) if (v !== 0) return null;
          faces = nextFaces.slice();
        }
      }
      if (finalFaces.some((f, i) => f !== faces[i])) return null;
      if (st.remaining === 0) return null;
      s.faces = faces;
      s.st = st;
      s.history = hist;
      const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
      s.moves = num(data.mv); s.hints = num(data.hi); s.shuffles = num(data.sh); s.undos = num(data.un);
      s.elapsed = num(data.el);
      s.version++;
      return s;
    }
  }

  return {
    LEVEL_COUNT, WORLD_SIZE, WORLD_COUNT, FACE_COUNT, CLASS_COUNT, CLASS_FLOWER, CLASS_SEASON,
    SUITS, FAMILIES, WORLD_NAMES, TILE_CURVE, GRID, B64,
    faceClass, faceInfo, tileRange, levelMeta,
    mulberry32, fnv1a, levelSeed, shuffleInPlace,
    buildGeometry, belowAll, checkSupport, layoutBounds,
    BoardState, availablePairs, solveExact, findRemovalOrder, randomPlayout,
    encodeLevel, decodeLevel, encodeFaces, decodeFaces, layoutSignature,
    starsFor, GameSession
  };
}));
