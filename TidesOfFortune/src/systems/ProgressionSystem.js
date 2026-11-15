// Meta ilerleme: XP, kalıcı upgrade'ler, başarımlar, Codex, run sonu aktarımı.
import { BALANCE } from '../config/balance.js';
import { UPGRADES, UPGRADE_BY_ID } from '../data/upgrades.js';
import { ACHIEVEMENT_BY_ID } from '../data/achievements.js';
import { HARBOR_BY_ID, HARBOR_TYPES } from '../data/harbors.js';
import { hasUpgrade } from '../core/GameState.js';
import { endlessScore } from './X1System.js';
import { EVENT_BY_ID } from '../data/events.js';

/** Run XP'si ekler (çarpanlarla). Negatif değer XP'yi azaltır (en az 0). */
export function addXp(G, amount, source = 'other', { atGrandHarbor = false } = {}) {
  const run = G.run;
  if (!amount) return 0;
  let v = amount;
  if (v > 0) {
    let mult = 1;
    if (run.crew.includes('CREW_SOLARA')) mult += BALANCE.xp.solaraBonus;
    if (hasUpgrade(G.meta, 'UPG_SUN_GRACE')) mult += BALANCE.xp.sunGraceBonus;
    if (source === 'exploration' && hasUpgrade(G.meta, 'UPG_EXPLORER')) mult += BALANCE.xp.explorerSpiritBonus;
    v = amount * mult;
    if (atGrandHarbor) v *= BALANCE.xp.grandHarborMult;
    v = Math.round(v);
  } else {
    v = -Math.min(run.xp.total, Math.round(-amount));
  }
  run.xp.total += v;
  run.xp.sources[source] = (run.xp.sources[source] || 0) + v;
  return v;
}

export function unlockAchievement(G, id) {
  if (!ACHIEVEMENT_BY_ID[id]) return false;
  if (G.meta.achievements.includes(id)) {
    return false;
  }
  G.meta.achievements.push(id);
  if (G.run && !G.run.newAchievements.includes(id)) G.run.newAchievements.push(id);
  G.pendingToasts = G.pendingToasts || [];
  G.pendingToasts.push({ kind: 'achievement', id });
  return true;
}

/** Limana varışta Codex güncellemesi + ilk kez keşfedilen liman tipi XP'si */
export function discoverHarbor(G, harborId) {
  const h = HARBOR_BY_ID[harborId];
  const codex = G.meta.codex;
  const lines = [];
  codex.harbors[harborId] = true;
  if (!codex.harborTypes[h.type]) {
    codex.harborTypes[h.type] = true;
    const xp = addXp(G, BALANCE.xp.newHarborType, 'discovery');
    lines.push({ kind: 'xp', text: `Yeni liman tipi keşfedildi: ${HARBOR_TYPES[h.type].name} (+${xp} XP)` });
  }
  if (Object.keys(codex.harborTypes).length >= Object.keys(HARBOR_TYPES).length) unlockAchievement(G, 'ACH_ALL_TYPES');
  if (h.region === 5) unlockAchievement(G, 'ACH_EXPLORER');
  return lines;
}

export function upgradeVisible(meta, u) {
  if (u.needsSolara) return meta.solaraHired;
  return true;
}

/** Deniz Efsaneleri dalı açma koşulları (Codex'te 5 gizem eventi; Avcı için ayrıca bir gizemli zincir) */
export function legendStatus(meta) {
  const mysteries = Object.keys(meta.codex.events || {}).filter((id) => EVENT_BY_ID[id]?.cat === 'mystery').length;
  const chains = Object.keys(meta.x1?.mysteryChains || {}).length;
  return { mysteries, chains };
}

