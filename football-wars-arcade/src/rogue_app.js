/* FOOTBALL WARS: ROGUELITE REBORN — FWArcadeUI (Portrait-first DOM UI), live wave loop, FWTutorial, FWArcadeAudio hooks. */
(function (root) {
'use strict';
const E = root.FWEngine, R = root.FWRogue, D = root.FWCampaignData, K = root.FWCards, LD = root.FWLeaders, S = root.FWSprites, RN = root.FWRender, AU = root.ArcadeAudio, DIR = root.FWDirector;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const MISSION = { survival: { n: 'Survival', ic: '🛡', short: 'SURVIVAL' }, goal: { n: 'Goal Challenge', ic: '⚽', short: 'GOALS' }, ko: { n: 'Total KO', ic: '💥', short: 'TOTAL KO' } };
const CAT_IC = { survival: '🛡', knockout: '💥', football: '⚽', movement: '💨', leadership: '⭐', chaos: '🌀' };
const MEDAL_N = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze', clear: 'Clear' };
const ROLE_N = { striker: 'Striker', winger: 'Winger', playmaker: 'Playmaker', defender: 'Defender', goalkeeper: 'Goalkeeper', support: 'Support', captain: 'Captain' };
const REASON = { army_ko: 'Your whole army was knocked out.', rivals_left: 'Rivals were still standing when overtime ended.', goals_missing: 'The goal target was not reached.', time: 'Survived the full 45 seconds.', all_ko: 'Every rival was knocked out.', goal_overtime: 'Goal target reached in overtime.' };
const QUALITY = { low: { fx: 0, dpr: 1 }, medium: { fx: 1, dpr: 2 }, high: { fx: 2, dpr: 3 } };
const st = { save: null, view: 'hq', ep: 1, codexCat: 'all', battle: null, storageOk: true, toastT: 0 };

// ======================= persistence =======================
function persist() { st.storageOk = R.Save.persist(st.save); if (!st.storageOk) toast('Autosave failed — export your save in Settings'); }
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(st.toastT); st.toastT = setTimeout(() => t.classList.remove('on'), 2400); }
function modal(html, opts) {
  const m = $('modal'); m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>'; m.classList.remove('hidden');
  m.dataset.lock = opts && opts.lock ? '1' : '';
}
function closeModal() { const m = $('modal'); m.classList.add('hidden'); m.innerHTML = ''; }

// ======================= sound extras (procedural, embedded) =======================
function synth(sec, fn) { const SR = 48000, n = Math.round(sec * SR), b = new Float32Array(n); let m = 0; for (let i = 0; i < n; i++) { b[i] = fn(i / SR); m = Math.max(m, Math.abs(b[i])); } if (m) for (let i = 0; i < n; i++) b[i] *= 0.85 / m; return b; }
const sq = (p, d) => (p % 1) < (d || 0.5) ? 1 : -1;
let noiseS = 7; const noise = () => { noiseS = (noiseS * 16807) % 2147483647; return noiseS / 1073741823.5 - 1; };
function addSounds() {
  if (!AU.ok || AU.buffers.rg_focus) return;
  const add = (k, d) => { const b = AU.ctx.createBuffer(1, d.length, 48000); b.copyToChannel(d, 0); AU.buffers[k] = b; };
  add('rg_focus', synth(0.35, t => sq(t * (520 + 900 * t), 0.4) * Math.exp(-t * 7) * 0.6 + Math.sin(t * 6.283 * 130) * Math.exp(-t * 10)));
  add('rg_wave', synth(0.9, t => { const k = Math.min(4, Math.floor(t / 0.1)), f = [523, 659, 784, 1047, 1319][k]; return sq(t * f, 0.3) * Math.exp(-(t - k * 0.1) * 5) * 0.5; }));
  add('rg_alarm', synth(1.1, t => sq(t * (Math.floor(t * 4) % 2 ? 330 : 247), 0.5) * 0.4 * Math.min(1, (1.1 - t) * 4) + noise() * 0.08));
  add('rg_card', synth(0.4, t => (Math.sin(t * 6.283 * 880) + sq(t * 1320, 0.25) * 0.3) * Math.exp(-t * 9)));
  add('rg_lose', synth(1.0, t => sq(t * (330 - 200 * t), 0.5) * Math.exp(-t * 2.5) * 0.5));
  add('rg_campaign', synth(2.2, t => { const k = Math.min(9, Math.floor(t / 0.16)), f = [392, 523, 659, 784, 659, 784, 1047, 1319, 1568, 2093][k]; return (sq(t * f, 0.25) * 0.4 + Math.sin(t * f * 3.14) * 0.3) * Math.exp(-(t - k * 0.16) * 3) + Math.sin(t * 98 * 6.283) * 0.2 * Math.exp(-t); }));
}
function sfx(id, g) { try { AU.init(); addSounds(); AU.play(id, g == null ? 0.6 : g); } catch (e) { /* sound is optional */ } }

// ======================= art (real game sprites) =======================
const ART = {};
function armyTeam() { return { id: 'RRB_ARMY', name: 'Survivor Army', visual: Object.assign({}, R.ARMY_VISUAL) }; }
function atlasArmy() {
  if (ART.atlas) return ART.atlas;
  const foe = { id: 'RRB_E1', name: 'Rookie', visual: { primary_color: '#e63946', secondary_color: '#ffffff' } };
  const kits = S.makeKits(armyTeam(), foe, 210); ART.atlas = S.buildAtlas(armyTeam(), kits[0]); return ART.atlas;
}
function spriteCv(role, variant, scale) {
  const at = atlasArmy(), ri = S.ROLES.indexOf(role), cv = document.createElement('canvas'); cv.width = S.CW * scale; cv.height = S.CH * scale;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(at.canvas, 0, S.rowIndex(ri, variant, false, false) * S.CH, S.CW, S.CH, 0, 0, S.CW * scale, S.CH * scale);
  return cv;
}
function crest(team, size) { return S.generatedCrest(team, size); }

// ======================= top bar / navigation =======================
function curLevel() { const s = st.save; return s.run ? s.run.level : Math.min(200, s.highest + 1); }
function topbar() {
  const s = st.save, L = R.Progress.level(curLevel()), ep = D.EPISODES[L.ep - 1];
  $('tbSub').textContent = s.campaignCompleted ? 'Campaign complete · 200/200' : 'E' + L.ep + ' ' + ep.name + ' · Level ' + L.level + (s.run ? ' · run active' : '');
  $('tbCoins').querySelector('span').textContent = fmt(s.coins);
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.nav === st.view));
}
function go(view, opt) {
  st.view = view; if (opt && opt.ep) st.ep = opt.ep;
  render(); window.scrollTo(0, 0);
}
function render() {
  const s = st.save; topbar();
  const V = { hq: viewHQ, map: viewMap, training: viewTraining, codex: viewCodex, leaders: viewLeaders, trophy: viewTrophy, settings: viewSettings, run: viewRun, result: viewResult, complete: viewComplete }[st.view] || viewHQ;
  $('screen').innerHTML = V(s);
  document.body.classList.toggle('rm', !!s.settings.reduceMotion);
  const ac = $('screen').querySelector('[data-crest]'); if (ac) ac.replaceWith(crest(armyTeam(), 44));
  $('screen').querySelectorAll('[data-sprite]').forEach(el => { const [role, v] = el.dataset.sprite.split(':'); const cv = spriteCv(role, +v || 0, 3); cv.className = el.className; el.replaceWith(cv); });
}

// ======================= FWTutorial (contextual, once, archived) =======================
function tipSeen(id) { return !!st.save.tips[id]; }
function tipHTML(id) {
  if (tipSeen(id) || !D.TIPS[id]) return '';
  const t = D.TIPS[id]; return '<div class="tip" data-tipbox="' + id + '"><b>💡 ' + esc(t.t) + '</b>' + esc(t.x) + '<button class="x" data-tipx="' + id + '" aria-label="Dismiss tip">✕</button></div>';
}
function markTip(id) { if (!st.save.tips[id]) { st.save.tips[id] = Date.now(); persist(); } }
const LEVEL_TIPS = { 1: ['army'], 2: ['training', 'focus'], 3: ['training', 'focus'], 6: ['soft_wall'], 7: ['goal_ch'], 9: ['elite_ko'], 14: ['soft_goal'], 17: ['elite_surv'], 20: ['boss'] };
const CLEAR_TIPS = { 5: 'pao', 10: 'quick_pass', 15: 'nazar', 19: 'counter' };
function levelTips(n) { return (LEVEL_TIPS[n] || []).map(tipHTML).join(''); }

