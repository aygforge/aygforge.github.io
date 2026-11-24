// Balanced Football Economy: weekly sponsor/wages/upkeep, match income, prizes, advances.
import { SPONSOR, REF_EXPENSE, WAGE_SHARE, divFactor, MATCH_PAY, DIV_BASE, FACILITIES, facUpkeep, STADIUM_CAP, SPONSOR_TYPES,
  ADVANCE_WEEKS, ADVANCE_REPAY_SHARE, LEAGUE_PRIZE_K, SEASON_WEEKS } from '../data/balance.js';
import { clamp } from './util.js';
import { LEAGUE_MATCHES } from './schedule.js';

export function avgStandardQ(c) { let n = 0, s = 0; for (const g of c.groups) { n += g.count; s += g.count * g.q; } return n ? s / n : 0; }
export function standardCount(c) { return c.groups.reduce((n, g) => n + g.count, 0); }
export function weeklyBreakdown(S, c) {
  const d = c.division, sp = SPONSOR_TYPES[c.sponsor] || SPONSOR_TYPES.guaranteed;
  const sponsor = Math.round(SPONSOR[d] * sp.base);
  const commercial = Math.round(SPONSOR[d] * 0.04 * (c.fac.fans - 1) * (0.6 + 0.4 * clamp(c.rep / 50, 0, 2)));
  const qf = 1 + Math.max(0, avgStandardQ(c) - DIV_BASE[d]) * 0.02;
  const wages = Math.round(REF_EXPENSE[d] * WAGE_SHARE * qf);
  const upkeep = Math.round(REF_EXPENSE[d] * (1 - WAGE_SHARE) / 6 * FACILITIES.reduce((n, f) => n + facUpkeep(c.fac[f]), 0));
  const starWages = c.stars.reduce((n, id) => n + (S.stars[id] ? S.stars[id].wage : 0), 0);
  const repay = c.advance.debt > 0 ? Math.min(c.advance.debt, Math.round(SPONSOR[d] * ADVANCE_REPAY_SHARE)) : 0;
  return { sponsor, commercial, wages: -wages, upkeep: -upkeep, starWages: -starWages, repay: -repay, net: sponsor + commercial - wages - upkeep - starWages - repay };
}
export function applyWeeklyFinance(S, c) {
  const key = `S${S.season}W${S.week}`;
  if (c.lastFinance === key || S.week > SEASON_WEEKS) return null; // never twice, only the 38 world weeks
  const b = weeklyBreakdown(S, c);
  c.budget += b.net; c.advance.debt += b.repay; c.lastFinance = key;
  if (!c.ai) ledger(S, 'Weekly finances', b.net, b);
  return b;
}
export function ledger(S, label, amount, detail) {
  S.ledger.push({ s: S.season, w: S.week, label, amount: Math.round(amount), detail: detail || null });
  if (S.ledger.length > 400) S.ledger.splice(0, S.ledger.length - 400);
}
export const attendance = c => Math.min(STADIUM_CAP[c.fac.stadium - 1], Math.round(c.fans));
export function matchIncome(c, home, won, div) {
  const f = divFactor(div || c.division);
  const appearance = Math.round(MATCH_PAY.appearance * f);
  const ticket = home ? Math.round(attendance(c) / 600 * MATCH_PAY.ticket * Math.sqrt(f)) : 0;
  const win = won ? Math.round(MATCH_PAY.win * f) : 0;
  return { appearance, ticket, win, total: appearance + ticket + win };
}
export function performanceBonus(c) { return Math.round(SPONSOR[c.division] * 0.6 * 38 / LEAGUE_MATCHES(c.division)); }
export const leaguePrize = (div, pos) => Math.round(SPONSOR[div] * Math.max(0, 11 - pos) * LEAGUE_PRIZE_K);
export function canAdvance(S, c) { return c.advance.usedSeason !== S.season && c.advance.debt <= 0; }
export function takeAdvance(S, c) {
  if (!canAdvance(S, c)) return { ok: false, reason: 'Advance already used this season.' };
  const amt = SPONSOR[c.division] * ADVANCE_WEEKS;
  c.budget += amt; c.advance.debt = amt; c.advance.usedSeason = S.season;
  if (!c.ai) ledger(S, 'Sponsor advance', amt);
  return { ok: true, amount: amt };
}
export function spend(S, c, amount, label) {
  if (!(amount >= 0) || !Number.isFinite(amount)) return { ok: false, reason: 'Invalid amount.' };
  if (c.budget < amount) return { ok: false, reason: 'Not enough Credits.' };
  c.budget -= amount; if (!c.ai) ledger(S, label, -amount);
  return { ok: true };
}
export function earn(S, c, amount, label) { if (!(amount >= 0)) return; c.budget += Math.round(amount); if (!c.ai) ledger(S, label, amount); }
