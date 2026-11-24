// FOOTBALL WARS — Complete Career Edition: application shell, routing, weekly flow.
import { esc, fmtC, $, crest, toast, modal, form5, ACTIONS, registerActions } from './common.js';
import { DEFAULT_FORMATION, ROLES, ROLE_LABEL, ROLE_DESC, SPONSOR_TYPES, SEASON_WEEKS, FAC_LABEL, TACTIC_LABEL } from '../data/balance.js';
import { newCareerState, PLAYER_ID } from '../career/world.js';
import { setupSeason, startWeek, endWeek, worldJobs, playerFixtures, canEndWeek, table, compName, cupsOf, cupResult, wk, ordinal, PLAYOFF_WEEK } from '../career/season.js';
import { weeklyBreakdown, takeAdvance, canAdvance, avgStandardQ } from '../career/economy.js';
import { actionsLeft, inWindow, nextWindowText, chooseSponsor } from '../career/management.js';
import { saveSlot, loadSlot, slotInfo, deleteSlot, exportJSON, importJSON, storageBackend, SLOTS } from '../persist/save.js';
import { runJobs, poolMode } from '../battle/simPool.js';
import { CREST_SHAPES, KIT_PATTERNS, PALETTE } from '../data/names.js';
import { validateClubInput } from '../career/validate.js';
import { SCREENS } from './screens.js';
import { openPrep, resolveAbandoned } from './match.js';
import { mix32 } from '../career/util.js';

export const App = { S: null, slot: 1, view: 'title', arg: null, sim: null, settings: loadSettings(), saving: null };
if (typeof window !== 'undefined') window.__FWC = App; // read-only hook for automated browser tests
function loadSettings() { try { return Object.assign({ fx: 1, sound: true, music: true, camera: 'smart', speed: 1, tutorial: true }, JSON.parse(localStorage.getItem('fwc:settings') || '{}')); } catch (e) { return { fx: 1, sound: true, music: true, camera: 'smart', speed: 1, tutorial: true }; } }
export function saveSettings() { try { localStorage.setItem('fwc:settings', JSON.stringify(App.settings)); } catch (e) { /* private mode */ } }
const root = () => document.getElementById('app');
const NAV = [['dashboard', '🏟️', 'Club'], ['squad', '👥', 'Squad'], ['transfers', '🔁', 'Transfers'], ['scouting', '🔭', 'Scouting'], ['academy', '🌱', 'Academy'], ['facilities', '🏗️', 'Facilities'],
  ['calendar', '📅', 'Calendar'], ['tables', '📊', 'Tables'], ['cups', '🏆', 'Cups'], ['finance', '💰', 'Finance'], ['history', '📜', 'History'], ['settings', '⚙️', 'Menu']];

// ---------------- rendering ----------------
export function go(view, arg) { App.view = view; App.arg = arg == null ? null : arg; render(); window.scrollTo(0, 0); }
export function render() {
  const el = root(); const S = App.S;
  if (App.view === 'create' && draft) { el.innerHTML = createView(); afterCreate(); return; }
  if (App.view === 'title' || !S) { el.innerHTML = titleView(); afterTitle(); return; }
  const P = S.clubs[S.playerId];
  const body = (SCREENS[App.view] || VIEWS[App.view] || VIEWS.dashboard)(S, App.arg);
  el.innerHTML = `
  <header class="topbar">
    <div class="club">${crest(P, 'md')}<div style="min-width:0"><div class="nm">${esc(P.name)}</div><div class="sub">Season ${S.season} · ${S.week > SEASON_WEEKS ? 'Play-offs' : 'Week ' + S.week + '/38'} · Division ${P.division}</div></div></div>
    <div class="chips"><span class="chip ${P.budget < 0 ? 'bad' : 'gold'}"><b>${fmtC(P.budget)}</b></span><span class="chip">Actions <b>${actionsLeft(S, P)}/2</b></span>${inWindow(S) ? '<span class="chip ok">Window open</span>' : ''}${simChip()}</div>
  </header>
  <nav class="main">${NAV.map(([k, i, l]) => `<button data-act="nav" data-v="${k}" class="${App.view === k ? 'on' : ''}"><span class="i">${i}</span>${l}</button>`).join('')}</nav>
  <main>${body}</main>${tutorialHTML()}`;
  const after = (SCREENS['after_' + App.view] || VIEWS['after_' + App.view]); if (after) after(S, App.arg);
}
function simChip() { const s = App.sim; if (!s || s.done) return ''; return `<span class="chip">World sim <b>${s.n}/${s.total}</b></span>`; }

