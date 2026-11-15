import { DANGER_EVENTS, FORTUNE_EVENTS, MYSTERY_EVENTS, DISASTER_EVENTS, REPAIR_EVENTS } from './events_core.js';
import { CHAIN_EVENTS, CHAINS as BASE_CHAINS } from './eventChains.js';
import { X1_EVENTS } from './events_x1.js';
import { X1_CHAINS, X1_CHAIN_EVENTS } from './chains_x1.js';

const CHAINS = { ...BASE_CHAINS, ...X1_CHAINS };
import { SPECIAL_EVENTS, CREW_EVENTS, PET_EVENTS } from './events_special.js';

export { CHAINS };

export const EVENT_CATEGORIES = {
  danger: { name: 'Tehlike', color: '#d9534f' },
  fortune: { name: 'Şans', color: '#e8b94a' },
  mystery: { name: 'Gizem', color: '#a56de2' },
  disaster: { name: 'Felaket', color: '#ff6a2a' },
  repair: { name: 'Tamir', color: '#5cb85c' },
  chain: { name: 'Zincir', color: '#4fa3e0' },
  special: { name: 'Özel', color: '#ffd76a' },
  pet: { name: 'Hayvan', color: '#f0a060' },
};

export const ALL_EVENTS = [
  ...DANGER_EVENTS, ...FORTUNE_EVENTS, ...MYSTERY_EVENTS, ...DISASTER_EVENTS, ...REPAIR_EVENTS,
  ...CHAIN_EVENTS, ...SPECIAL_EVENTS, ...CREW_EVENTS, ...PET_EVENTS,
  ...X1_EVENTS, ...X1_CHAIN_EVENTS,
];

export const EVENT_BY_ID = Object.fromEntries(ALL_EVENTS.map((e) => [e.id, e]));

/** Normal havuzdan seçilebilir eventler (zincir düğümleri hariç; zincirin ilk adımı olan EVT_M_11 dahil) */
export const POOL_EVENTS = ALL_EVENTS.filter((e) => e.pool !== false && (e.cat !== 'chain'));

/** Codex'te sayılan eventler (zincir alt adımları ayrı sayılmaz) */
export const CODEX_EVENTS = ALL_EVENTS.filter((e) => e.cat !== 'chain' || e.step === 1);
