'use strict';
/* ---- 11_ui_v2.js ---- */
/* =====================================================================
   11_ui_v2.js : v2.0 arayüzü — mevcut UI.P / UI.A genişletilir, eski paneller korunur
   ===================================================================== */
const knownFish = id => !!(S.ency[id] && S.ency[id].caught);
const inTownLike = () => Game.sceneName === 'Town';
Object.assign(UI.P, {
  Menu() {
    const b = (p, ic, n) => `<button class="btn tile" data-a="openPanel" data-p="${p}">${img(ic, 3)}<span>${n}</span></button>`;
    const html = _t('ui2.n_n_n_n_n', [b('Inventory', 'bag', _t('ui.envanter')), b('Journal', 'journal', _t('ui2.balikci_defteri')), b('Plan', 'plan', _t('ui2.sefer_plani')), b('Trade', 'trade', _t('ui2.ticaret')), b('Boatyard', 'fleet', _t('ui.tekneler')), b('Achievements', 'trophy', _t('ui.basarimlar')), b('Finance', 'finance', _t('ui2.mali_gunluk')), b('People', 'people', _t('ui2.kasabalilar')), b('Settings', 'gear', _t('ui.ayarlar')), [['Encyclopedia', 'book', _t('ui.ansiklopedi')], ['Statistics', 'chart', _t('ui.istatistikler')], ['Orders', 'order', _t('ui.ilanlar')], ['Trophies', 'cup_1', _t('ui.kupalar')], ['Records', 'records', _t('ui2.rekorlar')], ['Help', 'help', _t('ui.yardim')]].map(([p, i, n]) => `<button class="btn sm" data-a="openPanel" data-p="${p}">${img(i, 1, 'ic')} ${n}</button>`).join(''), img('camera', 1, 'ic'), img('exit', 1, 'ic'), S.revision, S.migratedFrom ? _t('ui2.eski_kayit_sema_n_guvenle', [S.migratedFrom]) : '']);
    return { title: _t('ui.menu'), icon: 'menu', html, cls: 'wide' };
  },
  /* ---------------- Balıkçı Defteri ---------------- */
  Journal() {
    const tab = this.curTab('jr', 'guide'); let html = '';
    const det = this.sel.jrFish;
    if (det) return this.P.JournalCard.call(this, det);
    if (tab === 'guide') {
      html = REGIONS.map(r => `<h4>${esc(r.name)} <span class="dim">${r.fish_ids.filter(knownFish).length}/${r.fish_ids.length}</span></h4><div class="ency">${r.fish_ids.map(f => { const k = knownFish(f); return `<button class="ecard ${k ? '' : 'lock'}" data-a="jrFish" data-id="${f}">${fishImg(f, 1)}<span>${k ? esc(FISH[f].name_tr) : '???'}</span>${S.journal.fav[f] ? `<i>${img('star', 1, 'ic')}</i>` : ''}</button>`; }).join('')}</div>`).join('');
    }
    if (tab === 'today') {
      const rows = Journal.today(10); const wxl = REGIONS.filter(r => S.world.unlocked[r.id]).map(r => `${esc(r.name)} ${img(S.world.weather[r.id], 1, 'ic')}`).join(' · ');
      html = _t('ui2.n_n_28_olta_gucu', [SEASON_TR[World.season()], World.seasonDay(), rodOf().power, wxl, rows.length ? rows.map(x => { const f = FISH[x.fid], sp = SPOTS[x.spot]; return _t('ui2.n_n_av_uygunlugu_n', [fishImgAlways(x.fid, 1, 'mini'), esc(upTR(f.name_tr)), x.p >= .2 ? 'new' : x.p >= .1 ? 'big' : 'rec', Journal.level(x.p), esc(REGION[x.rid].name), esc(sp.name), esc(BAIT[x.bait].name), BAND_TR[x.band], WEATHER_TR[S.world.weather[x.rid]], x.fac.season > 1 ? _t('ui2.mevsimi') : '', x.fac.weather > 1 ? _t('ui2.sevdigi_hava') : '', x.fac.event > 1 ? _t('ui2.gunun_olayi') : '', Math.round(x.p * 100), x.fid, img('plan', 1, 'ic')]); }).join('') : _t('ui2.henuz_oneri_icin_yeterli_kesif')]);
    }
    if (tab === 'log') {
      const ids = FISH_LIST.filter(f => knownFish(f.id)).map(f => f.id).sort((a, b) => S.ency[b].caught - S.ency[a].caught);
      html = ids.length ? ids.map(f => { const e = S.ency[f], L = S.journal.log[f]; return _t('ui2.n_n_n_ilk_n', [f, fishImgAlways(f, 1, 'mini'), esc(FISH[f].name_tr), e.caught, L ? _t('ui2.gun_n', [L.first]) : (e.firstDay ? _t('ui2.gun_n', [e.firstDay]) : _t('ui2.bilinmiyor')), L ? _t('ui2.gun_n', [L.last]) : _t('ui2.bilinmiyor'), e.maxLen, fmtKg(e.maxKg), '★'.repeat(Journal.tier(f))]); }).join('') : _t('ui2.henuz_av_kaydin_yok');
    }
    if (tab === 'missing') {
      html = _t('ui2.n_toplam_ustalik_n_21', [REGIONS.map(r => { const ms = Mastery.status(r.id), m = S.mastery[r.id] || {}; const miss = r.fish_ids.filter(f => !knownFish(f)); return _t('ui2.n_kesfedilen_n_n_n', [esc(r.name), ms.disc, ms.total, img(m.b ? 'badge_b' : 'lock', 1, 'ic'), img(m.s ? 'badge_s' : 'lock', 1, 'ic'), img(m.g ? 'badge_g' : 'lock', 1, 'ic'), ms.spots, ms.total, miss.length ? miss.map(f => _t('ui2.n_n_guc_n', [esc(REGION[FISH[f].home_region].name), FISH[f].power, fishSilUrl ? `<img class="pix mini" src="${fishSilUrl(f, 1)}" alt="">` : ''])).join('') : _t('ui2.hepsi_kesfedildi')]); }).join(''), Mastery.count()]);
    }
    if (tab === 'fav') {
      const ids = Object.keys(S.journal.fav).filter(f => FISH[f]);
      html = _t('ui2.n_defter_favorileri_yalnizca_av', [ids.length ? ids.map(f => _t('ui2.n_n_n_sefer_planina', [fishImg(f, 1, 'mini'), knownFish(f) ? esc(FISH[f].name_tr) : '???', esc(REGION[FISH[f].home_region].name), f, f])).join('') : _t('ui2.defter_favorin_yok_tur_kartindan')]);
    }
    return { title: _t('ui2.balikci_defteri'), icon: 'journal', tabs: this.tabsHtml('jr', [['guide', _t('ui2.tur_rehberi')], ['today', _t('ui2.bugunku_av')], ['log', _t('ui2.av_kayitlari')], ['missing', _t('ui2.eksik_turler')], ['fav', _t('ui2.favoriler')]]), html, cls: 'wide' };
  },
  JournalCard(fid) {
    const f = FISH[fid], k = knownFish(fid), e = S.ency[fid], L = S.journal.log[fid], tier = Journal.tier(fid);
    let html = _t('ui2.defter_n_n_n_sularinda', [fishImg(fid, 2), k ? esc(f.name_tr) : _t('ui.bilinmeyen_tur'), esc(REGION[f.home_region].name), f.power, fid, img(S.journal.fav[fid] ? 'star' : 'starOff', 1, 'ic'), fid]);
    if (!k) return { title: _t('ui2.balikci_defteri'), icon: 'journal', html: _t('ui2.n_bu_turu_henuz_yakalamadin', [html]), cls: 'wide' };
    const spots = Journal.spotsOf(fid).map(s => _t('ui2.n_n_taban_n', [esc(s.name), esc(REGION[s.region_id].name), s.weights[fid]])).join(' · ');
    html += _t('ui2.fiyat_n_guc_n_mucadele', [coin(f.base_price), powerStr(f.power), STYLE_TR[fightStyle(fid)], f.favored_baits.map(b => esc(BAIT[b].name)).join(', '), BAND_TR[f.preferred_cast_band], f.weather_boost ? WEATHER_TR[f.weather_boost] : '—', f.season_boost ? SEASON_TR[f.season_boost] : '—', spots]);
    if (tier >= 2) html += _t('ui2.kisisel_istatistikler_5_av_toplam', [e.caught, L ? _t('ui2.gun_n', [L.first]) : _t('ui2.gun_n', [e.firstDay || '?']), L ? _t('ui2.gun_n', [L.last]) : _t('ui2.bilinmiyor'), L ? L.manual + ' / ' + L.auto : _t('ui2.bilinmiyor'), e.maxLen, fmtKg(e.maxKg), L && L.n < e.caught ? _t('ui2.n_av_eski_surumden_ayrintilari', [e.caught - L.n]) : '']);
    else html += _t('ui2.5_avda_kisisel_istatistikler_acilir');
    if (tier >= 3 && L) {
      const bs = Object.entries(L.baits).sort((a, b) => b[1] - a[1]), ss = Object.entries(L.spots).sort((a, b) => b[1] - a[1]);
      html += _t('ui2.senin_verinle_karsilastirma_12_av', [bs.map(([b, n]) => _t('ui2.n_n_av_n', [esc(BAIT[b].name), n, Math.round(n / L.n * 100)])).join('') || _t('ui2.yem_kaydi_yok'), ss.map(([sp, n]) => _t('ui2.n_n_av_n', [esc(SPOTS[sp].name), n, Math.round(n / L.n * 100)])).join('') || _t('ui2.nokta_kaydi_yok')]);
    } else if (tier >= 2) html += _t('ui2.12_avda_yem_nokta_karsilastirmasi');
    return { title: _t('ui2.balikci_defteri'), icon: 'journal', html, cls: 'wide' };
  },
  /* ---------------- Sefer Planı ---------------- */
  Plan() {
    const G = S.plan.goals;
    let html = _t('ui2.n_en_fazla_3_hedef', [img('plan', 2)]);
    html += G.length ? G.map((g, i) => _t('ui2.n_n_n_n_gun', [fishImg(g.fid, 1, 'mini'), knownFish(g.fid) ? esc(FISH[g.fid].name_tr) : '???', g.got >= g.target ? 'ok' : 'dim', g.got, g.target, g.got / g.target * 100, g.since, i, g.target, i, i, i])).join('') : _t('ui2.henuz_hedef_yok');
    html += _t('ui2.yeni_gunde_ilerlemeyi_koru_kapaliysa', [S.plan.keep ? 'checked' : '']);
    if (G.length < 3) { const ids = FISH_LIST.filter(f => knownFish(f.id)); html += _t('ui2.hedef_ekle_n_ilan_panosundaki', [ids.length ? `<div class="optgrid">${ids.map(f => `<button class="opt" data-a="planQuick" data-id="${f.id}">${fishImgAlways(f.id, 1, 'mini')}<b>${esc(f.name_tr)}</b></button>`).join('')}</div>` : _t('ui2.kesfettigin_turler_burada_listelenir')]); }
    return { title: _t('ui2.sefer_plani'), icon: 'plan', html, cls: 'wide' };
  },
  /* ---------------- Ticaret: akıllı satış ---------------- */
  Trade() {
    const src = Market.sources(!!this.sel.trChest); const plans = SmartSell.plans(src, !!this.sel.trFav); const canSell = Game.sceneName === 'Town';
    let html = _t('ui2.sandigi_dahil_et_favori_turleri', [this.sel.trChest ? 'checked' : '', this.sel.trFav ? 'checked' : '', canSell ? _t('ui2.balik_hali_ilanlar_cay_bahcesi') : '']);
    html += plans.length ? plans.map(p => _t('ui2.n_n_elinde_n_n', [fishImgAlways(p.fid, 1, 'mini'), esc(FISH[p.fid].name_tr), p.have, coin(p.total), p.total > p.marketOnly ? _t('ui2.n_hale_gore', [fmt(p.total - p.marketOnly)]) : '', p.alloc.map(a => `${a.kind === 'order' ? img('order', 1, 'ic') : a.kind === 'tea' ? img('teahouse', 1, 'ic') : img('market', 1, 'ic')} ${esc(a.name)}: <b>${a.n}</b> × ${fmt(a.unit)}${a.limit !== Infinity ? _t('ui2.kalan_alim_n', [a.limit]) : ''}`).join('<br>'), canSell ? _t('ui2.bu_dagilimla_sat', [p.fid]) : _t('ui2.satis_icin_kasabada_ol')])).join('') : _t('ui2.satilabilir_baligin_yok_akvaryumdaki_baliklar');
    return { title: _t('ui2.ticaret_akilli_satis'), icon: 'trade', html, cls: 'wide' };
  },
  /* ---------------- Mali Günlük ---------------- */
  Finance() {
    const n = this.sel.finN || 7; const rows = S.fin.slice(-n);
    const mx = Math.max(1, ...rows.map(r => Math.max(r.income, r.expense)));
    let html = _t('ui2.son_7_gun_son_30', [n === 7 ? 'on' : '', n === 30 ? 'on' : '']);
    if (!rows.length) html += _t('ui2.mali_gunluk_bu_surumde_tamamlanan');
    else {
      html += _t('ui2.n_gelir_gider', [rows.map(r => _t('ui2.n_gun_n', [r.day, r.income / mx * 100, r.expense / mx * 100, r.day])).join('')]);
      const T = k => sum(rows.map(r => r[k] || 0));
      html += _t('ui2.gelir_n_gider_n_net', [fmt(T('income')), fmt(T('expense')), T('net') >= 0 ? 'ok' : 'bad', fmt(T('net')), T('manual'), T('auto'), T('fleetFish'), fmt(T('fleetWage')), fmt(T('fleetFuel')), fmt(T('project'))]);
      html += _t('ui2.gun_manuel_oto_hal_ilan', [rows.slice().reverse().map(r => `<tr><td>${r.day}</td><td>${r.manual}</td><td>${r.auto}</td><td>${fmt(r.market)}</td><td>${fmt(r.orders)}</td><td>${fmt(r.tea)}</td><td>${fmt(r.prize)}</td><td>${fmt(r.bait)}</td><td>${fmt(r.fuel)}</td><td>${fmt(r.gear)}</td><td>${fmt((r.fleetWage || 0) + (r.fleetFuel || 0))}</td><td>${fmt(r.project || 0)}</td><td>${fmt(r.other)}</td><td>${fmt(r.income)}</td><td>${fmt(r.expense)}</td><td class="${r.net >= 0 ? 'ok' : 'bad'}">${fmt(r.net)}${r.consistent === false ? ' *' : ''}</td></tr>`).join('')]);
    }
    return { title: _t('ui2.mali_gunluk'), icon: 'finance', html, cls: 'wide' };
  },
  /* ---------------- Kasabalılar ve rakipler ---------------- */
  People() {
    const shopOf = { zeynep: _t('core.olta_dukkani'), fatma: _t('core.firin'), nihat: _t('core.balik_hali'), selin: _t('core.butik'), bora: _t('core.tekne_atolyesi'), kerem: _t('core.ev_esyalari'), halil: _t('core.cay_bahcesi'), bahar: _t('ui2.lokanta_ilan_panosu'), hasan: _t('core.senlik_meydani') };
    const town = ['zeynep', 'fatma', 'nihat', 'selin', 'bora', 'kerem', 'hasan', 'halil', 'bahar', 'efe', 'ali', 'mert', 'elif'];
    let html = _t('ui2.kasabalilar_n_dukkanlar_sahibi_nerede', [town.map(n => _t('ui2.n_n_bugun_n', [portraitUrl(NPCS[n].look, 2), esc(NPCS[n].name), esc(NPCS[n].role), esc(V2.routines[n] ? Routine.where(n) : (shopOf[n] ? _t('sys2.dukkaninda') : _t('ui2.kasabada')))])).join('')]);
    html += _t('ui2.rakip_balikcilar_n', [RIVALS.map(r => { const P = V2.rivalProfiles[r.id], C = S.rivals[r.id]; return _t('ui2.n_n_uzmanlik_n_n', [portraitUrl(NPCS[r.id].look, 2), esc(r.name), esc(P.title), esc(P.spec), esc(P.bio), C ? _t('ui2.yarisma_n_sampiyonluk_n_ilk', [C.comps, C.wins, C.podiums, C.best, C.hist.slice(-4).reverse().map(h => esc(FEST[h.fest].name) + ' Y' + h.year + ': ' + h.place + '.').join(' · ')]) : _t('ui2.eski_yarisma_kaydi_bulunmuyor'), '★'.repeat(Math.round(r.skill * 5))]); }).join('')]);
    return { title: _t('ui2.kasabalilar'), icon: 'people', html, cls: 'wide' };
  },
  /* ---------------- Kişisel Av Rekorları ---------------- */
  Records() {
    const tabs = this.tabsHtml('rec', [['top', _t('ui2.en_buyuk_10')], ['species', _t('ui2.tur_bazinda')]]);
    if (this.curTab('rec', 'top') === 'species') {
      const ids = FISH_LIST.filter(f => S.ency[f.id] && S.ency[f.id].caught).sort((a, b) => (S.ency[b.id].maxKg || 0) - (S.ency[a.id].maxKg || 0));
      const html = _t('ui2.n_her_turun_kisisel_rekorlari', [img('records', 2), ids.length ? _t('ui2.tur_bolge_av_boy_rekoru', [ids.map(f => { const e = S.ency[f.id]; return _t('ui2.n_n_n_n_cm', [esc(f.name_tr), esc(REGION[f.home_region].name), e.caught, e.maxLen, fmtKg(e.maxKg)]); }).join('')]) : _t('ui2.henuz_kayit_yok')]);
      return { title: _t('world.kisisel_av_rekorlari'), icon: 'records', tabs, html, cls: 'wide' };
    }
    const top = Records.top();
    const html = _t('ui2.n_en_buyuk_10_avin', [img('records', 2), S.recWall.length, top.length ? top.map((r, i) => { const on = S.recWall.includes(r.id); return _t('ui2.n_n_n_n_n_2', [fishImgAlways(r.fid, 1, 'mini'), i + 1, esc(FISH[r.fid].name_tr), r.cm != null ? _t('ui2.n_cm', [r.cm]) : '', fmtKg(r.kg), r.legacy ? _t('ui2.eski_kayit_ansiklopedideki_agirlik_rekoru') : _t('ui2.n_n_gun_n_n', [esc(r.rid ? REGION[r.rid].name : _t('ui2.bilinmiyor')), esc(r.spot ? SPOTS[r.spot].name : _t('ui2.bilinmiyor')), r.day, r.auto ? _t('ui2.otomatik_n', [esc(r.dev ? AUTO[r.dev].name : _t('ui.cihaz'))]) : _t('ui2.manuel_n', [esc((RODS.find(x => x.id === r.rod) || { name: _t('ui2.bilinmiyor') }).name)])]), on ? 'r' : '', r.id, on ? _t('ui2.duvardan_indir') : _t('ui2.duvara_as')]); }).join('') : _t('ui2.henuz_rekor_kaydi_yok')]);
    return { title: _t('world.kisisel_av_rekorlari'), icon: 'records', tabs, html, cls: 'wide' };
  },
  /* ---------------- Akvaryum ---------------- */
  Aquarium(a) {
    const tid = a.tank, M = AQM[tid], T = Aq.tank(tid); if (!T) return { title: _t('sys2.akvaryum'), html: _t('ui2.bu_akvaryuma_sahip_degilsin') };
    const others = V2.aqModels.filter(m => m.id !== tid && Aq.owns(m.id));
    const dst = this.sel.aqDst || 'bag'; const src = this.sel.aqSrc || 'bag';
    const keyName = k => k === 'bag' ? _t('ui.canta') : k === 'chest' ? _t('ui.sandik') : _t('ui2.tekne_deposu');
    let html = _t('ui2.n_n_n_balik_n', [esc(M.name), Aq.total(tid), M.cap, Aq.speciesN(tid), M.species, V2.aqDecor.filter(d => S.aq.decor.includes(d.id)).map(d => `<button class="btn sm ${T.decor === d.id ? 'on' : ''}" data-a="aqDecorSet" data-id="${d.id}">${esc(d.name)}</button>`).join(' '), T.bg === 'plain' ? 'on' : '', S.ach.aq10 ? _t('ui2.okyanus_odul', [T.bg === 'ocean' ? 'on' : '']) : _t('ui2.okyanus_arka_plani_10_tur')]);
    html += _t('ui2.akvaryumdakiler_cikarilan_balik_n', [Aq.sources().map(k => `<button class="btn sm ${dst === k ? 'on' : ''}" data-a="aqDst" data-k="${k}">${keyName(k)}</button>`).join('')]);
    html += Object.keys(T.fish).length ? Object.entries(T.fish).map(([f, q]) => _t('ui2.n_n_n_1_cikar', [fishImgAlways(f, 1, 'mini'), esc(FISH[f].name_tr), q, f, f, q, others.map(o => `<button class="btn sm" data-a="aqMove" data-f="${f}" data-to="${o.id}">→ ${esc(o.name)}</button>`).join('')])).join('') : _t('ui2.akvaryum_bos');
    const sp = Inv.species([src]); const elig = Object.keys(sp).filter(f => AQ_OK.has(f));
    html += _t('ui2.balik_ekle_kaynak_n', [Aq.sources().map(k => `<button class="btn sm ${src === k ? 'on' : ''}" data-a="aqSrc" data-k="${k}">${keyName(k)} (${Inv.total(k)})</button>`).join('')]);
    html += elig.length ? elig.map(f => _t('ui2.n_n_elinde_n_bos', [fishImgAlways(f, 1, 'mini'), esc(FISH[f].name_tr), sp[f], Aq.room(tid, f), f, Aq.room(tid, f) ? '' : 'disabled', f, Math.min(sp[f], Aq.room(tid, f)), Aq.room(tid, f) ? '' : 'disabled'])).join('') : _t('ui2.bu_kaynakta_akvaryuma_uygun_balik');
    const seen = Object.keys(S.aq.seen).length;
    html += _t('ui2.koleksiyon_n_n_n_n', [seen, V2.aqFish.length, V2.aqFish.map(f => `<span title="${esc(knownFish(f) ? FISH[f].name_tr : '???')}" class="${S.aq.seen[f] ? '' : 'dimimg'}">${fishImg(f, 1, 'mini')}</span>`).join(''), img(S.ach.aq5 ? 'badge_b' : 'lock', 1, 'ic'), img(S.ach.aq10 ? 'badge_s' : 'lock', 1, 'ic'), img(S.ach.aq20 ? 'title' : 'lock', 1, 'ic')]);
    return { title: M.name, icon: 'aquarium', html, cls: 'wide' };
  }
});
/* ---- mevcut panellerin genişletilmesi ---- */
{
  const P0 = Object.assign({}, UI.P);
  UI.P.HomeGoods = function () {
    const tab = this.curTab('hg', 'decor');
    if (tab === 'decor') { const r = P0.HomeGoods.call(this); r.tabs = this.tabsHtml('hg', [['decor', _t('ui2.dekor_sandik')], ['aq', _t('ui2.akvaryumlar')]]); return r; }
    let html = V2.aqModels.map(m => _t('ui2.n_n_n_n_balik', [img('aquarium', 3), esc(m.name), esc(m.desc), m.cap, m.species, Aq.owns(m.id) ? _t('ui2.sahipsin_evde') : `<button class="btn g sm" data-a="aqBuy" data-id="${m.id}" ${S.cash < m.price ? 'disabled' : ''}>${coin(m.price)}</button>`])).join('');
    html += _t('ui2.akvaryum_dekorlari_n', [V2.aqDecor.map(d => _t('ui2.n_yalnizca_gorsel_n', [esc(d.name), S.aq.decor.includes(d.id) ? _t('ui.sahipsin') : `<button class="btn g sm" data-a="aqDecorBuy" data-id="${d.id}" ${S.cash < d.price ? 'disabled' : ''}>${coin(d.price)}</button>`])).join('')]);
    html += _t('ui2.uygun_turler_n_n_her', [V2.aqFish.length, V2.aqFish.map(f => fishImg(f, 1, 'mini')).join('')]);
    return { title: _t('world.kerem_in_ev_esyalari'), icon: 'homegoods', npc: 'kerem', tabs: this.tabsHtml('hg', [['decor', _t('ui2.dekor_sandik')], ['aq', _t('ui2.akvaryumlar')]]), html, cls: 'wide' };
  };
  UI.P.Square = function () {
    const r = P0.Square.call(this);
    const hist = S.compHist.slice().reverse(); const legacy = Object.entries(S.fest).filter(([k, v]) => v.place && !S.compHist.some(h => h.fest + ':' + h.year === k));
    r.html += _t('ui2.onceki_yarismalar_n_n_n', [hist.length ? hist.slice(0, 8).map(h => _t('ui2.n_n_yil_n_n', [img(h.place <= 3 ? 'cup_' + h.place : 'festival', 2), esc(FEST[h.fest].name), h.year, h.standings.slice(0, 3).map((x, i) => (i + 1) + '. ' + esc(x.name)).join(' · '), h.place])).join('') : '', legacy.map(([k, v]) => _t('ui2.n_n_yil_n_eski', [img(v.place <= 3 ? 'cup_' + v.place : 'festival', 2), esc(FEST[k.split(':')[0]].name), k.split(':')[1], v.place])).join(''), !hist.length && !legacy.length ? _t('ui2.henuz_yarisma_gecmisi_yok') : '', img('people', 1, 'ic')]);
    return r;
  };
  UI.P.Orders = function (a) {
    const r = P0.Orders.call(this, a);
    const extra = this.curTab('ord', 'board') !== 'board' ? '' : Orders.active().filter(o => Orders.remaining(o) > 0).map(o => _t('ui2.n_n_hedefi', [o.id, img('plan', 1, 'ic'), esc(FISH[o.fishId].name_tr)])).join('');
    if (extra) r.html += _t('ui2.ilanlardan_sefer_hedefi_n_miktari', [extra]);
    return r;
  };
  UI.P.Boatyard = function () {
    const r = P0.Boatyard.call(this);
    if (!inTownLike()) r.html = _t('ui2.burada_yalnizca_goruntuleme_yapilir_satin', [r.html]);
    if (this.curTab('yard', 'boats') === 'look' && S.boats.owned.length) {
      const selB = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : (S.boats.active || S.boats.owned[0]); const b = S.boats.byId[selB]; const orn = S.cosmetics.ornaments || [];
      r.html += _t('ui2.tekne_susu_altin_bolge_ustaligi', [!b.ornament ? 'on' : '', REGIONS.map(rg => { const id = 'orn_' + rg.id, own = orn.includes(id); return `<button class="opt ${b.ornament === id ? 'on' : ''} ${own ? '' : 'lock'}" data-a="${own ? 'ornSet' : 'noop'}" data-id="${id}">${img(id, 2)}<b>${esc(V2.ornaments[rg.id])}</b><small>${own ? (b.ornament === id ? _t('ui2.takili') : _t('ui2.tak')) : _t('ui2.n_altin_ustalik', [esc(rg.name)])}</small></button>`; }).join('')]);
    }
    return r;
  };
  UI.P.Statistics = function () {
    const r = P0.Statistics.call(this); const s = S.stats;
    r.html = r.html.replace('<div class="btns left">', _t('ui2.v2_cay_bahcesi_satisi_n', [fmt(s.teaSales || 0), fmt(s.prizes || 0), Mastery.count(), Object.keys(S.aq.seen).length, V2.aqFish.length, s.perfectHooks || 0, S.ach.aq20 ? _t('sys2.deniz_koleksiyoncusu') : '—', img('finance', 1, 'ic'), img('records', 1, 'ic')]));
    return r;
  };
}
/* ---- yeni eylemler ---- */
const townOnly = ['buyBoat', 'setActive', 'buyUp', 'buyAuto', 'mount', 'unmount', 'boatColor', 'buyColor', 'boatName', 'ornSet'];
Object.assign(UI.A, {
  jrFish(d) { this.sel.jrFish = d.id; this.renderPanel(); },
  jrBack() { this.sel.jrFish = null; this.renderPanel(); },
  jrFav(d) { Journal.toggleFav(d.id); this.renderPanel(true); },
  planQuick(d) {
    const g = S.plan.goals.find(x => x.fid === d.id); this._planQ = g ? g.target : 5; this._planF = d.id;
    this.showPlanQty(d.id, null);
  },
  planFromOrder(d) { const o = S.orders.find(x => x.id === d.id); if (!o) return; this._planQ = Math.min(10, Math.max(1, Orders.remaining(o))); this._planF = o.fishId; this.showPlanQty(o.fishId, o); },
  planQ(d) { this._planQ = clamp(this._planQ + (+d.d), 1, 99); this.showPlanQty(this._planF, null); },
  planOk() { const r = Plan.add(this._planF, this._planQ); this.closeModal(); if (r.ok) this.toastNow(_t('ui2.sefer_hedefi_n_n', [FISH[this._planF].name_tr, this._planQ]), 'good', 'plan'); else this.toastNow(r.msg, 'warn'); this.refresh(); },
  planT(d) { const g = S.plan.goals[+d.i]; if (g) Plan.setTarget(+d.i, g.target + (+d.d)); },
  planDel(d) { Plan.remove(+d.i); },
  smartSell(d) {
    const src = Market.sources(!!this.sel.trChest); const p = SmartSell.planFor(d.f, Inv.count(src, d.f));
    this.confirm({ title: _t('ui2.onerilen_dagilimla_sat'), icon: 'trade', html: `<p><b>${esc(FISH[d.f].name_tr)}</b> × ${p.have}</p><div class="small">${p.alloc.map(a => esc(a.name) + ': ' + a.n + ' × ' + fmt(a.unit)).join('<br>')}</div><div class="price">${img('coin', 2)}<b>+${fmt(p.total)}</b></div>`, ok: _t('ui2.onayla_ve_sat'), onOk: () => { const r = SmartSell.execute(d.f, src); if (r.ok) this.toastNow(_t('ui.n_balik_satildi_n', [r.n, fmt(r.income)]), 'good', 'coin'); else this.toastNow(r.msg, 'warn'); } });
  },
  finN(d) { this.sel.finN = +d.n; this.renderPanel(true); },
  recWall(d) { const r = Records.toggleWall(+d.id); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); this.renderPanel(true); },
  aqBuy(d) { const M = AQM[d.id]; this.buy(M.name, 'aquarium', M.price, _t('ui2.n_evindeki_akvaryum_kosesine_yerlesir', [M.desc]), () => Aq.buyModel(d.id)); },
  aqDecorBuy(d) { const D = V2.aqDecor.find(x => x.id === d.id); this.buy(D.name, 'aquarium', D.price, _t('ui2.akvaryum_dekoru_yalnizca_gorsel'), () => Aq.buyDecor(d.id)); },
  aqDecorSet(d) { Aq.setDecor(this.args.tank, d.id); this.renderPanel(true); },
  aqBg(d) { Aq.setBg(this.args.tank, d.v); this.renderPanel(true); },
  aqSrc(d) { this.sel.aqSrc = d.k; this.renderPanel(true); },
  aqDst(d) { this.sel.aqDst = d.k; this.renderPanel(true); },
  aqPut(d) { const r = Aq.put(this.args.tank, d.f, +d.n, this.sel.aqSrc || 'bag'); if (!r.ok) this.toastNow(r.msg, 'warn'); },
  aqTake(d) { const r = Aq.take(this.args.tank, d.f, +d.n, this.sel.aqDst || 'bag'); if (!r.ok) this.toastNow(r.msg, 'warn'); },
  aqMove(d) { const r = Aq.move(this.args.tank, d.to, d.f, 1); if (!r.ok) this.toastNow(r.msg, 'warn'); },
  ornSet(d) { const selB = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : S.boats.active; Mastery.setOrnament(selB, d.id || null); },
  gsSave(d) { GearSets.save(+d.i); this.toastNow(_t('ui2.set_kaydedildi_n', [S.gearSets[+d.i].name]), 'good', 'gearset'); },
  gsApply(d) { const r = GearSets.apply(+d.i); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(_t('ui2.n_kusanildi_n', [S.gearSets[+d.i].name, r.notes.length ? ' · ' + r.notes.join(', ') : '']), r.notes.length ? 'warn' : 'good', 'gearset'); if (this.modal) this.closeModal(); this.refresh(); },
  gsRename(d) { const el = $('gsn' + d.i); if (el) GearSets.rename(+d.i, el.value); this.toastNow(_t('ui2.set_adi_guncellendi'), 'good'); this.renderPanel(true); },
  polMode(d) { const r = Auto.setPolicy(d.d, { mode: d.m }); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); },
  photoOpen() { Photo.open(); }
});
for (const k of townOnly) { const f = UI.A[k]; if (!f) continue; UI.A[k] = function (d, el) { if (!inTownLike()) { this.toastNow(_t('ui2.bu_islem_icin_kasabadaki_tekne'), 'warn', 'yard'); return; } return f.call(this, d, el); }; }
Object.assign(UI, {
  showPlanQty(fid, o) {
    const full = S.plan.goals.length >= 3 && !S.plan.goals.find(g => g.fid === fid);
    this.showModal(_t('ui2.n_sefer_hedefi_n_n', [img('plan', 2), fishImg(fid, 2), knownFish(fid) || o ? esc(FISH[fid].name_tr) : '???', o ? _t('ui2.ilan_n_kalan_n', [esc(CUST[o.customerId].name), Orders.remaining(o)]) : '', full ? _t('ui2.zaten_3_hedefin_var_once') : '', this._planQ, full ? 'disabled' : '']));
  },
  gearSetsHtml() {
    const editable = !(Fishing.ctx && !['READY', 'OUTCOME'].includes(Fishing.phase));
    return _t('ui2.kayitli_olta_setleri_n_setler', [S.gearSets.map((g, i) => _t('ui2.n_n_ad_mevcudu_kaydet', [img('gearset', 2), i, esc(g.name), g.rod ? ['rod', 'line', 'reel', 'hook'].map(k => { const it = GEAR[k].find(x => x.id === g[k]); return esc(it ? it.name : '?'); }).join(' · ') + ' · ' + esc(BAIT[g.bait || 'basic'].name) : _t('ui2.bos_set'), i, i, i, g.rod && editable ? '' : 'disabled'])).join('')]);
  },
  planTracker() {
    const el = $('plantrack'); if (!el) return; const show = S && S.plan && S.plan.goals.length && ['PierFishing', 'BoatFishing'].includes(Game.sceneName) && !Game.photo;
    const html = show ? _t('ui2.sefer_hedefleri_n', [S.plan.goals.map(g => `<div class="${g.got >= g.target ? 'ok' : ''}">${esc(knownFish(g.fid) ? FISH[g.fid].name_tr : '???')} ${g.got}/${g.target}</div>`).join('')]) : '';
    if (el._h !== html) { el._h = html; el.innerHTML = html; el.style.display = show ? '' : 'none'; }
  }
});
/* olta seti + yem: envanter ekipman sekmesi ve yem seçici */
{
  const inv0 = UI.P.Inventory;
  UI.P.Inventory = function (a) { const r = inv0.call(this, a); if (this.curTab('inv', 'fish') === 'gear') r.html += this.gearSetsHtml(); return r; };
  const bp0 = UI.A.baitPick;
  UI.A.baitPick = function (d) { bp0.call(this, d); if (!this.modal) return; const dl = this.modalEl.querySelector('.dlg'); if (dl) dl.insertAdjacentHTML('beforeend', this.gearSetsHtml()); };
}
/* otomatik olta cihazı başına yem politikası (Tekne Atölyesi donanım bölümü) */
{
  const lo0 = UI.loadoutHtml.bind(UI);
  UI.loadoutHtml = function () {
    let h = lo0(); if (!Object.keys(S.auto.devices).length) return h;
    h += _t('ui2.cihaz_basina_yem_politikasi');
    for (const d of Auto.DEV) {
      const dv = S.auto.devices[d]; if (!dv) continue; const p = Auto.policy(d);
      const bsel = (k) => `<select data-pol="${d}" data-pk="${k}">${['<option value="">—</option>'].concat(PAID_BAITS.map(b => `<option value="${b}" ${p[k] === b ? 'selected' : ''}>${esc(BAIT[b].name)} (${S.baitStock[b]})</option>`)).join('')}</select>`;
      const fsel = `<select data-pol="${d}" data-pk="target"><option value="">—</option>${FISH_LIST.filter(f => knownFish(f.id) && f.power <= 4).map(f => `<option value="${f.id}" ${p.target === f.id ? 'selected' : ''}>${esc(f.name_tr)}</option>`).join('')}</select>`;
      h += _t('ui2.n_n_bugune_kadar_n', [img(d, 2), esc(AUTO[d].name), dv.baitUsed || 0, Object.entries(POLICY_TR).map(([m, n]) => `<button class="${p.mode === m ? 'on' : ''}" data-a="polMode" data-d="${d}" data-m="${m}">${n}</button>`).join(''), p.mode === 'fixed' ? _t('ui2.yem_n_yoksa_cihaz_durur', [bsel('bait')]) : p.mode === 'backup' ? _t('ui2.ana_n_yedek_n', [bsel('bait'), bsel('backup')]) : p.mode === 'target' ? _t('ui2.hedef_tur_n_uygun_yem', [fsel]) : _t('ui2.stoktaki_en_ucuz_ucretli_yem')]);
    }
    return _t('ui2.n_temel_yem_otomatikte_kullanilamaz', [h]);
  };
  const oi0 = UI.onInput.bind(UI);
  UI.onInput = function (e) {
    const t = e.target;
    if (t.dataset.pol) { const r = Auto.setPolicy(t.dataset.pol, { [t.dataset.pk]: t.value || null }); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); return; }
    if (t.dataset.pkeep) { Plan.setKeep(t.checked); return; }
    return oi0(e);
  };
}
/* HUD: fotoğraf düğmesi + sefer takibi */
{
  const hud0 = UI.hud.bind(UI);
  UI.hud = function () { hud0(); if (!this.hudEl || this.hudEl.style.display === 'none') return; const fs = this.hudEl.querySelector('[data-a=fullscreen]'); if (fs && ['Town', 'PierFishing', 'BoatFishing', 'Home'].includes(Game.sceneName)) fs.insertAdjacentHTML('beforebegin', _t('ui2.n_fotograf_modu', [img('camera', 2)])); this.planTracker(); };
  const ref0 = UI.refresh.bind(UI);
  UI.refresh = function () { ref0(); this.planTracker(); };
}

