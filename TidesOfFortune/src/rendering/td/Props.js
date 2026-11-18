// TOP-DOWN sahne nesneleri: kargo görselleri, yüzen nesneler, yaratıklar, adalar, kıyı/liman, dalga.
// 3/4 (üst-karşı) bakış çizimleri — tof-art-src/art kaynaklarından kaynak koda taşındı.
import { disc, ellipse, hash2, hline, line, makeCanvas, px as __px, rect, shade, vline } from '../pixel.js';
import { dS, npcSprite, petSprite, wc } from './TopChars.js';
import { _t2, cannonDraw, deckBarrel } from './TopShip.js';

  // ===== 3/4 bakış: kargo =====
  var oi = new Map();
  function Mc(t, e, a, r) {
    if (oi.has(t)) return oi.get(t);
    let n = makeCanvas(e, a);
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
  export function cargoSprite(t, e = !1) {
    let [a, r] = (Oc[t] || "crate:#a87a4a").split(":");
    return Mc(`cargo|${t}|${e}`, 12, 15, (n) => {
      let W = "#a87a4a",
        WL = "#c89a62",
        WD = "#6a4424";
      switch (a) {
        case "sack":
          rect(n, 2, 5, 8, 8, r), rect(n, 1, 7, 10, 5, r), rect(n, 3, 13, 6, 1, shade(r, -0.25)), rect(n, 4, 3, 4, 2, r), hline(n, 4, 7, 4, "#6a4a2a"), __px(n, 3, 2, r), __px(n, 8, 2, r);
          vline(n, 9, 7, 12, shade(r, -0.18)), vline(n, 10, 8, 11, shade(r, -0.25)), hline(n, 3, 5, 6, shade(r, 0.3)), __px(n, 2, 8, shade(r, 0.3)), hline(n, 2, 9, 12, shade(r, -0.18));
          break;
        case "basket":
          rect(n, 1, 6, 10, 7, WD), rect(n, 2, 13, 8, 1, "#4a2e18"), rect(n, 1, 4, 10, 3, "#3a2412"), rect(n, 2, 4, 8, 2, r);
          for (let y = 7; y < 13; y += 2) for (let x = 1 + (y % 4 === 3 ? 1 : 0); x < 11; x += 2) __px(n, x, y, WL);
          hline(n, 1, 10, 6, WL), __px(n, 3, 4, "#e8f4fa"), __px(n, 6, 5, "#7aa0b4"), __px(n, 8, 4, "#e8f4fa"), __px(n, 5, 3, r), __px(n, 6, 3, "#7aa0b4");
          break;
        case "logs":
          for (let [x, y] of [
            [1, 9],
            [6, 9],
            [3, 4],
          ])
            rect(n, x, y, 5, 5, WD), rect(n, x + 1, y, 3, 5, r), rect(n, x, y + 1, 5, 3, r), disc(n, x + 2, y + 2, 1, "#d8b080"), __px(n, x + 2, y + 2, "#a87a4a"), hline(n, x + 1, x + 3, y, shade(r, 0.25));
          hline(n, 4, 7, 3, shade(r, 0.3));
          break;
        case "stone":
          rect(n, 1, 8, 10, 6, shade(r, -0.15)), rect(n, 1, 6, 10, 2, shade(r, 0.2)), vline(n, 6, 8, 13, shade(r, -0.35)), hline(n, 1, 10, 13, shade(r, -0.35));
          rect(n, 3, 3, 7, 4, shade(r, -0.1)), rect(n, 3, 1, 7, 2, shade(r, 0.25)), hline(n, 3, 9, 6, shade(r, -0.35)), __px(n, 2, 9, shade(r, 0.15)), __px(n, 8, 11, shade(r, 0.1)), __px(n, 5, 4, shade(r, 0.15));
          break;
        case "barrel":
          rect(n, 2, 3, 8, 11, "#8a5a2b"), rect(n, 1, 5, 10, 7, "#8a5a2b"), rect(n, 2, 2, 8, 3, shade(r, 0.1)), hline(n, 3, 8, 1, shade(r, 0.1)), hline(n, 3, 8, 3, shade(r, 0.35)), __px(n, 5, 3, "#3a2412");
          hline(n, 1, 10, 6, "#3a2412"), hline(n, 1, 10, 11, "#3a2412"), vline(n, 3, 7, 10, "#a87a4a"), vline(n, 9, 6, 12, "#6a4424"), vline(n, 10, 6, 11, "#5c3a1e"), hline(n, 4, 7, 8, r), hline(n, 4, 7, 9, r), hline(n, 2, 9, 13, "#5c3a1e");
          break;
        case "bolt":
          for (let [x, y, c] of [
            [1, 9, r],
            [6, 9, shade(r, 0.2)],
            [3, 4, "#c8a0e8"],
          ])
            rect(n, x, y + 1, 5, 4, c), rect(n, x + 1, y, 3, 1, _t2(c, 0.25)), disc(n, x + 2, y + 3, 1, "#f4ead5"), __px(n, x + 2, y + 3, "#b8a070"), hline(n, x, x + 4, y + 5, _t2(c, -0.3));
          hline(n, 4, 6, 4, "#e8d0ff");
          break;
        case "chest": {
          let dk = r === "#2a2026",
            w1 = dk ? "#3a2a30" : "#7a4a24",
            w2 = dk ? "#4a3a40" : "#a06a34",
            mt = dk ? "#8a8a92" : r;
          rect(n, 1, 7, 10, 7, w1), rect(n, 1, 3, 10, 4, w2), hline(n, 2, 9, 2, w2), hline(n, 2, 9, 3, shade(w2, 0.2)), hline(n, 1, 10, 7, mt), hline(n, 1, 10, 13, shade(w1, -0.3));
          vline(n, 1, 3, 13, mt), vline(n, 10, 3, 13, _t2(mt, -0.2)), rect(n, 5, 7, 2, 3, mt), __px(n, 5, 9, "#1a1418"), vline(n, 7, 8, 12, shade(w1, -0.15)), vline(n, 4, 8, 12, shade(w1, 0.1));
          dk && (__px(n, 5, 4, "#e8e4d8"), __px(n, 6, 4, "#e8e4d8"), __px(n, 5, 5, "#e8e4d8"));
          break;
        }
        case "cage":
          rect(n, 1, 3, 10, 2, WD), hline(n, 2, 9, 2, WL), rect(n, 1, 12, 10, 2, WD), rect(n, 2, 5, 8, 7, "#2a1a10");
          rect(n, 4, 7, 4, 5, r), rect(n, 5, 6, 2, 1, r), __px(n, 5, 8, "#fff"), __px(n, 6, 8, "#101010"), __px(n, 7, 10, "#f2c14e");
          for (let x = 1; x < 11; x += 2) vline(n, x, 5, 11, "#c8c8d0");
          __px(n, 5, 1, "#8a8a92"), __px(n, 6, 1, "#8a8a92");
          break;
        default:
          rect(n, 1, 6, 10, 8, W), rect(n, 1, 2, 10, 4, WL), hline(n, 1, 10, 2, shade(WL, 0.2)), hline(n, 1, 10, 6, WD), hline(n, 1, 10, 13, WD), vline(n, 1, 6, 13, WD), vline(n, 10, 6, 13, WD);
          line(n, 2, 7, 9, 12, WD), line(n, 9, 7, 2, 12, WD), vline(n, 4, 2, 5, shade(WL, -0.15)), vline(n, 7, 2, 5, shade(WL, -0.15));
          rect(n, 3, 3, 6, 2, r), hline(n, 4, 7, 9, r), hline(n, 4, 7, 10, shade(r, -0.2));
      }
      e && ((n.globalCompositeOperation = "source-atop"), (n.fillStyle = "rgba(90,140,40,0.45)"), n.fillRect(0, 0, 12, 15), (n.globalCompositeOperation = "source-over"), __px(n, 2, 0, "#2a2a2a"), __px(n, 9, 1, "#2a2a2a"));
    });
  }

  // ===== 3/4 bakış: sahne objeleri (1) =====
  export var DRAW = {},
    // su üstündeki objenin çevresinde köpük halkası (perspektif için basık)
    Za = (t, e, a, r, n, i = 0.7) => {
      for (let s = 0; s < 6.28; s += 0.4) __px(t, e + Math.cos(s + n) * r, a + Math.sin(s + n) * r * 0.5, `rgba(230,245,250,${i})`);
    },
    // su hattı: objenin tabanında köpük + koyu yansıma
    wLine = (t, e, a, w, r) => {
      (t.fillStyle = "rgba(10,30,50,0.25)"), t.fillRect(Math.round(e - w), Math.round(a), Math.round(w * 2), 2);
      for (let x = -w; x <= w; x++) Math.sin(x * 1.3 + r * 3) > -0.3 && __px(t, e + x, a + (Math.sin(x * 0.9 + r * 2) > 0.5 ? 1 : 0), "rgba(235,248,252,0.85)");
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
      ellipse(t, e, a, R, R * 0.45, shade(c, -0.55));
      for (let y = 0; y <= h; y++) {
        let q = y / h,
          w = Math.round(R * (0.55 + 0.45 * Math.sin(q * Math.PI * 0.5)) * (y < 2 ? 0.7 : 1));
        hline(t, e - w, e + w, a - h + y, q < 0.35 ? shade(c, 0.18) : q < 0.7 ? c : shade(c, -0.28));
      }
      ellipse(t, e - R * 0.25, a - h + 1, R * 0.45, Math.max(1, R * 0.2), shade(c, 0.4));
      line(t, e + R * 0.2, a - h + 2, e + R * 0.4, a - 2, shade(c, -0.4)), line(t, e - R * 0.5, a - h * 0.5, e - R * 0.3, a - 1, shade(c, -0.2));
    },
    // palmiye
    palm = (t, e, a, r, s = 1) => {
      let h = Math.round(11 * s),
        lean = Math.round(Math.sin(e * 0.7) * 3);
      ellipse(t, e + 3, a + 1, 6, 2, "rgba(10,30,20,0.25)");
      for (let i = 0; i <= h; i++) {
        let x = e + Math.round((lean * i * i) / (h * h));
        rect(t, x, a - i, 2, 1, i % 3 === 0 ? "#5a3a1e" : "#8a6034");
      }
      let tx = e + lean,
        ty = a - h;
      for (let k = 0; k < 7; k++) {
        let ang = (k / 7) * 6.28 + 0.3,
          sw = Math.sin(r * 0.8 + k) * 0.8;
        for (let d = 1; d <= 8 * s; d++) {
          let x = tx + Math.cos(ang) * d + sw * (d / 8),
            y = ty + Math.sin(ang) * d * 0.5 + (d * d) / (14 * s) - 1;
          __px(t, x, y, d > 6 * s ? "#2f6a32" : k % 2 ? "#3f8a3e" : "#57a84a"), d < 6 * s && __px(t, x, y + 1, "#2f6a32");
        }
      }
      rect(t, tx, ty - 1, 2, 2, "#3a5a22"), __px(t, tx - 1, ty + 1, "#8a5a2b"), __px(t, tx + 2, ty + 1, "#6a4424");
    },
    // çatılı küçük yapı (kulübe/ev): önden duvar + üstte çatı
    hut = (t, x, y, w, h, wall, roof, o = {}) => {
      let rh = o.rh || Math.round(w * 0.55);
      (t.fillStyle = "rgba(10,20,20,0.25)"), t.fillRect(x + 2, y - 1, w + 1, 3);
      rect(t, x, y - h, w, h, wall), vline(t, x + w - 1, y - h, y - 1, shade(wall, -0.2)), hline(t, x, x + w - 1, y - 1, shade(wall, -0.3));
      o.door !== !1 && (rect(t, x + Math.floor(w / 2) - 1, y - Math.min(h - 1, 5), 3, Math.min(h - 1, 5), "#3a2412"), __px(t, x + Math.floor(w / 2) + 1, y - 3, "#e0b040"));
      o.win && w > 9 && (rect(t, x + 2, y - h + 2, 2, 2, o.lit ? "#ffd060" : "#8fc0dc"), rect(t, x + w - 4, y - h + 2, 2, 2, o.lit ? "#ffd060" : "#8fc0dc"));
      for (let i = 0; i < rh; i++) {
        let q = i / rh,
          ww = Math.round((w / 2 + 2) * (o.flat ? 1 : 0.25 + 0.75 * q));
        hline(t, x + w / 2 - ww, x + w / 2 + ww - 1, y - h - rh + i, i === rh - 1 ? shade(roof, -0.35) : (i + (o.seed || 0)) % 3 === 0 ? shade(roof, -0.14) : q < 0.3 ? shade(roof, 0.16) : roof);
      }
    },
    // taş kule / deniz feneri
    tower = (t, x, y, h, r, o = {}) => {
      let w = o.w || 5;
      ellipse(t, x + 3, y + 1, w + 3, 2, "rgba(10,20,30,0.25)");
      for (let i = 0; i < h; i++) {
        let ww = Math.round(w - (i / h) * (w * 0.35)),
          band = o.bands && Math.floor(i / 6) % 2;
        hline(t, x - ww, x + ww, y - i, band ? "#c8423b" : "#e8e4dc"), __px(t, x + ww, y - i, band ? "#8a2a26" : "#b8b4ac"), __px(t, x + ww - 1, y - i, band ? "#a8322c" : "#d0ccc4");
      }
      let ty = y - h;
      rect(t, x - w + 1, ty - 1, w * 2 - 1, 2, "#4a4a52"), rect(t, x - w + 2, ty - 6, w * 2 - 3, 5, "#3a3a44"), rect(t, x - w + 3, ty - 5, w * 2 - 5, 3, o.lit === !1 ? "#5a5a62" : Math.sin(r * 3) > 0 ? "#fff0a0" : "#f2c14e");
      for (let i = 0; i < 4; i++) hline(t, x - w + 2 + i, x + w - 2 - i, ty - 7 - i, "#c8423b");
      __px(t, x, ty - 11, "#3a3a44"), rect(t, x - 1, y - 5, 3, 5, "#3a2412");
      o.lit !== !1 && disc(t, x, ty - 4, 7, `rgba(255,240,170,${0.14 + 0.06 * Math.sin(r * 3)})`);
    };
  // Sandal gövdesi; dir: up/down (dikey), left/right (yatay). İçine oturan figürler ayrıca çizilir.
  export function boatHull(t, e, a, L, half, dir, c1 = "#8a5a2b", c2 = "#5c3a1e") {
    let fl2 = "#b8885a";
    if (dir === "up" || dir === "down") {
      let up = dir === "up";
      // bize bakan yan duvar (alt uç)
      for (let i = 0; i < L; i++) {
        let j = up ? i : L - 1 - i,
          w = Math.round(Math.min(half, 1 + j * 0.7, (L - j) * 0.9 + 1.5)),
          y = a - L / 2 + i;
        if (i >= L - 6) hline(t, e - w, e + w, y + 4, i % 2 ? c2 : shade(c2, -0.2));
      }
      for (let i = 0; i < L; i++) {
        let j = up ? i : L - 1 - i,
          w = Math.round(Math.min(half, 1 + j * 0.7, (L - j) * 0.9 + 1.5)),
          y = a - L / 2 + i;
        hline(t, e - w, e + w, y, c2), w > 1 && hline(t, e - w + 1, e + w - 1, y, j < 3 ? c1 : fl2), w > 2 && (__px(t, e - w + 1, y, c1), __px(t, e + w - 1, y, shade(c1, -0.15)));
        w > 2 && j % 7 === 5 && hline(t, e - w + 1, e + w - 1, y, c1);
        w > 2 && j % 7 === 6 && hline(t, e - w + 1, e + w - 1, y, c2);
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
      vline(t, x, a - w, a + w, c2), w > 1 && vline(t, x, a - w + 1, a + w - 1, fl2), w > 2 && (__px(t, x, a - w + 1, shade(c1, -0.2)), __px(t, x, a - w + 2, shade(c1, -0.1)));
      w > 2 && i % 7 === 5 && vline(t, x, a - w + 1, a + w - 1, c1);
      for (let k = 1; k <= 4; k++) __px(t, x, a + w + k, k === 1 ? c1 : k === 4 ? shade(c2, -0.3) : k % 2 ? c2 : shade(c2, -0.12));
    }
  }
  export function boatSeat(t, npc, x, y, face) {
    // kürek sırasında oturan figür: bacakları küpeştenin arkasında kalır
    let img = npcSprite(npc, face, "sit");
    t.drawImage(img, 0, 0, img.width, img.height - 6, Math.round(x - img.ax), Math.round(y - img.ay + 5), img.width, img.height - 6);
  }
  DRAW.crate = (t, e, a, r) => {
    Za(t, e, a + 2, 8, r), fSpr(t, cargoSprite("GOOD_SPICE"), e, a + Math.sin(r * 2), r, 3);
  };
  DRAW.chest = (t, e, a, r, n = {}) => {
    Za(t, e, a + 2, 10, r);
    let y = Math.round(a + Math.sin(r * 2));
    n.glow && disc(t, e, y - 4, 11, `rgba(255,220,120,${0.14 + 0.06 * Math.sin(r * 3)})`);
    rect(t, e - 7, y - 9, 14, 11, "#2a1608"), rect(t, e - 6, y - 4, 12, 5, "#7a4a24"), rect(t, e - 6, y - 8, 12, 4, "#9a6230"), hline(t, e - 5, e + 4, y - 9, "#b07a42");
    hline(t, e - 6, e + 5, y - 4, "#e0b040"), vline(t, e - 4, y - 8, y, "#e0b040"), vline(t, e + 3, y - 8, y, "#c89030"), rect(t, e - 1, y - 5, 2, 3, "#f2c14e"), __px(t, e - 1, y - 3, "#2a1608");
    __px(t, e - 5, y - 1, "#5a8a3a"), __px(t, e + 4, y - 6, "#5a8a3a"), __px(t, e + 5, y - 2, "#3a6a2a"), wLine(t, e, y + 1, 8, r);
  };
  DRAW.barrel = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 2.3)),
      ro = Math.floor(r * 1.5) % 3;
    Za(t, e, a + 2, 8, r);
    rect(t, e - 6, y - 6, 12, 7, "#2a1608"), rect(t, e - 5, y - 6, 10, 6, "#8a5a2b"), hline(t, e - 5, e + 4, y - 6, "#b07a42"), hline(t, e - 5, e + 4, y - 4 + ro, "#6a4424"), hline(t, e - 5, e + 4, y - 1, "#5c3a1e");
    vline(t, e - 3, y - 6, y - 1, "#3a2412"), vline(t, e + 2, y - 6, y - 1, "#3a2412"), rect(t, e + 5, y - 5, 1, 4, "#a87a4a"), wLine(t, e, y + 1, 7, r);
  };
  DRAW.timber = (t, e, a, r, n = {}) => {
    for (let i = 0; i < (n.n || 4); i++) {
      let s = (hash2(i, 3) - 0.5) * 30,
        o = (hash2(i, 4) - 0.5) * 20 + Math.sin(r * 1.5 + i),
        l = (hash2(i, 5) - 0.5) * 1.6,
        d = 12 + (i % 3) * 4,
        p = (Math.cos(l) * d) / 2,
        f = (Math.sin(l) * d) / 4;
      line(t, e + s - p, a + o - f + 2, e + s + p, a + o + f + 2, "rgba(235,248,252,0.6)"),
        line(t, e + s - p, a + o - f + 1, e + s + p, a + o + f + 1, "#5c3a1e"),
        line(t, e + s - p, a + o - f, e + s + p, a + o + f, "#a87a4a"),
        line(t, e + s - p, a + o - f - 1, e + s + p, a + o + f - 1, "#c89a62"),
        __px(t, e + s + p, a + o + f, "#e0c090");
    }
  };
  DRAW.bottle = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 2)),
      tl = Math.sin(r * 1.3) > 0 ? 1 : 0;
    Za(t, e, a + 2, 6, r), rect(t, e - 2, y - 7, 5, 8, "#2a6a48"), rect(t, e - 1, y - 6, 3, 6, "#4aa070"), vline(t, e - 1, y - 6, y - 2, "#8ad0a0"), rect(t, e - 1 + tl, y - 10, 3, 3, "#2a6a48"), rect(t, e - 1 + tl, y - 11, 3, 1, "#c8a060");
    rect(t, e, y - 4, 2, 3, "#f4ead5"), wLine(t, e, y + 1, 4, r);
  };
  DRAW.raft = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.6));
    Za(t, e, a + 4, 16, r);
    for (let n = 0; n < 6; n++) rect(t, e - 12 + n * 4, y - 6, 4, 13, n % 2 ? "#8a5a2b" : "#7a4a24"), vline(t, e - 12 + n * 4, y - 6, y + 6, "#a87a4a"), rect(t, e - 12 + n * 4, y + 7, 4, 3, n % 2 ? "#5c3a1e" : "#4a2e18"), disc(t, e - 10 + n * 4, y + 8, 1, "#c89a62");
    hline(t, e - 12, e + 11, y - 3, "#c8a070"), hline(t, e - 12, e + 11, y + 3, "#c8a070"), hline(t, e - 12, e + 11, y + 4, "#3a2412");
    vline(t, e + 8, y - 22, y - 2, "#5c3a1e"), rect(t, e + 9, y - 22, 6, 4, "#c8423b"), __px(t, e + 15, y - 21 + (Math.sin(r * 5) > 0 ? 1 : 0), "#c8423b");
    dS(t, npcSprite("castaway", "down", Math.sin(r * 2) > 0.3 ? "react" : "sit"), e - 2, y + 3);
    Math.sin(r * 6) > 0 && (disc(t, e - 9, y - 6, 2, "#ffb040"), __px(t, e - 9, y - 9, "#fff0a0")), wLine(t, e, y + 10, 13, r);
  };
  DRAW.boat = (t, e, a, r, n = {}) => {
    let y = Math.round(a + Math.sin(r * 1.8));
    Za(t, e, a + 6, 12, r), boatHull(t, e, y, 30, 8, "up"), n.npc !== null && boatSeat(t, n.npc || "sailor", e, y + 5, "up"), hline(t, e - 7, e + 7, y + 6, "#8a5a2b"), wLine(t, e, y + 20, 9, r);
  };
  DRAW.mapScroll = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 2));
    rect(t, e - 8, y - 6, 16, 10, "#3a2412"), rect(t, e - 7, y - 5, 14, 8, "#e8d8a8"), rect(t, e - 9, y - 7, 3, 12, "#c8a870"), rect(t, e + 6, y - 7, 3, 12, "#c8a870"), vline(t, e - 9, y - 7, y + 4, "#e8d0a0"), vline(t, e + 6, y - 7, y + 4, "#e8d0a0");
    line(t, e - 4, y - 2, e, y, "#8a6a3a"), line(t, e, y, e + 2, y - 3, "#8a6a3a"), __px(t, e + 3, y - 3, "#c8423b"), __px(t, e + 4, y - 2, "#c8423b"), __px(t, e + 4, y - 4, "#c8423b"), __px(t, e + 2, y - 2, "#c8423b"), __px(t, e - 4, y + 1, "#5a8a4a");
  };
  DRAW.mine = (t, e, a, r) => {
    for (let n = 0; n < 4; n++) {
      let i = Math.round(e + (hash2(n, 7) - 0.5) * 60),
        s = Math.round(a + (hash2(n, 8) - 0.5) * 50 + Math.sin(r + n));
      Za(t, i, s + 2, 8, r), disc(t, i, s - 3, 5, "#1a1a20"), disc(t, i, s - 3, 4, "#3a3a44"), disc(t, i - 1, s - 5, 1, "#7a7a86");
      for (let o = 0; o < 7; o++) {
        let an = Math.PI + (o / 6) * Math.PI;
        __px(t, i + Math.cos(an) * 6, s - 3 + Math.sin(an) * 6, "#6a6a72"), __px(t, i + Math.cos(an) * 7, s - 3 + Math.sin(an) * 7, "#2a2a30");
      }
      __px(t, i, s - 3, Math.sin(r * 4 + n) > 0.5 ? "#ff5040" : "#8a2a26"), wLine(t, i, s + 1, 5, r);
    }
  };
  DRAW.rocks = (t, e, a, r) => {
    let L = [];
    for (let n = 0; n < 5; n++) L.push({ x: e + (hash2(n, 9) - 0.5) * 90, y: a + (hash2(n, 10) - 0.5) * 70, o: 6 + hash2(n, 11) * 8 });
    L.sort((p, q) => p.y - q.y);
    for (let k of L) Za(t, k.x, k.y + 1, k.o + 4, r * 0.6), rock(t, Math.round(k.x), Math.round(k.y), Math.round(k.o), "#62626c"), wLine(t, k.x, k.y + 1, k.o, r);
  };
  DRAW.iceberg = (t, e, a, r) => {
    let L = [];
    for (let n = 0; n < 4; n++) L.push({ x: e + (hash2(n, 12) - 0.5) * 100, y: a + (hash2(n, 13) - 0.5) * 70, o: 8 + hash2(n, 14) * 14 });
    L.sort((p, q) => p.y - q.y);
    for (let k of L) {
      let x = Math.round(k.x),
        y = Math.round(k.y),
        o = Math.round(k.o),
        h = Math.round(o * 1.3);
      ellipse(t, x, y + 3, o + 5, (o + 5) * 0.45, "rgba(150,220,240,0.35)");
      for (let i = 0; i <= h; i++) {
        let q = i / h,
          w = Math.round(o * (q < 0.25 ? 0.35 + q * 1.6 : 0.75 + q * 0.25));
        hline(t, x - w, x + w, y - h + i, q < 0.3 ? "#ffffff" : q < 0.65 ? "#e4f2fa" : "#b4d4e8");
        __px(t, x + w, y - h + i, "#8ab4d0"), i > 3 && __px(t, x - Math.round(w * 0.2), y - h + i, "#cfe6f4");
      }
      line(t, x - o * 0.3, y - h, x - o * 0.6, y - h * 0.5, "#ffffff"), line(t, x + o * 0.2, y - h * 0.7, x + o * 0.5, y - 2, "#9ac4dc"), wLine(t, x, y + 1, o, r);
    }
  };
  DRAW.island = (t, e, a, r, n = {}) => {
    var s;
    let i = n.r || 34,
      k = 0.56,
      g = n.ground || "#4f8a44",
      L = [];
    ellipse(t, e, a + 3, i + 9, (i + 9) * k, "rgba(130,215,220,0.35)"), ellipse(t, e, a + 2, i + 5, (i + 5) * k, "rgba(170,230,225,0.5)");
    for (let q = 0; q < 6.28; q += 0.16) Math.sin(q * 5 + r * 1.5) > 0.1 && __px(t, e + Math.cos(q) * (i + 3), a + 2 + Math.sin(q) * (i + 3) * k, "rgba(245,252,255,0.9)");
    ellipse(t, e, a + 1, i + 1, (i + 1) * k, "#d8c68c"), ellipse(t, e, a, i, i * k, "#eedfae");
    for (let q = 0; q < i * 1.5; q++) __px(t, e + (hash2(q, 71) - 0.5) * i * 1.7, a + (hash2(q, 72) - 0.5) * i * k * 1.7, hash2(q, 73) > 0.5 ? "#d8c68c" : "#f8ecc4");
    // çimenli yükselti (güney yüzünde toprak yamaç)
    let gr = i - 6,
      gh = gr * k * 0.92;
    if (gr > 5) {
      ellipse(t, e, a, gr, gh, shade(g, -0.5)), ellipse(t, e, a - 1, gr, gh, "#7a5a36"), ellipse(t, e, a - 3, gr, gh, g);
      for (let q = 0; q < gr * 2; q++) {
        let px = e + (hash2(q, 74) - 0.5) * gr * 1.6,
          py = a - 3 + (hash2(q, 75) - 0.5) * gh * 1.5;
        __px(t, px, py, hash2(q, 76) > 0.5 ? shade(g, 0.14) : shade(g, -0.14));
      }
    }
    for (let o = 0; o < ((s = n.palms) != null ? s : 5); o++)
      L.push({ y: a - 3 + (hash2(o, 16) - 0.5) * i * 0.7, fn: (yy) => palm(t, Math.round(e + (hash2(o, 15) - 0.5) * i * 1.2), Math.round(yy), r, 0.8 + hash2(o, 17) * 0.5) });
    if (n.ruins)
      for (let o = 0; o < 4; o++) {
        let x = Math.round(e - 14 + o * 9),
          y = a - 2 + (o % 2) * 5,
          h = 6 + ((o * 3) % 5);
        L.push({
          y,
          fn: (yy) => {
            yy = Math.round(yy);
            (t.fillStyle = "rgba(10,20,20,0.25)"), t.fillRect(x + 1, yy, 6, 2), rect(t, x, yy - h, 4, h, "#cfc6b0"), vline(t, x + 3, yy - h, yy - 1, "#9a927e"), rect(t, x - 1, yy - h - 2, 6, 2, "#e0d8c4"), hline(t, x - 1, x + 4, yy - 1, "#9a927e");
            o % 2 && __px(t, x + 1, yy - h + 3, "#5a8a4a");
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
          for (let o = 0; o < 7; o++) vline(t, e - 12 + o * 4, yy - 10 + Math.abs(o - 3), yy - 1, "#c8a070"), __px(t, e - 12 + o * 4, yy, "#6a4424");
          hline(t, e - 14, e + 14, yy - 1, "#8a5a2b"), hline(t, e - 14, e + 14, yy, "#5c3a1e"), vline(t, e + 16, yy - 14, yy, "#5c3a1e"), line(t, e + 16, yy - 14, e + 8, yy - 11, "#5c3a1e");
        },
      });
    if (n.villagers) for (let o = 0; o < 4; o++) L.push({ y: a + i * k * 0.72 + (o % 2) * 2, fn: (yy) => dS(t, npcSprite(o % 2 ? "villagerF" : "villager", "down", Math.sin(r * 2 + o) > 0.6 ? "react" : "idle", 0), e - 24 + o * 16, yy) });
    n.shrine &&
      L.push({
        y: a + 1,
        fn: (yy) => {
          yy = Math.round(yy);
          rect(t, e - 8, yy - 3, 16, 4, "#6a6a72"), rect(t, e - 7, yy - 5, 14, 2, "#9a9aa2"), rect(t, e - 5, yy - 12, 2, 8, "#b8b8c0"), rect(t, e + 3, yy - 12, 2, 8, "#b8b8c0"), rect(t, e - 6, yy - 14, 12, 2, "#c8c8d0");
          rect(t, e - 2, yy - 10, 4, 5, "#f2c14e"), __px(t, e - 1, yy - 9, "#7a4a10"), __px(t, e + 1, yy - 9, "#7a4a10"), Math.sin(r * 3) > 0.3 && __px(t, e + 3, yy - 12, "#fff6c0");
        },
      });
    L.sort((p, q) => p.y - q.y);
    for (let o of L) o.fn(o.y);
  };
  DRAW.lightOrb = (t, e, a, r) => {
    let n = 5 + Math.sin(r * 2) * 1.5,
      y = a - 10 + Math.sin(r * 1.4) * 3;
    ellipse(t, e, a + 4, 9, 3, "rgba(160,255,210,0.25)"), disc(t, e, y, n + 9, "rgba(120,255,190,0.10)"), disc(t, e, y, n + 4, "rgba(160,255,210,0.3)"), disc(t, e, y, n - 1, "#e8fff4"), __px(t, e - 2, y - 2, "#ffffff");
  };
  DRAW.whirlpool = (t, e, a, r) => {
    ellipse(t, e, a, 74, 40, "rgba(10,30,50,0.25)");
    for (let n = 0; n < 40; n += 0.07) {
      let i = n * 1.8,
        s = n + r * 2;
      __px(t, e + Math.cos(s) * i, a + Math.sin(s) * i * 0.56, n % 1 < 0.5 ? "#e8f6fb" : "#6aa8c8");
    }
    ellipse(t, e, a, 7, 4, "#05101a"), ellipse(t, e, a + 1, 4, 2, "#000810");
  };
  DRAW.fishSchool = (t, e, a, r, n = {}) => {
    let i = n.n || 26;
    for (let s = 0; s < i; s++) {
      let o = r * 1.4 + s * 0.6,
        l = e + Math.cos(o * 0.7 + s) * (8 + (s % 5) * 4),
        d = a + Math.sin(o + s * 1.7) * (5 + (s % 4) * 2),
        f = -Math.sin(o * 0.7 + s) > 0 ? 1 : -1;
      __px(t, l, d + 1, "rgba(10,30,50,0.3)"), hline(t, l - 1, l + 1, d, Math.sin(r * 6 + s) > 0.3 ? "#e8f4fa" : "#9ac0d0"), __px(t, l - f * 2, d, "#7aa0b4");
    }
  };
  DRAW.shadow = (t, e, a, r, n = {}) => {
    var s;
    let i = n.s || 1;
    t.fillStyle = `rgba(5,15,30,${(s = n.a) != null ? s : 0.35})`;
    for (let o = -20; o <= 20; o++) {
      let l = Math.round(Math.sqrt(400 - o * o) * 0.9 * i);
      t.fillRect(Math.round(e - l / 2 + Math.sin(r + o * 0.2) * 2), Math.round(a + o * 2 * i), l, Math.ceil(2 * i));
    }
  };
  DRAW.serpent = (t, e, a, r, n = {}) => {
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
        vline(t, d + x, p - top, p, M), __px(t, d + x, p - top, Lg), top > 3 && __px(t, d + x, p - 1, D), top > 4 && (x + 20) % 4 === 0 && __px(t, d + x, p - top + 2, D);
        top > 2 && x % 3 === 0 && __px(t, d + x, p - top - 1, "#8ae0a0");
      }
      wLine(t, d, p + 1, 9, r);
    }
    // baş
    let s = Math.round(e + 62),
      o = Math.round(a - 20 + Math.sin(r * 2) * 3);
    Za(t, s - 2, a + 2, 9, r);
    for (let i = 0; i < 20; i++) hline(t, s - 6 + Math.round(Math.sin(i * 0.25) * 2), s + 2 + Math.round(Math.sin(i * 0.25) * 2), o + 4 + i, i % 4 === 0 ? D : M), __px(t, s + 1 + Math.round(Math.sin(i * 0.25) * 2), o + 4 + i, Y2);
    rect(t, s - 7, o - 5, 13, 10, M), rect(t, s - 6, o - 6, 10, 1, M), hline(t, s - 6, s + 3, o - 6, Lg), rect(t, s + 4, o - 2, 9, 6, M), hline(t, s + 4, s + 12, o - 2, Lg), rect(t, s + 4, o + 3, 8, 2, D);
    rect(t, s - 1, o - 3, 3, 3, "#f2e040"), __px(t, s, o - 2, "#101010"), __px(t, s + 11, o - 1, "#101010");
    for (let i = 0; i < 4; i++) __px(t, s - 6 + i * 2, o - 7 - (i % 2), "#8ae0a0");
    if (n.roar) {
      rect(t, s + 4, o + 3, 9, 4, "#8a1f2a"), hline(t, s + 4, s + 12, o + 7, D);
      for (let l = 0; l < 4; l++) __px(t, s + 5 + l * 2, o + 3, "#ffffff"), __px(t, s + 6 + l * 2, o + 6, "#ffffff");
      for (let l = 0; l < 3; l++) __px(t, s + 16 + l * 3, o + 2 + l + Math.sin(r * 9) * 1, "#ffffff");
    }
    wLine(t, s - 2, a + 3, 6, r);
  };
  DRAW.tentacles = (t, e, a, r) => {
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
        disc(t, x, y, l, o % 5 < 2 ? "#7a1f3e" : "#8a2a4a"), __px(t, x - l, y, "#a8405e"), o % 4 === 0 && l > 1 && __px(t, x + l - 1, y, "#e8a0b0");
      }
      wLine(t, i, s + 2, 6, r);
    }
  };
  DRAW.wave = (t, e, a, r, n = {}) => {
    let i = n.W || 640;
    for (let s = -40; s < i + 40; s++) {
      let o = 26 + Math.sin(s * 0.05 + r * 2) * 5 + Math.sin(s * 0.13 - r) * 2;
      for (let l = 0; l < o; l++) {
        let d = l < 3 ? "#ffffff" : l < 8 ? "#cfe8f0" : l < o * 0.55 ? "#4a96bc" : l < o * 0.8 ? "#2f78a6" : "#1f5a82";
        (l > 3 && (s + l) % 5 === 0 && l < 12) || __px(t, s, a - o + l, d);
      }
      Math.sin(s * 0.3 + r * 5) > 0.7 && (__px(t, s, a - o - 2, "#ffffff"), __px(t, s + 1, a - o - 4, "#e8f6fb"));
      s % 3 === 0 && __px(t, s, a + 1, "rgba(235,248,252,0.8)");
    }
  };
  DRAW.fog = (t, e, a, r, n = {}) => {
    var s;
    let i = n.r || 60;
    for (let o = 0; o < 9; o++) {
      let l = e + (hash2(o, 21) - 0.5) * i * 2 + Math.sin(r * 0.3 + o) * 6,
        d = a + (hash2(o, 22) - 0.5) * i;
      ellipse(t, l, d, i * 0.4, i * 0.26, `rgba(220,228,232,${(s = n.a) != null ? s : 0.22})`);
    }
  };
  DRAW.fire = (t, e, a, r, n = {}) => {
    let i = n.n || 10;
    disc(t, e, a - 3, (n.w || 14) * 0.6, "rgba(255,170,60,0.12)");
    for (let s = 0; s < i; s++) {
      let o = e + (hash2(s, 23) - 0.5) * (n.w || 14),
        l = a + (hash2(s, 24) - 0.5) * (n.h || 10) * 0.5,
        d = (r * 3 + s * 0.37) % 1;
      disc(t, o, l - d * 9, 2.4 - d * 1.6, d < 0.35 ? "#fff0a0" : d < 0.7 ? "#ffb040" : "#e0502a");
    }
    for (let s = 0; s < 3; s++) __px(t, e + Math.sin(r * 2 + s) * 3, a - 12 - ((r * 10 + s * 5) % 9), "rgba(80,80,80,0.55)");
  };
  DRAW.bell = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.7)),
      sw = Math.round(Math.sin(r * 3) * 1.5);
    Za(t, e, a + 2, 10, r), rect(t, e - 6, y - 4, 12, 5, "#8a2a26"), hline(t, e - 6, e + 5, y - 4, "#c8423b"), hline(t, e - 5, e + 4, y + 1, "#5a1a16"), hline(t, e - 6, e + 5, y - 2, "#f4ead5");
    line(t, e - 5, y - 4, e - 1, y - 17, "#3a3a44"), line(t, e + 5, y - 4, e + 1, y - 17, "#3a3a44"), hline(t, e - 2, e + 2, y - 17, "#3a3a44");
    rect(t, e - 2 + sw, y - 15, 5, 5, "#c8a040"), hline(t, e - 3 + sw, e + 3 + sw, y - 10, "#a07a20"), __px(t, e - 1 + sw, y - 14, "#fff0a0"), __px(t, e + sw * 2, y - 9, "#5a4a10");
    if (Math.sin(r * 3) > 0.7) for (let n = 0; n < 3; n++) __px(t, e + 8 + n * 3, y - 16 - n, "#f4ead5"), __px(t, e - 8 - n * 3, y - 16 - n, "#f4ead5");
    wLine(t, e, y + 2, 7, r);
  };
  DRAW.dockPets = (t, e, a, r) => {
    dS(t, petSprite("PET_TARCIN", "down", Math.sin(r * 5) > 0 ? "wag1" : "wag0"), e - 8, a + 2), dS(t, petSprite("PET_ZIPIR", "down", "sit"), e + 9, a + 3);
  };
  DRAW.catBoat = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.8));
    Za(t, e, a + 6, 12, r), boatHull(t, e, y, 30, 8, "up"), dS(t, petSprite("PET_ZIPIR", "down", Math.sin(r * 2) > 0.7 ? "bark" : "sit"), e, y + 6), hline(t, e - 7, e + 7, y + 7, "#8a5a2b"), wLine(t, e, y + 20, 9, r);
  };
  DRAW.dogRock = (t, e, a, r) => {
    Za(t, e, a + 2, 17, r), rock(t, e, a + 2, 13, "#62626c"), wLine(t, e, a + 3, 13, r), dS(t, petSprite("PET_TARCIN", "left", Math.sin(r * 3) > 0.6 ? "bark" : "sit"), e, a - 8);
  };
  DRAW.shrine = (t, e, a, r) => DRAW.island(t, e, a, r, { r: 24, palms: 1, shrine: !0, ground: "#6a7a62" });
  DRAW.turtle = (t, e, a, r) => {
    let fp = Math.sin(r * 2) * 2;
    Za(t, e, a + 1, 15, r * 0.5, 0.4), ellipse(t, e, a + 2, 13, 7, "rgba(10,30,50,0.25)");
    for (let n of [-1, 1]) line(t, e + n * 9, a - 3, e + n * 15, a - 6 + fp, "#5a8a50"), line(t, e + n * 9, a - 2, e + n * 15, a - 5 + fp, "#6aa060"), line(t, e + n * 8, a + 3, e + n * 12, a + 6, "#5a8a50");
    rect(t, e - 2, a - 12, 5, 5, "#6aa060"), __px(t, e - 1, a - 10, "#101010"), __px(t, e + 1, a - 10, "#101010"), hline(t, e - 2, e + 2, a - 12, "#8ac080");
    ellipse(t, e, a, 11, 7, "#2f5a32"), ellipse(t, e, a - 1, 10, 6, "#4a8a4a"), ellipse(t, e - 2, a - 3, 5, 2, "#6aa860");
    for (let [n, i] of [
      [-5, -2],
      [5, -2],
      [0, 0],
      [-4, 3],
      [4, 3],
    ])
      disc(t, e + n, a + i, 1, "#2f5a32");
  };
  DRAW.flyingFish = (t, e, a, r) => {
    for (let n = 0; n < 10; n++) {
      let i = (r * 0.7 + n * 0.13) % 1,
        s = e - 80 + i * 160,
        o = a + (n - 5) * 6,
        h = Math.sin(i * Math.PI) * 12;
      hline(t, s, s + 3, o + 2, "rgba(0,0,0,0.2)"), hline(t, s, s + 4, o - h, "#d8eef6"), __px(t, s + 4, o - h, "#7aa0b4"), __px(t, s + 1, o - h - 1, "#ffffff"), __px(t, s + 2, o - h - 2, "#bfe3ef"), __px(t, s + 2, o - h + 1, "#ffffff"), __px(t, s - 1, o - h - 1, "#9ac0d0");
      (i < 0.08 || i > 0.92) && (__px(t, s, o, "#ffffff"), __px(t, s + 2, o - 1, "#ffffff"));
    }
  };
  DRAW.passenger = (t, e, a, r) => {
    let y = Math.round(a + Math.sin(r * 1.8));
    Za(t, e, a + 6, 12, r), disc(t, e, y - 8, 11, "rgba(140,255,210,0.10)"), boatHull(t, e, y, 30, 8, "up", "#4a6a5a", "#2a4a3e"), boatSeat(t, "ghost", e, y + 5, "down"), hline(t, e - 7, e + 7, y + 6, "#4a6a5a");
    rect(t, e + 7, y - 12, 3, 4, "#3a2a1a"), rect(t, e + 8, y - 11, 1, 2, Math.sin(r * 5) > 0 ? "#8affd0" : "#5ac8a0"), wLine(t, e, y + 20, 9, r);
  };
  DRAW.idol = (t, e, a, r) => {
    rect(t, e - 4, a - 1, 8, 2, "#8a6a20"), rect(t, e - 3, a - 8, 6, 7, "#f2c14e"), rect(t, e - 4, a - 13, 8, 5, "#f2c14e"), hline(t, e - 3, e + 2, a - 14, "#fff0a0"), vline(t, e + 3, a - 12, a - 2, "#c89030"), vline(t, e - 4, a - 12, a - 9, "#fff0a0");
    __px(t, e - 2, a - 11, "#7a4a10"), __px(t, e + 1, a - 11, "#7a4a10"), hline(t, e - 1, e, a - 9, "#7a4a10"), __px(t, e - 1, a - 5, "#c8423b"), __px(t, e, a - 5, "#c8423b"), hline(t, e - 3, e + 2, a - 3, "#c89030");
    Math.sin(r * 3) > 0.5 && (__px(t, e + 5, a - 14, "#fff6c0"), __px(t, e - 6, a - 9, "#fff6c0"));
  };

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
  export function drawTown(t, e, a, r, n, i = 1) {
    let s = `${r}|${i}|${a}`,
      o = tn.get(s);
    o || (tn.size > 12 && tn.clear(), (o = makeCanvas(560, a)), Pc(o.getContext("2d"), 0, a, r, i), tn.set(s, o)), t.drawImage(o, Math.round(e), 0);
    // fener ışığı + pencere ışıltıları
    let lx = Math.round(e) + 52;
    rect(t, lx - 2, 12, 5, 3, Math.sin(n * 3) > 0 ? "#fff0a0" : "#f2c14e"), disc(t, lx, 13, 8, `rgba(255,240,170,${0.12 + 0.06 * Math.sin(n * 3)})`);
    if ((rn[r] || rn.trade).lava) for (let k = 0; k < 6; k++) __px(t, Math.round(e) + 90 + hash2(k, 5, i) * 300, hash2(k, 6, i) * a - ((n * 12 + k * 9) % 18), Math.sin(n * 7 + k) > 0 ? "#ffb040" : "#ff5a20");
  }
  function Pc(t, e, a, r, n) {
    let i = rn[r] || rn.trade,
      s = 560,
      gx = e + 26;
    // zemin dokusu
    rect(t, gx, 0, s, a, i.ground);
    for (let q = 0; q < 2600; q++) {
      let x = gx + hash2(q, 1, n) * (s - 30),
        y = hash2(q, 2, n) * a,
        v = hash2(q, 3, n);
      i.paved ? (rect(t, x, y, 3, 2, v > 0.5 ? i.g2 : shade(i.ground, 0.08)), __px(t, x, y + 2, shade(i.g2, -0.1))) : (__px(t, x, y, v > 0.5 ? i.g2 : shade(i.ground, 0.1)), v > 0.9 && __px(t, x, y - 1, shade(i.ground, 0.18)));
    }
    // rıhtım taşı (iskelenin karayla birleştiği kenar)
    rect(t, gx, 0, 10, a, "#8a8478"), vline(t, gx, 0, a, "#5a564e"), vline(t, gx + 9, 0, a, "#6a665c"), vline(t, gx + 1, 0, a, "#b0aa9c");
    for (let y = 0; y < a; y += 8) hline(t, gx + 1, gx + 8, y, "#6a665c");
    // sokaklar
    let rows = [];
    for (let y = 44; y < a + 40; y += 78) rows.push(y);
    for (let y of rows) rect(t, gx + 10, y - 7, s, 12, i.path), hline(t, gx + 10, gx + s, y - 8, shade(i.path, -0.12)), hline(t, gx + 10, gx + s, y + 5, shade(i.path, -0.18));
    rect(t, gx + 196, 0, 14, a, i.path), vline(t, gx + 195, 0, a, shade(i.path, -0.12)), vline(t, gx + 210, 0, a, shade(i.path, -0.18));
    // çizim listesi (y'ye göre sıralı)
    let L = [],
      add = (y, fn) => L.push({ y, fn });
    for (let ri = -1; ri < rows.length; ri++) {
      let y0 = ri < 0 ? rows[0] - 78 : rows[ri];
      for (let sub = 0; sub < 2; sub++) {
        let by = y0 + 34 + sub * 30,
          x = gx + 18 + (sub ? 9 : 0) + Math.round(hash2(ri, sub, n) * 8);
        while (x < gx + 500) {
          let d = hash2(x, by, n),
            w = 20 + Math.round(d * 12),
            hh = 10 + Math.round(hash2(by, x, n) * 5),
            gap = 5 + Math.round(hash2(x, ri, n + 7) * 9);
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
              wall = i.wall[Math.floor(hash2(x, 3, n) * 3) % 3],
              X = Math.round(x),
              kind = d > 0.93 ? "tower" : i.stalls && d < 0.3 ? "stall" : i.jungle && d < 0.4 ? "tree" : "house";
            add(by, () => {
              if (kind === "house") {
                hut(t, X, by, w, hh, wall, roof, { rh: 9 + Math.round(d * 6), win: !0, lit: hash2(X, by, n + 3) > 0.6, seed: X });
                i.snow && (hline(t, X - 1, X + w, by - hh - 1, "#ffffff"), hline(t, X + 2, X + w - 3, by - hh - (9 + Math.round(d * 6)), "#ffffff"));
                i.lava && d > 0.7 && (rect(t, X + 2, by - hh + 2, 2, 2, "#ff6a2a"), __px(t, X + w - 4, by - 3, "#ffb040"));
                d > 0.6 && (rect(t, X + w - 6, by - hh - (9 + Math.round(d * 6)) - 3, 3, 5, shade(wall, -0.3)), i.snow && hline(t, X + w - 6, X + w - 4, by - hh - (9 + Math.round(d * 6)) - 4, "#fff"));
              } else if (kind === "stall") {
                let c = ["#c8423b", "#3b6ea5", "#5a9e4b", "#e0b040"][X % 4];
                rect(t, X + 2, by - 6, w - 6, 6, "#8a5a2b"), hline(t, X + 2, X + w - 5, by - 6, "#b07a42");
                for (let k = 0; k < w - 6; k += 4) __px(t, X + 3 + k, by - 8, ["#e07b39", "#c8423b", "#f2c14e", "#8b5bb5"][(k / 4) % 4]), __px(t, X + 4 + k, by - 7, ["#5a9e4b", "#f2c14e", "#e07b39"][(k / 4) % 3]);
                vline(t, X + 2, by - 16, by - 6, "#5c3a1e"), vline(t, X + w - 5, by - 16, by - 6, "#5c3a1e");
                for (let k = 0; k < 5; k++) for (let x2 = X; x2 < X + w - 2; x2++) __px(t, x2, by - 20 + k, Math.floor((x2 - X) / 3) % 2 ? c : "#f4ead5");
                hline(t, X, X + w - 3, by - 15, shade(c, -0.3));
              } else if (kind === "tree") palm(t, X + 8, by, 0, 1.2), palm(t, X + 18, by - 4, 0, 1);
              else {
                // kule / büyük yapı
                rect(t, X + 4, by - 30, 14, 30, wall), vline(t, X + 17, by - 30, by - 1, shade(wall, -0.22)), rect(t, X + 9, by - 6, 4, 6, "#3a2412"), rect(t, X + 9, by - 22, 4, 5, "#3a4a66"), rect(t, X + 9, by - 14, 4, 4, "#3a4a66");
                for (let k = 0; k < 7; k++) hline(t, X + 3 + k, X + 18 - k, by - 31 - k, k === 6 ? shade(roof, 0.2) : roof);
                hline(t, X + 3, X + 18, by - 31, shade(roof, -0.3)), vline(t, X + 11, by - 44, by - 38, "#3a2412"), rect(t, X + 12, by - 44, 5, 3, i.flags ? "#0a0a0a" : "#c8423b");
              }
            });
          } else if (d < 0.07) add(by - 2, () => (dS(t, deckBarrel("#8a5a2b"), x + 6, by), dS(t, cargoSprite("GOOD_GRAIN"), x + 15, by + 1)));
          x += w + gap;
        }
      }
    }
    // tür süsleri
    if (i.walls) {
      // sur + burçlar (rıhtım boyunca)
      rect(t, gx + 10, 0, 9, a, "#7a7a82"), vline(t, gx + 10, 0, a, "#9a9aa2"), vline(t, gx + 18, 0, a, "#5a5a62");
      for (let y = 0; y < a; y += 7) rect(t, gx + 9, y, 11, 4, "#8a8a92"), hline(t, gx + 9, gx + 19, y, "#a8a8b0"), hline(t, gx + 9, gx + 19, y + 3, "#5a5a62");
      for (let y = 60; y < a; y += 130)
        add(y + 8, () => {
          rect(t, gx + 4, y - 18, 20, 26, "#8a8a92"), vline(t, gx + 23, y - 18, y + 7, "#5a5a62"), hline(t, gx + 4, gx + 23, y - 18, "#b0b0b8");
          for (let k = 0; k < 4; k++) rect(t, gx + 4 + k * 6, y - 21, 3, 3, "#9a9aa2");
          rect(t, gx + 12, y - 2, 4, 10, "#2a2a30"), cannonDraw(t, gx + 8, y - 12, -1, 0), vline(t, gx + 20, y - 34, y - 21, "#3a2412"), rect(t, gx + 21, y - 34, 6, 4, "#3b6ea5");
        });
    }
    if (i.jungle) for (let o = 0; o < 26; o++) add(hash2(o, 2, n) * a, () => palm(t, Math.round(gx + 40 + hash2(o, 1, n) * 420), Math.round(hash2(o, 2, n) * a), 0, 1 + hash2(o, 3, n) * 0.6));
    if (i.flags)
      for (let o = 0; o < 5; o++) {
        let x = gx + 50 + o * 84,
          y = 34 + o * 66;
        add(y, () => {
          vline(t, x, y - 22, y, "#3a2412"), rect(t, x + 1, y - 22, 9, 6, "#0a0a0a"), rect(t, x + 4, y - 20, 3, 2, "#ffffff"), __px(t, x + 5, y - 18, "#ffffff");
          rect(t, x - 12, y - 8, 2, 8, "#5c3a1e"), __px(t, x - 12, y - 10, "#ffb040"), __px(t, x - 11, y - 9, "#ff6a2a"), disc(t, x - 11, y - 9, 4, "rgba(255,170,60,0.18)");
        });
      }
    if (i.lamps) for (let o = 0; o < 9; o++) {
        let x = gx + 40 + o * 52,
          y = rows[o % rows.length] + 4;
        add(y, () => (vline(t, x, y - 14, y, "#2a2a30"), rect(t, x - 1, y - 17, 3, 3, "#ffe8a0"), disc(t, x, y - 16, 7, "rgba(255,240,170,0.16)")));
      }
    if (i.lava) for (let o = 0; o < 18; o++) {
        let x = gx + 30 + hash2(o, 5, n) * 440,
          y = hash2(o, 6, n) * a;
        for (let k = 0; k < 9; k++) __px(t, x + k + Math.sin(k) * 2, y + k * 0.6 + Math.cos(k * 1.3) * 1.5, k % 3 ? "#e0502a" : "#ffb040");
      }
    if (i.snow) for (let o = 0; o < 14; o++) add(hash2(o, 8, n) * a, () => {
          let x = Math.round(gx + 24 + hash2(o, 7, n) * 460),
            y = Math.round(hash2(o, 8, n) * a);
          // çam
          vline(t, x, y - 3, y, "#5a3a1e");
          for (let k = 0; k < 4; k++) hline(t, x - 1 - k, x + 1 + k, y - 12 + k * 3, "#2f5e45"), hline(t, x - k, x + k, y - 13 + k * 3, "#ffffff"), hline(t, x - 1 - k, x + 1 + k, y - 11 + k * 3, "#24493a");
        });
    if (i.grand)
      add(a * 0.46 + 30, () => {
        let x = gx + 128,
          y = Math.round(a * 0.46) + 30;
        rect(t, x - 44, y - 30, 88, 30, "#f4ead5"), vline(t, x + 43, y - 30, y - 1, "#c8bc9c"), rect(t, x - 48, y - 4, 96, 5, "#d8cca8"), hline(t, x - 48, x + 47, y - 4, "#fff6e0");
        for (let k = 0; k < 8; k++) rect(t, x - 40 + k * 11, y - 28, 3, 24, "#ffffff"), vline(t, x - 38 + k * 11, y - 28, y - 5, "#c8bc9c");
        rect(t, x - 5, y - 16, 10, 12, "#5a3a20"), rect(t, x - 4, y - 15, 8, 2, "#e0b040"), rect(t, x - 46, y - 34, 92, 5, "#e0b040"), hline(t, x - 46, x + 45, y - 34, "#fff0a0");
        for (let k = 0; k < 20; k++) {
          let ww = Math.round(Math.sqrt(400 - (20 - k) * (20 - k)) * 1.1);
          hline(t, x - ww, x + ww, y - 54 + k, k < 6 ? "#fff0b0" : k < 14 ? "#f0d070" : "#e0b040"), __px(t, x + ww, y - 54 + k, "#b88a2a");
        }
        vline(t, x, y - 64, y - 54, "#b88a2a"), rect(t, x + 1, y - 64, 7, 4, "#8b5bb5"), disc(t, x, y - 55, 2, "#fff6c0");
        for (let k of [-1, 1]) vline(t, x + k * 52, y - 26, y, "#5c3a1e"), rect(t, x + k * 52 + 1, y - 26, 7, 12, "#8b5bb5"), rect(t, x + k * 52 + 3, y - 23, 3, 3, "#f2c14e");
      });
    // deniz feneri (sol üst)
    add(40, () => tower(t, gx + 26, 40, 24, 0, { bands: !0, w: 5, lit: !1 }));
    L.sort((p, q) => p.y - q.y);
    for (let o of L) o.fn();
  }
  export function drawPier(t, e, a) {
    // ahşap iskele (gemiyle rıhtım arasında)
    (t.fillStyle = "rgba(8,20,40,0.3)"), t.fillRect(e - 3, 0, 3, a);
    rect(t, e, 0, 28, a, "#8a5a34");
    for (let r = 0; r < a; r += 5) hline(t, e, e + 27, r, "#5c3a1e"), hline(t, e, e + 27, r + 1, "#a06e40"), (r / 5) % 3 === 0 && __px(t, e + 6 + ((r * 7) % 15), r + 3, "#5c3a1e");
    vline(t, e, 0, a, "#3a2414"), vline(t, e + 1, 0, a, "#b88450"), vline(t, e + 27, 0, a, "#3a2414");
    for (let r = 14; r < a; r += 44) {
      // babalar + halat
      rect(t, e - 2, r - 6, 5, 8, "#3a2414"), rect(t, e - 1, r - 7, 3, 2, "#8a6034"), vline(t, e - 1, r - 5, r + 1, "#6a4424"), hline(t, e - 2, e + 2, r - 3, "#c8a070");
      (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e + 3, r, 3, 2);
    }
    for (let r = 34; r < a; r += 96) {
      dS(t, cargoSprite("GOOD_TIMBER"), e + 19, r + 2), dS(t, cargoSprite("GOOD_GRAIN"), e + 17, r + 14), dS(t, deckBarrel("#8a5a2b"), e + 21, r + 40), dS(t, cargoSprite("GOOD_SPICE"), e + 12, r + 52);
      // fener direği
      vline(t, e + 24, r - 26, r - 12, "#2a2a30"), rect(t, e + 23, r - 29, 3, 3, "#ffe8a0"), __px(t, e + 24, r - 30, "#2a2a30");
    }
  }
  // Kıyı ipucu: hareketsiz kısım (zemin, kum, evler, fener) tür+genişlik başına bir kez önbelleğe çizilir;
  // her karede yalnızca köpük ışıltıları çizilir (son 30 sn boyunca kare maliyeti yarıya iner).
  const coastCache = new Map();
  export function drawCoastHint(t, e, a, r, n) {
    const key = n + "|" + e;
    let c = coastCache.get(key);
    if (!c) {
      coastCache.size > 8 && coastCache.clear();
      c = makeCanvas(e, 142);
      drawCoastHintRaw(c.getContext("2d"), e, 130, 0, n, !0);
      coastCache.set(key, c);
    }
    t.drawImage(c, 0, Math.round(a) - 130);
    for (let s = 0; s < e; s++) {
      let o = Math.round(Math.sin(s * 0.03) * 4 + Math.sin(s * 0.11) * 2);
      Math.sin(s * 0.5 + r * 2) > 0.3 && __px(t, s, Math.round(a) + o + 1 + (Math.sin(s * 0.2 + r) > 0 ? 1 : 0), "#ffffff");
    }
  }
  function drawCoastHintRaw(t, e, a, r, n, still = !1) {
    // Yaklaşılan kıyı (ekranın üstünde): kumsal + önden görünen evler
    let i = rn[n] || rn.trade,
      top = a - 90;
    for (let s = 0; s < e; s++) {
      let o = Math.round(Math.sin(s * 0.03) * 4 + Math.sin(s * 0.11) * 2),
        sy = a + o;
      rect(t, s, top, 1, sy - top - 5, i.ground), rect(t, s, sy - 5, 1, 4, n === "ice" ? "#f4fbff" : n === "volcanic" ? "#4a3e40" : "#e6d6a0"), __px(t, s, sy - 1, n === "ice" ? "#d8ecf6" : n === "volcanic" ? "#3a3032" : "#d0bc84");
      __px(t, s, sy, "rgba(200,240,245,0.7)"), !still && Math.sin(s * 0.5 + r * 2) > 0.3 && __px(t, s, sy + 1 + (Math.sin(s * 0.2 + r) > 0 ? 1 : 0), "#ffffff");
      (s * 7) % 5 === 0 && __px(t, s, sy - 9 - ((s * 13) % 17), i.g2);
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
              n === "ice" && hline(t, x - 1, x + 16, y - 9, "#ffffff");
            },
          });
    }
    L.push({ y: a - 8, fn: () => tower(t, Math.round(e * 0.8), a - 8, 22, r, { bands: !0, w: 4 }) });
    if (n === "military") for (let s = 0; s < e; s += 9) L.push({ y: a - 6.5, fn: () => (rect(t, s, a - 13, 7, 6, "#8a8a92"), hline(t, s, s + 6, a - 13, "#b0b0b8"), rect(t, s + 1, a - 15, 2, 2, "#9a9aa2"), rect(t, s + 5, a - 15, 2, 2, "#9a9aa2")) });
    n === "pirate" && L.push({ y: a - 7, fn: () => (vline(t, e * 0.2, a - 30, a - 8, "#3a2412"), rect(t, e * 0.2 + 1, a - 30, 9, 6, "#0a0a0a"), rect(t, e * 0.2 + 4, a - 28, 3, 2, "#fff")) });
    n === "final" &&
      L.push({
        y: a - 7.5,
        fn: () => {
          let x = Math.round(e * 0.45);
          rect(t, x - 20, a - 22, 40, 14, "#f4ead5");
          for (let k = 0; k < 12; k++) hline(t, x - Math.round(Math.sqrt(144 - (12 - k) * (12 - k))), x + Math.round(Math.sqrt(144 - (12 - k) * (12 - k))), a - 34 + k, k < 5 ? "#fff0b0" : "#e0b040");
        },
      });
    L.sort((p, q) => p.y - q.y);
    for (let o of L) o.fn();
    if (n === "volcanic") for (let s = 0; s < 6; s++) disc(t, e * 0.3 + Math.sin(r + s) * 4, a - 34 - s * 6, 4, "rgba(60,50,50,0.5)");
  }

