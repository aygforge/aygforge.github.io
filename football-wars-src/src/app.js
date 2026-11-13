/* FOOTBALL WARS — application controller (UI, live battle, automatic video export). */
(function () {
'use strict';
const DB = window.FW_MASTER_DB, CFG = window.FW_ENGINE_CONFIG, FLAGS = window.FW_FLAGS || {}, LIC = window.FW_LICENSES || {};
const E = window.FWEngine, S = window.FWSprites, F = window.FWFont, R = window.FWRender, A = window.FWAudio, X = window.FWExport, D = window.FWDirector;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ALL = [...DB.clubs, ...DB.national_teams];
const BY_ID = new Map(ALL.map(t => [t.id, t]));
const LEAGUES = new Map(DB.leagues.map(l => [l.id, l]));
const ERRORS = [];
window.addEventListener('error', e => ERRORS.push(String(e.message || e)));
window.addEventListener('unhandledrejection', e => ERRORS.push(String((e.reason && e.reason.message) || e.reason)));
const DIAG = { matches: 0, exports: 0, urls: new Set(), lastLive: null, lastExport: null, encoderOpen: 0 };

// ======================= data checks =======================
function dataChecks() {
  const c = [];
  const m = DB.metadata.counts;
  c.push({ k: 'Leagues', v: DB.leagues.length, ok: DB.leagues.length === 11 && m.leagues === 11 });
  c.push({ k: 'Clubs', v: DB.clubs.length, ok: DB.clubs.length === 194 && m.clubs === 194 });
  c.push({ k: 'National teams', v: DB.national_teams.length, ok: DB.national_teams.length === 55 && m.national_teams === 55 });
  c.push({ k: 'Total teams', v: ALL.length, ok: ALL.length === 249 && m.total === 249 });
  c.push({ k: 'Unique IDs', v: BY_ID.size, ok: BY_ID.size === ALL.length });
  const rolesOk = ALL.filter(t => Object.values(t.battle_profile.roles_per_100).reduce((a, b) => a + b, 0) === 100).length;
  c.push({ k: 'roles_per_100 sums to 100', v: rolesOk + '/' + ALL.length, ok: rolesOk === ALL.length });
  const attrOk = ALL.filter(t => E.ATTRS.every(a => typeof t.battle_profile.attributes[a] === 'number')).length;
  c.push({ k: 'All 10 attributes present', v: attrOk + '/' + ALL.length, ok: attrOk === ALL.length });
  const leagueOk = DB.leagues.every(l => l.team_ids.length === l.club_count && l.team_ids.every(id => BY_ID.has(id) && BY_ID.get(id).league_id === l.id));
  c.push({ k: 'League ↔ club links', v: leagueOk ? 'consistent' : 'ERROR', ok: leagueOk });
  const arch = ALL.every(t => CFG.archetype_definitions[t.battle_profile.archetype]);
  c.push({ k: 'Tactical archetypes defined in config', v: arch ? 'yes' : 'NO', ok: arch });
  return c;
}

// ======================= search =======================
function norm(s) { return String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ß/g, 'ss').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, ' ').trim(); }
const INDEX = ALL.map(t => {
  const lg = t.league_id ? LEAGUES.get(t.league_id) : null;
  const keys = [t.name, t.display_name_tr, ...(t.search_aliases || []), t.search_key, t.id.replace(/^[A-Z]+_/, '').replace(/_/g, ' ')].map(norm).filter(Boolean);
  const extra = [t.country, lg ? lg.name : '', t.country_code].map(norm).filter(Boolean);
  return { t, keys: [...new Set(keys)], extra: [...new Set(extra)], compact: [...new Set(keys.map(k => k.replace(/ /g, '')))] };
});
function search(q, f) {
  const nq = norm(q), cq = nq.replace(/ /g, '');
  const out = [];
  for (const it of INDEX) {
    const t = it.t;
    if (f.type && t.type !== f.type) continue;
    if (f.league && t.league_id !== f.league) continue;
    let score = 9;
    if (!nq) score = 5;
    else {
      for (const k of it.keys) { if (k === nq) score = Math.min(score, 0); else if (k.startsWith(nq)) score = Math.min(score, 1); else if (k.split(' ').some(w => w.startsWith(nq))) score = Math.min(score, 2); else if (k.includes(nq)) score = Math.min(score, 3); }
      for (const k of it.compact) if (cq.length > 1 && k.includes(cq)) score = Math.min(score, 3);
      for (const k of it.extra) if (k.startsWith(nq) || (nq.length > 2 && k.includes(nq))) score = Math.min(score, 4);
    }
    if (score < 9) out.push([score, t]);
  }
  out.sort((a, b) => a[0] - b[0] || b[1].battle_profile.power_index - a[1].battle_profile.power_index);
  return out.map(x => x[1]);
}

// ======================= modes / validation =======================
const MODES = [
  ['domestic_league', 'League match (same league)', { tr: null, en: null }],
  ['champions_league', 'Champions League — fictional match-up', { tr: 'ŞAMPİYONLAR LİGİ', en: 'CHAMPIONS LEAGUE' }],
  ['europa_league', 'Europa League — fictional match-up', { tr: 'AVRUPA LİGİ', en: 'EUROPA LEAGUE' }],
  ['conference_league', 'Conference League — fictional match-up', { tr: 'KONFERANS LİGİ', en: 'CONFERENCE LEAGUE' }],
  ['national_match', 'International match', { tr: 'MİLLİ MAÇ', en: 'INTERNATIONAL' }],
  ['custom_exhibition', 'Free exhibition match', { tr: 'GÖSTERİ MAÇI', en: 'EXHIBITION' }]
];
const MODE_NOTES = {
  domestic_league: 'Both clubs must be from the same league. Pick a league first.',
  champions_league: 'FICTIONAL MATCH-UP: you can pick any two clubs in the database. No real UEFA fixture, official participant list or eligibility is checked or claimed.',
  europa_league: 'FICTIONAL MATCH-UP: any two clubs can be picked. No real fixture or participant list is claimed.',
  conference_league: 'FICTIONAL MATCH-UP: any two clubs can be picked. No real fixture or participant list is claimed.',
  national_match: 'Two UEFA national teams. Source: FIFA men’s world ranking (7 Oct 2026); battle power is a derived game index.',
  custom_exhibition: 'Free match-up. Club vs national team is off by default; Elo and FIFA points are never put on the same scale — only the game power index is used.'
};
function modeType(mode) { return mode === 'national_match' ? 'national' : mode === 'custom_exhibition' ? null : 'club'; }
function validate(a, b, mode, mixed) {
  const cfg = DB.metadata.modes[mode]; if (!cfg) return { ok: false, error: 'Unknown competition type' };
  if (!a && !b) return { ok: false, error: 'Pick Team A and Team B.' };
  if (!a) return { ok: false, error: 'Pick Team A.' };
  if (!b) return { ok: false, error: 'Pick Team B.' };
  if (a.id === b.id) return { ok: false, error: 'A team cannot play itself.' };
  if (mode === 'domestic_league' && (a.type !== 'club' || b.type !== 'club' || a.league_id !== b.league_id)) return { ok: false, error: 'League match mode needs two clubs from the same league.' };
  if (mode === 'national_match' && (a.type !== 'national' || b.type !== 'national')) return { ok: false, error: 'International mode needs two national teams.' };
  if (['champions_league', 'europa_league', 'conference_league'].includes(mode) && (a.type !== 'club' || b.type !== 'club')) return { ok: false, error: 'UEFA club competition modes need two clubs.' };
  if (mode === 'custom_exhibition' && a.type !== b.type && !mixed) return { ok: false, error: 'To play a club against a national team, enable “Allow club vs national team”.' };
  return { ok: true };
}

// ======================= logos =======================
const flagImgs = new Map();
const userLogos = new Map();
const logoCache = new Map();
async function loadFlags() {
  const jobs = [];
  for (const id in FLAGS) {
    const img = new Image(); img.src = FLAGS[id].data;
    jobs.push(img.decode().then(() => flagImgs.set(id, img)).catch(() => { }));
  }
  for (const id in S.SIMPLE_FLAGS) if (!FLAGS[id]) flagImgs.set(id, S.simpleFlagImage(id));
  await Promise.all(jobs);
  // user logos saved earlier in this browser
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k || !k.startsWith('fw_logo:')) continue;
      const id = k.slice(8); if (!BY_ID.has(id)) continue;
      const img = new Image(); img.src = localStorage.getItem(k);
      try { await img.decode(); if (canvasSafe(img)) userLogos.set(id, img); } catch (e) { }
    }
  } catch (e) { }
}
function canvasSafe(img) { try { const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 2, 2); g.getImageData(0, 0, 1, 1); return true; } catch (e) { return false; } }
function logoKind(team) {
  if (userLogos.has(team.id)) return { kind: 'user', label: 'Logo uploaded by you (stored only in this browser).', real: false };
  if (FLAGS[team.id]) return { kind: 'flag', label: 'National flag — Wikimedia Commons (' + FLAGS[team.id].file + '). Not the federation crest.', real: true };
  if (S.SIMPLE_FLAGS[team.id]) return { kind: 'flag-simple', label: 'Simplified flag drawing (generated locally). Not the federation crest.', real: false };
  return { kind: 'generated', label: 'PLACEHOLDER crest generated from team colours and initials — not the official logo.', real: false };
}
function logoSet(team) {
  let L = logoCache.get(team.id); if (L) return L;
  const k = logoKind(team);
  let small, big;
  if (k.kind === 'user') { const img = userLogos.get(team.id); small = S.imageBadge(img, 26); big = S.imageBadge(img, 96); }
  else if (k.kind === 'flag' || k.kind === 'flag-simple') { const img = flagImgs.get(team.id); if (img) { small = S.flagBadge(img, 26); big = S.flagBadge(img, 96); } }
  if (!small) { small = S.generatedCrest(team, 26); big = S.generatedCrest(team, 96); if (k.kind !== 'generated') { k.kind = 'generated'; k.label = 'PLACEHOLDER crest (flag could not be loaded).'; } }
  const thumb = big.toDataURL('image/png');
  L = { small, big, thumb, ...k };
  logoCache.set(team.id, L);
  return L;
}

