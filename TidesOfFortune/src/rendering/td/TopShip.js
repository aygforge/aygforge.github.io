// TOP-DOWN gemiler: pruva üstte, kıç altta. Her seviyenin kendi gövde silüeti, güverte düzeni,
// 3/4 (üst-karşı) bakış çizimleri — tof-art-src/art kaynaklarından kaynak koda taşındı.
import { disc, ellipse, hash2, hline, line, makeCanvas, px, rect, shade, vline } from '../pixel.js';
import { dS, mkSpr } from './TopChars.js';

export const TD_SHIPS = {
  1: { name: 'Paslı Martı', len: 156, beam: 64, rim: '#5a2a1a', rim2: '#8a4a32', deck: '#b98a58', deck2: '#a47648', trim: '#c88a5a', sail: '#e9ddbc', sailShade: '#c9b48c', flag: '#c8423b',
    masts: [{ t: 0.4, yard: 76 }], helm: 0.87, hatch: { t: 0.6, w: 18, h: 14 }, quarter: 0, fore: 0, cannons: 0, bowsprit: 16, patches: true, boat: false },
  2: { name: 'Çift Yelkenli', len: 170, beam: 74, rim: '#1f4240', rim2: '#2f5e5a', deck: '#c49a62', deck2: '#ae8650', trim: '#d8c890', sail: '#f2ead2', sailShade: '#d0c4a2', flag: '#3b6ea5',
    masts: [{ t: 0.3, yard: 74 }, { t: 0.6, yard: 88 }], helm: 0.88, hatch: { t: 0.45, w: 18, h: 14 }, quarter: 0.84, fore: 0, cannons: 0, bowsprit: 20, boat: false },
  3: { name: 'Brig', len: 186, beam: 84, rim: '#2e1c0e', rim2: '#5c3a1e', deck: '#c8a06a', deck2: '#b28a56', trim: '#e8e0c8', sail: '#f4ecd8', sailShade: '#d4c8a8', flag: '#c8423b',
    masts: [{ t: 0.28, yard: 92 }, { t: 0.56, yard: 104 }], helm: 0.9, hatch: { t: 0.42, w: 20, h: 16 }, quarter: 0.79, fore: 0, cannons: 2, bowsprit: 22, boat: false },
  4: { name: 'Firkateyn', len: 200, beam: 96, rim: '#1c120c', rim2: '#3a2a20', deck: '#cfa872', deck2: '#b8925e', trim: '#e0b84a', sail: '#f6efe0', sailShade: '#d6ccb4', flag: '#c8423b',
    masts: [{ t: 0.22, yard: 96 }, { t: 0.45, yard: 118 }, { t: 0.66, yard: 106 }], helm: 0.91, hatch: { t: 0.555, w: 22, h: 14 }, quarter: 0.8, fore: 0.1, cannons: 3, bowsprit: 24, boat: true },
  5: { name: 'Ticaret Galeonu', len: 216, beam: 112, rim: '#24120a', rim2: '#4a2a18', deck: '#d4ae78', deck2: '#bc9662', trim: '#f0c040', sail: '#fbf3dc', sailShade: '#ddd0b0', flag: '#8b5bb5',
    masts: [{ t: 0.2, yard: 112 }, { t: 0.43, yard: 134 }, { t: 0.64, yard: 122 }], helm: 0.9, hatch: { t: 0.535, w: 28, h: 16 }, quarter: 0.77, fore: 0.12, cannons: 4, bowsprit: 26, boat: true, gold: true },
};

// Diğer gemiler için stil (aynı üretici, farklı renk/bayrak)
export const SHIP_STYLES = {
  pirate: { rim: '#0e0a0c', rim2: '#2a2026', deck: '#6a5a4e', deck2: '#5a4a40', trim: '#8a2a2a', sail: '#2a2830', sailShade: '#161418', flag: '#0a0a0a', skull: true },
  merchant: { rim: '#4a2a14', rim2: '#7a4a24', deck: '#d4b07a', deck2: '#c09a64', trim: '#e8c45a', sail: '#f4ead5', sailShade: '#c8423b', flag: '#f2c14e', stripes: true },
  warship: { rim: '#141c2a', rim2: '#2a3448', deck: '#b8a07a', deck2: '#a48c66', trim: '#e0b84a', sail: '#f4f6f8', sailShade: '#c4ccd6', flag: '#3b6ea5' },
  ghost: { rim: '#1a3a30', rim2: '#2a5a4a', deck: '#4a8a72', deck2: '#3a7a62', trim: '#8affd0', sail: '#9affd0', sailShade: '#5ac8a0', flag: '#2a5a4a', ghost: true },
  red: { rim: '#2a0a0c', rim2: '#4a1a1e', deck: '#6a4a3e', deck2: '#5a3a30', trim: '#e0b040', sail: '#b8282c', sailShade: '#7e1a1e', flag: '#b8282c', skull: true },
  guild: { rim: '#3a2a10', rim2: '#6a4a18', deck: '#d8b878', deck2: '#c4a062', trim: '#f2c14e', sail: '#f4e4b8', sailShade: '#e0b040', flag: '#e0b040', stripes: true },
  // Paket 2: yarış kaptanları, Varo'nun eski filo gemisi, gezgin mutfak gemisi
  liora: { rim: '#0e3a48', rim2: '#1f6a7a', deck: '#d8c49a', deck2: '#c4ae84', trim: '#58d0c8', sail: '#4ac8c0', sailShade: '#2a8a8a', flag: '#58d0c8' },
  boran: { rim: '#2a1414', rim2: '#4a2222', deck: '#8a6a52', deck2: '#7a5a44', trim: '#c8a060', sail: '#8a1f2a', sailShade: '#5a1218', flag: '#8a1f2a' },
  varo: { rim: '#141414', rim2: '#2a2a2a', deck: '#7a6a5a', deck2: '#6a5a4a', trim: '#e0c040', sail: '#3a3a3e', sailShade: '#1e1e22', flag: '#e0c040', stripes: true },
  kitchen: { rim: '#4a3018', rim2: '#7a5030', deck: '#c8a070', deck2: '#b48c5c', trim: '#e8e0c8', sail: '#f0e6cc', sailShade: '#d0b890', flag: '#e07a3a' },
  plague: { rim: '#2a2618', rim2: '#4a4430', deck: '#8a7c58', deck2: '#7a6c4a', trim: '#6a6040', sail: '#8a8262', sailShade: '#5a5440', flag: '#e8d040' },
};