// ---------------- weekly flow ----------------
export function ensureWeek() {
  const S = App.S; if (!S) return;
  if (!S.lock) { startWeek(S); autosave(); }
  resolveAbandoned();
  kickSim();
}
export function kickSim() {
  const S = App.S; if (!S || !S.lock) return;
  const key = S.lock.key; if (App.sim && App.sim.key === key && !App.sim.failed) return App.sim.p;
  const jobs = worldJobs(S);
  const st = { key, n: 0, total: jobs.length, done: false };
  App.sim = st;
  st.p = runJobs(jobs, (n, t) => { st.n = n; st.total = t; const c = document.querySelector('.topbar .chips'); if (c && App.view !== 'battle') { const ch = c.querySelector('.chip:last-child'); if (ch && /World sim/.test(ch.textContent)) ch.innerHTML = `World sim <b>${n}/${t}</b>`; } const p = document.getElementById('simprog'); if (p) p.style.width = (n / t * 100).toFixed(1) + '%'; })
    .then(res => { if (!App.S || !App.S.lock || App.S.lock.key !== key) return; Object.assign(App.S.lock.results, res); st.done = true; autosave(); if (App.view === 'dashboard' && !App.busy) render(); })
    .catch(e => { st.failed = true; console.error(e); toast('World simulation error: ' + e.message, 'bad'); });
  return st.p;
}
export async function nextWeek() {
  if (App.busy) return;
  App.busy = true;
  try { await nextWeekInner(); } finally { App.busy = false; }
}
async function nextWeekInner() {
  const S = App.S; const c = canEndWeek(S);
  if (!c.ok && c.missing) {
    const m = modal(`<h2>Simulating the football world</h2><p class="dim">${c.missing.length} matches across 10 divisions and the cups are being played with the full battle engine (${esc(poolMode() || 'starting…')}).</p><div class="progress"><i id="simprog" style="width:${App.sim ? (App.sim.n / Math.max(1, App.sim.total) * 100).toFixed(1) : 0}%"></i></div>`);
    await kickSim(); m.remove();
  }
  const c2 = canEndWeek(S); if (!c2.ok) { toast(c2.reason, 'bad'); return; }
  const prevSeason = S.season;
  const r = endWeek(S); if (!r.ok) { toast(r.reason, 'bad'); return; }
  App.sim = null;
  if (S.season !== prevSeason) { startWeek(S); await autosave(true); kickSim(); go('seasonEnd', r.summary.seasonEnd); return; }
  startWeek(S); await autosave(true); kickSim();
  go('dashboard');
}
let saveTimer = null;
export function autosave(now) {
  if (!App.S) return Promise.resolve();
  clearTimeout(saveTimer);
  const doSave = () => { App.saving = saveSlot(App.slot, App.S).catch(e => toast('Autosave failed: ' + e.message + ' — use Export JSON.', 'bad')); return App.saving; };
  if (now) return doSave();
  return new Promise(res => { saveTimer = setTimeout(() => doSave().then(res), 250); });
}
export function act(result, okText) {
  if (!result.ok) { toast(result.reason, 'bad'); return false; }
  if (okText) toast(typeof okText === 'function' ? okText(result) : okText, 'ok');
  autosave(); render(); return true;
}

// ---------------- title ----------------
function titleView() {
  return `<div class="title"><canvas id="logo" width="360" height="60"></canvas><div class="tag">COMPLETE CAREER EDITION</div>
  <p class="dim" style="max-width:520px">Build your own club from nothing. Climb ten divisions of 200 clubs. Manage stars, transfers and cups — and command 100 vs 100 football battles from the touchline.</p>
  <div class="slots" id="slots"><div class="dim">Loading save slots…</div></div>
  <div class="row" style="justify-content:center"><button class="btn sm ghost" data-act="import">Import JSON save</button><input type="file" id="importFile" accept=".json,application/json" class="hidden"></div>
  <p class="small dim" id="storageNote"></p></div>`;
}
async function afterTitle() {
  const cv = $('#logo'); if (cv && window.FWFont) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; window.FWFont.draw(g, 'FOOTBALL WARS', 180, 12, { scale: 4, bold: true, color: '#ffffff', color2: '#ffe14d', align: 'center' }); }
  const box = $('#slots'); let html = '';
  for (const s of SLOTS) {
    let info = null; try { info = await slotInfo(s); } catch (e) { info = null; }
    html += `<div class="card slot">${info ? `<img class="crest md" src="${window.FWSprites ? '' : ''}" data-kit='${esc(JSON.stringify(info.kit || {}))}' data-nm="${esc(info.club)}" alt="">` : '<div style="width:40px;text-align:center;font-size:22px">＋</div>'}
      <div style="flex:1;min-width:0"><b>Slot ${s}</b><div class="small dim">${info ? `${esc(info.club)} · Season ${info.season}, week ${info.week} · Division ${info.div}` : 'Empty'}</div></div>
      ${info ? `<button class="btn sm acc" data-act="load" data-v="${s}">Continue</button><button class="btn sm ghost" data-act="delslot" data-v="${s}" title="Delete">✕</button>` : `<button class="btn sm pri" data-act="new" data-v="${s}">New Career</button>`}</div>`;
  }
  box.innerHTML = html;
  box.querySelectorAll('img[data-kit]').forEach(img => { try { const k = JSON.parse(img.dataset.kit); img.src = window.FWSprites.generatedCrest({ id: 'slot', name: img.dataset.nm, visual: { primary_color: k.primary, secondary_color: k.secondary, crest: k.crest } }, 48).toDataURL(); } catch (e) { /* ignore */ } });
  const n = $('#storageNote'); if (n) n.textContent = `Saves: ${storageBackend() === 'indexeddb' ? 'IndexedDB (this browser)' : storageBackend() === 'localstorage' ? 'localStorage fallback' : 'browser storage unavailable here — use Export/Import JSON'}${location.protocol === 'file:' ? ' · running from a local file' : ''}`;
}

