// Telegraf isabet geometrisi — istemcideki çizimle aynı (src/entities/Enemy.js: inTelegraphCircle, pointInBeam; koni ±60°).
import { TG_SQUASH } from '../../src/data/constants.js';

export function inCircle(px, py, cx, cy, r) {
  const dx = (px - cx) / r, dy = (py - cy) / (r * TG_SQUASH);
  return dx * dx + dy * dy <= 1;
}

export function inBeam(px, py, ox, oy, ang, len, w) {
  const dx = px - ox, dy = py - oy;
  const along = dx * Math.cos(ang) + dy * Math.sin(ang);
  const perp = -dx * Math.sin(ang) + dy * Math.cos(ang);
  return along >= -8 && along <= len && Math.abs(perp) <= w / 2 + 6;
}

export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function inCone(px, py, ox, oy, ang, r, half = Math.PI / 3) {
  const dx = px - ox, dy = py - oy;
  return Math.hypot(dx, dy) <= r && Math.abs(wrapAngle(Math.atan2(dy, dx) - ang)) <= half;
}
