// Club management operations shared by the player and AI clubs. Every operation validates first and then
// applies all of its effects together (money + squad changes), so no half-done transfer can exist.
import { ROLES, ACTIONS_PER_WEEK, TRANSFER_WINDOWS, unitPrice, divFactor, MAX_STANDARD, MIN_STANDARD, MAX_STARS, MAX_ACTIVE_STARS, FAC_MAX,
  facCost, FAC_LABEL, XP_TRAIN, DIV_BASE, MAX_OFFERS_PER_TALK, AI_BUY_SHARE, SPONSOR_TYPES, ACADEMY_RARITY, ROLE_LABEL, SEASON_WEEKS } from '../data/balance.js';
import { Rng, mix32, clamp, round1 } from './util.js';
import { spend, earn, standardCount, avgStandardQ } from './economy.js';
import { addXP, starValue, wageFor, divOfOvr, pendingSpecs, SPECS, makeStar } from './stars.js';
import { autoPickStars } from './world.js';
import { makeNameFactory } from '../data/names.js';

export const weekKey = S => `S${S.season}W${S.week}`;
export const inWindow = S => TRANSFER_WINDOWS.some(([a, b]) => S.week >= a && S.week <= b);
export function nextWindowText(S) { const w = TRANSFER_WINDOWS.find(([a]) => S.week < a); return w ? `opens week ${w[0]}` : 'opens next season (week 1)'; }
export function actionsLeft(S, c) {
  const k = weekKey(S);
  if (c.ai) return c._act && c._act.key === k ? c._act.left : ACTIONS_PER_WEEK;
  return S.actions.key === k ? S.actions.left : ACTIONS_PER_WEEK;
}
function useAction(S, c) {
  const k = weekKey(S), left = actionsLeft(S, c);
  if (left <= 0) return false;
  if (c.ai) c._act = { key: k, left: left - 1 }; else S.actions = { key: k, left: left - 1 };
  return true;
}
const fail = reason => ({ ok: false, reason });
function news(S, c, text, kind) { if (!c || c.ai) return; S.news.unshift({ s: S.season, w: S.week, text, kind: kind || 'info' }); if (S.news.length > 120) S.news.length = 120; }
export function pushNews(S, text, kind) { S.news.unshift({ s: S.season, w: S.week, text, kind: kind || 'info' }); if (S.news.length > 120) S.news.length = 120; }

