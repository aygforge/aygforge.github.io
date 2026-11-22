'use strict';
/* ---- 11_ui.js ---- */
/* =====================================================================
   11_ui.js : HUD, toast, sahne çubukları ve tüm işlevli paneller
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const coin = n => `<span class="money">${img('coin', 1, 'ic')}${fmt(n)}</span>`;
const fishImg = (id, sc, cls) => S.ency[id] && S.ency[id].caught ? `<img class="pix ${cls || ''}" src="${fishUrl(id, sc || 1)}" alt="">` : `<img class="pix ${cls || ''}" src="${fishSilUrl(id, sc || 1)}" alt="">`;
const fishImgAlways = (id, sc, cls) => `<img class="pix ${cls || ''}" src="${fishUrl(id, sc || 1)}" alt="">`;
const fishName = id => S.ency[id] && S.ency[id].caught ? FISH[id].name_tr : FISH[id].name_tr;
const powerStr = p => '●'.repeat(p) + '○'.repeat(5 - p);

const UI = {
  panel: null, args: {}, tab: {}, sel: {}, qty: {}, modal: null, lastClick: 0, toasts: [],
  init() {
    installSkins();
    this.frame = $('frame'); this.hudEl = $('hud'); this.bottom = $('bottom'); this.sceneui = $('sceneui'); this.panelEl = $('panel'); this.modalEl = $('modal'); this.toastEl = $('toasts'); this.objEl = $('objective');
    const route = (e) => {
      const t = e.target.closest('[data-a]'); if (!t || t.disabled) return;
      const now = performance.now(); if (now - this.lastClick < 260 && t === this._lastT) return; this.lastClick = now; this._lastT = t;
      e.preventDefault(); this.act(t.dataset.a, t.dataset, t);
    };
    [this.hudEl, this.bottom, this.sceneui, this.panelEl, this.modalEl, this.objEl].forEach(el => el.addEventListener('click', route));
    this.panelEl.addEventListener('input', e => this.onInput(e)); this.modalEl.addEventListener('input', e => this.onInput(e)); this.sceneui.addEventListener('input', e => this.onInput(e));
    this.panelEl.addEventListener('change', e => this.onInput(e)); this.sceneui.addEventListener('change', e => this.onInput(e)); this.modalEl.addEventListener('change', e => this.onInput(e));
  },
  modalOpen() { return !!this.panel || !!this.modal; },
  /* dil seçimi (Ayarlar): her dil kendi yerel adıyla */
  langHtml() { return `<h4>${_t('i18n.lang_title')}</h4><div class="btns left langs">${I18N.LANGS.map(l => `<button class="btn sm ${I18N.lang === l.code ? 'g' : ''}" data-a="setLang" data-v="${l.code}" lang="${l.code}">${esc(l.name)}</button>`).join('')}</div>`; },
  /* dil değişince: önbellekteki yazılı görseller silinir, sahne çubuğu / HUD / açık panel yeniden çizilir (ilerleme etkilenmez) */
  relocalize() {
    try { Atlas.cache.clear(); Atlas.urls.clear(); TXT.clear(); } catch (e) { }
    const n = Game.sceneName, sc = Game.scene;
    try {
      if (n === 'MainMenu') this.mainMenu(); else if (n === 'CharacterCreator') this.charCreator(sc); else if (n === 'Town') this.townBar(sc); else if (n === 'Home') this.homeBar(sc);
      else if ((n === 'PierFishing' || n === 'BoatFishing') && !sc.bin) this.fishBar(sc); else if (n === 'SeaMap') this.mapPanel(sc); else if (n === 'Shore') this.shoreBar(sc);
    } catch (e) { console.error('relocalize', e); }
    this.refresh(); if (this.panel) this.renderPanel(true);
  },
  onScene(name) {
    this.closePanel(true); this.closeModal(); this.sceneui.innerHTML = ''; this.bottom.innerHTML = ''; this.bottom.classList.remove('fishing');
    const showHud = !['MainMenu', 'CharacterCreator', 'EndDay'].includes(name);
    this.hudEl.style.display = showHud ? '' : 'none'; this.objEl.style.display = showHud ? '' : 'none';
    if (name === 'MainMenu') this.mainMenu();
    this.refresh();
  },
  refresh() {
    if (!S || (typeof QA !== 'undefined' && QA.silent)) return;
    this.hud(); this.objective();
    if (this.panel) this.renderPanel(true);
    if (Game.sceneName === 'PierFishing' || Game.sceneName === 'BoatFishing') this.fishBarUpdate();
    if (Game.sceneName === 'SeaMap' && Game.scene && Game.scene.sel) this.mapPanel(Game.scene);
  },
  hud() {
    if (!S || this.hudEl.style.display === 'none') return;
    const rod = rodOf(); const wx = S.world.weather[Game.sceneName === 'BoatFishing' ? Game.scene.rid : 'sakin_liman'] || 'sunny'; const ev = World.event();
    const casts = Math.floor(S.energy / rod.energy);
    const ab = S.boats.active; const inBoat = Game.sceneName === 'BoatFishing';
    let h = _t('ui.n_menu', [img('menu', 2)]);
    h += _t('ui.n_gun_n_n_n', [img(World.season(), 1, 'ic'), S.day, SEASON_TR[World.season()], World.seasonDay(), World.year()]);
    h += _t('ui.n_n_hava_n', [WEATHER_TR[wx], img(wx, 1, 'ic'), WEATHER_TR[wx]]);
    if (ev) h += _t('ui.n_n_gunun_olayi', [img('event', 1, 'ic'), esc(ev.name)]);
    { const fe = World.festival(), nf = World.nextFestival(); if (fe) h += _t('ui.n_n_senlik', [img('festival', 1, 'ic'), esc(fe.name)]); else if (nf && nf.inDays <= 5) h += _t('ui.n_n_gun_yaklasan_senlik', [img('festival', 1, 'ic'), nf.inDays]); }
    h += `<div class="chip">${img('coin', 1, 'ic')}<b>${fmt(S.cash)}</b></div>`;
    h += _t('ui.n_n_n_atis_enerji', [img('energy', 1, 'ic'), S.energy, S.energy, casts]);
    h += `<button class="chip" data-a="openPanel" data-p="Inventory">${img('bag', 1, 'ic')}<span>${Inv.used('bag')}/${Inv.cap('bag')}</span></button>`;
    if (ab && (inBoat || ['Town', 'SeaMap', 'PierFishing'].includes(Game.sceneName))) h += `<button class="chip" data-a="openPanel" data-p="Inventory">${img('boat', 1, 'ic')}<span>${Inv.used('boat:' + ab)}/${Inv.cap('boat:' + ab)}</span></button>`;
    if (Object.keys(S.auto.devices).length) h += _t('ui.n_n_n_gunluk_otomatik', [img('auto1', 1, 'ic'), S.auto.dailyCaught, Auto.dayCap()]);
    h += _t('ui.n_tam_ekran', [img('fullscreen', 2)]);
    this.hudEl.innerHTML = h;
  },
  objective() {
    const t = S && Tutorial.current(); if (!t || !this.objEl || this.objEl.style.display === 'none') { this.objEl.innerHTML = ''; return; }
    this.objEl.innerHTML = _t('ui.n_n_ogreticiyi_atla', [img('star', 1, 'ic'), esc(t.t)]);
  },
  toastNow(msg, kind, icon) { if (typeof QA !== 'undefined' && QA.silent) return; Bus.toast(msg, kind, icon); this.pump(); },
  pump() {
    if (typeof QA !== 'undefined' && QA.silent) return;
    const q = Bus.take();
    for (const t of q) {
      const d = document.createElement('div'); d.className = 'toast ' + (t.kind || 'info'); d.innerHTML = (t.icon ? img(t.icon, 2) : '') + '<span>' + esc(t.msg) + '</span>';
      this.toastEl.appendChild(d); setTimeout(() => d.classList.add('out'), 3200); setTimeout(() => d.remove(), 3800);
      while (this.toastEl.children.length > 3) this.toastEl.firstChild.remove();
    }
  },
  /* -------- eylem yönlendirici -------- */
  act(a, d, el) {
    Sound.start(); Sound.sfx('click');
    const f = this.A[a]; if (f) f.call(this, d, el); else console.warn('eylem yok', a);
  },
  onInput(e) {
    const t = e.target;
    if (t.dataset.set) { SETTINGS[t.dataset.set] = t.type === 'checkbox' ? t.checked : parseFloat(t.value); Save.saveSettings(SETTINGS); Sound.apply(); }
    if (t.dataset.cc) { const cc = Game.scenes.CharacterCreator; cc.look[t.dataset.cc] = t.dataset.cc === 'name' ? t.value : t.value; }
    if (t.dataset.chk) { this.sel[t.dataset.chk] = t.checked; this.renderPanel(true); }
  },
  /* -------- panel sistemi -------- */
  openPanel(name, args) { if (Fishing.ctx && !['READY', 'OUTCOME'].includes(Fishing.phase) && !['Settings', 'Help'].includes(name)) { Fishing.say(_t('ui.once_avi_tamamla'), 1.4); return; } if (this.panel !== name) for (const k in this.npcLines) delete this.npcLines[k]; this.panel = name; this.args = args || {}; this.renderPanel(); },
  closePanel(silent) { this.panel = null; this.frame.classList.remove('haspanel'); this.panelEl.innerHTML = ''; this.panelEl.classList.remove('on'); if (!silent && Game.sceneName) this.refresh(); },
  renderPanel(keep) {
    const fn = this.P[this.panel]; if (!fn) return;
    const body = this.panelEl.querySelector('.body'); const st = keep && body ? body.scrollTop : 0;
    const r = fn.call(this, this.args);
    this.panelEl.innerHTML = `<div class="win ${r.cls || ''}"><div class="head">${r.icon ? img(r.icon, 2) : ''}<h2>${esc(r.title)}</h2>${r.tabs || ''}<span class="sp"></span><button class="x" data-a="closePanel">✕</button></div>${r.npc ? this.npcBubble(r.npc) : ''}<div class="body scroll">${r.html}</div>${r.foot ? `<div class="foot">${r.foot}</div>` : ''}</div>`;
    this.panelEl.classList.add('on'); this.frame.classList.add('haspanel');
    const nb = this.panelEl.querySelector('.body'); if (nb && keep) nb.scrollTop = st;
  },
  npcLines: {},
  npcBubble(npc) {
    const key = npc + ':' + this.panel; if (!this.npcLines[key] || this.npcLines[key].day !== S.day || this.npcLines[key].fresh) { this.npcLines[key] = Object.assign(NPCDialog.line(npc), { day: S.day }); Save.soon(); }
    const L = this.npcLines[key];
    return `<div class="npc"><img class="pix portrait" src="${portraitUrl(NPCS[npc].look, 2)}" alt=""><div><b>${NPCS[npc].name}</b> <span class="dim">· ${NPCS[npc].role}</span><p>“${esc(L.text)}”</p></div></div>`;
  },
  tabsHtml(id, list) { const cur = this.tab[id] || list[0][0]; return `<div class="tabs">${list.map(([k, n]) => `<button class="${k === cur ? 'on' : ''}" data-a="tab" data-t="${id}" data-v="${k}">${n}</button>`).join('')}</div>`; },
  curTab(id, def) { return this.tab[id] || def; },
  /* -------- modal -------- */
  showModal(html, cls) { this.modal = true; this.frame.classList.add('hasmodal'); this.modalEl.innerHTML = `<div class="dlg scroll ${cls || ''}">${html}</div>`; this.modalEl.classList.add('on'); },
  closeModal() { this.modal = null; this.frame.classList.remove('hasmodal'); this.modalEl.innerHTML = ''; this.modalEl.classList.remove('on'); this._onOk = null; },
  confirm(o) {
    this._onOk = o.onOk; this._onCancel = o.onCancel;
    const price = o.price != null ? _t('ui.n_n_bakiye_n_n', [img('coin', 2), fmt(o.price), fmt(S.cash), S.cash - o.price < 0 ? 'bad' : '', fmt(S.cash - o.price)]) : '';
    this.showModal(`<h3>${o.icon ? img(o.icon, 2) : ''} ${esc(o.title)}</h3>${o.html || `<p>${esc(o.text || '')}</p>`}${price}<div class="btns"><button class="btn" data-a="mCancel">${o.cancel || _t('ui.vazgec')}</button><button class="btn ${o.danger ? 'r' : 'g'}" data-a="mOk" ${o.price != null && S.cash < o.price ? 'disabled' : ''}>${o.ok || _t('ui.onayla')}</button></div>`, 'confirm');
  },
  buy(title, icon, price, desc, fn) {
    if (S.cash < price) { this.toastNow(_t('ui.paran_yetmiyor_n_gerekli', [fmt(price)]), 'warn', 'coin'); Sound.sfx('error'); return; }
    this.confirm({ title, icon, price, text: desc, ok: _t('ui.satin_al'), onOk: () => { const r = fn(); if (r && r.ok === false && r.msg) this.toastNow(r.msg, 'warn'); else if (r && r.ok) this.toastNow(_t('ui.n_satin_alindi', [title]), 'good', icon); } });
  },
  /* ================= SAHNE ÇUBUKLARI ================= */
  mainMenu() {
    const has = !!this._hasSave;
    this.sceneui.innerHTML = _t('ui.n_yeni_oyun_n_ayarlar', [has ? _t('ui.devam_et') : '', has ? '' : 'g', img('gear', 1, 'ic'), img('help', 1, 'ic'), img('fullscreen', 1, 'ic'), has ? _t('ui.kaydi_disa_aktar') : '', this._saveErr ? _t('ui.n_yedekten_yukle_bozuk_kaydi', [esc(this._saveErr)]) : '']);
  },
  charCreator(cc) {
    const L = cc.look; const opt = (k, arr, cur, lab) => `<div class="cc"><span>${lab}</span><div class="opts">${arr.map((n, i) => `<button class="${i === cur ? 'on' : ''}" data-a="cc" data-k="${k}" data-v="${i}">${esc(n)}</button>`).join('')}</div></div>`;
    const sw = (k, arr, cur, lab) => `<div class="cc"><span>${lab}</span><div class="opts">${arr.map((c, i) => `<button class="sw ${i === cur ? 'on' : ''}" style="background:${c}" data-a="cc" data-k="${k}" data-v="${i}"></button>`).join('')}</div></div>`;
    this.sceneui.innerHTML = _t('ui.balikcini_olustur_isim_n_n', [esc(L.name), opt('body', BODY_TYPES, L.body, _t('ui.beden')), sw('skin', SKINS.map(s => s[0]), L.skin, _t('ui.ten')), opt('hair', HAIR_STYLES, L.hair, _t('ui.sac')), sw('hairColor', HAIR_COLORS.map(s => s[0]), L.hairColor, _t('ui.sac_rengi')), OUTFITS.filter(o => o.start).map(o => `<button class="${o.id === L.outfit ? 'on' : ''}" data-a="cc" data-k="outfit" data-v="${o.id}">${esc(o.name)}</button>`).join(''), HATS.filter(o => o.start).map(o => `<button class="${o.id === L.hat ? 'on' : ''}" data-a="cc" data-k="hat" data-v="${o.id}">${esc(o.name)}</button>`).join('')]);
  },
  townBar(sc) {
    const n = sc.near;
    this.bottom.innerHTML = `<div class="bl"><button class="btn mv" data-hold="-1">${img('left', 2)}</button><button class="btn mv" data-hold="1">${img('right', 2)}</button></div>
      <div class="bc">${n ? `<button class="btn g big" data-a="interact">${img(n.icon, 2)} ${esc(n.name)}</button>` : _t('ui.binalara_dokun_ya_da_yuru')}</div>
      <div class="br"><button class="btn" data-a="openPanel" data-p="Inventory">${img('bag', 2)}</button><button class="btn" data-a="openPanel" data-p="Encyclopedia">${img('book', 2)}</button></div>`;
    this.bindHolds(sc);
  },
  homeBar(sc) {
    const n = sc.near;
    this.bottom.innerHTML = `<div class="bl"><button class="btn mv" data-hold="-1">${img('left', 2)}</button><button class="btn mv" data-hold="1">${img('right', 2)}</button></div>
      <div class="bc">${n ? `<button class="btn g big" data-a="homeAct" data-id="${n}">${img(HOME_SPOTS[n].icon, 2)} ${esc(HOME_SPOTS[n].name)}</button>` : ''}</div>
      <div class="br"><button class="btn" data-a="homeAct" data-id="bed">${img('sleep', 2)}</button><button class="btn" data-a="homeAct" data-id="wardrobe">${img('wardrobe', 2)}</button><button class="btn" data-a="homeAct" data-id="chest">${img('chest', 2)}</button><button class="btn" data-a="homeAct" data-id="decor">${img('decor', 2)}</button><button class="btn" data-a="homeAct" data-id="door">${img('exit', 2)}</button></div>`;
    this.bindHolds(sc);
  },
  bindHolds(sc) {
    this.bottom.querySelectorAll('[data-hold]').forEach(b => {
      const dir = +b.dataset.hold;
      const down = e => { e.preventDefault(); Sound.start(); b.classList.add('down'); sc.input && sc.input(dir); try { b.setPointerCapture(e.pointerId); } catch (x) { } };
      const up = () => { b.classList.remove('down'); sc.input && sc.input(0); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    });
  },
  fishBar(sc) {
    const boat = Game.sceneName === 'BoatFishing';
    const left = boat ? _t('ui.n_liman_n_n', [img('anchor', 2), img('left', 2), img('right', 2)])
      : _t('ui.n_kasaba_n_n', [img('exit', 2), img('left', 2), img('right', 2)]);
    const spots = boat ? `<div class="spots">${REGION[sc.rid].spot_ids.map((id, i) => `<button class="btn sm ${sc.spotIdx() === i ? 'on' : ''}" data-a="goSpot" data-i="${i}">${['A', 'B', 'C'][i]}</button>`).join('')}</div>` : '';
    this.bottom.classList.add('fishing'); this.bottom.innerHTML = _t('ui.n_n_n_topla', [left, spots, img('bag', 2)]);
    this.bindHolds(sc);
    const cb = $('castBtn');
    const down = e => { e.preventDefault(); Sound.start(); cb.classList.add('down'); Fishing.press(); this.fishBarUpdate(); };
    const up = e => { e.preventDefault(); cb.classList.remove('down'); Fishing.release(); this.fishBarUpdate(); };
    const leave = () => { cb.classList.remove('down'); if (Fishing.phase === 'CHARGING') { Fishing.cancel(); this.fishBarUpdate(); } else Fishing.holding = false; };
    cb.addEventListener('pointerdown', down); cb.addEventListener('pointerup', up); cb.addEventListener('pointercancel', leave); cb.addEventListener('pointerleave', leave);
    this._phase = null; this.fishBarUpdate();
  },
  fishBarUpdate() {
    const cb = $('castBtn'); if (!cb) return; const ph = Fishing.phase;
    const lab = { READY: _t('ui.olta_at'), CHARGING: _t('ui.birak'), CAST_FLYING: '…', WAITING: _t('ui.bekle'), BITE_WINDOW: _t('ui.cek'), QUICK_PULL: _t('ui.sar'), REELING: _t('ui.cek_2'), CATCH_RESULT: '✓', STORAGE_DECISION: '✓', OUTCOME: '…' }[ph] || '';
    const sub = { READY: _t('ui.basili_tut'), CHARGING: _t('ui.kaydir_iptal'), REELING: _t('ui.tut_birak'), QUICK_PULL: _t('ui.basili_tut'), BITE_WINDOW: _t('ui.dokun') }[ph] || '';
    cb.innerHTML = `<span>${lab}</span><small>${sub}</small>`; cb.className = 'cast ' + ph.toLowerCase() + (cb.classList.contains('down') ? ' down' : '');
    const gu = $('giveUp'); if (gu) gu.style.display = ph === 'WAITING' ? '' : 'none';
    const bb = $('baitBtn'); if (bb) { const b = S.gear.bait; bb.innerHTML = img('bait_' + b, 2) + `<span class="lbl">${b === 'basic' ? '∞' : S.baitStock[b]}</span>`; }
    const so = $('sonar');
    if (so) {
      let t = ''; const sc = Game.scene;
      if (Game.sceneName === 'BoatFishing' && S.boats.active) {
        const nav = Boats.stats(S.boats.active).nav; const sel = Selector.weights(sc.spotId(), { rodPower: rodOf().power, bait: S.gear.bait });
        const top = sel.list.slice().sort((a, b) => b.p - a.p).slice(0, 3);
        if (nav >= 1) t = `<span class="sonar">${img('upg_navigation', 1, 'ic')}${top.map(x => esc(FISH[x.id].name_tr) + (nav >= 2 ? ' ' + Math.round(x.p * 100) + '%' : '')).join(' · ')}</span>`;
        else t = _t('ui.n_onerilen_n', [esc(SPOTS[sc.spotId()].name), BAND_TR[SPOTS[sc.spotId()].cast_band]]);
      } else if (Game.sceneName === 'PierFishing') t = _t('ui.n_onerilen_atis_n', [esc(SPOTS[PIER_SPOTS[sc.idx]].name), BAND_TR[SPOTS[PIER_SPOTS[sc.idx]].cast_band]]);
      if (so._t !== t) { so.innerHTML = t; so._t = t; }
    }
    if (Game.sceneName === 'BoatFishing') this.bottom.querySelectorAll('[data-a=goSpot]').forEach(b => b.classList.toggle('on', +b.dataset.i === Game.scene.spotIdx()));
  },
  offerBasicBait() {
    this.confirm({ title: _t('ui.yem_bitti'), icon: 'bait_basic', text: _t('ui.secili_yemin_tukendi_ucretsiz_ve'), ok: _t('ui.temel_yeme_gec'), onOk: () => { Shop.setBait('basic'); } });
  },
  mapPanel(sc) {
    if (sc.travel) { this.sceneui.innerHTML = _t('ui.n_yolunda_gec', [esc(REGION[sc.travel.rid].name)]); return; }
    const R = REGION[sc.sel]; const bid = S.boats.active; const re = Boats.reach(R.id, bid); const un = S.world.unlocked[R.id];
    const disc = R.fish_ids.filter(f => S.ency[f] && S.ency[f].caught).length;
    const req = REGION_REQ[R.id]; const reqTxt = R.requirements;
    const ev = World.event(); const evHere = ev && ev.region === R.id;
    this.sceneui.innerHTML = _t('ui.n_n_hava_n_n', [img(un ? 'anchor' : 'lock', 2), esc(R.name), img(S.world.weather[R.id], 1, 'ic'), WEATHER_TR[S.world.weather[R.id]], coin(R.trip_fuel_cost), esc(reqTxt), bid ? esc(BOAT[bid].name) : '—', S.boats.owned.length > 1 ? _t('ui.degistir') : '', re.ok ? _t('ui.bu_tekneyle_gidilebilir') : _t('ui.eksik_n', [esc(re.miss.join(', '))]), evHere ? `<div class="evbox">${img('event', 1, 'ic')} ${esc(ev.name)}: ${esc(World.eventText(ev))}</div>` : '', disc, R.fish_ids.length, R.fish_ids.map(f => `<span title="${esc(S.ency[f] && S.ency[f].caught ? FISH[f].name_tr : '???')}">${fishImg(f, 1, 'mini')}</span>`).join(''), R.spot_ids.map(s => esc(SPOTS[s].name) + (S.stats.spotsVisited[s] ? ' ✓' : '')).join(' · '), Object.keys(S.auto.devices).length ? _t('ui.n_donanim', [img('auto1', 1, 'ic')]) : '', img('home', 1, 'ic'), re.ok && S.cash >= R.trip_fuel_cost ? '' : 'disabled', img('boat', 1, 'ic'), fmt(R.trip_fuel_cost), R.id === 'sakin_liman' ? _t('ui.sakin_liman_da_tekneyle_de') : '']);
  },
  endDay(rep) {
    const net = rep.endCash - rep.startCash;
    const exp = Object.entries(rep.expBy || {}).map(([k, v]) => `${({ gear: _t('ui.ekipman'), bait: _t('ui.yem'), fuel: _t('ui.yakit'), boat: _t('ui.tekne'), automation: _t('ui.otomasyon'), cosmetic: _t('ui.kozmetik'), home: _t('world.ev') })[k] || k}: ${fmt(v)}`).join(' · ');
    const ev = rep.event ? EVENT[rep.event] : null;
    this.sceneui.innerHTML = _t('ui.n_n_gun_sona_erdi', [img('sleep', 2), rep.prevDay, rep.manualCatches, rep.autoCatches, rep.casts, rep.released, coin(rep.marketIncome), coin(rep.orderIncome), coin(rep.expenses), net >= 0 ? 'ok' : 'bad', net >= 0 ? '+' : '', fmt(net), exp ? `<div class="dim small">${esc(exp)}</div>` : '', rep.newSpecies.length ? _t('ui.yeni_turler_n_n', [rep.newSpecies.map(f => fishImgAlways(f, 1, 'mini')).join(''), rep.newSpecies.map(f => esc(FISH[f].name_tr)).join(', ')]) : '', rep.records.length ? _t('ui.rekorlar_n', [[...new Set(rep.records)].map(f => esc(FISH[f].name_tr) + ' ' + S.ency[f].maxLen + ' cm').join(' · ')]) : '', rep.achievements.length ? _t('ui.basarimlar_n', [rep.achievements.map(a => img('trophy', 1, 'ic') + ' ' + esc(ACHS.find(x => x.id === a).name)).join(' · ')]) : '', rep.newYear ? _t('ui.yeni_yil_basladi') : '', rep.newSeason ? _t('ui.n_geldi', [SEASON_TR[rep.season]]) : '', rep.newDay, SEASON_TR[rep.season], WEATHER_TR[rep.weather], ev ? _t('ui.olay_n', [esc(ev.name)]) : '', img('sunny', 2)]);
  },
  morning() {
    const ev = World.event(); const nOrd = Orders.active().length;
    this.toastNow(_t('ui.gunaydin_gun_n_n_n', [S.day, SEASON_TR[World.season()], World.seasonDay(), nOrd]), 'good', 'sunny');
    if (ev) this.toastNow(_t('ui.gunun_olayi_n_n', [ev.name, World.eventText(ev)]), 'info', 'event');
  },
  confirmSleep() {
    const rod = rodOf(); const left = Math.floor(S.energy / rod.energy);
    this.confirm({ title: _t('ui.uyu_ve_gunu_bitir'), icon: 'sleep', html: _t('ui.n_uyuyunca_enerji_100_olur', [left > 0 ? _t('ui.hala_n_enerjin_var_n', [S.energy, left]) : _t('ui.bugun_guzel_bir_gundu_dinlenme')]), ok: _t('ui.uyu'), onOk: () => { const rep = World.sleep(); if (rep) { Save.backup(); go('EndDay', { rep }); } } });
  },
  showCompResult() {
    const c = S.comp; if (!c || !c.done || !c.result) return; const r = c.result, f = FEST[r.fest];
    this.showModal(_t('ui.n_n_n_n_n', [r.place <= 3 ? img('cup_' + r.place, 5) : img('festival', 4), esc(f.comp_name), r.place <= 3 ? _t('ui.n_oldun_2', [r.place]) : _t('ui.n_sira', [r.place]), r.standings.map((x, i) => _t('ui.n_n_n_n_balik', [x.player ? ' style="background:#ffe9b0"' : '', i + 1, esc(x.name), esc(Comp.fmt(f.comp, x.score)), x.n])).join(''), r.prize ? _t('ui.n_n_kupan_evindeki_kupa', [img('coin', 2), fmt(r.prize)]) : _t('ui.bu_sefer_kupa_yok_bir')]), 'catch');
  },
  tiltHint() {
    const want = Fishing.phase === 'REELING' && Fishing.dir && !(Fishing.tired > 0) ? -Fishing.dir : 0;
    if (want === this._tiltWant) return; this._tiltWant = want;
    this.bottom.querySelectorAll('[data-hold]').forEach(b => b.classList.toggle('hintpulse', +b.dataset.hold === want));
  },
  /* CatchResult */
  showCatch(c, storage) {
    const f = FISH[c.fid]; const sp = fishSprite(c.fid); const sc = sp.width > 70 ? 2 : 3;
    const badges = [c.rec && c.rec.isNew ? _t('ui.yeni_tur') : '', c.rec && c.rec.isRecord ? _t('ui.kisisel_rekor') : '', c.size.cls === 'large' ? _t('ui.iri') : '', c.size.cls === 'exceptional' ? _t('ui.olaganustu_iri') : ''].join('');
    let foot;
    if (storage) {
      const keys = Inv.manualOrder();
      const stacks = keys.map(k => `<div class="sub">${esc(Inv.label(k))}</div><div class="slots">${Inv.arr(k).map((s, i) => `<button class="slot" data-a="swapPick" data-k="${k}" data-i="${i}">${fishImgAlways(s.f, 1)}<i>${s.q}</i></button>`).join('')}</div>`).join('');
      foot = _t('ui.canta_n_dolu_baligi_serbest', [keys.length > 1 ? _t('ui.ve_tekne_deposu') : '', img('release', 1, 'ic'), img('swap', 1, 'ic'), stacks]);
    } else foot = _t('ui.n_devam', [esc(c.where === 'bag' ? _t('ui.sirt_cantasina_eklendi') : _t('ui.n_na_eklendi', [Inv.label(c.where)]))]);
    this.showModal(_t('ui.n_n_boy_n_cm', [sp.width * sc, sp.height * sc, fishUrl(c.fid, sc), esc(f.name_tr), badges, c.size.cm, fmtKg(c.size.kg), coin(f.base_price), powerStr(f.power), esc(REGION[f.home_region].name), foot]), 'catch');
  },
  /* ================= PANELLER ================= */
  P: {
    Menu() {
      const b = (p, ic, n) => `<button class="btn tile" data-a="openPanel" data-p="${p}">${img(ic, 3)}<span>${n}</span></button>`;
      return { title: _t('ui.menu'), icon: 'menu', html: _t('ui.n_n_n_n_n_2', [b('Inventory', 'bag', _t('ui.envanter')), b('Encyclopedia', 'book', _t('ui.ansiklopedi')), b('Achievements', 'trophy', _t('ui.basarimlar')), b('Statistics', 'chart', _t('ui.istatistikler')), b('Orders', 'order', _t('ui.ilanlar')), b('Settings', 'gear', _t('ui.ayarlar')), b('Trophies', 'cup_1', _t('ui.kupalar')), b('Help', 'help', _t('ui.yardim')), img('exit', 3), S.revision]) };
    },
    Inventory(a) {
      const acc = Inv.accessible(); const others = acc.filter(k => k !== 'bag');
      let right = this.sel.invRight && others.includes(this.sel.invRight) ? this.sel.invRight : (a.right && others.includes(a.right) ? a.right : (others.includes(Inv.activeBoatKey()) ? Inv.activeBoatKey() : others[0]));
      this.sel.invRight = right;
      const tab = this.curTab('inv', 'fish');
      const box = (key) => {
        const arr = Inv.arr(key), cap = Inv.cap(key); let cells = '';
        for (let i = 0; i < cap; i++) { const s = arr[i]; cells += s ? `<button class="slot ${this.sel.slot === key + ':' + i ? 'sel' : ''}" data-a="slotSel" data-k="${key}" data-i="${i}">${fishImgAlways(s.f, 1)}<i>${s.q}</i>${S.favorites[s.f] ? '<em>' + img('star', 1, 'ic') + '</em>' : ''}</button>` : `<div class="slot empty"></div>`; }
        return _t('ui.n_n_n_yuva_n', [esc(Inv.label(key)), arr.length, cap, Inv.total(key), cells]);
      };
      let html = '';
      if (tab === 'fish') {
        html += `<div class="invcols">${box('bag')}<div class="mid">${right ? _t('ui.tumu_tumu', [right, right]) : ''}</div>${right ? `<div>${others.length > 1 ? `<div class="tabs small">${others.map(k => `<button class="${k === right ? 'on' : ''}" data-a="invRight" data-k="${k}">${esc(k === 'chest' ? _t('ui.sandik') : BOAT[k.slice(5)].name)}</button>`).join('')}</div>` : ''}${box(right)}</div>` : _t('ui.burada_baska_depo_yok_tekne')}</div>`;
        const ss = this.sel.slot && this.sel.slot.split(':'); if (ss) {
          const key = ss.length === 3 ? ss[0] + ':' + ss[1] : ss[0], idx = +ss[ss.length - 1]; const s = Inv.arr(key) && Inv.arr(key)[idx];
          if (s) { const other = key === 'bag' ? right : 'bag'; html += _t('ui.n_n_n_taban_n', [fishImgAlways(s.f, 2), esc(FISH[s.f].name_tr), s.q, fmt(FISH[s.f].base_price), s.f, S.favorites[s.f] ? _t('ui.favoriden_cikar') : _t('ui.favori_yap'), other ? _t('ui.1_aktar_yigini_aktar', [key, other, s.f, key, other, s.f, s.q]) : '', key, idx]); } else this.sel.slot = null;
        }
        html += _t('ui.her_yuvada_ayni_turden_en', [STACK]);
      } else {
        const g = (k) => { const it = GEAR[k].find(x => x.id === S.gear[k]); return `<div class="kv">${img(k + '_' + it.id, 2)}<span>${GEAR_TR[k]}</span><b>${esc(it.name)}</b></div>`; };
        html += _t('ui.n_n_n_n_yemler', [g('rod'), g('line'), g('reel'), g('hook'), BAITS.map(b => `<button class="kv btnlike ${S.gear.bait === b.id ? 'on' : ''}" data-a="setBait" data-id="${b.id}">${img('bait_' + b.id, 2)}<span>${esc(b.name)}</span><b>${b.id === 'basic' ? '∞' : S.baitStock[b.id]}</b></button>`).join('')]);
      }
      return { title: _t('ui.envanter'), icon: 'bag', tabs: this.tabsHtml('inv', [['fish', _t('ui.baliklar')], ['gear', _t('ui.ekipman_yem')]]), html, cls: 'wide' };
    },
    FishMarket() {
      const src = Market.sources(!!this.sel.mChest); const sp = Inv.species(src); const ids = Object.keys(sp).sort((a, b) => FISH[a].base_price - FISH[b].base_price);
      let rows = ids.map(f => {
        const n = sp[f], q = clamp(this.qty['m' + f] || n, 1, n); const bo = Market.betterOffer(f);
        return _t('ui.n_n_n_n_n_3', [f, img(S.favorites[f] ? 'star' : 'starOff', 1, 'ic'), fishImgAlways(f, 1, 'mini'), esc(FISH[f].name_tr), n, fmt(FISH[f].base_price), bo ? _t('ui.n_n_ilaninda_n_adet', [img('event', 1, 'ic'), esc(CUST[bo.customerId].name), fmt(bo.unitPrice)]) : '', f, n, q, f, n, f, n, f, q, coin(q * FISH[f].base_price)]);
      }).join('');
      if (!ids.length) rows = _t('ui.satilacak_baligin_yok_iskelede_ya');
      const plan = Market.sellAllPlan(src, false); const tot = sum(plan.map(p => p.income));
      const html = _t('ui.canta_n_ev_sandigi_n', [S.boats.active ? _t('ui.n_deposu', [esc(BOAT[S.boats.active].name)]) : '', this.sel.mChest ? 'checked' : '', rows]);
      return { title: _t('world.nihat_in_balik_hali'), icon: 'market', npc: 'nihat', html, foot: _t('ui.hal_her_turu_taban_fiyattan', [plan.length ? '' : 'disabled', coin(tot)]) };
    },
    Orders() {
      const tab = this.curTab('ord', 'board');
      const src = Market.sources(!!this.sel.oChest);
      let html = '';
      if (tab === 'board') {
        const act = Orders.active();
        html += _t('ui.aktif_ilan_n_n_n', [act.filter(o => !o.tag).length, Orders.slots(), act.some(o => o.tag) ? _t('ui.olay_ilani') : '', this.sel.oChest ? 'checked' : '']);
        html += act.map(o => {
          const f = FISH[o.fishId], c = CUST[o.customerId], rem = Orders.remaining(o), have = Inv.count(src, o.fishId), mx = Math.min(rem, have); const q = clamp(this.qty['o' + o.id] || mx, mx ? 1 : 0, mx); const dl = Orders.daysLeft(o); const lvl = Orders.relLevel(o.customerId);
          return _t('ui.n_n_n_n_n_4', [rem === 0 ? 'done' : '', img('cust_' + c.id, 2), esc(c.name), '★'.repeat(lvl), '☆'.repeat(3 - lvl), o.tag ? _t('ui.olay') : '', o.future ? _t('ui.gelecek_bolge_n', [esc(REGION[f.home_region].name)]) : '', dl <= 1 ? 'warn' : 'dim', dl <= 1 ? _t('ui.bugun_son_gun') : _t('ui.n_gun', [dl]), fishImg(o.fishId, 1, 'mini'), esc(f.name_tr), esc(REGION[f.home_region].name), o.delivered / o.requestedTotal * 100, o.delivered, o.requestedTotal, rem, coin(o.unitPrice), Math.round(o.bonus * 100), fmt(f.base_price), have, mx ? _t('ui.n_max_teslim_et_n', [o.id, mx, q, o.id, mx, o.id, mx, o.id, q, coin(q * o.unitPrice)]) : `<span class="dim">${rem ? _t('ui.bu_turden_baligin_yok') : _t('ui.ilan_doldu')}</span>`]);
        }).join('') || _t('ui.panoda_ilan_yok_yarin_yenileri');
        html += _t('ui.ilanlar_alim_teklifidir_istedigin_kadar');
      } else {
        const th = CFG.orders.relationship_threshold_fish_delivered;
        html += CUSTOMERS.map(c => { const d = Orders.relDelivered(c.id), l = Orders.relLevel(c.id); const nx = th[l]; const avail = c.focus.some(f => S.world.unlocked[f]); return _t('ui.n_n_n_n_odak', [img('cust_' + c.id, 2), esc(c.name), '★'.repeat(l), '☆'.repeat(3 - l), c.focus.map(f => esc(REGION[f].name)).join(', '), Math.round(c.bonus_range[0] * 100), Math.round(c.bonus_range[1] * 100), avail ? '' : _t('ui.henuz_uzak'), d, nx ? _t('ui.sonraki_seviye_n', [nx]) : _t('ui.en_ust_seviye')]); }).join('');
        html += _t('ui.iliski_teslim_edilen_toplam_balik');
      }
      return { title: _t('ui.siparis_panosu'), icon: 'order', npc: 'bahar', tabs: this.tabsHtml('ord', [['board', _t('ui.ilanlar')], ['cust', _t('ui.musteriler')]]), html, cls: 'wide' };
    },
    TackleShop() {
      const tab = this.curTab('shop', 'rod'); let html = '';
      const gearRow = (kind, it) => {
        const st = Shop.gearState(kind, it.id); let stat = '';
        if (kind === 'rod') stat = _t('ui.guc_n_n_enerji_atis', [it.power, it.energy, Math.floor(CORE.daily_energy / it.energy)]);
        if (kind === 'line') stat = _t('ui.dayaniklilik_n_kopma_toleransi', [it.durability_bonus_pct]);
        if (kind === 'reel') stat = _t('ui.cekme_hizi_n', [it.reel_speed_bonus_pct]);
        if (kind === 'hook') stat = _t('ui.gevsek_misina_toleransi_n', [it.slack_resistance_bonus_pct]);
        const btn = st === 'equipped' ? _t('ui.kullaniliyor') : st === 'owned' ? _t('ui.kullan', [kind, it.id]) : st === 'locked' ? _t('ui.onceki_seviye_gerekli') : _t('ui.satin_al_n', [kind, it.id, st === 'poor' ? 'disabled' : '', coin(it.price)]);
        return `<div class="row">${img(kind + '_' + it.id, 2)}<div class="grow"><b>${esc(it.name)}</b><div class="dim small">${stat}</div></div>${btn}</div>`;
      };
      if (['rod', 'line', 'reel', 'hook'].includes(tab)) html = GEAR[tab].map(it => gearRow(tab, it)).join('') + (tab === 'rod' ? _t('ui.olta_gucu_yakalanabilecek_baliklari_belirler') : '');
      if (tab === 'bait') {
        const m = Shop.baitMult();
        html = _t('ui.n_uygun_yem_turun_gorulme', [(m < 1 ? _t('ui.n_bugun_yem_indirimi_n', [img('event', 1, 'ic'), String(m).replace('.', I18N.num.dec)]) : '') + BAITS.map(b => b.id === 'basic' ? `<div class="row">${img('bait_basic', 2)}<div class="grow"><b>${esc(b.name)}</b><div class="dim small">${BAIT_HINT.basic}</div></div>${S.gear.bait === 'basic' ? _t('ui.secili') : _t('ui.sec')}</div>`
          : _t('ui.n_n_stok_n_n', [img('bait_' + b.id, 2), esc(b.name), S.baitStock[b.id], String(Math.round(b.purchase_price * m * 100) / 100).replace('.', I18N.num.dec), BAIT_HINT[b.id], [10, 25, 50].map(q => `<button class="btn sm g" data-a="buyBait" data-id="${b.id}" data-q="${q}" ${S.cash < Shop.baitCost(b.id, q) ? 'disabled' : ''}>×${q} ${coin(Shop.baitCost(b.id, q))}</button>`).join(''), S.gear.bait === b.id ? _t('ui.secili') : _t('ui.sec_2', [b.id, S.baitStock[b.id] ? '' : 'disabled'])])).join('')]);
      }
      if (tab === 'bag') {
        html = INVC.bag.map((b, i) => _t('ui.n_canta_seviye_n_n', [img('bagUp', 2), i + 1, b[1], i <= S.bagLevel ? _t('ui.sahip') : i === S.bagLevel + 1 ? _t('ui.yukselt_n', [S.cash < b[2] ? 'disabled' : '', coin(b[2])]) : _t('ui.onceki_gerekli')])).join('');
      }
      return { title: _t('world.zeynep_in_olta_dukkani'), icon: 'shop', npc: 'zeynep', tabs: this.tabsHtml('shop', [['rod', _t('core.olta')], ['line', _t('core.misina')], ['reel', _t('core.makara')], ['hook', _t('core.igne')], ['bait', _t('ui.yem')], ['bag', _t('ui.canta')]]), html, cls: 'wide' };
    },
    Boatyard() {
      const tab = this.curTab('yard', 'boats'); let html = '';
      const selB = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : (S.boats.active || S.boats.owned[0]);
      const boatPick = () => S.boats.owned.length ? `<div class="tabs small">${S.boats.owned.map(id => `<button class="${id === selB ? 'on' : ''}" data-a="yardBoat" data-id="${id}">${esc(BOAT[id].name)}</button>`).join('')}</div>` : '';
      if (tab === 'boats') {
        if (!S.boats.owned.length) html += _t('ui.n_ilk_hedef_kiyi_kayigi', [img('boat', 2), coin(BOAT.coastal_skiff.price), coin(S.cash)]);
        html += _t('ui.n_ayni_anda_tek_tekne', [BOATS.map(b => {
          const own = Boats.owned(b.id); const st = own ? Boats.stats(b.id) : null; const reach = REGIONS.filter(r => r.id !== 'sakin_liman' && Boats.reach(r.id, b.id).ok).map(r => r.name);
          const url = boatThumb(b.id);
          return _t('ui.n_n_n_depo_n', [`<img class="pix bthumb" src="${url}" alt="">`, esc(b.name), own && S.boats.active === b.id ? _t('ui.aktif') : '', b.initial_storage, b.max_storage, b.slots, ROMAN_S[b.default_motor], own ? _t('ui.su_an_depo_n_motor', [st.storage, ROMAN_S[st.motor], st.nav ? ROMAN_S[st.nav] : '-']) : '', reach.length ? _t('ui.ulasim_n', [esc(reach.join(', '))]) : _t('ui.yukseltmelerle_yeni_rotalar_acilir'), own ? _t('ui.depoda_n_balik', [Inv.total('boat:' + b.id)]) : '', own ? (S.boats.active === b.id ? _t('ui.kullanimda') : _t('ui.aktif_yap', [b.id])) : _t('ui.satin_al_n_2', [b.id, S.cash < b.price ? 'disabled' : '', coin(b.price)])]);
        }).join('')]);
      }
      if (tab === 'ups') {
        if (!selB) html = _t('ui.once_bir_tekne_satin_al');
        else {
          const st = Boats.stats(selB); html += boatPick();
          html += _t('ui.n_motor_n_n_navigasyon', [img('upg_motor', 1, 'ic'), ROMAN_S[st.motor], img('upg_navigation', 1, 'ic'), st.nav ? ROMAN_S[st.nav] : '—', img('upg_hull', 1, 'ic'), st.hull ? ROMAN_S[st.hull] : '—', img('upg_storage', 1, 'ic'), st.storage]);
          html += BOAT_INFO[selB].ups.map(u => { const s = Boats.upState(selB, u.key); const nm = UPG_TR[u.type] + ' ' + (u.type === 'storage' ? u.val + ' yuva' : ROMAN_S[u.val]); const eff = { motor: _t('ui.bolge_menzili_ve_surus_hizi'), navigation: _t('ui.uzak_rota_erisimi_ve_av'), hull: _t('ui.ruzgar_sallanti_etkisini_azaltir_gorunumu'), storage: _t('ui.daha_fazla_depo_yuvasi') }[u.type]; return `<div class="row">${img('upg_' + u.type, 2)}<div class="grow"><b>${nm}</b> <span class="dim small">(${u.key})</span><div class="dim small">${eff}</div></div>${s === 'owned' ? _t('ui.yuklu') : s === 'locked' ? _t('ui.once_n', [esc(u.req)]) : _t('ui.satin_al_n_3', [selB, u.key, s === 'poor' ? 'disabled' : '', coin(u.price)])}</div>`; }).join('');
          html += _t('ui.erisim_n', [REGIONS.filter(r => r.id !== 'sakin_liman').map(r => { const re = Boats.reach(r.id, selB); return (re.ok ? '✓ ' : '✗ ') + esc(r.name); }).join(' · ')]);
        }
      }
      if (tab === 'auto') {
        const desc = { auto1: _t('ui.4_manuel_atista_1_deneme'), auto_reel: _t('ui.tum_cihazlar_3_atista_1'), sensing: _t('ui.tum_cihazlar_basari_75'), auto2: _t('ui.yeni_bagimsiz_cihaz_global_yukseltmeleri'), auto3: _t('ui.yeni_bagimsiz_cihaz_global_yukseltmeleri'), deep_sea_gear: _t('ui.yalnizca_acik_deniz_teknesi_nde') };
        html += _t('ui.su_anki_ayar_her_n', [Auto.every(), Math.round(Auto.success() * 100), Auto.maxPower(S.boats.active), S.auto.dailyCaught, Auto.dayCap(), Auto.devCap()]);
        html += AUTOS.map(a => { const s = Auto.state(a.id); return `<div class="row">${img(a.id, 2)}<div class="grow"><b>${esc(a.name)}</b> <span class="dim small">${a.type === 'device' ? _t('ui.cihaz') : _t('ui.global_yukseltme')}</span><div class="dim small">${desc[a.id]}</div></div>${s === 'owned' ? _t('ui.sahip') : s === 'locked' ? _t('ui.once_n', [esc(AUTO[a.requires].name)]) : _t('ui.satin_al_n_4', [a.id, s === 'poor' ? 'disabled' : '', coin(a.price)])}</div>`; }).join('');
        html += _t('ui.n_tekne_donanimi_paneli_n', [img('auto1', 1, 'ic'), this.loadoutHtml()]);
        html += _t('ui.otomatik_oltalar_yalnizca_denizde_sen');
      }
      if (tab === 'look') {
        if (!selB) html = _t('ui.once_bir_tekne_satin_al');
        else {
          const b = S.boats.byId[selB]; html += boatPick();
          html += _t('ui.govde_rengi_n_isim_levhasi', [boatThumb(selB), BOAT_COLORS.map(c => { const own = S.cosmetics.boatColors.includes(c.id); return `<div class="row">${img('bc_' + c.id, 2)}<div class="grow"><b>${esc(c.name)}</b>${c.unlockTr && !own ? _t('ui.kilit_n_2', [esc(c.unlockTr)]) : ''}</div>${own ? (b.color === c.id ? _t('ui.secili') : _t('ui.uygula', [c.id])) : c.price ? `<button class="btn g sm" data-a="buyColor" data-id="${c.id}" ${S.cash < c.price ? 'disabled' : ''}>${coin(c.price)}</button>` : _t('ui.kilitli')}</div>`; }).join(''), esc(b.name)]);
        }
      }
      return { title: _t('world.bora_nin_tekne_atolyesi'), icon: 'yard', npc: 'bora', tabs: this.tabsHtml('yard', [['boats', _t('ui.tekneler')], ['ups', _t('ui.yukseltmeler')], ['auto', _t('ui.otomasyon')], ['look', _t('ui.gorunum')]]), html, cls: 'wide' };
    },
    BoatLoadout() { return { title: _t('ui.tekne_donanimi'), icon: 'auto1', html: this.loadoutHtml() }; },
    Encyclopedia() {
      const det = this.sel.ency;
      if (det) {
        const f = FISH[det], e = S.ency[det], known = e && e.caught;
        const spots = SPOT_LIST.filter(s => s.weights[det]).map(s => esc(s.name) + ' (%' + s.weights[det] + ')').join(' · ');
        const sp = fishSprite(det); const sc = sp.width > 60 ? 2 : 3;
        return { title: known ? f.name_tr : _t('ui.bilinmeyen_tur'), icon: 'book', html: _t('ui.liste_n', [sp.width * sc, known ? fishUrl(det, sc) : fishSilUrl(det, sc), known ? _t('ui.n_bolge_n_guc_n', [esc(f.encyclopedia_tr), esc(REGION[f.home_region].name), powerStr(f.power), f.minimum_rod_power, coin(f.base_price), f.favored_baits.map(b => esc(BAIT[b].name)).join(', '), BAND_TR[f.preferred_cast_band], f.weather_boost ? WEATHER_TR[f.weather_boost] : '—', f.season_boost ? SEASON_TR[f.season_boost] + ' ×' + String(f.season_modifier).replace('.', I18N.num.dec) : '—', e.caught, e.maxLen, fmtKg(e.maxKg), f.size_game_range.length_cm.join('–'), STYLE_TR[fightStyle(det)], spots])
            : _t('ui.bu_turu_henuz_yakalamadin_ipucu', [esc(REGION[f.home_region].name), f.power])])
        };
      }
      const n = discovered();
      const html = REGIONS.map(r => `<h4>${esc(r.name)} <span class="dim">${r.fish_ids.filter(f => S.ency[f] && S.ency[f].caught).length}/${r.fish_ids.length}</span></h4><div class="ency">${r.fish_ids.map(f => { const k = S.ency[f] && S.ency[f].caught; return `<button class="ecard ${k ? '' : 'lock'}" data-a="ency" data-id="${f}">${fishImg(f, 1)}<span>${k ? esc(FISH[f].name_tr) : '???'}</span>${k ? `<i>×${S.ency[f].caught}</i>` : ''}</button>`; }).join('')}</div>`).join('');
      return { title: _t('ui.balik_ansiklopedisi'), icon: 'book', html: _t('ui.kesif_n_n_tur_n', [n, FISH_LIST.length, html]), cls: 'wide' };
    },
    Achievements() {
      const cats = [...new Set(ACHS.map(a => a.category))]; const n = Object.keys(S.ach).length;
      const html = _t('ui.n_acilan_n_n_n', [img('trophy', 1, 'ic'), n, ACHS.length, cats.map(c => `<h4>${esc(c)}</h4>` + ACHS.filter(a => a.category === c).map(a => { const p = Ach.progress(a.id); const rw = ACH_REWARD[a.id]; return `<div class="row ach ${p.done ? 'done' : ''}">${img(p.done ? 'trophy' : 'lock', 2)}<div class="grow"><b>${esc(a.name)}</b> <span class="dim small">${esc(a.condition_tr)}</span>${rw ? _t('ui.odul_n', [esc(rw.name)]) : ''}<div class="bar"><i style="width:${p.v / p.t * 100}%"></i><span>${fmt(p.v)}/${fmt(p.t)}</span></div></div>${p.done ? _t('ui.gun_n', [S.ach[a.id]]) : ''}</div>`; }).join('')).join('')]);
      return { title: _t('ui.basarimlar'), icon: 'trophy', html, cls: 'wide' };
    },
    Statistics() {
      const s = S.stats; const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
      const html = _t('ui.n_n_n_n_n_5', [kv(_t('ui.gun'), _t('ui.n_yil_n_n', [S.day, World.year(), SEASON_TR[World.season()]])), kv(_t('ui.tamamlanan_gun'), s.daysCompleted), kv(_t('ui.para'), fmt(S.cash)), kv(_t('ui.manuel_atis'), s.manualCasts), kv(_t('ui.manuel_av'), s.manualCatches), kv(_t('ui.otomatik_av'), s.autoCatches), kv(_t('ui.otomatik_deneme'), s.autoAttempts), kv(_t('ui.vurmayan'), s.noBite), kv(_t('ui.kacirilan_vurus'), s.missed), kv(_t('ui.kopan_misina'), s.lineBreaks), kv(_t('ui.kacan_balik'), s.escapes), kv(_t('ui.serbest_birakilan'), s.released), kv(_t('ui.iptal_edilen_atis'), s.cancels), kv(_t('ui.toplam_satis'), fmt(s.totalSales)), kv(_t('ui.hal_satisi'), fmt(s.marketSales)), kv(_t('ui.ilan_satisi'), fmt(s.orderSales)), kv(_t('ui.ilana_teslim'), _t('ui.n_balik', [s.ordersDelivered])), kv(_t('ui.harcama'), fmt(s.spent)), kv(_t('ui.yakit'), fmt(s.fuelSpent)), kv(_t('ui.kullanilan_yem'), s.baitUsed), kv(_t('ui.kesfedilen_tur'), discovered() + '/' + FISH_LIST.length), kv(_t('ui.rekor_gelistirme'), s.records), kv(_t('ui.en_buyuk_balik'), s.biggestId ? FISH[s.biggestId].name_tr + ' ' + s.biggestCm + ' cm' : '—'), kv(_t('ui.seferler'), s.trips), kv(_t('ui.ziyaret_edilen_bolge'), Object.keys(s.regionsVisited).length + '/7'), kv(_t('ui.av_noktasi'), Object.keys(s.spotsVisited).length + '/21'), kv(_t('ui.tekneler'), S.boats.owned.length + '/4'), kv(_t('ui.basarimlar'), Object.keys(S.ach).length + '/' + ACHS.length), kv(_t('ui.yasanan_mevsim'), Object.keys(S.world.seasonsSeen).length + '/4'), img('book', 1, 'ic'), img('trophy', 1, 'ic')]);
      return { title: _t('ui.istatistikler'), icon: 'chart', html, cls: 'wide' };
    },
    Settings() {
      const sl = (k, n) => `<div class="kv slider"><span>${n}</span><input type="range" min="0" max="1" step="0.05" value="${SETTINGS[k]}" data-set="${k}"></div>`;
      const tg = (k, n, d) => `<label class="kv tg"><input type="checkbox" data-set="${k}" ${SETTINGS[k] ? 'checked' : ''}><span>${n}</span><small class="dim">${d}</small></label>`;
      const inGame = !!S && Game.sceneName !== 'MainMenu';
      const html = _t('ui.ses_n_n_n_n', [sl('music', _t('ui.muzik')), sl('sfx', _t('ui.efektler')), sl('amb', _t('ui.ortam_sesi')), tg('mute', _t('ui.tum_sesleri_kapat'), ''), tg('comfort', _t('ui.rahat_mod'), _t('ui.tasma_penceresi_1_5_uzar')), tg('reduced', _t('ui.azaltilmis_animasyon'), _t('ui.yagmur_ruzgar_parcaciklarini_kapatir')), img('fullscreen', 1, 'ic'), inGame ? _t('ui.disa_aktar_json') : '', inGame ? _t('ui.son_gun_yedegine_don') : '', Save.db ? 'IndexedDB' : _t('ui.yalnizca_localstorage'), Save.storageOk ? '' : _t('ui.tarayici_kaydi_engelliyor_disa_aktarmayi'), inGame ? _t('ui.ogretici_n', [S.tutorial.skipped ? 'unskipTut' : 'skipTut', S.tutorial.skipped ? _t('ui.ogretici_ipuclarini_ac') : _t('ui.ogreticiyi_atla')]) : '']);
      return { title: _t('ui.ayarlar'), icon: 'gear', html: this.langHtml() + html };
    },
    Help() {
      const html = _t('ui.temel_dongu_her_gun_100');
      return { title: _t('ui.nasil_oynanir'), icon: 'help', html };
    },
    Dialog(a) {
      const npc = a.npc; const L = NPCDialog.line(npc); Save.soon(); const tip = npc === 'efe' ? NPCDialog.tip() : '';
      return { title: NPCS[npc].name, icon: 'help', html: _t('ui.n_n_n_n_tesekkurler', [portraitUrl(NPCS[npc].look, 3), NPCS[npc].name, NPCS[npc].role, esc(L.text), tip ? `<p class="evbox">${img('upg_navigation', 1, 'ic')} ${esc(tip)}</p>` : '']) };
    },
    Wardrobe() {
      const L = S.player; const prev = Atlas.url('p:' + lookKey(L) + ':idle0', () => personPB(L, 'idle0'), 5);
      const item = (kind, it, cur) => { const own = (kind === 'outfit' ? S.wardrobe.outfits : S.wardrobe.hats).includes(it.id); return `<button class="opt ${cur === it.id ? 'on' : ''} ${own ? '' : 'lock'}" data-a="${own ? 'wear' : 'noop'}" data-k="${kind}" data-id="${it.id}"><b>${esc(it.name)}</b><small>${own ? (cur === it.id ? _t('ui.giyili') : _t('ui.giy')) : it.price ? _t('ui.selin_in_butiginde_n', [fmt(it.price)]) : it.fest ? _t('ui.senlik_standinda_n', [esc(FEST[it.fest].name)]) : _t('ui.kilit_n', [esc(it.unlockTr || '')])}</small></button>`; };
      const ch = (k, arr, lab) => `<h4>${lab}</h4><div class="opts">${arr.map((n, i) => `<button class="${L[k] === i ? 'on' : ''}" data-a="look" data-k="${k}" data-v="${i}">${esc(n)}</button>`).join('')}</div>`;
      const sw = (k, arr, lab) => `<h4>${lab}</h4><div class="opts">${arr.map((c, i) => `<button class="sw ${L[k] === i ? 'on' : ''}" style="background:${c}" data-a="look" data-k="${k}" data-v="${i}"></button>`).join('')}</div>`;
      return { title: _t('world.gardirop'), icon: 'wardrobe', cls: 'wide', html: _t('ui.kiyafetler_n_sapkalar_n_n', [prev, OUTFITS.map(o => item('outfit', o, L.outfit)).join(''), HATS.map(o => item('hat', o, L.hat)).join(''), ch('hair', HAIR_STYLES, _t('ui.sac_modeli')), sw('hairColor', HAIR_COLORS.map(c => c[0]), _t('ui.sac_rengi')), sw('skin', SKINS.map(c => c[0]), _t('ui.ten')), ch('body', BODY_TYPES, _t('ui.beden'))]) };
    },
    Decor() {
      const html = Object.entries(DECOR_SLOTS).map(([slot, nm]) => { const cur = S.home.decor[slot]; return `<h4>${esc(nm)} ${cur ? '· ' + esc(DECOR_BY[cur].name) : _t('ui.bos')}</h4><div class="optgrid">${DECOR.filter(d => d.slot === slot).map(d => { const own = S.home.owned.includes(d.id); return `<button class="opt ${cur === d.id ? 'on' : ''} ${own ? '' : 'lock'}" data-a="${own ? 'placeDecor' : 'noop'}" data-s="${slot}" data-id="${d.id}">${img('decor_' + d.id, 2)}<b>${esc(d.name)}</b><small>${own ? (cur === d.id ? _t('ui.yerlesik_kaldir') : _t('ui.yerlestir')) : d.price ? _t('ui.kerem_in_dukkaninda_n', [fmt(d.price)]) : d.unlockTr ? esc(d.unlockTr) : _t('ui.basarim_n', [esc((ACHS.find(a => a.id === d.ach) || {}).name || '')])}</small></button>`; }).join('')}</div>`; }).join('');
      return { title: _t('ui.ev_dekorasyonu'), icon: 'decor', cls: 'wide', html: _t('ui.yerlesik_esya_n_5_sandik', [Object.values(S.home.decor).filter(Boolean).length, Inv.cap('chest'), INVC.home_chest[S.chestLevel + 1] ? _t('ui.buyutmek_icin_kerem_in_ev') : '', html]) };
    },
    Bakery() {
      const cur = Shop.snackToday();
      const html = _t('ui.n_n_atistirmaliklar_enerji_vermez', [cur ? _t('ui.n_bugun_n_n', [img('snack_' + cur.id, 2), esc(cur.name), esc(cur.desc)]) : _t('ui.gunde_bir_atistirmalik_alabilirsin_etkisi'), SNACKS.map(sn => `<div class="row">${img('snack_' + sn.id, 2)}<div class="grow"><b>${esc(sn.name)}</b><div class="dim small">${esc(sn.desc)}</div></div>${cur && cur.id === sn.id ? _t('ui.afiyet_olsun') : _t('ui.al_n', [sn.id, cur || S.cash < sn.price ? 'disabled' : '', coin(sn.price)])}</div>`).join('')]);
      return { title: _t('world.fatma_teyze_nin_firini'), icon: 'bakery', npc: 'fatma', html };
    },
    Boutique() {
      const L = S.player; const fe = World.festival();
      const prev = (kind, it) => { const look = Object.assign({}, L, kind === 'outfit' ? { outfit: it.id } : { hat: it.id }); return Atlas.url('p:' + lookKey(look) + ':idle0', () => personPB(look, 'idle0'), 2); };
      const row = (kind, it) => { const own = (kind === 'outfit' ? S.wardrobe.outfits : S.wardrobe.hats).includes(it.id); const worn = (kind === 'outfit' ? L.outfit : L.hat) === it.id; return `<div class="opt ${worn ? 'on' : ''}"><img class="pix" src="${prev(kind, it)}" alt=""><b>${esc(it.name)}</b>${own ? (worn ? _t('ui.giyili_2') : _t('ui.giy_2', [kind, it.id])) : `<button class="btn g sm" data-a="buyCos" data-k="${kind}" data-id="${it.id}" ${S.cash < it.price ? 'disabled' : ''}>${coin(it.price)}</button>`}</div>`; };
      let html = '';
      if (fe) { const st = fe.stall; const it = (st.kind === 'hat' ? HATS : OUTFITS).find(x => x.id === st.id); const own = (st.kind === 'hat' ? S.wardrobe.hats : S.wardrobe.outfits).includes(st.id); html += _t('ui.n_n_standi_n_yalnizca', [img('festival', 2), esc(fe.name), esc(it.name), own ? _t('ui.sahipsin') : _t('ui.al_n_2', [S.cash < st.price ? 'disabled' : '', coin(st.price)])]); }
      html += _t('ui.kiyafetler_n_sapkalar_n_onizlemeler', [OUTFITS.filter(o => o.price).map(o => row('outfit', o)).join(''), HATS.filter(o => o.price).map(o => row('hat', o)).join('')]);
      return { title: _t('world.selin_in_butigi'), icon: 'boutique', npc: 'selin', html, cls: 'wide' };
    },
    HomeGoods() {
      const nx = INVC.home_chest[S.chestLevel + 1];
      let html = _t('ui.n_ev_sandigi_su_an', [img('chestUp', 2), Inv.cap('chest'), nx ? _t('ui.n_yuvaya_buyut_n', [S.cash < nx[2] ? 'disabled' : '', nx[1], coin(nx[2])]) : _t('ui.en_buyuk')]);
      html += Object.entries(DECOR_SLOTS).map(([slot, nm]) => `<h4>${esc(nm)}</h4><div class="optgrid">${DECOR.filter(d => d.slot === slot && d.price).map(d => { const own = S.home.owned.includes(d.id); return `<div class="opt">${img('decor_' + d.id, 2)}<b>${esc(d.name)}</b>${own ? _t('ui.sahipsin_evde_yerlestir') : `<button class="btn g sm" data-a="buyDecor" data-id="${d.id}" ${S.cash < d.price ? 'disabled' : ''}>${coin(d.price)}</button>`}</div>`; }).join('')}</div>`).join('');
      return { title: _t('world.kerem_in_ev_esyalari'), icon: 'homegoods', npc: 'kerem', html: _t('ui.n_aldigin_esyalari_evdeki_dekor', [html]), cls: 'wide' };
    },
    Teahouse() {
      const fid = Tea.special(), f = FISH[fid], src = Market.sources(!!this.sel.tChest), have = Inv.count(src, fid), left = Tea.left(), mx = Math.min(have, left); const q = clamp(this.qty.tea || mx, mx ? 1 : 0, mx);
      const nf = World.nextFestival();
      const html = _t('ui.n_gunun_baligi_n_n', [img('teahouse', 2), fishImg(fid, 1, 'mini'), esc(f.name_tr), coin(Tea.price(fid)), fmt(f.base_price), left, have, this.sel.tChest ? 'checked' : '', mx ? _t('ui.n_sat_n', [mx, q, mx, q, coin(q * Tea.price(fid))]) : _t('ui.satilacak_yok'), img('upg_navigation', 1, 'ic'), esc(NPCDialog.tip()), nf ? `<p>${img('festival', 1, 'ic')} ${nf.inDays ? _t('ui.n_n_gun_sonra_n', [esc(nf.f.name), nf.inDays, SEASON_TR[nf.f.season], nf.f.days[0], esc(nf.f.comp_name)]) : _t('ui.n_bugun_meydana_ugra', [esc(nf.f.name)])}</p>` : '', Tea.cfg.daily_special_qty, String(Tea.cfg.daily_special_multiplier).replace('.', I18N.num.dec)]);
      return { title: _t('world.halil_usta_nin_cay_bahcesi'), icon: 'teahouse', npc: 'halil', html };
    },
    Square() {
      const fe = World.festival(); let html = '';
      if (fe) {
        const ent = Comp.entered(fe), res = S.fest[festKey(fe)], act = Comp.active(); const pz = Comp.prizes(World.year());
        html += _t('ui.n_n_bugun_n_n', [img('festival', 2), esc(fe.name), esc(fe.comp_name), esc(fe.rule), COMP.casts, img('cup_1', 1, 'ic'), coin(pz[0]), img('cup_2', 1, 'ic'), coin(pz[1]), img('cup_3', 1, 'ic'), coin(pz[2]), RIVALS.map(r => `<div class="kv"><span>${esc(r.name)}</span><b class="lv">${'★'.repeat(Math.round(r.skill * 5))}</b></div>`).join(''), act ? _t('ui.yarismaya_don') : ent ? _t('ui.katildin_n', [res && res.place ? _t('ui.n_oldun', [res.place]) : '']) : _t('ui.kaydol_ve_yaris')]);
      } else {
        const nf = World.nextFestival(); html += _t('ui.n_bir_sonraki_senlik_n', [img('festival', 2), esc(nf.f.name), nf.inDays, SEASON_TR[nf.f.season], nf.f.days[0], nf.f.days[1]]);
      }
      html += _t('ui.senlik_takvimi_n', [FESTIVALS.map(f => { const r = S.fest[f.id + ':' + World.year()]; return _t('ui.n_n_n_n_gun', [img(f.season, 2), esc(f.name), SEASON_TR[f.season], f.days.join('–'), esc(f.comp_name), esc(f.rule), r && r.place ? img('cup_' + Math.min(3, r.place), 2) + `<span class="small">${r.place}.</span>` : '']); }).join('')]);
      html += _t('ui.kupalarin_n_senlik_standindaki_ozel', [S.trophies.length]);
      return { title: _t('core.senlik_meydani'), icon: 'square', npc: 'hasan', html, cls: 'wide' };
    },
    Trophies() {
      const t = S.trophies.slice().sort((a, b) => a.place - b.place || b.year - a.year);
      const html = _t('ui.n_n_basarimlar', [t.length ? `<div class="tiles">${t.map(x => { const f = FEST[x.fest]; return _t('ui.n_n_n_yil_n', [img('cup_' + x.place, 3), x.place, esc(f.name), x.year, esc(Comp.fmt(f.comp, x.score))]); }).join('')}</div>` : _t('ui.henuz_kupan_yok_her_mevsimin'), img('trophy', 1, 'ic')]);
      return { title: _t('world.kupa_dolabi'), icon: 'cup_1', html, cls: 'wide' };
    },
    Debug() { return { title: 'QA / Test Paneli', icon: 'gear', html: QA.panelHtml(), cls: 'wide' }; }
  },
  loadoutHtml() {
    if (!Object.keys(S.auto.devices).length) return _t('ui.donanim_henuz_otomatik_olta_cihazin');
    let h = _t('ui.donanim_yerlesimi');
    for (const d of Auto.DEV) {
      const dv = S.auto.devices[d]; if (!dv) continue;
      const btns = S.boats.owned.filter(b => b !== dv.boat).map(b => _t('ui.n_n_bos', [d, b, Auto.slotsFree(b) > 0 ? '' : 'disabled', esc(BOAT[b].name), Auto.slotsFree(b)])).join('');
      h += _t('ui.n_n_n_sayac_n', [img(d, 2), esc(AUTO[d].name), dv.boat ? _t('ui.takili_n', [esc(BOAT[dv.boat].name)]) : _t('ui.depoda_takili_degil'), dv.counter, Auto.every(), dv.paused ? _t('ui.beklemede_n', [esc(Auto.reasonTr[dv.paused])]) : '', btns, dv.boat ? _t('ui.sok', [d]) : '']);
    }
    h += _t('ui.yuvalar_n', [S.boats.owned.map(b => esc(BOAT[b].name) + ' ' + Auto.mountedOn(b).length + '/' + BOAT[b].slots).join(' · ')]);
    return h;
  },
  /* ================= EYLEMLER ================= */
  A: {
    setLang(d) { if (I18N.setLang(d.v)) Sound.sfx('click'); },
    noop() { },
    closePanel() { this.closePanel(); },
    openPanel(d) { this.openPanel(d.p); },
    tab(d) { this.tab[d.t] = d.v; this.sel.slot = null; this.renderPanel(); },
    mOk() { const f = this._onOk; this.closeModal(); if (f) f(); this.refresh(); },
    mCancel() { const f = this._onCancel; this.closeModal(); if (f) f(); },
    fullscreen() { toggleFullscreen(); },
    showEvent() { const e = World.event(); if (e) this.confirm({ title: e.name, icon: 'event', text: _t('ui.n_olaya_katilmak_zorunlu_degil', [World.eventText(e)]), ok: _t('ui.tamam'), cancel: _t('ui.kapat') }); },
    skipTut() { S.tutorial.skipped = true; Save.soon(); this.refresh(); },
    unskipTut() { S.tutorial.skipped = false; Save.soon(); this.refresh(); },
    interact() { if (Game.scene.interact) Game.scene.interact(); },
    homeAct(d) { Game.scene.act(d.id); },
    continue() { startFromSave(); },
    newGame() { if (this._hasSave) this.confirm({ title: _t('ui.yeni_oyun'), danger: true, text: _t('ui.mevcut_kaydin_yerine_yeni_bir'), ok: _t('ui.yeni_oyun_baslat'), onOk: () => go('CharacterCreator', {}) }); else go('CharacterCreator', {}); },
    toMenu() { go('MainMenu'); },
    cc(d) { const cc = Game.scenes.CharacterCreator; cc.look[d.k] = (d.k === 'outfit' || d.k === 'hat') ? d.v : +d.v; this.charCreator(cc); },
    startGame() { const cc = Game.scenes.CharacterCreator; const nm = (cc.look.name || '').trim() || _t('core.balikci'); cc.look.name = nm.slice(0, 14); beginNewGame(cc.look); },
    saveQuit() { Save.now(); this.closePanel(true); checkSaveAndMenu(); },
    // envanter
    slotSel(d) { const k = d.k + ':' + d.i; this.sel.slot = this.sel.slot === k ? null : k; this.renderPanel(true); },
    invRight(d) { this.sel.invRight = d.k; this.sel.slot = null; this.renderPanel(true); },
    moveAll(d) { const r = Inv.transferAll(d.f, d.t); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(_t('ui.n_balik_aktarildi', [r.n]), 'good', 'transfer'); this.sel.slot = null; },
    moveOne(d) { const r = Inv.transfer(d.k, d.to, d.f, +d.n); if (!r.ok) this.toastNow(r.msg, 'warn'); this.sel.slot = null; },
    fav(d) { S.favorites[d.f] = !S.favorites[d.f]; if (!S.favorites[d.f]) delete S.favorites[d.f]; Save.soon(); this.refresh(); },
    releaseStack(d) { const a = Inv.arr(d.k)[+d.i]; if (!a) return; this.confirm({ title: _t('ui.serbest_birak'), danger: true, icon: 'release', text: _t('ui.n_n_denize_birakilacak_bu', [a.q, FISH[a.f].name_tr]), ok: _t('ui.serbest_birak'), onOk: () => { Inv.releaseStack(d.k, +d.i); this.sel.slot = null; } }); },
    setBait(d) { if (!Shop.setBait(d.id)) this.toastNow(_t('ui.bu_yemden_stok_yok'), 'warn'); },
    baitPick() {
      if (Fishing.phase !== 'READY') return;
      this.showModal(_t('ui.n_yem_sec_n_yem', [img('bait_' + S.gear.bait, 2), BAITS.map(b => `<button class="kv btnlike ${S.gear.bait === b.id ? 'on' : ''}" data-a="baitSet" data-id="${b.id}" ${b.id === 'basic' || S.baitStock[b.id] ? '' : 'disabled'}>${img('bait_' + b.id, 2)}<span>${esc(b.name)}<small class="dim"> ${esc(BAIT_HINT[b.id])}</small></span><b>${b.id === 'basic' ? '∞' : S.baitStock[b.id]}</b></button>`).join('')]));
    },
    baitSet(d) { Shop.setBait(d.id); this.closeModal(); this.refresh(); },
    qty(d) { const mx = +d.max; const cur = this.qty[d.k] || mx; const v = d.d === '999' ? mx : clamp(cur + (+d.d), 1, mx); this.qty[d.k] = v; this.renderPanel(true); },
    mSell(d) {
      const f = d.f, n = +d.n; const bo = Market.betterOffer(f); const src = Market.sources(!!this.sel.mChest);
      const doit = () => { const r = Market.sell(f, n, src); if (r.ok) { this.toastNow(_t('ui.n_n_satildi_n', [r.n, FISH[f].name_tr, fmt(r.income)]), 'good', 'coin'); delete this.qty['m' + f]; } else this.toastNow(r.msg, 'warn'); };
      if (bo) this.confirm({ title: _t('ui.daha_iyi_teklif_var'), icon: 'event', html: _t('ui.n_bu_ture_ilan_panosunda', [esc(CUST[bo.customerId].name), fmt(bo.unitPrice), fmt(FISH[f].base_price)]), ok: _t('ui.yine_de_sat'), onOk: doit });
      else doit();
    },
    mSellAll() {
      const src = Market.sources(!!this.sel.mChest); const plan = Market.sellAllPlan(src, false); const tot = sum(plan.map(p => p.income)); const better = plan.filter(p => p.better);
      this.confirm({ title: _t('ui.tum_uygun_baliklari_sat'), icon: 'market', html: _t('ui.n_balik_favoriler_haric_n', [plan.reduce((a, p) => a + p.n, 0), fmt(tot), better.length ? _t('ui.ilanda_daha_iyi_fiyat_olan', [better.map(p => esc(FISH[p.f].name_tr) + ' (' + fmt(p.better.unitPrice) + ')').join(', ')]) : '', Object.keys(S.favorites).length ? _t('ui.favori_turler_korunur') : '']), ok: _t('ui.hepsini_sat'), onOk: () => { const r = Market.sellAll(src, false); if (r.ok) this.toastNow(_t('ui.n_balik_satildi_n', [r.n, fmt(r.income)]), 'good', 'coin'); else this.toastNow(r.msg, 'warn'); } });
    },
    oDeliver(d) { const src = Market.sources(!!this.sel.oChest); const r = Orders.deliver(d.id, +d.n, src); if (r.ok) { this.toastNow(_t('ui.n_balik_teslim_edildi_n', [r.n, fmt(r.income)]), 'good', 'order'); delete this.qty['o' + d.id]; this.npcLines['bahar:Orders'] && (this.npcLines['bahar:Orders'].fresh = true); } else this.toastNow(r.msg, 'warn'); },
    // dükkân
    buyGear(d) { const it = GEAR[d.k].find(x => x.id === d.id); this.buy(it.name, d.k + '_' + it.id, it.price, _t('ui.n_satin_alinip_hemen_kullanilacak', [GEAR_TR[d.k]]), () => Shop.buyGear(d.k, d.id)); },
    equip(d) { Shop.equip(d.k, d.id); },
    buyBait(d) { const q = +d.q, c = Shop.baitCost(d.id, q); this.buy(q + ' × ' + BAIT[d.id].name, 'bait_' + d.id, c, BAIT_HINT[d.id], () => Shop.buyBait(d.id, q)); },
    buyBag() { const t = INVC.bag[S.bagLevel + 1]; this.buy(_t('ui.canta_n_yuva', [t[1]]), 'bagUp', t[2], _t('ui.sirt_cantan_n_balik_yuvasina', [t[1]]), () => Shop.buyBag()); },
    buyChest() { const t = INVC.home_chest[S.chestLevel + 1]; this.buy(_t('ui.sandik_n_yuva', [t[1]]), 'chestUp', t[2], _t('ui.ev_sandigin_n_yuvaya_cikar', [t[1]]), () => Shop.buyChest()); },
    // tekne
    buyBoat(d) { const b = BOAT[d.id]; this.buy(b.name, 'boat', b.price, _t('ui.yeni_tekne_limana_baglanacak_n', [S.boats.active ? _t('ui.aktif_tekne_degismez_istersen_aktif') : _t('ui.ilk_teknen_hemen_aktif_olur')]), () => Boats.buy(d.id)); },
    setActive(d) { Boats.setActive(d.id); const devs = Auto.DEV.filter(x => S.auto.devices[x] && S.auto.devices[x].boat && S.auto.devices[x].boat !== d.id); if (devs.length && Auto.slotsFree(d.id) > 0) this.confirm({ title: _t('ui.cihazlari_aktar'), icon: 'auto1', text: _t('ui.otomatik_olta_cihazlarin_baska_teknede'), ok: _t('ui.aktar'), onOk: () => { for (const x of devs) if (Auto.slotsFree(d.id) > 0) Auto.mount(x, d.id); } }); },
    yardBoat(d) { this.sel.yardBoat = d.id; this.renderPanel(true); },
    buyUp(d) { const u = BOAT_INFO[d.id].ups.find(x => x.key === d.k); this.buy(BOAT[d.id].name + ': ' + UPG_TR[u.type] + ' ' + (u.type === 'storage' ? u.val : ROMAN_S[u.val]), 'upg_' + u.type, u.price, _t('ui.yukseltme_bu_teknenin_uzerinde_kalir'), () => Boats.buyUpgrade(d.id, d.k)); },
    buyAuto(d) { const a = AUTO[d.id]; this.buy(a.name, a.id, a.price, a.type === 'device' ? _t('ui.cihaz_bos_yuva_varsa_aktif') : _t('ui.global_yukseltme_tum_cihazlara_uygulanir'), () => Auto.buy(d.id)); },
    mount(d) { const r = Auto.mount(d.d, d.b); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); },
    unmount(d) { Auto.unmount(d.d); },
    boatColor(d) { const b = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : S.boats.active; Boats.setColor(b, d.id); },
    buyColor(d) { const c = BOAT_COLORS.find(x => x.id === d.id); this.buy(c.name + ' boya', 'bc_' + c.id, c.price, _t('ui.renk_tum_teknelerinde_kullanilabilir'), () => Shop.buyCosmetic('boatColor', d.id)); },
    boatName() { const b = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : S.boats.active; Boats.setName(b, $('boatName').value); this.toastNow(_t('ui.isim_levhasi_guncellendi'), 'good', 'nameplate'); },
    cycleBoat() { const o = S.boats.owned; const i = o.indexOf(S.boats.active); Boats.setActive(o[(i + 1) % o.length]); },
    // harita / balıkçılık
    mapBack() { go('Town', { at: 'harbor' }); },
    depart() { Game.scene.depart(); },
    mapSkip() { Game.scene.skip(); },
    backTown() { if (Fishing.locked()) return; if (Comp.active()) { this.confirm({ title: _t('ui.yarismadan_cik'), danger: true, icon: 'festival', text: _t('ui.kalan_n_atis_hakkin_yanacak', [S.comp.castsLeft]), ok: _t('ui.yarismayi_bitir'), onOk: () => { Comp.leave(); this.showCompResult(); } }); return; } go('Town', { at: 'pier' }); },
    backHarbor() { if (Fishing.locked()) return; this.confirm({ title: _t('ui.limana_don'), icon: 'anchor', text: _t('ui.limana_donus_ucretsiz_tekrar_denize'), ok: _t('ui.limana_don_2'), onOk: () => go('Town', { at: 'harbor' }) }); },
    pierSpot(d) { Game.scene.switchSpot(+d.d); },
    goSpot(d) { Game.scene.goSpot(+d.i); },
    giveUp() { Fishing.giveUp(); this.fishBarUpdate(); },
    catchClose() { this.closeModal(); Fishing.resultClosed(); this.fishBarUpdate(); },
    catchRelease() { this.confirm({ title: _t('ui.serbest_birak'), icon: 'release', text: _t('ui.n_denize_geri_birakilacak_yakalama', [FISH[S.pendingCatch.fid].name_tr]), ok: _t('ui.birak_2'), onOk: () => { Fishing.resolveStorage('release'); this.fishBarUpdate(); }, onCancel: () => this.showCatch(S.pendingCatch, true) }); },
    catchSwap() { const el = $('swapList'); if (el) el.style.display = ''; },
    swapPick(d) { const s = Inv.arr(d.k)[+d.i]; const pc = S.pendingCatch; this.confirm({ title: _t('ui.yer_degistir'), icon: 'swap', danger: true, text: _t('ui.n_n_serbest_birakilacak_ve', [s.q, FISH[s.f].name_tr, FISH[pc.fid].name_tr]), ok: _t('ui.degistir_2'), onOk: () => { const r = Fishing.resolveStorage('swap', d.k, +d.i); if (!r.ok) this.toastNow(r.msg || _t('ui.olmadi'), 'warn'); else this.toastNow(_t('ui.n_depoya_kondu', [FISH[pc.fid].name_tr]), 'good'); this.fishBarUpdate(); }, onCancel: () => this.showCatch(S.pendingCatch, true) }); },
    wake() { go('Home', { morning: true }); },
    // ansiklopedi
    ency(d) { this.sel.ency = d.id; this.renderPanel(); },
    encyBack() { this.sel.ency = null; this.renderPanel(); },
    // kozmetik
    wear(d) { if (d.k === 'outfit') S.player.outfit = d.id; else S.player.hat = d.id; Save.soon(); this.renderPanel(true); },
    look(d) { S.player[d.k] = +d.v; Save.soon(); this.renderPanel(true); },
    buyCos(d) { const it = (d.k === 'outfit' ? OUTFITS : HATS).find(x => x.id === d.id); this.buy(it.name, 'wardrobe', it.price, _t('ui.yalnizca_gorsel_bir_kiyafet'), () => Shop.buyCosmetic(d.k, d.id)); },
    placeDecor(d) { const cur = S.home.decor[d.s]; Cosmetics.placeDecor(d.s, cur === d.id ? null : d.id); },
    buyDecor(d) { const it = DECOR_BY[d.id]; this.buy(it.name, 'decor_' + it.id, it.price, _t('ui.n_icin_dekoratif_esya', [DECOR_SLOTS[it.slot]]), () => Shop.buyCosmetic('decor', d.id)); },
    // kayıt
    exportOpen() { const j = Save.pack(S); this.showModal(_t('ui.kaydi_disa_aktar_dosya_indirilmezse', [esc(j)]), 'wide'); },
    download() { const j = Save.pack(S); try { const b = new Blob([j], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'cozyfishing_gun' + S.day + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 500); this.toastNow(_t('ui.kayit_dosyasi_hazirlandi'), 'good'); } catch (e) { this.toastNow(_t('ui.indirme_desteklenmiyor_metni_kopyala'), 'warn'); } },
    copyExport() { const ta = this.modalEl.querySelector('textarea'); ta.select(); try { navigator.clipboard ? navigator.clipboard.writeText(ta.value).then(() => this.toastNow(_t('ui.kopyalandi'), 'good')) : (document.execCommand('copy'), this.toastNow(_t('ui.kopyalandi'), 'good')); } catch (e) { this.toastNow(_t('ui.elle_secip_kopyala'), 'warn'); } },
    exportRaw() { const raw = this._rawSave || ''; const b = new Blob([raw], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'cozyfishing_bozuk_kayit.json'; a.click(); },
    importOpen() { this.showModal(_t('ui.kaydi_ice_aktar_bir_json'), 'wide'); },
    importGo() {
      const fi = $('impFile'), ta = $('impText');
      const handle = (txt) => { const u = Save.unpack(txt); if (!u.ok) { this.toastNow(_t('ui.ice_aktarma_reddedildi_n', [u.msg]), 'warn'); Sound.sfx('error'); return; } const st = u.state; this.confirm({ title: _t('ui.kaydi_yukle'), danger: true, html: _t('ui.gun_n_para_n_n', [st.day, fmt(st.cash), esc(st.player.name), Object.keys(st.ency).length, st.boats.owned.length]), ok: _t('ui.yukle'), onOk: () => { Save.keepPrevious(); S = st; Save.now(); startFromState(); this.toastNow(_t('ui.kayit_yuklendi'), 'good'); } }); };
      if (fi && fi.files && fi.files[0]) { const r = new FileReader(); r.onload = () => handle(String(r.result)); r.readAsText(fi.files[0]); }
      else if (ta && ta.value.trim()) handle(ta.value.trim());
      else this.toastNow(_t('ui.once_bir_dosya_sec_ya'), 'warn');
    },
    async restoreBackup() { const st = await Save.loadBackup(); if (!st) { this.toastNow(_t('ui.gecerli_bir_gun_yedegi_bulunamadi'), 'warn'); return; } this.confirm({ title: _t('ui.yedekten_yukle'), danger: true, text: _t('ui.son_uyku_anindaki_yedek_gun', [st.day]), ok: _t('ui.yukle'), onOk: () => { Save.keepPrevious(); S = st; Save.now(); startFromState(); } }); },
    buySnack(d) { const sn = SNACK[d.id]; this.buy(sn.name, 'snack_' + sn.id, sn.price, sn.desc, () => Shop.buySnack(d.id)); },
    buyFest() { const fe = World.festival(); if (!fe) return; const st = fe.stall; const it = (st.kind === 'hat' ? HATS : OUTFITS).find(x => x.id === st.id); this.buy(it.name, 'festival', st.price, _t('ui.senlige_ozel_kozmetik'), () => Shop.buyFestivalItem()); },
    teaSell(d) { const r = Tea.sell(+d.n, Market.sources(!!this.sel.tChest)); if (r.ok) { this.toastNow(_t('ui.n_balik_halil_usta_ya', [r.n, fmt(r.income)]), 'good', 'teahouse'); delete this.qty.tea; } else this.toastNow(r.msg, 'warn'); },
    compStart() { const r = Comp.start(); if (!r.ok) { this.toastNow(r.msg, 'warn'); return; } this.closePanel(true); go('PierFishing', { spot: 1 }); this.toastNow(_t('ui.yarisma_basladi_n_atis_hakkin', [COMP.casts]), 'good', 'festival'); },
    compGo() { this.closePanel(true); go('PierFishing', { spot: 1 }); },
    compDone() { this.closeModal(); Comp.clearDone(); this.refresh(); },
    festInfo() { if (Game.sceneName === 'Town') { this.openPanel('Square'); return; } const fe = World.festival(), nf = World.nextFestival(); this.confirm({ title: fe ? fe.name : _t('ui.yaklasan_senlik'), icon: 'festival', text: fe ? _t('ui.n_n_kaydolmak_icin_kasabadaki', [fe.comp_name, fe.rule]) : _t('ui.n_n_gun_sonra_basliyor', [nf.f.name, nf.inDays]), ok: _t('ui.tamam'), cancel: _t('ui.kapat') }); },
    dbg(d) { QA.act(d.k, d); }
  }
};
function boatThumb(id) {
  const cfg = S.boats.byId[id] ? boatCfgOf(id) : { color: 'sea_green', name: '', motor: BOAT[id].default_motor, hull: 0, nav: BOAT_INFO[id].nav0, storage: BOAT[id].initial_storage };
  return Atlas.url('bthumb:' + id + JSON.stringify(cfg), () => { const p = boatParts(id, cfg); const pb = new PB(p.w, p.h); pb.blit(p.back, 0, 0); pb.blit(p.front, 0, 0); return pb; }, 1);
}
