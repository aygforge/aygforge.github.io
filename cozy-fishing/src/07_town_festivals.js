/* =====================================================================
   07_town_festivals.js : mevsim şenlikleri, balık tutma yarışması ve rakipler,
   fırın atıştırmalıkları, çay bahçesinin "günün balığı" alımı, yeni başarımlar/tetikleyiciler
   ===================================================================== */
World.festival = function (d) { d = d || S.day; const se = this.season(d), sd = this.seasonDay(d); return FESTIVALS.find(f => f.season === se && f.days.includes(sd)) || null; };
World.nextFestival = function () { for (let k = 0; k < 120; k++) { const f = this.festival(S.day + k); if (f) return { f, inDays: k }; } return null; };
const festKey = (f, d) => f.id + ':' + World.year(d || S.day);
const RIVAL = Object.fromEntries(RIVALS.map(r => [r.id, r]));

const Comp = {
  active() { return S.comp && !S.comp.done ? S.comp : null; },
  entered(f) { return !!(f && S.fest[festKey(f)]); },
  prizes(year) { return COMP.prizes.map(p => roundHalfUp(p * (1 + COMP.prize_growth_per_year * (year - 1)))); },
  start() {
    return Tx.run('compStart', () => {
      const f = World.festival(); if (!f) return { ok: false, msg: 'Bugün şenlik yok.' };
      if (this.entered(f)) return { ok: false, msg: 'Bu şenliğin yarışmasına zaten katıldın.' };
      if (this.active()) return { ok: false, msg: 'Zaten bir yarışmadasın.' };
      S.comp = { fest: f.id, year: World.year(), day: S.day, castsLeft: COMP.casts, n: 0, catches: [], rivals: RIVALS.map(r => ({ id: r.id, catches: [] })), done: false, result: null };
      S.fest[festKey(f)] = { entered: true }; S.stats.comps++; S.stats.festSeasons[f.season] = true;
      return { ok: true };
    });
  },
  score(type, cs) {
    if (!cs.length) return 0;
    if (type === 'weight') return round2(sum(cs.map(c => c.kg)));
    if (type === 'species') return new Set(cs.map(c => c.f)).size + Math.min(0.999, sum(cs.map(c => c.kg)) / 1000);
    if (type === 'biggest') return Math.max(...cs.map(c => c.kg));
    return sum(cs.map(c => FISH[c.f].base_price));
  },
  fmt(type, v) {
    if (type === 'species') return Math.floor(v) + ' tür';
    if (type === 'value') return fmt(v) + ' değer';
    return fmtKg(v) + ' kg';
  },
  standings() {
    const c = S.comp; if (!c) return []; const t = FEST[c.fest].comp;
    const rows = c.rivals.map(r => ({ id: r.id, name: RIVAL[r.id].name, score: this.score(t, r.catches), n: r.catches.length }));
    rows.push({ id: 'player', name: S.player.name + ' (sen)', score: this.score(t, c.catches), n: c.catches.length, player: true });
    return rows.sort((a, b) => b.score - a.score || (a.player ? -1 : 1));
  },
  /* her tamamlanan yarışma atışında (Tx içinde) çağrılır */
  onCast(spotId, fid, size) {
    const c = this.active(); if (!c) return;
    c.castsLeft--; if (fid) c.catches.push({ f: fid, kg: size.kg, cm: size.cm });
    const yearK = Math.min(0.12, 0.04 * (c.year - 1));
    for (const r of c.rivals) {
      const rv = RIVAL[r.id]; const rng = mulberry(hash32(S.seed, 'rival', c.fest, c.year, r.id, c.n));
      if (rng() < Math.min(0.95, 0.5 + 0.38 * rv.skill + yearK)) {
        const sel = Selector.weights(spotId, { rodPower: 2, bait: 'basic' }); let x = rng(), pick = sel.list[0];
        for (const it of sel.list) { x -= it.p; if (x < 0) { pick = it; break; } }
        const f = FISH[pick.id]; let t = rng(); for (let k = 0; k < Math.round(rv.skill * 2); k++) t = Math.max(t, rng() * (0.85 + yearK));
        const [l0, l1] = f.size_game_range.length_cm, [w0, w1] = f.size_game_range.weight_kg;
        r.catches.push({ f: f.id, kg: round2(w0 + Math.pow(t, 3) * (w1 - w0)), cm: Math.round(l0 + t * (l1 - l0)) });
      }
    }
    c.n++;
    if (c.castsLeft <= 0) this.finishIn();
  },
  finishIn() {
    const c = S.comp; const f = FEST[c.fest]; const st = this.standings(); const place = st.findIndex(r => r.player) + 1;
    const prize = place <= 3 ? this.prizes(c.year)[place - 1] : 0;
    if (prize) { S.cash += prize; S.stats.prizes += prize; S.today.marketIncome += 0; }
    if (place <= 3) S.trophies.push({ fest: f.id, year: c.year, place, score: st[place - 1].score, day: S.day });
    S.fest[festKey(f, c.day)] = { entered: true, place, score: st.find(r => r.player).score };
    c.done = true; c.result = { fest: f.id, place, prize, standings: st };
    Sound.sfx(place === 1 ? 'fanfare' : place <= 3 ? 'ach' : 'sleep');
  },
  leave() { return Tx.run('compLeave', () => { const c = this.active(); if (!c) return { ok: false }; c.castsLeft = 0; this.finishIn(); return { ok: true }; }); },
  clearDone() { if (S.comp && S.comp.done) { S.comp = null; Save.soon(); } }
};
/* ---- fırın: günlük tek atıştırmalık ---- */
const SNACK = Object.fromEntries(SNACKS.map(x => [x.id, x]));
Object.assign(Shop, {
  snackToday() { return S.buff && S.buff.day === S.day ? SNACK[S.buff.id] : null; },
  buffVal(effect, def) { const sn = this.snackToday(); return sn && sn.effect === effect ? sn.value : def; },
  buySnack(id) {
    return Tx.run('buySnack', () => {
      const sn = SNACK[id]; if (!sn) return { ok: false };
      if (this.snackToday()) return { ok: false, msg: 'Bugün zaten bir şey yedin; yarın yine gel!' };
      if (S.cash < sn.price) return { ok: false, msg: 'Paran yetmiyor.' };
      spend(sn.price, 'food'); S.buff = { id, day: S.day }; S.stats.snacks++; Sound.sfx('buy'); return { ok: true };
    });
  },
  buyFestivalItem() {
    return Tx.run('festItem', () => {
      const f = World.festival(); if (!f) return { ok: false, msg: 'Şenlik standı bugün kapalı.' };
      const st = f.stall; const list = st.kind === 'hat' ? S.wardrobe.hats : S.wardrobe.outfits;
      if (list.includes(st.id)) return { ok: false, msg: 'Zaten sahipsin.' }; if (S.cash < st.price) return { ok: false, msg: 'Paran yetmiyor.' };
      spend(st.price, 'cosmetic'); list.push(st.id); Sound.sfx('buy'); return { ok: true };
    });
  }
});
/* ---- çay bahçesi: günün balığı ---- */
const Tea = {
  cfg: EXP.teahouse,
  special() {
    const rp = maxRodPower(); const regs = REGIONS.filter(r => S.world.unlocked[r.id]);
    let pool = []; regs.forEach(r => r.fish_ids.forEach(f => { if (FISH[f].power <= rp + 1) pool.push(f); }));
    if (!pool.length) pool = REGION.sakin_liman.fish_ids.slice();
    return pool[Math.floor(hrand('tea', S.day) * pool.length)];
  },
  price(fid) { return roundHalfUp(FISH[fid].base_price * this.cfg.daily_special_multiplier); },
  left() { return S.tea.day === S.day ? Math.max(0, this.cfg.daily_special_qty - S.tea.n) : this.cfg.daily_special_qty; },
  sell(n, src) {
    return Tx.run('teaSell', () => {
      const fid = this.special(); const k = Math.min(n | 0, this.left(), Inv.count(src, fid)); if (k <= 0) return { ok: false, msg: 'Satılacak balık yok ya da günlük alım doldu.' };
      if (S.tea.day !== S.day) S.tea = { day: S.day, n: 0 };
      const got = Inv.remove(src, fid, k); const inc = got * this.price(fid); S.tea.n += got; S.cash += inc;
      S.stats.totalSales += inc; S.stats.marketSales += inc; S.stats.fishSoldMarket += got; S.stats.teaSold += got; S.today.marketIncome += inc;
      Sound.sfx('coin'); return { ok: true, n: got, income: inc };
    });
  }
};
/* ---- yeni başarımlar ve tetikleyiciler ---- */
ACH_DEF.species42 = [() => discovered(), FISH_LIST.length];
ACH_DEF.first_trophy = [() => S.trophies.length, 1];
ACH_DEF.gold_trophy = [() => S.trophies.filter(t => t.place === 1).length, 1];
ACH_DEF.festival4 = [() => Object.keys(S.stats.festSeasons || {}).length, 4];
ACH_DEF.trophies8 = [() => S.trophies.length, 8];
Object.assign(NPC_TRIG, {
  trophy_first: [true, () => S.trophies.length >= 1], trophy_gold: [true, () => S.trophies.some(t => t.place === 1)],
  festival4: [true, () => Object.keys(S.stats.festSeasons || {}).length >= 4], decor1: [true, () => Object.values(S.home.decor).some(Boolean)],
  species20: [true, () => discovered() >= 20],
  festival_today: [false, () => !!World.festival()], festival_soon: [false, () => { const n = World.nextFestival(); return !!n && n.inDays > 0 && n.inDays <= 5; }]
});
