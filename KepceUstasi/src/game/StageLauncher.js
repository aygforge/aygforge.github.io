// StageLauncher — kampanya level'ı başlatmanın TEK yolu: kilit kontrolü, enerji düşümü (runId başına bir kez),
// kalıcı yazım, sahne geçişi. Kayıttan devam (snapshot) bu yoldan geçmez, bu yüzden ikinci kez enerji düşmez.
import { app } from './AppState.js';
import { stageByLevel } from '../data/stages.js';
import { isStageUnlocked } from '../systems/Progression.js';
import { debitForRun } from '../systems/EnergyService.js';

export function newRunId(tag) {
  return `${Date.now().toString(36)}-${tag}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function launchLevel(scene, level) {
  const stage = stageByLevel(level);
  if (!stage || !isStageUnlocked(app.save, level)) return { ok: false, reason: 'locked' };
  const runId = newRunId(stage.id);
  const r = debitForRun(app.save.energy, runId, Date.now(), stage.energyCost);
  if (!r.ok) return r;
  app.save.activeRun = null; // a new order replaces an old wave checkpoint (its energy was already spent)
  app.persist(); // energy debit is committed before the run starts
  scene.scene.start('Game', { chapterId: stage.id, runId });
  return { ok: true, charged: r.charged };
}

// Alpha 0.4B dungeons: same engine/scene, same energy rule (10, once per runId), unlocked by the campaign.
import { dungeonById } from '../data/stages.js';
import { isDungeonUnlocked } from '../systems/Progression.js';

export function launchDungeon(scene, id) {
  const dg = dungeonById(id);
  if (!dg || !isDungeonUnlocked(app.save, dg)) return { ok: false, reason: 'locked' };
  const runId = newRunId(dg.id);
  const r = debitForRun(app.save.energy, runId, Date.now(), dg.energyCost);
  if (!r.ok) return r;
  app.save.activeRun = null;
  app.persist();
  scene.scene.start('Game', { chapterId: dg.id, runId });
  return { ok: true, charged: r.charged };
}
