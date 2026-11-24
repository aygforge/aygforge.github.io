// Match preparation, live battle (Play Match / Auto Coach), Quick Simulate, match reports and replays.
import { esc, fmtC, crest, crestURL, teamLike, toast, modal, form5, registerActions } from './common.js';
import { ROLES, ROLE_SHORT, TACTIC_LABEL, TACTIC_DESC, STYLE_LABEL, CMD_LABEL, CMD_DESC, ENGINE_VERSION, AI_POLICY_VERSION, PROFILE_LABEL } from '../data/balance.js';
import { compName, applyResult, table, fixtureSeed } from '../career/season.js';
import { avgStandardQ } from '../career/economy.js';
import { setActiveStars } from '../career/management.js';
import { playerJob, compactResult } from '../career/sim.js';
import { runMatch, createLiveWorld, E } from '../battle/run.js';
import { buildLineup, lineupPower, coachPolicy } from '../battle/adapter.js';
import { App, go, render, autosave, act, saveSettings } from './app.js';

const me = S => S.clubs[S.playerId];
export const openPrep = fid => go('prep', fid);

// ---------------- preparation ----------------
export function prepView(S, fid) {
  const f = S.fixtures[fid]; if (!f) return '<p>Unknown match.</p>';
  const P = me(S), home = f.home === P.id, O = S.clubs[home ? f.away : f.home];
  const L = buildLineup(P, S.stars, S.season, S.week);
  const OT = O.division === P.division ? table(S, O.division).find(r => r.id === O.id) : null;
  const est = avgStandardQ(O); const lo = Math.round(est - 2), hi = Math.round(est + 2);
  const stars = P.stars.map(id => S.stars[id]);
  if (f.done) return `<h1>Match played</h1><button class="btn" data-act="report" data-v="${esc(fid)}">View report</button>`;
  return `<h1>${esc(compName(S, f))}</h1>
  <div class="card hl"><div class="report-score"><div>${crest(P, 'lg')}<div><b>${esc(P.name)}</b></div><div class="small dim">${home ? 'Home' : 'Away'}</div></div><div class="sc">VS</div><div>${crest(O, 'lg')}<div><b>${esc(O.name)}</b></div><div class="small dim">Division ${O.division}${OT ? ' · ' + OT.pos + '. place' : ''}</div></div></div></div>
  <div class="grid g2" style="margin-top:14px">
  <div class="card"><h2>Scouting the opponent</h2><div class="kv"><dt>Estimated power</dt><dd>${lo}–${hi}</dd><dt>Manager style</dt><dd>${PROFILE_LABEL[O.aiProfile] || '—'}</dd><dt>Last tactic seen</dt><dd>${O.lastTactic ? TACTIC_LABEL[O.lastTactic] : 'unknown'}</dd><dt>Form</dt><dd>${form5(O.form)}</dd><dt>Stars</dt><dd>${O.stars.length}</dd><dt>Stadium</dt><dd>${esc(S.clubs[f.home].stadium)}</dd></div>
  <p class="small dim">Their match-day tactic stays hidden until kick-off — just like yours.</p></div>
  <div class="card"><h2>Your plan</h2><label class="f">Main tactic</label><div class="grid g2" style="gap:6px">${Object.keys(TACTIC_LABEL).map(t => `<button class="btn sm ${P.tactic === t ? 'on' : ''}" data-act="ptactic" data-v="${t}">${TACTIC_LABEL[t]}</button>`).join('')}</div>
  <p class="small dim">${esc(TACTIC_DESC[P.tactic])}</p>
  <label class="f">Starting style</label><div class="row">${Object.keys(STYLE_LABEL).map(t => `<button class="btn sm ${P.style === t ? 'on' : ''}" data-act="pstyle" data-v="${t}">${STYLE_LABEL[t]}</button>`).join('')}</div>
  <label class="f">Stars (max 5 play)</label><div class="row">${stars.map(s => { const on = P.activeStars.includes(s.id); return `<button class="btn sm ${on ? 'on' : ''}" data-act="pstar" data-v="${s.id}">${esc(s.name)} · ${ROLE_SHORT[s.role]} ${s.ovr.toFixed(0)}${s.injured ? ' (inj)' : ''}</button>`; }).join('') || '<span class="small dim">No stars.</span>'}</div>
  <p class="small" style="margin-top:10px">Line-up: ${ROLES.map(r => `${ROLE_SHORT[r]} ${L.units.filter(u => u.role === r).length}`).join(' · ')} · power <b>${lineupPower(L.units).toFixed(1)}</b></p>
  ${L.problems.length ? `<p class="bad small">${L.problems.map(esc).join('<br>')}</p>` : ''}</div></div>
  <div class="grid g3" style="margin-top:14px">
   <button class="btn pri" data-act="kick" data-v="play" ${L.problems.length ? 'disabled' : ''}>▶ Play Match<div class="small" style="font-weight:600">You control styles & 3 commands</div></button>
   <button class="btn acc" data-act="kick" data-v="auto" ${L.problems.length ? 'disabled' : ''}>🎥 Auto Coach<div class="small" style="font-weight:600">Watch; your assistant decides</div></button>
   <button class="btn" data-act="kick" data-v="quick" ${L.problems.length ? 'disabled' : ''}>⚡ Quick Simulate<div class="small dim" style="font-weight:600">Same battle, no drawing</div></button></div>`;
}
registerActions({
  ptactic: (d) => { me(App.S).tactic = d.v; act({ ok: true }); },
  pstyle: (d) => { me(App.S).style = d.v; act({ ok: true }); },
  pstar: (d) => { const S = App.S, P = me(S); const ids = P.activeStars.includes(d.v) ? P.activeStars.filter(x => x !== d.v) : P.activeStars.concat(d.v); act(setActiveStars(S, P, ids)); },
  kick: (d) => startMatch(App.arg, d.v),
  replay: (d) => watchReplay(+d.v)
});

