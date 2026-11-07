/* =====================================================================
   11_ui_v4.js : v4.0 arayüzü — kompakt sonuç, av temposu ayarı, Balıkçı Birliği, Kasaba Hikâyeleri ve
   Hatıra Albümü, Trofe Avları ve Kıyı Koleksiyonu sekmeleri, Kıyı Keşfi ve dürbün kontrolleri
   ===================================================================== */
const ALBUM_TXT = {
  efe_photo: ['Efe\'nin Eski Fotoğrafı', 'decor_efe_foto', 'efe'], mert_trip: ['İlk Yolculuk Hatırası (pusula)', 'al_mert_trip', 'mert'], elif_drawings: ['İki Deniz Çizimi', 'decor_elif_pano', 'elif'],
  kerem_exhibit: ['Kerem\'in Deniz Sergisi', 'decor_deniz_sergisi', 'kerem'], bora_plate: ['Bora\'nın Hatıra Levhası', 'decor_bora_levha', 'bora']
};
Object.assign(UI, {
  /* normal avlarda ~1 sn'lik küçük sonuç; yeni atış başlayınca kapanır, oyunu durdurmaz */
  showCompact(c) {
    const el = $('compact'); if (!el || QA.silent) return; const f = FISH[c.fid]; this._compactC = c;
    el.innerHTML = `<img class="pix" src="${fishUrl(c.fid, 1)}" alt=""><div><b>${esc(f.name_tr)}</b> <span class="small">${c.size.cm} cm · ${fmtKg(c.size.kg)} kg · ${coin(f.base_price)}</span><small>→ ${esc(c.where === 'bag' ? 'Çanta' : Inv.label(c.where))}</small></div><button class="btn g" data-a="quickCast" ${S.lastCast ? '' : 'disabled'}>${img('quick', 1, 'ic')} Tekrar At</button><button class="btn" data-a="compactInfo">İncele</button>`;
    el.style.display = ''; const st = $('storytrack'); if (st) st.style.visibility = 'hidden'; clearTimeout(this._compactTm); this._compactTm = setTimeout(() => this.hideCompact(), 2600);
  },
  hideCompact() { const st = $('storytrack'); if (st) st.style.visibility = ''; const el = $('compact'); if (el && el.style.display !== 'none') { el.style.display = 'none'; el.innerHTML = ''; } clearTimeout(this._compactTm); },
  storyTracker() {
    const el = $('storytrack'); if (!el || !S || !S.storyTrack) return; const show = S.storyTrack.length && ['Town', 'PierFishing', 'BoatFishing', 'Home'].includes(Game.sceneName) && !Game.photo && !['REELING', 'QUICK_PULL', 'BITE_WINDOW', 'CHARGING'].includes(Fishing.phase) && !(Game.scene && Game.scene.bin);
    const html = show ? `<b>HİKÂYELER</b>${S.storyTrack.map(n => `<div>${esc(NPCS[n].name)}: ${esc(Stories.goal(n))}</div>`).join('')}` : '';
    if (el._h !== html) { el._h = html; el.innerHTML = html; el.style.display = show ? '' : 'none'; }
  },
  storyBox(npc) {
    const s = Stories.st(npc); const D = V4.stories[npc];
    if (s.stage === 0) return `<div class="evbox small">${img('story', 1, 'ic')} <b>${esc(D.title)}</b> · Açılma: ${esc(D.unlock)}</div>`;
    if (s.stage === 4) return `<div class="evbox small">${img('story', 1, 'ic')} <b>${esc(D.title)}</b> · tamamlandı (Gün ${s.done}). Hatıra Albümü'nde yeniden okuyabilirsin.</div>`;
    const talk = Stories.canTalk(npc) && (npc !== 'bora' || Game.sceneName === 'Town');
    return `<div class="evbox">${img('story', 2)} <b>${esc(D.title)}</b> · Aşama ${s.stage}/3<div class="small">${esc(Stories.goal(npc))}</div>${talk ? `<div class="btns left"><button class="btn g sm" data-a="storyTalk" data-npc="${npc}">${npc === 'mert' && s.stage === 1 ? 'Konuş ve geziye davet et' : 'Konuş'}</button></div>` : ''}</div>`;
  },
  shoreBar(sc) {
    const s = Shore.session(); const env = s ? s.env : sc.env;
    this.bottom.innerHTML = `<div class="bl"><button class="btn" data-a="shoreBack">${img('exit', 2)}<span class="lbl">Kasaba</span></button></div><div class="bc"><span class="hint">${esc(V4.shoreEnv[env].name)} · ${{ sand: 'İpucu olan noktayı kaz', rocks: 'Kabarcıklı kayayı kaldır', tide: 'Su çekilince parlayanı seç' }[env]}</span></div><div class="br"><button class="btn" data-a="shoreHint" ${s && !s.done ? '' : 'disabled'}>${img('inspect', 2)}<span class="lbl">İpucu Göster</span></button><button class="btn" data-a="shoreCol">${img('shore', 2)}</button></div>`;
  },
  shoreResult() {
    const s = S.shore.session; if (!s || !s.done) return;
    this.showModal(`<h3>${img('shore', 2)} Kıyı Keşfi tamamlandı</h3><div class="optgrid">${s.found.map(id => `<div class="opt"><img class="pix" style="width:48px" src="${shoreUrl(id, 3, true)}" alt=""><b>${esc(SHORE[id].name)}</b><small>${esc(SHORE[id].cat)}${(s.newItems || []).includes(id) ? ' · <span class="ok">YENİ!</span>' : ' · tekrar (' + S.shore.items[id].n + '. kez)'}</small></div>`).join('')}</div><p class="small">Koleksiyon: <b>${Shore.count()}/${V4.shore.length}</b> · ${s.taps} inceleme${s.hints ? ' · ' + s.hints + ' ipucu' : ''}. Yarın yeni bir keşif yapabilirsin.</p><div class="btns"><button class="btn" data-a="shoreColM">Koleksiyon</button><button class="btn g" data-a="shoreDone">Kasabaya dön</button></div>`, 'wide');
  }
});
/* ---- paneller ---- */
Object.assign(UI.P, {
  Guild() {
    const G = Guild.ensure(); if (!G) return { title: 'Balıkçı Birliği', icon: 'guild', html: '<p>Birlik panosu 3. oyun gününde açılır.</p>' };
    const end = G.week * 7; const stg = { early: 'Başlangıç', mid: 'Orta oyun', late: 'İleri oyun' }[Guild.stage()];
    let html = `<div class="evbox">${img('guild', 2)} ${G.week}. hafta (Gün ${end - 6}–${end}) · Görevler isteğe bağlıdır, cezası yoktur. Bu hafta ${G.rerolled ? 'görev değiştirme hakkını kullandın' : '<b>1 ücretsiz görev değiştirme</b> hakkın var'}. Ödüller görevin seçildiği andaki ilerleme seviyesine göre (şu an: ${stg}).</div>`;
    html += G.tasks.map(t => { const T = GUILDT[t.id]; const r = t.reward; return `<div class="guildtask ${t.claimed ? 'claimed' : t.done ? 'done' : ''}"><div class="row"><span class="badge ${T.nonFish ? 'new' : 'big'}">${T.id}</span><div class="grow"><b>${esc(T.name)}</b> ${T.nonFish ? '<span class="dim small">· balık tutmadan</span>' : ''}<div class="small">${esc(T.desc)}</div><div class="bar"><i style="width:${t.prog / T.need * 100}%"></i><span>${t.prog}/${T.need}</span></div></div><div class="center small">${coin(r.cash)}<br>+${r.n} ${esc(BAIT[r.bait].name)}</div></div><div class="of"><span class="sp"></span>${t.claimed ? '<span class="ok small">Ödül alındı</span>' : t.done ? `<button class="btn g sm" data-a="guildClaim" data-id="${t.id}">Ödülü Al</button>` : `<button class="btn sm" data-a="guildReroll" data-id="${t.id}" ${G.rerolled ? 'disabled' : ''}>Görevi değiştir</button>`}</div></div>`; }).join('');
    const tot = sum(G.tasks.map(t => Guild.value(t.reward)));
    html += `<p class="dim small">Haftalık toplam ödül değeri ≈ ${fmt(tot)} (para + yem). Görevler yalnızca bu hafta yapılan gerçek faaliyetlerle ilerler; filo ve otomatik olta balıkları manuel av görevlerini ilerletmez.</p>`;
    return { title: 'Balıkçı Birliği', icon: 'guild', html, cls: 'wide' };
  },
  Stories() {
    const tab = this.curTab('st', 'stories'); const tabs = this.tabsHtml('st', [['stories', 'Kasaba Hikâyeleri'], ['album', 'Hatıra Albümü']]);
    let html = '';
    if (tab === 'stories') html = STORY_NPCS.map(n => { const s = Stories.st(n), D = V4.stories[n]; const tr = S.storyTrack.includes(n); return `<div class="order ${s.stage === 4 ? 'done2' : ''}"><div class="oh"><img class="pix portrait" style="width:44px" src="${portraitUrl(NPCS[n].look, 2)}" alt=""><b>${esc(D.title)}</b><span class="sp"></span><span class="badge ${s.stage === 4 ? 'new' : s.stage ? 'big' : 'rec'}">${s.stage === 4 ? 'Tamamlandı' : s.stage ? 'Aşama ' + s.stage + '/3' : 'Kilitli'}</span></div><div class="small">Açılma şartı: ${esc(D.unlock)}</div><div class="small"><b>${s.stage === 4 ? 'Ödül alındı' : 'Sonraki hedef'}:</b> ${esc(Stories.goal(n))}</div><div class="small dim">Ödül: ${esc(D.reward.name)}</div><div class="of"><span class="sp"></span>${s.stage >= 1 && s.stage < 4 ? `<button class="btn sm ${tr ? 'on' : ''}" data-a="storyTrack" data-npc="${n}">${tr ? 'Takibi bırak' : 'HUD\'da takip et'}</button>` : ''}</div></div>`; }).join('') + '<p class="dim small">Hikâyelerin süre sınırı veya başarısızlık cezası yoktur. En fazla iki hikâye ekranda takip edilebilir.</p>';
    else html = S.album.length ? S.album.map(a => { const T = TROPHY[a.id]; if (T) return `<div class="row">${img('tr_' + a.id, 2)}<div class="grow"><b>${esc(T.name)}</b> <span class="dim small">trofe · Gün ${a.day}</span><div class="small">${esc(FISH[T.fid].name_tr)} · ${S.trophy.done[a.id].cm} cm / ${fmtKg(S.trophy.done[a.id].kg)} kg · ödül: ${esc(T.reward.name)}</div></div></div>`; const A = ALBUM_TXT[a.id]; if (!A) return ''; const D = V4.stories[A[2]]; return `<details class="row"><summary>${img(A[1], 2)} <b>${esc(A[0])}</b> <span class="dim small">· ${esc(NPCS[A[2]].name)} · Gün ${a.day}</span></summary><div class="small">${D.stages.map(st => st.talk || st.found).filter(Boolean).map(x => '“' + esc(x) + '”').join('<br>')}</div></details>`; }).join('') : '<p class="dim">Albüm boş. Tamamlanan hikâyeler ve trofeler burada saklanır.</p>';
    return { title: 'Kasaba Hikâyeleri', icon: 'story', tabs, html, cls: 'wide' };
  }
});
{
  const P2 = Object.assign({}, UI.P);
  UI.P.Journal = function () {
    const tab = this.curTab('jr', 'guide'); if (this.sel.jrFish) return P2.Journal.call(this);
    const tabs = this.tabsHtml('jr', [['guide', 'Tür Rehberi'], ['today', 'Bugünkü Av'], ['log', 'Av Kayıtları'], ['missing', 'Eksik Türler'], ['fav', 'Favoriler'], ['wild', 'Deniz Yaşamı'], ['trophy', 'Trofe Avları'], ['shore', 'Kıyı Koleksiyonu']]);
    if (tab === 'trophy') return { title: 'Balıkçı Defteri', icon: 'journal', tabs, html: this.trophyHtml(), cls: 'wide' };
    if (tab === 'shore') return { title: 'Balıkçı Defteri', icon: 'journal', tabs, html: this.shoreHtml(), cls: 'wide' };
    const r = P2.Journal.call(this); r.tabs = tabs; return r;
  };
  UI.P.People = function () { const r = P2.People.call(this); r.html = `<div class="btns left"><button class="btn g" data-a="openPanel" data-p="Stories">${img('story', 1, 'ic')} Kasaba Hikâyeleri (${STORY_NPCS.filter(n => Stories.st(n).stage === 4).length}/5)</button><button class="btn" data-a="albumOpen">${img('album', 1, 'ic')} Hatıra Albümü</button></div>` + r.html; return r; };
  UI.P.Dialog = function (a) { const r = P2.Dialog.call(this, a); if (V4.stories[a.npc]) r.html = r.html.replace('<div class="btns">', this.storyBox(a.npc) + '<div class="btns">'); return r; };
  UI.P.HomeGoods = function () { const r = P2.HomeGoods.call(this); r.html = this.storyBox('kerem') + (Stories.st('kerem').stage === 4 ? `<div class="row">${img('decor_deniz_sergisi', 2)}<div class="grow small"><b>Sergi köşesi</b>: ${Object.keys(S.shore.items).slice(0, 8).map(id => esc(SHORE[id].name)).join(', ')}</div></div>` : '') + r.html; return r; };
  UI.P.Boatyard = function () { const r = P2.Boatyard.call(this); if (this.curTab('yard', 'boats') === 'boats') r.html = this.storyBox('bora') + r.html; if (this.curTab('yard', 'boats') === 'look' && S.boats.owned.length) { const selB = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : S.boats.active; const b = S.boats.byId[selB]; const orn = S.cosmetics.ornaments || []; r.html += `<h4>Trofe süsleri</h4><div class="optgrid">${['orn_tr_levrek', 'orn_tr_barrakuda'].map(id => { const own = orn.includes(id); const T = V4.trophies.find(t => t.reward.id === id); return `<button class="opt ${b && b.ornament === id ? 'on' : ''} ${own ? '' : 'lock'}" data-a="${own ? 'ornSet' : 'noop'}" data-id="${id}">${img(id, 2)}<b>${esc(T.reward.name)}</b><small>${own ? (b && b.ornament === id ? 'Takılı' : 'Tak') : 'Trofe: ' + esc(T.name)}</small></button>`; }).join('')}</div>`; } return r; };
  UI.P.Menu = function () { const r = P2.Menu.call(this); const nb = k => Unlocks.fresh(k) ? ' <span class="badge new">yeni</span>' : ''; r.html = r.html.replace('<button class="btn sm" data-a="photoOpen">', `<button class="btn sm" data-a="openPanel" data-p="Guild">${img('guild', 1, 'ic')} Birlik${nb('guild')}</button><button class="btn sm" data-a="openPanel" data-p="Stories">${img('story', 1, 'ic')} Hikâyeler${nb('boatStories') || nb('efe')}</button><button class="btn sm" data-a="jrTab" data-t="trophy">${img('trophy_t', 1, 'ic')} Trofeler${nb('trophy')}</button><button class="btn sm" data-a="jrTab" data-t="shore">${img('shore', 1, 'ic')} Kıyı Koleksiyonu${nb('shore')}</button><button class="btn sm" data-a="photoOpen">`); return r; };
  UI.P.Settings = function () { const r = P2.Settings.call(this); const inGame = !!S && Game.sceneName !== 'MainMenu'; const tg = (k, n, d) => `<label class="kv tg"><input type="checkbox" data-set="${k}" ${SETTINGS[k] !== false ? 'checked' : ''}><span>${n}</span><small class="dim">${d}</small></label>`;
    r.html = (inGame ? `<h4>Av temposu</h4><div class="optgrid">${[['flow', 'Akıcı Av (varsayılan)', 'Bekleme 1,5–3,5 sn · normal avlarda kompakt sonuç · güç 1 balıkta hızlı çekiş'], ['classic', 'Klasik Av', 'Bekleme 2–6 sn · her yakalamada ayrıntılı sonuç kartı']].map(([k, n, d]) => `<button class="opt ${Tempo.cur() === k ? 'on' : ''}" data-a="setTempo" data-v="${k}"><b>${n}</b><small>${d}</small></button>`).join('')}</div><p class="dim small">İki modda enerji, yem, tür olasılığı, boy dağılımı, tasma penceresi ve fiyatlar aynıdır. Devam eden atış değişmez; yeni seçim sonraki atıştan itibaren geçerlidir.</p>` : '') + r.html.replace('<h4>Ekran</h4>', `${tg('vibrate', 'Titreşim', 'Vuruş ve özel hamle uyarılarında (destekleyen cihazlarda)')}<h4>Ekran</h4>`); return r; };
}
Object.assign(UI, {
  trophyHtml() {
    const tg = S.trophy.target;
    let html = `<div class="evbox">${img('trophy_t', 2)} Yedi bölgesel trofe: mevcut türlerin özel mücadele davranışlı büyük örnekleri. Aynı anda bir hedef seçebilirsin; doğru bölgede ve uygun noktada ortalama 4–6 atışta bir trofe izi çıkar (yakalamak garanti değil). Trofe balığı normal taban fiyatıyla satılır.</div>`;
    html += V4.trophies.map(t => { const f = FISH[t.fid], un = Trophy.unlocked(t.id), d = S.trophy.done[t.id], b = S.trophy.best[t.id]; const act = tg === t.id;
      return `<div class="order ${d ? 'done2' : ''}"><div class="oh">${un ? fishImgAlways(t.fid, 1, 'mini') : `<img class="pix mini" src="${fishSilUrl(t.fid, 1)}" alt="">`}<b>${un ? esc(t.name) : '??? · ' + esc(REGION[t.rid].name)}</b> <span class="dim small">${un ? esc(f.name_tr) + ' · ' + esc(REGION[t.rid].name) : 'Önce türü keşfet'}</span><span class="sp"></span>${img('tr_' + t.id, 2)}</div>
        ${un ? `<div class="small">${esc(t.desc)}</div><div class="small">Güç ${f.power} · gerekli olta gücü ≥ ${Math.max(1, f.power - 1)} (şu an ${rodOf().power}) · önerilen yöntem: ${V3.methods[Methods.of(t.fid)[0]].short} · önerilen yem: ${esc(BAIT[f.favored_baits[0]].name)}</div><div class="small">${d ? `İlk yakalama: Gün ${d.day} · en büyük ${b.cm} cm / ${fmtKg(b.kg)} kg · <span class="ok">Ödül alındı: ${esc(t.reward.name)}</span>` : 'Ödül (bir kez): ' + esc(t.reward.name)}</div><div class="of"><span class="sp"></span><button class="btn sm ${act ? 'on' : 'g'}" data-a="trophyTarget" data-id="${act ? '' : t.id}">${act ? 'Aktif hedef (bırak)' : 'Hedef seç'}</button></div>` : ''}</div>`; }).join('');
    html += `<p class="small">${Object.keys(S.trophy.done).length}/7 trofe${S.ach.trophy7 ? ' · <b class="ok">Yedi Denizin Ustası</b>' : ''}</p>`;
    return html;
  },
  shoreHtml() {
    const n = Shore.count(); const cats = ['Kabuk', 'Deniz Camı', 'Kıyı Taşı', 'Deniz Hatırası'];
    let html = `<div class="evbox">${img('shore', 2)} Kıyı koleksiyonu: <b>${n}/24</b> · ${img(S.ach.shore6 ? 'badge_b' : 'lock', 1, 'ic')} 6: rozet · ${img(S.ach.shore12 ? 'decor_kabuk_sergisi' : 'lock', 1, 'ic')} 12: kabuk sergisi · ${img(S.ach.shore18 ? 'decor_poster_shore' : 'lock', 1, 'ic')} 18: poster · ${img(S.ach.shore24 ? 'title' : 'lock', 1, 'ic')} 24: unvan</div>`;
    html += cats.map(c => `<h4>${esc(c)}</h4><div class="ency shoregrid">${V4.shore.filter(x => x.cat === c).map(x => { const e = S.shore.items[x.id]; return `<div class="ecard ${e ? '' : 'lock'}" title="${esc(e ? x.info : 'Henüz bulunmadı')}"><img class="pix" src="${shoreUrl(x.id, 3, !!e)}" alt=""><span><b>${e ? esc(x.name) : '???'}</b></span>${e ? `<small class="dim">${esc(x.info)}</small><small>İlk: Gün ${e.first} · ${e.n} kez</small>` : `<small class="dim">${x.env.map(v => V4.shoreEnv[v].name).join(', ')}</small>`}</div>`; }).join('')}</div>`).join('');
    return html + `<p class="dim small">Nesneler satılamaz ve balık deposunu doldurmaz. ${Shore.unlocked() ? (S.shore.day === S.day ? 'Bugünkü keşif tamamlandı.' : 'Bugün kıyı keşfi yapabilirsin (iskele yanındaki Sahil Patikası).') : 'İlk başarılı avdan sonra açılır.'}</p>`;
  }
});
/* ---- av ekranı: kompakt sonuç, dürbün, hikâye incelemesi, yön düğmeleri ---- */
{
  const sc0 = UI.showCatch.bind(UI);
  UI.showCatch = function (c, storage) {
    sc0(c, storage); const T = c.trophy && TROPHY[c.trophy];
    if (T) { const h = this.modalEl.querySelector('h2'); if (h) h.insertAdjacentHTML('afterend', `<div><span class="badge huge">TROFE · ${esc(T.name)}</span>${c.trophyFirst ? `<div class="ok small">İlk trofe ödülü: ${esc(T.reward.name)} (Hatıra Albümü'ne eklendi)</div>` : '<div class="dim small">Bu trofe daha önce kazanıldı; ödül tekrar verilmez.</div>'}</div>`); }
  };
  const fb0 = UI.fishBar.bind(UI);
  UI.fishBar = function (sc) {
    fb0(sc); const br = this.bottom.querySelector('.br'); const bb = $('baitBtn');
    if (br && bb) bb.insertAdjacentHTML('beforebegin', `<button class="btn" id="inspBtn" data-a="storyInspect" style="display:none">${img('inspect', 2)}<span class="lbl">İncele</span></button>`);
    if (Game.sceneName === 'BoatFishing' && Binoc.unlocked()) { const bl = this.bottom.querySelector('.bl'); if (bl) bl.insertAdjacentHTML('beforeend', sc.bin ? `<button class="btn r" data-a="binocEnd">${img('binoc', 2)}<span class="lbl">İndir</span></button>` : `<button class="btn" id="binBtn" data-a="binocStart">${img('binoc', 2)}<span class="lbl">Dürbün</span></button>`); }
    this.fishBarUpdate();
  };
  const fu0 = UI.fishBarUpdate.bind(UI);
  UI.fishBarUpdate = function () {
    fu0(); const ph = Fishing.phase; const sc = Game.scene; this.storyTracker();
    const ib = $('inspBtn'); if (ib) { const sid = Game.sceneName === 'PierFishing' ? PIER_SPOTS[sc.idx] : Game.sceneName === 'BoatFishing' && sc.atSpot && sc.atSpot() ? sc.spotId() : null; ib.style.display = ph === 'READY' && sid && Stories.inspectable(sid).length ? '' : 'none'; }
    const bb = $('binBtn'); if (bb) { const why = Binoc.reason(); bb.style.display = S.trip && !S.trip.binoc ? '' : 'none'; bb.classList.toggle('dimbtn', !!why); bb.title = why || 'Dürbünle gözlem (5 enerji)'; }
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
  setTempo(d) { const r = Tempo.set(d.v); if (r.ok) this.toastNow('Av temposu: ' + (d.v === 'flow' ? 'Akıcı Av' : 'Klasik Av') + (r.note ? ' · ' + r.note : ''), 'good', 'tempo'); this.renderPanel(true); },
  guildClaim(d) { const r = Guild.claim(d.id); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow('Birlik ödülü: +' + fmt(r.r.cash) + ' para, +' + r.r.n + ' ' + BAIT[r.r.bait].name, 'good', 'guild'); this.renderPanel(true); },
  guildReroll(d) { this.confirm({ title: 'Görevi değiştir', icon: 'guild', text: 'Haftada bir kez ücretsizdir. Bu görevdeki ilerleme yeni göreve aktarılmaz.', ok: 'Değiştir', onOk: () => { const r = Guild.reroll(d.id); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow('Yeni görev: ' + GUILDT[r.id].name, 'good', 'guild'); } }); },
  storyTalk(d) { const r = Stories.talk(d.npc); if (!r.ok) { if (r.msg) this.toastNow(r.msg, 'warn'); return; } this.confirm({ title: NPCS[d.npc].name, icon: 'story', html: `<div class="npc"><img class="pix portrait" src="${portraitUrl(NPCS[d.npc].look, 2)}" alt=""><p>“${esc(r.line)}”</p></div>${r.done ? `<div class="ok">Hikâye tamamlandı! Ödül: ${esc(V4.stories[d.npc].reward.name)} (Hatıra Albümü)</div>` : `<div class="small">Sonraki hedef: ${esc(Stories.goal(d.npc))}</div>`}`, ok: 'Tamam', cancel: 'Kapat' }); },
  storyTrack(d) { Stories.track(d.npc); this.renderPanel(true); this.storyTracker(); },
  storyInspect() { const sc = Game.scene; const sid = Game.sceneName === 'PierFishing' ? PIER_SPOTS[sc.idx] : sc.spotId(); const n = Stories.inspectable(sid)[0]; if (!n) return; const r = Stories.inspect(n, sid); if (r.ok) this.confirm({ title: 'İnceleme', icon: 'inspect', text: r.text, ok: 'Tamam', cancel: 'Kapat' }); this.fishBarUpdate(); },
  albumOpen() { this.tab.st = 'album'; this.openPanel('Stories'); },
  jrTab(d) { this.tab.jr = d.t; this.sel.jrFish = null; this.openPanel('Journal'); },
  trophyTarget(d) { const r = Trophy.setTarget(d.id || null); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(d.id ? 'Trofe hedefi: ' + TROPHY[d.id].name : 'Trofe hedefi bırakıldı.', 'good', 'trophy_t'); this.renderPanel(true); },
  binocStart() { if (Game.sceneName === 'BoatFishing') Game.scene.startBinoc(); },
  binocEnd() { if (Game.sceneName === 'BoatFishing' && Game.scene.bin) { Game.scene.endBinoc(null); } },
  beachOpen() {
    if (!Shore.unlocked()) { this.toastNow('Kıyı Keşfi ilk başarılı avdan sonra açılır.', 'info', 'shore'); return; }
    if (Shore.session() && !Shore.session().done) { go('Shore', {}); return; }
    if (S.shore.day === S.day) { this.confirm({ title: 'Kıyı Keşfi', icon: 'shore', text: 'Bugünkü kıyı keşfini tamamladın. Yarın yeni bir keşif yapabilirsin. Koleksiyon: ' + Shore.count() + '/24.', ok: 'Koleksiyonu aç', cancel: 'Kapat', onOk: () => { this.tab.jr = 'shore'; this.sel.jrFish = null; this.openPanel('Journal'); } }); return; }
    this.showModal(`<h3>${img('shore', 2)} Sahil Patikası · Kıyı Keşfi</h3><p class="small">Günde bir keşif · enerji ve para harcamaz · süre sınırı yok, yanlış seçim cezasız. Koleksiyon ${Shore.count()}/24.</p><div class="optgrid">${Object.entries(V4.shoreEnv).map(([k, e]) => `<button class="opt" data-a="shoreStart" data-v="${k}"><b>${esc(e.name)}</b><small>${esc(e.desc)}</small></button>`).join('')}</div><div class="btns"><button class="btn" data-a="mCancel">Vazgeç</button></div>`, 'wide');
  },
  shoreStart(d) { const r = Shore.start(d.v); this.closeModal(); if (!r.ok) { if (r.msg) this.toastNow(r.msg, 'warn'); return; } go('Shore', {}); },
  shoreBack() { go('Town', { at: 'beach' }); },
  shoreHint() { Shore.hint(); this.toastNow((Shore.session() && Shore.session().hints >= 2) ? 'Doğru noktanın üstünde bir ok belirdi.' : 'İpuçları belirginleşti: ' + ({ sand: 'farklı renk, parıltı, dalga izi veya taş dizilimine bak.', rocks: 'kabarcıkların ve küçük izlerin olduğu kayaya bak.', tide: 'su çekilince parlayan nesneyi seç.' }[Game.scene.env]), 'info', 'inspect'); },
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
  Photo.act = function (k) { if (k === 'prev' && Game.photo) { try { const c = this.composite(1); UI.toastNow('Önizleme oluşturuldu (' + c.width + '×' + c.height + ').', 'good', 'camera'); } catch (e) { } this.ui(); return; } return pact0(k); };
  const pui0 = Photo.ui.bind(Photo);
  Photo.ui = function () { pui0(); const bar = $('photoui').querySelector('.photobar'); if (bar && !bar.querySelector('[data-ph=prev]')) bar.insertAdjacentHTML('beforeend', '<button class="btn" data-ph="prev">Önizle</button>'); };
}
