/* FOOTBALL WARS — ARCADE REBORN: ArcadeApp + ArcadeUI + ArcadeMomentum (DOM layer).
 * Screens: Title/Club select · Home · League · Upgrades · Star Packs (Three-Star Draft) · Star Collection ·
 * Challenges · Battle (V4 canvas + Momentum Strike HUD) · Results · Season end / Championship · Settings. */
(function (root) {
'use strict';
const E = root.FWEngine, R = root.FWRender, S = root.FWSprites, F = root.FWFont, D = root.FWDirector, A = root.Arcade, AU = root.ArcadeAudio;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const ROLE_S = { striker: 'ST', winger: 'WG', playmaker: 'PM', defender: 'DF', goalkeeper: 'GK', support: 'SP', captain: 'CP' };
const ROLE_N = { striker: 'Striker', winger: 'Winger', playmaker: 'Playmaker', defender: 'Defender', goalkeeper: 'Goalkeeper', support: 'Support', captain: 'Captain' };
const RAR_N = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
const TIER_N = ['', 'I', 'II', 'III', 'IV'];
const STAT_N = { attack: ['Attack', '⚔️'], defense: ['Defense', '🛡️'], speed: ['Speed', '⚡'], technique: ['Technique', '🎯'], stamina: ['Stamina', '🔋'] };
const ABIL = {
  pressing_storm: ['Pressing Storm', 'Hits and slows the densest enemy cluster, then speeds up nearby teammates.'],
  high_line_interception: ['High Line Interception', 'Nearby defenders, supports and captains read passes and shots: big interception chance.'],
  one_two_combo: ['One-Two Combo', 'Pass, pass, power shot: a piercing finisher with assist bonus.'],
  precision_through_ball: ['Precision Through Ball', 'A piercing through ball that cuts through up to 6 opponents.'],
  counter_burst: ['Counter Burst', 'Teammates around the star sprint forward with a damage burst.'],
  quick_transition: ['Quick Transition', 'Nearby forwards dash at their targets and strike instantly.'],
  iron_wall: ['Iron Wall', 'Shields nearby defenders, keepers and supports and makes them immovable.'],
  last_line_save: ['Last Line Save', 'Rescues badly hurt teammates: big heal + a moment of invulnerability.'],
  shoulder_charge: ['Shoulder Charge', 'A cone of shoulder charges that knocks back and stuns.'],
  stamina_surge: ['Stamina Surge', 'Refills stamina, regenerates and speeds up attacks around the star.'],
  cross_fire: ['Cross Fire', 'Nearest wingers and strikers fire exploding crosses into the box.'],
  flank_overload: ['Flank Overload', 'Nearby wingers get speed, attack rate and critical chance.']
};
const QUALITY = { low: { fx: 0, dpr: 1 }, medium: { fx: 1, dpr: 2 }, high: { fx: 2, dpr: 3 } };
const st = { save: null, tab: 'home', storageOk: true, storageMsg: '', battle: null, sub: { league: 'table', coll: 'all', sort: 'ovr', chDiv: null }, ai: { w: null, job: null, timer: 0 }, crest: new Map(), portrait: new Map() };

// ======================= ArcadeSave persistence =======================
const Store = {
  available() { try { const k = '__fwa_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; } },
  load() {
    let raw = null, bak = null;
    try { raw = localStorage.getItem(A.Save.KEY); bak = localStorage.getItem(A.Save.BAK); } catch (e) { st.storageOk = false; st.storageMsg = 'Browser storage is blocked: progress cannot be saved in this browser.'; return null; }
    for (const [txt, which] of [[raw, 'main'], [bak, 'backup']]) {
      if (!txt) continue;
      try { const s = A.Save.parse(txt); if (which === 'backup') toast('Main save was damaged — restored the previous safe backup.', 'gold'); return s; } catch (e) { console.warn('save ' + which + ' invalid', e); }
    }
    if (raw) toast('Saved career could not be read (damaged). Starting fresh is possible; you can also import a save file.', 'bad');
    return null;
  },
  write() {
    const s = st.save; if (!s) return;
    try {
      const j = A.Save.serialize(s);
      const prev = localStorage.getItem(A.Save.KEY);
      if (prev && prev !== j) localStorage.setItem(A.Save.BAK, prev);
      localStorage.setItem(A.Save.KEY, j);
      if (!st.storageOk) { st.storageOk = true; st.storageMsg = ''; }
    } catch (e) {
      if (st.storageOk) toast('Saving failed (' + (e && e.name || 'storage error') + '). Export your save from Settings!', 'bad');
      st.storageOk = false; st.storageMsg = 'Progress is NOT being saved (storage full or blocked). Use Settings → Export Save.';
    }
  }
};
function persist() { pruneClaims(st.save); Store.write(); }
function pruneClaims(s) { // keep the claim ledger small: old-season fixture/AI claims are dead once the season changed
  const cur = s.league ? s.league.seasonId : '';
  const pb = s.pendingBattle ? 'contract:' + s.pendingBattle.snap.battleId : '';
  for (const k in s.claims) {
    if ((k.startsWith('ai:') || k.startsWith('fx:')) && k.indexOf(':' + cur + ':') < 0 && !k.startsWith('ai:' + cur) && !k.startsWith('fx:' + cur)) delete s.claims[k];
    else if (k.startsWith('contract:') && k !== pb && s.claims[k] < s.txn - 50) delete s.claims[k];
  }
}

// ======================= helpers: toast / modal / crest / portrait =======================
function toast(text, cls, ms) { const box = $('toast'); if (!box) return; const d = document.createElement('div'); d.className = cls || ''; d.textContent = text; box.appendChild(d); setTimeout(() => d.remove(), ms || 2600); }
function modal(html, onClick) {
  const m = $('modal'); m.innerHTML = '<div class="sheet">' + html + '</div>'; m.classList.remove('hidden');
  m.onclick = e => { if (e.target === m) closeModal(); const b = e.target.closest('[data-m]'); if (b && onClick) onClick(b.dataset.m, b); };
}
function closeModal() { const m = $('modal'); m.classList.add('hidden'); m.innerHTML = ''; m.onclick = null; }
function teamObj(id) { const c = A.club(id); return { id: c.id, name: c.displayName, visual: c.src.visual, type: 'club' }; }
function crestCv(id, size, gold) {
  const key = id + ':' + size + ':' + (gold ? 1 : 0);
  let cv = st.crest.get(key); if (cv) return cv;
  const base = S.generatedCrest(teamObj(id), size);
  if (gold) { const g = base.getContext('2d'); const b = Math.max(1, Math.round(size / 20)); g.strokeStyle = '#ffcf3f'; g.lineWidth = b * 2; g.strokeRect(b, b, size - 2 * b, size - 2 * b); g.fillStyle = '#fff6c8'; g.fillRect(size / 2 - b, 0, b * 2, b * 2); }
  st.crest.set(key, base); return base;
}
function crestImg(id, size, cls) { const gold = st.save && id === st.save.club && st.save.goldenCrest; return '<img class="crest ' + (cls || '') + '" width="' + size + '" height="' + size + '" src="' + crestCv(id, 64, gold).toDataURL() + '" alt="">'; }
function crestURL(id) { const gold = st.save && id === st.save.club && st.save.goldenCrest; const k = 'u:' + id + gold; let u = st.crest.get(k); if (!u) { u = crestCv(id, 64, gold).toDataURL(); st.crest.set(k, u); } return u; }
function cimg(id, size) { return '<img class="crest" style="width:' + size + 'px;height:' + size + 'px" src="' + crestURL(id) + '" alt="">'; }
const SKIN = ['#f1c9a5', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e', '#ffdbac'];
const HAIR = ['#1b1b1b', '#3b2412', '#6b4423', '#c9a15a', '#e8e2d0', '#a33a1a', '#2a2a5a'];
const RCOL = { common: ['#55607a', '#2a3350'], rare: ['#2d6fb3', '#10264a'], epic: ['#8b4fd0', '#2a1050'], legendary: ['#ffcf3f', '#7a4a00'] };
function portrait(id) {
  let u = st.portrait.get(id); if (u) return u;
  const d = A.Stars.def(id), h = d.look, c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d');
  const rc = RCOL[d.rarity]; const gr = g.createLinearGradient(0, 0, 0, 24); gr.addColorStop(0, rc[0]); gr.addColorStop(1, rc[1]); g.fillStyle = gr; g.fillRect(0, 0, 24, 24);
  const skin = SKIN[h % SKIN.length], hair = HAIR[(h >>> 3) % HAIR.length], kit = ['#e63946', '#1d3557', '#2a9d8f', '#f4a261', '#ffffff', '#111111', '#7b2cbf'][(h >>> 6) % 7];
  g.fillStyle = kit; g.fillRect(4, 18, 16, 6); g.fillStyle = '#ffffff55'; g.fillRect(10, 18, 4, 2);
  g.fillStyle = skin; g.fillRect(10, 15, 4, 3); g.fillRect(7, 6, 10, 10); g.fillRect(6, 9, 1, 3); g.fillRect(17, 9, 1, 3);
  const hs = (h >>> 9) % 5; g.fillStyle = hair;
  if (hs === 0) { g.fillRect(7, 4, 10, 3); g.fillRect(6, 5, 1, 4); g.fillRect(17, 5, 1, 4); }
  else if (hs === 1) { g.fillRect(7, 5, 10, 2); }
  else if (hs === 2) { g.fillRect(6, 3, 12, 4); g.fillRect(5, 5, 2, 7); g.fillRect(17, 5, 2, 7); }
  else if (hs === 3) { g.fillRect(9, 2, 6, 4); g.fillRect(7, 5, 10, 1); }
  else { g.fillRect(7, 5, 10, 2); g.fillRect(7, 14, 10, 2); g.fillRect(8, 13, 8, 1); }
  g.fillStyle = '#0b0d16'; g.fillRect(9, 10, 2, 2); g.fillRect(13, 10, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(9, 10, 1, 1); g.fillRect(13, 10, 1, 1);
  g.fillStyle = '#00000055'; g.fillRect(10, 13, 4, 1);
  if ((h >>> 12) % 3 === 0) { g.fillStyle = hair; g.fillRect(8, 13, 8, 1); }
  if (d.rarity === 'legendary') { g.fillStyle = '#fff6c8'; g.fillRect(1, 1, 2, 2); g.fillRect(21, 1, 2, 2); }
  u = c.toDataURL(); st.portrait.set(id, u); return u;
}
function rarityPill(r) { return '<span class="pill r-' + r + '" style="border-color:currentColor">' + RAR_N[r] + '</span>'; }
function starCardHTML(id, ovr, contract, opts) {
  const d = A.Stars.def(id); opts = opts || {};
  const cls = ['sc', d.rarity, contract <= 0 && !opts.draft ? 'expired' : '', opts.active ? 'act' : '', opts.sel ? 'sel' : '', opts.anim ? 'flip' : ''].join(' ');
  return '<div class="' + cls + '" data-star="' + id + '" ' + (opts.attr || '') + ' style="' + (opts.style || '') + '">' +
    '<img class="pt" src="' + portrait(id) + '" alt=""><div class="ovr r-' + d.rarity + '">' + ovr + '<small>' + ROLE_S[d.role] + '</small></div>' +
    '<div class="rb">' + (opts.dup ? '<span class="pill gold">DUP</span>' : '') + '</div>' +
    '<div class="nm">' + esc(d.name) + '</div><div class="ab">' + esc(ABIL[d.ability][0]) + ' ' + TIER_N[A.Stars.TIER[d.rarity]] + '</div>' +
    '<div class="ct"><span class="r-' + d.rarity + '">' + RAR_N[d.rarity] + '</span><span>' + (contract > 0 || opts.draft ? '📝 ' + contract : 'EXPIRED') + '</span></div></div>';
}
function rewardLine(r) {
  if (!r) return '';
  const p = [];
  if (r.credits) p.push('<b class="gold-t">+' + fmt(r.credits) + ' C</b>'); if (r.xp) p.push('<b class="mint">+' + r.xp + ' XP</b>'); if (r.frags) p.push('<b style="color:#8ff3ff">+' + r.frags + ' F</b>');
  for (const k in r.packs || {}) p.push('<b>+' + r.packs[k] + ' ' + k + ' pack</b>');
  for (const k in r.tickets || {}) p.push('<b>+' + r.tickets[k] + ' ' + (k === 't10' ? '+10' : '+5') + ' ticket</b>');
  if (r.crest) p.push('<b class="gold-t">Golden Team Crest</b>');
  return p.join(' · ');
}

// ======================= top bar / tab bar =======================
function renderTop() {
  const s = st.save; const tb = $('topbar');
  if (!s) { tb.classList.add('hidden'); $('tabbar').classList.add('hidden'); return; }
  tb.classList.remove('hidden'); $('tabbar').classList.remove('hidden');
  const c = A.club(s.club), pr = A.Progression.progress(s);
  tb.innerHTML = '<img class="crest" src="' + crestURL(s.club) + '" alt=""><div class="who"><b>' + esc(c.displayName) + '</b><small>Div ' + s.division + ' · Lv ' + s.level +
    '</small><div class="bar" style="height:4px;margin-top:3px;max-width:150px"><i style="width:' + Math.round(pr.pct * 100) + '%"></i></div></div>' +
    '<span class="cur"><i class="c">C</i>' + fmt(s.credits) + '</span><span class="cur"><i class="f"><span>F</span></i>' + fmt(s.fragments) + '</span>' +
    '<button class="iconbtn" data-act="settings" aria-label="Settings">⚙️</button>';
  const badge = (k, n) => { const b = document.querySelector('#tabbar [data-tab="' + k + '"] .badge'); if (b) { b.textContent = n; b.classList.toggle('hidden', !n); } };
  badge('packs', (s.pendingDraft ? 1 : 0) + s.packs.standard + (A.Draft.unlocked(s, 'premium') ? s.packs.premium : 0) + (A.Draft.unlocked(s, 'legend') ? s.packs.legend : 0));
  const affordable = A.Upgrades.KEYS.filter(k => { const c2 = A.Upgrades.cost(s.upgrades[k]); return c2 != null && s.credits >= c2; }).length;
  badge('upgrades', affordable);
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === st.tab));
}
function render() {
  renderTop();
  const scr = $('screen');
  if (!st.save) { scr.innerHTML = titleHTML(); bindTitle(); return; }
  const warn = st.storageOk ? '' : '<div class="warnbar">⚠️ ' + esc(st.storageMsg) + '</div>';
  const map = { home: homeHTML, league: leagueHTML, upgrades: upgradesHTML, packs: packsHTML, stars: starsHTML, challenges: challengesHTML };
  scr.innerHTML = warn + (map[st.tab] || homeHTML)();
}
function go(tab) { st.tab = tab; render(); window.scrollTo(0, 0); }

// ======================= Title / new career =======================
let pickClub = null, clubFilter = '';
function titleHTML() {
  const has = !!st.loadedNone;
  return '<div class="titlescr"><canvas id="logoCv" width="360" height="120"></canvas>' +
    '<p class="dim small" style="margin:6px 0 14px">100 VS 100 FOOTBALL BATTLE — FAST, CHAOTIC, REWARDING.</p>' +
    (st.storageOk ? '' : '<div class="warnbar">⚠️ ' + esc(st.storageMsg || 'Storage unavailable') + '</div>') +
    '<div class="card" style="text-align:left"><div class="title" style="margin-top:0">Choose your club <span class="sp"></span><span class="pill">200 clubs</span></div>' +
    '<input class="search" id="clubSearch" placeholder="Search club, city or country…" value="' + esc(clubFilter) + '" autocomplete="off">' +
    '<div class="clublist" id="clubList" style="margin-top:8px"></div>' +
    '<p class="note">Every career starts in <b>Division 10</b>. Your club keeps its identity and colours; strength comes from your upgrades and stars.</p>' +
    '<button class="btn gold block" id="startBtn" disabled>START CAREER</button>' +
    '<div class="row" style="margin-top:8px"><button class="btn sm ghost grow" data-act="import">Import save file</button></div></div>' +
    '<p class="note">Independent fan-made arcade game. Club names are adapted; crests and kits are original pixel art — no official logos, sponsors, licensed kits or real player names/portraits. ' + (has ? '' : '') + '</p></div>';
}
function bindTitle() {
  const cv = $('logoCv'); if (cv) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; F.draw(g, 'FOOTBALL WARS', 180, 22, { scale: 4, bold: true, color: '#ffffff', color2: '#ffcf3f', align: 'center' }); F.draw(g, 'ARCADE REBORN', 180, 72, { scale: 3, bold: true, color: '#3df2b5', color2: '#1fbf8c', align: 'center' }); }
  const list = $('clubList'), inp = $('clubSearch');
  const draw = () => {
    const q = clubFilter.trim().toLowerCase();
    const all = A.clubs().slice().sort((a, b) => (a.country + a.displayName).localeCompare(b.country + b.displayName));
    const rows = all.filter(c => !q || (c.displayName + ' ' + c.sourceName + ' ' + c.country + ' ' + (c.src.search_aliases || []).join(' ')).toLowerCase().indexOf(q) >= 0);
    list.innerHTML = rows.map(c => '<button class="clubrow' + (pickClub === c.id ? ' sel' : '') + '" data-club="' + c.id + '">' + cimg(c.id, 32) + '<div><b>' + esc(c.displayName) + '</b><div class="tiny dim">' + esc(c.country) + ' · ' + esc(leagueName(c.league)) + '</div></div><span class="pill">' + esc(c.archetype.replace('_', ' ')) + '</span></button>').join('') || '<p class="dim small">No club found.</p>';
  };
  draw();
  inp.oninput = () => { clubFilter = inp.value; draw(); };
  list.onclick = e => { const b = e.target.closest('[data-club]'); if (!b) return; pickClub = b.dataset.club; AU.init(); AU.ui(); draw(); $('startBtn').disabled = false; $('startBtn').textContent = 'START CAREER — ' + A.club(pickClub).displayName.toUpperCase(); };
  $('startBtn').onclick = () => {
    if (!pickClub) return;
    const a = new Uint32Array(1); (root.crypto || { getRandomValues: x => { x[0] = Date.now() >>> 0; } }).getRandomValues(a);
    st.save = A.Save.fresh(pickClub, a[0] || 1); persist(); AU.init(); AU.ui('coin'); st.tab = 'home'; render(); startAI();
    toast('Welcome to Division 10, ' + A.club(pickClub).displayName + '!', 'gold');
  };
}
function leagueName(id) { const L = (root.FW_MASTER_DB.leagues || []).concat(root.ArcadeData.EXTRA_LEAGUES).find(l => l.id === id); return L ? L.name : id; }

// ======================= Home =======================
function nextAction() {
  const s = st.save, L = s.league;
  if (s.pendingBattle) return { label: 'RESUME BATTLE', sub: s.pendingBattle.snap.label, act: 'resume' };
  if (s.pendingDecision) return { label: 'REMATCH', sub: 'Free rematch — or accept the loss', act: 'rematch' };
  if (L.phase === 'regular') {
    if (L.round < 19) { const fx = A.League.playerFixture(s); return { label: 'BATTLE', sub: 'Match ' + (L.round + 1) + '/19 · vs ' + A.club(fx.opp).displayName, act: 'league', quick: true }; }
    return { label: 'FINISHING SEASON', sub: 'Simulating last round · ' + L.aiQueue.length + ' AI matches left', act: 'wait', disabled: true };
  }
  if (L.phase === 'promoted') return { label: 'PROMOTION!', sub: 'Advance to Division ' + (L.div - 1), act: 'promote' };
  if (L.phase === 'promo') { const P = s.promo && s.promo.season === L.seasonId && !s.promo.done ? s.promo : null; return { label: P ? 'PROMOTION GAME ' + (P.games.length + 1) : 'PROMOTION CHALLENGE', sub: P ? 'Best of 3 · ' + P.wins + 'W ' + P.losses + 'L' : 'Best of 3 vs Division ' + (L.div - 1) + ' sides', act: 'promo' }; }
  if (L.phase === 'ended') return { label: 'NEW SEASON', sub: 'Endless Champions League · Season ' + (s.endless.seasons + 1), act: 'newseason' };
  return { label: 'BATTLE', act: 'none', disabled: true };
}
function homeHTML() {
  const s = st.save, L = s.league, c = A.club(s.club), na = nextAction();
  const power = A.Upgrades.power(s), pr = A.Progression.progress(s);
  let opp = '';
  if (L.phase === 'regular' && L.round < 19) {
    const fx = A.League.playerFixture(s), r = A.League.rating(s, fx.opp, L.div, L.seasonId);
    opp = '<div class="card"><div class="tiny dim" style="text-align:center;font-weight:800;letter-spacing:.08em">NEXT OPPONENT · ' + (L.div === 1 ? 'CHAMPIONS LEAGUE' : 'DIVISION ' + L.div) + ' · MATCH ' + (L.round + 1) + '/19</div>' +
      '<div class="vs" style="margin-top:8px"><div>' + cimg(s.club, 56) + '<div class="nm">' + esc(c.displayName) + '</div><div class="pw">PWR ' + power.toFixed(1) + '</div></div><div class="mid">VS</div>' +
      '<div>' + cimg(fx.opp, 56) + '<div class="nm">' + esc(A.club(fx.opp).displayName) + '</div><div class="pw">PWR ' + r.toFixed(1) + (L.tactics && L.tactics[fx.opp] ? ' · ' + L.tactics[fx.opp].replace('_', ' ') : '') + '</div></div></div></div>';
  } else if (L.phase === 'promo' && s.promo && !s.promo.done && s.promo.season === L.seasonId) {
    const o = s.promo.opps[s.promo.games.length], r = A.League.rating(s, o, L.div - 1, L.seasonId);
    opp = '<div class="card gold"><div class="tiny gold-t" style="text-align:center;font-weight:800">PROMOTION CHALLENGE · GAME ' + (s.promo.games.length + 1) + ' · ' + s.promo.games.join(' ') + '</div><div class="vs" style="margin-top:8px"><div>' + cimg(s.club, 56) + '<div class="nm">' + esc(c.displayName) + '</div><div class="pw">PWR ' + power.toFixed(1) + '</div></div><div class="mid">VS</div><div>' + cimg(o, 56) + '<div class="nm">' + esc(A.club(o).displayName) + '</div><div class="pw">PWR ' + r.toFixed(1) + '</div></div></div></div>';
  }
  const act = s.active.map(id => s.stars[id]).filter(Boolean);
  const slots = [0, 1, 2, 3, 4].map(i => { const x = act[i]; if (!x) return '<div class="slot" data-act="tab:stars">+<br>Star slot</div>'; const d = A.Stars.def(x.id); return '<div class="slot f" data-act="tab:stars" style="border-color:' + RCOL[d.rarity][0] + '"><img src="' + portrait(x.id) + '" alt=""><b>' + esc(d.name.split(' ')[1] || d.name) + '</b><span class="tiny">' + x.ovr + ' · ' + x.contract + '📝</span></div>'; }).join('');
  const aiInfo = L.aiQueue.length ? '<div class="tiny dim" style="text-align:center;margin-top:6px">⚙️ Simulating ' + L.aiQueue.length + ' AI league match' + (L.aiQueue.length > 1 ? 'es' : '') + ' (real 100 vs 100)…</div>' : '';
  const alerts = [];
  if (s.pendingDraft) alerts.push('<button class="btn gold block" data-act="tab:packs">⭐ Your draft is waiting — pick a star!</button>');
  const inv = s.packs.standard + (A.Draft.unlocked(s, 'premium') ? s.packs.premium : 0) + (A.Draft.unlocked(s, 'legend') ? s.packs.legend : 0);
  if (!s.pendingDraft && inv) alerts.push('<button class="btn mint block" data-act="tab:packs">🎁 ' + inv + ' unopened pack' + (inv > 1 ? 's' : '') + '</button>');
  const expired = act.length < s.active.length;
  return alerts.join('') + opp +
    '<button class="battle-btn" data-act="' + na.act + '"' + (na.disabled ? ' disabled' : '') + '>' + esc(na.label) + '<small>' + esc(na.sub || '') + '</small></button>' +
    (na.quick ? '<div class="row" style="margin-top:8px"><button class="btn sm ghost grow" data-act="quick">⏩ Quick Simulate</button><button class="btn sm ghost grow" data-act="tab:league">📊 Table</button></div>' : '') +
    (na.act === 'rematch' ? '<button class="btn sm ghost block" style="margin-top:8px" data-act="acceptloss">Accept the loss</button>' : '') +
    (L.phase === 'promo' && !(s.promo && !s.promo.done && s.promo.season === L.seasonId) ? '<button class="btn sm ghost block" style="margin-top:8px" data-act="replayseason">↻ Replay Division ' + L.div + ' season instead</button>' : '') +
    aiInfo +
    '<div class="title">Squad <span class="sp"></span><span class="pill mint">' + act.length + '/5 stars</span></div>' +
    '<div class="card"><div class="row"><div class="grow"><div class="tiny dim" style="font-weight:800">STANDARD SQUAD POWER</div><div style="font-size:26px;font-weight:900" class="mono">' + power.toFixed(1) + '</div></div>' +
    '<div style="text-align:right"><div class="tiny dim" style="font-weight:800">TEAM LEVEL ' + s.level + (s.level >= 50 ? ' (MAX)' : '') + '</div><div class="bar gold" style="width:140px;margin-top:6px"><i style="width:' + Math.round(pr.pct * 100) + '%"></i></div><div class="tiny dim" style="margin-top:3px">' + (s.level >= 50 ? 'Max level' : pr.cur + ' / ' + pr.need + ' XP') + '</div></div></div>' +
    '<div class="slots" style="margin-top:10px">' + slots + '</div>' + (expired ? '<p class="note coral">Some active stars ran out of contract — renew them in Stars.</p>' : '') + '</div>' +
    '<div class="grid3">' +
    '<button class="tile" data-act="tab:upgrades"><span class="ic">⬆️</span>Upgrades</button>' +
    '<button class="tile" data-act="tab:packs"><span class="ic">🎁</span>Star Packs</button>' +
    '<button class="tile" data-act="tab:stars"><span class="ic">⭐</span>Collection</button>' +
    '<button class="tile" data-act="tab:league"><span class="ic">🏆</span>League</button>' +
    '<button class="tile" data-act="tab:challenges"><span class="ic">🎯</span>Challenges' + (A.Challenges.unlocked(s, s.division) ? '' : '<span class="tiny dim">locked</span>') + '</button>' +
    '<button class="tile" data-act="settings"><span class="ic">⚙️</span>Settings</button></div>' +
    '<div class="card small"><div class="row wrap" style="gap:6px"><span class="pill">🎟 +5 × ' + s.tickets.t5 + '</span><span class="pill">🎟 +10 × ' + s.tickets.t10 + '</span><span class="pill">Battles ' + s.stats.battles + '</span><span class="pill mint">W ' + s.stats.wins + '</span><span class="pill coral">L ' + s.stats.losses + '</span>' + (s.endless.titles ? '<span class="pill gold">🏆 ×' + s.endless.titles + '</span>' : '') + (s.goldenCrest ? '<span class="pill gold">Golden Crest</span>' : '') + '</div></div>';
}

// ======================= League =======================
function leagueHTML() {
  const s = st.save, L = s.league, sub = st.sub.league;
  const seg = '<div class="seg">' + [['table', 'Table'], ['fixtures', 'Fixtures'], ['history', 'History']].map(([k, n]) => '<button data-act="lsub:' + k + '" class="' + (sub === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div>';
  let body = '';
  if (sub === 'table') {
    const t = A.League.table(s);
    body = '<div class="card" style="padding:6px 8px"><table class="lg"><tr><th>#</th><th class="nm">Club</th><th>P</th><th>W</th><th>L</th><th>GD</th><th>PWR</th><th>Pts</th></tr>' +
      t.map((r, i) => { const z = L.div === 1 ? (i === 0 ? 'z1' : i < 3 ? 'z2' : i < 10 ? 'z3' : '') : (i === 0 ? 'z1' : i < 3 ? 'z2' : ''); return '<tr class="' + (r.id === s.club ? 'me' : '') + '"><td class="pos ' + z + '">' + (i + 1) + '</td><td class="nm">' + cimg(r.id, 18) + esc(A.club(r.id).displayName) + '</td><td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.l + '</td><td>' + (r.gf - r.ga >= 0 ? '+' : '') + (r.gf - r.ga) + '</td><td class="dim">' + A.League.rating(s, r.id, L.div, L.seasonId).toFixed(0) + '</td><td><b>' + r.pts + '</b></td></tr>'; }).join('') + '</table>' +
      '<p class="note">' + (L.div === 1 ? '🥇 1st: champions (10,000 C + Premium Pack + +10 ticket) · 2–3: 6,000 C + +5 ticket · 4–10: 2,000 C. No relegation.' : '🥇 1st: champions, promoted (5× win credits) · 🟢 2–3: promoted (3×) · 4–20: Promotion Challenge (best of 3, 2× on success). No relegation.') + ' Win = 3 pts. Ties: wins → goal difference → survivors.</p></div>';
  } else if (sub === 'fixtures') {
    let h = '';
    for (let r = 0; r < 19; r++) {
      const ms = L.rounds[r]; const pr = ms.find(m => m[0] === s.club || m[1] === s.club);
      h += '<div class="card" style="padding:8px 10px"><div class="tiny dim" style="font-weight:800;margin-bottom:2px">ROUND ' + (r + 1) + (r === L.round && L.phase === 'regular' ? ' · <span class="mint">NEXT</span>' : '') + '</div>';
      for (const m of [pr].concat(ms.filter(x => x !== pr))) {
        const id = A.League.fixtureId(L, r, m[0], m[1]), res = L.results[id];
        const sc = res ? res.ga + ' - ' + res.gb : (L.aiQueue.indexOf(id) >= 0 ? '…' : 'vs');
        const me = m === pr;
        h += '<div class="fx' + (me ? ' me' : '') + '"><div class="a' + (res && res.winner === 0 ? ' w' : '') + '">' + esc(A.club(m[0]).displayName) + ' ' + cimg(m[0], 16) + '</div><div class="s">' + sc + '</div><div class="' + (res && res.winner === 1 ? 'w' : '') + '">' + cimg(m[1], 16) + ' ' + esc(A.club(m[1]).displayName) + '</div></div>';
        if (!me && r > L.round + 1) break;
      }
      h += '</div>';
    }
    body = '<p class="note">Every AI fixture is a real headless 100 vs 100 Football Fusion battle (no fake results). Winner = last team standing; goals decide ties in the table.</p>' + h;
  } else {
    const hs = s.history.slice().reverse();
    body = '<div class="card">' + (hs.length ? hs.map(h => '<div class="fx"><div class="a">' + esc(h.season) + '</div><div class="s">#' + h.rank + '</div><div>' + esc(h.outcome) + '</div></div>').join('') : '<p class="dim small">No completed seasons yet.</p>') + '</div>' +
      '<div class="card small"><div class="kv"><dt>Official fixtures played</dt><dd>' + s.officialPlayed + '</dd><dt>Highest division</dt><dd>' + s.highestDiv + '</dd><dt>Champions League seasons</dt><dd>' + s.endless.seasons + '</dd><dt>Champions League titles</dt><dd>' + s.endless.titles + '</dd><dt>Goals scored</dt><dd>' + s.stats.goals + '</dd><dt>Momentum Strikes (Perfect)</dt><dd>' + s.stats.strikes + ' (' + s.stats.perfects + ')</dd></div></div>';
  }
  return '<div class="title">' + (L.div === 1 ? 'Champions League' : 'Division ' + L.div) + ' <span class="sp"></span><span class="pill">' + esc(L.seasonId) + '</span></div>' + seg + '<div style="height:8px"></div>' + body;
}

// ======================= Upgrades =======================
function upgradesHTML() {
  const s = st.save, sts = A.Upgrades.stats(s), at = A.Upgrades.attributes(sts);
  return '<div class="title">Team Upgrades <span class="sp"></span><span class="pill gold">' + fmt(s.credits) + ' C</span></div>' +
    '<div class="card"><div class="row"><div class="grow"><div class="tiny dim" style="font-weight:800">STANDARD SQUAD POWER</div><div class="mono" style="font-size:28px;font-weight:900">' + A.Upgrades.power(s).toFixed(1) + '</div></div><div class="tiny dim" style="text-align:right">Permanent · never reset<br>Max level 30 per stat</div></div></div>' +
    A.Upgrades.KEYS.map(k => {
      const L = s.upgrades[k], c = A.Upgrades.cost(L), v = sts[k];
      return '<div class="card up"><div class="ic">' + STAT_N[k][1] + '</div><div><div style="font-weight:900">' + STAT_N[k][0] + ' <span class="lv">Lv.' + L + '/30</span></div><div class="v">' + v.toFixed(1) + (c != null ? ' <span class="mint tiny">→ ' + (v + 1.65).toFixed(1) + '</span>' : '') + '</div><div class="bar" style="margin-top:5px"><i style="width:' + (L / 30 * 100) + '%"></i></div></div>' +
        (c == null ? '<span class="pill gold">MAX</span>' : '<button class="btn sm ' + (s.credits >= c ? 'gold' : '') + '" data-act="up:' + k + '"' + (s.credits >= c ? '' : ' disabled') + '>+ ' + fmt(c) + ' C</button>') + '</div>';
    }).join('') +
    '<div class="card small"><div class="tiny dim" style="font-weight:800;margin-bottom:6px">REAL BATTLE ATTRIBUTES (V4 ENGINE)</div><div class="kv">' + E.ATTRS.map(k => '<dt>' + k + '</dt><dd>' + at[k].toFixed(1) + '</dd>').join('') + '</div><p class="note">Attack → attack · Defense → defense · Speed → speed · Technique → technique · Stamina → stamina; pressing, teamwork, physical, goalkeeping and finishing blend two or three stats. Squad Power is the engine power index used against your opponent.</p></div>';
}

// ======================= Packs / Draft =======================
function packsHTML() {
  const s = st.save;
  const P = A.PACKS;
  const card = (k, name, odds) => {
    const lock = !A.Draft.unlocked(s, k), p = P[k];
    return '<div class="card pack"><div class="art pk-' + k + '">' + name.toUpperCase() + '</div><div><div class="row"><b class="grow">' + name + ' Draft Pack</b>' + (s.packs[k] ? '<span class="pill mint">' + s.packs[k] + ' owned</span>' : '') + '</div>' +
      '<div class="tiny dim" style="margin:3px 0 8px">' + odds + '</div>' +
      (lock ? '<span class="pill coral">🔒 Unlocks in Division ' + p.unlockDiv + '</span>' + (s.packs[k] ? ' <span class="tiny dim">(kept in inventory)</span>' : '') :
        '<div class="row wrap" style="gap:6px"><button class="btn sm gold" data-act="open:' + k + ':credits"' + (s.credits >= p.credits && !s.pendingDraft ? '' : ' disabled') + '>' + fmt(p.credits) + ' C</button>' +
        '<button class="btn sm" data-act="open:' + k + ':frags"' + (s.fragments >= p.frags && !s.pendingDraft ? '' : ' disabled') + '>' + p.frags + ' F</button>' +
        (s.packs[k] ? '<button class="btn sm mint" data-act="open:' + k + ':inventory"' + (s.pendingDraft ? ' disabled' : '') + '>Open owned</button>' : '') + '</div>') + '</div></div>';
  };
  return (s.pendingDraft ? '<button class="btn gold block" data-act="draft">⭐ Continue your draft (3 candidates waiting)</button>' : '') +
    '<div class="title">Three-Star Draft Packs <span class="sp"></span><span class="pill gold">' + fmt(s.credits) + ' C</span><span class="pill">' + s.fragments + ' F</span></div>' +
    '<p class="note" style="margin-top:0">Each pack shows <b>3 different stars</b> (at least 2 positions). You sign exactly <b>one</b>. Pay with Credits <i>or</i> Pack Fragments. Star OVR scales with the highest Division you reached (now ' + s.highestDiv + ').</p>' +
    card('standard', 'Standard', 'Cards 1–2: Common 70 · Rare 26 · Epic 3.5 · Legendary 0.5 % — Card 3: Rare 85 · Epic 14 · Legendary 1 %') +
    card('premium', 'Premium', 'Cards 1–2: Common 20 · Rare 58 · Epic 20 · Legendary 2 % — Card 3: Epic 92 · Legendary 8 %. Legendary guaranteed by the 10th pack.') +
    card('legend', 'Legend', 'Cards 1–2: Rare 55 · Epic 38 · Legendary 7 % — Card 3: Epic 75 · Legendary 25 %. Legendary guaranteed by the 4th pack.') +
    '<div class="card small"><div class="kv"><dt>Premium pity (packs without a Legendary)</dt><dd>' + s.pity.premium + ' / 9</dd><dt>Legend pity</dt><dd>' + s.pity.legend + ' / 3</dd><dt>Contract tickets</dt><dd>+5 × ' + s.tickets.t5 + ' · +10 × ' + s.tickets.t10 + '</dd><dt>Packs opened</dt><dd>' + s.packCounter + '</dd></div>' +
    '<p class="note">Contract tickets come from Team Level milestones, promotions, completing divisions and the Challenge Board. Use them on any star in the Collection.</p></div>';
}
let draftSel = 0;
function showDraft(animate) {
  const s = st.save, Dd = s.pendingDraft; if (!Dd) return;
  let box = $('draftBox'); if (!box) { box = document.createElement('div'); box.id = 'draftBox'; box.className = 'draft'; document.body.appendChild(box); }
  const drawCards = (anim) => {
    const c = Dd.cands[draftSel], d = A.Stars.def(c.id), owned = s.stars[c.id];
    box.innerHTML = '<div style="text-align:center;margin-bottom:10px"><div class="tiny dim" style="font-weight:900;letter-spacing:.14em">' + Dd.type.toUpperCase() + ' DRAFT PACK' + (Dd.pityHit ? ' · PITY LEGENDARY' : '') + '</div><h2 style="font-size:20px;margin-top:2px">CHOOSE ONE STAR</h2></div>' +
      '<div class="cards">' + Dd.cands.map((x, i) => starCardHTML(x.id, x.ovr, x.contract, { draft: true, dup: x.dup, sel: i === draftSel, anim, attr: 'data-pick="' + i + '"', style: anim ? 'animation-delay:' + (i * 0.18) + 's' : '' })).join('') + '</div>' +
      '<div class="det card ' + d.rarity + '"><div class="row"><img src="' + portrait(c.id) + '" style="width:56px;height:56px;image-rendering:pixelated;border-radius:10px" alt=""><div class="grow"><div style="font-weight:900;font-size:16px">' + esc(d.name) + (d.nick ? ' <span class="tiny dim">“' + esc(d.nick) + '”</span>' : '') + '</div><div class="small">' + rarityPill(d.rarity) + ' <span class="pill">' + ROLE_N[d.role] + '</span> <span class="pill gold">OVR ' + c.ovr + '</span></div></div></div>' +
      '<div style="margin-top:8px"><b>' + esc(ABIL[d.ability][0]) + ' ' + TIER_N[A.Stars.TIER[d.rarity]] + '</b> <span class="tiny dim">(auto, max 2 uses per battle)</span><div class="small dim">' + esc(ABIL[d.ability][1]) + '</div></div>' +
      '<div class="small" style="margin-top:6px">📝 Contract: <b>' + c.contract + ' matches</b>' + (owned ? ' — <span class="gold-t">DUPLICATE: adds to your existing card (' + owned.contract + ' → ' + (owned.contract + c.contract) + '), OVR stays ' + owned.ovr + '</span>' : '') + '</div>' +
      '<button class="btn gold block" style="margin-top:10px" data-sign="1">SIGN ' + esc(d.name.toUpperCase()) + '</button></div>';
  };
  draftSel = Math.min(draftSel, 2);
  if (animate) {
    const ov = document.createElement('div'); ov.className = 'opening';
    const col = { standard: '#5a8cff', premium: '#c77dff', legend: '#ffcf3f' }[Dd.type];
    ov.innerHTML = '<div class="pk pk-' + Dd.type + '" style="color:' + col + '">' + Dd.type.toUpperCase() + '</div><div class="skiphint">tap to skip</div>';
    document.body.appendChild(ov);
    AU.play('pack_' + Dd.type, 0.7); AU.vibrate(30);
    let done = false;
    const finish = () => {
      if (done) return; done = true; ov.remove(); drawCards(true);
      const best = Dd.cands.reduce((m, x) => Math.max(m, A.RARITIES.indexOf(x.rarity)), 0);
      AU.play('rev_' + A.RARITIES[best], 0.7); if (best >= 3) AU.vibrate([40, 40, 80]);
    };
    ov.onclick = finish; setTimeout(() => { if (!done) { const b = document.createElement('div'); b.className = 'burst'; b.style.background = col; ov.appendChild(b); } }, 1700); setTimeout(finish, 2400);
  } else drawCards(false);
  box.onclick = e => {
    const p = e.target.closest('[data-pick]'); if (p) { draftSel = +p.dataset.pick; AU.ui(); drawCards(false); return; }
    if (e.target.closest('[data-sign]')) {
      const res = A.Draft.pick(st.save, draftSel); persist(); box.remove();
      if (res) { const d = A.Stars.def(res.id); AU.play('coin', 0.6); toast(res.merged ? d.name + ': +' + res.added + ' matches (now ' + res.total + ')' : d.name + ' signed! (' + res.total + ' matches)', 'gold');
        if (!res.merged && st.save.active.length < 5 && !A.Stars.canEquip(st.save, res.id)) { A.Stars.equip(st.save, res.id); persist(); toast(d.name + ' added to your active five', ''); } }
      draftSel = 0; render();
    }
  };
}

// ======================= Star Collection =======================
function starsHTML() {
  const s = st.save, f = st.sub.coll, so = st.sub.sort;
  let list = A.Stars.list(s);
  const total = list.length;
  list = list.filter(c => f === 'all' ? true : f === 'active' ? A.Stars.isActive(s, c.id) : f === 'reserve' ? !A.Stars.isActive(s, c.id) && c.contract > 0 : c.contract <= 0);
  const ri = r => A.RARITIES.indexOf(r);
  list.sort((a, b) => so === 'ovr' ? b.ovr - a.ovr : so === 'rarity' ? ri(b.rarity) - ri(a.rarity) || b.ovr - a.ovr : so === 'pos' ? A.Stars.def(a.id).role.localeCompare(A.Stars.def(b.id).role) || b.ovr - a.ovr : b.contract - a.contract);
  const act = s.active.map(id => s.stars[id]).filter(Boolean);
  const slots = [0, 1, 2, 3, 4].map(i => { const x = act[i]; if (!x) return '<div class="slot">Empty<br>slot</div>'; const d = A.Stars.def(x.id); return '<div class="slot f" data-star="' + x.id + '" style="border-color:' + RCOL[d.rarity][0] + '"><img src="' + portrait(x.id) + '" alt=""><b>' + esc(d.name.split(' ')[1] || d.name) + '</b><span class="tiny">' + ROLE_S[d.role] + ' ' + x.ovr + '</span></div>'; }).join('');
  return '<div class="title">Active five <span class="sp"></span><span class="pill">free to change</span></div><div class="slots">' + slots + '</div>' +
    '<p class="note">A star replaces one standard player of the same role (5 stars + 95 standard). Your squad has 1 captain slot. Each real battle uses 1 contract match.</p>' +
    '<div class="title">Collection <span class="sp"></span><span class="pill">' + total + ' / ' + A.Stars.defs.length + '</span></div>' +
    '<div class="seg">' + [['all', 'All'], ['active', 'Active'], ['reserve', 'Reserve'], ['expired', 'Expired']].map(([k, n]) => '<button data-act="cf:' + k + '" class="' + (f === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div><div style="height:6px"></div>' +
    '<div class="seg">' + [['ovr', 'OVR'], ['rarity', 'Rarity'], ['pos', 'Position'], ['contract', 'Contract']].map(([k, n]) => '<button data-act="cs:' + k + '" class="' + (so === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div><div style="height:8px"></div>' +
    (list.length ? '<div class="stars">' + list.map(c => starCardHTML(c.id, c.ovr, c.contract, { active: A.Stars.isActive(s, c.id) })).join('') + '</div>' : '<div class="card dim small">' + (total ? 'No star in this filter.' : 'No stars yet — open a Draft Pack (your first Standard Pack is free after 3 official matches).') + '</div>');
}
function starModal(id) {
  const s = st.save, c = s.stars[id], d = A.Stars.def(id), act = A.Stars.isActive(s, id), why = A.Stars.canEquip(s, id);
  const html = '<div class="row"><img src="' + portrait(id) + '" style="width:72px;height:72px;image-rendering:pixelated;border-radius:12px" alt=""><div class="grow"><h2>' + esc(d.name) + '</h2>' + rarityPill(d.rarity) + ' <span class="pill">' + ROLE_N[d.role] + '</span> <span class="pill gold">OVR ' + c.ovr + '</span></div></div>' +
    '<div class="card" style="margin-top:10px"><b>' + esc(ABIL[d.ability][0]) + ' ' + TIER_N[A.Stars.TIER[d.rarity]] + '</b><div class="small dim">' + esc(ABIL[d.ability][1]) + '</div><div class="tiny dim" style="margin-top:4px">Automatic: first ready after ~4–7 s, cooldown 12–18 s, max 2 uses per battle. A K.O.\'d star cannot trigger it.</div></div>' +
    '<div class="kv"><dt>Contract</dt><dd>' + (c.contract > 0 ? c.contract + ' matches' : 'EXPIRED') + '</dd><dt>Battles played</dt><dd>' + (c.battles || 0) + '</dd><dt>Status</dt><dd>' + (act ? 'Active' : c.contract > 0 ? 'Reserve' : 'Expired') + '</dd></div>' +
    '<div class="grid2" style="margin-top:12px">' +
    (act ? '<button class="btn coral" data-m="remove">Remove</button>' : '<button class="btn mint" data-m="equip"' + (why ? ' disabled' : '') + '>Equip</button>') +
    (!act && c.contract > 0 && s.active.length ? '<button class="btn" data-m="replace">Replace…</button>' : '<button class="btn ghost" data-m="close">Close</button>') +
    '<button class="btn gold" data-m="t5"' + (s.tickets.t5 > 0 ? '' : ' disabled') + '>Renew +5 (' + s.tickets.t5 + ')</button><button class="btn gold" data-m="t10"' + (s.tickets.t10 > 0 ? '' : ' disabled') + '>Renew +10 (' + s.tickets.t10 + ')</button></div>' +
    (why && !act ? '<p class="note">' + esc(why) + '</p>' : '');
  modal(html, (m) => {
    if (m === 'close') return closeModal();
    if (m === 'equip') { if (A.Stars.equip(s, id)) { AU.ui('upgrade'); persist(); toast(d.name + ' is in your active five'); } }
    else if (m === 'remove') { A.Stars.remove(s, id); AU.ui(); persist(); }
    else if (m === 't5' || m === 't10') { if (A.Stars.renew(s, id, m)) { AU.ui('coin'); persist(); toast(d.name + ': +' + (m === 't10' ? 10 : 5) + ' matches', 'gold'); } }
    else if (m === 'replace') {
      modal('<h2>Replace which active star with ' + esc(d.name) + '?</h2><div class="stars" style="margin-top:8px">' + s.active.map(a => starCardHTML(a, s.stars[a].ovr, s.stars[a].contract, { attr: 'data-m="rep:' + a + '"' })).join('') + '</div><button class="btn ghost block" style="margin-top:10px" data-m="close">Cancel</button>', (m2) => {
        if (m2 === 'close') return closeModal();
        if (m2.startsWith('rep:')) { if (A.Stars.replace(s, m2.slice(4), id)) { AU.ui('upgrade'); persist(); toast(d.name + ' replaced ' + A.Stars.def(m2.slice(4)).name); } else toast('That swap breaks the squad role limits', 'bad'); closeModal(); render(); }
      });
      return;
    }
    closeModal(); render();
  });
}

// ======================= Challenges =======================
function challengesHTML() {
  const s = st.save;
  const unlocked = Object.keys(s.challenges.unlocked).map(Number).sort((a, b) => b - a);
  if (st.sub.chDiv == null || !s.challenges.unlocked[st.sub.chDiv]) st.sub.chDiv = unlocked.length ? (s.challenges.unlocked[s.division] ? s.division : unlocked[unlocked.length - 1]) : null;
  const d = st.sub.chDiv;
  const head = '<div class="title">Arcade Challenge Board <span class="sp"></span><span class="pill">' + Object.values(s.challenges.done).filter(x => x.won).length + ' / 30</span></div>';
  if (d == null) return head + '<div class="card"><p>🔒 The Challenge Board of a Division opens after its <b>3rd official league fixture</b>.</p><p class="dim small">Played in Division ' + s.league.div + ': ' + Object.values(s.league.results).filter(r => r.player).length + ' / 3</p></div>';
  const seg = '<div class="seg">' + unlocked.map(x => '<button data-act="chd:' + x + '" class="' + (x === d ? 'on' : '') + '">D' + x + '</button>').join('') + '</div><div style="height:8px"></div>';
  const desc = { power: 'A rival a bit stronger than this Division\'s average. Normal 100 vs 100.', last: 'Win to earn medals: 🥉 win · 🥈 15+ survivors · 🥇 30+ survivors.', signature: 'The opponent fields ' + A.Challenges.oppStars(d) + ' star player' + (A.Challenges.oppStars(d) > 1 ? 's' : '') + ' with automatic signature abilities.' };
  return head + seg + A.Challenges.KINDS.map(k => {
    const key = A.Challenges.key(d, k), stt = s.challenges.done[key] || { won: false, medal: 0, plays: 0 }, o = A.Challenges.opponent(s, d, k);
    const first = A.Challenges.rewardFirst(d, k), rep = A.Challenges.rewardRepeat(d);
    const medal = k === 'last' ? ['', '🥉', '🥈', '🥇'][stt.medal] || '' : stt.won ? '✅' : '';
    return '<div class="card' + (stt.won ? ' gold' : '') + '"><div class="row"><b class="grow">' + A.Challenges.INFO[k].name + '</b><span class="medal">' + medal + '</span></div><div class="small dim" style="margin:2px 0 8px">' + desc[k] + '</div>' +
      '<div class="row">' + cimg(o.id, 36) + '<div class="grow"><b>' + esc(A.club(o.id).displayName) + '</b><div class="tiny dim">PWR ' + o.rating.toFixed(1) + ' · played ' + stt.plays + '×</div></div><button class="btn gold sm" data-act="ch:' + d + ':' + k + '">PLAY</button></div>' +
      '<div class="tiny" style="margin-top:8px">' + (stt.won ? '<span class="dim">Repeat win: </span>' + rewardLine(rep) : '<span class="dim">First win: </span>' + rewardLine(first)) +
      (k === 'last' ? '<br><span class="dim">Medal bonuses (once): 🥈 </span>' + rewardLine(A.Challenges.medalBonus(d, 2)) + ' <span class="dim">🥇 </span>' + rewardLine(A.Challenges.medalBonus(d, 3)) : '') + '</div></div>';
  }).join('') + '<p class="note">Completing all three first wins of a Division grants a +5 Contract Ticket. Challenges never change the league table. Quick Simulate is disabled here; 2× speed is allowed.</p>';
}

// ======================= actions =======================
function onAct(act, el) {
  const s = st.save;
  AU.init();
  if (act.startsWith('tab:')) { AU.ui(); return go(act.slice(4)); }
  if (act === 'settings') return settingsModal();
  if (act === 'import') return importSave();
  if (act.startsWith('lsub:')) { st.sub.league = act.slice(5); return render(); }
  if (act.startsWith('cf:')) { st.sub.coll = act.slice(3); return render(); }
  if (act.startsWith('cs:')) { st.sub.sort = act.slice(3); return render(); }
  if (act.startsWith('chd:')) { st.sub.chDiv = +act.slice(4); return render(); }
  if (act.startsWith('up:')) { if (A.Upgrades.buy(s, act.slice(3))) { AU.play('upgrade', 0.6); AU.vibrate(15); persist(); render(); } return; }
  if (act.startsWith('open:')) {
    const [, type, pay] = act.split(':'); const why = A.Draft.canOpen(s, type, pay); if (why) { toast(why, 'bad'); return; }
    const res = A.Draft.open(s, type, pay); persist(); renderTop(); if (res) { draftSel = 0; showDraft(true); } return;
  }
  if (act === 'draft') { showDraft(false); return; }
  if (act === 'league') return startBattle('league', { attempt: 1 });
  if (act === 'quick') return startBattle('league', { attempt: 1 }, true);
  if (act === 'resume') return resumeBattle();
  if (act === 'rematch') return startBattle('league', { attempt: 2 });
  if (act === 'acceptloss') { const out = A.Battle.acceptLoss(s); persist(); toast('Loss accepted · ' + (out ? '+' + out.credits + ' C · +' + out.xp + ' XP' : ''), ''); afterOfficial(out); render(); return; }
  if (act === 'promote') { const out = A.Endgame.promote(s); persist(); AU.play('trophy', 0.7); celebrate(); toast('Welcome to ' + (s.division === 1 ? 'the Champions League (Division 1)' : 'Division ' + s.division) + '!', 'gold'); if (out) rewardsToast(out); render(); startAI(); return; }
  if (act === 'promo') { A.Endgame.promoStart(s); persist(); return startBattle('promo', {}); }
  if (act === 'replayseason') { confirmBox('Replay this Division ' + s.league.div + ' season? A fresh 19-match fixture list starts (fixture rewards are per new fixture).', () => { A.Endgame.replaySeason(s); persist(); render(); startAI(); }); return; }
  if (act === 'newseason') { A.Endgame.nextEndless(s); persist(); toast('New Champions League season!', 'gold'); render(); startAI(); return; }
  if (act.startsWith('ch:')) { const [, dd, k] = act.split(':'); return startBattle('challenge', { div: +dd, kind: k }); }
}
function rewardsToast(r) { const t = rewardLine(r).replace(/<[^>]+>/g, ''); if (t) toast(t, 'gold', 3500); }
function confirmBox(text, yes) { modal('<h2>Are you sure?</h2><p class="small">' + esc(text) + '</p><div class="grid2"><button class="btn ghost" data-m="no">Cancel</button><button class="btn coral" data-m="yes">Confirm</button></div>', m => { closeModal(); if (m === 'yes') yes(); }); }
function afterOfficial(out) { if (out && out.challengesUnlocked) toast('🎯 Challenge Board unlocked for Division ' + out.challengesUnlocked + '!', 'gold', 3500); }

// ======================= battle (ArcadeBattleAdapter + ArcadeMomentum UI) =======================
function startBattle(kind, ctx, quick) {
  const s = st.save;
  if (st.battle) return;
  if (s.pendingBattle) return resumeBattle();
  if (kind === 'league' && (s.league.phase !== 'regular' || s.league.round >= 19)) return;
  if (kind === 'league' && ctx.attempt === 2 && !s.pendingDecision) return;
  if (kind === 'league' && ctx.attempt === 1 && s.pendingDecision) return;
  stopAI();
  const snap = A.Battle.snapshot(s, kind, ctx);
  A.Battle.begin(s, snap); persist();
  if (quick) return quickSim(snap);
  liveBattle(snap, null);
}
function resumeBattle() {
  const P = st.save.pendingBattle; if (!P) return;
  stopAI();
  liveBattle(P.snap, { inputs: P.inputs || [], lastTick: P.lastTick || 0 });
}
function quickSim(snap) {
  modal('<h2>Quick Simulate</h2><p class="small dim">Running the real 100 vs 100 battle (automatic Momentum Strikes for both teams)…</p><div class="bar"><i id="qsBar" style="width:0"></i></div>');
  const w = E.createWorld(A.Battle.worldOpts(snap, { headless: true, auto: true }));
  st.battle = { quick: true };
  const stepf = () => {
    const done = A.Battle.runSlice(w, 400); const b = $('qsBar'); if (b) b.style.width = Math.min(100, w.t / 50 * 100) + '%';
    if (!done) { setTimeout(stepf, 0); return; }
    st.battle = null; closeModal(); finishBattle(snap, A.Battle.result(w));
  };
  setTimeout(stepf, 30);
}
function fitStage() {
  const B = st.battle; if (!B || !B.cv) return;
  const wrap = $('stageWrap'), r = wrap.getBoundingClientRect();
  let h = r.height - 4, w = h * 9 / 16; if (w > r.width - 4) { w = r.width - 4; h = w * 16 / 9; }
  const dpr = Math.min(root.devicePixelRatio || 1, QUALITY[st.save.settings.quality].dpr);
  const k = Math.max(1, Math.min(4, Math.round(h * dpr / 640)));
  B.cv.width = 360 * k; B.cv.height = 640 * k; B.cv.style.width = Math.floor(w) + 'px'; B.cv.style.height = Math.floor(h) + 'px';
}
function liveBattle(snap, resume) {
  const s = st.save, set = s.settings, q = QUALITY[set.quality] || QUALITY.medium;
  AU.init(); AU.apply(Object.assign({}, set));
  const bt = $('battle'); bt.classList.remove('hidden'); document.body.style.overflow = 'hidden';
  $('btLabel').textContent = snap.label;
  const w = E.createWorld(A.Battle.worldOpts(snap, { fxLevel: q.fx, inputs: resume ? resume.inputs : [] }));
  w.observer = D.createObserver({ smartCam: true, intensity: 'normal', epicFinale: true, mvpStreaks: true, fbAlerts: true, fbFollow: true });
  const teams = [snap.teamA, snap.teamB];
  const hc = S.color.cdist(S.color.vivid(teams[0].visual.primary_color), S.color.vivid(teams[1].visual.primary_color)) < 210;
  const kits = S.makeKits(teams[0], teams[1], 210);
  const atlases = [S.buildAtlas(teams[0], kits[0]), S.buildAtlas(teams[1], kits[1])];
  const logos = teams.map((t, i) => ({ small: crestCv(t.id, 26, i === 0 && s.goldenCrest), big: crestCv(t.id, 96, i === 0 && s.goldenCrest) }));
  const renderer = R.createRenderer({ world: w, teams, kits, atlases, logos, lang: 'en', labels: true, story: true, hc, fxLevel: q.fx, v3: { vfx: true, finale: true, mvp: true, momentum: false }, modeLabel: snap.label.toUpperCase(), fictional: false });
  const cv = $('stage'); const ctx = cv.getContext('2d');
  const B = st.battle = { snap, w, renderer, cv, ctx, paused: false, speed: set.speed === 2 ? 2 : 1, cam: set.smartCam !== false, last: performance.now(), evI: 0, savedTick: resume ? resume.lastTick : 0, waitInput: false, autoQ: false, ended: false, skip: false, ff: !!(resume && resume.lastTick > 0), usedSeen: 0 };
  fitStage(); updateBattleButtons();
  $('btLoading').classList.toggle('hidden', !B.ff);
  AU.battleStart();
  const ff = () => { // resume: recompute silently up to the last safe tick (same seed, snapshot and Momentum inputs)
    let n = 0; while (w.tick < resume.lastTick && n++ < 400) E.step(w);
    B.evI = w.events.length; B.usedSeen = w.arc.used.length;
    if (w.tick < resume.lastTick) { $('btLoading').textContent = 'RESTORING BATTLE… ' + Math.round(w.tick / resume.lastTick * 100) + '%'; setTimeout(ff, 0); return; }
    B.ff = false; $('btLoading').classList.add('hidden'); B.last = performance.now(); B.raf = requestAnimationFrame(frame);
  };
  const frame = now => {
    if (st.battle !== B) return;
    const dt = Math.min(0.1, (now - B.last) / 1000); B.last = now;
    if (!B.paused) {
      if (B.speed === 2 && w.arc.mom[0].ready && !B.autoQ && w.phase === 'battle') { E.arcInput(w, 'auto'); B.autoQ = true; }
      E.advanceTo(w, w.t + dt * B.speed);
    }
    if (!B.cam) { w.cam.x = 180; w.cam.y = E.MIDY; w.cam.z = 1; }
    renderer.render(ctx, w.t, cv.width, cv.height);
    battleEvents(B);
    momentumHUD(B);
    AU.battleFeed(w, w.observer && w.observer.state);
    if (!B.paused && w.phase === 'battle' && w.tick - B.savedTick >= 120) saveProgress(B);
    if (w.phase === 'ended') {
      if (!B.ended) { B.ended = true; $('btSkip').classList.remove('hidden'); AU.vibrate([60, 40, 120]); }
      if (B.skip || w.t >= w.endT + w.outroLen) { endLive(B); return; }
    }
    B.raf = requestAnimationFrame(frame);
  };
  if (B.ff) setTimeout(ff, 30); else B.raf = requestAnimationFrame(frame);
}
function saveProgress(B) { const P = st.save.pendingBattle; if (!P || P.snap.battleId !== B.snap.battleId) return; P.inputs = B.w.arc.log.slice(); P.lastTick = B.w.tick; B.savedTick = B.w.tick; Store.write(); }
function battleEvents(B) {
  const w = B.w, ev = w.events, EV = E.EV, names = Object.keys(E.SPECIAL_NAMES);
  for (; B.evI < ev.length; B.evI++) {
    const e = ev[B.evI];
    if (e.type === EV.SPECIAL_FIRE) AU.play('ab_' + names[e.c], e.a === 0 ? 0.5 : 0.35, 0, 1);
    else if (e.type === EV.STAR_SPECIAL && e.a === 0) AU.vibrate(20);
    else if (e.type === EV.MOM_READY && e.a === 0) { AU.play('mom_ready', 0.6); AU.vibrate(25); }
    else if (e.type === EV.GOAL) AU.vibrate(e.b === 0 ? [50, 30, 50] : 30);
  }
  const U = w.arc.used;
  for (; B.usedSeen < U.length; B.usedSeen++) {
    const m = U[B.usedSeen];
    if (m.side !== 0) { qpop('RIVAL STRIKE', '#ff8a8a'); continue; }
    B.waitInput = false; B.autoQ = false;
    const txt = m.q === 'perfect' ? 'PERFECT!' : m.q === 'good' ? 'GOOD!' : 'STRIKE';
    qpop(txt + ' · ' + m.mode.toUpperCase(), m.q === 'perfect' ? '#ffcf3f' : m.q === 'good' ? '#3df2b5' : '#bfe4ff');
    AU.play('mom_' + m.q, 0.8); AU.vibrate(m.q === 'perfect' ? [30, 30, 90] : m.q === 'good' ? 50 : 25);
    saveProgress(B);
  }
}
function qpop(text, col) { const d = document.createElement('div'); d.className = 'qpop'; d.style.color = col; d.textContent = text; $('stageWrap').appendChild(d); setTimeout(() => d.remove(), 950); }
function momentumHUD(B) {
  const w = B.w, m = w.arc.mom[0];
  $('momFill').style.width = (m.v | 0) + '%';
  $('momFill').parentNode.classList.toggle('ready', m.ready);
  $('momTxt').textContent = m.uses >= 4 ? 'ALL STRIKES USED' : m.ready ? 'STRIKE READY!' : 'MOMENTUM ' + (m.v | 0) + '%';
  $('momUses').textContent = 'STRIKES ' + m.uses + '/4';
  const tm = $('timing'); tm.classList.toggle('off', !m.ready);
  $('mk').style.left = (E.ARC.marker(w, 0) * 100).toFixed(2) + '%';
  $('mk').classList.toggle('hidden', !m.ready);
  $('timingTx').classList.toggle('hidden', m.ready);
  const sb = $('strikeBtn'); sb.classList.toggle('ready', m.ready && w.phase === 'battle');
  sb.innerHTML = (B.speed === 2 && m.ready ? 'AUTO' : 'STRIKE') + '<small>' + (B.speed === 2 ? '2× auto (Normal)' : 'tap or SPACE') + '</small>';
}
function strike() {
  const B = st.battle; if (!B || !B.w || B.paused || B.ff) return;
  const w = B.w, m = w.arc.mom[0];
  if (!m.ready || w.phase !== 'battle') { AU.play('error', 0.25); return; }
  if (B.waitInput) return;
  E.arcInput(w, 'tap'); B.waitInput = true;
}
function updateBattleButtons() {
  const B = st.battle; if (!B) return;
  $('btSpeed').textContent = B.speed + '×'; $('btSpeed').classList.toggle('on', B.speed === 2);
  $('btCam').classList.toggle('on', B.cam); $('btPause').textContent = B.paused ? '▶' : '❚❚';
}
function setPause(on) {
  const B = st.battle; if (!B || !B.w) return;
  B.paused = on; AU.pause(on); updateBattleButtons();
  const pb = $('pauseBox');
  if (on) {
    pb.classList.remove('hidden');
    pb.innerHTML = '<div class="in"><h2 style="text-align:center">PAUSED</h2><button class="btn mint" data-b="resume">Resume</button><button class="btn" data-b="speed">Speed: ' + B.speed + '×</button><button class="btn" data-b="cam">Smart camera: ' + (B.cam ? 'ON' : 'OFF') + '</button><button class="btn" data-b="mute">Sound: ' + (st.save.settings.mute ? 'OFF' : 'ON') + '</button><button class="btn coral" data-b="abandon">Abandon battle (counts as a loss)</button></div>';
  } else { pb.classList.add('hidden'); pb.innerHTML = ''; B.last = performance.now(); }
  if (!on) saveProgress(B);
}
function endLive(B) {
  cancelAnimationFrame(B.raf);
  const res = A.Battle.result(B.w);
  closeBattleView();
  finishBattle(B.snap, res);
}
function closeBattleView() { AU.battleStop(); AU.pause(false); st.battle = null; $('battle').classList.add('hidden'); $('btSkip').classList.add('hidden'); $('pauseBox').classList.add('hidden'); document.body.style.overflow = ''; }
function finishBattle(snap, res) {
  const s = st.save;
  const before = {}; for (const id of snap.starIds) before[id] = s.stars[id] ? s.stars[id].contract + 1 : 0;
  const out = A.Battle.finish(s, snap, res);
  persist();
  showResults(out, before);
  startAI();
}
function showResults(out, before) {
  const s = st.save, res = out.res, snap = out.snap, r = out.rewards || {};
  const won = res.won, fb = res.football;
  if (won) { AU.play('trophy', 0.5); } else AU.play('error', 0.4);
  const stars = snap.starIds.map(id => { const d = A.Stars.def(id), now = s.stars[id] ? s.stars[id].contract : 0, st2 = (res.stars || []).find(x => x.id === id && x.side === 0); return '<div class="fx"><div class="a">' + esc(d.name) + '</div><div class="s">' + (before[id] || now + 1) + '→' + now + '</div><div class="tiny dim">' + (st2 ? st2.kills + ' KO · ' + st2.uses + ' ability' + (st2.alive ? '' : ' · K.O.') : '') + (now <= 0 ? ' <span class="coral">EXPIRED</span>' : '') + '</div></div>'; }).join('');
  let extra = '';
  if (out.canRematch) extra = '<div class="card coral" style="border-color:#7a2430"><b>Official match lost.</b> You have one free REMATCH. Rewards are only paid for the final result.</div>';
  if (out.kind === 'promo' && out.promo) extra = '<div class="card gold"><b>Promotion Challenge</b> — ' + out.promo.games.join(' ') + ' (' + out.promo.wins + 'W ' + out.promo.losses + 'L)' + (out.promo.done ? (out.promo.success ? ' · <span class="mint">PROMOTED!</span>' : ' · <span class="coral">Failed — you can try again</span>') : '') + '</div>';
  if (out.kind === 'challenge') extra = '<div class="card gold"><b>' + A.Challenges.INFO[snap.ctx.kind].name + ' · Division ' + snap.div + '</b>' + (out.medal ? ' — medal: ' + ['', '🥉 Bronze', '🥈 Silver', '🥇 Gold'][out.medal] : '') + '</div>';
  const lv = (r.levelUps || []).length ? '<div class="card gold"><b>⬆️ TEAM LEVEL ' + r.levelUps[r.levelUps.length - 1] + '!</b>' + ((r.milestones || []).length ? '<br>Milestone reward unlocked (Lv ' + r.milestones.join(', ') + ')' : '') + '</div>' : '';
  const html = '<div class="res-hd"><div class="tiny dim" style="font-weight:900;letter-spacing:.12em">' + esc(snap.label.toUpperCase()) + '</div><div class="big ' + (won ? 'win' : 'loss') + '">' + (won ? 'VICTORY' : 'DEFEAT') + '</div>' +
    '<div class="vs" style="margin-top:10px"><div>' + cimg(snap.teamA.id, 44) + '<div class="nm">' + esc(snap.teamA.name) + '</div><div class="pw">' + (res.alive ? res.alive[0] : 0) + ' standing</div></div><div class="mid mono">' + res.goals[0] + ' - ' + res.goals[1] + '<div class="tiny dim">goals</div></div><div>' + cimg(snap.teamB.id, 44) + '<div class="nm">' + esc(snap.teamB.name) + '</div><div class="pw">' + (res.alive ? res.alive[1] : 0) + ' standing</div></div></div></div>' +
    extra + lv +
    (out.canRematch ? '' : '<div class="rew"><div><b class="gold-t">+' + fmt(r.credits || 0) + '</b><span>CREDITS</span></div><div><b class="mint">+' + (r.xp || 0) + '</b><span>TEAM XP</span></div><div><b style="color:#8ff3ff">+' + (r.frags || 0) + '</b><span>FRAGMENTS</span></div></div>') +
    ((r.labels || []).length ? '<p class="tiny dim" style="text-align:center">' + r.labels.map(esc).join(' · ') + '</p>' : '') +
    (r.packs || r.tickets || r.crest ? '<p class="small" style="text-align:center">' + rewardLine({ packs: r.packs, tickets: r.tickets, crest: r.crest }) + '</p>' : '') +
    (stars ? '<div class="title">Star contracts</div><div class="card" style="padding:6px 10px">' + stars + '</div>' : '') +
    '<details class="card small"><summary style="font-weight:800;cursor:pointer">Match stats</summary><div class="kv" style="margin-top:8px">' +
    (fb ? '<dt>Possession</dt><dd>' + fb.possession.join(' / ') + ' %</dd><dt>Shots (on target)</dt><dd>' + fb.shots[0] + ' (' + fb.onTarget[0] + ') / ' + fb.shots[1] + ' (' + fb.onTarget[1] + ')</dd><dt>Saves</dt><dd>' + fb.saves.join(' / ') + '</dd><dt>Passes</dt><dd>' + fb.passes.join(' / ') + '</dd><dt>Interceptions</dt><dd>' + fb.intercepts.join(' / ') + '</dd>' : '') +
    '<dt>K.O.s</dt><dd>' + (res.kills ? res.kills.join(' / ') : '-') + '</dd><dt>Battle time</dt><dd>' + (res.battleSeconds || 0).toFixed(1) + ' s</dd><dt>Your Momentum Strikes</dt><dd>' + res.momentum.filter(m => m.side === 0).map(m => m.q[0].toUpperCase()).join(' ') + '</dd><dt>Rival strikes</dt><dd>' + res.momentum.filter(m => m.side === 1).length + '</dd>' + (res.abandoned ? '<dt>Note</dt><dd>abandoned</dd>' : '') + '</div></details>' +
    (out.canRematch ? '<div class="grid2"><button class="btn ghost" data-m="accept">Accept loss</button><button class="btn gold" data-m="rematch">REMATCH</button></div>' : '<button class="btn gold block" data-m="next">' + (out.kind === 'league' ? 'NEXT MATCH' : 'CONTINUE') + '</button>');
  modal(html, m => {
    if (m === 'rematch') { closeModal(); startBattle('league', { attempt: 2 }); return; }
    if (m === 'accept') { const o2 = A.Battle.acceptLoss(s); persist(); closeModal(); if (o2) rewardsToast(o2); afterOfficial(o2); render(); return; }
    if (m === 'next') { closeModal(); afterOfficial(r); if (out.kind === 'promo' && out.promo && out.promo.done && out.promo.success) { celebrate(); } go('home'); }
  });
  if (won) celebrate(12);
  render();
}
function celebrate(n) {
  const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#ffcf3f', '#3df2b5', '#5ab8ff', '#ff5a64', '#ffffff'];
  for (let i = 0; i < (n || 40); i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % 5]; p.style.animationDelay = Math.random() * 0.6 + 's'; p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's'; c.appendChild(p); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 3400);
}

// ======================= season end / championship =======================
function checkSeasonEnd() {
  const s = st.save; if (!s || st.battle) return;
  if (s.league.phase !== 'regular' || !A.League.seasonComplete(s)) return;
  if (!$('modal').classList.contains('hidden') || $('draftBox') || document.querySelector('.opening')) { setTimeout(checkSeasonEnd, 1200); return; } // never cover an open result/draft
  const out = A.Endgame.closeSeason(s); persist(); if (!out) return;
  const t = A.League.table(s).slice(0, 3);
  const champ = out.rank === 1;
  if (champ) { AU.play('trophy', 0.8); celebrate(60); AU.vibrate([80, 50, 80, 50, 160]); }
  const head = out.div === 1 ? (champ ? 'CHAMPIONS LEAGUE WINNERS!' : 'SEASON COMPLETE') : champ ? 'DIVISION ' + out.div + ' CHAMPIONS!' : out.rank <= 3 ? 'PROMOTED!' : 'SEASON COMPLETE';
  const next = out.phase === 'promoted' ? '<button class="btn gold block" data-m="promote">ADVANCE TO DIVISION ' + (out.div - 1) + '</button>' : out.phase === 'promo' ? '<p class="small">You finished <b>#' + out.rank + '</b>. Win the <b>Promotion Challenge</b> (best of 3 vs Division ' + (out.div - 1) + ' sides) to move up. You can retry as often as you like.</p><button class="btn gold block" data-m="close">TO THE PROMOTION CHALLENGE</button>' : '<button class="btn gold block" data-m="close">CONTINUE</button>';
  modal('<div style="text-align:center">' + (champ || out.phase === 'promoted' ? '<div class="trophy">🏆</div>' : '<div class="trophy" style="filter:none">📋</div>') + '<h2 style="font-size:22px">' + head + '</h2><div class="dim small">Final position: #' + out.rank + ' of 20</div>' +
    (out.firstTitle ? '<div class="card gold" style="margin-top:10px"><b class="gold-t">FIRST DIVISION 1 TITLE!</b><br>Legend Draft Pack + Golden Team Crest unlocked.</div>' : '') + '</div>' +
    '<div class="card" style="margin-top:10px">' + t.map((r, i) => '<div class="fx' + (r.id === s.club ? ' me' : '') + '"><div class="a">' + ['🥇', '🥈', '🥉'][i] + ' ' + esc(A.club(r.id).displayName) + '</div><div class="s">' + r.pts + ' pts</div><div class="tiny dim">' + r.w + 'W ' + r.l + 'L</div></div>').join('') + '</div>' +
    (rewardLine(out) ? '<p class="small" style="text-align:center">' + rewardLine(out) + '</p>' : '') + next, m => {
    if (m === 'promote') { closeModal(); onAct('promote'); return; }
    closeModal(); render();
  });
  render();
}

// ======================= background AI league simulation =======================
function startAI() { if (st.ai.timer) return; st.ai.timer = setTimeout(aiTick, 300); }
function stopAI() { clearTimeout(st.ai.timer); st.ai.timer = 0; }
function aiTick() {
  st.ai.timer = 0;
  const s = st.save; if (!s || st.battle) return;
  const L = s.league;
  if (!L.aiQueue.length) { st.ai.w = null; checkSeasonEnd(); return; }
  if (!st.ai.w || !st.ai.job || st.ai.job.fixtureId !== L.aiQueue[0] || st.ai.job.seasonId !== L.seasonId) { st.ai.job = A.League.aiJob(s); st.ai.w = E.createWorld(A.Battle.aiOpts(s, st.ai.job)); }
  const t0 = performance.now(); let done = false;
  while (!done && performance.now() - t0 < 12) done = A.Battle.runSlice(st.ai.w, 60);
  if (done) {
    A.League.applyAI(s, st.ai.job, A.Battle.result(st.ai.w)); st.ai.w = null; st.ai.job = null; persist();
    if (!$('modal').classList.contains('hidden') || document.getElementById('draftBox')) { /* keep modal */ } else if (st.tab === 'home' || st.tab === 'league') render();
  }
  st.ai.timer = setTimeout(aiTick, done ? 30 : 8);
}

// ======================= settings / export / import =======================
function settingsModal() {
  const s = st.save, set = s ? s.settings : { master: 0.8, music: 0.5, sfx: 0.8, crowd: 0.6, mute: false, vibration: true, quality: 'medium', speed: 1, smartCam: true };
  const sl = (k, n) => '<div class="setrow"><span>' + n + '</span><input type="range" min="0" max="100" value="' + Math.round(set[k] * 100) + '" data-set="' + k + '"><span class="mono small">' + Math.round(set[k] * 100) + '</span></div>';
  const lic = root.FW_MASTER_DB.metadata.sources.find(x => x.license) || {};
  modal('<h2>Settings</h2>' + sl('master', 'Master volume') + sl('music', 'Music') + sl('sfx', 'Battle SFX') + sl('crowd', 'Crowd & ambience') +
    '<label class="chk"><input type="checkbox" data-set="mute"' + (set.mute ? ' checked' : '') + '> Mute all sound</label>' +
    '<label class="chk"><input type="checkbox" data-set="vibration"' + (set.vibration ? ' checked' : '') + '> Vibration (if supported)</label>' +
    '<label class="chk"><input type="checkbox" data-set="smartCam"' + (set.smartCam !== false ? ' checked' : '') + '> Smart battle camera</label>' +
    '<div class="setrow"><span>Graphics</span><div class="seg" style="grid-column:span 2">' + ['low', 'medium', 'high'].map(q => '<button data-m="q:' + q + '" class="' + (set.quality === q ? 'on' : '') + '">' + q[0].toUpperCase() + q.slice(1) + '</button>').join('') + '</div></div>' +
    '<p class="note">Low keeps all 100 vs 100 players — it only reduces particles, shake and pixel density. Battle results never depend on graphics, sound or speed.</p>' +
    (s ? '<div class="title">Save</div><div class="grid2"><button class="btn" data-m="export">Export Save (JSON)</button><button class="btn" data-m="import">Import Save</button></div>' +
      '<p class="note">' + (st.storageOk ? 'Autosave is ON (browser storage, with a backup copy).' : '<span class="coral">Autosave is NOT working in this browser.</span>') + ' Browser storage can be cleared by the browser — export a file now and then.</p>' +
      '<button class="btn coral block" data-m="reset" style="margin-top:6px">Delete career…</button>' : '') +
    '<div class="title">About</div><p class="note">FOOTBALL WARS — ARCADE REBORN · built on the Football Wars V4 deterministic 100v100 Football Fusion engine. Independent fan game: adapted club names, original pixel crests/kits, fictional stars; no official logos, sponsors, licensed kits or real player names/portraits. Not affiliated with any club or league. Club strength source: ' + esc(lic.attribution_required || 'beyondELO') + ' (' + esc(lic.license || 'CC BY 4.0') + '). Commercial distribution would require a legal review.</p>' +
    '<button class="btn mint block" data-m="close" style="margin-top:8px">Done</button>', m => {
    if (m === 'close') { closeModal(); render(); return; }
    if (m.startsWith('q:')) { set.quality = m.slice(2); if (s) persist(); settingsModal(); return; }
    if (m === 'export') return exportSave();
    if (m === 'import') return importSave();
    if (m === 'reset') return confirmBox('This deletes your whole career from this browser (export it first if you want to keep it).', () => { try { localStorage.removeItem(A.Save.KEY); localStorage.removeItem(A.Save.BAK); } catch (e) {} stopAI(); st.save = null; render(); });
  });
  $('modal').oninput = $('modal').onchange = e => {
    const k = e.target.dataset && e.target.dataset.set; if (!k) return;
    if (e.target.type === 'checkbox') set[k] = e.target.checked; else { set[k] = e.target.value / 100; e.target.nextElementSibling.textContent = e.target.value; }
    AU.init(); AU.apply(Object.assign({}, set)); if (s) persist();
  };
}
function exportSave() {
  try {
    const blob = new Blob([A.Save.serialize(st.save)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'FootballWarsArcade_' + A.club(st.save.club).displayName.replace(/[^a-z0-9]+/gi, '_') + '_D' + st.save.division + '.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Save exported', '');
  } catch (e) { toast('Export failed: ' + e.message, 'bad'); }
}
function importSave() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try { const s = A.Save.parse(String(rd.result)); stopAI(); st.save = s; st.ai.w = null; persist(); closeModal(); st.tab = 'home'; render(); toast('Save imported: ' + A.club(s.club).displayName + ' · Division ' + s.division, 'gold'); startAI(); boot2(); }
      catch (e) { toast('Import failed: ' + e.message, 'bad', 4000); }
    };
    rd.readAsText(f);
  };
  inp.click();
}

// ======================= boot =======================
function boot2() {
  const s = st.save; if (!s) return;
  AU.apply(Object.assign({}, s.settings));
  if (s.pendingBattle) {
    modal('<h2>Unfinished battle</h2><p class="small">' + esc(s.pendingBattle.snap.label) + ' was interrupted. Resume it exactly where it was (same seed, squads and Momentum inputs), or abandon it as a loss. Contracts were already used once and will not be used again.</p><div class="grid2"><button class="btn coral" data-m="abandon">Abandon (loss)</button><button class="btn gold" data-m="resume">RESUME BATTLE</button></div>', m => {
      closeModal();
      if (m === 'resume') resumeBattle();
      else { const snap = s.pendingBattle.snap; const out = A.Battle.abandon(s); persist(); if (out) showResults(out, {}); void snap; }
    });
  } else if (s.pendingDraft) { st.tab = 'packs'; render(); }
}
function boot() {
  st.storageOk = Store.available(); if (!st.storageOk) st.storageMsg = 'Browser storage is unavailable here: progress will NOT be saved. Use Export Save.';
  st.save = Store.load();
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) { e.preventDefault(); onAct(b.dataset.act, b); } const sc = e.target.closest('#screen [data-star]'); if (sc && st.save && st.save.stars[sc.dataset.star]) starModal(sc.dataset.star); });
  document.querySelectorAll('#tabbar [data-tab]').forEach(b => b.onclick = () => { AU.init(); AU.ui(); go(b.dataset.tab); });
  // battle controls
  $('strikeBtn').addEventListener('pointerdown', e => { e.preventDefault(); strike(); });
  $('btPause').onclick = () => setPause(!st.battle.paused);
  $('btSpeed').onclick = () => { const B = st.battle; B.speed = B.speed === 2 ? 1 : 2; st.save.settings.speed = B.speed; Store.write(); updateBattleButtons(); };
  $('btCam').onclick = () => { const B = st.battle; B.cam = !B.cam; st.save.settings.smartCam = B.cam; Store.write(); updateBattleButtons(); };
  $('btSkip').onclick = () => { if (st.battle) st.battle.skip = true; };
  $('pauseBox').onclick = e => {
    const b = e.target.closest('[data-b]'); if (!b) return; const B = st.battle;
    if (b.dataset.b === 'resume') setPause(false);
    else if (b.dataset.b === 'speed') { B.speed = B.speed === 2 ? 1 : 2; st.save.settings.speed = B.speed; setPause(true); }
    else if (b.dataset.b === 'cam') { B.cam = !B.cam; st.save.settings.smartCam = B.cam; setPause(true); }
    else if (b.dataset.b === 'mute') { st.save.settings.mute = !st.save.settings.mute; AU.apply({ mute: st.save.settings.mute }); setPause(true); }
    else if (b.dataset.b === 'abandon') { cancelAnimationFrame(B.raf); closeBattleView(); const out = A.Battle.abandon(st.save); persist(); if (out) showResults(out, {}); }
  };
  document.addEventListener('keydown', e => {
    if (!st.battle || !st.battle.w) return;
    if (e.code === 'Space') { e.preventDefault(); strike(); }
    else if (e.code === 'KeyP' || e.code === 'Escape') setPause(!st.battle.paused);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.battle && st.battle.w && !st.battle.paused) setPause(true); if (document.hidden && st.save) Store.write(); });
  window.addEventListener('resize', fitStage);
  window.addEventListener('pagehide', () => { if (st.battle && st.battle.w) saveProgress(st.battle); });
  render(); boot2(); if (st.save) startAI();
}
root.ArcadeApp = { boot, st, persist, render };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
