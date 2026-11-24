// Management screens. Every button maps to a real career operation (src/career/*).
import { esc, fmtC, crest, toast, modal, form5, bar, registerActions } from './common.js';
import { ROLES, ROLE_LABEL, ROLE_SHORT, TACTIC_LABEL, TACTIC_DESC, STYLE_LABEL, FACILITIES, FAC_LABEL, FAC_MAX, facCost, facUpkeep, STADIUM_CAP, RARITY, XP_NEXT, MAX_STARS,
  REF_EXPENSE, WAGE_SHARE, SEASON_WEEKS, TRANSFER_WINDOWS, MAX_STANDARD, PROFILE_LABEL } from '../data/balance.js';
import { table, compName, cupsOf, PLAYOFF_WEEK, ordinal } from '../career/season.js';
import { slotClub } from '../career/schedule.js';
import { avgStandardQ, standardCount } from '../career/economy.js';
import { actionsLeft, inWindow, nextWindowText, packagesFor, buyPackage, trainGroup, trainCost, trainGain, retrain, trainStar, upgradeFacility, setActiveStars, chooseSpec, renewContract,
  listStar, releaseStar, openTalk, makeOffer, acceptBid, startScout, scoutDuration, scoutSlots, starIntel, promoteProspect, releaseProspect, askFor, trainCap } from '../career/management.js';
import { SPECS, sigOf, specOf, pendingSpecs, starValue, divOfOvr } from '../career/stars.js';
import { buildLineup, lineupPower, starAvailable } from '../battle/adapter.js';
import { App, act, render, go } from './app.js';
import { reportView, prepView } from './match.js';

export const SCREENS = {};
const me = S => S.clubs[S.playerId];
const rarityPill = s => `<span class="pill r-${s.rarity}">${RARITY[s.rarity].label}</span>`;
const range = (a, b, d = 0) => a === b ? (+a).toFixed(d) : `${(+a).toFixed(d)}–${(+b).toFixed(d)}`;

