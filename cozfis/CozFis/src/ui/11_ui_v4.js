'use strict';
/* ---- 11_ui_v4.js ---- */
/* =====================================================================
   11_ui_v4.js : v4.0 arayüzü — kompakt sonuç, av temposu ayarı, Balıkçı Birliği, Kasaba Hikâyeleri ve
   Hatıra Albümü, Trofe Avları ve Kıyı Koleksiyonu sekmeleri, Kıyı Keşfi ve dürbün kontrolleri
   ===================================================================== */
const ALBUM_TXT = {
  efe_photo: _LA([_L(() => _t('sys4.efe_nin_eski_fotografi')), 'decor_efe_foto', 'efe']), mert_trip: _LA([_L(() => _t('ui4.ilk_yolculuk_hatirasi_pusula')), 'al_mert_trip', 'mert']), elif_drawings: _LA([_L(() => _t('ui4.iki_deniz_cizimi')), 'decor_elif_pano', 'elif']),
  kerem_exhibit: _LA([_L(() => _t('ui4.kerem_in_deniz_sergisi')), 'decor_deniz_sergisi', 'kerem']), bora_plate: _LA([_L(() => _t('sys4.bora_nin_hatira_levhasi')), 'decor_bora_levha', 'bora'])
};
Object.assign(UI, {
  /* normal avlarda ~1 sn'lik küçük sonuç; yeni atış başlayınca kapanır, oyunu durdurmaz */
  showCompact(c) {
    const el = $('compact'); if (!el || QA.silent) return; const f = FISH[c.fid]; this._compactC = c;
    el.innerHTML = _t('ui4.n_n_cm_n_kg', [fishUrl(c.fid, 1), esc(f.name_tr), c.size.cm, fmtKg(c.size.kg), coin(f.base_price), esc(c.where === 'bag' ? _t('ui.canta') : Inv.label(c.where)), S.lastCast ? '' : 'disabled', img('quick', 1, 'ic')]);
    el.style.display = ''; const st = $('storytrack'); if (st) st.style.visibility = 'hidden'; clearTimeout(this._compactTm); this._compactTm = setTimeout(() => this.hideCompact(), 2600);
  },
  hideCompact() { const st = $('storytrack'); if (st) st.style.visibility = ''; const el = $('compact'); if (el && el.style.display !== 'none') { el.style.display = 'none'; el.innerHTML = ''; } clearTimeout(this._compactTm); },
  storyTracker() {
    const el = $('storytrack'); if (!el || !S || !S.storyTrack) return; const show = S.storyTrack.length && ['Town', 'PierFishing', 'BoatFishing', 'Home'].includes(Game.sceneName) && !Game.photo && !['REELING', 'QUICK_PULL', 'BITE_WINDOW', 'CHARGING'].includes(Fishing.phase) && !(Game.scene && Game.scene.bin);
    const html = show ? _t('ui4.hikayeler_n', [S.storyTrack.map(n => `<div>${esc(NPCS[n].name)}: ${esc(Stories.goal(n))}</div>`).join('')]) : '';
    if (el._h !== html) { el._h = html; el.innerHTML = html; el.style.display = show ? '' : 'none'; }
  },
  storyBox(npc) {
    const s = Stories.st(npc); const D = V4.stories[npc];
    if (s.stage === 0) return _t('ui4.n_n_acilma_n', [img('story', 1, 'ic'), esc(D.title), esc(D.unlock)]);
    if (s.stage === 4) return _t('ui4.n_n_tamamlandi_gun_n', [img('story', 1, 'ic'), esc(D.title), s.done]);
    const talk = Stories.canTalk(npc) && (npc !== 'bora' || Game.sceneName === 'Town');
    return _t('ui4.n_n_asama_n_3', [img('story', 2), esc(D.title), s.stage, esc(Stories.goal(npc)), talk ? `<div class="btns left"><button class="btn g sm" data-a="storyTalk" data-npc="${npc}">${npc === 'mert' && s.stage === 1 ? _t('ui4.konus_ve_geziye_davet_et') : _t('ui4.konus')}</button></div>` : '']);
  },
  shoreBar(sc) {
    const s = Shore.session(); const env = s ? s.env : sc.env;
    this.bottom.innerHTML = _t('ui4.n_kasaba_n_n_n', [img('exit', 2), esc(V4.shoreEnv[env].name), { sand: _t('ui4.ipucu_olan_noktayi_kaz'), rocks: _t('ui4.kabarcikli_kayayi_kaldir'), tide: _t('ui4.su_cekilince_parlayani_sec') }[env], s && !s.done ? '' : 'disabled', img('inspect', 2), img('shore', 2)]);
  },
  shoreResult() {
    const s = S.shore.session; if (!s || !s.done) return;
    this.showModal(_t('ui4.n_kiyi_kesfi_tamamlandi_n', [img('shore', 2), s.found.map(id => `<div class="opt"><img class="pix" style="width:48px" src="${shoreUrl(id, 3, true)}" alt=""><b>${esc(SHORE[id].name)}</b><small>${esc(SHORE[id].cat)}${(s.newItems || []).includes(id) ? _t('ui4.yeni') : _t('ui4.tekrar_n_kez', [S.shore.items[id].n])}</small></div>`).join(''), Shore.count(), V4.shore.length, s.taps, s.hints ? ' · ' + s.hints + ' ipucu' : '']), 'wide');
  }
});
/* ---- paneller ---- */
Object.assign(UI.P, {
  Guild() {
    const G = Guild.ensure(); if (!G) return { title: _t('ui4.balikci_birligi'), icon: 'guild', html: _t('ui4.birlik_panosu_3_oyun_gununde') };
    const end = G.week * 7; const stg = { early: _t('ui4.baslangic'), mid: _t('ui4.orta_oyun'), late: _t('ui4.ileri_oyun') }[Guild.stage()];
    let html = _t('ui4.n_n_hafta_gun_n', [img('guild', 2), G.week, end - 6, end, G.rerolled ? _t('ui4.gorev_degistirme_hakkini_kullandin') : _t('ui4.1_ucretsiz_gorev_degistirme_hakkin'), stg]);
    html += G.tasks.map(t => { const T = GUILDT[t.id]; const r = t.reward; return `<div class="guildtask ${t.claimed ? 'claimed' : t.done ? 'done' : ''}"><div class="row"><span class="badge ${T.nonFish ? 'new' : 'big'}">${T.id}</span><div class="grow"><b>${esc(T.name)}</b> ${T.nonFish ? _t('ui4.balik_tutmadan') : ''}<div class="small">${esc(T.desc)}</div><div class="bar"><i style="width:${t.prog / T.need * 100}%"></i><span>${t.prog}/${T.need}</span></div></div><div class="center small">${coin(r.cash)}<br>+${r.n} ${esc(BAIT[r.bait].name)}</div></div><div class="of"><span class="sp"></span>${t.claimed ? _t('ui4.odul_alindi') : t.done ? _t('ui4.odulu_al', [t.id]) : _t('ui4.gorevi_degistir', [t.id, G.rerolled ? 'disabled' : ''])}</div></div>`; }).join('');
    const tot = sum(G.tasks.map(t => Guild.value(t.reward)));
    html += _t('ui4.haftalik_toplam_odul_degeri_n', [fmt(tot)]);
    return { title: _t('ui4.balikci_birligi'), icon: 'guild', html, cls: 'wide' };
  },
  Stories() {
    const tab = this.curTab('st', 'stories'); const tabs = this.tabsHtml('st', [['stories', _t('ui4.kasaba_hikayeleri')], ['album', _t('ui4.hatira_albumu')]]);
    let html = '';
    if (tab === 'stories') html = _t('ui4.n_hikayelerin_sure_siniri_veya', [STORY_NPCS.map(n => { const s = Stories.st(n), D = V4.stories[n]; const tr = S.storyTrack.includes(n); return _t('ui4.n_n_acilma_sarti_n', [s.stage === 4 ? 'done2' : '', portraitUrl(NPCS[n].look, 2), esc(D.title), s.stage === 4 ? 'new' : s.stage ? 'big' : 'rec', s.stage === 4 ? _t('sys4.tamamlandi') : s.stage ? _t('ui4.asama_n_3', [s.stage]) : _t('ui4.kilitli'), esc(D.unlock), s.stage === 4 ? _t('ui4.odul_alindi_2') : _t('ui4.sonraki_hedef'), esc(Stories.goal(n)), esc(D.reward.name), s.stage >= 1 && s.stage < 4 ? `<button class="btn sm ${tr ? 'on' : ''}" data-a="storyTrack" data-npc="${n}">${tr ? _t('ui4.takibi_birak') : _t('ui4.hud_da_takip_et')}</button>` : '']); }).join('')]);
    else html = S.album.length ? S.album.map(a => { const T = TROPHY[a.id]; if (T) return _t('ui4.n_n_trofe_gun_n', [img('tr_' + a.id, 2), esc(T.name), a.day, esc(FISH[T.fid].name_tr), S.trophy.done[a.id].cm, fmtKg(S.trophy.done[a.id].kg), esc(T.reward.name)]); const A = ALBUM_TXT[a.id]; if (!A) return ''; const D = V4.stories[A[2]]; return _t('ui4.n_n_n_gun_n', [img(A[1], 2), esc(A[0]), esc(NPCS[A[2]].name), a.day, D.stages.map(st => st.talk || st.found).filter(Boolean).map(x => '“' + esc(x) + '”').join('<br>')]); }).join('') : _t('ui4.album_bos_tamamlanan_hikayeler_ve');
    return { title: _t('ui4.kasaba_hikayeleri'), icon: 'story', tabs, html, cls: 'wide' };
  }
});
{
  const P2 = Object.assign({}, UI.P);
  UI.P.Journal = function () {
    const tab = this.curTab('jr', 'guide'); if (this.sel.jrFish) return P2.Journal.call(this);
    const tabs = this.tabsHtml('jr', [['guide', _t('ui2.tur_rehberi')], ['today', _t('ui2.bugunku_av')], ['log', _t('ui2.av_kayitlari')], ['missing', _t('ui2.eksik_turler')], ['fav', _t('ui2.favoriler')], ['wild', _t('sys3.deniz_yasami')], ['trophy', _t('ui4.trofe_avlari')], ['shore', _t('sys4.kiyi_koleksiyonu')]]);
    if (tab === 'trophy') return { title: _t('ui2.balikci_defteri'), icon: 'journal', tabs, html: this.trophyHtml(), cls: 'wide' };
    if (tab === 'shore') return { title: _t('ui2.balikci_defteri'), icon: 'journal', tabs, html: this.shoreHtml(), cls: 'wide' };
    const r = P2.Journal.call(this); r.tabs = tabs; return r;
  };
  UI.P.People = function () { const r = P2.People.call(this); r.html = _t('ui4.n_kasaba_hikayeleri_n_5', [img('story', 1, 'ic'), STORY_NPCS.filter(n => Stories.st(n).stage === 4).length, img('album', 1, 'ic'), r.html]); return r; };
  UI.P.Dialog = function (a) { const r = P2.Dialog.call(this, a); if (V4.stories[a.npc]) r.html = r.html.replace('<div class="btns">', this.storyBox(a.npc) + '<div class="btns">'); return r; };
  UI.P.HomeGoods = function () { const r = P2.HomeGoods.call(this); r.html = this.storyBox('kerem') + (Stories.st('kerem').stage === 4 ? _t('ui4.n_sergi_kosesi_n', [img('decor_deniz_sergisi', 2), Object.keys(S.shore.items).slice(0, 8).map(id => esc(SHORE[id].name)).join(', ')]) : '') + r.html; return r; };
  UI.P.Boatyard = function () { const r = P2.Boatyard.call(this); if (this.curTab('yard', 'boats') === 'boats') r.html = this.storyBox('bora') + r.html; if (this.curTab('yard', 'boats') === 'look' && S.boats.owned.length) { const selB = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : S.boats.active; const b = S.boats.byId[selB]; const orn = S.cosmetics.ornaments || []; r.html += _t('ui4.trofe_susleri_n', [['orn_tr_levrek', 'orn_tr_barrakuda'].map(id => { const own = orn.includes(id); const T = V4.trophies.find(t => t.reward.id === id); return `<button class="opt ${b && b.ornament === id ? 'on' : ''} ${own ? '' : 'lock'}" data-a="${own ? 'ornSet' : 'noop'}" data-id="${id}">${img(id, 2)}<b>${esc(T.reward.name)}</b><small>${own ? (b && b.ornament === id ? _t('ui2.takili') : _t('ui2.tak')) : _t('ui4.trofe_n', [esc(T.name)])}</small></button>`; }).join('')]); } return r; };
  UI.P.Menu = function () { const r = P2.Menu.call(this); const nb = k => Unlocks.fresh(k) ? _t('ui4.yeni_2') : ''; r.html = r.html.replace('<button class="btn sm" data-a="photoOpen">', _t('ui4.n_birlik_n_n_hikayeler', [img('guild', 1, 'ic'), nb('guild'), img('story', 1, 'ic'), nb('boatStories') || nb('efe'), img('trophy_t', 1, 'ic'), nb('trophy'), img('shore', 1, 'ic'), nb('shore')])); return r; };
  UI.P.Settings = function () { const r = P2.Settings.call(this); const inGame = !!S && Game.sceneName !== 'MainMenu'; const tg = (k, n, d) => `<label class="kv tg"><input type="checkbox" data-set="${k}" ${SETTINGS[k] !== false ? 'checked' : ''}><span>${n}</span><small class="dim">${d}</small></label>`;
    r.html = (inGame ? _t('ui4.av_temposu_n_iki_modda', [[['flow', _t('ui4.akici_av_varsayilan'), _t('ui4.bekleme_1_5_3_5')], ['classic', _t('ui4.klasik_av'), _t('ui4.bekleme_2_6_sn_her')]].map(([k, n, d]) => `<button class="opt ${Tempo.cur() === k ? 'on' : ''}" data-a="setTempo" data-v="${k}"><b>${n}</b><small>${d}</small></button>`).join('')]) : '') + r.html.replace('<h4 data-sec="screen">', `${tg('vibrate', _t('ui4.titresim'), _t('ui4.vurus_ve_ozel_hamle_uyarilarinda'))}<h4 data-sec="screen">`); { const lh = this.langHtml(); r.html = lh + r.html.replace(lh, ''); } return r; };
}
Object.assign(UI, {
  trophyHtml() {
    const tg = S.trophy.target;
    let html = _t('ui4.n_yedi_bolgesel_trofe_mevcut', [img('trophy_t', 2)]);
    html += V4.trophies.map(t => { const f = FISH[t.fid], un = Trophy.unlocked(t.id), d = S.trophy.done[t.id], b = S.trophy.best[t.id]; const act = tg === t.id;
      return `<div class="order ${d ? 'done2' : ''}"><div class="oh">${un ? fishImgAlways(t.fid, 1, 'mini') : `<img class="pix mini" src="${fishSilUrl(t.fid, 1)}" alt="">`}<b>${un ? esc(t.name) : '??? · ' + esc(REGION[t.rid].name)}</b> <span class="dim small">${un ? esc(f.name_tr) + ' · ' + esc(REGION[t.rid].name) : _t('ui4.once_turu_kesfet')}</span><span class="sp"></span>${img('tr_' + t.id, 2)}</div>
        ${un ? _t('ui4.n_guc_n_gerekli_olta', [esc(t.desc), f.power, Math.max(1, f.power - 1), rodOf().power, V3.methods[Methods.of(t.fid)[0]].short, esc(BAIT[f.favored_baits[0]].name), d ? _t('ui4.ilk_yakalama_gun_n_en', [d.day, b.cm, fmtKg(b.kg), esc(t.reward.name)]) : _t('ui4.odul_bir_kez_n', [esc(t.reward.name)]), act ? 'on' : 'g', act ? '' : t.id, act ? _t('ui4.aktif_hedef_birak') : _t('ui4.hedef_sec')]) : ''}</div>`; }).join('');
    html += _t('ui4.n_7_trofe_n', [Object.keys(S.trophy.done).length, S.ach.trophy7 ? _t('ui4.yedi_denizin_ustasi') : '']);
    return html;
  },
  shoreHtml() {
    const n = Shore.count(); const cats = [_t('sys4.kabuk'), _t('sys4.deniz_cami'), _t('sys4.kiyi_tasi'), _t('sys4.deniz_hatirasi')];
    let html = _t('ui4.n_kiyi_koleksiyonu_n_24', [img('shore', 2), n, img(S.ach.shore6 ? 'badge_b' : 'lock', 1, 'ic'), img(S.ach.shore12 ? 'decor_kabuk_sergisi' : 'lock', 1, 'ic'), img(S.ach.shore18 ? 'decor_poster_shore' : 'lock', 1, 'ic'), img(S.ach.shore24 ? 'title' : 'lock', 1, 'ic')]);
    html += cats.map(c => `<h4>${esc(c)}</h4><div class="ency shoregrid">${V4.shore.filter(x => x.cat === c).map(x => { const e = S.shore.items[x.id]; return `<div class="ecard ${e ? '' : 'lock'}" title="${esc(e ? x.info : _t('ui4.henuz_bulunmadi'))}"><img class="pix" src="${shoreUrl(x.id, 3, !!e)}" alt=""><span><b>${e ? esc(x.name) : '???'}</b></span>${e ? _t('ui4.n_ilk_gun_n_n', [esc(x.info), e.first, e.n]) : `<small class="dim">${x.env.map(v => V4.shoreEnv[v].name).join(', ')}</small>`}</div>`; }).join('')}</div>`).join('');
    return _t('ui4.n_nesneler_satilamaz_ve_balik', [html, Shore.unlocked() ? (S.shore.day === S.day ? _t('ui4.bugunku_kesif_tamamlandi') : _t('ui4.bugun_kiyi_kesfi_yapabilirsin_iskele')) : _t('ui4.ilk_basarili_avdan_sonra_acilir')]);
  }
});
/* ---- av ekranı: kompakt sonuç, dürbün, hikâye incelemesi, yön düğmeleri ---- */
{
  const sc0 = UI.showCatch.bind(UI);
  UI.showCatch = function (c, storage) {
    sc0(c, storage); const T = c.trophy && TROPHY[c.trophy];
    if (T) { const h = this.modalEl.querySelector('h2'); if (h) h.insertAdjacentHTML('afterend', _t('ui4.trofe_n_n', [esc(T.name), c.trophyFirst ? _t('ui4.ilk_trofe_odulu_n_hatira', [esc(T.reward.name)]) : _t('ui4.bu_trofe_daha_once_kazanildi')])); }
  };
  const fb0 = UI.fishBar.bind(UI);
  UI.fishBar = function (sc) {
    fb0(sc); const br = this.bottom.querySelector('.br'); const bb = $('baitBtn');
    if (br && bb) bb.insertAdjacentHTML('beforebegin', _t('ui4.n_incele', [img('inspect', 2)]));
    if (Game.sceneName === 'BoatFishing' && Binoc.unlocked()) { const bl = this.bottom.querySelector('.bl'); if (bl) bl.insertAdjacentHTML('beforeend', sc.bin ? _t('ui4.n_indir', [img('binoc', 2)]) : _t('ui4.n_durbun', [img('binoc', 2)])); }
    this.fishBarUpdate();
  };
  const fu0 = UI.fishBarUpdate.bind(UI);
  UI.fishBarUpdate = function () {
    fu0(); const ph = Fishing.phase; const sc = Game.scene; this.storyTracker();
    const ib = $('inspBtn'); if (ib) { const sid = Game.sceneName === 'PierFishing' ? PIER_SPOTS[sc.idx] : Game.sceneName === 'BoatFishing' && sc.atSpot && sc.atSpot() ? sc.spotId() : null; ib.style.display = ph === 'READY' && sid && Stories.inspectable(sid).length ? '' : 'none'; }
    const bb = $('binBtn'); if (bb) { const why = Binoc.reason(); bb.style.display = S.trip && !S.trip.binoc ? '' : 'none'; bb.classList.toggle('dimbtn', !!why); bb.title = why || _t('ui4.durbunle_gozlem_5_enerji'); }
    /* yön düğmeleri yalnız gerektiğinde: hazırken (nokta/tekne hareketi) ve güç 2+ mücadelede */
    const needMv = ph === 'READY' || ph === 'OUTCOME' || (ph === 'REELING') || (Game.sceneName === 'BoatFishing' && sc.bin);
    this.bottom.classList.toggle('hidemv', !needMv);
  };
  const ref0 = UI.refresh.bind(UI);
  UI.refresh = function () { ref0(); if (!QA.silent) this.storyTracker(); };
  const ons0 = UI.onScene.bind(UI);
  UI.onScene = function (name) { this.hideCompact(); ons0(name); };
}
/* ---- eylemler ---- */
Object.assign(UI.A, {
  compactInfo() { const c = this._compactC; this.hideCompact(); if (c && Fishing.phase === 'READY') this.showCatch(c, false); },
  setTempo(d) { const r = Tempo.set(d.v); if (r.ok) this.toastNow(_t('ui4.av_temposu_n_n', [d.v === 'flow' ? _t('ui4.akici_av') : _t('ui4.klasik_av'), r.note ? ' · ' + r.note : '']), 'good', 'tempo'); this.renderPanel(true); },
  guildClaim(d) { const r = Guild.claim(d.id); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(_t('ui4.birlik_odulu_n_para_n', [fmt(r.r.cash), r.r.n, BAIT[r.r.bait].name]), 'good', 'guild'); this.renderPanel(true); },
  guildReroll(d) { this.confirm({ title: _t('ui4.gorevi_degistir_2'), icon: 'guild', text: _t('ui4.haftada_bir_kez_ucretsizdir_bu'), ok: _t('ui.degistir_2'), onOk: () => { const r = Guild.reroll(d.id); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(_t('ui4.yeni_gorev_n', [GUILDT[r.id].name]), 'good', 'guild'); } }); },
  storyTalk(d) { const r = Stories.talk(d.npc); if (!r.ok) { if (r.msg) this.toastNow(r.msg, 'warn'); return; } this.confirm({ title: NPCS[d.npc].name, icon: 'story', html: `<div class="npc"><img class="pix portrait" src="${portraitUrl(NPCS[d.npc].look, 2)}" alt=""><p>“${esc(r.line)}”</p></div>${r.done ? _t('ui4.hikaye_tamamlandi_odul_n_hatira', [esc(V4.stories[d.npc].reward.name)]) : _t('ui4.sonraki_hedef_n', [esc(Stories.goal(d.npc))])}`, ok: _t('ui.tamam'), cancel: _t('ui.kapat') }); },
  storyTrack(d) { Stories.track(d.npc); this.renderPanel(true); this.storyTracker(); },
  storyInspect() { const sc = Game.scene; const sid = Game.sceneName === 'PierFishing' ? PIER_SPOTS[sc.idx] : sc.spotId(); const n = Stories.inspectable(sid)[0]; if (!n) return; const r = Stories.inspect(n, sid); if (r.ok) this.confirm({ title: _t('ui4.inceleme'), icon: 'inspect', text: r.text, ok: _t('ui.tamam'), cancel: _t('ui.kapat') }); this.fishBarUpdate(); },
  albumOpen() { this.tab.st = 'album'; this.openPanel('Stories'); },
  jrTab(d) { this.tab.jr = d.t; this.sel.jrFish = null; this.openPanel('Journal'); },
  trophyTarget(d) { const r = Trophy.setTarget(d.id || null); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(d.id ? _t('ui4.trofe_hedefi_n', [TROPHY[d.id].name]) : _t('ui4.trofe_hedefi_birakildi'), 'good', 'trophy_t'); this.renderPanel(true); },
  binocStart() { if (Game.sceneName === 'BoatFishing') Game.scene.startBinoc(); },
  binocEnd() { if (Game.sceneName === 'BoatFishing' && Game.scene.bin) { Game.scene.endBinoc(null); } },
  beachOpen() {
    if (!Shore.unlocked()) { this.toastNow(_t('sys4.kiyi_kesfi_ilk_basarili_avdan'), 'info', 'shore'); return; }
    if (Shore.session() && !Shore.session().done) { go('Shore', {}); return; }
    if (S.shore.day === S.day) { this.confirm({ title: _t('ui4.kiyi_kesfi'), icon: 'shore', text: _t('ui4.bugunku_kiyi_kesfini_tamamladin_yarin', [Shore.count()]), ok: _t('ui4.koleksiyonu_ac'), cancel: _t('ui.kapat'), onOk: () => { this.tab.jr = 'shore'; this.sel.jrFish = null; this.openPanel('Journal'); } }); return; }
    this.showModal(_t('ui4.n_sahil_patikasi_kiyi_kesfi', [img('shore', 2), Shore.count(), Object.entries(V4.shoreEnv).map(([k, e]) => `<button class="opt" data-a="shoreStart" data-v="${k}"><b>${esc(e.name)}</b><small>${esc(e.desc)}</small></button>`).join('')]), 'wide');
  },
  shoreStart(d) { const r = Shore.start(d.v); this.closeModal(); if (!r.ok) { if (r.msg) this.toastNow(r.msg, 'warn'); return; } go('Shore', {}); },
  shoreBack() { go('Town', { at: 'beach' }); },
  shoreHint() { Shore.hint(); this.toastNow((Shore.session() && Shore.session().hints >= 2) ? _t('ui4.dogru_noktanin_ustunde_bir_ok') : _t('ui4.ipuclari_belirginlesti_n', [{ sand: _t('ui4.farkli_renk_parilti_dalga_izi'), rocks: _t('ui4.kabarciklarin_ve_kucuk_izlerin_oldugu'), tide: _t('ui4.su_cekilince_parlayan_nesneyi_sec') }[Game.scene.env]]), 'info', 'inspect'); },
  shoreCol() { this.tab.jr = 'shore'; this.sel.jrFish = null; this.openPanel('Journal'); },
  shoreColM() { this.closeModal(); this.tab.jr = 'shore'; this.sel.jrFish = null; this.openPanel('Journal'); },
  shoreDone() { this.closeModal(); go('Town', { at: 'beach' }); }
});
/* trip raporu görüntüleme: iki noktalı seferin raporu Birlik D06'yı tamamlar */
{
  const str0 = UI.showTripReport.bind(UI);
  UI.showTripReport = function (rep) { str0(rep); if (S.guild && S.guild.rep2 && rep.id === S.guild.rep2) { S.guild.rep2 = null; Guild.ev('report2', {}); } };
  /* fotoğraf modu: deniz/doğa sahnesi önizlemesi (Birlik D03) */
  const comp0 = Photo.composite.bind(Photo);
  Photo.composite = function (scale) { const c = comp0(scale); if (['PierFishing', 'BoatFishing'].includes(Game.sceneName)) Guild.ev('photo', {}); return c; };
  const pact0 = Photo.act.bind(Photo);
  Photo.act = function (k) { if (k === 'prev' && Game.photo) { try { const c = this.composite(1); UI.toastNow(_t('ui4.onizleme_olusturuldu_n_n', [c.width, c.height]), 'good', 'camera'); } catch (e) { } this.ui(); return; } return pact0(k); };
  const pui0 = Photo.ui.bind(Photo);
  Photo.ui = function () { pui0(); const bar = $('photoui').querySelector('.photobar'); if (bar && !bar.querySelector('[data-ph=prev]')) bar.insertAdjacentHTML('beforeend', _t('ui4.onizle')); };
}
