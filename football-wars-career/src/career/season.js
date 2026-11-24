// Season machinery: weekly flow, result application (exactly once), tables, cups, playoffs, promotion/relegation.
import { SEASON_WEEKS, SPONSOR, DIV_CUP_PRIZE, GRAND_CUP_PRIZE, CHAMPIONS_PRIZE, CUP_ROUND_WIN_SHARE, XP_MATCH, XP_WIN, XP_GOAL, XP_KO, INJURY_CHANCE,
  PROMOTION_BONUS_WEEKS, SPONSOR_TYPES, STADIUM_CAP, MAX_STARS, ROLE_LABEL } from '../data/balance.js';
import { Rng, mix32, clamp } from './util.js';
import { leagueFixtures, makeCup, slotClub, PLAYOFF_WEEK, LEAGUE_MATCHES } from './schedule.js';
import { applyWeeklyFinance, matchIncome, leaguePrize, performanceBonus, earn, avgStandardQ } from './economy.js';
import { addXP, ageStar, wageFor } from './stars.js';
import { autoPickStars } from './world.js';
import { progressScouting, generateIncomingBids, academyIntake, pushNews, inWindow } from './management.js';
import { aiWeek, aiPrepare } from '../ai/manager.js';
import { snapshot, coachPolicy } from '../battle/adapter.js';

export const wk = S => `S${S.season}W${S.week}`;
const clubName = (S, id) => S.clubs[id] ? S.clubs[id].name : id;

// ---------------- season setup ----------------
export function setupSeason(S) {
  const g = 'setup' + S.season; if (S.guards[g]) return; S.guards[g] = 1;
  S.fixtures = {}; S.cups = {}; S.playoffs = {};
  const order = {};
  for (let d = 1; d <= 10; d++) {
    const ids = S.divisions[d].slice();
    order[d] = S.qualOrder && S.qualOrder[d] ? S.qualOrder[d].filter(id => ids.includes(id)) : ids.slice().sort((a, b) => avgStandardQ(S.clubs[b]) - avgStandardQ(S.clubs[a]) || (a < b ? -1 : 1));
    for (const id of ids) if (!order[d].includes(id)) order[d].push(id);
    // league fixtures with a deterministic shuffle of the fixture-list positions
    const r = new Rng(mix32(S.seed, 'fixtures', S.season, d));
    const sh = r.shuffle(ids.slice().sort());
    for (const f of leagueFixtures(S.season, d, sh)) S.fixtures[f.id] = f;
    S.cups['DC' + d] = makeCup(S.season, 'DC', 'DC' + d, order[d], { name: `Division ${d} Cup`, div: d, prize: DIV_CUP_PRIZE[d] });
  }
  const gc = [3, 4].flatMap(d => order[d].slice(0, 8)).concat([5, 6, 7, 8].flatMap(d => order[d].slice(0, 12)));
  S.cups.GC = makeCup(S.season, 'GC', 'GC', gc, { prize: GRAND_CUP_PRIZE });
  S.cups.CT = makeCup(S.season, 'CT', 'CT', order[1].slice(0, 8).concat(order[2].slice(0, 8)), { prize: CHAMPIONS_PRIZE });
  for (const c of Object.values(S.clubs)) { c.season = { W: 0, L: 0 }; if (c.ai) c.sponsor = c.division <= 3 ? 'prestige' : c.rep > 50 ? 'performance' : 'guaranteed'; }
}
export function cupsOf(S, clubId) { return Object.values(S.cups).filter(c => c.seeds.includes(clubId)); }