// ---------- standard squad ----------
function normalizeGroups(c) {
  const m = new Map();
  for (const g of c.groups) { if (g.count <= 0) continue; const k = g.role + '|' + g.q; if (m.has(k)) m.get(k).count += g.count; else m.set(k, { ...g }); }
  c.groups = [...m.values()].sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || b.q - a.q);
  c.groups.forEach((g, i) => { g.id = c.id + '-g' + i; });
}
function removeLowest(c, role, n) {
  const gs = c.groups.filter(g => g.role === role).sort((a, b) => a.q - b.q);
  for (const g of gs) { const k = Math.min(n, g.count); g.count -= k; n -= k; if (!n) break; }
  return n === 0;
}
export const roleCount = (c, role) => c.groups.filter(g => g.role === role).reduce((n, g) => n + g.count, 0);
export function packagesFor(S, c) {
  const r = new Rng(mix32(S.seed, 'pkg', S.season, S.week, c.id));
  const base = DIV_BASE[c.division], out = [];
  const offs = [-3, -2, -1, 0, 1, 2, 3.5, 5.5];
  for (let i = 0; i < offs.length; i++) {
    const role = i === offs.length - 1 && r.chance(0.5) ? 'captain' : r.pick(ROLES.filter(x => x !== 'captain'));
    const count = role === 'captain' ? 1 : r.irange(4, 10);
    const q = round1(clamp(base + offs[i] + r.range(-0.5, 0.5), 15, 95));
    out.push({ id: i, role, count, q, price: Math.round(count * unitPrice(q) * (0.9 + 0.2 * r.next())) });
  }
  return out;
}
export function buyPackage(S, c, pkg, mode) {
  if (!inWindow(S)) return fail('The transfer window is closed (' + nextWindowText(S) + ').');
  if (!pkg) return fail('Unknown package.');
  if (S.market.bought && S.market.bought[weekKey(S) + c.id + pkg.id]) return fail('Package already bought.');
  if (actionsLeft(S, c) <= 0) return fail('No management actions left this week.');
  if (c.budget < pkg.price) return fail('Not enough Credits.');
  if (pkg.role === 'captain' || mode !== 'reserve') { if (roleCount(c, pkg.role) < pkg.count) return fail(`You have fewer than ${pkg.count} ${ROLE_LABEL[pkg.role]}s to replace.`); }
  else if (standardCount(c) + pkg.count > MAX_STANDARD) return fail(`Reserve capacity: at most ${MAX_STANDARD} registered standard players.`);
  useAction(S, c); spend(S, c, pkg.price, `Bought ${pkg.count} ${ROLE_LABEL[pkg.role]} (Q${pkg.q})`);
  if (pkg.role === 'captain' || mode !== 'reserve') removeLowest(c, pkg.role, pkg.count);
  c.groups.push({ id: 'new', role: pkg.role, count: pkg.count, q: pkg.q }); normalizeGroups(c);
  S.market.bought = S.market.bought || {}; S.market.bought[weekKey(S) + c.id + pkg.id] = 1;
  news(S, c, `Signed ${pkg.count} ${ROLE_LABEL[pkg.role]}${pkg.count > 1 ? 's' : ''} of quality ${pkg.q}.`);
  return { ok: true };
}
export const trainCost = c => Math.round(40 * Math.pow(divFactor(c.division), 0.8));
// training saturates near a division ceiling (better Training Centre = higher ceiling); packages/stars go beyond it
export const trainCap = c => DIV_BASE[c.division] + 3 + 0.5 * (c.fac.training - 1);
export function trainGain(c, g) {
  const f = clamp((trainCap(c) - g.q) / 3, 0.04, 1);
  return Math.max(0.1, round1((0.6 + 0.12 * (c.fac.training - 1)) * f));
}
export function trainGroup(S, c, groupId) {
  const g = c.groups.find(x => x.id === groupId); if (!g) return fail('Unknown group.');
  if (actionsLeft(S, c) <= 0) return fail('No management actions left this week.');
  const cost = trainCost(c); if (c.budget < cost) return fail('Not enough Credits.');
  useAction(S, c); spend(S, c, cost, `Training: ${ROLE_LABEL[g.role]}`);
  const gain = trainGain(c, g); g.q = round1(Math.min(99, g.q + gain)); normalizeGroups(c);
  news(S, c, `${ROLE_LABEL[g.role]} group trained: +${gain} quality.`);
  return { ok: true, gain };
}
export function retrain(S, c, groupId, toRole, n) {
  const g = c.groups.find(x => x.id === groupId); if (!g) return fail('Unknown group.');
  n = Math.floor(+n);
  if (!(n >= 1 && n <= 6)) return fail('Retrain 1–6 players at a time.');
  if (g.role === 'captain' || toRole === 'captain' || !ROLES.includes(toRole) || toRole === g.role) return fail('Invalid role change (the captain is fixed).');
  if (g.count < n) return fail('Not enough players in that group.');
  if (actionsLeft(S, c) <= 0) return fail('No management actions left this week.');
  const cost = Math.round(trainCost(c) * 0.6); if (c.budget < cost) return fail('Not enough Credits.');
  useAction(S, c); spend(S, c, cost, 'Role retraining');
  g.count -= n; c.groups.push({ id: 'new', role: toRole, count: n, q: round1(g.q - 1) }); normalizeGroups(c);
  news(S, c, `${n} ${ROLE_LABEL[g.role]}s retrained as ${ROLE_LABEL[toRole]}s.`);
  return { ok: true };
}
export function trainStar(S, c, starId) {
  const s = S.stars[starId]; if (!s || s.clubId !== c.id) return fail('Not your star.');
  if (actionsLeft(S, c) <= 0) return fail('No management actions left this week.');
  const cost = trainCost(c); if (c.budget < cost) return fail('Not enough Credits.');
  useAction(S, c); spend(S, c, cost, `Star training: ${s.name}`);
  const lv = addXP(s, XP_TRAIN, c.fac.training);
  news(S, c, `${s.name} completed individual training${lv ? ' and reached level ' + s.level : ''}.`);
  return { ok: true, levels: lv };
}
export function upgradeFacility(S, c, f) {
  if (!(f in c.fac)) return fail('Unknown facility.');
  if (c.fac[f] >= FAC_MAX) return fail('Already at maximum level.');
  if (actionsLeft(S, c) <= 0) return fail('No management actions left this week.');
  const cost = facCost(f, c.fac[f]); if (c.budget < cost) return fail('Not enough Credits.');
  useAction(S, c); spend(S, c, cost, `${FAC_LABEL[f]} upgrade`);
  c.fac[f]++; news(S, c, `${FAC_LABEL[f]} upgraded to level ${c.fac[f]}.`, 'good');
  return { ok: true };
}

