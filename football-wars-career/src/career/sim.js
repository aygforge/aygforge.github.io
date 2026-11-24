// World match execution: the SAME career battle engine as the player's matches, without drawing.
import { runMatch } from '../battle/run.js';
import { snapshot, coachPolicy } from '../battle/adapter.js';
import { fixtureSeed } from './season.js';

export function compactResult(job, s) {
  return { winner: s.winner, alive: s.alive, kills: s.kills, battleT: s.battleT, tiebreak: s.tiebreak, hash: s.hash, seed: s.seed, endTick: s.endTick,
    football: s.football ? { goals: s.football.goals, shots: s.football.shots, onTarget: s.football.onTarget, saves: s.football.saves, passes: s.football.passes, passAtt: s.football.passAtt, intercepts: s.football.intercepts, steals: s.football.steals, possession: s.football.possession } : null,
    stars: s.stars, tactics: [job.home.tactic, job.away.tactic], cmds: s.cmds };
}
export function simJob(job) { return compactResult(job, runMatch(job)); }
export function simJobs(jobs, onProgress) { const out = {}; jobs.forEach((j, i) => { out[j.fid] = simJob(j); if (onProgress) onProgress(i + 1, jobs.length); }); return out; }

// job for one of the player's fixtures. mode: 'auto' (assistant coach) or 'play' (human; coach only for the AI side)
export function playerJob(S, f, mode, commands) {
  const L = S.lock; const meHome = f.home === S.playerId;
  const P = S.clubs[S.playerId];
  const mine = snapshot(P, S.stars, S.season, S.week);
  const opp = L.snaps[(meHome ? f.away : f.home) + '@' + f.id];
  const oppClub = S.clubs[meHome ? f.away : f.home];
  const pc = mode === 'play' ? null : coachPolicy(P);
  const job = { fid: f.id, seed: fixtureSeed(S, f), home: meHome ? mine : opp, away: meHome ? opp : mine,
    coach: meHome ? [pc, coachPolicy(oppClub)] : [coachPolicy(oppClub), pc], commands: commands || [], playerSide: meHome ? 0 : 1, mode };
  return job;
}