// ======================= settings / persistence =======================
function radio(name) { const el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
function setRadio(name, v) { const el = document.querySelector('input[name="' + name + '"][value="' + v + '"]'); if (el && !el.disabled) el.checked = true; }
function settings() {
  return {
    res: radio('res') || '1080', fps: +(radio('fps') || 30), duration: radio('dur') || 'standard', fx: +(radio('fx') || 1), lang: radio('lang') || 'en',
    sound: $('optSound').checked, labels: $('optLabels').checked, music: +$('volMusic').value / 100, sfx: +$('volSfx').value / 100,
    style: radio('vstyle') || 'cinematic', smartCam: $('optSmartCam').checked, camInt: radio('camint') || 'normal', story: $('optStory').checked,
    epic: $('optEpic').checked, vfx: $('optVfx').checked, mvp: $('optMvp').checked, crowd: $('optCrowd').checked, momentum: $('optMomentum').checked, hc: radio('hcteams') || 'auto', cover: radio('covertype') || 'nospoiler',
    ruleset: radio('ruleset') || 'fusion', fbInt: radio('fbint') || 'normal', fbFollow: $('optFbFollow').checked, fbAlerts: $('optFbAlerts').checked, goalAdv: $('optGoalAdv').checked
  };
}
function saveSettings() { try { localStorage.setItem('fw_settings_v4', JSON.stringify({ ...settings(), mode: st.mode, league: st.league })); } catch (e) { } }
function loadSettings() {
  let s = null; try { s = JSON.parse(localStorage.getItem('fw_settings_v4') || localStorage.getItem('fw_settings_v3') || localStorage.getItem('fw_settings_v2') || 'null'); } catch (e) { } // v2 values migrate, nothing is reset
  if (!s) return null;
  setRadio('res', s.res); setRadio('fps', s.fps); setRadio('dur', s.duration); setRadio('fx', s.fx); setRadio('lang', s.lang);
  $('optSound').checked = s.sound !== false; $('optLabels').checked = s.labels !== false;
  if (s.style) setRadio('vstyle', s.style); if (s.camInt) setRadio('camint', s.camInt);
  $('optSmartCam').checked = s.smartCam !== false; $('optStory').checked = s.story !== false;
  for (const [k, id] of [['epic', 'optEpic'], ['vfx', 'optVfx'], ['mvp', 'optMvp'], ['crowd', 'optCrowd'], ['momentum', 'optMomentum']]) $(id).checked = s[k] !== false;
  if (s.hc) setRadio('hcteams', s.hc); if (s.cover) setRadio('covertype', s.cover);
  if (s.ruleset) setRadio('ruleset', s.ruleset); if (s.fbInt) setRadio('fbint', s.fbInt);
  for (const [k, id] of [['fbFollow', 'optFbFollow'], ['fbAlerts', 'optFbAlerts'], ['goalAdv', 'optGoalAdv']]) $(id).checked = s[k] !== false;
  if (s.music != null) $('volMusic').value = Math.round(s.music * 100); if (s.sfx != null) $('volSfx').value = Math.round(s.sfx * 100);
  return s;
}

// ======================= state =======================
const st = { mode: 'domestic_league', league: 'TUR_SUPER', typeFilter: '', mixed: false, a: null, b: null, phase: 'idle', caps: null, audioCtx: null,
  match: null, live: null, videoURL: null, cancel: false, lastSeed: null, lastSettings: null, player: null, raf: 0 };

// ======================= UI: modes & pickers =======================
function fillModes() {
  $('mode').innerHTML = MODES.map(m => `<option value="${m[0]}">${esc(m[1])}</option>`).join('');
  $('mode').value = st.mode;
}
function fillLeague() {
  const m = st.mode, sel = $('league');
  $('leagueWrap').classList.toggle('hidden', m === 'national_match');
  $('typeWrap').classList.toggle('hidden', m !== 'custom_exhibition');
  $('mixedWrap').classList.toggle('hidden', m !== 'custom_exhibition');
  if (m === 'domestic_league') {
    $('leagueLbl').textContent = 'League (required — both clubs from this league)';
    sel.innerHTML = DB.leagues.map(l => `<option value="${l.id}">${esc(l.name)} — ${esc(countryEn(l.country_code))} (${l.club_count} clubs)</option>`).join('');
    if (!LEAGUES.has(st.league)) st.league = 'TUR_SUPER';
    sel.value = st.league;
  } else {
    $('leagueLbl').textContent = 'League filter (narrows search)';
    sel.innerHTML = '<option value="">All leagues</option>' + DB.leagues.map(l => `<option value="${l.id}">${esc(l.name)} — ${esc(countryEn(l.country_code))}</option>`).join('');
    sel.value = LEAGUES.has(st.league) && m !== 'domestic_league' ? st.league : '';
    if (m !== 'domestic_league') st.league = sel.value;
  }
  $('modeNote').textContent = MODE_NOTES[m];
  $('modeNote').className = 'note' + (['champions_league', 'europa_league', 'conference_league'].includes(m) ? ' warn' : '');
}
function filterFor() {
  const m = st.mode; const f = { type: modeType(m), league: '' };
  if (m === 'domestic_league') f.league = st.league;
  else if (m !== 'national_match') f.league = st.league || '';
  if (m === 'custom_exhibition') { f.type = st.typeFilter || null; if (f.league) f.type = 'club'; }
  return f;
}
function leagueName(t) { return t.type === 'national' ? 'National team • UEFA' : ((LEAGUES.get(t.league_id) || {}).name || '') + ' • ' + countryEn(t.country_code); }
const pickers = {};
function setupPicker(side) {
  const inp = $('search' + side), box = $('res' + side);
  const P = { side, inp, box, list: [], act: -1 };
  pickers[side] = P;
  const render = () => {
    const f = filterFor();
    P.list = search(inp.value, f).slice(0, 60);
    const other = side === 'A' ? st.b : st.a;
    if (!P.list.length) { box.innerHTML = '<div class="res dis"><span></span><span class="lg">No results — try another spelling or change the league filter.</span><span></span></div>'; box.classList.add('open'); return; }
    box.innerHTML = P.list.map((t, i) => {
      const dis = other && other.id === t.id;
      return `<div class="res${dis ? ' dis' : ''}${i === P.act ? ' act' : ''}" data-i="${i}" title="${dis ? 'A team cannot play itself' : ''}"><img src="${logoSet(t).thumb}" alt=""><div><div class="nm">${esc(t.name)}</div><div class="lg">${esc(leagueName(t))}${dis ? ' — already on the other side' : ''}</div></div><span class="pw">${t.battle_profile.power_index}</span></div>`;
    }).join('');
    box.classList.add('open');
  };
  P.render = render;
  inp.addEventListener('input', () => { P.act = -1; render(); });
  inp.addEventListener('focus', () => { render(); });
  inp.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'ArrowDown') { P.act = Math.min(P.list.length - 1, P.act + 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { P.act = Math.max(0, P.act - 1); render(); e.preventDefault(); }
    else if (e.key === 'Enter') { const t = P.list[P.act >= 0 ? P.act : 0]; if (t) choose(side, t); e.preventDefault(); }
    else if (e.key === 'Escape') box.classList.remove('open');
  });
  box.addEventListener('mousedown', e => { const el = e.target.closest('.res'); if (!el || el.classList.contains('dis')) { e.preventDefault(); return; } const t = P.list[+el.dataset.i]; if (t) choose(side, t); e.preventDefault(); });
  document.addEventListener('mousedown', e => { if (!$('pick' + side).contains(e.target)) box.classList.remove('open'); });
}
function choose(side, t) {
  const other = side === 'A' ? st.b : st.a;
  if (other && other.id === t.id) return;
  if (side === 'A') st.a = t; else st.b = t;
  pickers[side].inp.value = t.name;
  pickers[side].box.classList.remove('open');
  if (st.phase === 'done' || st.phase === 'error') st.phase = 'idle', setState('idle'); else refresh();
  renderCard(side);
}
const STAT_LABEL = { attack: 'Attack', defense: 'Defense', speed: 'Speed', pressing: 'Pressing', teamwork: 'Teamwork', finishing: 'Finishing', stamina: 'Stamina', physical: 'Physical', technique: 'Technique', goalkeeping: 'Goalkeeping' };
const ARCH_EN = { high_press: 'High press', possession: 'Possession', counter: 'Counter-attack', defensive_block: 'Low block', wing_attack: 'Wing play', physical: 'Physical' };
const COUNTRY_EN = { TUR: 'Türkiye', ENG: 'England', ESP: 'Spain', ITA: 'Italy', GER: 'Germany', FRA: 'France', POR: 'Portugal', NED: 'Netherlands', BEL: 'Belgium', GRE: 'Greece', SCO: 'Scotland' };
function countryEn(code) { return COUNTRY_EN[code] || code || ''; }
function renderCard(side) {
  const t = side === 'A' ? st.a : st.b, el = $('card' + side);
  if (!t) { el.classList.remove('on'); el.innerHTML = ''; return; }
  const bp = t.battle_profile, L = logoSet(t), arch = CFG.archetype_definitions[bp.archetype] || {};
  const sr = t.source_rating;
  const srTxt = sr.provider === 'FIFA' ? `FIFA points ${sr.value} (world #${sr.position}) — ${sr.edition_date}` : `beyondELO club Elo ${sr.value} (league rank #${sr.position})`;
  const bonus = Object.entries(arch.stat || {}).map(([k, v]) => `${STAT_LABEL[k] || k} ${v > 0 ? '+' : ''}${v}`).join(', ');
  const roles = Object.entries(bp.roles_per_100).map(([r, n]) => `<span class="tag">${E.ROLE_NAMES[r].en} ${n}</span>`).join('');
  el.innerHTML = `<div class="hd"><img class="logo" src="${L.thumb}" alt=""><div><div class="tn">${esc(t.name)}</div>
    <div class="meta">${esc(leagueName(t))}</div>
    <div class="meta"><span class="sw" style="background:${esc(t.visual.primary_color)}"></span><span class="sw" style="background:${esc(t.visual.secondary_color)}"></span> Power index <b style="color:#fff">${bp.power_index}</b> • ${esc(ARCH_EN[bp.archetype] || bp.archetype)}</div>
    <div class="pwbar"><i style="width:${bp.power_index}%"></i></div></div></div>
    <div class="stats">${['attack', 'defense', 'speed', 'pressing', 'teamwork', 'finishing'].map(k => `<div class="stat">${STAT_LABEL[k]} <b style="color:#fff">${bp.attributes[k]}</b><div class="bar"><i style="width:${bp.attributes[k]}%"></i></div></div>`).join('')}</div>
    <div class="tags">${bp.specials.map(s => `<span class="tag sp">★ ${esc((E.SPECIAL_NAMES[s] || {}).en || s)}</span>`).join('')}<span class="tag">Tactic bonus: ${esc(bonus || '—')}</span></div>
    <div class="tags">${roles}</div>
    <div class="note">Source rating: ${esc(srTxt)}</div>
    <div class="logo-src"><span class="badge${L.real ? ' real' : ''}">${L.kind === 'flag' ? 'FLAG' : L.kind === 'user' ? 'YOUR LOGO' : 'PLACEHOLDER'}</span>${esc(L.label)}
      <div class="row" style="margin-top:6px"><button class="btn small" data-up="${t.id}">Upload logo (PNG/SVG)</button>${L.kind === 'user' ? `<button class="btn small ghost" data-rm="${t.id}">Remove uploaded logo</button>` : '<span></span>'}</div></div>`;
  el.classList.add('on');
}
function refresh() {
  const v = validate(st.a, st.b, st.mode, st.mixed);
  const busy = st.phase === 'live' || st.phase === 'encoding';
  $('btnStart').disabled = !v.ok || busy || !st.ready;
  $('startReason').textContent = !st.ready ? 'Preparing…' : busy ? 'Battle / video in progress…' : v.ok ? (st.mode === 'domestic_league' ? '' : (['champions_league', 'europa_league', 'conference_league'].includes(st.mode) ? 'Note: fictional match-up.' : '')) : v.error;
  $('startReason').className = 'note' + (v.ok ? '' : ' warn');
  ['btnReplay', 'btnRematch', 'btnNew'].forEach(id => $(id).disabled = busy);
  $('btnSwap').disabled = busy;
  const idle = st.phase === 'idle';
  if (idle) drawIdle();
  else if ((st.phase === 'done' || st.phase === 'error') && st.match && st.match.world.phase === 'ended') {
    // keep showing the finished battle (final winner frame) instead of the idle preview
    const w = st.match.world; try { st.match.renderer.render(sctx, w.endT + w.outroLen - 0.01, stage.width, stage.height); } catch (e) { }
  }
  for (const s of ['A', 'B']) { const t = s === 'A' ? st.a : st.b; $('liveLogo' + s).src = t ? logoSet(t).thumb : ''; $('liveName' + s).textContent = t ? t.name : '—'; if (idle) $('live' + s).textContent = t ? '100' : '—'; }
  if (idle) { $('liveTotal').textContent = st.a && st.b ? '200' : '—'; $('liveTime').textContent = '00:00'; $('liveSeed').textContent = '—'; }
}
function onModeChange() {
  if (st.phase === 'done' || st.phase === 'error') setState('idle');
  st.mode = $('mode').value; fillLeague();
  // drop selections that no longer fit
  for (const s of ['A', 'B']) {
    const t = s === 'A' ? st.a : st.b; if (!t) continue;
    const f = filterFor(); let ok = (!f.type || t.type === f.type) && (!f.league || t.league_id === f.league);
    if (st.mode === 'custom_exhibition') ok = true;
    if (!ok) { if (s === 'A') st.a = null; else st.b = null; pickers[s].inp.value = ''; renderCard(s); }
  }
  refresh(); saveSettings();
}