// ---------------- week start ----------------
export function startWeek(S) {
  const key = wk(S);
  if (S.lock && S.lock.key === key) return S.lock;
  const P = S.clubs[S.playerId];
  if (S.week <= SEASON_WEEKS) {
    for (const c of Object.values(S.clubs)) if (c.ai) aiWeek(S, c);
    for (const c of Object.values(S.clubs)) applyWeeklyFinance(S, c);
    progressScouting(S);
    generateIncomingBids(S);
    if (S.week === 19) intake(S, S.clubs[S.playerId], 'mid'); // the player's academy also reports mid-season
    for (const c of Object.values(S.clubs)) for (const id of c.stars) { const s = S.stars[id]; if (s && s.eligible && (S.season > s.eligible.season || S.week >= s.eligible.week)) s.eligible = null; }
  }
  // cup fixtures for the rounds played this week
  for (const cup of Object.values(S.cups)) cup.rounds.forEach((rd, ri) => {
    if (rd.week !== S.week) return;
    rd.ties.forEach(t => {
      const a = slotClub(cup, t.a), b = slotClub(cup, t.b);
      if (!a || !b) throw new Error(`cup ${cup.key} round ${ri} has an unresolved slot`);
      if (!S.fixtures[t.fid]) S.fixtures[t.fid] = { id: t.fid, season: S.season, week: S.week, comp: cup.kind, cup: cup.key, div: cup.div, round: ri, home: a, away: b, done: false, res: null };
    });
  });
  if (S.week === PLAYOFF_WEEK) for (let d = 2; d <= 10; d++) {
    const T = table(S, d); const id = `S${S.season}-PO${d}`;
    if (!S.fixtures[id]) S.fixtures[id] = { id, season: S.season, week: S.week, comp: 'PO', div: d, round: 0, home: T[1].id, away: T[2].id, done: false, res: null };
  }
  const fids = Object.values(S.fixtures).filter(f => f.week === S.week && f.season === S.season).map(f => f.id).sort();
  const snaps = {};
  for (const id of fids) {
    const f = S.fixtures[id];
    for (const [cid, oid] of [[f.home, f.away], [f.away, f.home]]) {
      const c = S.clubs[cid]; if (!c.ai) continue;
      aiPrepare(S, c, S.clubs[oid]);
      snaps[cid + '@' + id] = snapshot(c, S.stars, S.season, S.week);
    }
  }
  S.lock = { key, fids, snaps, results: {}, ended: false };
  S.actions = { key, left: 2 };
  return S.lock;
}
function intake(S, c, tag) {
  const list = academyIntake(S, c, tag);
  if (!c.ai) { pushNews(S, `Academy intake: ${list.length} new prospect(s) available.`, 'good'); return; }
  // AI: promote the best prospect if there is room and quality, release the rest into the world pool
  list.sort((a, b) => b.pot - a.pot);
  list.forEach((s, i) => {
    s.academy = null;
    if (i === 0 && c.stars.length < MAX_STARS && s.pot >= avgStandardQ(c) + 6) { s.clubId = c.id; s.contract = 3; c.stars.push(s.id); s.career.push({ s: S.season, w: S.week, from: 'academy', to: c.id, fee: 0 }); }
    else if (s.pot >= avgStandardQ(c) + 4 && new Rng(mix32(S.seed, 'fa', s.id)).chance(0.35)) { s.clubId = null; s.contract = 1; } // a few join the free-agent pool
    else delete S.stars[s.id];
  });
}
// ---- jobs for the world simulation (all matches without the player's club) ----
export function worldJobs(S) {
  const L = S.lock; const out = [];
  for (const id of L.fids) {
    const f = S.fixtures[id]; if (f.done || L.results[id] || f.home === S.playerId || f.away === S.playerId) continue;
    const h = L.snaps[f.home + '@' + id], a = L.snaps[f.away + '@' + id];
    out.push({ fid: id, seed: fixtureSeed(S, f), home: h, away: a, coach: [coachPolicy(S.clubs[f.home]), coachPolicy(S.clubs[f.away])] });
  }
  return out;
}
export const fixtureSeed = (S, f) => mix32(S.seed, f.id) % 4000000000 + 1;
export const playerFixtures = S => (S.lock ? S.lock.fids : []).map(id => S.fixtures[id]).filter(f => f.home === S.playerId || f.away === S.playerId);