// ---------- stars: squad decisions (free) ----------
export function setActiveStars(S, c, ids) {
  ids = [...new Set(ids)];
  if (ids.length > MAX_ACTIVE_STARS) return fail(`At most ${MAX_ACTIVE_STARS} stars can play.`);
  for (const id of ids) { const s = S.stars[id]; if (!s || s.clubId !== c.id) return fail('Not your star.'); }
  if (ids.filter(id => S.stars[id].role === 'captain').length > 1) return fail('Only one captain can play.');
  c.activeStars = ids; return { ok: true };
}
export function chooseSpec(S, c, starId, specId) {
  const s = S.stars[starId]; if (!s || s.clubId !== c.id) return fail('Not your star.');
  if (pendingSpecs(s) <= 0) return fail('No specialisation choice available.');
  if (!SPECS[s.role].some(x => x.id === specId)) return fail('Invalid specialisation.');
  s.specs.push(specId); return { ok: true };
}
export function renewContract(S, c, starId, years) {
  const s = S.stars[starId]; if (!s || s.clubId !== c.id) return fail('Not your star.');
  years = Math.floor(+years); if (!(years >= 1 && years <= 3)) return fail('Contracts run 1–3 seasons.');
  if (s.contract >= 2 && s.renewedSeason === S.season) return fail('Already renewed this season.');
  const wage = Math.round(wageFor(s, c.division) * 1.1);
  s.contract = years; s.wage = Math.max(s.wage, wage); s.renewedSeason = S.season;
  news(S, c, `${s.name} signed a ${years}-season extension (${s.wage} C/week).`);
  return { ok: true, wage: s.wage };
}
export function listStar(S, c, starId, on) {
  const s = S.stars[starId]; if (!s || s.clubId !== c.id) return fail('Not your star.');
  if (on && s.lockSeason === S.season) return fail('Stars signed this season cannot be resold until next season.');
  s.listed = !!on; return { ok: true };
}
export function releaseStar(S, c, starId) {
  const s = S.stars[starId]; if (!s || s.clubId !== c.id) return fail('Not your star.');
  const comp = s.wage * 10; if (!c.ai && c.budget < comp) return fail(`Releasing costs ${comp} C compensation.`);
  spend(S, c, comp, `Released ${s.name}`); detach(S, s); s.clubId = null; s.listed = false;
  news(S, c, `${s.name} was released.`); return { ok: true };
}
function detach(S, s) {
  const old = s.clubId ? S.clubs[s.clubId] : null;
  if (old) { old.stars = old.stars.filter(x => x !== s.id); old.activeStars = old.activeStars.filter(x => x !== s.id); }
}