// ======================= stage =======================
const stage = $('stage'); let sctx = stage.getContext('2d', { alpha: false });
function sizeStage() {
  const r = stage.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.min(3, Math.round(r.width * dpr / 360)));
  if (stage.width !== 360 * k) { stage.width = 360 * k; stage.height = 640 * k; sctx = stage.getContext('2d', { alpha: false }); if (st.phase !== 'live' && st.phase !== 'encoding') refresh(); }
}
let idleTimer = 0;
function drawIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (st.phase === 'live' || st.phase === 'encoding') return;
    if (st.a && st.b && validate(st.a, st.b, st.mode, st.mixed).ok) {
      try {
        const m = buildMatch(1, settings(), true);
        E.advanceTo(m.world, 2.19);
        m.renderer.render(sctx, 2.19, stage.width, stage.height);
        m.renderer.dispose();
        drawStageText(settings().lang === 'tr' ? 'HAZIR • BAŞLAT' : 'READY • PRESS START', 1);
        drawKitPreview(m);
      } catch (e) { console.error(e); }
    } else splash();
  }, 30);
}
function drawStageText(txt, k) {
  const c = document.createElement('canvas'); c.width = 360; c.height = 640; const g = c.getContext('2d');
  F.draw(g, txt, 180, 560, { scale: 2, bold: true, color: '#ffe14d', align: 'center' });
  sctx.imageSmoothingEnabled = false; sctx.drawImage(c, 0, 0, stage.width, stage.height); void k;
}
function splash() {
  const c = document.createElement('canvas'); c.width = 360; c.height = 640; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, '#141a3a'); gr.addColorStop(1, '#070912'); g.fillStyle = gr; g.fillRect(0, 0, 360, 640);
  g.fillStyle = '#1f6b2a'; g.fillRect(20, 200, 320, 300); g.fillStyle = '#23762f'; for (let y = 200; y < 500; y += 40) g.fillRect(20, y, 320, 20);
  g.fillStyle = '#e9f6e2'; g.fillRect(20, 350, 320, 1); g.strokeStyle = '#e9f6e2'; g.beginPath(); g.arc(180, 350, 30, 0, 7); g.stroke();
  F.draw(g, 'FOOTBALL WARS', 180, 110, { scale: 4, bold: true, color: '#ffffff', color2: '#ffe14d', align: 'center' });
  F.draw(g, '100 VS 100 PIXEL BATTLE', 180, 150, { scale: 2, color: '#36f1cd', align: 'center' });
  F.draw(g, R.TXT[settings().lang].ready, 180, 540, { scale: 2, bold: true, color: '#ffffff', align: 'center' });
  sctx.imageSmoothingEnabled = false; sctx.drawImage(c, 0, 0, stage.width, stage.height);
}

// ======================= match building =======================
function modeLabel(lang) {
  const m = MODES.find(x => x[0] === st.mode);
  if (st.mode === 'domestic_league') { const l = LEAGUES.get(st.a.league_id); return F.upper(l ? l.name : 'LEAGUE'); }
  return m[2][lang] || m[2].en;
}
function obsOpts(set) { return { smartCam: set.smartCam, intensity: set.camInt, epicFinale: set.epic, mvpStreaks: set.mvp, fbAlerts: set.fbAlerts, fbFollow: set.fbFollow }; }
function fbOpts(set) { return set.ruleset === 'fusion' ? { ruleset: 'fusion', fbIntensity: set.fbInt, goalAdv: set.goalAdv } : { ruleset: 'classic' }; }
function rulesetLabel(o) { return o.ruleset === 'fusion' ? 'Football Fusion (' + (o.fbIntensity || 'normal') + (o.goalAdv === false ? ', no goal advantage' : '') + ')' : 'Classic Battle (V3)'; }
function buildMatch(seed, set, preview) {
  const teams = [st.a, st.b];
  const hcActive = set.hc === 'on' || (set.hc === 'auto' && S.color.cdist(S.color.vivid(teams[0].visual.primary_color), S.color.vivid(teams[1].visual.primary_color)) < 210);
  const kits = S.makeKits(teams[0], teams[1], set.hc === 'off' ? 150 : 210);
  const atlases = [S.buildAtlas(teams[0], kits[0]), S.buildAtlas(teams[1], kits[1])];
  const logos = teams.map(t => logoSet(t));
  const opts = Object.assign({ seed, teamA: teams[0], teamB: teams[1], cfg: CFG, duration: set.duration, fxLevel: set.fx }, fbOpts(set));
  const world = E.createWorld(opts);
  world.observer = D.createObserver(obsOpts(set));
  const rOpts = { teams, kits, atlases, logos, lang: set.lang, labels: set.labels, story: set.story, hc: hcActive, fxLevel: set.fx, v3: { vfx: set.vfx, finale: set.epic, mvp: set.mvp, momentum: set.momentum }, modeLabel: modeLabel(set.lang), fictional: ['champions_league', 'europa_league', 'conference_league'].includes(st.mode) || (st.mode === 'custom_exhibition' && teams[0].type !== teams[1].type) };
  const renderer = R.createRenderer({ ...rOpts, world });
  return { teams, kits, atlases, logos, opts, rOpts, world, renderer, seed, set, mode: st.mode, preview: !!preview };
}
function randomSeed() { const a = new Uint32Array(1); crypto.getRandomValues(a); return (a[0] % 999999999) + 1; }
function parseSeed(v) { v = String(v || '').trim(); if (!/^\d{1,10}$/.test(v)) return null; const n = Number(v); return n <= 4294967295 ? n : null; }

// ======================= audio =======================
async function audioCtx() {
  if (!st.audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; st.audioCtx = new AC({ sampleRate: 48000 }); }
  if (st.audioCtx.state === 'suspended') { try { await st.audioCtx.resume(); } catch (e) { } }
  return st.audioCtx;
}
function stopAudio() { if (st.player) { st.player.stopAll(); st.player = null; } }

// ======================= status helpers =======================
function setState(phase, label) {
  st.phase = phase; const b = $('stateBadge');
  b.className = 'badge-state ' + ({ live: 'live', encoding: 'enc', done: 'done', error: 'err', replay: 'live' }[phase] || '');
  b.textContent = label || { idle: 'READY', live: 'LIVE', encoding: 'ENCODING VIDEO', done: 'VIDEO READY', error: 'ERROR', replay: 'REPLAY' }[phase] || phase;
  refresh();
}
function status(text, kv, pct) {
  if (text != null) $('statusText').textContent = text;
  if (kv) $('statusKv').innerHTML = Object.entries(kv).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  if (pct != null) $('progBar').style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';
}
function msg(text, cls, target) { const el = document.createElement('div'); el.className = 'msg ' + (cls || ''); el.textContent = text; (target || $('statusMsgs')).appendChild(el); return el; }
function clearMsgs() { $('statusMsgs').innerHTML = ''; }

// ======================= live battle =======================
function liveRun(m, withAudio, label) {
  return new Promise((resolve, reject) => {
    const w = m.world;
    let t0 = performance.now(), T = 0, lastUi = 0;
    const planner = new A.Planner(); planner.intro();
    const player = withAudio ? st.player : null;
    if (player) { player.start(0); player.schedule(planner.items); }
    let music = false, intense = false, stopped = false, hushed = false;
    const cues = new A.V3Cues({ crowd: m.set.crowd, epic: m.set.epic, mvp: m.set.mvp });
    $('liveSeed').textContent = m.seed;
    const frame = (now) => {
      if (st.cancel) { cancelAnimationFrame(st.raf); reject(new Error('cancelled')); return; }
      try {
        T = (now - t0) / 1000;
        if (T - w.t > 0.2) { t0 += (T - w.t - 0.2) * 1000; T = w.t + 0.2; } // keep sim smooth if the machine lags
        E.advanceTo(w, T);
        const items = planner.feed(w);
        if (player) {
          player.schedule(items);
          if (!music && w.phase === 'battle') { music = true; player.music('calm', E.TL.battleStart); }
          if (!intense && w.final15 >= 0 && w.phase === 'battle') { intense = true; player.music('intense', w.final15); }
          if (!stopped && w.phase === 'ended') { stopped = true; player.stopMusic(w.endT + 0.25); }
          const ob = w.observer && w.observer.state;
          player.schedule(cues.feed(w, ob));
          if (!hushed && m.set.crowd && ob && ob.duel) { hushed = true; player.hush(ob.duel.t, true); }
        }
        m.renderer.render(sctx, T, stage.width, stage.height);
        if (now - lastUi > 100) {
          lastUi = now;
          $('liveA').textContent = w.teams[0].alive; $('liveB').textContent = w.teams[1].alive;
          $('liveTotal').textContent = w.teams[0].alive + w.teams[1].alive;
          const bt = w.phase === 'battle' ? w.battleT : w.phase === 'ended' ? w.endT - E.TL.battleStart : 0;
          $('liveTime').textContent = R.mmss(bt);
          status(null, { 'Status': label, 'Battle time': bt.toFixed(1) + ' s', 'Alive (A / B)': w.teams[0].alive + ' / ' + w.teams[1].alive, 'Total left': w.teams[0].alive + w.teams[1].alive, 'Seed': m.seed, 'Events': w.evCount, 'Active balls': w.proj.filter(p => p.on).length, ...(w.fb ? { 'Goals': w.fb.goals.join(' - '), 'Match ball': w.fb.ball.state.toLowerCase() } : {}), 'Particles': w.parts.length }, w.phase === 'ended' ? 100 : Math.min(99, (w.t / 50) * 100));
        }
        if (w.phase === 'ended' && T >= w.endT + w.outroLen) { resolve(); return; }
      } catch (e) { reject(e); return; }
      st.raf = requestAnimationFrame(frame);
    };
    st.raf = requestAnimationFrame(frame);
  });
}

function revokeCover() { for (const k of ['coverURL', 'coverSqURL']) if (st[k]) { URL.revokeObjectURL(st[k]); DIAG.urls.delete(st[k]); st[k] = null; } const cb = $('coverBox'); if (cb) cb.classList.add('hidden'); }
function cleanupPrevious(keepVideo) {
  if (!keepVideo) revokeCover();
  st.cancel = false;
  cancelAnimationFrame(st.raf);
  stopAudio();
  if (st.match) { try { st.match.renderer.dispose(); } catch (e) { } st.match = null; }
  if (!keepVideo && st.videoURL) {
    const v = $('resVideo'); v.pause(); v.removeAttribute('src'); v.load();
    URL.revokeObjectURL(st.videoURL); DIAG.urls.delete(st.videoURL); st.videoURL = null;
    $('btnDownload').removeAttribute('href');
  }
}

