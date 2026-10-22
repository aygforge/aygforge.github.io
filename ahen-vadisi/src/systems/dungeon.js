// Zindan koşu durumu (Derin Ocak — V1, Buz Mabedi — V2). Giriş sınırsız; enerji/bilet yok.
// - Ölüm: en yakın kontrol noktası, boss sıfırlanır (tam can), temizlenen bölümler korunur
// - Gönüllü çıkış: koşu biter
// - İstemsiz kapanma: kayıtlı koşu ve kontrol noktasından devam
// - Bir koşuda boss loot'u yalnız bir kez
// Derin Ocak koşusu V1 kayıt uyumluluğu için char.dungeon'da, diğerleri char.runs[mapId]'de tutulur.
import { makeUid } from '../core/rng.js';

export const DUNGEON_INFO = {
  dungeon: { name: 'Derin Ocak', boss: 'mine_golem', gateGroup: 'dungeon_gate', lockMsg: 'Derin Ocak mühürlü. "Mührün Gücü" görevini tamamla.' },
  frost_temple: { name: 'Buz Mabedi', boss: 'frozen_guardian', gateGroup: 'frost_gate', lockMsg: 'Buz Mabedi mühürlü. "Buz Mabedinin Sırrı" görevini tamamla.', seals: 3 },
  dark_crypt: { name: 'Karanlık Mahzen', boss: 'lost_king', gateGroup: 'crypt_gate', lockMsg: 'Karanlık Mahzen mühürlü. "Karanlık Mahzene İniş" görevini al ve kapı mührünü etkinleştir.', seals: 5 },
};

export function isDungeonUnlocked(char, mapId = 'dungeon') {
  if (mapId === 'dungeon') return !!char.world.dungeonUnlocked;
  return !!char.world.flags?.[`unlocked_${mapId}`];
}

export function unlockDungeon(char, mapId = 'dungeon') {
  if (mapId === 'dungeon') { char.world.dungeonUnlocked = true; return; }
  char.world.flags = char.world.flags || {};
  char.world.flags[`unlocked_${mapId}`] = true;
}

export function canEnterDungeon(char, mapId = 'dungeon') {
  if (!isDungeonUnlocked(char, mapId)) return { ok: false, msg: DUNGEON_INFO[mapId].lockMsg };
  return { ok: true };
}

export function getRun(char, mapId = 'dungeon') {
  return mapId === 'dungeon' ? char.dungeon : (char.runs?.[mapId] || null);
}

function setRun(char, mapId, run) {
  if (mapId === 'dungeon') char.dungeon = run;
  else {
    char.runs = char.runs || {};
    if (run) char.runs[mapId] = run; else delete char.runs[mapId];
  }
}

export function startOrResumeRun(char, mapId = 'dungeon') {
  const cur = getRun(char, mapId);
  if (cur && !cur.finished) return { resumed: true, run: cur };
  const run = { runId: makeUid('run'), cleared: [], bossLootClaimed: false, bossKilled: false, startedAt: Date.now(), finished: false };
  if (DUNGEON_INFO[mapId]?.seals) run.seals = [];
  setRun(char, mapId, run);
  return { resumed: false, run };
}

export function clearStage(char, stage, mapId = 'dungeon') {
  const d = getRun(char, mapId);
  if (!d || d.cleared.includes(stage)) return false;
  d.cleared.push(stage);
  d.cleared.sort((a, b) => a - b);
  return true;
}

export function currentStage(char, mapId = 'dungeon') {
  const d = getRun(char, mapId);
  if (!d) return 1;
  for (let s = 1; s <= 4; s++) if (!d.cleared.includes(s)) return s;
  return 5;
}

// Mühür Galerisi: kırılan mühür kaydı (aynı mühür iki kez sayılmaz)
export function breakSeal(char, mapId, sealId) {
  const d = getRun(char, mapId);
  if (!d) return false;
  d.seals = d.seals || [];
  if (d.seals.includes(sealId)) return false;
  d.seals.push(sealId);
  return true;
}

export function sealsBroken(char, mapId) {
  return getRun(char, mapId)?.seals?.length || 0;
}

// Ölümde dönülecek giriş noktası
export function respawnEntry(char, mapId = 'dungeon') {
  const d = getRun(char, mapId);
  if (!d) return 'entrance';
  if (d.cleared.includes(3)) return 'checkpoint';
  if (d.cleared.includes(2)) return 'cp2';
  if (d.cleared.includes(1)) return 'cp1';
  return 'entrance';
}

export function bossKillId(char, mapId = 'dungeon') {
  return `${DUNGEON_INFO[mapId].boss}:${getRun(char, mapId)?.runId}`;
}

// Boss loot talebi: true dönerse çekiliş yapılabilir
export function claimBossLoot(char, mapId = 'dungeon') {
  const d = getRun(char, mapId);
  if (!d || d.bossLootClaimed) return false;
  d.bossLootClaimed = true;
  d.bossKilled = true;
  return true;
}

export function exitRun(char, mapId = 'dungeon') {
  setRun(char, mapId, null);
}

// Boss id → zindan haritası (combatRuntime boss ölümünde kullanır)
export function dungeonOfBoss(enemyId) {
  return Object.keys(DUNGEON_INFO).find((k) => DUNGEON_INFO[k].boss === enemyId) || null;
}