// ---------------- running a match ----------------
export async function startMatch(fid, mode) {
  const S = App.S, f = S.fixtures[fid]; if (!f || f.done) return;
  const L = buildLineup(me(S), S.stars, S.season, S.week); if (L.problems.length) { toast(L.problems[0], 'bad'); return; }
  const job = playerJob(S, f, mode === 'quick' ? 'auto' : mode);
  S.lock.started = S.lock.started || {}; S.lock.started[fid] = mode; await autosave(true);
  if (mode === 'quick') {
    const m = modal('<h2>Quick Simulate</h2><p class="dim">Running the full 100 vs 100 battle without drawing it…</p><div class="progress"><i style="width:60%"></i></div>');
    await new Promise(r => setTimeout(r, 60));
    const sum = runMatch(job, { keepLog: true, keepWorld: true });
    m.remove(); finishMatch(job, sum, sum.world, 'quick');
    return;
  }
  runBattle({ job, f, mode, onEnd: (w) => finishMatch(job, E.careerSummary(w), w, mode) });
}
export function resolveAbandoned() {
  const S = App.S; if (!S || !S.lock || !S.lock.started) return;
  for (const fid of Object.keys(S.lock.started)) {
    const f = S.fixtures[fid]; if (!f || f.done) { delete S.lock.started[fid]; continue; }
    const job = playerJob(S, f, 'auto');
    const sum = runMatch(job, { keepLog: true, keepWorld: true });
    finishMatch(job, sum, sum.world, 'auto', true);
    toast('An unfinished match was completed by your assistant coach.', 'bad');
  }
}
function finishMatch(job, sum, w, mode, silent) {
  const S = App.S, f = S.fixtures[job.fid];
  const res = compactResult(job, sum);
  const deltas = applyResult(S, f, res);
  if (!deltas) { if (!silent) go('report', job.fid); return; }
  const rep = buildReport(S, f, job, sum, w, deltas[S.playerId], mode);
  S.reports = [rep].concat((S.reports || []).filter(r => r.fid !== rep.fid)).slice(0, 14);
  const userCmds = sum.cmds.filter(c => c.src === 'user');
  S.replays = [{ id: Date.now() % 1e9, fid: f.id, label: `S${f.season} W${f.week} ${compName(S, f)}: ${S.clubs[f.home].short} v ${S.clubs[f.away].short}`, engine: ENGINE_VERSION, policy: AI_POLICY_VERSION, mode,
    job: { fid: job.fid, seed: job.seed, home: job.home, away: job.away, coach: job.coach, commands: userCmds, playerSide: job.playerSide }, hash: sum.hash, winner: sum.winner, endTick: sum.endTick }].concat(S.replays || []).slice(0, 8);
  if (S.lock && S.lock.started) delete S.lock.started[f.id];
  autosave(true);
  if (!silent) go('report', f.id);
}

