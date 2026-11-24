/* FOOTBALL WARS — ROAD TO GLORY: ArcadeApp + ArcadeUI (DOM layer, mobile-first 9:16).
 * Create Your Club · Club (BATTLE, Training, identity, Trophy Cabinet, Journey) · Squad (formations, stars, Star Mastery) ·
 * Powers (24 auto Powers, Favorites, Power Mastery) · League (table, fixtures, Division Journey, Challenge Board, Glory Cup) ·
 * Rewards (Draft packs, Academy Tickets, earned rewards) · Battle spectator (Smart camera, Action / Star Focus, Power feed) ·
 * Results (Star XP, Power Mastery, Coach Analysis, Comeback Roadmap) · Season end / Championship · Settings / Export / Import. */
(function (root) {
'use strict';
const E = root.FWEngine, R = root.FWRender, S = root.FWSprites, F = root.FWFont, D = root.FWDirector, A = root.Arcade, AU = root.ArcadeAudio;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const ROLE_S = { striker: 'ST', winger: 'WG', playmaker: 'PM', defender: 'DF', goalkeeper: 'GK', support: 'SP', captain: 'CP' };
const ROLE_N = { striker: 'Striker', winger: 'Winger', playmaker: 'Playmaker', defender: 'Defender', goalkeeper: 'Goalkeeper', support: 'Support', captain: 'Captain' };
const RAR_N = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
const RAR_C = { common: '#d8dee9', rare: '#5ab8ff', epic: '#c77dff', legendary: '#ffcf3f' };
const CAT_IC = { attack: '⚔️', defense: '🛡️', chaos: '🌀', support: '💚' };
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
const COLORS = ['#d62839', '#f77f00', '#fcbf49', '#2a9d8f', '#1fbf8c', '#3a86ff', '#1d3557', '#6a4c93', '#ff5d8f', '#111111', '#f5f5f5', '#8d99ae'];
const TROPHY = { div_champion: ['🏆', 'Division Champion'], direct_promotion: ['🥈', 'Direct Promotion'], promo_survivor: ['🛟', 'Promotion Survivor'], d1_champion: ['👑', 'Division 1 Championship'], endless_champion: ['🌍', 'Champions League Title'] };
const st = { save: null, tab: 'club', storageOk: true, storageMsg: '', battle: null, sub: { league: 'table', coll: 'all', sort: 'ovr', chDiv: null }, ai: { w: null, job: null, timer: 0 }, crest: new Map(), portrait: new Map(), migrated: false };

// ======================= persistence =======================
const Store = {
  available() { try { const k = '__fwa_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; } },
  load() {
    let raw = null, bak = null;
    try { raw = localStorage.getItem(A.Save.KEY); bak = localStorage.getItem(A.Save.BAK); } catch (e) { st.storageOk = false; st.storageMsg = 'Browser storage is blocked: progress cannot be saved in this browser.'; return null; }
    for (const [txt, which] of [[raw, 'main'], [bak, 'backup']]) {
      if (!txt) continue;
      try { const v = (JSON.parse(txt) || {}).v; const s = A.Save.parse(txt); if (v < A.VERSION) st.migrated = v; if (which === 'backup') toast('Main save was damaged — restored the previous safe backup.', 'gold'); return s; } catch (e) { console.warn('save ' + which + ' invalid', e); }
    }
    if (raw) { st.unreadable = raw; toast('Your saved career could not be read. It was NOT deleted — export it before starting a new club.', 'bad', 6000); }
    return null;
  },
  write() {
    const s = st.save; if (!s) return;
    try {
      const j = A.Save.serialize(s), prev = localStorage.getItem(A.Save.KEY);
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
function pruneClaims(s) {
  const cur = s.league ? s.league.seasonId : '';
  for (const k in s.claims) if ((k.startsWith('ai:') || k.startsWith('fx:')) && !k.startsWith('ai:' + cur) && !k.startsWith('fx:' + cur)) delete s.claims[k];
}
function logRewards(r, label) {
  const s = st.save; if (!s || !r) return; const t = rewardLine(r).replace(/<[^>]+>/g, ''); if (!t) return;
  s.rewardLog = s.rewardLog || []; s.rewardLog.unshift({ at: Date.now(), label, text: t }); s.rewardLog.length = Math.min(s.rewardLog.length, 30);
}

// ======================= helpers: toast / modal =======================
function toast(text, cls, ms) { const box = $('toast'); if (!box) return; const d = document.createElement('div'); d.className = cls || ''; d.textContent = text; box.appendChild(d); setTimeout(() => d.remove(), ms || 2600); }
function modal(html, onClick) {
  const m = $('modal'); m.innerHTML = '<div class="sheet">' + html + '</div>'; m.classList.remove('hidden');
  m.onclick = e => { if (e.target === m && !m.dataset.lock) closeModal(); const b = e.target.closest('[data-m]'); if (b && onClick) onClick(b.dataset.m, b); };
}
function closeModal() { const m = $('modal'); m.classList.add('hidden'); m.innerHTML = ''; m.onclick = null; m.oninput = null; m.onchange = null; delete m.dataset.lock; }
function confirmBox(text, yes) { modal('<h2>Are you sure?</h2><p class="small">' + esc(text) + '</p><div class="grid2"><button class="btn ghost" data-m="no">Cancel</button><button class="btn coral" data-m="yes">Confirm</button></div>', m => { closeModal(); if (m === 'yes') yes(); }); }

// ======================= custom crest (shape + pixel symbol + colours + frame) =======================
const SYM = {
  lion: ['..###..', '.#####.', '##.#.##', '#######', '.##.##.', '.#####.', '..#.#..'],
  eagle: ['#.....#', '##...##', '###.###', '.#####.', '..###..', '..#.#..', '.##.##.'],
  star: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
  ball: ['..###..', '.#.#.#.', '##.#.##', '#.###.#', '##.#.##', '.#.#.#.', '..###..'],
  crown: ['#..#..#', '##.#.##', '#######', '#######', '.#####.', '.#####.', '.......'],
  bolt: ['...###.', '..###..', '.###...', '######.', '...###.', '..###..', '.##....'],
  wolf: ['#.....#', '##...##', '#######', '##.#.##', '.#####.', '..###..', '...#...'],
  anchor: ['...#...', '..###..', '...#...', '#..#..#', '##.#.##', '.#####.', '..###..']
};
function lum(c) { const n = parseInt(c.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function drawCrest(p, size, frame) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const N = 24, k = size / N; g.scale(k, k);
  const inShape = (x, y) => { const cx = x - 11.5, cy = y - 11.5;
    if (p.shape === 'round') return cx * cx + cy * cy <= 11 * 11;
    if (p.shape === 'hex') return Math.abs(cy) <= 11 && Math.abs(cx) <= 10 - Math.max(0, Math.abs(cy) - 5) * 0.9 + 1;
    return y >= 1 && y <= 22 && Math.abs(cx) <= (y < 14 ? 10.5 : 10.5 - (y - 14) * 1.25); };
  const edge = (x, y) => inShape(x, y) && (!inShape(x - 1, y) || !inShape(x + 1, y) || !inShape(x, y - 1) || !inShape(x, y + 1));
  const fr = { basic: '#0c0f17', silver: '#cfd6e6', steel: '#7f93b8', gold: '#ffcf3f', world: '#ffcf3f', champion: '#ffe27a' }[frame || 'basic'] || '#0c0f17';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!inShape(x, y)) continue;
    g.fillStyle = edge(x, y) ? fr : (y < 12 ? p.primary : (p.shape === 'shield' && ((x >> 2) % 2) ? p.secondary : p.primary)); g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = p.secondary; for (let x = 0; x < N; x++) for (let y = 3; y < 5; y++) if (inShape(x, y) && !edge(x, y)) g.fillRect(x, y, 1, 1);
  const sym = SYM[A.Club.SYMBOLS[p.symbol]] || SYM.lion, sc = lum(p.primary) > 0.55 ? '#141414' : '#ffffff';
  g.fillStyle = '#0006'; sym.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') g.fillRect(9 + i, 8 + j, 1, 1); }));
  g.fillStyle = sc; sym.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') g.fillRect(8 + i, 7 + j, 1, 1); }));
  if (frame === 'world' || frame === 'champion') { g.fillStyle = '#fff6c8'; g.fillRect(11, 0, 2, 1); g.fillRect(2, 2, 1, 1); g.fillRect(21, 2, 1, 1); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (size >= 48 && p.short) F.draw(g, String(p.short).slice(0, 5), size / 2, Math.round(size * 0.66), { scale: Math.max(1, Math.round(size / 48)), bold: true, color: sc, outline: '#0c0f17', align: 'center' });
  return cv;
}
function teamObj(id) { const c = A.club(id); return { id: c.id, name: c.displayName, visual: c.src.visual, type: 'club' }; }
function crestCv(id, size) {
  const s = st.save;
  if (id === A.PLAYER_CLUB && s) { const p = s.profile, key = 'P:' + size + ':' + JSON.stringify(p); let cv = st.crest.get(key); if (!cv) { cv = drawCrest(p, size, p.frame); st.crest.set(key, cv); } return cv; }
  const key = id + ':' + size; let cv = st.crest.get(key); if (cv) return cv;
  cv = S.generatedCrest(teamObj(id), size); st.crest.set(key, cv); return cv;
}
function crestURL(id) { const s = st.save, k = 'u:' + id + (id === A.PLAYER_CLUB && s ? JSON.stringify(s.profile) : ''); let u = st.crest.get(k); if (!u) { u = crestCv(id, 64).toDataURL(); st.crest.set(k, u); } return u; }
function cimg(id, size) { return '<img class="crest" style="width:' + size + 'px;height:' + size + 'px" src="' + crestURL(id) + '" alt="">'; }
function cname(id) { return A.club(id).displayName; }
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
  if (hs === 0) { g.fillRect(7, 4, 10, 3); g.fillRect(6, 5, 1, 4); g.fillRect(17, 5, 1, 4); } else if (hs === 1) g.fillRect(7, 5, 10, 2);
  else if (hs === 2) { g.fillRect(6, 3, 12, 4); g.fillRect(5, 5, 2, 7); g.fillRect(17, 5, 2, 7); } else if (hs === 3) { g.fillRect(9, 2, 6, 4); g.fillRect(7, 5, 10, 1); }
  else { g.fillRect(7, 5, 10, 2); g.fillRect(7, 14, 10, 2); g.fillRect(8, 13, 8, 1); }
  g.fillStyle = '#0b0d16'; g.fillRect(9, 10, 2, 2); g.fillRect(13, 10, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(9, 10, 1, 1); g.fillRect(13, 10, 1, 1);
  g.fillStyle = '#00000055'; g.fillRect(10, 13, 4, 1);
  if ((h >>> 12) % 3 === 0) { g.fillStyle = hair; g.fillRect(8, 13, 8, 1); }
  if (d.rarity === 'legendary') { g.fillStyle = '#fff6c8'; g.fillRect(1, 1, 2, 2); g.fillRect(21, 1, 2, 2); }
  u = c.toDataURL(); st.portrait.set(id, u); return u;
}
function rarityPill(r) { return '<span class="pill r-' + r + '" style="border-color:currentColor">' + RAR_N[r] + '</span>'; }
function starProg(c) { const SM = A.Stars.SM, r = A.Stars.rank(c), nx = SM.xp[r + 1]; return { r, name: SM.names[r], pct: nx == null ? 1 : (c.xp - SM.xp[r]) / (nx - SM.xp[r]), txt: nx == null ? 'MAX' : c.xp + '/' + nx + ' XP' }; }
function starCardHTML(id, opts) {
  const s = st.save, d = A.Stars.def(id); opts = opts || {}; const c = opts.cand || s.stars[id];
  const ovr = opts.cand ? c.ovr : A.Stars.effOvr(c).toFixed(1).replace(/\.0$/, '');
  const pr = !opts.cand ? starProg(c) : null;
  const cls = ['sc', d.rarity, opts.active ? 'act' : '', opts.sel ? 'sel' : '', opts.anim ? 'flip' : ''].join(' ');
  return '<div class="' + cls + '" data-star="' + id + '" ' + (opts.attr || '') + ' style="' + (opts.style || '') + '">' +
    '<img class="pt" src="' + portrait(id) + '" alt=""><div class="ovr r-' + d.rarity + '">' + ovr + '<small>' + ROLE_S[d.role] + '</small></div>' +
    '<div class="rb">' + (opts.dup ? '<span class="pill gold">DUP</span>' : '') + '</div>' +
    '<div class="nm">' + esc(d.name) + '</div><div class="ab">' + esc(ABIL[d.ability][0]) + ' ' + TIER_N[A.Stars.TIER[d.rarity]] + '</div>' +
    (pr ? '<div class="ct"><span class="r-' + d.rarity + '">' + pr.name + '</span><span>' + pr.txt + '</span></div><div class="bar gold" style="height:4px;margin-top:3px"><i style="width:' + Math.round(pr.pct * 100) + '%"></i></div>'
      : '<div class="ct"><span class="r-' + d.rarity + '">' + RAR_N[d.rarity] + '</span><span>Permanent</span></div>') + '</div>';
}
function rewardLine(r) {
  if (!r) return '';
  const p = [];
  if (r.credits) p.push('<b class="gold-t">+' + fmt(r.credits) + ' C</b>'); if (r.xp) p.push('<b class="mint">+' + r.xp + ' XP</b>'); if (r.frags) p.push('<b style="color:#8ff3ff">+' + r.frags + ' F</b>');
  for (const k in r.packs || {}) p.push('<b>+' + r.packs[k] + ' ' + k + ' pack</b>');
  for (const k in r.academy || {}) p.push('<b>+' + r.academy[k] + ' Academy ' + (k === 'a10' ? '+10' : '+5') + '</b>');
  if (r.crest) p.push('<b class="gold-t">Golden Champion Crest</b>'); if (r.banner) p.push('<b class="gold-t">Eternal Club Banner</b>');
  return p.join(' · ');
}

// ======================= top bar / tab bar =======================
function badges() {
  const s = st.save, o = {};
  o.rewards = (s.pendingDraft ? 1 : 0) + s.packs.standard + (A.Draft.unlocked(s, 'premium') ? s.packs.premium : 0) + (A.Draft.unlocked(s, 'legend') ? s.packs.legend : 0);
  o.club = A.Upgrades.KEYS.filter(k => { const c = A.Upgrades.cost(s.upgrades[k]); return c != null && s.credits >= c; }).length;
  o.powers = Object.keys(s.powers.unlocked).filter(id => !(s.powers.seenUnlock || {})[id] && A.Powers.def(id).unlock.t !== 'start').length;
  o.squad = s.academy.a5 + s.academy.a10;
  return o;
}
function renderTop() {
  const s = st.save; const tb = $('topbar');
  if (!s) { tb.classList.add('hidden'); $('tabbar').classList.add('hidden'); return; }
  tb.classList.remove('hidden'); $('tabbar').classList.remove('hidden');
  const pr = A.Progression.progress(s);
  tb.innerHTML = '<img class="crest" src="' + crestURL(s.club) + '" alt=""><div class="who"><b>' + esc(s.profile.name) + '</b><small>' + (s.division === 1 ? 'Champions League' : 'Division ' + s.division) + ' · Lv ' + s.level +
    '</small><div class="bar" style="height:4px;margin-top:3px;max-width:150px"><i style="width:' + Math.round(pr.pct * 100) + '%"></i></div></div>' +
    '<span class="cur"><i class="c">C</i>' + fmt(s.credits) + '</span><span class="cur"><i class="f"><span>F</span></i>' + fmt(s.fragments) + '</span>' +
    '<button class="iconbtn fsbtn" data-act="fullscreen" aria-label="Full screen">' + (isFull() ? '🗗' : '⛶') + '</button><button class="iconbtn" data-act="settings" aria-label="Settings">⚙️</button>';
  const b = badges();
  document.querySelectorAll('#tabbar [data-tab]').forEach(btn => { const k = btn.dataset.tab, el = btn.querySelector('.badge'); if (el) { el.textContent = b[k] || ''; el.classList.toggle('hidden', !b[k]); } btn.classList.toggle('on', k === st.tab); });
}
function render() {
  renderTop();
  const scr = $('screen');
  if (!st.save) { scr.innerHTML = createHTML(); bindCreate(); return; }
  scr.onclick = null;
  const warn = st.storageOk ? '' : '<div class="warnbar">⚠️ ' + esc(st.storageMsg) + '</div>';
  const map = { club: clubHTML, squad: squadHTML, powers: powersHTML, league: leagueHTML, rewards: rewardsHTML };
  scr.innerHTML = warn + (map[st.tab] || clubHTML)();
  if (st.tab === 'powers') { const s = st.save; s.powers.seenUnlock = s.powers.seenUnlock || {}; let ch = false; for (const id in s.powers.unlocked) if (!s.powers.seenUnlock[id]) { s.powers.seenUnlock[id] = 1; ch = true; } if (ch) { persist(); renderTop(); } }
}
function go(tab) { st.tab = tab; render(); window.scrollTo(0, 0); }

// ======================= CREATE YOUR CLUB =======================
let draftProfile = null, draftForm = 'balanced';
function createHTML() {
  if (!draftProfile) draftProfile = A.Club.defaultProfile();
  const p = draftProfile;
  const shapes = A.Club.SHAPES.map(sh => '<button data-cc="shape:' + sh + '" class="' + (p.shape === sh ? 'on' : '') + '" aria-label="' + sh + '"><canvas data-crest="' + sh + ':' + p.symbol + '" width="38" height="38"></canvas></button>').join('');
  const syms = A.Club.SYMBOLS.map((sy, i) => '<button data-cc="sym:' + i + '" class="' + (p.symbol === i ? 'on' : '') + '" aria-label="' + sy + '"><canvas data-crest="' + p.shape + ':' + i + '" width="38" height="38"></canvas></button>').join('');
  const sw = k => COLORS.map(c => '<button data-cc="' + k + ':' + c + '" class="' + (p[k] === c ? 'on' : '') + '" aria-label="' + c + '"><span class="sw" style="background:' + c + '"></span></button>').join('');
  const forms = Object.keys(A.FORMATIONS).map(k => { const f = A.FORMATIONS[k]; return '<button class="fm' + (draftForm === k ? ' on' : '') + '" data-cc="form:' + k + '"><b>' + f.name + '</b><div class="rc">ST ' + f.roles.striker + ' · WG ' + f.roles.winger + '<br>PM ' + f.roles.playmaker + ' · DF ' + f.roles.defender + '<br>GK ' + f.roles.goalkeeper + ' · SP ' + f.roles.support + '</div></button>'; }).join('');
  return '<div class="titlescr" style="padding:8px 0 0"><canvas id="logoCv" width="360" height="104"></canvas></div>' +
    (st.storageOk ? '' : '<div class="warnbar">⚠️ ' + esc(st.storageMsg || 'Storage unavailable') + '</div>') +
    (st.unreadable ? '<div class="warnbar">An older save exists in this browser but could not be read (it was not deleted). <button class="btn sm" data-act="exportRaw">Export it</button></div>' : '') +
    '<div class="card"><div class="title" style="margin-top:0">Create your club</div>' +
    '<div class="cc-prev"><canvas id="ccCrest" width="88" height="88"></canvas><div class="kitprev" id="ccKit"></div></div>' +
    '<div class="lbl2">Club name (3–22)</div><input class="txt" id="ccName" maxlength="22" value="' + esc(p.name) + '" autocomplete="off">' +
    '<div class="lbl2">Short name (2–5)</div><input class="txt" id="ccShort" maxlength="5" value="' + esc(p.short) + '" autocomplete="off" style="text-transform:uppercase">' +
    '<div class="lbl2">Crest shape</div><div class="opts">' + shapes + '</div>' +
    '<div class="lbl2">Crest symbol</div><div class="opts">' + syms + '</div>' +
    '<div class="lbl2">Main kit colour</div><div class="opts">' + sw('primary') + '</div>' +
    '<div class="lbl2">Second kit colour</div><div class="opts">' + sw('secondary') + '</div>' +
    '<div class="lbl2">Starting formation</div><div class="forms">' + forms + '</div>' +
    '<p class="note">Starting Favorite Powers: <b>Rocket Boots</b> + <b>Fortress</b> (change any time). Everything here can be edited later for free.</p>' +
    '<p class="note coral" id="ccErr"></p>' +
    '<button class="btn gold block" id="ccGo">FOUND CLUB &amp; START</button>' +
    '<div class="row" style="margin-top:8px"><button class="btn sm ghost grow" data-act="import">Import save file</button></div></div>' +
    '<p class="note">Independent fan-made arcade game. Rival clubs use adapted names and original pixel crests — no official logos, licensed kits or real player names/portraits.</p>';
}
function drawCrestInto(cv, p, frame) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, cv.width, cv.height); g.drawImage(drawCrest(p, cv.width, frame || p.frame), 0, 0); }
function kitCSS(p) {
  const a = p.primary, b = p.secondary;
  const pat = { solid: a, stripes: 'repeating-linear-gradient(90deg,' + a + ' 0 8px,' + b + ' 8px 14px)', hoops: 'repeating-linear-gradient(0deg,' + a + ' 0 9px,' + b + ' 9px 15px)', halves: 'linear-gradient(90deg,' + a + ' 50%,' + b + ' 50%)', sash: 'linear-gradient(135deg,' + a + ' 40%,' + b + ' 40% 58%,' + a + ' 58%)', sleeves: 'linear-gradient(90deg,' + b + ' 0 14px,' + a + ' 14px calc(100% - 14px),' + b + ' calc(100% - 14px))' };
  return pat[p.kit || 'solid'] || a;
}
function bindCreate() {
  const cv = $('logoCv'); if (cv) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; F.draw(g, 'FOOTBALL WARS', 180, 16, { scale: 4, bold: true, color: '#ffffff', color2: '#ffcf3f', align: 'center' }); F.draw(g, 'ROAD TO GLORY', 180, 64, { scale: 3, bold: true, color: '#3df2b5', color2: '#1fbf8c', align: 'center' }); }
  const p = draftProfile;
  const refresh = () => {
    drawCrestInto($('ccCrest'), p); $('ccKit').style.background = kitCSS(p);
    document.querySelectorAll('[data-crest]').forEach(c => { const [sh, sy] = c.dataset.crest.split(':'); drawCrestInto(c, Object.assign({}, p, { shape: sh, symbol: +sy, short: '' })); });
  };
  refresh();
  $('ccName').oninput = e => { p.name = e.target.value; const auto = p.name.trim().split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 4); if (!st.shortTouched && auto.length >= 2) { p.short = auto; $('ccShort').value = auto; } refresh(); };
  $('ccShort').oninput = e => { st.shortTouched = true; p.short = e.target.value.toUpperCase(); refresh(); };
  $('screen').onclick = e => {
    const b = e.target.closest('[data-cc]'); if (!b) return; AU.init(); AU.ui();
    const [k, v] = b.dataset.cc.split(':');
    if (k === 'shape') p.shape = v; else if (k === 'sym') p.symbol = +v; else if (k === 'primary' || k === 'secondary') p[k] = v; else if (k === 'form') draftForm = v;
    const y = window.scrollY; render(); window.scrollTo(0, y);
  };
  $('ccGo').onclick = () => {
    const prof = Object.assign({}, p, { name: p.name.trim(), short: p.short.trim() });
    const why = A.Club.validProfile(prof);
    if (why) { $('ccErr').textContent = why; AU.play('error', 0.3); return; }
    if (p.primary === p.secondary) { $('ccErr').textContent = 'Pick two different kit colours'; return; }
    const a = new Uint32Array(1); (root.crypto || { getRandomValues: x => { x[0] = Date.now() >>> 0; } }).getRandomValues(a);
    st.save = A.Save.fresh(prof, a[0] || 1, draftForm); st.unreadable = null; persist(); AU.init(); AU.ui('coin'); st.tab = 'club'; render(); startAI();
    toast(st.save.profile.name + ' founded! Your first match is waiting.', 'gold', 3200);
  };
}

// ======================= CLUB (home) =======================
function nextAction() {
  const s = st.save, L = s.league;
  if (s.pendingBattle) return { label: 'RESUME BATTLE', sub: s.pendingBattle.snap.label, act: 'resume' };
  if (s.pendingDecision) return { label: 'REMATCH', sub: 'Free rematch — adjust squad, formation or Powers first if you like', act: 'rematch' };
  if (L.phase === 'regular') {
    if (L.round < 19) { const fx = A.League.playerFixture(s); return { label: 'BATTLE', sub: 'Match ' + (L.round + 1) + '/19 · vs ' + cname(fx.opp), act: 'league', quick: true }; }
    return { label: 'FINISHING SEASON', sub: 'Last round · ' + L.aiQueue.length + ' rival matches left', act: 'wait', disabled: true };
  }
  if (L.phase === 'promoted') return { label: 'PROMOTION!', sub: 'Advance to ' + (L.div === 2 ? 'the Champions League' : 'Division ' + (L.div - 1)), act: 'promote' };
  if (L.phase === 'promo') { const P = s.promo && s.promo.season === L.seasonId && !s.promo.done ? s.promo : null; return { label: P ? 'PROMOTION GAME ' + (P.games.length + 1) : 'PROMOTION CHALLENGE', sub: P ? 'Best of 3 · ' + P.wins + 'W ' + P.losses + 'L' : 'Best of 3 vs Division ' + (L.div - 1) + ' sides', act: 'promo' }; }
  if (L.phase === 'ended') return { label: 'NEW SEASON', sub: 'Endless Champions League · Season ' + (s.endless.seasons + 1), act: 'newseason' };
  return { label: 'BATTLE', act: 'none', disabled: true };
}
function onboardTip() {
  const s = st.save, seen = s.onboard.seen, n = s.officialPlayed;
  if (s.onboard.done) return ''; // migrated careers skip the new-club onboarding
  const T = [
    [0, 'm1', '<b>Match 1:</b> 100 of your players vs 100 rivals — a real football battle. Powers fire on their own; every goal brings <b>+3 reinforcements</b>. Press BATTLE and watch.'],
    [1, 'm2', '<b>Train your squad:</b> spend Credits in Training below (your first match also paid a <b>+45 Founder\'s Bonus</b>).'],
    [2, 'm3', '<b>Formation & Favorites:</b> pick Balanced, All-Out Attack or Iron Fortress in <b>Squad</b>, and your 2 Favorite Powers in <b>Powers</b>.'],
    [3, 'm4', '<b>Free Standard Draft:</b> open it in <b>Rewards</b> — three stars, sign one. Stars are permanent and grow with Star Mastery.'],
    [4, 'm5', '<b>First Steps milestone reached:</b> +2 Pack Fragments. More milestones after match 9 and 14.'],
    [5, 'm6', null]
  ];
  for (const [need, id, txt] of T) {
    if (n < need || seen[id]) continue;
    if (id === 'm6') { const ms = Object.keys(s.powers.mastery).length, top = Object.values(s.stars).sort((a, b) => b.xp - a.xp)[0];
      return '<div class="tip"><button class="x" data-act="tip:m6" aria-label="Dismiss">✕</button><b>After 5 matches:</b> Team Level ' + s.level + ' · ' + ms + ' different Powers used' + (top ? ' · ' + esc(A.Stars.def(top.id).name) + ' is ' + starProg(top).name : '') + '. Next goal: top 3 for direct promotion (the title pays ' + (5 * A.Economy.WIN_C[s.division]) + ' C).</div>'; }
    return '<div class="tip"><button class="x" data-act="tip:' + id + '" aria-label="Dismiss">✕</button>' + txt + '</div>';
  }
  return '';
}
function clubHTML() {
  const s = st.save, L = s.league, na = nextAction(), power = A.Upgrades.power(s), stg = A.Club.STAGES[A.stageOf(s.highestDiv)];
  let opp = '';
  if (L.phase === 'regular' && L.round < 19) {
    const fx = A.League.playerFixture(s), r = A.League.rating(s, fx.opp, L.div, L.seasonId);
    opp = '<div class="card"><div class="tiny dim" style="text-align:center;font-weight:800;letter-spacing:.08em">NEXT · ' + (L.div === 1 ? 'CHAMPIONS LEAGUE' : 'DIVISION ' + L.div) + ' · MATCH ' + (L.round + 1) + '/19</div>' +
      '<div class="vs" style="margin-top:8px"><div>' + cimg(s.club, 56) + '<div class="nm">' + esc(s.profile.name) + '</div><div class="pw">PWR ' + power.toFixed(1) + ' · ' + A.FORMATIONS[s.formation].name + '</div></div><div class="mid">VS</div>' +
      '<div>' + cimg(fx.opp, 56) + '<div class="nm">' + esc(cname(fx.opp)) + '</div><div class="pw">PWR ' + r.toFixed(1) + '</div></div></div></div>';
  } else if (L.phase === 'promo' && s.promo && !s.promo.done && s.promo.season === L.seasonId) {
    const o = s.promo.opps[s.promo.games.length], r = A.League.rating(s, o, L.div - 1, L.seasonId);
    opp = '<div class="card gold"><div class="tiny gold-t" style="text-align:center;font-weight:800">PROMOTION CHALLENGE · GAME ' + (s.promo.games.length + 1) + ' ' + s.promo.games.join(' ') + '</div><div class="vs" style="margin-top:8px"><div>' + cimg(s.club, 56) + '<div class="nm">' + esc(s.profile.name) + '</div><div class="pw">PWR ' + power.toFixed(1) + '</div></div><div class="mid">VS</div><div>' + cimg(o, 56) + '<div class="nm">' + esc(cname(o)) + '</div><div class="pw">PWR ' + r.toFixed(1) + '</div></div></div></div>';
  }
  const alerts = [];
  if (s.pendingDraft) alerts.push('<button class="btn gold block" data-act="tab:rewards">⭐ Your draft is waiting — sign a star!</button>');
  const inv = badges().rewards - (s.pendingDraft ? 1 : 0);
  if (!s.pendingDraft && inv) alerts.push('<button class="btn mint block" data-act="tab:rewards">🎁 ' + inv + ' unopened pack' + (inv > 1 ? 's' : '') + '</button>');
  const aiInfo = L.aiQueue.length ? '<div class="tiny dim" style="text-align:center;margin-top:6px">⚙️ Simulating ' + L.aiQueue.length + ' rival league match' + (L.aiQueue.length > 1 ? 'es' : '') + ' (real 100 vs 100)…</div>' : '';
  const train = A.Upgrades.KEYS.map(k => { const Lv = s.upgrades[k], c = A.Upgrades.cost(Lv), v = A.Upgrades.value(k, Lv);
    return '<div class="up" style="margin:6px 0"><div class="ic">' + STAT_N[k][1] + '</div><div><div style="font-weight:900">' + STAT_N[k][0] + ' <span class="lv">Lv.' + Lv + '/30</span></div><div class="v small">' + v.toFixed(1) + (c != null ? ' <span class="mint tiny">→ ' + (v + 1.65).toFixed(1) + '</span>' : '') + '</div></div>' +
      (c == null ? '<span class="pill gold">MAX</span>' : '<button class="btn sm ' + (s.credits >= c ? 'gold' : '') + '" data-act="up:' + k + '"' + (s.credits >= c ? '' : ' disabled') + '>+ ' + fmt(c) + ' C</button>') + '</div>'; }).join('');
  const tro = s.trophies.slice(-8).reverse();
  return alerts.join('') + onboardTip() + opp +
    '<button class="battle-btn" data-act="' + na.act + '"' + (na.disabled ? ' disabled' : '') + '>' + esc(na.label) + '<small>' + esc(na.sub || '') + '</small></button>' +
    (na.quick ? '<div class="row" style="margin-top:8px"><button class="btn sm ghost grow" data-act="quick">⏩ Quick Sim (same engine)</button><button class="btn sm ghost grow" data-act="tab:league">📊 Table</button></div>' : '') +
    (na.act === 'rematch' ? '<div class="row" style="margin-top:8px"><button class="btn sm ghost grow" data-act="tab:squad">Adjust squad</button><button class="btn sm ghost grow" data-act="acceptloss">Accept the loss</button></div>' : '') +
    (L.phase === 'promo' && !(s.promo && !s.promo.done && s.promo.season === L.seasonId) ? '<button class="btn sm ghost block" style="margin-top:8px" data-act="replayseason">↻ Replay the Division ' + L.div + ' season instead</button>' : '') + aiInfo +
    (s.coach && s.coach.roadmap ? '<div class="coach"><b>🧭 Comeback Roadmap</b><ol style="margin:4px 0 0 18px;padding:0">' + s.coach.roadmap.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></div>' : '') +
    '<div class="title">Training <span class="sp"></span><span class="pill">Squad Power ' + power.toFixed(1) + '</span></div><div class="card">' + train + '<p class="note">Training is permanent. Stats feed the real V4 battle attributes (pressing, finishing, goalkeeping… blend two or three).</p></div>' +
    '<div class="title">Club <span class="sp"></span><span class="pill mint">' + esc(stg.name) + '</span></div>' +
    '<div class="card"><div class="row">' + cimg(s.club, 64) + '<div class="grow"><b style="font-size:16px">' + esc(s.profile.name) + '</b> <span class="pill">' + esc(s.profile.short) + '</span><div class="tiny dim">' + A.FORMATIONS[s.formation].name + ' · kit ' + esc(s.profile.kit) + ' · frame ' + esc(s.profile.frame) + (s.cosmetics.banner ? ' · Eternal Club Banner' : '') + '</div><div class="kitprev" style="width:34px;height:38px;margin-top:6px;background:' + kitCSS(s.profile) + '"></div></div>' +
    '<button class="btn sm" data-act="identity">Edit</button></div></div>' +
    '<div class="title">Trophy Cabinet <span class="sp"></span><span class="pill gold">' + s.trophies.length + '</span></div><div class="card">' +
    (tro.length || s.goldenCrest || s.cosmetics.banner ? '<div class="trophies">' + (s.goldenCrest ? '<div class="trophy-c gold"><div class="t">🛡️</div>Golden Champion Crest</div>' : '') + (s.cosmetics.banner ? '<div class="trophy-c gold"><div class="t">🎌</div>Eternal Club Banner</div>' : '') +
      tro.map(t => '<div class="trophy-c' + (t.type === 'd1_champion' || t.type === 'endless_champion' ? ' gold' : '') + '"><div class="t">' + TROPHY[t.type][0] + '</div>' + TROPHY[t.type][1] + '<br><span class="dim">' + esc(t.season) + '</span></div>').join('') + '</div>' : '<p class="dim small">No trophies yet — win a Division, survive a Promotion Challenge, conquer the Champions League.</p>') + '</div>' +
    '<div class="title">Club Journey</div><div class="card"><div class="journey">' + A.Club.STAGES.map((g, i) => { const cur = i === A.stageOf(s.highestDiv), done = i < A.stageOf(s.highestDiv);
      return '<div class="jrow' + (cur ? ' cur' : done ? ' done' : '') + '"><b>' + (g.from === 10 ? 'D10' : g.from === 1 ? 'D1' : 'D' + g.from + '–' + (g.from - 1)) + '</b><div>' + esc(g.name) + '<div class="tiny dim">' + (g.kits.length ? 'Kits: ' + g.kits.join(', ') : '') + (g.frames.length ? (g.kits.length ? ' · ' : '') + 'Frame: ' + g.frames.join(', ') : '') + ' · stands evolve</div></div><span>' + (done || cur ? '✅' : '🔒') + '</span></div>'; }).join('') + '</div></div>' +
    '<div class="card small"><div class="row wrap" style="gap:6px"><span class="pill">Battles ' + s.stats.battles + '</span><span class="pill mint">W ' + s.stats.wins + '</span><span class="pill coral">L ' + s.stats.losses + '</span><span class="pill">Goals ' + s.career.goals + '</span><span class="pill">Ball wins ' + s.career.ballWins + '</span><span class="pill">Subs ' + s.career.reinforcements + '</span>' + (s.endless.titles ? '<span class="pill gold">🌍 ×' + s.endless.titles + '</span>' : '') + '</div></div>';
}
function identityModal() {
  const s = st.save, p = Object.assign({}, s.profile);
  const onM = m => {
    if (m === 'close') return closeModal();
    if (m === 'save') { if (p.primary === p.secondary) { $('idErr').textContent = 'Pick two different colours'; return; } const why = A.Club.setProfile(s, p); if (why) { $('idErr').textContent = why; return; } st.crest.clear(); persist(); closeModal(); render(); toast('Club identity saved', 'gold'); return; }
    const [k, v] = m.split(':');
    if (k === 'shape') p.shape = v; else if (k === 'sym') p.symbol = +v; else if (k === 'primary' || k === 'secondary') p[k] = v; else if (k === 'kit') p.kit = v; else if (k === 'frame') p.frame = v;
    draw();
  };
  const draw = () => {
    const shapes = A.Club.SHAPES.map(sh => '<button data-m="shape:' + sh + '" class="' + (p.shape === sh ? 'on' : '') + '">' + sh + '</button>').join('');
    const syms = A.Club.SYMBOLS.map((sy, i) => '<button data-m="sym:' + i + '" class="' + (p.symbol === i ? 'on' : '') + '">' + sy + '</button>').join('');
    const sw = k => COLORS.map(c => '<button data-m="' + k + ':' + c + '" class="' + (p[k] === c ? 'on' : '') + '"><span class="sw" style="background:' + c + '"></span></button>').join('');
    const kits = A.Club.KITS.map(k => { const ok = s.cosmetics.kits.indexOf(k) >= 0; return '<button data-m="kit:' + k + '" class="' + (p.kit === k ? 'on' : '') + '"' + (ok ? '' : ' disabled title="Unlocks on the Club Journey"') + '>' + (ok ? '' : '🔒 ') + k + '</button>'; }).join('');
    const frames = ['basic', 'silver', 'steel', 'gold', 'world', 'champion'].map(f => { const ok = s.cosmetics.frames.indexOf(f) >= 0; return '<button data-m="frame:' + f + '" class="' + (p.frame === f ? 'on' : '') + '"' + (ok ? '' : ' disabled') + '>' + (ok ? '' : '🔒 ') + f + '</button>'; }).join('');
    modal('<h2>Club identity</h2><div class="cc-prev"><canvas id="idCrest" width="88" height="88"></canvas><div class="kitprev" style="background:' + kitCSS(p) + '"></div></div>' +
      '<div class="lbl2">Name</div><input class="txt" id="idName" maxlength="22" value="' + esc(p.name) + '"><div class="lbl2">Short name</div><input class="txt" id="idShort" maxlength="5" value="' + esc(p.short) + '">' +
      '<div class="lbl2">Shape</div><div class="opts">' + shapes + '</div><div class="lbl2">Symbol</div><div class="opts">' + syms + '</div>' +
      '<div class="lbl2">Main colour</div><div class="opts">' + sw('primary') + '</div><div class="lbl2">Second colour</div><div class="opts">' + sw('secondary') + '</div>' +
      '<div class="lbl2">Kit pattern</div><div class="opts">' + kits + '</div><div class="lbl2">Crest frame</div><div class="opts">' + frames + '</div>' +
      '<p class="note">Free to change. Cosmetics never affect battle strength.</p><p class="note coral" id="idErr"></p><div class="grid2"><button class="btn ghost" data-m="close">Cancel</button><button class="btn gold" data-m="save">Save</button></div>', onM);
    drawCrestInto($('idCrest'), p);
    $('idName').oninput = e => { p.name = e.target.value; }; $('idShort').oninput = e => { p.short = e.target.value.toUpperCase(); };
  };
  draw();
}

// ======================= SQUAD =======================
function squadHTML() {
  const s = st.save, f = st.sub.coll, so = st.sub.sort;
  const forms = Object.keys(A.FORMATIONS).map(k => { const F2 = A.FORMATIONS[k]; return '<button class="fm' + (s.formation === k ? ' on' : '') + '" data-act="form:' + k + '"><b>' + F2.name + '</b><div class="rc">ST ' + F2.roles.striker + ' · WG ' + F2.roles.winger + '<br>PM ' + F2.roles.playmaker + ' · DF ' + F2.roles.defender + '<br>GK ' + F2.roles.goalkeeper + ' · SP ' + F2.roles.support + ' · CP 1</div></button>'; }).join('');
  let list = A.Stars.list(s); const total = list.length;
  list = list.filter(c => f === 'all' ? true : f === 'active' ? A.Stars.isActive(s, c.id) : !A.Stars.isActive(s, c.id));
  const ri = r => A.RARITIES.indexOf(r);
  list.sort((a, b) => so === 'ovr' ? A.Stars.effOvr(b) - A.Stars.effOvr(a) : so === 'rarity' ? ri(b.rarity) - ri(a.rarity) || A.Stars.effOvr(b) - A.Stars.effOvr(a) : so === 'pos' ? A.Stars.def(a.id).role.localeCompare(A.Stars.def(b.id).role) : b.xp - a.xp);
  const act = s.active.map(id => s.stars[id]).filter(Boolean);
  const slots = [0, 1, 2, 3, 4].map(i => { const x = act[i]; if (!x) return '<div class="slot">Empty<br>slot</div>'; const d = A.Stars.def(x.id); return '<div class="slot f" data-star="' + x.id + '" style="border-color:' + RCOL[d.rarity][0] + '"><img src="' + portrait(x.id) + '" alt=""><b>' + esc(d.name.split(' ')[1] || d.name) + '</b><span class="tiny">' + ROLE_S[d.role] + ' ' + A.Stars.effOvr(x).toFixed(1) + '</span></div>'; }).join('');
  return '<div class="title">Formation <span class="sp"></span><span class="pill">100 players</span></div><div class="forms">' + forms + '</div>' +
    '<p class="note">' + esc(A.FORMATIONS[s.formation].desc) + ' All three share the same total power budget; the role mix and tactics change how the 100 really play.</p>' +
    '<div class="title">Active five <span class="sp"></span><span class="pill">' + act.length + '/5</span></div><div class="slots">' + slots + '</div>' +
    '<p class="note">Stars are permanent club players: each replaces one standard player of its role. Active stars earn Star XP (+3 win, +1 loss, +2 first Challenge win) and adapt to a new Division after 6 matches there.</p>' +
    (s.academy.a5 || s.academy.a10 ? '<div class="card small">🎓 Academy Training Tickets: <b>+5 × ' + s.academy.a5 + '</b> · <b>+10 × ' + s.academy.a10 + '</b> — tap a star to train it.</div>' : '') +
    '<div class="title">Collection <span class="sp"></span><span class="pill">' + total + ' / ' + A.Stars.defs.length + '</span></div>' +
    '<div class="seg">' + [['all', 'All'], ['active', 'Active'], ['reserve', 'Reserve']].map(([k, n]) => '<button data-act="cf:' + k + '" class="' + (f === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div><div style="height:6px"></div>' +
    '<div class="seg">' + [['ovr', 'OVR'], ['rarity', 'Rarity'], ['pos', 'Position'], ['xp', 'Mastery']].map(([k, n]) => '<button data-act="cs:' + k + '" class="' + (so === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div><div style="height:8px"></div>' +
    (list.length ? '<div class="stars">' + list.map(c => starCardHTML(c.id, { active: A.Stars.isActive(s, c.id) })).join('') + '</div>' : '<div class="card dim small">' + (total ? 'No star in this filter.' : 'No stars yet — your free Standard Draft arrives after match 3 (Rewards).') + '</div>');
}
function starModal(id) {
  const s = st.save, c = s.stars[id], d = A.Stars.def(id), act = A.Stars.isActive(s, id), why = A.Stars.canEquip(s, id), pr = starProg(c), SM = A.Stars.SM;
  const adaptRows = Object.keys(c.adaptGames || {}).map(dv => 'D' + dv + ': ' + c.adaptGames[dv] + '/6').join(' · ');
  const html = '<div class="row"><img src="' + portrait(id) + '" style="width:72px;height:72px;image-rendering:pixelated;border-radius:12px" alt=""><div class="grow"><h2>' + esc(d.name) + '</h2>' + rarityPill(d.rarity) + ' <span class="pill">' + ROLE_N[d.role] + '</span> <span class="pill gold">OVR ' + A.Stars.effOvr(c).toFixed(1) + '</span></div></div>' +
    '<div class="card" style="margin-top:10px"><b>' + esc(ABIL[d.ability][0]) + ' ' + TIER_N[A.Stars.TIER[d.rarity]] + '</b> <span class="tiny mint">+' + Math.round(SM.abil[pr.r] * 100) + '% mastery</span><div class="small dim">' + esc(ABIL[d.ability][1]) + '</div></div>' +
    '<div class="card"><div class="row"><b class="grow">Star Mastery: ' + pr.name + '</b><span class="tiny">' + pr.txt + '</span></div><div class="bar gold" style="margin-top:6px"><i style="width:' + Math.round(pr.pct * 100) + '%"></i></div>' +
    '<div class="kv" style="margin-top:8px"><dt>Draft OVR</dt><dd>' + c.ovr + '</dd><dt>League Adaptation</dt><dd>' + A.Stars.baseOvr(c) + (adaptRows ? ' (' + adaptRows + ')' : '') + '</dd><dt>Mastery bonus</dt><dd>+' + SM.ovr[pr.r] + ' OVR</dd><dt>Effective OVR (in battle)</dt><dd>' + A.Stars.effOvr(c).toFixed(1) + '</dd><dt>Battles</dt><dd>' + (c.battles || 0) + '</dd></div></div>' +
    '<div class="grid2" style="margin-top:12px">' + (act ? '<button class="btn coral" data-m="remove">Remove</button>' : '<button class="btn mint" data-m="equip"' + (why ? ' disabled' : '') + '>Equip</button>') +
    (!act && s.active.length ? '<button class="btn" data-m="replace">Replace…</button>' : '<button class="btn ghost" data-m="close">Close</button>') +
    '<button class="btn gold" data-m="a5"' + (s.academy.a5 > 0 ? '' : ' disabled') + '>Train +5 XP (' + s.academy.a5 + ')</button><button class="btn gold" data-m="a10"' + (s.academy.a10 > 0 ? '' : ' disabled') + '>Train +10 XP (' + s.academy.a10 + ')</button></div>' +
    (why && !act ? '<p class="note">' + esc(why) + '</p>' : '');
  modal(html, (m) => {
    if (m === 'close') return closeModal();
    if (m === 'equip') { if (A.Stars.equip(s, id)) { AU.ui('upgrade'); persist(); toast(d.name + ' is in your active five'); } }
    else if (m === 'remove') { A.Stars.remove(s, id); AU.ui(); persist(); }
    else if (m === 'a5' || m === 'a10') { const r0 = A.Stars.rank(c); if (A.Stars.train(s, id, m)) { AU.ui('coin'); persist(); toast(d.name + ': +' + (m === 'a10' ? 10 : 5) + ' Star XP' + (A.Stars.rank(c) > r0 ? ' — ' + SM.names[A.Stars.rank(c)] + '!' : ''), 'gold'); return starModal(id); } }
    else if (m === 'replace') {
      modal('<h2>Replace which active star with ' + esc(d.name) + '?</h2><div class="stars" style="margin-top:8px">' + s.active.map(a => starCardHTML(a, { attr: 'data-m="rep:' + a + '"' })).join('') + '</div><button class="btn ghost block" style="margin-top:10px" data-m="close">Cancel</button>', (m2) => {
        if (m2 === 'close') return closeModal();
        if (m2.startsWith('rep:')) { if (A.Stars.replace(s, m2.slice(4), id)) { AU.ui('upgrade'); persist(); toast(d.name + ' replaced ' + A.Stars.def(m2.slice(4)).name); } else toast('That swap breaks the formation role limits', 'bad'); closeModal(); render(); }
      });
      return;
    }
    closeModal(); render();
  });
}

// ======================= POWERS =======================
function powersHTML() {
  const s = st.save, P = A.Powers, favs = s.powers.favs;
  const card = p => {
    const un = P.isUnlocked(s, p.id), n = s.powers.mastery[p.id] || 0, rk = P.rank(s, p.id), nx = P.PM_RANK[rk + 1];
    const fi = favs.indexOf(p.id);
    return '<div class="pc ' + p.rarity + (un ? '' : ' lock') + '" data-pw="' + p.id + '">' + (fi >= 0 ? '<span class="fav">FAV ' + (fi + 1) + '</span>' : '') +
      '<div class="pn" style="color:' + RAR_C[p.rarity] + '">' + CAT_IC[p.cat] + ' ' + esc(p.name) + '</div><div class="row" style="gap:4px;margin-top:3px"><span class="catpill">' + p.cat + '</span><span class="catpill" style="color:' + RAR_C[p.rarity] + '">' + RAR_N[p.rarity] + '</span></div>' +
      '<div class="pd">' + esc(p.desc) + '</div>' +
      (un ? '<div class="mastery" style="margin-top:5px">Mastery rank ' + rk + (nx != null ? ' · ' + n + '/' + nx + ' uses' : ' · MAX') + '</div><div class="bar"><i style="width:' + (nx != null ? Math.round((n - P.PM_RANK[rk]) / (nx - P.PM_RANK[rk]) * 100) : 100) + '%"></i></div>'
        : '<div class="mastery" style="margin-top:5px">🔒 ' + esc(P.unlockText(p)) + '</div>') + '</div>';
  };
  const unl = P.LIST.filter(p => P.isUnlocked(s, p.id)).length;
  return '<div class="title">Favorite Powers <span class="sp"></span><span class="pill">' + unl + ' / 24 unlocked</span></div>' +
    '<div class="grid2">' + favs.map((id, i) => { const p = P.def(id); return '<div class="card" style="margin:0;border-color:' + RAR_C[p.rarity] + '"><div class="tiny dim" style="font-weight:900">FAVORITE ' + (i + 1) + '</div><b style="color:' + RAR_C[p.rarity] + '">' + CAT_IC[p.cat] + ' ' + esc(p.name) + '</b><div class="tiny dim">Mastery rank ' + P.rank(s, id) + '</div></div>'; }).join('') + '</div>' +
    '<p class="note">Every match: your 2 Favorites + 2 Wild Powers drawn from your unlocked collection (Common 60 · Rare 28 · Epic 10 · Legendary 2 %, max one Legendary). Powers fire on their own when the real battle situation fits — roughly every 8–12 s from second 6–9. Tap a card to make it a Favorite. Mastery: rank 2 after 15 uses (+5 %), rank 3 after 40 (+10 %), from official matches and first Challenge wins.</p>' +
    ['attack', 'defense', 'chaos', 'support'].map(cat => '<div class="title">' + CAT_IC[cat] + ' ' + cat + '</div><div class="pgrid">' + P.LIST.filter(p => p.cat === cat).map(card).join('') + '</div>').join('');
}
function powerModal(id) {
  const s = st.save, p = A.Powers.def(id), un = A.Powers.isUnlocked(s, id);
  if (!un) { toast('🔒 ' + A.Powers.unlockText(p), 'bad'); return; }
  modal('<h2 style="color:' + RAR_C[p.rarity] + '">' + CAT_IC[p.cat] + ' ' + esc(p.name) + '</h2><p class="small">' + esc(p.desc) + '</p><p class="small dim">Mastery rank ' + A.Powers.rank(s, id) + ' · ' + (s.powers.mastery[id] || 0) + ' successful uses</p>' +
    '<div class="grid2"><button class="btn gold" data-m="f0">Set as Favorite 1</button><button class="btn gold" data-m="f1">Set as Favorite 2</button></div><button class="btn ghost block" style="margin-top:8px" data-m="close">Close</button>', m => {
    if (m === 'f0' || m === 'f1') { A.Powers.setFav(s, +m[1], id); s.onboard.seen.m3 = 1; AU.ui('upgrade'); persist(); toast(p.name + ' is Favorite ' + (+m[1] + 1)); }
    closeModal(); render();
  });
}

// ======================= LEAGUE =======================
function leagueHTML() {
  const s = st.save, L = s.league, sub = st.sub.league;
  const seg = '<div class="seg">' + [['table', 'Table'], ['fixtures', 'Fixtures'], ['journey', 'Journey'], ['challenges', 'Challenges'], ['history', 'History']].map(([k, n]) => '<button data-act="lsub:' + k + '" class="' + (sub === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div>';
  let body = '';
  if (sub === 'table') {
    const t = A.League.table(s);
    body = '<div class="card" style="padding:6px 8px"><table class="lg"><tr><th>#</th><th class="nm">Club</th><th>P</th><th>W</th><th>L</th><th>GD</th><th>PWR</th><th>Pts</th></tr>' +
      t.map((r, i) => { const z = L.div === 1 ? (i === 0 ? 'z1' : i < 3 ? 'z2' : i < 10 ? 'z3' : '') : (i === 0 ? 'z1' : i < 3 ? 'z2' : ''); return '<tr class="' + (r.id === s.club ? 'me' : '') + '"><td class="pos ' + z + '">' + (i + 1) + '</td><td class="nm">' + cimg(r.id, 18) + esc(cname(r.id)) + '</td><td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.l + '</td><td>' + (r.gf - r.ga >= 0 ? '+' : '') + (r.gf - r.ga) + '</td><td class="dim">' + A.League.rating(s, r.id, L.div, L.seasonId).toFixed(0) + '</td><td><b>' + r.pts + '</b></td></tr>'; }).join('') + '</table>' +
      '<p class="note">' + (L.div === 1 ? '1st: Champions (10,000 C + Premium Pack + Academy +10) · 2–3: 6,000 C · 4–10: 2,000 C. No relegation.' : '1st: Champions (5× win credits) · 2–3: direct promotion (3×) · 4–20: Promotion Challenge (best of 3). No relegation.') + ' Win = 3 pts.</p></div>';
  } else if (sub === 'fixtures') {
    let h = '';
    for (let r = 0; r < 19; r++) {
      const ms = L.rounds[r]; const pr = ms.find(m => m[0] === s.club || m[1] === s.club);
      h += '<div class="card" style="padding:8px 10px"><div class="tiny dim" style="font-weight:800;margin-bottom:2px">ROUND ' + (r + 1) + (r === L.round && L.phase === 'regular' ? ' · <span class="mint">NEXT</span>' : '') + '</div>';
      for (const m of [pr].concat(ms.filter(x => x !== pr))) {
        const id = A.League.fixtureId(L, r, m[0], m[1]), res = L.results[id];
        const sc = res ? res.ga + ' - ' + res.gb : (L.aiQueue.indexOf(id) >= 0 ? '…' : 'vs');
        h += '<div class="fx' + (m === pr ? ' me' : '') + '"><div class="a' + (res && res.winner === 0 ? ' w' : '') + '">' + esc(cname(m[0])) + ' ' + cimg(m[0], 16) + '</div><div class="s">' + sc + '</div><div class="' + (res && res.winner === 1 ? 'w' : '') + '">' + cimg(m[1], 16) + ' ' + esc(cname(m[1])) + '</div></div>';
        if (m !== pr && r > L.round + 1) break;
      }
      h += '</div>';
    }
    body = '<p class="note">Every rival fixture is a real headless 100 vs 100 battle with Powers and stars (no fake results).</p>' + h;
  } else if (sub === 'journey') {
    const g = A.League.playerGames(s), MS = A.SEASON_MS;
    const bar = Array.from({ length: 19 }, (_, i) => '<div class="' + (MS[i + 1] || i === 18 ? 'ms ' : '') + (i < g ? 'on' : '') + '"></div>').join('');
    body = '<div class="card"><b>' + (L.div === 1 ? 'Champions League season' : 'Division ' + L.div + ' season') + ' · ' + g + '/19 matches</b><div class="msrow">' + bar + '</div>' +
      '<div class="kv" style="margin-top:10px">' + Object.keys(MS).map(k => { const id = L.div === 1 ? 'mlst:' + L.seasonId + ':' + k : 'mlst:D' + L.div + ':' + k; return '<dt>Match ' + k + ' · ' + MS[k].name + '</dt><dd>' + (s.claims[id] ? '✅ ' : '') + rewardLine(MS[k].r).replace(/<[^>]+>/g, '') + '</dd>'; }).join('') + '<dt>Match 19 · Final Push</dt><dd>season result & ranking reward</dd></div>' +
      '<p class="note">' + (L.div === 1 ? 'In the Endless Champions League the milestones pay again every season.' : 'Division 10–2 milestones pay once per Division (replays and REMATCHes never pay twice).') + '</p></div>' +
      '<div class="title">Division Journey</div><div class="card"><div class="journey">' + [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(d => '<div class="jrow' + (d === s.division ? ' cur' : d > s.division ? ' done' : '') + '"><b>' + (d === 1 ? 'D1' : 'D' + d) + '</b><div>' + (d === 1 ? 'Champions League (endless)' : 'Division ' + d) + '<div class="tiny dim">' + (s.trophies.filter(t => t.div === d).map(t => TROPHY[t.type][0]).join(' ') || '') + (d === 8 ? ' Premium packs' : d === 5 ? ' Legend packs' : '') + '</div></div><span>' + (d > s.division ? '✅' : d === s.division ? '📍' : '🔒') + '</span></div>').join('') + '</div></div>';
  } else if (sub === 'challenges') body = challengesHTML();
  else {
    const hs = s.history.slice().reverse();
    body = '<div class="card">' + (hs.length ? hs.map(h => '<div class="fx"><div class="a">' + esc(h.season) + '</div><div class="s">#' + h.rank + '</div><div>' + esc(h.outcome) + '</div></div>').join('') : '<p class="dim small">No completed seasons yet.</p>') + '</div>' +
      '<div class="card small"><div class="kv"><dt>Official fixtures</dt><dd>' + s.officialPlayed + '</dd><dt>Highest division</dt><dd>' + s.highestDiv + '</dd><dt>Champions League titles</dt><dd>' + s.endless.titles + '</dd><dt>Career goals · ball wins</dt><dd>' + s.career.goals + ' · ' + s.career.ballWins + '</dd><dt>Power uses (mastery)</dt><dd>' + s.career.powerUses + '</dd>' +
      (s.wc && s.wc.commands ? '<dt>War Commands (Mayhem era)</dt><dd>' + s.wc.commands + '</dd>' : '') + (s.stats.strikes ? '<dt>Momentum Strikes (Reborn era)</dt><dd>' + s.stats.strikes + '</dd>' : '') + '</div></div>';
  }
  return '<div class="title">' + (L.div === 1 ? 'Champions League' : 'Division ' + L.div) + ' <span class="sp"></span><span class="pill">' + esc(L.seasonId) + '</span></div>' + seg + '<div style="height:8px"></div>' + body;
}
function challengesHTML() {
  const s = st.save;
  const unlocked = Object.keys(s.challenges.unlocked).map(Number).sort((a, b) => b - a);
  if (st.sub.chDiv == null || !s.challenges.unlocked[st.sub.chDiv]) st.sub.chDiv = unlocked.length ? (s.challenges.unlocked[s.division] ? s.division : unlocked[unlocked.length - 1]) : null;
  const d = st.sub.chDiv;
  const head = '<div class="card small"><b>Challenge Board</b> · ' + Object.keys(s.challenges.done).filter(k => !/cup$/.test(k) && s.challenges.done[k].won).length + ' / 30 first wins</div>';
  if (d == null) return head + '<div class="card"><p>🔒 A Division\'s board (and the Glory Cup) opens after its <b>3rd official fixture</b>.</p></div>';
  const seg = '<div class="seg">' + unlocked.map(x => '<button data-act="chd:' + x + '" class="' + (x === d ? 'on' : '') + '">D' + x + '</button>').join('') + '</div><div style="height:8px"></div>';
  const desc = { power: 'A rival a bit stronger than this Division\'s average.', last: 'Win to earn medals: 🥉 win · 🥈 15+ standing · 🥇 30+ standing.', signature: 'The rival fields ' + A.Challenges.oppStars(d) + ' star(s) with signature abilities.', cup: 'Guest club ' + cname(s.spareClub) + ' (the 200th club) at this Division\'s top strength.' };
  return head + seg + A.Challenges.KINDS.concat(['cup']).map(k => {
    const key = A.Challenges.key(d, k), stt = s.challenges.done[key] || { won: false, medal: 0, plays: 0 }, o = A.Challenges.opponent(s, d, k);
    const first = A.Challenges.rewardFirst(d, k), rep = A.Challenges.rewardRepeat(d);
    const medal = k === 'last' ? ['', '🥉', '🥈', '🥇'][stt.medal] || '' : stt.won ? '✅' : '';
    return '<div class="card' + (stt.won ? ' gold' : '') + '"><div class="row"><b class="grow">' + (k === 'cup' ? '🏆 ' : '') + A.Challenges.INFO[k].name + '</b><span class="medal">' + medal + '</span></div><div class="small dim" style="margin:2px 0 8px">' + esc(desc[k]) + '</div>' +
      '<div class="row">' + cimg(o.id, 36) + '<div class="grow"><b>' + esc(cname(o.id)) + '</b><div class="tiny dim">PWR ' + o.rating.toFixed(1) + ' · played ' + stt.plays + '×</div></div><button class="btn gold sm" data-act="ch:' + d + ':' + k + '">PLAY</button></div>' +
      '<div class="tiny" style="margin-top:8px">' + (stt.won ? '<span class="dim">Repeat win: </span>' + rewardLine(rep) + ' <span class="dim">(no Star XP / Mastery)</span>' : '<span class="dim">First win: </span>' + rewardLine(first) + ' <span class="dim">+ Star XP & Power Mastery</span>') + '</div></div>';
  }).join('') + '<p class="note">All three first wins of a Division: +1 Academy +5 ticket. Challenges never change the league table.</p>';
}

// ======================= REWARDS =======================
function rewardsHTML() {
  const s = st.save, P = A.PACKS;
  const card = (k, name, odds) => {
    const lock = !A.Draft.unlocked(s, k), p = P[k];
    return '<div class="card pack"><div class="art pk-' + k + '">' + name.toUpperCase() + '</div><div><div class="row"><b class="grow">' + name + ' Draft</b>' + (s.packs[k] ? '<span class="pill mint">' + s.packs[k] + ' owned</span>' : '') + '</div>' +
      '<div class="tiny dim" style="margin:3px 0 8px">' + odds + '</div>' +
      (lock ? '<span class="pill coral">🔒 Unlocks in Division ' + p.unlockDiv + '</span>' + (s.packs[k] ? ' <span class="tiny dim">(kept)</span>' : '') :
        '<div class="row wrap" style="gap:6px"><button class="btn sm gold" data-act="open:' + k + ':credits"' + (s.credits >= p.credits && !s.pendingDraft ? '' : ' disabled') + '>' + fmt(p.credits) + ' C</button>' +
        '<button class="btn sm" data-act="open:' + k + ':frags"' + (s.fragments >= p.frags && !s.pendingDraft ? '' : ' disabled') + '>' + p.frags + ' F</button>' +
        (s.packs[k] ? '<button class="btn sm mint" data-act="open:' + k + ':inventory"' + (s.pendingDraft ? ' disabled' : '') + '>Open owned</button>' : '') + '</div>') + '</div></div>';
  };
  const log = (s.rewardLog || []).slice(0, 12);
  return (s.pendingDraft ? '<button class="btn gold block" data-act="draft">⭐ Continue your draft (3 stars waiting)</button>' : '') +
    '<div class="title">Three-Star Draft <span class="sp"></span><span class="pill gold">' + fmt(s.credits) + ' C</span><span class="pill">' + s.fragments + ' F</span></div>' +
    '<p class="note" style="margin-top:0">3 different stars (2+ positions), sign <b>one</b> — permanently. A duplicate gives Star XP (Common 6 · Rare 9 · Epic 13 · Legendary 18), or Fragments once the star is a Club Legend. OVR scales with your highest Division (' + s.highestDiv + ').</p>' +
    card('standard', 'Standard', 'Cards 1–2: C 70 · R 26 · E 3.5 · L 0.5 % — Card 3: R 85 · E 14 · L 1 %') +
    card('premium', 'Premium', 'Cards 1–2: C 20 · R 58 · E 20 · L 2 % — Card 3: E 92 · L 8 %. Legendary shown by the 10th pack.') +
    card('legend', 'Legend', 'Cards 1–2: R 55 · E 38 · L 7 % — Card 3: E 75 · L 25 %. Legendary shown by the 4th pack.') +
    '<div class="title">Academy</div><div class="card small"><div class="kv"><dt>Academy Training +5 XP</dt><dd>' + s.academy.a5 + '</dd><dt>Academy Training +10 XP</dt><dd>' + s.academy.a10 + '</dd><dt>Premium pity</dt><dd>' + s.pity.premium + ' / 9</dd><dt>Legend pity</dt><dd>' + s.pity.legend + ' / 3</dd></div>' +
    '<p class="note">Use Academy tickets on a star in Squad. They come from Team Level milestones, promotions, completing Divisions, the match-14 milestone and the Challenge Board.</p></div>' +
    '<div class="title">Earned rewards</div><div class="card small">' + (log.length ? log.map(x => '<div class="fx"><div class="a" style="text-align:left">' + esc(x.label) + '</div><div class="s" style="min-width:0">·</div><div>' + esc(x.text) + '</div></div>').join('') : '<span class="dim">Play a match to start your reward history.</span>') + '</div>';
}
let draftSel = 0;
function showDraft(animate) {
  const s = st.save, Dd = s.pendingDraft; if (!Dd) return;
  let box = $('draftBox'); if (!box) { box = document.createElement('div'); box.id = 'draftBox'; box.className = 'draft'; document.body.appendChild(box); }
  const drawCards = (anim) => {
    const c = Dd.cands[draftSel], d = A.Stars.def(c.id), pv = A.Draft.dupPreview(s, c);
    box.innerHTML = '<div style="text-align:center;margin-bottom:10px"><div class="tiny dim" style="font-weight:900;letter-spacing:.14em">' + Dd.type.toUpperCase() + ' DRAFT' + (Dd.pityHit ? ' · PITY LEGENDARY' : '') + '</div><h2 style="font-size:20px;margin-top:2px">CHOOSE ONE STAR</h2></div>' +
      '<div class="cards">' + Dd.cands.map((x, i) => starCardHTML(x.id, { cand: x, dup: x.dup, sel: i === draftSel, anim, attr: 'data-pick="' + i + '"', style: anim ? 'animation-delay:' + (i * 0.18) + 's' : '' })).join('') + '</div>' +
      '<div class="det card ' + d.rarity + '"><div class="row"><img src="' + portrait(c.id) + '" style="width:56px;height:56px;image-rendering:pixelated;border-radius:10px" alt=""><div class="grow"><div style="font-weight:900;font-size:16px">' + esc(d.name) + (d.nick ? ' <span class="tiny dim">“' + esc(d.nick) + '”</span>' : '') + '</div><div class="small">' + rarityPill(d.rarity) + ' <span class="pill">' + ROLE_N[d.role] + '</span> <span class="pill gold">OVR ' + c.ovr + '</span></div></div></div>' +
      '<div style="margin-top:8px"><b>' + esc(ABIL[d.ability][0]) + ' ' + TIER_N[A.Stars.TIER[d.rarity]] + '</b> <span class="tiny dim">(automatic, max 2 uses per battle)</span><div class="small dim">' + esc(ABIL[d.ability][1]) + '</div></div>' +
      (pv ? '<div class="small gold-t" style="margin-top:6px">DUPLICATE — ' + (pv.frags ? 'already a Club Legend: +' + pv.frags + ' Pack Fragments' : 'current Star Mastery ' + A.Stars.SM.names[pv.rank] + ' (' + pv.cur + '/' + (pv.next == null ? 'MAX' : pv.next) + ' XP) → +' + pv.xp + ' XP') + '. OVR stays ' + s.stars[c.id].ovr + '.</div>' : '<div class="small mint" style="margin-top:6px">Permanent club player — no contract.</div>') +
      '<button class="btn gold block" style="margin-top:10px" data-sign="1">SIGN ' + esc(d.name.toUpperCase()) + '</button></div>';
  };
  draftSel = Math.min(draftSel, 2);
  if (animate) {
    const ov = document.createElement('div'); ov.className = 'opening';
    const col = { standard: '#5a8cff', premium: '#c77dff', legend: '#ffcf3f' }[Dd.type];
    ov.innerHTML = '<div class="pk pk-' + Dd.type + '" style="color:' + col + '">' + Dd.type.toUpperCase() + '</div><div class="skiphint">tap to skip</div>';
    document.body.appendChild(ov); AU.play('pack_' + Dd.type, 0.7); AU.vibrate(30);
    let done = false;
    const finish = () => { if (done) return; done = true; ov.remove(); drawCards(true); const best = Dd.cands.reduce((m, x) => Math.max(m, A.RARITIES.indexOf(x.rarity)), 0); AU.play('rev_' + A.RARITIES[best], 0.7); if (best >= 3) AU.vibrate([40, 40, 80]); };
    ov.onclick = finish; setTimeout(() => { if (!done) { const b = document.createElement('div'); b.className = 'burst'; b.style.background = col; ov.appendChild(b); } }, 1700); setTimeout(finish, 2400);
  } else drawCards(false);
  box.onclick = e => {
    const p = e.target.closest('[data-pick]'); if (p) { draftSel = +p.dataset.pick; AU.ui(); drawCards(false); return; }
    if (e.target.closest('[data-sign]')) {
      const res = A.Draft.pick(st.save, draftSel); persist(); box.remove();
      if (res) { const d = A.Stars.def(res.id); AU.play('coin', 0.6);
        toast(res.merged ? (res.frags ? d.name + ' is already a Club Legend: +' + res.frags + ' Fragments' : d.name + ': +' + res.xp + ' Star XP' + (res.rankUp ? ' — ' + A.Stars.SM.names[res.rankUp.rank] + '!' : '')) : d.name + ' joined ' + st.save.profile.name + ' (permanent)!', 'gold');
        if (res.frags) logRewards({ frags: res.frags }, 'Duplicate star');
        if (!res.merged && st.save.active.length < 5 && !A.Stars.canEquip(st.save, res.id)) { A.Stars.equip(st.save, res.id); persist(); toast(d.name + ' added to your active five', ''); } }
      draftSel = 0; render();
    }
  };
}

// ======================= actions =======================
function onAct(act) {
  const s = st.save;
  AU.init();
  if (act.startsWith('tab:')) { AU.ui(); return go(act.slice(4)); }
  if (act === 'settings') return settingsModal();
  if (act === 'import') return importSave();
  if (act === 'exportRaw') return exportText(st.unreadable, 'FootballWars_unreadable_save.json');
  if (act === 'fullscreen') return toggleFull();
  if (!s) return;
  if (act === 'identity') return identityModal();
  if (act.startsWith('tip:')) { s.onboard.seen[act.slice(4)] = 1; persist(); return render(); }
  if (act.startsWith('lsub:')) { st.sub.league = act.slice(5); return render(); }
  if (act.startsWith('cf:')) { st.sub.coll = act.slice(3); return render(); }
  if (act.startsWith('cs:')) { st.sub.sort = act.slice(3); return render(); }
  if (act.startsWith('chd:')) { st.sub.chDiv = +act.slice(4); return render(); }
  if (act.startsWith('form:')) { s.formation = act.slice(5); A.Stars.fitFormation(s); s.onboard.seen.m3 = 1; AU.ui('upgrade'); persist(); toast(A.FORMATIONS[s.formation].name + ' formation set'); return render(); }
  if (act.startsWith('up:')) { if (A.Upgrades.buy(s, act.slice(3))) { AU.play('upgrade', 0.6); AU.vibrate(15); s.onboard.seen.m2 = 1; persist(); const y = window.scrollY; render(); window.scrollTo(0, y); } return; }
  if (act.startsWith('open:')) {
    const [, type, pay] = act.split(':'); const why = A.Draft.canOpen(s, type, pay); if (why) { toast(why, 'bad'); return; }
    const res = A.Draft.open(s, type, pay); s.onboard.seen.m4 = 1; persist(); renderTop(); if (res) { draftSel = 0; showDraft(true); } return;
  }
  if (act === 'draft') { showDraft(false); return; }
  if (act === 'league') return startBattle('league', { attempt: 1 });
  if (act === 'quick') return startBattle('league', { attempt: 1 }, true);
  if (act === 'resume') return resumeBattle();
  if (act === 'rematch') return startBattle('league', { attempt: 2 });
  if (act === 'acceptloss') { const out = A.Battle.acceptLoss(s); afterFinal(out); persist(); render(); return; }
  if (act === 'promote') { const out = A.Endgame.promote(s); persist(); AU.play('trophy', 0.7); celebrate(); toast('Welcome to ' + (s.division === 1 ? 'the Champions League!' : 'Division ' + s.division + '!'), 'gold'); if (out) { rewardsToast(out); logRewards(out, 'Promotion'); } render(); startAI(); return; }
  if (act === 'promo') { A.Endgame.promoStart(s); persist(); return startBattle('promo', {}); }
  if (act === 'replayseason') { confirmBox('Replay this Division ' + s.league.div + ' season? A fresh 19-match fixture list starts (milestones already earned in this Division do not pay again).', () => { A.Endgame.replaySeason(s); persist(); render(); startAI(); }); return; }
  if (act === 'newseason') { A.Endgame.nextEndless(s); persist(); toast('New Champions League season!', 'gold'); render(); startAI(); return; }
  if (act.startsWith('ch:')) { const [, dd, k] = act.split(':'); return startBattle('challenge', { div: +dd, kind: k }); }
}
function afterFinal(out) {
  if (!out) return;
  rewardsToast(out); logRewards(out, 'League match');
  if (out.challengesUnlocked) toast('🎯 Challenge Board unlocked for Division ' + out.challengesUnlocked + '!', 'gold', 3500);
  if (out.milestone) toast('📍 ' + out.milestone.name + ' milestone reached!', 'gold', 3500);
  st.save.coach = out.roadmap ? { roadmap: out.roadmap } : (st.save.career.lossStreak === 0 ? null : st.save.coach);
}
function rewardsToast(r) { const t = rewardLine(r).replace(/<[^>]+>/g, ''); if (t) toast(t, 'gold', 3500); }

// ======================= BATTLE (spectator) =======================
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
function resumeBattle() { const P = st.save.pendingBattle; if (!P) return; stopAI(); liveBattle(P.snap, { inputs: P.inputs || [], cmds: P.cmds || [], lastTick: P.lastTick || 0 }); }
function quickSim(snap) {
  modal('<h2>Quick Sim</h2><p class="small dim">Running the same 100 vs 100 engine as the live view (same seed, squads, formation, stars and Powers)…</p><div class="bar"><i id="qsBar" style="width:0"></i></div>');
  $('modal').dataset.lock = 1;
  const w = E.createWorld(A.Battle.worldOpts(snap, { headless: true, auto: true }));
  st.battle = { quick: true };
  const stepf = () => { const done = A.Battle.runSlice(w, 400); const b = $('qsBar'); if (b) b.style.width = Math.min(100, w.t / 55 * 100) + '%'; if (!done) { setTimeout(stepf, 0); return; } st.battle = null; closeModal(); finishBattle(snap, A.Battle.result(w)); };
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
const POWER_NAMES = Object.fromEntries(A.Powers.LIST.map(p => [p.id, p.name]));
function liveBattle(snap, resume) {
  const s = st.save, set = s.settings, q = QUALITY[set.quality] || QUALITY.medium;
  AU.init(); AU.apply(Object.assign({}, set));
  $('battle').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  $('btLabel').textContent = snap.label;
  const legacy = snap.mech !== A.MECH;
  const w = E.createWorld(A.Battle.worldOpts(snap, { fxLevel: q.fx, inputs: resume ? resume.inputs || [] : [], cmds: resume ? resume.cmds || [] : [] }));
  w.observer = D.createObserver({ smartCam: true, intensity: 'low', epicFinale: true, mvpStreaks: true, fbAlerts: true, fbFollow: true }); // 'low' camera: max zoom ~1.2
  const teams = [snap.teamA, snap.teamB];
  const hc = S.color.cdist(S.color.vivid(teams[0].visual.primary_color), S.color.vivid(teams[1].visual.primary_color)) < 210;
  const kits = S.makeKits(teams[0], teams[1], 210);
  const atlases = [S.buildAtlas(teams[0], kits[0]), S.buildAtlas(teams[1], kits[1])];
  const pp = snap.profile || (teams[0].id === A.PLAYER_CLUB ? s.profile : null);
  const logo = (t, i) => (i === 0 && pp && t.id === A.PLAYER_CLUB) ? { small: drawCrest(pp, 26, pp.frame), big: drawCrest(pp, 96, pp.frame) } : { small: crestCv(t.id, 26), big: crestCv(t.id, 96) };
  const logos = teams.map(logo);
  const decor = pp ? { stage: snap.stage != null ? snap.stage : A.stageOf(s.highestDiv), primary: pp.primary, secondary: pp.secondary, short: pp.short, banner: !!snap.banner } : null;
  const renderer = R.createRenderer({ world: w, teams, kits, atlases, logos, lang: 'en', labels: true, story: true, hc, fxLevel: q.fx, v3: { vfx: true, finale: true, mvp: true, momentum: false }, modeLabel: snap.label.toUpperCase(), fictional: false, decor, powerNames: POWER_NAMES });
  const cv = $('stage'); const ctx = cv.getContext('2d');
  const B = st.battle = { snap, w, renderer, cv, ctx, legacy, paused: false, speed: set.speed === 2 ? 2 : 1, cam: set.smartCam !== false, last: performance.now(), evI: 0, savedTick: resume ? resume.lastTick : 0,
    ended: false, skip: false, ff: !!(resume && resume.lastTick > 0), usedSeen: 0, focus: null, starFocus: null, camS: { x: 180, y: E.MIDY, z: 1 }, feed: [], feedUntil: 0, goalUntil: 0, fxLo: q.fx === 0 };
  $('legacyNote').classList.toggle('hidden', !legacy);
  buildStarBar(B); buildPowerList(B);
  fitStage(); updateBattleButtons();
  $('btLoading').classList.toggle('hidden', !B.ff);
  AU.battleStart();
  const ff = () => {
    let n = 0; while (w.tick < resume.lastTick && n++ < 400) E.step(w);
    B.evI = w.events.length; B.usedSeen = w.pow ? w.pow.used.length : 0;
    if (w.tick < resume.lastTick) { $('btLoading').textContent = 'RESTORING BATTLE… ' + Math.round(w.tick / resume.lastTick * 100) + '%'; setTimeout(ff, 0); return; }
    B.ff = false; $('btLoading').classList.add('hidden'); B.last = performance.now(); B.raf = requestAnimationFrame(frame);
  };
  const frame = now => {
    if (st.battle !== B) return;
    const dtReal = Math.min(0.1, (now - B.last) / 1000); B.last = now;
    if (!B.paused) E.advanceTo(w, w.t + dtReal * B.speed);
    spectatorCam(B, dtReal, now);
    renderer.render(ctx, w.t, cv.width, cv.height);
    battleEvents(B, now);
    hudTick(B, now);
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
// Smart Arcade Spectator: Wide by default, short Action Focus (≤1.22×), Star Focus (5 s). Cosmetic only (never touches the simulation RNG).
function spectatorCam(B, dt, now) {
  const w = B.w; let tx, ty, tz;
  const sf = B.starFocus && now < B.starFocus.until ? w.units[B.starFocus.id] : null;
  if (sf && sf.alive) { tx = sf.x; ty = sf.y; tz = 1.18; }
  else if (B.focus && now < B.focus.until) { tx = B.focus.x; ty = B.focus.y; tz = B.focus.z; }
  else if (B.cam) { tx = w.cam.x; ty = w.cam.y; tz = Math.min(1.22, w.cam.z); }
  else { tx = 180; ty = E.MIDY; tz = 1; }
  const k = Math.min(1, dt * 4), c = B.camS;
  c.x += (tx - c.x) * k; c.y += (ty - c.y) * k; c.z += (tz - c.z) * k;
  w.cam.x = c.x; w.cam.y = c.y; w.cam.z = Math.min(1.22, c.z);
  if (B.starFocus && (now >= B.starFocus.until || !sf || !sf.alive)) { B.starFocus = null; buildStarBar(B); }
}
function buildStarBar(B) {
  const w = B.w, bar = $('starBar');
  const U = w.units.filter(u => u.side === 0 && u.star);
  bar.innerHTML = U.map(u => '<button data-focus="' + u.id + '" class="' + (u.alive ? '' : 'ko') + (B.starFocus && B.starFocus.id === u.id ? ' focus' : '') + '" aria-label="Follow ' + esc(u.star.name) + '"><img src="' + portrait(u.star.id) + '" alt=""><span>' + esc(u.star.name.split(' ')[1] || '') + '</span></button>').join('');
  B.starsShown = U.map(u => u.alive).join();
}
function buildPowerList(B) {
  const w = B.w, el = $('pwList');
  if (!w.pow) { el.innerHTML = ''; return; }
  el.innerHTML = w.pow.s[0].load.map(L => { const p = A.Powers.def(L.id); return '<div data-pl="' + L.id + '" style="color:' + RAR_C[p.rarity] + '"><i>' + (L.fav ? '★ ' : '◆ ') + '</i>' + esc(p.name) + '</div>'; }).join('');
}
function hudTick(B, now) {
  const w = B.w;
  const stars = w.units.filter(u => u.side === 0 && u.star).map(u => u.alive).join();
  if (stars !== B.starsShown) buildStarBar(B);
  if (w.pow) for (const L of w.pow.s[0].load) { const el = document.querySelector('[data-pl="' + L.id + '"]'); if (el) el.classList.toggle('on', w.pow.s[0].active.some(a => a.id === L.id && a.until > w.battleT)); }
  if (now > B.feedUntil && B.feed.length && now > B.goalUntil) { const f = B.feed.shift(); showFeed(B, f, now); }
  else if (now > B.feedUntil) $('pwFeed').classList.add('hidden');
  $('hudHelp').textContent = w.may && w.may.frenzy ? '🔥 FINAL FRENZY — both teams speed up' : B.starFocus ? 'Following your star · tap again to stop' : 'Powers fire automatically · tap a star to follow it';
}
function showFeed(B, f, now) {
  const el = $('pwFeed'); el.className = 'pwfeed ' + f.rarity; el.style.color = f.side === 0 ? RAR_C[f.rarity] : '#ff9a9a';
  el.innerHTML = esc(f.name) + '<small>' + (f.side === 0 ? 'YOUR POWER' : 'RIVAL POWER') + ' · ' + f.rarity.toUpperCase() + (f.n > 1 ? ' · ×' + f.n : '') + '</small>';
  B.feedUntil = now + (f.rarity === 'legendary' ? 1500 : f.rarity === 'epic' ? 1250 : 1000);
  if (f.rarity === 'legendary' && !B.fxLo) { const fl = document.createElement('div'); fl.className = 'flashfx'; $('stageWrap').appendChild(fl); setTimeout(() => fl.remove(), 520); }
}
function battleEvents(B, now) {
  const w = B.w, ev = w.events, EV = E.EV, names = Object.keys(E.SPECIAL_NAMES);
  for (; B.evI < ev.length; B.evI++) {
    const e = ev[B.evI];
    if (e.type === EV.SPECIAL_FIRE) AU.play('ab_' + names[e.c], e.a === 0 ? 0.5 : 0.35, 0, 1);
    else if (e.type === EV.STAR_SPECIAL && e.a === 0) AU.vibrate(20);
    else if (e.type === EV.GOAL) { AU.vibrate(e.b === 0 ? [50, 30, 50] : 30); B.goalUntil = now + 1200; B.focus = { x: e.x, y: e.y, z: 1.15, until: now + 1200 }; }
    else if (e.type === EV.REINF_GAIN) setTimeout(() => qpop('+' + e.b + ' REINFORCEMENTS EARNED', e.a === 0 ? '#3df2b5' : '#ff8a8a', 'small'), 1150);
    else if (e.type === EV.REINF_ENTER && e.a === 0) AU.play('heal', 0.3);
    else if (e.type === EV.RAMPAGE) { if (e.a === 0) { qpop('KO RAMPAGE!', '#ff6b4a', 'small'); AU.play('ab_counter_burst', 0.45); } if (!(B.focus && now < B.focus.until)) B.focus = { x: e.x, y: e.y, z: 1.1, until: now + 900 }; }
    else if (e.type === EV.FRENZY) { AU.play('whistle3', 0.5); AU.vibrate([40, 40, 40]); }
    else if (e.type === EV.MIRACLE) { qpop(e.a === 0 ? 'MIRACLE SAVE!' : 'RIVAL MIRACLE SAVE', '#ffffff', 'small'); B.focus = { x: e.x, y: e.y, z: 1.16, until: now + 1100 }; }
    else if (e.type === EV.KO && e.b >= 0) { const u = w.units[e.b]; if (u.side === 0 && e.c === 1) qpop('CAPTAIN DOWN', '#ff8a8a', 'small'); else if (u.side === 0 && u.star) qpop(u.star.name.toUpperCase() + ' K.O.', '#ff8a8a', 'small'); }
    else if (e.type === EV.POWER_BOUNCE) AU.play('blip', 0.4);
  }
  if (!w.pow) return;
  const U = w.pow.used;
  for (; B.usedSeen < U.length; B.usedSeen++) {
    const c = U[B.usedSeen], p = A.Powers.def(c.id);
    B.feed.push({ id: c.id, name: p.name, rarity: p.rarity, side: c.side, n: c.n });
    if (B.feed.length > 3) B.feed.shift(); // never a backlog of stale notices
    AU.play('pw_' + c.id, c.side === 0 ? 0.6 : 0.4); if (p.rarity === 'legendary' || p.rarity === 'epic') AU.play(c.side === 0 ? 'mom_perfect' : 'mom_good', 0.35);
    if ((p.rarity === 'epic' || p.rarity === 'legendary') && !(B.focus && now < B.focus.until)) B.focus = { x: w.fb.ball.x, y: w.fb.ball.y, z: p.rarity === 'legendary' ? 1.2 : 1.12, until: now + (p.rarity === 'legendary' ? 1500 : 1000) };
    if (c.side === 0) AU.vibrate(p.rarity === 'legendary' ? [30, 30, 80] : 20);
  }
}
function qpop(text, col, cls) { const d = document.createElement('div'); d.className = 'qpop' + (cls ? ' ' + cls : ''); d.style.color = col; d.textContent = text; $('stageWrap').appendChild(d); setTimeout(() => d.remove(), 950); }
function saveProgress(B) { const P = st.save.pendingBattle; if (!P || P.snap.battleId !== B.snap.battleId) return; if (B.snap.mech === 'mayhem' && B.w.may) P.cmds = B.w.may.log.slice(); if (!B.snap.mech && B.w.arc) P.inputs = B.w.arc.log.slice(); P.lastTick = B.w.tick; B.savedTick = B.w.tick; Store.write(); }
function updateBattleButtons() { const B = st.battle; if (!B) return; $('btSpeed').textContent = B.speed + '×'; $('btSpeed').classList.toggle('on', B.speed === 2); $('btCam').classList.toggle('on', B.cam); $('btPause').textContent = B.paused ? '▶' : '❚❚'; }
function setPause(on) {
  const B = st.battle; if (!B || !B.w) return;
  B.paused = on; AU.pause(on); updateBattleButtons();
  const pb = $('pauseBox');
  if (on) { pb.classList.remove('hidden'); pb.innerHTML = '<div class="in"><h2 style="text-align:center">PAUSED</h2><button class="btn mint" data-b="resume">Resume</button><button class="btn" data-b="speed">Speed: ' + B.speed + '×</button><button class="btn" data-b="cam">Smart camera: ' + (B.cam ? 'ON' : 'OFF (wide)') + '</button><button class="btn" data-b="mute">Sound: ' + (st.save.settings.mute ? 'OFF' : 'ON') + '</button><button class="btn coral" data-b="abandon">Abandon battle (counts as a loss)</button></div>'; }
  else { pb.classList.add('hidden'); pb.innerHTML = ''; B.last = performance.now(); }
  if (!on) saveProgress(B);
}
function endLive(B) { cancelAnimationFrame(B.raf); const res = A.Battle.result(B.w); closeBattleView(); finishBattle(B.snap, res); }
function closeBattleView() { AU.battleStop(); AU.pause(false); st.battle = null; $('battle').classList.add('hidden'); $('btSkip').classList.add('hidden'); $('pauseBox').classList.add('hidden'); $('pwFeed').classList.add('hidden'); document.body.style.overflow = ''; }
function finishBattle(snap, res) {
  const s = st.save;
  const out = A.Battle.finish(s, snap, res);
  if (!out.canRematch && !out.stale) logRewards(out.rewards, snap.label);
  if (out.roadmap) s.coach = { roadmap: out.roadmap }; else if (out.won && snap.kind === 'league') s.coach = null;
  persist();
  showResults(out);
  startAI();
}
function timeUpHTML(res) {
  const why = { survivors: 'more players still standing', health: 'more total health (same number standing)', goals: 'more goals (same players and health)', seed: 'a fixed tie-break (everything level)' }[res.tiebreak];
  if (!why || !res.alive) return '';
  return '<div class="card small"><b>⏱ TIME UP</b> — ' + (res.won ? 'won' : 'lost') + ' on ' + why + ' · ' + res.alive[0] + ' vs ' + res.alive[1] + ' standing. Nobody was knocked out by the clock.</div>';
}
function powersUsedHTML(res) {
  const P = res.powers; if (!P) return '';
  const row = L => L.load.map(x => { const p = A.Powers.def(x.id), n = L.uses[x.id] || 0; return '<span class="pill" style="color:' + RAR_C[p.rarity] + ';border-color:currentColor;' + (n ? '' : 'opacity:.5') + '">' + (x.fav ? '★' : '◆') + ' ' + esc(p.name) + (n ? ' ×' + n : '') + '</span>'; }).join(' ');
  const M = res.mayhem ? res.mayhem.sides : null;
  return '<div class="title">Powers & chaos</div><div class="card small"><div class="tiny dim" style="font-weight:900">YOURS</div><div class="row wrap" style="gap:4px;margin:4px 0 8px">' + row(P.sides[0]) + '</div><div class="tiny dim" style="font-weight:900">RIVAL</div><div class="row wrap" style="gap:4px;margin-top:4px">' + row(P.sides[1]) + '</div>' +
    (M ? '<div class="kv" style="margin-top:8px"><dt>Reinforcements (earned / on pitch)</dt><dd>' + M[0].earned + ' / ' + M[0].entered + ' · rival ' + M[1].entered + '</dd><dt>Chain collisions · KO Rampages</dt><dd>' + M[0].chains + ' · ' + M[0].rampages + '</dd></div>' : '') + '</div>';
}
function progressHTML(r) {
  const rows = [], xp = {};
  for (const x of r.starXP || []) xp[x.id] = (xp[x.id] || 0) + x.n;
  for (const id in xp) rows.push('⭐ ' + esc(A.Stars.def(id).name) + ' +' + xp[id] + ' Star XP');
  for (const x of r.starRanks || []) rows.push('🌟 ' + esc(A.Stars.def(x.id).name) + ' → <b>' + A.Stars.SM.names[x.rank] + '</b>');
  for (const x of r.adapted || []) rows.push('📈 ' + esc(A.Stars.def(x.id).name) + ' adapted: OVR ' + x.from + ' → ' + x.to);
  for (const x of r.powerRanks || []) rows.push('⚡ ' + esc(A.Powers.def(x.id).name) + ' Mastery rank ' + x.rank);
  for (const id of r.powersUnlocked || []) rows.push('🔓 New Power: <b>' + esc(A.Powers.def(id).name) + '</b>');
  for (const t of r.trophies || []) rows.push(TROPHY[t][0] + ' ' + TROPHY[t][1]);
  for (const c of r.cosmetics || []) rows.push('🎨 ' + esc(c));
  return rows.length ? '<div class="card small">' + rows.join('<br>') + '</div>' : '';
}
function showResults(out) {
  const s = st.save, res = out.res, snap = out.snap, r = out.rewards || {};
  const won = res.won, fb = res.football;
  AU.play(won ? 'trophy' : 'error', won ? 0.5 : 0.4);
  let extra = '';
  if (out.canRematch) extra = '<div class="card coral" style="border-color:#7a2430"><b>Official match lost.</b> One free REMATCH: change formation, stars or Favorite Powers first if you like. Rewards come only from the final result.</div>';
  if (out.kind === 'promo' && out.promo) extra = '<div class="card gold"><b>Promotion Challenge</b> — ' + out.promo.games.join(' ') + ' (' + out.promo.wins + 'W ' + out.promo.losses + 'L)' + (out.promo.done ? (out.promo.success ? ' · <span class="mint">PROMOTED!</span>' : ' · <span class="coral">Failed — try again any time</span>') : '') + '</div>';
  if (out.kind === 'challenge') extra = '<div class="card gold"><b>' + A.Challenges.INFO[snap.ctx.kind].name + ' · Division ' + snap.div + '</b>' + (out.medal ? ' — ' + ['', '🥉 Bronze', '🥈 Silver', '🥇 Gold'][out.medal] : '') + '</div>';
  const lv = (r.levelUps || []).length ? '<div class="card gold"><b>⬆️ TEAM LEVEL ' + r.levelUps[r.levelUps.length - 1] + '!</b>' + ((r.milestones || []).length ? ' Milestone reward (Lv ' + r.milestones.join(', ') + ')' : '') + '</div>' : '';
  const coach = out.coach && out.coach.length ? '<div class="coach"><b>🧑‍🏫 Coach Analysis</b><ul style="margin:4px 0 0 18px;padding:0">' + out.coach.map(t => '<li>' + esc(t.text) + '</li>').join('') + '</ul></div>' : '';
  const road = out.roadmap ? '<div class="coach"><b>🧭 Comeback Roadmap</b> (3 losses in a row)<ol style="margin:4px 0 0 18px;padding:0">' + out.roadmap.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol></div>' : '';
  const html = '<div class="res-hd"><div class="tiny dim" style="font-weight:900;letter-spacing:.12em">' + esc(snap.label.toUpperCase()) + '</div><div class="big ' + (won ? 'win' : 'loss') + '">' + (won ? 'VICTORY' : 'DEFEAT') + '</div>' +
    '<div class="vs" style="margin-top:10px"><div>' + cimg(snap.teamA.id, 44) + '<div class="nm">' + esc(snap.teamA.name) + '</div><div class="pw">' + (res.alive ? res.alive[0] : 0) + ' standing</div></div><div class="mid mono">' + res.goals[0] + ' - ' + res.goals[1] + '<div class="tiny dim">goals</div></div><div>' + cimg(snap.teamB.id, 44) + '<div class="nm">' + esc(snap.teamB.name) + '</div><div class="pw">' + (res.alive ? res.alive[1] : 0) + ' standing</div></div></div></div>' +
    extra + timeUpHTML(res) + lv +
    (out.canRematch ? '' : '<div class="rew"><div><b class="gold-t">+' + fmt(r.credits || 0) + '</b><span>CREDITS</span></div><div><b class="mint">+' + (r.xp || 0) + '</b><span>TEAM XP</span></div><div><b style="color:#8ff3ff">+' + (r.frags || 0) + '</b><span>FRAGMENTS</span></div></div>') +
    ((r.labels || []).length ? '<p class="tiny dim" style="text-align:center">' + r.labels.map(esc).join(' · ') + '</p>' : '') +
    (r.packs || r.academy || r.crest || r.banner ? '<p class="small" style="text-align:center">' + rewardLine({ packs: r.packs, academy: r.academy, crest: r.crest, banner: r.banner }) + '</p>' : '') +
    progressHTML(r) + coach + road + powersUsedHTML(res) +
    '<details class="card small"><summary style="font-weight:800;cursor:pointer">Match stats</summary><div class="kv" style="margin-top:8px">' +
    (fb ? '<dt>Possession</dt><dd>' + fb.possession.join(' / ') + ' %</dd><dt>Shots (on target)</dt><dd>' + fb.shots[0] + ' (' + fb.onTarget[0] + ') / ' + fb.shots[1] + ' (' + fb.onTarget[1] + ')</dd><dt>Saves</dt><dd>' + fb.saves.join(' / ') + '</dd><dt>Passes</dt><dd>' + fb.passes.join(' / ') + '</dd><dt>Ball wins</dt><dd>' + (fb.steals[0] + fb.intercepts[0]) + ' / ' + (fb.steals[1] + fb.intercepts[1]) + '</dd>' : '') +
    '<dt>K.O.s</dt><dd>' + (res.kills ? res.kills.join(' / ') : '-') + '</dd><dt>Battle time</dt><dd>' + (res.battleSeconds || 0).toFixed(1) + ' s</dd>' + (res.abandoned ? '<dt>Note</dt><dd>abandoned</dd>' : '') + '</div></details>' +
    (out.canRematch ? '<div class="grid2"><button class="btn ghost" data-m="adjust">Adjust squad</button><button class="btn gold" data-m="rematch">REMATCH</button></div><button class="btn ghost block" style="margin-top:8px" data-m="accept">Accept the loss</button>' : '<button class="btn gold block" data-m="next">' + (out.kind === 'league' ? 'NEXT MATCH' : 'CONTINUE') + '</button>');
  modal(html, m => {
    if (m === 'rematch') { closeModal(); startBattle('league', { attempt: 2 }); return; }
    if (m === 'adjust') { closeModal(); go('squad'); toast('Your REMATCH waits on the Club screen', ''); return; }
    if (m === 'accept') { const o2 = A.Battle.acceptLoss(s); afterFinal(o2); persist(); closeModal(); if (o2 && o2.roadmap) toast('Comeback Roadmap added on the Club screen', 'gold'); go('club'); return; }
    if (m === 'next') { closeModal(); if (r.challengesUnlocked) toast('🎯 Challenge Board unlocked for Division ' + r.challengesUnlocked + '!', 'gold', 3500); if (r.milestone) toast('📍 ' + r.milestone.name + ' milestone reached!', 'gold', 3500); if (out.kind === 'promo' && out.promo && out.promo.done && out.promo.success) celebrate(); go('club'); }
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
  if (!$('modal').classList.contains('hidden') || $('draftBox') || document.querySelector('.opening')) { setTimeout(checkSeasonEnd, 1200); return; }
  const out = A.Endgame.closeSeason(s); persist(); if (!out) return; logRewards(out, 'Season end');
  const t = A.League.table(s).slice(0, 3), champ = out.rank === 1;
  if (champ) { AU.play('trophy', 0.8); celebrate(60); AU.vibrate([80, 50, 80, 50, 160]); }
  const head = out.div === 1 ? (champ ? 'CHAMPIONS LEAGUE WINNERS!' : 'SEASON COMPLETE') : champ ? 'DIVISION ' + out.div + ' CHAMPIONS!' : out.rank <= 3 ? 'PROMOTED!' : 'SEASON COMPLETE';
  const next = out.phase === 'promoted' ? '<button class="btn gold block" data-m="promote">ADVANCE TO ' + (out.div === 2 ? 'THE CHAMPIONS LEAGUE' : 'DIVISION ' + (out.div - 1)) + '</button>' : out.phase === 'promo' ? '<p class="small">You finished <b>#' + out.rank + '</b>. Win the <b>Promotion Challenge</b> (best of 3) to move up — retry as often as you like, or replay the season.</p><button class="btn gold block" data-m="close">TO THE PROMOTION CHALLENGE</button>' : '<button class="btn gold block" data-m="close">CONTINUE</button>';
  modal('<div style="text-align:center"><div class="trophy"' + (champ || out.phase === 'promoted' ? '' : ' style="filter:none"') + '>' + (champ || out.phase === 'promoted' ? '🏆' : '📋') + '</div><h2 style="font-size:22px">' + head + '</h2><div class="dim small">Final position: #' + out.rank + ' of 20</div>' +
    (out.firstTitle ? '<div class="card gold" style="margin-top:10px"><b class="gold-t">FIRST DIVISION 1 TITLE — WORLD CHAMPIONS!</b><br>Legend Draft Pack · Golden Champion Crest · Ricochet Fever Power</div>' : '') + '</div>' +
    '<div class="card" style="margin-top:10px">' + t.map((r, i) => '<div class="fx' + (r.id === s.club ? ' me' : '') + '"><div class="a">' + ['🥇', '🥈', '🥉'][i] + ' ' + esc(cname(r.id)) + '</div><div class="s">' + r.pts + ' pts</div><div class="tiny dim">' + r.w + 'W ' + r.l + 'L</div></div>').join('') + '</div>' +
    (rewardLine(out) ? '<p class="small" style="text-align:center">' + rewardLine(out) + '</p>' : '') + progressHTML(out) + next, m => {
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
    if ($('modal').classList.contains('hidden') && !$('draftBox') && (st.tab === 'club' || st.tab === 'league')) { const y = window.scrollY; render(); window.scrollTo(0, y); }
  }
  st.ai.timer = setTimeout(aiTick, done ? 30 : 8);
}

// ======================= settings / export / import / full screen =======================
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function isFull() { return !!fsEl(); }
function fsSupported() { const d = document.documentElement; return !!(d.requestFullscreen || d.webkitRequestFullscreen) && (document.fullscreenEnabled !== false || document.webkitFullscreenEnabled); }
function toggleFull() {
  try {
    if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const d = document.documentElement, r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d, { navigationUI: 'hide' });
    if (r && r.catch) r.catch(() => toast('Full screen is not allowed here', 'bad'));
  } catch (e) { toast('Full screen is not supported in this browser', 'bad'); }
}
function onFullChange() { const on = isFull(); document.querySelectorAll('.fsbtn').forEach(b => { b.textContent = on ? '🗗' : '⛶'; b.classList.toggle('on', on); }); setTimeout(fitStage, 60); }
function settingsModal() {
  const s = st.save, set = s ? s.settings : { master: 0.8, music: 0.5, sfx: 0.8, crowd: 0.6, mute: false, vibration: true, quality: 'medium', speed: 1, smartCam: true };
  const sl = (k, n) => '<div class="setrow"><span>' + n + '</span><input type="range" min="0" max="100" value="' + Math.round(set[k] * 100) + '" data-set="' + k + '"><span class="mono small">' + Math.round(set[k] * 100) + '</span></div>';
  const lic = root.FW_MASTER_DB.metadata.sources.find(x => x.license) || {};
  modal('<h2>Settings</h2>' + sl('master', 'Master volume') + sl('music', 'Music') + sl('sfx', 'Battle SFX') + sl('crowd', 'Crowd & ambience') +
    '<label class="chk"><input type="checkbox" data-set="mute"' + (set.mute ? ' checked' : '') + '> Mute all sound</label>' +
    '<label class="chk"><input type="checkbox" data-set="vibration"' + (set.vibration ? ' checked' : '') + '> Vibration (if supported)</label>' +
    '<label class="chk"><input type="checkbox" data-set="smartCam"' + (set.smartCam !== false ? ' checked' : '') + '> Smart camera (off = always wide)</label>' +
    '<div class="setrow"><span>Graphics</span><div class="seg" style="grid-column:span 2">' + ['low', 'medium', 'high'].map(q => '<button data-m="q:' + q + '" class="' + (set.quality === q ? 'on' : '') + '">' + q[0].toUpperCase() + q.slice(1) + '</button>').join('') + '</div></div>' +
    '<p class="note">Low keeps all 100 vs 100 players, every Power and star ability — it only reduces particles, flashes, shake and pixel density. Results never depend on graphics, sound or speed.</p>' +
    (fsSupported() ? '<button class="btn block" data-m="full">' + (isFull() ? 'Exit full screen' : 'Full screen') + '</button>' : '') +
    (s ? '<div class="title">Save</div><div class="grid2"><button class="btn" data-m="export">Export Save (JSON)</button><button class="btn" data-m="import">Import Save</button></div>' +
      '<p class="note">' + (st.storageOk ? 'Autosave is ON (browser storage + backup copy).' : '<span class="coral">Autosave is NOT working in this browser.</span>') + ' Phone browsers can clear storage — export a file now and then.</p>' +
      '<button class="btn coral block" data-m="reset" style="margin-top:6px">Delete career…</button>' : '') +
    '<div class="title">About</div><p class="note">FOOTBALL WARS — ROAD TO GLORY · built on the Football Wars V4 deterministic 100v100 Football Fusion engine. Independent fan game: adapted rival club names, original pixel crests/kits, fictional stars; no official logos, sponsors, licensed kits or real player names/portraits. Club strength source: ' + esc(lic.attribution_required || 'beyondELO') + ' (' + esc(lic.license || 'CC BY 4.0') + ').</p>' +
    '<button class="btn mint block" data-m="close" style="margin-top:8px">Done</button>', m => {
    if (m === 'close') { closeModal(); render(); return; }
    if (m === 'full') { toggleFull(); closeModal(); return; }
    if (m.startsWith('q:')) { set.quality = m.slice(2); if (s) persist(); settingsModal(); return; }
    if (m === 'export') return exportSave();
    if (m === 'import') return importSave();
    if (m === 'reset') return confirmBox('This deletes your whole career from this browser (export it first if you want to keep it).', () => { try { localStorage.removeItem(A.Save.KEY); localStorage.removeItem(A.Save.BAK); } catch (e) {} stopAI(); st.save = null; draftProfile = null; render(); });
  });
  $('modal').oninput = $('modal').onchange = e => {
    const k = e.target.dataset && e.target.dataset.set; if (!k) return;
    if (e.target.type === 'checkbox') set[k] = e.target.checked; else { set[k] = e.target.value / 100; e.target.nextElementSibling.textContent = e.target.value; }
    AU.init(); AU.apply(Object.assign({}, set)); if (s) persist();
  };
}
function exportText(txt, name) {
  try { const blob = new Blob([txt], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Save exported', ''); }
  catch (e) { toast('Export failed: ' + e.message, 'bad'); }
}
function exportSave() { exportText(A.Save.serialize(st.save), 'FootballWars_RoadToGlory_' + st.save.profile.name.replace(/[^a-z0-9]+/gi, '_') + '_D' + st.save.division + '.json'); }
function importSave() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try { const v = (JSON.parse(String(rd.result)) || {}).v; const s = A.Save.parse(String(rd.result)); stopAI(); st.save = s; st.ai.w = null; st.crest.clear(); persist(); closeModal(); st.tab = 'club'; render(); toast('Save imported: ' + s.profile.name + ' · Division ' + s.division + (v < A.VERSION ? ' (upgraded to Road to Glory)' : ''), 'gold'); startAI(); boot2(); }
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
  if (st.migrated) { const v = st.migrated; st.migrated = false;
    modal('<h2>Welcome to Road to Glory</h2><p class="small">Your ' + (v === 1 ? 'Arcade Reborn' : 'Arcade Mayhem') + ' career was upgraded — nothing was lost: Credits, Fragments, Team Level, Division, fixtures, results, Training, stars and packs are all still here.</p><ul class="small" style="padding-left:18px"><li>Your club keeps its name and colours as <b>' + esc(s.profile.name) + '</b> — edit crest and colours in Club.</li><li>Stars are now <b>permanent</b>; remaining contract matches became Star Mastery XP.</li><li>Contract Tickets became <b>Academy Training Tickets</b>.</li><li>Manual commands are gone: <b>24 automatic Powers</b> (pick 2 Favorites in Powers).</li></ul><button class="btn gold block" data-m="ok">LET\'S GO</button>', () => { closeModal(); boot2(); });
    persist(); return; }
  if (s.pendingBattle) {
    modal('<h2>Unfinished battle</h2><p class="small">' + esc(s.pendingBattle.snap.label) + ' was interrupted. Resume exactly where it was (same seed, squads' + (s.pendingBattle.snap.mech === A.MECH ? ' and Powers' : ' and its original rules') + '), or abandon it as a loss.</p><div class="grid2"><button class="btn coral" data-m="abandon">Abandon (loss)</button><button class="btn gold" data-m="resume">RESUME BATTLE</button></div>', m => {
      closeModal();
      if (m === 'resume') resumeBattle(); else { const out = A.Battle.abandon(s); persist(); if (out) showResults(out); }
    });
  } else if (s.pendingDraft) { st.tab = 'rewards'; render(); }
}
function boot() {
  st.storageOk = Store.available(); if (!st.storageOk) st.storageMsg = 'Browser storage is unavailable here: progress will NOT be saved. Use Export Save.';
  st.save = Store.load();
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (b && !b.disabled) { e.preventDefault(); onAct(b.dataset.act); return; }
    const sc = e.target.closest('#screen [data-star]'); if (sc && st.save && st.save.stars[sc.dataset.star]) { starModal(sc.dataset.star); return; }
    const pw = e.target.closest('#screen [data-pw]'); if (pw && st.save) powerModal(pw.dataset.pw);
  });
  document.querySelectorAll('#tabbar [data-tab]').forEach(b => b.onclick = () => { AU.init(); AU.ui(); go(b.dataset.tab); });
  $('starBar').addEventListener('click', e => { const b = e.target.closest('[data-focus]'), B = st.battle; if (!b || !B || !B.w) return; const id = +b.dataset.focus; B.starFocus = B.starFocus && B.starFocus.id === id ? null : { id, until: performance.now() + 5000 }; AU.ui(); buildStarBar(B); });
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
    else if (b.dataset.b === 'abandon') { cancelAnimationFrame(B.raf); closeBattleView(); const out = A.Battle.abandon(st.save); persist(); if (out) showResults(out); }
  };
  document.addEventListener('keydown', e => { if (st.battle && st.battle.w && (e.code === 'KeyP' || e.code === 'Escape')) setPause(!st.battle.paused); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.battle && st.battle.w && !st.battle.paused) setPause(true); if (document.hidden && st.save) Store.write(); });
  window.addEventListener('resize', fitStage);
  document.addEventListener('fullscreenchange', onFullChange); document.addEventListener('webkitfullscreenchange', onFullChange);
  if (!fsSupported()) document.documentElement.classList.add('no-fs');
  window.addEventListener('pagehide', () => { if (st.battle && st.battle.w) saveProgress(st.battle); });
  render(); boot2(); if (st.save) startAI();
}
root.ArcadeApp = { boot, st, persist, render };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
