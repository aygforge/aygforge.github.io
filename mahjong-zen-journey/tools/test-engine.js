#!/usr/bin/env node
/*
 * Engine + progression tests (DOM-free). Covers the game-system checklist:
 * selection, mismatches, blocked tiles, layered removal, last pair, no-moves,
 * undo / multi-undo, shuffle, restart, completion, unlocking, world change,
 * level 500, save/restore, export/import validation and dead-end handling.
 * Usage: node tools/test-engine.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Core = require('../src/core.js');
const P = require('../src/progress.js');
const LEVELS = require('../src/levels-data.js');

const results = [];
let current = '';
function test(name, fn) {
  current = name;
  const t0 = Date.now();
  try { fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); }
  catch (e) { results.push({ name, ok: false, error: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed in ' + current); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'expected equal') + `: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); }
const level = (n) => Core.decodeLevel(LEVELS[n - 1]);
const custom = (tiles) => ({ family: 0, tiles });

// ---------------------------------------------------------------- rules
test('free-tile rules: covered, side-blocked and partially covered tiles', () => {
  // row of three on layer 0, one tile on layer 1 half-covering the middle and right tile
  const L = custom([
    { x: 0, y: 0, z: 0, face: 0 }, { x: 2, y: 0, z: 0, face: 1 }, { x: 4, y: 0, z: 0, face: 2 },
    { x: 3, y: 0, z: 1, face: 0 }
  ]);
  const s = new Core.GameSession(1, L);
  assert(s.isFree(0), 'left end is free');
  assert(!s.isFree(1), 'middle tile is blocked on both sides (and covered)');
  assert(!s.isFree(2), 'right end is partially covered by the raised tile');
  assert(s.isFree(3), 'raised tile is free');
  // half-offset row neighbour still blocks (|dy| < 2)
  const g = Core.buildGeometry([{ x: 0, y: 0, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 4, y: 0, z: 0 }]);
  const st = new Core.BoardState(g, null);
  assert(!st.isFree(1), 'half-offset neighbours block sideways');
  // a half-tile gap does not block
  const g2 = Core.buildGeometry([{ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }, { x: 6, y: 0, z: 0 }]);
  assert(new Core.BoardState(g2, null).isFree(1), 'a gap means the side is open');
});

test('selecting the same tile twice deselects it', () => {
  const s = new Core.GameSession(1, level(1));
  const free = s.st.freeList()[0];
  eq(s.tap(free).type, 'select');
  eq(s.selected, free);
  eq(s.tap(free).type, 'deselect');
  eq(s.selected, -1);
});

test('wrong match shakes and moves the selection', () => {
  const s = new Core.GameSession(1, level(30));
  const free = s.st.freeList();
  let a = -1, b = -1;
  for (const i of free) for (const j of free) if (i !== j && !s.matches(i, j) && a < 0) { a = i; b = j; }
  assert(a >= 0, 'found two free non-matching tiles');
  s.tap(a);
  const r = s.tap(b);
  eq(r.type, 'mismatch'); eq(r.prev, a); eq(s.selected, b);
  eq(s.remaining, s.n, 'nothing removed');
});

test('blocked tiles cannot be selected', () => {
  const s = new Core.GameSession(1, level(40));
  const blocked = s.tiles.findIndex((_, i) => !s.isFree(i));
  assert(blocked >= 0);
  eq(s.tap(blocked).type, 'blocked');
  eq(s.selected, -1);
  const f = s.st.freeList()[0];
  s.tap(f);
  eq(s.tap(blocked).type, 'blocked');
  eq(s.selected, f, 'selection survives a blocked tap');
});

test('removing an upper-layer pair reveals the tiles beneath', () => {
  const L = custom([
    { x: 0, y: 0, z: 0, face: 5 }, { x: 0, y: 0, z: 1, face: 7 },
    { x: 6, y: 0, z: 0, face: 5 }, { x: 6, y: 0, z: 1, face: 7 }
  ]);
  const s = new Core.GameSession(1, L);
  assert(!s.isFree(0) && !s.isFree(2));
  s.tap(1);
  const r = s.tap(3);
  eq(r.type, 'match');
  assert(r.revealed.includes(0) && r.revealed.includes(2), 'both lower tiles revealed');
  assert(s.isFree(0) && s.isFree(2));
});

test('matching the last two tiles wins and locks the board', () => {
  const L = custom([{ x: 0, y: 0, z: 0, face: 3 }, { x: 4, y: 0, z: 0, face: 3 }]);
  const s = new Core.GameSession(1, L);
  s.tap(0);
  const r = s.tap(1);
  assert(r.won && s.won, 'won');
  eq(s.tap(0).type, 'none');
  eq(s.undo(), null, 'no undo after winning');
});

test('flowers match any flower, seasons any season, never each other', () => {
  const L = custom([{ x: 0, y: 0, z: 0, face: 34 }, { x: 4, y: 0, z: 0, face: 37 }, { x: 8, y: 0, z: 0, face: 38 }, { x: 12, y: 0, z: 0, face: 41 }]);
  const s = new Core.GameSession(1, L);
  assert(s.matches(0, 1), 'plum + bamboo flower');
  assert(s.matches(2, 3), 'spring + winter');
  assert(!s.matches(1, 2), 'flower vs season');
});

test('no-moves state is detected', () => {
  // two stacks whose tops do not match each other, plus one open pair
  const L = custom([
    { x: 0, y: 0, z: 0, face: 0 }, { x: 0, y: 0, z: 1, face: 1 },
    { x: 4, y: 0, z: 0, face: 1 }, { x: 4, y: 0, z: 1, face: 0 },
    { x: 8, y: 0, z: 0, face: 2 }, { x: 12, y: 0, z: 0, face: 2 }
  ]);
  const s = new Core.GameSession(1, L);
  s.tap(4);
  const r = s.tap(5);
  eq(r.type, 'match');
  assert(r.noMoves, 'reports no moves');
  eq(s.availablePairs().length, 0);
  eq(s.solvability(), 'unsolvable');
  // shuffle fixes it with a solvable deal
  const sh = s.shuffle(Core.mulberry32(1));
  assert(sh.ok, 'shuffle succeeds');
  eq(s.solvability(), 'solved');
  assert(s.availablePairs().length > 0);
});

test('shuffle refuses geometry that no deal can clear, rewind recovers', () => {
  const L = custom([
    { x: 0, y: 0, z: 0, face: 4 }, { x: 0, y: 0, z: 1, face: 4 },
    { x: 6, y: 0, z: 0, face: 4 }, { x: 10, y: 0, z: 0, face: 4 }
  ]);
  const s = new Core.GameSession(1, L);
  eq(s.solvability(), 'solved', 'start is solvable (top+side, then bottom+side)');
  s.tap(2); s.tap(3); // legal, but leaves a tile buried under its only partner
  eq(s.remaining, 2);
  const sh = s.shuffle(Core.mulberry32(2));
  assert(!sh.ok && sh.reason === 'geometry', 'stack of two cannot be shuffled into a solution');
  eq(s.solvability(), 'unsolvable');
  const undone = s.rewindToSolvable();
  eq(undone.length, 1);
  eq(s.remaining, 4);
  eq(s.solvability(), 'solved');
});

test('undo and multiple undo restore tiles, counters and freeness', () => {
  const lv = level(120);
  const s = new Core.GameSession(120, lv);
  const free0 = s.st.freeList().join(',');
  for (let k = 0; k < 6; k++) { s.tap(2 * k); s.tap(2 * k + 1); }
  eq(s.remaining, s.n - 12);
  eq(s.moves, 6);
  for (let k = 0; k < 6; k++) assert(s.undo(), 'undo ' + k);
  eq(s.remaining, s.n);
  eq(s.undos, 6);
  eq(s.st.freeList().join(','), free0, 'freeness recomputed exactly');
  eq(s.undo(), null, 'nothing more to undo');
  // undo after a shuffle restores the faces
  s.tap(0); s.tap(1);
  const before = s.faces.slice();
  assert(s.shuffle(Core.mulberry32(5)).ok);
  assert(s.faces.some((f, i) => f !== before[i]), 'shuffle changed faces');
  s.undo();
  eq(s.faces.join(','), before.join(','), 'faces restored');
  s.undo();
  eq(s.remaining, s.n);
});

test('shuffle keeps the tile multiset and always yields a solvable board', () => {
  let checked = 0;
  for (const n of [26, 77, 150, 233, 341, 410, 499]) {
    const s = new Core.GameSession(n, level(n));
    for (let k = 0; k < 5; k++) { s.tap(2 * k); s.tap(2 * k + 1); }
    const count = (faces) => { const m = {}; faces.forEach((f, i) => { if (s.isPresent(i)) m[Core.faceClass(f)] = (m[Core.faceClass(f)] || 0) + 1; }); return JSON.stringify(Object.entries(m).sort()); };
    const before = count(s.faces);
    for (let r = 0; r < 4; r++) {
      const res = s.shuffle(Core.mulberry32(n * 10 + r));
      assert(res.ok, 'shuffle ok on level ' + n);
      eq(count(s.faces), before, 'multiset preserved');
      // the order returned by shuffle is a certificate for the new deal
      const st = new Core.BoardState(s.geom, s.st.present);
      for (const [a, b] of res.order) {
        assert(st.isFree(a) && st.isFree(b) && Core.faceClass(s.faces[a]) === Core.faceClass(s.faces[b]), 'certificate step valid');
        st.remove(a); st.remove(b);
      }
      eq(st.remaining, 0);
      checked++;
    }
  }
  assert(checked === 28);
});

test('restart restores the same deterministic starting board', () => {
  const lv = level(77);
  const s = new Core.GameSession(77, lv);
  const start = s.faces.join(',');
  s.tap(0); s.tap(1); s.shuffle(Core.mulberry32(9)); s.useHint();
  s.reset();
  eq(s.faces.join(','), start);
  eq(s.remaining, s.n); eq(s.moves, 0); eq(s.hints, 0); eq(s.shuffles, 0); eq(s.history.length, 0);
  // decoding the level again gives the identical board
  const s2 = new Core.GameSession(77, level(77));
  eq(s2.faces.join(','), start);
});

test('hints always point at a valid free matching pair and can solve whole boards', () => {
  for (const n of [1, 13, 60, 140, 260, 380, 470, 500]) {
    const s = new Core.GameSession(n, level(n));
    let guard = 0;
    while (!s.won && guard++ < 100) {
      const h = s.findHint(40000);
      assert(h, 'hint available on level ' + n);
      const [a, b] = h.pair;
      assert(s.isFree(a) && s.isFree(b) && s.matches(a, b), 'hint pair valid');
      s.tap(a); s.tap(b);
    }
    assert(s.won, 'hint-guided play clears level ' + n);
  }
});

test('stars: 3 without help, 2 with up to two hints or one shuffle, else 1', () => {
  eq(Core.starsFor(0, 0), 3); eq(Core.starsFor(1, 0), 2); eq(Core.starsFor(2, 0), 2); eq(Core.starsFor(0, 1), 2);
  eq(Core.starsFor(3, 0), 1); eq(Core.starsFor(1, 1), 1); eq(Core.starsFor(0, 2), 1);
});

test('every one of the 500 levels can be played to a win through the real tap() API', () => {
  for (let n = 1; n <= Core.LEVEL_COUNT; n++) {
    const s = new Core.GameSession(n, level(n));
    for (let i = 0; i + 1 < s.n; i += 2) {
      eq(s.tap(i).type, 'select', `level ${n} tile ${i}`);
      const r = s.tap(i + 1);
      eq(r.type, 'match', `level ${n} pair ${i}`);
    }
    assert(s.won, 'level ' + n + ' won');
    eq(s.stars(), 3);
  }
});

test('alternative moves can dead-end a solvable start; the engine detects and recovers', () => {
  let deadEnds = 0, recovered = 0, levelsWithTraps = 0;
  const rng = Core.mulberry32(77);
  for (let n = 100; n <= 500; n += 20) {
    let trapped = false;
    for (let run = 0; run < 15; run++) {
      const s = new Core.GameSession(n, level(n));
      while (!s.won) {
        const pairs = s.availablePairs();
        if (!pairs.length) break;
        const [a, b] = pairs[Math.floor(rng() * pairs.length)];
        s.tap(a); s.tap(b);
      }
      if (s.won) continue;
      trapped = true; deadEnds++;
      eq(s.solvability(200000), 'unsolvable', 'stuck board is reported unsolvable');
      // Recovery 1: rewind to a provably solvable state
      const copy = Core.GameSession.restore(n, level(n), JSON.parse(JSON.stringify(s.serialize())));
      copy.rewindToSolvable(200000);
      eq(copy.solvability(200000), 'solved');
      // Recovery 2: shuffle (when the geometry allows) gives a solvable deal
      const sh = s.shuffle(rng);
      if (sh.ok) eq(s.solvability(200000), 'solved');
      recovered++;
    }
    if (trapped) levelsWithTraps++;
  }
  assert(deadEnds > 0, 'random play hit dead ends (initial solvability != every line solvable)');
  eq(recovered, deadEnds);
  results.push({ name: `  · random play dead-ended ${deadEnds} times across ${levelsWithTraps} sampled levels; all recovered`, ok: true, info: true });
});

// ---------------------------------------------------------------- persistence
test('save/restore of a game in progress replays and validates every move', () => {
  const n = 222;
  const s = new Core.GameSession(n, level(n));
  for (let k = 0; k < 8; k++) { s.tap(2 * k); s.tap(2 * k + 1); }
  s.shuffle(Core.mulberry32(3));
  const h = s.findHint(); s.tap(h.pair[0]); s.tap(h.pair[1]);
  s.useHint();
  s.elapsed = 65432;
  const json = JSON.stringify(s.serialize());
  const r = Core.GameSession.restore(n, level(n), JSON.parse(json));
  assert(r, 'restored');
  eq(r.faces.join(','), s.faces.join(','));
  eq(Array.from(r.st.present).join(''), Array.from(s.st.present).join(''));
  eq(r.history.length, s.history.length);
  eq(r.moves, s.moves); eq(r.hints, s.hints); eq(r.shuffles, s.shuffles); eq(r.elapsed, 65432);
  // undo across the restored shuffle works
  while (r.undo());
  eq(r.remaining, r.n);
  eq(r.faces.join(','), r.initialFaces.join(','));
  // corrupted data is rejected instead of loading a broken board
  const bad = JSON.parse(json); bad.h[0] = [0, 0];
  eq(Core.GameSession.restore(n, level(n), bad), null);
  const bad2 = JSON.parse(json); bad2.f = bad2.f.slice(1) + 'A';
  eq(Core.GameSession.restore(n, level(n), bad2), null);
  eq(Core.GameSession.restore(n + 1, level(n + 1), JSON.parse(json)), null, 'wrong level');
});

test('progression: sequential unlocks, world transitions and no level 501', () => {
  const d = P.defaultSave();
  eq(d.progress.unlocked, 1);
  assert(!P.isUnlocked(d, 2));
  const r1 = P.recordWin(d, 1, { stars: 1, timeMs: 30000, moves: 13, hints: 4, shuffles: 0, undos: 0, tiles: 26, family: 1 });
  assert(r1.unlockedNext && r1.firstClear);
  eq(d.progress.unlocked, 2);
  const again = P.recordWin(d, 1, { stars: 3, timeMs: 20000, moves: 13, hints: 0, shuffles: 0, undos: 0, tiles: 26, family: 1 });
  assert(again.newBest && !again.unlockedNext, 'replay improves stars');
  eq(d.progress.stars[0], 3); eq(d.progress.bestTime[0], 20000);
  P.recordWin(d, 1, { stars: 1, timeMs: 50000, moves: 20, hints: 9, shuffles: 0, undos: 0, tiles: 26, family: 1 });
  eq(d.progress.stars[0], 3, 'best stars kept'); eq(d.progress.bestTime[0], 20000, 'best time kept');
  let worldEvents = 0, last;
  for (let n = 2; n <= 500; n++) {
    assert(P.isUnlocked(d, n), 'level ' + n + ' unlocked in order');
    last = P.recordWin(d, n, { stars: n % 3 + 1, timeMs: 1000 * n, moves: 20, hints: 0, shuffles: 0, undos: 0, tiles: 40, family: n % 20 });
    if (last.newWorld >= 0) { worldEvents++; eq(last.newWorld, Core.levelMeta(n).world + 1); assert(P.worldUnlocked(d, last.newWorld)); }
  }
  eq(worldEvents, 19, 'worlds 2..20 opened by finals');
  assert(last.gameComplete && last.nextLevel === null, 'level 500 completes the game without a level 501');
  eq(d.progress.unlocked, 500);
  assert(!P.isUnlocked(d, 501));
  eq(P.levelsCleared(d), 500);
  assert(d.achievements.mahjong_master && d.achievements.dragons_crown && d.achievements.explorer && d.achievements.levels_250);
  assert(!d.achievements.all_stars, 'not every star yet');
  for (let n = 1; n <= 500; n++) P.recordWin(d, n, { stars: 3, timeMs: 999, moves: 20, hints: 0, shuffles: 0, undos: 0, tiles: 40, family: 0 });
  eq(P.totalStars(d), 1500);
  assert(d.achievements.all_stars && d.achievements.three_star_100 && d.achievements.serenity);
});

test('export/import: round trip, version checks and sanitising', () => {
  const d = P.defaultSave();
  P.recordWin(d, 1, { stars: 2, timeMs: 1234, moves: 13, hints: 1, shuffles: 0, undos: 0, tiles: 26, family: 1 });
  d.settings.volume = 0.25; d.settings.music = false;
  d.updatedAt = 42;
  const json = JSON.stringify(d);
  const back = P.sanitizeSave(json);
  eq(back.progress.stars[0], 2); eq(back.progress.unlocked, 2); eq(back.settings.volume, 0.25); eq(back.settings.music, false);
  const throws = (v, re) => { let msg = ''; try { P.sanitizeSave(v); } catch (e) { msg = e.message; } assert(re.test(msg), 'expected error ' + re + ' got ' + msg); };
  throws('not json', /geçerli bir JSON/);
  throws(JSON.stringify({ game: 'other', version: 1 }), /Zen Journey kaydı değil/);
  throws(JSON.stringify({ ...d, version: 99 }), /daha yeni bir sürüm/);
  throws(JSON.stringify([1, 2]), /kayıt bulunmuyor/);
  // hostile values are clamped
  const evil = JSON.parse(json);
  evil.progress.stars = [9, -1, 'x', 3]; evil.progress.unlocked = 9999; evil.settings.volume = 7; evil.achievements = { bogus: 1, first_match: 5 };
  const s = P.sanitizeSave(JSON.stringify(evil));
  eq(s.progress.stars[0], 3); eq(s.progress.stars[1], 0); eq(s.progress.stars[2], 0);
  eq(s.progress.unlocked, 500); eq(s.settings.volume, 1);
  assert(!('bogus' in s.achievements) && s.achievements.first_match === 5);
  // a cleared level implies the next one is unlocked even if the file says otherwise
  const inc = JSON.parse(json); inc.progress.unlocked = 1;
  eq(P.sanitizeSave(JSON.stringify(inc)).progress.unlocked, 2);
});

test('continue level prefers the saved game in progress', () => {
  const d = P.defaultSave();
  for (let n = 1; n <= 7; n++) P.recordWin(d, n, { stars: 3, timeMs: 1, moves: 1, hints: 0, shuffles: 0, undos: 0, tiles: 24, family: 0 });
  eq(P.continueLevel(d), 8);
  d.current = { v: 1, lv: 4 };
  eq(P.continueLevel(d), 4);
});

// ---------------------------------------------------------------- report
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.info ? '' : r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.error ? '\n      ' + r.error : ''}${r.ms !== undefined ? ` (${r.ms}ms)` : ''}`);
console.log(`\n${results.filter((r) => r.ok && !r.info).length} passed, ${failed.length} failed`);
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', 'engine-tests.json'), JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 1));
process.exit(failed.length ? 1 : 0);