/* ---------------- Fotoğraf modu ---------------- */
const Photo = {
  open() {
    if (!['Town', 'PierFishing', 'BoatFishing', 'Home'].includes(Game.sceneName)) { UI.toastNow(_t('ui2.fotograf_modu_kasaba_iskele_ev'), 'warn', 'camera'); return; }
    if (Fishing.ctx && !['READY', 'OUTCOME'].includes(Fishing.phase)) { UI.toastNow(_t('ui2.balik_mucadelesi_surerken_fotograf_modu'), 'warn', 'camera'); return; }
    UI.closePanel(true); UI.closeModal();
    const sc = Game.scene; Game.photo = { zoom: 1, px: 160, py: 90, cam0: sc && sc.cam != null ? sc.cam : null }; Game.paused = true; $('frame').classList.add('photo'); this.ui();
  },
  close() { const sc = Game.scene; if (Game.photo && sc && Game.photo.cam0 != null) sc.cam = Game.photo.cam0; Game.photo = null; Game.paused = false; $('frame').classList.remove('photo'); $('photoui').innerHTML = ''; UI.refresh(); },
  pan(dx, dy) {
    const p = Game.photo; if (!p) return;
    if (p.zoom === 2) { p.px = clamp(p.px + dx * 40, 0, 320); p.py = clamp(p.py + dy * 30, 0, 180); }
    else { const sc = Game.scene; const W = Game.sceneName === 'Town' ? TOWN_W : Game.sceneName === 'Home' ? HOME_W : Game.sceneName === 'BoatFishing' ? RW : LW; if (sc && sc.cam != null && p.cam0 != null) sc.cam = clamp(sc.cam + dx * 60, Math.max(0, p.cam0 - 200), Math.min(W - LW, p.cam0 + 200)); }
  },
  label() { const sc = Game.sceneName; const where = sc === 'BoatFishing' ? REGION[Game.scene.rid].name : sc === 'Home' ? _t('world.ev') : _t('ui2.sakin_liman'); return _t('ui2.gun_n_n_n', [S.day, SEASON_TR[World.season()], where]); },
  ui() {
    const p = Game.photo; $('photoui').innerHTML = _t('ui2.n_n_n_1_2', [img('left', 2), img('right', 2), p.zoom === 2 ? `<button class="btn" data-ph="u">▲</button><button class="btn" data-ph="d">▼</button>` : '', p.zoom === 1 ? 'on' : '', p.zoom === 2 ? 'on' : '', S.ui.photoLabel ? 'on' : '', img('camera', 1, 'ic')]);
  },
  act(k) {
    const p = Game.photo; if (!p) return;
    if (k === 'l') this.pan(-1, 0); if (k === 'r') this.pan(1, 0); if (k === 'u') this.pan(0, -1); if (k === 'd') this.pan(0, 1);
    if (k === 'z1') p.zoom = 1; if (k === 'z2') p.zoom = 2; if (k === 'lab') { S.ui.photoLabel = !S.ui.photoLabel; Save.soon(); }
    if (k === 'x') { this.close(); return; } if (k === 'save') this.save();
    this.ui();
  },
  /* görünür kareyi (BUF) ölçekleyip etiketle */
  composite(scale) {
    const p = Game.photo; const [c, x] = mkCanvas(LW * scale, LH * scale); x.imageSmoothingEnabled = false;
    if (p.zoom === 2) x.drawImage(BUF, p.px, p.py, 320, 180, 0, 0, c.width, c.height); else x.drawImage(BUF, 0, 0, c.width, c.height);
    return c;
  },
  save() {
    Sound.sfx('shutter');
    let c; try { c = this.composite(2); } catch (e) { UI.toastNow(_t('ui2.goruntu_olusturulamadi'), 'warn'); return; }
    const name = 'cozyfishing_gun' + S.day + '.png';
    try {
      c.toBlob(bl => {
        if (!bl) { this.fallback(c); return; }
        const u = URL.createObjectURL(bl); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 800);
        UI.toastNow(_t('ui2.fotograf_kaydedildi_indirilenler_tarayici_izin'), 'good', 'camera'); this.lastUrl = null;
      }, 'image/png');
    } catch (e) { this.fallback(c); }
  },
  fallback(c) { try { const u = c.toDataURL('image/png'); UI.showModal(_t('ui2.n_fotograf_tarayicin_dogrudan_indirmeye', [img('camera', 2), u]), 'wide'); } catch (e) { UI.toastNow(_t('ui2.bu_tarayici_fotograf_kaydetmeye_izin'), 'warn'); } }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-ph]'); if (b) { e.preventDefault(); Photo.act(b.dataset.ph); } });
/* akvaryum paneli: yalnızca panel açıkken çalışan canlı önizleme döngüsü */
{
  const rp0 = UI.renderPanel.bind(UI);
  UI.renderPanel = function (keep) {
    rp0(keep);
    if (this.panel !== 'Aquarium' || this._aqLoop) return;
    let last = performance.now();
    const loop = (ts) => {
      const c = $('aqc'); const tank = this.args && Aq.tank(this.args.tank);
      if (this.panel !== 'Aquarium' || !c || !tank) { this._aqLoop = null; return; }
      const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, c.width, c.height);
      try { drawTank(g, this.args.tank + ':ui', 6, 6, c.width - 12, c.height - 12, tank, performance.now() / 1000, 2, dt); } catch (e) { console.error(e); this._aqLoop = null; return; }
      this._aqLoop = requestAnimationFrame(loop);
    };
    this._aqLoop = requestAnimationFrame(loop);
  };
}
/* yardım: v2 bölümleri */
{
  const h0 = UI.P.Help;
  UI.P.Help = function (a) {
    const r = h0.call(this, a);
    r.html = _t('ui2.v2_0_yenilikleri_balikci_defteri', [r.html]);
    return r;
  };
}