// ---------------- results (exactly once) ----------------
export function applyResult(S, f, sum) {
  if (f.done) return null; // a replayed / reloaded result is never paid twice
  const hs = S.clubs[f.home], as = S.clubs[f.away];
  const winSide = sum.winner; const W = winSide === 0 ? hs : as, Lc = winSide === 0 ? as : hs;
  f.res = { w: W.id, g: sum.football ? sum.football.goals.slice() : [0, 0], a: sum.alive.slice(), t: sum.battleT, tb: sum.tiebreak || null, hash: sum.hash, k: sum.kills.slice(), seed: sum.seed };
  f.done = true;
  const deltas = {};
  for (const [side, c] of [[0, hs], [1, as]]) {
    const won = side === winSide, before = c.budget, fansB = c.fans, repB = c.rep;
    const inc = matchIncome(c, side === 0, won, f.comp === 'L' || f.comp === 'PO' ? c.division : (f.div || c.division));
    earn(S, c, inc.total, `${compName(S, f)} ${won ? 'win' : 'loss'} vs ${clubName(S, side === 0 ? f.away : f.home)}`);
    if (won && f.comp === 'L' && c.sponsor === 'performance') earn(S, c, performanceBonus(c), 'Performance sponsor bonus');
    if (won && (f.comp === 'DC' || f.comp === 'GC' || f.comp === 'CT')) { const cup = S.cups[f.cup]; earn(S, c, Math.round(cup.prize * CUP_ROUND_WIN_SHARE * (f.round + 1)), `${cup.name}: ${cup.rounds[f.round].name} won`); }
    const fanMul = 1 + 0.15 * (c.fac.fans - 1);
    c.fans = Math.max(100, Math.round(c.fans * (won ? 1 + 0.012 * fanMul : 0.994) + (won ? 8 : 0)));
    c.rep = clamp(Math.round((c.rep + (won ? 0.6 : -0.3)) * 10) / 10, 0, 100);
    c.form = (c.form || []).concat(won ? 'W' : 'L').slice(-5);
    if (f.comp === 'L') { c.season.W += won ? 1 : 0; c.season.L += won ? 0 : 1; }
    c.lastTactic = side === 0 ? (sum.tactics ? sum.tactics[0] : c.tactic) : (sum.tactics ? sum.tactics[1] : c.tactic);
    deltas[c.id] = { credits: c.budget - before, income: inc, fans: c.fans - fansB, rep: Math.round((c.rep - repB) * 10) / 10, xp: [], injuries: [] };
  }
  // stars: injuries that were sat out heal, XP, stats, new rare injuries
  const played = new Set(sum.stars.map(s => s.id));
  for (const c of [hs, as]) for (const id of c.stars) { const s = S.stars[id]; if (s.injured > 0 && !played.has(id)) s.injured--; }
  for (const st of sum.stars) {
    const s = S.stars[st.id]; if (!s) continue; const c = S.clubs[s.clubId]; if (!c) continue;
    const won = (st.side === winSide);
    s.stats.apps++; s.stats.goals += st.goals; s.stats.kos += st.kos; s.stats.assists += st.assists; s.stats.saves += st.saves; if (won) s.stats.wins++;
    const xp = XP_MATCH + (won ? XP_WIN : 0) + st.goals * XP_GOAL + st.kos * XP_KO;
    const lv = addXP(s, xp, c.fac.training);
    if (deltas[c.id]) deltas[c.id].xp.push({ id: s.id, name: s.name, xp, levels: lv, level: s.level });
    const r = new Rng(mix32(S.seed, 'inj', f.id, s.id));
    if (r.next() < INJURY_CHANCE * (1 - 0.12 * (c.fac.medical - 1))) { s.injured = 1; if (deltas[c.id]) deltas[c.id].injuries.push(s.name); if (!c.ai) pushNews(S, `${s.name} picked up a knock and misses the next match.`, 'bad'); }
    if (lv && !c.ai) pushNews(S, `${s.name} reached level ${s.level}.`, 'good');
  }
  for (const c of [hs, as]) if (c.ai) autoPickStars(c, S.stars); else c.activeStars = c.activeStars.filter(id => S.stars[id] && S.stars[id].clubId === c.id);
  // competition progress
  if (f.cup) {
    const cup = S.cups[f.cup]; const tie = cup.rounds[f.round].ties.find(t => t.fid === f.id); tie.winner = W.id;
    if (f.round === cup.rounds.length - 1) {
      cup.champion = W.id; earn(S, W, cup.prize, `${cup.name} champions`);
      W.trophies.push({ s: S.season, name: cup.name }); W.fans = Math.round(W.fans * 1.1); W.rep = clamp(W.rep + 6, 0, 100);
      pushNews(S, `${W.name} win the ${cup.name}!`, W.id === S.playerId ? 'good' : 'info');
    }
  }
  if (f.comp === 'PO') { S.playoffs[f.div] = W.id; pushNews(S, `Division ${f.div} play-off final: ${W.name} promoted.`, W.id === S.playerId ? 'good' : 'info'); }
  if ((hs.id === S.playerId || as.id === S.playerId)) {
    const me = hs.id === S.playerId ? 0 : 1;
    if (me === winSide && Math.abs(avgStandardQ(Lc) - avgStandardQ(W)) >= 8 && avgStandardQ(Lc) > avgStandardQ(W)) S.history.bigWins.unshift({ s: S.season, w: S.week, vs: Lc.name, comp: compName(S, f), score: f.res.g.join('-') });
  }
  return deltas;
}
export function compName(S, f) {
  if (f.comp === 'L') return `Division ${f.div}`;
  if (f.comp === 'PO') return `Division ${f.div} Play-off Final`;
  const cup = S.cups[f.cup]; return cup ? `${cup.name} ${cup.rounds[f.round].name}` : f.comp;
}