async function startBattle(seedOverride) {
  const v = validate(st.a, st.b, st.mode, st.mixed);
  if (!v.ok) { status(v.error); return; }
  if (st.phase === 'live' || st.phase === 'encoding') return;
  const set = settings();
  let seed = seedOverride != null ? seedOverride : parseSeed($('seed').value);
  if ($('seed').value.trim() && seed == null && seedOverride == null) { status('Seed must be a whole number between 0 and 4294967295.'); return; }
  if (seed == null) seed = randomSeed();
  cleanupPrevious(false);
  clearMsgs(); $('resultCard').classList.add('hidden'); $('videoBox').classList.add('hidden');
  if (st.caps) { const pl = X.plan(st.caps, set.res === '720' ? 720 : 1080, set.res === '720' ? 1280 : 1920, set.fps, set.sound); if (pl && pl.warn) msg(pl.warn, 'warn'); }
  st.lastSeed = seed; st.lastSettings = set; st.lastTeams = [st.a, st.b]; st.lastMode = st.mode;
  DIAG.matches++;
  let ctx = null;
  if (set.sound) { ctx = await audioCtx(); if (ctx) { const { bank, loops } = A.ensure(); st.player = new A.LivePlayer(ctx, bank, loops, { music: set.music, sfx: set.sfx }); } else msg('WebAudio is not available in this browser; sound disabled.', 'warn'); }
  const m = buildMatch(seed, set, false);
  st.match = m;
  setState('live');
  status('Live battle: ' + st.a.name + ' vs ' + st.b.name, null, 0);
  try {
    await liveRun(m, !!st.player, 'Live battle playing');
  } catch (e) {
    if (e && e.message === 'cancelled') return;
    console.error(e); setState('error'); msg('Live simulation error: ' + (e && e.message || e), 'bad'); return;
  }
  stopAudio();
  const live = m.world;
  DIAG.lastLive = { ruleset: live.fb ? 'fusion-v4' : 'classic', football: live.fb ? E.fbSummary(live) : null, seed, hash: live.hash >>> 0, winner: live.winner, endT: live.endT, events: live.evCount, start: [m.world.units.filter(u => u.side === 0).length, m.world.units.filter(u => u.side === 1).length] };
  showResult(m);
  makeCover(m);
  tourRecordFromLive(m);
  saveRecent(m);
  await exportVideo(m);
}

async function replay() {
  if (!st.lastTeams || st.phase === 'live' || st.phase === 'encoding') return;
  [st.a, st.b] = st.lastTeams; st.mode = st.lastMode;
  cancelAnimationFrame(st.raf); stopAudio();
  const set = st.lastSettings;
  if (set.sound) { const ctx = await audioCtx(); if (ctx) { const { bank, loops } = A.ensure(); st.player = new A.LivePlayer(ctx, bank, loops, { music: set.music, sfx: set.sfx }); } }
  const m = buildMatch(st.lastSeed, set, false);
  const prevPhase = st.videoURL ? 'done' : 'idle';
  setState('replay', 'REPLAY (seed ' + st.lastSeed + ')');
  status('Replaying the same battle (same seed → identical events).', null, 0);
  try { await liveRun(m, !!st.player, 'Replaying'); } catch (e) { if (e.message !== 'cancelled') msg('Replay error: ' + e.message, 'bad'); }
  stopAudio(); m.renderer.dispose();
  const same = st.match && (m.world.hash >>> 0) === (st.match.world.hash >>> 0);
  msg(same ? `Replay verified: event-log hash ${(m.world.hash >>> 0).toString(16)} matches the original battle.` : 'WARNING: replay hash differs!', same ? 'ok' : 'bad');
  setState(prevPhase === 'done' ? 'done' : 'idle');
}

// ======================= export =======================
function slug(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ß/g, 'ss').replace(/[øØ]/g, 'o').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'Team'; }
function fileName(m, W, H, ext, style) { const d = new Date(); const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); return `FootballWars_${slug(m.teams[0].name)}_vs_${slug(m.teams[1].name)}_${ds}_seed${m.seed}_${style === 'cinematic' ? 'Cinematic' : 'Original'}_${W}x${H}.${ext}`; }
function fallbackPaths(caps, W, H, fps, wantAudio) {
  const k = W + 'x' + H + '@' + fps, out = [];
  const first = X.plan(caps, W, H, fps, wantAudio); if (first) out.push(first);
  const add = (p) => { if (p && !out.some(o => o.path === p.path)) out.push(p); };
  if (caps.mrMp4) add({ path: 'mr-mp4', container: 'mp4', ext: 'mp4', mime: caps.mrMp4, label: 'MP4 (MediaRecorder, real-time)' });
  if (caps.vp[k]) add({ path: 'wc-webm', container: 'webm', ext: 'webm', mime: 'video/webm', video: caps.vp[k], audio: wantAudio ? caps.opus : null, label: 'WebM (VP9/VP8 + Opus)', warn: 'MP4 could not be produced; using WebM.' });
  if (caps.mrWebm) add({ path: 'mr-webm', container: 'webm', ext: 'webm', mime: caps.mrWebm, label: 'WebM (MediaRecorder, real-time)', warn: 'MP4 could not be produced; using WebM.' });
  return out;
}
async function exportVideo(m) {
  const set = m.set, W = set.res === '720' ? 720 : 1080, H = set.res === '720' ? 1280 : 1920, fps = set.fps;
  if (!st.caps) st.caps = await X.detect();
  const paths = fallbackPaths(st.caps, W, H, fps, set.sound);
  if (!paths.length) { setState('error'); msg('This browser cannot encode video (no WebCodecs or MediaRecorder). Please use an up-to-date Chrome or Edge.', 'bad'); return; }
  const live = m.world;
  const natural = live.endT + live.outroLen;
  // V2 Smart Video Director: edit plan = monotonic output-time -> battle-time map (never changes the battle)
  let plan;
  try { plan = D.buildPlan(live, live.observer && live.observer.state, { style: set.style, epicFinale: set.epic }); }
  catch (e) { console.error(e); plan = D.identityPlan(natural); msg('Smart Video Director failed (' + e.message + ') — exporting the Original full battle instead.', 'warn'); }
  m.plan = plan;
  const total = plan.outDur;
  // deterministic soundtrack mixed from the battle's own event timeline (re-timed onto the edit)
  let audio = null;
  if (set.sound) {
    status('Mixing the soundtrack…', null, 0);
    await new Promise(r => setTimeout(r, 10));
    const { bank, loops } = A.ensure(); const pl = new A.Planner(); pl.intro(); pl.feed(live);
    const ob = live.observer && live.observer.state;
    for (const it of new A.V3Cues({ crowd: set.crowd, epic: set.epic, mvp: set.mvp }).feed(live, ob)) pl.items.push(it);
    pl.items.sort((p, q) => p.t - q.t);
    audio = A.mixOffline(bank, loops, pl.items, live, total, { music: set.music, sfx: set.sfx, hush: A.hushWindow(live, ob, set.crowd) }, plan.identity ? null : { toOut: plan.toOut });
  }
  setState('encoding');
  let out = null, used = null, lastErr = null, ew = null;
  for (const p of paths) {
    if (p.warn && p !== paths[0]) msg(p.warn, 'warn');
    ew = E.createWorld(m.opts);
    ew.observer = D.createObserver(obsOpts(set));
    const er = R.createRenderer({ ...m.rOpts, world: ew, toOut: plan.toOut });
    const t0 = performance.now();
    status('Creating video: ' + p.label, { 'Format': p.label, 'Resolution': W + '×' + H, 'FPS': fps, 'Duration': total.toFixed(2) + ' s', 'Frame': '0 / ' + Math.ceil(total * fps) }, 0);
    let lastPrev = 0;
    try {
      DIAG.encoderOpen++;
      out = await X.run({
        plan: p, width: W, height: H, fps, duration: total, audio, audioCtx: st.audioCtx,
        isCancelled: () => st.cancel,
        draw: (ctx, outT, w2, h2) => { const simT = plan.map(outT); E.advanceTo(ew, simT); er.render(ctx, simT, w2, h2, outT); },
        onProgress: (o) => {
          const pct = o.total ? (o.frame / o.total) * 100 : 0;
          const kv = { 'Format': p.label, 'Resolution': W + '×' + H + ' @ ' + fps + ' FPS', 'Frame': o.frame + ' / ' + o.total, 'Frames left': Math.max(0, o.total - o.frame), 'Time left (est.)': o.eta != null ? o.eta.toFixed(1) + ' s' : '—', 'Encode speed': o.fpsEnc ? o.fpsEnc.toFixed(1) + ' fps' : (o.phase === 'realtime' ? 'real-time' : '—'), 'Elapsed': ((performance.now() - t0) / 1000).toFixed(1) + ' s' };
          status(o.phase === 'audio' ? 'Encoding audio…' : 'Encoding video… ' + pct.toFixed(0) + '%', kv, pct);
          const now = performance.now();
          if (o.canvas && now - lastPrev > 250) { lastPrev = now; sctx.imageSmoothingEnabled = false; sctx.drawImage(o.canvas, 0, 0, stage.width, stage.height); }
        }
      });
      used = p; DIAG.encoderOpen--; er.dispose(); break;
    } catch (e) {
      DIAG.encoderOpen--; er.dispose(); lastErr = e; console.error(e);
      if (st.cancel) return;
      msg('Encoding path failed (' + p.label + '): ' + (e && e.message || e) + ' — trying the next method.', 'warn');
    }
  }
  if (!out) { setState('error'); msg('Could not create the video: ' + (lastErr && lastErr.message || lastErr), 'bad'); return; }
  // verification: the exported battle must be the one that was watched
  const same = (ew.hash >>> 0) === (live.hash >>> 0) && ew.winner === live.winner && Math.abs(ew.endT - live.endT) < 1e-9 && ew.teams[ew.winner].alive === live.teams[live.winner].alive;
  const alertsSame = JSON.stringify(ew.observer.state.alerts) === JSON.stringify(live.observer.state.alerts);
  if (!out.blob || out.blob.size === 0) { setState('error'); msg('The encoder produced an empty file — download disabled.', 'bad'); return; }
  const sn = await X.sniff(out.blob);
  let tracks = {};
  if (sn.container === 'mp4') tracks = await X.mp4Tracks(out.blob);
  if (sn.container !== used.container) { setState('error'); msg('Container check failed (' + sn.container + ' ≠ ' + used.container + ').', 'bad'); return; }
  const url = URL.createObjectURL(out.blob); DIAG.urls.add(url); st.videoURL = url;
  const fn = fileName(m, W, H, used.ext, plan.style);
  const a = $('btnDownload'); a.href = url; a.download = fn; a.textContent = 'DOWNLOAD VIDEO (' + used.ext.toUpperCase() + ', ' + (out.blob.size / 1048576).toFixed(1) + ' MB)';
  const v = $('resVideo'); v.src = url; v.load();
  $('videoBox').classList.remove('hidden');
  DIAG.exports++;
  DIAG.lastExport = { path: used.path, size: out.blob.size, mime: out.blob.type, container: sn.container, tracks, verified: same, alertsSame, frames: out.frames, seconds: out.seconds, fileName: fn, style: plan.style, natural, edited: total, endOut: plan.toOut(live.endT), goalsOut: live.fb ? live.events.filter(e => e.type === E.EV.GOAL).map(e => +plan.toOut(e.t).toFixed(3)) : [], football: live.fb ? E.fbSummary(live) : null, exportGoals: ew.fb ? ew.fb.goals.slice() : null, battle: live.endT - E.TL.battleStart, highlights: plan.highlights, alerts: live.observer.state.alerts.map(a => a.type), segments: plan.segments };
  const codecTxt = used.container === 'mp4' ? `MP4 • video ${out.videoCodec}${tracks.avc1 ? ' (H.264/avcC ✓)' : ''} • audio ${out.audioCodec ? out.audioCodec + (tracks.mp4a ? ' (AAC ✓)' : tracks.opus ? ' (Opus ✓)' : '') : 'none'}` : `WebM • ${out.videoCodec}${out.audioCodec ? ' + ' + out.audioCodec : ''}`;
  $('videoInfo').innerHTML = `${esc(fn)}<br>${esc(codecTxt)} • ${W}×${H} • ${fps} FPS • ${(out.blob.size / 1048576).toFixed(2)} MB • ${out.frames} frames • encoded in ${out.seconds ? out.seconds.toFixed(1) + ' s' : ''}`;
  v.onloadedmetadata = () => {
    const d = v.duration;
    const okD = isFinite(d) && Math.abs(d - total) < 0.6;
    msg(isFinite(d) ? `Preview loaded: duration ${d.toFixed(2)} s (expected ${total.toFixed(2)} s) ${okD ? '✓' : '— duration mismatch'}` : 'Preview loaded (the browser did not report a duration; normal for recorded WebM).', okD || !isFinite(d) ? 'ok' : 'warn');
    DIAG.lastExport.previewDuration = d;
    const rd = $('editInfo'); if (rd) rd.innerHTML = editSummary(live, plan, d);
  };
  v.onerror = () => { msg('The in-browser preview could not play this file (codec support). It can still be downloaded: ' + codecTxt, 'warn'); };
  msg(same ? `Verified: the video is exactly the battle you watched (seed ${m.seed}, event hash ${(live.hash >>> 0).toString(16)}, same winner and end tick).` : 'WARNING: the video simulation differs from the live battle!', same ? 'ok' : 'bad');
  if (set.sound && !out.audioCodec) msg('No audio encoder found; the video is silent.', 'warn');
  $('editInfo').innerHTML = editSummary(live, plan, null);
  if (set.style === 'cinematic' && plan.identity) msg('Cinematic Short: ' + (plan.note || 'no quiet stretch to speed up') + ' — exported at normal speed (honest full length).', 'warn');
  if (used.audio && used.audio.codec === 'opus' && used.container === 'mp4') msg('No AAC encoder in this browser; audio was encoded as Opus inside the MP4 (plays in Chrome/Edge/VLC/YouTube/TikTok; some older players may not support Opus-in-MP4).', 'warn');
  status('Video ready ✓', { 'File': fn, 'Style': plan.style === 'cinematic' && !plan.identity ? 'Cinematic Short (' + total.toFixed(1) + ' s from ' + natural.toFixed(1) + ' s)' : 'Original full battle', 'Format': codecTxt, 'Size': (out.blob.size / 1048576).toFixed(2) + ' MB', 'Duration': total.toFixed(2) + ' s', 'Frames': out.frames, 'Encode time': out.seconds ? out.seconds.toFixed(1) + ' s' : '—', 'Verification': same ? 'live = video ✓' : 'DIFFERENT ✗' }, 100);
  setState('done');
}