// ---------------- squad ----------------
SCREENS.squad = (S) => {
  const P = me(S);
  const L = buildLineup(P, S.stars, S.season, S.week);
  const roleN = {}; for (const r of ROLES) roleN[r] = 0; for (const u of L.units) roleN[u.role]++;
  const stars = P.stars.map(id => S.stars[id]).sort((a, b) => b.ovr - a.ovr);
  const left = actionsLeft(S, P);
  return `<h1>Squad</h1>
  <div class="grid g2">
  <div class="card hl"><h2>Match plan (free to change)</h2>
    <label class="f">Main tactic</label><div class="grid g2" style="gap:6px">${Object.keys(TACTIC_LABEL).map(t => `<button class="btn sm ${P.tactic === t ? 'on' : ''}" data-act="tactic" data-v="${t}" title="${esc(TACTIC_DESC[t])}">${TACTIC_LABEL[t]}</button>`).join('')}</div>
    <p class="small dim">${esc(TACTIC_DESC[P.tactic])}</p>
    <label class="f">Starting play style</label><div class="row">${Object.keys(STYLE_LABEL).map(t => `<button class="btn sm ${P.style === t ? 'on' : ''}" data-act="style" data-v="${t}">${STYLE_LABEL[t]}</button>`).join('')}</div>
    <h2 style="margin-top:14px">Matchday 100</h2><div class="row small">${ROLES.map(r => `<span class="pill">${ROLE_SHORT[r]} ${roleN[r]}</span>`).join('')}</div>
    <p class="small">Power <b>${lineupPower(L.units).toFixed(1)}</b> · ${L.units.filter(u => u.star).length}/5 stars · ${L.units.length} players · 1 captain${L.problems.length ? `<br><span class="bad">${L.problems.map(esc).join('<br>')}</span>` : ''}</p></div>
  <div class="card"><h2>Standard players (${standardCount(P)}/${MAX_STANDARD})</h2><p class="small dim">Training: ${fmtC(trainCost(P))} and 1 action · gains shrink near quality ${trainCap(P).toFixed(1)} (raise it with the Training Centre). Actions left: <b>${left}</b></p>
    <div class="tw"><table class="t"><tr><th>Role</th><th class="num">Players</th><th class="num">Quality</th><th></th></tr>
    ${P.groups.map(g => `<tr><td>${ROLE_LABEL[g.role]}</td><td class="num">${g.count}</td><td class="num">${g.q.toFixed(1)}</td><td><button class="btn sm" data-act="train" data-v="${g.id}" ${left ? '' : 'disabled'}>Train +${trainGain(P, g)}</button> ${g.role !== 'captain' ? `<button class="btn sm ghost" data-act="retrainDlg" data-v="${g.id}" ${left ? '' : 'disabled'}>Retrain</button>` : ''}</td></tr>`).join('')}</table></div></div>
  </div>
  <h2 style="margin-top:16px">Stars (${stars.length}/${MAX_STARS}) — tap to toggle the 5 who play</h2>
  <div class="grid g3">${stars.map(s => starCard(S, s, true)).join('') || '<div class="card dim">No stars yet. Scout and negotiate in the transfer window, or promote academy prospects.</div>'}</div>`;
};
function starCard(S, s, mine) {
  const P = me(S); const active = mine && P.activeStars.includes(s.id); const sig = sigOf(s);
  const avail = starAvailable(s, S.season, S.week);
  return `<div class="starcard ${active ? 'active' : ''}"><div class="ovr">${s.ovr.toFixed(0)}</div><div class="nm">${esc(s.name)}</div>
  <div class="small dim">${ROLE_LABEL[s.role]} · age ${s.age} · Lv ${s.level} ${rarityPill(s)}</div>
  ${bar(s.xp, XP_NEXT(s.level))}<div class="small dim" style="margin-top:2px">XP ${s.xp}/${XP_NEXT(s.level)} · potential ${s.pot}</div>
  <p class="small" style="margin:8px 0"><b class="gold">★ ${esc(sig.name)}</b> — ${esc(sig.desc)}</p>
  <div class="small">${s.specs.map(id => `<span class="pill">${esc((specOf(s.role, id) || {}).name || id)}</span>`).join(' ') || '<span class="dim">No specialisations yet (levels 4, 9, 15)</span>'}</div>
  <div class="kv small" style="margin-top:8px"><dt>Wage</dt><dd>${s.wage} C/wk</dd><dt>Contract</dt><dd>${s.contract} season${s.contract === 1 ? ' (final)' : 's'}</dd><dt>Career</dt><dd>${s.stats.apps} apps · ${s.stats.goals} G · ${s.stats.kos} KO</dd><dt>Value</dt><dd>${fmtC(starValue(s))}</dd></div>
  ${!avail ? `<p class="small warn">${s.injured ? 'Injured — misses the next match' : 'Registered from next week'}</p>` : ''}
  ${mine ? `<div class="row" style="margin-top:8px"><button class="btn sm ${active ? 'on' : ''}" data-act="toggleStar" data-v="${s.id}">${active ? 'Playing' : 'Bench'}</button>
    ${pendingSpecs(s) > 0 ? `<button class="btn sm pri" data-act="specDlg" data-v="${s.id}">Choose specialisation</button>` : ''}
    <button class="btn sm" data-act="trainStar" data-v="${s.id}" ${actionsLeft(S, P) ? '' : 'disabled'}>Train (+XP)</button>
    <button class="btn sm ghost" data-act="renewDlg" data-v="${s.id}">Renew</button>
    <button class="btn sm ghost" data-act="listStar" data-v="${s.id}">${s.listed ? 'Unlist' : 'List for sale'}</button>
    <button class="btn sm ghost" data-act="releaseStar" data-v="${s.id}">Release</button></div>` : ''}</div>`;
}
registerActions({
  tactic: (d) => { const P = me(App.S); P.tactic = d.v; act({ ok: true }); },
  style: (d) => { const P = me(App.S); P.style = d.v; act({ ok: true }); },
  train: (d) => { const S = App.S; act(trainGroup(S, me(S), d.v), r => `Trained: +${r.gain} quality`); },
  trainStar: (d) => { const S = App.S; act(trainStar(S, me(S), d.v), 'Individual training done (+XP).'); },
  toggleStar: (d) => { const S = App.S, P = me(S); const ids = P.activeStars.includes(d.v) ? P.activeStars.filter(x => x !== d.v) : P.activeStars.concat(d.v); act(setActiveStars(S, P, ids)); },
  listStar: (d) => { const S = App.S; act(listStar(S, me(S), d.v, !S.stars[d.v].listed)); },
  releaseStar: (d) => { const S = App.S, s = S.stars[d.v]; modal(`<h2>Release ${esc(s.name)}?</h2><p>Compensation: ${fmtC(s.wage * 10)}. He becomes a free agent.</p><div class="row"><button class="btn" data-m="no">Cancel</button><button class="btn pri" data-m="yes">Release</button></div>`, k => { if (k === 'yes') act(releaseStar(S, me(S), d.v), 'Released.'); }); },
  specDlg: (d) => { const S = App.S, s = S.stars[d.v]; modal(`<h2>${esc(s.name)} — specialisation</h2><p class="small dim">Level ${s.level}. Picking the same path again stacks it.</p>${SPECS[s.role].map(x => `<button class="btn wide" style="margin:4px 0;text-align:left" data-m="${x.id}"><b>${esc(x.name)}</b><div class="small dim">${esc(Object.entries(x.mod).map(([k, v]) => `${k} +${typeof v === 'number' ? Math.round(v * 100) + '%' : v}`).join(', '))}</div></button>`).join('')}`, k => { act(chooseSpec(S, me(S), d.v, k), 'Specialisation learned.'); }); },
  renewDlg: (d) => { const S = App.S, s = S.stars[d.v]; modal(`<h2>Renew ${esc(s.name)}</h2><p class="small">New wage about ${Math.max(s.wage, Math.round(s.wage * 1.1))} C/week (does not use an action).</p><div class="row">${[1, 2, 3].map(y => `<button class="btn" data-m="${y}">${y} season${y > 1 ? 's' : ''}</button>`).join('')}</div>`, k => { act(renewContract(S, me(S), d.v, +k), r => `Renewed at ${r.wage} C/week.`); }); },
  retrainDlg: (d) => { const S = App.S, g = me(S).groups.find(x => x.id === d.v); modal(`<h2>Retrain ${ROLE_LABEL[g.role]}s</h2><p class="small dim">Permanently move up to 6 players to another role (1 action, ${fmtC(Math.round(trainCost(me(S)) * 0.6))}, −1 quality while they adapt).</p>
    <label class="f">Players</label><input type="number" id="rtN" min="1" max="${Math.min(6, g.count)}" value="${Math.min(4, g.count)}"><label class="f">New role</label><select id="rtR">${ROLES.filter(r => r !== 'captain' && r !== g.role).map(r => `<option value="${r}">${ROLE_LABEL[r]}</option>`).join('')}</select>
    <div class="row" style="margin-top:12px"><button class="btn" data-m="no">Cancel</button><button class="btn pri" data-m="go">Retrain</button></div>`, (k, m) => { if (k === 'go') act(retrain(S, me(S), d.v, m.querySelector('#rtR').value, +m.querySelector('#rtN').value), 'Players retrained.'); });
  }
});

