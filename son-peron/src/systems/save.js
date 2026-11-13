// Sürümlü kayıt: serileştirme, doğrulama, JSON dışa/içe aktarım (depolama katmanı ui/storage.js).
import { SAVE_VERSION } from '../data/supplement.js';

export const SAVE_MAGIC = 'son-peron-save';
export function serialize(sim) { return JSON.stringify({ magic: SAVE_MAGIC, version: SAVE_VERSION, savedAt: Date.now(), state: sim.s }); }
// Hatalı/eski/bozuk kayıt istisna fırlatmaz; {ok:false, error} döner
export function parse(text) {
  let obj;
  try { obj = typeof text === 'string' ? JSON.parse(text) : text; } catch { return { ok: false, error: 'Kayıt dosyası okunamadı (bozuk JSON).' }; }
  if (!obj || obj.magic !== SAVE_MAGIC) return { ok: false, error: 'Bu dosya bir Son Peron kaydı değil.' };
  if (typeof obj.version !== 'number' || obj.version > SAVE_VERSION) return { ok: false, error: `Kayıt sürümü (${obj.version}) bu oyun sürümünden yeni; yüklenemiyor.` };
  if (obj.version < 1) return { ok: false, error: 'Kayıt sürümü çok eski; desteklenmiyor.' };
  const s = obj.state; const need = ['day', 'minute', 'gold', 'player', 'furniture', 'batches', 'quests', 'depot', 'tx', 'groups', 'customers', 'orders', 'staff', 'today'];
  if (!s || typeof s !== 'object') return { ok: false, error: 'Kayıt içeriği eksik.' };
  for (const k of need) if (!(k in s)) return { ok: false, error: `Kayıt içeriği eksik: ${k}` };
  if (!Number.isFinite(s.gold) || s.gold < 0 || !Number.isFinite(s.day) || !Array.isArray(s.player.inv)) return { ok: false, error: 'Kayıt içeriği tutarsız.' };
  return { ok: true, state: migrate(s, obj.version), savedAt: obj.savedAt };
}
function migrate(s) { s.version = SAVE_VERSION; return s; }
export function summary(state) { return { name: state.player.name, day: state.day, gold: state.gold, stage: state.stage }; }
