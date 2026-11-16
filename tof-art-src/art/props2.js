  // ===== 3/4 bakış: sahne objeleri (2) =====
  var ut = (t, e, a, r, n, i = 0.7) => {
      for (let s = 0; s < 6.28; s += 0.4) m(t, e + Math.cos(s + n) * r, a + Math.sin(s + n) * r * 0.5, `rgba(230,245,250,${i})`);
    },
    on = (t, e) => {
      let a = parseInt(t.slice(1), 16);
      return `rgba(${a >> 16},${(a >> 8) & 255},${a & 255},${e})`;
    };
  N.rainbow = (t, e, a, r, n = {}) => {
    var l;
    let i = ["#e04040", "#f08a30", "#f2d040", "#5cc85c", "#4a9ae0", "#7a5ad8"],
      s = n.r || 240,
      o = (l = n.a) != null ? l : 0.35;
    for (let d = 0; d < i.length; d++) {
      t.fillStyle = on(i[d], o);
      for (let p = Math.PI * 1.05; p < Math.PI * 1.95; p += 0.004) t.fillRect(Math.round(e + Math.cos(p) * (s - d * 4)), Math.round(a + Math.sin(p) * (s - d * 4) * 0.55), 2, 4);
    }
  };
  N.aurora = (t, e, a, r, n = {}) => {
    let i = n.W || 640;
    for (let s = 0; s < 3; s++) {
      let o = ["#5af0a0", "#7ac8ff", "#c87aff"][s];
      for (let l = 0; l < i; l += 2) {
        let d = a + s * 16 + Math.sin(l * 0.02 + r * 0.6 + s) * 14 + Math.sin(l * 0.05 - r) * 4,
          p = 18 + Math.sin(l * 0.03 + r + s) * 8;
        (t.fillStyle = on(o, 0.12 + 0.06 * Math.sin(r * 2 + l * 0.04))), t.fillRect(l, Math.round(d), 2, Math.round(p));
      }
    }
  };
  N.stars = (t, e, a, r, n = {}) => {
    let i = n.W || 640,
      s = n.H || 220;
    for (let o = 0; o < (n.n || 70); o++) {
      let l = ee(o, 31) * i,
        d = ee(o, 32) * s,
        p = Math.sin(r * 3 + o * 1.7);
      p > -0.2 && m(t, l, d, p > 0.7 ? "#ffffff" : "#c8d8ff"), p > 0.92 && (m(t, l - 1, d, "#c8d8ff"), m(t, l + 1, d, "#c8d8ff"), m(t, l, d - 1, "#c8d8ff"), m(t, l, d + 1, "#c8d8ff"));
    }
    if (n.lines) {
      let o = n.lines.map(([l, d]) => ({ x: e + l, y: a + d }));
      for (let l = 1; l < o.length; l++) (t.globalAlpha = 0.35 + 0.25 * Math.sin(r * 2)), ce(t, o[l - 1].x, o[l - 1].y, o[l].x, o[l].y, "#f2e080"), (t.globalAlpha = 1);
      for (let l of o) H(t, l.x, l.y, 2, "#fff6c0"), m(t, l.x, l.y, "#ffffff");
    }
  };
  N.moon = (t, e, a, r) => {
    for (let n = 0; n < 26; n++) {
      let i = a - 40 + n * 3.2,
        s = 4 + Math.sin(n * 0.9 + r * 2) * 3 + (13 - Math.abs(n - 13)) * 0.9;
      (t.fillStyle = `rgba(240,240,210,${0.18 + 0.12 * Math.sin(r * 3 + n)})`), t.fillRect(Math.round(e - s / 2 + Math.sin(r + n) * 2), Math.round(i), Math.round(s), 1);
    }
    H(t, e, a - 56, 11, "rgba(250,250,225,0.14)"), H(t, e, a - 56, 7, "rgba(250,250,225,0.22)");
  };
  N.birds = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 7); i++) {
      let s = r * (0.6 + (i % 3) * 0.1) + i * 0.9,
        o = e + Math.cos(s) * (30 + (i % 4) * 9),
        l = a + Math.sin(s) * (14 + (i % 3) * 5),
        d = Math.sin(r * 10 + i) > 0,
        dx = -Math.sin(s) > 0 ? 1 : -1;
      (t.fillStyle = "rgba(0,0,0,0.16)"), t.fillRect(Math.round(o - 2), Math.round(l + 14), 5, 1);
      Q(t, o - 1, o + 1, l, "#f4f4f0"), m(t, o + dx * 2, l, "#e8a040"), m(t, o - dx * 2, l, "#9aa4ae");
      d ? (Q(t, o - 3, o - 2, l - 2, "#c8ccd4"), Q(t, o + 2, o + 3, l - 2, "#c8ccd4"), m(t, o - 1, l - 1, "#f4f4f0"), m(t, o + 1, l - 1, "#f4f4f0")) : (Q(t, o - 3, o - 2, l + 1, "#c8ccd4"), Q(t, o + 2, o + 3, l + 1, "#c8ccd4"));
    }
  };
  N.sparkles = (t, e, a, r, n = {}) => {
    let i = n.r || 60;
    for (let s = 0; s < (n.n || 26); s++) {
      let o = ee(s, 41) * 6.28 + r * 0.3,
        l = ee(s, 42) * i,
        d = Math.sin(r * 4 + s * 2.1);
      if (d > 0.2) {
        let p = e + Math.cos(o) * l,
          f = a + Math.sin(o) * l * 0.6 - ((r * 6 + s * 5) % 22);
        m(t, p, f, n.col || "#fff6c0"), d > 0.85 && (m(t, p - 1, f, n.col || "#fff6c0"), m(t, p + 1, f, n.col || "#fff6c0"), m(t, p, f - 1, n.col || "#fff6c0"), m(t, p, f + 1, n.col || "#fff6c0"));
      }
    }
  };
  N.glowRing = (t, e, a, r, n = {}) => {
    let i = n.col || "#a0ffd0";
    for (let s = 0; s < 3; s++) {
      let o = ((r * 22 + s * 14) % 42) + 4;
      t.globalAlpha = Math.max(0, 1 - o / 46) * 0.8;
      for (let l = 0; l < 6.28; l += 0.1) m(t, e + Math.cos(l) * o, a + Math.sin(l) * o * 0.55, i);
    }
    t.globalAlpha = 1;
  };
  N.glowPatch = (t, e, a, r, n = {}) => {
    let i = n.cols || ["#5af0c0", "#c87aff", "#f2e060", "#5ab8ff"];
    for (let s = 0; s < (n.n || 9); s++) {
      let o = e + (ee(s, 51) - 0.5) * (n.w || 260),
        l = a + (ee(s, 52) - 0.5) * (n.h || 220) + ((r * 8) % 40),
        d = 10 + ee(s, 53) * 16 + Math.sin(r * 1.5 + s) * 3;
      ve(t, o, l, d, d * 0.5, on(i[(s + Math.floor(r * 0.5)) % i.length], 0.18)), ve(t, o, l, d * 0.5, d * 0.25, on(i[(s + Math.floor(r * 0.5)) % i.length], 0.14));
    }
  };
  N.mist = (t, e, a, r, n = {}) => {
    var s;
    let i = n.col || "#a8c890";
    for (let o = 0; o < 10; o++) {
      let l = e + (ee(o, 61) - 0.5) * (n.r || 120) * 2 + Math.sin(r * 0.4 + o) * 10,
        d = a + (ee(o, 62) - 0.5) * (n.r || 120);
      ve(t, l, d, (n.r || 120) * 0.32, (n.r || 120) * 0.2, on(i, (s = n.a) != null ? s : 0.16));
    }
  };
  N.lightBeam = (t, e, a, r, n = {}) => {
    let i = r * (n.speed || 0.8);
    for (let s = 0; s < 2; s++) {
      let o = i + s * Math.PI;
      for (let l = 6; l < (n.len || 160); l += 2) {
        let d = l * 0.12;
        (t.fillStyle = `rgba(255,240,170,${0.22 * (1 - l / (n.len || 160))})`), t.fillRect(Math.round(e + Math.cos(o) * l - d / 2), Math.round(a + Math.sin(o) * l * 0.6 - d / 2), Math.ceil(d), Math.ceil(d * 0.7));
      }
    }
  };
  N.bubbles = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 14); i++) {
      let s = e + (ee(i, 71) - 0.5) * (n.w || 40),
        o = (r * (0.6 + ee(i, 72)) + ee(i, 73)) % 1,
        l = a + (n.h || 20) * (0.5 - o);
      o < 0.85 ? (m(t, s, l, "#e8f8ff"), i % 3 === 0 && (m(t, s + 1, l, "#bfe3ef"), m(t, s, l - 1, "#bfe3ef"), m(t, s + 1, l - 1, "#ffffff"))) : (m(t, s - 1, l, "rgba(235,248,252,0.7)"), m(t, s + 1, l, "rgba(235,248,252,0.7)"));
    }
  };
  N.sunkenCity = (t, e, a, r, n = {}) => {
    var o;
    let i = (o = n.a) != null ? o : 0.35;
    t.globalAlpha = i;
    let s = n.w || 200,
      L = [];
    for (let l = 0; l < 9; l++) L.push({ l, x: e - s / 2 + (l * s) / 9 + Math.sin(r * 0.8 + l) * 1.5, y: a + (ee(l, 81) - 0.5) * 90 });
    L.sort((p, q) => p.y - q.y);
    for (let k of L) {
      let d = Math.round(k.x),
        p = Math.round(k.y),
        f = k.l % 3;
      if (f === 0) {
        // sütun
        b(t, d, p - 22, 8, 26, "#1f5a6a"), Te(t, d, p - 22, p + 3, "#3a8a9a"), b(t, d - 1, p - 24, 10, 3, "#3a8a9a"), b(t, d - 1, p + 3, 10, 2, "#164a58"), Te(t, d + 4, p - 20, p + 2, "#2a6a7a");
      } else if (f === 1) {
        // kubbe
        for (let q = 0; q < 10; q++) Q(t, d + 6 - Math.round(Math.sqrt(100 - (10 - q) * (10 - q))), d + 6 + Math.round(Math.sqrt(100 - (10 - q) * (10 - q))), p - 14 + q, q < 3 ? "#3a8a9a" : "#2a6a7a");
        b(t, d - 4, p - 4, 21, 8, "#1f5a6a"), b(t, d + 4, p - 1, 4, 5, "#0e3a48"), m(t, d + 6, p - 16, "#5ab0c0");
      } else {
        // sıra sütunlu yapı
        b(t, d - 5, p - 10, 24, 3, "#3a8a9a");
        for (let y = 0; y < 5; y++) b(t, d - 4 + y * 5, p - 7, 2, 12, "#2a6a7a");
        b(t, d - 6, p + 5, 26, 2, "#164a58");
        for (let q = 0; q < 4; q++) Q(t, d - 3 + q * 2, d + 17 - q * 2, p - 11 - q, "#2a6a7a");
      }
    }
    (t.globalAlpha = 1), N.bubbles(t, e, a - 10, r, { n: 10, w: s, h: 60 });
  };
  N.net = (t, e, a, r, n = {}) => {
    let i = n.r || 18,
      k = 0.6;
    ut(t, e, a, i + 3, r), (t.globalAlpha = 0.85);
    for (let s = -i; s <= i; s += 4) {
      let hh = Math.sqrt(Math.max(0, i * i - s * s)) * k;
      ce(t, e + s, a - hh, e + s * 0.85, a + hh, "#d8c8a0"), ce(t, e - Math.sqrt(Math.max(0, i * i - (s / k) * (s / k) * k * k)), a + s * k, e + Math.sqrt(Math.max(0, i * i - s * s)), a + s * k * 0.9, "#d8c8a0");
    }
    t.globalAlpha = 1;
    for (let s = 0; s < (n.fish || 0); s++) {
      let o = e + (ee(s, 91) - 0.5) * i * 1.3,
        l = a + (ee(s, 92) - 0.5) * i * k * 1.3 + Math.sin(r * 9 + s) * 1.5;
      Q(t, o, o + 3, l, "#c8e0ea"), m(t, o + 4, l - 1, "#7aa0b4"), m(t, o + 4, l + 1, "#7aa0b4"), m(t, o, l, "#3a3a42"), m(t, o + 1, l - 1, "#ffffff");
    }
    for (let s = 0; s < 6.28; s += 0.45) {
      let x = e + Math.cos(s) * i,
        y = a + Math.sin(s) * i * k + Math.sin(r * 2 + s) * 0.6;
      b(t, x - 1, y - 2, 3, 3, "#c8423b"), m(t, x - 1, y - 2, "#f08070"), m(t, x, y + 1, "rgba(235,248,252,0.8)");
    }
  };
  N.wreck = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 9); i++) {
      let s = (ee(i, 101) - 0.5) * (n.w || 120),
        o = (ee(i, 102) - 0.5) * (n.h || 90) * 0.8 + Math.sin(r * 1.3 + i),
        l = (ee(i, 103) - 0.5) * 1.4,
        d = 10 + (i % 4) * 5,
        p = (Math.cos(l) * d) / 2,
        f = (Math.sin(l) * d) / 4;
      ut(t, e + s, a + o + 1, d * 0.5, r * 0.7, 0.45), ce(t, e + s - p, a + o - f + 1, e + s + p, a + o + f + 1, "#2a1608"), ce(t, e + s - p, a + o - f, e + s + p, a + o + f, i % 3 ? "#8a5a2b" : "#5c3a1e"), ce(t, e + s - p, a + o - f - 1, e + s + p, a + o + f - 1, i % 3 ? "#b07a42" : "#8a5a2b");
    }
    // sudan çıkan yatık gövde parçası + kırık direk
    let y = Math.round(a + Math.sin(r));
    ut(t, e - 8, y + 4, 22, r * 0.5, 0.55);
    for (let i = 0; i < 12; i++) {
      let w = Math.round(18 - i * 1.1);
      Q(t, e - 26 + i, e - 26 + i + w, y + 2 - i, i % 3 === 0 ? "#3a2412" : i < 3 ? "#4a2e18" : "#6a4424"), m(t, e - 26 + i, y + 2 - i, "#8a5a2b");
    }
    for (let i = 0; i < 5; i++) Te(t, e - 22 + i * 4, y - 12 + i, y - 8 + i, "#c8a070");
    ce(t, e - 12, y, e + 12, y - 26, "#3a2412"), ce(t, e - 11, y, e + 13, y - 26, "#6a4424"), ce(t, e + 4, y - 18, e + 14, y - 14, "#5c3a1e");
    for (let i = 0; i < 8; i++) Q(t, e + 2 + i, e + 12 + (i % 3), y - 20 + i * 1.5, i % 2 ? "#d8ccb0" : "#c8b898");
    wLine(t, e - 10, y + 4, 18, r);
    if (n.barrels) for (let i = 0; i < n.barrels; i++) N.barrel(t, e + 40 - i * 18, a + 26 + (i % 2) * 8, r + i);
  };
  N.tavern = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 0.9));
    ut(t, e, y + 12, 38, r * 0.5, 0.5);
    // yüzen platform
    b(t, e - 34, y - 10, 68, 30, "#3a2412");
    for (let n = 0; n < 11; n++) b(t, e - 33 + n * 6, y - 9, 6, 28, n % 2 ? "#8a5a2b" : "#7a4a24"), Te(t, e - 33 + n * 6, y - 9, y + 18, "#a06a34");
    b(t, e - 34, y + 20, 68, 5, "#4a2e18"), Q(t, e - 34, e + 33, y + 20, "#2a1608"), Q(t, e - 34, e + 33, y + 24, "#2a1608");
    for (let n = 0; n < 9; n++) H(t, e - 30 + n * 8, y + 25, 2, n % 2 ? "#6a4424" : "#8a5a2b");
    // meyhane kulübesi
    hut(t, e - 22, y - 2, 30, 14, "#b07a42", "#8a3a2a", { rh: 12, win: !0, lit: !0, seed: 1 });
    b(t, e - 4, y - 30, 3, 6, "#5a5a62"), N.smoke(t, e - 3, y - 32, r, { n: 5, h: 22, drift: 8 });
    b(t, e - 16, y - 20, 12, 5, "#3a2412"), b(t, e - 15, y - 19, 10, 3, "#e8c45a"), m(t, e - 12, y - 18, "#3a2412"), m(t, e - 9, y - 18, "#3a2412");
    // masa, fıçılar, fenerler
    b(t, e + 12, y + 4, 14, 5, "#5c3a1e"), Q(t, e + 12, e + 25, y + 4, "#a87a4a"), b(t, e + 13, y + 9, 2, 4, "#3a2412"), b(t, e + 23, y + 9, 2, 4, "#3a2412"), b(t, e + 16, y + 2, 2, 3, "#f2c14e"), b(t, e + 20, y + 2, 2, 3, "#f4ead5");
    dS(t, deckBarrel("#8a5a2b"), e + 29, y + 1), dS(t, deckBarrel("#7a4a34"), e - 29, y + 16);
    for (let n = 0; n < 7; n++) {
      let i = e - 30 + n * 10,
        s = y - 12 + Math.sin(n) * 2;
      n > 3 && (m(t, i, s, Math.sin(r * 4 + n) > -0.3 ? "#ffd060" : "#c88a30"), H(t, i, s, 3, "rgba(255,200,90,0.12)"));
    }
    dS(t, ha("pirate", "right", "sit"), e + 9, y + 12), dS(t, ha("oldSailor", "left", "sit"), e + 30, y + 13), wLine(t, e, y + 26, 34, r);
  };
  N.merchantBoat = (t, e, a, r, n = {}) => {
    let y = Math.round(a + Math.sin(r * 1.6));
    ut(t, e, y + 12, 20, r), boatHull(t, e, y, 38, 10, "up", "#9a6230", "#5c3a1e");
    boatSeat(t, n.npc || "merchant", e, y - 6, "down");
    (n.goods || ["GOOD_SPICE", "GOOD_SILK", "GOOD_WINE"]).slice(0, 3).forEach((s, o) => dS(t, Ca(s), e - 5 + (o % 2) * 10 - (o === 2 ? 5 : 0), y + 4 + Math.floor(o / 2) * 8 + (o === 2 ? 0 : 0)));
    // tente direği + flama
    Te(t, e - 8, y - 26, y - 8, "#5c3a1e"), Te(t, e + 8, y - 26, y - 8, "#5c3a1e");
    for (let s = 0; s < 4; s++) Q(t, e - 10, e + 10, y - 29 + s, s % 2 ? "#e07b39" : "#f4ead5");
    Q(t, e - 10, e + 10, y - 25, "#a8501e"), wLine(t, e, y + 24, 10, r);
  };
  N.smoke = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 14); i++) {
      let s = (r * 0.25 + i / (n.n || 14)) % 1,
        o = e + Math.sin(s * 6 + i) * 6 + s * (n.drift || 30),
        l = a - s * (n.h || 70);
      H(t, o, l, 3 + s * 9, `rgba(70,66,70,${0.45 * (1 - s)})`), s < 0.6 && H(t, o - 1, l - 1, 1 + s * 5, `rgba(110,104,108,${0.3 * (1 - s)})`);
    }
  };
  N.lava = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 8); i++) {
      let s = e + (ee(i, 111) - 0.5) * (n.w || 200),
        o = a + (ee(i, 112) - 0.5) * (n.h || 160),
        l = 6 + ee(i, 113) * 10;
      ve(t, s, o, l + 3, (l + 3) * 0.5, "rgba(60,20,10,0.6)"), ve(t, s, o, l, l * 0.5, Math.sin(r * 2 + i) > 0 ? "#e0502a" : "#c83a1e"), ve(t, s, o, l * 0.5, l * 0.25, "#f08030"), m(t, s, o, "#fff0a0");
      Math.sin(r * 3 + i * 2) > 0.8 && (H(t, s + 2, o - 5, 2, "rgba(200,200,200,0.5)"), m(t, s - 1, o - 3 - ((r * 8) % 4), "#ffb040"));
    }
  };
  N.volcano = (t, e, a, r, n = {}) => {
    let i = n.r || 50,
      h = Math.round(i * 0.95),
      by = a + Math.round(i * 0.3);
    ve(t, e, by, i + 8, (i + 8) * 0.42, "rgba(120,80,70,0.45)"), ve(t, e, by, i + 2, (i + 2) * 0.4, "#2a2224");
    for (let y = 0; y <= h; y++) {
      let q = y / h,
        w = Math.round(i * (0.24 + 0.76 * Math.pow(q, 0.8)));
      for (let x = -w; x <= w; x++) {
        let f = x / w,
          c = f < -0.35 ? "#5a4a48" : f < 0.3 ? "#4a3a38" : "#33282a";
        ee(x, y, 9) > 0.86 && (c = "#2a2022"), m(t, e + x, by - h + y, c);
      }
    }
    // krater + lav akıntıları
    let cy = by - h;
    ve(t, e, cy, Math.round(i * 0.24), 3, "#1a1012"), ve(t, e, cy, Math.round(i * 0.18), 2, Math.sin(r * 3) > 0 ? "#f08030" : "#e0502a"), m(t, e, cy, "#fff0a0");
    for (let s = 0; s < 4; s++) {
      let x = e + (s - 1.5) * i * 0.12,
        dx = (s - 1.5) * 0.35;
      for (let y = 1; y < h * (0.5 + ee(s, 3) * 0.4); y++) m(t, x + dx * y + Math.sin(y * 0.4 + s) * 1.5, cy + y, (y + Math.floor(r * 6)) % 5 === 0 ? "#fff0a0" : y % 2 ? "#e0502a" : "#c83a1e");
    }
    H(t, e, cy - 2, Math.round(i * 0.3), `rgba(255,140,60,${0.12 + 0.05 * Math.sin(r * 4)})`), N.smoke(t, e, cy - 4, r, { n: 16, h: 90, drift: 26 });
    for (let x = -i; x <= i; x += 2) Math.sin(x * 0.7 + r * 2) > 0 && m(t, e + x, by + Math.round(Math.sqrt(Math.max(0, 1 - (x * x) / (i * i))) * i * 0.4), "rgba(235,248,252,0.8)");
  };
  N.tsunami = (t, e, a, r, n = {}) => {
    let i = n.W || 640;
    for (let s = -40; s < i + 40; s++) {
      let o = 52 + Math.sin(s * 0.03 + r * 2) * 8 + Math.sin(s * 0.11 - r * 3) * 3;
      for (let l = 0; l < o; l++) {
        let d = l < 4 ? "#ffffff" : l < 10 ? "#d8eef4" : l < o * 0.4 ? "#5aa6c8" : l < o * 0.7 ? "#2f78a6" : l < o * 0.9 ? "#1f5a82" : "#164a6c";
        (l > 4 && (s * 3 + l) % 7 === 0 && l < 20) || m(t, s, a - o + l, d);
        l > o * 0.4 && (s + l * 2) % 23 === 0 && m(t, s, a - o + l, "rgba(200,230,240,0.5)");
      }
      Math.sin(s * 0.4 + r * 6) > 0.6 && (m(t, s, a - o - 3, "#ffffff"), m(t, s + 1, a - o - 6, "#e8f6fb"));
    }
  };
  N.iceFloes = (t, e, a, r, n = {}) => {
    let L = [];
    for (let i = 0; i < (n.n || 14); i++) L.push({ x: e + (ee(i, 121) - 0.5) * (n.w || 300), y: a + (ee(i, 122) - 0.5) * (n.h || 260), l: 5 + ee(i, 123) * 12 });
    L.sort((p, q) => p.y - q.y);
    for (let k of L) {
      let s = k.x,
        o = k.y + Math.sin(r + k.x) * 0.6,
        l = k.l;
      ve(t, s, o + 3, l + 1, l * 0.5, "rgba(120,190,220,0.4)"), ve(t, s, o + 2, l, l * 0.5, "#7aa8c8"), ve(t, s, o, l, l * 0.5, "#e8f4fa"), ve(t, s - l * 0.2, o - l * 0.12, l * 0.55, l * 0.22, "#ffffff"), m(t, s + l * 0.4, o + l * 0.1, "#c0dcec");
    }
  };
  N.buoyLight = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.8)),
      lit = Math.sin(r * 4) > 0;
    ut(t, e, a + 2, 7, r), b(t, e - 3, y - 5, 7, 6, "#8a2a26"), b(t, e - 3, y - 5, 7, 2, "#c8423b"), Q(t, e - 3, e + 3, y - 2, "#f4ead5"), Te(t, e, y - 12, y - 5, "#3a3a44"), b(t, e - 1, y - 15, 3, 3, lit ? "#ffe0a0" : "#8a4a40");
    lit && H(t, e, y - 14, 8, "rgba(255,90,60,0.22)"), wLine(t, e, y + 1, 5, r);
  };
  N.lantern = (t, e, a, r) => {
    H(t, e, a - 5, 11, `rgba(255,210,120,${0.12 + 0.06 * Math.sin(r * 5)})`), b(t, e - 2, a - 1, 5, 2, "#2a1a10"), b(t, e - 2, a - 8, 5, 7, "#3a2a1a"), b(t, e - 1, a - 7, 3, 5, Math.sin(r * 7) > -0.4 ? "#ffd060" : "#f0a030");
    m(t, e, a - 5, "#fff6c0"), b(t, e - 1, a - 10, 3, 2, "#3a2a1a"), m(t, e, a - 11, "#5a4a3a");
  };
  N.cave = (t, e, a, r, n = {}) => {
    let i = n.r || 50;
    N.island(t, e, a, r, { r: i, palms: 2, ground: "#6a7a62" });
    // kayalık tepe ve bize bakan mağara ağzı
    let h = Math.round(i * 0.55),
      w = Math.round(i * 0.5),
      by = a + 2;
    for (let y = 0; y <= h; y++) {
      let q = y / h,
        ww = Math.round(w * (0.4 + 0.6 * Math.sin(q * Math.PI * 0.5)));
      for (let x = -ww; x <= ww; x++) m(t, e + x, by - h + y, x / ww < -0.3 ? "#9a9a92" : x / ww < 0.4 ? "#7a7a72" : "#5a5a54");
    }
    ve(t, e - w * 0.2, by - h + 2, w * 0.4, 2, "#b8b8ae");
    for (let y = 0; y < 13; y++) {
      let ww = Math.round(9 * Math.sqrt(1 - Math.pow((12 - y) / 13, 2)));
      Q(t, e - 3 - ww, e - 3 + ww, by - 12 + y, y < 2 ? "#1a1a1e" : "#0a0a10");
    }
    n.glint && Math.sin(r * 3) > 0.4 && (m(t, e - 4, by - 4, "#f2c14e"), m(t, e - 3, by - 5, "#fff6c0"), m(t, e - 1, by - 3, "#f2c14e"));
  };
  N.treasureIsle = (t, e, a, r, n = {}) => {
    N.island(t, e, a, r, { r: n.r || 54, palms: 5 });
    ce(t, e - 5, a - 4, e + 5, a + 2, "#c8423b"), ce(t, e + 5, a - 4, e - 5, a + 2, "#c8423b");
    n.dug && (ve(t, e, a, 8, 4, "#5a3a1e"), ve(t, e, a + 1, 6, 2, "#2a1a0c"), ve(t, e + 11, a + 2, 5, 2, "#8a6a40"), ve(t, e + 11, a + 1, 4, 2, "#a88454"));
    n.chest && (dS(t, Ca("GOOD_GOLD_BAR"), e, a + 1), Math.sin(r * 4) > 0 && (m(t, e - 7, a - 12, "#fff6c0"), m(t, e + 7, a - 10, "#fff6c0")));
  };
  N.temple = (t, e, a, r, n = {}) => {
    N.island(t, e, a, r, { r: n.r || 56, palms: 2, ground: "#5a6a52" });
    let y = a + 4;
    // basamaklar + sütunlu cephe + üçgen alınlık
    b(t, e - 20, y - 3, 40, 4, "#8a8a7e"), Q(t, e - 20, e + 19, y - 3, "#c8c0b0"), b(t, e - 18, y - 6, 36, 3, "#9a9a8e"), Q(t, e - 18, e + 17, y - 6, "#d0c8b8");
    b(t, e - 16, y - 22, 32, 16, "#6a6a62");
    for (let i = 0; i < 5; i++) b(t, e - 15 + i * 7, y - 22, 3, 16, "#d0c8b8"), Te(t, e - 13 + i * 7, y - 22, y - 7, "#9a927e");
    b(t, e - 4, y - 16, 8, 10, "#2a1a30"), H(t, e, y - 11, 2, Math.sin(r * 3) > 0 ? "#c8a0ff" : "#8af0ff");
    b(t, e - 18, y - 25, 36, 3, "#b8b0a0"), Q(t, e - 18, e + 17, y - 25, "#e0d8c8");
    for (let i = 0; i < 8; i++) Q(t, e - 16 + i * 2, e + 15 - i * 2, y - 26 - i, i === 7 ? "#e0d8c8" : "#a8a090");
    m(t, e, y - 30, "#f2c14e"), m(t, e - 12, y - 14, "#5a8a4a"), m(t, e + 9, y - 19, "#5a8a4a");
    n.glow && N.glowRing(t, e, y - 8, r, { col: "#c8a0ff" });
  };
  N.whale = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 0.8) * 2);
    ut(t, e, y + 2, 28, r * 0.6, 0.5);
    // sırt kamburu
    for (let x = -22; x <= 22; x++) {
      let h = Math.round(9 * Math.sqrt(Math.max(0, 1 - (x * x) / 500)));
      if (h < 1) continue;
      Te(t, e + x, y - h, y, "#3a5a72"), m(t, e + x, y - h, "#5a7a92"), h > 4 && m(t, e + x, y - 1, "#2a4a62"), h > 3 && (x + 30) % 6 === 0 && m(t, e + x, y - h + 2, "#6a8aa0");
    }
    m(t, e - 12, y - 5, "#101010"), m(t, e - 13, y - 5, "#a8c0d0");
    // kuyruk
    let ty = y - 4 + Math.round(Math.sin(r * 1.2) * 3);
    b(t, e + 26, ty - 4, 3, 8, "#3a5a72"), ce(t, e + 27, ty - 4, e + 20, ty - 11, "#3a5a72"), ce(t, e + 27, ty - 4, e + 34, ty - 11, "#3a5a72"), ce(t, e + 27, ty - 5, e + 21, ty - 11, "#5a7a92"), ce(t, e + 28, ty - 5, e + 33, ty - 11, "#2a4a62");
    ut(t, e + 27, y + 2, 6, r, 0.7);
    // fıskiye
    if (Math.sin(r * 1.5) > 0.3)
      for (let n = 0; n < 14; n++) {
        let q = n / 14;
        m(t, e - 6 + Math.sin(n * 2) * (1 + q * 5), y - 10 - n * 1.6, "#e8f6fb"), n > 8 && m(t, e - 6 + Math.cos(n * 3) * 6, y - 22 - (n % 3), "#bfe3ef");
      }
    wLine(t, e, y + 1, 22, r);
  };
  N.dolphins = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 4); i++) {
      let s = (r * 0.7 + i * 0.27) % 1,
        o = e + (i - 1.5) * 14,
        l = a + 30 - s * 80;
      if (s > 0.2 && s < 0.8) {
        let q = (s - 0.2) / 0.6,
          h = Math.sin(q * Math.PI) * 11,
          yy = l - h;
        (t.fillStyle = "rgba(10,30,50,0.2)"), t.fillRect(Math.round(o - 3), Math.round(l + 1), 7, 1);
        b(t, o - 2, yy - 4, 4, 9, "#5a7a92"), Te(t, o - 2, yy - 3, yy + 3, "#8aa0b4"), m(t, o, yy - 5, "#5a7a92"), m(t, o + 2, yy - 1, "#3a5a72"), m(t, o - 1, yy + 5, "#3a5a72"), m(t, o + 1, yy + 5, "#3a5a72"), Te(t, o + 1, yy - 2, yy + 3, "#d8e4ec");
      } else ut(t, o, l, 4, r, 0.6), m(t, o, l - 2, "#ffffff");
    }
  };
  N.spray = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 30); i++) {
      let s = (r * 1.6 + ee(i, 131)) % 1,
        o = e + (ee(i, 132) - 0.5) * (n.w || 120),
        l = a - s * 20 + (ee(i, 133) - 0.5) * (n.h || 30);
      m(t, o, l, s < 0.5 ? "#ffffff" : "#bfe3ef");
    }
  };
  N.cloudShadow = (t, e, a, r, n = {}) => {
    var i;
    for (let s = 0; s < 6; s++) ve(t, e + (ee(s, 141) - 0.5) * 120, a + (ee(s, 142) - 0.5) * 50, 28, 17, `rgba(10,20,35,${(i = n.a) != null ? i : 0.18})`);
  };
  N.figure = (t, e, a, r, n = {}) => dS(t, ha(n.npc || "sailor", n.dir || "down", n.state || "idle", Math.floor(r * 6) % 4), e, a + 2);
  N.petFig = (t, e, a, r, n = {}) => dS(t, pa(n.id || "PET_TARCIN", n.dir || "down", n.pose || "sit"), e, a + 2);
  N.rowboat = (t, e, a, r, n = {}) => {
    let dir = n.dir || "up",
      y = Math.round(a + Math.sin(r * 1.8)),
      npcs = (n.npcs || ["sailor"]).slice(0, 2),
      s = Math.sin(r * 6) * 3,
      vert = dir === "up" || dir === "down";
    if (vert) {
      ut(t, e, y + 6, 15, r), boatHull(t, e, y, 32, 8, dir);
      // kürekler
      ce(t, e - 7, y, e - 17, y + 1 + s, "#c8a070"), ce(t, e + 7, y, e + 17, y + 1 - s, "#c8a070"), b(t, e - 19, y + s, 3, 2, "#a87a4a"), b(t, e + 17, y - s, 3, 2, "#a87a4a");
      let L = [];
      npcs.forEach((o, l) => L.push({ y: y - 6 + l * 11, fn: (yy) => boatSeat(t, o, e, yy + 5, dir) }));
      n.cargo && n.cargo.slice(0, 2).forEach((o, l) => L.push({ y: y + (npcs.length > 1 ? 9 : 3) + l * 3 - (dir === "down" ? 16 : 0), fn: (yy) => dS(t, Ca(o), e - 3 + l * 6, yy + 6) }));
      L.sort((p, q) => p.y - q.y);
      for (let o of L) o.fn(o.y);
      // yakın küpeşte (bacakları örter)
      for (let i = 28; i < 32; i++) {
        let j = dir === "up" ? i : 31 - i,
          w = Math.round(Math.min(8, 1 + j * 0.7, (32 - j) * 0.9 + 1.5));
        Q(t, e - w, e + w, y - 16 + i, "#5c3a1e");
      }
      wLine(t, e, y + 21, 9, r);
    } else {
      let sg = dir === "right" ? 1 : -1;
      ut(t, e, y + 6, 19, r), boatHull(t, e, y, 34, 7, dir);
      ce(t, e - sg * 2, y - 4, e - sg * 2 - s, y - 11, "#c8a070");
      npcs.forEach((o, l) => boatSeat(t, o, e + sg * (6 - l * 12), y + 6, dir));
      n.cargo && n.cargo.slice(0, 2).forEach((o, l) => dS(t, Ca(o), e - sg * (8 + l * 5), y + 5));
      Q(t, e - 15, e + 15, y + 7, "#8a5a2b"), Q(t, e - 15, e + 15, y + 8, "#5c3a1e");
      ce(t, e + sg * 1, y + 5, e + sg * 1 + s, y + 14, "#c8a070"), b(t, e + sg * 1 + s - 1, y + 14, 3, 2, "#a87a4a");
      wLine(t, e, y + 12, 17, r);
    }
  };
  N.reef = (t, e, a, r, n = {}) => {
    let L = [];
    for (let i = 0; i < (n.n || 12); i++) L.push({ x: e + (ee(i, 151) - 0.5) * (n.w || 160), y: a + (ee(i, 152) - 0.5) * (n.h || 90), l: 3 + ee(i, 153) * 5 });
    L.sort((p, q) => p.y - q.y);
    for (let k of L) ut(t, k.x, k.y + 1, k.l + 3, r * 0.5, 0.4), rock(t, Math.round(k.x), Math.round(k.y), Math.round(k.l), "#565660"), wLine(t, k.x, k.y + 1, k.l, r);
  };
  N.puddle = (t, e, a, r, n = {}) => {
    let i = n.r || 10;
    if ((ve(t, e, a, i, i * 0.5, "rgba(90,170,220,0.45)"), ve(t, e - 1, a - 1, i * 0.6, i * 0.25, "rgba(150,210,240,0.4)"), m(t, e - i * 0.4, a - 1, "rgba(230,250,255,0.8)"), n.jet))
      for (let s = 0; s < 8; s++) m(t, e + Math.sin(r * 9 + s) * 2, a - 2 - ((r * 20 + s * 3) % 12), "#bfe3ef");
  };
  N.fishPile = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 8); i++) {
      let s = e + (ee(i, 161) - 0.5) * 16,
        o = a + (ee(i, 162) - 0.5) * 7 - Math.floor(i / 4) * 2,
        l = Math.sin(r * 12 + i * 3) > 0.7 ? -1 : 0;
      Q(t, s, s + 3, o + l, "#c8e0ea"), Q(t, s, s + 3, o + l + 1, "#8ab0c4"), m(t, s + 4, o + l, "#7aa0b4"), m(t, s + 4, o + l + 1, "#7aa0b4"), m(t, s, o + l, "#3a3a42"), m(t, s + 1, o + l, "#ffffff");
    }
  };
  N.cauldron = (t, e, a, r) => {
    m(t, e - 3, a + 1, Math.sin(r * 9) > 0 ? "#ffb040" : "#e05020"), m(t, e, a + 1, Math.sin(r * 7) > 0 ? "#fff0a0" : "#ffb040"), m(t, e + 3, a + 1, Math.sin(r * 8) > 0 ? "#e05020" : "#ffb040"), Q(t, e - 4, e + 4, a + 2, "#3a2412");
    b(t, e - 5, a - 7, 11, 8, "#2a2a2e"), b(t, e - 4, a - 6, 9, 6, "#4a4a56"), Te(t, e - 4, a - 6, a - 1, "#6a6a76"), b(t, e - 6, a - 9, 13, 2, "#3a3a44"), b(t, e - 4, a - 9, 9, 1, "#c8a050"), m(t, e - 2, a - 9, "#e8c878");
    for (let n = 0; n < 3; n++) m(t, e - 2 + n * 2, a - 11 - ((r * 8 + n * 3) % 7), "rgba(240,240,240,0.7)");
  };
  N.dice = (t, e, a, r) => {
    b(t, e - 7, a - 6, 14, 6, "#8a5a2b"), Q(t, e - 7, e + 6, a - 6, "#b07a42"), b(t, e - 7, a, 14, 3, "#5c3a1e"), Te(t, e - 6, a + 3, a + 4, "#3a2412"), Te(t, e + 5, a + 3, a + 4, "#3a2412");
    for (let [n, i] of [
      [-4, 0],
      [2, 1],
    ]) {
      let s = (Math.floor(r * 6 + i) % 6) + 1;
      b(t, e + n - 1, a - 8 - (Math.sin(r * 6 + i) > 0.6 ? 2 : 0), 4, 4, "#f4f0e0"), Q(t, e + n - 1, e + n + 2, a - 5 - (Math.sin(r * 6 + i) > 0.6 ? 2 : 0), "#c8c0a8"), m(t, e + n, a - 7, s > 3 ? "#1a1a1a" : "#c8423b"), s % 2 === 0 && m(t, e + n + 1, a - 6, "#1a1a1a");
    }
  };
  N.idolDeck = (t, e, a, r) => {
    H(t, e, a - 6, 9, `rgba(242,193,78,${0.15 + 0.1 * Math.sin(r * 3)})`), (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e - 4, a, 9, 2), N.idol(t, e, a + 1, r);
  };
  N.medallion = (t, e, a, r) => {
    let y = a - 6 + Math.round(Math.sin(r * 2));
    H(t, e, y, 9, `rgba(160,255,210,${0.15 + 0.1 * Math.sin(r * 3)})`), ce(t, e - 1, y - 3, e - 4, y - 9, "#c8a040"), ce(t, e + 1, y - 3, e + 4, y - 9, "#c8a040"), H(t, e, y, 3, "#8a6a20"), H(t, e, y, 2, "#e0b040"), m(t, e, y, "#8affd0"), m(t, e - 1, y - 1, "#fff0a0");
  };
  N.moonStone = (t, e, a, r) => {
    let y = a - 4;
    H(t, e, y, 10, `rgba(180,200,255,${0.2 + 0.12 * Math.sin(r * 4)})`), b(t, e - 3, y - 3, 6, 6, "#b8c4f0"), Q(t, e - 2, e + 1, y - 4, "#d8e0ff"), Q(t, e - 2, e + 1, y + 3, "#8a94c8"), b(t, e - 2, y - 2, 2, 2, "#ffffff"), Te(t, e + 2, y - 2, y + 2, "#8a94c8");
  };
  N.mapTable = (t, e, a, r) => {
    (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e - 9, a + 3, 20, 2), b(t, e - 10, a - 8, 20, 8, "#5c3a1e"), b(t, e - 9, a - 8, 18, 7, "#e8d8a8"), b(t, e - 10, a, 20, 3, "#4a2e18"), Te(t, e - 9, a + 3, a + 5, "#3a2412"), Te(t, e + 8, a + 3, a + 5, "#3a2412");
    for (let n = 0; n < 4; n++) m(t, e - 6 + n * 3, a - 5 + (n % 2) * 2, "#8a6a3a");
    ce(t, e - 7, a - 3, e + 2, a - 6, "#b8a070"), m(t, e + 4, a - 4, "#c8423b"), m(t, e + 5, a - 3, "#c8423b"), m(t, e + 4, a - 3, "#c8423b"), Math.sin(r * 4) > 0.5 && m(t, e + 6, a - 6, "#fff6c0"), b(t, e - 8, a - 10, 2, 3, "#c8a040");
  };
  N.sackOpen = (t, e, a, r) => {
    (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e - 5, a + 1, 11, 2), b(t, e - 5, a - 7, 10, 9, "#b8946a"), b(t, e - 4, a - 8, 8, 1, "#b8946a"), Te(t, e + 4, a - 6, a, "#8a6a48"), b(t, e - 4, a - 9, 8, 3, "#3a2a18"), b(t, e - 3, a - 10, 6, 3, "#e8c878");
    m(t, e - 1, a - 10, "#f4ead5"), m(t, e + 1, a - 9, "#f4ead5"), m(t, e - 6, a + 1, "#e8c878"), m(t, e + 6, a, "#e8c878"), m(t, e - 3, a - 4, "#d0b080");
  };
  N.chestOpen = (t, e, a, r) => {
    (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e - 6, a + 1, 14, 2);
    b(t, e - 7, a - 15, 14, 8, "#5a3418"), b(t, e - 6, a - 14, 12, 6, "#3a2010"), Q(t, e - 7, e + 6, a - 15, "#e0b040"), Te(t, e - 7, a - 15, a - 8, "#e0b040"), Te(t, e + 6, a - 15, a - 8, "#c89030");
    b(t, e - 7, a - 6, 14, 8, "#2a1608"), b(t, e - 6, a - 5, 12, 6, "#7a4a24"), Q(t, e - 6, e + 5, a - 2, "#e0b040"), b(t, e - 1, a - 3, 2, 3, "#f2c14e");
    b(t, e - 6, a - 8, 12, 3, "#f2c14e"), Q(t, e - 5, e + 4, a - 9, "#f2c14e"), m(t, e - 3, a - 9, "#fff6c0"), m(t, e + 2, a - 8, "#fff6c0"), m(t, e, a - 10, "#f2c14e"), m(t, e + 4, a - 7, "#c8423b"), m(t, e - 4, a - 7, "#8ad0ff");
    Math.sin(r * 5) > 0 && (m(t, e - 3, a - 13, "#fff6c0"), m(t, e + 3, a - 12, "#fff6c0"), m(t, e, a - 17, "#fff6c0"));
  };
  N.bedroll = (t, e, a) => {
    (t.fillStyle = "rgba(20,10,4,0.2)"), t.fillRect(e - 7, a + 3, 16, 1), b(t, e - 8, a - 3, 16, 6, "#8a7a54"), b(t, e - 8, a - 3, 16, 2, "#a89870"), b(t, e - 8, a - 3, 5, 5, "#e8e0c8"), Q(t, e - 8, e - 4, a - 3, "#ffffff"), Te(t, e + 2, a - 3, a + 2, "#6a5a3a"), Te(t, e + 5, a - 3, a + 2, "#6a5a3a");
  };
  N.ropeCoil = (t, e, a) => {
    ve(t, e, a + 1, 6, 3, "rgba(20,10,4,0.25)"), ve(t, e, a, 5, 3, "#8a6a40"), ve(t, e, a - 1, 5, 3, "#c8a070"), ve(t, e, a - 1, 3, 2, "#a8844e"), ve(t, e, a - 2, 3, 1, "#c8a070"), ve(t, e, a - 1, 1, 1, "#5a4020"), m(t, e + 5, a + 1, "#c8a070"), m(t, e + 6, a + 2, "#c8a070");
  };
  N.bucket = (t, e, a) => {
    (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e - 3, a + 1, 8, 1), b(t, e - 3, a - 5, 7, 6, "#6a4424"), Te(t, e - 3, a - 5, a, "#8a5a2b"), Q(t, e - 3, e + 3, a - 2, "#3a2412"), b(t, e - 3, a - 6, 7, 2, "#5aa8d8"), Q(t, e - 2, e + 1, a - 6, "#bfe3ef"), ce(t, e - 3, a - 6, e, a - 10, "#5a5a62"), ce(t, e + 3, a - 6, e, a - 10, "#5a5a62");
  };
  N.scorch = (t, e, a, r, n = {}) => {
    ve(t, e, a, n.r || 9, (n.r || 9) * 0.5, "rgba(30,20,14,0.55)"), ve(t, e, a, (n.r || 9) * 0.5, (n.r || 9) * 0.25, "rgba(10,6,4,0.5)");
  };
  N.skull = (t, e, a, r) => {
    b(t, e - 3, a - 6, 7, 5, "#e8e4d8"), Q(t, e - 2, e + 2, a - 7, "#e8e4d8"), b(t, e - 2, a - 1, 5, 2, "#d0ccc0"), b(t, e - 2, a - 4, 2, 2, "#1a1a1a"), b(t, e + 1, a - 4, 2, 2, "#1a1a1a"), m(t, e, a - 2, "#1a1a1a"), m(t, e - 1, a, "#1a1a1a"), m(t, e + 1, a, "#1a1a1a");
  };
  N.patch = (t, e, a) => {
    b(t, e - 4, a - 3, 9, 6, "#c8a070"), Q(t, e - 4, e + 4, a - 3, "#e0c090"), Q(t, e - 4, e + 4, a, "#a88454"), m(t, e - 3, a - 2, "#3a3a3a"), m(t, e + 3, a - 2, "#3a3a3a"), m(t, e - 3, a + 1, "#3a3a3a"), m(t, e + 3, a + 1, "#3a3a3a");
  };
  N.cloak = (t, e, a, r) => {
    ve(t, e, a - 6, 9, 11, `rgba(80,60,120,${0.15 + 0.08 * Math.sin(r * 2)})`);
  };
  N.shoal = (t, e, a, r, n = {}) => {
    let i = n.w || 70,
      s = n.h || 50;
    ve(t, e, a, i * 0.6, s * 0.4, "rgba(200,230,240,0.18)");
    for (let o = 0; o < (n.n || 40); o++) {
      let l = r * (0.9 + (o % 5) * 0.1) + o * 0.7,
        d = e + Math.cos(l + o) * i * 0.5 * ee(o, 171),
        p = a + Math.sin(l * 1.3 + o) * s * 0.36 * ee(o, 172),
        f = -Math.sin(l + o) > 0 ? 1 : -1;
      m(t, d + 1, p + 1, "rgba(10,30,50,0.35)"), Q(t, d - 2, d + 1, p, Math.sin(r * 6 + o) > 0.2 ? "#f4fbff" : "#a8c8d8"), m(t, d + (f > 0 ? 2 : -3), p, "#6a90a8");
    }
    for (let o = 0; o < 4; o++) {
      let l = (r * 0.9 + o * 0.25) % 1;
      if (l < 0.25) {
        let d = e + (ee(o, 173) - 0.5) * i,
          p = a + (ee(o, 174) - 0.5) * s * 0.7;
        Q(t, d - 1, d + 1, p - l * 22, "#e8f4fa"), m(t, d + 2, p - l * 22, "#7aa0b4"), m(t, d - 1, p, "#e8f6fb"), m(t, d + 1, p, "#e8f6fb");
      }
    }
  };
  var Rr = (t, e, a, r, n, i = 0.6) => {
    for (let s = 0; s < 6.28; s += 0.45) m(t, e + Math.cos(s + n) * r, a + Math.sin(s + n) * r * 0.5, `rgba(230,245,250,${i})`);
  };
  N.crab = (t, e, a, r, n = {}) => {
    let i = n.dir || -1,
      D = "#5a1a12",
      M = "#c8432a",
      Lc2 = "#e86a4a";
    n.water && Rr(t, e, a + 4, 22, r);
    // bacaklar (yanlara, eklemli)
    for (let o = 0; o < 4; o++)
      for (let l of [-1, 1]) {
        let k = Math.sin(r * 8 + o + (l > 0 ? 1.5 : 0)) * 1.5,
          x1 = e + l * (10 + o * 2),
          y1 = a - 5 + o * 1.5 - k,
          x2 = e + l * (14 + o * 2.5),
          y2 = a + 4 + o * 0.8;
        ce(t, e + l * 7, a - 1 + o, x1, y1, "#8a2a1e"), ce(t, x1, y1, x2, y2, M), m(t, x2, y2 + 1, D);
      }
    // gövde: üstten görünen kabuk + bize bakan ön yüz
    ve(t, e, a + 1, 12, 7, D), ve(t, e, a - 2, 12, 7, M), ve(t, e - 2, a - 5, 7, 3, Lc2), Q(t, e - 9, e + 9, a + 3, "#a8321e"), Q(t, e - 7, e + 7, a + 5, D);
    for (let x = -6; x <= 6; x += 4) m(t, e + x, a - 2, "#a8321e");
    // gözler (sap üstünde) + ağız
    for (let o of [-3, 3]) Te(t, e + o, a - 11, a - 7, M), b(t, e + o - 1, a - 13, 3, 3, "#f4f4f0"), m(t, e + o, a - 12, "#1a1a1a");
    Q(t, e - 2, e + 2, a + 2, "#3a0e08");
    // kıskaçlar
    let s = Math.sin(r * 5) > 0 ? 2 : 0;
    for (let o of [-1, 1]) {
      let l = e + o * 15,
        d = a - 9 + (o === i ? -4 : 0);
      ce(t, e + o * 9, a - 3, l, d + 3, "#8a2a1e"), H(t, l, d, 4, D), H(t, l, d, 3, "#d84a30"), m(t, l - 1, d - 1, Lc2);
      ce(t, l - 2, d - 3, l - 3 - s * 0.5, d - 8, "#d84a30"), ce(t, l + 2, d - 3, l + 3 + s * 0.5, d - 8, "#d84a30"), m(t, l - 3, d - 9, "#f4d0c0"), m(t, l + 3, d - 9, "#f4d0c0");
    }
    n.water && wLine(t, e, a + 7, 14, r);
  };
  N.diver = (t, e, a, r) => {
    let n = Math.sin(r * 6) * 3;
    Rr(t, e, a + 1, 8, r, 0.7), ce(t, e - 3, a, e - 8, a - 2 + n, "#1e2a32"), ce(t, e + 3, a, e + 8, a - 2 - n, "#1e2a32"), m(t, e - 9, a - 3 + n, "#c89060"), m(t, e + 9, a - 3 - n, "#c89060");
    b(t, e - 3, a - 7, 7, 7, "#1e2a32"), b(t, e - 2, a - 8, 5, 1, "#1e2a32"), b(t, e - 2, a - 5, 5, 3, "#c89060"), b(t, e - 2, a - 5, 5, 2, "#8ad0f0"), m(t, e - 1, a - 5, "#e8f8ff"), Te(t, e + 4, a - 11, a - 5, "#e07b39"), m(t, e + 3, a - 11, "#e07b39");
    Math.sin(r * 3) > 0.4 && (m(t, e + 3, a - 13, "#e8f8ff"), m(t, e + 5, a - 15, "#e8f8ff")), wLine(t, e, a + 1, 5, r);
  };
  N.fallenMast = (t, e, a, r, n = {}) => {
    let i = n.len || 60;
    ce(t, e - i / 2, a + 6, e + i / 2, a - 2, "rgba(20,10,4,0.3)");
    for (let s = -2; s <= 1; s++) ce(t, e - i / 2, a + 4 + s, e + i / 2, a - 6 + s, s === -2 ? "#a87a4a" : s === 1 ? "#3a2412" : "#7a5030");
    for (let s = 0; s < 11; s++) Q(t, e + 2 + s * 2, e + 16 + s * 2 + (s % 3), a - 8 + s, s % 2 ? "#d8ccb0" : "#c8b898");
    Q(t, e + 6, e + 30, a + 3, "#a89c80"), ce(t, e - i / 2, a + 4, e - i / 2 - 6, a + 9, "#c8a070"), ce(t, e + 4, a - 2, e + 2, a + 8, "rgba(60,40,20,0.6)"), b(t, e - i / 2 - 1, a + 1, 2, 5, "#5c3a1e");
  };
  N.bigNet = (t, e, a, r, n = {}) => {
    var i;
    return N.net(t, e, a, r, { r: n.r || 32, fish: (i = n.fish) != null ? i : 10 });
  };
  N.jellies = (t, e, a, r, n = {}) => {
    let i = n.w || 300,
      s = n.h || 260;
    for (let o = 0; o < (n.n || 40); o++) {
      let l = e + (ee(o, 201) - 0.5) * i + Math.sin(r * 0.7 + o) * 4,
        d = a + (ee(o, 202) - 0.5) * s + Math.cos(r * 0.5 + o) * 3,
        p = o % 3 === 0 ? "#c87aff" : o % 3 === 1 ? "#5ab8ff" : "#7affd8",
        f = 3 + Math.sin(r * 3 + o) * 1;
      H(t, l, d, f + 4, "rgba(140,180,255,0.10)"), ve(t, l, d, f, f * 0.75, p), Q(t, l - f + 1, l + f - 1, d - f * 0.5, "rgba(255,255,255,0.5)");
      for (let y = -1; y <= 1; y++) Te(t, l + y * 2, d + f * 0.7, d + f + 3 + ((r * 4 + o + y) % 2), "rgba(200,220,255,0.6)");
    }
  };
  N.bidFlag = (t, e, a, r, n = {}) => {
    let i = Math.sin(r * 6) > 0 ? 1 : 0,
      c = n.col || "#e0b040";
    (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e - 1, a, 4, 1), Te(t, e, a - 18, a, "#3a2412"), Te(t, e + 1, a - 17, a, "#6a4424"), m(t, e, a - 19, "#e0b040");
    b(t, e + 2, a - 18, 5, 6, c), b(t, e + 7, a - 18 + i, 4, 6, c), Q(t, e + 2, e + 6, a - 13, _t2(c, -0.25)), Q(t, e + 7, e + 10, a - 13 + i, _t2(c, -0.25)), b(t, e + 5, a - 16, 2, 2, "#ffffff");
  };
  N.tentBoat = (t, e, a, r, n = {}) => {
    N.rowboat(t, e, a, r, { npcs: [n.npc || "merchant"], dir: n.dir || "up", cargo: n.cargo });
    let i = n.col || "#c8423b",
      y = Math.round(a + Math.sin(r * 1.8));
    Te(t, e - 7, y - 20, y - 6, "#5c3a1e"), Te(t, e + 7, y - 20, y - 6, "#5c3a1e");
    for (let s = 0; s < 5; s++) Q(t, e - 9 + (s > 3 ? 1 : 0), e + 9 - (s > 3 ? 1 : 0), y - 24 + s, s % 2 ? i : "#f4ead5");
    Q(t, e - 9, e + 9, y - 19, _t2(i, -0.3));
  };
  N.floatingYard = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 0.8));
    Rr(t, e, y + 20, 56, r * 0.4, 0.4);
    b(t, e - 46, y - 30, 92, 60, "#3a2412");
    for (let n = 0; n < 11; n++) b(t, e - 45 + n * 8.2, y - 29, 8, 58, n % 2 ? "#8a5a2b" : "#7a4a24"), Te(t, e - 45 + n * 8.2, y - 29, y + 28, "#a06a34");
    b(t, e - 46, y + 30, 92, 7, "#4a2e18"), Q(t, e - 46, e + 45, y + 30, "#2a1608"), Q(t, e - 46, e + 45, y + 33, "#3a2412"), Q(t, e - 46, e + 45, y + 36, "#2a1608");
    for (let n = 0; n < 12; n++) H(t, e - 42 + n * 7.6, y + 37, 2, n % 2 ? "#6a4424" : "#8a5a2b");
    // kızaktaki tekne iskeleti
    for (let n = 0; n < 7; n++) {
      let x = e - 30 + n * 7,
        h = 12 - Math.abs(n - 3) * 2;
      Te(t, x, y - 4 - h, y + 6, "#c8a070"), Te(t, x + 1, y - 4 - h, y + 6, "#a8844e"), ce(t, x, y - 4 - h, x + 4, y - 2 - h, "#c8a070");
    }
    Q(t, e - 34, e + 16, y + 6, "#8a5a2b"), Q(t, e - 34, e + 16, y + 7, "#5c3a1e"), Q(t, e - 32, e + 14, y - 6, "#b08050");
    // vinç
    b(t, e + 24, y - 44, 4, 46, "#5c3a1e"), Te(t, e + 24, y - 44, y + 1, "#8a5a2b"), ce(t, e + 26, y - 44, e + 6, y - 36, "#5c3a1e"), ce(t, e + 26, y - 43, e + 6, y - 35, "#3a2412"), Te(t, e + 6, y - 35, y - 20, "#c8a070"), b(t, e + 3, y - 20, 7, 5, "#a87a4a"), Q(t, e + 3, e + 9, y - 20, "#c89a62");
    dS(t, deckBarrel("#8a5a2b"), e + 38, y + 20), dS(t, Ca("GOOD_TIMBER"), e - 38, y + 24);
    for (let [n, i, s] of [
      [-30, 22, "right"],
      [8, -18, "left"],
      [34, 8, "up"],
    ])
      dS(t, ha("villager", s, Math.sin(r * 4 + n) > 0 ? "work" : "idle", Math.floor(r * 3) % 4), e + n, y + i);
    Math.sin(r * 5) > 0.6 && (m(t, e - 20, y + 4, "#fff0a0"), m(t, e - 19, y + 3, "#ffd060")), wLine(t, e, y + 38, 46, r);
  };
  N.kelpForest = (t, e, a, r, n = {}) => {
    var s;
    let i = n.w || 260;
    t.globalAlpha = (s = n.a) != null ? s : 0.55;
    for (let o = 0; o < 14; o++) {
      let l = e - i / 2 + (o * i) / 14 + ee(o, 211) * 10,
        d = a + (ee(o, 212) - 0.5) * 120,
        p = l,
        f = d + 30;
      for (let y = 0; y < 10; y++) {
        let x = p + Math.sin(r * 1.2 + o + y * 0.5) * 2,
          _ = f - 6;
        ce(t, p, f, x, _, y % 3 === 0 ? "#5af0c0" : "#2f8a7a"), ce(t, p + 1, f, x + 1, _, "#1f6a5a"), y % 3 === 2 && (m(t, x - 2, _, "#7affd8"), m(t, x + 2, _ - 1, "#7affd8")), (p = x), (f = _);
      }
    }
    t.globalAlpha = 1;
  };
  N.meteor = (t, e, a, r, n = {}) => {
    for (let i = 0; i < 26; i++) {
      let s = i / 26;
      H(t, e - i * 3, a - i * 2, Math.max(1, 4 - s * 4), i < 4 ? "#fff6c0" : `rgba(255,${180 - i * 4},90,${0.8 - s * 0.8})`);
    }
    H(t, e, a, 5, "#fff0a0"), H(t, e, a, 3, "#ffffff");
  };
  N.meteorField = (t, e, a, r) => {
    Rr(t, e, a, 26, r * 2, 0.8), ve(t, e, a, 22, 11, "rgba(255,160,60,0.12)");
    for (let n = 0; n < 7; n++) {
      let i = e + (ee(n, 221) - 0.5) * 40,
        s = a + (ee(n, 222) - 0.5) * 20;
      b(t, i - 1, s - 2, 3, 3, "#3a2a28"), m(t, i, s - 2, Math.sin(r * 4 + n) > 0 ? "#ff9a40" : "#f2c14e"), m(t, i - 1, s - 3, "#5a4a48");
      Math.sin(r * 6 + n) > 0.5 && (m(t, i, s - 6 - ((r * 10) % 5), "rgba(230,230,230,0.7)"), m(t, i + 1, s - 9 - ((r * 10) % 5), "rgba(230,230,230,0.4)"));
    }
  };
  N.seaEye = (t, e, a, r, n = {}) => {
    var l;
    let i = (l = n.open) != null ? l : 1,
      s = Math.sin(r * 0.7) > 0.97 ? 0.1 : 1,
      o = Math.max(1, 22 * i * s);
    if ((ve(t, e, a, 56, o + 7, "rgba(10,20,30,0.55)"), ve(t, e, a, 50, o + 2, "#2a3a44"), ve(t, e, a, 48, o, "#c8d8c0"), o > 6)) {
      let d = e + (n.lookX || 0) + Math.sin(r * 0.5) * 6;
      ve(t, d, a, 20, Math.min(o, 19), "#c89030"), ve(t, d, a, 18, Math.min(o, 17), "#e0b040"), ve(t, d, a, 12, Math.min(o, 12), "#f0d060"), ve(t, d, a, 4, Math.min(o, 16), "#0a0a0a"), b(t, d - 9, a - 8, 3, 2, "#ffffff");
      for (let q = 0; q < 6; q++) ce(t, e - 46 + q * 3, a - 2 + (q % 3), e - 34 + q * 2, a + (q % 2), "rgba(200,80,70,0.35)");
    }
    (t.globalAlpha = 0.3), ve(t, e, a + 2, 52, o + 2, "#1f5a82"), (t.globalAlpha = 1), Rr(t, e, a, 58, r * 0.3, 0.5);
  };
  N.reverseCurrent = (t, e, a, r, n = {}) => {
    let i = n.W || 640;
    for (let s = 0; s < 40; s++) {
      let o = ee(s, 231) * i - i / 2 + e,
        l = a + ((ee(s, 232) * 300 - ((r * 60) % 300)) % 300) - 150;
      Te(t, o, l, l + 8, "rgba(230,245,255,0.7)"), m(t, o, l - 1, "#ffffff"), m(t, o - 1, l + 1, "rgba(230,245,255,0.5)"), m(t, o + 1, l + 1, "rgba(230,245,255,0.5)");
    }
  };
  N.gasField = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 16); i++) {
      let s = e + (ee(i, 241) - 0.5) * (n.w || 200),
        o = a + (ee(i, 242) - 0.5) * (n.h || 160),
        l = (r * 0.8 + ee(i, 243)) % 1,
        d = 2 + l * 9;
      if ((Rr(t, s, o, d, r, 1 - l), l > 0.8)) for (let p = 0; p < 5; p++) m(t, s + Math.cos(p) * d, o + Math.sin(p) * d * 0.5 - 3, "#ffffff");
      l < 0.3 && (m(t, s, o - 2 - l * 10, "#d8f0c0"), m(t, s + 1, o - 4 - l * 10, "#d8f0c0"));
    }
    n.flare && (H(t, e, a - 6, 30, "rgba(255,140,40,0.35)"), H(t, e, a - 8, 16, "rgba(255,220,120,0.6)"), N.fire(t, e, a, r, { n: 18, w: 34, h: 14 }));
  };
  N.blackRain = (t, e, a, r, n = {}) => {
    let i = n.W || 640,
      s = n.H || 360;
    for (let o = 0; o < 120; o++) {
      let l = (ee(o, 251) * i + r * 20) % i,
        d = (ee(o, 252) * s + r * 140 + o * 7) % s;
      b(t, Math.round(l), Math.round(d), 1, 3, "rgba(20,16,24,0.85)");
    }
  };
  N.tarStains = (t, e, a, r) => {
    for (let n = 0; n < 12; n++) {
      let R = 1 + (n % 3),
        x = Math.round(e + (ee(n, 261) - 0.5) * 40),
        y = Math.round(a + (ee(n, 262) - 0.5) * 80);
      b(t, x - R, y, R * 2 + 1, 1 + (R > 1 ? 1 : 0), "rgba(16,12,20,0.75)"), R > 1 && b(t, x - R + 1, y - 1, R * 2 - 1, 1, "rgba(16,12,20,0.75)");
    }
  };
  N.lighthouseIsle = (t, e, a, r, n = {}) => {
    let i = n.r || 46;
    N.island(t, e, a, r, { r: i, palms: 1, ground: "#6a7a62" });
    let tx = e + 6,
      ty = a - 2,
      h = Math.round(i * 0.75);
    hut(t, tx - 16, ty + 3, 9, 6, "#d8d0c0", "#8a3a2a", { seed: 2 }), tower(t, tx, ty, h, r, { bands: !0, w: 5, lit: n.lit !== !1 });
    n.lit !== !1 && N.lightBeam(t, tx, ty - h - 4, r, { len: n.len || 180, speed: n.speed || 0.9 });
  };
  N.workshopIsle = (t, e, a, r, n = {}) => {
    N.island(t, e, a, r, { r: n.r || 60, palms: 3, shipyard: !1, ground: "#5a7a48" });
    let y = a + 4;
    // kızakta tekne
    for (let i = 0; i < 9; i++) {
      let x = e - 20 + i * 4,
        h = 10 - Math.abs(i - 4) * 1.6;
      Te(t, x, y - h - 2, y, n.done ? "#a87a4a" : "#c8a070"), n.done && b(t, x, y - h - 2, 4, Math.round(h) + 2, i % 2 ? "#a87a4a" : "#b88a56");
    }
    Q(t, e - 22, e + 16, y, "#5c3a1e"), Q(t, e - 22, e + 16, y + 1, "#3a2412"), n.done && (Q(t, e - 20, e + 14, y - 4, "#e8e0c8"), Te(t, e - 3, y - 26, y - 10, "#6a4424"), b(t, e - 2, y - 25, 9, 8, "#f4ead5"));
    hut(t, e + 20, y - 4, 14, 8, "#b07a42", "#6a4a2a", { seed: 3, win: !0 }), dS(t, Ca("GOOD_TIMBER"), e + 14, y + 6), b(t, e + 26, y - 26, 2, 5, "#5a5a62");
  };
  N.swimPet = (t, e, a, r, n = {}) => {
    for (let i = 0; i < 2; i++) {
      let s = 7 + ((r * 10 + i * 6) % 12);
      (t.strokeStyle = `rgba(255,255,255,${0.5 - s / 30})`), (t.lineWidth = 1), t.beginPath(), t.ellipse(e, a + 1, s, s * 0.5, 0, 0, Math.PI * 2), t.stroke();
    }
    // yalnızca baş ve omuzlar su üstünde
    let img = pa(n.id || "PET_TARCIN", "up", Math.sin(r * 6) > 0 ? "walk1" : "walk3"),
      y = Math.round(a + Math.sin(r * 4));
    t.drawImage(img, 0, 0, img.width, 16, Math.round(e - img.ax), y - 14, img.width, 16), wLine(t, e, y + 2, 6, r), m(t, e - 7, y + 1 + Math.sin(r * 9), "#ffffff"), m(t, e + 7, y + 1 - Math.sin(r * 9), "#ffffff");
  };
  N.inkCloud = (t, e, a, r, n = {}) => {
    let i = n.r || 14;
    for (let [s, o, l] of [
      [0, 0, 1],
      [-i * 0.5, 2, 0.7],
      [i * 0.5, -1, 0.75],
      [2, i * 0.3, 0.6],
    ])
      ve(t, e + s, a + o, Math.round(i * l), Math.round(i * l * 0.6), "rgba(30,14,46,0.75)");
  };
  N.mouse = (t, e, a, r) => {
    let n = Math.round(Math.sin(r * 3) * 6),
      d = Math.cos(r * 3) > 0 ? 1 : -1;
    b(t, e + n - 2, a - 2, 5, 3, "#6a5a50"), Q(t, e + n - 1, e + n + 1, a - 3, "#7a6a60"), b(t, e + n + (d > 0 ? 3 : -4), a - 2, 2, 2, "#7a6a60"), m(t, e + n + (d > 0 ? 3 : -3), a - 3, "#c8a8a0"), m(t, e + n + (d > 0 ? 5 : -5), a - 1, "#c8a8a0"), m(t, e + n + (d > 0 ? 4 : -4), a - 2, "#101010");
    Q(t, e + n + (d > 0 ? -5 : 3), e + n + (d > 0 ? -3 : 5), a, "#c8a8a0");
  };
  N.gull = (t, e, a, r) => {
    (t.fillStyle = "rgba(0,0,0,0.16)"), t.fillRect(Math.round(e - 3), Math.round(a + 10), 7, 2), dS(t, pa("PET_MARTI", "down", Math.sin(r * 9) > 0 ? "fly0" : "fly1"), e, a + 2);
  };
  N.fishPlate = (t, e, a) => {
    ve(t, e, a, 6, 3, "#a8a090"), ve(t, e, a - 1, 6, 3, "#e8e0d0"), ve(t, e, a - 1, 4, 2, "#d8d0c0"), b(t, e - 3, a - 3, 6, 2, "#7a9ab0"), Q(t, e - 3, e + 1, a - 3, "#a8c8d8"), m(t, e + 3, a - 4, "#5a7a90"), m(t, e + 3, a - 1, "#5a7a90"), m(t, e - 2, a - 3, "#101010");
  };