// ---------------- club creation ----------------
let draft = null;
function newDraft(slot) { return { slot, step: 1, name: '', short: '', city: '', stadium: '', primary: '#e63946', secondary: '#ffffff', pattern: 'stripes', crest: 'chevron', formation: { ...DEFAULT_FORMATION }, err: '' }; }
function createView() {
  const d = draft;
  if (d.step === 1) return `<div style="grid-column:1/-1;max-width:760px;margin:0 auto;width:100%"><h1>Found your club</h1>
  <div class="grid g2"><div class="card">
    <label class="f" for="cName">Club name</label><input type="text" id="cName" maxlength="28" value="${esc(d.name)}" placeholder="e.g. Harbour City FC">
    <div class="grid g2" style="gap:10px"><div><label class="f" for="cShort">Short name (2–4)</label><input type="text" id="cShort" maxlength="4" value="${esc(d.short)}" placeholder="HCF"></div>
    <div><label class="f" for="cCity">City</label><input type="text" id="cCity" maxlength="20" value="${esc(d.city)}" placeholder="Harbour City"></div></div>
    <label class="f" for="cStadium">Stadium name</label><input type="text" id="cStadium" maxlength="28" value="${esc(d.stadium)}" placeholder="Harbour Ground">
    <div class="grid g2" style="gap:10px"><div><label class="f" for="cPri">Primary colour</label><input type="color" id="cPri" value="${esc(d.primary)}"></div><div><label class="f" for="cSec">Secondary colour</label><input type="color" id="cSec" value="${esc(d.secondary)}"></div></div>
    <div class="row" style="margin-top:6px">${PALETTE.slice(0, 12).map(c => `<button class="btn sm" data-act="pal" data-v="${c}" style="background:${c};width:28px;min-height:24px;padding:0" title="${c}"></button>`).join('')}</div>
    <div class="grid g2" style="gap:10px"><div><label class="f" for="cPat">Kit pattern</label><select id="cPat">${KIT_PATTERNS.map(p => `<option ${p === d.pattern ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
    <div><label class="f" for="cCrest">Crest template</label><select id="cCrest">${CREST_SHAPES.map(p => `<option ${p === d.crest ? 'selected' : ''}>${p}</option>`).join('')}</select></div></div>
    <p class="bad small" id="cErr">${esc(d.err)}</p>
    <div class="row"><button class="btn ghost" data-act="title">Back</button><button class="btn pri" data-act="createNext">Next: build the squad →</button></div>
  </div><div class="card hl" style="text-align:center"><h2>Preview</h2><canvas id="crestPrev" width="96" height="96" style="width:144px;height:144px;image-rendering:pixelated"></canvas>
    <canvas id="kitPrev" width="120" height="40" style="width:300px;max-width:100%;height:auto;image-rendering:pixelated;margin-top:10px"></canvas>
    <p class="dim small" id="prevName"></p><p class="small dim">Your club starts in <b>Division 10</b> with 1,600 C, 100 amateur players (quality ≈37.5), no stars and level-1 facilities.</p></div></div></div>`;
  const f = d.formation, tot = ROLES.reduce((n, r) => n + (f[r] | 0), 0);
  return `<div style="grid-column:1/-1;max-width:760px;margin:0 auto;width:100%"><h1>Starter Squad Builder</h1>
  <div class="card"><p class="dim">Distribute your 100 amateur players across the seven roles. This is free now; later, permanent role changes need training or transfers. There is always exactly <b>one captain</b>.</p>
  ${ROLES.map(r => `<div class="rolerow"><span class="rn">${ROLE_LABEL[r]}</span><input type="range" min="${r === 'captain' ? 1 : 0}" max="${r === 'captain' ? 1 : 60}" value="${f[r]}" data-role="${r}" ${r === 'captain' ? 'disabled' : ''} aria-label="${ROLE_LABEL[r]}"><input type="number" min="0" max="60" value="${f[r]}" data-rolen="${r}" ${r === 'captain' ? 'disabled' : ''} aria-label="${ROLE_LABEL[r]} count"></div><div class="small dim" style="margin:-4px 0 6px 120px">${esc(ROLE_DESC[r])}</div>`).join('')}
  <div class="row sb" style="margin-top:12px"><div class="big ${tot === 100 ? 'ok' : 'bad'}" id="fTot">${tot} / 100</div><button class="btn sm" data-act="fdef">Default distribution</button></div>
  <p class="bad small">${esc(d.err)}</p>
  <div class="row"><button class="btn ghost" data-act="createBack">← Back</button><button class="btn pri" data-act="createGo" ${tot === 100 ? '' : 'disabled'} id="btnGo">Found the club & start Season 1</button></div></div></div>`;
}
function readCreate() {
  if (draft.step !== 1) return;
  draft.name = $('#cName').value; draft.short = $('#cShort').value; draft.city = $('#cCity').value; draft.stadium = $('#cStadium').value;
  draft.primary = $('#cPri').value; draft.secondary = $('#cSec').value; draft.pattern = $('#cPat').value; draft.crest = $('#cCrest').value;
}
function afterCreate() {
  if (draft.step === 1) {
    const upd = () => {
      readCreate(); const team = { id: 'preview', name: draft.name || 'Your Club', visual: { primary_color: draft.primary, secondary_color: draft.secondary, crest: draft.crest, pattern: draft.pattern } };
      const cv = $('#crestPrev'), g = cv.getContext('2d'); g.clearRect(0, 0, 96, 96); g.imageSmoothingEnabled = false; g.drawImage(window.FWSprites.generatedCrest(team, 96), 0, 0);
      const k = $('#kitPrev'), kg = k.getContext('2d'); kg.clearRect(0, 0, 120, 40); kg.imageSmoothingEnabled = false;
      try { const kits = window.FWSprites.makeKits(team, { id: 'x', name: 'x', visual: { primary_color: '#202020', secondary_color: '#909090' } }, 210); const at = window.FWSprites.buildAtlas(team, kits[0]); const roles = ['striker', 'winger', 'defender', 'goalkeeper', 'captain', 'support']; roles.forEach((r, i) => kg.drawImage(at.canvas, 0, window.FWSprites.rowIndex(window.FWSprites.ROLES.indexOf(r), i % 6, false) * 20, 20, 20, i * 20, 10, 20, 20)); } catch (e) { /* preview only */ }
      $('#prevName').textContent = (draft.name || 'Your Club') + ' · ' + (draft.city || 'Your City');
    };
    root().querySelectorAll('input,select').forEach(el => el.addEventListener('input', upd)); upd();
  } else {
    const sync = (r, v) => { if (r === 'captain') return; draft.formation[r] = Math.max(0, Math.min(60, v | 0)); const tot = ROLES.reduce((n, k) => n + draft.formation[k], 0); const t = $('#fTot'); t.textContent = tot + ' / 100'; t.className = 'big ' + (tot === 100 ? 'ok' : 'bad'); $('#btnGo').disabled = tot !== 100; $(`[data-role="${r}"]`).value = draft.formation[r]; $(`[data-rolen="${r}"]`).value = draft.formation[r]; };
    root().querySelectorAll('[data-role]').forEach(el => el.addEventListener('input', () => sync(el.dataset.role, +el.value)));
    root().querySelectorAll('[data-rolen]').forEach(el => el.addEventListener('input', () => sync(el.dataset.rolen, +el.value)));
  }
}
async function foundClub() {
  const v = validateClubInput(draft); if (!v.ok) { draft.step = 1; draft.err = v.reason; render(); return; }
  const f = draft.formation; if (ROLES.reduce((n, r) => n + f[r], 0) !== 100 || f.captain !== 1) { draft.err = 'The squad must have exactly 100 players and one captain.'; render(); return; }
  const a = new Uint32Array(1); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : (a[0] = Date.now() >>> 0);
  const S = newCareerState(a[0] || 1, v.value, { ...f }, draft.slot);
  setupSeason(S);
  App.S = S; App.slot = draft.slot; App.settings.tutorial = true; saveSettings();
  S.tutorial = { done: false, step: 0 };
  startWeek(S);
  await autosave(true);
  kickSim();
  go('dashboard');
}

// ---------------- dashboard ----------------
const VIEWS = {};
VIEWS.dashboard = (S) => {
  const P = S.clubs[S.playerId];
  const T = table(S, P.division); const me = T.find(r => r.id === P.id);
  const wb = weeklyBreakdown(S, P);
  const myF = playerFixtures(S);
  const ce = canEndWeek(S);
  const pend = myF.filter(f => !f.done);
  const near = T.slice(Math.max(0, me.pos - 4), Math.max(0, me.pos - 4) + 7);
  const upcoming = Object.values(S.fixtures).filter(f => (f.home === P.id || f.away === P.id) && !f.done && f.week > S.week).sort((a, b) => a.week - b.week).slice(0, 4);
  const sim = App.sim;
  const fxRow = f => { const opp = S.clubs[f.home === P.id ? f.away : f.home]; const home = f.home === P.id;
    return `<div class="row sb" style="padding:8px 0;border-bottom:1px solid #18213d"><div class="row" style="gap:8px">${crest(opp)}<div><b>${home ? 'vs' : '@'} ${esc(opp.name)}</b><div class="small dim">${esc(compName(S, f))} · Division ${opp.division} · ${home ? 'home' : 'away'}</div></div></div>
    ${f.done ? `<span class="${f.res.w === P.id ? 'ok' : 'bad'}"><b>${f.res.w === P.id ? 'WON' : 'LOST'}</b> ${f.res.g[home ? 0 : 1]}-${f.res.g[home ? 1 : 0]}</span> <button class="btn sm ghost" data-act="report" data-v="${esc(f.id)}">Report</button>` : `<button class="btn sm pri" data-act="prep" data-v="${esc(f.id)}">Prepare match</button>`}</div>`; };
  const cupLines = cupsOf(S, P.id).map(c => `<div class="row sb small"><span>${esc(c.name)}</span><b>${esc(cupResult(c, P.id))}</b></div>`).join('') || '<div class="small dim">No cup entries this season. Grand Club Cup entry starts at Division 8; Champions Tournament at Division 2.</div>';
  return `<h1>${esc(P.name)}</h1>
  <div class="grid g2">
    <div class="card hl"><h2>${S.week > SEASON_WEEKS ? 'Play-off week' : 'Week ' + S.week} · this week</h2>
      ${myF.length ? myF.map(fxRow).join('') : `<p class="dim">No match for ${esc(P.short)} this week${P.division >= 6 && S.week % 2 === 1 && S.week <= SEASON_WEEKS ? ' (Division 6–10 league games are on even weeks)' : ''}.</p>`}
      <div class="row sb" style="margin-top:12px"><span class="small dim">Management actions left: <b>${actionsLeft(S, P)}/2</b> · ${inWindow(S) ? '<span class="ok">transfer window open</span>' : 'window ' + esc(nextWindowText(S))}</span></div>
      <div style="margin-top:10px">${sim && !sim.done ? `<div class="small dim">World matches: ${sim.n}/${sim.total}</div><div class="progress"><i id="simprog" style="width:${(sim.n / Math.max(1, sim.total) * 100).toFixed(1)}%"></i></div>` : ''}
      <button class="btn acc wide" style="margin-top:8px" data-act="nextweek" ${pend.length ? 'disabled' : ''}>${pend.length ? 'Play your match first' : S.week === SEASON_WEEKS ? 'Finish the regular season →' : S.week === PLAYOFF_WEEK ? 'Finish the season →' : 'Next week →'}</button>
      ${!ce.ok && !pend.length && ce.missing ? '<div class="small dim" style="margin-top:4px">The rest of the world is still being simulated — it finishes automatically.</div>' : ''}</div>
    </div>
    <div class="card"><h2>Club</h2><div class="row">${crest(P, 'lg')}<div class="kv" style="flex:1"><dt>Division</dt><dd>${P.division} · ${ordinal(me.pos)}</dd><dt>Record</dt><dd>${me.W}W ${me.L}L · ${me.pts} pts</dd><dt>Budget</dt><dd class="${P.budget < 0 ? 'bad' : 'gold'}">${fmtC(P.budget)}</dd><dt>Weekly net</dt><dd class="${wb.net >= 0 ? 'ok' : 'bad'}">${fmtC(wb.net)}</dd>
      <dt>Squad quality</dt><dd>${avgStandardQ(P).toFixed(1)}</dd><dt>Stars</dt><dd>${P.stars.length}/8</dd><dt>Fans · Reputation</dt><dd>${P.fans.toLocaleString('en-US')} · ${P.rep}</dd><dt>Tactic</dt><dd>${TACTIC_LABEL[P.tactic]}</dd><dt>Form</dt><dd>${form5(P.form)}</dd></div></div>
      ${P.budget < 0 ? `<p class="bad small">Budget is negative: spending is blocked until you recover. ${canAdvance(S, P) ? '<button class="btn sm" data-act="advance">Take sponsor advance</button>' : ''}</p>` : ''}
      ${S.week === 1 && P.sponsorSeason !== S.season ? `<p class="gold small">Pick this season's sponsor deal in <a href="#" data-act="nav" data-v="finance">Finance</a> (week 1 only).</p>` : ''}</div>
    <div class="card"><h2>Division ${P.division}</h2><div class="tw"><table class="t"><tr><th>#</th><th>Club</th><th class="num">P</th><th class="num">W</th><th class="num">Pts</th></tr>
      ${near.map(r => `<tr class="${r.id === P.id ? 'me' : ''}"><td>${r.pos}</td><td>${crest(S.clubs[r.id])} ${esc(S.clubs[r.id].name)}</td><td class="num">${r.P}</td><td class="num">${r.W}</td><td class="num">${r.pts}</td></tr>`).join('')}</table></div>
      <button class="btn sm ghost" data-act="nav" data-v="tables" style="margin-top:8px">Full tables</button></div>
    <div class="card"><h2>Cups & fixtures</h2>${cupLines}<div style="margin-top:10px">${upcoming.map(f => { const o = S.clubs[f.home === P.id ? f.away : f.home]; return `<div class="row sb small" style="padding:3px 0"><span>W${f.week} · ${f.home === P.id ? 'vs' : '@'} ${esc(o.name)}</span><span class="dim">${esc(compName(S, f))}</span></div>`; }).join('')}</div></div>
    <div class="card" style="grid-column:1/-1"><h2>News</h2><div class="news">${S.news.slice(0, 14).map(n => `<div class="${n.kind}"><span class="dim small">S${n.s} W${n.w}</span> ${esc(n.text)}</div>`).join('') || '<div class="dim">Welcome to your new club.</div>'}</div></div>
  </div>`;
};
VIEWS.seasonEnd = (S, r) => {
  const rec = r ? r.record : S.history.seasons.at(-1); if (!rec) return VIEWS.dashboard(S);
  const P = S.clubs[S.playerId];
  return `<h1>Season ${rec.season} complete</h1><div class="grid g2"><div class="card hl"><h2>Your season</h2><div class="big">${ordinal(rec.pos)} in Division ${rec.div}</div>
  <p>${rec.W} wins · ${rec.L} losses · ${rec.pts} points</p>${rec.move === 'promoted' ? `<p class="ok big">PROMOTED to Division ${P.division}!</p>` : rec.move === 'relegated' ? `<p class="bad big">Relegated to Division ${P.division}</p>` : `<p class="dim">You stay in Division ${P.division}.</p>`}
  ${rec.cups.map(c => `<div class="row sb small"><span>${esc(c.name)}</span><b>${esc(c.result)}</b></div>`).join('')}</div>
  <div class="card"><h2>Champions</h2><div class="kv"><dt>Division 1</dt><dd>${esc(rec.d1)}</dd>${Object.entries(rec.champions).filter(([k]) => k === 'CT' || k === 'GC' || k === 'DC' + rec.div).map(([k, v]) => `<dt>${k === 'CT' ? 'Champions Tournament' : k === 'GC' ? 'Grand Club Cup' : 'Division ' + rec.div + ' Cup'}</dt><dd>${esc(v || '—')}</dd>`).join('')}</div>
  <p class="small dim">Stars aged one year; retirements moved to the Legends list; academies delivered new prospects; contracts were updated.</p></div></div>
  <div class="card" style="margin-top:14px"><h2>Season ${S.season}</h2><p>Choose your sponsor deal for the new season and open the transfer window.</p><button class="btn pri" data-act="nav" data-v="finance">Sponsor & finances</button> <button class="btn acc" data-act="nav" data-v="dashboard">Continue</button></div>`;
};
VIEWS.finance = (S) => {
  const P = S.clubs[S.playerId], b = weeklyBreakdown(S, P);
  const canPick = S.week === 1 && P.sponsorSeason !== S.season;
  return `<h1>Finance</h1><div class="grid g2"><div class="card"><h2>Weekly budget (38 world weeks)</h2><div class="kv">
  <dt>Sponsor (${SPONSOR_TYPES[P.sponsor].label})</dt><dd class="ok">${fmtC(b.sponsor)}</dd><dt>Commercial (Fan Centre)</dt><dd class="ok">${fmtC(b.commercial)}</dd><dt>Standard squad wages</dt><dd class="bad">${fmtC(b.wages)}</dd><dt>Star wages</dt><dd class="bad">${fmtC(b.starWages)}</dd><dt>Facility upkeep</dt><dd class="bad">${fmtC(b.upkeep)}</dd>${b.repay ? `<dt>Advance repayment</dt><dd class="bad">${fmtC(b.repay)}</dd>` : ''}<dt><b>Net per week</b></dt><dd class="${b.net >= 0 ? 'ok' : 'bad'}">${fmtC(b.net)}</dd></div>
  <p class="small dim">Match days add appearance money, home ticket sales (stadium capacity × fans) and win bonuses. League positions, promotion and cup runs pay prizes.</p>
  <h2 style="margin-top:14px">Sponsor advance</h2><p class="small dim">Once per season: ${fmtC(S.week ? 4 * (b.sponsor / (SPONSOR_TYPES[P.sponsor].base || 1)) : 0)} now, repaid at 25% of the sponsor each week.</p><button class="btn sm" data-act="advance" ${canAdvance(S, P) ? '' : 'disabled'}>Take advance</button>${P.advance.debt > 0 ? ` <span class="small bad">Outstanding: ${fmtC(P.advance.debt)}</span>` : ''}</div>
  <div class="card"><h2>Sponsor deal ${canPick ? '(choose now — week 1)' : '(this season)'}</h2>${Object.entries(SPONSOR_TYPES).map(([k, t]) => `<div class="row sb" style="padding:8px 0;border-bottom:1px solid #18213d"><div><b>${t.label}</b><div class="small dim">${esc(t.desc)}</div></div>${P.sponsor === k ? '<span class="pill">ACTIVE</span>' : canPick ? `<button class="btn sm" data-act="sponsor" data-v="${k}">Sign</button>` : ''}</div>`).join('')}</div>
  <div class="card" style="grid-column:1/-1"><h2>Ledger</h2><div class="tw"><table class="t"><tr><th>When</th><th>Item</th><th class="num">Amount</th></tr>${S.ledger.slice(-60).reverse().map(l => `<tr><td class="dim">S${l.s} W${l.w}</td><td>${esc(l.label)}</td><td class="num ${l.amount >= 0 ? 'ok' : 'bad'}">${fmtC(l.amount)}</td></tr>`).join('')}</table></div></div></div>`;
};
VIEWS.settings = (S) => {
  const st = App.settings;
  const sel = (id, val, opts) => `<select data-set="${id}">${opts.map(([v, l]) => `<option value="${v}" ${String(val) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `<h1>Menu</h1><div class="grid g2"><div class="card"><h2>Career (slot ${App.slot})</h2><p class="small dim">Autosaves after every action, match and week. Storage: ${esc(storageBackend())}. World simulation: ${esc(poolMode() || 'idle')}.</p>
  <div class="row"><button class="btn acc" data-act="savenow">Save now</button><button class="btn" data-act="export">Export JSON</button><button class="btn" data-act="import">Import JSON</button><input type="file" id="importFile" accept=".json,application/json" class="hidden"></div>
  <div class="row" style="margin-top:10px"><button class="btn ghost" data-act="title">Quit to title</button><button class="btn ghost" data-act="tutorialReset">Show tutorial again</button></div></div>
  <div class="card"><h2>Presentation</h2><label class="f">Graphics quality (never changes results)</label>${sel('fx', st.fx, [[0, 'Low'], [1, 'Medium'], [2, 'High']])}
  <label class="f">Default camera</label>${sel('camera', st.camera, [['smart', 'Smart Camera'], ['full', 'Full Field'], ['ball', 'Football Focus']])}
  <label class="f">Sound effects</label>${sel('sound', st.sound, [[true, 'On'], [false, 'Off']])}<label class="f">Music</label>${sel('music', st.music, [[true, 'On'], [false, 'Off']])}
  <label class="f">Battle speed</label>${sel('speed', st.speed, [[1, '1×'], [2, '2×']])}</div>
  <div class="card"><h2>Controls</h2><p class="small">Battle: <span class="kbd">1</span><span class="kbd">2</span><span class="kbd">3</span> Attack / Balanced / Defend · <span class="kbd">Q</span> Full Press · <span class="kbd">W</span> Hold Line · <span class="kbd">E</span> Fast Break · <span class="kbd">C</span> camera · <span class="kbd">M</span> sound · <span class="kbd">Space</span> speed</p></div></div>`;
};
VIEWS.after_settings = () => { document.querySelectorAll('[data-set]').forEach(el => el.addEventListener('change', () => { const k = el.dataset.set; let v = el.value; if (v === 'true') v = true; else if (v === 'false') v = false; else if (/^\d+$/.test(v)) v = +v; App.settings[k] = v; saveSettings(); toast('Saved', 'ok'); })); };

// ---------------- tutorial ----------------
const TUT = [
  ['Welcome, chairman!', 'You founded a club in Division 10 — the bottom of a 200-club, 10-division football world. Each week you get <b>2 management actions</b> (buying players, training, upgrades, scouting, offers). Viewing screens, tactics and playing matches are free.'],
  ['Week 1: get ready', 'Open <b>Squad</b> to see your 100 amateurs and pick a main tactic. In <b>Finance</b>, sign a sponsor deal (week 1 only). Then press <b>Next week</b>. Division 10 league games are on even weeks.'],
  ['Week 2: first league match', 'Use <b>Prepare match</b>. In <b>Play Match</b> you switch Attack / Balanced / Defend and use 3 coach commands; <b>Auto Coach</b> lets your assistant decide; <b>Quick Simulate</b> runs the same battle without drawing it.'],
  ['Weeks 3–4: transfers & scouting', 'The transfer window is open in weeks 1–8 and 21–28. Buy standard player packages or send scouts to find stars you can negotiate for. Winning the Division Cup pays well but never promotes you — only the league does.'],
  ['Week 5+: build for the long run', 'Upgrade facilities (training, academy, stadium…), develop young stars (levels 1–20, specialisations at 4, 9 and 15) and climb: top 1 + play-off winner (2nd v 3rd) go up, bottom 2 go down.']
];
function tutorialHTML() {
  const S = App.S; if (!S || S.tutorial.done || !App.settings.tutorial) return '';
  const step = Math.min(S.tutorial.step, TUT.length - 1);
  return `<div class="tutorial"><div class="row sb"><b>${TUT[step][0]}</b><span class="small dim">${step + 1}/${TUT.length}</span></div><p class="small" style="margin:8px 0">${TUT[step][1]}</p>
  <div class="row"><button class="btn sm" data-act="tutNext">${step === TUT.length - 1 ? 'Got it' : 'Next tip'}</button><button class="btn sm ghost" data-act="tutSkip">Skip tutorial</button></div></div>`;
}

// ---------------- actions ----------------
registerActions({
  nav: (d) => go(d.v),
  title: () => { App.S = null; App.sim = null; go('title'); },
  new: (d) => { draft = newDraft(+d.v); App.view = 'create'; render(); },
  createNext: () => { readCreate(); const v = validateClubInput(draft); if (!v.ok) { draft.err = v.reason; render(); return; } draft.err = ''; draft.step = 2; render(); },
  createBack: () => { draft.step = 1; draft.err = ''; render(); },
  createGo: () => foundClub(),
  fdef: () => { draft.formation = { ...DEFAULT_FORMATION }; render(); },
  pal: (d) => { readCreate(); if (draft.primary === d.v) draft.secondary = d.v; else draft.primary = d.v; render(); },
  load: async (d) => { try { const r = await loadSlot(+d.v); if (!r) { toast('Empty slot', 'bad'); return; } App.S = r.state; App.slot = +d.v; if (r.recovered) toast('The latest save was damaged; the previous good save was restored.', 'bad'); ensureWeek(); go('dashboard'); } catch (e) { toast('Could not load: ' + e.message, 'bad'); } },
  delslot: (d) => { modal(`<h2>Delete slot ${esc(d.v)}?</h2><p>This permanently removes the career in this slot.</p><div class="row"><button class="btn" data-m="no">Cancel</button><button class="btn pri" data-m="yes">Delete</button></div>`, async (k) => { if (k === 'yes') { await deleteSlot(+d.v); render(); } }); },
  nextweek: () => nextWeek(),
  prep: (d) => openPrep(d.v),
  report: (d) => go('report', d.v),
  advance: () => { const S = App.S; act(takeAdvance(S, S.clubs[S.playerId]), r => `Advance received: ${fmtC(r.amount)}`); },
  sponsor: (d) => { const S = App.S; act(chooseSponsor(S, S.clubs[S.playerId], d.v), 'Sponsor deal signed for the season.'); },
  savenow: async () => { await autosave(true); toast('Saved to slot ' + App.slot, 'ok'); },
  export: () => { const blob = new Blob([exportJSON(App.S)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); const P = App.S.clubs[App.S.playerId]; a.download = `football-wars-${P.short}-S${App.S.season}W${App.S.week}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); },
  import: () => { const f = document.getElementById('importFile'); f.onchange = async () => { const file = f.files[0]; if (!file) return; try { const r = importJSON(await file.text()); const slot = App.S ? App.slot : (await firstFreeSlot()); App.S = r.state; App.slot = slot; App.S.slot = slot; App.sim = null; ensureWeek(); await autosave(true); toast(`Imported into slot ${slot}.`, 'ok'); go('dashboard'); } catch (e) { toast('Import rejected: ' + e.message, 'bad'); } }; f.click(); },
  tutNext: () => { const S = App.S; S.tutorial.step++; if (S.tutorial.step >= TUT.length) S.tutorial.done = true; autosave(); render(); },
  tutSkip: () => { App.S.tutorial.done = true; autosave(); render(); },
  tutorialReset: () => { App.S.tutorial = { done: false, step: 0 }; App.settings.tutorial = true; saveSettings(); render(); }
});
async function firstFreeSlot() { for (const s of SLOTS) if (!(await slotInfo(s))) return s; return 1; }
export function boot() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    if (App.busy) { e.preventDefault(); return; } // week transition in progress
    const fn = ACTIONS[el.dataset.act]; if (!fn) return;
    e.preventDefault(); Promise.resolve(fn(el.dataset, el)).catch(err => { console.error(err); toast(String(err && err.message || err), 'bad'); });
  });
  render();
}
export { VIEWS, wk, mix32, PLAYER_ID, FAC_LABEL };
