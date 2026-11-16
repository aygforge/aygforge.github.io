  // ===== 3/4 (üst-karşı) bakış: karakterler =====
  var Be = 22,
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
  function wc(t, col = "rgba(22,14,20,0.9)") {
    let W = t.width,
      Hh = t.height,
      e = Qe(W, Hh),
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
    let e = Qe(t.width, t.height),
      a = e.getContext("2d");
    return a.translate(t.width, 0), a.scale(-1, 1), a.drawImage(t, 0, 0), e;
  }
  // Sprite çizimi: (x,y) = karakterin ayak bastığı zemin noktası
  function dS(t, img, x, y) {
    t.drawImage(img, Math.round(x - (img.ax || img.width / 2)), Math.round(y - (img.ay || img.height / 2)));
  }
  function mkSpr(w, h, ax, ay, fn, dir) {
    let c = Qe(w, h);
    fn(c.getContext("2d"));
    let o = wc(c);
    if (dir === "left") o = flipX(o);
    o.ax = dir === "left" ? w - ax : ax;
    o.ay = ay;
    return o;
  }
  function Ro(t, e = "down", a = "idle", r = 0) {
    let n = `${t}|${e}|${a}|${r}`;
    if (dt.has(n)) return dt.get(n);
    let s = Ae[t],
      o = mkSpr(SPW, SPH, SAX, SAY, (i) => Ao(i, s.look, s.build || "normal", s.idle, a, r, e), e);
    return dt.set(n, o), o;
  }
  function ha(t, e = "down", a = "idle", r = 0) {
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
      b(t, cx - 6, 10 + by, 2, hs === "long" ? 8 : 4, hairS), b(t, cx + 4, 10 + by, 2, hs === "long" ? 8 : 4, hairS);
    }
    // --- bacaklar ---
    if (sit) {
      if (side) {
        b(t, cx - 2, 26, 7, 3, pants), b(t, cx + 5, 25, 2, 4, shoe), b(t, cx - 2, 28, 7, 1, pantsS);
      } else {
        b(t, cx - 4 - wide, 26, 8 + wide * 2, 3, pants), b(t, cx - 4 - wide, 28, 8 + wide * 2, 1, pantsS);
        if (!back) b(t, cx - 5 - wide, 28, 3, 2, shoe), b(t, cx + 2 + wide, 28, 3, 2, shoe);
      }
    } else if (side) {
      let ph = walk ? fr : 0;
      if (ph === 1 || ph === 3) {
        // adım: bacaklar açık
        let f = ph === 1 ? pants : pantsS,
          g = ph === 1 ? pantsS : pants;
        b(t, cx - 3, 23, 3, 3, g), b(t, cx - 4, 25, 3, 2, g), b(t, cx - 5, 27, 3, 2, shoe);
        b(t, cx, 23, 3, 3, f), b(t, cx + 1, 25, 3, 2, f), b(t, cx + 1, 27, 4, 2, shoe);
      } else {
        b(t, cx - 2, 23, 2, 5, pantsS), b(t, cx - 1, 23, 3, 5, pants), b(t, cx - 2, 28, 5, 2, shoe);
        ph === 2 && b(t, cx - 2, 27, 2, 1, shoe);
      }
    } else {
      let lf = walk ? [0, 1, 0, -1][fr] : 0;
      // sol bacak (ekranda solda), sağ bacak
      let lx = cx - 3 - wide,
        rx = cx + wide;
      b(t, lx, 23, 3, lf > 0 ? 4 : 5, pants), b(t, lx, lf > 0 ? 27 : 28, 3, 2, shoe);
      b(t, rx, 23, 3, lf < 0 ? 4 : 5, pants), b(t, rx, lf < 0 ? 27 : 28, 3, 2, shoe);
      Te(t, cx - 1 + (wide ? 0 : 0), 24, lf ? 26 : 27, pantsS);
      wide && Te(t, cx, 24, 27, pantsS);
    }
    // --- gövde ---
    let ty = 16 + by;
    if (side) {
      let x0 = cx - 3 - wide,
        w = 6 + wide * 2;
      b(t, x0, ty, w, 7, top), Te(t, x0, ty + 1, ty + 6, topS), b(t, x0, ty + 6, w, 1, topS);
      build === "round" && b(t, x0 + w, ty + 2, 1, 4, top);
      L.top2 && Te(t, x0 + w - 1, ty, ty + 4, acc);
    } else {
      let x0 = cx - 3 - wide,
        w = 6 + wide * 2;
      b(t, x0, ty, w, 7, top), Te(t, x0 + w - 1, ty + 1, ty + 6, topS), b(t, x0, ty + 6, w, 1, topS);
      build === "round" && (Te(t, x0 - 1, ty + 2, ty + 5, top), Te(t, x0 + w, ty + 2, ty + 5, topS));
      if (back) Te(t, cx - 1, ty + 1, ty + 5, topS), L.top2 && b(t, x0, ty, w, 1, acc);
      else if (L.top2) b(t, cx - 1, ty, 2, 5, acc), m(t, cx - 1, ty + 5, nt(acc, -0.2));
      else Te(t, cx - 1, ty + 1, ty + 4, topL);
    }
    // --- kollar ---
    let handR = null;
    if (side) {
      if (work || react) {
        let up = react ? -3 : fr % 2 ? -1 : 0;
        b(t, cx - 1, ty + 1, 2, 2, topS), b(t, cx + 1, ty + 1 + Math.min(0, up + 1), 3, 2, topS), b(t, cx + 4, ty + 1 + up, 1, 2, sk);
        handR = { x: cx + 5, y: ty + 1 + up, s: 1 };
      } else {
        let sw = walk ? [0, 2, 0, -2][fr] : 0;
        b(t, cx - 1, ty + 1, 2, 3, topS), b(t, cx - 1 + Math.sign(sw), ty + 4, 2, 2, topS), b(t, cx - 1 + sw, ty + 6 - (sw ? 1 : 0), 2, 1, sk);
      }
    } else {
      let lx = cx - 5 - wide,
        rx = cx + 3 + wide;
      if (react) {
        b(t, lx, ty - 2, 2, 4, topS), b(t, lx, ty - 3, 2, 1, sk), b(t, rx, ty - 2, 2, 4, topS), b(t, rx, ty - 3, 2, 1, sk);
      } else if (work) {
        let up = fr % 2 ? -1 : 0,
          both = tool === "stretch" || tool === "spell" || tool === "sunglow" || tool === "twinblades";
        if (both) b(t, lx, ty - 2 + up, 2, 4, topS), b(t, lx, ty - 3 + up, 2, 1, sk);
        else b(t, lx, ty + 1, 2, 4, topS), b(t, lx, ty + 5, 2, 1, sk);
        b(t, rx, ty + 1, 2, 2, topS), b(t, rx + 1, ty - 1 + up, 2, 3, topS), b(t, rx + 1, ty - 2 + up, 2, 1, sk);
        handR = { x: rx + 1, y: ty - 2 + up, s: 1 };
      } else {
        let sw = walk ? [0, 1, 0, -1][fr] : 0,
          sh = sit ? -1 : 0;
        b(t, lx, ty + 1 + Math.max(0, -sw), 2, 4 + sh, topS), b(t, lx, ty + 5 + sh + Math.max(0, -sw) - (sw < 0 ? 1 : 0), 2, 1, sk);
        b(t, rx, ty + 1 + Math.max(0, sw), 2, 4 + sh, topS), b(t, rx, ty + 5 + sh + Math.max(0, sw) - (sw > 0 ? 1 : 0), 2, 1, sk);
      }
    }
    // --- baş ---
    let hy = 7 + by; // başın üst satırı
    if (side) {
      b(t, cx - 4, hy + 1, 9, 7, sk), b(t, cx - 3, hy, 7, 1, sk), b(t, cx - 3, hy + 8, 7, 1, sk);
      m(t, cx + 5, hy + 5, sk); // burun
      m(t, cx - 1, hy + 5, skS); // kulak
      b(t, cx - 3, hy + 8, 3, 1, skS);
    } else {
      b(t, cx - 5, hy + 1, 10, 7, sk), b(t, cx - 4, hy, 8, 1, sk), b(t, cx - 4, hy + 8, 8, 1, sk);
      if (!back) m(t, cx - 5, hy + 7, skS), m(t, cx + 4, hy + 7, skS);
    }
    // yüz
    if (!back) {
      let eye = "#2a1a1e";
      if (side) {
        b(t, cx + 2, hy + 4, 1, 2, eye);
        L.glasses && (b(t, cx + 1, hy + 4, 3, 2, "#8ad0f0"), m(t, cx + 2, hy + 5, eye), Q(t, cx - 2, cx, hy + 4, "#3a3a44"));
        L.eyepatch && (b(t, cx + 1, hy + 4, 3, 2, "#111"), Q(t, cx - 4, cx + 3, hy + 3, "#111"));
        m(t, cx + 3, hy + 7, skS);
      } else {
        b(t, cx - 3, hy + 4, 1, 2, eye), b(t, cx + 2, hy + 4, 1, 2, eye);
        m(t, cx - 4, hy + 6, nt(sk, -0.08)), m(t, cx + 3, hy + 6, nt(sk, -0.08));
        L.glasses &&
          (b(t, cx - 4, hy + 4, 3, 2, "#8ad0f0"), b(t, cx + 1, hy + 4, 3, 2, "#8ad0f0"), m(t, cx - 3, hy + 5, eye), m(t, cx + 2, hy + 5, eye), Q(t, cx - 1, cx, hy + 4, "#3a3a44"));
        L.eyepatch && (b(t, cx + 1, hy + 4, 3, 2, "#111"), Q(t, cx - 5, cx + 4, hy + 3, "#111"));
        Q(t, cx - 1, cx, hy + 7, skS);
      }
    }
    // --- sakal ---
    let bd = L.beard,
      bc = L.beardColor || hair,
      bcS = nt(bc, -0.2);
    if (bd && bd !== "none" && !back) {
      if (side) {
        if (bd === "mustache") Q(t, cx + 2, cx + 4, hy + 7, bc);
        else {
          b(t, cx, hy + 7, 5, 2, bc), m(t, cx - 1, hy + 6, bc), m(t, cx + 3, hy + 6, bc);
          (bd === "full" || bd === "long" || bd === "braids") && (b(t, cx, hy + 6, 2, 1, bc), b(t, cx + 1, hy + 9, 4, 1, bc));
          bd === "long" && b(t, cx + 2, hy + 10, 3, 3, bc);
          bd === "braids" && (Te(t, cx + 2, hy + 10, hy + 13, bc), Te(t, cx + 4, hy + 10, hy + 12, bcS));
        }
      } else if (bd === "mustache") Q(t, cx - 3, cx + 2, hy + 7, bc), m(t, cx - 4, hy + 8, bc), m(t, cx + 3, hy + 8, bc);
      else if (bd === "short") {
        Q(t, cx - 5, cx - 4, hy + 6, bc), Q(t, cx + 3, cx + 4, hy + 6, bc), Q(t, cx - 5, cx + 4, hy + 7, bc), Q(t, cx - 4, cx + 3, hy + 8, bc), Q(t, cx - 1, cx, hy + 7, skS);
      } else {
        Te(t, cx - 5, hy + 5, hy + 7, bc), Te(t, cx + 4, hy + 5, hy + 7, bc);
        Q(t, cx - 5, cx + 4, hy + 7, bc), Q(t, cx - 4, cx + 3, hy + 8, bc), Q(t, cx - 3, cx + 2, hy + 9, bc), Q(t, cx - 1, cx, hy + 7, bcS);
        Q(t, cx - 4, cx + 3, hy + 6, bc), Q(t, cx - 1, cx, hy + 6, sk);
        bd === "long" && (b(t, cx - 2, hy + 10, 4, 3, bc), Q(t, cx - 1, cx, hy + 13, bcS));
        bd === "braids" && (Te(t, cx - 3, hy + 10, hy + 13, bc), Te(t, cx + 2, hy + 10, hy + 13, bc), m(t, cx - 3, hy + 14, "#e8c45a"), m(t, cx + 2, hy + 14, "#e8c45a"));
      }
    }
    // --- saç ---
    let bald = hs === "bald";
    if (!hooded) {
      if (back) {
        if (bald) m(t, cx - 2, hy + 2, nt(sk, 0.25)), Q(t, cx - 2, cx + 1, hy + 7, skS);
        else {
          b(t, cx - 5, hy + 1, 10, 6, hair), b(t, cx - 4, hy, 8, 1, hair), Q(t, cx - 4, cx + 3, hy + 7, hair), Q(t, cx - 3, cx - 2, hy + 2, hairL);
          Te(t, cx + 4, hy + 2, hy + 6, hairS);
          if (hs === "long") b(t, cx - 5, hy + 7, 10, 5, hair), Q(t, cx - 4, cx + 3, hy + 12, hair), Te(t, cx - 1, hy + 8, hy + 11, hairS);
          if (hs === "ponytail") b(t, cx - 1, hy + 6, 2, 7, hair), m(t, cx - 1, hy + 6, "#c8423b"), m(t, cx, hy + 6, "#c8423b");
          if (hs === "braid") for (let i = 0; i < 9; i++) m(t, cx - 1 + (i % 2), hy + 6 + i, i % 3 ? hair : hairL), m(t, cx - (i % 2), hy + 6 + i, hairS);
          if (hs === "bun") H(t, cx, hy + 5, 2, hairS), m(t, cx - 1, hy + 4, hairL);
          if (hs === "mohawk") b(t, cx - 5, hy + 1, 10, 7, skS), b(t, cx - 1, hy - 3, 2, 10, hairL);
        }
      } else if (side) {
        if (bald) m(t, cx, hy + 1, nt(sk, 0.25));
        else if (hs === "mohawk") b(t, cx - 4, hy + 1, 5, 4, nt(sk, -0.1)), b(t, cx - 3, hy - 3, 7, 3, hairL), b(t, cx - 2, hy, 6, 1, hair);
        else {
          b(t, cx - 3, hy, 7, 1, hair), b(t, cx - 4, hy + 1, 9, 2, hair), b(t, cx - 4, hy + 3, 4, 4, hair), m(t, cx, hy + 3, hair), Q(t, cx - 2, cx + 1, hy + 1, hairL);
          b(t, cx - 4, hy + 7, 2, 1, hairS);
          if (hs === "long") b(t, cx - 5, hy + 4, 4, 8, hair), Te(t, cx - 5, hy + 6, hy + 11, hairS);
          if (hs === "ponytail") b(t, cx - 6, hy + 4, 2, 6, hair), m(t, cx - 5, hy + 4, "#c8423b");
          if (hs === "braid") for (let i = 0; i < 9; i++) m(t, cx - 5 - (i % 2), hy + 4 + i, i % 3 ? hair : hairL);
          if (hs === "bun") H(t, cx - 5, hy + 3, 2, hairS);
          if (hs === "topknot") b(t, cx - 1, hy - 2, 3, 2, hairL);
          if (hs === "curly") m(t, cx - 5, hy + 2, hair), m(t, cx - 5, hy + 5, hair), m(t, cx - 2, hy - 1, hair), m(t, cx + 2, hy - 1, hair), m(t, cx + 5, hy + 2, hair), m(t, cx - 3, hy + 2, hairL);
        }
      } else {
        // önden
        if (bald) Q(t, cx - 2, cx - 1, hy + 1, nt(sk, 0.25));
        else if (hs === "mohawk") b(t, cx - 5, hy + 1, 10, 2, nt(sk, -0.1)), b(t, cx - 1, hy - 3, 2, 6, hairL), Te(t, cx, hy - 3, hy + 2, hair);
        else {
          b(t, cx - 4, hy, 8, 1, hair), b(t, cx - 5, hy + 1, 10, 2, hair), m(t, cx - 5, hy + 3, hair), m(t, cx + 4, hy + 3, hair), Q(t, cx - 3, cx - 1, hy + 1, hairL);
          m(t, cx - 4, hy + 3, hair), m(t, cx + 3, hy + 3, hair);
          if (hs === "long") Te(t, cx - 5, hy + 3, hy + 8, hair), Te(t, cx + 4, hy + 3, hy + 8, hair);
          if (hs === "braid") {
            Te(t, cx - 5, hy + 3, hy + 6, hair);
            for (let i = 0; i < 9; i++) m(t, cx + 4 + (i % 2), hy + 3 + i, i % 3 ? hair : hairL);
          }
          if (hs === "ponytail") b(t, cx + 5, hy + 2, 1, 5, hair), m(t, cx + 6, hy + 4, hair);
          if (hs === "bun") b(t, cx - 1, hy - 2, 3, 2, hair), m(t, cx - 1, hy - 2, hairL);
          if (hs === "topknot") b(t, cx - 1, hy - 2, 2, 2, hairL);
          if (hs === "curly")
            Q(t, cx - 3, cx + 2, hy - 1, hair), m(t, cx - 6, hy + 2, hair), m(t, cx + 5, hy + 2, hair), m(t, cx - 6, hy + 4, hair), m(t, cx + 5, hy + 4, hair), m(t, cx + 1, hy + 2, hairL), m(t, cx - 4, hy, hairL);
        }
      }
    }
    _c(t, L, cx, hy, dir, back, side);
    // --- alet / tepki ---
    if (work) Ec(t, tool, fr, handR, cx, hy, ty, dir, L);
    if (react) b(t, side ? cx + 8 : cx + 9, hy - 6, 2, 4, "#ffe040"), b(t, side ? cx + 8 : cx + 9, hy - 1, 2, 2, "#ffe040");
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
        b(t, L, hy - 2, R - L + 1, 4, n), b(t, L + 1, hy - 3, R - L - 1, 1, n), b(t, L - 1, hy - 1, 1, 2, n), b(t, R + 1, hy - 1, 1, 2, n);
        ce(t, L, hy, R - 2, hy - 2, s), ce(t, L + 3, hy + 1, R, hy - 1, s), Q(t, L + 1, L + 3, hy - 2, l);
        e.hatGem && !back && b(t, side ? R - 1 : cx - 1, hy - 1, 2, 2, "#2fa04a");
        back && m(t, cx, hy + 2, s);
        break;
      case "tricorn":
        if (side) {
          Q(t, L - 3, R + 3, hy + 1, n), Q(t, L - 2, R + 2, hy, n), b(t, L + 1, hy - 3, R - L - 1, 3, n), m(t, L - 3, hy, n), m(t, R + 3, hy, n), Q(t, L + 1, R - 1, hy - 1, s);
          Q(t, L - 2, R + 2, hy + 1, s);
        } else {
          Q(t, L - 2, R + 2, hy + 1, n), Q(t, L - 1, R + 1, hy, n), b(t, L + 2, hy - 3, R - L - 3, 3, n), Q(t, L + 3, R - 3, hy - 4, n);
          m(t, L - 2, hy, n), m(t, R + 2, hy, n), m(t, L - 3, hy - 1, n), m(t, R + 3, hy - 1, n), Q(t, L - 1, R + 1, hy + 1, s);
          back || b(t, cx - 1, hy - 2, 2, 2, "#e8e0c0");
        }
        break;
      case "bandana":
        b(t, L, hy + 1, R - L + 1, 2, n), Q(t, L + 1, R - 1, hy, n), Q(t, L, R, hy + 2, s), Q(t, L + 1, L + 2, hy, l);
        if (back) b(t, cx - 1, hy + 3, 2, 2, n), m(t, cx - 2, hy + 5, n), m(t, cx + 1, hy + 6, n);
        else if (side) b(t, L - 1, hy + 2, 2, 2, n), m(t, L - 2, hy + 4, n), m(t, L - 1, hy + 5, n);
        else b(t, R + 1, hy + 2, 1, 2, n), m(t, R + 2, hy + 4, n), m(t, R + 1, hy + 5, n);
        break;
      case "cap":
        b(t, L, hy, R - L + 1, 3, n), Q(t, L + 1, R - 1, hy - 1, n), Q(t, L + 1, L + 3, hy, l);
        if (side) Q(t, cx + 1, R + 3, hy + 2, s);
        else if (!back) Q(t, L + 1, R - 1, hy + 2, s), Q(t, L + 2, R - 2, hy + 3, s);
        else Q(t, L, R, hy + 2, s);
        break;
      case "horned":
        b(t, L, hy, R - L + 1, 3, n), Q(t, L + 1, R - 1, hy - 1, n), Q(t, L, R, hy + 2, s), Te(t, cx, hy - 1, hy + 2, l);
        for (let d of [-1, 1]) {
          let hx = d < 0 ? L - 1 : R + 1;
          m(t, hx, hy + 1, "#f0ead8"), m(t, hx + d, hy, "#f0ead8"), m(t, hx + d, hy - 1, "#f0ead8"), m(t, hx + d, hy - 2, "#d8ceb0");
        }
        break;
      case "straw":
        Q(t, L - 3, R + 3, hy + 2, n), Q(t, L - 2, R + 2, hy + 1, n), b(t, L + 1, hy - 2, R - L - 1, 3, n), Q(t, L + 2, R - 2, hy - 3, n);
        Q(t, L + 1, R - 1, hy, s), Q(t, L - 3, R + 3, hy + 2, nt(n, -0.15)), Q(t, L + 2, L + 4, hy - 2, l);
        break;
      case "hood":
      case "scarf": {
        b(t, L - 1, hy, R - L + 3, 3, n), Q(t, L, R, hy - 1, n);
        if (back) b(t, L - 1, hy + 3, R - L + 3, 8, n), Te(t, cx, hy + 1, hy + 10, s), Q(t, L, R, hy + 11, s);
        else if (side) b(t, L - 1, hy + 3, 5, 8, n), Te(t, L + 3, hy + 3, hy + 9, s), b(t, L, hy + 9, 6, 2, n);
        else {
          Te(t, L - 1, hy + 3, hy + 9, n), Te(t, R + 1, hy + 3, hy + 9, n), Te(t, L, hy + 3, hy + 8, s), Te(t, R, hy + 3, hy + 8, s), Q(t, L, R, hy + 2, s);
          b(t, L, hy + 9, R - L + 1, 2, n);
        }
        if (hat === "scarf" && !back) side ? b(t, cx, hy + 6, 5, 3, s) : b(t, L + 1, hy + 6, R - L - 1, 3, s);
        Q(t, L + 1, L + 3, hy, l);
        break;
      }
      case "crown":
        Q(t, L + 1, R - 1, hy, n), Q(t, L + 1, R - 1, hy - 1, n);
        for (let x = L + 1; x <= R - 1; x += 2) m(t, x, hy - 2, n);
        m(t, R - 1, hy - 2, n), back || b(t, cx - 1, hy - 1, 2, 2, "#c8423b"), Q(t, L + 1, R - 1, hy, nt(n, -0.2));
        break;
      case "tiara":
        back || (Q(t, L + 2, R - 2, hy + 1, n), b(t, side ? R - 2 : cx - 1, hy, 2, 1, "#8ad0ff"), m(t, side ? R - 2 : cx, hy - 1, n));
        break;
      case "feather": {
        Q(t, L, R, hy + 2, n), Q(t, L, R, hy + 1, s);
        let fx = back ? L + 2 : R - 2;
        for (let d = 0; d < 6; d++) m(t, fx + (d > 3 ? 1 : 0), hy - d, d % 2 ? "#f4f0e0" : "#d8d0c0");
        m(t, fx + 1, hy - 5, n), m(t, fx + 1, hy - 6, n), m(t, fx, hy - 6, "#f4f0e0");
        break;
      }
      case "headwrap":
        b(t, L, hy, R - L + 1, 3, n), Q(t, L + 1, R - 1, hy - 1, n), Q(t, L, R, hy + 2, s), Q(t, L + 1, L + 3, hy, l);
        b(t, back ? cx - 1 : R - 2, hy - 2, 2, 1, n), m(t, back ? cx : R - 1, hy - 3, s);
        break;
      case "fez":
        b(t, cx - 3, hy - 3, 6, 4, n), Q(t, cx - 3, cx + 2, hy - 3, l), Te(t, cx + 2, hy - 2, hy, s);
        Te(t, back ? cx - 4 : cx + 3, hy - 3, hy, "#1a1a1a"), m(t, cx, hy - 4, "#1a1a1a");
        break;
      case "chef":
        b(t, L, hy - 5, R - L + 1, 4, n), Q(t, L + 1, R - 1, hy - 6, n), b(t, L + 1, hy - 1, R - L - 1, 3, n), Q(t, L + 1, R - 1, hy + 1, "#d8d8d8");
        m(t, L + 2, hy - 2, "#d8d8d8"), m(t, cx, hy - 2, "#d8d8d8"), m(t, R - 2, hy - 2, "#d8d8d8"), Te(t, R, hy - 4, hy - 2, "#e0e0e0");
        break;
      case "beret":
        b(t, L, hy, R - L + 2, 2, n), Q(t, L + 1, R + 1, hy - 1, n), Q(t, L + 3, R, hy - 2, n), m(t, cx, hy - 3, s), Q(t, L, R, hy + 2, s), Q(t, L + 2, L + 4, hy - 1, l);
        break;
      case "sunhalo":
        for (let d = 0; d < 9; d++) {
          let a = Math.PI + (d / 8) * Math.PI;
          m(t, cx - 0.5 + Math.cos(a) * 8, hy + 4 + Math.sin(a) * 8, d % 2 ? n : "#fff0a0");
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
        f ? (b(t, r, n - 3, 1, 3, s), b(t, r - 1, n - 5, 4, 2, o)) : (b(t, r, n - 1, 3, 1, s), b(t, r + 3, n - 2, 2, 4, o), m(t, r + 5, n + 2, "#fff0a0"));
        break;
      case "stir":
        b(t, r, n, 1, 6, s), b(t, r - 2, n + 6, 5, 3, "#5d6470"), Q(t, r - 2, r + 2, n + 6, "#9aa1a8"), m(t, r - 1 + (a % 3), n - 2 - f, "rgba(240,240,240,0.8)");
        break;
      case "map":
        b(t, r - 3, n - 3, 7, 5, "#e8d8a8"), Q(t, r - 3, r + 3, n + 1, "#b8a070"), m(t, r - 1 + f, n - 1, "#c8423b"), m(t, r + 1, n - 2, "#8a6a3a");
        break;
      case "spyglass":
        if (dir === "left" || dir === "right") b(t, cx + 4, hy + 4, 5 + f, 2, "#c8a040"), m(t, cx + 9 + f, hy + 4, "#8ad0f0");
        else if (dir === "up") b(t, r, n - 4, 2, 4 + f, "#c8a040");
        else b(t, cx + 1, hy + 3, 3, 3, "#c8a040"), m(t, cx + 2, hy + 4, "#8ad0f0");
        break;
      case "bag":
        b(t, r - 2, n + 1, 5, 4, "#2a2a2a"), b(t, r - 1, n, 3, 1, "#4a4a4a"), m(t, r, n + 2, "#c8423b"), m(t, r - 1 + f * 2, n + 3, "#c8423b");
        break;
      case "sharpen":
        ce(t, r, n, r + 3, n - 5, o), ce(t, r + 1, n, r + 4, n - 5, "#e8ecf0"), m(t, r, n + 1, s), f && m(t, r + 5, n - 6, "#fff0a0");
        break;
      case "spell":
        m(t, r - 2 + a, n - 3, "#c8a0ff"), m(t, r + 2 - a, n - 2, "#8b5bb5"), m(t, r, n - 5 + f, "#e8d0ff"), m(t, cx - 6 + a, ty - 5 - f, "#c8a0ff"), m(t, cx - 8, ty - 3 + f, "#e8d0ff");
        break;
      case "beads":
        for (let i = 0; i < 4; i++) m(t, r + ((i + a) % 2), n + 1 + i, i === a % 4 ? "#f2c14e" : "#c8423b");
        break;
      case "lantern":
        Te(t, r, n + 1, n + 2, "#2a2a2a"), b(t, r - 1, n + 3, 3, 4, "#3a2a1a"), b(t, r, n + 4, 1, 2, f ? "#fff0a0" : "#f2c14e"), H(t, r, n + 5, 3, "rgba(255,230,140,0.18)");
        break;
      case "fish":
        ce(t, r, n, r + 6, n - 9, s), Te(t, r + 6, n - 9, n + 4 + f, "rgba(235,235,235,0.85)"), m(t, r + 6, n + 5 + f, "#c8423b");
        break;
      case "bow":
        Te(t, r + 2, n - 5, n + 5, s), m(t, r + 1, n - 6, s), m(t, r + 1, n + 6, s), Te(t, r, n - 5, n + 5, "rgba(232,224,200,0.7)"), Q(t, r - 2 - f, r + 3, n, "#e8e0c8");
        break;
      case "guard":
        Te(t, r, n - 8 + f, n - 1, o), Te(t, r + 1, n - 7 + f, n - 1, "#e8ecf0"), Q(t, r - 1, r + 2, n, "#c8a040"), m(t, r, n + 1, "#2a2a2a");
        break;
      case "spear":
        Te(t, r, n - 12, 28, s), b(t, r, n - 15, 1, 3, o), m(t, r - 1, n - 13, o), m(t, r + 1, n - 13, o);
        break;
      case "twinblades":
        ce(t, r - 1, n, r + 3, n - 5 + f, o), ce(t, cx - 6, n + f, cx - 9, n - 5, o), m(t, r, n + 1, s);
        break;
      case "polish":
        b(t, r - 1, n, 3, 2, "#e8e0c8"), m(t, r + f, n + 2, "#2a2a2e"), f && m(t, r + 3, n - 1, "#ffffff");
        break;
      case "count":
        b(t, r - 2, n - 1, 6, 5, s), b(t, r - 1, n, 4, 3, "#e8d8a8"), m(t, r - 1 + (a % 3), n, "#e07b39"), m(t, r + 1 - (a % 2), n + 2, "#c8423b");
        break;
      case "inspect":
        b(t, r - 1, n - 4 + f, 3, 3, "rgba(160,220,255,0.85)"), m(t, r, n - 3 + f, "#ffffff"), Te(t, r, n - 1 + f, n, s);
        break;
      case "staff":
        Te(t, r, n - 10, 28, s), b(t, r - 1, n - 13, 3, 3, f ? "#fff0a0" : "#e8b83a"), f && H(t, r, n - 12, 3, "rgba(255,240,160,0.25)");
        break;
      case "scroll":
        b(t, r - 2, n - 2, 5, 5, "#f0e6c8"), Q(t, r - 2, r + 2, n - 2, "#c8b890"), Q(t, r - 1, r + 1, n + f, "#8a7a5a");
        break;
      case "swagger":
        b(t, r, n - 4 - f, 2, 4, "#3a7a3a"), m(t, r, n - 5 - f, "#c8a060");
        break;
      case "fan":
        Q(t, r - 2, r + 2, n - 2 - f, "#e8c45a"), Q(t, r - 1, r + 1, n - 1 - f, "#b8323e"), m(t, r, n - f, "#e8c45a"), m(t, r - 3, n - 1 - f, "#b8323e"), m(t, r + 3, n - 1 - f, "#b8323e");
        break;
      case "sunglow":
        f && (m(t, cx - 7, hy - 1, "#ffe080"), m(t, cx + 7, hy - 1, "#ffe080"), m(t, cx, hy - 5, "#ffe080"), m(t, cx - 5, hy - 4, "#fff6c0"), m(t, cx + 5, hy - 4, "#fff6c0"));
        break;
      case "pray":
        f && (m(t, r, n - 3, "#fff6c0"), m(t, r - 1, n - 5, "#fff6c0"));
        break;
      case "sniff":
        m(t, r + 1, n - 2 - f, "#e07b39"), m(t, r - 1, n - 3, "#e8c45a");
        break;
      case "whisper":
        b(t, r - 1, n - 1, 4, 3, "#f0e6c8"), m(t, r + 2 - f, n - 2, "#3a3a44");
        break;
      case "wetfinger":
      case "windsense":
        m(t, r, n - 1 - f, L.skin), f && (m(t, r + 3, n - 3, "#bfe3ef"), m(t, r + 5, n - 4, "#bfe3ef"));
        break;
      default:
        break;
    }
  }
