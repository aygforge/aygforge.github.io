/*
 * Mahjong: Zen Journey — AssetFactory.
 * Every visual is generated here: tile bodies and 42 tile faces (Canvas 2D
 * vector drawing, cached as sprites), UI icons (inline SVG), and the 20
 * world themes with procedural SVG backdrops.
 */
(function (root) {
  'use strict';
  const Core = root.MJCore;

  // ------------------------------------------------------------------ helpers
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }
  function circle(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
  function strokes(c, list, color, width, ox, oy, sx, sy) {
    c.save();
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const pl of list) {
      c.beginPath();
      pl.forEach(([x, y], i) => (i ? c.lineTo(ox + x * sx, oy + y * sy) : c.moveTo(ox + x * sx, oy + y * sy)));
      c.stroke();
    }
    c.restore();
  }

  const COL = {
    blue: '#1f5fa8', green: '#24865a', red: '#c23a2b', ink: '#1c2a47', gold: '#c9962b',
    cream: '#fbf6e9', purple: '#7b4bb3', pink: '#e2678a', orange: '#e8892b'
  };

  // ------------------------------------------------------------------ circles
  function coin(c, x, y, r, col, fancy) {
    circle(c, x, y, r, col);
    circle(c, x, y, r * 0.8, COL.cream);
    c.save();
    c.strokeStyle = col; c.lineWidth = r * 0.1;
    const petals = fancy ? 16 : 8;
    for (let i = 0; i < petals; i++) {
      const a = i / petals * Math.PI * 2;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * r * 0.34, y + Math.sin(a) * r * 0.34);
      c.lineTo(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66);
      c.stroke();
    }
    c.restore();
    circle(c, x, y, r * 0.38, col);
    circle(c, x, y, r * 0.2, COL.cream);
    circle(c, x, y, r * 0.09, col);
  }
  function drawDots(c, k) {
    const B = COL.blue, G = COL.green, R = COL.red;
    const P = {
      1: [[50, 66, 36, R, true]],
      2: [[50, 34, 21, G], [50, 98, 21, B]],
      3: [[24, 26, 16, B], [50, 66, 16, R], [76, 106, 16, G]],
      4: [[29, 36, 18, B], [71, 36, 18, G], [29, 96, 18, G], [71, 96, 18, B]],
      5: [[25, 28, 16, B], [75, 28, 16, G], [50, 66, 16, R], [25, 104, 16, G], [75, 104, 16, B]],
      6: [[29, 24, 15, G], [71, 24, 15, G], [29, 72, 15, R], [71, 72, 15, R], [29, 108, 15, R], [71, 108, 15, R]],
      7: [[20, 18, 12.5, G], [50, 34, 12.5, G], [80, 50, 12.5, G], [30, 82, 14, R], [70, 82, 14, R], [30, 114, 14, R], [70, 114, 14, R]],
      8: [[29, 18, 13, B], [71, 18, 13, B], [29, 50, 13, B], [71, 50, 13, B], [29, 82, 13, B], [71, 82, 13, B], [29, 114, 13, B], [71, 114, 13, B]],
      9: [[20, 26, 13, B], [50, 26, 13, B], [80, 26, 13, B], [20, 66, 13, R], [50, 66, 13, R], [80, 66, 13, R], [20, 106, 13, G], [50, 106, 13, G], [80, 106, 13, G]]
    }[k];
    c.save(); c.translate(50, 66); c.scale(1.07, 1.07); c.translate(-50, -66);
    for (const [x, y, r, col, fancy] of P) coin(c, x, y, r, col, fancy);
    c.restore();
    if (k === 1) {
      c.save(); c.strokeStyle = COL.green; c.lineWidth = 2.2;
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2;
        c.beginPath(); c.moveTo(50 + Math.cos(a) * 38.5, 66 + Math.sin(a) * 38.5); c.lineTo(50 + Math.cos(a) * 44, 66 + Math.sin(a) * 44); c.stroke();
      }
      c.restore();
    }
  }

  // ------------------------------------------------------------------ bamboo
  function stick(c, x, y, len, w, col, angle) {
    c.save();
    c.translate(x, y); c.rotate(angle || 0);
    const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    const dark = col === 'r' ? '#8f2a20' : col === 'b' ? '#164a86' : '#145f3e';
    const mid = col === 'r' ? COL.red : col === 'b' ? COL.blue : COL.green;
    g.addColorStop(0, dark); g.addColorStop(0.45, mid); g.addColorStop(1, dark);
    rr(c, -w / 2, -len / 2, w, len, w * 0.45);
    c.fillStyle = g; c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(-w * 0.18, -len / 2 + w * 0.4, w * 0.16, len - w * 0.8);
    c.fillStyle = dark;
    for (const t of [-0.5, 0, 0.5]) {
      rr(c, -w * 0.62, t * len * 0.92 - w * 0.13, w * 1.24, w * 0.26, w * 0.12);
      c.fill();
    }
    c.restore();
  }
  function bird(c) {
    // stylised sparrow-peacock perched, the traditional 1 of Bamboo
    c.save();
    // tail feathers
    const tail = [[-0.9, COL.green], [-0.55, COL.blue], [-0.2, COL.green], [0.15, COL.red]];
    for (const [a, col] of tail) {
      c.save(); c.translate(46, 84); c.rotate(a + Math.PI * 0.62);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(12, 22, 0, 48); c.quadraticCurveTo(-12, 22, 0, 0);
      c.fillStyle = col; c.fill();
      circle(c, 0, 38, 4.2, COL.cream); circle(c, 0, 38, 2.2, COL.gold);
      c.restore();
    }
    // body
    c.beginPath(); c.ellipse(52, 70, 22, 28, -0.35, 0, Math.PI * 2);
    const g = c.createLinearGradient(30, 44, 74, 98); g.addColorStop(0, '#3aa36f'); g.addColorStop(1, '#17603f');
    c.fillStyle = g; c.fill();
    // breast
    c.beginPath(); c.ellipse(60, 74, 11, 19, -0.3, 0, Math.PI * 2); c.fillStyle = COL.red; c.fill();
    // wing
    c.beginPath(); c.moveTo(36, 62); c.quadraticCurveTo(46, 52, 62, 70); c.quadraticCurveTo(48, 88, 30, 86); c.closePath();
    c.fillStyle = COL.blue; c.fill();
    c.strokeStyle = COL.cream; c.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(38 + i * 6, 68 + i * 3); c.quadraticCurveTo(44 + i * 4, 76, 36 + i * 3, 84); c.stroke(); }
    // head
    circle(c, 66, 38, 13, '#2c8f5f');
    circle(c, 70, 35, 3.6, COL.cream); circle(c, 70.8, 35, 1.8, COL.ink);
    c.beginPath(); c.moveTo(78, 38); c.lineTo(92, 42); c.lineTo(78, 45); c.closePath(); c.fillStyle = COL.gold; c.fill();
    // crest
    c.strokeStyle = COL.red; c.lineWidth = 2.4; c.lineCap = 'round';
    for (const dx of [-4, 0, 4]) { c.beginPath(); c.moveTo(62 + dx, 27); c.lineTo(58 + dx * 1.6, 16); c.stroke(); circle(c, 58 + dx * 1.6, 15, 2.4, COL.red); }
    // perch
    stick(c, 50, 116, 9, 70, 'g', Math.PI / 2);
    c.strokeStyle = COL.gold; c.lineWidth = 2.6;
    for (const dx of [46, 58]) { c.beginPath(); c.moveTo(dx, 96); c.lineTo(dx, 111); c.stroke(); }
    c.restore();
  }
  function drawBamboo(c, k) {
    const W = 14;
    const L = 46;
    const S = {
      2: [[50, 36, 'g'], [50, 96, 'b']],
      3: [[50, 36, 'b'], [30, 96, 'g'], [70, 96, 'g']],
      4: [[30, 36, 'b'], [70, 36, 'g'], [30, 96, 'g'], [70, 96, 'b']],
      5: [[24, 36, 'g'], [76, 36, 'b'], [50, 66, 'r'], [24, 96, 'b'], [76, 96, 'g']],
      6: [[22, 36, 'g'], [50, 36, 'g'], [78, 36, 'g'], [22, 96, 'b'], [50, 96, 'b'], [78, 96, 'b']],
      7: [[50, 24, 'r'], [22, 72, 'g'], [50, 72, 'b'], [78, 72, 'g'], [22, 114, 'g'], [50, 114, 'b'], [78, 114, 'g']],
      9: [[22, 26, 'g'], [50, 26, 'r'], [78, 26, 'b'], [22, 66, 'g'], [50, 66, 'r'], [78, 66, 'b'], [22, 106, 'g'], [50, 106, 'r'], [78, 106, 'b']]
    };
    if (k === 1) return bird(c);
    if (k === 8) {
      const a = 0.32;
      const w8 = 12;
      stick(c, 16, 36, L, w8, 'g', 0); stick(c, 38, 36, L, w8, 'g', a); stick(c, 62, 36, L, w8, 'g', -a); stick(c, 84, 36, L, w8, 'g', 0);
      stick(c, 16, 96, L, w8, 'b', 0); stick(c, 38, 96, L, w8, 'b', -a); stick(c, 62, 96, L, w8, 'b', a); stick(c, 84, 96, L, w8, 'b', 0);
      return;
    }
    const len = k === 7 || k === 9 ? 35 : L;
    for (const [x, y, col] of S[k]) stick(c, x, y, len, W, col, 0);
  }

  // ------------------------------------------------------------------ characters
  const NUMERALS = {
    1: [[[12, 28], [88, 24]]],
    2: [[[26, 12], [74, 10]], [[12, 42], [88, 38]]],
    3: [[[24, 6], [76, 4]], [[30, 25], [70, 23]], [[12, 46], [88, 42]]],
    4: [[[18, 8], [18, 48]], [[18, 8], [82, 8], [82, 48]], [[18, 46], [82, 46]], [[42, 10], [38, 28], [28, 36]], [[58, 10], [58, 30], [68, 32]]],
    5: [[[20, 6], [80, 6]], [[48, 6], [40, 46]], [[28, 24], [72, 24], [68, 46]], [[10, 46], [90, 46]]],
    6: [[[48, 0], [54, 10]], [[12, 18], [88, 18]], [[38, 28], [20, 48]], [[62, 28], [82, 48]]],
    7: [[[10, 26], [90, 18]], [[42, 2], [42, 40], [50, 48], [86, 48], [88, 38]]],
    8: [[[40, 6], [36, 30], [12, 48]], [[60, 8], [68, 30], [90, 48]]],
    9: [[[46, 2], [42, 28], [16, 50]], [[18, 18], [64, 16], [62, 42], [72, 48], [88, 46], [88, 36]]]
  };
  const WAN = [
    [[8, 10], [92, 10]], [[32, 1], [34, 19]], [[66, 1], [64, 19]],
    [[24, 23], [24, 41]], [[24, 23], [76, 23], [76, 41]], [[24, 41], [76, 41]], [[50, 23], [50, 41]], [[24, 32], [76, 32]],
    [[14, 47], [14, 64]], [[14, 47], [86, 47], [86, 60], [78, 64]],
    [[46, 50], [36, 60], [64, 58]], [[58, 52], [66, 59]]
  ];
  const IDX_DIGITS = {
    1: [[[6, 2], [6, 16]], [[3, 5], [6, 2]]],
    2: [[[1, 5], [3, 2], [9, 2], [11, 5], [1, 16], [11, 16]]],
    3: [[[1, 2], [10, 2], [5, 8], [10, 10], [10, 14], [6, 16], [1, 15]]],
    4: [[[8, 16], [8, 2], [1, 11], [11, 11]]],
    5: [[[10, 2], [2, 2], [2, 8], [8, 8], [10, 11], [9, 15], [2, 16]]],
    6: [[[9, 2], [3, 6], [1, 12], [4, 16], [9, 15], [10, 11], [6, 8], [2, 10]]],
    7: [[[1, 2], [11, 2], [5, 16]]],
    8: [[[6, 2], [2, 4], [2, 7], [10, 11], [10, 14], [6, 16], [2, 14], [2, 11], [10, 7], [10, 4], [6, 2]]],
    9: [[[10, 6], [6, 2], [2, 5], [3, 9], [10, 7], [10, 12], [6, 16], [2, 15]]],
    E: [[[10, 2], [2, 2], [2, 16], [10, 16]], [[2, 9], [8, 9]]],
    S: [[[10, 3], [6, 2], [2, 4], [2, 7], [10, 11], [10, 14], [6, 16], [2, 15]]],
    W: [[[1, 2], [3, 16], [6, 7], [9, 16], [11, 2]]],
    N: [[[2, 16], [2, 2], [10, 16], [10, 2]]]
  };
  function index(c, key, color) { strokes(c, IDX_DIGITS[key], color, 2.2, 3, 2, 0.95, 0.95); }
  function drawChar(c, k) {
    strokes(c, NUMERALS[k], COL.ink, 7.5, 10, 10, 0.8, 0.86);
    strokes(c, WAN, COL.red, 6.5, 8, 64, 0.84, 0.98);
    index(c, k, COL.red);
  }

  const WINDS = [
    // East 東
    [[[18, 18], [82, 18]], [[50, 3], [50, 97]], [[26, 30], [26, 62]], [[26, 30], [74, 30], [74, 62]], [[26, 46], [74, 46]], [[26, 62], [74, 62]], [[46, 66], [14, 92]], [[54, 66], [86, 92]]],
    // South 南
    [[[14, 12], [86, 12]], [[50, 2], [50, 24]], [[16, 30], [16, 96]], [[16, 30], [84, 30], [84, 92], [74, 96]], [[38, 38], [44, 48]], [[62, 38], [56, 48]], [[30, 56], [70, 56]], [[26, 72], [74, 72]], [[50, 56], [50, 92]]],
    // West 西
    [[[10, 10], [90, 10]], [[18, 32], [18, 94]], [[18, 32], [82, 32], [82, 94]], [[18, 92], [82, 92]], [[40, 10], [40, 50], [28, 64]], [[60, 10], [60, 56], [66, 62], [80, 62]]],
    // North 北
    [[[34, 8], [34, 92]], [[12, 40], [34, 40]], [[10, 84], [34, 70]], [[64, 6], [64, 84], [70, 92], [90, 92], [90, 80]], [[64, 46], [88, 32]]]
  ];
  function drawWind(c, k) {
    strokes(c, WINDS[k], COL.ink, 8, 6, 22, 0.88, 0.94);
    index(c, 'ESWN'[k], COL.blue);
  }
  function drawDragon(c, k) {
    if (k === 0) {
      // 中
      strokes(c, [[[20, 30], [20, 72]], [[20, 30], [80, 30], [80, 72]], [[20, 70], [80, 70]], [[50, 4], [50, 98]]], COL.red, 10, 0, 16, 1, 1);
    } else if (k === 1) {
      // 发
      strokes(c, [[[30, 8], [22, 24]], [[60, 6], [68, 18]], [[12, 32], [88, 32]], [[48, 32], [38, 62], [12, 96]], [[34, 56], [78, 56], [56, 80], [26, 98]], [[44, 66], [90, 98]], [[72, 40], [82, 46]]], COL.green, 9, 2, 16, 0.96, 1);
    } else {
      // White dragon: double blue frame
      c.save();
      c.strokeStyle = COL.blue;
      c.lineWidth = 5; rr(c, 14, 18, 72, 96, 6); c.stroke();
      c.lineWidth = 2.4; rr(c, 24, 28, 52, 76, 4); c.stroke();
      c.fillStyle = COL.blue;
      for (const [x, y] of [[14, 18], [86, 18], [14, 114], [86, 114]]) { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
  }

  // ------------------------------------------------------------------ flowers & seasons
  function blossom(c, x, y, r, petal, center) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      circle(c, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, petal);
    }
    circle(c, x, y, r * 0.3, center);
  }
  function leaf(c, x, y, len, w, angle, col) {
    c.save(); c.translate(x, y); c.rotate(angle);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w, -len * 0.5, 0, -len); c.quadraticCurveTo(-w, -len * 0.5, 0, 0);
    c.fillStyle = col; c.fill(); c.restore();
  }
  function drawFlower(c, k) {
    c.save();
    if (k === 0) { // plum
      c.strokeStyle = '#6b4226'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(18, 122); c.quadraticCurveTo(34, 80, 62, 66); c.quadraticCurveTo(76, 56, 80, 30); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(44, 86); c.quadraticCurveTo(30, 66, 30, 48); c.stroke();
      blossom(c, 74, 34, 17, '#e86a8d', COL.gold); blossom(c, 30, 46, 14, '#f08fab', COL.gold); blossom(c, 58, 74, 15, '#e0557c', COL.gold);
      circle(c, 22, 100, 4, '#e86a8d'); circle(c, 84, 60, 4, '#f08fab');
    } else if (k === 1) { // orchid
      const g = '#2c8a55';
      c.strokeStyle = g; c.lineWidth = 3.4; c.lineCap = 'round';
      for (const [cx, ex, ey] of [[20, 10, 40], [70, 90, 52], [40, 30, 20], [62, 84, 86]]) { c.beginPath(); c.moveTo(50, 124); c.quadraticCurveTo(cx, 80, ex, ey); c.stroke(); }
      for (let i = 0; i < 5; i++) leaf(c, 54, 58, 26, 9, -1.1 + i * 0.55, i % 2 ? '#9b6dd1' : '#7b4bb3');
      circle(c, 54, 58, 5, COL.gold);
      for (let i = 0; i < 3; i++) leaf(c, 30, 84, 16, 6, -0.6 + i * 0.6, '#b18ae0');
    } else if (k === 2) { // chrysanthemum
      leaf(c, 50, 124, 40, 12, -0.6, COL.green); leaf(c, 50, 124, 36, 11, 0.7, '#2c8a55');
      for (let ring = 0; ring < 2; ring++) {
        const n = 18, R = ring ? 20 : 30;
        for (let i = 0; i < n; i++) leaf(c, 50, 58, R, 4.6, i / n * Math.PI * 2 + ring * 0.17, ring ? '#f0b13a' : COL.orange);
      }
      circle(c, 50, 58, 7, '#b65f1a');
    } else { // bamboo flower
      c.save(); c.translate(0, 0);
      stick(c, 40, 72, 100, 8, 'g', 0.08); stick(c, 64, 80, 84, 7, 'g', -0.1);
      c.restore();
      for (const [x, y, a] of [[40, 30, -0.9], [42, 34, -0.3], [64, 46, 0.8], [66, 50, 1.4], [38, 70, -1.3], [62, 92, 1.0]]) leaf(c, x, y, 30, 6.5, a, '#2e9461');
    }
    c.restore();
    index(c, k + 1, COL.red);
  }
  function drawSeason(c, k) {
    c.save();
    if (k === 0) { // spring: sprouting branch with buds
      c.fillStyle = '#8a6a3c'; c.beginPath(); c.ellipse(50, 120, 34, 8, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = COL.green; c.lineWidth = 4.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(50, 118); c.quadraticCurveTo(46, 80, 54, 44); c.stroke();
      leaf(c, 50, 92, 32, 12, -1.05, '#3aa36f'); leaf(c, 52, 76, 30, 11, 1.0, '#2c8a55');
      blossom(c, 54, 36, 18, '#f39ab4', '#f5c542'); circle(c, 26, 60, 6, '#f39ab4'); circle(c, 76, 64, 5, '#f7b8c9');
    } else if (k === 1) { // summer: sun
      c.fillStyle = '#f2a23a';
      for (let i = 0; i < 12; i++) leaf(c, 50, 64, 46, 7, i / 12 * Math.PI * 2, i % 2 ? '#f4b844' : '#e8742b');
      const g = c.createRadialGradient(46, 58, 4, 50, 64, 26); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#e8742b');
      circle(c, 50, 64, 24, g);
      c.strokeStyle = '#b8551a'; c.lineWidth = 2.5; c.lineCap = 'round';
      c.beginPath(); c.arc(50, 66, 10, 0.2, Math.PI - 0.2); c.stroke();
    } else if (k === 2) { // autumn: maple leaf
      const pts = [];
      const lobes = [[0, -44], [9, -22], [26, -32], [22, -10], [42, -8], [30, 4], [36, 18], [12, 14], [4, 30], [-4, 30], [-12, 14], [-36, 18], [-30, 4], [-42, -8], [-22, -10], [-26, -32], [-9, -22]];
      for (const [x, y] of lobes) pts.push([50 + x * 1.05, 62 + y * 1.05]);
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      const g = c.createLinearGradient(20, 20, 80, 100); g.addColorStop(0, '#f0a03a'); g.addColorStop(1, '#c2361f');
      c.fillStyle = g; c.fill();
      c.strokeStyle = '#8f2a17'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(50, 116); c.lineTo(50, 30); c.moveTo(50, 70); c.lineTo(26, 46); c.moveTo(50, 70); c.lineTo(74, 46); c.stroke();
    } else { // winter: snowflake
      c.strokeStyle = '#2f7fc8'; c.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        c.save(); c.translate(50, 66); c.rotate(i * Math.PI / 3);
        c.lineWidth = 4.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -40); c.stroke();
        c.lineWidth = 3; c.beginPath(); c.moveTo(0, -16); c.lineTo(-10, -26); c.moveTo(0, -16); c.lineTo(10, -26);
        c.moveTo(0, -28); c.lineTo(-7, -35); c.moveTo(0, -28); c.lineTo(7, -35); c.stroke();
        c.restore();
      }
      circle(c, 50, 66, 6, '#8cc3ee');
    }
    c.restore();
    index(c, k + 1, COL.blue);
  }

  function drawFace(c, f) {
    const info = Core.faceInfo(f);
    const k = info.rank;
    switch (info.suit) {
      case 'dots': return drawDots(c, k + 1);
      case 'bamboo': return drawBamboo(c, k + 1);
      case 'chars': return drawChar(c, k + 1);
      case 'wind': return drawWind(c, k);
      case 'dragon': return drawDragon(c, k);
      case 'flower': return drawFlower(c, k);
      case 'season': return drawSeason(c, k);
    }
  }

  // ------------------------------------------------------------------ tile sprites
  const TILE_ASPECT = 0.76;
  const DEPTH = 0.1;
  function tileMetrics(W) {
    const H = W / TILE_ASPECT;
    const d = Math.max(2, W * DEPTH);
    const pad = Math.ceil(W * 0.14);
    return { W, H, d, pad, r: W * 0.13, spriteW: W + d + pad * 2, spriteH: H + d + pad * 2 };
  }
  function makeCanvas(w, h) {
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
    return cv;
  }
  // Draws one tile (body + face) into ctx with the face's top-left at (0, 0).
  function paintTile(c, m, face, blocked) {
    const { W, H, d, r } = m;
    c.save();
    c.shadowColor = 'rgba(10,20,15,0.38)'; c.shadowBlur = W * 0.16; c.shadowOffsetX = W * 0.05; c.shadowOffsetY = W * 0.08;
    rr(c, d, d, W, H, r); c.fillStyle = '#134a36'; c.fill();
    c.restore();
    // jade back
    let g = c.createLinearGradient(d, d, W + d, H + d);
    g.addColorStop(0, '#3aa57c'); g.addColorStop(1, '#0f5139');
    rr(c, d, d, W, H, r); c.fillStyle = g; c.fill();
    // ivory middle layer
    g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#efe3c4'); g.addColorStop(1, '#cdbb92');
    rr(c, d * 0.5, d * 0.5, W, H, r); c.fillStyle = g; c.fill();
    // face
    g = c.createLinearGradient(0, 0, W * 0.6, H);
    g.addColorStop(0, '#fffdf7'); g.addColorStop(1, '#f2e8d2');
    rr(c, 0, 0, W, H, r); c.fillStyle = g; c.fill();
    c.lineWidth = Math.max(1, W * 0.022); c.strokeStyle = 'rgba(120,96,60,0.55)'; c.stroke();
    // inner bevel
    c.save();
    rr(c, 0, 0, W, H, r); c.clip();
    c.lineWidth = W * 0.05;
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.moveTo(W * 0.06, H - r); c.lineTo(W * 0.06, r); c.quadraticCurveTo(W * 0.06, H * 0.03, r, H * 0.03); c.lineTo(W - r, H * 0.03); c.stroke();
    c.strokeStyle = 'rgba(160,130,85,0.28)';
    c.beginPath(); c.moveTo(W * 0.96, r); c.lineTo(W * 0.96, H - r); c.quadraticCurveTo(W * 0.96, H * 0.975, W - r, H * 0.975); c.lineTo(r, H * 0.975); c.stroke();
    // symbol
    c.translate(W * 0.08, H * 0.065);
    c.scale(W * 0.84 / 100, H * 0.87 / 132);
    drawFace(c, face);
    c.restore();
    if (blocked) { rr(c, 0, 0, W, H, r); c.fillStyle = 'rgba(42,52,48,0.32)'; c.fill(); }
  }

  class TileAtlas {
    constructor() { this.key = ''; this.cache = new Map(); this.m = null; }
    ensure(W, dpr) {
      const q = Math.max(8, Math.round(W * dpr));
      const key = q + '';
      if (key === this.key) return;
      this.key = key;
      this.cache.clear();
      this.dpr = dpr;
      this.px = q; // tile width in device pixels
      this.m = tileMetrics(q);
    }
    sprite(face, blocked) {
      const k = face * 2 + (blocked ? 1 : 0);
      let s = this.cache.get(k);
      if (!s) {
        const m = this.m;
        s = makeCanvas(m.spriteW, m.spriteH);
        const c = s.getContext('2d');
        c.translate(m.pad, m.pad);
        paintTile(c, m, face, blocked);
        this.cache.set(k, s);
      }
      return s;
    }
  }

  // Standalone tile image (menus, tutorial cards) as a data URL.
  function tileDataURL(face, W) {
    const m = tileMetrics(W);
    const cv = makeCanvas(m.spriteW, m.spriteH);
    const c = cv.getContext('2d');
    c.translate(m.pad, m.pad);
    paintTile(c, m, face, false);
    return cv.toDataURL();
  }

  // ------------------------------------------------------------------ icons
  const I = (p, extra) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${extra || ''}>${p}</svg>`;
  const ICONS = {
    back: I('<path d="M15 5l-7 7 7 7"/>'),
    fsEnter: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    fsExit: I('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
    hint: I('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'),
    shuffle: I('<path d="M3 7h4c4 0 6 10 10 10h4M3 17h4c1.5 0 2.7-1.4 3.6-3M14 8.5C15 7.5 16 7 17 7h4M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
    undo: I('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    restart: I('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
    pause: I('<path d="M9 5v14M15 5v14"/>'),
    play: I('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
    settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    stats: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    trophy: I('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>'),
    star: I('<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor" stroke="none"/>'),
    lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    map: I('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'),
    close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: I('<path d="M5 12l5 5 9-10"/>'),
    music: I('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
    sound: I('<path d="M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
    zoom: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>'),
    download: I('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    upload: I('<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>'),
    external: I('<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
    trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    bug: I('<rect x="7" y="8" width="10" height="12" rx="5"/><path d="M12 8V5M9 5l1.5 2M15 5l-1.5 2M3 13h4M17 13h4M4 19l3-2M20 19l-3-2M4 7l3 2M20 7l-3 2"/>')
  };

  // ------------------------------------------------------------------ worlds
  // sky: [top, mid, bottom]; ink: UI accent; particles: ambient effect type
  const WORLDS = [
    { name: 'Bambu Bahçesi', sky: ['#d9efd8', '#a9d5b0', '#5f9f7a'], hill: ['#86bf98', '#4f8f6b', '#2f6b4c'], accent: '#3c9a68', ui: '#2f7f57', particles: 'leaves', scene: 'bamboo', key: 0, sub: 'Her yolculuğun başladığı yer' },
    { name: 'Kiraz Çiçeği', sky: ['#fde6ec', '#f6c1cf', '#d98aa3'], hill: ['#e9b3c2', '#c47d95', '#8f4f68'], accent: '#d9668b', ui: '#b84d73', particles: 'petals', scene: 'sakura', key: 2, sub: 'Yapraklar hafif bir rüzgârda süzülür' },
    { name: 'Sonbahar Tapınağı', sky: ['#fbe3bd', '#f1b878', '#c9683b'], hill: ['#d9905a', '#a85c34', '#6e3720'], accent: '#d4733a', ui: '#b25a26', particles: 'maple', scene: 'autumn', key: 4, sub: 'Akçaağaç yaprakları ve tapınak çanları' },
    { name: 'Puslu Göl', sky: ['#e4eef2', '#c3d6df', '#8fb0bf'], hill: ['#a8c0cb', '#7d9cab', '#557684'], accent: '#5f8ea3', ui: '#3f7088', particles: 'mist', scene: 'lake', key: 1, sub: 'Durgun sular, sakin zihin' },
    { name: 'Ay Işığı Bahçesi', sky: ['#1b2245', '#2e3a6b', '#4a4f86'], hill: ['#3a4377', '#2a3160', '#1b2148'], accent: '#a9b4ff', ui: '#7d87d9', particles: 'fireflies', scene: 'moon', key: 3, sub: 'Uyuyan çiçeklerde gümüş ışık', dark: true },
    { name: 'Kadim Harabeler', sky: ['#f3dcc0', '#c9b59a', '#7f8a7a'], hill: ['#a8a088', '#7c7a66', '#525448'], accent: '#9a7b4f', ui: '#7d6340', particles: 'dust', scene: 'ruins', key: 5, sub: 'Taşlar eski hikâyeleri hatırlar' },
    { name: 'Fener Köyü', sky: ['#2a1a33', '#5a2b45', '#a4484c'], hill: ['#4a2a3c', '#33202f', '#1e1420'], accent: '#ff9a4a', ui: '#e0733a', particles: 'fireflies', scene: 'lanterns', key: 2, sub: 'Sıcak ışıklar yolu gösterir', dark: true },
    { name: 'Bulut Dağları', sky: ['#fbefe6', '#d9e3f0', '#a7bcd8'], hill: ['#9fb2cc', '#7488a8', '#4c5f80'], accent: '#6f86b3', ui: '#4f6797', particles: 'clouds', scene: 'peaks', key: 0, sub: 'Bulut denizinin üzerinde' },
    { name: 'Yeşim Mabedi', sky: ['#d6f0e6', '#8fcfb5', '#3e8f74'], hill: ['#62ad91', '#3e8a70', '#1f5c48'], accent: '#2f9e7c', ui: '#1f7d61', particles: 'motes', scene: 'jade', key: 4, sub: 'Yeşil taştan kutsal salonlar' },
    { name: 'Altın Kumlar', sky: ['#fff1cf', '#f6cf82', '#d99a45'], hill: ['#e9b763', '#c98d3c', '#9a6526'], accent: '#d29a2f', ui: '#a87418', particles: 'dust', scene: 'desert', key: 1, sub: 'Altın güneşin altında tapınaklar' },
    { name: 'Nilüfer Cenneti', sky: ['#fdeef3', '#d8eee9', '#8fcbc2'], hill: ['#a7d8cf', '#6fb3a8', '#3f8a80'], accent: '#e07aa0', ui: '#c0577f', particles: 'petals', scene: 'lotus', key: 3, sub: 'Durgun suda yüzen çiçekler' },
    { name: 'Kış Sarayı', sky: ['#eef5fb', '#cfe0ef', '#9db9d6'], hill: ['#dfe9f3', '#b3c8dd', '#7f9cbb'], accent: '#5c8fc4', ui: '#3d70a8', particles: 'snow', scene: 'winter', key: 5, sub: 'Sessiz çatılara kar yağar' },
    { name: 'Işıklar Festivali', sky: ['#160f2e', '#3a1f55', '#7a3363'], hill: ['#3b2150', '#27163a', '#170d25'], accent: '#ffcf5a', ui: '#e8a93a', particles: 'sparks', scene: 'festival', key: 2, sub: 'Gökyüzü kutlamayla çiçek açar', dark: true },
    { name: 'Yıldızlı Liman', sky: ['#0d1b33', '#1c3358', '#36557f'], hill: ['#22385c', '#172a48', '#0d1a30'], accent: '#7fc4ff', ui: '#4f9fe0', particles: 'stars', scene: 'harbor', key: 0, sub: 'Tekneler yıldızların altında dinlenir', dark: true },
    { name: 'Gizli Vadi', sky: ['#e8f6e4', '#b9e0b4', '#6fae73'], hill: ['#8cc48c', '#5c9a62', '#356f40'], accent: '#4f9e56', ui: '#357f3d', particles: 'mist', scene: 'valley', key: 4, sub: 'Tepelerin ardında bir şelale' },
    { name: 'Batık Tapınak', sky: ['#5fc2d6', '#2a8aa8', '#0f4f72'], hill: ['#2e7f95', '#1d5f78', '#0e3e57'], accent: '#7fe0e8', ui: '#3fb0c4', particles: 'bubbles', scene: 'sunken', key: 1, sub: 'Işık derinliklerde dalgalanır', dark: true },
    { name: 'Kızıl Kanyon', sky: ['#ffd9b8', '#f29a6a', '#b6463a'], hill: ['#d9734e', '#a94a36', '#6f2a24'], accent: '#d4553a', ui: '#b03d26', particles: 'embers', scene: 'canyon', key: 3, sub: 'Kızıl kayalıklar alacakaranlıkta parlar' },
    { name: 'Gece Ormanı', sky: ['#0e1f1f', '#173434', '#24504a'], hill: ['#1d3f3b', '#132d2b', '#0a1c1b'], accent: '#c8f56a', ui: '#8fcf4a', particles: 'fireflies', scene: 'forest', key: 5, sub: 'Çamların arasında ateşböcekleri', dark: true },
    { name: 'Göksel Bahçe', sky: ['#1a1240', '#3b2a74', '#7a5bb0'], hill: ['#4a3a86', '#33276a', '#1f1747'], accent: '#e6c7ff', ui: '#b88ae8', particles: 'stars', scene: 'celestial', key: 2, sub: 'Yıldızların arasında bir bahçe', dark: true },
    { name: 'Ejderha Tacı', sky: ['#0f2a22', '#1f4a3a', '#5a6a3a'], hill: ['#244a3a', '#17352a', '#0c211a'], accent: '#f2c14e', ui: '#d9a12a', particles: 'embers', scene: 'dragon', key: 0, sub: 'Yolculuğun zirvesi', dark: true }
  ];

  // ------------------------------------------------------------------ backgrounds (SVG)
  const VW = 400, VH = 720;
  function srng(seed) { return Core.mulberry32(seed); }
  function ridge(rng, y, amp, steps, col, op) {
    let d = `M0 ${VH} L0 ${y}`;
    let px = 0, py = y;
    const n = steps;
    for (let i = 1; i <= n; i++) {
      const x = i * VW / n;
      const ny = y - rng() * amp;
      const cx = (px + x) / 2;
      d += ` Q${cx.toFixed(1)} ${(Math.min(py, ny) - amp * 0.35 * rng()).toFixed(1)} ${x.toFixed(1)} ${ny.toFixed(1)}`;
      px = x; py = ny;
    }
    d += ` L${VW} ${VH} Z`;
    return `<path d="${d}" fill="${col}" opacity="${op || 1}"/>`;
  }
  function peaks(rng, y, h, count, col, op, snow) {
    let s = '';
    for (let i = 0; i < count; i++) {
      const x = (i + 0.5) * VW / count + (rng() - 0.5) * 60;
      const w = 90 + rng() * 120, hh = h * (0.6 + rng() * 0.5);
      s += `<path d="M${x - w} ${y} Q${x - w * 0.3} ${y - hh * 0.6} ${x} ${y - hh} Q${x + w * 0.35} ${y - hh * 0.55} ${x + w} ${y} Z" fill="${col}" opacity="${op || 1}"/>`;
      if (snow) s += `<path d="M${x - w * 0.18} ${y - hh * 0.78} Q${x - w * 0.06} ${y - hh * 0.96} ${x} ${y - hh} Q${x + w * 0.08} ${y - hh * 0.95} ${x + w * 0.2} ${y - hh * 0.76} Q${x + w * 0.05} ${y - hh * 0.82} ${x} ${y - hh * 0.74} Q${x - w * 0.06} ${y - hh * 0.84} ${x - w * 0.18} ${y - hh * 0.78}Z" fill="#fff" opacity="0.85"/>`;
    }
    return s;
  }
  function mist(y, col, op) {
    return `<ellipse cx="${VW * 0.3}" cy="${y}" rx="260" ry="34" fill="${col}" opacity="${op}" filter="url(#blur)"/><ellipse cx="${VW * 0.8}" cy="${y + 26}" rx="220" ry="28" fill="${col}" opacity="${op * 0.8}" filter="url(#blur)"/>`;
  }
  function stars(rng, n, maxY, col) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const r = rng() < 0.1 ? 1.6 : 0.5 + rng() * 0.9;
      s += `<circle cx="${(rng() * VW).toFixed(1)}" cy="${(rng() * maxY).toFixed(1)}" r="${r.toFixed(2)}" fill="${col || '#fff'}" opacity="${(0.4 + rng() * 0.6).toFixed(2)}"/>`;
    }
    return s;
  }
  function orb(x, y, r, col, glow) {
    return `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#glow)" opacity="0.7"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>` + (glow ? `<circle cx="${x}" cy="${y}" r="${r * 1.25}" fill="none" stroke="${col}" stroke-opacity="0.35" stroke-width="3"/>` : '');
  }
  function bambooStalk(x, top, w, col, rng) {
    let s = `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${VH - top}" rx="${w / 2}" fill="${col}"/>`;
    for (let y = top + 40 + rng() * 30; y < VH; y += 60 + rng() * 30) {
      s += `<rect x="${x - w * 0.65}" y="${y}" width="${w * 1.3}" height="${w * 0.28}" rx="${w * 0.14}" fill="${col}" opacity="0.9"/>`;
      if (rng() < 0.5) {
        const dir = rng() < 0.5 ? -1 : 1;
        s += `<path d="M${x} ${y} q${dir * 26} -14 ${dir * 52} -4 q${-dir * 24} 6 ${-dir * 52} 4z" fill="${col}" opacity="0.85"/>`;
      }
    }
    return s;
  }
  function blossomTree(rng, x, y, s, trunk, bloom) {
    let o = `<path d="M${x} ${VH} C${x - 6} ${y + 120} ${x + 10} ${y + 60} ${x} ${y}" stroke="${trunk}" stroke-width="${10 * s}" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 2.2;
      const len = 60 * s + rng() * 40 * s;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len * 0.7;
      o += `<path d="M${x} ${y + 10} Q${(x + ex) / 2} ${ey + 20} ${ex} ${ey}" stroke="${trunk}" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>`;
      for (let k = 0; k < 7; k++) o += `<circle cx="${(ex + (rng() - 0.5) * 50 * s).toFixed(1)}" cy="${(ey + (rng() - 0.5) * 34 * s).toFixed(1)}" r="${(10 + rng() * 14) * s}" fill="${bloom[k % bloom.length]}" opacity="0.9"/>`;
    }
    return o;
  }
  function pagodaSil(x, y, s, col) {
    let o = '';
    for (let i = 0; i < 4; i++) {
      const w = (70 - i * 14) * s, yy = y - i * 30 * s;
      o += `<rect x="${x - w * 0.32}" y="${yy - 20 * s}" width="${w * 0.64}" height="${20 * s}" fill="${col}"/>`;
      o += `<path d="M${x - w / 2 - 10 * s} ${yy - 18 * s} Q${x} ${yy - 34 * s} ${x + w / 2 + 10 * s} ${yy - 18 * s} L${x + w / 2} ${yy - 22 * s} L${x - w / 2} ${yy - 22 * s}Z" fill="${col}"/>`;
    }
    o += `<rect x="${x - 1.5 * s}" y="${y - 150 * s}" width="${3 * s}" height="${30 * s}" fill="${col}"/>`;
    return o;
  }
  function roofLine(x, y, w, col) {
    return `<path d="M${x - w / 2 - 14} ${y} Q${x} ${y - 26} ${x + w / 2 + 14} ${y} L${x + w / 2} ${y - 6} L${x - w / 2} ${y - 6}Z" fill="${col}"/><rect x="${x - w / 2 + 6}" y="${y}" width="${w - 12}" height="${VH - y}" fill="${col}"/>`;
  }
  function lantern(x, y, r, col) {
    return `<line x1="${x}" y1="${y - r * 1.6}" x2="${x}" y2="${y - r}" stroke="#2a1a1a" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="url(#glow)" opacity="0.8"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="${col}"/><rect x="${x - r * 0.5}" y="${y + r * 1.1}" width="${r}" height="${r * 0.3}" fill="#5a2a1a"/>`;
  }
  function pine(x, y, h, col) {
    const w = h * 0.36;
    let s = '';
    for (let i = 0; i < 4; i++) {
      const yy = y - i * h * 0.22, ww = w * (1 - i * 0.2);
      s += `<path d="M${x - ww} ${yy} L${x} ${yy - h * 0.38} L${x + ww} ${yy}Z" fill="${col}"/>`;
    }
    return s + `<rect x="${x - h * 0.03}" y="${y}" width="${h * 0.06}" height="${h * 0.1}" fill="${col}"/>`;
  }

  function scene(w, rng) {
    const [h1, h2, h3] = w.hill;
    let s = '';
    switch (w.scene) {
      case 'bamboo':
        s += orb(300, 140, 34, '#fffbe6') + ridge(rng, 420, 60, 5, h1, 0.7) + mist(430, '#fff', 0.5) + ridge(rng, 520, 50, 6, h2, 0.8);
        for (let i = 0; i < 5; i++) s += bambooStalk(10 + i * 22 + rng() * 10, 60 + rng() * 120, 9 + rng() * 5, i % 2 ? '#3f8f5e' : '#2f744b', rng);
        for (let i = 0; i < 5; i++) s += bambooStalk(VW - 10 - i * 22 - rng() * 10, 60 + rng() * 120, 9 + rng() * 5, i % 2 ? '#3f8f5e' : '#2f744b', rng);
        s += ridge(rng, 640, 30, 4, h3, 1);
        break;
      case 'sakura':
        s += orb(90, 130, 30, '#fff4f0') + ridge(rng, 430, 70, 4, h1, 0.6) + mist(440, '#fff', 0.45) + ridge(rng, 540, 40, 5, h2, 0.7);
        s += blossomTree(rng, 40, 240, 1.2, '#6d3b4a', ['#f7b6c8', '#f28fae', '#fbd3df']) + blossomTree(rng, VW - 30, 200, 1.1, '#6d3b4a', ['#f7b6c8', '#ffd6e2', '#ee86a6']);
        s += ridge(rng, 650, 24, 4, h3, 1);
        break;
      case 'autumn':
        s += orb(280, 150, 38, '#fff1d4') + ridge(rng, 430, 60, 5, h1, 0.7) + pagodaSil(310, 470, 0.9, h2) + mist(480, '#fde7c8', 0.5);
        s += blossomTree(rng, 30, 260, 1.1, '#5a2e1e', ['#e8742b', '#d9481f', '#f2a23a']) + blossomTree(rng, VW - 20, 300, 0.9, '#5a2e1e', ['#f2a23a', '#e05a24', '#c63a1e']);
        s += ridge(rng, 630, 30, 4, h3, 1);
        break;
      case 'lake': {
        s += orb(200, 170, 32, '#ffffff') + peaks(rng, 430, 160, 3, h1, 0.6) + peaks(rng, 440, 110, 4, h2, 0.75);
        s += `<rect x="0" y="440" width="${VW}" height="${VH - 440}" fill="${h3}" opacity="0.55"/>`;
        s += `<g transform="translate(0 880) scale(1 -1)" opacity="0.25">${peaks(srng(7), 440, 110, 4, h2, 1)}</g>`;
        for (let i = 0; i < 8; i++) s += `<rect x="${rng() * VW}" y="${460 + i * 30}" width="${40 + rng() * 80}" height="1.5" fill="#fff" opacity="0.5"/>`;
        s += mist(420, '#fff', 0.7) + mist(560, '#fff', 0.4);
        s += `<path d="M260 600 q30 10 60 0 l-8 8 h-44z" fill="#3a4f58"/><line x1="290" y1="560" x2="290" y2="600" stroke="#3a4f58" stroke-width="2"/>`;
        break;
      }
      case 'moon':
        s += stars(rng, 90, 420) + orb(280, 150, 46, '#f2f0ff', true) + ridge(rng, 480, 60, 5, h1, 0.9) + mist(500, '#9aa6e8', 0.25);
        s += ridge(rng, 580, 40, 6, h2, 1);
        for (const x of [40, 120, 300, 370]) s += lantern(x, 620 - rng() * 30, 7, '#fff2c4');
        s += ridge(rng, 660, 20, 4, h3, 1);
        break;
      case 'ruins':
        s += orb(110, 160, 36, '#fff3dc') + ridge(rng, 440, 60, 5, h1, 0.7) + mist(450, '#f6e8d0', 0.5);
        for (let i = 0; i < 6; i++) {
          const x = 20 + i * 72 + rng() * 20, hgt = 80 + rng() * 140;
          s += `<rect x="${x}" y="${600 - hgt}" width="22" height="${hgt}" fill="${h2}"/><rect x="${x - 5}" y="${600 - hgt}" width="32" height="8" fill="${h2}"/>`;
        }
        s += `<rect x="40" y="420" width="140" height="10" fill="${h2}" opacity="0.8" transform="rotate(-6 110 425)"/>` + ridge(rng, 610, 30, 5, h3, 1);
        break;
      case 'lanterns':
        s += stars(rng, 40, 300, '#ffd9b0') + ridge(rng, 470, 40, 5, h1, 0.9);
        for (let i = 0; i < 4; i++) s += roofLine(50 + i * 100, 520 + rng() * 40, 80, h2);
        for (let row = 0; row < 2; row++) {
          const y0 = 220 + row * 140;
          s += `<path d="M-10 ${y0} Q200 ${y0 + 60} 410 ${y0}" stroke="#2a1520" stroke-width="1.4" fill="none"/>`;
          for (let i = 0; i < 7; i++) { const t = (i + 0.5) / 7; s += lantern(-10 + t * 420, y0 + Math.sin(t * Math.PI) * 44 + 14, 9, i % 2 ? '#ff7a3a' : '#ff4a3a'); }
        }
        s += ridge(rng, 650, 16, 4, h3, 1);
        break;
      case 'peaks':
        s += orb(320, 120, 34, '#fff6e8') + peaks(rng, 520, 300, 3, h1, 0.8, true) + mist(480, '#fff', 0.8) + peaks(rng, 600, 200, 4, h2, 0.9, true) + mist(590, '#fff', 0.9) + mist(660, '#fff', 0.8);
        break;
      case 'jade':
        s += orb(200, 150, 30, '#f2fff8') + ridge(rng, 440, 50, 5, h1, 0.8) + mist(450, '#e8fff4', 0.5);
        s += `<circle cx="200" cy="470" r="120" fill="none" stroke="${h3}" stroke-width="34" opacity="0.85"/><rect x="0" y="560" width="${VW}" height="${VH - 560}" fill="${h3}"/>`;
        s += roofLine(200, 330, 200, h3).replace(/<rect[^>]*\/>/, '');
        break;
      case 'desert':
        s += orb(290, 160, 44, '#fff6d8') + `<path d="M0 470 Q100 420 200 460 T400 450 L400 720 L0 720Z" fill="${h1}"/>`;
        s += pagodaSil(110, 470, 0.7, h2) + `<path d="M0 560 Q120 510 240 560 T400 540 L400 720 L0 720Z" fill="${h2}"/><path d="M0 640 Q140 600 260 650 T400 630 L400 720 L0 720Z" fill="${h3}"/>`;
        break;
      case 'lotus':
        s += orb(110, 140, 30, '#fffafc') + ridge(rng, 420, 50, 5, h1, 0.6) + `<rect x="0" y="450" width="${VW}" height="${VH - 450}" fill="${h2}" opacity="0.6"/>` + mist(450, '#fff', 0.6);
        for (let i = 0; i < 9; i++) {
          const x = rng() * VW, y = 500 + rng() * 200, r = 16 + rng() * 22;
          s += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.4}" fill="${h3}"/>`;
          if (rng() < 0.6) s += `<path d="M${x - 10} ${y - 4} Q${x - 8} ${y - 22} ${x} ${y - 26} Q${x + 8} ${y - 22} ${x + 10} ${y - 4}Z" fill="#f4a3bf"/><path d="M${x - 4} ${y - 4} Q${x} ${y - 30} ${x + 4} ${y - 4}Z" fill="#fbd0de"/>`;
        }
        break;
      case 'winter':
        s += orb(260, 140, 30, '#ffffff') + peaks(rng, 480, 220, 3, h2, 0.7, true) + mist(470, '#fff', 0.7);
        s += pagodaSil(200, 560, 1.0, '#6f87a6') + `<path d="M140 500 Q200 480 260 500" stroke="#fff" stroke-width="5" fill="none"/>`;
        s += `<rect x="0" y="580" width="${VW}" height="${VH - 580}" fill="#f4f8fc"/>` + ridge(rng, 600, 18, 4, '#e2ecf6', 1);
        break;
      case 'festival':
        s += stars(rng, 40, 400);
        for (let i = 0; i < 4; i++) {
          const cx = 60 + rng() * 280, cy = 110 + rng() * 220, R = 40 + rng() * 40, col = ['#ffcf5a', '#ff6f91', '#7fd6ff', '#b18cff'][i];
          for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; s += `<line x1="${cx + Math.cos(a) * R * 0.25}" y1="${cy + Math.sin(a) * R * 0.25}" x2="${cx + Math.cos(a) * R}" y2="${cy + Math.sin(a) * R}" stroke="${col}" stroke-width="2" stroke-linecap="round" opacity="0.8"/>`; }
        }
        s += ridge(rng, 540, 30, 5, h1, 1);
        for (let i = 0; i < 4; i++) s += roofLine(50 + i * 100, 590 + rng() * 30, 80, h2);
        for (let i = 0; i < 10; i++) s += lantern(rng() * VW, 380 + rng() * 160, 5, '#ffb44a');
        break;
      case 'harbor':
        s += stars(rng, 140, 420) + orb(90, 120, 22, '#e9f3ff') + ridge(rng, 470, 40, 5, h1, 1);
        s += `<rect x="0" y="480" width="${VW}" height="${VH - 480}" fill="${h2}"/>`;
        s += `<rect x="330" y="360" width="16" height="120" fill="${h3}"/><path d="M326 360 h24 l-4 -16 h-16z" fill="${h3}"/><path d="M338 352 L0 300 L0 330Z" fill="#fff6c8" opacity="0.12"/><circle cx="338" cy="352" r="6" fill="#fff6c8"/>`;
        for (const [x, y] of [[80, 560], [200, 610], [290, 540]]) s += `<path d="M${x - 30} ${y} h60 l-10 12 h-40z" fill="${h3}"/><line x1="${x}" y1="${y - 50}" x2="${x}" y2="${y}" stroke="${h3}" stroke-width="2"/><path d="M${x} ${y - 48} L${x + 24} ${y - 6} L${x} ${y - 6}Z" fill="#d7e6f7" opacity="0.6"/>`;
        for (let i = 0; i < 14; i++) s += `<rect x="${rng() * VW}" y="${500 + rng() * 200}" width="${20 + rng() * 50}" height="1.4" fill="#cfe6ff" opacity="0.35"/>`;
        break;
      case 'valley':
        s += orb(200, 120, 30, '#fffff2') + `<path d="M0 200 L120 220 L150 720 L0 720Z" fill="${h2}"/><path d="M400 180 L270 230 L250 720 L400 720Z" fill="${h2}"/>`;
        s += `<rect x="168" y="230" width="64" height="420" fill="#e8f6ff" opacity="0.85"/><rect x="180" y="230" width="10" height="420" fill="#fff" opacity="0.8"/>` + mist(640, '#fff', 0.9);
        s += ridge(rng, 650, 30, 5, h3, 1);
        break;
      case 'sunken':
        for (let i = 0; i < 6; i++) s += `<path d="M${40 + i * 70} 0 L${10 + i * 70} 720 L${70 + i * 70} 720Z" fill="#fff" opacity="0.06"/>`;
        s += ridge(rng, 520, 40, 5, h1, 0.8) + pagodaSil(260, 620, 1.1, h2);
        for (let i = 0; i < 6; i++) { const x = 20 + rng() * 360; s += `<path d="M${x} 720 q-14 -60 4 -120 q14 -50 -2 -90" stroke="#2f8f6a" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8"/>`; }
        s += ridge(rng, 660, 20, 5, h3, 1);
        break;
      case 'canyon':
        s += orb(200, 190, 40, '#ffe7c8') + `<path d="M0 360 L90 360 L110 420 L150 420 L160 720 L0 720Z" fill="${h1}"/><path d="M400 330 L300 330 L280 400 L250 400 L240 720 L400 720Z" fill="${h1}"/>`;
        s += `<path d="M0 470 L60 470 L80 520 L200 520 L210 720 L0 720Z" fill="${h2}"/><path d="M400 480 L330 480 L320 540 L190 560 L190 720 L400 720Z" fill="${h2}"/>` + ridge(rng, 650, 20, 4, h3, 1);
        break;
      case 'forest':
        s += stars(rng, 60, 300) + orb(300, 110, 24, '#eef9d8');
        for (let row = 0; row < 3; row++) {
          const col = w.hill[row];
          for (let i = 0; i < 9; i++) s += pine(i * 50 + rng() * 30 - 10, 440 + row * 90 + rng() * 20, 130 + row * 30 + rng() * 40, col);
        }
        s += mist(560, '#bfe6b0', 0.15);
        break;
      case 'celestial':
        s += stars(rng, 160, VH * 0.8) + orb(300, 160, 40, '#f3d6ff', true) + orb(90, 260, 14, '#9fe3ff');
        for (let k = 0; k < 3; k++) {
          let d = '';
          let x = 40 + rng() * 300, y = 60 + rng() * 300;
          for (let i = 0; i < 5; i++) { d += (i ? 'L' : 'M') + x.toFixed(0) + ' ' + y.toFixed(0) + ' '; x += (rng() - 0.5) * 90; y += (rng() - 0.3) * 50; }
          s += `<path d="${d}" stroke="#e8d8ff" stroke-width="1" fill="none" opacity="0.45"/>`;
        }
        s += `<path d="M60 560 q80 -40 160 0 q-80 60 -160 0z" fill="${h1}"/><path d="M230 500 q70 -30 140 0 q-70 50 -140 0z" fill="${h2}"/>` + ridge(rng, 660, 20, 5, h3, 1);
        break;
      case 'dragon': {
        s += stars(rng, 50, 300, '#ffe9b0') + orb(290, 170, 28, '#ffe08a', true) + peaks(rng, 560, 240, 3, h1, 0.9);
        let d = 'M-20 300';
        for (let i = 0; i < 6; i++) d += ` Q${i * 80 + 20} ${i % 2 ? 230 : 370} ${i * 80 + 60} 300`;
        s += `<path d="${d}" stroke="#d9a12a" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.35"/><path d="${d}" stroke="#f2c14e" stroke-width="3" fill="none" stroke-dasharray="2 10" opacity="0.6"/>`;
        s += mist(560, '#f2c14e', 0.12) + ridge(rng, 640, 30, 5, h3, 1);
        break;
      }
    }
    return s;
  }

  const bgCache = new Map();
  function worldBackgroundSVG(wi) {
    if (bgCache.has(wi)) return bgCache.get(wi);
    const w = WORLDS[wi];
    const rng = srng(9001 + wi * 31);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid slice">` +
      `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w.sky[0]}"/><stop offset="0.55" stop-color="${w.sky[1]}"/><stop offset="1" stop-color="${w.sky[2]}"/></linearGradient>` +
      `<radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      `<filter id="blur" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="14"/></filter></defs>` +
      `<rect width="${VW}" height="${VH}" fill="url(#sky)"/>` + scene(w, rng) + '</svg>';
    bgCache.set(wi, svg);
    return svg;
  }
  function worldBackgroundURL(wi) {
    return 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(worldBackgroundSVG(wi)) + '")';
  }

  // Mini layout preview (world cards / level select) as inline SVG.
  function layoutPreviewSVG(tiles, accent) {
    const b = Core.layoutBounds(tiles);
    const s = tiles.slice().sort((p, q) => p.z - q.z || p.x - q.x || p.y - q.y);
    const hx = 6, hy = 8, d = 1.6;
    const W = b.spanX * hx + (b.maxZ + 1) * d + 2, H = b.spanY * hy + (b.maxZ + 1) * d + 2;
    let o = `<svg viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" xmlns="http://www.w3.org/2000/svg">`;
    for (const t of s) {
      const x = (t.x - b.minX) * hx - t.z * d + b.maxZ * d + 1, y = (t.y - b.minY) * hy - t.z * d + b.maxZ * d + 1;
      o += `<rect x="${(x + d).toFixed(1)}" y="${(y + d).toFixed(1)}" width="${2 * hx - 0.6}" height="${2 * hy - 0.6}" rx="1.6" fill="${accent}"/><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${2 * hx - 0.6}" height="${2 * hy - 0.6}" rx="1.6" fill="#fbf4e2" stroke="rgba(90,70,40,.35)" stroke-width=".5"/>`;
    }
    return o + '</svg>';
  }

  root.MJAssets = { TILE_ASPECT, DEPTH, tileMetrics, TileAtlas, paintTile, drawFace, tileDataURL, ICONS, WORLDS, worldBackgroundSVG, worldBackgroundURL, layoutPreviewSVG, rr };
}(typeof globalThis !== 'undefined' ? globalThis : this));