function editSummary(live, plan, recorded) {
  const battle = live.endT - E.TL.battleStart, natural = live.endT + live.outroLen;
  const al = live.observer ? live.observer.state.alerts.length : 0;
  const parts = [`Real battle <b>${battle.toFixed(1)} s</b>`, `full-length video ${natural.toFixed(1)} s`,
    plan.identity ? `export: <b>Original</b> ${plan.outDur.toFixed(1)} s` : `<b>Cinematic edit ${plan.outDur.toFixed(1)} s</b>`,
    recorded != null && isFinite(recorded) ? `recorded file ${recorded.toFixed(2)} s` : null,
    plan.identity ? null : `${plan.highlights} highlights at 1.0x`, `${al} story alert${al === 1 ? '' : 's'}`].filter(Boolean);
  return parts.join(' • ');
}

// ======================= V3: kit preview, cover studio =======================
function drawKitPreview(m) {
  const c = $('kitPrev'); if (!c) return; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
  const roles = [0, 3, 4, 6]; // striker, defender, goalkeeper, captain
  for (let s = 0; s < 2; s++) roles.forEach((ri, k) => { const row = S.rowIndex(ri, k % S.VARIANTS, false, s === 1); g.drawImage(m.atlases[s].canvas, 0, row * S.CH, S.CW, S.CH, s * 150 + k * 36, 0, 40, 40); });
  $('kitNote').textContent = `${m.teams[0].name} vs ${m.teams[1].name}${m.kits[1].away ? ' — alternate kit used for readability' : ''}${m.rOpts.hc ? ' • high-contrast rings' : ''}`;
}
function fileBase(m) { const d = new Date(); const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); return `FootballWars_${slug(m.teams[0].name)}_vs_${slug(m.teams[1].name)}_${ds}_seed${m.seed}`; }
function coverBlob(m, square) {
  return new Promise((res, rej) => { try { const cv = window.FWCoverV3.cover(m, { type: m.set.cover, lang: m.set.lang, square }); cv.toBlob(b => { const dims = [cv.width, cv.height]; cv.width = cv.height = 1; b ? res({ b, dims }) : rej(new Error('PNG encoding failed')); }, 'image/png'); } catch (e) { rej(e); } });
}
async function makeCover(m) {
  revokeCover();
  try {
    const { b, dims } = await coverBlob(m, false);
    const u = URL.createObjectURL(b); st.coverURL = u; DIAG.urls.add(u);
    $('coverImg').src = u; const a = $('btnCover'); a.href = u; a.download = fileBase(m) + '_Cover_' + dims[0] + 'x' + dims[1] + '.png';
    $('coverInfo').textContent = `${dims[0]}×${dims[1]} PNG • ${(b.size / 1024).toFixed(0)} KB • ${m.set.cover === 'reveal' ? 'WINNER REVEAL' : 'NO SPOILERS'}`;
    $('coverBox').classList.remove('hidden');
    DIAG.lastCover = { w: dims[0], h: dims[1], size: b.size, type: m.set.cover, name: a.download };
  } catch (e) { msg('Cover could not be created (' + e.message + '); the video is not affected.', 'warn'); }
}
async function squareCover() {
  const m = st.match; if (!m) return;
  try { const { b, dims } = await coverBlob(m, true); if (st.coverSqURL) { URL.revokeObjectURL(st.coverSqURL); DIAG.urls.delete(st.coverSqURL); } const u = URL.createObjectURL(b); st.coverSqURL = u; DIAG.urls.add(u);
    const a = document.createElement('a'); a.href = u; a.download = fileBase(m) + '_SquareCover_' + dims[0] + 'x' + dims[1] + '.png'; document.body.appendChild(a); a.click(); a.remove(); DIAG.lastSquare = { w: dims[0], h: dims[1], size: b.size };
  } catch (e) { msg('Square cover failed: ' + e.message, 'warn'); }
}