// ---------------- report (from real events only) ----------------
function buildReport(S, f, job, sum, w, delta, mode) {
  const side = job.playerSide, opp = 1 - side, fb = sum.football;
  const ev = w ? w.events : [];
  const unitName = id => { const u = w.units[id]; return u.starName || `${S.clubs[u.side === 0 ? f.home : f.away].short} ${u.role}`; };
  const goals = ev.filter(e => e.type === E.EV.GOAL).map(e => ({ t: +(e.t - E.TL.battleStart).toFixed(1), side: e.b, name: unitName(e.a) }));
  const kos = [0, 0]; for (const e of ev) if (e.type === E.EV.KO) kos[1 - w.units[e.b].side]++;
  // tactical comments derived from what actually happened
  const comments = [];
  const koIn = (s, t0, t1) => ev.filter(e => e.type === E.EV.KO && e.t >= t0 && e.t < t1 && w.units[e.b].side === s).length;
  for (const c of sum.cmds.filter(c => c.kind === 'cmd' && c.side === side)) {
    const won = koIn(opp, c.t, c.t + 4), lost = koIn(side, c.t, c.t + 4);
    comments.push(`${CMD_LABEL[c.v]} at ${(c.t - E.TL.battleStart).toFixed(1)}s: you eliminated ${won} and lost ${lost} in the next 4 seconds.`);
  }
  const stylesUsed = sum.cmds.filter(c => c.kind === 'style' && c.side === side).map(c => STYLE_LABEL[c.v]);
  if (stylesUsed.length) comments.push(`Style changes: ${stylesUsed.join(' → ')}.`);
  if (fb) {
    if (fb.possession[side] >= 58) comments.push(`You dominated the ball (${fb.possession[side]}% possession).`);
    else if (fb.possession[side] <= 42) comments.push(`The opponent controlled the ball (${fb.possession[opp]}% possession).`);
    if (fb.saves[opp] >= 3) comments.push(`Their goalkeepers made ${fb.saves[opp]} saves.`);
    if (fb.intercepts[side] >= 4) comments.push(`Your players intercepted ${fb.intercepts[side]} passes.`);
  }
  const ga = ev.filter(e => e.type === E.EV.GOAL_BUFF_START);
  if (ga.length) comments.push(`Goals gave ${ga.length} short +6% momentum boost${ga.length > 1 ? 's' : ''} (2.8 s, never stacking).`);
  const tbText = { alive: 'Time limit reached: decided by more players still standing.', hp: 'Time limit reached with equal numbers: decided by remaining health.', coin: 'Simultaneous elimination: decided by the deterministic sudden-death rule.' };
  const ws = sum.winner;
  const myStars = sum.stars.filter(s => s.side === side).map(s => ({ ...s, name: (S.stars[s.id] || { name: s.id }).name }));
  const oppStars = sum.stars.filter(s => s.side === opp).map(s => ({ ...s, name: (S.stars[s.id] || { name: s.id }).name }));
  return { fid: f.id, mode, s: f.season, w: f.week, comp: compName(S, f), home: f.home, away: f.away, side, won: ws === side, goals: fb ? fb.goals : [0, 0], alive: sum.alive, battleT: sum.battleT,
    tiebreak: sum.tiebreak ? tbText[sum.tiebreak] : null, stats: fb ? { shots: fb.shots, onTarget: fb.onTarget, saves: fb.saves, passes: fb.passes, passAtt: fb.passAtt, poss: fb.possession, intercepts: fb.intercepts, steals: fb.steals } : null,
    kos, goalList: goals, myStars, oppStars, cmds: sum.cmds.filter(c => c.side === side).map(c => ({ kind: c.kind, v: c.v, t: +(c.t - E.TL.battleStart).toFixed(1), src: c.src })),
    oppCmds: sum.cmds.filter(c => c.side === opp && c.kind === 'cmd').map(c => ({ v: c.v, t: +(c.t - E.TL.battleStart).toFixed(1) })),
    comments, delta: delta ? { credits: delta.credits, income: delta.income, fans: delta.fans, rep: delta.rep, xp: delta.xp, injuries: delta.injuries } : null, hash: sum.hash, seed: sum.seed };
}
export function reportView(S, fid) {
  const r = (S.reports || []).find(x => x.fid === fid); const f = S.fixtures[fid];
  if (!r) { if (f && f.done) { const H = S.clubs[f.home], A = S.clubs[f.away]; return `<h1>${esc(compName(S, f))}</h1><div class="card"><div class="report-score"><div>${crest(H, 'lg')}<div>${esc(H.name)}</div></div><div class="sc">${f.res.g[0]} - ${f.res.g[1]}</div><div>${crest(A, 'lg')}<div>${esc(A.name)}</div></div></div><p style="text-align:center">Winner: <b>${esc(S.clubs[f.res.w].name)}</b> · survivors ${f.res.a[0]} – ${f.res.a[1]} · ${f.res.t}s</p><p class="small dim" style="text-align:center">Detailed reports are kept for your latest 14 matches.</p></div>`; } return '<p>No report.</p>'; }
  const H = S.clubs[r.home], A = S.clubs[r.away], st = r.stats, mine = r.side, opp = 1 - mine;
  const rp = (S.replays || []).findIndex(x => x.fid === fid);
  const row = (l, a, b) => `<tr><td class="num">${a}</td><td style="text-align:center" class="dim">${l}</td><td>${b}</td></tr>`;
  return `<h1>Match Report</h1><div class="card hl"><div class="small dim" style="text-align:center">${esc(r.comp)} · Season ${r.s}, week ${r.w} · ${r.mode === 'play' ? 'Play Match' : r.mode === 'quick' ? 'Quick Simulate' : 'Auto Coach'}</div>
  <div class="report-score" style="margin-top:8px"><div>${crest(H, 'lg')}<div><b>${esc(H.name)}</b></div></div><div><div class="sc">${r.goals[0]} - ${r.goals[1]}</div><div class="small dim">goals</div></div><div>${crest(A, 'lg')}<div><b>${esc(A.name)}</b></div></div></div>
  <p style="text-align:center;font-size:18px" class="${r.won ? 'ok' : 'bad'}"><b>${r.won ? 'VICTORY' : 'DEFEAT'}</b> — last team standing: ${esc((r.alive[0] > r.alive[1] ? H : A).name)} with ${Math.max(r.alive[0], r.alive[1])} players left · ${r.battleT}s</p>
  ${r.tiebreak ? `<p class="small warn" style="text-align:center">${esc(r.tiebreak)}</p>` : ''}</div>
  <div class="grid g2" style="margin-top:14px"><div class="card"><h2>Battle statistics</h2><table class="t">${st ? [row('Players left', r.alive[0], r.alive[1]), row('Eliminations', r.kos[0], r.kos[1]), row('Shots on goal', st.shots[0], st.shots[1]), row('On target', st.onTarget[0], st.onTarget[1]), row('Saves', st.saves[0], st.saves[1]), row('Passes', `${st.passes[0]}/${st.passAtt[0]}`, `${st.passes[1]}/${st.passAtt[1]}`), row('Interceptions', st.intercepts[0], st.intercepts[1]), row('Tackles won', st.steals[0], st.steals[1]), row('Possession', st.poss[0] + '%', st.poss[1] + '%')].join('') : ''}</table>
   <h2 style="margin-top:12px">Goals</h2>${r.goalList.map(g => `<div class="small">${g.t}s — ${esc(g.name)} (${esc((g.side === 0 ? H : A).short)})</div>`).join('') || '<div class="small dim">No goals.</div>'}</div>
  <div class="card"><h2>Rewards</h2>${r.delta ? `<div class="kv"><dt>Credits</dt><dd class="${r.delta.credits >= 0 ? 'ok' : 'bad'}">${fmtC(r.delta.credits)}</dd><dt>· appearance / tickets / win</dt><dd>${r.delta.income.appearance} / ${r.delta.income.ticket} / ${r.delta.income.win}</dd><dt>Fans</dt><dd>${r.delta.fans >= 0 ? '+' : ''}${r.delta.fans}</dd><dt>Reputation</dt><dd>${r.delta.rep >= 0 ? '+' : ''}${r.delta.rep}</dd></div>
   ${r.delta.xp.map(x => `<div class="small">${esc(x.name)}: +${x.xp} XP${x.levels ? ` <b class="gold">→ level ${x.level}!</b>` : ''}</div>`).join('')}${r.delta.injuries.map(n => `<div class="small bad">${esc(n)} is injured for one match.</div>`).join('')}` : ''}
   <h2 style="margin-top:12px">Coach decisions</h2>${r.cmds.map(c => `<div class="small">${c.t}s · ${c.kind === 'cmd' ? CMD_LABEL[c.v] : 'Style → ' + STYLE_LABEL[c.v]}${c.src === 'coach' ? ' <span class="dim">(assistant)</span>' : ''}</div>`).join('') || '<div class="small dim">No styles or commands used.</div>'}
   ${r.oppCmds.length ? `<div class="small dim" style="margin-top:4px">Opponent commands: ${r.oppCmds.map(c => `${CMD_LABEL[c.v]} (${c.t}s)`).join(', ')}</div>` : ''}</div>
  <div class="card"><h2>Stars</h2>${r.myStars.concat(r.oppStars).map(s => `<div class="row sb small" style="padding:3px 0"><span><b>${esc(s.name)}</b> <span class="dim">${s.side === mine ? 'yours' : 'opponent'}</span></span><span>${s.goals} G · ${s.kos} KO · ${s.assists} A · ${s.saves} saves · ${s.survived ? 'survived' : 'eliminated'}</span></div>`).join('') || '<div class="small dim">No stars played.</div>'}</div>
  <div class="card"><h2>Tactical analysis</h2>${r.comments.map(c => `<div class="small">• ${esc(c)}</div>`).join('') || '<div class="small dim">A straightforward battle.</div>'}<p class="small dim mono" style="margin-top:8px">seed ${r.seed} · event hash ${esc(r.hash)} · engine ${ENGINE_VERSION}</p></div></div>
  <div class="row" style="margin-top:14px"><button class="btn acc" data-act="nav" data-v="dashboard">Continue</button>${rp >= 0 ? `<button class="btn" data-act="replay" data-v="${rp}">▶ Watch replay</button>` : ''}</div>`;
}