// ---------- transfers (atomic) ----------
export function askFor(S, buyer, s) {
  const seller = s.clubId ? S.clubs[s.clubId] : null;
  const value = starValue(s);
  const fee = !seller ? 0 : Math.round(value * (s.listed ? 1.0 : 1.35) / 10) * 10;
  const starDiv = seller ? seller.division : divOfOvr(s.ovr);
  const gap = Math.max(0, buyer.division - starDiv);
  const wage = Math.round(wageFor(s, buyer.division) * (1 + 0.10 * gap) * (1.1 - Math.min(0.2, buyer.rep / 500)));
  // ambition: stars will not drop far below their level (reputation can open a door, never by much)
  const levelGap = buyer.division - divOfOvr(s.ovr);
  const refuses = (levelGap >= 4 && buyer.rep < 60) || levelGap >= 6 || ((s.rarity === 'elite' || s.rarity === 'generational') && gap >= 5 && buyer.rep < 40);
  return { fee, wage, value, refuses };
}
export function executeTransfer(S, starId, buyerId, fee, wage, years) {
  const s = S.stars[starId], buyer = S.clubs[buyerId];
  if (!s || !buyer) return fail('Unknown star or club.');
  if (s.clubId === buyerId) return fail('Already at this club.');
  if (buyer.stars.length >= MAX_STARS) return fail(`Squad limit: ${MAX_STARS} contracted stars.`);
  if (!(fee >= 0) || !(wage > 0) || !(years >= 1 && years <= 3)) return fail('Invalid terms.');
  if (buyer.budget < fee) return fail('Not enough Credits.');
  if (!inWindow(S)) return fail('The transfer window is closed.');
  const seller = s.clubId ? S.clubs[s.clubId] : null;
  // --- commit (single step: money and ownership move together) ---
  buyer.budget -= fee; if (seller) seller.budget += fee;
  detach(S, s);
  s.clubId = buyerId; buyer.stars.push(s.id);
  s.wage = Math.round(wage); s.contract = years; s.listed = false; s.lockSeason = S.season;
  s.eligible = { season: S.season, week: S.week + 1 }; // registration: plays from next week (week squads are locked)
  s.career.push({ s: S.season, w: S.week, from: seller ? seller.id : null, to: buyerId, fee });
  const t = { id: 'T' + S.nextTransfer++, s: S.season, w: S.week, star: s.id, from: seller ? seller.id : null, to: buyerId, fee };
  S.transfers.push(t); if (S.transfers.length > 600) S.transfers.splice(0, S.transfers.length - 600);
  if (!buyer.ai) { S.ledger.push({ s: S.season, w: S.week, label: `Signed ${s.name}`, amount: -fee }); pushNews(S, `${s.name} joins ${buyer.name} for ${fee} C (${s.wage} C/week, ${years} season${years > 1 ? 's' : ''}).`, 'good'); }
  if (seller && !seller.ai) { S.ledger.push({ s: S.season, w: S.week, label: `Sold ${s.name}`, amount: fee }); pushNews(S, `${s.name} sold to ${buyer.name} for ${fee} C.`, 'good'); }
  if (seller && seller.ai) autoPickStars(seller, S.stars);
  return { ok: true, transfer: t };
}
// direct signing at asking terms (used by AI clubs; same validation, same prices, one management action)
export function signAtAsk(S, c, starId, years) {
  const s = S.stars[starId]; if (!s) return fail('Unknown star.');
  if (actionsLeft(S, c) <= 0) return fail('No management actions left this week.');
  const a = askFor(S, c, s); if (a.refuses) return fail('Refused.');
  const r = executeTransfer(S, starId, c.id, a.fee, a.wage, years);
  if (r.ok) useAction(S, c);
  return r;
}
export function openTalk(S, c, starId) {
  const s = S.stars[starId]; if (!s) return fail('Unknown star.');
  if (s.clubId === c.id) return fail('Already your player.');
  if (!inWindow(S)) return fail('The transfer window is closed (' + nextWindowText(S) + ').');
  if (s.academy) return fail('Academy prospects cannot be bought.');
  const T = S.market.talks[starId];
  if (T && T.season === S.season && T.window === windowIndex(S)) { if (T.closed) return fail('Talks broke down; try again next window.'); return { ok: true, talk: T }; }
  if (c.stars.length >= MAX_STARS) return fail(`Squad limit: ${MAX_STARS} contracted stars.`);
  if (!s.listed && s.clubId && !S.scouting.known[starId]) return fail('Scout this player before approaching his club.');
  const ask = askFor(S, c, s);
  if (ask.refuses) return fail(`${s.name} is not interested in joining a Division ${c.division} club right now.`);
  if (actionsLeft(S, c) <= 0) return fail('No management actions left this week.');
  useAction(S, c);
  const talk = { starId, season: S.season, window: windowIndex(S), rounds: 0, closed: false, done: false, ask, last: null };
  S.market.talks[starId] = talk; return { ok: true, talk };
}
const windowIndex = S => TRANSFER_WINDOWS.findIndex(([a, b]) => S.week >= a && S.week <= b);
export function makeOffer(S, c, starId, fee, wage, years) {
  const T = S.market.talks[starId]; const s = S.stars[starId];
  if (!T || T.season !== S.season || T.window !== windowIndex(S)) return fail('Open talks first.');
  if (T.closed || T.done) return fail('These talks are finished.');
  fee = Math.round(+fee); wage = Math.round(+wage); years = Math.floor(+years);
  if (!(fee >= 0) || !(wage >= 1) || !(years >= 1 && years <= 3)) return fail('Invalid offer.');
  if (fee > c.budget) return fail('You cannot afford that fee.');
  T.rounds++;
  const yf = years === 3 ? 0.96 : years === 1 ? 1.04 : 1;
  const clubOk = fee >= T.ask.fee * 0.95, starOk = wage >= T.ask.wage * yf;
  if (clubOk && starOk) {
    const r = executeTransfer(S, starId, c.id, fee, wage, years);
    if (!r.ok) { T.rounds--; return r; }
    T.done = true; T.last = 'accepted'; return { ok: true, accepted: true };
  }
  const msg = [];
  if (!clubOk) msg.push(`the club wants about ${Math.round(T.ask.fee * 0.95 / 10) * 10} C`);
  if (!starOk) msg.push(`${s.name} wants about ${Math.ceil(T.ask.wage * yf)} C/week`);
  if (T.rounds >= MAX_OFFERS_PER_TALK) { T.closed = true; T.last = 'Talks broke down: ' + msg.join(' and ') + '.'; return { ok: true, accepted: false, closed: true, msg: T.last }; }
  T.last = 'Rejected: ' + msg.join(' and ') + `. ${MAX_OFFERS_PER_TALK - T.rounds} offer(s) left.`;
  return { ok: true, accepted: false, msg: T.last };
}
// AI bids for the player's listed stars (window only). Bids are below value: no buy-low/sell-high loop.
export function generateIncomingBids(S) {
  const P = S.clubs[S.playerId]; if (!inWindow(S)) { S.market.incoming = []; return; }
  const r = new Rng(mix32(S.seed, 'bids', S.season, S.week));
  S.market.incoming = S.market.incoming.filter(b => b.key === weekKey(S));
  for (const id of P.stars) {
    const s = S.stars[id]; if (!s.listed || S.market.incoming.some(b => b.star === id)) continue;
    if (!r.chance(0.6)) continue;
    const buyers = Object.values(S.clubs).filter(c => c.ai && c.stars.length < MAX_STARS && Math.abs(c.division - P.division) <= 2);
    if (!buyers.length) continue;
    const b = buyers[r.int(buyers.length)];
    const fee = Math.round(starValue(s) * r.range(0.6, AI_BUY_SHARE) / 10) * 10;
    if (b.budget < fee) continue;
    S.market.incoming.push({ key: weekKey(S), star: id, club: b.id, fee, wage: Math.max(s.wage, wageFor(s, b.division)) });
  }
}
export function acceptBid(S, idx) {
  const b = S.market.incoming[idx]; if (!b || b.key !== weekKey(S)) return fail('Offer expired.');
  const s = S.stars[b.star]; if (!s || s.clubId !== S.playerId) return fail('Player no longer at your club.');
  const r = executeTransfer(S, b.star, b.club, b.fee, b.wage, 2);
  if (r.ok) S.market.incoming = S.market.incoming.filter(x => x.star !== b.star);
  return r;
}