// ======================= V3: Tournament Studio =======================
const TV = window.FWTournamentV3, TKEY = 'fw_tournament_v3';
let tour = null, tourDraft = { manual: [] };
function tourLegacy(t) { if (t && !t.ruleset) t.ruleset = 'classic'; return t; } // V3 brackets: no ruleset field -> classic, results untouched
function tourOpts(T) { return T.ruleset === 'fusion' ? { ruleset: 'fusion', fbIntensity: T.fbIntensity || 'normal', goalAdv: T.goalAdv !== false } : { ruleset: 'classic' }; }
function tourLoad() { try { const t = JSON.parse(localStorage.getItem(TKEY) || 'null'); if (t) { TV.validateTournament(t, DB); tour = tourLegacy(t); } } catch (e) { tour = null; } }
function tourSave() { try { localStorage.setItem(TKEY, JSON.stringify(tour)); return true; } catch (e) { msg('Tournament could not be saved in this browser: ' + e.message, 'warn'); return false; } }
function tname(id) { const t = BY_ID.get(id); return t ? t.name : '—'; }
function tourResultFrom(w, how) { return { ruleset: w.fb ? 'fusion-v4' : 'classic', goals: w.fb ? w.fb.goals.slice() : null, winnerId: (w.winner === 0 ? w.teams[0] : w.teams[1]).team.id, winSide: w.winner, survivors: w.teams[w.winner].alive, alive: [w.teams[0].alive, w.teams[1].alive], hash: (w.hash >>> 0).toString(16), endT: +w.endT.toFixed(3), battle: +(w.endT - E.TL.battleStart).toFixed(2), events: w.evCount, how }; }
function tourSimulate(ri, i) {
  const mt = tour.rounds[ri][i]; if (mt.res || !mt.a || !mt.b) return;
  const w = E.simulate(Object.assign({ seed: mt.seed, teamA: BY_ID.get(mt.a), teamB: BY_ID.get(mt.b), cfg: CFG, duration: tour.duration, fxLevel: 1 }, tourOpts(tour))); // same engine + ruleset, from scratch
  TV.record(tour, ri, i, tourResultFrom(w, 'simulated')); tourSave(); renderTour();
}
function tourPlay(ri, i) {
  const mt = tour.rounds[ri][i]; if (!mt.a || !mt.b || st.phase === 'live' || st.phase === 'encoding') return;
  st.tourCtx = { ri, i, a: mt.a, b: mt.b, seed: mt.seed, duration: tour.duration };
  const A2 = BY_ID.get(mt.a), B2 = BY_ID.get(mt.b);
  $('mode').value = 'custom_exhibition'; st.mode = 'custom_exhibition'; fillLeague();
  if (A2.type !== B2.type) { st.mixed = true; $('mixed').checked = true; }
  st.a = null; st.b = null; choose('A', A2); choose('B', B2);
  setRadio('dur', tour.duration); $('seed').value = mt.seed;
  { const to = tourOpts(tour); setRadio('ruleset', to.ruleset); if (to.fbIntensity) setRadio('fbint', to.fbIntensity); if (to.ruleset === 'fusion') $('optGoalAdv').checked = to.goalAdv; syncRuleset(); }
  $('modalTour').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' });
  startBattle(mt.seed);
}
function tourRecordFromLive(m) {
  const c = st.tourCtx; if (!c || !tour) return; st.tourCtx = null;
  const mt = tour.rounds[c.ri] && tour.rounds[c.ri][c.i];
  if (!mt || mt.res) { msg('Tournament: this match already had a result — replay shown, bracket unchanged.', 'ok'); return; }
  const to = tourOpts(tour), mo = m.opts;
  if (m.teams[0].id !== c.a || m.teams[1].id !== c.b || m.seed !== c.seed || m.set.duration !== c.duration || mo.ruleset !== to.ruleset || (to.ruleset === 'fusion' && (mo.fbIntensity !== to.fbIntensity || mo.goalAdv !== to.goalAdv))) { msg('Tournament: teams/seed/length differ from the bracket match — result NOT recorded.', 'warn'); return; }
  TV.record(tour, c.ri, c.i, tourResultFrom(m.world, 'played + video')); tourSave();
  msg(`Tournament updated: ${tname(mt.res.winnerId)} advances (${TV.roundName(tour, c.ri)}).`, 'ok');
}
function tourView(ri, i) {
  const mt = tour.rounds[ri][i], r = mt.res; if (!r) return;
  $('tourDetail').innerHTML = `<div class="msg ok"><b>${esc(TV.roundName(tour, ri))}:</b> ${esc(tname(mt.a))} vs ${esc(tname(mt.b))} — winner <b>${esc(tname(r.winnerId))}</b> with ${r.survivors} survivors${r.goals ? ' • goals ' + r.goals[0] + '-' + r.goals[1] : ''} (alive ${r.alive[0]}–${r.alive[1]}) • battle ${r.battle} s • seed ${mt.seed} • event hash ${esc(r.hash)} • ${r.events} events • ${esc(r.how)}
    <div class="row" style="margin-top:6px"><button class="btn small" data-treplay="${ri}:${i}">Replay this match + video (same seed)</button><span></span></div></div>`;
}
function renderTour() {
  const box = $('tourBody'); if (!box) return;
  if (!tour) { box.innerHTML = tourSetupHtml(); tourSetupWire(); return; }
  const cols = tour.rounds.map((row, ri) => `<div class="tround"><div class="trh">${esc(TV.roundName(tour, ri))}</div>${row.map((mt, i) => {
    const line = id => { if (!id) return '<div class="tteam tbd">TBD</div>'; const t = BY_ID.get(id), won = mt.res && mt.res.winnerId === id; return `<div class="tteam${won ? ' won' : mt.res ? ' lost' : ''}"><img src="${logoSet(t).thumb}" alt=""><span>${esc(t.name)}</span><b>${mt.res ? (won ? mt.res.survivors : 0) : ''}</b></div>`; };
    const acts = mt.res ? `<button class="btn small" data-tview="${ri}:${i}">VIEW RESULT</button>` : (mt.a && mt.b ? `<button class="btn small" data-tplay="${ri}:${i}">PLAY &amp; CREATE VIDEO</button><button class="btn small ghost" data-tsim="${ri}:${i}">SIMULATE RESULT</button>` : '');
    return `<div class="tmatch">${line(mt.a)}${line(mt.b)}<div class="tseed">seed ${mt.seed}</div><div class="tacts">${acts}</div></div>`; }).join('')}</div>`).join('');
  const champ = tour.champion ? `<div class="msg ok">🏆 CHAMPION: <b>${esc(tname(tour.champion))}</b></div>` : '';
  box.innerHTML = `<div class="note warn"><b>Fantasy simulation bracket</b> — not an official competition; no real fixtures are implied.</div>
    <div class="row" style="margin:8px 0"><div><b>${esc(tour.name)}</b> • ${tour.size} teams • seed ${tour.seed} • battle length: ${esc(tour.duration)} • ruleset: <b>${esc(rulesetLabel(tourOpts(tour)))}</b></div></div>
    ${champ}<div class="bracket">${cols}</div><div id="tourDetail"></div>
    <div class="btns"><button class="btn" id="tPng">DOWNLOAD BRACKET PNG</button><button class="btn" id="tJson">EXPORT JSON</button><button class="btn" id="tImport">IMPORT JSON</button><button class="btn" id="tNew">NEW TOURNAMENT</button></div>`;
  $('tPng').onclick = () => { const cv = TV.bracketPng(tour, id => BY_ID.get(id), logoSet, settings().lang); cv.toBlob(b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'FootballWars_Bracket_' + slug(tour.name) + '_seed' + tour.seed + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); DIAG.lastBracket = { w: cv.width, h: cv.height, size: b.size }; cv.width = cv.height = 1; }, 'image/png'); };
  $('tJson').onclick = () => { const b = new Blob([JSON.stringify(tour, null, 1)], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'FootballWars_Tournament_seed' + tour.seed + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); };
  $('tImport').onclick = () => { $('tourFile').value = ''; $('tourFile').click(); };
  $('tNew').onclick = () => { if (confirm('Start a new tournament? The current bracket will be replaced (export it first if you want to keep it).')) { tour = null; try { localStorage.removeItem(TKEY); } catch (e) { } renderTour(); } };
}
function tourSetupHtml() {
  const lgs = DB.leagues.map(l => `<option value="${l.id}">${esc(l.name)} (${l.club_count})</option>`).join('');
  return `<div class="note warn"><b>Fantasy simulation bracket</b> — teams are drawn by seed; this is not an official UEFA/FIFA competition.</div>
  <div class="opts"><div><label class="f">Name</label><input type="text" id="tName" value="Fantasy Cup" maxlength="40"></div>
  <div><label class="f">Teams</label><select id="tSize"><option value="8">8</option><option value="16" selected>16</option><option value="32">32</option></select></div>
  <div><label class="f">Source</label><select id="tSrc"><option value="league">One league (random draw)</option><option value="clubs">European clubs mix</option><option value="national">National teams</option><option value="manual">Pick teams manually</option></select></div>
  <div id="tLgWrap"><label class="f">League</label><select id="tLg">${lgs}</select></div>
  <div><label class="f">Tournament seed</label><div class="row"><input type="text" id="tSeed" inputmode="numeric" value="${randomSeed()}"><button class="btn small" id="tSeedRnd">Random</button></div></div>
  <div><label class="f">Ruleset (fixed for the whole bracket)</label><select id="tRs"><option value="fusion">Football Fusion</option><option value="classic">Classic Battle (V3)</option></select></div>
  <div><label class="f">Battle length</label><select id="tDur"><option value="short">Short</option><option value="standard" selected>Standard</option><option value="long">Long</option></select></div></div>
  <div id="tManual" class="hidden"><label class="f">Add teams (<span id="tCount">0</span> selected)</label><input type="text" id="tSearch" placeholder="Search a team to add…"><div id="tRes" class="tres"></div><div id="tChips" class="tags"></div>
  <label class="toggle"><input type="checkbox" id="tMixed"> I confirm mixing clubs and national teams (different rating systems)</label></div>
  <div id="tErr"></div><div style="margin-top:10px"><button class="btn primary" id="tCreate">CREATE BRACKET</button></div>`;
}
function tourSetupWire() {
  const upd = () => { const src = $('tSrc').value; $('tLgWrap').classList.toggle('hidden', src !== 'league'); $('tManual').classList.toggle('hidden', src !== 'manual'); $('tCount').textContent = tourDraft.manual.length; $('tChips').innerHTML = tourDraft.manual.map(id => `<span class="tag">${esc(tname(id))} <a href="#" data-trm="${id}">✕</a></span>`).join(''); };
  $('tSrc').onchange = upd; upd();
  $('tSeedRnd').onclick = () => { $('tSeed').value = randomSeed(); };
  $('tSearch').oninput = () => { const q = $('tSearch').value; $('tRes').innerHTML = q ? search(q, {}).slice(0, 8).map(t => `<div class="res${tourDraft.manual.includes(t.id) ? ' dis' : ''}" data-tadd="${t.id}"><img src="${logoSet(t).thumb}" alt=""><div><div class="nm">${esc(t.name)}</div><div class="lg">${esc(leagueName(t))}</div></div><span class="pw">${t.battle_profile.power_index}</span></div>`).join('') : ''; };
  $('tourBody').onclick = (e) => {
    const ad = e.target.closest('[data-tadd]'); if (ad) { const id = ad.dataset.tadd; if (tourDraft.manual.includes(id)) $('tErr').innerHTML = '<div class="msg warn">Already added — each team can appear only once.</div>'; else { tourDraft.manual.push(id); $('tErr').innerHTML = ''; } $('tSearch').value = ''; $('tRes').innerHTML = ''; upd(); }
    const rm = e.target.closest('[data-trm]'); if (rm) { e.preventDefault(); tourDraft.manual = tourDraft.manual.filter(x => x !== rm.dataset.trm); upd(); }
  };
  $('tCreate').onclick = () => {
    try {
      const sd = parseSeed($('tSeed').value); if (sd == null) throw new Error('Tournament seed must be a whole number.');
      const spec = { name: $('tName').value.trim() || 'Fantasy Cup', size: +$('tSize').value, seed: sd, source: { kind: $('tSrc').value, league: $('tLg').value }, manual: tourDraft.manual, mixed: $('tMixed').checked, duration: $('tDur').value, ruleset: $('tRs').value, fbIntensity: settings().fbInt, goalAdv: settings().goalAdv, created: new Date().toISOString().slice(0, 16) };
      tour = TV.createTournament(spec, DB); tourSave(); tourDraft = { manual: [] }; renderTour();
    } catch (e) { $('tErr').innerHTML = `<div class="msg bad">${esc(e.message)}</div>`; }
  };
}
function openTour() { if (!tour) tourLoad(); renderTour(); $('modalTour').classList.add('open'); }

