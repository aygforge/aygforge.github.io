// platform/Haptics.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Save } from '../core/SaveManager.js';

export const Haptic = { buzz(ms) { try { if (Save.data.settings.vibe && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} } };
