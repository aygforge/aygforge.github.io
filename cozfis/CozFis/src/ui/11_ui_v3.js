'use strict';
/* ---- 11_ui_v3.js ---- */
/* =====================================================================
   11_ui_v3.js : v3.0 arayüzü — av yöntemi / gün ışığı, hızlı tekrar, çok duraklı harita,
   sefer raporu, kasaba projeleri, deniz yaşamı defteri, misafir daveti, filo yönetimi ve teslimat
   Mevcut UI.P / UI.A genişletilir; eski paneller korunur.
   ===================================================================== */
const stLabel = { get active() { return _t('ui3.oyuncunun_aktif_teknesi'); }, set active(v) { _sv(this, "active", v); }, get idle() { return _t('ui3.limanda_bosta'); }, set idle(v) { _sv(this, "idle", v); }, get out() { return _t('ui3.npc_seferinde'); }, set out(v) { _sv(this, "out", v); }, get back() { return _t('ui3.limana_dondu_teslimat_bekliyor'); }, set back(v) { _sv(this, "back", v); } };
const stIcon = { active: 'boat', idle: 'fleet_idle', out: 'fleet_out', back: 'fleet_back' };
const keyName2 = k => k === 'bag' ? _t('ui.canta') : k === 'chest' ? _t('ui3.ev_sandigi') : (BOAT[k.slice(5)] ? _t('sys.n_deposu', [BOAT[k.slice(5)].name]) : k);
Object.assign(UI.P, {
  /* ---------------- Kasaba projeleri ---------------- */
  Projects() {
    let html = _t('ui3.n_kasabayi_kalici_olarak_gelistiren', [img('square', 2)]);
    for (const P of V3.projects) {
      const st = Projects.st(P.id), left = Projects.left(P.id), done = Projects.done(P.id);
      html += _t('ui3.n_n_n_n_n', [done ? 'done2' : '', img(P.icon, 2), esc(P.name), done ? _t('ui3.tamamlandi_gun_n', [st.done]) : _t('ui3.kalan_n', [coin(left)]), st.paid / P.cost * 100, fmt(st.paid), fmt(P.cost), esc(P.look), esc(P.perk), done ? '' : _t('ui3.n_kalani_n', [[100, 500, 1000, 5000].map(n => `<button class="btn sm" data-a="projDonate" data-id="${P.id}" data-n="${n}" ${S.cash >= 1 && n <= left + 1e9 ? '' : 'disabled'}>${fmt(Math.min(n, left))}</button>`).join(''), P.id, left, S.cash >= 1 ? '' : 'disabled', fmt(Math.min(left, S.cash))])]);
    }
    if (Projects.done('lighthouse')) {
      const fc = Projects.st('lighthouse').fc || [];
      html += _t('ui3.n_fener_hava_tahmini_gun', [img('proj_lighthouse', 1, 'ic'), S.day + 1, [0, 1].map(i => `<select data-fc="${i}">${REGIONS.map(r => `<option value="${r.id}" ${fc[i] === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select>`).join(''), Projects.forecast().map(f => `<div class="kv"><span>${esc(REGION[f.rid].name)}</span><b>${img(f.wx, 1, 'ic')} ${WEATHER_TR[f.wx]}</b></div>`).join('')]);
    }
    return { title: _t('ui3.kasaba_projeleri'), icon: 'proj_pier', npc: Game.sceneName === 'Town' ? 'hasan' : null, html, cls: 'wide' };
  },
  /* ---------------- Sefer raporları ---------------- */
  TripLog() {
    const L = S.tripLog.slice().reverse();
    const html = L.length ? L.map((r, i) => _t('ui3.n_gun_n_n_n', [S.tripLog.length - 1 - i, img('report', 2), r.day, esc(r.stops.map(x => REGION[x].name).join(' → ')), esc(r.boatName), V3.dayparts[r.daypart].name, r.manual, r.auto, fmt(r.fuel), fmt(r.value)])).join('') : _t('ui3.henuz_sefer_raporu_yok_tekneyle');
    return { title: _t('ui3.sefer_raporlari_son_10'), icon: 'report', html: _t('ui3.n_raporlardaki_satis_degeri_yalnizca', [html]), cls: 'wide' };
  },
  /* ---------------- Filo: iş ilanları ---------------- */
  FleetJobs() {
    const fs = this.sel.fl || (this.sel.fl = {}); const idle = S.boats.owned.filter(b => Fleet.status(b) === 'idle');
    if (!fs.boat || !idle.includes(fs.boat)) fs.boat = idle[0] || null;
    const cand = Fleet.candidates(); Save.soon();
    let html = _t('ui3.n_bugunun_adaylari_gun_n', [img('jobs', 2), S.day]);
    html += _t('ui3.1_tekne_n', [idle.length ? `<div class="optgrid">${idle.map(b => { const n = Inv.total('boat:' + b); return `<button class="opt ${fs.boat === b ? 'on' : ''}" data-a="flSel" data-k="boat" data-v="${b}"><img class="pix" style="width:64px" src="${boatThumb(b)}" alt=""><b>${esc(BOAT[b].name)}</b><small>${n ? _t('ui3.depoda_n_balik', [n]) : _t('ui3.depo_bos')}</small></button>`; }).join('')}</div>` : `<p class="dim">${S.boats.owned.length < 2 ? _t('ui3.filo_icin_ikinci_bir_tekne') : _t('ui3.bosta_tekne_yok_aktif_tekne')}</p>`]);
    html += _t('ui3.2_balikci_n', [cand.map(id => { const n = FLEETNPC[id]; const busy = Fleet.busyNpc(id); return _t('ui3.n_n_ucret_n_n', [fs.npc === id ? 'on' : '', busy ? 'lock' : '', busy ? 'noop' : 'flSel', id, portraitUrl(n.look, 2), esc(n.name), esc(n.title), String(n.mult.toFixed(2)).replace('.', I18N.num.dec), busy ? _t('ui3.gorevde') : esc(n.desc)]); }).join('')]);
    if (fs.boat && fs.npc) {
      html += _t('ui3.3_bolge_n', [Object.keys(V3.fleetDays).map(rid => { const re = Boats.reach(rid, fs.boat); const pool = re.ok ? Fleet.pool(fs.npc, rid, fs.boat) : []; const c = Fleet.cost(fs.npc, rid); const ok = re.ok && pool.length; return _t('ui3.n_n_gun_n_para', [fs.rid === rid ? 'on' : '', ok ? '' : 'lock', ok ? 'flSel' : 'noop', rid, esc(REGION[rid].name), V3.fleetDays[rid], fmt(c.total), !re.ok ? _t('ui3.tekne_ulasamaz') : !pool.length ? _t('ui3.once_kendin_kesfet') : _t('ui3.n_bilinen_tur', [pool.length])]); }).join('')]);
    }
    if (fs.boat && fs.npc && fs.rid) {
      const c = Fleet.cost(fs.npc, fs.rid); const err = Fleet.check(fs.boat, fs.npc, fs.rid); const pool = Fleet.pool(fs.npc, fs.rid, fs.boat).sort((a, b) => b.w - a.w);
      html += _t('ui3.4_onay_yevmiye_n_yakit', [coin(c.wage), coin(c.fuel), coin(c.total), S.day + V3.fleetDays[fs.rid], Fleet.maxPower(fs.npc, fs.boat), pool.slice(0, 10).map(p => fishImgAlways(p.fid, 1, 'mini')).join(''), err ? `<div class="warnbox">${esc(err)}</div>` : '', err ? 'disabled' : '', img('fleet_out', 1, 'ic'), fmt(c.total)]);
    }
    return { title: _t('ui3.balikci_is_ilanlari'), icon: 'jobs', html, cls: 'wide' };
  },
  FleetDeliver(a) {
    const m = S.fleet.missions.find(x => x.id === a.id); if (!m || m.status !== 'back') return { title: _t('ui3.teslimat'), icon: 'crate', html: _t('ui3.bu_teslimat_tamamlandi_filo') };
    const N = FLEETNPC[m.npc]; const dest = this.sel.flDest || '';
    let html = _t('ui3.n_n_tekne_n_bolge', [portraitUrl(N.look, 2), esc(N.name), esc(N.title), esc(BOAT[m.boat].name), esc(REGION[m.rid].name), m.days, m.start, m.ret]);
    html += _t('ui3.yakalanan_n_balik_tahmini_taban', [m.result.n, coin(m.result.value), Object.entries(m.result.fish).map(([f, q]) => _t('ui3.n_n_n_taban_n', [fishImgAlways(f, 1, 'mini'), q, esc(FISH[f].name_tr), fmt(FISH[f].base_price), fmt(FISH[f].base_price * q)])).join('')]);
    html += _t('ui3.liman_teslim_kasasi_n_balik', [Fleet.leftN(m), !dest ? 'on' : '', Fleet.destinations().map(k => `<button class="btn sm ${dest === k ? 'on' : ''}" data-a="flDest" data-k="${k}">${esc(keyName2(k))} (${Inv.used(k)}/${Inv.cap(k)})</button>`).join('')]);
    html += _t('ui3.filo_n_baliklari_teslim_al', [m.id, Game.sceneName === 'Town' ? '' : 'disabled', img('crate', 1, 'ic')]);
    return { title: _t('ui3.npc_teslimati'), icon: 'crate', html, cls: 'wide' };
  }
});
/* ---- mevcut panellerin genişletilmesi ---- */
{
  const P1 = Object.assign({}, UI.P);
  UI.P.Boatyard = function () {
    const tab = this.curTab('yard', 'boats');
    const tabs = this.tabsHtml('yard', [['boats', _t('ui.tekneler')], ['ups', _t('ui.yukseltmeler')], ['auto', _t('ui.otomasyon')], ['look', _t('ui.gorunum')], ['fleet', _t('ui3.filo_yonetimi')]]);
    if (tab !== 'fleet') { const r = P1.Boatyard.call(this); r.tabs = tabs; if (tab === 'boats' && Game.sceneName === 'Town') r.html += this.guestBtnHtml('bora'); return r; }
    const cap = Fleet.capacity(), used = S.fleet.missions.length; const st = S.fleet.stats;
    let html = _t('ui3.n_bostaki_teknelerini_ucretli_balikcilarla', [img('fleet_out', 2), used, cap]);
    html += S.boats.owned.length ? S.boats.owned.map(b => {
      const s = Fleet.status(b), m = Fleet.missionOf(b); const N = m && FLEETNPC[m.npc];
      return `<div class="order"><div class="oh"><img class="pix" style="width:72px" src="${boatThumb(b)}" alt=""><b>${esc(BOAT[b].name)}</b>${S.boats.byId[b].name ? ' «' + esc(S.boats.byId[b].name) + '»' : ''}<span class="sp"></span><span class="badge ${s === 'back' ? 'new' : s === 'out' ? 'big' : 'rec'}">${img(stIcon[s], 1, 'ic')} ${stLabel[s]}</span></div>
        ${m ? _t('ui3.n_hedef_n_n_beklenen', [N ? `<img class="pix" style="width:20px;vertical-align:middle" src="${portraitUrl(N.look, 1)}" alt=""> <b>${esc(N.name)}</b> · ` : '', esc(REGION[m.rid].name), m.status === 'out' ? _t('ui3.kalan_n_oyun_gunu_gun', [Math.max(0, m.ret - S.day), m.ret]) : _t('ui3.dondu_gun_n', [m.backDay]), fmt(m.wage + m.fuel), m.status === 'back' ? _t('ui3.teslim_kasasinda_n_balik', [Fleet.leftN(m)]) : '']) : ''}
        <div class="of"><span class="sp"></span>${s === 'idle' ? _t('ui3.n_balikci_gorevlendir', [b, cap > used ? '' : 'disabled', img('jobs', 1, 'ic')]) : s === 'out' ? _t('ui3.sefer_bilgilerini_gor', [m.id]) : s === 'back' ? _t('ui3.n_baliklari_teslim_al', [m.id, img('crate', 1, 'ic')]) : _t('ui3.aktif_tekne_goreve_gonderilemez')}</div></div>`;
    }).join('') : _t('ui3.henuz_teknen_yok');
    html += _t('ui3.filo_istatistikleri_tamamlanan_gorev_n', [st.missions, st.fish, fmt(st.value), fmt(st.wages), fmt(st.fuel)]);
    if (S.fleet.log.length) html += _t('ui3.son_gorevler_n', [S.fleet.log.slice().reverse().map(l => _t('ui3.n_gun_n_n_n_2', [img('fleet_back', 1, 'ic'), l.start, l.ret, esc(FLEETNPC[l.npc].name), esc(BOAT[l.boat].name), esc(REGION[l.rid].name), l.n, Object.entries(l.fish).map(([f, q]) => q + ' ' + esc(FISH[f].name_tr)).join(', '), fmt(l.value), fmt(l.wage + l.fuel)])).join('')]);
    if (!inTownLike()) html = _t('ui3.gorev_baslatma_ve_teslimat_kasabadaki', [html]);
    return { title: _t('world.bora_nin_tekne_atolyesi'), icon: 'yard', npc: Game.sceneName === 'Town' ? 'bora' : null, tabs, html, cls: 'wide' };
  };
  UI.P.Square = function () { const r = P1.Square.call(this); r.html = _t('ui3.n_kasaba_projeleri_n_4', [img('proj_pier', 1, 'ic'), V3.projects.filter(p => Projects.done(p.id)).length, r.html]); return r; };
  UI.P.Dialog = function (a) { const r = P1.Dialog.call(this, a); if (V3.guestNpcs.includes(a.npc)) r.html = r.html.replace('<div class="btns">', this.guestBtnHtml(a.npc) + '<div class="btns">'); return r; };
  UI.P.Journal = function () {
    const tab = this.curTab('jr', 'guide'); if (this.sel.jrFish) return P1.Journal.call(this);
    const tabs = this.tabsHtml('jr', [['guide', _t('ui2.tur_rehberi')], ['today', _t('ui2.bugunku_av')], ['log', _t('ui2.av_kayitlari')], ['missing', _t('ui2.eksik_turler')], ['fav', _t('ui2.favoriler')], ['wild', _t('sys3.deniz_yasami')]]);
    if (tab === 'wild') return { title: _t('ui2.balikci_defteri'), icon: 'journal', tabs, html: this.wildHtml(), cls: 'wide' };
    const r = P1.Journal.call(this); r.tabs = tabs; if (tab === 'today') r.html = this.todayHtml(); return r;
  };
  UI.P.People = function () { const r = P1.People.call(this); r.html = (Guests.valid() ? _t('ui3.n_bugunku_misafirin_n_bir', [img('guest', 2), esc(NPCS[S.guest.npc].name)]) : _t('ui3.n_efe_ali_dayi_mert', [img('guest', 1, 'ic')])) + r.html; return r; };
  UI.P.Statistics = function () { const r = P1.Statistics.call(this); const st = S.fleet.stats; r.html = r.html.replace('<h4>v2</h4>', _t('ui3.v3_deniz_yasami_gozlemi_n', [Wildlife.count(), V3.wildlife.length, V3.projects.filter(p => Projects.done(p.id)).length, st.missions, st.fish, fmt(st.wages + st.fuel), sum(Object.values(S.guestLog)), S.tripLog.length])); return r; };
  UI.P.Menu = function () { const r = P1.Menu.call(this); r.html = r.html.replace('<button class="btn sm" data-a="photoOpen">', _t('ui3.n_n_filo_n_deniz', [[['Projects', 'proj_pier', _t('ui3.kasaba_projeleri')], ['TripLog', 'report', _t('ui3.sefer_raporlari')]].map(([p, i, n]) => `<button class="btn sm" data-a="openPanel" data-p="${p}">${img(i, 1, 'ic')} ${n}</button>`).join(''), img('fleet_out', 1, 'ic'), img('wild_book', 1, 'ic')])); return r; };
  UI.P.Help = function (a) {
    const r = P1.Help.call(this, a);
    r.html = _t('ui3.v3_0_yenilikleri_av_yontemleri', [img('m_float', 1, 'ic'), img('quick', 1, 'ic'), r.html]);
    return r;
  };
}
/* ---- yardımcı HTML ---- */
Object.assign(UI, {
  guestBtnHtml(npc) {
    if (!S.boats.active) return _t('ui3.n_bir_teknen_oldugunda_n', [img('guest', 1, 'ic'), esc(NPCS[npc].name)]);
    if (Guests.valid() && S.guest.npc === npc) return _t('ui3.n_n_bir_sonraki_tekne', [img('guest', 1, 'ic'), esc(NPCS[npc].name)]);
    return _t('ui3.n_n_yi_tekne_gezisine', [npc, Guests.valid() ? 'disabled' : '', img('guest', 1, 'ic'), esc(NPCS[npc].name), Guests.valid() ? _t('ui3.bugun_misafirin_n', [esc(NPCS[S.guest.npc].name)]) : '']);
  },
  wildHtml() {
    const n = Wildlife.count();
    let html = _t('ui3.n_deniz_yasami_gozlemleri_n', [img('wild_book', 2), n, V3.wildlife.length, img(S.ach.wild8 ? 'wild_badge' : 'lock', 1, 'ic'), img(S.ach.wild16 ? 'decor_poster_wild' : 'lock', 1, 'ic'), img(S.ach.wild24 ? 'title' : 'lock', 1, 'ic')]);
    html += REGIONS.map(r => { const L = Wildlife.pool(r.id); return `<h4>${esc(r.name)} <span class="dim">${L.filter(w => S.wild.seen[w.id]).length}/${L.length}</span></h4><div class="ency wildgrid">${L.map(w => { const e = S.wild.seen[w.id]; return `<div class="ecard ${e ? '' : 'lock'}" title="${esc(e ? w.info : _t('ui3.henuz_gozlenmedi'))}"><img class="pix" src="${wildUrl(w.id, 2, !!e)}" alt=""><span><b>${e ? esc(w.name) : '???'}</b></span>${e ? _t('ui3.n_ilk_gun_n_n', [esc(w.info), e.first, esc(REGION[e.rid].name), e.n]) : _t('ui3.n_sularinda', [esc(REGION[w.rid].name)])}</div>`; }).join('')}</div>`; }).join('');
    return _t('ui3.n_canlilar_yakalanmaz_satilmaz_envantere', [html, Wildlife.DAILY_MAX, Projects.done('terrace') ? _t('ui3.seyir_terasi_karsilasma_ihtimali_10') : '']);
  },
  /* Bugünkü Av: Yakalama Şansı ve Kazanç Potansiyeli modları (gerçek seçim formülüyle, garanti yok) */
  todayHtml() {
    const mode = this.sel.jrMode || 'chance'; const rows = Journal.today3(mode, 10); const dp = Dayparts.cur();
    let h = _t('ui3.yakalama_sansi_kazanc_potansiyeli', [mode === 'chance' ? 'on' : '', mode === 'profit' ? 'on' : '']);
    h += _t('ui3.n_n_28_olta_gucu', [SEASON_TR[World.season()], World.seasonDay(), rodOf().power, V3.dayparts[dp].name, mode === 'profit' ? _t('ui3.atis_basina_tahmini_net_vurma') : _t('ui3.gorulme_agirliklarina_gore_en_yuksek')]);
    h += rows.length ? rows.map(x => { const f = FISH[x.fid], sp = SPOTS[x.spot]; return _t('ui3.n_n_av_uygunlugu_n', [fishImgAlways(x.fid, 1, 'mini'), esc(upTR(f.name_tr)), x.p >= .2 ? 'new' : x.p >= .1 ? 'big' : 'rec', Journal.level(x.p), esc(REGION[x.rid].name), esc(sp.name), esc(BAIT[x.bait].name), BAND_TR[x.band], V3.methods[x.method].short, Math.round(x.p * 100), mode === 'profit' ? _t('ui3.teklif_n_n_yem_n', [fmt(x.unit), esc(x.via), fmt(x.baitC), fmt(Math.round(x.fuelC * 10) / 10), x.ev >= 0 ? '+' : '', (Math.round(x.ev * 10) / 10).toString().replace('.', I18N.num.dec)]) : '', x.fid, img('plan', 1, 'ic')]); }).join('') : _t('ui2.henuz_oneri_icin_yeterli_kesif');
    return _t('ui3.n_hesap_fishdb_agirliklari_yem', [h]);
  },
  showTripReport(rep) {
    const fishRows = Object.entries(rep.fish).sort((a, b) => b[1] - a[1]);
    this.showModal(_t('ui3.n_sefer_raporu_gun_n', [img('report', 2), rep.day, esc(rep.boatName), img(V3.dayparts[rep.daypart].icon, 1, 'ic'), V3.dayparts[rep.daypart].name, esc(rep.stops.map(x => REGION[x].name).join(' → ')), rep.manual, rep.auto, rep.energy, fmt(rep.baitCost), fmt(rep.fuel), coin(rep.value), rep.spots.map(s => esc(SPOTS[s].name)).join(' · ') || '—', fishRows.length ? _t('ui3.yakalananlar_n', [fishRows.map(([f, q]) => `<span class="small">${fishImgAlways(f, 1, 'mini')} ${q}× ${esc(FISH[f].name_tr)}</span>`).join(' ')]) : _t('ui3.bu_seferde_balik_yakalanmadi'), rep.newSp.length ? _t('ui3.yeni_turler_n', [rep.newSp.map(f => esc(FISH[f].name_tr)).join(', ')]) : '', rep.recs.length ? _t('ui3.kirilan_rekorlar_n', [rep.recs.map(r => esc(FISH[r.fid].name_tr) + ' ' + r.cm + ' cm').join(', ')]) : '', rep.wild.length ? _t('ui3.n_gozlemler_n', [img('wild_book', 1, 'ic'), rep.wild.map(w => esc(WILD[w].name)).join(', ')]) : '', rep.guest ? _t('ui3.n_misafir_n', [img('guest', 1, 'ic'), esc(NPCS[rep.guest].name)]) : '']), 'wide');
  },
  showFleetReturns() {
    const L = S.fleet.missions.filter(m => m.status === 'back' && !m.notified); if (!L.length) return; L.forEach(m => m.notified = true); Save.soon();
    this.showModal(_t('ui3.n_balikci_limana_dondu_n', [img('fleet_back', 2), L.map(m => { const N = FLEETNPC[m.npc]; return _t('ui3.n_n_n_n_gun', [portraitUrl(N.look, 2), esc(N.name), esc(BOAT[m.boat].name), esc(REGION[m.rid].name), m.days, m.result.n, Object.entries(m.result.fish).map(([f, q]) => q + ' ' + esc(FISH[f].name_tr) + ' (' + fmt(FISH[f].base_price) + ')').join(', '), coin(m.result.value), m.id, img('crate', 1, 'ic')]); }).join('')]), 'wide');
  }
});
/* Journal: tek geçişte (nokta × yem × mesafe × yöntem) hesap, her tür için en iyi plan */
Journal.today3 = function (mode, limit) {
  const known = new Set(FISH_LIST.filter(f => S.ency[f.id] && S.ency[f.id].caught).map(f => f.id)); if (!known.size) return [];
  const rp = rodOf().power; const dp = Dayparts.cur(); const casts = Math.max(1, Math.floor(CORE.daily_energy / rodOf().energy)); const best = {};
  const baits = BAITS.filter(b => b.id === 'basic' || (mode === 'chance' ? true : S.baitStock[b.id] > 0));
  const offer = fid => { let u = FISH[fid].base_price, via = _t('core.balik_hali'); for (const o of Orders.active()) if (o.fishId === fid && Orders.remaining(o) > 0 && o.unitPrice > u) { u = o.unitPrice; via = _t('ui3.ilan_n', [CUST[o.customerId].name]); } if (Tea.special() === fid && Tea.left() > 0 && Tea.price(fid) > u) { u = Tea.price(fid); via = _t('core.cay_bahcesi'); } return { u, via }; };
  const offers = {}; for (const f of known) offers[f] = offer(f);
  for (const sp of SPOT_LIST) {
    if (!S.world.unlocked[sp.region_id]) continue; if (!Object.keys(sp.weights).some(f => known.has(f))) continue;
    const fuelC = sp.region_id === 'sakin_liman' ? 0 : REGION[sp.region_id].trip_fuel_cost / casts;
    for (const b of baits) for (const band of ['near', 'mid', 'far']) for (const m of METHOD_IDS) {
      const w = Selector.weights(sp.id, { rodPower: rp, bait: b.id, band, method: m, daypart: dp });
      const baitC = b.id === 'basic' ? 0 : BAIT[b.id].purchase_price;
      for (const x of w.list) {
        if (!known.has(x.id)) continue; const of = offers[x.id];
        const ev = sp.base_bite_chance * x.p * of.u - baitC - fuelC; const score = mode === 'profit' ? ev : x.p;
        const cur = best[x.id]; if (!cur || score > cur.score + 1e-9) best[x.id] = { fid: x.id, spot: sp.id, rid: sp.region_id, bait: b.id, band, method: m, p: x.p, fac: x.fac, unit: of.u, via: of.via, baitC, fuelC, ev, score };
      }
    }
  }
  return Object.values(best).sort((a, b) => b.score - a.score).slice(0, limit || 10);
};
/* ---- av ekranı: yöntem / gün ışığı ayarı, hızlı tekrar, rota ---- */
{
  const fb0 = UI.fishBar.bind(UI);
  UI.fishBar = function (sc) {
    fb0(sc);
    const br = this.bottom.querySelector('.br'); const bb = $('baitBtn');
    if (br && bb) bb.insertAdjacentHTML('beforebegin', _t('ui3.n_tekrar_av_yontemi_ve', [img('quick', 2)]));
    const bl = this.bottom.querySelector('.bl');
    if (bl && Game.sceneName === 'BoatFishing' && S.trip && Trips.maxStops(S.trip.boat) > 1) bl.insertAdjacentHTML('beforeend', _t('ui3.n_rota_ikinci_durak', [img('route', 2)]));
    this.fishBarUpdate();
  };
  const fu0 = UI.fishBarUpdate.bind(UI);
  UI.fishBarUpdate = function () {
    fu0(); const ph = Fishing.phase;
    const fsb = $('fishSetBtn'); if (fsb) { const m = Fishing.castMethod(); const h = img(V3.methods[m].icon, 2) + `<span class="lbl">${V3.methods[m].short}</span>`; if (fsb._h !== h) { fsb._h = h; fsb.innerHTML = h; } fsb.disabled = ph !== 'READY'; }
    const qb = $('quickBtn'); if (qb) qb.style.display = (ph === 'READY' && S.lastCast && S.quickCast) ? '' : 'none';
    const rb = $('routeBtn'); if (rb) rb.style.display = (S.trip && Trips.canAddStop() && ph === 'READY') ? '' : 'none';
  };
  const sc0 = UI.showCatch.bind(UI);
  UI.showCatch = function (c, storage) { sc0(c, storage); if (!storage && S.quickCast && S.lastCast) { const b = this.modalEl.querySelector('[data-a=catchClose]'); if (b) b.insertAdjacentHTML('beforebegin', _t('ui3.n_onceki_atisi_tekrarla', [img('quick', 1, 'ic')])); } };
  /* deniz haritası paneli */
  const mp0 = UI.mapPanel.bind(UI);
  UI.mapPanel = function (sc) {
    if (sc.travel) return mp0(sc);
    if (sc.leg && S.trip) {
      const R = REGION[sc.sel]; const t = S.trip; const re = Boats.reach(R.id, t.boat); const c = Trips.legCost(R.id); const cur = Trips.cur();
      const bad = R.id === cur ? _t('sys3.zaten_bu_bolgedesin') : t.stops.includes(R.id) ? _t('ui3.bu_bolge_bu_seferde_ziyaret') : !re.ok ? _t('ui3.bu_tekne_ulasamaz_n', [re.miss.join(', ')]) : S.cash < c ? _t('ui3.yakit_icin_para_yetmiyor') : null;
      this.sceneui.innerHTML = _t('ui3.n_ikinci_durak_sefer_n', [img('route', 2), esc(t.stops.map(x => REGION[x].name).join(' → ')), V3.dayparts[t.daypart].name, esc(R.name), img(S.world.weather[R.id], 1, 'ic'), coin(c), bad ? `<div class="bad">✗ ${esc(bad)}</div>` : _t('ui3.gidilebilir'), img('boat', 1, 'ic'), img('home', 1, 'ic'), bad ? 'disabled' : '', fmt(c)]);
      return;
    }
    mp0(sc); const box = this.sceneui.querySelector('.mapinfo'); if (!box) return; const bid = S.boats.active;
    const dpHtml = _t('ui3.gun_isigi_n_2', [DAYPART_IDS.map(d => `<button class="btn sm ${S.daypart === d ? 'on' : ''}" data-a="dpSel" data-v="${d}">${img(V3.dayparts[d].icon, 1, 'ic')} ${V3.dayparts[d].name}</button>`).join('')]);
    const ms = bid ? Trips.maxStops(bid) : 1; const info = `<div class="dim small">${img('route', 1, 'ic')} ${bid ? esc(BOAT[bid].name) + ': ' + (ms > 1 ? _t('ui3.bir_seferde_en_fazla_2') : _t('ui3.tek_bolgelik_sefer')) : ''}${Guests.valid() ? _t('ui3.misafir_n', [esc(NPCS[S.guest.npc].name)]) : ''}</div>`;
    const fc = Projects.forecast(); const fcHtml = fc.length ? _t('ui3.n_yarin_n', [img('proj_lighthouse', 1, 'ic'), fc.map(f => esc(REGION[f.rid].name) + ' ' + WEATHER_TR[f.wx]).join(' · ')]) : '';
    const btns = box.querySelector('.btns'); if (btns) btns.insertAdjacentHTML('beforebegin', dpHtml + info + fcHtml);
    const cyc = box.querySelector('[data-a=cycleBoat]'); if (cyc && S.boats.owned.filter(b => !Fleet.onMission(b)).length < 2) cyc.remove();
  };
}
/* ---- eylemler ---- */
Object.assign(UI.A, {
  fishSet() {
    if (Fishing.phase !== 'READY') return; const comp = Comp.active() && Game.sceneName === 'PierFishing'; const atSea = !!S.trip;
    const m = Methods.cur(), dp = Dayparts.cur();
    this.showModal(_t('ui3.n_av_ayarlari_n_av', [img(V3.methods[m].icon, 2), comp ? _t('ui3.yarismada_standart_samandirali_av_ve') : '', METHOD_IDS.map(id => `<button class="opt ${m === id ? 'on' : ''} ${comp ? 'lock' : ''}" data-a="${comp ? 'noop' : 'setMethod'}" data-m="${id}">${img(V3.methods[id].icon, 2)}<b>${V3.methods[id].name}</b><small>${esc(V3.methods[id].desc)}</small></button>`).join(''), atSea ? _t('ui3.n_n_sefer_boyunca_sabit', [img(V3.dayparts[dp].icon, 1, 'ic'), V3.dayparts[dp].name]) : `<div class="optgrid">${DAYPART_IDS.map(id => `<button class="opt ${dp === id ? 'on' : ''} ${comp ? 'lock' : ''}" data-a="${comp ? 'noop' : 'setDaypart'}" data-v="${id}">${img(V3.dayparts[id].icon, 2)}<b>${V3.dayparts[id].name}</b><small>${esc(V3.dayparts[id].desc)}</small></button>`).join('')}</div>`, S.quickCast ? 'checked' : '']), 'wide');
  },
  setMethod(d) { const r = Methods.set(d.m); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); this.closeModal(); this.fishBarUpdate(); if (r.ok) this.toastNow(_t('ui3.yontem_n', [V3.methods[d.m].name]), 'good', V3.methods[d.m].icon); },
  setDaypart(d) { const r = Dayparts.set(d.v); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); this.closeModal(); if (r.ok) this.toastNow(_t('ui3.gun_isigi_n', [V3.dayparts[d.v].name]), 'good', V3.dayparts[d.v].icon); },
  dpSel(d) { const r = Dayparts.set(d.v); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); if (Game.sceneName === 'SeaMap') this.mapPanel(Game.scene); },
  quickCast() { Fishing.quickCast(); this.fishBarUpdate(); },
  quickCastCard() { this.closeModal(); Fishing.resultClosed(); this.fishBarUpdate(); Fishing.quickCast(); this.fishBarUpdate(); },
  nextStop() { if (Fishing.locked() || !S.trip) return; if (!Trips.canAddStop()) { this.toastNow(_t('ui3.bu_seferde_baska_durak_eklenemez'), 'warn'); return; } go('SeaMap', {}); },
  mapBackSea() { go('BoatFishing', { rid: Trips.cur() }); },
  tripShow(d) { const r = S.tripLog[+d.i]; if (r) this.showTripReport(r); },
  projDonate(d) { const P = PROJ[d.id]; const amt = Math.min(+d.n, Projects.left(d.id), S.cash); if (amt <= 0) { this.toastNow(_t('sys3.bagis_icin_paran_yok'), 'warn'); return; } this.confirm({ title: P.name, icon: P.icon, price: amt, text: _t('ui3.n_para_bagislanacak_kalan_n', [fmt(amt), fmt(Projects.left(d.id) - amt)]), ok: _t('ui3.bagisla'), onOk: () => { const r = Projects.donate(d.id, amt); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); else if (r.ok) { this.toastNow(_t('ui3.bagis_n', [fmt(r.amt)]), 'good', 'coin'); if (r.done) this.closePanel(); } } }); },
  jrMode(d) { this.sel.jrMode = d.m; this.renderPanel(true); },
  wildOpen() { this.tab.jr = 'wild'; this.sel.jrFish = null; this.openPanel('Journal'); },
  guestInvite(d) { const r = Guests.invite(d.npc); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(_t('ui3.n_bir_sonraki_tekne_gezine', [NPCS[d.npc].name]), 'good', 'guest'); this.renderPanel(true); },
  guestCancel() { Guests.cancel(); this.renderPanel(true); },
  flOpen() { this.tab.yard = 'fleet'; this.openPanel('Boatyard'); },
  flJobs(d) { if (!inTownLike()) { this.toastNow(_t('ui3.gorevlendirme_icin_kasabadaki_limana_git'), 'warn'); return; } this.sel.fl = { boat: d.b }; this.openPanel('FleetJobs'); },
  flSel(d) { const fs = this.sel.fl || (this.sel.fl = {}); fs[d.k] = d.v; this.renderPanel(true); },
  flStart() {
    const fs = this.sel.fl || {}; const c = Fleet.cost(fs.npc, fs.rid); const N = FLEETNPC[fs.npc];
    this.confirm({ title: _t('ui3.gorevi_onayla'), icon: 'fleet_out', price: c.total, html: _t('ui3.n_n_n_n_oyun', [esc(N.name), esc(BOAT[fs.boat].name), esc(REGION[fs.rid].name), V3.fleetDays[fs.rid], S.day + V3.fleetDays[fs.rid]]), ok: _t('ui3.gorevlendir'), onOk: () => { const r = Fleet.start(fs.boat, fs.npc, fs.rid); if (!r.ok) this.toastNow(r.msg, 'warn'); else { this.toastNow(_t('ui3.n_n_yolunda', [N.name, REGION[fs.rid].name]), 'good', 'fleet_out'); this.sel.fl = {}; this.tab.yard = 'fleet'; this.openPanel('Boatyard'); } } });
  },
  flInfo(d) { const m = S.fleet.missions.find(x => x.id === d.id); if (!m) return; const N = FLEETNPC[m.npc]; this.confirm({ title: _t('ui3.sefer_bilgisi'), icon: 'fleet_out', html: _t('ui3.n_n_n_n_cikis', [portraitUrl(N.look, 2), esc(N.name), esc(N.title), esc(BOAT[m.boat].name), esc(REGION[m.rid].name), m.start, m.ret, Math.max(0, m.ret - S.day), fmt(m.wage), fmt(m.fuel)]), ok: _t('ui.tamam'), cancel: _t('ui.kapat') }); },
  flDeliver(d) { this.closeModal(); this.sel.flDest = ''; this.openPanel('FleetDeliver', { id: d.id }); },
  flDest(d) { this.sel.flDest = d.k; this.renderPanel(true); },
  flCollect(d) { const r = Fleet.collect(d.id, this.sel.flDest || null); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(_t('ui3.n_balik_teslim_alindi_n', [r.n, r.done ? _t('ui3.tekne_yeniden_kullanilabilir') : _t('ui3.kasada_n_balik_bekliyor', [r.left])]), r.done ? 'good' : 'warn', 'crate'); if (r.ok && r.done) { this.tab.yard = 'fleet'; this.openPanel('Boatyard'); } }
});
{
  const oi0 = UI.onInput.bind(UI);
  UI.onInput = function (e) { const t = e.target; if (t.dataset.fc != null) { Projects.setForecast(+t.dataset.fc, t.value); this.renderPanel(true); return; } if (t.dataset.qc) { S.quickCast = t.checked; Save.soon(); this.fishBarUpdate(); return; } return oi0(e); };
}