// ======================= results =======================
function showResult(m) {
  const w = m.world, win = w.winner, T = m.teams[win], L = logoSet(T), lose = m.teams[1 - win];
  $('resultCard').classList.remove('hidden');
  $('resLogo').src = L.thumb;
  $('resName').textContent = T.name;
  $('resSub').textContent = `${w.teams[win].alive} survivors • ${R.mmss(w.endT - E.TL.battleStart)} • beat ${lose.name}`;
  const rows = E.ROLES.map(r => `<tr><td>${E.ROLE_NAMES[r].en}</td><td>${w.teams[0].elimByRole[r]}</td><td>${w.teams[1].elimByRole[r]}</td></tr>`).join('');
  $('resRoles').innerHTML = `<tr><th>Eliminations by role</th><th>${esc(S.shortName(m.teams[0], 60))}</th><th>${esc(S.shortName(m.teams[1], 60))}</th></tr>${rows}<tr><th>Total</th><th>${w.teams[0].kills}</th><th>${w.teams[1].kills}</th></tr>`;
  const MV = window.FWStatsV3.mvp(w); const mvTxt = r => r ? `${m.teams[r.side].name} #${r.no} ${E.ROLE_NAMES[r.role].en} — ${r.kills} KOs, ${r.assists} assists, ${r.saves} saves (score ${r.score})` : '—';
  const topRole = s => E.ROLES.slice().sort((a, b) => w.teams[s].elimByRole[b] - w.teams[s].elimByRole[a])[0];
  const RULES = { HUNT: 'Hunt mode (few players / long battle: global targeting)', ZONE: 'Shrinking tactical zone', STORM: 'Overtime storm (rising damage, healthiest side survives)', SUDDEN_DEATH: 'Sudden death (double elimination on the same tick)', TIEBREAK_HP: 'Time cap: remaining health ratio', TIEBREAK_COIN: 'Exact tie: seeded coin flip', ADAPT: 'Losing-streak adaptation (config: streak_adaptation)' };
  const used = s => Object.entries(w.teams[s].specialsUsed).map(([k, v]) => ((E.SPECIAL_NAMES[k] || {}).en || k) + ' ×' + v).join(', ') || '—';
  $('resKv').innerHTML = [
    ['Seed', m.seed], ['Winner', T.name + ' (' + w.teams[win].alive + ' survivors)'], ['Battle time', (w.endT - E.TL.battleStart).toFixed(2) + ' s'], ['Video length', (w.endT + w.outroLen).toFixed(2) + ' s (intro 2.2 + battle + outro ' + w.outroLen.toFixed(1) + ')'],
    ['Top eliminating role', `A: ${E.ROLE_NAMES[topRole(0)].en} • B: ${E.ROLE_NAMES[topRole(1)].en}`], ['Ruleset', rulesetLabel(m.opts)],
    ...(w.fb ? (() => { const f = E.fbSummary(w); const n0 = m.teams[0].name, n1 = m.teams[1].name; return [['Goals', `${n0} ${f.goals[0]} – ${f.goals[1]} ${n1} (winner decided by survivors, not goals)`], ['Shots (on target)', `${f.shots[0]} (${f.onTarget[0]}) – ${f.shots[1]} (${f.onTarget[1]})`], ['Keeper saves', `${f.saves[0]} – ${f.saves[1]}`], ['Completed passes', `${f.passes[0]}/${f.passAtt[0]} – ${f.passes[1]}/${f.passAtt[1]}`], ['Interceptions / tackles won', `${f.intercepts[0]}/${f.steals[0]} – ${f.intercepts[1]}/${f.steals[1]}`], ['Possession %', `${f.possession[0]}% – ${f.possession[1]}% (real ball-control time)`], ['Posts / wide', `${f.posts[0] + f.posts[1]} / ${f.wide[0] + f.wide[1]}`]]; })() : []),
    ['Battle MVP', mvTxt(MV.overall)], ['Winning-team MVP', mvTxt(MV.winnerMvp)], ['MVP formula', '3×KOs + 1×assists + 2×saves (real event counts; ties → KOs, assists, saves, survived, lower #)'],
    ['Specials used A', used(0)], ['Specials used B', used(1)], ['Form (A / B)', w.teams[0].form.toFixed(3) + ' / ' + w.teams[1].form.toFixed(3)],
    ['Rules applied', w.rules.map(r => RULES[r] || r).join(' • ') || 'None (natural finish)'], ['Events / hash', w.evCount + ' / ' + (w.hash >>> 0).toString(16)]
  ].map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
}
function saveRecent(m) {
  try {
    const w = m.world; const list = JSON.parse(localStorage.getItem('fw_recent') || '[]');
    list.unshift({ d: new Date().toISOString().slice(0, 16).replace('T', ' '), a: m.teams[0].id, b: m.teams[1].id, w: w.winner, s: w.teams[w.winner].alive, seed: m.seed, t: +(w.endT - E.TL.battleStart).toFixed(1), mode: m.mode, dur: m.set.duration, rs: m.opts.ruleset, fbi: m.opts.fbIntensity, ga: m.opts.goalAdv, g: w.fb ? w.fb.goals.slice() : null });
    localStorage.setItem('fw_recent', JSON.stringify(list.slice(0, 5)));
  } catch (e) { }
  renderRecent();
}
function renderRecent() {
  let list = []; try { list = JSON.parse(localStorage.getItem('fw_recent') || '[]'); } catch (e) { }
  $('recent').innerHTML = list.length ? list.map((r, i) => {
    const a = BY_ID.get(r.a), b = BY_ID.get(r.b); if (!a || !b) return '';
    const wn = r.w === 0 ? a : b;
    return `<li><div><b>${esc(a.name)}</b> vs <b>${esc(b.name)}</b><br><span>${esc(r.d)} • winner ${esc(wn.name)} (${r.s})${r.g ? ' • goals ' + r.g[0] + '-' + r.g[1] : ''} • ${r.t} s • ${r.rs === 'fusion' ? 'Fusion' : 'Classic'} • seed ${r.seed}</span></div><button class="btn small" data-load="${i}">Load</button></li>`;
  }).join('') : '<li><span>No battles yet.</span></li>';
}
function loadRecent(i) {
  let list = []; try { list = JSON.parse(localStorage.getItem('fw_recent') || '[]'); } catch (e) { }
  const r = list[i]; if (!r || st.phase === 'live' || st.phase === 'encoding') return;
  st.mode = r.mode || 'custom_exhibition'; $('mode').value = st.mode;
  if (st.mode === 'domestic_league') st.league = BY_ID.get(r.a).league_id;
  if (st.mode === 'custom_exhibition' && BY_ID.get(r.a).type !== BY_ID.get(r.b).type) { st.mixed = true; $('mixed').checked = true; }
  fillLeague();
  choose('A', BY_ID.get(r.a)); choose('B', BY_ID.get(r.b));
  $('seed').value = r.seed; if (r.dur) setRadio('dur', r.dur);
  setRadio('ruleset', r.rs || 'classic'); if (r.fbi) setRadio('fbint', r.fbi); $('optGoalAdv').checked = r.ga !== false; syncRuleset();
  status('Saved battle loaded: starting with the same seed + teams + duration setting reproduces the same battle.');
}

// ======================= logo upload =======================
let uploadFor = null;
function onUpload(file) {
  if (!file || !uploadFor) return;
  const id = uploadFor; uploadFor = null;
  if (file.size > 5 * 1024 * 1024) { alert('File too large (max 5 MB).'); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas'); const k = Math.min(1, 160 / Math.max(img.naturalWidth || 160, img.naturalHeight || 160));
      c.width = Math.max(1, Math.round((img.naturalWidth || 160) * k)); c.height = Math.max(1, Math.round((img.naturalHeight || 160) * k));
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/png'); // throws if the image would taint the export canvas
      const im2 = new Image(); im2.onload = () => {
        if (!canvasSafe(im2)) { alert('This image cannot be used safely on the video canvas (CORS/taint).'); return; }
        userLogos.set(id, im2); logoCache.delete(id);
        try { localStorage.setItem('fw_logo:' + id, data); } catch (e) { msg('The logo will be used in this session; browser storage is full so it could not be saved permanently.', 'warn'); }
        if (st.a && st.a.id === id) renderCard('A'); if (st.b && st.b.id === id) renderCard('B'); refresh();
      }; im2.src = data;
    } catch (e) { alert('Logo could not be used: ' + e.message); }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { URL.revokeObjectURL(url); alert('Could not read the image.'); };
  img.src = url;
}

// ======================= modals =======================
function openAbout() {
  const flags = Object.entries(FLAGS).map(([id, f]) => `<div>${esc((BY_ID.get(id) || {}).name || id)} — <a href="${esc(f.page)}" target="_blank" rel="noopener">${esc(f.file)}</a></div>`).join('');
  const simple = Object.keys(S.SIMPLE_FLAGS).filter(id => !FLAGS[id]).map(id => esc((BY_ID.get(id) || {}).name || id)).join(', ');
  $('aboutBox').innerHTML = `<button class="btn small close" data-close>Close</button><h3>About / Licenses</h3>
  <p>FOOTBALL WARS is an independent, non-commercial fan/entertainment tool. It is not affiliated with, sponsored or endorsed by any club, national federation, league, UEFA or FIFA. Club and competition names are used descriptively only; all trademarks belong to their owners. No real player names or likenesses are used.</p>
  <h4>Data sources (embedded database, ${esc(DB.metadata.compiled_date)})</h4>
  <ul><li>Club Elo: <b>beyondELO (https://beyondelo.com)</b>, license <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> — snapshot of 12 Nov 2026.</li>
  <li>Club lists: FootballSquads (https://www.footballsquads.co.uk), 2026–27.</li>
  <li>National teams: FIFA men’s world ranking, 7 Oct 2026 (https://inside.fifa.com/fifa-rankings/world-ranking/men).</li>
  <li>Battle attributes (attack, defense, speed…) are not real statistics; they are game-design values derived from Elo/FIFA points. Club Elo and FIFA points are never put on the same scale; battles use only the game <i>power_index</i> with a soft 18% advantage cap.</li></ul>
  <h4>Logos and crests</h4>
  <p><b>Official club crests are not included.</b> Club crests are usually protected by copyright/trademark, and their licenses could not be verified at build time because the Wikimedia Commons API was rate-limited (HTTP 429). All 194 clubs therefore use <b>PLACEHOLDER</b> crests generated from team colours and initials; these are not official logos. You can add your own licensed logo with “Upload logo” on a team card (stored only in this browser, never uploaded anywhere).</p>
  <p><b>National teams:</b> for ${Object.keys(FLAGS).length} countries the <b>national flag</b> (not the federation crest) was downloaded from Wikimedia Commons at build time and embedded as a small PNG. National flags are state symbols and are generally published on Commons as public domain; the exact license tag of each file is on the file page linked below. For ${simple}, which could not be downloaded because of the rate limit, a simple geometric flag drawing is generated locally. Northern Ireland has no official national flag, so a placeholder crest is used.</p>
  <div class="flaglist">${flags}</div>
  <h4>Sound and music</h4><p>All sound effects and the chiptune music are synthesized in code inside this file (original). No anthems, club songs or unlicensed music files are used.</p>
  <h4>Graphics</h4><p>Pixel players, pitch, font and effects are generated procedurally at runtime (original).</p>
  <h4>Software</h4><p>Embedded open-source libraries: <b>mp4-muxer 5.2.2</b> and <b>webm-muxer 5.1.4</b> (Vanilagy), MIT license.</p>
  <pre>${esc(LIC.mp4 || '')}</pre><pre>${esc(LIC.webm || '')}</pre>`;
  $('modalAbout').classList.add('open');
}
async function openDiag() {
  const checks = dataChecks();
  const caps = st.caps || await X.detect(); st.caps = caps;
  const flagN = Object.keys(FLAGS).length, simpleN = Object.keys(S.SIMPLE_FLAGS).filter(id => !FLAGS[id]).length;
  const capRows = Object.keys(caps.h264).map(k => `<tr><td>${k}</td><td>${caps.h264[k] ? '<span class="pass">' + caps.h264[k].codec + '</span>' : '<span class="fail">none</span>'}</td><td>${caps.vp[k] ? caps.vp[k].codec : 'none'}</td></tr>`).join('');
  const L = DIAG.lastLive, X2 = DIAG.lastExport;
  $('diagBox').innerHTML = `<button class="btn small close" data-close>Close</button><h3>Developer diagnostics</h3>
  <h4>Database (embedded)</h4><table>${checks.map(c => `<tr><td>${esc(c.k)}</td><td>${esc(c.v)}</td><td class="${c.ok ? 'pass' : 'fail'}">${c.ok ? 'PASS' : 'FAIL'}</td></tr>`).join('')}</table>
  <h4>Logos</h4><p>Embedded flags (Commons): ${flagN} • local flag drawings: ${simpleN} • placeholder crests: ${ALL.length - flagN - simpleN} • user uploads: ${userLogos.size}</p>
  <h4>Video / audio capabilities (measured at runtime)</h4>
  <p>Secure context: ${caps.secure} • WebCodecs: ${caps.webcodecs} • AudioEncoder: ${caps.audioEncoder} • AAC encode: ${caps.aac ? 'yes (' + caps.aac.sampleRate + ' Hz)' : 'no'} • Opus encode: ${caps.opus ? 'yes' : 'no'} • MediaRecorder MP4: ${esc(caps.mrMp4 || 'no')} • MediaRecorder WebM: ${esc(caps.mrWebm || 'no')}</p>
  <table><tr><th>Target</th><th>H.264 (MP4)</th><th>VP9/VP8 (WebM)</th></tr>${capRows}</table>
  <h4>Last battle</h4><p>${L ? `seed ${L.seed} • starting units A/B: ${L.start[0]}/${L.start[1]} • events: ${L.events} • hash ${L.hash.toString(16)} • end ${L.endT.toFixed(3)} s` : 'none yet'}</p>
  <p>${X2 ? `export: ${esc(X2.path)} • ${esc(X2.container)} • ${esc(X2.mime)} • ${(X2.size / 1048576).toFixed(2)} MB • ${X2.frames} frames • live=video: ${X2.verified} • tracks: ${esc(JSON.stringify(X2.tracks))} • preview duration: ${X2.previewDuration != null ? X2.previewDuration.toFixed(2) : '—'}` : ''}</p>
  <h4>Resource usage</h4><p>Battles: ${DIAG.matches} • exports: ${DIAG.exports} • open video URLs: ${DIAG.urls.size} • open encoders: ${DIAG.encoderOpen} • live audio sources: ${st.player ? st.player.sources.length : 0} • AudioContext: ${st.audioCtx ? st.audioCtx.state : 'not created'} • captured JS errors: ${ERRORS.length}${ERRORS.length ? '<br>' + ERRORS.slice(-5).map(esc).join('<br>') : ''}</p>
  <h4>Determinism self-test</h4><button class="btn small" id="btnSelfTest">Run test</button><div id="selfTest" class="note"></div>`;
  $('modalDiag').classList.add('open');
  $('btnSelfTest').onclick = runSelfTest;
}
function runSelfTest() {
  const out = $('selfTest'); out.textContent = 'Running…';
  setTimeout(() => {
    const rows = [];
    for (const [a, b] of [['TUR_GALATASARAY', 'TUR_FENERBAHCE'], ['ESP_REAL_MADRID', 'ESP_FC_BARCELONA'], ['NAT_TURKIYE', 'NAT_GERMANY']]) {
      const o = s => ({ seed: s, teamA: BY_ID.get(a), teamB: BY_ID.get(b), cfg: CFG, duration: 'standard', fxLevel: 1 });
      const s1 = E.summary(E.simulate(o(424242))), s2 = E.summary(E.simulate(o(424242))), s3 = E.summary(E.simulate(o(777)));
      const w0 = E.createWorld(o(424242));
      rows.push(`${a} vs ${b}: start ${w0.units.filter(u => u.side === 0).length}/${w0.units.filter(u => u.side === 1).length} • same seed identical: <span class="${JSON.stringify(s1) === JSON.stringify(s2) ? 'pass' : 'fail'}">${JSON.stringify(s1) === JSON.stringify(s2)}</span> • different seed differs: <span class="${s1.hash !== s3.hash ? 'pass' : 'fail'}">${s1.hash !== s3.hash}</span> • winner ${s1.winner === 0 ? 'A' : 'B'} (${s1.survivors}) • ${s1.battleSeconds} s • events ${s1.events}`);
    }
    out.innerHTML = rows.join('<br>');
  }, 30);
}