// ======================= Arcade HQ =======================
function viewHQ(s) {
  if (s.campaignCompleted && !s.run) return viewHQComplete(s);
  const n = curLevel(), L = R.Progress.level(n), ep = D.EPISODES[L.ep - 1], M = MISSION[L.mission];
  const nu = R.Progress.nextUnlock(s);
  const run = s.run;
  const tags = [pillKind(L), '<span class="pill">' + M.ic + ' ' + M.n + '</span>', L.soft ? '<span class="pill gold">SOFT WALL</span>' : '', L.hard ? '<span class="pill coral">HARD WALL</span>' : ''].join('');
  let h = levelTips(n) + (s.highest >= 1 && s.highest < 4 ? tipHTML('training') : '');
  h += '<div class="hero"><span data-crest class="army"></span><div class="ep">Episode ' + L.ep + ' · ' + esc(ep.name) + '</div><h1>Level ' + L.level + '</h1><div class="lv">' + tags + '</div>' +
    '<div class="small dim" style="margin-bottom:12px">' + L.waves + ' waves · ' + L.counts.join(' → ') + ' rivals' + (L.mission === 'goal' ? ' · ' + L.goalTarget + ' real goals' : '') + (L.boss ? ' · Boss: ' + esc(L.boss.name) : '') + '</div>' +
    (run ? '<button class="btn primary big block" data-act="continue">▶ CONTINUE</button><div class="small dim center" style="margin-top:6px">' + runStatus(run) + '</div>'
      : '<button class="btn primary big block" data-act="brief" data-level="' + n + '">▶ PLAY</button>') +
    '<div class="stat3"><div><b>' + s.highest + '<span class="dim small">/200</span></b><small>Cleared</small></div><div><b>' + Object.keys(s.cups).length + '<span class="dim small">/10</span></b><small>Boss Cups</small></div><div><b>' + s.cards.length + '<span class="dim small">/48</span></b><small>Cards</small></div></div></div>';
  h += '<div class="title">Next unlocks</div>' + (nu.length ? nu.map(u => '<div class="card row"><span style="font-size:24px">' + (u.kind === 'leader' ? '⭐' : '🃏') + '</span><div class="grow"><b>' + esc(u.name) + '</b><div class="small dim">' + (u.kind === 'leader' ? 'Star Leader' : 'Card · ' + K.CAT_NAME[K.BY_ID[u.id].cat] + ' · ' + K.BY_ID[u.id].rarity) + '</div></div><span class="pill">Clear L' + u.level + '</span></div>').join('') : '<div class="card small dim">Every card and leader is unlocked.</div>');
  const lr = s.lastResult;
  if (lr && lr.kind !== 'abandon') h += '<div class="title">Last attempt</div><div class="card row"><span style="font-size:24px">' + (lr.kind === 'win' ? '🏁' : '✖') + '</span><div class="grow"><b>Level ' + lr.level + ' · ' + (lr.kind === 'win' ? 'Victory · ' + MEDAL_N[lr.medal] + ' (' + lr.survivors + ' survivors)' : 'Defeat') + '</b><div class="small dim">+' + fmt(lr.coins) + ' Coins</div></div></div>';
  h += '<div class="title">Your army</div><div class="card small">100 players every attempt: 16 strikers, 14 wingers, 12 playmakers, 34 defenders, 8 keepers, 15 supports, 1 captain. ' +
    'Leaders unlocked: <b>' + s.leaders.length + '/5</b>. Training avg level <b>' + Math.round(D.TRAINING.stats.reduce((a, k) => a + s.training[k], 0) / 5) + '</b>.</div>';
  return h;
}
function viewHQComplete(s) {
  return '<div class="hero center"><div class="ep">Campaign Complete</div><h1>Legend of 200 Levels</h1><div class="confetti">🏆</div><div class="small dim">All 200 levels cleared. No new levels exist after Level 200 — your records stay here forever.</div>' +
    '<div class="stat3"><div><b>200/200</b><small>Levels</small></div><div><b>' + Object.keys(s.cups).length + '/10</b><small>Cups</small></div><div><b>' + s.cards.length + '/48</b><small>Cards</small></div></div>' +
    '<div class="btns" style="margin-top:12px"><button class="btn gold" data-act="complete">Campaign summary</button><button class="btn" data-nav="trophy">Career archive</button></div></div>';
}
function pillKind(L) { return L.kind === 'boss' ? '<span class="pill coral">BOSS</span>' : L.kind === 'elite' ? '<span class="pill purple">ELITE</span>' : '<span class="pill">NORMAL</span>'; }
function runStatus(run) {
  const L = R.Progress.level(run.level), alive = R.Army.alive(run.roster);
  const ph = { draft: 'choosing a card', ready: 'wave ' + (run.wave + 1) + ' ready', battle: 'wave ' + (run.wave + 1) + ' in progress', clear: 'wave ' + run.wave + ' cleared', over: 'result pending' }[run.phase];
  return 'Level ' + run.level + ' · attempt ' + run.attempt + ' · ' + alive + ' survivors · ' + ph + (L.mission === 'goal' ? ' · goals ' + run.goals + '/' + L.goalTarget : '');
}

