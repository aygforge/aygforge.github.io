// TOP-DOWN karakter ve hayvan sprite'ları. Her sprite "yukarı bakan" kanonik çizimden
// 3/4 (üst-karşı) bakış çizimleri — tof-art-src/art kaynaklarından kaynak koda taşındı.
import { disc, ellipse, hline, line, makeCanvas, px, rect, vline } from '../pixel.js';
import { CREW_BY_ID } from '../../data/crew.js';

var NPCL = {
    pirate: { skin: '#d9a273', hair: '#1a1410', hairStyle: 'short', hat: 'bandana', hatColor: '#b8282c', beard: 'short', beardColor: '#1a1410', top: '#3a2a3a', top2: '#e8e0c8', pants: '#2a2230' },
    pirateCaptain: { skin: '#c89060', hair: '#1a1410', hairStyle: 'curly', hat: 'tricorn', hatColor: '#141418', beard: 'full', beardColor: '#1a1410', top: '#6a1a22', top2: '#f0c040', pants: '#1a1a22' },
    captain: { skin: '#e8b88a', hair: '#3a2416', hairStyle: 'short', hat: 'tricorn', hatColor: '#24324d', beard: 'short', beardColor: '#3a2416', top: '#24426b', top2: '#f2c14e', pants: '#2a2a3a' },
    sailor: { skin: '#e8b88a', hair: '#5a3a1a', hairStyle: 'short', hat: 'cap', hatColor: '#24324d', beard: 'none', top: '#f0f0e8', top2: '#3b6ea5', pants: '#2c2c3c' },
    villager: { skin: '#a8703f', hair: '#1a1410', hairStyle: 'short', hat: 'straw', hatColor: '#d8b45a', beard: 'none', top: '#c8423b', top2: '#e8c45a', pants: '#5a3a1f' },
    ghost: { skin: '#b8ffe0', hair: '#7affc8', hairStyle: 'long', hat: 'tricorn', hatColor: '#3a8a6a', beard: 'long', beardColor: '#8affd0', top: '#4aa080', top2: '#c8ffe8', pants: '#2a6a5a' },
    // sahne figürleri
    soldier: { skin: '#e0b088', hair: '#3a2416', hairStyle: 'short', hat: 'cap', hatColor: '#8a1f22', beard: 'none', top: '#b8282c', top2: '#f0f0e8', pants: '#1e2440', idle: 'spear' },
    officer: { skin: '#e8b88a', hair: '#c8c0b0', hairStyle: 'short', hat: 'tricorn', hatColor: '#1e2a4a', beard: 'short', beardColor: '#c8c0b0', top: '#24426b', top2: '#f2c14e', pants: '#f0ece0', idle: 'scroll' },
    customs: { skin: '#c89060', hair: '#2a1a10', hairStyle: 'short', hat: 'fez', hatColor: '#a8282c', beard: 'short', beardColor: '#2a1a10', top: '#3a4a3a', top2: '#c8a040', pants: '#2a2a2a', idle: 'scroll' },
    merchant: { skin: '#d8a070', hair: '#5a3a1a', hairStyle: 'short', hat: 'turban', hatColor: '#3b6ea5', beard: 'full', beardColor: '#5a3a1a', top: '#c86a3a', top2: '#f2c14e', pants: '#4a3020', idle: 'count', build: 'round' },
    stranger: { skin: '#9a8a80', hair: '#1a1a20', hairStyle: 'short', hat: 'hood', hatColor: '#1e1e2a', beard: 'none', top: '#24242e', top2: '#3a3a4a', pants: '#1a1a22' },
    oldSailor: { skin: '#d8a880', hair: '#e8e8e0', hairStyle: 'short', hat: 'cap', hatColor: '#3a4a6a', beard: 'long', beardColor: '#f0f0e8', top: '#5a6a7a', top2: '#e8e0c8', pants: '#3a3a4a', idle: 'lantern' },
    villagerF: { skin: '#a8703f', hair: '#1a1410', hairStyle: 'long', hat: 'headwrap', hatColor: '#e8c45a', beard: 'none', top: '#2f8a6a', top2: '#f0e0a0', pants: '#5a3a1f' },
    chief: { skin: '#8a5a32', hair: '#1a1410', hairStyle: 'long', hat: 'feather', hatColor: '#c8423b', beard: 'none', top: '#e0a040', top2: '#2f8a6a', pants: '#5a3a1f', idle: 'staff', build: 'big' },
    sick: { skin: '#b8c890', hair: '#4a3a2a', hairStyle: 'short', hat: 'bandana', hatColor: '#8a8a7a', beard: 'short', beardColor: '#4a3a2a', top: '#8a9a7a', top2: '#c8c8b0', pants: '#4a4a3a' },
    keeper: { skin: '#e0b088', hair: '#8a8a8a', hairStyle: 'short', hat: 'cap', hatColor: '#2a3a5a', beard: 'full', beardColor: '#9a9a9a', top: '#2a3a5a', top2: '#f2c14e', pants: '#2a2a3a', idle: 'lantern' },
    servant: { skin: '#e8c8a0', hair: '#6a4a2a', hairStyle: 'bun', hat: 'none', beard: 'none', top: '#5a3a6a', top2: '#f0e8f0', pants: '#3a2a4a' },
    princess: { skin: '#f0d0b0', hair: '#c88a3a', hairStyle: 'long', hat: 'tiara', hatColor: '#f2c14e', beard: 'none', top: '#c8a0e8', top2: '#f0e8f0', pants: '#8b5bb5' },
    hunter: { skin: '#c89060', hair: '#2a1a10', hairStyle: 'short', hat: 'tricorn', hatColor: '#3a3a3a', beard: 'short', beardColor: '#2a1a10', top: '#4a4a52', top2: '#8a8a92', pants: '#2a2a30', idle: 'guard' },
    guild: { skin: '#e8c0a0', hair: '#3a2a1a', hairStyle: 'short', hat: 'beret', hatColor: '#1e3a2a', beard: 'none', top: '#2f5a3a', top2: '#f2c14e', pants: '#2a2a2a', idle: 'count' },
    cartographer: { skin: '#e8c0a0', hair: '#8a5a2a', hairStyle: 'curly', hat: 'beret', hatColor: '#6a3a2a', beard: 'none', top: '#e8dcc0', top2: '#6a3a2a', pants: '#4a3a2a', idle: 'map' },
    deserter: { skin: '#d8a880', hair: '#3a2416', hairStyle: 'short', hat: 'none', beard: 'short', beardColor: '#3a2416', top: '#8a3a3a', top2: '#c8c0b0', pants: '#2a2a3a' },
    castaway: { skin: '#c88a5a', hair: '#6a4a2a', hairStyle: 'long', hat: 'none', beard: 'long', beardColor: '#6a4a2a', top: '#c8b890', top2: '#a89870', pants: '#6a5a3a' },
    smuggler: { skin: '#c89060', hair: '#1a1410', hairStyle: 'short', hat: 'scarf', hatColor: '#2a2a32', beard: 'short', beardColor: '#1a1410', top: '#2a2a32', top2: '#5a4a3a', pants: '#1e1e24' },
    diver: { skin: '#c89060', hair: '#1a1410', hairStyle: 'short', hat: 'hood', hatColor: '#1e2a32', beard: 'none', top: '#1e2a32', top2: '#2a3a44', pants: '#1a242c' },
    redCaptain: { skin: '#c89060', hair: '#8a1a1a', hairStyle: 'long', hat: 'tricorn', hatColor: '#b8282c', beard: 'full', beardColor: '#8a1a1a', top: '#2a1a1a', top2: '#e0b040', pants: '#1a1a1a', idle: 'guard' },
    guard: { skin: '#e0b088', hair: '#3a2416', hairStyle: 'short', hat: 'cap', hatColor: '#c8a040', beard: 'none', top: '#5a4a20', top2: '#f2c14e', pants: '#2a2a2a', idle: 'spear' },
    // Paket 3: rakip kaptanlar ve Sönmeyen Armada'nın donmuş denizcileri
    liora: { skin: '#f0c8a0', hair: '#e8d090', hairStyle: 'long', hat: 'tricorn', hatColor: '#1f6a7a', beard: 'none', top: '#3fb8b0', top2: '#f4f0e0', pants: '#24424a', idle: 'map' },
    boran: { skin: '#c8885a', hair: '#2a1410', hairStyle: 'short', hat: 'tricorn', hatColor: '#3a1416', beard: 'full', beardColor: '#2a1410', top: '#8a1f2a', top2: '#c8a060', pants: '#2a1a1a', idle: 'guard', build: 'big' },
    neris: { skin: '#d8a880', hair: '#c87a3c', hairStyle: 'braid', hat: 'scarf', hatColor: '#c87a3c', beard: 'none', top: '#2c2c31', top2: '#c87a3c', pants: '#1e1e22', idle: 'lantern' },
    frozen: { skin: '#c8dce8', hair: '#e8f4ff', hairStyle: 'short', hat: 'cap', hatColor: '#6a8aa0', beard: 'short', beardColor: '#e8f4ff', top: '#7a9ab0', top2: '#d8f0ff', pants: '#4a6074' },
    plague: { skin: '#a8b880', hair: '#2a2a20', hairStyle: 'short', hat: 'hood', hatColor: '#3a3a2a', beard: 'none', top: '#4a4a3a', top2: '#6a6a4a', pants: '#2a2a20' },
};
  // ===== 3/4 (üst-karşı) bakış: karakterler =====
  export var CS = 22,
    dt = new Map(),
    SPW = 26,
    SPH = 34,
    SAX = 13,
    SAY = 30;
  function nt(t, e) {
    if (t[0] !== "#") return t;
    let a = parseInt(t.slice(1), 16),
      r = (a >> 16) & 255,
      n = (a >> 8) & 255,
      i = a & 255,
      s = (o) => Math.max(0, Math.min(255, Math.round(e < 0 ? o * (1 + e) : o + (255 - o) * e)));
    return `rgb(${s(r)},${s(n)},${s(i)})`;
  }
  // Koyu dış çizgi ekler (her boyutta tuval için)
  export function wc(t, col = "rgba(22,14,20,0.9)") {
    let W = t.width,
      Hh = t.height,
      e = makeCanvas(W, Hh),
      a = e.getContext("2d"),
      r = t.getContext("2d").getImageData(0, 0, W, Hh).data,
      n = (i, s) => (i < 0 || s < 0 || i >= W || s >= Hh ? 0 : r[(s * W + i) * 4 + 3]);
    a.fillStyle = col;
    for (let i = 0; i < Hh; i++)
      for (let s = 0; s < W; s++)
        n(s, i) > 40 || ((n(s - 1, i) > 120 || n(s + 1, i) > 120 || n(s, i - 1) > 120 || n(s, i + 1) > 120) && a.fillRect(s, i, 1, 1));
    return a.drawImage(t, 0, 0), e;
  }
  function flipX(t) {
    let e = makeCanvas(t.width, t.height),
      a = e.getContext("2d");
    return a.translate(t.width, 0), a.scale(-1, 1), a.drawImage(t, 0, 0), e;
  }
  // Sprite çizimi: (x,y) = karakterin ayak bastığı zemin noktası
  export function dS(t, img, x, y) {
    t.drawImage(img, Math.round(x - (img.ax || img.width / 2)), Math.round(y - (img.ay || img.height / 2)));
  }
  export function mkSpr(w, h, ax, ay, fn, dir) {
    let c = makeCanvas(w, h);
    fn(c.getContext("2d"));
    let o = wc(c);
    if (dir === "left") o = flipX(o);
    o.ax = dir === "left" ? w - ax : ax;
    o.ay = ay;
    return o;
  }
  export function crewSprite(t, e = "down", a = "idle", r = 0) {
    let n = `${t}|${e}|${a}|${r}`;
    if (dt.has(n)) return dt.get(n);
    let s = CREW_BY_ID[t],
      o = mkSpr(SPW, SPH, SAX, SAY, (i) => Ao(i, s.look, s.build || "normal", s.idle, a, r, e), e);
    return dt.set(n, o), o;
  }
  export function npcSprite(t, e = "down", a = "idle", r = 0) {
    let i = `npc|${t}|${e}|${a}|${r}`;
    if (dt.has(i)) return dt.get(i);
    let o = NPCL[t] || NPCL.sailor,
      l = mkSpr(SPW, SPH, SAX, SAY, (s) => Ao(s, o, o.build || "normal", o.idle || "none", a, r, e), e);
    return dt.set(i, l), l;
  }
  // İnsan figürü. Tuval 26x34, merkez sütun 12|13, ayak tabanı satır 29.
  function Ao(t, L, build, tool, state, fr, dir) {
    let wide = build === "big" || build === "round" ? 1 : 0,
      walk = state === "walk",
      sit = state === "sit",
      work = state === "work" || state === "special",
      react = state === "react",
      side = dir === "left" || dir === "right",
      back = dir === "up",
      sk = L.skin,
      skS = nt(sk, -0.2),
      top = L.top,
      topS = nt(top, -0.22),
      topL = nt(top, 0.14),
      acc = L.top2 || topL,
      pants = L.pants,
      pantsS = nt(pants, -0.25),
      shoe = "#2a1c14",
      by = (walk && fr % 2 ? -1 : 0) + (sit ? 4 : 0),
      cx = 13;
    // --- uzun saç (omuzların arkasında) ---
    let hs = L.hairStyle,
      hat = L.hat || "none",
      hooded = hat === "hood" || hat === "scarf",
      hair = L.hair,
      hairS = nt(hair, -0.25),
      hairL = nt(hair, 0.18);
    if (!hooded && !back && !side && (hs === "long" || hs === "braid")) {
      rect(t, cx - 6, 10 + by, 2, hs === "long" ? 8 : 4, hairS), rect(t, cx + 4, 10 + by, 2, hs === "long" ? 8 : 4, hairS);
    }
    // --- bacaklar ---
    if (sit) {
      if (side) {
        rect(t, cx - 2, 26, 7, 3, pants), rect(t, cx + 5, 25, 2, 4, shoe), rect(t, cx - 2, 28, 7, 1, pantsS);
      } else {
        rect(t, cx - 4 - wide, 26, 8 + wide * 2, 3, pants), rect(t, cx - 4 - wide, 28, 8 + wide * 2, 1, pantsS);
        if (!back) rect(t, cx - 5 - wide, 28, 3, 2, shoe), rect(t, cx + 2 + wide, 28, 3, 2, shoe);
      }
    } else if (side) {
      let ph = walk ? fr : 0;
      if (ph === 1 || ph === 3) {
        // adım: bacaklar açık
        let f = ph === 1 ? pants : pantsS,
          g = ph === 1 ? pantsS : pants;
        rect(t, cx - 3, 23, 3, 3, g), rect(t, cx - 4, 25, 3, 2, g), rect(t, cx - 5, 27, 3, 2, shoe);
        rect(t, cx, 23, 3, 3, f), rect(t, cx + 1, 25, 3, 2, f), rect(t, cx + 1, 27, 4, 2, shoe);
      } else {
        rect(t, cx - 2, 23, 2, 5, pantsS), rect(t, cx - 1, 23, 3, 5, pants), rect(t, cx - 2, 28, 5, 2, shoe);
        ph === 2 && rect(t, cx - 2, 27, 2, 1, shoe);
      }
    } else {
      let lf = walk ? [0, 1, 0, -1][fr] : 0;
      // sol bacak (ekranda solda), sağ bacak
      let lx = cx - 3 - wide,
        rx = cx + wide;
      rect(t, lx, 23, 3, lf > 0 ? 4 : 5, pants), rect(t, lx, lf > 0 ? 27 : 28, 3, 2, shoe);
      rect(t, rx, 23, 3, lf < 0 ? 4 : 5, pants), rect(t, rx, lf < 0 ? 27 : 28, 3, 2, shoe);
      vline(t, cx - 1 + (wide ? 0 : 0), 24, lf ? 26 : 27, pantsS);
      wide && vline(t, cx, 24, 27, pantsS);
    }
    // --- gövde ---
    let ty = 16 + by;
    if (side) {
      let x0 = cx - 3 - wide,
        w = 6 + wide * 2;
      rect(t, x0, ty, w, 7, top), vline(t, x0, ty + 1, ty + 6, topS), rect(t, x0, ty + 6, w, 1, topS);
      build === "round" && rect(t, x0 + w, ty + 2, 1, 4, top);
      L.top2 && vline(t, x0 + w - 1, ty, ty + 4, acc);
    } else {
      let x0 = cx - 3 - wide,
        w = 6 + wide * 2;
      rect(t, x0, ty, w, 7, top), vline(t, x0 + w - 1, ty + 1, ty + 6, topS), rect(t, x0, ty + 6, w, 1, topS);
      build === "round" && (vline(t, x0 - 1, ty + 2, ty + 5, top), vline(t, x0 + w, ty + 2, ty + 5, topS));
      if (back) vline(t, cx - 1, ty + 1, ty + 5, topS), L.top2 && rect(t, x0, ty, w, 1, acc);
      else if (L.top2) rect(t, cx - 1, ty, 2, 5, acc), px(t, cx - 1, ty + 5, nt(acc, -0.2));
      else vline(t, cx - 1, ty + 1, ty + 4, topL);
    }
    // --- kollar ---
    let handR = null;
    if (side) {
      if (work || react) {
        let up = react ? -3 : fr % 2 ? -1 : 0;
        rect(t, cx - 1, ty + 1, 2, 2, topS), rect(t, cx + 1, ty + 1 + Math.min(0, up + 1), 3, 2, topS), rect(t, cx + 4, ty + 1 + up, 1, 2, sk);
        handR = { x: cx + 5, y: ty + 1 + up, s: 1 };
      } else {
        let sw = walk ? [0, 2, 0, -2][fr] : 0;
        rect(t, cx - 1, ty + 1, 2, 3, topS), rect(t, cx - 1 + Math.sign(sw), ty + 4, 2, 2, topS), rect(t, cx - 1 + sw, ty + 6 - (sw ? 1 : 0), 2, 1, sk);
      }
    } else {
      let lx = cx - 5 - wide,
        rx = cx + 3 + wide;
      if (react) {
        rect(t, lx, ty - 2, 2, 4, topS), rect(t, lx, ty - 3, 2, 1, sk), rect(t, rx, ty - 2, 2, 4, topS), rect(t, rx, ty - 3, 2, 1, sk);
      } else if (work) {
        let up = fr % 2 ? -1 : 0,
          both = tool === "stretch" || tool === "spell" || tool === "sunglow" || tool === "twinblades";
        if (both) rect(t, lx, ty - 2 + up, 2, 4, topS), rect(t, lx, ty - 3 + up, 2, 1, sk);
        else rect(t, lx, ty + 1, 2, 4, topS), rect(t, lx, ty + 5, 2, 1, sk);
        rect(t, rx, ty + 1, 2, 2, topS), rect(t, rx + 1, ty - 1 + up, 2, 3, topS), rect(t, rx + 1, ty - 2 + up, 2, 1, sk);
        handR = { x: rx + 1, y: ty - 2 + up, s: 1 };
      } else {
        let sw = walk ? [0, 1, 0, -1][fr] : 0,
          sh = sit ? -1 : 0;
        rect(t, lx, ty + 1 + Math.max(0, -sw), 2, 4 + sh, topS), rect(t, lx, ty + 5 + sh + Math.max(0, -sw) - (sw < 0 ? 1 : 0), 2, 1, sk);
        rect(t, rx, ty + 1 + Math.max(0, sw), 2, 4 + sh, topS), rect(t, rx, ty + 5 + sh + Math.max(0, sw) - (sw > 0 ? 1 : 0), 2, 1, sk);
      }
    }
    // --- baş ---
    let hy = 7 + by; // başın üst satırı
    if (side) {
      rect(t, cx - 4, hy + 1, 9, 7, sk), rect(t, cx - 3, hy, 7, 1, sk), rect(t, cx - 3, hy + 8, 7, 1, sk);
      px(t, cx + 5, hy + 5, sk); // burun
      px(t, cx - 1, hy + 5, skS); // kulak
      rect(t, cx - 3, hy + 8, 3, 1, skS);
    } else {
      rect(t, cx - 5, hy + 1, 10, 7, sk), rect(t, cx - 4, hy, 8, 1, sk), rect(t, cx - 4, hy + 8, 8, 1, sk);
      if (!back) px(t, cx - 5, hy + 7, skS), px(t, cx + 4, hy + 7, skS);
    }
    // yüz
    if (!back) {
      let eye = "#2a1a1e";
      if (side) {
        rect(t, cx + 2, hy + 4, 1, 2, eye);
        L.glasses && (rect(t, cx + 1, hy + 4, 3, 2, "#8ad0f0"), px(t, cx + 2, hy + 5, eye), hline(t, cx - 2, cx, hy + 4, "#3a3a44"));
        L.eyepatch && (rect(t, cx + 1, hy + 4, 3, 2, "#111"), hline(t, cx - 4, cx + 3, hy + 3, "#111"));
        px(t, cx + 3, hy + 7, skS);
      } else {
        rect(t, cx - 3, hy + 4, 1, 2, eye), rect(t, cx + 2, hy + 4, 1, 2, eye);
        px(t, cx - 4, hy + 6, nt(sk, -0.08)), px(t, cx + 3, hy + 6, nt(sk, -0.08));
        L.glasses &&
          (rect(t, cx - 4, hy + 4, 3, 2, "#8ad0f0"), rect(t, cx + 1, hy + 4, 3, 2, "#8ad0f0"), px(t, cx - 3, hy + 5, eye), px(t, cx + 2, hy + 5, eye), hline(t, cx - 1, cx, hy + 4, "#3a3a44"));
        L.eyepatch && (rect(t, cx + 1, hy + 4, 3, 2, "#111"), hline(t, cx - 5, cx + 4, hy + 3, "#111"));
        hline(t, cx - 1, cx, hy + 7, skS);
      }
    }
    // --- sakal ---
    let bd = L.beard,
      bc = L.beardColor || hair,
      bcS = nt(bc, -0.2);
    if (bd && bd !== "none" && !back) {
      if (side) {
        if (bd === "mustache") hline(t, cx + 2, cx + 4, hy + 7, bc);
        else {
          rect(t, cx, hy + 7, 5, 2, bc), px(t, cx - 1, hy + 6, bc), px(t, cx + 3, hy + 6, bc);
          (bd === "full" || bd === "long" || bd === "braids") && (rect(t, cx, hy + 6, 2, 1, bc), rect(t, cx + 1, hy + 9, 4, 1, bc));
          bd === "long" && rect(t, cx + 2, hy + 10, 3, 3, bc);
          bd === "braids" && (vline(t, cx + 2, hy + 10, hy + 13, bc), vline(t, cx + 4, hy + 10, hy + 12, bcS));
        }
      } else if (bd === "mustache") hline(t, cx - 3, cx + 2, hy + 7, bc), px(t, cx - 4, hy + 8, bc), px(t, cx + 3, hy + 8, bc);
      else if (bd === "short") {
        hline(t, cx - 5, cx - 4, hy + 6, bc), hline(t, cx + 3, cx + 4, hy + 6, bc), hline(t, cx - 5, cx + 4, hy + 7, bc), hline(t, cx - 4, cx + 3, hy + 8, bc), hline(t, cx - 1, cx, hy + 7, skS);
      } else {
        vline(t, cx - 5, hy + 5, hy + 7, bc), vline(t, cx + 4, hy + 5, hy + 7, bc);
        hline(t, cx - 5, cx + 4, hy + 7, bc), hline(t, cx - 4, cx + 3, hy + 8, bc), hline(t, cx - 3, cx + 2, hy + 9, bc), hline(t, cx - 1, cx, hy + 7, bcS);
        hline(t, cx - 4, cx + 3, hy + 6, bc), hline(t, cx - 1, cx, hy + 6, sk);
        bd === "long" && (rect(t, cx - 2, hy + 10, 4, 3, bc), hline(t, cx - 1, cx, hy + 13, bcS));
        bd === "braids" && (vline(t, cx - 3, hy + 10, hy + 13, bc), vline(t, cx + 2, hy + 10, hy + 13, bc), px(t, cx - 3, hy + 14, "#e8c45a"), px(t, cx + 2, hy + 14, "#e8c45a"));
      }
    }
    // --- saç ---
    let bald = hs === "bald";
    if (!hooded) {
      if (back) {
        if (bald) px(t, cx - 2, hy + 2, nt(sk, 0.25)), hline(t, cx - 2, cx + 1, hy + 7, skS);
        else {
          rect(t, cx - 5, hy + 1, 10, 6, hair), rect(t, cx - 4, hy, 8, 1, hair), hline(t, cx - 4, cx + 3, hy + 7, hair), hline(t, cx - 3, cx - 2, hy + 2, hairL);
          vline(t, cx + 4, hy + 2, hy + 6, hairS);
          if (hs === "long") rect(t, cx - 5, hy + 7, 10, 5, hair), hline(t, cx - 4, cx + 3, hy + 12, hair), vline(t, cx - 1, hy + 8, hy + 11, hairS);
          if (hs === "ponytail") rect(t, cx - 1, hy + 6, 2, 7, hair), px(t, cx - 1, hy + 6, "#c8423b"), px(t, cx, hy + 6, "#c8423b");
          if (hs === "braid") for (let i = 0; i < 9; i++) px(t, cx - 1 + (i % 2), hy + 6 + i, i % 3 ? hair : hairL), px(t, cx - (i % 2), hy + 6 + i, hairS);
          if (hs === "bun") disc(t, cx, hy + 5, 2, hairS), px(t, cx - 1, hy + 4, hairL);
          if (hs === "mohawk") rect(t, cx - 5, hy + 1, 10, 7, skS), rect(t, cx - 1, hy - 3, 2, 10, hairL);
        }
      } else if (side) {
        if (bald) px(t, cx, hy + 1, nt(sk, 0.25));
        else if (hs === "mohawk") rect(t, cx - 4, hy + 1, 5, 4, nt(sk, -0.1)), rect(t, cx - 3, hy - 3, 7, 3, hairL), rect(t, cx - 2, hy, 6, 1, hair);
        else {
          rect(t, cx - 3, hy, 7, 1, hair), rect(t, cx - 4, hy + 1, 9, 2, hair), rect(t, cx - 4, hy + 3, 4, 4, hair), px(t, cx, hy + 3, hair), hline(t, cx - 2, cx + 1, hy + 1, hairL);
          rect(t, cx - 4, hy + 7, 2, 1, hairS);
          if (hs === "long") rect(t, cx - 5, hy + 4, 4, 8, hair), vline(t, cx - 5, hy + 6, hy + 11, hairS);
          if (hs === "ponytail") rect(t, cx - 6, hy + 4, 2, 6, hair), px(t, cx - 5, hy + 4, "#c8423b");
          if (hs === "braid") for (let i = 0; i < 9; i++) px(t, cx - 5 - (i % 2), hy + 4 + i, i % 3 ? hair : hairL);
          if (hs === "bun") disc(t, cx - 5, hy + 3, 2, hairS);
          if (hs === "topknot") rect(t, cx - 1, hy - 2, 3, 2, hairL);
          if (hs === "curly") px(t, cx - 5, hy + 2, hair), px(t, cx - 5, hy + 5, hair), px(t, cx - 2, hy - 1, hair), px(t, cx + 2, hy - 1, hair), px(t, cx + 5, hy + 2, hair), px(t, cx - 3, hy + 2, hairL);
        }
      } else {
        // önden
        if (bald) hline(t, cx - 2, cx - 1, hy + 1, nt(sk, 0.25));
        else if (hs === "mohawk") rect(t, cx - 5, hy + 1, 10, 2, nt(sk, -0.1)), rect(t, cx - 1, hy - 3, 2, 6, hairL), vline(t, cx, hy - 3, hy + 2, hair);
        else {
          rect(t, cx - 4, hy, 8, 1, hair), rect(t, cx - 5, hy + 1, 10, 2, hair), px(t, cx - 5, hy + 3, hair), px(t, cx + 4, hy + 3, hair), hline(t, cx - 3, cx - 1, hy + 1, hairL);
          px(t, cx - 4, hy + 3, hair), px(t, cx + 3, hy + 3, hair);
          if (hs === "long") vline(t, cx - 5, hy + 3, hy + 8, hair), vline(t, cx + 4, hy + 3, hy + 8, hair);
          if (hs === "braid") {
            vline(t, cx - 5, hy + 3, hy + 6, hair);
            for (let i = 0; i < 9; i++) px(t, cx + 4 + (i % 2), hy + 3 + i, i % 3 ? hair : hairL);
          }
          if (hs === "ponytail") rect(t, cx + 5, hy + 2, 1, 5, hair), px(t, cx + 6, hy + 4, hair);
          if (hs === "bun") rect(t, cx - 1, hy - 2, 3, 2, hair), px(t, cx - 1, hy - 2, hairL);
          if (hs === "topknot") rect(t, cx - 1, hy - 2, 2, 2, hairL);
          if (hs === "curly")
            hline(t, cx - 3, cx + 2, hy - 1, hair), px(t, cx - 6, hy + 2, hair), px(t, cx + 5, hy + 2, hair), px(t, cx - 6, hy + 4, hair), px(t, cx + 5, hy + 4, hair), px(t, cx + 1, hy + 2, hairL), px(t, cx - 4, hy, hairL);
        }
      }
    }
    _c(t, L, cx, hy, dir, back, side);
    // --- alet / tepki ---
    if (work) Ec(t, tool, fr, handR, cx, hy, ty, dir, L);
    if (react) rect(t, side ? cx + 8 : cx + 9, hy - 6, 2, 4, "#ffe040"), rect(t, side ? cx + 8 : cx + 9, hy - 1, 2, 2, "#ffe040");
  }
  // Şapkalar / başlıklar
  function _c(t, e, cx, hy, dir, back, side) {
    let n = e.hatColor || "#444",
      s = nt(n, -0.3),
      l = nt(n, 0.18),
      hat = e.hat || "none",
      L = cx - 5,
      R = cx + 4; // baş sol/sağ sütunu
    if (side) (L = cx - 4), (R = cx + 4);
    switch (hat) {
      case "turban":
        rect(t, L, hy - 2, R - L + 1, 4, n), rect(t, L + 1, hy - 3, R - L - 1, 1, n), rect(t, L - 1, hy - 1, 1, 2, n), rect(t, R + 1, hy - 1, 1, 2, n);
        line(t, L, hy, R - 2, hy - 2, s), line(t, L + 3, hy + 1, R, hy - 1, s), hline(t, L + 1, L + 3, hy - 2, l);
        e.hatGem && !back && rect(t, side ? R - 1 : cx - 1, hy - 1, 2, 2, "#2fa04a");
        back && px(t, cx, hy + 2, s);
        break;
      case "tricorn":
        if (side) {
          hline(t, L - 3, R + 3, hy + 1, n), hline(t, L - 2, R + 2, hy, n), rect(t, L + 1, hy - 3, R - L - 1, 3, n), px(t, L - 3, hy, n), px(t, R + 3, hy, n), hline(t, L + 1, R - 1, hy - 1, s);
          hline(t, L - 2, R + 2, hy + 1, s);
        } else {
          hline(t, L - 2, R + 2, hy + 1, n), hline(t, L - 1, R + 1, hy, n), rect(t, L + 2, hy - 3, R - L - 3, 3, n), hline(t, L + 3, R - 3, hy - 4, n);
          px(t, L - 2, hy, n), px(t, R + 2, hy, n), px(t, L - 3, hy - 1, n), px(t, R + 3, hy - 1, n), hline(t, L - 1, R + 1, hy + 1, s);
          back || rect(t, cx - 1, hy - 2, 2, 2, "#e8e0c0");
        }
        break;
      case "bandana":
        rect(t, L, hy + 1, R - L + 1, 2, n), hline(t, L + 1, R - 1, hy, n), hline(t, L, R, hy + 2, s), hline(t, L + 1, L + 2, hy, l);
        if (back) rect(t, cx - 1, hy + 3, 2, 2, n), px(t, cx - 2, hy + 5, n), px(t, cx + 1, hy + 6, n);
        else if (side) rect(t, L - 1, hy + 2, 2, 2, n), px(t, L - 2, hy + 4, n), px(t, L - 1, hy + 5, n);
        else rect(t, R + 1, hy + 2, 1, 2, n), px(t, R + 2, hy + 4, n), px(t, R + 1, hy + 5, n);
        break;
      case "cap":
        rect(t, L, hy, R - L + 1, 3, n), hline(t, L + 1, R - 1, hy - 1, n), hline(t, L + 1, L + 3, hy, l);
        if (side) hline(t, cx + 1, R + 3, hy + 2, s);
        else if (!back) hline(t, L + 1, R - 1, hy + 2, s), hline(t, L + 2, R - 2, hy + 3, s);
        else hline(t, L, R, hy + 2, s);
        break;
      case "horned":
        rect(t, L, hy, R - L + 1, 3, n), hline(t, L + 1, R - 1, hy - 1, n), hline(t, L, R, hy + 2, s), vline(t, cx, hy - 1, hy + 2, l);
        for (let d of [-1, 1]) {
          let hx = d < 0 ? L - 1 : R + 1;
          px(t, hx, hy + 1, "#f0ead8"), px(t, hx + d, hy, "#f0ead8"), px(t, hx + d, hy - 1, "#f0ead8"), px(t, hx + d, hy - 2, "#d8ceb0");
        }
        break;
      case "straw":
        hline(t, L - 3, R + 3, hy + 2, n), hline(t, L - 2, R + 2, hy + 1, n), rect(t, L + 1, hy - 2, R - L - 1, 3, n), hline(t, L + 2, R - 2, hy - 3, n);
        hline(t, L + 1, R - 1, hy, s), hline(t, L - 3, R + 3, hy + 2, nt(n, -0.15)), hline(t, L + 2, L + 4, hy - 2, l);
        break;
      case "hood":
      case "scarf": {
        rect(t, L - 1, hy, R - L + 3, 3, n), hline(t, L, R, hy - 1, n);
        if (back) rect(t, L - 1, hy + 3, R - L + 3, 8, n), vline(t, cx, hy + 1, hy + 10, s), hline(t, L, R, hy + 11, s);
        else if (side) rect(t, L - 1, hy + 3, 5, 8, n), vline(t, L + 3, hy + 3, hy + 9, s), rect(t, L, hy + 9, 6, 2, n);
        else {
          vline(t, L - 1, hy + 3, hy + 9, n), vline(t, R + 1, hy + 3, hy + 9, n), vline(t, L, hy + 3, hy + 8, s), vline(t, R, hy + 3, hy + 8, s), hline(t, L, R, hy + 2, s);
          rect(t, L, hy + 9, R - L + 1, 2, n);
        }
        if (hat === "scarf" && !back) side ? rect(t, cx, hy + 6, 5, 3, s) : rect(t, L + 1, hy + 6, R - L - 1, 3, s);
        hline(t, L + 1, L + 3, hy, l);
        break;
      }
      case "crown":
        hline(t, L + 1, R - 1, hy, n), hline(t, L + 1, R - 1, hy - 1, n);
        for (let x = L + 1; x <= R - 1; x += 2) px(t, x, hy - 2, n);
        px(t, R - 1, hy - 2, n), back || rect(t, cx - 1, hy - 1, 2, 2, "#c8423b"), hline(t, L + 1, R - 1, hy, nt(n, -0.2));
        break;
      case "tiara":
        back || (hline(t, L + 2, R - 2, hy + 1, n), rect(t, side ? R - 2 : cx - 1, hy, 2, 1, "#8ad0ff"), px(t, side ? R - 2 : cx, hy - 1, n));
        break;
      case "feather": {
        hline(t, L, R, hy + 2, n), hline(t, L, R, hy + 1, s);
        let fx = back ? L + 2 : R - 2;
        for (let d = 0; d < 6; d++) px(t, fx + (d > 3 ? 1 : 0), hy - d, d % 2 ? "#f4f0e0" : "#d8d0c0");
        px(t, fx + 1, hy - 5, n), px(t, fx + 1, hy - 6, n), px(t, fx, hy - 6, "#f4f0e0");
        break;
      }
      case "headwrap":
        rect(t, L, hy, R - L + 1, 3, n), hline(t, L + 1, R - 1, hy - 1, n), hline(t, L, R, hy + 2, s), hline(t, L + 1, L + 3, hy, l);
        rect(t, back ? cx - 1 : R - 2, hy - 2, 2, 1, n), px(t, back ? cx : R - 1, hy - 3, s);
        break;
      case "fez":
        rect(t, cx - 3, hy - 3, 6, 4, n), hline(t, cx - 3, cx + 2, hy - 3, l), vline(t, cx + 2, hy - 2, hy, s);
        vline(t, back ? cx - 4 : cx + 3, hy - 3, hy, "#1a1a1a"), px(t, cx, hy - 4, "#1a1a1a");
        break;
      case "chef":
        rect(t, L, hy - 5, R - L + 1, 4, n), hline(t, L + 1, R - 1, hy - 6, n), rect(t, L + 1, hy - 1, R - L - 1, 3, n), hline(t, L + 1, R - 1, hy + 1, "#d8d8d8");
        px(t, L + 2, hy - 2, "#d8d8d8"), px(t, cx, hy - 2, "#d8d8d8"), px(t, R - 2, hy - 2, "#d8d8d8"), vline(t, R, hy - 4, hy - 2, "#e0e0e0");
        break;
      case "beret":
        rect(t, L, hy, R - L + 2, 2, n), hline(t, L + 1, R + 1, hy - 1, n), hline(t, L + 3, R, hy - 2, n), px(t, cx, hy - 3, s), hline(t, L, R, hy + 2, s), hline(t, L + 2, L + 4, hy - 1, l);
        break;
      case "sunhalo":
        for (let d = 0; d < 9; d++) {
          let a = Math.PI + (d / 8) * Math.PI;
          px(t, cx - 0.5 + Math.cos(a) * 8, hy + 4 + Math.sin(a) * 8, d % 2 ? n : "#fff0a0");
        }
        break;
      default:
        break;
    }
  }
  // Çalışma aletleri (h = el konumu)
  function Ec(t, e, a, h, cx, hy, ty, dir, L) {
    if (!h) return;
    let s = "#6a4424",
      o = "#c0c6cf",
      r = h.x,
      n = h.y,
      f = a % 2;
    switch (e) {
      case "hammer":
        f ? (rect(t, r, n - 3, 1, 3, s), rect(t, r - 1, n - 5, 4, 2, o)) : (rect(t, r, n - 1, 3, 1, s), rect(t, r + 3, n - 2, 2, 4, o), px(t, r + 5, n + 2, "#fff0a0"));
        break;
      case "stir":
        rect(t, r, n, 1, 6, s), rect(t, r - 2, n + 6, 5, 3, "#5d6470"), hline(t, r - 2, r + 2, n + 6, "#9aa1a8"), px(t, r - 1 + (a % 3), n - 2 - f, "rgba(240,240,240,0.8)");
        break;
      case "map":
        rect(t, r - 3, n - 3, 7, 5, "#e8d8a8"), hline(t, r - 3, r + 3, n + 1, "#b8a070"), px(t, r - 1 + f, n - 1, "#c8423b"), px(t, r + 1, n - 2, "#8a6a3a");
        break;
      case "spyglass":
        if (dir === "left" || dir === "right") rect(t, cx + 4, hy + 4, 5 + f, 2, "#c8a040"), px(t, cx + 9 + f, hy + 4, "#8ad0f0");
        else if (dir === "up") rect(t, r, n - 4, 2, 4 + f, "#c8a040");
        else rect(t, cx + 1, hy + 3, 3, 3, "#c8a040"), px(t, cx + 2, hy + 4, "#8ad0f0");
        break;
      case "bag":
        rect(t, r - 2, n + 1, 5, 4, "#2a2a2a"), rect(t, r - 1, n, 3, 1, "#4a4a4a"), px(t, r, n + 2, "#c8423b"), px(t, r - 1 + f * 2, n + 3, "#c8423b");
        break;
      case "sharpen":
        line(t, r, n, r + 3, n - 5, o), line(t, r + 1, n, r + 4, n - 5, "#e8ecf0"), px(t, r, n + 1, s), f && px(t, r + 5, n - 6, "#fff0a0");
        break;
      case "spell":
        px(t, r - 2 + a, n - 3, "#c8a0ff"), px(t, r + 2 - a, n - 2, "#8b5bb5"), px(t, r, n - 5 + f, "#e8d0ff"), px(t, cx - 6 + a, ty - 5 - f, "#c8a0ff"), px(t, cx - 8, ty - 3 + f, "#e8d0ff");
        break;
      case "beads":
        for (let i = 0; i < 4; i++) px(t, r + ((i + a) % 2), n + 1 + i, i === a % 4 ? "#f2c14e" : "#c8423b");
        break;
      case "lantern":
        vline(t, r, n + 1, n + 2, "#2a2a2a"), rect(t, r - 1, n + 3, 3, 4, "#3a2a1a"), rect(t, r, n + 4, 1, 2, f ? "#fff0a0" : "#f2c14e"), disc(t, r, n + 5, 3, "rgba(255,230,140,0.18)");
        break;
      case "fish":
        line(t, r, n, r + 6, n - 9, s), vline(t, r + 6, n - 9, n + 4 + f, "rgba(235,235,235,0.85)"), px(t, r + 6, n + 5 + f, "#c8423b");
        break;
      case "bow":
        vline(t, r + 2, n - 5, n + 5, s), px(t, r + 1, n - 6, s), px(t, r + 1, n + 6, s), vline(t, r, n - 5, n + 5, "rgba(232,224,200,0.7)"), hline(t, r - 2 - f, r + 3, n, "#e8e0c8");
        break;
      case "guard":
        vline(t, r, n - 8 + f, n - 1, o), vline(t, r + 1, n - 7 + f, n - 1, "#e8ecf0"), hline(t, r - 1, r + 2, n, "#c8a040"), px(t, r, n + 1, "#2a2a2a");
        break;
      case "spear":
        vline(t, r, n - 12, 28, s), rect(t, r, n - 15, 1, 3, o), px(t, r - 1, n - 13, o), px(t, r + 1, n - 13, o);
        break;
      case "twinblades":
        line(t, r - 1, n, r + 3, n - 5 + f, o), line(t, cx - 6, n + f, cx - 9, n - 5, o), px(t, r, n + 1, s);
        break;
      case "polish":
        rect(t, r - 1, n, 3, 2, "#e8e0c8"), px(t, r + f, n + 2, "#2a2a2e"), f && px(t, r + 3, n - 1, "#ffffff");
        break;
      case "count":
        rect(t, r - 2, n - 1, 6, 5, s), rect(t, r - 1, n, 4, 3, "#e8d8a8"), px(t, r - 1 + (a % 3), n, "#e07b39"), px(t, r + 1 - (a % 2), n + 2, "#c8423b");
        break;
      case "inspect":
        rect(t, r - 1, n - 4 + f, 3, 3, "rgba(160,220,255,0.85)"), px(t, r, n - 3 + f, "#ffffff"), vline(t, r, n - 1 + f, n, s);
        break;
      case "staff":
        vline(t, r, n - 10, 28, s), rect(t, r - 1, n - 13, 3, 3, f ? "#fff0a0" : "#e8b83a"), f && disc(t, r, n - 12, 3, "rgba(255,240,160,0.25)");
        break;
      case "scroll":
        rect(t, r - 2, n - 2, 5, 5, "#f0e6c8"), hline(t, r - 2, r + 2, n - 2, "#c8b890"), hline(t, r - 1, r + 1, n + f, "#8a7a5a");
        break;
      case "swagger":
        rect(t, r, n - 4 - f, 2, 4, "#3a7a3a"), px(t, r, n - 5 - f, "#c8a060");
        break;
      case "fan":
        hline(t, r - 2, r + 2, n - 2 - f, "#e8c45a"), hline(t, r - 1, r + 1, n - 1 - f, "#b8323e"), px(t, r, n - f, "#e8c45a"), px(t, r - 3, n - 1 - f, "#b8323e"), px(t, r + 3, n - 1 - f, "#b8323e");
        break;
      case "sunglow":
        f && (px(t, cx - 7, hy - 1, "#ffe080"), px(t, cx + 7, hy - 1, "#ffe080"), px(t, cx, hy - 5, "#ffe080"), px(t, cx - 5, hy - 4, "#fff6c0"), px(t, cx + 5, hy - 4, "#fff6c0"));
        break;
      case "pray":
        f && (px(t, r, n - 3, "#fff6c0"), px(t, r - 1, n - 5, "#fff6c0"));
        break;
      case "sniff":
        px(t, r + 1, n - 2 - f, "#e07b39"), px(t, r - 1, n - 3, "#e8c45a");
        break;
      case "whisper":
        rect(t, r - 1, n - 1, 4, 3, "#f0e6c8"), px(t, r + 2 - f, n - 2, "#3a3a44");
        break;
      case "wetfinger":
      case "windsense":
        px(t, r, n - 1 - f, L.skin), f && (px(t, r + 3, n - 3, "#bfe3ef"), px(t, r + 5, n - 4, "#bfe3ef"));
        break;
      default:
        break;
    }
  }

  // ===== 3/4 bakış: hayvanlar =====
  // Tuval 26x26, zemin satırı 21 (ayak tabanı), merkez sütun 13. "side" = sağa bakar (sol için aynalanır).
  var PETW = 26,
    PETH = 26,
    PETAX = 13,
    PETAY = 22;
  export function petSprite(t, e = "down", a = "idle") {
    let r = `${t}|${e}|${a}`;
    if (dt.has(r)) return dt.get(r);
    let v = e === "left" || e === "right" ? "side" : e === "up" ? "back" : "front",
      fn =
        t === "PET_ZIPIR"
          ? vc
          : t === "PET_TARCIN"
            ? Rc
            : t === "PET_KIRMIZI"
              ? (i, p, w) => To(i, p, w, "#d43a2a", "#f2c14e", "#3b6ea5", "#f4f0e0")
              : t === "PET_GECEYARISI"
                ? (i, p, w) => To(i, p, w, "#33264e", "#8a5ac0", "#5a3a8a", "#c8b8e8")
                : t === "PET_CUCE"
                  ? Ac
                  : t === "PET_MARTI"
                    ? Sc
                    : t === "PET_KAPLUMBAGA"
                      ? Cc
                      : t === "PET_GELINCIK"
                        ? Ic
                        : zc,
      s = mkSpr(PETW, PETH, PETAX, PETAY, (i) => fn(i, a, v), e);
    return dt.set(r, s), s;
  }
  var petFr = (e) => (/\d$/.test(e) ? Number(e.slice(-1)) : 0);
  // --- Zıpır (gri tekir kedi) ---
  function vc(t, e, v) {
    let A = "#a4a4ae",
      D = "#6c6c78",
      Lt = "#dcdce2",
      E = "#26262e",
      P = "#e8a0a8",
      l = petFr(e),
      walk = e.startsWith("walk"),
      sit = ["sit", "wag0", "wag1", "bark", "beg", "hold", "alert", "perch"].includes(e);
    if (e === "sleep") {
      ellipse(t, 12, 18, 6, 3, A), hline(t, 8, 15, 21, D), hline(t, 7, 9, 16, D), px(t, 6, 18, D), px(t, 6, 19, D), px(t, 7, 20, D);
      rect(t, 14, 15, 5, 4, A), px(t, 14, 14, D), px(t, 18, 14, D), hline(t, 15, 16, 17, E), px(t, 18, 18, P), hline(t, 10, 12, 16, D), px(t, 11, 18, Lt);
      return;
    }
    if (v === "side") {
      if (sit) {
        rect(t, 7, 15, 8, 6, A), rect(t, 10, 11, 5, 5, A), vline(t, 14, 13, 19, Lt), rect(t, 13, 20, 3, 2, Lt), hline(t, 8, 9, 16, D), hline(t, 8, 10, 18, D);
        let tw = e === "wag1" ? -1 : 0;
        hline(t, 3, 7, 21, D), px(t, 3, 20 + tw, D), px(t, 2, 19 + tw, A);
        rect(t, 11, 6, 6, 5, A), rect(t, 12, 5, 4, 1, A), px(t, 11, 5, D), px(t, 11, 4, D), px(t, 15, 5, D), px(t, 15, 4, D);
        px(t, 15, 8, E), px(t, 17, 9, P), px(t, 16, 10, Lt), px(t, 17, 10, Lt);
        e === "bark" && (px(t, 17, 11, "#c8424a"), px(t, 19, 6, "#fff"), px(t, 20, 5, "#fff"));
        e === "alert" && (px(t, 9, 14, D), px(t, 8, 14, D), px(t, 2, 18, D));
        (e === "beg" || e === "hold") && (rect(t, 15, 13, 2, 2, Lt), e === "hold" && rect(t, 16, 12, 2, 2, "#f2c14e"));
        return;
      }
      let d = walk ? [0, 1, 0, -1][l] : 0;
      rect(t, 6, 14, 10, 5, A), hline(t, 8, 13, 18, Lt), px(t, 8, 14, D), px(t, 10, 14, D), px(t, 12, 14, D), px(t, 9, 15, D), px(t, 11, 15, D);
      rect(t, 14, 10, 6, 5, A), px(t, 15, 9, D), px(t, 15, 8, D), px(t, 18, 9, D), px(t, 18, 8, D), px(t, 17, 12, E), px(t, 20, 12, P), hline(t, 18, 19, 13, Lt);
      px(t, 5, 13, D), px(t, 4, 12, A), px(t, 4, 11, D), px(t, 4, 10, A), px(t, 5, 9, D);
      rect(t, 7 + d, 19, 2, 2, D), px(t, 7 + d, 21, Lt), rect(t, 9 - d, 19, 2, 2, A), px(t, 10 - d, 21, Lt);
      rect(t, 13 + d, 19, 2, 2, D), px(t, 14 + d, 21, Lt), rect(t, 15 - d, 19, 2, 2, A), px(t, 16 - d, 21, Lt);
      return;
    }
    let back = v === "back",
      up = sit ? 0 : -1,
      d = walk ? [0, 1, 0, -1][l] : 0;
    // gövde
    if (sit) {
      rect(t, 10, 13, 6, 8, A), rect(t, 9, 17, 8, 4, A);
      back ? (hline(t, 11, 14, 15, D), hline(t, 11, 14, 17, D), hline(t, 12, 13, 19, D)) : (rect(t, 12, 14, 2, 6, Lt), rect(t, 10, 21, 2, 1, Lt), rect(t, 14, 21, 2, 1, Lt));
    } else {
      rect(t, 10, 13, 6, 6, A);
      back ? (hline(t, 11, 14, 14, D), hline(t, 11, 14, 16, D)) : rect(t, 12, 14, 2, 4, Lt);
      rect(t, 10, 19, 2, d > 0 ? 1 : 2, D), rect(t, 14, 19, 2, d < 0 ? 1 : 2, D), px(t, 10, d > 0 ? 20 : 21, Lt), px(t, 11, d > 0 ? 20 : 21, Lt), px(t, 14, d < 0 ? 20 : 21, Lt), px(t, 15, d < 0 ? 20 : 21, Lt);
    }
    // kuyruk
    if (back) {
      if (sit) vline(t, 13, 19, 21, D), px(t, 14, 21, D), px(t, 15, 20, D), px(t, 16, 20, A);
      else vline(t, 12, 9, 14, D), px(t, 13, 8, D), px(t, 13, 7, A);
    } else {
      let tw = e === "wag1" ? 1 : 0;
      sit ? (vline(t, 17, 18, 21, D), px(t, 18, 18 - tw, D), px(t, 18, 17 - tw, A)) : (px(t, 16, 14, D), px(t, 17, 13, D), px(t, 18, 12, A), px(t, 18, 11, D));
    }
    // baş
    let hy = 7 + up;
    rect(t, 9, hy + 1, 8, 4, A), rect(t, 10, hy, 6, 1, A), rect(t, 10, hy + 5, 6, 1, A);
    rect(t, 9, hy - 2, 2, 2, D), rect(t, 15, hy - 2, 2, 2, D);
    px(t, 9, hy - 3, D), px(t, 16, hy - 3, D), px(t, 10, hy - 1, P), px(t, 15, hy - 1, P);
    if (back) hline(t, 11, 14, hy + 1, D), hline(t, 12, 13, hy + 3, D);
    else {
      px(t, 11, hy + 2, E), px(t, 14, hy + 2, E), hline(t, 11, 14, hy + 4, Lt), hline(t, 12, 13, hy + 3, P), px(t, 8, hy + 3, Lt), px(t, 17, hy + 3, Lt), hline(t, 12, 13, hy, D);
      e === "bark" && (hline(t, 12, 13, hy + 5, "#c8424a"), px(t, 18, hy - 1, "#fff"), px(t, 19, hy - 2, "#fff"));
      (e === "beg" || e === "hold") && (rect(t, 10, 14, 2, 2, Lt), rect(t, 14, 14, 2, 2, Lt), e === "hold" && rect(t, 12, 14, 2, 2, "#f2c14e"));
      e === "alert" && (px(t, 11, hy + 1, "#fff"), px(t, 14, hy + 1, "#fff"));
    }
  }
  // --- Tarçın (siyah-beyaz köpek, mavi tasma) ---
  var xa = {
    B: "#1c1b22",
    G: "#34323d",
    H: "#4a4856",
    W: "#f4f2ec",
    w: "#cfccc4",
    blue: "#2f8ae8",
    blueD: "#1f5fae",
    tag: "#c8ccd4",
    nose: "#08080a",
    eye: "#9a5a2c",
    ear: "#9a6a6a",
    tongue: "#ee8a9a",
  };
  function Rc(t, e, v) {
    let a = xa,
      l = petFr(e),
      run = e.startsWith("run"),
      walk = e.startsWith("walk"),
      sniff = e.startsWith("sniff"),
      play = e.startsWith("play"),
      sitp = ["sit", "wag0", "wag1", "bark", "beg", "perch", "hold"].includes(e),
      ears = run ? "back" : e === "alert" || e === "bark" ? "up" : sniff ? "flop" : "semi",
      mouth = run || play || e === "wag1" || e === "bark" || e === "beg";
    if (e === "sleep") {
      // kıvrılmış uyuyor
      ellipse(t, 11, 18, 7, 3, a.B), hline(t, 6, 15, 16, a.G), rect(t, 14, 15, 6, 5, a.B), rect(t, 18, 18, 4, 2, a.W), px(t, 21, 18, a.nose), hline(t, 16, 17, 17, a.H), rect(t, 14, 14, 2, 2, a.B);
      hline(t, 3, 6, 21, a.B), px(t, 3, 20, a.W), hline(t, 13, 15, 20, a.blue), rect(t, 10, 20, 3, 1, a.W), px(t, 19, 15, a.W);
      return;
    }
    if (v === "side") return dogSide(t, e, l, { run, walk, sniff, play, sitp, ears, mouth });
    return dogFB(t, e, l, v === "back", { run, walk, sniff, play, sitp, ears, mouth });
  }
  function dogHeadSide(t, hx, hy, ears, mouth, o = {}) {
    let a = xa;
    rect(t, hx, hy + 1, 6, 5, a.B), rect(t, hx + 1, hy, 4, 1, a.B), rect(t, hx + 4, hy + 3, 4, 3, a.W), px(t, hx + 7, hy + 3, a.nose), px(t, hx + 4, hy + 1, a.W), px(t, hx + 4, hy + 2, a.W);
    px(t, hx + 3, hy + 2, a.eye), px(t, hx + 1, hy + 5, a.G);
    ears === "up"
      ? (rect(t, hx + 1, hy - 3, 2, 3, a.B), px(t, hx + 2, hy - 2, a.ear))
      : ears === "back"
        ? (rect(t, hx - 2, hy + 1, 3, 2, a.B), px(t, hx - 3, hy + 2, a.G))
        : ears === "flop"
          ? (rect(t, hx, hy + 1, 2, 4, a.G), px(t, hx, hy + 5, a.B))
          : (rect(t, hx + 1, hy - 2, 2, 2, a.B), px(t, hx, hy - 1, a.B), px(t, hx, hy, a.G));
    mouth && (hline(t, hx + 5, hx + 6, hy + 6, a.tongue), px(t, hx + 4, hy + 6, a.nose));
  }
  function dogSide(t, e, l, f) {
    let a = xa;
    if (f.sitp) {
      // oturuyor
      rect(t, 6, 14, 8, 7, a.B), rect(t, 11, 10, 5, 10, a.B), rect(t, 14, 12, 2, 7, a.W), px(t, 13, 13, a.w), hline(t, 7, 10, 15, a.G);
      rect(t, 10, 21, 5, 1, a.W), e === "beg" ? (rect(t, 15, 12, 3, 2, a.W), px(t, 17, 11, a.W)) : (rect(t, 14, 19, 2, 3, a.W), px(t, 15, 21, a.w));
      let wg = e === "wag0" ? 0 : e === "wag1" || e === "bark" ? 1 : 0;
      wg ? (hline(t, 3, 5, 20, a.B), px(t, 2, 19, a.B), px(t, 2, 18, a.W)) : (hline(t, 2, 5, 21, a.B), px(t, 1, 21, a.W), px(t, 1, 20, a.W));
      let hu = e === "bark" ? -1 : 0;
      dogHeadSide(t, 12, 4 + hu, f.ears, f.mouth), hline(t, 12, 15, 10, a.blue), hline(t, 12, 14, 11, a.blueD), px(t, 15, 11, a.tag);
      e === "bark" && (px(t, 22, 3, "#fff"), px(t, 23, 5, "#fff"), px(t, 22, 7, "#fff"));
      return;
    }
    if (f.play) {
      // oyun selamı: ön alçak, arka yüksek
      rect(t, 5, 10, 7, 6, a.B), rect(t, 10, 13, 7, 5, a.B), rect(t, 6, 16, 2, 5, a.B), rect(t, 9, 16, 2, 5, a.G), rect(t, 6, 20, 2, 2, a.W), rect(t, 9, 20, 2, 2, a.W);
      hline(t, 14, 19, 20, a.B), hline(t, 19, 21, 21, a.W), hline(t, 15, 18, 21, a.B), px(t, 15, 17, a.W), px(t, 16, 17, a.W);
      let tw = l % 2;
      px(t, 4, 9, a.B), px(t, 3 + tw, 8, a.B), px(t, 3 + tw * 2, 7, a.B), px(t, 3 + tw * 2, 6, a.W);
      dogHeadSide(t, 15, 10, "semi", !0), hline(t, 14, 15, 15, a.blue);
      return;
    }
    let by = f.run && l % 2 ? -1 : 0,
      d = f.walk || f.sniff ? [0, 1, 0, -1][l % 4] : 0,
      Y = 12 + by;
    // kuyruk
    if (f.run) hline(t, 1, 4, Y + 1, a.B), px(t, 0, Y + 1, a.W), px(t, 1, Y, a.W);
    else {
      let tw = e === "idle1" || (f.walk && l % 2) ? 1 : 0;
      px(t, 4, Y, a.B), px(t, 3, Y - 1, a.B), px(t, 3 - tw, Y - 2, a.B), px(t, 3 - tw, Y - 3, a.W), px(t, 4 - tw, Y - 4, a.W);
    }
    // bacaklar
    if (f.run) {
      if (l % 2 === 0) {
        rect(t, 15, Y + 5, 3, 2, a.B), rect(t, 17, Y + 6, 3, 2, a.B), rect(t, 19, Y + 7, 3, 1, a.W);
        rect(t, 4, Y + 5, 3, 2, a.B), rect(t, 2, Y + 6, 3, 2, a.B), rect(t, 1, Y + 7, 2, 1, a.W);
      } else rect(t, 12, Y + 6, 2, 3, a.B), rect(t, 11, Y + 9, 2, 1, a.W), rect(t, 8, Y + 6, 2, 3, a.G), rect(t, 9, Y + 9, 2, 1, a.W);
    } else {
      rect(t, 8 - d, 18, 2, 2, a.G), rect(t, 8 - d, 20, 2, 2, a.w), rect(t, 13 - d, 18, 2, 2, a.G), rect(t, 13 - d, 20, 2, 2, a.w);
      rect(t, 6 + d, 18, 2, 2, a.B), rect(t, 6 + d, 20, 2, 2, a.W), rect(t, 15 + d, 18, 2, 2, a.B), rect(t, 15 + d, 20, 2, 2, a.W);
    }
    // gövde
    rect(t, 5, Y, 12, 6, a.B), hline(t, 6, 15, Y - 1, a.B), hline(t, 7, 13, Y + 1, a.G), rect(t, 15, Y + 2, 2, 4, a.W), hline(t, 9, 14, Y + 5, a.G);
    // baş + tasma
    if (f.sniff) {
      let hx = 15 + (l % 2);
      rect(t, 14, Y + 1, 4, 4, a.B), dogHeadSide(t, hx, Y + 4, "flop", !1), vline(t, 14, Y + 2, Y + 5, a.blue);
      l % 2 && (px(t, hx + 9, Y + 6, "rgba(230,230,230,0.7)"), px(t, hx + 9, Y + 4, "rgba(230,230,230,0.7)"));
    } else {
      let hd = e === "idle1" ? 1 : 0;
      rect(t, 14, Y - 2 + hd, 4, 4, a.B), dogHeadSide(t, 15, Y - 6 + hd, f.ears, f.mouth), vline(t, 15, Y - 1 + hd, Y + 1 + hd, a.blue), px(t, 16, Y + 1 + hd, a.tag), px(t, 14, Y + hd, a.blueD);
    }
  }
  function dogFB(t, e, l, back, f) {
    let a = xa,
      sit = f.sitp,
      by = f.run && l % 2 ? -1 : 0,
      d = f.walk || f.run ? [0, 1, 0, -1][l % 4] : 0,
      play = f.play,
      Y = 12 + by + (play && !back ? 2 : 0);
    // kuyruk
    let tw = e === "wag0" ? -1 : e === "wag1" ? 1 : f.walk || f.run || play ? (l % 2 ? 1 : -1) : e === "idle1" ? 1 : -1;
    if (back) {
      if (sit) hline(t, 13, 13 + tw * 4, 21, a.B), px(t, 13 + tw * 5, 20, a.W), px(t, 13 + tw * 4, 20, a.B);
      else vline(t, 13 + (tw > 0 ? 1 : 0), Y - 3, Y + 2, a.B), px(t, 13 + tw, Y - 4, a.W), px(t, 13 + tw, Y - 5, a.W);
    } else {
      let sx = tw > 0 ? 17 : 8,
        dx = tw > 0 ? 1 : -1;
      px(t, sx, Y + 1, a.B), px(t, sx + dx, Y, a.B), px(t, sx + dx, Y - 1, a.B), px(t, sx + dx * 2, Y - 2, a.W);
    }
    // gövde & bacaklar
    if (sit) {
      rect(t, 9, 12, 8, 8, a.B), rect(t, 8, 16, 10, 5, a.B), px(t, 8, 21, a.W), px(t, 17, 21, a.W);
      if (!back) {
        rect(t, 11, 13, 4, 7, a.W), px(t, 12, 15, a.w), px(t, 13, 17, a.w);
        e === "beg" ? (rect(t, 10, 14, 2, 2, a.W), rect(t, 14, 14, 2, 2, a.W), px(t, 10, 13, a.W), px(t, 15, 13, a.W)) : (rect(t, 10, 20, 2, 2, a.W), rect(t, 14, 20, 2, 2, a.W), px(t, 12, 21, a.G));
      } else vline(t, 12, 13, 19, a.G), vline(t, 13, 13, 19, a.G), hline(t, 9, 16, 20, a.G);
    } else {
      rect(t, 9, Y, 8, 7, a.B), back ? (vline(t, 12, Y + 1, Y + 5, a.G), vline(t, 13, Y + 1, Y + 5, a.G)) : (rect(t, 11, Y + 1, 4, 6, a.W), px(t, 12, Y + 3, a.w));
      let ll = d > 0 ? 1 : 0,
        rl = d < 0 ? 1 : 0;
      rect(t, 9, 18, 2, 2 - ll, a.B), rect(t, 9, 20 - ll, 2, 2, a.W), rect(t, 15, 18, 2, 2 - rl, a.B), rect(t, 15, 20 - rl, 2, 2, a.W);
      play && !back && (rect(t, 7, 20, 3, 2, a.W), rect(t, 16, 20, 3, 2, a.W));
    }
    // baş
    let hy = (sit ? 4 : 5) + by + (f.sniff ? 5 : 0) + (play && !back ? 3 : 0) + (e === "idle1" ? 1 : 0) + (e === "bark" ? -1 : 0),
      hx = 8 + (f.sniff ? (l % 2 ? 1 : -1) : 0);
    // kulaklar
    for (let o of [0, 1]) {
      let ex = o ? hx + 8 : hx;
      f.ears === "up"
        ? (rect(t, ex, hy - 3, 2, 4, a.B), back || px(t, ex + (o ? 0 : 1), hy - 1, a.ear))
        : f.ears === "back" || f.ears === "flop"
          ? (rect(t, ex + (o ? 1 : -1), hy + 1, 2, 4, a.B), px(t, ex + (o ? 2 : -1), hy + 5, a.G))
          : (rect(t, ex, hy - 2, 2, 3, a.B), px(t, ex + (o ? 1 : 0), hy - 2, a.G), px(t, ex + (o ? 2 : -1), hy - 1, a.B));
    }
    rect(t, hx, hy + 1, 10, 5, a.B), rect(t, hx + 1, hy, 8, 1, a.B), rect(t, hx + 1, hy + 6, 8, 1, a.B);
    if (back) hline(t, hx + 3, hx + 6, hy + 2, a.G), hline(t, hx + 1, hx + 8, hy + 7, a.blue), hline(t, hx + 2, hx + 7, hy + 8, a.blueD);
    else {
      rect(t, hx + 4, hy, 2, 4, a.W), rect(t, hx + 3, hy + 4, 4, 3, a.W), hline(t, hx + 4, hx + 5, hy + 4, a.nose), px(t, hx + 2, hy + 3, a.eye), px(t, hx + 7, hy + 3, a.eye);
      px(t, hx + 3, hy + 6, a.w), px(t, hx + 6, hy + 6, a.w);
      hline(t, hx + 1, hx + 8, hy + 7, a.blue), hline(t, hx + 2, hx + 7, hy + 8, a.blueD), px(t, hx + 5, hy + 8, a.tag);
      f.mouth && (hline(t, hx + 4, hx + 5, hy + 7, a.tongue), px(t, hx + 4, hy + 6, a.nose), px(t, hx + 5, hy + 6, a.nose));
      e === "bark" && (px(t, hx + 12, hy - 1, "#fff"), px(t, hx + 13, hy + 1, "#fff"), px(t, hx - 3, hy - 1, "#fff"), px(t, hx - 4, hy + 1, "#fff"));
      f.sniff && l % 2 && (px(t, hx + 1, hy + 9, "rgba(230,230,230,0.7)"), px(t, hx + 8, hy + 9, "rgba(230,230,230,0.7)"));
    }
  }
  // --- Papağanlar (Kaptan Kırmızı / Gece Yarısı) ---
  function To(t, e, v, a, r, n, face) {
    let aS = nt(a, -0.22),
      nS = nt(n, -0.25),
      bk = "#e8c040",
      E = "#101010";
    if (e.startsWith("fly")) {
      let o = e === "fly0";
      if (v === "side") {
        rect(t, 8, 11, 9, 4, a), hline(t, 9, 15, 14, aS), rect(t, 15, 9, 4, 4, a), px(t, 17, 10, face), px(t, 17, 10, E), rect(t, 19, 10, 2, 2, bk), px(t, 20, 12, "#b88a20");
        hline(t, 4, 8, 13, n), hline(t, 2, 6, 14, r), hline(t, 1, 4, 15, n);
        if (o) for (let i = 0; i < 6; i++) hline(t, 9 + i * 0.5, 14 - i * 0.3, 10 - i, i < 4 ? n : nS);
        else for (let i = 0; i < 5; i++) hline(t, 9 + i * 0.5, 14 - i * 0.4, 14 + i, i < 3 ? n : nS);
        return;
      }
      rect(t, 11, 9, 4, 8, a), rect(t, 11, 6, 4, 4, a), v === "back" ? hline(t, 11, 14, 11, aS) : (px(t, 11, 7, E), px(t, 14, 7, E), rect(t, 12, 8, 2, 2, bk));
      for (let i = 1; i <= 8; i++) {
        let d = 10 + (o ? -Math.round(i * 0.6) : Math.round(i * 0.45));
        rect(t, 11 - i, d, 1, i < 3 ? 4 : 3, i > 6 ? nS : n), rect(t, 14 + i, d, 1, i < 3 ? 4 : 3, i > 6 ? nS : n), i % 3 === 0 && (px(t, 11 - i, d + 3, r), px(t, 14 + i, d + 3, r));
      }
      rect(t, 12, 17, 2, 3, n), hline(t, 11, 14, 17, r);
      return;
    }
    let fl = e === "fluff" ? 1 : 0;
    if (v === "side") {
      rect(t, 10, 11, 5 + fl, 8, a), rect(t, 10 - fl, 13, 3 + fl, 5, n), vline(t, 10 - fl, 14, 17, nS), rect(t, 11, 6, 5, 5, a), hline(t, 12, 14, 5, a);
      px(t, 14, 8, face), px(t, 13, 8, face), px(t, 14, 8, E), rect(t, 16, 8, 2, 2, bk), px(t, 17, 10, "#b88a20"), px(t, 16, 10, bk);
      px(t, 9, 18, n), px(t, 8, 19, n), px(t, 7, 20, r), px(t, 6, 21, n), px(t, 9, 19, r), px(t, 8, 20, n), px(t, 7, 21, n);
      px(t, 12, 19, "#6a6a6a"), px(t, 14, 19, "#6a6a6a");
      fl && (px(t, 9, 12, a), px(t, 16, 13, a), px(t, 12, 4, a));
      return;
    }
    let back = v === "back";
    rect(t, 10 - fl, 11, 6 + fl * 2, 8, back ? n : a), hline(t, 11, 14, 19, back ? n : a);
    if (back) vline(t, 12, 12, 18, nS), vline(t, 13, 12, 18, nS), hline(t, 10, 15, 11, a), px(t, 10, 15, r), px(t, 15, 15, r);
    else vline(t, 10 - fl, 12, 17, n), vline(t, 15 + fl, 12, 17, n), hline(t, 12, 13, 16, r), hline(t, 12, 13, 14, aS);
    rect(t, 10, 6, 6, 5, a), hline(t, 11, 14, 5, a), px(t, 12, 4, a);
    back ? hline(t, 11, 14, 8, aS) : (hline(t, 10, 11, 8, face), hline(t, 14, 15, 8, face), px(t, 11, 8, E), px(t, 14, 8, E), rect(t, 12, 9, 2, 2, bk), hline(t, 12, 13, 11, "#b88a20"));
    rect(t, 12, 20, 2, 2, n), hline(t, 11, 14, 20, r), px(t, 11, 20, "#6a6a6a"), px(t, 14, 20, "#6a6a6a");
    fl && (px(t, 8, 13, a), px(t, 17, 13, a), px(t, 9, 10, a), px(t, 16, 10, a), px(t, 13, 3, a));
  }
  // --- Cüce Kaptan (maymun) ---
  function Ac(t, e, v) {
    let a = "#8a5a2b",
      aS = "#6a4420",
      r = "#c87a3a",
      n = "#1e1e24",
      tan = "#e8c49a",
      E = "#1a1410",
      l = petFr(e),
      d = e.startsWith("walk") ? [0, 1, 0, -1][l] : 0,
      hold = e === "hold";
    if (e === "sleep") {
      ellipse(t, 12, 18, 6, 3, a), rect(t, 14, 14, 5, 5, a), rect(t, 15, 16, 3, 2, tan), hline(t, 15, 17, 17, E), hline(t, 13, 19, 13, n), hline(t, 5, 8, 21, r);
      return;
    }
    if (v === "side") {
      px(t, 8, 17, r), px(t, 7, 16, r), px(t, 6, 15, r), px(t, 6, 14, r), px(t, 6, 13, r), px(t, 7, 12, r), px(t, 8, 12, r);
      rect(t, 9, 13, 6, 6, a), vline(t, 9, 14, 18, aS), rect(t, 10 + d, 19, 2, 2, aS), px(t, 11 + d, 21, tan), rect(t, 12 - d, 19, 2, 2, a), hline(t, 12 - d, 14 - d, 21, tan);
      hold ? (rect(t, 13, 13, 3, 2, a), rect(t, 16, 11, 3, 3, "#f2c14e"), px(t, 16, 14, tan)) : (rect(t, 12, 14, 2, 3, aS), px(t, 13 + d, 17, tan));
      rect(t, 11, 6, 7, 7, a), rect(t, 14, 8, 4, 4, tan), px(t, 16, 9, E), px(t, 18, 10, tan), hline(t, 16, 17, 11, "#a8704a"), px(t, 11, 9, tan);
      hline(t, 9, 19, 6, n), rect(t, 11, 4, 6, 2, n), px(t, 15, 5, "#e8e0c0");
      return;
    }
    let back = v === "back";
    // kuyruk
    back
      ? (vline(t, 13, 17, 20, r), px(t, 14, 21, r), px(t, 15, 21, r), px(t, 16, 20, r))
      : (px(t, 16, 17, r), px(t, 17, 16, r), px(t, 18, 15, r), px(t, 18, 14, r), px(t, 17, 13, r));
    rect(t, 10, 13, 6, 6, a), back ? vline(t, 13, 14, 17, aS) : rect(t, 12, 14, 2, 4, "#c89a6a");
    rect(t, 10, 19, 2, d > 0 ? 1 : 2, a), rect(t, 14, 19, 2, d < 0 ? 1 : 2, a), hline(t, 9, 11, d > 0 ? 20 : 21, tan), hline(t, 14, 16, d < 0 ? 20 : 21, tan);
    if (hold && !back) rect(t, 9, 12, 2, 3, a), rect(t, 15, 12, 2, 3, a), rect(t, 11, 13, 4, 3, "#f2c14e"), px(t, 12, 14, "#fff6c0");
    else vline(t, 9, 13 + Math.max(0, d), 17, aS), vline(t, 16, 13 + Math.max(0, -d), 17, aS), px(t, 9, 18, tan), px(t, 16, 18, tan);
    rect(t, 9, 6, 8, 7, a), px(t, 8, 9, tan), px(t, 17, 9, tan);
    back || (rect(t, 10, 8, 6, 4, tan), px(t, 11, 9, E), px(t, 14, 9, E), hline(t, 12, 13, 11, "#a8704a"), hline(t, 11, 14, 7, a));
    hline(t, 7, 18, 6, n), rect(t, 10, 4, 6, 2, n), px(t, 7, 5, n), px(t, 18, 5, n), back || hline(t, 12, 13, 5, "#e8e0c0");
  }
  // --- Martı ---
  function Sc(t, e, v) {
    let a = "#f2f2ee",
      aS = "#d0d4d8",
      r = "#9aa4ae",
      n = "#4a545e",
      o = "#f0a030",
      E = "#101010";
    if (e === "fly0" || e === "fly1") {
      let l = e === "fly0" ? 0 : 1;
      if (v === "side") {
        rect(t, 8, 12, 9, 3, a), hline(t, 9, 15, 14, aS), rect(t, 15, 10, 4, 4, a), px(t, 17, 11, E), hline(t, 19, 20, 12, o), hline(t, 4, 8, 13, r), hline(t, 3, 5, 12, n);
        if (l) for (let i = 0; i < 5; i++) hline(t, 9 + i * 0.6, 14 - i * 0.3, 15 + i, i < 3 ? r : n);
        else for (let i = 0; i < 6; i++) hline(t, 9 + i * 0.6, 14 - i * 0.2, 11 - i, i < 4 ? r : n);
        return;
      }
      for (let i = 1; i <= 10; i++) {
        let d = 11 + (l ? Math.round(i * 0.35) : -Math.round(i * 0.3));
        rect(t, 11 - i, d, 1, 2, i > 8 ? n : r), rect(t, 14 + i, d, 1, 2, i > 8 ? n : r);
      }
      rect(t, 11, 10, 4, 7, a), rect(t, 11, 7, 4, 4, a), v === "back" ? hline(t, 11, 14, 12, aS) : (px(t, 11, 8, E), px(t, 14, 8, E), rect(t, 12, 9, 2, 2, o)), hline(t, 12, 13, 17, r);
      return;
    }
    let fl = e === "fluff" || e === "alert" ? 1 : 0;
    if (v === "side") {
      rect(t, 8, 13, 9, 5, a), rect(t, 8, 13, 6, 3, r), hline(t, 5, 8, 14, n), hline(t, 6, 8, 15, r), rect(t, 14, 9, 4, 4 + fl, a), px(t, 16, 10, E), hline(t, 18, 19, 11, o), px(t, 19, 12, "#c87820");
      vline(t, 11, 18, 20, o), vline(t, 13, 18, 20, o), hline(t, 13, 14, 21, o), hline(t, 11, 12, 21, o), hline(t, 10, 15, 17, aS);
      return;
    }
    let back = v === "back";
    rect(t, 10 - fl, 12, 6 + fl * 2, 7, back ? r : a), back ? (vline(t, 12, 13, 17, n), vline(t, 13, 13, 17, n), hline(t, 11, 14, 19, n)) : (vline(t, 10 - fl, 13, 17, r), vline(t, 15 + fl, 13, 17, r), hline(t, 11, 14, 18, aS));
    rect(t, 11, 8 - fl, 4, 4 + fl, a), back || (px(t, 11, 9 - fl, E), px(t, 14, 9 - fl, E), rect(t, 12, 10 - fl, 2, 2, o));
    vline(t, 11, 19, 20, o), vline(t, 14, 19, 20, o), hline(t, 10, 11, 21, o), hline(t, 14, 15, 21, o);
  }
  // --- Kaplumbağa ---
  function Cc(t, e, v) {
    let a = "#5a7a3a",
      r = "#3e5a28",
      n = "#a8b878",
      nS = "#869658",
      i = "#7aa04a",
      l = petFr(e),
      d = e.startsWith("walk") ? [0, 1, 0, -1][l] : 0,
      sl = e === "sleep";
    if (v === "side") {
      if (!sl) rect(t, 18, 14, 4, 4, n), px(t, 20, 15, "#202018"), px(t, 21, 17, nS), rect(t, 7 + d, 19, 3, 2, n), rect(t, 14 - d, 19, 3, 2, n), px(t, 7 + d, 21, nS), px(t, 16 - d, 21, nS), px(t, 4, 18, n);
      for (let y = 0; y < 8; y++) {
        let w = [3, 5, 6, 7, 7, 7, 7, 6][y];
        hline(t, 12 - w, 11 + w, 12 + y + (sl ? 1 : 0), y === 7 ? r : a);
      }
      hline(t, 8, 10, 13 + (sl ? 1 : 0), i), disc(t, 9, 16, 1, r), disc(t, 14, 16, 1, r), disc(t, 12, 14, 1, r), px(t, 17, 17, r), px(t, 6, 17, r);
      return;
    }
    let back = v === "back";
    if (!sl) {
      rect(t, 6, 18 + d, 3, 2, n), rect(t, 17, 18 - d, 3, 2, n);
      back ? (px(t, 13, 21, n), rect(t, 8, 12, 2, 2, nS), rect(t, 16, 12, 2, 2, nS)) : (rect(t, 11, 18, 4, 4, n), px(t, 11, 19, "#202018"), px(t, 14, 19, "#202018"), hline(t, 12, 13, 21, nS));
    }
    for (let y = 0; y < 9; y++) {
      let w = [3, 5, 6, 7, 7, 7, 6, 5, 3][y];
      hline(t, 13 - w, 12 + w, 10 + y + (sl ? 1 : 0), y > 6 ? r : a);
    }
    let o = sl ? 1 : 0;
    hline(t, 9, 11, 11 + o, i);
    for (let [p, f] of [
      [0, 0],
      [-4, -1],
      [4, -1],
      [-3, 3],
      [3, 3],
    ])
      disc(t, 12.5 + p, 14 + f + o, 1, r);
    if (!sl && !back) rect(t, 11, 17, 4, 4, n), px(t, 11, 18, "#202018"), px(t, 14, 18, "#202018"), hline(t, 12, 13, 20, nS);
  }
  // --- Gelincik ---
  function Ic(t, e, v) {
    let a = "#c89a62",
      aS = "#a87a48",
      r = "#7a5432",
      n = "#f0e0c0",
      i = "#4a3424",
      l = petFr(e),
      d = e.startsWith("walk") ? [0, 1, 0, -1][l] : 0,
      hold = e === "hold";
    if (e === "sleep") {
      ellipse(t, 12, 18, 6, 3, a), hline(t, 8, 16, 21, aS), rect(t, 13, 15, 5, 4, n), hline(t, 14, 17, 16, i), px(t, 18, 17, "#2a1a10"), hline(t, 5, 8, 20, r), px(t, 13, 14, r), px(t, 16, 14, r);
      return;
    }
    if (v === "side") {
      if (hold) {
        rect(t, 9, 10, 4, 10, a), vline(t, 9, 11, 19, aS), rect(t, 9, 20, 5, 2, r), hline(t, 3, 8, 21, r), rect(t, 10, 5, 6, 5, n), hline(t, 12, 15, 7, i), px(t, 14, 7, "#101010"), px(t, 16, 8, "#2a1a10"), px(t, 10, 4, r);
        rect(t, 13, 11, 3, 2, a), rect(t, 16, 10, 3, 3, "#f2c14e");
        return;
      }
      hline(t, 1, 5, 16, r), px(t, 1, 15, r), rect(t, 5, 15 - (d ? 1 : 0), 13, 3, a), hline(t, 7, 14, 14 - (d ? 1 : 0), a), hline(t, 6, 16, 18 - (d ? 1 : 0), aS);
      rect(t, 17, 13, 5, 4, n), hline(t, 18, 20, 14, i), px(t, 20, 14, "#101010"), px(t, 22, 15, "#2a1a10"), px(t, 17, 12, r), px(t, 19, 12, r);
      rect(t, 6 + d, 18, 2, 3, r), rect(t, 9 - d, 18, 2, 3, r), rect(t, 14 + d, 18, 2, 3, r), rect(t, 17 - d, 18, 2, 3, r);
      return;
    }
    let back = v === "back",
      up = hold ? -3 : 0;
    back && (vline(t, 13, 19, 21, r), px(t, 14, 21, r), px(t, 15, 21, r));
    rect(t, 11, 12 + up, 4, 8 - up, a), back ? vline(t, 13, 13 + up, 19, aS) : rect(t, 12, 13 + up, 2, 6 - up, n);
    rect(t, 10, 19 + (d > 0 ? -1 : 0), 2, 2, r), rect(t, 14, 19 + (d < 0 ? -1 : 0), 2, 2, r);
    back || (px(t, 16, 19, r), px(t, 17, 18, r), px(t, 17, 17, r));
    rect(t, 10, 7 + up, 6, 5, back ? a : n), px(t, 10, 6 + up, r), px(t, 15, 6 + up, r);
    back || (hline(t, 10, 15, 9 + up, i), px(t, 11, 9 + up, "#101010"), px(t, 14, 9 + up, "#101010"), hline(t, 12, 13, 11 + up, "#2a1a10"));
    hold && !back && (rect(t, 11, 13 + up + 3, 4, 3, "#f2c14e"), px(t, 10, 14 + up + 3, n), px(t, 15, 14 + up + 3, n));
  }
  // --- Ahtapot ---
  function zc(t, e, v) {
    let a = "#9a4ab0",
      r = "#6a2a80",
      n = "#c88ad8",
      o = e.startsWith("walk") ? petFr(e) : e === "wag0" ? 1 : e === "wag1" ? 3 : 0,
      tub = e === "sit",
      Y = tub ? -2 : 0;
    // kollar
    if (!tub)
      for (let k = 0; k < 6; k++) {
        let s = k < 3 ? -1 : 1,
          j = k % 3,
          x0 = 13 + s * (1 + j * 2) - (s > 0 ? 1 : 0),
          wv = (o + k) % 2 ? 1 : 0;
        for (let q = 0; q < 6; q++) {
          let x = x0 + s * Math.round(q * (0.5 + j * 0.45)),
            y = 15 + Math.min(q, 5 - (j === 2 ? 1 : 0)) - (q > 4 && wv ? 1 : 0);
          px(t, x, y, q === 5 ? n : q % 2 ? r : a);
        }
        px(t, x0 + s * Math.round(5 * (0.5 + j * 0.45)) + s, 20 - (wv ? 1 : 0) - (j === 2 ? 1 : 0), n);
      }
    // baş
    rect(t, 9, 8 + Y, 8, 7, a), rect(t, 10, 7 + Y, 6, 1, a), rect(t, 8, 10 + Y, 10, 4, a), hline(t, 10, 12, 8 + Y, n), px(t, 10, 9 + Y, n), hline(t, 9, 16, 14 + Y, r);
    if (e !== "sleep") {
      if (v === "front") rect(t, 10, 11 + Y, 2, 2, "#fff"), rect(t, 14, 11 + Y, 2, 2, "#fff"), px(t, 11, 12 + Y, "#101010"), px(t, 14, 12 + Y, "#101010");
      else if (v === "side") rect(t, 14, 11 + Y, 2, 2, "#fff"), px(t, 15, 12 + Y, "#101010");
    } else v !== "back" && (hline(t, 10, 11, 12 + Y, r), hline(t, 14, 15, 12 + Y, r));
    if (tub) {
      rect(t, 7, 14, 12, 7, "#8a5a2b"), hline(t, 7, 18, 14, "#5aa8d8"), hline(t, 8, 17, 13, "#bfe3ef"), hline(t, 7, 18, 16, "#3a2412"), hline(t, 7, 18, 19, "#3a2412"), hline(t, 8, 17, 21, "#5c3a1e");
      for (let x = 9; x < 18; x += 3) vline(t, x, 15, 20, "#6a4424");
      px(t, 7, 13, n), px(t, 6, 14, a), px(t, 18, 13, n), px(t, 19, 14, a), rect(t, 9, 6 + Y + 2, 8, 6, a), rect(t, 10, 7, 6, 1, a), hline(t, 10, 12, 8, n);
      v === "front"
        ? (rect(t, 10, 10, 2, 2, "#fff"), rect(t, 14, 10, 2, 2, "#fff"), px(t, 11, 11, "#101010"), px(t, 14, 11, "#101010"))
        : v === "side" && (rect(t, 14, 10, 2, 2, "#fff"), px(t, 15, 11, "#101010"));
    }
    if (e === "bark")
      for (let [x, y] of [
        [0, -7],
        [1, -8],
        [-1, -9],
        [0, -10],
        [2, -10],
        [-2, -8],
      ])
        px(t, 13 + x, 12 + y, "#1a1028");
  }

