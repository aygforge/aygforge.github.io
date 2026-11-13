/* FOOTBALL WARS V2 — Cinematic Battle Director.
 * 1) Smart Battle Camera   2) Battle Story Events   3) Smart Video Director (edit plan)
 * Everything here is cosmetic: it reads the world after each fixed tick (observer) or the finished
 * event log, never uses the battle RNG, never changes units/score/events/hash. Deterministic: the
 * same seed + settings give the same camera path and alerts live and in the export. */
(function (root) {
'use strict';
const E = root.FWEngine;
const LW = 360, LH = 640, HUD_H = 100;

// ---------- configurable thresholds ----------
const ALERT_CFG = {
  comebackDeficit: 10,      // COMEBACK: was 10+ behind, now strictly leads
  leadChange: 5,            // LEAD CHANGE: +5 for one side -> +5 for the other
  dominate: 20, dominateSec: 2,   // DOMINATING: 20+ lead held for 2 s
  streak: 5,                // 5-KO STREAK: one unit reaches 5 real eliminations
  final: 10,                // FINAL 10: total alive <= 10
  clutchMax: 3,             // CLUTCH VICTORY: winner finishes with 1..3 survivors
  cooldown: 3.0, urgentGap: 1.2, maxAlerts: 7, showSec: 1.15,
  perType: { CAPTAIN_DOWN: 2, STREAK: 2, LEAD_CHANGE: 2 }
};
const PRIO = { DUEL: 99, LAST_PLAYER: 98, FINAL10: 95, COMEBACK: 100, LEAD_CHANGE: 70, CAPTAIN_DOWN: 60, STREAK: 50, DOMINATING: 30 };
const ALERT_TXT = {
  en: { F_SAVE: 'WHAT A SAVE!', F_POST: 'POST!', F_WIDE: 'WIDE!', F_INT: 'INTERCEPTION!', F_PASS: 'GREAT PASSING!', F_SHOT: 'SHOT ON TARGET!', DUEL: 'FINAL DUEL!', LAST_HOPE: 'LAST HOPE!', COMEBACK: 'COMEBACK!', LEAD_CHANGE: 'LEAD CHANGE!', DOMINATING: 'DOMINATING!', CAPTAIN_DOWN: 'CAPTAIN DOWN!', STREAK: '5-KO STREAK!', FINAL10: 'FINAL 10!', LAST_PLAYER: 'LAST PLAYER!', CLUTCH: 'CLUTCH VICTORY!' },
  tr: { F_SAVE: 'MÜTHİŞ KURTARIŞ!', F_POST: 'DİREK!', F_WIDE: 'AUT!', F_INT: 'PAS ARASI!', F_PASS: 'HARİKA PASLAŞMA!', F_SHOT: 'İSABETLİ ŞUT!', DUEL: 'FİNAL DÜELLOSU!', LAST_HOPE: 'SON UMUT!', COMEBACK: 'GERİ DÖNÜŞ!', LEAD_CHANGE: 'LİDERLİK DEĞİŞTİ!', DOMINATING: 'TAM HAKİMİYET!', CAPTAIN_DOWN: 'KAPTAN DÜŞTÜ!', STREAK: '5 KO SERİSİ!', FINAL10: 'SON 10!', LAST_PLAYER: 'SON OYUNCU!', CLUTCH: 'KRİTİK ZAFER!' }
};
const CAM_CFG = {
  low:       { zmax: 1.12, zfinal: 1.20, hold: 2.5, rate: 0.9, pan: 60, zrate: 0.15 },
  normal:    { zmax: 1.28, zfinal: 1.36, hold: 1.9, rate: 1.4, pan: 85, zrate: 0.22 },
  cinematic: { zmax: 1.28, zfinal: 1.40, hold: 1.5, rate: 1.9, pan: 110, zrate: 0.28 }
};
const HEAT = {}; // event type -> weight for camera hot-spots
function initHeat() { const V = E.EV; HEAT[V.KO] = 3; HEAT[V.CRIT] = 1; HEAT[V.SPECIAL] = 4; HEAT[V.SPECIAL_FIRE] = 4; HEAT[V.SAVE] = 1.5; HEAT[V.EXPLODE] = 3; HEAT[V.TACKLE] = 0.4; }
function cl(v, a, b) { return v < a ? a : v > b ? b : v; }

// ======================= observer (camera + story alerts) =======================
function createObserver(opt) {
  if (!HEAT[E.EV.KO]) initHeat();
  opt = opt || {};
  const C = CAM_CFG[opt.intensity] || CAM_CFG.normal;
  const A = Object.assign({}, ALERT_CFG, opt.alertCfg || {});
  const st = {
    smartCam: opt.smartCam !== false, evIdx: 0, heat: [], timeline: [],
    cam: { x: LW / 2, y: E.MIDY, z: 1 }, tgt: { x: LW / 2, y: E.MIDY, z: 1 }, lastCommit: -99, nextEval: 0,
    alerts: [], lastAlertT: -99, used: {}, done: {}, maxDef: [0, 0], bigLeader: -1, domStart: [-1, -1], clutch: false, camStats: { zMax: 1, commits: 0 },
    // V3 (all cosmetic, derived only from real events / alive counts)
    epic: opt.epicFinale !== false, mvpStreaks: opt.mvpStreaks !== false, fbAlerts: opt.fbAlerts !== false, fbFollow: opt.fbFollow !== false, fbUsed: 0, fbLast: -99, fbFocus: -99,
    mom: 0, momRaw: 0, momWin: [], momSum: [0, 0], tags: [], lastTag: -99, tagDone: {}, saves: {}, duel: null, hope: null
  };
  function inView(cam, u) { const hw = LW / cam.z / 2, hh = LH / cam.z / 2; return u.x > cam.x - hw + 6 && u.x < cam.x + hw - 6 && u.y > cam.y - hh + HUD_H / cam.z && u.y < cam.y + hh - 6; }
  function evalCamera(w) {
    const alive = []; for (const u of w.units) if (u.alive) alive.push(u);
    const n = alive.length; if (!n) return null;
    const xs = alive.map(u => u.x).sort((a, b) => a - b), ys = alive.map(u => u.y).sort((a, b) => a - b);
    const q = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.round((arr.length - 1) * p)))];
    const lo = n > 12 ? 0.06 : 0, hi = n > 12 ? 0.94 : 1;
    const x0 = q(xs, lo), x1 = q(xs, hi), y0 = q(ys, lo), y1 = q(ys, hi);
    // hot-spot: unit density per coarse cell + recent real events (last 1.5 s)
    const CW = 60, CH = 64, cols = 6, rows = 10, sc = new Float32Array(cols * rows);
    for (const u of alive) sc[cl((u.y / CH) | 0, 0, rows - 1) * cols + cl((u.x / CW) | 0, 0, cols - 1)] += 1;
    for (const h of st.heat) { const age = w.t - h.t; if (age > 1.5) continue; sc[cl((h.y / CH) | 0, 0, rows - 1) * cols + cl((h.x / CW) | 0, 0, cols - 1)] += h.w * 3 * (1 - age / 1.5); }
    let best = 0, bi = 0; for (let i = 0; i < sc.length; i++) if (sc[i] > best) { best = sc[i]; bi = i; }
    const hx = (bi % cols + 0.5) * CW, hy = (Math.floor(bi / cols) + 0.5) * CH;
    const bw = x1 - x0, bh = y1 - y0;
    const finalPhase = n <= 6;
    const zmax = finalPhase ? C.zfinal : C.zmax;
    let z = Math.min(LW / (bw + 56), (LH - HUD_H) / (bh + 70));
    if (w.battleT < 2.5) z = 1;                       // wide shot until the first big clash
    z = cl(z, 1, zmax);
    const bx = (x0 + x1) / 2, by = (y0 + y1) / 2;
    const k = z > 1.02 ? 0.4 : 0.15;
    let fx = bx * (1 - k) + hx * k, fy = by * (1 - k) + hy * k;
    if (st.fbFollow && w.fb && w.t - st.fbFocus < 0.6) { const b = w.fb.ball; fx = fx * 0.4 + b.x * 0.6; fy = fy * 0.4 + b.y * 0.6; z = cl(Math.max(z, 1.12), 1, 1.3); }
    const cy = fy - (HUD_H / 2) / z;                  // keep focus centred below the fixed HUD
    return { x: fx, y: cy, z, x0, x1, y0, y1 };
  }
  function cameraTick(w) {
    const t = w.t;
    if (!st.smartCam || w.phase === 'freeze' || w.phase === 'entry') { st.cam.x = w.cam.x; st.cam.y = w.cam.y; st.cam.z = w.cam.z; return; }
    if (w.phase === 'ended') { st.cam.x = w.cam.x; st.cam.y = w.cam.y; st.cam.z = w.cam.z; return; } // keep V1 outro camera
    if (t >= st.nextEval) {
      st.nextEval = t + 0.1;
      const c = evalCamera(w);
      if (c) {
        const d = Math.hypot(c.x - st.tgt.x, c.y - st.tgt.y), dz = Math.abs(c.z - st.tgt.z);
        // urgent: action leaving the committed frame -> allow a quicker re-frame (but not instantly)
        let outside = 0, tot = 0; for (const u of w.units) if (u.alive) { tot++; if (!inView(st.tgt, u)) outside++; }
        const urgent = tot > 0 && outside / tot > 0.15;
        const held = t - st.lastCommit;
        const fbMoment = st.fbFollow && w.fb && w.t - st.fbFocus < 0.6;
        if ((held >= C.hold && (d > 24 || dz > 0.05)) || ((urgent || fbMoment) && held >= 0.5)) {
          st.tgt.x = c.x; st.tgt.y = c.y; st.tgt.z = c.z; st.lastCommit = t; st.camStats.commits++;
        }
      }
    }
    // smooth, speed-limited follow (no jitter, no aggressive zoom)
    const dt = E.DT, k = 1 - Math.exp(-C.rate * dt);
    const mx = C.pan * dt, mz = C.zrate * dt;
    st.cam.x += cl((st.tgt.x - st.cam.x) * k, -mx, mx);
    st.cam.y += cl((st.tgt.y - st.cam.y) * k, -mx, mx);
    st.cam.z += cl((st.tgt.z - st.cam.z) * k, -mz, mz);
    st.cam.z = Math.max(1, st.cam.z);
    if (st.cam.z > st.camStats.zMax) st.camStats.zMax = st.cam.z;
    w.cam.x = st.cam.x; w.cam.y = st.cam.y; w.cam.z = st.cam.z;
  }
  function offer(c, w) { // deterministic alert scheduler
    if (st.alerts.length >= A.maxAlerts) return false;
    const gap = w.t - st.lastAlertT;
    if (!(gap >= A.cooldown || (c.prio >= 95 && gap >= A.urgentGap) || (c.prio >= 99 && gap >= 0.4))) return false;
    const lim = A.perType[c.type]; if (lim && (st.used[c.type] || 0) >= lim) return false;
    st.alerts.push({ t: w.t, type: c.type, side: c.side });
    st.used[c.type] = (st.used[c.type] || 0) + 1; st.lastAlertT = w.t;
    if (c.key) st.done[c.key] = true;
    return true;
  }
  function storyTick(w, newKOs) {
    if (w.phase !== 'battle' || w.sudden) return;
    const a = w.teams[0].alive, b = w.teams[1].alive, d = a - b, t = w.t;
    if ((w.tick % 6) === 0) st.timeline.push([t, a, b]);
    const cand = [];
    st.maxDef[0] = Math.max(st.maxDef[0], b - a); st.maxDef[1] = Math.max(st.maxDef[1], a - b);
    for (let s = 0; s < 2; s++) {
      const mine = s ? b : a, other = s ? a : b;
      if (!st.done['CB' + s] && mine > other && st.maxDef[s] >= A.comebackDeficit) cand.push({ type: 'COMEBACK', side: s, prio: PRIO.COMEBACK, key: 'CB' + s });
      if (!st.done['LP' + s] && mine === 1 && other > 1) cand.push({ type: st.epic ? 'LAST_HOPE' : 'LAST_PLAYER', side: s, prio: PRIO.LAST_PLAYER, key: 'LP' + s });
      else if (!st.epic && !st.done['LP' + s] && mine === 1 && other > 0) cand.push({ type: 'LAST_PLAYER', side: s, prio: PRIO.LAST_PLAYER, key: 'LP' + s });
      if (st.epic && mine === 1 && other > 1 && !st.hope) { const u = w.teams[s].aliveList[0]; if (u) st.hope = { t, id: u.id, side: s }; }
    }
    if (Math.abs(d) >= A.leadChange) {
      const leader = d > 0 ? 0 : 1;
      if (st.bigLeader !== -1 && leader !== st.bigLeader) cand.push({ type: 'LEAD_CHANGE', side: leader, prio: PRIO.LEAD_CHANGE });
      st.bigLeader = leader;
    }
    if (Math.abs(d) >= A.dominate) {
      const leader = d > 0 ? 0 : 1;
      if (st.domStart[leader] < 0) st.domStart[leader] = t;
      st.domStart[1 - leader] = -1;
      if (!st.done['DOM' + leader] && t - st.domStart[leader] >= A.dominateSec) cand.push({ type: 'DOMINATING', side: leader, prio: PRIO.DOMINATING, key: 'DOM' + leader });
    } else { st.domStart[0] = st.domStart[1] = -1; }
    if (st.epic && a === 1 && b === 1) {
      if (!st.duel) st.duel = { t, ids: [w.teams[0].aliveList[0].id, w.teams[1].aliveList[0].id] };
      if (!st.done.DUEL) cand.push({ type: 'DUEL', side: -1, prio: PRIO.DUEL, key: 'DUEL' }); // re-offered while the real 1v1 lasts
    }
    if (!st.done.F10 && a + b <= A.final) cand.push({ type: 'FINAL10', side: -1, prio: PRIO.FINAL10, key: 'F10' });
    for (const e of newKOs) {
      const victim = w.units[e.b];
      if (e.c === 1 && victim && !st.done['CAP' + victim.side]) cand.push({ type: 'CAPTAIN_DOWN', side: victim.side, prio: PRIO.CAPTAIN_DOWN, key: 'CAP' + victim.side });
      if (e.a >= 0 && !st.mvpStreaks) { const k = w.units[e.a]; if (k && k.kills === A.streak) cand.push({ type: 'STREAK', side: k.side, prio: PRIO.STREAK, unit: k.id }); }
    }
    if (t < E.TL.battleStart + 0.8 || !cand.length) return;
    cand.sort((p, q) => q.prio - p.prio);
    offer(cand[0], w);
  }
  // ---- V3: momentum (last 5 s of real pressure), KO streak tags, saves per unit ----
  const MOM_W = { [E.EV.HIT]: 1, [E.EV.CRIT]: 1.5, [E.EV.KO]: 0, [E.EV.SAVE]: 0 };
  function v3Event(w, e) {
    const V = E.EV;
    if (e.type === V.SAVE && e.a >= 0) st.saves[e.a] = (st.saves[e.a] || 0) + 1;
    if (w.phase !== 'battle') return;
    let side = -1, wt = 0;
    if ((e.type === V.HIT || e.type === V.CRIT) && e.a >= 0) { side = w.units[e.a].side; wt = (e.c / 10) * MOM_W[e.type]; }
    else if (e.type === V.KO && e.a >= 0) { side = w.units[e.a].side; wt = 3; }
    else if (e.type === V.SAVE && e.a >= 0) { side = w.units[e.a].side; wt = 2; }
    if (side >= 0 && wt > 0) { st.momWin.push([e.t, side, wt]); st.momSum[side] += wt; }
    if (e.type === V.KO && e.a >= 0 && st.mvpStreaks) {
      const k = w.units[e.a], n = k.kills;
      if ((n === 3 || n === 5 || n === 8 || n === 12) && !st.tagDone[k.id + ':' + n] && (e.t - st.lastTag >= 1.0 || n >= 8)) {
        st.tagDone[k.id + ':' + n] = true; st.lastTag = e.t; st.tags.push({ t: e.t, unit: k.id, n, side: k.side, x: k.x, y: k.y });
      }
    }
  }
  function momentumTick(w) {
    if (w.phase !== 'battle') return;
    const t = w.t; let i = 0;
    while (i < st.momWin.length && t - st.momWin[i][0] > 5) { st.momSum[st.momWin[i][1]] -= st.momWin[i][2]; i++; }
    if (i) st.momWin.splice(0, i);
    const a = Math.max(0, st.momSum[0]), b = Math.max(0, st.momSum[1]);
    st.momRaw = (a - b) / (a + b + 6);
    st.mom += (st.momRaw - st.mom) * (1 - Math.exp(-E.DT / 0.9));
  }
  // ---- V4 football commentary (only real football events; sparse) + camera focus moments ----
  function fbEvent(w, e) {
    const V = E.EV;
    if (e.type === V.SHOT_ON_GOAL || e.type === V.GOAL || e.type === V.SAVE_GOAL) st.fbFocus = e.t;
    if (e.type === V.SHOT_ON_GOAL || e.type === V.SAVE_GOAL || e.type === V.GOAL) st.heat.push({ t: e.t, x: e.x, y: e.y, w: e.type === V.GOAL ? 6 : 4 });
    if (!st.fbAlerts || w.phase !== 'battle') return;
    let type = null, side = -1;
    if (e.type === V.SAVE_GOAL) { type = 'F_SAVE'; side = w.units[e.a].side; }
    else if (e.type === V.POST) { type = 'F_POST'; side = w.units[e.a].side; }
    else if (e.type === V.PASS_COMPLETE && e.c === 3) { type = 'F_PASS'; side = w.units[e.a].side; }
    else if (e.type === V.PASS_INTERCEPT && (st.fbUsed < 3)) { type = 'F_INT'; side = w.units[e.a].side; }
    else if (e.type === V.WIDE && !st.done.FWIDE) { type = 'F_WIDE'; side = w.units[e.a].side; st.done.FWIDE = true; }
    if (!type || st.fbUsed >= 6) return;
    if (w.t - st.lastAlertT < 2.5 || w.t - st.fbLast < 3) return;
    st.alerts.push({ t: w.t, type, side, fb: true }); st.fbUsed++; st.fbLast = w.t; st.lastAlertT = w.t;
  }
  function tick(w) {
    // new real events since last tick
    const newKOs = [];
    for (; st.evIdx < w.events.length; st.evIdx++) {
      const e = w.events[st.evIdx];
      const hw = HEAT[e.type]; if (hw && (e.x || e.y)) { st.heat.push({ t: e.t, x: e.x, y: e.y, w: hw }); }
      if (e.type === E.EV.KO) newKOs.push(e);
      v3Event(w, e);
      if (w.fb && e.type >= 40) fbEvent(w, e);
      if (e.type === E.EV.END) { const n = w.teams[e.a] ? w.teams[e.a].alive : 0; st.clutch = n >= 1 && n <= A.clutchMax; }
    }
    if (st.heat.length > 400 || (st.heat.length && w.t - st.heat[0].t > 2)) { let i = 0; while (i < st.heat.length && w.t - st.heat[i].t > 1.6) i++; if (i) st.heat.splice(0, i); }
    storyTick(w, newKOs);
    momentumTick(w);
    cameraTick(w);
  }
  tick.state = st;
  return tick;
}

