// Club creation input validation (pure; shared by UI and tests). All text is later rendered escaped.
import { CREST_SHAPES, KIT_PATTERNS } from '../data/names.js';
export function validateClubInput(d) {
  const clean = s => String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
  const o = { name: clean(d.name), short: clean(d.short).toUpperCase(), city: clean(d.city), stadium: clean(d.stadium), primary: d.primary, secondary: d.secondary, pattern: d.pattern, crest: d.crest };
  if (o.name.length < 3 || o.name.length > 28) return { ok: false, reason: 'Club name must be 3–28 characters.' };
  if (!/^[\p{L}\p{N} .,'&-]+$/u.test(o.name)) return { ok: false, reason: 'Club name: letters, numbers, spaces and . , \' & - only.' };
  if (!/^[\p{L}\p{N}]{2,4}$/u.test(o.short)) return { ok: false, reason: 'Short name must be 2–4 letters/numbers.' };
  if (o.city.length < 2 || o.city.length > 20 || !/^[\p{L}\p{N} .'-]+$/u.test(o.city)) return { ok: false, reason: 'City must be 2–20 characters.' };
  if (!o.stadium) o.stadium = o.city + ' Ground';
  if (o.stadium.length > 28 || !/^[\p{L}\p{N} .,'&-]+$/u.test(o.stadium)) return { ok: false, reason: 'Stadium name must be up to 28 characters.' };
  if (!/^#[0-9a-f]{6}$/i.test(o.primary) || !/^#[0-9a-f]{6}$/i.test(o.secondary)) return { ok: false, reason: 'Invalid colours.' };
  if (o.primary.toLowerCase() === o.secondary.toLowerCase()) return { ok: false, reason: 'Pick two different kit colours.' };
  if (!KIT_PATTERNS.includes(o.pattern) || !CREST_SHAPES.includes(o.crest)) return { ok: false, reason: 'Invalid kit/crest.' };
  return { ok: true, value: o };
}
