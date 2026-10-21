// Derin Ocak koşu durumu. Giriş sınırsız; enerji/bilet yok.
// - Ölüm: en yakın kontrol noktası, boss sıfırlanır, temizlenen bölümler korunur
// - Gönüllü çıkış: koşu biter
// - İstemsiz kapanma: kayıtlı koşu ve kontrol noktasından devam
// - Bir koşuda boss loot'u yalnız bir kez
import { makeUid } from '../core/rng.js';

export function canEnterDungeon(char) {
  if (!char.world.dungeonUnlocked) return { ok: false, msg: 'Derin Ocak mühürlü. "Mührün Gücü" görevini tamamla.' };
  return { ok: true };
}

export function startOrResumeRun(char) {
  if (char.dungeon && !char.dungeon.finished) return { resumed: true, run: char.dungeon };
  char.dungeon = { runId: makeUid('run'), cleared: [], bossLootClaimed: false, bossKilled: false, startedAt: Date.now(), finished: false };
  return { resumed: false, run: char.dungeon };
}

export function clearStage(char, stage) {
  const d = char.dungeon;
  if (!d || d.cleared.includes(stage)) return false;
  d.cleared.push(stage);
  d.cleared.sort((a, b) => a - b);
  return true;
}

export function currentStage(char) {
  const d = char.dungeon;
  if (!d) return 1;
  for (let s = 1; s <= 4; s++) if (!d.cleared.includes(s)) return s;
  return 5;
}

// Ölümde dönülecek giriş noktası
export function respawnEntry(char) {
  const d = char.dungeon;
  if (!d) return 'entrance';
  if (d.cleared.includes(3)) return 'checkpoint';
  if (d.cleared.includes(2)) return 'cp2';
  if (d.cleared.includes(1)) return 'cp1';
  return 'entrance';
}

export function bossKillId(char) {
  return `mine_golem:${char.dungeon?.runId}`;
}

// Boss loot talebi: true dönerse çekiliş yapılabilir
export function claimBossLoot(char) {
  const d = char.dungeon;
  if (!d || d.bossLootClaimed) return false;
  d.bossLootClaimed = true;
  d.bossKilled = true;
  return true;
}

export function exitRun(char) {
  char.dungeon = null;
}
