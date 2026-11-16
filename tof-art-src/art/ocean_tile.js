  // ===== Açık deniz: döşenebilir su dokusu (3 katman, 2 kare animasyon) =====
  var zo = {
      calm: { base: "#2f78a6", deep: "#26668f", crest: "#7cc4e0", foam: "#e8f6fb" },
      open: { base: "#2a6a96", deep: "#1f5a82", crest: "#6ab4d4", foam: "#e0f2f8" },
      dark: { base: "#1b3a58", deep: "#142e48", crest: "#4a7aa0", foam: "#b8d0e0" },
      storm: { base: "#22405a", deep: "#18304a", crest: "#8aa4b8", foam: "#e8f0f4" },
      ice: { base: "#4a88a8", deep: "#3a7896", crest: "#c8e8f4", foam: "#ffffff" },
      eerie: { base: "#2a5a6a", deep: "#2a4060", crest: "#8af0c8", foam: "#d0fff0" },
      ash: { base: "#2a3a46", deep: "#202c36", crest: "#6a7a84", foam: "#c0c8cc" },
      tropical: { base: "#2a9aa8", deep: "#1f8494", crest: "#8ae8e8", foam: "#ffffff" },
    },
    Je = 256,
    li = new Map();
  function seaMix(a, c, q) {
    let p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)],
      A = p(a),
      C = p(c);
    return `rgb(${Math.round(A[0] + (C[0] - A[0]) * q)},${Math.round(A[1] + (C[1] - A[1]) * q)},${Math.round(A[2] + (C[2] - A[2]) * q)})`;
  }
  function ci(t, e, f = 0) {
    let a = t.base + e + "|" + f;
    if (li.has(a)) return li.get(a);
    let r = Qe(Je, Je),
      n = r.getContext("2d"),
      // sarmalı (tile kenarından taşan) yatay çizgi
      hl = (x, y, w, c) => {
        (x = ((Math.round(x) % Je) + Je) % Je), (y = ((Math.round(y) % Je) + Je) % Je), (n.fillStyle = c), n.fillRect(x, y, w, 1), x + w > Je && n.fillRect(0, y, x + w - Je, 1);
      };
    if (e === 0) {
      b(n, 0, 0, Je, Je, t.base);
      // geniş, yumuşak ton lekeleri (derin / aydınlık su)
      for (let i = 0; i < 22; i++) {
        let cx = ee(i, 1, 9) * Je,
          cy = ee(i, 2, 9) * Je,
          rx = 26 + ee(i, 3, 9) * 38,
          ry = rx * 0.42,
          c = i % 4 === 0 ? seaMix(t.base, t.crest, 0.07) : seaMix(t.base, t.deep, i % 3 === 0 ? 0.5 : 0.28);
        for (let dy = -Math.ceil(ry); dy <= ry; dy++) {
          let h = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))),
            jag = Math.round(ee(i, dy, 5) * 5);
          h > 2 && hl(cx - h + jag, cy + dy, h * 2 - jag * 2 + Math.round(ee(dy, i, 6) * 4), c);
        }
      }
      // ince akıntı çizgileri
      for (let i = 0; i < 150; i++) hl(ee(i, 4, 11) * Je, ee(i, 5, 11) * Je, 3 + Math.floor(ee(i, 6, 11) * 9), seaMix(t.base, t.deep, 0.7));
      for (let i = 0; i < 60; i++) hl(ee(i, 7, 11) * Je, ee(i, 8, 11) * Je, 2 + Math.floor(ee(i, 9, 11) * 5), seaMix(t.base, t.crest, 0.18));
    } else if (e === 1) {
      // dalgacıklar: açık renkli sırt + altında koyu gölge (üst-karşı bakışta küçük kavisler)
      let sh = seaMix(t.base, t.deep, 1),
        cr = t.crest,
        cr2 = seaMix(t.base, t.crest, 0.72);
      for (let gy = 0; gy < 13; gy++)
        for (let gx = 0; gx < 9; gx++) {
          let i = gy * 9 + gx;
          if (ee(i, 1, 21) < 0.16) continue;
          let L = 6 + Math.floor(ee(i, 2, 21) * 11) + (f ? (i % 2 ? 1 : -1) : 0),
            x = gx * 28.4 + ee(i, 3, 21) * 22 + (gy % 2) * 14 + (f ? (i % 3) - 1 : 0),
            y = gy * 19.7 + ee(i, 4, 21) * 13,
            big = ee(i, 5, 21) > 0.5;
          hl(x + 1, y, L - 2, big ? cr : cr2), hl(x, y + 1, 1, big ? cr : cr2), hl(x + L - 1, y + 1, 1, big ? cr : cr2), hl(x + 1, y + 1, L - 2, sh);
          big && (hl(x + 2, y + 2, L - 4, seaMix(t.base, t.deep, 0.6)), hl(x + L + 1, y + 2, 2 + (i % 3), cr2));
          big && (f === i % 2 ? hl(x + Math.floor(L / 2) - 1, y - 1, 2, t.foam) : hl(x + Math.floor(L / 2), y, 2, t.foam));
        }
    } else {
      // köpük çizgileri + parıltılar
      for (let i = 0; i < 34; i++) {
        let x = ee(i, 4, 7 + e) * Je,
          y = ee(i, 5, 7 + e) * Je,
          l = 2 + Math.floor(ee(i, 6, 7) * 6);
        n.globalAlpha = 0.7;
        hl(x + (f ? 1 : 0), y, l, t.foam), l > 4 && hl(x + 2, y + 1, l - 3, t.foam);
        n.globalAlpha = 1;
        if (i % 4 === f * 2) {
          let gx2 = ee(i, 8, 3) * Je,
            gy2 = ee(i, 9, 3) * Je;
          hl(gx2, gy2, 2, "#ffffff");
        }
      }
    }
    return li.set(a, r), r;
  }
  function di(t, e, a, r, n, i) {
    let s = ((n % Je) + Je) % Je,
      o = ((i % Je) + Je) % Je;
    for (let l = -Je; l < r + Je; l += Je) for (let d = -Je; d < a + Je; d += Je) t.drawImage(e, Math.round(d + s - Je), Math.round(l + o - Je));
  }