// ---------------- transfers ----------------
SCREENS.transfers = (S, tab) => {
  tab = tab || 'stars'; const P = me(S); const open = inWindow(S);
  const tabs = [['stars', 'Star market'], ['packages', 'Standard players'], ['offers', `Offers (${S.market.incoming.length})`], ['history', 'Transfers']];
  let body = '';
  if (tab === 'packages') {
    const pk = packagesFor(S, P);
    body = `<p class="small dim">Packages replace your weakest players of that role (or fill reserve slots up to ${MAX_STANDARD}). One action each. ${open ? '' : '<b class="warn">Window closed — ' + esc(nextWindowText(S)) + '.</b>'}</p>
    <div class="tw"><table class="t"><tr><th>Role</th><th class="num">Players</th><th class="num">Quality</th><th class="num">Price</th><th class="num">Your weakest</th><th></th></tr>
    ${pk.map(p => { const low = Math.min(...P.groups.filter(g => g.role === p.role).map(g => g.q)); const bought = S.market.bought && S.market.bought[`S${S.season}W${S.week}${P.id}${p.id}`];
      return `<tr><td>${ROLE_LABEL[p.role]}</td><td class="num">${p.count}</td><td class="num ${p.q > low ? 'ok' : 'dim'}">${p.q.toFixed(1)}</td><td class="num">${fmtC(p.price)}</td><td class="num">${isFinite(low) ? low.toFixed(1) : '—'}</td>
      <td>${bought ? '<span class="pill">BOUGHT</span>' : `<button class="btn sm" data-act="buyPkg" data-v="${p.id}" data-mode="replace" ${open ? '' : 'disabled'}>Replace weakest</button>${p.role !== 'captain' ? ` <button class="btn sm ghost" data-act="buyPkg" data-v="${p.id}" data-mode="reserve" ${open && standardCount(P) + p.count <= MAX_STANDARD ? '' : 'disabled'}>Add reserves</button>` : ''}`}</td></tr>`; }).join('')}</table></div>`;
  } else if (tab === 'offers') {
    body = `<p class="small dim">List a star in Squad to receive bids during the window. Accepting is free. AI clubs pay at most 85% of value; stars signed this season cannot be resold until next season.</p>` +
      (S.market.incoming.map((b, i) => { const s = S.stars[b.star], c = S.clubs[b.club]; return `<div class="card row sb" style="margin-bottom:8px"><div>${crest(c)} <b>${esc(c.name)}</b> (Div ${c.division}) bid <b class="gold">${fmtC(b.fee)}</b> for <b>${esc(s.name)}</b></div><button class="btn sm pri" data-act="acceptBid" data-v="${i}">Accept</button></div>`; }).join('') || '<div class="card dim">No bids this week.</div>');
  } else if (tab === 'history') {
    body = `<div class="tw"><table class="t"><tr><th>When</th><th>Player</th><th>From</th><th>To</th><th class="num">Fee</th></tr>${S.transfers.slice(-80).reverse().filter(t => S.stars[t.star] || true).map(t => `<tr class="${t.to === P.id || t.from === P.id ? 'me' : ''}"><td class="dim">S${t.s} W${t.w}</td><td>${esc(S.stars[t.star] ? S.stars[t.star].name : 'retired')}</td><td>${t.from ? esc(S.clubs[t.from].name) : 'free'}</td><td>${esc(S.clubs[t.to].name)}</td><td class="num">${fmtC(t.fee)}</td></tr>`).join('')}</table></div>`;
  } else {
    const flt = App.mkt || { role: 'any', div: 'near' };
    let list = Object.values(S.stars).filter(s => !s.academy && s.clubId !== P.id && (s.clubId === null || s.listed || S.scouting.known[s.id]));
    if (flt.role !== 'any') list = list.filter(s => s.role === flt.role);
    const dOf = s => s.clubId ? S.clubs[s.clubId].division : null;
    if (flt.div === 'near') list = list.filter(s => Math.abs((s.clubId ? dOf(s) : divOfOvr(s.ovr)) - P.division) <= 2);
    list.sort((a, b) => (S.scouting.known[b.id] ? 1 : 0) - (S.scouting.known[a.id] ? 1 : 0) || starIntel(S, b).ovr[1] - starIntel(S, a).ovr[1]);
    body = `<div class="row"><select data-mf="role" style="width:auto"><option value="any">All roles</option>${ROLES.map(r => `<option value="${r}" ${flt.role === r ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select>
      <select data-mf="div" style="width:auto"><option value="near" ${flt.div === 'near' ? 'selected' : ''}>Divisions ±2</option><option value="all" ${flt.div === 'all' ? 'selected' : ''}>All divisions</option></select>
      <span class="small dim">Listed players, free agents and stars your scouts have assessed. Ranges narrow with better scouting. Opening talks = 1 action, max 3 offers.</span></div>
    <div class="grid g3" style="margin-top:10px">${list.slice(0, 45).map(s => { const I = starIntel(S, s), c = s.clubId ? S.clubs[s.clubId] : null, a = askFor(S, P, s); const talk = S.market.talks[s.id];
      return `<div class="starcard"><div class="ovr">${I.exact ? s.ovr.toFixed(0) : range(I.ovr[0], I.ovr[1])}</div><div class="nm">${esc(s.name)}</div><div class="small dim">${ROLE_LABEL[s.role]} · age ${s.age} · Lv ${s.level} ${rarityPill(s)}</div>
      <div class="small" style="margin-top:6px">${c ? `${crest(c)} ${esc(c.name)} · Div ${c.division}${s.listed ? ' · <span class="ok">listed</span>' : ''}` : '<span class="ok">Free agent</span>'}${S.scouting.known[s.id] ? ` · <span class="gold">scouted (acc ${S.scouting.known[s.id].acc})</span>` : ''}</div>
      <div class="kv small" style="margin-top:6px"><dt>Potential</dt><dd>${range(I.pot[0], I.pot[1])}</dd><dt>Value</dt><dd>${I.value[0] === I.value[1] ? fmtC(I.value[0]) : fmtC(I.value[0]) + ' – ' + fmtC(I.value[1])}</dd><dt>Wage now</dt><dd>${s.wage} C/wk</dd><dt>Signature</dt><dd>${esc(sigOf(s).name)}</dd></div>
      ${a.refuses ? '<p class="small bad">Not interested in your division yet.</p>' : ''}
      ${talk && talk.season === S.season && (talk.closed || talk.done) ? `<p class="small dim">${esc(talk.last || '')}</p>` : `<button class="btn sm ${talk && talk.season === S.season ? 'pri' : ''}" style="margin-top:8px" data-act="talk" data-v="${s.id}" ${open && !a.refuses ? '' : 'disabled'}>${talk && talk.season === S.season ? 'Continue talks' : 'Open talks (1 action)'}</button>`}</div>`; }).join('') || '<div class="card dim">No players match. Send scouts to discover more stars.</div>'}</div>`;
  }
  return `<h1>Transfers</h1><div class="row" style="margin-bottom:10px">${tabs.map(([k, l]) => `<button class="btn sm ${tab === k ? 'on' : ''}" data-act="nav2" data-view="transfers" data-v="${k}">${l}</button>`).join('')}<span class="chip ${open ? 'ok' : ''}">${open ? 'Window open (weeks ' + TRANSFER_WINDOWS.map(w => w.join('–')).join(', ') + ')' : 'Window ' + esc(nextWindowText(S))}</span><span class="chip">Budget <b>${fmtC(P.budget)}</b></span></div>${body}`;
};
SCREENS.after_transfers = () => { document.querySelectorAll('[data-mf]').forEach(el => el.addEventListener('change', () => { App.mkt = App.mkt || { role: 'any', div: 'near' }; App.mkt[el.dataset.mf] = el.value; render(); })); };
function negotiation(S, starId) {
  const P = me(S), s = S.stars[starId], T = S.market.talks[starId], I = starIntel(S, s), c = s.clubId ? S.clubs[s.clubId] : null;
  const weeksLeft = Math.max(1, SEASON_WEEKS - S.week + 1);
  const m = modal(`<h2>Talks: ${esc(s.name)}</h2><p class="small">${c ? `${esc(c.name)} (Div ${c.division})${s.listed ? ' listed him for sale.' : ' did not list him: expect a premium.'}` : 'Free agent: no transfer fee.'} Offer ${T.rounds + 1} of 3.</p>
  ${T.last ? `<p class="small warn">${esc(T.last)}</p>` : ''}
  <div class="kv small"><dt>Estimated value</dt><dd>${fmtC(I.value[0])} – ${fmtC(I.value[1])}</dd><dt>Current wage</dt><dd>${s.wage} C/wk</dd><dt>Your budget</dt><dd>${fmtC(P.budget)}</dd></div>
  <label class="f">Transfer fee (C)</label><input type="number" id="ofFee" min="0" step="10" value="${c ? Math.round(I.value[0] / 10) * 10 : 0}" ${c ? '' : 'disabled'}>
  <label class="f">Weekly wage (C)</label><input type="number" id="ofWage" min="1" value="${Math.round(s.wage * 1.1)}">
  <label class="f">Contract</label><select id="ofYears"><option value="1">1 season</option><option value="2" selected>2 seasons</option><option value="3">3 seasons</option></select>
  <p class="small dim" id="ofImpact"></p>
  <div class="row"><button class="btn" data-m="no">Close</button><button class="btn pri" data-m="offer">Send binding offer</button></div>`, (k, box) => {
    if (k !== 'offer') return false;
    const r = makeOffer(S, P, starId, +box.querySelector('#ofFee').value, +box.querySelector('#ofWage').value, +box.querySelector('#ofYears').value);
    if (!r.ok) { toast(r.reason, 'bad'); return true; }
    if (r.accepted) { toast(`${s.name} signed! He can play from next week.`, 'ok'); act({ ok: true }); return false; }
    toast(r.msg, 'bad'); act({ ok: true }); if (!r.closed) setTimeout(() => negotiation(S, starId), 50); return false;
  });
  const upd = () => { const fee = +m.querySelector('#ofFee').value || 0, wage = +m.querySelector('#ofWage').value || 0; m.querySelector('#ofImpact').textContent = `Budget impact this season: ${fmtC(-(fee + wage * weeksLeft))} (fee + ${weeksLeft} weeks of wages). Budget after fee: ${fmtC(P.budget - fee)}.`; };
  m.querySelectorAll('input').forEach(i => i.addEventListener('input', upd)); upd();
}
registerActions({
  nav2: (d) => go(d.view, d.v),
  buyPkg: (d) => { const S = App.S, P = me(S); const p = packagesFor(S, P).find(x => x.id === +d.v); act(buyPackage(S, P, p, d.mode), `Signed ${p.count} ${ROLE_LABEL[p.role]}${p.count > 1 ? 's' : ''}.`); },
  acceptBid: (d) => { const S = App.S; act(acceptBid(S, +d.v), 'Sale completed.'); },
  talk: (d) => { const S = App.S; const r = openTalk(S, me(S), d.v); if (!r.ok) { toast(r.reason, 'bad'); return; } act({ ok: true }); negotiation(S, d.v); }
});

// ---------------- scouting ----------------
SCREENS.scouting = (S) => {
  const P = me(S); const act0 = S.scouting.missions.filter(m => !m.done);
  const known = Object.keys(S.scouting.known).map(id => S.stars[id]).filter(s => s && s.clubId !== P.id).sort((a, b) => S.scouting.known[b.id].s * 100 + S.scouting.known[b.id].w - S.scouting.known[a.id].s * 100 - S.scouting.known[a.id].w);
  return `<h1>Scouting</h1><div class="grid g2"><div class="card hl"><h2>New mission</h2><p class="small dim">Scout Office level ${P.fac.scout}: ${scoutSlots(P)} mission(s) at a time, ${scoutDuration(P)} week(s) each, ${2 + Math.floor(P.fac.scout / 2)} players per report, accuracy ${P.fac.scout}/6. Costs 1 action.</p>
    <label class="f">Role focus</label><select id="scRole"><option value="any">Any role</option>${ROLES.map(r => `<option value="${r}">${ROLE_LABEL[r]}</option>`).join('')}</select>
    <label class="f">Region</label><select id="scBand"><option value="same">My division</option><option value="higher">Higher divisions</option><option value="lower">Lower divisions</option></select>
    <button class="btn pri" style="margin-top:12px" data-act="scout" ${actionsLeft(S, P) && act0.length < scoutSlots(P) ? '' : 'disabled'}>Send scouts</button></div>
    <div class="card"><h2>Missions</h2>${S.scouting.missions.slice().reverse().slice(0, 8).map(m => `<div class="row sb small" style="padding:4px 0"><span>#${m.id} · ${m.role === 'any' ? 'any role' : ROLE_LABEL[m.role]} · ${m.band}</span><b>${m.done ? m.found.length + ' found' : m.left + ' week(s) left'}</b></div>`).join('') || '<p class="dim">No missions yet.</p>'}</div></div>
  <h2 style="margin-top:16px">Scouted players</h2><div class="tw"><table class="t"><tr><th>Player</th><th>Role</th><th class="num">Age</th><th class="num">Power</th><th class="num">Potential</th><th>Club</th><th></th></tr>
  ${known.slice(0, 60).map(s => { const I = starIntel(S, s); const c = s.clubId ? S.clubs[s.clubId] : null; return `<tr><td><b>${esc(s.name)}</b> ${rarityPill(s)}</td><td>${ROLE_LABEL[s.role]}</td><td class="num">${s.age}</td><td class="num">${range(I.ovr[0], I.ovr[1], 1)}</td><td class="num">${range(I.pot[0], I.pot[1])}</td><td>${c ? esc(c.name) + ' (D' + c.division + ')' : 'free'}</td><td><button class="btn sm" data-act="nav2" data-view="transfers" data-v="stars">Market</button></td></tr>`; }).join('')}</table></div>`;
};
registerActions({ scout: () => { const S = App.S; act(startScout(S, me(S), document.getElementById('scRole').value, document.getElementById('scBand').value), 'Scouts are on their way.'); } });

// ---------------- academy ----------------
SCREENS.academy = (S) => {
  const P = me(S); const list = Object.values(S.stars).filter(s => s.academy === P.id);
  return `<h1>Youth Academy</h1><div class="card"><p class="small dim">Academy level ${P.fac.academy}: intakes in week 19 and at season end. Higher levels raise the chance of Elite and Generational talents — never a guarantee. Promoting a prospect is free and gives a 3-season contract; unpromoted prospects leave after one season.</p></div>
  <div class="grid g3" style="margin-top:12px">${list.map(s => `<div class="starcard"><div class="ovr">${s.ovr.toFixed(0)}</div><div class="nm">${esc(s.name)}</div><div class="small dim">${ROLE_LABEL[s.role]} · age ${s.age} ${rarityPill(s)}</div>
    <div class="kv small" style="margin-top:6px"><dt>Potential</dt><dd>${s.pot}</dd><dt>Wage if promoted</dt><dd>${s.wage} C/wk</dd><dt>Signature</dt><dd>${esc(sigOf(s).name)}</dd></div>
    <div class="row" style="margin-top:8px"><button class="btn sm pri" data-act="promote" data-v="${s.id}" ${P.stars.length < MAX_STARS ? '' : 'disabled'}>Promote</button><button class="btn sm ghost" data-act="releaseYouth" data-v="${s.id}">Release</button></div></div>`).join('') || '<div class="card dim">No prospects right now. The next intake is in week 19 or at season end.</div>'}</div>`;
};
registerActions({ promote: (d) => { const S = App.S; act(promoteProspect(S, me(S), d.v), 'Prospect promoted to the first team.'); }, releaseYouth: (d) => { const S = App.S; act(releaseProspect(S, me(S), d.v), 'Prospect released.'); } });

// ---------------- facilities ----------------
const FAC_EFFECT = {
  stadium: l => `Capacity ${STADIUM_CAP[l - 1].toLocaleString('en-US')} — ticket income when fans fill it.`,
  training: l => `Group training +${(0.6 + 0.12 * (l - 1)).toFixed(2)}/session, ceiling +${(0.5 * (l - 1)).toFixed(1)}; star XP +${8 * (l - 1)}%.`,
  academy: l => `Better youth: elite/generational chance ${Math.round((l === 1 ? 5 : l === 2 ? 8 : l === 3 ? 12 : l === 4 ? 16 : l === 5 ? 20 : 25))}%; ${l >= 4 ? 2 : 1}+ prospects per intake.`,
  scout: l => `${1 + Math.floor(l / 3)} mission(s), ${Math.max(1, 4 - Math.floor(l / 2))} week(s), accuracy ${l}/6.`,
  medical: l => `Star injury risk −${12 * (l - 1)}%.`,
  fans: l => `Fan growth +${15 * (l - 1)}%, commercial income ${4 * (l - 1)}% of sponsor.`
};
SCREENS.facilities = (S) => {
  const P = me(S); const per = REF_EXPENSE[P.division] * (1 - WAGE_SHARE) / 6;
  return `<h1>Club Facilities</h1><p class="small dim">Each upgrade uses 1 action. Upkeep grows with level. Facilities never add direct battle damage.</p>
  <div class="grid g3">${FACILITIES.map(f => { const l = P.fac[f], cost = l < FAC_MAX ? facCost(f, l) : null; return `<div class="card"><div class="row sb"><b>${FAC_LABEL[f]}</b><span class="pill">Lv ${l}/6</span></div>
  ${bar(l, 6)}<p class="small" style="min-height:36px">${esc(FAC_EFFECT[f](l))}</p>${cost ? `<p class="small dim">Next: ${esc(FAC_EFFECT[f](l + 1))}</p>` : ''}
  <div class="row sb small"><span class="dim">Upkeep ${Math.round(per * facUpkeep(l))} C/wk</span>${cost ? `<button class="btn sm pri" data-act="upgrade" data-v="${f}" ${actionsLeft(S, P) && P.budget >= cost ? '' : 'disabled'}>Upgrade ${fmtC(cost)}</button>` : '<span class="ok">MAX</span>'}</div>
  ${f === 'stadium' ? `<canvas id="stadPrev" width="360" height="96" style="width:100%;image-rendering:pixelated;border-radius:8px;margin-top:8px"></canvas><div class="small dim">${esc(P.stadium)} · ${STADIUM_CAP[l - 1].toLocaleString('en-US')} seats · fans ${P.fans.toLocaleString('en-US')}</div>` : ''}</div>`; }).join('')}</div>`;
};
SCREENS.after_facilities = (S) => {
  const cv = document.getElementById('stadPrev'); if (!cv) return; const P = me(S);
  try { window.FW_STADIUM_LEVEL = P.fac.stadium; const t = { id: P.id, name: P.name, visual: { primary_color: P.kit.primary, secondary_color: P.kit.secondary, pattern: P.kit.pattern } }; const kits = window.FWSprites.makeKits(t, { id: 'b', name: 'b', visual: { primary_color: '#888', secondary_color: '#444' } }, 210); const fld = window.FWRender.buildField(kits, 0, 7); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(fld, 0, 0, 360, 96, 0, 0, 360, 96); } catch (e) { /* preview only */ }
};
registerActions({ upgrade: (d) => { const S = App.S; act(upgradeFacility(S, me(S), d.v), `${FAC_LABEL[d.v]} upgraded.`); } });

// ---------------- calendar ----------------
SCREENS.calendar = (S) => {
  const P = me(S); const rows = [];
  for (let w = 1; w <= PLAYOFF_WEEK; w++) {
    const fs = Object.values(S.fixtures).filter(f => f.week === w && (f.home === P.id || f.away === P.id));
    const cupW = Object.values(S.cups).filter(c => c.rounds.some(r => r.week === w)).map(c => c.kind).filter((v, i, a) => a.indexOf(v) === i);
    const win = TRANSFER_WINDOWS.some(([a, b]) => w >= a && w <= b);
    rows.push(`<tr class="${w === S.week ? 'me' : ''}"><td>${w === PLAYOFF_WEEK ? 'PO' : w}</td><td>${win ? '<span class="pill">window</span>' : ''} ${cupW.map(k => `<span class="pill">${k}</span>`).join(' ')}</td><td>${fs.map(f => { const o = S.clubs[f.home === P.id ? f.away : f.home]; const home = f.home === P.id; return `${esc(compName(S, f))}: ${home ? 'vs' : '@'} ${esc(o.name)} ${f.done ? `<b class="${f.res.w === P.id ? 'ok' : 'bad'}">${f.res.w === P.id ? 'W' : 'L'} ${f.res.g[home ? 0 : 1]}-${f.res.g[home ? 1 : 0]}</b> <a href="#" data-act="report" data-v="${esc(f.id)}">report</a>` : ''}`; }).join('<br>') || '<span class="dim">—</span>'}</td></tr>`);
  }
  return `<h1>Calendar · Season ${S.season}</h1><p class="small dim">Cup rounds are drawn when their week starts. DC = Division Cup, GC = Grand Club Cup, CT = Champions Tournament, PO = play-off finals.</p><div class="card tw"><table class="t"><tr><th>Week</th><th>World</th><th>Your matches</th></tr>${rows.join('')}</table></div>`;
};

// ---------------- tables ----------------
SCREENS.tables = (S, div) => {
  const P = me(S); div = +(div || P.division);
  const T = table(S, div);
  return `<h1>Division ${div}</h1><div class="row" style="margin-bottom:10px">${Array.from({ length: 10 }, (_, i) => `<button class="btn sm ${div === i + 1 ? 'on' : ''}" data-act="nav2" data-view="tables" data-v="${i + 1}">D${i + 1}</button>`).join('')}</div>
  <div class="card tw"><table class="t"><tr><th>#</th><th>Club</th><th class="num">P</th><th class="num">W</th><th class="num">L</th><th class="num" title="survivors for-against">Surv±</th><th class="num">Goals</th><th class="num">Pts</th><th>Form</th><th class="num">Power</th></tr>
  ${T.map(r => { const c = S.clubs[r.id]; const z = div > 1 && r.pos === 1 ? 'up' : div > 1 && (r.pos === 2 || r.pos === 3) ? 'po' : div < 10 && r.pos >= 19 ? 'dn' : ''; return `<tr class="${z} ${r.id === P.id ? 'me' : ''}"><td>${r.pos}</td><td>${crest(c)} ${esc(c.name)}${c.ai ? ` <span class="small dim">${PROFILE_LABEL[c.aiProfile]}</span>` : ''}</td><td class="num">${r.P}</td><td class="num">${r.W}</td><td class="num">${r.L}</td><td class="num">${r.sf - r.sa}</td><td class="num">${r.gf}-${r.ga}</td><td class="num"><b>${r.pts}</b></td><td>${form5(r.form)}</td><td class="num">${avgStandardQ(c).toFixed(1)}</td></tr>`; }).join('')}</table>
  <div class="legend">${div > 1 ? '<span><i style="background:var(--ok)"></i>Promotion</span><span><i style="background:var(--gold)"></i>Play-off final (2nd v 3rd)</span>' : '<span>Champion = world champion</span>'}${div < 10 ? '<span><i style="background:var(--bad)"></i>Relegation</span>' : ''}<span>Win 3 pts · no draws · ties: points, survivor diff, goal diff, goals, head-to-head, season draw lot</span></div></div>`;
};

// ---------------- cups ----------------
SCREENS.cups = (S, key) => {
  const P = me(S); key = key || ('DC' + P.division);
  const cup = S.cups[key];
  const btns = ['DC' + P.division, 'GC', 'CT'].concat(Array.from({ length: 10 }, (_, i) => 'DC' + (i + 1)).filter(k => k !== 'DC' + P.division));
  const name = id => id ? esc(S.clubs[id].name) : '<span class="dim">TBD</span>';
  return `<h1>${esc(cup.name)}</h1><div class="row" style="margin-bottom:10px">${btns.map(k => `<button class="btn sm ${k === key ? 'on' : ''}" data-act="nav2" data-view="cups" data-v="${k}">${k === 'GC' ? 'Grand Club Cup' : k === 'CT' ? 'Champions' : 'Div ' + k.slice(2) + ' Cup'}</button>`).join('')}</div>
  <div class="card"><p class="small dim">${cup.seeds.length} clubs · single-match knockout · prize ${fmtC(cup.prize)} (+ prize money per round won). Entry locked at season start. Winning a cup never promotes you.${cup.champion ? ` <b class="gold">Champion: ${name(cup.champion)}</b>` : ''}</p>
  <div class="bracket">${cup.rounds.map(rd => `<div class="col"><div class="small dim"><b>${esc(rd.name)}</b> · week ${rd.week}</div>${rd.ties.map(t => { const a = slotClub(cup, t.a), b = slotClub(cup, t.b); const cl = id => (t.winner ? (t.winner === id ? 'w' : 'l') : '') + (id === P.id ? ' me' : '');
    const f = S.fixtures[t.fid]; return `<div class="tie"><div class="${cl(a)}"><span>${name(a)}</span><b>${f && f.done ? f.res.g[0] : ''}</b></div><div class="${cl(b)}"><span>${name(b)}</span><b>${f && f.done ? f.res.g[1] : ''}</b></div></div>`; }).join('')}</div>`).join('')}</div></div>`;
};

// ---------------- history ----------------
SCREENS.history = (S) => {
  const P = me(S);
  return `<h1>Club History</h1><div class="grid g2"><div class="card"><h2>Seasons</h2><div class="tw"><table class="t"><tr><th>Season</th><th>Div</th><th class="num">Pos</th><th class="num">W-L</th><th>Notes</th></tr>
  ${S.history.seasons.slice().reverse().map(h => `<tr><td>${h.season}</td><td>${h.div}</td><td class="num">${h.pos}</td><td class="num">${h.W}-${h.L}</td><td>${h.title ? '<span class="gold">Champions</span> ' : ''}${h.move === 'promoted' ? '<span class="ok">Promoted</span>' : h.move === 'relegated' ? '<span class="bad">Relegated</span>' : ''} ${h.cups.filter(c => c.result === 'Winner').map(c => `🏆 ${esc(c.name)}`).join(' ')}</td></tr>`).join('') || '<tr><td colspan="5" class="dim">Your first season is under way.</td></tr>'}</table></div></div>
  <div class="card"><h2>Trophy cabinet</h2>${P.trophies.map(t => `<div>🏆 <b>${esc(t.name)}</b> <span class="dim small">season ${t.s}</span></div>`).join('') || '<p class="dim">No trophies yet.</p>'}
  <h2 style="margin-top:14px">Historic wins</h2>${S.history.bigWins.slice(0, 10).map(b => `<div class="small">S${b.s} W${b.w}: beat <b>${esc(b.vs)}</b> ${esc(b.score)} (${esc(b.comp)})</div>`).join('') || '<p class="dim small">Beat a much stronger club to write history.</p>'}</div>
  <div class="card"><h2>Club Legends (retired stars)</h2>${S.history.legends.map(l => `<div class="row sb small" style="padding:3px 0"><span><b>${esc(l.name)}</b> · ${ROLE_LABEL[l.role]} · Lv ${l.level}</span><span>${l.stats.apps} apps · ${l.stats.goals} G · ${l.stats.kos} KO · retired S${l.retired}</span></div>`).join('') || '<p class="dim small">Stars who retire after playing for you are honoured here.</p>'}</div>
  <div class="card"><h2>Season ${S.season} so far</h2>${cupsOf(S, P.id).map(c => `<div class="small">${esc(c.name)}</div>`).join('')}<p class="small dim">Replays of your latest matches: ${S.replays.length}. Open them from the match reports (Calendar).</p></div></div>`;
};
SCREENS.report = (S, fid) => reportView(S, fid);
SCREENS.prep = (S, fid) => prepView(S, fid);
export { ordinal, compName, cupsOf };