// ---------- scouting ----------
export const scoutDuration = c => Math.max(1, 4 - Math.floor(c.fac.scout / 2));
export const scoutSlots = c => 1 + Math.floor(c.fac.scout / 3);
export function startScout(S, c, role, band) {
  if (role !== 'any' && !ROLES.includes(role)) return fail('Unknown role.');
  if (!['lower', 'same', 'higher'].includes(band)) return fail('Unknown region.');
  const active = S.scouting.missions.filter(m => !m.done);
  if (active.length >= scoutSlots(c)) return fail(`Scout Office level ${c.fac.scout} supports ${scoutSlots(c)} mission(s) at a time.`);
  if (actionsLeft(S, c) <= 0) return fail('No management actions left this week.');
  const cost = Math.round(15 * divFactor(c.division)); if (c.budget < cost) return fail('Not enough Credits.');
  useAction(S, c); spend(S, c, cost, 'Scouting mission');
  const m = { id: S.scouting.nextMission++, role, band, startS: S.season, startW: S.week, weeks: scoutDuration(c), left: scoutDuration(c), done: false, found: [] };
  S.scouting.missions.push(m); news(S, c, `Scouts sent to watch ${band === 'same' ? 'your division' : band + ' divisions'}${role !== 'any' ? ' for ' + ROLE_LABEL[role] + 's' : ''}.`);
  return { ok: true, mission: m };
}
export function progressScouting(S) {
  const P = S.clubs[S.playerId];
  for (const m of S.scouting.missions) {
    if (m.done || (m.startS === S.season && m.startW === S.week)) continue;
    m.left--;
    if (m.left > 0) continue;
    m.done = true;
    const r = new Rng(mix32(S.seed, 'scout', m.id));
    const dmin = m.band === 'higher' ? Math.max(1, P.division - 3) : m.band === 'same' ? P.division : P.division + 1;
    const dmax = m.band === 'higher' ? Math.max(1, P.division - 1) : m.band === 'same' ? P.division : Math.min(10, P.division + 3);
    let cand = Object.values(S.stars).filter(s => !s.academy && s.clubId && s.clubId !== P.id && (m.role === 'any' || s.role === m.role) && S.clubs[s.clubId].division >= dmin && S.clubs[s.clubId].division <= dmax);
    if (!cand.length) cand = Object.values(S.stars).filter(s => !s.academy && s.clubId && s.clubId !== P.id && (m.role === 'any' || s.role === m.role));
    cand.sort((a, b) => (a.id < b.id ? -1 : 1)); r.shuffle(cand);
    const n = 2 + Math.floor(P.fac.scout / 2);
    m.found = cand.slice(0, n).map(s => s.id);
    for (const id of m.found) S.scouting.known[id] = { acc: P.fac.scout, s: S.season, w: S.week };
    pushNews(S, `Scouting report ready: ${m.found.length} player(s) assessed.`, 'good');
  }
  if (S.scouting.missions.length > 30) S.scouting.missions = S.scouting.missions.slice(-30);
}
// what the player is allowed to see about a star (ranges until scouted)
export function starIntel(S, s) {
  const P = S.clubs[S.playerId];
  if (s.clubId === P.id || s.academy === P.id) return { exact: true, ovr: [s.ovr, s.ovr], pot: [s.pot, s.pot], value: [starValue(s), starValue(s)] };
  const k = S.scouting.known[s.id]; const acc = k ? k.acc : 0;
  const ow = k ? Math.max(0, 6 - acc) : 6, pw = k ? Math.max(1, 12 - 2 * acc) : 15, vw = k ? Math.max(0.03, 0.2 - 0.03 * acc) : 0.3;
  // deterministic offset so ranges do not "move" every time the screen opens
  const r = new Rng(mix32(S.seed, 'intel', s.id, acc));
  const oc = s.ovr + (r.next() - 0.5) * ow, pc = s.pot + (r.next() - 0.5) * pw, v = starValue(s);
  return { exact: false, scouted: !!k, acc, ovr: [round1(Math.max(1, oc - ow / 2)), round1(Math.min(99, oc + ow / 2))], pot: [Math.round(Math.max(1, pc - pw / 2)), Math.round(Math.min(99, pc + pw / 2))], value: [Math.round(v * (1 - vw) / 10) * 10, Math.round(v * (1 + vw) / 10) * 10] };
}