// ======================= brand / boot =======================
function drawBrand() {
  const c = $('brandCv'); const g0 = F.textCanvas('FOOTBALL WARS', { scale: 3, bold: true, color: '#ffffff', color2: '#ffd23f' });
  c.width = g0.width; c.height = g0.height; const g = c.getContext('2d'); g.drawImage(g0, 0, 0);
}
async function boot() {
  drawBrand(); fillModes();
  const saved = loadSettings(); syncRuleset();
  if (saved && saved.mode && MODES.some(m => m[0] === saved.mode)) { st.mode = saved.mode; st.league = saved.league || st.league; $('mode').value = st.mode; }
  fillLeague();
  setupPicker('A'); setupPicker('B');
  const checks = dataChecks(); const allOk = checks.every(c => c.ok);
  $('dbChip').innerHTML = `Database: <b>${ALL.length}</b> teams (<b>${DB.clubs.length}</b> clubs + <b>${DB.national_teams.length}</b> national) • <b>${DB.leagues.length}</b> leagues • ${esc(DB.metadata.club_season)} ${allOk ? '<span class="pass">✓ verified</span>' : '<span class="fail">✗ data check failed</span>'}`;
  const mobile = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 820;
  if (mobile && !saved) { setRadio('res', '720'); setRadio('camint', 'low'); msg('Mobile device detected: 720×1280 selected for faster, safer encoding (change it in Advanced settings).', 'warn', $('globalMsg')); }
  sizeStage(); splash();
  await loadFlags();
  // defaults: Istanbul derby
  if (st.mode === 'domestic_league' && st.league === 'TUR_SUPER') { choose('A', BY_ID.get('TUR_GALATASARAY')); choose('B', BY_ID.get('TUR_FENERBAHCE')); }
  st.ready = true; refresh(); renderRecent();
  // codec detection (real runtime checks)
  try {
    st.caps = await X.detect();
    const set = settings(); const W = set.res === '720' ? 720 : 1080, H = set.res === '720' ? 1280 : 1920;
    updateFmt();
    if (!st.caps.h264['1080x1920@60'] && !st.caps.h264['720x1280@60'] && !st.caps.vp['1080x1920@60']) { const l = $('fps60l'); l.classList.add('dis'); l.querySelector('input').disabled = true; l.title = 'This browser cannot encode 60 FPS'; setRadio('fps', '30'); }
    void W; void H;
  } catch (e) { $('fmtChip').textContent = 'Video capability check failed: ' + e.message; $('fmtChip').className = 'chip bad'; }
}
function updateFmt() {
  if (!st.caps) return;
  const set = settings(); const W = set.res === '720' ? 720 : 1080, H = set.res === '720' ? 1280 : 1920;
  const p = X.plan(st.caps, W, H, set.fps, set.sound);
  const chip = $('fmtChip');
  if (!p) { chip.className = 'chip bad'; chip.innerHTML = 'Video kodlama desteklenmiyor'; return; }
  chip.className = 'chip ' + (p.container === 'mp4' ? (p.audio && p.audio.codec !== 'opus' || !set.sound ? 'ok' : 'warn') : 'warn');
  chip.innerHTML = `Video: <b>${esc(p.label)}</b> • ${W}×${H} • ${set.fps} FPS`;
  $('globalMsg').querySelectorAll('.fmtwarn').forEach(e => e.remove());
  if (p.warn) { const el = msg(p.warn + ' (' + p.label + ')', 'warn', $('globalMsg')); el.classList.add('fmtwarn'); }
}

function syncRuleset() { const f = radio('ruleset') === 'fusion'; $('fbSettings').classList.toggle('hidden', !f); }
// ======================= events =======================
$('mode').addEventListener('change', onModeChange);
$('league').addEventListener('change', () => { st.league = $('league').value; onModeChange(); });
$('typeFilter').addEventListener('change', () => { st.typeFilter = $('typeFilter').value; refresh(); });
$('mixed').addEventListener('change', () => { st.mixed = $('mixed').checked; refresh(); });
$('btnSwap').addEventListener('click', () => { const a = st.a; st.a = st.b; st.b = a; pickers.A.inp.value = st.a ? st.a.name : ''; pickers.B.inp.value = st.b ? st.b.name : ''; renderCard('A'); renderCard('B'); refresh(); });
$('btnStart').addEventListener('click', () => startBattle());
$('btnReplay').addEventListener('click', replay);
$('btnRematch').addEventListener('click', () => { if (!st.lastTeams) return; [st.a, st.b] = st.lastTeams; $('seed').value = ''; startBattle(randomSeed()); });
$('btnNew').addEventListener('click', () => { if (st.phase === 'live' || st.phase === 'encoding') return; cleanupPrevious(false); $('resultCard').classList.add('hidden'); clearMsgs(); status('New battle: pick a competition and two teams.', {}, 0); setState('idle'); $('seed').value = ''; pickers.A.inp.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
$('btnSeedRnd').addEventListener('click', () => { $('seed').value = randomSeed(); });
$('btnSeedCopy').addEventListener('click', async () => { const v = $('seed').value || st.lastSeed || ''; if (!v) return; try { await navigator.clipboard.writeText(String(v)); $('btnSeedCopy').textContent = 'Copied'; } catch (e) { $('seed').value = v; $('seed').select(); document.execCommand && document.execCommand('copy'); $('btnSeedCopy').textContent = 'Selected'; } setTimeout(() => $('btnSeedCopy').textContent = 'Copy', 1400); });
$('btnAbout').addEventListener('click', openAbout);
$('btnTour').addEventListener('click', openTour);
$('btnCoverSq').addEventListener('click', squareCover);
$('tourFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const t = tourLegacy(JSON.parse(rd.result)); TV.validateTournament(t, DB); if (tour && !confirm('Replace the current bracket with the imported one?')) return; tour = t; tourSave(); renderTour(); } catch (er) { alert('Import failed: ' + er.message); } }; rd.readAsText(f); });
document.addEventListener('click', e => {
  const g = (k) => { const el = e.target.closest('[data-' + k + ']'); return el ? el.dataset[k].split(':').map(Number) : null; };
  let x; if ((x = g('tsim'))) tourSimulate(x[0], x[1]); else if ((x = g('tplay'))) tourPlay(x[0], x[1]); else if ((x = g('tview'))) tourView(x[0], x[1]);
  else if ((x = g('treplay'))) { const mt = tour.rounds[x[0]][x[1]]; st.tourCtx = { ri: x[0], i: x[1], a: mt.a, b: mt.b, seed: mt.seed, duration: tour.duration }; tourPlay(x[0], x[1]); }
});
document.querySelectorAll('input[name=ruleset],input[name=fbint],#optFbFollow,#optFbAlerts,#optGoalAdv').forEach(el => el.addEventListener('change', () => { syncRuleset(); saveSettings(); if (st.phase !== 'live' && st.phase !== 'encoding') drawIdle(); }));
document.querySelectorAll('input[name=covertype]').forEach(el => el.addEventListener('change', () => { saveSettings(); if (st.match && st.match.world.phase === 'ended') { st.match.set = Object.assign({}, st.match.set, { cover: settings().cover }); makeCover(st.match); } }));
$('btnDiag').addEventListener('click', openDiag);
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) e.target.closest('.modal').classList.remove('open');
  else if (e.target.classList && e.target.classList.contains('modal')) e.target.classList.remove('open');
  const up = e.target.closest('[data-up]'); if (up) { uploadFor = up.dataset.up; $('logoFile').value = ''; $('logoFile').click(); }
  const rm = e.target.closest('[data-rm]'); if (rm) { const id = rm.dataset.rm; userLogos.delete(id); logoCache.delete(id); try { localStorage.removeItem('fw_logo:' + id); } catch (er) { } if (st.a && st.a.id === id) renderCard('A'); if (st.b && st.b.id === id) renderCard('B'); refresh(); }
  const ld = e.target.closest('[data-load]'); if (ld) loadRecent(+ld.dataset.load);
});
$('logoFile').addEventListener('change', e => onUpload(e.target.files && e.target.files[0]));
document.querySelectorAll('input[name=res],input[name=fps],#optSound').forEach(el => el.addEventListener('change', () => { updateFmt(); saveSettings(); }));
document.querySelectorAll('input[name=dur],input[name=fx],input[name=lang],#optLabels,#volMusic,#volSfx,input[name=vstyle],input[name=camint],#optSmartCam,#optStory,#optEpic,#optVfx,#optMvp,#optCrowd,#optMomentum,input[name=hcteams]').forEach(el => el.addEventListener('change', () => { saveSettings(); if (st.phase !== 'live' && st.phase !== 'encoding') drawIdle(); }));
window.addEventListener('resize', () => sizeStage());
window.addEventListener('beforeunload', () => { for (const u of DIAG.urls) URL.revokeObjectURL(u); });
// test hooks (used by the automated browser tests; harmless for users)
window.FW_APP = { st, DIAG, tour: () => tour, setTour: t => { tour = t; tourSave(); renderTour(); }, tourSimulate, tourPlay, openTour, buildMatch: (seed, set) => buildMatch(seed, set || settings(), false), choose: (s, id) => choose(s, BY_ID.get(id)), startBattle, replay, search, validate, dataChecks, settings, setMode: m => { $('mode').value = m; onModeChange(); }, ERRORS };
boot().catch(e => { console.error(e); msg('Startup error: ' + e.message, 'bad', $('globalMsg')); });
})();