// ======================= Episode Map =======================
function viewMap(s) {
  const ep = st.ep, E0 = D.EPISODES[ep - 1], unl = e => (e - 1) * 20 <= s.highest;
  let h = '<div class="eps">' + D.EPISODES.map(e => '<button data-ep="' + e.n + '" class="' + (e.n === ep ? 'on' : '') + (unl(e.n) ? '' : ' lock') + '" aria-label="Episode ' + e.n + '">E' + e.n + '</button>').join('') + '</div>';
  const lv = D.LEVELS.filter(l => l.ep === ep), done = lv.filter(l => s.completed[l.level]).length;
  h += '<div class="title"><span>E' + ep + ' · ' + esc(E0.name) + '</span><span class="sp"></span><span class="pill">' + done + '/20</span></div>';
  h += '<div class="small dim" style="margin:-4px 2px 10px">Rival tactics: ' + E0.tactics.map(t => esc(D.TACTICS[t].name)).join(' · ') + '</div>';
  h += '<div class="nodes">' + lv.map(l => {
    const stt = R.Progress.state(s, l.level), rec = s.completed[l.level];
    const tg = (l.kind === 'elite' ? '<span class="e">ELITE</span>' : l.kind === 'boss' ? '<span class="b">BOSS</span>' : '') + (l.soft ? '<span class="s">SOFT</span>' : '') + (l.hard ? '<span class="h">HARD</span>' : '');
    return '<button class="node ' + stt + (l.kind === 'boss' ? ' boss' : '') + '" data-node="' + l.level + '" aria-label="Level ' + l.level + ' ' + MISSION[l.mission].n + ' ' + l.kind + (l.soft ? ' soft wall' : '') + (l.hard ? ' hard wall' : '') + ' ' + stt + '">' +
      (rec ? '<i class="md ' + rec.medal + '"></i>' : '') + '<span class="ic">' + (stt === 'locked' ? '🔒' : MISSION[l.mission].ic) + '</span><span class="n">' + l.level + '</span><span class="tg">' + tg + '</span></button>';
  }).join('') + '</div>';
  h += '<div class="small dim" style="margin-top:10px">🛡 Survival · ⚽ Goal Challenge · 💥 Total KO · medal dot = Survivor Medal of your first clear. Cleared levels cannot be replayed.</div>';
  return h;
}
function briefing(n) {
  const s = st.save, L = R.Progress.level(n), stt = R.Progress.state(s, n);
  if (stt === 'done') return recordModal(n);
  const M = MISSION[L.mission], E0 = D.EPISODES[L.ep - 1];
  const rules = L.mission === 'survival' ? 'Survive each 45 s wave with at least one player — or K.O. every rival. Goals give a small boost but never end the wave.'
    : L.mission === 'goal' ? 'Score <b>' + L.goalTarget + ' real goals</b> in total across all waves, and survive the final wave. Earlier waves end like Survival. In the final wave, if the target is still missing after 45 s, you get up to 10 s overtime.'
    : 'K.O. <b>every rival</b> in every wave within 45 s (+ up to 10 s overtime).';
  const base = R.Economy.levelBase(L), rw = R.Progress.rewardsOf(n);
  const waves = L.counts.map((c, i) => { const t = D.TACTICS[L.tactics[i]]; return '<div class="card" style="padding:8px 10px;margin-bottom:6px"><div class="row"><b class="grow">Wave ' + (i + 1) + ' · ' + c + ' rivals</b><span class="pill">' + esc(t.name) + '</span></div><div class="tiny dim">' + esc(L.boss ? L.boss.plan[i] + ' — ' : '') + esc(t.desc) + '</div></div>'; }).join('');
  const lead = s.leaders.map(id => LD.BY_ID[id].name).join(', ');
  modal('<div class="runhead">' + pillKind(L) + '<span class="pill">' + M.ic + ' ' + M.n + '</span>' + (L.soft ? '<span class="pill gold">SOFT WALL</span>' : '') + (L.hard ? '<span class="pill coral">HARD WALL</span>' : '') + '</div>' +
    '<h2>Level ' + n + (L.boss ? ' · ' + esc(L.boss.name) : '') + '</h2><div class="small dim">Episode ' + L.ep + ' · ' + esc(E0.name) + '</div>' + levelTips(n) +
    '<p class="small">' + rules + '</p>' + waves +
    '<div class="kv" style="margin:8px 0"><span>First-clear reward</span><b>' + fmt(base) + ' Coins + medal bonus (max +10%)</b><span>Defeat</span><b>' + fmt(R.Economy.fail(L, 0).coins) + '–' + fmt(R.Economy.fail(L, L.waves - 1).coins) + ' Coins</b>' +
    rw.map(u => '<span>Unlock</span><b class="gold-t">' + (u.kind === 'card' ? '🃏 ' + esc(K.BY_ID[u.id].name) : u.kind === 'leader' ? '⭐ ' + esc(LD.BY_ID[u.id].name) : '🏆 ' + esc(D.BOSSES[u.id].cup)) + '</b>').join('') + '</div>' +
    '<div class="small dim">Leaders in your army: ' + esc(lead) + '</div>' +
    (stt === 'open' ? (s.run ? '<p class="coral small">Finish or abandon your current run first.</p>' : '<button class="btn primary block big" data-act="start" data-level="' + n + '" style="margin-top:12px">▶ START LEVEL ' + n + '</button>') : '<p class="dim small center" style="margin-top:12px">🔒 Clear Level ' + (s.highest + 1) + ' first.</p>') +
    '<button class="btn block" data-act="close" style="margin-top:8px">Close</button>');
}
function recordModal(n) {
  const r = st.save.completed[n], L = R.Progress.level(n);
  if (!r || !r.medal) { modal('<h2>Level ' + n + '</h2><p class="dim">Cleared.</p><button class="btn block" data-act="close">Close</button>'); return; }
  const tr = D.TRAINING.stats.map(k => D.TRAINING.names[k].slice(0, 3) + ' ' + r.training[k]).join(' · ');
  modal('<h2>Level ' + n + ' · first clear</h2><div class="runhead">' + pillKind(L) + '<span class="pill">' + MISSION[L.mission].ic + ' ' + MISSION[L.mission].n + '</span>' + (r.cup ? '<span class="pill gold">🏆 ' + esc(r.cup) + '</span>' : '') + '</div>' +
    '<div class="medal ' + r.medal + '">' + MEDAL_N[r.medal][0] + '</div><div class="center"><b>' + MEDAL_N[r.medal] + ' Survivor Medal</b> · ' + r.survivors + ' survivors</div>' +
    '<div class="kv" style="margin-top:10px"><span>Survivors after each wave</span><b>' + r.waveSurvivors.join(' → ') + '</b><span>Leaders alive</span><b>' + (r.leadersAlive.map(id => LD.BY_ID[id].name).join(', ') || '—') + '</b>' +
    '<span>Real goals</span><b>' + r.goals + '</b><span>Tactical Focus</span><b>' + (r.focus.map(f => 'W' + (f.wave + 1) + ' ' + f.f.toUpperCase()).join(', ') || '—') + '</b><span>Coins earned</span><b>' + fmt(r.coins) + '</b>' +
    '<span>Attempt</span><b>#' + r.attempt + '</b><span>Training</span><b class="tiny">' + tr + '</b><span>Cleared</span><b>' + new Date(r.at).toLocaleString() + '</b></div>' +
    '<div class="title">Cards</div><div class="small">' + (r.cards.map(c => esc(K.BY_ID[c.id].name) + ' ' + 'I'.repeat(c.rank)).join(' · ') || '—') + '</div>' +
    '<p class="tiny dim">First-clear records are permanent. Cleared levels cannot be replayed.</p><button class="btn block" data-act="close">Close</button>');
}

// ======================= Training =======================
function viewTraining(s) {
  const lockRun = !!s.run, ro = s.campaignCompleted;
  let h = tipHTML('training') + '<div class="title"><span>Permanent Training</span><span class="sp"></span><span class="pill gold">¢ ' + fmt(s.coins) + '</span></div>';
  if (ro) h += '<div class="card small gold-t">Campaign complete — Training is read-only.</div>';
  else if (lockRun) h += '<div class="card small coral">Training is closed during an active run. Finish or abandon Level ' + s.run.level + ' first.</div>';
  h += D.TRAINING.stats.map(k => {
    const L = s.training[k], v = R.Training.value(k, L), c = R.Training.cost(L), tier = D.TRAINING.tiers[R.Training.tier(L)], chk = R.Training.canBuy(s, k);
    const nextV = c != null ? R.Training.value(k, L + 1) : null;
    return '<div class="card"><div class="trow"><div class="nm"><b>' + D.TRAINING.names[k] + '</b><small>Level ' + L + '/100 · ' + tier + ' · value ' + v.toFixed(1) + (nextV ? ' → ' + nextV.toFixed(1) : '') + '</small></div>' +
      '<button class="btn ' + (chk.ok ? 'gold' : '') + '" data-train="' + k + '"' + (chk.ok ? '' : ' disabled') + ' aria-label="Train ' + D.TRAINING.names[k] + '">' + (c == null ? 'MAX' : '¢ ' + fmt(c)) + '</button></div>' +
      '<div class="bar" style="margin-top:8px"><i style="width:' + L + '%"></i></div></div>';
  }).join('');
  h += '<div class="small dim">Tiers: Rookie 1–20 (+0.60/level) · Professional 21–40 (+0.48) · Elite 41–60 (+0.38) · Master 61–80 (+0.30) · Legendary 81–100 (+0.24). Breakthroughs are free. ' +
    'Attack → damage · Defense → HP & armour, keepers · Speed → movement & attack rate · Technique → shots, passes, crits · Stamina → HP, stamina drain, knockback. Rivals never read your Training.</div>';
  return h;
}

// ======================= Card Codex =======================
function cardHTML(c, rank, opts) {
  opts = opts || {};
  const locked = opts.locked, v = R.cardFx(c.id, Math.max(1, rank || 1));
  const rk = '<div class="ranks">' + [1, 2, 3].map(i => '<i class="' + (i <= (opts.cur || 0) ? 'on' : i === opts.next ? 'new' : '') + '"></i>').join('') + '</div>';
  return '<' + (opts.btn ? 'button data-pick="' + c.id + '"' : 'div') + ' class="gcard ' + c.rarity + (locked ? ' locked' : '') + '"><div class="art">' + (locked ? '🔒' : CAT_IC[c.cat]) + '</div><div class="grow"><div class="row"><h3 class="grow">' + esc(c.name) + '</h3><span class="tiny r-' + c.rarity + '">' + c.rarity.toUpperCase() + '</span></div>' +
    '<div class="tiny dim">' + K.CAT_NAME[c.cat] + ' · ' + c.id + (opts.rankLabel ? ' · ' + opts.rankLabel : '') + '</div>' + (locked ? '<p class="dim">Unlocks by clearing Level ' + c.unlock + '.</p>' : '<p>' + esc(c.desc(v)) + '</p>') + (opts.ranks !== false && !locked ? rk : '') + (opts.extra || '') + '</div></' + (opts.btn ? 'button' : 'div') + '>';
}
function viewCodex(s) {
  const cats = ['all'].concat(K.CATEGORIES);
  let h = '<div class="title"><span>Card Codex</span><span class="sp"></span><span class="pill">' + s.cards.length + '/48 discovered</span></div>';
  h += '<div class="chips">' + cats.map(c => '<button data-cat="' + c + '" class="' + (st.codexCat === c ? 'on' : '') + '">' + (c === 'all' ? 'All' : CAT_IC[c] + ' ' + K.CAT_NAME[c]) + '</button>').join('') + '</div>';
  const list = K.CARDS.filter(c => st.codexCat === 'all' || c.cat === st.codexCat);
  h += list.map(c => {
    const known = s.cards.indexOf(c.id) >= 0;
    const extra = known ? '<details class="tiny" style="margin-top:6px"><summary class="dim">Rank I / II / III</summary>' + [1, 2, 3].map(r => '<div>' + 'I'.repeat(r) + ': ' + esc(c.desc(R.cardFx(c.id, r))) + '</div>').join('') + '</details>' : '';
    return cardHTML(c, 1, { locked: !known, ranks: false, extra, rankLabel: known ? (c.unlock ? 'from L' + c.unlock : 'starter') : '' });
  }).join('');
  h += '<div class="small dim">Cards are temporary: drafted during an attempt, they reset when it ends. Rank III is the maximum; a Rank III card is never offered again in that run.</div>';
  return h;
}

