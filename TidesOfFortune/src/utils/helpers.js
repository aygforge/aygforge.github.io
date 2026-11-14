export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function whereMatches(where, region, type) {
  if (!where || !where.length) return false;
  return where.some((e) => (!e.regions || e.regions.includes(region)) && (!e.types || e.types.includes(type)));
}

export function fmtGold(n) {
  return `${Math.round(n)}`;
}

export function signed(n) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function uniq(arr) {
  return [...new Set(arr)];
}

export function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}