// ---------- academy ----------
export function academyIntake(S, c, tag) {
  const r = new Rng(mix32(S.seed, 'acad', S.season, tag, c.id));
  const n = 1 + (c.fac.academy >= 4 ? 1 : 0) + (r.chance(0.25) ? 1 : 0);
  const RAR = ['rising', 'promising', 'elite', 'generational'];
  const nf = makeNameFactory(mix32(S.seed, 'acadnames', S.season, tag, c.id));
  for (const s of Object.values(S.stars)) nf.reserve(s.name);
  const out = [];
  for (let i = 0; i < n; i++) {
    const id = 'P' + String(S.nextStar++).padStart(4, '0');
    const rar = RAR[r.weighted(ACADEMY_RARITY[c.fac.academy])];
    const s = makeStar(r, { id, name: nf.person(), role: r.pick(ROLES), age: r.irange(16, 18), ovr: round1(DIV_BASE[c.division] - 8 + r.range(-3, 4) + c.fac.academy * 0.6), rarity: rar, clubId: null, level: 1 });
    s.academy = c.id; s.contract = 0; s.wage = Math.max(5, Math.round(s.wage * 0.6)); s.intake = { s: S.season, tag };
    S.stars[id] = s; out.push(s);
  }
  return out;
}
export function promoteProspect(S, c, id) {
  const s = S.stars[id]; if (!s || s.academy !== c.id) return fail('Not your prospect.');
  if (c.stars.length >= MAX_STARS) return fail(`Squad limit: ${MAX_STARS} contracted stars.`);
  s.academy = null; s.clubId = c.id; s.contract = 3; s.eligible = { season: S.season, week: S.week + 1 };
  c.stars.push(id); s.career.push({ s: S.season, w: S.week, from: 'academy', to: c.id, fee: 0 });
  news(S, c, `${s.name} promoted from the academy (${s.wage} C/week).`, 'good');
  return { ok: true };
}
export function releaseProspect(S, c, id) {
  const s = S.stars[id]; if (!s || s.academy !== c.id) return fail('Not your prospect.');
  s.academy = null; s.clubId = null; s.contract = 1; // becomes a free agent in the world pool
  return { ok: true };
}
export function chooseSponsor(S, c, type) {
  if (!SPONSOR_TYPES[type]) return fail('Unknown sponsor.');
  if (S.week !== 1 || (c.sponsorSeason === S.season)) return fail('Sponsor deals are signed in week 1 for the whole season.');
  c.sponsor = type; c.sponsorSeason = S.season; return { ok: true };
}
export { MIN_STANDARD, SEASON_WEEKS };