export const GRID = 3; // dolaşım ızgarası hücre boyutu (px)
const cache = new Map();

  // ===== 3/4 (üst-karşı) bakış: gemi =====
  // Güverte planı (u: enine, v: boyuna) aynı kalır; yüksekliği olan her şey ekranda yukarı doğru çizilir.
  // Yönler: "up" (pruva yukarı, kıçtan bakış), "down" (pruva bize doğru), "right"/"left" (yandan).
  function yc(t, e) {
    let a = e / t.len,
      r = t.beam / 2;
    return a < 0.32 ? r * Math.pow(Math.sin(((a / 0.32) * Math.PI) / 2), 0.75) : a > 0.86 ? r * (1 - (a - 0.86) * 0.9) : r;
  }
  function shipGeom(n, t, ori) {
    let maxYard = Math.max(...n.masts.map((F) => F.yard)),
      mastH = n.masts.map((F) => Math.round(F.yard * 0.5 + 40)),
      wallH = 12 + t * 2 + (n.quarter ? 2 : 0),
      len = n.len,
      beam = n.beam,
      G = { ori, wallH, mastH, vert: ori === "up" || ori === "down" };
    if (ori === "up") {
      let W = Math.max(beam + 16, maxYard + 12),
        cx = Math.round(W / 2),
        top = Math.max(n.bowsprit + 8, ...n.masts.map((F, i) => mastH[i] + 18 - Math.round(len * F.t)));
      (G.w = W), (G.h = top + len + wallH + 10), (G.P = (u, v) => ({ x: cx + u, y: top + v })), (G.inv = (x, y) => [x - cx, y - top]), (G.cx = cx), (G.top = top);
    } else if (ori === "down") {
      let W = Math.max(beam + 16, maxYard + 12),
        cx = Math.round(W / 2),
        top = Math.max(8, ...n.masts.map((F, i) => mastH[i] + 18 - (len - 1 - Math.round(len * F.t))));
      (G.w = W), (G.h = top + len + wallH + Math.round(n.bowsprit * 0.6) + 14), (G.cx = cx), (G.top = top);
      (G.P = (u, v) => ({ x: cx - u, y: top + len - 1 - v })), (G.inv = (x, y) => [cx - x, top + len - 1 - y]);
    } else {
      let cy = Math.max(...mastH) + Math.round(maxYard * 0.25) + 12,
        bs = n.bowsprit + 8;
      (G.h = cy + Math.round(beam / 2) + wallH + 10), (G.w = len + bs + 12), (G.cy = cy);
      if (ori === "right") (G.P = (u, v) => ({ x: 6 + len - 1 - v, y: cy + u })), (G.inv = (x, y) => [y - cy, 6 + len - 1 - x]);
      else (G.P = (u, v) => ({ x: bs + 6 + v, y: cy - u })), (G.inv = (x, y) => [cy - y, x - bs - 6]);
    }
    return G;
  }
  function crop(c, pad = 0) {
    let W = c.width,
      Hh = c.height,
      d = c.getContext("2d").getImageData(0, 0, W, Hh).data,
      x0 = W,
      y0 = Hh,
      x1 = -1,
      y1 = -1;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) d[(y * W + x) * 4 + 3] > 8 && (x < x0 && (x0 = x), x > x1 && (x1 = x), y < y0 && (y0 = y), y > y1 && (y1 = y));
    if (x1 < 0) return { img: makeCanvas(1, 1), x: 0, y: 0, w: 1, h: 1 };
    let o = makeCanvas(x1 - x0 + 1, y1 - y0 + 1);
    return o.getContext("2d").drawImage(c, -x0, -y0), { img: o, x: x0, y: y0, w: o.width, h: o.height };
  }
  // Fıçı / halat / dümen gibi dik duran küçük güverte objeleri
  export function deckBarrel(c = "#8a5a2b") {
    return mkSpr(9, 13, 4.5, 11, (t) => {
      rect(t, 1, 3, 7, 8, c), rect(t, 0, 4, 9, 6, c), hline(t, 1, 7, 2, shade(c, 0.25)), hline(t, 0, 8, 3, shade(c, 0.15)), hline(t, 1, 7, 4, shade(c, -0.35));
      hline(t, 0, 8, 5, "#3a2412"), hline(t, 0, 8, 9, "#3a2412"), vline(t, 2, 6, 8, shade(c, 0.15)), vline(t, 6, 6, 10, shade(c, -0.2)), hline(t, 1, 7, 11, shade(c, -0.35)), px(t, 4, 2, "#3a2412");
    });
  }
  function helmSprite() {
    return mkSpr(17, 21, 8.5, 19, (t) => {
      rect(t, 7, 12, 3, 7, "#5c3a1e"), rect(t, 6, 18, 5, 2, "#3a2412"), vline(t, 7, 12, 18, "#8a5a2b");
      let cx = 8,
        cy = 8;
      for (let a = 0; a < 6.28; a += 0.12) px(t, cx + Math.cos(a) * 5.4, cy + Math.sin(a) * 5.4, "#8b5a2b"), px(t, cx + Math.cos(a) * 4.6, cy + Math.sin(a) * 4.6, "#6a4424");
      for (let k = 0; k < 8; k++) {
        let a = (k * Math.PI) / 4;
        line(t, cx, cy, cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, "#a87a4a"), px(t, cx + Math.cos(a) * 7.2, cy + Math.sin(a) * 7.2, "#c89a62");
      }
      disc(t, cx, cy, 1, "#3a2412"), px(t, cx, cy, "#e0b040");
    });
  }
  export function cannonDraw(y, x, yy, dx, dy) {
    if (dx) {
      rect(y, x - 3, yy - 2, 6, 4, "#6a4424"), hline(y, x - 3, x + 2, yy - 2, "#8a5a2b"), px(y, x - 2, yy + 2, "#2a1a0c"), px(y, x + 1, yy + 2, "#2a1a0c");
      rect(y, dx > 0 ? x - 1 : x - 6, yy - 5, 8, 3, "#1e1e24"), hline(y, dx > 0 ? x - 1 : x - 6, dx > 0 ? x + 6 : x + 1, yy - 5, "#4a4a56"), rect(y, dx > 0 ? x + 6 : x - 7, yy - 6, 2, 5, "#2a2a32");
    } else if (dy > 0) {
      rect(y, x - 3, yy - 4, 7, 4, "#6a4424"), hline(y, x - 3, x + 3, yy - 4, "#8a5a2b"), rect(y, x - 1, yy - 3, 3, 6, "#1e1e24"), vline(y, x - 1, yy - 3, yy + 2, "#4a4a56"), rect(y, x - 2, yy + 2, 5, 3, "#2a2a32"), px(y, x, yy + 3, "#000");
    } else rect(y, x - 1, yy - 9, 3, 7, "#1e1e24"), vline(y, x - 1, yy - 9, yy - 3, "#4a4a56"), rect(y, x - 2, yy - 10, 5, 2, "#2a2a32"), rect(y, x - 3, yy - 3, 7, 4, "#6a4424"), hline(y, x - 3, x + 3, yy - 3, "#8a5a2b");
  }
  // Direk + serenler (yelkensiz) ve yelken katmanları
  function mastSprites(n, t, p, G, k) {
    let M = n.masts[k],
      mh = G.mastH[k],
      nm = n.masts.length,
      ns = t >= 3 ? (t === 5 && k === 1 ? 3 : 2) : 1,
      last = k === nm - 1,
      tilt = p >= 2 && last,
      flagMast = k === Math.floor(nm / 2) || nm === 1,
      vert = G.vert,
      front = G.ori === "down",
      sd = G.ori === "left" ? -1 : 1,
      cw = vert ? M.yard + 14 : 46,
      chh = mh + (vert ? 14 : Math.round(M.yard * 0.25) + 14),
      ax = Math.round(cw / 2),
      ay = chh - 5,
      mk = () => makeCanvas(cw, chh),
      mast = mk(),
      full = mk(),
      furl = mk(),
      y = mast.getContext("2d"),
      sf = full.getContext("2d"),
      su = furl.getContext("2d"),
      wood = "#6a4424",
      woodL = "#8a6034",
      woodD = "#3a2412";
    // yelken dilimleri (z: güverteden yükseklik)
    let z0 = 20,
      zTop = mh - 7,
      tot = zTop - z0,
      parts = ns === 1 ? [1] : ns === 2 ? [0.56, 0.44] : [0.42, 0.33, 0.25],
      wid = ns === 1 ? [1] : ns === 2 ? [1, 0.8] : [1, 0.8, 0.62],
      sails = [],
      zz = z0;
    for (let s = 0; s < ns; s++) {
      let hh = Math.round(tot * parts[s]);
      sails.push({ zb: zz + (s ? 2 : 0), zt: zz + hh - 1, w: Math.round(M.yard * wid[s]), wt: Math.round(M.yard * (wid[s + 1] || wid[s] * 0.86)) }), (zz += hh);
    }
    // gövde direği
    let pw = t >= 3 ? 4 : 3;
    rect(y, ax - 1, ay - mh, pw - 1, mh + 1, wood), vline(y, ax - 1, ay - mh, ay, woodL), vline(y, ax - 2 + pw, ay - mh + 1, ay, woodD);
    rect(y, ax - 2, ay - 14, pw + 1, 15, wood), vline(y, ax - 2, ay - 14, ay, woodL), vline(y, ax - 2 + pw, ay - 14, ay, woodD);
    for (let z = 10; z < mh - 6; z += 22) hline(y, ax - 2, ax - 2 + pw, ay - z, "#2a1a0c");
    rect(y, ax - 3, ay - 1, pw + 3, 3, "#2a1a0c"), hline(y, ax - 2, ax + pw - 1, ay - 1, woodL), px(y, ax - 1, ay - mh - 1, woodD);
    if (t >= 3 && vert) {
      // gözcü sepeti
      let cz = ay - Math.round(mh * 0.6);
      rect(y, ax - 5, cz, pw + 7, 4, "#5c3a1e"), hline(y, ax - 5, ax + pw + 1, cz, "#a87a4a"), hline(y, ax - 4, ax + pw, cz + 4, "#2a1a0c"), vline(y, ax - 5, cz, cz + 3, "#8a5a2b");
    }
    if (vert) {
      let hwD = Math.round(n.beam / 2) - 3;
      // çarmıh halatları
      line(y, ax - 1, ay - mh + 8, Math.max(1, ax - hwD), ay + 3, "rgba(40,24,12,0.42)"), line(y, ax + 1, ay - mh + 8, Math.min(cw - 2, ax + hwD), ay + 3, "rgba(40,24,12,0.42)");
      line(y, ax - 1, ay - mh + 8, Math.max(1, ax - hwD + 5), ay + 4, "rgba(40,24,12,0.25)"), line(y, ax + 1, ay - mh + 8, Math.min(cw - 2, ax + hwD - 5), ay + 4, "rgba(40,24,12,0.25)");
    }
    sails.forEach((S, s) => {
      let f = Math.round(S.w / 2),
        ft = Math.round(S.wt / 2),
        yt = ay - S.zt,
        yb = ay - S.zb;
      if (vert) {
        // seren
        let ty = tilt && s === ns - 1 ? 4 : 0;
        if (ty) line(y, ax - ft, yt - 2 + ty, ax + ft - 4, yt - 2 - ty, wood), line(y, ax - ft, yt - 1 + ty, ax + ft - 4, yt - 1 - ty, woodD);
        else hline(y, ax - ft, ax + ft, yt - 2, woodL), hline(y, ax - ft, ax + ft, yt - 1, woodD), px(y, ax - ft - 1, yt - 2, woodD), px(y, ax + ft + 1, yt - 2, woodD);
        s === 0 && ns === 1 && (hline(y, ax - f + 3, ax + f - 3, yb + 2, woodL), hline(y, ax - f + 3, ax + f - 3, yb + 3, woodD));
        // sarılı yelken
        for (let v = -ft + 2; v <= ft - 2; v++) {
          let rr = Math.abs(v) % 7 === 3;
          px(su, ax + v, yt, rr ? n.sailShade : n.sail), px(su, ax + v, yt + 1, rr ? shade(n.sailShade, -0.1) : shade(n.sail, -0.06)), px(su, ax + v, yt + 2, n.sailShade);
          Math.abs(v) % 7 === 3 && px(su, ax + v, yt - 1, n.sailShade);
        }
        // açık yelken (yamuk + karın)
        let hh = yb - yt;
        for (let r = 0; r <= hh; r++) {
          let q = r / Math.max(1, hh),
            half = ft + (f - ft) * q + Math.sin(q * Math.PI) * 2.2,
            roach = 0;
          half = Math.round(half);
          for (let v = -half; v <= half; v++) {
            let e2 = v / Math.max(1, half);
            if (r > hh - 4) {
              roach = Math.round((1 - e2 * e2) * 3.5);
              if (r > hh - roach) continue;
            }
            let c = n.sail,
              edge = Math.abs(v) >= half - 1 || r === 0 || r >= hh - Math.round((1 - e2 * e2) * 3.5) - 0;
            // hacim: sol-üst aydınlık, sağ-alt gölge
            let sh = (front ? 0.05 : 0) + (1 - Math.abs(e2 + 0.25)) * 0.07 - q * 0.08 - (e2 > 0.55 ? 0.07 : 0);
            c = shade(n.sail, Math.max(-0.3, Math.min(0.2, sh)));
            if ((v + 400) % 9 === 0) c = shade(n.sailShade, 0.1);
            if (n.stripes && Math.floor((v + 400) / 7) % 2) c = n.sailShade;
            if (edge) c = n.sailShade;
            if (r === Math.round(hh * 0.3) && (v + 400) % 4 < 2) c = shade(n.sailShade, -0.1);
            if (p >= 2 && hash2(v + k * 31, r + s * 17, 5) > 0.975) continue;
            if (p >= 3 && hash2(Math.floor(v / 5) + k * 7, Math.floor(r / 6) + s * 3, 9) > 0.9) continue;
            px(sf, ax + v, yt + r, c);
          }
        }
        // amblem
        if (n.skull && s === 0 && hh > 20) {
          let ex = ax,
            ey = yt + Math.round(hh * 0.55);
          rect(sf, ex - 3, ey - 4, 7, 5, "#f0ece0"), rect(sf, ex - 2, ey + 1, 5, 2, "#f0ece0"), rect(sf, ex - 2, ey - 2, 2, 2, "#1a1418"), rect(sf, ex + 1, ey - 2, 2, 2, "#1a1418"), px(sf, ex, ey + 1, "#1a1418");
          line(sf, ex - 5, ey + 4, ex + 5, ey + 7, "#f0ece0"), line(sf, ex + 5, ey + 4, ex - 5, ey + 7, "#f0ece0");
        }
        // ıskota halatları
        line(sf, ax - f, yb - 2, ax - Math.round(n.beam / 2) + 3, ay + 2, "rgba(40,24,12,0.35)"), line(sf, ax + f, yb - 2, ax + Math.round(n.beam / 2) - 3, ay + 2, "rgba(40,24,12,0.35)");
      } else {
        // yandan: seren dikine kısalmış, yelken hilal
        let half = Math.round(S.w * 0.25),
          halfT = Math.round(S.wt * 0.25),
          yA = yt - halfT,
          yB = yb + half,
          B = 10 + Math.round(S.w / 16);
        vline(y, ax + sd, yt - halfT, yt + halfT, woodL);
        for (let r = yt - halfT; r <= yt + halfT; r++) px(su, ax + sd * 2, r, (r + 99) % 6 === 0 ? n.sailShade : n.sail), px(su, ax + sd * 3, r, n.sailShade);
        for (let r = yA; r <= yB; r++) {
          let q = (r - yA) / Math.max(1, yB - yA),
            bw = Math.round(B * Math.pow(Math.sin(q * Math.PI), 0.6));
          for (let v = 1; v <= bw + 1; v++) {
            if (p >= 2 && hash2(v + k * 31, r + s * 17, 5) > 0.97) continue;
            let c = v >= bw || r === yA || r === yB ? n.sailShade : shade(n.sail, 0.1 - (v / B) * 0.2 - q * 0.1);
            if (n.stripes && Math.floor((r + 400) / 7) % 2) c = v >= bw ? shade(n.sailShade, -0.15) : n.sailShade;
            (r + 400) % 11 === 0 && (c = n.sailShade), px(sf, ax + sd * (v + 1), r, c);
          }
        }
      }
    });
    // bayrak direği ucu
    let flag = null;
    if (flagMast) flag = { dx: 0, dy: -mh - 1 };
    let bb = crop(full);
    return {
      mast: Object.assign(mast, { ax, ay }),
      full: Object.assign(full, { ax, ay }),
      furl: Object.assign(furl, { ax, ay }),
      box: { x0: bb.x - ax, y0: bb.y - ay, x1: bb.x + bb.w - ax, y1: bb.y + bb.h - ay },
      flag,
      h: mh,
      yardZ: sails[0].zt + 2,
      yardW: sails[0].wt,
      front,
    };
  }
  function shipRender(n, t, p, ori) {
    let G = shipGeom(n, t, ori),
      { w: W, h: Hh, P, inv, wallH } = G,
      len = n.len,
      vert = G.vert,
      hw = new Int16Array(len);
    for (let v = 0; v < len; v++) hw[v] = Math.round(yc(n, v));
    let I = (u, v) => v >= 0 && v < len && Math.abs(u) <= hw[v],
      rimK = (u, v) => {
        for (let k = 1; k <= 3; k++) for (let dv = -k; dv <= k; dv++) for (let du = -k; du <= k; du++) if ((Math.abs(dv) === k || Math.abs(du) === k) && !I(u + du, v + dv)) return k;
        return 0;
      },
      f = makeCanvas(W, Hh),
      y = f.getContext("2d"),
      Fq = n.quarter ? Math.round(len * n.quarter) : 0,
      Ff = n.fore ? Math.round(len * n.fore) : 0,
      cls = new Uint8Array(W * Hh),
      yTop = new Int16Array(W).fill(-1),
      yBot = new Int16Array(W).fill(-1),
      xMin = W,
      xMax = 0;
    for (let yy = 0; yy < Hh; yy++)
      for (let x = 0; x < W; x++) {
        let [u, v] = inv(x, yy);
        if (!I(u, v)) continue;
        let k = rimK(u, v);
        (cls[yy * W + x] = k ? k : 4), yTop[x] < 0 && (yTop[x] = yy), (yBot[x] = yy), x < xMin && (xMin = x), x > xMax && (xMax = x);
      }
    let xc = (xMin + xMax) / 2,
      halfX = Math.max(1, (xMax - xMin) / 2),
      whAt = (x) => {
        let e = Math.abs(x - xc) / halfX;
        return vert ? (ori === "up" ? wallH - Math.round(3 * e * e * e) : wallH + 2 - Math.round(5 * e * e)) : wallH - Math.round(4 * Math.pow(e, 6));
      };
    // su altındaki gölge
    y.fillStyle = "rgba(8,20,40,0.26)";
    for (let x = xMin; x <= xMax; x++) yBot[x] >= 0 && y.fillRect(x + 4, yTop[x] + 8, 1, yBot[x] + whAt(x) + 5 - yTop[x] - 8);
    // gövde yan duvarı (bize bakan yüz)
    let stemX = P(0, 0).x,
      tw = hw[len - 1];
    for (let x = xMin; x <= xMax; x++) {
      if (yBot[x] < 0) continue;
      let wh = whAt(x),
        e = (x - xc) / halfX,
        quarter = vert && ori === "up" && Math.abs(x - xc) > tw,
        dark = (quarter ? -0.16 : 0) + (vert ? e * -0.06 : 0);
      for (let k = 1; k <= wh; k++) {
        let c;
        if (k <= 2) c = shade(n.rim2, 0.04);
        else if (k === 3) c = n.trim;
        else if (k >= wh - 1) c = shade(n.rim, -0.45);
        else c = k % 3 === 1 ? n.rim : shade(n.rim2, -0.14);
        if (k > 3 && k < wh - 1 && ((x + Math.floor(k / 3) * 7) % 13 === 0)) c = n.rim;
        px(y, x, yBot[x] + k, dark ? _t2(c, dark) : c);
      }
    }
    // güverte + küpeşte
    for (let yy = 0; yy < Hh; yy++)
      for (let x = 0; x < W; x++) {
        let k = cls[yy * W + x];
        if (!k) continue;
        let [u, v] = inv(x, yy),
          c;
        if (k === 1) c = n.rim;
        else if (k === 2) c = shade(n.rim2, x < xc ? 0.1 : -0.02);
        else if (k === 3) c = n.trim;
        else {
          let idx = Math.floor((u + 200) / 4),
            seam = (u + 200) % 4 === 0,
            butt = Math.floor((v + idx * 17) / 23) !== Math.floor((v + 1 + idx * 17) / 23),
            raised = (Fq && v >= Fq) || (Ff && v < Ff);
          let am = (raised ? 0.09 : 0) + (hash2(u, v, 7) > 0.9 ? -0.05 : 0);
          c = idx % 2 ? n.deck : n.deck2;
          am && (c = shade(c, am));
          seam && (c = shade(n.deck2, raised ? -0.14 : -0.2)), butt && (c = shade(n.deck2, -0.27));
        }
        px(y, x, yy, c);
      }
    if (n.gold)
      for (let v = 6; v < len - 2; v += 3) for (let s of [-1, 1]) {
        let q = P(s * hw[v], v);
        px(y, q.x, q.y, "#f0c040");
      }
    // uzak taraftaki küpeştenin iç yüzü (derinlik)
    for (let x = xMin; x <= xMax; x++) {
      let yy = yTop[x];
      if (yy < 0) continue;
      while (yy < Hh && cls[yy * W + x] !== 4 && cls[yy * W + x] !== 0) yy++;
      if (cls[yy * W + x] !== 4) continue;
      for (let j = 0; j < 5; j++) {
        if (cls[(yy + j) * W + x] !== 4) break;
        if (j === 4) (y.fillStyle = "rgba(20,10,4,0.22)"), y.fillRect(x, yy + j, 1, 1);
        else px(y, x, yy + j, j === 0 ? shade(n.rim2, 0.12) : x % 6 === 0 ? n.rim : shade(n.rim2, -0.1 - j * 0.05));
      }
    }
    // sol küpeştenin güverteye düşen gölgesi
    y.fillStyle = "rgba(20,10,4,0.14)";
    for (let yy = 0; yy < Hh; yy++) for (let x = 1; x < W; x++) cls[yy * W + x] === 4 && cls[yy * W + x - 1] === 3 && x < xc && y.fillRect(x, yy, 2, 1);
    // --- kıç aynası / pruva süsleri ---
    if (ori === "up") {
      let q = P(0, len - 1),
        x0 = q.x - tw,
        yb = q.y;
      if (t >= 2) {
        let nw = t,
          gap = (tw * 2 - 6) / nw;
        for (let i = 0; i < nw; i++) {
          let wx = Math.round(x0 + 3 + gap * i + gap / 2 - 2);
          rect(y, wx - 1, yb + 4, 6, 7, n.rim), rect(y, wx, yb + 5, 4, 5, n.ghost ? "#8affd0" : "#8fc0dc"), vline(y, wx + 2, yb + 5, yb + 9, n.rim), hline(y, wx, wx + 3, yb + 7, n.rim), px(y, wx, yb + 5, "#e8f6ff"), px(y, wx + 3, yb + 8, "#5a90b0");
          hline(y, wx - 1, wx + 4, yb + 11, n.trim);
        }
        hline(y, x0 + 2, q.x + tw - 2, yb + 12, shade(n.rim, -0.2));
      } else rect(y, q.x - 7, yb + 5, 14, 4, shade(n.rim2, -0.25)), hline(y, q.x - 6, q.x + 5, yb + 6, n.trim), hline(y, q.x - 6, q.x + 5, yb + 7, shade(n.trim, -0.25));
      n.gold && (hline(y, x0 + 1, q.x + tw - 1, yb + 2, "#f0c040"), px(y, q.x, yb + 12, "#f0c040"), px(y, q.x - 1, yb + 13, "#c89030"), px(y, q.x + 1, yb + 13, "#c89030"));
      n.skull && (rect(y, q.x - 2, yb + wallH - 7, 5, 3, "#e8e4d8"), px(y, q.x - 1, yb + wallH - 6, "#1a1418"), px(y, q.x + 1, yb + wallH - 6, "#1a1418"), hline(y, q.x - 1, q.x + 1, yb + wallH - 4, "#e8e4d8"));
      rect(y, q.x - 1, yb + wallH - 5, 2, 8, "#2a1a0c"), vline(y, q.x - 1, yb + wallH - 5, yb + wallH + 2, "#4a3018");
      if (t >= 4)
        for (let s of [-1, 1]) {
          let lx = q.x + s * (tw - 3);
          vline(y, lx, yb - 7, yb - 1, "#2a1a0c"), rect(y, lx - 1, yb - 11, 3, 4, "#3a2a1a"), rect(y, lx, yb - 10, 1, 2, "#ffd060");
        }
    } else if (ori === "down") {
      let q = P(0, 0);
      vline(y, q.x, q.y + 1, q.y + wallH + 1, shade(n.rim2, 0.15)), vline(y, q.x - 1, q.y + 2, q.y + wallH, n.rim);
      t >= 4 && (rect(y, q.x - 1, q.y - 1, 3, 5, "#f0c040"), px(y, q.x, q.y - 2, "#fff0a0"), px(y, q.x, q.y + 4, "#c89030"));
      let ax2 = q.x - Math.round(n.beam * 0.28),
        ayy = yBot[ax2] + 5;
      vline(y, ax2, ayy, ayy + 4, "#8a8a92"), hline(y, ax2 - 2, ax2 + 2, ayy + 4, "#8a8a92"), px(y, ax2 - 2, ayy + 3, "#8a8a92"), px(y, ax2 + 2, ayy + 3, "#8a8a92"), px(y, ax2, ayy - 1, "#1a1418");
      px(y, q.x + Math.round(n.beam * 0.28), yBot[q.x + Math.round(n.beam * 0.28)] + 4, "#1a1418");
    }
    // cıvadra
    {
      let q = P(0, 0),
        L = n.bowsprit;
      if (ori === "up") rect(y, q.x - 1, q.y - L, 2, L + 6, "#4a3018"), vline(y, q.x - 1, q.y - L, q.y + 5, "#6a4424"), px(y, q.x, q.y - L - 1, "#2a1a0c"), px(y, q.x - 1, q.y - L - 1, "#2a1a0c");
      else if (ori === "down") {
        let l2 = Math.round(L * 0.6) + 4;
        rect(y, q.x - 1, q.y - 3, 3, l2, "#4a3018"), vline(y, q.x - 1, q.y - 3, q.y + l2 - 4, "#7a5030"), hline(y, q.x - 1, q.x + 1, q.y + l2 - 3, "#2a1a0c");
      } else {
        let s = ori === "right" ? 1 : -1;
        for (let i = -3; i < L + 4; i++) px(y, q.x + s * i, q.y - Math.round(Math.max(0, i) * 0.3), "#6a4424"), px(y, q.x + s * i, q.y + 1 - Math.round(Math.max(0, i) * 0.3), "#4a3018");
      }
    }
    // --- güverte donanımı ---
    let rectAt = (v0, wU, wV) => {
        let c = P(0, v0 + wV / 2),
          rw = vert ? wU : wV,
          rh = vert ? wV : wU;
        return { x: Math.round(c.x - rw / 2), y: Math.round(c.y - rh / 2), w: rw, h: rh };
      },
      fenceH = (xa, xb, yy) => {
        hline(y, xa, xb, yy - 4, n.trim), hline(y, xa, xb, yy - 3, shade(n.rim2, -0.1));
        for (let x = xa; x <= xb; x += 4) vline(y, x, yy - 3, yy, n.rim2), px(y, x, yy + 1, "rgba(20,10,4,0.3)");
        hline(y, xa, xb, yy, shade(n.rim, 0.05));
      },
      wallS = (xa, xb, yy, h2) => {
        for (let k = 0; k < h2; k++) hline(y, xa, xb, yy + k, k === 0 ? n.trim : k % 3 === 2 ? n.rim : shade(n.rim2, -0.08));
        hline(y, xa, xb, yy + h2, "rgba(20,10,4,0.3)");
        let mx = Math.round((xa + xb) / 2);
        rect(y, mx - 3, yy + 1, 6, h2 - 1, "#2a1a0c"), rect(y, mx - 2, yy + 2, 4, h2 - 2, "#4a2e18"), px(y, mx + 1, yy + Math.floor(h2 / 2) + 1, "#e0b040");
        hline(y, xa, xb, yy - 1, shade(n.rim2, 0.15));
      },
      stepEdge = (v0, raisedBow) => {
        // v0 sınırında yükseltilmiş güverte; raisedBow: pruva tarafı yüksek
        let hwv = hw[Math.max(0, Math.min(len - 1, v0))] - 3;
        if (hwv < 3) return;
        let a = P(-hwv, v0),
          c = P(hwv, v0);
        if (vert) {
          let xa = Math.min(a.x, c.x),
            xb = Math.max(a.x, c.x),
            southRaised = ori === "up" ? !raisedBow : raisedBow; // yükselti ekranda aşağıda mı
          if (southRaised) {
            // korkuluk + merdiven boşlukları
            fenceH(xa + 9, xb - 9, a.y), fenceH(xa, xa + 2, a.y), fenceH(xb - 2, xb, a.y);
            for (let s of [0, 1]) {
              let sx = s ? xb - 8 : xa + 3;
              for (let j = 0; j < 3; j++) hline(y, sx, sx + 5, a.y - 1 - j * 2, j % 2 ? shade(n.deck, 0.12) : shade(n.deck2, -0.2));
            }
          } else wallS(xa, xb, a.y, 6);
        } else {
          let ya = Math.min(a.y, c.y),
            yb = Math.max(a.y, c.y);
          vline(y, a.x, ya, yb, shade(n.deck2, -0.3));
          for (let yy = ya + 1; yy < yb; yy += 5) vline(y, a.x, yy - 3, yy, n.rim2), px(y, a.x, yy - 4, n.trim);
        }
      };
    Fq && stepEdge(Fq, !1), Ff && stepEdge(Ff, !0);
    // ambar kapağı
    let _v = Math.round(len * n.hatch.t),
      hr = rectAt(_v, n.hatch.w, n.hatch.h);
    (y.fillStyle = "rgba(20,10,4,0.22)"), y.fillRect(hr.x, hr.y, hr.w + 2, hr.h + 2);
    rect(y, hr.x - 1, hr.y - 3, hr.w + 2, hr.h + 2, n.rim), rect(y, hr.x, hr.y - 2, hr.w, hr.h, "#5c3a1e");
    for (let i = 0; i < hr.w; i += 3) vline(y, hr.x + i, hr.y - 2, hr.y + hr.h - 3, "#3a2412");
    for (let i = 0; i < hr.h; i += 3) hline(y, hr.x, hr.x + hr.w - 1, hr.y - 2 + i, "#3a2412");
    rect(y, hr.x - 1, hr.y + hr.h - 1, hr.w + 2, 2, shade(n.rim, -0.25)), hline(y, hr.x - 1, hr.x + hr.w, hr.y - 3, shade(n.rim2, 0.12));
    // toplar
    let C = [],
      props = [];
    for (let i = 0; i < n.cannons; i++) {
      let v = Math.round(len * (0.34 + (i / Math.max(1, n.cannons)) * 0.38));
      for (let s of [-1, 1]) {
        let u = s * (hw[v] - 6),
          q = P(u, v),
          o = P(u + s * 5, v);
        cannonDraw(y, q.x, q.y, Math.sign(o.x - q.x), Math.sign(o.y - q.y)), C.push({ u, v, side: s });
      }
    }
    // filika
    if (n.boat) {
      let v0 = Math.round(len * 0.73),
        u0 = hw[v0] - 14;
      for (let i = 0; i < 18; i++) {
        let w2 = Math.round(Math.min(4, 1 + i * 0.6, (18 - i) * 0.7));
        for (let du = -w2; du <= w2; du++) {
          let q = P(u0 + du, v0 + i - 9);
          px(y, q.x, q.y, Math.abs(du) === w2 || i === 17 ? "#5c3a1e" : i % 6 === 3 ? "#6a4424" : "#a87a4a");
        }
      }
    }
    // direk tabanları + direk/yelken sprite'ları
    let masts = n.masts.map((M, k) => {
      let q = P(0, Math.round(len * M.t)),
        S = mastSprites(n, t, p, G, k);
      return disc(y, q.x, q.y, 4, "rgba(20,10,4,0.3)"), disc(y, q.x, q.y, 3, "#2a1a0c"), { x: q.x, y: q.y, yard: M.yard, v: Math.round(len * M.t), h: S.h, spr: S };
    });
    // dümen
    let Tv = Math.round(len * n.helm),
      hq = P(0, Tv);
    disc(y, hq.x, hq.y, 3, "rgba(20,10,4,0.25)");
    props.push({ x: hq.x, y: hq.y, img: helmSprite() });
    // fıçılar & halat kangalları (kanonik konumlar)
    let blk = [],
      barrel = (u, v, c) => {
        let q = P(u, v);
        (y.fillStyle = "rgba(20,10,4,0.25)"), y.fillRect(q.x - 3, q.y, 8, 2), props.push({ x: q.x, y: q.y + 1, img: deckBarrel(c) }), blk.push({ u, v, r: 4 });
      },
      coil = (u, v) => {
        let q = P(u, v);
        ellipse(y, q.x, q.y, 4, 3, "#8a6a40"), ellipse(y, q.x, q.y, 3, 2, "#c8a070"), ellipse(y, q.x, q.y, 1, 1, "#6a5030"), px(y, q.x + 4, q.y + 2, "#c8a070"), px(y, q.x + 5, q.y + 3, "#c8a070"), blk.push({ u, v, r: 3 });
      },
      Wv = Math.round(len * 0.18),
      oe = Math.round(len * (n.quarter ? n.quarter - 0.04 : 0.8));
    coil(-hw[Wv] + 7, Wv), barrel(hw[Wv] - 7, Wv + 4, "#8a5a2b"), barrel(-hw[oe] + 7, oe, "#8a5a2b"), t >= 3 && barrel(-hw[oe] + 7, oe - 8, "#7a4a34");
    // hasar
    if (p >= 1)
      for (let i = 0; i < 3 + p * 3; i++) {
        let v = 12 + Math.round(hash2(i, t, 31) * (len - 24)),
          hv = hw[v] - 5,
          u = -hv + Math.round(hash2(i, t, 32) * hv * 2),
          q = P(u, v);
        line(y, q.x, q.y, q.x + 2, q.y + 2, "#2a1608"), line(y, q.x + 2, q.y + 2, q.x + 1, q.y + 4, "#2a1608");
      }
    if (p >= 2)
      for (let i = 0; i < (p === 2 ? 3 : 6); i++) {
        let v = 14 + Math.round(hash2(i, t, 41) * (len - 30)),
          hv = hw[v] - 8,
          u = -hv + Math.round(hash2(i, t, 42) * hv * 2),
          q = P(u, v);
        i % 2
          ? (rect(y, q.x, q.y, 7, 5, "#d9b88a"), hline(y, q.x, q.x + 6, q.y + 2, "#b8946a"), px(y, q.x, q.y, "#4a3a2a"), px(y, q.x + 6, q.y + 4, "#4a3a2a"), px(y, q.x + 6, q.y, "#4a3a2a"), px(y, q.x, q.y + 4, "#4a3a2a"))
          : (rect(y, q.x, q.y, 5, 3, "#140a04"), hline(y, q.x, q.x + 4, q.y, "#3a2412"), px(y, q.x - 1, q.y + 1, "#e8c890"), px(y, q.x + 5, q.y, "#e8c890"), px(y, q.x + 2, q.y + 3, "#e8c890"));
      }
    if (p >= 3)
      for (let i = 0; i < 4; i++) {
        let v = 30 + Math.round(hash2(i, t, 51) * (len - 60)),
          hv = hw[v] - 10,
          u = -hv + Math.round(hash2(i, t, 52) * hv * 2),
          q = P(u, v);
        ellipse(y, q.x, q.y, 5, 3, "rgba(70,140,190,0.55)"), hline(y, q.x - 2, q.x, q.y - 1, "rgba(220,240,250,0.7)");
      }
    return { G, hull: f, hw, masts, props, C, blk, Tv, _v, hr, wallH, P };
  }
  export function _t2(c, e) {
    // rgb(...) veya #hex rengini koyulaştır/aydınlat
    if (c[0] === "#") return shade(c, e);
    let q = c.match(/\d+/g).map(Number),
      i = (s) => Math.max(0, Math.min(255, Math.round(e < 0 ? s * (1 + e) : s + (255 - s) * e)));
    return `rgb(${i(q[0])},${i(q[1])},${i(q[2])})`;
  }
  export function topShip(t, e = "healthy", a = null, ori = "up") {
    let r = `${t}|${e}|${a}|${ori}`;
    if (cache.has(r)) return cache.get(r);
    let n = { ...(TD_SHIPS[t] || TD_SHIPS[1]), ...(a ? SHIP_STYLES[a] : {}) },
      p = { healthy: 0, damaged: 1, critical: 2, sinking: 3 }[e] || 0,
      R = shipRender(n, t, p, ori),
      G = R.G,
      s = G.w,
      l = G.h,
      P = R.P,
      la;
    if (ori !== "up") {
      // Düşman/uzak gemiler: kanonik ("up") yerleşimden dönüştür
      let U = topShip(t, e, a, "up"),
        map = (x, y) => P(x - U.cx, y - U.top),
        rf = (f) => {
          let o = ["up", "right", "down", "left"],
            k = { up: 0, right: 1, down: 2, left: 3 }[ori];
          return o[(o.indexOf(f) + k) % 4];
        },
        c = P(0, n.len / 2);
      la = {
        level: t,
        st: n,
        ori,
        hull: R.hull,
        w: s,
        h: l,
        len: n.len,
        beam: n.beam,
        center: { x: c.x, y: c.y },
        cx: c.x,
        stations: U.stations.map((S) => ({ ...S, ...map(S.x, S.y), face: rf(S.face) })),
        cargoSlots: U.cargoSlots.map((S) => map(S.x, S.y)),
        masts: R.masts,
        props: R.props,
        sternH: R.wallH,
        style: a,
      };
      return cache.size > 40 && cache.clear(), cache.set(r, la), la;
    }
    let d = G.cx,
      o = G.top,
      x = (F) => yc(n, F - 0),
      _ = R._v,
      v = d - Math.round(n.hatch.w / 2),
      T = o + R.Tv,
      X = R.masts,
      C = R.C.map((c) => ({ x: d + c.u - c.side * 3, y: o + c.v, side: c.side })),
      q = R.blk.map((c) => ({ x: d + c.u, y: o + c.v, r: c.r + 1 })),
      He = Math.ceil(s / GRID),
      ea = Math.ceil(l / GRID),
      je = new Uint8Array(He * ea),
      $ = { x0: v - 2, y0: o + _ - 4, x1: v + n.hatch.w + 2, y1: o + _ + n.hatch.h + 2 },
      Z = gc(n, d, o, _);
    for (let F = 0; F < ea; F++)
      for (let ne = 0; ne < He; ne++) {
        let ye = ne * GRID + GRID / 2,
          Ve = F * GRID + GRID / 2,
          Me = Ve - o;
        if (Me < 12 || Me > n.len - 5) continue;
        let $a = x(Me) - 8;
        Math.abs(ye - d) > $a ||
          (ye > Z.x0 && ye < Z.x1 && Ve > Z.y0 && Ve < Z.y1) ||
          X.some((Ga) => Math.hypot(ye - Ga.x, Ve - Ga.y) < 6) ||
          Math.hypot(ye - d, Ve - T) < 6 ||
          q.some((Ga) => Math.hypot(ye - Ga.x, Ve - Ga.y) < Ga.r + 3) ||
          C.some((Ga) => Math.abs(ye - Ga.x) < 6 && Math.abs(Ve - Ga.y) < 5) ||
          (je[F * He + ne] = 1);
      }
    let _e = (F, ne) => {
        let ye = null,
          Ve = 1e9;
        for (let Me = 0; Me < ea; Me++)
          for (let $a = 0; $a < He; $a++) {
            if (!je[Me * He + $a]) continue;
            let Ga = Math.hypot($a * GRID + 1.5 - F, Me * GRID + 1.5 - ne);
            Ga < Ve && ((Ve = Ga), (ye = { x: $a * GRID + 1.5, y: Me * GRID + 1.5 }));
          }
        return ye;
      },
      Ie = (F, ne, ye, Ve) => ({ type: F, ..._e(ne, ye), face: Ve }),
      sa = [
        Ie("helm", d, T + 7, "up"),
        Ie("bow", d, o + 18, "up"),
        Ie("bowL", d - Math.round(x(30)) + 9, o + 30, "left"),
        Ie("bowR", d + Math.round(x(30)) - 9, o + 30, "right"),
        Ie("cargo", Z.x0 - 4, (Z.y0 + Z.y1) / 2, "right"),
        Ie("cargo", Z.x1 + 4, (Z.y0 + Z.y1) / 2, "left"),
        Ie("galley", d + Math.round(x(n.len * 0.75)) - 10, o + n.len * 0.75, "right"),
        Ie("stern", d - Math.round(x(n.len * 0.93)) + 9, o + n.len * 0.93, "down"),
        Ie("center", d, (X[0].y + Z.y0) / 2, "up"),
        ...X.map((F) => Ie("mast", F.x + 7, F.y + 2, "left")),
        ...[0.35, 0.5, 0.7].flatMap((F) => [
          Ie("railL", d - Math.round(x(n.len * F)) + 8, o + n.len * F, "left"),
          Ie("railR", d + Math.round(x(n.len * F)) - 8, o + n.len * F, "right"),
        ]),
        ...C.map((F) => Ie("cannon", F.x - F.side * 6, F.y, F.side > 0 ? "right" : "left")),
      ].filter((F) => F.x != null),
      we = [
        ...X.flatMap((F) => [
          { x: F.x - F.spr.yardW / 2 + 3, y: F.y, h: F.spr.yardZ, kind: "yard" },
          { x: F.x + F.spr.yardW / 2 - 3, y: F.y, h: F.spr.yardZ, kind: "yard" },
        ]),
        { x: d, y: o - n.bowsprit + 6, h: 2, kind: "bowsprit" },
        { x: d - Math.round(x(n.len * 0.9)) + 3, y: o + n.len * 0.9, h: 3, kind: "rail" },
      ];
    la = {
      level: t,
      st: n,
      ori,
      hull: R.hull,
      w: s,
      h: l,
      cx: d,
      top: o,
      len: n.len,
      beam: n.beam,
      walk: je,
      gw: He,
      gh: ea,
      stations: sa,
      perches: we,
      masts: X,
      props: R.props,
      cannons: C,
      cargoZone: Z,
      cargoSlots: bc(Z),
      hatchRect: $,
      helm: { x: d, y: T },
      hw: (F) => x(F - o),
      style: a,
      sternH: R.wallH,
      center: { x: d, y: o + n.len / 2 },
    };
    return cache.size > 40 && cache.clear(), cache.set(r, la), la;
  }
  function gc(t, e, a, r) {
    let n = Math.min(t.beam - 26, t.hatch.w + 22),
      i = t.hatch.h + 28;
    return { x0: e - Math.round(n / 2), x1: e + Math.round(n / 2), y0: a + r - 12, y1: a + r + i - 12 };
  }
  function bc(t) {
    let e = [],
      a = Math.max(2, Math.floor((t.x1 - t.x0) / 10)),
      r = Math.max(2, Math.floor((t.y1 - t.y0) / 10));
    for (let s = 0; s < r; s++) for (let o = 0; o < a; o++) e.push({ x: t.x0 + 5 + o * 10, y: t.y0 + 5 + s * 10 });
    let n = (t.x0 + t.x1) / 2,
      i = (t.y0 + t.y1) / 2;
    return e.sort((s, o) => Math.hypot(s.x - n, (s.y - i) * 1.3) - Math.hypot(o.x - n, (o.y - i) * 1.3)), e;
  }
  // Gemi katmanlarını (gövde, y-sıralı objeler, direk + yelkenler) çizer. items: [{y, fn}]
  export function shipCompose(i, r, sails, items, time, opts = {}) {
    i.drawImage(r.hull, 0, 0);
    let list = items.slice();
    for (let p of r.props) list.push({ y: p.y, fn: () => dS(i, p.img, p.x, p.y) });
    r.masts.forEach((M, k) => {
      list.push({
        y: M.y + 0.5,
        fn: () => {
          let S = M.spr,
            al = opts.sailAlpha ? opts.sailAlpha(k, M) : sails === "full" ? 0.85 : 1,
            g = i.globalAlpha;
          S.front && dS(i, S.mast, M.x, M.y);
          (i.globalAlpha = g * al), dS(i, sails === "full" ? S.full : S.furl, M.x, M.y), (i.globalAlpha = g);
          S.front || dS(i, S.mast, M.x, M.y);
          if (S.flag && !opts.noFlag) shipFlag(i, M.x + 1, M.y - M.h - 1, r.st.flag, r.st.skull, time + k);
        },
      });
    });
    list.sort((A, B) => A.y - B.y);
    for (let L of list) L.fn();
  }
  function shipFlag(i, x, y, col, skull, time) {
    let w = Math.sin(time * 5) > 0 ? 1 : 0;
    vline(i, x - 1, y - 8, y + 1, "#3a2412");
    rect(i, x, y - 8, 5, 4, col), rect(i, x + 5, y - 8 + w, 4, 4, col), px(i, x + 9, y - 7 + w, col), hline(i, x, x + 4, y - 5, _t2(col, -0.25));
    skull && (px(i, x + 3, y - 7, "#ffffff"), px(i, x + 4, y - 6, "#ffffff"), px(i, x + 2, y - 6, "#ffffff"));
  }
  // Mürettebatsız, tek parça gemi görüntüsü (uzaktaki gemiler için), yerleşim başına önbelleklenir
  export function shipStatic(r, sails) {
    r._st = r._st || {};
    if (r._st[sails]) return r._st[sails];
    let c = makeCanvas(r.w, r.h);
    return shipCompose(c.getContext("2d"), r, sails, [], 0, {}), (r._st[sails] = c), c;
  }

