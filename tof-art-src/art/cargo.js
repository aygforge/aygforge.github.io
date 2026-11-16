  // ===== 3/4 bakış: kargo =====
  var oi = new Map();
  function Mc(t, e, a, r) {
    if (oi.has(t)) return oi.get(t);
    let n = Qe(e, a);
    r(n.getContext("2d"));
    let o = wc(n, "rgba(30,16,8,0.85)");
    return (o.ax = e / 2), (o.ay = a - 1), oi.set(t, o), o;
  }
  var Oc = {
    GOOD_GRAIN: "sack:#d8b878",
    GOOD_SALT: "sack:#eeeae0",
    GOOD_FISH: "basket:#a8c8d8",
    GOOD_TIMBER: "logs:#8a5a2b",
    GOOD_SANDSTONE: "stone:#d4b48a",
    GOOD_SPICE: "crate:#e07b39",
    GOOD_SILK: "bolt:#8b5bb5",
    GOOD_OLIVE_OIL: "barrel:#5a8a3a",
    GOOD_WINE: "barrel:#8e2a2a",
    GOOD_PORCELAIN: "crate:#3b6ea5",
    GOOD_GOLD_BAR: "chest:#f2c14e",
    GOOD_ANTIQUE: "chest:#a8805c",
    GOOD_EXOTIC_ANIMAL: "cage:#c8423b",
    GOOD_CHARM_DUST: "crate:#a56de2",
    GOOD_BISCUIT_CRATE: "crate:#d9b48f",
    GOOD_PIRATE_CHEST: "chest:#2a2026",
  };
  // Kargo sprite'ı: 12x15, alt-orta noktası zemine basar (dS ile çizilir)
  function Ca(t, e = !1) {
    let [a, r] = (Oc[t] || "crate:#a87a4a").split(":");
    return Mc(`cargo|${t}|${e}`, 12, 15, (n) => {
      let W = "#a87a4a",
        WL = "#c89a62",
        WD = "#6a4424";
      switch (a) {
        case "sack":
          b(n, 2, 5, 8, 8, r), b(n, 1, 7, 10, 5, r), b(n, 3, 13, 6, 1, _t(r, -0.25)), b(n, 4, 3, 4, 2, r), Q(n, 4, 7, 4, "#6a4a2a"), m(n, 3, 2, r), m(n, 8, 2, r);
          Te(n, 9, 7, 12, _t(r, -0.18)), Te(n, 10, 8, 11, _t(r, -0.25)), Q(n, 3, 5, 6, _t(r, 0.3)), m(n, 2, 8, _t(r, 0.3)), Q(n, 2, 9, 12, _t(r, -0.18));
          break;
        case "basket":
          b(n, 1, 6, 10, 7, WD), b(n, 2, 13, 8, 1, "#4a2e18"), b(n, 1, 4, 10, 3, "#3a2412"), b(n, 2, 4, 8, 2, r);
          for (let y = 7; y < 13; y += 2) for (let x = 1 + (y % 4 === 3 ? 1 : 0); x < 11; x += 2) m(n, x, y, WL);
          Q(n, 1, 10, 6, WL), m(n, 3, 4, "#e8f4fa"), m(n, 6, 5, "#7aa0b4"), m(n, 8, 4, "#e8f4fa"), m(n, 5, 3, r), m(n, 6, 3, "#7aa0b4");
          break;
        case "logs":
          for (let [x, y] of [
            [1, 9],
            [6, 9],
            [3, 4],
          ])
            b(n, x, y, 5, 5, WD), b(n, x + 1, y, 3, 5, r), b(n, x, y + 1, 5, 3, r), H(n, x + 2, y + 2, 1, "#d8b080"), m(n, x + 2, y + 2, "#a87a4a"), Q(n, x + 1, x + 3, y, _t(r, 0.25));
          Q(n, 4, 7, 3, _t(r, 0.3));
          break;
        case "stone":
          b(n, 1, 8, 10, 6, _t(r, -0.15)), b(n, 1, 6, 10, 2, _t(r, 0.2)), Te(n, 6, 8, 13, _t(r, -0.35)), Q(n, 1, 10, 13, _t(r, -0.35));
          b(n, 3, 3, 7, 4, _t(r, -0.1)), b(n, 3, 1, 7, 2, _t(r, 0.25)), Q(n, 3, 9, 6, _t(r, -0.35)), m(n, 2, 9, _t(r, 0.15)), m(n, 8, 11, _t(r, 0.1)), m(n, 5, 4, _t(r, 0.15));
          break;
        case "barrel":
          b(n, 2, 3, 8, 11, "#8a5a2b"), b(n, 1, 5, 10, 7, "#8a5a2b"), b(n, 2, 2, 8, 3, _t(r, 0.1)), Q(n, 3, 8, 1, _t(r, 0.1)), Q(n, 3, 8, 3, _t(r, 0.35)), m(n, 5, 3, "#3a2412");
          Q(n, 1, 10, 6, "#3a2412"), Q(n, 1, 10, 11, "#3a2412"), Te(n, 3, 7, 10, "#a87a4a"), Te(n, 9, 6, 12, "#6a4424"), Te(n, 10, 6, 11, "#5c3a1e"), Q(n, 4, 7, 8, r), Q(n, 4, 7, 9, r), Q(n, 2, 9, 13, "#5c3a1e");
          break;
        case "bolt":
          for (let [x, y, c] of [
            [1, 9, r],
            [6, 9, _t(r, 0.2)],
            [3, 4, "#c8a0e8"],
          ])
            b(n, x, y + 1, 5, 4, c), b(n, x + 1, y, 3, 1, _t2(c, 0.25)), H(n, x + 2, y + 3, 1, "#f4ead5"), m(n, x + 2, y + 3, "#b8a070"), Q(n, x, x + 4, y + 5, _t2(c, -0.3));
          Q(n, 4, 6, 4, "#e8d0ff");
          break;
        case "chest": {
          let dk = r === "#2a2026",
            w1 = dk ? "#3a2a30" : "#7a4a24",
            w2 = dk ? "#4a3a40" : "#a06a34",
            mt = dk ? "#8a8a92" : r;
          b(n, 1, 7, 10, 7, w1), b(n, 1, 3, 10, 4, w2), Q(n, 2, 9, 2, w2), Q(n, 2, 9, 3, _t(w2, 0.2)), Q(n, 1, 10, 7, mt), Q(n, 1, 10, 13, _t(w1, -0.3));
          Te(n, 1, 3, 13, mt), Te(n, 10, 3, 13, _t2(mt, -0.2)), b(n, 5, 7, 2, 3, mt), m(n, 5, 9, "#1a1418"), Te(n, 7, 8, 12, _t(w1, -0.15)), Te(n, 4, 8, 12, _t(w1, 0.1));
          dk && (m(n, 5, 4, "#e8e4d8"), m(n, 6, 4, "#e8e4d8"), m(n, 5, 5, "#e8e4d8"));
          break;
        }
        case "cage":
          b(n, 1, 3, 10, 2, WD), Q(n, 2, 9, 2, WL), b(n, 1, 12, 10, 2, WD), b(n, 2, 5, 8, 7, "#2a1a10");
          b(n, 4, 7, 4, 5, r), b(n, 5, 6, 2, 1, r), m(n, 5, 8, "#fff"), m(n, 6, 8, "#101010"), m(n, 7, 10, "#f2c14e");
          for (let x = 1; x < 11; x += 2) Te(n, x, 5, 11, "#c8c8d0");
          m(n, 5, 1, "#8a8a92"), m(n, 6, 1, "#8a8a92");
          break;
        default:
          b(n, 1, 6, 10, 8, W), b(n, 1, 2, 10, 4, WL), Q(n, 1, 10, 2, _t(WL, 0.2)), Q(n, 1, 10, 6, WD), Q(n, 1, 10, 13, WD), Te(n, 1, 6, 13, WD), Te(n, 10, 6, 13, WD);
          ce(n, 2, 7, 9, 12, WD), ce(n, 9, 7, 2, 12, WD), Te(n, 4, 2, 5, _t(WL, -0.15)), Te(n, 7, 2, 5, _t(WL, -0.15));
          b(n, 3, 3, 6, 2, r), Q(n, 4, 7, 9, r), Q(n, 4, 7, 10, _t(r, -0.2));
      }
      e && ((n.globalCompositeOperation = "source-atop"), (n.fillStyle = "rgba(90,140,40,0.45)"), n.fillRect(0, 0, 12, 15), (n.globalCompositeOperation = "source-over"), m(n, 2, 0, "#2a2a2a"), m(n, 9, 1, "#2a2a2a"));
    });
  }