// ======================= Star Leaders =======================
function viewLeaders(s) {
  let h = '<div class="title"><span>Star Leaders</span><span class="sp"></span><span class="pill">' + s.leaders.length + '/5</span></div>';
  h += '<div class="small dim" style="margin:-2px 2px 10px">Unlocked leaders automatically replace a standard player of their role in every new attempt (still exactly 100 players). Their synergy works only while they stand.</div>';
  h += LD.LEADERS.map(l => {
    const on = s.leaders.indexOf(l.id) >= 0, card = K.BY_ID[l.card];
    return '<div class="card lead' + (on ? '' : ' locked') + '" style="' + (on ? '' : 'opacity:.55') + '"><span data-sprite="' + l.role + ':' + (LD.LEADERS.indexOf(l) % 6) + '"></span><div class="grow"><div class="row"><b class="grow">' + esc(l.name) + '</b>' + (on ? '<span class="pill gold">UNLOCKED</span>' : '<span class="pill">🔒 Clear L' + l.unlock + '</span>') + '</div>' +
      '<div class="small dim">' + ROLE_N[l.role] + ' · +25% HP, slightly stronger · signature card: <b class="r-' + card.rarity + '">' + esc(card.name) + '</b></div><div class="small" style="margin-top:4px">' + esc(l.syn) + '</div></div></div>';
  }).join('');
  const ach = s.achievements;
  h += '<div class="title">Command achievements</div><div class="card small"><div class="kv"><span>Unbroken Command (all run-start leaders alive at victory)</span><b>' + ((ach.unbroken || []).length) + '</b>' +
    '<span>Perfect Command (all 5 alive)</span><b>' + ((ach.perfect || []).length) + '</b><span>Last Captain Standing (only one leader alive)</span><b>' + ((ach.last_captain || []).length) + '</b></div><div class="tiny dim" style="margin-top:6px">Cosmetic archive records only.</div></div>';
  return h;
}

// ======================= Career / Trophy Hall =======================
function viewTrophy(s) {
  const med = { gold: 0, silver: 0, bronze: 0, clear: 0 }; for (const k in s.completed) if (s.completed[k].medal) med[s.completed[k].medal]++;
  let h = '<div class="title">Boss Cups</div><div class="cups">' + D.CUPS.map(c => '<div class="cup' + (s.cups[c.level] ? ' on' : '') + '"><b>🏆</b>' + esc(c.name.replace(' Cup', '')) + '<div class="dim">L' + c.level + '</div></div>').join('') + '</div>';
  h += '<div class="title">Career</div><div class="card"><div class="kv"><span>Levels cleared</span><b>' + s.highest + '/200</b><span>Medals</span><b>🥇' + med.gold + ' 🥈' + med.silver + ' 🥉' + med.bronze + ' ⚪' + med.clear + '</b>' +
    '<span>Cards discovered</span><b>' + s.cards.length + '/48</b><span>Leaders</span><b>' + s.leaders.length + '/5</b><span>Attempts (wins / defeats / abandoned)</span><b>' + s.stats.runs + ' (' + s.stats.wins + ' / ' + s.stats.fails + ' / ' + s.stats.abandons + ')</b>' +
    '<span>Real goals scored</span><b>' + fmt(s.stats.goals) + '</b><span>Rivals knocked out</span><b>' + fmt(s.stats.kos) + '</b><span>Coins earned</span><b>' + fmt(s.stats.coinsEarned) + '</b></div></div>';
  h += '<div class="title">First-clear archive</div>';
  const eps = D.EPISODES.filter(e => s.completed[(e.n - 1) * 20 + 1]);
  if (!eps.length) h += '<div class="card small dim">Clear a level to start your archive.</div>';
  for (const e of eps) {
    h += '<div class="card"><b>E' + e.n + ' · ' + esc(e.name) + '</b><div class="row wrap" style="margin-top:6px;gap:4px">' + D.LEVELS.filter(l => l.ep === e.n && s.completed[l.level]).map(l => '<button class="pill" style="min-height:36px" data-node="' + l.level + '"><i class="md ' + s.completed[l.level].medal + '" style="width:9px;height:9px;border-radius:50%;display:inline-block"></i>' + l.level + '</button>').join('') + '</div></div>';
  }
  if (s.campaignCompleted) h += '<button class="btn gold block" data-act="complete">Campaign Complete summary</button>';
  return h;
}

// ======================= Settings =======================
function viewSettings(s) {
  const set = s.settings;
  const sl = (k, n) => '<div class="row" style="min-height:44px"><span class="grow">' + n + '</span><input type="range" min="0" max="100" value="' + Math.round(set[k] * 100) + '" data-set="' + k + '" aria-label="' + n + '" style="width:45%"></div>';
  const ck = (k, n) => '<label class="row" style="min-height:44px"><input type="checkbox" data-set="' + k + '"' + (set[k] ? ' checked' : '') + ' style="width:22px;height:22px"><span>' + n + '</span></label>';
  let h = '<div class="title">Sound</div><div class="card">' + sl('master', 'Master') + sl('music', 'Music') + sl('sfx', 'Battle & UI') + sl('crowd', 'Crowd') + ck('mute', 'Mute all sound') + ck('vibration', 'Vibration (if supported)') + '</div>';
  h += '<div class="title">Visuals</div><div class="card"><div class="chips">' + ['low', 'medium', 'high'].map(q => '<button data-vfx="' + q + '" class="' + (set.vfx === q ? 'on' : '') + '">VFX ' + q + '</button>').join('') + '</div>' + ck('reduceMotion', 'Reduce motion (no camera zoom, no shake)') +
    '<div class="tiny dim">Graphics and sound never change battle results: the simulation runs at a fixed 60 Hz.</div></div>';
  h += '<div class="title">Help archive</div><div class="card">' + Object.keys(D.TIPS).map(id => '<details style="margin-bottom:6px"><summary>' + (tipSeen(id) ? '✓ ' : '') + esc(D.TIPS[id].t) + '</summary><div class="small dim">' + esc(D.TIPS[id].x) + '</div></details>').join('') + '<button class="btn block" data-act="resettips">Show tips again</button></div>';
  h += '<div class="title">Save</div><div class="card"><div class="btns"><button class="btn" data-act="export">Export JSON</button><button class="btn" data-act="import">Import JSON</button></div>' +
    '<div class="tiny dim" style="margin-top:6px">' + (st.storageOk ? 'Autosave ON (' + R.Save.KEY + ' + backup).' : '<span class="coral">Autosave is not available in this browser — export regularly.</span>') + ' Imports are validated before they replace anything.</div>' +
    '<button class="btn danger block" data-act="reset" style="margin-top:8px">Delete save…</button></div>';
  const v = R.Validation.run();
  h += '<div class="title">Diagnostics</div><div class="card small"><b class="' + (v.ok ? 'mint' : 'coral') + '">' + (v.ok ? '✓ All ' + v.checks.length + ' data checks pass' : '✖ Data check failed') + '</b>' +
    '<details><summary class="dim">Details</summary>' + v.checks.map(c => '<div>' + (c.ok ? '✓' : '✖') + ' ' + esc(c.name) + '</div>').join('') + '</details></div>';
  h += '<div class="tiny dim center">Football Wars: Roguelite Reborn · built on the Football Wars V4 engine · fictional players and teams.</div>';
  return h;
}

