// Turkish is the primary language. English is prepared for a later release (partial).
import tr from './tr.json';
import en from './en.json';
const DICTS = { tr, en };
let lang = 'tr';
export function setLang(l) { lang = DICTS[l] ? l : 'tr'; }
export function t(key) { return DICTS[lang][key] ?? tr[key] ?? key; }
