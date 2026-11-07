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
    let h = `<button class="hb" data-a="openPanel" data-p="Menu" title="Menü">${img('menu', 2)}</button>`;
    h += `<div class="chip" title="Gün / mevsim">${img(World.season(), 1, 'ic')}<b>Gün ${S.day}</b><span class="dim">${SEASON_TR[World.season()]} ${World.seasonDay()}/28 · Yıl ${World.year()}</span></div>`;
    h += `<div class="chip" title="Hava: ${WEATHER_TR[wx]}">${img(wx, 1, 'ic')}<span class="wxn">${WEATHER_TR[wx]}</span></div>`;
    if (ev) h += `<button class="chip evt" data-a="showEvent" title="Günün olayı">${img('event', 1, 'ic')}<span>${esc(ev.name)}</span></button>`;
    { const fe = World.festival(), nf = World.nextFestival(); if (fe) h += `<button class="chip fest" data-a="festInfo" title="Şenlik">${img('festival', 1, 'ic')}<span>${esc(fe.name)}</span></button>`; else if (nf && nf.inDays <= 5) h += `<button class="chip" data-a="festInfo" title="Yaklaşan şenlik">${img('festival', 1, 'ic')}<span>${nf.inDays} gün</span></button>`; }
    h += `<div class="chip">${img('coin', 1, 'ic')}<b>${fmt(S.cash)}</b></div>`;
    h += `<div class="chip" title="Enerji">${img('energy', 1, 'ic')}<div class="ebar"><i style="width:${S.energy}%"></i></div><b>${S.energy}</b><span class="dim">(${casts} atış)</span></div>`;
    h += `<button class="chip" data-a="openPanel" data-p="Inventory">${img('bag', 1, 'ic')}<span>${Inv.used('bag')}/${Inv.cap('bag')}</span></button>`;
    if (ab && (inBoat || ['Town', 'SeaMap', 'PierFishing'].includes(Game.sceneName))) h += `<button class="chip" data-a="openPanel" data-p="Inventory">${img('boat', 1, 'ic')}<span>${Inv.used('boat:' + ab)}/${Inv.cap('boat:' + ab)}</span></button>`;
    if (Object.keys(S.auto.devices).length) h += `<div class="chip" title="Günlük otomatik av">${img('auto1', 1, 'ic')}<span>${S.auto.dailyCaught}/${CORE.auto_daily_catch_cap}</span></div>`;
    h += `<span class="sp"></span><button class="hb" data-a="fullscreen" title="Tam ekran">${img('fullscreen', 2)}</button>`;
    this.hudEl.innerHTML = h;
  },
  objective() {
    const t = S && Tutorial.current(); if (!t || !this.objEl || this.objEl.style.display === 'none') { this.objEl.innerHTML = ''; return; }
    this.objEl.innerHTML = `<div class="obj">${img('star', 1, 'ic')}<span>${esc(t.t)}</span><button data-a="skipTut" title="Öğreticiyi atla">✕</button></div>`;
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
  openPanel(name, args) { if (Fishing.ctx && !['READY', 'OUTCOME'].includes(Fishing.phase) && !['Settings', 'Help'].includes(name)) { Fishing.say('Önce avı tamamla.', 1.4); return; } if (this.panel !== name) for (const k in this.npcLines) delete this.npcLines[k]; this.panel = name; this.args = args || {}; this.renderPanel(); },
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
    const price = o.price != null ? `<div class="price">${img('coin', 2)}<b>${fmt(o.price)}</b></div><div class="dim">Bakiye: ${fmt(S.cash)} → <b class="${S.cash - o.price < 0 ? 'bad' : ''}">${fmt(S.cash - o.price)}</b></div>` : '';
    this.showModal(`<h3>${o.icon ? img(o.icon, 2) : ''} ${esc(o.title)}</h3>${o.html || `<p>${esc(o.text || '')}</p>`}${price}<div class="btns"><button class="btn" data-a="mCancel">${o.cancel || 'Vazgeç'}</button><button class="btn ${o.danger ? 'r' : 'g'}" data-a="mOk" ${o.price != null && S.cash < o.price ? 'disabled' : ''}>${o.ok || 'Onayla'}</button></div>`, 'confirm');
  },
  buy(title, icon, price, desc, fn) {
    if (S.cash < price) { this.toastNow('Paran yetmiyor: ' + fmt(price) + ' gerekli.', 'warn', 'coin'); Sound.sfx('error'); return; }
    this.confirm({ title, icon, price, text: desc, ok: 'Satın Al', onOk: () => { const r = fn(); if (r && r.ok === false && r.msg) this.toastNow(r.msg, 'warn'); else if (r && r.ok) this.toastNow(title + ' satın alındı!', 'good', icon); } });
  },
  /* ================= SAHNE ÇUBUKLARI ================= */
  mainMenu() {
    const has = !!this._hasSave;
    this.sceneui.innerHTML = `<div class="menu">
      ${has ? '<button class="btn g big" data-a="continue">Devam Et</button>' : ''}
      <button class="btn big ${has ? '' : 'g'}" data-a="newGame">Yeni Oyun</button>
      <div class="row2"><button class="btn" data-a="openPanel" data-p="Settings">${img('gear', 1, 'ic')} Ayarlar</button><button class="btn" data-a="openPanel" data-p="Help">${img('help', 1, 'ic')} Yardım</button><button class="btn" data-a="fullscreen">${img('fullscreen', 1, 'ic')} Tam Ekran</button></div>
      <div class="row2"><button class="btn" data-a="importOpen">Kaydı İçe Aktar</button>${has ? '<button class="btn" data-a="exportOpen">Kaydı Dışa Aktar</button>' : ''}</div>
      ${this._saveErr ? `<div class="warnbox">${esc(this._saveErr)}<br><button class="btn" data-a="restoreBackup">Yedekten Yükle</button> <button class="btn" data-a="exportRaw">Bozuk kaydı indir</button></div>` : ''}
      <div class="dim small">Çevrimdışı tek dosya · Tüm görseller ve sesler oyun içinde üretilir</div></div>`;
  },
  charCreator(cc) {
    const L = cc.look; const opt = (k, arr, cur, lab) => `<div class="cc"><span>${lab}</span><div class="opts">${arr.map((n, i) => `<button class="${i === cur ? 'on' : ''}" data-a="cc" data-k="${k}" data-v="${i}">${esc(n)}</button>`).join('')}</div></div>`;
    const sw = (k, arr, cur, lab) => `<div class="cc"><span>${lab}</span><div class="opts">${arr.map((c, i) => `<button class="sw ${i === cur ? 'on' : ''}" style="background:${c}" data-a="cc" data-k="${k}" data-v="${i}"></button>`).join('')}</div></div>`;
    this.sceneui.innerHTML = `<div class="ccbox scroll"><h2>Balıkçını Oluştur</h2>
      <div class="cc"><span>İsim</span><input maxlength="14" data-cc="name" value="${esc(L.name)}"></div>
      ${opt('body', BODY_TYPES, L.body, 'Beden')}${sw('skin', SKINS.map(s => s[0]), L.skin, 'Ten')}${opt('hair', HAIR_STYLES, L.hair, 'Saç')}${sw('hairColor', HAIR_COLORS.map(s => s[0]), L.hairColor, 'Saç rengi')}
      <div class="cc"><span>Kıyafet</span><div class="opts">${OUTFITS.filter(o => o.start).map(o => `<button class="${o.id === L.outfit ? 'on' : ''}" data-a="cc" data-k="outfit" data-v="${o.id}">${esc(o.name)}</button>`).join('')}</div></div>
      <div class="cc"><span>Şapka</span><div class="opts">${HATS.filter(o => o.start).map(o => `<button class="${o.id === L.hat ? 'on' : ''}" data-a="cc" data-k="hat" data-v="${o.id}">${esc(o.name)}</button>`).join('')}</div></div>
      <div class="btns"><button class="btn" data-a="toMenu">Geri</button><button class="btn g big" data-a="startGame">Maceraya Başla</button></div></div>`;
  },
  townBar(sc) {
    const n = sc.near;
    this.bottom.innerHTML = `<div class="bl"><button class="btn mv" data-hold="-1">${img('left', 2)}</button><button class="btn mv" data-hold="1">${img('right', 2)}</button></div>
      <div class="bc">${n ? `<button class="btn g big" data-a="interact">${img(n.icon, 2)} ${esc(n.name)}</button>` : '<span class="hint">Binalara dokun ya da yürü</span>'}</div>
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
    const left = boat ? `<button class="btn" data-a="backHarbor">${img('anchor', 2)}<span class="lbl">Liman</span></button><button class="btn mv" data-hold="-1">${img('left', 2)}</button><button class="btn mv" data-hold="1">${img('right', 2)}</button>`
      : `<button class="btn" data-a="backTown">${img('exit', 2)}<span class="lbl">Kasaba</span></button><button class="btn mv" data-hold="-1">${img('left', 2)}</button><button class="btn mv" data-hold="1">${img('right', 2)}</button>`;
    const spots = boat ? `<div class="spots">${REGION[sc.rid].spot_ids.map((id, i) => `<button class="btn sm ${sc.spotIdx() === i ? 'on' : ''}" data-a="goSpot" data-i="${i}">${['A', 'B', 'C'][i]}</button>`).join('')}</div>` : '';
    this.bottom.classList.add('fishing'); this.bottom.innerHTML = `<div class="bl">${left}${spots}</div><div class="bc"><div id="sonar"></div></div>
      <div class="br"><button class="btn" id="baitBtn" data-a="baitPick"></button><button class="btn" data-a="openPanel" data-p="Inventory">${img('bag', 2)}</button><button class="btn sm" id="giveUp" data-a="giveUp" style="display:none">Topla</button><button id="castBtn" class="cast"><span></span></button></div>`;
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
    const lab = { READY: 'OLTA AT', CHARGING: 'BIRAK!', CAST_FLYING: '…', WAITING: 'BEKLE', BITE_WINDOW: 'ÇEK!', QUICK_PULL: 'SAR', REELING: 'ÇEK', CATCH_RESULT: '✓', STORAGE_DECISION: '✓', OUTCOME: '…' }[ph] || '';
    const sub = { READY: 'basılı tut', CHARGING: 'kaydır = iptal', REELING: 'tut / bırak', QUICK_PULL: 'basılı tut', BITE_WINDOW: 'dokun' }[ph] || '';
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
        else t = `<span class="sonar dim">${esc(SPOTS[sc.spotId()].name)} · önerilen: ${BAND_TR[SPOTS[sc.spotId()].cast_band]}</span>`;
      } else if (Game.sceneName === 'PierFishing') t = `<span class="sonar dim">${esc(SPOTS[PIER_SPOTS[sc.idx]].name)} · önerilen atış: ${BAND_TR[SPOTS[PIER_SPOTS[sc.idx]].cast_band]}</span>`;
      if (so._t !== t) { so.innerHTML = t; so._t = t; }
    }
    if (Game.sceneName === 'BoatFishing') this.bottom.querySelectorAll('[data-a=goSpot]').forEach(b => b.classList.toggle('on', +b.dataset.i === Game.scene.spotIdx()));
  },
  offerBasicBait() {
    this.confirm({ title: 'Yem bitti', icon: 'bait_basic', text: 'Seçili yemin tükendi. Ücretsiz ve sınırsız temel yeme geçmek ister misin?', ok: 'Temel yeme geç', onOk: () => { Shop.setBait('basic'); } });
  },
  mapPanel(sc) {
    if (sc.travel) { this.sceneui.innerHTML = `<div class="mapinfo"><h3>${esc(REGION[sc.travel.rid].name)} yolunda…</h3><button class="btn" data-a="mapSkip">Geç</button></div>`; return; }
    const R = REGION[sc.sel]; const bid = S.boats.active; const re = Boats.reach(R.id, bid); const un = S.world.unlocked[R.id];
    const disc = R.fish_ids.filter(f => S.ency[f] && S.ency[f].caught).length;
    const req = REGION_REQ[R.id]; const reqTxt = R.requirements;
    const ev = World.event(); const evHere = ev && ev.region === R.id;
    this.sceneui.innerHTML = `<div class="mapinfo scroll"><h3>${img(un ? 'anchor' : 'lock', 2)} ${esc(R.name)}</h3>
      <div class="kv"><span>Hava</span><b>${img(S.world.weather[R.id], 1, 'ic')} ${WEATHER_TR[S.world.weather[R.id]]}</b></div>
      <div class="kv"><span>Sefer bedeli</span><b>${coin(R.trip_fuel_cost)}</b></div>
      <div class="kv"><span>Gereksinim</span><b>${esc(reqTxt)}</b></div>
      <div class="kv"><span>Aktif tekne</span><b>${bid ? esc(BOAT[bid].name) : '—'} ${S.boats.owned.length > 1 ? '<button class="btn sm" data-a="cycleBoat">Değiştir</button>' : ''}</b></div>
      ${re.ok ? '<div class="ok">✓ Bu tekneyle gidilebilir</div>' : `<div class="bad">✗ Eksik: ${esc(re.miss.join(', '))}</div>`}
      ${evHere ? `<div class="evbox">${img('event', 1, 'ic')} ${esc(ev.name)}: ${esc(World.eventText(ev))}</div>` : ''}
      <div class="kv"><span>Keşfedilen türler</span><b>${disc}/${R.fish_ids.length}</b></div>
      <div class="fishrow">${R.fish_ids.map(f => `<span title="${esc(S.ency[f] && S.ency[f].caught ? FISH[f].name_tr : '???')}">${fishImg(f, 1, 'mini')}</span>`).join('')}</div>
      <div class="kv"><span>Av noktaları</span><b>${R.spot_ids.map(s => esc(SPOTS[s].name) + (S.stats.spotsVisited[s] ? ' ✓' : '')).join(' · ')}</b></div>
      <div class="btns">${Object.keys(S.auto.devices).length ? `<button class="btn sm" data-a="openPanel" data-p="BoatLoadout">${img('auto1', 1, 'ic')} Donanım</button>` : ''}<button class="btn" data-a="mapBack">${img('home', 1, 'ic')} Limana Dön</button><button class="btn g" data-a="depart" ${re.ok && S.cash >= R.trip_fuel_cost ? '' : 'disabled'}>${img('boat', 1, 'ic')} Yola Çık (${fmt(R.trip_fuel_cost)})</button></div>
      <div class="dim small">Limana dönüş ücretsizdir. ${R.id === 'sakin_liman' ? 'Sakin Liman\'da tekneyle de avlanabilirsin; iskele avı her zaman ücretsiz.' : ''}</div></div>`;
  },
  endDay(rep) {
    const net = rep.endCash - rep.startCash;
    const exp = Object.entries(rep.expBy || {}).map(([k, v]) => `${({ gear: 'Ekipman', bait: 'Yem', fuel: 'Yakıt', boat: 'Tekne', automation: 'Otomasyon', cosmetic: 'Kozmetik', home: 'Ev' })[k] || k}: ${fmt(v)}`).join(' · ');
    const ev = rep.event ? EVENT[rep.event] : null;
    this.sceneui.innerHTML = `<div class="report scroll"><h2>${img('sleep', 2)} ${rep.prevDay}. Gün Sona Erdi</h2>
      <div class="grid2">
        <div class="kv"><span>Manuel av</span><b>${rep.manualCatches}</b></div><div class="kv"><span>Otomatik av</span><b>${rep.autoCatches}</b></div>
        <div class="kv"><span>Atış</span><b>${rep.casts}</b></div><div class="kv"><span>Serbest bırakılan</span><b>${rep.released}</b></div>
        <div class="kv"><span>Balık hali geliri</span><b>${coin(rep.marketIncome)}</b></div><div class="kv"><span>İlan geliri</span><b>${coin(rep.orderIncome)}</b></div>
        <div class="kv"><span>Giderler</span><b>${coin(rep.expenses)}</b></div><div class="kv"><span>Net değişim</span><b class="${net >= 0 ? 'ok' : 'bad'}">${net >= 0 ? '+' : ''}${fmt(net)}</b></div>
      </div>${exp ? `<div class="dim small">${esc(exp)}</div>` : ''}
      ${rep.newSpecies.length ? `<h4>Yeni türler</h4><div class="fishrow">${rep.newSpecies.map(f => fishImgAlways(f, 1, 'mini')).join('')} ${rep.newSpecies.map(f => esc(FISH[f].name_tr)).join(', ')}</div>` : ''}
      ${rep.records.length ? `<h4>Rekorlar</h4><div>${[...new Set(rep.records)].map(f => esc(FISH[f].name_tr) + ' ' + S.ency[f].maxLen + ' cm').join(' · ')}</div>` : ''}
      ${rep.achievements.length ? `<h4>Başarımlar</h4><div>${rep.achievements.map(a => img('trophy', 1, 'ic') + ' ' + esc(ACHS.find(x => x.id === a).name)).join(' · ')}</div>` : ''}
      <hr><div class="next">${rep.newYear ? '<b class="ok">Yeni yıl başladı! </b>' : ''}${rep.newSeason ? `<b class="ok">${SEASON_TR[rep.season]} geldi! </b>` : ''}Yarın: <b>Gün ${rep.newDay}</b> · ${SEASON_TR[rep.season]} · Sakin Liman ${WEATHER_TR[rep.weather]}${ev ? ` · Olay: <b>${esc(ev.name)}</b>` : ''}</div>
      <div class="btns"><button class="btn g big" data-a="wake">${img('sunny', 2)} Yeni Güne Başla</button></div></div>`;
  },
  morning() {
    const ev = World.event(); const nOrd = Orders.active().length;
    this.toastNow('Günaydın! Gün ' + S.day + ' · ' + SEASON_TR[World.season()] + ' ' + World.seasonDay() + '/28 · Enerji 100 · Panoda ' + nOrd + ' ilan', 'good', 'sunny');
    if (ev) this.toastNow('Günün olayı: ' + ev.name + ' — ' + World.eventText(ev), 'info', 'event');
  },
  confirmSleep() {
    const rod = rodOf(); const left = Math.floor(S.energy / rod.energy);
    this.confirm({ title: 'Uyu ve günü bitir', icon: 'sleep', html: `<p>${left > 0 ? `Hâlâ <b>${S.energy}</b> enerjin var (${left} atış). Kullanılmayan enerji ertesi güne aktarılmaz.` : 'Bugün güzel bir gündü. Dinlenme vakti!'}</p><p class="dim">Uyuyunca: enerji 100 olur, ilanlar ve hava yenilenir, otomatik av sınırı sıfırlanır.</p>`, ok: 'Uyu', onOk: () => { const rep = World.sleep(); if (rep) { Save.backup(); go('EndDay', { rep }); } } });
  },
  showCompResult() {
    const c = S.comp; if (!c || !c.done || !c.result) return; const r = c.result, f = FEST[r.fest];
    this.showModal(`<div class="card"><div class="shine"></div>${r.place <= 3 ? img('cup_' + r.place, 5) : img('festival', 4)}<h2>${esc(f.comp_name)}</h2><div>${r.place <= 3 ? `<span class="badge rec">${r.place}. OLDUN!</span>` : `<span class="badge big">${r.place}. sıra</span>`}</div>
      <table class="qt">${r.standings.map((x, i) => `<tr${x.player ? ' style="background:#ffe9b0"' : ''}><td>${i + 1}. ${esc(x.name)}</td><td>${esc(Comp.fmt(f.comp, x.score))}</td><td>${x.n} balık</td></tr>`).join('')}</table>
      ${r.prize ? `<div class="price">${img('coin', 2)}<b>+${fmt(r.prize)}</b></div><div class="ok">Kupan evindeki Kupa Dolabı'na kondu!</div>` : '<p class="dim">Bu sefer kupa yok; bir sonraki şenlikte tekrar dene!</p>'}
      <div class="btns"><button class="btn g big" data-a="compDone">Harika!</button></div></div>`, 'catch');
  },
  tiltHint() {
    const want = Fishing.phase === 'REELING' && Fishing.dir && !(Fishing.tired > 0) ? -Fishing.dir : 0;
    if (want === this._tiltWant) return; this._tiltWant = want;
    this.bottom.querySelectorAll('[data-hold]').forEach(b => b.classList.toggle('hintpulse', +b.dataset.hold === want));
  },
  /* CatchResult */
  showCatch(c, storage) {
    const f = FISH[c.fid]; const sp = fishSprite(c.fid); const sc = sp.width > 70 ? 2 : 3;
    const badges = [c.rec && c.rec.isNew ? '<span class="badge new">YENİ TÜR!</span>' : '', c.rec && c.rec.isRecord ? '<span class="badge rec">KİŞİSEL REKOR!</span>' : '', c.size.cls === 'large' ? '<span class="badge big">İri</span>' : '', c.size.cls === 'exceptional' ? '<span class="badge huge">Olağanüstü İri!</span>' : ''].join('');
    let foot;
    if (storage) {
      const keys = Inv.manualOrder();
      const stacks = keys.map(k => `<div class="sub">${esc(Inv.label(k))}</div><div class="slots">${Inv.arr(k).map((s, i) => `<button class="slot" data-a="swapPick" data-k="${k}" data-i="${i}">${fishImgAlways(s.f, 1)}<i>${s.q}</i></button>`).join('')}</div>`).join('');
      foot = `<div class="bad">Çanta${keys.length > 1 ? ' ve tekne deposu' : ''} dolu! Balığı serbest bırakabilir ya da bir yığını bırakıp yerine koyabilirsin.</div>
        <div class="btns"><button class="btn" data-a="catchRelease">${img('release', 1, 'ic')} Serbest Bırak</button><button class="btn b" data-a="catchSwap">${img('swap', 1, 'ic')} Yer Değiştir</button></div><div id="swapList" style="display:none"><div class="dim">Yerine bırakılacak yığını seç (onay istenir):</div>${stacks}</div>`;
    } else foot = `<div class="ok">→ ${esc(c.where === 'bag' ? 'Sırt çantasına eklendi' : Inv.label(c.where) + 'na eklendi')}</div><div class="btns"><button class="btn g big" data-a="catchClose">Devam</button></div>`;
    this.showModal(`<div class="card"><div class="shine"></div><img class="pix" style="width:${sp.width * sc}px;height:${sp.height * sc}px" src="${fishUrl(c.fid, sc)}" alt=""><h2>${esc(f.name_tr)}</h2><div>${badges}</div>
      <div class="grid3"><div class="kv"><span>Boy</span><b>${c.size.cm} cm</b></div><div class="kv"><span>Ağırlık</span><b>${fmtKg(c.size.kg)} kg</b></div><div class="kv"><span>Taban fiyat</span><b>${coin(f.base_price)}</b></div></div>
      <div class="dim small">Güç ${powerStr(f.power)} · ${esc(REGION[f.home_region].name)} · Boy fiyatı etkilemez</div>${foot}</div>`, 'catch');
  },
  /* ================= PANELLER ================= */
  P: {
    Menu() {
      const b = (p, ic, n) => `<button class="btn tile" data-a="openPanel" data-p="${p}">${img(ic, 3)}<span>${n}</span></button>`;
      return { title: 'Menü', icon: 'menu', html: `<div class="tiles">${b('Inventory', 'bag', 'Envanter')}${b('Encyclopedia', 'book', 'Ansiklopedi')}${b('Achievements', 'trophy', 'Başarımlar')}${b('Statistics', 'chart', 'İstatistikler')}${b('Orders', 'order', 'İlanlar')}${b('Settings', 'gear', 'Ayarlar')}${b('Trophies', 'cup_1', 'Kupalar')}${b('Help', 'help', 'Yardım')}<button class="btn tile" data-a="saveQuit">${img('exit', 3)}<span>Kaydet ve Ana Menü</span></button></div><p class="dim small">Kayıt otomatik yapılır (av, satış, satın alma, ilan, uyku, aktarım ve sahne değişiminde). Son kayıt: devir #${S.revision}.</p>` };
    },
    Inventory(a) {
      const acc = Inv.accessible(); const others = acc.filter(k => k !== 'bag');
      let right = this.sel.invRight && others.includes(this.sel.invRight) ? this.sel.invRight : (a.right && others.includes(a.right) ? a.right : (others.includes(Inv.activeBoatKey()) ? Inv.activeBoatKey() : others[0]));
      this.sel.invRight = right;
      const tab = this.curTab('inv', 'fish');
      const box = (key) => {
        const arr = Inv.arr(key), cap = Inv.cap(key); let cells = '';
        for (let i = 0; i < cap; i++) { const s = arr[i]; cells += s ? `<button class="slot ${this.sel.slot === key + ':' + i ? 'sel' : ''}" data-a="slotSel" data-k="${key}" data-i="${i}">${fishImgAlways(s.f, 1)}<i>${s.q}</i>${S.favorites[s.f] ? '<em>' + img('star', 1, 'ic') + '</em>' : ''}</button>` : `<div class="slot empty"></div>`; }
        return `<div class="invbox"><div class="sub">${esc(Inv.label(key))} <span class="dim">${arr.length}/${cap} yuva · ${Inv.total(key)} balık</span></div><div class="slots">${cells}</div></div>`;
      };
      let html = '';
      if (tab === 'fish') {
        html += `<div class="invcols">${box('bag')}<div class="mid">${right ? `<button class="btn sm" data-a="moveAll" data-f="bag" data-t="${right}">Tümü →</button><button class="btn sm" data-a="moveAll" data-f="${right}" data-t="bag">← Tümü</button>` : ''}</div>${right ? `<div>${others.length > 1 ? `<div class="tabs small">${others.map(k => `<button class="${k === right ? 'on' : ''}" data-a="invRight" data-k="${k}">${esc(k === 'chest' ? 'Sandık' : BOAT[k.slice(5)].name)}</button>`).join('')}</div>` : ''}${box(right)}</div>` : '<div class="dim">Burada başka depo yok. Tekne deposu limanda/teknede, sandık evde erişilebilir.</div>'}</div>`;
        const ss = this.sel.slot && this.sel.slot.split(':'); if (ss) {
          const key = ss.length === 3 ? ss[0] + ':' + ss[1] : ss[0], idx = +ss[ss.length - 1]; const s = Inv.arr(key) && Inv.arr(key)[idx];
          if (s) { const other = key === 'bag' ? right : 'bag'; html += `<div class="detail">${fishImgAlways(s.f, 2)}<div><b>${esc(FISH[s.f].name_tr)}</b> ×${s.q} <span class="dim">· taban ${fmt(FISH[s.f].base_price)}/adet</span><div class="btns left"><button class="btn sm" data-a="fav" data-f="${s.f}">${S.favorites[s.f] ? '★ Favoriden çıkar' : '☆ Favori yap'}</button>${other ? `<button class="btn sm" data-a="moveOne" data-k="${key}" data-to="${other}" data-f="${s.f}" data-n="1">1 aktar</button><button class="btn sm" data-a="moveOne" data-k="${key}" data-to="${other}" data-f="${s.f}" data-n="${s.q}">Yığını aktar</button>` : ''}<button class="btn sm r" data-a="releaseStack" data-k="${key}" data-i="${idx}">Serbest bırak</button></div></div></div>`; } else this.sel.slot = null;
        }
        html += `<p class="dim small">Her yuvada aynı türden en çok ${STACK} balık. Balıklar bozulmaz. Favori (★) türler toplu satışta korunur.</p>`;
      } else {
        const g = (k) => { const it = GEAR[k].find(x => x.id === S.gear[k]); return `<div class="kv">${img(k + '_' + it.id, 2)}<span>${GEAR_TR[k]}</span><b>${esc(it.name)}</b></div>`; };
        html += `<div class="grid2">${g('rod')}${g('line')}${g('reel')}${g('hook')}</div><h4>Yemler</h4><div class="grid3">${BAITS.map(b => `<button class="kv btnlike ${S.gear.bait === b.id ? 'on' : ''}" data-a="setBait" data-id="${b.id}">${img('bait_' + b.id, 2)}<span>${esc(b.name)}</span><b>${b.id === 'basic' ? '∞' : S.baitStock[b.id]}</b></button>`).join('')}</div><p class="dim small">Ekipman ve yem balık yuvası kaplamaz. Temel yem sınırsızdır ama otomatik oltalarda kullanılamaz.</p>`;
      }
      return { title: 'Envanter', icon: 'bag', tabs: this.tabsHtml('inv', [['fish', 'Balıklar'], ['gear', 'Ekipman & Yem']]), html, cls: 'wide' };
    },
    FishMarket() {
      const src = Market.sources(!!this.sel.mChest); const sp = Inv.species(src); const ids = Object.keys(sp).sort((a, b) => FISH[a].base_price - FISH[b].base_price);
      let rows = ids.map(f => {
        const n = sp[f], q = clamp(this.qty['m' + f] || n, 1, n); const bo = Market.betterOffer(f);
        return `<div class="row"><button class="fav" data-a="fav" data-f="${f}" title="Favori">${img(S.favorites[f] ? 'star' : 'starOff', 1, 'ic')}</button>${fishImgAlways(f, 1, 'mini')}<div class="grow"><b>${esc(FISH[f].name_tr)}</b> <span class="dim">×${n} · ${fmt(FISH[f].base_price)}/adet</span>${bo ? `<div class="warn small">${img('event', 1, 'ic')} ${esc(CUST[bo.customerId].name)} ilanında ${fmt(bo.unitPrice)}/adet!</div>` : ''}</div>
          <div class="step"><button data-a="qty" data-k="m${f}" data-d="-1" data-max="${n}">−</button><b>${q}</b><button data-a="qty" data-k="m${f}" data-d="1" data-max="${n}">+</button><button data-a="qty" data-k="m${f}" data-d="999" data-max="${n}">Max</button></div>
          <button class="btn g sm" data-a="mSell" data-f="${f}" data-n="${q}">Sat ${coin(q * FISH[f].base_price)}</button></div>`;
      }).join('');
      if (!ids.length) rows = '<p class="dim">Satılacak balığın yok. İskelede ya da denizde balık tutup getir!</p>';
      const plan = Market.sellAllPlan(src, false); const tot = sum(plan.map(p => p.income));
      const html = `<div class="srcs"><label><input type="checkbox" checked disabled> Çanta</label>${S.boats.active ? `<label><input type="checkbox" checked disabled> ${esc(BOAT[S.boats.active].name)} deposu</label>` : ''}<label><input type="checkbox" data-chk="mChest" ${this.sel.mChest ? 'checked' : ''}> Ev sandığı</label></div>${rows}`;
      return { title: 'Nihat\'ın Balık Hali', icon: 'market', npc: 'nihat', html, foot: `<span class="dim">Hal her türü taban fiyattan, sınırsız alır.</span><button class="btn g" data-a="mSellAll" ${plan.length ? '' : 'disabled'}>Tüm Uygun Balıkları Sat ${coin(tot)}</button>` };
    },
    Orders() {
      const tab = this.curTab('ord', 'board');
      const src = Market.sources(!!this.sel.oChest);
      let html = '';
      if (tab === 'board') {
        const act = Orders.active();
        html += `<div class="srcs"><span class="dim">Aktif ilan: ${act.filter(o => !o.tag).length}/${Orders.slots()}${act.some(o => o.tag) ? ' + olay ilanı' : ''}</span><label><input type="checkbox" data-chk="oChest" ${this.sel.oChest ? 'checked' : ''}> Sandıktan da teslim et</label></div>`;
        html += act.map(o => {
          const f = FISH[o.fishId], c = CUST[o.customerId], rem = Orders.remaining(o), have = Inv.count(src, o.fishId), mx = Math.min(rem, have); const q = clamp(this.qty['o' + o.id] || mx, mx ? 1 : 0, mx); const dl = Orders.daysLeft(o); const lvl = Orders.relLevel(o.customerId);
          return `<div class="order ${rem === 0 ? 'done' : ''}"><div class="oh">${img('cust_' + c.id, 2)}<b>${esc(c.name)}</b><span class="lv">${'★'.repeat(lvl)}${'☆'.repeat(3 - lvl)}</span>${o.tag ? '<span class="badge new">Olay</span>' : ''}${o.future ? `<span class="badge big">Gelecek bölge: ${esc(REGION[f.home_region].name)}</span>` : ''}<span class="sp"></span><span class="${dl <= 1 ? 'warn' : 'dim'}">${dl <= 1 ? 'Bugün son gün' : dl + ' gün'}</span></div>
            <div class="ob">${fishImg(o.fishId, 1, 'mini')}<div class="grow"><b>${esc(f.name_tr)}</b> <span class="dim">· ${esc(REGION[f.home_region].name)}</span><div class="bar"><i style="width:${o.delivered / o.requestedTotal * 100}%"></i><span>${o.delivered}/${o.requestedTotal} teslim · kalan ${rem}</span></div></div>
            <div class="pricebox"><b>${coin(o.unitPrice)}</b><span class="dim">/adet (+%${Math.round(o.bonus * 100)}) · hal ${fmt(f.base_price)}</span></div></div>
            <div class="of"><span class="dim">Elinde: <b>${have}</b></span><span class="sp"></span>${mx ? `<div class="step"><button data-a="qty" data-k="o${o.id}" data-d="-1" data-max="${mx}">−</button><b>${q}</b><button data-a="qty" data-k="o${o.id}" data-d="1" data-max="${mx}">+</button><button data-a="qty" data-k="o${o.id}" data-d="999" data-max="${mx}">Max</button></div><button class="btn g sm" data-a="oDeliver" data-id="${o.id}" data-n="${q}">Teslim Et ${coin(q * o.unitPrice)}</button>` : `<span class="dim">${rem ? 'Bu türden balığın yok' : 'İlan doldu'}</span>`}</div></div>`;
        }).join('') || '<p class="dim">Panoda ilan yok. Yarın yenileri asılacak.</p>';
        html += '<p class="dim small">İlanlar alım teklifidir: istediğin kadar kısmi teslim edebilirsin, tamamlama zorunluluğu ve süre bitiminde ceza yoktur. Fiyatlar ilan ömrü boyunca sabittir.</p>';
      } else {
        const th = CFG.orders.relationship_threshold_fish_delivered;
        html += CUSTOMERS.map(c => { const d = Orders.relDelivered(c.id), l = Orders.relLevel(c.id); const nx = th[l]; const avail = c.focus.some(f => S.world.unlocked[f]); return `<div class="row">${img('cust_' + c.id, 2)}<div class="grow"><b>${esc(c.name)}</b> <span class="lv">${'★'.repeat(l)}${'☆'.repeat(3 - l)}</span><div class="dim small">Odak: ${c.focus.map(f => esc(REGION[f].name)).join(', ')} · Prim %${Math.round(c.bonus_range[0] * 100)}–${Math.round(c.bonus_range[1] * 100)}${avail ? '' : ' · henüz uzak'}</div></div><div class="pricebox"><b>${d}</b><span class="dim">balık teslim${nx ? ' · sonraki seviye ' + nx : ' · en üst seviye'}</span></div></div>`; }).join('');
        html += '<p class="dim small">İlişki, teslim edilen toplam balık adedine göre artar (50/150/350). Yüksek ilişki daha iyi primli teklifler getirir (en çok %40).</p>';
      }
      return { title: 'Sipariş Panosu', icon: 'order', npc: 'bahar', tabs: this.tabsHtml('ord', [['board', 'İlanlar'], ['cust', 'Müşteriler']]), html, cls: 'wide' };
    },
    TackleShop() {
      const tab = this.curTab('shop', 'rod'); let html = '';
      const gearRow = (kind, it) => {
        const st = Shop.gearState(kind, it.id); let stat = '';
        if (kind === 'rod') stat = `Güç ${it.power} · ${it.energy} enerji/atış · günde ${Math.floor(CORE.daily_energy / it.energy)} atış`;
        if (kind === 'line') stat = `Dayanıklılık +%${it.durability_bonus_pct} (kopma toleransı)`;
        if (kind === 'reel') stat = `Çekme hızı +%${it.reel_speed_bonus_pct}`;
        if (kind === 'hook') stat = `Gevşek misina toleransı +%${it.slack_resistance_bonus_pct}`;
        const btn = st === 'equipped' ? '<span class="ok">Kullanılıyor</span>' : st === 'owned' ? `<button class="btn sm" data-a="equip" data-k="${kind}" data-id="${it.id}">Kullan</button>` : st === 'locked' ? '<span class="dim">Önceki seviye gerekli</span>' : `<button class="btn g sm" data-a="buyGear" data-k="${kind}" data-id="${it.id}" ${st === 'poor' ? 'disabled' : ''}>Satın Al ${coin(it.price)}</button>`;
        return `<div class="row">${img(kind + '_' + it.id, 2)}<div class="grow"><b>${esc(it.name)}</b><div class="dim small">${stat}</div></div>${btn}</div>`;
      };
      if (['rod', 'line', 'reel', 'hook'].includes(tab)) html = GEAR[tab].map(it => gearRow(tab, it)).join('') + (tab === 'rod' ? '<p class="dim small">Olta gücü, yakalanabilecek balıkları belirler: güç ≤ olta gücü + 1. Bir üst güçteki balıklarla mücadele daha zordur.</p>' : '');
      if (tab === 'bait') {
        const m = Shop.baitMult();
        html = (m < 1 ? `<div class="evbox">${img('event', 1, 'ic')} Bugün yem indirimi: ×${String(m).replace('.', ',')}</div>` : '') + BAITS.map(b => b.id === 'basic' ? `<div class="row">${img('bait_basic', 2)}<div class="grow"><b>${esc(b.name)}</b><div class="dim small">${BAIT_HINT.basic}</div></div>${S.gear.bait === 'basic' ? '<span class="ok">Seçili</span>' : '<button class="btn sm" data-a="setBait" data-id="basic">Seç</button>'}</div>`
          : `<div class="row">${img('bait_' + b.id, 2)}<div class="grow"><b>${esc(b.name)}</b> <span class="dim">· stok ${S.baitStock[b.id]} · ${String(Math.round(b.purchase_price * m * 100) / 100).replace('.', ',')}/adet</span><div class="dim small">${BAIT_HINT[b.id]}</div></div><div class="btns">${[10, 25, 50].map(q => `<button class="btn sm g" data-a="buyBait" data-id="${b.id}" data-q="${q}" ${S.cash < Shop.baitCost(b.id, q) ? 'disabled' : ''}>×${q} ${coin(Shop.baitCost(b.id, q))}</button>`).join('')}${S.gear.bait === b.id ? '<span class="ok">Seçili</span>' : `<button class="btn sm" data-a="setBait" data-id="${b.id}" ${S.baitStock[b.id] ? '' : 'disabled'}>Seç</button>`}</div></div>`).join('') + '<p class="dim small">Uygun yem türün görülme ağırlığını ×1,6; uygunsuz ücretli yem ×0,8 yapar. Ücretli yem her atışta 1 adet harcanır.</p>';
      }
      if (tab === 'bag') {
        html = INVC.bag.map((b, i) => `<div class="row">${img('bagUp', 2)}<div class="grow"><b>Çanta seviye ${i + 1}</b><div class="dim small">${b[1]} balık yuvası</div></div>${i <= S.bagLevel ? '<span class="ok">Sahip</span>' : i === S.bagLevel + 1 ? `<button class="btn g sm" data-a="buyBag" ${S.cash < b[2] ? 'disabled' : ''}>Yükselt ${coin(b[2])}</button>` : '<span class="dim">Önceki gerekli</span>'}</div>`).join('');
      }
      return { title: 'Zeynep\'in Olta Dükkânı', icon: 'shop', npc: 'zeynep', tabs: this.tabsHtml('shop', [['rod', 'Olta'], ['line', 'Misina'], ['reel', 'Makara'], ['hook', 'İğne'], ['bait', 'Yem'], ['bag', 'Çanta']]), html, cls: 'wide' };
    },
    Boatyard() {
      const tab = this.curTab('yard', 'boats'); let html = '';
      const selB = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : (S.boats.active || S.boats.owned[0]);
      const boatPick = () => S.boats.owned.length ? `<div class="tabs small">${S.boats.owned.map(id => `<button class="${id === selB ? 'on' : ''}" data-a="yardBoat" data-id="${id}">${esc(BOAT[id].name)}</button>`).join('')}</div>` : '';
      if (tab === 'boats') {
        if (!S.boats.owned.length) html += `<div class="evbox">${img('boat', 2)} İlk hedef: <b>Kıyı Kayığı</b> — ${coin(BOAT.coastal_skiff.price)}. İskelede balık tutup biriktirebilirsin. Şu an: ${coin(S.cash)}</div>`;
        html += BOATS.map(b => {
          const own = Boats.owned(b.id); const st = own ? Boats.stats(b.id) : null; const reach = REGIONS.filter(r => r.id !== 'sakin_liman' && Boats.reach(r.id, b.id).ok).map(r => r.name);
          const url = boatThumb(b.id);
          return `<div class="row boat">${`<img class="pix bthumb" src="${url}" alt="">`}<div class="grow"><b>${esc(b.name)}</b> ${own && S.boats.active === b.id ? '<span class="badge new">Aktif</span>' : ''}<div class="dim small">Depo ${b.initial_storage}→${b.max_storage} yuva · ${b.slots} otomatik olta yuvası · Motor ${ROMAN_S[b.default_motor]}${own ? ` · Şu an: depo ${st.storage}, motor ${ROMAN_S[st.motor]}, nav ${st.nav ? ROMAN_S[st.nav] : '-'}` : ''}</div><div class="small">${reach.length ? 'Ulaşım: ' + esc(reach.join(', ')) : 'Yükseltmelerle yeni rotalar açılır'}</div>${own ? `<div class="small dim">Depoda ${Inv.total('boat:' + b.id)} balık</div>` : ''}</div>
            ${own ? (S.boats.active === b.id ? '<span class="ok">Kullanımda</span>' : `<button class="btn sm" data-a="setActive" data-id="${b.id}">Aktif Yap</button>`) : `<button class="btn g sm" data-a="buyBoat" data-id="${b.id}" ${S.cash < b.price ? 'disabled' : ''}>Satın Al ${coin(b.price)}</button>`}</div>`;
        }).join('') + '<p class="dim small">Aynı anda tek tekne aktiftir; diğerleri limanda bekler, yükseltmeleri ve depoları kendi üzerinde kalır. Tekne bakımı/bozulması yoktur.</p>';
      }
      if (tab === 'ups') {
        if (!selB) html = '<p class="dim">Önce bir tekne satın al.</p>';
        else {
          const st = Boats.stats(selB); html += boatPick();
          html += `<div class="grid4"><div class="kv">${img('upg_motor', 1, 'ic')}<span>Motor</span><b>${ROMAN_S[st.motor]}</b></div><div class="kv">${img('upg_navigation', 1, 'ic')}<span>Navigasyon</span><b>${st.nav ? ROMAN_S[st.nav] : '—'}</b></div><div class="kv">${img('upg_hull', 1, 'ic')}<span>Gövde</span><b>${st.hull ? ROMAN_S[st.hull] : '—'}</b></div><div class="kv">${img('upg_storage', 1, 'ic')}<span>Depo</span><b>${st.storage}</b></div></div>`;
          html += BOAT_INFO[selB].ups.map(u => { const s = Boats.upState(selB, u.key); const nm = UPG_TR[u.type] + ' ' + (u.type === 'storage' ? u.val + ' yuva' : ROMAN_S[u.val]); const eff = { motor: 'Bölge menzili ve sürüş hızı', navigation: 'Uzak rota erişimi ve av noktası sonarı', hull: 'Rüzgâr/sallantı etkisini azaltır, görünümü iyileştirir', storage: 'Daha fazla depo yuvası' }[u.type]; return `<div class="row">${img('upg_' + u.type, 2)}<div class="grow"><b>${nm}</b> <span class="dim small">(${u.key})</span><div class="dim small">${eff}</div></div>${s === 'owned' ? '<span class="ok">Yüklü</span>' : s === 'locked' ? '<span class="dim">Önce ' + esc(u.req) + '</span>' : `<button class="btn g sm" data-a="buyUp" data-id="${selB}" data-k="${u.key}" ${s === 'poor' ? 'disabled' : ''}>Satın Al ${coin(u.price)}</button>`}</div>`; }).join('');
          html += `<p class="small">Erişim: ${REGIONS.filter(r => r.id !== 'sakin_liman').map(r => { const re = Boats.reach(r.id, selB); return (re.ok ? '✓ ' : '✗ ') + esc(r.name); }).join(' · ')}</p>`;
        }
      }
      if (tab === 'auto') {
        const desc = { auto1: '4 manuel atışta 1 deneme · %55 başarı · güç ≤2', auto_reel: 'Tüm cihazlar: 3 atışta 1 deneme · %65 · güç ≤3', sensing: 'Tüm cihazlar: başarı %75', auto2: 'Yeni bağımsız cihaz (global yükseltmeleri kullanır)', auto3: 'Yeni bağımsız cihaz (global yükseltmeleri kullanır)', deep_sea_gear: 'Yalnızca Açık Deniz Teknesi\'nde güç 4 otomatik av' };
        html += `<div class="evbox">Şu anki ayar: her <b>${Auto.every()}</b> manuel atışta 1 deneme · başarı <b>%${Math.round(Auto.success() * 100)}</b> · güç sınırı <b>${Auto.maxPower(S.boats.active)}</b> (aktif tekne) · bugün <b>${S.auto.dailyCaught}/${CORE.auto_daily_catch_cap}</b> otomatik av</div>`;
        html += AUTOS.map(a => { const s = Auto.state(a.id); return `<div class="row">${img(a.id, 2)}<div class="grow"><b>${esc(a.name)}</b> <span class="dim small">${a.type === 'device' ? 'cihaz' : 'global yükseltme'}</span><div class="dim small">${desc[a.id]}</div></div>${s === 'owned' ? '<span class="ok">Sahip</span>' : s === 'locked' ? `<span class="dim">Önce ${esc(AUTO[a.requires].name)}</span>` : `<button class="btn g sm" data-a="buyAuto" data-id="${a.id}" ${s === 'poor' ? 'disabled' : ''}>Satın Al ${coin(a.price)}</button>`}</div>`; }).join('');
        html += `<div class="btns left"><button class="btn sm" data-a="openPanel" data-p="BoatLoadout">${img('auto1', 1, 'ic')} Tekne Donanımı paneli</button></div>` + this.loadoutHtml();
        html += '<p class="dim small">Otomatik oltalar yalnızca denizde, sen geçerli manuel atış yaptıkça ilerler; çevrimdışı ya da beklerken balık üretmez. Her denemede 1 ücretli yem harcanır. Güç 5 balıklar daima manueldir. Tüm cihazlar toplam günde en çok 6 başarılı av yapabilir.</p>';
      }
      if (tab === 'look') {
        if (!selB) html = '<p class="dim">Önce bir tekne satın al.</p>';
        else {
          const b = S.boats.byId[selB]; html += boatPick();
          html += `<div class="center"><img class="pix bthumb big" src="${boatThumb(selB)}" alt=""></div><h4>Gövde rengi</h4><div class="grid2">${BOAT_COLORS.map(c => { const own = S.cosmetics.boatColors.includes(c.id); return `<div class="row">${img('bc_' + c.id, 2)}<div class="grow"><b>${esc(c.name)}</b>${c.unlockTr && !own ? `<div class="dim small">Kilit: ${esc(c.unlockTr)}</div>` : ''}</div>${own ? (b.color === c.id ? '<span class="ok">Seçili</span>' : `<button class="btn sm" data-a="boatColor" data-id="${c.id}">Uygula</button>`) : c.price ? `<button class="btn g sm" data-a="buyColor" data-id="${c.id}" ${S.cash < c.price ? 'disabled' : ''}>${coin(c.price)}</button>` : '<span class="dim">Kilitli</span>'}</div>`; }).join('')}</div>
            <h4>İsim levhası</h4><div class="row"><input id="boatName" maxlength="12" value="${esc(b.name)}" placeholder="ÖRN. MARTI"><button class="btn sm" data-a="boatName">Kaydet</button></div><p class="dim small">Görünüm bu tekneye kaydedilir. Motor, depo, navigasyon ve gövde yükseltmeleri sahnede görünür.</p>`;
        }
      }
      return { title: 'Bora\'nın Tekne Atölyesi', icon: 'yard', npc: 'bora', tabs: this.tabsHtml('yard', [['boats', 'Tekneler'], ['ups', 'Yükseltmeler'], ['auto', 'Otomasyon'], ['look', 'Görünüm']]), html, cls: 'wide' };
    },
    BoatLoadout() { return { title: 'Tekne Donanımı', icon: 'auto1', html: this.loadoutHtml() }; },
    Encyclopedia() {
      const det = this.sel.ency;
      if (det) {
        const f = FISH[det], e = S.ency[det], known = e && e.caught;
        const spots = SPOT_LIST.filter(s => s.weights[det]).map(s => esc(s.name) + ' (%' + s.weights[det] + ')').join(' · ');
        const sp = fishSprite(det); const sc = sp.width > 60 ? 2 : 3;
        return { title: known ? f.name_tr : 'Bilinmeyen tür', icon: 'book', html: `<button class="btn sm" data-a="encyBack">← Liste</button><div class="center"><img class="pix" style="width:${sp.width * sc}px" src="${known ? fishUrl(det, sc) : fishSilUrl(det, sc)}" alt=""></div>
          ${known ? `<p>${esc(f.encyclopedia_tr)}</p><div class="grid3"><div class="kv"><span>Bölge</span><b>${esc(REGION[f.home_region].name)}</b></div><div class="kv"><span>Güç</span><b>${powerStr(f.power)}</b></div><div class="kv"><span>En az olta</span><b>Güç ${f.minimum_rod_power}</b></div><div class="kv"><span>Taban fiyat</span><b>${coin(f.base_price)}</b></div><div class="kv"><span>Uygun yem</span><b>${f.favored_baits.map(b => esc(BAIT[b].name)).join(', ')}</b></div><div class="kv"><span>Atış mesafesi</span><b>${BAND_TR[f.preferred_cast_band]}</b></div><div class="kv"><span>Sevdiği hava</span><b>${f.weather_boost ? WEATHER_TR[f.weather_boost] : '—'}</b></div><div class="kv"><span>Mevsim</span><b>${f.season_boost ? SEASON_TR[f.season_boost] + ' ×' + String(f.season_modifier).replace('.', ',') : '—'}</b></div><div class="kv"><span>Yakalama</span><b>${e.caught}</b></div><div class="kv"><span>Boy rekoru</span><b>${e.maxLen} cm</b></div><div class="kv"><span>Ağırlık rekoru</span><b>${fmtKg(e.maxKg)} kg</b></div><div class="kv"><span>Boy aralığı</span><b>${f.size_game_range.length_cm.join('–')} cm</b></div><div class="kv"><span>Mücadele</span><b>${STYLE_TR[fightStyle(det)]}</b></div></div><p class="small">Av noktaları: ${spots}</p>`
            : `<p class="dim">Bu türü henüz yakalamadın. İpucu: ${esc(REGION[f.home_region].name)} sularında yaşar. Güç ${f.power}.</p>`}`
        };
      }
      const n = discovered();
      const html = REGIONS.map(r => `<h4>${esc(r.name)} <span class="dim">${r.fish_ids.filter(f => S.ency[f] && S.ency[f].caught).length}/${r.fish_ids.length}</span></h4><div class="ency">${r.fish_ids.map(f => { const k = S.ency[f] && S.ency[f].caught; return `<button class="ecard ${k ? '' : 'lock'}" data-a="ency" data-id="${f}">${fishImg(f, 1)}<span>${k ? esc(FISH[f].name_tr) : '???'}</span>${k ? `<i>×${S.ency[f].caught}</i>` : ''}</button>`; }).join('')}</div>`).join('');
      return { title: 'Balık Ansiklopedisi', icon: 'book', html: `<div class="evbox">Keşif: <b>${n}/${FISH_LIST.length}</b> tür</div>${html}`, cls: 'wide' };
    },
    Achievements() {
      const cats = [...new Set(ACHS.map(a => a.category))]; const n = Object.keys(S.ach).length;
      const html = `<div class="evbox">${img('trophy', 1, 'ic')} Açılan: <b>${n}/${ACHS.length}</b></div>` + cats.map(c => `<h4>${esc(c)}</h4>` + ACHS.filter(a => a.category === c).map(a => { const p = Ach.progress(a.id); const rw = ACH_REWARD[a.id]; return `<div class="row ach ${p.done ? 'done' : ''}">${img(p.done ? 'trophy' : 'lock', 2)}<div class="grow"><b>${esc(a.name)}</b> <span class="dim small">${esc(a.condition_tr)}</span>${rw ? `<div class="small">Ödül: ${esc(rw.name)}</div>` : ''}<div class="bar"><i style="width:${p.v / p.t * 100}%"></i><span>${fmt(p.v)}/${fmt(p.t)}</span></div></div>${p.done ? `<span class="ok small">Gün ${S.ach[a.id]}</span>` : ''}</div>`; }).join('')).join('');
      return { title: 'Başarımlar', icon: 'trophy', html, cls: 'wide' };
    },
    Statistics() {
      const s = S.stats; const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
      const html = `<div class="grid3">${kv('Gün', S.day + ' (Yıl ' + World.year() + ', ' + SEASON_TR[World.season()] + ')')}${kv('Tamamlanan gün', s.daysCompleted)}${kv('Para', fmt(S.cash))}
        ${kv('Manuel atış', s.manualCasts)}${kv('Manuel av', s.manualCatches)}${kv('Otomatik av', s.autoCatches)}${kv('Otomatik deneme', s.autoAttempts)}${kv('Vurmayan', s.noBite)}${kv('Kaçırılan vuruş', s.missed)}${kv('Kopan misina', s.lineBreaks)}${kv('Kaçan balık', s.escapes)}${kv('Serbest bırakılan', s.released)}${kv('İptal edilen atış', s.cancels)}
        ${kv('Toplam satış', fmt(s.totalSales))}${kv('Hal satışı', fmt(s.marketSales))}${kv('İlan satışı', fmt(s.orderSales))}${kv('İlana teslim', s.ordersDelivered + ' balık')}${kv('Harcama', fmt(s.spent))}${kv('Yakıt', fmt(s.fuelSpent))}${kv('Kullanılan yem', s.baitUsed)}
        ${kv('Keşfedilen tür', discovered() + '/' + FISH_LIST.length)}${kv('Rekor geliştirme', s.records)}${kv('En büyük balık', s.biggestId ? FISH[s.biggestId].name_tr + ' ' + s.biggestCm + ' cm' : '—')}${kv('Seferler', s.trips)}${kv('Ziyaret edilen bölge', Object.keys(s.regionsVisited).length + '/7')}${kv('Av noktası', Object.keys(s.spotsVisited).length + '/21')}${kv('Tekneler', S.boats.owned.length + '/4')}${kv('Başarımlar', Object.keys(S.ach).length + '/' + ACHS.length)}${kv('Yaşanan mevsim', Object.keys(S.world.seasonsSeen).length + '/4')}</div>
        <div class="btns left"><button class="btn" data-a="openPanel" data-p="Encyclopedia">${img('book', 1, 'ic')} Ansiklopedi</button><button class="btn" data-a="openPanel" data-p="Achievements">${img('trophy', 1, 'ic')} Başarımlar</button></div>`;
      return { title: 'İstatistikler', icon: 'chart', html, cls: 'wide' };
    },
    Settings() {
      const sl = (k, n) => `<div class="kv slider"><span>${n}</span><input type="range" min="0" max="1" step="0.05" value="${SETTINGS[k]}" data-set="${k}"></div>`;
      const tg = (k, n, d) => `<label class="kv tg"><input type="checkbox" data-set="${k}" ${SETTINGS[k] ? 'checked' : ''}><span>${n}</span><small class="dim">${d}</small></label>`;
      const inGame = !!S && Game.sceneName !== 'MainMenu';
      const html = `<h4>Ses</h4>${sl('music', 'Müzik')}${sl('sfx', 'Efektler')}${sl('amb', 'Ortam sesi')}${tg('mute', 'Tüm sesleri kapat', '')}
        <h4>Erişilebilirlik</h4>${tg('comfort', 'Rahat mod', 'Tasma penceresi 1,5× uzar, gerilim toleransı artar')}${tg('reduced', 'Azaltılmış animasyon', 'Yağmur/rüzgâr parçacıklarını kapatır')}
        <h4>Ekran</h4><div class="btns left"><button class="btn" data-a="fullscreen">${img('fullscreen', 1, 'ic')} Tam ekran / yatay kilit</button></div>
        <h4>Kayıt</h4><div class="btns left">${inGame ? '<button class="btn" data-a="exportOpen">Dışa Aktar (JSON)</button>' : ''}<button class="btn" data-a="importOpen">İçe Aktar</button>${inGame ? '<button class="btn" data-a="restoreBackup">Son gün yedeğine dön</button>' : ''}</div>
        <p class="dim small">Depolama: ${Save.db ? 'IndexedDB' : 'yalnızca localStorage'}${Save.storageOk ? '' : ' (tarayıcı kaydı engelliyor — dışa aktarmayı kullan)'}.</p>
        ${inGame ? `<h4>Öğretici</h4><div class="btns left"><button class="btn" data-a="${S.tutorial.skipped ? 'unskipTut' : 'skipTut'}">${S.tutorial.skipped ? 'Öğretici ipuçlarını aç' : 'Öğreticiyi atla'}</button></div>` : ''}`;
      return { title: 'Ayarlar', icon: 'gear', html };
    },
    Help() {
      const html = `<h4>Temel döngü</h4><p>Her gün 100 enerjin var. Her geçerli olta atışı oltanın enerji maliyeti kadar harcar (Eski Bambu: 8 → 12 atış). Gün içinde saat yoktur; evde uyuyunca yeni gün başlar ve enerji yenilenir.</p>
        <h4>Olta atma</h4><p><b>OLTA AT</b> düğmesine basılı tut (≈1,2 sn güç çubuğu) ve bırak: %0–35 yakın, %36–70 orta, %71–100 uzak. Parmağını düğmeden kaydırırsan atış ücretsiz iptal olur. Şamandıra dalınca 1,6 saniye içinde <b>ÇEK!</b>'e dokun.</p>
        <h4>Mücadele</h4><p>Küçük (güç 1) balıklar basılı tutarak hızlıca sarılır. Güç 2–5 balıklarda <b>basılı tut</b> = makara sarar ve gerilim artar; <b>bırak</b> = gerilim düşer. Yeşil bölgede (30–75) kal. 95 üstünde 1,2 sn kalırsa misina kopar, 10 altında 1,2 sn kalırsa balık kaçar. Güçlü balıklar "ANİ ÇEKİŞ" uyarısından sonra çeker — o anda bırak!</p>
        <h4>Ticaret</h4><p>Balık fiyatı türe göre sabittir; boy fiyatı değiştirmez. Nihat'ın hali her balığı alır. Panodaki ilanlar daha iyi fiyat verir ve kısmi teslim kabul eder: 100 isteyen alıcıya 3 balık satabilirsin.</p>
        <h4>Tekneler ve bölgeler</h4><p>Bora'dan tekne al, limandan haritaya çık. Sefer bedeli ödenir, dönüş ücretsiz. Motor/navigasyon yükseltmeleri yeni bölgeleri açar. Her bölgede 3 av noktası var; ◀ ▶ ile tekneyi sür.</p>
        <h4>Otomatik oltalar</h4><p>Teknede, manuel atışların eşliğinde deneme yapar, ücretli yem harcar ve günde toplam en çok 6 balık yakalar. Güç 5 balıklar hep manueldir.</p>
        <h4>Balıkla mücadele</h4><p><b>Mükemmel tasma:</b> şamandıra dalar dalmaz (ilk 0,45 sn) dokunursan avantajlı başlarsın. <b>Yön:</b> balık sola/sağa çekerken ◀ ▶ ile oltayı ters yöne yatır; doğru yön hızlandırır, yanlış yön yavaşlatır. <b>Zıplama:</b> zıplayan türler sudan fırlarken düğmeyi bırak, “Usta Hamle” kazan. <b>Ustalık:</b> ideal bölgede sararken kombo yıldızları dolar ve çekiş hızlanır. <b>Yorgunluk:</b> dayanıklılık çubuğu bitince balık yorulur; hızla sar! Küçük balıkları art arda dokunarak hızlıca sarabilirsin.</p><h4>Şenlikler</h4><p>Her mevsimin 14–15. günleri kasabada şenlik olur. Şenlik Meydanı'nda Muhtar Hasan'a kaydolup iskelede 8 atışlık yarışmaya katıl (enerji harcamaz). İlk üçe girersen kupa ve para ödülü kazanırsın; kupaların evindeki Kupa Dolabı'nda sergilenir.</p><h4>Kontroller</h4><p>Dokunmatik: düğmeler, binalara dokunarak yürüme. Klavye: ←/→ veya A/D yürü/sür, Boşluk olta at/çek, E veya Enter etkileşim, I envanter, Esc kapat/iptal, 1/2/3 teknede av noktası.</p><h4>İpuçları</h4><p>Şamandıralara dokunarak tekneyi o noktaya sürebilirsin. Navigasyon yükseltmesi av noktasındaki en olası türleri (II. seviyede yüzdeleriyle) gösterir. Ücretli yem bitince oyun otomatik olarak ücretsiz temel yeme geçer.</p>`;
      return { title: 'Nasıl Oynanır', icon: 'help', html };
    },
    Dialog(a) {
      const npc = a.npc; const L = NPCDialog.line(npc); Save.soon(); const tip = npc === 'efe' ? NPCDialog.tip() : '';
      return { title: NPCS[npc].name, icon: 'help', html: `<div class="npc big"><img class="pix portrait" src="${portraitUrl(NPCS[npc].look, 3)}" alt=""><div><b>${NPCS[npc].name}</b> <span class="dim">· ${NPCS[npc].role}</span><p>“${esc(L.text)}”</p>${tip ? `<p class="evbox">${img('upg_navigation', 1, 'ic')} ${esc(tip)}</p>` : ''}</div></div><div class="btns"><button class="btn g" data-a="closePanel">Teşekkürler</button></div>` };
    },
    Wardrobe() {
      const L = S.player; const prev = Atlas.url('p:' + lookKey(L) + ':idle0', () => personPB(L, 'idle0'), 5);
      const item = (kind, it, cur) => { const own = (kind === 'outfit' ? S.wardrobe.outfits : S.wardrobe.hats).includes(it.id); return `<button class="opt ${cur === it.id ? 'on' : ''} ${own ? '' : 'lock'}" data-a="${own ? 'wear' : 'noop'}" data-k="${kind}" data-id="${it.id}"><b>${esc(it.name)}</b><small>${own ? (cur === it.id ? 'Giyili' : 'Giy') : it.price ? 'Selin\'in butiğinde · ' + fmt(it.price) : it.fest ? 'Şenlik standında: ' + esc(FEST[it.fest].name) : 'Kilit: ' + esc(it.unlockTr || '')}</small></button>`; };
      const ch = (k, arr, lab) => `<h4>${lab}</h4><div class="opts">${arr.map((n, i) => `<button class="${L[k] === i ? 'on' : ''}" data-a="look" data-k="${k}" data-v="${i}">${esc(n)}</button>`).join('')}</div>`;
      const sw = (k, arr, lab) => `<h4>${lab}</h4><div class="opts">${arr.map((c, i) => `<button class="sw ${L[k] === i ? 'on' : ''}" style="background:${c}" data-a="look" data-k="${k}" data-v="${i}"></button>`).join('')}</div>`;
      return { title: 'Gardırop', icon: 'wardrobe', cls: 'wide', html: `<div class="wardrobe"><img class="pix" src="${prev}" alt=""><div class="grow"><h4>Kıyafetler</h4><div class="optgrid">${OUTFITS.map(o => item('outfit', o, L.outfit)).join('')}</div><h4>Şapkalar</h4><div class="optgrid">${HATS.map(o => item('hat', o, L.hat)).join('')}</div>${ch('hair', HAIR_STYLES, 'Saç modeli')}${sw('hairColor', HAIR_COLORS.map(c => c[0]), 'Saç rengi')}${sw('skin', SKINS.map(c => c[0]), 'Ten')}${ch('body', BODY_TYPES, 'Beden')}</div></div><p class="dim small">Kıyafetler yalnızca görseldir; av gücü vermez.</p>` };
    },
    Decor() {
      const html = Object.entries(DECOR_SLOTS).map(([slot, nm]) => { const cur = S.home.decor[slot]; return `<h4>${esc(nm)} ${cur ? '· ' + esc(DECOR_BY[cur].name) : '<span class="dim">· boş</span>'}</h4><div class="optgrid">${DECOR.filter(d => d.slot === slot).map(d => { const own = S.home.owned.includes(d.id); return `<button class="opt ${cur === d.id ? 'on' : ''} ${own ? '' : 'lock'}" data-a="${own ? 'placeDecor' : 'noop'}" data-s="${slot}" data-id="${d.id}">${img('decor_' + d.id, 2)}<b>${esc(d.name)}</b><small>${own ? (cur === d.id ? 'Yerleşik (kaldır)' : 'Yerleştir') : d.price ? 'Kerem\'in dükkânında · ' + fmt(d.price) : d.unlockTr ? esc(d.unlockTr) : 'Başarım: ' + esc((ACHS.find(a => a.id === d.ach) || {}).name || '')}</small></button>`; }).join('')}</div>`; }).join('');
      return { title: 'Ev Dekorasyonu', icon: 'decor', cls: 'wide', html: `<div class="evbox">Yerleşik eşya: ${Object.values(S.home.decor).filter(Boolean).length}/5 · Sandık: ${Inv.cap('chest')} yuva ${INVC.home_chest[S.chestLevel + 1] ? '<span class="dim">· büyütmek için Kerem\'in Ev Eşyaları</span>' : ''}</div>${html}` };
    },
    Bakery() {
      const cur = Shop.snackToday();
      const html = `${cur ? `<div class="evbox">${img('snack_' + cur.id, 2)} Bugün: <b>${esc(cur.name)}</b> — ${esc(cur.desc)}</div>` : '<div class="evbox">Günde bir atıştırmalık alabilirsin; etkisi o gün boyunca sürer.</div>'}` + SNACKS.map(sn => `<div class="row">${img('snack_' + sn.id, 2)}<div class="grow"><b>${esc(sn.name)}</b><div class="dim small">${esc(sn.desc)}</div></div>${cur && cur.id === sn.id ? '<span class="ok">Afiyet olsun</span>' : `<button class="btn g sm" data-a="buySnack" data-id="${sn.id}" ${cur || S.cash < sn.price ? 'disabled' : ''}>Al ${coin(sn.price)}</button>`}</div>`).join('') + '<p class="dim small">Atıştırmalıklar enerji vermez; yalnızca o günkü mücadeleyi biraz kolaylaştırır.</p>';
      return { title: 'Fatma Teyze\'nin Fırını', icon: 'bakery', npc: 'fatma', html };
    },
    Boutique() {
      const L = S.player; const fe = World.festival();
      const prev = (kind, it) => { const look = Object.assign({}, L, kind === 'outfit' ? { outfit: it.id } : { hat: it.id }); return Atlas.url('p:' + lookKey(look) + ':idle0', () => personPB(look, 'idle0'), 2); };
      const row = (kind, it) => { const own = (kind === 'outfit' ? S.wardrobe.outfits : S.wardrobe.hats).includes(it.id); const worn = (kind === 'outfit' ? L.outfit : L.hat) === it.id; return `<div class="opt ${worn ? 'on' : ''}"><img class="pix" src="${prev(kind, it)}" alt=""><b>${esc(it.name)}</b>${own ? (worn ? '<small class="ok">Giyili</small>' : `<button class="btn sm" data-a="wear" data-k="${kind}" data-id="${it.id}">Giy</button>`) : `<button class="btn g sm" data-a="buyCos" data-k="${kind}" data-id="${it.id}" ${S.cash < it.price ? 'disabled' : ''}>${coin(it.price)}</button>`}</div>`; };
      let html = '';
      if (fe) { const st = fe.stall; const it = (st.kind === 'hat' ? HATS : OUTFITS).find(x => x.id === st.id); const own = (st.kind === 'hat' ? S.wardrobe.hats : S.wardrobe.outfits).includes(st.id); html += `<div class="evbox">${img('festival', 2)} <b>${esc(fe.name)} standı:</b> ${esc(it.name)} — yalnızca şenlik günlerinde! ${own ? '<span class="ok">Sahipsin</span>' : `<button class="btn g sm" data-a="buyFest" ${S.cash < st.price ? 'disabled' : ''}>Al ${coin(st.price)}</button>`}</div>`; }
      html += `<h4>Kıyafetler</h4><div class="optgrid">${OUTFITS.filter(o => o.price).map(o => row('outfit', o)).join('')}</div><h4>Şapkalar</h4><div class="optgrid">${HATS.filter(o => o.price).map(o => row('hat', o)).join('')}</div><p class="dim small">Önizlemeler senin karakterinle gösterilir. Kıyafetler yalnızca görseldir. Şenlik ürünleri şenlik günlerinde standa gelir.</p>`;
      return { title: 'Selin\'in Butiği', icon: 'boutique', npc: 'selin', html, cls: 'wide' };
    },
    HomeGoods() {
      const nx = INVC.home_chest[S.chestLevel + 1];
      let html = `<div class="row">${img('chestUp', 2)}<div class="grow"><b>Ev sandığı</b><div class="dim small">Şu an ${Inv.cap('chest')} yuva</div></div>${nx ? `<button class="btn g sm" data-a="buyChest" ${S.cash < nx[2] ? 'disabled' : ''}>${nx[1]} yuvaya büyüt ${coin(nx[2])}</button>` : '<span class="ok">En büyük</span>'}</div>`;
      html += Object.entries(DECOR_SLOTS).map(([slot, nm]) => `<h4>${esc(nm)}</h4><div class="optgrid">${DECOR.filter(d => d.slot === slot && d.price).map(d => { const own = S.home.owned.includes(d.id); return `<div class="opt">${img('decor_' + d.id, 2)}<b>${esc(d.name)}</b>${own ? '<small class="ok">Sahipsin · evde yerleştir</small>' : `<button class="btn g sm" data-a="buyDecor" data-id="${d.id}" ${S.cash < d.price ? 'disabled' : ''}>${coin(d.price)}</button>`}</div>`; }).join('')}</div>`).join('');
      return { title: 'Kerem\'in Ev Eşyaları', icon: 'homegoods', npc: 'kerem', html: html + '<p class="dim small">Aldığın eşyaları evdeki Dekor menüsünden yerleştirebilirsin.</p>', cls: 'wide' };
    },
    Teahouse() {
      const fid = Tea.special(), f = FISH[fid], src = Market.sources(!!this.sel.tChest), have = Inv.count(src, fid), left = Tea.left(), mx = Math.min(have, left); const q = clamp(this.qty.tea || mx, mx ? 1 : 0, mx);
      const nf = World.nextFestival();
      const html = `<div class="evbox">${img('teahouse', 2)} <b>Günün balığı:</b> ${fishImg(fid, 1, 'mini')} <b>${esc(f.name_tr)}</b> · ${coin(Tea.price(fid))}/adet <span class="dim">(hal ${fmt(f.base_price)})</span> · bugün kalan alım: <b>${left}</b></div>
        <div class="row"><span class="grow">Elinde: <b>${have}</b> <label class="small"><input type="checkbox" data-chk="tChest" ${this.sel.tChest ? 'checked' : ''}> sandığı dahil et</label></span>${mx ? `<div class="step"><button data-a="qty" data-k="tea" data-d="-1" data-max="${mx}">−</button><b>${q}</b><button data-a="qty" data-k="tea" data-d="1" data-max="${mx}">+</button></div><button class="btn g sm" data-a="teaSell" data-n="${q}">Sat ${coin(q * Tea.price(fid))}</button>` : '<span class="dim">Satılacak yok</span>'}</div>
        <h4>Masalardaki sohbet</h4><p>${img('upg_navigation', 1, 'ic')} ${esc(NPCDialog.tip())}</p>${nf ? `<p>${img('festival', 1, 'ic')} ${nf.inDays ? esc(nf.f.name) + ' ' + nf.inDays + ' gün sonra (' + SEASON_TR[nf.f.season] + ' ' + nf.f.days[0] + '. gün): ' + esc(nf.f.comp_name) : esc(nf.f.name) + ' bugün! Meydana uğra.'}</p>` : ''}<p class="dim small">Halil Usta her gün tek bir türü günde ${Tea.cfg.daily_special_qty} adede kadar taban fiyatın ${String(Tea.cfg.daily_special_multiplier).replace('.', ',')} katına alır.</p>`;
      return { title: 'Halil Usta\'nın Çay Bahçesi', icon: 'teahouse', npc: 'halil', html };
    },
    Square() {
      const fe = World.festival(); let html = '';
      if (fe) {
        const ent = Comp.entered(fe), res = S.fest[festKey(fe)], act = Comp.active(); const pz = Comp.prizes(World.year());
        html += `<div class="evbox">${img('festival', 2)} <b>${esc(fe.name)}</b> bugün! · <b>${esc(fe.comp_name)}</b><br>${esc(fe.rule)} · ${COMP.casts} atış · enerji harcamaz · İskele'de yapılır</div>
          <div class="grid3"><div class="kv">${img('cup_1', 1, 'ic')}<span>1.</span><b>${coin(pz[0])}</b></div><div class="kv">${img('cup_2', 1, 'ic')}<span>2.</span><b>${coin(pz[1])}</b></div><div class="kv">${img('cup_3', 1, 'ic')}<span>3.</span><b>${coin(pz[2])}</b></div></div>
          <h4>Rakipler</h4><div class="grid3">${RIVALS.map(r => `<div class="kv"><span>${esc(r.name)}</span><b class="lv">${'★'.repeat(Math.round(r.skill * 5))}</b></div>`).join('')}</div>
          <div class="btns">${act ? '<button class="btn g big" data-a="compGo">Yarışmaya Dön</button>' : ent ? `<span class="ok">Katıldın${res && res.place ? ' · ' + res.place + '. oldun' : ''}</span>` : '<button class="btn g big" data-a="compStart">Kaydol ve Yarış</button>'}</div>`;
      } else {
        const nf = World.nextFestival(); html += `<div class="evbox">${img('festival', 2)} Bir sonraki şenlik: <b>${esc(nf.f.name)}</b> — ${nf.inDays} gün sonra (${SEASON_TR[nf.f.season]} ${nf.f.days[0]}–${nf.f.days[1]}. günler)</div>`;
      }
      html += `<h4>Şenlik takvimi</h4>${FESTIVALS.map(f => { const r = S.fest[f.id + ':' + World.year()]; return `<div class="row">${img(f.season, 2)}<div class="grow"><b>${esc(f.name)}</b> <span class="dim">· ${SEASON_TR[f.season]} ${f.days.join('–')}. gün</span><div class="small">${esc(f.comp_name)}: ${esc(f.rule)}</div></div>${r && r.place ? img('cup_' + Math.min(3, r.place), 2) + `<span class="small">${r.place}.</span>` : ''}</div>`; }).join('')}`;
      html += `<p class="dim small">Kupaların: ${S.trophies.length} · Şenlik standındaki özel ürünler Selin'in butiğinde, yalnızca şenlik günlerinde satılır.</p>`;
      return { title: 'Şenlik Meydanı', icon: 'square', npc: 'hasan', html, cls: 'wide' };
    },
    Trophies() {
      const t = S.trophies.slice().sort((a, b) => a.place - b.place || b.year - a.year);
      const html = (t.length ? `<div class="tiles">${t.map(x => { const f = FEST[x.fest]; return `<div class="btn tile">${img('cup_' + x.place, 3)}<span><b>${x.place}.</b> ${esc(f.name)}</span><small class="dim">Yıl ${x.year} · ${esc(Comp.fmt(f.comp, x.score))}</small></div>`; }).join('')}</div>` : '<p class="dim">Henüz kupan yok. Her mevsimin 14–15. günlerinde Şenlik Meydanı\'ndaki yarışmalara katıl!</p>') + `<div class="btns left"><button class="btn" data-a="openPanel" data-p="Achievements">${img('trophy', 1, 'ic')} Başarımlar</button></div>`;
      return { title: 'Kupa Dolabı', icon: 'cup_1', html, cls: 'wide' };
    },
    Debug() { return { title: 'QA / Test Paneli', icon: 'gear', html: QA.panelHtml(), cls: 'wide' }; }
  },
  loadoutHtml() {
    if (!Object.keys(S.auto.devices).length) return '<h4>Donanım</h4><p class="dim">Henüz otomatik olta cihazın yok.</p>';
    let h = '<h4>Donanım yerleşimi</h4>';
    for (const d of Auto.DEV) {
      const dv = S.auto.devices[d]; if (!dv) continue;
      const btns = S.boats.owned.filter(b => b !== dv.boat).map(b => `<button class="btn sm" data-a="mount" data-d="${d}" data-b="${b}" ${Auto.slotsFree(b) > 0 ? '' : 'disabled'}>→ ${esc(BOAT[b].name)} (${Auto.slotsFree(b)} boş)</button>`).join('');
      h += `<div class="row">${img(d, 2)}<div class="grow"><b>${esc(AUTO[d].name)}</b><div class="dim small">${dv.boat ? 'Takılı: ' + esc(BOAT[dv.boat].name) : 'Depoda (takılı değil)'} · sayaç ${dv.counter}/${Auto.every()}${dv.paused ? ' · beklemede: ' + esc(Auto.reasonTr[dv.paused]) : ''}</div></div><div class="btns">${btns}${dv.boat ? `<button class="btn sm r" data-a="unmount" data-d="${d}">Sök</button>` : ''}</div></div>`;
    }
    h += `<div class="small dim">Yuvalar: ${S.boats.owned.map(b => esc(BOAT[b].name) + ' ' + Auto.mountedOn(b).length + '/' + BOAT[b].slots).join(' · ')}</div>`;
    return h;
  },
  /* ================= EYLEMLER ================= */
  A: {
    noop() { },
    closePanel() { this.closePanel(); },
    openPanel(d) { this.openPanel(d.p); },
    tab(d) { this.tab[d.t] = d.v; this.sel.slot = null; this.renderPanel(); },
    mOk() { const f = this._onOk; this.closeModal(); if (f) f(); this.refresh(); },
    mCancel() { const f = this._onCancel; this.closeModal(); if (f) f(); },
    fullscreen() { toggleFullscreen(); },
    showEvent() { const e = World.event(); if (e) this.confirm({ title: e.name, icon: 'event', text: World.eventText(e) + '. Olaya katılmak zorunlu değil.', ok: 'Tamam', cancel: 'Kapat' }); },
    skipTut() { S.tutorial.skipped = true; Save.soon(); this.refresh(); },
    unskipTut() { S.tutorial.skipped = false; Save.soon(); this.refresh(); },
    interact() { if (Game.scene.interact) Game.scene.interact(); },
    homeAct(d) { Game.scene.act(d.id); },
    continue() { startFromSave(); },
    newGame() { if (this._hasSave) this.confirm({ title: 'Yeni oyun', danger: true, text: 'Mevcut kaydın yerine yeni bir oyun başlayacak. Eski kayıt "önceki kayıt" olarak bir kez yedeklenir. Emin misin?', ok: 'Yeni oyun başlat', onOk: () => go('CharacterCreator', {}) }); else go('CharacterCreator', {}); },
    toMenu() { go('MainMenu'); },
    cc(d) { const cc = Game.scenes.CharacterCreator; cc.look[d.k] = (d.k === 'outfit' || d.k === 'hat') ? d.v : +d.v; this.charCreator(cc); },
    startGame() { const cc = Game.scenes.CharacterCreator; const nm = (cc.look.name || '').trim() || 'Balıkçı'; cc.look.name = nm.slice(0, 14); beginNewGame(cc.look); },
    saveQuit() { Save.now(); this.closePanel(true); checkSaveAndMenu(); },
    // envanter
    slotSel(d) { const k = d.k + ':' + d.i; this.sel.slot = this.sel.slot === k ? null : k; this.renderPanel(true); },
    invRight(d) { this.sel.invRight = d.k; this.sel.slot = null; this.renderPanel(true); },
    moveAll(d) { const r = Inv.transferAll(d.f, d.t); if (!r.ok) this.toastNow(r.msg, 'warn'); else this.toastNow(r.n + ' balık aktarıldı.', 'good', 'transfer'); this.sel.slot = null; },
    moveOne(d) { const r = Inv.transfer(d.k, d.to, d.f, +d.n); if (!r.ok) this.toastNow(r.msg, 'warn'); this.sel.slot = null; },
    fav(d) { S.favorites[d.f] = !S.favorites[d.f]; if (!S.favorites[d.f]) delete S.favorites[d.f]; Save.soon(); this.refresh(); },
    releaseStack(d) { const a = Inv.arr(d.k)[+d.i]; if (!a) return; this.confirm({ title: 'Serbest bırak', danger: true, icon: 'release', text: a.q + ' × ' + FISH[a.f].name_tr + ' denize bırakılacak. Bu işlem geri alınamaz.', ok: 'Serbest bırak', onOk: () => { Inv.releaseStack(d.k, +d.i); this.sel.slot = null; } }); },
    setBait(d) { if (!Shop.setBait(d.id)) this.toastNow('Bu yemden stok yok.', 'warn'); },
    baitPick() {
      if (Fishing.phase !== 'READY') return;
      this.showModal(`<h3>${img('bait_' + S.gear.bait, 2)} Yem seç</h3><div class="grid3">${BAITS.map(b => `<button class="kv btnlike ${S.gear.bait === b.id ? 'on' : ''}" data-a="baitSet" data-id="${b.id}" ${b.id === 'basic' || S.baitStock[b.id] ? '' : 'disabled'}>${img('bait_' + b.id, 2)}<span>${esc(b.name)}<small class="dim"> ${esc(BAIT_HINT[b.id])}</small></span><b>${b.id === 'basic' ? '∞' : S.baitStock[b.id]}</b></button>`).join('')}</div><p class="dim small">Yem satın almak için Zeynep'in dükkânına uğra.</p><div class="btns"><button class="btn" data-a="mCancel">Kapat</button></div>`);
    },
    baitSet(d) { Shop.setBait(d.id); this.closeModal(); this.refresh(); },
    qty(d) { const mx = +d.max; const cur = this.qty[d.k] || mx; const v = d.d === '999' ? mx : clamp(cur + (+d.d), 1, mx); this.qty[d.k] = v; this.renderPanel(true); },
    mSell(d) {
      const f = d.f, n = +d.n; const bo = Market.betterOffer(f); const src = Market.sources(!!this.sel.mChest);
      const doit = () => { const r = Market.sell(f, n, src); if (r.ok) { this.toastNow(r.n + ' × ' + FISH[f].name_tr + ' satıldı: +' + fmt(r.income), 'good', 'coin'); delete this.qty['m' + f]; } else this.toastNow(r.msg, 'warn'); };
      if (bo) this.confirm({ title: 'Daha iyi teklif var', icon: 'event', html: `<p><b>${esc(CUST[bo.customerId].name)}</b> bu türe ilan panosunda <b>${fmt(bo.unitPrice)}</b>/adet veriyor (hal: ${fmt(FISH[f].base_price)}). Yine de hale satmak istiyor musun?</p>`, ok: 'Yine de sat', onOk: doit });
      else doit();
    },
    mSellAll() {
      const src = Market.sources(!!this.sel.mChest); const plan = Market.sellAllPlan(src, false); const tot = sum(plan.map(p => p.income)); const better = plan.filter(p => p.better);
      this.confirm({ title: 'Tüm uygun balıkları sat', icon: 'market', html: `<p>${plan.reduce((a, p) => a + p.n, 0)} balık (favoriler hariç) → <b>${fmt(tot)}</b></p>${better.length ? `<div class="warn">İlanda daha iyi fiyat olan türler: ${better.map(p => esc(FISH[p.f].name_tr) + ' (' + fmt(p.better.unitPrice) + ')').join(', ')}</div>` : ''}${Object.keys(S.favorites).length ? '<p class="dim small">★ Favori türler korunur.</p>' : ''}`, ok: 'Hepsini Sat', onOk: () => { const r = Market.sellAll(src, false); if (r.ok) this.toastNow(r.n + ' balık satıldı: +' + fmt(r.income), 'good', 'coin'); else this.toastNow(r.msg, 'warn'); } });
    },
    oDeliver(d) { const src = Market.sources(!!this.sel.oChest); const r = Orders.deliver(d.id, +d.n, src); if (r.ok) { this.toastNow(r.n + ' balık teslim edildi: +' + fmt(r.income), 'good', 'order'); delete this.qty['o' + d.id]; this.npcLines['bahar:Orders'] && (this.npcLines['bahar:Orders'].fresh = true); } else this.toastNow(r.msg, 'warn'); },
    // dükkân
    buyGear(d) { const it = GEAR[d.k].find(x => x.id === d.id); this.buy(it.name, d.k + '_' + it.id, it.price, GEAR_TR[d.k] + ' satın alınıp hemen kullanılacak.', () => Shop.buyGear(d.k, d.id)); },
    equip(d) { Shop.equip(d.k, d.id); },
    buyBait(d) { const q = +d.q, c = Shop.baitCost(d.id, q); this.buy(q + ' × ' + BAIT[d.id].name, 'bait_' + d.id, c, BAIT_HINT[d.id], () => Shop.buyBait(d.id, q)); },
    buyBag() { const t = INVC.bag[S.bagLevel + 1]; this.buy('Çanta (' + t[1] + ' yuva)', 'bagUp', t[2], 'Sırt çantan ' + t[1] + ' balık yuvasına çıkar.', () => Shop.buyBag()); },
    buyChest() { const t = INVC.home_chest[S.chestLevel + 1]; this.buy('Sandık (' + t[1] + ' yuva)', 'chestUp', t[2], 'Ev sandığın ' + t[1] + ' yuvaya çıkar.', () => Shop.buyChest()); },
    // tekne
    buyBoat(d) { const b = BOAT[d.id]; this.buy(b.name, 'boat', b.price, 'Yeni tekne limana bağlanacak. ' + (S.boats.active ? 'Aktif tekne değişmez; istersen "Aktif Yap" ile seçebilirsin.' : 'İlk teknen hemen aktif olur.'), () => Boats.buy(d.id)); },
    setActive(d) { Boats.setActive(d.id); const devs = Auto.DEV.filter(x => S.auto.devices[x] && S.auto.devices[x].boat && S.auto.devices[x].boat !== d.id); if (devs.length && Auto.slotsFree(d.id) > 0) this.confirm({ title: 'Cihazları aktar?', icon: 'auto1', text: 'Otomatik olta cihazların başka teknede takılı. Yeni aktif tekneye aktarmak ister misin? (Ücretsiz; cihaz eski tekneden sökülür.)', ok: 'Aktar', onOk: () => { for (const x of devs) if (Auto.slotsFree(d.id) > 0) Auto.mount(x, d.id); } }); },
    yardBoat(d) { this.sel.yardBoat = d.id; this.renderPanel(true); },
    buyUp(d) { const u = BOAT_INFO[d.id].ups.find(x => x.key === d.k); this.buy(BOAT[d.id].name + ': ' + UPG_TR[u.type] + ' ' + (u.type === 'storage' ? u.val : ROMAN_S[u.val]), 'upg_' + u.type, u.price, 'Yükseltme bu teknenin üzerinde kalır.', () => Boats.buyUpgrade(d.id, d.k)); },
    buyAuto(d) { const a = AUTO[d.id]; this.buy(a.name, a.id, a.price, a.type === 'device' ? 'Cihaz boş yuva varsa aktif tekneye takılır.' : 'Global yükseltme tüm cihazlara uygulanır.', () => Auto.buy(d.id)); },
    mount(d) { const r = Auto.mount(d.d, d.b); if (!r.ok && r.msg) this.toastNow(r.msg, 'warn'); },
    unmount(d) { Auto.unmount(d.d); },
    boatColor(d) { const b = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : S.boats.active; Boats.setColor(b, d.id); },
    buyColor(d) { const c = BOAT_COLORS.find(x => x.id === d.id); this.buy(c.name + ' boya', 'bc_' + c.id, c.price, 'Renk tüm teknelerinde kullanılabilir.', () => Shop.buyCosmetic('boatColor', d.id)); },
    boatName() { const b = this.sel.yardBoat && Boats.owned(this.sel.yardBoat) ? this.sel.yardBoat : S.boats.active; Boats.setName(b, $('boatName').value); this.toastNow('İsim levhası güncellendi.', 'good', 'nameplate'); },
    cycleBoat() { const o = S.boats.owned; const i = o.indexOf(S.boats.active); Boats.setActive(o[(i + 1) % o.length]); },
    // harita / balıkçılık
    mapBack() { go('Town', { at: 'harbor' }); },
    depart() { Game.scene.depart(); },
    mapSkip() { Game.scene.skip(); },
    backTown() { if (Fishing.locked()) return; if (Comp.active()) { this.confirm({ title: 'Yarışmadan çık?', danger: true, icon: 'festival', text: 'Kalan ' + S.comp.castsLeft + ' atış hakkın yanacak ve sıralaman şu anki puanınla belirlenecek.', ok: 'Yarışmayı bitir', onOk: () => { Comp.leave(); this.showCompResult(); } }); return; } go('Town', { at: 'pier' }); },
    backHarbor() { if (Fishing.locked()) return; this.confirm({ title: 'Limana dön', icon: 'anchor', text: 'Limana dönüş ücretsiz. Tekrar denize çıkmak için yeni sefer bedeli ödenir.', ok: 'Limana Dön', onOk: () => go('Town', { at: 'harbor' }) }); },
    pierSpot(d) { Game.scene.switchSpot(+d.d); },
    goSpot(d) { Game.scene.goSpot(+d.i); },
    giveUp() { Fishing.giveUp(); this.fishBarUpdate(); },
    catchClose() { this.closeModal(); Fishing.resultClosed(); this.fishBarUpdate(); },
    catchRelease() { this.confirm({ title: 'Serbest bırak', icon: 'release', text: FISH[S.pendingCatch.fid].name_tr + ' denize geri bırakılacak (yakalama ve ansiklopedi kaydı korunur).', ok: 'Bırak', onOk: () => { Fishing.resolveStorage('release'); this.fishBarUpdate(); }, onCancel: () => this.showCatch(S.pendingCatch, true) }); },
    catchSwap() { const el = $('swapList'); if (el) el.style.display = ''; },
    swapPick(d) { const s = Inv.arr(d.k)[+d.i]; const pc = S.pendingCatch; this.confirm({ title: 'Yer değiştir', icon: 'swap', danger: true, text: s.q + ' × ' + FISH[s.f].name_tr + ' serbest bırakılacak ve yerine ' + FISH[pc.fid].name_tr + ' konacak.', ok: 'Değiştir', onOk: () => { const r = Fishing.resolveStorage('swap', d.k, +d.i); if (!r.ok) this.toastNow(r.msg || 'Olmadı', 'warn'); else this.toastNow(FISH[pc.fid].name_tr + ' depoya kondu.', 'good'); this.fishBarUpdate(); }, onCancel: () => this.showCatch(S.pendingCatch, true) }); },
    wake() { go('Home', { morning: true }); },
    // ansiklopedi
    ency(d) { this.sel.ency = d.id; this.renderPanel(); },
    encyBack() { this.sel.ency = null; this.renderPanel(); },
    // kozmetik
    wear(d) { if (d.k === 'outfit') S.player.outfit = d.id; else S.player.hat = d.id; Save.soon(); this.renderPanel(true); },
    look(d) { S.player[d.k] = +d.v; Save.soon(); this.renderPanel(true); },
    buyCos(d) { const it = (d.k === 'outfit' ? OUTFITS : HATS).find(x => x.id === d.id); this.buy(it.name, 'wardrobe', it.price, 'Yalnızca görsel bir kıyafet.', () => Shop.buyCosmetic(d.k, d.id)); },
    placeDecor(d) { const cur = S.home.decor[d.s]; Cosmetics.placeDecor(d.s, cur === d.id ? null : d.id); },
    buyDecor(d) { const it = DECOR_BY[d.id]; this.buy(it.name, 'decor_' + it.id, it.price, DECOR_SLOTS[it.slot] + ' için dekoratif eşya.', () => Shop.buyCosmetic('decor', d.id)); },
    // kayıt
    exportOpen() { const j = Save.pack(S); this.showModal(`<h3>Kaydı Dışa Aktar</h3><p class="dim small">Dosya indirilmezse aşağıdaki metni kopyalayıp güvenli bir yerde sakla.</p><textarea readonly class="ta">${esc(j)}</textarea><div class="btns"><button class="btn" data-a="mCancel">Kapat</button><button class="btn" data-a="copyExport">Kopyala</button><button class="btn g" data-a="download">İndir (.json)</button></div>`, 'wide'); },
    download() { const j = Save.pack(S); try { const b = new Blob([j], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'cozyfishing_gun' + S.day + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 500); this.toastNow('Kayıt dosyası hazırlandı.', 'good'); } catch (e) { this.toastNow('İndirme desteklenmiyor; metni kopyala.', 'warn'); } },
    copyExport() { const ta = this.modalEl.querySelector('textarea'); ta.select(); try { navigator.clipboard ? navigator.clipboard.writeText(ta.value).then(() => this.toastNow('Kopyalandı.', 'good')) : (document.execCommand('copy'), this.toastNow('Kopyalandı.', 'good')); } catch (e) { this.toastNow('Elle seçip kopyala.', 'warn'); } },
    exportRaw() { const raw = this._rawSave || ''; const b = new Blob([raw], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'cozyfishing_bozuk_kayit.json'; a.click(); },
    importOpen() { this.showModal(`<h3>Kaydı İçe Aktar</h3><p class="dim small">Bir .json dosyası seç ya da metni yapıştır. Mevcut kayıt, onayın olmadan ezilmez.</p><input type="file" accept=".json,application/json" id="impFile"><textarea class="ta" id="impText" placeholder="JSON kaydını buraya yapıştır"></textarea><div class="btns"><button class="btn" data-a="mCancel">Vazgeç</button><button class="btn g" data-a="importGo">İçe Aktar</button></div>`, 'wide'); },
    importGo() {
      const fi = $('impFile'), ta = $('impText');
      const handle = (txt) => { const u = Save.unpack(txt); if (!u.ok) { this.toastNow('İçe aktarma reddedildi: ' + u.msg, 'warn'); Sound.sfx('error'); return; } const st = u.state; this.confirm({ title: 'Kaydı yükle?', danger: true, html: `<p>Gün <b>${st.day}</b> · Para <b>${fmt(st.cash)}</b> · ${esc(st.player.name)} · ${Object.keys(st.ency).length} tür · ${st.boats.owned.length} tekne</p><p class="warn">Mevcut oyunun bu kayıtla değiştirilecek (önceki kayıt bir kez yedeklenir).</p>`, ok: 'Yükle', onOk: () => { Save.keepPrevious(); S = st; Save.now(); startFromState(); this.toastNow('Kayıt yüklendi.', 'good'); } }); };
      if (fi && fi.files && fi.files[0]) { const r = new FileReader(); r.onload = () => handle(String(r.result)); r.readAsText(fi.files[0]); }
      else if (ta && ta.value.trim()) handle(ta.value.trim());
      else this.toastNow('Önce bir dosya seç ya da metin yapıştır.', 'warn');
    },
    async restoreBackup() { const st = await Save.loadBackup(); if (!st) { this.toastNow('Geçerli bir gün yedeği bulunamadı.', 'warn'); return; } this.confirm({ title: 'Yedekten yükle?', danger: true, text: 'Son uyku anındaki yedek (Gün ' + st.day + ') yüklenecek.', ok: 'Yükle', onOk: () => { Save.keepPrevious(); S = st; Save.now(); startFromState(); } }); },
    buySnack(d) { const sn = SNACK[d.id]; this.buy(sn.name, 'snack_' + sn.id, sn.price, sn.desc, () => Shop.buySnack(d.id)); },
    buyFest() { const fe = World.festival(); if (!fe) return; const st = fe.stall; const it = (st.kind === 'hat' ? HATS : OUTFITS).find(x => x.id === st.id); this.buy(it.name, 'festival', st.price, 'Şenliğe özel kozmetik.', () => Shop.buyFestivalItem()); },
    teaSell(d) { const r = Tea.sell(+d.n, Market.sources(!!this.sel.tChest)); if (r.ok) { this.toastNow(r.n + ' balık Halil Usta\'ya satıldı: +' + fmt(r.income), 'good', 'teahouse'); delete this.qty.tea; } else this.toastNow(r.msg, 'warn'); },
    compStart() { const r = Comp.start(); if (!r.ok) { this.toastNow(r.msg, 'warn'); return; } this.closePanel(true); go('PierFishing', { spot: 1 }); this.toastNow('Yarışma başladı! ' + COMP.casts + ' atış hakkın var. Rakiplerin de iskelede.', 'good', 'festival'); },
    compGo() { this.closePanel(true); go('PierFishing', { spot: 1 }); },
    compDone() { this.closeModal(); Comp.clearDone(); this.refresh(); },
    festInfo() { if (Game.sceneName === 'Town') { this.openPanel('Square'); return; } const fe = World.festival(), nf = World.nextFestival(); this.confirm({ title: fe ? fe.name : 'Yaklaşan şenlik', icon: 'festival', text: fe ? fe.comp_name + ': ' + fe.rule + '. Kaydolmak için kasabadaki Şenlik Meydanı\'na git.' : nf.f.name + ' ' + nf.inDays + ' gün sonra başlıyor.', ok: 'Tamam', cancel: 'Kapat' }); },
    dbg(d) { QA.act(d.k, d); }
  }
};
function boatThumb(id) {
  const cfg = S.boats.byId[id] ? boatCfgOf(id) : { color: 'sea_green', name: '', motor: BOAT[id].default_motor, hull: 0, nav: BOAT_INFO[id].nav0, storage: BOAT[id].initial_storage };
  return Atlas.url('bthumb:' + id + JSON.stringify(cfg), () => { const p = boatParts(id, cfg); const pb = new PB(p.w, p.h); pb.blit(p.back, 0, 0); pb.blit(p.front, 0, 0); return pb; }, 1);
}