export function canBuyUpgrade(meta, id) {
  const u = UPGRADE_BY_ID[id];
  if (!u) return { ok: false, reason: 'Bilinmeyen upgrade.' };
  if (meta.upgrades.includes(id)) return { ok: false, reason: 'Zaten alındı.' };
  if (!upgradeVisible(meta, u)) return { ok: false, reason: 'Gizli dal kilitli.' };
  if (u.needsSolara && !meta.solaraHired) return { ok: false, reason: 'Solara en az bir kez işe alınmış olmalı.' };
  if (u.req && !meta.upgrades.includes(u.req)) return { ok: false, reason: `Önkoşul: ${UPGRADE_BY_ID[u.req].name}` };
  if (u.needMysteries && legendStatus(meta).mysteries < u.needMysteries) return { ok: false, reason: `Codex'te ${u.needMysteries} farklı gizem eventi keşfetmelisin (${legendStatus(meta).mysteries}/${u.needMysteries}).` };
  if (u.needMysteryChain && legendStatus(meta).chains < 1) return { ok: false, reason: 'En az bir gizemli hikâye zincirini tamamlamalısın.' };
  if (meta.activeEndless) return { ok: false, reason: 'Sonsuz Deniz seferi sürerken yeni yükseltme alınamaz; sefer bitince al.' };
  if (meta.xpAvailable < u.cost) return { ok: false, reason: `Yetersiz XP (${u.cost} gerekli).` };
  return { ok: true };
}

export function buyUpgrade(meta, id) {
  const chk = canBuyUpgrade(meta, id);
  if (!chk.ok) return chk;
  const u = UPGRADE_BY_ID[id];
  meta.xpAvailable -= u.cost;
  meta.xpSpent += u.cost;
  meta.upgrades.push(id);
  return { ok: true };
}

/** Run'ı bitirir ve XP'yi kalıcı hesaba aktarır (tek sefer). */
export function finalizeRun(G, result) {
  const run = G.run;
  if (run.xpTransferred) return;
  run.ended = true;
  run.result = result;
  const e = run.x1?.endless;
  const m0 = G.meta;
  if (e && e.on) {
    // Sonsuz Deniz bitişi: Büyük Liman başarısı zaten bir kez verildi; tekrar verilmez, run istatistiği bir kez eklenir.
    const safe = result === 'endless_safe';
    e.score = endlessScore(run, safe);
    const rec = m0.x1.records;
    rec.bestScore = Math.max(rec.bestScore, e.score);
    rec.longestHarbors = Math.max(rec.longestHarbors, run.stats.harborsReached);
    rec.mostContracts = Math.max(rec.mostContracts, run.x1.contractsDone);
    rec.bestProfit = Math.max(rec.bestProfit, Math.round(run.stats.profit || 0));
    rec.mostChains = Math.max(rec.mostChains, run.stats.chainsCompleted || 0);
    if (safe) rec.endlessSafe += 1;
    else rec.endlessSunk += 1;
    if (result === 'sunk' || result === 'endless_sunk') unlockAchievement(G, 'ACH_SUNK');
  } else if (result === 'complete') {
    addXp(G, BALANCE.xp.runComplete, 'complete');
    unlockAchievement(G, 'ACH_GRAND_HARBOR');
  } else if (result === 'sunk') {
    unlockAchievement(G, 'ACH_SUNK');
  }
  const m = G.meta;
  m.xpAvailable += run.xp.total;
  m.xpTotalEarned += run.xp.total;
  m.stats.runs += 1;
  if (result === 'complete') m.stats.completed += 1;
  else if (result === 'sunk' || result === 'endless_sunk') m.stats.sunk += 1;
  m.activeEndless = false;
  m.stats.bestHarbors = Math.max(m.stats.bestHarbors, run.stats.harborsReached);
  m.stats.totalGoldEarned += run.stats.goldEarned;
  m.stats.totalEvents += run.stats.eventsResolved;
  m.stats.bestGold = Math.max(m.stats.bestGold, run.stats.maxGold);
  run.xpTransferred = true;
  run.phase = 'ended';
}

export { UPGRADES };