// ---------------- tables ----------------
export function table(S, div) {
  const rows = {}; for (const id of S.divisions[div]) rows[id] = { id, P: 0, W: 0, L: 0, pts: 0, sf: 0, sa: 0, gf: 0, ga: 0, form: [] };
  const fx = Object.values(S.fixtures).filter(f => f.comp === 'L' && f.div === div && f.done).sort((a, b) => a.week - b.week || (a.id < b.id ? -1 : 1));
  const h2h = {};
  for (const f of fx) {
    const H = rows[f.home], A = rows[f.away]; if (!H || !A) continue;
    const hw = f.res.w === f.home;
    H.P++; A.P++; if (hw) { H.W++; A.L++; H.pts += 3; } else { A.W++; H.L++; A.pts += 3; }
    H.sf += f.res.a[0]; H.sa += f.res.a[1]; A.sf += f.res.a[1]; A.sa += f.res.a[0];
    H.gf += f.res.g[0]; H.ga += f.res.g[1]; A.gf += f.res.g[1]; A.ga += f.res.g[0];
    H.form.push(hw ? 'W' : 'L'); A.form.push(hw ? 'L' : 'W');
    const k = f.res.w + '>' + (hw ? f.away : f.home); h2h[k] = (h2h[k] || 0) + 1;
  }
  const lot = id => mix32(S.seed, 'lot', S.season, id);
  const key = r => [r.pts, r.sf - r.sa, r.gf - r.ga, r.gf];
  const list = Object.values(rows);
  list.sort((a, b) => { const x = key(a), y = key(b); for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return y[i] - x[i]; return 0; });
  // resolve fully tied groups: head-to-head for pairs, then the season's documented draw lot (club-id hash)
  const out = []; let i = 0;
  while (i < list.length) {
    let j = i + 1; while (j < list.length && key(list[j]).every((v, k) => v === key(list[i])[k])) j++;
    const grp = list.slice(i, j);
    grp.sort((a, b) => { if (grp.length === 2) { const d = (h2h[b.id + '>' + a.id] || 0) - (h2h[a.id + '>' + b.id] || 0); if (d) return d; } return lot(b.id) - lot(a.id) || (a.id < b.id ? -1 : 1); });
    out.push(...grp); i = j;
  }
  out.forEach((r, k) => { r.pos = k + 1; r.form = r.form.slice(-5); });
  return out;
}

// ---------------- week end ----------------
export function canEndWeek(S) {
  const L = S.lock; if (!L) return { ok: false, reason: 'Week not started.' };
  const pend = playerFixtures(S).filter(f => !f.done);
  if (pend.length) return { ok: false, reason: 'Play your match first.' };
  const missing = L.fids.filter(id => !S.fixtures[id].done && !L.results[id]);
  if (missing.length) return { ok: false, reason: `${missing.length} world match(es) still simulating.`, missing };
  return { ok: true };
}
export function endWeek(S) {
  const c = canEndWeek(S); if (!c.ok) return c;
  const L = S.lock; if (L.ended) return { ok: false, reason: 'Week already finished.' };
  for (const id of L.fids) { const f = S.fixtures[id]; if (!f.done) applyResult(S, f, L.results[id]); }
  L.ended = true;
  const summary = { season: S.season, week: S.week };
  if (S.week === PLAYOFF_WEEK) { const r = endSeason(S); summary.seasonEnd = r; }
  else S.week++;
  S.lock = null;
  return { ok: true, summary };
}