// ======================= run flow screens =======================
function viewRun(s) {
  const run = s.run; if (!run) { st.view = 'hq'; return viewHQ(s); }
  const L = R.Progress.level(run.level), M = MISSION[L.mission], alive = R.Army.alive(run.roster);
  let h = '<div class="runhead">' + pillKind(L) + '<span class="pill">' + M.ic + ' ' + M.n + '</span><span class="pill">Level ' + L.level + '</span><span class="pill">Attempt ' + run.attempt + '</span>' + (L.mission === 'goal' ? '<span class="pill gold">⚽ ' + run.goals + '/' + L.goalTarget + '</span>' : '') + '</div>';
  h += '<div class="wavegrid">' + L.counts.map((c, i) => '<div class="' + (i < run.wave ? 'done' : i === run.wave ? 'now' : '') + '"><b>' + c + '</b>W' + (i + 1) + (i < run.waveLog.length ? ' ✓' : '') + '</div>').join('') + '</div>';
  h += '<div class="row small" style="margin-bottom:4px"><span class="grow">Survivors</span><b class="cyan">' + alive + '/100</b></div><div class="armybar"><i style="width:' + alive + '%"></i></div>';
  if (run.phase === 'draft') {
    const off = run.draft.offer || [];
    h += tipHTML('first_card');
    h += '<div class="title"><span>Choose a card' + (run.draft.left > 1 ? ' (1 of ' + run.draft.left + ')' : '') + '</span><span class="sp"></span><span class="tiny dim">' + (run.wave === 0 ? 'before wave 1' : 'after wave ' + run.wave) + '</span></div>';
    h += off.map(id => { const c = K.BY_ID[id], cur = run.cards[id] || 0; return cardHTML(c, cur + 1, { btn: true, cur, next: cur + 1, rankLabel: cur ? 'Rank ' + 'I'.repeat(cur) + ' → ' + 'I'.repeat(cur + 1) : 'NEW · Rank I' }); }).join('');
    if (off.length < 3) h += '<div class="small dim">Only ' + off.length + ' eligible card' + (off.length === 1 ? '' : 's') + ' left (Rank III cards are not offered again).</div>';
    if (!off.length) h += '<button class="btn primary block" data-act="skipdraft">Continue</button>';
  } else if (run.phase === 'ready') {
    const t = D.TACTICS[L.tactics[run.wave]];
    h += (run.level === 1 && run.wave === 0 ? tipHTML('waves') : '') + (run.level <= 3 ? tipHTML('focus') : '');
    h += '<div class="card" style="margin-top:10px"><div class="tiny dim">NEXT</div><h2>Wave ' + (run.wave + 1) + '/' + L.waves + (run.wave === L.waves - 1 ? ' · FINAL' : '') + '</h2><div class="row" style="margin-top:4px"><b class="grow">' + L.counts[run.wave] + ' rivals · ' + esc(t.name) + '</b>' + (L.boss ? '<span class="pill coral">' + esc(L.boss.plan[run.wave]) + '</span>' : '') + '</div><div class="small dim">' + esc(t.desc) + '</div>' +
      '<div class="small" style="margin-top:6px">' + (L.mission === 'ko' ? 'K.O. all ' + L.counts[run.wave] + ' rivals within 45 s (+10 s overtime).' : L.mission === 'goal' && run.wave === L.waves - 1 ? 'Final wave: reach ' + L.goalTarget + ' goals (you have ' + run.goals + ') and survive.' : 'Survive 45 s or K.O. every rival.') + '</div></div>';
    h += '<button class="btn primary big block" data-act="wave">⚔ START WAVE ' + (run.wave + 1) + '</button>';
  } else if (run.phase === 'clear' && run.clear) {
    const c = run.clear;
    h += '<div class="result" style="margin-top:10px"><div class="tiny dim">WAVE ' + (c.wave + 1) + ' CLEARED</div><div class="big-num cyan">' + c.end + '</div><div class="small">survivors (' + c.start + ' → ' + c.end + ')</div>' +
      '<div class="kv" style="margin-top:10px;text-align:left"><span>Rivals knocked out</span><b>' + c.kos + '/' + c.enemies + '</b><span>Players lost (gone for this attempt)</span><b class="coral">' + c.lost + '</b><span>Real goals</span><b>' + c.goals[0] + ' – ' + c.goals[1] + '</b>' +
      '<span>How</span><b>' + esc(REASON[c.reason] || c.reason) + '</b><span>Between-wave healing</span><b class="mint">+' + Math.round(c.heal.pct * 100) + '% max HP</b>' + (c.emergency ? '<span>Emergency keeper</span><b>A defender took the gloves</b>' : '') + '</div></div>';
    h += '<button class="btn primary big block" data-act="afterclear" style="margin-top:10px">CONTINUE ▸</button>';
  } else if (run.phase === 'battle') {
    h += '<div class="card" style="margin-top:10px"><b>Wave ' + (run.wave + 1) + ' in progress</b><div class="small dim">It resumes exactly where it was saved.</div></div><button class="btn primary big block" data-act="resume">▶ RESUME WAVE</button>';
  }
  const cards = Object.keys(run.cards);
  h += '<div class="title"><span>Run cards</span><span class="sp"></span><span class="tiny dim">reset when the attempt ends</span></div><div class="card small">' + (cards.length ? cards.map(id => '<span class="pill r-' + K.BY_ID[id].rarity + '" style="margin:2px">' + CAT_IC[K.BY_ID[id].cat] + ' ' + esc(K.BY_ID[id].name) + ' ' + 'I'.repeat(run.cards[id]) + '</span>').join('') : '<span class="dim">None yet.</span>') + '</div>';
  const ld = run.roster.filter(u => u.leader);
  if (ld.length) h += '<div class="title">Leaders</div><div class="card small">' + ld.map(u => '<span class="pill ' + (u.alive ? 'gold' : '') + '" style="margin:2px">' + (u.alive ? '⭐ ' : '✖ ') + esc(u.name) + (u.alive ? ' ' + Math.round(u.hp / u.maxHp * 100) + '%' : ' K.O.') + '</span>').join('') + '</div>';
  if (run.phase !== 'battle') h += '<button class="btn danger block" data-act="abandon" style="margin-top:14px">Abandon attempt (0 Coins)</button>';
  return h;
}
function viewResult(s) {
  const r = s.lastResult; if (!r) { st.view = 'hq'; return viewHQ(s); }
  const L = R.Progress.level(r.level);
  if (r.kind === 'win') {
    const p = r.pay;
    let h = '<div class="result win"><div class="tiny gold-t">LEVEL ' + r.level + ' CLEARED</div><h1 class="confetti" style="font-size:30px">VICTORY</h1><div class="medal ' + r.medal + '">' + MEDAL_N[r.medal][0] + '</div><b>' + MEDAL_N[r.medal] + ' Survivor Medal</b><div class="small">' + r.survivors + ' survivors</div>' +
      '<div class="kv" style="margin-top:12px;text-align:left"><span>Base reward</span><b>' + fmt(p.base) + '</b><span>Medal bonus</span><b>+' + Math.round(p.medalBonus * 100) + '%</b><span>Leader protection</span><b>+' + (p.leaderBonus * 100).toFixed(1) + '%</b><span>Total bonus (max 10%)</span><b>+' + (p.bonus * 100).toFixed(1) + '%</b><span>Coins</span><b class="gold-t">+' + fmt(r.coins) + '</b></div>';
    if (r.cup) h += '<div class="card" style="margin-top:10px"><span style="font-size:30px">🏆</span><br><b class="gold-t">' + esc(r.cup) + '</b> won!</div>';
    for (const u of r.unlocks) h += '<div class="card" style="margin-top:6px">' + (u.kind === 'card' ? '🃏 New card discovered: <b class="r-' + K.BY_ID[u.id].rarity + '">' + esc(K.BY_ID[u.id].name) + '</b><div class="tiny dim">It joins your offers from your next attempt.</div>' : '⭐ New Star Leader: <b class="gold-t">' + esc(LD.BY_ID[u.id].name) + '</b><div class="tiny dim">Joins every new attempt as ' + ROLE_N[LD.BY_ID[u.id].role] + '.</div>') + '</div>';
    for (const a of r.achievements) h += '<div class="pill gold" style="margin:6px 2px">' + { unbroken: 'Unbroken Command', perfect: 'Perfect Command', last_captain: 'Last Captain Standing' }[a] + '</div>';
    h += '<div class="small dim" style="margin-top:8px">Survivors per wave: ' + r.run.waveLog.map(w => w.end).join(' → ') + '</div></div>';
    h += (CLEAR_TIPS[r.level] ? tipHTML(CLEAR_TIPS[r.level]) : '');
    h += r.campaign ? '<button class="btn gold big block" data-act="complete" style="margin-top:10px">CAMPAIGN COMPLETE ▸</button>' : '<button class="btn primary big block" data-act="next" style="margin-top:10px">NEXT: LEVEL ' + (r.level + 1) + ' ▸</button><button class="btn block" data-nav="training" style="margin-top:8px">Training</button>';
    return h;
  }
  const p = r.pay;
  let h = '<div class="result fail"><div class="tiny coral">LEVEL ' + r.level + ' · ATTEMPT FAILED</div><h1 style="font-size:28px">DEFEAT</h1><p class="small">' + esc(REASON[r.reason] || '') + '</p>' +
    '<div class="kv" style="text-align:left"><span>Waves cleared</span><b>' + r.completedWaves + '/' + L.waves + '</b><span>Defeat reward</span><b class="gold-t">+' + fmt(r.coins) + ' Coins</b></div>' +
    '<div class="small dim" style="margin-top:8px">A new attempt starts again with 100 players and fresh cards. Training, leaders, discoveries and Coins are kept.</div></div>';
  h += '<button class="btn primary big block" data-act="retry" style="margin-top:10px">↻ RETRY LEVEL ' + r.level + '</button><button class="btn gold block" data-nav="training" style="margin-top:8px">Training (¢ ' + fmt(s.coins) + ')</button>';
  return h;
}
function viewComplete(s) {
  const last = s.completed[200];
  return '<div class="result win"><div class="confetti" style="font-size:54px">🏆</div><h1>CAMPAIGN COMPLETE</h1><p class="small">You held the line against the Legion of Legends.</p>' +
    '<div class="kv" style="text-align:left;margin-top:10px"><span>Levels cleared</span><b>200/200</b><span>Boss Cups</span><b>' + Object.keys(s.cups).length + '/10</b><span>Cards discovered</span><b>' + s.cards.length + '/48</b><span>Leaders unlocked</span><b>' + s.leaders.length + '/5</b>' +
    (last && last.medal ? '<span>Final Boss survivors</span><b>' + last.survivors + '</b><span>Final Survivor Medal</span><b>' + MEDAL_N[last.medal] + '</b>' : '') + '</div>' +
    '<p class="tiny dim">There is no Level 201, Endless Arena or New Game+. Training is now read-only; every record stays in your archive.</p></div>' +
    '<div class="btns" style="margin-top:10px"><button class="btn" data-nav="trophy">Career archive</button><button class="btn primary" data-nav="hq">Arcade HQ</button></div>';
}

