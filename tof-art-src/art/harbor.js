  // ===== 3/4 bakış: liman kasabası, iskele, kıyı =====
  var rn = {
      fishing: { roofs: ["#8a6a3a", "#6a4a2a", "#9a7a44", "#7a5a34"], wall: ["#c8a070", "#b89060", "#d8b888"], ground: "#7aa060", g2: "#6a9052", path: "#c8b488" },
      trade: { roofs: ["#b8482b", "#c86a3a", "#3b6ea5", "#d8b85a"], wall: ["#f0e4c8", "#e8d8b0", "#f4ead5"], ground: "#b8a888", g2: "#a89878", path: "#d8c8a0", stalls: !0, paved: !0 },
      military: { roofs: ["#4a5a7a", "#5a5a62", "#3a4a66"], wall: ["#a8a8a0", "#98988e", "#b8b8ae"], ground: "#8a8a82", g2: "#7a7a72", path: "#a8a89e", walls: !0, paved: !0 },
      pirate: { roofs: ["#3a2a20", "#2a2026", "#4a3424"], wall: ["#7a5a3a", "#6a4a30", "#8a6a44"], ground: "#6a6a52", g2: "#5a5a46", path: "#8a7a5a", flags: !0 },
      fog: { roofs: ["#4a5460", "#5a6470", "#3e4852"], wall: ["#8a949c", "#7a848c", "#9aa4ac"], ground: "#6a7a7a", g2: "#5e6e6e", path: "#8a9a98", lamps: !0, paved: !0 },
      mystery: { roofs: ["#3a5a3a", "#4a6a3a", "#5a4a2a"], wall: ["#a88a5a", "#98784a", "#b89a68"], ground: "#3f6f3a", g2: "#356232", path: "#7a8a52", jungle: !0 },
      volcanic: { roofs: ["#1a1414", "#5a2a1e", "#2a1e1e"], wall: ["#5a4a48", "#4a3c3a", "#6a5856"], ground: "#3a3032", g2: "#30282a", path: "#4a3e40", lava: !0 },
      ice: { roofs: ["#f4fbff", "#e8f4fa", "#d8ecf6"], wall: ["#8a7a6a", "#7a6a5a", "#9a8a78"], ground: "#dfe9f0", g2: "#cddbe6", path: "#eef4f8", snow: !0 },
      final: { roofs: ["#e0b040", "#3b6ea5", "#b8482b", "#f0e4c8"], wall: ["#f4ead5", "#ece0c4", "#fff6e0"], ground: "#c8b890", g2: "#b8a880", path: "#e8dcb8", grand: !0, paved: !0, stalls: !0 },
    },
    tn = new Map();
  function So(t, e, a, r, n, i = 1) {
    let s = `${r}|${i}|${a}`,
      o = tn.get(s);
    o || (tn.size > 12 && tn.clear(), (o = Qe(560, a)), Pc(o.getContext("2d"), 0, a, r, i), tn.set(s, o)), t.drawImage(o, Math.round(e), 0);
    // fener ışığı + pencere ışıltıları
    let lx = Math.round(e) + 52;
    b(t, lx - 2, 12, 5, 3, Math.sin(n * 3) > 0 ? "#fff0a0" : "#f2c14e"), H(t, lx, 13, 8, `rgba(255,240,170,${0.12 + 0.06 * Math.sin(n * 3)})`);
    if ((rn[r] || rn.trade).lava) for (let k = 0; k < 6; k++) m(t, Math.round(e) + 90 + ee(k, 5, i) * 300, ee(k, 6, i) * a - ((n * 12 + k * 9) % 18), Math.sin(n * 7 + k) > 0 ? "#ffb040" : "#ff5a20");
  }
  function Pc(t, e, a, r, n) {
    let i = rn[r] || rn.trade,
      s = 560,
      gx = e + 26;
    // zemin dokusu
    b(t, gx, 0, s, a, i.ground);
    for (let q = 0; q < 2600; q++) {
      let x = gx + ee(q, 1, n) * (s - 30),
        y = ee(q, 2, n) * a,
        v = ee(q, 3, n);
      i.paved ? (b(t, x, y, 3, 2, v > 0.5 ? i.g2 : _t(i.ground, 0.08)), m(t, x, y + 2, _t(i.g2, -0.1))) : (m(t, x, y, v > 0.5 ? i.g2 : _t(i.ground, 0.1)), v > 0.9 && m(t, x, y - 1, _t(i.ground, 0.18)));
    }
    // rıhtım taşı (iskelenin karayla birleştiği kenar)
    b(t, gx, 0, 10, a, "#8a8478"), Te(t, gx, 0, a, "#5a564e"), Te(t, gx + 9, 0, a, "#6a665c"), Te(t, gx + 1, 0, a, "#b0aa9c");
    for (let y = 0; y < a; y += 8) Q(t, gx + 1, gx + 8, y, "#6a665c");
    // sokaklar
    let rows = [];
    for (let y = 44; y < a + 40; y += 78) rows.push(y);
    for (let y of rows) b(t, gx + 10, y - 7, s, 12, i.path), Q(t, gx + 10, gx + s, y - 8, _t(i.path, -0.12)), Q(t, gx + 10, gx + s, y + 5, _t(i.path, -0.18));
    b(t, gx + 196, 0, 14, a, i.path), Te(t, gx + 195, 0, a, _t(i.path, -0.12)), Te(t, gx + 210, 0, a, _t(i.path, -0.18));
    // çizim listesi (y'ye göre sıralı)
    let L = [],
      add = (y, fn) => L.push({ y, fn });
    for (let ri = -1; ri < rows.length; ri++) {
      let y0 = ri < 0 ? rows[0] - 78 : rows[ri];
      for (let sub = 0; sub < 2; sub++) {
        let by = y0 + 34 + sub * 30,
          x = gx + 18 + (sub ? 9 : 0) + Math.round(ee(ri, sub, n) * 8);
        while (x < gx + 500) {
          let d = ee(x, by, n),
            w = 20 + Math.round(d * 12),
            hh = 10 + Math.round(ee(by, x, n) * 5),
            gap = 5 + Math.round(ee(x, ri, n + 7) * 9);
          if (x + w > gx + 192 && x < gx + 214) {
            x = gx + 216;
            continue;
          }
          if (i.grand && x + w > gx + 76 && x < gx + 184 && by > a * 0.46 - 34 && by < a * 0.46 + 44) {
            x += w + gap;
            continue;
          }
          if (d > 0.14) {
            let roof = i.roofs[Math.floor(d * 10) % i.roofs.length],
              wall = i.wall[Math.floor(ee(x, 3, n) * 3) % 3],
              X = Math.round(x),
              kind = d > 0.93 ? "tower" : i.stalls && d < 0.3 ? "stall" : i.jungle && d < 0.4 ? "tree" : "house";
            add(by, () => {
              if (kind === "house") {
                hut(t, X, by, w, hh, wall, roof, { rh: 9 + Math.round(d * 6), win: !0, lit: ee(X, by, n + 3) > 0.6, seed: X });
                i.snow && (Q(t, X - 1, X + w, by - hh - 1, "#ffffff"), Q(t, X + 2, X + w - 3, by - hh - (9 + Math.round(d * 6)), "#ffffff"));
                i.lava && d > 0.7 && (b(t, X + 2, by - hh + 2, 2, 2, "#ff6a2a"), m(t, X + w - 4, by - 3, "#ffb040"));
                d > 0.6 && (b(t, X + w - 6, by - hh - (9 + Math.round(d * 6)) - 3, 3, 5, _t(wall, -0.3)), i.snow && Q(t, X + w - 6, X + w - 4, by - hh - (9 + Math.round(d * 6)) - 4, "#fff"));
              } else if (kind === "stall") {
                let c = ["#c8423b", "#3b6ea5", "#5a9e4b", "#e0b040"][X % 4];
                b(t, X + 2, by - 6, w - 6, 6, "#8a5a2b"), Q(t, X + 2, X + w - 5, by - 6, "#b07a42");
                for (let k = 0; k < w - 6; k += 4) m(t, X + 3 + k, by - 8, ["#e07b39", "#c8423b", "#f2c14e", "#8b5bb5"][(k / 4) % 4]), m(t, X + 4 + k, by - 7, ["#5a9e4b", "#f2c14e", "#e07b39"][(k / 4) % 3]);
                Te(t, X + 2, by - 16, by - 6, "#5c3a1e"), Te(t, X + w - 5, by - 16, by - 6, "#5c3a1e");
                for (let k = 0; k < 5; k++) for (let x2 = X; x2 < X + w - 2; x2++) m(t, x2, by - 20 + k, Math.floor((x2 - X) / 3) % 2 ? c : "#f4ead5");
                Q(t, X, X + w - 3, by - 15, _t(c, -0.3));
              } else if (kind === "tree") palm(t, X + 8, by, 0, 1.2), palm(t, X + 18, by - 4, 0, 1);
              else {
                // kule / büyük yapı
                b(t, X + 4, by - 30, 14, 30, wall), Te(t, X + 17, by - 30, by - 1, _t(wall, -0.22)), b(t, X + 9, by - 6, 4, 6, "#3a2412"), b(t, X + 9, by - 22, 4, 5, "#3a4a66"), b(t, X + 9, by - 14, 4, 4, "#3a4a66");
                for (let k = 0; k < 7; k++) Q(t, X + 3 + k, X + 18 - k, by - 31 - k, k === 6 ? _t(roof, 0.2) : roof);
                Q(t, X + 3, X + 18, by - 31, _t(roof, -0.3)), Te(t, X + 11, by - 44, by - 38, "#3a2412"), b(t, X + 12, by - 44, 5, 3, i.flags ? "#0a0a0a" : "#c8423b");
              }
            });
          } else if (d < 0.07) add(by - 2, () => (dS(t, deckBarrel("#8a5a2b"), x + 6, by), dS(t, Ca("GOOD_GRAIN"), x + 15, by + 1)));
          x += w + gap;
        }
      }
    }
    // tür süsleri
    if (i.walls) {
      // sur + burçlar (rıhtım boyunca)
      b(t, gx + 10, 0, 9, a, "#7a7a82"), Te(t, gx + 10, 0, a, "#9a9aa2"), Te(t, gx + 18, 0, a, "#5a5a62");
      for (let y = 0; y < a; y += 7) b(t, gx + 9, y, 11, 4, "#8a8a92"), Q(t, gx + 9, gx + 19, y, "#a8a8b0"), Q(t, gx + 9, gx + 19, y + 3, "#5a5a62");
      for (let y = 60; y < a; y += 130)
        add(y + 8, () => {
          b(t, gx + 4, y - 18, 20, 26, "#8a8a92"), Te(t, gx + 23, y - 18, y + 7, "#5a5a62"), Q(t, gx + 4, gx + 23, y - 18, "#b0b0b8");
          for (let k = 0; k < 4; k++) b(t, gx + 4 + k * 6, y - 21, 3, 3, "#9a9aa2");
          b(t, gx + 12, y - 2, 4, 10, "#2a2a30"), cannonDraw(t, gx + 8, y - 12, -1, 0), Te(t, gx + 20, y - 34, y - 21, "#3a2412"), b(t, gx + 21, y - 34, 6, 4, "#3b6ea5");
        });
    }
    if (i.jungle) for (let o = 0; o < 26; o++) add(ee(o, 2, n) * a, () => palm(t, Math.round(gx + 40 + ee(o, 1, n) * 420), Math.round(ee(o, 2, n) * a), 0, 1 + ee(o, 3, n) * 0.6));
    if (i.flags)
      for (let o = 0; o < 5; o++) {
        let x = gx + 50 + o * 84,
          y = 34 + o * 66;
        add(y, () => {
          Te(t, x, y - 22, y, "#3a2412"), b(t, x + 1, y - 22, 9, 6, "#0a0a0a"), b(t, x + 4, y - 20, 3, 2, "#ffffff"), m(t, x + 5, y - 18, "#ffffff");
          b(t, x - 12, y - 8, 2, 8, "#5c3a1e"), m(t, x - 12, y - 10, "#ffb040"), m(t, x - 11, y - 9, "#ff6a2a"), H(t, x - 11, y - 9, 4, "rgba(255,170,60,0.18)");
        });
      }
    if (i.lamps) for (let o = 0; o < 9; o++) {
        let x = gx + 40 + o * 52,
          y = rows[o % rows.length] + 4;
        add(y, () => (Te(t, x, y - 14, y, "#2a2a30"), b(t, x - 1, y - 17, 3, 3, "#ffe8a0"), H(t, x, y - 16, 7, "rgba(255,240,170,0.16)")));
      }
    if (i.lava) for (let o = 0; o < 18; o++) {
        let x = gx + 30 + ee(o, 5, n) * 440,
          y = ee(o, 6, n) * a;
        for (let k = 0; k < 9; k++) m(t, x + k + Math.sin(k) * 2, y + k * 0.6 + Math.cos(k * 1.3) * 1.5, k % 3 ? "#e0502a" : "#ffb040");
      }
    if (i.snow) for (let o = 0; o < 14; o++) add(ee(o, 8, n) * a, () => {
          let x = Math.round(gx + 24 + ee(o, 7, n) * 460),
            y = Math.round(ee(o, 8, n) * a);
          // çam
          Te(t, x, y - 3, y, "#5a3a1e");
          for (let k = 0; k < 4; k++) Q(t, x - 1 - k, x + 1 + k, y - 12 + k * 3, "#2f5e45"), Q(t, x - k, x + k, y - 13 + k * 3, "#ffffff"), Q(t, x - 1 - k, x + 1 + k, y - 11 + k * 3, "#24493a");
        });
    if (i.grand)
      add(a * 0.46 + 30, () => {
        let x = gx + 128,
          y = Math.round(a * 0.46) + 30;
        b(t, x - 44, y - 30, 88, 30, "#f4ead5"), Te(t, x + 43, y - 30, y - 1, "#c8bc9c"), b(t, x - 48, y - 4, 96, 5, "#d8cca8"), Q(t, x - 48, x + 47, y - 4, "#fff6e0");
        for (let k = 0; k < 8; k++) b(t, x - 40 + k * 11, y - 28, 3, 24, "#ffffff"), Te(t, x - 38 + k * 11, y - 28, y - 5, "#c8bc9c");
        b(t, x - 5, y - 16, 10, 12, "#5a3a20"), b(t, x - 4, y - 15, 8, 2, "#e0b040"), b(t, x - 46, y - 34, 92, 5, "#e0b040"), Q(t, x - 46, x + 45, y - 34, "#fff0a0");
        for (let k = 0; k < 20; k++) {
          let ww = Math.round(Math.sqrt(400 - (20 - k) * (20 - k)) * 1.1);
          Q(t, x - ww, x + ww, y - 54 + k, k < 6 ? "#fff0b0" : k < 14 ? "#f0d070" : "#e0b040"), m(t, x + ww, y - 54 + k, "#b88a2a");
        }
        Te(t, x, y - 64, y - 54, "#b88a2a"), b(t, x + 1, y - 64, 7, 4, "#8b5bb5"), H(t, x, y - 55, 2, "#fff6c0");
        for (let k of [-1, 1]) Te(t, x + k * 52, y - 26, y, "#5c3a1e"), b(t, x + k * 52 + 1, y - 26, 7, 12, "#8b5bb5"), b(t, x + k * 52 + 3, y - 23, 3, 3, "#f2c14e");
      });
    // deniz feneri (sol üst)
    add(40, () => tower(t, gx + 26, 40, 24, 0, { bands: !0, w: 5, lit: !1 }));
    L.sort((p, q) => p.y - q.y);
    for (let o of L) o.fn();
  }
  function Co(t, e, a) {
    // ahşap iskele (gemiyle rıhtım arasında)
    (t.fillStyle = "rgba(8,20,40,0.3)"), t.fillRect(e - 3, 0, 3, a);
    b(t, e, 0, 28, a, "#8a5a34");
    for (let r = 0; r < a; r += 5) Q(t, e, e + 27, r, "#5c3a1e"), Q(t, e, e + 27, r + 1, "#a06e40"), (r / 5) % 3 === 0 && m(t, e + 6 + ((r * 7) % 15), r + 3, "#5c3a1e");
    Te(t, e, 0, a, "#3a2414"), Te(t, e + 1, 0, a, "#b88450"), Te(t, e + 27, 0, a, "#3a2414");
    for (let r = 14; r < a; r += 44) {
      // babalar + halat
      b(t, e - 2, r - 6, 5, 8, "#3a2414"), b(t, e - 1, r - 7, 3, 2, "#8a6034"), Te(t, e - 1, r - 5, r + 1, "#6a4424"), Q(t, e - 2, e + 2, r - 3, "#c8a070");
      (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e + 3, r, 3, 2);
    }
    for (let r = 34; r < a; r += 96) {
      dS(t, Ca("GOOD_TIMBER"), e + 19, r + 2), dS(t, Ca("GOOD_GRAIN"), e + 17, r + 14), dS(t, deckBarrel("#8a5a2b"), e + 21, r + 40), dS(t, Ca("GOOD_SPICE"), e + 12, r + 52);
      // fener direği
      Te(t, e + 24, r - 26, r - 12, "#2a2a30"), b(t, e + 23, r - 29, 3, 3, "#ffe8a0"), m(t, e + 24, r - 30, "#2a2a30");
    }
  }
  function Io(t, e, a, r, n) {
    // Yaklaşılan kıyı (ekranın üstünde): kumsal + önden görünen evler
    let i = rn[n] || rn.trade,
      top = a - 90;
    for (let s = 0; s < e; s++) {
      let o = Math.round(Math.sin(s * 0.03) * 4 + Math.sin(s * 0.11) * 2),
        sy = a + o;
      b(t, s, top, 1, sy - top - 5, i.ground), b(t, s, sy - 5, 1, 4, n === "ice" ? "#f4fbff" : n === "volcanic" ? "#4a3e40" : "#e6d6a0"), m(t, s, sy - 1, n === "ice" ? "#d8ecf6" : n === "volcanic" ? "#3a3032" : "#d0bc84");
      m(t, s, sy, "rgba(200,240,245,0.7)"), Math.sin(s * 0.5 + r * 2) > 0.3 && m(t, s, sy + 1 + (Math.sin(s * 0.2 + r) > 0 ? 1 : 0), "#ffffff");
      (s * 7) % 5 === 0 && m(t, s, sy - 9 - ((s * 13) % 17), i.g2);
    }
    let L = [];
    for (let s = 0; s < 13; s++) {
      let x = 22 + s * 50 + ((s * 37) % 11),
        y = a - 9 - (s % 3) * 4;
      n === "mystery" || (n === "fishing" && s % 4 === 3)
        ? L.push({ y, fn: () => palm(t, x + 6, y, r, 1.1) })
        : L.push({
            y,
            fn: () => {
              hut(t, x, y, 16, 8, i.wall[s % 3], i.roofs[s % i.roofs.length], { rh: 8, win: !0, lit: !0, seed: s });
              n === "ice" && Q(t, x - 1, x + 16, y - 9, "#ffffff");
            },
          });
    }
    L.push({ y: a - 8, fn: () => tower(t, Math.round(e * 0.8), a - 8, 22, r, { bands: !0, w: 4 }) });
    if (n === "military") for (let s = 0; s < e; s += 9) L.push({ y: a - 6.5, fn: () => (b(t, s, a - 13, 7, 6, "#8a8a92"), Q(t, s, s + 6, a - 13, "#b0b0b8"), b(t, s + 1, a - 15, 2, 2, "#9a9aa2"), b(t, s + 5, a - 15, 2, 2, "#9a9aa2")) });
    n === "pirate" && L.push({ y: a - 7, fn: () => (Te(t, e * 0.2, a - 30, a - 8, "#3a2412"), b(t, e * 0.2 + 1, a - 30, 9, 6, "#0a0a0a"), b(t, e * 0.2 + 4, a - 28, 3, 2, "#fff")) });
    n === "final" &&
      L.push({
        y: a - 7.5,
        fn: () => {
          let x = Math.round(e * 0.45);
          b(t, x - 20, a - 22, 40, 14, "#f4ead5");
          for (let k = 0; k < 12; k++) Q(t, x - Math.round(Math.sqrt(144 - (12 - k) * (12 - k))), x + Math.round(Math.sqrt(144 - (12 - k) * (12 - k))), a - 34 + k, k < 5 ? "#fff0b0" : "#e0b040");
        },
      });
    L.sort((p, q) => p.y - q.y);
    for (let o of L) o.fn();
    if (n === "volcanic") for (let s = 0; s < 6; s++) H(t, e * 0.3 + Math.sin(r + s) * 4, a - 34 - s * 6, 4, "rgba(60,50,50,0.5)");
  }
