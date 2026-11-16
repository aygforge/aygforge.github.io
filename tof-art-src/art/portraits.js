  // Portreler: oyun içi 3/4 sprite'lardan üretilir (önden görünüm)
  function kt(t, e = 4) {
    let a = t + e;
    if (Jt.has(a)) return Jt.get(a);
    let r = Ro(t, "down", "idle", 0),
      n = Qe(xi * e, wi * e),
      i = n.getContext("2d");
    (i.imageSmoothingEnabled = !1), i.drawImage(r, 5, 4, 16, 20, 0, 0, xi * e, wi * e);
    let s = n.toDataURL ? n.toDataURL() : "";
    return Jt.set(a, s), s;
  }
  function Qa(t, e = 4) {
    let a = "p" + t + e;
    if (Jt.has(a)) return Jt.get(a);
    let bird = t === "PET_KIRMIZI" || t === "PET_GECEYARISI",
      n = pa(t, bird || t === "PET_MARTI" ? "right" : t === "PET_KAPLUMBAGA" || t === "PET_GELINCIK" ? "right" : "down", bird ? "perch" : t === "PET_GELINCIK" || t === "PET_KAPLUMBAGA" ? "walk0" : "sit"),
      i = Qe(21 * e, 18 * e),
      s = i.getContext("2d");
    (s.imageSmoothingEnabled = !1), s.drawImage(n, 3, 5, 21, 18, 0, 0, 21 * e, 18 * e);
    let o = i.toDataURL ? i.toDataURL() : "";
    return Jt.set(a, o), o;
  }
