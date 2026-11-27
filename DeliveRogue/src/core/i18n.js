// core/i18n.js — key-based text lookup (Phase 01: TR source locale only; EN/DE/FR/ES/PT-BR in Phase 14).
import tr from '../locales/tr.js';

/* ------------------------- Text (TR) -------------------------- */
export const LANG = 'tr';
export const STR = { tr };
/** Translate key with {0}.. placeholders. Falls back to the key itself. */
export function T(key, ...a) { let s = STR[LANG][key]; if (s === undefined) s = key; if (typeof s === 'string') a.forEach((v, i) => { s = s.split('{' + i + '}').join(v); }); return s; }
