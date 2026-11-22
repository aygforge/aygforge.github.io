'use strict';
/* ---- 07_v2.js ---- */
/* =====================================================================
   07_v2.js : CozFis v2.0 sistemleri
   Balıkçı Defteri, Sefer Planı, Bölge Ustalığı, Rakip Kariyerleri, Kişisel Rekorlar,
   Akıllı Satış, Olta Setleri, Cihaz Yem Politikaları, Mali Günlük, Akvaryum, NPC Rutinleri
   Tümü mevcut S / Tx / Inv / Catch / Auto / Comp / World yapılarını genişletir.
   ===================================================================== */
const V2 = {
  aqModels: [
    { id: 'small', get name() { return _t('world.kucuk_akvaryum'); }, set name(v) { _sv(this, "name", v); }, price: 550, cap: 3, species: 2, get desc() { return _t('sys2.kucuk_masa_ustu_akvaryum'); }, set desc(v) { _sv(this, "desc", v); } },
    { id: 'medium', get name() { return _t('world.orta_akvaryum'); }, set name(v) { _sv(this, "name", v); }, price: 2200, cap: 7, species: 4, get desc() { return _t('sys2.dolap_ustu_orta_boy_akvaryum'); }, set desc(v) { _sv(this, "desc", v); } },
    { id: 'large', get name() { return _t('world.buyuk_akvaryum'); }, set name(v) { _sv(this, "name", v); }, price: 8500, cap: 12, species: 6, get desc() { return _t('sys2.genis_dekoratif_akvaryum'); }, set desc(v) { _sv(this, "desc", v); } }
  ],
  aqFish: ['sardalya', 'gumus_baligi', 'hamsi', 'kaya_baligi', 'izmarit', 'isparoz', 'kupes', 'melanur', 'karagoz', 'tekir', 'barbun', 'hanos', 'kolyoz', 'ringa', 'kapelin', 'mavi_cerrah', 'sari_kuyruklu_fusilier', 'sarpan', 'sargoz', 'iskorpit'],
  aqDecor: [{ id: 'sand', get name() { return _t('sys2.kumlu_dip'); }, set name(v) { _sv(this, "name", v); }, price: 0 }, { id: 'plants', get name() { return _t('sys2.yesil_bitkiler'); }, set name(v) { _sv(this, "name", v); }, price: 150 }, { id: 'rocks', get name() { return _t('sys2.kayalik_dekor'); }, set name(v) { _sv(this, "name", v); }, price: 300 }, { id: 'coral', get name() { return _t('sys2.mercan_dekoru'); }, set name(v) { _sv(this, "name", v); }, price: 500 }],
  ornaments: {
    get sakin_liman() { return _t('sys2.pirinc_capa_amblemi'); }, set sakin_liman(v) { _sv(this, "sakin_liman", v); }, get yesil_koy() { return _t('sys2.zeytin_dali_celengi'); }, set yesil_koy(v) { _sv(this, "yesil_koy", v); }, get kayalik_adalar() { return _t('sys2.deniz_kabugu_susu'); }, set kayalik_adalar(v) { _sv(this, "kayalik_adalar", v); }, get serin_akintilar() { return _t('sys2.ruzgar_flamasi'); }, set serin_akintilar(v) { _sv(this, "serin_akintilar", v); },
    get sisli_kuzey() { return _t('sys2.kuzey_feneri'); }, set sisli_kuzey(v) { _sv(this, "sisli_kuzey", v); }, get gunes_adalari() { return _t('sys2.cicek_kolyesi'); }, set gunes_adalari(v) { _sv(this, "gunes_adalari", v); }, get derin_mavi() { return _t('sys2.altin_marlin_figuru'); }, set derin_mavi(v) { _sv(this, "derin_mavi", v); }
  },
  rivalProfiles: {
    ali: { get title() { return _t('sys2.buyuk_av_ustasi'); }, set title(v) { _sv(this, "title", v); }, get spec() { return _t('sys2.buyuk_baliklar'); }, set spec(v) { _sv(this, "spec", v); }, get bio() { return _t('sys2.kirk_yildir_ayni_iskelede_iri'); }, set bio(v) { _sv(this, "bio", v); } },
    mert: { get title() { return _t('sys2.merakli_genc'); }, set title(v) { _sv(this, "title", v); }, get spec() { return _t('sys2.tur_cesitliligi'); }, set spec(v) { _sv(this, "spec", v); }, get bio() { return _t('sys2.her_yeni_turu_gormek_ister'); }, set bio(v) { _sv(this, "bio", v); } },
    elif: { get title() { return _t('sys2.istikrarli_cizer'); }, set title(v) { _sv(this, "title", v); }, get spec() { return _t('sys2.dengeli_av'); }, set spec(v) { _sv(this, "spec", v); }, get bio() { return _t('sys2.defterine_her_baligi_cizer_acele'); }, set bio(v) { _sv(this, "bio", v); } },
    efe: { get title() { return _t('sys2.kasabanin_bilgesi'); }, set title(v) { _sv(this, "title", v); }, get spec() { return _t('sys2.deneyim'); }, set spec(v) { _sv(this, "spec", v); }, get bio() { return _t('sys2.denizi_en_iyi_taniyan_isim'); }, set bio(v) { _sv(this, "bio", v); } },
    selcuk: { get title() { return _t('sys2.kayalikoy_sampiyonu'); }, set title(v) { _sv(this, "title", v); }, get spec() { return _t('sys2.profesyonel_rekabet'); }, set spec(v) { _sv(this, "spec", v); }, get bio() { return _t('sys2.komsu_kasabanin_yenilmez_yarismacisi_her'); }, set bio(v) { _sv(this, "bio", v); } }
  },
  routines: {
    efe: [['pier_efe', 3], ['tea', 2], ['square', 1], ['market', 1]],
    ali: [['pier_a', 4], ['tea', 2], ['square', 1]],
    mert: [['pier_b', 3], ['bakery', 2], ['board', 1], ['square', 1]],
    elif: [['pier_c', 3], ['square', 2], ['boutique', 1]],
    hasan: [['home_hasan', 4], ['tea', 2], ['market', 1]],
    bahar: [['home_bahar', 4], ['market', 2], ['bakery', 1]]
  },
  slots: { pier_efe: 2690, pier_a: 2600, pier_b: 2780, pier_c: 2840, tea: 2012, tea2: 1898, square: 1660, square2: 1832, market: 688, bakery: 604, board: 2236, boutique: 1052, home_hasan: 1760, home_bahar: 2338 },
  dialogues: {
    zeynep: [{ trigger: 'festival_today', get text_tr() { return _t('sys2.senlik_gunu_misina_satislarim_ikiye'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'new_sea', get text_tr() { return _t('sys2.yeni_bir_denize_mi_acildin'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'big_record', get text_tr() { return _t('sys2.o_kocaman_baligi_hangi_oltayla'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'all70', get text_tr() { return _t('sys2.yetmis_turun_hepsi_mi_ekipmanini'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    nihat: [{ trigger: 'festival_today', get text_tr() { return _t('sys2.senlikte_tezgah_kalabalik_olur_baliklarin'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'big_record', get text_tr() { return _t('sys2.duydugum_o_dev_baligi_tartima'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'four_boats', get text_tr() { return _t('sys2.dort_tekne_limanin_yarisi_senin'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    bora: [{ trigger: 'festival_today', get text_tr() { return _t('sys2.senlik_icin_tekneleri_bayraklarla_susledim'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'new_sea', get text_tr() { return _t('sys2.yeni_rota_acilmis_tekne_govdesi'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'four_boats', get text_tr() { return _t('sys2.dort_teknenin_dordu_de_piril'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    bahar: [{ trigger: 'festival_today', get text_tr() { return _t('sys2.senlikte_lokantam_dolup_tasiyor_baliga'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'fest_win', get text_tr() { return _t('sys2.sampiyonumuz_geldi_bu_aksam_yemek'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'aq_buy', get text_tr() { return _t('sys2.evine_akvaryum_almissin_o_baliklar'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    efe: [{ trigger: 'festival_today', get text_tr() { return _t('sys2.senlikte_acele_etme_sekiz_atis'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'new_sea', get text_tr() { return _t('sys2.yeni_bir_deniz_yeni_dersler'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'big_record', get text_tr() { return _t('sys2.ben_de_boyle_bir_baligi'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'fest_win', get text_tr() { return _t('sys2.kupayi_aldin_ha_ustalik_sende'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    fatma: [{ trigger: 'aq_buy', get text_tr() { return _t('sys2.akvaryumun_varmis_baliklarina_simit_kirintisi'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'fest_win', get text_tr() { return _t('sys2.sampiyona_bedava_simit_bugun_benden'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    selin: [{ trigger: 'four_boats', get text_tr() { return _t('sys2.dort_tekne_sahibi_biri_bu'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'all70', get text_tr() { return _t('sys2.yetmis_turu_bulan_balikciya_ozel'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    kerem: [{ trigger: 'aq_buy', get text_tr() { return _t('sys2.akvaryumun_yerine_oturdu_mu_camini'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'aq_collect', get text_tr() { return _t('sys2.akvaryum_koleksiyonun_buyuyor_evin_kucuk'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'new_sea', get text_tr() { return _t('sys2.uzak_denizlerden_dekor_fikri_getirirsen'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    halil: [{ trigger: 'fest_win', get text_tr() { return _t('sys2.masalarda_bugun_yalniz_senin_kupan'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'four_boats', get text_tr() { return _t('sys2.dort_teknen_var_ama_hala'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'all70', get text_tr() { return _t('sys2.butun_turleri_gormussun_cay_bahcemde'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    hasan: [{ trigger: 'fest_win', get text_tr() { return _t('sys2.sampiyonluk_kursusu_sana_cok_yakisti'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'aq_collect', get text_tr() { return _t('sys2.akvaryum_koleksiyonunu_duydum_kasaba_sergisine'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    ali: [{ trigger: 'big_record', get text_tr() { return _t('sys2.boylesini_kirk_yilda_bir_gorursun'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'new_sea', get text_tr() { return _t('sys2.uzak_denizler_guzeldir_ama_iskeleyi'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    mert: [{ trigger: 'aq_buy', get text_tr() { return _t('sys2.akvaryum_mu_aldin_bir_gun'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'first_boat', get text_tr() { return _t('sys2.ilk_teknen_hayirli_olsun_bana'); }, set text_tr(v) { _sv(this, "text_tr", v); } }],
    elif: [{ trigger: 'aq_collect', get text_tr() { return _t('sys2.akvaryumundaki_turleri_defterime_cizdim_tam'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'all70', get text_tr() { return _t('sys2.yetmis_turun_hepsi_defterimde_de'); }, set text_tr(v) { _sv(this, "text_tr", v); } }]
  }
};
for (const npc in V2.dialogues) CFG.npc_dialogues[npc] = (CFG.npc_dialogues[npc] || []).concat(V2.dialogues[npc]);
const AQM = Object.fromEntries(V2.aqModels.map(m => [m.id, m]));
const AQ_OK = new Set(V2.aqFish);
NPCS.selcuk = { get name() { return _t('sys2.selcuk'); }, set name(v) { _sv(this, "name", v); }, get role() { return _t('sys2.kayalikoy_sampiyonu'); }, set role(v) { _sv(this, "role", v); }, look: { skin: 2, hair: 2, hairColor: 0, body: 1, outfit: { shirt: '#2a2a3a', shirt2: '#c8a040', pants: '#2a2a3a', shoes: '#1a1a22', pat: 'buttons' }, hat: 'kasket' } };
/* bölge posterleri (gümüş ustalık) dekor olarak */
for (const r of REGIONS) DECOR.push({ id: 'poster_' + r.id, get name() { return _t('sys2.n_posteri', [r.name]); }, set name(v) { _sv(this, "name", v); }, slot: 'wall', mastery: r.id });
for (const d of DECOR) DECOR_BY[d.id] = d;
/* yeni başarımlar: akvaryum koleksiyonu */
ACHS.push(
  { id: 'aq5', get name() { return _t('sys2.kucuk_koleksiyon'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys2.akvaryumda_5_farkli_tur_sergile'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys2.akvaryum'); }, set category(v) { _sv(this, "category", v); } },
  { id: 'aq10', get name() { return _t('sys2.akvaryum_meraklisi'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys2.akvaryumda_10_farkli_tur_sergile'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys2.akvaryum'); }, set category(v) { _sv(this, "category", v); } },
  { id: 'aq20', get name() { return _t('sys2.deniz_koleksiyoncusu'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys2.akvaryuma_uygun_20_turun_hepsini'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys2.akvaryum'); }, set category(v) { _sv(this, "category", v); } }
);
ACH_DEF.aq5 = [() => Object.keys(S.aq.seen).length, 5];
ACH_DEF.aq10 = [() => Object.keys(S.aq.seen).length, 10];
ACH_DEF.aq20 = [() => Object.keys(S.aq.seen).length, V2.aqFish.length];
ACH_REWARD.aq5 = { type: 'badge', id: 'aq_badge', get name() { return _t('sys2.kucuk_akvaryum_koleksiyon_rozeti'); }, set name(v) { _sv(this, "name", v); } };
ACH_REWARD.aq10 = { type: 'aqbg', id: 'ocean', get name() { return _t('sys2.ozel_akvaryum_arka_plani'); }, set name(v) { _sv(this, "name", v); } };
ACH_REWARD.aq20 = { type: 'title', id: 'collector', get name() { return _t('sys2.deniz_koleksiyoncusu_unvani'); }, set name(v) { _sv(this, "name", v); } };
Object.assign(NPC_TRIG, {
  big_record: [true, () => S.records.some(r => !r.legacy && r.kg >= 20)], aq_buy: [true, () => Object.keys(S.aq.owned).length > 0],
  aq_collect: [true, () => Object.keys(S.aq.seen).length >= 10], four_boats: [true, () => S.boats.owned.length >= 4],
  all70: [true, () => discovered() >= FISH_LIST.length], fest_win: [true, () => S.trophies.some(t => t.place === 1)],
  new_sea: [false, null]
});
/* yeni deniz keşfi: tekrarlanabilir (her yeni bölgede bir kez) */
{
  const _line = NPCDialog.line.bind(NPCDialog);
  NPCDialog.line = function (npc) {
    const st = S.npc[npc] || (S.npc[npc] = { seen: {}, lastRecord: 0, lastDay: 0, lastTrig: null, bigDay: 0 });
    const n = Object.keys(S.world.unlocked).length; if (st.seaN == null) st.seaN = n;
    const by = (CFG.npc_dialogues[npc] || []).some(d => d.trigger === 'new_sea');
    if (by && st.seen.first_meet && n > st.seaN) { st.seaN = n; st.lastDay = S.day; st.lastTrig = 'new_sea'; return { npc, trigger: 'new_sea', text: CFG.npc_dialogues[npc].find(d => d.trigger === 'new_sea').text_tr }; }
    return _line(npc);
  };
}

/* ---------------- Balıkçı Defteri ---------------- */
const Journal = {
  log(fid, size, auto, meta) {
    const L = S.journal.log[fid] || (S.journal.log[fid] = { first: S.day, last: S.day, n: 0, manual: 0, auto: 0, baits: {}, spots: {}, baitSpot: {} });
    L.n++; L.last = S.day; if (auto) L.auto++; else L.manual++;
    if (meta.bait) L.baits[meta.bait] = (L.baits[meta.bait] || 0) + 1;
    if (meta.spot) { L.spots[meta.spot] = (L.spots[meta.spot] || 0) + 1; if (meta.bait) { const k = meta.spot + '|' + meta.bait; L.baitSpot[k] = (L.baitSpot[k] || 0) + 1; } }
  },
  tier(fid) { const n = (S.ency[fid] && S.ency[fid].caught) || 0; return n >= 12 ? 3 : n >= 5 ? 2 : n >= 1 ? 1 : 0; },
  spotsOf(fid) { return SPOT_LIST.filter(s => s.weights[fid]); },
  toggleFav(fid) { if (S.journal.fav[fid]) delete S.journal.fav[fid]; else S.journal.fav[fid] = S.day; Save.soon(); },
  /* gerçek seçim formülüyle (ağırlık × yem × mevsim × hava × mesafe × olay, olta filtresi) en iyi plan */
  bestPlan(fid) {
    const rp = rodOf().power; let best = null;
    for (const sp of this.spotsOf(fid)) {
      if (!S.world.unlocked[sp.region_id]) continue;
      for (const b of BAITS) for (const band of ['near', 'mid', 'far']) {
        const w = Selector.weights(sp.id, { rodPower: rp, bait: b.id, band }); const x = w.list.find(i => i.id === fid);
        if (x && (!best || x.p > best.p + 1e-9)) best = { fid, spot: sp.id, rid: sp.region_id, bait: b.id, band, p: x.p, fac: x.fac };
      }
    }
    return best;
  },
  today(limit) {
    const out = [];
    for (const f of FISH_LIST) { if (!(S.ency[f.id] && S.ency[f.id].caught)) continue; const b = this.bestPlan(f.id); if (b) out.push(b); }
    out.sort((a, b) => b.p - a.p || FISH[b.fid].base_price - FISH[a.fid].base_price);
    return out.slice(0, limit || 10);
  },
  level(p) { return p >= 0.2 ? _t('sys2.yuksek') : p >= 0.1 ? _t('core.orta') : _t('sys2.dusuk'); }
};

/* ---------------- Sefer Planı ---------------- */
const Plan = {
  MAX: 3,
  add(fid, target) {
    return Tx.run('planAdd', () => {
      if (!FISH[fid]) return { ok: false, msg: _t('sys2.gecersiz_tur') };
      const t = clamp(Math.round(+target || 1), 1, 99); const g = S.plan.goals.find(x => x.fid === fid);
      if (g) { g.target = t; return { ok: true, updated: true }; }
      if (S.plan.goals.length >= this.MAX) return { ok: false, msg: _t('sys2.en_fazla_n_hedef_secebilirsin', [this.MAX]) };
      S.plan.goals.push({ fid, target: t, got: 0, since: S.day }); return { ok: true };
    });
  },
  setTarget(i, t) { return Tx.run('planSet', () => { const g = S.plan.goals[i]; if (!g) return { ok: false }; g.target = clamp(Math.round(+t || 1), 1, 99); g.got = Math.min(g.got, g.target); return { ok: true }; }); },
  remove(i) { return Tx.run('planDel', () => { if (!S.plan.goals[i]) return { ok: false }; S.plan.goals.splice(i, 1); return { ok: true }; }); },
  setKeep(v) { S.plan.keep = !!v; Save.soon(); },
  onCatch(fid) { for (const g of S.plan.goals) if (g.fid === fid && g.got < g.target) { g.got++; if (g.got === g.target) Bus.toast(_t('sys2.sefer_hedefi_tamam_n_n', [FISH[fid].name_tr, g.got, g.target]), 'good', 'map'); } },
  newDay() { if (!S.plan.keep) for (const g of S.plan.goals) { g.got = 0; g.since = S.day; } }
};

/* ---------------- Bölge Ustalığı ---------------- */
const Mastery = {
  status(rid) {
    const R = REGION[rid]; const spots = R.spot_ids.filter(s => S.stats.spotsVisited[s]).length; const disc = R.fish_ids.filter(f => S.ency[f] && S.ency[f].caught).length;
    return { spots, disc, total: R.fish_ids.length, bronze: spots >= 3, silver: disc >= 6, gold: disc >= R.fish_ids.length };
  },
  count() { let n = 0; for (const r of REGIONS) { const m = S.mastery[r.id] || {}; n += (m.b ? 1 : 0) + (m.s ? 1 : 0) + (m.g ? 1 : 0); } return n; },
  check() {
    for (const r of REGIONS) {
      const st = this.status(r.id); const m = S.mastery[r.id] || (S.mastery[r.id] = {});
      if (st.bronze && !m.b) { m.b = S.day; Bus.toast(_t('sys2.n_bronz_ustalik_rozeti', [r.name]), 'ach', 'badge_b'); }
      if (st.silver && !m.s) { m.s = S.day; if (!S.home.owned.includes('poster_' + r.id)) S.home.owned.push('poster_' + r.id); Bus.toast(_t('sys2.n_gumus_ustalik_bolge_posteri', [r.name]), 'ach', 'badge_s'); }
      if (st.gold && !m.g) { m.g = S.day; const oid = 'orn_' + r.id; S.cosmetics.ornaments = S.cosmetics.ornaments || []; if (!S.cosmetics.ornaments.includes(oid)) S.cosmetics.ornaments.push(oid); Bus.toast(_t('sys2.n_altin_ustalik_n_tekne', [r.name, V2.ornaments[r.id]]), 'ach', 'badge_g'); }
    }
  },
  setOrnament(bid, oid) { const b = S.boats.byId[bid]; if (!b) return; if (oid && !(S.cosmetics.ornaments || []).includes(oid)) return; b.ornament = oid || null; Save.soon(); UI.refresh(); }
};

/* ---------------- Rakip Kariyerleri ---------------- */
const Rivals = {
  record(c) {
    const key = c.fest + ':' + c.year; if (S.rivalLog[key]) return false; S.rivalLog[key] = S.day;
    const f = FEST[c.fest]; const st = c.result.standings;
    st.forEach((row, i) => {
      if (row.player) return; const r = S.rivals[row.id] || (S.rivals[row.id] = { comps: 0, wins: 0, podiums: 0, best: null, hist: [] });
      const place = i + 1; r.comps++; if (place === 1) r.wins++; if (place <= 3) r.podiums++; if (r.best == null || place < r.best) r.best = place;
      r.hist.push({ fest: c.fest, year: c.year, place, score: row.score }); if (r.hist.length > 40) r.hist.shift();
    });
    S.compHist.push({ fest: c.fest, year: c.year, day: c.day, place: c.result.place, prize: c.result.prize, standings: st.map(x => ({ id: x.id, name: x.name, score: x.score, player: !!x.player })) });
    if (S.compHist.length > 40) S.compHist.shift();
    return true;
  }
};
{
  const _fin = Comp.finishIn.bind(Comp);
  Comp.finishIn = function () { _fin(); const c = S.comp; if (c && c.result) { Rivals.record(c); if (c.result.place === 1) Game.celebrate = Game.t; } };
}

/* ---------------- Kişisel Av Rekorları ---------------- */
const Records = {
  MAX: 10,
  consider(fid, size, auto, meta) {
    const spot = meta.spot && SPOTS[meta.spot] ? meta.spot : null; const rec = { id: ++S.recSeq, fid, cm: size.cm, kg: size.kg, rid: spot ? SPOTS[spot].region_id : null, spot, day: S.day, rod: auto ? null : (meta.rod || S.gear.rod), dev: auto ? (meta.dev || null) : null, auto: !!auto };
    S.records.push(rec); this.prune();
    return S.records.includes(rec);
  },
  prune() {
    const keep = new Set(S.recWall);
    const sorted = S.records.slice().sort((a, b) => b.kg - a.kg || b.cm - a.cm);
    const top = new Set(sorted.slice(0, this.MAX).map(r => r.id));
    S.records = sorted.filter(r => top.has(r.id) || keep.has(r.id));
  },
  top() { return S.records.slice().sort((a, b) => b.kg - a.kg || b.cm - a.cm).slice(0, this.MAX); },
  toggleWall(id) { const i = S.recWall.indexOf(id); if (i >= 0) S.recWall.splice(i, 1); else { if (S.recWall.length >= 5) return { ok: false, msg: _t('sys2.duvarda_en_fazla_5_rekor') }; if (!S.records.find(r => r.id === id)) return { ok: false }; S.recWall.push(id); } this.prune(); Save.soon(); return { ok: true }; },
  /* eski kayıtlar: yalnızca ansiklopedideki ağırlık rekoru bilinir; boy rekoru ayrı tutulduğundan birleştirilmez */
  legacyFill(st) {
    if (st.records && st.records.length) return;
    st.records = []; let seq = st.recSeq || 0;
    for (const fid in st.ency) { const e = st.ency[fid]; if (e && e.caught && e.maxKg > 0 && FISH[fid]) st.records.push({ id: ++seq, fid, cm: null, kg: e.maxKg, rid: FISH[fid].home_region, spot: null, day: null, rod: null, dev: null, auto: null, legacy: true }); }
    st.records.sort((a, b) => b.kg - a.kg); st.records = st.records.slice(0, 10); st.recSeq = seq;
  }
};
{
  const _rec = Catch.record.bind(Catch);
  Catch.record = function (fid, size, auto, meta) {
    const r = _rec(fid, size, auto); meta = meta || {};
    Journal.log(fid, size, auto, meta); Plan.onCatch(fid); r.board = Records.consider(fid, size, auto, meta);
    return r;
  };
}

/* ---------------- İç satış adımları (Tx içinde kullanılır) ---------------- */
const SellIn = {
  market(fid, n, src) { const rem = Inv.remove(src, fid, n); const inc = rem * FISH[fid].base_price; S.cash += inc; S.stats.totalSales += inc; S.stats.marketSales += inc; S.stats.fishSoldMarket += rem; S.today.marketIncome += inc; return { n: rem, inc }; },
  order(o, n, src) {
    const k = Math.min(n, Orders.remaining(o)); const got = Inv.remove(src, o.fishId, k); const inc = got * o.unitPrice; o.delivered += got; S.cash += inc;
    const c = S.customers[o.customerId] || (S.customers[o.customerId] = { delivered: 0 }); c.delivered += got;
    S.stats.ordersDelivered += got; S.stats.orderSales += inc; S.stats.totalSales += inc; S.stats.buyers[o.customerId] = true; S.today.orderIncome += inc; return { n: got, inc };
  },
  tea(fid, n, src) { if (S.tea.day !== S.day) S.tea = { day: S.day, n: 0 }; const k = Math.min(n, Tea.left()); const got = Inv.remove(src, fid, k); const inc = got * Tea.price(fid); S.tea.n += got; S.cash += inc; S.stats.totalSales += inc; S.stats.teaSales = (S.stats.teaSales || 0) + inc; S.stats.fishSoldMarket += got; S.stats.teaSold += got; S.today.teaIncome += inc; return { n: got, inc }; }
};

/* ---------------- Akıllı Satış Karşılaştırması ---------------- */
const SmartSell = {
  /* her tür için alıcıları birim fiyata göre sırala ve eldeki miktarı dağıt (yalnızca öneri) */
  planFor(fid, have) {
    const ch = [];
    for (const o of Orders.active()) if (o.fishId === fid && Orders.remaining(o) > 0) ch.push({ kind: 'order', id: o.id, name: CUST[o.customerId].name, unit: o.unitPrice, limit: Orders.remaining(o) });
    if (Tea.special() === fid && Tea.left() > 0) ch.push({ kind: 'tea', id: 'tea', name: _t('sys2.halil_usta_gunun_baligi'), unit: Tea.price(fid), limit: Tea.left() });
    ch.push({ kind: 'market', id: 'market', name: _t('core.balik_hali'), unit: FISH[fid].base_price, limit: Infinity });
    ch.sort((a, b) => b.unit - a.unit || (a.kind === 'market' ? 1 : -1));
    let left = have; const alloc = [];
    for (const c of ch) { if (left <= 0) break; const k = Math.min(left, c.limit); if (k > 0) { alloc.push(Object.assign({}, c, { n: k, total: k * c.unit })); left -= k; } }
    return { fid, have, channels: ch, alloc, total: sum(alloc.map(a => a.total)), marketOnly: have * FISH[fid].base_price };
  },
  plans(src, includeFav) { const sp = Inv.species(src); const out = []; for (const f in sp) { if (!includeFav && S.favorites[f]) continue; out.push(this.planFor(f, sp[f])); } out.sort((a, b) => (b.total - b.marketOnly) - (a.total - a.marketOnly) || b.total - a.total); return out; },
  /* oyuncunun onayıyla: önerilen dağılımı tek atomik işlemde uygula */
  execute(fid, src) {
    return Tx.run('smartSell', () => {
      const have = Inv.count(src, fid); if (!have) return { ok: false, msg: _t('sys2.bu_turden_baligin_yok') };
      const p = this.planFor(fid, have); let inc = 0, n = 0;
      for (const a of p.alloc) {
        let r;
        if (a.kind === 'order') { const o = S.orders.find(x => x.id === a.id); if (!o || S.day >= o.expiresAtDayExclusive) throw new Error('ilan yok'); r = SellIn.order(o, a.n, src); }
        else if (a.kind === 'tea') r = SellIn.tea(fid, a.n, src); else r = SellIn.market(fid, a.n, src);
        if (r.n !== a.n) throw new Error('dağılım tutarsız'); inc += r.inc; n += r.n;
      }
      Sound.sfx('coin'); return { ok: true, n, income: inc };
    });
  }
};

/* ---------------- Kayıtlı Olta Setleri ---------------- */
const GearSets = {
  KINDS: ['rod', 'line', 'reel', 'hook'],
  save(i) { return Tx.run('gearSetSave', () => { const g = S.gearSets[i]; if (!g) return { ok: false }; for (const k of this.KINDS) g[k] = S.gear[k]; g.bait = S.gear.bait; return { ok: true }; }); },
  rename(i, name) { const g = S.gearSets[i]; if (!g) return; const v = String(name || '').trim().slice(0, 16); if (v) g.name = v; Save.soon(); },
  apply(i) {
    if (Fishing.ctx && !['READY', 'OUTCOME'].includes(Fishing.phase)) return { ok: false, msg: _t('sys2.mucadele_sirasinda_ekipman_degistirilemez') };
    const notes = [];
    const r = Tx.run('gearSetApply', () => {
      const g = S.gearSets[i]; if (!g || !g.rod) return { ok: false, msg: _t('sys2.bu_set_henuz_kaydedilmedi') };
      for (const k of this.KINDS) { if (g[k] && S.gear.owned[k].includes(g[k])) S.gear[k] = g[k]; else if (g[k]) notes.push(_t('sys2.n_sahip_degilsin', [GEAR_TR[k]])); }
      if (g.bait === 'basic' || !g.bait) S.gear.bait = 'basic'; else if (S.baitStock[g.bait] > 0) S.gear.bait = g.bait; else { S.gear.bait = 'basic'; notes.push(_t('sys2.n_stokta_yok_temel_yem', [BAIT[g.bait].name])); }
      return { ok: true };
    });
    if (r.ok) r.notes = notes; return r;
  }
};

/* ---------------- Otomatik Olta Yem Politikaları ---------------- */
const POLICY_TR = { get econ() { return _t('sys2.ekonomik'); }, set econ(v) { _sv(this, "econ", v); }, get fixed() { return _t('sys2.sabit_yem'); }, set fixed(v) { _sv(this, "fixed", v); }, get target() { return _t('sys2.hedef_balik'); }, set target(v) { _sv(this, "target", v); }, get backup() { return _t('sys2.yedek_yemli'); }, set backup(v) { _sv(this, "backup", v); } };
Object.assign(Auto, {
  policy(dev) { const d = S.auto.devices[dev]; if (!d) return null; if (!d.policy) d.policy = { mode: 'econ', bait: null, backup: null, target: null }; return d.policy; },
  setPolicy(dev, p) { return Tx.run('autoPolicy', () => { const d = S.auto.devices[dev]; if (!d) return { ok: false }; const cur = this.policy(dev); const nx = Object.assign({}, cur, p); if (!POLICY_TR[nx.mode]) return { ok: false }; for (const k of ['bait', 'backup']) if (nx[k] && !PAID_BAITS.includes(nx[k])) return { ok: false, msg: _t('sys2.temel_yem_otomatikte_kullanilamaz') }; if (nx.target && !FISH[nx.target]) return { ok: false }; d.policy = nx; return { ok: true }; }); },
  pickBaitFor(dev, spotId, bid) {
    const pol = this.policy(dev) || { mode: 'econ' }; const has = b => b && b !== 'basic' && S.baitStock[b] > 0;
    const econ = () => PAID_BAITS.slice().sort((a, b) => BAIT[a].purchase_price - BAIT[b].purchase_price).find(has) || null;
    if (pol.mode === 'fixed') return has(pol.bait) ? pol.bait : null;
    if (pol.mode === 'backup') return has(pol.bait) ? pol.bait : (has(pol.backup) ? pol.backup : null);
    if (pol.mode === 'target' && pol.target) {
      const d = S.auto.devices[dev]; const pool = spotId ? Selector.weights(spotId, { auto: true, maxPower: this.maxPower(bid) }).list : [];
      if (spotId && !pool.some(x => x.id === pol.target)) { if (d.targetMissDay !== S.day) { d.targetMissDay = S.day; Bus.toast(_t('sys2.n_hedef_n_bu_noktada', [AUTO[dev].name, FISH[pol.target].name_tr]), 'warn', dev); } return econ(); }
      return FISH[pol.target].favored_baits.find(has) || econ();
    }
    return econ();
  }
});

/* ---------------- Mali Günlük (son 30 gün) ---------------- */
const Finance = {
  close(rep) {
    const by = rep.expBy || {}; const gearC = (by.gear || 0) + (by.boat || 0) + (by.automation || 0);
    const income = (rep.marketIncome || 0) + (rep.orderIncome || 0) + (rep.teaIncome || 0) + (rep.prizeIncome || 0);
    const expense = rep.expenses || 0;
    const e = { day: rep.prevDay || rep.day, manual: rep.manualCatches, auto: rep.autoCatches, market: rep.marketIncome || 0, orders: rep.orderIncome || 0, tea: rep.teaIncome || 0, prize: rep.prizeIncome || 0, bait: by.bait || 0, fuel: by.fuel || 0, gear: gearC, other: expense - (by.bait || 0) - (by.fuel || 0) - gearC, income, expense, net: rep.endCash - rep.startCash, startCash: rep.startCash, endCash: rep.endCash };
    e.consistent = e.net === income - expense;
    S.fin.push(e); while (S.fin.length > 30) S.fin.shift();
    return e;
  }
};

/* ---------------- Akvaryum ---------------- */
const Aq = {
  tank(id) { return S.aq.tanks[id]; },
  owns(id) { return !!S.aq.owned[id]; },
  total(id) { const t = this.tank(id); return t ? sum(Object.values(t.fish)) : 0; },
  speciesN(id) { const t = this.tank(id); return t ? Object.keys(t.fish).length : 0; },
  allFish() { const m = {}; for (const id in S.aq.tanks) for (const f in S.aq.tanks[id].fish) m[f] = (m[f] || 0) + S.aq.tanks[id].fish[f]; return m; },
  room(id, fid) { const t = this.tank(id), M = AQM[id]; if (!t) return 0; if (!t.fish[fid] && this.speciesN(id) >= M.species) return 0; return Math.max(0, M.cap - this.total(id)); },
  sources() { const s = ['bag', 'chest']; if (S.boats.active) s.push('boat:' + S.boats.active); return s; },
  buyModel(id) {
    return Tx.run('aqBuy', () => {
      const M = AQM[id]; if (!M) return { ok: false }; if (this.owns(id)) return { ok: false, msg: _t('sys2.bu_akvaryuma_zaten_sahipsin') };
      if (S.cash < M.price) return { ok: false, msg: _t('sys.paran_yetmiyor') };
      spend(M.price, 'home'); S.aq.owned[id] = S.day; S.aq.tanks[id] = { fish: {}, decor: 'sand', bg: 'plain' }; Sound.sfx('fanfare'); return { ok: true };
    });
  },
  buyDecor(did) {
    return Tx.run('aqDecor', () => { const D = V2.aqDecor.find(x => x.id === did); if (!D) return { ok: false }; if (S.aq.decor.includes(did)) return { ok: false, msg: _t('sys.zaten_sahipsin') }; if (S.cash < D.price) return { ok: false, msg: _t('sys.paran_yetmiyor') }; spend(D.price, 'home'); S.aq.decor.push(did); Sound.sfx('buy'); return { ok: true }; });
  },
  setDecor(id, did) { const t = this.tank(id); if (!t || !S.aq.decor.includes(did)) return; t.decor = did; Save.soon(); },
  setBg(id, bg) { const t = this.tank(id); if (!t) return; if (bg === 'ocean' && !S.ach.aq10) return; t.bg = bg; Save.soon(); },
  put(id, fid, n, src) {
    return Tx.run('aqPut', () => {
      if (!this.owns(id)) return { ok: false, msg: _t('sys2.akvaryum_yok') }; if (!AQ_OK.has(fid)) return { ok: false, msg: _t('sys2.n_akvaryuma_uygun_degil', [FISH[fid].name_tr]) };
      const have = Inv.count([src], fid); const room = this.room(id, fid); const k = Math.min(n | 0, have, room);
      if (k <= 0) return { ok: false, msg: have ? (this.room(id, fid) === 0 && !this.tank(id).fish[fid] && this.speciesN(id) >= AQM[id].species ? _t('sys2.tur_siniri_dolu_n_tur', [AQM[id].species]) : _t('sys2.akvaryum_dolu')) : _t('sys2.bu_depoda_bu_turden_balik') };
      const got = Inv.remove([src], fid, k); if (got !== k) throw new Error('aq put');
      const t = this.tank(id); t.fish[fid] = (t.fish[fid] || 0) + k; if (!S.aq.seen[fid]) S.aq.seen[fid] = S.day; Sound.sfx('splash');
      return { ok: true, n: k };
    });
  },
  take(id, fid, n, dst) {
    return Tx.run('aqTake', () => {
      const t = this.tank(id); if (!t || !t.fish[fid]) return { ok: false, msg: _t('sys2.akvaryumda_bu_tur_yok') };
      const k = Math.min(n | 0, t.fish[fid], Inv.space(dst, fid)); if (k <= 0) return { ok: false, msg: _t('sys.hedef_depoda_yer_yok') };
      const added = Inv.add(dst, fid, k); if (added !== k) throw new Error('aq take');
      t.fish[fid] -= k; if (!t.fish[fid]) delete t.fish[fid]; return { ok: true, n: k };
    });
  },
  move(a, b, fid, n) {
    return Tx.run('aqMove', () => {
      const A = this.tank(a); if (!A || !A.fish[fid] || !this.owns(b) || a === b) return { ok: false, msg: _t('sys2.tasima_yapilamaz') };
      const k = Math.min(n | 0, A.fish[fid], this.room(b, fid)); if (k <= 0) return { ok: false, msg: _t('sys2.hedef_akvaryumda_yer_yok') };
      A.fish[fid] -= k; if (!A.fish[fid]) delete A.fish[fid]; const B = this.tank(b); B.fish[fid] = (B.fish[fid] || 0) + k; return { ok: true, n: k };
    });
  },
  validate(st) {
    const e = []; const aq = st.aq; if (!aq || typeof aq !== 'object') return [_t('sys2.akvaryum_verisi')];
    for (const id in aq.tanks) {
      const M = AQM[id], t = aq.tanks[id]; if (!M) { e.push(_t('sys2.akvaryum_modeli_n', [id])); continue; } if (!aq.owned[id]) e.push(_t('sys2.sahipsiz_akvaryum_n', [id]));
      let tot = 0, sp = 0; for (const f in t.fish) { const q = t.fish[f]; if (!AQ_OK.has(f) || !(q >= 1) || q !== (q | 0)) e.push(_t('sys2.akvaryum_baligi_n', [f])); tot += q; sp++; }
      if (tot > M.cap) e.push(_t('sys2.akvaryum_kapasitesi_n', [id])); if (sp > M.species) e.push(_t('sys2.akvaryum_tur_siniri_n', [id]));
    }
    return e;
  }
};

/* ---------------- NPC günlük rutinleri (oyun gününe göre deterministik) ---------------- */
const Routine = {
  cache: { day: -1, fest: null, map: {} },
  place(npc) {
    const fest = World.festival(); const key = S.day + ':' + (fest ? fest.id : '') + ':' + S.world.weather.sakin_liman + ':' + S.seed;
    if (this.cache.day !== key) {
      const map = {}, used = new Set(); const wx = S.world.weather.sakin_liman;
      for (const n of Object.keys(V2.routines)) {
        let opts = V2.routines[n].slice();
        if (fest && ['efe', 'ali', 'mert', 'elif'].includes(n)) opts = [['square', 3], ['square2', 3], ['tea', 1]];
        if (wx === 'rain') opts = opts.map(([s, w]) => [s, s.startsWith('tea') ? w * 3 : w]);
        let r = hrand('routine', S.day, n); let pick = opts[0][0]; const tot = sum(opts.map(o => o[1]));
        for (const [s, w] of opts) { r -= w / tot; if (r < 0) { pick = s; break; } }
        if (used.has(pick)) { const alt = { tea: 'tea2', square: 'square2', tea2: 'tea', square2: 'square' }[pick]; pick = alt && !used.has(alt) ? alt : V2.routines[n][0][0]; }
        used.add(pick); map[n] = pick;
      }
      this.cache = { day: key, map };
    }
    return this.cache.map[npc];
  },
  x(npc) { const p = this.place(npc); return V2.slots[p]; },
  atPier(npc) { return (this.place(npc) || '').startsWith('pier'); },
  where(npc) {
    const p = this.place(npc); if (!p) return _t('sys2.dukkaninda');
    return { pier_efe: _t('sys2.iskelede'), pier_a: _t('sys2.iskelede'), pier_b: _t('sys2.iskelede'), pier_c: _t('sys2.iskele_ucunda'), tea: _t('sys2.cay_bahcesinde'), tea2: _t('sys2.cay_bahcesinde'), square: _t('sys2.meydanda'), square2: _t('sys2.meydanda'), market: _t('sys2.balik_halinin_onunde'), bakery: _t('sys2.firinin_onunde'), board: _t('sys2.ilan_panosunda'), boutique: _t('sys2.butigin_onunde'), home_hasan: _t('sys2.muhtarlikta'), home_bahar: _t('sys2.lokantasinda') }[p];
  }
};

/* ---------------- Ustalık/akvaryum kontrolleri, gün geçişi ---------------- */
{
  const _cc = Cosmetics.check.bind(Cosmetics);
  Cosmetics.check = function () { _cc(); Mastery.check(); };
  const _sd = World.startDay.bind(World);
  World.startDay = function () { _sd(); if (S.plan) Plan.newDay(); };
}