// ======================= actions =======================
function startLevel(n) {
  const s = st.save; if (!R.Progress.canStart(s, n)) { toast(s.run ? 'Finish your current run first' : 'This level is locked'); return; }
  const run = R.Run.start(s, n); if (!run) return;
  markTip('army'); persist(); closeModal(); sfx('ui'); go('run');
}
function continueRun() { const run = st.save.run; if (!run) return; if (run.phase === 'battle') return resumeWave(); if (run.phase === 'over') return finishRun(); go('run'); }
function finishRun() {
  const s = st.save, res = R.Run.finish(s); persist();
  if (!res) return go('hq');
  if (res.kind === 'win') { sfx(res.campaign ? 'rg_campaign' : res.cup ? 'trophy' : 'levelup', 0.7); if (res.unlocks.length) setTimeout(() => sfx('rev_epic'), 600); }
  else sfx('rg_lose', 0.6);
  go('result');
}
document.addEventListener('click', ev => {
  const t = ev.target.closest('button,[data-nav],[data-node],summary'); if (!t) return;
  const d = t.dataset;
  if (t.id === 'modal') return;
  if (d.tipx) { markTip(d.tipx); const b = t.closest('[data-tipbox]'); if (b) b.remove(); return; }
  if (d.nav) { if (st.battle) return; closeModal(); sfx('ui', 0.3); return go(d.nav); }
  if (d.ep) { st.ep = +d.ep; return render(); }
  if (d.node) { sfx('ui', 0.3); return briefing(+d.node); }
  if (d.cat) { st.codexCat = d.cat; return render(); }
  if (d.vfx) { st.save.settings.vfx = d.vfx; persist(); return render(); }
  if (d.train) { const r = R.Training.buy(st.save, d.train); if (r.ok) { persist(); sfx('upgrade'); render(); } else { sfx('error'); toast(r.why); } return; }
  if (d.pick) { const r = R.Run.pick(st.save, d.pick); if (r.ok) { markTip('first_card'); persist(); sfx('rg_card'); sfx('rev_' + K.BY_ID[d.pick].rarity, 0.5); toast(K.BY_ID[d.pick].name + ' · Rank ' + 'I'.repeat(r.rank)); render(); window.scrollTo(0, 0); } return; }
  if (d.focus && st.battle) return issueFocus(d.focus);
  const a = d.act; if (!a) return;
  if (a === 'fullscreen') return toggleFull();
  if (a === 'close') { closeModal(); return; }
  if (a === 'brief') return briefing(+d.level);
  if (a === 'start') return startLevel(+d.level);
  if (a === 'continue') return continueRun();
  if (a === 'wave') { const snap = R.Run.beginWave(st.save); if (!snap) return; markTip('waves'); persist(); return liveWave(snap, null); }
  if (a === 'resume') return resumeWave();
  if (a === 'afterclear') { R.Run.afterClear(st.save); persist(); return go('run'); }
  if (a === 'skipdraft') { const run = st.save.run; run.draft.left = 0; run.draft.offer = null; run.phase = 'ready'; persist(); return go('run'); }
  if (a === 'abandon') return modal('<h2>Abandon attempt?</h2><p class="small">You leave Level ' + st.save.run.level + ' now and receive <b>0 Coins</b>. Your army and run cards are lost; Training, leaders and discoveries stay.</p><div class="btns"><button class="btn" data-act="close">Keep playing</button><button class="btn danger" data-act="abandon2">Abandon</button></div>');
  if (a === 'abandon2') { R.Run.abandon(st.save); persist(); closeModal(); toast('Attempt abandoned · 0 Coins'); return go('hq'); }
  if (a === 'next') { st.save.lastResult = null; persist(); return briefing(st.save.highest + 1); }
  if (a === 'retry') { const n = st.save.lastResult.level; st.save.lastResult = null; return startLevel(n); }
  if (a === 'complete') return go('complete');
  if (a === 'resettips') { st.save.tips = {}; persist(); toast('Tips will show again'); return render(); }
  if (a === 'export') return exportSave();
  if (a === 'import') return importSave();
  if (a === 'reset') return modal('<h2>Delete save?</h2><p class="small">This erases your whole career on this device (export first if you want a copy).</p><div class="btns"><button class="btn" data-act="close">Cancel</button><button class="btn danger" data-act="reset2">Delete</button></div>');
  if (a === 'reset2') { try { localStorage.removeItem(R.Save.KEY); localStorage.removeItem(R.Save.BAK); } catch (e) { /* storage blocked */ } st.save = R.Save.defaults(); persist(); closeModal(); return go('hq'); }
  if (a === 'doimport') { const r = R.Save.importText($('impText').value || ''); if (!r.ok) { toast(r.why); return; } st.save = r.save; persist(); closeModal(); toast('Save imported'); return go('hq'); }
  if (a === 'pause') return setPause(!st.battle.paused);
  if (a === 'bt-resume') return setPause(false);
  if (a === 'bt-quit') return quitWaveToHQ();
});
$('modal').addEventListener('click', e => { if (e.target.id === 'modal' && !$('modal').dataset.lock) closeModal(); });
document.addEventListener('input', e => { const k = e.target.dataset.set; if (!k) return; const set = st.save.settings; set[k] = e.target.type === 'checkbox' ? e.target.checked : (+e.target.value) / 100; AU.apply(Object.assign({}, set)); persist(); });
document.addEventListener('change', e => { if (e.target.dataset.set && e.target.type === 'checkbox') render(); });
function exportSave() {
  const txt = R.Save.exportText(st.save);
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = 'football-wars-roguelite-save.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Save exported'); }
  catch (e) { modal('<h2>Export</h2><textarea style="width:100%;height:200px">' + esc(txt) + '</textarea><button class="btn block" data-act="close">Close</button>'); }
}
function importSave() {
  modal('<h2>Import save</h2><p class="small dim">Choose a JSON file or paste its text. It is validated before anything is replaced.</p><input type="file" id="impFile" accept="application/json,.json" style="margin-bottom:8px"><textarea id="impText" style="width:100%;height:140px;background:#0a1128;color:#eaf0ff;border:1px solid #22325a;border-radius:10px"></textarea><div class="btns"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="doimport">Import</button></div>');
  $('impFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { $('impText').value = rd.result; }; rd.readAsText(f); });
}
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function toggleFull() {
  try {
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen; if (!f) { toast('Full screen is not supported here'); return; }
    const r = f.call(d, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => toast('Full screen is not allowed here'));
  } catch (e) { toast('Full screen is not supported here'); }
}
function onFull() { document.querySelectorAll('[data-act="fullscreen"]').forEach(b => { b.textContent = fsEl() ? '🗗' : '⛶'; }); setTimeout(fitStage, 80); }
document.addEventListener('fullscreenchange', onFull); document.addEventListener('webkitfullscreenchange', onFull);

// ======================= live wave (real 100 vs N engine, fixed 60 Hz) =======================
function resumeWave() { const P = st.save.run && st.save.run.pending; if (!P) return go('run'); liveWave(P.snap, { inputs: P.inputs || [], lastTick: P.lastTick || 0 }); }
function fitStage() {
  const B = st.battle; if (!B) return;
  const wrap = $('stageWrap'), r = wrap.getBoundingClientRect();
  let h = r.height - 2, w = h * 9 / 16; if (w > r.width - 4) { w = r.width - 4; h = w * 16 / 9; }
  const q = QUALITY[st.save.settings.vfx] || QUALITY.medium, dpr = Math.min(root.devicePixelRatio || 1, q.dpr);
  const k = Math.max(1, Math.min(4, Math.round(h * dpr / 640)));
  B.cv.width = 360 * k; B.cv.height = 640 * k; B.cv.style.width = Math.floor(w) + 'px'; B.cv.style.height = Math.floor(h) + 'px';
}
window.addEventListener('resize', () => setTimeout(fitStage, 50));
function liveWave(snap, resume) {
  const s = st.save, set = s.settings, q = QUALITY[set.vfx] || QUALITY.medium;
  AU.init(); addSounds(); AU.apply(Object.assign({}, set));
  closeModal();
  $('battle').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  const L = R.Progress.level(snap.level);
  const inputs = resume ? resume.inputs.slice() : [];
  const w = E.createWorld(R.Battle.worldOpts(snap, { fxLevel: q.fx, inputs }));
  w.observer = DIR.createObserver({ smartCam: true, intensity: 'low', epicFinale: false, mvpStreaks: true, fbAlerts: true, fbFollow: true });
  const teams = [snap.teamA, snap.teamB];
  const kits = S.makeKits(teams[0], teams[1], 210);
  const atlases = [S.buildAtlas(teams[0], kits[0]), S.buildAtlas(teams[1], kits[1])];
  const logos = teams.map(t => ({ small: crest(t, 26), big: crest(t, 96) }));
  const final = snap.wave === snap.waves - 1;
  const rogue = { title: (L.kind === 'boss' ? 'BOSS ' : '') + 'WAVE ' + (snap.wave + 1) + '/' + snap.waves, sub: snap.teamB.battle_profile ? L.counts[snap.wave] + ' ' + D.TACTICS[snap.tactic].name.toUpperCase() : '',
    sub2: final ? (L.mission === 'goal' ? 'FINAL WAVE · GOALS ' + snap.obj.goalsBefore + '/' + L.goalTarget : 'FINAL WAVE') : (L.mission === 'ko' ? 'K.O. EVERY RIVAL' : 'SURVIVE 45 SECONDS'), boss: L.kind === 'boss',
    cardNames: Object.fromEntries(K.CARDS.map(c => [c.id, c.name])) };
  const renderer = RN.createRenderer({ world: w, teams, kits, atlases, logos, lang: 'en', labels: true, story: true, hc: true, fxLevel: q.fx, v3: { vfx: true, finale: false, mvp: false, momentum: false }, modeLabel: snap.label.toUpperCase(), fictional: true, rogue });
  const cv = $('stage'), ctx = cv.getContext('2d');
  const B = st.battle = { snap, w, L, renderer, cv, ctx, inputs, paused: false, last: performance.now(), evI: 0, savedTick: resume ? resume.lastTick : 0, ended: false, applied: false, skip: false, acc: 0,
    ff: !!(resume && resume.lastTick > 0), camS: { x: 180, y: E.MIDY, z: 1 }, tipT: 0, cardMsg: '', cardT: 0, rm: !!set.reduceMotion };
  $('hLevel').textContent = 'L' + L.level; $('hMission').textContent = MISSION[L.mission].ic + ' ' + MISSION[L.mission].short + (L.kind !== 'normal' ? ' · ' + L.kind.toUpperCase() : '');
  $('hWave').textContent = 'W' + (snap.wave + 1) + '/' + snap.waves;
  $('hGoalBox').style.visibility = L.mission === 'goal' ? 'visible' : 'hidden';
  $('pauseBox').classList.add('hidden'); $('btSkip').classList.add('hidden'); $('btTip').classList.add('hidden');
  fitStage(); buildLeadBar(B); hudTick(B);
  $('btLoading').classList.toggle('hidden', !B.ff);
  if (!B.ff) { AU.battleStart(); if (L.kind === 'boss') setTimeout(() => sfx('rg_alarm', 0.5), 300); }
  if (s.run.level <= 3 && !tipSeen('focus')) battleTip(B, 'focus');
  const ff = () => {
    let n = 0; while (w.tick < resume.lastTick && w.phase !== 'ended' && n++ < 600) E.step(w);
    B.evI = w.events.length;
    if (w.tick < resume.lastTick && w.phase !== 'ended') { $('btLoading').textContent = 'RESTORING WAVE… ' + Math.round(w.tick / resume.lastTick * 100) + '%'; setTimeout(ff, 0); return; }
    B.ff = false; $('btLoading').classList.add('hidden'); AU.battleStart(); setPause(true); B.raf = requestAnimationFrame(frame);
  };
  const frame = now => {
    if (st.battle !== B) return;
    const dtReal = Math.min(0.1, (now - B.last) / 1000); B.last = now;
    if (!B.paused) { // real time, 1×: an accumulator runs exactly one fixed 1/60 s step per 1/60 s of real time (never sped up, never skipped)
      B.acc += dtReal; let n = 0;
      while (B.acc >= E.DT - 1e-7 && n++ < 8) { E.step(w); B.acc -= E.DT; }
      if (B.acc > E.DT * 8) B.acc = 0; // after a long stall the battle waits instead of fast-forwarding
    }
    cam(B, dtReal);
    renderer.render(ctx, w.t, cv.width, cv.height);
    events(B);
    hudTick(B);
    if (!B.paused) AU.battleFeed(w, w.observer && w.observer.state);
    if (!B.paused && w.phase === 'battle' && w.tick - B.savedTick >= 120) checkpoint(B);
    if (w.phase === 'ended') {
      if (!B.applied) applyWave(B);
      if (!B.ended) { B.ended = true; B.endAt = now; $('btSkip').classList.remove('hidden'); }
      if (B.skip || now - B.endAt > 2600) { endLive(B); return; }
    }
    B.raf = requestAnimationFrame(frame);
  };
  if (B.ff) setTimeout(ff, 30); else B.raf = requestAnimationFrame(frame);
}
function cam(B, dt) {
  const w = B.w; let tx = 180, ty = E.MIDY, tz = 1;
  if (!B.rm) { tx = w.cam.x; ty = w.cam.y; tz = Math.min(1.12, w.cam.z); }
  if (B.rm) w.shake = 0;
  const k = Math.min(1, dt * 4), c = B.camS; c.x += (tx - c.x) * k; c.y += (ty - c.y) * k; c.z += (tz - c.z) * k;
  w.cam.x = c.x; w.cam.y = c.y; w.cam.z = Math.min(1.12, c.z);
}
function checkpoint(B) {
  const run = st.save.run; if (!run || !run.pending || B.applied) return;
  run.pending.lastTick = B.w.tick; run.pending.inputs = B.inputs.slice(); B.savedTick = B.w.tick; persist();
}
function issueFocus(f) {
  const B = st.battle; if (!B || B.paused || B.ff) return;
  const w = B.w;
  if (!E.rgCanFocus(w)) { sfx('error', 0.4); const F = w.rg.focus; toast(F.uses >= F.max ? 'No Focus left this wave' : F.kind ? 'A Focus is already active' : w.phase !== 'battle' ? 'Wait for kick-off' : 'Focus ready in ' + Math.ceil(F.nextOk - w.battleT) + 's'); return; }
  const inp = { k: w.tick + 1, f }; B.inputs.push(inp); w.rg.inputs.push(inp); // applied by the engine on the next fixed tick (logged for exact resume)
  markTip('focus'); $('btTip').classList.add('hidden');
  sfx('rg_focus', 0.6); AU.vibrate(25);
  checkpoint(B);
}
function setPause(on) {
  const B = st.battle; if (!B) return; B.paused = on;
  const box = $('pauseBox');
  if (on) {
    box.innerHTML = '<b style="font-size:22px">PAUSED</b><div class="small dim center">The simulation and Focus timers are stopped.</div><button class="btn primary" data-act="bt-resume">▶ Resume</button><button class="btn" data-act="bt-quit">Save &amp; return to HQ</button>';
    box.classList.remove('hidden'); AU.pause(true); checkpoint(B);
  } else { box.classList.add('hidden'); AU.pause(false); B.last = performance.now(); B.acc = 0; }
  $('btPause').textContent = on ? '▶' : '❚❚';
}
$('btPause').addEventListener('click', () => { if (st.battle && !st.battle.ff && !st.battle.ended) setPause(!st.battle.paused); });
$('btSkip').addEventListener('click', () => { if (st.battle) st.battle.skip = true; });
function quitWaveToHQ() { const B = st.battle; if (!B) return; checkpoint(B); teardown(B); go('hq'); }
function teardown(B) { cancelAnimationFrame(B.raf); AU.battleStop(); AU.pause(false); B.renderer.dispose(); st.battle = null; $('battle').classList.add('hidden'); document.body.style.overflow = ''; }
function applyWave(B) {
  B.applied = true;
  const sum = R.Battle.result(B.w);
  const out = R.Run.endWave(st.save, sum); persist();
  B.outcome = out;
  if (out === 'clear') { sfx('rg_wave', 0.6); AU.vibrate([40, 30, 60]); }
  else if (out === 'win') { sfx('levelup', 0.7); AU.vibrate([60, 40, 120]); }
  else { sfx('rg_lose', 0.6); AU.vibrate(200); }
}
function endLive(B) {
  teardown(B);
  if (B.outcome === 'clear') go('run'); else finishRun();
}
function buildLeadBar(B) {
  const u = B.w.units.filter(x => x.side === 0 && x.leader);
  $('leadBar').innerHTML = LD.LEADERS.map(l => { const x = u.find(y => y.leader === l.id); return '<span class="' + (!x ? 'lock' : x.alive ? '' : 'ko') + '">' + (x ? (x.alive ? '⭐' : '✖') : '🔒') + ' ' + esc(l.name.split(' ').pop()) + '</span>'; }).join('');
  B.leadSig = u.map(x => x.alive).join();
}
function hudTick(B) {
  const w = B.w, R0 = w.rg, o = R0.obj;
  const bt = w.phase === 'battle' ? w.battleT : w.phase === 'ended' ? (R0.result ? R0.result.battleT : w.battleT) : 0;
  const ot = bt > o.waveSec; const rem = ot ? o.waveSec + o.otSec - bt : o.waveSec - bt;
  const tEl = $('hTime'), sec = Math.ceil(Math.max(0, rem)); tEl.textContent = (ot ? '+' : '') + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  tEl.classList.toggle('ot', ot || R0.ot);
  $('hSurv').textContent = w.teams[0].alive; $('hRiv').textContent = w.teams[1].alive;
  if (o.type === 'goal') $('hGoals').textContent = (o.goalsBefore + w.fb.goals[0]) + '/' + o.target;
  const sig = w.units.filter(x => x.side === 0 && x.leader).map(x => x.alive).join(); if (sig !== B.leadSig) buildLeadBar(B);
  const F = R0.focus, can = E.rgCanFocus(w);
  document.querySelectorAll('.fbtn').forEach(b => {
    const k = b.dataset.focus, act = F.kind === k;
    b.classList.toggle('active', act); b.classList.toggle('off', !can && !act); b.setAttribute('aria-disabled', String(!can && !act));
    const bar = b.querySelector('i'); bar.style.width = act ? Math.max(0, (F.until - w.battleT) / F.dur * 100) + '%' : '0';
  });
  let info = 'Focus left: ' + (F.max - F.uses) + '/' + F.max;
  if (F.kind) info = F.kind.toUpperCase() + ' Focus · ' + Math.max(0, F.until - w.battleT).toFixed(1) + 's';
  else if (F.uses < F.max && w.phase === 'battle' && w.battleT < F.nextOk) info += ' · ready in ' + Math.ceil(F.nextOk - w.battleT) + 's';
  if (B.cardMsg && performance.now() < B.cardT) info = B.cardMsg + ' · ' + info;
  $('focusInfo').textContent = info;
}
function events(B) {
  const w = B.w, ev = w.events, EV = E.EV;
  for (; B.evI < ev.length; B.evI++) {
    const e = ev[B.evI];
    if (e.type === EV.CARD && e.b >= 0) { const c = K.CARDS[e.b]; B.cardMsg = '🃏 ' + c.name; B.cardT = performance.now() + 1400; if (c.rarity === 'legendary' && !B.rm) { const fl = document.createElement('div'); fl.className = 'flashfx'; $('stageWrap').appendChild(fl); setTimeout(() => fl.remove(), 520); sfx('rev_legendary', 0.5); } }
    else if (e.type === EV.GOAL) { if (!tipSeen('goal_adv')) battleTip(B, 'goal_adv'); AU.vibrate(80); }
    else if (e.type === EV.KO && w.units[e.b] && w.units[e.b].side === 0) { if (!tipSeen('first_ko')) battleTip(B, 'first_ko'); }
    else if (e.type === EV.OVERTIME) sfx('rg_alarm', 0.4);
    else if (e.type === EV.EMERGENCY_GK) toast('Emergency keeper: a defender takes the gloves');
  }
  if (B.w.events.length > 5000 && B.evI >= B.w.events.length) { B.w.events.length = 0; B.evI = 0; }
}
function battleTip(B, id) {
  const t = D.TIPS[id]; if (!t) return; const el = $('btTip');
  el.innerHTML = '<b>💡 ' + esc(t.t) + '</b>' + esc(t.x) + '<button aria-label="Dismiss tip">✕</button>';
  el.classList.remove('hidden'); markTip(id);
  el.querySelector('button').onclick = () => el.classList.add('hidden');
  clearTimeout(B.tipT); B.tipT = setTimeout(() => el.classList.add('hidden'), 7000);
}
document.addEventListener('visibilitychange', () => { const B = st.battle; if (document.hidden && B && !B.ff && !B.ended) setPause(true); else if (document.hidden && st.save) persist(); });
window.addEventListener('pagehide', () => { const B = st.battle; if (B && !B.ff && !B.applied) checkpoint(B); });
document.addEventListener('keydown', e => {
  const B = st.battle; if (!B) return;
  if (e.key === ' ' || e.key === 'p') { e.preventDefault(); if (!B.ff && !B.ended) setPause(!B.paused); }
  else if (e.key === '1') issueFocus('goal'); else if (e.key === '2') issueFocus('ko'); else if (e.key === '3') issueFocus('survive');
});

// ======================= boot =======================
function boot() {
  const v = R.Validation.run();
  if (!v.ok) console.error('FWValidation failed', v.checks.filter(c => !c.ok));
  let ld; try { ld = R.Save.load(); } catch (e) { ld = { save: R.Save.defaults(), notice: 'Browser storage is blocked — progress cannot be saved here.' }; st.storageOk = false; }
  st.save = ld.save;
  if (ld.fresh) persist();
  const s = st.save;
  // a run that ended but whose result was not yet applied (closed during the outro)
  if (s.run && s.run.phase === 'over') { R.Run.finish(s); persist(); }
  st.view = 'hq';
  st.ep = R.Progress.level(curLevel()).ep;
  render();
  if (ld.notice) toast(ld.notice);
  if (s.run) toast('Run in progress — tap CONTINUE');
  root.FWArcadeUI = { st, go, render, startLevel, liveWave, issueFocus, setPause };
}
boot();
})(window);