// ======================= Smart Video Director (edit plan) =======================
function identityPlan(total) {
  return { style: 'original', outDur: total, simDur: total, map: o => Math.min(total, o), toOut: s => s, segments: [], highlights: 0, identity: true };
}
// Builds a monotonic output-time -> simulation-time mapping from the finished battle (events + alerts).
// Intro (0..2.2 s) and the final ~3 s + outro always play at 1.0x; only quiet blocks are sped up (1.25-2.3x).
function buildPlan(w, obsState, opt) {
  opt = opt || {};
  const total = w.endT + w.outroLen;
  if (opt.style === 'original') return identityPlan(total);
  const bs = E.TL.battleStart, protectEnd = w.endT - 3.0, BL = 1.0;
  const V = E.EV, W = { [V.KO]: 1, [V.CRIT]: 0.25, [V.SPECIAL]: 2.5, [V.SPECIAL_FIRE]: 1, [V.SAVE]: 0.6, [V.EXPLODE]: 1, [V.FINAL15]: 4, [V.FINAL5]: 4, [V.ZONE]: 1.5, [V.STORM]: 2, [V.SUDDEN]: 6, [V.ADAPT]: 0.5 };
  const nB = Math.max(0, Math.floor((protectEnd - bs) / BL));
  const slow0 = w.endT - 0.55, slow1 = w.endT + 0.02, epic = opt.epicFinale !== false; // last-hit slow motion (output only)
  if (nB < 3 && !epic) return Object.assign(identityPlan(total), { style: 'cinematic', note: 'battle too short to edit' });
  const score = new Float32Array(nB), forced = new Uint8Array(nB);
  for (const e of w.events) {
    if (e.t < bs || e.t >= bs + nB * BL) continue; const i = Math.floor((e.t - bs) / BL);
    score[i] += W[e.type] || 0;
    if (e.type === V.FINAL15 || e.type === V.FINAL5 || e.type === V.SUDDEN) forced[i] = 1;
    if (e.type === V.GOAL || e.type === V.SAVE_GOAL || e.type === V.POST) { forced[i] = 1; if (i > 0) forced[i - 1] = 1; score[i] += 6; } // goal + build-up at 1.0x
    else if (e.type === V.SHOT_ON_GOAL) score[i] += 2.5; else if (e.type === V.PASS_COMPLETE && e.c >= 3) score[i] += 2;
    else if (e.type === V.PASS_INTERCEPT) score[i] += 0.6; else if (e.type === V.BALL_GAIN && e.b === 1) score[i] += 0.5;
  }
  const alerts = (obsState && obsState.alerts) || [];
  for (const a of alerts) { if (a.t < bs) continue; const i = Math.floor((a.t - bs) / BL); if (i >= 0 && i < nB) { forced[i] = 1; score[i] += 3; } }
  forced[0] = 1; // FIGHT! banner + first steps at real speed
  // lead swings add drama
  const tl = (obsState && obsState.timeline) || [];
  for (let k = 1; k < tl.length; k++) { const i = Math.floor((tl[k][0] - bs) / BL); if (i < 0 || i >= nB) continue; score[i] += 0.15 * Math.abs((tl[k][1] - tl[k][2]) - (tl[k - 1][1] - tl[k - 1][2])); }
  // rank blocks by excitement (ties broken by time, deterministic)
  const order = Array.from({ length: nB }, (_, i) => i).sort((p, q) => score[p] - score[q] || p - q);
  const rank = new Float32Array(nB); order.forEach((b, r) => rank[b] = r / Math.max(1, nB - 1));
  // p in [0,1]: share of calm blocks (up to 60%) and their speed (1.6x .. 2.3x); the top 25% always stay 1.0x
  const tiersFor = (p) => {
    const calmF = 0.6 * p, medF = Math.min(0.75 - calmF, 0.2);
    const tier = new Uint8Array(nB);
    for (let i = 0; i < nB; i++) tier[i] = forced[i] || rank[i] >= 0.75 ? 2 : rank[i] < calmF ? 0 : rank[i] < calmF + medF ? 1 : 2;
    for (let i = nB - 1; i > 0; i--) if (tier[i] === 2 && tier[i - 1] === 0) tier[i - 1] = 1; // lead-in
    for (let pass = 0; pass < 3; pass++) { // runs shorter than 2 s inherit the more exciting neighbour
      let i = 0;
      while (i < nB) {
        let j = i; while (j + 1 < nB && tier[j + 1] === tier[i]) j++;
        if (j - i + 1 < 2) { const L = i > 0 ? tier[i - 1] : -1, R = j + 1 < nB ? tier[j + 1] : -1; const nt = Math.max(L, R); if (nt > tier[i]) for (let k = i; k <= j; k++) tier[k] = nt; }
        i = j + 1;
      }
    }
    return tier;
  };
  const speedsFor = p => [1.6 + 0.7 * p, 1.3, 1];
  let tier = null;
  const simulateMap = (p, keep) => {
    tier = tiersFor(p); const sp = speedsFor(p);
    const target = s => { if (epic && s >= slow0 && s < slow1) return 0.5; if (s < bs + 0.0001 || s >= bs + nB * BL) return 1; return sp[tier[Math.floor((s - bs) / BL)]]; };
    const dtO = 1 / 600; let o = 0, s = 0, v = 1; const k = 1 - Math.exp(-dtO / 0.18);
    const O = keep ? [0] : null, Sx = keep ? [0] : null;
    while (s < total) { v += (target(s) - v) * k; s = Math.min(total, s + v * dtO); o += dtO; if (keep) { O.push(o); Sx.push(s); } }
    return { outDur: o, O, S: Sx };
  };
  const natural = total;
  const goal = cl(natural * 0.72, 30, 45);
  let aggr = 0;
  if (natural > goal + 0.5) {
    if (simulateMap(1).outDur > goal) aggr = 1;
    else { let lo = 0, hi = 1; for (let it = 0; it < 18; it++) { const mid = (lo + hi) / 2; if (simulateMap(mid).outDur > goal) lo = mid; else hi = mid; } aggr = hi; }
  }
  if (aggr < 0.08 && !epic) return Object.assign(identityPlan(total), { style: 'cinematic', note: 'no speed-up needed' });
  if (aggr < 0.08) aggr = 0;
  let m = simulateMap(aggr, true);
  if (m.outDur > 65) { opt = Object.assign({}, opt, { epicFinale: false }); return buildPlan(w, obsState, opt); } // never exceed the 65 s cap
  const sp = speedsFor(aggr);
  const O = Float64Array.from(m.O), S = Float64Array.from(m.S), n = O.length, dtO = 1 / 600;
  const map = (o) => { if (o <= 0) return 0; const f = o / dtO, i = Math.floor(f); if (i >= n - 1) return S[n - 1]; return S[i] + (S[i + 1] - S[i]) * (f - i); };
  const toOut = (s) => { if (s <= 0) return 0; if (s >= S[n - 1]) return O[n - 1] + (s - S[n - 1]); let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S[mid] < s) lo = mid; else hi = mid; } const ds = S[hi] - S[lo]; return O[lo] + (ds > 0 ? (s - S[lo]) / ds : 0) * (O[hi] - O[lo]); };
  // segment summary (sim time) for the UI
  const segments = []; let i = 0;
  while (i < nB) { let j = i; while (j + 1 < nB && tier[j + 1] === tier[i]) j++; segments.push({ from: bs + i * BL, to: bs + (j + 1) * BL, speed: +sp[tier[i]].toFixed(2), exciting: tier[i] === 2 }); i = j + 1; }
  const highlights = segments.filter(g => g.exciting).length;
  return { style: 'cinematic', outDur: O[n - 1], simDur: total, map, toOut, segments, highlights, aggr, identity: false };
}

root.FWDirector = { createObserver, buildPlan, identityPlan, ALERT_CFG, ALERT_TXT, CAM_CFG, PRIO };
if (typeof module !== 'undefined' && module.exports) module.exports = root.FWDirector;
})(typeof window !== 'undefined' ? window : globalThis);
