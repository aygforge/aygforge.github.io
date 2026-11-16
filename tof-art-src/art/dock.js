  N.dockCat = (t, e, a, r) => dS(t, pa("PET_ZIPIR", "left", Math.sin(r * 1.3) > 0.8 ? "wag1" : "sit"), e + 8, a + 3);
  N.dockDog = (t, e, a, r) => dS(t, pa("PET_TARCIN", "left", Math.sin(r * 5) > 0 ? "wag1" : "wag0"), e - 9, a + 2);
  N.rocksOnly = (t, e, a) => {
    rock(t, Math.round(e), Math.round(a + 2), 12, "#62626c");
  };
