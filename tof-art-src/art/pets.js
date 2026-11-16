  // ===== 3/4 bakış: hayvanlar =====
  // Tuval 26x26, zemin satırı 21 (ayak tabanı), merkez sütun 13. "side" = sağa bakar (sol için aynalanır).
  var PETW = 26,
    PETH = 26,
    PETAX = 13,
    PETAY = 22;
  function pa(t, e = "down", a = "idle") {
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
      ve(t, 12, 18, 6, 3, A), Q(t, 8, 15, 21, D), Q(t, 7, 9, 16, D), m(t, 6, 18, D), m(t, 6, 19, D), m(t, 7, 20, D);
      b(t, 14, 15, 5, 4, A), m(t, 14, 14, D), m(t, 18, 14, D), Q(t, 15, 16, 17, E), m(t, 18, 18, P), Q(t, 10, 12, 16, D), m(t, 11, 18, Lt);
      return;
    }
    if (v === "side") {
      if (sit) {
        b(t, 7, 15, 8, 6, A), b(t, 10, 11, 5, 5, A), Te(t, 14, 13, 19, Lt), b(t, 13, 20, 3, 2, Lt), Q(t, 8, 9, 16, D), Q(t, 8, 10, 18, D);
        let tw = e === "wag1" ? -1 : 0;
        Q(t, 3, 7, 21, D), m(t, 3, 20 + tw, D), m(t, 2, 19 + tw, A);
        b(t, 11, 6, 6, 5, A), b(t, 12, 5, 4, 1, A), m(t, 11, 5, D), m(t, 11, 4, D), m(t, 15, 5, D), m(t, 15, 4, D);
        m(t, 15, 8, E), m(t, 17, 9, P), m(t, 16, 10, Lt), m(t, 17, 10, Lt);
        e === "bark" && (m(t, 17, 11, "#c8424a"), m(t, 19, 6, "#fff"), m(t, 20, 5, "#fff"));
        e === "alert" && (m(t, 9, 14, D), m(t, 8, 14, D), m(t, 2, 18, D));
        (e === "beg" || e === "hold") && (b(t, 15, 13, 2, 2, Lt), e === "hold" && b(t, 16, 12, 2, 2, "#f2c14e"));
        return;
      }
      let d = walk ? [0, 1, 0, -1][l] : 0;
      b(t, 6, 14, 10, 5, A), Q(t, 8, 13, 18, Lt), m(t, 8, 14, D), m(t, 10, 14, D), m(t, 12, 14, D), m(t, 9, 15, D), m(t, 11, 15, D);
      b(t, 14, 10, 6, 5, A), m(t, 15, 9, D), m(t, 15, 8, D), m(t, 18, 9, D), m(t, 18, 8, D), m(t, 17, 12, E), m(t, 20, 12, P), Q(t, 18, 19, 13, Lt);
      m(t, 5, 13, D), m(t, 4, 12, A), m(t, 4, 11, D), m(t, 4, 10, A), m(t, 5, 9, D);
      b(t, 7 + d, 19, 2, 2, D), m(t, 7 + d, 21, Lt), b(t, 9 - d, 19, 2, 2, A), m(t, 10 - d, 21, Lt);
      b(t, 13 + d, 19, 2, 2, D), m(t, 14 + d, 21, Lt), b(t, 15 - d, 19, 2, 2, A), m(t, 16 - d, 21, Lt);
      return;
    }
    let back = v === "back",
      up = sit ? 0 : -1,
      d = walk ? [0, 1, 0, -1][l] : 0;
    // gövde
    if (sit) {
      b(t, 10, 13, 6, 8, A), b(t, 9, 17, 8, 4, A);
      back ? (Q(t, 11, 14, 15, D), Q(t, 11, 14, 17, D), Q(t, 12, 13, 19, D)) : (b(t, 12, 14, 2, 6, Lt), b(t, 10, 21, 2, 1, Lt), b(t, 14, 21, 2, 1, Lt));
    } else {
      b(t, 10, 13, 6, 6, A);
      back ? (Q(t, 11, 14, 14, D), Q(t, 11, 14, 16, D)) : b(t, 12, 14, 2, 4, Lt);
      b(t, 10, 19, 2, d > 0 ? 1 : 2, D), b(t, 14, 19, 2, d < 0 ? 1 : 2, D), m(t, 10, d > 0 ? 20 : 21, Lt), m(t, 11, d > 0 ? 20 : 21, Lt), m(t, 14, d < 0 ? 20 : 21, Lt), m(t, 15, d < 0 ? 20 : 21, Lt);
    }
    // kuyruk
    if (back) {
      if (sit) Te(t, 13, 19, 21, D), m(t, 14, 21, D), m(t, 15, 20, D), m(t, 16, 20, A);
      else Te(t, 12, 9, 14, D), m(t, 13, 8, D), m(t, 13, 7, A);
    } else {
      let tw = e === "wag1" ? 1 : 0;
      sit ? (Te(t, 17, 18, 21, D), m(t, 18, 18 - tw, D), m(t, 18, 17 - tw, A)) : (m(t, 16, 14, D), m(t, 17, 13, D), m(t, 18, 12, A), m(t, 18, 11, D));
    }
    // baş
    let hy = 7 + up;
    b(t, 9, hy + 1, 8, 4, A), b(t, 10, hy, 6, 1, A), b(t, 10, hy + 5, 6, 1, A);
    b(t, 9, hy - 2, 2, 2, D), b(t, 15, hy - 2, 2, 2, D);
    m(t, 9, hy - 3, D), m(t, 16, hy - 3, D), m(t, 10, hy - 1, P), m(t, 15, hy - 1, P);
    if (back) Q(t, 11, 14, hy + 1, D), Q(t, 12, 13, hy + 3, D);
    else {
      m(t, 11, hy + 2, E), m(t, 14, hy + 2, E), Q(t, 11, 14, hy + 4, Lt), Q(t, 12, 13, hy + 3, P), m(t, 8, hy + 3, Lt), m(t, 17, hy + 3, Lt), Q(t, 12, 13, hy, D);
      e === "bark" && (Q(t, 12, 13, hy + 5, "#c8424a"), m(t, 18, hy - 1, "#fff"), m(t, 19, hy - 2, "#fff"));
      (e === "beg" || e === "hold") && (b(t, 10, 14, 2, 2, Lt), b(t, 14, 14, 2, 2, Lt), e === "hold" && b(t, 12, 14, 2, 2, "#f2c14e"));
      e === "alert" && (m(t, 11, hy + 1, "#fff"), m(t, 14, hy + 1, "#fff"));
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
      ve(t, 11, 18, 7, 3, a.B), Q(t, 6, 15, 16, a.G), b(t, 14, 15, 6, 5, a.B), b(t, 18, 18, 4, 2, a.W), m(t, 21, 18, a.nose), Q(t, 16, 17, 17, a.H), b(t, 14, 14, 2, 2, a.B);
      Q(t, 3, 6, 21, a.B), m(t, 3, 20, a.W), Q(t, 13, 15, 20, a.blue), b(t, 10, 20, 3, 1, a.W), m(t, 19, 15, a.W);
      return;
    }
    if (v === "side") return dogSide(t, e, l, { run, walk, sniff, play, sitp, ears, mouth });
    return dogFB(t, e, l, v === "back", { run, walk, sniff, play, sitp, ears, mouth });
  }
  function dogHeadSide(t, hx, hy, ears, mouth, o = {}) {
    let a = xa;
    b(t, hx, hy + 1, 6, 5, a.B), b(t, hx + 1, hy, 4, 1, a.B), b(t, hx + 4, hy + 3, 4, 3, a.W), m(t, hx + 7, hy + 3, a.nose), m(t, hx + 4, hy + 1, a.W), m(t, hx + 4, hy + 2, a.W);
    m(t, hx + 3, hy + 2, a.eye), m(t, hx + 1, hy + 5, a.G);
    ears === "up"
      ? (b(t, hx + 1, hy - 3, 2, 3, a.B), m(t, hx + 2, hy - 2, a.ear))
      : ears === "back"
        ? (b(t, hx - 2, hy + 1, 3, 2, a.B), m(t, hx - 3, hy + 2, a.G))
        : ears === "flop"
          ? (b(t, hx, hy + 1, 2, 4, a.G), m(t, hx, hy + 5, a.B))
          : (b(t, hx + 1, hy - 2, 2, 2, a.B), m(t, hx, hy - 1, a.B), m(t, hx, hy, a.G));
    mouth && (Q(t, hx + 5, hx + 6, hy + 6, a.tongue), m(t, hx + 4, hy + 6, a.nose));
  }
  function dogSide(t, e, l, f) {
    let a = xa;
    if (f.sitp) {
      // oturuyor
      b(t, 6, 14, 8, 7, a.B), b(t, 11, 10, 5, 10, a.B), b(t, 14, 12, 2, 7, a.W), m(t, 13, 13, a.w), Q(t, 7, 10, 15, a.G);
      b(t, 10, 21, 5, 1, a.W), e === "beg" ? (b(t, 15, 12, 3, 2, a.W), m(t, 17, 11, a.W)) : (b(t, 14, 19, 2, 3, a.W), m(t, 15, 21, a.w));
      let wg = e === "wag0" ? 0 : e === "wag1" || e === "bark" ? 1 : 0;
      wg ? (Q(t, 3, 5, 20, a.B), m(t, 2, 19, a.B), m(t, 2, 18, a.W)) : (Q(t, 2, 5, 21, a.B), m(t, 1, 21, a.W), m(t, 1, 20, a.W));
      let hu = e === "bark" ? -1 : 0;
      dogHeadSide(t, 12, 4 + hu, f.ears, f.mouth), Q(t, 12, 15, 10, a.blue), Q(t, 12, 14, 11, a.blueD), m(t, 15, 11, a.tag);
      e === "bark" && (m(t, 22, 3, "#fff"), m(t, 23, 5, "#fff"), m(t, 22, 7, "#fff"));
      return;
    }
    if (f.play) {
      // oyun selamı: ön alçak, arka yüksek
      b(t, 5, 10, 7, 6, a.B), b(t, 10, 13, 7, 5, a.B), b(t, 6, 16, 2, 5, a.B), b(t, 9, 16, 2, 5, a.G), b(t, 6, 20, 2, 2, a.W), b(t, 9, 20, 2, 2, a.W);
      Q(t, 14, 19, 20, a.B), Q(t, 19, 21, 21, a.W), Q(t, 15, 18, 21, a.B), m(t, 15, 17, a.W), m(t, 16, 17, a.W);
      let tw = l % 2;
      m(t, 4, 9, a.B), m(t, 3 + tw, 8, a.B), m(t, 3 + tw * 2, 7, a.B), m(t, 3 + tw * 2, 6, a.W);
      dogHeadSide(t, 15, 10, "semi", !0), Q(t, 14, 15, 15, a.blue);
      return;
    }
    let by = f.run && l % 2 ? -1 : 0,
      d = f.walk || f.sniff ? [0, 1, 0, -1][l % 4] : 0,
      Y = 12 + by;
    // kuyruk
    if (f.run) Q(t, 1, 4, Y + 1, a.B), m(t, 0, Y + 1, a.W), m(t, 1, Y, a.W);
    else {
      let tw = e === "idle1" || (f.walk && l % 2) ? 1 : 0;
      m(t, 4, Y, a.B), m(t, 3, Y - 1, a.B), m(t, 3 - tw, Y - 2, a.B), m(t, 3 - tw, Y - 3, a.W), m(t, 4 - tw, Y - 4, a.W);
    }
    // bacaklar
    if (f.run) {
      if (l % 2 === 0) {
        b(t, 15, Y + 5, 3, 2, a.B), b(t, 17, Y + 6, 3, 2, a.B), b(t, 19, Y + 7, 3, 1, a.W);
        b(t, 4, Y + 5, 3, 2, a.B), b(t, 2, Y + 6, 3, 2, a.B), b(t, 1, Y + 7, 2, 1, a.W);
      } else b(t, 12, Y + 6, 2, 3, a.B), b(t, 11, Y + 9, 2, 1, a.W), b(t, 8, Y + 6, 2, 3, a.G), b(t, 9, Y + 9, 2, 1, a.W);
    } else {
      b(t, 8 - d, 18, 2, 2, a.G), b(t, 8 - d, 20, 2, 2, a.w), b(t, 13 - d, 18, 2, 2, a.G), b(t, 13 - d, 20, 2, 2, a.w);
      b(t, 6 + d, 18, 2, 2, a.B), b(t, 6 + d, 20, 2, 2, a.W), b(t, 15 + d, 18, 2, 2, a.B), b(t, 15 + d, 20, 2, 2, a.W);
    }
    // gövde
    b(t, 5, Y, 12, 6, a.B), Q(t, 6, 15, Y - 1, a.B), Q(t, 7, 13, Y + 1, a.G), b(t, 15, Y + 2, 2, 4, a.W), Q(t, 9, 14, Y + 5, a.G);
    // baş + tasma
    if (f.sniff) {
      let hx = 15 + (l % 2);
      b(t, 14, Y + 1, 4, 4, a.B), dogHeadSide(t, hx, Y + 4, "flop", !1), Te(t, 14, Y + 2, Y + 5, a.blue);
      l % 2 && (m(t, hx + 9, Y + 6, "rgba(230,230,230,0.7)"), m(t, hx + 9, Y + 4, "rgba(230,230,230,0.7)"));
    } else {
      let hd = e === "idle1" ? 1 : 0;
      b(t, 14, Y - 2 + hd, 4, 4, a.B), dogHeadSide(t, 15, Y - 6 + hd, f.ears, f.mouth), Te(t, 15, Y - 1 + hd, Y + 1 + hd, a.blue), m(t, 16, Y + 1 + hd, a.tag), m(t, 14, Y + hd, a.blueD);
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
      if (sit) Q(t, 13, 13 + tw * 4, 21, a.B), m(t, 13 + tw * 5, 20, a.W), m(t, 13 + tw * 4, 20, a.B);
      else Te(t, 13 + (tw > 0 ? 1 : 0), Y - 3, Y + 2, a.B), m(t, 13 + tw, Y - 4, a.W), m(t, 13 + tw, Y - 5, a.W);
    } else {
      let sx = tw > 0 ? 17 : 8,
        dx = tw > 0 ? 1 : -1;
      m(t, sx, Y + 1, a.B), m(t, sx + dx, Y, a.B), m(t, sx + dx, Y - 1, a.B), m(t, sx + dx * 2, Y - 2, a.W);
    }
    // gövde & bacaklar
    if (sit) {
      b(t, 9, 12, 8, 8, a.B), b(t, 8, 16, 10, 5, a.B), m(t, 8, 21, a.W), m(t, 17, 21, a.W);
      if (!back) {
        b(t, 11, 13, 4, 7, a.W), m(t, 12, 15, a.w), m(t, 13, 17, a.w);
        e === "beg" ? (b(t, 10, 14, 2, 2, a.W), b(t, 14, 14, 2, 2, a.W), m(t, 10, 13, a.W), m(t, 15, 13, a.W)) : (b(t, 10, 20, 2, 2, a.W), b(t, 14, 20, 2, 2, a.W), m(t, 12, 21, a.G));
      } else Te(t, 12, 13, 19, a.G), Te(t, 13, 13, 19, a.G), Q(t, 9, 16, 20, a.G);
    } else {
      b(t, 9, Y, 8, 7, a.B), back ? (Te(t, 12, Y + 1, Y + 5, a.G), Te(t, 13, Y + 1, Y + 5, a.G)) : (b(t, 11, Y + 1, 4, 6, a.W), m(t, 12, Y + 3, a.w));
      let ll = d > 0 ? 1 : 0,
        rl = d < 0 ? 1 : 0;
      b(t, 9, 18, 2, 2 - ll, a.B), b(t, 9, 20 - ll, 2, 2, a.W), b(t, 15, 18, 2, 2 - rl, a.B), b(t, 15, 20 - rl, 2, 2, a.W);
      play && !back && (b(t, 7, 20, 3, 2, a.W), b(t, 16, 20, 3, 2, a.W));
    }
    // baş
    let hy = (sit ? 4 : 5) + by + (f.sniff ? 5 : 0) + (play && !back ? 3 : 0) + (e === "idle1" ? 1 : 0) + (e === "bark" ? -1 : 0),
      hx = 8 + (f.sniff ? (l % 2 ? 1 : -1) : 0);
    // kulaklar
    for (let o of [0, 1]) {
      let ex = o ? hx + 8 : hx;
      f.ears === "up"
        ? (b(t, ex, hy - 3, 2, 4, a.B), back || m(t, ex + (o ? 0 : 1), hy - 1, a.ear))
        : f.ears === "back" || f.ears === "flop"
          ? (b(t, ex + (o ? 1 : -1), hy + 1, 2, 4, a.B), m(t, ex + (o ? 2 : -1), hy + 5, a.G))
          : (b(t, ex, hy - 2, 2, 3, a.B), m(t, ex + (o ? 1 : 0), hy - 2, a.G), m(t, ex + (o ? 2 : -1), hy - 1, a.B));
    }
    b(t, hx, hy + 1, 10, 5, a.B), b(t, hx + 1, hy, 8, 1, a.B), b(t, hx + 1, hy + 6, 8, 1, a.B);
    if (back) Q(t, hx + 3, hx + 6, hy + 2, a.G), Q(t, hx + 1, hx + 8, hy + 7, a.blue), Q(t, hx + 2, hx + 7, hy + 8, a.blueD);
    else {
      b(t, hx + 4, hy, 2, 4, a.W), b(t, hx + 3, hy + 4, 4, 3, a.W), Q(t, hx + 4, hx + 5, hy + 4, a.nose), m(t, hx + 2, hy + 3, a.eye), m(t, hx + 7, hy + 3, a.eye);
      m(t, hx + 3, hy + 6, a.w), m(t, hx + 6, hy + 6, a.w);
      Q(t, hx + 1, hx + 8, hy + 7, a.blue), Q(t, hx + 2, hx + 7, hy + 8, a.blueD), m(t, hx + 5, hy + 8, a.tag);
      f.mouth && (Q(t, hx + 4, hx + 5, hy + 7, a.tongue), m(t, hx + 4, hy + 6, a.nose), m(t, hx + 5, hy + 6, a.nose));
      e === "bark" && (m(t, hx + 12, hy - 1, "#fff"), m(t, hx + 13, hy + 1, "#fff"), m(t, hx - 3, hy - 1, "#fff"), m(t, hx - 4, hy + 1, "#fff"));
      f.sniff && l % 2 && (m(t, hx + 1, hy + 9, "rgba(230,230,230,0.7)"), m(t, hx + 8, hy + 9, "rgba(230,230,230,0.7)"));
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
        b(t, 8, 11, 9, 4, a), Q(t, 9, 15, 14, aS), b(t, 15, 9, 4, 4, a), m(t, 17, 10, face), m(t, 17, 10, E), b(t, 19, 10, 2, 2, bk), m(t, 20, 12, "#b88a20");
        Q(t, 4, 8, 13, n), Q(t, 2, 6, 14, r), Q(t, 1, 4, 15, n);
        if (o) for (let i = 0; i < 6; i++) Q(t, 9 + i * 0.5, 14 - i * 0.3, 10 - i, i < 4 ? n : nS);
        else for (let i = 0; i < 5; i++) Q(t, 9 + i * 0.5, 14 - i * 0.4, 14 + i, i < 3 ? n : nS);
        return;
      }
      b(t, 11, 9, 4, 8, a), b(t, 11, 6, 4, 4, a), v === "back" ? Q(t, 11, 14, 11, aS) : (m(t, 11, 7, E), m(t, 14, 7, E), b(t, 12, 8, 2, 2, bk));
      for (let i = 1; i <= 8; i++) {
        let d = 10 + (o ? -Math.round(i * 0.6) : Math.round(i * 0.45));
        b(t, 11 - i, d, 1, i < 3 ? 4 : 3, i > 6 ? nS : n), b(t, 14 + i, d, 1, i < 3 ? 4 : 3, i > 6 ? nS : n), i % 3 === 0 && (m(t, 11 - i, d + 3, r), m(t, 14 + i, d + 3, r));
      }
      b(t, 12, 17, 2, 3, n), Q(t, 11, 14, 17, r);
      return;
    }
    let fl = e === "fluff" ? 1 : 0;
    if (v === "side") {
      b(t, 10, 11, 5 + fl, 8, a), b(t, 10 - fl, 13, 3 + fl, 5, n), Te(t, 10 - fl, 14, 17, nS), b(t, 11, 6, 5, 5, a), Q(t, 12, 14, 5, a);
      m(t, 14, 8, face), m(t, 13, 8, face), m(t, 14, 8, E), b(t, 16, 8, 2, 2, bk), m(t, 17, 10, "#b88a20"), m(t, 16, 10, bk);
      m(t, 9, 18, n), m(t, 8, 19, n), m(t, 7, 20, r), m(t, 6, 21, n), m(t, 9, 19, r), m(t, 8, 20, n), m(t, 7, 21, n);
      m(t, 12, 19, "#6a6a6a"), m(t, 14, 19, "#6a6a6a");
      fl && (m(t, 9, 12, a), m(t, 16, 13, a), m(t, 12, 4, a));
      return;
    }
    let back = v === "back";
    b(t, 10 - fl, 11, 6 + fl * 2, 8, back ? n : a), Q(t, 11, 14, 19, back ? n : a);
    if (back) Te(t, 12, 12, 18, nS), Te(t, 13, 12, 18, nS), Q(t, 10, 15, 11, a), m(t, 10, 15, r), m(t, 15, 15, r);
    else Te(t, 10 - fl, 12, 17, n), Te(t, 15 + fl, 12, 17, n), Q(t, 12, 13, 16, r), Q(t, 12, 13, 14, aS);
    b(t, 10, 6, 6, 5, a), Q(t, 11, 14, 5, a), m(t, 12, 4, a);
    back ? Q(t, 11, 14, 8, aS) : (Q(t, 10, 11, 8, face), Q(t, 14, 15, 8, face), m(t, 11, 8, E), m(t, 14, 8, E), b(t, 12, 9, 2, 2, bk), Q(t, 12, 13, 11, "#b88a20"));
    b(t, 12, 20, 2, 2, n), Q(t, 11, 14, 20, r), m(t, 11, 20, "#6a6a6a"), m(t, 14, 20, "#6a6a6a");
    fl && (m(t, 8, 13, a), m(t, 17, 13, a), m(t, 9, 10, a), m(t, 16, 10, a), m(t, 13, 3, a));
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
      ve(t, 12, 18, 6, 3, a), b(t, 14, 14, 5, 5, a), b(t, 15, 16, 3, 2, tan), Q(t, 15, 17, 17, E), Q(t, 13, 19, 13, n), Q(t, 5, 8, 21, r);
      return;
    }
    if (v === "side") {
      m(t, 8, 17, r), m(t, 7, 16, r), m(t, 6, 15, r), m(t, 6, 14, r), m(t, 6, 13, r), m(t, 7, 12, r), m(t, 8, 12, r);
      b(t, 9, 13, 6, 6, a), Te(t, 9, 14, 18, aS), b(t, 10 + d, 19, 2, 2, aS), m(t, 11 + d, 21, tan), b(t, 12 - d, 19, 2, 2, a), Q(t, 12 - d, 14 - d, 21, tan);
      hold ? (b(t, 13, 13, 3, 2, a), b(t, 16, 11, 3, 3, "#f2c14e"), m(t, 16, 14, tan)) : (b(t, 12, 14, 2, 3, aS), m(t, 13 + d, 17, tan));
      b(t, 11, 6, 7, 7, a), b(t, 14, 8, 4, 4, tan), m(t, 16, 9, E), m(t, 18, 10, tan), Q(t, 16, 17, 11, "#a8704a"), m(t, 11, 9, tan);
      Q(t, 9, 19, 6, n), b(t, 11, 4, 6, 2, n), m(t, 15, 5, "#e8e0c0");
      return;
    }
    let back = v === "back";
    // kuyruk
    back
      ? (Te(t, 13, 17, 20, r), m(t, 14, 21, r), m(t, 15, 21, r), m(t, 16, 20, r))
      : (m(t, 16, 17, r), m(t, 17, 16, r), m(t, 18, 15, r), m(t, 18, 14, r), m(t, 17, 13, r));
    b(t, 10, 13, 6, 6, a), back ? Te(t, 13, 14, 17, aS) : b(t, 12, 14, 2, 4, "#c89a6a");
    b(t, 10, 19, 2, d > 0 ? 1 : 2, a), b(t, 14, 19, 2, d < 0 ? 1 : 2, a), Q(t, 9, 11, d > 0 ? 20 : 21, tan), Q(t, 14, 16, d < 0 ? 20 : 21, tan);
    if (hold && !back) b(t, 9, 12, 2, 3, a), b(t, 15, 12, 2, 3, a), b(t, 11, 13, 4, 3, "#f2c14e"), m(t, 12, 14, "#fff6c0");
    else Te(t, 9, 13 + Math.max(0, d), 17, aS), Te(t, 16, 13 + Math.max(0, -d), 17, aS), m(t, 9, 18, tan), m(t, 16, 18, tan);
    b(t, 9, 6, 8, 7, a), m(t, 8, 9, tan), m(t, 17, 9, tan);
    back || (b(t, 10, 8, 6, 4, tan), m(t, 11, 9, E), m(t, 14, 9, E), Q(t, 12, 13, 11, "#a8704a"), Q(t, 11, 14, 7, a));
    Q(t, 7, 18, 6, n), b(t, 10, 4, 6, 2, n), m(t, 7, 5, n), m(t, 18, 5, n), back || Q(t, 12, 13, 5, "#e8e0c0");
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
        b(t, 8, 12, 9, 3, a), Q(t, 9, 15, 14, aS), b(t, 15, 10, 4, 4, a), m(t, 17, 11, E), Q(t, 19, 20, 12, o), Q(t, 4, 8, 13, r), Q(t, 3, 5, 12, n);
        if (l) for (let i = 0; i < 5; i++) Q(t, 9 + i * 0.6, 14 - i * 0.3, 15 + i, i < 3 ? r : n);
        else for (let i = 0; i < 6; i++) Q(t, 9 + i * 0.6, 14 - i * 0.2, 11 - i, i < 4 ? r : n);
        return;
      }
      for (let i = 1; i <= 10; i++) {
        let d = 11 + (l ? Math.round(i * 0.35) : -Math.round(i * 0.3));
        b(t, 11 - i, d, 1, 2, i > 8 ? n : r), b(t, 14 + i, d, 1, 2, i > 8 ? n : r);
      }
      b(t, 11, 10, 4, 7, a), b(t, 11, 7, 4, 4, a), v === "back" ? Q(t, 11, 14, 12, aS) : (m(t, 11, 8, E), m(t, 14, 8, E), b(t, 12, 9, 2, 2, o)), Q(t, 12, 13, 17, r);
      return;
    }
    let fl = e === "fluff" || e === "alert" ? 1 : 0;
    if (v === "side") {
      b(t, 8, 13, 9, 5, a), b(t, 8, 13, 6, 3, r), Q(t, 5, 8, 14, n), Q(t, 6, 8, 15, r), b(t, 14, 9, 4, 4 + fl, a), m(t, 16, 10, E), Q(t, 18, 19, 11, o), m(t, 19, 12, "#c87820");
      Te(t, 11, 18, 20, o), Te(t, 13, 18, 20, o), Q(t, 13, 14, 21, o), Q(t, 11, 12, 21, o), Q(t, 10, 15, 17, aS);
      return;
    }
    let back = v === "back";
    b(t, 10 - fl, 12, 6 + fl * 2, 7, back ? r : a), back ? (Te(t, 12, 13, 17, n), Te(t, 13, 13, 17, n), Q(t, 11, 14, 19, n)) : (Te(t, 10 - fl, 13, 17, r), Te(t, 15 + fl, 13, 17, r), Q(t, 11, 14, 18, aS));
    b(t, 11, 8 - fl, 4, 4 + fl, a), back || (m(t, 11, 9 - fl, E), m(t, 14, 9 - fl, E), b(t, 12, 10 - fl, 2, 2, o));
    Te(t, 11, 19, 20, o), Te(t, 14, 19, 20, o), Q(t, 10, 11, 21, o), Q(t, 14, 15, 21, o);
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
      if (!sl) b(t, 18, 14, 4, 4, n), m(t, 20, 15, "#202018"), m(t, 21, 17, nS), b(t, 7 + d, 19, 3, 2, n), b(t, 14 - d, 19, 3, 2, n), m(t, 7 + d, 21, nS), m(t, 16 - d, 21, nS), m(t, 4, 18, n);
      for (let y = 0; y < 8; y++) {
        let w = [3, 5, 6, 7, 7, 7, 7, 6][y];
        Q(t, 12 - w, 11 + w, 12 + y + (sl ? 1 : 0), y === 7 ? r : a);
      }
      Q(t, 8, 10, 13 + (sl ? 1 : 0), i), H(t, 9, 16, 1, r), H(t, 14, 16, 1, r), H(t, 12, 14, 1, r), m(t, 17, 17, r), m(t, 6, 17, r);
      return;
    }
    let back = v === "back";
    if (!sl) {
      b(t, 6, 18 + d, 3, 2, n), b(t, 17, 18 - d, 3, 2, n);
      back ? (m(t, 13, 21, n), b(t, 8, 12, 2, 2, nS), b(t, 16, 12, 2, 2, nS)) : (b(t, 11, 18, 4, 4, n), m(t, 11, 19, "#202018"), m(t, 14, 19, "#202018"), Q(t, 12, 13, 21, nS));
    }
    for (let y = 0; y < 9; y++) {
      let w = [3, 5, 6, 7, 7, 7, 6, 5, 3][y];
      Q(t, 13 - w, 12 + w, 10 + y + (sl ? 1 : 0), y > 6 ? r : a);
    }
    let o = sl ? 1 : 0;
    Q(t, 9, 11, 11 + o, i);
    for (let [p, f] of [
      [0, 0],
      [-4, -1],
      [4, -1],
      [-3, 3],
      [3, 3],
    ])
      H(t, 12.5 + p, 14 + f + o, 1, r);
    if (!sl && !back) b(t, 11, 17, 4, 4, n), m(t, 11, 18, "#202018"), m(t, 14, 18, "#202018"), Q(t, 12, 13, 20, nS);
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
      ve(t, 12, 18, 6, 3, a), Q(t, 8, 16, 21, aS), b(t, 13, 15, 5, 4, n), Q(t, 14, 17, 16, i), m(t, 18, 17, "#2a1a10"), Q(t, 5, 8, 20, r), m(t, 13, 14, r), m(t, 16, 14, r);
      return;
    }
    if (v === "side") {
      if (hold) {
        b(t, 9, 10, 4, 10, a), Te(t, 9, 11, 19, aS), b(t, 9, 20, 5, 2, r), Q(t, 3, 8, 21, r), b(t, 10, 5, 6, 5, n), Q(t, 12, 15, 7, i), m(t, 14, 7, "#101010"), m(t, 16, 8, "#2a1a10"), m(t, 10, 4, r);
        b(t, 13, 11, 3, 2, a), b(t, 16, 10, 3, 3, "#f2c14e");
        return;
      }
      Q(t, 1, 5, 16, r), m(t, 1, 15, r), b(t, 5, 15 - (d ? 1 : 0), 13, 3, a), Q(t, 7, 14, 14 - (d ? 1 : 0), a), Q(t, 6, 16, 18 - (d ? 1 : 0), aS);
      b(t, 17, 13, 5, 4, n), Q(t, 18, 20, 14, i), m(t, 20, 14, "#101010"), m(t, 22, 15, "#2a1a10"), m(t, 17, 12, r), m(t, 19, 12, r);
      b(t, 6 + d, 18, 2, 3, r), b(t, 9 - d, 18, 2, 3, r), b(t, 14 + d, 18, 2, 3, r), b(t, 17 - d, 18, 2, 3, r);
      return;
    }
    let back = v === "back",
      up = hold ? -3 : 0;
    back && (Te(t, 13, 19, 21, r), m(t, 14, 21, r), m(t, 15, 21, r));
    b(t, 11, 12 + up, 4, 8 - up, a), back ? Te(t, 13, 13 + up, 19, aS) : b(t, 12, 13 + up, 2, 6 - up, n);
    b(t, 10, 19 + (d > 0 ? -1 : 0), 2, 2, r), b(t, 14, 19 + (d < 0 ? -1 : 0), 2, 2, r);
    back || (m(t, 16, 19, r), m(t, 17, 18, r), m(t, 17, 17, r));
    b(t, 10, 7 + up, 6, 5, back ? a : n), m(t, 10, 6 + up, r), m(t, 15, 6 + up, r);
    back || (Q(t, 10, 15, 9 + up, i), m(t, 11, 9 + up, "#101010"), m(t, 14, 9 + up, "#101010"), Q(t, 12, 13, 11 + up, "#2a1a10"));
    hold && !back && (b(t, 11, 13 + up + 3, 4, 3, "#f2c14e"), m(t, 10, 14 + up + 3, n), m(t, 15, 14 + up + 3, n));
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
          m(t, x, y, q === 5 ? n : q % 2 ? r : a);
        }
        m(t, x0 + s * Math.round(5 * (0.5 + j * 0.45)) + s, 20 - (wv ? 1 : 0) - (j === 2 ? 1 : 0), n);
      }
    // baş
    b(t, 9, 8 + Y, 8, 7, a), b(t, 10, 7 + Y, 6, 1, a), b(t, 8, 10 + Y, 10, 4, a), Q(t, 10, 12, 8 + Y, n), m(t, 10, 9 + Y, n), Q(t, 9, 16, 14 + Y, r);
    if (e !== "sleep") {
      if (v === "front") b(t, 10, 11 + Y, 2, 2, "#fff"), b(t, 14, 11 + Y, 2, 2, "#fff"), m(t, 11, 12 + Y, "#101010"), m(t, 14, 12 + Y, "#101010");
      else if (v === "side") b(t, 14, 11 + Y, 2, 2, "#fff"), m(t, 15, 12 + Y, "#101010");
    } else v !== "back" && (Q(t, 10, 11, 12 + Y, r), Q(t, 14, 15, 12 + Y, r));
    if (tub) {
      b(t, 7, 14, 12, 7, "#8a5a2b"), Q(t, 7, 18, 14, "#5aa8d8"), Q(t, 8, 17, 13, "#bfe3ef"), Q(t, 7, 18, 16, "#3a2412"), Q(t, 7, 18, 19, "#3a2412"), Q(t, 8, 17, 21, "#5c3a1e");
      for (let x = 9; x < 18; x += 3) Te(t, x, 15, 20, "#6a4424");
      m(t, 7, 13, n), m(t, 6, 14, a), m(t, 18, 13, n), m(t, 19, 14, a), b(t, 9, 6 + Y + 2, 8, 6, a), b(t, 10, 7, 6, 1, a), Q(t, 10, 12, 8, n);
      v === "front"
        ? (b(t, 10, 10, 2, 2, "#fff"), b(t, 14, 10, 2, 2, "#fff"), m(t, 11, 11, "#101010"), m(t, 14, 11, "#101010"))
        : v === "side" && (b(t, 14, 10, 2, 2, "#fff"), m(t, 15, 11, "#101010"));
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
        m(t, 13 + x, 12 + y, "#1a1028");
  }