// ---------------- live battle screen ----------------
function runBattle({ job, f, mode, onEnd, replay }) {
  const S = App.S, st = App.settings;
  const FS = window.FWSprites, FR = window.FWRender, FD = window.FWDirector, FA = window.FWAudio;
  const teams = [job.home.team, job.away.team];
  window.FW_STADIUM_LEVEL = (S.clubs[job.home.clubId] || { fac: { stadium: 3 } }).fac.stadium;
  const kits = FS.makeKits(teams[0], teams[1], 210);
  const atlases = [FS.buildAtlas(teams[0], kits[0]), FS.buildAtlas(teams[1], kits[1])];
  const logos = [job.home, job.away].map(sn => { const c = S.clubs[sn.clubId]; return { small: FS.generatedCrest(teamLike(c), 26), big: FS.generatedCrest(teamLike(c), 96) }; });
  const w = createLiveWorld(job, st.fx);
  let cam = st.camera;
  w.observer = FD.createObserver({ smartCam: cam !== 'full', intensity: 'normal', epicFinale: true, mvpStreaks: true, fbAlerts: true, fbFollow: cam === 'ball' });
  const renderer = FR.createRenderer({ world: w, teams, kits, atlases, logos, lang: 'en', labels: st.fx > 0, story: true, hc: true, fxLevel: st.fx, v3: { vfx: st.fx > 0, finale: true, mvp: true, momentum: true }, modeLabel: f ? compName(S, f).toUpperCase() : 'REPLAY', fictional: false });
  const side = job.playerSide, ctl = mode === 'play' && !replay;
  const ov = document.createElement('div'); ov.className = 'battle';
  ov.innerHTML = `<div class="stagewrap"><canvas class="stage" width="720" height="1280"></canvas><div class="side card" id="bside"></div></div>
  <div class="hud">${ctl ? `<div class="styles">${['attack', 'balanced', 'defend'].map((s, i) => `<button class="btn" data-bs="${s}">${STYLE_LABEL[s]}<span class="kbd">${i + 1}</span><span class="cd"></span></button>`).join('')}</div>
   <div class="cmds">${['press', 'hold', 'fast'].map((c, i) => `<button class="btn" data-bc="${c}" title="${esc(CMD_DESC[c])}">${CMD_LABEL[c]}<span class="kbd">${'QWE'[i]}</span><span class="cd"></span></button>`).join('')}</div>` : `<div class="small dim" style="text-align:center">${replay ? 'Replay' : 'Auto Coach'} — your assistant is making the calls</div>`}
   <div class="meta"><span id="bstat">Commands left: 3</span><span><select id="bcam"><option value="smart">Smart Camera</option><option value="full">Full Field</option><option value="ball">Football Focus</option></select>
   <button class="btn sm" id="bsnd">${st.sound ? '🔊' : '🔈'}</button><button class="btn sm" id="bspd">${st.speed}×</button><button class="btn sm" id="bskip">Skip ⏭</button></span></div></div>`;
  document.body.appendChild(ov);
  App.view = 'battle';
  const cv = ov.querySelector('canvas'), g = cv.getContext('2d');
  ov.querySelector('#bcam').value = cam;
  let speed = st.speed, T = 0, last = performance.now(), raf = 0, ended = false, skip = false;
  // audio (1× speed only; never affects the simulation)
  let audio = null;
  const startAudio = async () => {
    if (!st.sound || !FA || audio) return;
    try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; const ctx = App.actx || (App.actx = new AC({ sampleRate: 48000 })); if (ctx.state === 'suspended') await ctx.resume();
      const { bank, loops } = FA.ensure(); const player = new FA.LivePlayer(ctx, bank, loops, { music: st.music, sfx: true }); const planner = new FA.Planner(); planner.intro(); player.start(T); player.schedule(planner.items);
      audio = { player, planner, cues: new FA.V3Cues({ crowd: true, epic: true, mvp: true }), music: false, intense: false, stopped: false }; } catch (e) { audio = null; }
  };
  const stopAudio = () => { if (audio) { try { audio.player.stopAll(); } catch (e) { /* ignore */ } audio = null; } };
  if (speed === 1) startAudio();
  const issue = (kind, v) => { if (!ctl) return; const r = E.issue(w, side, kind, v); if (!r.ok) toast(r.reason === 'cooldown' ? `Cooldown: ${r.wait.toFixed(1)} s` : r.reason, 'bad'); };
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.bs) issue('style', b.dataset.bs); else if (b.dataset.bc) issue('cmd', b.dataset.bc);
    else if (b.id === 'bsnd') { st.sound = !st.sound; saveSettings(); b.textContent = st.sound ? '🔊' : '🔈'; if (st.sound && speed === 1) startAudio(); else stopAudio(); }
    else if (b.id === 'bspd') { speed = speed === 1 ? 2 : 1; st.speed = speed; saveSettings(); b.textContent = speed + '×'; if (speed !== 1) stopAudio(); else startAudio(); }
    else if (b.id === 'bskip') { skip = true; }
  });
  ov.querySelector('#bcam').addEventListener('change', e => { cam = e.target.value; st.camera = cam; saveSettings(); const o = w.observer.state; o.smartCam = cam !== 'full'; o.fbFollow = cam === 'ball'; });
  const key = e => { const k = e.key.toLowerCase(); const m = { '1': ['style', 'attack'], '2': ['style', 'balanced'], '3': ['style', 'defend'], q: ['cmd', 'press'], w: ['cmd', 'hold'], e: ['cmd', 'fast'] }[k];
    if (m) { issue(m[0], m[1]); e.preventDefault(); } else if (k === 'c') { const s = ov.querySelector('#bcam'); s.value = { smart: 'full', full: 'ball', ball: 'smart' }[s.value]; s.dispatchEvent(new Event('change')); } else if (k === 'm') ov.querySelector('#bsnd').click(); else if (k === ' ') { ov.querySelector('#bspd').click(); e.preventDefault(); } };
  window.addEventListener('keydown', key);
  const fit = () => { const dpr = Math.min(3, window.devicePixelRatio || 1); const h = cv.clientHeight * dpr; const k = Math.max(1, Math.round(h / 640)); if (cv.height !== 640 * k) { cv.width = 360 * k; cv.height = 640 * k; } };
  const hud = () => {
    const cs = E.careerState(w, side);
    const el = ov.querySelector('#bstat'); if (el) el.textContent = `Commands left: ${cs.cmdLeft} · style ${STYLE_LABEL[cs.style]}${cs.cmd ? ' · ' + CMD_LABEL[cs.cmd] + ' ' + cs.cmdRemain.toFixed(1) + 's' : ''}`;
    ov.querySelectorAll('[data-bs]').forEach(b => { b.classList.toggle('on', b.dataset.bs === cs.style); b.querySelector('.cd').style.width = (cs.styleCd / 8 * 100) + '%'; });
    ov.querySelectorAll('[data-bc]').forEach(b => { b.classList.toggle('on', b.dataset.bc === cs.cmd); b.disabled = cs.cmdLeft <= 0; b.querySelector('.cd').style.width = (cs.cmdCd / 8 * 100) + '%'; });
    const sd = ov.querySelector('#bside'); if (sd && sd.offsetParent) {
      const fb = w.fb, os = E.careerState(w, 1 - side);
      const starsAlive = s => w.units.filter(u => u.starId && u.side === s && u.alive).length + '/' + w.units.filter(u => u.starId && u.side === s).length;
      sd.innerHTML = `<h2>Live</h2><div class="kv small"><dt>Players</dt><dd>${w.teams[0].alive} – ${w.teams[1].alive}</dd><dt>Goals</dt><dd>${fb.goals[0]} – ${fb.goals[1]}</dd><dt>Shots</dt><dd>${fb.stats.shots[0]} – ${fb.stats.shots[1]}</dd><dt>Passes</dt><dd>${fb.stats.passes[0]} – ${fb.stats.passes[1]}</dd><dt>Saves</dt><dd>${fb.stats.saves[0]} – ${fb.stats.saves[1]}</dd><dt>Stars alive</dt><dd>${starsAlive(0)} – ${starsAlive(1)}</dd><dt>Ball</dt><dd>${fb.ball.state.toLowerCase()}</dd></div>
      <h2 style="margin-top:12px">Opponent bench</h2><div class="small">Style: <b>${STYLE_LABEL[os.style]}</b>${os.cmd ? ` · <b class="warn">${CMD_LABEL[os.cmd]}</b>` : ''}<br>Commands left: ${os.cmdLeft}</div>
      <h2 style="margin-top:12px">Tactics</h2><div class="small">${esc(TACTIC_LABEL[w.teams[0].car.tactic])} vs ${esc(TACTIC_LABEL[w.teams[1].car.tactic])}</div>`;
    }
  };
  let hudT = 0;
  const frame = now => {
    if (ended) return;
    try {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (skip) { while (w.phase !== 'ended' && w.t < 80) E.step(w); T = w.endT + w.outroLen; }
      else { T += dt * speed; if (T - w.t > 0.25) T = w.t + 0.25; E.advanceTo(w, T); }
      if (audio) { const p = audio.player; p.schedule(audio.planner.feed(w)); if (!audio.music && w.phase === 'battle') { audio.music = true; p.music('calm', E.TL.battleStart); } if (!audio.intense && w.final15 >= 0 && w.phase === 'battle') { audio.intense = true; p.music('intense', w.final15); } if (!audio.stopped && w.phase === 'ended') { audio.stopped = true; p.stopMusic(w.endT + 0.25); } p.schedule(audio.cues.feed(w, w.observer && w.observer.state)); }
      fit();
      renderer.render(g, T, cv.width, cv.height);
      // star markers (presentation only)
      const v = renderer.view(); if (v && w.phase !== 'ended') { const kx = cv.width / v.sw, ky = cv.height / v.sh; for (const u of w.units) { if (!u.starId || !u.alive) continue; const x = (u.x - v.sx) * kx, y = (u.y - 17 - v.sy) * ky; if (y < 90 * ky) continue; const s = Math.max(2, kx * 1.6); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath(); g.fill(); g.strokeStyle = '#3a2a00'; g.lineWidth = Math.max(1, kx * 0.4); g.stroke(); } }
      if (now - hudT > 120) { hudT = now; hud(); }
      if (w.phase === 'ended' && T >= w.endT + w.outroLen) { close(); onEnd(w); return; }
    } catch (e) { console.error(e); close(); toast('Battle error: ' + e.message, 'bad'); return; }
    raf = requestAnimationFrame(frame);
  };
  const close = () => { ended = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', key); stopAudio(); try { renderer.dispose(); } catch (e) { /* ignore */ } ov.remove(); };
  raf = requestAnimationFrame(frame);
}

// ---------------- replays ----------------
function watchReplay(i) {
  const S = App.S, R = (S.replays || [])[i]; if (!R) return;
  if (R.engine !== ENGINE_VERSION) { toast(`This replay needs engine ${R.engine}.`, 'bad'); return; }
  const job = { ...R.job, mode: R.mode };
  const back = App.view, arg = App.arg;
  runBattle({ job, f: S.fixtures[R.fid], mode: 'auto', replay: true, onEnd: (w) => { const h = (w.hash >>> 0).toString(16); App.view = back; App.arg = arg; render(); toast(h === R.hash ? `Replay verified ✓ identical battle (hash ${h})` : `Replay mismatch (hash ${h} ≠ ${R.hash})`, h === R.hash ? 'ok' : 'bad'); } });
}
export { fixtureSeed, coachPolicy, crestURL };
