  // ===== 3/4 bakış: sahne objeleri (1) =====
  var N = {},
    // su üstündeki objenin çevresinde köpük halkası (perspektif için basık)
    Za = (t, e, a, r, n, i = 0.7) => {
      for (let s = 0; s < 6.28; s += 0.4) m(t, e + Math.cos(s + n) * r, a + Math.sin(s + n) * r * 0.5, `rgba(230,245,250,${i})`);
    },
    // su hattı: objenin tabanında köpük + koyu yansıma
    wLine = (t, e, a, w, r) => {
      (t.fillStyle = "rgba(10,30,50,0.25)"), t.fillRect(Math.round(e - w), Math.round(a), Math.round(w * 2), 2);
      for (let x = -w; x <= w; x++) Math.sin(x * 1.3 + r * 3) > -0.3 && m(t, e + x, a + (Math.sin(x * 0.9 + r * 2) > 0.5 ? 1 : 0), "rgba(235,248,252,0.85)");
    },
    // Suya yarı batmış sprite (alt "sink" satırı gizli)
    fSpr = (t, img, e, a, r, sink = 3) => {
      let x = Math.round(e - img.width / 2),
        y = Math.round(a - img.height + sink + 3);
      t.drawImage(img, 0, 0, img.width, img.height - sink, x, y, img.width, img.height - sink), wLine(t, e, y + img.height - sink, img.width / 2 + 1, r);
    },
    // 3/4 kaya: üstü aydınlık, bize bakan yüz koyu
    rock = (t, e, a, R, c = "#6a6a72") => {
      let h = Math.round(R * 0.9);
      ve(t, e, a, R, R * 0.45, _t(c, -0.55));
      for (let y = 0; y <= h; y++) {
        let q = y / h,
          w = Math.round(R * (0.55 + 0.45 * Math.sin(q * Math.PI * 0.5)) * (y < 2 ? 0.7 : 1));
        Q(t, e - w, e + w, a - h + y, q < 0.35 ? _t(c, 0.18) : q < 0.7 ? c : _t(c, -0.28));
      }
      ve(t, e - R * 0.25, a - h + 1, R * 0.45, Math.max(1, R * 0.2), _t(c, 0.4));
      ce(t, e + R * 0.2, a - h + 2, e + R * 0.4, a - 2, _t(c, -0.4)), ce(t, e - R * 0.5, a - h * 0.5, e - R * 0.3, a - 1, _t(c, -0.2));
    },
    // palmiye
    palm = (t, e, a, r, s = 1) => {
      let h = Math.round(11 * s),
        lean = Math.round(Math.sin(e * 0.7) * 3);
      ve(t, e + 3, a + 1, 6, 2, "rgba(10,30,20,0.25)");
      for (let i = 0; i <= h; i++) {
        let x = e + Math.round((lean * i * i) / (h * h));
        b(t, x, a - i, 2, 1, i % 3 === 0 ? "#5a3a1e" : "#8a6034");
      }
      let tx = e + lean,
        ty = a - h;
      for (let k = 0; k < 7; k++) {
        let ang = (k / 7) * 6.28 + 0.3,
          sw = Math.sin(r * 0.8 + k) * 0.8;
        for (let d = 1; d <= 8 * s; d++) {
          let x = tx + Math.cos(ang) * d + sw * (d / 8),
            y = ty + Math.sin(ang) * d * 0.5 + (d * d) / (14 * s) - 1;
          m(t, x, y, d > 6 * s ? "#2f6a32" : k % 2 ? "#3f8a3e" : "#57a84a"), d < 6 * s && m(t, x, y + 1, "#2f6a32");
        }
      }
      b(t, tx, ty - 1, 2, 2, "#3a5a22"), m(t, tx - 1, ty + 1, "#8a5a2b"), m(t, tx + 2, ty + 1, "#6a4424");
    },
    // çatılı küçük yapı (kulübe/ev): önden duvar + üstte çatı
    hut = (t, x, y, w, h, wall, roof, o = {}) => {
      let rh = o.rh || Math.round(w * 0.55);
      (t.fillStyle = "rgba(10,20,20,0.25)"), t.fillRect(x + 2, y - 1, w + 1, 3);
      b(t, x, y - h, w, h, wall), Te(t, x + w - 1, y - h, y - 1, _t(wall, -0.2)), Q(t, x, x + w - 1, y - 1, _t(wall, -0.3));
      o.door !== !1 && (b(t, x + Math.floor(w / 2) - 1, y - Math.min(h - 1, 5), 3, Math.min(h - 1, 5), "#3a2412"), m(t, x + Math.floor(w / 2) + 1, y - 3, "#e0b040"));
      o.win && w > 9 && (b(t, x + 2, y - h + 2, 2, 2, o.lit ? "#ffd060" : "#8fc0dc"), b(t, x + w - 4, y - h + 2, 2, 2, o.lit ? "#ffd060" : "#8fc0dc"));
      for (let i = 0; i < rh; i++) {
        let q = i / rh,
          ww = Math.round((w / 2 + 2) * (o.flat ? 1 : 0.25 + 0.75 * q));
        Q(t, x + w / 2 - ww, x + w / 2 + ww - 1, y - h - rh + i, i === rh - 1 ? _t(roof, -0.35) : (i + (o.seed || 0)) % 3 === 0 ? _t(roof, -0.14) : q < 0.3 ? _t(roof, 0.16) : roof);
      }
    },
    // taş kule / deniz feneri
    tower = (t, x, y, h, r, o = {}) => {
      let w = o.w || 5;
      ve(t, x + 3, y + 1, w + 3, 2, "rgba(10,20,30,0.25)");
      for (let i = 0; i < h; i++) {
        let ww = Math.round(w - (i / h) * (w * 0.35)),
          band = o.bands && Math.floor(i / 6) % 2;
        Q(t, x - ww, x + ww, y - i, band ? "#c8423b" : "#e8e4dc"), m(t, x + ww, y - i, band ? "#8a2a26" : "#b8b4ac"), m(t, x + ww - 1, y - i, band ? "#a8322c" : "#d0ccc4");
      }
      let ty = y - h;
      b(t, x - w + 1, ty - 1, w * 2 - 1, 2, "#4a4a52"), b(t, x - w + 2, ty - 6, w * 2 - 3, 5, "#3a3a44"), b(t, x - w + 3, ty - 5, w * 2 - 5, 3, o.lit === !1 ? "#5a5a62" : Math.sin(r * 3) > 0 ? "#fff0a0" : "#f2c14e");
      for (let i = 0; i < 4; i++) Q(t, x - w + 2 + i, x + w - 2 - i, ty - 7 - i, "#c8423b");
      m(t, x, ty - 11, "#3a3a44"), b(t, x - 1, y - 5, 3, 5, "#3a2412");
      o.lit !== !1 && H(t, x, ty - 4, 7, `rgba(255,240,170,${0.14 + 0.06 * Math.sin(r * 3)})`);
    };
  // Sandal gövdesi; dir: up/down (dikey), left/right (yatay). İçine oturan figürler ayrıca çizilir.
  function boatHull(t, e, a, L, half, dir, c1 = "#8a5a2b", c2 = "#5c3a1e") {
    let fl2 = "#b8885a";
    if (dir === "up" || dir === "down") {
      let up = dir === "up";
      // bize bakan yan duvar (alt uç)
      for (let i = 0; i < L; i++) {
        let j = up ? i : L - 1 - i,
          w = Math.round(Math.min(half, 1 + j * 0.7, (L - j) * 0.9 + 1.5)),
          y = a - L / 2 + i;
        if (i >= L - 6) Q(t, e - w, e + w, y + 4, i % 2 ? c2 : _t(c2, -0.2));
      }
      for (let i = 0; i < L; i++) {
        let j = up ? i : L - 1 - i,
          w = Math.round(Math.min(half, 1 + j * 0.7, (L - j) * 0.9 + 1.5)),
          y = a - L / 2 + i;
        Q(t, e - w, e + w, y, c2), w > 1 && Q(t, e - w + 1, e + w - 1, y, j < 3 ? c1 : fl2), w > 2 && (m(t, e - w + 1, y, c1), m(t, e + w - 1, y, _t(c1, -0.15)));
        w > 2 && j % 7 === 5 && Q(t, e - w + 1, e + w - 1, y, c1);
        w > 2 && j % 7 === 6 && Q(t, e - w + 1, e + w - 1, y, c2);
      }
      // uzak iç duvar gölgesi
      return;
    }
    let s = dir === "right" ? 1 : -1;
    for (let i = 0; i < L; i++) {
      let j = L - 1 - i, // j: pruvadan uzaklık
        w = Math.round(Math.min(half, 1 + i * 0.7, (L - i) * 0.9 + 1.5)),
        x = e + s * (L / 2 - i - (s > 0 ? 1 : 0));
      // i = pruvadan itibaren
      Te(t, x, a - w, a + w, c2), w > 1 && Te(t, x, a - w + 1, a + w - 1, fl2), w > 2 && (m(t, x, a - w + 1, _t(c1, -0.2)), m(t, x, a - w + 2, _t(c1, -0.1)));
      w > 2 && i % 7 === 5 && Te(t, x, a - w + 1, a + w - 1, c1);
      for (let k = 1; k <= 4; k++) m(t, x, a + w + k, k === 1 ? c1 : k === 4 ? _t(c2, -0.3) : k % 2 ? c2 : _t(c2, -0.12));
    }
  }
  function boatSeat(t, npc, x, y, face) {
    // kürek sırasında oturan figür: bacakları küpeştenin arkasında kalır
    let img = ha(npc, face, "sit");
    t.drawImage(img, 0, 0, img.width, img.height - 6, Math.round(x - img.ax), Math.round(y - img.ay + 5), img.width, img.height - 6);
  }
  N.crate = (t, e, a, r) => {
    Za(t, e, a + 2, 8, r), fSpr(t, Ca("GOOD_SPICE"), e, a + Math.sin(r * 2), r, 3);
  };
  N.chest = (t, e, a, r, n = {}) => {
    Za(t, e, a + 2, 10, r);
    let y = Math.round(a + Math.sin(r * 2));
    n.glow && H(t, e, y - 4, 11, `rgba(255,220,120,${0.14 + 0.06 * Math.sin(r * 3)})`);
    b(t, e - 7, y - 9, 14, 11, "#2a1608"), b(t, e - 6, y - 4, 12, 5, "#7a4a24"), b(t, e - 6, y - 8, 12, 4, "#9a6230"), Q(t, e - 5, e + 4, y - 9, "#b07a42");
    Q(t, e - 6, e + 5, y - 4, "#e0b040"), Te(t, e - 4, y - 8, y, "#e0b040"), Te(t, e + 3, y - 8, y, "#c89030"), b(t, e - 1, y - 5, 2, 3, "#f2c14e"), m(t, e - 1, y - 3, "#2a1608");
    m(t, e - 5, y - 1, "#5a8a3a"), m(t, e + 4, y - 6, "#5a8a3a"), m(t, e + 5, y - 2, "#3a6a2a"), wLine(t, e, y + 1, 8, r);
  };
  N.barrel = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 2.3)),
      ro = Math.floor(r * 1.5) % 3;
    Za(t, e, a + 2, 8, r);
    b(t, e - 6, y - 6, 12, 7, "#2a1608"), b(t, e - 5, y - 6, 10, 6, "#8a5a2b"), Q(t, e - 5, e + 4, y - 6, "#b07a42"), Q(t, e - 5, e + 4, y - 4 + ro, "#6a4424"), Q(t, e - 5, e + 4, y - 1, "#5c3a1e");
    Te(t, e - 3, y - 6, y - 1, "#3a2412"), Te(t, e + 2, y - 6, y - 1, "#3a2412"), b(t, e + 5, y - 5, 1, 4, "#a87a4a"), wLine(t, e, y + 1, 7, r);
  };
  N.timber = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 4); i++) {
      let s = (ee(i, 3) - 0.5) * 30,
        o = (ee(i, 4) - 0.5) * 20 + Math.sin(r * 1.5 + i),
        l = (ee(i, 5) - 0.5) * 1.6,
        d = 12 + (i % 3) * 4,
        p = (Math.cos(l) * d) / 2,
        f = (Math.sin(l) * d) / 4;
      ce(t, e + s - p, a + o - f + 2, e + s + p, a + o + f + 2, "rgba(235,248,252,0.6)"),
        ce(t, e + s - p, a + o - f + 1, e + s + p, a + o + f + 1, "#5c3a1e"),
        ce(t, e + s - p, a + o - f, e + s + p, a + o + f, "#a87a4a"),
        ce(t, e + s - p, a + o - f - 1, e + s + p, a + o + f - 1, "#c89a62"),
        m(t, e + s + p, a + o + f, "#e0c090");
    }
  };
  N.bottle = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 2)),
      tl = Math.sin(r * 1.3) > 0 ? 1 : 0;
    Za(t, e, a + 2, 6, r), b(t, e - 2, y - 7, 5, 8, "#2a6a48"), b(t, e - 1, y - 6, 3, 6, "#4aa070"), Te(t, e - 1, y - 6, y - 2, "#8ad0a0"), b(t, e - 1 + tl, y - 10, 3, 3, "#2a6a48"), b(t, e - 1 + tl, y - 11, 3, 1, "#c8a060");
    b(t, e, y - 4, 2, 3, "#f4ead5"), wLine(t, e, y + 1, 4, r);
  };
  N.raft = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.6));
    Za(t, e, a + 4, 16, r);
    for (let n = 0; n < 6; n++) b(t, e - 12 + n * 4, y - 6, 4, 13, n % 2 ? "#8a5a2b" : "#7a4a24"), Te(t, e - 12 + n * 4, y - 6, y + 6, "#a87a4a"), b(t, e - 12 + n * 4, y + 7, 4, 3, n % 2 ? "#5c3a1e" : "#4a2e18"), H(t, e - 10 + n * 4, y + 8, 1, "#c89a62");
    Q(t, e - 12, e + 11, y - 3, "#c8a070"), Q(t, e - 12, e + 11, y + 3, "#c8a070"), Q(t, e - 12, e + 11, y + 4, "#3a2412");
    Te(t, e + 8, y - 22, y - 2, "#5c3a1e"), b(t, e + 9, y - 22, 6, 4, "#c8423b"), m(t, e + 15, y - 21 + (Math.sin(r * 5) > 0 ? 1 : 0), "#c8423b");
    dS(t, ha("castaway", "down", Math.sin(r * 2) > 0.3 ? "react" : "sit"), e - 2, y + 3);
    Math.sin(r * 6) > 0 && (H(t, e - 9, y - 6, 2, "#ffb040"), m(t, e - 9, y - 9, "#fff0a0")), wLine(t, e, y + 10, 13, r);
  };
  N.boat = (t, e, a, r, n = {}) => {
    let y = Math.round(a + Math.sin(r * 1.8));
    Za(t, e, a + 6, 12, r), boatHull(t, e, y, 30, 8, "up"), n.npc !== null && boatSeat(t, n.npc || "sailor", e, y + 5, "up"), Q(t, e - 7, e + 7, y + 6, "#8a5a2b"), wLine(t, e, y + 20, 9, r);
  };
  N.mapScroll = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 2));
    b(t, e - 8, y - 6, 16, 10, "#3a2412"), b(t, e - 7, y - 5, 14, 8, "#e8d8a8"), b(t, e - 9, y - 7, 3, 12, "#c8a870"), b(t, e + 6, y - 7, 3, 12, "#c8a870"), Te(t, e - 9, y - 7, y + 4, "#e8d0a0"), Te(t, e + 6, y - 7, y + 4, "#e8d0a0");
    ce(t, e - 4, y - 2, e, y, "#8a6a3a"), ce(t, e, y, e + 2, y - 3, "#8a6a3a"), m(t, e + 3, y - 3, "#c8423b"), m(t, e + 4, y - 2, "#c8423b"), m(t, e + 4, y - 4, "#c8423b"), m(t, e + 2, y - 2, "#c8423b"), m(t, e - 4, y + 1, "#5a8a4a");
  };
  N.mine = (t, e, a, r) => {
    for (let n = 0; n < 4; n++) {
      let i = Math.round(e + (ee(n, 7) - 0.5) * 60),
        s = Math.round(a + (ee(n, 8) - 0.5) * 50 + Math.sin(r + n));
      Za(t, i, s + 2, 8, r), H(t, i, s - 3, 5, "#1a1a20"), H(t, i, s - 3, 4, "#3a3a44"), H(t, i - 1, s - 5, 1, "#7a7a86");
      for (let o = 0; o < 7; o++) {
        let an = Math.PI + (o / 6) * Math.PI;
        m(t, i + Math.cos(an) * 6, s - 3 + Math.sin(an) * 6, "#6a6a72"), m(t, i + Math.cos(an) * 7, s - 3 + Math.sin(an) * 7, "#2a2a30");
      }
      m(t, i, s - 3, Math.sin(r * 4 + n) > 0.5 ? "#ff5040" : "#8a2a26"), wLine(t, i, s + 1, 5, r);
    }
  };
  N.rocks = (t, e, a, r) => {
    let L = [];
    for (let n = 0; n < 5; n++) L.push({ x: e + (ee(n, 9) - 0.5) * 90, y: a + (ee(n, 10) - 0.5) * 70, o: 6 + ee(n, 11) * 8 });
    L.sort((p, q) => p.y - q.y);
    for (let k of L) Za(t, k.x, k.y + 1, k.o + 4, r * 0.6), rock(t, Math.round(k.x), Math.round(k.y), Math.round(k.o), "#62626c"), wLine(t, k.x, k.y + 1, k.o, r);
  };
  N.iceberg = (t, e, a, r) => {
    let L = [];
    for (let n = 0; n < 4; n++) L.push({ x: e + (ee(n, 12) - 0.5) * 100, y: a + (ee(n, 13) - 0.5) * 70, o: 8 + ee(n, 14) * 14 });
    L.sort((p, q) => p.y - q.y);
    for (let k of L) {
      let x = Math.round(k.x),
        y = Math.round(k.y),
        o = Math.round(k.o),
        h = Math.round(o * 1.3);
      ve(t, x, y + 3, o + 5, (o + 5) * 0.45, "rgba(150,220,240,0.35)");
      for (let i = 0; i <= h; i++) {
        let q = i / h,
          w = Math.round(o * (q < 0.25 ? 0.35 + q * 1.6 : 0.75 + q * 0.25));
        Q(t, x - w, x + w, y - h + i, q < 0.3 ? "#ffffff" : q < 0.65 ? "#e4f2fa" : "#b4d4e8");
        m(t, x + w, y - h + i, "#8ab4d0"), i > 3 && m(t, x - Math.round(w * 0.2), y - h + i, "#cfe6f4");
      }
      ce(t, x - o * 0.3, y - h, x - o * 0.6, y - h * 0.5, "#ffffff"), ce(t, x + o * 0.2, y - h * 0.7, x + o * 0.5, y - 2, "#9ac4dc"), wLine(t, x, y + 1, o, r);
    }
  };
  N.island = (t, e, a, r, n = {}) => {
    var s;
    let i = n.r || 34,
      k = 0.56,
      g = n.ground || "#4f8a44",
      L = [];
    ve(t, e, a + 3, i + 9, (i + 9) * k, "rgba(130,215,220,0.35)"), ve(t, e, a + 2, i + 5, (i + 5) * k, "rgba(170,230,225,0.5)");
    for (let q = 0; q < 6.28; q += 0.16) Math.sin(q * 5 + r * 1.5) > 0.1 && m(t, e + Math.cos(q) * (i + 3), a + 2 + Math.sin(q) * (i + 3) * k, "rgba(245,252,255,0.9)");
    ve(t, e, a + 1, i + 1, (i + 1) * k, "#d8c68c"), ve(t, e, a, i, i * k, "#eedfae");
    for (let q = 0; q < i * 1.5; q++) m(t, e + (ee(q, 71) - 0.5) * i * 1.7, a + (ee(q, 72) - 0.5) * i * k * 1.7, ee(q, 73) > 0.5 ? "#d8c68c" : "#f8ecc4");
    // çimenli yükselti (güney yüzünde toprak yamaç)
    let gr = i - 6,
      gh = gr * k * 0.92;
    if (gr > 5) {
      ve(t, e, a, gr, gh, _t(g, -0.5)), ve(t, e, a - 1, gr, gh, "#7a5a36"), ve(t, e, a - 3, gr, gh, g);
      for (let q = 0; q < gr * 2; q++) {
        let px = e + (ee(q, 74) - 0.5) * gr * 1.6,
          py = a - 3 + (ee(q, 75) - 0.5) * gh * 1.5;
        m(t, px, py, ee(q, 76) > 0.5 ? _t(g, 0.14) : _t(g, -0.14));
      }
    }
    for (let o = 0; o < ((s = n.palms) != null ? s : 5); o++)
      L.push({ y: a - 3 + (ee(o, 16) - 0.5) * i * 0.7, fn: (yy) => palm(t, Math.round(e + (ee(o, 15) - 0.5) * i * 1.2), Math.round(yy), r, 0.8 + ee(o, 17) * 0.5) });
    if (n.ruins)
      for (let o = 0; o < 4; o++) {
        let x = Math.round(e - 14 + o * 9),
          y = a - 2 + (o % 2) * 5,
          h = 6 + ((o * 3) % 5);
        L.push({
          y,
          fn: (yy) => {
            yy = Math.round(yy);
            (t.fillStyle = "rgba(10,20,20,0.25)"), t.fillRect(x + 1, yy, 6, 2), b(t, x, yy - h, 4, h, "#cfc6b0"), Te(t, x + 3, yy - h, yy - 1, "#9a927e"), b(t, x - 1, yy - h - 2, 6, 2, "#e0d8c4"), Q(t, x - 1, x + 4, yy - 1, "#9a927e");
            o % 2 && m(t, x + 1, yy - h + 3, "#5a8a4a");
          },
        });
      }
    if (n.huts)
      for (let o = 0; o < 3; o++) {
        let x = Math.round(e - 20 + o * 14),
          y = a - 5 + (o % 2) * 5;
        L.push({ y, fn: (yy) => hut(t, x, Math.round(yy), 12, 7, "#a87a4a", "#c8a050", { seed: o }) });
      }
    n.lighthouse && L.push({ y: a - 5, fn: (yy) => tower(t, e + 10, Math.round(yy), Math.round(i * 0.55), r, { bands: !0, w: 5 }) });
    if (n.shipyard)
      L.push({
        y: a + 2,
        fn: (yy) => {
          yy = Math.round(yy);
          for (let o = 0; o < 7; o++) Te(t, e - 12 + o * 4, yy - 10 + Math.abs(o - 3), yy - 1, "#c8a070"), m(t, e - 12 + o * 4, yy, "#6a4424");
          Q(t, e - 14, e + 14, yy - 1, "#8a5a2b"), Q(t, e - 14, e + 14, yy, "#5c3a1e"), Te(t, e + 16, yy - 14, yy, "#5c3a1e"), ce(t, e + 16, yy - 14, e + 8, yy - 11, "#5c3a1e");
        },
      });
    if (n.villagers) for (let o = 0; o < 4; o++) L.push({ y: a + i * k * 0.72 + (o % 2) * 2, fn: (yy) => dS(t, ha(o % 2 ? "villagerF" : "villager", "down", Math.sin(r * 2 + o) > 0.6 ? "react" : "idle", 0), e - 24 + o * 16, yy) });
    n.shrine &&
      L.push({
        y: a + 1,
        fn: (yy) => {
          yy = Math.round(yy);
          b(t, e - 8, yy - 3, 16, 4, "#6a6a72"), b(t, e - 7, yy - 5, 14, 2, "#9a9aa2"), b(t, e - 5, yy - 12, 2, 8, "#b8b8c0"), b(t, e + 3, yy - 12, 2, 8, "#b8b8c0"), b(t, e - 6, yy - 14, 12, 2, "#c8c8d0");
          b(t, e - 2, yy - 10, 4, 5, "#f2c14e"), m(t, e - 1, yy - 9, "#7a4a10"), m(t, e + 1, yy - 9, "#7a4a10"), Math.sin(r * 3) > 0.3 && m(t, e + 3, yy - 12, "#fff6c0");
        },
      });
    L.sort((p, q) => p.y - q.y);
    for (let o of L) o.fn(o.y);
  };
  N.lightOrb = (t, e, a, r) => {
    let n = 5 + Math.sin(r * 2) * 1.5,
      y = a - 10 + Math.sin(r * 1.4) * 3;
    ve(t, e, a + 4, 9, 3, "rgba(160,255,210,0.25)"), H(t, e, y, n + 9, "rgba(120,255,190,0.10)"), H(t, e, y, n + 4, "rgba(160,255,210,0.3)"), H(t, e, y, n - 1, "#e8fff4"), m(t, e - 2, y - 2, "#ffffff");
  };
  N.whirlpool = (t, e, a, r) => {
    ve(t, e, a, 74, 40, "rgba(10,30,50,0.25)");
    for (let n = 0; n < 40; n += 0.07) {
      let i = n * 1.8,
        s = n + r * 2;
      m(t, e + Math.cos(s) * i, a + Math.sin(s) * i * 0.56, n % 1 < 0.5 ? "#e8f6fb" : "#6aa8c8");
    }
    ve(t, e, a, 7, 4, "#05101a"), ve(t, e, a + 1, 4, 2, "#000810");
  };
  N.fishSchool = (t, e, a, r, n = {}) => {
    let i = n.n || 26;
    for (let s = 0; s < i; s++) {
      let o = r * 1.4 + s * 0.6,
        l = e + Math.cos(o * 0.7 + s) * (8 + (s % 5) * 4),
        d = a + Math.sin(o + s * 1.7) * (5 + (s % 4) * 2),
        f = -Math.sin(o * 0.7 + s) > 0 ? 1 : -1;
      m(t, l, d + 1, "rgba(10,30,50,0.3)"), Q(t, l - 1, l + 1, d, Math.sin(r * 6 + s) > 0.3 ? "#e8f4fa" : "#9ac0d0"), m(t, l - f * 2, d, "#7aa0b4");
    }
  };
  N.shadow = (t, e, a, r, n = {}) => {
    var s;
    let i = n.s || 1;
    t.fillStyle = `rgba(5,15,30,${(s = n.a) != null ? s : 0.35})`;
    for (let o = -20; o <= 20; o++) {
      let l = Math.round(Math.sqrt(400 - o * o) * 0.9 * i);
      t.fillRect(Math.round(e - l / 2 + Math.sin(r + o * 0.2) * 2), Math.round(a + o * 2 * i), l, Math.ceil(2 * i));
    }
  };
  N.serpent = (t, e, a, r, n = {}) => {
    let D = "#1f5a42",
      M = "#2f7a5a",
      Lg = "#58b080",
      Y2 = "#d8e8a0";
    // sudan çıkan gövde kemerleri
    for (let l = 0; l < 5; l++) {
      let d = Math.round(e - 52 + l * 22),
        h = Math.round(7 + Math.sin(r * 2 + l * 1.3) * 4),
        p = a + 2;
      Za(t, d, p, 11, r);
      for (let x = -8; x <= 8; x++) {
        let top = Math.round(h * Math.sqrt(Math.max(0, 1 - (x * x) / 68)));
        if (top < 1) continue;
        Te(t, d + x, p - top, p, M), m(t, d + x, p - top, Lg), top > 3 && m(t, d + x, p - 1, D), top > 4 && (x + 20) % 4 === 0 && m(t, d + x, p - top + 2, D);
        top > 2 && x % 3 === 0 && m(t, d + x, p - top - 1, "#8ae0a0");
      }
      wLine(t, d, p + 1, 9, r);
    }
    // baş
    let s = Math.round(e + 62),
      o = Math.round(a - 20 + Math.sin(r * 2) * 3);
    Za(t, s - 2, a + 2, 9, r);
    for (let i = 0; i < 20; i++) Q(t, s - 6 + Math.round(Math.sin(i * 0.25) * 2), s + 2 + Math.round(Math.sin(i * 0.25) * 2), o + 4 + i, i % 4 === 0 ? D : M), m(t, s + 1 + Math.round(Math.sin(i * 0.25) * 2), o + 4 + i, Y2);
    b(t, s - 7, o - 5, 13, 10, M), b(t, s - 6, o - 6, 10, 1, M), Q(t, s - 6, s + 3, o - 6, Lg), b(t, s + 4, o - 2, 9, 6, M), Q(t, s + 4, s + 12, o - 2, Lg), b(t, s + 4, o + 3, 8, 2, D);
    b(t, s - 1, o - 3, 3, 3, "#f2e040"), m(t, s, o - 2, "#101010"), m(t, s + 11, o - 1, "#101010");
    for (let i = 0; i < 4; i++) m(t, s - 6 + i * 2, o - 7 - (i % 2), "#8ae0a0");
    if (n.roar) {
      b(t, s + 4, o + 3, 9, 4, "#8a1f2a"), Q(t, s + 4, s + 12, o + 7, D);
      for (let l = 0; l < 4; l++) m(t, s + 5 + l * 2, o + 3, "#ffffff"), m(t, s + 6 + l * 2, o + 6, "#ffffff");
      for (let l = 0; l < 3; l++) m(t, s + 16 + l * 3, o + 2 + l + Math.sin(r * 9) * 1, "#ffffff");
    }
    wLine(t, s - 2, a + 3, 6, r);
  };
  N.tentacles = (t, e, a, r) => {
    let L = [];
    for (let n = 0; n < 6; n++) L.push({ n, x: e + Math.cos(n * 1.05) * 46, y: a + Math.sin(n * 1.05) * 34 });
    L.sort((p, q) => p.y - q.y);
    for (let k of L) {
      let i = k.x,
        s = k.y,
        n = k.n;
      Za(t, i, s + 1, 9, r);
      // dikine yükselen, uçta kıvrılan kol
      for (let o = 0; o < 26; o++) {
        let q = o / 26,
          l = Math.max(1, Math.round(5 - q * 4)),
          sw = Math.sin(r * 2 + o * 0.25 + n) * (2 + q * 7),
          x = i + sw + (e - i) * q * 0.25,
          y = s - o * 1.25 + (q > 0.8 ? (q - 0.8) * 30 : 0);
        H(t, x, y, l, o % 5 < 2 ? "#7a1f3e" : "#8a2a4a"), m(t, x - l, y, "#a8405e"), o % 4 === 0 && l > 1 && m(t, x + l - 1, y, "#e8a0b0");
      }
      wLine(t, i, s + 2, 6, r);
    }
  };
  N.wave = (t, e, a, r, n = {}) => {
    let i = n.W || 640;
    for (let s = -40; s < i + 40; s++) {
      let o = 26 + Math.sin(s * 0.05 + r * 2) * 5 + Math.sin(s * 0.13 - r) * 2;
      for (let l = 0; l < o; l++) {
        let d = l < 3 ? "#ffffff" : l < 8 ? "#cfe8f0" : l < o * 0.55 ? "#4a96bc" : l < o * 0.8 ? "#2f78a6" : "#1f5a82";
        (l > 3 && (s + l) % 5 === 0 && l < 12) || m(t, s, a - o + l, d);
      }
      Math.sin(s * 0.3 + r * 5) > 0.7 && (m(t, s, a - o - 2, "#ffffff"), m(t, s + 1, a - o - 4, "#e8f6fb"));
      s % 3 === 0 && m(t, s, a + 1, "rgba(235,248,252,0.8)");
    }
  };
  N.fog = (t, e, a, r, n = {}) => {
    var s;
    let i = n.r || 60;
    for (let o = 0; o < 9; o++) {
      let l = e + (ee(o, 21) - 0.5) * i * 2 + Math.sin(r * 0.3 + o) * 6,
        d = a + (ee(o, 22) - 0.5) * i;
      ve(t, l, d, i * 0.4, i * 0.26, `rgba(220,228,232,${(s = n.a) != null ? s : 0.22})`);
    }
  };
  N.fire = (t, e, a, r, n = {}) => {
    let i = n.n || 10;
    H(t, e, a - 3, (n.w || 14) * 0.6, "rgba(255,170,60,0.12)");
    for (let s = 0; s < i; s++) {
      let o = e + (ee(s, 23) - 0.5) * (n.w || 14),
        l = a + (ee(s, 24) - 0.5) * (n.h || 10) * 0.5,
        d = (r * 3 + s * 0.37) % 1;
      H(t, o, l - d * 9, 2.4 - d * 1.6, d < 0.35 ? "#fff0a0" : d < 0.7 ? "#ffb040" : "#e0502a");
    }
    for (let s = 0; s < 3; s++) m(t, e + Math.sin(r * 2 + s) * 3, a - 12 - ((r * 10 + s * 5) % 9), "rgba(80,80,80,0.55)");
  };
  N.bell = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.7)),
      sw = Math.round(Math.sin(r * 3) * 1.5);
    Za(t, e, a + 2, 10, r), b(t, e - 6, y - 4, 12, 5, "#8a2a26"), Q(t, e - 6, e + 5, y - 4, "#c8423b"), Q(t, e - 5, e + 4, y + 1, "#5a1a16"), Q(t, e - 6, e + 5, y - 2, "#f4ead5");
    ce(t, e - 5, y - 4, e - 1, y - 17, "#3a3a44"), ce(t, e + 5, y - 4, e + 1, y - 17, "#3a3a44"), Q(t, e - 2, e + 2, y - 17, "#3a3a44");
    b(t, e - 2 + sw, y - 15, 5, 5, "#c8a040"), Q(t, e - 3 + sw, e + 3 + sw, y - 10, "#a07a20"), m(t, e - 1 + sw, y - 14, "#fff0a0"), m(t, e + sw * 2, y - 9, "#5a4a10");
    if (Math.sin(r * 3) > 0.7) for (let n = 0; n < 3; n++) m(t, e + 8 + n * 3, y - 16 - n, "#f4ead5"), m(t, e - 8 - n * 3, y - 16 - n, "#f4ead5");
    wLine(t, e, y + 2, 7, r);
  };
  N.dockPets = (t, e, a, r) => {
    dS(t, pa("PET_TARCIN", "down", Math.sin(r * 5) > 0 ? "wag1" : "wag0"), e - 8, a + 2), dS(t, pa("PET_ZIPIR", "down", "sit"), e + 9, a + 3);
  };
  N.catBoat = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.8));
    Za(t, e, a + 6, 12, r), boatHull(t, e, y, 30, 8, "up"), dS(t, pa("PET_ZIPIR", "down", Math.sin(r * 2) > 0.7 ? "bark" : "sit"), e, y + 6), Q(t, e - 7, e + 7, y + 7, "#8a5a2b"), wLine(t, e, y + 20, 9, r);
  };
  N.dogRock = (t, e, a, r) => {
    Za(t, e, a + 2, 17, r), rock(t, e, a + 2, 13, "#62626c"), wLine(t, e, a + 3, 13, r), dS(t, pa("PET_TARCIN", "left", Math.sin(r * 3) > 0.6 ? "bark" : "sit"), e, a - 8);
  };
  N.shrine = (t, e, a, r) => N.island(t, e, a, r, { r: 24, palms: 1, shrine: !0, ground: "#6a7a62" });
  N.turtle = (t, e, a, r) => {
    let fp = Math.sin(r * 2) * 2;
    Za(t, e, a + 1, 15, r * 0.5, 0.4), ve(t, e, a + 2, 13, 7, "rgba(10,30,50,0.25)");
    for (let n of [-1, 1]) ce(t, e + n * 9, a - 3, e + n * 15, a - 6 + fp, "#5a8a50"), ce(t, e + n * 9, a - 2, e + n * 15, a - 5 + fp, "#6aa060"), ce(t, e + n * 8, a + 3, e + n * 12, a + 6, "#5a8a50");
    b(t, e - 2, a - 12, 5, 5, "#6aa060"), m(t, e - 1, a - 10, "#101010"), m(t, e + 1, a - 10, "#101010"), Q(t, e - 2, e + 2, a - 12, "#8ac080");
    ve(t, e, a, 11, 7, "#2f5a32"), ve(t, e, a - 1, 10, 6, "#4a8a4a"), ve(t, e - 2, a - 3, 5, 2, "#6aa860");
    for (let [n, i] of [
      [-5, -2],
      [5, -2],
      [0, 0],
      [-4, 3],
      [4, 3],
    ])
      H(t, e + n, a + i, 1, "#2f5a32");
  };
  N.flyingFish = (t, e, a, r) => {
    for (let n = 0; n < 10; n++) {
      let i = (r * 0.7 + n * 0.13) % 1,
        s = e - 80 + i * 160,
        o = a + (n - 5) * 6,
        h = Math.sin(i * Math.PI) * 12;
      Q(t, s, s + 3, o + 2, "rgba(0,0,0,0.2)"), Q(t, s, s + 4, o - h, "#d8eef6"), m(t, s + 4, o - h, "#7aa0b4"), m(t, s + 1, o - h - 1, "#ffffff"), m(t, s + 2, o - h - 2, "#bfe3ef"), m(t, s + 2, o - h + 1, "#ffffff"), m(t, s - 1, o - h - 1, "#9ac0d0");
      (i < 0.08 || i > 0.92) && (m(t, s, o, "#ffffff"), m(t, s + 2, o - 1, "#ffffff"));
    }
  };
  N.passenger = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.8));
    Za(t, e, a + 6, 12, r), H(t, e, y - 8, 11, "rgba(140,255,210,0.10)"), boatHull(t, e, y, 30, 8, "up", "#4a6a5a", "#2a4a3e"), boatSeat(t, "ghost", e, y + 5, "down"), Q(t, e - 7, e + 7, y + 6, "#4a6a5a");
    b(t, e + 7, y - 12, 3, 4, "#3a2a1a"), b(t, e + 8, y - 11, 1, 2, Math.sin(r * 5) > 0 ? "#8affd0" : "#5ac8a0"), wLine(t, e, y + 20, 9, r);
  };
  N.idol = (t, e, a, r) => {
    b(t, e - 4, a - 1, 8, 2, "#8a6a20"), b(t, e - 3, a - 8, 6, 7, "#f2c14e"), b(t, e - 4, a - 13, 8, 5, "#f2c14e"), Q(t, e - 3, e + 2, a - 14, "#fff0a0"), Te(t, e + 3, a - 12, a - 2, "#c89030"), Te(t, e - 4, a - 12, a - 9, "#fff0a0");
    m(t, e - 2, a - 11, "#7a4a10"), m(t, e + 1, a - 11, "#7a4a10"), Q(t, e - 1, e, a - 9, "#7a4a10"), m(t, e - 1, a - 5, "#c8423b"), m(t, e, a - 5, "#c8423b"), Q(t, e - 3, e + 2, a - 3, "#c89030");
    Math.sin(r * 3) > 0.5 && (m(t, e + 5, a - 14, "#fff6c0"), m(t, e - 6, a - 9, "#fff6c0"));
  };