// ---------------- season end ----------------
export function endSeason(S) {
  const g = 'end' + S.season; if (S.guards[g]) return null; S.guards[g] = 1;
  const r = new Rng(mix32(S.seed, 'seasonEnd', S.season));
  const tables = {}; for (let d = 1; d <= 10; d++) tables[d] = table(S, d);
  const P = S.clubs[S.playerId];
  const moves = { up: {}, down: {} };
  for (let d = 1; d <= 10; d++) {
    const T = tables[d];
    for (const row of T) {
      const c = S.clubs[row.id]; const prize = leaguePrize(d, row.pos);
      if (prize) earn(S, c, prize, `Division ${d}: finished ${ordinal(row.pos)}`);
      c.lastPos = row.pos; c.lastDiv = d;
      if (c.sponsor === 'prestige') { const trophy = c.trophies.some(t => t.s === S.season); const b = trophy || row.pos <= 3 ? SPONSOR[d] * 6 : row.pos <= 10 ? SPONSOR[d] * 2 : 0; if (b) earn(S, c, b, 'Prestige sponsor bonus'); }
    }
    const champ = S.clubs[T[0].id]; champ.trophies.push({ s: S.season, name: d === 1 ? 'Division 1 Champions' : `Division ${d} Champions` }); champ.rep = clamp(champ.rep + 5, 0, 100); champ.fans = Math.round(champ.fans * 1.08);
    if (d >= 2) moves.up[d] = [T[0].id, S.playoffs[d] || T[1].id];
    if (d <= 9) moves.down[d] = [T[18].id, T[19].id];
  }
  // history
  const myRow = tables[P.division].find(x => x.id === P.id);
  const myCups = Object.values(S.cups).filter(c => c.seeds.includes(P.id)).map(c => ({ name: c.name, result: cupResult(c, P.id) }));
  const rec = { season: S.season, div: P.division, pos: myRow.pos, pts: myRow.pts, W: myRow.W, L: myRow.L, gf: myRow.gf, ga: myRow.ga, cups: myCups, move: null,
    champions: Object.fromEntries(Object.entries(S.cups).map(([k, c]) => [k, c.champion ? clubName(S, c.champion) : null])), d1: clubName(S, tables[1][0].id) };
  for (const c of Object.values(S.clubs)) { const row = tables[c.division].find(x => x.id === c.id); c.history.push({ s: S.season, d: c.division, p: row.pos, W: row.W, L: row.L }); if (c.history.length > 40) c.history.shift(); }
  // qualification order for next season (deterministic): relegated clubs first, then those who stayed, then promoted clubs
  const newDiv = {}; for (let d = 1; d <= 10; d++) newDiv[d] = [];
  const qual = {}; for (let d = 1; d <= 10; d++) qual[d] = [];
  for (let d = 1; d <= 10; d++) {
    const T = tables[d].map(x => x.id);
    const goingUp = moves.up[d] || [], goingDown = moves.down[d] || [];
    const stay = T.filter(id => !goingUp.includes(id) && !goingDown.includes(id));
    if (d > 1) for (const id of goingUp) { newDiv[d - 1].push(id); }
    if (d < 10) for (const id of goingDown) { newDiv[d + 1].push(id); }
    for (const id of stay) newDiv[d].push(id);
  }
  for (let d = 1; d <= 10; d++) {
    const fromAbove = d > 1 ? moves.down[d - 1] : [], fromBelow = d < 10 ? moves.up[d + 1] : [];
    const stayed = tables[d].map(x => x.id).filter(id => newDiv[d].includes(id));
    qual[d] = fromAbove.concat(stayed, fromBelow);
  }
  for (let d = 1; d <= 10; d++) for (const id of newDiv[d]) {
    const c = S.clubs[id]; const old = c.division;
    if (d < old) { earn(S, c, SPONSOR[d] * PROMOTION_BONUS_WEEKS, `Promotion bonus (Division ${d})`); c.fans = Math.round(c.fans * 1.15); c.rep = clamp(c.rep + 4, 0, 100); if (c.id === P.id) { rec.move = 'promoted'; pushNews(S, `PROMOTED to Division ${d}!`, 'good'); } }
    if (d > old) { c.fans = Math.round(c.fans * 0.92); c.rep = clamp(c.rep - 3, 0, 100); if (c.id === P.id) { rec.move = 'relegated'; pushNews(S, `Relegated to Division ${d}.`, 'bad'); } }
    c.division = d;
  }
  S.divisions = newDiv; S.qualOrder = qual;
  if (myRow.pos === 1) rec.title = true;
  S.history.seasons.push(rec);
  // stars: ageing, retirement, contracts
  const retired = [];
  for (const s of Object.values(S.stars)) {
    if (s.retired) continue;
    if (s.academy) { if (s.intake && s.intake.s < S.season) { s.academy = null; s.clubId = null; s.contract = 1; } continue; }
    const c = s.clubId ? S.clubs[s.clubId] : null;
    if (ageStar(s, r)) {
      s.retired = { s: S.season, club: s.clubId };
      if (c) { c.stars = c.stars.filter(x => x !== s.id); c.activeStars = c.activeStars.filter(x => x !== s.id); }
      if (c && !c.ai || s.career.some(x => x.to === P.id)) S.history.legends.push(legendOf(S, s));
      retired.push(s.id); continue;
    }
    s.injured = 0; s.listed = false;
    if (c) {
      s.contract--;
      if (s.contract <= 0) {
        if (c.ai && s.age < 33 && s.ovr >= avgStandardQ(c) - 2 && r.chance(0.75)) { s.contract = r.irange(1, 3); s.wage = Math.max(s.wage, wageFor(s, c.division)); }
        else { c.stars = c.stars.filter(x => x !== s.id); c.activeStars = c.activeStars.filter(x => x !== s.id); s.clubId = null; s.contract = 1; if (!c.ai) pushNews(S, `${s.name}'s contract expired; he left as a free agent.`, 'bad'); }
      }
    }
  }
  // retired stars leave the active database (Club Legends keep the player's history)
  for (const id of retired) delete S.stars[id];
  // free agents that nobody signs for two seasons drift out of the game
  for (const s of Object.values(S.stars)) if (!s.clubId && !s.academy) { s.faSeasons = (s.faSeasons || 0) + 1; if (s.faSeasons > 2) delete S.stars[s.id]; } else s.faSeasons = 0;
  for (const c of Object.values(S.clubs)) intake(S, c, 'end');
  const fa = Object.values(S.stars).filter(s => !s.clubId && !s.academy).sort((a, b) => b.ovr - a.ovr || (a.id < b.id ? -1 : 1));
  for (const s of fa.slice(80)) delete S.stars[s.id]; // keep the free-agent pool bounded
  for (const c of Object.values(S.clubs)) { autoPickStars(c, S.stars); c.form = []; if (c.ai) c.advance.usedSeason = 0; }
  P.activeStars = P.activeStars.filter(id => S.stars[id] && S.stars[id].clubId === P.id);
  S.market.talks = {}; S.market.incoming = [];
  S.prevCups = Object.fromEntries(Object.entries(S.cups).map(([k, c]) => [k, { name: c.name, champion: c.champion }]));
  const result = { season: S.season, record: rec, retired: retired.length };
  S.season++; S.week = 1;
  setupSeason(S);
  return result;
}
function legendOf(S, s) { return { id: s.id, name: s.name, role: s.role, age: s.age, ovr: s.ovr, level: s.level, stats: { ...s.stats }, retired: S.season, rarity: s.rarity }; }
export function cupResult(cup, id) {
  if (cup.champion === id) return 'Winner';
  for (let i = cup.rounds.length - 1; i >= 0; i--) { const t = cup.rounds[i].ties.find(t => t.winner && (slotClub(cup, t.a) === id || slotClub(cup, t.b) === id)); if (t) return t.winner === id ? (i === cup.rounds.length - 1 ? 'Winner' : `Won ${cup.rounds[i].name}`) : `Out in ${cup.rounds[i].name}`; }
  return 'Entered';
}
const ordinal = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
export { ordinal, LEAGUE_MATCHES, PLAYOFF_WEEK, STADIUM_CAP, SPONSOR_TYPES, ROLE_LABEL, inWindow };