export function findPath(ship, sx, sy, tx, ty, blocked = null) {
  const { gw, gh, walk } = ship;
  const toCell = (x, y) => [Math.max(0, Math.min(gw - 1, Math.floor(x / GRID))), Math.max(0, Math.min(gh - 1, Math.floor(y / GRID)))];
  const [ax, ay] = toCell(sx, sy);
  const [bx, by] = toCell(tx, ty);
  const ok = (x, y) => x >= 0 && y >= 0 && x < gw && y < gh && walk[y * gw + x] && !(blocked && blocked.has(y * gw + x));
  if (!ok(bx, by)) return null;
  const start = ay * gw + ax;
  const goal = by * gw + bx;
  const g = new Map([[start, 0]]);
  const came = new Map();
  const open = [[Math.abs(ax - bx) + Math.abs(ay - by), start]];
  let iter = 0;
  while (open.length && iter++ < 4000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [, cur] = open.splice(bi, 1)[0];
    if (cur === goal) {
      const path = [];
      let n = cur;
      while (n !== start && n != null) {
        path.push({ x: (n % gw) * GRID + 1.5, y: Math.floor(n / gw) * GRID + 1.5 });
        n = came.get(n);
      }
      return path.reverse();
    }
    const cx = cur % gw, cy = Math.floor(cur / gw);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!ok(nx, ny) && !(nx === ax && ny === ay)) continue;
      const ni = ny * gw + nx;
      const ng = g.get(cur) + 1;
      if (ng < (g.get(ni) ?? 1e9)) {
        g.set(ni, ng);
        came.set(ni, cur);
        open.push([ng + Math.abs(nx - bx) + Math.abs(ny - by), ni]);
      }
    }
  }
  return null;
}

export function randomWalkable(ship, rnd = Math.random) {
  const { gw, gh, walk } = ship;
  for (let k = 0; k < 60; k++) {
    const i = Math.floor(rnd() * gw * gh);
    if (walk[i]) return { x: (i % gw) * GRID + 1.5, y: Math.floor(i / gw) * GRID + 1.5 };
  }
  return { ...ship.stations[0] };
}
