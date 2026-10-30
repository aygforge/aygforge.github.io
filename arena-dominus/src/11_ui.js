/* =========================================================================
   UIManager — framework, navigation, top bar, modals, title & career setup,
   battle HUD, match flow and week advance flow.
   ========================================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const H = {
  crest(club, size = 32) { return club ? Art.crestSVG(club.crest, size) : ''; },
  por(g, rem = 2.6, colors) { return `<img class="portrait" alt="" src="${Art.portraitURL(g, 112, colors)}" style="width:${rem}rem;height:${rem}rem">`; },
  ovr(v) { v = Math.round(num(v)); return `<span class="ovr ${v >= 72 ? 'hi' : v < 40 ? 'lo' : ''}">${v}</span>`; },
  cls(c) { return `<span class="row gap0">${Art.clsSVG(c, 14)}<span>${CLASSES[c].name}</span></span>`; },
  reg(r) { return REGION_BY_ID[r] ? REGION_BY_ID[r].name : '-'; },
  club(cid) { const c = S.clubs[cid]; return c ? c.n : tx('Serbest', 'Free agent'); },
  bar(v, max = 100, kind = '') { return `<div class="bar ${kind}"><i style="width:${clamp(v / max * 100, 0, 100)}%"></i></div>`; },
  inj(g) { return g.injury ? `<span class="pill inj">${Art.icon('injury', 10)} ${H.injName(g.injury.l)} · ${g.injury.w} ${tx('hf', 'wk')}</span>` : `<span class="pill ok">${tx('Sağlıklı', 'Healthy')}</span>`; },
  injName(l) { return [tx('', ''), tx('Hafif', 'Minor'), tx('Orta', 'Moderate'), tx('Ağır', 'Serious')][l] || ''; },
  goal(g) { return goalName(g); },
  pot(g) { const r = Scouting.potRange(g); return r[0] === r[1] ? String(r[0]) : `${r[0]}–${r[1]}`; },
  con(g) { return g.con ? tx(`${g.con.yrs} sezon`, `${g.con.yrs} season${g.con.yrs > 1 ? 's' : ''}`) : '—'; },
  form(f) { return `<span class="form">${(f || []).map(x => `<i class="${x}">${x === 'G' ? tx('G', 'W') : tx('M', 'L')}</i>`).join('')}</span>`; },
  stars(n, max = 5) { return `<span class="stars">${'★'.repeat(n)}${'<span class="dim">★</span>'.repeat(max - n)}</span>`; },
  tierName(t) { return TIERS[t].n; },
  rankOf(cid) { return Leagues.rankOf(cid); }
};

const UI = {
  screen: 'hub', params: {}, squadSel: null, flow: null, saveTimer: 0,
  init() {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-a]');
      if (!el) return;
      if (el.classList.contains('modal-bg') && e.target !== el) return;
      const fn = Actions[el.dataset.a];
      if (!fn) return;
      Sfx.resume();
      if (el.tagName === 'BUTTON' || el.classList.contains('btn')) Sfx.play('click');
      try { fn(el.dataset, el, e); } catch (err) { console.error(err); UI.toast(tx('Hata: ', 'Error: ') + err.message); }
    });
    document.addEventListener('change', e => { const el = e.target.closest('[data-ch]'); if (el && Changes[el.dataset.ch]) Changes[el.dataset.ch](el, e); });
    document.addEventListener('input', e => { const el = e.target.closest('[data-in]'); if (el && Changes[el.dataset.in]) Changes[el.dataset.in](el, e); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeModal(); });
    window.addEventListener('resize', () => { if (Battle.m) Battle.resize(); if ($('#titlecanvas')) Title.drawBG(); Tutorial.position(); });
    document.addEventListener('pointerdown', () => Sfx.resume(), { once: true });
  },
  // ---------------------------------------------------------------- navigation
  get NAV() {
    return [
      ['hub', 'hub', tx('Merkez', 'Home')], ['squad', 'squad', tx('Kadro', 'Squad')], ['match', 'match', tx('Maç', 'Match')], ['market', 'transfer', tx('Transfer', 'Transfers')],
      ['leagues', 'leagues', tx('Ligler', 'Leagues')], ['cups', 'cups', tx('Kupalar', 'Cups')], ['facilities', 'facilities', tx('Tesisler', 'Facilities')], ['equipment', 'equipment', tx('Ekipman', 'Equipment')],
      ['sponsors', 'sponsors', tx('Hamiler', 'Patrons')], ['finance', 'finance', tx('Finans', 'Finance')], ['history', 'history', tx('Tarihçe', 'History')], ['settings', 'settings', tx('Ayarlar', 'Settings')]
    ];
  },
  enterGame() {
    $('#screen-root').innerHTML = '';
    $('#game').hidden = false;
    this.go('hub');
  },
  go(screen, params = {}) {
    this.screen = screen; this.params = params;
    if (screen !== 'squad') this.squadSel = null;
    this.render();
    const v = $('#view'); if (v) v.scrollTop = 0;
  },
  render() {
    if (!S || $('#game').hidden) return;
    this.renderTop();
    this.renderNav();
    const fn = Screens[this.screen] || Screens.hub;
    let html;
    try { html = fn.call(Screens, this.params); } catch (e) { console.error(e); html = `<div class="card bad">${tx('Ekran oluşturulamadı: ', 'Could not build screen: ')}${esc(e.message)}</div>`; }
    $('#view').innerHTML = html;
    const after = Screens['after_' + this.screen];
    if (after) try { after.call(Screens, this.params); } catch (e) { console.error(e); }
    Tutorial.position();
  },
  renderNav() {
    const offers = S.offers.length;
    $('#nav').innerHTML = this.NAV.map(([id, ic, label]) =>
      `<button data-a="go" data-s="${id}" class="${this.screen === id || (id === 'market' && this.screen === 'profile' && false) ? 'on' : ''}" id="nav-${id}">${Art.icon(ic, 21)}<span>${label}</span>${id === 'market' && offers ? `<span class="badge">${offers}</span>` : ''}</button>`).join('');
  },
  renderTop() {
    const c = GameState.player();
    const rank = Leagues.rankOf(c.id);
    const win = Calendar.isWindow();
    const end = S.week >= SEASON_WEEKS;
    const pend = Game.pendingPlayerMatch();
    $('#topbar').innerHTML = `
      <div class="club" data-a="go" data-s="hub">${H.crest(c, 30)}<div class="col gap0" style="min-width:0"><b class="ellip">${esc(c.n)}</b><span class="tiny muted ellip">${TIERS[c.tier].s} · ${tx(rank + '. sıra', 'pos. ' + rank)} · ${H.reg(c.reg)}</span></div></div>
      <span class="chip gold">${Art.icon('coin', 14)} ${fmtGold(c.budget)}</span>
      ${c.arrears > 0 ? `<span class="chip bad">${tx('Borç', 'Arrears')} ${fmtGold(c.arrears)}</span>` : ''}
      <span class="chip">${tx(S.season + '. Sezon', 'Season ' + S.season)} · ${weekLabel(S.week)}</span>
      <span class="chip ${win ? 'win' : 'closed'}" title="${Calendar.windowLabel()}">${Art.icon('transfer', 13)} ${win ? tx('Transfer açık', 'Window open') : tx('Transfer kapalı', 'Window closed')}</span>
      <span class="right"></span>
      <button class="btn ghost sm" data-a="toggleSound" title="${tx('Ses', 'Sound')}">${Art.icon(S.settings.sound ? 'sound' : 'mute', 16)}</button>
      <button class="btn ghost sm" data-a="fullscreen" title="${tx('Tam ekran', 'Fullscreen')}">${Art.icon('full', 16)}</button>
      <button class="btn ${pend ? 'gold' : 'primary'}" id="btn-next" data-a="nextWeek">${end ? tx('Yeni Sezon', 'New Season') : pend ? tx('Maç Haftası', 'Match Week') : tx('Sonraki Hafta', 'Next Week')} ${Art.icon('next', 16)}</button>`;
  },
  // ---------------------------------------------------------------- modal / toast / busy
  modal(title, body, foot = '', cls = '') {
    const root = $('#modal-root');
    const id = 'm' + Date.now() + Math.floor(Math.random() * 1000);
    const wrap = document.createElement('div');
    wrap.className = 'modal-bg'; wrap.id = id; wrap.dataset.a = 'closeModalBg';
    wrap.innerHTML = `<div class="modal ${cls}"><div class="mh"><h2 class="grow ellip">${title}</h2><button class="btn ghost sm" data-a="closeModal">${Art.icon('close', 16)}</button></div><div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ''}</div>`;
    root.appendChild(wrap);
    return wrap;
  },
  closeModal() { const root = $('#modal-root'); const last = root.lastElementChild; if (last) { last.remove(); if (last._onClose) last._onClose(); } },
  closeAllModals() { $('#modal-root').innerHTML = ''; },
  updateModal(title, body, foot, cls) {
    const root = $('#modal-root'); const last = root.lastElementChild;
    if (!last) return this.modal(title, body, foot, cls);
    last.querySelector('.modal').className = 'modal ' + (cls || '');
    last.querySelector('.mh h2').innerHTML = title;
    last.querySelector('.mb').innerHTML = body;
    let f = last.querySelector('.mf');
    if (foot) { if (!f) { f = document.createElement('div'); f.className = 'mf'; last.querySelector('.modal').appendChild(f); } f.innerHTML = foot; } else if (f) f.remove();
    return last;
  },
  confirm(title, text, okLabel, onOk, cancelLabel = tx('Vazgeç', 'Cancel')) {
    const m = this.modal(title, `<p>${text}</p>`, `<button class="btn ghost" data-a="closeModal">${cancelLabel}</button><button class="btn primary" data-a="confirmOk">${okLabel}</button>`, 'narrow');
    m._ok = onOk;
  },
  toast(msg, ms = 2600) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg;
    $('#toast-root').appendChild(t);
    setTimeout(() => t.remove(), ms);
    while ($('#toast-root').children.length > 3) $('#toast-root').firstChild.remove();
  },
  busy(on, title, sub, p) {
    const b = $('#busy');
    b.hidden = !on;
    if (on) { if (title) $('#busy-t').textContent = title; $('#busy-s').textContent = sub || ''; $('#busy-bar').style.width = Math.round((p || 0) * 100) + '%'; }
  },
  saveSoon() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => SaveManager.save(), 300);
  },
  async saveNow() { clearTimeout(this.saveTimer); return SaveManager.save(); },
  // ---------------------------------------------------------------- battle UI
  showBattle() {
    const b = $('#battle');
    const m = Battle.m;
    const side = s => {
      const t = m.teams[s];
      const c = S.clubs[t.cid];
      return `<div class="bteam" id="bt${s}"><div class="tn">${H.crest(c, 20)}<span class="ellip">${esc(c.n)}</span><span class="stance right" id="bst${s}"></span></div>
        ${m.units.filter(u => u.side === s).map(u => `<div class="bf" id="bf${u.i}" data-a="pickTarget" data-i="${u.i}"><img class="portrait" src="${Art.portraitURL(Battle.setup.sides[s].glads[u.slot], 64, t.colors)}" style="width:1.8rem;height:1.8rem"><div class="bars"><div class="row" style="gap:.2rem"><span class="ellip grow">${esc(u.name)}</span><span class="dim">${CLASSES[u.cls].name}</span><span class="st" id="bfs${u.i}"></span></div><div class="bar g"><i id="bfh${u.i}"></i></div><div class="bar en"><i id="bfe${u.i}"></i></div></div></div>`).join('')}
      </div>`;
    };
    b.innerHTML = `<div class="stage"><canvas id="bcanvas"></canvas>
      <div class="bhud-top">${side(0)}<div class="bclock"><div class="t" id="bclock">2:00</div><div class="tiny muted">${esc(Calendar.compName(Battle.comp))}</div></div>${side(1)}</div>
      <div class="blog" id="blog"></div>
      <div class="bhud-bot">
        <div class="bcmds" id="bcmds">
          <button class="btn sm" data-a="bcmd" data-c="attack">${Art.icon('sword', 15)} ${tx('Hücum', 'Attack')}<span class="cd" id="cd1"></span></button>
          <button class="btn sm" data-a="bcmd" data-c="defend">${Art.icon('shield', 15)} ${tx('Savunma', 'Defend')}<span class="cd" id="cd2"></span></button>
          <button class="btn sm" data-a="bcmd" data-c="focus" id="bfocus">${Art.icon('target', 15)} ${tx('Odaklan', 'Focus')}<span class="cd" id="cd3"></span></button>
        </div>
        <div class="seg" id="bspeed">
          <button data-a="bspeed" data-v="1" class="on">1x</button><button data-a="bspeed" data-v="2">2x</button><button data-a="bspeed" data-v="4">4x</button><button data-a="bspeed" data-v="sim">${tx('Sonuç', 'Result')} ▶▶</button>
        </div>
      </div></div>`;
    b.hidden = false;
    $('#bcanvas').addEventListener('pointerdown', e => Battle.canvasTap(e));
  },
  hideBattle() { const b = $('#battle'); b.hidden = true; b.innerHTML = ''; },
  battleSpeedUI(s) { $$('#bspeed button').forEach(b => b.classList.toggle('on', b.dataset.v === String(s))); },
  battleTargeting(on) {
    $('#bfocus') && $('#bfocus').classList.toggle('on', on);
    for (const u of Battle.m.units) { const el = $('#bf' + u.i); if (el) el.classList.toggle('tg', on && u.alive && u.side !== Battle.pside); }
    if (on) UI.battleLog(tx('Odaklanılacak rakibi seçin (arenadan veya listeden)', 'Pick the opponent to focus (in the arena or the list)'));
  },
  battleLog(t) {
    const l = $('#blog'); if (!l) return;
    const d = document.createElement('div'); d.textContent = t; l.appendChild(d);
    setTimeout(() => d.remove(), 3500);
    while (l.children.length > 3) l.firstChild.remove();
  },
  battleHUD(m, pside) {
    const left = Math.max(0, COMBAT_MAX_T - m.t);
    const ce = $('#bclock'); if (ce) ce.textContent = Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0');
    for (const u of m.units) {
      const h = $('#bfh' + u.i); if (!h) continue;
      h.style.width = (u.hp / u.hpMax * 100) + '%';
      $('#bfe' + u.i).style.width = (u.en / u.enMax * 100) + '%';
      $('#bf' + u.i).classList.toggle('out', !u.alive);
      const st = u.alive ? [u.st.root > 0 ? tx('AĞDA', 'NETTED') : '', u.st.guard > 0 ? tx('SİPER', 'WALL') : '', u.st.pur > 0 ? tx('TAKİP', 'PURSUIT') : '', u.st.stag > 0 ? tx('SERSEM', 'DAZED') : '', m.teams[pside].focus === u.i ? tx('◎HEDEF', '◎TARGET') : ''].filter(Boolean).join(' ') : tx('ELENDİ', 'OUT');
      const se = $('#bfs' + u.i); if (se.textContent !== st) se.textContent = st;
    }
    for (const s of [0, 1]) { const e = $('#bst' + s); if (e) { const t = m.teams[s]; const sn = t.stance === 'aggr' ? tx('Hücum', 'Attack') : t.stance === 'def' ? tx('Savunma', 'Defend') : tx('Dengeli', 'Balanced'); if (e.textContent !== sn) e.textContent = sn; } }
    const cd = m.teams[pside].cmdCd;
    for (const id of ['cd1', 'cd2', 'cd3']) { const e = $('#' + id); if (e) e.style.width = (cd / 8 * 100) + '%'; }
  },
  // ---------------------------------------------------------------- match flows
  // live match for the player's fixture this week. then(): continue (e.g. process week)
  playLive(f, then) {
    const me = GameState.player();
    Squad.fixLineup(me);
    const before = { b: me.budget };
    Battle.open(f, f.comp, (res, setup, m) => {
      MatchSystem.record(f.m, f.comp, res, setup);
      UI.hideBattle();
      UI.saveNow();
      UI.render();
      UI.matchResult(f, res, setup, m, me.budget - before.b, then);
    });
  },
  simulatePlayer(f, then) {
    const me = GameState.player();
    Squad.fixLineup(me);
    const before = me.budget;
    const setup = MatchSystem.build(f.m, f.comp, { live: false });
    const m = CombatEngine.create(setup);
    const res = CombatEngine.run(m);
    MatchSystem.record(f.m, f.comp, res, setup);
    UI.saveNow();
    UI.render();
    UI.matchResult(f, res, setup, m, me.budget - before, then);
  },
  matchResult(f, res, setup, m, gold, then) {
    const ps = setup.sides[0].cid === S.player ? 0 : 1;
    const won = res.w === ps;
    const why = { ko: tx('Rakip takımın tüm gladyatörleri elendi.', 'All gladiators of the losing side were eliminated.'), surv: tx('Süre doldu — ayakta kalan gladyatör sayısı belirleyici oldu.', 'Time ran out — the number of fighters still standing decided it.'), hp: tx('Süre doldu — kalan toplam can yüzdesi belirleyici oldu.', 'Time ran out — total remaining health decided it.'), dmg: tx('Süre doldu — verilen etkili hasar belirleyici oldu.', 'Time ran out — effective damage dealt decided it.'), coin: tx('Tam eşitlik — tarafsız kura kuralı uygulandı.', 'Perfect tie — the neutral draw rule was applied.') }[res.why];
    const tbl = s => `<table class="t"><tr><th>${tx('Gladyatör', 'Gladiator')}</th><th class="n">${tx('Hasar', 'Damage')}</th><th class="n">${tx('Alınan', 'Taken')}</th><th class="n">${tx('Eleme', 'Elims')}</th><th class="n">${tx('Blok', 'Blocks')}</th><th>${tx('Durum', 'Status')}</th></tr>
      ${res.units.filter(u => u.side === s).map((u, k) => { const g = setup.sides[s].glads[k]; const live = S.glads[u.gid]; return `<tr><td><span class="row">${H.por(g, 1.7, setup.sides[s].colors)}<span>${esc(g.n)}${u.temp ? ` <span class="pill">${tx('Geçici', 'Temporary')}</span>` : ''}<br><span class="tiny dim">${CLASSES[g.cls].name}</span></span></span></td><td class="n">${Math.round(u.rec.dmg)}</td><td class="n">${Math.round(u.rec.tk)}</td><td class="n">${u.rec.ko}</td><td class="n">${u.rec.blk}</td><td>${u.alive ? `<span class="good">${tx('Ayakta', 'Standing')}</span> ${Math.round(u.hpf * 100)}%` : `<span class="bad">${tx('Elendi', 'Eliminated')}</span>`}${live && live.injury && s === ps ? ' ' + H.inj(live) : ''}</td></tr>`; }).join('')}</table>`;
    const H0 = S.clubs[setup.sides[0].cid], A0 = S.clubs[setup.sides[1].cid];
    const body = `<div class="row center mb" style="gap:1.2rem">
        <div class="col center" style="align-items:center">${H.crest(H0, 54)}<b>${esc(H0.n)}</b></div>
        <div class="col center" style="align-items:center"><div class="serif" style="font-size:2.2rem;color:var(--gold)">${res.surv[0]} – ${res.surv[1]}</div><div class="tiny muted">${tx('ayakta kalan', 'left standing')} · ${Math.floor(res.t / 60)}:${String(Math.floor(res.t % 60)).padStart(2, '0')}</div></div>
        <div class="col center" style="align-items:center">${H.crest(A0, 54)}<b>${esc(A0.n)}</b></div></div>
      <div class="center serif big ${won ? 'good' : 'bad'}" style="text-align:center">${won ? tx('ZAFER!', 'VICTORY!') : tx('MAĞLUBİYET', 'DEFEAT')}</div>
      <p class="center small muted" style="text-align:center">${why}</p>
      <div class="grid g2">${[0, 1].map(s => `<div class="card tight"><h3>${esc(S.clubs[setup.sides[s].cid].n)}</h3>${tbl(s)}</div>`).join('')}</div>
      <p class="small muted">${tx('Kulüp kasasına bu maçtan net etki:', 'Net effect of this match on club funds:')} <b class="${gold >= 0 ? 'good' : 'bad'}">${gold >= 0 ? '+' : ''}${fmtGold(gold)}</b> ${tx('(bilet, ödül ve bonuslar). Gladyatörler deneyim kazandı; kondisyonları düştü.', '(tickets, prizes and bonuses). The gladiators gained experience; their condition dropped.')}</p>`;
    const mm = this.modal(Calendar.compName(f.comp), body, `<button class="btn gold" data-a="resultContinue">${tx('Devam', 'Continue')} ${Art.icon('next', 14)}</button>`);
    mm._then = then;
    mm._onClose = () => { const t = mm._then; mm._then = null; t && t(); };
    if (won) Sfx.play('cheer');
  },
  // ---------------------------------------------------------------- week flow
  async advance() {
    if (Game.busy) return;
    const me = GameState.player();
    if (S.week >= SEASON_WEEKS) {
      this.confirm(tx('Yeni Sezon', 'New Season'), tx(`${S.season}. sezon tamamlandı. Yükselme/düşme, sözleşmeler, emeklilikler ve yeni fikstür işlenecek. Devam edilsin mi?`, `Season ${S.season} is complete. Promotion/relegation, contracts, retirements and new fixtures will be processed. Continue?`), tx('Yeni sezona geç', 'Start new season'), () => this.runWeek());
      return;
    }
    const pend = Game.pendingPlayerMatch();
    if (pend) {
      const opp = S.clubs[pend.m.h === S.player ? pend.m.a : pend.m.h];
      const inj = me.lineup.filter(id => S.glads[id] && S.glads[id].injury).length;
      const m = this.modal(tx('Maç Haftası', 'Match Week'), `<div class="row center" style="gap:1rem">${H.crest(me, 46)}<b class="big">vs</b>${H.crest(opp, 46)}</div>
        <p class="center" style="text-align:center"><b>${esc(Calendar.compName(pend.comp))}</b><br>${esc(me.n)} — ${esc(opp.n)} ${pend.m.h === S.player ? tx('(iç saha)', '(home)') : pend.m.nt ? tx('(tarafsız saha)', '(neutral venue)') : tx('(deplasman)', '(away)')}</p>
        ${inj ? `<p class="warn small">${tx(`Uyarı: As kadronuzda ${inj} sakat gladyatör var; maçta otomatik olarak yedekle değiştirilecek.`, `Warning: ${inj} injured gladiator(s) in your starting three; they will be replaced by a reserve automatically.`)}</p>` : ''}
        <p class="small muted">${tx('Haftayı ilerletmeden önce bu maçın nasıl oynanacağını seçin. Sonucu simüle etmek, aynı savaş motorunu görsel bekleme olmadan çalıştırır.', 'Before advancing the week, choose how this match is played. Simulating runs the same combat engine without the visual wait.')}</p>`,
        `<button class="btn ghost" data-a="closeModal">${tx('Vazgeç', 'Cancel')}</button><button class="btn" data-a="goMatchCenter">${tx('Maç Merkezi', 'Match Centre')}</button><button class="btn" data-a="flowSim">${tx('Sonucu Simüle Et', 'Simulate Result')}</button><button class="btn gold" data-a="flowLive">${Art.icon('play', 14)} ${tx('Canlı İzle', 'Watch Live')}</button>`, 'narrow');
      m._f = pend;
      return;
    }
    if (S.week === 0 && !me.sponsor && S.sponsorOffers.length) {
      this.confirm(tx('Hami Seçilmedi', 'No Patron Chosen'), tx('Bu sezon için henüz bir hami anlaşması seçmediniz. Hamisiz ilerlerseniz haftalık hami geliri alamazsınız (teklifler 1. haftaya kadar geçerli).', 'You have not chosen a patron deal for this season. Without one you get no weekly patron income (offers stay open until week 1).'), tx('Yine de ilerle', 'Continue anyway'), () => this.runWeek(), tx('Hamilere bak', 'View patrons'));
      return;
    }
    if (S.week === 1 && !me.sponsor && S.sponsorOffers.length) {
      this.confirm(tx('Son Şans', 'Last Chance'), tx('Hami teklifleri bu hafta sonunda geçersiz olacak. Hamisiz devam edilsin mi?', 'Patron offers expire at the end of this week. Continue without a patron?'), tx('Hamisiz devam', 'Continue without'), () => { S.sponsorOffers = []; this.runWeek(); }, tx('Hamilere bak', 'View patrons'));
      return;
    }
    this.runWeek();
  },
  async runWeek() {
    const wasEnd = S.week >= SEASON_WEEKS;
    const prevWeek = S.week;
    this.busy(true, wasEnd ? tx('Yeni sezon hazırlanıyor', 'Preparing the new season') : tx(weekLabel(S.week) + ' işleniyor', 'Processing ' + weekLabel(S.week)), '', 0);
    try {
      await Game.processWeek((p, t) => this.busy(true, null, t, p));
      if (prevWeek === 1 && !GameState.player().sponsor) S.sponsorOffers = [];
      await this.saveNow();
    } catch (e) {
      console.error(e);
      this.toast(tx('Hafta işlenirken hata oluştu: ', 'Error while processing the week: ') + e.message);
    }
    this.busy(false);
    this.closeAllModals();
    if (wasEnd) { this.go('hub'); this.seasonStartModal(); }
    else if (S.week === SEASON_WEEKS) { this.go('history', { tab: 'season' }); this.seasonEndModal(); }
    else { this.render(); this.toast(tx(`${weekLabel(S.week)} başladı.`, `${weekLabel(S.week)} has begun.`)); }
    if (Tutorial.active) Tutorial.position();
  },
  seasonEndModal() {
    const h = S.hist.seasons[S.hist.seasons.length - 1];
    if (!h || !h.player) return;
    const p = h.player;
    const promoted = p.tier > 1 && p.rank <= 2, rel = p.tier < 6 && p.rank >= 7;
    this.modal(tx(`${h.s}. Sezon Değerlendirmesi`, `Season ${h.s} Review`), `<div class="center" style="text-align:center"><div class="serif big gold">${esc(cn(S.clubs[p.c]) || p.n)}</div>
      <p>${TIERS[p.tier].n}: <b>${tx(p.rank + '. sıra', 'position ' + p.rank)}</b> (${p.w}${tx('G', 'W')} – ${p.l}${tx('M', 'L')}, ${p.pts} ${tx('puan', 'pts')})<br>${tx('Bölgesel kupa', 'Regional cup')}: <b>${esc(txt(p.cup))}</b>${p.imp ? ` · ${Cups.nameOf('imp')}: <b>${esc(txt(p.imp))}</b>` : ''}</p>
      <p class="${promoted ? 'good' : rel ? 'bad' : 'muted'} big">${promoted ? tx('Üst lige yükseldiniz!', 'You have been promoted!') : rel ? tx('Alt lige düştünüz.', 'You have been relegated.') : p.rank === 1 ? tx('Şampiyon!', 'Champions!') : tx('Ligde kaldınız.', 'You stayed in the league.')}</p></div>
      <p class="small muted">${tx('Tüm liglerin şampiyonları, kupalar ve bireysel ödüller Tarihçe ekranında. "Yeni Sezon" ile ilerlediğinizde yükselme/düşme, sözleşme bitişleri, yaşlanma ve emeklilikler uygulanır.', 'Champions of every league, the cups and individual awards are on the History screen. When you advance with "New Season", promotion/relegation, contract expiries, ageing and retirements are applied.')}</p>`, `<button class="btn gold" data-a="closeModal">${tx('Tamam', 'OK')}</button>`, 'narrow');
  },
  seasonStartModal() {
    const me = GameState.player();
    this.modal(tx(`${S.season}. Sezon Başladı`, `Season ${S.season} Has Begun`), `<p>${tx(`${esc(me.n)} bu sezon <b>${TIERS[me.tier].n}</b> (${H.reg(me.reg)}) liginde mücadele edecek.`, `${esc(me.n)} will compete in the <b>${TIERS[me.tier].n}</b> (${H.reg(me.reg)}) this season.`)}</p>
      <ul class="small"><li>${tx('Sezon öncesi ve 1. hafta transfer dönemi açık.', 'The transfer window is open in pre-season and week 1.')}</li><li>${me.sponsor ? tx('Hami anlaşmanız devam ediyor.', 'Your patron deal continues.') : tx('Hamiler ekranından yeni hami teklifini seçin.', 'Choose a new patron offer on the Patrons screen.')}</li><li>${tx('Sözleşmesi biten gladyatörler kadrodan ayrıldıysa transfer pazarından yerlerini doldurun.', 'If gladiators left when their contracts ended, fill their places from the transfer market.')}</li>${S.icup ? `<li>${tx('İmparatorluk Kupası bu sezon oynanıyor', 'The Imperial Cup is played this season')}${S.icup.part.includes(me.id) ? tx(' — ve siz de katılıyorsunuz!', ' — and you are taking part!') : '.'}</li>` : ''}</ul>`,
      `<button class="btn" data-a="go" data-s="sponsors">${tx('Hamiler', 'Patrons')}</button><button class="btn gold" data-a="closeModal">${tx('Tamam', 'OK')}</button>`, 'narrow');
  }
};

// ---------------------------------------------------------------- title + career setup
const Title = {
  setup: null,
  // first screen on every launch: choose Turkish or English
  langScreen() {
    $('#game').hidden = true;
    UI.hideBattle();
    let last = 'tr';
    try { last = localStorage.getItem('ad_lang') || 'tr'; } catch (e) { }
    $('#screen-root').innerHTML = `<canvas id="titlecanvas"></canvas><div class="title-wrap">
      <div class="logo"><h1>ARENA DOMINUS</h1><div class="sub">DİL SEÇİN · CHOOSE LANGUAGE</div></div>
      <div class="menu langmenu">
        <button class="btn ${last === 'tr' ? 'gold' : ''}" data-a="pickLang" data-l="tr" id="lang-tr"><span class="flag">TR</span> Türkçe</button>
        <button class="btn ${last === 'en' ? 'gold' : ''}" data-a="pickLang" data-l="en" id="lang-en"><span class="flag">EN</span> English</button>
      </div></div>`;
    this.drawBG();
  },
  show() {
    $('#game').hidden = true;
    UI.hideBattle();
    $('#screen-root').innerHTML = `<canvas id="titlecanvas"></canvas><div class="title-wrap">
      <div class="logo"><h1>ARENA DOMINUS</h1><div class="sub">${tx('GLADYATÖR OKULU MENAJERLİĞİ', 'GLADIATOR SCHOOL MANAGER')}</div></div>
      <div class="menu" id="tmenu"><button class="btn gold" data-a="newCareer">${tx('Yeni Kariyer', 'New Career')}</button><button class="btn" data-a="continueCareer" id="btn-cont" disabled>${tx('Kariyere Devam Et', 'Continue Career')}</button>
      <div class="row"><button class="btn ghost sm grow" data-a="importSaveTitle">${Art.icon('upload', 14)} ${tx('Kayıt İçe Aktar', 'Import Save')}</button><button class="btn ghost sm" data-a="fullscreen" title="${tx('Tam ekran', 'Fullscreen')}">${Art.icon('full', 14)}</button><button class="btn ghost sm" data-a="toggleSoundTitle" id="tsnd" title="${tx('Ses', 'Sound')}">${Art.icon(Sfx.on ? 'sound' : 'mute', 14)}</button><button class="btn ghost sm" data-a="langScreen" title="${tx('Dil', 'Language')}">${I18N.lang === 'en' ? 'EN' : 'TR'}</button></div>
      <div class="tiny muted center" id="tmeta" style="text-align:center">${tx('Kayıt aranıyor…', 'Looking for a save…')}</div></div></div>`;
    this.drawBG();
    SaveManager.meta().then(m => {
      const b = $('#btn-cont'), t = $('#tmeta');
      if (!b) return;
      if (m && m.s) { b.disabled = false; t.textContent = tx(`Kayıtlı kariyer: ${m.club} · ${m.s}. sezon, ${weekLabel(m.w)}`, `Saved career: ${m.club} · season ${m.s}, ${weekLabel(m.w)}`); }
      else t.textContent = SaveManager.mode === 'mem' ? tx('Bu tarayıcıda kalıcı kayıt kullanılamıyor; JSON dışa aktarmayı kullanın.', 'Persistent saving is unavailable in this browser; use JSON export.') : tx('Kayıtlı kariyer yok.', 'No saved career.');
    });
  },
  drawBG() {
    const cv = $('#titlecanvas'); if (!cv) return;
    const W = cv.clientWidth || innerWidth, Hh = cv.clientHeight || innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = Hh * dpr;
    const x = cv.getContext('2d'); x.scale(dpr, dpr);
    const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#3a2414'); g.addColorStop(0.55, '#7a3f1c'); g.addColorStop(1, '#1a100a');
    x.fillStyle = g; x.fillRect(0, 0, W, Hh);
    // sun
    const sg = x.createRadialGradient(W * 0.5, Hh * 0.52, 5, W * 0.5, Hh * 0.52, Hh * 0.5); sg.addColorStop(0, 'rgba(255,200,120,.55)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = sg; x.fillRect(0, 0, W, Hh);
    // colosseum silhouette
    x.fillStyle = '#21140c';
    const base = Hh * 0.7;
    x.beginPath(); x.moveTo(0, base); x.quadraticCurveTo(W * 0.5, base - Hh * 0.38, W, base); x.lineTo(W, Hh); x.lineTo(0, Hh); x.fill();
    x.fillStyle = 'rgba(255,190,110,.18)';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 26; i++) {
      const t = i / 25, px = t * W, py = base - Math.sin(t * Math.PI) * Hh * (0.3 - r * 0.08) + r * 6;
      x.beginPath(); x.ellipse(px, py + 14, 6, 10, 0, Math.PI, 0); x.fill();
    }
    x.fillStyle = '#120a06'; x.fillRect(0, Hh * 0.86, W, Hh * 0.14);
    // two duelling gladiators drawn with the real figure renderer
    const mk = (sk, hs, bd) => ({ sk, hs, hc: 1, bd, jw: 1, ns: 1, br: 0.5, ey: 1, bw: 1.05, ht: 1, sc: 0, ac: 0, pl: 0 });
    const s = Hh / 330;
    const P1 = { footF: { x: 14, y: 0 }, footB: { x: -12, y: 0 }, lean: 0.25, crouch: 0.3, hipX: 0, armF: [1.2, 1.6], armB: [-2.3, -1.9], wB: -2.7, wF: 2.2, head: 0, fall: 0, bob: 0 };
    const P2 = { footF: { x: 10, y: 0 }, footB: { x: -14, y: 0 }, lean: 0.15, crouch: 0.25, hipX: 0, armF: [0.3, 0.5], armB: [1.4, 1.58], wB: 1.62, wF: 2.2, head: 0, fall: 0, bob: 0 };
    x.save(); x.translate(W * 0.17, Hh * 0.9); x.scale(s, s); Art.figure(x, mk(2, 1, 3), 'murmillo', { c1: '#9e2a22', c2: '#d4ad52', wq: 1, xq: 1, aq: -1 }, P1); x.restore();
    x.save(); x.translate(W * 0.83, Hh * 0.9); x.scale(-s, s); Art.figure(x, mk(4, 2, 2), 'retiarius', { c1: '#25507a', c2: '#d4ad52', wq: 2, xq: 2, aq: -1 }, P2); x.restore();
    const vg = x.createRadialGradient(W / 2, Hh / 2, Hh * 0.3, W / 2, Hh / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
    x.fillStyle = vg; x.fillRect(0, 0, W, Hh);
  },
  newCareer() {
    UI.busy(true, tx('Dünya oluşturuluyor', 'Creating the world'), tx('5 bölge · 30 lig · 240 kulüp · 1.400 gladyatör', '5 regions · 30 leagues · 240 clubs · 1,400 gladiators'), 0.3);
    setTimeout(() => {
      const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      WorldGenerator.generate(seed);
      UI.busy(false);
      this.setup = { reg: 'valeria', name: '', crest: { sh: 0, sy: 0, c1: '#9e2a22', c2: '#d4ad52' }, browseReg: 'valeria', browseTier: 6, pick: -1 };
      this.modeScreen();
    }, 30);
  },
  modeScreen() {
    $('#screen-root').innerHTML = `<canvas id="titlecanvas"></canvas><div class="title-wrap"><div class="logo"><h1 style="font-size:2.2rem">${tx('YENİ KARİYER', 'NEW CAREER')}</h1><div class="sub">${tx('BAŞLANGIÇ SEÇİN', 'CHOOSE YOUR START')}</div></div>
      <div class="grid g2" style="position:relative;width:min(46rem,92vw)">
        <div class="card choice" data-a="setupNew"><h3>${Art.icon('facilities', 18)} ${tx('Yeni Ludus Kur', 'Found a New Ludus')}</h3><p class="small">${tx(`Bölgeni seç, kulübüne isim ve arma ver. Kum Arenası'nda (6. lig) küçük bir okulla, 5 acemi gladyatör ve yaklaşık ${fmtGold(ECON.startCash)} ile başla.`, `Pick your region, name your club and design its crest. Start in the Sand Arena (6th tier) with a small school, 5 novice gladiators and about ${fmtGold(ECON.startCash)}.`)}</p><span class="pill gold">${tx('Zorlu başlangıç', 'Hard start')}</span></div>
        <div class="card choice" data-a="setupExisting"><h3>${Art.icon('squad', 18)} ${tx("Mevcut Ludus'u Yönet", 'Manage an Existing Ludus')}</h3><p class="small">${tx("240 kulüpten birini seç. Kadrosu, bütçesi ve tesisleri korunur. İster en alt ligden, ister Altın Kolezyum'dan başla.", 'Choose one of 240 clubs. Its squad, budget and facilities are kept. Start anywhere from the bottom tier to the Golden Colosseum.')}</p><span class="pill">${tx('Esnek başlangıç', 'Flexible start')}</span></div>
      </div><button class="btn ghost" data-a="titleBack" style="position:relative">${Art.icon('back', 14)} ${tx('Geri', 'Back')}</button></div>`;
    this.drawBG();
  },
  newLudusScreen() {
    const st = this.setup;
    const regCards = REGIONS.map(r => `<div class="card tight choice ${st.reg === r.id ? 'on' : ''}" data-a="setupReg" data-r="${r.id}" style="border-color:${r.pal.a}"><div class="row">${Art.regionSVG(r.id, 30)}<b>${r.name}</b></div><div class="tiny muted mt">${r.desc}</div></div>`).join('');
    const swatches = (key) => CREST_COLORS.map(c => `<span class="swatch ${st.crest[key] === c ? 'on' : ''}" style="background:${c}" data-a="setupCol" data-k="${key}" data-c="${c}"></span>`).join('');
    const shapes = CREST_SHAPES.map((n, i) => `<span class="pick ${st.crest.sh === i ? 'on' : ''}" data-a="setupShape" data-i="${i}" title="${n}">${Art.crestSVG({ ...st.crest, sh: i }, 34)}</span>`).join('');
    const syms = CREST_SYMBOLS.map((n, i) => `<span class="pick ${st.crest.sy === i ? 'on' : ''}" data-a="setupSym" data-i="${i}" title="${n}">${Art.crestSVG({ ...st.crest, sy: i }, 34)}</span>`).join('');
    $('#screen-root').innerHTML = `<div class="setup"><div class="row mb"><button class="btn ghost sm" data-a="setupBack">${Art.icon('back', 14)} ${tx('Geri', 'Back')}</button><h2 style="margin:0">${tx('Yeni Ludus Kur', 'Found a New Ludus')}</h2></div>
      <div class="grid" style="grid-template-columns: minmax(0,1.4fr) minmax(0,1fr)">
        <div class="col">
          <div class="card"><h3>${tx('1. Bölge', '1. Region')}</h3><div class="grid g3">${regCards}</div></div>
          <div class="card"><h3>${tx('2. Kulüp Adı', '2. Club Name')}</h3><input type="text" id="lname" maxlength="28" placeholder="${tx('Örn. Ludus Ferrum', 'e.g. Ludus Ferrum')}" value="${esc(st.name)}" data-in="setupName" style="width:100%"></div>
        </div>
        <div class="col">
          <div class="card"><h3>${tx('3. Arma', '3. Crest')}</h3>
            <div class="row" style="align-items:flex-start"><div id="crestPrev">${Art.crestSVG(st.crest, 110)}</div>
            <div class="col grow"><div class="tiny muted">${tx('Ana renk', 'Main colour')}</div><div class="row wrap gap0">${swatches('c1')}</div><div class="tiny muted">${tx('İkinci renk', 'Second colour')}</div><div class="row wrap gap0">${swatches('c2')}</div></div></div>
            <div class="tiny muted mt">${tx('Şekil', 'Shape')}</div><div class="row wrap gap0">${shapes}</div>
            <div class="tiny muted mt">${tx('Sembol', 'Symbol')}</div><div class="row wrap gap0">${syms}</div>
          </div>
          <button class="btn gold" data-a="setupNewConfirm" style="min-height:3rem">${tx("Ludus'u Kur ve Başla", 'Found the Ludus and Start')} ${Art.icon('next', 16)}</button>
        </div>
      </div></div>`;
  },
  existingScreen() {
    const st = this.setup;
    const ri = GameState.regIdx(st.browseReg);
    const lg = S.leagues[GameState.leagueIndex(ri, st.browseTier)];
    const rows = lg.clubs.map(cid => S.clubs[cid]).sort((a, b) => Squad.avgOvr(b) - Squad.avgOvr(a)).map(c => `<tr class="click ${st.pick === c.id ? 'me' : ''}" data-a="setupPick" data-c="${c.id}">
      <td><span class="row">${H.crest(c, 26)}<b>${esc(c.n)}</b></span></td><td>${POLICIES[c.pol].n}</td><td class="n">${Math.round(c.rep)}</td><td class="n">${fmtGold(c.budget)}</td><td class="n">${H.ovr(Squad.avgOvr(c))}</td><td class="n">${fmtInt(c.fans)}</td></tr>`).join('');
    const pick = st.pick >= 0 ? S.clubs[st.pick] : null;
    $('#screen-root').innerHTML = `<div class="setup"><div class="row mb"><button class="btn ghost sm" data-a="setupBack">${Art.icon('back', 14)} ${tx('Geri', 'Back')}</button><h2 style="margin:0">${tx("Mevcut Ludus'u Yönet", 'Manage an Existing Ludus')}</h2></div>
      <div class="tabs">${REGIONS.map(r => `<span class="tab ${st.browseReg === r.id ? 'on' : ''}" data-a="setupBrowseReg" data-r="${r.id}">${Art.regionSVG(r.id, 16)} ${r.name}</span>`).join('')}</div>
      <div class="tabs">${[1, 2, 3, 4, 5, 6].map(t => `<span class="tab ${st.browseTier === t ? 'on' : ''}" data-a="setupBrowseTier" data-t="${t}">${t}. ${TIERS[t].s}</span>`).join('')}</div>
      <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)">
        <div class="card"><table class="t"><tr><th>${tx('Kulüp', 'Club')}</th><th>${tx('Politika', 'Policy')}</th><th class="n">${tx('İtibar', 'Reputation')}</th><th class="n">${tx('Bütçe', 'Budget')}</th><th class="n">${tx('Kadro Ort.', 'Squad Avg.')}</th><th class="n">${tx('Taraftar', 'Fans')}</th></tr>${rows}</table></div>
        <div class="card">${pick ? `<div class="row">${H.crest(pick, 56)}<div><h3 style="margin:0">${esc(pick.n)}</h3><div class="small muted">${H.reg(pick.reg)} · ${TIERS[pick.tier].n}</div></div></div>
          <div class="kv mt"><span>${tx('Bütçe', 'Budget')}</span><span>${fmtGold(pick.budget)}</span><span>${tx('İtibar', 'Reputation')}</span><span>${Math.round(pick.rep)}</span><span>${tx('Taraftar', 'Fans')}</span><span>${fmtInt(pick.fans)}</span><span>${tx('Tesisler', 'Facilities')}</span><span>${tx('Eğitim', 'Training')} ${pick.fac.train} · ${tx('Revir', 'Infirmary')} ${pick.fac.med} · ${tx('Keşif', 'Scouting')} ${pick.fac.scout} · Arena ${pick.fac.arena}</span><span>${tx('Sezon hedefi', 'Season goal')}</span><span>${H.goal(pick.goal)}</span></div>
          <div class="sep"></div>${GameState.rosterGlads(pick).map(g => `<div class="row small" style="margin:.15rem 0">${H.por(g, 1.6, [pick.crest.c1, pick.crest.c2])}<span class="grow ellip">${esc(g.n)}</span><span class="dim">${CLASSES[g.cls].name}</span>${H.ovr(g.ovr)}</div>`).join('')}
          <button class="btn gold mt" data-a="setupExistingConfirm" style="width:100%;min-height:2.8rem">${tx('Bu Kulübü Yönet', 'Manage This Club')} ${Art.icon('next', 16)}</button>` : `<div class="empty">${tx('Bir kulüp seçin.', 'Select a club.')}</div>`}</div>
      </div></div>`;
  },
  async start(clubId, isNew) {
    WorldGenerator.setPlayer(clubId, isNew);
    S.flags.tut = 0;
    await SaveManager.save();
    UI.enterGame();
    Tutorial.start();
  }
};
